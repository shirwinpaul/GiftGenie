import type { z } from "zod";
import { AI_CONFIG } from "@/config/ai";
import { describeZodError } from "@/lib/schemas";
import { AIError, type ProviderName } from "./errors";
import type { AIProvider } from "./types";

export interface RunOptions<T> {
  system: string;
  user: string;
  maxTokens: number;
  schema: z.ZodType<T>;
  /**
   * Extra rule check after the schema passes (e.g. "at least 2 DIY ideas").
   * A problem triggers ONE corrective retry; if it still fails, the data is accepted.
   */
  check?: (data: T) => string | null;
}

export interface RunDeps {
  primary: AIProvider | null;
  fallback: AIProvider | null;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  log?: (entry: LogEntry) => void;
}

/** Only technical facts are logged — never keys or user inputs. */
export interface LogEntry {
  provider: ProviderName;
  status?: number;
  errorType: string;
  retryAfter?: number;
}

export type RunResult<T> =
  | { ok: true; data: T; provider: ProviderName }
  | { ok: false; errors: AIError[] };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const defaultLog = (entry: LogEntry) => console.warn("[ai]", JSON.stringify(entry));

/** Pull the first JSON object out of a model reply (tolerates ```json fences). */
export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new SyntaxError("No JSON object found");
  }
}

/**
 * One user action → at most: Gemini (+1 retry) then Groq (+1 retry).
 * - Gemini 429 with a short retry-after (≤ ~10s): wait, retry once, else fall back.
 * - 5xx / timeout / daily quota: fall back to Groq.
 * - Invalid JSON or schema failure: retry once with the validation error appended, then fall back.
 */
export async function runWithFallback<T>(opts: RunOptions<T>, deps: RunDeps): Promise<RunResult<T>> {
  const sleep = deps.sleep ?? defaultSleep;
  const now = deps.now ?? Date.now;
  const log = deps.log ?? defaultLog;
  const deadline = now() + AI_CONFIG.requestDeadlineMs;
  const errors: AIError[] = [];

  const providers: [AIProvider, boolean][] = [];
  if (deps.primary) providers.push([deps.primary, true]);
  if (deps.fallback) providers.push([deps.fallback, false]);

  for (const [provider, isPrimary] of providers) {
    try {
      const data = await attempt(provider, isPrimary);
      return { ok: true, data, provider: provider.name };
    } catch (e) {
      const err = e instanceof AIError ? e : new AIError("unknown", provider.name);
      errors.push(err);
      log({ provider: err.provider, status: err.status, errorType: err.kind, retryAfter: err.retryAfterSec });
    }
  }
  return { ok: false, errors };

  async function attempt(provider: AIProvider, isPrimary: boolean): Promise<T> {
    let user = opts.user;
    let waitedForRateLimit = false;
    let correctedOnce = false;

    for (;;) {
      const remaining = deadline - now();
      if (remaining < 2_000) throw new AIError("timeout", provider.name, { message: "deadline reached" });
      const timeoutMs = Math.min(
        provider.name === "groq" ? AI_CONFIG.groq.timeoutMs : AI_CONFIG.gemini.timeoutMs,
        remaining,
      );

      let text: string;
      try {
        text = await provider.generate({ system: opts.system, user, maxTokens: opts.maxTokens, timeoutMs });
      } catch (e) {
        const err = e instanceof AIError ? e : new AIError("unknown", provider.name);
        const waitMs = (err.retryAfterSec ?? Infinity) * 1000;
        const canWait =
          isPrimary &&
          err.kind === "rate_limit" &&
          !waitedForRateLimit &&
          waitMs <= AI_CONFIG.gemini.maxRetryAfterWaitMs &&
          deadline - now() - waitMs > 5_000;
        if (canWait) {
          log({ provider: err.provider, status: err.status, errorType: "rate_limit_wait", retryAfter: err.retryAfterSec });
          waitedForRateLimit = true;
          await sleep(waitMs);
          continue;
        }
        throw err;
      }

      // Validate: JSON → schema → mode rules.
      let problem: string;
      let parsedData: T | undefined;
      try {
        const result = opts.schema.safeParse(extractJson(text));
        if (result.success) {
          parsedData = result.data;
          const ruleProblem = opts.check?.(result.data) ?? null;
          if (!ruleProblem) return result.data;
          problem = ruleProblem;
        } else {
          problem = describeZodError(result.error);
        }
      } catch {
        problem = "the reply was not valid JSON";
      }

      if (!correctedOnce) {
        correctedOnce = true;
        log({ provider: provider.name, errorType: "validation_retry" });
        user = `${opts.user}\n\nYour previous reply was rejected: ${problem}. Reply again with ONLY a valid JSON object in the required format.`;
        continue;
      }
      // Schema passed but a soft rule still fails: accept (code post-processing still applies).
      if (parsedData !== undefined) return parsedData;
      throw new AIError("invalid_output", provider.name);
    }
  }
}

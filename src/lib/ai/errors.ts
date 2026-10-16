export type ProviderName = "gemini" | "groq" | "mock";

export type AIErrorKind =
  | "rate_limit" // per-minute limit, usually with retry-after
  | "daily_quota" // free daily quota used up
  | "server" // 5xx or network failure
  | "timeout"
  | "invalid_output" // not valid JSON / failed validation after a retry
  | "auth" // bad or missing key
  | "bad_request"
  | "unknown";

export class AIError extends Error {
  readonly kind: AIErrorKind;
  readonly provider: ProviderName;
  readonly status?: number;
  /** Seconds the provider asked us to wait (retry-after). */
  readonly retryAfterSec?: number;

  constructor(
    kind: AIErrorKind,
    provider: ProviderName,
    opts: { status?: number; retryAfterSec?: number; message?: string } = {},
  ) {
    super(opts.message ?? `${provider} ${kind}`);
    this.name = "AIError";
    this.kind = kind;
    this.provider = provider;
    this.status = opts.status;
    this.retryAfterSec = opts.retryAfterSec;
  }
}

/** Parse an HTTP Retry-After header: seconds ("7") or an HTTP date. */
export function parseRetryAfterHeader(value: string | null | undefined, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return Math.max(0, Math.ceil(Number(trimmed)));
  const date = Date.parse(trimmed);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - now) / 1000));
}

/**
 * Gemini puts the wait time in the error body, e.g. `"retryDelay": "7s"` or
 * "Please retry in 6.3s". Returns whole seconds.
 */
export function parseGeminiRetryDelay(message: string): number | undefined {
  const m =
    message.match(/retryDelay"?\s*[:=]\s*"?(\d+(?:\.\d+)?)s/i) ?? message.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  return m ? Math.ceil(Number(m[1])) : undefined;
}

/** Message codes the browser understands (see src/lib/apiClient.ts). */
export type UserErrorCode =
  | "RATE_LIMIT"
  | "DAILY_QUOTA"
  | "TOO_MANY_REQUESTS"
  | "BAD_KEY"
  | "NOT_CONFIGURED"
  | "INVALID_INPUT"
  | "AI_UNAVAILABLE";

export interface UserError {
  code: UserErrorCode;
  message: string;
  retryAfter?: number;
}

export const USER_MESSAGES: Record<UserErrorCode, string> = {
  RATE_LIMIT: "The genie needs a moment — try again in a few seconds.",
  DAILY_QUOTA:
    "Today's free AI limit is reached. Add your own free Gemini key in Settings, or come back tomorrow.",
  TOO_MANY_REQUESTS: "You've made a lot of requests. The genie needs a moment — try again soon.",
  BAD_KEY: "Your Gemini key didn't work. Please check it in Settings (or remove it to use the shared key).",
  NOT_CONFIGURED: "The AI isn't set up yet. Add a Gemini or Groq key to .env.local (see README).",
  INVALID_INPUT: "Some answers look incomplete. Please check them and try again.",
  AI_UNAVAILABLE: "The genie is having trouble right now. Please try again in a minute.",
};

/** Turn the list of provider failures into one friendly message for the user. */
export function toUserError(errors: AIError[], opts: { usedByok: boolean }): UserError {
  if (errors.length === 0) return { code: "NOT_CONFIGURED", message: USER_MESSAGES.NOT_CONFIGURED };

  const gemini = errors.find((e) => e.provider === "gemini");
  if (opts.usedByok && gemini?.kind === "auth") return { code: "BAD_KEY", message: USER_MESSAGES.BAD_KEY };

  const quotaKinds = errors.every((e) => e.kind === "rate_limit" || e.kind === "daily_quota");
  if (quotaKinds) {
    const waits = errors
      .filter((e) => e.kind === "rate_limit")
      .map((e) => e.retryAfterSec ?? 30);
    if (waits.length > 0) {
      // The soonest any provider frees up.
      const retryAfter = Math.min(120, Math.max(1, Math.min(...waits)));
      return { code: "RATE_LIMIT", message: USER_MESSAGES.RATE_LIMIT, retryAfter };
    }
    return { code: "DAILY_QUOTA", message: USER_MESSAGES.DAILY_QUOTA };
  }

  // Mixed failures: if the only "real" failure is a missing fallback key, still report quota.
  if (errors.some((e) => e.kind === "daily_quota") && errors.every((e) => e.kind !== "server" && e.kind !== "timeout")) {
    return { code: "DAILY_QUOTA", message: USER_MESSAGES.DAILY_QUOTA };
  }
  return { code: "AI_UNAVAILABLE", message: USER_MESSAGES.AI_UNAVAILABLE };
}

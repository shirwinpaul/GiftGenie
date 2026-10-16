import { AI_CONFIG } from "@/config/ai";
import { AIError, parseRetryAfterHeader } from "./errors";
import { estimateTokens, TokenWindow } from "./tokens";
import type { AIProvider } from "./types";

const cfg = AI_CONFIG.groq;

/** Shared across requests on this server instance (best-effort on serverless). */
export const groqTokenWindow = new TokenWindow(cfg.tokensPerMinute);

/** Fallback provider: Groq (OpenAI-compatible chat completions API). */
export function createGroqProvider(
  apiKey: string,
  deps: { fetchImpl?: typeof fetch; tokenWindow?: TokenWindow; now?: () => number } = {},
): AIProvider {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const window = deps.tokenWindow ?? groqTokenWindow;
  const now = deps.now ?? Date.now;

  return {
    name: "groq",
    async generate({ system, user, maxTokens, timeoutMs }) {
      // Keep input + output inside the free-tier tokens-per-minute limit.
      const inputTokens = estimateTokens(system) + estimateTokens(user) + 20;
      const outputTokens = Math.min(maxTokens, cfg.tokensPerMinute - inputTokens);
      if (outputTokens < 300) {
        throw new AIError("bad_request", "groq", { message: "request too large for Groq free tier" });
      }
      const reservation = window.reserve(inputTokens + outputTokens, now());
      if (!reservation.ok) {
        throw new AIError("rate_limit", "groq", { retryAfterSec: reservation.retryAfterSec });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetchImpl(cfg.endpoint, {
          method: "POST",
          signal: controller.signal,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: cfg.model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: cfg.temperature,
            max_completion_tokens: outputTokens,
            reasoning_effort: cfg.reasoningEffort,
            response_format: { type: "json_object" },
          }),
        });

        if (!res.ok) {
          const bodyText = await res.text().catch(() => "");
          if (res.status === 429) {
            if (/per day|\(RPD\)|\(TPD\)/i.test(bodyText)) throw new AIError("daily_quota", "groq", { status: 429 });
            throw new AIError("rate_limit", "groq", {
              status: 429,
              retryAfterSec: parseRetryAfterHeader(res.headers.get("retry-after")),
            });
          }
          if (res.status === 401 || res.status === 403) throw new AIError("auth", "groq", { status: res.status });
          if (res.status >= 500) throw new AIError("server", "groq", { status: res.status });
          throw new AIError("bad_request", "groq", { status: res.status });
        }

        const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
        const text = json.choices?.[0]?.message?.content;
        if (!text) throw new AIError("invalid_output", "groq", { message: "empty response" });
        return text;
      } catch (e) {
        if (e instanceof AIError) throw e;
        if (controller.signal.aborted) throw new AIError("timeout", "groq");
        throw new AIError("server", "groq");
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

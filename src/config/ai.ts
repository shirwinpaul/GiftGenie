/**
 * ALL AI provider settings live in this one file.
 *
 * Model IDs checked against the official docs (October 2026):
 * - Gemini: https://ai.google.dev/gemini-api/docs/models  (+ /pricing for the free tier)
 * - Groq:   https://console.groq.com/docs/models  (+ /docs/rate-limits)
 * If a provider retires a model, change the ID here only.
 */
export const AI_CONFIG = {
  gemini: {
    /** Flash-class model with a free tier. */
    model: "gemini-3.6-flash",
    /** Keep "thinking" tokens as low as possible (they count toward output tokens). */
    thinkingLevel: "MINIMAL",
    temperature: 0.9,
    timeoutMs: 30_000,
    /** On a 429 we wait for retry-after only if it is this short, then retry once. */
    maxRetryAfterWaitMs: 10_000,
  },
  groq: {
    model: "openai/gpt-oss-120b",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    /** Free-tier tokens-per-minute limit for the model above. */
    tokensPerMinute: 8_000,
    /** This model "reasons" before answering; keep that short. */
    reasoningEffort: "low",
    temperature: 0.9,
    timeoutMs: 30_000,
  },
  /** Output-token caps per call type (keeps quota usage predictable). */
  maxOutputTokens: {
    ideas: 3_000,
    more: 1_800,
    // Tamil/Hindi scripts use many more tokens per word than English.
    card: 1_200,
  },
  /**
   * Total time budget for one user action across all retries/fallbacks.
   * Must stay below the route's `maxDuration` (60s, allowed on Vercel Hobby).
   */
  requestDeadlineMs: 55_000,
  /** Best-effort per-IP limit for AI routes (in-memory; see README). */
  rateLimit: {
    maxCalls: 40,
    windowMs: 60 * 60 * 1000,
  },
  /** Values that mean "no real key was pasted yet". */
  placeholderKeys: ["PASTE_YOUR_GEMINI_KEY_HERE", "PASTE_YOUR_GROQ_KEY_HERE", ""],
} as const;

/** Header used by the browser to send a user's own Gemini key (BYOK). */
export const BYOK_HEADER = "x-gemini-key";

export function isRealKey(key: string | undefined | null): key is string {
  if (!key) return false;
  const trimmed = key.trim();
  return !(AI_CONFIG.placeholderKeys as readonly string[]).includes(trimmed);
}

/** Mock mode is a development-only switch. It is ignored in production builds. */
export function isMockMode(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.MOCK_AI === "true";
}

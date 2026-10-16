import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AI_CONFIG } from "@/config/ai";
import { AIError, parseGeminiRetryDelay } from "./errors";
import type { AIProvider } from "./types";

/** Primary provider: Google Gemini via the official Gen AI SDK. */
export function createGeminiProvider(apiKey: string): AIProvider {
  const client = new GoogleGenAI({ apiKey });
  const cfg = AI_CONFIG.gemini;

  return {
    name: "gemini",
    async generate({ system, user, maxTokens, timeoutMs }) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await client.models.generateContent({
          model: cfg.model,
          contents: user,
          config: {
            systemInstruction: system,
            maxOutputTokens: maxTokens,
            temperature: cfg.temperature,
            responseMimeType: "application/json",
            thinkingConfig: { thinkingLevel: ThinkingLevel[cfg.thinkingLevel] },
            abortSignal: controller.signal,
          },
        });
        const text = res.text;
        if (!text) throw new AIError("invalid_output", "gemini", { message: "empty response" });
        return text;
      } catch (e) {
        throw classifyGeminiError(e, controller.signal.aborted);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function classifyGeminiError(e: unknown, aborted = false): AIError {
  if (e instanceof AIError) return e;
  const err = e as { status?: number; message?: string; name?: string };
  const message = String(err?.message ?? "");
  if (aborted || err?.name === "AbortError") return new AIError("timeout", "gemini");

  const status = typeof err?.status === "number" ? err.status : undefined;
  if (status === 429) {
    // Daily quota errors mention a "PerDay" quota; per-minute ones carry a retry delay.
    if (/per ?day|daily/i.test(message)) return new AIError("daily_quota", "gemini", { status });
    return new AIError("rate_limit", "gemini", { status, retryAfterSec: parseGeminiRetryDelay(message) });
  }
  if (status === 401 || status === 403 || (status === 400 && /api[_ ]key/i.test(message))) {
    return new AIError("auth", "gemini", { status });
  }
  if (status !== undefined && status >= 500) return new AIError("server", "gemini", { status });
  if (status !== undefined && status >= 400) return new AIError("bad_request", "gemini", { status });
  // Network failures etc.
  return new AIError("server", "gemini");
}

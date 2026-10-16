import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { AIError, parseGeminiRetryDelay, parseRetryAfterHeader, toUserError } from "@/lib/ai/errors";
import { classifyGeminiError } from "@/lib/ai/gemini";
import { createGroqProvider } from "@/lib/ai/groq";
import { extractJson, runWithFallback, type RunDeps } from "@/lib/ai/run";
import { TokenWindow } from "@/lib/ai/tokens";
import type { AIProvider, GenerateRequest } from "@/lib/ai/types";
import { IdeasResponseSchema } from "@/lib/schemas";
import { ideasJson, makeIdea } from "./fixtures";

const schema = z.object({ answer: z.string() });
const good = JSON.stringify({ answer: "hello" });

/** A fake provider that plays back a script of results (string = reply, Error = throw). */
function scripted(name: "gemini" | "groq", script: (string | AIError)[]) {
  const calls: GenerateRequest[] = [];
  const provider: AIProvider = {
    name,
    generate: vi.fn(async (req: GenerateRequest) => {
      calls.push(req);
      const next = script.shift();
      if (next === undefined) throw new Error("unexpected extra call");
      if (next instanceof AIError) throw next;
      return next;
    }),
  };
  return { provider, calls };
}

function deps(primary: AIProvider | null, fallback: AIProvider | null, extra: Partial<RunDeps> = {}): RunDeps {
  return { primary, fallback, sleep: vi.fn(async () => {}), log: vi.fn(), ...extra };
}

const opts = { system: "sys", user: "usr", maxTokens: 500, schema };

describe("runWithFallback", () => {
  it("returns Gemini's answer on success (one call)", async () => {
    const g = scripted("gemini", [good]);
    const q = scripted("groq", []);
    const r = await runWithFallback(opts, deps(g.provider, q.provider));
    expect(r).toEqual({ ok: true, data: { answer: "hello" }, provider: "gemini" });
    expect(g.calls).toHaveLength(1);
    expect(q.calls).toHaveLength(0);
  });

  it("on 429 waits for a short retry-after, retries once, then succeeds", async () => {
    const g = scripted("gemini", [new AIError("rate_limit", "gemini", { status: 429, retryAfterSec: 7 }), good]);
    const d = deps(g.provider, null);
    const r = await runWithFallback(opts, d);
    expect(r.ok).toBe(true);
    expect(d.sleep).toHaveBeenCalledWith(7000);
    expect(g.calls).toHaveLength(2);
  });

  it("falls back to Groq when retry-after is too long (no waiting)", async () => {
    const g = scripted("gemini", [new AIError("rate_limit", "gemini", { status: 429, retryAfterSec: 45 })]);
    const q = scripted("groq", [good]);
    const d = deps(g.provider, q.provider);
    const r = await runWithFallback(opts, d);
    expect(r).toMatchObject({ ok: true, provider: "groq" });
    expect(d.sleep).not.toHaveBeenCalled();
  });

  it("retries a 429 only once, then falls back", async () => {
    const rl = () => new AIError("rate_limit", "gemini", { status: 429, retryAfterSec: 2 });
    const g = scripted("gemini", [rl(), rl()]);
    const q = scripted("groq", [good]);
    const r = await runWithFallback(opts, deps(g.provider, q.provider));
    expect(r).toMatchObject({ ok: true, provider: "groq" });
    expect(g.calls).toHaveLength(2);
  });

  it.each(["server", "timeout", "daily_quota"] as const)("falls back on %s", async (kind) => {
    const g = scripted("gemini", [new AIError(kind, "gemini", { status: kind === "server" ? 503 : undefined })]);
    const q = scripted("groq", [good]);
    const r = await runWithFallback(opts, deps(g.provider, q.provider));
    expect(r).toMatchObject({ ok: true, provider: "groq" });
    expect(g.calls).toHaveLength(1);
  });

  it("retries invalid JSON once with the validation error appended", async () => {
    const g = scripted("gemini", ["not json at all", JSON.stringify({ wrong: 1 })]);
    const q = scripted("groq", [good]);
    const r = await runWithFallback(opts, deps(g.provider, q.provider));
    expect(r).toMatchObject({ ok: true, provider: "groq" });
    expect(g.calls).toHaveLength(2);
    expect(g.calls[1].user).toContain("Your previous reply was rejected");
    expect(g.calls[1].user).toContain("not valid JSON");
  });

  it("appends the Zod error on a schema failure retry", async () => {
    const g = scripted("gemini", [JSON.stringify({ answer: 5 }), good]);
    const r = await runWithFallback(opts, deps(g.provider, null));
    expect(r.ok).toBe(true);
    expect(g.calls[1].user).toMatch(/answer:/);
  });

  it("a failing soft rule triggers one corrective retry, then accepts", async () => {
    const g = scripted("gemini", [good, good]);
    const check = vi.fn(() => "include at least 2 DIY ideas");
    const r = await runWithFallback({ ...opts, check }, deps(g.provider, null));
    expect(r.ok).toBe(true);
    expect(g.calls).toHaveLength(2);
    expect(g.calls[1].user).toContain("at least 2 DIY");
  });

  it("reports all errors when every provider fails", async () => {
    const g = scripted("gemini", [new AIError("daily_quota", "gemini", { status: 429 })]);
    const q = scripted("groq", [new AIError("daily_quota", "groq", { status: 429 })]);
    const r = await runWithFallback(opts, deps(g.provider, q.provider));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(toUserError(r.errors, { usedByok: false }).code).toBe("DAILY_QUOTA");
  });

  it("uses Groq directly when no Gemini key is configured", async () => {
    const q = scripted("groq", [good]);
    expect(await runWithFallback(opts, deps(null, q.provider))).toMatchObject({ ok: true, provider: "groq" });
  });

  it("never logs prompts or keys", async () => {
    const g = scripted("gemini", [new AIError("server", "gemini", { status: 500 })]);
    const log = vi.fn();
    await runWithFallback({ ...opts, user: "SECRET-USER-TEXT" }, deps(g.provider, null, { log }));
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain("SECRET-USER-TEXT");
    expect(log).toHaveBeenCalledWith(expect.objectContaining({ provider: "gemini", status: 500, errorType: "server" }));
  });

  it("validates a realistic ideas payload", async () => {
    const g = scripted("gemini", ["```json\n" + ideasJson([makeIdea()]) + "\n```"]);
    const r = await runWithFallback({ ...opts, schema: IdeasResponseSchema }, deps(g.provider, null));
    expect(r.ok).toBe(true);
  });
});

describe("user-facing error mapping", () => {
  it("per-minute limit → RATE_LIMIT with the soonest wait", () => {
    const e = toUserError(
      [new AIError("rate_limit", "gemini", { retryAfterSec: 40 }), new AIError("rate_limit", "groq", { retryAfterSec: 12 })],
      { usedByok: false },
    );
    expect(e).toMatchObject({ code: "RATE_LIMIT", retryAfter: 12 });
  });
  it("daily quota on Gemini + per-minute on Groq → RATE_LIMIT (Groq frees up soon)", () => {
    const e = toUserError(
      [new AIError("daily_quota", "gemini"), new AIError("rate_limit", "groq", { retryAfterSec: 9 })],
      { usedByok: false },
    );
    expect(e).toMatchObject({ code: "RATE_LIMIT", retryAfter: 9 });
  });
  it("daily quota only → DAILY_QUOTA message pointing to Settings", () => {
    const e = toUserError([new AIError("daily_quota", "gemini")], { usedByok: false });
    expect(e.code).toBe("DAILY_QUOTA");
    expect(e.message).toContain("Settings");
  });
  it("bad personal key → BAD_KEY", () => {
    expect(toUserError([new AIError("auth", "gemini", { status: 400 })], { usedByok: true }).code).toBe("BAD_KEY");
  });
  it("server errors → AI_UNAVAILABLE; nothing configured → NOT_CONFIGURED", () => {
    expect(toUserError([new AIError("server", "gemini")], { usedByok: false }).code).toBe("AI_UNAVAILABLE");
    expect(toUserError([], { usedByok: false }).code).toBe("NOT_CONFIGURED");
  });
});

describe("retry-after parsing", () => {
  it("parses headers in seconds and HTTP-date form", () => {
    expect(parseRetryAfterHeader("7")).toBe(7);
    expect(parseRetryAfterHeader("2.5")).toBe(3);
    const now = Date.parse("2026-01-01T00:00:00Z");
    expect(parseRetryAfterHeader("Thu, 01 Jan 2026 00:00:30 GMT", now)).toBe(30);
    expect(parseRetryAfterHeader(null)).toBeUndefined();
    expect(parseRetryAfterHeader("soon")).toBeUndefined();
  });

  it("parses Gemini's retryDelay from the error body", () => {
    expect(parseGeminiRetryDelay('{"@type":"RetryInfo","retryDelay":"7s"}')).toBe(7);
    expect(parseGeminiRetryDelay("Please retry in 6.3s.")).toBe(7);
    expect(parseGeminiRetryDelay("no hint")).toBeUndefined();
  });

  it("classifies Gemini errors", () => {
    expect(classifyGeminiError({ status: 429, message: 'quota exceeded "retryDelay": "5s"' })).toMatchObject({
      kind: "rate_limit",
      retryAfterSec: 5,
    });
    expect(classifyGeminiError({ status: 429, message: "GenerateRequestsPerDayPerProjectPerModel" }).kind).toBe("daily_quota");
    expect(classifyGeminiError({ status: 503, message: "overloaded" }).kind).toBe("server");
    expect(classifyGeminiError({ status: 400, message: "API key not valid" }).kind).toBe("auth");
    expect(classifyGeminiError(new Error("boom"), true).kind).toBe("timeout");
  });
});

describe("Groq provider token budgeting", () => {
  const okFetch = vi.fn(async () =>
    Response.json({ choices: [{ message: { content: good } }] }),
  ) as unknown as typeof fetch;

  it("caps output tokens so the request fits the TPM limit", async () => {
    const fetchImpl = vi.fn(okFetch);
    const groq = createGroqProvider("fake-key", { fetchImpl, tokenWindow: new TokenWindow(8000) });
    await groq.generate({ system: "s".repeat(300), user: "u".repeat(3000), maxTokens: 9000, timeoutMs: 1000 });
    const body = JSON.parse((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body.max_completion_tokens).toBeLessThanOrEqual(8000 - 1100);
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("refuses with a retry-after when the minute budget is used up (no network call)", async () => {
    const fetchImpl = vi.fn(okFetch);
    const window = new TokenWindow(8000);
    const now = 1_000_000;
    window.reserve(7000, now - 20_000);
    const groq = createGroqProvider("fake-key", { fetchImpl, tokenWindow: window, now: () => now });
    await expect(groq.generate({ system: "s", user: "u", maxTokens: 3000, timeoutMs: 1000 })).rejects.toMatchObject({
      kind: "rate_limit",
      retryAfterSec: 40,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps a Groq 429 with retry-after header", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("rate limit reached for requests per minute", { status: 429, headers: { "retry-after": "8" } }),
    ) as unknown as typeof fetch;
    const groq = createGroqProvider("fake-key", { fetchImpl, tokenWindow: new TokenWindow(8000) });
    await expect(groq.generate({ system: "s", user: "u", maxTokens: 500, timeoutMs: 1000 })).rejects.toMatchObject({
      kind: "rate_limit",
      retryAfterSec: 8,
    });
  });
});

describe("extractJson", () => {
  it("handles fences and surrounding text", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(extractJson('Here you go: {"a":2} hope it helps')).toEqual({ a: 2 });
    expect(() => extractJson("nope")).toThrow();
  });
});

import { AI_CONFIG } from "@/config/ai";

/**
 * Best-effort per-IP limiter for AI routes. In-memory, so on serverless each instance
 * keeps its own counts (see README). Good enough to stop accidental hammering.
 */
const hits = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  now = Date.now(),
  { maxCalls, windowMs } = AI_CONFIG.rateLimit,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= maxCalls) {
    hits.set(key, recent);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000)) };
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= windowMs)) hits.delete(k);
  }
  return { ok: true };
}

export function resetRateLimits() {
  hits.clear();
}

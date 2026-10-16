/**
 * Rough token estimate. Real tokenizers average ~4 chars/token for English; we use a
 * more conservative 3 so requests stay safely inside free-tier limits.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3);
}

/**
 * Sliding one-minute window of tokens sent to a provider (in-memory, per server instance).
 * Used to keep Groq requests inside its free-tier tokens-per-minute limit.
 */
export class TokenWindow {
  private entries: { at: number; tokens: number }[] = [];

  constructor(
    private readonly limitPerMinute: number,
    private readonly windowMs = 60_000,
  ) {}

  private prune(now: number) {
    this.entries = this.entries.filter((e) => now - e.at < this.windowMs);
  }

  used(now = Date.now()): number {
    this.prune(now);
    return this.entries.reduce((sum, e) => sum + e.tokens, 0);
  }

  /** Reserve tokens, or return how many seconds until enough are free. */
  reserve(tokens: number, now = Date.now()): { ok: true } | { ok: false; retryAfterSec: number } {
    this.prune(now);
    if (tokens > this.limitPerMinute) return { ok: false, retryAfterSec: Math.ceil(this.windowMs / 1000) };
    let used = this.used(now);
    if (used + tokens <= this.limitPerMinute) {
      this.entries.push({ at: now, tokens });
      return { ok: true };
    }
    // Find when enough old entries expire.
    for (const e of this.entries) {
      used -= e.tokens;
      if (used + tokens <= this.limitPerMinute) {
        return { ok: false, retryAfterSec: Math.max(1, Math.ceil((e.at + this.windowMs - now) / 1000)) };
      }
    }
    return { ok: false, retryAfterSec: Math.ceil(this.windowMs / 1000) };
  }
}

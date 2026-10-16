import { afterEach, describe, expect, it, vi } from "vitest";
import { AI_CONFIG, isMockMode, isRealKey } from "@/config/ai";

describe("AI config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("treats placeholder and empty keys as missing", () => {
    expect(isRealKey("PASTE_YOUR_GEMINI_KEY_HERE")).toBe(false);
    expect(isRealKey("PASTE_YOUR_GROQ_KEY_HERE")).toBe(false);
    expect(isRealKey("")).toBe(false);
    expect(isRealKey(undefined)).toBe(false);
    expect(isRealKey("AIzaSyFAKEFAKEFAKEFAKE1234")).toBe(true);
  });

  it("mock mode only works outside production", () => {
    vi.stubEnv("MOCK_AI", "true");
    vi.stubEnv("NODE_ENV", "development");
    expect(isMockMode()).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    expect(isMockMode()).toBe(false);
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MOCK_AI", "false");
    expect(isMockMode()).toBe(false);
  });

  it("keeps the whole request inside the route's 60s maxDuration", () => {
    expect(AI_CONFIG.requestDeadlineMs).toBeLessThan(60_000);
  });
});

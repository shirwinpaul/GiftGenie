import { describe, expect, it } from "vitest";
import { COUNTRIES, flagEmoji, getCountry } from "@/data/countries";
import { countryFromLocale } from "@/lib/locale";

describe("countries list", () => {
  it("has no duplicate codes or names", () => {
    const codes = COUNTRIES.map((c) => c.code);
    const names = COUNTRIES.map((c) => c.name);
    expect(new Set(codes).size).toBe(codes.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("covers all countries", () => {
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(245);
  });

  it("every entry has a valid ISO code, flag and currency code", () => {
    for (const c of COUNTRIES) {
      expect(c.code).toMatch(/^[A-Z]{2}$/);
      expect(c.currency).toMatch(/^[A-Z]{3}$/);
      expect(c.flag).toBe(flagEmoji(c.code));
      expect(c.name.length).toBeGreaterThan(1);
    }
  });

  it("is sorted alphabetically", () => {
    const names = COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "en")));
  });

  it("looks up by code and falls back to India", () => {
    expect(getCountry("us").currency).toBe("USD");
    expect(getCountry("ZZ").code).toBe("IN");
    expect(flagEmoji("IN")).toBe("🇮🇳");
  });
});

describe("country detection from browser locale", () => {
  it.each([
    ["en-US", "US"],
    ["en-GB", "GB"],
    ["ta-IN", "IN"],
    ["zh-Hant-TW", "TW"],
    ["ta", "IN"],
    ["de", "DE"],
    ["xx", "IN"],
    ["", "IN"],
    [undefined, "IN"],
  ])("%s → %s", (locale, expected) => {
    expect(countryFromLocale(locale)).toBe(expected);
  });
});

import { describe, expect, it } from "vitest";
import { formatMoney, formatRange } from "@/lib/currency";
import { getBudgetPresets } from "@/config/budgets";

// Intl may use a narrow no-break space in some locales; normalise for comparisons.
const norm = (s: string) => s.replace(/[  ]/g, " ");

describe("formatMoney", () => {
  it("formats INR with Indian grouping", () => {
    expect(formatMoney(1500, "INR")).toBe("₹1,500");
    expect(formatMoney(150000, "INR")).toBe("₹1,50,000");
  });
  it("formats USD", () => {
    expect(formatMoney(25, "USD")).toBe("$25");
    expect(formatMoney(1234.6, "USD")).toBe("$1,235");
  });
  it("formats GBP", () => {
    expect(formatMoney(20, "GBP")).toBe("£20");
  });
  it("formats EUR", () => {
    expect(formatMoney(30, "EUR")).toBe("€30");
  });
  it("formats a currency without presets", () => {
    expect(getBudgetPresets("JPY")).toBeNull();
    expect(formatMoney(3000, "JPY")).toBe("¥3,000");
    expect(norm(formatMoney(500, "KES"))).toMatch(/500/);
  });
  it("never throws on an unknown currency code", () => {
    expect(formatMoney(10, "ZZZ")).toContain("10");
  });
  it("formats ranges and collapses equal values", () => {
    expect(formatRange(1000, 2000, "INR")).toBe("₹1,000 – ₹2,000");
    expect(formatRange(2000, 1000, "INR")).toBe("₹1,000 – ₹2,000");
    expect(formatRange(25, 25, "USD")).toBe("$25");
  });
});

describe("budget presets", () => {
  it.each(["INR", "USD", "GBP", "EUR", "AED", "SGD", "CAD", "AUD", "MYR", "LKR"])(
    "%s has ascending presets",
    (cur) => {
      const presets = getBudgetPresets(cur)!;
      expect(presets.length).toBeGreaterThanOrEqual(4);
      for (const p of presets) expect(p.max).toBeGreaterThan(p.min);
    },
  );
});

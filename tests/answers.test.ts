import { describe, expect, it } from "vitest";
import {
  DEFAULT_ANSWERS,
  firstInvalidStep,
  sanitizeAnswers,
  toGiftInput,
  validateStep,
  withCountry,
  type Answers,
} from "@/lib/answers";
import { GiftInputSchema } from "@/lib/schemas";

// Fake test data only.
const complete: Answers = {
  ...DEFAULT_ANSWERS,
  countryCode: "IN",
  relationship: "mom",
  nickname: "Amma",
  ageRange: "41-60",
  interests: ["Cooking & Food", "Plants & Gardening"],
  personality: ["Sentimental"],
  occasion: "Birthday",
  budgetMin: 1000,
  budgetMax: 2000,
  diy: true,
  experience: true,
  cardLanguage: "ta",
};

describe("wizard step validation", () => {
  it("accepts complete answers", () => {
    expect(firstInvalidStep(complete)).toBeNull();
    expect(validateStep("review", complete)).toBeNull();
  });

  it("requires at least one interest", () => {
    expect(validateStep("interests", { ...complete, interests: [] })).toMatch(/at least one/);
  });

  it("requires text when 'Other' is chosen", () => {
    expect(validateStep("who", { ...complete, relationship: "other", relationshipOther: " " })).not.toBeNull();
    expect(validateStep("who", { ...complete, relationship: "other", relationshipOther: "Neighbour" })).toBeNull();
    expect(validateStep("occasion", { ...complete, occasion: "other", occasionOther: "" })).not.toBeNull();
  });

  it("validates the budget range", () => {
    expect(validateStep("budget", { ...complete, budgetMax: null })).not.toBeNull();
    expect(validateStep("budget", { ...complete, budgetMin: 3000 })).toMatch(/minimum/);
    expect(validateStep("budget", { ...complete, budgetMin: 0, budgetMax: 0 })).not.toBeNull();
  });

  it("finds the first incomplete step", () => {
    expect(firstInvalidStep({ ...complete, ageRange: "" })).toBe(2);
    expect(firstInvalidStep(DEFAULT_ANSWERS)).toBe(0);
  });
});

describe("answers persistence + conversion", () => {
  it("sanitizes corrupt stored data", () => {
    expect(sanitizeAnswers("nonsense")).toEqual(DEFAULT_ANSWERS);
    const s = sanitizeAnswers({ ...complete, ageRange: "200", groupPeople: 99, countryCode: "ZZ", personality: ["Evil"] });
    expect(s.ageRange).toBe("");
    expect(s.groupPeople).toBe(30);
    expect(s.countryCode).toBe("");
    expect(s.personality).toEqual([]);
  });

  it("produces a valid API input", () => {
    const input = toGiftInput({ ...complete, groupEnabled: true, groupPeople: 4 });
    expect(input.currency).toBe("INR");
    expect(input.relationship).toBe("Mom");
    expect(input.modes.groupPeople).toBe(4);
    expect(GiftInputSchema.safeParse(input).success).toBe(true);
    expect(toGiftInput(complete).modes.groupPeople).toBeNull();
  });

  it("resets the budget when the currency changes", () => {
    const us = withCountry(complete, "US");
    expect(us.budgetMax).toBeNull();
    const fr = withCountry({ ...complete, countryCode: "DE" }, "FR");
    expect(fr.budgetMax).toBe(2000);
  });

  it("rejects bad API input", () => {
    const input = toGiftInput(complete);
    expect(GiftInputSchema.safeParse({ ...input, interests: [] }).success).toBe(false);
    expect(GiftInputSchema.safeParse({ ...input, budgetMin: 5000 }).success).toBe(false);
    expect(GiftInputSchema.safeParse({ ...input, modes: { ...input.modes, avoid: "x".repeat(201) } }).success).toBe(false);
  });
});

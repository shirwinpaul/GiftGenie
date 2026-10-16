import { describe, expect, it } from "vitest";
import {
  AiIdeaSchema,
  CardResponseSchema,
  IdeasRequestSchema,
  IdeasResponseSchema,
  MoreIdeasResponseSchema,
} from "@/lib/schemas";
import { DIY_DETAILS, makeIdea, makeInput } from "./fixtures";

describe("AI output schemas", () => {
  it("accepts a valid idea set", () => {
    const ideas = Array.from({ length: 8 }, (_, i) => makeIdea({ title: `Idea ${i}` }));
    expect(IdeasResponseSchema.safeParse({ summary: "A creative coffee-lover.", ideas }).success).toBe(true);
  });

  it("accepts a DIY idea with details", () => {
    expect(AiIdeaSchema.safeParse(makeIdea({ category: "DIY", whereToGet: "Make it yourself", diy: DIY_DETAILS })).success).toBe(true);
  });

  it("rejects a DIY idea without details", () => {
    expect(AiIdeaSchema.safeParse(makeIdea({ category: "DIY", diy: null })).success).toBe(false);
  });

  it("rejects wrong enums, missing fields and bad numbers", () => {
    expect(AiIdeaSchema.safeParse({ ...makeIdea(), category: "Gadget" }).success).toBe(false);
    expect(AiIdeaSchema.safeParse({ ...makeIdea(), whereToGet: "Moon" }).success).toBe(false);
    const missing: Record<string, unknown> = { ...makeIdea() };
    delete missing.whyItFits;
    expect(AiIdeaSchema.safeParse(missing).success).toBe(false);
    expect(AiIdeaSchema.safeParse({ ...makeIdea(), priceMin: "800" }).success).toBe(false);
    expect(AiIdeaSchema.safeParse({ ...makeIdea(), priceMin: -5 }).success).toBe(false);
    expect(AiIdeaSchema.safeParse({ ...makeIdea(), wowFactor: 9 }).success).toBe(false);
    expect(AiIdeaSchema.safeParse(makeIdea({ priceMin: 3000, priceMax: 1000 })).success).toBe(false);
  });

  it("rejects DIY with more than 6 steps", () => {
    const diy = { ...DIY_DETAILS, steps: Array.from({ length: 7 }, (_, i) => `Step ${i}`) };
    expect(AiIdeaSchema.safeParse(makeIdea({ category: "DIY", diy })).success).toBe(false);
  });

  it("enforces idea counts", () => {
    expect(IdeasResponseSchema.safeParse({ summary: "x y z", ideas: [] }).success).toBe(false);
    const nine = Array.from({ length: 9 }, () => makeIdea());
    expect(IdeasResponseSchema.safeParse({ summary: "x y z", ideas: nine }).success).toBe(false);
    expect(MoreIdeasResponseSchema.safeParse({ ideas: nine.slice(0, 5) }).success).toBe(false);
    expect(MoreIdeasResponseSchema.safeParse({ ideas: nine.slice(0, 4) }).success).toBe(true);
  });

  it("card messages need exactly 3", () => {
    expect(CardResponseSchema.safeParse({ messages: ["a b c", "d e f", "g h i"] }).success).toBe(true);
    expect(CardResponseSchema.safeParse({ messages: ["a b c", "d e f"] }).success).toBe(false);
    expect(CardResponseSchema.safeParse({ text: "hi" }).success).toBe(false);
  });
});

describe("API request schema", () => {
  it("accepts ideas requests and defaults exclude", () => {
    const r = IdeasRequestSchema.parse({ input: makeInput(), action: "initial" });
    expect(r.exclude).toEqual([]);
  });
  it("rejects unknown actions and refinements", () => {
    expect(IdeasRequestSchema.safeParse({ input: makeInput(), action: "hack" }).success).toBe(false);
    expect(IdeasRequestSchema.safeParse({ input: makeInput(), action: "refine", refinement: "evil" }).success).toBe(false);
  });
});

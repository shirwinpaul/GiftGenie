import { afterEach, describe, expect, it, vi } from "vitest";
import { filterAndSort } from "@/lib/results";
import { groupAskText, ideaShareText, possessive } from "@/lib/share";
import { groupSaved, savedListText, validateSaved, type SavedItem } from "@/lib/saved";
import { generateCardMessages, generateIdeas } from "@/lib/ai/service";
import { postProcessIdeas } from "@/lib/modeRules";
import type { Idea } from "@/lib/schemas";
import { DIY_DETAILS, makeIdea, makeInput } from "./fixtures";

const idea = (o: Partial<Idea>): Idea => ({ ...makeIdea(o), id: o.id ?? o.title ?? "x", wowFactor: o.wowFactor ?? 3 }) as Idea;

describe("filters and sorting", () => {
  const ideas = [
    idea({ title: "A", category: "Thing", priceMin: 500, priceMax: 700, wowFactor: 2 }),
    idea({ title: "B", category: "DIY", diy: DIY_DETAILS, priceMin: 100, priceMax: 200, wowFactor: 5, lastMinuteFriendly: true }),
    idea({ title: "C", category: "Experience", priceMin: 1500, priceMax: 1900, wowFactor: 4 }),
  ];
  it("filters by category and last-minute", () => {
    expect(filterAndSort(ideas, "DIY", "recommended").map((i) => i.title)).toEqual(["B"]);
    expect(filterAndSort(ideas, "last-minute", "recommended").map((i) => i.title)).toEqual(["B"]);
    expect(filterAndSort(ideas, "Digital", "recommended")).toEqual([]);
  });
  it("sorts by price and wow factor without mutating", () => {
    expect(filterAndSort(ideas, "all", "price-asc").map((i) => i.title)).toEqual(["B", "A", "C"]);
    expect(filterAndSort(ideas, "all", "price-desc").map((i) => i.title)).toEqual(["C", "A", "B"]);
    expect(filterAndSort(ideas, "all", "wow").map((i) => i.title)).toEqual(["B", "C", "A"]);
    expect(ideas.map((i) => i.title)).toEqual(["A", "B", "C"]);
  });
});

describe("share messages", () => {
  const ctx = { person: "Sam", occasion: "Graduation", currency: "USD" };
  it("builds the group WhatsApp message with each share", () => {
    const text = groupAskText(idea({ title: "Concert tickets", priceMin: 120, priceMax: 160 }), ctx, 4);
    expect(text).toBe("Let's get Concert tickets for Sam's Graduation! It's about $30–$40 each (4 of us).");
  });
  it("collapses equal shares and handles possessives", () => {
    expect(groupAskText(idea({ title: "Mug", priceMin: 40, priceMax: 40 }), { ...ctx, person: "James" }, 4)).toContain(
      "James' Graduation! It's about $10 each",
    );
    expect(possessive("Mom")).toBe("Mom's");
  });
  it("builds the idea share text", () => {
    const text = ideaShareText(idea({ title: "Herb kit", priceMin: 800, priceMax: 1500 }), { ...ctx, currency: "INR", person: "Mom", occasion: "Birthday" });
    expect(text).toContain("Mom's Birthday: Herb kit");
    expect(text).toContain("₹800 – ₹1,500");
  });
});

describe("saved list", () => {
  const item = (id: string, person: string, occasion: string, savedAt: number): SavedItem => ({
    id,
    idea: idea({ id, title: `Idea ${id}` }),
    person,
    occasion,
    currency: "INR",
    countryCode: "IN",
    groupPeople: null,
    messages: [],
    savedAt,
  });
  it("groups by person + occasion, newest first", () => {
    const groups = groupSaved([item("1", "Mom", "Birthday", 1), item("2", "Sam", "Graduation", 3), item("3", "mom", "birthday", 2)]);
    expect(groups.map((g) => [g.person, g.items.length])).toEqual([
      ["Sam", 1],
      ["mom", 2],
    ]);
  });
  it("builds a plain-text list and drops corrupt entries", () => {
    expect(savedListText([item("1", "Mom", "Birthday", 1)])).toContain("• Idea 1 (est.");
    expect(validateSaved([item("1", "Mom", "Birthday", 1), { junk: true }])).toHaveLength(1);
    expect(validateSaved("nope")).toBeNull();
  });
});

describe("ideas service in MOCK_AI mode (no quota used)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("scenario A: India, Mom, Birthday, ₹2,000, DIY + Experience", async () => {
    vi.stubEnv("MOCK_AI", "true");
    const input = makeInput({ budgetMin: 0, budgetMax: 2000, cardLanguage: "ta" }, { diy: true, experience: true });
    const r = await generateIdeas(input, { action: "initial", exclude: [], byokKey: null });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ideas).toHaveLength(8);
    expect(r.data.ideas.filter((i) => i.category === "DIY").length).toBeGreaterThanOrEqual(2);
    expect(r.data.ideas.filter((i) => i.category === "Experience").length).toBeGreaterThanOrEqual(2);
    expect(r.data.ideas.every((i) => i.priceMin <= 2000 * 1.3)).toBe(true);
    expect(r.data.ideas.some((i) => i.overBudget)).toBe(true);

    const card = await generateCardMessages(input, r.data.ideas[0], "heartfelt", "ta", null);
    expect(card.ok && card.data.messages).toHaveLength(3);
    if (card.ok) expect(card.data.messages[0]).toMatch(/[஀-௿]/); // Tamil script
  });

  it("scenario B: US, Friend, Graduation, Last-minute + group of 4", async () => {
    vi.stubEnv("MOCK_AI", "true");
    const input = makeInput(
      { countryCode: "US", currency: "USD", relationship: "Friend", nickname: "", occasion: "Graduation", budgetMin: 15, budgetMax: 30, ageRange: "18-25" },
      { lastMinute: true, groupPeople: 4 },
    );
    const r = await generateIdeas(input, { action: "initial", exclude: [], byokKey: null });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.ideas.length).toBeGreaterThan(0);
    expect(r.data.ideas.every((i) => i.lastMinuteFriendly)).toBe(true);
    // Group budget = 4 × $30 = $120 combined.
    expect(Math.max(...r.data.ideas.map((i) => i.priceMax))).toBeGreaterThan(30);

    const more = await generateIdeas(input, { action: "more", exclude: r.data.ideas.map((i) => i.title), byokKey: null });
    expect(more.ok).toBe(true);
    if (more.ok) {
      expect(more.data.ideas.length).toBeGreaterThan(0);
      expect(more.data.ideas.length).toBeLessThanOrEqual(4);
      const old = new Set(r.data.ideas.map((i) => i.title.toLowerCase()));
      expect(more.data.ideas.every((i) => !old.has(i.title.toLowerCase()))).toBe(true);
    }

    const refined = await generateIdeas(input, { action: "refine", refinement: "cheaper", exclude: [], byokKey: null });
    expect(refined.ok && refined.data.ideas.length).toBeGreaterThan(0);

    const card = await generateCardMessages(input, r.data.ideas[0], "funny", "en", null);
    expect(card.ok && card.data.messages[0]).toContain("Friend");
  });

  it("reports NOT_CONFIGURED when there are no keys and mock mode is off", async () => {
    vi.stubEnv("MOCK_AI", "false");
    vi.stubEnv("GEMINI_API_KEY", "PASTE_YOUR_GEMINI_KEY_HERE");
    vi.stubEnv("GROQ_API_KEY", "PASTE_YOUR_GROQ_KEY_HERE");
    const r = await generateIdeas(makeInput(), { action: "initial", exclude: [], byokKey: null });
    expect(r).toMatchObject({ ok: false, error: { code: "NOT_CONFIGURED" } });
  });

  it("post-processing keeps ids unique", () => {
    const { ideas } = postProcessIdeas([makeIdea({ title: "a" }), makeIdea({ title: "b" })], makeInput(), 2000);
    expect(new Set(ideas.map((i) => i.id)).size).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import {
  avoidTerms,
  checkModeRules,
  isUnsafeForMinor,
  lastMinuteOnly,
  mentionsAvoided,
  postProcessIdeas,
} from "@/lib/modeRules";
import { DIY_DETAILS, makeIdea, makeInput } from "./fixtures";

describe("last-minute filter", () => {
  it("keeps only last-minute friendly ideas", () => {
    const ideas = [makeIdea({ title: "A", lastMinuteFriendly: true }), makeIdea({ title: "B" })];
    expect(lastMinuteOnly(ideas).map((i) => i.title)).toEqual(["A"]);
  });

  it("post-processing drops non-friendly ideas when the mode is on", () => {
    const input = makeInput({}, { lastMinute: true });
    const { ideas, removed } = postProcessIdeas(
      [makeIdea({ title: "Quick", lastMinuteFriendly: true }), makeIdea({ title: "Slow" })],
      input,
      2000,
    );
    expect(ideas.map((i) => i.title)).toEqual(["Quick"]);
    expect(removed).toBe(1);
  });
});

describe("DIY / experience minimums", () => {
  const diy = (t: string) => makeIdea({ title: t, category: "DIY", diy: DIY_DETAILS, whereToGet: "Make it yourself" });
  const exp = (t: string) => makeIdea({ title: t, category: "Experience", whereToGet: "Book online" });

  it("flags missing DIY and experience ideas", () => {
    const input = makeInput({}, { diy: true, experience: true });
    const msg = checkModeRules([diy("d1"), exp("e1"), makeIdea()], input, { fullSet: true });
    expect(msg).toMatch(/at least 2 DIY/);
    expect(msg).toMatch(/at least 2 Experience/);
  });

  it("passes when minimums are met", () => {
    const input = makeInput({}, { diy: true, experience: true });
    expect(checkModeRules([diy("d1"), diy("d2"), exp("e1"), exp("e2")], input, { fullSet: true })).toBeNull();
  });

  it("needs only 1 of each for 'more ideas'", () => {
    const input = makeInput({}, { diy: true });
    expect(checkModeRules([diy("d1"), makeIdea()], input, { fullSet: false })).toBeNull();
  });

  it("flags non-last-minute ideas in last-minute mode", () => {
    const input = makeInput({}, { lastMinute: true });
    expect(checkModeRules([makeIdea()], input, { fullSet: true })).toMatch(/lastMinuteFriendly/);
  });
});

describe("avoid list", () => {
  it("parses free text into terms (with simple singulars)", () => {
    const terms = avoidTerms("Mugs, perfume and chocolates; no candles");
    expect(terms).toEqual(expect.arrayContaining(["mugs", "mug", "perfume", "chocolates", "chocolate", "candles", "candle"]));
  });

  it("flags any idea containing an avoided term", () => {
    const terms = avoidTerms("mugs, perfume");
    expect(mentionsAvoided(makeIdea({ title: "Hand-painted coffee mug" }), terms)).toBe("mug");
    expect(mentionsAvoided(makeIdea({ searchPhrase: "floral perfume gift set" }), terms)).toBe("perfume");
    expect(mentionsAvoided(makeIdea({ title: "Herb garden kit" }), terms)).toBeNull();
    // Whole-word start: "mug" must not match "smuggler".
    expect(mentionsAvoided(makeIdea({ title: "Smuggler's board game" }), terms)).toBeNull();
  });

  it("removes avoided ideas in post-processing and tells the AI in the rule check", () => {
    const input = makeInput({}, { avoid: "mugs" });
    const ideas = [makeIdea({ title: "Photo mug" }), makeIdea({ title: "Herb kit" })];
    expect(checkModeRules(ideas, input, { fullSet: true })).toMatch(/mug/);
    expect(postProcessIdeas(ideas, input, 2000).ideas.map((i) => i.title)).toEqual(["Herb kit"]);
  });
});

describe("post-processing safety net", () => {
  it("recomputes the over-budget flag and drops ideas far over budget", () => {
    const input = makeInput();
    const { ideas } = postProcessIdeas(
      [
        makeIdea({ title: "Fits", priceMax: 2000, overBudget: true }),
        makeIdea({ title: "Slightly over", priceMax: 2200, overBudget: false }),
        makeIdea({ title: "Way over", priceMin: 3000, priceMax: 4000 }),
      ],
      input,
      2000,
    );
    expect(ideas.map((i) => [i.title, i.overBudget])).toEqual([
      ["Fits", false],
      ["Slightly over", true],
    ]);
  });

  it("removes unsafe ideas for minors only", () => {
    const wine = makeIdea({ title: "Wine tasting evening" });
    expect(isUnsafeForMinor(wine)).toBe(true);
    expect(isUnsafeForMinor(makeIdea({ title: "Ginger tea sampler" }))).toBe(false);
    expect(postProcessIdeas([wine], makeInput({ ageRange: "13-17" }), 2000).ideas).toHaveLength(0);
    expect(postProcessIdeas([wine], makeInput({ ageRange: "41-60" }), 2000).ideas).toHaveLength(1);
  });

  it("drops duplicates and excluded titles, rounds wow factor, adds ids", () => {
    const { ideas } = postProcessIdeas(
      [makeIdea({ title: "Same", wowFactor: 4.6 }), makeIdea({ title: "same" }), makeIdea({ title: "Old one" })],
      makeInput(),
      2000,
      ["Old one"],
    );
    expect(ideas).toHaveLength(1);
    expect(ideas[0].wowFactor).toBe(5);
    expect(ideas[0].id).toMatch(/^idea-/);
  });
});

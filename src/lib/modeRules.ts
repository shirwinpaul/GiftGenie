import { MINOR_AGES } from "@/config/options";
import type { AiIdea, Idea, ParsedGiftInput } from "./schemas";

/** Ideas whose minimum price is this far above the budget are dropped, not just flagged. */
export const WAY_OVER_BUDGET_FACTOR = 1.3;

const STOP_WORDS = new Set(["the", "and", "any", "all", "she", "him", "her", "has", "have", "they", "already", "likes", "like", "dislikes", "hates", "things", "stuff", "etc"]);

/** Split the free-text avoid box into search terms: "mugs, perfume and chocolates" → mug(s), perfume, chocolate(s). */
export function avoidTerms(avoid: string): string[] {
  const terms = avoid
    .toLowerCase()
    .split(/[,;/\n]|\band\b|\bor\b|\bno\b|\bnot\b/)
    .map((t) => t.replace(/[^\p{L}\p{N}\s-]/gu, "").trim())
    .filter((t) => t.length >= 3 && !STOP_WORDS.has(t));
  // Simple singular form so "mugs" also catches "mug".
  const withStems = terms.flatMap((t) => [t, singular(t)]);
  return [...new Set(withStems.filter((t) => t.length >= 3))];
}

function singular(word: string): string {
  if (word.length <= 3) return word;
  if (/(ch|sh|x|z|ss)es$/.test(word)) return word.slice(0, -2); // boxes → box, dresses → dress
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1); // mugs → mug
  return word;
}

function ideaText(idea: AiIdea): string {
  return [idea.title, idea.searchPhrase, ...(idea.diy?.materials ?? [])].join(" ").toLowerCase();
}

/** Returns the avoided term an idea mentions, or null. */
export function mentionsAvoided(idea: AiIdea, terms: string[]): string | null {
  const text = ideaText(idea);
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^\\p{L}])${escaped}`, "u").test(text)) return term;
  }
  return null;
}

const UNSAFE_FOR_MINORS =
  /\b(alcohol|wine|beer|whisk(e)?y|vodka|rum|gin|champagne|liquor|cocktail|tobacco|cigar(ette)?s?|vape|e-?cig|hookah|knife|knives|dagger|sword|gun|rifle|pistol|firearm|weapon|ammo|lingerie|adult toy|casino|gambling|betting)\b/i;

export function isUnsafeForMinor(idea: AiIdea): boolean {
  return UNSAFE_FOR_MINORS.test([idea.title, idea.searchPhrase, idea.whyItFits].join(" "));
}

/** Mode requirements the AI must meet; returns a correction message or null. */
export function checkModeRules(ideas: AiIdea[], input: ParsedGiftInput, opts: { fullSet: boolean }): string | null {
  const problems: string[] = [];
  const min = opts.fullSet ? 2 : 1;
  const count = (cat: AiIdea["category"]) => ideas.filter((i) => i.category === cat).length;
  if (input.modes.diy && count("DIY") < min) problems.push(`include at least ${min} DIY ideas (got ${count("DIY")})`);
  if (input.modes.experience && count("Experience") < min) {
    problems.push(`include at least ${min} Experience ideas (got ${count("Experience")})`);
  }
  if (input.modes.lastMinute && ideas.some((i) => !i.lastMinuteFriendly)) {
    problems.push("every idea must be lastMinuteFriendly (obtainable today)");
  }
  const terms = avoidTerms(input.modes.avoid);
  const avoided = ideas.map((i) => mentionsAvoided(i, terms)).filter(Boolean);
  if (avoided.length) problems.push(`do not suggest anything with: ${[...new Set(avoided)].join(", ")}`);
  return problems.length ? problems.join("; ") : null;
}

export function lastMinuteOnly<T extends Pick<AiIdea, "lastMinuteFriendly">>(ideas: T[]): T[] {
  return ideas.filter((i) => i.lastMinuteFriendly);
}

let idCounter = 0;
const newId = () =>
  `idea-${Date.now().toString(36)}-${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * Final safety net in CODE (the AI is never fully trusted):
 * - last-minute mode → only lastMinuteFriendly ideas
 * - drop ideas that mention an avoided term, are unsafe for minors, or are way over budget
 * - recompute the "Slightly over budget" flag, round wowFactor, drop duplicates/excluded titles
 */
export function postProcessIdeas(
  ideas: AiIdea[],
  input: ParsedGiftInput,
  budgetMax: number,
  exclude: string[] = [],
): { ideas: Idea[]; removed: number } {
  const terms = avoidTerms(input.modes.avoid);
  const minor = MINOR_AGES.includes(input.ageRange);
  const seen = new Set(exclude.map((t) => t.trim().toLowerCase()));
  const out: Idea[] = [];

  for (const idea of ideas) {
    const key = idea.title.trim().toLowerCase();
    if (seen.has(key)) continue;
    if (input.modes.lastMinute && !idea.lastMinuteFriendly) continue;
    if (mentionsAvoided(idea, terms)) continue;
    if (minor && isUnsafeForMinor(idea)) continue;
    if (idea.priceMin > budgetMax * WAY_OVER_BUDGET_FACTOR) continue;
    seen.add(key);
    out.push({
      ...idea,
      id: newId(),
      priceMin: Math.round(idea.priceMin),
      priceMax: Math.round(idea.priceMax),
      overBudget: Math.round(idea.priceMax) > budgetMax,
      wowFactor: Math.min(5, Math.max(1, Math.round(idea.wowFactor))) as Idea["wowFactor"],
      diy: idea.category === "DIY" ? idea.diy : null,
    });
  }
  return { ideas: out, removed: ideas.length - out.length };
}

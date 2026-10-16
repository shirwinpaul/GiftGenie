import {
  AGE_IDS,
  GENDER_IDS,
  LANGUAGE_IDS,
  OCCASIONS,
  OTHER,
  PERSONALITY_IDS,
  RELATIONSHIPS,
  labelFor,
  type AgeRangeId,
  type GenderId,
  type LanguageId,
  type PersonalityId,
} from "@/config/options";
import { getCountry, isKnownCountry } from "@/data/countries";
import { getBudgetPresets, MAX_BUDGET_VALUE } from "@/config/budgets";
import { clampPeople } from "./group";
import type { GiftInput } from "./schemas";

/** The wizard's draft answers (persisted in localStorage while the user fills them in). */
export interface Answers {
  countryCode: string;
  relationship: string;
  relationshipOther: string;
  nickname: string;
  ageRange: AgeRangeId | "";
  gender: GenderId | "";
  interests: string[];
  personality: PersonalityId[];
  occasion: string;
  occasionOther: string;
  budgetMin: number | null;
  budgetMax: number | null;
  lastMinute: boolean;
  diy: boolean;
  experience: boolean;
  avoid: string;
  groupEnabled: boolean;
  groupPeople: number;
  cardLanguage: LanguageId;
}

export const DEFAULT_ANSWERS: Answers = {
  countryCode: "",
  relationship: "",
  relationshipOther: "",
  nickname: "",
  ageRange: "",
  gender: "",
  interests: [],
  personality: [],
  occasion: "",
  occasionOther: "",
  budgetMin: null,
  budgetMax: null,
  lastMinute: false,
  diy: false,
  experience: false,
  avoid: "",
  groupEnabled: false,
  groupPeople: 4,
  cardLanguage: "en",
};

export const AVOID_MAX = 200;
export const NICKNAME_MAX = 30;
export const OTHER_TEXT_MAX = 40;

/** Rebuild answers from untrusted storage, keeping only well-formed fields. */
export function sanitizeAnswers(value: unknown): Answers {
  if (!value || typeof value !== "object") return DEFAULT_ANSWERS;
  const v = value as Record<string, unknown>;
  const str = (k: string, max = 200) => (typeof v[k] === "string" ? (v[k] as string).slice(0, max) : "");
  const bool = (k: string) => v[k] === true;
  const num = (k: string) =>
    typeof v[k] === "number" && Number.isFinite(v[k]) && (v[k] as number) >= 0 ? (v[k] as number) : null;
  const strArr = (k: string) =>
    Array.isArray(v[k]) ? (v[k] as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 20) : [];
  const pick = <T extends string>(k: string, allowed: readonly T[]): T | "" =>
    allowed.includes(v[k] as T) ? (v[k] as T) : "";

  return {
    countryCode: isKnownCountry(str("countryCode", 2)) ? str("countryCode", 2).toUpperCase() : "",
    relationship: str("relationship", 40),
    relationshipOther: str("relationshipOther", OTHER_TEXT_MAX),
    nickname: str("nickname", NICKNAME_MAX),
    ageRange: pick("ageRange", AGE_IDS),
    gender: pick("gender", GENDER_IDS),
    interests: strArr("interests").map((s) => s.slice(0, OTHER_TEXT_MAX)),
    personality: strArr("personality").filter((p): p is PersonalityId =>
      (PERSONALITY_IDS as readonly string[]).includes(p),
    ),
    occasion: str("occasion", 40),
    occasionOther: str("occasionOther", OTHER_TEXT_MAX),
    budgetMin: num("budgetMin"),
    budgetMax: num("budgetMax"),
    lastMinute: bool("lastMinute"),
    diy: bool("diy"),
    experience: bool("experience"),
    avoid: str("avoid", AVOID_MAX),
    groupEnabled: bool("groupEnabled"),
    groupPeople: typeof v.groupPeople === "number" ? clampPeople(v.groupPeople) : 4,
    cardLanguage: pick("cardLanguage", LANGUAGE_IDS) || "en",
  };
}

export const WIZARD_STEPS = [
  { id: "country", title: "Where are you shopping?" },
  { id: "who", title: "Who's it for?" },
  { id: "age", title: "How old are they?" },
  { id: "interests", title: "What do they love?" },
  { id: "occasion", title: "What's the occasion?" },
  { id: "budget", title: "What's your budget?" },
  { id: "modes", title: "Any special wishes?" },
  { id: "language", title: "Card message language" },
  { id: "review", title: "Ready for some magic?" },
] as const;
export type StepId = (typeof WIZARD_STEPS)[number]["id"];

export function relationshipLabel(a: Pick<Answers, "relationship" | "relationshipOther">): string {
  return a.relationship === OTHER ? a.relationshipOther.trim() : labelFor(RELATIONSHIPS, a.relationship);
}

export function occasionLabel(a: Pick<Answers, "occasion" | "occasionOther">): string {
  return a.occasion === OTHER ? a.occasionOther.trim() : labelFor(OCCASIONS, a.occasion);
}

/** Returns a friendly error for the step, or null when the user may continue. */
export function validateStep(step: StepId, a: Answers): string | null {
  switch (step) {
    case "country":
      return isKnownCountry(a.countryCode) ? null : "Please choose a country.";
    case "who":
      if (!a.relationship) return "Please choose who the gift is for.";
      if (a.relationship === OTHER && !a.relationshipOther.trim()) return "Please type who the gift is for.";
      return null;
    case "age":
      return a.ageRange ? null : "Please choose an age range.";
    case "interests":
      return a.interests.length > 0 ? null : "Please pick at least one interest.";
    case "occasion":
      if (!a.occasion) return "Please choose an occasion.";
      if (a.occasion === OTHER && !a.occasionOther.trim()) return "Please type the occasion.";
      return null;
    case "budget": {
      if (a.budgetMin === null || a.budgetMax === null) return "Please choose or enter a budget.";
      if (a.budgetMax <= 0) return "The maximum budget must be more than zero.";
      if (a.budgetMin > a.budgetMax) return "The minimum can't be more than the maximum.";
      if (a.budgetMax > MAX_BUDGET_VALUE) return "That budget is too large.";
      return null;
    }
    case "modes":
      return a.avoid.length > AVOID_MAX ? `Please keep the avoid list under ${AVOID_MAX} characters.` : null;
    case "language":
      return null;
    case "review":
      return firstInvalidStep(a) === null ? null : "Some answers are missing.";
  }
}

/** Index of the first step that is not valid yet (ignores the review step itself). */
export function firstInvalidStep(a: Answers): number | null {
  for (let i = 0; i < WIZARD_STEPS.length - 1; i++) {
    if (validateStep(WIZARD_STEPS[i].id, a)) return i;
  }
  return null;
}

/** Convert complete wizard answers into the API input. */
export function toGiftInput(a: Answers): GiftInput {
  const country = getCountry(a.countryCode);
  return {
    countryCode: country.code,
    currency: country.currency,
    relationship: relationshipLabel(a),
    nickname: a.nickname.trim(),
    ageRange: (a.ageRange || "26-40") as AgeRangeId,
    gender: a.gender || undefined,
    interests: a.interests,
    personality: a.personality,
    occasion: occasionLabel(a),
    budgetMin: a.budgetMin ?? 0,
    budgetMax: a.budgetMax ?? 0,
    modes: {
      lastMinute: a.lastMinute,
      diy: a.diy,
      experience: a.experience,
      avoid: a.avoid.trim(),
      groupPeople: a.groupEnabled ? clampPeople(a.groupPeople) : null,
    },
    cardLanguage: a.cardLanguage,
  };
}

/** When the country changes, the currency may change, so the budget is reset. */
export function withCountry(a: Answers, code: string): Answers {
  if (a.countryCode === code) return a;
  const sameCurrency = a.countryCode && getCountry(a.countryCode).currency === getCountry(code).currency;
  return sameCurrency ? { ...a, countryCode: code } : { ...a, countryCode: code, budgetMin: null, budgetMax: null };
}

export function hasPresets(a: Answers): boolean {
  return getBudgetPresets(getCountry(a.countryCode).currency) !== null;
}

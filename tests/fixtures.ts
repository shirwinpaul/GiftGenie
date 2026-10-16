// Fake test data only — no real people.
import { GiftInputSchema, type AiIdea, type ParsedGiftInput } from "@/lib/schemas";

export function makeInput(overrides: Partial<ParsedGiftInput> = {}, modes: Partial<ParsedGiftInput["modes"]> = {}): ParsedGiftInput {
  const base = GiftInputSchema.parse({
    countryCode: "IN",
    currency: "INR",
    relationship: "Mom",
    nickname: "Amma",
    ageRange: "41-60",
    interests: ["Cooking & Food", "Plants & Gardening"],
    personality: ["Sentimental"],
    occasion: "Birthday",
    budgetMin: 1000,
    budgetMax: 2000,
    modes: { lastMinute: false, diy: false, experience: false, avoid: "", groupPeople: null },
    cardLanguage: "en",
  });
  return { ...base, ...overrides, modes: { ...base.modes, ...modes } };
}

export function makeIdea(overrides: Partial<AiIdea> = {}): AiIdea {
  return {
    title: "Herb garden starter kit",
    category: "Thing",
    whyItFits: "She loves gardening and cooking with fresh herbs.",
    priceMin: 800,
    priceMax: 1500,
    overBudget: false,
    searchPhrase: "kitchen herb garden kit",
    whereToGet: "Online",
    lastMinuteFriendly: false,
    diy: null,
    presentationTip: "Tie a ribbon around the pots.",
    wowFactor: 4,
    ...overrides,
  };
}

export const DIY_DETAILS = {
  materials: ["Glass jar", "Ribbon"],
  steps: ["Fill the jar", "Tie the ribbon"],
  timeNeeded: "1 hour",
  materialCostMin: 200,
  materialCostMax: 400,
};

export function ideasJson(ideas: AiIdea[], summary = "A green-thumbed home chef."): string {
  return JSON.stringify({ summary, ideas });
}

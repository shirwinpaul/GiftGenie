import { z } from "zod";
import {
  AGE_IDS,
  GENDER_IDS,
  LANGUAGE_IDS,
  PERSONALITY_IDS,
  REFINEMENT_IDS,
  TONE_IDS,
} from "@/config/options";
import { MAX_BUDGET_VALUE } from "@/config/budgets";

const text = (max: number) => z.string().trim().min(1).max(max);

/* ------------------------------------------------------------------ */
/* API inputs                                                          */
/* ------------------------------------------------------------------ */

export const GiftInputSchema = z
  .object({
    countryCode: z.string().regex(/^[A-Z]{2}$/),
    currency: z.string().regex(/^[A-Z]{3}$/),
    relationship: text(40),
    nickname: z.string().trim().max(30).default(""),
    ageRange: z.enum(AGE_IDS),
    gender: z.enum(GENDER_IDS).optional(),
    interests: z.array(text(40)).min(1).max(15),
    personality: z.array(z.enum(PERSONALITY_IDS)).max(PERSONALITY_IDS.length).default([]),
    occasion: text(40),
    budgetMin: z.number().min(0).max(MAX_BUDGET_VALUE),
    budgetMax: z.number().positive().max(MAX_BUDGET_VALUE),
    modes: z.object({
      lastMinute: z.boolean(),
      diy: z.boolean(),
      experience: z.boolean(),
      avoid: z.string().trim().max(200).default(""),
      groupPeople: z.number().int().min(2).max(30).nullable(),
    }),
    cardLanguage: z.enum(LANGUAGE_IDS),
  })
  .refine((v) => v.budgetMin <= v.budgetMax, { message: "budgetMin must be <= budgetMax", path: ["budgetMin"] });
export type GiftInput = z.input<typeof GiftInputSchema>;
export type ParsedGiftInput = z.output<typeof GiftInputSchema>;

export const IdeasRequestSchema = z.object({
  input: GiftInputSchema,
  action: z.enum(["initial", "refine", "more"]),
  refinement: z.enum(REFINEMENT_IDS).optional(),
  exclude: z.array(z.string().max(120)).max(60).default([]),
});
export type IdeasRequest = z.input<typeof IdeasRequestSchema>;

export const CardRequestSchema = z.object({
  input: GiftInputSchema,
  idea: z.object({ title: text(120), whyItFits: z.string().max(400).default("") }),
  tone: z.enum(TONE_IDS),
  language: z.enum(LANGUAGE_IDS),
});
export type CardRequest = z.input<typeof CardRequestSchema>;

/* ------------------------------------------------------------------ */
/* AI outputs (strict)                                                 */
/* ------------------------------------------------------------------ */

const money = z.number().finite().min(0).max(MAX_BUDGET_VALUE);

export const DiySchema = z
  .object({
    materials: z.array(text(100)).min(1).max(12),
    steps: z.array(text(240)).min(1).max(6),
    timeNeeded: text(60),
    materialCostMin: money,
    materialCostMax: money,
  })
  .refine((d) => d.materialCostMin <= d.materialCostMax, { message: "materialCostMin must be <= materialCostMax" });

export const AiIdeaSchema = z
  .object({
    title: text(100),
    category: z.enum(["Thing", "Experience", "DIY", "Digital"]),
    whyItFits: text(300),
    priceMin: money,
    priceMax: money,
    overBudget: z.boolean(),
    searchPhrase: text(100),
    whereToGet: z.enum(["Online", "Local shop", "Make it yourself", "Book online"]),
    lastMinuteFriendly: z.boolean(),
    diy: DiySchema.nullish(),
    presentationTip: text(240),
    wowFactor: z.number().min(1).max(5),
  })
  .refine((i) => i.priceMin <= i.priceMax, { message: "priceMin must be <= priceMax", path: ["priceMin"] })
  .refine((i) => i.category !== "DIY" || !!i.diy, { message: "DIY ideas must include the diy object", path: ["diy"] });
export type AiIdea = z.output<typeof AiIdeaSchema>;

export const IdeasResponseSchema = z.object({
  summary: text(240),
  ideas: z.array(AiIdeaSchema).min(1).max(8),
});
export type IdeasResponse = z.output<typeof IdeasResponseSchema>;

export const MoreIdeasResponseSchema = z.object({
  ideas: z.array(AiIdeaSchema).min(1).max(4),
});

export const CardResponseSchema = z.object({
  messages: z.array(text(500)).length(3),
});
export type CardResponse = z.output<typeof CardResponseSchema>;

/** An idea as used by the app (validated + post-processed in code). */
export interface Idea extends AiIdea {
  id: string;
  wowFactor: 1 | 2 | 3 | 4 | 5;
}

/** Short, readable description of a Zod error (sent back to the AI on a retry). */
export function describeZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 8)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

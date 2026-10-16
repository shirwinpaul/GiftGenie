import type { z } from "zod";
import { AI_CONFIG, isMockMode, isRealKey } from "@/config/ai";
import {
  CardResponseSchema,
  IdeasResponseSchema,
  MoreIdeasResponseSchema,
  type AiIdea,
  type Idea,
  type ParsedGiftInput,
} from "@/lib/schemas";
import { buildCardPrompt, buildIdeasPrompt, CARD_SYSTEM_PROMPT, effectiveBudget, IDEAS_SYSTEM_PROMPT } from "@/lib/prompts";
import { checkModeRules, postProcessIdeas } from "@/lib/modeRules";
import type { LanguageId, RefinementId, ToneId } from "@/config/options";
import { toUserError, type UserError } from "./errors";
import { createGeminiProvider } from "./gemini";
import { createGroqProvider } from "./groq";
import { createMockProvider, mockCardMessages, mockIdeas } from "./mock";
import { runWithFallback, type RunDeps } from "./run";
import type { AIProvider } from "./types";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: UserError };

function realProviders(byokKey: string | null): { primary: AIProvider | null; fallback: AIProvider | null } {
  const geminiKey = byokKey || process.env.GEMINI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  return {
    primary: isRealKey(geminiKey) ? createGeminiProvider(geminiKey.trim()) : null,
    fallback: isRealKey(groqKey) ? createGroqProvider(groqKey.trim()) : null,
  };
}

function providersFor(byokKey: string | null, mock: () => unknown): Pick<RunDeps, "primary" | "fallback"> {
  if (isMockMode()) return { primary: createMockProvider(mock), fallback: null };
  return realProviders(byokKey);
}

export interface IdeasPayload {
  summary?: string;
  ideas: Idea[];
  removed: number;
}

export async function generateIdeas(
  input: ParsedGiftInput,
  opts: { action: "initial" | "refine" | "more"; refinement?: RefinementId; exclude: string[]; byokKey: string | null },
): Promise<ServiceResult<IdeasPayload>> {
  const more = opts.action === "more";
  const count = more ? 4 : 8;
  const refinement = opts.action === "refine" ? opts.refinement : undefined;
  const exclude = more ? opts.exclude : [];
  const deps = providersFor(opts.byokKey, () => {
    const r = mockIdeas(input, { count, refinement, exclude });
    return more ? { ideas: r.ideas } : r;
  });

  const schema: z.ZodType<{ summary?: string; ideas: AiIdea[] }> = more ? MoreIdeasResponseSchema : IdeasResponseSchema;
  const result = await runWithFallback(
    {
      system: IDEAS_SYSTEM_PROMPT,
      user: buildIdeasPrompt(input, { count, refinement, exclude }),
      maxTokens: more ? AI_CONFIG.maxOutputTokens.more : AI_CONFIG.maxOutputTokens.ideas,
      schema,
      check: (data) => checkModeRules(data.ideas, input, { fullSet: !more }),
    },
    deps,
  );
  if (!result.ok) return { ok: false, error: toUserError(result.errors, { usedByok: !!opts.byokKey }) };

  const processed = postProcessIdeas(result.data.ideas, input, effectiveBudget(input).max, exclude);
  return { ok: true, data: { summary: result.data.summary, ...processed } };
}

export async function generateCardMessages(
  input: ParsedGiftInput,
  idea: { title: string; whyItFits: string },
  tone: ToneId,
  language: LanguageId,
  byokKey: string | null,
): Promise<ServiceResult<{ messages: string[] }>> {
  const deps = providersFor(byokKey, () => mockCardMessages(input, tone, language));
  const result = await runWithFallback(
    {
      system: CARD_SYSTEM_PROMPT,
      user: buildCardPrompt(input, idea, tone, language),
      maxTokens: AI_CONFIG.maxOutputTokens.card,
      schema: CardResponseSchema,
    },
    deps,
  );
  if (!result.ok) return { ok: false, error: toUserError(result.errors, { usedByok: !!byokKey }) };
  return { ok: true, data: { messages: result.data.messages.map((m) => m.trim()) } };
}

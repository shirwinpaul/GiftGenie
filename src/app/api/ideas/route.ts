import { parseAiRequest, errorResponse, okResponse } from "@/lib/api";
import { generateIdeas } from "@/lib/ai/service";
import { IdeasRequestSchema } from "@/lib/schemas";

// Allowed on the Vercel Hobby plan. The AI runner stops itself before this (see AI_CONFIG).
export const maxDuration = 60;

/** Main ideas (8), refined ideas (8) or "more ideas" (4). One request = one AI call chain. */
export async function POST(req: Request) {
  const parsed = await parseAiRequest(req, IdeasRequestSchema);
  if (!parsed.ok) return parsed.response;

  const { input, action, refinement, exclude } = parsed.body;
  const result = await generateIdeas(input, { action, refinement, exclude, byokKey: parsed.byokKey });
  return result.ok ? okResponse(result.data) : errorResponse(result.error);
}

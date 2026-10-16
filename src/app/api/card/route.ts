import { parseAiRequest, errorResponse, okResponse } from "@/lib/api";
import { generateCardMessages } from "@/lib/ai/service";
import { CardRequestSchema } from "@/lib/schemas";

export const maxDuration = 60;

/** On-demand: 3 card messages for one idea in the chosen tone + language. */
export async function POST(req: Request) {
  const parsed = await parseAiRequest(req, CardRequestSchema);
  if (!parsed.ok) return parsed.response;

  const { input, idea, tone, language } = parsed.body;
  const result = await generateCardMessages(input, idea, tone, language, parsed.byokKey);
  return result.ok ? okResponse(result.data) : errorResponse(result.error);
}

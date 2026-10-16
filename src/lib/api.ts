import type { z } from "zod";
import { BYOK_HEADER } from "@/config/ai";
import { checkRateLimit } from "./rateLimit";
import { USER_MESSAGES, type UserError, type UserErrorCode } from "./ai/errors";

/** Requests are small text-only JSON (far below Vercel's ~4.5 MB body limit). */
export const MAX_BODY_BYTES = 16_000;

const STATUS: Record<UserErrorCode, number> = {
  RATE_LIMIT: 429,
  TOO_MANY_REQUESTS: 429,
  DAILY_QUOTA: 429,
  BAD_KEY: 401,
  NOT_CONFIGURED: 503,
  INVALID_INPUT: 400,
  AI_UNAVAILABLE: 503,
};

export function errorResponse(error: UserError): Response {
  return Response.json(
    { ok: false, error },
    {
      status: STATUS[error.code],
      headers: error.retryAfter ? { "Retry-After": String(error.retryAfter) } : undefined,
    },
  );
}

export function okResponse<T>(data: T): Response {
  return Response.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

/**
 * Shared guard for AI routes: per-IP rate limit, body size limit, JSON + Zod validation,
 * BYOK header check. Returns either the parsed body or a ready error Response.
 */
export async function parseAiRequest<S extends z.ZodType>(
  req: Request,
  schema: S,
): Promise<{ ok: true; body: z.output<S>; byokKey: string | null } | { ok: false; response: Response }> {
  const limit = checkRateLimit(clientIp(req));
  if (!limit.ok) {
    return {
      ok: false,
      response: errorResponse({
        code: "TOO_MANY_REQUESTS",
        message: USER_MESSAGES.TOO_MANY_REQUESTS,
        retryAfter: Math.min(limit.retryAfterSec, 3600),
      }),
    };
  }

  const invalid = () => ({
    ok: false as const,
    response: errorResponse({ code: "INVALID_INPUT", message: USER_MESSAGES.INVALID_INPUT }),
  });

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return invalid();
  }
  if (raw.length > MAX_BODY_BYTES) return invalid();

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return invalid();
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return invalid();

  const byok = req.headers.get(BYOK_HEADER)?.trim() || null;
  if (byok && !/^[A-Za-z0-9_-]{20,100}$/.test(byok)) {
    return { ok: false, response: errorResponse({ code: "BAD_KEY", message: USER_MESSAGES.BAD_KEY }) };
  }
  return { ok: true, body: parsed.data, byokKey: byok };
}

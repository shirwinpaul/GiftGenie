"use client";

import { BYOK_HEADER } from "@/config/ai";
import { getByokKey } from "@/hooks/useByokKey";
import { USER_MESSAGES, type UserError } from "./ai/errors";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: UserError };

const CLIENT_TIMEOUT_MS = 70_000;

/** POST JSON to one of our AI routes. Never throws; always returns a friendly error. */
export async function postAi<T>(path: "/api/ideas" | "/api/card", body: unknown): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const key = getByokKey();
    if (key) headers[BYOK_HEADER] = key;
    const res = await fetch(path, { method: "POST", headers, body: JSON.stringify(body), signal: controller.signal });
    const json = (await res.json().catch(() => null)) as ApiResult<T> | null;
    if (json && typeof json === "object" && "ok" in json) return json;
    return { ok: false, error: { code: "AI_UNAVAILABLE", message: USER_MESSAGES.AI_UNAVAILABLE } };
  } catch {
    return {
      ok: false,
      error: {
        code: "AI_UNAVAILABLE",
        message: navigator.onLine === false ? "You seem to be offline. Check your connection and try again." : USER_MESSAGES.AI_UNAVAILABLE,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Ask the header to open the Settings dialog (used by the daily-quota message). */
export function openSettings() {
  window.dispatchEvent(new Event("gg:open-settings"));
}

"use client";

import { useStoredValue } from "./useStoredValue";
import { STORAGE_KEYS, readJSON } from "@/lib/storage";

const validate = (v: unknown) => (typeof v === "string" ? v : null);

/** The user's own Gemini key (Bring Your Own Key), stored only in this browser. */
export function useByokKey() {
  return useStoredValue<string>(STORAGE_KEYS.byok, "", validate);
}

/** Read the key outside React (used when sending a request). */
export function getByokKey(): string {
  const v = readJSON<unknown>(STORAGE_KEYS.byok, "");
  return typeof v === "string" ? v : "";
}

/** Loose format check only — the real check happens when Google receives it. */
export function looksLikeGeminiKey(key: string): boolean {
  return /^[A-Za-z0-9_-]{20,100}$/.test(key.trim());
}

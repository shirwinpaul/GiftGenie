/**
 * Tiny wrapper around localStorage.
 * - Never throws (private mode / blocked storage falls back to memory).
 * - Notifies subscribers in this tab so hooks re-render after writes.
 */
export const STORAGE_KEYS = {
  answers: "gg:answers:v1",
  step: "gg:step:v1",
  results: "gg:results:v1",
  saved: "gg:saved:v1",
  reminders: "gg:reminders:v1",
  byok: "gg:byok-gemini",
  theme: "gg:theme",
} as const;

const memory = new Map<string, string>();
const listeners = new Set<() => void>();

export function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

export function writeRaw(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    if (value === null) memory.delete(key);
    else memory.set(key, value);
  }
  listeners.forEach((l) => l());
}

export function readJSON<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  writeRaw(key, JSON.stringify(value));
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

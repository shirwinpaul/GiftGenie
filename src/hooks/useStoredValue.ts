"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { readRaw, subscribe, writeJSON, writeRaw } from "@/lib/storage";

const getServerSnapshot = () => null;

/**
 * Read/write a JSON value in localStorage, shared across components.
 * `fallback` must be a stable value (define it at module level).
 * `validate` lets callers reject old/corrupt data and use the fallback instead.
 */
export function useStoredValue<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => T | null,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), getServerSnapshot);

  const value = useMemo(() => parse(raw, fallback, validate), [raw, fallback, validate]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parse(readRaw(key), fallback, validate);
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      writeJSON(key, resolved);
    },
    [key, fallback, validate],
  );

  const clear = useCallback(() => writeRaw(key, null), [key]);

  return [value, setValue, clear];
}

function parse<T>(raw: string | null, fallback: T, validate?: (v: unknown) => T | null): T {
  if (raw === null) return fallback;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (!validate) return parsed as T;
  return validate(parsed) ?? fallback;
}

/** True once the component runs in the browser (after hydration). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
const noopSubscribe = () => () => {};

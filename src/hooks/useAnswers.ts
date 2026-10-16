"use client";

import { useCallback, useMemo } from "react";
import { useIsClient, useStoredValue } from "./useStoredValue";
import { DEFAULT_ANSWERS, sanitizeAnswers, WIZARD_STEPS, type Answers } from "@/lib/answers";
import { countryFromLocale } from "@/lib/locale";
import { STORAGE_KEYS } from "@/lib/storage";
import { DEFAULT_COUNTRY_CODE } from "@/data/countries";

const validateStep = (v: unknown) =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v < WIZARD_STEPS.length ? v : null;

/** Wizard answers + current step, remembered in localStorage. */
export function useAnswers() {
  const [stored, setStored, clearAnswers] = useStoredValue(STORAGE_KEYS.answers, DEFAULT_ANSWERS, sanitizeAnswers);
  const [step, setStep, clearStep] = useStoredValue(STORAGE_KEYS.step, 0, validateStep);
  const isClient = useIsClient();

  // Until the user picks a country, pre-fill it from the browser locale (fallback: India).
  const detected = isClient ? countryFromLocale(navigator.language) : DEFAULT_COUNTRY_CODE;
  const answers = useMemo<Answers>(
    () => (stored.countryCode ? stored : { ...stored, countryCode: detected }),
    [stored, detected],
  );

  const update = useCallback(
    (patch: Partial<Answers>) =>
      setStored((prev) => ({ ...prev, countryCode: prev.countryCode || detected, ...patch })),
    [setStored, detected],
  );

  const reset = useCallback(() => {
    clearAnswers();
    clearStep();
  }, [clearAnswers, clearStep]);

  return { answers, update, step, setStep, reset, ready: isClient };
}

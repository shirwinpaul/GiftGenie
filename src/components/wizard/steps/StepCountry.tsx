"use client";

import { CountryPicker } from "../CountryPicker";
import { withCountry } from "@/lib/answers";
import type { StepProps } from "./types";

export function StepCountry({ answers, update }: StepProps) {
  return (
    <div>
      <p className="muted mb-4">
        We use this for your currency and the shops we link to. We guessed it from your browser — change
        it if needed.
      </p>
      <CountryPicker value={answers.countryCode} onChange={(code) => update(withCountry(answers, code))} />
    </div>
  );
}

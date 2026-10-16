"use client";

import { OptionCard } from "@/components/ui/OptionCard";
import { LANGUAGES } from "@/config/options";
import type { StepProps } from "./types";

export function StepLanguage({ answers, update }: StepProps) {
  return (
    <div className="space-y-3">
      <p className="muted">Card messages will be written in this language. You can switch later too.</p>
      <div role="group" aria-label="Card message language" className="grid gap-3 sm:grid-cols-3">
        {LANGUAGES.map((l) => (
          <OptionCard
            key={l.id}
            emoji={l.emoji}
            label={l.label}
            selected={answers.cardLanguage === l.id}
            onClick={() => update({ cardLanguage: l.id })}
          >
            <span lang={l.id} className="muted text-sm font-normal">
              {l.sample}
            </span>
          </OptionCard>
        ))}
      </div>
    </div>
  );
}

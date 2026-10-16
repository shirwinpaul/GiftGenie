"use client";

import { Chip } from "@/components/ui/Chip";
import { OptionCard } from "@/components/ui/OptionCard";
import { AGE_RANGES, GENDERS } from "@/config/options";
import type { StepProps } from "./types";

export function StepAge({ answers, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div role="group" aria-label="Age range" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {AGE_RANGES.map((a) => (
          <OptionCard
            key={a.id}
            emoji={a.emoji}
            label={a.label}
            selected={answers.ageRange === a.id}
            onClick={() => update({ ageRange: a.id })}
          />
        ))}
      </div>

      <fieldset>
        <legend className="label">
          Gender <span className="font-normal">(optional — ideas are based on interests first)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Chip
              key={g.id}
              size="sm"
              selected={answers.gender === g.id}
              onClick={() => update({ gender: answers.gender === g.id ? "" : g.id })}
            >
              {g.label}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

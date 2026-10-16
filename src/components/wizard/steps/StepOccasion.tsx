"use client";

import { Chip } from "@/components/ui/Chip";
import { OCCASIONS, OTHER } from "@/config/options";
import { OTHER_TEXT_MAX } from "@/lib/answers";
import type { StepProps } from "./types";

export function StepOccasion({ answers, update }: StepProps) {
  return (
    <div className="space-y-4">
      <div role="group" aria-label="Occasion" className="flex flex-wrap gap-2">
        {OCCASIONS.map((o) => (
          <Chip key={o.id} emoji={o.emoji} selected={answers.occasion === o.id} onClick={() => update({ occasion: o.id })}>
            {o.label}
          </Chip>
        ))}
      </div>
      {answers.occasion === OTHER && (
        <div>
          <label htmlFor="occasion-other" className="label">
            What&apos;s the occasion?
          </label>
          <input
            id="occasion-other"
            className="input"
            maxLength={OTHER_TEXT_MAX}
            placeholder="e.g. Retirement, Engagement, Ugadi"
            value={answers.occasionOther}
            onChange={(e) => update({ occasionOther: e.target.value })}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { Toggle } from "@/components/ui/Toggle";
import { getCountry } from "@/data/countries";
import { AVOID_MAX } from "@/lib/answers";
import { formatRange } from "@/lib/currency";
import { clampPeople, combinedBudget, GROUP_MAX, GROUP_MIN } from "@/lib/group";
import type { StepProps } from "./types";

export function StepModes({ answers, update }: StepProps) {
  const { currency } = getCountry(answers.countryCode);
  const people = clampPeople(answers.groupPeople);
  const total = combinedBudget(answers.budgetMin ?? 0, answers.budgetMax ?? 0, people);

  return (
    <div className="space-y-3">
      <p className="muted">All optional. Switch on anything that helps.</p>
      <Toggle
        icon="⚡"
        title="Last-minute mode"
        description="Only ideas you can get TODAY: local shops, e-gift cards, digital gifts, same-day experiences, or makes under 2 hours."
        checked={answers.lastMinute}
        onChange={(v) => update({ lastMinute: v })}
      />
      <Toggle
        icon="✂️"
        title="DIY mode"
        description="Include handmade ideas with materials, simple steps, time needed and material cost."
        checked={answers.diy}
        onChange={(v) => update({ diy: v })}
      />
      <Toggle
        icon="🎟️"
        title="Experience gifts"
        description="Include classes, workshops, events, trips and memberships."
        checked={answers.experience}
        onChange={(v) => update({ experience: v })}
      />
      <Toggle
        icon="👥"
        title="Group gift"
        description="Friends chip in together. Your budget is each person's share; ideas can use the combined budget."
        checked={answers.groupEnabled}
        onChange={(v) => update({ groupEnabled: v })}
      >
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="group-people" className="label mb-0">
            People sharing
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn-secondary px-3"
              aria-label="Fewer people"
              onClick={() => update({ groupPeople: clampPeople(people - 1) })}
              disabled={people <= GROUP_MIN}
            >
              −
            </button>
            <select
              id="group-people"
              className="input w-20 text-center"
              value={people}
              onChange={(e) => update({ groupPeople: clampPeople(Number(e.target.value)) })}
              aria-describedby="group-help"
            >
              {Array.from({ length: GROUP_MAX - GROUP_MIN + 1 }, (_, i) => GROUP_MIN + i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-secondary px-3"
              aria-label="More people"
              onClick={() => update({ groupPeople: clampPeople(people + 1) })}
              disabled={people >= GROUP_MAX}
            >
              +
            </button>
          </div>
          <p id="group-help" className="muted w-full text-sm">
            {GROUP_MIN}–{GROUP_MAX} people. Combined budget:{" "}
            <strong>{formatRange(total.min, total.max, currency)}</strong>
          </p>
        </div>
      </Toggle>

      <div className="card p-4">
        <label htmlFor="avoid" className="label">
          <span aria-hidden>🚫</span> Avoid box <span className="font-normal">(optional)</span>
        </label>
        <textarea
          id="avoid"
          className="input min-h-20"
          maxLength={AVOID_MAX}
          placeholder="Things they already have or dislike, e.g. mugs, perfume, chocolates"
          value={answers.avoid}
          onChange={(e) => update({ avoid: e.target.value })}
          aria-describedby="avoid-count"
        />
        <p id="avoid-count" className="muted mt-1 text-right text-xs">
          {answers.avoid.length}/{AVOID_MAX}
        </p>
      </div>
    </div>
  );
}

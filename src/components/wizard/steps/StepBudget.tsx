"use client";

import { Chip } from "@/components/ui/Chip";
import { getBudgetPresets, MAX_BUDGET_VALUE } from "@/config/budgets";
import { getCountry } from "@/data/countries";
import { formatMoney, formatRange } from "@/lib/currency";
import type { StepProps } from "./types";

function parseAmount(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.min(n, MAX_BUDGET_VALUE) : null;
}

export function StepBudget({ answers, update }: StepProps) {
  const { currency } = getCountry(answers.countryCode);
  const presets = getBudgetPresets(currency);

  return (
    <div className="space-y-5">
      <p className="muted">
        Amounts are in <strong>{currency}</strong>. Ideas will stay within this range (or be marked “Slightly
        over budget”).
      </p>

      {presets && (
        <div role="group" aria-label="Budget presets" className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <Chip
              key={`${p.min}-${p.max}`}
              selected={answers.budgetMin === p.min && answers.budgetMax === p.max}
              onClick={() => update({ budgetMin: p.min, budgetMax: p.max })}
            >
              {p.min === 0 ? `Up to ${formatMoney(p.max, currency)}` : formatRange(p.min, p.max, currency)}
            </Chip>
          ))}
        </div>
      )}

      <fieldset>
        <legend className="label">{presets ? "Or enter your own range" : "Enter your budget range"}</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="budget-min" className="muted mb-1 block text-sm">
              Minimum ({currency})
            </label>
            <input
              id="budget-min"
              className="input"
              inputMode="decimal"
              placeholder="0"
              value={answers.budgetMin ?? ""}
              onChange={(e) => update({ budgetMin: parseAmount(e.target.value) })}
            />
          </div>
          <div>
            <label htmlFor="budget-max" className="muted mb-1 block text-sm">
              Maximum ({currency})
            </label>
            <input
              id="budget-max"
              className="input"
              inputMode="decimal"
              placeholder={presets ? String(presets[2].max) : "100"}
              value={answers.budgetMax ?? ""}
              onChange={(e) => update({ budgetMax: parseAmount(e.target.value) })}
            />
          </div>
        </div>
        {answers.budgetMin !== null && answers.budgetMax !== null && answers.budgetMax > 0 && (
          <p className="mt-2 text-sm font-semibold text-teal-800 dark:text-teal-200" aria-live="polite">
            Budget: {formatRange(answers.budgetMin, answers.budgetMax, currency)}
          </p>
        )}
      </fieldset>
    </div>
  );
}

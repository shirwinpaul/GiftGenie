"use client";

import { AGE_RANGES, GENDERS, LANGUAGES, labelFor } from "@/config/options";
import { getCountry } from "@/data/countries";
import { occasionLabel, relationshipLabel, WIZARD_STEPS, type StepId } from "@/lib/answers";
import { formatRange } from "@/lib/currency";
import { clampPeople } from "@/lib/group";
import type { StepProps } from "./types";

export function StepReview({ answers, onEdit }: StepProps & { onEdit: (step: number) => void }) {
  const country = getCountry(answers.countryCode);
  const modes = [
    answers.lastMinute && "⚡ Last-minute",
    answers.diy && "✂️ DIY",
    answers.experience && "🎟️ Experiences",
    answers.groupEnabled && `👥 Group gift (${clampPeople(answers.groupPeople)} people)`,
  ].filter(Boolean);

  const rows: { step: StepId; label: string; value: string }[] = [
    { step: "country", label: "Country", value: `${country.flag} ${country.name} (${country.currency})` },
    {
      step: "who",
      label: "For",
      value: relationshipLabel(answers) + (answers.nickname.trim() ? ` · “${answers.nickname.trim()}”` : ""),
    },
    {
      step: "age",
      label: "Age",
      value:
        labelFor(AGE_RANGES, answers.ageRange) +
        (answers.gender && answers.gender !== "unspecified" ? ` · ${labelFor(GENDERS, answers.gender)}` : ""),
    },
    {
      step: "interests",
      label: "Loves",
      value: answers.interests.join(", ") + (answers.personality.length ? ` · ${answers.personality.join(", ")}` : ""),
    },
    { step: "occasion", label: "Occasion", value: occasionLabel(answers) },
    {
      step: "budget",
      label: answers.groupEnabled ? "Budget (each)" : "Budget",
      value: formatRange(answers.budgetMin ?? 0, answers.budgetMax ?? 0, country.currency),
    },
    {
      step: "modes",
      label: "Modes",
      value: (modes.length ? modes.join(" · ") : "None") + (answers.avoid.trim() ? ` · Avoid: ${answers.avoid.trim()}` : ""),
    },
    { step: "language", label: "Card language", value: labelFor(LANGUAGES, answers.cardLanguage) },
  ];

  return (
    <dl className="card divide-y divide-royal-100 dark:divide-royal-800">
      {rows.map((r) => (
        <div key={r.step} className="flex items-start gap-3 p-3 sm:p-4">
          <dt className="w-28 shrink-0 text-sm font-semibold text-royal-800 dark:text-royal-200">{r.label}</dt>
          <dd className="min-w-0 flex-1 break-words">{r.value}</dd>
          <button
            type="button"
            className="btn-ghost -my-1 min-h-9 px-2 py-1 text-sm"
            onClick={() => onEdit(WIZARD_STEPS.findIndex((s) => s.id === r.step))}
            aria-label={`Edit ${r.label}`}
          >
            Edit
          </button>
        </div>
      ))}
    </dl>
  );
}

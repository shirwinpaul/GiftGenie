"use client";

import { OptionCard } from "@/components/ui/OptionCard";
import { OTHER, RELATIONSHIPS } from "@/config/options";
import { NICKNAME_MAX, OTHER_TEXT_MAX } from "@/lib/answers";
import type { StepProps } from "./types";

export function StepWho({ answers, update }: StepProps) {
  return (
    <div className="space-y-5">
      <div role="group" aria-label="Relationship" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {RELATIONSHIPS.map((r) => (
          <OptionCard
            key={r.id}
            emoji={r.emoji}
            label={r.label}
            selected={answers.relationship === r.id}
            onClick={() => update({ relationship: r.id })}
          />
        ))}
      </div>

      {answers.relationship === OTHER && (
        <div>
          <label htmlFor="rel-other" className="label">
            Who is it for?
          </label>
          <input
            id="rel-other"
            className="input"
            maxLength={OTHER_TEXT_MAX}
            placeholder="e.g. Neighbour, Cousin, Coach"
            value={answers.relationshipOther}
            onChange={(e) => update({ relationshipOther: e.target.value })}
            autoFocus
          />
        </div>
      )}

      <div>
        <label htmlFor="nickname" className="label">
          Nickname for the card message <span className="font-normal">(optional)</span>
        </label>
        <input
          id="nickname"
          className="input"
          maxLength={NICKNAME_MAX}
          placeholder="e.g. Ammu, Bestie, Champ"
          value={answers.nickname}
          onChange={(e) => update({ nickname: e.target.value })}
          aria-describedby="nickname-help"
        />
        <p id="nickname-help" className="muted mt-1 text-xs">
          Only used in card messages. No real names needed.
        </p>
      </div>
    </div>
  );
}

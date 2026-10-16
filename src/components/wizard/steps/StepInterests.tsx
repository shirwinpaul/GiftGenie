"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { INTERESTS, MAX_INTERESTS, PERSONALITIES, type PersonalityId } from "@/config/options";
import { OTHER_TEXT_MAX } from "@/lib/answers";
import type { StepProps } from "./types";

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function StepInterests({ answers, update }: StepProps) {
  const [custom, setCustom] = useState("");
  const known = new Set(INTERESTS.map((i) => i.id));
  const customInterests = answers.interests.filter((i) => !known.has(i));
  const atMax = answers.interests.length >= MAX_INTERESTS;

  function addCustom() {
    const value = custom.trim().slice(0, OTHER_TEXT_MAX);
    if (!value || atMax) return;
    const exists = answers.interests.some((i) => i.toLowerCase() === value.toLowerCase());
    if (!exists) update({ interests: [...answers.interests, value] });
    setCustom("");
  }

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="label">
          Interests <span className="font-normal">(pick at least 1, up to {MAX_INTERESTS})</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const selected = answers.interests.includes(i.id);
            return (
              <Chip
                key={i.id}
                emoji={i.emoji}
                selected={selected}
                disabled={!selected && atMax}
                onClick={() => update({ interests: toggle(answers.interests, i.id) })}
              >
                {i.label}
              </Chip>
            );
          })}
          {customInterests.map((i) => (
            <Chip key={i} emoji="✨" selected onClick={() => update({ interests: toggle(answers.interests, i) })}>
              {i}
            </Chip>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <label htmlFor="custom-interest" className="sr-only">
            Add your own interest
          </label>
          <input
            id="custom-interest"
            className="input"
            maxLength={OTHER_TEXT_MAX}
            placeholder="Add your own, e.g. Chess, K-pop, Bonsai"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              // Enter adds the interest instead of moving to the next step.
              if (e.key === "Enter" && custom.trim()) {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <button type="button" className="btn-secondary shrink-0" onClick={addCustom} disabled={!custom.trim() || atMax}>
            Add
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">
          Personality <span className="font-normal">(optional, pick any)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {PERSONALITIES.map((p) => (
            <Chip
              key={p.id}
              size="sm"
              emoji={p.emoji}
              selected={answers.personality.includes(p.id)}
              onClick={() => update({ personality: toggle<PersonalityId>(answers.personality, p.id) })}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

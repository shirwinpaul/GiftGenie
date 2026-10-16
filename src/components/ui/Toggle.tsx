"use client";

import { useId, type ReactNode } from "react";

/** Accessible on/off switch with a title and description. */
export function Toggle({
  checked,
  onChange,
  title,
  description,
  icon,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
  icon: string;
  children?: ReactNode;
}) {
  const id = useId();
  return (
    <div
      className={`card p-4 transition ${checked ? "border-royal-400 ring-2 ring-royal-200 dark:border-royal-500 dark:ring-royal-800" : ""}`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-2xl">
          {icon}
        </span>
        <div className="flex-1">
          <p id={`${id}-t`} className="font-semibold">
            {title}
          </p>
          <p id={`${id}-d`} className="muted text-sm">
            {description}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-d`}
          onClick={() => onChange(!checked)}
          className={`relative h-8 w-14 shrink-0 cursor-pointer rounded-full transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
            checked ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600"
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-7" : "left-1"}`}
          />
        </button>
      </div>
      {checked && children && <div className="mt-3 border-t border-royal-100 pt-3 dark:border-royal-800">{children}</div>}
    </div>
  );
}

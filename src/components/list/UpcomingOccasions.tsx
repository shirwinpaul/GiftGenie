"use client";

import { useState } from "react";
import { useStoredValue } from "@/hooks/useStoredValue";
import { STORAGE_KEYS } from "@/lib/storage";
import { daysLabel, daysUntil, sortByUpcoming, validateReminders, type Reminder } from "@/lib/reminders";

const EMPTY: Reminder[] = [];

export function UpcomingOccasions() {
  const [reminders, setReminders] = useStoredValue<Reminder[]>(STORAGE_KEYS.reminders, EMPTY, validateReminders);
  const [person, setPerson] = useState("");
  const [occasion, setOccasion] = useState("");
  const [date, setDate] = useState("");
  const [yearly, setYearly] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function add() {
    if (!person.trim() || !occasion.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Please fill in who, the occasion and the date.");
      return;
    }
    const r: Reminder = {
      id: `rem-${Date.now().toString(36)}`,
      person: person.trim().slice(0, 40),
      occasion: occasion.trim().slice(0, 40),
      date,
      yearly,
    };
    setReminders((prev) => [...prev, r].slice(-50));
    setPerson("");
    setOccasion("");
    setDate("");
    setError(null);
  }

  const sorted = sortByUpcoming(reminders);

  return (
    <section aria-labelledby="upcoming-heading" className="card p-4 sm:p-5">
      <h2 id="upcoming-heading" className="text-2xl font-semibold text-royal-800 dark:text-royal-100">
        📅 Upcoming occasions
      </h2>
      <p className="muted mt-1 text-sm">A simple countdown, saved in this browser. No notifications.</p>

      {sorted.length > 0 && (
        <ul className="mt-4 space-y-2">
          {sorted.map((r) => {
            const days = daysUntil(r);
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-xl border border-royal-100 p-3 dark:border-royal-800">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {r.person} · {r.occasion}
                  </p>
                  <p className="muted text-sm">
                    {new Date(`${r.date}T00:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short", year: r.yearly ? undefined : "numeric" })}
                    {r.yearly ? " · every year" : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    days >= 0 && days <= 7
                      ? "bg-gold-200 text-gold-600 dark:bg-gold-600/30 dark:text-gold-200"
                      : "bg-teal-100 text-teal-900 dark:bg-teal-900 dark:text-teal-100"
                  }`}
                >
                  {daysLabel(days)}
                </span>
                <button
                  type="button"
                  className="btn-ghost min-h-9 px-2 py-1"
                  onClick={() => setReminders((prev) => prev.filter((x) => x.id !== r.id))}
                  aria-label={`Delete reminder for ${r.person}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <div>
          <label htmlFor="rem-person" className="label">
            Who
          </label>
          <input id="rem-person" className="input" maxLength={40} placeholder="e.g. Mom" value={person} onChange={(e) => setPerson(e.target.value)} />
        </div>
        <div>
          <label htmlFor="rem-occasion" className="label">
            Occasion
          </label>
          <input
            id="rem-occasion"
            className="input"
            maxLength={40}
            placeholder="e.g. Birthday"
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="rem-date" className="label">
            Date
          </label>
          <input id="rem-date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex items-end gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-5 w-5 accent-royal-600" checked={yearly} onChange={(e) => setYearly(e.target.checked)} />
            Repeats every year
          </label>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700 sm:col-span-2 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">
            ➕ Add reminder
          </button>
        </div>
      </form>
    </section>
  );
}

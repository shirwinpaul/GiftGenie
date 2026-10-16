import { z } from "zod";

/** "Upcoming occasions" mini-reminder, stored only in this browser. No notifications. */
export interface Reminder {
  id: string;
  person: string;
  occasion: string;
  date: string; // YYYY-MM-DD
  yearly: boolean;
}

const ReminderSchema = z.object({
  id: z.string(),
  person: z.string().max(40),
  occasion: z.string().max(40),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  yearly: z.boolean(),
});

export function validateReminders(v: unknown): Reminder[] | null {
  if (!Array.isArray(v)) return null;
  return v.flatMap((r) => {
    const p = ReminderSchema.safeParse(r);
    return p.success ? [p.data] : [];
  });
}

function parseLocalDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Days until the occasion (0 = today). Yearly reminders roll over to the next year once
 * the date has passed; one-off dates in the past return a negative number.
 */
export function daysUntil(r: Pick<Reminder, "date" | "yearly">, today = new Date()): number {
  const t = startOfDay(today);
  let target = parseLocalDate(r.date);
  if (r.yearly) {
    target = new Date(t.getFullYear(), target.getMonth(), target.getDate());
    if (target < t) target = new Date(t.getFullYear() + 1, target.getMonth(), target.getDate());
  }
  return Math.round((startOfDay(target).getTime() - t.getTime()) / DAY);
}

export function daysLabel(days: number): string {
  if (days === 0) return "Today! 🎉";
  if (days === 1) return "Tomorrow";
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} ago`;
  return `In ${days} days`;
}

export function sortByUpcoming(reminders: Reminder[], today = new Date()): Reminder[] {
  return [...reminders].sort((a, b) => {
    const da = daysUntil(a, today);
    const db = daysUntil(b, today);
    // Past one-off dates go last.
    if ((da < 0) !== (db < 0)) return da < 0 ? 1 : -1;
    return da - db;
  });
}

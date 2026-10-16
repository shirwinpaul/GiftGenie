import { describe, expect, it } from "vitest";
import { daysLabel, daysUntil, sortByUpcoming, validateReminders, type Reminder } from "@/lib/reminders";

const today = new Date(2026, 9, 16); // 16 Oct 2026, local time

describe("upcoming occasions", () => {
  it("counts days to a one-off date", () => {
    expect(daysUntil({ date: "2026-10-16", yearly: false }, today)).toBe(0);
    expect(daysUntil({ date: "2026-10-26", yearly: false }, today)).toBe(10);
    expect(daysUntil({ date: "2026-10-10", yearly: false }, today)).toBe(-6);
  });

  it("rolls yearly dates over to next year", () => {
    expect(daysUntil({ date: "1990-10-17", yearly: true }, today)).toBe(1);
    expect(daysUntil({ date: "1990-10-15", yearly: true }, today)).toBe(364);
  });

  it("labels days", () => {
    expect(daysLabel(0)).toMatch(/Today/);
    expect(daysLabel(1)).toBe("Tomorrow");
    expect(daysLabel(5)).toBe("In 5 days");
    expect(daysLabel(-2)).toBe("2 days ago");
  });

  it("sorts soonest first with past one-offs last", () => {
    const r = (id: string, date: string, yearly = false): Reminder => ({ id, person: "P", occasion: "O", date, yearly });
    const sorted = sortByUpcoming([r("past", "2026-01-01"), r("far", "2026-12-25"), r("soon", "1990-10-20", true)], today);
    expect(sorted.map((x) => x.id)).toEqual(["soon", "far", "past"]);
  });

  it("validates stored reminders", () => {
    expect(validateReminders([{ id: "a", person: "P", occasion: "O", date: "2026-01-01", yearly: true }, { bad: 1 }])).toHaveLength(1);
    expect(validateReminders({})).toBeNull();
  });
});

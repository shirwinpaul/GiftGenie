export const GROUP_MIN = 2;
export const GROUP_MAX = 30;

export function clampPeople(people: number): number {
  if (!Number.isFinite(people)) return GROUP_MIN;
  return Math.min(GROUP_MAX, Math.max(GROUP_MIN, Math.round(people)));
}

/**
 * Each person's share of a gift's price range. Shares are rounded UP to whole units,
 * so the group always collects at least the full price.
 */
export function groupShare(priceMin: number, priceMax: number, people: number) {
  const n = clampPeople(people);
  return {
    people: n,
    min: Math.ceil(Math.max(0, priceMin) / n),
    max: Math.ceil(Math.max(0, priceMax) / n),
  };
}

/** In group mode the budget the user enters is per person; ideas may use the total. */
export function combinedBudget(min: number, max: number, people: number) {
  const n = clampPeople(people);
  return { min: min * n, max: max * n };
}

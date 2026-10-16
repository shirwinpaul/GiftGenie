/**
 * Budget preset chips for common currencies. Other currencies get a free min/max input.
 */
export interface BudgetPreset {
  min: number;
  max: number;
}

const p = (pairs: [number, number][]): BudgetPreset[] => pairs.map(([min, max]) => ({ min, max }));

export const BUDGET_PRESETS: Record<string, BudgetPreset[]> = {
  INR: p([[0, 500], [500, 1000], [1000, 2000], [2000, 5000], [5000, 10000], [10000, 25000]]),
  USD: p([[0, 15], [15, 30], [30, 50], [50, 100], [100, 200], [200, 500]]),
  GBP: p([[0, 10], [10, 25], [25, 50], [50, 100], [100, 200], [200, 400]]),
  EUR: p([[0, 15], [15, 30], [30, 50], [50, 100], [100, 200], [200, 400]]),
  AED: p([[0, 50], [50, 100], [100, 200], [200, 400], [400, 800], [800, 1500]]),
  SGD: p([[0, 20], [20, 40], [40, 70], [70, 150], [150, 300], [300, 600]]),
  CAD: p([[0, 20], [20, 40], [40, 70], [70, 150], [150, 300], [300, 600]]),
  AUD: p([[0, 20], [20, 40], [40, 75], [75, 150], [150, 300], [300, 600]]),
  MYR: p([[0, 50], [50, 100], [100, 200], [200, 400], [400, 800], [800, 1500]]),
  LKR: p([[0, 2500], [2500, 5000], [5000, 10000], [10000, 20000], [20000, 50000], [50000, 100000]]),
};

export function getBudgetPresets(currency: string): BudgetPreset[] | null {
  return BUDGET_PRESETS[currency.toUpperCase()] ?? null;
}

/** Upper limit for any custom budget value (keeps inputs sane). */
export const MAX_BUDGET_VALUE = 100_000_000;

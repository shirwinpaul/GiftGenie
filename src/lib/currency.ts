/**
 * Money formatting with Intl.NumberFormat, e.g. ₹1,500 · $25 · £20 · €30.
 * Gift prices are estimates, so whole units are enough.
 */
const LOCALE_FOR_CURRENCY: Record<string, string> = {
  INR: "en-IN",
  GBP: "en-GB",
  EUR: "en-IE",
  USD: "en-US",
  AUD: "en-AU",
  CAD: "en-CA",
  SGD: "en-SG",
  MYR: "en-MY",
  LKR: "en-LK",
  AED: "en-AE",
};

const cache = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  const key = currency.toUpperCase();
  let f = cache.get(key);
  if (!f) {
    try {
      f = new Intl.NumberFormat(LOCALE_FOR_CURRENCY[key] ?? "en-US", {
        style: "currency",
        currency: key,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
        minimumFractionDigits: 0,
      });
    } catch {
      // Unknown currency code: fall back to a plain number with the code.
      const plain = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
      f = { format: (n: number) => `${key} ${plain.format(n)}` } as Intl.NumberFormat;
    }
    cache.set(key, f);
  }
  return f;
}

export function formatMoney(amount: number, currency: string): string {
  if (!Number.isFinite(amount)) return "";
  return formatter(currency).format(Math.round(amount));
}

/** "₹1,000 – ₹2,000", or a single amount when min and max are equal. */
export function formatRange(min: number, max: number, currency: string): string {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  if (Math.round(lo) === Math.round(hi)) return formatMoney(hi, currency);
  return `${formatMoney(lo, currency)} – ${formatMoney(hi, currency)}`;
}

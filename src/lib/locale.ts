import { DEFAULT_COUNTRY_CODE, isKnownCountry } from "@/data/countries";

// Languages that usually mean a specific country when the locale has no region (e.g. "ta").
const LANGUAGE_DEFAULTS: Record<string, string> = {
  hi: "IN", ta: "IN", te: "IN", ml: "IN", kn: "IN", bn: "IN", mr: "IN", gu: "IN", pa: "IN",
  ja: "JP", ko: "KR", de: "DE", fr: "FR", it: "IT", es: "ES", pt: "PT", nl: "NL", sv: "SE",
  pl: "PL", tr: "TR", ms: "MY", si: "LK", zh: "CN", th: "TH", vi: "VN", id: "ID", ar: "AE",
};

/** Guess a country code from a browser locale like "en-GB" or "ta-IN". Falls back to India. */
export function countryFromLocale(locale: string | undefined | null): string {
  if (!locale) return DEFAULT_COUNTRY_CODE;
  const parts = locale.replace("_", "-").split("-");
  // The region is the first 2-letter uppercase-able part after the language.
  const region = parts.slice(1).find((p) => /^[A-Za-z]{2}$/.test(p));
  if (region && isKnownCountry(region)) return region.toUpperCase();
  const lang = parts[0]?.toLowerCase() ?? "";
  return LANGUAGE_DEFAULTS[lang] ?? DEFAULT_COUNTRY_CODE;
}

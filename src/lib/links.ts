import { GOOGLE_SHOPPING, retailersFor } from "@/config/retailers";

export interface SearchLink {
  name: string;
  href: string;
}

/** Country-specific shop search links + Google Shopping as the universal fallback. */
export function buildSearchLinks(searchPhrase: string, countryCode: string): SearchLink[] {
  const phrase = searchPhrase.trim().replace(/\s+/g, " ").slice(0, 120);
  const q = encodeURIComponent(phrase);
  const gl = encodeURIComponent(countryCode.toUpperCase());
  const fill = (url: string) => url.replace("{q}", q).replace("{gl}", gl);
  return [
    ...retailersFor(countryCode).map((r) => ({ name: r.name, href: fill(r.url) })),
    { name: GOOGLE_SHOPPING.name, href: fill(GOOGLE_SHOPPING.url) },
  ];
}

/** WhatsApp share link with a prefilled plain-text message. */
export function whatsappLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

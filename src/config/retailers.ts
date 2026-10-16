/**
 * Shopping SEARCH links per country. Plain search URLs only — no affiliate links.
 * `{q}` is replaced with the URL-encoded search phrase.
 */
export interface Retailer {
  name: string;
  url: string;
}

const etsy: Retailer = { name: "Etsy", url: "https://www.etsy.com/search?q={q}" };
const amazon = (domain: string): Retailer => ({
  name: `Amazon.${domain}`,
  url: `https://www.amazon.${domain}/s?k={q}`,
});

/** Countries with their own Amazon store (domain suffix). */
export const AMAZON_DOMAINS: Record<string, string> = {
  US: "com", GB: "co.uk", IN: "in", CA: "ca", AU: "com.au", DE: "de", FR: "fr", IT: "it",
  ES: "es", NL: "nl", SE: "se", PL: "pl", BE: "com.be", IE: "ie", JP: "co.jp", MX: "com.mx",
  BR: "com.br", AE: "ae", SA: "sa", EG: "eg", SG: "sg", TR: "com.tr", ZA: "co.za",
};

/** Hand-picked retailers that override the default "Amazon + Etsy" rule. */
const SPECIAL: Record<string, Retailer[]> = {
  IN: [amazon("in"), { name: "Flipkart", url: "https://www.flipkart.com/search?q={q}" }],
  US: [amazon("com"), etsy],
  GB: [amazon("co.uk"), etsy],
};

export function retailersFor(countryCode: string): Retailer[] {
  const code = countryCode.toUpperCase();
  if (SPECIAL[code]) return SPECIAL[code];
  const domain = AMAZON_DOMAINS[code];
  return domain ? [amazon(domain), etsy] : [etsy];
}

/** Universal fallback, always offered. `{gl}` is the country code. */
export const GOOGLE_SHOPPING: Retailer = {
  name: "Google Shopping",
  url: "https://www.google.com/search?tbm=shop&q={q}&gl={gl}",
};

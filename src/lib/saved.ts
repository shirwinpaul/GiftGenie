import { z } from "zod";
import { AiIdeaSchema, type Idea } from "./schemas";
import { formatRange } from "./currency";

/** A saved idea in "My Gift List" (browser only). */
export interface SavedItem {
  id: string;
  idea: Idea;
  person: string;
  occasion: string;
  currency: string;
  countryCode: string;
  groupPeople: number | null;
  messages: string[];
  savedAt: number;
}

const SavedItemSchema = z.object({
  id: z.string(),
  idea: AiIdeaSchema.and(z.object({ id: z.string(), wowFactor: z.number() })),
  person: z.string(),
  occasion: z.string(),
  currency: z.string(),
  countryCode: z.string(),
  groupPeople: z.number().nullable(),
  messages: z.array(z.string()),
  savedAt: z.number(),
});

export function validateSaved(v: unknown): SavedItem[] | null {
  if (!Array.isArray(v)) return null;
  // Keep the valid entries even if one is corrupt.
  return v.flatMap((item) => {
    const r = SavedItemSchema.safeParse(item);
    return r.success ? [r.data as SavedItem] : [];
  });
}

export interface SavedGroup {
  key: string;
  person: string;
  occasion: string;
  items: SavedItem[];
}

/** Group saved ideas by person + occasion (newest group first). */
export function groupSaved(items: SavedItem[]): SavedGroup[] {
  const groups = new Map<string, SavedGroup>();
  for (const item of [...items].sort((a, b) => b.savedAt - a.savedAt)) {
    const key = `${item.person.toLowerCase()}|${item.occasion.toLowerCase()}`;
    if (!groups.has(key)) groups.set(key, { key, person: item.person, occasion: item.occasion, items: [] });
    groups.get(key)!.items.push(item);
  }
  return [...groups.values()];
}

/** Plain-text list for "Share list on WhatsApp". */
export function savedListText(items: SavedItem[]): string {
  const lines = ["🎁 My Gift List (from Gift Genie)", ""];
  for (const g of groupSaved(items)) {
    lines.push(`*${g.person} — ${g.occasion}*`);
    for (const i of g.items) {
      lines.push(`• ${i.idea.title} (est. ${formatRange(i.idea.priceMin, i.idea.priceMax, i.currency)})`);
    }
    lines.push("");
  }
  lines.push("Prices are AI estimates.");
  return lines.join("\n");
}

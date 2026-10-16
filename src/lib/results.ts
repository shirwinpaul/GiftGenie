import { z } from "zod";
import { AiIdeaSchema, GiftInputSchema, type GiftInput, type Idea } from "./schemas";

/** The last generated result set, kept in localStorage so a reload doesn't lose it. */
export interface StoredResults {
  id: string;
  input: GiftInput;
  summary: string;
  ideas: Idea[];
  createdAt: number;
}

const IdeaSchema = AiIdeaSchema.and(z.object({ id: z.string(), wowFactor: z.number().int().min(1).max(5) }));
const StoredResultsSchema = z.object({
  id: z.string(),
  input: GiftInputSchema,
  summary: z.string(),
  ideas: z.array(IdeaSchema),
  createdAt: z.number(),
});

export function validateResults(v: unknown): StoredResults | null {
  if (v === null) return null;
  const r = StoredResultsSchema.safeParse(v);
  return r.success ? (r.data as StoredResults) : null;
}

export type SortKey = "recommended" | "price-asc" | "price-desc" | "wow";
export type FilterKey = "all" | Idea["category"] | "last-minute";

export function filterAndSort(ideas: Idea[], filter: FilterKey, sort: SortKey): Idea[] {
  const filtered = ideas.filter((i) =>
    filter === "all" ? true : filter === "last-minute" ? i.lastMinuteFriendly : i.category === filter,
  );
  const mid = (i: Idea) => (i.priceMin + i.priceMax) / 2;
  switch (sort) {
    case "price-asc":
      return [...filtered].sort((a, b) => mid(a) - mid(b));
    case "price-desc":
      return [...filtered].sort((a, b) => mid(b) - mid(a));
    case "wow":
      return [...filtered].sort((a, b) => b.wowFactor - a.wowFactor);
    default:
      return filtered;
  }
}

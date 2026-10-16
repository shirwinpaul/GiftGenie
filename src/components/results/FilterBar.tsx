"use client";

import { Chip } from "@/components/ui/Chip";
import type { FilterKey, SortKey } from "@/lib/results";

const FILTERS: { id: FilterKey; label: string }[] = [
  { id: "all", label: "All" },
  { id: "Thing", label: "Things" },
  { id: "Experience", label: "Experiences" },
  { id: "DIY", label: "DIY" },
  { id: "Digital", label: "Digital" },
  { id: "last-minute", label: "⚡ Last-minute only" },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
  { id: "wow", label: "Wow factor" },
];

export function FilterBar({
  filter,
  sort,
  counts,
  onFilter,
  onSort,
}: {
  filter: FilterKey;
  sort: SortKey;
  counts: Record<FilterKey, number>;
  onFilter: (f: FilterKey) => void;
  onSort: (s: SortKey) => void;
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div role="group" aria-label="Filter ideas" className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 md:flex-wrap">
        {FILTERS.map((f) => (
          <span key={f.id} className="shrink-0">
            <Chip size="sm" selected={filter === f.id} onClick={() => onFilter(f.id)}>
              {f.label} ({counts[f.id]})
            </Chip>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-sm font-semibold">
          Sort
        </label>
        <select id="sort" className="input w-auto py-1.5" value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

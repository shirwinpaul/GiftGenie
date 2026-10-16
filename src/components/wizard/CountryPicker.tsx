"use client";

import { useId, useMemo, useRef, useState } from "react";
import { COUNTRIES, getCountry } from "@/data/countries";

/** Searchable, keyboard-friendly country list (alphabetical). */
export function CountryPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const selected = getCountry(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q || c.currency.toLowerCase() === q,
    );
  }, [query]);

  function choose(code: string) {
    onChange(code);
    setQuery("");
  }

  function move(delta: number) {
    if (filtered.length === 0) return;
    const next = (active + delta + filtered.length) % filtered.length;
    setActive(next);
    listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
  }

  return (
    <div>
      <p className="mb-3 text-lg">
        Selected:{" "}
        <strong className="text-royal-800 dark:text-royal-100">
          <span aria-hidden>{selected.flag}</span> {selected.name} ({selected.currency})
        </strong>
      </p>
      <label htmlFor={`${id}-search`} className="label">
        Search countries
      </label>
      <input
        id={`${id}-search`}
        className="input"
        type="search"
        role="combobox"
        aria-expanded="true"
        aria-controls={`${id}-list`}
        aria-activedescendant={filtered[active] ? `${id}-${filtered[active].code}` : undefined}
        autoComplete="off"
        placeholder="Type a country, e.g. India"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          } else if (e.key === "Enter" && query.trim() && filtered[active]) {
            // While searching, Enter picks the highlighted country instead of going Next.
            e.preventDefault();
            choose(filtered[active].code);
          }
        }}
      />
      <ul
        id={`${id}-list`}
        ref={listRef}
        role="listbox"
        aria-label="Countries"
        className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-royal-100 bg-white/90 p-1 dark:border-royal-800 dark:bg-royal-950/80"
      >
        {filtered.length === 0 && <li className="muted p-3 text-sm">No country matches “{query}”.</li>}
        {filtered.map((c, i) => {
          const isSelected = c.code === selected.code;
          return (
            <li
              key={c.code}
              id={`${id}-${c.code}`}
              role="option"
              aria-selected={isSelected}
              onClick={() => choose(c.code)}
              onMouseEnter={() => setActive(i)}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                isSelected
                  ? "bg-royal-600 text-white"
                  : i === active && query
                    ? "bg-royal-100 dark:bg-royal-800"
                    : "hover:bg-royal-50 dark:hover:bg-royal-900"
              }`}
            >
              <span aria-hidden className="text-xl">
                {c.flag}
              </span>
              <span className="flex-1">{c.name}</span>
              <span className={`text-xs ${isSelected ? "text-white/90" : "muted"}`}>{c.currency}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

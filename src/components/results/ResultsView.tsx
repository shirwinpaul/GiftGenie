"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { GiftBox } from "@/components/illustrations/GiftBox";
import { Chip } from "@/components/ui/Chip";
import { REFINEMENTS, type RefinementId } from "@/config/options";
import { useSavedIdeas } from "@/hooks/useSavedIdeas";
import { formatRange } from "@/lib/currency";
import { filterAndSort, type FilterKey, type SortKey, type StoredResults } from "@/lib/results";
import type { Idea } from "@/lib/schemas";
import type { ShareContext } from "@/lib/share";
import { FilterBar } from "./FilterBar";
import { IdeaCard } from "./IdeaCard";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function celebrate() {
  if (prefersReducedMotion()) return;
  const confetti = (await import("canvas-confetti")).default;
  confetti({
    particleCount: 120,
    spread: 85,
    origin: { y: 0.3 },
    colors: ["#7f3ff0", "#14b8a6", "#fbbf24", "#f6f1ff"],
    disableForReducedMotion: true,
  });
}

export function ResultsView({
  results,
  fresh,
  busy,
  onMore,
  onRefine,
  onEdit,
  onStartOver,
  onCardMessage,
}: {
  results: StoredResults;
  fresh: boolean;
  busy: "more" | "refine" | null;
  onMore: () => void;
  onRefine: (r: RefinementId) => void;
  onEdit: () => void;
  onStartOver: () => void;
  onCardMessage: (idea: Idea) => void;
}) {
  const [revealed, setRevealed] = useState(!fresh);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("recommended");
  const saved = useSavedIdeas();
  const { input } = results;
  const groupPeople = input.modes.groupPeople;

  // Gift-box reveal: wobble, pop the lid, confetti, then show the ideas.
  useEffect(() => {
    if (!fresh) return;
    const delay = prefersReducedMotion() ? 0 : 1100;
    const t = setTimeout(() => {
      setRevealed(true);
      void celebrate();
    }, delay);
    return () => clearTimeout(t);
  }, [fresh]);

  const share: ShareContext = {
    person: input.nickname?.trim() || input.relationship,
    occasion: input.occasion,
    currency: input.currency,
  };
  const saveCtx = {
    person: share.person,
    occasion: input.occasion,
    currency: input.currency,
    countryCode: input.countryCode,
    groupPeople: groupPeople ?? null,
  };

  const visible = useMemo(() => filterAndSort(results.ideas, filter, sort), [results.ideas, filter, sort]);
  const counts = useMemo(() => {
    const c = { all: results.ideas.length, Thing: 0, Experience: 0, DIY: 0, Digital: 0, "last-minute": 0 } as Record<FilterKey, number>;
    for (const i of results.ideas) {
      c[i.category]++;
      if (i.lastMinuteFriendly) c["last-minute"]++;
    }
    return c;
  }, [results.ideas]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="box"
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center py-16"
          >
            <GiftBox className="h-40 w-40 animate-wobble" />
            <p className="mt-4 font-display text-2xl text-royal-800 dark:text-royal-100">Your gifts are ready…</p>
          </motion.div>
        ) : (
          <motion.div key="results" initial={fresh ? { opacity: 0 } : false} animate={{ opacity: 1 }}>
            <header className="mb-5 text-center">
              <GiftBox open className="mx-auto h-16 w-16" />
              <h1 className="mt-2 text-3xl font-semibold text-royal-800 sm:text-4xl dark:text-royal-100">
                Gift ideas for {share.person}
              </h1>
              <p className="mt-2 text-lg">{results.summary}</p>
              <p className="muted mt-1 text-sm">
                {input.occasion} · Budget {formatRange(input.budgetMin, input.budgetMax, input.currency)}
                {groupPeople ? ` each · 👥 ${groupPeople} people` : ""}
              </p>
            </header>

            <p className="sr-only" aria-live="polite">
              {visible.length} gift ideas shown.
            </p>

            <FilterBar filter={filter} sort={sort} counts={counts} onFilter={setFilter} onSort={setSort} />

            {visible.length === 0 ? (
              <p className="card muted mt-5 p-6 text-center">No ideas match this filter. Try “All”.</p>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {visible.map((idea, i) => (
                  <IdeaCard
                    key={idea.id}
                    idea={idea}
                    index={i}
                    animate={fresh}
                    countryCode={input.countryCode}
                    groupPeople={groupPeople ?? null}
                    share={share}
                    saved={saved.isSaved(idea.id)}
                    onToggleSave={() => saved.toggle(idea, saveCtx)}
                    onCardMessage={() => onCardMessage(idea)}
                  />
                ))}
              </div>
            )}

            <section aria-label="More actions" className="card mt-6 space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-primary" onClick={onMore} disabled={busy !== null}>
                  {busy === "more" ? "Finding more…" : "➕ More ideas"}
                </button>
                <button type="button" className="btn-secondary" onClick={onEdit} disabled={busy !== null}>
                  ✏️ Edit answers
                </button>
                <button type="button" className="btn-ghost" onClick={onStartOver} disabled={busy !== null}>
                  🔁 Start over
                </button>
              </div>
              <div>
                <p className="label">🎯 Refine — get a fresh set that’s…</p>
                <div className="flex flex-wrap gap-2">
                  {REFINEMENTS.map((r) => (
                    <Chip key={r.id} size="sm" emoji={r.emoji} selected={false} disabled={busy !== null} onClick={() => onRefine(r.id)}>
                      {r.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </section>

            <p className="muted mt-6 text-center text-sm">
              ⓘ Prices are AI estimates and may vary. Check the store before buying.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

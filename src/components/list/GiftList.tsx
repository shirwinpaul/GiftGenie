"use client";

import Link from "next/link";
import { useState } from "react";
import { useSavedIdeas } from "@/hooks/useSavedIdeas";
import { useIsClient } from "@/hooks/useStoredValue";
import { formatRange } from "@/lib/currency";
import { groupShare } from "@/lib/group";
import { buildSearchLinks, whatsappLink } from "@/lib/links";
import { groupSaved, savedListText } from "@/lib/saved";
import { Stars } from "@/components/results/IdeaCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { UpcomingOccasions } from "./UpcomingOccasions";

export function GiftList() {
  const ready = useIsClient();
  const { items, remove, removeMessage, clear } = useSavedIdeas();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!ready) return <p className="muted py-16 text-center">Loading…</p>;

  const groups = groupSaved(items);

  return (
    <div className="space-y-8">
      <section aria-labelledby="saved-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="saved-heading" className="text-2xl font-semibold text-royal-800 dark:text-royal-100">
            Saved ideas ({items.length})
          </h2>
          {items.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <a
                href={whatsappLink(savedListText(items))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-teal"
              >
                📤 Share list on WhatsApp
              </a>
              <button type="button" className="btn-secondary" onClick={() => setConfirmClear(true)}>
                🗑️ Clear all
              </button>
            </div>
          )}
        </div>

        {items.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-4xl" aria-hidden>
              ⭐
            </p>
            <p className="mt-2 font-semibold">No saved ideas yet.</p>
            <p className="muted mt-1">Tap “☆ Save” on any idea and it will appear here.</p>
            <Link href="/find" className="btn-primary mt-4">
              🧞 Find a gift
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <section key={g.key} aria-label={`${g.person} — ${g.occasion}`} className="card p-4 sm:p-5">
                <h3 className="mb-3 text-xl font-semibold">
                  🎁 {g.person} <span className="muted font-normal">· {g.occasion}</span>
                </h3>
                <ul className="space-y-3">
                  {g.items.map((item) => {
                    const share = item.groupPeople ? groupShare(item.idea.priceMin, item.idea.priceMax, item.groupPeople) : null;
                    const shop = buildSearchLinks(item.idea.searchPhrase, item.countryCode)[0];
                    return (
                      <li key={item.id} className="rounded-2xl border border-royal-100 p-4 dark:border-royal-800">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold">{item.idea.title}</p>
                            <p className="muted text-sm">
                              Est. {formatRange(item.idea.priceMin, item.idea.priceMax, item.currency)}
                              {share && ` · ≈ ${formatRange(share.min, share.max, item.currency)} each (${share.people})`}
                              {" · "}
                              <Stars value={Math.round(item.idea.wowFactor)} />
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <a href={shop.href} target="_blank" rel="noopener noreferrer nofollow" className="btn-secondary min-h-10 px-3 py-1.5 text-sm">
                              🛒 {shop.name}
                            </a>
                            <button
                              type="button"
                              className="btn-ghost min-h-10 px-3 py-1.5 text-sm"
                              onClick={() => remove(item.id)}
                              aria-label={`Delete ${item.idea.title}`}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{item.idea.whyItFits}</p>
                        {item.messages.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-sm font-semibold">✍️ Card messages</p>
                            {item.messages.map((m) => (
                              <div key={m} className="flex items-start gap-2 rounded-xl bg-royal-50 p-3 text-sm dark:bg-royal-900/60">
                                <p className="flex-1 whitespace-pre-line">{m}</p>
                                <button
                                  type="button"
                                  className="btn-ghost min-h-9 px-2 py-1 text-xs"
                                  onClick={() => void navigator.clipboard?.writeText(m).catch(() => {})}
                                  aria-label="Copy message"
                                >
                                  📋
                                </button>
                                <button
                                  type="button"
                                  className="btn-ghost min-h-9 px-2 py-1 text-xs"
                                  onClick={() => removeMessage(item.id, m)}
                                  aria-label="Delete message"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </section>

      <UpcomingOccasions />

      <ConfirmDialog
        open={confirmClear}
        title="Clear your gift list?"
        message="This removes all saved ideas and card messages from this browser. This can't be undone."
        confirmLabel="Yes, clear all"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
      />
    </div>
  );
}

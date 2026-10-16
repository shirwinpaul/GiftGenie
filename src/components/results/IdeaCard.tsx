"use client";

import { motion } from "framer-motion";
import { useId, useState } from "react";
import { CATEGORIES } from "@/config/options";
import { formatRange } from "@/lib/currency";
import { groupShare } from "@/lib/group";
import { buildSearchLinks, whatsappLink } from "@/lib/links";
import { groupAskText, ideaShareText, type ShareContext } from "@/lib/share";
import type { Idea } from "@/lib/schemas";

const CATEGORY_EMOJI = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.emoji])) as Record<Idea["category"], string>;
const WHERE_EMOJI: Record<Idea["whereToGet"], string> = {
  Online: "🌐",
  "Local shop": "🏪",
  "Make it yourself": "✂️",
  "Book online": "🎫",
};

export function Stars({ value }: { value: number }) {
  return (
    <span role="img" aria-label={`Wow factor ${value} out of 5`} className="whitespace-nowrap text-gold-500">
      {"★".repeat(value)}
      <span className="text-slate-300 dark:text-slate-600">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export function IdeaCard({
  idea,
  index,
  countryCode,
  groupPeople,
  share,
  saved,
  onToggleSave,
  onCardMessage,
  animate,
}: {
  idea: Idea;
  index: number;
  countryCode: string;
  groupPeople: number | null;
  share: ShareContext;
  saved: boolean;
  onToggleSave: () => void;
  onCardMessage: () => void;
  animate: boolean;
}) {
  const [showDiy, setShowDiy] = useState(false);
  const [showShops, setShowShops] = useState(false);
  const id = useId();
  const currency = share.currency;
  const links = buildSearchLinks(idea.searchPhrase, countryCode);
  const group = groupPeople ? groupShare(idea.priceMin, idea.priceMax, groupPeople) : null;

  return (
    <motion.article
      aria-labelledby={`${id}-title`}
      initial={animate ? { opacity: 0, rotateY: 80, y: 20 } : false}
      animate={{ opacity: 1, rotateY: 0, y: 0 }}
      transition={{ delay: animate ? 0.08 * index : 0, duration: 0.45, ease: "easeOut" }}
      style={{ transformPerspective: 900 }}
      className="card flex flex-col p-5"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-royal-100 to-teal-100 text-2xl dark:from-royal-800 dark:to-teal-900"
        >
          {CATEGORY_EMOJI[idea.category]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold">
            <span className="rounded-full bg-royal-100 px-2 py-0.5 text-royal-800 dark:bg-royal-800 dark:text-royal-100">
              {idea.category}
            </span>
            {idea.lastMinuteFriendly && (
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-900 dark:bg-teal-900 dark:text-teal-100">
                ⚡ Get it today
              </span>
            )}
            <Stars value={idea.wowFactor} />
          </div>
          <h3 id={`${id}-title`} className="mt-1 text-xl font-semibold leading-snug text-royal-900 dark:text-white">
            {idea.title}
          </h3>
        </div>
      </div>

      <p className="mt-3">{idea.whyItFits}</p>

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Estimated</span>
        <span className="text-lg font-bold text-teal-800 dark:text-teal-200">
          {formatRange(idea.priceMin, idea.priceMax, currency)}
        </span>
        {idea.overBudget && (
          <span className="rounded-full bg-gold-200 px-2 py-0.5 text-xs font-semibold text-gold-600 dark:bg-gold-600/30 dark:text-gold-200">
            Slightly over budget
          </span>
        )}
      </div>

      {group && (
        <div className="mt-3 rounded-xl bg-teal-50 p-3 text-sm dark:bg-teal-950/60">
          <p>
            👥 Total {formatRange(idea.priceMin, idea.priceMax, currency)} ·{" "}
            <strong>≈ {formatRange(group.min, group.max, currency)} each</strong> ({group.people} people)
          </p>
          <a
            href={whatsappLink(groupAskText(idea, share, group.people))}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-teal-800 underline dark:text-teal-200"
          >
            📤 Ask friends on WhatsApp
          </a>
        </div>
      )}

      <ul className="muted mt-3 space-y-1 text-sm">
        <li>
          {WHERE_EMOJI[idea.whereToGet]} <span className="font-semibold">Where:</span> {idea.whereToGet}
        </li>
        <li>
          🎀 <span className="font-semibold">Present it:</span> {idea.presentationTip}
        </li>
      </ul>

      {idea.diy && (
        <div className="mt-3">
          <button
            type="button"
            className="btn-secondary min-h-10 w-full justify-between py-2 text-sm"
            aria-expanded={showDiy}
            aria-controls={`${id}-diy`}
            onClick={() => setShowDiy((s) => !s)}
          >
            <span>✂️ How to make it</span>
            <span aria-hidden>{showDiy ? "▲" : "▼"}</span>
          </button>
          {showDiy && (
            <div id={`${id}-diy`} className="mt-2 space-y-2 rounded-xl bg-royal-50 p-3 text-sm dark:bg-royal-900/60">
              <p>
                ⏱️ <strong>Time:</strong> {idea.diy.timeNeeded} · 💰 <strong>Materials:</strong> est.{" "}
                {formatRange(idea.diy.materialCostMin, idea.diy.materialCostMax, currency)}
              </p>
              <div>
                <p className="font-semibold">You’ll need</p>
                <ul className="list-disc pl-5">
                  {idea.diy.materials.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-semibold">Steps</p>
                <ol className="list-decimal pl-5">
                  {idea.diy.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-auto pt-4">
        {showShops && (
          <ul id={`${id}-shops`} aria-label="Search shops" className="mb-2 flex flex-wrap gap-2">
            {links.map((l) => (
              <li key={l.name}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="btn-secondary min-h-10 px-3 py-1.5 text-sm"
                >
                  {l.name} ↗
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            className="btn-teal min-h-11 px-2 text-sm"
            aria-expanded={showShops}
            aria-controls={`${id}-shops`}
            onClick={() => setShowShops((s) => !s)}
          >
            🛒 Shops
          </button>
          <button type="button" className="btn-secondary min-h-11 px-2 text-sm" onClick={onCardMessage}>
            ✍️ Card
          </button>
          <button
            type="button"
            className="btn-secondary min-h-11 px-2 text-sm"
            aria-pressed={saved}
            onClick={onToggleSave}
          >
            {saved ? "⭐ Saved" : "☆ Save"}
          </button>
          <a
            href={whatsappLink(ideaShareText(idea, share))}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary min-h-11 px-2 text-sm"
          >
            📤 Share
          </a>
        </div>
      </div>
    </motion.article>
  );
}

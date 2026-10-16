"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { SparkleIcon } from "@/components/illustrations/GiftBox";

/** Large illustrated choice card (single-select). */
export function OptionCard({
  selected,
  onClick,
  emoji,
  label,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  emoji: string;
  label: string;
  children?: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`relative flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 p-3 text-center font-semibold transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500 ${
        selected
          ? "border-royal-600 bg-royal-50 text-royal-900 shadow-lg shadow-royal-500/20 dark:border-royal-400 dark:bg-royal-800 dark:text-white"
          : "border-transparent bg-white/85 text-slate-800 shadow-sm hover:border-royal-200 dark:bg-royal-900/60 dark:text-slate-100 dark:hover:border-royal-700"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
          selected ? "bg-gradient-to-br from-gold-200 to-teal-200" : "bg-gradient-to-br from-royal-100 to-teal-50 dark:from-royal-800 dark:to-teal-900"
        }`}
      >
        {emoji}
      </span>
      <span className="text-sm leading-tight sm:text-base">{label}</span>
      {children}
      {selected && <SparkleIcon className="absolute right-2 top-2 h-4 w-4 animate-twinkle" />}
    </motion.button>
  );
}

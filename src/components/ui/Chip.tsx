"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { SparkleIcon } from "@/components/illustrations/GiftBox";

/** Toggle chip with a little sparkle when selected. */
export function Chip({
  selected,
  onClick,
  children,
  emoji,
  disabled,
  size = "md",
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  emoji?: string;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`relative inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border font-medium transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2"
      } ${
        selected
          ? "border-royal-600 bg-royal-600 text-white shadow-md shadow-royal-500/30 dark:border-royal-400 dark:bg-royal-500"
          : "border-royal-200 bg-white/80 text-royal-900 hover:border-royal-400 hover:bg-royal-50 dark:border-royal-700 dark:bg-royal-900/50 dark:text-royal-100 dark:hover:bg-royal-800"
      }`}
    >
      {emoji && <span aria-hidden>{emoji}</span>}
      <span>{children}</span>
      <AnimatePresence>
        {selected && (
          <motion.span
            key="sparkle"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            className="pointer-events-none absolute -right-1 -top-1"
          >
            <SparkleIcon className="h-4 w-4 drop-shadow" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LampIcon } from "@/components/illustrations/Lamp";
import { ThemeToggle } from "./ThemeToggle";
import { SettingsDialog } from "@/components/settings/SettingsDialog";

export function SiteHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Other parts of the app (e.g. the daily-quota message) can open Settings.
  useEffect(() => {
    const open = () => setSettingsOpen(true);
    window.addEventListener("gg:open-settings", open);
    return () => window.removeEventListener("gg:open-settings", open);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-royal-100/70 bg-white/70 backdrop-blur-md dark:border-royal-800/70 dark:bg-royal-950/70">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-1 py-1 font-display text-xl font-semibold text-royal-800 focus-visible:outline-2 focus-visible:outline-teal-500 dark:text-royal-100"
        >
          <LampIcon className="h-8 w-8" />
          <span>Gift Genie</span>
        </Link>
        <div className="flex items-center gap-1">
          <Link href="/find" className="btn-ghost hidden px-3 sm:inline-flex">
            Find a gift
          </Link>
          <Link href="/list" className="btn-ghost px-3" aria-label="My Gift List">
            <span aria-hidden>⭐</span>
            <span className="hidden sm:inline">My Gift List</span>
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="btn-ghost px-3"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <span aria-hidden>⚙️</span>
          </button>
        </div>
      </nav>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}

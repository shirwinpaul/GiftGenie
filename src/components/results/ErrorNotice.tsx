"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { openSettings } from "@/lib/apiClient";
import type { UserError } from "@/lib/ai/errors";

/**
 * Friendly error with the right next step:
 * - per-minute limit → live countdown, then "Try again"
 * - daily quota / bad key → open Settings (BYOK)
 */
export function ErrorNotice({
  error,
  endAt,
  onRetry,
  onDismiss,
}: {
  error: UserError;
  endAt: number | null;
  onRetry: () => void;
  onDismiss: () => void;
}) {
  const remaining = useCountdown(endAt);
  const waiting = remaining > 0;
  const isWait = error.code === "RATE_LIMIT" || error.code === "TOO_MANY_REQUESTS";
  const needsSettings = error.code === "DAILY_QUOTA" || error.code === "BAD_KEY";

  const message =
    isWait && waiting
      ? `The genie needs a moment — try again in ${remaining} second${remaining === 1 ? "" : "s"}.`
      : isWait
        ? "The genie is ready again! Your answers are saved."
        : error.message;

  return (
    <div
      role="alert"
      className="mx-auto mb-4 flex max-w-3xl flex-col gap-3 rounded-2xl border border-gold-400 bg-gold-200/40 p-4 text-slate-900 sm:flex-row sm:items-center dark:border-gold-500 dark:bg-gold-600/20 dark:text-slate-100"
    >
      <span aria-hidden className="text-3xl">
        🧞
      </span>
      <p className="flex-1 font-medium" aria-live="polite">
        {message}
      </p>
      <div className="flex flex-wrap gap-2">
        {needsSettings && (
          <button type="button" className="btn-primary" onClick={openSettings}>
            ⚙️ Settings
          </button>
        )}
        {error.code !== "INVALID_INPUT" && error.code !== "NOT_CONFIGURED" && (
          <button type="button" className="btn-secondary" onClick={onRetry} disabled={waiting}>
            {waiting ? `Wait ${remaining}s` : "Try again"}
          </button>
        )}
        <button type="button" className="btn-ghost px-3" onClick={onDismiss} aria-label="Dismiss message">
          ✕
        </button>
      </div>
    </div>
  );
}

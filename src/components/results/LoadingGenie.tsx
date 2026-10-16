"use client";

import { useEffect, useState } from "react";
import { GiftBox, SparkleIcon } from "@/components/illustrations/GiftBox";

const MESSAGES = ["Rubbing the lamp…", "Consulting the genie…", "Wrapping up ideas…"];

/** Fun full-screen loading state with a wobbling gift box. */
export function LoadingGenie({ label = "Finding gift ideas" }: { label?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % MESSAGES.length), 1800);
    return () => clearInterval(id);
  }, []);

  return (
    <div role="status" aria-live="polite" className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <span className="sr-only">{label}…</span>
      <div className="relative">
        <GiftBox className="h-36 w-36 animate-wobble" />
        <SparkleIcon className="absolute -left-4 top-2 h-6 w-6 animate-twinkle" />
        <SparkleIcon className="absolute -right-3 top-10 h-4 w-4 animate-twinkle [animation-delay:600ms]" />
        <SparkleIcon className="absolute bottom-2 left-1 h-3 w-3 animate-twinkle [animation-delay:1200ms]" />
      </div>
      <p aria-hidden className="mt-6 font-display text-2xl font-semibold text-royal-800 dark:text-royal-100">
        {MESSAGES[i]}
      </p>
      <p className="muted mt-2 text-sm">This usually takes a few seconds.</p>
    </div>
  );
}

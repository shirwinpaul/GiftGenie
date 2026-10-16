"use client";

import { useEffect, useState } from "react";

/** Seconds left until `endAt` (a timestamp), updating live. 0 when done or null. */
export function useCountdown(endAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endAt) return;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, 250);
    const first = setTimeout(tick, 0);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, [endAt]);

  return endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : 0;
}

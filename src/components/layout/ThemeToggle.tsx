"use client";

import { useEffect } from "react";
import { useStoredValue } from "@/hooks/useStoredValue";
import { STORAGE_KEYS } from "@/lib/storage";

type Theme = "light" | "dark";
const validateTheme = (v: unknown): Theme | null => (v === "dark" || v === "light" ? v : null);

export function ThemeToggle() {
  const [theme, setTheme] = useStoredValue<Theme>(STORAGE_KEYS.theme, "light", validateTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <button
      type="button"
      className="btn-ghost px-3"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
    >
      <span aria-hidden>{isDark ? "☀️" : "🌙"}</span>
    </button>
  );
}

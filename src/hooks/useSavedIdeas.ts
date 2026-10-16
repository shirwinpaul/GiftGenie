"use client";

import { useCallback } from "react";
import { useStoredValue } from "./useStoredValue";
import { STORAGE_KEYS } from "@/lib/storage";
import { validateSaved, type SavedItem } from "@/lib/saved";
import type { Idea } from "@/lib/schemas";

const EMPTY: SavedItem[] = [];
const MAX_SAVED = 200;

export type SaveContext = Omit<SavedItem, "id" | "idea" | "messages" | "savedAt">;

/** "My Gift List" — stored only in this browser. */
export function useSavedIdeas() {
  const [items, setItems, clear] = useStoredValue<SavedItem[]>(STORAGE_KEYS.saved, EMPTY, validateSaved);

  const isSaved = useCallback((ideaId: string) => items.some((i) => i.id === ideaId), [items]);

  const save = useCallback(
    (idea: Idea, ctx: SaveContext, messages: string[] = []) =>
      setItems((prev) => {
        const existing = prev.find((i) => i.id === idea.id);
        if (existing) {
          const merged = [...new Set([...existing.messages, ...messages])];
          return prev.map((i) => (i.id === idea.id ? { ...i, messages: merged } : i));
        }
        const item: SavedItem = { id: idea.id, idea, ...ctx, messages, savedAt: Date.now() };
        return [item, ...prev].slice(0, MAX_SAVED);
      }),
    [setItems],
  );

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), [setItems]);

  const removeMessage = useCallback(
    (id: string, message: string) =>
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, messages: i.messages.filter((m) => m !== message) } : i))),
    [setItems],
  );

  const toggle = useCallback(
    (idea: Idea, ctx: SaveContext) => (isSaved(idea.id) ? remove(idea.id) : save(idea, ctx)),
    [isSaved, remove, save],
  );

  return { items, isSaved, save, remove, removeMessage, toggle, clear };
}

"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Chip } from "@/components/ui/Chip";
import { LANGUAGES, TONES, type LanguageId, type ToneId } from "@/config/options";
import { useSavedIdeas } from "@/hooks/useSavedIdeas";
import { postAi } from "@/lib/apiClient";
import type { CardRequest, GiftInput, Idea } from "@/lib/schemas";
import { ErrorNotice } from "./ErrorNotice";
import type { UserError } from "@/lib/ai/errors";

export function CardMessageDialog({ idea, input, onClose }: { idea: Idea | null; input: GiftInput; onClose: () => void }) {
  return (
    <Modal open={idea !== null} onClose={onClose} title="✍️ Card message" wide>
      {idea && <CardPanel key={idea.id} idea={idea} input={input} />}
    </Modal>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function CardPanel({ idea, input }: { idea: Idea; input: GiftInput }) {
  const [tone, setTone] = useState<ToneId>("heartfelt");
  const [language, setLanguage] = useState<LanguageId>(input.cardLanguage);
  const [messages, setMessages] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<{ error: UserError; endAt: number | null } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [savedMsg, setSavedMsg] = useState<Set<string>>(new Set());
  // Cache per tone+language so switching back never costs another AI call.
  const cache = useRef(new Map<string, string[]>());
  const inFlight = useRef(false);
  const saved = useSavedIdeas();
  const cacheKey = `${tone}|${language}`;

  function pick(nextTone: ToneId, nextLang: LanguageId) {
    setTone(nextTone);
    setLanguage(nextLang);
    setMessages(cache.current.get(`${nextTone}|${nextLang}`) ?? null);
    setFailure(null);
  }

  async function generate() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setFailure(null);
    const body: CardRequest = { input, idea: { title: idea.title, whyItFits: idea.whyItFits }, tone, language };
    const res = await postAi<{ messages: string[] }>("/api/card", body);
    inFlight.current = false;
    setLoading(false);
    if (res.ok) {
      cache.current.set(cacheKey, res.data.messages);
      setMessages(res.data.messages);
    } else {
      setFailure({ error: res.error, endAt: res.error.retryAfter ? Date.now() + res.error.retryAfter * 1000 : null });
    }
  }

  function saveMessage(msg: string) {
    saved.save(
      idea,
      {
        person: input.nickname?.trim() || input.relationship,
        occasion: input.occasion,
        currency: input.currency,
        countryCode: input.countryCode,
        groupPeople: input.modes.groupPeople ?? null,
      },
      [msg],
    );
    setSavedMsg((s) => new Set(s).add(msg));
  }

  return (
    <div className="space-y-4">
      <p className="muted">
        For <strong className="text-royal-800 dark:text-royal-100">{idea.title}</strong>
      </p>

      <fieldset>
        <legend className="label">Tone</legend>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => (
            <Chip key={t.id} size="sm" emoji={t.emoji} selected={tone === t.id} onClick={() => pick(t.id, language)}>
              {t.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="label">Language</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Chip key={l.id} size="sm" selected={language === l.id} onClick={() => pick(tone, l.id)}>
              {l.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {failure && (
        <ErrorNotice error={failure.error} endAt={failure.endAt} onRetry={generate} onDismiss={() => setFailure(null)} />
      )}

      {!messages && (
        <button type="button" className="btn-primary w-full" onClick={generate} disabled={loading}>
          {loading ? "🧞 Writing…" : "✍️ Write 3 messages"}
        </button>
      )}

      {messages && (
        <ul aria-live="polite" className="space-y-3">
          {messages.map((m, i) => (
            <li key={i} className="rounded-2xl border border-royal-100 bg-royal-50/60 p-4 dark:border-royal-800 dark:bg-royal-900/50">
              <p lang={language} className="whitespace-pre-line text-lg leading-relaxed">
                {m}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary min-h-10 px-3 py-1.5 text-sm"
                  onClick={async () => {
                    if (await copyText(m)) {
                      setCopied(i);
                      setTimeout(() => setCopied((c) => (c === i ? null : c)), 2000);
                    }
                  }}
                >
                  {copied === i ? "✅ Copied" : "📋 Copy"}
                </button>
                <button
                  type="button"
                  className="btn-secondary min-h-10 px-3 py-1.5 text-sm"
                  onClick={() => saveMessage(m)}
                  disabled={savedMsg.has(m)}
                >
                  {savedMsg.has(m) ? "⭐ Saved to list" : "⭐ Save with idea"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {messages && (
        <button type="button" className="btn-ghost w-full" onClick={generate} disabled={loading}>
          {loading ? "🧞 Writing…" : "🔄 Write 3 new ones"}
        </button>
      )}
    </div>
  );
}

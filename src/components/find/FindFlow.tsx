"use client";

import { MotionConfig } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { Wizard } from "@/components/wizard/Wizard";
import { LoadingGenie } from "@/components/results/LoadingGenie";
import { ErrorNotice } from "@/components/results/ErrorNotice";
import { ResultsView } from "@/components/results/ResultsView";
import { CardMessageDialog } from "@/components/results/CardMessageDialog";
import { useAnswers } from "@/hooks/useAnswers";
import { useStoredValue } from "@/hooks/useStoredValue";
import { toGiftInput, WIZARD_STEPS } from "@/lib/answers";
import { postAi } from "@/lib/apiClient";
import { validateResults, type StoredResults } from "@/lib/results";
import { STORAGE_KEYS } from "@/lib/storage";
import type { RefinementId } from "@/config/options";
import type { UserError } from "@/lib/ai/errors";
import type { GiftInput, Idea, IdeasRequest } from "@/lib/schemas";

type Busy = "initial" | "refine" | "more" | null;
interface IdeasPayload {
  summary?: string;
  ideas: Idea[];
}

/** The whole "find a gift" experience: wizard → loading → results. */
export function FindFlow() {
  const { answers, update, step, setStep, reset, ready } = useAnswers();
  const [results, setResults, clearResults] = useStoredValue<StoredResults | null>(
    STORAGE_KEYS.results,
    null,
    validateResults,
  );
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [fresh, setFresh] = useState(false);
  const [failure, setFailure] = useState<{
    error: UserError;
    endAt: number | null;
    retry: { kind: Exclude<Busy, null>; input: GiftInput; refinement?: RefinementId };
  } | null>(null);
  const [cardIdea, setCardIdea] = useState<Idea | null>(null);
  // Guards against double clicks / re-renders: one user action = one AI call.
  const inFlight = useRef(false);

  const request = useCallback(
    async (kind: Exclude<Busy, null>, input: GiftInput, refinement?: RefinementId) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setBusy(kind);
      setFailure(null);

      const body: IdeasRequest = {
        input,
        action: kind,
        refinement,
        exclude: kind === "more" && results ? results.ideas.map((i) => i.title) : [],
      };
      const res = await postAi<IdeasPayload>("/api/ideas", body);
      inFlight.current = false;
      setBusy(null);

      if (!res.ok) {
        setFailure({
          error: res.error,
          endAt: res.error.retryAfter ? Date.now() + res.error.retryAfter * 1000 : null,
          retry: { kind, input, refinement },
        });
        return;
      }

      if (kind === "more" && results) {
        setResults({ ...results, ideas: [...results.ideas, ...res.data.ideas] });
        setFresh(false);
      } else {
        setResults({
          id: `r-${Date.now()}`,
          input,
          summary: res.data.summary ?? "",
          ideas: res.data.ideas,
          createdAt: Date.now(),
        });
        setFresh(true);
        setEditing(false);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [results, setResults],
  );

  function startOver() {
    reset();
    clearResults();
    setEditing(false);
    setFailure(null);
    window.scrollTo({ top: 0 });
  }

  if (!ready) return <div className="muted mx-auto max-w-3xl px-4 py-16 text-center">Loading…</div>;

  const showResults = results && !editing && busy !== "initial" && busy !== "refine";

  return (
    <MotionConfig reducedMotion="user">
      <div className="pt-4">
        {failure && (
          <div className="px-4">
            <ErrorNotice
              error={failure.error}
              endAt={failure.endAt}
              onRetry={() => void request(failure.retry.kind, failure.retry.input, failure.retry.refinement)}
              onDismiss={() => setFailure(null)}
            />
          </div>
        )}

        {busy === "initial" || busy === "refine" ? (
          <LoadingGenie label={busy === "refine" ? "Refining gift ideas" : "Finding gift ideas"} />
        ) : showResults ? (
          <ResultsView
            key={results.id}
            results={results}
            fresh={fresh}
            busy={busy === "more" ? "more" : null}
            onMore={() => void request("more", results.input)}
            onRefine={(r) => void request("refine", results.input, r)}
            onEdit={() => {
              setEditing(true);
              setFailure(null);
              setStep(WIZARD_STEPS.length - 1);
              window.scrollTo({ top: 0 });
            }}
            onStartOver={startOver}
            onCardMessage={setCardIdea}
          />
        ) : (
          <Wizard
            answers={answers}
            update={update}
            step={step}
            setStep={setStep}
            busy={busy !== null}
            onFind={() => void request("initial", toGiftInput(answers))}
            onStartOver={startOver}
          />
        )}
      </div>

      {results && (
        <CardMessageDialog idea={cardIdea} input={results.input} onClose={() => setCardIdea(null)} />
      )}
    </MotionConfig>
  );
}

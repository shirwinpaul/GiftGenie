"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { firstInvalidStep, validateStep, WIZARD_STEPS, type Answers } from "@/lib/answers";
import type { StepProps } from "./steps/types";
import { StepCountry } from "./steps/StepCountry";
import { StepWho } from "./steps/StepWho";
import { StepAge } from "./steps/StepAge";
import { StepInterests } from "./steps/StepInterests";
import { StepOccasion } from "./steps/StepOccasion";
import { StepBudget } from "./steps/StepBudget";
import { StepModes } from "./steps/StepModes";
import { StepLanguage } from "./steps/StepLanguage";
import { StepReview } from "./steps/StepReview";

const STEP_COMPONENTS: ComponentType<StepProps>[] = [
  StepCountry,
  StepWho,
  StepAge,
  StepInterests,
  StepOccasion,
  StepBudget,
  StepModes,
  StepLanguage,
];
const LAST = WIZARD_STEPS.length - 1;

export function Wizard({
  answers,
  update,
  step,
  setStep,
  onFind,
  onStartOver,
  busy,
}: {
  answers: Answers;
  update: (patch: Partial<Answers>) => void;
  step: number;
  setStep: (step: number) => void;
  onFind: () => void;
  onStartOver: () => void;
  busy: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState(1);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const current = WIZARD_STEPS[step];

  // Move keyboard/screen-reader focus to the new step's heading (not on first load).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function go(to: number) {
    setDirection(to > step ? 1 : -1);
    setError(null);
    setStep(Math.max(0, Math.min(LAST, to)));
  }

  function next() {
    const problem = validateStep(current.id, answers);
    if (problem) {
      setError(problem);
      return;
    }
    if (step === LAST) {
      const invalid = firstInvalidStep(answers);
      if (invalid !== null) {
        go(invalid);
        setError(validateStep(WIZARD_STEPS[invalid].id, answers));
        return;
      }
      if (!busy) onFind();
      return;
    }
    // Save the pre-filled country the first time the user continues.
    if (current.id === "country") update({ countryCode: answers.countryCode });
    go(step + 1);
  }

  const StepComponent = STEP_COMPONENTS[step];
  const progress = Math.round(((step + 1) / WIZARD_STEPS.length) * 100);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      className="mx-auto max-w-3xl px-4 py-6"
    >
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-royal-800 dark:text-royal-200">
            Step {step + 1} of {WIZARD_STEPS.length}
          </span>
          <button type="button" className="btn-ghost min-h-9 px-2 py-1 text-sm" onClick={onStartOver}>
            🔁 Start over
          </button>
        </div>
        <div
          role="progressbar"
          aria-label="Wizard progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          className="h-2.5 overflow-hidden rounded-full bg-royal-100 dark:bg-royal-900"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-royal-500 via-teal-500 to-gold-400"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.section
          key={current.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.22 }}
          aria-labelledby="step-heading"
        >
          <h1
            id="step-heading"
            ref={headingRef}
            tabIndex={-1}
            className="mb-4 text-3xl font-semibold text-royal-800 outline-none sm:text-4xl dark:text-royal-100"
          >
            {current.title}
          </h1>
          {step === LAST ? (
            <StepReview answers={answers} update={update} onEdit={go} />
          ) : (
            <StepComponent answers={answers} update={update} />
          )}
        </motion.section>
      </AnimatePresence>

      <div aria-live="assertive" className="min-h-6">
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-4 flex items-center justify-between gap-3 bg-gradient-to-t from-white via-white/95 to-white/0 px-4 pb-4 pt-6 dark:from-royal-950 dark:via-royal-950/95">
        <button type="button" className="btn-secondary" onClick={() => go(step - 1)} disabled={step === 0}>
          ← Back
        </button>
        {step === LAST ? (
          <button type="submit" className="btn-primary px-6 text-lg" disabled={busy}>
            🧞 Find the perfect gift
          </button>
        ) : (
          <button type="submit" className="btn-primary px-8">
            Next →
          </button>
        )}
      </div>
    </form>
  );
}

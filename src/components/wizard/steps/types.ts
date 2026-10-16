import type { Answers } from "@/lib/answers";

export interface StepProps {
  answers: Answers;
  update: (patch: Partial<Answers>) => void;
}

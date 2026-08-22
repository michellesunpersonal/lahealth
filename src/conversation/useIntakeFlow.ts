import { useMemo, useRef, useState } from "react";
import type { LanguageCode, VisitEntry } from "../types/domain";
import { applyAnswer } from "./applyAnswer";
import { buildInitialSteps, buildSymptomSteps, type StepDef } from "./flow";
import { generatePatientRecap } from "./generateOutputs";
import type { PatientProfile } from "../types/domain";
import { store } from "../data/storage";
import { nowIso } from "../lib/id";
import { strings } from "../i18n/strings";

export interface IntakeFlowState {
  currentStep: StepDef | null;
  isDone: boolean;
  visit: VisitEntry;
  submitText: (text: string) => void;
  submitChoice: (value: string, label: string) => void;
  submitYesNo: (yes: boolean) => void;
  skip: () => void;
}

export function useIntakeFlow(initialVisit: VisitEntry, profile: PatientProfile, lang: LanguageCode): IntakeFlowState {
  const stepsRef = useRef<StepDef[]>(buildInitialSteps());
  const [stepIndex, setStepIndex] = useState(0);
  const [visit, setVisit] = useState<VisitEntry>(initialVisit);
  const [symptomCount, setSymptomCount] = useState(1);

  const currentStep = stepIndex < stepsRef.current.length ? stepsRef.current[stepIndex] : null;
  const isDone = currentStep === null;

  function persistCompleted(v: VisitEntry) {
    const recap = generatePatientRecap(v, profile, lang);
    const completed: VisitEntry = {
      ...v,
      status: "completed",
      completedAt: nowIso(),
      outputs: {
        clinicianSummaryGeneratedAt: nowIso(),
        patientRecap: recap,
      },
    };
    store.saveVisit(completed);
    setVisit(completed);
  }

  function handleAnswer(value: string, display: string, skipped: boolean) {
    const step = currentStep;
    if (!step) return;

    const applied = applyAnswer(visit, step, value, display, lang, skipped);

    const continueMatch = step.id.match(/^symptom_continue_(\d+)$/);
    if (continueMatch && !skipped && value === "yes") {
      const nextIndex = symptomCount;
      const newSteps = buildSymptomSteps(nextIndex);
      const insertAt = stepIndex + 1;
      stepsRef.current = [
        ...stepsRef.current.slice(0, insertAt),
        ...newSteps,
        ...stepsRef.current.slice(insertAt),
      ];
      setSymptomCount((c) => c + 1);
    }

    const willBeDone = stepIndex + 1 >= stepsRef.current.length;
    if (willBeDone) {
      persistCompleted(applied);
    } else {
      store.saveVisit({ ...applied, status: "in_progress" });
      setVisit(applied);
    }
    setStepIndex((i) => i + 1);
  }

  return useMemo<IntakeFlowState>(
    () => ({
      currentStep,
      isDone,
      visit,
      submitText: (text: string) => handleAnswer(text, text, text.trim().length === 0),
      submitChoice: (value: string, label: string) => handleAnswer(value, label, false),
      submitYesNo: (yes: boolean) => {
        const value = yes ? "yes" : "no";
        const display = yes ? strings.intake.yes[lang] : strings.intake.no[lang];
        handleAnswer(value, display, false);
      },
      skip: () => handleAnswer("", "", true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentStep, isDone, visit, stepIndex, symptomCount]
  );
}

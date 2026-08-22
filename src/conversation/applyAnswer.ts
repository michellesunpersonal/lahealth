import type {
  FieldWithQuote,
  LanguageCode,
  SymptomCategory,
  SymptomReport,
  VisitEntry,
} from "../types/domain";
import { newId, nowIso } from "../lib/id";
import { SYMPTOM_CATEGORY_OPTIONS, type StepDef } from "./flow";

function makeField(text: string, lang: LanguageCode): FieldWithQuote {
  const trimmed = text.trim();
  // v1 has no translation engine: "structured" is a light normalization of
  // the verbatim answer, not a paraphrase or translation. See
  // generateOutputs.ts for why we don't fake a translation here.
  return { structured: trimmed, patientQuote: trimmed, quoteLanguage: lang };
}

function emptySymptom(category: SymptomCategory): SymptomReport {
  return {
    id: newId(),
    category,
    description: { structured: "", patientQuote: "", quoteLanguage: "en" },
    onset: null,
    location: null,
    severityInPatientsWords: null,
    duration: null,
    whatMakesItBetter: null,
    whatMakesItWorse: null,
    whatHasBeenTried: null,
  };
}

function ensureSymptom(symptoms: SymptomReport[], index: number): SymptomReport[] {
  const next = [...symptoms];
  while (next.length <= index) {
    next.push(emptySymptom("other"));
  }
  return next;
}

const symptomFieldStepRe = /^symptom_(\d+)_(category|description|onset|location|severity|duration|better|worse|tried)$/;
const symptomContinueRe = /^symptom_continue_(\d+)$/;

/**
 * Pure reducer: given the current visit draft, the step that was just
 * answered, and the raw answer text, returns a new VisitEntry with that
 * answer applied to the right structured field AND appended to the
 * conversation transcript. Skipped optional steps still get a transcript
 * entry so the record shows the question was asked.
 */
export function applyAnswer(
  visit: VisitEntry,
  step: StepDef,
  value: string,
  displayText: string,
  lang: LanguageCode,
  wasSkipped: boolean
): VisitEntry {
  const answerVerbatim = wasSkipped ? "" : displayText;
  const rawAnswer = value;
  const conversationTurn = {
    id: newId(),
    stepId: step.id,
    questionTextShown: step.prompt[lang],
    answerVerbatim: wasSkipped ? (lang === "es" ? "(omitido)" : "(skipped)") : displayText,
    answeredAt: nowIso(),
  };

  let next: VisitEntry = { ...visit, conversation: [...visit.conversation, conversationTurn] };

  if (step.id === "intro_reason") {
    next = wasSkipped ? next : { ...next, reasonForVisit: makeField(answerVerbatim, lang) };
    return next;
  }

  const symptomFieldMatch = step.id.match(symptomFieldStepRe);
  if (symptomFieldMatch) {
    const index = Number(symptomFieldMatch[1]);
    const field = symptomFieldMatch[2];
    const symptoms = ensureSymptom(next.symptoms, index);
    const symptom = { ...symptoms[index] };

    if (field === "category") {
      const chosen = SYMPTOM_CATEGORY_OPTIONS.find((o) => o.value === rawAnswer);
      symptom.category = chosen?.value ?? "other";
    } else if (!wasSkipped) {
      const value = makeField(answerVerbatim, lang);
      if (field === "description") symptom.description = value;
      if (field === "onset") symptom.onset = value;
      if (field === "location") symptom.location = value;
      if (field === "severity") symptom.severityInPatientsWords = value;
      if (field === "duration") symptom.duration = value;
      if (field === "better") symptom.whatMakesItBetter = value;
      if (field === "worse") symptom.whatMakesItWorse = value;
      if (field === "tried") symptom.whatHasBeenTried = value;
    }

    symptoms[index] = symptom;
    return { ...next, symptoms };
  }

  if (symptomContinueRe.test(step.id)) {
    // Control-flow only step; nothing to store beyond the transcript entry already appended.
    return next;
  }

  if (step.id === "dialysis_weight") {
    return wasSkipped
      ? next
      : { ...next, dialysisContext: { ...next.dialysisContext, recentWeightChange: makeField(answerVerbatim, lang) } };
  }
  if (step.id === "dialysis_fluid_diet") {
    return wasSkipped
      ? next
      : { ...next, dialysisContext: { ...next.dialysisContext, fluidDietAdherence: makeField(answerVerbatim, lang) } };
  }
  if (step.id === "dialysis_on_days") {
    return wasSkipped
      ? next
      : { ...next, dialysisContext: { ...next.dialysisContext, feelingOnDialysisDays: makeField(answerVerbatim, lang) } };
  }
  if (step.id === "dialysis_off_days") {
    return wasSkipped
      ? next
      : { ...next, dialysisContext: { ...next.dialysisContext, feelingOffDialysisDays: makeField(answerVerbatim, lang) } };
  }
  if (step.id === "dialysis_missed") {
    return wasSkipped
      ? next
      : {
          ...next,
          dialysisContext: { ...next.dialysisContext, missedOrShortenedSessions: makeField(answerVerbatim, lang) },
        };
  }

  if (step.id === "medications_check") {
    return wasSkipped ? next : { ...next, medicationNotes: [...next.medicationNotes, makeField(answerVerbatim, lang)] };
  }
  if (step.id === "history_check") {
    return wasSkipped
      ? next
      : { ...next, relevantHistoryNotes: [...next.relevantHistoryNotes, makeField(answerVerbatim, lang)] };
  }
  if (step.id === "biggest_concern") {
    return wasSkipped ? next : { ...next, biggestConcern: makeField(answerVerbatim, lang) };
  }

  return next;
}

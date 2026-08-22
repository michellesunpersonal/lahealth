import type { LanguageCode, SymptomCategory } from "../types/domain";

/**
 * The scripted intake flow. This is a deterministic decision tree, not an
 * LLM — every question a patient can ever be asked is enumerated here and
 * can be read top to bottom. Branching is limited to: (a) looping the
 * symptom block for "is there anything else bothering you," and (b) which
 * category a symptom is filed under. Nothing here infers meaning from an
 * answer or decides what to ask next based on clinical judgment — it's the
 * same fixed triage-style checklist for every patient.
 */

export type StepKind = "text" | "yesno" | "choice";

export interface ChoiceOption {
  value: SymptomCategory;
  label: Record<LanguageCode, string>;
}

export interface StepDef {
  id: string;
  category: "intro" | "symptom" | "dialysis" | "medications" | "history" | "closing";
  kind: StepKind;
  optional: boolean;
  prompt: Record<LanguageCode, string>;
  options?: ChoiceOption[];
}

export const SYMPTOM_CATEGORY_OPTIONS: ChoiceOption[] = [
  { value: "pain", label: { en: "Pain", es: "Dolor" } },
  { value: "swelling", label: { en: "Swelling", es: "Hinchazón" } },
  { value: "shortness_of_breath", label: { en: "Shortness of breath", es: "Falta de aire" } },
  { value: "fatigue", label: { en: "Fatigue / tiredness", es: "Fatiga / cansancio" } },
  { value: "nausea_vomiting", label: { en: "Nausea or vomiting", es: "Náuseas o vómitos" } },
  { value: "itching", label: { en: "Itching", es: "Picazón" } },
  { value: "cramping", label: { en: "Cramping", es: "Calambres" } },
  { value: "access_site_issue", label: { en: "Issue at my access site", es: "Problema en el sitio de acceso" } },
  { value: "appetite_change", label: { en: "Appetite change", es: "Cambio de apetito" } },
  { value: "sleep_issue", label: { en: "Trouble sleeping", es: "Problemas para dormir" } },
  { value: "other", label: { en: "Something else", es: "Algo más" } },
];

export function buildSymptomSteps(index: number): StepDef[] {
  const n = index + 1;
  return [
    {
      id: `symptom_${index}_category`,
      category: "symptom",
      kind: "choice",
      optional: false,
      options: SYMPTOM_CATEGORY_OPTIONS,
      prompt: {
        en: n === 1 ? "What would you call this, mainly?" : "And what would you call this next thing, mainly?",
        es: n === 1 ? "¿Cómo llamaría a esto, principalmente?" : "¿Y cómo llamaría a esto siguiente, principalmente?",
      },
    },
    {
      id: `symptom_${index}_description`,
      category: "symptom",
      kind: "text",
      optional: false,
      prompt: {
        en: "Tell me more about what's going on, in your own words.",
        es: "Cuénteme más sobre lo que está pasando, con sus propias palabras.",
      },
    },
    {
      id: `symptom_${index}_onset`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: { en: "When did this start?", es: "¿Cuándo comenzó esto?" },
    },
    {
      id: `symptom_${index}_location`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: {
        en: "Where do you feel it, if it's in a specific place?",
        es: "¿Dónde lo siente, si es en un lugar específico?",
      },
    },
    {
      id: `symptom_${index}_severity`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: {
        en: "How would you describe how bad it is, in your own words?",
        es: "¿Cómo describiría qué tan fuerte es, con sus propias palabras?",
      },
    },
    {
      id: `symptom_${index}_duration`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: {
        en: "Is it constant, or does it come and go? About how long does it last?",
        es: "¿Es constante, o va y viene? ¿Aproximadamente cuánto dura?",
      },
    },
    {
      id: `symptom_${index}_better`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: { en: "What makes it better?", es: "¿Qué hace que mejore?" },
    },
    {
      id: `symptom_${index}_worse`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: { en: "What makes it worse?", es: "¿Qué hace que empeore?" },
    },
    {
      id: `symptom_${index}_tried`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: {
        en: "Have you already tried anything for this?",
        es: "¿Ya ha intentado algo para esto?",
      },
    },
    {
      id: `symptom_continue_${index}`,
      category: "symptom",
      kind: "yesno",
      optional: false,
      prompt: {
        en: "Is there anything else bothering you today?",
        es: "¿Hay algo más que le moleste hoy?",
      },
    },
  ];
}

export const INTRO_STEP: StepDef = {
  id: "intro_reason",
  category: "intro",
  kind: "text",
  optional: false,
  prompt: {
    en: "What brings you in today?",
    es: "¿Qué le trae hoy a la consulta?",
  },
};

export const DIALYSIS_STEPS: StepDef[] = [
  {
    id: "dialysis_weight",
    category: "dialysis",
    kind: "text",
    optional: true,
    prompt: {
      en: "Have you noticed any changes in your weight recently?",
      es: "¿Ha notado algún cambio en su peso recientemente?",
    },
  },
  {
    id: "dialysis_fluid_diet",
    category: "dialysis",
    kind: "text",
    optional: true,
    prompt: {
      en: "How has it been going with your fluid and diet limits?",
      es: "¿Cómo le ha ido con los límites de líquidos y dieta?",
    },
  },
  {
    id: "dialysis_on_days",
    category: "dialysis",
    kind: "text",
    optional: true,
    prompt: {
      en: "How do you feel on your dialysis days?",
      es: "¿Cómo se siente los días que tiene diálisis?",
    },
  },
  {
    id: "dialysis_off_days",
    category: "dialysis",
    kind: "text",
    optional: true,
    prompt: {
      en: "How do you feel on the days you don't have dialysis?",
      es: "¿Cómo se siente los días que no tiene diálisis?",
    },
  },
  {
    id: "dialysis_missed",
    category: "dialysis",
    kind: "text",
    optional: true,
    prompt: {
      en: "Have you missed or shortened any dialysis sessions recently?",
      es: "¿Ha faltado o acortado alguna sesión de diálisis recientemente?",
    },
  },
];

export const CLOSING_STEPS: StepDef[] = [
  {
    id: "medications_check",
    category: "medications",
    kind: "text",
    optional: true,
    prompt: {
      en: "Are you taking any new medications, or has anything changed since your last visit?",
      es: "¿Está tomando algún medicamento nuevo, o ha cambiado algo desde su última consulta?",
    },
  },
  {
    id: "history_check",
    category: "history",
    kind: "text",
    optional: true,
    prompt: {
      en: "Is there anything else about your health history that feels important to mention?",
      es: "¿Hay algo más sobre su historial de salud que le parezca importante mencionar?",
    },
  },
  {
    id: "biggest_concern",
    category: "closing",
    kind: "text",
    optional: true,
    prompt: {
      en: "Out of everything we've talked about, what worries you the most?",
      es: "De todo lo que hemos hablado, ¿qué es lo que más le preocupa?",
    },
  },
];

export function buildInitialSteps(): StepDef[] {
  return [INTRO_STEP, ...buildSymptomSteps(0), ...DIALYSIS_STEPS, ...CLOSING_STEPS];
}

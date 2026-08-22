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
  { value: "pain", label: { en: "Pain", es: "Dolor", zh: "疼痛" } },
  { value: "swelling", label: { en: "Swelling", es: "Hinchazón", zh: "肿胀" } },
  { value: "shortness_of_breath", label: { en: "Shortness of breath", es: "Falta de aire", zh: "气短" } },
  { value: "fatigue", label: { en: "Fatigue / tiredness", es: "Fatiga / cansancio", zh: "乏力/疲劳" } },
  { value: "nausea_vomiting", label: { en: "Nausea or vomiting", es: "Náuseas o vómitos", zh: "恶心或呕吐" } },
  { value: "itching", label: { en: "Itching", es: "Picazón", zh: "瘙痒" } },
  { value: "cramping", label: { en: "Cramping", es: "Calambres", zh: "抽筋" } },
  {
    value: "access_site_issue",
    label: { en: "Issue at my access site", es: "Problema en el sitio de acceso", zh: "透析通路部位有问题" },
  },
  { value: "appetite_change", label: { en: "Appetite change", es: "Cambio de apetito", zh: "食欲变化" } },
  { value: "sleep_issue", label: { en: "Trouble sleeping", es: "Problemas para dormir", zh: "睡眠问题" } },
  { value: "other", label: { en: "Something else", es: "Algo más", zh: "其他情况" } },
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
        zh: n === 1 ? "您主要会把这个情况归为哪一类？" : "那接下来这个情况，您主要会归为哪一类？",
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
        zh: "请用您自己的话，多说说是什么情况。",
      },
    },
    {
      id: `symptom_${index}_onset`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: { en: "When did this start?", es: "¿Cuándo comenzó esto?", zh: "这是什么时候开始的？" },
    },
    {
      id: `symptom_${index}_location`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: {
        en: "Where do you feel it, if it's in a specific place?",
        es: "¿Dónde lo siente, si es en un lugar específico?",
        zh: "如果有具体部位，您是在哪里感觉到的？",
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
        zh: "请用您自己的话描述一下严重程度。",
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
        zh: "是持续存在，还是时有时无？大概会持续多长时间？",
      },
    },
    {
      id: `symptom_${index}_better`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: { en: "What makes it better?", es: "¿Qué hace que mejore?", zh: "什么情况下会好一些？" },
    },
    {
      id: `symptom_${index}_worse`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: { en: "What makes it worse?", es: "¿Qué hace que empeore?", zh: "什么情况下会加重？" },
    },
    {
      id: `symptom_${index}_tried`,
      category: "symptom",
      kind: "text",
      optional: true,
      prompt: {
        en: "Have you already tried anything for this?",
        es: "¿Ya ha intentado algo para esto?",
        zh: "您是否已经尝试过什么方法来应对？",
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
        zh: "今天还有其他让您不舒服的地方吗？",
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
    zh: "今天是什么原因让您来就诊？",
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
      zh: "您最近有没有注意到体重的变化？",
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
      zh: "您在控制饮水量和饮食方面执行得怎么样？",
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
      zh: "您在做透析当天感觉怎么样？",
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
      zh: "您在不做透析的日子里感觉怎么样？",
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
      zh: "您最近有没有错过透析或缩短透析时间的情况？",
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
      zh: "您最近是否在服用新药，或者自上次就诊以来用药有什么变化？",
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
      zh: "关于您的健康病史，还有其他重要的事情想提一下吗？",
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
      zh: "在我们聊到的这些内容中，您最担心的是什么？",
    },
  },
];

export function buildInitialSteps(): StepDef[] {
  return [INTRO_STEP, ...buildSymptomSteps(0), ...DIALYSIS_STEPS, ...CLOSING_STEPS];
}

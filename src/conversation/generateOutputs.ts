import type { LanguageCode, PatientProfile, PatientRecap, VisitEntry } from "../types/domain";

/**
 * Builds Output #2 — the plain-language patient recap — from structured
 * VisitEntry data. This is entirely templated: it restates what the
 * patient already said, in their own language, and offers generic
 * "you might ask" prompts. It never infers a cause, ranks urgency, or
 * suggests what a symptom means — see the domain model header for why.
 *
 * KNOWN v1 LIMITATION (flagged, not hidden): there is no translation
 * engine in this prototype. Output #1 (clinician summary) uses English
 * labels/categories for its structure, but patient free-text answers are
 * shown verbatim in whatever language the patient used — never
 * auto-translated. Faking a translation would risk misrepresenting the
 * patient's meaning, which is worse than clearly labeling the original
 * language. A real translation step (human or MT/LLM-reviewed) would be
 * needed before this ships past a demo.
 */

function pick(lang: LanguageCode, variants: { en: string; es: string; zh: string }): string {
  return variants[lang];
}

export function generatePatientRecap(
  visit: VisitEntry,
  _profile: PatientProfile,
  lang: LanguageCode
): PatientRecap {
  const lines: string[] = [];
  const questions: string[] = [];

  if (visit.reasonForVisit?.structured) {
    const r = visit.reasonForVisit.structured;
    lines.push(
      pick(lang, {
        en: `You told us the main reason for this visit is: "${r}".`,
        es: `Nos dijo que el motivo principal de esta consulta es: "${r}".`,
        zh: `您告诉我们本次就诊的主要原因是："${r}"。`,
      })
    );
  }

  for (const symptom of visit.symptoms) {
    const parts: string[] = [];
    if (symptom.description?.structured) {
      const d = symptom.description.structured;
      parts.push(pick(lang, { en: `You mentioned: "${d}"`, es: `Mencionó: "${d}"`, zh: `您提到："${d}"` }));
    }
    if (symptom.onset?.structured) {
      const o = symptom.onset.structured;
      parts.push(
        pick(lang, { en: `it started: ${o}`, es: `comenzó: ${o}`, zh: `开始时间：${o}` })
      );
    }
    if (symptom.severityInPatientsWords?.structured) {
      const s = symptom.severityInPatientsWords.structured;
      parts.push(
        pick(lang, {
          en: `you described it as: "${s}"`,
          es: `lo describió así: "${s}"`,
          zh: `您是这样描述的："${s}"`,
        })
      );
    }
    if (parts.length) lines.push(parts.join(lang === "zh" ? "，" : "; ") + (lang === "zh" ? "。" : "."));

    const desc = symptom.description?.structured ?? "";
    questions.push(
      pick(lang, {
        en: `What might be causing this: "${desc}"? Is there anything that should change in my treatment?`,
        es: `¿Qué podría estar causando esto: "${desc}"? ¿Hay algo que deba cambiar en mi tratamiento?`,
        zh: `是什么原因导致了这个情况："${desc}"？我的治疗方案是否需要做出调整？`,
      })
    );
  }

  const d = visit.dialysisContext;
  if (d.recentWeightChange?.structured) {
    const w = d.recentWeightChange.structured;
    lines.push(
      pick(lang, {
        en: `About your weight, you said: "${w}".`,
        es: `Sobre su peso, dijo: "${w}".`,
        zh: `关于您的体重，您说："${w}"。`,
      })
    );
    questions.push(
      pick(lang, {
        en: "Should we review my dry weight (target weight)?",
        es: "¿Deberíamos revisar mi peso seco (meta de peso)?",
        zh: "我们是否应该重新评估我的干体重（目标体重）？",
      })
    );
  }
  if (d.fluidDietAdherence?.structured) {
    const f = d.fluidDietAdherence.structured;
    lines.push(
      pick(lang, {
        en: `About fluid and diet limits, you said: "${f}".`,
        es: `Sobre los límites de líquidos y dieta, dijo: "${f}".`,
        zh: `关于控水和饮食限制，您说："${f}"。`,
      })
    );
  }
  if (d.missedOrShortenedSessions?.structured) {
    const m = d.missedOrShortenedSessions.structured;
    lines.push(
      pick(lang, {
        en: `About dialysis sessions, you said: "${m}".`,
        es: `Sobre sesiones de diálisis, dijo: "${m}".`,
        zh: `关于透析情况，您说："${m}"。`,
      })
    );
    questions.push(
      pick(lang, {
        en: "What should I do if I need to miss a session in the future?",
        es: "¿Qué debo hacer si necesito faltar a una sesión en el futuro?",
        zh: "如果以后需要缺席某次透析，我应该怎么办？",
      })
    );
  }

  if (visit.medicationNotes.length) {
    questions.push(
      pick(lang, {
        en: "Can you review all my medications, including new ones, to check for any interactions?",
        es: "¿Puede revisar todos mis medicamentos, incluyendo los nuevos, para ver si hay algún problema entre ellos?",
        zh: "您能帮我检查一下所有的药物（包括新药），看看是否存在相互作用吗？",
      })
    );
  }

  if (visit.biggestConcern?.structured) {
    const c = visit.biggestConcern.structured;
    lines.push(
      pick(lang, {
        en: `You told us what worries you most is: "${c}".`,
        es: `Nos dijo que lo que más le preocupa es: "${c}".`,
        zh: `您告诉我们最担心的是："${c}"。`,
      })
    );
    questions.push(
      pick(lang, {
        en: "Make sure to mention this to your care team, even if it seems small.",
        es: "Asegúrese de mencionar esto a su equipo médico, aunque parezca pequeño.",
        zh: "请务必告诉您的医疗团队这件事，哪怕看起来是小事。",
      })
    );
  }

  const summaryText = lines.join("\n\n");

  return {
    language: lang,
    summaryText,
    suggestedQuestionsForCareTeam: questions,
    generatedAt: new Date().toISOString(),
  };
}

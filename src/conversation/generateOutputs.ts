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
export function generatePatientRecap(
  visit: VisitEntry,
  _profile: PatientProfile,
  lang: LanguageCode
): PatientRecap {
  const lines: string[] = [];
  const questions: string[] = [];

  if (visit.reasonForVisit?.structured) {
    lines.push(
      lang === "es"
        ? `Nos dijo que el motivo principal de esta consulta es: "${visit.reasonForVisit.structured}".`
        : `You told us the main reason for this visit is: "${visit.reasonForVisit.structured}".`
    );
  }

  for (const symptom of visit.symptoms) {
    const parts: string[] = [];
    if (symptom.description?.structured) {
      parts.push(
        lang === "es"
          ? `Mencionó: "${symptom.description.structured}"`
          : `You mentioned: "${symptom.description.structured}"`
      );
    }
    if (symptom.onset?.structured) {
      parts.push(lang === "es" ? `comenzó: ${symptom.onset.structured}` : `it started: ${symptom.onset.structured}`);
    }
    if (symptom.severityInPatientsWords?.structured) {
      parts.push(
        lang === "es"
          ? `lo describió así: "${symptom.severityInPatientsWords.structured}"`
          : `you described it as: "${symptom.severityInPatientsWords.structured}"`
      );
    }
    if (parts.length) lines.push(parts.join(lang === "es" ? "; " : "; ") + ".");

    questions.push(
      lang === "es"
        ? `¿Qué podría estar causando esto: "${symptom.description?.structured ?? ""}"? ¿Hay algo que deba cambiar en mi tratamiento?`
        : `What might be causing this: "${symptom.description?.structured ?? ""}"? Is there anything that should change in my treatment?`
    );
  }

  const d = visit.dialysisContext;
  if (d.recentWeightChange?.structured) {
    lines.push(
      lang === "es"
        ? `Sobre su peso, dijo: "${d.recentWeightChange.structured}".`
        : `About your weight, you said: "${d.recentWeightChange.structured}".`
    );
    questions.push(
      lang === "es"
        ? "¿Deberíamos revisar mi peso seco (meta de peso)?"
        : "Should we review my dry weight (target weight)?"
    );
  }
  if (d.fluidDietAdherence?.structured) {
    lines.push(
      lang === "es"
        ? `Sobre los límites de líquidos y dieta, dijo: "${d.fluidDietAdherence.structured}".`
        : `About fluid and diet limits, you said: "${d.fluidDietAdherence.structured}".`
    );
  }
  if (d.missedOrShortenedSessions?.structured) {
    lines.push(
      lang === "es"
        ? `Sobre sesiones de diálisis, dijo: "${d.missedOrShortenedSessions.structured}".`
        : `About dialysis sessions, you said: "${d.missedOrShortenedSessions.structured}".`
    );
    questions.push(
      lang === "es"
        ? "¿Qué debo hacer si necesito faltar a una sesión en el futuro?"
        : "What should I do if I need to miss a session in the future?"
    );
  }

  if (visit.medicationNotes.length) {
    questions.push(
      lang === "es"
        ? "¿Puede revisar todos mis medicamentos, incluyendo los nuevos, para ver si hay algún problema entre ellos?"
        : "Can you review all my medications, including new ones, to check for any interactions?"
    );
  }

  if (visit.biggestConcern?.structured) {
    lines.push(
      lang === "es"
        ? `Nos dijo que lo que más le preocupa es: "${visit.biggestConcern.structured}".`
        : `You told us what worries you most is: "${visit.biggestConcern.structured}".`
    );
    questions.push(
      lang === "es"
        ? "Asegúrese de mencionar esto a su equipo médico, aunque parezca pequeño."
        : "Make sure to mention this to your care team, even if it seems small."
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

import type { LanguageCode, PatientProfile, VisitEntry } from "../types/domain";
import { newId, nowIso } from "../lib/id";

export function createBlankVisit(patientProfileId: string, clinicName: string, lang: LanguageCode): VisitEntry {
  return {
    id: newId(),
    patientProfileId,
    createdAt: nowIso(),
    completedAt: null,
    status: "in_progress",
    languageUsed: lang,
    intendedProvider: { clinicName: clinicName.trim() || "—", providerName: null },
    reasonForVisit: { structured: "", patientQuote: "", quoteLanguage: lang },
    symptoms: [],
    dialysisContext: {
      recentWeightChange: null,
      fluidDietAdherence: null,
      feelingOnDialysisDays: null,
      feelingOffDialysisDays: null,
      missedOrShortenedSessions: null,
    },
    medicationNotes: [],
    relevantHistoryNotes: [],
    biggestConcern: null,
    conversation: [],
    outputs: { clinicianSummaryGeneratedAt: null, patientRecap: null },
  };
}

/** Placeholder used only to satisfy hook call ordering before a real profile/visit is known. Never rendered or persisted. */
export const FALLBACK_PROFILE: PatientProfile = {
  id: "",
  preferredLanguage: "en",
  displayName: "",
  dateOfBirth: "",
  createdAt: nowIso(),
  dialysis: { modality: "unknown", scheduleDays: [], accessType: "unknown", dryWeightLbs: null },
  currentMedications: [],
  relevantHistory: [],
  accessGrants: [],
};

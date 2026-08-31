import type { PatientProfile, VisitEntry } from "../types/domain";
import type { SafetyFlag } from "../types/briefing";

/**
 * Assembles the patient-language source content for a Visit Briefing, in
 * the exact item order/shape both the on-screen patient-language column
 * and the translation prompt use — kept in one place so the two never
 * drift apart.
 */
export interface BriefingSource {
  reasonForVisit: string;
  activeConditions: string[];
  medications: string[];
  safetyFlagLines: string[];
  alreadyExplained: string[];
}

export function assembleBriefingSource(profile: PatientProfile, visit: VisitEntry, safetyFlags: SafetyFlag[]): BriefingSource {
  return {
    reasonForVisit: visit.reasonForVisit?.patientQuote || "",
    activeConditions: [...profile.relevantHistory, ...visit.relevantHistoryNotes.map((n) => n.patientQuote)],
    medications: [
      ...profile.currentMedications.map((m) => `${m.name}: ${m.patientDescription}`),
      ...visit.medicationNotes.map((n) => n.patientQuote),
    ],
    safetyFlagLines: safetyFlags.map((f) => `${f.label}: ${f.detail}`),
    alreadyExplained: [
      ...visit.symptoms.map((s) => s.description.patientQuote).filter(Boolean),
      ...(visit.biggestConcern ? [visit.biggestConcern.patientQuote] : []),
    ],
  };
}

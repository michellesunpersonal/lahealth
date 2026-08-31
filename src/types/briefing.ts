import type { LanguageCode } from "./domain";
import type { TeachBackOutcome } from "./consent";

/**
 * Additive data layer for the unified visit flow. Nothing here modifies
 * PatientProfile, VisitEntry, ConsentCase, or ProviderAccessGrant — each
 * type below references those by id instead, so the four core types stay
 * exactly as they were designed.
 */

/** Patient-reported safety-critical flag (allergy, "hard stick", etc.), joined by patientProfileId. */
export interface SafetyFlag {
  id: string;
  patientProfileId: string;
  label: string; // short tag, e.g. "Drug allergy", "Difficult venous access"
  detail: string; // patient's own words
  detailLanguage: LanguageCode;
  createdAt: string;
}

/** The only link between a ConsentCase and the VisitEntry it belongs to. */
export interface VisitConsentLink {
  visitId: string;
  consentCaseId: string;
  linkedAt: string;
}

/**
 * Cached English side of a Visit Briefing. The patient-language side is
 * never duplicated here — it's read live from VisitEntry/PatientProfile at
 * render time. Generated on demand, like a ConsentDocument's translation.
 */
export interface VisitBriefing {
  visitId: string;
  modelId: string;
  generatedAt: string;
  reasonForVisitEnglish: string;
  activeConditionsEnglish: string[];
  medicationsAndChangesEnglish: string[];
  safetyFlagsEnglish: string[];
  alreadyExplainedEnglish: string[];
  openQuestionsEnglish: string[];
}

/** After-visit teach-back check for a visit, reusing the consent tool's outcome vocabulary. */
export interface VisitTeachBackItem {
  id: string;
  visitId: string;
  promptPatientLanguage: string;
  outcome: TeachBackOutcome;
  outcomeNotes: string;
}

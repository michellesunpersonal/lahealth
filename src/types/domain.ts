/**
 * DOMAIN MODEL — read this before touching UI code.
 *
 * Core principle: the PATIENT owns their record. A PatientProfile is a single
 * persistent identity that accumulates VisitEntry records over time, across
 * any number of different clinics/providers. Nothing here is scoped to a
 * clinic — a VisitEntry references the clinic/provider it was captured for,
 * but ownership and the ability to read history lives with the profile.
 *
 * A provider never gets a standing pointer into a patient's data; they hold
 * a ProviderAccessGrant, which is a revocable, scoped permission the patient
 * controls. In v1 grants are mocked (auto-approved) but the shape is real,
 * so wiring up an actual approve/revoke UI later is additive, not a rewrite.
 *
 * GUARDRAIL: nothing in this file computes or stores a diagnosis, an
 * urgency/severity score, or a clinical inference. Every "severity" field
 * is the patient's own words, not a triage rank. If a future field looks
 * like it's summarizing "what this might mean," that's out of scope — flag
 * it instead of adding it.
 */

export type LanguageCode = "en" | "es" | "zh";

export type DialysisModality = "hemodialysis" | "peritoneal_dialysis" | "not_on_dialysis" | "unknown";

export type VascularAccessType = "fistula" | "graft" | "catheter" | "peritoneal_catheter" | "unknown";

/**
 * The patient's persistent identity. One of these exists per patient, full
 * stop — it is never created or owned "by" a clinic. Relatively stable
 * clinical context (modality, schedule, access type, current med list)
 * lives here because it changes slowly and should carry forward from visit
 * to visit rather than being re-collected from scratch every time.
 */
export interface PatientProfile {
  id: string;
  preferredLanguage: LanguageCode;
  displayName: string;
  dateOfBirth: string; // ISO date, fictional test data only
  createdAt: string; // ISO datetime

  dialysis: {
    modality: DialysisModality;
    scheduleDays: string[]; // e.g. ["Mon", "Wed", "Fri"], patient-reported
    accessType: VascularAccessType;
    /** Patient's understanding of their target/"dry" weight, in their own words + a parsed number if given. */
    dryWeightLbs: number | null;
  };

  /** Current medication list as last reconciled at any visit. Each visit can add/update entries. */
  currentMedications: MedicationEntry[];

  /** Standing conditions/history the patient has reported, carried forward across visits. */
  relevantHistory: string[];

  /** Every clinic/provider that currently has, has requested, or has ever been granted access to this profile. */
  accessGrants: ProviderAccessGrant[];
}

export interface MedicationEntry {
  id: string;
  name: string; // as the patient said it — may be a brand name, misspelling, "the water pill"
  patientDescription: string; // patient's own phrasing, verbatim
  reportedAt: string; // ISO datetime, when this entry was last confirmed/updated
}

export type AccessGrantStatus = "pending" | "active" | "revoked" | "denied";

/**
 * Models "provider requests access, patient authorizes it" — the inverse of
 * a clinic owning the chart. A grant is scoped to a specific provider/clinic
 * and can be revoked by the patient at any time; it never grants blanket
 * access to every future visit unless the patient leaves it active.
 */
export interface ProviderAccessGrant {
  id: string;
  providerName: string; // e.g. "Dr. Nguyen — Westside Nephrology"
  clinicName: string;
  status: AccessGrantStatus;
  requestedAt: string;
  /** Timestamp of the most recent patient action on this grant (approve, deny, or revoke) — not only the original response. */
  respondedAt: string | null;
  /** Which visit entries this grant covers. "all" = full history; otherwise a specific set of visit IDs. */
  scope: "all" | string[];
}

export type VisitStatus = "in_progress" | "completed";

/**
 * One pre-visit intake conversation, tied to exactly one PatientProfile.
 * A VisitEntry is captured *for* a clinic/provider context (so the care
 * team knows who it's headed to) but it is stored under the patient's
 * profile, not under the clinic — the clinic sees it only via an active
 * ProviderAccessGrant, never by direct ownership.
 */
export interface VisitEntry {
  id: string;
  patientProfileId: string;
  createdAt: string;
  completedAt: string | null;
  status: VisitStatus;
  languageUsed: LanguageCode;

  /** Which clinic/provider this intake was prepared for. Does not imply ownership — see accessGrants on the profile. */
  intendedProvider: {
    clinicName: string;
    providerName: string | null;
  };

  reasonForVisit: FieldWithQuote;

  /** One or more distinct symptoms/concerns raised in this visit. */
  symptoms: SymptomReport[];

  dialysisContext: DialysisVisitContext;

  /** Medications the patient specifically flagged as changed/relevant this visit (deltas on top of profile.currentMedications). */
  medicationNotes: FieldWithQuote[];

  relevantHistoryNotes: FieldWithQuote[];

  /** What the patient says worries them most about all of this, in their own words. Not a triage flag — just captured verbatim. */
  biggestConcern: FieldWithQuote | null;

  /** Full transcript of the guided conversation, in question order, for auditability. */
  conversation: ConversationTurn[];

  /** Generated outputs, produced from the structured data above. Stored so a completed visit's outputs don't drift if templates change later. */
  outputs: {
    clinicianSummaryGeneratedAt: string | null;
    patientRecap: PatientRecap | null;
  };
}

/**
 * Every structured field pairs a normalized value with the patient's own
 * words. We never discard the verbatim phrasing — that's the whole point
 * of "don't paraphrase away nuance."
 */
export interface FieldWithQuote {
  structured: string;
  patientQuote: string;
  quoteLanguage: LanguageCode;
}

export type SymptomCategory =
  | "pain"
  | "swelling"
  | "shortness_of_breath"
  | "fatigue"
  | "nausea_vomiting"
  | "itching"
  | "cramping"
  | "access_site_issue"
  | "appetite_change"
  | "sleep_issue"
  | "other";

/**
 * Captures one symptom the way a triage nurse would ask about it — onset,
 * location, severity IN THE PATIENT'S OWN WORDS (never a computed score),
 * duration, what helps/worsens it, what's been tried, and how it's
 * affecting them. No field here ranks urgency or suggests a cause.
 */
export interface SymptomReport {
  id: string;
  category: SymptomCategory;
  description: FieldWithQuote;
  onset: FieldWithQuote | null; // when it started
  location: FieldWithQuote | null;
  severityInPatientsWords: FieldWithQuote | null; // e.g. "like a 6 out of 10", "unbearable at night" — captured, not scored by us
  duration: FieldWithQuote | null; // constant vs. comes and goes, how long each episode
  whatMakesItBetter: FieldWithQuote | null;
  whatMakesItWorse: FieldWithQuote | null;
  whatHasBeenTried: FieldWithQuote | null;
}

/**
 * Dialysis-specific intake questions. All patient-reported, no derived
 * clinical judgment (e.g. we do not decide if a weight change is
 * "concerning" — we just record what the patient said).
 */
export interface DialysisVisitContext {
  recentWeightChange: FieldWithQuote | null;
  fluidDietAdherence: FieldWithQuote | null; // patient's own account of how fluid/diet restrictions have been going
  feelingOnDialysisDays: FieldWithQuote | null;
  feelingOffDialysisDays: FieldWithQuote | null;
  missedOrShortenedSessions: FieldWithQuote | null;
}

/**
 * One question/answer exchange in the guided conversation, kept in order
 * for a full transcript. questionTextShown is in whatever language the
 * visit was conducted in.
 */
export interface ConversationTurn {
  id: string;
  stepId: string; // references a step in the scripted flow, for traceability
  questionTextShown: string;
  answerVerbatim: string;
  answeredAt: string;
}

/**
 * Output #2: what goes back to the patient. Plain language, their own
 * language, plus points/questions they might want to raise — never phrased
 * as advice about what a symptom means.
 */
export interface PatientRecap {
  language: LanguageCode;
  summaryText: string;
  suggestedQuestionsForCareTeam: string[];
  generatedAt: string;
}

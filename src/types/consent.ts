/**
 * DOMAIN MODEL — Context-Aware Medical Consent Translator (prototype).
 *
 * A ConsentCase represents one patient's journey through a procedure, from
 * first appointment through surgery/consent. It exists to test a single
 * hypothesis: that a translation informed by the accumulated context of a
 * patient's visits (health literacy signals, prior fears/questions, how much
 * they already understand) produces better comprehension than a one-shot
 * literal translation of the consent document alone.
 *
 * Two things are deliberately separate:
 *  - `timelineEntries`: free-text notes logged over time (never translated
 *    themselves — they're context, not content).
 *  - `documents`: the actual consent/pre-op text that gets translated. Each
 *    document's literal translation ignores the timeline (the control); its
 *    context-adapted translation is generated using the timeline as input.
 *
 * GUARDRAIL: this is a prototype tool for de-identified/reconstructed
 * content only. Nothing here should ever hold real PHI — see README.md.
 */

export type TargetLanguage = "zh";

export const TARGET_LANGUAGE_NAMES: Record<TargetLanguage, string> = {
  zh: "Mandarin (Simplified Chinese)",
};

export interface ConsentCase {
  id: string;
  title: string; // e.g. "ACL Reconstruction — Pre-Op Consent"
  procedureName: string;
  targetLanguage: TargetLanguage;
  createdAt: string;
  timelineEntries: TimelineEntry[];
  documents: ConsentDocument[];
}

/** One manually-logged appointment note or piece of context, in chronological order. */
export interface TimelineEntry {
  id: string;
  date: string; // patient/founder-entered date (ISO date), when this happened
  label: string; // e.g. "Initial ortho consult", "Pre-op call with nurse navigator"
  notes: string; // free text, English, manually entered — never translated
  createdAt: string;
}

/** One piece of consent/pre-op source text to be translated. */
export interface ConsentDocument {
  id: string;
  label: string; // e.g. "ACL Reconstruction Informed Consent Form"
  sourceText: string; // English source text, as pasted/entered
  createdAt: string;
  translation: TranslationResult | null;
}

export interface TranslationResult {
  targetLanguage: TargetLanguage;
  modelId: string;
  generatedAt: string;
  /** How many timeline entries were fed into the context-adapted generation — for transparency when reviewing. */
  contextEntriesUsedCount: number;

  literalTranslation: string;

  contextAdapted: {
    translatedText: string;
    /** English notes explaining what changed vs. the literal version and why — for the founder/reviewer, not the patient. */
    adaptationNotes: string[];
  };

  teachBack: TeachBackQuestion[];

  /** Set once a blind reviewer has compared the two versions — see ReviewerAssignment below. */
  reviewerFeedback: ReviewerFeedback | null;
}

export interface TeachBackQuestion {
  id: string;
  questionTarget: string; // the teach-back question, in the target language
  questionEnglishGloss: string; // English gloss, so the founder knows what's being asked
  whatAGoodAnswerCovers: string; // English — what a correct/complete answer should include
  /** Filled in manually after actually running the teach-back with a patient/reviewer. */
  outcome: TeachBackOutcome;
  outcomeNotes: string;
}

export type TeachBackOutcome = "not_yet_tried" | "understood" | "partially_understood" | "misunderstood";

/**
 * Supports the core validation question: "can a Mandarin-speaking reviewer
 * tell the difference in comprehension between literal and context-adapted?"
 * The two versions are shown as blinded "Version A" / "Version B" (order
 * randomized per document) until the reviewer records a pick.
 */
export interface ReviewerFeedback {
  /** Which label ("A" or "B") was randomly assigned to the context-adapted version — kept server(client)-side until reveal. */
  contextAdaptedLabel: "A" | "B";
  pickedClearer: "A" | "B" | "no_difference" | null;
  notes: string;
  recordedAt: string | null;
}

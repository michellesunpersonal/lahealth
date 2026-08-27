import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { ConsentCase, ConsentDocument, TargetLanguage, TeachBackQuestion, TranslationResult } from "../types/consent";
import { TARGET_LANGUAGE_NAMES } from "../types/consent";
import { newId, nowIso } from "../lib/id";

const MODEL_ID = "claude-opus-5";

const TeachBackQuestionSchema = z.object({
  questionTarget: z
    .string()
    .describe("The teach-back question itself, written in the target language, phrased to ask the patient directly."),
  questionEnglishGloss: z
    .string()
    .describe("A literal English gloss of the question, for a reader who does not read the target language."),
  whatAGoodAnswerCovers: z
    .string()
    .describe(
      "English. What a correct, complete patient answer should include — used to judge whether the patient actually understood, not just that text was read to them.",
    ),
});

const TranslationOutputSchema = z.object({
  literalTranslation: z
    .string()
    .describe(
      "A literal, faithful translation of the source text into the target language. Word-for-word accurate, preserving sentence structure and register as closely as the target language allows. No simplification, no cultural framing, no added explanation — this is the control/baseline version.",
    ),
  contextAdaptedText: z
    .string()
    .describe(
      "A context-adapted translation of the SAME source text into the target language: health-literacy adjusted (short sentences, plain everyday words, define or replace medical jargon a lay reader wouldn't know) and culturally framed for the target-language-speaking patient population. It must still convey every material fact, risk, benefit, alternative, and consent point present in the source — adapt how it's said, never what is said. Do not invent, omit, or soften any risk or consequence that appears in the source.",
    ),
  adaptationNotes: z
    .array(z.string())
    .min(1)
    .describe(
      "English notes for the founder/reviewer, each one pointing at a specific place where the context-adapted version differs from a literal translation and explaining why (a term reframed, an analogy added, a clause simplified, something informed by the patient's timeline). Not a summary of the whole document — call out specific, checkable choices.",
    ),
  teachBackQuestions: z
    .array(TeachBackQuestionSchema)
    .min(3)
    .max(6)
    .describe(
      "3 to 6 short teach-back questions in the target language a clinician or interpreter could ask the patient afterward to verify real comprehension of the key risks, the procedure itself, and the alternatives — not just that the document was read aloud.",
    ),
});

function buildSystemPrompt(targetLanguage: TargetLanguage): string {
  const languageName = TARGET_LANGUAGE_NAMES[targetLanguage];
  return `You are helping build a prototype tool that supports medical interpreters and language-access coordinators — you are augmenting scarce interpreter capacity, not replacing a qualified medical interpreter. The tool translates informed consent and pre-operative briefing documents from English into ${languageName}, and produces two versions to compare:

1. A literal translation (the control/baseline).
2. A context-adapted translation: the same facts, adapted for health literacy and cultural framing, using context about this specific patient's care journey when it is provided.

Hard rules, because this is informed consent language with real liability and safety stakes:
- Never add a medical fact, risk, or instruction that is not present in the source text.
- Never remove or soften a risk, complication, or consequence that is present in the source text — adaptation changes HOW something is said, never WHAT is disclosed.
- If the source text is ambiguous or you are unsure of a medical term's correct rendering, translate conservatively and do not guess.
- The literal translation must be generated from the source text alone. Do not let patient-journey context influence its wording.
- The context-adapted translation may use the patient-journey context (if provided) to choose framing, analogies, and which concepts need more explanation — but the underlying facts must match the source text exactly, and every adaptation choice of note should be explained in adaptationNotes.
- Teach-back questions must test understanding of consequences (what could go wrong, what the procedure involves, what alternatives exist), not just recall of a word or date.`;
}

function buildUserPrompt(consentCase: ConsentCase, document: ConsentDocument): { prompt: string; contextEntriesUsedCount: number } {
  const sortedTimeline = [...consentCase.timelineEntries].sort((a, b) => a.date.localeCompare(b.date));

  const timelineBlock =
    sortedTimeline.length === 0
      ? "(No prior timeline entries logged for this patient yet — the context-adapted version should still be health-literacy adjusted and culturally framed, just without patient-specific context to draw on.)"
      : sortedTimeline
          .map((e, i) => `${i + 1}. [${e.date}] ${e.label}\n${e.notes}`)
          .join("\n\n");

  const prompt = `Procedure: ${consentCase.procedureName}
Document: ${document.label}

=== PATIENT TIMELINE (chronological context — use ONLY for the context-adapted version) ===
${timelineBlock}

=== SOURCE TEXT (English, from the consent/pre-op document) ===
${document.sourceText}

Produce the literal translation, the context-adapted translation, the adaptation notes, and the teach-back questions as specified.`;

  return { prompt, contextEntriesUsedCount: sortedTimeline.length };
}

export class TranslationClientError extends Error {}

export async function generateTranslation(consentCase: ConsentCase, document: ConsentDocument, apiKey: string): Promise<TranslationResult> {
  if (!apiKey.trim()) {
    throw new TranslationClientError("Add your Anthropic API key first (see Settings on the home page).");
  }
  if (!document.sourceText.trim()) {
    throw new TranslationClientError("This document has no source text to translate.");
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const { prompt, contextEntriesUsedCount } = buildUserPrompt(consentCase, document);

  let parsed: z.infer<typeof TranslationOutputSchema> | null;
  try {
    const response = await client.messages.parse({
      model: MODEL_ID,
      max_tokens: 8000,
      system: buildSystemPrompt(consentCase.targetLanguage),
      messages: [{ role: "user", content: prompt }],
      output_config: {
        effort: "high",
        format: zodOutputFormat(TranslationOutputSchema),
      },
    });
    parsed = response.parsed_output;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new TranslationClientError("That API key was rejected by Anthropic. Double-check it in Settings.");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new TranslationClientError("Rate limited by the Anthropic API — wait a moment and try again.");
    }
    if (err instanceof Anthropic.APIError) {
      throw new TranslationClientError(`Anthropic API error: ${err.message}`);
    }
    throw err;
  }

  if (!parsed) {
    throw new TranslationClientError("The model's response couldn't be parsed into the expected format. Try again.");
  }

  const teachBack: TeachBackQuestion[] = parsed.teachBackQuestions.map((q) => ({
    id: newId(),
    questionTarget: q.questionTarget,
    questionEnglishGloss: q.questionEnglishGloss,
    whatAGoodAnswerCovers: q.whatAGoodAnswerCovers,
    outcome: "not_yet_tried",
    outcomeNotes: "",
  }));

  return {
    targetLanguage: consentCase.targetLanguage,
    modelId: MODEL_ID,
    generatedAt: nowIso(),
    contextEntriesUsedCount,
    literalTranslation: parsed.literalTranslation,
    contextAdapted: {
      translatedText: parsed.contextAdaptedText,
      adaptationNotes: parsed.adaptationNotes,
    },
    teachBack,
    reviewerFeedback: {
      contextAdaptedLabel: Math.random() < 0.5 ? "A" : "B",
      pickedClearer: null,
      notes: "",
      recordedAt: null,
    },
  };
}

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { PatientProfile, VisitEntry } from "../types/domain";
import type { SafetyFlag, VisitBriefing } from "../types/briefing";
import { nowIso } from "../lib/id";
import { assembleBriefingSource } from "./assembleSource";

const MODEL_ID = "claude-opus-5";

const VisitBriefingOutputSchema = z.object({
  reasonForVisitEnglish: z.string().describe("Literal English translation of the patient's stated reason for this visit. Empty string if none was given."),
  activeConditionsEnglish: z
    .array(z.string())
    .describe("Literal English translation of each active condition/history item, one per item, same order as given."),
  medicationsAndChangesEnglish: z
    .array(z.string())
    .describe("Literal English translation of each current medication (with the patient's description) and each visit medication note, one per item."),
  safetyFlagsEnglish: z
    .array(z.string())
    .describe("Literal English translation of each safety flag's detail text, one per item, paired with its label."),
  alreadyExplainedEnglish: z
    .array(z.string())
    .describe(
      "Literal English translation of what the patient already said in their own words this visit — symptom descriptions and their biggest concern — one item per quote.",
    ),
  openQuestionsEnglish: z
    .array(z.string())
    .describe("Literal English translation of each carried-over open question, one per item, same order as given."),
});

const SYSTEM_PROMPT = `You are producing the English side of a bilingual pre-visit briefing for a clinician or interpreter, so they have real patient context before an encounter starts. You are translating, not interpreting or summarizing with added judgment.

Hard rules:
- Literal translation only. Do not add, infer, omit, or soften any medical fact, symptom, or concern present in the source.
- Do not diagnose, triage-rank, or suggest what a symptom might mean — translate what was said, nothing more.
- Preserve the list structure given to you: same number of items, same order, one translated item per source item.
- If a list is empty in the input, return an empty list for it — do not invent content to fill it.`;

function formatList(items: string[]): string {
  return items.length ? items.map((item, i) => `${i + 1}. ${item}`).join("\n") : "(none)";
}

function buildUserPrompt(
  profile: PatientProfile,
  visit: VisitEntry,
  safetyFlags: SafetyFlag[],
  openQuestionsCarried: string[],
): string {
  const source = assembleBriefingSource(profile, visit, safetyFlags);

  return `Reason for visit:
${source.reasonForVisit || "(none given)"}

Active conditions/history (${source.activeConditions.length} items):
${formatList(source.activeConditions)}

Current medications and recent changes (${source.medications.length} items):
${formatList(source.medications)}

Safety flags (${source.safetyFlagLines.length} items):
${formatList(source.safetyFlagLines)}

What the patient already said in their own words this visit (${source.alreadyExplained.length} items):
${formatList(source.alreadyExplained)}

Open questions carried over from the prior visit (${openQuestionsCarried.length} items):
${formatList(openQuestionsCarried)}

Translate each section into English, preserving item count and order exactly.`;
}

export class TranslationClientError extends Error {}

export async function generateVisitBriefing(
  profile: PatientProfile,
  visit: VisitEntry,
  safetyFlags: SafetyFlag[],
  openQuestionsCarried: string[],
  apiKey: string,
): Promise<VisitBriefing> {
  if (!apiKey.trim()) {
    throw new TranslationClientError("Add your Anthropic API key first (see Settings on the dashboard).");
  }

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const prompt = buildUserPrompt(profile, visit, safetyFlags, openQuestionsCarried);

  let parsed: z.infer<typeof VisitBriefingOutputSchema> | null;
  try {
    const response = await client.messages.parse({
      model: MODEL_ID,
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      output_config: {
        effort: "medium",
        format: zodOutputFormat(VisitBriefingOutputSchema),
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

  return {
    visitId: visit.id,
    modelId: MODEL_ID,
    generatedAt: nowIso(),
    reasonForVisitEnglish: parsed.reasonForVisitEnglish,
    activeConditionsEnglish: parsed.activeConditionsEnglish,
    medicationsAndChangesEnglish: parsed.medicationsAndChangesEnglish,
    safetyFlagsEnglish: parsed.safetyFlagsEnglish,
    alreadyExplainedEnglish: parsed.alreadyExplainedEnglish,
    openQuestionsEnglish: parsed.openQuestionsEnglish,
  };
}

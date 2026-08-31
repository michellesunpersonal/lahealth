import { useState } from "react";
import type { ConsentDocument, TeachBackQuestion } from "../types/consent";
import { nowIso } from "../lib/id";
import TeachBackOutcomeButtons from "./TeachBackOutcomeButtons";

interface Props {
  document: ConsentDocument;
  onUpdate: (updated: ConsentDocument) => void;
}

export default function TranslationResultView({ document, onUpdate }: Props) {
  const translation = document.translation;
  const [blindMode, setBlindMode] = useState(true);
  const [reviewerNotes, setReviewerNotes] = useState("");

  if (!translation) return null;

  const feedback = translation.reviewerFeedback;
  const revealed = !blindMode || feedback?.pickedClearer != null;

  const versionA = feedback?.contextAdaptedLabel === "A" ? translation.contextAdapted.translatedText : translation.literalTranslation;
  const versionB = feedback?.contextAdaptedLabel === "B" ? translation.contextAdapted.translatedText : translation.literalTranslation;
  const aIsContextAdapted = feedback?.contextAdaptedLabel === "A";

  function recordPick(pick: "A" | "B" | "no_difference") {
    if (!translation || !feedback) return;
    onUpdate({
      ...document,
      translation: {
        ...translation,
        reviewerFeedback: { ...feedback, pickedClearer: pick, notes: reviewerNotes, recordedAt: nowIso() },
      },
    });
  }

  function updateTeachBack(id: string, patch: Partial<TeachBackQuestion>) {
    if (!translation) return;
    onUpdate({
      ...document,
      translation: {
        ...translation,
        teachBack: translation.teachBack.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="text-xs text-slate-400">
        Generated {new Date(translation.generatedAt).toLocaleString()} · {translation.modelId} ·{" "}
        {translation.contextEntriesUsedCount === 0
          ? "no timeline context used"
          : `informed by ${translation.contextEntriesUsedCount} timeline ${translation.contextEntriesUsedCount === 1 ? "entry" : "entries"}`}
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-indigo-900">Blind reviewer check</h3>
          <label className="flex items-center gap-2 text-xs text-indigo-700">
            <input type="checkbox" checked={blindMode} onChange={(e) => setBlindMode(e.target.checked)} />
            Hide which version is which
          </label>
        </div>
        <p className="text-xs text-indigo-800 mb-3">
          Have a Mandarin-speaking reviewer read both versions below and say which one they'd understand better as a
          patient — before you tell them which is literal and which is context-adapted.
        </p>

        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500 mb-1">
              Version A {revealed && <span className="text-slate-400">({aIsContextAdapted ? "context-adapted" : "literal"})</span>}
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap">{versionA}</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="text-xs font-medium text-slate-500 mb-1">
              Version B {revealed && <span className="text-slate-400">({aIsContextAdapted ? "literal" : "context-adapted"})</span>}
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap">{versionB}</div>
          </div>
        </div>

        {feedback?.pickedClearer ? (
          <div className="text-sm text-indigo-900">
            Reviewer picked:{" "}
            <span className="font-medium">
              {feedback.pickedClearer === "no_difference" ? "No difference" : `Version ${feedback.pickedClearer}`}
            </span>
            {feedback.notes && <span className="text-indigo-700"> — "{feedback.notes}"</span>}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              placeholder="Optional notes from the reviewer"
              className="w-full px-3 py-2 rounded-lg border border-indigo-200 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => recordPick("A")}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                A was clearer
              </button>
              <button
                onClick={() => recordPick("B")}
                className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                B was clearer
              </button>
              <button
                onClick={() => recordPick("no_difference")}
                className="flex-1 px-3 py-2 rounded-lg border border-indigo-300 text-indigo-700 text-sm font-medium hover:bg-indigo-100"
              >
                No difference
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Literal translation (control)</h3>
        <div className="bg-white rounded-lg border border-slate-200 p-3 text-sm text-slate-800 whitespace-pre-wrap">
          {translation.literalTranslation}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Context-adapted translation</h3>
        <div className="bg-white rounded-lg border border-slate-200 p-3 text-sm text-slate-800 whitespace-pre-wrap">
          {translation.contextAdapted.translatedText}
        </div>
        {translation.contextAdapted.adaptationNotes.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-slate-500 list-disc list-inside">
            {translation.contextAdapted.adaptationNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-2">Teach-back comprehension check</h3>
        <p className="text-xs text-slate-500 mb-3">
          Ask these after presenting the document, then record what actually happened — this is how a real
          misunderstanding gets caught, not the translation text alone.
        </p>
        <ul className="space-y-3">
          {translation.teachBack.map((q) => (
            <li key={q.id} className="bg-white rounded-lg border border-slate-200 p-3">
              <div className="text-sm text-slate-800">{q.questionTarget}</div>
              <div className="text-xs text-slate-400 mt-0.5">{q.questionEnglishGloss}</div>
              <div className="text-xs text-slate-500 mt-1.5">
                <span className="font-medium">A good answer covers:</span> {q.whatAGoodAnswerCovers}
              </div>
              <TeachBackOutcomeButtons value={q.outcome} onChange={(outcome) => updateTeachBack(q.id, { outcome })} />
              <input
                value={q.outcomeNotes}
                onChange={(e) => updateTeachBack(q.id, { outcomeNotes: e.target.value })}
                placeholder="What the patient actually said (optional)"
                className="mt-2 w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

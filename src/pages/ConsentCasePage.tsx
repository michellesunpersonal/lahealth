import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { consentStore } from "../data/consentStorage";
import { generateTranslation, TranslationClientError } from "../consent/translateClient";
import type { ConsentCase, ConsentDocument, TimelineEntry } from "../types/consent";
import { newId, nowIso } from "../lib/id";
import TranslationResultView from "../components/TranslationResultView";

export default function ConsentCasePage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [, forceRender] = useState(0);
  const consentCase = caseId ? consentStore.getCase(caseId) : null;
  const [generatingDocId, setGeneratingDocId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [entryLabel, setEntryLabel] = useState("");
  const [entryNotes, setEntryNotes] = useState("");

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docLabel, setDocLabel] = useState("");
  const [docText, setDocText] = useState("");

  if (!consentCase) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 text-sm">
          Case not found. <Link to="/consent" className="text-indigo-600 hover:underline">Back to cases</Link>
        </div>
      </div>
    );
  }
  const currentCase = consentCase;

  function persist(updated: ConsentCase) {
    consentStore.saveCase(updated);
    forceRender((n) => n + 1);
  }

  function addTimelineEntry() {
    if (!entryLabel.trim()) return;
    const entry: TimelineEntry = {
      id: newId(),
      date: entryDate,
      label: entryLabel.trim(),
      notes: entryNotes.trim(),
      createdAt: nowIso(),
    };
    persist({ ...currentCase, timelineEntries: [...currentCase.timelineEntries, entry] });
    setEntryLabel("");
    setEntryNotes("");
    setShowAddEntry(false);
  }

  function deleteTimelineEntry(id: string) {
    persist({ ...currentCase, timelineEntries: currentCase.timelineEntries.filter((e) => e.id !== id) });
  }

  function addDocument() {
    if (!docLabel.trim() || !docText.trim()) return;
    const doc: ConsentDocument = {
      id: newId(),
      label: docLabel.trim(),
      sourceText: docText,
      createdAt: nowIso(),
      translation: null,
    };
    persist({ ...currentCase, documents: [...currentCase.documents, doc] });
    setDocLabel("");
    setDocText("");
    setShowAddDoc(false);
  }

  function deleteDocument(id: string) {
    persist({ ...currentCase, documents: currentCase.documents.filter((d) => d.id !== id) });
  }

  function updateDocument(updated: ConsentDocument) {
    persist({ ...currentCase, documents: currentCase.documents.map((d) => (d.id === updated.id ? updated : d)) });
  }

  async function handleGenerate(doc: ConsentDocument) {
    setError(null);
    setGeneratingDocId(doc.id);
    try {
      const apiKey = consentStore.getApiKey();
      const translation = await generateTranslation(currentCase, doc, apiKey);
      updateDocument({ ...doc, translation });
    } catch (err) {
      setError(err instanceof TranslationClientError ? err.message : "Something went wrong generating the translation.");
    } finally {
      setGeneratingDocId(null);
    }
  }

  const sortedTimeline = [...currentCase.timelineEntries].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/consent" className="text-xs text-slate-400 hover:text-slate-600">
            ← All cases
          </Link>
          <div className="font-semibold text-slate-900 truncate">{currentCase.title}</div>
          <div className="text-xs text-slate-500">{currentCase.procedureName}</div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">{error}</div>}

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-slate-500">Timeline</h2>
            <button onClick={() => setShowAddEntry((s) => !s)} className="text-xs text-indigo-600 hover:underline">
              {showAddEntry ? "Cancel" : "+ Add entry"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Appointment notes logged over time, from first visit through surgery. This feeds the context-adapted
            translation below — the literal translation never sees it.
          </p>

          {showAddEntry && (
            <div className="space-y-2 mb-4 pb-4 border-b border-slate-100">
              <div className="flex gap-2">
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  value={entryLabel}
                  onChange={(e) => setEntryLabel(e.target.value)}
                  placeholder="e.g. Initial ortho consult"
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <textarea
                value={entryNotes}
                onChange={(e) => setEntryNotes(e.target.value)}
                placeholder="What happened, what the patient said or asked, health literacy signals, concerns..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <button
                onClick={addTimelineEntry}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Add entry
              </button>
            </div>
          )}

          {sortedTimeline.length === 0 ? (
            <p className="text-sm text-slate-400">No timeline entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {sortedTimeline.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-slate-800">
                      <span className="text-slate-400">{e.date}</span> — {e.label}
                    </div>
                    {e.notes && <div className="text-xs text-slate-500 whitespace-pre-wrap">{e.notes}</div>}
                  </div>
                  <button onClick={() => deleteTimelineEntry(e.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-500">Documents</h2>
            <button onClick={() => setShowAddDoc((s) => !s)} className="text-xs text-indigo-600 hover:underline">
              {showAddDoc ? "Cancel" : "+ Add document"}
            </button>
          </div>

          {showAddDoc && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
              <input
                value={docLabel}
                onChange={(e) => setDocLabel(e.target.value)}
                placeholder="e.g. ACL Reconstruction Informed Consent Form"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
              <textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder="Paste the English source text (de-identified/reconstructed only — no real PHI)"
                rows={8}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
              />
              <button
                onClick={addDocument}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Add document
              </button>
            </div>
          )}

          {currentCase.documents.length === 0 && !showAddDoc && <p className="text-sm text-slate-400">No documents yet.</p>}

          {currentCase.documents.map((doc) => (
            <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-slate-800">{doc.label}</h3>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => handleGenerate(doc)}
                    disabled={generatingDocId === doc.id}
                    className="text-xs px-3 py-1.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {generatingDocId === doc.id ? "Generating…" : doc.translation ? "Regenerate" : "Generate translation"}
                  </button>
                  <button onClick={() => deleteDocument(doc.id)} className="text-xs text-red-400 hover:text-red-600">
                    Delete
                  </button>
                </div>
              </div>

              <details className="text-xs text-slate-500">
                <summary className="cursor-pointer">Source text</summary>
                <div className="mt-2 whitespace-pre-wrap">{doc.sourceText}</div>
              </details>

              {doc.translation ? (
                <TranslationResultView document={doc} onUpdate={updateDocument} />
              ) : generatingDocId === doc.id ? (
                <p className="text-sm text-slate-400">Generating literal + context-adapted translation…</p>
              ) : null}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

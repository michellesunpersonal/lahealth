import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { consentStore } from "../data/consentStorage";
import type { ConsentCase } from "../types/consent";
import { newId, nowIso } from "../lib/id";

export default function ConsentHomePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<ConsentCase[]>(() => consentStore.getAllCases());

  const [apiKey, setApiKey] = useState(() => consentStore.getApiKey());
  const [apiKeySaved, setApiKeySaved] = useState(true);

  const [showNewCase, setShowNewCase] = useState(false);
  const [title, setTitle] = useState("");
  const [procedureName, setProcedureName] = useState("");

  function refresh() {
    setCases(consentStore.getAllCases());
  }

  function saveApiKey() {
    consentStore.setApiKey(apiKey.trim());
    setApiKeySaved(true);
  }

  function createCase() {
    if (!title.trim() || !procedureName.trim()) return;
    const newCase: ConsentCase = {
      id: newId(),
      title: title.trim(),
      procedureName: procedureName.trim(),
      targetLanguage: "zh",
      createdAt: nowIso(),
      timelineEntries: [],
      documents: [],
    };
    consentStore.saveCase(newCase);
    navigate(`/consent/${newCase.id}`);
  }

  function deleteCase(id: string) {
    if (!confirm("Delete this case and everything logged under it? This can't be undone.")) return;
    consentStore.deleteCase(id);
    refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900">Medical Consent Translator</div>
            <div className="text-xs text-slate-500">Context-aware translation prototype</div>
          </div>
          <a href="/login" className="text-sm text-slate-500 hover:text-slate-800">
            Symptom capture tool →
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 space-y-1">
          <p className="font-medium">Prototype — do not enter real patient data.</p>
          <p>
            Use de-identified or reconstructed content only. Claude via the standard API is not covered by a signed
            HIPAA Business Associate Agreement, so nothing here should be real, identifiable PHI. Everything is
            stored locally in this browser (localStorage) — there is no backend.
          </p>
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-medium text-slate-500 mb-3">Anthropic API key</h2>
          <p className="text-xs text-slate-500 mb-3">
            Stored only in this browser's localStorage. Requests go directly from this browser to the Anthropic API
            — never through a server of ours.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setApiKeySaved(false);
              }}
              placeholder="sk-ant-..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm font-mono"
            />
            <button
              onClick={saveApiKey}
              disabled={apiKeySaved}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
            >
              {apiKeySaved ? "Saved" : "Save"}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          {!showNewCase ? (
            <button
              onClick={() => setShowNewCase(true)}
              className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700"
            >
              New case
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Case title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ACL Reconstruction — Pre-Op Consent"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Procedure</label>
                <input
                  value={procedureName}
                  onChange={(e) => setProcedureName(e.target.value)}
                  placeholder="e.g. Arthroscopic ACL reconstruction"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div className="text-xs text-slate-500">
                Target language: <span className="font-medium text-slate-700">Mandarin (Simplified Chinese)</span> —
                the only language this prototype supports.
              </div>
              <button
                onClick={createCase}
                className="w-full px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
              >
                Create case
              </button>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3">Cases</h2>
          {cases.length === 0 ? (
            <p className="text-sm text-slate-400">No cases yet.</p>
          ) : (
            <ul className="space-y-2">
              {cases.map((c) => (
                <li
                  key={c.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3"
                >
                  <button className="text-left min-w-0 flex-1" onClick={() => navigate(`/consent/${c.id}`)}>
                    <div className="text-sm font-medium text-slate-800 truncate">{c.title}</div>
                    <div className="text-xs text-slate-400">
                      {c.procedureName} · {c.timelineEntries.length} timeline{" "}
                      {c.timelineEntries.length === 1 ? "entry" : "entries"} · {c.documents.length}{" "}
                      {c.documents.length === 1 ? "document" : "documents"}
                    </div>
                  </button>
                  <button onClick={() => deleteCase(c.id)} className="text-xs text-red-500 hover:text-red-700 shrink-0">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

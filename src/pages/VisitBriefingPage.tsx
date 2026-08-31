import { useState } from "react";
import { Navigate, Link, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../data/SessionContext";
import { store } from "../data/storage";
import { consentStore } from "../data/consentStorage";
import { settingsStore } from "../data/settingsStorage";
import { briefingStore } from "../data/briefingStorage";
import { generateVisitBriefing, TranslationClientError } from "../briefing/translateVisit";
import { assembleBriefingSource } from "../briefing/assembleSource";
import type { SafetyFlag, VisitConsentLink } from "../types/briefing";
import type { LanguageCode } from "../types/domain";
import VisitStepper from "../components/VisitStepper";
import ClinicianSummaryView from "../components/ClinicianSummaryView";
import { newId, nowIso } from "../lib/id";
import { LANGUAGE_NAMES } from "../i18n/strings";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 print:border-0 print:p-0 print:mb-6">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function BilingualList({
  patientLines,
  englishLines,
  patientLangLabel,
  generated,
}: {
  patientLines: string[];
  englishLines: string[] | null;
  patientLangLabel: string;
  generated: boolean;
}) {
  if (patientLines.length === 0) {
    return <p className="text-sm text-slate-400 italic">Not discussed this visit.</p>;
  }
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <div>
        <div className="text-xs font-medium text-slate-400 mb-1">{patientLangLabel}</div>
        <ul className="space-y-1.5 text-sm text-slate-800">
          {patientLines.map((line, i) => (
            <li key={i} className="whitespace-pre-wrap">
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-medium text-slate-400 mb-1">English</div>
        {generated && englishLines ? (
          <ul className="space-y-1.5 text-sm text-slate-800">
            {englishLines.map((line, i) => (
              <li key={i} className="whitespace-pre-wrap">
                {line}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-300 italic">Generate to see English</p>
        )}
      </div>
    </div>
  );
}

export default function VisitBriefingPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const { profile } = useSession();
  const navigate = useNavigate();
  const [, forceRender] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAddFlag, setShowAddFlag] = useState(false);
  const [flagLabel, setFlagLabel] = useState("");
  const [flagDetail, setFlagDetail] = useState("");

  const [showCreateCase, setShowCreateCase] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseProcedure, setCaseProcedure] = useState("");
  const [attachCaseId, setAttachCaseId] = useState("");

  if (!profile) return null;
  const visit = visitId ? store.getVisit(visitId) : null;
  if (!visit || visit.patientProfileId !== profile.id) {
    return <Navigate to="/dashboard" replace />;
  }
  if (visit.status !== "completed") {
    return <Navigate to={`/visit/${visit.id}/check-in`} replace />;
  }

  function refresh() {
    forceRender((n) => n + 1);
  }

  const safetyFlags = briefingStore.getSafetyFlagsForProfile(profile.id);
  const briefing = briefingStore.getBriefingForVisit(visit.id);
  const source = assembleBriefingSource(profile, visit, safetyFlags);
  const patientLangLabel = LANGUAGE_NAMES[visit.languageUsed];

  const priorVisit =
    store
      .getVisitsForProfile(profile.id)
      .find((v) => v.status === "completed" && v.id !== visit.id && v.createdAt < visit.createdAt) ?? null;
  const priorSuggested = priorVisit?.outputs.patientRecap?.suggestedQuestionsForCareTeam ?? [];
  const priorTeachBackOpen = priorVisit
    ? briefingStore
        .getTeachBackForVisit(priorVisit.id)
        .filter((t) => t.outcome === "partially_understood" || t.outcome === "misunderstood")
        .map((t) => t.promptPatientLanguage)
    : [];
  const openQuestionsCarried = [...priorSuggested, ...priorTeachBackOpen];

  const consentLink = briefingStore.getConsentLinkForVisit(visit.id);
  const linkedCase = consentLink ? consentStore.getCase(consentLink.consentCaseId) : null;
  const linkedCaseIds = new Set(briefingStore.getAllConsentLinks().map((l) => l.consentCaseId));
  const unlinkedCases = consentStore.getAllCases().filter((c) => !linkedCaseIds.has(c.id));

  async function handleGenerate() {
    setError(null);
    setGenerating(true);
    try {
      const apiKey = settingsStore.getApiKey();
      const result = await generateVisitBriefing(profile!, visit!, safetyFlags, openQuestionsCarried, apiKey);
      briefingStore.saveBriefing(result);
      refresh();
    } catch (err) {
      setError(err instanceof TranslationClientError ? err.message : "Something went wrong generating the briefing.");
    } finally {
      setGenerating(false);
    }
  }

  function addFlag() {
    if (!flagLabel.trim() || !flagDetail.trim()) return;
    const flag: SafetyFlag = {
      id: newId(),
      patientProfileId: profile!.id,
      label: flagLabel.trim(),
      detail: flagDetail.trim(),
      detailLanguage: visit!.languageUsed as LanguageCode,
      createdAt: nowIso(),
    };
    briefingStore.saveSafetyFlag(flag);
    setFlagLabel("");
    setFlagDetail("");
    setShowAddFlag(false);
    refresh();
  }

  function removeFlag(id: string) {
    briefingStore.deleteSafetyFlag(id);
    refresh();
  }

  function createCase() {
    if (!caseTitle.trim() || !caseProcedure.trim()) return;
    const newCase = {
      id: newId(),
      title: caseTitle.trim(),
      procedureName: caseProcedure.trim(),
      targetLanguage: "zh" as const,
      createdAt: nowIso(),
      timelineEntries: [],
      documents: [],
    };
    consentStore.saveCase(newCase);
    const link: VisitConsentLink = { visitId: visit!.id, consentCaseId: newCase.id, linkedAt: nowIso() };
    briefingStore.saveConsentLink(link);
    setCaseTitle("");
    setCaseProcedure("");
    setShowCreateCase(false);
    navigate(`/visit/${visit!.id}/consent/${newCase.id}`);
  }

  function attachExisting() {
    if (!attachCaseId) return;
    const link: VisitConsentLink = { visitId: visit!.id, consentCaseId: attachCaseId, linkedAt: nowIso() };
    briefingStore.saveConsentLink(link);
    setAttachCaseId("");
    refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <style>{"@media print { header, .no-print { display: none !important; } body { background: white; } }"}</style>
      <header className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">{new Date(visit.createdAt).toLocaleDateString()}</div>
              <div className="font-semibold text-slate-900">{visit.intendedProvider.clinicName}</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="text-sm text-slate-500 hover:text-slate-800"
              >
                Print
              </button>
              <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
                Dashboard
              </Link>
            </div>
          </div>
          <VisitStepper visitId={visit.id} current="briefing" checkInDone={visit.status === "completed"} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-slate-900">Visit Briefing</h1>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="no-print text-xs px-3 py-1.5 rounded-full bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : briefing ? "Regenerate" : "Generate briefing"}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">{error}</div>}

        <Section title="Reason for this visit">
          <BilingualList
            patientLines={source.reasonForVisit ? [source.reasonForVisit] : []}
            englishLines={briefing ? [briefing.reasonForVisitEnglish] : null}
            patientLangLabel={patientLangLabel}
            generated={!!briefing}
          />
        </Section>

        <Section title="Active conditions">
          <BilingualList
            patientLines={source.activeConditions}
            englishLines={briefing?.activeConditionsEnglish ?? null}
            patientLangLabel={patientLangLabel}
            generated={!!briefing}
          />
        </Section>

        <Section title="Current medications and recent changes">
          <BilingualList
            patientLines={source.medications}
            englishLines={briefing?.medicationsAndChangesEnglish ?? null}
            patientLangLabel={patientLangLabel}
            generated={!!briefing}
          />
        </Section>

        <Section title="Known restrictions / flags">
          <div className="space-y-3">
            {safetyFlags.length === 0 && !showAddFlag && (
              <p className="text-sm text-slate-400 italic">None recorded.</p>
            )}
            {safetyFlags.length > 0 && (
              <ul className="space-y-2">
                {safetyFlags.map((f) => (
                  <li key={f.id} className="flex items-start justify-between gap-3 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <div>
                      <span className="font-medium text-amber-900">{f.label}:</span>{" "}
                      <span className="text-amber-900">{f.detail}</span>
                    </div>
                    <button onClick={() => removeFlag(f.id)} className="no-print text-xs text-red-500 hover:text-red-700 shrink-0">
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {briefing && briefing.safetyFlagsEnglish.length > 0 && (
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">English</div>
                <ul className="space-y-1 text-sm text-slate-700">
                  {briefing.safetyFlagsEnglish.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            {!showAddFlag ? (
              <button onClick={() => setShowAddFlag(true)} className="no-print text-xs text-teal-700 hover:underline">
                + Add flag
              </button>
            ) : (
              <div className="no-print space-y-2">
                <input
                  value={flagLabel}
                  onChange={(e) => setFlagLabel(e.target.value)}
                  placeholder="e.g. Drug allergy, Difficult venous access"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  value={flagDetail}
                  onChange={(e) => setFlagDetail(e.target.value)}
                  placeholder="Details, in your own words"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button onClick={addFlag} className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-medium hover:bg-teal-700">
                  Add
                </button>
              </div>
            )}
          </div>
        </Section>

        <Section title="What's already been explained, in the patient's own words">
          <BilingualList
            patientLines={source.alreadyExplained}
            englishLines={briefing?.alreadyExplainedEnglish ?? null}
            patientLangLabel={patientLangLabel}
            generated={!!briefing}
          />
        </Section>

        <Section title="Open questions carried over">
          <BilingualList
            patientLines={openQuestionsCarried}
            englishLines={briefing?.openQuestionsEnglish ?? null}
            patientLangLabel={patientLangLabel}
            generated={!!briefing}
          />
        </Section>

        <Section title="Consent form for this visit">
          {linkedCase ? (
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-800">{linkedCase.title}</div>
              <div className="text-xs text-slate-500">{linkedCase.procedureName}</div>
              {linkedCase.documents.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No documents added to this case yet.</p>
              ) : (
                <ul className="space-y-2">
                  {linkedCase.documents.map((doc) => (
                    <li key={doc.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800">{doc.label}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            doc.translation ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {doc.translation ? "Translated" : "Not yet translated"}
                        </span>
                      </div>
                      {doc.translation && (
                        <details className="mt-1 text-xs text-slate-500">
                          <summary className="cursor-pointer">Preview context-adapted translation</summary>
                          <div className="mt-1 whitespace-pre-wrap">{doc.translation.contextAdapted.translatedText}</div>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to={`/visit/${visit.id}/consent/${linkedCase.id}`}
                className="no-print text-sm text-indigo-600 hover:underline"
              >
                Manage full case →
              </Link>
            </div>
          ) : (
            <div className="no-print space-y-3">
              <p className="text-sm text-slate-500">This visit doesn't include a consent form yet.</p>
              {!showCreateCase ? (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowCreateCase(true)}
                    className="text-xs px-3 py-1.5 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-700"
                  >
                    Create one
                  </button>
                  {unlinkedCases.length > 0 && (
                    <div className="flex items-center gap-2">
                      <select
                        value={attachCaseId}
                        onChange={(e) => setAttachCaseId(e.target.value)}
                        className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                      >
                        <option value="">Attach existing case…</option>
                        {unlinkedCases.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={attachExisting}
                        disabled={!attachCaseId}
                        className="text-xs px-3 py-1.5 rounded-full border border-indigo-300 text-indigo-700 hover:bg-indigo-50 disabled:opacity-40"
                      >
                        Attach
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={caseTitle}
                    onChange={(e) => setCaseTitle(e.target.value)}
                    placeholder="Case title, e.g. ACL Reconstruction — Pre-Op Consent"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <input
                    value={caseProcedure}
                    onChange={(e) => setCaseProcedure(e.target.value)}
                    placeholder="Procedure"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                  <button
                    onClick={createCase}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                  >
                    Create and open
                  </button>
                </div>
              )}
            </div>
          )}
        </Section>

        <details className="no-print bg-white rounded-2xl border border-slate-200 p-6">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Full structured record (English)</summary>
          <div className="mt-4">
            <ClinicianSummaryView visit={visit} />
          </div>
        </details>

        <details className="no-print bg-white rounded-2xl border border-slate-200 p-6">
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Full check-in transcript</summary>
          <div className="mt-4 space-y-3">
            {visit.conversation.map((turn) => (
              <div key={turn.id} className="text-sm">
                <div className="text-slate-400 text-xs">{turn.questionTextShown}</div>
                <div className="text-slate-800">{turn.answerVerbatim}</div>
              </div>
            ))}
          </div>
        </details>
      </main>
    </div>
  );
}

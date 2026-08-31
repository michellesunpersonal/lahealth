import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../data/SessionContext";
import { store } from "../data/storage";
import { consentStore } from "../data/consentStorage";
import { briefingStore } from "../data/briefingStorage";
import { strings, t } from "../i18n/strings";
import type { LanguageCode } from "../types/domain";
import { createBlankVisit } from "../data/blank";
import { approveGrant, denyGrant, requestAccess, revokeGrant } from "../data/accessGrants";
import ApiKeySettings from "../components/ApiKeySettings";
import { nowIso } from "../lib/id";

const STATUS_LABEL_KEY = {
  pending: "statusPending",
  active: "statusActive",
  revoked: "statusRevoked",
  denied: "statusDenied",
} as const;

const STATUS_BADGE_CLASS = {
  pending: "bg-amber-100 text-amber-700",
  active: "bg-emerald-100 text-emerald-700",
  revoked: "bg-slate-100 text-slate-500",
  denied: "bg-slate-100 text-slate-500",
} as const;

export default function DashboardPage() {
  const { profile, logOut, refreshProfile } = useSession();
  const navigate = useNavigate();

  const lang: LanguageCode = profile?.preferredLanguage ?? "en";
  const visits = profile ? store.getVisitsForProfile(profile.id) : [];

  const [showStart, setShowStart] = useState(false);
  const [clinicName, setClinicName] = useState(profile?.accessGrants[0]?.clinicName ?? "");
  const [visitLang, setVisitLang] = useState<LanguageCode>(lang);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqClinicName, setReqClinicName] = useState("");
  const [reqProviderName, setReqProviderName] = useState("");

  const [, forceRender] = useState(0);
  const [linkPickerVisitId, setLinkPickerVisitId] = useState<Record<string, string>>({});

  if (!profile) return null;
  const currentProfile = profile;

  const linkedCaseIds = new Set(briefingStore.getAllConsentLinks().map((l) => l.consentCaseId));
  const unlinkedCases = consentStore.getAllCases().filter((c) => !linkedCaseIds.has(c.id));

  function startVisit() {
    const visit = createBlankVisit(currentProfile.id, clinicName, visitLang);
    store.saveVisit(visit);
    navigate(`/visit/${visit.id}/check-in`);
  }

  function linkCaseToVisit(consentCaseId: string) {
    const visitId = linkPickerVisitId[consentCaseId];
    if (!visitId) return;
    briefingStore.saveConsentLink({ visitId, consentCaseId, linkedAt: nowIso() });
    forceRender((n) => n + 1);
  }

  function handleApprove(grantId: string) {
    store.saveProfile(approveGrant(currentProfile, grantId));
    refreshProfile();
  }

  function handleDeny(grantId: string) {
    store.saveProfile(denyGrant(currentProfile, grantId));
    refreshProfile();
  }

  function handleRevoke(grantId: string) {
    store.saveProfile(revokeGrant(currentProfile, grantId));
    refreshProfile();
  }

  function handleSubmitRequest() {
    if (!reqClinicName.trim()) return;
    store.saveProfile(requestAccess(currentProfile, reqClinicName, reqProviderName));
    refreshProfile();
    setReqClinicName("");
    setReqProviderName("");
    setShowRequestForm(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="font-semibold text-slate-900">{profile.displayName}</div>
            <div className="text-xs text-slate-500">{t(strings.appName, lang)}</div>
          </div>
          <button onClick={logOut} className="text-sm text-slate-500 hover:text-slate-800">
            {t(strings.dashboard.logOut, lang)}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-3 text-sm text-teal-900">
          {t(strings.dashboard.persistentNote, lang)}
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-medium text-slate-500 mb-3">{t(strings.dashboard.dialysisSnapshot, lang)}</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-400">Modality</dt>
              <dd className="text-slate-800">{profile.dialysis.modality.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Access</dt>
              <dd className="text-slate-800">{profile.dialysis.accessType.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Schedule</dt>
              <dd className="text-slate-800">{profile.dialysis.scheduleDays.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Dry weight</dt>
              <dd className="text-slate-800">{profile.dialysis.dryWeightLbs ? `${profile.dialysis.dryWeightLbs} lbs` : "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-medium text-slate-500 mb-3">{t(strings.dashboard.accessGrantsTitle, lang)}</h2>
          {profile.accessGrants.length === 0 ? (
            <p className="text-sm text-slate-400">{t(strings.dashboard.noAccessGrants, lang)}</p>
          ) : (
            <ul className="space-y-3">
              {profile.accessGrants.map((g) => (
                <li key={g.id} className="flex items-center justify-between text-sm gap-3">
                  <div className="min-w-0">
                    <div className="text-slate-800 truncate">{g.clinicName}</div>
                    <div className="text-xs text-slate-400 truncate">{g.providerName}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {g.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(g.id)}
                          className="text-xs px-2.5 py-1 rounded-full bg-teal-600 text-white font-medium hover:bg-teal-700"
                        >
                          {t(strings.dashboard.approve, lang)}
                        </button>
                        <button
                          onClick={() => handleDeny(g.id)}
                          className="text-xs px-2.5 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                        >
                          {t(strings.dashboard.deny, lang)}
                        </button>
                      </>
                    )}
                    {g.status === "active" && (
                      <button
                        onClick={() => handleRevoke(g.id)}
                        className="text-xs px-2.5 py-1 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        {t(strings.dashboard.revoke, lang)}
                      </button>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE_CLASS[g.status]}`}>
                      {t(strings.dashboard[STATUS_LABEL_KEY[g.status]], lang)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100">
            {!showRequestForm ? (
              <button
                onClick={() => setShowRequestForm(true)}
                className="text-xs text-slate-400 hover:text-slate-600 underline decoration-dotted"
              >
                {t(strings.dashboard.requestAccessDemo, lang)}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate-400">{t(strings.dashboard.requestAccessNote, lang)}</p>
                <input
                  value={reqClinicName}
                  onChange={(e) => setReqClinicName(e.target.value)}
                  placeholder={t(strings.dashboard.clinicNameLabel, lang)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <input
                  value={reqProviderName}
                  onChange={(e) => setReqProviderName(e.target.value)}
                  placeholder={t(strings.dashboard.providerNameLabel, lang)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
                <button
                  onClick={handleSubmitRequest}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 text-white text-sm font-medium hover:bg-slate-900"
                >
                  {t(strings.dashboard.submitRequest, lang)}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6">
          {!showStart ? (
            <button
              onClick={() => setShowStart(true)}
              className="w-full px-4 py-3 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700"
            >
              {t(strings.dashboard.startVisit, lang)}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Clinic / provider</label>
                <input
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="e.g. Westside Nephrology"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Language for this visit</label>
                <select
                  value={visitLang}
                  onChange={(e) => setVisitLang(e.target.value as LanguageCode)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                </select>
              </div>
              <button
                onClick={startVisit}
                className="w-full px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
              >
                {t(strings.dashboard.startVisit, lang)}
              </button>
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-slate-500 mb-3">{t(strings.dashboard.pastVisits, lang)}</h2>
          {visits.length === 0 ? (
            <p className="text-sm text-slate-400">{t(strings.dashboard.noPastVisits, lang)}</p>
          ) : (
            <ul className="space-y-2">
              {visits.map((v) => {
                const hasBriefing = v.status === "completed" && !!briefingStore.getBriefingForVisit(v.id);
                const phaseLabel = v.status === "in_progress" ? "Check-in in progress" : hasBriefing ? "Reviewed" : "Briefing ready";
                const phaseClass =
                  v.status === "in_progress"
                    ? "bg-amber-100 text-amber-700"
                    : hasBriefing
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-teal-100 text-teal-700";
                const href = v.status === "completed" ? `/visit/${v.id}/briefing` : `/visit/${v.id}/check-in`;
                return (
                  <li key={v.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{v.intendedProvider.clinicName}</div>
                      <div className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${phaseClass}`}>{phaseLabel}</span>
                      <button onClick={() => navigate(href)} className="text-sm text-teal-700 font-medium hover:underline">
                        {v.status === "completed" ? "View briefing" : t(strings.dashboard.continueVisit, lang)}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {unlinkedCases.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-sm font-medium text-slate-500 mb-1">Unlinked consent cases</h2>
            <p className="text-xs text-slate-500 mb-3">
              These consent cases aren't attached to a visit yet — link one to see it on that visit's briefing.
            </p>
            <ul className="space-y-2">
              {unlinkedCases.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="text-slate-800 truncate">{c.title}</div>
                    <div className="text-xs text-slate-400 truncate">{c.procedureName}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={linkPickerVisitId[c.id] ?? ""}
                      onChange={(e) => setLinkPickerVisitId((m) => ({ ...m, [c.id]: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg border border-slate-300 text-xs"
                    >
                      <option value="">Link to visit…</option>
                      {visits.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.intendedProvider.clinicName} — {new Date(v.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => linkCaseToVisit(c.id)}
                      disabled={!linkPickerVisitId[c.id]}
                      className="text-xs px-2.5 py-1 rounded-full border border-teal-300 text-teal-700 hover:bg-teal-50 disabled:opacity-40"
                    >
                      Link
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ApiKeySettings />
      </main>
    </div>
  );
}

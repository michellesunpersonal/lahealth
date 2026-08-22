import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../data/SessionContext";
import { store } from "../data/storage";
import { strings, t } from "../i18n/strings";
import type { LanguageCode } from "../types/domain";
import { createBlankVisit } from "../data/blank";

export default function DashboardPage() {
  const { profile, logOut } = useSession();
  const navigate = useNavigate();

  const lang: LanguageCode = profile?.preferredLanguage ?? "en";
  const visits = profile ? store.getVisitsForProfile(profile.id) : [];

  const [showStart, setShowStart] = useState(false);
  const [clinicName, setClinicName] = useState(profile?.accessGrants[0]?.clinicName ?? "");
  const [visitLang, setVisitLang] = useState<LanguageCode>(lang);

  if (!profile) return null;
  const currentProfile = profile;

  function startVisit() {
    const visit = createBlankVisit(currentProfile.id, clinicName, visitLang);
    store.saveVisit(visit);
    navigate(`/intake/${visit.id}`);
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
            <p className="text-sm text-slate-400">—</p>
          ) : (
            <ul className="space-y-2">
              {profile.accessGrants.map((g) => (
                <li key={g.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="text-slate-800">{g.clinicName}</div>
                    <div className="text-xs text-slate-400">{g.providerName}</div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      g.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : g.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {g.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
              {visits.map((v) => (
                <li
                  key={v.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{v.intendedProvider.clinicName}</div>
                    <div className="text-xs text-slate-400">{new Date(v.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        v.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {v.status === "completed" ? t(strings.dashboard.completed, lang) : t(strings.dashboard.inProgress, lang)}
                    </span>
                    <button
                      onClick={() => navigate(v.status === "completed" ? `/visit/${v.id}` : `/intake/${v.id}`)}
                      className="text-sm text-teal-700 font-medium hover:underline"
                    >
                      {v.status === "completed"
                        ? t(strings.dashboard.viewSummary, lang)
                        : t(strings.dashboard.continueVisit, lang)}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

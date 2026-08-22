import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { store } from "../data/storage";
import { useSession } from "../data/SessionContext";
import { LANGUAGE_NAMES, strings, t } from "../i18n/strings";
import type { LanguageCode, PatientProfile } from "../types/domain";
import { newId, nowIso } from "../lib/id";

export default function LoginPage() {
  const { logIn } = useSession();
  const navigate = useNavigate();
  const demoProfiles = store.getAllProfiles();

  const [uiLang, setUiLang] = useState<LanguageCode>("en");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [lang, setLang] = useState<LanguageCode>("es");

  function handleLogin(id: string) {
    logIn(id);
    navigate("/dashboard");
  }

  function handleCreate() {
    if (!name.trim()) return;
    const profile: PatientProfile = {
      id: newId(),
      preferredLanguage: lang,
      displayName: name.trim(),
      dateOfBirth: dob || "2000-01-01",
      createdAt: nowIso(),
      dialysis: {
        modality: "hemodialysis",
        scheduleDays: [],
        accessType: "unknown",
        dryWeightLbs: null,
      },
      currentMedications: [],
      relevantHistory: [],
      accessGrants: [],
    };
    store.saveProfile(profile);
    handleLogin(profile.id);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex justify-end gap-2 mb-4 text-sm">
          <button
            className={`px-2 py-1 rounded ${uiLang === "en" ? "bg-slate-900 text-white" : "text-slate-500"}`}
            onClick={() => setUiLang("en")}
          >
            EN
          </button>
          <button
            className={`px-2 py-1 rounded ${uiLang === "es" ? "bg-slate-900 text-white" : "text-slate-500"}`}
            onClick={() => setUiLang("es")}
          >
            ES
          </button>
          <button
            className={`px-2 py-1 rounded ${uiLang === "zh" ? "bg-slate-900 text-white" : "text-slate-500"}`}
            onClick={() => setUiLang("zh")}
          >
            中文
          </button>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900">{t(strings.login.title, uiLang)}</h1>
        <p className="mt-2 text-sm text-slate-600">{t(strings.login.subtitle, uiLang)}</p>

        <div className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-2">
            {t(strings.login.chooseDemoProfile, uiLang)}
          </p>
          <div className="space-y-2">
            {demoProfiles.map((p) => (
              <button
                key={p.id}
                onClick={() => handleLogin(p.id)}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-teal-500 hover:bg-teal-50 transition-colors"
              >
                <div className="font-medium text-slate-900">{p.displayName}</div>
                <div className="text-xs text-slate-500">
                  {LANGUAGE_NAMES[p.preferredLanguage]} · {p.dialysis.modality.replace(/_/g, " ")}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px bg-slate-200 flex-1" />
          {t(strings.login.or, uiLang)}
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full px-4 py-2.5 rounded-lg border border-dashed border-slate-300 text-slate-600 hover:border-slate-400 text-sm"
          >
            {t(strings.login.createNew, uiLang)}
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t(strings.login.fullName, uiLang)}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{t(strings.login.dob, uiLang)}</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {t(strings.login.preferredLanguage, uiLang)}
              </label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as LanguageCode)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
              </select>
            </div>
            <button
              onClick={handleCreate}
              className="w-full px-4 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700"
            >
              {t(strings.login.createButton, uiLang)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

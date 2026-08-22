import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useSession } from "../data/SessionContext";
import { store } from "../data/storage";
import { strings, t } from "../i18n/strings";
import ClinicianSummaryView from "../components/ClinicianSummaryView";
import PatientRecapView from "../components/PatientRecapView";

export default function SummaryPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const { profile } = useSession();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"clinician" | "patient">("patient");

  if (!profile) return null;
  const visit = visitId ? store.getVisit(visitId) : null;
  if (!visit || visit.patientProfileId !== profile.id) {
    return <Navigate to="/dashboard" replace />;
  }

  const lang = profile.preferredLanguage;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">{new Date(visit.createdAt).toLocaleDateString()}</div>
            <div className="font-semibold text-slate-900">{visit.intendedProvider.clinicName}</div>
          </div>
          <button onClick={() => navigate("/dashboard")} className="text-sm text-slate-500 hover:text-slate-800">
            {t(strings.summary.backToDashboard, lang)}
          </button>
        </div>
        <div className="max-w-3xl mx-auto px-4 flex gap-1 -mb-px">
          <button
            onClick={() => setTab("patient")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 ${
              tab === "patient" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500"
            }`}
          >
            {t(strings.summary.patientTab, lang)}
          </button>
          <button
            onClick={() => setTab("clinician")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 ${
              tab === "clinician" ? "border-teal-600 text-teal-700" : "border-transparent text-slate-500"
            }`}
          >
            {t(strings.summary.clinicianTab, lang)}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {tab === "patient" ? <PatientRecapView visit={visit} /> : <ClinicianSummaryView visit={visit} />}
      </main>
    </div>
  );
}

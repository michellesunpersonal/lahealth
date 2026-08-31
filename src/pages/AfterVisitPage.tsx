import { useState } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
import { useSession } from "../data/SessionContext";
import { store } from "../data/storage";
import { briefingStore } from "../data/briefingStorage";
import type { VisitTeachBackItem } from "../types/briefing";
import VisitStepper from "../components/VisitStepper";
import PatientRecapView from "../components/PatientRecapView";
import TeachBackOutcomeButtons from "../components/TeachBackOutcomeButtons";

export default function AfterVisitPage() {
  const { visitId } = useParams<{ visitId: string }>();
  const { profile } = useSession();
  const [, forceRender] = useState(0);

  if (!profile) return null;
  const visit = visitId ? store.getVisit(visitId) : null;
  if (!visit || visit.patientProfileId !== profile.id) {
    return <Navigate to="/dashboard" replace />;
  }
  if (visit.status !== "completed") {
    return <Navigate to={`/visit/${visit.id}/check-in`} replace />;
  }

  const recap = visit.outputs.patientRecap;
  const storedTeachBack = briefingStore.getTeachBackForVisit(visit.id);
  const teachBackItems: VisitTeachBackItem[] = (recap?.suggestedQuestionsForCareTeam ?? []).map((q, i) => {
    const id = `${visit.id}::${i}`;
    return storedTeachBack.find((t) => t.id === id) ?? { id, visitId: visit.id, promptPatientLanguage: q, outcome: "not_yet_tried", outcomeNotes: "" };
  });

  function updateItem(updated: VisitTeachBackItem) {
    briefingStore.saveTeachBackItem(updated);
    forceRender((n) => n + 1);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">{new Date(visit.createdAt).toLocaleDateString()}</div>
              <div className="font-semibold text-slate-900">{visit.intendedProvider.clinicName}</div>
            </div>
            <Link to="/dashboard" className="text-sm text-slate-500 hover:text-slate-800">
              Dashboard
            </Link>
          </div>
          <VisitStepper visitId={visit.id} current="after" checkInDone={visit.status === "completed"} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <PatientRecapView visit={visit} />

        {teachBackItems.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Comprehension check</h2>
            <p className="text-xs text-slate-500 mb-3">
              After going over these with the patient, record what actually happened — a misunderstood item here
              carries forward as an open question on the next visit's briefing.
            </p>
            <ul className="space-y-3">
              {teachBackItems.map((item) => (
                <li key={item.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-sm text-slate-800">{item.promptPatientLanguage}</div>
                  <TeachBackOutcomeButtons value={item.outcome} onChange={(outcome) => updateItem({ ...item, outcome })} />
                  <input
                    value={item.outcomeNotes}
                    onChange={(e) => updateItem({ ...item, outcomeNotes: e.target.value })}
                    placeholder="What the patient actually said (optional)"
                    className="mt-2 w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

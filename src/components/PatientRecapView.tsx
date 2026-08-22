import type { VisitEntry } from "../types/domain";
import { strings, t } from "../i18n/strings";

export default function PatientRecapView({ visit }: { visit: VisitEntry }) {
  const recap = visit.outputs.patientRecap;
  const lang = visit.languageUsed;

  if (!recap) {
    return <p className="text-sm text-slate-400 italic">{t(strings.summary.noDataCaptured, lang)}</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">{t(strings.summary.recapIntro, lang)}</p>

      <div className="bg-white rounded-xl border border-slate-200 p-5 whitespace-pre-line text-sm text-slate-800 leading-relaxed">
        {recap.summaryText}
      </div>

      {recap.suggestedQuestionsForCareTeam.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-2">{t(strings.summary.suggestedQuestions, lang)}</h3>
          <ul className="space-y-2">
            {recap.suggestedQuestionsForCareTeam.map((q, i) => (
              <li key={i} className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 text-sm text-teal-900">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

import type { FieldWithQuote, VisitEntry } from "../types/domain";
import { strings } from "../i18n/strings";

/**
 * Output #1: clinician-facing structured account. Category labels and
 * field names are in English (the "structure"); the patient's own words
 * are always shown alongside, tagged with the language they were said in
 * rather than translated — see generateOutputs.ts for why.
 */
function Quote({ field }: { field: FieldWithQuote | null }) {
  if (!field || !field.patientQuote) {
    return <span className="text-slate-300 italic text-sm">{strings.summary.noDataCaptured.en}</span>;
  }
  return (
    <div>
      <div className="text-slate-800 text-sm">{field.structured}</div>
      <div className="mt-1 text-xs text-slate-400">
        {strings.summary.patientsOwnWords.en}
        {field.quoteLanguage !== "en" && (
          <span className="ml-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
            {field.quoteLanguage.toUpperCase()}
          </span>
        )}
        : <span className="italic">"{field.patientQuote}"</span>
      </div>
    </div>
  );
}

function Row({ label, field }: { label: string; field: FieldWithQuote | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 py-2 border-b border-slate-100 last:border-0">
      <div className="text-xs font-medium text-slate-500 pt-0.5">{label}</div>
      <Quote field={field} />
    </div>
  );
}

export default function ClinicianSummaryView({ visit }: { visit: VisitEntry }) {
  return (
    <div className="space-y-6">
      <div className="text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-lg px-3 py-2">
        {strings.summary.disclaimer.en}
      </div>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{strings.summary.reasonForVisit.en}</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Quote field={visit.reasonForVisit} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{strings.summary.symptoms.en}</h3>
        <div className="space-y-3">
          {visit.symptoms.length === 0 && (
            <p className="text-sm text-slate-400 italic">{strings.summary.noDataCaptured.en}</p>
          )}
          {visit.symptoms.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-teal-700 mb-2">
                {s.category.replace(/_/g, " ")}
              </div>
              <Row label="Description" field={s.description} />
              <Row label={strings.summary.onset.en} field={s.onset} />
              <Row label={strings.summary.location.en} field={s.location} />
              <Row label={strings.summary.severity.en} field={s.severityInPatientsWords} />
              <Row label={strings.summary.duration.en} field={s.duration} />
              <Row label={strings.summary.better.en} field={s.whatMakesItBetter} />
              <Row label={strings.summary.worse.en} field={s.whatMakesItWorse} />
              <Row label={strings.summary.tried.en} field={s.whatHasBeenTried} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{strings.summary.dialysisContext.en}</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Row label="Weight change" field={visit.dialysisContext.recentWeightChange} />
          <Row label="Fluid/diet adherence" field={visit.dialysisContext.fluidDietAdherence} />
          <Row label="Feeling on dialysis days" field={visit.dialysisContext.feelingOnDialysisDays} />
          <Row label="Feeling off dialysis days" field={visit.dialysisContext.feelingOffDialysisDays} />
          <Row label="Missed/shortened sessions" field={visit.dialysisContext.missedOrShortenedSessions} />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{strings.summary.medications.en}</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          {visit.medicationNotes.length === 0 ? (
            <p className="text-sm text-slate-400 italic">{strings.summary.noDataCaptured.en}</p>
          ) : (
            visit.medicationNotes.map((m, i) => <Quote key={i} field={m} />)
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{strings.summary.history.en}</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
          {visit.relevantHistoryNotes.length === 0 ? (
            <p className="text-sm text-slate-400 italic">{strings.summary.noDataCaptured.en}</p>
          ) : (
            visit.relevantHistoryNotes.map((h, i) => <Quote key={i} field={h} />)
          )}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-slate-700 mb-2">{strings.summary.biggestConcern.en}</h3>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <Quote field={visit.biggestConcern} />
        </div>
      </section>
    </div>
  );
}

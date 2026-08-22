# LA Health — Pre-Visit Symptom Capture (Prototype)

A pre-visit symptom-and-history capture tool for limited-English-proficiency
(LEP) dialysis/ESRD patients. Patients describe what's happening through a
guided, scripted conversation in Spanish or English, and the app produces:

1. A structured account for the care team (English labels/categories, with
   the patient's own words preserved alongside — never paraphrased away).
2. A plain-language recap back to the patient in their own language, with
   generic points/questions they might want to raise with their care team.

**Prototype only — no real patient data.** All demo patients and visits are
fictional. Everything is stored in the browser's `localStorage`; there is no
backend and no PHI.

## Design principle: patient-owned, not clinic-owned

A `PatientProfile` is one persistent identity that accumulates `VisitEntry`
records over time, across any clinic. A clinic never owns the record — it
holds a `ProviderAccessGrant` the patient can grant or revoke. See
`src/types/domain.ts` for the full schema and rationale.

## Hard guardrail

This tool captures and structures what the patient says. It does not
diagnose, triage-rank, or infer what a symptom might mean — there is no
computed severity score or urgency rank anywhere in the data model or UI.

## Running it

```bash
npm install
npm run dev
```

Log in as one of the seeded demo patients (or create a new profile) to try
the flow. Demo patients: Maria Elena Torres (Spanish, hemodialysis, has a
completed visit), James Whitfield (English, peritoneal dialysis, has a
completed visit), Carlos Reyes (Spanish, no visits yet — good for demoing
the intake flow from scratch).

## Known v1 limitations

- **No adaptive/LLM-powered questioning.** The conversation is a fixed,
  auditable decision tree (`src/conversation/flow.ts`), not an LLM — every
  question a patient can ever be asked is enumerated up front.
- **No translation engine.** The clinician view's category/field labels are
  in English, but patient free-text answers are shown verbatim in whatever
  language the patient used (tagged, e.g. `ES`), never auto-translated —
  faking a translation risked misrepresenting the patient's meaning. A real
  translation step (human or MT/LLM-reviewed) is needed before this goes
  past a demo.
- **Resuming an in-progress visit restarts the question flow** from the
  beginning rather than picking back up where the patient left off (prior
  answers aren't lost from storage, but the UI will re-ask).
- **Access grants are display-only.** The `ProviderAccessGrant` shape
  supports patient-driven approve/revoke, but there's no UI to act on a
  pending request yet.

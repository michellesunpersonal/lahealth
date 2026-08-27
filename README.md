# LA Health (Prototypes)

This repo holds two independent language-access prototypes sharing a stack
(React + Tailwind + Vite) and a `localStorage`-only data layer. They don't
share data or routes beyond a couple of cross-links: the symptom capture
tool below at `/login`, and the [Medical Consent Translator](#medical-consent-translator-prototype-consent)
at `/consent`.

## Pre-Visit Symptom Capture

A pre-visit symptom-and-history capture tool for limited-English-proficiency
(LEP) dialysis/ESRD patients. Patients describe what's happening through a
guided, scripted conversation in Spanish, English, or Chinese, and the app
produces:

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
completed visit), Wei Lin Zhang (Chinese, hemodialysis, has a completed
visit), Carlos Reyes (Spanish, no visits yet — good for demoing the intake
flow from scratch).

## Known v1 limitations

- **Chinese is Simplified only.** A real deployment for LA's dialysis
  population would likely also need Traditional Chinese as a separate
  variant — many Cantonese-speaking patients read Traditional, not just a
  different font of the same text.
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

## Medical Consent Translator (prototype, `/consent`)

A second, separate prototype in this repo: a context-aware translator for
informed consent / pre-op briefing documents, targeting Mandarin. It exists
to test one hypothesis — that a translation informed by a patient's
accumulated care-journey context produces better comprehension than a
one-shot literal translation alone, not just faster or cheaper translation.

For each document it generates, side by side:

1. A **literal translation** (the control/baseline) — generated from the
   source text only.
2. A **context-adapted translation** — health-literacy adjusted and
   culturally framed, informed by that patient's logged timeline (prior
   appointment notes, concerns, literacy signals). Adaptation changes *how*
   something is said, never *what* is disclosed — every risk/fact in the
   source must still appear.
3. **Teach-back questions** in the target language, to verify actual
   comprehension rather than that the text was read — each one can be
   marked understood/misunderstood after being tried with a real patient or
   reviewer.

It also includes a **blind reviewer mode**: the two translations are shown
as unlabeled "Version A" / "Version B" (order randomized per document) so a
Mandarin-speaking reviewer can pick which one they'd understand better as a
patient before being told which is which — this is the tool's actual
success metric, not a nice-to-have.

**Data handling.** This is a personal validation tool, not a covered
product: Claude via the standard Anthropic API is **not** covered by a
signed HIPAA Business Associate Agreement. Only use de-identified or
reconstructed content — never real, identifiable consent forms or chart
data — until a BAA is in place. There is no backend; a document's source
text and generated translations go straight from your browser to the
Anthropic API using an API key you supply (stored only in this browser's
localStorage) and are otherwise stored only in localStorage alongside
everything else in this app.

**Positioning.** This tool is built to augment scarce interpreter/CHW
capacity, not replace a qualified medical interpreter — keep that framing
in any user-facing copy.

**Out of scope for this prototype:** live real-time voice interpretation,
live Epic/MyChart FHIR integration, and an interpreter/CHW review workflow.
The timeline is a manually-entered log, not a live EHR feed.

# LA Health (Prototype)

A prototype tool for one job: give an interpreter or provider real patient
context *before* an encounter starts, so the quality of care doesn't depend
on any one interpreter's skill, patience, or medical background. React +
Tailwind + Vite, `localStorage`-only — no backend, no auth beyond a local
patient-profile picker, no real PHI.

**Prototype only — no real patient data.** All demo patients and visits are
fictional.

## The flow

Every visit goes through three steps:

1. **Check-in** (`/visit/:visitId/check-in`) — a guided, scripted
   conversation (`src/conversation/flow.ts`) where the patient describes
   what's going on, in Spanish, English, or Chinese. Fixed decision tree,
   not an LLM — every question a patient can ever be asked is enumerated up
   front and auditable.
2. **Visit Briefing** (`/visit/:visitId/briefing`) — the headline output. A
   single, printable, scannable page for whoever is about to see the
   patient: reason for the visit, active conditions, current medications and
   recent changes, known restrictions/flags (allergies, access notes like
   "hard stick"), what the patient has already explained in their own
   words, and open questions carried over from the last visit — each shown
   in the patient's language beside a generated English translation. If a
   consent form is attached to the visit, it shows here too (see below).
3. **After-visit recap** (`/visit/:visitId/after`) — the existing
   plain-language recap back to the patient, plus a teach-back
   comprehension check (understood / partially understood / misunderstood)
   for the questions raised during the visit. A misunderstood item carries
   forward as an open question on the *next* visit's briefing.

## Design principle: patient-owned, not clinic-owned

A `PatientProfile` is one persistent identity that accumulates `VisitEntry`
records over time, across any clinic. A clinic never owns the record — it
holds a `ProviderAccessGrant` the patient can grant or revoke. See
`src/types/domain.ts` for the full schema and rationale.

## Hard guardrail

This tool captures and structures what the patient says. It does not
diagnose, triage-rank, or infer what a symptom might mean — there is no
computed severity score or urgency rank anywhere in the data model or UI.

## Consent form translation

If a visit includes an informed consent / pre-op document, the Briefing
page surfaces it: a context-aware translator that generates a **literal
translation** (the control) and a **context-adapted translation** —
health-literacy adjusted and culturally framed, informed by that patient's
logged case timeline — side by side, plus **teach-back questions** in the
target language (Mandarin only, for now). It exists to test one
hypothesis: that translation informed by accumulated context produces
better comprehension than a one-shot literal translation alone.

It includes a **blind reviewer mode**: the two translations are shown as
unlabeled "Version A" / "Version B" (order randomized per document) so a
reviewer can pick which one they'd understand better as a patient before
being told which is which — the tool's actual success metric.

**Positioning.** Built to augment scarce interpreter/CHW capacity, not
replace a qualified medical interpreter — keep that framing in any
user-facing copy.

## Data handling

This is a personal validation tool, not a covered product: Claude via the
standard Anthropic API is **not** covered by a signed HIPAA Business
Associate Agreement. Only use de-identified or reconstructed content —
never real, identifiable consent forms, chart data, or symptom
descriptions — until a BAA is in place. There is no backend; briefing and
consent-document translations go straight from your browser to the
Anthropic API using an API key you supply on the dashboard (stored only in
this browser's `localStorage`) and are otherwise stored only in
`localStorage` alongside everything else in this app.

## Running it

```bash
npm install
npm run dev
```

Log in as one of the seeded demo patients (or create a new profile) to try
the flow. Demo patients: Maria Elena Torres (Spanish, hemodialysis, has a
completed visit), James Whitfield (English, peritoneal dialysis, has a
completed visit), Wei Lin Zhang (Chinese, hemodialysis, has a completed
visit), Carlos Reyes (Spanish, no visits yet — good for demoing the check-in
flow from scratch). Add an Anthropic API key on the dashboard to generate
briefings and consent translations.

## Known v1 limitations

- **Chinese is Simplified only.** A real deployment for LA's dialysis
  population would likely also need Traditional Chinese as a separate
  variant — many Cantonese-speaking patients read Traditional, not just a
  different font of the same text.
- **No adaptive/LLM-powered check-in questioning.** The conversation is a
  fixed, auditable decision tree, not an LLM.
- **Briefing generation is on demand, not automatic**, and costs a small
  amount of Anthropic API spend per click — deliberately, so you control
  spend rather than it happening silently.
- **For an English-speaking patient, the briefing's two columns are
  redundant** (patient language and English are the same) — generation
  still works, it's just not useful for them.
- **New page chrome (Briefing, After-visit, stepper) isn't localized** —
  only patient-facing content (translations, the check-in conversation,
  the dashboard, login) is. A real deployment would need these labels
  translated too.
- **Safety flags, consent↔visit links, and after-visit teach-back state
  live in a separate additive storage layer** (`src/types/briefing.ts`,
  `src/data/briefingStorage.ts`), not on `PatientProfile`/`VisitEntry`/
  `ConsentCase` themselves — kept that way deliberately so those four core
  types stay stable, but it does mean e.g. a safety flag isn't part of the
  `PatientProfile` record if you export/inspect it directly.
- **Resuming an in-progress visit restarts the check-in flow** from the
  beginning rather than picking back up where the patient left off (prior
  answers aren't lost from storage, but the UI will re-ask). Because of
  this, a completed check-in shows as a checkmark rather than a link on the
  visit stepper — re-entering it isn't supported.
- **Access grants are display-only.** The `ProviderAccessGrant` shape
  supports patient-driven approve/revoke, but there's no UI to act on a
  pending request yet.

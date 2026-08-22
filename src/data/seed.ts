import type { FieldWithQuote, PatientProfile, VisitEntry } from "../types/domain";
import { generatePatientRecap } from "../conversation/generateOutputs";
import { newId } from "../lib/id";

/**
 * Fictional demo data only — no real patient information. Seeds two
 * profiles with a completed visit each (so the two output views have
 * something to show immediately) and one brand-new profile with no visits
 * (so "start a new check-in" can be demoed from a clean slate).
 */
function f(structured: string, quoteLanguage: "en" | "es"): FieldWithQuote {
  return { structured, patientQuote: structured, quoteLanguage };
}

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function buildSeedData(): { profiles: PatientProfile[]; visits: VisitEntry[] } {
  const mariaId = "seed-patient-maria";
  const jamesId = "seed-patient-james";
  const carlosId = "seed-patient-carlos";

  const maria: PatientProfile = {
    id: mariaId,
    preferredLanguage: "es",
    displayName: "Maria Elena Torres",
    dateOfBirth: "1966-03-14",
    createdAt: daysAgoIso(210),
    dialysis: {
      modality: "hemodialysis",
      scheduleDays: ["Mon", "Wed", "Fri"],
      accessType: "fistula",
      dryWeightLbs: 152,
    },
    currentMedications: [
      { id: newId(), name: "Sevelamer", patientDescription: "la pastilla grande que tomo con las comidas", reportedAt: daysAgoIso(60) },
      { id: newId(), name: "Lisinopril", patientDescription: "para la presión, una vez al día", reportedAt: daysAgoIso(60) },
      { id: newId(), name: "Epoetin (dado en la clínica)", patientDescription: "la inyección que me dan en diálisis", reportedAt: daysAgoIso(60) },
    ],
    relevantHistory: ["Diabetes tipo 2, diagnosticada hace 12 años", "Hipertensión"],
    accessGrants: [
      {
        id: newId(),
        providerName: "Dra. Ana Ruiz",
        clinicName: "Westside Nephrology",
        status: "active",
        requestedAt: daysAgoIso(200),
        respondedAt: daysAgoIso(199),
        scope: "all",
      },
    ],
  };

  const james: PatientProfile = {
    id: jamesId,
    preferredLanguage: "en",
    displayName: "James Whitfield",
    dateOfBirth: "1958-11-02",
    createdAt: daysAgoIso(340),
    dialysis: {
      modality: "peritoneal_dialysis",
      scheduleDays: ["Daily — overnight cycler"],
      accessType: "peritoneal_catheter",
      dryWeightLbs: 181,
    },
    currentMedications: [
      { id: newId(), name: "Calcitriol", patientDescription: "small pill, once a day", reportedAt: daysAgoIso(30) },
      { id: newId(), name: "Furosemide", patientDescription: "water pill, in the morning", reportedAt: daysAgoIso(30) },
    ],
    relevantHistory: ["Coronary artery disease, stent placed 2019"],
    accessGrants: [
      {
        id: newId(),
        providerName: "Dr. Michael Chen",
        clinicName: "Eastview Kidney Care",
        status: "active",
        requestedAt: daysAgoIso(330),
        respondedAt: daysAgoIso(329),
        scope: "all",
      },
      {
        id: newId(),
        providerName: "Dr. Sarah Patel",
        clinicName: "Downtown Primary Care",
        status: "pending",
        requestedAt: daysAgoIso(2),
        respondedAt: null,
        scope: "all",
      },
    ],
  };

  const carlos: PatientProfile = {
    id: carlosId,
    preferredLanguage: "es",
    displayName: "Carlos Reyes",
    dateOfBirth: "1975-07-22",
    createdAt: daysAgoIso(1),
    dialysis: {
      modality: "hemodialysis",
      scheduleDays: ["Tue", "Thu", "Sat"],
      accessType: "graft",
      dryWeightLbs: 168,
    },
    currentMedications: [],
    relevantHistory: [],
    accessGrants: [],
  };

  const mariaVisit: VisitEntry = {
    id: "seed-visit-maria-1",
    patientProfileId: mariaId,
    createdAt: daysAgoIso(5),
    completedAt: daysAgoIso(5),
    status: "completed",
    languageUsed: "es",
    intendedProvider: { clinicName: "Westside Nephrology", providerName: "Dra. Ana Ruiz" },
    reasonForVisit: f("Los tobillos hinchados y me he sentido muy cansada esta semana.", "es"),
    symptoms: [
      {
        id: newId(),
        category: "swelling",
        description: f("Tengo los tobillos y los pies hinchados, más que de costumbre.", "es"),
        onset: f("Empezó hace unos cinco días.", "es"),
        location: f("En los dos tobillos y un poco en las pantorrillas.", "es"),
        severityInPatientsWords: f("Cuando presiono con el dedo se queda la marca hundida por varios segundos.", "es"),
        duration: f("Es constante, no se quita durante el día.", "es"),
        whatMakesItBetter: f("Un poco cuando pongo los pies en alto.", "es"),
        whatMakesItWorse: f("Después de estar mucho tiempo de pie en la cocina.", "es"),
        whatHasBeenTried: f("Nada todavía, solo poner los pies en alto.", "es"),
      },
      {
        id: newId(),
        category: "fatigue",
        description: f("Me siento muy cansada, sin energía para hacer las cosas de la casa.", "es"),
        onset: f("También como hace cinco días, al mismo tiempo que la hinchazón.", "es"),
        location: null,
        severityInPatientsWords: f("Es un cansancio que no se quita ni durmiendo bien.", "es"),
        duration: f("Todo el día, un poco peor en la tarde.", "es"),
        whatMakesItBetter: null,
        whatMakesItWorse: f("Cuando trato de caminar más de lo normal.", "es"),
        whatHasBeenTried: null,
      },
    ],
    dialysisContext: {
      recentWeightChange: f("He subido como 4 libras desde mi última sesión, más de lo normal para mí.", "es"),
      fluidDietAdherence: f("Se me ha hecho difícil controlar los líquidos esta semana, tomé más de lo que debía en una fiesta familiar.", "es"),
      feelingOnDialysisDays: f("Muy cansada después, más de lo usual.", "es"),
      feelingOffDialysisDays: f("Un poco mejor, pero la hinchazón sigue ahí.", "es"),
      missedOrShortenedSessions: f("No he faltado a ninguna sesión.", "es"),
    },
    medicationNotes: [f("Todo igual, sigo tomando lo mismo de siempre.", "es")],
    relevantHistoryNotes: [],
    biggestConcern: f("Me preocupa que la hinchazón sea porque no cuidé bien los líquidos, y no quiero que esto afecte mis riñones más.", "es"),
    conversation: [],
    outputs: { clinicianSummaryGeneratedAt: daysAgoIso(5), patientRecap: null },
  };
  mariaVisit.outputs.patientRecap = generatePatientRecap(mariaVisit, maria, "es");

  const jamesVisit: VisitEntry = {
    id: "seed-visit-james-1",
    patientProfileId: jamesId,
    createdAt: daysAgoIso(12),
    completedAt: daysAgoIso(12),
    status: "completed",
    languageUsed: "en",
    intendedProvider: { clinicName: "Eastview Kidney Care", providerName: "Dr. Michael Chen" },
    reasonForVisit: f("I've had really bad itching all over and I haven't felt like eating much.", "en"),
    symptoms: [
      {
        id: newId(),
        category: "itching",
        description: f("My skin itches all over, especially my back and arms.", "en"),
        onset: f("Started gradually about two weeks ago, gotten worse in the last few days.", "en"),
        location: f("Mostly my back, arms, and sometimes my scalp.", "en"),
        severityInPatientsWords: f("Bad enough that it wakes me up at night scratching.", "en"),
        duration: f("Comes and goes, worst in the evening and at night.", "en"),
        whatMakesItBetter: f("Lotion helps a little for a short while.", "en"),
        whatMakesItWorse: f("Hot showers make it worse.", "en"),
        whatHasBeenTried: f("Over-the-counter anti-itch cream, doesn't do much.", "en"),
      },
      {
        id: newId(),
        category: "appetite_change",
        description: f("I just don't have much of an appetite the last week or so.", "en"),
        onset: f("About a week.", "en"),
        location: null,
        severityInPatientsWords: f("I'm eating maybe half of what I normally do.", "en"),
        duration: f("Pretty much every day.", "en"),
        whatMakesItBetter: null,
        whatMakesItWorse: null,
        whatHasBeenTried: null,
      },
    ],
    dialysisContext: {
      recentWeightChange: f("Not much change that I've noticed.", "en"),
      fluidDietAdherence: f("Been pretty good about it, sticking to my limits.", "en"),
      feelingOnDialysisDays: f("Tired, but that's pretty normal for me.", "en"),
      feelingOffDialysisDays: f("Fine, about the same as always.", "en"),
      missedOrShortenedSessions: f("No, haven't missed any exchanges.", "en"),
    },
    medicationNotes: [f("No changes, same medications as before.", "en")],
    relevantHistoryNotes: [f("Just want to mention my heart stent is still doing fine, no chest pain.", "en")],
    biggestConcern: f("The itching is really wearing on me and I'm worried it means something is building up that shouldn't be.", "en"),
    conversation: [],
    outputs: { clinicianSummaryGeneratedAt: daysAgoIso(12), patientRecap: null },
  };
  jamesVisit.outputs.patientRecap = generatePatientRecap(jamesVisit, james, "en");

  return { profiles: [maria, james, carlos], visits: [mariaVisit, jamesVisit] };
}

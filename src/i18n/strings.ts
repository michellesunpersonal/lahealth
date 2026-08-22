import type { LanguageCode } from "../types/domain";

/**
 * UI chrome strings (nav, buttons, labels). Conversation-flow question text
 * lives alongside the flow definition in src/conversation/flow.ts, since
 * that's domain script content rather than generic UI chrome.
 */
export const strings = {
  appName: {
    en: "LA Health — Pre-Visit Intake",
    es: "LA Health — Registro Antes de la Consulta",
  },
  login: {
    title: { en: "Welcome back", es: "Bienvenido/a de nuevo" },
    subtitle: {
      en: "This is your health record. It stays with you, not any one clinic.",
      es: "Este es su expediente de salud. Le pertenece a usted, no a una sola clínica.",
    },
    chooseDemoProfile: { en: "Demo patient accounts", es: "Cuentas de pacientes de demostración" },
    or: { en: "or", es: "o" },
    createNew: { en: "Create a new patient profile", es: "Crear un nuevo perfil de paciente" },
    fullName: { en: "Full name", es: "Nombre completo" },
    dob: { en: "Date of birth", es: "Fecha de nacimiento" },
    preferredLanguage: { en: "Preferred language", es: "Idioma preferido" },
    createButton: { en: "Create profile", es: "Crear perfil" },
    logIn: { en: "Log in", es: "Iniciar sesión" },
  },
  dashboard: {
    title: { en: "Your health record", es: "Su expediente de salud" },
    persistentNote: {
      en: "This profile is yours — it carries your history across every clinic you choose to share it with.",
      es: "Este perfil es suyo — lleva su historial a través de cada clínica con la que decida compartirlo.",
    },
    startVisit: { en: "Start a new pre-visit check-in", es: "Comenzar un nuevo registro antes de la consulta" },
    pastVisits: { en: "Past visits", es: "Consultas anteriores" },
    noPastVisits: { en: "No visits yet.", es: "Aún no hay consultas." },
    inProgress: { en: "In progress", es: "En progreso" },
    completed: { en: "Completed", es: "Completada" },
    continueVisit: { en: "Continue", es: "Continuar" },
    viewSummary: { en: "View summary", es: "Ver resumen" },
    accessGrantsTitle: { en: "Clinics with access", es: "Clínicas con acceso" },
    logOut: { en: "Log out", es: "Cerrar sesión" },
    dialysisSnapshot: { en: "Dialysis snapshot", es: "Resumen de diálisis" },
  },
  intake: {
    title: { en: "Pre-visit check-in", es: "Registro antes de la consulta" },
    forClinic: { en: "For your visit at", es: "Para su consulta en" },
    yourAnswer: { en: "Type your answer…", es: "Escriba su respuesta…" },
    send: { en: "Send", es: "Enviar" },
    skip: { en: "Not applicable / skip", es: "No aplica / omitir" },
    yes: { en: "Yes", es: "Sí" },
    no: { en: "No", es: "No" },
    finishing: { en: "Preparing your summary…", es: "Preparando su resumen…" },
    done: { en: "Check-in complete", es: "Registro completo" },
    seeOutputs: { en: "See what was captured", es: "Ver lo que se registró" },
  },
  summary: {
    title: { en: "Visit summary", es: "Resumen de la consulta" },
    clinicianTab: { en: "For your care team (English)", es: "Para su equipo médico (inglés)" },
    patientTab: { en: "For you", es: "Para usted" },
    backToDashboard: { en: "Back to dashboard", es: "Volver al panel" },
    patientsOwnWords: { en: "Patient's own words", es: "Palabras del paciente" },
    noDataCaptured: { en: "Not discussed this visit", es: "No se habló de esto en esta consulta" },
    reasonForVisit: { en: "Reason for visit", es: "Motivo de la consulta" },
    symptoms: { en: "Symptoms reported", es: "Síntomas reportados" },
    dialysisContext: { en: "Dialysis context", es: "Contexto de diálisis" },
    medications: { en: "Medication notes", es: "Notas sobre medicamentos" },
    history: { en: "Relevant history", es: "Historial relevante" },
    biggestConcern: { en: "Patient's biggest concern", es: "Mayor preocupación del paciente" },
    onset: { en: "Onset", es: "Inicio" },
    location: { en: "Location", es: "Ubicación" },
    severity: { en: "Severity (patient's description)", es: "Gravedad (descripción del paciente)" },
    duration: { en: "Duration/pattern", es: "Duración/patrón" },
    better: { en: "What helps", es: "Qué ayuda" },
    worse: { en: "What worsens it", es: "Qué empeora" },
    tried: { en: "Already tried", es: "Ya intentado" },
    disclaimer: {
      en: "This is a structured account of what the patient reported. It is not a diagnosis, triage rank, or clinical recommendation.",
      es: "Este es un registro estructurado de lo que reportó el paciente. No es un diagnóstico, una clasificación de urgencia, ni una recomendación clínica.",
    },
    recapIntro: {
      en: "Here's a plain-language recap of what you shared, and some points you might want to raise with your care team.",
      es: "Aquí tiene un resumen en lenguaje sencillo de lo que compartió, y algunos puntos que podría plantear a su equipo médico.",
    },
    suggestedQuestions: { en: "You might ask your care team", es: "Podría preguntarle a su equipo médico" },
  },
} as const;

export function t(entry: Record<LanguageCode, string>, lang: LanguageCode): string {
  return entry[lang];
}

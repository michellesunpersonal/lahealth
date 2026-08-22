import type { LanguageCode } from "../types/domain";

/**
 * UI chrome strings (nav, buttons, labels). Conversation-flow question text
 * lives alongside the flow definition in src/conversation/flow.ts, since
 * that's domain script content rather than generic UI chrome.
 *
 * Chinese here is Simplified Chinese (zh-Hans). A real deployment for LA's
 * dialysis population would likely also need Traditional Chinese as a
 * separate variant — many Cantonese-speaking patients read Traditional, not
 * just a different font of the same text — but that's out of scope for v1.
 */
export const strings = {
  appName: {
    en: "LA Health — Pre-Visit Intake",
    es: "LA Health — Registro Antes de la Consulta",
    zh: "LA Health — 就诊前登记",
  },
  login: {
    title: { en: "Welcome back", es: "Bienvenido/a de nuevo", zh: "欢迎回来" },
    subtitle: {
      en: "This is your health record. It stays with you, not any one clinic.",
      es: "Este es su expediente de salud. Le pertenece a usted, no a una sola clínica.",
      zh: "这是您的健康档案。它属于您本人，而不属于某一家诊所。",
    },
    chooseDemoProfile: { en: "Demo patient accounts", es: "Cuentas de pacientes de demostración", zh: "演示患者账户" },
    or: { en: "or", es: "o", zh: "或" },
    createNew: { en: "Create a new patient profile", es: "Crear un nuevo perfil de paciente", zh: "创建新的患者档案" },
    fullName: { en: "Full name", es: "Nombre completo", zh: "姓名" },
    dob: { en: "Date of birth", es: "Fecha de nacimiento", zh: "出生日期" },
    preferredLanguage: { en: "Preferred language", es: "Idioma preferido", zh: "首选语言" },
    createButton: { en: "Create profile", es: "Crear perfil", zh: "创建档案" },
    logIn: { en: "Log in", es: "Iniciar sesión", zh: "登录" },
  },
  dashboard: {
    title: { en: "Your health record", es: "Su expediente de salud", zh: "您的健康档案" },
    persistentNote: {
      en: "This profile is yours — it carries your history across every clinic you choose to share it with.",
      es: "Este perfil es suyo — lleva su historial a través de cada clínica con la que decida compartirlo.",
      zh: "此档案属于您 — 无论您选择与哪家诊所分享，它都会携带您的完整病史。",
    },
    startVisit: {
      en: "Start a new pre-visit check-in",
      es: "Comenzar un nuevo registro antes de la consulta",
      zh: "开始新的就诊前登记",
    },
    pastVisits: { en: "Past visits", es: "Consultas anteriores", zh: "既往就诊" },
    noPastVisits: { en: "No visits yet.", es: "Aún no hay consultas.", zh: "暂无就诊记录。" },
    inProgress: { en: "In progress", es: "En progreso", zh: "进行中" },
    completed: { en: "Completed", es: "Completada", zh: "已完成" },
    continueVisit: { en: "Continue", es: "Continuar", zh: "继续" },
    viewSummary: { en: "View summary", es: "Ver resumen", zh: "查看摘要" },
    accessGrantsTitle: { en: "Clinics with access", es: "Clínicas con acceso", zh: "有权访问的诊所" },
    logOut: { en: "Log out", es: "Cerrar sesión", zh: "退出登录" },
    dialysisSnapshot: { en: "Dialysis snapshot", es: "Resumen de diálisis", zh: "透析概况" },
    noAccessGrants: { en: "No clinics yet.", es: "Aún no hay clínicas.", zh: "暂无诊所。" },
    statusPending: { en: "Requested access", es: "Solicitó acceso", zh: "已申请访问" },
    statusActive: { en: "Active", es: "Activo", zh: "已授权" },
    statusRevoked: { en: "Revoked", es: "Revocado", zh: "已撤销" },
    statusDenied: { en: "Denied", es: "Denegado", zh: "已拒绝" },
    approve: { en: "Approve", es: "Aprobar", zh: "同意" },
    deny: { en: "Deny", es: "Denegar", zh: "拒绝" },
    revoke: { en: "Revoke access", es: "Revocar acceso", zh: "撤销访问权限" },
    requestAccessDemo: {
      en: "Simulate a clinic requesting access",
      es: "Simular que una clínica solicita acceso",
      zh: "模拟诊所申请访问（演示）",
    },
    requestAccessNote: {
      en: "In a real deployment, a clinic would trigger this from their own system, not from your dashboard.",
      es: "En una implementación real, la clínica generaría esta solicitud desde su propio sistema, no desde su panel.",
      zh: "在实际系统中，此请求应由诊所在其自己的系统中发起，而不是从您的主页发起。",
    },
    clinicNameLabel: { en: "Clinic name", es: "Nombre de la clínica", zh: "诊所名称" },
    providerNameLabel: { en: "Provider name", es: "Nombre del proveedor", zh: "医生姓名" },
    submitRequest: { en: "Submit request", es: "Enviar solicitud", zh: "提交申请" },
  },
  intake: {
    title: { en: "Pre-visit check-in", es: "Registro antes de la consulta", zh: "就诊前登记" },
    forClinic: { en: "For your visit at", es: "Para su consulta en", zh: "本次登记用于您在以下机构的就诊：" },
    yourAnswer: { en: "Type your answer…", es: "Escriba su respuesta…", zh: "请输入您的回答…" },
    send: { en: "Send", es: "Enviar", zh: "发送" },
    skip: { en: "Not applicable / skip", es: "No aplica / omitir", zh: "不适用 / 跳过" },
    yes: { en: "Yes", es: "Sí", zh: "是" },
    no: { en: "No", es: "No", zh: "否" },
    finishing: { en: "Preparing your summary…", es: "Preparando su resumen…", zh: "正在准备您的摘要…" },
    done: { en: "Check-in complete", es: "Registro completo", zh: "登记已完成" },
    seeOutputs: { en: "See what was captured", es: "Ver lo que se registró", zh: "查看已记录的内容" },
  },
  summary: {
    title: { en: "Visit summary", es: "Resumen de la consulta", zh: "就诊摘要" },
    clinicianTab: {
      en: "For your care team (English)",
      es: "Para su equipo médico (inglés)",
      zh: "提供给医疗团队（英文）",
    },
    patientTab: { en: "For you", es: "Para usted", zh: "给您本人" },
    backToDashboard: { en: "Back to dashboard", es: "Volver al panel", zh: "返回主页" },
    patientsOwnWords: { en: "Patient's own words", es: "Palabras del paciente", zh: "患者原话" },
    noDataCaptured: {
      en: "Not discussed this visit",
      es: "No se habló de esto en esta consulta",
      zh: "本次未涉及此项",
    },
    reasonForVisit: { en: "Reason for visit", es: "Motivo de la consulta", zh: "就诊原因" },
    symptoms: { en: "Symptoms reported", es: "Síntomas reportados", zh: "报告的症状" },
    dialysisContext: { en: "Dialysis context", es: "Contexto de diálisis", zh: "透析相关情况" },
    medications: { en: "Medication notes", es: "Notas sobre medicamentos", zh: "用药说明" },
    history: { en: "Relevant history", es: "Historial relevante", zh: "相关病史" },
    biggestConcern: { en: "Patient's biggest concern", es: "Mayor preocupación del paciente", zh: "患者最担心的问题" },
    onset: { en: "Onset", es: "Inicio", zh: "起始时间" },
    location: { en: "Location", es: "Ubicación", zh: "部位" },
    severity: {
      en: "Severity (patient's description)",
      es: "Gravedad (descripción del paciente)",
      zh: "严重程度（患者描述）",
    },
    duration: { en: "Duration/pattern", es: "Duración/patrón", zh: "持续时间/规律" },
    better: { en: "What helps", es: "Qué ayuda", zh: "缓解因素" },
    worse: { en: "What worsens it", es: "Qué empeora", zh: "加重因素" },
    tried: { en: "Already tried", es: "Ya intentado", zh: "已尝试的方法" },
    disclaimer: {
      en: "This is a structured account of what the patient reported. It is not a diagnosis, triage rank, or clinical recommendation.",
      es: "Este es un registro estructurado de lo que reportó el paciente. No es un diagnóstico, una clasificación de urgencia, ni una recomendación clínica.",
      zh: "这是对患者所述内容的结构化记录，不是诊断、分诊分级或临床建议。",
    },
    recapIntro: {
      en: "Here's a plain-language recap of what you shared, and some points you might want to raise with your care team.",
      es: "Aquí tiene un resumen en lenguaje sencillo de lo que compartió, y algunos puntos que podría plantear a su equipo médico.",
      zh: "以下是您所分享内容的通俗摘要，以及您可能想向医疗团队提出的一些问题。",
    },
    suggestedQuestions: {
      en: "You might ask your care team",
      es: "Podría preguntarle a su equipo médico",
      zh: "您可以向医疗团队询问",
    },
  },
} as const;

export function t(entry: Record<LanguageCode, string>, lang: LanguageCode): string {
  return entry[lang];
}

/** Each language's own name for itself, for UI toggles/selects. */
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  es: "Español",
  zh: "中文",
};

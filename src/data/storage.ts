import type { PatientProfile, VisitEntry } from "../types/domain";

/**
 * Prototype persistence: everything lives in localStorage, keyed by id.
 * This is intentionally a thin key-value layer — swapping it for a real
 * backend later means replacing this file, not the data model or the UI.
 */
const PROFILES_KEY = "lahealth.profiles";
const VISITS_KEY = "lahealth.visits";
const SESSION_KEY = "lahealth.session.profileId";

function readMap<T>(key: string): Record<string, T> {
  const raw = localStorage.getItem(key);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, T>;
  } catch {
    return {};
  }
}

function writeMap<T>(key: string, map: Record<string, T>): void {
  localStorage.setItem(key, JSON.stringify(map));
}

export const store = {
  getAllProfiles(): PatientProfile[] {
    return Object.values(readMap<PatientProfile>(PROFILES_KEY));
  },

  getProfile(id: string): PatientProfile | null {
    return readMap<PatientProfile>(PROFILES_KEY)[id] ?? null;
  },

  saveProfile(profile: PatientProfile): void {
    const all = readMap<PatientProfile>(PROFILES_KEY);
    all[profile.id] = profile;
    writeMap(PROFILES_KEY, all);
  },

  getVisitsForProfile(profileId: string): VisitEntry[] {
    const all = readMap<VisitEntry>(VISITS_KEY);
    return Object.values(all)
      .filter((v) => v.patientProfileId === profileId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getVisit(id: string): VisitEntry | null {
    return readMap<VisitEntry>(VISITS_KEY)[id] ?? null;
  },

  saveVisit(visit: VisitEntry): void {
    const all = readMap<VisitEntry>(VISITS_KEY);
    all[visit.id] = visit;
    writeMap(VISITS_KEY, all);
  },

  getSessionProfileId(): string | null {
    return localStorage.getItem(SESSION_KEY);
  },

  setSessionProfileId(id: string | null): void {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  },

  /** Wipes all app data. Prototype-only convenience for resetting a demo. */
  resetAll(): void {
    localStorage.removeItem(PROFILES_KEY);
    localStorage.removeItem(VISITS_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};

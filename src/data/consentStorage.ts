import type { ConsentCase } from "../types/consent";

/**
 * Prototype persistence: everything lives in localStorage, same pattern as
 * data/storage.ts for the symptom-capture tool. This is a separate keyspace
 * (and a separate tool) — the two prototypes share a repo and a stack, not a
 * data model.
 */
const CASES_KEY = "lahealth.consent.cases";

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

export const consentStore = {
  getAllCases(): ConsentCase[] {
    return Object.values(readMap<ConsentCase>(CASES_KEY)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  getCase(id: string): ConsentCase | null {
    return readMap<ConsentCase>(CASES_KEY)[id] ?? null;
  },

  saveCase(consentCase: ConsentCase): void {
    const all = readMap<ConsentCase>(CASES_KEY);
    all[consentCase.id] = consentCase;
    writeMap(CASES_KEY, all);
  },

  deleteCase(id: string): void {
    const all = readMap<ConsentCase>(CASES_KEY);
    delete all[id];
    writeMap(CASES_KEY, all);
  },
};

import type { SafetyFlag, VisitBriefing, VisitConsentLink, VisitTeachBackItem } from "../types/briefing";

/**
 * Additive storage for the unified visit flow — same localStorage
 * map-per-key pattern as data/storage.ts and data/consentStorage.ts, kept
 * in its own keyspace so PatientProfile/VisitEntry/ConsentCase records
 * never need to change shape.
 */
const SAFETY_FLAGS_KEY = "lahealth.briefing.safetyFlags";
const CONSENT_LINKS_KEY = "lahealth.briefing.consentLinks";
const VISIT_BRIEFINGS_KEY = "lahealth.briefing.visitBriefings";
const TEACH_BACK_KEY = "lahealth.briefing.teachBack";

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

export const briefingStore = {
  getSafetyFlagsForProfile(profileId: string): SafetyFlag[] {
    return Object.values(readMap<SafetyFlag>(SAFETY_FLAGS_KEY))
      .filter((f) => f.patientProfileId === profileId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  saveSafetyFlag(flag: SafetyFlag): void {
    const all = readMap<SafetyFlag>(SAFETY_FLAGS_KEY);
    all[flag.id] = flag;
    writeMap(SAFETY_FLAGS_KEY, all);
  },

  deleteSafetyFlag(id: string): void {
    const all = readMap<SafetyFlag>(SAFETY_FLAGS_KEY);
    delete all[id];
    writeMap(SAFETY_FLAGS_KEY, all);
  },

  getConsentLinkForVisit(visitId: string): VisitConsentLink | null {
    return Object.values(readMap<VisitConsentLink>(CONSENT_LINKS_KEY)).find((l) => l.visitId === visitId) ?? null;
  },

  getAllConsentLinks(): VisitConsentLink[] {
    return Object.values(readMap<VisitConsentLink>(CONSENT_LINKS_KEY));
  },

  saveConsentLink(link: VisitConsentLink): void {
    const all = readMap<VisitConsentLink>(CONSENT_LINKS_KEY);
    all[link.consentCaseId] = link;
    writeMap(CONSENT_LINKS_KEY, all);
  },

  getBriefingForVisit(visitId: string): VisitBriefing | null {
    return readMap<VisitBriefing>(VISIT_BRIEFINGS_KEY)[visitId] ?? null;
  },

  saveBriefing(briefing: VisitBriefing): void {
    const all = readMap<VisitBriefing>(VISIT_BRIEFINGS_KEY);
    all[briefing.visitId] = briefing;
    writeMap(VISIT_BRIEFINGS_KEY, all);
  },

  getTeachBackForVisit(visitId: string): VisitTeachBackItem[] {
    return Object.values(readMap<VisitTeachBackItem>(TEACH_BACK_KEY)).filter((t) => t.visitId === visitId);
  },

  saveTeachBackItem(item: VisitTeachBackItem): void {
    const all = readMap<VisitTeachBackItem>(TEACH_BACK_KEY);
    all[item.id] = item;
    writeMap(TEACH_BACK_KEY, all);
  },

  replaceTeachBackForVisit(visitId: string, items: VisitTeachBackItem[]): void {
    const all = readMap<VisitTeachBackItem>(TEACH_BACK_KEY);
    for (const key of Object.keys(all)) {
      if (all[key].visitId === visitId) delete all[key];
    }
    for (const item of items) all[item.id] = item;
    writeMap(TEACH_BACK_KEY, all);
  },
};

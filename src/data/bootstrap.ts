import { store } from "./storage";
import { buildSeedData } from "./seed";

export function ensureSeeded(): void {
  if (store.getAllProfiles().length > 0) return;
  const { profiles, visits } = buildSeedData();
  profiles.forEach((p) => store.saveProfile(p));
  visits.forEach((v) => store.saveVisit(v));
}

import type { PatientProfile, ProviderAccessGrant } from "../types/domain";
import { newId, nowIso } from "../lib/id";

/**
 * Pure reducers for the "provider requests, patient authorizes" model.
 * Every action here is something only the patient can do to their own
 * profile — a clinic never gets to flip its own grant to active. There is
 * no separate "provider portal" in this prototype, so requestAccess is what
 * a real provider-facing app would eventually call; the dashboard also
 * exposes it directly (labeled as a simulation) so the whole lifecycle can
 * be demoed from one app.
 */

function updateGrant(
  profile: PatientProfile,
  grantId: string,
  changes: Partial<ProviderAccessGrant>
): PatientProfile {
  return {
    ...profile,
    accessGrants: profile.accessGrants.map((g) => (g.id === grantId ? { ...g, ...changes } : g)),
  };
}

export function approveGrant(profile: PatientProfile, grantId: string): PatientProfile {
  return updateGrant(profile, grantId, { status: "active", respondedAt: nowIso() });
}

export function denyGrant(profile: PatientProfile, grantId: string): PatientProfile {
  return updateGrant(profile, grantId, { status: "denied", respondedAt: nowIso() });
}

export function revokeGrant(profile: PatientProfile, grantId: string): PatientProfile {
  return updateGrant(profile, grantId, { status: "revoked", respondedAt: nowIso() });
}

export function requestAccess(profile: PatientProfile, clinicName: string, providerName: string): PatientProfile {
  const grant: ProviderAccessGrant = {
    id: newId(),
    providerName: providerName.trim() || "—",
    clinicName: clinicName.trim() || "—",
    status: "pending",
    requestedAt: nowIso(),
    respondedAt: null,
    scope: "all",
  };
  return { ...profile, accessGrants: [...profile.accessGrants, grant] };
}

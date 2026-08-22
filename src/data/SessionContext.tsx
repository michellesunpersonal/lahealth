import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { PatientProfile } from "../types/domain";
import { store } from "./storage";

interface SessionContextValue {
  profile: PatientProfile | null;
  logIn: (profileId: string) => void;
  logOut: () => void;
  refreshProfile: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PatientProfile | null>(() => {
    const id = store.getSessionProfileId();
    return id ? store.getProfile(id) : null;
  });

  const logIn = useCallback((profileId: string) => {
    store.setSessionProfileId(profileId);
    setProfile(store.getProfile(profileId));
  }, []);

  const logOut = useCallback(() => {
    store.setSessionProfileId(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(() => {
    setProfile((p) => (p ? store.getProfile(p.id) : p));
  }, []);

  return (
    <SessionContext.Provider value={{ profile, logIn, logOut, refreshProfile }}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

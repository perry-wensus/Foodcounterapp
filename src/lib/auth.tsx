import type { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabase";

/** Versie van de toestemmingstekst. Ophogen bij inhoudelijke wijziging -> opnieuw vragen. */
export const CONSENT_VERSION = "2026-11-16";

type Profile = { consent_at: string | null; consent_version: string | null };

type AuthState = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  hasConsent: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) {
      setProfile(null);
      return;
    }
    const { data } = await supabase
      .from("profiles")
      .select("consent_at, consent_version")
      .eq("id", s.user.id)
      .maybeSingle();
    setProfile(data ?? { consent_at: null, consent_version: null });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      // Niet awaiten binnen de callback (supabase-js advies); profiel laadt los.
      setTimeout(() => void loadProfile(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session), [loadProfile, session]);

  const hasConsent = !!profile?.consent_at && profile.consent_version === CONSENT_VERSION;

  return (
    <AuthContext.Provider value={{ ready, session, profile, hasConsent, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth buiten AuthProvider");
  return ctx;
}

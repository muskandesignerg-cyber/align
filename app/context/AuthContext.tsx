import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getProfile, Profile } from '../lib/database';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Raw Supabase session (null = not logged in) */
  session: Session | null;
  /** Current Supabase user */
  user: User | null;
  /** Fetched DB profile */
  profile: Profile | null;
  /** True while loading session on app start */
  loading: boolean;
  /** Refresh the DB profile from Supabase */
  refreshProfile: () => Promise<void>;
  /** Locally mark onboarding as complete (fallback if DB fails) */
  markOnboardingComplete: () => void;
  /** Sign the user out — clears state immediately, no Alert needed */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  markOnboardingComplete: () => {},
  signOut: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * A ref that is set to true while sign-out is in progress.
   * This prevents the onAuthStateChange listener from racing with the
   * manual state clear we do inside signOut().
   */
  const isSigningOutRef = useRef(false);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      // 3-second hard timeout for profile fetch to prevent infinite loading
      const timeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
        Promise.race([
          p,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Profile fetch timeout')), ms)
          ),
        ]);

      const p = await timeout(getProfile(userId), 3000).catch(() => null);
      if (p) {
        setProfile(p);
      } else {
        // Fallback upsert with timeout
        const { data } = await timeout(
          supabase
            .from('profiles')
            .upsert({ id: userId, onboarding_complete: false }, { onConflict: 'id' })
            .select()
            .single(),
          3000
        ).catch(() => ({ data: null }));

        if (data) setProfile(data as any);
        else setProfile(null);
      }
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  /** Locally set onboarding_complete — used as fallback when Supabase DB fails */
  const markOnboardingComplete = useCallback(() => {
    setProfile((prev) => {
      if (prev) return { ...prev, onboarding_complete: true };
      return {
        id: user?.id ?? '',
        full_name: user?.email?.split('@')[0] ?? 'User',
        role: 'candidate',
        onboarding_complete: true,
      } as Profile;
    });
  }, [user]);

  /**
   * Sign out — clears all local state IMMEDIATELY so RootNavigator
   * re-renders to the auth/onboarding flow without any delay.
   * The Supabase network call happens after, in the background.
   */
  const signOut = useCallback(async () => {
    // Set the guard ref so the auth listener ignores any events
    // that fire during the sign-out transition
    isSigningOutRef.current = true;

    // Wipe state synchronously — React will re-render RootNavigator
    // in the same tick, switching to <OnboardingNavigator>
    setSession(null);
    setUser(null);
    setProfile(null);

    // Tell Supabase to invalidate the session on the server
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[AuthContext] signOut error (non-fatal):', e);
    } finally {
      // Allow the listener to process events again
      isSigningOutRef.current = false;
    }
  }, []);

  useEffect(() => {
    // ── 1. Load existing session on mount ──────────────────────────────────
    const initSession = async () => {
      try {
        const timeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
          Promise.race([
            p,
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error('getSession timeout')), ms)
            ),
          ]);

        const { data: { session: s } } = await timeout(supabase.auth.getSession(), 3000);
        if (isSigningOutRef.current) return; // ignore during sign-out
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          loadProfile(s.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.warn('getSession timed out or failed:', e);
        setLoading(false);
      }
    };
    initSession();

    // ── 2. Subscribe to all auth state changes ─────────────────────────────
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        // During explicit sign-out, we've already cleared state manually.
        // Ignore events until the sign-out completes to avoid flicker.
        if (isSigningOutRef.current) return;

        setSession(s);
        setUser(s?.user ?? null);

        if (s?.user) {
          await loadProfile(s.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  return (
    <AuthContext.Provider
      value={{ session, user, profile, loading, refreshProfile, markOnboardingComplete, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => useContext(AuthContext);

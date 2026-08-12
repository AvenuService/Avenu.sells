import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, SupabaseClient, Subscription } from "@supabase/supabase-js";
import { assertSupabase, supabaseConfigured } from "./supabaseClient";

// Shopper (customer) auth for the storefront. Unlike the admin auth context,
// this is real Supabase Auth — Google OAuth for now, more providers later.

type ShopperAuthContextValue = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInWithEmail: (email: string) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const ShopperAuthContext = createContext<ShopperAuthContextValue | null>(null);

// Where we land after the OAuth redirect round-trip. Origin + /checkout so
// the cart (still in localStorage) is sitting right where they left it.
const redirectURL = () =>
  typeof window !== "undefined"
    ? `${window.location.origin}/checkout`
    : undefined;

export function ShopperAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    let sub: Subscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const sb: SupabaseClient = assertSupabase();
        const { data, error: err } = await sb.auth.getSession();
        if (cancelled) return;
        if (err) setError(err.message);
        setSession(data.session);

        // Subscribe to any auth change (signIn / signOut / token refresh).
        const { data: listener } = sb.auth.onAuthStateChange((_event, sess) => {
          setSession(sess);
          setLoading(false);
          setError(null);
        });
        sub = listener.subscription;
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      sub?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabaseConfigured) return { ok: false, error: "Supabase not configured" };
    try {
      const sb = assertSupabase();
      const { error: err } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectURL(),
          queryParams: { prompt: "select_account" },
        },
      });
      if (err) {
        setError(err.message);
        return { ok: false, error: err.message };
      }
      // Browser will redirect to Google, then back to /checkout.
      return { ok: true };
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(m);
      return { ok: false, error: m };
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string) => {
    if (!supabaseConfigured) return { ok: false, error: "Supabase not configured" };
    if (!email.trim()) return { ok: false, error: "Enter your email" };
    try {
      const sb = assertSupabase();
      const { error: err } = await sb.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectURL() },
      });
      if (err) {
        setError(err.message);
        return { ok: false, error: err.message };
      }
      return { ok: true };
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(m);
      return { ok: false, error: m };
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabaseConfigured) {
      setSession(null);
      return;
    }
    try {
      const sb = assertSupabase();
      await sb.auth.signOut();
    } finally {
      setSession(null);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<ShopperAuthContextValue>(
    () => ({
      session,
      loading,
      error,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      clearError,
    }),
    [session, loading, error, signInWithGoogle, signInWithEmail, signOut, clearError],
  );

  return <ShopperAuthContext.Provider value={value}>{children}</ShopperAuthContext.Provider>;
}

export function useShopperAuth() {
  const ctx = useContext(ShopperAuthContext);
  if (!ctx) throw new Error("useShopperAuth must be used within <ShopperAuthProvider>");
  return ctx;
}

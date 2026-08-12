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
  updateProfile: (data: { fullName?: string; username?: string }) => Promise<{ ok: boolean; error?: string }>;
  clearError: () => void;
  // Account drawer (opened by the navbar's Account icon)
  isOpen: boolean;
  openAccount: () => void;
  closeAccount: () => void;
};

const ShopperAuthContext = createContext<ShopperAuthContextValue | null>(null);

// Where we land after the OAuth redirect round-trip. Origin + /checkout so
// the cart (still in localStorage) is sitting right where they left it.
const redirectURL = () =>
  typeof window !== "undefined"
    ? `${window.location.origin}/checkout`
    : undefined;

// The username lives in user.user_metadata. We also persist a display fullName.
// These are the keys we keep consistent across user_metadata updates.
const META_USERNAME = "username";
const META_FULL_NAME = "full_name";

export function ShopperAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

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

  const updateProfile = useCallback<
    ShopperAuthContextValue["updateProfile"]
  >(async (data) => {
    if (!supabaseConfigured) return { ok: false, error: "Supabase not configured" };
    try {
      const sb = assertSupabase();
      // Merge into existing user_metadata so we don't drop the Google-provided
      // fields (picture, full_name from Google, etc.) on first edit.
      const current = session?.user?.user_metadata ?? {};
      const next: Record<string, unknown> = { ...current };
      if (data.fullName !== undefined) next[META_FULL_NAME] = data.fullName.trim();
      if (data.username !== undefined) next[META_USERNAME] = data.username.trim();

      const { error: err } = await sb.auth.updateUser({ data: next });
      if (err) {
        setError(err.message);
        return { ok: false, error: err.message };
      }
      // Force a session refresh so consumers re-render with new metadata.
      const { data: sess } = await sb.auth.getSession();
      setSession(sess.session);
      return { ok: true };
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setError(m);
      return { ok: false, error: m };
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const openAccount = useCallback(() => setIsOpen(true), []);
  const closeAccount = useCallback(() => setIsOpen(false), []);

  const value = useMemo<ShopperAuthContextValue>(
    () => ({
      session,
      loading,
      error,
      signInWithGoogle,
      signInWithEmail,
      signOut,
      updateProfile,
      clearError,
      isOpen,
      openAccount,
      closeAccount,
    }),
    [session, loading, error, signInWithGoogle, signInWithEmail, signOut, updateProfile, clearError, isOpen, openAccount, closeAccount],
  );

  return <ShopperAuthContext.Provider value={value}>{children}</ShopperAuthContext.Provider>;
}

export function useShopperAuth() {
  const ctx = useContext(ShopperAuthContext);
  if (!ctx) throw new Error("useShopperAuth must be used within <ShopperAuthProvider>");
  return ctx;
}

// Convenience: read a user's display name from a Session, with sensible fallbacks.
export function displayName(session: Session | null): string {
  const m = session?.user?.user_metadata;
  if (!m) return "";
  return (
    (typeof m.full_name === "string" && m.full_name) ||
    (typeof m.name === "string" && m.name) ||
    session?.user?.email?.split("@")[0] ||
    ""
  );
}

// Read the username from session metadata.
export function displayUsername(session: Session | null): string {
  const m = session?.user?.user_metadata;
  if (!m) return "";
  return typeof m.username === "string" ? m.username : "";
}

// Read an avatar URL if Google provided one.
export function avatarUrl(session: Session | null): string {
  const m = session?.user?.user_metadata;
  if (!m) return "";
  if (typeof m.avatar_url === "string") return m.avatar_url;
  if (typeof m.picture === "string") return m.picture;
  return "";
}

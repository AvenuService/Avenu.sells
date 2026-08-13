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

// ---- OAuth redirect URL resolution ----
// Priority: explicit env override → hardcoded production domain → current
// window.origin (last-resort, dev/preview only).
//
// Why the env wins: the Vercel↔Supabase integration auto-syncs preview
// deployment URLs (`*.vercel.app`) into the Supabase Auth redirect
// whitelist, which means `window.location.origin` on a preview deploy would
// produce a URL Supabase accepts but bounces back to a throwaway host.
// `VITE_AUTH_REDIRECT_URL` forces a stable production URL regardless of
// which deploy the user is currently on. Set it in .env.local for dev and
// in the Vercel project env vars for production.
const PROD_REDIRECT_BASE = "https://wwww.avenu.sale";
const AUTH_REDIRECT_PATH = "/checkout";

function resolveRedirectBase(): string {
  if (typeof window === "undefined") return PROD_REDIRECT_BASE;
  const env =
    (import.meta.env.VITE_AUTH_REDIRECT_URL as string | undefined) ||
    (import.meta.env.VITE_SITE_URL as string | undefined);
  if (env && /^https?:\/\//.test(env)) return env.replace(/\/$/, "");
  // LAST resort: current origin. Only fires if env not set at all — which on
  // production we always set, so this only affects local dev.
  return window.location.origin;
}

const redirectURL = () => `${resolveRedirectBase()}${AUTH_REDIRECT_PATH}`;

// The username lives in user.user_metadata. We also persist a display fullName.
// These are the keys we keep consistent across user_metadata updates.
const META_USERNAME = "username";
const META_FULL_NAME = "full_name";

// Manually strip + parse an OAuth hash fragment synchronously. Exported so
// main.tsx can call it BEFORE React mounts, so BrowserRouter never sees the
// giant access_token=... fragment (which can confuse routing and cause
// infinite loading). Returns the parsed tokens if present, or null.
export function consumeOAuthHash(): {
  access_token: string;
  refresh_token: string;
  provider_token?: string | null;
  error?: string | null;
} | null {
  if (typeof window === "undefined") return null;
  const rawHash = window.location.hash || "";
  const isOAuth =
    rawHash.includes("access_token=") ||
    rawHash.includes("refresh_token=") ||
    rawHash.includes("provider_token=") ||
    rawHash.includes("error=") ||
    rawHash.includes("error_description=");
  if (!isOAuth) return null;

  const params = new URLSearchParams(rawHash.startsWith("#") ? rawHash.slice(1) : rawHash);
  const err = params.get("error_description") || params.get("error");
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  const provider_token = params.get("provider_token");

  // Always strip the hash regardless of outcome, so the URL is clean before
  // React/Router render and so a refresh doesn't re-trigger parsing.
  try {
    const cleanURL =
      window.location.origin + window.location.pathname + window.location.search;
    window.history.replaceState(null, "", cleanURL);
  } catch {
    /* ignore */
  }

  if (err) return { access_token: "", refresh_token: "", error: err };
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, provider_token };
}

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

        // ---------- STEP 1: handle the OAuth hash fragment ----------
        // main.tsx already calls consumeOAuthHash() BEFORE React mounts and
        // stashes the parsed tokens on window.__avenu_oauth_tokens so
        // BrowserRouter never sees the giant access_token fragment. We read
        // those tokens here and call the public `setSession` API to
        // establish the session in Supabase's auth client.
        // (If for any reason main.tsx didn't run — e.g. hot reload — also try
        //  consumeOAuthHash() here; it's a no-op if the hash is already gone.)
        const oauthTokens =
          (window as unknown as { __avenu_oauth_tokens?: { access_token: string; refresh_token: string; provider_token?: string | null; error?: string | null } | null }).__avenu_oauth_tokens ||
          consumeOAuthHash();

        if (oauthTokens) {
          if (oauthTokens.error) {
            setError(oauthTokens.error);
          } else if (oauthTokens.access_token && oauthTokens.refresh_token) {
            const { error: setErr } = await sb.auth.setSession({
              access_token: oauthTokens.access_token,
              refresh_token: oauthTokens.refresh_token,
            });
            if (setErr) setError(setErr.message);

            // Persist provider_token (Google scopes) into user metadata —
            // best-effort; ignore failures.
            if (oauthTokens.provider_token) {
              try {
                await sb.auth.updateUser({
                  data: { provider_token: oauthTokens.provider_token },
                });
              } catch {
                /* ignore */
              }
            }
          }
          // Clear the stash so a future mount (hot reload) doesn't replay it.
          try {
            delete (window as unknown as { __avenu_oauth_tokens?: unknown }).__avenu_oauth_tokens;
          } catch {
            /* ignore */
          }
        }

        // ---------- STEP 2: read the now-established session ----------
        const { data, error: err } = await sb.auth.getSession();
        if (cancelled) return;
        if (err) setError(err.message);
        setSession(data.session);

        // Subscribe AFTER the first session resolution so we don't get a
        // redundant INITIAL_SESSION event racing with our own setState.
        const { data: listener } = sb.auth.onAuthStateChange((_event, sess) => {
          setSession(sess);
          setLoading(false);
          setError(null);
        });
        sub = listener.subscription;
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
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

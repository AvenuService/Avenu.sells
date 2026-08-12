import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Loaded from .env.local in dev or Vercel's Supabase Integration env vars in production.
const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  (import.meta.env.SUPABASE_URL as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined);

const anonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined);

const isConfigured = !!(
  url &&
  anonKey &&
  url.startsWith("https://") &&
  anonKey.length > 10 &&
  !anonKey.includes("PASTE-YOUR-ANON-KEY")
);

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      realtime: { params: { eventsPerSecond: 2 } },
    })
  : null;

export const supabaseConfigured = isConfigured;

export function assertSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see README).",
    );
  }
  return supabase;
}

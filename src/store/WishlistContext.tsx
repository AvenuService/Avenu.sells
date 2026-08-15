import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useShopperAuth } from "./ShopperAuthContext";
import { supabase, supabaseConfigured } from "./supabaseClient";

const STORAGE_KEY = "avenu.wishlist.v1";

type WishlistValue = {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  add: (id: string) => void;
  remove: (id: string) => void;
};

const WishlistContext = createContext<WishlistValue | null>(null);

/**
 * Wishlist state. Always persisted to localStorage (so it survives reloads and
 * works for unsigned guests). When a shopper is signed in we *also* attempt a
 * best-effort sync to a Supabase `wishlist` table — if that table doesn't exist
 * the sync errors are swallowed and the client list keeps working.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  // Namespace by user id when signed in so a guest list and a logged-in list
  // don't collide.
  const { session } = useShopperAuth();
  const storageKey = session?.user?.id
    ? `${STORAGE_KEY}.${session.user.id}`
    : STORAGE_KEY;

  const [ids, setIds] = useLocalStorage<string[]>(storageKey, []);

  useEffect(() => {
    // Best-effort server sync. Everything here is wrapped so a missing table
    // or network hiccup can never break the feature.
    const sync = async () => {
      if (!session || !supabaseConfigured || !supabase) return;
      try {
                // The `wishlist` table is optional infra — cast to `any` so a missing
        // table/schema never breaks the build or the feature at runtime.
        const sb = supabase as unknown as { from: (t: string) => any };
        const q = sb.from("wishlist");

        const cur = new Set(ids);
        const { data: existing, error: existingErr } = await q
          .select("product_id")
          .eq("user_id", session.user.id);
        if (!existingErr && Array.isArray(existing)) {
          for (const row of existing as { product_id?: string }[]) {
            if (row.product_id && !cur.has(row.product_id)) {
              await q
                .delete()
                .match({ user_id: session.user.id, product_id: row.product_id });
            }
          }
        }
        for (const pid of ids) {
          await q.upsert({ user_id: session.user.id, product_id: pid });
        }
      } catch {
        /* server sync unavailable — client list still works */
      }
    };
    void sync();
  }, [session, ids, session?.user?.id]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const add = useCallback(
    (id: string) =>
      setIds((prev) => (prev.includes(id) ? prev : [...prev, id])),
    [setIds],
  );
  const remove = useCallback(
    (id: string) => setIds((prev) => prev.filter((x) => x !== id)),
    [setIds],
  );
  const toggle = useCallback(
    (id: string) =>
      setIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
      ),
    [setIds],
  );

  const value = useMemo<WishlistValue>(
    () => ({ ids, count: ids.length, has, add, remove, toggle }),
    [ids, has, add, remove, toggle],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used within <WishlistProvider>");
  return ctx;
}

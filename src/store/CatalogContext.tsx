import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { assertSupabase, supabaseConfigured } from "./supabaseClient";
import {
  productToInsert,
  productToUpdate,
  rowToProduct,
  type ProductRow,
} from "./supabaseTypes";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { initialProducts, type Product } from "../data/products";

type CatalogStatus = "loading" | "ready" | "error";

type CatalogContextValue = {
  products: Product[];
  status: CatalogStatus;
  error: string | null;
  // lookups still synchronously search the in-memory list
  productBySlug: (slug: string) => Product | undefined;
  productById: (id: string) => Product | undefined;
  related: (slug: string, limit?: number) => Product[];
  // mutations: these write to Supabase; local list updates on success + realtime
  createProduct: (data: Omit<Product, "id" | "createdAt">) => Promise<Product | null>;
  updateProduct: (id: string, patch: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);
const TABLE = "products";

// Fallback in-memory catalog when Supabase isn't configured yet
// (lets the storefront still render during setup / offline dev).
const FALLBACK_KEY = "avenu.catalog.v2";

// Supabase returns errors as plain objects ({ message, code, ... }) that are
// NOT instances of Error — String(err) yields "[object Object]" and we lose
// the actual message. Normalise anything thrown from a call path.
function errToMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return typeof e === "string" ? e : "[unknown error]";
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<CatalogStatus>(supabaseConfigured ? "loading" : "ready");
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useLocalStorage<Product[]>(
    FALLBACK_KEY,
    // Seed the fallback catalog with the website-as-a-service tiers so the
    // storefront has products to show before Supabase is configured.
    initialProducts,
  );
  const subStarted = useRef(false);

  const loadFromSupabase = useCallback(async () => {
    if (!supabaseConfigured) {
      setProducts(fallback);
      setStatus("ready");
      return;
    }
    try {
      const sb = assertSupabase();
      const { data, error: err } = await sb
        .from(TABLE)
        .select("*")
        .order("created_at", { ascending: false });
      if (err) throw new Error(err.message || `Supabase error ${err.code ?? ""}`.trim());
      setProducts((data as unknown as ProductRow[]).map(rowToProduct));
      setStatus("ready");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(errToMessage(e));
    }
  }, [fallback]);

  // Initial mount: load + subscribe to realtime
  useEffect(() => {
    void loadFromSupabase();
    if (!supabaseConfigured || subStarted.current) return;
    subStarted.current = true;
    try {
      const sb = assertSupabase();
      const channel = sb
        .channel("public:products")
        .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, (payload) => {
          const row = payload.new as ProductRow;
          if (!row) return;
          setProducts((prev) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as ProductRow)?.id;
              return prev.filter((p) => p.id !== oldId);
            }
            const next = rowToProduct(row);
            const idx = prev.findIndex((p) => p.id === next.id);
            if (idx === -1) return [next, ...prev];
            const copy = [...prev];
            copy[idx] = next;
            return copy;
          });
        })
        .subscribe();
      return () => {
        sb.removeChannel(channel);
        subStarted.current = false;
      };
    } catch {
      /* ignore subscription failures during setup */
    }
  }, [loadFromSupabase]);

  const productBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products],
  );
  const productById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );
  const related = useCallback(
    (slug: string, limit = 4) => {
      const current = products.find((p) => p.slug === slug);
      if (!current) return products.slice(0, limit);
      return products
        .filter((p) => p.slug !== slug && p.category === current.category)
        .concat(products.filter((p) => p.slug !== slug && p.category !== current.category))
        .slice(0, limit);
    },
    [products],
  );

  const createProduct = useCallback<CatalogContextValue["createProduct"]>(
    async (data) => {
      if (!supabaseConfigured) {
        // fallback local save (won't sync worldwide)
        const p: Product = {
          ...data,
          id: "local_" + Math.random().toString(36).slice(2, 10),
          createdAt: Date.now(),
        };
        setFallback((prev) => [p, ...prev]);
        setProducts((prev) => [p, ...prev]);
        return p;
      }
      try {
        const sb = assertSupabase();
        const insert = productToInsert(data);
        const { data: row, error: err } = await sb
          .from(TABLE)
          .insert(insert)
          .select("*")
          .single();
        if (err) throw new Error(err.message || `Supabase error ${err.code ?? ""}`.trim());
        const product = rowToProduct(row as unknown as ProductRow);
        // optimistic: pre-add so UI updates immediately (realtime will reconcile if needed)
        setProducts((prev) => [product, ...prev.filter((p) => p.id !== product.id)]);
        return product;
      } catch (e) {
        setError(errToMessage(e));
        return null;
      }
    },
    [setFallback],
  );

  const updateProduct = useCallback<CatalogContextValue["updateProduct"]>(
    async (id, patch) => {
      if (!supabaseConfigured) {
        setFallback((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        return true;
      }
      try {
        const sb = assertSupabase();
        const upd = productToUpdate(patch);
        const { error: err } = await sb.from(TABLE).update(upd).eq("id", id);
        if (err) throw new Error(err.message || `Supabase error ${err.code ?? ""}`.trim());
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
        return true;
      } catch (e) {
        setError(errToMessage(e));
        return false;
      }
    },
    [setFallback],
  );

  const deleteProduct = useCallback<CatalogContextValue["deleteProduct"]>(
    async (id) => {
      if (!supabaseConfigured) {
        setFallback((prev) => prev.filter((p) => p.id !== id));
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return true;
      }
      try {
        const sb = assertSupabase();
        const { error: err } = await sb.from(TABLE).delete().eq("id", id);
        if (err) throw new Error(err.message || `Supabase error ${err.code ?? ""}`.trim());
        setProducts((prev) => prev.filter((p) => p.id !== id));
        return true;
      } catch (e) {
        setError(errToMessage(e));
        return false;
      }
    },
    [setFallback],
  );

  const refresh = useCallback(async () => {
    await loadFromSupabase();
  }, [loadFromSupabase]);

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      status,
      error,
      productBySlug,
      productById,
      related,
      createProduct,
      updateProduct,
      deleteProduct,
      refresh,
    }),
    [products, status, error, productBySlug, productById, related, createProduct, updateProduct, deleteProduct, refresh],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within <CatalogProvider>");
  return ctx;
}

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
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  orderToInsert,
  rowToOrder,
  type Order,
  type OrderInsert,
  type OrderRow,
  type OrderStatus,
} from "../data/orders";

type OrdersContextValue = {
  orders: Order[];
  status: "loading" | "ready" | "error";
  error: string | null;
  byCode: (code: string) => Order | undefined;
  byId: (id: string) => Order | undefined;
  createOrder: (data: Omit<Order, "id" | "createdAt" | "updatedAt">) => Promise<Order | null>;
  updateStatus: (id: string, status: OrderStatus, notes?: string) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);
const TABLE = "orders";
const FALLBACK_KEY = "avenu.orders.v1";

// Supabase returns errors as plain objects ({ message, code, details, hint })
// that are NOT instances of Error — String(err) yields "[object Object]" and
// we lose the actual message. Normalise anything thrown from a call path.
function errToMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === "object" && "message" in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === "string" && m.trim()) return m;
  }
  return typeof e === "string" ? e : "[unknown error]";
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    supabaseConfigured ? "loading" : "ready",
  );
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useLocalStorage<Order[]>(FALLBACK_KEY, []);
  const subStarted = useRef(false);

  const loadFromSupabase = useCallback(async () => {
    if (!supabaseConfigured) {
      setOrders(fallback);
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
      setOrders((data as unknown as OrderRow[]).map(rowToOrder));
      setStatus("ready");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(errToMessage(e));
    }
  }, [fallback]);

  useEffect(() => {
    void loadFromSupabase();
    if (!supabaseConfigured || subStarted.current) return;
    subStarted.current = true;
    try {
      const sb = assertSupabase();
      const channel = sb
        .channel("public:orders")
        .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, (payload) => {
          const row = payload.new as OrderRow;
          if (!row) return;
          setOrders((prev) => {
            if (payload.eventType === "DELETE") {
              const oldId = (payload.old as OrderRow)?.id;
              return prev.filter((o) => o.id !== oldId);
            }
            const next = rowToOrder(row);
            const idx = prev.findIndex((o) => o.id === next.id);
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

  const createOrder = useCallback<OrdersContextValue["createOrder"]>(
    async (data) => {
      if (!supabaseConfigured) {
        const o: Order = {
          ...data,
          id: "local_" + Math.random().toString(36).slice(2, 10),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setFallback((prev) => [o, ...prev]);
        setOrders((prev) => [o, ...prev]);
        return o;
      }
      try {
        const sb = assertSupabase();
        const insert: OrderInsert = orderToInsert(data);
        const { data: row, error: err } = await sb
          .from(TABLE)
          .insert(insert)
          .select("*")
          .single();
        if (err) throw new Error(err.message || `Supabase error ${err.code ?? ""}`.trim());
        const order = rowToOrder(row as unknown as OrderRow);
        setOrders((prev) => [order, ...prev]);
        return order;
      } catch (e) {
        setError(errToMessage(e));
        return null;
      }
    },
    [setFallback],
  );

  const updateStatus = useCallback<OrdersContextValue["updateStatus"]>(
    async (id, newStatus, notes) => {
      if (!supabaseConfigured) {
        setFallback((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, status: newStatus, notes: notes ?? o.notes, updatedAt: Date.now() } : o,
          ),
        );
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, status: newStatus, notes: notes ?? o.notes, updatedAt: Date.now() } : o,
          ),
        );
        return true;
      }
      try {
        const sb = assertSupabase();
        const patch: Record<string, unknown> = {
          status: newStatus,
          updated_at: new Date().toISOString(),
        };
        if (notes !== undefined) patch.notes = notes;
        const { error: err } = await sb.from(TABLE).update(patch).eq("id", id);
        if (err) throw new Error(err.message || `Supabase error ${err.code ?? ""}`.trim());
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, status: newStatus, notes: notes ?? o.notes, updatedAt: Date.now() } : o,
          ),
        );
        return true;
      } catch (e) {
        setError(errToMessage(e));
        return false;
      }
    },
    [setFallback],
  );

  const deleteOrder = useCallback<OrdersContextValue["deleteOrder"]>(
    async (id) => {
      if (!supabaseConfigured) {
        setFallback((prev) => prev.filter((o) => o.id !== id));
        setOrders((prev) => prev.filter((o) => o.id !== id));
        return true;
      }
      try {
        const sb = assertSupabase();
        const { error: err } = await sb.from(TABLE).delete().eq("id", id);
        if (err) throw new Error(err.message || `Supabase error ${err.code ?? ""}`.trim());
        setOrders((prev) => prev.filter((o) => o.id !== id));
        return true;
      } catch (e) {
        setError(errToMessage(e));
        return false;
      }
    },
    [setFallback],
  );

  const byCode = useCallback((code: string) => orders.find((o) => o.code === code), [orders]);
  const byId = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);
  const refresh = useCallback(async () => { void loadFromSupabase(); }, [loadFromSupabase]);

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, status, error, byCode, byId, createOrder, updateStatus, deleteOrder, refresh }),
    [orders, status, error, byCode, byId, createOrder, updateStatus, deleteOrder, refresh],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within <OrdersProvider>");
  return ctx;
}

export function generateOrderCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "AVN-" + s;
}

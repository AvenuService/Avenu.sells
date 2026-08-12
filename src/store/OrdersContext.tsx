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
  refresh: () => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);
const TABLE = "orders";
const FALLBACK_KEY = "avenu.orders.v1";

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
      if (err) throw err;
      setOrders((data as unknown as OrderRow[]).map(rowToOrder));
      setStatus("ready");
      setError(null);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
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
        if (err) throw err;
        const order = rowToOrder(row as unknown as OrderRow);
        setOrders((prev) => [order, ...prev]);
        return order;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
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
        if (err) throw err;
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id ? { ...o, status: newStatus, notes: notes ?? o.notes, updatedAt: Date.now() } : o,
          ),
        );
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return false;
      }
    },
    [setFallback],
  );

  const byCode = useCallback((code: string) => orders.find((o) => o.code === code), [orders]);
  const byId = useCallback((id: string) => orders.find((o) => o.id === id), [orders]);
  const refresh = useCallback(async () => { void loadFromSupabase(); }, [loadFromSupabase]);

  const value = useMemo<OrdersContextValue>(
    () => ({ orders, status, error, byCode, byId, createOrder, updateStatus, refresh }),
    [orders, status, error, byCode, byId, createOrder, updateStatus, refresh],
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

// Avenu order model — mirrors the `orders` table in Supabase.
//
// Suggested SQL to run in Supabase SQL editor (one-time setup):
//
//   create table if not exists public.orders (
//     id uuid primary key default gen_random_uuid(),
//     code text not null unique,                   -- human-readable, e.g. AVN-AB12C
//     status text not null default 'new',          -- new | paid | fulfilled | cancelled
//     customer_email text,
//     customer_name text,
//     items jsonb not null,                        -- CartItem[] snapshot at checkout
//     brief jsonb,                                 -- project brief (services only) — { projectName, projectType, brief, deadline, budget }
//     subtotal numeric not null default 0,
//     shipping numeric not null default 0,
//     tax numeric not null default 0,
//     total numeric not null default 0,
//     currency text not null default 'USD',
//     notes text,
//     created_at timestamptz not null default now(),
//     updated_at timestamptz not null default now()
//   );
//   alter table public.orders enable row level security;
//   create policy "Orders readable by admins only" on public.orders
//     for select using true;  -- tighten to auth.uid() in role-aware admins
//   create policy "Orders writable by admins only" on public.orders
//     for update using true;

export type OrderStatus = "new" | "paid" | "fulfilled" | "cancelled";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  color?: string;
  type: "digital" | "physical" | "service";
};

export type OrderBrief = {
  projectName?: string;
  projectType?: string;
  brief?: string;
  deadline?: string;
  budget?: string;
};

export type Order = {
  id: string;
  code: string; // human-readable AVN-XXXXX
  status: OrderStatus;
  customerEmail?: string;
  customerName?: string;
  items: OrderItem[];
  brief?: OrderBrief | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
};

// Supabase row shape
export type OrderRow = {
  id: string;
  code: string;
  status: OrderStatus;
  customer_email: string | null;
  customer_name: string | null;
  items: OrderItem[];
  brief: OrderBrief | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    customerEmail: row.customer_email ?? undefined,
    customerName: row.customer_name ?? undefined,
    items: Array.isArray(row.items) ? row.items : [],
    brief: row.brief ?? null,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    tax: Number(row.tax),
    total: Number(row.total),
    currency: row.currency ?? "USD",
    notes: row.notes ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export type OrderInsert = {
  code: string;
  status: OrderStatus;
  customer_email: string | null;
  customer_name: string | null;
  items: OrderItem[];
  brief: OrderBrief | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
};

export function orderToInsert(o: Omit<Order, "id" | "createdAt" | "updatedAt">): OrderInsert {
  return {
    code: o.code,
    status: o.status,
    customer_email: o.customerEmail ?? null,
    customer_name: o.customerName ?? null,
    items: o.items,
    brief: o.brief ?? null,
    subtotal: o.subtotal,
    shipping: o.shipping,
    tax: o.tax,
    total: o.total,
    currency: o.currency,
    notes: o.notes ?? null,
  };
}

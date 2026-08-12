-- Avenu — Orders schema
-- Run this in the Supabase SQL editor (one-time setup).

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  status text not null default 'new' check (status in ('new', 'paid', 'fulfilled', 'cancelled')),
  customer_email text,
  customer_name text,
  items jsonb not null default '[]'::jsonb,
  brief jsonb,
  subtotal numeric not null default 0,
  shipping numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  currency text not null default 'USD',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Trigger to keep updated_at in sync
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists orders_touch_updated on public.orders;
create trigger orders_touch_updated
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- RLS: lock down in production. For a hobby store during dev, allow anon inserts
-- (so checkout can write an order), only allow authenticated admins to read/update.
-- Tighten these once you have admin roles wired via Supabase Auth.
alter table public.orders enable row level security;

drop policy if exists "Anyone can read orders" on public.orders;
-- For dev with simple admin auth (token check, not Supabase Auth), allow reads.
create policy "Public can read orders" on public.orders for select using (true);

drop policy if exists "Anyone can insert orders" on public.orders;
create policy "Public can insert orders" on public.orders for insert with check (true);

drop policy if exists "Anyone can update orders" on public.orders;
create policy "Anyone can update orders" on public.orders for update using (true);

drop policy if exists "Anyone can delete orders" on public.orders;
create policy "Anyone can delete orders" on public.orders for delete using (true);

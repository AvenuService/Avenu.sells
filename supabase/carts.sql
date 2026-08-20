-- Avenu — Carts schema
-- Run this in the Supabase SQL editor (one-time setup).

create table if not exists public.carts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Trigger to keep updated_at in sync
create or replace function public.touch_cart_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists carts_touch_updated on public.carts;
create trigger carts_touch_updated
  before update on public.carts
  for each row execute function public.touch_cart_updated_at();

-- RLS: Only allow users to view and manage their own cart
alter table public.carts enable row level security;

drop policy if exists "Users can read their own cart" on public.carts;
create policy "Users can read their own cart" on public.carts
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own cart" on public.carts;
create policy "Users can insert their own cart" on public.carts
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own cart" on public.carts;
create policy "Users can update their own cart" on public.carts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own cart" on public.carts;
create policy "Users can delete their own cart" on public.carts
  for delete using (auth.uid() = user_id);

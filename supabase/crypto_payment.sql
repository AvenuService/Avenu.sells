-- Avenu — Stretch for Litecoin payments
-- Run this in the Supabase SQL editor (one-time setup).
-- NOTE: these columns are optional; the frontend also tags crypto orders via
-- the `notes` column (JSON), so nothing breaks if you skip this.

alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_ref text;
alter table public.orders add column if not exists wallet_address text;
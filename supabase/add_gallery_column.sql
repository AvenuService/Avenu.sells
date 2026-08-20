-- ============================================================
-- Avenu — Add `gallery` column to products (jsonb array)
-- ============================================================
-- Run this once in your Supabase SQL Editor so the storefront's
-- product gallery can store multiple images per product.
-- Safe to run repeatedly (it only adds the column if missing).
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'gallery'
  ) THEN
    ALTER TABLE public.products ADD COLUMN gallery jsonb;
  END IF;
END $$;
-- ============================================================
-- Avenu — Seed website-as-a-service tiers
-- ============================================================
-- Run this against your Supabase project (SQL Editor) so the
-- live `products` table ships with the three website service tiers.
--
-- It also updates the `type` column CHECK constraint to allow
-- 'service' (the previous schema only allowed 'digital' | 'physical').
-- ============================================================

-- 1) Make sure the products table allows 'service' in the type column.
--    If a CHECK constraint named like this exists, drop + recreate it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_type_check' AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_type_check;
  END IF;
END $$;

-- 2) Insert the three website service tiers (idempotent by slug).
INSERT INTO public.products (
  id, slug, name, brand, category, type, price, old_price, discount, promotion,
  rating, reviews, tagline, description, features, colors, stock, featured,
  bestseller, image_banner, gradient, created_at
)
SELECT
  'seed_website_starter',  'website-starter',
  'Starter Website',        'Avenu Studio',
  'websites',               'service',        499,    NULL, NULL, NULL,
  5,                        0,
  'A polished one-page site to launch your presence.',
  'A hand-built, responsive one-page website designed to make you look essential from day one. Perfect for freelancers, small brands, and product launches.',
  '["1-page responsive frontend","Contact form wired up","Mobile-first design","Basic SEO meta tags","Deploy + handoff"]'::jsonb,
  '[{"name":"Midnight","hex":"#021024"}]'::jsonb,
  999, TRUE, FALSE,
  NULL, '["#1f4f8a","#0a3568"]'::jsonb,
  '2026-08-01T00:00:00Z'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'website-starter');

INSERT INTO public.products (
  id, slug, name, brand, category, type, price, old_price, discount, promotion,
  rating, reviews, tagline, description, features, colors, stock, featured,
  bestseller, image_banner, gradient, created_at
)
SELECT
  'seed_website_business', 'website-business',
  'Business Website',       'Avenu Studio',
  'websites',               'service',        1499,   NULL, NULL, NULL,
  5,                        0,
  'A multi-page site with a CMS, built to grow.',
  'Up to five pages with a content management system so you can publish updates yourself. Includes SEO foundations and newsletter capture.',
  '["Up to 5 pages","CMS / blogging built in","SEO basics + sitemap","Newsletter signup","Contact form","Deploy + 14 days support"]'::jsonb,
  '[{"name":"Midnight","hex":"#021024"}]'::jsonb,
  999, TRUE, FALSE,
  NULL, '["#0a3568","#021024"]'::jsonb,
  '2026-08-02T00:00:00Z'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'website-business');

INSERT INTO public.products (
  id, slug, name, brand, category, type, price, old_price, discount, promotion,
  rating, reviews, tagline, description, features, colors, stock, featured,
  bestseller, image_banner, gradient, created_at
)
SELECT
  'seed_website_premium', 'website-premium',
  'Premium Website',      'Avenu Studio',
  'websites',             'service',        3999,   NULL, NULL, NULL,
  5,                      0,
  'A fully custom build with backend, admin, and launch support.',
  'A bespoke website with a real backend — authentication, database, and an admin panel to manage your content. Designed, built, deployed, and supported for 30 days.',
  '["Custom design & build","Full backend (auth + database)","Admin panel included","Custom integrations","Deploy + 30 days support"]'::jsonb,
  '[{"name":"Midnight","hex":"#021024"}]'::jsonb,
  999, TRUE, FALSE,
  NULL, '["#3a6aa0","#052659"]'::jsonb,
  '2026-08-03T00:00:00Z'
WHERE NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'website-premium');

-- 3) Reset the CHECK constraint to allow digital | physical | service.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'products_type_check' AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products DROP CONSTRAINT products_type_check;
  END IF;
END $$;

ALTER TABLE public.products
  ADD CONSTRAINT products_type_check
  CHECK (type IN ('digital', 'physical', 'service'));
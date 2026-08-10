# Avenu — avenu.sale

A sleek, modern e-commerce storefront + admin panel built with **React + Vite + TypeScript + React Router**.

## Design

A cohesive deep-to-icy blue monochromatic palette:

| Token | Hex | Usage |
| --- | --- | --- |
| `--bg-primary` | `#021024` | App background, deep layout |
| `--bg-secondary` | `#052659` | Cards, panels, containers |
| `--accent-muted` | `#5483B3` | Borders, secondary text, inactive |
| `--accent-soft` | `#7DA0CA` | Hover highlights, badges |
| `--accent-ice` | `#C1E8FF` | Primary CTAs, active states, glow |

## Features

### Storefront
- Responsive navbar with live search (sources results from the live catalog) + cart drawer trigger
- Dynamic catalog with category / brand / price filters + multiple sort modes
- Product details page with quantity selector, color picker, related products
- Persistent cart via `localStorage` + React Context
- Multi-step checkout flow with delivery options
- Empty-catalog guidance when no products are published

### Admin panel
Visit `/admin` to access the admin system:

- **Two-step secure login** at `/admin/login`
  1. Verify admin username + password
  2. A complex code (`k8N3a-H7q2M-x9P1b-L4mZc`-style — letters + numbers, 20 chars) is dispatched to the configured Discord webhook, with an `embed` payload. Only the operator sees the code in their private Discord channel.
  3. Match the code to unlock the admin session (8-hour TTL, persisted in localStorage).
- **Dashboard** (`/admin`) with live stats (total / digital / physical / featured inventory value)
- **Products** (`/admin/products`) — sortable table with type pills, badges, instant search, filter chips, single-row delete + "wipe catalog" confirm dialogs
- **Product editor** (`/admin/products/new` and `/admin/products/:id`)
  - Choose **digital** (downloadable, no shipping) or **physical** (with inventory)
  - Live storefront preview card on the right as you type
  - **Custom URL slug** — picks `/product/<your-slug>` with live uniqueness validation
  - Banner image via file upload (stored as data URL, ≤4MB) **or** paste a remote URL
  - Price, old price (strikethrough), discount % (auto-calculated final price), promo name
  - Highlights / features list (add/remove rows)
  - Color options (color picker + name + hex)
  - Featured & bestseller toggles
  - Stock (locked to ∞ for digital), rating, reviews (for storefront display)
  - Category dropdown (Audio, Wearables, Computing, Apparel, Home, Software, Presets, Templates, eBooks)

## Catalog storage

Products live in `localStorage` under `avenu.catalog.v2`. Every storefront page reads from the live `CatalogProvider`, so any add/edit/delete in the admin panel instantly reflects on the storefront. Cart state is in `avenu.cart.v1`.

> Session is stored in `avenu.admin.session.v1` (8-hour expiry).
> A real production deploy should proxy the admin login through a serverless function so the username/password never ship in the bundle. See `src/store/AdminAuthContext.tsx`.

## Getting started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # typecheck + production build -> dist/
npm run preview  # preview the production build
npm run typecheck
```

## Admin credentials

- Username: `avenuadmin`
- Password: `fuckingavenu_ismailtuff`

The login webhook is configured (Discord channel). After entering correct credentials, a one-time code is posted there — paste it back into the admin login to unlock.

## Structure

```
src/
  components/        Navbar, Footer, CartDrawer, ProductCard, AdminGuard, ConfirmDialog, ...
  pages/              Home, Shop, ProductDetails, Cart, Checkout, OrderConfirmation, NotFound
  pages/admin/        AdminLogin, AdminLayout, AdminDashboard, AdminProducts, ProductEditor
  store/              CartContext (localStorage), CatalogContext (mutable, localStorage), AdminAuthContext
  data/               products.ts (types + helpers, starts empty)
  hooks/              useLocalStorage, useDebounce
  styles/             global.css, layout.css, pages.css, admin.css
```

## Deploy to Vercel

Vercel-ready. Push to GitHub and import — `vercel.json` rewrites SPA routes to `index.html`.

## Roadmap

- Move admin auth behind a serverless function (Vercel/Functions)
- Cloud catalog persistence (Supabase, PlanetScale, or Firestore)
- Order history + customer accounts
- Discount code validation at checkout

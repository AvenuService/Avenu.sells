export type ProductType = "digital" | "physical" | "service";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  type: ProductType;
  price: number;
  oldPrice?: number;
  discount?: number; // percentage to apply at cart
  promotion?: string; // promo note e.g. "WAVE03"
  rating: number;
  reviews: number;
  tagline: string;
  description: string;
  features: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  featured?: boolean;
  bestseller?: boolean;
  imageBanner?: string; // URL or data URL
  gallery?: string[]; // additional images shown in the product gallery
  gradient: [string, string];
  createdAt: number;
};

export const categories = [
  { slug: "all", name: "All", blurb: "Everything in the catalog" },
    { slug: "audio", name: "Audio", blurb: "Headphones & speakers tuned for life" },
  { slug: "computing", name: "Computing", blurb: "Precision machines for makers" },
  { slug: "apparel", name: "Apparel", blurb: "Minimal essentials for everyday" },
  { slug: "websites", name: "Websites", blurb: "Custom websites built for you" },
  { slug: "software", name: "Software", blurb: "Digital downloads & keys" },
  { slug: "presets", name: "Presets", blurb: "Color, audio & design presets" },
  { slug: "templates", name: "Templates", blurb: "Notion, Figma & web templates" },
  { slug: "ebooks", name: "eBooks", blurb: "Guides & downloadable reads" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

const PALETTE: [string, string][] = [
  ["#1f4f8a", "#0a3568"],
  ["#0a3568", "#021024"],
  ["#3a6aa0", "#052659"],
  ["#7DA0CA", "#5483B3"],
  ["#C1E8FF", "#5483B3"],
];

// The catalog starts empty — you populate it from the /admin dashboard.
// Products are persisted in localStorage by CatalogProvider (see src/store/CatalogContext.tsx).
//
// Website-as-a-service tiers are seeded by default so the storefront has
// something to sell out of the box. They also ship in the Supabase migration
// (supabase/seed_website_services.sql) for the live database.
//
// NOTE: PALETTE + pickGradient MUST be declared above initialProducts, because
// initialProducts calls pickGradient at module init. Putting them below produces
// a "Cannot access X before initialization" TDZ error in the minified bundle.
export function pickGradient(seed = "") {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[n % PALETTE.length];
}

const SEED_BASE = Date.UTC(2026, 7, 1); // Aug 1, 2026

export const initialProducts: Product[] = [
  {
    id: "seed_website_starter",
    slug: "website-starter",
    name: "Starter Website",
    brand: "Avenu Studio",
    category: "websites",
    type: "service",
    price: 499,
    rating: 5,
    reviews: 0,
    tagline: "A polished one-page site to launch your presence.",
    description:
      "A hand-built, responsive one-page website designed to make you look essential from day one. Perfect for freelancers, small brands, and product launches.",
    features: [
      "1-page responsive frontend",
      "Contact form wired up",
      "Mobile-first design",
      "Basic SEO meta tags",
      "Deploy + handoff",
    ],
    colors: [{ name: "Midnight", hex: "#021024" }],
    stock: 999,
    featured: true,
    bestseller: false,
    gradient: pickGradient("website-starter"),
    createdAt: SEED_BASE,
  },
  {
    id: "seed_website_business",
    slug: "website-business",
    name: "Business Website",
    brand: "Avenu Studio",
    category: "websites",
    type: "service",
    price: 1499,
    rating: 5,
    reviews: 0,
    tagline: "A multi-page site with a CMS, built to grow.",
    description:
      "Up to five pages with a content management system so you can publish updates yourself. Includes SEO foundations and newsletter capture.",
    features: [
      "Up to 5 pages",
      "CMS / blogging built in",
      "SEO basics + sitemap",
      "Newsletter signup",
      "Contact form",
      "Deploy + 14 days support",
    ],
    colors: [{ name: "Midnight", hex: "#021024" }],
    stock: 999,
    featured: true,
    bestseller: false,
    gradient: pickGradient("website-business"),
    createdAt: SEED_BASE + 86_400_000,
  },
  {
    id: "seed_website_premium",
    slug: "website-premium",
    name: "Premium Website",
    brand: "Avenu Studio",
    category: "websites",
    type: "service",
    price: 3999,
    rating: 5,
    reviews: 0,
    tagline: "A fully custom build with backend, admin, and launch support.",
    description:
      "A bespoke website with a real backend — authentication, database, and an admin panel to manage your content. Designed, built, deployed, and supported for 30 days.",
    features: [
      "Custom design & build",
      "Full backend (auth + database)",
      "Admin panel included",
      "Custom integrations",
      "Deploy + 30 days support",
    ],
    colors: [{ name: "Midnight", hex: "#021024" }],
    stock: 999,
    featured: true,
    bestseller: false,
    gradient: pickGradient("website-premium"),
    createdAt: SEED_BASE + 2 * 86_400_000,
  },
];

export function getProductBySlug(products: Product[], slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(products: Product[], id: string) {
  return products.find((p) => p.id === id);
}

export function getRelatedProducts(products: Product[], slug: string, limit = 4) {
  const current = getProductBySlug(products, slug);
  if (!current) return products.slice(0, limit);
  return products
    .filter((p) => p.slug !== slug && p.category === current.category)
    .concat(products.filter((p) => p.slug !== slug && p.category !== current.category))
    .slice(0, limit);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateId() {
  return "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing 0/I/O/1
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function generateComplexCode(blocks = 4, blockLen = 5) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  const parts: string[] = [];
  for (let b = 0; b < blocks; b++) {
    let s = "";
    for (let i = 0; i < blockLen; i++) s += chars[Math.floor(Math.random() * chars.length)];
    parts.push(s);
  }
  return parts.join("-");
}

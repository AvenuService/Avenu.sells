export type ProductType = "digital" | "physical";

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
  gradient: [string, string];
  createdAt: number;
};

export const categories = [
  { slug: "all", name: "All", blurb: "Everything in the catalog" },
  { slug: "audio", name: "Audio", blurb: "Headphones & speakers tuned for life" },
  { slug: "wearables", name: "Wearables", blurb: "Track every heartbeat, in style" },
  { slug: "computing", name: "Computing", blurb: "Precision machines for makers" },
  { slug: "apparel", name: "Apparel", blurb: "Minimal essentials for everyday" },
  { slug: "home", name: "Home", blurb: "Objects that elevate your space" },
  { slug: "software", name: "Software", blurb: "Digital downloads & keys" },
  { slug: "presets", name: "Presets", blurb: "Color, audio & design presets" },
  { slug: "templates", name: "Templates", blurb: "Notion, Figma & web templates" },
  { slug: "ebooks", name: "eBooks", blurb: "Guides & downloadable reads" },
] as const;

export type CategorySlug = (typeof categories)[number]["slug"];

// The catalog starts empty — you populate it from the /admin dashboard.
// Products are persisted in localStorage by CatalogProvider (see src/store/CatalogContext.tsx).
export const initialProducts: Product[] = [];

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

const PALETTE: [string, string][] = [
  ["#1f4f8a", "#0a3568"],
  ["#0a3568", "#021024"],
  ["#3a6aa0", "#052659"],
  ["#7DA0CA", "#5483B3"],
  ["#C1E8FF", "#5483B3"],
];
export function pickGradient(seed = "") {
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[n % PALETTE.length];
}

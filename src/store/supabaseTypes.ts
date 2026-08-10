import type { Product } from "../data/products";

// Supabase row shape (matches the products table schema from README)
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  type: "digital" | "physical" | "service";
  price: number;
  old_price: number | null;
  discount: number | null;
  promotion: string | null;
  rating: number;
  reviews: number;
  tagline: string | null;
  description: string | null;
  features: { name: string; hex: string }[] | string[]; // jsonb
  colors: { name: string; hex: string }[]; // jsonb
  stock: number;
  featured: boolean;
  bestseller: boolean;
  image_banner: string | null;
  gradient: [string, string]; // jsonb
  created_at: string;
};

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    type: row.type,
    price: Number(row.price),
    oldPrice: row.old_price != null ? Number(row.old_price) : undefined,
    discount: row.discount ?? undefined,
    promotion: row.promotion ?? undefined,
    rating: Number(row.rating),
    reviews: Number(row.reviews),
    tagline: row.tagline ?? "",
    description: row.description ?? "",
    features: Array.isArray(row.features) ? (row.features as unknown as string[]).filter(Boolean) : [],
    colors: Array.isArray(row.colors) ? (row.colors as { name: string; hex: string }[]) : [],
    stock: Number(row.stock),
    featured: !!row.featured,
    bestseller: !!row.bestseller,
    imageBanner: row.image_banner ?? undefined,
    gradient: (Array.isArray(row.gradient) ? (row.gradient as [string, string]) : ["#0a3568", "#021024"]),
    createdAt: new Date(row.created_at).getTime(),
  };
}

export type ProductInsert = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  type: "digital" | "physical" | "service";
  price: number;
  old_price: number | null;
  discount: number | null;
  promotion: string | null;
  rating: number;
  reviews: number;
  tagline: string | null;
  description: string | null;
  features: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  featured: boolean;
  bestseller: boolean;
  image_banner: string | null;
  gradient: [string, string];
};

export function productToInsert(p: Omit<Product, "id" | "createdAt">): ProductInsert {
  return {
    slug: p.slug,
    name: p.name,
    brand: p.brand,
    category: p.category,
    type: p.type,
    price: p.price,
    old_price: p.oldPrice ?? null,
    discount: p.discount ?? null,
    promotion: p.promotion ?? null,
    rating: p.rating,
    reviews: p.reviews,
    tagline: p.tagline ?? null,
    description: p.description ?? null,
    features: p.features,
    colors: p.colors,
    stock: p.stock,
    featured: !!p.featured,
    bestseller: !!p.bestseller,
    image_banner: p.imageBanner ?? null,
    gradient: p.gradient,
  };
}

export type ProductUpdate = Partial<ProductInsert>;

export function productToUpdate(patch: Partial<Product>): ProductUpdate {
  const out: ProductUpdate = {};
  if (patch.slug !== undefined) out.slug = patch.slug;
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.brand !== undefined) out.brand = patch.brand;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.type !== undefined) out.type = patch.type;
  if (patch.price !== undefined) out.price = patch.price;
  if (patch.oldPrice !== undefined) out.old_price = patch.oldPrice;
  if (patch.discount !== undefined) out.discount = patch.discount;
  if (patch.promotion !== undefined) out.promotion = patch.promotion;
  if (patch.rating !== undefined) out.rating = patch.rating;
  if (patch.reviews !== undefined) out.reviews = patch.reviews;
  if (patch.tagline !== undefined) out.tagline = patch.tagline;
  if (patch.description !== undefined) out.description = patch.description;
  if (patch.features !== undefined) out.features = patch.features;
  if (patch.colors !== undefined) out.colors = patch.colors;
  if (patch.stock !== undefined) out.stock = patch.stock;
  if (patch.featured !== undefined) out.featured = patch.featured;
  if (patch.bestseller !== undefined) out.bestseller = patch.bestseller;
  if (patch.imageBanner !== undefined) out.image_banner = patch.imageBanner;
  if (patch.gradient !== undefined) out.gradient = patch.gradient;
  return out;
}

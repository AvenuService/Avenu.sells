import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  initialProducts,
  generateId,
  slugify,
  type Product,
} from "../data/products";

type CatalogContextValue = {
  products: Product[];
  productBySlug: (slug: string) => Product | undefined;
  productById: (id: string) => Product | undefined;
  related: (slug: string, limit?: number) => Product[];
  createProduct: (data: Omit<Product, "id" | "createdAt">) => Product;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  clearAll: () => void;
  importProducts: (items: Product[]) => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);
const STORAGE_KEY = "avenu.catalog.v2";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useLocalStorage<Product[]>(STORAGE_KEY, initialProducts);

  const productBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products],
  );
  const productById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  );
  const related = useCallback(
    (slug: string, limit = 4) => {
      const current = products.find((p) => p.slug === slug);
      if (!current) return products.slice(0, limit);
      return products
        .filter((p) => p.slug !== slug && p.category === current.category)
        .concat(products.filter((p) => p.slug !== slug && p.category !== current.category))
        .slice(0, limit);
    },
    [products],
  );

  const createProduct = useCallback<CatalogContextValue["createProduct"]>(
    (data) => {
      const product: Product = {
        ...data,
        id: generateId(),
        slug: data.slug ? slugify(data.slug) : slugify(data.name),
        createdAt: Date.now(),
      };
      setProducts((prev) => [product, ...prev]);
      return product;
    },
    [setProducts],
  );

  const updateProduct = useCallback<CatalogContextValue["updateProduct"]>(
    (id, patch) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...patch, slug: patch.slug ? slugify(patch.slug) : p.slug }
            : p,
        ),
      );
    },
    [setProducts],
  );

  const deleteProduct = useCallback(
    (id: string) => setProducts((prev) => prev.filter((p) => p.id !== id)),
    [setProducts],
  );

  const clearAll = useCallback(() => setProducts([]), [setProducts]);
  const importProducts = useCallback(
    (items: Product[]) => setProducts(items),
    [setProducts],
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      products,
      productBySlug,
      productById,
      related,
      createProduct,
      updateProduct,
      deleteProduct,
      clearAll,
      importProducts,
    }),
    [products, productBySlug, productById, related, createProduct, updateProduct, deleteProduct, clearAll, importProducts],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within <CatalogProvider>");
  return ctx;
}

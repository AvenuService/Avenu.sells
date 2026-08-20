import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useCatalog } from "./CatalogContext";
import { useShopperAuth } from "./ShopperAuthContext";
import { assertSupabase, supabaseConfigured } from "./supabaseClient";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  color: string;
  quantity: number;
  imageSlug: string;
  imageBanner?: string;
  gradient: [string, string];
  type: "digital" | "physical" | "service";
};

export type Coupon = {
  code: string;
  percent: number;
  description: string;
};

export const VALID_COUPONS: Coupon[] = [
  { code: "AVENU10", percent: 10, description: "10% off your entire order" },
  { code: "WELCOME15", percent: 15, description: "15% off welcome discount" },
  { code: "LAUNCH20", percent: 20, description: "20% off launch special" },
  { code: "HALFOFF", percent: 50, description: "50% off VIP discount" },
];

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  coupon: Coupon | null;
  isOpen: boolean;
  lastAdded: CartItem | null;
  addItem: (productId: string, opts: { color?: string; quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  applyCoupon: (code: string) => { ok: boolean; error?: string; coupon?: Coupon };
  removeCoupon: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "avenu.cart.v1";
const SHIPPING = 12;
const TAX_RATE = 0.08;

function makeLineId(productId: string, color?: string) {
  return `${productId}::${color ?? "default"}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { productById } = useCatalog();
  const { session } = useShopperAuth();
  const [items, setItems] = useLocalStorage<CartItem[]>(STORAGE_KEY, []);
  const [coupon, setCoupon] = useLocalStorage<Coupon | null>("avenu.cart.coupon.v1", null);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const popupTimer = useRef<number | undefined>(undefined);
  const isInitialSync = useRef(true);

  const userId = session?.user?.id;

  // Sync with Supabase on initial login/mount
  useEffect(() => {
    if (!supabaseConfigured || !userId) {
      isInitialSync.current = false;
      return;
    }

    let isMounted = true;

    async function loadCartFromDB() {
      try {
        const sb = assertSupabase();
        const { data, error } = await sb
          .from("carts")
          .select("items")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.warn("[Avenu] Could not load cart from database:", error.message);
          return;
        }

        if (isMounted) {
          if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items as CartItem[]);
          } else if (items.length > 0) {
            // If DB cart is empty but local cart has items, push local cart to DB
            void sb.from("carts").upsert({
              user_id: userId,
              items: items,
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn("[Avenu] Cart sync error:", err);
      } finally {
        if (isMounted) {
          isInitialSync.current = false;
        }
      }
    }

    void loadCartFromDB();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  // Push updates to Supabase when items change (after initial sync)
  useEffect(() => {
    if (!supabaseConfigured || !userId || isInitialSync.current) return;

    const timer = setTimeout(() => {
      try {
        const sb = assertSupabase();
        void sb.from("carts").upsert({
          user_id: userId,
          items: items,
          updated_at: new Date().toISOString(),
        });
      } catch {
        /* ignore background sync errors */
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [items, userId]);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (productId, opts) => {
      const product = productById(productId);
      if (!product) return;
      const color = opts.color ?? product.colors[0]?.name ?? "default";
      const quantity = Math.max(1, opts.quantity ?? 1);
      const lineId = makeLineId(productId, color);

      setItems((prev) => {
        const existing = prev.find((i) => i.id === lineId);
        if (existing) {
          return prev.map((i) =>
            i.id === lineId
              ? { ...i, quantity: Math.min(i.quantity + quantity, 99) }
              : i,
          );
        }
        return [
          ...prev,
          {
            id: lineId,
            productId,
            name: product.name,
            price: product.price,
            color,
            quantity,
            imageSlug: product.slug,
            imageBanner: product.imageBanner,
            gradient: product.gradient,
            type: product.type,
          },
        ];
      });

      const snapshot: CartItem = {
        id: lineId,
        productId,
        name: product.name,
        price: product.price,
        color,
        quantity,
        imageSlug: product.slug,
        imageBanner: product.imageBanner,
        gradient: product.gradient,
        type: product.type,
      };
      setLastAdded(snapshot);
      setIsOpen(true);
      window.clearTimeout(popupTimer.current);
      popupTimer.current = window.setTimeout(() => setLastAdded(null), 2400);
    },
    [setItems, productById],
  );

  const removeItem = useCallback(
    (id: string) => setItems((prev) => prev.filter((i) => i.id !== id)),
    [setItems],
  );

  const updateQuantity = useCallback<CartContextValue["updateQuantity"]>(
    (id, quantity) => {
      const q = Math.round(quantity);
      if (q < 1) return removeItem(id);
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: Math.min(q, 99) } : i)),
      );
    },
    [setItems, removeItem],
  );

  const clear = useCallback(() => setItems([]), [setItems]);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((o) => !o), []);

  const applyCoupon = useCallback<CartContextValue["applyCoupon"]>(
    (code: string) => {
      const normalized = code.trim().toUpperCase();
      const found = VALID_COUPONS.find((c) => c.code === normalized);
      if (!found) {
        return { ok: false, error: "Invalid promo code" };
      }
      setCoupon(found);
      return { ok: true, coupon: found };
    },
    [setCoupon],
  );

  const removeCoupon = useCallback(() => {
    setCoupon(null);
  }, [setCoupon]);

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  );
  const discount = useMemo(() => {
    if (!coupon || subtotal === 0) return 0;
    return Math.round(subtotal * (coupon.percent / 100) * 100) / 100;
  }, [subtotal, coupon]);

  const hasPhysical = useMemo(() => items.some((i) => i.type === "physical"), [items]);
  const shipping = subtotal === 0 || !hasPhysical ? 0 : subtotal >= 150 ? 0 : SHIPPING;
  const tax = Math.round((subtotal - discount) * TAX_RATE * 100) / 100;
  const total = Math.max(0, subtotal - discount + shipping + tax);

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    shipping,
    tax,
    discount,
    total,
    coupon,
    isOpen,
    lastAdded,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    openCart,
    closeCart,
    toggleCart,
    applyCoupon,
    removeCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

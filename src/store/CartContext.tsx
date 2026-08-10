import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useCatalog } from "./CatalogContext";

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

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  isOpen: boolean;
  lastAdded: CartItem | null;
  addItem: (productId: string, opts: { color?: string; quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
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
  const [items, setItems] = useLocalStorage<CartItem[]>(STORAGE_KEY, []);
  const [isOpen, setIsOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const popupTimer = useRef<number | undefined>(undefined);

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

  const count = useMemo(() => items.reduce((n, i) => n + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + i.price * i.quantity, 0),
    [items],
  );
  const hasPhysical = useMemo(() => items.some((i) => i.type === "physical"), [items]);
  const shipping = subtotal === 0 || !hasPhysical ? 0 : subtotal >= 150 ? 0 : SHIPPING;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = subtotal + shipping + tax;

  const value: CartContextValue = {
    items,
    count,
    subtotal,
    shipping,
    tax,
    total,
    isOpen,
    lastAdded,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within <CartProvider>");
  return ctx;
}

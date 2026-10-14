import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { safeJsonParse } from "@/lib/safeJson";

export interface CartItem {
  id: number;        // local line id
  product_id: number;
  name: string;
  slug: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
  category_slug?: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: { id: number; name: string; slug: string; price: number; image?: string; category_slug?: string }, size: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | null>(null);
// Guest-only store: the cart lives in this browser's localStorage.
const CART_KEY = "tc_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems]   = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const count    = items.reduce((a, i) => a + i.quantity, 0);
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);

  // Load the saved cart once on mount. Persistence is handled explicitly
  // inside each mutation below (not via a reactive effect on `items`) - an
  // effect keyed on `items` would also fire on this initial load with the
  // stale pre-load value still in its closure, overwriting the saved data.
  useEffect(() => {
    setItems(safeJsonParse<CartItem[]>(CART_KEY, []));
  }, []);

  const persistCart = (nextItems: CartItem[]) => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(nextItems));
    } catch { /* storage unavailable (e.g. private browsing) — cart still works for this visit */ }
  };

  const addItem = useCallback(async (product: { id: number; name: string; slug: string; price: number; image?: string; category_slug?: string }, size: string, quantity = 1) => {
    setLoading(true);
    try {
      setItems((prev) => {
        const existing = prev.find((i) => i.product_id === product.id && i.size === size);
        const next = existing
          ? prev.map((i) =>
              i.product_id === product.id && i.size === size
                ? { ...i, quantity: i.quantity + quantity }
                : i
            )
          : [...prev, {
              id: Date.now(),
              product_id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              size,
              quantity,
              image: product.image || "",
              category_slug: product.category_slug,
            }];
        persistCart(next);
        return next;
      });
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (itemId: number, quantity: number) => {
    setItems((prev) => {
      const next = quantity < 1
        ? prev.filter((i) => i.id !== itemId)
        : prev.map((i) => (i.id === itemId ? { ...i, quantity } : i));
      persistCart(next);
      return next;
    });
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      persistCart(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    try { localStorage.removeItem(CART_KEY); } catch { /* ignore */ }
  }, []);

  return (
    <CartContext.Provider value={{
      items, count, subtotal, isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem, updateQuantity, removeItem, clearCart, loading,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};

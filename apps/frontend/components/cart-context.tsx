import type { Id } from "../../../backend/convex/_generated/dataModel";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type { SizeKey } from "@/lib/pricing";

export type CartLine = {
  lineKey: string;
  pizzaId: Id<"pizzas">;
  name: string;
  /** Food-only unit price (after size, extras, restaurant multiplier). */
  priceCents: number;
  deliveryFeeCents: number;
  quantity: number;
  sizeKey: SizeKey;
  sizeLabel: string;
  restaurantId: string;
  restaurantName: string;
  extraIngredientIds: Id<"ingredients">[];
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (
    line: Omit<CartLine, "quantity"> & { quantity?: number },
  ) => void;
  increment: (lineKey: string) => void;
  decrement: (lineKey: string) => void;
  removeLine: (lineKey: string) => void;
  clearCart: () => void;
  totalCents: number;
  itemCount: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback(
    (line: Omit<CartLine, "quantity"> & { quantity?: number }) => {
      const qty = Math.max(1, Math.floor(line.quantity ?? 1));
      setLines((prev) => {
        const i = prev.findIndex((l) => l.lineKey === line.lineKey);
        if (i >= 0) {
          const next = [...prev];
          next[i] = {
            ...next[i],
            quantity: next[i].quantity + qty,
          };
          return next;
        }
        return [...prev, { ...line, quantity: qty }];
      });
    },
    [],
  );

  const increment = useCallback((lineKey: string) => {
    setLines((prev) =>
      prev.map((l) =>
        l.lineKey === lineKey ? { ...l, quantity: l.quantity + 1 } : l,
      ),
    );
  }, []);

  const decrement = useCallback((lineKey: string) => {
    setLines((prev) =>
      prev
        .map((l) =>
          l.lineKey === lineKey ? { ...l, quantity: l.quantity - 1 } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }, []);

  const removeLine = useCallback((lineKey: string) => {
    setLines((prev) => prev.filter((l) => l.lineKey !== lineKey));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const { totalCents, itemCount } = useMemo(() => {
    const totalCents = lines.reduce(
      (s, l) => s + l.quantity * l.priceCents + l.deliveryFeeCents,
      0,
    );
    const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
    return { totalCents, itemCount };
  }, [lines]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      addItem,
      increment,
      decrement,
      removeLine,
      clearCart,
      totalCents,
      itemCount,
    }),
    [
      addItem,
      clearCart,
      decrement,
      increment,
      itemCount,
      lines,
      removeLine,
      totalCents,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

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

export type OrderDraftState = {
  pizzaId: Id<"pizzas">;
  pizzaName: string;
  basePriceCents: number;
  imageUrl: string | null;
  defaultIngredientIds: Id<"ingredients">[];
  sizeKey: SizeKey;
  quantity: number;
  selectedExtraIngredientIds: Id<"ingredients">[];
};

type Ctx = {
  draft: OrderDraftState | null;
  setDraft: (draft: OrderDraftState | null) => void;
  updateDraft: (partial: Partial<OrderDraftState>) => void;
};

const OrderDraftContext = createContext<Ctx | null>(null);

export function OrderDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OrderDraftState | null>(null);

  const updateDraft = useCallback((partial: Partial<OrderDraftState>) => {
    setDraft((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const value = useMemo(
    () => ({ draft, setDraft, updateDraft }),
    [draft, updateDraft],
  );

  return (
    <OrderDraftContext.Provider value={value}>
      {children}
    </OrderDraftContext.Provider>
  );
}

export function useOrderDraft() {
  const ctx = useContext(OrderDraftContext);
  if (!ctx) throw new Error("useOrderDraft must be used within OrderDraftProvider");
  return ctx;
}

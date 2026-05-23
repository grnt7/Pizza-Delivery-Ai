import type { Id } from "../../../backend/convex/_generated/dataModel";

export type CheckoutConvexCartLine = {
  pizzaId: Id<"pizzas">;
  name: string;
  quantity: number;
  foodUnitPriceCents: number;
  deliveryFeeCents: number;
  sizeKey: "small" | "medium" | "large";
  sizeLabel: string;
  restaurantIdSnapshot: string;
  restaurantNameSnapshot: string;
  extraIngredientIds: Id<"ingredients">[];
};

/** Serialized cart aligned with Convex `checkoutCartArgsValidator`. */
export type CheckoutConvexCartPayload = {
  notes?: string;
  deliveryAddress: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    phone: string;
  };
  lines: CheckoutConvexCartLine[];
};

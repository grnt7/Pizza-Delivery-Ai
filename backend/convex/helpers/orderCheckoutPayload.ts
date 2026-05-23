/**
 * Shared server-side checkout validation — same pricing rules as Stripe and manual flows.
 */

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import type { Infer } from "convex/values";
import { deliveryAddressSnapshotValidator } from "../schema";

import type { ConvexSizeKey } from "./pricingOrders";
import {
  baseWithSizeConvex,
  extrasSumCents,
  SIZE_MULTIPLIER,
} from "./pricingOrders";

export type DeliveryAddressSnapshot = Infer<
  typeof deliveryAddressSnapshotValidator
>;

/** Cart line matching `placeOrder` / Stripe action args. */
export type PlaceCartLineInput = {
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

export type CheckoutSnapshot = {
  deliveryAddress: DeliveryAddressSnapshot;
  notes?: string | undefined;
  lineItems: Doc<"orders">["lineItems"];
  subtotalFoodCents: number;
  subtotalDeliveryCents: number;
  totalCents: number;
};

function isConvexSizeKey(k: string): k is ConvexSizeKey {
  return k in SIZE_MULTIPLIER;
}

export function normalizeDeliverySnapshot(input: {
  line1: string;
  line2?: string | undefined;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
}): DeliveryAddressSnapshot {
  const line1 = input.line1.trim();
  const line2 = input.line2?.trim() || undefined;
  const city = input.city.trim();
  const region = input.region.trim();
  const postalCode = input.postalCode.trim();
  const phone = input.phone.trim();

  if (line1.length < 3) {
    throw new Error("Street address is required");
  }
  if (city.length < 2) {
    throw new Error("City is required");
  }
  if (region.length < 2) {
    throw new Error("State or province is required");
  }
  if (postalCode.length < 3) {
    throw new Error("ZIP or postal code is required");
  }
  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    throw new Error("Enter a phone number with at least 10 digits");
  }

  const out: DeliveryAddressSnapshot = {
    line1,
    city,
    region,
    postalCode,
    phone,
  };
  if (line2 !== undefined && line2.length > 0) {
    out.line2 = line2;
  }
  return out;
}

/**
 * Validates cart lines against DB and computes immutable line snapshots + totals.
 * Call from mutations and Stripe paths with a context that exposes `ctx.db`.
 */
export async function buildValidatedOrderSnapshot(
  ctx: Pick<QueryCtx, "db">,
  args: {
    notes?: string | undefined;
    deliveryAddress: {
      line1: string;
      line2?: string | undefined;
      city: string;
      region: string;
      postalCode: string;
      phone: string;
    };
    lines: PlaceCartLineInput[];
  },
): Promise<CheckoutSnapshot> {
  if (args.lines.length === 0) {
    throw new Error("Cart is empty");
  }

  const deliveryAddress = normalizeDeliverySnapshot(args.deliveryAddress);

  const storeRow = await ctx.db
    .query("storeSettings")
    .withIndex("by_singleton", (q) => q.eq("singletonKey", "main"))
    .unique();
  const multiplier = storeRow?.kitchenPriceMultiplier ?? 1;

  const lineSnapshots: Doc<"orders">["lineItems"] = [];
  let subtotalFood = 0;
  let subtotalDelivery = 0;

  for (const line of args.lines) {
    const qty = Math.floor(line.quantity);
    if (qty < 1) throw new Error("Invalid quantity");

    const pizza = await ctx.db.get(line.pizzaId);
    if (!pizza || !pizza.isAvailable) {
      throw new Error(`Pizza not available: ${line.name}`);
    }

    const sizeKey = line.sizeKey;
    if (!isConvexSizeKey(sizeKey)) throw new Error("Invalid size");

    const extrasById = new Map<string, Doc<"ingredients">>();

    for (const ingredientId of line.extraIngredientIds) {
      const ing = await ctx.db.get(ingredientId);
      if (!ing) throw new Error("Unknown topping");
      if (!ing.isActive || !ing.inStock) {
        throw new Error("Topping not available");
      }
      extrasById.set(ingredientId, ing);
    }

    const baseAdjusted = baseWithSizeConvex(pizza.basePriceCents, sizeKey);
    const extras = extrasSumCents(line.extraIngredientIds, extrasById);
    const expectedUnitRaw = (baseAdjusted + extras) * multiplier;
    const expectedUnit = Math.max(1, Math.round(expectedUnitRaw));

    if (Math.abs(expectedUnit - line.foodUnitPriceCents) > 2) {
      throw new Error("Price mismatch — refresh menu and retry");
    }

    const deliveryRounded = Math.max(0, Math.round(line.deliveryFeeCents));

    lineSnapshots.push({
      pizzaId: line.pizzaId,
      pizzaNameSnapshot: pizza.name,
      quantity: qty,
      unitFoodCents: expectedUnit,
      deliveryFeeCents: deliveryRounded,
      sizeKey,
      sizeLabel: line.sizeLabel,
      restaurantIdSnapshot: line.restaurantIdSnapshot,
      restaurantNameSnapshot: line.restaurantNameSnapshot,
      extraIngredientIds: line.extraIngredientIds,
    });

    subtotalFood += qty * expectedUnit;
    subtotalDelivery += deliveryRounded;
  }

  const totalCents = subtotalFood + subtotalDelivery;

  return {
    deliveryAddress,
    notes: args.notes?.trim() || undefined,
    lineItems: lineSnapshots,
    subtotalFoodCents: subtotalFood,
    subtotalDeliveryCents: subtotalDelivery,
    totalCents,
  };
}

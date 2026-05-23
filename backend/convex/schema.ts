import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const ORDER_STATUSES = [
  "received",
  "prep",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

/** Deliver-to snapshot stored on each order at checkout. */
export const deliveryAddressSnapshotValidator = v.object({
  line1: v.string(),
  line2: v.optional(v.string()),
  city: v.string(),
  region: v.string(),
  postalCode: v.string(),
  phone: v.string(),
});

/** Snapshot of one cart row at checkout time — immutable audit trail. */
export const orderLineItemValidator = v.object({
  pizzaId: v.id("pizzas"),
  pizzaNameSnapshot: v.string(),
  quantity: v.number(),
  /** Food-only unit cents (multiplier applied, after size + extras). */
  unitFoodCents: v.number(),
  /** Delivery fee billed once per line (see cart model). */
  deliveryFeeCents: v.number(),
  sizeKey: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
  sizeLabel: v.string(),
  restaurantIdSnapshot: v.string(),
  restaurantNameSnapshot: v.string(),
  extraIngredientIds: v.array(v.id("ingredients")),
});

/**
 * Pinnochio's Pizza catalog + ops.
 */
export default defineSchema({
  /** Singleton row keyed by singletonKey ("main"). Single-store MVP. */
  storeSettings: defineTable({
    singletonKey: v.literal("main"),
    storeDisplayName: v.string(),
    deliveryFeeCents: v.number(),
    /** Applies to computed food unit after size/extras before cart line price check. */
    kitchenPriceMultiplier: v.number(),
    updatedAt: v.number(),
  }).index("by_singleton", ["singletonKey"]),

  users: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("customer"), v.literal("admin")),
    email: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  ingredients: defineTable({
    name: v.string(),
    slug: v.string(),
    inStock: v.boolean(),
    isActive: v.boolean(),
    additionalPriceCents: v.optional(v.number()),
    seedTag: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  pizzas: defineTable({
    name: v.string(),
    description: v.string(),
    slug: v.string(),
    category: v.string(),
    crustType: v.optional(v.string()),
    basePriceCents: v.number(),
    defaultIngredientIds: v.array(v.id("ingredients")),
    imageId: v.optional(v.id("_storage")),
    imageCredit: v.optional(v.string()),
    isAvailable: v.boolean(),
    seedTag: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_available", ["isAvailable"])
    .index("by_category", ["category"]),

  orders: defineTable({
    userId: v.string(),
    status: v.union(
      v.literal("received"),
      v.literal("prep"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
    notes: v.optional(v.string()),
    /** Set on orders placed after address-at-checkout; older rows omit this field. */
    deliveryAddress: v.optional(deliveryAddressSnapshotValidator),
    lineItems: v.array(orderLineItemValidator),
    subtotalFoodCents: v.number(),
    subtotalDeliveryCents: v.number(),
    totalCents: v.number(),
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
    paymentStatus: v.optional(
      v.union(v.literal("paid"), v.literal("manual")),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_stripe_checkout_session", ["stripeCheckoutSessionId"]),

  /**
   * Holds a server-validated order snapshot between Checkout Session creation and
   * Stripe's `checkout.session.completed` webhook (web flow).
   */
  stripePendingCheckouts: defineTable({
    checkoutSessionId: v.string(),
    userId: v.string(),
    notes: v.optional(v.string()),
    deliveryAddress: deliveryAddressSnapshotValidator,
    lineItems: v.array(orderLineItemValidator),
    subtotalFoodCents: v.number(),
    subtotalDeliveryCents: v.number(),
    totalCents: v.number(),
    createdAt: v.number(),
  }).index("by_checkout_session", ["checkoutSessionId"]),
});

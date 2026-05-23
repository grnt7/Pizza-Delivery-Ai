import type { Id } from "./_generated/dataModel";
import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

import { upsertCustomerUser } from "./helpers/authHelpers";
import {
  buildValidatedOrderSnapshot,
  type CheckoutSnapshot,
} from "./helpers/orderCheckoutPayload";
import { deliveryAddressSnapshotValidator } from "./schema";

/** Mirrors public `orders.placeOrder` cart line shape. */
export const placeCartLineValidator = v.object({
  pizzaId: v.id("pizzas"),
  name: v.string(),
  quantity: v.number(),
  foodUnitPriceCents: v.number(),
  deliveryFeeCents: v.number(),
  sizeKey: v.union(v.literal("small"), v.literal("medium"), v.literal("large")),
  sizeLabel: v.string(),
  restaurantIdSnapshot: v.string(),
  restaurantNameSnapshot: v.string(),
  extraIngredientIds: v.array(v.id("ingredients")),
});

export const checkoutCartArgsValidator = v.object({
  notes: v.optional(v.string()),
  deliveryAddress: deliveryAddressSnapshotValidator,
  lines: v.array(placeCartLineValidator),
});

/**
 * Validates auth + builds snapshot (no DB writes).
 * Used by Convex actions — carries the caller JWT.
 */
export const computeCheckoutSnapshot = internalQuery({
  args: checkoutCartArgsValidator,
  handler: async (ctx, args): Promise<CheckoutSnapshot & { userId: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Not authenticated");
    }
    const snapshot = await buildValidatedOrderSnapshot(ctx, args);
    return {
      ...snapshot,
      userId: identity.subject,
    };
  },
});

function snapshotToPendingDoc(
  checkoutSessionId: string,
  userId: string,
  snap: CheckoutSnapshot,
  createdAt: number,
): {
  checkoutSessionId: string;
  userId: string;
  notes?: string;
  deliveryAddress: CheckoutSnapshot["deliveryAddress"];
  lineItems: CheckoutSnapshot["lineItems"];
  subtotalFoodCents: number;
  subtotalDeliveryCents: number;
  totalCents: number;
  createdAt: number;
} {
  return {
    checkoutSessionId,
    userId,
    notes: snap.notes,
    deliveryAddress: snap.deliveryAddress,
    lineItems: snap.lineItems,
    subtotalFoodCents: snap.subtotalFoodCents,
    subtotalDeliveryCents: snap.subtotalDeliveryCents,
    totalCents: snap.totalCents,
    createdAt,
  };
}

/** After Stripe Checkout Session creation — store webhook payload reconstruction. */
export const persistStripePendingCheckout = internalMutation({
  args: v.object({
    checkoutSessionId: v.string(),
    userId: v.string(),
    snapshot: checkoutCartArgsValidator,
  }),
  handler: async (ctx, args) => {
    const snap = await buildValidatedOrderSnapshot(ctx, args.snapshot);
    const createdAt = Date.now();
    const doc = snapshotToPendingDoc(
      args.checkoutSessionId,
      args.userId,
      snap,
      createdAt,
    );

    const existing = await ctx.db
      .query("stripePendingCheckouts")
      .withIndex("by_checkout_session", (q) =>
        q.eq("checkoutSessionId", args.checkoutSessionId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return;
    }

    await ctx.db.insert("stripePendingCheckouts", doc);
  },
});

/**
 * Shared insert for Stripe-paid orders (+ idempotent by Stripe ids).
 */
export const insertValidatedPaidOrder = internalMutation({
  args: v.object({
    userId: v.string(),
    snapshot: checkoutCartArgsValidator,
    stripePaymentIntentId: v.optional(v.string()),
    stripeCheckoutSessionId: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<Id<"orders">> => {
    await upsertCustomerUser(ctx, {
      clerkId: args.userId,
    });

    const snap = await buildValidatedOrderSnapshot(ctx, args.snapshot);

    if (args.stripePaymentIntentId) {
      const existingPi = await ctx.db
        .query("orders")
        .withIndex("by_stripe_payment_intent", (q) =>
          q.eq("stripePaymentIntentId", args.stripePaymentIntentId!),
        )
        .first();
      if (existingPi) {
        return existingPi._id;
      }
    }

    if (args.stripeCheckoutSessionId) {
      const existingCs = await ctx.db
        .query("orders")
        .withIndex("by_stripe_checkout_session", (q) =>
          q.eq("stripeCheckoutSessionId", args.stripeCheckoutSessionId!),
        )
        .first();
      if (existingCs) {
        return existingCs._id;
      }
    }

    const now = Date.now();
    return await ctx.db.insert("orders", {
      userId: args.userId,
      status: "received",
      notes: snap.notes,
      deliveryAddress: snap.deliveryAddress,
      lineItems: snap.lineItems,
      subtotalFoodCents: snap.subtotalFoodCents,
      subtotalDeliveryCents: snap.subtotalDeliveryCents,
      totalCents: snap.totalCents,
      paymentStatus: "paid",
      stripePaymentIntentId: args.stripePaymentIntentId,
      stripeCheckoutSessionId: args.stripeCheckoutSessionId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/** Webhook: complete Checkout Session payment and remove pending row. */
export const finalizeStripeCheckoutFromWebhook = internalMutation({
  args: v.object({
    checkoutSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    paidAmountTotal: v.optional(v.number()),
    clientReferenceId: v.optional(v.string()),
    metadataClerkUserId: v.optional(v.string()),
    metadataTotalCents: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ orderId: Id<"orders"> | null }> => {
    const existing = await ctx.db
      .query("orders")
      .withIndex("by_stripe_checkout_session", (q) =>
        q.eq("stripeCheckoutSessionId", args.checkoutSessionId),
      )
      .first();

    const pending = await ctx.db
      .query("stripePendingCheckouts")
      .withIndex("by_checkout_session", (q) =>
        q.eq("checkoutSessionId", args.checkoutSessionId),
      )
      .unique();

    if (existing) {
      if (pending) {
        await ctx.db.delete(pending._id);
      }
      return { orderId: existing._id };
    }

    if (!pending) {
      return { orderId: null };
    }

    if (pending.totalCents < 50) {
      throw new Error("Invalid order total");
    }

    if (
      typeof args.paidAmountTotal === "number" &&
      args.paidAmountTotal !== pending.totalCents
    ) {
      throw new Error("Stripe amount does not match server snapshot");
    }

    if (
      typeof args.clientReferenceId === "string" &&
      args.clientReferenceId.trim() !== "" &&
      args.clientReferenceId !== pending.userId
    ) {
      throw new Error("Checkout session identity mismatch");
    }

    if (
      typeof args.metadataClerkUserId === "string" &&
      args.metadataClerkUserId.trim() !== "" &&
      args.metadataClerkUserId !== pending.userId
    ) {
      throw new Error("Stripe Checkout metadata clerk id mismatch");
    }

    if (
      typeof args.metadataTotalCents === "string" &&
      args.metadataTotalCents.trim() !== ""
    ) {
      const parsed = Number.parseInt(args.metadataTotalCents, 10);
      if (!Number.isNaN(parsed) && parsed !== pending.totalCents) {
        throw new Error("Stripe Checkout metadata total mismatch");
      }
    }

    await upsertCustomerUser(ctx, { clerkId: pending.userId });

    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId: pending.userId,
      status: "received",
      notes: pending.notes,
      deliveryAddress: pending.deliveryAddress,
      lineItems: pending.lineItems,
      subtotalFoodCents: pending.subtotalFoodCents,
      subtotalDeliveryCents: pending.subtotalDeliveryCents,
      totalCents: pending.totalCents,
      paymentStatus: "paid",
      stripeCheckoutSessionId: args.checkoutSessionId,
      stripePaymentIntentId: args.stripePaymentIntentId,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.delete(pending._id);
    return { orderId };
  },
});

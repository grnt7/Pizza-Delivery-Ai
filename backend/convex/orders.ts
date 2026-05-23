import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

import {
  getCurrentUserSubject,
  requireAdmin,
  upsertCustomerUser,
} from "./helpers/authHelpers";
import { buildValidatedOrderSnapshot } from "./helpers/orderCheckoutPayload";
import { deliveryAddressSnapshotValidator } from "./schema";
import { placeCartLineValidator } from "./stripeInternal";

export const placeOrder = mutation({
  args: {
    notes: v.optional(v.string()),
    deliveryAddress: deliveryAddressSnapshotValidator,
    lines: v.array(placeCartLineValidator),
  },
  handler: async (ctx, args) => {
    if (process.env.ALLOW_UNPAID_ORDERS === "false") {
      throw new Error(
        "Unpaid checkout is disabled. Pay with card at checkout instead.",
      );
    }

    if (args.lines.length === 0) {
      throw new Error("Cart is empty");
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Not authenticated");
    }

    const email =
      typeof identity.email === "string" ? identity.email : undefined;

    await upsertCustomerUser(ctx, {
      clerkId: identity.subject,
      email,
    });

    const snapshot = await buildValidatedOrderSnapshot(ctx, args);

    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId: identity.subject,
      status: "received",
      notes: snapshot.notes,
      deliveryAddress: snapshot.deliveryAddress,
      lineItems: snapshot.lineItems,
      subtotalFoodCents: snapshot.subtotalFoodCents,
      subtotalDeliveryCents: snapshot.subtotalDeliveryCents,
      totalCents: snapshot.totalCents,
      paymentStatus: "manual",
      createdAt: now,
      updatedAt: now,
    });

    return { orderId, totalCents: snapshot.totalCents };
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const subject = await getCurrentUserSubject(ctx);
    const list = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", subject))
      .collect();
    list.sort((a, b) => b.createdAt - a.createdAt);
    return list;
  },
});

export const getMineById = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const subject = await getCurrentUserSubject(ctx);
    const order = await ctx.db.get(args.orderId);
    if (!order || order.userId !== subject) return null;
    return order;
  },
});

export const getMineByStripeCheckoutSessionId = query({
  args: { checkoutSessionId: v.string() },
  handler: async (ctx, args) => {
    const subject = await getCurrentUserSubject(ctx);
    const order = await ctx.db
      .query("orders")
      .withIndex("by_stripe_checkout_session", (q) =>
        q.eq("stripeCheckoutSessionId", args.checkoutSessionId),
      )
      .first();
    if (!order || order.userId !== subject) return null;
    return order;
  },
});

export const adminList = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("received"),
        v.literal("prep"),
        v.literal("out_for_delivery"),
        v.literal("delivered"),
        v.literal("cancelled"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cap = Math.min(200, Math.max(10, args.limit ?? 100));

    if (args.status !== undefined) {
      const rows = await ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .collect();
      rows.sort((a, b) => b.createdAt - a.createdAt);
      return rows.slice(0, cap);
    }

    const rows = await ctx.db.query("orders").collect();
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows.slice(0, cap);
  },
});

export const adminUpdateStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("received"),
      v.literal("prep"),
      v.literal("out_for_delivery"),
      v.literal("delivered"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.orderId);
    if (!existing) throw new Error("Order not found");

    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: Date.now(),
    });
    return args.orderId;
  },
});

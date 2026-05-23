import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./helpers/authHelpers";

const DEFAULT_FALLBACK = {
  storeDisplayName: "Pinnochio's Pizza",
  deliveryFeeCents: 0,
  kitchenPriceMultiplier: 1,
} as const;

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("storeSettings")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "main"))
      .unique();
    if (!row) {
      return {
        singletonKey: "main" as const,
        ...DEFAULT_FALLBACK,
      };
    }
    return row;
  },
});

export const adminUpsertMain = mutation({
  args: {
    storeDisplayName: v.string(),
    deliveryFeeCents: v.number(),
    kitchenPriceMultiplier: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const existing = await ctx.db
      .query("storeSettings")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "main"))
      .unique();
    const payload = {
      singletonKey: "main" as const,
      storeDisplayName: args.storeDisplayName,
      deliveryFeeCents: Math.max(0, Math.round(args.deliveryFeeCents)),
      kitchenPriceMultiplier: Math.max(0.5, Math.min(5, args.kitchenPriceMultiplier)),
      updatedAt: now,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }
    return await ctx.db.insert("storeSettings", payload);
  },
});

export const bootstrapMainIfNeeded = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("storeSettings")
      .withIndex("by_singleton", (q) => q.eq("singletonKey", "main"))
      .unique();
    if (existing) return { created: false, id: existing._id };

    const id = await ctx.db.insert("storeSettings", {
      singletonKey: "main",
      storeDisplayName: "Pinnochio's Pizza",
      deliveryFeeCents: 299,
      kitchenPriceMultiplier: 1,
      updatedAt: Date.now(),
    });
    return { created: true, id };
  },
});

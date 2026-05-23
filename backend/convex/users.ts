import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const syncFromClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        email: args.email ?? existing.email,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      role: args.role,
      email: args.email,
      updatedAt: now,
    });
  },
});

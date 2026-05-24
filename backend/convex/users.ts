import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { identityIndicatesClerkPublicAdmin } from "./helpers/authHelpers";

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

/**
 * One-shot bootstrap: persists `role: admin` from Clerk JWT claims when the Convex JWT
 * includes `role` or `public_metadata.role` but the `users` row is stale (e.g. no webhook yet).
 */
export const syncRoleFromJwt = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Not authenticated");
    }
    if (!identityIndicatesClerkPublicAdmin(identity)) return;

    const now = Date.now();
    const email =
      typeof identity.email === "string" ? identity.email : undefined;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) =>
        q.eq("clerkId", identity.subject),
      )
      .unique();

    if (existing) {
      if (existing.role === "admin") return;
      await ctx.db.patch(existing._id, {
        role: "admin",
        email: email ?? existing.email,
        updatedAt: now,
      });
      return;
    }

    await ctx.db.insert("users", {
      clerkId: identity.subject,
      role: "admin",
      email,
      updatedAt: now,
    });
  },
});

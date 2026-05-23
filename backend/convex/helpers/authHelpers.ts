import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getCurrentUserSubject(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

export async function requireAdmin(ctx: MutationCtx | QueryCtx): Promise<void> {
  const subject = await getCurrentUserSubject(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", subject))
    .unique();

  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
}

export async function upsertCustomerUser(
  ctx: MutationCtx,
  params: {
    clerkId: string;
    email?: string;
  },
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", params.clerkId))
    .unique();

  const now = Date.now();
  const roleDefault = existing?.role ?? ("customer" as const);

  if (existing) {
    await ctx.db.patch(existing._id, {
      email: params.email ?? existing.email,
      updatedAt: now,
    });
    return existing._id;
  }

  return await ctx.db.insert("users", {
    clerkId: params.clerkId,
    role: roleDefault,
    email: params.email,
    updatedAt: now,
  });
}

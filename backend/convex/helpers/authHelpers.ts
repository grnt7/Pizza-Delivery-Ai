import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { UserIdentity } from "convex/server";

/**
 * True when the Clerk-issued Convex JWT carries an admin hint (JWT template claims),
 * aligning with Clerk `publicMetadata.role === "admin"` used by Next admin UI.
 *
 * Prefer adding to the Clerk JWT template **`convex`** claim:
 * `"role": "{{user.public_metadata.role}}"` (or include `{{user.public_metadata}}` as an object claim).
 */
export function identityIndicatesClerkPublicAdmin(
  identity: UserIdentity | null | undefined,
): boolean {
  if (!identity) return false;
  const topRole = identity.role;
  if (topRole === "admin") return true;

  const rec = identity as Record<string, unknown>;
  const pmRaw = rec.public_metadata ?? rec.publicMetadata;
  if (
    typeof pmRaw === "object" &&
    pmRaw !== null &&
    !Array.isArray(pmRaw)
  ) {
    const r = (pmRaw as Record<string, unknown>).role;
    return r === "admin";
  }

  return false;
}

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
  const identity = await ctx.auth.getUserIdentity();
  if (!identity?.subject) {
    throw new Error("Admin access required");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (user?.role === "admin") return;
  if (identityIndicatesClerkPublicAdmin(identity)) return;

  throw new Error("Admin access required");
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

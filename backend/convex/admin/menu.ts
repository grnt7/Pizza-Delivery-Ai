import { mutation, query, type QueryCtx } from "../_generated/server";
import { v } from "convex/values";

import type { Doc } from "../_generated/dataModel";
import { requireAdmin } from "../helpers/authHelpers";

async function pizzaWithImageUrl(ctx: QueryCtx, pizza: Doc<"pizzas">) {
  const imageUrl =
    pizza.imageId !== undefined ? await ctx.storage.getUrl(pizza.imageId) : null;
  return { ...pizza, imageUrl };
}

export const adminListPizzas = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("pizzas").collect();
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return await Promise.all(rows.map((p) => pizzaWithImageUrl(ctx, p)));
  },
});

export const adminListIngredientsAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("ingredients").collect();
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  },
});

export const generatePizzaImageUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const insertPizza = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const basePriceCents = Math.max(1, Math.round(args.basePriceCents));
    return await ctx.db.insert("pizzas", {
      name: args.name.trim(),
      description: args.description.trim(),
      slug: args.slug.trim().toLowerCase(),
      category: args.category.trim(),
      crustType: args.crustType,
      basePriceCents,
      defaultIngredientIds: args.defaultIngredientIds,
      imageId: args.imageId,
      imageCredit: args.imageCredit,
      isAvailable: args.isAvailable,
    });
  },
});

export const patchPizza = mutation({
  args: {
    id: v.id("pizzas"),
    patch: v.object({
      name: v.optional(v.string()),
      description: v.optional(v.string()),
      slug: v.optional(v.string()),
      category: v.optional(v.string()),
      crustType: v.optional(v.union(v.string(), v.null())),
      basePriceCents: v.optional(v.number()),
      defaultIngredientIds: v.optional(v.array(v.id("ingredients"))),
      imageId: v.optional(v.union(v.id("_storage"), v.null())),
      imageCredit: v.optional(v.union(v.string(), v.null())),
      isAvailable: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Pizza not found");

    const { patch } = args;
    const next: Record<string, unknown> = {};
    if (patch.name !== undefined) next.name = patch.name.trim();
    if (patch.description !== undefined) next.description = patch.description.trim();
    if (patch.slug !== undefined)
      next.slug = patch.slug.trim().toLowerCase();
    if (patch.category !== undefined) next.category = patch.category.trim();
    if (patch.crustType === null) next.crustType = undefined;
    else if (patch.crustType !== undefined) next.crustType = patch.crustType;
    if (patch.basePriceCents !== undefined) {
      next.basePriceCents = Math.max(1, Math.round(patch.basePriceCents));
    }
    if (patch.defaultIngredientIds !== undefined) {
      next.defaultIngredientIds = patch.defaultIngredientIds;
    }
    if (patch.imageId === null) next.imageId = undefined;
    else if (patch.imageId !== undefined) next.imageId = patch.imageId;
    if (patch.imageCredit === null) next.imageCredit = undefined;
    else if (patch.imageCredit !== undefined)
      next.imageCredit = patch.imageCredit;
    if (patch.isAvailable !== undefined) next.isAvailable = patch.isAvailable;

    await ctx.db.patch(args.id, next as Partial<typeof row>);
    return args.id;
  },
});

export const insertIngredient = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    inStock: v.boolean(),
    isActive: v.boolean(),
    additionalPriceCents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("ingredients", {
      name: args.name.trim(),
      slug: args.slug.trim().toLowerCase(),
      inStock: args.inStock,
      isActive: args.isActive,
      additionalPriceCents:
        args.additionalPriceCents === undefined
          ? undefined
          : Math.round(args.additionalPriceCents),
    });
  },
});

export const patchIngredient = mutation({
  args: {
    id: v.id("ingredients"),
    patch: v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      inStock: v.optional(v.boolean()),
      isActive: v.optional(v.boolean()),
      additionalPriceCents: v.optional(v.union(v.number(), v.null())),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.id);
    if (!row) throw new Error("Ingredient not found");

    const { patch } = args;
    const next: Partial<typeof row> = {};
    if (patch.name !== undefined) next.name = patch.name.trim();
    if (patch.slug !== undefined) next.slug = patch.slug.trim().toLowerCase();
    if (patch.inStock !== undefined) next.inStock = patch.inStock;
    if (patch.isActive !== undefined) next.isActive = patch.isActive;
    if (patch.additionalPriceCents === null) {
      next.additionalPriceCents = undefined;
    } else if (patch.additionalPriceCents !== undefined) {
      next.additionalPriceCents = Math.round(patch.additionalPriceCents);
    }
    await ctx.db.patch(args.id, next);
    return args.id;
  },
});

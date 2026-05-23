import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

async function pizzaWithImageUrl(ctx: QueryCtx, pizza: Doc<"pizzas">) {
  const imageUrl =
    pizza.imageId !== undefined ? await ctx.storage.getUrl(pizza.imageId) : null;
  return { ...pizza, imageUrl };
}

const DEMO_PIZZAS: Array<{
  name: string;
  description: string;
  slug: string;
  category: string;
  crustType: string;
  basePriceCents: number;
  defaultIngredientIds: [];
}> = [
  {
    name: "Classic Margherita",
    description: "Tomato sauce, mozzarella, fresh basil.",
    slug: "demo-margherita",
    category: "Classic",
    crustType: "hand-tossed",
    basePriceCents: 1299,
    defaultIngredientIds: [],
  },
  {
    name: "Pinnochio Special",
    description: "Pepperoni, mushrooms, green peppers.",
    slug: "demo-pinnochio-special",
    category: "Specialty",
    crustType: "hand-tossed",
    basePriceCents: 1699,
    defaultIngredientIds: [],
  },
  {
    name: "Veggie Delight",
    description: "Red onion, olives, roasted peppers.",
    slug: "demo-veggie-delight",
    category: "Vegetarian",
    crustType: "hand-tossed",
    basePriceCents: 1499,
    defaultIngredientIds: [],
  },
];

export const listPizzas = query({
  args: {},
  handler: async (ctx) => {
    const pizzas = await ctx.db
      .query("pizzas")
      .withIndex("by_available", (q) => q.eq("isAvailable", true))
      .collect();
    return await Promise.all(
      pizzas.map((pizza) => pizzaWithImageUrl(ctx, pizza)),
    );
  },
});

export const getPizzaById = query({
  args: { id: v.id("pizzas") },
  handler: async (ctx, args) => {
    const pizza = await ctx.db.get(args.id);
    if (!pizza) return null;
    return await pizzaWithImageUrl(ctx, pizza);
  },
});

/** For favorites grid — skips missing or unavailable. */
export const getPizzasByIds = query({
  args: { ids: v.array(v.id("pizzas")) },
  handler: async (ctx, args) => {
    const ids = [...new Set(args.ids)];
    const out: Awaited<ReturnType<typeof pizzaWithImageUrl>>[] = [];
    for (const id of ids) {
      const pizza = await ctx.db.get(id);
      if (!pizza || !pizza.isAvailable) continue;
      out.push(await pizzaWithImageUrl(ctx, pizza));
    }
    return out;
  },
});

export const listIngredients = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("ingredients")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
    return docs.filter((doc) => doc.inStock).sort((a, b) => a.name.localeCompare(b.name));
  },
});

/** Idempotent demo seed — only runs when pizzas table is empty. Seeds store settings singleton if missing. */
export const seedDemoMenu = mutation({
  args: {},
  handler: async (ctx) => {
    const storeMissing =
      (await ctx.db
        .query("storeSettings")
        .withIndex("by_singleton", (q) => q.eq("singletonKey", "main"))
        .unique()) === null;

    if (storeMissing) {
      await ctx.db.insert("storeSettings", {
        singletonKey: "main",
        storeDisplayName: "Pinnochio's Pizza",
        deliveryFeeCents: 299,
        kitchenPriceMultiplier: 1,
        updatedAt: Date.now(),
      });
    }

    const existing = await ctx.db.query("pizzas").take(1);
    if (existing.length > 0) return { inserted: 0 };

    let inserted = 0;
    for (const pizza of DEMO_PIZZAS) {
      await ctx.db.insert("pizzas", {
        ...pizza,
        isAvailable: true,
        seedTag: "demo-mobile",
      });
      inserted += 1;
    }
    return { inserted };
  },
});

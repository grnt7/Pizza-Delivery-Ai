import type { Doc, Id } from "../../../backend/convex/_generated/dataModel";

export const SIZE_KEYS = ["small", "medium", "large"] as const;

export type SizeKey = (typeof SIZE_KEYS)[number];

export const SIZE_META: Record<
  SizeKey,
  { label: string; subtitle: string; multiplier: number }
> = {
  small: { label: "Small", subtitle: `8″`, multiplier: 0.92 },
  medium: { label: "Medium", subtitle: `12″`, multiplier: 1 },
  large: { label: "Large", subtitle: `16″`, multiplier: 1.18 },
};

export function baseWithSize(basePriceCents: number, sizeKey: SizeKey): number {
  return Math.round(
    basePriceCents * SIZE_META[sizeKey].multiplier,
  );
}

export function extrasTotalCents(
  selectedIds: Id<"ingredients">[],
  ingredientsById: Map<string, Doc<"ingredients">>,
): number {
  let sum = 0;
  for (const id of selectedIds) {
    const ing = ingredientsById.get(id);
    sum += ing?.additionalPriceCents ?? 0;
  }
  return sum;
}

/** Pizza + size + additive extras only (no restaurant markup). */
export function preRestaurantUnitCents(params: {
  basePriceCents: number;
  sizeKey: SizeKey;
  extraIngredientIds: Id<"ingredients">[];
  ingredients: Doc<"ingredients">[];
}): number {
  const map = new Map(params.ingredients.map((i) => [i._id, i]));
  return (
    baseWithSize(params.basePriceCents, params.sizeKey) +
    extrasTotalCents(params.extraIngredientIds, map)
  );
}

export function makeLineKey(
  pizzaId: Id<"pizzas">,
  sizeKey: SizeKey,
  extraIds: Id<"ingredients">[],
  restaurantId: string,
): string {
  const sorted = [...extraIds].slice().sort().join(",");
  return `${pizzaId}|${sizeKey}|${sorted}|${restaurantId}`;
}

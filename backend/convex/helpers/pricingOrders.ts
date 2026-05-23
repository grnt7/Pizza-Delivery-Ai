import type { Doc, Id } from "../_generated/dataModel";

/** Server-side sizing — keep in sync with apps/frontend/lib/pricing.ts */
export const SIZE_MULTIPLIER = {
  small: 0.92,
  medium: 1,
  large: 1.18,
} as const;

export type ConvexSizeKey = keyof typeof SIZE_MULTIPLIER;

export function baseWithSizeConvex(
  basePriceCents: number,
  sizeKey: ConvexSizeKey,
): number {
  return Math.round(basePriceCents * SIZE_MULTIPLIER[sizeKey]);
}

export function extrasSumCents(
  extraIds: Id<"ingredients">[],
  byId: Map<string, Doc<"ingredients">>,
): number {
  let sum = 0;
  for (const id of extraIds) {
    const ing = byId.get(id);
    sum += ing?.additionalPriceCents ?? 0;
  }
  return sum;
}

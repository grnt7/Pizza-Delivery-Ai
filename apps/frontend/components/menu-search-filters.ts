/** Customer menu search / filter preferences (home screen). */

export type MenuSortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "name_asc";

/** Base price tiers in cents (Medium-style menu pricing). */
export type MenuPricePreset = "any" | "budget" | "mid" | "premium";

export type MenuSearchFiltersState = {
  sort: MenuSortOption;
  pricePreset: MenuPricePreset;
  /** When true, search text also matches default topping names. */
  includeIngredientsInSearch: boolean;
};

export const DEFAULT_MENU_SEARCH_FILTERS: MenuSearchFiltersState = {
  sort: "recommended",
  pricePreset: "any",
  includeIngredientsInSearch: true,
};

export function menuSearchFiltersAreActive(f: MenuSearchFiltersState): boolean {
  return (
    f.sort !== DEFAULT_MENU_SEARCH_FILTERS.sort ||
    f.pricePreset !== DEFAULT_MENU_SEARCH_FILTERS.pricePreset ||
    f.includeIngredientsInSearch !==
      DEFAULT_MENU_SEARCH_FILTERS.includeIngredientsInSearch
  );
}

/** Returns false if pizza base price is outside the selected preset. */
export function pizzaMatchesPricePreset(
  basePriceCents: number,
  preset: MenuPricePreset,
): boolean {
  if (preset === "any") return true;
  if (preset === "budget") return basePriceCents < 1500;
  if (preset === "mid")
    return basePriceCents >= 1500 && basePriceCents <= 1799;
  return basePriceCents >= 1800;
}

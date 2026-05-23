export type MockRestaurant = {
  id: string;
  name: string;
  deliveryFeeCents: number;
  etaMinutes: number;
  /** Multiplier applied to food subtotal before delivery fee */
  priceMultiplier: number;
  rating: number;
};

export const MOCK_RESTAURANTS: MockRestaurant[] = [
  {
    id: "pinnochios",
    name: "Pinnochio's Pizza",
    deliveryFeeCents: 0,
    etaMinutes: 20,
    priceMultiplier: 1,
    rating: 4.9,
  },
  {
    id: "pizza-corner",
    name: "Pizza Corner",
    deliveryFeeCents: 299,
    etaMinutes: 32,
    priceMultiplier: 1.04,
    rating: 4.6,
  },
  {
    id: "urban-slice",
    name: "Urban Slice",
    deliveryFeeCents: 199,
    etaMinutes: 28,
    priceMultiplier: 1.08,
    rating: 4.7,
  },
];

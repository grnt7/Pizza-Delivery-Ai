import type { CheckoutConvexCartPayload } from "@/components/checkout-cart-types";

type Props = {
  cart: CheckoutConvexCartPayload;
  disabled: boolean;
  onPaid?: (payload: { orderId: string; totalCents: number }) => void;
};

/**
 * Web checkout uses Stripe Hosted Checkout; Payment Sheet lives on native builds only.
 * This avoids importing `@stripe/stripe-react-native` (TurboModules + web invariant crash).
 */
export function CheckoutNativeCardPay(_props: Props) {
  return null;
}

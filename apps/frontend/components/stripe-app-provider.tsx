import { StripeProvider } from "@stripe/stripe-react-native";
import React, { type ReactNode } from "react";
import { Platform } from "react-native";

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

/**
 * Stripe React Native only; web uses Hosted Checkout Session (no Stripe.js here).
 */
export function StripeAppProvider({ children }: { children: ReactNode }) {
  if (Platform.OS === "web" || !publishableKey.trim()) {
    return children;
  }

  return (
    <StripeProvider
      publishableKey={publishableKey.trim()}
      merchantIdentifier="merchant.pinnochiospizza"
      urlScheme="pinnochiospizza"
    >
      {children as unknown as React.ReactElement | React.ReactElement[]}
    </StripeProvider>
  );
}

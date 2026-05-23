import type { ReactNode } from "react";

/**
 * Web: `@stripe/stripe-react-native` calls `TurboModuleRegistry.getEnforcing('StripeSdk')`
 * at import time — that invariant throws on react-native-web. Never import StripeProvider here.
 *
 * Hosted Checkout + Payment Sheet runs on native only (see stripe-app-provider.tsx).
 */
export function StripeAppProvider({ children }: { children: ReactNode }) {
  return children;
}

import { ClerkProvider, useAuth } from "@clerk/expo";
import * as SecureStore from "expo-secure-store";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

import { Platform } from "react-native";

import { StripeAppProvider } from "@/components/stripe-app-provider";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ?? "";
const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (__DEV__) {
  if (!convexUrl) {
    console.warn(
      "[root-providers] EXPO_PUBLIC_CONVEX_URL is not set (add apps/frontend/.env and restart Expo).",
    );
  }
  if (!publishableKey) {
    console.warn(
      "[root-providers] EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set.",
    );
  }
}

/** Secure token cache on native; web uses Clerk in-memory caching by omission. */
const tokenCache =
  Platform.OS !== "web"
    ? {
        async getToken(key: string) {
          try {
            return await SecureStore.getItemAsync(key);
          } catch {
            return null;
          }
        },
        async saveToken(key: string, value: string) {
          await SecureStore.setItemAsync(key, value);
        },
      }
    : undefined;

function getConvexClient(): ConvexReactClient {
  if (!convexUrl.trim()) {
    throw new Error(
      "Missing EXPO_PUBLIC_CONVEX_URL. Copy apps/frontend/.env.example to .env and set your Convex HTTPS URL.",
    );
  }
  return new ConvexReactClient(convexUrl);
}

/**
 * Clerk → Convex: use Convex’s bundled {@link ConvexProviderWithClerk} so `fetchAccessToken`
 * memoization matches Convex + Clerk Expo (unstable `getToken` ref must not churn `setAuth`).
 * A churning fetcher resets the websocket auth handshake and keeps `useConvexAuth().isLoading`
 * stuck at `true` for a long time.
 *
 * Convex integration or JWT template name must be **`convex`** (`aud` = convex when using template).
 *
 * Token errors are swallowed by the helper (Convex default); auth then fails visibly via queries/sign-in only.
 *
 * @see https://docs.convex.dev/auth/clerk
 */
export function RootProviders({ children }: { children: ReactNode }) {
  const client = getConvexSingleton();

  if (!publishableKey.trim()) {
    throw new Error(
      "Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY (set apps/frontend/.env).",
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ConvexProviderWithClerk client={client} useAuth={useAuth}>
        <StripeAppProvider>{children}</StripeAppProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}

let convexSingleton: ConvexReactClient | null = null;

function getConvexSingleton(): ConvexReactClient {
  if (!convexSingleton) convexSingleton = getConvexClient();
  return convexSingleton;
}

import { Stack } from "expo-router";
import "react-native-gesture-handler";
import { CartProvider } from "@/components/cart-context";
import { FavoritesProvider } from "@/components/favorites-context";
import { OrderDraftProvider } from "@/components/order-draft-context";
import { RootProviders } from "@/components/root-providers";

export default function RootLayout() {
  return (
    <RootProviders>
      <FavoritesProvider>
        <OrderDraftProvider>
          <CartProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </CartProvider>
        </OrderDraftProvider>
      </FavoritesProvider>
    </RootProviders>
  );
}

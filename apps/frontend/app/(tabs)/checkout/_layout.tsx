import { Stack } from "expo-router";

import { palette } from "@/theme";

export default function CheckoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: palette.text,
        headerStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Checkout" }} />
      <Stack.Screen name="success" options={{ title: "Payment" }} />
      <Stack.Screen name="cancel" options={{ title: "Checkout canceled" }} />
    </Stack>
  );
}

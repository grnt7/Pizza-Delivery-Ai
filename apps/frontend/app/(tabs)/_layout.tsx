import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useConvexAuth } from "convex/react";

import LoadingScreen from "@/components/loading-screen";
import { useCart } from "@/components/cart-context";
import { palette } from "@/theme";

export default function TabsLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { itemCount } = useCart();

  if (isLoading) {
    return <LoadingScreen message="Loading Pinnochio's Pizza…" />;
  }
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: "#a8a8a8",
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 8,
          shadowOpacity: 0.06,
          backgroundColor: "#fff",
          height: 62,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        headerTitleStyle: { fontWeight: "700", color: palette.text },
        headerStyle: { backgroundColor: palette.background },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favorites",
          headerTitle: "Saved",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarBadge:
            itemCount > 0
              ? itemCount > 99
                ? "99+"
                : itemCount
              : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerTitle: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pizza/[id]"
        options={{
          href: null,
          headerShown: true,
          title: "",
          headerTintColor: palette.text,
          headerStyle: { backgroundColor: palette.background },
        }}
      />
      <Tabs.Screen
        name="restaurant-select"
        options={{
          href: null,
          headerShown: true,
          title: "",
          headerTintColor: palette.text,
          headerStyle: { backgroundColor: palette.background },
        }}
      />
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="order/[id]"
        options={{
          href: null,
          headerShown: true,
          title: "Order",
          headerTintColor: palette.text,
          headerStyle: { backgroundColor: palette.background },
        }}
      />
    </Tabs>
  );
}

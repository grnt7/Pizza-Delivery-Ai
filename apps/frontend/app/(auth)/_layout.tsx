import { Redirect, Stack } from "expo-router";
import { useConvexAuth } from "convex/react";

import LoadingScreen from "@/components/loading-screen";

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen message="Checking your session…" />;
  }
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerTintColor: "#b91c1c" }} />
  );
}

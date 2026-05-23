import { Redirect } from "expo-router";
import { useConvexAuth } from "convex/react";

import LoadingScreen from "@/components/loading-screen";

/** Route gate: send users to tabs or Clerk sign-in. */
export default function IndexScreen() {
  const { isAuthenticated, isLoading } = useConvexAuth();

  if (isLoading) {
    return <LoadingScreen message="Loading Pinnochio's Pizza…" />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return <Redirect href="/(tabs)" />;
}

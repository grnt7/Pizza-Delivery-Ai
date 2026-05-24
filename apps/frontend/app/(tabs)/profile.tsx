import { useClerk, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { palette, radii } from "@/theme";

function resolveAdminDashboardUrl(): string {
  const fromProcess =
    typeof process.env.EXPO_PUBLIC_ADMIN_URL === "string"
      ? process.env.EXPO_PUBLIC_ADMIN_URL
      : "";
  const extraRaw = Constants.expoConfig?.extra?.EXPO_PUBLIC_ADMIN_URL;
  const fromExtra = typeof extraRaw === "string" ? extraRaw : "";
  return (fromProcess || fromExtra).trim();
}

async function openAdminDashboard(adminUrl: string) {
  try {
    const can = await Linking.canOpenURL(adminUrl);
    if (!can) {
      Alert.alert(
        "Cannot open admin",
        "This device cannot open that URL. On a physical phone, try your computer’s LAN IP instead of localhost in EXPO_PUBLIC_ADMIN_URL.",
      );
      return;
    }
    await Linking.openURL(adminUrl);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Something went wrong";
    Alert.alert("Open failed", msg);
  }
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  const role =
    typeof user?.publicMetadata?.role === "string"
      ? user.publicMetadata.role
      : "";
  const isAdmin = role === "admin";
  const adminUrl = resolveAdminDashboardUrl();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.email}>
        {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "Guest"}
      </Text>

      {isAdmin && adminUrl ? (
        <Pressable
          style={styles.kitchen}
          accessibilityRole="button"
          accessibilityLabel="Open kitchen admin dashboard"
          onPress={() => void openAdminDashboard(adminUrl)}
        >
          <Text style={styles.kitchenLabel}>Kitchen dashboard</Text>
          <Text style={styles.kitchenHint}>Opens the web admin for this shop</Text>
        </Pressable>
      ) : null}

      {isAdmin &&
      !adminUrl &&
      typeof __DEV__ !== "undefined" &&
      __DEV__ ? (
        <Text style={styles.devHint}>
          Set EXPO_PUBLIC_ADMIN_URL (e.g. http://localhost:3001) in apps/frontend/.env
          to show Kitchen dashboard here.
        </Text>
      ) : null}

      <Pressable
        style={[
          styles.out,
          ((isAdmin && adminUrl) ||
            (isAdmin &&
              typeof __DEV__ !== "undefined" &&
              __DEV__))
            ? styles.outSpaced
            : null,
        ]}
        accessibilityRole="button"
        onPress={() => void signOut()}
      >
        <Text style={styles.outLabel}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
    padding: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
    color: palette.text,
  },
  label: { color: palette.textSecondary, fontSize: 14 },
  email: {
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 20,
    fontSize: 17,
    color: palette.text,
  },
  kitchen: {
    backgroundColor: palette.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: palette.primary,
    marginBottom: 14,
    gap: 4,
  },
  kitchenLabel: {
    fontWeight: "800",
    fontSize: 16,
    color: palette.primary,
  },
  kitchenHint: {
    fontSize: 13,
    color: palette.textSecondary,
  },
  devHint: {
    fontSize: 13,
    lineHeight: 18,
    color: palette.textSecondary,
    marginBottom: 14,
  },
  out: {
    backgroundColor: palette.card,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  outSpaced: {
    marginTop: 4,
  },
  outLabel: { fontWeight: "700", fontSize: 16, color: "#b91c1c" },
});

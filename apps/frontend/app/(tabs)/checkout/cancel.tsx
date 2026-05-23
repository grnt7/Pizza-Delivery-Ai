import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { palette, radii } from "@/theme";

export default function CheckoutCancelScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.pad}>
        <Text style={styles.title}>Checkout canceled</Text>
        <Text style={styles.body}>
          No charge was made. Your cart items are unchanged (unless you refreshed this page after starting payment).
        </Text>
        <Pressable
          accessibilityRole="button"
          style={styles.primary}
          onPress={() => router.replace("/(tabs)/checkout")}
        >
          <Text style={styles.primaryText}>Return to checkout</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={styles.ghost}
          onPress={() => router.replace("/(tabs)/cart")}
        >
          <Text style={styles.ghostText}>View cart</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  pad: {
    padding: 24,
    gap: 16,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: "center",
  },
  title: { fontSize: 26, fontWeight: "800", color: palette.text },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: palette.textSecondary,
  },
  primary: {
    marginTop: 8,
    alignItems: "center",
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 17 },
  ghost: {
    alignItems: "center",
    paddingVertical: 12,
  },
  ghostText: { fontWeight: "700", color: palette.primary, fontSize: 16 },
});

import { useClerk, useUser } from "@clerk/expo";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.label}>Signed in as</Text>
      <Text style={styles.email}>
        {user?.primaryEmailAddress?.emailAddress ?? user?.username ?? "Guest"}
      </Text>

      <Pressable
        style={styles.out}
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
    backgroundColor: "#fafafa",
    padding: 22,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
  },
  label: { color: "#737373", fontSize: 14 },
  email: {
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 28,
    fontSize: 17,
  },
  out: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  outLabel: { fontWeight: "700", fontSize: 16, color: "#b91c1c" },
});

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function LoadingScreen({
  message,
}: {
  message?: string;
}) {
  return (
    <View style={styles.outer}>
      <ActivityIndicator size="large" />
      {message ? <Text style={styles.msg}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#fff",
  },
  msg: { fontSize: 16, color: "#444", textAlign: "center" },
});

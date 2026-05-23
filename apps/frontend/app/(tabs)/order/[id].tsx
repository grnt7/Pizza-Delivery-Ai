import { useQuery } from "convex/react";
import type { Id } from "../../../../../backend/convex/_generated/dataModel";
import { useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import LoadingScreen from "@/components/loading-screen";
import { formatUsd } from "@/lib/format";
import { api } from "@/lib/convex-api";
import { palette, radii } from "@/theme";

function statusChip(
  status: "received" | "prep" | "out_for_delivery" | "delivered" | "cancelled",
): string {
  switch (status) {
    case "received":
      return "Received";
    case "prep":
      return "Kitchen (preparing)";
    case "out_for_delivery":
      return "Out for delivery";
    case "delivered":
      return "Delivered";
    default:
      return "Cancelled";
  }
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const orderId =
    typeof params.id === "string" && params.id.length > 0
      ? (params.id as Id<"orders">)
      : null;

  const order = useQuery(
    api.orders.getMineById,
    orderId ? { orderId } : "skip",
  );

  if (orderId === null || order === undefined) {
    return <LoadingScreen message="Loading order…" />;
  }

  if (order === null) {
    return (
      <View style={styles.fail}>
        <Text>Couldn&apos;t load this order.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.pad}>
      <Text style={styles.badge}>{statusChip(order.status)}</Text>
      <Text style={styles.total}>{formatUsd(order.totalCents)}</Text>
      <Text style={styles.meta}>
        Placed{" "}
        {new Date(order.createdAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </Text>
      {order.notes ? <Text style={styles.notes}>{order.notes}</Text> : null}

      {order.deliveryAddress ? (
        <>
          <Text style={styles.section}>Delivery address</Text>
          <View style={styles.addrCard}>
            <Text style={styles.addrLine}>{order.deliveryAddress.line1}</Text>
            {order.deliveryAddress.line2 ? (
              <Text style={styles.addrLine}>{order.deliveryAddress.line2}</Text>
            ) : null}
            <Text style={styles.addrLine}>
              {[order.deliveryAddress.city, order.deliveryAddress.region]
                .filter(Boolean)
                .join(", ")}
              {"  "}
              {order.deliveryAddress.postalCode}
            </Text>
            <Text style={styles.addrPhone}>{order.deliveryAddress.phone}</Text>
          </View>
        </>
      ) : null}

      <Text style={styles.section}>Items</Text>
      {order.lineItems.map((line, i) => (
        <View key={i} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>{line.pizzaNameSnapshot}</Text>
            <Text style={styles.rowMeta}>
              {line.sizeLabel} · {formatUsd(line.unitFoodCents)} each
            </Text>
            <Text style={styles.rowExtra}>
              {line.extraIngredientIds.length > 0
                ? `${line.extraIngredientIds.length} extras`
                : ""}
            </Text>
          </View>
          <Text style={styles.qty}>×{line.quantity}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  pad: { padding: 22, gap: 14, paddingBottom: 44 },
  badge: {
    fontWeight: "800",
    color: palette.primary,
    fontSize: 17,
    textAlign: "center",
  },
  total: {
    fontSize: 32,
    fontWeight: "900",
    color: palette.text,
    textAlign: "center",
  },
  meta: { color: palette.textSecondary, textAlign: "center" },
  notes: {
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.textSecondary,
    fontStyle: "italic",
  },
  section: { fontWeight: "800", fontSize: 18, marginTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    backgroundColor: palette.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 12,
  },
  rowTitle: { fontWeight: "700", fontSize: 16 },
  rowMeta: { marginTop: 4, color: palette.textSecondary, fontSize: 13 },
  rowExtra: { marginTop: 4, fontSize: 12, color: palette.textSecondary },
  qty: { fontWeight: "800", fontSize: 16 },
  fail: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  addrCard: {
    backgroundColor: palette.card,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 4,
  },
  addrLine: { fontSize: 15, color: palette.text, lineHeight: 22 },
  addrPhone: {
    marginTop: 8,
    fontWeight: "700",
    color: palette.primary,
    fontSize: 16,
  },
});

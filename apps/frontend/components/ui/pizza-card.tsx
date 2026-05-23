import { Ionicons } from "@expo/vector-icons";
import type { Doc } from "../../../../backend/convex/_generated/dataModel";
import { Image } from "expo-image";
import {
  type StyleProp,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { formatUsd } from "@/lib/format";
import { palette, radii, shadows } from "@/theme";

export type PizzaListItem = Doc<"pizzas"> & { imageUrl: string | null };

type Props = {
  pizza: PizzaListItem;
  onPressCard: () => void;
  onPressQuickAdd?: () => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Card tap and quick-add are separate Pressables (siblings) so react-native-web
 * never renders a <button> inside a <button>.
 */
export function PizzaCard({ pizza, onPressCard, onPressQuickAdd, style }: Props) {
  const uri = pizza.imageUrl ?? undefined;

  return (
    <View style={[styles.card, shadows.card, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.cardPressableArea,
          pressed && styles.cardPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${pizza.name}, ${formatUsd(pizza.basePriceCents)}`}
        onPress={onPressCard}
      >
        <Text style={styles.title} numberOfLines={2}>
          {pizza.name}
        </Text>
        <Text style={styles.price}>{formatUsd(pizza.basePriceCents)}</Text>

        <View style={styles.imageWrap}>
          {uri ? (
            <Image source={{ uri }} style={styles.image} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="pizza-outline" size={40} color={palette.primary} />
            </View>
          )}
        </View>
      </Pressable>

      <View style={styles.footer}>
        <Text style={styles.meta}>20 min · 4.8</Text>
        {onPressQuickAdd ? (
          <Pressable
            style={styles.addBtn}
            accessibilityRole="button"
            accessibilityLabel={`Add ${pizza.name}`}
            onPress={onPressQuickAdd}
            hitSlop={6}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 12,
    minHeight: 200,
    maxWidth: "100%",
  },
  /** Expands so the footer sits at the visual bottom without nesting Pressables. */
  cardPressableArea: {
    flexGrow: 1,
  },
  cardPressed: { opacity: 0.96 },
  title: {
    fontWeight: "700",
    fontSize: 15,
    color: palette.text,
    minHeight: 40,
  },
  price: {
    marginTop: 6,
    fontWeight: "800",
    fontSize: 16,
    color: palette.primary,
  },
  imageWrap: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.primaryMuted,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  meta: { fontSize: 12, color: palette.textSecondary, fontWeight: "500" },
  addBtn: {
    backgroundColor: palette.primary,
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.fab,
  },
});

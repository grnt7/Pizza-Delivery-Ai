import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text } from "react-native";

import { palette, radii } from "@/theme";

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function CategoryChip({
  label,
  selected,
  onPress,
  style,
  textStyle,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Text style={[styles.text, selected && styles.textSelected, textStyle]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: radii.pill,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.borderStrong,
  },
  selected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  pressed: { opacity: 0.9 },
  text: {
    fontWeight: "600",
    fontSize: 14,
    color: palette.text,
  },
  textSelected: { color: "#fff" },
});

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { palette, radii } from "@/theme";

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  /** When set, the filter icon opens advanced search options. */
  onPressFilter?: () => void;
  /** Highlights the filter affordance when non-default filters are active. */
  filterActive?: boolean;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Search your pizza here",
  onPressFilter,
  filterActive,
}: Props) {
  const FilterAffordance =
    onPressFilter !== undefined ? (
      <Pressable
        onPress={onPressFilter}
        hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Search and sort filters"
        style={styles.filterTap}
      >
        <View>
          <Ionicons
            name="options-outline"
            size={22}
            color={filterActive ? palette.primary : palette.textSecondary}
          />
          {filterActive ? <View style={styles.filterDot} /> : null}
        </View>
      </Pressable>
    ) : (
      <Ionicons name="options-outline" size={22} color={palette.textSecondary} />
    );

  return (
    <View style={styles.wrap}>
      <Ionicons name="search-outline" size={22} color={palette.textSecondary} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a3a3a3"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {FilterAffordance}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.card,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: palette.text,
    paddingVertical: 6,
  },
  filterTap: {
    justifyContent: "center",
    alignItems: "center",
  },
  filterDot: {
    position: "absolute",
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.primary,
    borderWidth: 1.5,
    borderColor: palette.card,
  },
});

import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type MenuPricePreset,
  type MenuSearchFiltersState,
  type MenuSortOption,
  DEFAULT_MENU_SEARCH_FILTERS,
} from "@/components/menu-search-filters";
import { palette, radii } from "@/theme";

type Props = {
  visible: boolean;
  value: MenuSearchFiltersState;
  onClose: () => void;
  onApply: (next: MenuSearchFiltersState) => void;
};

const SORT_OPTIONS: { id: MenuSortOption; label: string; hint: string }[] = [
  {
    id: "recommended",
    label: "Recommended",
    hint: "Original menu order",
  },
  {
    id: "price_asc",
    label: "Price: low → high",
    hint: "Budget-friendly first",
  },
  {
    id: "price_desc",
    label: "Price: high → low",
    hint: "Premium picks first",
  },
  { id: "name_asc", label: "Name: A → Z", hint: "Alphabetical" },
];

const PRICE_OPTIONS: { id: MenuPricePreset; label: string }[] = [
  { id: "any", label: "Any price" },
  { id: "budget", label: "Under $15" },
  { id: "mid", label: "$15 – $17.99" },
  { id: "premium", label: "$18 & up" },
];

export function MenuSearchFilterModal({
  visible,
  value,
  onClose,
  onApply,
}: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<MenuSearchFiltersState>(value);

  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  function applyAndClose(next: MenuSearchFiltersState) {
    onApply(next);
    onClose();
  }

  function reset() {
    setDraft(DEFAULT_MENU_SEARCH_FILTERS);
    applyAndClose(DEFAULT_MENU_SEARCH_FILTERS);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Dismiss filters"
        />
        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
        <View style={styles.handleWrap}>
          <View style={styles.handle} />
        </View>

        <View style={styles.headerRow}>
          <Text style={styles.title}>Refine menu</Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close filters"
          >
            <Ionicons name="close" size={26} color={palette.textSecondary} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Sort and narrow by price. Optional: match your search against topping
          names too.
        </Text>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollInner}
        >
          <Text style={styles.sectionLabel}>Sort</Text>
          <View style={styles.optionList}>
            {SORT_OPTIONS.map((opt) => {
              const selected = draft.sort === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => setDraft((d) => ({ ...d, sort: opt.id }))}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <View style={styles.rowText}>
                    <Text
                      style={[styles.rowLabel, selected && styles.rowLabelOn]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.rowHint}>{opt.hint}</Text>
                  </View>
                  <View
                    style={[styles.radioOuter, selected && styles.radioOuterOn]}
                  >
                    {selected ? <View style={styles.radioInner} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Base price</Text>
          <View style={styles.chipsWrap}>
            {PRICE_OPTIONS.map((opt) => {
              const selected = draft.pricePreset === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[styles.chip, selected && styles.chipOn]}
                  onPress={() =>
                    setDraft((d) => ({ ...d, pricePreset: opt.id }))
                  }
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[styles.chipText, selected && styles.chipTextOn]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={styles.switchTitle}>Search topping names</Text>
              <Text style={styles.switchHint}>
                When you type in the search bar, also match ingredients on each
                pizza.
              </Text>
            </View>
            <Switch
              value={draft.includeIngredientsInSearch}
              onValueChange={(includeIngredientsInSearch) =>
                setDraft((d) => ({ ...d, includeIngredientsInSearch }))
              }
              trackColor={{ false: palette.borderStrong, true: palette.primaryMuted }}
              thumbColor={
                draft.includeIngredientsInSearch
                  ? palette.primary
                  : "#f4f4f5"
              }
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={styles.btnGhost}
            onPress={reset}
            accessibilityRole="button"
            accessibilityLabel="Reset all filters"
          >
            <Text style={styles.btnGhostText}>Reset</Text>
          </Pressable>
          <Pressable
            style={styles.btnPrimary}
            onPress={() => applyAndClose(draft)}
            accessibilityRole="button"
            accessibilityLabel="Apply filters"
          >
            <Text style={styles.btnPrimaryText}>Apply</Text>
          </Pressable>
        </View>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: palette.overlay,
  },
  sheet: {
    backgroundColor: palette.card,
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
    maxHeight: "88%",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handleWrap: { alignItems: "center", marginBottom: 8 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.borderStrong,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textSecondary,
  },
  scrollInner: { paddingBottom: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: palette.textSecondary,
    marginBottom: 10,
    marginTop: 8,
  },
  optionList: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.background,
  },
  rowSelected: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryMuted,
  },
  rowText: { flex: 1, paddingRight: 12 },
  rowLabel: { fontSize: 16, fontWeight: "600", color: palette.text },
  rowLabelOn: { color: palette.primaryDark },
  rowHint: { fontSize: 13, color: palette.textSecondary, marginTop: 2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: palette.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterOn: { borderColor: palette.primary },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: palette.primary,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    backgroundColor: palette.card,
  },
  chipOn: {
    borderColor: palette.primary,
    backgroundColor: palette.primaryMuted,
  },
  chipText: { fontSize: 14, fontWeight: "600", color: palette.text },
  chipTextOn: { color: palette.primaryDark },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  switchText: { flex: 1 },
  switchTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
  },
  switchHint: {
    fontSize: 13,
    color: palette.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    alignItems: "center",
  },
  btnGhostText: { fontSize: 16, fontWeight: "600", color: palette.text },
  btnPrimary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: palette.primary,
    alignItems: "center",
  },
  btnPrimaryText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});

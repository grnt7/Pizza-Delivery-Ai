import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { PizzaListItem } from "@/components/ui/pizza-card";
import { PizzaCard } from "@/components/ui/pizza-card";
import { CategoryChip } from "@/components/ui/category-chip";
import { SearchBar } from "@/components/ui/search-bar";
import LoadingScreen from "@/components/loading-screen";
import { api } from "@/lib/convex-api";
import { palette } from "@/theme";

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | "all">("all");

  const pizzas = useQuery(api.menu.listPizzas);
  const seedDemoMenu = useMutation(api.menu.seedDemoMenu);
  const bootstrapStore = useMutation(api.storeSettings.bootstrapMainIfNeeded);

  useEffect(() => {
    void bootstrapStore();
  }, [bootstrapStore]);

  useEffect(() => {
    if (pizzas === undefined) return;
    if (pizzas.length === 0) void seedDemoMenu();
  }, [pizzas, seedDemoMenu]);

  const categories = useMemo(() => {
    if (!pizzas) return [] as string[];
    const set = new Set(pizzas.map((p) => p.category));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [pizzas]);

  const filtered = useMemo(() => {
    if (!pizzas) return [];
    const q = search.trim().toLowerCase();
    return pizzas.filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [pizzas, search, category]);

  if (pizzas === undefined) {
    return <LoadingScreen message="Loading menu…" />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <SearchBar value={search} onChangeText={setSearch} />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={["all" as const, ...categories]}
          keyExtractor={(item) => item}
          style={styles.chipsRow}
          contentContainerStyle={styles.chipsInner}
          renderItem={({ item }) => (
            <CategoryChip
              label={item === "all" ? "All" : item}
              selected={
                item === "all" ? category === "all" : category === item
              }
              onPress={() => setCategory(item)}
            />
          )}
        />

        <FlatList<PizzaListItem>
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item._id}
          columnWrapperStyle={styles.rowGap}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => {}} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No pizzas match your filters.</Text>
          }
          renderItem={({ item }) => (
            <PizzaCard
              style={styles.cell}
              pizza={item}
              onPressCard={() =>
                router.push({
                  pathname: "/(tabs)/pizza/[id]",
                  params: { id: item._id },
                })
              }
              onPressQuickAdd={() =>
                router.push({
                  pathname: "/(tabs)/pizza/[id]",
                  params: { id: item._id },
                })
              }
            />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  screen: { flex: 1, backgroundColor: palette.background },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chipsRow: { maxHeight: 52 },
  chipsInner: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  grid: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    gap: 14,
    flexGrow: 1,
  },
  rowGap: { gap: 12 },
  cell: {
    flex: 1,
    marginHorizontal: 2,
    maxWidth: "50%",
  },
  empty: {
    textAlign: "center",
    color: palette.textSecondary,
    marginTop: 40,
    fontSize: 15,
    paddingHorizontal: 24,
  },
});

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Id } from "../../../backend/convex/_generated/dataModel";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "favorite_pizza_ids";

type Ctx = {
  favoriteIds: Id<"pizzas">[];
  loaded: boolean;
  toggleFavorite: (id: Id<"pizzas">) => Promise<void>;
  isFavorite: (id: Id<"pizzas">) => boolean;
};

const FavoritesContext = createContext<Ctx | null>(null);

function parseStored(raw: string | null): Id<"pizzas">[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed.filter((x) => typeof x === "string") as Id<"pizzas">[])
      : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<Id<"pizzas">[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        setFavoriteIds(parseStored(raw));
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: Id<"pizzas">[]) => {
    setFavoriteIds(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleFavorite = useCallback(
    async (id: Id<"pizzas">) => {
      const next = favoriteIds.includes(id)
        ? favoriteIds.filter((x) => x !== id)
        : [...favoriteIds, id];
      await persist(next);
    },
    [favoriteIds, persist],
  );

  const isFavorite = useCallback(
    (id: Id<"pizzas">) => favoriteIds.includes(id),
    [favoriteIds],
  );

  const value = useMemo(
    () => ({ favoriteIds, loaded, toggleFavorite, isFavorite }),
    [favoriteIds, isFavorite, loaded, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}

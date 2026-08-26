import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Recent search history, stored locally (never leaves the device — queries
 * are low-sensitivity but there is no reason to persist them server-side).
 * Capped at 8 entries; duplicates move to front rather than stacking.
 */

const STORE_KEY = "educard.recent-searches";
const MAX_ENTRIES = 8;

export async function getRecentSearches(): Promise<string[]> {
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        raw = localStorage.getItem(STORE_KEY);
      }
    } else {
      raw = await SecureStore.getItemAsync(STORE_KEY);
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string").slice(0, MAX_ENTRIES)
      : [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<void> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  try {
    const current = await getRecentSearches();
    const next = [trimmed, ...current.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())]
      .slice(0, MAX_ENTRIES);
    const payload = JSON.stringify(next);
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(STORE_KEY, payload);
      return;
    }
    await SecureStore.setItemAsync(STORE_KEY, payload);
  } catch {
    // Best-effort.
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(STORE_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(STORE_KEY);
  } catch {
    // Ignore.
  }
}

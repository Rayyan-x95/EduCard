import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Recent search history, stored locally (never leaves the device — queries
 * are low-sensitivity but there is no reason to persist them server-side).
 * Capped at 8 entries; duplicates move to front rather than stacking.
 */

const STORE_KEY = "educard.recent-searches";
const MAX_ENTRIES = 8;

function keyFor(userId: string): string {
  return `${STORE_KEY}.${userId}`;
}

export async function getRecentSearches(userId?: string): Promise<string[]> {
  if (!userId) return [];
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        raw = localStorage.getItem(keyFor(userId));
      }
    } else {
      raw = await SecureStore.getItemAsync(keyFor(userId));
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

export async function addRecentSearch(query: string, userId?: string): Promise<void> {
  if (!userId) return;
  const trimmed = query.trim();
  if (trimmed.length < 2) return;
  try {
    const current = await getRecentSearches(userId);
    const next = [trimmed, ...current.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())]
      .slice(0, MAX_ENTRIES);
    const payload = JSON.stringify(next);
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(keyFor(userId), payload);
      return;
    }
    await SecureStore.setItemAsync(keyFor(userId), payload);
  } catch {
    // Best-effort.
  }
}

export async function clearRecentSearches(userId?: string): Promise<void> {
  if (!userId) return;
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(keyFor(userId));
      return;
    }
    await SecureStore.deleteItemAsync(keyFor(userId));
  } catch {
    // Ignore.
  }
}

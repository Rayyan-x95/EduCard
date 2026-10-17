import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Local, per-user cache of each account's onboarding completion flag.
 *
 * Why this exists: the root layout derives routing from
 * `profile.onboarding_completed`, which requires a successful network fetch.
 * On a cold start with flaky connectivity that fetch can fail; without a
 * cached flag an onboarded user would be demoted back into the onboarding
 * wizard — and completing it again would insert a duplicate education row.
 *
 * The key is namespaced by userId so two accounts on one device can never
 * inherit each other's flag (e.g. after a session-expiry sign-out that skips
 * `reset()`). The cache is advisory only: it is never treated as
 * authoritative while a real profile is available, and every failure path
 * degrades to `null` (previous behaviour).
 */

const keyFor = (userId: string) => `educard.onboarded.${userId}`;
const REGISTRY_KEY = "educard.onboarded.users";

export async function saveOnboardingFlag(
  userId: string,
  completed: boolean
): Promise<void> {
  if (!userId) return;
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(keyFor(userId), completed ? "1" : "0");
      }
      return;
    }
    await SecureStore.setItemAsync(keyFor(userId), completed ? "1" : "0");
    // Track known user ids so clearOnboardingFlag() can wipe per-user keys
    // on sign-out (SecureStore has no list API).
    const raw = await SecureStore.getItemAsync(REGISTRY_KEY);
    const ids = raw ? raw.split(",").filter(Boolean) : [];
    if (!ids.includes(userId)) {
      ids.push(userId);
      await SecureStore.setItemAsync(REGISTRY_KEY, ids.join(","));
    }
  } catch {
    // Cache is best-effort by design.
  }
}

export async function readOnboardingFlag(
  userId: string
): Promise<boolean | null> {
  if (!userId) return null;
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        raw = localStorage.getItem(keyFor(userId));
      }
    } else {
      raw = await SecureStore.getItemAsync(keyFor(userId));
    }
    if (raw === null) return null;
    return raw === "1";
  } catch {
    return null;
  }
}

export async function clearOnboardingFlag(userId?: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        if (userId) {
          localStorage.removeItem(keyFor(userId));
        } else {
          Object.keys(localStorage)
            .filter((k) => k.startsWith("educard.onboarded."))
            .forEach((k) => localStorage.removeItem(k));
        }
      }
      return;
    }
    if (userId) {
      await SecureStore.deleteItemAsync(keyFor(userId));
      return;
    }
    // Full reset: wipe every per-user key tracked in the registry.
    const raw = await SecureStore.getItemAsync(REGISTRY_KEY);
    const ids = raw ? raw.split(",").filter(Boolean) : [];
    const failedIds: string[] = [];
    for (const id of ids) {
      try {
        await SecureStore.deleteItemAsync(keyFor(id));
      } catch {
        failedIds.push(id);
      }
    }
    try {
      if (failedIds.length === 0) {
        await SecureStore.deleteItemAsync(REGISTRY_KEY);
      } else {
        await SecureStore.setItemAsync(REGISTRY_KEY, failedIds.join(","));
      }
    } catch {
      // Ignore.
    }
  } catch {
    // Ignore.
  }
}

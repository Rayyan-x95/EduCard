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
    // Without a userId (full reset), clear every known EduCard flag we can
    // reach; per-user keys left behind by unknown ids are harmless because
    // reads are keyed strictly by uid.
    const targets = userId ? [keyFor(userId)] : ["educard.onboarded"];
    for (const base of targets) {
      if (Platform.OS === "web") {
        if (typeof localStorage !== "undefined") {
          if (userId) localStorage.removeItem(base);
          else
            Object.keys(localStorage)
              .filter((k) => k.startsWith(base))
              .forEach((k) => localStorage.removeItem(k));
        }
      } else if (userId) {
        await SecureStore.deleteItemAsync(base);
      }
    }
  } catch {
    // Ignore.
  }
}

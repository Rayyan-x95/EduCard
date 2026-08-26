import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Per-user draft storage for long-form composers. Losing a 10,000-character
 * question to an accidental modal dismiss was the highest-severity UX gap.
 *
 * Keys are namespaced by userId so two accounts on one device never inherit
 * each other's drafts. Storage is best-effort: every failure degrades
 * silently because a lost draft cache must never break composing.
 */

const keyFor = (userId: string) => `educard.draft.question.${userId}`;

export interface QuestionDraft {
  title: string;
  body: string;
  topicIds: string[];
  savedAt: number;
}

export async function saveQuestionDraft(
  userId: string,
  draft: Omit<QuestionDraft, "savedAt">
): Promise<void> {
  if (!userId) return;
  // Nothing meaningful to persist — drop instead of saving empty shells.
  if (!draft.title.trim() && !draft.body.trim()) {
    return clearQuestionDraft(userId);
  }
  try {
    const payload = JSON.stringify({ ...draft, savedAt: Date.now() });
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(keyFor(userId), payload);
      }
      return;
    }
    await SecureStore.setItemAsync(keyFor(userId), payload);
  } catch {
    // Best-effort by design.
  }
}

export async function readQuestionDraft(userId: string): Promise<QuestionDraft | null> {
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
    if (!raw) return null;

    const parsed = JSON.parse(raw) as QuestionDraft;
    // Sanity guard against corrupt entries.
    if (
      typeof parsed?.title !== "string" ||
      typeof parsed?.body !== "string" ||
      !Array.isArray(parsed?.topicIds)
    ) {
      return null;
    }

    // Discard stale drafts older than 30 days — stale content misleads.
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    if (parsed.savedAt && Date.now() - parsed.savedAt > THIRTY_DAYS_MS) {
      await clearQuestionDraft(userId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearQuestionDraft(userId: string): Promise<void> {
  if (!userId) return;
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(keyFor(userId));
      }
      return;
    }
    await SecureStore.deleteItemAsync(keyFor(userId));
  } catch {
    // Ignore.
  }
}

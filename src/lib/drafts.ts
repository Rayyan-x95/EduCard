import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Unified local draft storage for both Questions and Discussion Posts.
 * Prevents loss of student effort on accidental modal dismiss or process exit.
 *
 * Keys are namespaced by userId so multiple users on one device never inherit
 * each other's drafts. Storage is non-blocking and resilient to failure.
 */

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export interface QuestionDraft {
  title: string;
  body: string;
  topicIds: string[];
  mediaPaths?: string[];
  communityId?: string | null;
  savedAt: number;
}

export interface PostDraft {
  body: string;
  topicIds: string[];
  mediaPaths?: string[];
  communityId?: string | null;
  savedAt: number;
}

const questionKeyFor = (userId: string) => `educard.draft.question.${userId}`;
const postKeyFor = (userId: string) => `educard.draft.post.${userId}`;

async function setStorageItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getStorageItem(key: string): Promise<string | null> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeStorageItem(key: string): Promise<void> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// ---------------------------------------------------------------------------
// Question Drafts
// ---------------------------------------------------------------------------

export async function saveQuestionDraft(
  userId: string,
  draft: Omit<QuestionDraft, "savedAt">
): Promise<void> {
  if (!userId) return;
  if (!draft.title.trim() && !draft.body.trim() && (!draft.mediaPaths || draft.mediaPaths.length === 0)) {
    return clearQuestionDraft(userId);
  }
  try {
    const payload = JSON.stringify({ ...draft, savedAt: Date.now() });
    await setStorageItem(questionKeyFor(userId), payload);
  } catch {
    // Best-effort by design.
  }
}

export async function readQuestionDraft(userId: string): Promise<QuestionDraft | null> {
  if (!userId) return null;
  try {
    const raw = await getStorageItem(questionKeyFor(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as QuestionDraft;
    if (
      typeof parsed?.title !== "string" ||
      typeof parsed?.body !== "string" ||
      !Array.isArray(parsed?.topicIds)
    ) {
      return null;
    }

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
    await removeStorageItem(questionKeyFor(userId));
  } catch {
    // Ignore.
  }
}

// ---------------------------------------------------------------------------
// Post Drafts
// ---------------------------------------------------------------------------

export async function savePostDraft(
  userId: string,
  draft: Omit<PostDraft, "savedAt">
): Promise<void> {
  if (!userId) return;
  if (!draft.body.trim() && (!draft.mediaPaths || draft.mediaPaths.length === 0)) {
    return clearPostDraft(userId);
  }
  try {
    const payload = JSON.stringify({ ...draft, savedAt: Date.now() });
    await setStorageItem(postKeyFor(userId), payload);
  } catch {
    // Best-effort by design.
  }
}

export async function readPostDraft(userId: string): Promise<PostDraft | null> {
  if (!userId) return null;
  try {
    const raw = await getStorageItem(postKeyFor(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as PostDraft;
    if (
      typeof parsed?.body !== "string" ||
      !Array.isArray(parsed?.topicIds)
    ) {
      return null;
    }

    if (parsed.savedAt && Date.now() - parsed.savedAt > THIRTY_DAYS_MS) {
      await clearPostDraft(userId);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function clearPostDraft(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await removeStorageItem(postKeyFor(userId));
  } catch {
    // Ignore.
  }
}

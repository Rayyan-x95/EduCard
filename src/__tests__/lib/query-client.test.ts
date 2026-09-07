import { describe, it, expect } from "vitest";
import { queryKeys, CACHE_TTL } from "../../lib/query-client";

describe("queryKeys factory", () => {
  it("produces deterministic feed keys based on filter", () => {
    expect(queryKeys.feed("all")).toEqual(["feed", "all"]);
    expect(queryKeys.feed("unsolved")).toEqual(["feed", "unsolved"]);
    expect(queryKeys.feed("following")).toEqual(["feed", "following"]);
  });

  it("produces deterministic question detail and answers keys", () => {
    const questionId = "11111111-2222-3333-4444-555555555555";
    expect(queryKeys.question(questionId)).toEqual(["question", questionId]);
    expect(queryKeys.answers(questionId)).toEqual(["answers", questionId]);
  });

  it("produces deterministic profile keys", () => {
    const userId = "user-123";
    expect(queryKeys.profile(userId)).toEqual(["profile", userId]);
    expect(queryKeys.profileByUsername("scholar_jane")).toEqual(["profile-username", "scholar_jane"]);
  });

  it("produces deterministic community keys", () => {
    expect(queryKeys.communities()).toEqual(["communities"]);
    expect(queryKeys.community("mit-cs")).toEqual(["community", "mit-cs"]);
  });

  it("produces deterministic bookmark keys with default 'all'", () => {
    expect(queryKeys.bookmarks()).toEqual(["bookmarks", "all"]);
    expect(queryKeys.bookmarks("question")).toEqual(["bookmarks", "question"]);
    expect(queryKeys.isBookmarked("question", "q-1")).toEqual(["is-bookmarked", "question", "q-1"]);
  });

  it("produces deterministic notification keys", () => {
    expect(queryKeys.notifications()).toEqual(["notifications"]);
    expect(queryKeys.unreadNotificationsCount()).toEqual(["notifications", "unread-count"]);
  });

  it("provides expected CACHE_TTL presets", () => {
    expect(CACHE_TTL.TOPICS).toBe(3600000); // 1 hour
    expect(CACHE_TTL.COMMUNITIES).toBe(600000); // 10 min
    expect(CACHE_TTL.PROFILE).toBe(300000); // 5 min
    expect(CACHE_TTL.STANDARD).toBe(120000); // 2 min
  });
});

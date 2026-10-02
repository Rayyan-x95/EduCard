import { describe, it, expect } from "vitest";
import { queryClient, queryKeys, CACHE_TTL } from "../../lib/query-client";

describe("queryClient retry configuration", () => {
  const defaultQueries = queryClient.getDefaultOptions().queries;

  it("calculates exponential backoff with jitter for retryDelay", () => {
    const delayFn = defaultQueries?.retryDelay as ((attempt: number) => number);
    expect(typeof delayFn).toBe("function");

    const delay0 = delayFn(0);
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThanOrEqual(1600);

    const delay1 = delayFn(1);
    expect(delay1).toBeGreaterThanOrEqual(2000);
    expect(delay1).toBeLessThanOrEqual(2600);

    const delay10 = delayFn(10);
    expect(delay10).toBeLessThanOrEqual(30600);
  });

  it("bails out of retrying for deterministic Postgres/RLS/syntax codes", () => {
    const retryFn = defaultQueries?.retry as ((failureCount: number, error: any) => boolean);
    expect(typeof retryFn).toBe("function");

    // 42501 RLS
    expect(retryFn(0, { code: "42501" })).toBe(false);
    // 23505 Unique constraint
    expect(retryFn(0, { code: "23505" })).toBe(false);
    // PGRST116 Not found
    expect(retryFn(0, { code: "PGRST116" })).toBe(false);
    // Max attempts reached
    expect(retryFn(2, new Error("network timeout"))).toBe(false);
    // Transient network error on attempt 0
    expect(retryFn(0, new Error("network timeout"))).toBe(true);
  });
});

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

  it("produces deterministic domain and entity query keys", () => {
    expect(queryKeys.myQuestions("user-1")).toEqual(["my-questions", "user-1"]);
    expect(queryKeys.questionComments("q-1")).toEqual(["question-comments", "q-1"]);
    expect(queryKeys.answerComments("a-1")).toEqual(["answer-comments", "a-1"]);
    expect(queryKeys.communityName("c-1")).toEqual(["community-name", "c-1"]);
    expect(queryKeys.relatedQuestions("q-1")).toEqual(["related-questions", "q-1"]);
    expect(queryKeys.questionImageUrls(["path1.jpg"])).toEqual(["question-image-urls", ["path1.jpg"]]);
    expect(queryKeys.moderationQueue()).toEqual(["moderation-queue"]);
  });

  it("provides expected CACHE_TTL presets", () => {
    expect(CACHE_TTL.TOPICS).toBe(3600000); // 1 hour
    expect(CACHE_TTL.COMMUNITIES).toBe(600000); // 10 min
    expect(CACHE_TTL.PROFILE).toBe(300000); // 5 min
    expect(CACHE_TTL.STANDARD).toBe(120000); // 2 min
  });
});

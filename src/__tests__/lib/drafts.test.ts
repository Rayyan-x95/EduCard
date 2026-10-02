import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  saveQuestionDraft,
  readQuestionDraft,
  clearQuestionDraft,
  savePostDraft,
  readPostDraft,
  clearPostDraft,
} from "../../lib/drafts";

const store = new Map<string, string>();

vi.mock("expo-secure-store", () => ({
  setItemAsync: vi.fn(async (key: string, val: string) => {
    store.set(key, val);
  }),
  getItemAsync: vi.fn(async (key: string) => {
    return store.get(key) || null;
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    store.delete(key);
  }),
}));

describe("lib/drafts", () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  describe("Question drafts", () => {
    it("saves, reads, and clears a question draft", async () => {
      const draft = {
        title: "How to solve differential equations?",
        body: "I am having trouble with second order ODEs.",
        topicIds: ["t1", "t2"],
        mediaPaths: ["attachments/user1/image1.png"],
        communityId: "comm1",
      };

      await saveQuestionDraft("user1", draft);
      const loaded = await readQuestionDraft("user1");

      expect(loaded).toBeDefined();
      expect(loaded?.title).toBe(draft.title);
      expect(loaded?.body).toBe(draft.body);
      expect(loaded?.topicIds).toEqual(draft.topicIds);
      expect(loaded?.mediaPaths).toEqual(draft.mediaPaths);
      expect(loaded?.communityId).toBe(draft.communityId);
      expect(typeof loaded?.savedAt).toBe("number");

      await clearQuestionDraft("user1");
      const cleared = await readQuestionDraft("user1");
      expect(cleared).toBeNull();
    });

    it("clears empty drafts instead of persisting blank shells", async () => {
      await saveQuestionDraft("user1", {
        title: "   ",
        body: "   ",
        topicIds: [],
        mediaPaths: [],
      });
      const loaded = await readQuestionDraft("user1");
      expect(loaded).toBeNull();
    });

    it("handles corrupted data safely", async () => {
      store.set("educard.draft.question.user1", "{ bad json");
      const loaded = await readQuestionDraft("user1");
      expect(loaded).toBeNull();
    });
  });

  describe("Post drafts", () => {
    it("saves, reads, and clears a post draft", async () => {
      const draft = {
        body: "Check out this lecture summary on quantum mechanics.",
        topicIds: ["physics-id"],
        mediaPaths: ["attachments/user1/notes.jpg"],
        communityId: "physics-space",
      };

      await savePostDraft("user1", draft);
      const loaded = await readPostDraft("user1");

      expect(loaded).toBeDefined();
      expect(loaded?.body).toBe(draft.body);
      expect(loaded?.topicIds).toEqual(draft.topicIds);
      expect(loaded?.mediaPaths).toEqual(draft.mediaPaths);
      expect(loaded?.communityId).toBe(draft.communityId);
      expect(typeof loaded?.savedAt).toBe("number");

      await clearPostDraft("user1");
      const cleared = await readPostDraft("user1");
      expect(cleared).toBeNull();
    });

    it("clears empty post drafts", async () => {
      await savePostDraft("user1", {
        body: "",
        topicIds: [],
        mediaPaths: [],
      });
      const loaded = await readPostDraft("user1");
      expect(loaded).toBeNull();
    });
  });
});

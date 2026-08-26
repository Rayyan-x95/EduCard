import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionsService } from "@/services/questions";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: { user: { id: "u-9" } } } }),
    },
  },
}));

describe("QuestionsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls rpc get_home_feed with correct parameters", async () => {
    const mockFeed = [
      {
        id: "q-1",
        author_id: "u-1",
        author_username: "scholar_1",
        author_display_name: "Dr. Scholar",
        author_avatar_path: null,
        author_status: "postgraduate",
        author_is_verified: true,
        title: "Test Question",
        body: "Test Question Body",
        status: "open",
        answer_count: 3,
        helpful_count: 5,
        created_at: "2026-08-23T12:00:00Z",
        is_helpful: false,
        is_bookmarked: true,
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: mockFeed,
      error: null,
    } as any);

    const result = await QuestionsService.getFeed("all");
    expect(supabase.rpc).toHaveBeenCalledWith("get_home_feed", {
      p_filter: "all",
      p_limit: 20,
      p_cursor_created_at: null,
      p_cursor_id: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("q-1");
  });

  it("calls rpc_create_question with correct payload", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: "new-question-id",
      error: null,
    } as any);

    const result = await QuestionsService.createQuestion({
      title: "How does distributed consensus work?",
      body: "Detailed context on Raft and Paxos...",
      topic_ids: ["topic-1", "topic-2"],
      media_paths: ["u-1/123_attachment.png"],
    });

    expect(supabase.rpc).toHaveBeenCalledWith("rpc_create_question", {
      p_title: "How does distributed consensus work?",
      p_body: "Detailed context on Raft and Paxos...",
      p_community_id: null,
      p_topic_ids: ["topic-1", "topic-2"],
      p_image_paths: ["u-1/123_attachment.png"],
    });
    expect(result.id).toBe("new-question-id");
  });

  it("calls accept_answer RPC when accepting an answer", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: null,
    } as any);

    await QuestionsService.acceptAnswer("q-1", "ans-1");
    expect(supabase.rpc).toHaveBeenCalledWith("accept_answer", {
      p_question_id: "q-1",
      p_answer_id: "ans-1",
    });
  });

  it("creates an answer with the explicit author_id required by RLS", async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: "a-1" }, error: null });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

    const result = await QuestionsService.createAnswer("q-1", "Raft elects a leader first.");

    expect(supabase.from).toHaveBeenCalledWith("answers");
    expect(insertMock).toHaveBeenCalledWith({
      question_id: "q-1",
      author_id: "u-9",
      body: "Raft elects a leader first.",
    });
    expect(result.id).toBe("a-1");
  });

  it("refuses to post content without a session instead of hitting RLS", async () => {
    const getSession = (supabase.auth.getSession as unknown) as ReturnType<typeof vi.fn>;
    getSession.mockResolvedValueOnce({ data: { session: null } });

    await expect(
      QuestionsService.createAnswer("q-1", "Anonymous attempt")
    ).rejects.toThrow("You need to sign in to do that.");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("calls toggle_reaction RPC when toggling reactions", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: { is_active: true, count: 5 },
      error: null,
    } as any);

    const result = await QuestionsService.toggleReaction("question", "q-1");
    expect(supabase.rpc).toHaveBeenCalledWith("toggle_reaction", {
      p_target_type: "question",
      p_target_id: "q-1",
      p_reaction_type: "helpful",
    });
    expect(result).toEqual({ is_active: true, count: 5 });
  });
});

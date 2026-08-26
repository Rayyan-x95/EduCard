import { describe, it, expect, vi, beforeEach } from "vitest";
import { PostsService } from "@/services/posts";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi
        .fn()
        .mockResolvedValue({ data: { session: { user: { id: "u-9" } } } }),
    },
  },
}));

describe("PostsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a post comment with the single-target payload", async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: "c-1" }, error: null });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

    const result = await PostsService.createComment({
      postId: "p-1",
      body: "Great insight!",
    });

    expect(supabase.from).toHaveBeenCalledWith("comments");
    // author_id is REQUIRED by the comments INSERT RLS policy; the other
    // target stays NULL so chk_comment_target_exclusive passes.
    expect(insertMock).toHaveBeenCalledWith({
      post_id: "p-1",
      question_id: null,
      answer_id: null,
      author_id: "u-9",
      body: "Great insight!",
    });
    expect(result.id).toBe("c-1");
  });

  it("creates a question comment against the question target", async () => {
    const singleMock = vi.fn().mockResolvedValue({ data: { id: "c-2" }, error: null });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const insertMock = vi.fn().mockReturnValue({ select: selectMock });

    vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any);

    await PostsService.createComment({ questionId: "q-1", body: "Clarification?" });
    expect(insertMock).toHaveBeenCalledWith({
      post_id: null,
      question_id: "q-1",
      answer_id: null,
      author_id: "u-9",
      body: "Clarification?",
    });
  });

  it("refuses to create a comment without a target", async () => {
    await expect(
      PostsService.createComment({ body: "orphan" })
    ).rejects.toThrow("A comment target is required.");
  });

  it("lists comments for a post ordered ascending", async () => {
    const limitMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "c-1",
          body: "First!",
          created_at: "2026-08-23T10:00:00Z",
          author_id: "u-2",
          profiles: { display_name: "Ana", avatar_path: null, current_status: "alumni", is_verified: true },
        },
      ],
      error: null,
    });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const eqMock = vi.fn().mockReturnValue({ is: vi.fn().mockReturnValue({ order: orderMock }) });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

    const comments = await PostsService.listComments("p-1");
    expect(comments).toHaveLength(1);
    expect(comments[0].author_display_name).toBe("Ana");
    expect(comments[0].author_is_verified).toBe(true);
    // Thread fetches are hard-capped so a pathological thread cannot
    // transfer/render without bound.
    expect(limitMock).toHaveBeenCalledWith(300);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PostsService } from "@/services/posts";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
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

  it("creates a post via rpc_create_post with transactional topics and media", async () => {
    const rpcMock = vi.mocked(supabase.rpc).mockResolvedValue({ data: "p-new", error: null } as any);
    const res = await PostsService.createPost({ body: "Hello campus!", topic_ids: ["t-1"], media_paths: ["u/a.jpg"] });
    expect(rpcMock).toHaveBeenCalledWith("rpc_create_post", {
      p_body: "Hello campus!",
      p_community_id: null,
      p_topic_ids: ["t-1"],
      p_image_paths: ["u/a.jpg"],
      p_visibility: "public",
    });
    expect(res.id).toBe("p-new");
  });

  it("propagates RPC errors from createPost", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: { message: "rate limited", code: "42501" } } as any);
    await expect(PostsService.createPost({ body: "hi there" })).rejects.toEqual(expect.objectContaining({ message: "rate limited" }));
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

  it("lists user posts filtered by author_id and excludes deleted posts", async () => {
    const fakePosts = [
      {
        id: "post-1",
        author_id: "u-9",
        community_id: null,
        body: "My academic insight",
        media_paths: [],
        helpful_count: 5,
        comments_count: 2,
        created_at: "2026-09-10T12:00:00Z",
        profiles: { display_name: "Rayyan", avatar_path: null, current_status: "student", is_verified: true },
      },
    ];
    const limitMock = vi.fn().mockResolvedValue({ data: fakePosts, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const isMock = vi.fn().mockReturnValue({ order: orderMock });
    const eqMock = vi.fn().mockReturnValue({ is: isMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

    const posts = await PostsService.listUserPosts("u-9", 10);
    expect(supabase.from).toHaveBeenCalledWith("posts");
    expect(eqMock).toHaveBeenCalledWith("author_id", "u-9");
    expect(isMock).toHaveBeenCalledWith("deleted_at", null);
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(10);
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("post-1");
    expect(posts[0].author_display_name).toBe("Rayyan");
  });

  it("lists community posts filtered by community_id and excludes deleted posts", async () => {
    const fakePosts = [
      {
        id: "post-2",
        author_id: "u-3",
        community_id: "comm-1",
        body: "Community discussion post",
        media_paths: ["img.png"],
        helpful_count: 12,
        comments_count: 4,
        created_at: "2026-09-11T12:00:00Z",
        profiles: { display_name: "Scholar", avatar_path: null, current_status: "faculty", is_verified: true },
      },
    ];
    const limitMock = vi.fn().mockResolvedValue({ data: fakePosts, error: null });
    const orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    const isMock = vi.fn().mockReturnValue({ order: orderMock });
    const eqMock = vi.fn().mockReturnValue({ is: isMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });

    vi.mocked(supabase.from).mockReturnValue({ select: selectMock } as any);

    const posts = await PostsService.listCommunityPosts("comm-1", 15);
    expect(supabase.from).toHaveBeenCalledWith("posts");
    expect(eqMock).toHaveBeenCalledWith("community_id", "comm-1");
    expect(isMock).toHaveBeenCalledWith("deleted_at", null);
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(limitMock).toHaveBeenCalledWith(15);
    expect(posts).toHaveLength(1);
    expect(posts[0].id).toBe("post-2");
    expect(posts[0].author_display_name).toBe("Scholar");
  });
});

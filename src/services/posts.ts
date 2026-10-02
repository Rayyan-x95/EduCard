import { supabase } from "@/lib/supabase";
import { UserStatusEnum } from "@/types/database";

export interface PostDetail {
  id: string;
  author_id: string | null;
  community_id: string | null;
  body: string;
  helpful_count: number;
  comment_count: number;
  image_paths: string[] | null;
  created_at: string;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_path: string | null;
    current_status: UserStatusEnum | null;
    is_verified: boolean | null;
  } | null;
}

export interface PostListItem {
  id: string;
  author_id: string | null;
  author_username: string;
  author_display_name: string;
  author_avatar_path: string | null;
  author_status: UserStatusEnum;
  author_is_verified: boolean;
  community_id: string | null;
  body: string;
  helpful_count: number;
  comment_count: number;
  image_paths: string[] | null;
  created_at: string;
}

export interface PostComment {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  author_display_name: string;
  author_avatar_path: string | null;
  author_status: UserStatusEnum;
  author_is_verified: boolean;
}

const COMMENT_SELECT = `
  id,
  body,
  created_at,
  author_id,
  profiles!comments_author_id_fkey (
    username,
    display_name,
    avatar_path,
    current_status,
    is_verified
  )
`;

// Hard cap per comment thread. Threads are rendered inline (unvirtualized),
// so an unbounded fetch would grow both transfer size and DOM cost without
// limit; 300 comfortably exceeds any realistic thread today.
const COMMENTS_HARD_CAP = 300;

function mapComment(row: any): PostComment {
  return {
    id: row.id,
    body: row.body,
    created_at: row.created_at,
    author_id: row.author_id,
    author_display_name: row.profiles?.display_name || "User",
    author_avatar_path: row.profiles?.avatar_path || null,
    author_status: row.profiles?.current_status || "undergraduate",
    author_is_verified: row.profiles?.is_verified || false,
  };
}

/**
 * Resolves the caller's id from the local session (no network round-trip).
 * The comments INSERT RLS policy requires author_id = auth.uid(); an
 * omitted column is rejected as a permission error, so it must be explicit.
 */
async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) {
    throw Object.assign(new Error("You need to sign in to do that."), {
      code: "APP_ERROR",
    });
  }
  return userId;
}

export const PostsService = {
  async createPost(input: {
    body: string;
    topic_ids?: string[];
    community_id?: string | null;
    media_paths?: string[];
    visibility?: "public" | "community" | "unlisted" | "removed";
  }): Promise<{ id: string }> {
    const { data: postId, error } = await supabase.rpc("rpc_create_post", {
      p_body: input.body,
      p_community_id: input.community_id || null,
      p_topic_ids: input.topic_ids || [],
      p_image_paths: input.media_paths || [],
      p_visibility: (input.visibility as any) || "public",
    });
    if (error) throw error;
    return { id: postId as string };
  },

  async getPostById(id: string): Promise<PostDetail> {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id,
        author_id,
        community_id,
        body,
        helpful_count,
        comment_count,
        image_paths,
        created_at,
        profiles!posts_author_id_fkey (
          username,
          display_name,
          avatar_path,
          current_status,
          is_verified
        )
      `
      )
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) throw error;
    return data as unknown as PostDetail;
  },

  async listComments(postId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("post_id", postId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(COMMENTS_HARD_CAP);

    if (error) throw error;
    return ((data || []) as any[]).map(mapComment);
  },

  /** Comments attached directly to a question thread. */
  async listQuestionComments(questionId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("question_id", questionId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(COMMENTS_HARD_CAP);

    if (error) throw error;
    return ((data || []) as any[]).map(mapComment);
  },

  /** Comments attached to a specific answer. */
  async listAnswerComments(answerId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from("comments")
      .select(COMMENT_SELECT)
      .eq("answer_id", answerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(COMMENTS_HARD_CAP);

    if (error) throw error;
    return ((data || []) as any[]).map(mapComment);
  },

  /**
   * Creates a comment against exactly one target. The DB CHECK constraint
   * `chk_comment_target_exclusive` enforces the single-target rule.
   */
  async createComment(input: {
    postId?: string;
    questionId?: string;
    answerId?: string;
    body: string;
  }): Promise<{ id: string }> {
    if (!input.postId && !input.questionId && !input.answerId) {
      throw Object.assign(new Error("A comment target is required."), { code: "APP_ERROR" });
    }

    const authorId = await requireUserId();

    // Exactly one of post_id/question_id/answer_id may be set — enforced
    // server-side by chk_comment_target_exclusive; the others stay NULL.
    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: input.postId ?? null,
        question_id: input.questionId ?? null,
        answer_id: input.answerId ?? null,
        author_id: authorId,
        body: input.body,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data;
  },

  /** Public posts by a specific author (profile screens). */
  async listUserPosts(authorId: string, limit = 20): Promise<PostListItem[]> {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id, author_id, community_id, body, helpful_count, comment_count, image_paths, created_at,
        profiles!posts_author_id_fkey (
          username, display_name, avatar_path, current_status, is_verified
        )
      `
      )
      .eq("author_id", authorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data as any[]) || []).map((p) => ({
      id: p.id,
      author_id: p.author_id,
      author_username: p.profiles?.username ?? "",
      author_display_name: p.profiles?.display_name ?? "User",
      author_avatar_path: p.profiles?.avatar_path ?? null,
      author_status: p.profiles?.current_status ?? "undergraduate",
      author_is_verified: p.profiles?.is_verified ?? false,
      community_id: p.community_id,
      body: p.body,
      helpful_count: p.helpful_count ?? 0,
      comment_count: p.comment_count ?? 0,
      image_paths: p.image_paths,
      created_at: p.created_at,
    }));
  },

  /** Discussion posts published inside a specific community. */
  async listCommunityPosts(communityId: string, limit = 20): Promise<PostListItem[]> {
    const { data, error } = await supabase
      .from("posts")
      .select(
        `
        id, author_id, community_id, body, helpful_count, comment_count, image_paths, created_at,
        profiles!posts_author_id_fkey (
          username, display_name, avatar_path, current_status, is_verified
        )
      `
      )
      .eq("community_id", communityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data as any[]) || []).map((p) => ({
      id: p.id,
      author_id: p.author_id,
      author_username: p.profiles?.username ?? "",
      author_display_name: p.profiles?.display_name ?? "User",
      author_avatar_path: p.profiles?.avatar_path ?? null,
      author_status: p.profiles?.current_status ?? "undergraduate",
      author_is_verified: p.profiles?.is_verified ?? false,
      community_id: p.community_id,
      body: p.body,
      helpful_count: p.helpful_count ?? 0,
      comment_count: p.comment_count ?? 0,
      image_paths: p.image_paths,
      created_at: p.created_at,
    }));
  },
};

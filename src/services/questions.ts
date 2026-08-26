import { supabase } from "@/lib/supabase";
import { AnswerCardData } from "@/components/domain/AnswerCard";
import {
  QuestionStatusEnum,
  UserStatusEnum,
  QuestionDetailRecord,
} from "@/types/database";

export type FeedFilter = "all" | "unsolved" | "following" | "university";

/** Raw row shape returned by the get_home_feed RPC. */
export interface FeedRow {
  item_type: "question" | "post";
  id: string;
  author_id: string | null;
  author_username: string;
  author_display_name: string;
  author_avatar_path: string | null;
  author_status: UserStatusEnum;
  author_is_verified: boolean;
  title: string;
  body: string;
  status: QuestionStatusEnum;
  answer_count: number;
  helpful_count: number;
  comment_count: number;
  image_paths: string[] | null;
  created_at: string;
  is_helpful: boolean;
  is_bookmarked: boolean;
}

const FEED_PAGE_SIZE = 20;
const ANSWERS_HARD_CAP = 200;

/** Compact question shape for profile lists (see listUserQuestions). */
export interface QuestionListItem {
  id: string;
  author_id: string | null;
  author_username: string;
  author_display_name: string;
  author_avatar_path: string | null;
  author_status: UserStatusEnum;
  author_is_verified: boolean;
  title: string;
  body: string;
  status: QuestionStatusEnum;
  answer_count: number;
  helpful_count: number;
  created_at: string;
}

/**
 * Resolves the caller's id from the local session (no network round-trip).
 * Direct-table INSERTs must supply author_id explicitly — the RLS policies
 * use WITH CHECK ((select auth.uid()) = author_id), so an omitted column is
 * rejected as a permission error instead of being stamped server-side.
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

function mapFallbackQuestion(q: any): FeedRow {
  return {
    item_type: "question",
    id: q.id,
    author_id: q.author_id,
    author_username: q.profiles?.username || "scholar",
    author_display_name: q.profiles?.display_name || "Academic Scholar",
    author_avatar_path: q.profiles?.avatar_path || null,
    author_status: q.profiles?.current_status || "undergraduate",
    author_is_verified: q.profiles?.is_verified || false,
    title: q.title,
    body: q.body,
    status: q.status as QuestionStatusEnum,
    answer_count: q.answer_count || 0,
    helpful_count: q.helpful_count || 0,
    comment_count: 0,
    image_paths: null,
    created_at: q.created_at,
    is_helpful: false,
    is_bookmarked: false,
  };
}

export const QuestionsService = {
  /**
   * Keyset-paginated home feed (questions + public posts merged).
   * Falls back to a plain table query ONLY when the RPC itself is missing
   * from the database (fresh/partial deploys) — any other error surfaces so
   * screens can render an error state instead of silently showing wrong data.
   */
  async getFeed(
    filter: FeedFilter = "all",
    cursorCreatedAt?: string,
    cursorId?: string
  ): Promise<FeedRow[]> {
    const { data, error } = await supabase.rpc("get_home_feed", {
      p_filter: filter,
      p_limit: FEED_PAGE_SIZE,
      p_cursor_created_at: cursorCreatedAt || null,
      p_cursor_id: cursorId || null,
    });

    if (!error) return ((data || []) as unknown) as FeedRow[];

    // PGRST202 = function not found in schema cache → safe to degrade.
    if (error.code === "PGRST202") {
      let query = supabase
        .from("questions")
        .select(
          `
          id,
          author_id,
          title,
          body,
          status,
          answer_count,
          helpful_count,
          created_at,
          profiles!questions_author_id_fkey (
            username,
            display_name,
            avatar_path,
            current_status,
            is_verified
          )
        `
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(FEED_PAGE_SIZE);

      if (filter === "unsolved") {
        query = query.eq("status", "open");
      }

      const { data: fallbackData, error: fallbackError } = await query;
      if (fallbackError) throw fallbackError;
      return (fallbackData || []).map(mapFallbackQuestion);
    }

    throw error;
  },

  // Fetch a single question by ID
  async getQuestionById(id: string): Promise<QuestionDetailRecord> {
    const { data, error } = await supabase
      .from("questions")
      .select(
        `
        id,
        author_id,
        community_id,
        title,
        body,
        status,
        accepted_answer_id,
        solved_at,
        answer_count,
        helpful_count,
        image_paths,
        created_at,
        profiles!questions_author_id_fkey (
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
    return data as unknown as QuestionDetailRecord;
  },

  // Create a new question (author identity comes from the JWT server-side)
  async createQuestion(input: {
    title: string;
    body: string;
    topic_ids: string[];
    community_id?: string;
    media_paths?: string[];
  }): Promise<{ id: string }> {
    const { data: questionId, error: qError } = await supabase.rpc("rpc_create_question", {
      p_title: input.title,
      p_body: input.body,
      p_community_id: input.community_id || null,
      p_topic_ids: input.topic_ids || [],
      p_image_paths: input.media_paths || [],
    });

    if (qError) throw qError;

    return { id: questionId as string };
  },

  // Fetch answers for a question
  async getAnswers(questionId: string): Promise<AnswerCardData[]> {
    const { data, error } = await supabase
      .from("answers")
      .select(
        `
        id,
        question_id,
        author_id,
        body,
        is_accepted,
        helpful_count,
        created_at,
        profiles!answers_author_id_fkey (
          username,
          display_name,
          avatar_path,
          current_status,
          is_verified,
          education (
            institution_name
          )
        )
      `)
      .eq("question_id", questionId)
      .is("deleted_at", null)
      .order("is_accepted", { ascending: false })
      .order("helpful_count", { ascending: false })
      .order("created_at", { ascending: true })
      // Hard cap: answers render in a FlashList but the fetch itself was
      // previously unbounded; 200 comfortably exceeds any realistic thread.
      .limit(ANSWERS_HARD_CAP);

    if (error) throw error;

    return ((data || []) as any[]).map((a) => ({
      id: a.id,
      question_id: a.question_id,
      author_id: a.author_id,
      author_display_name: a.profiles?.display_name || "Academic Contributor",
      author_avatar_path: a.profiles?.avatar_path || null,
      author_status: a.profiles?.current_status || "undergraduate",
      author_is_verified: a.profiles?.is_verified || false,
      institution_name: a.profiles?.education?.[0]?.institution_name || null,
      body: a.body,
      is_accepted: a.is_accepted,
      helpful_count: a.helpful_count || 0,
      created_at: a.created_at,
    }));
  },

  // Post an answer (author_id required by the answers INSERT RLS policy)
  async createAnswer(questionId: string, body: string): Promise<{ id: string }> {
    const authorId = await requireUserId();
    const { data, error } = await supabase
      .from("answers")
      .insert({
        question_id: questionId,
        author_id: authorId,
        body,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data;
  },

  // Public questions by a specific author (profile screens). Fixed page —
  // profiles show recent activity, not archives.
  async listUserQuestions(authorId: string, limit = 20): Promise<QuestionListItem[]> {
    const { data, error } = await supabase
      .from("questions")
      .select(
        `
        id, author_id, title, body, status, answer_count, helpful_count, created_at,
        profiles!questions_author_id_fkey (
          username, display_name, avatar_path, current_status, is_verified
        )
      `
      )
      .eq("author_id", authorId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data as any[]) || []).map((q) => ({
      id: q.id,
      author_id: q.author_id,
      author_username: q.profiles?.username ?? "",
      author_display_name: q.profiles?.display_name ?? "Scholar",
      author_avatar_path: q.profiles?.avatar_path ?? null,
      author_status: q.profiles?.current_status ?? "undergraduate",
      author_is_verified: q.profiles?.is_verified ?? false,
      title: q.title,
      body: q.body,
      status: q.status,
      answer_count: q.answer_count ?? 0,
      helpful_count: q.helpful_count ?? 0,
      created_at: q.created_at,
    }));
  },

  // Accept an answer as solved (RPC)
  async acceptAnswer(questionId: string, answerId: string) {
    const { error } = await supabase.rpc("accept_answer", {
      p_question_id: questionId,
      p_answer_id: answerId,
    });
    if (error) throw error;
  },

  // Toggle helpful reaction
  async toggleReaction(
    targetType: "question" | "answer" | "post" | "comment",
    targetId: string
  ): Promise<{ is_active: boolean; count: number }> {
    const { data, error } = await supabase.rpc("toggle_reaction", {
      p_target_type: targetType,
      p_target_id: targetId,
      p_reaction_type: "helpful",
    });
    if (error) throw error;
    return ((data as unknown) ?? { is_active: false, count: 0 }) as {
      is_active: boolean;
      count: number;
    };
  },

  /**
   * "Students also asked" — deterministic shared-topic ranking. Returns []
   * for questions with no topics rather than failing, so the detail screen
   * simply omits the rail.
   */
  async getRelatedQuestions(
    questionId: string,
    limit = 4
  ): Promise<
    {
      id: string;
      title: string;
      status: QuestionStatusEnum;
      answer_count: number;
      helpful_count: number;
      created_at: string;
      shared_topics: number;
    }[]
  > {
    try {
      const { data, error } = await supabase.rpc("get_related_questions", {
        p_question_id: questionId,
        p_limit: limit,
      });
      if (error) throw error;
      return (data || []) as any;
    } catch {
      // Related content is enhancement-only; never block the detail page.
      return [];
    }
  },
};

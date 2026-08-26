import { supabase } from "@/lib/supabase";
import { QuestionStatusEnum, UserStatusEnum } from "@/types/database";

export interface BookmarkItem {
  bookmark_id: string;
  item_type: "question" | "post";
  id: string;
  title: string | null;
  body: string;
  created_at: string;
  author_id: string | null;
  author_username: string;
  author_display_name: string;
  author_avatar_path: string | null;
  /** Real author badge data from the RPC — the UI previously fabricated these. */
  author_status: UserStatusEnum;
  author_is_verified: boolean;
  status: QuestionStatusEnum | null;
  answer_count: number;
  helpful_count: number;
  comment_count: number;
  image_paths: string[] | null;
  bookmarked_at: string;
}

export const BOOKMARKS_PAGE_SIZE = 30;

export interface BookmarksCursor {
  createdAt: string;
  id: string;
}

export const BookmarksService = {
  /**
   * Fetches one page of bookmarks, filtered SERVER-side by item type and
   * keyset-paginated on (bookmarked_at, bookmark_id). Previously this pulled
   * every bookmark of both types on every screen open and filtered in the
   * client — unbounded transfer that degraded linearly with saved items.
   */
  async getBookmarksPage(
    targetType: "question" | "post",
    cursor?: BookmarksCursor | null
  ): Promise<BookmarkItem[]> {
    const { data, error } = await supabase.rpc("rpc_get_user_bookmarks", {
      p_item_type: targetType,
      p_limit: BOOKMARKS_PAGE_SIZE,
      p_cursor_bookmarked_at: cursor?.createdAt ?? null,
      p_cursor_id: cursor?.id ?? null,
    });

    if (error) throw error;

    return ((data || []) as unknown) as BookmarkItem[];
  },

  /** Null once fewer than a full page is returned (end of list). */
  nextBookmarksCursor(rows: BookmarkItem[]): BookmarksCursor | null {
    if (!rows.length || rows.length < BOOKMARKS_PAGE_SIZE) return null;
    const last = rows[rows.length - 1];
    return { createdAt: last.bookmarked_at, id: last.bookmark_id };
  },

  async isBookmarked(targetType: "question" | "post", targetId: string, userId: string): Promise<boolean> {
    if (!userId || !targetId) return false;
    
    const query = supabase.from("bookmarks").select("id").eq("user_id", userId);
    const filteredQuery = targetType === "question"
      ? query.eq("question_id", targetId)
      : query.eq("post_id", targetId);
    
    const { data, error } = await filteredQuery.maybeSingle();

    if (error) return false;
    return Boolean(data);
  },

  async toggleBookmark(targetType: "question" | "post", targetId: string, userId: string): Promise<boolean> {
    if (!userId || !targetId) throw new Error("Authentication required");
    
    const query = supabase.from("bookmarks").select("id").eq("user_id", userId);
    const filteredQuery = targetType === "question"
      ? query.eq("question_id", targetId)
      : query.eq("post_id", targetId);
    
    const { data: existing } = await filteredQuery.maybeSingle<{ id: string }>();

    if (existing) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from("bookmarks")
        .insert({
          user_id: userId,
          question_id: targetType === "question" ? targetId : null,
          post_id: targetType === "post" ? targetId : null,
        });
      if (error) throw error;
      return true;
    }
  },
};

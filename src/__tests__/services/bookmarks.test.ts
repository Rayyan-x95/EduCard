import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookmarksService, BOOKMARKS_PAGE_SIZE } from "@/services/bookmarks";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe("BookmarksService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches one keyset-paginated page filtered server-side by item type", async () => {
    const mockData = [
      {
        bookmark_id: "b-1",
        item_type: "question",
        id: "q-1",
        title: "Question Title",
        body: "Body",
      },
    ];

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: mockData,
      error: null,
    } as any);

    const questions = await BookmarksService.getBookmarksPage("question");
    expect(supabase.rpc).toHaveBeenCalledWith("rpc_get_user_bookmarks", {
      p_item_type: "question",
      p_limit: BOOKMARKS_PAGE_SIZE,
      p_cursor_bookmarked_at: null,
      p_cursor_id: null,
    });
    expect(questions).toHaveLength(1);
    expect(questions[0].id).toBe("q-1");
  });

  it("returns no cursor when the page is short (end of list)", () => {
    const rows = [
      { bookmark_id: "b-1", bookmarked_at: "2026-08-26T00:00:00Z" },
    ] as any;
    expect(BookmarksService.nextBookmarksCursor(rows)).toBeNull();
  });

  it("derives a cursor from the last row of a full page", () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      bookmark_id: `b-${i}`,
      bookmarked_at: "2026-08-26T00:00:00Z",
    })) as any;
    const cursor = BookmarksService.nextBookmarksCursor(rows);
    expect(cursor).toEqual({
      createdAt: "2026-08-26T00:00:00Z",
      id: "b-29",
    });
  });

  it("checks if item is bookmarked via query", async () => {
    const maybeSingleMock = vi.fn().mockResolvedValue({ data: { id: "b-1" }, error: null });
    const eqTargetMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
    const eqUserMock = vi.fn().mockReturnValue({ eq: eqTargetMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqUserMock });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    const isBookmarked = await BookmarksService.isBookmarked("question", "q-1", "u-1");
    expect(isBookmarked).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TopicsService } from "@/services/topics";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("TopicsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns topics from supabase when available", async () => {
    const mockTopics = [
      { id: "t-1", name: "Computer Science", slug: "cs", description: "Desc", icon_name: "code" },
    ];
    const orderMock = vi.fn().mockResolvedValue({ data: mockTopics, error: null });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    const result = await TopicsService.getTopics();
    expect(result).toEqual(mockTopics);
  });

  it("returns an EMPTY array (never fabricated ids) when query fails", async () => {
    const orderMock = vi.fn().mockResolvedValue({ data: null, error: new Error("Network error") });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });

    vi.mocked(supabase.from).mockReturnValue({
      select: selectMock,
    } as any);

    const result = await TopicsService.getTopics();
    expect(result).toEqual([]);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { FollowsService } from "@/services/follows";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("FollowsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false when the user follows themselves", async () => {
    const result = await FollowsService.isFollowing("u-1", "u-1");
    expect(result).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("toggles follow on when not yet following", async () => {
    // isFollowing → no row
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      }),
    }) as any);
    // upsert (idempotent follow — duplicate taps become no-ops)
    const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.from).mockImplementationOnce(() => ({ upsert: upsertMock }) as any);

    const result = await FollowsService.toggleFollow("u-1", "u-2");
    expect(result).toBe(true);
    expect(upsertMock).toHaveBeenCalledWith(
      { follower_id: "u-1", following_id: "u-2" },
      { onConflict: "follower_id,following_id", ignoreDuplicates: true }
    );
  });

  it("toggles follow off when already following", async () => {
    // isFollowing → row exists
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: { follower_id: "u-1" } }),
          }),
        }),
      }),
    }) as any);

    const terminal = Promise.resolve({ data: null, error: null });
    const eqSecond = vi.fn(() => terminal);
    const eqFirst = vi.fn(() => ({ eq: eqSecond }));
    const deleteMock = vi.fn(() => ({ eq: eqFirst }));
    vi.mocked(supabase.from).mockImplementationOnce(() => ({ delete: deleteMock }) as any);

    const result = await FollowsService.toggleFollow("u-1", "u-2");
    expect(result).toBe(false);
    expect(deleteMock).toHaveBeenCalled();
    expect(eqFirst).toHaveBeenCalledWith("follower_id", "u-1");
    expect(eqSecond).toHaveBeenCalledWith("following_id", "u-2");
  });
});

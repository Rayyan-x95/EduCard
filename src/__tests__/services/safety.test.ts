import { describe, it, expect, vi, beforeEach } from "vitest";
import { SafetyService } from "@/services/safety";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe("SafetyService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits content report with correct polymorphic fields", async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      insert: insertMock,
    } as any);

    await SafetyService.reportContent({
      reporterId: "user-1",
      targetType: "question",
      targetId: "q-1",
      reason: "academic_dishonesty",
      details: "Plagiarism observed in question body",
    });

    expect(supabase.from).toHaveBeenCalledWith("reports");
    expect(insertMock).toHaveBeenCalledWith({
      reporter_id: "user-1",
      reason: "academic_dishonesty",
      details: "Plagiarism observed in question body",
      question_id: "q-1",
      answer_id: null,
      post_id: null,
      comment_id: null,
      profile_id: null,
    });
  });

  it("blocks user idempotently (duplicate block is a no-op)", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue({
      upsert: upsertMock,
    } as any);

    await SafetyService.blockUser("user-2", "user-1");
    expect(supabase.from).toHaveBeenCalledWith("blocks");
    expect(upsertMock).toHaveBeenCalledWith(
      { blocked_id: "user-2", blocker_id: "user-1" },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true }
    );
  });
});

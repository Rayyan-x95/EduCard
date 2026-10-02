import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionsService } from "@/services/questions";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "user-test" } } },
      }),
    },
  },
}));

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: any = {
    select: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    is: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("QuestionsService.findSimilarQuestions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty array immediately if raw query is shorter than 5 characters", async () => {
    const res = await QuestionsService.findSimilarQuestions("how ");
    expect(res).toEqual([]);
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("sanitizes punctuation characters before querying FTS RPC", async () => {
    const mockFts = [
      { id: "q-1", title: "React performance optimization", status: "solved", answer_count: 3 },
    ];
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockFts, error: null } as any);

    const res = await QuestionsService.findSimilarQuestions("React(performance),%_optimization*\\");
    expect(supabase.rpc).toHaveBeenCalledWith("search_questions_fts", {
      p_query: "Reactperformanceoptimization",
      p_limit: 4,
    });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("q-1");
    expect(res[0].status).toBe("solved");
    expect(res[0].answer_count).toBe(3);
  });

  it("falls back to ilike query when FTS returns empty results", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as any);

    const fallbackQuestions = [
      { id: "q-fallback", title: "How to fix Redux hydration error?", status: "open", answer_count: 1 },
    ];
    const chain = makeChain({ data: fallbackQuestions, error: null });
    vi.mocked(supabase.from).mockReturnValue(chain as any);

    const res = await QuestionsService.findSimilarQuestions("Redux hydration error");
    expect(chain.ilike).toHaveBeenCalledWith("title", "%Redux hydration error%");
    expect(chain.is).toHaveBeenCalledWith("deleted_at", null);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe("q-fallback");
  });

  it("gracefully catches RPC/network errors and returns an empty list without throwing", async () => {
    vi.mocked(supabase.rpc).mockRejectedValueOnce(new Error("Network timeout"));
    const res = await QuestionsService.findSimilarQuestions("Network fail safe test");
    expect(res).toEqual([]);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchService } from "@/services/search";
import { supabase } from "@/lib/supabase";

/**
 * These tests exercise the REAL SearchService.searchAll — including its
 * production sanitization regex — through a mocked Supabase client. The
 * previous version of this file re-implemented the sanitizer inline and had
 * drifted (it forgot `_`, the service strips it).
 */
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

/** Thenable PostgREST-style chain builder. */
function makeChain(result: { data: unknown; error: unknown }) {
  const chain: any = {
    select: vi.fn(() => chain),
    ilike: vi.fn(() => chain),
    is: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("SearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("short-circuits empty queries and single characters without touching the DB", async () => {
    for (const q of ["", "   ", "a", "  b  "]) {
      const res = await SearchService.searchAll(q);
      expect(res.questions).toHaveLength(0);
      expect(res.communities).toHaveLength(0);
      expect(res.profiles).toHaveLength(0);
    }
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("sends the sanitized query to the FTS RPC (strips () , . % \\ * _)", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [{ id: "q-1", title: "Test", body: "Body", status: "open", answer_count: 0, helpful_count: 0, created_at: "" }],
      error: null,
    } as any);

    const communitiesChain = makeChain({ data: [], error: null });
    const profilesChain = makeChain({ data: [], error: null });
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "communities") return communitiesChain;
      return profilesChain;
    }) as any);

    await SearchService.searchAll("test(id.eq.1),secret");

    // The production regex also removes underscores — the drifted inline
    // copy in the old shadow test did not.
    expect(supabase.rpc).toHaveBeenCalledWith("search_questions_fts", {
      p_query: "testideq1secret",
      p_limit: 10,
    });
    expect(communitiesChain.ilike).toHaveBeenCalledWith("name", "%testideq1secret%");
  });

  it("strips SQL wildcards so users cannot probe arbitrary patterns", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [{ id: "q-1" }], error: null } as any);
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [], error: null }) as any);

    await SearchService.searchAll("100%%_done");

    expect(supabase.rpc).toHaveBeenCalledWith("search_questions_fts", {
      p_query: "100done",
      p_limit: 10,
    });
  });

  it("truncates queries longer than 100 characters before querying", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [{ id: "q-1" }], error: null } as any);
    vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [], error: null }) as any);

    await SearchService.searchAll("a".repeat(150));

    const arg = vi.mocked(supabase.rpc).mock.calls[0][1] as { p_query: string };
    expect(arg.p_query.length).toBe(100);
  });

  it("falls back to an ilike title query when FTS yields nothing", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as any);
    const questionsChain = makeChain({
      data: [{ id: "q-fallback", title: "Raft consensus", body: "", status: "open", created_at: "" }],
      error: null,
    });
    vi.mocked(supabase.from).mockImplementation(((table: string) =>
      table === "questions" ? questionsChain : makeChain({ data: [], error: null })
    ) as any);

    const res = await SearchService.searchAll("raft");

    expect(questionsChain.ilike).toHaveBeenCalledWith("title", "%raft%");
    expect(res.questions).toHaveLength(1);
    expect(res.questions[0].id).toBe("q-fallback");
  });

  it("queries the topics catalog and returns matched topics (FINDING-04)", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as any);
    const topicsChain = makeChain({
      data: [
        { id: "t-1", name: "Computer Science", slug: "computer-science", description: "" },
      ],
      error: null,
    });
    vi.mocked(supabase.from).mockImplementation(((table: string) =>
      table === "topics" ? topicsChain : makeChain({ data: [], error: null })
    ) as any);

    const res = await SearchService.searchAll("computer");

    expect(topicsChain.ilike).toHaveBeenCalledWith("name", "%computer%");
    expect(res.topics).toHaveLength(1);
    expect(res.topics[0].slug).toBe("computer-science");
  });

  it("deduplicates profiles matched by both username and display name", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as any);

    const profileRow = { id: "u-1", username: "ana", display_name: "Ana Scholar", avatar_path: null, current_status: "alumni", is_verified: true };
    let call = 0;
    vi.mocked(supabase.from).mockImplementation(((table: string) => {
      if (table === "questions") return makeChain({ data: [], error: null });
      if (table === "communities") return makeChain({ data: [], error: null });
      call += 1;
      return makeChain({ data: [profileRow], error: null }); // both profile queries hit same row
    }) as any);

    const res = await SearchService.searchAll("ana");
    expect(call).toBeGreaterThanOrEqual(2);
    expect(res.profiles).toHaveLength(1);
    expect(res.profiles[0].id).toBe("u-1");
  });
});

import { supabase } from "@/lib/supabase";

export interface SearchResults {
  questions: any[];
  communities: any[];
  profiles: any[];
  topics: any[];
}

export const SearchService = {
  async searchAll(queryText: string): Promise<SearchResults> {
    const rawQuery = queryText.trim();
    if (!rawQuery || rawQuery.length < 2) {
      return { questions: [], communities: [], profiles: [], topics: [] };
    }

    // Limit maximum length to prevent malicious DB load
    const cleanQuery = rawQuery.slice(0, 100);
    // Sanitize PostgREST filter control characters and SQL wildcards
    // Strips: () , . % \ * _ to prevent filter injection and wildcard abuse
    const safeFilter = cleanQuery.replace(/[(),.%\\*_]/g, "");

    if (!safeFilter || safeFilter.length < 2) {
      return { questions: [], communities: [], profiles: [], topics: [] };
    }

    const likePattern = `%${safeFilter}%`;

    // Try Full-Text Search RPC for questions first, fallback to ilike
    const fetchQuestions = async () => {
      try {
        const { data, error } = await supabase.rpc("search_questions_fts", {
          p_query: safeFilter,
          p_limit: 10,
        });
        if (!error && data && data.length > 0) {
          return { data };
        }
      } catch {
        // Fallback to direct query
      }

      return supabase
        .from("questions")
        .select("id, title, body, status, created_at")
        .ilike("title", likePattern)
        .is("deleted_at", null)
        .limit(10);
    };

    const [questionsRes, communitiesRes, topicsRes, profilesByUsernameRes, profilesByNameRes] =
      await Promise.all([
        fetchQuestions(),
        supabase
          .from("communities")
          .select("id, name, slug, description, member_count")
          .ilike("name", likePattern)
          .limit(10),
        // Topic search — the seeded catalog was previously unreachable via UI.
        supabase
          .from("topics")
          .select("id, name, slug, description")
          .ilike("name", likePattern)
          .limit(10),
        // Split profile search into two separate safe queries instead of
        // using .or() with string interpolation (prevents filter injection)
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_path, current_status, is_verified")
          .ilike("username", likePattern)
          .limit(10),
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_path, current_status, is_verified")
          .ilike("display_name", likePattern)
          .limit(10),
      ]);

    // Merge and deduplicate profile results
    const profileMap = new Map<string, any>();
    for (const p of (profilesByUsernameRes.data || []) as any[]) {
      profileMap.set(p.id, p);
    }
    for (const p of (profilesByNameRes.data || []) as any[]) {
      profileMap.set(p.id, p);
    }

    return {
      questions: questionsRes.data || [],
      communities: communitiesRes.data || [],
      topics: topicsRes.data || [],
      profiles: Array.from(profileMap.values()).slice(0, 10),
    };
  },
};

import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

export type CommunityRow = Database["public"]["Tables"]["communities"]["Row"];

export const CommunitiesService = {
  async listCommunities(limit = 50): Promise<CommunityRow[]> {
    const { data, error } = await supabase
      .from("communities")
      .select("*")
      .order("member_count", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getCommunityBySlug(slug: string) {
    const { data, error } = await supabase
      .from("communities")
      .select(
        `
        *,
        created_by_profile:profiles!communities_created_by_fkey (
          display_name,
          username
        )
      `
      )
      .eq("slug", slug)
      .single();

    if (error) throw error;
    return data;
  },

  async isMember(communityId: string, userId: string): Promise<boolean> {
    if (!communityId || !userId) return false;
    const { data } = await supabase
      .from("community_members")
      .select("user_id")
      .eq("community_id", communityId)
      .eq("user_id", userId)
      .maybeSingle();
    return Boolean(data);
  },

  async joinCommunity(communityId: string, userId: string): Promise<void> {
    // user_id is required by the schema (no default); the INSERT policy
    // verifies it matches auth.uid(), so a spoofed id is rejected server-side.
    // ignoreDuplicates makes a double-tap join idempotent (no-op) instead of
    // throwing the community_members PK violation at the user.
    const { error } = await supabase.from("community_members").upsert(
      {
        community_id: communityId,
        user_id: userId,
        role: "member",
      },
      { onConflict: "community_id,user_id", ignoreDuplicates: true }
    );
    if (error) throw error;
  },

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", userId);
    if (error) throw error;
  },

  /** Questions posted inside a community, newest first. */
  async listCommunityQuestions(communityId: string, limit = 20) {
    const { data, error } = await supabase
      .from("questions")
      .select(
        `
        id,
        title,
        body,
        status,
        answer_count,
        helpful_count,
        created_at
      `
      )
      .eq("community_id", communityId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async createCommunity(payload: {
    name: string;
    slug: string;
    description: string;
    rules?: string;
    topic_id?: string | null;
    university_id?: string | null;
  }): Promise<CommunityRow> {
    const { data: community, error: createError } = await supabase.rpc("rpc_create_community", {
      p_name: payload.name.trim(),
      p_slug: payload.slug.trim().toLowerCase(),
      p_description: payload.description.trim(),
      p_rules: payload.rules?.trim() || null,
      p_topic_id: payload.topic_id || null,
      p_university_id: payload.university_id || null,
    });

    if (createError) throw createError;
    return community as unknown as CommunityRow;
  },
};

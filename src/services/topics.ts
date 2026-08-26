import { supabase } from "@/lib/supabase";

export interface TopicRecord {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  icon_name?: string | null;
}

export const TopicsService = {
  /**
   * Returns the seeded topic catalog. On a database where seeds have not
   * run this returns an empty array — screens must treat topics as optional.
   * We deliberately do NOT fabricate placeholder ids client-side: fake UUIDs
   * used to cause FK violations in complete_onboarding / rpc_create_question
   * on fresh deployments.
   */
  async getTopics(): Promise<TopicRecord[]> {
    try {
      const { data, error } = await supabase
        .from("topics")
        .select("id, name, slug, description, icon_name")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  },
};

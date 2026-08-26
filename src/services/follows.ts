import { supabase } from "@/lib/supabase";
import { UserStatusEnum } from "@/types/database";

export interface FollowProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_path: string | null;
  current_status: UserStatusEnum;
  is_verified: boolean;
}

export const FollowsService = {
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    if (!followerId || !followingId || followerId === followingId) return false;
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    return Boolean(data);
  },

  async toggleFollow(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (!currentUserId || !targetUserId) {
      throw Object.assign(new Error("Please sign in first."), { code: "APP_ERROR" });
    }
    if (currentUserId === targetUserId) return false;

    const existing = await this.isFollowing(currentUserId, targetUserId);
    if (existing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);
      if (error) throw error;
      return false;
    }

    // Upsert-with-ignore makes the follow idempotent: a double-tap or a
    // concurrent duplicate insert becomes a no-op instead of surfacing a
    // PK-violation error. The follow-notification trigger fires on INSERT
    // only, so the ignored duplicate cannot create a second notification.
    const { error } = await supabase
      .from("follows")
      .upsert(
        { follower_id: currentUserId, following_id: targetUserId },
        { onConflict: "follower_id,following_id", ignoreDuplicates: true }
      );
    if (error) throw error;
    return true;
  },

  /** People this user follows (for profile pages). */
  async listFollowing(userId: string, limit = 20): Promise<FollowProfile[]> {
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        following:profiles!follows_following_id_fkey (
          id,
          username,
          display_name,
          avatar_path,
          current_status,
          is_verified
        )
      `
      )
      .eq("follower_id", userId)
      .limit(limit);

    if (error) throw error;
    return ((data || []) as any[]).map((row) => row.following).filter(Boolean);
  },

  /** People who follow this user. */
  async listFollowers(userId: string, limit = 20): Promise<FollowProfile[]> {
    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        follower:profiles!follows_follower_id_fkey (
          id,
          username,
          display_name,
          avatar_path,
          current_status,
          is_verified
        )
      `
      )
      .eq("following_id", userId)
      .limit(limit);

    if (error) throw error;
    return ((data || []) as any[]).map((row) => row.follower).filter(Boolean);
  },

  /** Exact counts in one round-trip each; cheap via the follows PK indexes. */
  async getCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    return {
      followers: followersRes.count ?? 0,
      following: followingRes.count ?? 0,
    };
  },
};

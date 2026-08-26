import { supabase } from "@/lib/supabase";
import { ReportReasonEnum } from "@/types/database";

export interface BlockedUser {
  blocked_id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  created_at: string;
}

export type VerificationType = "student_email" | "alumni_diploma" | "professional_id" | "mentor_credential";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected" | "revoked";

export interface VerificationRequest {
  id: string;
  verification_type: VerificationType;
  status: VerificationStatus;
  institutional_email: string | null;
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ModerationReportRow {
  id: string;
  reporter_id: string;
  post_id: string | null;
  question_id: string | null;
  answer_id: string | null;
  comment_id: string | null;
  profile_id: string | null;
  reason: string;
  details: string | null;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  created_at: string;
  reporter?: {
    username: string | null;
    display_name: string | null;
    avatar_path: string | null;
  } | null;
}

export const SafetyService = {
  /**
   * Moderator queue: pending reports, newest first. RLS scopes this to
   * moderators/admins; non-mods get an empty list (not an error) because
   * the SELECT policy filters rows rather than raising.
   */
  async getPendingReports(limit = 50) {
    const { data, error } = await supabase
      .from("reports")
      .select(
        `
        id,
        reporter_id,
        post_id,
        question_id,
        answer_id,
        comment_id,
        profile_id,
        reason,
        details,
        status,
        created_at,
        reporter:profiles!reports_reporter_id_fkey (
          username,
          display_name,
          avatar_path
        )
      `
      )
      .in("status", ["pending", "investigating"])
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as ModerationReportRow[];
  },

  /**
   * Execute a moderation action via the SECURITY DEFINER RPC. The DB
   * verifies moderator privileges; audit logging happens server-side.
   */
  async executeModerationAction(input: {
    reportId: string | null;
    targetType: "post" | "question" | "answer" | "comment" | "profile";
    targetId: string;
    action:
      | "content_removed"
      | "content_flagged"
      | "user_warned"
      | "user_restricted"
      | "user_suspended"
      | "user_banned"
      | "report_dismissed";
    reason: string;
  }) {
    const { error } = await supabase.rpc("execute_moderation_action", {
      p_report_id: input.reportId,
      p_target_type: input.targetType,
      p_target_id: input.targetId,
      p_action: input.action,
      p_reason: input.reason,
    });
    if (error) throw error;
  },

  /** Is the current session a moderator or admin? */
  async amIModerator(): Promise<boolean> {
    try {
      const { data } = await supabase.rpc("is_moderator");
      return Boolean(data);
    } catch {
      return false;
    }
  },

  async reportContent(params: {
    reporterId: string;
    targetType: "post" | "question" | "answer" | "comment" | "profile";
    targetId: string;
    reason: ReportReasonEnum;
    details?: string;
  }) {
    // reporter_id is a NOT NULL column without default; the INSERT policy
    // (WITH CHECK reporter_id = auth.uid()) rejects spoofed values anyway.
    const payload = {
      reporter_id: params.reporterId,
      reason: params.reason,
      details: params.details || null,
      question_id: params.targetType === "question" ? params.targetId : null,
      answer_id: params.targetType === "answer" ? params.targetId : null,
      post_id: params.targetType === "post" ? params.targetId : null,
      comment_id: params.targetType === "comment" ? params.targetId : null,
      profile_id: params.targetType === "profile" ? params.targetId : null,
    };

    const { error } = await supabase.from("reports").insert(payload);
    if (error) throw error;
  },

  async blockUser(blockedId: string, blockerId: string) {
    // blocker_id is NOT NULL without a default; RLS WITH CHECK rejects any
    // value that does not match auth.uid(). ignoreDuplicates makes repeated
    // block taps idempotent instead of throwing the blocks PK violation.
    const { error } = await supabase.from("blocks").upsert(
      { blocked_id: blockedId, blocker_id: blockerId },
      { onConflict: "blocker_id,blocked_id", ignoreDuplicates: true }
    );
    if (error) throw error;
  },

  async unblockUser(blockedId: string) {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocked_id", blockedId);
    if (error) throw error;
  },

  async getBlockedUsers(): Promise<BlockedUser[]> {
    const { data, error } = await supabase
      .from("blocks")
      .select(
        `
        blocked_id,
        created_at,
        blocked_profile:profiles!blocks_blocked_id_fkey (
          username,
          display_name,
          avatar_path
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    // The join is aliased as `blocked_profile` in the select above — read
    // that alias, not a nonexistent `profiles` key (which previously made
    // every blocked user render as an anonymous "Scholar" placeholder).
    return ((data || []) as any[]).map((row) => ({
      blocked_id: row.blocked_id,
      username: row.blocked_profile?.username ?? null,
      display_name: row.blocked_profile?.display_name ?? null,
      avatar_path: row.blocked_profile?.avatar_path ?? null,
      created_at: row.created_at,
    }));
  },

  async submitVerificationRequest(input: {
    userId: string;
    verificationType: VerificationType;
    institutionalEmail?: string;
    evidencePath?: string;
  }): Promise<{ id: string }> {
    // One open request at a time keeps the queue sane.
    const existing = await this.getMyVerificationRequests();
    if (existing.some((r) => r.status === "pending")) {
      throw Object.assign(new Error("You already have a pending verification request."), {
        code: "APP_ERROR",
      });
    }

    const { data, error } = await supabase
      .from("verification_requests")
      .insert({
        user_id: input.userId,
        verification_type: input.verificationType,
        institutional_email: input.institutionalEmail || null,
        evidence_path: input.evidencePath || null,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data;
  },

  async getMyVerificationRequests(): Promise<VerificationRequest[]> {
    const { data, error } = await supabase
      .from("verification_requests")
      .select(
        "id, verification_type, status, institutional_email, rejection_reason, created_at, reviewed_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as VerificationRequest[];
  },
};

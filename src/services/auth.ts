import { supabase } from "@/lib/supabase";
import { UserStatusEnum, Database } from "@/types/database";
import { normalizeError } from "@/lib/errors";

export interface OnboardingInput {
  username: string;
  displayName: string;
  countryCode: string;
  currentStatus: UserStatusEnum;
  institutionName: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number | null;
  topicIds: string[];
}

export const AuthService = {
  // Get active user profile (includes education history)
  async getCurrentProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        *,
        education (*)
      `
      )
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  /** Live availability check for the onboarding username field. */
  async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase.rpc("check_username_available", {
      p_username: username.toLowerCase().trim(),
    });
    if (error) throw error;
    return Boolean(data);
  },

  // Complete onboarding via RPC
  async completeOnboarding(input: OnboardingInput) {
    const { error } = await supabase.rpc("complete_onboarding", {
      p_username: input.username,
      p_display_name: input.displayName,
      p_country_code: input.countryCode,
      p_current_status: input.currentStatus,
      p_institution_name: input.institutionName,
      p_degree: input.degree,
      p_field: input.field,
      p_start_year: input.startYear,
      p_end_year: input.endYear || null,
      p_topic_ids: input.topicIds || [],
    });

    if (error) {
      // Onboarding's only realistic unique conflict is the username.
      if (
        error.code === "23505" ||
        /profiles_username_key|duplicate key.*username/i.test(error.message ?? "")
      ) {
        throw new Error("This username is already taken. Please choose another username.");
      }
      throw new Error(normalizeError(error).message);
    }
  },

  // Update Profile Settings
  async updateProfileSettings(
    userId: string,
    settings: Database["public"]["Tables"]["profiles"]["Update"]
  ) {
    const { error } = await supabase.from("profiles").update(settings).eq("id", userId);
    if (error) throw error;
  },

  /**
   * Re-sends the signup confirmation email for users stuck on the
   * "check your inbox" screen. Supabase rate-limits this server-side
   * (default: one per minute per address).
   */
  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Deletes the account via the GDPR RPC. The RPC removes the auth user and
   * the FK cascades wipe profile-owned rows.
   */
  async deleteAccount() {
    const { error: rpcError } = await supabase.rpc("delete_own_account");
    if (rpcError) {
      throw new Error(normalizeError(rpcError).message);
    }
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  },
};

import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "@/services/auth";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    auth: {
      signOut: vi.fn(),
    },
  },
}));

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls complete_onboarding RPC with structured input", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: null,
    } as any);

    await AuthService.completeOnboarding({
      username: "rayyan",
      displayName: "Rayyan M",
      countryCode: "US",
      currentStatus: "undergraduate",
      institutionName: "MIT",
      degree: "BSc",
      field: "Computer Science",
      startYear: 2022,
      endYear: 2026,
      topicIds: ["t-1", "t-2"],
    });

    expect(supabase.rpc).toHaveBeenCalledWith("complete_onboarding", {
      p_username: "rayyan",
      p_display_name: "Rayyan M",
      p_country_code: "US",
      p_current_status: "undergraduate",
      p_institution_name: "MIT",
      p_degree: "BSc",
      p_field: "Computer Science",
      p_start_year: 2022,
      p_end_year: 2026,
      p_topic_ids: ["t-1", "t-2"],
    });
  });

  it("throws friendly error message when username is already taken", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { code: "23505", message: "duplicate key value violates unique constraint" },
    } as any);

    await expect(
      AuthService.completeOnboarding({
        username: "taken_user",
        displayName: "Scholar",
        countryCode: "US",
        currentStatus: "undergraduate",
        institutionName: "Stanford",
        degree: "BA",
        field: "Physics",
        startYear: 2023,
        topicIds: [],
      })
    ).rejects.toThrow("This username is already taken. Please choose another username.");
  });

  it("calls delete_own_account RPC and signs out user", async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: null,
    } as any);
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
      error: null,
    } as any);

    await AuthService.deleteAccount();
    expect(supabase.rpc).toHaveBeenCalledWith("delete_own_account");
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});

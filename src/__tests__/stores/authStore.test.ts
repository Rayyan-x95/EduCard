import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAuthStore } from "@/stores/authStore";

vi.mock("@/lib/onboarding-cache", () => ({
  saveOnboardingFlag: vi.fn().mockResolvedValue(undefined),
  readOnboardingFlag: vi.fn().mockResolvedValue(null),
  clearOnboardingFlag: vi.fn().mockResolvedValue(undefined),
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    useAuthStore.getState().reset();
  });

  it("initializes with default empty state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.isOnboarded).toBe(false);
  });

  it("updates user, session and loading state", () => {
    const mockUser = { id: "u-123", email: "scholar@mit.edu" } as any;
    const mockSession = { user: mockUser, access_token: "xyz" } as any;

    useAuthStore.getState().setSession(mockSession);

    const state = useAuthStore.getState();
    expect(state.user?.id).toBe("u-123");
    expect(state.session?.access_token).toBe("xyz");
    expect(state.isLoading).toBe(false);
  });

  it("sets isOnboarded from the onboarding_completed flag", () => {
    const completedProfile = {
      id: "u-123",
      username: "scholar1",
      country_code: "US",
      onboarding_completed: true,
    } as any;
    useAuthStore.getState().setProfile(completedProfile);
    expect(useAuthStore.getState().isOnboarded).toBe(true);

    const incompleteProfile = {
      id: "u-123",
      username: "scholar1",
      country_code: "US",
      onboarding_completed: false,
    } as any;
    useAuthStore.getState().setProfile(incompleteProfile);
    expect(useAuthStore.getState().isOnboarded).toBe(false);
  });

  it("treats a missing onboarding_completed flag as not onboarded", () => {
    const legacyProfile = { id: "u-123", username: "scholar1", country_code: "US" } as any;
    useAuthStore.getState().setProfile(legacyProfile);
    expect(useAuthStore.getState().isOnboarded).toBe(false);
  });

  it("falls back to the cached flag when the profile fetch fails", () => {
    useAuthStore.getState().setOnboardingFallback("u-123", true);
    // No profile available (fetch failed) — the cache keeps the user onboarded.
    useAuthStore.getState().setProfile(null);
    expect(useAuthStore.getState().isOnboarded).toBe(true);

    // An authoritative profile always overrides the fallback.
    const completedProfile = {
      id: "u-123",
      username: "scholar1",
      country_code: "US",
      onboarding_completed: true,
    } as any;
    useAuthStore.getState().setProfile(completedProfile);
    expect(useAuthStore.getState().isOnboarded).toBe(true);

    const incompleteProfile = {
      id: "u-123",
      username: "scholar1",
      country_code: "US",
      onboarding_completed: false,
    } as any;
    useAuthStore.getState().setProfile(incompleteProfile);
    expect(useAuthStore.getState().isOnboarded).toBe(false);
  });

  it("does not let the fallback override an existing live profile", () => {
    const incompleteProfile = {
      id: "u-123",
      username: "scholar1",
      country_code: "US",
      onboarding_completed: false,
    } as any;
    useAuthStore.getState().setProfile(incompleteProfile);
    useAuthStore.getState().setOnboardingFallback("u-123", true);
    expect(useAuthStore.getState().isOnboarded).toBe(false);
  });
});

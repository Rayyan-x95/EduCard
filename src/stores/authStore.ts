import { create } from "zustand";
import { User, Session } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import {
  saveOnboardingFlag,
  clearOnboardingFlag,
} from "@/lib/onboarding-cache";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"] & {
  education?: Database["public"]["Tables"]["education"]["Row"][];
};

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isOnboarded: boolean;
  /**
   * Cached onboarding flag used when the profile itself cannot be fetched
   * (cold-start network failure). Prevents an onboarded user from being
   * demoted back into the onboarding wizard — which would otherwise let a
   * re-run of complete_onboarding insert duplicate education rows.
   */
  onboardingFallback: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setOnboardingFallback: (userId: string, value: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isOnboarded: false,
  onboardingFallback: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isLoading: false,
    }),
  setProfile: (profile) =>
    set((state) => {
      if (profile?.onboarding_completed && profile.id) {
        // Per-user key: two accounts on one device must never inherit
        // each other's cached flag.
        void saveOnboardingFlag(profile.id, true);
      }
      return {
        profile,
        // With no live profile, trust the cached fallback; otherwise the
        // authoritative server flag wins (including explicit `false`).
        isOnboarded: profile
          ? Boolean(profile.onboarding_completed)
          : state.onboardingFallback,
      };
    }),
  setOnboardingFallback: (userId, value) =>
    set((state) => ({
      onboardingFallback: value,
      ...(state.profile ? {} : { isOnboarded: value }),
    })),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => {
    void clearOnboardingFlag();
    set({
      user: null,
      session: null,
      profile: null,
      isLoading: false,
      isOnboarded: false,
      onboardingFallback: false,
    });
  },
}));

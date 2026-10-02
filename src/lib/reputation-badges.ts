import { UserStatusEnum } from "@/types/database";

export type BadgeCategory = "verification" | "reputation" | "milestone";

export interface AcademicBadge {
  id: string;
  name: string;
  category: BadgeCategory;
  description: string;
  iconName: "award" | "check-circle" | "sparkles" | "star";
  variant: "primary" | "secondary" | "tertiary" | "accent";
}

export interface ProfileBadgeInput {
  reputation_score?: number | null;
  is_verified?: boolean | null;
  current_status?: UserStatusEnum | string | null;
}

export const BADGE_DEFINITIONS: Record<string, AcademicBadge> = {
  VERIFIED_SCHOLAR: {
    id: "verified_scholar",
    name: "Verified Scholar",
    category: "verification",
    description: "Verified academic standing with confirmed university affiliation.",
    iconName: "check-circle",
    variant: "tertiary",
  },
  TOP_CONTRIBUTOR: {
    id: "top_contributor",
    name: "Top Contributor",
    category: "reputation",
    description: "Earned 100+ reputation through helpful answers and solutions.",
    iconName: "award",
    variant: "primary",
  },
  SOLUTION_MASTER: {
    id: "solution_master",
    name: "Solution Master",
    category: "reputation",
    description: "Earned 50+ reputation by providing authoritative accepted solutions.",
    iconName: "star",
    variant: "accent",
  },
  RISING_SCHOLAR: {
    id: "rising_scholar",
    name: "Rising Scholar",
    category: "milestone",
    description: "Earned 25+ reputation actively contributing to discussions.",
    iconName: "sparkles",
    variant: "secondary",
  },
};

/**
 * Deterministically computes earned badges for a user profile based on verifiable activity.
 */
export function getBadgesForProfile(profile: ProfileBadgeInput): AcademicBadge[] {
  const badges: AcademicBadge[] = [];
  const rep = profile.reputation_score ?? 0;

  // 1. Verification badge
  if (profile.is_verified || profile.current_status === "faculty" || profile.current_status === "mentor") {
    badges.push(BADGE_DEFINITIONS.VERIFIED_SCHOLAR);
  }

  // 2. Reputation tier badges (highest earned tier first)
  if (rep >= 100) {
    badges.push(BADGE_DEFINITIONS.TOP_CONTRIBUTOR);
  }
  if (rep >= 50) {
    badges.push(BADGE_DEFINITIONS.SOLUTION_MASTER);
  } else if (rep >= 25) {
    badges.push(BADGE_DEFINITIONS.RISING_SCHOLAR);
  }

  return badges;
}

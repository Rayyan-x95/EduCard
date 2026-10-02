import { describe, it, expect } from "vitest";
import { getBadgesForProfile } from "@/lib/reputation-badges";

describe("reputation-badges", () => {
  it("awards no badges for a brand new user with 0 rep and no verification", () => {
    const badges = getBadgesForProfile({ reputation_score: 0, is_verified: false, current_status: "undergraduate" });
    expect(badges).toEqual([]);
  });

  it("awards Verified Scholar badge if user is_verified is true", () => {
    const badges = getBadgesForProfile({ reputation_score: 10, is_verified: true, current_status: "undergraduate" });
    expect(badges).toHaveLength(1);
    expect(badges[0].id).toBe("verified_scholar");
  });

  it("awards Verified Scholar badge if user is mentor or faculty", () => {
    const mentorBadges = getBadgesForProfile({ reputation_score: 0, is_verified: false, current_status: "mentor" });
    expect(mentorBadges.map((b) => b.id)).toContain("verified_scholar");

    const facultyBadges = getBadgesForProfile({ reputation_score: 0, is_verified: false, current_status: "faculty" });
    expect(facultyBadges.map((b) => b.id)).toContain("verified_scholar");
  });

  it("awards Rising Scholar for reputation >= 25 but < 50", () => {
    const badges = getBadgesForProfile({ reputation_score: 30, is_verified: false });
    expect(badges.map((b) => b.id)).toContain("rising_scholar");
    expect(badges.map((b) => b.id)).not.toContain("solution_master");
  });

  it("awards Solution Master for reputation >= 50 and Top Contributor for reputation >= 100", () => {
    const masterBadges = getBadgesForProfile({ reputation_score: 75, is_verified: false });
    expect(masterBadges.map((b) => b.id)).toContain("solution_master");
    expect(masterBadges.map((b) => b.id)).not.toContain("top_contributor");

    const topBadges = getBadgesForProfile({ reputation_score: 120, is_verified: true });
    const ids = topBadges.map((b) => b.id);
    expect(ids).toContain("verified_scholar");
    expect(ids).toContain("top_contributor");
    expect(ids).toContain("solution_master");
  });
});

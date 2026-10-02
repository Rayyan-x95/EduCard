import { describe, it, expect } from "vitest";
import { KnowledgeGovernance, type KnowledgeItem, type ContributorTrustFactors } from "@/lib/knowledge-governance";

describe("KnowledgeGovernance", () => {
  const now = new Date("2026-09-15T12:00:00.000Z");

  describe("evaluateDecay", () => {
    it("classifies fresh, well-cited academic content as FRESH with score 0", () => {
      const item: KnowledgeItem = {
        id: "q-101",
        type: "ACADEMIC_EXPLANATION",
        createdAt: "2026-09-01T00:00:00.000Z", // ~14 days old
        citationsCount: 3,
        accepted: true,
        upvotes: 25,
        downvotes: 0,
        conflictReportsCount: 0,
      };

      const result = KnowledgeGovernance.evaluateDecay(item, now);
      expect(result.decayScore).toBe(0);
      expect(result.riskLevel).toBe("FRESH");
      expect(result.actionRequired).toBe("NONE");
    });

    it("triggers STALE with PEER_REVIEW when reports and age accumulate", () => {
      const item: KnowledgeItem = {
        id: "q-102",
        type: "FACTUAL_CLAIM",
        createdAt: "2025-09-01T00:00:00.000Z", // ~380 days old -> age penalty
        citationsCount: 0,
        accepted: false,
        upvotes: 5,
        downvotes: 4, // high downvote ratio (20)
        conflictReportsCount: 1, // 15 pts -> total score ~65 (STALE)
      };

      const result = KnowledgeGovernance.evaluateDecay(item, now);
      expect(result.decayScore).toBeGreaterThanOrEqual(50);
      expect(result.riskLevel).toBe("STALE");
      expect(result.actionRequired).toBe("PEER_REVIEW");
    });

    it("flags curriculum revisions as CURRICULUM_SYNC when critical", () => {
      const item: KnowledgeItem = {
        id: "q-103",
        type: "ACADEMIC_EXPLANATION",
        createdAt: "2024-01-01T00:00:00.000Z",
        citationsCount: 0,
        accepted: false,
        upvotes: 10,
        downvotes: 8,
        conflictReportsCount: 3,
        curriculumRevisionFlag: true,
      };

      const result = KnowledgeGovernance.evaluateDecay(item, now);
      expect(result.decayScore).toBeGreaterThanOrEqual(75);
      expect(result.riskLevel).toBe("EXPIRED");
      expect(result.actionRequired).toBe("CURRICULUM_SYNC");
    });
  });

  describe("calculateAcademicTrust", () => {
    it("awards high trust for verified academics with high acceptance rate", () => {
      const factors: ContributorTrustFactors = {
        isVerifiedAcademic: true,
        acceptedAnswerRate: 0.85,
        totalHelpfulVotes: 120,
        unresolvedReportsCount: 0,
        activeMonths: 12,
      };

      const trust = KnowledgeGovernance.calculateAcademicTrust(factors);
      // 50 (base) + 25 (verified) + 17 (acceptance) + 10 (tenure) + 15 (votes) = 100 (capped)
      expect(trust).toBeGreaterThanOrEqual(95);
    });

    it("substantially docks trust score for unresolved reports", () => {
      const factors: ContributorTrustFactors = {
        isVerifiedAcademic: false,
        acceptedAnswerRate: 0.2,
        totalHelpfulVotes: 5,
        unresolvedReportsCount: 2, // -40 pts
        activeMonths: 2,
      };

      const trust = KnowledgeGovernance.calculateAcademicTrust(factors);
      expect(trust).toBeLessThan(30);
    });
  });
});

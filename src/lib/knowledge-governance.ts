/**
 * Knowledge Governance & Academic Trust Engine — EduCard Phase 12
 *
 * Implements content classification, knowledge decay detection,
 * and multi-factor academic trust scoring.
 */

export type KnowledgeContentType =
  | "OPINION"
  | "FACTUAL_CLAIM"
  | "EXPERIENCE"
  | "ACADEMIC_EXPLANATION"
  | "SOURCE_BACKED"
  | "AI_ASSISTED";

export interface KnowledgeItem {
  id: string;
  type: KnowledgeContentType;
  createdAt: string;
  lastVerifiedAt?: string;
  citationsCount: number;
  accepted: boolean;
  upvotes: number;
  downvotes: number;
  conflictReportsCount: number;
  curriculumRevisionFlag?: boolean;
}

export interface DecayEvaluation {
  itemId: string;
  decayScore: number; // 0 (fresh) to 100 (critical decay)
  riskLevel: "FRESH" | "MONITOR" | "STALE" | "EXPIRED";
  reasons: string[];
  actionRequired: "NONE" | "PEER_REVIEW" | "CURRICULUM_SYNC" | "DEPRECATE";
}

export interface ContributorTrustFactors {
  isVerifiedAcademic: boolean;
  acceptedAnswerRate: number; // 0.0 to 1.0
  totalHelpfulVotes: number;
  unresolvedReportsCount: number;
  activeMonths: number;
}

export class KnowledgeGovernance {
  /**
   * Calculates knowledge decay score and determines if academic content requires re-verification.
   */
  static evaluateDecay(item: KnowledgeItem, now: Date = new Date()): DecayEvaluation {
    let decayScore = 0;
    const reasons: string[] = [];

    const createdTime = new Date(item.createdAt).getTime();
    const ageInDays = Math.max(0, (now.getTime() - createdTime) / (1000 * 60 * 60 * 24));

    // Age factor (gradual increase after 180 days, cap at 30 pts)
    if (ageInDays > 180) {
      const agePenalty = Math.min(30, Math.floor((ageInDays - 180) / 30) * 5);
      decayScore += agePenalty;
      reasons.push(`Content age is ${Math.round(ageInDays)} days without re-verification.`);
    }

    // Curriculum revision flag (+35 pts immediately)
    if (item.curriculumRevisionFlag) {
      decayScore += 35;
      reasons.push("Academic curriculum revision flagged for this subject area.");
    }

    // Unresolved conflict reports (+15 pts per report, cap at 45 pts)
    if (item.conflictReportsCount > 0) {
      const reportPenalty = Math.min(45, item.conflictReportsCount * 15);
      decayScore += reportPenalty;
      reasons.push(`${item.conflictReportsCount} conflicting peer report(s) filed.`);
    }

    // Negative sentiment ratio (downvotes > upvotes * 0.4)
    if (item.downvotes > 0 && item.downvotes > item.upvotes * 0.4) {
      decayScore += 20;
      reasons.push("High negative peer sentiment ratio detected.");
    }

    // Mitigation: Verified citations reduce decay score (-15 pts)
    if (item.citationsCount >= 2) {
      decayScore = Math.max(0, decayScore - 15);
    }

    // Mitigation: Accepted answer status reduces decay score (-10 pts)
    if (item.accepted) {
      decayScore = Math.max(0, decayScore - 10);
    }

    const boundedScore = Math.min(100, Math.max(0, decayScore));

    let riskLevel: "FRESH" | "MONITOR" | "STALE" | "EXPIRED";
    let actionRequired: "NONE" | "PEER_REVIEW" | "CURRICULUM_SYNC" | "DEPRECATE";

    if (boundedScore >= 75) {
      riskLevel = "EXPIRED";
      actionRequired = item.curriculumRevisionFlag ? "CURRICULUM_SYNC" : "DEPRECATE";
    } else if (boundedScore >= 50) {
      riskLevel = "STALE";
      actionRequired = "PEER_REVIEW";
    } else if (boundedScore >= 25) {
      riskLevel = "MONITOR";
      actionRequired = "NONE";
    } else {
      riskLevel = "FRESH";
      actionRequired = "NONE";
    }

    return {
      itemId: item.id,
      decayScore: boundedScore,
      riskLevel,
      reasons,
      actionRequired,
    };
  }

  /**
   * Computes a multi-factor Academic Trust Index (0 to 100).
   * Unlike popularity voting, this prioritizes acceptance rate, peer citations, and verification.
   */
  static calculateAcademicTrust(factors: ContributorTrustFactors): number {
    let trust = 50; // Neutral baseline

    // Verified academic credentials (+25 pts)
    if (factors.isVerifiedAcademic) {
      trust += 25;
    }

    // Accepted answer accuracy rate (up to +20 pts)
    trust += Math.round(factors.acceptedAnswerRate * 20);

    // Platform tenure consistency (+1 pt per active month, cap at +10 pts)
    trust += Math.min(10, factors.activeMonths);

    // Helpful peer evaluations (logarithmic scaling, cap at +15 pts)
    if (factors.totalHelpfulVotes > 0) {
      trust += Math.min(15, Math.round(Math.log10(factors.totalHelpfulVotes + 1) * 7.5));
    }

    // Heavy penalty for unresolved moderation / academic reports (-20 pts each)
    if (factors.unresolvedReportsCount > 0) {
      trust -= factors.unresolvedReportsCount * 20;
    }

    return Math.max(0, Math.min(100, trust));
  }
}

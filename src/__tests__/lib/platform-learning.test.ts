import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformLearningEngine,
  LearningEvent,
  PlatformDecision,
  CapacityBaseline,
  AcademicValueSignals,
  FeatureFlagAudit,
} from "@/lib/platform-learning";

describe("PlatformLearningEngine", () => {
  let engine: PlatformLearningEngine;

  beforeEach(() => {
    engine = new PlatformLearningEngine();
  });

  describe("Continuous Learning Loop & Decision Outcome Tracking", () => {
    it("processes an event, generates an insight, records a decision, and extracts a lesson", () => {
      const event: LearningEvent = {
        id: "evt_101",
        domain: "PERFORMANCE",
        source: "telemetry.query_latency",
        description: "Feed keyset query latency drifting upwards under exam week peak",
        timestamp: "2026-09-15T08:00:00Z",
      };

      const insight = engine.registerEventAndDeriveInsight(
        event,
        "Composite index (created_at DESC, id DESC) needs GIN trigram reindex",
        ["pg_stat_activity shows 65ms p95 latency", "table size exceeded 50K rows"],
        "HIGH"
      );

      expect(insight.id).toBeDefined();
      expect(insight.domain).toBe("PERFORMANCE");
      expect(insight.confidence).toBe("HIGH");

      const decision: PlatformDecision = {
        id: "dec_201",
        insightId: insight.id,
        title: "Rebuild derived feed index and tune work_mem",
        proposedAction: "Execute REINDEX CONCURRENTLY idx_feed_keyset",
        expectedOutcome: "Reduce p95 latency to under 45ms",
        targetMetric: "feed_p95_latency_ms",
        baselineValue: 65,
        expectedValue: 42,
        decidedBy: "Database Architect",
        status: "APPROVED",
        timestamp: "2026-09-15T08:30:00Z",
      };

      engine.recordDecision(decision);

      const evaluated = engine.evaluateDecisionOutcome(
        "dec_201",
        41, // Actual measured value: achieved 41ms (better than 42ms target)
        "REINDEX CONCURRENTLY eliminated index page bloat without locking write transactions."
      );

      expect(evaluated.status).toBe("EVALUATED");
      expect(evaluated.outcomeClass).toBe("SUCCESS");
      expect(evaluated.actualValue).toBe(41);
      expect(evaluated.lessonLearned).toContain("eliminated index page bloat");
    });

    it("classifies regression when decision worsens the baseline metric", () => {
      const decision: PlatformDecision = {
        id: "dec_regress",
        insightId: "ins_dummy",
        title: "Experimental client poll reduction",
        proposedAction: "Increase poll interval to 300s",
        expectedOutcome: "Lower battery usage without increasing perceived lag",
        targetMetric: "sync_lag_ms",
        baselineValue: 200,
        expectedValue: 150,
        decidedBy: "SRE Lead",
        status: "APPROVED",
        timestamp: "2026-09-15T09:00:00Z",
      };

      engine.recordDecision(decision);

      const evaluated = engine.evaluateDecisionOutcome(
        "dec_regress",
        1500, // Actual lag spiked to 1500ms
        "Over-aggressive polling reduction caused extreme message desynchronization."
      );

      expect(evaluated.outcomeClass).toBe("REGRESSION");
    });
  });

  describe("Engineering Knowledge Graph & Blast Radius Traversal", () => {
    it("traverses relational dependencies from home feed to database table and tests", () => {
      const blastRadius = engine.traverseBlastRadius("feat_home_feed");

      const nodeNames = blastRadius.map((n) => n.name);
      expect(nodeNames).toContain("Home Feed");
      expect(nodeNames).toContain("Questions Service");
      expect(nodeNames).toContain("get_home_feed");
      expect(nodeNames).toContain("questions");
      expect(nodeNames).toContain("questions_read_policy");
      expect(nodeNames).toContain("bookmarks.test.ts");
    });
  });

  describe("What-Breaks-First Capacity Simulation", () => {
    const baseline: CapacityBaseline = {
      concurrentUsers: 1000,
      dbPoolCapacity: 60,
      dbCurrentConnections: 25,
      feedQpsCapacity: 500,
      feedCurrentQps: 60,
      storageDailyEgressGb: 15,
      storageMaxEgressGb: 250,
    };

    it("identifies database connection pool as first bottleneck under 3x surge", () => {
      const simulation = engine.simulateWhatBreaksFirst(baseline, 3);

      expect(simulation.multiplier).toBe(3);
      expect(simulation.projectedUsers).toBe(3000);
      expect(simulation.firstBottleneck).toContain("PostgreSQL Connection Pool");
      expect(simulation.systemBreached).toBe(true); // 25 * 3 = 75 connections > 60 pool capacity
    });

    it("evaluates healthy capacity with headroom under 1.5x traffic increase", () => {
      const simulation = engine.simulateWhatBreaksFirst(baseline, 1.5);

      expect(simulation.systemBreached).toBe(false);
      expect(simulation.headroomPercentage).toBeGreaterThan(0);
    });
  });

  describe("Academic Value Multi-Signal Scoring", () => {
    it("computes EXCEPTIONAL tier score for high resolution and verified citations", () => {
      const signals: AcademicValueSignals = {
        acceptedAnswerCount: 10,
        peerReviewEndorsements: 10,
        citationVerificationRate: 0.95,
        knowledgeReuseVisits: 120,
        correctionQualityScore: 0.9,
      };

      const score = engine.calculateAcademicValue(signals);
      expect(score.compositeScore).toBeGreaterThanOrEqual(80);
      expect(score.utilityTier).toBe("EXCEPTIONAL");
      expect(score.primaryValueDriver).toBe("High accepted solution resolution");
    });

    it("correctly identifies LOW utility tier for unanswered questions with zero citations", () => {
      const signals: AcademicValueSignals = {
        acceptedAnswerCount: 0,
        peerReviewEndorsements: 1,
        citationVerificationRate: 0.0,
        knowledgeReuseVisits: 5,
        correctionQualityScore: 0.1,
      };

      const score = engine.calculateAcademicValue(signals);
      expect(score.compositeScore).toBeLessThan(40);
      expect(score.utilityTier).toBe("LOW");
    });
  });

  describe("Platform Anti-Bloat & Complexity Monitoring", () => {
    it("identifies stale feature flags older than 60 days for sunset", () => {
      const flags: FeatureFlagAudit[] = [
        { key: "exp_new_onboarding_v2", owner: "Product Lead", createdDaysAgo: 75, isStale: false, sunsetRecommended: false },
        { key: "feat_latex_math_preview", owner: "UX Lead", createdDaysAgo: 14, isStale: false, sunsetRecommended: false },
      ];

      const audited = engine.auditFeatureFlags(flags);
      expect(audited[0].isStale).toBe(true);
      expect(audited[0].sunsetRecommended).toBe(true);
      expect(audited[1].isStale).toBe(false);
      expect(audited[1].sunsetRecommended).toBe(false);
    });

    it("triggers review when subsystem complexity exceeds user value", () => {
      const ratio = engine.evaluateComplexityToValue("Experimental Live Audio Broadcasts", 2, 8);
      expect(ratio.valueToComplexityRatio).toBe(0.25);
      expect(ratio.reviewTriggered).toBe(true);

      const healthyRatio = engine.evaluateComplexityToValue("Keyset Feed Pagination", 9, 3);
      expect(healthyRatio.valueToComplexityRatio).toBe(3.0);
      expect(healthyRatio.reviewTriggered).toBe(false);
    });
  });
});

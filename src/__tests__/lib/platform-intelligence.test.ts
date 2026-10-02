import { describe, it, expect, beforeEach } from "vitest";
import {
  PlatformIntelligenceEngine,
  RawTelemetrySignal,
  FrictionMetrics,
  KnowledgeGapCandidate,
  PredictionRecord,
  PredictiveAnomaly,
} from "@/lib/platform-intelligence";

describe("PlatformIntelligenceEngine", () => {
  let engine: PlatformIntelligenceEngine;

  beforeEach(() => {
    engine = new PlatformIntelligenceEngine();
  });

  describe("Signal Normalization & Trend Evaluation", () => {
    it("normalizes healthy telemetry signals within baseline bounds", () => {
      const signal: RawTelemetrySignal = {
        id: "sig_1",
        domain: "CLIENT_PERF",
        metric: "screen_transition_ms",
        value: 120,
        timestamp: "2026-09-15T08:00:00Z",
      };

      const norm = engine.normalizeSignal(signal, 120);
      expect(norm.normalizedScore).toBe(100);
      expect(norm.deviationPercentage).toBe(0);
      expect(norm.domain).toBe("CLIENT_PERF");
    });

    it("applies penalty for degrading signals exceeding baseline", () => {
      const signal: RawTelemetrySignal = {
        id: "sig_2",
        domain: "CLIENT_PERF",
        metric: "screen_transition_ms",
        value: 360,
        timestamp: "2026-09-15T08:00:00Z",
      };

      const norm = engine.normalizeSignal(signal, 120);
      expect(norm.deviationPercentage).toBe(200);
      expect(norm.normalizedScore).toBe(0);
    });

    it("evaluates trend velocity and projects sequential values", () => {
      const history = [100, 110, 120, 130, 140];
      const trend = engine.computeTrend("p95_latency", history);

      expect(trend.direction).toBe("DEGRADING");
      expect(trend.velocityPerInterval).toBe(10);
      expect(trend.projectedValueNextInterval).toBe(150);
      expect(trend.sampleCount).toBe(5);
    });

    it("identifies stable metrics with negligible fluctuations", () => {
      const history = [100, 101, 100, 101, 100];
      const trend = engine.computeTrend("active_users", history);

      expect(trend.direction).toBe("STABLE");
      expect(trend.sampleCount).toBe(5);
    });
  });

  describe("Predictive Health & Leading Indicators", () => {
    it("forecasts database connection pool saturation when threshold is breached", () => {
      const trajectory = [60, 70, 78, 84, 88];
      const forecast = engine.forecastDatabaseConnectionPressure(88, 100, trajectory);

      expect(forecast).not.toBeNull();
      expect(forecast?.domain).toBe("DATABASE");
      expect(forecast?.severity).toBe("HIGH");
      expect(forecast?.probabilityScore).toBeGreaterThanOrEqual(0.85);
      expect(forecast?.summary).toContain("Database connection pool approaching saturation");
    });

    it("returns null when database connection pool is comfortably within headroom", () => {
      const trajectory = [20, 22, 21, 23, 22];
      const forecast = engine.forecastDatabaseConnectionPressure(22, 100, trajectory);

      expect(forecast).toBeNull();
    });

    it("detects cost anomalies when resource consumption exceeds baseline by 2.5x", () => {
      const anomaly = engine.evaluateCostAnomaly("storage_bandwidth", 300, 100, 0.05);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.domain).toBe("COST");
      expect(anomaly?.currentValue).toBe(300);
      expect(anomaly?.summary).toContain("Cost anomaly on storage_bandwidth: current usage (300) is 3.0x baseline");
    });

    it("ignores normal resource consumption fluctuations under 2.5x", () => {
      const anomaly = engine.evaluateCostAnomaly("storage_bandwidth", 150, 100, 0.05);
      expect(anomaly).toBeNull();
    });
  });

  describe("Digital Dependency Model & Failure Propagation", () => {
    it("traces failure propagation when REALTIME_BROKER degrades", () => {
      const analysis = engine.analyzeFailurePropagation("REALTIME_BROKER");

      expect(analysis.failingNode).toBe("REALTIME_BROKER");
      expect(analysis.affectedFlows).toContain("QUESTION_CREATION");
      expect(analysis.isolatedFlows).toContain("QUESTION_READ_FEED");
      expect(analysis.isolatedFlows).toContain("SEARCH");
      expect(analysis.operationalCapability).toBe("DEGRADED");
      expect(analysis.recommendedDegradationMode.some((m) => m.includes("realtime feed broadcast suppressed"))).toBe(true);
    });

    it("recognizes total system degradation when POSTGRES_DB fails", () => {
      const analysis = engine.analyzeFailurePropagation("POSTGRES_DB");

      expect(analysis.affectedFlows).toContain("QUESTION_CREATION");
      expect(analysis.affectedFlows).toContain("QUESTION_READ_FEED");
      expect(analysis.affectedFlows).toContain("SEARCH");
      expect(analysis.affectedFlows).toContain("PUSH_NOTIFICATIONS");
      expect(analysis.isolatedFlows.length).toBe(0);
      expect(analysis.operationalCapability).toBe("OUTAGE");
    });
  });

  describe("UX Friction & Knowledge Gap Scoring", () => {
    it("flags product surface bottlenecks with elevated friction scores", () => {
      const metrics: FrictionMetrics = {
        surface: "QUESTION_ASKING",
        successRate: 0.65,
        retryCount: 4,
        abandonmentRate: 0.52,
        averageLatencyMs: 3200,
      };

      const report = engine.evaluateProductFriction(metrics);
      expect(report.isBottleneck).toBe(true);
      expect(report.frictionScore).toBeGreaterThanOrEqual(50);
      expect(report.primaryContributor).toBe("High form/step abandonment");
    });

    it("verifies low friction score on well-tuned operational flows", () => {
      const metrics: FrictionMetrics = {
        surface: "DISCOVERY",
        successRate: 0.98,
        retryCount: 0,
        abandonmentRate: 0.05,
        averageLatencyMs: 450,
      };

      const report = engine.evaluateProductFriction(metrics);
      expect(report.isBottleneck).toBe(false);
      expect(report.frictionScore).toBeLessThan(20);
      expect(report.primaryContributor).toBe("Normal operational flow");
    });

    it("ranks knowledge gaps prioritizing high search volume and low answer quality", () => {
      const candidate: KnowledgeGapCandidate = {
        topic: "Advanced Quantum Computing",
        searchFrequency: 150,
        unansweredCount: 25,
        averageAnswerQualityScore: 0.2,
        importanceWeight: 4,
      };

      const ranked = engine.rankKnowledgeGap(candidate);
      expect(ranked.priorityTier).toBe("URGENT");
      expect(ranked.gapScore).toBeGreaterThanOrEqual(500);
      expect(ranked.recommendedAction).toContain('Surface topic "Advanced Quantum Computing" to verified faculty/scholars');
    });
  });

  describe("Safe Automation & Governance Boundaries", () => {
    const dummyAnomaly: PredictiveAnomaly = {
      id: "anom_1",
      domain: "DATABASE",
      metric: "cache_miss_spike",
      severity: "MEDIUM",
      currentValue: 80,
      threshold: 50,
      confidence: "HIGH",
      probabilityScore: 0.88,
      summary: "Cache misses spiking on hot query",
      timestamp: "2026-09-15T09:00:00Z",
    };

    it("allows low-risk reversible Level 2 actions to execute autonomously", () => {
      const recommendation = engine.evaluateActionSafety("cache.refresh_stale", dummyAnomaly);

      expect(recommendation.isAutonomouslyExecutable).toBe(true);
      expect(recommendation.requiresHumanApproval).toBe(false);
      expect(recommendation.riskClass).toBe("LOW");
      expect(recommendation.suggestedAction).toContain("Execute automated low-risk mitigation");
    });

    it("strictly blocks high-impact actions from executing autonomously", () => {
      const banRec = engine.evaluateActionSafety("user.account_ban", dummyAnomaly);
      expect(banRec.isAutonomouslyExecutable).toBe(false);
      expect(banRec.requiresHumanApproval).toBe(true);
      expect(banRec.riskClass).toBe("CRITICAL");

      const purgeRec = engine.evaluateActionSafety("data.destructive_purge", dummyAnomaly);
      expect(purgeRec.isAutonomouslyExecutable).toBe(false);
      expect(purgeRec.requiresHumanApproval).toBe(true);
      expect(purgeRec.riskClass).toBe("CRITICAL");
    });

    it("enforces daily execution quotas on automated low-risk actions", () => {
      // Record 1000 executions of cache.refresh_stale (the maxDailyExecutions limit)
      for (let i = 0; i < 1000; i++) {
        const recorded = engine.recordExecutedAction("cache.refresh_stale");
        expect(recorded).toBe(true);
      }

      // 1001st execution must be denied by quota circuit breaker
      const overQuota = engine.recordExecutedAction("cache.refresh_stale");
      expect(overQuota).toBe(false);

      // Now evaluateActionSafety should flag that it can no longer execute autonomously today
      const rec = engine.evaluateActionSafety("cache.refresh_stale", dummyAnomaly);
      expect(rec.isAutonomouslyExecutable).toBe(false);
      expect(rec.requiresHumanApproval).toBe(true);
    });
  });

  describe("Prediction Calibration & Accuracy Tracking", () => {
    it("evaluates model precision, recall, and calibration error", () => {
      const predictions: PredictionRecord[] = [
        { predictionId: "p1", metric: "db_latency", predictedAnomaly: true, predictedProbability: 0.9 },
        { predictionId: "p2", metric: "db_latency", predictedAnomaly: true, predictedProbability: 0.8 },
        { predictionId: "p3", metric: "db_latency", predictedAnomaly: false, predictedProbability: 0.1 },
        { predictionId: "p4", metric: "db_latency", predictedAnomaly: false, predictedProbability: 0.2 },
      ];

      for (const p of predictions) {
        engine.registerPrediction(p);
      }

      // Verify outcomes: p1 True, p2 True, p3 False, p4 False (perfect 100% calibration)
      engine.verifyPredictionOutcome("p1", true);
      engine.verifyPredictionOutcome("p2", true);
      engine.verifyPredictionOutcome("p3", false);
      engine.verifyPredictionOutcome("p4", false);

      const scorecard = engine.evaluateModelCalibration();
      expect(scorecard.totalEvaluated).toBe(4);
      expect(scorecard.truePositives).toBe(2);
      expect(scorecard.falsePositives).toBe(0);
      expect(scorecard.trueNegatives).toBe(2);
      expect(scorecard.falseNegatives).toBe(0);
      expect(scorecard.precision).toBe(1.0);
      expect(scorecard.recall).toBe(1.0);
      expect(scorecard.isCalibrated).toBe(true);
      expect(scorecard.brierScore).toBeLessThan(0.1);
    });
  });
});

/**
 * Platform Intelligence Engine — EduCard Phase 13
 *
 * Implements a bounded, self-aware, predictive, and human-governed intelligence layer.
 * Transforms:
 * RAW SIGNALS -> NORMALIZED EVENTS -> HEALTH SIGNALS -> TRENDS -> ANOMALIES -> PREDICTIONS -> RECOMMENDATIONS
 *
 * Adheres strictly to Phase 13 Non-Negotiables:
 * - Deterministic statistical rules over speculative ML
 * - Bounded Level-2 operations only; zero autonomous high-impact actions
 * - Calibrated predictions with explicit uncertainty tracking
 * - Privacy-preserving aggregate indicators
 */

import { AUTOMATION_POLICY_REGISTRY, AutomationPolicy } from "./autonomous-ops";

// ============================================================================
// 1. SIGNAL & TELEMETRY DEFINITIONS
// ============================================================================

export type SignalDomain =
  | "DATABASE"
  | "CLIENT_PERF"
  | "NETWORK"
  | "SECURITY"
  | "COST"
  | "UX_FRICTION"
  | "KNOWLEDGE_QUALITY"
  | "DATA_INTEGRITY";

export interface RawTelemetrySignal {
  id: string;
  domain: SignalDomain;
  metric: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface NormalizedHealthSignal {
  id: string;
  domain: SignalDomain;
  metric: string;
  normalizedScore: number; // 0 (critical failure) to 100 (optimal health)
  observedValue: number;
  baselineValue: number;
  deviationPercentage: number;
  timestamp: string;
}

export interface TrendAnalysis {
  metric: string;
  direction: "STABLE" | "IMPROVING" | "DEGRADING";
  velocityPerInterval: number; // rate of change
  projectedValueNextInterval: number;
  sampleCount: number;
}

export interface PredictiveAnomaly {
  id: string;
  domain: SignalDomain;
  metric: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  currentValue: number;
  threshold: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  probabilityScore: number; // 0.0 - 1.0
  summary: string;
  timestamp: string;
}

export interface IntelligenceRecommendation {
  id: string;
  anomalyId: string;
  actionName: string;
  isAutonomouslyExecutable: boolean;
  requiresHumanApproval: boolean;
  riskClass: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  expectedBenefit: string;
  reversibility: boolean;
  suggestedAction: string;
}

// ============================================================================
// 2. DIGITAL DEPENDENCY MODEL & FAILURE PROPAGATION
// ============================================================================

export type DependencyNode =
  | "CLIENT_UI"
  | "SERVICE_LAYER"
  | "RPC_BOUNDARY"
  | "POSTGRES_DB"
  | "RLS_ENGINE"
  | "DB_TRIGGERS"
  | "STORAGE_BUCKETS"
  | "REALTIME_BROKER"
  | "PUSH_GATEWAY"
  | "EXTERNAL_AUTH";

export interface SystemFlowGraph {
  flowName: string;
  nodes: DependencyNode[];
  criticalPath: DependencyNode[];
  gracefulDegradations: Partial<Record<DependencyNode, string>>;
}

export const CRITICAL_PLATFORM_FLOWS: Record<string, SystemFlowGraph> = {
  QUESTION_CREATION: {
    flowName: "QUESTION_CREATION",
    nodes: [
      "CLIENT_UI",
      "SERVICE_LAYER",
      "RPC_BOUNDARY",
      "POSTGRES_DB",
      "RLS_ENGINE",
      "DB_TRIGGERS",
      "REALTIME_BROKER",
    ],
    criticalPath: ["CLIENT_UI", "SERVICE_LAYER", "POSTGRES_DB", "RLS_ENGINE"],
    gracefulDegradations: {
      REALTIME_BROKER: "Fall back to local state invalidation; realtime feed broadcast suppressed.",
      DB_TRIGGERS: "Async counter reconciliation queues via pg_cron if triggers shed load.",
    },
  },
  QUESTION_READ_FEED: {
    flowName: "QUESTION_READ_FEED",
    nodes: ["CLIENT_UI", "SERVICE_LAYER", "RPC_BOUNDARY", "POSTGRES_DB", "RLS_ENGINE"],
    criticalPath: ["CLIENT_UI", "SERVICE_LAYER", "POSTGRES_DB"],
    gracefulDegradations: {
      RPC_BOUNDARY: "Fall back to cached TanStack Query feed in client storage.",
    },
  },
  SEARCH: {
    flowName: "SEARCH",
    nodes: ["CLIENT_UI", "SERVICE_LAYER", "POSTGRES_DB"],
    criticalPath: ["CLIENT_UI", "SERVICE_LAYER"],
    gracefulDegradations: {
      POSTGRES_DB: "Fall back to recent search history cache and cached local topic filters.",
    },
  },
  PUSH_NOTIFICATIONS: {
    flowName: "PUSH_NOTIFICATIONS",
    nodes: ["POSTGRES_DB", "DB_TRIGGERS", "PUSH_GATEWAY"],
    criticalPath: ["POSTGRES_DB"],
    gracefulDegradations: {
      PUSH_GATEWAY: "Buffer notification payloads in DB notifications table for in-app badge display.",
    },
  },
};

export interface FailureImpactAnalysis {
  failingNode: DependencyNode;
  affectedFlows: string[];
  isolatedFlows: string[];
  operationalCapability: "FULL" | "DEGRADED" | "OUTAGE";
  recommendedDegradationMode: string[];
}

// ============================================================================
// 3. UX FRICTION & KNOWLEDGE GAP MODELS
// ============================================================================

export type ProductSurface =
  | "SIGNUP"
  | "ONBOARDING"
  | "DISCOVERY"
  | "QUESTION_ASKING"
  | "ANSWERING"
  | "SEARCH"
  | "COMMUNITIES"
  | "POSTS"
  | "NOTIFICATIONS"
  | "PROFILE"
  | "MODERATION"
  | "SETTINGS";

export interface FrictionMetrics {
  surface: ProductSurface;
  successRate: number; // 0.0 - 1.0
  retryCount: number;
  abandonmentRate: number; // 0.0 - 1.0
  averageLatencyMs: number;
}

export interface FrictionReport {
  surface: ProductSurface;
  frictionScore: number; // 0 (no friction) to 100 (extreme bottleneck)
  isBottleneck: boolean;
  primaryContributor: string;
}

export interface KnowledgeGapCandidate {
  topic: string;
  searchFrequency: number;
  unansweredCount: number;
  averageAnswerQualityScore: number; // 0.0 - 1.0
  importanceWeight: number; // 1 - 5
}

export interface RankedKnowledgeGap {
  topic: string;
  gapScore: number;
  priorityTier: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  recommendedAction: string;
}

// ============================================================================
// 4. PREDICTION CALIBRATION & ACCURACY RECORD
// ============================================================================

export interface PredictionRecord {
  predictionId: string;
  metric: string;
  predictedAnomaly: boolean;
  predictedProbability: number;
  actualOutcome?: boolean;
  verifiedAt?: string;
}

export interface CalibrationScorecard {
  totalEvaluated: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  brierScore: number;
  isCalibrated: boolean;
}

// ============================================================================
// 5. PLATFORM INTELLIGENCE ENGINE IMPLEMENTATION
// ============================================================================

export class PlatformIntelligenceEngine {
  private predictionStore: Map<string, PredictionRecord> = new Map();
  private dailyExecutionCounts: Map<string, number> = new Map();

  /**
   * Normalizes raw signals against baseline expectations into bounded health scores (0 - 100).
   */
  normalizeSignal(signal: RawTelemetrySignal, baselineValue: number): NormalizedHealthSignal {
    const safeBaseline = Math.max(baselineValue, 0.0001);
    const deviationPercentage = ((signal.value - safeBaseline) / safeBaseline) * 100;

    // Higher is worse for latency/errors/cost, higher is better for availability
    let score = 100;
    if (signal.value > safeBaseline) {
      const penalty = Math.min(100, ((signal.value - safeBaseline) / safeBaseline) * 50);
      score = Math.max(0, 100 - penalty);
    }

    return {
      id: `norm_${signal.id}`,
      domain: signal.domain,
      metric: signal.metric,
      normalizedScore: Math.round(score),
      observedValue: signal.value,
      baselineValue: safeBaseline,
      deviationPercentage: Number(deviationPercentage.toFixed(2)),
      timestamp: signal.timestamp,
    };
  }

  /**
   * Evaluates time-series trend velocity using linear difference across sequential points.
   */
  computeTrend(metric: string, history: number[]): TrendAnalysis {
    if (history.length < 2) {
      return {
        metric,
        direction: "STABLE",
        velocityPerInterval: 0,
        projectedValueNextInterval: history[0] ?? 0,
        sampleCount: history.length,
      };
    }

    const n = history.length;
    const deltas: number[] = [];
    for (let i = 1; i < n; i++) {
      deltas.push(history[i] - history[i - 1]);
    }

    const avgVelocity = deltas.reduce((acc, d) => acc + d, 0) / deltas.length;
    const lastVal = history[n - 1];
    const projected = Math.max(0, lastVal + avgVelocity);

    let direction: "STABLE" | "IMPROVING" | "DEGRADING" = "STABLE";
    if (Math.abs(avgVelocity) < 0.05 * (lastVal || 1)) {
      direction = "STABLE";
    } else if (avgVelocity > 0) {
      direction = "DEGRADING";
    } else {
      direction = "IMPROVING";
    }

    return {
      metric,
      direction,
      velocityPerInterval: Number(avgVelocity.toFixed(4)),
      projectedValueNextInterval: Number(projected.toFixed(2)),
      sampleCount: n,
    };
  }

  /**
   * Forecasts leading indicator database connection pool saturation.
   */
  forecastDatabaseConnectionPressure(
    currentConnections: number,
    maxPoolCapacity: number,
    connectionTrajectory: number[]
  ): PredictiveAnomaly | null {
    const trend = this.computeTrend("db_connections", connectionTrajectory);
    const connectionHeadroom = maxPoolCapacity - currentConnections;

    if (currentConnections / maxPoolCapacity >= 0.85 || trend.projectedValueNextInterval >= maxPoolCapacity * 0.9) {
      const probability = Math.min(1.0, currentConnections / maxPoolCapacity);
      return {
        id: `pred_db_pool_${Date.now()}`,
        domain: "DATABASE",
        metric: "connection_pool_utilization",
        severity: currentConnections / maxPoolCapacity >= 0.95 ? "CRITICAL" : "HIGH",
        currentValue: currentConnections,
        threshold: maxPoolCapacity * 0.85,
        confidence: trend.sampleCount >= 5 ? "HIGH" : "MEDIUM",
        probabilityScore: Number(probability.toFixed(2)),
        summary: `Database connection pool approaching saturation (${currentConnections}/${maxPoolCapacity}). Projected next: ${trend.projectedValueNextInterval}. Headroom: ${connectionHeadroom}.`,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Evaluates cost anomalies across platform resource consumption.
   */
  evaluateCostAnomaly(
    resourceName: string,
    currentUsageUnits: number,
    historicalBaselineUnits: number,
    costPerUnitUsd: number
  ): PredictiveAnomaly | null {
    const safeBaseline = Math.max(1, historicalBaselineUnits);
    const ratio = currentUsageUnits / safeBaseline;

    if (ratio >= 2.5) {
      const projectedCost = currentUsageUnits * costPerUnitUsd;
      const expectedCost = safeBaseline * costPerUnitUsd;
      const excessCost = projectedCost - expectedCost;

      return {
        id: `pred_cost_${resourceName}_${Date.now()}`,
        domain: "COST",
        metric: `cost_${resourceName}`,
        severity: ratio >= 5.0 ? "CRITICAL" : "HIGH",
        currentValue: currentUsageUnits,
        threshold: safeBaseline * 2.5,
        confidence: "HIGH",
        probabilityScore: 0.92,
        summary: `Cost anomaly on ${resourceName}: current usage (${currentUsageUnits}) is ${ratio.toFixed(1)}x baseline. Projected excess: $${excessCost.toFixed(2)} USD.`,
        timestamp: new Date().toISOString(),
      };
    }

    return null;
  }

  /**
   * Analyzes failure propagation through the Digital Dependency Model.
   */
  analyzeFailurePropagation(failingNode: DependencyNode): FailureImpactAnalysis {
    const affectedFlows: string[] = [];
    const isolatedFlows: string[] = [];
    const recommendedDegradationMode: string[] = [];

    for (const [name, graph] of Object.entries(CRITICAL_PLATFORM_FLOWS)) {
      if (graph.nodes.includes(failingNode)) {
        affectedFlows.push(name);
        const fallback = graph.gracefulDegradations[failingNode];
        if (fallback) {
          recommendedDegradationMode.push(`[${name}]: ${fallback}`);
        } else {
          recommendedDegradationMode.push(`[${name}]: Flow critically interrupted; fail-closed safely.`);
        }
      } else {
        isolatedFlows.push(name);
      }
    }

    const isCriticalToAll = affectedFlows.length === Object.keys(CRITICAL_PLATFORM_FLOWS).length;
    const operationalCapability = isCriticalToAll
      ? "OUTAGE"
      : affectedFlows.length > 0
      ? "DEGRADED"
      : "FULL";

    return {
      failingNode,
      affectedFlows,
      isolatedFlows,
      operationalCapability,
      recommendedDegradationMode,
    };
  }

  /**
   * Quantifies privacy-safe user friction across product surfaces.
   */
  evaluateProductFriction(metrics: FrictionMetrics): FrictionReport {
    // Friction score: 0 to 100
    // Weighted by abandonment (40%), failure/1-success (30%), retries (20%), latency penalty (10%)
    const failureRate = Math.max(0, 1 - metrics.successRate);
    const retryPenalty = Math.min(1.0, metrics.retryCount / 5);
    const latencyPenalty = Math.min(1.0, Math.max(0, (metrics.averageLatencyMs - 1000) / 3000));

    const score =
      metrics.abandonmentRate * 40 +
      failureRate * 30 +
      retryPenalty * 20 +
      latencyPenalty * 10;

    const frictionScore = Math.min(100, Math.max(0, Math.round(score)));
    const isBottleneck = frictionScore >= 50;

    let primaryContributor = "Normal operational flow";
    if (metrics.abandonmentRate > 0.4) {
      primaryContributor = "High form/step abandonment";
    } else if (failureRate > 0.3) {
      primaryContributor = "High transaction error rate";
    } else if (metrics.retryCount >= 3) {
      primaryContributor = "Excessive client retries";
    } else if (metrics.averageLatencyMs > 2500) {
      primaryContributor = "Unacceptable perceived latency";
    }

    return {
      surface: metrics.surface,
      frictionScore,
      isBottleneck,
      primaryContributor,
    };
  }

  /**
   * Ranks academic knowledge gaps based on demand, rarity, and quality deficits.
   * Formula: Score = (SearchFrequency * Importance * (1 - AnswerQuality)) * (1 + UnansweredCount / 10)
   */
  rankKnowledgeGap(candidate: KnowledgeGapCandidate): RankedKnowledgeGap {
    const qualityDeficit = Math.max(0.1, 1 - candidate.averageAnswerQualityScore);
    const unansweredMultiplier = 1 + Math.min(5, candidate.unansweredCount / 10);
    const rawScore =
      candidate.searchFrequency * candidate.importanceWeight * qualityDeficit * unansweredMultiplier;

    const gapScore = Math.round(rawScore);

    let priorityTier: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "LOW";
    if (gapScore >= 500) priorityTier = "URGENT";
    else if (gapScore >= 200) priorityTier = "HIGH";
    else if (gapScore >= 80) priorityTier = "MEDIUM";

    return {
      topic: candidate.topic,
      gapScore,
      priorityTier,
      recommendedAction:
        priorityTier === "URGENT" || priorityTier === "HIGH"
          ? `Surface topic "${candidate.topic}" to verified faculty/scholars and community feeds.`
          : `Monitor question velocity for topic "${candidate.topic}".`,
    };
  }

  /**
   * Evaluates automation governance policy to determine if recommendation is safely executable.
   */
  evaluateActionSafety(actionName: string, anomaly: PredictiveAnomaly): IntelligenceRecommendation {
    const policy: AutomationPolicy = AUTOMATION_POLICY_REGISTRY[actionName] ?? {
      actionName,
      allowedLevel: "LEVEL_0_MANUAL",
      riskClass: "CRITICAL",
      requiresHumanApproval: true,
      reversible: false,
      maxDailyExecutions: 0,
      description: "Default zero-trust policy",
    };

    const isLowRiskLevel =
      policy.allowedLevel === "LEVEL_2_AUTOMATED_LOW_RISK" && !policy.requiresHumanApproval;
    const dailyCount = this.dailyExecutionCounts.get(actionName) ?? 0;
    const withinDailyLimit = dailyCount < policy.maxDailyExecutions;

    const isAutonomouslyExecutable = isLowRiskLevel && withinDailyLimit && policy.reversible;

    return {
      id: `rec_${Date.now()}`,
      anomalyId: anomaly.id,
      actionName,
      isAutonomouslyExecutable,
      requiresHumanApproval: policy.requiresHumanApproval || !isAutonomouslyExecutable,
      riskClass: policy.riskClass,
      expectedBenefit: `Mitigate anomaly ${anomaly.metric} (Severity: ${anomaly.severity})`,
      reversibility: policy.reversible,
      suggestedAction: isAutonomouslyExecutable
        ? `Execute automated low-risk mitigation: ${policy.description}`
        : `Require human review & authorization: ${policy.description} (Risk: ${policy.riskClass})`,
    };
  }

  /**
   * Tracks an executed low-risk action against daily quotas.
   */
  recordExecutedAction(actionName: string): boolean {
    const policy = AUTOMATION_POLICY_REGISTRY[actionName];
    if (!policy || policy.allowedLevel !== "LEVEL_2_AUTOMATED_LOW_RISK") {
      return false;
    }

    const current = this.dailyExecutionCounts.get(actionName) ?? 0;
    if (current >= policy.maxDailyExecutions) {
      return false;
    }

    this.dailyExecutionCounts.set(actionName, current + 1);
    return true;
  }

  /**
   * Registers a prediction for longitudinal calibration tracking.
   */
  registerPrediction(prediction: PredictionRecord): void {
    this.predictionStore.set(prediction.predictionId, prediction);
  }

  /**
   * Verifies the observed real outcome against a prior prediction.
   */
  verifyPredictionOutcome(predictionId: string, actualOutcome: boolean): void {
    const record = this.predictionStore.get(predictionId);
    if (record) {
      record.actualOutcome = actualOutcome;
      record.verifiedAt = new Date().toISOString();
    }
  }

  /**
   * Evaluates prediction precision, recall, and calibration error.
   */
  evaluateModelCalibration(): CalibrationScorecard {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;
    let totalBrier = 0;
    let totalEvaluated = 0;

    for (const record of this.predictionStore.values()) {
      if (record.actualOutcome === undefined) continue;

      totalEvaluated++;
      const outcomeVal = record.actualOutcome ? 1 : 0;
      totalBrier += Math.pow(record.predictedProbability - outcomeVal, 2);

      if (record.predictedAnomaly && record.actualOutcome) {
        truePositives++;
      } else if (record.predictedAnomaly && !record.actualOutcome) {
        falsePositives++;
      } else if (!record.predictedAnomaly && !record.actualOutcome) {
        trueNegatives++;
      } else if (!record.predictedAnomaly && record.actualOutcome) {
        falseNegatives++;
      }
    }

    const precision =
      truePositives + falsePositives > 0 ? truePositives / (truePositives + falsePositives) : 1.0;
    const recall =
      truePositives + falseNegatives > 0 ? truePositives / (truePositives + falseNegatives) : 1.0;
    const brierScore = totalEvaluated > 0 ? Number((totalBrier / totalEvaluated).toFixed(4)) : 0;

    // A model is considered well-calibrated if Brier Score <= 0.25 and precision >= 0.75
    const isCalibrated = totalEvaluated === 0 || (brierScore <= 0.25 && precision >= 0.75);

    return {
      totalEvaluated,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      precision: Number(precision.toFixed(2)),
      recall: Number(recall.toFixed(2)),
      brierScore,
      isCalibrated,
    };
  }
}

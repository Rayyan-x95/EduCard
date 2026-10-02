/**
 * Platform Learning Engine — EduCard Phase 14
 *
 * Implements the continuous platform learning loop:
 * DATA -> KNOWLEDGE -> INSIGHT -> DECISION -> ACTION -> OUTCOME -> LEARNING
 *
 * Non-Negotiables:
 * - Deterministic, auditable rules over opaque black boxes
 * - Humans remain accountable for high-impact architecture & security decisions
 * - Multi-signal academic value modeling
 * - What-breaks-first capacity simulations
 * - Platform anti-bloat surveillance
 */

// ============================================================================
// 1. LEARNING LOOP DATA STRUCTURES
// ============================================================================

export type LearningDomain =
  | "INCIDENT"
  | "PERFORMANCE"
  | "SECURITY"
  | "COST"
  | "UX"
  | "KNOWLEDGE_QUALITY"
  | "MODERATION"
  | "ARCHITECTURE";

export type DecisionOutcomeClass =
  | "SUCCESS"
  | "PARTIAL_SUCCESS"
  | "NO_MATERIAL_IMPACT"
  | "REGRESSION"
  | "FAILURE";

export interface LearningEvent {
  id: string;
  domain: LearningDomain;
  source: string;
  description: string;
  timestamp: string;
  rawTelemetry?: Record<string, unknown>;
}

export interface PlatformInsight {
  id: string;
  eventId: string;
  domain: LearningDomain;
  hypothesis: string;
  supportingEvidence: string[];
  confidence: "LOW" | "MEDIUM" | "HIGH";
  timestamp: string;
}

export interface PlatformDecision {
  id: string;
  insightId: string;
  title: string;
  proposedAction: string;
  expectedOutcome: string;
  targetMetric: string;
  baselineValue: number;
  expectedValue: number;
  decidedBy: string; // Human architect / SRE lead or Bounded Governor
  status: "PROPOSED" | "APPROVED" | "EXECUTED" | "EVALUATED";
  timestamp: string;
  actualValue?: number;
  outcomeClass?: DecisionOutcomeClass;
  lessonLearned?: string;
}

// ============================================================================
// 2. RELATIONAL ENGINEERING KNOWLEDGE GRAPH
// ============================================================================

export type KnowledgeNodeType =
  | "FEATURE"
  | "SERVICE"
  | "RPC"
  | "DATABASE_TABLE"
  | "RLS_POLICY"
  | "TEST_SUITE"
  | "HISTORICAL_INCIDENT";

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  name: string;
  filePath?: string;
  description?: string;
}

export interface KnowledgeEdge {
  fromNodeId: string;
  toNodeId: string;
  relationship: "CALLS" | "QUERIES" | "PROTECTED_BY" | "TESTED_BY" | "CAUSED_BY";
}

// ============================================================================
// 3. WHAT-BREAKS-FIRST CAPACITY SIMULATION
// ============================================================================

export interface CapacityBaseline {
  concurrentUsers: number;
  dbPoolCapacity: number; // max connections
  dbCurrentConnections: number;
  feedQpsCapacity: number; // max queries per second
  feedCurrentQps: number;
  storageDailyEgressGb: number;
  storageMaxEgressGb: number;
}

export interface BottleneckEvaluation {
  multiplier: number;
  projectedUsers: number;
  firstBottleneck: string;
  secondBottleneck: string;
  ultimateBottleneck: string;
  systemBreached: boolean;
  headroomPercentage: number;
}

// ============================================================================
// 4. ACADEMIC VALUE MULTI-SIGNAL MODEL
// ============================================================================

export interface AcademicValueSignals {
  acceptedAnswerCount: number;
  peerReviewEndorsements: number;
  citationVerificationRate: number; // 0.0 - 1.0
  knowledgeReuseVisits: number;
  correctionQualityScore: number; // 0.0 - 1.0
}

export interface AcademicValueScore {
  compositeScore: number; // 0 - 100
  utilityTier: "EXCEPTIONAL" | "STRONG" | "MODERATE" | "LOW";
  primaryValueDriver: string;
}

// ============================================================================
// 5. ANTI-BLOAT & COMPLEXITY-TO-VALUE
// ============================================================================

export interface FeatureFlagAudit {
  key: string;
  owner: string;
  createdDaysAgo: number;
  isStale: boolean;
  sunsetRecommended: boolean;
}

export interface SubsystemValueRatio {
  subsystemName: string;
  userValueScore: number; // 1 - 10
  complexityScore: number; // 1 - 10
  valueToComplexityRatio: number;
  reviewTriggered: boolean;
}

// ============================================================================
// 6. PLATFORM LEARNING ENGINE IMPLEMENTATION
// ============================================================================

export class PlatformLearningEngine {
  private events: Map<string, LearningEvent> = new Map();
  private insights: Map<string, PlatformInsight> = new Map();
  private decisions: Map<string, PlatformDecision> = new Map();
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: KnowledgeEdge[] = [];

  constructor() {
    this.seedDefaultKnowledgeGraph();
  }

  /**
   * Initializes canonical relational knowledge graph nodes for EduCard core.
   */
  private seedDefaultKnowledgeGraph(): void {
    const defaultNodes: KnowledgeNode[] = [
      { id: "feat_home_feed", type: "FEATURE", name: "Home Feed", filePath: "src/app/(tabs)/index.tsx" },
      { id: "feat_ask_question", type: "FEATURE", name: "Ask Question", filePath: "src/app/question/new.tsx" },
      { id: "svc_questions", type: "SERVICE", name: "Questions Service", filePath: "src/services/questions.ts" },
      { id: "rpc_get_home_feed", type: "RPC", name: "get_home_feed" },
      { id: "tbl_questions", type: "DATABASE_TABLE", name: "questions" },
      { id: "tbl_answers", type: "DATABASE_TABLE", name: "answers" },
      { id: "rls_questions_read", type: "RLS_POLICY", name: "questions_read_policy" },
      { id: "test_questions", type: "TEST_SUITE", name: "bookmarks.test.ts", filePath: "src/__tests__/services/bookmarks.test.ts" },
    ];

    for (const node of defaultNodes) {
      this.nodes.set(node.id, node);
    }

    this.edges.push(
      { fromNodeId: "feat_home_feed", toNodeId: "svc_questions", relationship: "CALLS" },
      { fromNodeId: "svc_questions", toNodeId: "rpc_get_home_feed", relationship: "QUERIES" },
      { fromNodeId: "rpc_get_home_feed", toNodeId: "tbl_questions", relationship: "QUERIES" },
      { fromNodeId: "tbl_questions", toNodeId: "rls_questions_read", relationship: "PROTECTED_BY" },
      { fromNodeId: "svc_questions", toNodeId: "test_questions", relationship: "TESTED_BY" }
    );
  }

  /**
   * Stage 1 & 2: Registers an operational event and derives structured insight.
   */
  registerEventAndDeriveInsight(
    event: LearningEvent,
    hypothesis: string,
    supportingEvidence: string[],
    confidence: "LOW" | "MEDIUM" | "HIGH"
  ): PlatformInsight {
    this.events.set(event.id, event);

    const insight: PlatformInsight = {
      id: `ins_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      eventId: event.id,
      domain: event.domain,
      hypothesis,
      supportingEvidence,
      confidence,
      timestamp: new Date().toISOString(),
    };

    this.insights.set(insight.id, insight);
    return insight;
  }

  /**
   * Stage 3 & 4: Registers a proposed decision aimed at resolving an insight.
   */
  recordDecision(decision: PlatformDecision): void {
    this.decisions.set(decision.id, decision);
  }

  /**
   * Stage 5 & 6: Evaluates real-world outcome against expected target and extracts durable lesson.
   */
  evaluateDecisionOutcome(
    decisionId: string,
    actualValue: number,
    lessonLearned: string
  ): PlatformDecision {
    const decision = this.decisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found in institutional memory.`);
    }

    decision.actualValue = actualValue;
    decision.status = "EVALUATED";
    decision.lessonLearned = lessonLearned;

    // Check directional intent (minimizing vs maximizing metric)
    const intendedDirection = decision.expectedValue - decision.baselineValue;
    const actualDirection = actualValue - decision.baselineValue;

    // If change moved opposite to intended direction, classify as REGRESSION or FAILURE
    if ((intendedDirection > 0 && actualDirection < 0) || (intendedDirection < 0 && actualDirection > 0)) {
      decision.outcomeClass = "REGRESSION";
      return decision;
    }

    const expectedDelta = Math.abs(intendedDirection);
    const achievedDelta = Math.abs(actualDirection);

    if (achievedDelta >= expectedDelta * 0.9) {
      decision.outcomeClass = "SUCCESS";
    } else if (achievedDelta >= expectedDelta * 0.5) {
      decision.outcomeClass = "PARTIAL_SUCCESS";
    } else if (achievedDelta < expectedDelta * 0.1) {
      decision.outcomeClass = "NO_MATERIAL_IMPACT";
    } else {
      decision.outcomeClass = "FAILURE";
    }

    return decision;
  }

  /**
   * Traverses the engineering knowledge graph to compute exact blast radius of a modified node.
   */
  traverseBlastRadius(startNodeId: string): KnowledgeNode[] {
    const visited = new Set<string>();
    const queue = [startNodeId];
    visited.add(startNodeId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const outgoing = this.edges.filter((e) => e.fromNodeId === current);
      for (const edge of outgoing) {
        if (!visited.has(edge.toNodeId)) {
          visited.add(edge.toNodeId);
          queue.push(edge.toNodeId);
        }
      }
    }

    return Array.from(visited)
      .map((id) => this.nodes.get(id))
      .filter((n): n is KnowledgeNode => n !== undefined);
  }

  /**
   * Simulates what breaks first when traffic increases by multiplier X (e.g. 2x, 10x).
   */
  simulateWhatBreaksFirst(
    baseline: CapacityBaseline,
    multiplier: number
  ): BottleneckEvaluation {
    const projectedUsers = baseline.concurrentUsers * multiplier;
    const projectedConnections = baseline.dbCurrentConnections * multiplier;
    const projectedFeedQps = baseline.feedCurrentQps * multiplier;
    const projectedEgressGb = baseline.storageDailyEgressGb * multiplier;

    const poolUtilization = projectedConnections / baseline.dbPoolCapacity;
    const qpsUtilization = projectedFeedQps / baseline.feedQpsCapacity;
    const egressUtilization = projectedEgressGb / baseline.storageMaxEgressGb;

    const components = [
      { name: "PostgreSQL Connection Pool", util: poolUtilization },
      { name: "Feed Query Throughput (QPS)", util: qpsUtilization },
      { name: "Storage Egress Bandwidth", util: egressUtilization },
    ].sort((a, b) => b.util - a.util);

    const first = components[0];
    const second = components[1];
    const ultimate = components[2];

    const systemBreached = first.util >= 1.0;
    const headroom = Math.max(0, (1 - first.util) * 100);

    return {
      multiplier,
      projectedUsers,
      firstBottleneck: `${first.name} (${(first.util * 100).toFixed(1)}% capacity)`,
      secondBottleneck: `${second.name} (${(second.util * 100).toFixed(1)}% capacity)`,
      ultimateBottleneck: `${ultimate.name} (${(ultimate.util * 100).toFixed(1)}% capacity)`,
      systemBreached,
      headroomPercentage: Number(headroom.toFixed(1)),
    };
  }

  /**
   * Computes a multi-signal Academic Value Score (0 - 100).
   */
  calculateAcademicValue(signals: AcademicValueSignals): AcademicValueScore {
    // Weighted multi-signal formula:
    // 35% Accepted Answers, 25% Peer Reviews, 20% Citation Verification, 10% Reuse, 10% Correction
    const acceptedScore = Math.min(35, signals.acceptedAnswerCount * 3.5);
    const peerScore = Math.min(25, signals.peerReviewEndorsements * 2.5);
    const citationScore = signals.citationVerificationRate * 20;
    const reuseScore = Math.min(10, (signals.knowledgeReuseVisits / 100) * 10);
    const correctionScore = signals.correctionQualityScore * 10;

    const compositeScore = Math.min(100, Math.round(acceptedScore + peerScore + citationScore + reuseScore + correctionScore));

    let utilityTier: "EXCEPTIONAL" | "STRONG" | "MODERATE" | "LOW" = "LOW";
    if (compositeScore >= 80) utilityTier = "EXCEPTIONAL";
    else if (compositeScore >= 60) utilityTier = "STRONG";
    else if (compositeScore >= 40) utilityTier = "MODERATE";

    let primaryValueDriver = "General academic discourse";
    if (acceptedScore >= 25) primaryValueDriver = "High accepted solution resolution";
    else if (peerScore >= 18) primaryValueDriver = "Strong peer scholar endorsements";
    else if (citationScore >= 15) primaryValueDriver = "Rigorous verified citations";

    return {
      compositeScore,
      utilityTier,
      primaryValueDriver,
    };
  }

  /**
   * Audits feature flags to detect dead/stale flags and prevent permanent accumulation.
   */
  auditFeatureFlags(flags: FeatureFlagAudit[]): FeatureFlagAudit[] {
    return flags.map((f) => {
      const isStale = f.createdDaysAgo > 60;
      return {
        ...f,
        isStale,
        sunsetRecommended: isStale,
      };
    });
  }

  /**
   * Audits complexity-to-value ratio for a subsystem. Triggers review if complexity exceeds value.
   */
  evaluateComplexityToValue(
    subsystemName: string,
    userValueScore: number,
    complexityScore: number
  ): SubsystemValueRatio {
    const safeComplexity = Math.max(1, complexityScore);
    const ratio = Number((userValueScore / safeComplexity).toFixed(2));
    const reviewTriggered = ratio < 1.0; // Complexity exceeds user value

    return {
      subsystemName,
      userValueScore,
      complexityScore,
      valueToComplexityRatio: ratio,
      reviewTriggered,
    };
  }
}

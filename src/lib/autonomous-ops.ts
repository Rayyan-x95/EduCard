/**
 * Autonomous Operations & Governance Framework (Phase 10 - Sections 12-16)
 *
 * Enforces strict automation safety boundaries, classification tiers (Levels 0-4),
 * and human-in-the-loop gates for high-risk platform operations.
 */

export type AutomationLevel =
  | "LEVEL_0_MANUAL"
  | "LEVEL_1_ASSISTED"
  | "LEVEL_2_AUTOMATED_LOW_RISK"
  | "LEVEL_3_AUTOMATED_WITH_APPROVAL"
  | "LEVEL_4_RESTRICTED_AUTONOMOUS";

export type OperationRiskClass = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface AutomationPolicy {
  actionName: string;
  allowedLevel: AutomationLevel;
  riskClass: OperationRiskClass;
  requiresHumanApproval: boolean;
  reversible: boolean;
  maxDailyExecutions: number;
  description: string;
}

export const AUTOMATION_POLICY_REGISTRY: Record<string, AutomationPolicy> = {
  // Safe, Reversible, Low-Risk Self-Healing Actions (Level 2)
  "cache.refresh_stale": {
    actionName: "cache.refresh_stale",
    allowedLevel: "LEVEL_2_AUTOMATED_LOW_RISK",
    riskClass: "LOW",
    requiresHumanApproval: false,
    reversible: true,
    maxDailyExecutions: 1000,
    description: "Invalidates and refreshes stale client or edge query caches",
  },
  "realtime.reconnect": {
    actionName: "realtime.reconnect",
    allowedLevel: "LEVEL_2_AUTOMATED_LOW_RISK",
    riskClass: "LOW",
    requiresHumanApproval: false,
    reversible: true,
    maxDailyExecutions: 500,
    description: "Re-establishes broken Supabase Realtime channel subscriptions with exponential backoff",
  },
  "storage.refresh_signed_url": {
    actionName: "storage.refresh_signed_url",
    allowedLevel: "LEVEL_2_AUTOMATED_LOW_RISK",
    riskClass: "LOW",
    requiresHumanApproval: false,
    reversible: true,
    maxDailyExecutions: 2000,
    description: "Generates fresh signed read URLs for expired media assets",
  },
  "data.audit_anomalies": {
    actionName: "data.audit_anomalies",
    allowedLevel: "LEVEL_2_AUTOMATED_LOW_RISK",
    riskClass: "LOW",
    requiresHumanApproval: false,
    reversible: true,
    maxDailyExecutions: 24,
    description: "Non-destructive read-only data integrity surveillance scan",
  },

  // Medium-Risk Actions (Level 3 - Requires Approval)
  "index.rebuild_derived": {
    actionName: "index.rebuild_derived",
    allowedLevel: "LEVEL_3_AUTOMATED_WITH_APPROVAL",
    riskClass: "MEDIUM",
    requiresHumanApproval: true,
    reversible: true,
    maxDailyExecutions: 5,
    description: "Rebuilds derived search trigram indexes or materialized views",
  },
  "data.archive_old_notifications": {
    actionName: "data.archive_old_notifications",
    allowedLevel: "LEVEL_3_AUTOMATED_WITH_APPROVAL",
    riskClass: "MEDIUM",
    requiresHumanApproval: true,
    reversible: true,
    maxDailyExecutions: 1,
    description: "Moves notifications older than 180 days to cold storage",
  },

  // High-Risk Actions (Strictly Level 0 / 1 - Human Action Required)
  "user.account_ban": {
    actionName: "user.account_ban",
    allowedLevel: "LEVEL_0_MANUAL",
    riskClass: "CRITICAL",
    requiresHumanApproval: true,
    reversible: true,
    maxDailyExecutions: 0,
    description: "Permanent or temporary suspension of a student account",
  },
  "auth.privilege_escalation": {
    actionName: "auth.privilege_escalation",
    allowedLevel: "LEVEL_0_MANUAL",
    riskClass: "CRITICAL",
    requiresHumanApproval: true,
    reversible: true,
    maxDailyExecutions: 0,
    description: "Granting institutional administrator or moderator privileges",
  },
  "data.destructive_purge": {
    actionName: "data.destructive_purge",
    allowedLevel: "LEVEL_0_MANUAL",
    riskClass: "CRITICAL",
    requiresHumanApproval: true,
    reversible: false,
    maxDailyExecutions: 0,
    description: "Permanent irreversible hard-deletion of user records or questions",
  },
  "institution.verify_domain": {
    actionName: "institution.verify_domain",
    allowedLevel: "LEVEL_1_ASSISTED",
    riskClass: "HIGH",
    requiresHumanApproval: true,
    reversible: true,
    maxDailyExecutions: 0,
    description: "Approving official academic institution credentials",
  },
};

export interface AnomalyEvaluation {
  metricName: string;
  observedValue: number;
  threshold: number;
  isAnomaly: boolean;
  severity: "low" | "medium" | "high" | "critical";
  recommendedAction: string;
}

export const AutonomousOps = {
  /**
   * Evaluates whether an action is permitted to run autonomously without human approval.
   */
  canExecuteAutonomously(actionName: string): boolean {
    const policy = AUTOMATION_POLICY_REGISTRY[actionName];
    if (!policy) {
      // Unrecognized action defaults to strictest zero-trust boundary
      return false;
    }

    if (policy.requiresHumanApproval) {
      return false;
    }

    return (
      policy.allowedLevel === "LEVEL_2_AUTOMATED_LOW_RISK" ||
      policy.allowedLevel === "LEVEL_4_RESTRICTED_AUTONOMOUS"
    );
  },

  /**
   * Retrieves full governance policy for an action.
   */
  getPolicy(actionName: string): AutomationPolicy {
    return (
      AUTOMATION_POLICY_REGISTRY[actionName] ?? {
        actionName,
        allowedLevel: "LEVEL_0_MANUAL",
        riskClass: "CRITICAL",
        requiresHumanApproval: true,
        reversible: false,
        maxDailyExecutions: 0,
        description: "Unregistered action defaults to manual human-only execution",
      }
    );
  },

  /**
   * Simple, bounded statistical anomaly detection for operational metrics.
   */
  evaluateMetricAnomaly(
    metricName: string,
    observedValue: number,
    baselineValue: number,
    multiplierThreshold = 3.0
  ): AnomalyEvaluation {
    const safeBaseline = Math.max(baselineValue, 1);
    const ratio = observedValue / safeBaseline;
    const isAnomaly = ratio >= multiplierThreshold;

    let severity: "low" | "medium" | "high" | "critical" = "low";
    if (ratio >= multiplierThreshold * 3) {
      severity = "critical";
    } else if (ratio >= multiplierThreshold * 2) {
      severity = "high";
    } else if (isAnomaly) {
      severity = "medium";
    }

    return {
      metricName,
      observedValue,
      threshold: safeBaseline * multiplierThreshold,
      isAnomaly,
      severity,
      recommendedAction: isAnomaly
        ? `Alert on-call and investigate ${metricName} (observed: ${observedValue}, baseline: ${safeBaseline})`
        : `Metric ${metricName} is within normal operating parameters`,
    };
  },
};

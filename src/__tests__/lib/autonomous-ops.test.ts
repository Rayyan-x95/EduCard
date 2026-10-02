import { describe, it, expect } from "vitest";
import { AutonomousOps } from "@/lib/autonomous-ops";

describe("AutonomousOps Framework", () => {
  it("allows safe reversible self-healing actions to execute autonomously", () => {
    expect(AutonomousOps.canExecuteAutonomously("cache.refresh_stale")).toBe(true);
    expect(AutonomousOps.canExecuteAutonomously("realtime.reconnect")).toBe(true);
    expect(AutonomousOps.canExecuteAutonomously("storage.refresh_signed_url")).toBe(true);
    expect(AutonomousOps.canExecuteAutonomously("data.audit_anomalies")).toBe(true);
  });

  it("strictly prohibits high-risk consequential actions from autonomous execution", () => {
    expect(AutonomousOps.canExecuteAutonomously("user.account_ban")).toBe(false);
    expect(AutonomousOps.canExecuteAutonomously("auth.privilege_escalation")).toBe(false);
    expect(AutonomousOps.canExecuteAutonomously("data.destructive_purge")).toBe(false);
    expect(AutonomousOps.canExecuteAutonomously("institution.verify_domain")).toBe(false);
  });

  it("defaults unknown actions to manual execution only", () => {
    expect(AutonomousOps.canExecuteAutonomously("arbitrary.destructive_command")).toBe(false);
    const policy = AutonomousOps.getPolicy("arbitrary.destructive_command");
    expect(policy.allowedLevel).toBe("LEVEL_0_MANUAL");
    expect(policy.requiresHumanApproval).toBe(true);
  });

  it("detects operational metric anomalies correctly via multiplier thresholds", () => {
    const normal = AutonomousOps.evaluateMetricAnomaly("db.latency_p95_ms", 22, 18, 2.5);
    expect(normal.isAnomaly).toBe(false);
    expect(normal.severity).toBe("low");

    const spike = AutonomousOps.evaluateMetricAnomaly("api.error_rate_per_sec", 35, 10, 3.0);
    expect(spike.isAnomaly).toBe(true);
    expect(spike.severity).toBe("medium");


    const massiveSpike = AutonomousOps.evaluateMetricAnomaly("ai.cost_dollars_hourly", 120, 10, 3.0);
    expect(massiveSpike.isAnomaly).toBe(true);
    expect(massiveSpike.severity).toBe("critical");
  });
});

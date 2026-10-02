import { describe, it, expect } from "vitest";
import { ArchitectureHealthMonitor, type ArchitectureMetrics } from "@/lib/architecture-health";

describe("ArchitectureHealthMonitor", () => {
  it("evaluates clean baseline metrics as EXCELLENT (score 100)", () => {
    const baseline = ArchitectureHealthMonitor.getBaselineMetrics();
    const report = ArchitectureHealthMonitor.evaluateHealth(baseline);

    expect(report.score).toBe(100);
    expect(report.rating).toBe("EXCELLENT");
    expect(report.violations).toHaveLength(0);
    expect(report.recommendations).toHaveLength(0);
  });

  it("penalizes layer violations heavily", () => {
    const metrics: ArchitectureMetrics = {
      totalModules: 100,
      crossBoundaryImports: 0,
      layerViolations: 2, // 2 * 15 = 30 pts penalty
      duplicateLogicInstances: 0,
      deprecatedApiUsages: 0,
      testToCodeRatio: 0.85,
    };

    const report = ArchitectureHealthMonitor.evaluateHealth(metrics);
    expect(report.score).toBe(70);
    expect(report.rating).toBe("DEGRADED");
    expect(report.violations[0]).toContain("direct layer violation");
  });

  it("identifies multiple compounding decay signals", () => {
    const metrics: ArchitectureMetrics = {
      totalModules: 100,
      crossBoundaryImports: 15, // max allowed is 5 -> 10 excessive * 5 = 25 pts penalty (capped)
      layerViolations: 1, // 15 pts penalty
      duplicateLogicInstances: 2, // 10 pts penalty
      deprecatedApiUsages: 1, // 5 pts penalty
      testToCodeRatio: 0.45, // 10 pts penalty (< 0.6)
    };

    const report = ArchitectureHealthMonitor.evaluateHealth(metrics);
    // 100 - 15 - 25 - 10 - 5 - 10 = 35
    expect(report.score).toBe(35);
    expect(report.rating).toBe("CRITICAL");
    expect(report.violations.length).toBeGreaterThanOrEqual(4);
  });
});

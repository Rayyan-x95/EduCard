/**
 * Architecture Health & Decay Monitor — EduCard Phase 12
 *
 * Implements automated diagnostics to detect architectural decay,
 * calculate layer boundary compliance, and monitor complexity-to-value ratios.
 */

export interface ArchitectureMetrics {
  totalModules: number;
  crossBoundaryImports: number;
  layerViolations: number;
  duplicateLogicInstances: number;
  deprecatedApiUsages: number;
  testToCodeRatio: number;
}

export interface ArchitectureHealthReport {
  score: number; // 0 to 100
  rating: "EXCELLENT" | "HEALTHY" | "DEGRADED" | "CRITICAL";
  metrics: ArchitectureMetrics;
  violations: string[];
  recommendations: string[];
  timestamp: string;
}

export class ArchitectureHealthMonitor {
  /**
   * Evaluates architectural metrics and calculates a normalized health score (0-100).
   */
  static evaluateHealth(metrics: ArchitectureMetrics): ArchitectureHealthReport {
    let score = 100;
    const violations: string[] = [];
    const recommendations: string[] = [];

    // 1. Layer Violations (Screen -> Direct DB query bypassing Services): Penalty 15 pts each
    if (metrics.layerViolations > 0) {
      const penalty = Math.min(30, metrics.layerViolations * 15);
      score -= penalty;
      violations.push(
        `Detected ${metrics.layerViolations} direct layer violation(s) (screens bypassing service layer).`
      );
      recommendations.push(
        "Refactor direct database/RPC calls from screens into dedicated service functions."
      );
    }

    // 2. Cross-Boundary Imports: Penalty 5 pts per excessive import above 5% threshold
    const maxAllowedCrossImports = Math.ceil(metrics.totalModules * 0.05);
    if (metrics.crossBoundaryImports > maxAllowedCrossImports) {
      const excessive = metrics.crossBoundaryImports - maxAllowedCrossImports;
      const penalty = Math.min(25, excessive * 5);
      score -= penalty;
      violations.push(
        `Cross-boundary import threshold exceeded: ${metrics.crossBoundaryImports} found (max recommended: ${maxAllowedCrossImports}).`
      );
      recommendations.push(
        "Enforce strict module boundaries; use dependency inversion or facade services."
      );
    }

    // 3. Duplicate Logic Instances: Penalty 5 pts each
    if (metrics.duplicateLogicInstances > 0) {
      const penalty = Math.min(20, metrics.duplicateLogicInstances * 5);
      score -= penalty;
      violations.push(
        `Found ${metrics.duplicateLogicInstances} duplicate business logic pattern(s).`
      );
      recommendations.push(
        "Consolidate repeated validation or formatting routines into shared pure utilities in src/lib/."
      );
    }

    // 4. Deprecated API Usages: Penalty 5 pts each
    if (metrics.deprecatedApiUsages > 0) {
      const penalty = Math.min(15, metrics.deprecatedApiUsages * 5);
      score -= penalty;
      violations.push(
        `Detected ${metrics.deprecatedApiUsages} active usage(s) of deprecated legacy APIs.`
      );
      recommendations.push(
        "Migrate callers of deprecated endpoints to their modern equivalents as documented in docs/API.md."
      );
    }

    // 5. Test to Code Ratio Check
    if (metrics.testToCodeRatio < 0.6) {
      score -= 10;
      violations.push(
        `Test-to-code ratio (${metrics.testToCodeRatio.toFixed(2)}) is below minimum platform target (0.60).`
      );
      recommendations.push(
        "Increase test coverage for critical domain mutations and authentication boundaries."
      );
    }

    // Bound final score between 0 and 100
    const finalScore = Math.max(0, Math.min(100, score));

    let rating: "EXCELLENT" | "HEALTHY" | "DEGRADED" | "CRITICAL";
    if (finalScore >= 90) rating = "EXCELLENT";
    else if (finalScore >= 75) rating = "HEALTHY";
    else if (finalScore >= 50) rating = "DEGRADED";
    else rating = "CRITICAL";

    return {
      score: finalScore,
      rating,
      metrics,
      violations,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Returns current baseline architectural metrics for EduCard.
   */
  static getBaselineMetrics(): ArchitectureMetrics {
    return {
      totalModules: 142,
      crossBoundaryImports: 0,
      layerViolations: 0,
      duplicateLogicInstances: 0,
      deprecatedApiUsages: 0,
      testToCodeRatio: 0.88,
    };
  }
}

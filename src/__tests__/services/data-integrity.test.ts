import { describe, it, expect, vi, beforeEach } from "vitest";
import { DataIntegrityService } from "@/services/data-integrity";
import { supabase } from "@/lib/supabase";

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

function makeChain(result: { data: unknown; error: unknown }) {
  const chain: any = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe("DataIntegrityService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("auditAcceptedAnswers", () => {
    it("returns zero anomalies when all accepted answers are uniquely assigned to questions", async () => {
      const mockAnswers = [
        { id: "a-1", question_id: "q-1", is_accepted: true },
        { id: "a-2", question_id: "q-2", is_accepted: true },
      ];
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: mockAnswers, error: null }) as any);

      const anomalies = await DataIntegrityService.auditAcceptedAnswers();
      expect(anomalies).toHaveLength(0);
    });

    it("detects multiple accepted answers for the same question as a high-severity anomaly", async () => {
      const mockAnswers = [
        { id: "a-1", question_id: "q-duplicate", is_accepted: true },
        { id: "a-2", question_id: "q-duplicate", is_accepted: true },
      ];
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: mockAnswers, error: null }) as any);

      const anomalies = await DataIntegrityService.auditAcceptedAnswers();
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].category).toBe("ACCEPTED_ANSWERS");
      expect(anomalies[0].severity).toBe("high");
      expect(anomalies[0].affectedEntityId).toBe("q-duplicate");
      expect(anomalies[0].description).toMatch(/multiple/);
    });

    it("detects accepted answers missing a question_id", async () => {
      const mockAnswers = [
        { id: "a-orphan", question_id: null, is_accepted: true },
      ];
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: mockAnswers, error: null }) as any);

      const anomalies = await DataIntegrityService.auditAcceptedAnswers();
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].affectedEntityId).toBe("a-orphan");
      expect(anomalies[0].severity).toBe("high");
    });
  });

  describe("auditTopicMappings", () => {
    it("returns zero anomalies for valid topic-question mappings", async () => {
      const mockMappings = [
        { question_id: "q-1", topic_id: "t-1" },
        { question_id: "q-2", topic_id: "t-2" },
      ];
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: mockMappings, error: null }) as any);

      const anomalies = await DataIntegrityService.auditTopicMappings();
      expect(anomalies).toHaveLength(0);
    });

    it("detects null foreign keys in question_topics pairs", async () => {
      const mockMappings = [
        { question_id: "q-1", topic_id: null },
      ];
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: mockMappings, error: null }) as any);

      const anomalies = await DataIntegrityService.auditTopicMappings();
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].category).toBe("ORPHANED_TOPICS");
      expect(anomalies[0].severity).toBe("low");
    });
  });

  describe("auditCommunityMemberships", () => {
    it("returns zero anomalies for valid community memberships", async () => {
      const mockMembers = [
        { community_id: "c-1", user_id: "u-1", role: "member" },
      ];
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: mockMembers, error: null }) as any);

      const anomalies = await DataIntegrityService.auditCommunityMemberships();
      expect(anomalies).toHaveLength(0);
    });

    it("detects missing user_id or community_id as INVALID_MEMBERSHIPS anomaly", async () => {
      const mockMembers = [
        { community_id: "c-1", user_id: null, role: "member" },
      ];
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: mockMembers, error: null }) as any);

      const anomalies = await DataIntegrityService.auditCommunityMemberships();
      expect(anomalies).toHaveLength(1);
      expect(anomalies[0].category).toBe("INVALID_MEMBERSHIPS");
      expect(anomalies[0].severity).toBe("medium");
    });
  });

  describe("calculateDataQualityScore", () => {
    it("returns 100 composite score when zero anomalies exist", () => {
      const scores = DataIntegrityService.calculateDataQualityScore([]);
      expect(scores.composite).toBe(100);
      expect(scores.knowledge).toBe(100);
      expect(scores.community).toBe(100);
    });

    it("deducts quality points appropriately when anomalies exist", () => {
      const anomalies: any[] = [
        { category: "ACCEPTED_ANSWERS", severity: "high" },
        { category: "INVALID_MEMBERSHIPS", severity: "medium" },
      ];
      const scores = DataIntegrityService.calculateDataQualityScore(anomalies);
      expect(scores.composite).toBeLessThan(100);
      expect(scores.knowledge).toBeLessThan(100);
      expect(scores.community).toBeLessThan(100);
    });
  });

  describe("runComprehensiveAudit", () => {
    it("aggregates all audits into a structured health report with quality scores", async () => {
      vi.mocked(supabase.from).mockReturnValue(makeChain({ data: [], error: null }) as any);

      const report = await DataIntegrityService.runComprehensiveAudit();
      expect(report.healthy).toBe(true);
      expect(report.totalAnomalies).toBe(0);
      expect(report.timestamp).toBeTruthy();
      expect(report.qualityScores).toBeDefined();
      expect(report.qualityScores?.composite).toBe(100);
    });
  });
});


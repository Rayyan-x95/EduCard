import { describe, it, expect, vi, beforeEach } from "vitest";
import { QuestionsService } from "@/services/questions";

const mockRpc = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: "auth-user-id" } } },
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "auth-user-id" } },
      }),
    },
  },
}));

describe("Mutation Idempotency & Reliability (Services)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("QuestionsService.acceptAnswer", () => {
    it("dispatches accept_answer RPC with expected parameters", async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null });

      await expect(
        QuestionsService.acceptAnswer("q-123", "ans-456")
      ).resolves.not.toThrow();

      expect(mockRpc).toHaveBeenCalledWith("accept_answer", {
        p_question_id: "q-123",
        p_answer_id: "ans-456",
      });
    });

    it("surfaces database-level self-acceptance errors", async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "Question authors cannot accept their own answer", code: "42501" },
      });

      await expect(
        QuestionsService.acceptAnswer("q-123", "ans-self")
      ).rejects.toMatchObject({
        message: "Question authors cannot accept their own answer",
      });
    });
  });

  describe("Client-side In-flight Double Submission Guards", () => {
    it("simulates client in-flight check preventing duplicate mutation execution", () => {
      let isPending = false;
      const executionCalls: string[] = [];

      const triggerAction = (actionId: string) => {
        if (isPending) return; // In-flight guard
        isPending = true;
        executionCalls.push(actionId);
      };

      // First tap
      triggerAction("tap-1");
      expect(executionCalls).toEqual(["tap-1"]);

      // Rapid second tap while isPending is true
      triggerAction("tap-2");
      expect(executionCalls).toEqual(["tap-1"]); // Blocked by guard

      // Mutation settles
      isPending = false;

      // Legitimate subsequent tap
      triggerAction("tap-3");
      expect(executionCalls).toEqual(["tap-1", "tap-3"]);
    });
  });
});

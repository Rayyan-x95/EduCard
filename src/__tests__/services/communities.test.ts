import { describe, it, expect, vi } from "vitest";
import { CommunitiesService } from "../../services/communities";

vi.mock("@/lib/supabase", () => ({
  supabase: {},
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(null),
  deleteItemAsync: vi.fn().mockResolvedValue(null),
}));

describe("CommunitiesService", () => {
  it("exposes the full membership + content API", () => {
    expect(typeof CommunitiesService.listCommunities).toBe("function");
    expect(typeof CommunitiesService.getCommunityBySlug).toBe("function");
    expect(typeof CommunitiesService.isMember).toBe("function");
    expect(typeof CommunitiesService.joinCommunity).toBe("function");
    expect(typeof CommunitiesService.leaveCommunity).toBe("function");
    expect(typeof CommunitiesService.listCommunityQuestions).toBe("function");
    expect(typeof CommunitiesService.createCommunity).toBe("function");
  });
});

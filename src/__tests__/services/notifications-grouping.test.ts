import { describe, it, expect, vi } from "vitest";
import { groupNotifications, NotificationRecord, NotificationsService } from "@/services/notifications";

vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: "mock-token" }),
  addNotificationResponseReceivedListener: vi.fn(),
}));

vi.mock("expo-device", () => ({
  isDevice: true,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("groupNotifications", () => {
  it("returns empty array when records are empty or undefined", () => {
    expect(groupNotifications([])).toEqual([]);
    expect(groupNotifications((undefined as unknown) as NotificationRecord[])).toEqual([]);
  });

  it("leaves single distinct notifications as individual groups of count 1", () => {
    const input: NotificationRecord[] = [
      {
        id: "n-1",
        recipient_id: "u-1",
        type: "answer_created",
        entity_type: "question",
        entity_id: "q-100",
        created_at: "2026-09-15T10:00:00Z",
        actor: { id: "a-1", display_name: "Alice", username: "alice" },
        read_at: "2026-09-15T10:05:00Z",
      },
      {
        id: "n-2",
        recipient_id: "u-1",
        type: "follow",
        entity_type: "profile",
        entity_id: "u-200",
        created_at: "2026-09-15T09:00:00Z",
        actor: { id: "a-2", display_name: "Bob", username: "bob" },
        read_at: null,
      },
    ];

    const grouped = groupNotifications(input);
    expect(grouped).toHaveLength(2);
    expect(grouped[0].count).toBe(1);
    expect(grouped[0].id).toBe("n-1");
    expect(grouped[0].ids).toEqual(["n-1"]);
    expect(grouped[0].read_at).toBe("2026-09-15T10:05:00Z");

    expect(grouped[1].count).toBe(1);
    expect(grouped[1].id).toBe("n-2");
    expect(grouped[1].ids).toEqual(["n-2"]);
    expect(grouped[1].read_at).toBeNull();
  });

  it("consolidates multiple notifications of the same type on the same entity into a single group", () => {
    const input: NotificationRecord[] = [
      {
        id: "n-3",
        recipient_id: "u-1",
        type: "answer_created",
        entity_type: "question",
        entity_id: "q-500",
        created_at: "2026-09-15T12:00:00Z",
        actor: { id: "a-3", display_name: "Charlie", username: "charlie" },
        read_at: null,
      },
      {
        id: "n-2",
        recipient_id: "u-1",
        type: "answer_created",
        entity_type: "question",
        entity_id: "q-500",
        created_at: "2026-09-15T11:00:00Z",
        actor: { id: "a-2", display_name: "Bob", username: "bob" },
        read_at: "2026-09-15T11:30:00Z",
      },
      {
        id: "n-1",
        recipient_id: "u-1",
        type: "answer_created",
        entity_type: "question",
        entity_id: "q-500",
        created_at: "2026-09-15T10:00:00Z",
        actor: { id: "a-1", display_name: "Alice", username: "alice" },
        read_at: "2026-09-15T10:30:00Z",
      },
    ];

    const grouped = groupNotifications(input);
    expect(grouped).toHaveLength(1);

    const group = grouped[0];
    expect(group.count).toBe(3);
    expect(group.entity_id).toBe("q-500");
    expect(group.entity_type).toBe("question");
    expect(group.type).toBe("answer_created");
    expect(group.ids).toEqual(["n-3", "n-2", "n-1"]);
    // Since n-3 is unread, the overall group is unread
    expect(group.read_at).toBeNull();
    // Latest timestamp and id
    expect(group.id).toBe("n-3");
    expect(group.created_at).toBe("2026-09-15T12:00:00Z");
    // All 3 actors captured
    expect(group.actors).toHaveLength(3);
    expect(group.actors.map((a) => a.display_name)).toEqual(["Charlie", "Bob", "Alice"]);
  });

  it("does not deduplicate actors when the same actor triggered another notification if already present", () => {
    const input: NotificationRecord[] = [
      {
        id: "n-2",
        recipient_id: "u-1",
        type: "helpful_voted",
        entity_type: "answer",
        entity_id: "ans-1",
        created_at: "2026-09-15T12:00:00Z",
        actor: { id: "a-1", display_name: "Alice", username: "alice" },
        read_at: "2026-09-15T12:05:00Z",
      },
      {
        id: "n-1",
        recipient_id: "u-1",
        type: "helpful_voted",
        entity_type: "answer",
        entity_id: "ans-1",
        created_at: "2026-09-15T11:00:00Z",
        actor: { id: "a-1", display_name: "Alice", username: "alice" },
        read_at: "2026-09-15T11:05:00Z",
      },
    ];

    const grouped = groupNotifications(input);
    expect(grouped).toHaveLength(1);
    expect(grouped[0].count).toBe(2);
    expect(grouped[0].actors).toHaveLength(1);
    expect(grouped[0].actors[0].id).toBe("a-1");
  });

  it("is exposed on NotificationsService.groupNotifications", () => {
    expect(NotificationsService.groupNotifications).toBe(groupNotifications);
  });
});

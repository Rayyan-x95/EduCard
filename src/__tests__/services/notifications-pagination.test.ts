import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationsService } from "@/services/notifications";

/**
 * Notifications pagination — verifies the client-side dedupe that absorbs
 * PostgREST's inability to express tuple comparison. When two rows share a
 * `created_at`, the cursor page can re-deliver the boundary row; the service
 * must filter it by id.
 */

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null } }) },
  },
}));

// expo-notifications side effects (setNotificationHandler) must be stubbed
vi.mock("expo-notifications", () => ({
  setNotificationHandler: vi.fn(),
  AndroidImportance: { HIGH: 4, MAX: 5 },
  getPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  requestPermissionsAsync: vi.fn().mockResolvedValue({ status: "granted" }),
  setNotificationChannelAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn().mockResolvedValue({ data: "" }),
  addNotificationResponseReceivedListener: vi.fn().mockReturnValue({ remove: () => {} }),
}));

vi.mock("expo-device", () => ({ isDevice: false }));

function buildChain(rows: unknown[]) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const proxy: any = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "then") {
          // Terminal await — resolve with the configured rows.
          return (_resolve: any, reject: any) =>
            Promise.resolve({ data: rows, error: null }).then(_resolve, reject);
        }
        if (!chain[prop]) {
          chain[prop] = vi.fn().mockReturnValue(proxy);
        }
        return chain[prop];
      },
    }
  );
  return { proxy, chain };
}

describe("NotificationsService.getNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns rows as-is when there are no duplicates", async () => {
    const rows = [
      { id: "a", created_at: "2026-01-01T00:00:02Z" },
      { id: "b", created_at: "2026-01-01T00:00:01Z" },
    ];
    const { proxy } = buildChain(rows);
    mockFrom.mockReturnValue(proxy);

    const result = await NotificationsService.getNotifications(null, "user-1");
    expect(result.map((r) => r.id)).toEqual(["a", "b"]);
  });

  it("dedupes boundary rows sharing the same id across pages", async () => {
    const rows = [
      { id: "dup", created_at: "2026-01-01T00:00:02Z" },
      { id: "x", created_at: "2026-01-01T00:00:01Z" },
      { id: "dup", created_at: "2026-01-01T00:00:02Z" }, // page-boundary replay
    ];
    const { proxy } = buildChain(rows);
    mockFrom.mockReturnValue(proxy);

    const result = await NotificationsService.getNotifications(null, "user-1");
    expect(result).toHaveLength(2);
    expect(result.filter((r) => r.id === "dup")).toHaveLength(1);
  });

  it("applies recipient filter and composite cursor predicate when provided", async () => {
    const rows: unknown[] = [];
    const { proxy, chain } = buildChain(rows);
    mockFrom.mockReturnValue(proxy);

    await NotificationsService.getNotifications(
      { createdAt: "2026-01-01T00:00:00Z", id: "abc" },
      "user-42"
    );

    expect(chain.eq).toHaveBeenCalledWith("recipient_id", "user-42");
    // Composite keyset predicate: strictly-older timestamps OR equal
    // timestamps with a strictly-smaller id. A bare lt(created_at) would
    // permanently skip same-timestamp boundary rows.
    expect(chain.or).toHaveBeenCalledWith(
      "created_at.lt.2026-01-01T00:00:00Z,and(created_at.eq.2026-01-01T00:00:00Z,id.lt.abc)"
    );
    expect(chain.limit).toHaveBeenCalledWith(30);
  });

  it("propagates query errors instead of swallowing them", async () => {
    const failing: any = new Proxy(
      {},
      {
        get(_t, prop: string) {
          if (prop === "then") {
            return (resolve: any) =>
              Promise.resolve({ data: null, error: { message: "RLS denied" } }).then(resolve);
          }
          return vi.fn().mockReturnValue(failing);
        },
      }
    );
    mockFrom.mockReturnValue(failing);

    await expect(NotificationsService.getNotifications(null, "u")).rejects.toMatchObject({
      message: "RLS denied",
    });
  });
});

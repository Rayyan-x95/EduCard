import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { supabase } from "@/lib/supabase";

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // SDK 53+ split shouldShowAlert into banner + list presentation.
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Values written by database triggers / RPCs — keep in sync with SQL. */
export const NOTIFICATION_TYPES = {
  ANSWER_CREATED: "answer_created",
  ANSWER_ACCEPTED: "answer_accepted",
  FOLLOW: "follow",
} as const;

const PAGE_SIZE = 30;

export interface NotificationRecord {
  id: string;
  recipient_id: string;
  actor_id?: string | null;
  type: string;
  entity_type: string;
  entity_id: string;
  read_at?: string | null;
  created_at: string;
  actor?: {
    id: string;
    display_name: string;
    username: string;
    avatar_path?: string | null;
  } | null;
}

export const NotificationsService = {
  /**
   * Request push notification permission and register the Expo token.
   */
  async registerForPushNotifications(userId: string): Promise<string | null> {
    if (Platform.OS === "web" || !Device.isDevice) {
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        return null;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Academic Updates",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#bdc2ff",
        });
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync();
      const token = tokenResponse.data;

      if (token && userId) {
        await supabase.from("push_tokens").upsert(
          {
            user_id: userId,
            expo_push_token: token,
            device_os: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,expo_push_token" }
        );
      }

      return token;
    } catch {
      return null;
    }
  },

  addNotificationResponseReceivedListener(
    handler: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  /**
   * Keyset-paginated in-app notifications for the signed-in user. RLS scopes
   * every row to recipient_id = auth.uid(); the explicit filter is
   * defense-in-depth.
   *
   * Keyset pagination (cursor = created_at + id) uses a single `lt` on
   * created_at combined with an OR clause that handles the equal-timestamp
   * case via id comparison. PostgREST cannot express tuple comparison, so
   * the two-branch predicate below is the correct composite-cursor encoding:
   *   (created_at < c) OR (created_at = c AND id < cursor_id)
   * Rows are deduped client-side by id to absorb realtime insert races.
   */
  async getNotifications(
    cursor?: { createdAt: string; id: string } | null,
    userId?: string
  ): Promise<NotificationRecord[]> {
    let query = supabase
      .from("notifications")
      .select(
        `
        *,
        actor:profiles!notifications_actor_id_fkey(
          id,
          display_name,
          username,
          avatar_path
        )
      `
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(PAGE_SIZE);

    if (userId) {
      query = query.eq("recipient_id", userId);
    }

    if (cursor?.createdAt && cursor.id) {
      // Composite-cursor encoding for PostgREST (no tuple comparison):
      //   created_at < c  OR  (created_at = c AND id < cursor.id)
      // A bare lt(created_at) alone permanently skips every row that shares
      // the boundary timestamp (e.g. same-transaction trigger inserts).
      query = query.or(
        `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
      );
    }

    const { data, error } = await query;
    if (error) throw error;

    // Dedupe by id: a page boundary can re-deliver the cursor row when
    // timestamps collide across pages. Map guarantees stable ordering.
    const seen = new Set<string>();
    const rows = ((data as unknown) as NotificationRecord[]) || [];
    return rows.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  },

  /** Cursor for the next page given the last row of the current page. */
  nextNotificationCursor(rows: NotificationRecord[]): { createdAt: string; id: string } | null {
    if (!rows || rows.length < PAGE_SIZE) return null;
    const last = rows[rows.length - 1];
    return { createdAt: last.created_at, id: last.id };
  },

  async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null)
      .eq("recipient_id", userId);

    if (error) throw error;
  },

  /**
   * Server-side unread count via get_unread_notification_count() (served by
   * the partial unread index). The client previously derived this from
   * whatever pages happened to be loaded, so the "Mark all read" control
   * disappeared once unread items scrolled past the first page.
   */
  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc("get_unread_notification_count");
    if (error) throw error;
    return Number(data ?? 0);
  },
};

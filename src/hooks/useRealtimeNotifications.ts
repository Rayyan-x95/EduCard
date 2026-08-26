import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Telemetry } from "@/lib/telemetry";

/**
 * Subscribes to new notification rows for the signed-in user and refreshes
 * cached notification queries so in-app alerts appear without manual
 * pull-to-refresh. Complements (not replaces) push delivery.
 *
 * Failure behavior: if realtime is unavailable the app degrades to
 * pull-to-refresh and mutation invalidations — never a crash. Failures are
 * reported to telemetry so saturation/outages are diagnosable in production.
 */
export function useRealtimeNotifications(userId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          Telemetry.addBreadcrumb("realtime", "notifications channel failure", {
            status,
            userId,
          }, "error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

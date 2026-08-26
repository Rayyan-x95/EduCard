// Supabase Edge Function: send-push
//
// Delivers unread notifications as Expo push messages. Designed to be
// triggered by a Supabase Database Webhook on `notifications` INSERT, or by
// a scheduled job that sweeps rows where `push_sent_at IS NULL`.
//
// SECURITY: the function requires a shared secret on every invocation.
// Set it once with:
//   supabase secrets set SEND_PUSH_WEBHOOK_SECRET=<random 32+ byte value>
// and send it as the `x-send-push-secret` header from the webhook config /
// scheduler. If the secret is not configured the function FAILS CLOSED —
// this prevents arbitrary third parties from driving push sweeps against
// your project (the function is commonly deployed with --no-verify-jwt).
//
// Deploy:
//   supabase functions deploy send-push --no-verify-jwt
//
// Webhook payload: { type: "INSERT", record: { ...notification row } }
// The function resolves the recipient's device tokens, honours their
// notification preferences (answer_notifications / dm_notifications),
// dispatches via Expo Push API, and stamps notifications.push_sent_at.
//
// DELIVERY SEMANTICS: push_sent_at is stamped when at least one device
// ticket returns status "ok", or when every ticket fails terminally
// (DeviceNotRegistered). Mixed or unknown failures leave the row untouched
// so the scheduled sweep can retry without duplicates.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string;
  entity_id: string;
}

interface ExpoTicket {
  status?: string;
  message?: string;
  details?: { error?: string };
}

/** Early-exit-free comparison so the secret is not leaked via timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  // Fail closed without a configured secret.
  const requiredSecret = Deno.env.get("SEND_PUSH_WEBHOOK_SECRET");
  if (!requiredSecret) {
    return new Response(
      JSON.stringify({ error: "send-push is not configured (missing webhook secret)." }),
      { status: 503 }
    );
  }

  const providedSecret = req.headers.get("x-send-push-secret") ?? "";
  if (!timingSafeEqual(providedSecret, requiredSecret)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.json();

    // Webhook shape: { type, record }. Sweep-shape: { ids: [...] }.
    let rows: NotificationRow[] = [];
    if (body?.record?.id) {
      rows = [body.record as NotificationRow];
    } else if (Array.isArray(body?.ids)) {
      const { data } = await supabaseAdmin
        .from("notifications")
        .select("id, recipient_id, actor_id, type, entity_type, entity_id")
        .in("id", body.ids)
        .is("push_sent_at", null);
      rows = (data ?? []) as NotificationRow[];
    } else {
      // Scheduled sweep of anything not yet sent.
      const { data } = await supabaseAdmin
        .from("notifications")
        .select("id, recipient_id, actor_id, type, entity_type, entity_id")
        .is("push_sent_at", null)
        .limit(100);
      rows = (data ?? []) as NotificationRow[];
    }

    let dispatched = 0;

    for (const row of rows) {
      // Resolve recipient preferences + tokens in parallel.
      const [profileRes, tokensRes] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("display_name, answer_notifications, dm_notifications")
          .eq("id", row.recipient_id)
          .single(),
        supabaseAdmin
          .from("push_tokens")
          .select("expo_push_token")
          .eq("user_id", row.recipient_id),
      ]);

      const prefs = profileRes.data as any;

      // Honour user notification preferences.
      if (prefs) {
        if (
          (row.type === "answer_created" && prefs.answer_notifications === false) ||
          (row.type === "answer_accepted" && prefs.answer_notifications === false)
        ) {
          await markSent(supabaseAdmin, row.id);
          continue;
        }
        // DM-style notifications reserved for future messaging features.
        if (row.type.startsWith("dm_") && prefs.dm_notifications === false) {
          await markSent(supabaseAdmin, row.id);
          continue;
        }
      }

      const EXPO_TOKEN_RE = /^ExponentPushToken\[[A-Za-z0-9_-]{22}\]$/;
      const tokens = ((tokensRes.data ?? []) as any[])
        .map((t) => t.expo_push_token)
        .filter((tok: string) => typeof tok === "string" && EXPO_TOKEN_RE.test(tok));
      if (tokens.length === 0) {
        await markSent(supabaseAdmin, row.id);
        continue;
      }

      const actorNameRes = row.actor_id
        ? await supabaseAdmin
            .from("profiles")
            .select("display_name")
            .eq("id", row.actor_id)
            .single()
        : null;

      const actorName = (actorNameRes?.data as any)?.display_name ?? "A scholar";
      const { title, bodyText, data } = compose(row, actorName);

      let res: Response;
      try {
        res = await fetch(EXPO_PUSH_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(Deno.env.get("EXPO_ACCESS_TOKEN")
              ? { Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}` }
              : {}),
          },
          body: JSON.stringify({
            to: tokens,
            title,
            body: bodyText,
            data,
            sound: "default",
            priority: "high",
          }),
        });
      } catch (networkError) {
        console.error("send-push upstream unreachable:", networkError);
        // Leave push_sent_at NULL so the sweep retries later.
        continue;
      }

      if (!res.ok) {
        console.error(`send-push upstream HTTP ${res.status} for notification ${row.id}`);
        // Transient/unknown upstream failure — allow sweep retry.
        continue;
      }

      let tickets: ExpoTicket[] = [];
      try {
        const payload = await res.json();
        if (Array.isArray(payload?.data)) tickets = payload.data as ExpoTicket[];
      } catch {
        tickets = [];
      }

      // Multi-device sends return one ticket per token. Evaluate ALL of them:
      // reading only tickets[0] meant a dead second device silently poisoned
      // the bookkeeping for the first.
      if (tickets.length === 0) {
        console.error(`send-push returned no tickets for notification ${row.id}`);
        continue; // leave unsent → sweep retries
      }

      const anyDelivered = tickets.some((t) => t?.status === "ok");
      const allTerminal = tickets.every(
        (t) => t?.status === "error" && t?.details?.error === "DeviceNotRegistered"
      );

      if (anyDelivered) {
        dispatched += 1;
        await markSent(supabaseAdmin, row.id);
        continue;
      }

      if (allTerminal) {
        console.warn(
          `send-push all devices unregistered for notification ${row.id}; dropping.`
        );
        await markSent(supabaseAdmin, row.id);
        continue;
      }

      // Mixed/unknown failures: keep the row queued for sweep retry rather
      // than risking a lost delivery on the not-yet-failed device.
      console.error(
        `send-push ticket errors for notification ${row.id}:`,
        tickets.map((t) => t?.message ?? "unknown").join(" | ")
      );
    }

    return new Response(JSON.stringify({ ok: true, dispatched }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-push failure:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});

function compose(row: NotificationRow, actorName: string) {
  switch (row.type) {
    case "answer_created":
      return {
        title: "New Scholarly Answer",
        bodyText: `${actorName} answered your question.`,
        data: { questionId: row.entity_id },
      };
    case "answer_accepted":
      return {
        title: "Solution Accepted 🎓",
        bodyText: `${actorName} marked your answer as the accepted solution (+15 rep).`,
        data: { questionId: row.entity_id },
      };
    case "follow":
      return {
        title: "New Follower",
        bodyText: `${actorName} is now following your work.`,
        data: { profileId: row.entity_id },
      };
    default:
      return {
        title: "EduCard Update",
        bodyText: "You have a new academic notification.",
        data: {},
      };
  }
}

async function markSent(admin: ReturnType<typeof createClient>, id: string) {
  await admin.from("notifications").update({ push_sent_at: new Date().toISOString() }).eq("id", id);
}

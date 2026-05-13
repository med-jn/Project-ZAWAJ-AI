import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

import { createClient }
from "https://esm.sh/@supabase/supabase-js@2";

import { JWT }
from "https://esm.sh/google-auth-library@8.7.0";

serve(async (req) => {
  try {

    const { record } =
      await req.json();

    const supabase =
      createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

    /* ═══════════════════════════════
       TARGET USER
    ═══════════════════════════════ */

    const targetUserId =
      record.to_user || record.id;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({
          error: "Missing target user"
        }),
        { status: 400 }
      );
    }

    /* ═══════════════════════════════
       TOKENS
    ═══════════════════════════════ */

    const { data: tokens } =
      await supabase
        .from("fcm_tokens")
        .select("token")
        .eq("user_id", targetUserId);

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No devices found"
        }),
        { status: 200 }
      );
    }

    /* ═══════════════════════════════
       SENDER PROFILE
    ═══════════════════════════════ */

    let sender: any = null;

    if (record.from_user) {
      const { data } =
        await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            avatar_url,
            gender
          `)
          .eq("id", record.from_user)
          .single();

      sender = data;
    }

    /* ═══════════════════════════════
       FIREBASE AUTH
    ═══════════════════════════════ */

    const serviceAccount =
      JSON.parse(
        Deno.env.get(
          "FIREBASE_SERVICE_ACCOUNT"
        ) ?? "{}"
      );

    const client = new JWT({
      email:
        serviceAccount.client_email,

      key:
        serviceAccount.private_key,

      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
      ],
    });

    const token =
      await client.getAccessToken();

    const accessToken =
      token.token;

    const projectId =
      serviceAccount.project_id;

    /* ═══════════════════════════════
       NOTIFICATION TYPE
    ═══════════════════════════════ */

    const type =
      record.type || "system";

    let title = "ZAWAJ AI";
    let body  = "";

    switch (type) {

      case "message":
        title =
          sender?.full_name ||
          "رسالة جديدة";

        body =
          record.message ||
          "لديك رسالة جديدة";
        break;

      case "like":
        title =
          "إعجاب جديد";

        body =
          `${sender?.full_name || "أحدهم"} أعجب بملفك الشخصي`;
        break;

      case "view":
        title =
          "زيارة جديدة";

        body =
          `${sender?.full_name || "أحدهم"} زار ملفك الشخصي`;
        break;

      case "match":
        title =
          "توافق جديد";

        body =
          `لقد حصل توافق بينكما`;
        break;

      default:
        title =
          record.title ||
          "إشعار جديد";

        body =
          record.message || "";
    }

    /* ═══════════════════════════════
       PREMIUM PAYLOAD
    ═══════════════════════════════ */

    const results =
      await Promise.all(

        tokens.map(async (t: any) => {

          const payload = {

            message: {

              token: t.token,

              /**
               * ⚠️ لا تستعمل notification
               * حتى لا يقتل Android
               * التصميم المخصص
               */

              data: {

                type:
                  String(type),

                title:
                  String(title),

                body:
                  String(body),

                avatar:
                  String(
                    sender?.avatar_url || ""
                  ),

                from_user:
                  String(
                    sender?.id || ""
                  ),

                conversation_id:
                  String(
                    record.conversation_id || ""
                  ),

                click_action:
                  "OPEN_NOTIFICATION",

                route:
                  type === "message"
                    ? `/chat?id=${record.conversation_id}`
                    : sender?.id
                      ? `/profile/${sender.id}`
                      : "/",

                created_at:
                  new Date().toISOString(),
              },

              android: {

                priority: "high",

                ttl: "120s",

                collapse_key:
                  type,

                notification: {

                  channel_id:
                    type === "message"
                      ? "messages"
                      : "social",

                  sound: "default",

                  visibility: "PUBLIC",

                  notification_priority:
                    "PRIORITY_MAX",

                  default_vibrate_timings: true,

                  default_sound: true,

                  icon:
                    "ic_stat_logo",

                  color:
                    "#B3334B",

                  tag:
                    type,

                  sticky: false,
                },
              },
            },
          };

          const res =
            await fetch(
              `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${accessToken}`,
                },

                body:
                  JSON.stringify(payload),
              }
            );

          return await res.json();
        })
      );

    return new Response(
      JSON.stringify({
        success: true,
        count: results.length,
        results,
      }),
      { status: 200 }
    );

  } catch (err: any) {

    return new Response(
      JSON.stringify({
        error: err.message,
      }),
      { status: 500 }
    );
  }
});
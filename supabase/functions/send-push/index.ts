import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JWT } from "https://esm.sh/google-auth-library@8.7.0";

serve(async (req) => {
  try {
    // =========================================
    // 1. Parse request body
    // =========================================

    const body = await req.json();
    const record = body.record;

    if (!record) {
      return new Response(
        JSON.stringify({ error: "Missing record" }),
        { status: 400 }
      );
    }

    // =========================================
    // 2. Init Supabase Admin
    // =========================================

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // =========================================
    // 3. Resolve target user
    // =========================================

    const targetUserId = record.id;

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "Missing target user id" }),
        { status: 400 }
      );
    }

    // =========================================
    // 4. Fetch FCM tokens
    // =========================================

    const { data: tokensData, error: tokenError } = await supabase
      .from("fcm_tokens")
      .select("id, token")
      .eq("user_id", targetUserId);

    if (tokenError) {
      console.error("Token fetch error:", tokenError);

      return new Response(
        JSON.stringify({ error: "Failed to fetch tokens" }),
        { status: 500 }
      );
    }

    if (!tokensData || tokensData.length === 0) {
      console.log("No tokens found for user:", targetUserId);

      return new Response(
        JSON.stringify({ success: true, message: "No tokens found" }),
        { status: 200 }
      );
    }

    // =========================================
    // 5. Firebase auth
    // =========================================

    const serviceAccount = JSON.parse(
      Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}"
    );

    const jwtClient = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
    });

    const auth = await jwtClient.authorize();

    const accessToken = auth.access_token;

    const projectId = serviceAccount.project_id;

    // =========================================
    // 6. Notification content
    // =========================================

    const notificationType = record.type ?? "message";

    const title =
      notificationType === "like"
        ? "إعجاب جديد ❤️"
        : "رسالة جديدة 💬";

    const bodyText =
      record.message?.slice(0, 120) ??
      "لديك إشعار جديد";

    // =========================================
    // 7. Send notifications
    // =========================================

    const results = await Promise.allSettled(
      tokensData.map(async (row: any) => {
        const token = row.token;

        const payload = {
          message: {
            token,

            notification: {
              title,
              body: bodyText,
            },

            data: {
              type: notificationType,
              chatId: String(record.chat_id ?? ""),
              senderId: String(record.sender_id ?? ""),
              targetUserId: String(targetUserId),
              click_action: "OPEN_CHAT",
            },

            android: {
              priority: "HIGH",

              collapse_key: `chat_${record.chat_id ?? "default"}`,

              notification: {
                channel_id: "messages",
                sound: "default",
                icon: "ic_notification",
                priority: "PRIORITY_HIGH",
                visibility: "PUBLIC",
                default_vibrate_timings: true,
              },
            },
          },
        };

        const response = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await response.json();

        // =========================================
        // 8. Remove invalid tokens
        // =========================================

        if (!response.ok) {
          console.error("FCM error:", result);

          const errorCode =
            result?.error?.details?.[0]?.errorCode;

          const invalid =
            errorCode === "UNREGISTERED" ||
            errorCode === "INVALID_ARGUMENT";

          if (invalid) {
            console.log("Removing dead token:", token);

            await supabase
              .from("fcm_tokens")
              .delete()
              .eq("id", row.id);
          }
        }

        return result;
      })
    );

    // =========================================
    // 9. Final response
    // =========================================

    console.log("Push notifications processed");

    return new Response(
      JSON.stringify({
        success: true,
        sent: results.length,
        results,
      }),
      {
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Edge Function crash:", error);

    return new Response(
      JSON.stringify({
        error: error.message ?? "Unknown error",
      }),
      {
        status: 500,
      }
    );
  }
});
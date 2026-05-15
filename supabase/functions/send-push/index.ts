/**
 * 📁 supabase/functions/send-push/index.ts — ZAWAJ AI
 *
 * ✔ يقرأ تفضيلات القنوات من fcm_tokens
 * ✔ يرسل لكل أجهزة المستخدم النشطة
 * ✔ يحترم is_active — يتجاهل tokens المعطّلة
 * ✔ يحترم channel_* — يحترم تفضيل المستخدم لكل قناة
 * ✔ يعطّل token تلقائياً عند رفض FCM
 * ✔ نصوص عربية ذكية حسب الجنس
 * ✔ Deep Linking كامل
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JWT }          from "https://esm.sh/google-auth-library@8.7.0";

// ── خريطة نوع الإشعار → القناة ───────────────────────────────
const TYPE_TO_CHANNEL: Record<string, string> = {
  message:          'channel_messages',
  mediator:         'channel_mediator',
  like:             'channel_social',
  view:             'channel_social',
  match:            'channel_social',
  contact_request:  'channel_social',
  subscription:     'channel_subscription',
  system:           'channel_system',
};

// ── خريطة نوع الإشعار → قناة Android ────────────────────────
const TYPE_TO_ANDROID_CHANNEL: Record<string, string> = {
  message:          'messages',
  mediator:         'messages',
  like:             'social',
  view:             'social',
  match:            'social',
  contact_request:  'social',
  subscription:     'subscription',
  system:           'system',
};

// ── بناء المسار الصحيح ────────────────────────────────────────
function resolveRoute(
  type: string,
  record: any,
  sender: any
): string {
  switch (type) {
    case 'message':
      return record.conversation_id
        ? `/chat?id=${record.conversation_id}`
        : '/notifications';

    case 'mediator':
      return record.conversation_id
        ? `/chat?id=${record.conversation_id}`
        : '/mediators';

    case 'like':
    case 'view':
    case 'match':
    case 'contact_request':
      return sender?.id
        ? `/profile/${sender.id}`
        : '/likes';

    case 'subscription':
      return '/subscribers';

    case 'system':
    default:
      return '/notifications';
  }
}

// ── بناء العنوان والنص حسب الجنس ─────────────────────────────
function buildText(
  type: string,
  record: any,
  sender: any
): { title: string; body: string } {

  const name   = sender?.full_name?.trim() || 'مستخدم';
  const gender = sender?.gender ?? null;

  const verb = (male: string, female: string) =>
    gender === 'female' ? female : male;

  switch (type) {

    case 'message':
      return {
        title: name,
        body:  record.message ||
               `${name} ${verb('أرسل لك رسالة', 'أرسلت لك رسالة')}`,
      };

    case 'like':
      return {
        title: 'إعجاب جديد ❤️',
        body:  `${name} ${verb('أعجب بملفك الشخصي', 'أعجبت بملفك الشخصي')}`,
      };

    case 'view':
      return {
        title: 'زيارة جديدة 👀',
        body:  `${name} ${verb('زار ملفك الشخصي', 'زارت ملفك الشخصي')}`,
      };

    case 'match':
      return {
        title: 'توافق جديد 🎉',
        body:  `حدث توافق بينك وبين ${name}`,
      };

    case 'contact_request':
      return {
        title: 'طلب تواصل',
        body:  `${name} ${verb('أرسل طلب تواصل', 'أرسلت طلب تواصل')}`,
      };

    case 'mediator':
      return {
        title: `الوسيط ${name}`,
        body:  record.message || 'يرغب بالتواصل معك',
      };

    case 'subscription':
      return {
        title: 'مشترك جديد! 🎉',
        body:  `${name} ${verb('اشترك في خدماتك', 'اشتركت في خدماتك')}`,
      };

    default:
      return {
        title: record.title || 'ZAWAJ AI',
        body:  record.message || 'إشعار جديد',
      };
  }
}

// ════════════════════════════════════════════════════════════
serve(async (req) => {
  try {

    const { record } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")             ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    /* ── المستخدم المستهدف ──────────────────────────────── */
    const targetUserId = record.to_user;
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "Missing to_user" }),
        { status: 400 }
      );
    }

    const type = record.type || "system";

    /* ── جلب tokens النشطة فقط مع تفضيلات القنوات ─────── */
    const channelCol = TYPE_TO_CHANNEL[type] || 'channel_system';

    const { data: tokens, error: tokensError } = await supabase
      .from("fcm_tokens")
      .select(`
        id,
        token,
        platform,
        ${channelCol}
      `)
      .eq("user_id", targetUserId)
      .eq("is_active", true)
      .eq("platform", "android"); // android فقط حالياً

    if (tokensError) {
      return new Response(
        JSON.stringify({ error: tokensError.message }),
        { status: 500 }
      );
    }

    if (!tokens?.length) {
      return new Response(
        JSON.stringify({ success: false, message: "No active devices" }),
        { status: 200 }
      );
    }

    // تصفية tokens التي القناة فيها 'off'
    const eligibleTokens = tokens.filter(
      (t: any) => t[channelCol] !== 'off'
    );

    if (!eligibleTokens.length) {
      return new Response(
        JSON.stringify({ success: false, message: "All channels disabled by user" }),
        { status: 200 }
      );
    }

    /* ── بيانات المُرسِل ─────────────────────────────────── */
    let sender: any = null;
    if (record.from_user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, gender")
        .eq("id", record.from_user)
        .single();
      sender = data;
    }

    /* ── Firebase Auth ──────────────────────────────────── */
    const serviceAccount = JSON.parse(
      Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}"
    );

    const client = new JWT({
      email:  serviceAccount.client_email,
      key:    serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const { token: accessToken } = await client.getAccessToken();
    const projectId = serviceAccount.project_id;

    /* ── بناء النصوص والمسار ────────────────────────────── */
    const { title, body } = buildText(type, record, sender);
    const route           = resolveRoute(type, record, sender);
    const androidChannel  = TYPE_TO_ANDROID_CHANNEL[type] || 'system';

    // silent إذا فضّل المستخدم ذلك
    const isSilent = eligibleTokens.some(
      (t: any) => t[channelCol] === 'silent'
    );

    /* ── إرسال لكل الأجهزة النشطة ──────────────────────── */
    const results = await Promise.all(
      eligibleTokens.map(async (t: any) => {

        const payload = {
          message: {
            token: t.token,

            // ✅ notification block خفيف — ضروري لإيقاظ التطبيق المغلق
            // MyFirebaseMessagingService يتجاوزه بتصميم مخصص
            notification: {
              title,
              body,
            },

            data: {
              type:            String(type),
              title:           String(title),
              body:            String(body),
              avatar:          String(sender?.avatar_url    || ""),
              from_user:       String(sender?.id            || ""),
              sender_name:     String(sender?.full_name     || ""),
              sender_gender:   String(sender?.gender        || ""),
              conversation_id: String(record.conversation_id || ""),
              route:           String(route),
              is_silent:       String(isSilent),
              created_at:      new Date().toISOString(),
            },

            android: {
              priority:     "high",
              ttl:          "120s",
              collapse_key: type,
              notification: {
                channel_id:                androidChannel,
                sound:                     isSilent ? "" : "notification_sound",
                visibility:                "PUBLIC",
                notification_priority:     "PRIORITY_MAX",
                default_vibrate_timings:   !isSilent,
                default_sound:             false,
                icon:                      "ic_notification",
                color:                     "#B3334B",
                tag:                       type,
                sticky:                    false,
              },
            },
          },
        };

        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method:  "POST",
            headers: {
              "Content-Type":  "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify(payload),
          }
        );

        const result = await res.json();

        // token مرفوض من FCM — نعطّله تلقائياً
        if (result.error?.status === 'UNREGISTERED' ||
            result.error?.status === 'INVALID_ARGUMENT') {
          await supabase
            .from("fcm_tokens")
            .update({ is_active: false })
            .eq("id", t.id);
        }

        return result;
      })
    );

    return new Response(
      JSON.stringify({
        success: true,
        sent:    results.length,
        type,
        route,
        results,
      }),
      { status: 200 }
    );

  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
});
/**
 * 📁 supabase/functions/send-push/index.ts — ZAWAJ AI
 */

import { serve }        from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JWT }          from "https://esm.sh/google-auth-library@8.7.0";

const TYPE_TO_CHANNEL: Record<string, string> = {
  message:         'channel_messages',
  mediator:        'channel_mediator',
  like:            'channel_social',
  view:            'channel_social',
  match:           'channel_social',
  contact_request: 'channel_social',
  subscription:    'channel_subscription',
  system:          'channel_system',
};

const TYPE_TO_ANDROID_CHANNEL: Record<string, string> = {
  message:         'messages',
  mediator:        'messages',
  like:            'social',
  view:            'social',
  match:           'social',
  contact_request: 'social',
  subscription:    'subscription',
  system:          'system',
};

function resolveRoute(type: string, record: any, sender: any): string {
  switch (type) {
    case 'message':
      return record.conversation_id ? `/chat?id=${record.conversation_id}` : '/notifications';
    case 'mediator':
      return record.conversation_id ? `/chat?id=${record.conversation_id}` : '/mediators';
    case 'like': case 'view': case 'match': case 'contact_request':
      return sender?.id ? `/view?id=${sender.id}` : '/likes';
    case 'subscription': return '/points';
    default: return '/notifications';
  }
}

function buildText(type: string, record: any, sender: any): { title: string; body: string } {
  const name = sender?.full_name?.trim() || 'مستخدم';
  const g    = sender?.gender ?? null;
  const v    = (m: string, f: string) => g === 'female' ? f : m;
  switch (type) {
    case 'message':      return { title: name, body: record.message || `${name} ${v('أرسل لك رسالة','أرسلت لك رسالة')}` };
    case 'like':         return { title: 'إعجاب جديد', body: `${name} ${v('أعجب بملفك','أعجبت بملفك')}` };
    case 'view':         return { title: 'زيارة جديدة', body: `${name} ${v('زار ملفك','زارت ملفك')}` };
    case 'match':        return { title: 'توافق جديد', body: `حدث توافق بينك وبين ${name}` };
    case 'contact_request': return { title: 'طلب تواصل', body: `${name} ${v('أرسل طلب تواصل','أرسلت طلب تواصل')}` };
    case 'mediator':     return { title: `الوسيط ${name}`, body: record.message || 'يرغب بالتواصل معك' };
    case 'subscription': return { title: 'مشترك جديد', body: `${name} ${v('اشترك في خدماتك','اشتركت في خدماتك')}` };
    default:             return { title: record.title || 'ZAWAJ AI', body: record.message || 'إشعار جديد' };
  }
}

serve(async (req) => {
  try {
    const raw = await req.json();

    // ── استخراج record من أي شكل يُرسله الـ webhook ──────────
    // Database Webhook: { type, record, schema, table, old_record }
    // استدعاء مباشر:   { record: {...} }
    const record = raw.record ?? raw.new ?? raw;

    // ── logging كامل لمعرفة ما يصل بالضبط ───────────────────
    console.log('=== send-push invoked ===');
    console.log('raw keys:', Object.keys(raw).join(', '));
    console.log('record keys:', Object.keys(record).join(', '));
    console.log('to_user:', record.to_user);
    console.log('type:', record.type);
    console.log('from_user:', record.from_user);

    const targetUserId = record.to_user;
    if (!targetUserId) {
      console.error('FATAL: to_user missing. raw =', JSON.stringify(raw).substring(0, 500));
      return new Response(
        JSON.stringify({ error: "Missing to_user", raw_keys: Object.keys(raw) }),
        { status: 400 }
      );
    }

    const type       = record.type || "system";
    const channelCol = TYPE_TO_CHANNEL[type] || 'channel_system';

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")              ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tokens, error: tokensError } = await supabase
      .from("fcm_tokens")
      .select(`id, token, platform, ${channelCol}`)
      .eq("user_id", targetUserId)
      .eq("is_active", true)
      .eq("platform", "android");

    if (tokensError) {
      console.error('tokens query error:', tokensError.message);
      return new Response(JSON.stringify({ error: tokensError.message }), { status: 500 });
    }

    console.log('tokens found:', tokens?.length ?? 0);

    if (!tokens?.length) {
      return new Response(JSON.stringify({ success: false, message: "No active devices" }), { status: 200 });
    }

    const eligibleTokens = tokens.filter((t: any) => t[channelCol] !== 'off');
    console.log('eligible tokens:', eligibleTokens.length);

    if (!eligibleTokens.length) {
      return new Response(JSON.stringify({ success: false, message: "All channels off" }), { status: 200 });
    }

    let sender: any = null;
    if (record.from_user) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, gender")
        .eq("id", record.from_user)
        .single();
      sender = data;
      console.log('sender:', sender?.full_name);
    }

    const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}");
    const jwtClient = new JWT({
      email:  serviceAccount.client_email,
      key:    serviceAccount.private_key,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const { token: accessToken } = await jwtClient.getAccessToken();
    const projectId = serviceAccount.project_id;
    console.log('FCM project:', projectId);

    const { title, body } = buildText(type, record, sender);
    const route           = resolveRoute(type, record, sender);
    const androidChannel  = TYPE_TO_ANDROID_CHANNEL[type] || 'system';

    console.log(`sending: title="${title}" body="${body}" route="${route}"`);

    const results = await Promise.all(
      eligibleTokens.map(async (t: any) => {
        const isSilent = t[channelCol] === 'silent';

        const payload = {
          message: {
            token: t.token,
            // ✅ data-only — بدون notification block
            // بهذا onMessageReceived يُستدعى دائماً
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
              channel_id:      String(androidChannel),
              is_silent:       String(isSilent),
            },
            android: {
              priority: "high",
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

        if (result.error?.status === 'UNREGISTERED' ||
            result.error?.status === 'INVALID_ARGUMENT') {
          await supabase.from("fcm_tokens").update({ is_active: false }).eq("id", t.id);
          console.log('deactivated stale token:', t.id);
        }

        if (result.error) {
          console.error('FCM error:', JSON.stringify(result.error));
        } else {
          console.log('FCM sent OK:', result.name);
        }

        return result;
      })
    );

    const sent   = results.filter((r: any) => !r.error).length;
    const failed = results.filter((r: any) =>  r.error).length;
    console.log(`done: sent=${sent} failed=${failed}`);

    return new Response(
      JSON.stringify({ success: sent > 0, sent, failed, type, route }),
      { status: 200 }
    );

  } catch (err: any) {
    console.error('fatal error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
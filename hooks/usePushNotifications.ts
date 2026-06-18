'use client';
/**
 * hooks/usePushNotifications.ts — ZAWAJ AI
 *
 * ثلاث حالات:
 *
 * COLD START (التطبيق مغلق):
 *   MainActivity يحفظ route في CapacitorStorage.
 *   page.tsx يقرأه بعد التحقق من session ويتوجه مباشرة.
 *
 * WARM START (التطبيق في الخلفية):
 *   pushNotificationActionPerformed يُطلق فور فتح التطبيق.
 *   المستمعات مسجَّلة مسبقاً بدون انتظار userId.
 *   إذا كان userId جاهزاً → navigate مباشرة.
 *   إذا لم يكن جاهزاً → نحفظ في Preferences → page.tsx يقرأه.
 *
 * IN-APP (التطبيق في المقدمة):
 *   pushNotificationReceived يحفظ route في Preferences.
 *   usePushNotifications يقرأه بعد جاهزية userId وينتقل.
 */

import { useEffect, useRef } from 'react';
import { useRouter }         from 'next/navigation';
import { Capacitor }         from '@capacitor/core';
import { Preferences }       from '@capacitor/preferences';
import {
  PushNotifications,
  type Token,
  type ActionPerformed,
  type PushNotificationSchema,
} from '@capacitor/push-notifications';

import { supabase }                 from '@/lib/supabase/client';
import { resolveNotificationRoute } from '@/lib/notifications/notification-route';
import type { NotificationType }    from '@/lib/notifications/notification-route';

interface FCMData {
  type?:            string;
  from_user?:       string;
  conversation_id?: string;
  route?:           string;
}

const ROUTE_KEY = 'pending_route';

// حالة مشتركة عبر كل renders — تمنع تسجيل المستمعات مرتين
const _push = {
  listenersReady: false,
  userId:         '',
  router:         null as ReturnType<typeof useRouter> | null,
};

// ─────────────────────────────────────────────────────────────
// تسجيل المستمعات مرة واحدة فور تشغيل التطبيق — بدون userId
// ─────────────────────────────────────────────────────────────
async function initListeners() {
  if (_push.listenersReady) return;

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') return;

  _push.listenersReady = true;

  // ── تسجيل FCM Token ──────────────────────────────────────
  PushNotifications.addListener('registration', async (token: Token) => {
    if (!_push.userId) return;

    let appVersion = '1.0.0';
    try {
      const res  = await fetch('/update-info.json');
      const json = await res.json();
      appVersion = json.version || '1.0.0';
    } catch (_) {}

    await supabase.from('fcm_tokens').upsert(
      {
        user_id:        _push.userId,
        token:          token.value,
        platform:       'android',
        device_type:    'android',
        app_version:    appVersion,
        is_active:      true,
        last_opened_at: new Date().toISOString(),
        last_seen:      new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );
  });

  PushNotifications.addListener('registrationError', (err: any) => {
    console.error('[Push] registration error:', err);
  });

  // ── IN-APP: التطبيق في المقدمة ───────────────────────────
  // نحفظ الـ route في Preferences — الـ hook يقرأه بعد userId
  PushNotifications.addListener(
    'pushNotificationReceived',
    async (notification: PushNotificationSchema) => {
      const data = notification.data as FCMData;

      const route = (data.route && data.route.startsWith('/'))
        ? data.route
        : resolveNotificationRoute({
            type:            data.type as NotificationType,
            conversation_id: data.conversation_id,
            from_user:       data.from_user,
          });

      if (!route) return;

      // إذا كان userId جاهزاً والـ router موجود → انتقل مباشرة
      if (_push.userId && _push.router) {
        _push.router.push(route);
        return;
      }

      // وإلا احفظ في Preferences
      await Preferences.set({ key: ROUTE_KEY, value: route });
    }
  );

  // ── WARM START: التطبيق في الخلفية ──────────────────────
  PushNotifications.addListener(
    'pushNotificationActionPerformed',
    async (action: ActionPerformed) => {
      const data = action.notification.data as FCMData;

      if (_push.userId) {
        supabase.from('fcm_tokens')
          .update({ last_opened_at: new Date().toISOString() })
          .eq('user_id', _push.userId)
          .then(() => {});
      }

      const route = (data.route && data.route.startsWith('/'))
        ? data.route
        : resolveNotificationRoute({
            type:            data.type as NotificationType,
            conversation_id: data.conversation_id,
            from_user:       data.from_user,
          });

      if (!route) return;

      // إذا كان userId جاهزاً والـ router موجود → انتقل مباشرة
      if (_push.userId && _push.router) {
        _push.router.push(route);
        return;
      }

      // وإلا احفظ في Preferences → page.tsx سيقرأه
      await Preferences.set({ key: ROUTE_KEY, value: route });
    }
  );

  await PushNotifications.register();
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────
export function usePushNotifications(userId?: string) {
  const router       = useRouter();
  const routeHandled = useRef(false);

  // حدّث الحالة المشتركة دائماً
  if (userId) _push.userId = userId;
  _push.router = router;

  // ── تسجيل المستمعات فور التشغيل ─────────────────────────
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;
    initListeners().catch(console.error);
  }, []);

  // ── قراءة pending_route بعد جاهزية userId ───────────────
  // يغطي: Cold Start + Warm Start الذي وصل قبل جاهزية userId
  // + In-App الذي حُفظ في Preferences
  useEffect(() => {
    if (!userId || routeHandled.current) return;
    if (Capacitor.getPlatform() !== 'android') return;

    let attempts = 0;
    let timer: ReturnType<typeof setTimeout>;

    const check = async () => {
      attempts++;
      try {
        const { value } = await Preferences.get({ key: ROUTE_KEY });
        if (value && value.startsWith('/')) {
          routeHandled.current = true;
          await Preferences.remove({ key: ROUTE_KEY });
          router.push(value);
          return;
        }
      } catch (_) {}

      if (attempts < 10) {
        timer = setTimeout(check, 400);
      }
    };

    check();
    return () => clearTimeout(timer);
  }, [userId]);
}
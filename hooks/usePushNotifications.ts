'use client';
/**
 * hooks/usePushNotifications.ts — ZAWAJ AI
 *
 * Cold Start  → MainActivity يحوّل FCM route إلى zawaj://app/... deep link
 *               page.tsx يقرأه عبر App.getLaunchUrl()
 *
 * Warm Start  → Android يُطلق appUrlOpen في page.tsx تلقائياً
 *               (لأن Intent يحمل data = zawaj://app/... بعد rewrite)
 *
 * In-App      → pushNotificationReceived → router.push مباشرة
 *
 * هذا الهوك مسؤول فقط عن:
 * - تسجيل FCM token
 * - التنقل عند الإشعار الداخلي (In-App)
 */

import { useEffect }         from 'react';
import { useRouter }         from 'next/navigation';
import { Capacitor }         from '@capacitor/core';
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

const _push = {
  listenersReady: false,
  userId:         '',
};

export function usePushNotifications(userId?: string) {
  const router = useRouter();

  if (userId) _push.userId = userId;

  useEffect(() => {
    if (!userId) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const run = async () => {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return;

      if (!_push.listenersReady) {
        _push.listenersReady = true;

        // ── تسجيل FCM Token ──────────────────────────────────
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

        // ── IN-APP: التطبيق في المقدمة ───────────────────────
        PushNotifications.addListener(
          'pushNotificationReceived',
          (notification: PushNotificationSchema) => {
            const data  = notification.data as FCMData;
            const route = (data.route && data.route.startsWith('/'))
              ? data.route
              : resolveNotificationRoute({
                  type:            data.type as NotificationType,
                  conversation_id: data.conversation_id,
                  from_user:       data.from_user,
                });
            if (route) router.push(route);
          }
        );

        // ── WARM START fallback ──────────────────────────────
        // في حالة نادرة لم يُعالَج الـ deep link في page.tsx
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

            // إذا وصلنا هنا يعني appUrlOpen لم يُطلق
            // نتنقل يدوياً
            const route = (data.route && data.route.startsWith('/'))
              ? data.route
              : resolveNotificationRoute({
                  type:            data.type as NotificationType,
                  conversation_id: data.conversation_id,
                  from_user:       data.from_user,
                });
            if (route) router.push(route);
          }
        );
      }

      await PushNotifications.register();
    };

    run().catch(console.error);
  }, [userId]);
}
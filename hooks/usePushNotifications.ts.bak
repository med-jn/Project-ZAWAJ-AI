'use client';
/**
 * hooks/usePushNotifications.ts — ZAWAJ AI
 *
 * Cold Start  → MainActivity يضع route في window.__pendingRoute
 *               page.tsx يقرأه بعد جاهزية session
 *
 * Warm Start  → MainActivity يستدعي window.__navigateTo مباشرة
 *               أو appUrlOpen في page.tsx
 *
 * In-App      → pushNotificationReceived → router.push مباشرة
 */

import { useEffect }         from 'react';
import { useRouter }         from 'next/navigation';
import { Capacitor }         from '@capacitor/core';
import {
  PushNotifications,
  type Token,
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
      }

      await PushNotifications.register();
    };

    run().catch(console.error);
  }, [userId]);
}
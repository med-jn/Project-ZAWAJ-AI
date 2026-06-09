'use client';
/**
 * 📁 hooks/usePushNotifications.ts — ZAWAJ AI
 * ✅ يقرأ pending_route من Preferences بعد اكتمال session
 * ✅ يعيد المحاولة حتى يجد الـ route أو ينتهي الوقت
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

const _push = {
  listenersReady: false,
  userId:         '',
};

const ROUTE_KEY = 'pending_route';

export function usePushNotifications(userId?: string) {
  const router         = useRouter();
  const routeConsumed  = useRef(false);

  if (userId) _push.userId = userId;

  // ✅ بمجرد توفر userId — نتحقق من route معلق
  // نعيد المحاولة 5 مرات بفاصل 600ms لضمان كتابة Java في Preferences
  useEffect(() => {
    if (!userId || routeConsumed.current) return;
    if (Capacitor.getPlatform() !== 'android') return;

    let attempts = 0;
    const maxAttempts = 5;

    const check = async () => {
      attempts++;
      try {
        const { value } = await Preferences.get({ key: ROUTE_KEY });
        if (value && value.startsWith('/')) {
          routeConsumed.current = true;
          await Preferences.remove({ key: ROUTE_KEY });
          router.push(value);
          return; // نجح — نوقف
        }
      } catch (e) {
        console.error('[Push] Preferences.get error:', e);
      }

      // لم نجد route — نحاول مرة أخرى
      if (attempts < maxAttempts) {
        setTimeout(check, 600);
      }
    };

    check();
  }, [userId]);

  // ✅ تسجيل المستمعات
  useEffect(() => {
    if (!userId) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const navigate = (route: string) => router.push(route);

    const run = async () => {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return;

      if (!_push.listenersReady) {
        _push.listenersReady = true;

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

        PushNotifications.addListener(
          'pushNotificationReceived',
          (_n: PushNotificationSchema) => {}
        );

        // ✅ Warm Start: التطبيق في الخلفية
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

            // نمسح الـ pending route لأننا نعالجه هنا
            await Preferences.remove({ key: ROUTE_KEY });
            routeConsumed.current = true;

            if (data.route && data.route.startsWith('/')) {
              navigate(data.route);
              return;
            }

            const route = resolveNotificationRoute({
              type:            data.type as NotificationType,
              conversation_id: data.conversation_id,
              from_user:       data.from_user,
            });
            if (route) navigate(route);
          }
        );
      }

      await PushNotifications.register();
    };

    run().catch(console.error);

  }, [userId]);
}

'use client';
/**
 * 📁 hooks/usePushNotifications.ts — ZAWAJ AI
 * ✅ @capacitor/preferences للقراءة بعد اكتمال الـ session
 * ✅ Cold Start: route محفوظ من Java → يُقرأ هنا
 * ✅ Warm Start: pushNotificationActionPerformed مباشر
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
  const router      = useRouter();
  const consumedRef = useRef(false);

  if (userId) _push.userId = userId;

  // ✅ عند توفر userId (session جاهز) — نتحقق من route معلق
  useEffect(() => {
    if (!userId || consumedRef.current) return;
    if (Capacitor.getPlatform() !== 'android') return;

    consumedRef.current = true;

    const checkPending = async () => {
      try {
        const { value } = await Preferences.get({ key: ROUTE_KEY });
        if (value && value.startsWith('/')) {
          // ✅ نحذف أولاً ثم ننتقل — لا تكرار
          await Preferences.remove({ key: ROUTE_KEY });
          router.push(value);
        }
      } catch (e) {
        console.error('[Push] checkPending error:', e);
      }
    };

    // نحاول مرتين — مرة فوراً ومرة بعد ثانية للتأكد
    checkPending();
    const t = setTimeout(checkPending, 1000);
    return () => clearTimeout(t);

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

        // التطبيق مفتوح — Realtime يكفي
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

            // نحذف الـ pending route لأن Warm Start يعالجه هنا
            await Preferences.remove({ key: ROUTE_KEY });

            // route من السيرفر
            if (data.route && data.route.startsWith('/')) {
              navigate(data.route);
              return;
            }

            // fallback محلي
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

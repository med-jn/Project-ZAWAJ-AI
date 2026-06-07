'use client';
/**
 * 📁 hooks/usePushNotifications.ts — ZAWAJ AI
 * ✅ يقرأ الـ route من SharedPreferences بعد اكتمال الـ session
 * ✅ Cold Start: route محفوظ في Java → يُقرأ هنا بعد تسجيل الدخول
 * ✅ Warm Start: pushNotificationActionPerformed يتنقل مباشرة
 */

import { useEffect, useRef } from 'react';
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
  const router       = useRouter();
  const consumedRef  = useRef(false); // نستهلك الـ route مرة واحدة فقط

  if (userId) _push.userId = userId;

  // ✅ عند توفر userId (session جاهز) — نتحقق من route معلق
  useEffect(() => {
    if (!userId || consumedRef.current) return;
    if (Capacitor.getPlatform() !== 'android') return;

    consumedRef.current = true;

    // نقرأ الـ route من SharedPreferences عبر Capacitor Preferences plugin
    // أو عبر قراءة localStorage الذي حفظه Java
    // الحل: نستدعي دالة Java مباشرة عبر WebView JavaScript interface
    const checkPendingRoute = () => {
      try {
        // نستخدم localStorage كجسر بين Java و JS
        // MainActivity.java يحفظ الـ route في SharedPreferences
        // نقرأه عبر window.__pendingRoute الذي يُحقن من Java
        const route = (window as any).__pendingRoute;
        if (route && typeof route === 'string' && route.startsWith('/')) {
          delete (window as any).__pendingRoute;
          router.push(route);
        }
      } catch (_) {}
    };

    // ننتظر قليلاً للتأكد من تحميل كل شيء
    setTimeout(checkPendingRoute, 500);
    setTimeout(checkPendingRoute, 1500);
    setTimeout(checkPendingRoute, 3000);

  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const navigate = (route: string) => {
      router.push(route);
    };

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

        // ✅ Warm Start: التطبيق في الخلفية — Capacitor يُطلق هذا الحدث
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            const data = action.notification.data as FCMData;

            if (_push.userId) {
              supabase.from('fcm_tokens')
                .update({ last_opened_at: new Date().toISOString() })
                .eq('user_id', _push.userId)
                .then(() => {});
            }

            // route من السيرفر مباشرة
            if (data.route) {
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

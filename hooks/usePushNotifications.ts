'use client';
/**
 * 📁 hooks/usePushNotifications.ts — ZAWAJ AI
 * ✅ التوجيه داخل التطبيق فقط — لا window.location.href
 * ✅ استخدام Next.js router بدل إعادة تحميل الصفحة
 */

import { useEffect }  from 'react';
import { useRouter }  from 'next/navigation';
import { Capacitor }  from '@capacitor/core';
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

// خارج الـ component — يعيش طوال عمر التطبيق
const _push = {
  listenersReady: false,
  userId:         '',
};

export function usePushNotifications(userId?: string) {
  const router = useRouter();

  // نحدّث userId في كل render
  if (userId) _push.userId = userId;

  useEffect(() => {
    if (!userId) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const navigate = (route: string) => {
      // ✅ التنقل داخل التطبيق عبر Next.js router
      // لا window.location.href الذي يفتح المتصفح
      router.push(route);
    };

    const run = async () => {
      // صلاحيات
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return;

      // المستمعات — مرة واحدة فقط
      if (!_push.listenersReady) {
        _push.listenersReady = true;

        // حفظ الـ token
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

        // التطبيق مفتوح — Realtime يكفي، لا نفعل شيئاً
        PushNotifications.addListener(
          'pushNotificationReceived',
          (_n: PushNotificationSchema) => {}
        );

        // المستخدم ضغط على الإشعار
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            const data = action.notification.data as FCMData;

            // تحديث last_opened_at
            if (_push.userId) {
              supabase.from('fcm_tokens')
                .update({ last_opened_at: new Date().toISOString() })
                .eq('user_id', _push.userId)
                .then(() => {});
            }

            // المسار المرسل من السيرفر مباشرة
            if (data.route) {
              navigate(data.route);
              return;
            }

            // fallback: نحسبه محلياً
            const route = resolveNotificationRoute({
              type:            data.type as NotificationType,
              conversation_id: data.conversation_id,
              from_user:       data.from_user,
            });
            if (route) navigate(route);
          }
        );
      }

      // طلب token
      await PushNotifications.register();
    };

    run().catch(console.error);

  }, [userId]); // ← [userId] وليس []
}

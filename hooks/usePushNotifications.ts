'use client';
/**
 * 📁 hooks/usePushNotifications.ts — ZAWAJ AI
 */

import { useEffect }  from 'react';
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

// ── خارج الـ component تماماً — يعيش طوال عمر التطبيق ──────────
// هذا يحل مشكلة المستمعات المتكررة بدون useRef
const _push = {
  listenersReady: false,
  userId: '',
};

export function usePushNotifications(userId?: string) {

  // نحدّث userId في كل render — المستمعات ستقرأ القيمة الجديدة
  if (userId) _push.userId = userId;

  useEffect(() => {
    // ← هنا كانت المشكلة: [] كانت تعني "نفّذ مرة عند mount"
    // عند mount، userId = undefined → لا يفعل شيئاً → ينتهي
    // الحل: [userId] تعني "نفّذ عند كل تغيير في userId"
    if (!userId) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const run = async () => {
      // 1. صلاحيات
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return;

      // 2. المستمعات — مرة واحدة فقط في عمر التطبيق
      if (!_push.listenersReady) {
        _push.listenersReady = true;

        PushNotifications.addListener('registration', async (token: Token) => {
          if (!_push.userId) return;

          // جلب الإصدار من update-info.json
          let appVersion = '1.0.0';
          try {
            const res  = await fetch('/update-info.json');
            const json = await res.json();
            appVersion = json.version || '1.0.0';
          } catch (_) {}

          await supabase
            .from('fcm_tokens')
            .upsert(
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
          (_n: PushNotificationSchema) => {
            // التطبيق مفتوح: Realtime يكفي
          }
        );

        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            const data = action.notification.data as FCMData;

            if (_push.userId) {
              supabase
                .from('fcm_tokens')
                .update({ last_opened_at: new Date().toISOString() })
                .eq('user_id', _push.userId)
                .then(() => {});
            }

            // السيرفر يرسل route جاهزاً
            if (data.route) {
              window.location.href = data.route;
              return;
            }

            // fallback محلي
            const route = resolveNotificationRoute({
              type:            data.type as NotificationType,
              conversation_id: data.conversation_id,
              from_user:       data.from_user,
            });
            if (route) window.location.href = route;
          }
        );
      }

      // 3. طلب token — يُنفَّذ في كل مرة يصل userId جديد
      // FCM يُعيد نفس الـ token → registration event يُطلق → نحفظه بـ userId الصحيح
      await PushNotifications.register();
    };

    run().catch(console.error);

  }, [userId]); // ← [userId] وليس [] — هذا هو الإصلاح الجوهري
}
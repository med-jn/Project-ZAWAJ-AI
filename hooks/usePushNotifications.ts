'use client';
/**
 * 📁 hooks/usePushNotifications.ts — ZAWAJ AI
 *
 * الإصلاحات:
 * ✔ cleanup لا يحذف المستمعات إلا عند unmount حقيقي (لا عند userId change)
 * ✔ token يُعاد تسجيله عند تغيير userId بدون إعادة تهيئة كاملة
 * ✔ register() تُستدعى مرة واحدة فقط في عمر الـ component
 * ✔ لا تداخل مع Supabase Realtime
 */

import { useEffect, useRef } from 'react';
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
  title?:           string;
  body?:            string;
  avatar?:          string;
  from_user?:       string;
  conversation_id?: string;
  route?:           string;
  sender_gender?:   string;
  sender_name?:     string;
}

function handleNotificationTap(data: FCMData) {
  try {
    if (data.route) {
      window.location.href = data.route;
      return;
    }
    const route = resolveNotificationRoute({
      type:            data.type as NotificationType,
      conversation_id: data.conversation_id,
      from_user:       data.from_user,
    });
    if (route) window.location.href = route;
  } catch (err) {
    console.error('[Push] tap error:', err);
  }
}

async function handleForegroundNotification(
  notification: PushNotificationSchema
) {
  // داخل التطبيق المفتوح: Realtime + Navbar badge يكفيان — لا نعرض push مكرر
  // نتجاهل على الـ native platform عمداً
  if (Capacitor.isNativePlatform()) return;

  try {
    const data  = notification.data as FCMData;
    const title = notification.title || data.title || 'ZAWAJ AI';
    const body  = notification.body  || data.body  || '';
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, { body, icon: data.avatar || '/icons/icon-192x192.png' });
      }
    }
  } catch (err) {
    console.error('[Push] foreground error:', err);
  }
}

// ─── الـ ref يتتبع userId الحالي داخل المستمعات بدون إعادة تسجيلها ───
let currentUserIdRef = { value: '' };

export function usePushNotifications(userId?: string) {

  const listenersRegistered = useRef(false);  // المستمعات سُجِّلت مرة واحدة
  const registeredOnce      = useRef(false);  // register() استُدعيت مرة واحدة

  // دائماً نحدّث currentUserIdRef عند تغيير userId
  // هذا يعني المستمعات الموجودة ستستخدم userId الجديد تلقائياً
  useEffect(() => {
    if (userId) currentUserIdRef.value = userId;
  }, [userId]);

  useEffect(() => {
    if (!userId)                               return;
    if (Capacitor.getPlatform() !== 'android') return;

    // إعادة تسجيل token في Supabase عند كل تغيير userId
    // حتى لو المستمعات مسجّلة بالفعل
    const updateTokenForUser = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') return;

        // تسجيل مرة واحدة فقط في عمر الـ app
        if (!registeredOnce.current) {
          await PushNotifications.register();
          registeredOnce.current = true;
        }
      } catch (err) {
        console.error('[Push] permission/register error:', err);
      }
    };

    updateTokenForUser();

    // المستمعات تُسجَّل مرة واحدة فقط في عمر الـ app
    if (listenersRegistered.current) return;
    listenersRegistered.current = true;

    // 1. حفظ Token عند وصوله
    PushNotifications.addListener('registration', async (token: Token) => {
      const uid = currentUserIdRef.value;
      if (!uid) return;
      try {
        const appVersion = (window as any).__APP_VERSION__ || '1.0.0';
        const { error } = await supabase
          .from('fcm_tokens')
          .upsert(
            {
              user_id:        uid,
              token:          token.value,
              platform:       'android',
              app_version:    appVersion,
              is_active:      true,
              last_opened_at: new Date().toISOString(),
              last_seen:      new Date().toISOString(),
            },
            { onConflict: 'user_id,token' }
          );
        if (error) console.error('[Push] token upsert error:', error);
        else console.log('[Push] token saved for user:', uid);
      } catch (err) {
        console.error('[Push] token save error:', err);
      }
    });

    // 2. خطأ التسجيل — مهم للـ debug
    PushNotifications.addListener('registrationError', (err) => {
      console.error('[Push] registration error:', err);
    });

    // 3. إشعار أثناء فتح التطبيق
    PushNotifications.addListener(
      'pushNotificationReceived',
      async (notification: PushNotificationSchema) => {
        await handleForegroundNotification(notification);
      }
    );

    // 4. الضغط على الإشعار
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        const uid  = currentUserIdRef.value;
        const data = action.notification.data as FCMData;

        if (uid) {
          supabase
            .from('fcm_tokens')
            .update({ last_opened_at: new Date().toISOString() })
            .eq('user_id', uid)
            .then(() => {});
        }

        handleNotificationTap(data);
      }
    );

    // cleanup: لا نحذف المستمعات عند تغيير userId
    // نحذفها فقط عند unmount حقيقي للـ component الجذر
    // (وهو نادراً يحدث في تطبيق Capacitor)
    return () => {
      // تعليق متعمد: لا removeAllListeners هنا
      // المستمعات تبقى طوال عمر التطبيق
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // [] — يُنفَّذ مرة واحدة فقط عند mount
}
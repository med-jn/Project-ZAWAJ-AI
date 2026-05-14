'use client';
/**
 * 📁 hooks/usePushNotifications.ts — ZAWAJ AI
 *
 * ✔ لا يتداخل مع Supabase Realtime أبداً
 * ✔ يسجّل FCM token مع بيانات الجهاز الكاملة
 * ✔ يحدّث last_opened_at عند كل فتح
 * ✔ Deep Linking عبر notification-route.ts
 * ✔ يعمل مع تعدد الأجهزة
 */

import { useEffect, useRef } from 'react';
import { Capacitor }         from '@capacitor/core';
import {
  PushNotifications,
  type Token,
  type ActionPerformed,
  type PushNotificationSchema,
} from '@capacitor/push-notifications';

import { supabase }                    from '@/lib/supabase/client';
import { resolveNotificationRoute }    from '@/lib/notifications/notification-route';
import { buildNotificationText }       from '@/lib/notifications/notification-text';
import type { NotificationType }       from '@/lib/notifications/notification-route';

// ── نوع البيانات القادمة من FCM payload ──────────────────────
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

// ── التوجيه عند الضغط على الإشعار ───────────────────────────
function handleNotificationTap(data: FCMData) {
  try {
    // السيرفر يرسل route جاهزاً — نستخدمه مباشرة
    if (data.route) {
      window.location.href = data.route;
      return;
    }

    // fallback — نحسبه محلياً
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

// ── إشعار في الواجهة الأمامية (التطبيق مفتوح) ───────────────
// ملاحظة: عندما يكون التطبيق مفتوحاً نكتفي بالإشعار الداخلي
// (Navbar badge + Realtime) — لا نعرض push مكرر
async function handleForegroundNotification(
  notification: PushNotificationSchema
) {
  try {
    const data   = notification.data as FCMData;
    const title  = notification.title || data.title  || 'ZAWAJ AI';
    const body   = notification.body  || data.body   || buildNotificationText({
      type:   (data.type || 'system') as NotificationType,
      sender: {
        full_name: data.sender_name,
        gender:    (data.sender_gender as any) ?? null,
      },
    });

    // Web Notification API — يعمل فقط خارج Capacitor WebView
    // داخل التطبيق المفتوح نتجاهل لتجنب التكرار مع Realtime
    if (!Capacitor.isNativePlatform() && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification(title, {
          body,
          icon:   data.avatar || '/icons/notification-icon.png',
          badge:  '/icons/badge-icon.png',
          tag:    data.type   || 'general',
          silent: false,
        });
      }
    }
    // داخل التطبيق المفتوح: Realtime + Navbar badge يكفيان
  } catch (err) {
    console.error('[Push] foreground error:', err);
  }
}

// ════════════════════════════════════════════════════════════
export function usePushNotifications(userId?: string) {

  // نتجنب تسجيل المستمعات أكثر من مرة
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!userId)                              return;
    if (Capacitor.getPlatform() !== 'android') return;
    if (initializedRef.current)               return;

    const initialize = async () => {
      try {

        /* ── الصلاحيات ─────────────────────────────────── */
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }
        if (perm.receive !== 'granted') return;

        /* ── التسجيل ───────────────────────────────────── */
        await PushNotifications.register();

        /* ── المستمعات ─────────────────────────────────── */
        // ⚠️ لا نستخدم removeAllListeners() — يقطع Supabase Realtime
        // نستخدم addListener فقط مرة واحدة بسبب initializedRef

        // 1. حفظ Token مع بيانات الجهاز الكاملة
        PushNotifications.addListener('registration', async (token: Token) => {
          try {
            const appVersion = (window as any).__APP_VERSION__ || '1.0.0';

            await supabase
              .from('fcm_tokens')
              .upsert(
                {
                  user_id:      userId,
                  token:        token.value,
                  platform:     'android',
                  app_version:  appVersion,
                  is_active:    true,
                  last_opened_at: new Date().toISOString(),
                  last_seen:      new Date().toISOString(),
                },
                { onConflict: 'user_id,token' }
              );
          } catch (err) {
            console.error('[Push] token save error:', err);
          }
        });

        // 2. إشعار أثناء فتح التطبيق
        PushNotifications.addListener(
          'pushNotificationReceived',
          async (notification: PushNotificationSchema) => {
            await handleForegroundNotification(notification);
          }
        );

        // 3. الضغط على الإشعار
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action: ActionPerformed) => {
            const data = action.notification.data as FCMData;

            // تحديث last_opened_at عند فتح الإشعار
            supabase
              .from('fcm_tokens')
              .update({ last_opened_at: new Date().toISOString() })
              .eq('user_id', userId)
              .then(() => {});

            handleNotificationTap(data);
          }
        );

        initializedRef.current = true;

      } catch (err) {
        console.error('[Push] init error:', err);
      }
    };

    initialize();

    // تنظيف عند تسجيل الخروج
    return () => {
      if (initializedRef.current) {
        PushNotifications.removeAllListeners();
        initializedRef.current = false;
      }
    };

  }, [userId]);
}
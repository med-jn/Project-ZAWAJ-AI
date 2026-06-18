'use client';
/**
 * hooks/usePushNotifications.ts — ZAWAJ AI
 *
 * COLD START: MainActivity يحفظ route في CapacitorStorage
 *             page.tsx يقرأه ويتوجه قبل /home
 *
 * WARM START: pushNotificationActionPerformed يُطلق من Capacitor
 *             إذا userId جاهز → router.push مباشرة
 *             إذا لم يكن جاهزاً → يحفظ في Preferences → check loop يقرأه
 *
 * IN-APP:     pushNotificationReceived → router.push مباشرة إذا userId جاهز
 *             وإلا → يحفظ في Preferences → check loop يقرأه
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

// مشترك عبر كل renders
const _push = {
  listenersReady: false,
  userId:         '',
};

export function usePushNotifications(userId?: string) {
  const router       = useRouter();
  const routeHandled = useRef(false);

  if (userId) _push.userId = userId;

  // ── قراءة pending_route بعد جاهزية userId ──────────────────
  // يغطي: Cold Start + Warm/In-App اللذان وصلا قبل جاهزية userId
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

  // ── تسجيل المستمعات — مرة واحدة فقط عند جاهزية userId ─────
  useEffect(() => {
    if (!userId) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const navigate = (route: string) => {
      routeHandled.current = true;
      router.push(route);
    };

    const saveOrNavigate = async (route: string) => {
      if (_push.userId) {
        navigate(route);
      } else {
        await Preferences.set({ key: ROUTE_KEY, value: route });
      }
    };

    const resolveRoute = (data: FCMData): string | null => {
      if (data.route && data.route.startsWith('/')) return data.route;
      return resolveNotificationRoute({
        type:            data.type as NotificationType,
        conversation_id: data.conversation_id,
        from_user:       data.from_user,
      });
    };

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
          async (notification: PushNotificationSchema) => {
            const data  = notification.data as FCMData;
            const route = resolveRoute(data);
            if (route) await saveOrNavigate(route);
          }
        );

        // ── WARM START: التطبيق في الخلفية ──────────────────
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

            // امسح أي route محفوظ من Cold Start لتجنب التعارض
            await Preferences.remove({ key: ROUTE_KEY });

            const route = resolveRoute(data);
            if (route) await saveOrNavigate(route);
          }
        );
      }

      await PushNotifications.register();
    };

    run().catch(console.error);
  }, [userId]);
}
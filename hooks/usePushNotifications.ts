'use client';

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase/client';

export function usePushNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) {
      console.log('[FCM] no userId');
      return;
    }

    if (!Capacitor.isNativePlatform()) {
      console.log('[FCM] not native platform');
      return;
    }

    let registrationListener: any;
    let registrationErrorListener: any;
    let receivedListener: any;

    const init = async () => {
      try {
        console.log('[FCM] init start');

        // طلب الصلاحيات
        let perm = await PushNotifications.checkPermissions();

        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive !== 'granted') {
          console.log('[FCM] permission denied');
          return;
        }

        console.log('[FCM] permission granted');

        // تسجيل الجهاز في FCM
        await PushNotifications.register();

        // نجاح التسجيل
        registrationListener =
          await PushNotifications.addListener(
            'registration',
            async ({ value }) => {
              try {
                console.log('[FCM] token received:', value);

                const { error } = await supabase
                  .from('fcm_tokens')
                  .upsert(
                    {
                      user_id: userId,
                      token: value,
                      device_type: Capacitor.getPlatform(),
                      last_seen: new Date().toISOString(),
                    },
                    {
                      onConflict: 'token',
                    }
                  );

                if (error) {
                  console.error('[FCM] save error:', error);
                  return;
                }

                console.log('[FCM] token saved');
              } catch (err) {
                console.error('[FCM] insert crash:', err);
              }
            }
          );

        // فشل التسجيل
        registrationErrorListener =
          await PushNotifications.addListener(
            'registrationError',
            (err) => {
              console.error('[FCM] registration error:', err);
            }
          );

        // استقبال إشعار أثناء فتح التطبيق
        receivedListener =
          await PushNotifications.addListener(
            'pushNotificationReceived',
            (notification) => {
              console.log('[FCM] notification received:', notification);
            }
          );

      } catch (err) {
        console.error('[FCM] init failed:', err);
      }
    };

    init();

    return () => {
      registrationListener?.remove();
      registrationErrorListener?.remove();
      receivedListener?.remove();
    };
  }, [userId]);
}
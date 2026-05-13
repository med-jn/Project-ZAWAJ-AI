'use client';

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase/client';

export function usePushNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return;

    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const init = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();

        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive !== 'granted') {
          return;
        }

        await PushNotifications.register();

        PushNotifications.removeAllListeners();

        // حفظ التوكن
        PushNotifications.addListener(
          'registration',
          async (token) => {
            await supabase
              .from('fcm_tokens')
              .upsert(
                {
                  user_id: userId,
                  token: token.value,
                  device_type: 'android',
                  last_seen: new Date().toISOString(),
                },
                {
                  onConflict: 'user_id,token',
                }
              );
          }
        );

        // الضغط على الإشعار
        PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification) => {
            try {
              const data =
                notification.notification.data;

              const conversationId =
                data?.conversation_id;

              if (conversationId) {
                window.location.href =
                  `/chat?id=${conversationId}`;
              }
            } catch (err) {
              console.error(err);
            }
          }
        );
      } catch (err) {
        console.error(err);
      }
    };

    init();
  }, [userId]);
}
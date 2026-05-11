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

    if (Capacitor.getPlatform() !== 'android') {
      console.log('[FCM] not android');
      return;
    }

    const init = async () => {
      try {
        console.log('[FCM] init start');

        let perm = await PushNotifications.checkPermissions();

        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive !== 'granted') {
          console.log('[FCM] permission denied');
          return;
        }

        console.log('[FCM] permission granted');

        await PushNotifications.register();

        PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', async (token) => {
          try {
            console.log('[FCM] token received:', token.value);

            const { error } = await supabase
              .from('fcm_tokens')
              .upsert(
                {
                  user_id: userId,
                  token: token.value,
                  device_type: 'android',
                  last_seen: new Date().toISOString(),
                },
                {
                  onConflict: 'token',
                }
              );

            if (error) {
              console.error('[FCM] save error:', error);
            } else {
              console.log('[FCM] token saved');
            }
          } catch (e) {
            console.error('[FCM] insert crash:', e);
          }
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('[FCM] registration error:', err);
        });
      } catch (err) {
        console.error('[FCM] init failed:', err);
      }
    };

    init();
  }, [userId]);
}
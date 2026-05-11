'use client';

import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase/client';

export function usePushNotifications(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    if (Capacitor.getPlatform() !== 'android') return;

    const init = async () => {
      try {
        let perm = await PushNotifications.checkPermissions();

        if (perm.receive === 'prompt') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive !== 'granted') {
          console.log('❌ Notifications denied');
          return;
        }

        await PushNotifications.register();

        PushNotifications.addListener('registration', async (token) => {
          console.log('✅ FCM TOKEN:', token.value);

          const { error } = await supabase
            .from('fcm_tokens')
            .upsert({
              user_id: userId,
              token: token.value,
              device_type: 'android',
              last_seen: new Date().toISOString(),
            });

          if (error) {
            console.error('❌ Supabase error:', error);
          } else {
            console.log('✅ Token saved');
          }
        });

      } catch (err) {
        console.error('❌ Push init failed:', err);
      }
    };

    init();
  }, [userId]);
}
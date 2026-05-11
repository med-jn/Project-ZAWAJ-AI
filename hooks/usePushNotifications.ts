'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export function usePushNotifications() {
  useEffect(() => {

    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const init = async () => {
      try {

        const perm = await PushNotifications.checkPermissions();

        let status = perm;

        if (perm.receive === 'prompt') {
          status = await PushNotifications.requestPermissions();
        }

        if (status.receive !== 'granted') {
          console.log('Push permission denied');
          return;
        }

        PushNotifications.addListener('registration', token => {
          console.log('FCM TOKEN:', token.value);
        });

        PushNotifications.addListener('registrationError', err => {
          console.error('FCM ERROR:', err);
        });

        await PushNotifications.register();

      } catch (err) {
        console.error('Push init failed:', err);
      }
    };

    const timer = setTimeout(init, 3000);

    return () => {
      clearTimeout(timer);
    };

  }, []);
}
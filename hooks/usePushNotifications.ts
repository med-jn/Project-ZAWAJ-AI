'use client';

/**
 * ZAWAJ AI — Premium Push Notifications System
 * Android / Capacitor / Supabase / FCM
 *
 * ✔ Deep Linking
 * ✔ Rich Notification Routing
 * ✔ Elegant Architecture
 * ✔ Avatar Support
 * ✔ Scalable Types
 * ✔ Clean UX
 */

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  Token,
  ActionPerformed,
  PushNotificationSchema,
} from '@capacitor/push-notifications';

import { supabase } from '@/lib/supabase/client';

type NotificationType =
  | 'message'
  | 'like'
  | 'view'
  | 'match'
  | 'system'
  | 'premium'
  | 'mediator';

interface NotificationData {
  type?: NotificationType;

  conversation_id?: string;

  from_user?: string;

  avatar?: string;

  title?: string;

  body?: string;
}

/* ═══════════════════════════════════════════════
   Routing Engine
═══════════════════════════════════════════════ */

function navigateTo(data: NotificationData) {
  try {
    switch (data?.type) {
      /* ───────── رسائل ───────── */

      case 'message':
        if (data.conversation_id) {
          window.location.href =
            `/chat?id=${data.conversation_id}`;
        }
        break;

      /* ───────── إعجاب ───────── */

      case 'like':
      case 'view':
      case 'match':
        if (data.from_user) {
          window.location.href =
            `/profile/${data.from_user}`;
        }
        break;

      /* ───────── اشتراك ───────── */

      case 'premium':
        window.location.href =
          '/packages';
        break;

      /* ───────── وساطة ───────── */

      case 'mediator':
        window.location.href =
          '/mediator';
        break;

      /* ───────── نظام ───────── */

      case 'system':
      default:
        window.location.href =
          '/';
    }
  } catch (err) {
    console.error(err);
  }
}

/* ═══════════════════════════════════════════════
   Local Elegant Notification
═══════════════════════════════════════════════ */

async function showElegantNotification(
  notification: PushNotificationSchema
) {
  try {
    const data =
      notification.data as NotificationData;

    const title =
      notification.title || data.title || 'ZAWAJ AI';

    const body =
      notification.body || data.body || '';

    /**
     * Android Native Rich Notification
     *
     * avatar يتم تمريره من السيرفر
     */

    if ('Notification' in window) {
      const permission =
        await Notification.requestPermission();

      if (permission === 'granted') {
        new Notification(title, {
          body,

          icon:
            data.avatar ||
            '/icons/notification-icon.png',

          badge:
            '/icons/badge-icon.png',

          image:
            data.avatar,

          tag:
            data.type || 'general',

          silent: false,
        });
      }
    }
  } catch (err) {
    console.error(err);
  }
}

/* ═══════════════════════════════════════════════
   Main Hook
═══════════════════════════════════════════════ */

export function usePushNotifications(
  userId?: string
) {
  useEffect(() => {
    if (!userId) return;

    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    const initialize = async () => {
      try {
        /* ────────────────────────
           Permissions
        ───────────────────────── */

        let permission =
          await PushNotifications.checkPermissions();

        if (permission.receive === 'prompt') {
          permission =
            await PushNotifications.requestPermissions();
        }

        if (permission.receive !== 'granted') {
          return;
        }

        /* ────────────────────────
           Register Device
        ───────────────────────── */

        await PushNotifications.register();

        PushNotifications.removeAllListeners();

        /* ────────────────────────
           Device Token
        ───────────────────────── */

        PushNotifications.addListener(
          'registration',

          async (token: Token) => {
            try {
              await supabase
                .from('fcm_tokens')
                .upsert(
                  {
                    user_id: userId,

                    token: token.value,

                    device_type: 'android',

                    last_seen:
                      new Date().toISOString(),
                  },

                  {
                    onConflict:
                      'user_id,token',
                  }
                );
            } catch (err) {
              console.error(err);
            }
          }
        );

        /* ────────────────────────
           Foreground Notification
        ───────────────────────── */

        PushNotifications.addListener(
          'pushNotificationReceived',

          async (
            notification: PushNotificationSchema
          ) => {
            await showElegantNotification(
              notification
            );
          }
        );

        /* ────────────────────────
           Notification Click
        ───────────────────────── */

        PushNotifications.addListener(
          'pushNotificationActionPerformed',

          (
            action: ActionPerformed
          ) => {
            const data =
              action.notification
                .data as NotificationData;

            navigateTo(data);
          }
        );
      } catch (err) {
        console.error(err);
      }
    };

    initialize();
  }, [userId]);
}
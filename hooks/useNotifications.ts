import { useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { PushService } from '@/lib/services/pushService';
import { Platform } from 'react-native'; // أو حسب الإطار الذي تستخدمه

export function useNotifications(userId: string | undefined) {
  useEffect(() => {
    if (userId) {
      // 1. إنشاء القناة (مهم جداً للرنة والأيقونة في أندرويد)
      const setupChannels = async () => {
        try {
          await PushNotifications.createChannel({
            id: 'default_channel', // نفس المعرف في الـ Edge Function
            name: 'تنبيهات تطبيق زواج',
            description: 'إشعارات الرسائل والإعجابات',
            sound: 'notification_sound', // اسم ملف mp3 في res/raw
            importance: 5,
            visibility: 1,
            vibration: true,
          });
        } catch (e) {
          console.error("Error creating notification channel", e);
        }
      };

      setupChannels();

      // 2. تسجيل الجهاز وطلب الإذن
      PushService.registerDevice(userId);

      // 3. مستمع لوصول الإشعار والتطبيق مفتوح (Foreground)
      const addListeners = async () => {
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ', notification);
        });

        // مستمع للضغط على الإشعار
        await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ', notification.actionId);
        });
      };

      addListeners();

      return () => {
        PushNotifications.removeAllListeners();
      };
    }
  }, [userId]);
}
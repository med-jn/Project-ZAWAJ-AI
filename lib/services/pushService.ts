import { PushNotifications } from '@capacitor/push-notifications';

export const PushService = {
  // ========================================
  // إنشاء Notification Channels
  // ========================================

  async createChannels() {
    try {
      await PushNotifications.createChannel({
        id: 'messages',
        name: 'Messages',
        description: 'رسائل المحادثات',
        importance: 5,
        visibility: 1,
        sound: 'default',
      });

      await PushNotifications.createChannel({
        id: 'likes',
        name: 'Likes',
        description: 'الإعجابات والتطابقات',
        importance: 4,
        visibility: 1,
        sound: 'default',
      });

      console.log('[PushService] channels created');
    } catch (e) {
      console.error('[PushService] createChannels error:', e);
    }
  },

  // ========================================
  // استقبال الإشعارات أثناء فتح التطبيق
  // ========================================

  async listenForegroundNotifications() {
    PushNotifications.addListener(
      'pushNotificationReceived',
      (notification) => {
        console.log(
          '[PushService] foreground notification:',
          notification
        );
      }
    );
  },

  // ========================================
  // التعامل مع الضغط على الإشعار
  // ========================================

  async listenNotificationActions(router: any) {
    PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        try {
          const data = action.notification.data;

          console.log(
            '[PushService] notification action:',
            data
          );

          const type = data?.type;

          // ====================================
          // فتح المحادثة مباشرة
          // ====================================

          if (type === 'message') {
            const chatId = data?.chatId;

            if (chatId) {
              router.push(`/messages/${chatId}`);
              return;
            }
          }

          // ====================================
          // الإعجابات / التطابقات
          // ====================================

          if (type === 'like') {
            router.push('/notifications');
            return;
          }

          // ====================================
          // fallback
          // ====================================

          router.push('/');
        } catch (e) {
          console.error(
            '[PushService] action handler error:',
            e
          );
        }
      }
    );
  },
};
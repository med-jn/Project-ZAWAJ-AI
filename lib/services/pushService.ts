import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/lib/supabase/client';

export const PushService = {
  // طلب الإذن وتسجيل الجهاز
  async registerDevice(userId: string) {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') return;

    await PushNotifications.register();

    // الاستماع للتوكن وحفظه في السيرفر
    PushNotifications.addListener('registration', async (token) => {
      await supabase.from('fcm_tokens').upsert({ 
        user_id: userId, 
        token: token.value,
        device_type: 'android'
      }, { onConflict: 'user_id, token' });
    });
  },

  // الاستماع للفعل عند الضغط على الإشعار
  async listenToActions(router: any) {
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      const data = notification.notification.data;
      // إذا كان النوع إعجاب أو رسالة، نوجهه لتبويب الإشعارات (Index 2) كما في ملف page.tsx الخاص بك
      if (data.type === 'LIKE' || data.type === 'MESSAGE') {
        // هنا سنمرر رقم التبويب لاحقاً
      }
    });
  }
};
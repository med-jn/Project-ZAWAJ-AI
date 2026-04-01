import { useEffect } from 'react';
import { PushService } from '@/lib/services/pushService';

export function useNotifications(userId: string | undefined) {
  useEffect(() => {
    // لا نطلب الإذن إلا إذا كان المستخدم مسجلاً دخوله
    if (userId) {
      PushService.registerDevice(userId);
      
      // اختيارياً: تنظيف المستمعين عند خروج المستخدم
      return () => {
        // PushNotifications.removeAllListeners();
      };
    }
  }, [userId]);
}
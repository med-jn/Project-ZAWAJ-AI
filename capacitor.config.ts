import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  // ✅ يمنع الشريط الأبيض السفلي — WebView يغطي كامل الشاشة
  android: {
    backgroundColor: '#080008',
  },

  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },

    // ✅ StatusBar: لا يتداخل مع المحتوى — نتحكم به برمجياً من useNativeAndroid
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#080008',
      style:           'DARK',
    },

    // ✅ PushNotifications: تشغيل الإشعارات تلقائياً عند الموافقة
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
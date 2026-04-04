import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  server: {
    // ✅ يحمّل من Vercel — كل deploy = تحديث فوري (نظام OTA الفعلي)
    url:           'https://zawaj-ai.vercel.app',
    androidScheme: 'https',
    cleartext:     false,
  },

  plugins: {

    Browser: {
      presentationStyle: 'popover',
    },

    // شريط الحالة — لا يتداخل مع المحتوى
    StatusBar: {
      style:           'DARK',        // نص أبيض (للمود الداكن)
      backgroundColor: '#080008',     // --bg-main الداكن
      overlaysWebView: false,         // ✅ لا تداخل مع المحتوى
    },

    // لوحة المفاتيح — تدفع المحتوى للأعلى بدلاً من التداخل
    Keyboard: {
      resize:             'body',
      style:              'DARK',
      resizeOnFullScreen: true,
    },

    // شاشة البداية
    SplashScreen: {
      launchShowDuration:        0,       // إخفاء فوري
      launchAutoHide:            true,
      backgroundColor:           '#080008',
      androidSplashResourceName: 'splash',
      showSpinner:               false,
    },

  },

};

export default config;
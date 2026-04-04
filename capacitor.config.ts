import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',  // ✅ مجلد البناء — يُستخدم للتحديث التلقائي OTA

  // ── تم حذف server.url عمداً ─────────────────────────────────
  // server.url كان يجلب كل صفحة من Vercel = بطء شديد + خروج عشوائي
  // بدونه: التطبيق يحمّل من out/ محلياً = سريع جداً
  // نظام OTA يحدّث out/ تلقائياً عند كل deploy — لا يتأثر بهذا الحذف

  plugins: {

    Browser: {
      presentationStyle: 'popover',
    },

    StatusBar: {
      style:           'DARK',
      backgroundColor: '#080008',
      overlaysWebView: false,
    },

    Keyboard: {
      resize:             'body',
      style:              'DARK',
      resizeOnFullScreen: true,
    },

    SplashScreen: {
      launchShowDuration:        1500,
      launchAutoHide:            true,
      backgroundColor:           '#080008',
      androidSplashResourceName: 'splash',
      showSpinner:               false,
    },

  },

  android: {
    captureInput:                true,
    webContentsDebuggingEnabled: false,
  },

};

export default config;
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  // ✅ server.url محذوف — التطبيق يحمّل من out/ محلياً = سريع جداً
  // التحديث يتم عبر @capgo/capacitor-updater في الخلفية

  plugins: {

    Browser: {
      presentationStyle: 'popover',
    },

    // ✅ capgo — تحديث يدوي بدون auto (نحن نتحكم في التوقيت)
    CapacitorUpdater: {
      autoUpdate:           false,
      statsUrl:             '',       // لا إرسال إحصائيات لـ capgo
      privateKey:           '',
      directUpdate:         false,
      resetWhenUpdate:      false,
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
      launchShowDuration:        0,
      launchAutoHide:            true,
      backgroundColor:           '#080008',
      androidSplashResourceName: 'splash',
      showSpinner:               false,
    },

  },

};

export default config;
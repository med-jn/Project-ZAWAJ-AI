import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  android: {
    backgroundColor: '#080008',
  },

  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },

    StatusBar: {
      // ✅ overlaysWebView: true — WebView يمتد خلف كلا الشريطَين
      // المحتوى يتحكم في المساحة عبر safe-area-inset-* في CSS
      overlaysWebView: true,
      backgroundColor: '#00000000', // شفاف تماماً
      style:           'DARK',
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
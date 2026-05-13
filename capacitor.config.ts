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
      // ✅ false — شريط الحالة العلوي يحجز مساحته ولا يغطي المحتوى
      overlaysWebView: false,
      backgroundColor: '#080008',
      style:           'DARK',
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
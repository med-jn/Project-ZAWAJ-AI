import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  // ✅ Custom URL scheme لاستقبال OAuth redirect
  // يجب أن يتطابق مع redirectTo في handleGoogleLogin
  server: {
    androidScheme: 'https',
    // في وضع التطوير المحلي
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
  },

  plugins: {
    // ✅ Browser plugin — يفتح OAuth داخل التطبيق
    Browser: {
      presentationStyle: 'popover',
    },

    LiveUpdates: {
      appId:            '8e6b44cc',
      channel:          'Production',
      autoUpdateMethod: 'background',
      maxVersions:      2,
      updateUrl:        'https://zawaj-ai.vercel.app/update-info.json',
    },
  },
};

export default config;
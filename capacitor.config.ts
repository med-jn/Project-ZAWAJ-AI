import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  server: {
    // ✅ التطبيق يحمّل من Vercel مباشرة — أي deploy = تحديث فوري
    url:           'https://zawaj-ai.vercel.app',
    androidScheme: 'https',
    cleartext:     false,
  },

  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },
    // LiveUpdates محذوف — غير مدعوم بدون Appflow
  },
};

export default config;
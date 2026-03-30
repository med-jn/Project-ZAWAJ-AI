import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',   // ← ملفات محلية دائماً = لا crash

  server: {
    androidScheme: 'https',
    // لا server.url — التحديث يتم عبر liveUpdate.ts
  },

  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },
    Filesystem: {},
  },
};

export default config;
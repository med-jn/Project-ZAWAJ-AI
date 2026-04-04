import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  // ── server.url محذوف عمداً ──────────────────────────────
  // كان يسبب بطء شديد (كل صفحة تُجلب من Vercel)
  // التحديث التلقائي يعمل عبر liveUpdate.ts مستقلاً

  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },
  },
};

export default config;
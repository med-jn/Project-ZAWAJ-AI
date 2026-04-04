import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  server: {
    url:           'https://zawaj-ai.vercel.app',
    androidScheme: 'https',
    cleartext:     false,
  },

  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },
  },
};

export default config;
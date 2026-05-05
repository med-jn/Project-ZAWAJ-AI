import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir:  'out',

  plugins: {
    Browser: {
      presentationStyle: 'popover',
    },
  },
};

export default config;
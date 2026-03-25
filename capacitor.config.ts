import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.15:3000',
    cleartext: true
  }
};

export default config;
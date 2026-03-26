import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zawaj.ai',
  appName: 'ZAWAJ AI',
  webDir: 'out',
  plugins: {
    LiveUpdates: {
      appId: '8e6b44cc',
      channel: 'Production',
      autoUpdateMethod: 'background',
      maxVersions: 3
    }
  }
};

export default config;
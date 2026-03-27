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
      maxVersions: 2,
      // هذا الرابط هو الذي سيبحث فيه التطبيق عن التحديث v0.00.00x
      updateUrl: 'https://zawaj-ai.vercel.app/api/update'
    }
  }
};

export default config;
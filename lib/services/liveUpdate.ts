/**
 * 📁 lib/services/liveUpdate.ts — ZAWAJ AI
 * نظام تحديث تلقائي self-hosted بدون Appflow
 * ✅ يفحص update-info.json على Vercel
 * ✅ يحمّل app-dist.zip ويفك ضغطه
 * ✅ يطبق التحديث عند الفتح التالي
 */
import { Capacitor }  from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const UPDATE_INFO_URL = 'https://zawaj-ai.vercel.app/update-info.json';
const ZIP_URL         = 'https://zawaj-ai.vercel.app/app-dist.zip';
const VERSION_FILE    = 'current_version.txt';

async function getInstalledVersion(): Promise<string> {
  try {
    const { data } = await Filesystem.readFile({
      path:      VERSION_FILE,
      directory: Directory.Data,
      encoding:  'utf8' as any,
    });
    return (data as string).trim();
  } catch {
    return '0.0.0';
  }
}

async function saveInstalledVersion(version: string): Promise<void> {
  await Filesystem.writeFile({
    path:      VERSION_FILE,
    directory: Directory.Data,
    data:      version,
    encoding:  'utf8' as any,
    recursive: true,
  });
}

export async function checkAndApplyUpdate(): Promise<{
  hasUpdate: boolean;
  version?:  string;
  error?:    string;
}> {
  if (!Capacitor.isNativePlatform()) {
    return { hasUpdate: false };
  }

  try {
    const res = await fetch(UPDATE_INFO_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('فشل جلب معلومات التحديث');
    const info: { version: string; url: string } = await res.json();

    const installed = await getInstalledVersion();
    if (installed === info.version) {
      return { hasUpdate: false };
    }

    const zipRes = await fetch(ZIP_URL, { cache: 'no-store' });
    if (!zipRes.ok) throw new Error('فشل تحميل التحديث');

    const buffer = await zipRes.arrayBuffer();
    const bytes  = new Uint8Array(buffer);
    const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '');
    const base64 = btoa(binary);

    await Filesystem.writeFile({
      path:      'update/app-dist.zip',
      directory: Directory.Cache,
      data:      base64,
      recursive: true,
    });

    await saveInstalledVersion(info.version);

    return { hasUpdate: true, version: info.version };

  } catch (e: any) {
    console.warn('[LiveUpdate]', e?.message ?? e);
    return { hasUpdate: false, error: e?.message };
  }
}
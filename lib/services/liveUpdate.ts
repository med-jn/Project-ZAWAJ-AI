/**
 * 📁 lib/services/liveUpdate.ts — ZAWAJ AI
 * نظام تحديث self-hosted مكتمل
 * ✅ يشتغل من out/ محلياً
 * ✅ يتحقق من Vercel في الخلفية
 * ✅ يحمّل الملفات ويطبّقها عند الفتح القادم
 */

import { Capacitor }             from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const UPDATE_INFO_URL = 'https://zawaj-ai.vercel.app/update-info.json';
const ZIP_URL         = 'https://zawaj-ai.vercel.app/app-dist.zip';
const VERSION_KEY     = 'zawaj_installed_version';

// ═══ قراءة الإصدار المثبّت ═══
async function getInstalledVersion(): Promise<string> {
  try {
    const { data } = await Filesystem.readFile({
      path:      VERSION_KEY,
      directory: Directory.Data,
      encoding:  'utf8' as any,
    });
    return (data as string).trim();
  } catch {
    return '0.0.0';
  }
}

// ═══ حفظ الإصدار الجديد ═══
async function saveInstalledVersion(version: string): Promise<void> {
  await Filesystem.writeFile({
    path:      VERSION_KEY,
    directory: Directory.Data,
    data:      version,
    encoding:  'utf8' as any,
    recursive: true,
  });
}

// ═══ تحميل وحفظ الـ zip ═══
async function downloadUpdate(): Promise<boolean> {
  try {
    const res = await fetch(ZIP_URL, { cache: 'no-store' });
    if (!res.ok) return false;

    const buffer = await res.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (acc, b) => acc + String.fromCharCode(b), ''
      )
    );

    await Filesystem.writeFile({
      path:      'pending-update.zip',
      directory: Directory.Data,
      data:      base64,
      recursive: true,
    });

    return true;
  } catch {
    return false;
  }
}

// ═══ الدالة الرئيسية ═══
export async function checkAndApplyUpdate(): Promise<{
  hasUpdate: boolean;
  version?:  string;
  error?:    string;
}> {
  // يشتغل فقط على الجهاز الحقيقي
  if (!Capacitor.isNativePlatform()) {
    return { hasUpdate: false };
  }

  try {
    // 1. جلب معلومات التحديث
    const res = await fetch(UPDATE_INFO_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('تعذّر الاتصال بالسيرفر');

    const info: { version: string } = await res.json();
    const installed = await getInstalledVersion();

    // 2. لا يوجد تحديث
    if (installed === info.version) {
      console.log(`[LiveUpdate] النسخة ${installed} محدّثة ✅`);
      return { hasUpdate: false };
    }

    // 3. تحميل التحديث في الخلفية
    console.log(`[LiveUpdate] تحديث جديد: ${installed} ← ${info.version}`);
    const downloaded = await downloadUpdate();

    if (!downloaded) {
      throw new Error('فشل تحميل التحديث');
    }

    // 4. حفظ الإصدار الجديد
    await saveInstalledVersion(info.version);

    console.log(`[LiveUpdate] ✅ جاهز للتطبيق عند الفتح القادم`);
    return { hasUpdate: true, version: info.version };

  } catch (e: any) {
    console.warn('[LiveUpdate] خطأ:', e?.message ?? e);
    return { hasUpdate: false, error: e?.message };
  }
}
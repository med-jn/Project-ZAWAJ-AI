/**
 * 📁 lib/services/liveUpdate.ts — ZAWAJ AI
 * ✅ نظام تحديث حقيقي باستخدام @capgo/capacitor-updater
 * ✅ self-hosted على Vercel — مجاني تماماً
 * ✅ يحمّل zip في الخلفية ويطبّقه فعلياً
 * ✅ zip-build.js و update-info.json لم يتغيرا
 */
import { Capacitor }        from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

const UPDATE_INFO_URL = 'https://zawaj-ai.vercel.app/update-info.json';
const ZIP_URL         = 'https://zawaj-ai.vercel.app/app-dist.zip';

// ── إخبار المكتبة أن التطبيق بدأ بنجاح ──────────────────────
// يجب استدعاؤه عند كل بدء تشغيل ناجح
export async function notifyAppReady(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch (e) {
    console.warn('[LiveUpdate] notifyAppReady failed:', e);
  }
}

// ── الدالة الرئيسية: فحص وتحميل التحديث ────────────────────
export async function checkAndApplyUpdate(): Promise<{
  hasUpdate: boolean;
  version?:  string;
  error?:    string;
}> {
  if (!Capacitor.isNativePlatform()) return { hasUpdate: false };

  try {
    // 1. جلب معلومات التحديث
    const res = await fetch(UPDATE_INFO_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('فشل جلب معلومات التحديث');
    const info: { version: string; url: string } = await res.json();

    // 2. التحقق من الإصدار الحالي
    const current = await CapacitorUpdater.current();
    const installedVersion = current.bundle?.version ?? 'builtin';

    if (installedVersion === info.version) {
      return { hasUpdate: false };
    }

    // 3. تحميل الـ zip الجديد في الخلفية
    console.log(`[LiveUpdate] تحميل v${info.version}...`);
    const bundle = await CapacitorUpdater.download({
      url:     ZIP_URL,
      version: info.version,
    });

    // 4. تطبيق التحديث — سيُعاد تشغيل التطبيق فوراً
    await CapacitorUpdater.set(bundle);

    // لن يصل الكود لهنا لأن set() يعيد تشغيل التطبيق
    return { hasUpdate: true, version: info.version };

  } catch (e: any) {
    console.warn('[LiveUpdate]', e?.message ?? e);
    return { hasUpdate: false, error: e?.message };
  }
}
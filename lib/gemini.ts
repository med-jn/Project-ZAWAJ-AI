/**
 * 📁 lib/gemini.ts — ZAWAJ AI
 * ✅ هذا الملف الآن مجرد أداة مساعدة (parser)
 * ✅ validateText و validateImage انتقلتا إلى:
 *    → supabase/functions/moderate/index.ts  (السيرفر)
 *    → lib/moderate.ts                       (الاستدعاء)
 *
 * ⚠️ لا تستورد من هذا الملف في المكوّنات مباشرة
 *    استخدم: import { moderateText, moderateImage } from '@/lib/moderate'
 */

// ── Parser مشترك (يُستخدم داخل Edge Function فقط) ────────────
export function parseGeminiResponse(
  text: string
): { valid: boolean; reason: string } {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    const match = text.match(/\{[^}]+\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return { valid: false, reason: "حدث خطأ في تفسير استجابة المراقب." };
  }
}
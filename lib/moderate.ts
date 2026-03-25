/**
 * 📁 lib/moderate.ts — ZAWAJ AI
 * ✅ دالة موحّدة للويب و Android (Capacitor)
 * ✅ تستدعي Supabase Edge Function — المفتاح آمن تماماً
 */

type ModerateResult = { valid: boolean; reason: string };

async function callModerate(
  payload: Record<string, unknown>
): Promise<ModerateResult> {
  // ✅ تُقرأ عند كل استدعاء — لا عند تحميل الملف
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error("[moderate] متغيرات البيئة مفقودة");
    // ❌ نرفض بدل السماح — أفضل من تمرير محتوى غير مفحوص
    return { valid: false, reason: "خطأ في الإعداد، حاول مجدداً." };
  }

  const EDGE_URL = `${url}/functions/v1/moderate`;

  try {
    const res = await fetch(EDGE_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[moderate] HTTP ${res.status}:`, text);

      if (res.status === 429) {
        let data: any = {};
        try { data = JSON.parse(text); } catch {}
        return { valid: false, reason: data.reason ?? "حاول بعد قليل." };
      }
      if (res.status === 401) {
        console.error("[moderate] مفتاح المصادقة خاطئ");
        return { valid: false, reason: "خطأ في المصادقة، حاول مجدداً." };
      }
      // أي خطأ آخر — نرفض بدل السماح
      return { valid: false, reason: "تعذّر التحقق من المحتوى، حاول مجدداً." };
    }

    const result = await res.json();
    console.log("[moderate] نتيجة الفحص:", result);
    return result;

  } catch (e: any) {
    console.error("[moderate] خطأ في الشبكة:", e?.message ?? e);
    // فشل الشبكة فقط — نسمح بالمرور
    return { valid: true, reason: "" };
  }
}

export async function moderateText(
  userId:  string,
  content: string
): Promise<ModerateResult> {
  return callModerate({ type: "text", userId, content });
}

export async function moderateImage(
  userId:     string,
  base64Data: string,
  mimeType:   string = "image/webp"
): Promise<ModerateResult> {
  return callModerate({ type: "image", userId, base64Data, mimeType });
}
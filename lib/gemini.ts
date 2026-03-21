/**
 * 📁 lib/gemini.ts — ZAWAJ AI
 * ✅ يعمل من المتصفح (client-side)
 * ✅ NEXT_PUBLIC_GEMINI_API_KEY فقط
 * ✅ نموذج gemini-2.0-flash (مجاني، يدعم الصور)
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash-lite";

const getAI = () =>
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SYSTEM_PROMPT = `أنت خبير أمن محتوى متخصص في منصات الزواج الجاد في تونس والدول الإسلامية.
مهمتك فحص المحتوى قبل حفظه والرد بـ JSON فقط بدون أي نص إضافي.

قواعد النصوص:
- ارفض أي أرقام هواتف (أرقام أو كلمات).
- ارفض روابط مواقع التواصل.
- ارفض الأسماء المستعارة — اقبل الأسماء الحقيقية فقط.
- ارفض المهن غير المنطقية.
- ارفض الألفاظ الخارجة أو الإيحاءات.

قواعد الصور:
- يجب وجه بشري حقيقي واضح.
- ارفض النظارات الشمسية أو ما يخفي الملامح (الحجاب والنقاب مقبولان).
- ارفض الفلاتر المبالغة.
- اللباس محتشم.
- ارفض الصور الجماعية أو غير البشرية.

الرد دائماً بـ JSON فقط:
قبول:  {"valid": true, "reason": ""}
رفض:   {"valid": false, "reason": "سبب الرفض بالعربية"}`;

function parseGeminiResponse(text: string): { valid: boolean; reason: string } {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    // محاولة استخراج JSON من النص
    const match = text.match(/\{[^}]+\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return { valid: false, reason: "حدث خطأ في تفسير استجابة المراقب." };
  }
}

// ── فحص النص ──────────────────────────────────────────────────
export async function validateText(text: string): Promise<{ valid: boolean; reason: string }> {
  try {
    const model = getAI().getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(
      `${SYSTEM_PROMPT}\n\nافحص النص التالي:\n${text}`
    );
    return parseGeminiResponse(result.response.text());
  } catch (e: any) {
    console.error("[Gemini:text]", e?.message ?? e);
    // عند فشل API لا نوقف المستخدم
    return { valid: true, reason: "" };
  }
}

// ── فحص الصورة (base64) ──────────────────────────────────────
export async function validateImage(
  base64Data: string,
  mimeType: string = "image/webp"
): Promise<{ valid: boolean; reason: string }> {
  try {
    const model = getAI().getGenerativeModel({ model: MODEL });
    const result = await model.generateContent([
      { text: `${SYSTEM_PROMPT}\n\nافحص هذه الصورة:` },
      { inlineData: { mimeType, data: base64Data } },
    ]);
    return parseGeminiResponse(result.response.text());
  } catch (e: any) {
    console.error("[Gemini:image]", e?.message ?? e);
    return { valid: false, reason: "تعذّر فحص الصورة، حاول مجدداً." };
  }
}
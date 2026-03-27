/**
 * 📁 app/api/moderate/route.ts — ZAWAJ AI
 * API Route لمراقبة المحتوى عبر Gemini (server-side آمن)
 * ✅ المفتاح سري — لا يظهر في المتصفح أو APK
 * ✅ Rate limiting لكل مستخدم
 * ✅ يدعم النصوص والصور
 */

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI }        from "@google/generative-ai";

// ── الإعدادات ────────────────────────────────────────────────
const MODEL = "gemini-2.5-flash-lite";

const getAI = () =>
  new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// ── Rate Limiting (في الذاكرة — كافٍ لمرحلة التطوير) ────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX      = 10;   // أقصى طلبات لكل مستخدم
const RATE_LIMIT_WINDOW   = 60_000; // نافزة 60 ثانية

function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const data = rateLimitMap.get(userId);

  if (!data || now > data.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true; // مسموح
  }

  if (data.count >= RATE_LIMIT_MAX) return false; // محظور

  data.count++;
  return true; // مسموح
}

// ── System Prompt ─────────────────────────────────────────────
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

// ── Parser ────────────────────────────────────────────────────
function parseGeminiResponse(text: string): { valid: boolean; reason: string } {
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

// ── Retry عند 429 ─────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 3000
): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (retries > 0 && e?.message?.includes("429")) {
      await new Promise(r => setTimeout(r, delayMs));
      return withRetry(fn, retries - 1, delayMs);
    }
    throw e;
  }
}

// ── POST Handler ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── 1. قراءة الجسم
    const body = await req.json();
    const { type, userId, content, base64Data, mimeType } = body;

    // ── 2. التحقق من الحقول الأساسية
    if (!type || !userId) {
      return NextResponse.json(
        { valid: false, reason: "بيانات الطلب غير مكتملة." },
        { status: 400 }
      );
    }

    // ── 3. Rate Limiting
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { valid: false, reason: "لقد تجاوزت عدد الطلبات المسموح بها، حاول بعد دقيقة." },
        { status: 429 }
      );
    }

    // ── 4. التحقق من وجود المفتاح
    if (!process.env.GEMINI_API_KEY) {
      console.error("[moderate] GEMINI_API_KEY غير موجود في .env");
      // لا نوقف المستخدم عند خطأ الإعداد
      return NextResponse.json({ valid: true, reason: "" });
    }

    const model = getAI().getGenerativeModel({ model: MODEL });

    // ── 5. فحص النص
    if (type === "text") {
      if (!content || typeof content !== "string") {
        return NextResponse.json(
          { valid: false, reason: "النص مطلوب." },
          { status: 400 }
        );
      }

      const result = await withRetry(async () => {
        const res = await model.generateContent(
          `${SYSTEM_PROMPT}\n\nافحص النص التالي:\n${content}`
        );
        return parseGeminiResponse(res.response.text());
      });

      return NextResponse.json(result);
    }

    // ── 6. فحص الصورة
    if (type === "image") {
      if (!base64Data) {
        return NextResponse.json(
          { valid: false, reason: "بيانات الصورة مطلوبة." },
          { status: 400 }
        );
      }

      const resolvedMime = mimeType ?? "image/webp";

      const result = await withRetry(async () => {
        const res = await model.generateContent([
          { text: `${SYSTEM_PROMPT}\n\nافحص هذه الصورة:` },
          { inlineData: { mimeType: resolvedMime, data: base64Data } },
        ]);
        return parseGeminiResponse(res.response.text());
      });

      return NextResponse.json(result);
    }

    // ── 7. نوع غير معروف
    return NextResponse.json(
      { valid: false, reason: "نوع المحتوى غير معروف." },
      { status: 400 }
    );

  } catch (e: any) {
    console.error("[moderate:route]", e?.message ?? e);

    // عند خطأ غير متوقع: لا نوقف المستخدم
    return NextResponse.json({ valid: true, reason: "" });
  }
}
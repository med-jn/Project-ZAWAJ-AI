// 📁 supabase/functions/moderate/index.ts — ZAWAJ AI
// ✅ Supabase Edge Function — تعمل على سيرفر Supabase
// ✅ المفتاح سري — لا يظهر في APK ولا في المتصفح
// ✅ تستدعيها من Android (Capacitor) والويب بنفس الطريقة
// ✅ Rate limiting لكل مستخدم

import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const MODEL = "gemini-2.5-flash-lite";

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

// ── Rate Limiting ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX    = 10;
const RATE_LIMIT_WINDOW = 60_000;

function checkRateLimit(userId: string): boolean {
  const now  = Date.now();
  const data = rateLimitMap.get(userId);
  if (!data || now > data.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (data.count >= RATE_LIMIT_MAX) return false;
  data.count++;
  return true;
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

// ── Handler الرئيسي ───────────────────────────────────────────
Deno.serve(async (req: Request) => {

  // CORS — مطلوب للويب والأندرويد
  const corsHeaders = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ valid: false, reason: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { type, userId, content, base64Data, mimeType } = body;

    // ── التحقق من الحقول الأساسية
    if (!type || !userId) {
      return new Response(
        JSON.stringify({ valid: false, reason: "بيانات الطلب غير مكتملة." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Rate Limiting
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ valid: false, reason: "لقد تجاوزت عدد الطلبات المسموح بها، حاول بعد دقيقة." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── التحقق من المفتاح (يُحفظ في Supabase Secrets)
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      console.error("[moderate] GEMINI_API_KEY غير موجود في Supabase Secrets");
      return new Response(
        JSON.stringify({ valid: true, reason: "" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: MODEL });

    // ── فحص النص
    if (type === "text") {
      if (!content || typeof content !== "string") {
        return new Response(
          JSON.stringify({ valid: false, reason: "النص مطلوب." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await withRetry(async () => {
        const res = await model.generateContent(
          `${SYSTEM_PROMPT}\n\nافحص النص التالي:\n${content}`
        );
        return parseGeminiResponse(res.response.text());
      });

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── فحص الصورة
    if (type === "image") {
      if (!base64Data) {
        return new Response(
          JSON.stringify({ valid: false, reason: "بيانات الصورة مطلوبة." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── نوع غير معروف
    return new Response(
      JSON.stringify({ valid: false, reason: "نوع المحتوى غير معروف." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (e: any) {
    console.error("[moderate:edge]", e?.message ?? e);
    // عند خطأ غير متوقع — لا نوقف المستخدم
    return new Response(
      JSON.stringify({ valid: true, reason: "" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
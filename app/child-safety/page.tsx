// المسار: app/child-safety/page.tsx
// صفحة عامة (بدون تسجيل دخول) — معايير سلامة الأطفال (Google Play: Child Safety Standards)
// ⚠️ غيّر CHILD_SAFETY_EMAIL إلى بريد تراقبه فعلاً (يفضّل بريد مخصص مثل childsafety@orcaup.com)

import Footer from "@/components/layout/Footer";

const APP_NAME = "ZAWAJ AI";
const DEVELOPER = "ORCAUP";
const PACKAGE = "com.zawaj.ai";
const CHILD_SAFETY_EMAIL = "support@orcaup.com";
const LAST_UPDATED = "2026-11-23";

export const metadata = {
  title: "Child Safety Standards | معايير سلامة الأطفال | ZAWAJ AI",
  description:
    "ZAWAJ AI by ORCAUP — published standards prohibiting child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM).",
};

type Block = { h: string; p?: string; items?: string[] };

const EN: Block[] = [
  {
    h: "1. Zero tolerance",
    p: `${APP_NAME} (package ${PACKAGE}), published by ${DEVELOPER}, strictly prohibits child sexual abuse and exploitation (CSAE) and child sexual abuse material (CSAM) in any form. There are no exceptions.`,
  },
  {
    h: "2. Adults only (18+)",
    p: `${APP_NAME} is a marriage-oriented service for adults only. Anyone under 18 years old may not use the app or create an account. Accounts we find or suspect belong to a minor are removed.`,
  },
  {
    h: "3. What is prohibited",
    items: [
      "Any sexual content involving a minor, including images, video, text or links (CSAM).",
      "Grooming, luring, soliciting or sexually approaching a minor.",
      "Sextortion, blackmail, threats or coercion directed at a minor.",
      "Sharing, requesting, trading or advertising child exploitation material.",
      "Impersonating a minor, or using a minor's photos or details in a profile.",
      "Using the app to arrange or facilitate the abuse or trafficking of a child.",
    ],
  },
  {
    h: "4. How to report (in-app feedback mechanism)",
    p: "Every user can report a profile or a chat conversation directly inside the app using the Report button, choosing a reason and adding details. Child-safety reports receive the highest review priority. You can also contact us at the email below.",
  },
  {
    h: "5. How we respond",
    items: [
      "We review reports as a priority and remove violating content immediately.",
      "We suspend or permanently ban the accounts involved.",
      "We preserve relevant evidence where legally permitted.",
      "We report CSAM and CSAE to the competent authorities and child-protection bodies as required by applicable law (for example, NCMEC in the United States or local law enforcement), and cooperate with their lawful requests.",
    ],
  },
  {
    h: "6. Legal compliance",
    p: "We comply with all applicable child safety laws and regulations in the jurisdictions where the app is offered.",
  },
];

const AR: Block[] = [
  {
    h: "1. عدم التسامح مطلقًا",
    p: `يمنع تطبيق ${APP_NAME} (الحزمة ${PACKAGE}) الصادر عن ${DEVELOPER} منعًا باتًا الاستغلال والاعتداء الجنسي على الأطفال (CSAE) والمواد التي تتضمن اعتداءً جنسيًا على الأطفال (CSAM) بكل أشكالها، دون أي استثناء.`,
  },
  {
    h: "2. للبالغين فقط (18+)",
    p: "التطبيق خدمة مخصصة للزواج للبالغين فقط. لا يجوز لمن هم دون 18 سنة استخدامه أو إنشاء حساب فيه، ويُحذف أي حساب يثبت أو يُشتبه أنه لقاصر.",
  },
  {
    h: "3. المحظورات",
    items: [
      "أي محتوى جنسي يتعلق بقاصر: صور أو فيديو أو نصوص أو روابط.",
      "استدراج القاصرين أو التحرش بهم أو مراودتهم جنسيًا.",
      "الابتزاز الجنسي أو التهديد أو الإكراه الموجّه لقاصر.",
      "مشاركة أو طلب أو تبادل أو الترويج لمواد استغلال الأطفال.",
      "انتحال صفة قاصر أو استخدام صور قاصر أو بياناته في ملف شخصي.",
      "استخدام التطبيق لتسهيل الاعتداء على طفل أو الاتجار به.",
    ],
  },
  {
    h: "4. كيفية الإبلاغ (آلية الإبلاغ داخل التطبيق)",
    p: "يمكن لأي مستخدم الإبلاغ عن ملف شخصي أو محادثة من داخل التطبيق عبر زر «الإبلاغ» مع اختيار السبب وإضافة التفاصيل. بلاغات سلامة الأطفال لها أعلى أولوية مراجعة. ويمكن التواصل معنا عبر البريد أدناه.",
  },
  {
    h: "5. ماذا نفعل عند وصول بلاغ",
    items: [
      "نراجع البلاغ بأولوية ونزيل المحتوى المخالف فورًا.",
      "نعلّق الحسابات المعنية أو نحظرها نهائيًا.",
      "نحتفظ بالأدلة ذات الصلة حيثما يسمح القانون.",
      "نُبلّغ الجهات المختصة وجهات حماية الطفل عن المواد والحالات وفق القانون المعمول به (مثل NCMEC في الولايات المتحدة أو الجهات الأمنية المحلية)، ونتعاون مع طلباتها القانونية.",
    ],
  },
  {
    h: "6. الامتثال القانوني",
    p: "نلتزم بقوانين وأنظمة سلامة الأطفال السارية في الدول التي يتوفر فيها التطبيق.",
  },
];

function Section({ blocks, dir }: { blocks: Block[]; dir: "ltr" | "rtl" }) {
  return (
    <div dir={dir} style={{ textAlign: dir === "rtl" ? "right" : "left" }}>
      {blocks.map((b) => (
        <section key={b.h} style={{ marginBottom: "var(--sp-5)" }}>
          <h2 style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--color-primary)", margin: "0 0 var(--sp-2)" }}>
            {b.h}
          </h2>
          {b.p && <p style={{ fontSize: "var(--text-sm)", lineHeight: 1.9, margin: 0, color: "var(--text-main)" }}>{b.p}</p>}
          {b.items && (
            <ul style={{ margin: 0, paddingInlineStart: "1.25rem", fontSize: "var(--text-sm)", lineHeight: 1.9, color: "var(--text-main)" }}>
              {b.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export default function ChildSafetyPage() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "var(--sp-5)",
        paddingBottom: "calc(var(--header-h-safe) + 32px)",
        color: "var(--text-main)",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "var(--sp-6)" }}>
        <h1 style={{ fontSize: "var(--text-lg)", fontWeight: 800, margin: 0 }}>
          Child Safety Standards · معايير سلامة الأطفال
        </h1>
        <p style={{ fontSize: "var(--text-xs)", opacity: 0.7, marginTop: "var(--sp-2)" }}>
          {APP_NAME} by {DEVELOPER} · Last updated / آخر تحديث: {LAST_UPDATED}
        </p>
      </header>

      <Section blocks={EN} dir="ltr" />

      <section dir="ltr" style={{ margin: "var(--sp-5) 0", padding: "var(--sp-4)", border: "1px solid var(--border-soft)", borderRadius: 12 }}>
        <h2 style={{ fontSize: "var(--text-md)", fontWeight: 700, margin: "0 0 var(--sp-2)" }}>
          Child Safety point of contact / جهة الاتصال لسلامة الأطفال
        </h2>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.9 }}>
          {DEVELOPER} — Child Safety:{" "}
          <a href={`mailto:${CHILD_SAFETY_EMAIL}`} style={{ color: "var(--color-primary)", fontWeight: 700 }}>
            {CHILD_SAFETY_EMAIL}
          </a>
        </p>
      </section>

      <hr style={{ border: 0, borderTop: "1px solid var(--border-soft)", margin: "var(--sp-6) 0" }} />

      <Section blocks={AR} dir="rtl" />
    </main>
  );
}
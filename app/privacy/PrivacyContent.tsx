"use client";

// PrivacyContent.tsx
// مكوّن سياسة الخصوصية — ZAWAJ AI
// المسار: app/privacy/PrivacyContent.tsx
// ✅ RTL | ✅ Dark/Light | ✅ متغيرات globals.css فقط | ✅ Accordion

import { useState, useCallback } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { PRIVACY_SECTIONS, PRIVACY_META, type PolicySection } from "./privacy-policy";
import Footer                  from '@/components/layout/Footer';

// ─────────────────────────────────────────────
// مكوّن قسم accordion منفرد
// ─────────────────────────────────────────────
function AccordionItem({
  section,
  isOpen,
  onToggle,
}: {
  section: PolicySection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasSubsections = section.subsections && section.subsections.length > 0;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border-soft)",
      }}
    >
      {/* ── رأس القسم ── */}
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--sp-4) var(--sp-5)",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "right",
          gap: "var(--sp-3)",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span
          style={{
            flex: 1,
            textAlign: "right",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            color: isOpen ? "var(--color-primary)" : "var(--text-main)",
            lineHeight: "var(--lh-snug)",
            transition: "color 0.2s ease",
          }}
        >
          {section.title}
        </span>

        <ChevronDown
          style={{
            flexShrink: 0,
            width: "var(--icon-md)",
            height: "var(--icon-md)",
            color: isOpen ? "var(--color-primary)" : "var(--text-tertiary)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease, color 0.2s ease",
          }}
          strokeWidth={2.5}
        />
      </button>

      {/* ── محتوى القسم ── */}
      <div
        style={{
          maxHeight: isOpen ? "9999px" : "0",
          overflow: "hidden",
          transition: isOpen
            ? "max-height 0.45s ease"
            : "max-height 0.25s ease",
        }}
      >
        <div
          style={{
            padding: "0 var(--sp-5) var(--sp-5)",
          }}
        >
          {/* محتوى نصي مباشر */}
          {section.content && (
            <p
              style={{
                margin: 0,
                fontSize: "var(--text-sm)",
                lineHeight: "var(--lh-relaxed)",
                color: "var(--text-secondary)",
                whiteSpace: "pre-line",
                textAlign: "right",
              }}
            >
              {section.content}
            </p>
          )}

          {/* أقسام فرعية */}
          {hasSubsections && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--sp-3)",
                marginTop: section.content ? "var(--sp-4)" : "0",
              }}
            >
              {section.subsections!.map((sub) => (
                <div
                  key={sub.id}
                  style={{
                    padding: "var(--sp-4)",
                    background: "var(--bg-soft)",
                    borderRadius: "var(--radius-md)",
                    borderRight: "3px solid var(--color-primary)",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 var(--sp-2) 0",
                      fontSize: "var(--text-xs)",
                      fontWeight: 700,
                      color: "var(--text-main)",
                      textAlign: "right",
                    }}
                  >
                    {sub.title}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--text-xs)",
                      lineHeight: "var(--lh-relaxed)",
                      color: "var(--text-secondary)",
                      whiteSpace: "pre-line",
                      textAlign: "right",
                    }}
                  >
                    {sub.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// المكوّن الرئيسي
// ─────────────────────────────────────────────
export default function PrivacyContent() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const anyOpen = Object.values(openSections).some(Boolean);

  const toggleAll = useCallback(() => {
    if (anyOpen) {
      setOpenSections({});
    } else {
      const all: Record<string, boolean> = {};
      PRIVACY_SECTIONS.forEach((s) => (all[s.id] = true));
      setOpenSections(all);
    }
  }, [anyOpen]);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-main)",
        paddingBottom: "var(--sp-16)",
      }}
    >
      {/* ══ هيدر الصفحة ══ */}
      <div
        style={{
          padding: "var(--sp-6) var(--sp-5) var(--sp-5)",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        {/* العنوان */}
        <h1
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 800,
            color: "var(--text-main)",
            margin: "0 0 var(--sp-1) 0",
            textAlign: "right",
          }}
        >
          سياسة الخصوصية
        </h1>

        {/* وصف */}
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            margin: "0 0 var(--sp-1) 0",
            textAlign: "right",
          }}
        >
          نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية
        </p>

        {/* معلومات الإصدار */}
        <p
          style={{
            fontSize: "var(--text-2xs)",
            color: "var(--text-tertiary)",
            margin: "0 0 var(--sp-4) 0",
            textAlign: "right",
          }}
        >
          آخر تحديث: {PRIVACY_META.lastUpdated} · الإصدار {PRIVACY_META.version}
        </p>

        {/* زر فتح / إغلاق الكل */}
        <button
          onClick={toggleAll}
          style={{
            padding: "var(--sp-2) var(--sp-4)",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border-soft)",
            background: "var(--bg-soft)",
            color: "var(--text-secondary)",
            fontSize: "var(--text-xs)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {anyOpen ? "إغلاق الكل" : "فتح الكل"}
        </button>
      </div>

      {/* ══ قائمة الأقسام ══ */}
      <div
        style={{
          background: "var(--bg-surface)",
          marginTop: "var(--sp-2)",
        }}
      >
        {PRIVACY_SECTIONS.map((section) => (
          <AccordionItem
            key={section.id}
            section={section}
            isOpen={!!openSections[section.id]}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>

      {/* ══ فوتر ══ */}
      <div
        style={{
          marginTop: "var(--sp-6)",
          padding: "var(--sp-5)",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-soft)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--sp-3)",
          textAlign: "center",
        }}
      >
        

        {/* إيميل الدعم */}
        <a
          href={`mailto:${PRIVACY_META.supportEmail}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-2)",
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          <Mail
            style={{
              width: "var(--icon-sm)",
              height: "var(--icon-sm)",
            }}
          />
          {PRIVACY_META.supportEmail}
        </a>
      </div>
      <Footer />
    </div>
  );
}
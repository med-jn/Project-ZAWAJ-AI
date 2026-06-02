"use client";

// TermsContent.tsx
// مكوّن شروط الاستخدام — ZAWAJ AI
// المسار: app/terms/TermsContent.tsx
// ✅ 3 وثائق بتبويبات | ✅ Accordion | ✅ RTL | ✅ globals.css فقط

import { useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import { TERMS_DOCUMENTS, type TermsDocument, type TermsSection } from "./terms-of-use";
import { PRIVACY_META } from "../privacy/privacy-policy";
import Footer                  from '@/components/layout/Footer';

// ─────────────────────────────────────────────
// قسم accordion منفرد
// ─────────────────────────────────────────────
function AccordionItem({
  section,
  isOpen,
  onToggle,
}: {
  section: TermsSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div style={{ borderBottom: "1px solid var(--border-soft)" }}>
      {/* رأس القسم */}
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

      {/* المحتوى */}
      <div
        style={{
          maxHeight: isOpen ? "9999px" : "0",
          overflow: "hidden",
          transition: isOpen ? "max-height 0.45s ease" : "max-height 0.25s ease",
        }}
      >
        <div style={{ padding: "0 var(--sp-5) var(--sp-5)" }}>
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
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// وثيقة كاملة بـ accordion
// ─────────────────────────────────────────────
function DocumentAccordion({ doc }: { doc: TermsDocument }) {
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
      doc.sections.forEach((s) => (all[s.id] = true));
      setOpenSections(all);
    }
  }, [anyOpen, doc.sections]);

  return (
    <div>
      {/* وصف الوثيقة + زر فتح الكل */}
      <div
        style={{
          padding: "var(--sp-4) var(--sp-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--sp-3)",
          borderBottom: "1px solid var(--border-soft)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            textAlign: "right",
            flex: 1,
            lineHeight: "var(--lh-snug)",
          }}
        >
          {doc.subtitle}
        </p>
        <button
          onClick={toggleAll}
          style={{
            flexShrink: 0,
            padding: "var(--sp-1) var(--sp-3)",
            borderRadius: "var(--radius-full)",
            border: "1px solid var(--border-soft)",
            background: "var(--bg-soft)",
            color: "var(--text-secondary)",
            fontSize: "var(--text-2xs)",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {anyOpen ? "إغلاق الكل" : "فتح الكل"}
        </button>
      </div>

      {/* الأقسام */}
      {doc.sections.map((section) => (
        <AccordionItem
          key={section.id}
          section={section}
          isOpen={!!openSections[section.id]}
          onToggle={() => toggleSection(section.id)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// المكوّن الرئيسي
// ─────────────────────────────────────────────
export default function TermsContent() {
  const [activeDoc, setActiveDoc] = useState<string>(TERMS_DOCUMENTS[0].id);

  const currentDoc = TERMS_DOCUMENTS.find((d) => d.id === activeDoc)!;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-main)",
        paddingBottom: "var(--sp-16)",
      }}
    >
      {/* ══ هيدر ══ */}
      <div
        style={{
          padding: "var(--sp-6) var(--sp-5) 0",
          background: "var(--bg-surface)",
        }}
      >
        <h1
          style={{
            fontSize: "var(--text-2xl)",
            fontWeight: 800,
            color: "var(--text-main)",
            margin: "0 0 var(--sp-1) 0",
            textAlign: "right",
          }}
        >
          الشروط والسياسات
        </h1>
        <p
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--text-tertiary)",
            margin: "0 0 var(--sp-4) 0",
            textAlign: "right",
          }}
        >
          آخر تحديث: {PRIVACY_META.lastUpdated}
        </p>

        {/* ── تبويبات الوثائق الثلاث ── */}
        <div
          style={{
            display: "flex",
            gap: "var(--sp-2)",
            overflowX: "auto",
            paddingBottom: "0",
            scrollbarWidth: "none",
          }}
          className="no-scrollbar"
        >
          {TERMS_DOCUMENTS.map((doc) => {
            const isActive = doc.id === activeDoc;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDoc(doc.id)}
                style={{
                  flexShrink: 0,
                  padding: "var(--sp-2) var(--sp-4)",
                  borderRadius: "var(--radius-full) var(--radius-full) 0 0",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                  background: isActive ? "var(--color-primary-soft)" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--text-tertiary)",
                  fontSize: "var(--text-xs)",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  WebkitTapHighlightColor: "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {doc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ محتوى الوثيقة النشطة ══ */}
      <div
        style={{
          background: "var(--bg-surface)",
          marginTop: "var(--sp-2)",
        }}
      >
        {/* عنوان الوثيقة */}
        <div
          style={{
            padding: "var(--sp-4) var(--sp-5) 0",
          }}
        >
          <h2
            style={{
              fontSize: "var(--text-lg)",
              fontWeight: 700,
              color: "var(--text-main)",
              margin: 0,
              textAlign: "right",
            }}
          >
            {currentDoc.title}
          </h2>
        </div>

        <DocumentAccordion key={activeDoc} doc={currentDoc} />
      </div>

      {/* ══ فوتر ══ */}
      <div
        style={{
          marginTop: "var(--sp-6)",
          padding: "var(--sp-5)",
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-soft)",
          textAlign: "center",
        }}
      >
        
        <a
          href={`mailto:${PRIVACY_META.contactEmail}`}
          style={{
            fontSize: "var(--text-xs)",
            color: "var(--color-primary)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          {PRIVACY_META.contactEmail}
        </a>
      </div>
      <Footer />
    </div>
  );
}
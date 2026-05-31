"use client";

// HelpContent.tsx
// المسار: app/help/HelpContent.tsx

import { useState, useCallback } from "react";
import {
  ChevronDown, ChevronLeft, Mail,
  UserCircle, Gift, Users, Lock, MessageCircle, Flag,
} from "lucide-react";
import Link from "next/link";
import { FAQ_CATEGORIES, POLICY_LINKS, type FaqItem, type FaqCategory } from "./help-data";
import { APP_INFO } from "../about/about-data";

// map id الفئة -> أيقونة Lucide
const CATEGORY_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  account:  UserCircle,
  points:   Gift,
  mediator: Users,
  privacy:  Lock,
  messages: MessageCircle,
  reports:  Flag,
};

function CategoryIcon({ id }: { id: string }) {
  const Icon = CATEGORY_ICONS[id];
  if (!Icon) return null;
  return (
    <Icon
      style={{ width: "var(--icon-sm)", height: "var(--icon-sm)", flexShrink: 0 }}
      strokeWidth={2}
    />
  );
}

function FaqAccordionItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: "1px solid var(--border-soft)" }}>
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
        <span style={{
          flex: 1,
          textAlign: "right",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: isOpen ? "var(--color-primary)" : "var(--text-main)",
          lineHeight: "var(--lh-snug)",
          transition: "color 0.2s ease",
        }}>
          {item.question}
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
      <div style={{
        maxHeight: isOpen ? "9999px" : "0",
        overflow: "hidden",
        transition: isOpen ? "max-height 0.45s ease" : "max-height 0.25s ease",
      }}>
        <div style={{ padding: "0 var(--sp-5) var(--sp-5)" }}>
          <p style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            lineHeight: "var(--lh-relaxed)",
            color: "var(--text-secondary)",
            whiteSpace: "pre-line",
            textAlign: "right",
          }}>
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function CategoryFaq({ category }: { category: FaqCategory }) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggleItem = useCallback((id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);
  return (
    <div>
      {category.items.map((item) => (
        <FaqAccordionItem
          key={item.id}
          item={item}
          isOpen={!!openItems[item.id]}
          onToggle={() => toggleItem(item.id)}
        />
      ))}
    </div>
  );
}

export default function HelpContent() {
  const [activeCategory, setActiveCategory] = useState<string>(FAQ_CATEGORIES[0].id);
  const currentCategory = FAQ_CATEGORIES.find((c) => c.id === activeCategory)!;

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "var(--bg-main)", paddingBottom: "var(--sp-16)" }}>

      {/* ══ هيدر ══ */}
      <div style={{ padding: "var(--sp-6) var(--sp-5) 0", background: "var(--bg-surface)" }}>
        <h1 style={{ fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-main)", margin: "0 0 var(--sp-1) 0", textAlign: "right" }}>
          المساعدة
        </h1>
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", margin: "0 0 var(--sp-4) 0", textAlign: "right" }}>
          الأسئلة الشائعة والإجابات
        </p>

        {/* تبويبات الفئات */}
        <div style={{ display: "flex", gap: "var(--sp-1)", overflowX: "auto" }} className="no-scrollbar">
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = cat.id === activeCategory;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-1)",
                  padding: "var(--sp-2) var(--sp-3)",
                  borderRadius: "var(--radius-full) var(--radius-full) 0 0",
                  border: "none",
                  borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
                  background: isActive ? "var(--color-primary-soft)" : "transparent",
                  color: isActive ? "var(--color-primary)" : "var(--text-tertiary)",
                  fontSize: "var(--text-2xs)",
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.2s ease",
                  WebkitTapHighlightColor: "transparent",
                  whiteSpace: "nowrap",
                }}
              >
                <CategoryIcon id={cat.id} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ أسئلة الفئة النشطة ══ */}
      <div style={{ background: "var(--bg-surface)", marginTop: "var(--sp-2)" }}>
        <div style={{
          padding: "var(--sp-4) var(--sp-5)",
          borderBottom: "1px solid var(--border-soft)",
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
        }}>
          <CategoryIcon id={currentCategory.id} />
          <h2 style={{ margin: 0, fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-main)" }}>
            {currentCategory.label}
          </h2>
        </div>
        <CategoryFaq key={activeCategory} category={currentCategory} />
      </div>

      {/* ══ روابط السياسات ══ */}
      <div style={{ padding: "var(--sp-6) var(--sp-5) var(--sp-4)", background: "var(--bg-surface)", marginTop: "var(--sp-2)" }}>
        <h3 style={{ margin: "0 0 var(--sp-3) 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-main)", textAlign: "right" }}>
          الشروط والسياسات
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
          {POLICY_LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--sp-3) var(--sp-4)",
                background: "var(--bg-soft)",
                borderRadius: "var(--radius-md)",
                textDecoration: "none",
                border: "1px solid var(--border-soft)",
              }}
            >
              <ChevronLeft style={{ width: "var(--icon-sm)", height: "var(--icon-sm)", color: "var(--text-tertiary)", flexShrink: 0 }} />
              <div style={{ flex: 1, textAlign: "right", marginRight: "var(--sp-2)" }}>
                <p style={{ margin: "0 0 2px 0", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-main)" }}>
                  {link.label}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-2xs)", color: "var(--text-tertiary)" }}>
                  {link.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ══ تواصل ══ */}
      <div style={{ padding: "var(--sp-5)", background: "var(--bg-surface)", marginTop: "var(--sp-2)", borderTop: "1px solid var(--border-soft)" }}>
        <h3 style={{ margin: "0 0 var(--sp-3) 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-main)", textAlign: "right" }}>
          لم تجد إجابتك؟
        </h3>
        <a
          href={`mailto:${APP_INFO.supportEmail}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "var(--sp-4)",
            background: "var(--color-primary-soft)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            border: "1px solid var(--border-soft)",
          }}
        >
          <Mail style={{ width: "var(--icon-md)", height: "var(--icon-md)", color: "var(--color-primary)", flexShrink: 0 }} />
          <div style={{ flex: 1, textAlign: "right", marginRight: "var(--sp-3)" }}>
            <p style={{ margin: "0 0 2px 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-primary)" }}>
              تواصل مع الدعم
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
              {APP_INFO.supportEmail}
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
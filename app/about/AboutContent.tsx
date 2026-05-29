"use client";

// AboutContent.tsx
// صفحة التعريف بالتطبيق — ZAWAJ AI
// المسار: app/about/AboutContent.tsx
// ✅ RTL | ✅ Dark/Light | ✅ globals.css فقط | ✅ احترافية ومختصرة

import { Mail, Phone } from "lucide-react";
import { APP_INFO, CORE_VALUES, MAIN_FEATURES } from "./about-data";

// ─────────────────────────────────────────────
// بطاقة قيمة
// ─────────────────────────────────────────────
function ValueCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--sp-3)",
        padding: "var(--sp-4)",
        background: "var(--bg-soft)",
        borderRadius: "var(--radius-md)",
        borderRight: "3px solid var(--color-primary)",
      }}
    >
      <span style={{ fontSize: "var(--text-xl)", flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, textAlign: "right" }}>
        <p
          style={{
            margin: "0 0 var(--sp-1) 0",
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--text-main)",
          }}
        >
          {title}
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-xs)",
            lineHeight: "var(--lh-relaxed)",
            color: "var(--text-secondary)",
          }}
        >
          {desc}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// بطاقة ميزة
// ─────────────────────────────────────────────
function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        padding: "var(--sp-4)",
        background: "var(--bg-soft)",
        borderRadius: "var(--radius-md)",
        textAlign: "right",
      }}
    >
      <span style={{ fontSize: "var(--text-xl)" }}>{icon}</span>
      <p
        style={{
          margin: "var(--sp-2) 0 var(--sp-1) 0",
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--text-main)",
        }}
      >
        {title}
      </p>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-xs)",
          lineHeight: "var(--lh-relaxed)",
          color: "var(--text-secondary)",
        }}
      >
        {desc}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// عنوان قسم
// ─────────────────────────────────────────────
function SectionTitle({ text }: { text: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-3)",
        marginBottom: "var(--sp-4)",
        flexDirection: "row-reverse",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: "var(--text-lg)",
          fontWeight: 700,
          color: "var(--text-main)",
        }}
      >
        {text}
      </h2>
      <div
        style={{
          flex: 1,
          height: "1px",
          background: "var(--border-soft)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// المكوّن الرئيسي
// ─────────────────────────────────────────────
export default function AboutContent() {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: "var(--bg-main)",
        paddingBottom: "var(--sp-16)",
      }}
    >

      {/* ══ هيدر — هوية التطبيق ══ */}
      <div
        style={{
          padding: "var(--sp-8) var(--sp-5) var(--sp-6)",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-soft)",
          textAlign: "center",
        }}
      >
        {/* اسم التطبيق */}
        <h1
          style={{
            margin: "0 0 var(--sp-2) 0",
            fontSize: "var(--text-3xl)",
            fontWeight: 900,
            color: "var(--color-primary)",
            letterSpacing: "-0.5px",
          }}
        >
          {APP_INFO.name}
        </h1>

        {/* الوصف المختصر */}
        <p
          style={{
            margin: "0 0 var(--sp-4) 0",
            fontSize: "var(--text-sm)",
            color: "var(--text-secondary)",
            lineHeight: "var(--lh-relaxed)",
          }}
        >
          منصة التعارف الجاد بهدف الزواج{"\n"}
          للعالم العربي والجالية المسلمة
        </p>

        {/* بادجات */}
        <div
          style={{
            display: "flex",
            gap: "var(--sp-2)",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[APP_INFO.platform, APP_INFO.region, `v${APP_INFO.version}`].map((tag) => (
            <span
              key={tag}
              style={{
                padding: "var(--sp-1) var(--sp-3)",
                borderRadius: "var(--radius-full)",
                border: "1px solid var(--border-soft)",
                fontSize: "var(--text-2xs)",
                color: "var(--text-tertiary)",
                background: "var(--bg-soft)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ══ القيم الجوهرية ══ */}
      <div
        style={{
          padding: "var(--sp-6) var(--sp-5)",
          background: "var(--bg-surface)",
          marginTop: "var(--sp-2)",
        }}
      >
        <SectionTitle text="قيمنا" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-3)",
          }}
        >
          {CORE_VALUES.map((v) => (
            <ValueCard key={v.id} icon={v.icon} title={v.title} desc={v.desc} />
          ))}
        </div>
      </div>

      {/* ══ المميزات ══ */}
      <div
        style={{
          padding: "var(--sp-6) var(--sp-5)",
          background: "var(--bg-surface)",
          marginTop: "var(--sp-2)",
        }}
      >
        <SectionTitle text="المميزات" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--sp-3)",
          }}
        >
          {MAIN_FEATURES.map((f) => (
            <FeatureCard key={f.id} icon={f.icon} title={f.title} desc={f.desc} />
          ))}
        </div>
      </div>

      {/* ══ فريق التطوير ══ */}
      <div
        style={{
          padding: "var(--sp-6) var(--sp-5)",
          background: "var(--bg-surface)",
          marginTop: "var(--sp-2)",
        }}
      >
        <SectionTitle text="فريق التطوير" />
        <div
          style={{
            padding: "var(--sp-5)",
            background: "var(--bg-soft)",
            borderRadius: "var(--radius-md)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 var(--sp-2) 0",
              fontSize: "var(--text-xl)",
              fontWeight: 900,
              color: "var(--color-primary)",
              letterSpacing: "1px",
            }}
          >
            ORCAUP
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-xs)",
              color: "var(--text-secondary)",
              lineHeight: "var(--lh-relaxed)",
            }}
          >
            فريق متخصص في بناء منتجات رقمية تخدم المجتمع العربي
            وتحترم قيمه وخصوصيته.
          </p>
        </div>
      </div>

      {/* ══ التواصل ══ */}
      <div
        style={{
          padding: "var(--sp-6) var(--sp-5)",
          background: "var(--bg-surface)",
          marginTop: "var(--sp-2)",
        }}
      >
        <SectionTitle text="تواصل معنا" />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--sp-3)",
          }}
        >
          {/* الدعم الفني */}
          <a
            href={`mailto:${APP_INFO.supportEmail}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--sp-4)",
              background: "var(--bg-soft)",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              border: "1px solid var(--border-soft)",
            }}
          >
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-primary)",
                fontWeight: 600,
              }}
            >
              {APP_INFO.supportEmail}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-2)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                }}
              >
                الدعم الفني
              </span>
              <Mail
                style={{
                  width: "var(--icon-sm)",
                  height: "var(--icon-sm)",
                  color: "var(--text-tertiary)",
                }}
              />
            </div>
          </a>

          {/* التواصل العام */}
          <a
            href={`mailto:${APP_INFO.contactEmail}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "var(--sp-4)",
              background: "var(--bg-soft)",
              borderRadius: "var(--radius-md)",
              textDecoration: "none",
              border: "1px solid var(--border-soft)",
            }}
          >
            <span
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--color-primary)",
                fontWeight: 600,
              }}
            >
              {APP_INFO.contactEmail}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-2)",
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-tertiary)",
                }}
              >
                التواصل العام
              </span>
              <Mail
                style={{
                  width: "var(--icon-sm)",
                  height: "var(--icon-sm)",
                  color: "var(--text-tertiary)",
                }}
              />
            </div>
          </a>
        </div>
      </div>

      {/* ══ فوتر ══ */}
      <div
        style={{
          marginTop: "var(--sp-6)",
          padding: "var(--sp-4) var(--sp-5)",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-2xs)",
            color: "var(--text-tertiary)",
          }}
        >
          © {APP_INFO.year} {APP_INFO.name} by {APP_INFO.devTeam} · جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
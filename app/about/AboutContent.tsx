"use client";

// AboutContent.tsx
// المسار: app/about/AboutContent.tsx

import { useEffect, useState } from "react";
import {
  Handshake, Lock, ShieldCheck, Star,
  Sparkles, Users, EyeOff, Gift, KeyRound, SunMoon,
  Mail,
} from "lucide-react";
import { APP_INFO, CORE_VALUES, MAIN_FEATURES } from "./about-data";
import Footer                  from '@/components/layout/Footer';

const LAST_UPDATED = "2026-05-26";

// map اسم النص -> مكوّن Lucide
const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Handshake, Lock, ShieldCheck, Star,
  Sparkles, Users, EyeOff, Gift, KeyRound, SunMoon,
};

function AppIcon({ name }: { name: string }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return (
    <Icon
      style={{
        width: "var(--icon-lg)",
        height: "var(--icon-lg)",
        color: "var(--color-primary)",
        flexShrink: 0,
      }}
      strokeWidth={1.75}
    />
  );
}

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
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </h2>
      <div style={{ flex: 1, height: "1px", background: "var(--border-soft)" }} />
    </div>
  );
}

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
      <AppIcon name={icon} />
      <div style={{ flex: 1, textAlign: "right" }}>
        <p style={{ margin: "0 0 var(--sp-1) 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-main)" }}>
          {title}
        </p>
        <p style={{ margin: 0, fontSize: "var(--text-xs)", lineHeight: "var(--lh-relaxed)", color: "var(--text-secondary)" }}>
          {desc}
        </p>
      </div>
    </div>
  );
}

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
      <AppIcon name={icon} />
      <p style={{ margin: "var(--sp-2) 0 var(--sp-1) 0", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-main)" }}>
        {title}
      </p>
      <p style={{ margin: 0, fontSize: "var(--text-xs)", lineHeight: "var(--lh-relaxed)", color: "var(--text-secondary)" }}>
        {desc}
      </p>
    </div>
  );
}

export default function AboutContent() {
  const [version, setVersion] = useState<string>("...");

  useEffect(() => {
    fetch("/update-info.json")
      .then((r) => r.json())
      .then((d) => setVersion(d.version ?? "—"))
      .catch(() => setVersion("—"));
  }, []);

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "var(--bg-main)", paddingBottom: "var(--sp-16)" }}>

      {/* ══ هيدر ══ */}
      <div
        style={{
          padding: "var(--sp-8) var(--sp-5) var(--sp-6)",
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border-soft)",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: "0 0 var(--sp-2) 0", fontSize: "var(--text-3xl)", fontWeight: 900, color: "var(--color-primary)", letterSpacing: "-0.5px" }}>
          {APP_INFO.name}
        </h1>
        <p style={{ margin: "0 0 var(--sp-4) 0", fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: "var(--lh-relaxed)" }}>
          منصة التعارف الجاد بهدف الزواج{"\n"}للعالم العربي والجالية المسلمة
        </p>

        <div style={{ display: "flex", gap: "var(--sp-2)", justifyContent: "center", flexWrap: "wrap" }}>
          {[APP_INFO.platform, APP_INFO.region, `v${version}`].map((tag) => (
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

      {/* ══ القيم ══ */}
      <div style={{ padding: "var(--sp-6) var(--sp-5)", background: "var(--bg-surface)", marginTop: "var(--sp-2)" }}>
        <SectionTitle text="قيمنا" />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {CORE_VALUES.map((v) => <ValueCard key={v.id} icon={v.icon} title={v.title} desc={v.desc} />)}
        </div>
      </div>

      {/* ══ المميزات ══ */}
      <div style={{ padding: "var(--sp-6) var(--sp-5)", background: "var(--bg-surface)", marginTop: "var(--sp-2)" }}>
        <SectionTitle text="المميزات" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-3)" }}>
          {MAIN_FEATURES.map((f) => <FeatureCard key={f.id} icon={f.icon} title={f.title} desc={f.desc} />)}
        </div>
      </div>

      {/* ══ فريق التطوير ══ */}
      <div style={{ padding: "var(--sp-6) var(--sp-5)", background: "var(--bg-surface)", marginTop: "var(--sp-2)" }}>
        <SectionTitle text="فريق التطوير" />
        <div style={{ padding: "var(--sp-5)", background: "var(--bg-soft)", borderRadius: "var(--radius-md)", textAlign: "center" }}>
          <p style={{ margin: "0 0 var(--sp-2) 0", fontSize: "var(--text-xl)", fontWeight: 900, color: "var(--color-primary)", letterSpacing: "1px" }}>
            ORCAUP
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)", lineHeight: "var(--lh-relaxed)" }}>
            فريق متخصص في بناء منتجات رقمية تخدم المجتمع العربي وتحترم قيمه وخصوصيته.
          </p>
        </div>
      </div>

      {/* ══ التواصل ══ */}
      <div style={{ padding: "var(--sp-6) var(--sp-5)", background: "var(--bg-surface)", marginTop: "var(--sp-2)" }}>
        <SectionTitle text="تواصل معنا" />
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-3)" }}>
          {[
            { label: "الدعم الفني", email: APP_INFO.supportEmail },
            { label: "التواصل العام", email: APP_INFO.contactEmail },
          ].map(({ label, email }) => (
            <a
              key={email}
              href={`mailto:${email}`}
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
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-primary)", fontWeight: 600 }}>
                {email}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{label}</span>
                <Mail style={{ width: "var(--icon-sm)", height: "var(--icon-sm)", color: "var(--text-tertiary)" }} />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ══ فوتر ══ */}
      <Footer />
    </div>
  );
}
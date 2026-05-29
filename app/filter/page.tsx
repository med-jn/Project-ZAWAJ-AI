'use client';
/**
 * 📁 app/filter/page.tsx — ZAWAJ AI
 * صفحة فلاتر البحث المستقلة
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, MapPin, Calendar, X, Check } from 'lucide-react';
import { COUNTRIES_CITIES } from '@/constants/countries';

// ─────────────────────────────────────────────────────────────
export interface DiscoveryFilters {
  ageMin: number;
  ageMax: number;
  country: string;
  city: string;
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
  ageMin: 18, ageMax: 60, country: '', city: '',
};

export function filtersAreActive(f: DiscoveryFilters) {
  return f.ageMin !== 18 || f.ageMax !== 60 || f.country !== '' || f.city !== '';
}

// ─────────────────────────────────────────────────────────────
//  Persistence helpers (sessionStorage — لا localStorage لتجنب
//  أي شبهة تخزين حساس — يُمسح عند إغلاق المتصفح)
// ─────────────────────────────────────────────────────────────
const FILTER_KEY = 'zawaj_filters';

export function loadFilters(): DiscoveryFilters {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch { return DEFAULT_FILTERS; }
}

export function saveFilters(f: DiscoveryFilters) {
  try { sessionStorage.setItem(FILTER_KEY, JSON.stringify(f)); } catch {}
}

export function clearFilters() {
  try { sessionStorage.removeItem(FILTER_KEY); } catch {}
}

// ─────────────────────────────────────────────────────────────
//  مكوّن الصف
// ─────────────────────────────────────────────────────────────
function Section({ icon, title, badge, children }: {
  icon: React.ReactNode; title: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      overflow: 'hidden',
      marginBottom: 'var(--sp-3)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
        padding: 'var(--sp-3) var(--sp-4)',
        borderBottom: '1px solid var(--glass-border)',
      }}>
        <span style={{ color: 'var(--color-primary)', display: 'flex' }}>{icon}</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 'var(--text-sm)', flex: 1 }}>
          {title}
        </span>
        {badge && (
          <span style={{
            background: 'rgba(192,0,42,0.15)', color: '#ff6680',
            fontSize: 'var(--text-2xs)', fontWeight: 700,
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(192,0,42,0.25)',
          }}>{badge}</span>
        )}
      </div>
      <div style={{ padding: 'var(--sp-4)' }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  الصفحة
// ─────────────────────────────────────────────────────────────
export default function FilterPage() {
  const router = useRouter();
  const [f, setF] = useState<DiscoveryFilters>(loadFilters);

  const countries = Object.keys(COUNTRIES_CITIES);
  const cities    = f.country ? COUNTRIES_CITIES[f.country] ?? [] : [];
  const active    = filtersAreActive(f);

  const apply = () => {
    saveFilters(f);
    router.back();
  };

  const reset = () => {
    clearFilters();
    setF(DEFAULT_FILTERS);
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--sp-3) var(--sp-4)',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(7,2,10,0.92)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'inherit',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  };

  return (
    <div dir="rtl" style={{ minHeight: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-4) var(--sp-5)',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)',
        }}>
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <SlidersHorizontal size={16} style={{ color: 'var(--color-primary)' }} />
          <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-base)' }}>
            فلاتر البحث
          </span>
          {active && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'inline-block',
            }} />
          )}
        </div>

        <button onClick={reset} style={{
          fontSize: 'var(--text-xs)', color: active ? '#ff6680' : 'var(--text-tertiary)',
          background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontWeight: 700, padding: 'var(--sp-1) var(--sp-2)',
          opacity: active ? 1 : 0.4,
          transition: 'opacity 0.2s',
        }}>
          إعادة تعيين
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-5)' }}>

        {/* العمر */}
        <Section
          icon={<Calendar size={15} />}
          title="نطاق العمر"
          badge={`${f.ageMin} — ${f.ageMax} سنة`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>من</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 'var(--text-sm)' }}>
                  {f.ageMin} سنة
                </span>
              </div>
              <input type="range" min={18} max={f.ageMax - 1} value={f.ageMin}
                step={1}
                onChange={e => setF(p => ({ ...p, ageMin: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--sp-2)' }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>إلى</span>
                <span style={{ color: 'var(--text-main)', fontWeight: 800, fontSize: 'var(--text-sm)' }}>
                  {f.ageMax} سنة
                </span>
              </div>
              <input type="range" min={f.ageMin + 1} max={80} value={f.ageMax}
                step={1}
                onChange={e => setF(p => ({ ...p, ageMax: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--color-primary)', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)' }}>18</span>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)' }}>80</span>
              </div>
            </div>
          </div>
        </Section>

        {/* الموقع */}
        <Section
          icon={<MapPin size={15} />}
          title="الموقع الجغرافي"
          badge={f.city || f.country || undefined}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
            <div style={{ position: 'relative' }}>
              <select dir="rtl" value={f.country}
                onChange={e => setF(p => ({ ...p, country: e.target.value, city: '' }))}
                style={selectStyle}>
                <option value="">— كل الدول —</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <MapPin size={14} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-primary)', opacity: 0.6, pointerEvents: 'none',
              }} />
            </div>

            <div style={{ position: 'relative' }}>
              <select dir="rtl" value={f.city}
                onChange={e => setF(p => ({ ...p, city: e.target.value }))}
                disabled={!f.country}
                style={{ ...selectStyle, opacity: f.country ? 1 : 0.35 }}>
                <option value="">— كل المدن —</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {(f.country || f.city) && (
              <button onClick={() => setF(p => ({ ...p, country: '', city: '' }))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,100,100,0.7)', fontSize: 'var(--text-xs)',
                  fontFamily: 'inherit', fontWeight: 700, textAlign: 'right',
                  padding: 0,
                }}>
                مسح الموقع ✕
              </button>
            )}
          </div>
        </Section>

      </div>

      {/* Footer Buttons */}
      <div style={{
        padding: 'var(--sp-4) var(--sp-5)',
        paddingBottom: 'calc(var(--sp-5) + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(20px)',
        display: 'flex', gap: 'var(--sp-3)',
      }}>
        <button onClick={() => router.back()} style={{
          flex: 1, height: 'var(--btn-h)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          color: 'var(--text-secondary)',
          fontSize: 'var(--text-sm)', fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer',
        }}>
          إلغاء
        </button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={apply}
          style={{
            flex: 2, height: 'var(--btn-h)',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg,#800020,#c0002a)',
            boxShadow: '0 6px 20px rgba(192,0,42,0.4)',
            border: 'none', color: '#fff',
            fontSize: 'var(--text-sm)', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 'var(--sp-2)',
          }}>
          <Check size={16} />
          تطبيق الفلاتر
        </motion.button>
      </div>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, MapPin, Calendar, X, Check } from 'lucide-react';
import { COUNTRIES_CITIES } from '@/constants/countries';

export interface DiscoveryFilters {
  ageMin: number;
  ageMax: number;
  country: string;
  city: string;
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
  ageMin: 18,
  ageMax: 65,
  country: '',
  city: '',
};

export function filtersAreActive(f: DiscoveryFilters) {
  return (
    f.ageMin !== 18 ||
    f.ageMax !== 65 ||
    f.country !== '' ||
    f.city !== ''
  );
}

// ─────────────────────────────────────────────
const FILTER_KEY = 'zawaj_filters';

export function loadFilters(): DiscoveryFilters {
  try {
    const raw = sessionStorage.getItem(FILTER_KEY);
    if (!raw) return DEFAULT_FILTERS;
    return { ...DEFAULT_FILTERS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTERS;
  }
}

export function saveFilters(f: DiscoveryFilters) {
  try {
    sessionStorage.setItem(FILTER_KEY, JSON.stringify(f));
  } catch {}
}

export function clearFilters() {
  try {
    sessionStorage.removeItem(FILTER_KEY);
  } catch {}
}

// ─────────────────────────────────────────────
function Section({ icon, title, badge, children }: any) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        {icon}
        <b>{title}</b>
        {badge && <span>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
export default function FilterPage() {
  const router = useRouter();
  const [f, setF] = useState<DiscoveryFilters>(loadFilters);

  const apply = () => {
    saveFilters(f);
    router.back();
  };

  const reset = () => {
    clearFilters();
    setF(DEFAULT_FILTERS);
  };

  // 🔥 RANGE LOGIC (single dual slider simulation)
  const handleMin = (val: number) => {
    setF(p => ({
      ...p,
      ageMin: Math.min(val, p.ageMax - 1),
    }));
  };

  const handleMax = (val: number) => {
    setF(p => ({
      ...p,
      ageMax: Math.max(val, p.ageMin + 1),
    }));
  };

  const active = filtersAreActive(f);

  return (
    <div style={{ padding: 20 }}>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => router.back()}>
          <X />
        </button>

        <b>فلاتر البحث</b>

        <button onClick={reset}>
          إعادة
        </button>
      </div>

      {/* AGE RANGE (DUAL CONTROL) */}
      <Section
        icon={<Calendar />}
        title="العمر"
        badge={`${f.ageMin} - ${f.ageMax}`}
      >

        {/* MIN */}
        <div>
          <div>من: {f.ageMin}</div>
          <input
            type="range"
            min={18}
            max={f.ageMax - 1}
            value={f.ageMin}
            onChange={(e) => handleMin(Number(e.target.value))}
          />
        </div>

        {/* MAX */}
        <div>
          <div>إلى: {f.ageMax}</div>
          <input
            type="range"
            min={f.ageMin + 1}
            max={65}
            value={f.ageMax}
            onChange={(e) => handleMax(Number(e.target.value))}
          />
        </div>

      </Section>

      {/* LOCATION */}
      <Section icon={<MapPin />} title="الموقع">
        <select
          value={f.country}
          onChange={(e) =>
            setF(p => ({ ...p, country: e.target.value, city: '' }))
          }
        >
          <option value="">كل الدول</option>
          {Object.keys(COUNTRIES_CITIES).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={f.city}
          disabled={!f.country}
          onChange={(e) =>
            setF(p => ({ ...p, city: e.target.value }))
          }
        >
          <option value="">كل المدن</option>
          {(COUNTRIES_CITIES[f.country] ?? []).map((c: string) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Section>

      {/* APPLY */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={apply}
        style={{
          width: '100%',
          marginTop: 20,
          padding: 14,
          background: 'red',
          color: '#fff',
          fontWeight: 900,
        }}
      >
        تطبيق
      </motion.button>

    </div>
  );
}
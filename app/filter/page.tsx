'use client';
/**
 * 📁 app/filter/page.tsx — ZAWAJ AI v3
 * ✅ أقسام accordion قابلة للطي
 * ✅ Range مزدوج للعمر والطول والوزن
 * ✅ كل حقول الاستمارة مدمجة
 * ✅ فلاتر جنسية حسب جنس المستخدم (حجاب/لحية)
 * ✅ استثناء المحظورين تلقائياً
 * ✅ مطابق لمتغيرات globals.css
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter }   from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SlidersHorizontal, MapPin, Calendar, X, Check,
  ChevronDown, Users, BookOpen, Heart, Home,
  Moon, Activity, Smile, Baby, RotateCcw,
} from 'lucide-react';
import { supabase }          from '@/lib/supabase/client';
import { COUNTRIES_CITIES }  from '@/constants/countries';
import { OCCUPATIONS }       from '@/constants/occupations';
import {
  MARITAL_STATUS, EDUCATION_LEVELS, RELIGIOUS_COMMITMENT,
  FINANCIAL_STATUS, MARRIAGE_READINESS, HOUSING_STATUS,
  PREFERRED_HOUSING, QURAN_MEMORIZATION, BEARD_STYLE,
  PRAYER_COMMITMENT, HIJAB_STYLE, POLYGAMY_ACCEPTANCE,
  WORK_AFTER_MARRIAGE, HEALTH_STATUS_OPTIONS, SMOKING,
  SKIN_COLOR, TRAVEL_WILLINGNESS, DESIRE_FOR_CHILDREN,
  SOCIAL_TYPE, MORNING_EVENING, CONFLICT_STYLE,
  AFFECTION_STYLE, LIFE_PRIORITY, PARENTING_STYLE,
  RELATIONSHIP_WITH_FAMILY, COMMITTED_LEVELS,
} from '@/constants/constants';

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════
export interface DiscoveryFilters {
  // الأساسيات
  ageMin:      number;
  ageMax:      number;
  country:     string;
  city:        string;
  // الجسم
  heightMin:   number;
  heightMax:   number;
  weightMin:   number;
  weightMax:   number;
  // الهوية
  nationality:       string;
  marital_status:    number[];
  education_level:   number[];
  occupation_cat:    number[];
  financial_status:  string[];
  // الدين
  religious_commitment: number[];
  readiness_level:      number[];
  quran_memorization:   string[];
  beard_style:          string[];
  prayer_commitment:    string[];
  hijab_style:          string[];
  polygamy_acceptance:  string[];
  work_after_marriage:  string[];
  // السكن والحياة
  housing_type:       number[];
  preferred_housing:  string[];
  travel_willingness: string[];
  desire_for_children:string[];
  // الصحة
  health_status: string[];
  smoking:       string[];
  skin_color:    string[];
  // الشخصية
  social_type:             string[];
  morning_evening:         string[];
  conflict_style:          string[];
  affection_style:         string[];
  life_priority:           string[];
  parenting_style:         string[];
  relationship_with_family:string[];
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
  ageMin: 18, ageMax: 60,
  country: '', city: '',
  heightMin: 140, heightMax: 210,
  weightMin: 40,  weightMax: 150,
  nationality: '',
  marital_status: [], education_level: [], occupation_cat: [],
  financial_status: [],
  religious_commitment: [], readiness_level: [],
  quran_memorization: [], beard_style: [], prayer_commitment: [],
  hijab_style: [], polygamy_acceptance: [], work_after_marriage: [],
  housing_type: [], preferred_housing: [],
  travel_willingness: [], desire_for_children: [],
  health_status: [], smoking: [], skin_color: [],
  social_type: [], morning_evening: [], conflict_style: [],
  affection_style: [], life_priority: [], parenting_style: [],
  relationship_with_family: [],
};

const FILTER_KEY = 'zawaj_filters_v3';

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

export function filtersAreActive(f: DiscoveryFilters): boolean {
  const d = DEFAULT_FILTERS;
  return (
    f.ageMin !== d.ageMin || f.ageMax !== d.ageMax ||
    f.country !== '' || f.city !== '' ||
    f.heightMin !== d.heightMin || f.heightMax !== d.heightMax ||
    f.weightMin !== d.weightMin || f.weightMax !== d.weightMax ||
    f.nationality !== '' ||
    f.marital_status.length > 0 || f.education_level.length > 0 ||
    f.occupation_cat.length > 0 || f.financial_status.length > 0 ||
    f.religious_commitment.length > 0 || f.readiness_level.length > 0 ||
    f.quran_memorization.length > 0 || f.beard_style.length > 0 ||
    f.prayer_commitment.length > 0 || f.hijab_style.length > 0 ||
    f.polygamy_acceptance.length > 0 || f.work_after_marriage.length > 0 ||
    f.housing_type.length > 0 || f.preferred_housing.length > 0 ||
    f.travel_willingness.length > 0 || f.desire_for_children.length > 0 ||
    f.health_status.length > 0 || f.smoking.length > 0 ||
    f.skin_color.length > 0 || f.social_type.length > 0 ||
    f.morning_evening.length > 0 || f.conflict_style.length > 0 ||
    f.affection_style.length > 0 || f.life_priority.length > 0 ||
    f.parenting_style.length > 0 || f.relationship_with_family.length > 0
  );
}

// عدد الفلاتر النشطة لقسم معين
function countActive(vals: (string | number)[][]): number {
  return vals.filter(v => v.length > 0).length;
}

// ══════════════════════════════════════════════════════════════
// Range Slider مزدوج
// ══════════════════════════════════════════════════════════════
function DualRange({
  min, max, valueMin, valueMax,
  onChangeMin, onChangeMax,
  unit = '',
}: {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  unit?: string;
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div style={{ padding: '8px 0 4px' }}>
      {/* القيم */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 'var(--sp-3)',
      }}>
        <span style={{
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          color: 'var(--color-primary)',
          fontSize: 'var(--text-xs)', fontWeight: 800,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
        }}>
          {valueMin} {unit}
        </span>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', alignSelf: 'center' }}>—</span>
        <span style={{
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          color: 'var(--color-primary)',
          fontSize: 'var(--text-xs)', fontWeight: 800,
          padding: '3px 10px', borderRadius: 'var(--radius-full)',
        }}>
          {valueMax} {unit}
        </span>
      </div>

      {/* الشريط */}
      <div style={{ position: 'relative', height: 6, margin: '8px 0' }}>
        {/* الخلفية */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 99,
          background: 'var(--glass-border)',
        }} />
        {/* النطاق المحدد */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: `${pct(valueMin)}%`,
          right: `${100 - pct(valueMax)}%`,
          borderRadius: 99,
          background: 'var(--color-primary)',
        }} />

        {/* شريط الحد الأدنى */}
        <input type="range"
          min={min} max={max} value={valueMin} step={1}
          onChange={e => {
            const v = parseInt(e.target.value);
            if (v < valueMax) onChangeMin(v);
          }}
          style={{
            position: 'absolute', width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
            WebkitAppearance: 'none',
          }}
        />
        {/* شريط الحد الأقصى */}
        <input type="range"
          min={min} max={max} value={valueMax} step={1}
          onChange={e => {
            const v = parseInt(e.target.value);
            if (v > valueMin) onChangeMax(v);
          }}
          style={{
            position: 'absolute', width: '100%', height: '100%',
            opacity: 0, cursor: 'pointer', margin: 0,
            WebkitAppearance: 'none',
          }}
        />

        {/* مؤشر الحد الأدنى */}
        <div style={{
          position: 'absolute', top: '50%',
          left: `${pct(valueMin)}%`,
          transform: 'translate(-50%, -50%)',
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--color-primary)',
          border: '3px solid var(--bg-main)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
        {/* مؤشر الحد الأقصى */}
        <div style={{
          position: 'absolute', top: '50%',
          left: `${pct(valueMax)}%`,
          transform: 'translate(-50%, -50%)',
          width: 22, height: 22, borderRadius: '50%',
          background: 'var(--color-primary)',
          border: '3px solid var(--bg-main)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />
      </div>

      {/* حدود النطاق */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 'var(--sp-1)',
      }}>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{min} {unit}</span>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>{max} {unit}</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Pills متعددة الاختيار
// ══════════════════════════════════════════════════════════════
function MultiPills({
  options, selected, onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (o: string) => {
    if (selected.includes(o)) onChange(selected.filter(x => x !== o));
    else onChange([...selected, o]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(o => {
        const active = selected.includes(o);
        return (
          <motion.button key={o} type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => toggle(o)}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-full)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 'var(--text-sm)', fontWeight: active ? 700 : 400,
              background: active ? 'var(--color-primary)' : 'var(--glass-bg)',
              color: active ? '#fff' : 'var(--text-secondary)',
              outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
              boxShadow: active ? '0 3px 12px var(--shadow-red-glow)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {o}
          </motion.button>
        );
      })}
    </div>
  );
}

// Pills للـ IDs (marital_status, education_level, etc.)
function IdMultiPills<T extends { id: number }>({
  items, getLabel, selected, onChange,
}: {
  items: T[];
  getLabel: (item: T) => string;
  selected: number[];
  onChange: (v: number[]) => void;
}) {
  const toggle = (id: number) => {
    if (selected.includes(id)) onChange(selected.filter(x => x !== id));
    else onChange([...selected, id]);
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map(item => {
        const active = selected.includes(item.id);
        return (
          <motion.button key={item.id} type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => toggle(item.id)}
            style={{
              padding: '7px 16px', borderRadius: 'var(--radius-full)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 'var(--text-sm)', fontWeight: active ? 700 : 400,
              background: active ? 'var(--color-primary)' : 'var(--glass-bg)',
              color: active ? '#fff' : 'var(--text-secondary)',
              outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
              boxShadow: active ? '0 3px 12px var(--shadow-red-glow)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {getLabel(item)}
          </motion.button>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Accordion Section
// ══════════════════════════════════════════════════════════════
function AccordionSection({
  icon, title, activeCount, children, defaultOpen = false,
}: {
  icon: React.ReactNode;
  title: string;
  activeCount?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      background: 'var(--glass-bg)',
      border: `1px solid ${activeCount ? 'var(--color-primary-soft)' : 'var(--glass-border)'}`,
      overflow: 'hidden',
      marginBottom: 'var(--sp-3)',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: 'var(--sp-4)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
          background: open
            ? activeCount ? 'var(--color-primary-xsoft)' : 'rgba(255,255,255,0.03)'
            : 'transparent',
          border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--glass-border)' : 'none',
          transition: 'background 0.2s',
          direction: 'rtl',
        }}
      >
        {/* أيقونة */}
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
          background: activeCount ? 'var(--color-primary-xsoft)' : 'var(--glass-bg)',
          border: `1px solid ${activeCount ? 'var(--color-primary-soft)' : 'var(--glass-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          color: activeCount ? 'var(--color-primary)' : 'var(--text-tertiary)',
        }}>
          {icon}
        </div>

        {/* العنوان */}
        <span style={{
          flex: 1, textAlign: 'right',
          fontWeight: 800, fontSize: 'var(--text-sm)',
          color: activeCount ? 'var(--color-primary)' : 'var(--text-main)',
        }}>
          {title}
        </span>

        {/* عداد الفلاتر النشطة */}
        {!!activeCount && (
          <span style={{
            minWidth: 20, height: 20,
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-primary)',
            color: '#fff', fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 5px', flexShrink: 0,
          }}>
            {activeCount}
          </span>
        )}

        {/* السهم */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          style={{ flexShrink: 0 }}
        >
          <ChevronDown size={16} color="var(--text-tertiary)" />
        </motion.div>
      </motion.button>

      {/* المحتوى */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: 'var(--sp-4)' }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// تسمية داخل القسم
function FieldLabel({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 'var(--text-2xs)', fontWeight: 800,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--text-tertiary)', margin: '0 0 var(--sp-2)',
    }}>
      {text}
    </p>
  );
}

// ══════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ══════════════════════════════════════════════════════════════
export default function FilterPage() {
  const router = useRouter();
  const [f, setF]           = useState<DiscoveryFilters>(loadFilters);
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);
  const isMale = userGender === 'male';

  // جلب جنس المستخدم لإظهار الفلاتر المناسبة
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from('profiles').select('gender').eq('id', data.user.id).single();
      if (profile?.gender) setUserGender(profile.gender as 'male' | 'female');
    });
  }, []);

  const set = useCallback(<K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => {
    setF(p => ({ ...p, [k]: v }));
  }, []);

  const active  = filtersAreActive(f);
  const countries = Object.keys(COUNTRIES_CITIES);
  const cities    = f.country ? (COUNTRIES_CITIES[f.country] ?? []) : [];

  const apply = () => { saveFilters(f); router.back(); };
  const reset = () => { clearFilters(); setF(DEFAULT_FILTERS); };

  // عدد الفلاتر النشطة لكل قسم
  const countBasic = [
    f.ageMin !== 18 || f.ageMax !== 60 ? [1] : [],
    f.country ? [1] : [],
    f.nationality ? [1] : [],
    f.marital_status,
  ].filter(v => v.length > 0).length;

  const countBody = [
    f.heightMin !== 140 || f.heightMax !== 210 ? [1] : [],
    f.weightMin !== 40  || f.weightMax !== 150  ? [1] : [],
    f.skin_color,
  ].filter(v => v.length > 0).length;

  const countEdu = [f.education_level, f.occupation_cat, f.financial_status]
    .filter(v => v.length > 0).length;

  const countReligion = [
    f.religious_commitment, f.readiness_level, f.quran_memorization,
    f.beard_style, f.prayer_commitment, f.hijab_style,
    f.polygamy_acceptance, f.work_after_marriage,
  ].filter(v => v.length > 0).length;

  const countLife = [
    f.housing_type, f.preferred_housing,
    f.travel_willingness, f.desire_for_children,
    f.health_status, f.smoking,
  ].filter(v => v.length > 0).length;

  const countPersonality = [
    f.social_type, f.morning_evening, f.conflict_style,
    f.affection_style, f.life_priority, f.parenting_style,
    f.relationship_with_family,
  ].filter(v => v.length > 0).length;

  // select style
  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: 'var(--sp-3) var(--sp-4)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-main)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'inherit',
    outline: 'none',
    appearance: 'none',
    cursor: 'pointer',
  };

  return (
    <div dir="rtl" style={{
      minHeight: '100dvh', background: 'var(--bg-main)',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-4) var(--sp-4)',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* إغلاق */}
        <motion.button whileTap={{ scale: 0.88 }}
          onClick={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-full)',
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
          }}>
          <X size={16} strokeWidth={2} />
        </motion.button>

        {/* العنوان */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <SlidersHorizontal size={16} color="var(--color-primary)" strokeWidth={2} />
          <span style={{
            color: 'var(--text-main)', fontWeight: 900,
            fontSize: 'var(--text-base)',
          }}>
            البحث المتقدم
          </span>
          {active && (
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-primary)', display: 'inline-block',
            }} />
          )}
        </div>

        {/* إعادة تعيين */}
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={reset}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 'var(--text-xs)', fontWeight: 700,
            color: active ? 'var(--color-primary)' : 'var(--text-tertiary)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', opacity: active ? 1 : 0.4,
            padding: 'var(--sp-1) var(--sp-2)',
            transition: 'opacity 0.2s',
          }}>
          <RotateCcw size={13} strokeWidth={2.5} />
          تصفير
        </motion.button>
      </div>

      {/* ── المحتوى ─────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-4)' }}>

        {/* 1. الأساسيات */}
        <AccordionSection
          icon={<Calendar size={16} strokeWidth={2} />}
          title="الأساسيات والموقع"
          activeCount={countBasic}
          defaultOpen
        >
          {/* العمر */}
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <FieldLabel text="نطاق العمر" />
            <DualRange
              min={18} max={80}
              valueMin={f.ageMin} valueMax={f.ageMax}
              onChangeMin={v => set('ageMin', v)}
              onChangeMax={v => set('ageMax', v)}
              unit="سنة"
            />
          </div>

          {/* الدولة والمدينة */}
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="بلد الإقامة" />
            <div style={{ position: 'relative' }}>
              <select dir="rtl" value={f.country}
                onChange={e => set('country', e.target.value) || set('city', '')}
                style={selectStyle}>
                <option value="">— كل الدول —</option>
                {countries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <MapPin size={14} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-primary)', opacity: 0.6,
                pointerEvents: 'none',
              }} />
            </div>
          </div>

          {f.country && (
            <div style={{ marginBottom: 'var(--sp-4)' }}>
              <FieldLabel text="المدينة" />
              <select dir="rtl" value={f.city}
                onChange={e => set('city', e.target.value)}
                style={selectStyle}>
                <option value="">— كل المدن —</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          {/* الجنسية */}
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="الجنسية" />
            <select dir="rtl" value={f.nationality}
              onChange={e => set('nationality', e.target.value)}
              style={selectStyle}>
              <option value="">— كل الجنسيات —</option>
              {Object.keys(COUNTRIES_CITIES).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* الحالة المدنية */}
          <div>
            <FieldLabel text="الحالة المدنية" />
            <IdMultiPills
              items={MARITAL_STATUS}
              getLabel={s => isMale ? s.male : s.female}
              selected={f.marital_status}
              onChange={v => set('marital_status', v)}
            />
          </div>
        </AccordionSection>

        {/* 2. الجسم والمظهر */}
        <AccordionSection
          icon={<Activity size={16} strokeWidth={2} />}
          title="الجسم والمظهر"
          activeCount={countBody}
        >
          {/* الطول */}
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <FieldLabel text="الطول" />
            <DualRange
              min={140} max={210}
              valueMin={f.heightMin} valueMax={f.heightMax}
              onChangeMin={v => set('heightMin', v)}
              onChangeMax={v => set('heightMax', v)}
              unit="سم"
            />
          </div>

          {/* الوزن */}
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="الوزن" />
            <DualRange
              min={40} max={150}
              valueMin={f.weightMin} valueMax={f.weightMax}
              onChangeMin={v => set('weightMin', v)}
              onChangeMax={v => set('weightMax', v)}
              unit="كغ"
            />
          </div>

          {/* لون البشرة */}
          <div>
            <FieldLabel text="لون البشرة" />
            <MultiPills
              options={SKIN_COLOR}
              selected={f.skin_color}
              onChange={v => set('skin_color', v)}
            />
          </div>
        </AccordionSection>

        {/* 3. التعليم والعمل */}
        <AccordionSection
          icon={<BookOpen size={16} strokeWidth={2} />}
          title="التعليم والعمل"
          activeCount={countEdu}
        >
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="المستوى الدراسي" />
            <IdMultiPills
              items={EDUCATION_LEVELS}
              getLabel={e => e.label}
              selected={f.education_level}
              onChange={v => set('education_level', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="المجال المهني" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {OCCUPATIONS.filter(o => o.id !== 0).map(o => {
                const active = f.occupation_cat.includes(o.id);
                return (
                  <motion.button key={o.id} type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      if (active) set('occupation_cat', f.occupation_cat.filter(x => x !== o.id));
                      else set('occupation_cat', [...f.occupation_cat, o.id]);
                    }}
                    style={{
                      padding: '7px 14px', borderRadius: 'var(--radius-full)',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      fontSize: 'var(--text-xs)', fontWeight: active ? 700 : 400,
                      background: active ? 'var(--color-primary)' : 'var(--glass-bg)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {o.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel text="الوضع المادي" />
            <MultiPills
              options={FINANCIAL_STATUS}
              selected={f.financial_status}
              onChange={v => set('financial_status', v)}
            />
          </div>
        </AccordionSection>

        {/* 4. الدين والالتزام */}
        <AccordionSection
          icon={<Moon size={16} strokeWidth={2} />}
          title="الدين والالتزام"
          activeCount={countReligion}
        >
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="مستوى الالتزام" />
            <IdMultiPills
              items={RELIGIOUS_COMMITMENT}
              getLabel={r => isMale ? r.male : r.female}
              selected={f.religious_commitment}
              onChange={v => set('religious_commitment', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="جاهزية الزواج" />
            <IdMultiPills
              items={MARRIAGE_READINESS}
              getLabel={r => isMale ? r.male : r.female}
              selected={f.readiness_level}
              onChange={v => set('readiness_level', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="حفظ القرآن" />
            <MultiPills
              options={QURAN_MEMORIZATION}
              selected={f.quran_memorization}
              onChange={v => set('quran_memorization', v)}
            />
          </div>

          {/* فلاتر جنسية — يظهر حسب جنس المستخدم */}
          {/* المستخدم الذكر → يرى فلاتر الحجاب (يبحث عن أنثى) */}
          {isMale && (
            <>
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <FieldLabel text="اللباس (الحجاب)" />
                <MultiPills
                  options={HIJAB_STYLE}
                  selected={f.hijab_style}
                  onChange={v => set('hijab_style', v)}
                />
              </div>
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <FieldLabel text="قبول التعدد" />
                <MultiPills
                  options={POLYGAMY_ACCEPTANCE}
                  selected={f.polygamy_acceptance}
                  onChange={v => set('polygamy_acceptance', v)}
                />
              </div>
              <div>
                <FieldLabel text="العمل بعد الزواج" />
                <MultiPills
                  options={WORK_AFTER_MARRIAGE}
                  selected={f.work_after_marriage}
                  onChange={v => set('work_after_marriage', v)}
                />
              </div>
            </>
          )}

          {/* المستخدمة الأنثى → ترى فلاتر اللحية (تبحث عن ذكر) */}
          {!isMale && (
            <>
              <div style={{ marginBottom: 'var(--sp-4)' }}>
                <FieldLabel text="اللحية" />
                <MultiPills
                  options={BEARD_STYLE}
                  selected={f.beard_style}
                  onChange={v => set('beard_style', v)}
                />
              </div>
              <div>
                <FieldLabel text="الصلاة في المسجد" />
                <MultiPills
                  options={PRAYER_COMMITMENT}
                  selected={f.prayer_commitment}
                  onChange={v => set('prayer_commitment', v)}
                />
              </div>
            </>
          )}
        </AccordionSection>

        {/* 5. الحياة والصحة */}
        <AccordionSection
          icon={<Home size={16} strokeWidth={2} />}
          title="الحياة والصحة"
          activeCount={countLife}
        >
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="السكن الحالي" />
            <IdMultiPills
              items={HOUSING_STATUS}
              getLabel={h => h.label}
              selected={f.housing_type}
              onChange={v => set('housing_type', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="السكن بعد الزواج" />
            <MultiPills
              options={PREFERRED_HOUSING}
              selected={f.preferred_housing}
              onChange={v => set('preferred_housing', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="القبول بالانتقال" />
            <MultiPills
              options={TRAVEL_WILLINGNESS}
              selected={f.travel_willingness}
              onChange={v => set('travel_willingness', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="الرغبة في الإنجاب" />
            <MultiPills
              options={DESIRE_FOR_CHILDREN}
              selected={f.desire_for_children}
              onChange={v => set('desire_for_children', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="الحالة الصحية" />
            <MultiPills
              options={HEALTH_STATUS_OPTIONS}
              selected={f.health_status}
              onChange={v => set('health_status', v)}
            />
          </div>

          <div>
            <FieldLabel text="التدخين" />
            <MultiPills
              options={SMOKING}
              selected={f.smoking}
              onChange={v => set('smoking', v)}
            />
          </div>
        </AccordionSection>

        {/* 6. الشخصية والطبع */}
        <AccordionSection
          icon={<Smile size={16} strokeWidth={2} />}
          title="الشخصية والطبع"
          activeCount={countPersonality}
        >
          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="الشخصية الاجتماعية" />
            <MultiPills
              options={SOCIAL_TYPE}
              selected={f.social_type}
              onChange={v => set('social_type', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="صباحي أم مسائي" />
            <MultiPills
              options={MORNING_EVENING}
              selected={f.morning_evening}
              onChange={v => set('morning_evening', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="أسلوب حل الخلافات" />
            <MultiPills
              options={CONFLICT_STYLE}
              selected={f.conflict_style}
              onChange={v => set('conflict_style', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="التعبير عن المشاعر" />
            <MultiPills
              options={AFFECTION_STYLE}
              selected={f.affection_style}
              onChange={v => set('affection_style', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="أولويات الحياة" />
            <MultiPills
              options={LIFE_PRIORITY}
              selected={f.life_priority}
              onChange={v => set('life_priority', v)}
            />
          </div>

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <FieldLabel text="أسلوب التربية" />
            <MultiPills
              options={PARENTING_STYLE}
              selected={f.parenting_style}
              onChange={v => set('parenting_style', v)}
            />
          </div>

          <div>
            <FieldLabel text="العلاقة مع العائلة" />
            <MultiPills
              options={RELATIONSHIP_WITH_FAMILY}
              selected={f.relationship_with_family}
              onChange={v => set('relationship_with_family', v)}
            />
          </div>
        </AccordionSection>

        {/* مساحة للـ footer */}
        <div style={{ height: 100 }} />
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        padding: 'var(--sp-4) var(--sp-4)',
        paddingBottom: 'calc(var(--sp-4) + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--glass-border)',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        display: 'flex', gap: 'var(--sp-3)',
      }}>
        {/* إلغاء */}
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

        {/* تطبيق */}
        <motion.button whileTap={{ scale: 0.97 }}
          onClick={apply}
          style={{
            flex: 2, height: 'var(--btn-h)',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg,#800020,var(--color-primary))',
            boxShadow: '0 6px 20px var(--shadow-red-glow)',
            border: 'none', color: '#fff',
            fontSize: 'var(--text-sm)', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 'var(--sp-2)',
          }}>
          <Check size={16} strokeWidth={2.5} />
          تطبيق الفلاتر
        </motion.button>
      </div>
    </div>
  );
}
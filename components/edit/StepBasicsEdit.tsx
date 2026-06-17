'use client';
/**
 * StepBasicsEdit — الخطوة 0 لصفحة التعديل
 * ✅ حقول مقفولة: الاسم، الجنس، تاريخ الميلاد، الجنسية
 * ✅ زر الموقع الجغرافي + تحديث coords
 * ✅ باقي الحقول قابلة للتعديل
 */
import { useState, useCallback } from 'react';
import { motion }                from 'framer-motion';
import { Lock, MapPin, Loader2 } from 'lucide-react';
import { toast }                 from 'sonner';

import Field   from '@/components/onboarding/shared/Field';
import Sel     from '@/components/onboarding/shared/Sel';
import Pills   from '@/components/onboarding/shared/Pills';
import IdPills from '@/components/onboarding/shared/IdPills';
import Divider from '@/components/onboarding/shared/Divider';
import { Lbl } from '@/components/onboarding/shared/Lbl';

import { OCCUPATIONS }                               from '@/constants/occupations';
import { COUNTRIES_CITIES, ALL_COUNTRIES, COUNTRY_DIAL } from '@/constants/countries';
import {
  MARITAL_STATUS, EDUCATION_LEVELS, NATIONALITIES,
  FINANCIAL_STATUS, RELIGIOUS_COMMITMENT, MARRIAGE_READINESS,
} from '@/constants/constants';
import { getAutoLocation, saveLocationToProfile } from '@/lib/services/locationService';
import { supabase }                               from '@/lib/supabase/client';
import type { EditForm } from './types';

// ── حقل مقفول ──────────────────────────────────────────────
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Lbl t={label} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1.5px solid var(--glass-border)',
        padding: 'var(--sp-3) 0',
      }}>
        <span style={{
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-base)', fontWeight: 500,
        }}>{value || '—'}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: 'var(--text-tertiary)', opacity: 0.45,
        }}>
          <Lock size={11} />
          <span style={{ fontSize: 'var(--text-2xs)' }}>مقفول</span>
        </div>
      </div>
    </div>
  );
}

// ── الجنس بالعربية ──────────────────────────────────────────
function genderLabel(g: string) {
  return g === 'male' ? 'ذكر' : g === 'female' ? 'أنثى' : '—';
}

// ── Props ────────────────────────────────────────────────────
interface Props {
  form: EditForm;
  set:  <K extends keyof EditForm>(k: K, v: EditForm[K]) => void;
  userId: string;
}

export default function StepBasicsEdit({ form, set, userId }: Props) {
  const [locating, setLocating] = useState(false);

  const isMale = form.gender === 'male';

  const specialties = OCCUPATIONS.find(o => o.id === form.occupation_category_id)?.specialties ?? [];
  const cities      = form.country ? (COUNTRIES_CITIES[form.country] ?? []) : [];
  const educLabel   = EDUCATION_LEVELS.find(e => e.id === form.education_level)?.label ?? '';

  const handleAutoLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await getAutoLocation();

      // ✅ تحديث الحالة المحلية
      set('country',   loc.country);
      set('city',      loc.city);
      set('latitude',  loc.lat);
      set('longitude', loc.lon);

      // ✅ حفظ في DB فوراً (يشمل coords لـ PostGIS)
      await saveLocationToProfile(supabase, userId, loc);

    } catch { /* toast موجود في getAutoLocation */ }
    finally  { setLocating(false); }
  }, [locating, set, userId]);

  return (
    <div dir="rtl">

      {/* ── مقفولة ── */}
      <LockedField label="الاسم الكامل"  value={form.full_name} />
      <LockedField label="الجنس"          value={genderLabel(form.gender)} />
      <LockedField label="تاريخ الميلاد"  value={form.birth_date} />
      <LockedField label="الجنسية"        value={
        form.nationality
          ? (NATIONALITIES[form.nationality]?.[isMale ? 'male' : 'female'] ?? form.nationality)
          : '—'
      } />

      {/* ── الإقامة ── */}
      <Divider label="الإقامة" />

      {/* زر الموقع التلقائي */}
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleAutoLocation}
          disabled={locating}
          style={{
            width: '100%', padding: 'var(--sp-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-xsoft)',
            border: '1.5px solid var(--color-primary-soft)',
            color: 'var(--color-primary)', fontWeight: 700,
            fontSize: 'var(--text-sm)', fontFamily: 'inherit',
            cursor: locating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 'var(--sp-2)',
            opacity: locating ? 0.7 : 1,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {locating
            ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /><span>جارٍ التحديد...</span></>
            : <><MapPin size={16} /><span>تحديث موقعي تلقائياً</span></>
          }
        </motion.button>
        {(form.city || form.country) && (
          <p style={{
            fontSize: 'var(--text-2xs)', color: 'var(--color-primary)',
            marginTop: 'var(--sp-1)', textAlign: 'center', opacity: 0.7,
          }}>
            الموقع الحالي: {[form.city, form.country].filter(Boolean).join('، ')}
          </p>
        )}
      </div>

      <Sel
        label="بلد الإقامة"
        value={form.country}
        options={ALL_COUNTRIES}
        onChange={v => { set('country', v); set('city', ''); set('latitude', null); set('longitude', null); }}
      />

      {form.country && (
        <Sel
          label="المدينة"
          value={form.city}
          options={cities}
          onChange={v => set('city', v)}
          ph="اختر المدينة..."
        />
      )}

      {/* رقم الهاتف */}
      {form.country && (
        <div style={{ marginBottom: 24 }}>
          <Lbl t="رقم الهاتف (اختياري)" />
          <div dir="ltr" style={{
            display: 'flex', alignItems: 'center',
            borderBottom: '1.5px solid var(--input-line)',
          }}>
            <span style={{
              color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
              fontWeight: 700, padding: '11px 0', paddingRight: 10,
              flexShrink: 0, letterSpacing: '0.02em',
              borderRight: '1.5px solid var(--border-soft)', marginRight: 10,
            }}>
              {COUNTRY_DIAL[form.country] ?? ''}
            </span>
            <input
              type="tel" inputMode="numeric" dir="ltr"
              value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="XXXXXXXXX" maxLength={15}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                padding: 'var(--sp-3) 0', fontSize: 'var(--text-base)',
                fontWeight: 500, color: 'var(--text-main)',
                outline: 'none', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent', textAlign: 'left',
              }}
            />
          </div>
        </div>
      )}

      {/* ── الحالة المدنية ── */}
      <Divider label="الحالة المدنية" />
      <IdPills
        label=""
        items={MARITAL_STATUS}
        getLabel={s => isMale ? s.male : s.female}
        value={form.marital_status}
        onChange={id => set('marital_status', id)}
      />

      {/* ── التعليم والعمل ── */}
      <Divider label="التعليم والعمل" />
      <Sel
        label="المستوى الدراسي"
        value={educLabel}
        options={EDUCATION_LEVELS.map(e => e.label)}
        onChange={v => {
          const f = EDUCATION_LEVELS.find(e => e.label === v);
          set('education_level', f?.id ?? null);
        }}
        ph="اختر المستوى..."
      />
      <Sel
        label="المجال المهني"
        value={OCCUPATIONS.find(o => o.id === form.occupation_category_id)?.label ?? ''}
        options={OCCUPATIONS.filter(o => o.id !== 0).map(o => o.label)}
        onChange={v => {
          const cat = OCCUPATIONS.find(o => o.label === v);
          set('occupation_category_id', cat?.id ?? null);
          set('occupation_id', null);
        }}
      />
      {specialties.length > 0 && (
        <Sel
          label="الاختصاص"
          value={specialties.find(s => s.id === form.occupation_id)?.[isMale ? 'm' : 'f'] ?? ''}
          options={specialties.map(s => isMale ? s.m : s.f)}
          onChange={v => {
            const sp = specialties.find(s => (isMale ? s.m : s.f) === v);
            set('occupation_id', sp?.id ?? null);
          }}
        />
      )}
      <Pills
        label="الوضع المادي"
        options={FINANCIAL_STATUS}
        value={form.financial_status}
        onChange={v => set('financial_status', v as string)}
      />

      {/* ── الدين والجاهزية ── */}
      <Divider label="الدين والجاهزية" />
      <IdPills
        label="مستوى الالتزام الديني"
        items={RELIGIOUS_COMMITMENT}
        getLabel={r => isMale ? r.male : r.female}
        value={form.religious_commitment}
        onChange={id => set('religious_commitment', id)}
      />
      <IdPills
        label="جاهزية الزواج"
        items={MARRIAGE_READINESS}
        getLabel={r => isMale ? r.male : r.female}
        value={form.readiness_level}
        onChange={id => set('readiness_level', id)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
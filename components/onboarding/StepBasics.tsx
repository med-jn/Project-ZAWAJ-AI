'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';

import Field    from './shared/Field';
import DatePicker from './shared/DatePicker';
import Sel      from './shared/Sel';
import Pills    from './shared/Pills';
import IdPills  from './shared/IdPills';
import Divider  from './shared/Divider';
import { Lbl }  from './shared/Lbl';

import { OCCUPATIONS }                          from '@/constants/occupations';
import { COUNTRIES_CITIES, ALL_COUNTRIES, COUNTRY_DIAL } from '@/constants/countries';
import {
  MARITAL_STATUS, EDUCATION_LEVELS, NATIONALITIES,
  FINANCIAL_STATUS, RELIGIOUS_COMMITMENT, MARRIAGE_READINESS,
} from '@/constants/constants';
import { getAutoLocation } from '@/lib/services/locationService';

import type { FD } from './types';

interface Props {
  form: FD;
  errs: Partial<Record<keyof FD, string>>;
  set: <K extends keyof FD>(k: K, v: FD[K]) => void;
}

export default function StepBasics({ form, errs, set }: Props) {
  const [locating, setLocating] = useState(false);

  const isMale   = form.gender === 'male';
  const isFemale = form.gender === 'female';
  const hasG     = form.gender !== '';

  const specialties = OCCUPATIONS.find(o => o.id === form.occupation_category_id)?.specialties ?? [];
  const cities      = form.country ? (COUNTRIES_CITIES[form.country] ?? []) : [];
  const educLabel   = EDUCATION_LEVELS.find(e => e.id === form.education_level)?.label ?? '';

  const handleAutoLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await getAutoLocation();
      set('country', loc.country);
      set('city', loc.city);
      set('latitude' as any, loc.lat);
      set('longitude' as any, loc.lon);
    } catch { /* toast موجود في getAutoLocation */ }
    finally { setLocating(false); }
  };

  return (
    <div dir="rtl">
      {/* ── الاسم ── */}
      <Field
        label="الاسم الكامل"
        value={form.full_name}
        onChange={v => set('full_name', v)}
        placeholder="اكتب اسمك الكامل"
        error={errs.full_name}
        maxLength={20}
      />

      {/* ── الجنس ── */}
      <Divider label="الجنس" />
      <Pills
        label=""
        options={['ذكر', 'أنثى']}
        value={form.gender === 'male' ? 'ذكر' : form.gender === 'female' ? 'أنثى' : ''}
        onChange={v => {
          set('gender', v === 'ذكر' ? 'male' : 'female');
          set('marital_status', null);
          set('religious_commitment', null);
          set('readiness_level', null);
        }}
        error={errs.gender}
      />

      {/* ── تاريخ الميلاد — 3 selects بدل type=date ── */}
      <DatePicker
        label="تاريخ الميلاد"
        value={form.birth_date}
        onChange={v => set('birth_date', v)}
        error={errs.birth_date}
        minAge={18}
        maxAge={65}
      />

      {/* ── الحالة المدنية ── */}
      {hasG && (
        <IdPills
          label="الحالة المدنية"
          items={MARITAL_STATUS}
          getLabel={s => (isMale ? s.male : s.female)}
          value={form.marital_status}
          onChange={id => set('marital_status', id)}
          error={errs.marital_status}
        />
      )}

      {/* ── الأصل والإقامة ── */}
      <Divider label="الأصل والإقامة" />

      <Sel
        label="الجنسية"
        value={form.nationality
          ? (NATIONALITIES[form.nationality]?.[isMale ? 'male' : 'female'] ?? form.nationality)
          : ''}
        options={Object.keys(NATIONALITIES).map(k => NATIONALITIES[k]?.[isMale ? 'male' : 'female'] ?? k)}
        onChange={v => {
          const key = Object.keys(NATIONALITIES).find(k =>
            NATIONALITIES[k]?.male === v || NATIONALITIES[k]?.female === v
          ) ?? v;
          set('nationality', key);
        }}
        error={errs.nationality}
      />

      {/* زر تحديد الموقع */}
      <div style={{ marginBottom: 'var(--sp-4)' }}>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={handleAutoLocation}
          style={{
            width: '100%',
            padding: 'var(--sp-3)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary-xsoft)',
            border: '1.5px solid var(--color-primary-soft)',
            color: 'var(--color-primary)',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
            fontFamily: 'inherit',
            cursor: locating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 'var(--sp-2)',
            opacity: locating ? 0.7 : 1,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {locating
            ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /><span>جارٍ التحديد...</span></>
            : <><MapPin size={16} /><span>تحديد موقعي تلقائياً</span></>
          }
        </motion.button>
        <p style={{
          fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)',
          marginTop: 'var(--sp-1)', textAlign: 'center',
        }}>أو اختر يدوياً أدناه</p>
      </div>

      <Sel
        label="بلد الإقامة"
        value={form.country}
        options={ALL_COUNTRIES}
        onChange={v => { set('country', v); set('city', ''); set('latitude' as any, null); set('longitude' as any, null); }}
        error={errs.country}
      />

      {form.country && (
        <Sel
          label="المدينة"
          value={form.city}
          options={cities}
          onChange={v => set('city', v)}
          error={errs.city}
          ph="اختر المدينة..."
        />
      )}

      {/* رقم الهاتف */}
      {form.country && (
        <div style={{ marginBottom: 28 }}>
          <Lbl t="رقم الهاتف (اختياري ولا يظهر)" />
          <div dir="ltr" style={{
            display: 'flex', alignItems: 'center',
            borderBottom: '1.5px solid var(--input-line)',
          }}>
            <span style={{
              color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 700,
              padding: '11px 0', paddingRight: 10, flexShrink: 0,
              letterSpacing: '0.02em',
              borderRight: '1.5px solid var(--border-soft)', marginRight: 10,
            }}>
              {COUNTRY_DIAL[form.country] ?? ''}
            </span>
            <input
              type="tel"
              inputMode="numeric"
              dir="ltr"
              value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="XXXXXXXXX"
              maxLength={15}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                padding: 'var(--sp-3) 0', fontSize: 'var(--text-base)',
                fontWeight: 500, color: 'var(--text-main)',
                outline: 'none', fontFamily: 'inherit',
                WebkitTapHighlightColor: 'transparent',
                textAlign: 'left',
              }}
            />
          </div>
        </div>
      )}

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
        error={errs.education_level}
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
        error={errs.financial_status}
      />

      {/* ── الدين والجاهزية ── */}
      <Divider label="الدين والجاهزية" />

      {hasG && (
        <>
          <IdPills
            label="مستوى الالتزام الديني"
            items={RELIGIOUS_COMMITMENT}
            getLabel={r => (isMale ? r.male : r.female)}
            value={form.religious_commitment}
            onChange={id => set('religious_commitment', id)}
            error={errs.religious_commitment}
          />
          <IdPills
            label="جاهزية الزواج"
            items={MARRIAGE_READINESS}
            getLabel={r => (isMale ? r.male : r.female)}
            value={form.readiness_level}
            onChange={id => set('readiness_level', id)}
            error={errs.readiness_level}
          />
        </>
      )}
    </div>
  );
}
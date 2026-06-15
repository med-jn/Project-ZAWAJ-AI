'use client';
import Field   from './shared/Field';
import Sel     from './shared/Sel';
import Pills   from './shared/Pills';
import Divider from './shared/Divider';

import { HOUSING_STATUS } from '@/constants/constants';
import {
  QURAN_MEMORIZATION, BEARD_STYLE, PRAYER_COMMITMENT,
  HIJAB_STYLE, WORK_AFTER_MARRIAGE, POLYGAMY_ACCEPTANCE,
  PREFERRED_HOUSING, HEALTH_STATUS_OPTIONS, HEALTH_HABITS,
  SMOKING, SKIN_COLOR, TRAVEL_WILLINGNESS, DESIRE_FOR_CHILDREN,
  COMMITTED_LEVELS,
} from '@/constants/constants';

import type { FD } from './types';

interface Props {
  form: FD;
  errs: Partial<Record<keyof FD, string>>;
  set: <K extends keyof FD>(k: K, v: FD[K]) => void;
}

export default function StepComplement({ form, errs, set }: Props) {
  const isMale      = form.gender === 'male';
  const isFemale    = form.gender === 'female';
  const isDivorced  = form.marital_status === 12 || form.marital_status === 13;
  const isCommitted = form.religious_commitment !== null && COMMITTED_LEVELS.includes(form.religious_commitment);

  return (
    <div dir="rtl">

      {/* ── الأبناء (مطلق/أرمل فقط) ── */}
      {isDivorced && (
        <>
          <Divider label="الأبناء" />
          <Pills
            label="عدد الأبناء"
            options={['لا يوجد', '1', '2', '3', '4', '+4']}
            value={
              form.children_count === 0 ? 'لا يوجد'
              : form.children_count > 4 ? '+4'
              : `${form.children_count}`
            }
            onChange={v => {
              set('children_count', v === 'لا يوجد' ? 0 : v === '+4' ? 5 : parseInt(v as string));
              if (v === 'لا يوجد') set('children_custody', '');
            }}
          />
          {form.children_count > 0 && (
            <Pills
              label="الحضانة"
              options={['عندي', 'عند الوالد الآخر', 'مشتركة']}
              value={form.children_custody}
              onChange={v => set('children_custody', v as string)}
            />
          )}
        </>
      )}

      {/* ── الالتزام الديني ── */}
      {isCommitted && (
        <>
          <Divider label="الالتزام الديني" />
          <Sel
            label="حفظ القرآن الكريم"
            value={form.quran_memorization}
            options={QURAN_MEMORIZATION}
            onChange={v => set('quran_memorization', v)}
          />
          {isMale && (
            <>
              <Pills
                label="اللحية"
                options={BEARD_STYLE}
                value={form.beard_style}
                onChange={v => set('beard_style', v as string)}
              />
              <Sel
                label="الصلاة في المسجد"
                value={form.prayer_commitment}
                options={PRAYER_COMMITMENT}
                onChange={v => set('prayer_commitment', v)}
              />
            </>
          )}
          {isFemale && (
            <>
              <Pills
                label="اللباس"
                options={HIJAB_STYLE}
                value={form.hijab_style}
                onChange={v => set('hijab_style', v as string)}
              />
              <Pills
                label="العمل بعد الزواج"
                options={WORK_AFTER_MARRIAGE}
                value={form.work_after_marriage}
                onChange={v => set('work_after_marriage', v as string)}
              />
              <Pills
                label="قبول التعدد"
                options={POLYGAMY_ACCEPTANCE}
                value={form.polygamy_acceptance}
                onChange={v => set('polygamy_acceptance', v as string)}
              />
            </>
          )}
        </>
      )}

      {/* ── السكن ── */}
      <Divider label="السكن" />
      <div style={{ marginBottom: 24 }}>
        <p style={{
          fontSize: 'var(--text-2xs)', fontWeight: 800, letterSpacing: '0.22em',
          textTransform: 'uppercase', marginBottom: 'var(--sp-2)',
          color: errs.housing_type ? 'var(--error-text)' : 'var(--text-secondary)',
          opacity: errs.housing_type ? 1 : 0.6,
        }}>السكن الحالي</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HOUSING_STATUS.map(h => {
            const active = form.housing_type === h.id;
            return (
              <button
                key={h.id}
                type="button"
                onClick={() => set('housing_type', h.id)}
                style={{
                  padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: active ? 'var(--color-primary)' : 'rgba(0,0,0,0)',
                  outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                  color: active ? '#fff' : 'var(--text-secondary)',
                  fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400,
                  fontFamily: 'inherit',
                  boxShadow: active ? '0 4px 18px var(--shadow-red-glow)' : 'none',
                  WebkitTapHighlightColor: 'transparent',
                  transition: 'background 0.15s, color 0.15s',
                  transform: 'scale(1)',
                }}
                onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.93)')}
                onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
                onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >{h.label}</button>
            );
          })}
        </div>
        {errs.housing_type && (
          <p style={{ color: 'var(--error-text)', fontSize: 'var(--text-xs)', marginTop: 'var(--sp-1)' }}>
            {errs.housing_type}
          </p>
        )}
      </div>

      <Pills
        label="السكن بعد الزواج"
        options={PREFERRED_HOUSING}
        value={form.preferred_housing}
        onChange={v => set('preferred_housing', v as string)}
      />

      {/* ── الصحة ── */}
      <Divider label="الصحة" />
      <Sel
        label="الحالة الصحية"
        value={form.health_status}
        options={HEALTH_STATUS_OPTIONS}
        onChange={v => set('health_status', v)}
      />
      <Pills
        label="العادات الصحية"
        options={HEALTH_HABITS}
        value={form.health_habits}
        onChange={v => set('health_habits', v as string[])}
        multi
        max={3}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Field
          label="الطول (سم)"
          value={form.height}
          onChange={v => set('height', v)}
          placeholder="175"
          inputMode="numeric"
        />
        <Field
          label="الوزن (كغ)"
          value={form.weight}
          onChange={v => set('weight', v)}
          placeholder="70"
          inputMode="numeric"
        />
      </div>
      {isMale && (
        <Pills
          label="التدخين"
          options={SMOKING}
          value={form.smoking}
          onChange={v => set('smoking', v as string)}
        />
      )}

      {/* ── معلومات إضافية ── */}
      <Divider label="معلومات إضافية" />
      <Pills
        label="لون البشرة"
        options={SKIN_COLOR}
        value={form.skin_color}
        onChange={v => set('skin_color', v as string)}
      />
      <Pills
        label="القبول بالانتقال"
        options={TRAVEL_WILLINGNESS}
        value={form.travel_willingness}
        onChange={v => set('travel_willingness', v as string)}
      />
      <Sel
        label="الرغبة في الإنجاب"
        value={form.desire_for_children}
        options={DESIRE_FOR_CHILDREN}
        onChange={v => set('desire_for_children', v)}
      />
    </div>
  );
}
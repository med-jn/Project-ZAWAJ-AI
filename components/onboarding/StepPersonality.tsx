'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

import Sel     from './shared/Sel';
import Pills   from './shared/Pills';
import Divider from './shared/Divider';
import Field   from './shared/Field';
import { Lbl } from './shared/Lbl';

import {
  SOCIAL_TYPE, MORNING_EVENING, HOME_TIME, CONFLICT_STYLE,
  AFFECTION_STYLE, LIFE_PRIORITY, PARENTING_STYLE, RELATIONSHIP_WITH_FAMILY,
} from '@/constants/constants';

import type { FD } from './types';

interface Props {
  form: FD;
  errs: Partial<Record<keyof FD, string>>;
  set: <K extends keyof FD>(k: K, v: FD[K]) => void;
  intOpts: { id: string; label: string }[];
}

export default function StepPersonality({ form, errs, set, intOpts }: Props) {
  const [tag, setTag] = useState('');

  const addTag = () => {
    const t = tag.trim();
    if (t && form.interests.length < 5 && !form.interests.includes(t)) {
      set('interests', [...form.interests, t]);
      setTag('');
    }
  };

  return (
    <div dir="rtl">
      <p style={{
        fontSize: 'var(--text-sm)', color: 'var(--text-secondary)',
        opacity: 0.55, marginBottom: 'var(--sp-6)', lineHeight: 'var(--lh-relaxed)',
      }}>
        اختيارية — تزيد من دقة التوافق
      </p>

      <Pills label="الشخصية الاجتماعية" options={SOCIAL_TYPE}   value={form.social_type}   onChange={v => set('social_type', v as string)} />
      <Pills label="صباحي أم مسائي"       options={MORNING_EVENING} value={form.morning_evening} onChange={v => set('morning_evening', v as string)} />
      <Pills label="البيت أم الخروج"       options={HOME_TIME}    value={form.home_time}    onChange={v => set('home_time', v as string)} />
      <Sel   label="أسلوب حل الخلافات"   value={form.conflict_style}  options={CONFLICT_STYLE}  onChange={v => set('conflict_style', v)} />
      <Pills label="التعبير عن المشاعر"   options={AFFECTION_STYLE}  value={form.affection_style} onChange={v => set('affection_style', v as string)} />
      <Sel   label="أولويات الحياة"       value={form.life_priority}   options={LIFE_PRIORITY}   onChange={v => set('life_priority', v)} />
      <Pills label="أسلوب التربية"         options={PARENTING_STYLE}  value={form.parenting_style} onChange={v => set('parenting_style', v as string)} />
      <Pills label="العلاقة مع العائلة"   options={RELATIONSHIP_WITH_FAMILY} value={form.relationship_with_family} onChange={v => set('relationship_with_family', v as string)} />

      {/* ── الاهتمامات ── */}
      <Divider label="الاهتمامات" />
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', opacity: 0.45, marginBottom: 'var(--sp-3)' }}>
        حتى 5 اهتمامات
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {intOpts.map(opt => {
          const sel = form.interests.includes(opt.label);
          return (
            <motion.button
              key={opt.id}
              type="button"
              whileTap={{ scale: 0.93 }}
              disabled={!sel && form.interests.length >= 5}
              onClick={() => set('interests', sel
                ? form.interests.filter(x => x !== opt.label)
                : [...form.interests, opt.label]
              )}
              style={{
                padding: '8px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: sel ? 'var(--color-primary)' : 'rgba(179,51,75,0)',
                outline: `1.5px solid ${sel ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: sel ? '#fff' : 'var(--text-secondary)',
                fontSize: 'var(--text-sm)', fontWeight: sel ? 600 : 400,
                fontFamily: 'inherit',
                opacity: !sel && form.interests.length >= 5 ? 0.28 : 1,
                boxShadow: sel ? '0 4px 16px var(--shadow-red-glow)' : 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >{opt.label}</motion.button>
          );
        })}
      </div>

      {/* حقل إضافة اهتمام */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <input
          value={tag}
          onChange={e => setTag(e.target.value)}
          dir="rtl"
          placeholder="اهتمام آخر..."
          maxLength={20}
          onKeyDown={e => { if (e.key === 'Enter') addTag(); }}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: '1.5px solid var(--input-line)',
            padding: 'var(--sp-3) 0', fontSize: 'var(--text-base)',
            fontWeight: 500, color: 'var(--text-main)',
            caretColor: 'var(--color-primary)',
            outline: 'none', fontFamily: 'inherit',
            WebkitTapHighlightColor: 'transparent',
          }}
        />
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={addTag}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'var(--color-primary)',
            border: 'none', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Plus size={16} color="#fff" />
        </motion.button>
      </div>

      {/* ── نبذة ── */}
      <Divider label="نبذة" />

      <Field
        label="نبذة عنك (اختياري)"
        value={form.bio}
        onChange={v => set('bio', v)}
        placeholder="اكتب نبذة مختصرة..."
        maxLength={300}
        multiline
      />

      <Field
        label="مواصفات الشريك (اختياري)"
        value={form.partner_requirements}
        onChange={v => set('partner_requirements', v)}
        placeholder="ما الذي تبحث عنه..."
        maxLength={300}
        multiline
      />
    </div>
  );
}
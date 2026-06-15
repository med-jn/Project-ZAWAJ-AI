'use client';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import FilterAccordion from '../FilterAccordion';
import FilterLbl from '../FilterLbl';
import { IdMultiPills, MultiPills } from '../MultiPills';
import { EDUCATION_LEVELS, FINANCIAL_STATUS } from '@/constants/constants';
import { OCCUPATIONS } from '@/constants/occupations';
import type { DiscoveryFilters } from '../types';

type SetFn = <K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => void;

interface Props {
  f: DiscoveryFilters;
  set: SetFn;
  activeCount: number;
}

export default function SectionEducation({ f, set, activeCount }: Props) {
  return (
    <FilterAccordion
      icon={<BookOpen size={16} />}
      title="التعليم والعمل"
      activeCount={activeCount}
    >
      <div>
        <FilterLbl text="المستوى الدراسي" />
        <IdMultiPills
          items={EDUCATION_LEVELS}
          getLabel={e => e.label}
          selected={f.education_level}
          onChange={v => set('education_level', v)}
        />
      </div>

      <div>
        <FilterLbl text="المجال المهني" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {OCCUPATIONS.filter(o => o.id !== 0).map(o => {
            const active = f.occupation_cat.includes(o.id);
            return (
              <motion.button
                key={o.id} type="button" whileTap={{ scale: 0.92 }}
                onClick={() => set('occupation_cat',
                  active
                    ? f.occupation_cat.filter(x => x !== o.id)
                    : [...f.occupation_cat, o.id]
                )}
                style={{
                  padding: '7px 14px', borderRadius: 'var(--radius-full)',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 'var(--text-xs)', fontWeight: active ? 700 : 400,
                  background: active ? 'var(--color-primary)' : 'var(--glass-bg)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                  outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                  boxShadow: active ? '0 3px 12px var(--shadow-red-glow)' : 'none',
                  transition: 'all 0.15s ease',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >{o.label}</motion.button>
            );
          })}
        </div>
      </div>

      <div>
        <FilterLbl text="الوضع المادي" />
        <MultiPills
          options={FINANCIAL_STATUS}
          selected={f.financial_status}
          onChange={v => set('financial_status', v)}
        />
      </div>
    </FilterAccordion>
  );
}
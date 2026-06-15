'use client';
import { Calendar, MapPin } from 'lucide-react';
import FilterAccordion from '../FilterAccordion';
import FilterLbl from '../FilterLbl';
import DualRange from '../DualRange';
import { IdMultiPills } from '../MultiPills';
import { MARITAL_STATUS } from '@/constants/constants';
import { COUNTRIES_CITIES } from '@/constants/countries';
import type { DiscoveryFilters } from '../types';

// ✅ الضمائر: الجنس المعروض = عكس جنس الباحث
// ذكر يبحث عن أنثى → female, أنثى تبحث عن ذكر → male
type SetFn = <K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => void;

interface Props {
  f: DiscoveryFilters;
  set: SetFn;
  activeCount: number;
  targetGender: 'male' | 'female'; // جنس المبحوث عنه
}

const selectStyle: React.CSSProperties = {
  width: '100%', padding: 'var(--sp-3) var(--sp-4)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--glass-border)',
  color: 'var(--text-main)', fontSize: 'var(--text-sm)',
  fontFamily: 'inherit', outline: 'none',
  appearance: 'none', cursor: 'pointer',
  direction: 'rtl',
};

export default function SectionBasics({ f, set, activeCount, targetGender }: Props) {
  const countries = Object.keys(COUNTRIES_CITIES);
  const cities    = f.country ? (COUNTRIES_CITIES[f.country] ?? []) : [];

  return (
    <FilterAccordion
      icon={<Calendar size={16} />}
      title="الأساسيات والموقع"
      activeCount={activeCount}
      defaultOpen
    >
      {/* العمر */}
      <div>
        <FilterLbl text="نطاق العمر" />
        <DualRange
          min={18} max={80}
          valueMin={f.ageMin} valueMax={f.ageMax}
          onChangeMin={v => set('ageMin', v)}
          onChangeMax={v => set('ageMax', v)}
          unit="سنة"
        />
      </div>

      {/* بلد الإقامة */}
      <div>
        <FilterLbl text="بلد الإقامة" />
        <div style={{ position: 'relative' }}>
          <select
            dir="rtl" value={f.country}
            onChange={e => { set('country', e.target.value); set('city', ''); }}
            style={selectStyle}
          >
            <option value="">— كل الدول —</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <MapPin size={13} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-primary)', opacity: 0.6,
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* المدينة */}
      {f.country && (
        <div>
          <FilterLbl text="المدينة" />
          <select
            dir="rtl" value={f.city}
            onChange={e => set('city', e.target.value)}
            style={selectStyle}
          >
            <option value="">— كل المدن —</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* الجنسية */}
      <div>
        <FilterLbl text="الجنسية" />
        <select
          dir="rtl" value={f.nationality}
          onChange={e => set('nationality', e.target.value)}
          style={selectStyle}
        >
          <option value="">— كل الجنسيات —</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* الحالة المدنية — بضمائر جنس المبحوث عنه */}
      <div>
        <FilterLbl text="الحالة المدنية" />
        <IdMultiPills
          items={MARITAL_STATUS}
          getLabel={s => targetGender === 'female' ? s.female : s.male}
          selected={f.marital_status}
          onChange={v => set('marital_status', v)}
        />
      </div>
    </FilterAccordion>
  );
}
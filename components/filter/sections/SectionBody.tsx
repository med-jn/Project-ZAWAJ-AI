'use client';
import { Activity } from 'lucide-react';
import FilterAccordion from '../FilterAccordion';
import FilterLbl from '../FilterLbl';
import DualRange from '../DualRange';
import { MultiPills } from '../MultiPills';
import { SKIN_COLOR, SMOKING } from '@/constants/constants';
import type { DiscoveryFilters } from '../types';

type SetFn = <K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => void;

interface Props {
  f: DiscoveryFilters;
  set: SetFn;
  activeCount: number;
  targetGender: 'male' | 'female';
}

export default function SectionBody({ f, set, activeCount, targetGender }: Props) {
  // التدخين يظهر فقط إن كان المبحوث عنه ذكراً
  const showSmoking = targetGender === 'male';

  return (
    <FilterAccordion
      icon={<Activity size={16} />}
      title="الجسم والمظهر"
      activeCount={activeCount}
    >
      <div>
        <FilterLbl text="الطول" />
        <DualRange
          min={140} max={210}
          valueMin={f.heightMin} valueMax={f.heightMax}
          onChangeMin={v => set('heightMin', v)}
          onChangeMax={v => set('heightMax', v)}
          unit="سم"
        />
      </div>

      <div>
        <FilterLbl text="الوزن" />
        <DualRange
          min={40} max={150}
          valueMin={f.weightMin} valueMax={f.weightMax}
          onChangeMin={v => set('weightMin', v)}
          onChangeMax={v => set('weightMax', v)}
          unit="كغ"
        />
      </div>

      <div>
        <FilterLbl text="لون البشرة" />
        <MultiPills
          options={SKIN_COLOR}
          selected={f.skin_color}
          onChange={v => set('skin_color', v)}
        />
      </div>

      {showSmoking && (
        <div>
          <FilterLbl text="التدخين" />
          <MultiPills
            options={SMOKING}
            selected={f.smoking}
            onChange={v => set('smoking', v)}
          />
        </div>
      )}
    </FilterAccordion>
  );
}
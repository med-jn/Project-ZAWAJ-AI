'use client';
import { Home } from 'lucide-react';
import FilterAccordion from '../FilterAccordion';
import FilterLbl from '../FilterLbl';
import { MultiPills, IdMultiPills } from '../MultiPills';
import {
  HOUSING_STATUS, PREFERRED_HOUSING, TRAVEL_WILLINGNESS,
  DESIRE_FOR_CHILDREN, HEALTH_STATUS_OPTIONS,
} from '@/constants/constants';
import type { DiscoveryFilters } from '../types';

type SetFn = <K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => void;

interface Props {
  f: DiscoveryFilters;
  set: SetFn;
  activeCount: number;
}

export default function SectionLife({ f, set, activeCount }: Props) {
  return (
    <FilterAccordion
      icon={<Home size={16} />}
      title="الحياة والصحة"
      activeCount={activeCount}
    >
      <div>
        <FilterLbl text="السكن الحالي" />
        <IdMultiPills
          items={HOUSING_STATUS}
          getLabel={h => h.label}
          selected={f.housing_type}
          onChange={v => set('housing_type', v)}
        />
      </div>

      <div>
        <FilterLbl text="السكن بعد الزواج" />
        <MultiPills
          options={PREFERRED_HOUSING}
          selected={f.preferred_housing}
          onChange={v => set('preferred_housing', v)}
        />
      </div>

      <div>
        <FilterLbl text="القبول بالانتقال" />
        <MultiPills
          options={TRAVEL_WILLINGNESS}
          selected={f.travel_willingness}
          onChange={v => set('travel_willingness', v)}
        />
      </div>

      <div>
        <FilterLbl text="الرغبة في الإنجاب" />
        <MultiPills
          options={DESIRE_FOR_CHILDREN}
          selected={f.desire_for_children}
          onChange={v => set('desire_for_children', v)}
        />
      </div>

      <div>
        <FilterLbl text="الحالة الصحية" />
        <MultiPills
          options={HEALTH_STATUS_OPTIONS}
          selected={f.health_status}
          onChange={v => set('health_status', v)}
        />
      </div>
    </FilterAccordion>
  );
}
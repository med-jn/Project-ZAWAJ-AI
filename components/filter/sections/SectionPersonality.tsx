'use client';
import { Smile } from 'lucide-react';
import FilterAccordion from '../FilterAccordion';
import FilterLbl from '../FilterLbl';
import { MultiPills } from '../MultiPills';
import {
  SOCIAL_TYPE, MORNING_EVENING, CONFLICT_STYLE,
  AFFECTION_STYLE, LIFE_PRIORITY, PARENTING_STYLE,
  RELATIONSHIP_WITH_FAMILY,
} from '@/constants/constants';
import type { DiscoveryFilters } from '../types';

type SetFn = <K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => void;

interface Props {
  f: DiscoveryFilters;
  set: SetFn;
  activeCount: number;
}

export default function SectionPersonality({ f, set, activeCount }: Props) {
  return (
    <FilterAccordion
      icon={<Smile size={16} />}
      title="الشخصية والطبع"
      activeCount={activeCount}
    >
      <div>
        <FilterLbl text="الشخصية الاجتماعية" />
        <MultiPills options={SOCIAL_TYPE} selected={f.social_type}
          onChange={v => set('social_type', v)} />
      </div>
      <div>
        <FilterLbl text="صباحي أم مسائي" />
        <MultiPills options={MORNING_EVENING} selected={f.morning_evening}
          onChange={v => set('morning_evening', v)} />
      </div>
      <div>
        <FilterLbl text="أسلوب حل الخلافات" />
        <MultiPills options={CONFLICT_STYLE} selected={f.conflict_style}
          onChange={v => set('conflict_style', v)} />
      </div>
      <div>
        <FilterLbl text="التعبير عن المشاعر" />
        <MultiPills options={AFFECTION_STYLE} selected={f.affection_style}
          onChange={v => set('affection_style', v)} />
      </div>
      <div>
        <FilterLbl text="أولويات الحياة" />
        <MultiPills options={LIFE_PRIORITY} selected={f.life_priority}
          onChange={v => set('life_priority', v)} />
      </div>
      <div>
        <FilterLbl text="أسلوب التربية" />
        <MultiPills options={PARENTING_STYLE} selected={f.parenting_style}
          onChange={v => set('parenting_style', v)} />
      </div>
      <div>
        <FilterLbl text="العلاقة مع العائلة" />
        <MultiPills options={RELATIONSHIP_WITH_FAMILY} selected={f.relationship_with_family}
          onChange={v => set('relationship_with_family', v)} />
      </div>
    </FilterAccordion>
  );
}
'use client';
import { Moon } from 'lucide-react';
import FilterAccordion from '../FilterAccordion';
import FilterLbl from '../FilterLbl';
import { MultiPills, IdMultiPills } from '../MultiPills';
import {
  RELIGIOUS_COMMITMENT, MARRIAGE_READINESS,
  QURAN_MEMORIZATION, BEARD_STYLE, PRAYER_COMMITMENT,
  HIJAB_STYLE, POLYGAMY_ACCEPTANCE, WORK_AFTER_MARRIAGE,
} from '@/constants/constants';
import type { DiscoveryFilters } from '../types';

type SetFn = <K extends keyof DiscoveryFilters>(k: K, v: DiscoveryFilters[K]) => void;

interface Props {
  f: DiscoveryFilters;
  set: SetFn;
  activeCount: number;
  targetGender: 'male' | 'female'; // جنس المبحوث عنه
}

export default function SectionReligion({ f, set, activeCount, targetGender }: Props) {
  const isMale = targetGender === 'male';

  return (
    <FilterAccordion
      icon={<Moon size={16} />}
      title="الدين والالتزام"
      activeCount={activeCount}
    >
      {/* الالتزام — بضمائر المبحوث عنه */}
      <div>
        <FilterLbl text="مستوى الالتزام" />
        <IdMultiPills
          items={RELIGIOUS_COMMITMENT}
          getLabel={r => isMale ? r.male : r.female}
          selected={f.religious_commitment}
          onChange={v => set('religious_commitment', v)}
        />
      </div>

      {/* الجاهزية */}
      <div>
        <FilterLbl text="جاهزية الزواج" />
        <IdMultiPills
          items={MARRIAGE_READINESS}
          getLabel={r => isMale ? r.male : r.female}
          selected={f.readiness_level}
          onChange={v => set('readiness_level', v)}
        />
      </div>

      {/* حفظ القرآن */}
      <div>
        <FilterLbl text="حفظ القرآن" />
        <MultiPills
          options={QURAN_MEMORIZATION}
          selected={f.quran_memorization}
          onChange={v => set('quran_memorization', v)}
        />
      </div>

      {/* ── فلاتر خاصة بالمبحوث عنه ذكر ── */}
      {isMale && (
        <>
          <div>
            <FilterLbl text="اللحية" />
            <MultiPills
              options={BEARD_STYLE}
              selected={f.beard_style}
              onChange={v => set('beard_style', v)}
            />
          </div>
          <div>
            <FilterLbl text="الصلاة في المسجد" />
            <MultiPills
              options={PRAYER_COMMITMENT}
              selected={f.prayer_commitment}
              onChange={v => set('prayer_commitment', v)}
            />
          </div>
        </>
      )}

      {/* ── فلاتر خاصة بالمبحوث عنها أنثى ── */}
      {!isMale && (
        <>
          <div>
            <FilterLbl text="اللباس (الحجاب)" />
            <MultiPills
              options={HIJAB_STYLE}
              selected={f.hijab_style}
              onChange={v => set('hijab_style', v)}
            />
          </div>
          <div>
            <FilterLbl text="قبول التعدد" />
            <MultiPills
              options={POLYGAMY_ACCEPTANCE}
              selected={f.polygamy_acceptance}
              onChange={v => set('polygamy_acceptance', v)}
            />
          </div>
          <div>
            <FilterLbl text="العمل بعد الزواج" />
            <MultiPills
              options={WORK_AFTER_MARRIAGE}
              selected={f.work_after_marriage}
              onChange={v => set('work_after_marriage', v)}
            />
          </div>
        </>
      )}
    </FilterAccordion>
  );
}
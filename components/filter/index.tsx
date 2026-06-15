'use client';
/**
 * components/filter/index.tsx
 * المكوّن الرئيسي للفلتر — يحمل الحالة والمنطق
 * الأقسام مقسّمة على: SectionBasics / SectionLocation / SectionBody /
 *                       SectionEducation / SectionReligion / SectionLife / SectionPersonality
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SlidersHorizontal, X, Check, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

import SectionBasics      from './sections/SectionBasics';
import SectionLocation    from './sections/SectionLocation';
import SectionBody        from './sections/SectionBody';
import SectionEducation   from './sections/SectionEducation';
import SectionReligion    from './sections/SectionReligion';
import SectionLife        from './sections/SectionLife';
import SectionPersonality from './sections/SectionPersonality';

import {
  type DiscoveryFilters,
  DEFAULT_FILTERS,
  loadFilters,
  saveFilters,
  clearFilters,
  filtersAreActive,
  sectionCounts,
} from './types';

export default function FilterPage() {
  const router = useRouter();
  const [f, setF]               = useState<DiscoveryFilters>(() => loadFilters());
  const [userGender, setUserGender] = useState<'male' | 'female' | null>(null);

  // جنس المبحوث عنه = عكس جنس المستخدم
  const targetGender: 'male' | 'female' =
    userGender === 'male' ? 'female' : 'male';

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', data.user.id)
        .single();
      if (p?.gender) setUserGender(p.gender as 'male' | 'female');
    });
  }, []);

  const set = useCallback(<K extends keyof DiscoveryFilters>(
    k: K, v: DiscoveryFilters[K],
  ) => {
    setF(prev => ({ ...prev, [k]: v }));
  }, []);

  const active = filtersAreActive(f);
  const cnt    = sectionCounts(f);

  const apply = () => { saveFilters(f); router.back(); };
  const reset = () => { clearFilters(); setF({ ...DEFAULT_FILTERS }); };

  return (
    <div dir="rtl" style={{
      minHeight: '100dvh',
      background: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ══ Header ══ */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--sp-4)',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--bg-surface)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* إغلاق */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-full)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-secondary)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <X size={16} strokeWidth={2} />
        </motion.button>

        {/* العنوان */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          <SlidersHorizontal size={16} color="var(--color-primary)" strokeWidth={2} />
          <span style={{
            color: 'var(--text-main)', fontWeight: 800,
            fontSize: 'var(--text-base)',
          }}>حدد المواصفات</span>
          {active && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--color-primary)',
              boxShadow: '0 0 6px var(--shadow-red-glow)',
            }} />
          )}
        </div>

        {/* تصفير */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={reset}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 'var(--text-xs)', fontWeight: 700,
            color: active ? 'var(--color-primary)' : 'var(--text-tertiary)',
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'inherit',
            opacity: active ? 1 : 0.4,
            padding: 'var(--sp-1) var(--sp-2)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <RotateCcw size={13} strokeWidth={2.5} /> تصفير
        </motion.button>
      </div>

      {/* ══ المحتوى ══ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--sp-4)' }}>

        <SectionBasics
          f={f} set={set}
          activeCount={cnt.basics}
          targetGender={targetGender}
        />

        <SectionLocation
          f={f} set={set}
          activeCount={cnt.location}
        />

        <SectionBody
          f={f} set={set}
          activeCount={cnt.body}
          targetGender={targetGender}
        />

        <SectionEducation
          f={f} set={set}
          activeCount={cnt.education}
        />

        <SectionReligion
          f={f} set={set}
          activeCount={cnt.religion}
          targetGender={targetGender}
        />

        <SectionLife
          f={f} set={set}
          activeCount={cnt.life}
        />

        <SectionPersonality
          f={f} set={set}
          activeCount={cnt.personality}
        />

        <div style={{ height: 100 }} />
      </div>

      {/* ══ Footer ══ */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 10,
        padding: 'var(--sp-4)',
        paddingBottom: 'calc(var(--sp-4) + env(safe-area-inset-bottom))',
        borderTop: '1px solid var(--glass-border)',
        background: 'var(--bg-surface)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        display: 'flex', gap: 'var(--sp-3)',
      }}>
        <button
          onClick={() => router.back()}
          style={{
            flex: 1, height: 'var(--btn-h)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)', fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >إلغاء</button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={apply}
          style={{
            flex: 2, height: 'var(--btn-h)',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #800020, var(--color-primary))',
            boxShadow: '0 6px 20px var(--shadow-red-glow)',
            border: 'none', color: '#fff',
            fontSize: 'var(--text-sm)', fontWeight: 900,
            fontFamily: 'inherit', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 'var(--sp-2)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Check size={16} strokeWidth={2.5} />
          تطبيق الفلاتر
        </motion.button>
      </div>
    </div>
  );
}
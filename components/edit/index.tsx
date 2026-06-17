'use client';
/**
 * components/edit/index.tsx — ZAWAJ AI
 * صفحة تعديل الملف الشخصي
 * ✅ يعيد استخدام StepComplement و StepPersonality من onboarding
 * ✅ حقول مقفولة (الاسم، الجنس، الميلاد، الجنسية)
 * ✅ زر الموقع الجغرافي مع تحديث coords
 * ✅ فحص Gemini للنصوص قبل الحفظ
 * ✅ بدون صورة في هذه الصفحة (تُغيَّر من صفحة الملف)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence }           from 'framer-motion';
import { ChevronLeft, Check, ArrowLeft }     from 'lucide-react';
import { toast }                             from 'sonner';
import { useRouter }                         from 'next/navigation';

import { supabase }      from '@/lib/supabase/client';
import { moderateText }  from '@/lib/moderate';
import { COUNTRY_DIAL }  from '@/constants/countries';
import { COMMITTED_LEVELS } from '@/constants/constants';

// ── مكوّنات الخطوات ───────────────────────────────────────
import StepBasicsEdit   from '@/components/edit/StepBasicsEdit';
import StepPrivacy      from '@/components/edit/StepPrivacy';

// ✅ نعيد استخدام هذين مباشرة من onboarding
import StepComplement   from '@/components/onboarding/StepComplement';
import StepPersonality  from '@/components/onboarding/StepPersonality';

import { type EditForm, fromProfile } from '@/components/edit/types';

// ─────────────────────────────────────────────────────────────
const STEPS = ['الأساسيات', 'التكميل', 'الشخصية', 'الخصوصية'];
const TITLES = ['البيانات الأساسية', 'البيانات التكميلية', 'الطبع والشخصية', 'الخصوصية'];
const SUBS   = [
  'بيانات الإقامة والمهنة والدين',
  'معلومات تزيد دقة النتائج',
  'اختيارية — تحسّن التوافق',
  'إعدادات رؤية صورتك',
];

// ─────────────────────────────────────────────────────────────
export default function EditPage() {
  const router = useRouter();

  const [step,     setStep]     = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [form,     setForm]     = useState<EditForm | null>(null);
  const [profile,  setProfile]  = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [userId,   setUserId]   = useState('');
  const [intOpts,  setIntOpts]  = useState<{ id: string; label: string }[]>([]);

  // ── تحميل البيانات ──────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: p } = await supabase
        .from('profiles').select('*').eq('id', user.id).single();
      if (!p) return;

      setProfile(p);
      setForm(fromProfile(p));
    };
    load();

    supabase.from('interests_options').select('id,label').eq('is_active', true)
      .then(({ data }) => { if (data) setIntOpts(data); });
  }, [router]);

  // ── set helper ──────────────────────────────────────────
  const set = useCallback(<K extends keyof EditForm>(k: K, v: EditForm[K]) => {
    setForm(prev => prev ? { ...prev, [k]: v } : prev);
  }, []);

  // ── adapter لـ StepComplement و StepPersonality ──────────
  // هذان المكوّنان يتوقعان نوع FD من onboarding/types
  // نصنع adapter بسيطاً يحوّل EditForm ← FD-like
  const formAsFD = form ? {
    ...form,
    gender:       form.gender as any,
    avatar_url:   profile?.avatar_url ?? '',
    birth_date:   form.birth_date,
    latitude:     form.latitude,
    longitude:    form.longitude,
  } : null;

  const setAsFD = useCallback(<K extends string>(k: K, v: any) => {
    set(k as keyof EditForm, v);
  }, [set]);

  // ── التنقل ──────────────────────────────────────────────
  const goNext = () => {
    setSlideDir(1);
    setStep(s => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const goBack = () => {
    if (step === 0) { router.back(); return; }
    setSlideDir(-1);
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  // ── حفظ مع فحص Gemini ────────────────────────────────
  const save = async () => {
    if (!form || !userId) return;
    setSaving(true);

    const toastId = toast.loading('🔍 جارٍ فحص المحتوى...', { duration: Infinity });

    try {
      // فحص النصوص
      const textParts = [
        form.bio?.trim()                  && `النبذة: ${form.bio}`,
        form.partner_requirements?.trim() && `المواصفات: ${form.partner_requirements}`,
      ].filter(Boolean) as string[];

      if (textParts.length > 0) {
        toast.loading('📝 فحص النصوص...', { id: toastId, duration: Infinity });
        const result = await moderateText(userId, textParts.join('\n'));
        if (!result.valid) {
          toast.error(result.reason || 'المحتوى يخالف معايير المنصة', {
            id: toastId, duration: 5000,
            description: 'يرجى مراجعة النبذة أو مواصفات الشريك.',
          });
          setSaving(false);
          return;
        }
      }

      toast.loading('💾 جارٍ الحفظ...', { id: toastId, duration: Infinity });

      const payload: Record<string, unknown> = {
        // الإقامة
        country:   form.country,
        city:      form.city,
        phone:     form.phone
          ? `${COUNTRY_DIAL[form.country] ?? ''}${form.phone}`
          : '',
        ...(form.latitude  ? { latitude:  form.latitude  } : {}),
        ...(form.longitude ? { longitude: form.longitude } : {}),
        // coords يُحدَّث مباشرة عبر saveLocationToProfile في StepBasicsEdit

        // الحالة المدنية والدين
        marital_status:         form.marital_status,
        education_level:        form.education_level,
        occupation_category_id: form.occupation_category_id,
        occupation_id:          form.occupation_id,
        financial_status:       form.financial_status,
        religious_commitment:   form.religious_commitment,
        readiness_level:        form.readiness_level,

        // الأبناء
        children_count:   form.children_count,
        children_custody: form.children_custody,

        // الدين
        quran_memorization:  form.quran_memorization,
        beard_style:         form.beard_style,
        prayer_commitment:   form.prayer_commitment,
        hijab_style:         form.hijab_style,
        work_after_marriage: form.work_after_marriage,
        polygamy_acceptance: form.polygamy_acceptance,

        // السكن
        housing_type:     form.housing_type,
        preferred_housing: form.preferred_housing,

        // الصحة
        health_status: form.health_status,
        health_habits: form.health_habits,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        smoking: form.smoking,

        // إضافية
        skin_color:         form.skin_color,
        travel_willingness: form.travel_willingness,
        desire_for_children: form.desire_for_children,

        // الشخصية
        social_type:              form.social_type,
        morning_evening:          form.morning_evening,
        home_time:                form.home_time,
        conflict_style:           form.conflict_style,
        affection_style:          form.affection_style,
        life_priority:            form.life_priority,
        parenting_style:          form.parenting_style,
        relationship_with_family: form.relationship_with_family,

        // الاهتمامات والنبذة
        interests:            form.interests,
        bio:                  form.bio,
        partner_requirements: form.partner_requirements,

        // الخصوصية
        is_photos_blurred: form.is_photos_blurred,
        show_photos:       form.show_photos,

        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles').update(payload).eq('id', userId);
      if (error) throw error;

      toast.success('تم حفظ التعديلات ✅', {
        id: toastId, duration: 2500,
        description: 'سيتم توجيهك إلى ملفك الشخصي.',
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); router.back(); }, 1400);

    } catch (e: any) {
      toast.error('حدث خطأ أثناء الحفظ', {
        id: toastId, duration: 4000,
        description: e.message ?? 'تحقق من اتصالك وحاول مجدداً.',
      });
    } finally {
      setSaving(false);
    }
  };

  // ── تحميل ────────────────────────────────────────────
  if (!form) return (
    <div style={{
      height: '60vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '2.5px solid var(--color-primary)',
          borderTopColor: 'transparent',
        }}
      />
    </div>
  );

  // ── محتوى الخطوات ─────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <StepBasicsEdit
            form={form}
            set={set}
            userId={userId}
          />
        );
      case 1:
        return formAsFD ? (
          <StepComplement
            form={formAsFD as any}
            errs={{}}
            set={setAsFD as any}
          />
        ) : null;
      case 2:
        return formAsFD ? (
          <StepPersonality
            form={formAsFD as any}
            errs={{}}
            set={setAsFD as any}
            intOpts={intOpts}
          />
        ) : null;
      case 3:
        return (
          <StepPrivacy
            form={form}
            set={set}
            avatarUrl={profile?.avatar_url}
          />
        );
    }
  };

  // ── Render ────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', background: 'var(--bg-main)',
    }}>

      {/* ══ StickySubHeader ══ */}
      <div style={{
        position: 'sticky', top: 'var(--header-h-safe)', zIndex: 900,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0 var(--sp-4) var(--sp-2)',
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.13 }}
            style={{
              display: 'flex', alignItems: 'baseline',
              gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)',
              paddingTop: 'var(--sp-3)',
            }}
          >
            <span style={{
              fontSize: 'var(--text-md)', fontWeight: 900,
              color: 'var(--text-main)',
            }}>{TITLES[step]}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {step + 1}/{STEPS.length}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* شريط التقدم */}
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                background: i <= step ? 'var(--color-primary)' : 'var(--border-soft)',
                opacity: i <= step ? 1 : 0.4,
              }}
              transition={{ duration: 0.35 }}
              style={{ flex: 1, height: 4, borderRadius: 'var(--radius-full)' }}
            />
          ))}
        </div>
      </div>

      {/* ══ المحتوى ══ */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ x: slideDir * 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDir * -32, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ padding: 'var(--sp-4) var(--sp-4) 9rem' }}
          >
            {/* وصف الخطوة */}
            <motion.p
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.06, duration: 0.22 }}
              style={{
                fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-5)',
                color: 'var(--text-secondary)', opacity: 0.6,
                lineHeight: 'var(--lh-relaxed)', direction: 'rtl',
              }}
            >{SUBS[step]}</motion.p>

            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══ أزرار التنقل ══ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: 'var(--sp-4) var(--sp-5) var(--sp-8)',
        background: 'linear-gradient(to top, var(--bg-main) 55%, transparent)',
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>

          {/* زر الرجوع */}
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={goBack}
            style={{
              height: 'var(--btn-h-lg)', width: 'var(--btn-h-lg)',
              borderRadius: 'var(--radius-lg)', flexShrink: 0,
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-blur)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ArrowLeft size={20} />
          </motion.button>

          {/* التالي / حفظ */}
          {step < 3 ? (
            <motion.button
              className="btn-premium"
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              style={{
                flex: 1, height: 'var(--btn-h-lg)',
                fontSize: 'var(--text-base)', fontWeight: 800,
                boxShadow: '0 6px 24px var(--shadow-red-glow)',
              }}
            >
              <span>التالي</span>
              <ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={save}
              disabled={saving}
              style={{
                flex: 1, height: 'var(--btn-h-lg)',
                borderRadius: 'var(--radius-lg)', border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 'var(--sp-2)',
                color: '#fff', fontSize: 'var(--text-base)', fontWeight: 800,
                background: saved
                  ? '#22c55e'
                  : saving
                  ? 'rgba(179,51,75,0.45)'
                  : 'var(--color-primary)',
                fontFamily: 'inherit',
                boxShadow: saved || saving ? 'none' : '0 6px 24px var(--shadow-red-glow)',
                transition: 'background 0.3s',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: '2.5px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff',
                  }}
                />
              ) : saved ? (
                <><Check size={18} /><span>تم الحفظ ✓</span></>
              ) : (
                <><Check size={18} /><span>حفظ التعديلات</span></>
              )}
            </motion.button>
          )}

        </div>
      </div>
    </div>
  );
}
'use client';
/**
 * components/onboarding/index.tsx
 * المكوّن الرئيسي — يحمل الحالة والمنطق فقط
 * الواجهة مقسّمة على: StepBasics / StepComplement / StepPersonality / StepFinish
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, ArrowLeft } from 'lucide-react';

import { supabase }                          from '@/lib/supabase/client';
import { useRouter }                         from 'next/navigation';
import { toast }                             from 'sonner';
import { moderateText, moderateImage }       from '@/lib/moderate';
import { COUNTRY_DIAL }                      from '@/constants/countries';
import { COMMITTED_LEVELS }                  from '@/constants/constants';

import StepBasics      from './StepBasics';
import StepComplement  from './StepComplement';
import StepPersonality from './StepPersonality';
import StepFinish      from './StepFinish';
import CropModal       from './CropModal';

import { type FD, INIT } from './types';

// ─────────────────────────────────────────────
//  ضغط الصورة ≤ 200KB
// ─────────────────────────────────────────────
async function compressToMax(canvas: HTMLCanvasElement, maxKB = 200): Promise<Blob> {
  const maxBytes = maxKB * 1024;
  let quality = 0.85;
  let blob: Blob | null = null;
  while (quality >= 0.20) {
    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', quality));
    if (!blob || blob.size <= maxBytes) break;
    quality -= 0.08;
  }
  return blob ?? (await new Promise(res => canvas.toBlob(res, 'image/webp', 0.20)) as Blob);
}

// اقتصاص + ضغط
async function cropAndCompress(
  src: string,
  cropX: number, cropY: number,
  cropSize: number,
  outputSize = 600,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onerror = () => reject(new Error('فشل تحميل الصورة'));
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width  = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);
        const blob = await compressToMax(canvas, 200);
        resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }));
      } catch (e) { reject(e); }
    };
  });
}

// ─────────────────────────────────────────────
const DRAFT = 'zawaj_v10';
const STEPS = ['الأساسيات', 'التكميل', 'الشخصية', 'الإرسال'];
const TITLES = ['البيانات الأساسية', 'البيانات التكميلية', 'الطبع والشخصية', 'الصورة والتأكيد'];
const SUBS   = ['أخبرنا عن نفسك', 'معلومات تزيد دقة النتائج', 'اختيارية — تحسّن التوافق', 'الخطوة الأخيرة'];

interface AgreementState {
  terms: boolean;
  privacy: boolean;
  honesty: boolean;
}

// ─────────────────────────────────────────────
export default function OnboardingForm() {
  const router = useRouter();

  const [step,      setStep]      = useState(0);
  const [slideDir,  setSlideDir]  = useState<1 | -1>(1);
  const [form,      setForm]      = useState<FD>(INIT);
  const [errs,      setErrs]      = useState<Partial<Record<keyof FD, string>>>({});
  const [saving,    setSaving]    = useState(false);
  const [intOpts,   setIntOpts]   = useState<{ id: string; label: string }[]>([]);
  const [userId,    setUserId]    = useState('');

  // صورة
  const [imgFile,       setImgFile]       = useState<File | null>(null);
  const [imgPreview,    setImgPreview]    = useState('');
  const [cropSrc,       setCropSrc]       = useState('');
  const [validatingImg, setValidatingImg] = useState(false);

  // الموافقات الثلاث
  const [agreements, setAgreements] = useState<AgreementState>({
    terms: false, privacy: false, honesty: false,
  });
  const [agreementsError, setAgreementsError] = useState('');

  // ── تحميل المسودة ───────────────────────
  useEffect(() => {
    try {
      const r = localStorage.getItem(DRAFT);
      if (r) { const p = JSON.parse(r); setStep(p.s ?? 0); setForm(p.f ?? INIT); }
    } catch { /* تجاهل */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(DRAFT, JSON.stringify({ s: step, f: form })); } catch { /* تجاهل */ }
  }, [step, form]);

  // ── جلب الاهتمامات ──────────────────────
  useEffect(() => {
    supabase.from('interests_options').select('id,label').eq('is_active', true)
      .then(({ data }) => { if (data) setIntOpts(data); });
  }, []);

  // ── userId ──────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  // cleanup ObjectURL عند unmount أو تغيير الصورة
  useEffect(() => {
    return () => {
      if (imgPreview && imgPreview.startsWith('blob:')) URL.revokeObjectURL(imgPreview);
    };
  }, [imgPreview]);

  // ── set helper ──────────────────────────
  const set = useCallback(<K extends keyof FD>(k: K, v: FD[K]) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrs(p => ({ ...p, [k]: '' }));
  }, []);

  // ── اختيار صورة ────────────────────────
  const handleFileSelect = (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    // cleanup URL السابق
    if (cropSrc && cropSrc.startsWith('blob:')) URL.revokeObjectURL(cropSrc);
    setCropSrc(objectUrl);
    setErrs(p => ({ ...p, avatar_url: '' }));
  };

  // ── تأكيد الـ crop ───────────────────────
  const handleCropConfirm = async (cropX: number, cropY: number, cropSize: number) => {
    setValidatingImg(true);
    try {
      const file = await cropAndCompress(cropSrc, cropX, cropY, cropSize, 600);
      const b64  = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res((reader.result as string).split(',')[1]);
        reader.onerror = () => rej(new Error('فشل قراءة الصورة'));
        reader.readAsDataURL(file);
      });

      const check = await moderateImage(userId || 'anonymous', b64, 'image/webp');
      if (!check.valid) {
        toast.error(check.reason || 'الصورة لا تلبي معايير المنصة');
        URL.revokeObjectURL(cropSrc);
        setCropSrc('');
        return;
      }

      // cleanup السابق
      if (imgPreview && imgPreview.startsWith('blob:')) URL.revokeObjectURL(imgPreview);

      setImgFile(file);
      setImgPreview(URL.createObjectURL(file));
      URL.revokeObjectURL(cropSrc);
      setCropSrc('');
      toast.success('تم قبول الصورة ✅');
    } catch (e: any) {
      toast.error(e?.message || 'حدث خطأ في معالجة الصورة');
      URL.revokeObjectURL(cropSrc);
      setCropSrc('');
    } finally {
      setValidatingImg(false);
    }
  };

  // ── التحقق ──────────────────────────────
  const validate = (): boolean => {
    const e: Partial<Record<keyof FD, string>> = {};

    if (step === 0) {
      const n = form.full_name.trim();
      if (!n) e.full_name = 'الاسم مطلوب';
      else if (!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(n)) e.full_name = 'حروف عربية أو إنجليزية فقط';
      else if (n.replace(/\s+/g, '').length < 4)      e.full_name = 'لا يقل عن 4 حروف';
      else if (n.replace(/\s+/g, '').length > 14)     e.full_name = 'لا يزيد عن 14 حرفاً';

      if (!form.gender)                    e.gender = 'مطلوب';
      if (!form.birth_date)                e.birth_date = 'مطلوب';
      else {
        const age = new Date().getFullYear() - new Date(form.birth_date).getFullYear();
        if (age < 18) e.birth_date = '18 سنة على الأقل';
        if (age > 65) e.birth_date = 'الحد الأقصى 65 سنة';
      }
      if (form.marital_status === null)       e.marital_status = 'مطلوب';
      if (!form.nationality)                  e.nationality = 'مطلوب';
      if (!form.country)                      e.country = 'مطلوب';
      if (!form.city)                         e.city = 'مطلوب';
      if (form.education_level === null)      e.education_level = 'مطلوب';
      if (!form.financial_status)             e.financial_status = 'مطلوب';
      if (form.religious_commitment === null) e.religious_commitment = 'مطلوب';
      if (form.readiness_level === null)      e.readiness_level = 'مطلوب';
    }

    if (step === 1 && form.housing_type === null) e.housing_type = 'مطلوب';

    if (step === 3) {
      if (!imgFile && !form.avatar_url) e.avatar_url = 'الصورة مطلوبة';
      if (!agreements.terms || !agreements.privacy || !agreements.honesty) {
        setAgreementsError('يجب الموافقة على جميع البنود الثلاثة للمتابعة');
      } else {
        setAgreementsError('');
      }
    }

    setErrs(e);
    const hasFieldErrors = Object.keys(e).length > 0;
    const hasAgreementErrors = step === 3 && (!agreements.terms || !agreements.privacy || !agreements.honesty);
    return !hasFieldErrors && !hasAgreementErrors;
  };

  // ── التنقل ──────────────────────────────
  const goNext = () => {
    if (!validate()) return;
    setSlideDir(1);
    setStep(s => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const goBack = () => {
    setSlideDir(-1);
    setStep(s => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  // ── الإرسال ─────────────────────────────
  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('غير مسجّل');

      // فحص النصوص
      const textToCheck = [
        form.full_name          && `الاسم: ${form.full_name}`,
        form.bio                && `النبذة: ${form.bio}`,
        form.partner_requirements && `المواصفات: ${form.partner_requirements}`,
      ].filter(Boolean).join('\n');

      if (textToCheck) {
        const aiCheck = await moderateText(user.id, textToCheck);
        if (!aiCheck.valid) {
          toast.error(aiCheck.reason || 'المحتوى يخالف معايير المنصة');
          setSaving(false);
          return;
        }
      }

      // حساب العمر
      let age: number | null = null;
      if (form.birth_date) {
        const born  = new Date(form.birth_date);
        const today = new Date();
        age = today.getFullYear() - born.getFullYear();
        if (
          today.getMonth() < born.getMonth() ||
          (today.getMonth() === born.getMonth() && today.getDate() < born.getDate())
        ) age--;
      }

      // رفع الصورة
      let avatar_url_update: string | undefined;
      if (imgFile) {
        try {
          const path = `${user.id}_avatar.webp`;
          const { error: upErr } = await supabase.storage
            .from('Avatars').upload(path, imgFile, { upsert: true, cacheControl: '3600' });
          if (!upErr) {
            avatar_url_update = supabase.storage.from('Avatars').getPublicUrl(path).data.publicUrl;
          } else {
            toast.error('تعذّر رفع الصورة، سيتم الحفظ بدونها');
          }
        } catch {
          toast.error('خطأ في رفع الصورة');
        }
      }

      // payload
      const payload: Record<string, unknown> = {
        full_name: form.full_name, gender: form.gender, birth_date: form.birth_date,
        marital_status: form.marital_status, nationality: form.nationality,
        country: form.country, city: form.city,
        education_level: form.education_level,
        occupation_category_id: form.occupation_category_id,
        occupation_id: form.occupation_id,
        financial_status: form.financial_status,
        religious_commitment: form.religious_commitment,
        readiness_level: form.readiness_level,
        children_count: form.children_count, children_custody: form.children_custody,
        quran_memorization: form.quran_memorization, beard_style: form.beard_style,
        prayer_commitment: form.prayer_commitment, hijab_style: form.hijab_style,
        work_after_marriage: form.work_after_marriage, polygamy_acceptance: form.polygamy_acceptance,
        housing_type: form.housing_type, preferred_housing: form.preferred_housing,
        health_status: form.health_status, health_habits: form.health_habits,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
        smoking: form.smoking, skin_color: form.skin_color,
        travel_willingness: form.travel_willingness, desire_for_children: form.desire_for_children,
        social_type: form.social_type, morning_evening: form.morning_evening,
        home_time: form.home_time, conflict_style: form.conflict_style,
        affection_style: form.affection_style, life_priority: form.life_priority,
        parenting_style: form.parenting_style, relationship_with_family: form.relationship_with_family,
        interests: form.interests, bio: form.bio, partner_requirements: form.partner_requirements,
        is_photos_blurred: form.is_photos_blurred, show_photos: form.show_photos,
        phone: form.phone ? `${COUNTRY_DIAL[form.country] ?? ''}${form.phone}` : '',
        ...(avatar_url_update ? { avatar_url: avatar_url_update } : {}),
        age,
        is_completed: true,
        updated_at: new Date().toISOString(),
        ...(form.latitude  ? { latitude:  form.latitude  } : {}),
        ...(form.longitude ? { longitude: form.longitude } : {}),
      };

      const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
      if (error) throw error;

      localStorage.removeItem(DRAFT);
      router.replace('/home');

    } catch (err: any) {
      console.error('submit error:', err);
      toast.error(err.message ?? 'حدث خطأ، حاول مجدداً');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  //  الواجهة
  // ─────────────────────────────────────────────
  return (
    <div
      className="bg-luxury-gradient"
      style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}
    >

      {/* ══ StickySubHeader — شريط الخطوات ══ */}
      <div style={{
        position: 'sticky',
        top: 'var(--header-h-safe)',
        zIndex: 900,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0 var(--sp-4) var(--sp-2)',
      }}>
        {/* عنوان الخطوة */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.13 }}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)',
              marginBottom: 'var(--sp-2)', paddingTop: 'var(--sp-3)',
            }}
          >
            <span style={{ fontSize: 'var(--text-md)', fontWeight: 900, color: 'var(--text-main)' }}>
              {TITLES[step]}
            </span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
              {step + 1}/{STEPS.length}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* الشريط الرباعي */}
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                background: i <= step ? 'var(--color-primary)' : 'var(--border-soft)',
                opacity: i < step ? 1 : i === step ? 1 : 0.4,
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
            {/* وصف المرحلة */}
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

            {step === 0 && <StepBasics     form={form} errs={errs} set={set} />}
            {step === 1 && <StepComplement form={form} errs={errs} set={set} />}
            {step === 2 && <StepPersonality form={form} errs={errs} set={set} intOpts={intOpts} />}
            {step === 3 && (
              <StepFinish
                form={form} errs={errs} set={set}
                imgPreview={imgPreview}
                agreements={agreements}
                onAgreementChange={(key, val) => {
                  setAgreements(prev => ({ ...prev, [key]: val }));
                  setAgreementsError('');
                }}
                onFileSelect={handleFileSelect}
                agreementsError={agreementsError}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ══ CropModal ══ */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(''); }}
          validating={validatingImg}
        />
      )}

      {/* ══ أزرار التنقل الثابتة ══ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: 'var(--sp-4) var(--sp-5) var(--sp-8)',
        background: 'linear-gradient(to top, var(--bg-main) 55%, transparent)',
        backdropFilter: 'blur(4px)',
      }}>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>

          {/* زر الرجوع للخطوة السابقة — يظهر من الخطوة 2 فما فوق */}
          {step > 0 && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={goBack}
              style={{
                height: 'var(--btn-h-lg)',
                width: 'var(--btn-h-lg)',
                borderRadius: 'var(--radius-lg)',
                flexShrink: 0,
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <ArrowLeft size={20} />
            </motion.button>
          )}

          {/* التالي / إرسال */}
          <motion.button
            className="btn-premium"
            whileTap={{ scale: 0.97 }}
            onClick={step === 3 ? submit : goNext}
            disabled={saving}
            style={{
              flex: 1,
              height: 'var(--btn-h-lg)',
              fontSize: 'var(--text-base)',
              fontWeight: 800,
              letterSpacing: '0.01em',
              opacity: saving ? 0.6 : 1,
              boxShadow: saving ? 'none' : '0 6px 24px var(--shadow-red-glow)',
            }}
          >
            {saving ? (
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2.5px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : step === 3 ? (
              <><Check size={18} /><span>إرسال وابدأ</span></>
            ) : (
              <><span>التالي</span><ChevronLeft size={18} /></>
            )}
          </motion.button>

          {/* تخطي — الخطوة 2 فقط */}
          {step === 2 && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={goNext}
              style={{
                height: 'var(--btn-h-lg)',
                padding: '0 var(--sp-5)',
                borderRadius: 'var(--radius-lg)',
                flexShrink: 0,
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >تخطي</motion.button>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        :root { --error-text: #FF6B6B; }
        html.light { --error-text: #C0392B; }
      `}</style>
    </div>
  );
}
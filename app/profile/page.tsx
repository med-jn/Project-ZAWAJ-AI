'use client';
/**
 * 📁 app/profile/page.tsx — ZAWAJ AI
 * ✅ صورة رئيسية + سكرول مثل UserCard
 * ✅ شريط اكتمال حقيقي + شارات الحقول الناقصة
 * ✅ تعديل بأسلوب OnboardingForm (Sel / Pills / IdPills)
 * ✅ عرض ملف شخص آخر عبر sessionStorage
 * ✅ إحصائيات likes + views + رصيد
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3, Save, X, ChevronDown, Check, Camera, Crown, Eye, Heart,
  MapPin, GraduationCap, Briefcase, Star, Baby, Moon, Home, Users,
  BookOpen, ShieldCheck, Smile, Ruler, Activity, Flame, Globe,
  HandHeart, Church,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { AutoBadge } from '@/components/auto-badge';
import { useWallet } from '@/hooks/useWallet';
import {
  MARITAL_STATUS, EDUCATION_LEVELS, RELIGIOUS_COMMITMENT, COMMITTED_LEVELS,
  FINANCIAL_STATUS, MARRIAGE_READINESS, QURAN_MEMORIZATION, BEARD_STYLE,
  PRAYER_COMMITMENT, HIJAB_STYLE, POLYGAMY_ACCEPTANCE, WORK_AFTER_MARRIAGE,
  HEALTH_STATUS_OPTIONS, SMOKING, SKIN_COLOR, TRAVEL_WILLINGNESS,
  DESIRE_FOR_CHILDREN, SOCIAL_TYPE, MORNING_EVENING, HOME_TIME,
  CONFLICT_STYLE, AFFECTION_STYLE, LIFE_PRIORITY, PARENTING_STYLE,
  RELATIONSHIP_WITH_FAMILY, NATIONALITIES,
  getMaritalLabel, getEducationLabel, getReligiousLabel,
  READINESS_LEVEL_NOW,
} from '@/constants/constants';
import { OCCUPATIONS, getSpecialtyLabel } from '@/constants/occupations';
import { COUNTRIES_CITIES, ALL_COUNTRIES, COUNTRY_DIAL } from '@/constants/countries';

const NAV = 62;

// ─────────────────────────────────────────
//  CSS ثوابت
// ─────────────────────────────────────────
const LINE: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1.5px solid var(--input-line)',
  padding: '11px 0', fontSize: 15, fontWeight: 500,
  color: 'var(--text-main)', caretColor: 'var(--color-primary)',
  outline: 'none', fontFamily: 'inherit',
  WebkitTapHighlightColor: 'transparent',
};

const CARD: React.CSSProperties = {
  marginBottom: 10, borderRadius: 20, overflow: 'hidden',
  background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
};

// ─────────────────────────────────────────
//  مكوّن: تسمية القسم
// ─────────────────────────────────────────
function Lbl({ t }: { t: string }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
      textTransform: 'uppercase', marginBottom: 8,
      color: 'var(--text-tertiary)', opacity: 0.7,
    }}>
      {t}
    </p>
  );
}

// ─────────────────────────────────────────
//  مكوّن: رأس البلوك
// ─────────────────────────────────────────
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'البيانات الأساسية':  <MapPin size={11}/>,
  'المهنة والتعليم':    <Briefcase size={11}/>,
  'الدين والالتزام':    <BookOpen size={11}/>,
  'الأطفال':            <Baby size={11}/>,
  'الصحة والعادات':     <Activity size={11}/>,
  'الزواج':             <Heart size={11}/>,
  'الطبع والشخصية':     <Smile size={11}/>,
  'النبذة والمتطلبات':  <Users size={11}/>,
  'نبذة شخصية':         <Smile size={11}/>,
  'يبحث عن':            <Heart size={11}/>,
  'الصورة الشخصية':     <Camera size={11}/>,
};

function CardHeader({ title }: { title: string }) {
  const icon = SECTION_ICONS[title];
  return (
    <div style={{
      padding: '11px 16px 9px', borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', gap: 6, direction: 'rtl',
    }}>
      {icon && (
        <span style={{ color: 'var(--color-primary)', opacity: 0.6, display: 'flex' }}>
          {icon}
        </span>
      )}
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.22em',
        textTransform: 'uppercase', color: 'var(--text-tertiary)', opacity: 0.7,
      }}>
        {title}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────
//  مكوّن: حقل نصي
// ─────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', inputMode, rows }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; inputMode?: 'text' | 'numeric' | 'decimal'; rows?: number;
}) {
  const [focused, setFocused] = useState(false);

  if (rows) {
    return (
      <div style={{ marginBottom: 20 }}>
        <Lbl t={label} />
        <textarea
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            ...LINE, resize: 'none', borderBottom: 'none',
            border: '1px solid var(--border-medium)', borderRadius: 12,
            padding: 12, fontSize: 14,
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20, position: 'relative' }}>
      <Lbl t={label} />
      <div style={{ position: 'relative' }}>
        <input
          type={type} value={value} dir="auto" inputMode={inputMode}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...LINE, borderBottomColor: focused ? 'var(--color-primary)' : 'var(--input-line)' }}
        />
        <motion.div
          animate={{ scaleX: focused ? 1 : 0 }}
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: 2, background: 'var(--color-primary)',
            borderRadius: 2, transformOrigin: 'left', pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  مكوّن: Select — dropdown
// ─────────────────────────────────────────
function Sel({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ marginBottom: 20, position: 'relative' }}>
      <Lbl t={label} />
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          ...LINE,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottomColor: open ? 'var(--color-primary)' : 'var(--input-line)',
        }}
      >
        <span style={{ color: value ? 'var(--text-main)' : 'var(--text-tertiary)', fontSize: 15 }}>
          {value || 'اختر...'}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={15} style={{ color: 'var(--color-primary)', opacity: 0.7 }} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.92 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.92 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', zIndex: 1000, width: '100%',
              top: 'calc(100% + 4px)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              maxHeight: 220, overflowY: 'auto',
              transformOrigin: 'top',
            }}
          >
            {options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange(opt); setOpen(false); }}
                style={{
                  width: '100%', textAlign: 'right', direction: 'rtl',
                  padding: '12px 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: value === opt ? 'var(--color-primary-soft)' : 'transparent',
                  borderBottom: i < options.length - 1 ? '1px solid var(--border-soft)' : 'none',
                  color: value === opt ? 'var(--color-primary)' : 'var(--text-main)',
                  fontSize: 14, fontWeight: value === opt ? 600 : 400,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                <span>{opt}</span>
                {value === opt && <Check size={13} style={{ color: 'var(--color-primary)' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────
//  مكوّن: IdPills — ثوابت {id,..}[]
// ─────────────────────────────────────────
function IdPills<T extends { id: number }>({
  label, items, getLabel, value, onChange,
}: {
  label: string; items: T[]; getLabel: (item: T) => string;
  value: number | null; onChange: (id: number) => void;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Lbl t={label} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map(item => {
          const active = value === item.id;
          return (
            <motion.button
              key={item.id} type="button" whileTap={{ scale: 0.93 }}
              onClick={() => onChange(item.id)}
              style={{
                padding: '8px 18px', borderRadius: 999,
                border: 'none', cursor: 'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                fontFamily: 'inherit',
                boxShadow: active ? '0 4px 16px var(--shadow-red-glow)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {getLabel(item)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  مكوّن: Pills — string[]
// ─────────────────────────────────────────
function Pills({
  label, options, value, onChange, multi = false, max,
}: {
  label: string; options: string[];
  value: string | string[]; onChange: (v: string | string[]) => void;
  multi?: boolean; max?: number;
}) {
  const isSelected = (o: string) =>
    multi ? (value as string[]).includes(o) : value === o;

  const handleTap = (o: string) => {
    if (!multi) { onChange(o); return; }
    const arr = value as string[];
    if (arr.includes(o)) { onChange(arr.filter(x => x !== o)); return; }
    if (!max || arr.length < max) onChange([...arr, o]);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      {label && <Lbl t={label} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => {
          const active = isSelected(o);
          return (
            <motion.button
              key={o} type="button" whileTap={{ scale: 0.93 }}
              onClick={() => handleTap(o)}
              style={{
                padding: '8px 18px', borderRadius: 999,
                border: 'none', cursor: 'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: active ? 600 : 400,
                fontFamily: 'inherit',
                boxShadow: active ? '0 4px 16px var(--shadow-red-glow)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {o}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  مكوّن: SectionBlock — للعرض
// ─────────────────────────────────────────
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const kids = Array.isArray(children)
    ? (children as React.ReactNode[]).flat().filter(Boolean)
    : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <div style={CARD}>
      <CardHeader title={title} />
      <div style={{ padding: '0px 14px 6px' }}>{kids}</div>
    </div>
  );
}

// ─────────────────────────────────────────
//  مكوّن: Row — صف بيانات مع أيقونة
// ─────────────────────────────────────────
function Row({ label, value, icon }: {
  label: string; value?: string | number | null;
  icon?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 0', borderBottom: '1px solid var(--glass-border)',
      direction: 'rtl',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon && (
          <span style={{ color: 'var(--color-primary)', opacity: 0.75, display: 'flex', flexShrink: 0 }}>
            {icon}
          </span>
        )}
        <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{label}</span>
      </div>
      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 13, textAlign: 'left', maxWidth: '58%', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ═════════════════════════════════════════
//  الصفحة
// ═════════════════════════════════════════
export default function ProfilePage() {
  const router    = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { totalBalance } = useWallet();

  const [profile,   setProfile]   = useState<any>(null);
  const [isOwn,     setIsOwn]     = useState(true);
  const [loading,   setLoading]   = useState(true);
  const [scrolled,  setScrolled]  = useState(false);
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState<any>({});
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stats,     setStats]     = useState({ likes: 0, views: 0 });

  // تحميل البيانات
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const otherId   = typeof window !== 'undefined' ? sessionStorage.getItem('view_profile_id') : null;
      const targetId  = otherId ?? user.id;
      setIsOwn(targetId === user.id);
      if (otherId) sessionStorage.removeItem('view_profile_id');

      const { data } = await supabase.from('profiles').select('*').eq('id', targetId).single();
      setProfile(data);
      setForm(data ?? {});

      const [{ count: likes }, { count: views }] = await Promise.all([
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('to_user', targetId).eq('action', 'like'),
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('to_user', targetId).eq('action', 'view'),
      ]);
      setStats({ likes: likes ?? 0, views: views ?? 0 });
      setLoading(false);
    };
    load();
  }, [router]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) setScrolled(el.scrollTop > 50);
  };

  // ضغط الصورة قبل الرفع
  const compressImg = (file: File): Promise<File> =>
    new Promise(resolve => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob =>
          resolve(new File([blob!], 'avatar.webp', { type: 'image/webp' }))
        , 'image/webp', 0.82);
      };
    });

  // رفع الصورة
  const uploadAvatar = useCallback(async (file: File) => {
    if (!profile?.id) return;
    setUploading(true);
    try {
      const compressed = await compressImg(file);
      const path = `${profile.id}_avatar.webp`;
      const { error: upErr } = await supabase.storage
        .from('Avatars').upload(path, compressed, { upsert: true, cacheControl: '3600' });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('Avatars').getPublicUrl(path);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      setForm((prev: any) => ({ ...prev, avatar_url: publicUrl }));
    } catch (e) { console.error('[uploadAvatar]', e); }
    setUploading(false);
  }, [profile]);

  // حفظ التعديلات
  const save = useCallback(async () => {
    if (!profile?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', profile.id);
    if (!error) { setProfile(form); setEditing(false); }
    else console.error('[profile] save:', error.message);
    setSaving(false);
  }, [profile, form]);

  const upd = (field: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [field]: value }));

  // Loading
  if (loading || !profile) {
    return (
      <div style={{ background: 'var(--bg-main)', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid var(--color-accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  // مشتقات
  const p         = editing ? form : profile;
  const isMale    = p.gender === 'male';
  const committed = COMMITTED_LEVELS.includes(p.religious_commitment ?? -1);
  const mainPhoto = p.avatar_url ?? '/default-avatar.png';
  const loc       = [p.country, p.city].filter(Boolean).join(' — ');
  const hw        = [p.height ? `${p.height} سم` : null, p.weight ? `${p.weight} كغ` : null].filter(Boolean).join(' · ');
  const cities    = p.country ? (COUNTRIES_CITIES[p.country] ?? []) : [];
  const catOccs   = p.occupation_category_id
    ? (OCCUPATIONS.find((c: any) => c.id === p.occupation_category_id)?.specialties ?? [])
    : [];

  // حساب الاكتمال الحقيقي
  const REQUIRED: Record<string, string> = {
    full_name: 'الاسم', gender: 'الجنس', birth_date: 'تاريخ الميلاد',
    marital_status: 'الحالة المدنية', country: 'الدولة', city: 'المدينة',
    education_level: 'التعليم', occupation_id: 'المهنة',
    religious_commitment: 'الالتزام الديني', readiness_level: 'جاهزية الزواج',
    avatar_url: 'صورة الملف', financial_status: 'الوضع المادي', nationality: 'الجنسية',
  };
  const OPTIONAL = [
    'height', 'weight', 'skin_color', 'health_status', 'social_type',
    'morning_evening', 'home_time', 'conflict_style', 'affection_style',
    'life_priority', 'parenting_style', 'bio', 'partner_requirements',
    isMale ? 'beard_style' : 'hijab_style',
    isMale ? 'prayer_commitment' : 'polygamy_acceptance',
    'quran_memorization', 'travel_willingness', 'desire_for_children',
  ];

  const reqKeys  = Object.keys(REQUIRED);
  const reqDone  = reqKeys.filter(f => { const v = p[f]; return v !== null && v !== undefined && v !== '' && v !== 0; }).length;
  const optDone  = OPTIONAL.filter(f => { const v = p[f]; return v !== null && v !== undefined && v !== ''; }).length;
  const pct      = Math.min(100, Math.round((reqDone / reqKeys.length) * 70 + (optDone / OPTIONAL.length) * 30));
  const pctColor = pct >= 80 ? '#22c55e' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-accent)';
  const pctLabel = pct >= 80 ? 'ملف مكتمل ✅' : pct >= 50 ? 'يحتاج إكمال' : 'ملف منقوص';
  const missing  = reqKeys
    .filter(f => { const v = p[f]; return !v || v === '' || v === 0; })
    .map(f => REQUIRED[f]);

  // ──────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, paddingBottom: NAV, background: 'var(--bg-main)' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { display: none; }
      `}</style>

      {/* خلفية الصورة */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src={mainPhoto}
          alt={p.full_name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            filter: p.is_photos_blurred ? 'blur(24px)' : 'none',
            transform: p.is_photos_blurred ? 'scale(1.08)' : 'none',
          }}
        />
        <motion.div
          animate={{ opacity: scrolled ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to top, var(--bg-main) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
          }}
        />
        <motion.div
          animate={{ opacity: scrolled ? 0.92 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ position: 'absolute', inset: 0, background: 'var(--bg-main)', pointerEvents: 'none' }}
        />
      </div>

      {/* زر تعديل الصورة — overlay مباشرة على الصورة */}
      {isOwn && !scrolled && (
        <label style={{
          position: 'absolute', bottom: NAV + 96, right: 20,
          zIndex: 50, cursor: 'pointer',
        }}>
          <input
            type="file" accept="image/*"
            style={{ display: 'none' }}
            onChange={async e => {
              const f = e.target.files?.[0];
              if (f) uploadAvatar(f);
              e.target.value = '';
            }}
          />
          <motion.div
            whileTap={{ scale: 0.9 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '8px 14px', borderRadius: 20,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(14px)',
              border: '1.5px solid rgba(255,255,255,0.22)',
            }}
          >
            {uploading ? (
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Camera size={14} color="#fff" />
            )}
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
              {uploading ? 'جارٍ الرفع...' : 'تعديل الصورة'}
            </span>
          </motion.div>
        </label>
      )}

      {/* أزرار التعديل — أسفل TopBar مباشرة */}
      <div style={{ position: 'absolute', top: 58, left: 16, zIndex: 50, display: 'flex', gap: 8 }}>
        {isOwn && (
          editing ? (
            <>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={save}
                disabled={saving}
                style={{
                  padding: '8px 16px', borderRadius: 20,
                  background: 'var(--color-primary)', color: '#fff',
                  fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
                }}
              >
                {saving ? (
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <><Save size={13} /><span>حفظ</span></>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { setForm(profile); setEditing(false); }}
                style={{
                  padding: '8px 12px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)',
                  color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                }}
              >
                <X size={14} />
              </motion.button>
            </>
          ) : (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setEditing(true)}
              style={{
                padding: '8px 16px', borderRadius: 20,
                background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)',
                color: '#fff', fontWeight: 700, fontSize: 13,
                border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit',
              }}
            >
              <Edit3 size={13} /><span>تعديل</span>
            </motion.button>
          )
        )}
      </div>

      {/* الاسم + العمر + المدينة */}
      <motion.div
        animate={{ opacity: scrolled ? 0 : 1, y: scrolled ? 10 : 0 }}
        style={{ position: 'absolute', left: 20, right: 20, zIndex: 10, bottom: NAV + 90, pointerEvents: 'none' }}
        dir="rtl"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <h2 style={{
            color: '#fff', fontWeight: 900, lineHeight: 1.2, margin: 0,
            fontSize: 'calc(var(--base-font-size) * 1.7)',
            textShadow: '0 2px 20px rgba(0,0,0,0.7)',
          }}>
            {p.full_name}
          </h2>
          <AutoBadge value={totalBalance} isBroker={p.role === 'mediator'} size="text-[10px]" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          {!!p.age && (
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14, textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
              {p.age} سنة
            </span>
          )}
          {!!p.city && (
            <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 13, textShadow: '0 1px 8px rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} style={{ opacity: 0.85, flexShrink: 0 }} />
              {p.city}{p.country ? ` · ${p.country}` : ''}
            </span>
          )}
        </div>
      </motion.div>

      {/* اللوحة المنزلقة */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{ position: 'absolute', inset: 0, overflowY: 'scroll', scrollbarWidth: 'none', paddingTop: '52vh' }}
      >
        <div style={{ borderRadius: '32px 32px 0 0', overflow: 'hidden', minHeight: '50vh' }}>

          {/* مقبض */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <motion.div
              animate={{ background: scrolled ? 'var(--glass-border)' : 'rgba(255,255,255,0.3)' }}
              style={{ width: 36, height: 3, borderRadius: 99 }}
            />
          </div>

          {/* Sticky header */}
          <AnimatePresence>
            {scrolled && (
              <motion.div
                key="sticky-header"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{
                  position: 'sticky', top: 0, zIndex: 20,
                  padding: '12px 20px',
                  background: 'var(--bg-surface)',
                  borderBottom: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(30px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
                dir="rtl"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 16 }}>
                    {p.full_name}
                  </span>
                  {!!p.age && (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>{p.age}</span>
                  )}
                  <AutoBadge value={totalBalance} isBroker={p.role === 'mediator'} size="text-[9px]" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 56, height: 3, borderRadius: 99, overflow: 'hidden', background: 'var(--glass-border)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pctColor }} />
                  </div>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{pct}%</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* المحتوى */}
          <AnimatePresence>
            {scrolled && (
              <motion.div
                key="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ padding: '12px 16px', paddingBottom: NAV + 24 }}
              >

                {/* بطاقة الرصيد */}
                {isOwn && (
                  <div style={{ marginBottom: 10, borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.3)' }}>
                    <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} dir="rtl">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(212,175,55,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Crown size={18} style={{ color: 'var(--color-gold)' }} />
                        </div>
                        <div>
                          <p style={{ color: 'var(--text-tertiary)', fontSize: 11, margin: 0 }}>رصيدك</p>
                          <p style={{ color: 'var(--color-gold)', fontWeight: 900, fontSize: 20, margin: 0 }}>
                            {totalBalance}
                            <span style={{ fontSize: 12, fontWeight: 500 }}> نقطة</span>
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.94 }}
                        onClick={() => router.push('/subscriptions')}
                        style={{ padding: '8px 16px', borderRadius: 14, background: 'var(--color-gold)', color: '#000', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        الباقات ✨
                      </motion.button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
                      {([
                        { label: 'أعجبوا بك',  value: stats.likes, Icon: Heart },
                        { label: 'زاروا ملفك', value: stats.views, Icon: Eye   },
                      ] as const).map(s => (
                        <div key={s.label} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }} dir="rtl">
                          <s.Icon size={14} style={{ color: 'var(--color-gold)', opacity: 0.7 }} />
                          <div>
                            <p style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 18, margin: 0 }}>{s.value}</p>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: 11, margin: 0 }}>{s.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* شريط الاكتمال الحقيقي */}
                <div style={{ marginBottom: 10, borderRadius: 20, padding: '16px', background: 'var(--glass-bg)', border: `1px solid ${pct >= 80 ? 'rgba(34,197,94,0.3)' : 'var(--glass-border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }} dir="rtl">
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>اكتمال الملف</span>
                      {isOwn && (
                        <span style={{ color: pctColor, fontSize: 11, fontWeight: 700, marginRight: 6 }}>
                          {' '}{pctLabel}
                        </span>
                      )}
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 17, color: pctColor }}>{pct}%</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 99, overflow: 'hidden', background: 'var(--glass-border)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
                      style={{ height: '100%', borderRadius: 99, background: pctColor, boxShadow: pct >= 80 ? '0 0 10px rgba(34,197,94,0.5)' : 'none' }}
                    />
                  </div>
                  {isOwn && missing.length > 0 && (
                    <div style={{ marginTop: 10, direction: 'rtl' }}>
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 11, marginBottom: 6, opacity: 0.7 }}>
                        ⚠️ حقول ناقصة:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {missing.map(m => (
                          <span
                            key={m}
                            style={{
                              padding: '3px 10px', borderRadius: 99,
                              fontSize: 10, fontWeight: 600,
                              background: 'rgba(164,22,26,0.1)',
                              color: 'var(--color-accent)',
                              border: '1px solid rgba(164,22,26,0.2)',
                            }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* وضع التعديل */}
                {editing && (
                  <div dir="rtl">

                    {/* صورة الملف */}
                    <div style={CARD}>
                      <CardHeader title="الصورة الشخصية" />
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }} dir="rtl">
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                              src={form.avatar_url || '/default-avatar.png'}
                              alt="avatar"
                              style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                            />
                            {uploading && (
                              <div style={{ position: 'absolute', inset: 0, borderRadius: 20, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.8s linear infinite' }} />
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>
                              صورة واضحة للوجه تزيد من فرص التوافق
                            </p>
                            <label style={{ cursor: 'pointer' }}>
                              <input
                                type="file" accept="image/*"
                                style={{ display: 'none' }}
                                onChange={async e => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadAvatar(f);
                                  e.target.value = '';
                                }}
                              />
                              <motion.div
                                whileTap={{ scale: 0.94 }}
                                style={{ padding: '8px 18px', borderRadius: 14, background: 'var(--color-primary)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                              >
                                <Camera size={13} />
                                <span>{uploading ? 'جارٍ الرفع...' : 'تغيير الصورة'}</span>
                              </motion.div>
                            </label>
                          </div>
                        </div>
                        {/* تضبيب */}
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => upd('is_photos_blurred', !form.is_photos_blurred)}
                          style={{
                            width: '100%', marginTop: 14,
                            background: form.is_photos_blurred ? 'var(--color-primary-xsoft)' : 'transparent',
                            border: `1.5px solid ${form.is_photos_blurred ? 'var(--color-primary-soft)' : 'var(--glass-border)'}`,
                            borderRadius: 14, padding: '12px 14px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            cursor: 'pointer', transition: 'all 0.22s', direction: 'rtl',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ShieldCheck size={16}
                              color={form.is_photos_blurred ? 'var(--color-primary)' : 'var(--text-tertiary)'}
                            />
                            <div style={{ textAlign: 'right' }}>
                              <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--text-main)', transition: 'color 0.2s' }}>
                                تضبيب الصورة
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                                {form.is_photos_blurred ? 'مفعّل — صورتك محمية' : 'اضغط لحماية خصوصيتك'}
                              </p>
                            </div>
                          </div>
                          <motion.div
                            animate={{ background: form.is_photos_blurred ? 'var(--color-primary)' : 'transparent', borderColor: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--border-medium)' }}
                            transition={{ duration: 0.2 }}
                            style={{ width: 20, height: 20, borderRadius: 6, border: '1.5px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          >
                            <AnimatePresence>
                              {form.is_photos_blurred && (
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.14 }}>
                                  <Check size={10} color="#fff" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </motion.button>
                      </div>
                    </div>

                    {/* البيانات الأساسية */}
                    <div style={CARD}>
                      <CardHeader title="البيانات الأساسية" />
                      <div style={{ padding: '12px 16px' }}>
                        <Field label="الاسم الكامل" value={form.full_name ?? ''} onChange={v => upd('full_name', v)} />
                        <Field label="الطول (سم)" value={form.height?.toString() ?? ''} onChange={v => upd('height', parseFloat(v) || null)} inputMode="numeric" />
                        <Field label="الوزن (كغ)" value={form.weight?.toString() ?? ''} onChange={v => upd('weight', parseFloat(v) || null)} inputMode="numeric" />
                        <IdPills
                          label="الحالة المدنية"
                          items={MARITAL_STATUS}
                          getLabel={item => isMale ? item.male : item.female}
                          value={form.marital_status}
                          onChange={v => upd('marital_status', v)}
                        />
                        <Sel label="الجنسية"  value={form.nationality ?? ''} options={Object.keys(NATIONALITIES)}  onChange={v => upd('nationality', v)} />
                        <Sel label="الدولة"   value={form.country ?? ''}    options={ALL_COUNTRIES}  onChange={v => { upd('country', v); upd('city', ''); }} />
                        {cities.length > 0 && (
                          <Sel label="المدينة" value={form.city ?? ''} options={cities} onChange={v => upd('city', v)} />
                        )}
                        <IdPills
                          label="جاهزية الزواج"
                          items={MARRIAGE_READINESS}
                          getLabel={item => isMale ? item.male : item.female}
                          value={form.readiness_level}
                          onChange={v => upd('readiness_level', v)}
                        />
                        <Pills label="الانتقال"   options={TRAVEL_WILLINGNESS} value={form.travel_willingness ?? ''} onChange={v => upd('travel_willingness', v as string)} />
                        <Pills label="لون البشرة" options={SKIN_COLOR}          value={form.skin_color ?? ''}         onChange={v => upd('skin_color', v as string)} />
                      </div>
                    </div>

                    {/* المهنة والتعليم */}
                    <div style={CARD}>
                      <CardHeader title="المهنة والتعليم" />
                      <div style={{ padding: '12px 16px' }}>
                        <IdPills
                          label="المستوى الدراسي"
                          items={EDUCATION_LEVELS}
                          getLabel={item => (item as any).label}
                          value={form.education_level}
                          onChange={v => upd('education_level', v)}
                        />
                        <Sel
                          label="تخصص المهنة"
                          value={form.occupation_category_id
                            ? (OCCUPATIONS.find((c: any) => c.id === form.occupation_category_id)?.label ?? '')
                            : ''}
                          options={OCCUPATIONS.map((c: any) => c.label)}
                          onChange={v => {
                            const cat = OCCUPATIONS.find((c: any) => c.label === v);
                            upd('occupation_category_id', cat?.id ?? null);
                            upd('occupation_id', null);
                          }}
                        />
                        {catOccs.length > 0 && (
                          <Sel
                            label="المهنة"
                            value={catOccs.find((s: any) => s.id === form.occupation_id)?.[isMale ? 'male' : 'female'] ?? ''}
                            options={catOccs.map((s: any) => s[isMale ? 'male' : 'female'])}
                            onChange={v => {
                              const sp = catOccs.find((s: any) => s[isMale ? 'male' : 'female'] === v);
                              upd('occupation_id', sp?.id ?? null);
                            }}
                          />
                        )}
                        <Pills label="الوضع المادي" options={FINANCIAL_STATUS} value={form.financial_status ?? ''} onChange={v => upd('financial_status', v as string)} />
                      </div>
                    </div>

                    {/* الدين والالتزام */}
                    <div style={CARD}>
                      <CardHeader title="الدين والالتزام" />
                      <div style={{ padding: '12px 16px' }}>
                        <IdPills
                          label="درجة الالتزام"
                          items={RELIGIOUS_COMMITMENT}
                          getLabel={item => isMale ? item.male : item.female}
                          value={form.religious_commitment}
                          onChange={v => upd('religious_commitment', v)}
                        />
                        <Sel label="حفظ القرآن" value={form.quran_memorization ?? ''} options={QURAN_MEMORIZATION} onChange={v => upd('quran_memorization', v)} />
                        {isMale && committed && (
                          <>
                            <Pills label="اللحية"       options={BEARD_STYLE}       value={form.beard_style ?? ''}       onChange={v => upd('beard_style', v as string)} />
                            <Pills label="صلاة الجماعة" options={PRAYER_COMMITMENT} value={form.prayer_commitment ?? ''} onChange={v => upd('prayer_commitment', v as string)} />
                          </>
                        )}
                        {!isMale && committed && (
                          <Pills label="اللباس" options={HIJAB_STYLE} value={form.hijab_style ?? ''} onChange={v => upd('hijab_style', v as string)} />
                        )}
                      </div>
                    </div>

                    {/* الصحة والعادات */}
                    <div style={CARD}>
                      <CardHeader title="الصحة والعادات" />
                      <div style={{ padding: '12px 16px' }}>
                        <Pills label="الحالة الصحية" options={HEALTH_STATUS_OPTIONS} value={form.health_status ?? ''} onChange={v => upd('health_status', v as string)} />
                        {isMale && (
                          <Pills label="التدخين" options={SMOKING} value={form.smoking ?? ''} onChange={v => upd('smoking', v as string)} />
                        )}
                        {!isMale && (
                          <>
                            <Pills label="العمل بعد الزواج" options={WORK_AFTER_MARRIAGE}  value={form.work_after_marriage ?? ''} onChange={v => upd('work_after_marriage', v as string)} />
                            <Pills label="قبول التعدد"       options={POLYGAMY_ACCEPTANCE} value={form.polygamy_acceptance ?? ''} onChange={v => upd('polygamy_acceptance', v as string)} />
                          </>
                        )}
                      </div>
                    </div>

                    {/* الطبع والشخصية */}
                    <div style={CARD}>
                      <CardHeader title="الطبع والشخصية" />
                      <div style={{ padding: '12px 16px' }}>
                        <Pills label="الشخصية"          options={SOCIAL_TYPE}              value={form.social_type ?? ''}              onChange={v => upd('social_type', v as string)} />
                        <Pills label="صباحي / مسائي"    options={MORNING_EVENING}          value={form.morning_evening ?? ''}          onChange={v => upd('morning_evening', v as string)} />
                        <Pills label="وقت المنزل"       options={HOME_TIME}                value={form.home_time ?? ''}                onChange={v => upd('home_time', v as string)} />
                        <Pills label="أسلوب الحوار"     options={CONFLICT_STYLE}           value={form.conflict_style ?? ''}           onChange={v => upd('conflict_style', v as string)} />
                        <Pills label="التعبير العاطفي"  options={AFFECTION_STYLE}          value={form.affection_style ?? ''}          onChange={v => upd('affection_style', v as string)} />
                        <Pills label="أولويات الحياة"   options={LIFE_PRIORITY}            value={form.life_priority ?? ''}            onChange={v => upd('life_priority', v as string)} />
                        <Pills label="أسلوب التربية"    options={PARENTING_STYLE}          value={form.parenting_style ?? ''}          onChange={v => upd('parenting_style', v as string)} />
                        <Pills label="العلاقة بالأسرة"  options={RELATIONSHIP_WITH_FAMILY} value={form.relationship_with_family ?? ''} onChange={v => upd('relationship_with_family', v as string)} />
                        <Pills label="الرغبة بالإنجاب"  options={DESIRE_FOR_CHILDREN}      value={form.desire_for_children ?? ''}      onChange={v => upd('desire_for_children', v as string)} />
                      </div>
                    </div>

                    {/* النبذة والمتطلبات */}
                    <div style={CARD}>
                      <CardHeader title="النبذة والمتطلبات" />
                      <div style={{ padding: '12px 16px' }}>
                        <Field label="نبذة شخصية"               value={form.bio ?? ''}                  onChange={v => upd('bio', v)}                  rows={4} />
                        <Field label="ما تبحث عنه في الشريك"   value={form.partner_requirements ?? ''} onChange={v => upd('partner_requirements', v)} rows={3} />
                      </div>
                    </div>

                    {/* تسجيل الخروج */}
                    <button
                      onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                      style={{ width: '100%', padding: '14px', borderRadius: 18, marginTop: 4, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      تسجيل الخروج
                    </button>

                  </div>
                )}

                {/* وضع العرض */}
                {!editing && (
                  <div dir="rtl">

                    <SectionBlock title="البيانات الأساسية">
                      <Row label="الحالة المدنية" value={p.marital_status ? getMaritalLabel(p.marital_status, p.gender) : null} icon={<Heart size={13}/>} />
                      <Row label="الجنسية"        value={p.nationality} icon={<Globe size={13}/>} />
                      <Row label="الإقامة"        value={loc || null} icon={<MapPin size={13}/>} />
                      <Row label="الطول / الوزن"  value={hw || null} icon={<Ruler size={13}/>} />
                      <Row label="لون البشرة"     value={p.skin_color} icon={<Smile size={13}/>} />
                      <Row label="الانتقال"       value={p.travel_willingness} icon={<Globe size={13}/>} />
                      <Row label="جاهزية الزواج"  value={p.readiness_level === READINESS_LEVEL_NOW ? '🟢 جاهز حالاً' : null} icon={<Heart size={13}/>} />
                    </SectionBlock>

                    <SectionBlock title="المهنة والتعليم">
                      <Row label="المهنة"           value={p.occupation_id ? getSpecialtyLabel(p.occupation_id, p.gender) : null} icon={<Briefcase size={13}/>} />
                      <Row label="المستوى الدراسي"  value={p.education_level ? getEducationLabel(p.education_level) : null} icon={<GraduationCap size={13}/>} />
                      <Row label="الوضع المادي"     value={p.financial_status} icon={<Star size={13}/>} />
                    </SectionBlock>

                    <SectionBlock title="الدين والالتزام">
                      <Row label="الالتزام"    value={p.religious_commitment ? getReligiousLabel(p.religious_commitment, p.gender) : null} icon={<Church size={13}/>} />
                      <Row label="حفظ القرآن"  value={p.quran_memorization} icon={<BookOpen size={13}/>} />
                      {isMale && <Row label="اللحية"         value={p.beard_style}        icon={<Flame size={13}/>} />}
                      {isMale && <Row label="صلاة الجماعة"  value={p.prayer_commitment}  icon={<Moon size={13}/>} />}
                      {!isMale && <Row label="اللباس"        value={p.hijab_style}        icon={<Star size={13}/>} />}
                    </SectionBlock>

                    <SectionBlock title="الأطفال">
                      <Row
                        label="لديه أطفال"
                        value={p.has_children !== undefined
                          ? (p.has_children ? `نعم (${p.children_count ?? 0})` : 'لا')
                          : null}
                      />
                      {p.has_children && <Row label="الحضانة"       value={p.children_custody} />}
                      <Row label="رغبة بالإنجاب" value={p.desire_for_children} icon={<Baby size={13}/>} />
                    </SectionBlock>

                    <SectionBlock title="الصحة والعادات">
                      <Row label="الحالة الصحية" value={p.health_status} icon={<Activity size={13}/>} />
                      {isMale && <Row label="التدخين" value={p.smoking} icon={<Flame size={13}/>} />}
                    </SectionBlock>

                    {!isMale && (
                      <SectionBlock title="الزواج">
                        <Row label="قبول التعدد"       value={p.polygamy_acceptance} icon={<Users size={13}/>} />
                        <Row label="العمل بعد الزواج"  value={p.work_after_marriage} icon={<Briefcase size={13}/>} />
                      </SectionBlock>
                    )}

                    <SectionBlock title="الطبع والشخصية">
                      <Row label="الشخصية"         value={p.social_type}        icon={<Smile size={13}/>} />
                      <Row label="صباحي / مسائي"   value={p.morning_evening}    icon={<Moon size={13}/>} />
                      <Row label="وقت المنزل"      value={p.home_time}          icon={<Home size={13}/>} />
                      <Row label="أسلوب الحوار"    value={p.conflict_style}     icon={<Users size={13}/>} />
                      <Row label="التعبير العاطفي" value={p.affection_style}    icon={<HandHeart size={13}/>} />
                      <Row label="أولويات الحياة"  value={p.life_priority}      icon={<Star size={13}/>} />
                      <Row label="أسلوب التربية"   value={p.parenting_style}    icon={<Baby size={13}/>} />
                      <Row label="العلاقة بالأسرة" value={p.relationship_with_family} icon={<Home size={13}/>} />
                    </SectionBlock>

                    {!!p.bio && (
                      <div style={CARD}>
                        <CardHeader title="نبذة شخصية" />
                        <p style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.75, direction: 'rtl' }}>
                          "{p.bio}"
                        </p>
                      </div>
                    )}

                    {!!p.partner_requirements && (
                      <div style={CARD}>
                        <CardHeader title="يبحث عن" />
                        <p style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.75, direction: 'rtl' }}>
                          {p.partner_requirements}
                        </p>
                      </div>
                    )}

                    {isOwn && (
                      <button
                        onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
                        style={{ width: '100%', padding: '14px', borderRadius: 18, marginTop: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        تسجيل الخروج
                      </button>
                    )}

                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
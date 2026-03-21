'use client';
/**
 * 📁 app/profile/edit/page.tsx — ZAWAJ AI
 * تعديل البيانات — نفس نظام OnboardingForm
 * الحقول المقفولة: full_name, gender, birth_date, nationality
 * باقي الحقول قابلة للتعديل
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, Check, Camera,
  Plus, Eye, EyeOff, ShieldCheck, Lock, ArrowLeft,
} from 'lucide-react';
import { supabase }  from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { OCCUPATIONS } from '@/constants/occupations';
import { COUNTRIES_CITIES, ALL_COUNTRIES, COUNTRY_DIAL } from '@/constants/countries';
import {
  MARITAL_STATUS, EDUCATION_LEVELS, HOUSING_STATUS,
  RELIGIOUS_COMMITMENT, COMMITTED_LEVELS, NATIONALITIES,
  PREFERRED_HOUSING, FINANCIAL_STATUS, MARRIAGE_READINESS,
  QURAN_MEMORIZATION, BEARD_STYLE, PRAYER_COMMITMENT,
  HIJAB_STYLE, POLYGAMY_ACCEPTANCE, WORK_AFTER_MARRIAGE,
  HEALTH_STATUS_OPTIONS, HEALTH_HABITS, SMOKING, SKIN_COLOR,
  TRAVEL_WILLINGNESS, DESIRE_FOR_CHILDREN, SOCIAL_TYPE,
  MORNING_EVENING, HOME_TIME, CONFLICT_STYLE, AFFECTION_STYLE,
  LIFE_PRIORITY, PARENTING_STYLE, RELATIONSHIP_WITH_FAMILY,
} from '@/constants/constants';

// ══════════════════════════════════════════
//  ثوابت
// ══════════════════════════════════════════
const STEPS = ['الأساسيات', 'التكميل', 'الشخصية', 'الصورة'];
const TITLE = ['البيانات الأساسية', 'البيانات التكميلية', 'الطبع والشخصية', 'الصورة والخصوصية'];
const SUB   = ['بيانات الإقامة والمهنة والدين', 'معلومات تزيد دقة النتائج', 'اختيارية — تحسّن التوافق', 'صورتك وإعدادات الرؤية'];

const LINE: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1.5px solid var(--input-line)',
  padding: 'var(--sp-3) 0', fontSize: 'var(--text-base)', fontWeight: 500,
  color: 'var(--text-main)', caretColor: 'var(--color-primary)',
  outline: 'none', fontFamily: 'inherit',
  WebkitTapHighlightColor: 'transparent',
};

// ══════════════════════════════════════════
//  مكوّنات مشتركة
// ══════════════════════════════════════════
function Lbl({ t }: { t: string }) {
  return (
    <p style={{ fontSize: 'var(--text-2xs)', fontWeight: 800, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 'var(--sp-2)', color: 'var(--text-secondary)', opacity: 0.6 }}>{t}</p>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: 'var(--sp-6) 0 var(--sp-4)' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
      <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 900, letterSpacing: '0.28em', color: 'var(--color-primary)', opacity: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border-soft)' }} />
    </div>
  );
}

// حقل مقفول — يُعرض لكن لا يُعدَّل
function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 'var(--sp-6)', position: 'relative' }}>
      <Lbl t={label} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--glass-border)', padding: 'var(--sp-3) 0' }}>
        <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-base)', fontWeight: 500 }}>{value || '—'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', color: 'var(--text-tertiary)', opacity: 0.5 }}>
          <Lock size={12} />
          <span style={{ fontSize: 'var(--text-2xs)' }}>مقفول</span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', inputMode, rows, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; inputMode?: 'text' | 'numeric' | 'decimal' | 'tel';
  rows?: number; placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  if (rows) return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      <Lbl t={label} />
      <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)}
        style={{ ...LINE, resize: 'none', lineHeight: 'var(--lh-relaxed)', display: 'block' }} />
      <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', textAlign: 'left', marginTop: 'var(--sp-1)' }}>{value.length}/300</p>
    </div>
  );
  return (
    <div style={{ marginBottom: 'var(--sp-6)', position: 'relative' }}>
      <Lbl t={label} />
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} dir="auto" placeholder={placeholder}
          inputMode={inputMode}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...LINE, borderBottomColor: focused ? 'var(--color-primary)' : 'var(--input-line)' }} />
        <motion.div animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }} transition={{ duration: 0.2 }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--color-primary)', borderRadius: 2, transformOrigin: 'left', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

function Sel({ label, value, options, onChange, ph = 'اختر...' }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; ph?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ marginBottom: 'var(--sp-6)', position: 'relative' }}>
      <Lbl t={label} />
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ ...LINE, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottomColor: open ? 'var(--color-primary)' : 'var(--input-line)' }}>
        <span style={{ color: value ? 'var(--text-main)' : 'var(--input-placeholder)', fontWeight: value ? 500 : 400, fontSize: 'var(--text-base)' }}>{value || ph}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} style={{ color: 'var(--color-primary)', opacity: 0.7, flexShrink: 0 }} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -10, scaleY: 0.92 }} animate={{ opacity: 1, y: 0, scaleY: 1 }} exit={{ opacity: 0, y: -10, scaleY: 0.92 }} transition={{ duration: 0.15 }}
            style={{ position: 'absolute', zIndex: 1000, width: '100%', top: 'calc(100% + 6px)', background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: 18, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.55)', maxHeight: 240, overflowY: 'auto', transformOrigin: 'top' }}>
            {options.map((o, i) => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false); }}
                style={{ width: '100%', textAlign: 'right', direction: 'rtl', padding: 'var(--sp-3) var(--sp-5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: value === o ? 'var(--color-primary-soft)' : 'transparent', borderBottom: i < options.length - 1 ? '1px solid var(--border-soft)' : 'none', color: value === o ? 'var(--color-primary)' : 'var(--text-main)', fontSize: 'var(--text-sm)', fontWeight: value === o ? 600 : 400, fontFamily: 'inherit', cursor: 'pointer' }}>
                <span>{o}</span>
                {value === o && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pills({ label, options, value, onChange, multi = false, max }: {
  label: string; options: string[]; value: string | string[];
  onChange: (v: string | string[]) => void; multi?: boolean; max?: number;
}) {
  const sel = (o: string) => multi ? (value as string[]).includes(o) : value === o;
  const tap = (o: string) => {
    if (!multi) { onChange(o); return; }
    const a = value as string[];
    if (a.includes(o)) onChange(a.filter(x => x !== o));
    else if (!max || a.length < max) onChange([...a, o]);
  };
  return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      {label && <Lbl t={label} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
        {options.map(o => {
          const active = sel(o);
          const disabled = multi && !active && (value as string[]).length >= (max ?? 999);
          return (
            <motion.button key={o} type="button" whileTap={{ scale: 0.93 }} disabled={disabled} onClick={() => tap(o)}
              style={{ padding: 'var(--sp-2) var(--sp-5)', borderRadius: 999, border: 'none', cursor: 'pointer', background: active ? 'var(--color-primary)' : 'transparent', outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`, color: active ? '#fff' : 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400, fontFamily: 'inherit', opacity: disabled ? 0.28 : 1, boxShadow: active ? '0 4px 18px var(--shadow-red-glow)' : 'none', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s' }}>
              {o}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function IdPills<T extends { id: number }>({ label, items, getLabel, value, onChange }: {
  label: string; items: T[]; getLabel: (item: T) => string; value: number | null; onChange: (id: number) => void;
}) {
  return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      {label && <Lbl t={label} />}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
        {items.map(item => {
          const active = value === item.id;
          return (
            <motion.button key={item.id} type="button" whileTap={{ scale: 0.93 }} onClick={() => onChange(item.id)}
              style={{ padding: 'var(--sp-2) var(--sp-5)', borderRadius: 999, border: 'none', cursor: 'pointer', background: active ? 'var(--color-primary)' : 'transparent', outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`, color: active ? '#fff' : 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400, fontFamily: 'inherit', boxShadow: active ? '0 4px 18px var(--shadow-red-glow)' : 'none', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s' }}>
              {getLabel(item)}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function HousingPills({ value, onChange }: { value: number | null; onChange: (id: number) => void }) {
  return (
    <div style={{ marginBottom: 'var(--sp-6)' }}>
      <Lbl t="السكن الحالي" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
        {HOUSING_STATUS.map(h => {
          const active = value === h.id;
          return (
            <motion.button key={h.id} type="button" whileTap={{ scale: 0.93 }} onClick={() => onChange(h.id)}
              style={{ padding: 'var(--sp-2) var(--sp-5)', borderRadius: 999, border: 'none', cursor: 'pointer', background: active ? 'var(--color-primary)' : 'transparent', outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`, color: active ? '#fff' : 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: active ? 600 : 400, fontFamily: 'inherit', boxShadow: active ? '0 4px 18px var(--shadow-red-glow)' : 'none', WebkitTapHighlightColor: 'transparent', transition: 'all 0.15s' }}>
              {h.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  CropModal مُصلح
// ══════════════════════════════════════════
async function compressToMax(canvas: HTMLCanvasElement, maxKB = 200): Promise<Blob> {
  const maxBytes = maxKB * 1024;
  let quality = 0.85, blob: Blob | null = null;
  while (quality >= 0.20) {
    blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/webp', quality));
    if (!blob || blob.size <= maxBytes) break;
    quality -= 0.08;
  }
  return blob ?? (await new Promise(res => canvas.toBlob(res, 'image/webp', 0.20)) as Blob);
}

async function cropAndCompress(src: string, cropX: number, cropY: number, cropSize: number): Promise<File> {
  return new Promise(resolve => {
    const img = new Image();
    img.src = src;
    img.onload = async () => {
      const c = document.createElement('canvas');
      c.width = 600; c.height = 600;
      c.getContext('2d')!.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, 600, 600);
      const blob = await compressToMax(c, 200);
      resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }));
    };
  });
}

function CropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (x: number, y: number, s: number) => void; onCancel: () => void }) {
  const ref  = useRef<HTMLCanvasElement>(null);
  const img  = useRef<HTMLImageElement | null>(null);
  const last = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const [ready,  setReady]  = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale,  setScale]  = useState(1);
  const [drag,   setDrag]   = useState(false);
  const SIZE = 300;

  useEffect(() => {
    const i = new Image();
    i.src = src;
    i.onload = () => {
      img.current = i;
      const s = Math.max(SIZE / i.width, SIZE / i.height);
      setScale(s);
      setOffset({ x: (SIZE - i.width * s) / 2, y: (SIZE - i.height * s) / 2 });
      setReady(true);
    };
  }, [src]);

  // ✅ evenodd — الصورة مرئية داخل الدائرة دائماً
  useEffect(() => {
    if (!ready || !img.current || !ref.current) return;
    const ctx = ref.current.getContext('2d')!;
    const im  = img.current;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(im, offset.x, offset.y, im.width * scale, im.height * scale);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, SIZE, SIZE);
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = '#B3334B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [ready, offset, scale]);

  const clamp = (o: { x: number; y: number }) => {
    const im = img.current!;
    return { x: Math.min(0, Math.max(SIZE - im.width * scale, o.x)), y: Math.min(0, Math.max(SIZE - im.height * scale, o.y)) };
  };

  const confirm = () => {
    if (!img.current) return;
    const im   = img.current;
    const cropX = Math.max(0, -offset.x / scale);
    const cropY = Math.max(0, -offset.y / scale);
    const cropSz = Math.min(
      SIZE / scale,
      Math.min(im.width - cropX, im.height - cropY)
    );
    onConfirm(cropX, cropY, cropSz);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)', textAlign: 'center' }}>اسحب لتحديد موضع الوجه</p>
      <canvas ref={ref} width={SIZE} height={SIZE}
        style={{ borderRadius: '50%', touchAction: 'none', cursor: drag ? 'grabbing' : 'grab', maxWidth: '85vw', maxHeight: '85vw', background: '#0a0a0a' }}
        onTouchStart={e => {
          e.preventDefault();
          if (e.touches.length === 1) { setDrag(true); last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
          else { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; last.current = { x: 0, y: 0, dist: Math.sqrt(dx * dx + dy * dy) }; }
        }}
        onTouchMove={e => {
          e.preventDefault();
          if (!last.current || !img.current) return;
          if (e.touches.length === 1 && drag) {
            setOffset(o => clamp({ x: o.x + e.touches[0].clientX - last.current!.x, y: o.y + e.touches[0].clientY - last.current!.y }));
            last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          } else if (e.touches.length === 2 && last.current.dist) {
            const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minS = SIZE / Math.max(img.current.width, img.current.height);
            setScale(s => Math.min(4, Math.max(minS, s * (dist / last.current!.dist!))));
            last.current = { ...last.current, dist };
          }
        }}
        onTouchEnd={() => { setDrag(false); last.current = null; }}
        onMouseDown={e => { setDrag(true); last.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={e => { if (!drag || !img.current) return; setOffset(o => clamp({ x: o.x + e.movementX, y: o.y + e.movementY })); }}
        onMouseUp={() => { setDrag(false); last.current = null; }}
        onMouseLeave={() => { setDrag(false); last.current = null; }}
        onWheel={e => { if (!img.current) return; const minS = SIZE / Math.max(img.current.width, img.current.height); setScale(s => Math.min(4, Math.max(minS, s - e.deltaY * 0.001))); }}
      />
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'var(--text-2xs)', margin: 'var(--sp-3) 0', textAlign: 'center' }}>قرّب أو بعّد بالأصبعين</p>
      <div style={{ display: 'flex', gap: 'var(--sp-3)', width: '100%', maxWidth: 300 }}>
        <button onClick={onCancel} style={{ flex: 1, height: 'var(--btn-h)', borderRadius: 'var(--radius-md)', background: 'var(--bg-soft)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>إلغاء</button>
        <button onClick={confirm} style={{ flex: 2, height: 'var(--btn-h)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', border: 'none', color: '#fff', fontSize: 'var(--text-base)', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>تأكيد</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
//  الصفحة الرئيسية
// ══════════════════════════════════════════
export default function ProfileEditPage() {
  const router = useRouter();
  const [step,      setStep]     = useState(0);
  const [slideDir,  setSlideDir] = useState<1 | -1>(1);
  const [profile,   setProfile]  = useState<any>(null);
  const [form,      setForm]     = useState<any>({});
  const [saving,    setSaving]   = useState(false);
  const [saved,     setSaved]    = useState(false);
  const [imgFile,   setImgFile]  = useState<File | null>(null);
  const [imgPreview,setPreview]  = useState('');
  const [cropSrc,   setCropSrc]  = useState('');
  const [intOpts,   setIntOpts]  = useState<{ id: string; label: string }[]>([]);
  const [tag,       setTag]      = useState('');
  const [uploading, setUploading]= useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data); setForm(data ?? {});
    };
    load();
    supabase.from('interests_options').select('id,label').eq('is_active', true)
      .then(({ data }) => { if (data) setIntOpts(data); });
  }, [router]);

  const set = useCallback(<K extends string>(k: K, v: any) => {
    setForm((p: any) => ({ ...p, [k]: v }));
  }, []);

  // مشتقات
  const isMale       = form.gender === 'male';
  const isFemale     = form.gender === 'female';
  const isDivorced   = form.marital_status === 12 || form.marital_status === 13;
  const isCommitted  = form.religious_commitment !== null && COMMITTED_LEVELS.includes(form.religious_commitment);
  const specialties  = OCCUPATIONS.find(o => o.id === form.occupation_category_id)?.specialties ?? [];
  const cities       = form.country ? (COUNTRIES_CITIES[form.country] ?? []) : [];
  const educLabel    = form.education_level
    ? (Array.isArray ? EDUCATION_LEVELS.find((e: any) => e.id === form.education_level)?.label ?? '' : '')
    : '';

  const goNext = () => { setSlideDir(1); setStep(s => Math.min(s + 1, 3)); window.scrollTo({ top: 0, behavior: 'instant' as any }); };
  const goBack = () => {
    if (step === 0) { router.back(); return; }
    setSlideDir(-1); setStep(s => Math.max(s - 1, 0)); window.scrollTo({ top: 0, behavior: 'instant' as any });
  };

  // حفظ — payload نظيف بدون حقول النظام والحقول المقفولة
  const save = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      // رفع الصورة أولاً إن وجدت
      let avatar_url_update: string | undefined;
      if (imgFile) {
        const path = `${profile.id}_avatar.webp`;
        const { error: upErr } = await supabase.storage.from('Avatars').upload(path, imgFile, { upsert: true, cacheControl: '3600' });
        if (!upErr) avatar_url_update = supabase.storage.from('Avatars').getPublicUrl(path).data.publicUrl;
      }

      // الحقول القابلة للتعديل فقط
      const payload: Record<string, unknown> = {
        country:               form.country,
        city:                  form.city,
        marital_status:        form.marital_status,
        education_level:       form.education_level,
        occupation_category_id:form.occupation_category_id,
        occupation_id:         form.occupation_id,
        financial_status:      form.financial_status,
        religious_commitment:  form.religious_commitment,
        readiness_level:       form.readiness_level,
        children_count:        form.children_count,
        children_custody:      form.children_custody,
        quran_memorization:    form.quran_memorization,
        beard_style:           form.beard_style,
        prayer_commitment:     form.prayer_commitment,
        hijab_style:           form.hijab_style,
        work_after_marriage:   form.work_after_marriage,
        polygamy_acceptance:   form.polygamy_acceptance,
        housing_type:          form.housing_type,
        preferred_housing:     form.preferred_housing,
        health_status:         form.health_status,
        health_habits:         form.health_habits,
        height:                form.height ? parseFloat(form.height) : null,
        weight:                form.weight ? parseFloat(form.weight) : null,
        smoking:               form.smoking,
        skin_color:            form.skin_color,
        travel_willingness:    form.travel_willingness,
        desire_for_children:   form.desire_for_children,
        social_type:           form.social_type,
        morning_evening:       form.morning_evening,
        home_time:             form.home_time,
        conflict_style:        form.conflict_style,
        affection_style:       form.affection_style,
        life_priority:         form.life_priority,
        parenting_style:       form.parenting_style,
        relationship_with_family: form.relationship_with_family,
        interests:             form.interests,
        bio:                   form.bio,
        partner_requirements:  form.partner_requirements,
        is_photos_blurred:     form.is_photos_blurred,
        show_photos:           form.show_photos,
        phone:                 form.phone ? `${COUNTRY_DIAL[form.country] ?? ''}${form.phone}` : '',
        updated_at:            new Date().toISOString(),
        ...(avatar_url_update ? { avatar_url: avatar_url_update } : {}),
      };

      const { error } = await supabase.from('profiles').update(payload).eq('id', profile.id);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => { setSaved(false); router.back(); }, 1200);
    } catch (e: any) {
      console.error('[edit] save:', e.message);
    }
    setSaving(false);
  };

  if (!profile) return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  // ── المراحل ────────────────────────────────────────────────────
  const S0 = (
    <div dir="rtl">
      {/* حقول مقفولة */}
      <LockedField label="الاسم الكامل" value={form.full_name} />
      <LockedField label="الجنس" value={form.gender === 'male' ? 'ذكر' : 'أنثى'} />
      <LockedField label="تاريخ الميلاد" value={form.birth_date} />
      <LockedField label="الجنسية" value={form.nationality} />

      <Divider label="الإقامة" />
      <Sel label="بلد الإقامة" value={form.country ?? ''} options={ALL_COUNTRIES}
        onChange={v => { set('country', v); set('city', ''); }} />
      {form.country && (
        <Sel label="المدينة" value={form.city ?? ''} options={cities}
          onChange={v => set('city', v)} ph="اختر المدينة..." />
      )}

      {/* رقم الهاتف */}
      {form.country && (
        <div style={{ marginBottom: 'var(--sp-6)' }}>
          <Lbl t="رقم الهاتف (اختياري)" />
          <div dir="ltr" style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid var(--input-line)' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 700, padding: 'var(--sp-3) 0', paddingRight: 10, flexShrink: 0, letterSpacing: '0.02em', borderRight: '1.5px solid var(--border-soft)', marginRight: 10 }}>
              {COUNTRY_DIAL[form.country] ?? ''}
            </span>
            <input type="tel" inputMode="numeric" dir="ltr" value={form.phone ?? ''}
              onChange={e => set('phone', e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="XXXXXXXXX" maxLength={15}
              style={{ ...LINE, borderBottom: 'none', flex: 1, textAlign: 'left' }} />
          </div>
        </div>
      )}

      <Divider label="الحالة المدنية" />
      <IdPills label="" items={MARITAL_STATUS}
        getLabel={s => isMale ? s.male : s.female}
        value={form.marital_status} onChange={id => set('marital_status', id)} />

      <Divider label="التعليم والعمل" />
      <Sel label="المستوى الدراسي" value={educLabel}
        options={EDUCATION_LEVELS.map((e: any) => e.label)}
        onChange={v => { const f = EDUCATION_LEVELS.find((e: any) => e.label === v); set('education_level', f?.id ?? null); }} />
      <Sel label="المجال المهني"
        value={OCCUPATIONS.find(o => o.id === form.occupation_category_id)?.label ?? ''}
        options={OCCUPATIONS.filter(o => o.id !== 0).map(o => o.label)}
        onChange={v => { const cat = OCCUPATIONS.find(o => o.label === v); set('occupation_category_id', cat?.id ?? null); set('occupation_id', null); }} />
      {specialties.length > 0 && (
        <Sel label="الاختصاص"
          value={specialties.find((s: any) => s.id === form.occupation_id)?.[isMale ? 'm' : 'f'] ?? ''}
          options={specialties.map((s: any) => isMale ? s.m : s.f)}
          onChange={v => { const sp = specialties.find((s: any) => (isMale ? s.m : s.f) === v); set('occupation_id', sp?.id ?? null); }} />
      )}
      <Pills label="الوضع المادي" options={FINANCIAL_STATUS} value={form.financial_status ?? ''} onChange={v => set('financial_status', v)} />

      <Divider label="الدين والجاهزية" />
      <IdPills label="مستوى الالتزام الديني" items={RELIGIOUS_COMMITMENT}
        getLabel={r => isMale ? r.male : r.female}
        value={form.religious_commitment} onChange={id => set('religious_commitment', id)} />
      <IdPills label="جاهزية الزواج" items={MARRIAGE_READINESS}
        getLabel={r => isMale ? r.male : r.female}
        value={form.readiness_level} onChange={id => set('readiness_level', id)} />
    </div>
  );

  const S1 = (
    <div dir="rtl">
      {isDivorced && (
        <>
          <Divider label="الأبناء" />
          <Pills label="عدد الأبناء" options={['لا يوجد', '1', '2', '3', '4', '+4']}
            value={form.children_count === 0 ? 'لا يوجد' : form.children_count > 4 ? '+4' : `${form.children_count}`}
            onChange={v => { set('children_count', v === 'لا يوجد' ? 0 : v === '+4' ? 5 : parseInt(v as string)); if (v === 'لا يوجد') set('children_custody', ''); }} />
          {form.children_count > 0 && (
            <Pills label="الحضانة" options={['عندي', 'عند الوالد الآخر', 'مشتركة']}
              value={form.children_custody ?? ''} onChange={v => set('children_custody', v)} />
          )}
        </>
      )}

      {isCommitted && (
        <>
          <Divider label="الالتزام الديني" />
          <Sel label="حفظ القرآن الكريم" value={form.quran_memorization ?? ''} options={QURAN_MEMORIZATION} onChange={v => set('quran_memorization', v)} />
          {isMale && <>
            <Pills label="اللحية" options={BEARD_STYLE} value={form.beard_style ?? ''} onChange={v => set('beard_style', v)} />
            <Sel label="الصلاة في المسجد" value={form.prayer_commitment ?? ''} options={PRAYER_COMMITMENT} onChange={v => set('prayer_commitment', v)} />
          </>}
          {isFemale && <>
            <Pills label="اللباس" options={HIJAB_STYLE} value={form.hijab_style ?? ''} onChange={v => set('hijab_style', v)} />
            <Pills label="العمل بعد الزواج" options={WORK_AFTER_MARRIAGE} value={form.work_after_marriage ?? ''} onChange={v => set('work_after_marriage', v)} />
            <Pills label="قبول التعدد" options={POLYGAMY_ACCEPTANCE} value={form.polygamy_acceptance ?? ''} onChange={v => set('polygamy_acceptance', v)} />
          </>}
        </>
      )}

      <Divider label="السكن" />
      <HousingPills value={form.housing_type} onChange={id => set('housing_type', id)} />
      <Pills label="السكن بعد الزواج" options={PREFERRED_HOUSING} value={form.preferred_housing ?? ''} onChange={v => set('preferred_housing', v)} />

      <Divider label="الصحة" />
      <Sel label="الحالة الصحية" value={form.health_status ?? ''} options={HEALTH_STATUS_OPTIONS} onChange={v => set('health_status', v)} />
      <Pills label="العادات الصحية" options={HEALTH_HABITS} value={form.health_habits ?? []} onChange={v => set('health_habits', v)} multi max={3} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-5)' }}>
        <Field label="الطول (سم)" value={form.height ? `${form.height}` : ''} onChange={v => set('height', v)} placeholder="175" inputMode="numeric" />
        <Field label="الوزن (كغ)" value={form.weight ? `${form.weight}` : ''} onChange={v => set('weight', v)} placeholder="70" inputMode="numeric" />
      </div>
      {isMale && <Pills label="التدخين" options={SMOKING} value={form.smoking ?? ''} onChange={v => set('smoking', v)} />}

      <Divider label="معلومات إضافية" />
      <Pills label="لون البشرة" options={SKIN_COLOR} value={form.skin_color ?? ''} onChange={v => set('skin_color', v)} />
      <Pills label="القبول بالانتقال" options={TRAVEL_WILLINGNESS} value={form.travel_willingness ?? ''} onChange={v => set('travel_willingness', v)} />
      <Sel label="الرغبة في الإنجاب" value={form.desire_for_children ?? ''} options={DESIRE_FOR_CHILDREN} onChange={v => set('desire_for_children', v)} />
    </div>
  );

  const S2 = (
    <div dir="rtl">
      <Pills label="الشخصية الاجتماعية" options={SOCIAL_TYPE} value={form.social_type ?? ''} onChange={v => set('social_type', v)} />
      <Pills label="صباحي أم مسائي" options={MORNING_EVENING} value={form.morning_evening ?? ''} onChange={v => set('morning_evening', v)} />
      <Pills label="البيت أم الخروج" options={HOME_TIME} value={form.home_time ?? ''} onChange={v => set('home_time', v)} />
      <Sel label="أسلوب حل الخلافات" value={form.conflict_style ?? ''} options={CONFLICT_STYLE} onChange={v => set('conflict_style', v)} />
      <Pills label="التعبير عن المشاعر" options={AFFECTION_STYLE} value={form.affection_style ?? ''} onChange={v => set('affection_style', v)} />
      <Sel label="أولويات الحياة" value={form.life_priority ?? ''} options={LIFE_PRIORITY} onChange={v => set('life_priority', v)} />
      <Pills label="أسلوب التربية" options={PARENTING_STYLE} value={form.parenting_style ?? ''} onChange={v => set('parenting_style', v)} />
      <Pills label="العلاقة مع العائلة" options={RELATIONSHIP_WITH_FAMILY} value={form.relationship_with_family ?? ''} onChange={v => set('relationship_with_family', v)} />

      <Divider label="الاهتمامات" />
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', opacity: 0.45, marginBottom: 'var(--sp-3)' }}>حتى 5 اهتمامات</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)', marginBottom: 'var(--sp-4)' }}>
        {intOpts.map(opt => {
          const sel = (form.interests ?? []).includes(opt.label);
          return (
            <motion.button key={opt.id} type="button" whileTap={{ scale: 0.93 }}
              disabled={!sel && (form.interests ?? []).length >= 5}
              onClick={() => set('interests', sel ? (form.interests ?? []).filter((x: string) => x !== opt.label) : [...(form.interests ?? []), opt.label])}
              style={{ padding: 'var(--sp-2) var(--sp-5)', borderRadius: 999, border: 'none', cursor: 'pointer', background: sel ? 'var(--color-primary)' : 'transparent', outline: `1.5px solid ${sel ? 'var(--color-primary)' : 'var(--border-medium)'}`, color: sel ? '#fff' : 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: sel ? 600 : 400, fontFamily: 'inherit', opacity: !sel && (form.interests ?? []).length >= 5 ? 0.28 : 1, boxShadow: sel ? '0 4px 16px var(--shadow-red-glow)' : 'none', WebkitTapHighlightColor: 'transparent' }}>
              {opt.label}
            </motion.button>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)', marginBottom: 'var(--sp-8)' }}>
        <input value={tag} onChange={e => setTag(e.target.value)} dir="rtl"
          placeholder="اهتمام آخر..." maxLength={20}
          onKeyDown={e => { if (e.key === 'Enter' && tag.trim() && (form.interests ?? []).length < 5) { set('interests', [...(form.interests ?? []), tag.trim()]); setTag(''); } }}
          style={{ ...LINE, flex: 1, direction: 'rtl' }} />
        <motion.button type="button" whileTap={{ scale: 0.9 }}
          onClick={() => { if (tag.trim() && (form.interests ?? []).length < 5) { set('interests', [...(form.interests ?? []), tag.trim()]); setTag(''); } }}
          style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-primary)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}>
          <Plus size={16} color="#fff" />
        </motion.button>
      </div>

      <Divider label="نبذة" />
      <Field label="نبذة عنك" value={form.bio ?? ''} onChange={v => set('bio', v)} rows={4} />
      <Field label="مواصفات الشريك" value={form.partner_requirements ?? ''} onChange={v => set('partner_requirements', v)} rows={3} />
    </div>
  );

  const S3 = (
    <div dir="rtl">
      {/* رفع الصورة */}
      <label style={{ display: 'block', cursor: 'pointer', marginBottom: 'var(--sp-6)' }}>
        <input type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (!f) return; setCropSrc(URL.createObjectURL(f)); e.target.value = ''; }} />
        <motion.div whileTap={{ scale: 0.98 }} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '44px 20px',
          border: `1.5px dashed ${imgPreview ? 'var(--color-primary)' : 'var(--border-medium)'}`,
          borderRadius: 24, background: imgPreview ? 'transparent' : 'var(--bg-soft)',
        }}>
          {imgPreview ? (
            <div style={{ position: 'relative' }}>
              <img src={imgPreview} alt="" style={{ width: 148, height: 148, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)', boxShadow: '0 8px 32px var(--shadow-red-glow)' }} />
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={15} color="#fff" />
              </div>
            </div>
          ) : (
            <>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', marginBottom: 'var(--sp-3)', border: '2px solid var(--border-soft)', filter: profile.is_photos_blurred ? 'blur(8px)' : 'none' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', marginBottom: 'var(--sp-3)', background: 'var(--color-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Camera size={26} style={{ color: 'var(--color-primary)', opacity: 0.8 }} />
                </div>
              )}
              <p style={{ fontSize: 'var(--text-md)', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 'var(--sp-1)' }}>اضغط لتغيير الصورة</p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>JPG · PNG · WEBP</p>
            </>
          )}
        </motion.div>
      </label>

      {/* تضبيب صورتك */}
      <motion.button type="button" whileTap={{ scale: 0.96 }}
        onClick={() => set('is_photos_blurred', !form.is_photos_blurred)}
        style={{ width: '100%', background: form.is_photos_blurred ? 'var(--color-primary-xsoft)' : 'transparent', border: `1.5px solid ${form.is_photos_blurred ? 'var(--color-primary-soft)' : 'var(--border-medium)'}`, borderRadius: 16, padding: 'var(--sp-4) var(--sp-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.22s', WebkitTapHighlightColor: 'transparent', marginBottom: 'var(--sp-3)', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <ShieldCheck size={22} color={form.is_photos_blurred ? 'var(--color-primary)' : 'var(--text-tertiary)'} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: 0, color: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--text-main)', transition: 'color 0.2s' }}>تضبيب صورتك</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{form.is_photos_blurred ? 'مفعّل — صورتك محمية' : 'اضغط لحماية خصوصيتك'}</p>
          </div>
        </div>
        <motion.div animate={{ background: form.is_photos_blurred ? 'var(--color-primary)' : 'transparent', borderColor: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--border-medium)' }} transition={{ duration: 0.2 }}
          style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: '1.5px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence>{form.is_photos_blurred && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={12} color="#fff" /></motion.div>}</AnimatePresence>
        </motion.div>
      </motion.button>

      {/* رؤية صور الآخرين */}
      <motion.button type="button" whileTap={{ scale: 0.96 }}
        onClick={() => set('show_photos', !form.show_photos)}
        style={{ width: '100%', background: !form.show_photos ? 'var(--color-primary-xsoft)' : 'transparent', border: `1.5px solid ${!form.show_photos ? 'var(--color-primary-soft)' : 'var(--border-medium)'}`, borderRadius: 16, padding: 'var(--sp-4) var(--sp-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.22s', WebkitTapHighlightColor: 'transparent', direction: 'rtl', marginBottom: 'var(--sp-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          {form.show_photos ? <Eye size={22} color="var(--text-tertiary)" /> : <EyeOff size={22} color="var(--color-primary)" />}
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, margin: 0, color: !form.show_photos ? 'var(--color-primary)' : 'var(--text-main)', transition: 'color 0.2s' }}>{form.show_photos ? 'رؤية صور الأعضاء' : 'إخفاء صور الأعضاء'}</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>{form.show_photos ? 'الصور تظهر عادياً' : 'مفعّل — كل الصور مضبّبة'}</p>
          </div>
        </div>
        <motion.div animate={{ background: !form.show_photos ? 'var(--color-primary)' : 'transparent', borderColor: !form.show_photos ? 'var(--color-primary)' : 'var(--border-medium)' }} transition={{ duration: 0.2 }}
          style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, border: '1.5px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence>{!form.show_photos && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check size={12} color="#fff" /></motion.div>}</AnimatePresence>
        </motion.div>
      </motion.button>
    </div>
  );

  const CONTENT = [S0, S1, S2, S3];

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>

      {/* ── PageHeader ثابت ─────────────────────────────── */}
      <div data-top-bar dir="rtl" style={{ position: 'fixed', top: 0, right: 0, left: 0, zIndex: 1000, height: 'var(--header-h)', display: 'flex', alignItems: 'center', padding: '0 var(--sp-2)', background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <span style={{ flex: 1, color: 'var(--text-main)', fontSize: 'var(--text-lg)', fontWeight: 800, paddingRight: 'var(--sp-2)' }}>تعديل الملف</span>
        <motion.button whileTap={{ scale: 0.9 }} onClick={goBack}
          style={{ width: 'var(--btn-h)', height: 'var(--btn-h)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-full)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-main)', flexShrink: 0 }}>
          <ArrowLeft size={20} />
        </motion.button>
      </div>

      {/* ── StickySubHeader ──────────────────────────────── */}
      <div style={{ position: 'sticky', top: 'var(--header-h)', zIndex: 900, background: 'var(--bg-surface)', borderBottom: '1px solid var(--glass-border)', padding: '0 var(--sp-4) var(--sp-2)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.13 }}
            style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--sp-2)', marginBottom: 'var(--sp-2)', paddingTop: 'var(--sp-3)' }}>
            <span style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--text-main)' }}>{TITLE[step]}</span>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>{step + 1}/{STEPS.length}</span>
          </motion.div>
        </AnimatePresence>
        <div style={{ display: 'flex', gap: 5 }}>
          {STEPS.map((_, i) => (
            <motion.div key={i} animate={{ background: i <= step ? 'var(--color-primary)' : 'rgba(255,255,255,0.12)', opacity: i <= step ? 1 : 0.4 }} transition={{ duration: 0.35 }}
              style={{ flex: 1, height: 4, borderRadius: 'var(--radius-full)' }} />
          ))}
        </div>
      </div>

      {/* ── المحتوى ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'hidden', paddingTop: 'var(--header-h)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ x: slideDir * 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideDir * -32, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            style={{ padding: 'var(--sp-4) var(--sp-4) 9rem' }}>
            <motion.p initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.06 }}
              style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', opacity: 0.6, lineHeight: 'var(--lh-relaxed)', margin: '0 0 var(--sp-5)', direction: 'rtl' }}>
              {SUB[step]}
            </motion.p>
            {CONTENT[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── أزرار التنقل ─────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, padding: `var(--sp-4) var(--sp-6) calc(var(--nav-h) + var(--sp-3))`, background: `linear-gradient(to top, var(--bg-main) 72%, transparent)` }}>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' }}>
          {step < 3 ? (
            <motion.button whileTap={{ scale: 0.97 }} onClick={goNext}
              style={{ flex: 1, height: 'var(--btn-h-lg)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', color: '#fff', fontSize: 'var(--text-base)', fontWeight: 800, background: 'var(--color-primary)', boxShadow: '0 6px 24px var(--shadow-red-glow)', fontFamily: 'inherit' }}>
              <span>التالي</span><ChevronLeft size={18} />
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }} onClick={save} disabled={saving}
              style={{ flex: 1, height: 'var(--btn-h-lg)', borderRadius: 'var(--radius-lg)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', color: '#fff', fontSize: 'var(--text-base)', fontWeight: 800, background: saved ? '#22c55e' : saving ? 'rgba(179,51,75,0.45)' : 'var(--color-primary)', fontFamily: 'inherit' }}>
              {saving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              ) : saved ? (
                <><Check size={18} /><span>تم الحفظ ✓</span></>
              ) : (
                <><Check size={18} /><span>حفظ التعديلات</span></>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* ── CropModal ── */}
      {cropSrc && (
        <CropModal src={cropSrc}
          onConfirm={async (x, y, s) => {
            const file = await cropAndCompress(cropSrc, x, y, s);
            setImgFile(file);
            setPreview(URL.createObjectURL(file));
            setCropSrc('');
          }}
          onCancel={() => setCropSrc('')} />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
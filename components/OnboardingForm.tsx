'use client';
/**
 * OnboardingForm — ZAWAJ AI · Premium v10
 * ─────────────────────────────────────────
 * Design: Luxury Minimal — Hinge/Tinder Platinum level
 * Theme:  Dark (default) + Light (html.light class)
 * ─────────────────────────────────────────
 * constants.ts v2 (id-based):
 *   MARITAL_STATUS     → {id,male,female}[]   → stored as number
 *   EDUCATION_LEVELS   → {id,label}[]          → stored as number
 *   HOUSING_STATUS     → {id,label}[]          → stored as number
 *   RELIGIOUS_COMMITMENT → {id,male,female}[]  → stored as number
 *   COMMITTED_LEVELS   → number[]
 *   MARRIAGE_READINESS → {id,male,female}[]  → stored as number
 *   الباقي             → string[]
 *
 * حُذف: WIFE_NUMBER · MARRIAGE_TYPE · EMPLOYMENT_TYPE
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, ArrowLeft, Move, MapPin, Loader2,
  Check, Camera, Plus, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { supabase }              from '@/lib/supabase/client';
import { useRouter }              from 'next/navigation';
import { toast }                  from 'sonner';
import { moderateText, moderateImage } from '@/lib/moderate';
import { getAutoLocation, saveLocationToProfile } from '@/lib/services/locationService';
import { OCCUPATIONS } from '@/constants/occupations';
import { COUNTRIES_CITIES, ALL_COUNTRIES, COUNTRY_DIAL } from '@/constants/countries';
import {
  MARITAL_STATUS,
  EDUCATION_LEVELS,
  HOUSING_STATUS,
  RELIGIOUS_COMMITMENT,
  COMMITTED_LEVELS,
  NATIONALITIES,
  PREFERRED_HOUSING,
  FINANCIAL_STATUS,
  MARRIAGE_READINESS,
  QURAN_MEMORIZATION,
  BEARD_STYLE,
  PRAYER_COMMITMENT,
  HIJAB_STYLE,
  POLYGAMY_ACCEPTANCE,
  WORK_AFTER_MARRIAGE,
  HEALTH_STATUS_OPTIONS,
  HEALTH_HABITS,
  SMOKING,
  SKIN_COLOR,
  TRAVEL_WILLINGNESS,
  DESIRE_FOR_CHILDREN,
  SOCIAL_TYPE,
  MORNING_EVENING,
  HOME_TIME,
  CONFLICT_STYLE,
  AFFECTION_STYLE,
  LIFE_PRIORITY,
  PARENTING_STYLE,
  RELATIONSHIP_WITH_FAMILY,
} from '@/constants/constants';

// ════════════════════════════════════════
//  الأنواع
// ════════════════════════════════════════
type Gender = 'male' | 'female' | '';

interface FD {
  full_name: string; gender: Gender; birth_date: string;
  marital_status: number | null; nationality: string;
  country: string; city: string; education_level: number | null;
  occupation_category_id: number | null; occupation_id: number | null;
  financial_status: string; religious_commitment: number | null;
  readiness_level: number | null;
  children_count: number; children_custody: string;
  quran_memorization: string; beard_style: string; prayer_commitment: string;
  hijab_style: string; work_after_marriage: string; polygamy_acceptance: string;
  housing_type: number | null; preferred_housing: string;
  health_status: string; health_habits: string[];
  height: string; weight: string; smoking: string;
  skin_color: string; travel_willingness: string; desire_for_children: string;
  social_type: string; morning_evening: string; home_time: string;
  conflict_style: string; affection_style: string; life_priority: string;
  parenting_style: string; relationship_with_family: string;
  interests: string[]; bio: string; partner_requirements: string;
  avatar_url: string; is_photos_blurred: boolean; show_photos: boolean; phone: string;
  latitude: number | null; longitude: number | null;
}

const INIT: FD = {
  full_name:'', gender:'', birth_date:'', marital_status:null, nationality:'',
  country:'', city:'', education_level:null, occupation_category_id:null,
  occupation_id:null, financial_status:'', religious_commitment:null, readiness_level:null,
  children_count:0, children_custody:'', quran_memorization:'', beard_style:'',
  prayer_commitment:'', hijab_style:'', work_after_marriage:'', polygamy_acceptance:'',
  housing_type:null, preferred_housing:'', health_status:'', health_habits:[],
  height:'', weight:'', smoking:'', skin_color:'', travel_willingness:'',
  desire_for_children:'', social_type:'', morning_evening:'', home_time:'',
  conflict_style:'', affection_style:'', life_priority:'', parenting_style:'',
  relationship_with_family:'', interests:[], bio:'', partner_requirements:'',
  avatar_url:'', is_photos_blurred:false, show_photos:true, phone:'',
  latitude:null, longitude:null,
};

const DRAFT = 'zawaj_v10';
const STEPS = ['الأساسيات', 'التكميل', 'الشخصية', 'الإرسال'];

// ════════════════════════════════════════
//  ثوابت CSS inline مشتركة
// ════════════════════════════════════════
const LINE: React.CSSProperties = {
  width:'100%', background:'transparent', border:'none',
  borderBottom:'1.5px solid var(--input-line)',
  padding:'var(--sp-3) 0', fontSize:'var(--text-base)', fontWeight:500,
  color:'var(--text-main)', caretColor:'var(--color-primary)',
  outline:'none', fontFamily:'inherit',
  WebkitTapHighlightColor:'transparent', transition:'border-color 0.2s',
};

// ════════════════════════════════════════
//  مكوّن: تسمية القسم
// ════════════════════════════════════════
function Lbl({ t, err }: { t: string; err?: boolean }) {
  return (
    <p style={{
      fontSize:'var(--text-2xs)', fontWeight:800, letterSpacing:'0.22em',
      textTransform:'uppercase', marginBottom:'var(--sp-2)',
      color: err ? 'var(--error-text)' : 'var(--text-secondary)',
      opacity: err ? 1 : 0.6,
    }}>{t}</p>
  );
}

// ════════════════════════════════════════
//  مكوّن: حقل نصي — underline
// ════════════════════════════════════════
function Field({
  label, value, onChange, placeholder='', type='text',
  error='', maxLength, inputMode,
}: {
  label:string; value:string; onChange:(v:string)=>void;
  placeholder?:string; type?:string; error?:string;
  maxLength?:number;
  inputMode?:'text'|'numeric'|'decimal'|'tel'|'email';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:24, position:'relative' }}>
      <Lbl t={label} err={!!error} />
      <div style={{ position:'relative' }}>
        <input
          type={type} value={value} dir="auto"
          placeholder={placeholder} maxLength={maxLength} inputMode={inputMode}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...LINE,
            borderBottomColor: error
              ? 'var(--color-accent)'
              : focused ? 'var(--color-primary)' : 'var(--input-line)',
          }}
        />
        {/* خط التركيز المتحرك */}
        <motion.div
          animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position:'absolute', bottom:0, left:0, right:0, height:2,
            background:'var(--color-primary)', borderRadius:2,
            transformOrigin:'left', pointerEvents:'none',
          }}
        />
      </div>
      {error && <p style={{ color:'var(--error-text)', fontSize:'var(--text-xs)', marginTop:'var(--sp-1)' }}>{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════
//  مكوّن: Select — underline style
// ════════════════════════════════════════
function Sel({
  label, value, options, onChange, error, ph='اختر...',
}: {
  label:string; value:string; options:string[];
  onChange:(v:string)=>void; error?:string; ph?:string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const safe = Array.isArray(options) ? options : [];

  useEffect(() => {
    const h = (e:MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ marginBottom:24, position:'relative' }}>
      <Lbl t={label} err={!!error} />
      <button
        type="button" onClick={() => setOpen(o => !o)}
        style={{
          ...LINE, display:'flex', alignItems:'center',
          justifyContent:'space-between', cursor:'pointer',
          borderBottomColor: error ? 'var(--color-accent)'
            : open ? 'var(--color-primary)' : 'var(--input-line)',
        }}
      >
        <span style={{
          color: value ? 'var(--text-main)' : 'var(--input-placeholder)',
          fontWeight: value ? 500 : 400, fontSize:'var(--text-base)',
        }}>{value || ph}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration:0.2 }}>
          <ChevronDown size={16} style={{ color:'var(--color-primary)', opacity:0.7, flexShrink:0 }} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity:0, y:-10, scaleY:0.92 }}
            animate={{ opacity:1, y:0, scaleY:1 }}
            exit={{ opacity:0, y:-10, scaleY:0.92 }}
            transition={{ duration:0.15, ease:[0.4,0,0.2,1] }}
            style={{
              position:'absolute', zIndex:1000, width:'100%',
              top:'calc(100% + 6px)',
              background:'var(--bg-elevated)',
              border:'1px solid var(--border-medium)',
              borderRadius:18, overflow:'hidden',
              boxShadow:`0 24px 60px rgba(0,0,0,0.55), 0 4px 16px var(--shadow-red-glow)`,
              maxHeight:240, overflowY:'auto',
              transformOrigin:'top',
            }}
          >
            {safe.map((o, i) => (
              <button
                key={`${o}-${i}`} type="button"
                onClick={() => { onChange(o); setOpen(false); }}
                style={{
                  width:'100%', textAlign:'right', direction:'rtl',
                  padding:'13px 20px', display:'flex',
                  alignItems:'center', justifyContent:'space-between',
                  background: value===o ? 'var(--color-primary-soft)' : 'transparent',
                  borderBottom: i<safe.length-1 ? '1px solid var(--border-soft)' : 'none',
                  color: value===o ? 'var(--color-primary)' : 'var(--text-main)',
                  fontSize:'var(--text-sm)', fontWeight: value===o ? 600 : 400,
                  fontFamily:'inherit', cursor:'pointer',
                  WebkitTapHighlightColor:'transparent',
                  transition:'background 0.12s',
                }}
              >
                <span>{o}</span>
                {value===o && <Check size={14} style={{ color:'var(--color-primary)', flexShrink:0 }} />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {error && <p style={{ color:'var(--error-text)', fontSize:'var(--text-xs)', marginTop:'var(--sp-1)' }}>{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════
//  مكوّن: Pills — خيارات string[]
// ════════════════════════════════════════
function Pills({
  label, options, value, onChange, error, multi=false, max,
}: {
  label:string; options:string[]; value:string|string[];
  onChange:(v:string|string[])=>void;
  error?:string; multi?:boolean; max?:number;
}) {
  const safe = Array.isArray(options) ? options : [];
  const sel = (o:string) => multi ? (value as string[]).includes(o) : value===o;
  const tap = (o:string) => {
    if (!multi) { onChange(o); return; }
    const a = value as string[];
    if (a.includes(o)) onChange(a.filter(x=>x!==o));
    else if (!max || a.length<max) onChange([...a, o]);
  };
  return (
    <div style={{ marginBottom:24 }}>
      {label && <Lbl t={label} err={!!error} />}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {safe.map(o => {
          const active = sel(o);
          const disabled = multi && !active && (value as string[]).length>=(max??999);
          return (
            <button
              key={o} type="button"
              disabled={disabled} onClick={() => tap(o)}
              style={{
                padding:'9px 20px', borderRadius:999, border:'none', cursor:'pointer',
                background: active ? 'var(--color-primary)' : 'rgba(0,0,0,0)',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                outlineOffset: 0,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize:'var(--text-sm)', fontWeight: active ? 600 : 400,
                fontFamily:'inherit', opacity: disabled ? 0.28 : 1,
                boxShadow: active ? `0 4px 18px var(--shadow-red-glow)` : 'none',
                WebkitTapHighlightColor:'transparent',
                transition:'background 0.15s, color 0.15s, box-shadow 0.15s',
                transform: 'scale(1)',
              }}
              onPointerDown={e=>(e.currentTarget.style.transform='scale(0.93)')}
              onPointerUp={e=>(e.currentTarget.style.transform='scale(1)')}
              onPointerLeave={e=>(e.currentTarget.style.transform='scale(1)')}
            >{o}</button>
          );
        })}
      </div>
      {error && <p style={{ color:'var(--error-text)', fontSize:'var(--text-xs)', marginTop:'var(--sp-1)' }}>{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════
//  مكوّن: Pills — لثوابت {id,...}[]
// ════════════════════════════════════════
function IdPills<T extends {id:number}>({
  label, items, getLabel, value, onChange, error,
}:{
  label:string; items:T[]; getLabel:(item:T)=>string;
  value:number|null; onChange:(id:number)=>void; error?:string;
}) {
  return (
    <div style={{ marginBottom:24 }}>
      {label && <Lbl t={label} err={!!error} />}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {items.map(item => {
          const active = value===item.id;
          return (
            <button
              key={item.id} type="button"
              onClick={() => onChange(item.id)}
              style={{
                padding:'9px 20px', borderRadius:999, border:'none', cursor:'pointer',
                background: active ? 'var(--color-primary)' : 'rgba(0,0,0,0)',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize:'var(--text-sm)', fontWeight: active ? 600 : 400,
                fontFamily:'inherit',
                boxShadow: active ? `0 4px 18px var(--shadow-red-glow)` : 'none',
                WebkitTapHighlightColor:'transparent',
                transition:'background 0.15s, color 0.15s, box-shadow 0.15s',
                transform: 'scale(1)',
              }}
              onPointerDown={e=>(e.currentTarget.style.transform='scale(0.93)')}
              onPointerUp={e=>(e.currentTarget.style.transform='scale(1)')}
              onPointerLeave={e=>(e.currentTarget.style.transform='scale(1)')}
            >{getLabel(item)}</button>
          );
        })}
      </div>
      {error && <p style={{ color:'var(--error-text)', fontSize:'var(--text-xs)', marginTop:'var(--sp-1)' }}>{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════
//  مكوّن: Pills — HOUSING_STATUS {id,label}[]
// ════════════════════════════════════════
function HousingPills({
  value, onChange, error,
}: { value:number|null; onChange:(id:number)=>void; error?:string; }) {
  return (
    <div style={{ marginBottom:24 }}>
      <Lbl t="السكن الحالي" err={!!error} />
      <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
        {HOUSING_STATUS.map(h => {
          const active = value===h.id;
          return (
            <button
              key={h.id} type="button"
              onClick={() => onChange(h.id)}
              style={{
                padding:'9px 20px', borderRadius:999, border:'none', cursor:'pointer',
                background: active ? 'var(--color-primary)' : 'rgba(0,0,0,0)',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize:'var(--text-sm)', fontWeight: active ? 600 : 400,
                fontFamily:'inherit',
                boxShadow: active ? `0 4px 18px var(--shadow-red-glow)` : 'none',
                WebkitTapHighlightColor:'transparent',
                transition:'background 0.15s, color 0.15s, box-shadow 0.15s',
                transform: 'scale(1)',
              }}
              onPointerDown={e=>(e.currentTarget.style.transform='scale(0.93)')}
              onPointerUp={e=>(e.currentTarget.style.transform='scale(1)')}
              onPointerLeave={e=>(e.currentTarget.style.transform='scale(1)')}
            >{h.label}</button>
          );
        })}
      </div>
      {error && <p style={{ color:'var(--error-text)', fontSize:'var(--text-xs)', marginTop:'var(--sp-1)' }}>{error}</p>}
    </div>
  );
}

// ════════════════════════════════════════
//  مكوّن: فاصل القسم
// ════════════════════════════════════════
function Divider({ label }: { label:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, margin:'22px 0 16px' }}>
      <div style={{ flex:1, height:1, background:'var(--border-soft)' }} />
      <span style={{
        fontSize:'var(--text-2xs)', fontWeight:900, letterSpacing:'0.28em',
        color:'var(--color-primary)', opacity:0.8, textTransform:'uppercase',
        whiteSpace:'nowrap',
      }}>{label}</span>
      <div style={{ flex:1, height:1, background:'var(--border-soft)' }} />
    </div>
  );
}

// ════════════════════════════════════════
//  المكوّن الرئيسي
// ════════════════════════════════════════
// ضغط الصورة — يضمن ≤ 200KB
// يبدأ بجودة 0.85 ويخفضها تلقائياً حتى يصل للهدف
async function compressToMax(canvas: HTMLCanvasElement, maxKB = 200): Promise<Blob> {
  const maxBytes = maxKB * 1024;
  let quality = 0.85;
  let blob: Blob | null = null;
  while (quality >= 0.20) {
    blob = await new Promise<Blob | null>(res =>
      canvas.toBlob(res, 'image/webp', quality)
    );
    if (!blob || blob.size <= maxBytes) break;
    quality -= 0.08;
  }
  return blob ?? (await new Promise(res => canvas.toBlob(res, 'image/webp', 0.20)) as Blob);
}

// اقتصاص + ضغط: يأخذ مصدر الصورة وإحداثيات الـ crop
async function cropAndCompress(
  src: string,
  cropX: number, cropY: number,
  cropSize: number,
  outputSize = 600
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    // ✅ إضافة onerror لمنع التعليق الصامت
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
      } catch(e) {
        reject(e);
      }
    };
  });
}


// ════════════════════════════════════════
//  مكوّن: CropModal — اقتصاص الصورة
//  المستخدم يسحب الصورة داخل الدائرة
// ════════════════════════════════════════
function CropModal({
  src, onConfirm, onCancel, validating = false,
}: {
  src: string;
  onConfirm: (cropX:number, cropY:number, cropSize:number) => void;
  onCancel: () => void;
  validating?: boolean;
}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const [loaded,   setLoaded]   = useState(false);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [scale,    setScale]    = useState(1);
  const [dragging, setDragging] = useState(false);
  const lastTouch  = useRef<{ x:number; y:number; dist?:number } | null>(null);

  // حجم الـ canvas = 320 × 320
  const SIZE = 320;

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      // ابدأ بتمركز الصورة
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      setScale(s);
      setOffset({
        x: (SIZE - img.width * s) / 2,
        y: (SIZE - img.height * s) / 2,
      });
      setLoaded(true);
    };
  }, [src]);

  // رسم الصورة مع overlay الدائرة
  useEffect(() => {
    if (!loaded || !imgRef.current) return;
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const img    = imgRef.current;

    // خلفية داكنة
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // الصورة
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
    // ✅ تعتيم خارج الدائرة بـ evenodd — الصورة تظهر دائماً
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, SIZE, SIZE);
    ctx.arc(SIZE/2, SIZE/2, SIZE/2 - 4, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();

    // حلقة الدائرة
    ctx.save();
    ctx.strokeStyle = '#B3334B';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(SIZE/2, SIZE/2, SIZE/2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [loaded, offset, scale]);

  // ── الحركة بالأصبع ──────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      setDragging(true);
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx*dx + dy*dy),
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!lastTouch.current || !imgRef.current) return;
    const img = imgRef.current;

    if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setOffset(o => clampOffset({ x: o.x + dx, y: o.y + dy }, img, scale));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouch.current.dist) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const ratio = dist / lastTouch.current.dist;
      const newScale = Math.min(4, Math.max(SIZE / Math.max(img.width, img.height), scale * ratio));
      setScale(newScale);
      setOffset(o => clampOffset(o, img, newScale));
      lastTouch.current = { ...lastTouch.current, dist };
    }
  };

  const onTouchEnd = () => { setDragging(false); lastTouch.current = null; };

  // ── الحركة بالماوس (ديسكتوب) ────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !lastTouch.current || !imgRef.current) return;
    const dx = e.clientX - lastTouch.current.x;
    const dy = e.clientY - lastTouch.current.y;
    setOffset(o => clampOffset({ x: o.x + dx, y: o.y + dy }, imgRef.current!, scale));
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => { setDragging(false); lastTouch.current = null; };

  // ── تكبير بعجلة الماوس ──────────────────────────────────────
  const onWheel = (e: React.WheelEvent) => {
    if (!imgRef.current) return;
    const newScale = Math.min(4, Math.max(SIZE / Math.max(imgRef.current.width, imgRef.current.height), scale - e.deltaY * 0.001));
    setScale(newScale);
    setOffset(o => clampOffset(o, imgRef.current!, newScale));
  };

  // تأكيد — نحسب إحداثيات الـ crop بالنسبة للصورة الأصلية
  const confirm = () => {
    if (!imgRef.current) return;
    const img    = imgRef.current;
    const cropX  = Math.max(0, -offset.x / scale);
    const cropY  = Math.max(0, -offset.y / scale);
    const cropSz = Math.min(
      SIZE / scale,
      Math.min(img.width - cropX, img.height - cropY)
    );
    onConfirm(cropX, cropY, cropSz);
  };

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:2000,
      background:'rgba(0,0,0,0.88)',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'var(--sp-4)',
    }}>
      <p style={{
        color:'var(--text-secondary)', fontSize:'var(--text-sm)',
        marginBottom:'var(--sp-4)', textAlign:'center',
      }}>
        اسحب الصورة لتحديد موضع الوجه داخل الدائرة
      </p>

      {/* Canvas الاقتصاص */}
      <canvas
        ref={canvasRef}
        width={SIZE} height={SIZE}
        style={{
          borderRadius:'50%',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          maxWidth:'90vw', maxHeight:'90vw',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />

      <p style={{
        color:'rgba(255,255,255,0.35)', fontSize:'var(--text-2xs)',
        margin:'var(--sp-3) 0', textAlign:'center',
      }}>
        قرّب أو بعّد بالأصبعين أو عجلة الماوس
      </p>

      {/* overlay تحميل Gemini */}
      {validating && (
        <div style={{
          position:'absolute', inset:0, zIndex:10,
          background:'rgba(0,0,0,0.75)',
          display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', gap:'var(--sp-3)',
        }}>
          <div style={{
            width:40, height:40, borderRadius:'50%',
            border:'3px solid var(--color-primary)',
            borderTopColor:'transparent',
            animation:'spin 0.8s linear infinite',
          }}/>
          <p style={{color:'#fff', fontSize:'var(--text-sm)', fontWeight:600}}>
            جارٍ فحص الصورة...
          </p>
        </div>
      )}

      {/* الأزرار */}
      <div style={{ display:'flex', gap:'var(--sp-3)', width:'100%', maxWidth:320 }}>
        <button onClick={onCancel} style={{
          flex:1, height:'var(--btn-h)', borderRadius:'var(--radius-md)',
          background:'var(--bg-soft)', border:'1px solid var(--border-medium)',
          color:'var(--text-secondary)', fontSize:'var(--text-sm)', fontWeight:600,
          fontFamily:'inherit', cursor:'pointer',
        }}>إلغاء</button>

        <button onClick={confirm} style={{
          flex:2, height:'var(--btn-h)', borderRadius:'var(--radius-md)',
          background:'var(--color-primary)', border:'none',
          color:'#fff', fontSize:'var(--text-base)', fontWeight:800,
          fontFamily:'inherit', cursor:'pointer',
          boxShadow:`0 4px 16px var(--shadow-red-glow)`,
        }}>تأكيد الصورة</button>
      </div>
    </div>
  );
}

// منع الصورة من الخروج خارج الدائرة
function clampOffset(
  offset: { x:number; y:number },
  img: HTMLImageElement,
  scale: number,
  SIZE = 320
) {
  const w = img.width  * scale;
  const h = img.height * scale;
  return {
    x: Math.min(0, Math.max(SIZE - w, offset.x)),
    y: Math.min(0, Math.max(SIZE - h, offset.y)),
  };
}

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<1|-1>(1);
  const [form, setForm] = useState<FD>(INIT);
  const [errs, setErrs] = useState<Partial<Record<keyof FD,string>>>({});
  const [saving, setSaving] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [imgFile, setImgFile] = useState<File|null>(null);
  const [imgPreview, setImgPreview] = useState('');
  const [cropSrc,  setCropSrc]  = useState('');
  const [intOpts, setIntOpts] = useState<{id:string;label:string}[]>([]);
  const [tag,           setTag]          = useState('');
  const [locating,      setLocating]     = useState(false);
  const [validatingImg, setValidatingImg] = useState(false);
  // ✅ نجلب userId مبكراً حتى يكون متاحاً عند فحص الصورة
  const [userId, setUserId] = useState<string>('');

  // مشتقات
  const isMale   = form.gender==='male';
  const isFemale = form.gender==='female';
  const hasG     = form.gender!=='';
  const isDivorced   = form.marital_status===12||form.marital_status===13;
  const isCommitted  = form.religious_commitment!==null && COMMITTED_LEVELS.includes(form.religious_commitment);
  const specialties  = OCCUPATIONS.find(o=>o.id===form.occupation_category_id)?.specialties??[];
  const cities       = form.country ? (COUNTRIES_CITIES[form.country]??[]) : [];
  const educLabel    = EDUCATION_LEVELS.find(e=>e.id===form.education_level)?.label??'';

  // تحميل المسودة
  useEffect(()=>{
    try{const r=localStorage.getItem(DRAFT);if(r){const p=JSON.parse(r);setStep(p.s??0);setForm(p.f??INIT);}}catch{}
  },[]);
  useEffect(()=>{
    try{localStorage.setItem(DRAFT,JSON.stringify({s:step,f:form}));}catch{}
  },[step,form]);
  useEffect(()=>{
    supabase.from('interests_options').select('id,label').eq('is_active',true)
      .then(({data})=>{if(data)setIntOpts(data);});
  },[]);
  // ✅ جلب userId مبكراً
  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>{
      if(data?.user) setUserId(data.user.id);
    });
  },[]);

  const set = useCallback(<K extends keyof FD>(k:K,v:FD[K])=>{
    setForm(p=>({...p,[k]:v}));setErrs(p=>({...p,[k]:''}));
  },[]);

  // التحقق
  const validate=():boolean=>{
    const e:Partial<Record<keyof FD,string>>={};
    if(step===0){
      const n=form.full_name.trim();
      if(!n) e.full_name='الاسم مطلوب';
      else if(!/^[\u0600-\u06FFa-zA-Z\s]+$/.test(n)) e.full_name='حروف عربية أو إنجليزية فقط';
      else if(n.replace(/\s+/g,'').length<4) e.full_name='لا يقل عن 4 حروف';
      else if(n.replace(/\s+/g,'').length>14) e.full_name='لا يزيد عن 14 حرفاً';
      if(!form.gender) e.gender='مطلوب';
      if(!form.birth_date) e.birth_date='مطلوب';
      else{const age=new Date().getFullYear()-new Date(form.birth_date).getFullYear();
        if(age<18) e.birth_date='18 سنة على الأقل';
        if(age>65) e.birth_date='الحد الأقصى 65 سنة';}
      if(form.marital_status===null)       e.marital_status='مطلوب';
      if(!form.nationality)                e.nationality='مطلوب';
      if(!form.country)                    e.country='مطلوب';
      if(!form.city)                       e.city='مطلوب';
      if(form.education_level===null)      e.education_level='مطلوب';
      if(!form.financial_status)           e.financial_status='مطلوب';
      if(form.religious_commitment===null) e.religious_commitment='مطلوب';
      if(form.readiness_level===null)      e.readiness_level='مطلوب';
    }
    if(step===1&&form.housing_type===null) e.housing_type='مطلوب';
    if(step===3){
      if(!imgFile&&!form.avatar_url) e.avatar_url='الصورة مطلوبة';
      if(!agreed) e.bio='يجب الموافقة على الشروط';
    }
    setErrs(e);return Object.keys(e).length===0;
  };

  const goNext=()=>{if(!validate())return;setSlideDir(1);setStep(s=>Math.min(s+1,3));window.scrollTo({top:0,behavior:'instant'as ScrollBehavior});};
  const goBack=()=>{setSlideDir(-1);setStep(s=>Math.max(s-1,0));window.scrollTo({top:0,behavior:'instant'as ScrollBehavior});};

  const submit=async()=>{
    if(!validate())return;setSaving(true);
    try{
      const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('غير مسجّل');

      // فحص Gemini للنصوص
      const textToCheck = [
        form.full_name && `الاسم: ${form.full_name}`,
        form.bio && `النبذة: ${form.bio}`,
        form.partner_requirements && `المواصفات: ${form.partner_requirements}`,
      ].filter(Boolean).join('\n');
      if(textToCheck){
        const aiCheck = await moderateText(user.id, textToCheck);
        if(!aiCheck.valid){
          toast.error(aiCheck.reason || 'المحتوى يخالف معايير المنصة');
          setSaving(false);
          return;
        }
      }

      // حساب العمر من تاريخ الميلاد
      let age:number|null=null;
      if(form.birth_date){
        const born=new Date(form.birth_date);
        const today=new Date();
        age=today.getFullYear()-born.getFullYear();
        if(today.getMonth()<born.getMonth()||(today.getMonth()===born.getMonth()&&today.getDate()<born.getDate()))age--;
      }

      // رفع الصورة — لا تُعدِّل العمود إن لم يكن هناك ملف أو فشل الرفع
      let avatar_url_update: string | undefined = undefined;
      if(imgFile){
        try{
          const path=`${user.id}_avatar.webp`;
          const{error:upErr}=await supabase.storage
            .from('Avatars').upload(path,imgFile,{upsert:true,cacheControl:'3600'});
          if(!upErr){
            avatar_url_update=supabase.storage.from('Avatars').getPublicUrl(path).data.publicUrl;
          }else{
            toast.error('تعذّر رفع الصورة، سيتم الحفظ بدونها');
          }
        }catch(imgErr){
          toast.error('خطأ في رفع الصورة');
        }
      }

      // حفظ البيانات — دائماً يُنفَّذ
      const payload:Record<string,unknown>={
        full_name:form.full_name, gender:form.gender, birth_date:form.birth_date,
        marital_status:form.marital_status, nationality:form.nationality,
        country:form.country, city:form.city,
        education_level:form.education_level,
        occupation_category_id:form.occupation_category_id,
        occupation_id:form.occupation_id,
        financial_status:form.financial_status,
        religious_commitment:form.religious_commitment,
        readiness_level:form.readiness_level,
        children_count:form.children_count, children_custody:form.children_custody,
        quran_memorization:form.quran_memorization, beard_style:form.beard_style,
        prayer_commitment:form.prayer_commitment, hijab_style:form.hijab_style,
        work_after_marriage:form.work_after_marriage,
        polygamy_acceptance:form.polygamy_acceptance,
        housing_type:form.housing_type, preferred_housing:form.preferred_housing,
        health_status:form.health_status, health_habits:form.health_habits,
        height:form.height?parseFloat(form.height):null,
        weight:form.weight?parseFloat(form.weight):null,
        smoking:form.smoking, skin_color:form.skin_color,
        travel_willingness:form.travel_willingness,
        desire_for_children:form.desire_for_children,
        social_type:form.social_type, morning_evening:form.morning_evening,
        home_time:form.home_time, conflict_style:form.conflict_style,
        affection_style:form.affection_style, life_priority:form.life_priority,
        parenting_style:form.parenting_style,
        relationship_with_family:form.relationship_with_family,
        interests:form.interests, bio:form.bio,
        partner_requirements:form.partner_requirements,
        is_photos_blurred:form.is_photos_blurred,
        show_photos:form.show_photos,
        phone: form.phone ? `${COUNTRY_DIAL[form.country]??''}${form.phone}` : '',
        ...(avatar_url_update ? {avatar_url: avatar_url_update} : {}),
        age,
        is_completed:true,
        updated_at:new Date().toISOString(),
        ...(form.latitude  ? {latitude:  form.latitude}  : {}),
        ...(form.longitude ? {longitude: form.longitude} : {}),
      };

      const{error}=await supabase.from('profiles').update(payload).eq('id',user.id);
      if(error)throw error;
      localStorage.removeItem(DRAFT);
      router.replace('/home');
    }catch(err:any){
      console.error('submit error:',err);
      toast.error(err.message ?? 'حدث خطأ، حاول مجدداً');
      setErrs({bio:err.message??'حدث خطأ، حاول مجدداً'});
    }finally{setSaving(false);}
  };

  // ════════════════════════════════════════
  //  المرحلة 0 — الأساسيات
  // ════════════════════════════════════════
  const S0=(
    <div dir="rtl">
      <Field label="الاسم الكامل" value={form.full_name}
        onChange={v=>set('full_name',v)} placeholder="اكتب اسمك الكامل"
        error={errs.full_name} maxLength={20}/>

      <Divider label="الجنس"/>
      <Pills label="" options={['ذكر','أنثى']}
        value={form.gender==='male'?'ذكر':form.gender==='female'?'أنثى':''}
        onChange={v=>{
          set('gender',v==='ذكر'?'male':'female');
          set('marital_status',null);
          set('religious_commitment',null);
          set('readiness_level',null);
        }}
        error={errs.gender}/>

      <Field label="تاريخ الميلاد" value={form.birth_date}
        onChange={v=>set('birth_date',v)} type="date" error={errs.birth_date}/>

      {hasG&&(
        <IdPills label="الحالة المدنية"
          items={MARITAL_STATUS}
          getLabel={s=>isMale?s.male:s.female}
          value={form.marital_status}
          onChange={id=>set('marital_status',id)}
          error={errs.marital_status}/>
      )}

      <Divider label="الأصل والإقامة"/>
      <Sel label="الجنسية"
        value={form.nationality
          ? (NATIONALITIES[form.nationality]?.[isMale?'male':'female'] ?? form.nationality)
          : ''}
        options={Object.keys(NATIONALITIES).map(k=>NATIONALITIES[k]?.[isMale?'male':'female']??k)}
        onChange={v=>{
          const key=Object.keys(NATIONALITIES).find(k=>
            NATIONALITIES[k]?.male===v||NATIONALITIES[k]?.female===v
          )??v;
          set('nationality',key);
        }}
        error={errs.nationality}/>

      {/* زر تحديد الموقع التلقائي */}
      <div style={{marginBottom:'var(--sp-4)'}}>
        <motion.button type="button" whileTap={{scale:0.97}}
          onClick={async()=>{
            if(locating)return;
            setLocating(true);
            try{
              const loc = await getAutoLocation();
              set('country', loc.country);
              set('city',    loc.city);
              setForm(p=>({...p, latitude:loc.lat, longitude:loc.lon}));
            }catch{
              // toast موجود في getAutoLocation
            }finally{ setLocating(false); }
          }}
          style={{
            width:'100%', padding:'var(--sp-3)',
            borderRadius:'var(--radius-md)',
            background:'var(--color-primary-xsoft)',
            border:'1.5px solid var(--color-primary-soft)',
            color:'var(--color-primary)', fontWeight:700,
            fontSize:'var(--text-sm)', fontFamily:'inherit',
            cursor:locating?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center',
            gap:'var(--sp-2)', opacity: locating ? 0.7 : 1,
            WebkitTapHighlightColor:'transparent',
          }}>
          {locating
            ? <><Loader2 size={16} style={{animation:'spin 0.8s linear infinite'}}/><span>جارٍ التحديد...</span></>
            : <><MapPin size={16}/><span>تحديد موقعي تلقائياً</span></>
          }
        </motion.button>
        <p style={{fontSize:'var(--text-2xs)',color:'var(--text-tertiary)',marginTop:'var(--sp-1)',textAlign:'center'}}>
          أو اختر يدوياً أدناه
        </p>
      </div>

      <Sel label="بلد الإقامة" value={form.country}
        options={ALL_COUNTRIES}
        onChange={v=>{set('country',v);set('city','');set('latitude' as any,null);set('longitude' as any,null);}} error={errs.country}/>

      {form.country&&(
        <Sel label="المدينة" value={form.city}
          options={cities} onChange={v=>set('city',v)}
          error={errs.city} ph="اختر المدينة..."/>
      )}

      {/* رقم الهاتف */}
      {form.country&&(
        <div style={{marginBottom:28}}>
          <Lbl t="رقم الهاتف (اختياري)"/>
          <div dir="ltr" style={{display:'flex',alignItems:'center',borderBottom:'1.5px solid var(--input-line)'}}>
            <span style={{
              color:'var(--text-tertiary)',fontSize:'var(--text-sm)',fontWeight:700,
              padding:'11px 0',paddingRight:10,flexShrink:0,letterSpacing:'0.02em',
              borderRight:'1.5px solid var(--border-soft)',marginRight:10,
            }}>
              {COUNTRY_DIAL[form.country]??''}
            </span>
            <input
              type="tel" inputMode="numeric" dir="ltr"
              value={form.phone}
              onChange={e=>{
                const v=e.target.value.replace(/[^0-9]/g,'');
                set('phone',v);
              }}
              placeholder="XXXXXXXXX"
              maxLength={15}
              style={{...LINE,borderBottom:'none',flex:1,textAlign:'left'}}
            />
          </div>
        </div>
      )}

      <Divider label="التعليم والعمل"/>
      <Sel label="المستوى الدراسي" value={educLabel}
        options={EDUCATION_LEVELS.map(e=>e.label)}
        onChange={v=>{const f=EDUCATION_LEVELS.find(e=>e.label===v);set('education_level',f?.id??null);}}
        error={errs.education_level} ph="اختر المستوى..."/>

      <Sel label="المجال المهني"
        value={OCCUPATIONS.find(o=>o.id===form.occupation_category_id)?.label??''}
        options={OCCUPATIONS.filter(o=>o.id!==0).map(o=>o.label)}
        onChange={v=>{const cat=OCCUPATIONS.find(o=>o.label===v);
          set('occupation_category_id',cat?.id??null);set('occupation_id',null);}}/>

      {specialties.length>0&&(
        <Sel label="الاختصاص"
          value={specialties.find(s=>s.id===form.occupation_id)?.[isMale?'m':'f']??''}
          options={specialties.map(s=>isMale?s.m:s.f)}
          onChange={v=>{const sp=specialties.find(s=>(isMale?s.m:s.f)===v);
            set('occupation_id',sp?.id??null);}}/>
      )}

      <Pills label="الوضع المادي" options={FINANCIAL_STATUS}
        value={form.financial_status} onChange={v=>set('financial_status',v as string)}
        error={errs.financial_status}/>

      <Divider label="الدين والجاهزية"/>
      {hasG&&(
        <>
          <IdPills label="مستوى الالتزام الديني"
            items={RELIGIOUS_COMMITMENT}
            getLabel={r=>isMale?r.male:r.female}
            value={form.religious_commitment}
            onChange={id=>set('religious_commitment',id)}
            error={errs.religious_commitment}/>

          <IdPills label="جاهزية الزواج"
            items={MARRIAGE_READINESS}
            getLabel={r=>isMale?r.male:r.female}
            value={form.readiness_level}
            onChange={id=>set('readiness_level',id)}
            error={errs.readiness_level}/>
        </>
      )}
    </div>
  );

  // ════════════════════════════════════════
  //  المرحلة 1 — التكميلية
  // ════════════════════════════════════════
  const S1=(
    <div dir="rtl">
      {isDivorced&&(
        <>
          <Divider label="الأبناء"/>
          <Pills label="عدد الأبناء"
            options={['لا يوجد','1','2','3','4','+4']}
            value={form.children_count===0?'لا يوجد':form.children_count>4?'+4':`${form.children_count}`}
            onChange={v=>{
              set('children_count',v==='لا يوجد'?0:v==='+4'?5:parseInt(v as string));
              if(v==='لا يوجد')set('children_custody','');
            }}/>
          {form.children_count>0&&(
            <Pills label="الحضانة"
              options={['عندي','عند الوالد الآخر','مشتركة']}
              value={form.children_custody} onChange={v=>set('children_custody',v as string)}/>
          )}
        </>
      )}

      {isCommitted&&(
        <>
          <Divider label="الالتزام الديني"/>
          <Sel label="حفظ القرآن الكريم" value={form.quran_memorization}
            options={QURAN_MEMORIZATION} onChange={v=>set('quran_memorization',v)}/>
          {isMale&&<>
            <Pills label="اللحية" options={BEARD_STYLE}
              value={form.beard_style} onChange={v=>set('beard_style',v as string)}/>
            <Sel label="الصلاة في المسجد" value={form.prayer_commitment}
              options={PRAYER_COMMITMENT} onChange={v=>set('prayer_commitment',v)}/>
          </>}
          {isFemale&&<>
            <Pills label="اللباس" options={HIJAB_STYLE}
              value={form.hijab_style} onChange={v=>set('hijab_style',v as string)}/>
            <Pills label="العمل بعد الزواج" options={WORK_AFTER_MARRIAGE}
              value={form.work_after_marriage} onChange={v=>set('work_after_marriage',v as string)}/>
            <Pills label="قبول التعدد" options={POLYGAMY_ACCEPTANCE}
              value={form.polygamy_acceptance} onChange={v=>set('polygamy_acceptance',v as string)}/>
          </>}
        </>
      )}

      <Divider label="السكن"/>
      <HousingPills value={form.housing_type} onChange={id=>set('housing_type',id)} error={errs.housing_type}/>
      <Pills label="السكن بعد الزواج" options={PREFERRED_HOUSING}
        value={form.preferred_housing} onChange={v=>set('preferred_housing',v as string)}/>

      <Divider label="الصحة"/>
      <Sel label="الحالة الصحية" value={form.health_status}
        options={HEALTH_STATUS_OPTIONS} onChange={v=>set('health_status',v)}/>
      <Pills label="العادات الصحية" options={HEALTH_HABITS}
        value={form.health_habits} onChange={v=>set('health_habits',v as string[])} multi max={3}/>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        <Field label="الطول (سم)" value={form.height}
          onChange={v=>set('height',v)} placeholder="175" inputMode="numeric"/>
        <Field label="الوزن (كغ)" value={form.weight}
          onChange={v=>set('weight',v)} placeholder="70" inputMode="numeric"/>
      </div>
      {isMale&&(
        <Pills label="التدخين" options={SMOKING}
          value={form.smoking} onChange={v=>set('smoking',v as string)}/>
      )}

      <Divider label="معلومات إضافية"/>
      <Pills label="لون البشرة" options={SKIN_COLOR}
        value={form.skin_color} onChange={v=>set('skin_color',v as string)}/>
      <Pills label="القبول بالانتقال" options={TRAVEL_WILLINGNESS}
        value={form.travel_willingness} onChange={v=>set('travel_willingness',v as string)}/>
      <Sel label="الرغبة في الإنجاب" value={form.desire_for_children}
        options={DESIRE_FOR_CHILDREN} onChange={v=>set('desire_for_children',v)}/>
    </div>
  );

  // ════════════════════════════════════════
  //  المرحلة 2 — الشخصية
  // ════════════════════════════════════════
  const S2=(
    <div dir="rtl">
      <p style={{ fontSize:'var(--text-sm)', color:'var(--text-secondary)', opacity:0.55, marginBottom:'var(--sp-6)', lineHeight:'var(--lh-relaxed)' }}>
        اختيارية — تزيد من دقة التوافق
      </p>
      <Pills label="الشخصية الاجتماعية" options={SOCIAL_TYPE}
        value={form.social_type} onChange={v=>set('social_type',v as string)}/>
      <Pills label="صباحي أم مسائي" options={MORNING_EVENING}
        value={form.morning_evening} onChange={v=>set('morning_evening',v as string)}/>
      <Pills label="البيت أم الخروج" options={HOME_TIME}
        value={form.home_time} onChange={v=>set('home_time',v as string)}/>
      <Sel label="أسلوب حل الخلافات" value={form.conflict_style}
        options={CONFLICT_STYLE} onChange={v=>set('conflict_style',v)}/>
      <Pills label="التعبير عن المشاعر" options={AFFECTION_STYLE}
        value={form.affection_style} onChange={v=>set('affection_style',v as string)}/>
      <Sel label="أولويات الحياة" value={form.life_priority}
        options={LIFE_PRIORITY} onChange={v=>set('life_priority',v)}/>
      <Pills label="أسلوب التربية" options={PARENTING_STYLE}
        value={form.parenting_style} onChange={v=>set('parenting_style',v as string)}/>
      <Pills label="العلاقة مع العائلة" options={RELATIONSHIP_WITH_FAMILY}
        value={form.relationship_with_family} onChange={v=>set('relationship_with_family',v as string)}/>

      <Divider label="الاهتمامات"/>
      <p style={{ fontSize:'var(--text-xs)', color:'var(--text-secondary)', opacity:0.45, marginBottom:'var(--sp-3)' }}>حتى 5 اهتمامات</p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
        {intOpts.map(opt=>{
          const sel=form.interests.includes(opt.label);
          return(
            <motion.button key={opt.id} type="button" whileTap={{scale:0.93}}
              disabled={!sel&&form.interests.length>=5}
              onClick={()=>set('interests',sel
                ?form.interests.filter(x=>x!==opt.label)
                :[...form.interests,opt.label])}
              style={{
                padding:'8px 18px', borderRadius:999, border:'none', cursor:'pointer',
                background:sel?'var(--color-primary)':'rgba(179,51,75,0)',
                outline:`1.5px solid ${sel?'var(--color-primary)':'var(--border-medium)'}`,
                color:sel?'#fff':'var(--text-secondary)',
                fontSize:'var(--text-sm)', fontWeight:sel?600:400,
                fontFamily:'inherit', opacity:!sel&&form.interests.length>=5?0.28:1,
                boxShadow:sel?`0 4px 16px var(--shadow-red-glow)`:'none',
                WebkitTapHighlightColor:'transparent',
              }}>{opt.label}</motion.button>
          );
        })}
      </div>
      {/* حقل إضافة اهتمام */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
        <input value={tag} onChange={e=>setTag(e.target.value)} dir="rtl"
          placeholder="اهتمام آخر..." maxLength={20}
          onKeyDown={e=>{
            if(e.key==='Enter'&&tag.trim()&&form.interests.length<5){
              set('interests',[...form.interests,tag.trim()]);setTag('');
            }
          }}
          style={{
            ...LINE, flex:1,
            direction:'rtl',
          }}/>
        <motion.button type="button" whileTap={{scale:0.9}}
          onClick={()=>{if(tag.trim()&&form.interests.length<5){set('interests',[...form.interests,tag.trim()]);setTag('');}}}
          style={{
            width:38,height:38,borderRadius:'50%',background:'var(--color-primary)',
            border:'none',display:'flex',alignItems:'center',justifyContent:'center',
            flexShrink:0,cursor:'pointer',WebkitTapHighlightColor:'transparent',
          }}>
          <Plus size={16} color="#fff"/>
        </motion.button>
      </div>

      <Divider label="نبذة"/>
      {[
        {k:'bio'as keyof FD, lbl:'نبذة عنك', ph:'اكتب نبذة مختصرة...'},
        {k:'partner_requirements'as keyof FD, lbl:'مواصفات الشريك', ph:'ما الذي تبحث عنه...'},
      ].map(({k,lbl,ph})=>(
        <div key={String(k)} style={{ marginBottom:24 }}>
          <Lbl t={`${lbl} (اختياري)`}/>
          <textarea value={form[k] as string} maxLength={300} rows={3} dir="rtl"
            onChange={e=>set(k,e.target.value)} placeholder={ph}
            style={{
              ...LINE, resize:'none', lineHeight:1.75,
              display:'block',
            }}/>
          <p style={{ fontSize:'var(--text-2xs)',color:'var(--text-tertiary)',textAlign:'left',marginTop:'var(--sp-1)' }}>
            {(form[k] as string).length}/300
          </p>
        </div>
      ))}
    </div>
  );

  // ════════════════════════════════════════
  //  المرحلة 3 — الصورة والتأكيد (Premium)
  // ════════════════════════════════════════
  const S3=(
    <div dir="rtl">

      {/* ── بطاقة رفع الصورة ── */}
      <label style={{ display:'block', cursor:'pointer', marginBottom:'var(--sp-5)' }}>
        <input type="file" accept="image/*" style={{ display:'none' }}
          onChange={e=>{
            const f=e.target.files?.[0]; if(!f)return;
            setCropSrc(URL.createObjectURL(f));
            setErrs(p=>({...p,avatar_url:''}));
          }}/>

        <motion.div whileTap={{scale:0.97}} style={{
          position:'relative',
          display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', padding:'var(--sp-8) var(--sp-4)',
          borderRadius:'var(--radius-xl)',
          background: imgPreview
            ? 'var(--color-primary-xsoft)'
            : 'var(--glass-bg)',
          backdropFilter:'var(--glass-blur)',
          WebkitBackdropFilter:'var(--glass-blur)',
          border: `1.5px solid ${
            errs.avatar_url ? 'var(--color-accent)'
            : imgPreview    ? 'var(--color-primary)'
            : 'var(--glass-border)'
          }`,
          boxShadow: imgPreview
            ? `0 0 40px var(--shadow-red-glow), inset 0 1px 0 rgba(255,255,255,0.08)`
            : `var(--shadow-soft), inset 0 1px 0 rgba(255,255,255,0.05)`,
          transition:'all 0.3s ease',
          overflow:'hidden',
        }}>

          {/* بريق خلفي */}
          {!imgPreview && (
            <div style={{
              position:'absolute', top:'-50%', left:'50%',
              transform:'translateX(-50%)',
              width:'60%', height:'100%',
              background:'radial-gradient(ellipse, rgba(179,51,75,0.12) 0%, transparent 70%)',
              pointerEvents:'none',
            }}/>
          )}

          {imgPreview ? (
            <div style={{ position:'relative', zIndex:1 }}>
              {/* الأفاتار مع حلقة ذهبية */}
              <div style={{
                position:'relative',
                padding:3,
                borderRadius:'50%',
                background:'linear-gradient(135deg, var(--color-primary), #D4AF37)',
                boxShadow:`0 8px 32px var(--shadow-red-glow), 0 0 0 1px rgba(212,175,55,0.3)`,
              }}>
                <img src={imgPreview} alt="" style={{
                  width:140, height:140, borderRadius:'50%',
                  objectFit:'cover', display:'block',
                }}/>
              </div>
              {/* زر التغيير */}
              <div style={{
                position:'absolute', bottom:4, right:4,
                width:36, height:36, borderRadius:'50%',
                background:'var(--color-primary)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 4px 12px var(--shadow-red-glow)`,
                border:'2px solid var(--bg-main)',
              }}>
                <Camera size={15} color="#fff"/>
              </div>
              <p style={{
                textAlign:'center', marginTop:'var(--sp-3)',
                fontSize:'var(--text-sm)', fontWeight:600,
                color:'var(--color-primary)',
              }}>اضغط لتغيير الصورة</p>
            </div>
          ) : (
            <div style={{ textAlign:'center', position:'relative', zIndex:1 }}>
              {/* أيقونة الكاميرا */}
              <div style={{
                width:80, height:80, borderRadius:'50%',
                margin:'0 auto var(--sp-4)',
                background:'var(--color-primary-soft)',
                border:'1.5px solid var(--color-primary-soft)',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`0 8px 24px var(--shadow-red-glow)`,
              }}>
                <Camera size={32} style={{color:'var(--color-primary)'}}/>
              </div>
              <p style={{
                fontSize:'var(--text-lg)', fontWeight:700,
                color:'var(--text-main)', marginBottom:'var(--sp-1)',
              }}>أضف صورتك</p>
              <p style={{
                fontSize:'var(--text-xs)', color:'var(--text-tertiary)',
                lineHeight:'var(--lh-relaxed)',
              }}>JPG · PNG · WEBP · حتى 5MB</p>
            </div>
          )}
        </motion.div>
      </label>

      {errs.avatar_url && (
        <p style={{
          color:'var(--error-text)', fontSize:'var(--text-xs)',
          marginBottom:'var(--sp-4)', marginTop:'-var(--sp-2)',
        }}>{errs.avatar_url}</p>
      )}

      {/* ── Crop Modal ── */}
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={async (cropX, cropY, cropSize) => {
            setValidatingImg(true);
            try {
              const file = await cropAndCompress(cropSrc, cropX, cropY, cropSize, 600);
              const b64 = await new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload  = () => res((reader.result as string).split(',')[1]);
                reader.onerror = () => rej(new Error('فشل قراءة الصورة'));
                reader.readAsDataURL(file);
              });
              const check = await moderateImage(userId || 'anonymous', b64, 'image/webp');
              if (!check.valid) {
                toast.error(check.reason || 'الصورة لا تلبي معايير المنصة');
                setCropSrc(''); setValidatingImg(false); return;
              }
              setImgFile(file);
              setImgPreview(URL.createObjectURL(file));
              setCropSrc('');
              toast.success('تم قبول الصورة ✅');
            } catch (e: any) {
              toast.error(e?.message || 'حدث خطأ في معالجة الصورة');
              setCropSrc('');
            } finally { setValidatingImg(false); }
          }}
          onCancel={() => { setCropSrc(''); setValidatingImg(false); }}
          validating={validatingImg}
        />
      )}

      {/* ── إرشادات الصورة ── */}
      <div style={{
        borderRadius:'var(--radius-lg)',
        marginBottom:'var(--sp-4)',
        padding:'var(--sp-4)',
        background:'var(--glass-bg)',
        backdropFilter:'var(--glass-blur)',
        border:'1px solid var(--glass-border)',
      }}>
        <p style={{
          fontSize:'var(--text-2xs)', fontWeight:800,
          letterSpacing:'0.15em', textTransform:'uppercase',
          color:'var(--color-primary)', marginBottom:'var(--sp-2)',
          opacity:0.8,
        }}>معايير الصورة</p>
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-1)' }}>
          {['وجه واضح وإضاءة جيدة','بدون نظارة شمسية أو فلتر','لباس محتشم'].map(txt => (
            <div key={txt} style={{
              display:'flex', alignItems:'center', gap:'var(--sp-2)',
            }}>
              <div style={{
                width:6, height:6, borderRadius:'50%', flexShrink:0,
                background:'var(--color-primary)',
              }}/>
              <p style={{
                fontSize:'var(--text-xs)', color:'var(--text-secondary)',
                lineHeight:'var(--lh-normal)', margin:0,
              }}>{txt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── خيارات الخصوصية ── */}
      <div style={{
        display:'flex', flexDirection:'column', gap:'var(--sp-3)',
        marginBottom:'var(--sp-5)',
      }}>
        {/* تضبيب الصورة */}
        <motion.button type="button" whileTap={{scale:0.97}}
          onClick={()=>set('is_photos_blurred',!form.is_photos_blurred)}
          style={{
            width:'100%',
            background: form.is_photos_blurred ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
            backdropFilter:'var(--glass-blur)',
            border:`1.5px solid ${form.is_photos_blurred ? 'var(--color-primary)' : 'var(--glass-border)'}`,
            borderRadius:'var(--radius-lg)',
            padding:'var(--sp-4)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', transition:'all 0.22s',
            WebkitTapHighlightColor:'transparent',
            boxShadow: form.is_photos_blurred ? `0 4px 16px var(--shadow-red-glow)` : 'none',
            direction:'rtl',
          }}>
          <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
            <div style={{
              width:40, height:40, borderRadius:'var(--radius-md)',
              background: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--bg-soft)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, transition:'all 0.2s',
              boxShadow: form.is_photos_blurred ? `0 4px 12px var(--shadow-red-glow)` : 'none',
            }}>
              <ShieldCheck size={20} color={form.is_photos_blurred ? '#fff' : 'var(--text-tertiary)'}/>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{
                fontSize:'var(--text-sm)', fontWeight:700, margin:0,
                color: form.is_photos_blurred ? 'var(--text-main)' : 'var(--text-secondary)',
              }}>تضبيب الصورة</p>
              <p style={{
                fontSize:'var(--text-2xs)', color:'var(--text-tertiary)',
                margin:'2px 0 0',
              }}>
                {form.is_photos_blurred ? 'مفعّل — صورتك محمية' : 'اضغط لحماية خصوصيتك'}
              </p>
            </div>
          </div>
          {/* Toggle */}
          <div style={{
            width:44, height:24, borderRadius:99, flexShrink:0,
            background: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--bg-elevated)',
            border:'1.5px solid var(--border-soft)',
            position:'relative', transition:'background 0.2s',
          }}>
            <motion.div
              animate={{ x: form.is_photos_blurred ? 20 : 2 }}
              transition={{ type:'spring', stiffness:500, damping:30 }}
              style={{
                position:'absolute', top:2,
                width:16, height:16, borderRadius:'50%',
                background:'#fff',
                boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
              }}/>
          </div>
        </motion.button>

        {/* إظهار صور الأعضاء */}
        <motion.button type="button" whileTap={{scale:0.97}}
          onClick={()=>set('show_photos',!form.show_photos)}
          style={{
            width:'100%',
            background: !form.show_photos ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
            backdropFilter:'var(--glass-blur)',
            border:`1.5px solid ${!form.show_photos ? 'var(--color-primary)' : 'var(--glass-border)'}`,
            borderRadius:'var(--radius-lg)',
            padding:'var(--sp-4)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            cursor:'pointer', transition:'all 0.22s',
            WebkitTapHighlightColor:'transparent',
            direction:'rtl',
          }}>
          <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
            <div style={{
              width:40, height:40, borderRadius:'var(--radius-md)',
              background: !form.show_photos ? 'var(--color-primary)' : 'var(--bg-soft)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, transition:'all 0.2s',
            }}>
              {form.show_photos
                ? <Eye size={20} color="var(--text-tertiary)"/>
                : <EyeOff size={20} color="#fff"/>
              }
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{
                fontSize:'var(--text-sm)', fontWeight:700, margin:0,
                color: !form.show_photos ? 'var(--text-main)' : 'var(--text-secondary)',
              }}>
                {form.show_photos ? 'رؤية صور الأعضاء' : 'إخفاء صور الأعضاء'}
              </p>
              <p style={{
                fontSize:'var(--text-2xs)', color:'var(--text-tertiary)',
                margin:'2px 0 0',
              }}>
                {form.show_photos ? 'ستظهر الصور عادياً' : 'مفعّل — ستُضبَّب كل الصور'}
              </p>
            </div>
          </div>
          <div style={{
            width:44, height:24, borderRadius:99, flexShrink:0,
            background: !form.show_photos ? 'var(--color-primary)' : 'var(--bg-elevated)',
            border:'1.5px solid var(--border-soft)',
            position:'relative', transition:'background 0.2s',
          }}>
            <motion.div
              animate={{ x: !form.show_photos ? 20 : 2 }}
              transition={{ type:'spring', stiffness:500, damping:30 }}
              style={{
                position:'absolute', top:2,
                width:16, height:16, borderRadius:'50%',
                background:'#fff',
                boxShadow:'0 1px 4px rgba(0,0,0,0.3)',
              }}/>
          </div>
        </motion.button>
      </div>

      {/* ── الموافقة على الشروط ── */}
      <motion.button type="button" whileTap={{scale:0.99}}
        onClick={()=>{setAgreed(v=>!v);setErrs(p=>({...p,bio:''}));}}
        style={{
          width:'100%',
          background: agreed ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
          backdropFilter:'var(--glass-blur)',
          border:`1.5px solid ${agreed ? 'var(--color-primary)' : errs.bio ? 'var(--color-accent)' : 'var(--glass-border)'}`,
          borderRadius:'var(--radius-lg)',
          padding:'var(--sp-4)',
          display:'flex', alignItems:'flex-start', gap:'var(--sp-3)',
          cursor:'pointer', transition:'all 0.2s',
          WebkitTapHighlightColor:'transparent',
          boxShadow: agreed ? `0 4px 16px var(--shadow-red-glow)` : 'none',
        }}>
        <motion.div
          animate={{
            background: agreed ? 'var(--color-primary)' : 'rgba(179,51,75,0)',
            borderColor: agreed ? 'var(--color-primary)' : 'var(--border-medium)',
            scale: agreed ? 1.05 : 1,
          }}
          transition={{duration:0.18}}
          style={{
            width:22, height:22, borderRadius:'var(--radius-sm)',
            flexShrink:0, marginTop:2,
            border:'1.5px solid var(--border-medium)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
          <AnimatePresence>
            {agreed && (
              <motion.div
                initial={{scale:0, rotate:-10}}
                animate={{scale:1, rotate:0}}
                exit={{scale:0}}
                transition={{duration:0.14}}>
                <Check size={13} color="#fff" strokeWidth={3}/>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <p style={{
          fontSize:'var(--text-sm)', lineHeight:'var(--lh-relaxed)',
          color: agreed ? 'var(--text-main)' : 'var(--text-secondary)',
          textAlign:'right', flex:1, transition:'color 0.2s',
        }}>
          أقر بصحة المعلومات وأتعهد بالجدية والصدق، وغرضي الزواج الشرعي.
        </p>
      </motion.button>
      {errs.bio && (
        <p style={{
          color:'var(--error-text)', fontSize:'var(--text-xs)',
          marginTop:'var(--sp-2)',
        }}>{errs.bio}</p>
      )}
    </div>
  );

  const CONTENT=[S0,S1,S2,S3];
  const TITLE=['البيانات الأساسية','البيانات التكميلية','الطبع والشخصية','الصورة والتأكيد'];
  const SUB=['أخبرنا عن نفسك','معلومات تزيد دقة النتائج','اختيارية — تحسّن التوافق','الخطوة الأخيرة'];

  // ════════════════════════════════════════
  //  الواجهة الرئيسية
  // ════════════════════════════════════════
  return (
    <div className="bg-luxury-gradient" style={{ minHeight:'100dvh', display:'flex', flexDirection:'column' }}>

      {/* ── PageHeader ثابت ── */}
      <div data-top-bar dir="rtl" style={{
        position:'fixed',top:0,right:0,left:0,zIndex:1000,
        height:'var(--header-h)',
        display:'flex',alignItems:'center',
        padding:'0 var(--sp-2)',
        background:'var(--bg-surface)',
        borderBottom:'1px solid var(--glass-border)',
        backdropFilter:'blur(20px)',
        WebkitBackdropFilter:'blur(20px)',
      }}>
        {/* اسم الواجهة — يمين */}
        <span style={{
          flex:1,color:'var(--text-main)',
          fontSize:'var(--text-lg)',fontWeight:800,
          paddingRight:'var(--sp-2)',
        }}>إعداد الملف</span>

        {/* سهم الرجوع — يسار */}
        {step>0 ? (
          <motion.button whileTap={{scale:0.9}} onClick={goBack} style={{
            width:'var(--btn-h)',height:'var(--btn-h)',
            display:'flex',alignItems:'center',justifyContent:'center',
            borderRadius:'var(--radius-full)',background:'transparent',
            border:'none',cursor:'pointer',color:'var(--text-main)',flexShrink:0,
          }}>
            <ArrowLeft size={20}/>
          </motion.button>
        ) : (
          <div style={{width:'var(--btn-h)'}}/>
        )}
      </div>

      {/* ── StickySubHeader — اسم الخطوة + الشريط الرباعي ── */}
      <div style={{
        position:'sticky',top:'var(--header-h)',zIndex:900,
        background:'var(--bg-surface)',
        borderBottom:'1px solid var(--glass-border)',
        padding:'0 var(--sp-4) var(--sp-2)',
      }}>
        {/* اسم الخطوة الحالية */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:4}}
            transition={{duration:0.13}}
            style={{
              display:'flex',alignItems:'baseline',gap:'var(--sp-2)',
              marginBottom:'var(--sp-2)',paddingTop:'var(--sp-3)',
            }}>
            <span style={{
              fontSize:'var(--text-xl)',fontWeight:900,color:'var(--text-main)',
            }}>{TITLE[step]}</span>
            <span style={{fontSize:'var(--text-sm)',color:'var(--text-tertiary)'}}>
              {step+1}/{STEPS.length}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* الشريط الرباعي */}
        <div style={{display:'flex',gap:5}}>
          {STEPS.map((_,i)=>(
            <motion.div key={i}
              animate={{
                background: i<=step ? 'var(--color-primary)' : 'var(--border-soft)',
                opacity: i<step ? 1 : i===step ? 1 : 0.4,
              }}
              transition={{duration:0.35}}
              style={{flex:1,height:4,borderRadius:'var(--radius-full)'}}/>
          ))}
        </div>
      </div>

      {/* ── المحتوى ── */}
      <div style={{ flex:1, overflow:'hidden', paddingTop:'var(--header-h)' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ x:slideDir*32, opacity:0 }}
            animate={{ x:0, opacity:1 }}
            exit={{ x:slideDir*-32, opacity:0 }}
            transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
            style={{ padding:'var(--sp-4) var(--sp-4) 9rem' }}>

            {/* وصف المرحلة */}
            <motion.p
              initial={{y:8,opacity:0}} animate={{y:0,opacity:1}}
              transition={{delay:0.06,duration:0.22}}
              style={{
                fontSize:'var(--text-sm)',marginBottom:'var(--sp-5)',
                color:'var(--text-secondary)',opacity:0.6,lineHeight:'var(--lh-relaxed)',
                direction:'rtl',margin:'0 0 var(--sp-5)',
              }}>{SUB[step]}</motion.p>

            {CONTENT[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── أزرار التنقل الثابتة ── */}
      <div style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:50,
        padding:'var(--sp-4) var(--sp-5) var(--sp-8)',
        background:`linear-gradient(to top, var(--bg-main) 55%, transparent)`,
        backdropFilter:'blur(4px)',
      }}>
        <div style={{ display:'flex', gap:'var(--sp-3)', alignItems:'center' }}>

          {/* التالي / إرسال — btn-premium */}
          <motion.button
            className="btn-premium"
            whileTap={{scale:0.97}}
            onClick={step===3?submit:goNext}
            disabled={saving}
            style={{
              flex:1,
              height:'var(--btn-h-lg)',
              fontSize:'var(--text-base)',
              fontWeight:800,
              letterSpacing:'0.01em',
              opacity: saving ? 0.6 : 1,
              boxShadow: saving ? 'none' : `0 6px 24px var(--shadow-red-glow)`,
            }}>
            {saving
              ? <div style={{
                  width:20,height:20,borderRadius:'50%',
                  border:'2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor:'#fff',
                  animation:'spin 0.8s linear infinite',
                }}/>
              : step===3
                ? <><Check size={18}/><span>إرسال وابدأ</span></>
                : <><span>التالي</span><ChevronLeft size={18}/></>
            }
          </motion.button>

          {/* تخطي */}
          {step===2 && (
            <motion.button whileTap={{scale:0.93}} onClick={goNext}
              style={{
                height:'var(--btn-h-lg)',
                padding:'0 var(--sp-5)',
                borderRadius:'var(--radius-lg)',
                flexShrink:0,
                background:'var(--glass-bg)',
                backdropFilter:'var(--glass-blur)',
                border:'1px solid var(--glass-border)',
                color:'var(--text-tertiary)',
                fontSize:'var(--text-sm)',fontWeight:600,
                fontFamily:'inherit',cursor:'pointer',
                WebkitTapHighlightColor:'transparent',
              }}>
              تخطي
            </motion.button>
          )}
        </div>
      </div>

      <style>{`
  @keyframes spin{to{transform:rotate(360deg)}}
  :root { --error-text: #FF6B6B; }
  html.light { --error-text: #C0392B; }
`}</style>
    </div>
  );
}
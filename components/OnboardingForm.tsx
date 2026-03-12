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
  ChevronLeft, ChevronRight, ChevronDown,
  Check, Camera, Plus, Eye, EyeOff, ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
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
  avatar_url: string; is_photos_blurred: boolean; phone: string;
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
  avatar_url:'', is_photos_blurred:false, phone:'',
};

const DRAFT = 'zawaj_v10';
const STEPS = ['الأساسيات', 'التكميل', 'الشخصية', 'الإرسال'];

// ════════════════════════════════════════
//  ثوابت CSS inline مشتركة
// ════════════════════════════════════════
const LINE: React.CSSProperties = {
  width:'100%', background:'transparent', border:'none',
  borderBottom:'1.5px solid var(--input-line)',
  padding:'11px 0', fontSize:16, fontWeight:500,
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
      fontSize:10.5, fontWeight:800, letterSpacing:'0.22em',
      textTransform:'uppercase', marginBottom:10,
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
      {error && <p style={{ color:'var(--error-text)', fontSize:11, marginTop:6 }}>{error}</p>}
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
          fontWeight: value ? 500 : 400, fontSize:16,
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
                  fontSize:14, fontWeight: value===o ? 600 : 400,
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
      {error && <p style={{ color:'var(--error-text)', fontSize:11, marginTop:6 }}>{error}</p>}
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
            <motion.button
              key={o} type="button" whileTap={{ scale:0.93 }}
              disabled={disabled} onClick={() => tap(o)}
              style={{
                padding:'9px 20px', borderRadius:999, border:'none', cursor:'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                outlineOffset: 0,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize:13.5, fontWeight: active ? 600 : 400,
                fontFamily:'inherit', opacity: disabled ? 0.28 : 1,
                boxShadow: active ? `0 4px 18px var(--shadow-red-glow)` : 'none',
                WebkitTapHighlightColor:'transparent',
                transition:'all 0.15s',
              }}
            >{o}</motion.button>
          );
        })}
      </div>
      {error && <p style={{ color:'var(--error-text)', fontSize:11, marginTop:6 }}>{error}</p>}
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
            <motion.button
              key={item.id} type="button" whileTap={{ scale:0.93 }}
              onClick={() => onChange(item.id)}
              style={{
                padding:'9px 20px', borderRadius:999, border:'none', cursor:'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize:13.5, fontWeight: active ? 600 : 400,
                fontFamily:'inherit',
                boxShadow: active ? `0 4px 18px var(--shadow-red-glow)` : 'none',
                WebkitTapHighlightColor:'transparent',
                transition:'all 0.15s',
              }}
            >{getLabel(item)}</motion.button>
          );
        })}
      </div>
      {error && <p style={{ color:'var(--error-text)', fontSize:11, marginTop:6 }}>{error}</p>}
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
            <motion.button
              key={h.id} type="button" whileTap={{ scale:0.93 }}
              onClick={() => onChange(h.id)}
              style={{
                padding:'9px 20px', borderRadius:999, border:'none', cursor:'pointer',
                background: active ? 'var(--color-primary)' : 'transparent',
                outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--border-medium)'}`,
                color: active ? '#fff' : 'var(--text-secondary)',
                fontSize:13.5, fontWeight: active ? 600 : 400,
                fontFamily:'inherit',
                boxShadow: active ? `0 4px 18px var(--shadow-red-glow)` : 'none',
                WebkitTapHighlightColor:'transparent',
                transition:'all 0.15s',
              }}
            >{h.label}</motion.button>
          );
        })}
      </div>
      {error && <p style={{ color:'var(--error-text)', fontSize:11, marginTop:6 }}>{error}</p>}
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
        fontSize:9.5, fontWeight:900, letterSpacing:'0.28em',
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
// ضغط الصورة تلقائياً قبل الرفع (800px · WebP · جودة 82%)
async function compressImage(file: File): Promise<File> {
  return new Promise(resolve => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        resolve(new File([blob!], 'avatar.webp', { type: 'image/webp' }));
      }, 'image/webp', 0.82);
    };
  });
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
  const [intOpts, setIntOpts] = useState<{id:string;label:string}[]>([]);
  const [tag, setTag] = useState('');

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

      // حساب العمر من تاريخ الميلاد
      let age:number|null=null;
      if(form.birth_date){
        const born=new Date(form.birth_date);
        const today=new Date();
        age=today.getFullYear()-born.getFullYear();
        if(today.getMonth()<born.getMonth()||(today.getMonth()===born.getMonth()&&today.getDate()<born.getDate()))age--;
      }

      // رفع الصورة — اختياري، لا يوقف الحفظ إن فشل
      let avatar_url=form.avatar_url;
      if(imgFile){
        try{
          // الامتداد دائماً webp بعد الضغط
          const path=`${user.id}_avatar.webp`;
          const{error:upErr,data:upData}=await supabase.storage
            .from('Avatars').upload(path,imgFile,{upsert:true,cacheControl:'3600'});
          if(!upErr){
            avatar_url=supabase.storage.from('Avatars').getPublicUrl(path).data.publicUrl;
          }else{
            console.warn('تحذير رفع الصورة:',upErr.message);
            // نكمل الحفظ بدون صورة
          }
        }catch(imgErr){
          console.warn('خطأ رفع الصورة (تم تجاهله):',imgErr);
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
        phone: form.phone ? `${COUNTRY_DIAL[form.country]??''}${form.phone}` : '',
        avatar_url, age,
        is_completed:true,
        updated_at:new Date().toISOString(),
      };

      const{error}=await supabase.from('profiles').update(payload).eq('id',user.id);
      if(error)throw error;
      localStorage.removeItem(DRAFT);
      router.replace('/home');
    }catch(err:any){
      console.error('submit error:',err);
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

      <Sel label="بلد الإقامة" value={form.country}
        options={ALL_COUNTRIES}
        onChange={v=>{set('country',v);set('city','');}} error={errs.country}/>

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
              color:'var(--text-tertiary)',fontSize:14,fontWeight:700,
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
      <p style={{ fontSize:13, color:'var(--text-secondary)', opacity:0.55, marginBottom:28, lineHeight:1.75 }}>
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
      <p style={{ fontSize:11.5, color:'var(--text-secondary)', opacity:0.45, marginBottom:14 }}>حتى 5 اهتمامات</p>
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
                background:sel?'var(--color-primary)':'transparent',
                outline:`1.5px solid ${sel?'var(--color-primary)':'var(--border-medium)'}`,
                color:sel?'#fff':'var(--text-secondary)',
                fontSize:13, fontWeight:sel?600:400,
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
          <p style={{ fontSize:10.5,color:'var(--text-tertiary)',textAlign:'left',marginTop:4 }}>
            {(form[k] as string).length}/300
          </p>
        </div>
      ))}
    </div>
  );

  // ════════════════════════════════════════
  //  المرحلة 3 — الصورة والتأكيد
  // ════════════════════════════════════════
  const S3=(
    <div dir="rtl">
      {/* رفع الصورة */}
      <label style={{ display:'block', cursor:'pointer', marginBottom:24 }}>
        <input type="file" accept="image/*" style={{ display:'none' }}
          onChange={async e=>{
            const f=e.target.files?.[0]; if(!f)return;
            const compressed = await compressImage(f);
            setImgFile(compressed);
            setImgPreview(URL.createObjectURL(compressed));
            setErrs(p=>({...p,avatar_url:''}));
          }}/>
        <motion.div whileTap={{scale:0.98}} style={{
          display:'flex',flexDirection:'column',alignItems:'center',
          justifyContent:'center',padding:'44px 20px',
          border:`1.5px dashed ${errs.avatar_url?'var(--color-accent)':imgPreview?'var(--color-primary)':'var(--border-medium)'}`,
          borderRadius:24,background:imgPreview?'transparent':'var(--bg-soft)',
          transition:'border-color 0.2s',
        }}>
          {imgPreview?(
            <div style={{ position:'relative' }}>
              <img src={imgPreview} alt="" style={{
                width:148,height:148,borderRadius:'50%',objectFit:'cover',
                border:'3px solid var(--color-primary)',
                boxShadow:`0 8px 32px var(--shadow-red-glow)`,
              }}/>
              <div style={{
                position:'absolute',bottom:4,right:4,
                width:36,height:36,borderRadius:'50%',
                background:'var(--color-primary)',
                display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:`0 4px 12px var(--shadow-red-glow)`,
              }}>
                <Camera size={15} color="#fff"/>
              </div>
            </div>
          ):(
            <>
              <div style={{
                width:64,height:64,borderRadius:'50%',marginBottom:14,
                background:'var(--color-primary-soft)',
                border:'1.5px solid var(--color-primary-soft)',
                display:'flex',alignItems:'center',justifyContent:'center',
              }}>
                <Camera size={26} style={{color:'var(--color-primary)',opacity:0.8}}/>
              </div>
              <p style={{fontSize:15,fontWeight:500,color:'var(--text-secondary)',marginBottom:4}}>اضغط لاختيار صورة</p>
              <p style={{fontSize:11.5,color:'var(--text-tertiary)'}}>JPG · PNG · WEBP</p>
            </>
          )}
        </motion.div>
      </label>
      {errs.avatar_url&&<p style={{color:'var(--error-text)',fontSize:11,marginBottom:16}}>{errs.avatar_url}</p>}

      {/* إرشادات */}
      <div style={{
        padding:'14px 18px',borderRadius:16,marginBottom:24,
        background:'var(--color-primary-xsoft)',
        border:'1px solid var(--color-primary-soft)',
      }}>
        <p style={{fontSize:12.5,color:'var(--text-secondary)',opacity:0.85,lineHeight:1.85}}>
          صورة واضحة · إضاءة جيدة · بدون نظارة شمسية · بدون فلتر يغير الملامح
        </p>
      </div>

      {/* تبديل التضبيب — أيقونة درع تتغير لوناً */}
      <motion.button type="button" whileTap={{scale:0.96}}
        onClick={()=>set('is_photos_blurred',!form.is_photos_blurred)}
        style={{
          width:'100%',background:form.is_photos_blurred?'var(--color-primary-xsoft)':'transparent',
          border:`1.5px solid ${form.is_photos_blurred?'var(--color-primary-soft)':'var(--border-medium)'}`,
          borderRadius:16,padding:'14px 18px',
          display:'flex',alignItems:'center',justifyContent:'space-between',
          cursor:'pointer',transition:'all 0.22s',
          WebkitTapHighlightColor:'transparent',marginBottom:24,
          direction:'rtl',
        }}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <motion.div
            animate={{
              color: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--text-tertiary)',
            }}
            transition={{duration:0.2}}
            style={{display:'flex',alignItems:'center',flexShrink:0}}
          >
            <ShieldCheck size={22}
              color={form.is_photos_blurred ? 'var(--color-primary)' : 'var(--text-tertiary)'}
            />
          </motion.div>
          <div style={{textAlign:'right'}}>
            <p style={{
              fontSize:14,fontWeight:600,margin:0,
              color: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--text-main)',
              transition:'color 0.2s',
            }}>
              تضبيب الصورة
            </p>
            <p style={{fontSize:11.5,color:'var(--text-tertiary)',margin:'2px 0 0',lineHeight:1.4}}>
              {form.is_photos_blurred ? 'مفعّل — صورتك محمية' : 'اضغط لحماية خصوصيتك'}
            </p>
          </div>
        </div>
        {/* مؤشر الحالة */}
        <motion.div
          animate={{
            background: form.is_photos_blurred ? 'var(--color-primary)' : 'transparent',
            borderColor: form.is_photos_blurred ? 'var(--color-primary)' : 'var(--border-medium)',
          }}
          transition={{duration:0.2}}
          style={{
            width:22,height:22,borderRadius:6,flexShrink:0,
            border:'1.5px solid var(--border-medium)',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}
        >
          <AnimatePresence>
            {form.is_photos_blurred&&(
              <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} transition={{duration:0.14}}>
                <Check size={12} color="#fff"/>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>

      {/* الموافقة */}
      <motion.button type="button" whileTap={{scale:0.99}}
        onClick={()=>{setAgreed(v=>!v);setErrs(p=>({...p,bio:''}));}}
        style={{
          width:'100%',background:agreed?'var(--color-primary-xsoft)':'transparent',
          border:`1.5px solid ${agreed?'var(--color-primary-soft)':errs.bio?'var(--color-accent)':'var(--border-medium)'}`,
          borderRadius:16,padding:'16px 18px',
          display:'flex',alignItems:'flex-start',gap:14,
          cursor:'pointer',transition:'all 0.2s',
          WebkitTapHighlightColor:'transparent',
        }}>
        <motion.div
          animate={{
            background:agreed?'var(--color-primary)':'transparent',
            borderColor:agreed?'var(--color-primary)':'var(--border-medium)',
          }}
          transition={{duration:0.18}}
          style={{
            width:20,height:20,borderRadius:6,flexShrink:0,marginTop:2,
            border:'1.5px solid var(--border-medium)',
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
          <AnimatePresence>
            {agreed&&(
              <motion.div initial={{scale:0}} animate={{scale:1}} exit={{scale:0}} transition={{duration:0.14}}>
                <Check size={11} color="#fff"/>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <p style={{fontSize:13,lineHeight:1.8,color:'var(--text-secondary)',textAlign:'right',flex:1}}>
          أقر بصحة المعلومات وأتعهد بالجدية والصدق، وغرضي الزواج الشرعي.
        </p>
      </motion.button>
      {errs.bio&&<p style={{color:'var(--error-text)',fontSize:11,marginTop:8}}>{errs.bio}</p>}
    </div>
  );

  const CONTENT=[S0,S1,S2,S3];
  const TITLE=['البيانات الأساسية','البيانات التكميلية','الطبع والشخصية','الصورة والتأكيد'];
  const SUB=['أخبرنا عن نفسك','معلومات تزيد دقة النتائج','اختيارية — تحسّن التوافق','الخطوة الأخيرة'];

  // ════════════════════════════════════════
  //  الواجهة الرئيسية
  // ════════════════════════════════════════
  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', background:'var(--bg-luxury-gradient)f' }}>

      {/* ── هيدر ثابت ── */}
      <div style={{
        position:'sticky',top:0,zIndex:50,
        background:'var(--bg-main)',
        borderBottom:'1px solid var(--border-soft)',
      }}>
        {/* شريط التقدم */}
        <div style={{ display:'flex', gap:5, padding:'14px 20px 0' }}>
          {STEPS.map((_,i)=>(
            <motion.div key={i}
              animate={{
                background: i<=step ? 'var(--color-primary)' : 'var(--border-soft)',
                opacity: i<step ? 1 : i===step ? 1 : 0.3,
              }}
              transition={{ duration:0.35 }}
              style={{ flex:1, height:2.5, borderRadius:99 }}/>
          ))}
        </div>
        {/* عنوان الخطوة */}
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'8px 20px 12px',
        }}>
          <p style={{
            fontSize:10,fontWeight:900,letterSpacing:'0.2em',
            color:'var(--color-primary)',textTransform:'uppercase',
          }}>{STEPS[step]}</p>
          <p style={{ fontSize:11,color:'var(--text-tertiary)' }}>
            {step+1}<span style={{opacity:0.5}}> / {STEPS.length}</span>
          </p>
        </div>
      </div>

      {/* ── المحتوى ── */}
      <div style={{ flex:1, overflow:'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ x:slideDir*32, opacity:0 }}
            animate={{ x:0, opacity:1 }}
            exit={{ x:slideDir*-32, opacity:0 }}
            transition={{ duration:0.22, ease:[0.4,0,0.2,1] }}
            style={{ padding:'18px 18px 148px' }}>

            {/* عنوان المرحلة */}
            <motion.div style={{ marginBottom:20, direction:'rtl' }}
              initial={{ y:10, opacity:0 }}
              animate={{ y:0, opacity:1 }}
              transition={{ delay:0.06, duration:0.24 }}>
              <h1 style={{
                fontSize:28, fontWeight:900, lineHeight:1.2,
                color:'var(--text-main)', letterSpacing:'-0.02em',
                margin:0,
              }}>{TITLE[step]}</h1>
              <p style={{
                fontSize:14, marginTop:8,
                color:'var(--text-secondary)', opacity:0.55, lineHeight:1.65,
              }}>{SUB[step]}</p>
            </motion.div>

            {CONTENT[step]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── أزرار التنقل الثابتة ── */}
      <div style={{
        position:'fixed',bottom:0,left:0,right:0,zIndex:50,
        padding:'16px 24px 36px',
        background:`linear-gradient(to top, var(--bg-main) 62%, transparent)`,
      }}>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>

          {/* رجوع */}
          {step>0&&(
            <motion.button whileTap={{scale:0.92}} onClick={goBack}
              style={{
                width:54,height:56,borderRadius:18,flexShrink:0,
                background:'var(--bg-soft)',
                border:'1px solid var(--border-medium)',
                display:'flex',alignItems:'center',justifyContent:'center',
                cursor:'pointer',WebkitTapHighlightColor:'transparent',
              }}>
              <ChevronRight size={21} style={{color:'var(--text-secondary)'}}/>
            </motion.button>
          )}

          {/* التالي / إرسال */}
          <motion.button whileTap={{scale:0.97}}
            onClick={step===3?submit:goNext} disabled={saving}
            style={{
              flex:1,height:56,borderRadius:18,border:'none',cursor:'pointer',
              display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              color:'#fff',fontSize:15.5,fontWeight:800,letterSpacing:'0.01em',fontFamily:'inherit',
              background:saving?'rgba(164,22,26,0.45)':'var(--color-primary)',
              boxShadow:saving?'none':`0 6px 24px var(--shadow-red-glow)`,
              WebkitTapHighlightColor:'transparent',
              transition:'box-shadow 0.2s',
            }}>
            {saving
              ?<div style={{
                  width:20,height:20,borderRadius:'50%',
                  border:'2.5px solid rgba(255,255,255,0.3)',
                  borderTopColor:'#fff',
                  animation:'spin 0.8s linear infinite',
                }}/>
              :step===3
                ?<><Check size={18}/><span>إرسال وابدأ</span></>
                :<><span>التالي</span><ChevronLeft size={18}/></>
            }
          </motion.button>

          {/* تخطي */}
          {step===2&&(
            <motion.button whileTap={{scale:0.93}} onClick={goNext}
              style={{
                height:56,padding:'0 20px',borderRadius:18,flexShrink:0,
                background:'var(--bg-soft)',
                border:'1px solid var(--border-medium)',
                color:'var(--text-tertiary)',fontSize:14,fontWeight:600,
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
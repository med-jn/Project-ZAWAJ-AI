'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, User, ShieldCheck, Briefcase, Activity, Heart,
  Camera, Trash2, Star, Eye, EyeOff, CheckCircle2, AlertCircle,
  Save, Loader2, ImagePlus, X, Check, Info
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import {


} from '../lib/constants/constants';
import { COUNTRIES_CITIES } from '../lib/constants/countries';

/* ══════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════ */
interface ProfileData {
  id?: string;
  username?: string;
  full_name?: string;
  age?: number;
  gender?: 'male' | 'female';
  country?: string;
  city?: string;
  marital_status?: string;
  children_count?: string;
  religious_commitment?: string;
  marriage_readiness?: string;
  housing_status?: string;
  want_children?: string;
  health_condition?: string;
  health_habits?: string;
  height?: string;
  weight?: string;
  education_level?: string;
  work_type?: string;
  job_title?: string;
  bio?: string;
  partner_specs?: string;
  avatar_url?: string;
  images?: string[];
  is_blurred?: boolean;
}

interface PhotoSlot {
  url: string;       // URL الفعلي
  file?: File;       // ملف جديد قبل الرفع
  isAvatar: boolean;
  isBlurred: boolean;
  uploading?: boolean;
}

/* ══════════════════════════════════════════════════════════════
   HELPERS — Glass 3D
══════════════════════════════════════════════════════════════ */
const glassCard: React.CSSProperties = {
  background: 'linear-gradient(145deg,rgba(255,255,255,0.82) 0%,rgba(255,255,255,0.62) 100%)',
  backdropFilter: 'blur(28px) saturate(160%)',
  WebkitBackdropFilter: 'blur(28px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.78)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 4px 24px rgba(0,0,0,0.07)',
  borderRadius: '2rem',
};

const glassInput: React.CSSProperties = {
  background: 'linear-gradient(145deg,rgba(255,255,255,0.90),rgba(248,246,255,0.75))',
  border: '1px solid rgba(255,255,255,0.85)',
  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.055), inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.04)',
  borderRadius: '1rem',
  outline: 'none',
  fontFamily: 'Cairo, sans-serif',
  color: 'rgba(20,10,40,0.85)',
  fontWeight: '700',
  fontSize: '0.92rem',
  width: '100%',
  padding: '13px 16px',
  transition: 'all 0.2s',
};

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */
const SectionHeader = ({
  icon, title, color = '#ec4899'
}: { icon: React.ReactNode; title: string; color?: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
      style={{
        background: `linear-gradient(145deg,${color}22,${color}10)`,
        border: `1.5px solid ${color}35`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px ${color}18`,
        color,
      }}>
      {icon}
    </div>
    <h3 className="font-black text-[16px]"
      style={{ color: 'rgba(20,10,40,0.82)', fontFamily: 'Cairo', borderRight: `3px solid ${color}`, paddingRight: '10px' }}>
      {title}
    </h3>
  </div>
);

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11.5px] font-black mb-1.5 tracking-wider uppercase"
    style={{ color: 'rgba(20,10,40,0.42)', fontFamily: 'Cairo' }}>
    {children}
  </label>
);

const GlassSelect = ({
  label, value, onChange, options, disabled
}: { label: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none w-full cursor-pointer transition-all"
        style={{ ...glassInput, paddingLeft: '36px', opacity: disabled ? 0.5 : 1 }}
        onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(219,39,119,0.45)'; e.currentTarget.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.05), 0 0 0 3px rgba(219,39,119,0.10)'; }}
        onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.85)'; e.currentTarget.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.055), inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.04)'; }}
      >
        <option value="">— اختر —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'rgba(20,10,40,0.35)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  </div>
);

const GlassInput = ({
  label, value, onChange, placeholder, type = 'text'
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={glassInput}
      onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(219,39,119,0.45)'; e.currentTarget.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.05), 0 0 0 3px rgba(219,39,119,0.10)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.85)'; e.currentTarget.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.055), inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.04)'; }}
    />
  </div>
);

const GlassTextarea = ({
  label, value, onChange, placeholder
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      style={{ ...glassInput, resize: 'none', lineHeight: '1.7' }}
      onFocus={e => { e.currentTarget.style.border = '1.5px solid rgba(219,39,119,0.45)'; e.currentTarget.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.05), 0 0 0 3px rgba(219,39,119,0.10)'; }}
      onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.85)'; e.currentTarget.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.055), inset 0 1px 0 rgba(255,255,255,0.9), 0 1px 3px rgba(0,0,0,0.04)'; }}
    />
  </div>
);

/* ══════════════════════════════════════════════════════════════
   PHOTO MANAGER COMPONENT
══════════════════════════════════════════════════════════════ */
const PhotoManager = ({
  userId,
  photos,
  onPhotosChange,
}: {
  userId: string;
  photos: PhotoSlot[];
  onPhotosChange: (photos: PhotoSlot[]) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_PHOTOS = 3;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);

    const newSlots: PhotoSlot[] = toAdd.map((file) => ({
      url: URL.createObjectURL(file),
      file,
      isAvatar: photos.length === 0,  // أول صورة تكون أفاتار تلقائياً
      isBlurred: false,
      uploading: false,
    }));

    onPhotosChange([...photos, ...newSlots]);
    e.target.value = '';
  };

  const removePhoto = (idx: number) => {
    const updated = photos.filter((_, i) => i !== idx);
    // إذا حُذف الأفاتار اجعل الأولى أفاتار
    if (photos[idx].isAvatar && updated.length > 0) {
      updated[0].isAvatar = true;
    }
    onPhotosChange(updated);
  };

  const setAvatar = (idx: number) => {
    onPhotosChange(photos.map((p, i) => ({ ...p, isAvatar: i === idx })));
  };

  const toggleBlur = (idx: number) => {
    onPhotosChange(photos.map((p, i) => i === idx ? { ...p, isBlurred: !p.isBlurred } : p));
  };

  return (
    <div>
      {/* إرشادات الصور */}
      <div className="flex items-start gap-3 p-4 rounded-2xl mb-5"
        style={{
          background: 'linear-gradient(135deg,rgba(251,191,36,0.10),rgba(251,191,36,0.05))',
          border: '1px solid rgba(251,191,36,0.28)',
        }}>
        <Info size={16} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontFamily: 'Cairo' }}>
          <p className="font-black text-[12.5px] mb-1" style={{ color: '#92400e' }}>إرشادات الصور</p>
          <ul className="space-y-0.5">
            {[
              'صورة شخصية واضحة للوجه بإضاءة جيدة',
              'تجنب الصور المجموعية أو ذات الخلفية المشوشة',
              'لا تستخدم صور مفلترة بشكل مبالغ فيه',
              'يمكنك تفعيل الضبابية لإخفاء صورتك عن غير المطابقين',
            ].map((tip, i) => (
              <li key={i} className="flex items-center gap-1.5 text-[11.5px]" style={{ color: 'rgba(120,80,20,0.75)' }}>
                <Check size={10} style={{ color: '#d97706', flexShrink: 0 }} />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* شبكة الصور */}
      <div className="grid grid-cols-3 gap-3">
        {/* الصور الموجودة */}
        {photos.map((photo, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden group"
            style={{
              border: photo.isAvatar
                ? '2px solid rgba(219,39,119,0.7)'
                : '1.5px solid rgba(255,255,255,0.75)',
              boxShadow: photo.isAvatar
                ? '0 0 0 3px rgba(219,39,119,0.15), 0 6px 20px rgba(0,0,0,0.12)'
                : '0 4px 14px rgba(0,0,0,0.09)',
            }}
          >
            {/* الصورة */}
            <img
              src={photo.url}
              alt={`صورة ${idx + 1}`}
              className="w-full h-full object-cover transition-all duration-300"
              style={{ filter: photo.isBlurred ? 'blur(8px)' : 'none' }}
            />

            {/* طبقة الضبابية */}
            {photo.isBlurred && (
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ background: 'rgba(0,0,0,0.15)' }}>
                <div className="px-2 py-1 rounded-lg text-[10px] font-black text-white"
                  style={{ background: 'rgba(0,0,0,0.45)' }}>
                  ضبابي 🔒
                </div>
              </div>
            )}

            {/* شارة الأفاتار */}
            {photo.isAvatar && (
              <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white"
                style={{ background: 'linear-gradient(135deg,#ec4899,#db2777)', boxShadow: '0 2px 8px rgba(219,39,119,0.5)' }}>
                <Star size={8} fill="white" /> أفاتار
              </div>
            )}

            {/* أدوات التحكم — تظهر عند hover */}
            <div className="absolute inset-0 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
              style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.55) 0%,transparent 50%)' }}>

              {/* أعلى: حذف */}
              <div className="flex justify-end">
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => removePhoto(idx)}
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.85)', border: '1px solid rgba(255,100,100,0.5)' }}>
                  <Trash2 size={12} className="text-white" />
                </motion.button>
              </div>

              {/* أسفل: أفاتار + ضبابية */}
              <div className="flex gap-1.5">
                {!photo.isAvatar && (
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setAvatar(idx)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[9px] font-black text-white"
                    style={{ background: 'rgba(219,39,119,0.85)' }}>
                    <Star size={9} /> أفاتار
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.88 }}
                  onClick={() => toggleBlur(idx)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[9px] font-black text-white"
                  style={{ background: photo.isBlurred ? 'rgba(16,185,129,0.85)' : 'rgba(100,116,139,0.85)' }}>
                  {photo.isBlurred ? <Eye size={9} /> : <EyeOff size={9} />}
                  {photo.isBlurred ? 'إظهار' : 'ضبابي'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* خانة الإضافة */}
        {photos.length < MAX_PHOTOS && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[3/4] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(145deg,rgba(255,255,255,0.65),rgba(248,246,255,0.50))',
              border: '1.5px dashed rgba(219,39,119,0.35)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(219,39,119,0.6)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(145deg,rgba(255,255,255,0.80),rgba(253,242,248,0.65))'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(219,39,119,0.35)'; (e.currentTarget as HTMLElement).style.background = 'linear-gradient(145deg,rgba(255,255,255,0.65),rgba(248,246,255,0.50))'; }}
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(219,39,119,0.15),rgba(219,39,119,0.08))', border: '1px solid rgba(219,39,119,0.25)' }}>
              <ImagePlus size={20} style={{ color: 'rgba(219,39,119,0.65)' }} />
            </div>
            <span className="text-[11px] font-bold" style={{ color: 'rgba(219,39,119,0.60)', fontFamily: 'Cairo' }}>
              إضافة صورة
            </span>
            <span className="text-[10px]" style={{ color: 'rgba(20,10,40,0.30)', fontFamily: 'Cairo' }}>
              {MAX_PHOTOS - photos.length} متبقية
            </span>
          </motion.button>
        )}

        {/* خانات فارغة للشبكة */}
        {Array.from({ length: Math.max(0, MAX_PHOTOS - photos.length - 1) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-[3/4] rounded-2xl"
            style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed rgba(0,0,0,0.06)' }} />
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════════════════════════════════ */
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 60, scale: 0.92 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 60, scale: 0.92 }}
    className="fixed bottom-28 left-4 right-4 z-[500] flex items-center gap-3 px-5 py-4 rounded-2xl"
    style={{
      background: type === 'success'
        ? 'linear-gradient(135deg,rgba(16,185,129,0.95),rgba(5,150,105,0.92))'
        : 'linear-gradient(135deg,rgba(239,68,68,0.95),rgba(220,38,38,0.92))',
      border: `1px solid ${type === 'success' ? 'rgba(52,211,153,0.4)' : 'rgba(252,165,165,0.4)'}`,
      boxShadow: `0 12px 40px ${type === 'success' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)'}, inset 0 1px 0 rgba(255,255,255,0.25)`,
      fontFamily: 'Cairo',
    }}
    dir="rtl"
  >
    {type === 'success' ? <CheckCircle2 size={20} className="text-white shrink-0" /> : <AlertCircle size={20} className="text-white shrink-0" />}
    <span className="text-white font-bold text-[14px] flex-1">{message}</span>
    <button onClick={onClose}><X size={16} className="text-white/70" /></button>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function ProfileEditor() {
  const router = useRouter();
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);
  const [toast,   setToast]     = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [userId,  setUserId]    = useState('');
  const [photos,  setPhotos]    = useState<PhotoSlot[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const [form, setForm] = useState<ProfileData>({
    gender: 'male',
    country: 'تونس',
    city: '',
    marital_status: '',
    children_count: 'لا يوجد',
    religious_commitment: '',
    marriage_readiness: '',
    housing_status: '',
    want_children: 'نعم',
    health_condition: '',
    health_habits: '',
    height: '',
    weight: '',
    education_level: '',
    work_type: '',
    job_title: '',
    bio: '',
    partner_specs: '',
  });

  const gender  = (form.gender || 'male') as 'male' | 'female';
  const cities  = form.country ? (COUNTRIES_CITIES[form.country] || []) : [];

  const setField = (key: keyof ProfileData, value: string) => {
    setForm(p => ({ ...p, [key]: value }));
    setHasChanges(true);
  };

  /* ─────────────── جلب البيانات من Supabase ─────────────── */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUserId(user.id);

      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (prof) {
        setForm({
          gender:               prof.gender         || 'male',
          country:              prof.country        || 'تونس',
          city:                 prof.city           || '',
          marital_status:       prof.marital_status || '',
          children_count:       prof.children_count || 'لا يوجد',
          religious_commitment: prof.religious_commitment || '',
          marriage_readiness:   prof.marriage_readiness  || '',
          housing_status:       prof.housing_status      || '',
          want_children:        prof.want_children       || 'نعم',
          health_condition:     prof.health_condition    || '',
          health_habits:        prof.health_habits       || '',
          height:               String(prof.height || ''),
          weight:               String(prof.weight || ''),
          education_level:      prof.education_level     || '',
          work_type:            prof.work_type           || '',
          job_title:            prof.job             || '',
          bio:                  prof.bio             || '',
          partner_specs:        prof.partner_specs   || '',
          avatar_url:           prof.avatar_url      || '',
          images:               prof.images          || [],
        });

        // بناء خانات الصور من البيانات المحفوظة
        const existingPhotos: PhotoSlot[] = [];
        const imgs: string[] = prof.images || [];
        imgs.forEach((url: string) => {
          if (url) {
            existingPhotos.push({
              url,
              isAvatar: url === prof.avatar_url,
              isBlurred: (prof.blurred_images || []).includes(url),
            });
          }
        });
        // إذا الأفاتار ليست ضمن الصور، أضفها في البداية
        if (prof.avatar_url && !imgs.includes(prof.avatar_url)) {
          existingPhotos.unshift({ url: prof.avatar_url, isAvatar: true, isBlurred: false });
        }
        setPhotos(existingPhotos);
      }
      setLoading(false);
    };
    init();
  }, []);

  /* ─────────────── رفع صورة واحدة إلى Storage ─────────────── */
  const uploadPhoto = async (file: File, uid: string): Promise<string | null> => {
    const ext  = file.name.split('.').pop();
    const path = `${uid}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('profile-photos')
      .upload(path, file, { upsert: true });
    if (error) { console.error('upload error:', error); return null; }
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  /* ─────────────── حفظ كامل ─────────────── */
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    setToast(null);

    try {
      // 1. رفع الصور الجديدة (التي لديها file)
      const uploadedPhotos: PhotoSlot[] = await Promise.all(
        photos.map(async (p) => {
          if (p.file) {
            const url = await uploadPhoto(p.file, userId);
            if (url) return { ...p, url, file: undefined };
            // إذا فشل الرفع، احتفظ بالـ blob URL مؤقتاً
            return p;
          }
          return p;
        })
      );

      const imageUrls   = uploadedPhotos.map(p => p.url).filter(Boolean);
      const avatarPhoto = uploadedPhotos.find(p => p.isAvatar);
      const avatarUrl   = avatarPhoto?.url || imageUrls[0] || '';
      const blurredUrls = uploadedPhotos.filter(p => p.isBlurred).map(p => p.url);

      // 2. تحديث جدول profiles
      const updatePayload: Record<string, any> = {
        country:              form.country,
        city:                 form.city,
        marital_status:       form.marital_status,
        children_count:       form.children_count,
        religious_commitment: form.religious_commitment,
        marriage_readiness:   form.marriage_readiness,
        housing_status:       form.housing_status,
        want_children:        form.want_children,
        health_condition:     form.health_condition,
        health_habits:        form.health_habits,
        height:               form.height ? Number(form.height) : null,
        weight:               form.weight ? Number(form.weight) : null,
        education_level:      form.education_level,
        work_type:            form.work_type,
        job:                  form.job_title,
        bio:                  form.bio,
        partner_specs:        form.partner_specs,
        avatar_url:           avatarUrl,
        images:               imageUrls,
        blurred_images:       blurredUrls,
        is_completed:         !!(form.bio && imageUrls.length > 0 && form.country),
        updated_at:           new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. تحديث الحالة المحلية
      setPhotos(uploadedPhotos);
      setHasChanges(false);
      setToast({ message: 'تم حفظ بياناتك بنجاح ✓', type: 'success' });
      setTimeout(() => setToast(null), 3500);

    } catch (err: any) {
      console.error('Save error:', err);
      setToast({ message: `خطأ في الحفظ: ${err?.message || 'يرجى المحاولة مرة أخرى'}`, type: 'error' });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  /* ─────────────── شاشة التحميل ─────────────── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#fdf2f8 0%,#f5f3ff 50%,#eff6ff 100%)' }}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin" style={{ color: '#ec4899' }} />
          <p className="font-bold text-[14px]" style={{ color: 'rgba(20,10,40,0.45)', fontFamily: 'Cairo' }}>
            جار تحميل بياناتك…
          </p>
        </div>
      </div>
    );
  }

  /* ─────────────── الواجهة الرئيسية ─────────────── */
  return (
    <div
      dir="rtl"
      className="min-h-screen pb-36"
      style={{
        background: 'linear-gradient(145deg,#fdf2f8 0%,#f5f3ff 40%,#eff6ff 100%)',
        fontFamily: 'Cairo, sans-serif',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
        .no-scrollbar::-webkit-scrollbar{display:none}
      `}</style>

      {/* ── رأس الصفحة ── */}
      <header className="sticky top-0 z-50 px-4 py-3"
        style={{
          background: 'linear-gradient(180deg,rgba(253,242,248,0.92) 0%,rgba(253,242,248,0.70) 100%)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.70)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-[13px] transition-all"
            style={{
              background: 'linear-gradient(145deg,rgba(255,255,255,0.85),rgba(255,255,255,0.65))',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(0,0,0,0.07)',
              color: 'rgba(20,10,40,0.70)',
            }}>
            <ArrowRight size={17} /> رجوع
          </motion.button>

          <h1 className="font-black text-[17px]" style={{ color: 'rgba(20,10,40,0.82)' }}>
            تعديل الملف الشخصي
          </h1>

          {/* مؤشر التغييرات */}
          <div className="w-20 flex justify-center">
            {hasChanges && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black"
                style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)', color: '#d97706' }}>
                ● غير محفوظ
              </motion.span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

        {/* ════════════════ البطاقة 1: إدارة الصور ════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-5"
          style={glassCard}
        >
          <SectionHeader
            icon={<Camera size={17} />}
            title="الصور الشخصية"
            color="#ec4899"
          />
          <PhotoManager
            userId={userId}
            photos={photos}
            onPhotosChange={(p) => { setPhotos(p); setHasChanges(true); }}
          />
        </motion.section>

        {/* ════════════════ البطاقة 2: البيانات الجغرافية ════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.10 }}
          className="p-5"
          style={glassCard}
        >
          <SectionHeader icon={<User size={17} />} title="البيانات الأساسية" color="#3b82f6" />
          <div className="grid grid-cols-2 gap-4">
            <GlassSelect
              label="البلد"
              value={form.country || ''}
              onChange={v => { setField('country', v); setField('city', ''); }}
              options={Object.keys(COUNTRIES_CITIES)}
            />
            <GlassSelect
              label="المدينة"
              value={form.city || ''}
              onChange={v => setField('city', v)}
              options={cities}
              disabled={!form.country}
            />
            <GlassSelect
              label="الحالة المدنية"
              value={form.marital_status || ''}
              onChange={v => setField('marital_status', v)}
              options={MARITAL_STATUS[gender] || []}
            />
            <GlassSelect
              label="عدد الأبناء"
              value={form.children_count || ''}
              onChange={v => setField('children_count', v)}
              options={['لا يوجد', 'طفل واحد', 'طفلين', 'أكثر من طفلين']}
            />
          </div>
        </motion.section>

        {/* ════════════════ البطاقة 3: الالتزام والجاهزية ════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-5"
          style={glassCard}
        >
          <SectionHeader icon={<ShieldCheck size={17} />} title="الالتزام والجاهزية" color="#10b981" />
          <div className="grid grid-cols-2 gap-4">
            <GlassSelect
              label="الالتزام الديني"
              value={form.religious_commitment || ''}
              onChange={v => setField('religious_commitment', v)}
              options={RELIGIOUS_COMMITMENT[gender] || []}
            />
            <GlassSelect
              label="جاهزية الزواج"
              value={form.marriage_readiness || ''}
              onChange={v => setField('marriage_readiness', v)}
              options={MARRIAGE_READINESS[gender] || []}
            />
            <GlassSelect
              label="سكن الزوجية"
              value={form.housing_status || ''}
              onChange={v => setField('housing_status', v)}
              options={HOUSING_STATUS || []}
            />
            <GlassSelect
              label="الرغبة في الإنجاب"
              value={form.want_children || ''}
              onChange={v => setField('want_children', v)}
              options={['نعم', 'لا', 'لاحقاً']}
            />
          </div>
        </motion.section>

        {/* ════════════════ البطاقة 4: الصحة والجسم ════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.20 }}
          className="p-5"
          style={glassCard}
        >
          <SectionHeader icon={<Activity size={17} />} title="الصحة والجسم" color="#f59e0b" />
          <div className="grid grid-cols-2 gap-4">
            <GlassSelect
              label="الحالة الصحية"
              value={form.health_condition || ''}
              onChange={v => setField('health_condition', v)}
              options={HEALTH_CONDITION[gender] || []}
            />
            <GlassSelect
              label="العادات الصحية"
              value={form.health_habits || ''}
              onChange={v => setField('health_habits', v)}
              options={HEALTH_HABITS[gender] || []}
            />
            <GlassInput
              label="الطول (سم)"
              value={form.height || ''}
              onChange={v => setField('height', v)}
              placeholder="مثال: 175"
              type="number"
            />
            <GlassInput
              label="الوزن (كجم)"
              value={form.weight || ''}
              onChange={v => setField('weight', v)}
              placeholder="مثال: 70"
              type="number"
            />
          </div>
        </motion.section>

        {/* ════════════════ البطاقة 5: التعليم والعمل ════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-5"
          style={glassCard}
        >
          <SectionHeader icon={<Briefcase size={17} />} title="التعليم والعمل" color="#8b5cf6" />
          <div className="grid grid-cols-2 gap-4">
            <GlassSelect
              label="المستوى التعليمي"
              value={form.education_level || ''}
              onChange={v => setField('education_level', v)}
              options={EDUCATION_LEVELS || []}
            />
            <GlassSelect
              label="نوع العمل"
              value={form.work_type || ''}
              onChange={v => setField('work_type', v)}
              options={['عمل حر', 'عمل قار', 'عمل غير قار', 'دون عمل']}
            />
            <div className="col-span-2">
              <GlassInput
                label="المسمى الوظيفي"
                value={form.job_title || ''}
                onChange={v => setField('job_title', v)}
                placeholder="مثال: مهندس برمجيات"
              />
            </div>
          </div>
        </motion.section>

        {/* ════════════════ البطاقة 6: التعريف والتوقعات ════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.30 }}
          className="p-5"
          style={glassCard}
        >
          <SectionHeader icon={<Heart size={17} />} title="التعريف والتوقعات" color="#ec4899" />
          <div className="space-y-4">
            <GlassTextarea
              label="نبذة تعريفية عنك"
              value={form.bio || ''}
              onChange={v => setField('bio', v)}
              placeholder="تحدث عن شخصيتك، هواياتك، وما يميزك…"
            />
            <GlassTextarea
              label="مواصفات شريك الحياة"
              value={form.partner_specs || ''}
              onChange={v => setField('partner_specs', v)}
              placeholder="ما الصفات التي تبحث عنها في الطرف الآخر؟"
            />
          </div>
        </motion.section>

      </main>

      {/* ════════════════ زر الحفظ العائم الثابت ════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[300] px-4 pb-6 pt-3"
        style={{
          background: 'linear-gradient(0deg,rgba(253,242,248,0.97) 60%,transparent 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-2xl mx-auto">
          <motion.button
            whileTap={!saving ? { scale: 0.97, y: 1 } : {}}
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-[15px] transition-all"
            style={{
              background: saving
                ? 'linear-gradient(135deg,rgba(156,163,175,0.8),rgba(107,114,128,0.7))'
                : 'linear-gradient(135deg,#ec4899 0%,#db2777 50%,#be185d 100%)',
              color: 'white',
              fontFamily: 'Cairo',
              boxShadow: saving
                ? 'none'
                : [
                    '0 8px 32px rgba(219,39,119,0.40)',
                    '0 2px 8px rgba(219,39,119,0.25)',
                    'inset 0 1px 0 rgba(255,255,255,0.25)',
                    'inset 0 -2px 0 rgba(0,0,0,0.10)',
                  ].join(','),
              opacity: saving ? 0.7 : 1,
              letterSpacing: '0.03em',
            }}
          >
            {saving
              ? <><Loader2 size={20} className="animate-spin" /> جار الحفظ…</>
              : <><Save size={20} /> حفظ البيانات</>
            }
          </motion.button>
        </div>
      </div>

      {/* ════════════════ Toast ════════════════ */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
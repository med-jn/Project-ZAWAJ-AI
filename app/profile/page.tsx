'use client';
/**
 * 📁 app/profile/page.tsx — ZAWAJ AI
 * شبيه بـ ProfileModal — أفاتار دائري + كاميرا + قلم تعديل
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3, Camera, Crown, Eye, Heart, MapPin,
  GraduationCap, Briefcase, Star, Baby, Moon, Home,
  Users, BookOpen, ShieldCheck, Smile, Ruler, Activity,
  Flame, Globe, HandHeart, LogOut,
} from 'lucide-react';
import { CoinBalance } from '@/components/ui/CoinBalance';
import { LoveCoin } from '@/components/ui/LoveCoin';
import { supabase }  from '@/lib/supabase/client';
import { AutoBadge } from '@/components/auto-badge';
import { useWallet } from '@/hooks/useWallet';
import {
  COMMITTED_LEVELS,
  getMaritalLabel, getEducationLabel, getReligiousLabel, getHousingLabel,
  READINESS_LEVEL_NOW,
} from '@/constants/constants';
import { getSpecialtyLabel } from '@/constants/occupations';

// ── حالة التواجد ───────────────────────────────────────────────
function getOnlineStatus(last?: string, gender?: string) {
  const f = gender === 'female';
  if (!last) return { text: f ? 'غير متصلة' : 'غير متصل', color: 'rgba(255,255,255,0.3)' };
  const mins = Math.floor((Date.now() - new Date(last).getTime()) / 60000);
  if (mins < 5)  return { text: f ? 'متواجدة الآن' : 'متواجد الآن', color: '#22c55e' };
  if (mins < 60) return { text: `منذ ${mins} دقيقة`, color: 'rgba(255,255,255,0.5)' };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return { text: `منذ ${hrs} ساعة`,  color: 'rgba(255,255,255,0.45)' };
  const days = Math.floor(hrs / 24);
  if (days < 7)  return { text: `منذ ${days} أيام`, color: 'rgba(255,255,255,0.3)' };
  return { text: f ? 'غير متصلة' : 'غير متصل', color: 'rgba(255,255,255,0.3)' };
}

// ── صف معلومة ─────────────────────────────────────────────────
function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div dir="rtl" style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-3)',
      padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--glass-border)',
    }}>
      <span style={{ color: 'var(--color-primary)', opacity: 0.75, flexShrink: 0, display: 'flex' }}>{icon}</span>
      <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, fontSize: 'var(--text-xs)', minWidth: 90 }}>{label}</span>
      <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 'var(--text-sm)', flex: 1, textAlign: 'right', lineHeight: 'var(--lh-snug)' }}>{value}</span>
    </div>
  );
}

// ── بلوك قسم ──────────────────────────────────────────────────
function Block({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const kids = Array.isArray(children) ? (children as any[]).flat().filter(Boolean) : [children].filter(Boolean);
  if (!kids.length) return null;
  return (
    <div style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', padding: 'var(--sp-3) var(--sp-4)', borderBottom: '1px solid var(--glass-border)' }}>
        <span style={{ color: 'var(--color-primary)', opacity: 0.7, display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{title}</span>
      </div>
      <div style={{ padding: '0 var(--sp-4) var(--sp-2)' }}>{kids}</div>
    </div>
  );
}

// ── ضغط + اقتصاص ──────────────────────────────────────────────
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
      const canvas = document.createElement('canvas');
      canvas.width = 600; canvas.height = 600;
      canvas.getContext('2d')!.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, 600, 600);
      const blob = await compressToMax(canvas, 200);
      resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }));
    };
  });
}

// ── CropModal مُصلح (evenodd بدل destination-out) ───────────
function CropModal({ src, onConfirm, onCancel }: { src: string; onConfirm: (x: number, y: number, s: number) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const [ready,   setReady]  = useState(false);
  const [offset,  setOffset] = useState({ x: 0, y: 0 });
  const [scale,   setScale]  = useState(1);
  const [drag,    setDrag]   = useState(false);
  const last = useRef<{ x: number; y: number; dist?: number } | null>(null);
  const SIZE = 300;

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      setScale(s);
      setOffset({ x: (SIZE - img.width * s) / 2, y: (SIZE - img.height * s) / 2 });
      setReady(true);
    };
  }, [src]);

  // ✅ رسم صحيح: evenodd — الصورة مرئية دائماً
  useEffect(() => {
    if (!ready || !imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const img = imgRef.current;
    // خلفية
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, SIZE, SIZE);
    // الصورة
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
    // تعتيم خارج الدائرة فقط بـ evenodd
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, SIZE, SIZE);
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
    // حلقة الدائرة
    ctx.save();
    ctx.strokeStyle = '#B3334B';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [ready, offset, scale]);

  const clamp = (o: { x: number; y: number }) => {
    const img = imgRef.current!;
    return { x: Math.min(0, Math.max(SIZE - img.width * scale, o.x)), y: Math.min(0, Math.max(SIZE - img.height * scale, o.y)) };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(0,0,0,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--sp-4)' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--sp-4)', textAlign: 'center' }}>اسحب لتحديد موضع الوجه</p>
      <canvas ref={canvasRef} width={SIZE} height={SIZE}
        style={{ borderRadius: '50%', touchAction: 'none', cursor: drag ? 'grabbing' : 'grab', maxWidth: '85vw', maxHeight: '85vw', background: '#0a0a0a' }}
        onTouchStart={e => {
          e.preventDefault();
          if (e.touches.length === 1) { setDrag(true); last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
          else { const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY; last.current = { x: 0, y: 0, dist: Math.sqrt(dx*dx+dy*dy) }; }
        }}
        onTouchMove={e => {
          e.preventDefault();
          if (!last.current || !imgRef.current) return;
          if (e.touches.length === 1 && drag) {
            const dx = e.touches[0].clientX - last.current.x; const dy = e.touches[0].clientY - last.current.y;
            setOffset(o => clamp({ x: o.x + dx, y: o.y + dy }));
            last.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
          } else if (e.touches.length === 2 && last.current.dist) {
            const dx = e.touches[0].clientX - e.touches[1].clientX; const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx*dx+dy*dy);
            const minS = SIZE / Math.max(imgRef.current.width, imgRef.current.height);
            const ns = Math.min(4, Math.max(minS, scale * (dist / last.current.dist)));
            setScale(ns); last.current = { ...last.current, dist };
          }
        }}
        onTouchEnd={() => { setDrag(false); last.current = null; }}
        onMouseDown={e => { setDrag(true); last.current = { x: e.clientX, y: e.clientY }; }}
        onMouseMove={e => { if (!drag || !imgRef.current) return; setOffset(o => clamp({ x: o.x + e.movementX, y: o.y + e.movementY })); }}
        onMouseUp={() => { setDrag(false); last.current = null; }}
        onMouseLeave={() => { setDrag(false); last.current = null; }}
        onWheel={e => { if (!imgRef.current) return; const minS = SIZE / Math.max(imgRef.current.width, imgRef.current.height); setScale(s => Math.min(4, Math.max(minS, s - e.deltaY * 0.001))); }}
      />
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 'var(--text-2xs)', margin: 'var(--sp-3) 0', textAlign: 'center' }}>قرّب أو بعّد بالأصبعين</p>
      <div style={{ display: 'flex', gap: 'var(--sp-3)', width: '100%', maxWidth: 300 }}>
        <button onClick={onCancel} style={{ flex: 1, height: 'var(--btn-h)', borderRadius: 'var(--radius-md)', background: 'var(--bg-soft)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>إلغاء</button>
        <button onClick={() => {
            if (!imgRef.current) return;
            const im = imgRef.current;
            const cropX = Math.max(0, -offset.x / scale);
            const cropY = Math.max(0, -offset.y / scale);
            const cropSz = Math.min(
              SIZE / scale,
              Math.min(im.width - cropX, im.height - cropY)
            );
            onConfirm(cropX, cropY, cropSz);
          }}
          style={{ flex: 2, height: 'var(--btn-h)', borderRadius: 'var(--radius-md)', background: 'var(--color-primary)', border: 'none', color: '#fff', fontSize: 'var(--text-base)', fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>تأكيد</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  الصفحة
// ══════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const router = useRouter();
  const { totalBalance } = useWallet();

  const [profile,   setProfile]   = useState<any>(null);
  const [badge,     setBadge]     = useState('');
  const [loading,   setLoading]   = useState(true);
  const [uploading, setUploading] = useState(false);
  const [stats,     setStats]     = useState({ likes: 0, views: 0 });
  const [cropSrc,   setCropSrc]   = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      const [pRes, wRes, lRes, vRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('wallets').select('badge_type,badge_expires_at').eq('id', user.id).maybeSingle(),
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('to_user', user.id).eq('action', 'like'),
        supabase.from('likes').select('*', { count: 'exact', head: true }).eq('to_user', user.id).eq('action', 'view'),
      ]);
      setProfile(pRes.data);
      setStats({ likes: lRes.count ?? 0, views: vRes.count ?? 0 });
      const w = wRes.data;
      if (w?.badge_type && w.badge_type !== 'none' && (!w.badge_expires_at || new Date(w.badge_expires_at) > new Date())) setBadge(w.badge_type);
      setLoading(false);
    };
    load();
  }, [router]);

  const uploadAvatar = async (file: File) => {
    if (!profile?.id) return;
    setUploading(true);
    try {
      const path = `${profile.id}_avatar.webp`;
      const { error } = await supabase.storage.from('Avatars').upload(path, file, { upsert: true, cacheControl: '3600' });
      if (error) throw error;
      const url = supabase.storage.from('Avatars').getPublicUrl(path).data.publicUrl;
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', profile.id);
      setProfile((p: any) => ({ ...p, avatar_url: url }));
    } catch (e) { console.error(e); }
    setUploading(false);
  };

  if (loading || !profile) return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  const p         = profile;
  const isMale    = p.gender === 'male';
  const gender    = isMale ? 'male' : 'female';
  const committed = COMMITTED_LEVELS.includes(p.religious_commitment ?? -1);
  const status    = getOnlineStatus(p.last_active_at, p.gender);
  const pct       = p.profile_completion_percent ?? 0;
  const pctColor  = pct >= 80 ? '#22c55e' : pct >= 50 ? 'var(--color-gold)' : 'var(--color-accent)';
  const loc       = [p.country, p.city].filter(Boolean).join(' — ');
  const hw        = [p.height ? `${p.height} سم` : null, p.weight ? `${p.weight} كغ` : null].filter(Boolean).join(' · ') || null;

  return (
    <div dir="rtl" style={{ padding: '0 var(--sp-4) var(--sp-8)', maxWidth: 600, margin: '0 auto' }}>

      {/* القلم منقول إلى تحت الاسم */}

      {/* Hero */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--sp-3)', padding: 'var(--sp-6) 0 var(--sp-4)' }}>
        {/* أفاتار + كاميرا */}
        <div style={{ position: 'relative' }}>
          <img src={p.avatar_url || '/default-avatar.png'} alt={p.full_name}
            style={{ width: 'var(--avatar-xl)', height: 'var(--avatar-xl)', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)', filter: p.is_photos_blurred ? 'blur(12px)' : 'none' }} />
          {status.color === '#22c55e' && (
            <div style={{ position: 'absolute', bottom: 4, left: 4, width: 14, height: 14, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--bg-main)' }} />
          )}
          <label style={{ position: 'absolute', bottom: 0, right: 0, cursor: 'pointer' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) setCropSrc(URL.createObjectURL(f)); e.target.value = ''; }} />
            <motion.div whileTap={{ scale: 0.88 }} style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-main)', boxShadow: '0 2px 8px var(--shadow-red-glow)' }}>
              {uploading
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }} style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                : <Camera size={14} color="#fff" />}
            </motion.div>
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-2xl)', textAlign: 'center' }}>{p.full_name}</span>
          {badge && <AutoBadge value={badge as any} isBroker={p.role === 'mediator'} size="text-[10px]" />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {p.age  && <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>{p.age} سنة</span>}
          {p.city && <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}><MapPin size={12}/>{p.city}</span>}
          {/* ✏️ القلم بجانب المدينة */}
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => router.push('/profile/edit')}
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--radius-full)', background: 'var(--color-primary-xsoft)', border: '1px solid var(--color-primary-soft)', cursor: 'pointer', color: 'var(--color-primary)' }}>
            <Edit3 size={12} />
            <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 700 }}>تعديل</span>
          </motion.button>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: status.color, fontWeight: 500 }}>{status.text}</span>
      </div>

      {/* الرصيد + الإحصائيات */}
      <div style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05))', border: '1px solid rgba(212,175,55,0.3)' }}>
        <div style={{ padding: 'var(--sp-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
            <div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', margin: 0 }}>رصيدك</p>
              <CoinBalance amount={totalBalance}/>

            </div>
          </div>
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => router.push('/packages')}
            style={{ padding: 'var(--sp-2) var(--sp-4)', borderRadius: 'var(--radius-md)', background: 'var(--color-gold)', color: '#000', fontWeight: 800, fontSize: 'var(--text-xs)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            الباقات
          </motion.button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(212,175,55,0.2)' }}>
          {[{ label: 'أعجبوا بك', value: stats.likes, Icon: Heart }, { label: 'زاروا ملفك', value: stats.views, Icon: Eye }].map(s => (
            <div key={s.label} style={{ padding: 'var(--sp-3) var(--sp-4)', display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <s.Icon size={14} style={{ color: 'var(--color-gold)', opacity: 0.7 }} />
              <div>
                <p style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-xl)', margin: 0 }}>{s.value}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)', margin: 0 }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* شريط الاكتمال */}
      {pct > 0 && (
        <div style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-xl)', padding: 'var(--sp-4)', background: 'var(--glass-bg)', border: `1px solid ${pct >= 80 ? 'rgba(34,197,94,0.3)' : 'var(--glass-border)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>اكتمال الملف</span>
            <span style={{ color: pctColor, fontWeight: 900, fontSize: 'var(--text-md)' }}>{pct}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--glass-border)', overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
              style={{ height: '100%', borderRadius: 99, background: pctColor }} />
          </div>
        </div>
      )}

      {/* أقسام المعلومات */}
      <Block title="البيانات الأساسية" icon={<Users size={13}/>}>
        <Row icon={<Users size={13}/>}      label="الحالة المدنية"  value={p.marital_status ? getMaritalLabel(p.marital_status, gender) : null} />
        <Row icon={<Globe size={13}/>}      label="الجنسية"         value={p.nationality} />
        <Row icon={<MapPin size={13}/>}     label="الإقامة"         value={loc} />
        <Row icon={<Ruler size={13}/>}      label="الطول / الوزن"   value={hw} />
        <Row icon={<Smile size={13}/>}      label="لون البشرة"      value={p.skin_color} />
        <Row icon={<Globe size={13}/>}      label="الانتقال"        value={p.travel_willingness} />
        <Row icon={<Heart size={13}/>}      label="جاهزية الزواج"   value={p.readiness_level === READINESS_LEVEL_NOW ? '🟢 جاهز حالاً' : null} />
      </Block>

      <Block title="المهنة والتعليم" icon={<Briefcase size={13}/>}>
        <Row icon={<Briefcase size={13}/>}     label="المهنة"           value={p.occupation_id ? getSpecialtyLabel(p.occupation_id, gender) : null} />
        <Row icon={<GraduationCap size={13}/>} label="المستوى الدراسي"  value={p.education_level ? getEducationLabel(p.education_level) : null} />
        <Row icon={<Star size={13}/>}          label="الوضع المادي"     value={p.financial_status} />
      </Block>

      <Block title="السكن" icon={<Home size={13}/>}>
        <Row icon={<Home size={13}/>} label="السكن الحالي" value={p.housing_type ? getHousingLabel(p.housing_type) : null} />
        <Row icon={<Home size={13}/>} label="بعد الزواج"   value={p.preferred_housing} />
      </Block>

      <Block title="الدين والالتزام" icon={<Moon size={13}/>}>
        <Row icon={<Moon size={13}/>}     label="الالتزام"      value={p.religious_commitment ? getReligiousLabel(p.religious_commitment, gender) : null} />
        <Row icon={<BookOpen size={13}/>} label="حفظ القرآن"   value={p.quran_memorization} />
        {isMale && committed && <>
          <Row icon={<Flame size={13}/>}    label="اللحية"        value={p.beard_style} />
          <Row icon={<Activity size={13}/>} label="صلاة الجماعة" value={p.prayer_commitment} />
        </>}
        {!isMale && committed && <Row icon={<ShieldCheck size={13}/>} label="اللباس" value={p.hijab_style} />}
      </Block>

      <Block title="الأطفال" icon={<Baby size={13}/>}>
        <Row icon={<Baby size={13}/>}  label="لديه أطفال"    value={p.children_count > 0 ? `نعم (${p.children_count})` : 'لا'} />
        {p.children_count > 0 && <Row icon={<Users size={13}/>} label="الحضانة" value={p.children_custody} />}
        <Row icon={<Baby size={13}/>}  label="رغبة بالإنجاب" value={p.desire_for_children} />
      </Block>

      <Block title="الصحة والعادات" icon={<Activity size={13}/>}>
        <Row icon={<Activity size={13}/>} label="الحالة الصحية" value={p.health_status} />
        {isMale && <Row icon={<Flame size={13}/>} label="التدخين" value={p.smoking} />}
      </Block>

      {!isMale && (
        <Block title="الزواج" icon={<HandHeart size={13}/>}>
          <Row icon={<HandHeart size={13}/>} label="قبول التعدد"       value={p.polygamy_acceptance} />
          <Row icon={<Briefcase size={13}/>} label="العمل بعد الزواج"  value={p.work_after_marriage} />
        </Block>
      )}

      <Block title="الطبع والشخصية" icon={<Smile size={13}/>}>
        <Row icon={<Smile size={13}/>}     label="الشخصية"         value={p.social_type} />
        <Row icon={<Moon size={13}/>}      label="صباحي / مسائي"   value={p.morning_evening} />
        <Row icon={<Home size={13}/>}      label="وقت المنزل"      value={p.home_time} />
        <Row icon={<Users size={13}/>}     label="أسلوب الحوار"    value={p.conflict_style} />
        <Row icon={<HandHeart size={13}/>} label="التعبير العاطفي" value={p.affection_style} />
        <Row icon={<Star size={13}/>}      label="أولويات الحياة"  value={p.life_priority} />
        <Row icon={<Baby size={13}/>}      label="أسلوب التربية"   value={p.parenting_style} />
        <Row icon={<Home size={13}/>}      label="العلاقة بالأسرة" value={p.relationship_with_family} />
      </Block>

      {!!p.bio && (
        <div style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-xl)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: 'var(--sp-4)' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 'var(--sp-2)' }}>نبذة شخصية</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-relaxed)', margin: 0 }}>"{p.bio}"</p>
        </div>
      )}
      {!!p.partner_requirements && (
        <div style={{ marginBottom: 'var(--sp-3)', borderRadius: 'var(--radius-xl)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: 'var(--sp-4)' }}>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-2xs)', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 'var(--sp-2)' }}>يبحث عن</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 'var(--lh-relaxed)', margin: 0 }}>{p.partner_requirements}</p>
        </div>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
        style={{ width: '100%', padding: 'var(--sp-4)', borderRadius: 'var(--radius-lg)', marginTop: 'var(--sp-4)', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontWeight: 700, fontSize: 'var(--text-sm)', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)' }}>
        <LogOut size={16}/> تسجيل الخروج
      </motion.button>

      {cropSrc && (
        <CropModal src={cropSrc}
          onConfirm={async (x, y, s) => { const f = await cropAndCompress(cropSrc, x, y, s); setCropSrc(''); await uploadAvatar(f); }}
          onCancel={() => setCropSrc('')} />
      )}
    </div>
  );
}
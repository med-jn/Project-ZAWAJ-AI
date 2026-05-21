'use client';
/**
 * components/mediators/SubDetailSheet.tsx
 * بطاقة تفاصيل المشترك — خاصة بالوسيط
 */

import { useState, useCallback } from 'react';
import { useRouter }             from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, StickyNote, ExternalLink } from 'lucide-react';
import { supabase }              from '@/lib/supabase/client';
import { Icon }                  from './Icon';
import { Stars }                 from './Stars';
import { SocialLinks }           from './SocialLinks';
import type { SocialData }       from './SocialLinks';
import { toast }                 from 'sonner';

/* ── Verified Badge (يوتيوب-ستايل) ───────────────────── */
export function VerifiedBadge({ size = 22 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#1A8FE3,#1D9BF0)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      boxShadow: `0 2px 10px rgba(29,155,240,0.45)`,
    }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 12 12">
        <polyline points="2,6.2 4.8,9 10,3"
          style={{ fill:'none', stroke:'#fff', strokeWidth:2.2,
            strokeLinecap:'round', strokeLinejoin:'round' }} />
      </svg>
    </div>
  );
}

/* ── Types ─────────────────────────────────────────────── */
export interface SubInfo {
  id:                 string;
  full_name:          string;
  avatar_url:         string | null;
  age:                number | null;
  city:               string | null;
  country:            string | null;
  gender:             string;
  verification_status: string | null;
  status:             string;
  expires_at:         string;
  subscribed_at:      string;
  avg_rating?:        number;
  notes:              string;
  social:             SocialData;
}

interface Props {
  sub:        SubInfo;
  mediatorId: string;
  onClose:    () => void;
  onUpdate:   (id: string, patch: Partial<SubInfo>) => void;
}

/* ── Helpers ───────────────────────────────────────────── */
function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
function statusInfo(sub: SubInfo) {
  if (sub.status !== 'active') return { label:'ملغى',          color:'#f87171' };
  const d = daysLeft(sub.expires_at);
  if (d <= 0)  return { label:'منتهي',               color:'#f87171' };
  if (d <= 5)  return { label:`${d} أيام متبقية`,   color:'#fb923c' };
  return               { label:'نشط',                 color:'#34d399' };
}

function Av({ src, name, size = 80, ring }: {
  src?: string|null; name: string; size?: number; ring?: string;
}) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0,
      border: ring ? `2.5px solid ${ring}` : '1.5px solid var(--glass-border)' }}>
      {src
        ? <img src={src} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
            justifyContent:'center', background:'var(--bg-soft)',
            fontSize: size * 0.38, fontWeight:900, color:'var(--text-tertiary)' }}>
            {name.charAt(0)}
          </div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════ */
export function SubDetailSheet({ sub, mediatorId, onClose, onUpdate }: Props) {
  const router = useRouter();

  const [notes,       setNotes]       = useState(sub.notes);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingSocial,setSavingSocial]= useState(false);
  const [toggling,    setToggling]    = useState(false);
  const [social,      setSocial]      = useState<SocialData>(sub.social);

  const isVerified  = sub.verification_status === 'verified';
  const { label: stLabel, color: stColor } = statusInfo(sub);
  const gColor = sub.gender === 'male' ? '#60A5FA' : '#F472B6';

  /* ── Save notes ── */
  const saveNotes = useCallback(async () => {
    setSavingNotes(true);
    const { error } = await supabase.from('mediator_notes').upsert({
      mediator_id: mediatorId,
      id:          sub.id,
      content:     notes || null,
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'mediator_id,id' });
    setSavingNotes(false);
    if (error) { toast.error('فشل حفظ الملاحظة'); return; }
    onUpdate(sub.id, { notes });
    toast.success('تم حفظ الملاحظة');
  }, [mediatorId, sub.id, notes, onUpdate]);

  /* ── Save social ── */
  const saveSocial = useCallback(async () => {
    setSavingSocial(true);
    const { error } = await supabase.from('mediator_subscriber_info').upsert({
      mediator_id:   mediatorId,
      subscriber_id: sub.id,
      subscriber_wa: social.wa || null,
      subscriber_fb: social.fb || null,
      subscriber_ig: social.ig || null,
      subscriber_tt: social.tt || null,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'mediator_id,subscriber_id' });
    setSavingSocial(false);
    if (error) { toast.error('فشل حفظ بيانات التواصل'); return; }
    onUpdate(sub.id, { social });
    toast.success('تم حفظ بيانات التواصل');
  }, [mediatorId, sub.id, social, onUpdate]);

  /* ── Toggle verification ── */
  const toggleVerify = useCallback(async () => {
    setToggling(true);
    const next = isVerified ? 'none' : 'verified';
    const { error } = await supabase.rpc('set_subscriber_verification', {
      p_subscriber_id: sub.id,
      p_status:        next,
    });
    setToggling(false);
    if (error) { toast.error('فشل تحديث التوثيق'); return; }
    onUpdate(sub.id, { verification_status: next });
    toast.success(next === 'verified' ? 'تم توثيق الحساب ✓' : 'تم إلغاء التوثيق');
  }, [isVerified, sub.id, onUpdate]);

  return (
    <>
      {/* Overlay */}
      <motion.div aria-hidden initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-[400]"
        style={{ background:'rgba(0,0,0,0.78)', backdropFilter:'blur(14px)' }}
        onClick={onClose} />

      {/* Sheet */}
      <motion.div role="dialog" dir="rtl"
        initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', stiffness:340, damping:34 }}
        className="fixed bottom-0 left-0 right-0 z-[410] rounded-t-[34px] flex flex-col"
        style={{ background:'var(--bg-surface)', border:'1px solid var(--glass-border)',
          maxHeight:'94vh', paddingBottom:'var(--nav-h-safe)' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full" style={{ background:'var(--glass-border)' }} />
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 space-y-4 pt-2 pb-6">

          {/* ══ HERO ══════════════════════════════════════ */}
          <div className="flex items-start gap-4">
            {/* Avatar + verified ring */}
            <div className="relative shrink-0">
              <Av src={sub.avatar_url} name={sub.full_name} size={76} ring={gColor + '55'} />
              {isVerified && (
                <div className="absolute -bottom-1 -right-1">
                  <VerifiedBadge size={22} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="font-black" style={{ fontSize:'var(--text-lg)', color:'var(--text-main)', lineHeight:1.15 }}>
                  {sub.full_name}
                </h2>
                <span style={{ fontSize:13, color:gColor }}>{sub.gender === 'male' ? '♂' : '♀'}</span>
              </div>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)', marginBottom:8 }}>
                {[sub.age ? `${sub.age} سنة` : null, sub.city, sub.country].filter(Boolean).join(' · ')}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-full font-bold"
                  style={{ fontSize:10, background:`${stColor}18`,
                    border:`1px solid ${stColor}38`, color:stColor, whiteSpace:'nowrap' }}>
                  {stLabel}
                </span>
                <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>
                  {new Date(sub.subscribed_at).toLocaleDateString('ar-TN',
                    { day:'numeric', month:'long', year:'numeric' })}
                </span>
              </div>
              {sub.avg_rating != null && sub.avg_rating > 0 && (
                <div className="flex items-center gap-1.5 mt-2">
                  <Stars value={sub.avg_rating} size={11} />
                  <span style={{ fontSize:'var(--text-2xs)', color:'#D4AF37', fontWeight:700 }}>
                    {sub.avg_rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {/* Close */}
            <button onClick={onClose}
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 icon-wrap"
              style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)', marginTop:2 }}>
              <Icon i={X} size={15} color="var(--text-tertiary)" />
            </button>
          </div>

          {/* ══ SOCIAL LINKS ══════════════════════════════ */}
          <SocialLinks
            data={social}
            onChange={setSocial}
            saving={savingSocial}
            onSave={saveSocial}
          />

          {/* ══ NOTES ═════════════════════════════════════ */}
          <div className="rounded-[20px] p-4"
            style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.18)' }}>
            <div className="flex items-center gap-2 mb-3 icon-wrap">
              <Icon i={StickyNote} size={13} color="#D4AF37" />
              <p style={{ fontSize:'var(--text-2xs)', color:'#D4AF37', fontWeight:700 }}>
                ملاحظاتي السرية — لن يراها المشترك
              </p>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="اكتب انطباعك، متابعتك، أي ملاحظة خاصة..."
              style={{ width:'100%', padding:'12px 14px', borderRadius:14, outline:'none', resize:'none',
                background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                color:'var(--text-main)', fontSize:'var(--text-xs)', fontFamily:'inherit',
                lineHeight:'var(--lh-relaxed)' }} />
            <AnimatePresence>
              {notes !== sub.notes && (
                <motion.button whileTap={{ scale:0.97 }} onClick={saveNotes} disabled={savingNotes}
                  initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="w-full mt-2 py-2.5 rounded-2xl font-black flex items-center justify-center gap-2 icon-wrap"
                  style={{ background:'rgba(212,175,55,0.14)', border:'1px solid rgba(212,175,55,0.3)',
                    color:'#D4AF37', fontSize:'var(--text-xs)', opacity: savingNotes ? 0.7 : 1 }}>
                  <Icon i={Save} size={12} color="#D4AF37" />
                  {savingNotes ? 'جارٍ الحفظ...' : 'حفظ الملاحظة'}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ══ VERIFY + VIEW ═════════════════════════════ */}
          <div className="space-y-3">
            {/* Verification toggle */}
            <motion.button whileTap={{ scale:0.97 }} onClick={toggleVerify} disabled={toggling}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3"
              style={{ background: isVerified ? 'rgba(29,155,240,0.10)' : 'var(--glass-bg)',
                border: isVerified ? '1.5px solid rgba(29,155,240,0.30)' : '1px solid var(--glass-border)',
                opacity: toggling ? 0.7 : 1, transition:'all 0.2s' }}>
              {isVerified
                ? <VerifiedBadge size={20} />
                : <div style={{ width:20, height:20, borderRadius:'50%',
                    border:'2px solid var(--glass-border)', display:'flex',
                    alignItems:'center', justifyContent:'center' }} />}
              <span className="font-black"
                style={{ fontSize:'var(--text-sm)', color: isVerified ? '#1D9BF0' : 'var(--text-tertiary)' }}>
                {toggling ? 'جارٍ التحديث...'
                  : isVerified ? 'موثَّق · اضغط لإلغاء التوثيق'
                  : 'توثيق هذا الحساب'}
              </span>
            </motion.button>

            {/* View full profile */}
            <motion.button whileTap={{ scale:0.97 }}
              onClick={() => router.push(`/view?id=${sub.id}`)}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 icon-wrap font-black text-white"
              style={{ background:'linear-gradient(135deg,#800020,var(--color-primary))',
                boxShadow:'0 8px 28px var(--shadow-red-glow)', fontSize:'var(--text-sm)' }}>
              <Icon i={ExternalLink} size={16} color="#fff" />
              عرض الحساب الكامل
            </motion.button>
          </div>

        </div>
      </motion.div>
    </>
  );
}
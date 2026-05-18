'use client';
/**
 * app/subscribers/page.tsx
 * قائمة مشتركي الوسيط — تصميم 2026
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter }               from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, Save, StickyNote,
  UserCheck, ShieldCheck, Users, ChevronLeft,
  ExternalLink, Crown,
} from 'lucide-react';
import { supabase }  from '@/lib/supabase/client';
import { Icon }      from '@/components/mediators/Icon';
import { Stars }     from '@/components/mediators/Stars';
import { toast }     from 'sonner';

/* ── Social SVG ────────────────────────────────────────── */
const WA = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ fill:'currentColor', display:'block', flexShrink:0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
const TT = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ fill:'currentColor', display:'block', flexShrink:0 }}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.27 8.27 0 004.84 1.55V6.84a4.85 4.85 0 01-1.07-.15z"/>
  </svg>
);
const TG = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{ fill:'currentColor', display:'block', flexShrink:0 }}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

/* ── Types ─────────────────────────────────────────────── */
interface FullSub {
  id:             string;
  status:         string;
  expires_at:     string;
  subscribed_at:  string;
  full_name:      string;
  avatar_url:     string | null;
  age:            number | null;
  city:           string | null;
  country:        string | null;
  gender:         string;
  profile_completion_percent: number;
  whatsapp:       string | null;
  tiktok:         string | null;
  verification_status: string | null;
  notes:          string;
}

type GF = 'all' | 'male' | 'female';
type SF = 'all' | 'active' | 'cancelled' | 'expired';
type SK = 'newest' | 'oldest' | 'completion';

/* ── Status helpers ────────────────────────────────────── */
function daysLeft(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}
function subStatus(s: FullSub) {
  if (s.status !== 'active') return { label:'ملغى',   color:'#f87171' };
  const d = daysLeft(s.expires_at);
  if (d <= 0) return { label:'منتهي',          color:'#f87171' };
  if (d <= 5) return { label:`${d}ي متبقية`,  color:'#fb923c' };
  return        { label:'نشط',                color:'#34d399' };
}

/* ── Avatar ─────────────────────────────────────────────── */
function Av({ src, name, size = 44, ring }: { src?: string|null; name: string; size?: number; ring?: string }) {
  const init = name.charAt(0);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0,
      border: ring ? `2px solid ${ring}` : '1.5px solid var(--glass-border)' }}>
      {src
        ? <img src={src} alt={name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
            justifyContent:'center', background:'var(--bg-soft)', fontSize:size*0.4,
            fontWeight:900, color:'var(--text-tertiary)' }}>{init}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   DETAIL SHEET — البطاقة التفصيلية
════════════════════════════════════════════════════════ */
function SubDetailSheet({
  sub, mediatorId, onClose, onUpdate,
}: {
  sub: FullSub; mediatorId: string;
  onClose: () => void; onUpdate: (id: string, p: Partial<FullSub>) => void;
}) {
  const router    = useRouter();
  const [notes,   setNotes]   = useState(sub.notes);
  const [saving,  setSaving]  = useState(false);
  const [toggling,setToggling]= useState(false);

  const isVerified = sub.verification_status === 'verified';
  const { label:stLabel, color:stColor } = subStatus(sub);
  const gColor = sub.gender === 'male' ? '#60A5FA' : '#F472B6';
  const compColor = sub.profile_completion_percent >= 80 ? '#34d399'
    : sub.profile_completion_percent >= 50 ? '#D4AF37' : 'var(--color-primary)';

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase.from('mediator_notes').upsert({
      mediator_id: mediatorId,
      id:          sub.id,          // ← اسم العمود في الجدول هو id (ليس subscriber_id)
      content:     notes || null,
      updated_at:  new Date().toISOString(),
    }, { onConflict: 'mediator_id,id' });
    setSaving(false);
    if (error) { toast.error('فشل الحفظ'); return; }
    onUpdate(sub.id, { notes });
    toast.success('تم حفظ الملاحظة');
  };

  const toggleVerify = async () => {
    setToggling(true);
    const next = isVerified ? 'none' : 'verified';
    const { error } = await supabase.rpc('set_subscriber_verification', {
      p_subscriber_id: sub.id,
      p_status: next,
    });
    setToggling(false);
    if (error) { toast.error('فشل التوثيق'); return; }
    onUpdate(sub.id, { verification_status: next });
    toast.success(next === 'verified' ? 'تم توثيق الحساب ✓' : 'تم إلغاء التوثيق');
  };

  return (
    <>
      {/* Overlay */}
      <motion.div aria-hidden initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-[400]"
        style={{ background:'rgba(0,0,0,0.75)', backdropFilter:'blur(12px)' }}
        onClick={onClose} />

      {/* Sheet */}
      <motion.div role="dialog" dir="rtl"
        initial={{ y:'100%' }} animate={{ y:0 }} exit={{ y:'100%' }}
        transition={{ type:'spring', stiffness:320, damping:32 }}
        className="fixed bottom-0 left-0 right-0 z-[410] rounded-t-[32px] flex flex-col"
        style={{ background:'var(--bg-surface)', border:'1px solid var(--glass-border)',
          maxHeight:'92vh', paddingBottom:'var(--nav-h-safe)' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background:'var(--glass-border)' }} />
        </div>

        <div className="overflow-y-auto flex-1 px-5 space-y-5 pt-2 pb-5">

          {/* ── Hero ── */}
          <div className="flex items-center gap-4">
            {/* Avatar + badges */}
            <div className="relative shrink-0">
              <Av src={sub.avatar_url} name={sub.full_name} size={72} ring={gColor + '60'} />
              {isVerified && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center icon-wrap"
                  style={{ background:'#2563EB', boxShadow:'0 0 0 2px var(--bg-surface)' }}>
                  <Icon i={UserCheck} size={12} color="#fff" />
                </div>
              )}
            </div>

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-black truncate"
                  style={{ fontSize:'var(--text-lg)', color:'var(--text-main)' }}>
                  {sub.full_name}
                </h2>
                <span style={{ fontSize:12, color:gColor }}>{sub.gender === 'male' ? '♂' : '♀'}</span>
              </div>
              <p style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)' }}>
                {[sub.age ? `${sub.age} سنة` : null, sub.city, sub.country].filter(Boolean).join(' · ')}
              </p>
              {/* Subscription status */}
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-full font-bold"
                  style={{ fontSize:10, background:`${stColor}18`,
                    border:`1px solid ${stColor}40`, color:stColor }}>
                  {stLabel}
                </span>
                <span style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>
                  منذ {new Date(sub.subscribed_at).toLocaleDateString('ar-TN',
                    { day:'numeric', month:'long', year:'numeric' })}
                </span>
              </div>
            </div>

            {/* Close */}
            <button onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 icon-wrap"
              style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
              <Icon i={X} size={15} color="var(--text-tertiary)" />
            </button>
          </div>

          {/* ── اكتمال البروفايل ── */}
          <div className="rounded-[18px] p-4"
            style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:700 }}>
                اكتمال الملف الشخصي
              </p>
              <span className="font-black" style={{ fontSize:'var(--text-xs)', color:compColor }}>
                {sub.profile_completion_percent}٪
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background:'var(--bg-soft)' }}>
              <motion.div initial={{ width:0 }}
                animate={{ width:`${sub.profile_completion_percent}%` }}
                transition={{ duration:1, ease:'easeOut', delay:0.2 }}
                style={{ height:'100%', background:compColor, borderRadius:9999 }} />
            </div>
          </div>

          {/* ── أزرار التواصل ── */}
          <div className="rounded-[18px] p-4"
            style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
            <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:700, marginBottom:12 }}>
              تواصل مباشر
            </p>
            <div className="flex gap-3">
              {/* WhatsApp */}
              <motion.button whileTap={{ scale:0.88 }}
                onClick={() => sub.whatsapp
                  ? window.open(`https://wa.me/${sub.whatsapp.replace(/\D/g,'')}`, '_blank')
                  : toast.info('لم يضف المشترك رقم واتساب بعد')}
                className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5"
                style={{ background: sub.whatsapp ? 'rgba(37,211,102,0.1)' : 'var(--bg-soft)',
                  border: sub.whatsapp ? '1px solid rgba(37,211,102,0.25)' : '1px solid var(--glass-border)',
                  color: sub.whatsapp ? '#25D166' : 'var(--text-tertiary)',
                  opacity: sub.whatsapp ? 1 : 0.5 }}>
                <WA s={18} />
                <span style={{ fontSize:9, fontWeight:700 }}>واتساب</span>
              </motion.button>

              {/* TikTok */}
              <motion.button whileTap={{ scale:0.88 }}
                onClick={() => sub.tiktok
                  ? window.open(`https://tiktok.com/@${sub.tiktok.replace('@','')}`, '_blank')
                  : toast.info('لم يضف المشترك حساب تيك توك بعد')}
                className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5"
                style={{ background: sub.tiktok ? 'rgba(255,255,255,0.06)' : 'var(--bg-soft)',
                  border: sub.tiktok ? '1px solid rgba(255,255,255,0.15)' : '1px solid var(--glass-border)',
                  color: sub.tiktok ? 'var(--text-main)' : 'var(--text-tertiary)',
                  opacity: sub.tiktok ? 1 : 0.5 }}>
                <TT s={18} />
                <span style={{ fontSize:9, fontWeight:700 }}>تيك توك</span>
              </motion.button>

              {/* Telegram */}
              <motion.button whileTap={{ scale:0.88 }}
                onClick={() => sub.whatsapp
                  ? window.open(`https://t.me/+${sub.whatsapp.replace(/\D/g,'')}`, '_blank')
                  : toast.info('لا يوجد رقم للتواصل')}
                className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5"
                style={{ background:'rgba(41,182,246,0.08)', border:'1px solid rgba(41,182,246,0.2)',
                  color:'#29B6F6' }}>
                <TG s={18} />
                <span style={{ fontSize:9, fontWeight:700 }}>تيليغرام</span>
              </motion.button>
            </div>
          </div>

          {/* ── ملاحظاتي السرية ── */}
          <div className="rounded-[18px] p-4"
            style={{ background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.18)' }}>
            <div className="flex items-center gap-2 mb-3 icon-wrap">
              <Icon i={StickyNote} size={13} color="#D4AF37" />
              <p style={{ fontSize:'var(--text-2xs)', color:'#D4AF37', fontWeight:700 }}>
                ملاحظاتي السرية — لن يراها المشترك
              </p>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="اكتب انطباعك ومتابعتك هنا..."
              style={{ width:'100%', padding:'12px', borderRadius:14, outline:'none', resize:'none',
                background:'var(--glass-bg)', border:'1px solid var(--glass-border)',
                color:'var(--text-main)', fontSize:'var(--text-xs)', fontFamily:'inherit',
                lineHeight:'var(--lh-relaxed)' }} />
            {notes !== sub.notes && (
              <motion.button whileTap={{ scale:0.97 }} onClick={saveNotes} disabled={saving}
                className="w-full mt-2 py-2.5 rounded-2xl font-black flex items-center justify-center gap-2 icon-wrap"
                style={{ background:'rgba(212,175,55,0.12)', border:'1px solid rgba(212,175,55,0.3)',
                  color:'#D4AF37', fontSize:'var(--text-xs)', opacity: saving ? 0.7 : 1 }}>
                <Icon i={Save} size={12} color="#D4AF37" />
                {saving ? 'جارٍ الحفظ...' : 'حفظ الملاحظة'}
              </motion.button>
            )}
          </div>

          {/* ── التوثيق ── */}
          <motion.button whileTap={{ scale:0.97 }} onClick={toggleVerify} disabled={toggling}
            className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 icon-wrap"
            style={{ background: isVerified ? 'rgba(37,99,235,0.10)' : 'var(--glass-bg)',
              border: isVerified ? '1.5px solid rgba(37,99,235,0.30)' : '1px solid var(--glass-border)',
              opacity: toggling ? 0.7 : 1 }}>
            <Icon i={isVerified ? UserCheck : ShieldCheck} size={16}
              color={isVerified ? '#2563EB' : 'var(--text-tertiary)'} />
            <span className="font-black"
              style={{ fontSize:'var(--text-sm)', color: isVerified ? '#2563EB' : 'var(--text-tertiary)' }}>
              {isVerified ? 'موثَّق ✓  —  إلغاء التوثيق' : 'توثيق الحساب'}
            </span>
          </motion.button>

          {/* ── عرض الحساب الكامل ── */}
          <motion.button whileTap={{ scale:0.97 }}
            onClick={() => router.push(`/view?id=${sub.id}`)}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 icon-wrap font-black text-white"
            style={{ background:'linear-gradient(135deg,#800020,var(--color-primary))',
              boxShadow:'0 8px 24px var(--shadow-red-glow)', fontSize:'var(--text-sm)' }}>
            <Icon i={ExternalLink} size={16} color="#fff" />
            عرض الحساب الكامل
          </motion.button>

        </div>
      </motion.div>
    </>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════ */
export default function SubscribersPage() {
  const [userId,   setUserId]   = useState<string | null>(null);
  const [subs,     setSubs]     = useState<FullSub[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState<FullSub | null>(null);

  // Filters
  const [q,          setQ]          = useState('');
  const [gender,     setGender]     = useState<GF>('all');
  const [status,     setStatus]     = useState<SF>('active');
  const [ageMin,     setAgeMin]     = useState('');
  const [ageMax,     setAgeMax]     = useState('');
  const [cityQ,      setCityQ]      = useState('');
  const [sort,       setSort]       = useState<SK>('newest');
  const [showFilter, setShowFilter] = useState(false);

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data: ms } = await supabase
      .from('mediator_subscriptions')
      .select('id, status, expires_at, created_at')
      .eq('mediator_id', user.id)
      .order('created_at', { ascending: false });

    if (!ms?.length) { setSubs([]); setLoading(false); return; }

    const ids = ms.map(s => s.id);

    const [profRes, notesRes] = await Promise.all([
      supabase.from('profiles')
        .select('id,full_name,avatar_url,age,city,country,gender,profile_completion_percent,whatsapp,tiktok,verification_status')
        .in('id', ids),
      supabase.from('mediator_notes')
        .select('id, content')            // id = subscriber_id في هذا الجدول
        .eq('mediator_id', user.id)
        .in('id', ids),
    ]);

    const pMap = Object.fromEntries((profRes.data ?? []).map(p => [p.id, p]));
    const nMap = Object.fromEntries((notesRes.data ?? []).map(n => [n.id, n.content ?? '']));

    setSubs(ms.map(s => ({
      id: s.id, status: s.status, expires_at: s.expires_at, subscribed_at: s.created_at,
      full_name:                  pMap[s.id]?.full_name ?? '—',
      avatar_url:                 pMap[s.id]?.avatar_url ?? null,
      age:                        pMap[s.id]?.age ?? null,
      city:                       pMap[s.id]?.city ?? null,
      country:                    pMap[s.id]?.country ?? null,
      gender:                     pMap[s.id]?.gender ?? 'male',
      profile_completion_percent: pMap[s.id]?.profile_completion_percent ?? 0,
      whatsapp:                   pMap[s.id]?.whatsapp ?? null,
      tiktok:                     pMap[s.id]?.tiktok ?? null,
      verification_status:        pMap[s.id]?.verification_status ?? null,
      notes:                      nMap[s.id] ?? '',
    })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateSub = useCallback((id: string, patch: Partial<FullSub>) => {
    setSubs(p => p.map(s => s.id === id ? { ...s, ...patch } : s));
    setSelected(p => p?.id === id ? { ...p, ...patch } : p);
  }, []);

  /* ── Filter + Sort ── */
  const filtered = useMemo(() => {
    let list = subs.filter(s => {
      if (q && !s.full_name.toLowerCase().includes(q.toLowerCase())) return false;
      if (gender !== 'all' && s.gender !== gender) return false;
      if (status !== 'all') {
        const st = subStatus(s).label;
        if (status === 'active'    && st !== 'نشط' && !st.includes('متبقية')) return false;
        if (status === 'cancelled' && s.status !== 'cancelled') return false;
        if (status === 'expired'   && (s.status === 'cancelled' || daysLeft(s.expires_at) > 0)) return false;
      }
      if (ageMin && (s.age ?? 0) < +ageMin) return false;
      if (ageMax && (s.age ?? 99) > +ageMax) return false;
      if (cityQ  && !(s.city ?? '').toLowerCase().includes(cityQ.toLowerCase())) return false;
      return true;
    });
    if (sort === 'newest')     list.sort((a,b) => b.subscribed_at.localeCompare(a.subscribed_at));
    if (sort === 'oldest')     list.sort((a,b) => a.subscribed_at.localeCompare(b.subscribed_at));
    if (sort === 'completion') list.sort((a,b) => b.profile_completion_percent - a.profile_completion_percent);
    return list;
  }, [subs, q, gender, status, ageMin, ageMax, cityQ, sort]);

  /* ── Stats ── */
  const activeCnt  = subs.filter(s => daysLeft(s.expires_at) > 0 && s.status === 'active').length;
  const maleCnt    = subs.filter(s => s.gender === 'male').length;
  const femaleCnt  = subs.filter(s => s.gender === 'female').length;

  if (loading) return (
    <div className="h-screen flex items-center justify-center" style={{ background:'var(--bg-main)' }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:'linear' }}
        style={{ width:36, height:36, borderRadius:'50%',
          border:'3px solid var(--glass-border)', borderTopColor:'var(--color-primary)' }} />
    </div>
  );

  return (
    <div dir="rtl" className="min-h-full" style={{ background:'var(--bg-main)', paddingBottom:'var(--nav-h-safe)' }}>

      {/* ══ HEADER ════════════════════════════════════════ */}
      <div className="px-4 pt-5 pb-3">
        <div className="rounded-[24px] p-4"
          style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-black" style={{ fontSize:'var(--text-base)', color:'var(--text-main)' }}>
              مشتركوني
            </p>
            <span className="px-3 py-1 rounded-full font-black"
              style={{ fontSize:'var(--text-2xs)', background:'var(--color-primary-soft)',
                border:'1px solid var(--border-soft)', color:'var(--color-primary)' }}>
              {subs.length}
            </span>
          </div>
          <div className="flex gap-2">
            {[['نشطون', activeCnt, '#34d399'], ['ذكور', maleCnt, '#60A5FA'], ['إناث', femaleCnt, '#F472B6']]
              .map(([l, v, c]) => (
                <div key={l as string} className="flex-1 rounded-2xl py-2 text-center"
                  style={{ background:`${c}10`, border:`1px solid ${c}25` }}>
                  <p className="font-black" style={{ fontSize:'var(--text-base)', color:c as string }}>{v}</p>
                  <p style={{ fontSize:'var(--text-2xs)', color:`${c}80`, fontWeight:700 }}>{l}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ══ SEARCH + FILTER ═══════════════════════════════ */}
      <div className="px-4 space-y-2 mb-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-4 rounded-2xl"
            style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)', height:44 }}>
            <Icon i={Search} size={15} color="var(--text-tertiary)" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث بالاسم..."
              style={{ flex:1, background:'transparent', border:'none', outline:'none',
                color:'var(--text-main)', fontSize:'var(--text-sm)', fontFamily:'inherit' }} />
            {q && <button onClick={() => setQ('')}><Icon i={X} size={13} color="var(--text-tertiary)" /></button>}
          </div>
          <motion.button whileTap={{ scale:0.92 }} onClick={() => setShowFilter(v => !v)}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 icon-wrap"
            style={{ background: showFilter ? 'var(--color-primary-soft)' : 'var(--glass-bg)',
              border: showFilter ? '1px solid var(--border-soft)' : '1px solid var(--glass-border)' }}>
            <Icon i={SlidersHorizontal} size={16}
              color={showFilter ? 'var(--color-primary)' : 'var(--text-tertiary)'} />
          </motion.button>
        </div>

        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }} className="overflow-hidden">
              <div className="rounded-[20px] p-4 space-y-4"
                style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>

                {/* Gender */}
                <div>
                  <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:700, marginBottom:8 }}>الجنس</p>
                  <div className="flex gap-2">
                    {(['all','male','female'] as GF[]).map(g => (
                      <button key={g} onClick={() => setGender(g)} className="flex-1 py-2 rounded-xl font-bold"
                        style={{ fontSize:'var(--text-2xs)',
                          background: gender===g ? 'var(--color-primary-soft)' : 'var(--bg-soft)',
                          border: gender===g ? '1px solid var(--border-soft)' : '1px solid var(--glass-border)',
                          color: gender===g ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                        {g==='all'?'الكل':g==='male'?'ذكور':'إناث'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:700, marginBottom:8 }}>الحالة</p>
                  <div className="flex gap-2 flex-wrap">
                    {(['all','active','cancelled','expired'] as SF[]).map(s => (
                      <button key={s} onClick={() => setStatus(s)} className="px-3 py-2 rounded-xl font-bold"
                        style={{ fontSize:'var(--text-2xs)',
                          background: status===s ? 'var(--color-primary-soft)' : 'var(--bg-soft)',
                          border: status===s ? '1px solid var(--border-soft)' : '1px solid var(--glass-border)',
                          color: status===s ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                        {s==='all'?'الكل':s==='active'?'نشط':s==='cancelled'?'ملغى':'منتهي'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age */}
                <div>
                  <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:700, marginBottom:8 }}>العمر</p>
                  <div className="flex items-center gap-2">
                    {[['من', ageMin, setAgeMin], ['إلى', ageMax, setAgeMax]].map(([ph, val, set]) => (
                      <input key={ph as string} type="number" value={val as string}
                        onChange={e => (set as Function)(e.target.value)}
                        placeholder={ph as string} min={18} max={99}
                        style={{ flex:1, padding:'8px', borderRadius:12, outline:'none', textAlign:'center',
                          background:'var(--bg-soft)', border:'1px solid var(--glass-border)',
                          color:'var(--text-main)', fontSize:'var(--text-xs)', fontFamily:'inherit' }} />
                    ))}
                  </div>
                </div>

                {/* City */}
                <div>
                  <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:700, marginBottom:8 }}>المدينة</p>
                  <input value={cityQ} onChange={e => setCityQ(e.target.value)} placeholder="اسم المدينة..."
                    style={{ width:'100%', padding:'8px 12px', borderRadius:12, outline:'none',
                      background:'var(--bg-soft)', border:'1px solid var(--glass-border)',
                      color:'var(--text-main)', fontSize:'var(--text-xs)', fontFamily:'inherit' }} />
                </div>

                {/* Sort */}
                <div>
                  <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', fontWeight:700, marginBottom:8 }}>الترتيب</p>
                  <div className="flex gap-2">
                    {([['newest','الأحدث'],['oldest','الأقدم'],['completion','الأكمل']] as [SK,string][]).map(([k,l]) => (
                      <button key={k} onClick={() => setSort(k)} className="flex-1 py-2 rounded-xl font-bold"
                        style={{ fontSize:'var(--text-2xs)',
                          background: sort===k ? 'var(--color-primary-soft)' : 'var(--bg-soft)',
                          border: sort===k ? '1px solid var(--border-soft)' : '1px solid var(--glass-border)',
                          color: sort===k ? 'var(--color-primary)' : 'var(--text-tertiary)' }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reset */}
                {(gender!=='all'||status!=='active'||ageMin||ageMax||cityQ) && (
                  <button onClick={() => { setGender('all');setStatus('active');setAgeMin('');setAgeMax('');setCityQ(''); }}
                    className="w-full py-2.5 rounded-2xl font-bold icon-wrap"
                    style={{ fontSize:'var(--text-xs)', color:'var(--text-tertiary)',
                      background:'var(--bg-soft)', border:'1px solid var(--glass-border)' }}>
                    <Icon i={X} size={11} color="var(--text-tertiary)" className="inline ml-1" />
                    إعادة تعيين
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length !== subs.length && (
          <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)', textAlign:'center' }}>
            {filtered.length} من {subs.length}
          </p>
        )}
      </div>

      {/* ══ LIST ══════════════════════════════════════════ */}
      <div className="px-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-16 icon-wrap">
            <Icon i={Users} size={40} color="var(--text-tertiary)" className="mx-auto mb-3" />
            <p style={{ color:'var(--text-tertiary)', fontSize:'var(--text-sm)', fontWeight:700 }}>
              {subs.length === 0 ? 'لا يوجد مشتركون بعد' : 'لا توجد نتائج'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((s, i) => {
              const { label, color } = subStatus(s);
              const gc = s.gender === 'male' ? '#60A5FA' : '#F472B6';
              return (
                <motion.button key={s.id} layout
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  onClick={() => setSelected(s)}
                  className="w-full text-right rounded-[20px] p-3.5 flex items-center gap-3"
                  style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <Av src={s.avatar_url} name={s.full_name} size={48} ring={gc + '50'} />
                    {s.verification_status === 'verified' && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center icon-wrap"
                        style={{ background:'#2563EB', boxShadow:'0 0 0 1.5px var(--bg-surface)' }}>
                        <Icon i={UserCheck} size={8} color="#fff" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="font-black truncate"
                        style={{ fontSize:'var(--text-sm)', color:'var(--text-main)' }}>
                        {s.full_name}
                      </p>
                      <span style={{ fontSize:10, color:gc }}>{s.gender === 'male' ? '♂' : '♀'}</span>
                    </div>
                    <p style={{ fontSize:'var(--text-2xs)', color:'var(--text-tertiary)' }}>
                      {[s.age ? `${s.age}` : null, s.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>

                  {/* Status + indicators */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span style={{ fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:999,
                      background:`${color}18`, border:`1px solid ${color}35`, color }}>
                      {label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {s.notes && (
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'#D4AF37', display:'block' }} />
                      )}
                      {s.whatsapp && (
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'#25D166', display:'block' }} />
                      )}
                    </div>
                  </div>

                  <Icon i={ChevronLeft} size={14} color="var(--text-tertiary)" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ══ DETAIL SHEET ══════════════════════════════════ */}
      <AnimatePresence>
        {selected && (
          <SubDetailSheet
            key={selected.id}
            sub={selected}
            mediatorId={userId ?? ''}
            onClose={() => setSelected(null)}
            onUpdate={updateSub}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
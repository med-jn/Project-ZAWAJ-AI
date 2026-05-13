'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import {
  Home, BookSearch, Heart, Bell, User,
  HouseHeart, Users, LayoutDashboard,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ── نغمة الإشعار ─────────────────────────────────────────────
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const notes = [
      { freq: 880,  start: 0,    dur: 0.12, vol: 0.5  },
      { freq: 1108, start: 0.1,  dur: 0.12, vol: 0.45 },
      { freq: 1320, start: 0.2,  dur: 0.18, vol: 0.55 },
      { freq: 1760, start: 0.35, dur: 0.28, vol: 0.4  },
    ];
    notes.forEach(({ freq, start, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start); osc.stop(now + start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (_) {}
}

// ── جرس راقص (رقاص ساعة من نقطة الأعلى) ─────────────────────
function BellIcon({ ringing, active }: { ringing: boolean; active: boolean }) {
  const controls = useAnimation();

  useEffect(() => {
    if (!ringing) { controls.stop(); controls.set({ rotate: 0 }); return; }
    controls.start({
      rotate: [0, 20, -20, 16, -16, 12, -12, 8, -8, 4, -4, 0],
      transition: { duration: 1.0, ease: 'easeInOut' },
    });
  }, [ringing, controls]);

  return (
    <motion.div
      animate={controls}
      style={{ originX: '50%', originY: '10%', display: 'inline-flex' }}
    >
      {/* نستخدم SVG مباشرة لتجنب !important من globals.css */}
      <svg
        viewBox="0 0 24 24"
        style={{
          width:       'var(--icon-md)',
          height:      'var(--icon-md)',
          fill:        active ? 'var(--color-secondary)' : 'none',
          stroke:      active ? 'var(--bg-main)'         : 'var(--color-secondary)',
          strokeWidth: active ? 1.2                      : 1.5,
          transition:  'fill 0.15s ease, stroke 0.15s ease',
        }}
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    </motion.div>
  );
}

// ── أيقونة عامة تتجاوز !important ────────────────────────────
function NavIcon({
  active,
  bgStroke = false,
  paths,
  viewBox = '0 0 24 24',
}: {
  active:    boolean;
  bgStroke?: boolean;   // true = stroke بلون الخلفية عند التفعيل (home, mediator)
  children?: never;
  paths:     string[];
  viewBox?:  string;
}) {
  return (
    <svg
      viewBox={viewBox}
      style={{
        width:          'var(--icon-md)',
        height:         'var(--icon-md)',
        fill:           active ? 'var(--color-secondary)' : 'none',
        stroke:         active && bgStroke
                          ? 'var(--bg-main)'
                          : 'var(--color-secondary)',
        strokeWidth:    active && bgStroke ? 1.2 : 1.5,
        strokeLinecap:  'round' as any,
        strokeLinejoin: 'round' as any,
        transition:     'fill 0.15s ease, stroke 0.15s ease',
      }}
    >
      {paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

// مسارات SVG للأيقونات المطلوبة
const ICON_PATHS = {
  user:     ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  heart:    ['M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'],
  users:    ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', 'M23 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
  bookSearch:['M4 19.5A2.5 2.5 0 0 1 6.5 17H20','M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z','M12 7h4','M12 11h2','M17.5 17.5l1.5 1.5','M14.5 14.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  clipboard: ['M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2','M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z','M9 12h6','M9 16h4'],
};

// ── Props ─────────────────────────────────────────────────────
interface NavbarProps {
  activeTab:  string;
  onTabClick: (route: string) => void; // يستقبل المسار مباشرة بدون /
}

export default function Navbar({ activeTab, onTabClick }: NavbarProps) {
  const [unread,  setUnread]  = useState(0);
  const [role,    setRole]    = useState<'user' | 'mediator'>('user');
  const [ringing, setRinging] = useState(false);

  // ── جلب role مرة واحدة ───────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'mediator') setRole('mediator');
    });
  }, []);

  // ── إشعارات real-time ────────────────────────────────────
  const pathname = usePathname();

  const loadUnread = useCallback(async (userId: string) => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('id', userId)
      .eq('is_read', false);
    setUnread(count ?? 0);
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // جلب أولي
      loadUnread(user.id);

      // real-time — يُفعَّل فقط إذا كان Realtime مفعلاً على الجدول
      const ch = supabase.channel('navbar_notifs')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          // إشعار جديد فقط — ليس تحديث is_read
          if (payload.new && !payload.new.is_read) {
            loadUnread(user.id);
            playNotifSound();
            setRinging(true);
            setTimeout(() => setRinging(false), 1200);
            window.navigator?.vibrate?.([40, 20, 60, 20, 40]);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'public', table: 'notifications',
          filter: `id=eq.${user.id}`,
        }, () => {
          // عند تحديث is_read — يعيد الجلب بدون صوت
          loadUnread(user.id);
        })
        .subscribe();

      cleanup = () => { supabase.removeChannel(ch); };
    };
    init();
    return () => { cleanup?.(); };
  }, [loadUnread]);

  // ── إعادة جلب العداد عند الانتقال لصفحة الإشعارات ──────────
  useEffect(() => {
    if (!pathname.startsWith('/notifications')) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUnread(user.id);
    });
  }, [pathname, loadUnread]);

  const go = (route: string) => {
    if (route === 'notifications' && unread > 0) {
      window.navigator?.vibrate?.([30, 20, 30]);
    } else {
      window.navigator?.vibrate?.(25);
    }
    onTabClick(route);
  };

  // ── تعريف التبويبات حسب الـ role ─────────────────────────
  //
  // onTabClick يستقبل المسار بدون / — ClientLayout يضيف /
  //
  // activeTab القيم: home | likes | notifications | profile | mediator
  // (يُعيَّن في ClientLayout)
  //
  const isMediator = role === 'mediator';

  const tabs = [
    // ── يسار: حسابي ──
    {
      tabKey:   'profile',
      route:    isMediator ? 'dash' : 'profile',
      label:    'حسابي',
      paths:    isMediator ? ICON_PATHS.clipboard : ICON_PATHS.user,
      bgStroke: isMediator,   // stroke خلفية فقط عند الوسيط
    },
    // ── إشعارات ──
    {
      tabKey:  'notifications',
      route:   'notifications',
      label:   'إشعارات',
      isBell:  true,
    },
    // ── مركز (mediator center) ──
    {
      tabKey:   'mediator',
      route:    'mediators',
      isCenter: true,
    },
    // ── إعجابات / مشتركون ──
    {
      tabKey:  'likes',
      route:   isMediator ? 'subscribers' : 'likes',
      label:   isMediator ? 'المشتركون' : 'إعجابات',
      paths:   isMediator ? ICON_PATHS.users : ICON_PATHS.heart,
    },
    // ── الرئيسية ──
    {
      tabKey:   'home',
      route:    'home',
      label:    'الرئيسية',
      paths:    ICON_PATHS.bookSearch,
      bgStroke: true,   // stroke خلفية عند التفعيل
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1000] flex items-center justify-around"
      style={{
        height:        'var(--nav-h)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background:    'var(--bg-main)',
        borderTop:     '1px solid var(--glass-border)',
      }}
    >
      {tabs.map(tab => {
        const active = activeTab === tab.tabKey;

        // ── الزر المركزي ──────────────────────────────────
        if (tab.isCenter) return (
          <div key="center" style={{ marginTop: -16, flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.86 }}
              onClick={() => go(tab.route)}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                width:         'calc(var(--icon-xl) * 1.55)',
                height:        'calc(var(--icon-xl) * 1.55)',
                borderRadius:  '50%',
                background:    active
                  ? 'radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--color-primary) 80%, #fff 20%), var(--color-primary) 70%)'
                  : 'radial-gradient(circle at 38% 32%, var(--color-primary), color-mix(in srgb, var(--color-primary) 55%, #000 45%) 70%)',
                boxShadow:     active
                  ? '0 2px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 6px 18px rgba(179,51,75,0.65)'
                  : '0 2px 0 rgba(255,255,255,0.14) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 12px rgba(179,51,75,0.45)',
                outline:       '3px solid var(--bg-main)',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                position:      'relative',
                overflow:      'hidden',
              }}
            >
              {/* بريق زجاجي */}
              <div style={{
                position: 'absolute', top: 4, left: 8, right: 8,
                height: '34%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
                borderRadius: '50%', filter: 'blur(1.5px)', pointerEvents: 'none',
              }} />
              {/* الأيقونة — أبيض دائماً بصرف النظر عن الثيم */}
              <svg
                viewBox="0 0 24 24"
                style={{
                  width:          'var(--icon-lg)',
                  height:         'var(--icon-lg)',
                  fill:           'none',
                  stroke:         '#FFFFFF',
                  strokeWidth:    2,
                  strokeLinecap:  'round' as any,
                  strokeLinejoin: 'round' as any,
                }}
              >
                {/* HouseHeart — بيت + قلب داخله */}
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
                <path d="M12 17c0 0-4-2.5-4-5a2 2 0 0 1 4 0 2 2 0 0 1 4 0c0 2.5-4 5-4 5z"/>
              </svg>
            </motion.button>
          </div>
        );

        // ── التبويبات العادية ──────────────────────────────
        return (
          <button
            key={tab.tabKey}
            onClick={() => go(tab.route)}
            className="flex flex-col items-center justify-center flex-1 h-full"
            style={{ gap: '3px' }}
          >
            <div className="relative">
              <motion.div
                animate={{ scale: active ? 1.12 : 1 }}
                transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              >
                {tab.isBell ? (
                  <BellIcon ringing={ringing} active={active} />
                ) : (
                  <NavIcon active={active} paths={tab.paths!} bgStroke={tab.bgStroke ?? false} />
                )}
              </motion.div>

              {/* بادج الإشعارات */}
              {tab.tabKey === 'notifications' && unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position:   'absolute',
                    top:        'calc(var(--icon-md) * -0.3)',
                    left:       'calc(var(--icon-md) * -0.3)',
                    minWidth:   'calc(var(--text-xs) * 1.4)',
                    height:     'calc(var(--text-xs) * 1.4)',
                    borderRadius: '999px',
                    background:  'var(--color-accent)',
                    color:       '#fff',
                    fontSize:    'calc(var(--text-2xs) * 0.85)',
                    fontWeight:  900,
                    display:     'flex',
                    alignItems:  'center',
                    justifyContent: 'center',
                    border:      '1.5px solid var(--bg-main)',
                    paddingInline: 2,
                  }}
                >
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </div>

            <span style={{
              fontSize:   'calc(var(--text-2xs) * 0.88)',
              fontWeight: active ? 800 : 500,
              color:      'var(--color-secondary)',
              opacity:    active ? 1 : 0.45,
              lineHeight: 1,
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
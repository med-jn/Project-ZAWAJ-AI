'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import {
  Crown,
  Heart,
  Bell,
  User,
  Users,
  LayoutDashboard,
} from 'lucide-react';

function HouseHeartIcon({ active, size = 'var(--icon-lg)' }: { active: boolean; size?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      style={{
        width:          size,
        height:         size,
        display:        'block',
        fill:           'none',
        stroke:         active ? 'var(--bg-main)' : 'var(--color-secondary)',
        strokeWidth:    active ? 1.4 : 1.6,
        strokeLinecap:  'round',
        strokeLinejoin: 'round',
        opacity:        active ? 1 : 0.42,
        transition:     'all .15s ease',
      }}
    >
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
        fill={active ? 'var(--color-secondary)' : 'none'}
        stroke={active ? 'var(--color-secondary)' : 'var(--color-secondary)'}
      />
      <path
        d="M12 17c0 0-4-2.2-4-4.5A2.3 2.3 0 0 1 12 11a2.3 2.3 0 0 1 4 1.5C16 14.8 12 17 12 17z"
        fill={active ? 'var(--bg-main)' : 'none'}
        stroke={active ? 'var(--bg-main)' : 'var(--color-secondary)'}
        strokeWidth={active ? 0 : 1.5}
      />
    </svg>
  );
}

import { supabase } from '@/lib/supabase/client';

function playNotifSound() {
  try {
    const audio = new Audio('/sounds/bell.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (_) {}
}

type LucideComp = React.ElementType;
type StrokeMode = 'bg' | 'same';

interface NavIconProps {
  Icon:        LucideComp;
  active:      boolean;
  size?:       number | string;
  strokeMode?: StrokeMode;
}

function NavIcon({ Icon, active, size = 'var(--icon-lg)', strokeMode = 'bg' }: NavIconProps) {
  const activeStroke = strokeMode === 'same'
    ? 'var(--color-secondary)'
    : 'var(--bg-main)';

  return (
    <Icon
      style={{
        width:       size,
        height:      size,
        display:     'block',
        fill:        active ? 'var(--color-secondary)' : 'none',
        stroke:      active ? activeStroke : 'var(--color-secondary)',
        strokeWidth: active ? 1.4 : 1.6,
        opacity:     active ? 1 : 0.42,
        transition:  'fill .15s ease, stroke .15s ease, opacity .15s ease',
      }}
    />
  );
}

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
      <NavIcon Icon={Bell} active={active} />
    </motion.div>
  );
}

// ── التاج العائم — بدون دائرة، الخط نفسه هو الزجاج ────────────
// stroke شفاف يعكس الضوء كالزجاج، fill شفاف تماماً
// عند التفعيل: glow ناعم يضيء الخط
function GlassCrownBtn({
  active,
  onClick,
}: {
  active:  boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.82, transition: { type: 'spring', stiffness: 600, damping: 20 } }}
      whileHover={{ scale: 1.08 }}
      style={{
        background:     'none',
        border:         'none',
        outline:        'none',
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        'var(--sp-2)',
        WebkitTapHighlightColor: 'transparent',
        // يرتفع فوق الشريط قليلاً
        marginTop:      'calc(var(--nav-h) * -0.18)',
      }}
    >
      <Crown
        style={{
          // أكبر قليلاً من أيقونات الشريط
          width:          'calc(var(--icon-lg) * 1.35)',
          height:         'calc(var(--icon-lg) * 1.35)',
          display:        'block',
          // ── fill شفاف، stroke يرث الثيم تلقائياً ──
          fill:           'transparent',
          stroke:         active
            ? 'var(--color-secondary)'
            : 'var(--text-tertiary)',
          strokeWidth:    active ? 1.6 : 1.4,
          strokeLinecap:  'round',
          strokeLinejoin: 'round',
          // ── ظل مزدوج: يظهر على الخلفيات الفاتحة والداكنة ──
          filter: active
            ? `drop-shadow(0 0 5px rgba(255,255,255,0.45)) drop-shadow(0 2px 8px rgba(0,0,0,0.60))`
            : `drop-shadow(0 1px 0 rgba(255,255,255,0.28)) drop-shadow(0 2px 6px rgba(0,0,0,0.55))`,
          transition: 'stroke .2s ease, filter .2s ease',
        }}
      />
    </motion.button>
  );
}

interface NavbarProps {
  activeTab:  string;
  onTabClick: (route: string) => void;
}

export default function Navbar({ activeTab, onTabClick }: NavbarProps) {
  const [unread,  setUnread]  = useState(0);
  const [role,    setRole]    = useState<'user' | 'mediator'>('user');
  const [ringing, setRinging] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();
      if (data?.role === 'mediator') setRole('mediator');
    });
  }, []);

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
      loadUnread(user.id);
      const ch = supabase.channel('navbar_notifs')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'notifications',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
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
        }, () => { loadUnread(user.id); })
        .subscribe();
      cleanup = () => { supabase.removeChannel(ch); };
    };
    init();
    return () => { cleanup?.(); };
  }, [loadUnread]);

  useEffect(() => {
    if (!pathname.startsWith('/notifications')) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadUnread(user.id);
    });
  }, [pathname, loadUnread]);

  const go = (route: string) => {
    window.navigator?.vibrate?.(route === 'notifications' && unread > 0 ? [30, 20, 30] : 25);
    onTabClick(route);
  };

  const isMediator = role === 'mediator';

  const tabs = [
    { tabKey: 'profile',       route: isMediator ? 'dash' : 'profile', Icon: isMediator ? LayoutDashboard : User, strokeMode: 'same' as StrokeMode },
    { tabKey: 'notifications', route: 'notifications', isBell: true },
    { tabKey: 'mediator',      route: 'mediators',     isCenter: true },
    { tabKey: 'likes',         route: isMediator ? 'subscribers' : 'likes', Icon: isMediator ? Users : Heart, strokeMode: 'bg' as StrokeMode },
    { tabKey: 'home',          route: 'home', isHouseHeart: true },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1000]" data-zawaj-nav=""
      style={{
        height:              'var(--nav-h-safe)',
        paddingBottom:       'env(safe-area-inset-bottom, 0px)',

        // ── الوضع الليلي: زجاج شفاف جداً — لون خفيف لا يكاد يُلاحظ ──
        background:          'rgba(8,0,8,0.12)',
        backdropFilter:      'blur(28px) saturate(180%)',
        WebkitBackdropFilter:'blur(28px) saturate(180%)',

        // ── حافة علوية دقيقة جداً ──
        borderTop:           '1px solid rgba(255,255,255,0.06)',

        display:             'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
        alignItems:          'center',
      }}
    >
      {/* ── الوضع النهاري: يُعاد تعريف الخلفية عبر CSS ── */}
      <style>{`
        html.light nav[data-zawaj-nav] {
          background:           rgba(255,255,255,0.12) !important;
          border-top-color:     rgba(0,0,0,0.05) !important;
        }
      `}</style>

      {tabs.map(tab => {
        const active = activeTab === tab.tabKey;

        if (tab.isCenter) return (
          <div
            key="center"
            style={{
              display:        'flex',
              justifyContent: 'center',
              alignItems:     'center',
            }}
          >
            <GlassCrownBtn active={active} onClick={() => go(tab.route)} />
          </div>
        );

        return (
          <button
            key={tab.tabKey}
            onClick={() => go(tab.route)}
            style={{
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              height:         '100%',
              background:     'none',
              border:         'none',
              padding:         0,
              cursor:         'pointer',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              {tab.isBell
                ? <BellIcon ringing={ringing} active={active} />
                : tab.isHouseHeart
                  ? <HouseHeartIcon active={active} />
                  : <NavIcon Icon={tab.Icon!} active={active} strokeMode={tab.strokeMode ?? 'bg'} />
              }

              {tab.tabKey === 'notifications' && unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position:       'absolute',
                    top:            'calc(var(--icon-lg) * -0.28)',
                    left:           'calc(var(--icon-lg) * -0.28)',
                    minWidth:       'calc(var(--text-xs) * 1.4)',
                    height:         'calc(var(--text-xs) * 1.4)',
                    borderRadius:   '999px',
                    background:     '#FF0000',
                    color:          '#ffffff',
                    fontSize:       'calc(var(--text-2xs) * 0.85)',
                    fontWeight:      900,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    paddingInline:   2,
                  }}
                >
                  {unread > 99 ? '99+' : unread}
                </motion.span>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
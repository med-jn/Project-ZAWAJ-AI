'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

// ── نغمة الإشعار ──────────────────────────────────────────────
function playNotifSound() {
  try {
    const audio = new Audio('/sounds/bell.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (_) {}
}

// ── SVG مباشر — يتجاوز globals.css تماماً ────────────────────
// globals.css: svg { fill:none; stroke:currentColor; stroke-width:2px }
// inline style على SVG نفسه يتفوق عليه دائماً في CSS cascade

type IconProps = { active: boolean; size?: string };

// الرئيسية — House with heart (HouseHeart مرسومة يدوياً)
function IconHome({ active, size = 'var(--icon-md)' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{
      width: size, height: size,
      fill: active ? 'var(--color-secondary)' : 'none',
      stroke: 'var(--color-secondary)',
      strokeWidth: active ? 1.2 : 1.6,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      opacity: active ? 1 : 0.45,
      transition: 'fill .15s ease, opacity .15s ease',
      display: 'block',
    }}>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
      <path
        fill={active ? 'var(--bg-main)' : 'none'}
        stroke={active ? 'var(--bg-main)' : 'var(--color-secondary)'}
        strokeWidth={active ? 1 : 1.4}
        d="M12 16.5c0 0-3.5-2-3.5-4.2a2 2 0 0 1 3.5-1.3 2 2 0 0 1 3.5 1.3c0 2.2-3.5 4.2-3.5 4.2z"
      />
    </svg>
  );
}

// قلب — Likes
function IconHeart({ active, size = 'var(--icon-md)' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{
      width: size, height: size,
      fill: active ? 'var(--color-secondary)' : 'none',
      stroke: 'var(--color-secondary)',
      strokeWidth: active ? 1.2 : 1.6,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      opacity: active ? 1 : 0.45,
      transition: 'fill .15s ease, opacity .15s ease',
      display: 'block',
    }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}

// مستخدم — Profile
function IconUser({ active, size = 'var(--icon-md)' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{
      width: size, height: size,
      fill: active ? 'var(--color-secondary)' : 'none',
      stroke: 'var(--color-secondary)',
      strokeWidth: active ? 1.2 : 1.6,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      opacity: active ? 1 : 0.45,
      transition: 'fill .15s ease, opacity .15s ease',
      display: 'block',
    }}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4" fill={active ? 'var(--color-secondary)' : 'none'}/>
    </svg>
  );
}

// داشبورد — Mediator profile
function IconDashboard({ active, size = 'var(--icon-md)' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{
      width: size, height: size,
      fill: 'none',
      stroke: 'var(--color-secondary)',
      strokeWidth: active ? 1.4 : 1.6,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      opacity: active ? 1 : 0.45,
      transition: 'opacity .15s ease',
      display: 'block',
    }}>
      <rect x="3" y="3" width="7" height="7" fill={active ? 'var(--color-secondary)' : 'none'}/>
      <rect x="14" y="3" width="7" height="7" fill={active ? 'var(--color-secondary)' : 'none'}/>
      <rect x="3" y="14" width="7" height="7" fill={active ? 'var(--color-secondary)' : 'none'}/>
      <rect x="14" y="14" width="7" height="7" fill={active ? 'var(--color-secondary)' : 'none'}/>
    </svg>
  );
}

// مجموعة — Subscribers
function IconUsers({ active, size = 'var(--icon-md)' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" style={{
      width: size, height: size,
      fill: active ? 'var(--color-secondary)' : 'none',
      stroke: 'var(--color-secondary)',
      strokeWidth: active ? 1.2 : 1.6,
      strokeLinecap: 'round', strokeLinejoin: 'round',
      opacity: active ? 1 : 0.45,
      transition: 'fill .15s ease, opacity .15s ease',
      display: 'block',
    }}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4" fill={active ? 'var(--color-secondary)' : 'none'}/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

// جرس — Notifications (مع الرقاص)
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
      <svg viewBox="0 0 24 24" style={{
        width: 'var(--icon-md)', height: 'var(--icon-md)',
        fill: active ? 'var(--color-secondary)' : 'none',
        stroke: 'var(--color-secondary)',
        strokeWidth: active ? 1.2 : 1.6,
        strokeLinecap: 'round', strokeLinejoin: 'round',
        opacity: active ? 1 : 0.45,
        transition: 'fill .15s ease, opacity .15s ease',
        display: 'block',
      }}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path
          fill="none"
          stroke={active ? 'var(--bg-main)' : 'var(--color-secondary)'}
          d="M13.73 21a2 2 0 0 1-3.46 0"
        />
      </svg>
    </motion.div>
  );
}

// ── Props ─────────────────────────────────────────────────────
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
    { tabKey: 'profile',       route: isMediator ? 'dash'        : 'profile'  },
    { tabKey: 'notifications', route: 'notifications'                          },
    { tabKey: 'mediator',      route: 'mediators',   isCenter: true            },
    { tabKey: 'likes',         route: isMediator ? 'subscribers' : 'likes'    },
    { tabKey: 'home',          route: 'home'                                   },
  ];

  // أيقونة حسب tabKey و role
  const renderIcon = (tabKey: string, active: boolean) => {
    if (tabKey === 'notifications') return <BellIcon ringing={ringing} active={active} />;
    if (tabKey === 'home')          return <IconHome      active={active} />;
    if (tabKey === 'likes')         return isMediator ? <IconUsers  active={active} /> : <IconHeart active={active} />;
    if (tabKey === 'profile')       return isMediator ? <IconDashboard active={active} /> : <IconUser active={active} />;
    return null;
  };

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
          <div key="center" style={{ flexShrink: 0, marginTop: -14 }}>
            <motion.button
              whileTap={{ scale: 0.86 }}
              onClick={() => go(tab.route)}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                width:          'calc(var(--icon-xl) * 1.55)',
                height:         'calc(var(--icon-xl) * 1.55)',
                borderRadius:   '50%',
                background:     active
                  ? 'radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--color-primary) 80%, #fff 20%), var(--color-primary) 70%)'
                  : 'radial-gradient(circle at 38% 32%, var(--color-primary), color-mix(in srgb, var(--color-primary) 55%, #000 45%) 70%)',
                boxShadow:      active
                  ? '0 2px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 6px 18px rgba(179,51,75,0.65)'
                  : '0 2px 0 rgba(255,255,255,0.14) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 12px rgba(179,51,75,0.45)',
                outline:        '3px solid var(--bg-main)',
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                position:       'relative',
                overflow:       'hidden',
              }}
            >
              <div style={{
                position: 'absolute', top: 4, left: 8, right: 8, height: '34%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
                borderRadius: '50%', filter: 'blur(1.5px)', pointerEvents: 'none',
              }} />
              {/* Crown — Lucide، inline style يتجاوز globals.css */}
              <svg viewBox="0 0 24 24" style={{
                width: 'var(--icon-lg)', height: 'var(--icon-lg)',
                fill: 'none', stroke: '#FFFFFF',
                strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round',
                position: 'relative', zIndex: 1,
              }}>
                <path d="M2 20h20M5 20l-1-9 5 4 3-7 3 7 5-4-1 9"/>
              </svg>
            </motion.button>
          </div>
        );

        // ── التبويبات العادية — أيقونة فقط بدون نص ────────
        return (
          <button
            key={tab.tabKey}
            onClick={() => go(tab.route)}
            className="flex items-center justify-center flex-1 h-full"
          >
            <div className="relative" style={{ display: 'inline-flex' }}>
              {renderIcon(tab.tabKey, active)}

              {/* بادج الإشعارات */}
              {tab.tabKey === 'notifications' && unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: 'absolute',
                    top: 'calc(var(--icon-md) * -0.3)',
                    left: 'calc(var(--icon-md) * -0.3)',
                    minWidth: 'calc(var(--text-xs) * 1.4)',
                    height: 'calc(var(--text-xs) * 1.4)',
                    borderRadius: '999px',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 'calc(var(--text-2xs) * 0.85)',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid var(--bg-main)',
                    paddingInline: 2,
                  }}
                >
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </div>
          </button>
        );
      })}
    </nav>
  );
}
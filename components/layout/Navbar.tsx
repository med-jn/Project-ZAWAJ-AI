'use client';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { motion, useAnimation } from 'framer-motion';
import { Crown } from 'lucide-react';
import {
  Bell,
  House,
  Layout,
  Heart,
  Users,
  User,
} from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase/client';

// ── نغمة الإشعار من ملف mp3 ───────────────────────────────────
function playNotifSound() {
  try {
    const audio = new Audio('/sounds/bell.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
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
      {/*
        .ph-icon يُبطل: fill:none; stroke:currentColor; stroke-width:2px
        التي يُطبّقها globals.css على كل SVG
      */}
      <span className="ph-icon" style={{ display: 'inline-flex' }}>
        <Bell
          size="var(--icon-md)"
          weight={active ? 'fill' : 'regular'}
          color="var(--color-secondary)"
          style={{ opacity: active ? 1 : 0.45, transition: 'opacity 0.15s ease' }}
        />
      </span>
    </motion.div>
  );
}

// ── أيقونة تبويب عامة ─────────────────────────────────────────
function NavIcon({
  active,
  icon: Icon,
}: {
  active: boolean;
  icon: React.ElementType;
}) {
  return (
    <span className="ph-icon" style={{ display: 'inline-flex' }}>
      <Icon
        size="var(--icon-md)"
        weight={active ? 'fill' : 'regular'}
        color="var(--color-secondary)"
        style={{ opacity: active ? 1 : 0.45, transition: 'opacity 0.15s ease' }}
      />
    </span>
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
        }, () => {
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

  const isMediator = role === 'mediator';

  // ── تعريف التبويبات ───────────────────────────────────────
  const tabs = [
    {
      tabKey: 'profile',
      route:  isMediator ? 'dash' : 'profile',
      label:  'حسابي',
      icon:   isMediator ? Layout : User,
    },
    {
      tabKey: 'notifications',
      route:  'notifications',
      label:  'إشعارات',
      isBell: true,
    },
    {
      tabKey:   'mediator',
      route:    'mediators',
      isCenter: true,
    },
    {
      tabKey: 'likes',
      route:  isMediator ? 'subscribers' : 'likes',
      label:  isMediator ? 'المشتركون' : 'إعجابات',
      icon:   isMediator ? Users : Heart,
    },
    {
      tabKey: 'home',
      route:  'home',
      label:  'الرئيسية',
      icon:   House,
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
              {/* بريق زجاجي */}
              <div style={{
                position:      'absolute',
                top:           4, left: 8, right: 8,
                height:        '34%',
                background:    'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
                borderRadius:  '50%',
                filter:        'blur(1.5px)',
                pointerEvents: 'none',
              }} />

              {/*
                Crown من Lucide — أبيض دائماً بدون fill
                inline style يتجاوز globals.css مباشرة على عناصر Lucide
              */}
              <Crown
                style={{
                  width:          'var(--icon-lg)',
                  height:         'var(--icon-lg)',
                  fill:           'none',
                  stroke:         '#FFFFFF',
                  strokeWidth:    1.8,
                  strokeLinecap:  'round',
                  strokeLinejoin: 'round',
                  position:       'relative',
                  zIndex:         1,
                }}
              />
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
                  <NavIcon active={active} icon={tab.icon!} />
                )}
              </motion.div>

              {/* بادج الإشعارات */}
              {tab.tabKey === 'notifications' && unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position:       'absolute',
                    top:            'calc(var(--icon-md) * -0.3)',
                    left:           'calc(var(--icon-md) * -0.3)',
                    minWidth:       'calc(var(--text-xs) * 1.4)',
                    height:         'calc(var(--text-xs) * 1.4)',
                    borderRadius:   '999px',
                    background:     'var(--color-accent)',
                    color:          '#fff',
                    fontSize:       'calc(var(--text-2xs) * 0.85)',
                    fontWeight:     900,
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    border:         '1.5px solid var(--bg-main)',
                    paddingInline:  2,
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
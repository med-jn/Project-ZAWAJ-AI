'use client';
import { useEffect, useState, useRef } from 'react';
import { motion, useAnimation }        from 'framer-motion';
import { Home, BookSearch, Heart, Bell, User, HouseHeart, Users, LayoutDashboard } from 'lucide-react';
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
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(vol, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch (_) {}
}

// ── جرس الإشعارات الراقص (pendulum من الأعلى) ───────────────
function BellIcon({ ringing, active }: { ringing: boolean; active: boolean }) {
  const controls = useAnimation();
  const color    = 'var(--color-secondary)';

  useEffect(() => {
    if (!ringing) return;
    controls.start({
      rotate: [0, 18, -18, 14, -14, 10, -10, 6, -6, 0],
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatDelay: 2.5,
      },
    });
    return () => { controls.stop(); };
  }, [ringing, controls]);

  return (
    /* نقطة التثبيت في الأعلى — transformOrigin top center */
    <motion.div
      animate={controls}
      style={{ originX: '50%', originY: '0%', display: 'inline-flex' }}
    >
      <Bell
        style={{
          width:  'var(--icon-md)',
          height: 'var(--icon-md)',
          color,
          fill:   active ? color : 'none',
          transition: 'fill 0.2s',
        }}
        strokeWidth={1.5}
      />
    </motion.div>
  );
}

// ── Props ─────────────────────────────────────────────────────
interface NavbarProps {
  activeTab:  string;
  onTabClick: (tab: string) => void;
}

export default function Navbar({ activeTab, onTabClick }: NavbarProps) {
  const [unread,  setUnread]  = useState(0);
  const [role,    setRole]    = useState<'user' | 'mediator'>('user');
  const [ringing, setRinging] = useState(false);

  // ── جلب role مرة واحدة ───────────────────────────────────
  useEffect(() => {
    const loadRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data?.role === 'mediator') setRole('mediator');
    };
    loadRole();
  }, []);

  // ── جلب الإشعارات + real-time ────────────────────────────
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // جلب أولي
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('id', user.id)
        .eq('is_read', false);
      setUnread(count ?? 0);

      // real-time
      const ch = supabase
        .channel('navbar_notifs')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'notifications',
          filter: `id=eq.${user.id}`,
        }, async () => {
          const { count: c } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('id', user.id)
            .eq('is_read', false);
          setUnread(c ?? 0);
          playNotifSound();
          // تشغيل رقصة الجرس
          setRinging(true);
          setTimeout(() => setRinging(false), 3500);
          window.navigator?.vibrate?.([40, 20, 60, 20, 40]);
        })
        .subscribe();

      cleanup = () => { supabase.removeChannel(ch); };
    };

    init();
    return () => { cleanup?.(); };
  }, []);

  // ── اهتزاز اللمس ─────────────────────────────────────────
  const haptic = (id: string) => {
    if (id === 'notifications' && unread > 0) {
      window.navigator?.vibrate?.([30, 20, 30]);
    } else {
      window.navigator?.vibrate?.(25);
    }
  };

  const go = (id: string) => {
    haptic(id);
    onTabClick(id);
  };

  // ── تعريف التبويبات بناءً على الـ role ──────────────────
  const tabs = [
    {
      id:    role === 'mediator' ? 'mediator-profile' : 'profile',
      route: role === 'mediator' ? 'mediator'         : 'profile',
      label: 'حسابي',
      Icon:  User,
      badge: false,
    },
    {
      id:    'notifications',
      route: 'notifications',
      label: 'إشعارات',
      Icon:  Bell,        // سيُستبدل بـ BellIcon مخصص
      badge: true,
    },
    {
      id:       'mediator-center',
      route:    'mediator',
      isCenter: true,
    },
    {
      id:    role === 'mediator' ? 'mediator-subscribers' : 'likes',
      route: role === 'mediator' ? 'subscribers'          : 'likes',
      label: role === 'mediator' ? 'المشتركون'            : 'إعجابات',
      Icon:  role === 'mediator' ? Users                   : Heart,
      badge: false,
    },
    {
      id:    'home',
      route: 'home',
      label: 'الرئيسية',
      Icon:  BookSearch,
      badge: false,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1000] flex items-center justify-around"
      style={{
        height:          'var(--nav-h)',
        paddingBottom:   'env(safe-area-inset-bottom, 0px)',
        background:      'var(--bg-main)',
        borderTop:       '1px solid var(--glass-border)',
      }}
    >
      {tabs.map(tab => {
        const active = activeTab === tab.route;

        /* ── الزر المركزي ─────────────────────────── */
        if (tab.isCenter) return (
          <div key="center" style={{ marginTop: -16, flexShrink: 0 }}>
            <motion.button
              whileTap={{ scale: 0.86 }}
              onClick={() => go(tab.route!)}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                width:        'calc(var(--icon-xl) * 1.6)',
                height:       'calc(var(--icon-xl) * 1.6)',
                borderRadius: '50%',
                background:   active
                  ? 'radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--color-primary) 70%, #fff), var(--color-primary) 70%)'
                  : 'radial-gradient(circle at 38% 32%, var(--color-primary), color-mix(in srgb, var(--color-primary) 60%, #000) 70%)',
                boxShadow:    active
                  ? '0 2px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 5px 16px rgba(179,51,75,0.6)'
                  : '0 2px 0 rgba(255,255,255,0.14) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 12px rgba(179,51,75,0.45)',
                outline:      '3px solid var(--bg-main)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                position:     'relative',
                overflow:     'hidden',
              }}
            >
              {/* بريق زجاجي علوي */}
              <div style={{
                position:     'absolute',
                top: 4, left: 8, right: 8,
                height:       '34%',
                background:   'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
                borderRadius: '50%',
                filter:       'blur(1.5px)',
                pointerEvents:'none',
              }} />
              {/* الأيقونة — دائماً أبيض بصرف النظر عن الثيم */}
              <HouseHeart
                style={{
                  width:  'var(--icon-lg)',
                  height: 'var(--icon-lg)',
                  color:  '#FFFFFF',          /* ثابت أبيض */
                  fill:   active ? 'rgba(255,255,255,0.25)' : 'none',
                  transition: 'fill 0.2s',
                }}
                strokeWidth={active ? 2.5 : 2}
              />
            </motion.button>
          </div>
        );

        /* ── التبويبات العادية ────────────────────── */
        const Icon  = tab.Icon!;
        const color = 'var(--color-secondary)';

        return (
          <button
            key={tab.id}
            onClick={() => go(tab.route!)}
            className="flex flex-col items-center justify-center flex-1 h-full"
            style={{ gap: 'calc(var(--sp-1) * 0.5)' }}
          >
            <div className="relative">
              {/* جرس الإشعارات له معالج خاص */}
              {tab.id === 'notifications' ? (
                <BellIcon ringing={ringing} active={active} />
              ) : (
                <motion.div
                  animate={{ scale: active ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 18 }}
                >
                  <Icon
                    style={{
                      width:  'var(--icon-md)',
                      height: 'var(--icon-md)',
                      color,
                      fill:   active ? color : 'none',
                      transition: 'fill 0.2s',
                    }}
                    strokeWidth={1.5}
                  />
                </motion.div>
              )}

              {/* بادج الإشعارات */}
              {tab.badge && unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{
                    position:   'absolute',
                    top:        'calc(var(--icon-md) * -0.25)',
                    left:       'calc(var(--icon-md) * -0.25)',
                    minWidth:   'calc(var(--text-2xs) * 1.6)',
                    height:     'calc(var(--text-2xs) * 1.6)',
                    borderRadius: '999px',
                    background:  'var(--color-accent)',
                    color:       '#fff',
                    fontSize:    'calc(var(--text-2xs) * 0.7)',
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

            {/* التسمية */}
            <span style={{
              fontSize:   'calc(var(--text-2xs) * 0.85)',
              fontWeight: active ? 800 : 500,
              color,
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
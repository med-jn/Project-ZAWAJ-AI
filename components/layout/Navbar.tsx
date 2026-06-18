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

// ── HouseHeart مخصصة — قلب منفصل يظهر كـ "ثقب" داخل البيت ──
// Lucide تملأ البيت والقلب معاً بنفس اللون فيختفي القلب
// الحل: path منفصل للقلب بـ fill=bg-main دائماً عند التفعيل
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
      {/* البيت — يمتلئ بـ color-secondary عند التفعيل */}
      <path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
        fill={active ? 'var(--color-secondary)' : 'none'}
        stroke={active ? 'var(--color-secondary)' : 'var(--color-secondary)'}
      />
      {/* القلب — fill بلون الخلفية دائماً عند التفعيل ليبدو كـ "نقش" */}
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

// ── نغمة الإشعار ──────────────────────────────────────────────
function playNotifSound() {
  try {
    const audio = new Audio('/sounds/bell.mp3');
    audio.volume = 0.7;
    audio.play().catch(() => {});
  } catch (_) {}
}

// ── مكوّن الأيقونة — يتجاوز globals.css بـ inline style ───────
//
// globals.css: svg { fill:none; stroke:currentColor; stroke-width:2px }
// inline style على عنصر SVG نفسه يتفوق عليه دائماً في CSS cascade
//
// strokeMode عند التفعيل:
//   'bg'   → stroke بلون الخلفية — يُبرز تفاصيل أيقونات مركّبة (HouseHeart)
//   'same' → stroke = fill = color-secondary — للأيقونات البسيطة (User)
//
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

// ── جرس مع الرقاص ─────────────────────────────────────────────
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

  // ── التبويبات — مرتبة يمين لليسار (RTL) ─────────────────
  // المواضع الأفقية: 10% 30% 50% 70% 90%
  const tabs = [
    // 10% — أقصى اليمين
    // User: stroke=same عند التفعيل (stroke بنفس لون الـ fill)
    {
      tabKey:      'profile',
      route:       isMediator ? 'dash'        : 'profile',
      Icon:        isMediator ? LayoutDashboard : User,
      strokeMode:  'same' as StrokeMode,
    },
    // 30%
    {
      tabKey:  'notifications',
      route:   'notifications',
      isBell:  true,
    },
    // 50% — مركز (زر دائري)
    {
      tabKey:   'mediator',
      route:    'mediators',
      isCenter: true,
    },
    // 70%
    {
      tabKey:     'likes',
      route:      isMediator ? 'subscribers' : 'likes',
      Icon:       isMediator ? Users         : Heart,
      strokeMode: 'bg' as StrokeMode,
    },
    // 90% — أقصى اليسار
    // HouseHeart مخصصة: قلب منفصل يظهر كنقش داخل البيت
    {
      tabKey:        'home',
      route:         'home',
      isHouseHeart:  true,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1000]"
      style={{
        height:        'var(--nav-h)',
        paddingBottom: 'env(safe-area-inset-bottom, 10px)',
        background:    'var(--bg-main)',
        borderTop:     '1px solid var(--glass-border)',
        // شبكة 5 أعمدة بنسب 10/20/20/20/20/10 لتحقيق 10% 30% 50% 70% 90%
        display:       'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
        alignItems:    'center',
      }}
    >
      {tabs.map(tab => {
        const active = activeTab === tab.tabKey;

        // ── الزر المركزي (50%) ────────────────────────────
        if (tab.isCenter) return (
          <div
            key="center"
            style={{
              display:        'flex',
              justifyContent: 'center',
              alignItems:     'center',
              // يرتفع فوق الشريط بمقدار 30% من حجمه
              marginTop:      'calc(var(--nav-h) * -0.3)',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => go(tab.route)}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                // حجم أصغر من السابق — 1.3× بدل 1.55×
                width:          'calc(var(--icon-xl) * 1.3)',
                height:         'calc(var(--icon-xl) * 1.3)',
                borderRadius:   '50%',
                background:     active
                  ? 'radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--color-primary) 80%, #fff 20%), var(--color-primary) 70%)'
                  : 'radial-gradient(circle at 38% 32%, var(--color-primary), color-mix(in srgb, var(--color-primary) 55%, #000 45%) 70%)',
                boxShadow:      active
                  ? '0 2px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 6px 16px rgba(179,51,75,0.65)'
                  : '0 2px 0 rgba(255,255,255,0.14) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 10px rgba(179,51,75,0.45)',
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
                position: 'absolute', top: 3, left: 6, right: 6, height: '34%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
                borderRadius: '50%', filter: 'blur(1.5px)', pointerEvents: 'none',
              }} />

              {/* Crown من Lucide — أبيض دائماً بدون fill */}
              <Crown
                style={{
                  width:          'var(--icon-md)',
                  height:         'var(--icon-md)',
                  fill:           'none',
                  stroke:         '#FFFFFF',
                  strokeWidth:    1.8,
                  strokeLinecap:  'round',
                  strokeLinejoin: 'round',
                  position:       'relative',
                  zIndex:         1,
                  display:        'block',
                }}
              />
            </motion.button>
          </div>
        );

        // ── التبويبات العادية — أيقونة فقط، بدون نص ──────
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
              padding:        0,
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

              {/* بادج الإشعارات */}
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
          </button>
        );
      })}
    </nav>
  );
}
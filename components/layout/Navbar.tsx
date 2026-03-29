'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, BookSearch, Heart, Bell, User, HouseHeart } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ── نغمة الإشعار ─────────────────────────
function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    const notes = [
      { freq: 880, start: 0,    dur: 0.12, vol: 0.5  },
      { freq: 1108, start: 0.1, dur: 0.12, vol: 0.45 },
      { freq: 1320, start: 0.2, dur: 0.18, vol: 0.55 },
      { freq: 1760, start: 0.35,dur: 0.28, vol: 0.4  },
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


interface NavbarProps {
  activeTab:  string;
  onTabClick: (tab: string) => void;
}

export default function Navbar({ activeTab, onTabClick }: NavbarProps) {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let userId: string | null = null;

    const loadUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      userId = user.id;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('id', user.id)
        .eq('is_read', false);

      setUnread(count ?? 0);
    };

    loadUnread();

    // real-time
    const setupChannel = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ch = supabase
        .channel('navbar_notifs')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'notifications',
          filter: `id=eq.${user.id}`,
        }, () => {
          loadUnread();
          playNotifSound();
          window.navigator?.vibrate?.([40, 20, 60, 20, 40]);
        })
        .subscribe();

      return () => { supabase.removeChannel(ch); };
    };

    setupChannel();
  }, []);

  const haptic = () => {
    if (typeof window !== 'undefined' && window.navigator?.vibrate)
      window.navigator.vibrate(25);
  };

  const go = (id: string) => {
    // اهتزاز إضافي عند وجود إشعارات غير مقروءة
    if (id === 'notifications' && unread > 0) {
      window.navigator?.vibrate?.([30, 20, 30]);
    } else {
      haptic();
    }
    onTabClick(id);
  };

  const tabs = [
    { id: 'profile',       label: 'حسابي',   Icon: User,  badge: false },
    { id: 'notifications', label: 'إشعارات', Icon: Bell,  badge: true  },
    { id: 'mediator',      isCenter: true                               },
    { id: 'likes',         label: 'إعجابات', Icon: Heart, badge: false },
    { id: 'home',          label: 'الرئيسية',Icon: BookSearch,  badge: false },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-[1000] flex items-center justify-around"
      style={{
        height: 52,
        background: 'var(--bg-main)',
        borderTop: '1px solid var(--glass-border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;

        if (tab.isCenter) return (
          <div key="mediator" style={{ marginTop: -16 }}>
            <motion.button
              whileTap={{ scale: 0.86 }}
              onClick={() => go('mediator')}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                width: 44, height: 44, borderRadius: '50%',
                background: active
                  ? 'radial-gradient(circle at 38% 32%, #ff3355, #800020 70%)'
                  : 'radial-gradient(circle at 38% 32%, #c0002a, #5a0010 70%)',
                boxShadow: active
                  ? '0 2px 0 rgba(255,255,255,0.2) inset, 0 -2px 0 rgba(0,0,0,0.3) inset, 0 5px 16px rgba(192,0,42,0.6)'
                  : '0 2px 0 rgba(255,255,255,0.14) inset, 0 -2px 0 rgba(0,0,0,0.28) inset, 0 4px 12px rgba(128,0,32,0.45)',
                outline: '3px solid var(--bg-main)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden', flexShrink: 0,
              }}>
              <div style={{
                position: 'absolute', top: 4, left: 8, right: 8, height: '34%',
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), transparent)',
                borderRadius: '50%', filter: 'blur(1.5px)', pointerEvents: 'none',
              }}/>
              <HouseHeart size={20} strokeWidth={active ? 2.5 : 2} color="white"
                fill={active ? 'rgba(255,255,255,0.18)' : 'none'}/>
            </motion.button>
          </div>
        );

        const Icon = tab.Icon!;

        return (
          <button key={tab.id} onClick={() => go(tab.id)}
            className="flex flex-col items-center justify-center flex-1 h-full gap-[2px]">
            <div className="relative">
              <motion.div
                animate={tab.id === 'notifications' && unread > 0
                  ? { rotate: [0, -15, 15, -10, 10, 0] }
                  : { scale: active ? 1.1 : 1 }}
                transition={tab.id === 'notifications' && unread > 0
                  ? { duration: 0.5, repeat: Infinity, repeatDelay: 3 }
                  : { type: 'spring', stiffness: 420, damping: 18 }}
              >
                <Icon size={22} strokeWidth={1.5}
                  style={{ color: 'var(--color-secondary)' }}
                  fill={active ? 'var(--color-secondary)' : 'none'}
                />
              </motion.div>

              {tab.badge && unread > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  style={{
                    position: 'absolute', top: -4, left: -4,
                    minWidth: 14, height: 14, borderRadius: 7,
                    background: 'var(--color-accent)',
                    color: '#fff', fontSize: 7, fontWeight: 900,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px solid var(--bg-main)', paddingInline: 2,
                  }}>
                  {unread > 9 ? '9+' : unread}
                </motion.span>
              )}
            </div>

            <span style={{
              fontSize: 8, fontWeight: active ? 800 : 500,
              color: 'var(--color-secondary)',
              opacity: active ? 1 : 0.45,
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
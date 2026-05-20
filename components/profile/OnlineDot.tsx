'use client';
/**
 * 📁 components/profile/OnlineDot.tsx — ZAWAJ AI
 * نقطة الاتصال مع تحديث كل دقيقة
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface Props {
  userId:        string;
  initialLastActive?: string | null;
  size?:         number; // حجم النقطة بـ px — افتراضي 15
}

function isOnline(lastActiveAt?: string | null): boolean {
  if (!lastActiveAt) return false;
  return Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60000) < 5;
}

export default function OnlineDot({ userId, initialLastActive, size = 15 }: Props) {
  const [online, setOnline] = useState(() => isOnline(initialLastActive));

  useEffect(() => {
    // تحديث فوري من القيمة الأولية
    setOnline(isOnline(initialLastActive));

    // جلب من DB + تحديث كل دقيقة
    const check = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('last_active_at')
        .eq('id', userId)
        .single();
      setOnline(isOnline(data?.last_active_at));
    };

    check();
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, [userId, initialLastActive]);

  const border = Math.ceil(size * 0.18); // سُمك الإطار نسبي

  return (
    <div style={{
      position: 'absolute',
      bottom: Math.ceil(size * 0.45),
      right:  Math.ceil(size * 0.45),
      width:  size,
      height: size,
      borderRadius: '50%',
      zIndex: 2,
    }}>
      {/* حلقة نابضة — فقط عند الاتصال */}
      {online && (
        <motion.div
          animate={{ scale: [1, 1.85, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: -size * 0.4,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* النقطة الأساسية */}
      <motion.div
        animate={{ scale: online ? [1, 1.12, 1] : 1 }}
        transition={online ? { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } : {}}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: online ? 'var(--color-primary)' : 'rgba(140,140,160,0.45)',
          border: `${border}px solid var(--bg-main)`,
          boxShadow: online
            ? `0 0 ${size * 0.7}px var(--color-primary), 0 0 ${size * 0.35}px var(--color-primary)`
            : 'none',
          transition: 'background 0.4s ease, box-shadow 0.4s ease',
        }}
      />
    </div>
  );
}
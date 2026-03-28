'use client';
/**
 * 📁 app/auth/callback/page.tsx
 * يستقبل OAuth redirect من جوجل
 * يعمل على Web و Capacitor (custom scheme)
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // إغلاق متصفح Capacitor الداخلي إن كان مفتوحاً
      if (Capacitor.isNativePlatform()) {
        try { await Browser.close(); } catch {}
      }

      // انتظر قليلاً حتى تُعالج Supabase الجلسة من الـ URL
      await new Promise(r => setTimeout(r, 500));

      const { data: { session }, error } = await supabase.auth.getSession();

      if (session) {
        const { data: profile } = await supabase
          .from('profiles').select('is_completed')
          .eq('id', session.user.id).maybeSingle();

        router.replace(profile?.is_completed ? '/home' : '/onboarding');
      } else {
        router.replace('/login');
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-main)',
    }}>
      <div style={{
        color: 'var(--color-primary)',
        fontSize: 'var(--text-2xl)',
        fontWeight: 900,
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        ZAWAJ AI
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
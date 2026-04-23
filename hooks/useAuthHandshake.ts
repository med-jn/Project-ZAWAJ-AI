'use client';

import { useEffect } from 'react';
import { App }       from '@capacitor/app';
import { Browser }   from '@capacitor/browser';
import { supabase }  from '@/lib/supabase/client';

/**
 * useAuthHandshake
 * ─────────────────────────────────────────────────────────────
 * يستمع لـ deep link: zawaj://auth-handshake?return=<callbackUrl>
 *
 * عند الاستقبال:
 *  1. يتحقق من أن المستخدم مسجل دخوله
 *  2. ينشئ رمز 6 أرقام في جدول auth_handshakes (صالح 90 ثانية)
 *  3. يفتح المتصفح على: <callbackUrl>?code=XXXXXX
 * ─────────────────────────────────────────────────────────────
 */
export function useAuthHandshake() {
  useEffect(() => {
    const listener = App.addListener('appUrlOpen', async ({ url }) => {
      try {
        const parsed = new URL(url);

        // تجاهل أي deep link آخر
        if (parsed.scheme !== 'zawaj' || parsed.host !== 'auth-handshake') return;

        const returnUrl = parsed.searchParams.get('return');
        if (!returnUrl) {
          console.warn('[useAuthHandshake] missing return param');
          return;
        }

        // ─── التحقق من الجلسة ──────────────────────────────
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('[useAuthHandshake] no active session');
          return;
        }

        // ─── توليد رمز 6 أرقام فريد ───────────────────────
        const code = String(Math.floor(100000 + Math.random() * 900000));

        const expiresAt = new Date(Date.now() + 90 * 1000).toISOString(); // 90 ثانية

        const { error } = await supabase.from('auth_handshakes').insert({
          code,
          user_id:    session.user.id,
          expires_at: expiresAt,
          used:       false,
        });

        if (error) {
          console.error('[useAuthHandshake] insert error:', error);
          return;
        }

        // ─── فتح المتصفح على صفحة callback الموقع ─────────
        const callbackUrl = new URL(returnUrl.startsWith('http')
          ? returnUrl
          : `https://${returnUrl}`
        );
        callbackUrl.searchParams.set('code', code);

        await Browser.open({ url: callbackUrl.toString() });

      } catch (err) {
        console.error('[useAuthHandshake] unexpected error:', err);
      }
    });

    // تنظيف المستمع عند unmount
    return () => { listener.then(l => l.remove()); };
  }, []);
}
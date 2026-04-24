'use client';

import { useEffect } from 'react';
import { App }       from '@capacitor/app';
import { Browser }   from '@capacitor/browser';
import { supabase }  from '@/lib/supabase/client';

/**
 * useAuthHandshake — ZAWAJ AI
 * يستمع لـ deep link: zawaj://auth-handshake?return=<callbackUrl>
 * ينشئ رمز 6 أرقام في auth_handshakes ويفتح المتصفح على callback الموقع
 */
export function useAuthHandshake() {
  useEffect(() => {
    const listener = App.addListener('appUrlOpen', async ({ url }) => {
      try {
        const parsed = new URL(url);

        // ✅ protocol بدلاً من scheme
        if (parsed.protocol !== 'zawaj:' || parsed.host !== 'auth-handshake') return;

        const returnUrl = parsed.searchParams.get('return');
        if (!returnUrl) {
          console.warn('[useAuthHandshake] missing return param');
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('[useAuthHandshake] no active session');
          return;
        }

        const code      = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();

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

        // ✅ يدعم http:// و https:// و المسارات بدون بروتوكول
        const fullUrl = returnUrl.startsWith('http://') || returnUrl.startsWith('https://')
          ? returnUrl
          : `https://${returnUrl}`;

        const callbackUrl = new URL(fullUrl);
        callbackUrl.searchParams.set('code', code);

        await Browser.open({ url: callbackUrl.toString() });

      } catch (err) {
        console.error('[useAuthHandshake] unexpected error:', err);
      }
    });

    return () => { listener.then(l => l.remove()); };
  }, []);
}
'use client';

import { useEffect } from 'react';
import { App }       from '@capacitor/app';
import { Browser }   from '@capacitor/browser';
import { supabase }  from '@/lib/supabase/client';

/**
 * useAuthHandshake — ZAWAJ AI
 * ─────────────────────────────────────────────────────
 * يعالج deep link: zawaj://auth-handshake?return=<url>
 *
 * حالتان:
 *  1. التطبيق في الخلفية → appUrlOpen
 *  2. التطبيق مغلق تماماً → getLaunchUrl (cold start)
 * ─────────────────────────────────────────────────────
 */
export function useAuthHandshake() {
  useEffect(() => {

    // ── دالة معالجة الـ URL ────────────────────────────
    const handleUrl = async (url: string) => {
      try {
        console.log('[useAuthHandshake] received url:', url);

        // تحقق أن الـ URL هو handshake
        if (!url.startsWith('zawaj://auth-handshake')) {
          console.log('[useAuthHandshake] not a handshake url, ignoring');
          return;
        }

        // استخرج الـ return URL يدوياً بدلاً من new URL() لتجنب مشاكل parsing
        const match = url.match(/[?&]return=([^&]+)/);
        const returnRaw = match ? match[1] : null;

        if (!returnRaw) {
          console.warn('[useAuthHandshake] missing return param');
          return;
        }

        // فك التشفير
        const returnUrl = decodeURIComponent(returnRaw);
        console.log('[useAuthHandshake] returnUrl:', returnUrl);

        // تحقق من الجلسة
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('[useAuthHandshake] no active session');
          return;
        }

        // أنشئ رمز 6 أرقام
        const code      = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = new Date(Date.now() + 90 * 1000).toISOString();

        console.log('[useAuthHandshake] inserting code:', code);

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

        // أضف الرمز للـ callback URL
        const separator = returnUrl.includes('?') ? '&' : '?';
        const callbackUrl = `${returnUrl}${separator}code=${code}`;

        console.log('[useAuthHandshake] opening:', callbackUrl);

        // افتح المتصفح على صفحة الـ callback
        await Browser.open({ url: callbackUrl });

      } catch (err) {
        console.error('[useAuthHandshake] error:', err);
      }
    };

    // ── الحالة 1: التطبيق في الخلفية ──────────────────
    const listenerPromise = App.addListener('appUrlOpen', ({ url }) => {
      console.log('[useAuthHandshake] appUrlOpen fired:', url);
      handleUrl(url);
    });

    // ── الحالة 2: التطبيق مغلق (cold start) ───────────
    App.getLaunchUrl().then(({ url }) => {
      if (url) {
        console.log('[useAuthHandshake] getLaunchUrl fired:', url);
        handleUrl(url);
      }
    });

    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, []);
}
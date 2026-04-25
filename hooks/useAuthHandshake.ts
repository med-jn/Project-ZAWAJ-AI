'use client';

import { useEffect, useRef } from 'react';
import { App }               from '@capacitor/app';
import { Browser }           from '@capacitor/browser';
import { supabase }          from '@/lib/supabase/client';

/**
 * useAuthHandshake — ZAWAJ AI
 * ─────────────────────────────────────────────────────
 * يعالج deep link: zawaj://auth-handshake?return=<url>
 * ✅ يمنع التنفيذ المزدوج من appUrlOpen + getLaunchUrl
 * ─────────────────────────────────────────────────────
 */
export function useAuthHandshake() {
  // ✅ flag يمنع تنفيذ العملية مرتين في نفس الوقت
  const processing = useRef(false);

  useEffect(() => {

    const handleUrl = async (url: string) => {
      // ✅ إذا كانت العملية جارية بالفعل → تجاهل
      if (processing.current) {
        console.log('[useAuthHandshake] already processing, ignoring duplicate');
        return;
      }

      if (!url.startsWith('zawaj://auth-handshake')) {
        console.log('[useAuthHandshake] not a handshake url, ignoring');
        return;
      }

      processing.current = true;

      try {
        console.log('[useAuthHandshake] processing:', url);

        // استخرج الـ return URL
        const match = url.match(/[?&]return=([^&]+)/);
        const returnRaw = match ? match[1] : null;

        if (!returnRaw) {
          console.warn('[useAuthHandshake] missing return param');
          return;
        }

        const returnUrl = decodeURIComponent(returnRaw);
        console.log('[useAuthHandshake] returnUrl:', returnUrl);

        // تحقق من الجلسة
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('[useAuthHandshake] no active session');
          return;
        }

        // أنشئ رمز واحد فقط
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
          console.error('[useAuthHandshake] insert error:', JSON.stringify(error));
          return;
        }

        // افتح المتصفح على الـ callback
        const separator  = returnUrl.includes('?') ? '&' : '?';
        const callbackUrl = `${returnUrl}${separator}code=${code}`;

        console.log('[useAuthHandshake] opening:', callbackUrl);
        await Browser.open({ url: callbackUrl });

      } catch (err) {
        console.error('[useAuthHandshake] error:', err);
      } finally {
        // ✅ أعد تفعيل الـ flag بعد 3 ثوانٍ للسماح بمحاولة جديدة
        setTimeout(() => { processing.current = false; }, 3000);
      }
    };

    // ── الحالة 1: التطبيق في الخلفية ──────────────────
    const listenerPromise = App.addListener('appUrlOpen', ({ url }) => {
      console.log('[useAuthHandshake] appUrlOpen fired:', url);
      handleUrl(url);
    });

    // ── الحالة 2: التطبيق مغلق (cold start) ───────────
    // نؤخر قليلاً حتى لا يتعارض مع appUrlOpen
    setTimeout(() => {
      App.getLaunchUrl().then(({ url }) => {
        if (url) {
          console.log('[useAuthHandshake] getLaunchUrl fired:', url);
          handleUrl(url);
        }
      });
    }, 200);

    return () => {
      listenerPromise.then(l => l.remove());
    };
  }, []);
}
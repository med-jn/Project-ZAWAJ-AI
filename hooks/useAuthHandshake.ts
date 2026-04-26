'use client';

import { useEffect, useRef } from 'react';
import { App }               from '@capacitor/app';
import { supabase }          from '@/lib/supabase/client';

/**
 * useAuthHandshake — ZAWAJ AI
 * ✅ يفتح Chrome الخارجي بدلاً من In-App Browser
 */
export function useAuthHandshake() {
  const processing = useRef(false);

  useEffect(() => {

    const handleUrl = async (url: string) => {
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

        const match      = url.match(/[?&]return=([^&]+)/);
        const returnRaw  = match ? match[1] : null;

        if (!returnRaw) {
          console.warn('[useAuthHandshake] missing return param');
          return;
        }

        const returnUrl = decodeURIComponent(returnRaw);
        console.log('[useAuthHandshake] returnUrl:', returnUrl);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          console.warn('[useAuthHandshake] no active session');
          return;
        }

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

        const separator   = returnUrl.includes('?') ? '&' : '?';
        const callbackUrl = `${returnUrl}${separator}code=${code}`;

        console.log('[useAuthHandshake] opening external browser:', callbackUrl);

        // ✅ يفتح Chrome الخارجي مباشرة — لا In-App Browser
        window.open(callbackUrl, '_system');

      } catch (err) {
        console.error('[useAuthHandshake] error:', err);
      } finally {
        setTimeout(() => { processing.current = false; }, 3000);
      }
    };

    // الحالة 1: التطبيق في الخلفية
    const listenerPromise = App.addListener('appUrlOpen', ({ url }) => {
      console.log('[useAuthHandshake] appUrlOpen fired:', url);
      handleUrl(url);
    });

    // الحالة 2: التطبيق مغلق (cold start)
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
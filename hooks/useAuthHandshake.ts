'use client';
import { useEffect } from 'react';
import { App }       from '@capacitor/app';
import { Browser }   from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase }  from '@/lib/supabase/client';

const IS_NATIVE = Capacitor.isNativePlatform();

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function useAuthHandshake() {
  useEffect(() => {
    if (!IS_NATIVE) return;

    let handle: any = null;

    App.addListener('appUrlOpen', async ({ url }) => {
      if (!url.startsWith('zawaj://auth-handshake')) return;

      console.log('[useAuthHandshake] appUrlOpen fired:', url);

      try {
        const cleaned   = url.replace('zawaj://', 'https://dummy/');
        const parsed    = new URL(cleaned);
        const returnUrl = parsed.searchParams.get('return');

        if (!returnUrl) return;

        const decodedReturn = decodeURIComponent(returnUrl);

        // الـ session كاملة تحتوي على tokens
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const authPage = decodedReturn.replace('/callback', '');
          await Browser.open({ url: authPage, windowName: '_blank' });
          return;
        }

        const { user, access_token, refresh_token } = session;

        // رمز فريد مع التحقق من التكرار
        let code = generateCode();
        for (let i = 0; i < 5; i++) {
          const { data } = await supabase
            .from('auth_handshakes').select('code')
            .eq('code', code).eq('used', false)
            .gt('expires_at', new Date().toISOString()).single();
          if (!data) break;
          code = generateCode();
        }

        console.log('[useAuthHandshake] inserting code:', code);

        const { error } = await supabase.from('auth_handshakes').insert({
          code,
          user_id:       user.id,
          expires_at:    new Date(Date.now() + 90_000).toISOString(),
          used:          false,
          access_token,
          refresh_token,
        });

        if (error) {
          console.error('[useAuthHandshake] DB error:', error.message);
          return;
        }

        const ensureLang = (u: string) => {
          const hasLang = /\/(en|ar|fr)\//.test(u);
          if (hasLang) return u;
          return u.replace('orcavibe.vercel.app/', 'orcavibe.vercel.app/en/');
        };

        const callbackUrl = `${ensureLang(decodedReturn)}?code=${code}`;
        console.log('[useAuthHandshake] opening browser:', callbackUrl);

        await Browser.open({
          url: callbackUrl,
          windowName: '_blank',
          presentationStyle: 'popover',
        });

      } catch (e) {
        console.error('[useAuthHandshake]', e);
      }
    }).then(h => { handle = h; });

    return () => { handle?.remove(); };
  }, []);
}
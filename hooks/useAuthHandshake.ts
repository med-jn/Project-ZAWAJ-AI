'use client';
/**
 * 📁 hooks/useAuthHandshake.ts — ZAWAJ AI
 * ✅ يستقبل zawaj://auth-handshake?return=...
 * ✅ ينشئ رمز 6 أرقام في auth_handshakes
 * ✅ يفتح المتصفح مع الرمز — الموقع يقرأه تلقائياً
 */
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
      console.log('[useAuthHandshake] processing:', url);

      try {
        // استخراج return URL
        const cleaned   = url.replace('zawaj://', 'https://dummy/');
        const parsed    = new URL(cleaned);
        const returnUrl = parsed.searchParams.get('return');

        console.log('[useAuthHandshake] returnUrl:', returnUrl);

        if (!returnUrl) return;

        // التحقق من المستخدم
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // فتح صفحة الدخول العادية
          await Browser.open({ url: decodeURIComponent(returnUrl).replace('/callback', ''), windowName: '_blank' });
          return;
        }

        // إنشاء رمز فريد
        let code     = generateCode();
        let attempts = 0;
        while (attempts < 5) {
          const { data } = await supabase
            .from('auth_handshakes')
            .select('code')
            .eq('code', code)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .single();
          if (!data) break;
          code = generateCode();
          attempts++;
        }

        console.log('[useAuthHandshake] inserting code:', code);

        const { error } = await supabase
          .from('auth_handshakes')
          .insert({
            code,
            user_id:    user.id,
            expires_at: new Date(Date.now() + 90_000).toISOString(),
            used:       false,
          });

        if (error) {
          console.error('[useAuthHandshake] DB error:', error.message);
          return;
        }

        // ✅ الرابط يحتوي الـ code — الموقع يقرأه تلقائياً
        const decodedReturn = decodeURIComponent(returnUrl);
        const callbackUrl   = `${decodedReturn}?code=${code}`;

        console.log('[useAuthHandshake] opening external browser:', callbackUrl);

        await Browser.open({
          url:              callbackUrl,
          windowName:       '_blank',
          presentationStyle:'popover',
        });

      } catch (e) {
        console.error('[useAuthHandshake]', e);
      }
    }).then(h => { handle = h; });

    return () => { handle?.remove(); };
  }, []);
}
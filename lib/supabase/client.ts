import { createClient } from '@supabase/supabase-js';
import { Capacitor }    from '@capacitor/core';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // ✅ يحفظ الجلسة في localStorage داخل Capacitor WebView
    persistSession:    true,
    // ✅ يقرأ الجلسة المحفوظة أولاً بدون طلب شبكة
    autoRefreshToken:  true,
    // ✅ يكتشف الجلسة من URL عند OAuth callback
    detectSessionInUrl: Capacitor.isNativePlatform() ? false : true,
    // ✅ يستخدم localStorage (الافتراضي) — يبقى حتى بدون نت
    storage:           typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});
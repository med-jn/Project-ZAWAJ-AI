'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      // قراءة الجلسة فور العودة من جوجل
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        // التحقق من اكتمال البروفايل للتوجه للصفحة الصحيحة
        const { data: profile } = await supabase
          .from('profiles').select('is_completed')
          .eq('id', session.user.id).maybeSingle();
          
        router.push(profile?.is_completed ? '/home' : '/onboarding');
      } else {
        router.push('/login');
      }
    };
    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-luxury-gradient text-white">
      <div className="animate-pulse font-bold">جاري تأكيد الدخول...</div>
    </div>
  );
}
/**
 * lib/auth/logout.ts — ZAWAJ AI
 *
 * دالة موحدة لتسجيل الخروج — تُستخدم في كل مكان
 *
 * تفعل بالترتيب:
 * 1. تُلغي كل FCM tokens للمستخدم (is_active: false)
 *    حتى لا تصله إشعارات بعد الخروج
 * 2. تُسجّل الخروج من Supabase
 * 3. ترجع true عند النجاح
 */

import { supabase } from '@/lib/supabase/client';

export async function logout(): Promise<void> {
  try {
    // 1. احصل على userId قبل signOut (بعده لن تستطيع)
    const { data: { user } } = await supabase.auth.getUser();

    if (user?.id) {
      // 2. ألغِ كل tokens المستخدم على كل أجهزته
      await supabase
        .from('fcm_tokens')
        .update({ is_active: false })
        .eq('user_id', user.id);
    }
  } catch (_) {
    // لا نوقف logout بسبب خطأ في FCM
  }

  // 3. سجّل الخروج من Supabase
  await supabase.auth.signOut();
}
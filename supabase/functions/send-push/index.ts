import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { record } = await req.json() // السطر الجديد المضاف في جدول notifications

  // 1. إعداد عميل Supabase (باستخدام مفاتيح النظام)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 2. جلب التوكن الخاص بالمستخدم المستهدف
  const { data: userTokens } = await supabase
    .from('fcm_tokens')
    .select('token')
    .eq('user_id', record.user_id)

  if (!userTokens || userTokens.length === 0) {
    return new Response(JSON.stringify({ message: 'No tokens found' }), { status: 200 })
  }

  // 3. تجهيز محتوى الإشعار بناءً على نوع الإشعار في جدولك
  const payload = {
    message: {
      notification: {
        title: record.type === 'like' ? 'إعجاب جديد! ❤️' : 'رسالة جديدة 💬',
        body: record.content,
      },
      data: {
        type: record.type,
        notification_id: record.notification_id,
      },
      tokens: userTokens.map((t: any) => t.token),
    },
  }

  // هنا يتم الإرسال إلى Firebase (سنحتاج لمفتاح الخدمة في الخطوة القادمة)
  console.log('Sending notification to user:', record.user_id)
  
  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
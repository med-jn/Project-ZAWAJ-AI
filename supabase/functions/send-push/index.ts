import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { JWT } from "https://esm.sh/google-auth-library@8.7.0"

serve(async (req) => {
  try {
    // 1. استقبال البيانات من الـ Webhook
    const { record } = await req.json()

    // 2. إعداد عميل Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. جلب التوكنات الخاصة بالمستخدم المستهدف
    const { data: userTokens } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', record.user_id)

    if (!userTokens || userTokens.length === 0) {
      console.log('No tokens found for user:', record.user_id)
      return new Response(JSON.stringify({ message: 'No tokens' }), { status: 200 })
    }

    // 4. توليد Access Token من جوجل تلقائياً (الحل الدائم)
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT') ?? '{}')
    const client = new JWT({
      email: serviceAccount.client_email,
      key: serviceAccount.private_key,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    const gTokens = await client.getAccessToken()
    const accessToken = gTokens.token

    // 5. إرسال الإشعارات
    const projectID = serviceAccount.project_id
    const results = await Promise.all(userTokens.map(async (t: any) => {
      const fcmToken = t.token
      
      const message = {
        message: {
          token: fcmToken,
          notification: {
            title: record.type === 'like' ? 'إعجاب جديد! ❤️' : 'رسالة جديدة 💬',
            body: record.content,
          },
          android: {
            priority: "high",
            notification: {
              icon: "ic_notification",
              sound: "notification_sound",
              channel_id: "default_channel",
              default_sound: false,
              notification_priority: "PRIORITY_MAX"
            },
          },
        }
      }

      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectID}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(message),
        }
      )
      return res.json()
    }))

    console.log('Successfully processed notifications')
    return new Response(JSON.stringify({ success: true, results }), { status: 200 })

  } catch (error) {
    console.error('Error in Edge Function:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
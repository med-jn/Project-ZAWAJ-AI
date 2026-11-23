import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
Deno.serve(async (req)=>{
  try {
    const { messageId, audioUrl } = await req.json();
    const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
    // حذف الملف من storage
    if (audioUrl && !audioUrl.startsWith('http')) {
      const { error: storageError } = await supabase.storage.from('chat_vocal').remove([
        audioUrl
      ]);
      if (storageError) {
        console.error('storage error:', storageError.message);
      }
    }
    // حذف الصف من DB (الـ cron قد يكون حذفه بالفعل — لا يهم)
    if (messageId) {
      await supabase.from('messages').delete().eq('id', messageId);
    }
    return new Response(JSON.stringify({
      ok: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({
      error: String(e)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});

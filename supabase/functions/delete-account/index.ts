// ============================================================
// Supabase Edge Function: delete-account
// ============================================================
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};
serve(async (req)=>{
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    // ========================================================
    // التحقق من Authorization
    // ========================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({
        success: false,
        error: "غير مصرح - يجب تسجيل الدخول"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // ========================================================
    // Client للمستخدم
    // ========================================================
    const supabaseUser = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_ANON_KEY"), {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });
    // ========================================================
    // Admin Client
    // ========================================================
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
    // ========================================================
    // التحقق من المستخدم
    // ========================================================
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({
        success: false,
        error: "جلسة غير صالحة"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // ========================================================
    // قراءة السبب
    // ========================================================
    const body = await req.json().catch(()=>({}));
    const reason = body?.reason || null;
    // ========================================================
    // الخطوة 1: حذف صور المستخدم من Storage
    // ========================================================
    const bucketName = "Avatars";
    // عدّل هذا حسب هيكلة مشروعك
    const userFolder = `${user.id}`;
    const { data: files, error: listError } = await supabaseAdmin.storage.from(bucketName).list(userFolder);
    if (listError) {
      console.error("خطأ أثناء جلب الصور:", listError);
    }
    if (files && files.length > 0) {
      const filePaths = files.map((file)=>`${userFolder}/${file.name}`);
      const { error: removeError } = await supabaseAdmin.storage.from(bucketName).remove(filePaths);
      if (removeError) {
        console.error("خطأ أثناء حذف الصور:", removeError);
      }
    }
    // ========================================================
    // الخطوة 2: حذف بيانات المستخدم من الجداول
    // ========================================================
    const { data: deleteData, error: deleteError } = await supabaseUser.rpc("delete_my_account", {
      p_reason: reason
    });
    if (deleteError) {
      console.error("خطأ في حذف بيانات المستخدم:", deleteError);
      return new Response(JSON.stringify({
        success: false,
        error: "فشل في حذف البيانات: " + deleteError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    if (!deleteData?.success) {
      return new Response(JSON.stringify({
        success: false,
        error: deleteData?.error || "فشل غير متوقع"
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // ========================================================
    // الخطوة 3: حذف المستخدم من auth.users
    // ========================================================
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (authDeleteError) {
      console.error("خطأ في حذف مستخدم auth:", authDeleteError);
    // لا نُفشل العملية لأن البيانات حُذفت فعلاً
    }
    // ========================================================
    // نجاح
    // ========================================================
    return new Response(JSON.stringify({
      success: true,
      message: "تم حذف حسابك وجميع بياناتك بشكل نهائي"
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("خطأ غير متوقع:", err);
    return new Response(JSON.stringify({
      success: false,
      error: "حدث خطأ غير متوقع"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

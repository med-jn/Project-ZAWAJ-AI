"use server";
/**
 * 📁 lib/profileActions.ts — ZAWAJ AI
 * Server Actions لتحديث الملف الشخصي مع مراقبة Gemini
 */

import { validateText } from "@/lib/gemini";
import { createClient }  from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
  success: boolean;
  message: string;
};

// ── تحديث البيانات النصية ─────────────────────────────────────
export async function updateProfileText(formData: {
  bio?:                  string;
  partner_requirements?: string;
  full_name?:            string;
}): Promise<ActionResponse> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "يجب تسجيل الدخول أولاً" };

    // تجميع النص للفحص
    const parts: string[] = [];
    if (formData.full_name)            parts.push(`الاسم: ${formData.full_name}`);
    if (formData.bio)                  parts.push(`النبذة: ${formData.bio}`);
    if (formData.partner_requirements) parts.push(`المواصفات: ${formData.partner_requirements}`);

    if (parts.length > 0) {
      const aiResult = await validateText(parts.join("\n"));
      if (!aiResult.valid) {
        // تسجيل قرار الرفض
        await logModeration(supabase, user.id, 'text', 'rejected', aiResult.reason);
        return { success: false, message: aiResult.reason || "المحتوى يخالف معايير المنصة." };
      }
      await logModeration(supabase, user.id, 'text', 'approved', '');
    }

    // الحقول الصحيحة في profiles
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (formData.full_name)            payload.full_name            = formData.full_name;
    if (formData.bio !== undefined)    payload.bio                  = formData.bio;
    if (formData.partner_requirements !== undefined)
      payload.partner_requirements = formData.partner_requirements;

    const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
    if (error) throw error;

    revalidatePath("/profile");
    return { success: true, message: "تم تحديث بياناتك بنجاح ✅" };

  } catch (e: any) {
    console.error("[profileActions:text]", e);
    return { success: false, message: "حدث خطأ فني، حاول مجدداً." };
  }
}

// ── تحديث رابط الصورة بعد فحصها ─────────────────────────────
export async function updateProfileAvatar(
  userId:     string,
  avatarUrl:  string,
  approved:   boolean,
  reason:     string
): Promise<ActionResponse> {
  const supabase = createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId)
      return { success: false, message: "غير مصرح." };

    if (!approved) {
      await logModeration(supabase, userId, 'image', 'rejected', reason);
      return { success: false, message: reason || "الصورة لا تلبي معايير المنصة." };
    }

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", userId);
    if (error) throw error;

    await logModeration(supabase, userId, 'image', 'approved', '');
    revalidatePath("/profile");
    return { success: true, message: "تم تحديث الصورة بنجاح ✅" };

  } catch (e: any) {
    console.error("[profileActions:avatar]", e);
    return { success: false, message: "حدث خطأ أثناء حفظ الصورة." };
  }
}

// ── تسجيل قرار المراقبة ──────────────────────────────────────
async function logModeration(
  supabase:    any,
  userId:      string,
  contentType: 'text' | 'image',
  decision:    'approved' | 'rejected',
  reason:      string
) {
  await supabase.from("content_moderation_logs").insert({
    user_id:      userId,
    content_type: contentType,
    decision,
    reason,
    created_at:   new Date().toISOString(),
  }).then(({ error }: any) => {
    if (error) console.error("[moderation log]", error.message);
  });
}
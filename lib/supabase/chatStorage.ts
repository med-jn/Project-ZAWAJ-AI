/**
 * 📁 lib/supabase/chatStorage.ts — ZAWAJ AI
 * رفع الرسائل الصوتية إلى bucket: chat_vocal
 */

import { supabase } from './client';

const BUCKET = 'chat_vocal';

/**
 * يرفع ملف صوتي ويعيد الـ URL العام
 * المسار: {senderId}/{conversationId}/{timestamp}.webm
 */
export async function uploadVoiceMessage(
  blob: Blob,
  senderId: string,
  conversationId: string
): Promise<string> {
  const filename  = `${Date.now()}.webm`;
  const filePath  = `${senderId}/${conversationId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType:  'audio/webm',
      cacheControl: '3600',
      upsert:       false,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}
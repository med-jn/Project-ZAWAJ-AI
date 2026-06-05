/**
 * 📁 lib/supabase/chatStorage.ts — ZAWAJ AI
 * رفع الرسائل الصوتية إلى bucket: chat_vocal (private)
 */

import { supabase } from './client';

const BUCKET = 'chat_vocal';

/**
 * يرفع ملف صوتي ويعيد المسار النسبي (لا الـ URL الكامل)
 * المسار: {senderId}/{conversationId}/{timestamp}.webm
 */
export async function uploadVoiceMessage(
  blob: Blob,
  senderId: string,
  conversationId: string
): Promise<string> {
  const filename = `${Date.now()}.webm`;
  const filePath = `${senderId}/${conversationId}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType:  'audio/webm',
      cacheControl: '3600',
      upsert:       false,
    });

  if (error) throw new Error(error.message);

  // ✅ نعيد المسار النسبي فقط — signed URL يُنشأ عند التشغيل
  return filePath;
}

/**
 * ينشئ signed URL صالح لمدة ساعة
 * يُستدعى من VoiceMessageBubble عند التحميل
 */
export async function getVoiceSignedUrl(filePath: string): Promise<string> {
  // توافق مع الرسائل القديمة التي خُزّن فيها URL كامل
  const path = isFullUrl(filePath) ? extractPath(filePath) : filePath;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'signed URL failed');
  return data.signedUrl;
}

function isFullUrl(s: string): boolean {
  return s.startsWith('http');
}

function extractPath(url: string): string {
  const marker = `/${BUCKET}/`;
  const idx    = url.indexOf(marker);
  return idx !== -1 ? url.slice(idx + marker.length) : url;
}
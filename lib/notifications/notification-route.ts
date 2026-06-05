/**
 * 📁 lib/notifications/notification-route.ts — ZAWAJ AI
 * ✅ مسارات صحيحة متوافقة مع routes التطبيق الفعلية
 */

export type NotificationType =
  | 'message'
  | 'like'
  | 'view'
  | 'match'
  | 'mediator'
  | 'subscription'
  | 'contact_request'
  | 'system';

export interface NotificationRoutePayload {
  type?:            NotificationType | string | null;
  conversation_id?: string | null;
  from_user?:       string | null;
  external_url?:    string | null;
}

export function resolveNotificationRoute(
  payload: NotificationRoutePayload
): string | null {
  const type = payload.type;

  // رسالة أو وسيط → صفحة الدردشة
  if ((type === 'message' || type === 'mediator') && payload.conversation_id) {
    return `/chat?id=${payload.conversation_id}`;
  }

  // إعجاب أو زيارة أو توافق → ملف صاحب الإشعار
  if ((type === 'like' || type === 'view' || type === 'match' || type === 'contact_request')
      && payload.from_user) {
    return `/view?id=${payload.from_user}`;
  }

  // اشتراك → صفحة النقاط
  if (type === 'subscription') return '/points';

  // رابط خارجي
  if (payload.external_url) return payload.external_url;

  // fallback
  return '/notifications';
}

export function resolveNotificationAction(payload: NotificationRoutePayload) {
  const route = resolveNotificationRoute(payload);
  return { action: 'route', route };
}
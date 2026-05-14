/**
 * 📁 lib/notifications/notification-route.ts
 * ZAWAJ AI
 * Smart Notification Routing Engine
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
  type?: NotificationType | string | null;

  conversation_id?: string | null;

  from_user?: string | null;

  profile_id?: string | null;

  mediator_id?: string | null;

  request_id?: string | null;

  subscription_id?: string | null;

  external_url?: string | null;
}

/**
 * ─────────────────────────────────────────────
 * هل الإشعار يفتح ProfileModal؟
 * ─────────────────────────────────────────────
 */
export function shouldOpenProfile(
  type?: string | null
) {
  return [
    'like',
    'view',
    'match',
    'contact_request',
  ].includes(type ?? '');
}

/**
 * ─────────────────────────────────────────────
 * هل الإشعار يفتح محادثة؟
 * ─────────────────────────────────────────────
 */
export function shouldOpenChat(
  type?: string | null
) {
  return [
    'message',
    'mediator',
  ].includes(type ?? '');
}

/**
 * ─────────────────────────────────────────────
 * استخراج المسار الصحيح
 * ─────────────────────────────────────────────
 */
export function resolveNotificationRoute(
  payload: NotificationRoutePayload
): string | null {

  const type = payload.type;

  // ─────────────────────────
  // الرسائل
  // ─────────────────────────
  if (
    shouldOpenChat(type) &&
    payload.conversation_id
  ) {
    return `/chat?id=${payload.conversation_id}`;
  }

  // ─────────────────────────
  // الإعجاب / الزيارة / التطابق
  // ─────────────────────────
  if (
    shouldOpenProfile(type) &&
    payload.from_user
  ) {
    return `/discover/${payload.from_user}`;
  }

  // ─────────────────────────
  // الاشتراكات
  // ─────────────────────────
  if (
    type === 'subscription'
  ) {
    return '/packages';
  }

  // ─────────────────────────
  // الوسطاء
  // ─────────────────────────
  if (
    type === 'mediator'
  ) {
    return '/mediator';
  }

  // ─────────────────────────
  // رابط خارجي
  // ─────────────────────────
  if (payload.external_url) {
    return payload.external_url;
  }

  // ─────────────────────────
  // fallback
  // ─────────────────────────
  return '/notifications';
}

/**
 * ─────────────────────────────────────────────
 * هل نستخدم ProfileModal أو Router؟
 * ─────────────────────────────────────────────
 */
export function resolveNotificationAction(
  payload: NotificationRoutePayload
) {
  const type = payload.type;

  // فتح بروفايل
  if (
    shouldOpenProfile(type) &&
    payload.from_user
  ) {
    return {
      action: 'profile',
      userId: payload.from_user,
    };
  }

  // فتح مسار
  const route =
    resolveNotificationRoute(payload);

  return {
    action: 'route',
    route,
  };
}
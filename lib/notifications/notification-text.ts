/**
 * 📁 lib/notifications/notification-text.ts
 * ZAWAJ AI
 * محرك النصوص الذكي للإشعارات
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

export type Gender = 'male' | 'female' | null;

interface Sender {
  full_name?: string | null;
  gender?: Gender;
  role?: string | null;
}

interface BuildOptions {
  type: NotificationType;

  sender?: Sender | null;

  title?: string | null;
  message?: string | null;

  unreadCount?: number;

  planName?: string | null;
}

function genderVerb(
  gender: Gender,
  male: string,
  female: string
) {
  return gender === 'female'
    ? female
    : male;
}

function cleanName(name?: string | null) {
  if (!name?.trim()) return 'مستخدم';
  return name.trim();
}

export function buildNotificationText(
  options: BuildOptions
) {
  const {
    type,
    sender,
    title,
    message,
    unreadCount,
    planName,
  } = options;

  // لو عندنا نص مخصص من السيرفر نرجعه مباشرة
  if (message?.trim()) {
    return message.trim();
  }

  const name = cleanName(sender?.full_name);
  const gender = sender?.gender ?? null;

  switch (type) {
    // ─────────────────────────────
    // رسالة
    // ─────────────────────────────
    case 'message':
      return `${name} ${genderVerb(
        gender,
        'أرسل لك رسالة',
        'أرسلت لك رسالة'
      )}`;

    // ─────────────────────────────
    // إعجاب
    // ─────────────────────────────
    case 'like':
      return `${name} ${genderVerb(
        gender,
        'أعجب بملفك الشخصي',
        'أعجبت بملفك الشخصي'
      )}`;

    // ─────────────────────────────
    // زيارة
    // ─────────────────────────────
    case 'view':
      return `${name} ${genderVerb(
        gender,
        'زار ملفك الشخصي',
        'زارت ملفك الشخصي'
      )}`;

    // ─────────────────────────────
    // تطابق
    // ─────────────────────────────
    case 'match':
      return `حدث تطابق بينك وبين ${name}`;

    // ─────────────────────────────
    // وسيط
    // ─────────────────────────────
    case 'mediator':
      return `الوسيط ${name} يرغب بالتواصل معك`;

    // ─────────────────────────────
    // طلب تواصل
    // ─────────────────────────────
    case 'contact_request':
      return `${name} ${genderVerb(
        gender,
        'أرسل طلب تواصل',
        'أرسلت طلب تواصل'
      )}`;

    // ─────────────────────────────
    // اشتراك
    // ─────────────────────────────
    case 'subscription':
      return planName
        ? `تم تفعيل اشتراك ${planName}`
        : 'تم تحديث اشتراكك بنجاح';

    // ─────────────────────────────
    // نظام
    // ─────────────────────────────
    case 'system':
    default:
      if (title?.trim()) {
        return title.trim();
      }

      if (unreadCount && unreadCount > 0) {
        return `لديك ${unreadCount} إشعارات جديدة`;
      }

      return 'إشعار جديد';
  }
}

/**
 * وصف مختصر يظهر تحت العنوان
 */
export function buildNotificationSubtitle(
  options: BuildOptions
) {
  const {
    type,
    sender,
  } = options;

  const gender = sender?.gender ?? null;

  switch (type) {
    case 'message':
      return gender === 'female'
        ? 'اضغطي لفتح المحادثة'
        : 'اضغط لفتح المحادثة';

    case 'like':
      return gender === 'female'
        ? 'شاهد من أعجبت بملفك'
        : 'شاهد من أعجب بملفك';

    case 'view':
      return 'اكتشف من يهتم بملفك';

    case 'match':
      return 'ابدأ التعارف الآن';

    case 'mediator':
      return 'يوجد تواصل جديد من وسيط';

    case 'contact_request':
      return 'راجع الطلب الآن';

    default:
      return '';
  }
}
/**
 * 🛠️ معالج أخطاء النظام الاقتصادي
 * يحول الأخطاء التقنية إلى رسائل تفاعلية للمستخدم
 */

export const getEconomyErrorMessage = (errorCode: string): { title: string; message: string; actionText: string } => {
  switch (errorCode) {
    case 'insufficient_funds':
    case 'low_balance':
      return {
        title: 'عفواً، رصيدك غير كافٍ',
        message: 'تحتاج للمزيد من النقاط لإتمام هذه العملية. يمكنك الحصول على نقاط مجانية بالنشاط أو الشحن الآن.',
        actionText: 'زيارة المتجر'
      };
      
    case 'daily_limit_reached':
      return {
        title: 'انتظر للغد! 🎁',
        message: 'لقد حصلت على مكافأتك اليومية بالفعل. عد إلينا غداً لنمنحك مكافأة جديدة.',
        actionText: 'حسناً'
      };

    case 'transaction_failed':
      return {
        title: 'فشلت العملية',
        message: 'حدث خطأ أثناء معالجة النقاط، لم يتم خصم أي شيء من رصيدك. حاول مرة أخرى.',
        actionText: 'إعادة المحاولة'
      };

    default:
      return {
        title: 'تنبيه',
        message: 'حدث خطأ غير متوقع في نظام المحفظة. يرجى التواصل مع الدعم إذا استمرت المشكلة.',
        actionText: 'إغلاق'
      };
  }
};
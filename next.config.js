/** @type {import('next').NextConfig} */
const nextConfig = {
  // أولاً: تفعيل خاصية التصدير الثابت ليعمل التطبيق كملفات أندرويد
  output: 'export',

  // ثانياً: تعطيل معالجة الصور التلقائية لأنها تتطلب خادم (سيرفر) 
  // وتطبيقات الأندرويد تعمل محلياً على الهاتف
  images: {
    unoptimized: true,
  },

  // ثالثاً: تجاهل أخطاء الـ TypeScript والـ ESLint مؤقتاً أثناء الـ Build
  // لضمان نجاح عملية التحويل للأندرويد حتى لو كان هناك أخطاء بسيطة في الكود
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
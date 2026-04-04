/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── ✅ حُذف output:'export' — API Routes تعمل الآن ──────────
  // Capacitor يحمّل من Vercel (server.url) لا من out/
  // zip-build.js يجد مجلد out/ فارغاً (موجود في git) فلا يفشل

  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  allowedDevOrigins: ['192.168.1.15', '192.168.1.16'],

  typescript: {
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
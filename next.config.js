/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── ✅ حُذف output:'export' ──────────────────────────────
  // Capacitor يحمّل من Vercel (server.url) — لا يحتاج static export
  // API Routes تعمل الآن على Vercel بشكل طبيعي

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
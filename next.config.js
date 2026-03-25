/** @type {import('next').NextConfig} */
const nextConfig = {

  // ── Capacitor / Android ──────────────────────────────────
  output:        'export',
  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  // ── السماح للهاتف بالوصول في وضع التطوير ─────────────────
  allowedDevOrigins: ['192.168.1.15', '192.168.1.16'],

  // ── TypeScript ────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: true,
  },

 };

export default nextConfig;
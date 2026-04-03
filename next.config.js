/** @type {import('next').NextConfig} */
const nextConfig = {

  // ✅ أُعيد output:'export' — ضروري لنظام OTA و zip-build.js
  // الدفع يمر عبر Supabase Edge Function (لا Next.js API Route)
  output:        'export',
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
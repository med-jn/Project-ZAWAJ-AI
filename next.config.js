/** @type {import('next').NextConfig} */
const nextConfig = {

  // ✅ ضروري لبناء out/ — يستخدمه zip-build.js لإنشاء app-dist.zip
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
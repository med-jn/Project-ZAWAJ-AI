import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/privacy', '/terms', '/about'], // الصفحات التي تريدها أن تظهر في جوجل
      disallow: ['/profile/', '/dash/'], // صفحات المستخدمين واللوحة نمنع جوجل من دخولها للخصوصية
    },
    sitemap: 'https://your-domain.com/sitemap.xml',
  };
}
import type { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'حول التطبيق | ZAWAJ AI',
  description: 'ZAWAJ AI هو مشروع مبتكر من تطوير orcaPROD، يهدف لتسهيل الزواج الجاد باستخدام تقنيات الذكاء الاصطناعي مع الحفاظ على الخصوصية والقيم.',
};

export default function AboutPage() {
  return <AboutContent />;
}
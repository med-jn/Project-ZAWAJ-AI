import type { Metadata } from 'next';
import AboutContent from './AboutContent';

export const metadata: Metadata = {
  title: 'حول التطبيق | ZAWAJ AI',
  description: 'تعرف على رؤية ZAWAJ AI، المنصة الرائدة في تيسير الزواج الجاد باستخدام تقنيات الذكاء الاصطناعي تحت إشراف orcaPROD.',
  openGraph: {
    title: 'حول تطبيق ZAWAJ AI',
    description: 'رؤيتنا والتقنيات المستخدمة في تطوير منصة الزواج الجاد.',
  }
};

export default function AboutPage() {
  return <AboutContent />;
}
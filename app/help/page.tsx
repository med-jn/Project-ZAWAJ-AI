// app/help/page.tsx
import type { Metadata } from 'next';
import HelpContent from './HelpContent';

export const metadata: Metadata = {
  title: 'المساعدة | ZAWAJ AI',
  description: 'صفحة المساعدة والدعم الفني لتطبيق ZAWAJ AI.',
};

export default function HelpPage() {
  return <HelpContent />;
}
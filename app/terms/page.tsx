// app/terms/page.tsx
import type { Metadata } from 'next';
import TermsContent from './TermsContent';

export const metadata: Metadata = {
  title: 'شروط الخدمة | ZAWAJ AI',
  description: 'اطلع على شروط استخدام تطبيق ZAWAJ AI.',
};

export default function TermsPage() {
  return <TermsContent />;
}
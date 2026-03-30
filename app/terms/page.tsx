// app/terms/page.tsx
import type { Metadata } from 'next';
import TermsContent from './TermsContent';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | ZAWAJ AI',
  description: 'تعرف على كيفية حماية بياناتك وخصوصيتك في تطبيق زواج AI. نحن نلتزم بأعلى معايير الأمان والشفافية.',
};

export default function TermsPage() {
  return <TermsContent />;
}
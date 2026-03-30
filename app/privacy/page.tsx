// app/privacy/page.tsx
import type { Metadata } from 'next';
import PrivacyContent from './PrivacyContent';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | ZAWAJ AI',
  description: 'تعرف على كيفية حماية بياناتك وخصوصيتك في تطبيق زواج AI. نحن نلتزم بأعلى معايير الأمان والشفافية.',
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
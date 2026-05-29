// page.tsx
// المسار: app/legal/page.tsx

import LegalContent from "./LegalContent";

export const metadata = {
  title: "السياسات القانونية | ZAWAJ AI",
  description: "سياسة الأمان، حماية القاصرين، البلاغات، الحساب والبيانات، الدعم القانوني",
};

export default function LegalPage() {
  return <LegalContent />;
}
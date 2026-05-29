// page.tsx
// المسار: app/terms/page.tsx

import TermsContent from "./TermsContent";

export const metadata = {
  title: "الشروط والسياسات | ZAWAJ AI",
  description: "شروط الاستخدام وإرشادات المجتمع وسياسة الملكية الفكرية لتطبيق ZAWAJ AI",
};

export default function TermsPage() {
  return <TermsContent />;
}
// page.tsx
// المسار: app/help/page.tsx

import HelpContent from "./HelpContent";

export const metadata = {
  title: "المساعدة | ZAWAJ AI",
  description: "الأسئلة الشائعة والدعم الفني لتطبيق ZAWAJ AI",
};

export default function HelpPage() {
  return <HelpContent />;
}
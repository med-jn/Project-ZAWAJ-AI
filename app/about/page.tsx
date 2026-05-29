// page.tsx
// المسار: app/about/page.tsx

import AboutContent from "./AboutContent";

export const metadata = {
  title: "عن التطبيق | ZAWAJ AI",
  description: "تعرّف على ZAWAJ AI — منصة التعارف الجاد بهدف الزواج للعالم العربي والجالية المسلمة",
};

export default function AboutPage() {
  return <AboutContent />;
}
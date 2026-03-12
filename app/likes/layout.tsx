// 📁 app/likes/layout.tsx
// Server Component — لا 'use client'
import PageHeader from '@/components/layout/PageHeader';

export default function LikesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* الشريط العلوي الثابت: "الإعجابات" + سهم */}
      <PageHeader title="الإعجابات" />

      {/* المحتوى — يبدأ بعد الشريط العلوي */}
      {/* StickySubHeader داخل likes/page.tsx لأنه يحتاج state التبويب */}
      <main style={{ paddingTop: 'var(--header-h)' }}>
        {children}
      </main>
    </>
  );
}
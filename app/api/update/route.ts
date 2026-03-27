import { NextResponse } from 'next/server';
// استيراد ملف package.json لقراءة رقم الإصدار الحالي
import packageJson from '@/package.json';

// إجبار Next.js على معاملة المسار كاستجابة ثابتة عند عمل Export
export const dynamic = 'force-static';

export async function GET() {
  try {
    // جلب رقم الإصدار الحالي (مثل 0.1.1)
    const currentVersion = packageJson.version;

    // بناء الاستجابة مع التأكد من صيغة النصوص
    return new NextResponse(
      JSON.stringify({
        version: `v${currentVersion}`,
        url: "https://zawaj-ai.vercel.app/app-dist.zip"
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json', // هذا السطر يمنع المتصفح من تحميل الملف ويجبره على عرضه
        },
      }
    );
  } catch (error) {
    console.error("[update:route] Error reading version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version info" },
      { status: 500 }
    );
  }
}
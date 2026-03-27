import { NextResponse } from 'next/server';
// استيراد ملف package.json لقراءة رقم الإصدار الحالي
import packageJson from '@/package.json';

// السطر السحري لحل مشكلة الـ Build مع output: export
export const dynamic = 'force-static';

export async function GET() {
  try {
    // جلب رقم الإصدار الحالي من ملف package.json (مثل 0.1.0)
    const currentVersion = packageJson.version;

    // إرجاع استجابة JSON متوافقة مع متطلبات التحديث
    return NextResponse.json({
      version: `v${currentVersion}`,
      url: "https://zawaj-ai.vercel.app/app-dist.zip"
    });
  } catch (error) {
    console.error("[update:route] Error reading version:", error);
    return NextResponse.json(
      { error: "Failed to fetch version info" },
      { status: 500 }
    );
  }
}
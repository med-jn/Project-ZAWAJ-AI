'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import packageJson from '@/package.json';
import { Brand } from '@/components/ui/brand';
import { Download, ShieldCheck, CheckCircle2, Trophy, Users } from 'lucide-react';
import Footer from '@/components/layout/Footer';

function AboutContent() {
  const searchParams = useSearchParams();
  const currentVersion = packageJson.version;
  const userAppVersion = searchParams.get('v');
  const downloadUrl = "https://zawaj-ai.vercel.app/app-dist.zip";
  
  const isUpdateAvailable = userAppVersion && userAppVersion !== currentVersion;

  const changelog = [
    "تطوير محرك البحث بالذكاء الاصطناعي",
    "إضافة نظام الوسطاء المعتمدين للتحقق من المستخدمين",
    "تحسين خوارزمية التحقق من الصور"
  ];

  return (
    <div className="min-h-screen pb-20 bg-luxury-gradient min-h-[calc(100vh-var(--header-h))] flex flex-col  items-center py-8 px-4 font-cairo text-right">
      <div className="flex flex-col items-center mb-16 gap-4 ">
        <div className="scale-60 origin-center -mb-4"><Brand /></div>
         <h1 className="text-3xl font-black text-[var(--color-primary)] uppercase">حول التطبيق</h1>
         <p className="text-[11px] font-sans font-bold tracking-[0.3em] uppercase opacity-40">About Application</p>
      </div>
      <div className="mb-10 text-center space-y-4">
        
        <p className="text-right text-sm text-[var(--text-secondary)] leading-7">
       منصة رقمية مبتكرة صممتها <span className="font-bold text-[var(--color-primary)] tracking-tighter">orcaPROD</span> لتيسير سبل الزواج الجاد في إطار قيمي وأخلاقي رصين. يعتمد التطبيق على تقنيات الذكاء الاصطناعي <span className="font-sans">(Gemini AI)</span> لتحليل التوافق بين المشتركين وضمان أمان المحتوى، مع توفير بيئة خصوصية مشفرة بالكامل. بفضل نظام الوسطاء المعتمدين وآليات التحقق الذكية، نهدف إلى بناء جسور تواصل آمنة تجمع بين القلوب الباحثة عن الاستقرار، بعيداً عن العشوائية، وبأعلى معايير الثقة والشفافية.
       </p>
       <p className="text-left text-[var(--text-base)) text-[var(--text-secondary)] opacity-60 leading-6 font-sans italic" dir="ltr">
       An innovative digital platform developed by <span className="font-bold ">orcaPROD</span> to facilitate serious marriage within a solid ethical framework. The app leverages <span className="not-italic">Gemini AI</span> to analyze compatibility and ensure content safety, providing a fully encrypted environment. Through our verified mediators and smart verification mechanisms, we aim to build secure communication bridges that unite hearts seeking stability, far from randomness, and with the highest standards of trust and transparency.
       </p>
      </div>

      <div className="glass-panel w-full max-w-md p-6 space-y-6">
        
        <div className="flex-row-reverse flex justify-between items-center border-b border-[var(--glass-border)] pb-4">
          <div className="flex-row-reverse flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-wider ">
             <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
             Stable
          </div>
          <span className="text-[var(--text-main)] font-bold">حالة النظام</span>
        </div>

        <div className="flex-row-reverse flex justify-between items-center py-2">
          <span className="badge-metal text-[var(--text-main)] px-4 py-1 text-xs font-mono">
            v{currentVersion}
          </span>
          <div className="space-y-1 text-right">
            <p className="text-[var(--text-main)] font-bold text-sm">رقم الإصدار</p>
            <p className="text-[var(--text-tertiary)] text-[10px]">Beta Version</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="flex-row-reverse text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 justify-end">
             ما الجديد؟ <Trophy size={14} />
          </h3>
          <div className="bg-[var(--bg-soft)] rounded-[var(--radius-sm)] p-4 border border-[var(--glass-border)]">
            <ul className="space-y-3 text-right">
              {changelog.map((item, index) => (
                <li key={index} className="flex-row-reverse flex items-start justify-end gap-3 text-[11px] text-[var(--text-secondary)]">
                  <span>{item}</span>
                  <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4">
          {isUpdateAvailable ? (
            <a href={downloadUrl} className="btn-premium w-full !h-[var(--btn-h-lg)] text-sm gap-3 transition-transform active:scale-95 flex items-center justify-center">
              <Download size={18} />
              تحميل التحديث v{currentVersion}
            </a>
          ) : (
            <button disabled className="w-full h-[var(--btn-h-lg)] rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--glass-border)] text-[var(--text-tertiary)] text-sm font-bold flex items-center justify-center gap-2 opacity-70 cursor-not-allowed">
              <CheckCircle2 size={18} className="text-green-500" />
              أنت تستخدم أحدث إصدار
            </button>
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-8 text-[var(--text-tertiary)] text-[10px] font-bold">
        <div className="flex flex-col items-center gap-1">
          <Users size={16} />
          <span>هدفنا 10K مستخدم نشط</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <ShieldCheck size={16} />
          <span>مشفر بالكامل</span>
        </div>
      </div>

      <script
        id="update-info"
        type="application/json"
        dangerouslySetInnerHTML={{ 
          __html: JSON.stringify({ version: `v${currentVersion}`, url: downloadUrl }) 
        }}
      />
      <Footer />
    </div>
  
  );
}


export default function AboutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-luxury-gradient" />}>
      <AboutContent />
    </Suspense>
  );
}

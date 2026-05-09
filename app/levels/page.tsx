"use client";

import React from 'react';
import { LevelBadge, GemDefinitions, LEVEL_MAP } from '@/components/gems';

/**
 * LevelsPage - الصفحة التعريفية الشاملة للمستويات.
 * تعرض كافة البادجات من المستوى 1 إلى 50 مع متطلبات كل مستوى.
 */
const LevelsPage = () => {
  // تحويل كائن المستويات إلى مصفوفة مرتبة للعرض
  const allLevels = Object.values(LEVEL_MAP).sort((a, b) => a.levelNumber - b.levelNumber);

  // تقسيم المستويات إلى فئات (Tiers) للعرض المنظم
  const tiers = [
    { title: "الفئة البرونزية (Bronze)", range: [1, 5], color: "text-slate-400" },
    { title: "الفئة الفضية (Silver)", range: [6, 10], color: "text-sky-400" },
    { title: "الفئة الذهبية (Gold)", range: [11, 25], color: "text-purple-400" },
    { title: "الفئة البلاتينية (Platinum)", range: [26, 39], color: "text-yellow-400" },
    { title: "فئة النخبة (Elite Diamonds)", range: [40, 50], color: "text-amber-500" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 pb-20">
      {/* 1. تعريفات الجرافيك (ضرورية لعمل الألوان والتوهج) */}
      <GemDefinitions />

      {/* 2. رأس الصفحة (Header) */}
      <header className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
          نظام رتب الوسطاء
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          ارتقِ بمستواك من خلال جمع المشتركين وافتح جواهر نادرة تعكس نفوذك في المنصة.
        </p>
      </header>

      {/* 3. عرض المستويات حسب الفئات */}
      <main className="max-w-6xl mx-auto space-y-20">
        {tiers.map((tier) => (
          <section key={tier.title} className="space-y-8">
            <div className="flex items-center gap-4">
              <h2 className={`text-2xl font-bold ${tier.color}`}>{tier.title}</h2>
              <div className="h-[1px] flex-1 bg-white/10"></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {allLevels
                .filter(l => l.levelNumber >= tier.range[0] && l.levelNumber <= tier.range[1])
                .map((level) => (
                  <div 
                    key={level.key}
                    className="relative group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all duration-500 hover:bg-white/[0.06]"
                  >
                    {/* عرض البادج */}
                    <div className="flex flex-col items-center gap-4">
                      <LevelBadge level={level.levelNumber} size="lg" />
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">المتطلب</p>
                        <p className="font-mono text-xl font-bold text-white">
                          {level.minSubscribers.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400">مشترك</p>
                      </div>
                    </div>

                    {/* تفاصيل تقنية صغيرة تظهر عند الحوام (Hover) لمسة بريميوم */}
                    <div className="absolute inset-x-0 -bottom-2 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                      <span className="text-[9px] bg-white/10 px-2 py-1 rounded-full text-gray-300 backdrop-blur-sm">
                        أضلاع: {level.sides} | تعقيد: {level.complexity}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}
      </main>

      {/* 4. تذييل الصفحة (Footer) */}
      <footer className="mt-32 text-center text-gray-600 border-t border-white/5 pt-10">
        <p>© 2026 Project Z - نظام الهوية البصرية الموحد</p>
      </footer>
    </div>
  );
};

export default LevelsPage;
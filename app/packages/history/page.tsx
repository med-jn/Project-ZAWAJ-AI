'use client';
import { ChevronRight, History, ArrowUpRight, Gift } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { LoveCoin } from '@/components/ui/LoveCoin';

// ملاحظة: يُفترض وجود جدول للعمليات أو استخدام بيانات Wallet
// هنا سنصمم الواجهة لتكون جاهزة لاستقبال البيانات
export default function TransactionHistory() {
  const { wallet, totalBalance } = useWallet();

  return (
    <div className="min-h-screen bg-luxury-gradient px-4 py-8" dir="rtl">
      {/* هيدر الصفحة */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/packages" className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-white/60">
          <ChevronRight size={24} />
        </Link>
        <h1 className="text-2xl font-black text-white">سجل العمليات</h1>
      </div>

      {/* ملخص سريع */}
      <div className="glass-panel p-6 mb-8 border-gold flex justify-between items-center">
        <div>
          <p className="text-white/40 text-[10px] mb-1">الرصيد الإجمالي المتوفر</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-white">{totalBalance.toLocaleString()}</span>
            <LoveCoin size={24} />
          </div>
        </div>
        <History size={40} className="text-gold opacity-20" />
      </div>

      {/* قائمة العمليات */}
      <div className="space-y-4">
        <p className="text-white/40 text-xs font-bold mr-2">أحدث العمليات</p>
        
        {/* مثال لعملية شراء - يمكنك لاحقاً ربطها بـ Map من الداتابيز */}
        <TransactionCard 
          type="purchase" 
          title="شحن باقة احترافية" 
          date="اليوم، 12:30 م" 
          amount={4000} 
        />
        
        <TransactionCard 
          type="reward" 
          title="مكافأة مشاهدة إعلان" 
          date="أمس، 09:15 م" 
          amount={5} 
        />

        {/* حالة عدم وجود بيانات */}
        {!wallet && (
          <div className="text-center py-20 opacity-20">
            <History size={60} className="mx-auto mb-4" />
            <p>لا توجد عمليات مسجلة بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionCard({ type, title, date, amount }: any) {
  const isPurchase = type === 'purchase';
  return (
    <div className="glass-panel p-4 flex items-center gap-4 border-white/5 hover:bg-white/[0.07] transition-colors">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
        isPurchase ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'
      }`}>
        {isPurchase ? <ArrowUpRight size={24} /> : <Gift size={24} />}
      </div>
      <div className="flex-1">
        <h4 className="text-white font-bold text-sm">{title}</h4>
        <p className="text-white/30 text-[10px]">{date}</p>
      </div>
      <div className="text-left font-black flex items-center gap-1.5">
        <span className={isPurchase ? 'text-white' : 'text-green-400'}>+{amount}</span>
        <LoveCoin size={14} />
      </div>
    </div>
  );
}
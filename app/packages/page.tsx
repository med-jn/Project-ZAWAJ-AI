'use client';
import { useState } from 'react';
import { Zap, Sliders } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';

// 1 نقطة = 0.01 د.ت (أي 100 نقطة = 1 د.ت)
const RATE = 0.01;

const FIXED_PACKAGES = [
  { points: 1000, bonus: 0,   label: '⚡ أساسي'    },
  { points: 2000, bonus: 100, label: '🔥 شائع'      },
  { points: 3000, bonus: 200, label: '💎 متقدم'     },
  { points: 4000, bonus: 400, label: '🌟 احترافي'   },
  { points: 5000, bonus: 750, label: '👑 المميز'    },
];

export default function PackagesPage() {
  const { wallet, totalBalance } = useWallet();

  // القسم النشط: باقة ثابتة أو مخصص
  const [mode, setMode]           = useState<'fixed' | 'custom'>('fixed');
  const [selected, setSelected]   = useState(1); // index الباقة المختارة
  const [customPts, setCustomPts] = useState(500);
  const [buying, setBuying]       = useState(false);

  /* ── حساب الكميات ─────────────────── */
  const fixedPkg   = FIXED_PACKAGES[selected];
  const buyPoints  = mode === 'fixed' ? fixedPkg.points  : customPts;
  const bonusPts   = mode === 'fixed' ? fixedPkg.bonus   : 0;
  const totalPts   = buyPoints + bonusPts;
  const price      = (buyPoints * RATE).toFixed(2);

  const handleBuy = async () => {
    setBuying(true);
    await new Promise(r => setTimeout(r, 1200));
    setBuying(false);
    alert('سيتم تفعيل بوابة الدفع قريباً 🚀');
  };

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black text-white mb-1">الباقات والاشتراكات</h1>
      <p className="text-white/40 text-sm mb-6">اختر باقة أو حدد كميتك بنفسك</p>

      {/* ── الرصيد الحالي ───────────────────── */}
      <div className="glass-panel p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-white/40 text-xs mb-1">رصيدك الحالي</p>
          <p className="text-white font-black text-2xl">
            {totalBalance} <span className="text-sm text-white/50">نقطة</span>
          </p>
        </div>
        <div className="text-left space-y-1">
          <p className="text-[10px] text-white/30">مشترى: <span className="text-white/60">{wallet?.paid_balance || 0}</span></p>
          <p className="text-[10px] text-white/30">مكافآت: <span className="text-white/60">{wallet?.bonus_balance || 0}</span></p>
        </div>
      </div>

      {/* ── مفتاح الوضع ─────────────────────── */}
      <div className="flex bg-white/5 p-1.5 rounded-2xl gap-2 mb-6">
        <button
          onClick={() => setMode('fixed')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            mode === 'fixed' ? 'bg-white text-black shadow' : 'text-zinc-500'
          }`}
        >
          <Zap size={15} /> باقات جاهزة
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            mode === 'custom' ? 'bg-white text-black shadow' : 'text-zinc-500'
          }`}
        >
          <Sliders size={15} /> كمية مخصصة
        </button>
      </div>

      {/* ── الباقات الثابتة ──────────────────── */}
      {mode === 'fixed' && (
        <div className="space-y-3 mb-6">
          {FIXED_PACKAGES.map((pkg, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full p-4 rounded-3xl border-2 transition-all text-right flex items-center gap-4 ${
                selected === i
                  ? 'border-[#c0002a]/60 bg-[#c0002a]/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {/* دائرة الاختيار */}
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selected === i ? 'border-[#c0002a] bg-[#c0002a]' : 'border-white/30'
              }`}>
                {selected === i && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-white font-black text-sm">{pkg.label}</p>
                  {pkg.bonus > 0 && (
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      +{pkg.bonus} مجاناً
                    </span>
                  )}
                </div>
                <p className="text-white/40 text-xs">{pkg.points.toLocaleString()} نقطة مشتراة</p>
              </div>

              <div className="text-left flex-shrink-0">
                <p className="text-white font-black">{(pkg.points * RATE).toFixed(0)} <span className="text-xs text-white/50">د.ت</span></p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── الكمية المخصصة ───────────────────── */}
      {mode === 'custom' && (
        <div className="glass-panel p-6 mb-6 space-y-6">
          {/* العدد المحدد */}
          <div className="text-center">
            <p className="text-white/40 text-xs mb-2">عدد النقاط</p>
            <div className="flex items-center justify-center gap-3">
              {/* زر - */}
              <button
                onClick={() => setCustomPts(p => Math.max(500, p - 1))}
                className="w-9 h-9 rounded-full bg-white/10 text-white font-black text-lg active:scale-90 transition-all"
              >−</button>

              {/* إدخال مباشر */}
              <input
                type="number"
                min={500}
                max={99999}
                value={customPts}
                onChange={e => {
                  const v = parseInt(e.target.value) || 500;
                  setCustomPts(Math.min(99999, Math.max(500, v)));
                }}
                className="w-28 text-center text-3xl font-black text-white bg-transparent outline-none border-b-2 border-[#c0002a]/50 pb-1"
                style={{ direction: 'ltr' }}
              />

              {/* زر + */}
              <button
                onClick={() => setCustomPts(p => Math.min(99999, p + 1))}
                className="w-9 h-9 rounded-full bg-white/10 text-white font-black text-lg active:scale-90 transition-all"
              >+</button>
            </div>
            <p className="text-white/30 text-xs mt-2">نقطة</p>
          </div>

          {/* السلايدر */}
          <div>
            <input
              type="range"
              min={500}
              max={10000}
              step={1}
              value={Math.min(customPts, 10000)}
              onChange={e => setCustomPts(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: '#c0002a' }}
            />
            <div className="flex justify-between text-white/25 text-[10px] mt-1">
              <span>10,000</span>
              <span>500</span>
            </div>
          </div>

          <p className="text-white/30 text-xs text-center">
            يمكنك كتابة أي رقم مباشرة أو استخدام السلايدر
          </p>
        </div>
      )}

      {/* ── ملخص الطلب ──────────────────────── */}
      <div className="glass-panel p-5 mb-5 space-y-2">
        <h3 className="text-white font-black text-sm border-b border-white/10 pb-3 mb-3">ملخص الطلب</h3>
        <Row label="النقاط المشتراة" value={`${buyPoints.toLocaleString()} نقطة`} />
        {bonusPts > 0 && <Row label="نقاط مجانية 🎁" value={`+ ${bonusPts.toLocaleString()} نقطة`} color="text-green-400" />}
        <div className="border-t border-white/10 pt-2 mt-2">
          <Row label="إجمالي النقاط" value={`${totalPts.toLocaleString()} نقطة`} bold />
          <Row label="المبلغ الإجمالي" value={`${price} د.ت`} bold color="text-[#c0002a]" />
        </div>
      </div>

      {/* ── زر الشراء ───────────────────────── */}
      <button
        onClick={handleBuy}
        disabled={buying}
        className="w-full py-4 rounded-2xl font-black text-white text-lg transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-3"
        style={{
          background: 'linear-gradient(135deg, #800020, #c0002a)',
          boxShadow: '0 10px 30px rgba(192,0,42,0.4)',
        }}
      >
        <Zap size={20} />
        {buying ? 'جاري المعالجة...' : `شراء ${totalPts.toLocaleString()} نقطة بـ ${price} د.ت`}
      </button>

      <p className="text-white/20 text-[10px] text-center mt-4 pb-2">
        جميع المعاملات آمنة ومشفرة • لا استرداد بعد الشراء
      </p>
    </div>
  );
}

/* ── مكون صف الملخص ── */
function Row({ label, value, bold, color }: {
  label: string; value: string; bold?: boolean; color?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-sm ${bold ? 'text-white font-black' : 'text-white/50'}`}>{label}</span>
      <span className={`text-sm font-black ${color || (bold ? 'text-white' : 'text-white/70')}`}>{value}</span>
    </div>
  );
}
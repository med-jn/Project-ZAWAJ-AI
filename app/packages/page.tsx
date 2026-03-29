'use client';
import { useState } from 'react';
import { Zap, Sliders, PlayCircle, History } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { CoinBalance } from '@/components/ui/CoinBalance';
import { LoveCoin } from '@/components/ui/LoveCoin';
import { showRewardedAd } from '@/lib/services/admob';

const RATE = 0.01;
const AD_REWARD_AMOUNT = 5;

const FIXED_PACKAGES = [
  { points: 1000, bonus: 0,   label: '⚡ أساسي'    },
  { points: 2000, bonus: 100, label: '🔥 شائع'      },
  { points: 3000, bonus: 200, label: '💎 متقدم'     },
  { points: 4000, bonus: 400, label: '🌟 احترافي'   },
  { points: 5000, bonus: 750, label: '👑 المميز'    },
];

export default function PackagesPage() {
  const { wallet, totalBalance } = useWallet();
  const [mode, setMode]           = useState<'fixed' | 'custom'>('fixed');
  const [selected, setSelected]   = useState(1);
  const [customPts, setCustomPts] = useState(500);
  const [buying, setBuying]       = useState(false);

  const fixedPkg   = FIXED_PACKAGES[selected];
  const buyPoints  = mode === 'fixed' ? fixedPkg.points  : customPts;
  const bonusPts   = mode === 'fixed' ? fixedPkg.bonus   : 0;
  const totalPts   = buyPoints + bonusPts;
  const price      = (buyPoints * RATE).toFixed(2);

  return (
    <div className="min-h-screen bg-luxury-gradient px-4 py-8 pb-24" dir="rtl">
      {/* الهيدر */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="var(--text-primary) text-sm">اشحن رصيدك أو احصل على عملات مجانية</p>
        </div>
        <Link href="/packages/history" className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-gold shadow-gold-glow hover:scale-105 transition-transform border border-white/5">
          <History size={24} />
        </Link>
      </div>

      {/* الرصيد الحالي */}
      <div className="glass-panel p-6 mb-6 flex items-center justify-between border-gold relative overflow-hidden">
        <div className="relative z-10">
          <p className="var(--text-secondary) text-xs mb-1 font-bold">رصيدك الحالي</p>
          <CoinBalance amount={totalBalance} iconSize={20} className="text-2xl" />
        </div>
        <div className="relative z-10 'var(--bg-soft)' p-3 rounded-2xl border 'var(--border-gold)' text-left text-xs space-y-1">
          <div className="flex items-center gap-2 justify-end text-[10px]">
            <span className="var(--text-secondary)">رصيد الشراء :</span>
            <span className="font-bold text-white">{wallet?.balance || 0}</span>
            <LoveCoin size={12} />
          </div>
          <div className="flex items-center gap-2 justify-end text-[10px]">
            <span className="var(--text-secondary)"> رصيد الهدايا :</span>
            <span className="font-bold text-green-400">{wallet?.balance_free || 0}</span>
            <LoveCoin size={12} />
          </div>
        </div>
      </div>

      {/* زر مكافأة الفيديو */}
      <button
        onClick={() => showRewardedAd()}
        style={{
          width: '100%',
          marginBottom: 'var(--sp-8)',
          padding: 'var(--sp-4) var(--sp-5)',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid rgba(34,197,94,0.3)',
          background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(22,163,74,0.14))',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 'var(--sp-4)',
          cursor: 'pointer', transition: 'all 0.18s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
        onPointerDown={e=>(e.currentTarget.style.transform='scale(0.98)')}
        onPointerUp={e=>(e.currentTarget.style.transform='scale(1)')}
        onPointerLeave={e=>(e.currentTarget.style.transform='scale(1)')}
      >
        {/* أيقونة + نص */}
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)' }}>
          <div style={{
            width: 'var(--btn-h)', height: 'var(--btn-h)',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg,#16a34a,#22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
          }}>
            <PlayCircle size={20} color="#fff" />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{
              color: '#fff', fontWeight: 900,
              fontSize: 'var(--text-sm)', margin: 0,
            }}>
              عملات مجانية 🎁
            </p>
            <p style={{
              color: 'rgba(74,222,128,0.85)',
              fontSize: 'var(--text-2xs)', margin: 0,
              marginTop: 'var(--sp-1)',
            }}>
              شاهد فيديو قصير واربح {AD_REWARD_AMOUNT} عملات ذهبية
            </p>
          </div>
        </div>

        {/* badge يمين */}
        <div style={{
          padding: 'var(--sp-1) var(--sp-3)',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(34,197,94,0.2)',
          border: '1px solid rgba(34,197,94,0.4)',
          display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
          flexShrink: 0,
        }}>
          <Zap size={12} color="#4ade80" />
          <span style={{
            color: '#4ade80', fontSize: 'var(--text-2xs)', fontWeight: 800,
          }}>
            مجاني
          </span>
        </div>
      </button>

      {/* اختيار الوضع */}
      <div className="flex bg-white/5 p-1.5 rounded-[1.5rem] gap-2 mb-8 border border-white/5">
        <button
          onClick={() => setMode('fixed')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            mode === 'fixed' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Zap size={15} /> باقات جاهزة
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${
            mode === 'custom' ? 'bg-white text-black shadow-xl' : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Sliders size={15} /> كمية مخصصة
        </button>
      </div>

      {/* الباقات */}
      {mode === 'fixed' ? (
        <div className="space-y-4 mb-8">
          {FIXED_PACKAGES.map((pkg, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`w-full p-5 rounded-[2rem] border-2 transition-all text-right flex items-center gap-4 ${
                selected === i
                  ? 'border-[#B3334B] bg-[#B3334B]/10 shadow-[0_0_25px_rgba(179,51,75,0.2)]'
                  : 'border-white/5 bg-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                selected === i ? 'border-[#B3334B] bg-[#B3334B]' : 'border-white/20'
              }`}>
                {selected === i && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-white font-black">{pkg.label}</p>
                  {pkg.bonus > 0 && <span className="badge-metal py-0.5 px-2 text-[9px]">+{pkg.bonus} هدية</span>}
                </div>
                <div className="flex items-center gap-1 opacity-60">
                   <span className="text-xs font-bold text-white">{pkg.points.toLocaleString()}</span>
                   <LoveCoin size={12} />
                </div>
              </div>
              <div className="text-left font-black text-xl text-white">{(pkg.points * RATE).toFixed(0)} <span className="text-[10px] text-white/40 font-normal">د.ت</span></div>
            </button>
          ))}
        </div>
      ) : (
        <div className="glass-panel p-8 mb-8">
          <div className="text-center mb-8">
            <p className="text-white/40 text-[11px] mb-4 uppercase tracking-widest">حدد الكمية التي تريدها</p>
            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setCustomPts(p => Math.max(500, p - 100))} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white font-black text-2xl active:scale-90">-</button>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-4xl font-black text-white border-b-2 border-gold pb-2">
                  <span>{customPts}</span>
                  <LoveCoin size={24} />
                </div>
              </div>
              <button onClick={() => setCustomPts(p => Math.min(99999, p + 100))} className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white font-black text-2xl active:scale-90">+</button>
            </div>
          </div>
          <input 
            type="range" min={500} max={10000} step={100} value={Math.min(customPts, 10000)} 
            onChange={e => setCustomPts(parseInt(e.target.value))}
            className="w-full accent-[#B3334B] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* زر الشراء النهائي */}
      <div className="glass-panel p-6 border-white/5 shadow-red-glow">
        <div className="flex justify-between items-center mb-6">
          <span className="text-white/40 text-sm font-bold">المبلغ المطلوب</span>
          <span className="text-gold font-black text-2xl">{price} د.ت</span>
        </div>
        <button
          onClick={() => alert('قريباً')}
          className="btn-premium w-full !h-16 text-lg"
        >
          تأكيد شراء {totalPts.toLocaleString()}
          <LoveCoin size={20} className="mr-2 inline-block" />
        </button>
      </div>
    </div>
  );
}
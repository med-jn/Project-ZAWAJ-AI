'use client';
/**
 * 📁 app/packages/page.tsx — ZAWAJ AI  v2.2
 * ✅ إصلاح: showAd() من useAdMobReward (API موحّدة)
 * ✅ إصلاح: لا toLocaleString (Hydration safe)
 * ✅ إصلاح: URL مطلق للـ API عبر useKonnectPayment
 */
import { useState, useEffect }              from 'react';
import { Zap, PlayCircle, History, Sliders } from 'lucide-react';
import Link                                  from 'next/link';

import { supabase }             from '@/lib/supabase/client';
import { useWallet }            from '@/hooks/useWallet';
import { useSmartAdMobReward } from '@/hooks/useAdMobReward';import { useKonnectPayment }    from '@/hooks/useKonnectPayment';
import { CoinBalance }          from '@/components/ui/CoinBalance';
import { LoveCoin }             from '@/components/ui/LoveCoin';
import {
  ECONOMY_RULES,
  getCurrencyByCountry,
  getPackagePrice,
  getCustomPrice,
  priceDecimals,
  type PackageId,
  type SupportedCurrency,
} from '@/constants/ecomomy';

const AD_REWARD_AMOUNT           = 5;
const { MIN, MAX, STEP }         = ECONOMY_RULES.CUSTOM_RANGE;
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default function PackagesPage() {

  // ── رصيد المحفظة ──────────────────────────────────────────────
  const { balance, balance_free, totalBalance, loading: walletLoading } = useWallet();

  // ── هوية المستخدم + العملة ────────────────────────────────────
  const [userId,   setUserId]   = useState('');
  const [currency, setCurrency] = useState<SupportedCurrency>('USD');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from('profiles')
        .select('country')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.country) setCurrency(getCurrencyByCountry(data.country));
        });
    });
  }, []);

  // ── AdMob ─────────────────────────────────────────────────────
  // showAd() يعمل على Native و يُحاكي على Web
const { showAd, isAdReady: adReady } = useSmartAdMobReward(userId, AD_REWARD_AMOUNT);
  // ── Konnect ───────────────────────────────────────────────────
  const { paymentState, startPayment } = useKonnectPayment(currency);
  const isProcessing = paymentState === 'initiating' || paymentState === 'awaiting';

  // ── حالة الواجهة ──────────────────────────────────────────────
  const [mode,      setMode]      = useState<'fixed' | 'custom'>('fixed');
  const [selected,  setSelected]  = useState(1);
  const [customPts, setCustomPts] = useState(1000);

  const currencyInfo = ECONOMY_RULES.CURRENCY_PRICING[currency];
  const currentPkg   = ECONOMY_RULES.PACKAGES[selected];
  const fixedPrice   = getPackagePrice(currentPkg.id as PackageId, currency);
  const customPrice  = getCustomPrice(customPts, currency);
  const displayPrice = mode === 'fixed' ? fixedPrice : customPrice;
  const displayCoins = mode === 'fixed' ? currentPkg.coins : customPts;
  const decimals     = priceDecimals(displayPrice);

  const handleBuy = () => {
    if (mode === 'fixed') {
      startPayment({ type: 'package', packageId: currentPkg.id as PackageId });
    } else {
      startPayment({ type: 'custom', coins: customPts });
    }
  };

  return (
    <div className="min-h-screen bg-luxury-gradient px-4 py-8 pb-24" dir="rtl">

      {/* ── الهيدر ─────────────────────────────────────────────── */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          اشحن رصيدك أو احصل على عملات مجانية
        </p>
        <Link
          href="/packages/history"
          className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center text-gold shadow-gold-glow hover:scale-105 transition-transform border border-white/5"
        >
          <History size={24} />
        </Link>
      </div>

      {/* ── الرصيد الحالي ──────────────────────────────────────── */}
      <div className="glass-panel p-6 mb-6 flex items-center justify-between border-gold relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-xs mb-1 font-bold" style={{ color: 'var(--text-secondary)' }}>
            رصيدك الحالي
          </p>
          {walletLoading
            ? <div className="h-8 w-28 rounded-lg bg-white/10 animate-pulse" />
            : <CoinBalance amount={totalBalance} iconSize={20} className="text-2xl" />
          }
        </div>
        <div
          className="relative z-10 p-3 rounded-2xl border text-xs space-y-1"
          style={{ background: 'var(--bg-soft)', borderColor: 'var(--border-gold)' }}
        >
          <div className="flex items-center gap-2 justify-end text-[10px]">
            <span style={{ color: 'var(--text-secondary)' }}>رصيد الشراء:</span>
            <span className="font-bold text-white">
              {walletLoading ? '…' : fmt(balance)}
            </span>
            <LoveCoin size={12} />
          </div>
          <div className="flex items-center gap-2 justify-end text-[10px]">
            <span style={{ color: 'var(--text-secondary)' }}>رصيد الهدايا:</span>
            <span className="font-bold text-green-400">
              {walletLoading ? '…' : fmt(balance_free)}
            </span>
            <LoveCoin size={12} />
          </div>
        </div>
      </div>

      {/* ── زر مكافأة الفيديو ──────────────────────────────────── */}
      <button
        onClick={showAd}
        style={{
          width: '100%', marginBottom: 'var(--sp-8)',
          padding: 'var(--sp-4) var(--sp-5)',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid rgba(34,197,94,0.3)',
          background: 'linear-gradient(135deg,rgba(34,197,94,0.08),rgba(22,163,74,0.14))',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 'var(--sp-4)',
          cursor: 'pointer', transition: 'all 0.18s ease',
          WebkitTapHighlightColor: 'transparent',
          opacity: userId ? 1 : 0.5,
        }}
        onPointerDown={e  => (e.currentTarget.style.transform = 'scale(0.98)')}
        onPointerUp={e    => (e.currentTarget.style.transform = 'scale(1)')}
        onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          <div style={{
            width: 'var(--btn-h)', height: 'var(--btn-h)',
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg,#16a34a,#22c55e)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
          }}>
            <PlayCircle size={20} color="#fff" />
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#fff', fontWeight: 900, fontSize: 'var(--text-sm)', margin: 0 }}>
              عملات مجانية 🎁
            </p>
            <p style={{ color: 'rgba(74,222,128,0.85)', fontSize: 'var(--text-2xs)', margin: 0, marginTop: 'var(--sp-1)' }}>
              شاهد فيديو قصير واربح {AD_REWARD_AMOUNT} عملات ذهبية
            </p>
          </div>
        </div>
        <div style={{
          padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--radius-full)',
          background: adReady ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${adReady ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', gap: 'var(--sp-1)', flexShrink: 0,
        }}>
          <Zap size={12} color={adReady ? '#4ade80' : '#ffffff60'} />
          <span style={{ color: adReady ? '#4ade80' : '#ffffff60', fontSize: 'var(--text-2xs)', fontWeight: 800 }}>
            {adReady ? 'جاهز' : 'تحميل…'}
          </span>
        </div>
      </button>

      {/* ── تبديل الوضع ────────────────────────────────────────── */}
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

      {/* ── الباقات الثابتة ─────────────────────────────────────── */}
      {mode === 'fixed' ? (
        <div className="space-y-4 mb-8">
          {ECONOMY_RULES.PACKAGES.map((pkg, i) => {
            const pkgPrice   = getPackagePrice(pkg.id as PackageId, currency);
            const dec        = priceDecimals(pkgPrice);
            const isSelected = selected === i;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelected(i)}
                className={`w-full p-5 rounded-[2rem] border-2 transition-all text-right flex items-center gap-4 ${
                  isSelected
                    ? 'border-[#B3334B] bg-[#B3334B]/10 shadow-[0_0_25px_rgba(179,51,75,0.2)]'
                    : 'border-white/5 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  isSelected ? 'border-[#B3334B] bg-[#B3334B]' : 'border-white/20'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-black">{pkg.label}</p>
                    {pkg.is_popular && (
                      <span className="badge-metal py-0.5 px-2 text-[9px]">⭐ الأكثر طلباً</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    <span className="text-xs font-bold text-white">{fmt(pkg.coins)}</span>
                    <LoveCoin size={12} />
                  </div>
                </div>
                <div className="text-left flex-shrink-0">
                  <span className="font-black text-xl text-white">{pkgPrice.toFixed(dec)}</span>
                  <span className="text-[10px] text-white/40 font-normal mr-1">{currencyInfo.symbol}</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-8 mb-8">
          <div className="text-center mb-8">
            <p className="text-white/40 text-[11px] mb-4 uppercase tracking-widest">
              حدد الكمية التي تريدها
            </p>
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={() => setCustomPts(p => Math.max(MIN, p - STEP))}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white font-black text-2xl active:scale-90 transition-transform"
              >−</button>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-4xl font-black text-white border-b-2 border-gold pb-2">
                  <span>{fmt(customPts)}</span>
                  <LoveCoin size={24} />
                </div>
                <p className="text-gold text-sm font-black mt-3">
                  {customPrice.toFixed(priceDecimals(customPrice))} {currencyInfo.symbol}
                </p>
              </div>
              <button
                onClick={() => setCustomPts(p => Math.min(MAX, p + STEP))}
                className="w-12 h-12 rounded-full bg-white/5 border border-white/10 text-white font-black text-2xl active:scale-90 transition-transform"
              >+</button>
            </div>
          </div>
          <input
            type="range" min={MIN} max={MAX} step={STEP} value={customPts}
            onChange={e => setCustomPts(Number(e.target.value))}
            className="w-full accent-[#B3334B] h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-[10px] text-white/30">
            <span>{fmt(MIN)}</span>
            <span>{fmt(MAX)}</span>
          </div>
        </div>
      )}

      {/* ── ملخص الشراء + زر الدفع ─────────────────────────────── */}
      <div className="glass-panel p-6 border-white/5 shadow-red-glow">
        <div className="flex justify-between items-center mb-4">
          <span className="text-white/40 text-xs font-bold">عملة الدفع</span>
          <span className="text-white/70 text-sm font-bold">
            {currencyInfo.symbol} — {currencyInfo.name}
          </span>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-white/40 text-sm font-bold">المبلغ المطلوب</span>
          <div>
            <span className="text-gold font-black text-2xl">{displayPrice.toFixed(decimals)}</span>
            <span className="text-white/40 text-sm mr-1">{currencyInfo.symbol}</span>
          </div>
        </div>

        {isProcessing && (
          <div className="mb-4 flex items-center gap-3 bg-white/5 rounded-2xl p-3 border border-white/10">
            <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent animate-spin flex-shrink-0" />
            <p className="text-white/70 text-xs font-bold">
              {paymentState === 'initiating' ? 'جارٍ فتح صفحة الدفع…' : 'في انتظار تأكيد Konnect…'}
            </p>
          </div>
        )}

        <button
          onClick={handleBuy}
          disabled={isProcessing || !userId}
          className="btn-premium w-full !h-16 text-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'يُرجى الانتظار…' : (
            <>تأكيد شراء {fmt(displayCoins)} <LoveCoin size={20} className="mr-2 inline-block" /></>
          )}
        </button>
      </div>
    </div>
  );
}
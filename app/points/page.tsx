'use client';
/**
 * 📁 app/points/page.tsx — ZAWAJ AI
 * محفظة النقاط: رصيد + مكافأة إعلانية + سجل العمليات
 * ✅ لا أسعار — لا عملات مالية — لا شراء مباشر
 * ✅ الإعلانات تُحمَّل مسبقاً فور فتح الصفحة
 */
import { useState, useEffect, useCallback } from 'react';
import { PlayCircle, Zap, TrendingUp, TrendingDown, Coins } from 'lucide-react';

import { supabase }            from '@/lib/supabase/client';
import { useWallet }           from '@/hooks/useWallet';
import { useSmartAdMobReward } from '@/hooks/useAdMobReward';
import { CoinBalance }         from '@/components/ui/CoinBalance';
import { LoveCoin }            from '@/components/ui/LoveCoin';

// ── ثوابت ────────────────────────────────────────────────────
const AD_REWARD        = 5;
const HISTORY_PAGE_SIZE = 20;
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── خريطة المصادر → نص عربي ──────────────────────────────────
const SOURCE_LABEL: Record<string, string> = {
  konnect:     'شحن رصيد',
  admob:       'مكافأة إعلان',
  daily_bonus: 'مكافأة يومية',
  welcome:     'هدية الترحيب',
  action:      'عملية',
  admin:       'منحة إدارية',
};

const ACTION_LABEL: Record<string, string> = {
  like:                 'إرسال إعجاب',
  pass:                 'تخطي',
  back_swipe:           'تراجع عن التخطي',
  open_chat:            'فتح محادثة',
  urgent_consultation:  'استشارة عاجلة',
  gift_to_mediator:     'هدية للوسيط',
};

function getTxLabel(source: string, action?: string | null): string {
  if (source === 'action' && action && ACTION_LABEL[action]) {
    return ACTION_LABEL[action];
  }
  return SOURCE_LABEL[source] ?? source;
}

// ── تنسيق التاريخ والوقت ─────────────────────────────────────
function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString('ar-TN', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return { date, time };
}

// ── نوع معاملة ───────────────────────────────────────────────
interface Tx {
  transaction_id: string;
  amount:         number;
  balance_after:  number;
  source:         string;
  action:         string | null;
  notes:          string | null;
  created_at:     string;
}

// ═════════════════════════════════════════════════════════════
export default function PointsPage() {

  // ── رصيد ─────────────────────────────────────────────────
  const { balance, balance_free, totalBalance, loading: walletLoading } = useWallet();

  // ── هوية المستخدم ─────────────────────────────────────────
  const [userId, setUserId] = useState<string>('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
  }, []);

  // ── AdMob — يُحمَّل تلقائياً فور توفر userId ─────────────
  const { showAd, isAdReady, isLoadingAd } = useSmartAdMobReward(userId, AD_REWARD);

  // ── سجل العمليات ─────────────────────────────────────────
  const [txList,   setTxList]   = useState<Tx[]>([]);
  const [txLoad,   setTxLoad]   = useState(false);
  const [hasMore,  setHasMore]  = useState(true);
  const [page,     setPage]     = useState(0);

  const loadTx = useCallback(async (reset = false) => {
    if (!userId) return;
    setTxLoad(true);
    const from = reset ? 0 : page * HISTORY_PAGE_SIZE;
    const to   = from + HISTORY_PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('point_transactions')
      .select('transaction_id, amount, balance_after, source, action, notes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setTxList(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === HISTORY_PAGE_SIZE);
      if (!reset) setPage(p => p + 1);
    }
    setTxLoad(false);
  }, [userId, page]);

  // جلب أول صفحة عند توفر userId
  useEffect(() => {
    if (!userId) return;
    setPage(0);
    loadTx(true);
  }, [userId]); // eslint-disable-line

  return (
    <div className="min-h-screen px-4 py-6 pb-28" dir="rtl"
      style={{ background: 'var(--bg-main)' }}>

      {/* ══ بطاقة الرصيد ══════════════════════════════════════ */}
      <div className="glass-panel p-5 mb-4 relative overflow-hidden">

        {/* خلفية زخرفية */}
        <div style={{
          position: 'absolute', top: -30, left: -20,
          width: 140, height: 140, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(179,51,75,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* الرصيد الإجمالي */}
        <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-tertiary)' }}>
          رصيدك الإجمالي
        </p>
        {walletLoading
          ? <div className="h-9 w-36 rounded-xl mb-4 animate-pulse" style={{ background: 'rgba(255,255,255,0.08)' }} />
          : <CoinBalance amount={totalBalance} iconSize={22} className="text-3xl font-black mb-4" />
        }

        {/* تفاصيل الرصيد */}
        <div className="flex gap-3">
          {/* رصيد الشحن */}
          <div className="flex-1 rounded-2xl p-3" style={{
            background: 'rgba(179,51,75,0.08)',
            border: '1px solid rgba(179,51,75,0.2)',
          }}>
            <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              رصيد الشحن
            </p>
            <div className="flex items-center gap-1.5">
              <LoveCoin size={14} />
              <span className="font-black text-base" style={{ color: 'var(--text-main)' }}>
                {walletLoading ? '…' : fmt(balance)}
              </span>
            </div>
          </div>

          {/* رصيد الهدايا */}
          <div className="flex-1 rounded-2xl p-3" style={{
            background: 'rgba(34,197,94,0.07)',
            border: '1px solid rgba(34,197,94,0.18)',
          }}>
            <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-tertiary)' }}>
              رصيد الهدايا
            </p>
            <div className="flex items-center gap-1.5">
              <LoveCoin size={14} />
              <span className="font-black text-base" style={{ color: '#4ade80' }}>
                {walletLoading ? '…' : fmt(balance_free)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ زر مشاهدة الإعلان ════════════════════════════════ */}
      <button
        onClick={showAd}
        disabled={!userId || isLoadingAd}
        style={{
          width: '100%', marginBottom: 'var(--sp-5)',
          padding: 'var(--sp-4) var(--sp-5)',
          borderRadius: 'var(--radius-xl)',
          border: `1.5px solid ${isAdReady ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.08)'}`,
          background: isAdReady
            ? 'linear-gradient(135deg,rgba(34,197,94,0.1),rgba(22,163,74,0.18))'
            : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 'var(--sp-4)',
          cursor: userId && !isLoadingAd ? 'pointer' : 'not-allowed',
          opacity: !userId ? 0.4 : 1,
          transition: 'all 0.2s ease',
          WebkitTapHighlightColor: 'transparent',
        }}
        onPointerDown={e  => { if (userId) e.currentTarget.style.transform = 'scale(0.98)'; }}
        onPointerUp={e    => (e.currentTarget.style.transform = 'scale(1)')}
        onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
          {/* أيقونة دائرية */}
          <div style={{
            width: 'var(--btn-h)', height: 'var(--btn-h)',
            borderRadius: 'var(--radius-full)',
            background: isAdReady
              ? 'linear-gradient(135deg,#16a34a,#22c55e)'
              : 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: isAdReady ? '0 4px 16px rgba(34,197,94,0.35)' : 'none',
            transition: 'all 0.3s ease',
          }}>
            <PlayCircle size={20} color="#fff" />
          </div>

          {/* نصوص */}
          <div style={{ textAlign: 'right' }}>
            <p style={{
              color: 'var(--text-main)', fontWeight: 900,
              fontSize: 'var(--text-sm)', margin: 0,
            }}>
              اكسب عملات هدايا 🎁
            </p>
            <p style={{
              color: isAdReady ? 'rgba(74,222,128,0.85)' : 'var(--text-tertiary)',
              fontSize: 'var(--text-2xs)', margin: 0, marginTop: '2px',
              transition: 'color 0.3s',
            }}>
              {isLoadingAd
                ? 'جارٍ تحضير الفيديو…'
                : `شاهد فيديو قصير واربح ${AD_REWARD} عملات ذهبية`}
            </p>
          </div>
        </div>

        {/* مؤشر الحالة */}
        <div style={{
          padding: '4px 10px', borderRadius: 'var(--radius-full)',
          background: isAdReady ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isAdReady ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
          display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0,
          transition: 'all 0.3s ease',
        }}>
          {isLoadingAd
            ? <div style={{
                width: 10, height: 10, borderRadius: '50%',
                border: '1.5px solid rgba(255,255,255,0.3)',
                borderTopColor: '#4ade80',
                animation: 'spin 0.8s linear infinite',
              }} />
            : <Zap size={11} color={isAdReady ? '#4ade80' : 'rgba(255,255,255,0.35)'} />
          }
          <span style={{
            color: isAdReady ? '#4ade80' : 'rgba(255,255,255,0.35)',
            fontSize: 'var(--text-2xs)', fontWeight: 800,
          }}>
            {isLoadingAd ? 'تحميل' : isAdReady ? 'جاهز' : 'انتظر'}
          </span>
        </div>
      </button>

      {/* ══ سجل العمليات ══════════════════════════════════════ */}
      <div>
        <p className="font-black text-sm mb-3" style={{ color: 'var(--text-main)' }}>
          سجل العمليات
        </p>

        {/* قائمة المعاملات */}
        <div className="space-y-2">
          {txList.length === 0 && !txLoad && (
            <div className="glass-panel p-8 flex flex-col items-center gap-3">
              <Coins size={32} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
              <p className="text-sm font-bold" style={{ color: 'var(--text-tertiary)' }}>
                لا توجد عمليات بعد
              </p>
            </div>
          )}

          {txList.map(tx => {
            const isCredit    = tx.amount > 0;
            const { date, time } = formatDateTime(tx.created_at);
            const label       = getTxLabel(tx.source, tx.action);

            return (
              <div key={tx.transaction_id}
                className="glass-panel px-4 py-3 flex items-center gap-3"
                style={{ borderRadius: 'var(--radius-lg)' }}
              >
                {/* أيقونة الاتجاه */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: isCredit
                    ? 'rgba(34,197,94,0.12)'
                    : 'rgba(179,51,75,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isCredit
                    ? <TrendingUp  size={16} color="#4ade80" />
                    : <TrendingDown size={16} color="var(--color-primary)" />
                  }
                </div>

                {/* التفاصيل */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text-main)' }}>
                    {label}
                  </p>
                  {tx.notes && (
                    <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                      {tx.notes}
                    </p>
                  )}
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    {date} · {time}
                  </p>
                </div>

                {/* المبلغ + الرصيد بعد */}
                <div className="text-left flex-shrink-0">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="font-black text-base" style={{
                      color: isCredit ? '#4ade80' : 'var(--color-primary)',
                    }}>
                      {isCredit ? '+' : ''}{fmt(tx.amount)}
                    </span>
                    <LoveCoin size={12} />
                  </div>
                  <p className="text-[9px] text-right mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                    الرصيد: {fmt(tx.balance_after)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* زر تحميل المزيد */}
          {hasMore && !txLoad && txList.length > 0 && (
            <button
              onClick={() => loadTx()}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--text-tertiary)',
              }}
            >
              تحميل المزيد
            </button>
          )}

          {/* مؤشر التحميل */}
          {txLoad && (
            <div className="flex justify-center py-4">
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--color-primary)',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
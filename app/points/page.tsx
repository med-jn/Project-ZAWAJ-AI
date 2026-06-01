'use client';
/**
 * 📁 app/points/page.tsx — ZAWAJ AI
 * ✅ AD_REWARD = 3 نقاط
 * ✅ الرصيد realtime عبر useWallet
 * ✅ سجل العمليات يتحدث تلقائياً عبر realtime على gift_transactions
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { PlayCircle, Zap, TrendingUp, TrendingDown, Inbox, Gift } from 'lucide-react';

import { supabase }            from '@/lib/supabase/client';
import { useWallet }           from '@/hooks/useWallet';
import { useSmartAdMobReward } from '@/hooks/useAdMobReward';
import { CoinBalance }         from '@/components/ui/CoinBalance';
import { LoveCoin }            from '@/components/ui/LoveCoin';

const AD_REWARD = 3;
const PAGE_SIZE = 20;
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const ACTION_LABEL: Record<string, string> = {
  like:        'إرسال إعجاب',
  pass:        'تخطي بطاقة',
  view:        'فتح ملف شخصي',
  message:     'بدء محادثة',
  admob:       'مكافأة إعلان',
  daily_bonus: 'مكافأة يومية',
  welcome:     'هدية الترحيب',
  admin:       'منحة إدارية',
};

const SOURCE_LABEL: Record<string, string> = {
  action:      'تفاعل',
  admob:       'مكافأة إعلان',
  daily_bonus: 'مكافأة يومية',
  welcome:     'هدية الترحيب',
  admin:       'منحة إدارية',
};

function getLabel(source: string, action?: string | null) {
  if (action && ACTION_LABEL[action]) return ACTION_LABEL[action];
  return SOURCE_LABEL[source] ?? 'عملية';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('ar-TN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

interface GiftTx {
  id:            string;
  amount:        number;
  balance_after: number;
  source:        string;
  action:        string | null;
  notes:         string | null;
  created_at:    string;
}

export default function PointsPage() {

  const { balance_free, loading: walletLoading } = useWallet();

  const [userId, setUserId] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
  }, []);

  const { showAd, isAdReady, isLoadingAd, readyCount } = useSmartAdMobReward(userId, AD_REWARD);

  const [txList,  setTxList]  = useState<GiftTx[]>([]);
  const [txLoad,  setTxLoad]  = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0); // ref بدل state لتجنب re-render loops

  // ── تحميل السجل ───────────────────────────────────────────
  const loadTx = useCallback(async (reset = false) => {
    if (!userId) return;
    setTxLoad(true);
    const from = reset ? 0 : offsetRef.current;
    const to   = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('gift_transactions')
      .select('id,amount,balance_after,source,action,notes,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      if (reset) {
        setTxList(data);
        offsetRef.current = data.length;
      } else {
        setTxList(prev => [...prev, ...data]);
        offsetRef.current += data.length;
      }
      setHasMore(data.length === PAGE_SIZE);
    }
    setTxLoad(false);
  }, [userId]);

  // ── تحميل أولي ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    offsetRef.current = 0;
    loadTx(true);
  }, [userId, loadTx]);

  // ── realtime على gift_transactions ────────────────────────
  // يُضيف العملية الجديدة في أعلى السجل فوراً بدون إعادة تحميل كامل
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`gift_tx:${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'gift_transactions',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newTx = payload.new as GiftTx;
          setTxList(prev => {
            // تجنب التكرار إذا كانت موجودة
            if (prev.some(t => t.id === newTx.id)) return prev;
            offsetRef.current += 1;
            return [newTx, ...prev];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const adDots = [0, 1].map(i => i < readyCount);

  return (
    <div className="min-h-screen pb-28" dir="rtl" style={{ background: 'var(--bg-main)' }}>

      {/* ══ Header ════════════════════════════════════════════ */}
      <div style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(179,51,75,0.22) 0%, transparent 70%)',
        padding: 'var(--sp-6) var(--sp-4) 0',
      }}>

        {/* ── بطاقة الرصيد ── */}
        <div className="glass-panel p-5 mb-4 relative overflow-hidden">
          <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(34,197,94,0.12),transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,175,55,0.08),transparent 65%)', pointerEvents: 'none' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.25)' }}>
                <Gift size={16} color="#4ade80" />
              </div>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', fontWeight: 700 }}>
                عملاتك المجانية
              </p>
            </div>

            {walletLoading
              ? <div style={{ height: 44, width: 160, borderRadius: 12, background: 'rgba(255,255,255,0.08)', marginBottom: 8 }} className="animate-pulse" />
              : <CoinBalance amount={balance_free} iconSize={26} className="text-4xl font-black mb-2" />
            }

            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
              اكسب عملات مجانية من المكافآت اليومية ومشاهدة الإعلانات
            </p>
          </div>
        </div>

        {/* ── زر الإعلان ── */}
        <button
          onClick={showAd}
          disabled={!userId || (isLoadingAd && !isAdReady)}
          className="w-full mb-6"
          style={{
            padding: 'var(--sp-4) var(--sp-5)',
            borderRadius: 'var(--radius-xl)',
            border: `1.5px solid ${isAdReady ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.09)'}`,
            background: isAdReady
              ? 'linear-gradient(135deg,rgba(34,197,94,0.13),rgba(22,163,74,0.20))'
              : 'rgba(255,255,255,0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-3)',
            cursor: userId ? 'pointer' : 'not-allowed',
            opacity: !userId ? 0.45 : 1,
            transition: 'all 0.25s ease',
            WebkitTapHighlightColor: 'transparent',
            boxShadow: isAdReady ? '0 4px 20px rgba(34,197,94,0.15)' : 'none',
          }}
          onPointerDown={e  => { if (userId) e.currentTarget.style.transform = 'scale(0.975)'; }}
          onPointerUp={e    => (e.currentTarget.style.transform = 'scale(1)')}
          onPointerLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div className="flex items-center gap-3">
            <div style={{
              width: 'var(--btn-h)', height: 'var(--btn-h)', borderRadius: 'var(--radius-full)',
              background: isAdReady ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'rgba(255,255,255,0.09)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: isAdReady ? '0 4px 14px rgba(34,197,94,0.4)' : 'none', transition: 'all 0.3s',
            }}>
              <PlayCircle size={20} color="#fff" />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-sm)', margin: 0 }}>
                اكسب عملات مجانية
              </p>
              <p style={{ color: isAdReady ? 'rgba(74,222,128,0.9)' : 'var(--text-tertiary)', fontSize: 'var(--text-2xs)', margin: 0, marginTop: 3, transition: 'color 0.3s' }}>
                {isLoadingAd && !isAdReady ? 'جارٍ تحضير الفيديو…' : `شاهد فيديو قصير واربح ${AD_REWARD} عملات`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {adDots.map((ready, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: ready ? '#4ade80' : 'rgba(255,255,255,0.18)', boxShadow: ready ? '0 0 6px rgba(74,222,128,0.7)' : 'none', transition: 'all 0.4s' }} />
            ))}
            <div style={{ padding: '3px 9px', borderRadius: 'var(--radius-full)', background: isAdReady ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isAdReady ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
              {isLoadingAd && !isAdReady
                ? <div style={{ width: 9, height: 9, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', borderTopColor: '#4ade80', animation: 'spin 0.8s linear infinite' }} />
                : <Zap size={10} color={isAdReady ? '#4ade80' : 'rgba(255,255,255,0.3)'} />
              }
              <span style={{ color: isAdReady ? '#4ade80' : 'rgba(255,255,255,0.3)', fontSize: 'calc(var(--text-2xs)*0.85)', fontWeight: 800 }}>
                {isLoadingAd && !isAdReady ? 'تحميل' : isAdReady ? 'جاهز' : 'انتظر'}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* ══ سجل العمليات ════════════════════════════════════════ */}
      <div className="px-4">
        <p style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: 'var(--text-sm)', marginBottom: 12 }}>
          سجل العمليات
        </p>

        {txList.length === 0 && !txLoad && (
          <div className="glass-panel p-10 flex flex-col items-center gap-3">
            <Inbox size={36} style={{ color: 'var(--text-tertiary)', opacity: 0.35 }} />
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
              لا توجد عمليات بعد
            </p>
          </div>
        )}

        <div className="space-y-2">
          {txList.map((tx, idx) => {
            const isCredit = tx.amount > 0;
            const { date, time } = fmtDate(tx.created_at);
            const label    = getLabel(tx.source, tx.action);
            const showDate = idx === 0 || fmtDate(txList[idx - 1].created_at).date !== date;

            return (
              <div key={tx.id}>
                {showDate && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <span style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--text-2xs)*0.85)', fontWeight: 700, flexShrink: 0 }}>
                      {date}
                    </span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                  </div>
                )}

                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>

                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: isCredit ? 'rgba(34,197,94,0.12)' : 'rgba(179,51,75,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isCredit
                      ? <TrendingUp   size={17} color="#4ade80" />
                      : <TrendingDown size={17} color="var(--color-primary)" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: 'var(--text-sm)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {label}
                    </p>
                    {tx.notes && tx.notes !== label && (
                      <p style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--text-2xs)*0.9)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.notes}
                      </p>
                    )}
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--text-2xs)*0.85)', marginTop: 2 }}>
                      {time}
                    </p>
                  </div>

                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div className="flex items-center gap-1 justify-end">
                      <span style={{ color: isCredit ? '#4ade80' : 'var(--color-primary)', fontWeight: 900, fontSize: 'var(--text-base)' }}>
                        {isCredit ? '+' : ''}{fmt(tx.amount)}
                      </span>
                      <LoveCoin size={11} />
                    </div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: 'calc(var(--text-2xs)*0.8)', textAlign: 'left', marginTop: 2 }}>
                      رصيد: {fmt(tx.balance_after)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMore && !txLoad && txList.length > 0 && (
            <button onClick={() => loadTx()}
              className="w-full py-3 rounded-2xl font-bold transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              تحميل المزيد
            </button>
          )}

          {txLoad && (
            <div className="flex justify-center py-5">
              <div style={{ width: 26, height: 26, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.08)', borderTopColor: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
'use client';
/**
 * 📁 app/points/page.tsx — ZAWAJ AI
 * ✅ لا أسعار — لا عملات مالية
 * ✅ إعلانَان يُحمَّلان فور الدخول
 * ✅ هيستوري كامل من point_transactions
 */
import { useState, useEffect, useCallback } from 'react';
import { PlayCircle, Zap, TrendingUp, TrendingDown, Inbox } from 'lucide-react';

import { supabase }            from '@/lib/supabase/client';
import { useWallet }           from '@/hooks/useWallet';
import { useSmartAdMobReward } from '@/hooks/useAdMobReward';
import { CoinBalance }         from '@/components/ui/CoinBalance';
import { LoveCoin }            from '@/components/ui/LoveCoin';

// ── ثوابت ────────────────────────────────────────────────────
const AD_REWARD         = 5;
const PAGE_SIZE         = 20;
const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── خرائط النصوص ─────────────────────────────────────────────
const SOURCE_LABEL: Record<string, string> = {
  konnect:     'شحن رصيد',
  admob:       'مكافأة إعلان',
  daily_bonus: 'مكافأة يومية',
  welcome:     'هدية الترحيب',
  action:      'عملية',
  admin:       'منحة إدارية',
};
const ACTION_LABEL: Record<string, string> = {
  like:                'إرسال إعجاب',
  pass:                'تخطي بطاقة',
  back_swipe:          'تراجع عن التخطي',
  open_chat:           'فتح محادثة',
  urgent_consultation: 'استشارة عاجلة',
  gift_to_mediator:    'هدية للوسيط',
  purchase:            'شحن رصيد',
};

function getLabel(source: string, action?: string | null) {
  if (action && ACTION_LABEL[action]) return ACTION_LABEL[action];
  return SOURCE_LABEL[source] ?? source;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('ar-TN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('ar-TN', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

interface Tx {
  transaction_id: string;
  amount:         number;
  balance_after:  number;
  source:         string;
  action:         string | null;
  notes:          string | null;
  created_at:     string;
}

// ════════════════════════════════════════════════════════════
export default function PointsPage() {

  const { balance, balance_free, totalBalance, loading: walletLoading } = useWallet();

  const [userId, setUserId] = useState('');
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.id) setUserId(user.id);
    });
  }, []);

  // ── AdMob — يبدأ التحميل المزدوج فور توفر userId ──────────
  const { showAd, isAdReady, isLoadingAd, readyCount } = useSmartAdMobReward(userId, AD_REWARD);

  // ── سجل المعاملات ─────────────────────────────────────────
  const [txList,  setTxList]  = useState<Tx[]>([]);
  const [txLoad,  setTxLoad]  = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset,  setOffset]  = useState(0);

  const loadTx = useCallback(async (reset = false) => {
    if (!userId) return;
    setTxLoad(true);
    const from = reset ? 0 : offset;
    const to   = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('point_transactions')
      .select('transaction_id,amount,balance_after,source,action,notes,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setTxList(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setOffset(from + data.length);
    }
    setTxLoad(false);
  }, [userId, offset]);

  useEffect(() => {
    if (!userId) return;
    setOffset(0);
    loadTx(true);
  }, [userId]); // eslint-disable-line

  // ── مؤشر الإعلانات الجاهزة ───────────────────────────────
  const adDots = [0, 1].map(i => i < readyCount);

  return (
    <div className="min-h-screen pb-28" dir="rtl"
      style={{ background: 'var(--bg-main)' }}>

      {/* ══ هيدر خلفية متدرجة ═════════════════════════════════ */}
      <div style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(179,51,75,0.22) 0%, transparent 70%)',
        padding: 'var(--sp-6) var(--sp-4) 0',
      }}>

        {/* ── بطاقة الرصيد الرئيسية ── */}
        <div className="glass-panel p-5 mb-4 relative overflow-hidden">

          {/* زخرفة خلفية */}
          <div style={{
            position:'absolute', top:-40, left:-40,
            width:180, height:180, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(179,51,75,0.15),transparent 65%)',
            pointerEvents:'none',
          }}/>
          <div style={{
            position:'absolute', bottom:-30, right:-20,
            width:120, height:120, borderRadius:'50%',
            background:'radial-gradient(circle,rgba(212,175,55,0.08),transparent 65%)',
            pointerEvents:'none',
          }}/>

          {/* الرصيد الإجمالي */}
          <div className="relative z-10">
            <p style={{ color:'var(--text-tertiary)', fontSize:'var(--text-xs)', fontWeight:700, marginBottom:4 }}>
              رصيدك الإجمالي
            </p>
            {walletLoading
              ? <div style={{ height:44, width:160, borderRadius:12, background:'rgba(255,255,255,0.08)', marginBottom:16 }} className="animate-pulse"/>
              : <CoinBalance amount={totalBalance} iconSize={26} className="text-4xl font-black mb-4" />
            }

            {/* شريط تفاصيل الرصيد */}
            <div className="flex gap-3">

              <div className="flex-1 rounded-2xl p-3" style={{
                background:'rgba(179,51,75,0.09)',
                border:'1px solid rgba(179,51,75,0.22)',
              }}>
                <p style={{ color:'var(--text-tertiary)', fontSize:'calc(var(--text-2xs)*0.9)', fontWeight:700, marginBottom:6 }}>
                  رصيد الشحن
                </p>
                <div className="flex items-center gap-1.5">
                  <LoveCoin size={13}/>
                  <span style={{ color:'var(--text-main)', fontWeight:900, fontSize:'var(--text-base)' }}>
                    {walletLoading ? '…' : fmt(balance)}
                  </span>
                </div>
              </div>

              <div className="flex-1 rounded-2xl p-3" style={{
                background:'rgba(34,197,94,0.07)',
                border:'1px solid rgba(34,197,94,0.18)',
              }}>
                <p style={{ color:'var(--text-tertiary)', fontSize:'calc(var(--text-2xs)*0.9)', fontWeight:700, marginBottom:6 }}>
                  رصيد الهدايا
                </p>
                <div className="flex items-center gap-1.5">
                  <LoveCoin size={13}/>
                  <span style={{ color:'#4ade80', fontWeight:900, fontSize:'var(--text-base)' }}>
                    {walletLoading ? '…' : fmt(balance_free)}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── زر الإعلان ── */}
        <button
          onClick={showAd}
          disabled={!userId || isLoadingAd && !isAdReady}
          className="w-full mb-6"
          style={{
            padding:'var(--sp-4) var(--sp-5)',
            borderRadius:'var(--radius-xl)',
            border:`1.5px solid ${isAdReady ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.09)'}`,
            background: isAdReady
              ? 'linear-gradient(135deg,rgba(34,197,94,0.13),rgba(22,163,74,0.20))'
              : 'rgba(255,255,255,0.04)',
            display:'flex', alignItems:'center',
            justifyContent:'space-between', gap:'var(--sp-3)',
            cursor: userId ? 'pointer' : 'not-allowed',
            opacity: !userId ? 0.45 : 1,
            transition:'all 0.25s ease',
            WebkitTapHighlightColor:'transparent',
            boxShadow: isAdReady ? '0 4px 20px rgba(34,197,94,0.15)' : 'none',
          }}
          onPointerDown={e  => { if(userId) e.currentTarget.style.transform='scale(0.975)'; }}
          onPointerUp={e    => (e.currentTarget.style.transform='scale(1)')}
          onPointerLeave={e => (e.currentTarget.style.transform='scale(1)')}
        >
          {/* أيقونة + نص */}
          <div className="flex items-center gap-3">
            <div style={{
              width:'var(--btn-h)', height:'var(--btn-h)',
              borderRadius:'var(--radius-full)',
              background: isAdReady
                ? 'linear-gradient(135deg,#16a34a,#22c55e)'
                : 'rgba(255,255,255,0.09)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0,
              boxShadow: isAdReady ? '0 4px 14px rgba(34,197,94,0.4)' : 'none',
              transition:'all 0.3s',
            }}>
              <PlayCircle size={20} color="#fff"/>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ color:'var(--text-main)', fontWeight:900, fontSize:'var(--text-sm)', margin:0 }}>
                اكسب عملات هدايا 🎁
              </p>
              <p style={{
                color: isAdReady ? 'rgba(74,222,128,0.9)' : 'var(--text-tertiary)',
                fontSize:'var(--text-2xs)', margin:0, marginTop:3, transition:'color 0.3s',
              }}>
                {isLoadingAd && !isAdReady ? 'جارٍ تحضير الفيديو…' : `شاهد فيديو قصير واربح ${AD_REWARD} عملات`}
              </p>
            </div>
          </div>

          {/* مؤشر الـ pool — نقطتان */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {adDots.map((ready, i) => (
              <div key={i} style={{
                width:8, height:8, borderRadius:'50%',
                background: ready ? '#4ade80' : 'rgba(255,255,255,0.18)',
                boxShadow: ready ? '0 0 6px rgba(74,222,128,0.7)' : 'none',
                transition:'all 0.4s',
              }}/>
            ))}
            <div style={{
              padding:'3px 9px', borderRadius:'var(--radius-full)',
              background: isAdReady ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)',
              border:`1px solid ${isAdReady ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
              display:'flex', alignItems:'center', gap:4, marginRight:4,
            }}>
              {isLoadingAd && !isAdReady
                ? <div style={{
                    width:9, height:9, borderRadius:'50%',
                    border:'1.5px solid rgba(255,255,255,0.2)',
                    borderTopColor:'#4ade80',
                    animation:'spin 0.8s linear infinite',
                  }}/>
                : <Zap size={10} color={isAdReady ? '#4ade80' : 'rgba(255,255,255,0.3)'}/>
              }
              <span style={{
                color: isAdReady ? '#4ade80' : 'rgba(255,255,255,0.3)',
                fontSize:'calc(var(--text-2xs)*0.85)', fontWeight:800,
              }}>
                {isLoadingAd && !isAdReady ? 'تحميل' : isAdReady ? 'جاهز' : 'انتظر'}
              </span>
            </div>
          </div>
        </button>

      </div>{/* end header section */}

      {/* ══ سجل العمليات ════════════════════════════════════════ */}
      <div className="px-4">

        <p style={{
          color:'var(--text-main)', fontWeight:900,
          fontSize:'var(--text-sm)', marginBottom:12,
        }}>
          سجل العمليات
        </p>

        {/* فارغ */}
        {txList.length === 0 && !txLoad && (
          <div className="glass-panel p-10 flex flex-col items-center gap-3">
            <Inbox size={36} style={{ color:'var(--text-tertiary)', opacity:0.35 }}/>
            <p style={{ color:'var(--text-tertiary)', fontSize:'var(--text-sm)', fontWeight:700 }}>
              لا توجد عمليات بعد
            </p>
          </div>
        )}

        {/* القائمة */}
        <div className="space-y-2">
          {txList.map((tx, idx) => {
            const isCredit = tx.amount > 0;
            const { date, time } = fmtDate(tx.created_at);
            const label = getLabel(tx.source, tx.action);
            const isFirst = idx === 0;
            const prevDate = idx > 0 ? fmtDate(txList[idx - 1].created_at).date : '';
            const showDate = isFirst || date !== prevDate;

            return (
              <div key={tx.transaction_id}>

                {/* فاصل التاريخ */}
                {showDate && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)' }}/>
                    <span style={{
                      color:'var(--text-tertiary)',
                      fontSize:'calc(var(--text-2xs)*0.85)',
                      fontWeight:700, flexShrink:0,
                    }}>
                      {date}
                    </span>
                    <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.07)' }}/>
                  </div>
                )}

                {/* بطاقة المعاملة */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{
                  background:'rgba(255,255,255,0.03)',
                  border:'1px solid rgba(255,255,255,0.06)',
                }}>

                  {/* أيقونة الاتجاه */}
                  <div style={{
                    width:38, height:38, borderRadius:'50%', flexShrink:0,
                    background: isCredit ? 'rgba(34,197,94,0.12)' : 'rgba(179,51,75,0.12)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {isCredit
                      ? <TrendingUp  size={17} color="#4ade80"/>
                      : <TrendingDown size={17} color="var(--color-primary)"/>
                    }
                  </div>

                  {/* التفاصيل */}
                  <div className="flex-1 min-w-0">
                    <p style={{
                      color:'var(--text-main)', fontWeight:700,
                      fontSize:'var(--text-sm)',
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                    }}>
                      {label}
                    </p>
                    {tx.notes && tx.notes !== label && (
                      <p style={{
                        color:'var(--text-tertiary)', fontSize:'calc(var(--text-2xs)*0.9)',
                        marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                      }}>
                        {tx.notes}
                      </p>
                    )}
                    <p style={{ color:'var(--text-tertiary)', fontSize:'calc(var(--text-2xs)*0.85)', marginTop:2 }}>
                      {time}
                    </p>
                  </div>

                  {/* المبلغ + الرصيد بعد */}
                  <div style={{ textAlign:'left', flexShrink:0 }}>
                    <div className="flex items-center gap-1 justify-end">
                      <span style={{
                        color: isCredit ? '#4ade80' : 'var(--color-primary)',
                        fontWeight:900, fontSize:'var(--text-base)',
                      }}>
                        {isCredit ? '+' : ''}{fmt(tx.amount)}
                      </span>
                      <LoveCoin size={11}/>
                    </div>
                    <p style={{
                      color:'var(--text-tertiary)',
                      fontSize:'calc(var(--text-2xs)*0.8)',
                      textAlign:'left', marginTop:2,
                    }}>
                      رصيد: {fmt(tx.balance_after)}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}

          {/* تحميل المزيد */}
          {hasMore && !txLoad && txList.length > 0 && (
            <button
              onClick={() => loadTx()}
              className="w-full py-3 rounded-2xl font-bold transition-all active:scale-95"
              style={{
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.08)',
                color:'var(--text-tertiary)',
                fontSize:'var(--text-sm)',
              }}
            >
              تحميل المزيد
            </button>
          )}

          {/* مؤشر التحميل */}
          {txLoad && (
            <div className="flex justify-center py-5">
              <div style={{
                width:26, height:26, borderRadius:'50%',
                border:'2.5px solid rgba(255,255,255,0.08)',
                borderTopColor:'var(--color-primary)',
                animation:'spin 0.8s linear infinite',
              }}/>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
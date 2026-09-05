'use client';
/**
 * 📁 components/wallet/BuyCoinsSheet.tsx — ZAWAJ AI
 * شراء العملات داخل التطبيق عبر Google Play (RevenueCat)
 *
 * ✅ عدد العملات (coins + bonus) والتسميات من economy_config.packages
 *    — نفس المرجع الوحيد المُستعمل في الموقع (Konnect)
 * ✅ السعر المعروض من RevenueCat/Google (محلي حسب دولة المتجر تلقائياً)
 * ✅ لا يحدّث الرصيد مباشرة — التحديث يصير realtime بعد googleplay-webhook
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { LoveCoin } from '@/components/ui/LoveCoin';
import { useStorePurchases } from '@/hooks/useStorePurchases';

interface PackageConfig {
  id:         string;
  coins:      number;
  bonus:      number;
  label:      string;
  is_popular: boolean;
}

interface Props {
  open:    boolean;
  onClose: () => void;
}

const fmt = (n: number) => n.toLocaleString('ar-TN');

export function BuyCoinsSheet({ open, onClose }: Props) {
  const { ready, packages, loading, buyCoinPackage, isNative } = useStorePurchases();
  const [configPkgs, setConfigPkgs] = useState<PackageConfig[]>([]);
  const [buyingId,   setBuyingId]   = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.from('economy_config').select('value').eq('key', 'packages').single()
      .then(({ data }) => setConfigPkgs(data?.value ?? []));
  }, [open]);

  const priceFor = (id: string) => packages.find(p => p.identifier === id)?.priceString;

  const handleBuy = async (id: string) => {
    setBuyingId(id);
    try {
      await buyCoinPackage(id);
      toast.success('🎉 جارٍ تأكيد الشراء — سيصلك رصيدك خلال لحظات');
      onClose();
    } catch (err: any) {
      // إلغاء المستخدم للشراء ليس خطأ يستحق toast
      if (!err?.userCancelled) toast.error(err?.message ?? 'فشلت عملية الشراء');
    } finally {
      setBuyingId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[520]"
            style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(12px)' }}
            onClick={onClose} />

          <motion.div role="dialog" aria-modal="true" dir="rtl"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed bottom-0 left-0 right-0 z-[530] rounded-t-[32px] flex flex-col"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--glass-border)', maxHeight: '90vh' }}>

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--glass-border)' }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <p className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                شحن النقاط
              </p>
              <button onClick={onClose}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <X size={15} color="var(--text-tertiary)" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {!isNative ? (
                <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
                  الشراء متاح فقط داخل تطبيق أندرويد
                </p>
              ) : !ready || configPkgs.length === 0 ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} style={{ color: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
                </div>
              ) : (
                configPkgs.map(pkg => {
                  const total      = pkg.coins + (pkg.bonus ?? 0);
                  const price      = priceFor(pkg.id);
                  const isBuying   = buyingId === pkg.id;
                  const disabled   = !price || loading;
                  return (
                    <button key={pkg.id} disabled={disabled}
                      onClick={() => handleBuy(pkg.id)}
                      className="w-full text-right rounded-[20px] p-4 flex items-center gap-4"
                      style={{
                        background: pkg.is_popular ? 'rgba(179,51,75,0.07)' : 'var(--glass-bg)',
                        border: pkg.is_popular ? '1.5px solid rgba(179,51,75,0.4)' : '1px solid var(--glass-border)',
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-black" style={{ fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
                            {pkg.label}
                          </span>
                          {pkg.bonus > 0 && (
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22c55e',
                            }}>
                              +{pkg.bonus} هدية
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {fmt(total)}
                          </span>
                          <LoveCoin size={13} />
                          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>نقطة</span>
                        </div>
                      </div>
                      <div style={{ minWidth: 70, textAlign: 'left' }}>
                        {isBuying
                          ? <Loader2 size={20} style={{ color: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
                          : <span className="font-black" style={{ fontSize: 18, color: 'var(--text-main)' }}>{price ?? '—'}</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-5 pt-2" style={{ paddingBottom: 'calc(var(--nav-h-safe, 16px) + 16px)' }}>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-tertiary)' }}>
                🔒 دفع آمن عبر Google Play
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
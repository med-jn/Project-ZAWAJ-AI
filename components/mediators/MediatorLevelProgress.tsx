'use client';
/**
 * components/mediators/MediatorLevelProgress.tsx
 * ✅ مكوّن مستقل — يُستخدم في التطبيق (dash) والموقع
 * ✅ يستقبل total فقط ويحسب كل شيء داخلياً
 */

import { motion }              from 'framer-motion';
import { TrendingUp }          from 'lucide-react';
import { LevelBadge }          from '@/components/gems';
import { Icon }                from '@/components/mediators/Icon';
import { calculateUserProgress } from '@/lib/gems/LevelConfig';

interface Props {
  total: number; // إجمالي الاشتراكات التاريخية
}

export function MediatorLevelProgress({ total }: Props) {
  const progress = calculateUserProgress(total);

  return (
    <div className="rounded-[24px] p-4"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>

      {/* عنوان + عداد */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 icon-wrap">
          <Icon i={TrendingUp} size={14} color="#D4AF37" />
          <span className="font-black"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-main)' }}>
            تقدم المستوى
          </span>
        </div>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
          {total.toLocaleString('ar-TN')} اشتراك كلي
        </span>
      </div>

      {/* المستوى الحالي والتالي */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <LevelBadge subscribers={total} size="sm" />
          <span className="font-black"
            style={{ fontSize: 'var(--text-xs)', color: 'var(--text-main)', direction: 'ltr' }}>
            {progress.currentLevel.label}
          </span>
        </div>
        {progress.nextLevel ? (
          <div className="flex items-center gap-2" style={{ opacity: 0.45 }}>
            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', direction: 'ltr' }}>
              {progress.nextLevel.label}
            </span>
            <LevelBadge subscribers={progress.nextLevel.minSubscribers} size="sm" />
          </div>
        ) : (
          <span className="font-black" style={{ fontSize: 'var(--text-2xs)', color: '#D4AF37' }}>
            الحد الأقصى ✦
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 rounded-full overflow-hidden mb-3"
        style={{ background: 'var(--bg-soft)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
          className="absolute inset-y-0 right-0 rounded-full"
          style={{
            background: 'linear-gradient(to left, var(--color-primary), #D4AF37)',
            boxShadow: '0 0 8px rgba(212,175,55,0.4)',
          }}
        />
      </div>

      {/* النسبة + المتبقي */}
      <div className="flex items-center justify-between">
        <span style={{
          fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {progress.progressPercentage.toFixed(1)}٪ مكتمل
        </span>
        {progress.nextLevel && (
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
            {progress.subscribersNeeded} اشتراك للمستوى التالي
          </span>
        )}
      </div>
    </div>
  );
}
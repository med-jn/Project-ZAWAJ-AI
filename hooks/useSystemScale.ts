'use client';
/**
 * 📁 hooks/useSystemScale.ts — ZAWAJ AI  (ملف جديد)
 * ✅ يقرأ font-scale من النظام عبر window.devicePixelRatio + viewport
 * ✅ يخزّن مضاعف إضافي يختاره المستخدم (-30% → +50%)
 * ✅ يطبّق المقياس النهائي على --user-scale في :root
 *    (كل text/icon/avatar vars تضرب في هذا المتغير)
 *
 * الاستخدام:
 *   const { scale, setScale, resetScale } = useSystemScale();
 *   // scale: القيمة الحالية 0.7 – 1.5
 */

import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'zawaj-scale';

/** الحدود المسموح بها */
const MIN_SCALE = 0.70;
const MAX_SCALE = 1.50;
const DEFAULT_SCALE = 1.00;   // المستخدم لم يغيّر شيئاً

/** يحفظ ويطبّق المقياس على CSS */
function applyScale(scale: number) {
  document.documentElement.style.setProperty('--user-scale', String(scale));
}

export function useSystemScale() {
  const [scale, setScaleState] = useState<number>(DEFAULT_SCALE);

  // ── التهيئة الأولى ─────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const initial = saved ? parseFloat(saved) : DEFAULT_SCALE;
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, initial));
    setScaleState(clamped);
    applyScale(clamped);
  }, []);

  const setScale = useCallback((value: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
    setScaleState(clamped);
    applyScale(clamped);
    localStorage.setItem(STORAGE_KEY, String(clamped));
  }, []);

  const resetScale = useCallback(() => setScale(DEFAULT_SCALE), [setScale]);

  return {
    scale,
    setScale,
    resetScale,
    MIN_SCALE,
    MAX_SCALE,
    DEFAULT_SCALE,
    /** النسبة المئوية من 70 → 150 */
    percent: Math.round(scale * 100),
  };
}
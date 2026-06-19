'use client';
/**
 * 📁 components/ui/DualRangeSlider.tsx — ZAWAJ AI
 * ✅ شريط مزدوج احترافي
 * ✅ يعمل بـ mouse + touch على كل الأجهزة
 * ✅ LTR داخلياً (left=min, right=max) بغض النظر عن اتجاه الصفحة
 * ✅ لا تداخل بين المؤشرين
 * ✅ القيم تتحدث فورياً أثناء السحب
 */

import { useRef, useCallback, useEffect, useState } from 'react';

interface Props {
  min:          number;
  max:          number;
  valueMin:     number;
  valueMax:     number;
  onChangeMin:  (v: number) => void;
  onChangeMax:  (v: number) => void;
  unit?:        string;
  step?:        number;
}

export default function DualRangeSlider({
  min, max, valueMin, valueMax,
  onChangeMin, onChangeMax,
  unit = '', step = 1,
}: Props) {
  const trackRef   = useRef<HTMLDivElement>(null);
  const dragging   = useRef<'min' | 'max' | null>(null);

  // ── حساب النسبة المئوية (LTR: يسار=min، يمين=max) ──────
  const toPct = (v: number) => ((v - min) / (max - min)) * 100;

  // ── تحويل موقع الضغط إلى قيمة ─────────────────────────
  const clientXToValue = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return min;
    const rect  = track.getBoundingClientRect();
    // LTR دائماً: الأيسر = min، الأيمن = max
    const ratio = (clientX - rect.left) / rect.width;
    const raw   = min + ratio * (max - min);
    const stepped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, stepped));
  }, [min, max, step]);

  // ── بدء السحب ──────────────────────────────────────────
  const startDrag = useCallback((which: 'min' | 'max') => {
    dragging.current = which;

    const onMove = (clientX: number) => {
      const v = clientXToValue(clientX);
      if (dragging.current === 'min') {
        if (v < valueMax) onChangeMin(v);
        else onChangeMin(valueMax - step);
      } else {
        if (v > valueMin) onChangeMax(v);
        else onChangeMax(valueMin + step);
      }
    };

    const onMouseMove = (e: MouseEvent) => { e.preventDefault(); onMove(e.clientX); };
    const onTouchMove = (e: TouchEvent) => { e.preventDefault(); onMove(e.touches[0].clientX); };
    const onEnd = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend',  onEnd);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup',   onEnd);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend',  onEnd);
  }, [clientXToValue, valueMin, valueMax, step, onChangeMin, onChangeMax]);

  // ── الضغط على الـ Track مباشرة ─────────────────────────
  const onTrackPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e
      ? e.touches[0].clientX
      : (e as React.MouseEvent).clientX;
    const v = clientXToValue(clientX);

    // اختر أقرب مؤشر
    const distMin = Math.abs(v - valueMin);
    const distMax = Math.abs(v - valueMax);
    const which   = distMin <= distMax ? 'min' : 'max';

    if (which === 'min' && v < valueMax) { onChangeMin(v); startDrag('min'); }
    else if (which === 'max' && v > valueMin) { onChangeMax(v); startDrag('max'); }
  }, [clientXToValue, valueMin, valueMax, onChangeMin, onChangeMax, startDrag]);

  const minPct = toPct(valueMin);
  const maxPct = toPct(valueMax);

  const THUMB = 26; // حجم المؤشر بـ px

  return (
    <div style={{ padding: '4px 0 12px', userSelect: 'none', direction: 'ltr' }}>

      {/* ── قيم العرض ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 16, direction: 'rtl',
      }}>
        <span style={{
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          color: 'var(--color-primary)',
          fontSize: 'var(--text-xs)', fontWeight: 800,
          padding: '4px 14px', borderRadius: 'var(--radius-full)',
          minWidth: 72, textAlign: 'center',
        }}>
          {valueMin} {unit}
        </span>

        <span style={{
          color: 'var(--text-tertiary)',
          fontSize: 'var(--text-xs)',
          alignSelf: 'center',
        }}>—</span>

        <span style={{
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          color: 'var(--color-primary)',
          fontSize: 'var(--text-xs)', fontWeight: 800,
          padding: '4px 14px', borderRadius: 'var(--radius-full)',
          minWidth: 72, textAlign: 'center',
        }}>
          {valueMax} {unit}
        </span>
      </div>

      {/* ── الشريط ────────────────────────────────────────── */}
      <div
        ref={trackRef}
        onMouseDown={onTrackPointerDown}
        onTouchStart={onTrackPointerDown}
        style={{
          position: 'relative',
          height: THUMB,
          cursor: 'pointer',
          margin: `0 ${THUMB / 2}px`, // هامش لمنع خروج المؤشر
        }}
      >
        {/* الخلفية الرمادية */}
        <div style={{
          position: 'absolute',
          top: '50%', transform: 'translateY(-50%)',
          left: 0, right: 0, height: 6,
          borderRadius: 99,
          background: 'var(--glass-border)',
        }} />

        {/* النطاق الملون */}
        <div style={{
          position: 'absolute',
          top: '50%', transform: 'translateY(-50%)',
          left: `${minPct}%`,
          width: `${maxPct - minPct}%`,
          height: 6, borderRadius: 99,
          background: 'var(--color-primary)',
          pointerEvents: 'none',
        }} />

        {/* ── مؤشر الحد الأدنى ─────────────────────────────── */}
        <div
          onMouseDown={e => { e.stopPropagation(); startDrag('min'); }}
          onTouchStart={e => { e.stopPropagation(); startDrag('min'); }}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${minPct}%`,
            transform: 'translate(-50%, -50%)',
            width: THUMB, height: THUMB,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '3px solid var(--bg-main)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
            cursor: 'grab',
            zIndex: 3,
            touchAction: 'none',
            // تحسين اللمس على الموبايل
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {/* خطوط داخل المؤشر للدلالة على السحب */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 2.5,
          }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 1.5, height: 8, borderRadius: 99,
                background: 'rgba(255,255,255,0.7)',
              }} />
            ))}
          </div>
        </div>

        {/* ── مؤشر الحد الأقصى ─────────────────────────────── */}
        <div
          onMouseDown={e => { e.stopPropagation(); startDrag('max'); }}
          onTouchStart={e => { e.stopPropagation(); startDrag('max'); }}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${maxPct}%`,
            transform: 'translate(-50%, -50%)',
            width: THUMB, height: THUMB,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '3px solid var(--bg-main)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
            cursor: 'grab',
            zIndex: 3,
            touchAction: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 2.5,
          }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 1.5, height: 8, borderRadius: 99,
                background: 'rgba(255,255,255,0.7)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* حدود النطاق */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 8, padding: `0 ${THUMB / 2}px`,
        direction: 'rtl',
      }}>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
          {min} {unit}
        </span>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)' }}>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}
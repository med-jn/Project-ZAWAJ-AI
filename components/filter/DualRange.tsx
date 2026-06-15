'use client';
import { useRef, useCallback } from 'react';

/**
 * DualRange — شريط نطاق مزدوج مُصلح
 * ✅ RTL صحيح بالكامل
 * ✅ لا يستخدم input[type=range]
 * ✅ يدعم اللمس والماوس والنقر على الشريط
 */
interface DualRangeProps {
  min: number; max: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  unit?: string;
  step?: number;
}

export default function DualRange({
  min, max, valueMin, valueMax,
  onChangeMin, onChangeMax,
  unit = '', step = 1,
}: DualRangeProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const active   = useRef<'min' | 'max' | null>(null);

  // نسبة القيمة على الشريط (0% يسار → 100% يمين في LTR)
  // لكن شريطنا RTL: القيمة الأكبر على اليسار
  const pct = useCallback((v: number) =>
    ((v - min) / (max - min)) * 100,
  [min, max]);

  const valueFromClientX = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return min;
    const rect  = track.getBoundingClientRect();
    // RTL: كلما اتجهنا لليسار زادت القيمة
    const ratio = 1 - (clientX - rect.left) / rect.width;
    const raw   = min + ratio * (max - min);
    const snapped = Math.round(raw / step) * step;
    return Math.max(min, Math.min(max, snapped));
  }, [min, max, step]);

  // ── handlers مشتركة ───────────────────────────────────────
  const handleMove = useCallback((clientX: number) => {
    if (!active.current) return;
    const v = valueFromClientX(clientX);
    if (active.current === 'min') {
      if (v < valueMax) onChangeMin(v);
    } else {
      if (v > valueMin) onChangeMax(v);
    }
  }, [valueMin, valueMax, onChangeMin, onChangeMax, valueFromClientX]);

  const stopDrag = useCallback(() => {
    active.current = null;
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup',   onWindowMouseUp);
    window.removeEventListener('touchmove', onWindowTouchMove);
    window.removeEventListener('touchend',  onWindowTouchEnd);
  }, []);

  function onWindowMouseMove(e: MouseEvent) { handleMove(e.clientX); }
  function onWindowMouseUp()                { stopDrag(); }
  function onWindowTouchMove(e: TouchEvent) {
    e.preventDefault();
    handleMove(e.touches[0].clientX);
  }
  function onWindowTouchEnd()               { stopDrag(); }

  const startDrag = useCallback((which: 'min' | 'max') => {
    active.current = which;
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup',   onWindowMouseUp);
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend',  onWindowTouchEnd);
  }, [handleMove, stopDrag]);

  // نقر مباشر على الشريط
  const onTrackPointerDown = (e: React.PointerEvent) => {
    const v = valueFromClientX(e.clientX);
    const dMin = Math.abs(v - valueMin);
    const dMax = Math.abs(v - valueMax);
    const which = dMin <= dMax ? 'min' : 'max';
    if (which === 'min' && v < valueMax) onChangeMin(v);
    if (which === 'max' && v > valueMin) onChangeMax(v);
    startDrag(which);
  };

  // ── حسابات الموضع (RTL) ────────────────────────────────────
  // في RTL: القيمة الصغيرة على اليمين، الكبيرة على اليسار
  // right% = pct(valueMin)  → مؤشر الأدنى من اليمين
  // left%  = 100-pct(valueMax) → مؤشر الأقصى من اليسار
  const minRight  = pct(valueMin);           // % من اليمين لمؤشر الأدنى
  const maxLeft   = 100 - pct(valueMax);     // % من اليسار لمؤشر الأقصى
  const fillRight = minRight;                // بداية الشريط الملوّن من اليمين
  const fillLeft  = maxLeft;                 // نهايته من اليسار

  return (
    <div style={{ padding: '4px 0 12px', userSelect: 'none', direction: 'rtl' }}>

      {/* ── القيم ─────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 'var(--sp-4)',
      }}>
        <span style={{
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          color: 'var(--color-primary)',
          fontSize: 'var(--text-xs)', fontWeight: 800,
          padding: '4px 14px', borderRadius: 'var(--radius-full)',
          minWidth: 68, textAlign: 'center',
        }}>{valueMin} {unit}</span>

        <div style={{
          height: 1, flex: 1, margin: '0 var(--sp-2)',
          background: 'var(--border-soft)',
        }} />

        <span style={{
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          color: 'var(--color-primary)',
          fontSize: 'var(--text-xs)', fontWeight: 800,
          padding: '4px 14px', borderRadius: 'var(--radius-full)',
          minWidth: 68, textAlign: 'center',
        }}>{valueMax} {unit}</span>
      </div>

      {/* ── الشريط ────────────────────────────────── */}
      <div style={{ padding: '12px 0', position: 'relative' }}>
        {/* Track */}
        <div
          ref={trackRef}
          onPointerDown={onTrackPointerDown}
          style={{
            position: 'relative', height: 6,
            borderRadius: 99,
            background: 'var(--glass-border)',
            cursor: 'pointer',
            direction: 'rtl',
          }}
        >
          {/* النطاق المحدد */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            right: `${fillRight}%`,
            left:  `${fillLeft}%`,
            borderRadius: 99,
            background: 'linear-gradient(to left, var(--color-primary), #d4416b)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* مؤشر الحد الأدنى — من اليمين */}
        <div
          onMouseDown={() => startDrag('min')}
          onTouchStart={() => startDrag('min')}
          style={{
            position: 'absolute',
            top: '50%',
            right: `calc(${minRight}% - 12px)`,
            transform: 'translateY(-50%)',
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '3px solid var(--bg-main)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.45), 0 0 0 2px var(--color-primary-soft)',
            cursor: 'grab',
            zIndex: 4,
            touchAction: 'none',
          }}
        />

        {/* مؤشر الحد الأقصى — من اليسار */}
        <div
          onMouseDown={() => startDrag('max')}
          onTouchStart={() => startDrag('max')}
          style={{
            position: 'absolute',
            top: '50%',
            left: `calc(${maxLeft}% - 12px)`,
            transform: 'translateY(-50%)',
            width: 26, height: 26, borderRadius: '50%',
            background: 'var(--color-primary)',
            border: '3px solid var(--bg-main)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.45), 0 0 0 2px var(--color-primary-soft)',
            cursor: 'grab',
            zIndex: 4,
            touchAction: 'none',
          }}
        />
      </div>

      {/* ── حدود النطاق ───────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', direction: 'rtl' }}>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', opacity: 0.5 }}>
          {max} {unit}
        </span>
        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', opacity: 0.5 }}>
          {min} {unit}
        </span>
      </div>
    </div>
  );
}
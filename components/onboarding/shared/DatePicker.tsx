'use client';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import { Lbl } from './Lbl';

/**
 * DatePicker — Wheel Picker v4
 * • 3 عناصر مرئية: سابق + محدد + تالي
 * • خلفية زجاجية glass
 * • إطار مضيء حول المحدد
 * • الشهور أرقام 01-12
 * • RTL: يوم — شهر — سنة
 * • text-main للعنصر المحدد
 * • تحكم سلس مع momentum + snap
 */

interface DatePickerProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  minAge?: number;
  maxAge?: number;
}

const ITEM_H  = 52;
const VISIBLE = 3;
const DRUM_H  = ITEM_H * VISIBLE;

// ── WheelColumn ────────────────────────────────────────
function WheelColumn({
  items,
  selectedIndex,
  onSelect,
  label,
}: {
  items: string[];
  selectedIndex: number;
  onSelect: (i: number) => void;
  label: string;
}) {
  const ref        = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastY      = useRef(0);
  const lastTime   = useRef(0);
  const velocity   = useRef(0);
  const rafId      = useRef<number>(0);
  const isInit     = useRef(false);
  // نحفظ selectedIndex في ref حتى لا يتسبب useCallback في re-render loop
  const selRef     = useRef(selectedIndex);
  selRef.current   = selectedIndex;

  const clamp = useCallback((i: number) =>
    Math.max(0, Math.min(items.length - 1, i)),
  [items.length]);

  const scrollTo = useCallback((idx: number, smooth = true) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: clamp(idx) * ITEM_H, behavior: smooth ? 'smooth' : 'instant' });
  }, [clamp]);

  // مزامنة خارجية
  useEffect(() => {
    if (!isInit.current) {
      scrollTo(selectedIndex, false);
      isInit.current = true;
    } else {
      scrollTo(selectedIndex, true);
    }
  }, [selectedIndex, scrollTo]);

  const commitScroll = useCallback(() => {
    cancelAnimationFrame(rafId.current);
    const el = ref.current;
    if (!el) return;
    const idx = clamp(Math.round(el.scrollTop / ITEM_H));
    scrollTo(idx, true);
    if (idx !== selRef.current) onSelect(idx);
  }, [clamp, scrollTo, onSelect]);

  // ── Touch ────────────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    cancelAnimationFrame(rafId.current);
    isDragging.current = true;
    lastY.current      = e.touches[0].clientY;
    lastTime.current   = performance.now();
    velocity.current   = 0;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const now = performance.now();
    const dy  = lastY.current - e.touches[0].clientY;
    const dt  = now - lastTime.current;
    if (dt > 0) velocity.current = dy / dt;
    lastY.current    = e.touches[0].clientY;
    lastTime.current = now;
    ref.current.scrollTop += dy;
  }, []);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (!ref.current) return;
    let v = velocity.current * 120;
    const tick = () => {
      if (!ref.current) return;
      ref.current.scrollTop += v;
      v *= 0.86;
      if (Math.abs(v) > 0.5) {
        rafId.current = requestAnimationFrame(tick);
      } else {
        commitScroll();
      }
    };
    if (Math.abs(v) > 1) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      commitScroll();
    }
  }, [commitScroll]);

  // ── Mouse ────────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    cancelAnimationFrame(rafId.current);
    isDragging.current = true;
    lastY.current      = e.clientY;
    lastTime.current   = performance.now();
    velocity.current   = 0;
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !ref.current) return;
    const now = performance.now();
    const dy  = lastY.current - e.clientY;
    const dt  = now - lastTime.current;
    if (dt > 0) velocity.current = dy / dt;
    lastY.current    = e.clientY;
    lastTime.current = now;
    ref.current.scrollTop += dy;
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    commitScroll();
  }, [commitScroll]);

  // Wheel (سطح المكتب)
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    cancelAnimationFrame(rafId.current);
    if (!ref.current) return;
    ref.current.scrollTop += e.deltaY;
    commitScroll();
  }, [commitScroll]);

  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      {/* تسمية */}
      <p style={{
        fontSize: 'var(--text-2xs)',
        fontWeight: 800,
        color: 'var(--text-tertiary)',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: 8,
        opacity: 0.55,
      }}>{label}</p>

      {/* العجلة */}
      <div style={{ position: 'relative', width: '100%', height: DRUM_H }}>

        {/* إطار الصف المحدد */}
        <div style={{
          position:     'absolute',
          top:          ITEM_H,
          left:         6,
          right:        6,
          height:       ITEM_H,
          borderRadius: 'var(--radius-sm)',
          border:       '1.5px solid var(--border-medium)',
          background:   'var(--color-primary-soft)',
          boxShadow:    '0 0 16px var(--shadow-red-glow)',
          zIndex:       2,
          pointerEvents:'none',
        }} />

        {/* ظل علوي */}
        <div style={{
          position:     'absolute',
          top:          0, left: 0, right: 0,
          height:       ITEM_H,
          background:   'linear-gradient(to bottom, var(--bg-elevated) 30%, transparent)',
          zIndex:       3,
          pointerEvents:'none',
        }} />

        {/* ظل سفلي */}
        <div style={{
          position:     'absolute',
          bottom:       0, left: 0, right: 0,
          height:       ITEM_H,
          background:   'linear-gradient(to top, var(--bg-elevated) 30%, transparent)',
          zIndex:       3,
          pointerEvents:'none',
        }} />

        {/* الحاوية القابلة للتمرير */}
        <div
          ref={ref}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
          style={{
            height:                   '100%',
            overflowY:                'scroll',
            scrollbarWidth:           'none',
            WebkitOverflowScrolling:  'touch',
            cursor:                   isDragging.current ? 'grabbing' : 'grab',
            userSelect:               'none',
          }}
        >
          <div style={{ height: ITEM_H }} />

          {items.map((item, i) => {
            const isSelected = i === selectedIndex;
            const isAdjacent = Math.abs(i - selectedIndex) === 1;
            return (
              <div
                key={item}
                onClick={() => { scrollTo(i); onSelect(i); }}
                style={{
                  height:         ITEM_H,
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  fontSize:   isSelected ? 'var(--text-lg)'  : 'var(--text-sm)',
                  fontWeight: isSelected ? 700                : 400,
                  color:      isSelected
                    ? 'var(--text-main)'
                    : 'var(--text-tertiary)',
                  opacity: isSelected ? 1 : isAdjacent ? 0.55 : 0.2,
                  transition:  'all 0.18s ease',
                  cursor:      'pointer',
                  position:    'relative',
                  zIndex:      1,
                }}
              >
                {item}
              </div>
            );
          })}

          <div style={{ height: ITEM_H }} />
        </div>
      </div>
    </div>
  );
}

// ── المكوّن الرئيسي ─────────────────────────────────────
export default function DatePicker({
  label, value, onChange, error, minAge = 18, maxAge = 65,
}: DatePickerProps) {
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - maxAge;
  const maxYear = currentYear - minAge;

  const years = useMemo(() => {
    const arr: string[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(String(y));
    return arr;
  }, [minYear, maxYear]);

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')),
  []);

  const parts    = value ? value.split('-') : [];
  const curYear  = parts[0] ?? '';
  const curMonth = parts[1] ?? '';
  const curDay   = parts[2] ?? '';

  const daysInMonth = useMemo(() => {
    if (!curYear || !curMonth) return 31;
    return new Date(parseInt(curYear), parseInt(curMonth), 0).getDate();
  }, [curYear, curMonth]);

  const days = useMemo(() =>
    Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0')),
  [daysInMonth]);

  const defaultYearIdx = Math.floor(years.length / 3);

  const yearIdx  = curYear  ? years.indexOf(curYear)               : defaultYearIdx;
  const monthIdx = curMonth ? parseInt(curMonth) - 1               : 0;
  const dayIdx   = curDay   ? days.indexOf(curDay.padStart(2,'0')) : 0;

  const safeYearIdx  = yearIdx  < 0 ? defaultYearIdx                : yearIdx;
  const safeMonthIdx = monthIdx < 0 ? 0 : monthIdx;
  const safeDayIdx   = dayIdx   < 0 ? 0 : Math.min(dayIdx, days.length - 1);

  const emit = useCallback((yI: number, mI: number, dI: number) => {
    const y    = years[yI] ?? years[defaultYearIdx];
    const m    = String(mI + 1).padStart(2, '0');
    const maxD = new Date(parseInt(y), mI + 1, 0).getDate();
    const d    = String(Math.min(dI + 1, maxD)).padStart(2, '0');
    onChange(`${y}-${m}-${d}`);
  }, [years, defaultYearIdx, onChange]);

  return (
    <div style={{ marginBottom: 28 }}>
      <Lbl t={label} err={!!error} />

      {/* القيمة المختارة */}
      {value && (
        <p style={{
          fontSize:      'var(--text-xs)',
          color:         'var(--text-secondary)',
          fontWeight:    600,
          marginBottom:  10,
          letterSpacing: '0.06em',
          textAlign:     'center',
          direction:     'rtl',
          opacity:       0.75,
        }}>
          {days[safeDayIdx]} / {months[safeMonthIdx]} / {years[safeYearIdx]}
        </p>
      )}

      {/* البطاقة الزجاجية */}
      <div style={{
        background:          'var(--glass-bg)',
        backdropFilter:      'var(--glass-blur)',
        WebkitBackdropFilter:'var(--glass-blur)',
        borderRadius:        'var(--radius-lg)',
        border:              `1.5px solid ${error ? 'var(--color-accent)' : 'var(--glass-border)'}`,
        overflow:            'hidden',
        padding:             '8px 12px',
        boxShadow:           error
          ? '0 0 0 2px rgba(164,22,26,0.25)'
          : 'var(--shadow-soft)',
      }}>
        {/* RTL: يوم | شهر | سنة */}
        <div style={{ display: 'flex', direction: 'rtl', gap: 0 }}>

          <WheelColumn
            label="يوم"
            items={days}
            selectedIndex={safeDayIdx}
            onSelect={i => emit(safeYearIdx, safeMonthIdx, i)}
          />

          {/* فاصل */}
          <div style={{
            width:      1,
            alignSelf:  'stretch',
            background: 'var(--glass-border)',
            margin:     '16px 6px',
            flexShrink: 0,
          }} />

          <WheelColumn
            label="شهر"
            items={months}
            selectedIndex={safeMonthIdx}
            onSelect={i => emit(safeYearIdx, i, safeDayIdx)}
          />

          {/* فاصل */}
          <div style={{
            width:      1,
            alignSelf:  'stretch',
            background: 'var(--glass-border)',
            margin:     '16px 6px',
            flexShrink: 0,
          }} />

          <WheelColumn
            label="سنة"
            items={years}
            selectedIndex={safeYearIdx}
            onSelect={i => emit(i, safeMonthIdx, safeDayIdx)}
          />

        </div>
      </div>

      {error && (
        <p style={{
          color:      'var(--error-text)',
          fontSize:   'var(--text-xs)',
          marginTop:  'var(--sp-1)',
        }}>{error}</p>
      )}

      <style>{`div::-webkit-scrollbar{display:none}`}</style>
    </div>
  );
}
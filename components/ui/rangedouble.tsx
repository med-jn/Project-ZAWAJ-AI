'use client';
import { useRef, useEffect } from 'react';

interface RangeDoubleProps {
  label: string;
  min: number;
  max: number;
  valMin: number;
  valMax: number;
  onMin: (v: number) => void;
  onMax: (v: number) => void;
  unit: string;
}

export default function RangeDouble({ label, min, max, valMin, valMax, onMin, onMax, unit }: RangeDoubleProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<null | 'min' | 'max'>(null);

  const pctFromRight = (v: number) => ((v - min) / (max - min)) * 100;
  const pctFromLeft = (v: number) => 100 - pctFromRight(v);

  const getValueFromClientX = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return min;
    const ratio = 1 - (clientX - rect.left) / rect.width;
    const raw = min + ratio * (max - min);
    return Math.round(Math.min(max, Math.max(min, raw)));
  };

  const onPointerMove = (clientX: number) => {
    if (!dragging.current) return;
    const v = getValueFromClientX(clientX);
    if (dragging.current === 'min') {
      if (v <= valMax - 1) onMin(v);
    } else {
      if (v >= valMin + 1) onMax(v);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => onPointerMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => onPointerMove(e.touches[0].clientX);
    const onUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [valMin, valMax]);

  const minRight = pctFromRight(valMin);
  const maxLeft = pctFromLeft(valMax);

  const handle = (side: 'min' | 'max'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    ...(side === 'min' ? { right: `calc(${minRight}% - 7px)` } : { left: `calc(${maxLeft}% - 7px)` }),
    transform: 'translateY(-50%)',
    width: '14px',
    height: '26px',
    borderRadius: '7px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.9) 50%, rgba(255,255,255,0.85) 100%)',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 0 10px rgba(255,30,80,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(200,200,210,0.5)',
    cursor: 'grab',
    zIndex: 4,
    touchAction: 'none',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ color: 'rgba(255,180,180,0.8)', fontSize: '0.78rem', fontWeight: '700' }}>{label}</label>
        <span style={{
          color: '#fff', fontSize: '0.75rem', fontWeight: '700',
          background: 'linear-gradient(135deg, rgba(128,0,32,0.6), rgba(255,30,80,0.4))',
          padding: '3px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,80,120,0.4)',
          boxShadow: '0 2px 8px rgba(255,30,80,0.3)',
        }}>
          {valMin} — {valMax} {unit}
        </span>
      </div>

      <div style={{ padding: '14px 8px 8px', position: 'relative', userSelect: 'none' }}>
        <div ref={trackRef} style={{
          height: '5px', borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
        }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            right: `${minRight}%`,
            left: `${maxLeft}%`,
            background: 'linear-gradient(90deg, #ff1e50, #ff6b8a)',
            borderRadius: '3px',
            boxShadow: '0 0 6px rgba(255,30,80,0.6)',
          }} />

          <div
            style={handle('min')}
            onMouseDown={e => { e.preventDefault(); dragging.current = 'min'; }}
            onTouchStart={() => { dragging.current = 'min'; }}
          />

          <div
            style={handle('max')}
            onMouseDown={e => { e.preventDefault(); dragging.current = 'max'; }}
            onTouchStart={() => { dragging.current = 'max'; }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          <span style={{ color: 'rgba(255,180,180,0.35)', fontSize: '0.68rem' }}>{max}</span>
          <span style={{ color: 'rgba(255,180,180,0.35)', fontSize: '0.68rem' }}>{min}</span>
        </div>
      </div>
    </div>
  );
}
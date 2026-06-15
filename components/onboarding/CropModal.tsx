'use client';
import { useState, useEffect, useRef } from 'react';

interface Props {
  src: string;
  onConfirm: (cropX: number, cropY: number, cropSize: number) => void;
  onCancel: () => void;
  validating?: boolean;
}

const SIZE = 320;

function clampOffset(
  offset: { x: number; y: number },
  img: HTMLImageElement,
  scale: number,
) {
  const w = img.width  * scale;
  const h = img.height * scale;
  return {
    x: Math.min(0, Math.max(SIZE - w, offset.x)),
    y: Math.min(0, Math.max(SIZE - h, offset.y)),
  };
}

export default function CropModal({ src, onConfirm, onCancel, validating = false }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const imgRef     = useRef<HTMLImageElement | null>(null);
  const lastTouch  = useRef<{ x: number; y: number; dist?: number } | null>(null);

  const [loaded,   setLoaded]   = useState(false);
  const [offset,   setOffset]   = useState({ x: 0, y: 0 });
  const [scale,    setScale]    = useState(1);
  const [dragging, setDragging] = useState(false);

  // تحميل الصورة وتمركزها
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onerror = () => console.error('فشل تحميل الصورة');
    img.onload = () => {
      imgRef.current = img;
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      setScale(s);
      setOffset({
        x: (SIZE - img.width  * s) / 2,
        y: (SIZE - img.height * s) / 2,
      });
      setLoaded(true);
    };
  }, [src]);

  // رسم الـ canvas
  useEffect(() => {
    if (!loaded || !imgRef.current) return;
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const img    = imgRef.current;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);

    // تعتيم خارج الدائرة
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.rect(0, 0, SIZE, SIZE);
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();

    // حلقة الدائرة
    ctx.save();
    ctx.strokeStyle = '#B3334B';
    ctx.lineWidth   = 2.5;
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }, [loaded, offset, scale]);

  // ── اللمس ──────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      setDragging(true);
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouch.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!lastTouch.current || !imgRef.current) return;
    const img = imgRef.current;
    const minScale = SIZE / Math.max(img.width, img.height);

    if (e.touches.length === 1 && dragging) {
      const dx = e.touches[0].clientX - lastTouch.current.x;
      const dy = e.touches[0].clientY - lastTouch.current.y;
      setOffset(o => clampOffset({ x: o.x + dx, y: o.y + dy }, img, scale));
      lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastTouch.current.dist) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.min(4, Math.max(minScale, scale * (dist / lastTouch.current.dist)));
      setScale(newScale);
      setOffset(o => clampOffset(o, img, newScale));
      lastTouch.current = { ...lastTouch.current, dist };
    }
  };

  const onTouchEnd = () => { setDragging(false); lastTouch.current = null; };

  // ── الماوس ──────────────────────────────────────────
  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !lastTouch.current || !imgRef.current) return;
    const dx = e.clientX - lastTouch.current.x;
    const dy = e.clientY - lastTouch.current.y;
    setOffset(o => clampOffset({ x: o.x + dx, y: o.y + dy }, imgRef.current!, scale));
    lastTouch.current = { x: e.clientX, y: e.clientY };
  };
  const onMouseUp = () => { setDragging(false); lastTouch.current = null; };

  const onWheel = (e: React.WheelEvent) => {
    if (!imgRef.current) return;
    const minScale = SIZE / Math.max(imgRef.current.width, imgRef.current.height);
    const newScale = Math.min(4, Math.max(minScale, scale - e.deltaY * 0.001));
    setScale(newScale);
    setOffset(o => clampOffset(o, imgRef.current!, newScale));
  };

  const confirm = () => {
    if (!imgRef.current) return;
    const img   = imgRef.current;
    const cropX = Math.max(0, -offset.x / scale);
    const cropY = Math.max(0, -offset.y / scale);
    const cropSz = Math.min(
      SIZE / scale,
      Math.min(img.width - cropX, img.height - cropY),
    );
    onConfirm(cropX, cropY, cropSz);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 'var(--sp-4)',
    }}>
      <p style={{
        color: 'var(--text-secondary)', fontSize: 'var(--text-sm)',
        marginBottom: 'var(--sp-4)', textAlign: 'center',
      }}>
        اسحب الصورة لتحديد موضع الوجه داخل الدائرة
      </p>

      <canvas
        ref={canvasRef}
        width={SIZE} height={SIZE}
        style={{
          borderRadius: '50%',
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          maxWidth: '90vw', maxHeight: '90vw',
          boxShadow: '0 0 0 3px var(--color-primary), 0 16px 48px rgba(0,0,0,0.7)',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />

      <p style={{
        color: 'rgba(255,255,255,0.35)', fontSize: 'var(--text-2xs)',
        margin: 'var(--sp-3) 0', textAlign: 'center',
      }}>
        قرّب أو بعّد بالأصبعين أو عجلة الماوس
      </p>

      {/* overlay تحميل */}
      {validating && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 'var(--sp-3)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid var(--color-primary)',
            borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{ color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
            جارٍ فحص الصورة...
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--sp-3)', width: '100%', maxWidth: 320 }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1, height: 'var(--btn-h)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-soft)',
            border: '1px solid var(--border-medium)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)', fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer',
            WebkitTapHighlightColor: 'transparent',
          }}
        >إلغاء</button>

        <button
          onClick={confirm}
          style={{
            flex: 2, height: 'var(--btn-h)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)', border: 'none',
            color: '#fff', fontSize: 'var(--text-base)', fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 4px 16px var(--shadow-red-glow)',
            WebkitTapHighlightColor: 'transparent',
          }}
        >تأكيد الصورة</button>
      </div>
    </div>
  );
}
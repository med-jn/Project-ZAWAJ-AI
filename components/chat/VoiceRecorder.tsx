'use client';
/**
 * 📁 components/chat/VoiceRecorder.tsx — ZAWAJ AI
 *
 * اضغط مطولاً للتسجيل — يرفع يدك لإرسال
 * ✅ حد 10 ثوانٍ مع شريط تقدم
 * ✅ يستخدم MediaRecorder مع audio/webm
 * ✅ تعليقات بصرية واضحة (ألوان + اهتزاز)
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X } from 'lucide-react';

const MAX_SECONDS = 10;

interface Props {
  onSend:     (blob: Blob) => void;
  disabled?:  boolean;
}

type RecordState = 'idle' | 'recording' | 'cancelled';

export default function VoiceRecorder({ onSend, disabled }: Props) {
  const [state,    setState]    = useState<RecordState>('idle');
  const [elapsed,  setElapsed]  = useState(0);   // ثوانٍ

  const mediaRef    = useRef<MediaRecorder | null>(null);
  const chunksRef   = useRef<Blob[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef   = useRef(false);
  const startYRef   = useRef(0);  // لكشف السحب للأعلى للإلغاء

  // ── تنظيف عند unmount ─────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaRef.current?.state === 'recording') mediaRef.current.stop();
    };
  }, []);

  // ── مؤقت ──────────────────────────────────────────────────
  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed(prev => {
        if (prev + 1 >= MAX_SECONDS) {
          stopRecording(false);
          return MAX_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // ── بدء التسجيل ───────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (disabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      cancelRef.current = false;

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (!cancelRef.current && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: mimeType });
          onSend(blob);
        }
        setState('idle');
        setElapsed(0);
      };

      recorder.start(100);
      mediaRef.current = recorder;
      setState('recording');
      startTimer();

    } catch (err) {
      console.error('[VoiceRecorder] mic error:', err);
      setState('idle');
    }
  }, [disabled, onSend]);

  // ── إيقاف التسجيل ─────────────────────────────────────────
  const stopRecording = useCallback((cancel: boolean) => {
    stopTimer();
    cancelRef.current = cancel;
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop();
    }
    if (cancel) setState('cancelled');
  }, []);

  // ── أحداث اللمس ────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    startRecording();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (state !== 'recording') return;
    const dy = startYRef.current - e.touches[0].clientY;
    // سحب 60px للأعلى = إلغاء
    if (dy > 60) stopRecording(true);
  };

  const handleTouchEnd = () => {
    if (state === 'recording') stopRecording(false);
  };

  // ── أحداث الماوس (ديسكتوب / تيستينج) ──────────────────────
  const handleMouseDown = () => startRecording();
  const handleMouseUp   = () => { if (state === 'recording') stopRecording(false); };

  // ── تنسيق الوقت ───────────────────────────────────────────
  const progress = (elapsed / MAX_SECONDS) * 100;
  const timeLeft = MAX_SECONDS - elapsed;
  const isWarning = timeLeft <= 3;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>

      {/* ── شريط التقدم + مؤشر الوقت — يظهر أثناء التسجيل ── */}
      <AnimatePresence>
        {state === 'recording' && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{    opacity: 0, y: 8,  scale: 0.9 }}
            style={{
              position:     'absolute',
              bottom:       52,
              right:        '50%',
              transform:    'translateX(50%)',
              display:      'flex',
              flexDirection:'column',
              alignItems:   'center',
              gap:          6,
              width:        120,
              pointerEvents:'none',
            }}
          >
            {/* حلقة زمنية */}
            <div style={{ position: 'relative', width: 48, height: 48 }}>
              <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="24" cy="24" r="20" fill="none"
                  stroke="rgba(255,255,255,0.12)" strokeWidth="3"/>
                <circle cx="24" cy="24" r="20" fill="none"
                  stroke={isWarning ? '#f87171' : 'var(--color-accent)'}
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
              </svg>
              <span style={{
                position:  'absolute',
                inset:     0,
                display:   'flex',
                alignItems:'center',
                justifyContent: 'center',
                fontSize:  13,
                fontWeight:700,
                color:     isWarning ? '#f87171' : 'var(--text-main)',
              }}>
                {timeLeft}
              </span>
            </div>

            {/* نص الإلغاء */}
            <span style={{
              fontSize:  10,
              color:     'var(--text-tertiary)',
              textAlign: 'center',
              lineHeight:1.3,
            }}>
              اسحب للأعلى للإلغاء
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── تأثير الموجة خلف الزر ─────────────────────────── */}
      <AnimatePresence>
        {state === 'recording' && (
          <>
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2.2 + i * 0.3, opacity: 0 }}
                transition={{
                  repeat:   Infinity,
                  duration: 1.6,
                  delay:    i * 0.4,
                  ease:     'easeOut',
                }}
                style={{
                  position:    'absolute',
                  inset:       0,
                  borderRadius:'50%',
                  background:  'var(--color-accent)',
                  pointerEvents:'none',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── الزر الرئيسي ──────────────────────────────────── */}
      <motion.button
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        animate={{
          scale:     state === 'recording' ? 1.15 : 1,
          background:state === 'recording'
            ? 'var(--color-accent)'
            : 'rgba(255,255,255,0.06)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        disabled={disabled}
        style={{
          width:         40,
          height:        40,
          borderRadius:  '50%',
          border:        state === 'recording'
            ? '2px solid rgba(255,255,255,0.3)'
            : '1px solid var(--glass-border)',
          cursor:        disabled ? 'not-allowed' : 'pointer',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          flexShrink:    0,
          position:      'relative',
          zIndex:        1,
          touchAction:   'none', // منع scroll أثناء الضغط
          userSelect:    'none',
          WebkitUserSelect: 'none',
        }}
      >
        {state === 'recording'
          ? <X size={16} color="#fff" />
          : <Mic size={16} color={disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)'} />
        }
      </motion.button>
    </div>
  );
}
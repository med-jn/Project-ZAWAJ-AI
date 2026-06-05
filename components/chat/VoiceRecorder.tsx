'use client';
/**
 * 📁 components/chat/VoiceRecorder.tsx — ZAWAJ AI
 * ضغط مطوّل = تسجيل / رفع الإصبع = إرسال / سحب لأعلى = إلغاء
 * ✅ Touch-only على native — Mouse-only على ويب (لا تداخل)
 * ✅ guard ضد ALREADY_RECORDING
 * ✅ حد 10 ثوانٍ مع حلقة زمنية
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const MAX_SECONDS = 10;

let VoiceRecorderPlugin: any = null;

async function loadNativeRecorder() {
  if (Capacitor.isNativePlatform() && !VoiceRecorderPlugin) {
    try {
      const mod = await import('capacitor-voice-recorder');
      VoiceRecorderPlugin = mod.VoiceRecorder;
    } catch (e) {
      console.warn('[VoiceRecorder] not available:', e);
    }
  }
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteChars   = atob(base64);
  const byteNumbers = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

interface Props {
  onSend:    (blob: Blob) => void;
  disabled?: boolean;
}

type RecordState = 'idle' | 'recording';

export default function VoiceRecorder({ onSend, disabled }: Props) {
  const [state,   setState]   = useState<RecordState>('idle');
  const [elapsed, setElapsed] = useState(0);

  const timerRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef       = useRef(false);
  const isRecordingRef  = useRef(false);
  const isTouchRef      = useRef(false); // ✅ هل الحدث touch؟ لمنع mouse بعده
  const startYRef       = useRef(0);
  const mediaRef        = useRef<MediaRecorder | null>(null);
  const chunksRef       = useRef<Blob[]>([]);

  useEffect(() => {
    loadNativeRecorder();
    return () => stopTimer();
  }, []);

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
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startRecording = useCallback(async () => {
    if (disabled) return;
    if (isRecordingRef.current) return;

    cancelRef.current      = false;
    isRecordingRef.current = true;

    if (Capacitor.isNativePlatform() && VoiceRecorderPlugin) {
      try {
        const { value: hasPerm } = await VoiceRecorderPlugin.hasAudioRecordingPermission();
        if (!hasPerm) {
          const { value: granted } = await VoiceRecorderPlugin.requestAudioRecordingPermission();
          if (!granted) { isRecordingRef.current = false; return; }
        }
        try { await VoiceRecorderPlugin.stopRecording(); } catch (_) {}
        await VoiceRecorderPlugin.startRecording();
        setState('recording');
        startTimer();
      } catch (e) {
        console.error('[VoiceRecorder] native start error:', e);
        isRecordingRef.current = false;
      }
      return;
    }

    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder    = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (!cancelRef.current && chunksRef.current.length > 0) {
          onSend(new Blob(chunksRef.current, { type: mimeType }));
        }
        setState('idle');
        setElapsed(0);
        isRecordingRef.current = false;
      };
      recorder.start(100);
      mediaRef.current = recorder;
      setState('recording');
      startTimer();
    } catch (e) {
      console.error('[VoiceRecorder] web start error:', e);
      isRecordingRef.current = false;
    }
  }, [disabled, onSend]);

  const stopRecording = useCallback(async (cancel: boolean) => {
    if (!isRecordingRef.current) return;
    stopTimer();
    cancelRef.current = cancel;

    if (Capacitor.isNativePlatform() && VoiceRecorderPlugin) {
      try {
        const result = await VoiceRecorderPlugin.stopRecording();
        if (!cancel) {
          const { recordDataBase64, mimeType } = result?.value ?? {};
          if (recordDataBase64) {
            onSend(base64ToBlob(recordDataBase64, mimeType || 'audio/aac'));
          }
        }
      } catch (e) {
        console.error('[VoiceRecorder] native stop error:', e);
      }
      setState('idle');
      setElapsed(0);
      isRecordingRef.current = false;
      return;
    }

    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.stop();
    } else {
      isRecordingRef.current = false;
    }
    if (cancel) { setState('idle'); setElapsed(0); }
  }, [onSend]);

  const isNative = Capacitor.isNativePlatform();

  // ── Touch handlers ─────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isTouchRef.current = true;
    startYRef.current  = e.touches[0].clientY;
    startRecording();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (state !== 'recording') return;
    if (startYRef.current - e.touches[0].clientY > 60) stopRecording(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (state === 'recording') stopRecording(false);
    setTimeout(() => { isTouchRef.current = false; }, 500);
  };

  // ── Mouse handlers (ويب فقط — محذوفة على native تماماً) ────
  const handleMouseDown = !isNative ? (e: React.MouseEvent) => {
    if (isTouchRef.current) return;
    e.preventDefault();
    startRecording();
  } : undefined;

  const handleMouseUp = !isNative ? (e: React.MouseEvent) => {
    if (isTouchRef.current) return;
    e.preventDefault();
    if (state === 'recording') stopRecording(false);
  } : undefined;

  const handleMouseLeave = !isNative ? (e: React.MouseEvent) => {
    if (isTouchRef.current) return;
    if (state === 'recording') stopRecording(false);
  } : undefined;

  const progress  = (elapsed / MAX_SECONDS) * 100;
  const timeLeft  = MAX_SECONDS - elapsed;
  const isWarning = timeLeft <= 3;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>

      {/* مؤشر الوقت */}
      <AnimatePresence>
        {state === 'recording' && (
          <motion.div
            initial={{ opacity: 0, y: 8,  scale: 0.9 }}
            animate={{ opacity: 1, y: 0,  scale: 1   }}
            exit={{    opacity: 0, y: 8,  scale: 0.9 }}
            style={{
              position: 'absolute', bottom: 52, right: '50%',
              transform: 'translateX(50%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 4, width: 120,
              pointerEvents: 'none',
            }}
          >
            <div style={{ position: 'relative', width: 44, height: 44 }}>
              <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="22" cy="22" r="18" fill="none"
                  stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
                <circle cx="22" cy="22" r="18" fill="none"
                  stroke={isWarning ? '#f87171' : 'var(--color-accent)'}
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 18}`}
                  strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
                />
              </svg>
              <span style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700,
                color: isWarning ? '#f87171' : 'var(--text-main)',
              }}>
                {timeLeft}
              </span>
            </div>
            <span style={{ fontSize: 9, color: 'var(--text-tertiary)', textAlign: 'center' }}>
              اسحب للأعلى للإلغاء
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* موجات */}
      <AnimatePresence>
        {state === 'recording' && [1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 1, opacity: 0.35 }}
            animate={{ scale: 2.2 + i * 0.3, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.6, delay: i * 0.4, ease: 'easeOut' }}
            style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'var(--color-accent)', pointerEvents: 'none',
            }}
          />
        ))}
      </AnimatePresence>

      {/* الزر */}
      <motion.button
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        animate={{
          scale:      state === 'recording' ? 1.15 : 1,
          background: state === 'recording'
            ? 'var(--color-accent)'
            : 'rgba(255,255,255,0.06)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        disabled={disabled}
        style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          border: state === 'recording'
            ? '2px solid rgba(255,255,255,0.3)'
            : '1px solid var(--glass-border)',
          cursor:   disabled ? 'not-allowed' : 'pointer',
          display:  'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {state === 'recording'
          ? <X   size={15} color="#fff" />
          : <Mic size={15} color={disabled ? 'var(--text-tertiary)' : 'var(--text-secondary)'} />
        }
      </motion.button>
    </div>
  );
}
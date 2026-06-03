'use client';
/**
 * 📁 components/chat/VoiceMessageBubble.tsx — ZAWAJ AI
 * ✅ FIX: duration على Android AAC — يستخدم durationchange + seek trick
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';

interface Props {
  audioUrl:  string;
  isMine:    boolean;
  duration?: number; // بالثوانٍ — اختياري
}

const BARS = [3, 6, 9, 7, 12, 8, 5, 10, 6, 8, 11, 7, 4, 9, 6, 8, 10, 5, 7, 9, 6, 4, 8, 5, 3];
const MAX_SECONDS = 10;

export default function VoiceMessageBubble({ audioUrl, isMine, duration }: Props) {
  const [playing,  setPlaying]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [realDur,  setRealDur]  = useState(duration ?? 0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef   = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const tryGetDuration = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        // نحدد الحد الأقصى بـ MAX_SECONDS
        setRealDur(Math.min(Math.round(audio.duration), MAX_SECONDS));
        return true;
      }
      return false;
    };

    audio.onloadedmetadata = () => {
      if (!tryGetDuration()) {
        // ✅ Seek trick: نجبر المتصفح على حساب المدة
        audio.currentTime = 1e101;
      }
    };

    // ✅ durationchange يُطلق بعد seek trick
    audio.ondurationchange = () => {
      tryGetDuration();
      // أعد الموضع للبداية
      if (isFinite(audio.duration)) audio.currentTime = 0;
    };

    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };

    audio.src = audioUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [audioUrl]);

  const tick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : realDur;
    setProgress(dur > 0 ? audio.currentTime / dur : 0);
    rafRef.current = requestAnimationFrame(tick);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      audio.play().then(() => {
        setPlaying(true);
        rafRef.current = requestAnimationFrame(tick);
      }).catch(console.error);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  // الوقت المعروض: إذا يعزف نعرض currentTime، وإلا المدة الكاملة
  const displayTime = () => {
    const audio = audioRef.current;
    if (playing && audio) {
      const remaining = (isFinite(audio.duration) ? audio.duration : realDur) - audio.currentTime;
      return fmt(Math.max(0, Math.ceil(remaining)));
    }
    return realDur > 0 ? fmt(realDur) : '0:00';
  };

  const accentColor = isMine ? '#fff' : 'var(--color-accent)';
  const dimColor    = isMine ? 'rgba(255,255,255,0.4)' : 'rgba(164,22,26,0.25)';

  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        10,
      minWidth:   160,
      maxWidth:   220,
    }}>

      {/* زر Play/Pause */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={togglePlay}
        style={{
          width:          38,
          height:         38,
          borderRadius:   '50%',
          flexShrink:     0,
          background:     isMine ? 'rgba(255,255,255,0.18)' : 'var(--color-primary-soft)',
          border:         `1px solid ${isMine ? 'rgba(255,255,255,0.25)' : 'var(--border-soft)'}`,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          cursor:         'pointer',
        }}
      >
        {playing
          ? <Pause size={15} color={accentColor} fill={accentColor} />
          : <Play  size={15} color={accentColor} fill={accentColor} />
        }
      </motion.button>

      {/* موجة + وقت */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
          {BARS.map((h, i) => {
            const threshold = i / BARS.length;
            const filled    = progress > threshold;
            return (
              <motion.div
                key={i}
                animate={{ scaleY: playing ? [1, 1.3, 1] : 1 }}
                transition={playing ? {
                  repeat:   Infinity,
                  duration: 0.6 + (i % 5) * 0.12,
                  delay:    (i % 7) * 0.07,
                } : {}}
                style={{
                  width:           3,
                  height:          h,
                  borderRadius:    2,
                  background:      filled ? accentColor : dimColor,
                  transition:      'background 0.1s',
                  transformOrigin: 'center',
                }}
              />
            );
          })}
        </div>

        <span style={{
          fontSize: 10,
          color:    isMine ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)',
        }}>
          {displayTime()}
        </span>
      </div>
    </div>
  );
}
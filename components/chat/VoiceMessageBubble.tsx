'use client';
/**
 * 📁 components/chat/VoiceMessageBubble.tsx — ZAWAJ AI
 * ✅ Signed URL للـ private bucket
 * ✅ كتم كل الرسائل الأخرى عند التشغيل
 * ✅ تحديث listened_at عند انتهاء الاستماع (الطرف الثاني فقط)
 * ✅ pg_cron يحذف الرسالة بعد 30 ثانية تلقائياً
 */

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { getVoiceSignedUrl } from '@/lib/supabase/chatStorage';
import { supabase } from '@/lib/supabase/client';

interface Props {
  audioUrl:  string;
  isMine:    boolean;
  duration?: number;
  messageId: string; // مطلوب لتحديث listened_at
}

const BARS        = [3,6,9,7,12,8,5,10,6,8,11,7,4,9,6,8,10,5,7,9,6,4,8,5,3];
const MAX_SECONDS = 10;

// ── Singleton: يوقف أي تشغيل سابق ───────────────────────────
let currentAudio: HTMLAudioElement | null = null;
let currentStop:  (() => void) | null     = null;

function stopCurrentAudio() {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  currentStop?.();
  currentAudio = null;
  currentStop  = null;
}

export default function VoiceMessageBubble({ audioUrl, isMine, duration, messageId }: Props) {
  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [realDur,   setRealDur]   = useState(duration ?? 0);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef   = useRef<number | null>(null);

  // ── جلب signed URL ─────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setSignedUrl(null);
    setLoadError(false);

    getVoiceSignedUrl(audioUrl)
      .then(url => { if (!cancelled) setSignedUrl(url); })
      .catch(() => { if (!cancelled) setLoadError(true); });

    return () => { cancelled = true; };
  }, [audioUrl]);

  // ── init audio ─────────────────────────────────────────────
  useEffect(() => {
    if (!signedUrl) return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const tryDur = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setRealDur(Math.min(Math.round(audio.duration), MAX_SECONDS));
        return true;
      }
      return false;
    };

    audio.onloadedmetadata = () => { if (!tryDur()) audio.currentTime = 1e101; };
    audio.ondurationchange = () => {
      tryDur();
      if (isFinite(audio.duration)) audio.currentTime = 0;
    };

    audio.onended = () => {
      setPlaying(false);
      setProgress(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (currentAudio === audio) { currentAudio = null; currentStop = null; }

      // ✅ الطرف الثاني فقط — تحديث listened_at
      // pg_cron سيحذف الرسالة بعد 30 ثانية تلقائياً
      if (!isMine && messageId) {
        supabase
          .from('messages')
          .update({ listened_at: new Date().toISOString() })
          .eq('id', messageId)
          .then(({ error }) => {
            if (error) console.error('[VoiceMsg] listened_at update failed:', error.message);
          });
      }
    };

    audio.src = signedUrl;
    audio.load();

    return () => {
      audio.pause();
      audio.src = '';
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (currentAudio === audio) { currentAudio = null; currentStop = null; }
    };
  }, [signedUrl, isMine, messageId]);

  const tick = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : realDur;
    setProgress(dur > 0 ? audio.currentTime / dur : 0);
    rafRef.current = requestAnimationFrame(tick);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !signedUrl) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (currentAudio === audio) { currentAudio = null; currentStop = null; }
    } else {
      // ✅ أوقف أي رسالة أخرى تعزف
      stopCurrentAudio();

      audio.play()
        .then(() => {
          setPlaying(true);
          rafRef.current = requestAnimationFrame(tick);
          currentAudio = audio;
          currentStop  = () => {
            setPlaying(false);
            setProgress(0);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
          };
        })
        .catch(console.error);
    }
  };

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  const displayTime = () => {
    const audio = audioRef.current;
    if (playing && audio) {
      const rem = (isFinite(audio.duration) ? audio.duration : realDur) - audio.currentTime;
      return fmt(Math.max(0, Math.ceil(rem)));
    }
    return realDur > 0 ? fmt(realDur) : '0:00';
  };

  const accentColor = isMine ? '#fff' : 'var(--color-accent)';
  const dimColor    = isMine ? 'rgba(255,255,255,0.4)' : 'rgba(164,22,26,0.25)';

  if (loadError) {
    return (
      <span style={{ fontSize: 12, color: isMine ? 'rgba(255,255,255,0.5)' : 'var(--text-tertiary)' }}>
        تعذّر تحميل الصوت
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 160, maxWidth: 220 }}>

      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={togglePlay}
        disabled={!signedUrl}
        style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          background: isMine ? 'rgba(255,255,255,0.18)' : 'var(--color-primary-soft)',
          border: `1px solid ${isMine ? 'rgba(255,255,255,0.25)' : 'var(--border-soft)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: signedUrl ? 'pointer' : 'wait',
          opacity: signedUrl ? 1 : 0.5,
        }}
      >
        {!signedUrl ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
            style={{
              width: 12, height: 12, borderRadius: '50%',
              border: `2px solid ${accentColor}`, borderTopColor: 'transparent',
            }}
          />
        ) : playing ? (
          <Pause size={15} color={accentColor} fill={accentColor} />
        ) : (
          <Play  size={15} color={accentColor} fill={accentColor} />
        )}
      </motion.button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
          {BARS.map((h, i) => {
            const filled = progress > i / BARS.length;
            return (
              <motion.div key={i}
                animate={{ scaleY: playing ? [1, 1.3, 1] : 1 }}
                transition={playing ? {
                  repeat: Infinity,
                  duration: 0.6 + (i % 5) * 0.12,
                  delay: (i % 7) * 0.07,
                } : {}}
                style={{
                  width: 3, height: h, borderRadius: 2,
                  background: filled ? accentColor : dimColor,
                  transition: 'background 0.1s', transformOrigin: 'center',
                }}
              />
            );
          })}
        </div>
        <span style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--text-tertiary)' }}>
          {displayTime()}
        </span>
      </div>
    </div>
  );
}
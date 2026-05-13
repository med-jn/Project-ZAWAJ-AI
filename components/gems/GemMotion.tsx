"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GemMotionProps {
  children: React.ReactNode;
  level: number;
}

/**
 * AAA Gem Motion System
 * Cinematic floating / shimmer / energy pulse
 * Designed for premium mobile game UI
 */

const GemMotion: React.FC<GemMotionProps> = ({
  children,
  level,
}) => {

  /* ------------------------------------------------ */
  /* TIER DETECTION */
  /* ------------------------------------------------ */

  const isMid = level >= 20;
  const isHigh = level >= 40;

  /* ------------------------------------------------ */
  /* FLOATING */
  /* ------------------------------------------------ */

  const floatingAnimation = isHigh
    ? {
        y: [0, -3.5, 0],
        rotate: [0, 0.8, 0, -0.8, 0],
        scale: [1, 1.015, 1],
      }
    : isMid
    ? {
        y: [0, -2.2, 0],
        rotate: [0, 0.4, 0],
      }
    : {
        y: [0, -1.2, 0],
      };

  /* ------------------------------------------------ */
  /* ENERGY PULSE */
  /* ------------------------------------------------ */

  const pulseAnimation = isHigh
    ? {
        scale: [1, 1.18, 1],
        opacity: [0.22, 0.55, 0.22],
      }
    : {
        scale: [1, 1.08, 1],
        opacity: [0.12, 0.22, 0.12],
      };

  /* ------------------------------------------------ */
  /* SHINE SWEEP */
  /* ------------------------------------------------ */

  const shineDuration = isHigh
    ? 2.8
    : isMid
    ? 3.8
    : 5;

  const shineDelay = isHigh
    ? 1.2
    : isMid
    ? 2.5
    : 4;

  /* ------------------------------------------------ */
  /* COLORS */
  /* ------------------------------------------------ */

  const auraColor = isHigh
    ? 'rgba(245,158,11,0.55)'
    : isMid
    ? 'rgba(192,38,211,0.42)'
    : 'rgba(56,189,248,0.28)';

  /* ------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------ */

  return (
    <motion.div
      animate={floatingAnimation}
      transition={{
        duration: isHigh ? 5 : 4.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className="relative flex items-center justify-center"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >

      {/* ====================================================== */}
      {/* BACK ENERGY AURA */}
      {/* ====================================================== */}

      <motion.div
        animate={pulseAnimation}
        transition={{
          duration: isHigh ? 2.2 : 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: auraColor,
          filter: isHigh
            ? 'blur(18px)'
            : 'blur(10px)',
          zIndex: -2,
        }}
      />

      {/* ====================================================== */}
      {/* SECONDARY BLOOM */}
      {/* ====================================================== */}

      {isHigh && (
        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.08, 0.22, 0.08],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'rgba(255,255,255,0.22)',
            filter: 'blur(28px)',
            zIndex: -3,
          }}
        />
      )}

      {/* ====================================================== */}
      {/* MAIN GEM */}
      {/* ====================================================== */}

      <div className="relative">
        {children}
      </div>

      {/* ====================================================== */}
      {/* CINEMATIC SHINE SWEEP */}
      {/* ====================================================== */}

      <div
        className="
          absolute
          inset-0
          overflow-hidden
          pointer-events-none
          rounded-full
        "
      >

        <motion.div
          initial={{
            x: '-180%',
            opacity: 0,
            rotate: -24,
          }}
          animate={{
            x: '220%',
            opacity: [0, 0.9, 0.9, 0],
          }}
          transition={{
            duration: shineDuration,
            repeat: Infinity,
            repeatDelay: shineDelay,
            ease: 'easeInOut',
          }}
          className="absolute inset-[-30%]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 30%, rgba(255,255,255,0.92) 50%, rgba(255,255,255,0.04) 70%, transparent 100%)',
            filter: isHigh
              ? 'blur(10px)'
              : 'blur(6px)',
            mixBlendMode: 'screen',
          }}
        />

      </div>

      {/* ====================================================== */}
      {/* MICRO ENERGY PARTICLES */}
      {/* ====================================================== */}

      {isHigh && (
        <>
          <motion.div
            animate={{
              y: [0, -10, 0],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeOut',
            }}
            className="absolute top-[15%] right-[18%] w-[3px] h-[3px] rounded-full"
            style={{
              background: '#FFF7CC',
              boxShadow: '0 0 12px rgba(255,255,255,0.8)',
            }}
          />

          <motion.div
            animate={{
              y: [0, -8, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              delay: 1.2,
              ease: 'easeOut',
            }}
            className="absolute bottom-[18%] left-[22%] w-[2px] h-[2px] rounded-full"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 0 10px rgba(255,255,255,0.7)',
            }}
          />
        </>
      )}

    </motion.div>
  );
};

export default GemMotion;
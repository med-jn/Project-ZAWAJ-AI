"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface GemMotionProps {
  children: React.ReactNode;
  level: number;
}

/**
 * GemMotion - المكون المسؤول عن اللمسات الحركية الفاخرة.
 * يجعل الجوهرة "تتنفس" وتلمع بشكل دوري لجذب الانتباه وزيادة القيمة البصرية.
 */
const GemMotion: React.FC<GemMotionProps> = ({ children, level }) => {
  // تحديد قوة التأثير بناءً على فئة المستوى
  const isHighLevel = level >= 40;
  const isMidLevel = level >= 20;

  // 1. إعدادات حركة اللمعان (Shine Sweep)
  // تتحرك من أقصى اليسار إلى أقصى اليمين بزاوية ميلان
  const shineVariants = {
    initial: { x: '-150%', opacity: 0 },
    animate: {
      x: '150%',
      opacity: [0, 1, 1, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        repeatDelay: isHighLevel ? 3 : 5, // الجواهر العليا تلمع بشكل متكرر أكثر
        ease: "easeInOut"
      }
    }
  };

  // 2. إعدادات النبض الهادئ (Subtle Floating)
  const floatingVariants = {
    animate: {
      y: isHighLevel ? [0, -4, 0] : [0, -2, 0], // حركة رأسية خفيفة جداً
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={floatingVariants}
      className="relative flex items-center justify-center"
    >
      {/* عرض الجوهرة الأساسية (GemRenderer) */}
      {children}

      {/* طبقة اللمعان المتحركة (Shine Layer) */}
      {/* نستخدم الـ overflow-hidden لضمان بقاء اللمعان داخل حدود الجوهرة */}
      <div 
        className="absolute inset-0 pointer-events-none overflow-hidden" 
        style={{ maskImage: 'url(#gem-mask)', WebkitMaskImage: 'url(#gem-mask)' }}
      >
        <motion.div
          variants={shineVariants}
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
        />
      </div>

      {/* تأثير الهالة الضوئية الخلفية (Backlight) للمستويات 40+ */}
      {isHighLevel && (
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -z-10 w-full h-full bg-yellow-400/20 blur-2xl rounded-full"
        />
      )}
    </motion.div>
  );
};

export default GemMotion;
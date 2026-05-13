"use client";

import React, {
  useMemo,
} from 'react';

import GemDefinitions from './GemDefinitions';
import GemRenderer from './GemRenderer';
import GemMotion from './GemMotion';

import {
  resolveUserLevel,
} from '@/lib/gems/LevelConfig';

export interface LevelBadgeProps {

  subscribers: number | null;

  className?: string;

  /**
   * حجم النص الأساسي
   * كل شيء يُشتق منه تلقائياً
   */

  scale?: number;

}

/* ====================================================== */
/* COLOR ENGINE */
/* ====================================================== */

const THEMES = {

  /**
   * Crystal Cyan
   * 1 → 9
   */

  tier1: {

    text: 'rgba(230,248,255,0.96)',

    background: 'rgba(7,28,46,0.78)',

    border: 'rgba(96,196,255,0.88)',

    glow: 'rgba(56,189,248,0.42)',

    ambient: 'rgba(125,211,252,0.16)',

  },

  /**
   * Sapphire
   * 10 → 19
   */

  tier2: {

    text: 'rgba(242,248,255,0.97)',

    background: 'rgba(6,18,54,0.80)',

    border: 'rgba(76,133,255,0.90)',

    glow: 'rgba(0,119,255,0.48)',

    ambient: 'rgba(90,170,255,0.18)',

  },

  /**
   * Emerald
   * 20 → 39
   */

  tier3: {

    text: 'rgba(241,255,248,0.98)',

    background: 'rgba(4,34,24,0.80)',

    border: 'rgba(52,211,153,0.88)',

    glow: 'rgba(16,185,129,0.48)',

    ambient: 'rgba(52,211,153,0.18)',

  },

  /**
   * Mythic Gold
   * 40 → 50
   */

  tier4: {

    text: 'rgba(255,245,215,0.99)',

    background: 'rgba(42,24,4,0.82)',

    border: 'rgba(255,210,84,0.92)',

    glow: 'rgba(251,191,36,0.55)',

    ambient: 'rgba(255,215,90,0.18)',

  },

} as const;

/* ====================================================== */
/* COMPONENT */
/* ====================================================== */

const LevelBadge: React.FC<LevelBadgeProps> = ({

  subscribers,

  className = '',

  scale = 16,

}) => {

  /* ==================================================== */
  /* LEVEL */
  /* ==================================================== */

  const safeSubscribers =
    subscribers ?? 0;

  const levelData = useMemo(() => {

    return resolveUserLevel(
      safeSubscribers
    );

  }, [safeSubscribers]);

  const level =
    levelData.levelNumber;

  /* ==================================================== */
  /* TIER */
  /* ==================================================== */

  const theme = useMemo(() => {

    if (level <= 9) {
      return THEMES.tier1;
    }

    if (level <= 19) {
      return THEMES.tier2;
    }

    if (level <= 39) {
      return THEMES.tier3;
    }

    return THEMES.tier4;

  }, [level]);

  /* ==================================================== */
  /* AAA DYNAMIC SIZING SYSTEM */
  /* ==================================================== */

  const ui = useMemo(() => {

    /**
     * كل النظام يُشتق من حجم الخط
     */

    const fontSize =
      scale;

    /**
     * الجوهرة دائماً موازية للنص
     */

    const gemSize =
      fontSize * 1.0;

    /**
     * ارتفاع البادج
     */

    const height =
      gemSize + (fontSize * 0.50);

    /**
     * المسافات الذكية
     */

    const paddingX =
      fontSize * 0.72;

    const gap =
      fontSize * 0.36;

    /**
     * سمك الحدود
     */

    const borderWidth =
      Math.max(
        1.15,
        fontSize * 0.065
      );

    /**
     * radius متناسب
     */

    const radius =
      height * 0.72;

    return {

      fontSize,

      gemSize,

      height,

      paddingX,

      gap,

      borderWidth,

      radius,

    };

  }, [scale]);

  /* ==================================================== */
  /* ELITE */
  /* ==================================================== */

  const elite =
    level >= 40;

  /* ==================================================== */
  /* RENDER */
  /* ==================================================== */

  return (

    <>
      <GemDefinitions />

      <div

        className={`
          relative
          inline-flex
          items-center
          justify-center
          overflow-hidden
          select-none
          shrink-0
          ${className}
        `}

        style={{

          /**
           * Sizing
           */

          height: ui.height,

          paddingLeft: ui.paddingX,

          paddingRight: ui.paddingX,

          gap: ui.gap,

          borderRadius: ui.radius,

          /**
           * Colors
           */

          background: theme.background,

          border: `
            ${ui.borderWidth}px solid ${theme.border}
          `,

          /**
           * Layout
           */

          alignItems: 'center',

          justifyContent: 'center',

          /**
           * Rendering
           */

          boxShadow: `

            inset 0 1px 0 rgba(255,255,255,0.04),

            inset 0 -1px 0 rgba(0,0,0,0.22),

            0 0 0 1px rgba(255,255,255,0.02),

            0 6px 18px rgba(0,0,0,0.28),

            0 0 16px ${theme.glow}

          `,

        }}
      >

        {/* ============================================== */}
        {/* AMBIENT LIGHT */}
        {/* ============================================== */}

        <div

          className="
            absolute
            inset-0
            pointer-events-none
          "

          style={{

            background: `

              radial-gradient(
                circle at top left,
                ${theme.ambient},
                transparent 60%
              )

            `,

          }}
        />

        {/* ============================================== */}
        {/* TOP LIGHT */}
        {/* ============================================== */}

        <div

          className="
            absolute
            left-0
            right-0
            top-0
            pointer-events-none
          "

          style={{

            height: '48%',

            background: `

              linear-gradient(
                180deg,
                rgba(255,255,255,0.09),
                rgba(255,255,255,0)
              )

            `,

          }}
        />

        {/* ============================================== */}
        {/* GEM */}
        {/* ============================================== */}

        <div

          className="
            relative
            flex
            items-center
            justify-center
            shrink-0
          "

          style={{

            width: ui.gemSize,

            height: ui.gemSize,

          }}
        >

          <GemMotion level={level}>

            <GemRenderer

              level={level}

              size={ui.gemSize}

              showGlow

            />

          </GemMotion>

        </div>

        {/* ============================================== */}
        {/* LABEL */}
        {/* ============================================== */}

        <div

          className="
            relative
            flex
            items-center
            justify-center
            shrink-0
          "
        >

          <span

            style={{

              color: theme.text,

              fontSize: ui.fontSize,

              fontWeight: 950,

              lineHeight: 0.9,

              letterSpacing: '-0.035em',

              textRendering: 'geometricPrecision',

              fontVariantNumeric:
                'tabular-nums',

              textShadow: elite

                ? `
                  0 0 10px rgba(255,225,120,0.38)
                `

                : `
                  0 0 8px rgba(255,255,255,0.06)
                `,

            }}
          >
            {levelData.label}
          </span>

        </div>

        {/* ============================================== */}
        {/* CINEMATIC SHEEN */}
        {/* ============================================== */}

        <div

          className="
            absolute
            inset-0
            overflow-hidden
            pointer-events-none
          "
        >

          <div

            className="
              absolute
              inset-[-45%]
              rotate-[16deg]
            "

            style={{

              background: `

                linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(255,255,255,0.02) 38%,
                  rgba(255,255,255,0.16) 50%,
                  rgba(255,255,255,0.02) 62%,
                  transparent 100%
                )

              `,

              filter: 'blur(12px)',

            }}
          />

        </div>

        {/* ============================================== */}
        {/* ELITE AURA */}
        {/* ============================================== */}

        {elite && (

          <div

            className="
              absolute
              inset-[-18%]
              rounded-full
              pointer-events-none
            "

            style={{

              background: `

                radial-gradient(
                  circle,
                  ${theme.glow},
                  transparent 72%
                )

              `,

              opacity: 0.46,

              filter: 'blur(18px)',

            }}
          />

        )}

      </div>
    </>
  );
};

export default LevelBadge;
"use client";

import React, {
  useMemo,
} from 'react';

import {
  motion,
} from 'framer-motion';

import {
  getGemGeometry,
} from '@/lib/gems/GemGeometry';

interface GemRendererProps {

  level: number;

  size?: number;

  showGlow?: boolean;

}

/* ====================================================== */
/* THEMES */
/* ====================================================== */

const THEMES = {

  sky: {

    body:
      '#38BDF8',

    body2:
      '#7DD3FC',

    edge:
      '#E0F2FE',

    facet:
      '#D9F4FF',

    reflection:
      'rgba(255,255,255,0.95)',

    energy:
      'rgba(125,211,252,0.95)',

    glow:
      'rgba(56,189,248,0.55)',

  },

  diamond: {

    body:
      '#3B82F6',

    body2:
      '#60A5FA',

    edge:
      '#EFF6FF',

    facet:
      '#BFDBFE',

    reflection:
      'rgba(255,255,255,0.98)',

    energy:
      'rgba(147,197,253,0.95)',

    glow:
      'rgba(59,130,246,0.58)',

  },

  emerald: {

    body:
      '#10B981',

    body2:
      '#34D399',

    edge:
      '#ECFDF5',

    facet:
      '#A7F3D0',

    reflection:
      'rgba(255,255,255,0.96)',

    energy:
      'rgba(110,231,183,0.92)',

    glow:
      'rgba(16,185,129,0.62)',

  },

  royal: {

    body:
      '#F59E0B',

    body2:
      '#FCD34D',

    edge:
      '#FFF7CC',

    facet:
      '#FFE082',

    reflection:
      'rgba(255,255,255,1)',

    energy:
      'rgba(255,224,130,0.96)',

    glow:
      'rgba(245,158,11,0.72)',

  },

} as const;

/* ====================================================== */
/* COMPONENT */
/* ====================================================== */

const GemRenderer: React.FC<
  GemRendererProps
> = ({

  level,

  size = 26,

  showGlow = true,

}) => {

  /* ==================================================== */
  /* GEOMETRY */
  /* ==================================================== */

  const geometry = useMemo(() => {

    return getGemGeometry(level);

  }, [level]);

  /* ==================================================== */
  /* THEME */
  /* ==================================================== */

  const theme = useMemo(() => {

    if (level <= 9) {
      return THEMES.sky;
    }

    if (level <= 19) {
      return THEMES.diamond;
    }

    if (level <= 39) {
      return THEMES.emerald;
    }

    return THEMES.royal;

  }, [level]);

  /* ==================================================== */
  /* ELITE */
  /* ==================================================== */

  const elite =
    level >= 40;

  /* ==================================================== */
  /* RENDER */
  /* ==================================================== */

  return (

    <div

      className="
        relative
        flex
        items-center
        justify-center
        shrink-0
      "

      style={{

        width: size,

        height: size,

      }}
    >

      {/* ================================================= */}
      {/* CINEMATIC GLOW */}
      {/* ================================================= */}

      {showGlow && (

        <motion.div

          animate={{

            scale:
              elite
                ? [1, 1.18, 1]
                : [1, 1.08, 1],

            opacity:
              elite
                ? [0.65, 1, 0.65]
                : [0.45, 0.8, 0.45],

          }}

          transition={{

            duration:
              elite
                ? 2.8
                : 4.2,

            repeat: Infinity,

            ease: 'easeInOut',

          }}

          className="
            absolute
            inset-[-24%]
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

            filter:
              elite
                ? 'blur(18px)'
                : 'blur(10px)',

          }}
        />

      )}

      {/* ================================================= */}
      {/* SVG */}
      {/* ================================================= */}

      <svg

        viewBox="0 0 100 100"

        className="
          relative
          z-[2]
          w-full
          h-full
          overflow-visible
        "
      >

        <defs>

          {/* ============================================= */}
          {/* BODY */}
          {/* ============================================= */}

          <linearGradient
            id={`body-${level}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >

            <stop
              offset="0%"
              stopColor={theme.body2}
            />

            <stop
              offset="42%"
              stopColor={theme.body}
            />

            <stop
              offset="100%"
              stopColor="#071018"
            />

          </linearGradient>

          {/* ============================================= */}
          {/* SPECULAR */}
          {/* ============================================= */}

          <linearGradient
            id={`specular-${level}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >

            <stop
              offset="0%"
              stopColor="rgba(255,255,255,0)"
            />

            <stop
              offset="45%"
              stopColor="rgba(255,255,255,0)"
            />

            <stop
              offset="52%"
              stopColor="rgba(255,255,255,0.95)"
            />

            <stop
              offset="58%"
              stopColor="rgba(255,255,255,0)"
            />

            <stop
              offset="100%"
              stopColor="rgba(255,255,255,0)"
            />

          </linearGradient>

          {/* ============================================= */}
          {/* INNER LIGHT */}
          {/* ============================================= */}

          <radialGradient
            id={`inner-${level}`}
            cx="35%"
            cy="25%"
            r="80%"
          >

            <stop
              offset="0%"
              stopColor="rgba(255,255,255,0.95)"
            />

            <stop
              offset="30%"
              stopColor="rgba(255,255,255,0.35)"
            />

            <stop
              offset="100%"
              stopColor="rgba(255,255,255,0)"
            />

          </radialGradient>

        </defs>

        {/* =============================================== */}
        {/* SHADOW */}
        {/* =============================================== */}

        <path

          d={geometry.outerPath}

          transform="translate(0 4)"

          fill="rgba(0,0,0,0.42)"
        />

        {/* =============================================== */}
        {/* BODY */}
        {/* =============================================== */}

        <path

          d={geometry.outerPath}

          fill={`url(#body-${level})`}

          style={{

            filter:

              elite

                ? `
                  drop-shadow(
                    0 0 12px
                    ${theme.glow}
                  )
                `

                : `
                  drop-shadow(
                    0 0 7px
                    ${theme.glow}
                  )
                `,

          }}
        />

        {/* =============================================== */}
        {/* INNER LIGHT */}
        {/* =============================================== */}

        <path

          d={geometry.outerPath}

          fill={`url(#inner-${level})`}

          opacity={0.92}
        />

        {/* =============================================== */}
        {/* FACETS */}
        {/* =============================================== */}

        {geometry.facetPaths.map(
          (
            facet,
            index
          ) => (

            <path

              key={`facet-${index}`}

              d={facet}

              fill="none"

              stroke={theme.facet}

              strokeWidth={
                elite
                  ? 1.4
                  : 1.05
              }

              strokeOpacity={
                0.72 +
                (
                  (index % 3)
                  * 0.08
                )
              }

              strokeLinecap="round"

              strokeLinejoin="round"
            />

          )
        )}

        {/* =============================================== */}
        {/* REFLECTIONS */}
        {/* =============================================== */}

        {geometry.reflectionPaths.map(
          (
            reflection,
            index
          ) => (

            <motion.path

              key={`reflection-${index}`}

              d={reflection}

              fill="none"

              stroke={theme.reflection}

              strokeWidth={
                elite
                  ? 1.2
                  : 0.8
              }

              strokeOpacity={
                elite
                  ? 0.95
                  : 0.72
              }

              strokeLinecap="round"

              animate={{

                opacity:
                  elite

                    ? [0.2, 1, 0.2]

                    : [0.15, 0.7, 0.15],

              }}

              transition={{

                duration:
                  2.2 +
                  index,

                repeat:
                  Infinity,

                ease:
                  'easeInOut',

              }}
            />

          )
        )}

        {/* =============================================== */}
        {/* ENERGY */}
        {/* =============================================== */}

        {geometry.energyPaths.map(
          (
            energy,
            index
          ) => (

            <motion.path

              key={`energy-${index}`}

              d={energy}

              fill="none"

              stroke={theme.energy}

              strokeWidth={
                elite
                  ? 0.9
                  : 0.65
              }

              strokeOpacity={
                elite
                  ? 0.8
                  : 0.55
              }

              strokeLinecap="round"

              animate={{

                opacity:
                  elite

                    ? [0.15, 1, 0.15]

                    : [0.08, 0.7, 0.08],

              }}

              transition={{

                duration:
                  1.6 +
                  (
                    index * 0.18
                  ),

                repeat:
                  Infinity,

                ease:
                  'linear',

              }}
            />

          )
        )}

        {/* =============================================== */}
        {/* HIGHLIGHTS */}
        {/* =============================================== */}

        {geometry.highlightPaths.map(
          (
            highlight,
            index
          ) => (

            <path

              key={`highlight-${index}`}

              d={highlight}

              fill="none"

              stroke="rgba(255,255,255,0.95)"

              strokeWidth={
                elite
                  ? 1.1
                  : 0.85
              }

              strokeOpacity={
                elite
                  ? 0.92
                  : 0.7
              }

              strokeLinecap="round"
            />

          )
        )}

        {/* =============================================== */}
        {/* EDGE */}
        {/* =============================================== */}

        <path

          d={geometry.outerPath}

          fill="none"

          stroke={theme.edge}

          strokeWidth={
            elite
              ? 2.2
              : 1.8
          }

          strokeOpacity={0.95}
        />

        {/* =============================================== */}
        {/* INNER EDGE */}
        {/* =============================================== */}

        <path

          d={geometry.outerPath}

          fill="none"

          stroke="rgba(255,255,255,0.26)"

          strokeWidth={0.8}
        />

        {/* =============================================== */}
        {/* MOVING SPECULAR */}
        {/* =============================================== */}

        <motion.path

          d={geometry.outerPath}

          fill={`url(#specular-${level})`}

          animate={{

            opacity:
              elite

                ? [0, 1, 0]

                : [0, 0.75, 0],

          }}

          transition={{

            duration:
              elite
                ? 2.5
                : 4.5,

            repeat:
              Infinity,

            ease:
              'easeInOut',

          }}
        />

      </svg>

    </div>

  );

};

export default GemRenderer;
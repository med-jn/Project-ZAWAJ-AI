import React from 'react';

/**
 * AAA Gem Definitions
 * Cinematic Materials & Lighting System
 */

const GemDefinitions: React.FC = () => {

  return (

    <svg
      width="0"
      height="0"
      style={{
        position: 'absolute',
      }}
      aria-hidden
    >

      <defs>

        {/* ====================================================== */}
        {/* ====================================================== */}
        {/* TIER 1 — CRYSTAL CYAN */}
        {/* ====================================================== */}
        {/* ====================================================== */}

        <radialGradient
          id="aaa-gem-tier-1"
          cx="30%"
          cy="25%"
          r="80%"
        >

          <stop
            offset="0%"
            stopColor="#F0FDFF"
          />

          <stop
            offset="18%"
            stopColor="#D7F7FF"
          />

          <stop
            offset="40%"
            stopColor="#7DD3FC"
          />

          <stop
            offset="68%"
            stopColor="#38BDF8"
          />

          <stop
            offset="100%"
            stopColor="#0F3E67"
          />

        </radialGradient>

        {/* ====================================================== */}
        {/* TIER 2 — ROYAL SAPPHIRE */}
        {/* ====================================================== */}

        <radialGradient
          id="aaa-gem-tier-2"
          cx="30%"
          cy="22%"
          r="85%"
        >

          <stop
            offset="0%"
            stopColor="#F5FBFF"
          />

          <stop
            offset="12%"
            stopColor="#CFEFFF"
          />

          <stop
            offset="34%"
            stopColor="#4CC9FF"
          />

          <stop
            offset="60%"
            stopColor="#0077FF"
          />

          <stop
            offset="100%"
            stopColor="#001B44"
          />

        </radialGradient>

        {/* ====================================================== */}
        {/* TIER 3 — EMERALD */}
        {/* ====================================================== */}

        <radialGradient
          id="aaa-gem-tier-3"
          cx="30%"
          cy="20%"
          r="90%"
        >

          <stop
            offset="0%"
            stopColor="#F1FFF9"
          />

          <stop
            offset="15%"
            stopColor="#B7FFD8"
          />

          <stop
            offset="40%"
            stopColor="#34D399"
          />

          <stop
            offset="68%"
            stopColor="#059669"
          />

          <stop
            offset="100%"
            stopColor="#022C22"
          />

        </radialGradient>

        {/* ====================================================== */}
        {/* TIER 4 — ROYAL GOLD */}
        {/* ====================================================== */}

        <radialGradient
          id="aaa-gem-tier-4"
          cx="32%"
          cy="22%"
          r="90%"
        >

          <stop
            offset="0%"
            stopColor="#FFFDF5"
          />

          <stop
            offset="10%"
            stopColor="#FFF4C7"
          />

          <stop
            offset="30%"
            stopColor="#FDE68A"
          />

          <stop
            offset="55%"
            stopColor="#FBBF24"
          />

          <stop
            offset="75%"
            stopColor="#D97706"
          />

          <stop
            offset="100%"
            stopColor="#4A2200"
          />

        </radialGradient>

        {/* ====================================================== */}
        {/* DIAMOND REFLECTION */}
        {/* ====================================================== */}

        <linearGradient
          id="aaa-gem-reflection"
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
            offset="38%"
            stopColor="rgba(255,255,255,0)"
          />

          <stop
            offset="50%"
            stopColor="rgba(255,255,255,0.95)"
          />

          <stop
            offset="62%"
            stopColor="rgba(255,255,255,0)"
          />

          <stop
            offset="100%"
            stopColor="rgba(255,255,255,0)"
          />

        </linearGradient>

        {/* ====================================================== */}
        {/* TOP SPECULAR */}
        {/* ====================================================== */}

        <linearGradient
          id="aaa-gem-specular"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >

          <stop
            offset="0%"
            stopColor="rgba(255,255,255,0.75)"
          />

          <stop
            offset="18%"
            stopColor="rgba(255,255,255,0.25)"
          />

          <stop
            offset="100%"
            stopColor="rgba(255,255,255,0)"
          />

        </linearGradient>

        {/* ====================================================== */}
        {/* INNER DEPTH */}
        {/* ====================================================== */}

        <radialGradient
          id="aaa-gem-depth"
          cx="50%"
          cy="70%"
          r="80%"
        >

          <stop
            offset="0%"
            stopColor="rgba(0,0,0,0)"
          />

          <stop
            offset="100%"
            stopColor="rgba(0,0,0,0.45)"
          />

        </radialGradient>

        {/* ====================================================== */}
        {/* SOFT GLOW */}
        {/* ====================================================== */}

        <filter
          id="aaa-gem-soft-glow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >

          <feGaussianBlur
            stdDeviation="2.6"
            result="blur"
          />

          <feMerge>

            <feMergeNode in="blur" />

            <feMergeNode in="SourceGraphic" />

          </feMerge>

        </filter>

        {/* ====================================================== */}
        {/* MYTHIC BLOOM */}
        {/* ====================================================== */}

        <filter
          id="aaa-gem-bloom"
          x="-200%"
          y="-200%"
          width="500%"
          height="500%"
        >

          <feGaussianBlur
            stdDeviation="4.2"
            result="blur"
          />

          <feColorMatrix
            in="blur"
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 18 -8
            "
            result="bloom"
          />

          <feMerge>

            <feMergeNode in="bloom" />

            <feMergeNode in="SourceGraphic" />

          </feMerge>

        </filter>

        {/* ====================================================== */}
        {/* INNER SHADOW */}
        {/* ====================================================== */}

        <filter
          id="aaa-gem-inner-shadow"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
        >

          <feOffset
            dx="0"
            dy="1"
          />

          <feGaussianBlur
            stdDeviation="1.4"
            result="offset-blur"
          />

          <feComposite
            operator="out"
            in="SourceGraphic"
            in2="offset-blur"
            result="inverse"
          />

          <feFlood
            floodColor="#000000"
            floodOpacity="0.45"
            result="shadow"
          />

          <feComposite
            operator="in"
            in="shadow"
            in2="inverse"
            result="shadow"
          />

          <feComposite
            operator="over"
            in="shadow"
            in2="SourceGraphic"
          />

        </filter>

        {/* ====================================================== */}
        {/* CRYSTAL SHARPEN */}
        {/* ====================================================== */}

        <filter
          id="aaa-gem-crystal"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >

          <feSpecularLighting
            result="specOut"
            specularExponent="18"
            lightingColor="#FFFFFF"
          >

            <fePointLight
              x="-50"
              y="-80"
              z="200"
            />

          </feSpecularLighting>

          <feComposite
            in="specOut"
            in2="SourceAlpha"
            operator="in"
            result="specOut"
          />

          <feBlend
            in="SourceGraphic"
            in2="specOut"
            mode="screen"
          />

        </filter>

      </defs>

    </svg>
  );
};

export default GemDefinitions;
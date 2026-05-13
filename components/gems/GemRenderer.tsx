import React, { useMemo } from 'react';

import { getGemGeometry } from '@/lib/gems/GemGeometry';

interface GemRendererProps {
  level: number;
  size?: number;
  className?: string;
  showGlow?: boolean;
}

/**
 * AAA Gem Renderer
 * Cinematic Production Renderer
 */

const GemRenderer: React.FC<GemRendererProps> = ({
  level,
  size = 100,
  className = '',
  showGlow = true,
}) => {

  /* ====================================================== */
  /* TIER */
  /* ====================================================== */

  const tier = useMemo(() => {

    if (level <= 9) {
      return 1;
    }

    if (level <= 19) {
      return 2;
    }

    if (level <= 39) {
      return 3;
    }

    return 4;

  }, [level]);

  /* ====================================================== */
  /* GEOMETRY */
  /* ====================================================== */

  const geometry = useMemo(() => {
    return getGemGeometry(level);
  }, [level]);

  /* ====================================================== */
  /* COLORS */
  /* ====================================================== */

  const colors = useMemo(() => {

    /**
     * Crystal Cyan
     */

    if (tier === 1) {

      return {

        edge: '#D8F7FF',

        facet: 'rgba(255,255,255,0.16)',

        wire: 'rgba(220,245,255,0.42)',

        glow: 'rgba(56,189,248,0.45)',

      };
    }

    /**
     * Sapphire
     */

    if (tier === 2) {

      return {

        edge: '#F0FBFF',

        facet: 'rgba(255,255,255,0.18)',

        wire: 'rgba(180,230,255,0.55)',

        glow: 'rgba(0,119,255,0.52)',

      };
    }

    /**
     * Emerald
     */

    if (tier === 3) {

      return {

        edge: '#F0FFF7',

        facet: 'rgba(255,255,255,0.20)',

        wire: 'rgba(220,255,235,0.52)',

        glow: 'rgba(16,185,129,0.52)',

      };
    }

    /**
     * Mythic Gold
     */

    return {

      edge: '#FFF6D7',

      facet: 'rgba(255,255,255,0.24)',

      wire: 'rgba(255,240,190,0.62)',

      glow: 'rgba(251,191,36,0.70)',

    };

  }, [tier]);

  /* ====================================================== */
  /* FILTER */
  /* ====================================================== */

  const filter = useMemo(() => {

    if (!showGlow) {
      return 'none';
    }

    if (tier === 4) {
      return 'url(#aaa-gem-bloom)';
    }

    return 'url(#aaa-gem-soft-glow)';

  }, [showGlow, tier]);

  /* ====================================================== */
  /* UNIQUE SIGNATURE */
  /* ====================================================== */

  const uniqueIntensity = (
    (level % 10) + 1
  ) / 10;

  /* ====================================================== */
  /* RENDER */
  /* ====================================================== */

  return (

    <div
      className={`
        relative
        inline-flex
        items-center
        justify-center
        ${className}
      `}
      style={{
        width: size,
        height: size,
      }}
    >

      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        style={{
          filter,
        }}
      >

        {/* ================================================== */}
        {/* BACK GLOW */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill={colors.glow}
          opacity={
            tier === 4
              ? 0.34
              : 0.18
          }
          transform="scale(1.05) translate(-2.4 -2.4)"
          filter="blur(8px)"
        />

        {/* ================================================== */}
        {/* BASE SHADOW */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill="rgba(0,0,0,0.45)"
          transform="translate(0 3)"
          opacity="0.45"
          filter="blur(4px)"
        />

        {/* ================================================== */}
        {/* MAIN BODY */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill={`url(#aaa-gem-tier-${tier})`}
          filter="
            url(#aaa-gem-inner-shadow)
          "
        />

        {/* ================================================== */}
        {/* DEPTH */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill="url(#aaa-gem-depth)"
          opacity="0.9"
        />

        {/* ================================================== */}
        {/* FACETS */}
        {/* ================================================== */}

        {geometry.facetPaths.map((facet, index) => (

          <path
            key={`facet-${index}`}
            d={facet}
            fill="none"
            stroke={colors.facet}
            strokeWidth={
              0.6 +
              uniqueIntensity * 0.6
            }
            opacity={
              0.55 +
              uniqueIntensity * 0.25
            }
          />

        ))}

        {/* ================================================== */}
        {/* INTERNAL WIRES */}
        {/* ================================================== */}

        {geometry.edgePaths.map((line, index) => (

          <path
            key={`edge-${index}`}
            d={line}
            fill="none"
            stroke={colors.wire}
            strokeWidth={
              level >= 40
                ? 0.75
                : 0.55
            }
            strokeLinecap="round"
            opacity={
              0.22 +
              uniqueIntensity * 0.42
            }
          />

        ))}

        {/* ================================================== */}
        {/* CORE */}
        {/* ================================================== */}

        {geometry.corePath && (

          <path
            d={geometry.corePath}
            fill="rgba(255,255,255,0.08)"
            stroke={colors.edge}
            strokeWidth="0.9"
            opacity="0.95"
          />

        )}

        {/* ================================================== */}
        {/* TOP SPECULAR */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill="url(#aaa-gem-specular)"
          opacity={
            0.35 +
            uniqueIntensity * 0.4
          }
        />

        {/* ================================================== */}
        {/* CINEMATIC REFLECTION */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill="url(#aaa-gem-reflection)"
          opacity={
            tier >= 3
              ? 0.55
              : 0.35
          }
        />

        {/* ================================================== */}
        {/* PREMIUM EDGE */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill="none"
          stroke={colors.edge}
          strokeWidth={
            level >= 40
              ? 1.8
              : 1.15
          }
          opacity="0.95"
        />

        {/* ================================================== */}
        {/* INNER EDGE */}
        {/* ================================================== */}

        <path
          d={geometry.outerPath}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="0.5"
          opacity="0.55"
          transform="scale(0.96) translate(2 2)"
        />

      </svg>

    </div>
  );
};

export default GemRenderer;
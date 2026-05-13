"use client";

import React from 'react';

import {
  LevelBadge,
  LEVEL_MAP,
} from '@/components/gems';

/**
 * Levels Showcase Page
 * AAA Production Version
 */

const LevelsPage = () => {

  /* ====================================================== */
  /* SORTED LEVELS */
  /* ====================================================== */

  const allLevels = Object
    .values(LEVEL_MAP)
    .sort((a, b) => a.levelNumber - b.levelNumber);

  /* ====================================================== */
  /* TIERS */
  /* ====================================================== */

  const tiers = [

    {
      title: 'Crystal Initiates',
      range: [1, 9],
      color: '#7DD3FC',
      glow: 'rgba(56,189,248,0.30)',
    },

    {
      title: 'Sapphire Division',
      range: [10, 19],
      color: '#38BDF8',
      glow: 'rgba(14,165,233,0.35)',
    },

    {
      title: 'Royal Amethyst',
      range: [20, 39],
      color: '#E879F9',
      glow: 'rgba(192,38,211,0.35)',
    },

    {
      title: 'Mythic Ascension',
      range: [40, 50],
      color: '#FBBF24',
      glow: 'rgba(245,158,11,0.40)',
    },

  ];

  /* ====================================================== */
  /* HELPERS */
  /* ====================================================== */

  const getTierBackground = (level: number) => {

    if (level <= 9) {
      return `
        radial-gradient(circle at top left,
          rgba(56,189,248,0.12),
          transparent 60%
        )
      `;
    }

    if (level <= 19) {
      return `
        radial-gradient(circle at top left,
          rgba(14,165,233,0.14),
          transparent 60%
        )
      `;
    }

    if (level <= 39) {
      return `
        radial-gradient(circle at top left,
          rgba(192,38,211,0.14),
          transparent 60%
        )
      `;
    }

    return `
      radial-gradient(circle at top left,
        rgba(245,158,11,0.18),
        transparent 60%
      )
    `;
  };

  /* ====================================================== */
  /* RENDER */
  /* ====================================================== */

  return (

    <div
      className="
        min-h-screen
        overflow-hidden
        text-white
      "
      style={{
        background: `
          radial-gradient(circle at top,
            #2a0b35 0%,
            #130714 25%,
            #070707 60%,
            #020202 100%
          )
        `,
      }}
    >

      {/* ====================================================== */}
      {/* GLOBAL ENERGY */}
      {/* ====================================================== */}

      <div
        className="
          fixed
          inset-0
          pointer-events-none
          overflow-hidden
        "
      >

        <div
          className="
            absolute
            top-[-200px]
            left-1/2
            -translate-x-1/2
            w-[900px]
            h-[900px]
            rounded-full
            blur-3xl
            opacity-20
          "
          style={{
            background: `
              radial-gradient(circle,
                rgba(217,70,239,0.40),
                transparent 70%
              )
            `,
          }}
        />

      </div>

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header
        className="
          relative
          max-w-7xl
          mx-auto
          px-6
          pt-24
          pb-20
          text-center
        "
      >

        <h1
          className="
            text-5xl
            md:text-7xl
            font-black
            tracking-tight
          "
          style={{
            background: `
              linear-gradient(
                180deg,
                #FFFFFF 0%,
                #E879F9 100%
              )
            `,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          نظام رتب الوسطاء
        </h1>

        <p
          className="
            mt-7
            text-gray-400
            max-w-3xl
            mx-auto
            text-lg
            leading-8
          "
        >
          50 مستوى فريد بتصميم بصري AAA
          يعتمد على تطور هندسي وإضاءة سينمائية مستوحاة
          من أنظمة الرتب الأسطورية الحديثة.
        </p>

      </header>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <main
        className="
          relative
          max-w-7xl
          mx-auto
          px-6
          pb-32
          space-y-28
        "
      >

        {tiers.map((tier) => (

          <section
            key={tier.title}
            className="space-y-10"
          >

            {/* ================================================== */}
            {/* SECTION TITLE */}
            {/* ================================================== */}

            <div className="flex items-center gap-5">

              <div
                className="h-[2px] w-10 rounded-full"
                style={{
                  background: tier.color,
                  boxShadow: `0 0 16px ${tier.glow}`,
                }}
              />

              <h2
                className="
                  text-3xl
                  md:text-4xl
                  font-black
                  tracking-tight
                "
                style={{
                  color: tier.color,
                  textShadow: `0 0 18px ${tier.glow}`,
                }}
              >
                {tier.title}
              </h2>

              <div
                className="
                  h-px
                  flex-1
                "
                style={{
                  background: `
                    linear-gradient(
                      90deg,
                      rgba(255,255,255,0.15),
                      transparent
                    )
                  `,
                }}
              />

            </div>

            {/* ================================================== */}
            {/* LEVELS GRID */}
            {/* ================================================== */}

            <div
              className="
                grid
                grid-cols-2
                md:grid-cols-3
                lg:grid-cols-5
                gap-7
              "
            >

              {allLevels
                .filter(level =>
                  level.levelNumber >= tier.range[0] &&
                  level.levelNumber <= tier.range[1]
                )
                .map((level) => (

                  <div
                    key={level.key}
                    className="
                      relative
                      overflow-hidden
                      rounded-[30px]
                      border
                      border-white/10
                      backdrop-blur-xl
                      transition-all
                      duration-500
                      hover:scale-[1.035]
                      hover:border-white/20
                      group
                    "
                    style={{

                      background: `
                        linear-gradient(
                          180deg,
                          rgba(255,255,255,0.05) 0%,
                          rgba(255,255,255,0.02) 100%
                        )
                      `,

                      boxShadow: `
                        inset 0 1px 0 rgba(255,255,255,0.05),
                        0 12px 40px rgba(0,0,0,0.45)
                      `,
                    }}
                  >

                    {/* ========================================== */}
                    {/* ENERGY BACKGROUND */}
                    {/* ========================================== */}

                    <div
                      className="
                        absolute
                        inset-0
                        opacity-0
                        group-hover:opacity-100
                        transition-opacity
                        duration-700
                        pointer-events-none
                      "
                      style={{
                        background: getTierBackground(level.levelNumber),
                      }}
                    />

                    {/* ========================================== */}
                    {/* TOP SHINE */}
                    {/* ========================================== */}

                    <div
                      className="
                        absolute
                        top-0
                        left-0
                        right-0
                        h-[35%]
                        pointer-events-none
                      "
                      style={{
                        background: `
                          linear-gradient(
                            180deg,
                            rgba(255,255,255,0.08),
                            transparent
                          )
                        `,
                      }}
                    />

                    {/* ========================================== */}
                    {/* CONTENT */}
                    {/* ========================================== */}

                    <div
                      className="
                        relative
                        p-6
                        flex
                        flex-col
                        items-center
                        gap-5
                      "
                    >

                      {/* ====================================== */}
                      {/* BADGE */}
                      {/* ====================================== */}

                      <LevelBadge
                        subscribers={level.minSubscribers}
                        size="lg"
                      />

                      {/* ====================================== */}
                      {/* LEVEL NUMBER */}
                      {/* ====================================== */}

                      <div className="text-center">

                        <p
                          className="
                            text-[10px]
                            tracking-[0.28em]
                            uppercase
                            text-gray-500
                            mb-2
                          "
                        >
                          LEVEL
                        </p>

                        <h3
                          className="
                            text-4xl
                            font-black
                          "
                        >
                          {level.levelNumber}
                        </h3>

                      </div>

                      {/* ====================================== */}
                      {/* SUB REQUIREMENT */}
                      {/* ====================================== */}

                      <div className="text-center">

                        <p
                          className="
                            text-[10px]
                            tracking-[0.25em]
                            uppercase
                            text-gray-500
                            mb-2
                          "
                        >
                          Subscribers
                        </p>

                        <p
                          className="
                            text-xl
                            font-black
                            text-white
                          "
                        >
                          {level.minSubscribers.toLocaleString()}
                        </p>

                      </div>

                      {/* ====================================== */}
                      {/* TECH DATA */}
                      {/* ====================================== */}

                      <div
                        className="
                          mt-1
                          flex
                          items-center
                          gap-2
                          flex-wrap
                          justify-center
                        "
                      >

                        <span
                          className="
                            text-[10px]
                            px-2
                            py-1
                            rounded-full
                            border
                            border-white/10
                            bg-white/[0.03]
                            text-gray-300
                          "
                        >
                          Geometry {level.sides}
                        </span>

                        <span
                          className="
                            text-[10px]
                            px-2
                            py-1
                            rounded-full
                            border
                            border-white/10
                            bg-white/[0.03]
                            text-gray-300
                          "
                        >
                          Complexity {level.complexity}
                        </span>

                      </div>

                    </div>

                  </div>

                ))}

            </div>

          </section>

        ))}

      </main>

    </div>
  );
};

export default LevelsPage;
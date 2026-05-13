/**
 * AAA GEM GEOMETRY ENGINE
 * نظام هندسي متعدد الطبقات
 * كل مستوى يملك شخصية بصرية مستقلة
 */

export interface Point {

  x: number;
  y: number;

}

export interface GemPathData {

  outerPath: string;

  /**
   * الخطوط البنيوية الأساسية
   */

  facetPaths: string[];

  /**
   * الانعكاسات الداخلية
   */

  reflectionPaths: string[];

  /**
   * مسارات الطاقة
   */

  energyPaths: string[];

  /**
   * خطوط اللمعان
   */

  highlightPaths: string[];

}

/* ====================================================== */
/* HELPERS */
/* ====================================================== */

const polar = (
  cx: number,
  cy: number,
  radius: number,
  angle: number
): Point => ({

  x: cx + radius * Math.cos(angle),

  y: cy + radius * Math.sin(angle),

});

const pathFromPoints = (
  points: Point[]
): string => {

  return points
    .map((p, i) => {

      return `
        ${i === 0 ? 'M' : 'L'}
        ${p.x}
        ${p.y}
      `;

    })
    .join(' ') + ' Z';

};

/* ====================================================== */
/* OUTER SHAPES */
/* ====================================================== */

const buildOuterPoints = (
  level: number,
  radius: number,
): Point[] => {

  const cx = 50;
  const cy = 50;

  /**
   * 1 → 9
   * Triangle
   */

  if (level <= 9) {

    return [

      polar(
        cx,
        cy,
        radius,
        -Math.PI / 2
      ),

      polar(
        cx,
        cy,
        radius,
        Math.PI / 6
      ),

      polar(
        cx,
        cy,
        radius,
        Math.PI - Math.PI / 6
      ),

    ];

  }

  /**
   * 10 → 19
   * Diamond
   */

  if (level <= 19) {

    return [

      polar(
        cx,
        cy,
        radius,
        -Math.PI / 2
      ),

      polar(
        cx,
        cy,
        radius * 0.72,
        0
      ),

      polar(
        cx,
        cy,
        radius,
        Math.PI / 2
      ),

      polar(
        cx,
        cy,
        radius * 0.72,
        Math.PI
      ),

    ];

  }

  /**
   * 20 → 39
   * Superman Emerald Crystal
   */

  if (level <= 39) {

    return [

      { x: 50, y: 6 },

      { x: 87, y: 30 },

      { x: 74, y: 82 },

      { x: 50, y: 95 },

      { x: 26, y: 82 },

      { x: 13, y: 30 },

    ];

  }

  /**
   * 40 → 50
   * Perfect Hexagon
   */

  return Array.from(
    { length: 6 },
    (_, i) => {

      const angle =
        (-Math.PI / 2) +
        (i * Math.PI / 3);

      return polar(
        cx,
        cy,
        radius,
        angle
      );

    }
  );

};

/* ====================================================== */
/* UNIQUE BASE PATTERN */
/* ====================================================== */

const createPattern = (
  level: number,
  points: Point[]
): string => {

  let p = '';

  /**
   * كل مستوى يملك seed مختلف
   */

  const seed =
    level * 13.37;

  points.forEach((a, i) => {

    const next =
      points[
        (i + 1) % points.length
      ];

    const skip =
      points[
        (i + 2) % points.length
      ];

    /**
     * Core Facets
     */

    p += `

      M ${a.x} ${a.y}
      L ${skip.x} ${skip.y}

    `;

    /**
     * Inner crystal cuts
     */

    const mixX =
      (a.x + next.x) / 2;

    const mixY =
      (a.y + next.y) / 2;

    const depth =
      18 + (
        (Math.sin(seed + i) + 1)
        * 8
      );

    p += `

      M ${mixX} ${mixY}
      Q 50 ${depth}
        ${50 + (50 - mixX)}
        ${50 + (50 - mixY)}

    `;

  });

  /**
   * مستويات أعلى = هندسة أكثر تعقيداً
   */

  const rings =
    Math.floor(level / 4);

  for (
    let i = 1;
    i <= rings;
    i++
  ) {

    const r =
      38 - (i * 4);

    const ring = Array.from(
      { length: points.length },
      (_, idx) => {

        const angle =
          (-Math.PI / 2) +
          (
            idx *
            (
              Math.PI * 2 /
              points.length
            )
          );

        return polar(
          50,
          50,
          r,
          angle
        );

      }
    );

    p += pathFromPoints(ring);

  }

  /**
   * elite core
   */

  if (level >= 40) {

    p += `

      M 50 22
      L 74 50
      L 50 78
      L 26 50
      Z

    `;

  }

  return p;

};

/* ====================================================== */
/* MAIN */
/* ====================================================== */

export const getGemGeometry = (
  level: number,
  radius: number = 42
): GemPathData => {

  const points =
    buildOuterPoints(
      level,
      radius
    );

  const basePattern =
    createPattern(
      level,
      points
    );

  /* ==================================================== */
  /* FACETS */
  /* ==================================================== */

  const facetPaths = [

    basePattern,

  ];

  /**
   * اختلاف جذري بين المستويات
   */

  if (level % 2 === 0) {

    facetPaths.push(`

      M 50 12
      L 72 50
      L 50 88

    `);

  }

  if (level % 3 === 0) {

    facetPaths.push(`

      M 28 50
      Q 50 18
        72 50

    `);

  }

  if (level % 5 === 0) {

    facetPaths.push(`

      M 34 34
      L 66 66

      M 66 34
      L 34 66

    `);

  }

  /* ==================================================== */
  /* REFLECTIONS */
  /* ==================================================== */

  const reflectionPaths: string[] = [];

  const reflections =
    1 + Math.floor(level / 6);

  for (
    let i = 0;
    i < reflections;
    i++
  ) {

    const y =
      22 + (i * 8);

    reflectionPaths.push(`

      M 30 ${y}
      Q 50 ${y - 10}
        70 ${y}

    `);

  }

  /**
   * elite
   */

  if (level >= 45) {

    reflectionPaths.push(`

      M 24 60
      Q 50 34
        76 60

    `);

  }

  /* ==================================================== */
  /* ENERGY */
  /* ==================================================== */

  const energyPaths: string[] = [];

  const energyComplexity =
    Math.floor(level / 2);

  for (
    let i = 0;
    i < energyComplexity;
    i++
  ) {

    const offset =
      18 + (i * 3);

    const arc =
      20 + (
        Math.sin(i + level)
        * 12
      );

    energyPaths.push(`

      M ${offset} 50
      Q 50 ${arc}
        ${100 - offset} 50

    `);

  }

  /**
   * mythic pulse
   */

  if (level >= 40) {

    energyPaths.push(`

      M 50 14
      Q 62 50
        50 86

      Q 38 50
        50 14

    `);

  }

  /* ==================================================== */
  /* HIGHLIGHTS */
  /* ==================================================== */

  const highlightPaths: string[] = [];

  /**
   * تختلف حسب المستوى
   */

  const highlights =
    1 + Math.floor(level / 8);

  for (
    let i = 0;
    i < highlights;
    i++
  ) {

    const y =
      20 + (i * 10);

    highlightPaths.push(`

      M 34 ${y}
      Q 50 ${y - 8}
        66 ${y}

    `);

  }

  if (level >= 25) {

    highlightPaths.push(`

      M 26 44
      Q 50 22
        74 44

    `);

  }

  if (level >= 40) {

    highlightPaths.push(`

      M 28 70
      Q 50 88
        72 70

    `);

  }

  return {

    outerPath:
      pathFromPoints(points),

    facetPaths,

    reflectionPaths,

    energyPaths,

    highlightPaths,

  };

};
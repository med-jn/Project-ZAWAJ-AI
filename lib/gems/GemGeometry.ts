/**
 * AAA Gem Geometry Engine
 * الجيل السينمائي النهائي للجواهر
 */

export interface Point {
  x: number;
  y: number;
}

export interface GemGeometryData {
  outerPath: string;
  facetPaths: string[];
  edgePaths: string[];
  corePath?: string;
}

/* ====================================================== */
/* HELPERS */
/* ====================================================== */

const CENTER = 50;

const polarToCartesian = (
  radius: number,
  angle: number
): Point => {

  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
};

const buildPath = (points: Point[]): string => {

  return (
    points
      .map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`
      )
      .join(' ') + ' Z'
  );
};

const linePath = (a: Point, b: Point): string => {
  return `M ${a.x.toFixed(3)} ${a.y.toFixed(3)} L ${b.x.toFixed(3)} ${b.y.toFixed(3)}`;
};

/* ====================================================== */
/* OUTER SHAPES */
/* ====================================================== */

const generateOuterPoints = (level: number): Point[] => {

  /**
   * 1 → 9
   * Triangle
   */
  if (level <= 9) {

    return [
      polarToCartesian(44, -Math.PI / 2),
      polarToCartesian(44, (2 * Math.PI) / 3 - Math.PI / 2),
      polarToCartesian(44, (4 * Math.PI) / 3 - Math.PI / 2),
    ];
  }

  /**
   * 10 → 19
   * Diamond
   */
  if (level <= 19) {

    return [
      { x: 50, y: 4 },
      { x: 92, y: 50 },
      { x: 50, y: 96 },
      { x: 8, y: 50 },
    ];
  }

  /**
   * 20 → 39
   * Superman Crystal
   */
  if (level <= 39) {

    return [
      { x: 20, y: 20 },
      { x: 50, y: 6 },
      { x: 80, y: 20 },
      { x: 92, y: 55 },
      { x: 50, y: 94 },
      { x: 8, y: 55 },
    ];
  }

  /**
   * 40 → 50
   * Perfect Hexagon
   */

  const points: Point[] = [];

  for (let i = 0; i < 6; i++) {

    const angle =
      -Math.PI / 2 +
      (i * Math.PI) / 3;

    points.push(
      polarToCartesian(44, angle)
    );
  }

  return points;
};

/* ====================================================== */
/* FACET ENGINE */
/* ====================================================== */

const generateFacetSystem = (
  level: number,
  points: Point[]
): {
  facets: string[];
  edges: string[];
  core?: string;
} => {

  const facets: string[] = [];
  const edges: string[] = [];

  const complexity = Math.min(
    10,
    Math.max(
      1,
      level
    )
  );

  /**
   * المركز
   */

  const center: Point = {
    x: CENTER,
    y: CENTER,
  };

  /* ====================================================== */
  /* RADIAL CUTS */
  /* ====================================================== */

  points.forEach((p) => {
    edges.push(
      linePath(center, p)
    );
  });

  /* ====================================================== */
  /* EDGE LINKS */
  /* ====================================================== */

  for (let i = 0; i < points.length; i++) {

    const a = points[i];

    for (
      let step = 2;
      step <= Math.min(complexity, points.length);
      step++
    ) {

      const b =
        points[
          (i + step) % points.length
        ];

      edges.push(
        linePath(a, b)
      );
    }
  }

  /* ====================================================== */
  /* INTERNAL RINGS */
  /* ====================================================== */

  const ringCount =
    Math.floor(level / 5);

  for (
    let ring = 1;
    ring <= ringCount;
    ring++
  ) {

    const radius =
      44 - ring * 6.5;

    const innerPoints: Point[] = [];

    for (
      let i = 0;
      i < points.length;
      i++
    ) {

      const angle =
        Math.atan2(
          points[i].y - CENTER,
          points[i].x - CENTER
        );

      innerPoints.push(
        polarToCartesian(
          radius,
          angle
        )
      );
    }

    facets.push(
      buildPath(innerPoints)
    );

    /**
     * وصلات بلورية
     */

    innerPoints.forEach((p, i) => {

      edges.push(
        linePath(
          p,
          points[i]
        )
      );
    });
  }

  /* ====================================================== */
  /* LEVEL UNIQUE SIGNATURES */
  /* ====================================================== */

  /**
   * كل مستوى يحصل على pattern مختلف
   */

  const signature = level % 5;

  /**
   * STAR CUT
   */

  if (signature === 0) {

    for (
      let i = 0;
      i < points.length;
      i++
    ) {

      const next =
        points[
          (i + 2) % points.length
        ];

      edges.push(
        linePath(
          points[i],
          next
        )
      );
    }
  }

  /**
   * INNER STAR
   */

  if (signature === 1) {

    const mini: Point[] = [];

    points.forEach((p) => {

      mini.push({
        x: CENTER + (p.x - CENTER) * 0.45,
        y: CENTER + (p.y - CENTER) * 0.45,
      });
    });

    facets.push(
      buildPath(mini)
    );
  }

  /**
   * TRI CUTS
   */

  if (signature === 2) {

    points.forEach((p, i) => {

      const next =
        points[
          (i + 1) % points.length
        ];

      const mid: Point = {
        x: (p.x + next.x) / 2,
        y: (p.y + next.y) / 2,
      };

      edges.push(
        linePath(center, mid)
      );
    });
  }

  /**
   * CRYSTAL GRID
   */

  if (signature === 3) {

    for (
      let i = 0;
      i < points.length;
      i++
    ) {

      const a = points[i];

      const b =
        points[
          (i + 3) % points.length
        ];

      edges.push(
        linePath(a, b)
      );
    }
  }

  /**
   * DIAMOND CORE
   */

  if (signature === 4) {

    const corePoints: Point[] = [];

    for (
      let i = 0;
      i < points.length;
      i++
    ) {

      const angle =
        Math.atan2(
          points[i].y - CENTER,
          points[i].x - CENTER
        );

      corePoints.push(
        polarToCartesian(
          14,
          angle
        )
      );
    }

    return {
      facets,
      edges,
      core: buildPath(corePoints),
    };
  }

  return {
    facets,
    edges,
  };
};

/* ====================================================== */
/* MAIN ENGINE */
/* ====================================================== */

export const getGemGeometry = (
  level: number
): GemGeometryData => {

  const outerPoints =
    generateOuterPoints(level);

  const outerPath =
    buildPath(outerPoints);

  const {
    facets,
    edges,
    core,
  } = generateFacetSystem(
    level,
    outerPoints
  );

  return {
    outerPath,
    facetPaths: facets,
    edgePaths: edges,
    corePath: core,
  };
};
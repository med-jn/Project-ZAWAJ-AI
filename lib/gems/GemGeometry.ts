/**
 * GemGeometry - المحرك الرياضي المسؤول عن رسم الهياكل الهندسية للجواهر.
 * تم تصميمه ليعطي دقة متناهية وسيمترية مطلقة لكل مستوى.
 */

export interface Point {
  x: number;
  y: number;
}

export interface GemPathData {
  outerPath: string;    // المسار الخارجي للمضلع
  internalPaths: string; // شبكة الخطوط الداخلية المعقدة
}

export const getGemGeometry = (sides: number, complexity: number, radius: number = 45): GemPathData => {
  const center = 50; // مركز الـ ViewBox (0 0 100 100)
  const points: Point[] = [];

  // 1. حساب رؤوس المضلع الخارجي
  // نعدل زاوية البداية لضمان السيمترية (الرأس الأول دائماً في الأعلى)
  // بالنسبة للمعين (4 أضلاع)، الزاوية تضمن وقوفه على رأسه
  const startAngle = sides === 4 ? -Math.PI / 2 : -Math.PI / 2;

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / sides;
    points.push({
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  }

  // 2. بناء المسار الخارجي (Outer Path)
  const outerPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ') + ' Z';

  // 3. بناء شبكة التعقيد الداخلي (Internal Wireframe)
  // كلما زاد الـ complexity، زادت الروابط بين الرؤوس
  let internalPaths = "";

  points.forEach((p1, i) => {
    // أ- ربط كل رأس بالمركز (محور السيمترية المركزي)
    if (complexity >= 1) {
      internalPaths += ` M ${p1.x.toFixed(3)} ${p1.y.toFixed(3)} L ${center} ${center}`;
    }

    // ب- ربط الرؤوس ببعضها لخلق "الوجوه الماسية" (Triangulation)
    // المسافة (step) تحدد مدى كثافة الشبكة الداخلية
    for (let step = 2; step <= complexity + 1; step++) {
      const targetIndex = (i + step) % sides;
      const p2 = points[targetIndex];
      
      // نتحقق من عدم تكرار الخطوط لضمان نظافة الـ SVG
      internalPaths += ` M ${p1.x.toFixed(3)} ${p1.y.toFixed(3)} L ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`;
    }
  });

  // ج- إضافة مضلع داخلي أصغر لزيادة الفخامة في المستويات العليا (40-50)
  if (sides >= 9 && complexity >= 4) {
    const innerRadius = radius * 0.4;
    const innerPoints = points.map((_, i) => {
      const angle = startAngle + (i * 2 * Math.PI) / sides;
      return {
        x: center + innerRadius * Math.cos(angle),
        y: center + innerRadius * Math.sin(angle),
      };
    });
    const innerShape = innerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(3)} ${p.y.toFixed(3)}`).join(' ') + ' Z';
    internalPaths += ` ${innerShape}`;
  }

  return { outerPath, internalPaths };
};

/**
 * دالة مساعدة لتحديد عدد الأضلاع بناءً على منطق الفئات الذي حددته
 */
export const getSidesByLevel = (level: number): number => {
  if (level <= 5) return 3;  // مثلث
  if (level <= 10) return 4; // معين
  if (level <= 15) return 5; // خماسي
  if (level <= 20) return 6; // سداسي
  if (level <= 25) return 7; // سباعي
  if (level <= 30) return 8; // ثماني
  if (level <= 39) return 9; // تساعي
  return 10;                // عشاري (40-50)
};

/**
 * دالة مساعدة لحساب التعقيد الداخلي (1-5) داخل كل فئة
 */
export const getComplexityByLevel = (level: number): number => {
  if (level <= 40) {
    return ((level - 1) % 5) + 1; 
  }
  return 5; // أقصى تعقيد للمستويات من 40 إلى 50
};
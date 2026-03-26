interface LoveCoinProps {
  size?: number
  className?: string
}

export const LoveCoin = ({ size = 24, className = "" }: LoveCoinProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24" // استخدام viewBox قياسي مطابق لمكتبة Lucide لضمان التوسط
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`love-coin ${className}`}
    >
      <defs>
        {/* التدرج الذهبي المعتمد في مشروعك (Gold Metallic) */}
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7a5c00" />
          <stop offset="25%" stopColor="#c9a227" />
          <stop offset="45%" stopColor="#ffd700" />
          <stop offset="55%" stopColor="#fff4b0" />
          <stop offset="75%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#6b5100" />
        </linearGradient>

        {/* لمعان خفيف جداً للحواف */}
        <filter id="lightGlow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* 1. الدائرة الخارجية (جسم العملة) */}
      <circle 
        cx="12" 
        cy="12" 
        r="11" 
        fill="url(#goldGradient)" 
        stroke="#5e3e02" 
        strokeWidth="0.5" 
      />

      {/* 2. حلقة داخلية تعطي عمق (Bevel) */}
      <circle 
        cx="12" 
        cy="12" 
        r="9" 
        fill="none" 
        stroke="#ffffff" 
        strokeOpacity="0.2" 
        strokeWidth="0.5" 
      />

      {/* 3. قلب Lucide في المركز تماماً (نقش ذهبي متدرج) */}
      {/* تم أخذ الـ Path مباشرة من أيقونة Heart في Lucide */}
      <path
        d="M19 14c1.49-1.46 3-1.9 4.5-1.9 2.5 0 4.5 2 4.5 4.5s-1.93 3.3-3.08 4.75L19 28l-5.92-6.65C11.93 19.9 10 18.15 10 15.65 10 13.15 12 11.15 14.5 11.15c1.5 0 3.01.44 4.5 1.9Z"
        transform="translate(12, 12.5) scale(0.45) translate(-19, -20.5)"
        stroke="url(#goldGradient)" 
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="rgba(0,0,0,0.15)" /* ظل خفيف جداً داخل النقش ليبدو محفوراً */
      />

      {/* 4. لمعة انعكاس (Shine) */}
      <path
        d="M4 8C4 8 7 5 12 5C17 5 20 8 20 8"
        stroke="white"
        strokeOpacity="0.3"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
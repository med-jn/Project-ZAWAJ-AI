interface LoveCoinProps {
  size?: number
  className?: string
}

export const LoveCoin = ({ size = 24, className = "" }: LoveCoinProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={`love-coin ${className}`}
    >

      <defs>

        {/* الذهب الواقعي */}
        <radialGradient id="coinGold" cx="35%" cy="30%">
          <stop offset="0%" stopColor="#fff7c2"/>
          <stop offset="35%" stopColor="#ffd65a"/>
          <stop offset="65%" stopColor="#e6b325"/>
          <stop offset="100%" stopColor="#8a5c07"/>
        </radialGradient>

        {/* لمعان العملة */}
        <linearGradient id="coinShine" x1="0%" x2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* ظل داخلي */}
        <filter id="coinShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4"/>
        </filter>

      </defs>

      {/* جسم العملة */}
      <circle
        cx="60"
        cy="60"
        r="54"
        fill="url(#coinGold)"
        stroke="#6d4a06"
        strokeWidth="4"
        filter="url(#coinShadow)"
      />

      {/* الحافة الداخلية */}
      <circle
        cx="60"
        cy="60"
        r="44"
        fill="none"
        stroke="#f3c544"
        strokeWidth="4"
      />

      {/* نقش القلب */}
      <path
        d="
        M60 78
        L38 55
        A12 12 0 0 1 60 40
        A12 12 0 0 1 82 55
        Z
        "
        fill="#b8860b"
        stroke="#7a5208"
        strokeWidth="3"
      />

      {/* لمعان */}
      <rect
        x="-120"
        y="0"
        width="120"
        height="120"
        fill="url(#coinShine)"
        className="coin-shine"
      />

    </svg>
  )
}
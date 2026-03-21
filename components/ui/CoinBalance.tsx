import { LoveCoin } from "./LoveCoin"

interface CoinBalanceProps {
  amount: number
  className?: string
  iconSize?: number
}

export const CoinBalance = ({
  amount,
  className = "",
  iconSize = 26
}: CoinBalanceProps) => {

  return (

    <div className={`flex items-center gap-2 font-bold ${className}`}>

      <LoveCoin size={iconSize} />

      <span className="tabular-nums text-yellow-300 tracking-wide">
        {amount.toLocaleString()}
      </span>

    </div>

  )
}
import { LoveCoin } from "./LoveCoin"

interface CoinBalanceProps {
  amount: number
  className?: string
  iconSize?: number
}

export const CoinBalance = ({
  amount,
  className = "",
  iconSize = 20
}: CoinBalanceProps) => {

  return (

    <div className={`flex items-center gap-2 font-bold ${className}`}>


      <span className="tabular-nums 'var(--text-primary)' text-2xl tracking-wide">
        {amount.toLocaleString()}
      </span>
       <LoveCoin size={iconSize} />


    </div>

  )
}
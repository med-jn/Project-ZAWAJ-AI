import { Coins } from 'lucide-react';

interface CoinBalanceProps {
  amount: number;
  className?: string;
  iconSize?: number;
}

export const CoinBalance = ({ amount, className = "", iconSize = 18 }: CoinBalanceProps) => {
  return (
    <div className={`flex items-center gap-2 font-bold ${className}`}>
      {/* الأيقونة البصرية */}
      <Coins 
        size={iconSize} 
        className="text-yellow-500 fill-yellow-500/20" // لون ذهبي مع تعبئة خفيفة
      />
      {/* الرقم */}
      <span className="tabular-nums">
        {amount.toLocaleString()} 
      </span>
    </div>
  );
};
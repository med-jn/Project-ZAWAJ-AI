import { CoinBalance } from './CoinBalance';
import { getEconomyErrorMessage } from '@/utils/economyErrors';

interface EconomyModalProps {
  isOpen: boolean;
  type: 'reward' | 'low_balance' | 'confirm';
  amount?: number;
  onClose: () => void;
  onAction?: () => void; // للذهاب للمتجر أو تأكيد الخصم
}

export const EconomyModal = ({ isOpen, type, amount, onClose, onAction }: EconomyModalProps) => {
  if (!isOpen) return null;

  // إذا كان النوع "رصيد منخفض"، نسحب البيانات من مترجم الأخطاء
  const errorData = type === 'low_balance' ? getEconomyErrorMessage('low_balance') : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in duration-300">
        
        {/* أيقونة العملة الكبيرة في الأعلى */}
        <div className="flex justify-center mb-4">
          <div className="bg-yellow-100 p-4 rounded-full">
             <CoinBalance amount={amount || 0} iconSize={32} className="text-2xl text-yellow-700" />
          </div>
        </div>

        <h3 className="text-xl font-bold mb-2">
          {type === 'reward' ? 'مبروك! هدية لك' : errorData?.title || 'تنبيه'}
        </h3>
        
        <p className="text-gray-600 mb-6">
          {type === 'reward' 
            ? `لقد حصلت على ${amount} نقطة مجانية لنشاطك الرائع!` 
            : errorData?.message}
        </p>

        <div className="flex flex-col gap-2">
          <button 
            onClick={onAction || onClose}
            className="bg-primary text-white font-bold py-3 rounded-2xl hover:bg-primary/90 transition-all"
          >
            {type === 'low_balance' ? 'شحن رصيد الآن' : 'رائع، شكراً'}
          </button>
          
          <button onClick={onClose} className="text-gray-400 text-sm py-2">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
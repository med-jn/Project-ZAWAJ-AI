'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react'; // أيقونات للجمالية

interface MatchProps {
  userImg: string;
  partnerImg: string;
  isOpen: boolean;
  onClose: () => void;
  onChat: () => void;
}

export const MatchCelebration = ({ userImg, partnerImg, isOpen, onClose, onChat }: MatchProps) => {
  
  // تفعيل الاهتزاز عند لحظة التماس
  useEffect(() => {
    if (isOpen) {
      const hapticTimer = setTimeout(() => {
        if (typeof window !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 150]); // نمط اهتزاز "نبض القلب" عند الالتصاق
        }
      }, 600); // يتزامن مع وصول الأنيميشن للمركز
      return () => clearTimeout(hapticTimer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
        >
          {/* الخلفية الزجاجية المتكيفة (Glassmorphism) */}
          <div className="absolute inset-0 backdrop-blur-2xl bg-white/30 dark:bg-black/70 shadow-inner" />

          {/* محتوى النافذة الرئيسي */}
          <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
            
            {/* زر الإغلاق العلوي */}
            <button 
              onClick={onClose}
              className="absolute top-0 right-8 p-2 rounded-full bg-black/10 dark:bg-white/10 text-black dark:text-white"
            >
              <X size={20} />
            </button>

            {/* العنوان الاحتفالي بخط فاخر وتدرج ذهبي */}
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-500 to-yellow-800 drop-shadow-sm">
                توافق مثالي!
              </h2>
              <p className="text-black/60 dark:text-white/60 font-medium mt-2">لقد وجدتم نصفكم الآخر</p>
            </motion.div>

            {/* منطقة التصادم الرسومية */}
            <div className="relative flex items-center justify-center w-full h-48 mb-20">
              
              {/* هالة ضوئية خلفية تنبض */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl"
              />

              {/* صورة المستخدم (اليسار) */}
              <motion.div 
                initial={{ x: -250, opacity: 0, rotate: -20 }}
                animate={{ x: -25, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: "circOut" }}
                className="relative w-36 h-36 rounded-full border-[5px] border-yellow-500/80 shadow-[0_0_40px_rgba(234,179,8,0.4)] overflow-hidden bg-gray-100 z-20"
              >
                <img 
                  src={userImg} 
                  className="w-full h-full object-cover object-[center_20%]" // التمركز العلوي للوجه
                  alt="You"
                />
              </motion.div>

              {/* صورة الشريك (اليمين) */}
              <motion.div 
                initial={{ x: 250, opacity: 0, rotate: 20 }}
                animate={{ x: 25, opacity: 1, rotate: 0 }}
                transition={{ duration: 0.7, ease: "circOut" }}
                className="relative w-36 h-36 rounded-full border-[5px] border-yellow-500/80 shadow-[0_0_40px_rgba(234,179,8,0.4)] overflow-hidden bg-gray-100 z-20"
              >
                <img 
                  src={partnerImg} 
                  className="w-full h-full object-cover object-[center_20%]" // التمركز العلوي للوجه
                  alt="Match"
                />
              </motion.div>

              {/* شعاع ذهبي عند لحظة الالتحام */}
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.8, opacity: [0, 1, 0] }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-20 h-20 bg-yellow-400 rounded-full blur-xl" />
              </motion.div>
            </div>

            {/* أزرار الإجراءات - فخمة بلمسة عصرية */}
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="w-full space-y-4 px-4"
            >
              <button 
                onClick={onChat}
                className="w-full group relative flex items-center justify-center gap-3 bg-gradient-to-r from-yellow-700 via-yellow-500 to-yellow-700 text-black font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(202,138,4,0.3)] active:scale-95 transition-all overflow-hidden"
              >
                <MessageCircle fill="black" size={24} />
                <span className="text-xl">ابدأ المحادثة الآن</span>
                {/* تأثير لمعان يتحرك فوق الزر */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              </button>

              <button 
                onClick={onClose}
                className="w-full py-2 text-black/50 dark:text-white/50 font-bold hover:text-black dark:hover:text-white transition-colors"
              >
                ربما لاحقاً
              </button>
            </motion.div>

          </div>
        </motion.div>
      )}

      {/* إضافة CSS خاص بأنيميشن اللمعان في ملف globals.css أو داخل style tag */}
      <style jsx>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </AnimatePresence>
  );
};
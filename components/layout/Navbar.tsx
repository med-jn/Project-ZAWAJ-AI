'use client';
import { motion } from 'framer-motion';
import { Home, Heart, Bell, User, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onTabClick: (tab: string) => void;
  notifCount?: number;
}

export default function Navbar({ activeTab, onTabClick, notifCount = 0 }: NavbarProps) {
  
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
  };

  // الترتيب: من اليمين إلى اليسار
  const tabs = [
    { id: 'profile',       label: 'حسابي',    icon: User },
    { id: 'notifications', label: 'إشعارات',  icon: Bell, hasBadge: true },
    { id: 'mediator',      label: 'الوسيط',   icon: ShieldCheck, isCenter: true },
    { id: 'likes',         label: 'إعجابات',  icon: Heart },
    { id: 'home',          label: 'الرئيسية', icon: Home },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-[1000] h-[65px] border-t border-white/5 flex justify-around items-center px-4"
      style={{ backgroundColor: '#0D0008' }}
      dir="rtl"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        if (tab.isCenter) {
          return (
            <div key={tab.id} className="relative -top-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => { onTabClick(tab.id); triggerHaptic(); }}
                className="w-14 h-14 rounded-[18px] bg-[#B2002D] flex items-center justify-center border-[2px] border-black shadow-xl"
              >
                <Icon size={26} className="text-white" fill={isActive ? 'white' : 'none'} strokeWidth={2.5} />
              </motion.button>
            </div>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => { onTabClick(tab.id); triggerHaptic(); }}
            className="flex flex-col items-center justify-center flex-1 h-full relative"
          >
            <div className="relative">
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Icon
                  size={22}
                  className={isActive ? 'text-white' : 'text-white/60'}
                  fill={isActive ? 'white' : 'none'}
                  strokeWidth={2}
                />
              </motion.div>

              {tab.hasBadge && notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#B2002D] rounded-full text-[8px] font-bold flex items-center justify-center text-white border border-[#0D0008]">
                  {notifCount}
                </span>
              )}
            </div>

            <span className={`text-[8px] mt-0.5 font-bold transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
'use client';
/**
 * 📁 app/share/page.tsx — ZAWAJ AI
 *
 * الصفحة الوسيطة للمشاركة — تعمل هكذا:
 * 1. المشاركة تُرسل: https://zawaj.orcaup.com/share?id=USER_ID
 * 2. عند فتحه في المتصفح/Telegram تظهر هذه الصفحة
 * 3. تحاول فوراً فتح: zawaj://app/view?id=USER_ID
 * 4. إذا فتح التطبيق ✅ — إذا لم يكن مثبتاً تظهر أزرار التحميل
 *
 * ✅ إذا كان التطبيق مثبتاً وتم إعداد autoVerify صح
 *    فإن Android يفتح التطبيق مباشرة بدون ظهور هذه الصفحة أصلاً.
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams }               from 'next/navigation';
import { motion, AnimatePresence }       from 'framer-motion';

// ── أيقونة Android بسيطة ─────────────────────────────────────
function AndroidIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M17.523 15.341A5.5 5.5 0 0 0 17.5 15a5.5 5.5 0 0 0-11 0 5.5 5.5 0 0 0-.023.341A2 2 0 0 0 5 17v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a2 2 0 0 0-1.477-1.659zM9 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM8.5 8.634l-1.545-2.68a.5.5 0 1 1 .866-.5L9.366 8.1A5.98 5.98 0 0 1 12 7.5a5.98 5.98 0 0 1 2.634.6l1.545-2.646a.5.5 0 1 1 .866.5L15.5 8.634A5.99 5.99 0 0 1 18 13.5H6a5.99 5.99 0 0 1 2.5-4.866z"/>
    </svg>
  );
}

function ShareContent() {
  const searchParams = useSearchParams();
  const userId       = searchParams.get('id') ?? '';

  const [attempted, setAttempted] = useState(false);
  const [failed,    setFailed]    = useState(false);

  const customScheme = `zawaj://app/view?id=${userId}`;
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.zawaj.ai';

  // ── محاولة فتح التطبيق فور تحميل الصفحة ─────────────────
  useEffect(() => {
    if (!userId) return;

    // انتظر قليلاً حتى يتحمل DOM
    const timer = setTimeout(() => {
      setAttempted(true);

      // حاول فتح التطبيق عبر Custom Scheme
      window.location.href = customScheme;

      // بعد 2.5 ثانية — إذا لا تزال الصفحة مفتوحة = التطبيق غير مثبت
      setTimeout(() => {
        setFailed(true);
      }, 2500);
    }, 300);

    return () => clearTimeout(timer);
  }, [userId, customScheme]);

  const handleOpenApp = () => {
    window.location.href = customScheme;
    setTimeout(() => setFailed(true), 2500);
  };

  if (!userId) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#080008',
        color: 'rgba(255,255,255,0.5)', fontFamily: 'Cairo, sans-serif',
        direction: 'rtl', textAlign: 'center', padding: 24,
      }}>
        رابط غير صالح
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(179,51,75,0.4) 0%, #080008 65%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      fontFamily: "'Cairo', sans-serif",
      direction: 'rtl',
    }}>

      {/* Logo / Brand */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: 40, textAlign: 'center' }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'linear-gradient(145deg,#c8002c,#8a0018)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 12px 40px rgba(192,0,42,0.5)',
        }}>
          {/* قلب بسيط */}
          <svg width={40} height={40} viewBox="0 0 24 24" fill="#fff" stroke="none">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        </div>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, margin: '0 0 6px' }}>
          زواج AI
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0 }}>
          منصة الزواج الجاد
        </p>
      </motion.div>

      {/* البطاقة الرئيسية */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 280, damping: 24 }}
        style={{
          width: '100%', maxWidth: 360,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 28,
          padding: '28px 24px',
          backdropFilter: 'blur(16px)',
          textAlign: 'center',
        }}
      >
        {!failed ? (
          <>
            {/* حالة المحاولة */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{
                width: 48, height: 48, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: '#B3334B',
                margin: '0 auto 20px',
              }}
            />
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 10px' }}>
              {attempted ? 'جاري فتح التطبيق...' : 'تحضير الرابط...'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              إذا لم يفتح التطبيق تلقائياً، اضغط الزر أدناه
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleOpenApp}
              style={{
                width: '100%', padding: '14px 0',
                borderRadius: 16, border: 'none',
                background: 'linear-gradient(135deg,#800020,#B3334B)',
                color: '#fff', fontWeight: 800, fontSize: 16,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 8px 24px rgba(179,51,75,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <AndroidIcon />
              افتح في التطبيق
            </motion.button>
          </>
        ) : (
          <>
            {/* حالة الفشل — التطبيق غير مثبت */}
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(179,51,75,0.12)',
                  border: '1px solid rgba(179,51,75,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                }}>
                  <AndroidIcon />
                </div>

                <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 20, margin: '0 0 10px' }}>
                  التطبيق غير مثبت
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
                  ثبّت تطبيق زواج AI لتتمكن من مشاهدة هذا الملف الشخصي والتواصل مع أصحابه
                </p>

                {/* زر تحميل */}
                <motion.a
                  whileTap={{ scale: 0.95 }}
                  href={playStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    width: '100%', padding: '14px 0',
                    borderRadius: 16,
                    background: 'linear-gradient(135deg,#800020,#B3334B)',
                    color: '#fff', fontWeight: 800, fontSize: 16,
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(179,51,75,0.4)',
                    marginBottom: 12,
                  }}
                >
                  {/* Google Play icon */}
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M3 20.5v-17c0-.83.94-1.3 1.6-.8l14 8.5a1 1 0 0 1 0 1.6l-14 8.5c-.66.5-1.6.03-1.6-.8z"/>
                  </svg>
                  تحميل من Google Play
                </motion.a>

                {/* زر محاولة مرة أخرى */}
                <button
                  onClick={() => { setFailed(false); handleOpenApp(); }}
                  style={{
                    width: '100%', padding: '12px 0',
                    borderRadius: 16,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.6)',
                    fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  حاول مرة أخرى
                </button>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 32, textAlign: 'center' }}
      >
        © 2026 زواج AI — منصة الزواج الجاد
      </motion.p>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#080008',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#B3334B',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
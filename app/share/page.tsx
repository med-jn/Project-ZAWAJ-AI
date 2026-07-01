'use client';
/**
 * 📁 app/share/page.tsx — ZAWAJ AI
 *
 * الصفحة الوسيطة للمشاركة — تعمل هكذا:
 *
 * 1. المشاركة تُرسل: https://zawaj.orcaup.com/share?id=USER_ID
 *
 * 2. ✅ الحالة المثالية (وهي الأغلبية على أندرويد):
 *    بما أن AndroidManifest يحتوي intent-filter مع autoVerify="true"
 *    لـ https://zawaj.orcaup.com/share* + assetlinks.json منشور صح،
 *    فإن أندرويد يفتح التطبيق مباشرة على مستوى النظام
 *    قبل حتى ما يوصل هذا الرابط لمتصفح — هذي الصفحة ما تظهر إطلاقاً.
 *
 * 3. هذي الصفحة تشتغل فقط كخط دفاع ثاني (fallback) في الحالات:
 *    - المستخدم فاتح الرابط من متصفح داخلي (Telegram / Instagram / إلخ)
 *      ما يدعم Android App Links
 *    - تحقق App Link فشل (شهادة تغيرت، تأخير انتشار...)
 *    - التطبيق غير مثبت أصلاً
 *
 * 4. الحل هنا: Intent URL (الطريقة الرسمية لكروم/أندرويد) بدل تخمين
 *    بـ setTimeout — المتصفح نفسه يتكفل بفتح التطبيق أو الرجوع لمتجر
 *    Play تلقائياً عبر S.browser_fallback_url، بدون حاجة نحزر إذا نجح
 *    أو فشل. نضيف زر يدوي + مؤقت أمان بسيط فقط لتغطية المتصفحات
 *    غير الكرومية إلي ما تدعم intent://.
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams }               from 'next/navigation';
import { motion, AnimatePresence }       from 'framer-motion';

const PACKAGE_NAME    = 'com.zawaj.ai';
const PLAY_STORE_URL  = 'https://play.google.com/store/apps/details?id=com.zawaj.ai';
const APP_LOGO        = '/icons/icon-512x512.png';

// ── أيقونة Android بسيطة (تستخدم فقط كزخرفة داخل الأزرار) ──
function AndroidIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M17.523 15.341A5.5 5.5 0 0 0 17.5 15a5.5 5.5 0 0 0-11 0 5.5 5.5 0 0 0-.023.341A2 2 0 0 0 5 17v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a2 2 0 0 0-1.477-1.659zM9 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm6 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM8.5 8.634l-1.545-2.68a.5.5 0 1 1 .866-.5L9.366 8.1A5.98 5.98 0 0 1 12 7.5a5.98 5.98 0 0 1 2.634.6l1.545-2.646a.5.5 0 1 1 .866.5L15.5 8.634A5.99 5.99 0 0 1 18 13.5H6a5.99 5.99 0 0 1 2.5-4.866z"/>
    </svg>
  );
}

function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

// بعض المتصفحات داخل التطبيقات (Telegram / Instagram / Facebook in-app
// webview) لا تدعم intent:// إطلاقاً، فيها لازم fallback يدوي أسرع.
function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /FBAN|FBAV|Instagram|Telegram|Line|Twitter/i.test(navigator.userAgent);
}

function buildIntentUrl(userId: string) {
  // انتبه: browser_fallback_url هو المسؤول عن الرجوع للمتجر تلقائياً
  // لو التطبيق غير مثبت — المتصفح (كروم) يتكفل بهذا بدون أي كود منا.
  const fallback = encodeURIComponent(PLAY_STORE_URL);
  return `intent://app/view?id=${encodeURIComponent(userId)}#Intent;scheme=zawaj;package=${PACKAGE_NAME};S.browser_fallback_url=${fallback};end`;
}

function buildCustomSchemeUrl(userId: string) {
  return `zawaj://app/view?id=${encodeURIComponent(userId)}`;
}

function ShareContent() {
  const searchParams = useSearchParams();
  const userId       = searchParams.get('id') ?? '';

  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const android  = isAndroidDevice();
    const inApp    = isInAppBrowser();

    // متصفح داخلي (Telegram/Instagram) لا يدعم intent:// — اعرض
    // زر التحميل فوراً بدل ما ننتظر محاولة راح تفشل بصمت.
    if (inApp || !android) {
      setShowFallback(true);
      return;
    }

    const timer = setTimeout(() => {
      // Intent URL: كروم بيحاول يفتح التطبيق، ولو فشل بيرجع تلقائياً
      // لـ browser_fallback_url (متجر Play) — بدون أي تدخل منا.
      window.location.href = buildIntentUrl(userId);

      // شبكة أمان فقط: لو لأي سبب المتصفح ما نفذ الـ intent
      // (متصفح غير معروف)، نعرض زر يدوي بعد فترة قصيرة.
      setTimeout(() => setShowFallback(true), 2000);
    }, 250);

    return () => clearTimeout(timer);
  }, [userId]);

  const handleManualOpen = () => {
    if (isAndroidDevice() && !isInAppBrowser()) {
      window.location.href = buildIntentUrl(userId);
    } else {
      window.location.href = buildCustomSchemeUrl(userId);
    }
    setTimeout(() => setShowFallback(true), 1500);
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
          width: 84, height: 84, borderRadius: 24,
          overflow: 'hidden',
          margin: '0 auto 16px',
          boxShadow: '0 12px 40px rgba(192,0,42,0.5)',
        }}>
          <img
            src={APP_LOGO}
            alt="زواج AI"
            width={84}
            height={84}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          />
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
        {!showFallback ? (
          <>
            {/* حالة المحاولة — جارٍ تحويل المستخدم للتطبيق */}
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
              جاري فتح التطبيق...
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6, margin: '0 0 24px' }}>
              إذا لم يفتح التطبيق تلقائياً، اضغط الزر أدناه
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleManualOpen}
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
            {/* حالة الـ fallback — التطبيق غير مثبت أو المتصفح لا يدعم الفتح التلقائي */}
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
                  href={PLAY_STORE_URL}
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

                {/* زر محاولة فتح التطبيق مرة أخرى (لمن ثبّته للتو) */}
                <button
                  onClick={handleManualOpen}
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
                  ثبّتّه؟ افتح التطبيق الآن
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
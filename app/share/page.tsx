'use client';
/**
 * 📁 app/share/page.tsx — ZAWAJ AI
 *
 * الصفحة الوسيطة للمشاركة:
 * 1) على أندرويد + رابط App Link موثّق (autoVerify) → التطبيق يفتح
 *    مباشرة على مستوى النظام، وهذي الصفحة لا تظهر إطلاقاً.
 * 2) هذي الصفحة تشتغل فقط كخط دفاع ثانٍ: متصفح داخلي (Telegram/
 *    Instagram) لا يدعم App Links، تحقق فشل، أو التطبيق غير مثبت.
 * 3) تستخدم Intent URL (وليس تخمين بـ setTimeout) — المتصفح نفسه
 *    يرجع تلقائياً لمتجر Play عبر browser_fallback_url لو فشل الفتح.
 *
 * التصميم يعتمد بالكامل على نظام الألوان في globals.css (CSS
 * variables) بدل ألوان يدوية، حتى يتكيف تلقائياً مع الوضع الليلي/
 * النهاري ويبقى متسق مع باقي التطبيق.
 */

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams }               from 'next/navigation';
import { motion }                        from 'framer-motion';
import Footer                            from '@/components/layout/Footer';

const PACKAGE_NAME    = 'com.zawaj.ai';
const PLAY_STORE_URL  = 'https://play.google.com/store/apps/details?id=com.zawaj.ai';
const APP_LOGO        = '/icons/icon-512x512.png';
const DEVELOPER_NAME  = 'ORCAUP';

function isAndroidDevice() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

// متصفحات داخل التطبيقات (Telegram/Instagram/Facebook) لا تدعم
// intent:// إطلاقاً — لازم تعرض زر التحميل فوراً بدل انتظار فشل أكيد.
function isInAppBrowser() {
  if (typeof navigator === 'undefined') return false;
  return /FBAN|FBAV|Instagram|Telegram|Line|Twitter/i.test(navigator.userAgent);
}

function buildIntentUrl(userId: string) {
  const fallback = encodeURIComponent(PLAY_STORE_URL);
  return `intent://app/view?id=${encodeURIComponent(userId)}#Intent;scheme=zawaj;package=${PACKAGE_NAME};S.browser_fallback_url=${fallback};end`;
}

function buildCustomSchemeUrl(userId: string) {
  return `zawaj://app/view?id=${encodeURIComponent(userId)}`;
}

// أيقونة تشغيل أحادية اللون (currentColor) — بديل نظيف ومحترف
// لأيقونة Google Play الملونة، تتكيف تلقائياً مع أي خلفية.
function PlayIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M4 3.5v17a1 1 0 0 0 1.5.87l14-8.5a1 1 0 0 0 0-1.74l-14-8.5A1 1 0 0 0 4 3.5z" />
    </svg>
  );
}

function ShareContent() {
  const searchParams = useSearchParams();
  const userId       = searchParams.get('id') ?? '';

  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const android = isAndroidDevice();
    const inApp   = isInAppBrowser();

    if (inApp || !android) {
      setShowFallback(true);
      return;
    }

    const timer = setTimeout(() => {
      // كروم يتكفل بفتح التطبيق أو الرجوع للمتجر تلقائياً
      window.location.href = buildIntentUrl(userId);
      // شبكة أمان فقط لمتصفحات غير معروفة لا تنفذ intent://
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
        minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: 'var(--bg-main)',
        color: 'var(--text-tertiary)', textAlign: 'center',
        padding: 'var(--sp-6)',
      }}>
        رابط غير صالح
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      backgroundColor: 'var(--bg-main)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: 'var(--sp-6)',
      }}>

        {/* هوية البراند — اللوغو على اليسار دايماً + الاسم بجانبه
            + اسم المطور تحت الاسم، بغض النظر عن اتجاه الصفحة */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{
            direction: 'ltr',
            display: 'flex', alignItems: 'center', gap: 'var(--sp-4)',
            marginBottom: 'var(--sp-10)',
          }}
        >
          <img
            src={APP_LOGO}
            alt="ZAWAJ AI"
            width={60}
            height={60}
            style={{
              width: 60, height: 60,
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
              flexShrink: 0,
              boxShadow: 'var(--shadow-soft)',
            }}
          />
          <div style={{ textAlign: 'left' }}>
            <h1 style={{
              color: 'var(--text-main)', fontWeight: 900,
              fontSize: 'var(--text-2xl)', letterSpacing: 0.3,
              margin: 0, lineHeight: 'var(--lh-tight)',
            }}>
              ZAWAJ AI
            </h1>
            <p style={{
              color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)',
              letterSpacing: 0.5, textTransform: 'uppercase',
              margin: '2px 0 0', fontWeight: 600,
            }}>
              by {DEVELOPER_NAME}
            </p>
          </div>
        </motion.div>

        {/* البطاقة الرئيسية — خلفية صلبة var(--bg-main) بدون تدرجات،
            والبطاقة نفسها glass-panel من نظام التصميم */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.35 }}
          className="glass-panel"
          style={{
            width: '100%', maxWidth: 380,
            padding: 'var(--sp-8) var(--sp-6)',
            textAlign: 'center',
          }}
        >
          {!showFallback ? (
            <>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid var(--glass-border)',
                borderTopColor: 'var(--color-primary)',
                margin: '0 auto var(--sp-5)',
                animation: 'spin 0.9s linear infinite',
              }} />
              <h2 style={{
                color: 'var(--text-main)', fontWeight: 800,
                fontSize: 'var(--text-lg)', margin: '0 0 var(--sp-2)',
              }}>
                جاري فتح التطبيق...
              </h2>
              <p style={{
                color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
                lineHeight: 'var(--lh-relaxed)', margin: '0 0 var(--sp-6)',
              }}>
                إذا لم يفتح التطبيق تلقائياً، اضغط الزر أدناه
              </p>
              <button
                className="btn-premium"
                style={{ width: '100%' }}
                onClick={handleManualOpen}
              >
                افتح في التطبيق
              </button>
            </>
          ) : (
            <>
              <h2 style={{
                color: 'var(--text-main)', fontWeight: 800,
                fontSize: 'var(--text-lg)', margin: '0 0 var(--sp-2)',
              }}>
                التطبيق غير مثبت
              </h2>
              <p style={{
                color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)',
                lineHeight: 'var(--lh-relaxed)', margin: '0 0 var(--sp-6)',
              }}>
                ثبّت تطبيق ZAWAJ AI لمشاهدة هذا الملف الشخصي والتواصل مع صاحبه
              </p>

              {/* زر متجر Google Play — لون الزر يعكس var(--text-main) و
                  var(--bg-main)، فيتباين تلقائياً مع الخلفية: أبيض على
                  خلفية داكنة (الوضع الليلي)، أسود على خلفية فاتحة
                  (الوضع النهاري) — بدل صورة ثابتة قد تبهت على أحد الوضعين */}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  direction: 'ltr',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 'var(--sp-3)',
                  width: '100%', height: 'var(--btn-h-lg)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--text-main)',
                  color: 'var(--bg-main)',
                  textDecoration: 'none',
                  marginBottom: 'var(--sp-3)',
                }}
              >
                <PlayIcon />
                <span style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <span style={{
                    display: 'block', fontSize: 10, opacity: 0.7,
                    fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase',
                  }}>
                    Get it on
                  </span>
                  <span style={{ display: 'block', fontSize: 17, fontWeight: 800 }}>
                    Google Play
                  </span>
                </span>
              </a>

              {/* زر ثانوي — لمن ثبّت التطبيق للتو */}
              <button
                onClick={handleManualOpen}
                style={{
                  width: '100%', height: 'var(--btn-h)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-tertiary)',
                  fontWeight: 700, fontSize: 'var(--text-sm)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ثبّتّه؟ افتح التطبيق الآن
              </button>
            </>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100dvh', backgroundColor: 'var(--bg-main)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--glass-border)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.9s linear infinite',
        }} />
      </div>
    }>
      <ShareContent />
    </Suspense>
  );
}
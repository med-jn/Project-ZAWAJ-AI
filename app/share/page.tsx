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

// شعار Google Play — مسار SVG مطابق حرفياً للشعار الرسمي (نفس بيانات
// المسار وتدرجات الألوان الأربعة الدقيقة المستخدمة في شارات Google
// Play الرسمية نفسها، وليس تقريباً هندسياً).
function GooglePlayIcon() {
  return (
    <svg width={22} height={24} viewBox="18 16 26 28" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gpBlue" x1="31.8" y1="183.29" x2="15.02" y2="166.51" gradientTransform="matrix(1 0 0 -1 0 202)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00a0ff" /><stop offset=".01" stopColor="#00a1ff" /><stop offset=".26" stopColor="#00beff" /><stop offset=".51" stopColor="#00d2ff" /><stop offset=".76" stopColor="#00dfff" /><stop offset="1" stopColor="#00e3ff" />
        </linearGradient>
        <linearGradient id="gpYellow" x1="43.83" y1="172" x2="19.64" y2="172" gradientTransform="matrix(1 0 0 -1 0 202)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe000" /><stop offset=".41" stopColor="#ffbd00" /><stop offset=".78" stopColor="orange" /><stop offset="1" stopColor="#ff9c00" />
        </linearGradient>
        <linearGradient id="gpRed" x1="34.83" y1="169.7" x2="12.07" y2="146.95" gradientTransform="matrix(1 0 0 -1 0 202)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff3a44" /><stop offset="1" stopColor="#c31162" />
        </linearGradient>
        <linearGradient id="gpGreen" x1="17.3" y1="191.82" x2="27.46" y2="181.66" gradientTransform="matrix(1 0 0 -1 0 202)" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#32a071" /><stop offset=".07" stopColor="#2da771" /><stop offset=".48" stopColor="#15cf74" /><stop offset=".8" stopColor="#06e775" /><stop offset="1" stopColor="#00f076" />
        </linearGradient>
      </defs>
      <path fill="url(#gpBlue)" d="M20.44 17.54a2 2 0 0 0-.46 1.4v22.12a2 2 0 0 0 .46 1.4l.07.07L32.9 30.15v-.29L20.51 17.47z" />
      <path fill="url(#gpYellow)" d="M37 34.28l-4.1-4.13v-.29l4.1-4.14.09.05L42 28.56c1.4.79 1.4 2.09 0 2.89l-4.89 2.78z" />
      <path fill="url(#gpRed)" d="M37.12 34.22L32.9 30 20.44 42.46a1.63 1.63 0 0 0 2.08.06l14.61-8.3" />
      <path fill="url(#gpGreen)" d="M37.12 25.78l-14.61-8.3a1.63 1.63 0 0 0-2.08.06L32.9 30z" />
      <path opacity=".2" style={{ isolation: 'isolate' }} d="M37 34.13l-14.49 8.25a1.67 1.67 0 0 1-2 0l-.07.07.07.07a1.66 1.66 0 0 0 2 0l14.61-8.3z" />
      <path opacity=".12" style={{ isolation: 'isolate' }} d="M20.44 42.32a2 2 0 0 1-.46-1.4v.15a2 2 0 0 0 .46 1.4l.07-.07zM42 31.3l-5 2.83.09.09L42 31.44A1.75 1.75 0 0 0 43 30a1.86 1.86 0 0 1-1 1.3z" />
      <path fill="#fff" opacity=".25" style={{ isolation: 'isolate' }} d="M22.51 17.62L42 28.7a1.86 1.86 0 0 1 1 1.3 1.75 1.75 0 0 0-1-1.44L22.51 17.48c-1.4-.79-2.54-.13-2.54 1.47v.15c.03-1.61 1.15-2.27 2.54-1.48z" />
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
                className="btn-premium"
                style={{
                  direction: 'ltr',
                  width: '100%',
                  // كل خصائص .btn-premium (الشكل، الارتفاع، اللمعة،
                  // تأثير الضغط) تبقى كما هي — فقط اللون نتحكم فيه
                  // يدوياً هنا ليتكيف مع الثيم بدل لون البراند الثابت
                  backgroundColor: 'var(--text-main)',
                  color: 'var(--bg-main)',
                  textDecoration: 'none',
                  marginBottom: 'var(--sp-3)',
                }}
              >
                <GooglePlayIcon />
                <span style={{ textAlign: 'left', lineHeight: 1.1 }}>
                  <span style={{
                    display: 'block', fontSize: 9, opacity: 0.75,
                    fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase',
                  }}>
                    Get it on
                  </span>
                  <span style={{ display: 'block', fontSize: 14.5, fontWeight: 800 }}>
                    Google Play
                  </span>
                </span>
              </a>

              {/* زر ثانوي — لمن ثبّت التطبيق للتو. نفس كلاس btn-premium
                  بالضبط (لون var(--color-primary) الافتراضي) — بهذا
                  يتوحّد الزرّان تلقائياً بنفس الارتفاع والشكل والحواف
                  لأنهما يستخدمان نفس تعريف الكلاس، دون تعديل أي شيء
                  في globals.css نفسه */}
              <button onClick={handleManualOpen} className="btn-premium" style={{ width: '100%' }}>
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
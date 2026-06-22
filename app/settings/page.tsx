'use client';
/**
 * 📁 app/settings/page.tsx — ZAWAJ AI v3
 * ✅ إعدادات حقيقية متصلة بـ Supabase
 * ✅ إشعارات per-channel (fcm_tokens)
 * ✅ وضع العرض: تلقائي افتراضي + تبديل يدوي
 * ✅ حجم الخط: زران - / + بدل شريط
 * ✅ حجب صور الآخرين (show_photos)
 * ✅ Toggle مستقل من components/ui/Toggle
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Eye, EyeOff, Sun, Moon, Type,
  Minus, Plus, CheckCircle2, ImageOff, Image,
  ChevronLeft, Sliders,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase }       from '@/lib/supabase/client';
import { useTheme }       from '@/hooks/useTheme';
import { useSystemScale } from '@/hooks/useSystemScale';
import { Toggle }         from '@/components/ui/Toggle';

// ── أنواع ──────────────────────────────────────────
type ChannelKey = 'channel_messages' | 'channel_social' | 'channel_mediator' | 'channel_subscription' | 'channel_system';
type ChannelVal = 'on' | 'off';

interface FcmRow {
  id: string;
  channel_messages:     ChannelVal;
  channel_social:       ChannelVal;
  channel_mediator:     ChannelVal;
  channel_subscription: ChannelVal;
  channel_system:       ChannelVal;
}

interface ProfileRow {
  is_photos_blurred: boolean;
  show_photos:       boolean;
}

// ── ثوابت ──────────────────────────────────────────
const CHANNELS: { key: ChannelKey; label: string; sub: string }[] = [
  { key: 'channel_messages',     label: 'الرسائل',       sub: 'كل رسالة جديدة تصلك' },
  { key: 'channel_social',       label: 'التفاعل الاجتماعي', sub: 'إعجابات، زيارات، توافق' },
  { key: 'channel_mediator',     label: 'الوسيط',         sub: 'إشعارات الوساطة والاقتراحات' },
  { key: 'channel_subscription', label: 'الاشتراك',       sub: 'تجديد وتفعيل الباقات' },
  { key: 'channel_system',       label: 'النظام',          sub: 'تحديثات وإشعارات التطبيق' },
];

// ── مكوّنات مساعدة ──────────────────────────────────

function Section({
  icon, title, description, children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      borderRadius: 'var(--radius-xl)',
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      overflow: 'hidden',
    }}>
      {/* رأس القسم */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-4) var(--sp-5)',
        borderBottom: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div style={{
          width: 'var(--icon-xl)',
          height: 'var(--icon-xl)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--color-primary)',
        }}>
          {icon}
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 'var(--text-sm)', color: 'var(--text-main)', margin: 0 }}>
            {title}
          </p>
          {description && (
            <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {/* المحتوى */}
      <div style={{ padding: 'var(--sp-2) 0' }}>
        {children}
      </div>
    </div>
  );
}

function Row({
  label, sub, end, separator = true,
}: {
  label: string;
  sub?: string;
  end: React.ReactNode;
  separator?: boolean;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--sp-4)',
      padding: 'var(--sp-3) var(--sp-5)',
      borderBottom: separator ? '1px solid rgba(255,255,255,0.04)' : 'none',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-main)', margin: 0 }}>
          {label}
        </p>
        {sub && (
          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
            {sub}
          </p>
        )}
      </div>
      {end}
    </div>
  );
}

function ThemeOption({
  icon, label, checked, onSelect,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        padding: 'var(--sp-3) var(--sp-5)',
        background: checked ? 'var(--color-primary-xsoft)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        transition: 'background 0.2s',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span style={{ color: checked ? 'var(--color-primary)' : 'var(--text-tertiary)', display: 'flex' }}>
        {icon}
      </span>
      <span style={{
        flex: 1,
        textAlign: 'right',
        fontSize: 'var(--text-sm)',
        fontWeight: checked ? 700 : 500,
        color: checked ? 'var(--text-main)' : 'var(--text-secondary)',
      }}>
        {label}
      </span>
      {/* دائرة الاختيار */}
      <span style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `2px solid ${checked ? 'var(--color-primary)' : 'rgba(255,255,255,0.2)'}`,
        background: checked ? 'var(--color-primary)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'all 0.2s',
      }}>
        {checked && (
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#fff',
            display: 'block',
          }} />
        )}
      </span>
    </button>
  );
}

// ── الصفحة الرئيسية ──────────────────────────────────

export default function SettingsPage() {
  const router = useRouter();
  const { mode, setTheme } = useTheme();
  const { scale, setScale, resetScale, MIN_SCALE, MAX_SCALE, DEFAULT_SCALE } = useSystemScale();

  // ── حالة الملف الشخصي ─────────────────────────────
  const [userId,        setUserId]        = useState<string | null>(null);
  const [photosBlurred, setPhotosBlurred] = useState(false);
  const [showPhotos,    setShowPhotos]    = useState(true);

  // ── حالة الإشعارات ────────────────────────────────
  const [fcmId,      setFcmId]      = useState<string | null>(null);
  const [notifOn,    setNotifOn]    = useState(true);
  const [channels,   setChannels]   = useState<Record<ChannelKey, ChannelVal>>({
    channel_messages:     'on',
    channel_social:       'on',
    channel_mediator:     'on',
    channel_subscription: 'on',
    channel_system:       'on',
  });

  // ── حالة المظهر ───────────────────────────────────
  const [manualTheme, setManualTheme] = useState(mode !== 'system');

  // ── حالة الحفظ ────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [loading, setLoading] = useState(true);

  // ── تحميل البيانات ────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      // الملف الشخصي
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_photos_blurred, show_photos')
        .eq('id', user.id)
        .single();
      if (profile) {
        setPhotosBlurred(profile.is_photos_blurred ?? false);
        setShowPhotos(profile.show_photos ?? true);
      }

      // FCM token النشط
      const { data: fcm } = await supabase
        .from('fcm_tokens')
        .select('id, channel_messages, channel_social, channel_mediator, channel_subscription, channel_system, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_seen', { ascending: false })
        .limit(1)
        .single();

      if (fcm) {
        setFcmId(fcm.id);
        const ch = {
          channel_messages:     (fcm.channel_messages     as ChannelVal) || 'on',
          channel_social:       (fcm.channel_social       as ChannelVal) || 'on',
          channel_mediator:     (fcm.channel_mediator     as ChannelVal) || 'on',
          channel_subscription: (fcm.channel_subscription as ChannelVal) || 'on',
          channel_system:       (fcm.channel_system       as ChannelVal) || 'on',
        };
        setChannels(ch);
        const anyOn = Object.values(ch).some(v => v === 'on');
        setNotifOn(anyOn);
      }

      setLoading(false);
    };
    load();
  }, [router]);

  // ── تبديل كل الإشعارات ────────────────────────────
  const toggleAllNotif = (val: boolean) => {
    setNotifOn(val);
    if (!val) {
      setChannels(prev => {
        const next = { ...prev };
        (Object.keys(next) as ChannelKey[]).forEach(k => { next[k] = 'off'; });
        return next;
      });
    } else {
      setChannels(prev => {
        const next = { ...prev };
        (Object.keys(next) as ChannelKey[]).forEach(k => { next[k] = 'on'; });
        return next;
      });
    }
  };

  // ── تبديل قناة واحدة ─────────────────────────────
  const toggleChannel = (key: ChannelKey, val: boolean) => {
    setChannels(prev => {
      const next = { ...prev, [key]: val ? 'on' : 'off' } as Record<ChannelKey, ChannelVal>;
      const anyOn = Object.values(next).some(v => v === 'on');
      setNotifOn(anyOn);
      return next;
    });
  };

  // ── وضع العرض ─────────────────────────────────────
  const toggleManualTheme = (val: boolean) => {
    setManualTheme(val);
    if (!val) setTheme('system');
    else setTheme('dark');
  };

  // ── حفظ كل شيء ───────────────────────────────────
  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // حفظ الملف الشخصي
      const { error: pErr } = await supabase
        .from('profiles')
        .update({ is_photos_blurred: photosBlurred, show_photos: showPhotos })
        .eq('id', userId);
      if (pErr) throw pErr;

      // حفظ قنوات الإشعارات
      if (fcmId) {
        const { error: fErr } = await supabase
          .from('fcm_tokens')
          .update({ ...channels })
          .eq('id', fcmId);
        if (fErr) throw fErr;
      }

      setSaved(true);
      toast.success('تم حفظ الإعدادات ✅');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      toast.error(e?.message || 'فشل الحفظ، حاول مجدداً');
    } finally {
      setSaving(false);
    }
  };

  const scalePercent = Math.round(scale * 100);
  const atMin = scale <= MIN_SCALE + 0.001;
  const atMax = scale >= MAX_SCALE - 0.001;

  if (loading) return (
    <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
        style={{
          width: 30, height: 30, borderRadius: '50%',
          border: '2.5px solid var(--color-primary)',
          borderTopColor: 'transparent',
        }}
      />
    </div>
  );

  return (
    <div dir="rtl" style={{ padding: 'var(--sp-4)', maxWidth: 600, margin: '0 auto', paddingBottom: 'calc(var(--nav-h-safe) + var(--sp-4))' }}>

      {/* ── رأس الصفحة ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--sp-3)',
        marginBottom: 'var(--sp-6)',
        paddingTop: 'var(--sp-2)',
      }}>
        <div style={{
          width: 'var(--icon-xl)',
          height: 'var(--icon-xl)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-primary-xsoft)',
          border: '1px solid var(--color-primary-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-primary)',
        }}>
          <Sliders size={16} />
        </div>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
            الإعدادات
          </h1>
          <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', margin: 0 }}>
            تخصيص التجربة والخصوصية
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

        {/* ══ قسم الإشعارات ══ */}
        <Section
          icon={<Bell size={15} />}
          title="الإشعارات"
          description="تحكم في ما تتلقاه من تنبيهات"
        >
          {/* مفتاح رئيسي */}
          <Row
            label="تفعيل الإشعارات"
            sub="تشغيل أو إيقاف جميع الإشعارات دفعةً واحدة"
            end={<Toggle value={notifOn} onChange={toggleAllNotif} />}
          />

          {/* القنوات — تظهر فقط عند التفعيل */}
          <AnimatePresence>
            {notifOn && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                {/* فاصل */}
                <div style={{
                  margin: 'var(--sp-1) var(--sp-5)',
                  height: 1,
                  background: 'var(--color-primary-soft)',
                  opacity: 0.4,
                }} />
                <p style={{
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                  padding: 'var(--sp-2) var(--sp-5) var(--sp-1)',
                  margin: 0,
                }}>
                  القنوات
                </p>
                {CHANNELS.map((ch, i) => (
                  <Row
                    key={ch.key}
                    label={ch.label}
                    sub={ch.sub}
                    separator={i < CHANNELS.length - 1}
                    end={
                      <Toggle
                        size="sm"
                        value={channels[ch.key] === 'on'}
                        onChange={v => toggleChannel(ch.key, v)}
                      />
                    }
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </Section>

        {/* ══ قسم الخصوصية ══ */}
        <Section
          icon={<Eye size={15} />}
          title="الخصوصية والظهور"
          description="تحكم في ما يراه الآخرون"
        >
          {/*
            show_photos = true  → الصور ظاهرة  (Toggle ON)
            show_photos = false → الصور مخفية  (Toggle OFF)
          */}
          <Row
            label="إظهار صوري للآخرين"
            sub={showPhotos ? 'صورك ظاهرة لجميع المستخدمين' : 'صورك مخفية — لا أحد يراها'}
            end={<Toggle value={showPhotos} onChange={setShowPhotos} />}
          />
          {/*
            is_photos_blurred = true  → أرى صور الآخرين ضبابية  (Toggle ON)
            is_photos_blurred = false → أرى الصور بوضوح          (Toggle OFF)
          */}
          <Row
            label="تضبيب صور الآخرين"
            sub={photosBlurred ? 'صور الآخرين ضبابية حتى تأذن بالكشف' : 'ترى صور الآخرين بوضوح'}
            separator={false}
            end={<Toggle value={photosBlurred} onChange={setPhotosBlurred} />}
          />
        </Section>

        {/* ══ قسم المظهر ══ */}
        <Section
          icon={<Sun size={15} />}
          title="المظهر"
          description="وضع العرض وحجم الواجهة"
        >
          {/* وضع العرض اليدوي */}
          <Row
            label="وضع عرض يدوي"
            sub={manualTheme ? 'اختر الوضع أدناه' : 'يتبع إعداد الجهاز تلقائياً'}
            end={<Toggle value={manualTheme} onChange={toggleManualTheme} />}
          />

          {/* خيارا الوضع */}
          <AnimatePresence>
            {manualTheme && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                style={{ overflow: 'hidden' }}
              >
                <ThemeOption
                  icon={<Moon size={15} />}
                  label="الوضع الليلي"
                  checked={mode === 'dark'}
                  onSelect={() => setTheme('dark')}
                />
                <ThemeOption
                  icon={<Sun size={15} />}
                  label="الوضع النهاري"
                  checked={mode === 'light'}
                  onSelect={() => setTheme('light')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* فاصل */}
          <div style={{
            height: 1,
            background: 'var(--glass-border)',
            margin: 'var(--sp-1) var(--sp-5)',
          }} />

          {/* حجم الخط والأيقونات */}
          <div style={{ padding: 'var(--sp-3) var(--sp-5)' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--sp-1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <Type size={13} style={{ color: 'var(--text-tertiary)' }} />
                <p style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--text-main)', margin: 0 }}>
                  حجم الواجهة
                </p>
              </div>
              {scale !== DEFAULT_SCALE && (
                <button
                  onClick={resetScale}
                  style={{
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    background: 'var(--color-primary-xsoft)',
                    border: '1px solid var(--color-primary-soft)',
                    borderRadius: 'var(--radius-full)',
                    padding: '2px 10px',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  إعادة الضبط
                </button>
              )}
            </div>
            <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)', marginBottom: 'var(--sp-4)', margin: '0 0 var(--sp-4)' }}>
              يؤثر على النصوص والأيقونات والمسافات في كل التطبيق
            </p>

            {/* أزرار - نسبة + */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
              justifyContent: 'center',
            }}>
              {/* زر تصغير */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setScale(Math.max(MIN_SCALE, +(scale - 0.05).toFixed(2)))}
                disabled={atMin}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-sm)',
                  background: atMin ? 'rgba(255,255,255,0.03)' : 'var(--glass-bg)',
                  border: `1px solid ${atMin ? 'rgba(255,255,255,0.06)' : 'var(--glass-border)'}`,
                  color: atMin ? 'rgba(255,255,255,0.2)' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: atMin ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <Minus size={18} />
              </motion.button>

              {/* عرض النسبة */}
              <div style={{
                flex: 1,
                textAlign: 'center',
                padding: 'var(--sp-3)',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--glass-border)',
              }}>
                <span style={{
                  fontSize: 'var(--text-2xl)',
                  fontWeight: 900,
                  color: scale === DEFAULT_SCALE ? 'var(--text-secondary)' : 'var(--color-primary)',
                  fontVariantNumeric: 'tabular-nums',
                  display: 'block',
                  lineHeight: 1,
                }}>
                  {scalePercent}%
                </span>
                <span style={{
                  fontSize: 'var(--text-2xs)',
                  color: 'var(--text-tertiary)',
                  marginTop: 2,
                  display: 'block',
                }}>
                  {scale === DEFAULT_SCALE ? 'الحجم الافتراضي' : scale > DEFAULT_SCALE ? 'أكبر من الافتراضي' : 'أصغر من الافتراضي'}
                </span>
              </div>

              {/* زر تكبير */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={() => setScale(Math.min(MAX_SCALE, +(scale + 0.05).toFixed(2)))}
                disabled={atMax}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-sm)',
                  background: atMax ? 'rgba(255,255,255,0.03)' : 'var(--color-primary-xsoft)',
                  border: `1px solid ${atMax ? 'rgba(255,255,255,0.06)' : 'var(--color-primary-soft)'}`,
                  color: atMax ? 'rgba(255,255,255,0.2)' : 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: atMax ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              >
                <Plus size={18} />
              </motion.button>
            </div>

            {/* معاينة */}
            <div style={{
              marginTop: 'var(--sp-4)',
              padding: 'var(--sp-4)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--sp-3)',
            }}>
              <Bell style={{ width: 'var(--icon-lg)', height: 'var(--icon-lg)', color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)', margin: 0, lineHeight: 'var(--lh-snug)' }}>
                معاينة حجم النص والأيقونات
              </p>
            </div>
          </div>
        </Section>

        {/* ══ زر الحفظ ══ */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            height: 'var(--btn-h-lg)',
            borderRadius: 'var(--radius-lg)',
            background: saved
              ? 'linear-gradient(135deg, #16a34a, #22c55e)'
              : 'linear-gradient(135deg, var(--color-primary-hover), var(--color-primary))',
            border: 'none',
            color: '#fff',
            fontSize: 'var(--text-base)',
            fontWeight: 800,
            fontFamily: 'inherit',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-2)',
            boxShadow: saved
              ? '0 8px 24px rgba(34,197,94,0.3)'
              : '0 8px 24px var(--shadow-red-glow)',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        >
          {saving ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
            />
          ) : saved ? (
            <><CheckCircle2 size={18} /> تم الحفظ</>
          ) : (
            'حفظ الإعدادات'
          )}
        </motion.button>

      </div>
    </div>
  );
}
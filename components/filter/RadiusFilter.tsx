'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Navigation, X } from 'lucide-react';
import { toast } from 'sonner';
import { getAutoLocation } from '@/lib/services/locationService';
import { supabase } from '@/lib/supabase/client';

/**
 * RadiusFilter — البحث بالقرب الجغرافي
 * ✅ يطلب الموقع لحظياً عند التفعيل
 * ✅ يحدّث profiles في الخلفية بصمت
 * ✅ يمرر lat/lon/radius للـ index
 */

const RADIUS_OPTIONS = [5, 10, 20, 50, 100, 200];

interface Props {
  radiusKm: number | null;
  searchLat: number | null;
  searchLon: number | null;
  onChange: (radiusKm: number | null, lat: number | null, lon: number | null) => void;
}

export default function RadiusFilter({ radiusKm, searchLat, searchLon, onChange }: Props) {
  const [locating, setLocating] = useState(false);
  const isActive = radiusKm !== null && searchLat !== null;

  const requestLocation = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await getAutoLocation();

      // تحديث الموقع في DB بصمت في الخلفية
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        supabase.from('profiles').update({
          latitude:    loc.lat,
          longitude:   loc.lon,
          updated_at:  new Date().toISOString(),
        }).eq('id', user.id).then(() => {});
      }

      // تفعيل الفلتر بنطاق افتراضي 50 كم
      onChange(50, loc.lat, loc.lon);
      toast.success(`تم تحديد موقعك: ${loc.city}`);
    } catch {
      toast.error('تعذّر تحديد موقعك، يرجى السماح بالوصول');
    } finally {
      setLocating(false);
    }
  }, [locating, onChange]);

  const disable = () => onChange(null, null, null);

  return (
    <div style={{ marginBottom: 0 }}>
      <AnimatePresence mode="wait">

        {/* ── حالة غير مفعّل ── */}
        {!isActive && (
          <motion.button
            key="activate"
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            whileTap={{ scale: 0.97 }}
            onClick={requestLocation}
            disabled={locating}
            style={{
              width: '100%',
              padding: 'var(--sp-4)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-xsoft)',
              border: '1.5px dashed var(--color-primary-soft)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 'var(--sp-3)',
              cursor: locating ? 'not-allowed' : 'pointer',
              opacity: locating ? 0.7 : 1,
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'inherit',
            }}
          >
            {locating ? (
              <Loader2 size={18} style={{ color: 'var(--color-primary)', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Navigation size={18} style={{ color: 'var(--color-primary)' }} />
            )}
            <div style={{ textAlign: 'right' }}>
              <p style={{
                fontSize: 'var(--text-sm)', fontWeight: 800,
                color: 'var(--color-primary)', margin: 0,
              }}>
                {locating ? 'جارٍ تحديد موقعك...' : 'البحث حسب القرب مني'}
              </p>
              {!locating && (
                <p style={{
                  fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)',
                  margin: '2px 0 0',
                }}>
                  يتطلب السماح بالوصول للموقع
                </p>
              )}
            </div>
          </motion.button>
        )}

        {/* ── حالة مفعّل ── */}
        {isActive && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {/* رأس الفلتر النشط */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 'var(--sp-3)', direction: 'rtl',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--color-primary)',
                  boxShadow: '0 0 6px var(--shadow-red-glow)',
                  animation: 'pulse 2s infinite',
                }} />
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 700,
                  color: 'var(--color-primary)',
                }}>
                  موقعك محدد — النطاق: {radiusKm} كم
                </span>
              </div>
              <button
                type="button"
                onClick={disable}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 'var(--text-2xs)', color: 'var(--text-tertiary)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <X size={12} /> إلغاء
              </button>
            </div>

            {/* خيارات النطاق */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {RADIUS_OPTIONS.map(r => {
                const active = radiusKm === r;
                return (
                  <motion.button
                    key={r}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onChange(r, searchLat, searchLon)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none', cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: 'var(--text-sm)',
                      fontWeight: active ? 800 : 400,
                      background: active ? 'var(--color-primary)' : 'var(--glass-bg)',
                      color: active ? '#fff' : 'var(--text-secondary)',
                      outline: `1.5px solid ${active ? 'var(--color-primary)' : 'var(--glass-border)'}`,
                      boxShadow: active ? '0 3px 12px var(--shadow-red-glow)' : 'none',
                      transition: 'all 0.15s ease',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    {r < 1000 ? `${r} كم` : `${r / 1000} ألف كم`}
                  </motion.button>
                );
              })}
            </div>

            {/* زر إعادة تحديد الموقع */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={requestLocation}
              disabled={locating}
              style={{
                marginTop: 'var(--sp-3)',
                display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', opacity: locating ? 0.5 : 1,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {locating
                ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                : <MapPin size={13} />
              }
              تحديث موقعي
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
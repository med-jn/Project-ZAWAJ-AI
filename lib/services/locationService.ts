/* 📁 lib/services/locationService.ts
 * ✅ يحدّث عمود coords (PostGIS) عبر RPC — لا نص خام عبر JS
 * ✅ استراتيجية multi-zoom لتحسين دقة المدينة/المعتمدية (Nominatim مجاني)
 * ✅ fallback ذكي متعدد المستويات بدون بيانات يدوية غير موثوقة
 */
import { toast }       from "sonner";
import { Capacitor }   from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationResult {
  city:    string;
  country: string;
  lat:     number;
  lon:     number;
}

// ── جلب الإحداثيات ─────────────────────────────────────────
async function getCoords(): Promise<{ lat: number; lon: number }> {
  if (Capacitor.isNativePlatform()) {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 12000,
    });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  }
  return new Promise((res, rej) => {
    navigator.geolocation.getCurrentPosition(
      p  => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
      rej,
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

// ── استدعاء Nominatim بـ zoom محدد ─────────────────────────
async function reverseGeocode(lat: number, lon: number, zoom: number) {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2&lat=${lat}&lon=${lon}` +
    `&accept-language=ar&addressdetails=1&zoom=${zoom}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Zawaj-AI/2.1 (zawaj.ai)' },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

// ── فحص: هل هذا الحقل اسم مكان حقيقي صالح؟ ─────────────────
function isValidPlaceName(c: string | undefined, stateName: string): boolean {
  if (!c) return false;
  const trimmed = c.trim();
  if (trimmed === '') return false;
  if (trimmed === stateName) return false;
  if (/^\d/.test(trimmed)) return false;            // يبدأ برقم
  if (trimmed.toLowerCase().includes('cité')) return false;
  if (trimmed.includes('حي ')) return false;
  if (trimmed.includes('شارع')) return false;
  if (trimmed.includes('نهج')) return false;          // اسم شارع بالتونسية
  return true;
}

// ── استخراج أفضل اسم من عنوان واحد ──────────────────────────
function extractFromAddress(a: Record<string, string>, stateName: string): string {
  // الحقول بترتيب الأولوية — من الأدق (معتمدية/بلدية) للأعم
  const candidates = [
    a.municipality,   // بلديات (المروج، السيجومي...)
    a.town,            // مدن صغيرة ومتوسطة (رادس، حمام الشط...)
    a.city_district,   // أحياء كبرى
    a.suburb,          // ضواحي
    a.village,         // قرى
    a.county,          // معتمديات (أعم من المدينة، أدق من الولاية)
  ];

  for (const c of candidates) {
    if (isValidPlaceName(c, stateName)) return c.trim();
  }
  return '';
}

// ── الدالة الرئيسية — متعددة المحاولات ─────────────────────
export const getAutoLocation = async (): Promise<LocationResult> => {
  const toastId = 'location-toast';
  toast.loading('تحديد موقعك...', { id: toastId });

  try {
    const { lat, lon } = await getCoords();

    // نجرب عدة مستويات zoom بالترتيب من الأدق للأعم
    // 16 = حي/بلدية صغيرة، 14 = بلدية/معتمدية، 12 = معتمدية كبرى، 10 = مدينة كبرى
    const zoomLevels = [16, 14, 12, 10];

    let city    = '';
    let country = '';

    for (const zoom of zoomLevels) {
      try {
        const data = await reverseGeocode(lat, lon, zoom);
        const a    = data.address ?? {};
        const state = a.state ?? a.province ?? '';

        const found = extractFromAddress(a, state);
        if (found) {
          city    = found;
          country = a.country ?? country;
          break; // وجدنا اسماً صالحاً — نوقف المحاولات
        }
        // نحتفظ بالدولة حتى لو لم نجد مدينة بعد
        country = country || a.country || '';
        // نحتفظ باسم الولاية كـ fallback أخير
        if (!city && state) city = state;

      } catch { /* نجرب zoom التالي */ }
    }

    if (!city) city = 'موقعك الحالي';

    toast.success(`تم التحديد: ${city}`, { id: toastId });
    return { city, country, lat, lon };

  } catch (error: any) {
    toast.dismiss(toastId);
    if (error?.code === 1) {
      toast.error('يرجى السماح للتطبيق بالوصول للموقع');
    } else if (error?.code === 3) {
      toast.error('انتهت مهلة تحديد الموقع، حاول مجدداً');
    } else {
      toast.error('فشل تحديد الموقع، يرجى الاختيار يدوياً');
    }
    throw error;
  }
};

// ── حفظ الموقع في قاعدة البيانات ───────────────────────────
/**
 * ✅ يستخدم RPC function (update_user_location) لتحديث coords
 *    بشكل صحيح عبر ST_MakePoint داخل SQL — لا نص خام عبر JS.
 *    يحدّث أيضاً latitude/longitude/city/country في نفس الاستدعاء.
 */
export async function saveLocationToProfile(
  supabase: any,
  userId:   string,
  result:   LocationResult,
): Promise<void> {
  const { error } = await supabase.rpc('update_user_location', {
    p_user_id: userId,
    p_lat:     result.lat,
    p_lon:     result.lon,
    p_city:    result.city,
    p_country: result.country,
  });

  if (error) {
    console.error('[locationService] update_user_location error:', error.message);
  }
}

// ── حساب المسافة (Haversine) — للاستخدام المحلي عند الحاجة ──
export function calcDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R    = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
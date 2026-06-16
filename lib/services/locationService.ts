/**
 * 📁 lib/services/locationService.ts
 * ✅ يحدّث coords (PostGIS) + latitude + longitude + city + country
 * ✅ Nominatim zoom=10 لاسم المدينة الدقيق (لا المحافظة)
 * ✅ خوارزمية انتقاء المدينة محسّنة للمدن العربية الصغيرة
 */

import { toast }      from "sonner";
import { Capacitor }  from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationResult {
  city:    string;
  country: string;
  lat:     number;
  lon:     number;
}

// ── جلب الإحداثيات ──────────────────────────────────────────
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
      err => rej(err),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

// ── انتقاء أفضل اسم للمدينة من حقول Nominatim ──────────────
function pickCity(a: Record<string, string>): string {
  const state = a.state ?? '';

  /**
   * zoom=10 في Nominatim يُنتج مستوى "المدينة/البلدية"
   * الأولوية من الأدق للأوسع:
   *
   * 1. town         — مدن متوسطة: رادس، المروج، حمام الأنف
   * 2. municipality — البلدية (قد تكون أدق من town)
   * 3. suburb       — ضاحية كبيرة (أحياناً أوضح من البلدية)
   * 4. city_district— حي إداري
   * 5. city         — إذا كان مختلفاً عن الولاية (تونس العاصمة مثلاً)
   * 6. village      — قرى
   * 7. county       — المعتمدية (أوسع — ملاذ أخير)
   * 8. state        — الولاية (الملاذ الأخير الأخير)
   */
  const priority = [
    a.town,
    a.municipality,
    a.suburb,
    a.city_district,
    a.city,
    a.village,
    a.county,
  ];

  for (const field of priority) {
    if (
      field &&
      field.trim() !== '' &&
      field !== state &&
      // تجنب أسماء الأحياء السكنية والشوارع
      !field.match(/^(حي|شارع|طريق|نهج|rue|avenue|cité|cite|lotissement)/i)
    ) {
      return field.trim();
    }
  }

  return state || 'غير محدد';
}

// ── الدالة الرئيسية ──────────────────────────────────────────
export const getAutoLocation = async (): Promise<LocationResult> => {
  const toastId = 'location-toast';
  toast.loading('جارٍ تحديد موقعك...', { id: toastId });

  try {
    const { lat, lon } = await getCoords();

    /**
     * zoom=10 → مستوى المدينة/البلدية مباشرة
     * zoom=18 → مستوى البناية (يُفسد اسم المدينة)
     */
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?format=json&lat=${lat}&lon=${lon}` +
      `&accept-language=ar&addressdetails=1&zoom=10`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'ZawajAI/1.0' },
    });

    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const data = await res.json();
    const a    = data.address ?? {};

    const city    = pickCity(a);
    const country = (a.country ?? '').trim() || 'غير محدد';

    toast.success(`${city}، ${country}`, { id: toastId });
    return { city, country, lat, lon };

  } catch (err: any) {
    toast.dismiss(toastId);
    toast.error('تعذّر تحديد الموقع — تحقق من الإذن');
    throw err;
  }
};

// ── حفظ الموقع في profiles ──────────────────────────────────
// ✅ يحدّث coords (PostGIS Point) + latitude + longitude + city + country
export async function saveLocationToProfile(
  supabase: any,
  userId:   string,
  result:   LocationResult,
): Promise<void> {
  const { error } = await supabase.rpc('update_user_location', {
    p_user_id:  userId,
    p_lat:      result.lat,
    p_lon:      result.lon,
    p_city:     result.city,
    p_country:  result.country,
  });

  if (error) {
    // fallback: تحديث الحقول العادية فقط (بدون coords)
    console.warn('[locationService] RPC failed, fallback update:', error.message);
    await supabase.from('profiles').update({
      city:       result.city,
      country:    result.country,
      latitude:   result.lat,
      longitude:  result.lon,
      updated_at: new Date().toISOString(),
    }).eq('id', userId);
  }
}

// ── حساب المسافة (Haversine) ─────────────────────────────────
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
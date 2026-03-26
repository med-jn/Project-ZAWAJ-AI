/**
 * 📁 lib/locationService.ts — ZAWAJ AI
 * ✅ يدعم المتصفح (Web) والتطبيق (Capacitor) معاً
 * ✅ يحفظ lat/lon + coords (PostGIS) تلقائياً عبر Trigger
 * ✅ Sonner للإشعارات
 */
import { toast } from "sonner";
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationResult {
  city:    string;
  country: string;
  lat:     number;
  lon:     number;
}

// ── تحديد الموقع (هجين: أندرويد + متصفح) ──────────────────────────
export const getAutoLocation = async (): Promise<LocationResult> => {
  toast.loading("جارٍ تحديد موقعك...", { id: "location" });

  try {
    let lat: number;
    let lon: number;

    // 1. الفحص: هل نحن داخل تطبيق موبايل (Capacitor)؟
    if (Capacitor.isNativePlatform()) {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } 
    // 2. إذا كنا على متصفح الكمبيوتر
    else {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("جهازك لا يدعم تحديد الموقع"));
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        });
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    }

    // 3. جلب تفاصيل العنوان (المدينة والدولة) - تعمل في الجهتين
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`,
      { headers: { "User-Agent": "Zawaj-AI-App" } }
    );

    if (!res.ok) throw new Error();
    const data = await res.json();
    
    const city = data.address.city || data.address.town || data.address.village || data.address.state || "غير محدد";
    const country = data.address.country || "تونس";

    toast.success("تم تحديد موقعك بنجاح ✅", { id: "location" });
    return { city, country, lat, lon };

  } catch (error: any) {
    toast.dismiss("location");
    let errorMsg = "تعذر تحديد الموقع، تأكد من تفعيل الـ GPS";
    
    if (error.code === 1) errorMsg = "يرجى تفعيل إذن الموقع في الإعدادات";
    if (error.code === 3) errorMsg = "انتهى وقت المحاولة، حاول مرة أخرى";
    
    toast.error(errorMsg);
    throw error;
  }
};

// ── حفظ الموقع في profiles ────────────────────────────────────
export async function saveLocationToProfile(
  supabase: any,
  userId:   string,
  result:   LocationResult
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      city:       result.city,
      country:    result.country,
      latitude:   result.lat,
      longitude:  result.lon,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("[locationService]", error.message);
    toast.error("تعذّر حفظ الموقع، يمكنك تحديده يدوياً");
  }
}

// ── حساب المسافة محلياً (للعرض السريع) ──────────────────────
export function calcDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R  = 6371;
  const dL = toRad(lat2 - lat1);
  const dG = toRad(lon2 - lon1);
  const a  = Math.sin(dL / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dG / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const toRad = (d: number) => d * Math.PI / 180;
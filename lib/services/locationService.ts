/**
 * 📁 lib/locationService.ts — ZAWAJ AI
 * ✅ يحفظ lat/lon + coords (PostGIS) تلقائياً عبر Trigger
 * ✅ Sonner للإشعارات
 * ✅ calcDistance يستخدم coords في SQL
 */
import { toast } from "sonner";

export interface LocationResult {
  city:    string;
  country: string;
  lat:     number;
  lon:     number;
}

// ── تحديد الموقع تلقائياً ─────────────────────────────────────
export const getAutoLocation = (): Promise<LocationResult> => {
  return new Promise((resolve, reject) => {
    // HTTPS مطلوب على الأجهزة الحقيقية
    if (typeof window !== 'undefined' &&
        window.location.protocol !== 'https:' &&
        !window.location.hostname.includes('localhost')) {
      const msg = "تحديد الموقع يتطلب اتصالاً آمناً (HTTPS)";
      toast.error(msg);
      return reject(new Error(msg));
    }

    if (!navigator.geolocation) {
      const msg = "جهازك لا يدعم تحديد الموقع";
      toast.error(msg);
      return reject(new Error(msg));
    }

    toast.loading("جارٍ تحديد موقعك...", { id: "location" });

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lon } }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`,
            { headers: { "User-Agent": "Zawaj-AI-App" } }
          );
          if (!res.ok) throw new Error();
          const data = await res.json();
          const city = data.address.city || data.address.town
            || data.address.village || data.address.state || "غير محدد";
          const country = data.address.country || "تونس";
          toast.success("تم تحديد موقعك ✅", { id: "location" });
          resolve({ city, country, lat, lon });
        } catch {
          toast.dismiss("location");
          toast.error("تعذّر جلب تفاصيل العنوان");
          reject(new Error("تعذّر جلب تفاصيل العنوان"));
        }
      },
      (err) => {
        toast.dismiss("location");
        const msgs: Record<number, string> = {
          1: "فعّل إذن الموقع في إعدادات هاتفك",
          2: "إشارة GPS ضعيفة، حاول في مكان مفتوح",
          3: "انتهى وقت المحاولة، أعد المحاولة",
        };
        toast.error(msgs[err.code] ?? "خطأ في تحديد الموقع");
        reject(new Error(msgs[err.code]));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
};

// ── حفظ الموقع في profiles ────────────────────────────────────
// Trigger يُحدّث coords تلقائياً من lat/lon
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
      latitude:   result.lat,   // Trigger يبني coords تلقائياً
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
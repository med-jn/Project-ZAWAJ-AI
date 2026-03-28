/* 📁 lib/services/locationService.ts — الإصدار الأخير والنهائي */
import { toast } from "sonner";
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

export interface LocationResult {
  city:    string;
  country: string;
  lat:     number;
  lon:     number;
}

export const getAutoLocation = async (): Promise<LocationResult> => {
  const toastId = "location-toast";
  toast.loading("تحديد المدينة بدقة...", { id: toastId });

  try {
    let lat: number;
    let lon: number;

    // 1. جلب الإحداثيات مع طلب أقصى دقة ممكنة
    if (Capacitor.isNativePlatform()) {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true, // ضروري جداً
        timeout: 10000
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    } else {
      const position = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      lat = position.coords.latitude;
      lon = position.coords.longitude;
    }

    // 2. طلب البيانات (أضفنا زووم 18 للحصول على أدق تفاصيل ممكنة للمباني والمدن)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar&addressdetails=1&zoom=18`,
      { headers: { "User-Agent": "Zawaj-AI-Final-Check" } }
    );

    if (!res.ok) throw new Error();
    const data = await res.json();
    const a = data.address;

    // اسم الولاية للمقارنة
    const stateName = a.state || "";

    /**
     * الفكرة هنا: سنأخذ "أول" اسم بشري يظهر في العنوان 
     * بشرط ألا يكون هو نفسه اسم الولاية، وألا يكون رقماً أو شارعاً.
     */
    const getBestCity = () => {
      // ترتيب الأهمية للمدن التونسية في OSM
      const priorityFields = [
        a.municipality, // البلديات مثل رادس
        a.town,         // المدن
        a.county,       // المعتمديات
        a.suburb,       // الضواحي الكبيرة
        a.city_district,
        a.village
      ];

      for (let field of priorityFields) {
        if (field && field !== stateName && !field.includes("حي") && !field.toLowerCase().includes("cité")) {
          return field;
        }
      }
      
      // إذا لم يجد شيئاً، يبحث في حقل "المدينة" الأصلي
      if (a.city && a.city !== stateName) return a.city;
      
      return stateName; // الملاذ الأخير
    };

    const city = getBestCity();
    const country = a.country || "تونس";

    toast.success(`تم التحديد: ${city}`, { id: toastId });
    return { city, country, lat, lon };

  } catch (error: any) {
    toast.dismiss(toastId);
    toast.error("فشل التحديد، يرجى الاختيار يدوياً");
    throw error;
  }
};

export async function saveLocationToProfile(supabase: any, userId: string, result: LocationResult): Promise<void> {
  await supabase.from("profiles").update({
    city: result.city,
    country: result.country,
    latitude: result.lat,
    longitude: result.lon,
    updated_at: new Date().toISOString(),
  }).eq("id", userId);
}

export function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
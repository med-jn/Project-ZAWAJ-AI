/**
 * 🧠 محرك الاقتراحات الذكي — ZAWAJ AI
 * ✅ إصلاح BUG-06: مسار الاستيراد الصحيح لـ supabase
 * ✅ تحسين: إضافة نوع UserProfile واستبعاد المرفوضين
 */
import { supabase } from '@/lib/supabase/client';
import { READINESS_LEVEL_NOW } from '@/constants/constants';

// ══════════════════════════════════════════
//  نوع بيانات الملف الشخصي
// ══════════════════════════════════════════
interface UserProfile {
  id:                         string;
  gender:                     'male' | 'female';
  age:                        number;
  country:                    string;
  city:                       string;
  readiness_level?:           number;
  profile_completion_percent?: number;
  occupation_id?:             number;
}

type DiscoveryStrategy = 'STRICT_CITY' | 'SAME_COUNTRY' | 'FLEXIBLE_AGE' | 'GLOBAL_READY';

interface DiscoveryResult {
  data:     UserProfile[];
  strategy: number;  // 1–4 — تشير لأي مرحلة وجدنا فيها نتائج
}

// ══════════════════════════════════════════
//  المحرك الرئيسي
// ══════════════════════════════════════════
export class MatchingEngine {

  /**
   * الدالة الرئيسية — خوارزمية الدوائر المتوسعة
   * تبدأ بأضيق فلتر ثم تتوسع تدريجياً حتى تجد نتائج
   */
  static async getSmartSuggestions(userProfile: UserProfile): Promise<DiscoveryResult> {

    // نجلب المرفوضين مسبقاً لاستبعادهم من كل المراحل
    const excludedIds = await this.getExcludedUserIds(userProfile.id);

    const strategies: DiscoveryStrategy[] = [
      'STRICT_CITY',
      'SAME_COUNTRY',
      'FLEXIBLE_AGE',
      'GLOBAL_READY',
    ];

    for (let i = 0; i < strategies.length; i++) {
      const results = await this.fetchProfiles(userProfile, strategies[i], excludedIds);
      if (results.length > 0) {
        return {
          data: this.rankProfiles(results, userProfile),
          strategy: i + 1,
        };
      }
    }

    // لا توجد نتائج في أي مرحلة
    return { data: [], strategy: 4 };
  }

  // ══════════════════════════════════════
  //  جلب المستخدمين المستبعدين (dislike خلال 24 ساعة)
  // ══════════════════════════════════════
  private static async getExcludedUserIds(userId: string): Promise<string[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data } = await supabase
      .from('likes')
      .select('to_user')
      .eq('from_user', userId)
      .eq('action', 'pass')          // الـ dislike/pass
      .gte('created_at', since);

    return (data ?? []).map((r: { to_user: string }) => r.to_user);
  }

  // ══════════════════════════════════════
  //  جلب الملفات الشخصية حسب الاستراتيجية
  // ══════════════════════════════════════
  private static async fetchProfiles(
    user: UserProfile,
    strategy: DiscoveryStrategy,
    excludedIds: string[]
  ): Promise<UserProfile[]> {

    const oppositeGender = user.gender === 'male' ? 'female' : 'male';

    // حساب نطاق العمر حسب الجنس
    let minAge: number;
    let maxAge: number;

    if (user.gender === 'female') {
      minAge = user.age - 5;
      maxAge = user.age + 10;
    } else {
      minAge = user.age - 10;
      maxAge = user.age + 5;
    }

    // مرونة إضافية في مرحلة FLEXIBLE_AGE
    if (strategy === 'FLEXIBLE_AGE') {
      minAge -= 1;
      maxAge += 1;
    }

    let query = supabase
      .from('profiles')
      .select(`
        id, gender, age, country, city,
        readiness_level, profile_completion_percent,
        occupation_id, subscription_type,
        first_name, last_name, avatar_url,
        is_photos_blurred, photos
      `)
      .eq('is_completed', true)
      .eq('gender', oppositeGender)
      .gte('age', Math.max(18, minAge))   // الحد الأدنى 18 سنة دائماً
      .lte('age', maxAge)
      .neq('id', user.id);               // استبعاد المستخدم نفسه

    // استبعاد المرفوضين
    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    // تطبيق فلتر الجغرافيا
    if (strategy === 'STRICT_CITY') {
      query = query.eq('country', user.country).eq('city', user.city);
    } else if (strategy === 'SAME_COUNTRY' || strategy === 'FLEXIBLE_AGE') {
      query = query.eq('country', user.country);
    } else if (strategy === 'GLOBAL_READY') {
      // المرحلة 4: الجاهزون الآن من أي مكان
      query = query.eq('readiness_level', READINESS_LEVEL_NOW);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      console.error(`خطأ في MatchingEngine [${strategy}]:`, error.message);
      return [];
    }

    return data ?? [];
  }

  // ══════════════════════════════════════
  //  ترتيب النتائج بالأولوية
  // ══════════════════════════════════════
  private static rankProfiles(profiles: UserProfile[], user: UserProfile): UserProfile[] {
    return [...profiles].sort((a, b) => {
      // أولوية 1: الجاهزون الآن
      const aReady = a.readiness_level === READINESS_LEVEL_NOW ? 1 : 0;
      const bReady = b.readiness_level === READINESS_LEVEL_NOW ? 1 : 0;
      if (bReady !== aReady) return bReady - aReady;

      // أولوية 2: توافق المهنة
      const aOccMatch = a.occupation_id === user.occupation_id ? 1 : 0;
      const bOccMatch = b.occupation_id === user.occupation_id ? 1 : 0;
      if (bOccMatch !== aOccMatch) return bOccMatch - aOccMatch;

      // أولوية 3: اكتمال الملف الشخصي
      return (b.profile_completion_percent ?? 0) - (a.profile_completion_percent ?? 0);
    });
  }
}
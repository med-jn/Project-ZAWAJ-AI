/**
 * 🧠 MatchingEngine — ZAWAJ AI
 * ✅ دمج نظام الحظر الحقيقي (جدول blocks)
 * ✅ استثناء من أعجبنا بهم (like) نهائياً
 * ✅ من مررناهم (pass) يعودون في الدورة التالية
 * ✅ الحلقة اللانهائية مدارة من home/page.tsx
 */
import { supabase } from '@/lib/supabase/client';
import { READINESS_LEVEL_NOW } from '@/constants/constants';

export interface UserProfile {
  id:                          string;
  gender:                      'male' | 'female';
  age?:                        number | null;
  country?:                    string | null;
  city?:                       string | null;
  readiness_level?:            number | null;
  profile_completion_percent?: number | null;
  occupation_id?:              number | null;
}

export interface DiscoveryFilters {
  ageMin:      number;
  ageMax:      number;
  country:     string;
  city:        string;
  excludeIds?: string[]; // ← يُمرَّر من home لاستثناء الـ seen في sessionStorage
}

export interface DiscoveryResult {
  data:     any[];
  strategy: number;
}

// ✅ فقط الأعمدة الموجودة فعلاً في جدول profiles
const SELECT_COLS = [
  'id', 'gender', 'age', 'country', 'city',
  'full_name', 'avatar_url', 'images_data',
  'is_photos_blurred', 'readiness_level',
  'profile_completion_percent', 'occupation_id',
  'occupation_category_id', 'marital_status',
  'education_level', 'religious_commitment',
  'housing_type', 'financial_status', 'health_status',
  'desire_for_children', 'children_count', 'children_custody',
  'travel_willingness', 'skin_color', 'height', 'weight',
  'nationality', 'bio', 'partner_requirements',
  'quran_memorization', 'beard_style', 'prayer_commitment',
  'hijab_style', 'polygamy_acceptance', 'work_after_marriage',
  'wife_number', 'smoking', 'has_children',
  'social_type', 'morning_evening', 'home_time',
  'conflict_style', 'affection_style', 'life_priority',
  'parenting_style', 'relationship_with_family',
  'marriage_type', 'interests', 'health_habits',
  'birth_date', 'is_completed', 'role',
  'wallets(badge_type)',
].join(', ');

export class MatchingEngine {

  static async getSmartSuggestions(
    user: UserProfile,
    filters?: Partial<DiscoveryFilters>
  ): Promise<DiscoveryResult> {

    if (!user.gender) {
      console.error('[MatchingEngine] gender مفقود في البروفايل');
      return { data: [], strategy: 0 };
    }

    // ── جلب IDs المحظورة (من جدول blocks في الاتجاهين + likes نوع like) ──
    const blockedIds = await this.getBlockedIds(user.id);

    // ── IDs إضافية يمررها home (seen في sessionStorage) ──
    const extraExclude = filters?.excludeIds ?? [];

    // دمج كل IDs المستثناة بدون تكرار
    const allExcluded = [...new Set([...blockedIds, ...extraExclude])];

    // فلتر موقع صريح من المستخدم
    if (filters?.country || filters?.city) {
      const results = await this.query(user, allExcluded, {
        country: filters.country,
        city:    filters.city,
        ageMin:  filters.ageMin,
        ageMax:  filters.ageMax,
      });
      return { data: this.rank(results, user), strategy: filters.city ? 1 : 2 };
    }

    // جلب الكل ثم ترتيب بالأولوية
    const all = await this.query(user, allExcluded, {
      ageMin: filters?.ageMin,
      ageMax: filters?.ageMax,
    });

    if (all.length === 0) return { data: [], strategy: 4 };

    const sameCity    = all.filter(p => p.city === user.city && p.country === user.country);
    const sameCountry = all.filter(p => p.country === user.country);
    const strategy    = sameCity.length > 0 ? 1 : sameCountry.length > 0 ? 2 : 4;

    return { data: this.rank(all, user), strategy };
  }

  /**
   * يجلب IDs التي يجب استثناؤها نهائياً:
   * 1. من حظرناهم (blocker_id = نحن)
   * 2. من حظرونا  (blocked_id = نحن)
   * 3. من أعجبنا بهم (action = 'like') — لأنهم في صفحة الإعجابات
   *
   * ملاحظة: pass لا يُستثنى هنا — يعود في الدورة التالية
   */
  private static async getBlockedIds(userId: string): Promise<string[]> {
    const [blocksOut, blocksIn, likedUsers] = await Promise.all([
      // من حظرناهم
      supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId),

      // من حظرونا
      supabase
        .from('blocks')
        .select('blocker_id')
        .eq('blocked_id', userId),

      // من أعجبنا بهم (لا يعودون في أي دورة)
      supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', userId)
        .eq('action', 'like'),
    ]);

    const ids: string[] = [];

    (blocksOut.data ?? []).forEach((r: any) => r.blocked_id && ids.push(r.blocked_id));
    (blocksIn.data  ?? []).forEach((r: any) => r.blocker_id && ids.push(r.blocker_id));
    (likedUsers.data ?? []).forEach((r: any) => r.to_user   && ids.push(r.to_user));

    return [...new Set(ids)];
  }

  private static async query(
    user: UserProfile,
    excludedIds: string[],
    opts: {
      country?: string | null;
      city?:    string | null;
      ageMin?:  number;
      ageMax?:  number;
    }
  ): Promise<any[]> {

    const opp = user.gender === 'male' ? 'female' : 'male';

    let q = supabase
      .from('profiles')
      .select(SELECT_COLS)
      .eq('gender', opp)
      .neq('id', user.id)
      .not('gender', 'is', null)
      .or('role.is.null,role.eq.user');

    // فلتر العمر — فقط إذا طُلب صراحةً
    if (opts.ageMin !== undefined && opts.ageMax !== undefined) {
      q = q.gte('age', opts.ageMin).lte('age', opts.ageMax);
    }

    // فلتر الموقع
    if (opts.city && opts.country) {
      q = q.eq('country', opts.country).eq('city', opts.city);
    } else if (opts.country) {
      q = q.eq('country', opts.country);
    }

    // استبعاد المحظورين + المُعجَب بهم
    if (excludedIds.length > 0) {
      q = q.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data, error } = await q.limit(200);

    if (error) {
      console.error('[MatchingEngine] خطأ:', error.message);
      return [];
    }

    return data ?? [];
  }

  // استخراج badge_type من wallets (array أو object)
  static extractBadge(wallets: any): string | undefined {
    if (!wallets) return undefined;
    if (Array.isArray(wallets)) {
      const w = wallets.find((x: any) => x.badge_type && x.badge_type !== 'none');
      return w?.badge_type || undefined;
    }
    return wallets.badge_type !== 'none' ? wallets.badge_type : undefined;
  }

  private static rank(profiles: any[], user: UserProfile): any[] {
    return [...profiles].sort((a, b) => {
      // 1. نفس المدينة
      const aCity = (a.city === user.city && a.country === user.country) ? 3 : 0;
      const bCity = (b.city === user.city && b.country === user.country) ? 3 : 0;
      if (bCity !== aCity) return bCity - aCity;

      // 2. نفس الدولة
      const aCountry = a.country === user.country ? 2 : 0;
      const bCountry = b.country === user.country ? 2 : 0;
      if (bCountry !== aCountry) return bCountry - aCountry;

      // 3. جاهز الآن
      const aReady = a.readiness_level === READINESS_LEVEL_NOW ? 2 : 0;
      const bReady = b.readiness_level === READINESS_LEVEL_NOW ? 2 : 0;
      if (bReady !== aReady) return bReady - aReady;

      // 4. اكتمال الملف
      const aPct = a.profile_completion_percent ?? 0;
      const bPct = b.profile_completion_percent ?? 0;
      if (bPct !== aPct) return bPct - aPct;

      // 5. عنده صورة
      return (b.avatar_url ? 1 : 0) - (a.avatar_url ? 1 : 0);
    });
  }
}
/**
 * 🧠 MatchingEngine — ZAWAJ AI
 * SELECT مبني على الأعمدة الحقيقية فقط
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
  ageMin:  number;
  ageMax:  number;
  country: string;
  city:    string;
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

    const excludedIds = await this.getExcludedIds(user.id);

    // فلتر موقع صريح من المستخدم
    if (filters?.country || filters?.city) {
      const results = await this.query(user, excludedIds, {
        country: filters.country,
        city:    filters.city,
        ageMin:  filters.ageMin,
        ageMax:  filters.ageMax,
      });
      return { data: this.rank(results, user), strategy: filters.city ? 1 : 2 };
    }

    // جلب الكل ثم ترتيب بالأولوية
    const all = await this.query(user, excludedIds, {
      ageMin: filters?.ageMin,
      ageMax: filters?.ageMax,
    });

    if (all.length === 0) return { data: [], strategy: 4 };

    const sameCity    = all.filter(p => p.city === user.city && p.country === user.country);
    const sameCountry = all.filter(p => p.country === user.country);
    const strategy    = sameCity.length > 0 ? 1 : sameCountry.length > 0 ? 2 : 4;

    return { data: this.rank(all, user), strategy };
  }

  private static async getExcludedIds(userId: string): Promise<string[]> {
    // استثناء المحظورين فقط — الباقي يعود للعرض
    const { data } = await supabase
      .from('likes')
      .select('to_user')
      .eq('from_user', userId)
      .eq('action', 'block');
    return (data ?? []).map((r: any) => r.to_user).filter(Boolean);
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

    // استبعاد من تفاعلنا معهم
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
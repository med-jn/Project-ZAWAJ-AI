/**
 * 🧠 MatchingEngine — ZAWAJ AI v5
 * ✅ الفلاتر تُطبَّق بشكل صارم (strict mode)
 * ✅ الدولة/المدينة تُطبَّق دائماً إذا وُجدت في الفلاتر
 * ✅ استثناء المحظورين + المُعجَب بهم
 * ✅ pass يعود في الدورة التالية
 */
import { supabase }              from '@/lib/supabase/client';
import { READINESS_LEVEL_NOW }   from '@/constants/constants';
import type { DiscoveryFilters } from '@/app/filter/page';

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

export interface DiscoveryResult {
  data:     any[];
  strategy: number;
}

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
      console.error('[MatchingEngine] gender مفقود');
      return { data: [], strategy: 0 };
    }

    const blockedIds = await this.getBlockedIds(user.id);
    const results    = await this.query(user, blockedIds, filters);

    if (results.length === 0) return { data: [], strategy: 4 };

    // تحديد الاستراتيجية للعرض فقط (لا تؤثر على الفلترة)
    const sameCity    = results.filter(p => p.city === user.city && p.country === user.country);
    const sameCountry = results.filter(p => p.country === user.country);
    const strategy    = sameCity.length > 0 ? 1 : sameCountry.length > 0 ? 2 : 4;

    return { data: this.rank(results, user), strategy };
  }

  // ── IDs المستثناة ──────────────────────────────────────────
  private static async getBlockedIds(userId: string): Promise<string[]> {
    const [blocksOut, blocksIn, liked] = await Promise.all([
      supabase.from('blocks').select('blocked_id').eq('blocker_id', userId),
      supabase.from('blocks').select('blocker_id').eq('blocked_id', userId),
      supabase.from('likes').select('to_user')
        .eq('from_user', userId).eq('action', 'like'),
    ]);

    const ids: string[] = [];
    (blocksOut.data ?? []).forEach((r: any) => r.blocked_id && ids.push(r.blocked_id));
    (blocksIn.data  ?? []).forEach((r: any) => r.blocker_id && ids.push(r.blocker_id));
    (liked.data     ?? []).forEach((r: any) => r.to_user    && ids.push(r.to_user));
    return [...new Set(ids)];
  }

  // ── الاستعلام الرئيسي ──────────────────────────────────────
  private static async query(
    user: UserProfile,
    excludedIds: string[],
    filters?: Partial<DiscoveryFilters>
  ): Promise<any[]> {

    const opp = user.gender === 'male' ? 'female' : 'male';

    let q = supabase
      .from('profiles')
      .select(SELECT_COLS)
      .eq('gender', opp)
      .neq('id', user.id)
      .not('gender', 'is', null)
      .or('role.is.null,role.eq.user');

    // ── بدون فلاتر: إرجاع الكل ────────────────────────────
    if (!filters) {
      if (excludedIds.length > 0)
        q = q.not('id', 'in', `(${excludedIds.join(',')})`);
      const { data, error } = await q.limit(200);
      if (error) { console.error('[MatchingEngine]', error.message); return []; }
      return data ?? [];
    }

    // ══════════════════════════════════════════════════════
    // تطبيق الفلاتر بشكل صارم — كل فلتر محدد يُطبَّق فوراً
    // ══════════════════════════════════════════════════════

    // العمر
    const D = { ageMin: 18, ageMax: 60, heightMin: 140, heightMax: 210, weightMin: 40, weightMax: 150 };
    if (filters.ageMin !== undefined && filters.ageMax !== undefined) {
      if (filters.ageMin !== D.ageMin || filters.ageMax !== D.ageMax) {
        q = q.gte('age', filters.ageMin).lte('age', filters.ageMax);
      }
    }

    // ✅ الدولة والمدينة — صارمة: إذا حدد المستخدم دولة تُطبَّق دائماً
    if (filters.city && filters.country) {
      q = q.eq('country', filters.country).eq('city', filters.city);
    } else if (filters.country) {
      q = q.eq('country', filters.country);
    }

    // الجنسية
    if (filters.nationality) q = q.eq('nationality', filters.nationality);

    // الحالة المدنية
    if (filters.marital_status?.length)
      q = q.in('marital_status', filters.marital_status);

    // التعليم
    if (filters.education_level?.length)
      q = q.in('education_level', filters.education_level);

    // المجال المهني
    if (filters.occupation_cat?.length)
      q = q.in('occupation_category_id', filters.occupation_cat);

    // الوضع المادي
    if (filters.financial_status?.length)
      q = q.in('financial_status', filters.financial_status);

    // الالتزام الديني
    if (filters.religious_commitment?.length)
      q = q.in('religious_commitment', filters.religious_commitment);

    // جاهزية الزواج
    if (filters.readiness_level?.length)
      q = q.in('readiness_level', filters.readiness_level);

    // الطول
    if (filters.heightMin !== undefined && filters.heightMax !== undefined) {
      if (filters.heightMin !== D.heightMin || filters.heightMax !== D.heightMax) {
        q = q.gte('height', filters.heightMin).lte('height', filters.heightMax);
      }
    }

    // الوزن
    if (filters.weightMin !== undefined && filters.weightMax !== undefined) {
      if (filters.weightMin !== D.weightMin || filters.weightMax !== D.weightMax) {
        q = q.gte('weight', filters.weightMin).lte('weight', filters.weightMax);
      }
    }

    // باقي الحقول النصية
    const strFilters: Array<[string, string[] | undefined]> = [
      ['skin_color',              filters.skin_color],
      ['hijab_style',             filters.hijab_style],
      ['beard_style',             filters.beard_style],
      ['prayer_commitment',       filters.prayer_commitment],
      ['quran_memorization',      filters.quran_memorization],
      ['polygamy_acceptance',     filters.polygamy_acceptance],
      ['work_after_marriage',     filters.work_after_marriage],
      ['preferred_housing',       filters.preferred_housing],
      ['travel_willingness',      filters.travel_willingness],
      ['desire_for_children',     filters.desire_for_children],
      ['health_status',           filters.health_status],
      ['smoking',                 filters.smoking],
      ['social_type',             filters.social_type],
      ['morning_evening',         filters.morning_evening],
      ['conflict_style',          filters.conflict_style],
      ['affection_style',         filters.affection_style],
      ['life_priority',           filters.life_priority],
      ['parenting_style',         filters.parenting_style],
      ['relationship_with_family',filters.relationship_with_family],
    ];

    for (const [col, vals] of strFilters) {
      if (vals?.length) q = q.in(col, vals);
    }

    // السكن الحالي (رقمي)
    if (filters.housing_type?.length)
      q = q.in('housing_type', filters.housing_type);

    // استثناء المحظورين
    if (excludedIds.length > 0)
      q = q.not('id', 'in', `(${excludedIds.join(',')})`);

    const { data, error } = await q.limit(200);
    if (error) { console.error('[MatchingEngine]', error.message); return []; }
    return data ?? [];
  }

  // ── استخراج البادج ────────────────────────────────────────
  static extractBadge(wallets: any): string | undefined {
    if (!wallets) return undefined;
    if (Array.isArray(wallets)) {
      const w = wallets.find((x: any) => x.badge_type && x.badge_type !== 'none');
      return w?.badge_type || undefined;
    }
    return wallets.badge_type !== 'none' ? wallets.badge_type : undefined;
  }

  // ── الترتيب ───────────────────────────────────────────────
  private static rank(profiles: any[], user: UserProfile): any[] {
    return [...profiles].sort((a, b) => {
      const aCity    = (a.city === user.city && a.country === user.country) ? 3 : 0;
      const bCity    = (b.city === user.city && b.country === user.country) ? 3 : 0;
      if (bCity !== aCity) return bCity - aCity;

      const aCountry = a.country === user.country ? 2 : 0;
      const bCountry = b.country === user.country ? 2 : 0;
      if (bCountry !== aCountry) return bCountry - aCountry;

      const aReady = a.readiness_level === READINESS_LEVEL_NOW ? 2 : 0;
      const bReady = b.readiness_level === READINESS_LEVEL_NOW ? 2 : 0;
      if (bReady !== aReady) return bReady - aReady;

      const aPct = a.profile_completion_percent ?? 0;
      const bPct = b.profile_completion_percent ?? 0;
      if (bPct !== aPct) return bPct - aPct;

      return (b.avatar_url ? 1 : 0) - (a.avatar_url ? 1 : 0);
    });
  }
}
/**
 * 🧠 MatchingEngine — ZAWAJ AI v6
 * ✅ يستورد DiscoveryFilters من @/components/filter/types
 * ✅ البحث الجغرافي عبر RPC nearby_profiles (ST_DWithin + PostGIS)
 * ✅ fallback للاستعلام العادي إذا لم يكن هناك موقع
 * ✅ الفلاتر تُطبَّق بشكل صارم في الحالتين
 */
import { supabase }            from '@/lib/supabase/client';
import { READINESS_LEVEL_NOW } from '@/constants/constants';
import type { DiscoveryFilters } from '@/components/filter/types';

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
  strategy: number; // 1=نفس المدينة 2=نفس الدولة 3=جغرافي 4=عام
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
  'smoking', 'has_children',
  'social_type', 'morning_evening', 'home_time',
  'conflict_style', 'affection_style', 'life_priority',
  'parenting_style', 'relationship_with_family',
  'interests', 'health_habits',
  'birth_date', 'is_completed', 'role',
  'wallets(badge_type)',
].join(', ');

// القيم الافتراضية للنطاقات
const D = {
  ageMin: 18, ageMax: 60,
  heightMin: 140, heightMax: 210,
  weightMin: 40,  weightMax: 150,
};

export class MatchingEngine {

  static async getSmartSuggestions(
    user: UserProfile,
    filters?: Partial<DiscoveryFilters>,
  ): Promise<DiscoveryResult> {

    if (!user.gender) {
      console.error('[MatchingEngine] gender مفقود');
      return { data: [], strategy: 0 };
    }

    const blockedIds = await this.getBlockedIds(user.id);
    const opp        = user.gender === 'male' ? 'female' : 'male';

    // ── مسار البحث الجغرافي (RPC) ─────────────────────────
    if (filters?.radiusKm && filters.searchLat && filters.searchLon) {
      const results = await this.queryNearby(user, opp, blockedIds, filters);
      if (results.length > 0) {
        return { data: results, strategy: 3 }; // strategy 3 = جغرافي
      }
      // إذا لم تكن هناك نتائج قريبة → fallback للاستعلام العادي
    }

    // ── مسار الاستعلام العادي ─────────────────────────────
    const results = await this.queryNormal(user, opp, blockedIds, filters);
    if (results.length === 0) return { data: [], strategy: 4 };

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

  // ── الاستعلام الجغرافي عبر RPC ───────────────────────────
  private static async queryNearby(
    user: UserProfile,
    opp: string,
    excludedIds: string[],
    filters: Partial<DiscoveryFilters>,
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('nearby_profiles', {
        user_lat:      filters.searchLat,
        user_lon:      filters.searchLon,
        radius_km:     filters.radiusKm,
        target_gender: opp,

        excluded_ids: excludedIds.length > 0 ? excludedIds : [],

        // فلاتر رقمية
        p_marital_status:       filters.marital_status       ?? [],
        p_education_level:      filters.education_level      ?? [],
        p_religious_commitment: filters.religious_commitment ?? [],
        p_readiness_level:      filters.readiness_level      ?? [],
        p_occupation_cat:       filters.occupation_cat       ?? [],
        p_housing_type:         filters.housing_type         ?? [],

        // نطاقات
        p_age_min:    filters.ageMin    ?? D.ageMin,
        p_age_max:    filters.ageMax    ?? D.ageMax,
        p_height_min: filters.heightMin ?? D.heightMin,
        p_height_max: filters.heightMax ?? D.heightMax,
        p_weight_min: filters.weightMin ?? D.weightMin,
        p_weight_max: filters.weightMax ?? D.weightMax,

        // فلاتر نصية
        p_financial_status:         filters.financial_status         ?? [],
        p_skin_color:               filters.skin_color               ?? [],
        p_travel_willingness:       filters.travel_willingness       ?? [],
        p_desire_for_children:      filters.desire_for_children      ?? [],
        p_health_status:            filters.health_status            ?? [],
        p_smoking:                  filters.smoking                  ?? [],
        p_hijab_style:              filters.hijab_style              ?? [],
        p_beard_style:              filters.beard_style              ?? [],
        p_prayer_commitment:        filters.prayer_commitment        ?? [],
        p_quran_memorization:       filters.quran_memorization       ?? [],
        p_polygamy_acceptance:      filters.polygamy_acceptance      ?? [],
        p_work_after_marriage:      filters.work_after_marriage      ?? [],
        p_preferred_housing:        filters.preferred_housing        ?? [],
        p_social_type:              filters.social_type              ?? [],
        p_morning_evening:          filters.morning_evening          ?? [],
        p_conflict_style:           filters.conflict_style           ?? [],
        p_affection_style:          filters.affection_style          ?? [],
        p_life_priority:            filters.life_priority            ?? [],
        p_parenting_style:          filters.parenting_style          ?? [],
        p_relationship_with_family: filters.relationship_with_family ?? [],
      });

      if (error) {
        console.error('[MatchingEngine] RPC error:', error.message);
        return [];
      }

      return data ?? [];
    } catch (e) {
      console.error('[MatchingEngine] queryNearby exception:', e);
      return [];
    }
  }

  // ── الاستعلام العادي (بدون موقع) ─────────────────────────
  private static async queryNormal(
    user: UserProfile,
    opp: string,
    excludedIds: string[],
    filters?: Partial<DiscoveryFilters>,
  ): Promise<any[]> {

    let q = supabase
      .from('profiles')
      .select(SELECT_COLS)
      .eq('gender', opp)
      .neq('id', user.id)
      .eq('is_completed', true)
      .or('role.is.null,role.eq.user');

    if (!filters) {
      if (excludedIds.length > 0)
        q = q.not('id', 'in', `(${excludedIds.join(',')})`);
      const { data, error } = await q.limit(200);
      if (error) { console.error('[MatchingEngine]', error.message); return []; }
      return data ?? [];
    }

    // ── العمر ─────────────────────────────────────────────
    if (filters.ageMin !== D.ageMin || filters.ageMax !== D.ageMax) {
      q = q.gte('age', filters.ageMin ?? D.ageMin)
           .lte('age', filters.ageMax ?? D.ageMax);
    }

    // ── الموقع ────────────────────────────────────────────
    if (filters.city && filters.country) {
      q = q.eq('country', filters.country).eq('city', filters.city);
    } else if (filters.country) {
      q = q.eq('country', filters.country);
    }

    // ── الجنسية ───────────────────────────────────────────
    if (filters.nationality) q = q.eq('nationality', filters.nationality);

    // ── الطول والوزن ──────────────────────────────────────
    if (filters.heightMin !== D.heightMin || filters.heightMax !== D.heightMax) {
      q = q.gte('height', filters.heightMin ?? D.heightMin)
           .lte('height', filters.heightMax ?? D.heightMax);
    }
    if (filters.weightMin !== D.weightMin || filters.weightMax !== D.weightMax) {
      q = q.gte('weight', filters.weightMin ?? D.weightMin)
           .lte('weight', filters.weightMax ?? D.weightMax);
    }

    // ── فلاتر رقمية ───────────────────────────────────────
    if (filters.marital_status?.length)
      q = q.in('marital_status', filters.marital_status);
    if (filters.education_level?.length)
      q = q.in('education_level', filters.education_level);
    if (filters.occupation_cat?.length)
      q = q.in('occupation_category_id', filters.occupation_cat);
    if (filters.religious_commitment?.length)
      q = q.in('religious_commitment', filters.religious_commitment);
    if (filters.readiness_level?.length)
      q = q.in('readiness_level', filters.readiness_level);
    if (filters.housing_type?.length)
      q = q.in('housing_type', filters.housing_type);

    // ── فلاتر نصية ────────────────────────────────────────
    const strFilters: Array<[string, string[] | undefined]> = [
      ['financial_status',         filters.financial_status],
      ['skin_color',               filters.skin_color],
      ['hijab_style',              filters.hijab_style],
      ['beard_style',              filters.beard_style],
      ['prayer_commitment',        filters.prayer_commitment],
      ['quran_memorization',       filters.quran_memorization],
      ['polygamy_acceptance',      filters.polygamy_acceptance],
      ['work_after_marriage',      filters.work_after_marriage],
      ['preferred_housing',        filters.preferred_housing],
      ['travel_willingness',       filters.travel_willingness],
      ['desire_for_children',      filters.desire_for_children],
      ['health_status',            filters.health_status],
      ['smoking',                  filters.smoking],
      ['social_type',              filters.social_type],
      ['morning_evening',          filters.morning_evening],
      ['conflict_style',           filters.conflict_style],
      ['affection_style',          filters.affection_style],
      ['life_priority',            filters.life_priority],
      ['parenting_style',          filters.parenting_style],
      ['relationship_with_family', filters.relationship_with_family],
    ];
    for (const [col, vals] of strFilters) {
      if (vals?.length) q = q.in(col, vals);
    }

    // ── استثناء المحظورين ─────────────────────────────────
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

  // ── الترتيب (للاستعلام العادي فقط) ───────────────────────
  // البحث الجغرافي يرجع مرتباً بالمسافة من قاعدة البيانات
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
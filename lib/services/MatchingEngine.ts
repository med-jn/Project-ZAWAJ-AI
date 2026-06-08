/**
 * 🧠 MatchingEngine — ZAWAJ AI (UPDATED FINAL)
 * يعتمد فقط على likes + blocks + profiles
 */

import { supabase } from '@/lib/supabase/client';
import { READINESS_LEVEL_NOW } from '@/constants/constants';

export interface UserProfile {
  id: string;
  gender: 'male' | 'female';
  age?: number | null;
  country?: string | null;
  city?: string | null;
  readiness_level?: number | null;
  profile_completion_percent?: number | null;
}

export interface DiscoveryFilters {
  ageMin: number;
  ageMax: number;
  country: string;
  city: string;
}

export interface DiscoveryResult {
  data: any[];
  strategy: number;
}

const SELECT_COLS = [
  'id', 'gender', 'age', 'country', 'city',
  'full_name', 'avatar_url', 'images_data',
  'readiness_level', 'profile_completion_percent',
  'birth_date', 'is_completed'
].join(', ');

export class MatchingEngine {

  /**
   * 🚀 جلب المرشحين
   */
  static async getSmartSuggestions(
    user: UserProfile,
    filters?: Partial<DiscoveryFilters>
  ): Promise<DiscoveryResult> {

    if (!user?.id || !user.gender) {
      return { data: [], strategy: 0 };
    }

    const excludedIds = await this.getExcludedIds(user.id);

    const base = await this.query(user, excludedIds, filters);

    if (!base.length) return { data: [], strategy: 4 };

    return {
      data: this.rank(base, user),
      strategy: 1
    };
  }

  /**
   * ❌ كل الأشخاص المستبعدين:
   * - blocked (اتجاهين)
   * - آخر action = like أو pass
   */
  private static async getExcludedIds(userId: string): Promise<string[]> {

    // 1. blocks (ثنائي الاتجاه)
    const { data: blocks } = await supabase
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);

    const blockedIds = (blocks ?? []).map((b: any) =>
      b.blocker_id === userId ? b.blocked_id : b.blocker_id
    );

    // 2. likes (آخر action = like أو pass)
    const { data: likes } = await supabase
      .from('likes')
      .select('to_user, action, created_at')
      .eq('from_user', userId);

    const latestMap = new Map<string, any>();

    (likes ?? []).forEach((l: any) => {
      const existing = latestMap.get(l.to_user);

      if (!existing || new Date(l.created_at) > new Date(existing.created_at)) {
        latestMap.set(l.to_user, l);
      }
    });

    const actedOutIds: string[] = [];

    latestMap.forEach((val, key) => {
      if (val.action === 'like' || val.action === 'pass') {
        actedOutIds.push(key);
      }
    });

    return [...new Set([...blockedIds, ...actedOutIds])];
  }

  /**
   * 🔎 جلب المستخدمين من Supabase
   */
  private static async query(
    user: UserProfile,
    excludedIds: string[],
    opts?: Partial<DiscoveryFilters>
  ): Promise<any[]> {

    const oppositeGender = user.gender === 'male' ? 'female' : 'male';

    let q = supabase
      .from('profiles')
      .select(SELECT_COLS)
      .eq('gender', oppositeGender)
      .neq('id', user.id);

    // فلتر العمر
    if (opts?.ageMin != null && opts?.ageMax != null) {
      q = q.gte('age', opts.ageMin).lte('age', opts.ageMax);
    }

    // فلتر الموقع
    if (opts?.city && opts?.country) {
      q = q.eq('city', opts.city).eq('country', opts.country);
    } else if (opts?.country) {
      q = q.eq('country', opts.country);
    }

    // استبعاد
    if (excludedIds.length) {
      q = q.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data, error } = await q.limit(200);

    if (error) {
      console.error('[MatchingEngine]', error.message);
      return [];
    }

    return data ?? [];
  }

  /**
   * 🧠 ترتيب النتائج حسب الأولوية
   */
  private static rank(profiles: any[], user: UserProfile): any[] {
    return [...profiles].sort((a, b) => {

      // 1. نفس المدينة
      const cityA = (a.city === user.city && a.country === user.country) ? 3 : 0;
      const cityB = (b.city === user.city && b.country === user.country) ? 3 : 0;
      if (cityB !== cityA) return cityB - cityA;

      // 2. نفس الدولة
      const countryA = a.country === user.country ? 2 : 0;
      const countryB = b.country === user.country ? 2 : 0;
      if (countryB !== countryA) return countryB - countryA;

      // 3. جاهز الآن
      const readyA = a.readiness_level === READINESS_LEVEL_NOW ? 2 : 0;
      const readyB = b.readiness_level === READINESS_LEVEL_NOW ? 2 : 0;
      if (readyB !== readyA) return readyB - readyA;

      // 4. اكتمال الملف
      const compA = a.profile_completion_percent ?? 0;
      const compB = b.profile_completion_percent ?? 0;
      if (compB !== compA) return compB - compA;

      // 5. صورة
      const imgA = a.avatar_url ? 1 : 0;
      const imgB = b.avatar_url ? 1 : 0;
      return imgB - imgA;
    });
  }
}
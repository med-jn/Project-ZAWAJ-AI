// ══════════════════════════════════════════════════════════════
// types.ts — Filter types, defaults, persistence
// ══════════════════════════════════════════════════════════════

export interface DiscoveryFilters {
  ageMin: number; ageMax: number;
  country: string; city: string;
  heightMin: number; heightMax: number;
  weightMin: number; weightMax: number;
  nationality: string;
  marital_status: number[];
  education_level: number[];
  occupation_cat: number[];
  financial_status: string[];
  religious_commitment: number[];
  readiness_level: number[];
  quran_memorization: string[];
  beard_style: string[];
  prayer_commitment: string[];
  hijab_style: string[];
  polygamy_acceptance: string[];
  work_after_marriage: string[];
  housing_type: number[];
  preferred_housing: string[];
  travel_willingness: string[];
  desire_for_children: string[];
  health_status: string[];
  smoking: string[];
  skin_color: string[];
  social_type: string[];
  morning_evening: string[];
  conflict_style: string[];
  affection_style: string[];
  life_priority: string[];
  parenting_style: string[];
  relationship_with_family: string[];
  // 🆕 البحث بالمسافة
  radiusKm: number | null;        // null = مُعطَّل
  searchLat: number | null;
  searchLon: number | null;
}

export const DEFAULT_FILTERS: DiscoveryFilters = {
  ageMin: 18, ageMax: 60,
  country: '', city: '',
  heightMin: 140, heightMax: 210,
  weightMin: 40,  weightMax: 150,
  nationality: '',
  marital_status: [], education_level: [], occupation_cat: [],
  financial_status: [], religious_commitment: [], readiness_level: [],
  quran_memorization: [], beard_style: [], prayer_commitment: [],
  hijab_style: [], polygamy_acceptance: [], work_after_marriage: [],
  housing_type: [], preferred_housing: [], travel_willingness: [],
  desire_for_children: [], health_status: [], smoking: [], skin_color: [],
  social_type: [], morning_evening: [], conflict_style: [],
  affection_style: [], life_priority: [], parenting_style: [],
  relationship_with_family: [],
  radiusKm: null, searchLat: null, searchLon: null,
};

export const FILTER_STORAGE_KEY = 'zawaj_filters_v4';

export function loadFilters(): DiscoveryFilters {
  try {
    const raw = sessionStorage.getItem(FILTER_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_FILTERS };
    const parsed = JSON.parse(raw);
    // لا نحفظ إحداثيات البحث بين الجلسات — تُجدَّد دائماً
    return {
      ...DEFAULT_FILTERS,
      ...parsed,
      searchLat: null,
      searchLon: null,
      radiusKm: parsed.radiusKm ?? null,
    };
  } catch { return { ...DEFAULT_FILTERS }; }
}

export function saveFilters(f: DiscoveryFilters) {
  try { sessionStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(f)); } catch {}
}

export function clearFilters() {
  try { sessionStorage.removeItem(FILTER_STORAGE_KEY); } catch {}
}

export function filtersAreActive(f: DiscoveryFilters): boolean {
  const d = DEFAULT_FILTERS;
  return (
    f.ageMin !== d.ageMin || f.ageMax !== d.ageMax ||
    !!f.country || !!f.nationality ||
    f.heightMin !== d.heightMin || f.heightMax !== d.heightMax ||
    f.weightMin !== d.weightMin || f.weightMax !== d.weightMax ||
    f.radiusKm !== null ||
    f.marital_status.length > 0 || f.education_level.length > 0 ||
    f.occupation_cat.length > 0 || f.financial_status.length > 0 ||
    f.religious_commitment.length > 0 || f.readiness_level.length > 0 ||
    f.quran_memorization.length > 0 || f.beard_style.length > 0 ||
    f.prayer_commitment.length > 0 || f.hijab_style.length > 0 ||
    f.polygamy_acceptance.length > 0 || f.work_after_marriage.length > 0 ||
    f.housing_type.length > 0 || f.preferred_housing.length > 0 ||
    f.travel_willingness.length > 0 || f.desire_for_children.length > 0 ||
    f.health_status.length > 0 || f.smoking.length > 0 ||
    f.skin_color.length > 0 || f.social_type.length > 0 ||
    f.morning_evening.length > 0 || f.conflict_style.length > 0 ||
    f.affection_style.length > 0 || f.life_priority.length > 0 ||
    f.parenting_style.length > 0 || f.relationship_with_family.length > 0
  );
}

// عدد الفلاتر النشطة لكل قسم
export function sectionCounts(f: DiscoveryFilters, d = DEFAULT_FILTERS) {
  return {
    basics: [
      f.ageMin !== d.ageMin || f.ageMax !== d.ageMax,
      !!f.country, !!f.nationality,
      f.marital_status.length > 0,
    ].filter(Boolean).length,

    location: [
      f.radiusKm !== null,
    ].filter(Boolean).length,

    body: [
      f.heightMin !== d.heightMin || f.heightMax !== d.heightMax,
      f.weightMin !== d.weightMin || f.weightMax !== d.weightMax,
      f.skin_color.length > 0,
    ].filter(Boolean).length,

    education: [
      f.education_level.length > 0,
      f.occupation_cat.length > 0,
      f.financial_status.length > 0,
    ].filter(Boolean).length,

    religion: [
      f.religious_commitment, f.readiness_level, f.quran_memorization,
      f.beard_style, f.prayer_commitment, f.hijab_style,
      f.polygamy_acceptance, f.work_after_marriage,
    ].filter(v => Array.isArray(v) && v.length > 0).length,

    life: [
      f.housing_type, f.preferred_housing, f.travel_willingness,
      f.desire_for_children, f.health_status, f.smoking,
    ].filter(v => Array.isArray(v) && v.length > 0).length,

    personality: [
      f.social_type, f.morning_evening, f.conflict_style,
      f.affection_style, f.life_priority, f.parenting_style,
      f.relationship_with_family,
    ].filter(v => Array.isArray(v) && v.length > 0).length,
  };
}
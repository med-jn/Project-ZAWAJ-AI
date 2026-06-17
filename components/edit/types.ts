// components/edit/types.ts
// نوع بيانات نموذج التعديل — مشتق من profile مباشرة
export interface EditForm {
  // ── مقفولة (للعرض فقط) ──────────────────────
  full_name:              string;
  gender:                 'male' | 'female' | '';
  birth_date:             string;
  nationality:            string;

  // ── قابلة للتعديل ────────────────────────────
  country:                string;
  city:                   string;
  phone:                  string;
  latitude:               number | null;
  longitude:              number | null;

  marital_status:         number | null;
  education_level:        number | null;
  occupation_category_id: number | null;
  occupation_id:          number | null;
  financial_status:       string;
  religious_commitment:   number | null;
  readiness_level:        number | null;

  children_count:         number;
  children_custody:       string;
  quran_memorization:     string;
  beard_style:            string;
  prayer_commitment:      string;
  hijab_style:            string;
  work_after_marriage:    string;
  polygamy_acceptance:    string;

  housing_type:           number | null;
  preferred_housing:      string;
  health_status:          string;
  health_habits:          string[];
  height:                 string;
  weight:                 string;
  smoking:                string;
  skin_color:             string;
  travel_willingness:     string;
  desire_for_children:    string;

  social_type:            string;
  morning_evening:        string;
  home_time:              string;
  conflict_style:         string;
  affection_style:        string;
  life_priority:          string;
  parenting_style:        string;
  relationship_with_family: string;

  interests:              string[];
  bio:                    string;
  partner_requirements:   string;

  is_photos_blurred:      boolean;
  show_photos:            boolean;
}

export const fromProfile = (p: any): EditForm => ({
  full_name:              p.full_name              ?? '',
  gender:                 p.gender                 ?? '',
  birth_date:             p.birth_date             ?? '',
  nationality:            p.nationality            ?? '',
  country:                p.country                ?? '',
  city:                   p.city                   ?? '',
  phone:                  p.phone                  ?? '',
  latitude:               p.latitude               ?? null,
  longitude:              p.longitude              ?? null,
  marital_status:         p.marital_status         ?? null,
  education_level:        p.education_level        ?? null,
  occupation_category_id: p.occupation_category_id ?? null,
  occupation_id:          p.occupation_id          ?? null,
  financial_status:       p.financial_status       ?? '',
  religious_commitment:   p.religious_commitment   ?? null,
  readiness_level:        p.readiness_level        ?? null,
  children_count:         p.children_count         ?? 0,
  children_custody:       p.children_custody       ?? '',
  quran_memorization:     p.quran_memorization     ?? '',
  beard_style:            p.beard_style            ?? '',
  prayer_commitment:      p.prayer_commitment      ?? '',
  hijab_style:            p.hijab_style            ?? '',
  work_after_marriage:    p.work_after_marriage    ?? '',
  polygamy_acceptance:    p.polygamy_acceptance    ?? '',
  housing_type:           p.housing_type           ?? null,
  preferred_housing:      p.preferred_housing      ?? '',
  health_status:          p.health_status          ?? '',
  health_habits:          p.health_habits          ?? [],
  height:                 p.height ? String(p.height) : '',
  weight:                 p.weight ? String(p.weight) : '',
  smoking:                p.smoking                ?? '',
  skin_color:             p.skin_color             ?? '',
  travel_willingness:     p.travel_willingness     ?? '',
  desire_for_children:    p.desire_for_children    ?? '',
  social_type:            p.social_type            ?? '',
  morning_evening:        p.morning_evening        ?? '',
  home_time:              p.home_time              ?? '',
  conflict_style:         p.conflict_style         ?? '',
  affection_style:        p.affection_style        ?? '',
  life_priority:          p.life_priority          ?? '',
  parenting_style:        p.parenting_style        ?? '',
  relationship_with_family: p.relationship_with_family ?? '',
  interests:              p.interests              ?? [],
  bio:                    p.bio                    ?? '',
  partner_requirements:   p.partner_requirements   ?? '',
  is_photos_blurred:      p.is_photos_blurred      ?? false,
  show_photos:            p.show_photos            ?? true,
});
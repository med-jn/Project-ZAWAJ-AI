export type Gender = 'male' | 'female' | '';

export interface FD {
  full_name: string; gender: Gender; birth_date: string;
  marital_status: number | null; nationality: string;
  country: string; city: string; education_level: number | null;
  occupation_category_id: number | null; occupation_id: number | null;
  financial_status: string; religious_commitment: number | null;
  readiness_level: number | null;
  children_count: number; children_custody: string;
  quran_memorization: string; beard_style: string; prayer_commitment: string;
  hijab_style: string; work_after_marriage: string; polygamy_acceptance: string;
  housing_type: number | null; preferred_housing: string;
  health_status: string; health_habits: string[];
  height: string; weight: string; smoking: string;
  skin_color: string; travel_willingness: string; desire_for_children: string;
  social_type: string; morning_evening: string; home_time: string;
  conflict_style: string; affection_style: string; life_priority: string;
  parenting_style: string; relationship_with_family: string;
  interests: string[]; bio: string; partner_requirements: string;
  avatar_url: string; is_photos_blurred: boolean; show_photos: boolean; phone: string;
  latitude: number | null; longitude: number | null;
}

export const INIT: FD = {
  full_name: '', gender: '', birth_date: '', marital_status: null, nationality: '',
  country: '', city: '', education_level: null, occupation_category_id: null,
  occupation_id: null, financial_status: '', religious_commitment: null, readiness_level: null,
  children_count: 0, children_custody: '', quran_memorization: '', beard_style: '',
  prayer_commitment: '', hijab_style: '', work_after_marriage: '', polygamy_acceptance: '',
  housing_type: null, preferred_housing: '', health_status: '', health_habits: [],
  height: '', weight: '', smoking: '', skin_color: '', travel_willingness: '',
  desire_for_children: '', social_type: '', morning_evening: '', home_time: '',
  conflict_style: '', affection_style: '', life_priority: '', parenting_style: '',
  relationship_with_family: '', interests: [], bio: '', partner_requirements: '',
  avatar_url: '', is_photos_blurred: false, show_photos: true, phone: '',
  latitude: null, longitude: null,
};
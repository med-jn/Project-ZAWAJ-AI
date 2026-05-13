export interface MediatorRow {
  id:                string;
  full_name:         string;
  avatar_url:        string | null;
  bio:               string | null;
  city:              string | null;
  country:           string | null;
  success_count:     number;
  mediator_level:    string;        // محتفظ به للتوافق — لا يُستخدم للبادج
  avg_rating:        number;
  rating_count:      number;
  male_count:        number;
  female_count:      number;
  total_subscribers: number;        // يغذي LevelBadge + العداد التاريخي
  isSubscribed:      boolean;
  whatsapp:          string | null; // رقم واتساب (مع كود الدولة)
  tiktok:            string | null; // اسم المستخدم على تيك توك
}

export interface Subscriber {
  id:                         string;
  full_name:                  string;
  avatar_url:                 string | null;
  age:                        number | null;
  city:                       string | null;
  gender:                     string;
  profile_completion_percent: number;
}

export interface SuccessData {
  mediatorName: string;
  userName:     string;
  coins:        number;
  subscribedAt: Date;
  expiresAt:    Date;
}

export interface CurrentUser {
  id:          string;
  full_name:   string | null;
  gender:      string;
  mediator_id: string | null;
}
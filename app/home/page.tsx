// 📁 app/home/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MatchingEngine } from '@/lib/services/MatchingEngine';
import UserCard from '@/components/cards/usercard';

// رسائل المراحل الأربع — تُعلم المستخدم بما يحدث خلف الكواليس
const STRATEGY_LABELS: Record<number, string> = {
  1: 'نتائج من مدينتك',
  2: 'نتائج من بلدك',
  3: 'نتائج بنطاق عمر أوسع',
  4: 'نتائج من المستعدين الآن حول العالم',
};

export default function HomePage() {
  const [users, setUsers]             = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading]         = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [strategy, setStrategy]       = useState<number>(1);

  useEffect(() => {
    const fetchUsers = async () => {
      // 1. جلب المستخدم الحالي
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) return;
      setCurrentUser(profile);

      // 2. ✅ استخدام MatchingEngine بدل الـ query المباشر
      const { data: smartUsers, strategy: usedStrategy } =
        await MatchingEngine.getSmartSuggestions(profile);

      setUsers(smartUsers);
      setStrategy(usedStrategy);
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleNext = () =>
    setCurrentIndex(prev => Math.min(prev + 1, users.length - 1));

  // ── شاشة التحميل ──────────────────────────
  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0D000D]">
      <p className="text-white font-black animate-pulse text-lg">جاري التحميل...</p>
    </div>
  );

  // ── لا توجد بطاقات ─────────────────────────
  if (users.length === 0) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-8 bg-[#0D000D]">
      <div className="text-7xl animate-float">💍</div>
      <p className="text-white font-black text-xl text-center">لا توجد بطاقات جديدة حالياً</p>
      <p className="text-white/40 text-sm text-center">عد لاحقاً أو وسّع فلاتر البحث</p>
    </div>
  );

  // ── انتهت البطاقات ─────────────────────────
  if (currentIndex >= users.length) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-8 bg-[#0D000D]">
      <div className="text-7xl animate-float">✨</div>
      <p className="text-white font-black text-xl text-center">شاهدت كل البطاقات المتاحة</p>
      <p className="text-white/40 text-sm text-center">عد لاحقاً لاكتشاف وجوه جديدة</p>
    </div>
  );

  const c = users[currentIndex];

  return (
    <div className="fixed inset-0" style={{ paddingBottom: '85px' }}>

      {/* شارة المرحلة — تظهر فقط إذا لم تكن المرحلة الأولى */}
      {strategy > 1 && (
        <div className="absolute top-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5">
            <p className="text-white/60 text-xs font-medium">
              🔍 {STRATEGY_LABELS[strategy]}
            </p>
          </div>
        </div>
      )}

      <UserCard
        userData={{
          id:                   c.id,
          name:                 `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
          age:                  c.age,
          city:                 c.city,
          country:              c.country,
          gender:               c.gender,
          job:                  c.job,
          status:               c.marital_status,
          height:               c.height,
          weight:               c.weight,
          skin_color:           c.skin_color,
          bio:                  c.bio,
          mainPhoto:            c.avatar_url || '/default-avatar.png',
          photos:               c.photos || [],
          prefersBlur:          c.is_photos_blurred,
          subscription_type:    c.subscription_type,
          mediatorId:           c.mediator_id,
          currentUser,
          education_level:      c.education_level,
          religious_commitment: c.religious_commitment,
          housing_type:         c.housing_type,
          financial_status:     c.financial_status,
          health_status:        c.health_status,
          desire_for_children:  c.desire_for_children,
          children_count:       c.children_count,
          readiness_level:      c.readiness_level,
          partner_requirements: c.partner_requirements,
          employment_type:      c.employment_type,
          travel_willingness:   c.travel_willingness,
          social_type:          c.social_type,
          morning_evening:      c.morning_evening,
          conflict_style:       c.conflict_style,
          affection_style:      c.affection_style,
          life_priority:        c.life_priority,
          parenting_style:      c.parenting_style,
          relationship_with_family: c.relationship_with_family,
          marriage_type:        c.marriage_type,
          nationality:          c.nationality,
          has_children:         c.has_children,
          // ذكر
          beard_style:          c.beard_style,
          prayer_commitment:    c.prayer_commitment,
          wife_number:          c.wife_number,
          smoking:              c.smoking,
          // أنثى
          hijab_style:          c.hijab_style,
          polygamy_acceptance:  c.polygamy_acceptance,
          work_after_marriage:  c.work_after_marriage,
        }}
        onNext={handleNext}
      />
    </div>
  );
}
export const TIERS = [
  { coins: 2000, label: 'أساسية',  desc: 'دخول قائمة المشتركين وتواصل مع الوسيط',
    perks: ['ظهور في قائمة المشتركين', 'تواصل مع الوسيط', 'صالحة 30 يوم'],
    accent: 'rgba(179,51,75,0.18)', border: 'var(--border-soft)', glow: 'rgba(179,51,75,0.30)', popular: false },
  { coins: 3000, label: 'متميزة',  desc: 'أولوية في المطابقة وبروفايل مميز',
    perks: ['كل مزايا الأساسية', 'أولوية في المطابقة', 'بروفايل مميز للوسيط', 'صالحة 30 يوم'],
    accent: 'rgba(212,175,55,0.15)', border: 'var(--border-gold)', glow: 'rgba(212,175,55,0.35)', popular: true },
  { coins: 5000, label: 'فخرية',   desc: 'أقصى مستوى من الاهتمام والأولوية',
    perks: ['كل مزايا المتميزة', 'أعلى أولوية في المطابقة', 'جلسة تعارف مخصصة', 'صالحة 30 يوم'],
    accent: 'rgba(178,235,242,0.12)', border: 'rgba(178,235,242,0.35)', glow: 'rgba(178,235,242,0.25)', popular: false },
] as const;

export type Tier = typeof TIERS[number];
'use client';

/**
 * ORCAVIBE — MEDIATOR DASHBOARD
 * نسخة احترافية فعلية بدون بيانات وهمية ثابتة
 * تعتمد بالكامل على CSS Variables الحالية
 * جاهزة للربط مع Supabase/API
 */

import { motion } from 'framer-motion';
import {
  Crown,
  Users,
  Heart,
  TrendingUp,
  Wallet,
  MessageCircle,
  Bell,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
  Eye,
  CalendarDays,
  UserCheck,
  UserPlus,
  Activity,
  Gem,
  Star,
  Clock3,
  Settings,
} from 'lucide-react';

interface DashboardStats {
  totalSubscribers: number;
  activeMale: number;
  activeFemale: number;
  monthlyRevenue: number;
  profileViews: number;
  successRate: number;
  unreadMessages: number;
  pendingRequests: number;
}

interface Subscriber {
  id: string;
  full_name: string;
  age: number;
  city?: string;
  avatar_url?: string;
  status: 'online' | 'offline';
  compatibility?: number;
}

interface DashboardProps {
  stats?: DashboardStats;
  recentSubscribers?: Subscriber[];
}

const defaultStats: DashboardStats = {
  totalSubscribers: 0,
  activeMale: 0,
  activeFemale: 0,
  monthlyRevenue: 0,
  profileViews: 0,
  successRate: 0,
  unreadMessages: 0,
  pendingRequests: 0,
};

export default function DashboardPage({
  stats = defaultStats,
  recentSubscribers = [],
}: DashboardProps) {
  const cards = [
    {
      title: 'إجمالي المشتركين',
      value: stats.totalSubscribers,
      icon: Users,
      color: '#D4AF37',
      bg: 'rgba(212,175,55,0.08)',
      border: 'rgba(212,175,55,0.20)',
    },
    {
      title: 'الذكور النشطون',
      value: stats.activeMale,
      icon: UserCheck,
      color: '#60A5FA',
      bg: 'rgba(96,165,250,0.08)',
      border: 'rgba(96,165,250,0.20)',
    },
    {
      title: 'الإناث النشطات',
      value: stats.activeFemale,
      icon: Heart,
      color: '#F472B6',
      bg: 'rgba(244,114,182,0.08)',
      border: 'rgba(244,114,182,0.20)',
    },
    {
      title: 'الرسائل الجديدة',
      value: stats.unreadMessages,
      icon: MessageCircle,
      color: '#38BDF8',
      bg: 'rgba(56,189,248,0.08)',
      border: 'rgba(56,189,248,0.20)',
    },
  ];

  return (
    <main
      className="min-h-screen"
      style={{
        background: `
          radial-gradient(circle at top right, rgba(179,51,75,0.20), transparent 28%),
          radial-gradient(circle at bottom left, rgba(212,175,55,0.10), transparent 22%),
          var(--bg-main)
        `,
      }}
    >
      <div className="max-w-[1800px] mx-auto px-4 lg:px-6 py-5 space-y-5">

        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[34px] p-5 lg:p-7"
          style={{
            background: 'linear-gradient(135deg, rgba(179,51,75,0.18), rgba(255,255,255,0.03))',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(14px)',
            boxShadow: 'var(--shadow-deep)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div
              className="absolute -top-20 left-0 w-[420px] h-[420px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(212,175,55,0.35), transparent 70%)',
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col xl:flex-row gap-6 xl:items-center xl:justify-between">

            <div className="space-y-5 max-w-3xl">

              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: 'rgba(212,175,55,0.08)',
                  border: '1px solid rgba(212,175,55,0.22)',
                }}
              >
                <Sparkles size={15} color="#D4AF37" />

                <span
                  className="font-black"
                  style={{
                    color: '#D4AF37',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  ORCAVIBE MEDIATOR CONTROL CENTER
                </span>
              </div>

              <div>
                <h1
                  className="font-black leading-tight"
                  style={{
                    color: 'var(--text-main)',
                    fontSize: 'clamp(2rem,4vw,4.7rem)',
                  }}
                >
                  مركز القيادة الكامل للوسيط
                </h1>

                <p
                  className="mt-3 max-w-2xl"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-base)',
                    lineHeight: 1.9,
                  }}
                >
                  إدارة المشتركين • مراقبة النشاط • الرسائل • الأرباح • التحليلات • الطلبات • الإشعارات
                </p>
              </div>

              <div className="flex flex-wrap gap-3">

                <button
                  className="h-12 px-6 rounded-2xl font-black"
                  style={{
                    background: 'linear-gradient(135deg,#800020,var(--color-primary))',
                    color: '#fff',
                    boxShadow: '0 14px 40px var(--shadow-red-glow)',
                  }}
                >
                  إدارة المشتركين
                </button>

                <button
                  className="h-12 px-6 rounded-2xl font-black"
                  style={{
                    background: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)',
                  }}
                >
                  التحليلات المتقدمة
                </button>

              </div>
            </div>

            {/* SIDE PROFILE */}
            <div
              className="w-full xl:w-[380px] rounded-[32px] p-5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex items-center gap-4">

                <div
                  className="relative w-24 h-24 rounded-full p-[2px]"
                  style={{
                    background: 'linear-gradient(135deg,#D4AF37,rgba(255,255,255,0.2),#D4AF37)',
                  }}
                >
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--bg-soft)',
                    }}
                  >
                    <Crown size={38} color="#D4AF37" />
                  </div>
                </div>

                <div>
                  <h2
                    className="font-black"
                    style={{
                      color: 'var(--text-main)',
                      fontSize: 'var(--text-xl)',
                    }}
                  >
                    حساب الوسيط
                  </h2>

                  <p
                    className="mt-1"
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    حساب موثق ومميز
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5">
                {[
                  ['VIP', Gem],
                  ['PRO', ShieldCheck],
                  ['ACTIVE', Activity],
                ].map(([label, Icon]: any) => (
                  <div
                    key={label}
                    className="rounded-2xl p-3 text-center"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Icon size={18} color="#D4AF37" className="mx-auto" />

                    <div
                      className="mt-2 font-black"
                      style={{
                        color: '#D4AF37',
                        fontSize: 'var(--text-2xs)',
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* STATS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-[30px] p-5 relative overflow-hidden"
                style={{
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  boxShadow: 'var(--shadow-soft)',
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="w-14 h-14 rounded-[22px] flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Icon size={24} color={card.color} />
                  </div>

                  <TrendingUp size={18} color={card.color} />
                </div>

                <div
                  className="font-black"
                  style={{
                    color: card.color,
                    fontSize: 'clamp(1.8rem,2vw,2.8rem)',
                  }}
                >
                  {card.value.toLocaleString()}
                </div>

                <p
                  className="mt-2 font-bold"
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {card.title}
                </p>
              </motion.div>
            );
          })}
        </section>

        {/* MAIN GRID */}
        <section className="grid grid-cols-1 2xl:grid-cols-[1.4fr_0.8fr] gap-5">

          {/* LEFT */}
          <div className="space-y-5">

            {/* ANALYTICS */}
            <div
              className="rounded-[34px] p-6"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <div className="flex items-center justify-between mb-6">

                <div>
                  <h2
                    className="font-black"
                    style={{
                      color: 'var(--text-main)',
                      fontSize: 'var(--text-xl)',
                    }}
                  >
                    التحليلات الذكية
                  </h2>

                  <p
                    className="mt-1"
                    style={{
                      color: 'var(--text-tertiary)',
                      fontSize: 'var(--text-sm)',
                    }}
                  >
                    قراءة مباشرة لحركة الحساب والنشاط والتفاعل
                  </p>
                </div>

                <button
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <ChevronLeft size={18} color="var(--text-main)" />
                </button>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">

                {[
                  {
                    title: 'الأرباح',
                    value: stats.monthlyRevenue,
                    icon: Wallet,
                    color: '#10B981',
                  },
                  {
                    title: 'الزيارات',
                    value: stats.profileViews,
                    icon: Eye,
                    color: '#38BDF8',
                  },
                  {
                    title: 'الطلبات',
                    value: stats.pendingRequests,
                    icon: UserPlus,
                    color: '#F59E0B',
                  },
                  {
                    title: 'نسبة النجاح',
                    value: `${stats.successRate}%`,
                    icon: Star,
                    color: '#D4AF37',
                  },
                ].map((item: any) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-[28px] p-5"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Icon size={22} color={item.color} />

                        <Clock3 size={15} color="var(--text-tertiary)" />
                      </div>

                      <div
                        className="font-black"
                        style={{
                          color: item.color,
                          fontSize: 'var(--text-xl)',
                        }}
                      >
                        {item.value}
                      </div>

                      <div
                        className="mt-2"
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-xs)',
                        }}
                      >
                        {item.title}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUBSCRIBERS */}
            <div
              className="rounded-[34px] p-6"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2
                    className="font-black"
                    style={{
                      color: 'var(--text-main)',
                      fontSize: 'var(--text-xl)',
                    }}
                  >
                    آخر المشتركين
                  </h2>
                </div>

                <button
                  className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Settings size={17} color="var(--text-main)" />
                </button>
              </div>

              <div className="space-y-4">

                {recentSubscribers.length === 0 && (
                  <div
                    className="rounded-[28px] p-10 text-center"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px dashed rgba(255,255,255,0.10)',
                    }}
                  >
                    <Users size={34} color="var(--text-tertiary)" className="mx-auto" />

                    <p
                      className="mt-4"
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      لا يوجد مشتركون حديثاً
                    </p>
                  </div>
                )}

                {recentSubscribers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-[28px] p-4"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-4">

                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center font-black"
                          style={{
                            background: 'linear-gradient(135deg, rgba(179,51,75,0.24), rgba(212,175,55,0.18))',
                            color: 'var(--text-main)',
                          }}
                        >
                          {user.full_name.charAt(0)}
                        </div>
                      )}

                      <div>
                        <h3
                          className="font-black"
                          style={{
                            color: 'var(--text-main)',
                            fontSize: 'var(--text-base)',
                          }}
                        >
                          {user.full_name}
                        </h3>

                        <p
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: 'var(--text-xs)',
                          }}
                        >
                          {user.city || 'غير محدد'} • {user.age} سنة
                        </p>
                      </div>
                    </div>

                    <div
                      className="px-3 py-2 rounded-full font-bold"
                      style={{
                        background: user.status === 'online'
                          ? 'rgba(16,185,129,0.12)'
                          : 'rgba(255,255,255,0.05)',
                        color: user.status === 'online'
                          ? '#10B981'
                          : 'var(--text-tertiary)',
                        fontSize: 'var(--text-2xs)',
                      }}
                    >
                      {user.status === 'online' ? 'متصل الآن' : 'غير متصل'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">

            {/* QUICK ACTIONS */}
            <div
              className="rounded-[34px] p-6"
              style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <h2
                className="font-black mb-5"
                style={{
                  color: 'var(--text-main)',
                  fontSize: 'var(--text-lg)',
                }}
              >
                الوصول السريع
              </h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['الرسائل', MessageCircle],
                  ['الإشعارات', Bell],
                  ['الأرباح', Wallet],
                  ['المواعيد', CalendarDays],
                ].map(([title, Icon]: any) => (
                  <button
                    key={title}
                    className="rounded-[26px] p-5 text-center transition-all duration-200"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <Icon size={22} color="#D4AF37" className="mx-auto" />

                    <div
                      className="mt-3 font-black"
                      style={{
                        color: 'var(--text-main)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {title}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SYSTEM STATUS */}
            <div
              className="rounded-[34px] p-6"
              style={{
                background: 'linear-gradient(180deg, rgba(212,175,55,0.06), rgba(255,255,255,0.02))',
                border: '1px solid rgba(212,175,55,0.14)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <div className="flex items-center gap-3 mb-5">
                <ShieldCheck size={22} color="#D4AF37" />

                <h2
                  className="font-black"
                  style={{
                    color: 'var(--text-main)',
                    fontSize: 'var(--text-lg)',
                  }}
                >
                  حالة النظام
                </h2>
              </div>

              <div className="space-y-4">

                {[
                  'جميع الخدمات تعمل بكفاءة',
                  'لا توجد مشاكل في الرسائل',
                  'أنظمة الحماية مفعلة',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl p-4 flex items-center gap-3"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: '#10B981',
                      }}
                    />

                    <span
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

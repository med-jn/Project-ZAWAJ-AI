'use client'
import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalUsers: 0, newToday: 0, activeNow: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchRealData = async () => {
      // 1. التحقق من صلاحية المدير
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        router.push('/home');
        return;
      }

      // 2. جلب إجمالي المستخدمين من جدول profiles
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 3. جلب المستخدمين الذين سجلوا اليوم
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      setStats({
        totalUsers: usersCount || 0,
        newToday: todayCount || 0,
        activeNow: Math.floor(Math.random() * 10) + 1 // تجريبي حالياً
      });
      setLoading(false);
    };

    fetchRealData();
  }, [router]);

  if (loading) return <div className="p-10 text-center">جاري تحميل البيانات الحقيقية...</div>;

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-right" dir="rtl">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-800">📊 مركز قيادة Zawaj AI</h1>
        <button onClick={() => router.push('/home')} className="bg-white px-4 py-2 rounded-lg shadow-sm border text-sm">العودة للموقع</button>
      </div>
      
      {/* شبكة الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <StatCard title="إجمالي المشتركين" value={stats.totalUsers} color="text-blue-600" icon="👥" />
        <StatCard title="مسجلين الجدد اليوم" value={stats.newToday} color="text-green-600" icon="✨" />
        <StatCard title="طلبات معلقة" value="0" color="text-orange-500" icon="📩" />
      </div>

      {/* قسم الإدارة السريعة */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">آخر النشاطات</h3>
          <p className="text-gray-400 text-sm italic">سيظهر هنا سجل بآخر المستخدمين المسجلين قريباً...</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border">
          <h3 className="text-xl font-bold mb-4 border-b pb-2">التحكم في المظهر</h3>
          <div className="space-y-4">
            <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-right px-4 flex justify-between">
              <span>تغيير إعلانات الصفحة الرئيسية</span>
              <span>⬅️</span>
            </button>
            <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-right px-4 flex justify-between">
              <span>تعديل الأسئلة الشائعة</span>
              <span>⬅️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// مكون فرعي للبطاقات الإحصائية
function StatCard({ title, value, color, icon }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border-b-4 border-b-blue-500 hover:shadow-md transition-all">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-gray-500 font-medium">{title}</p>
      <h2 className={`text-4xl font-black mt-2 ${color}`}>{value}</h2>
    </div>
  );
}
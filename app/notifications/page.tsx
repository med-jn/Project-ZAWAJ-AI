'use client';
import { useState, useEffect } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      // تعليم الكل كمقروء
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(data || []);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const getNotifIcon = (type: string) => {
    const icons: Record<string, string> = {
      like: '❤️',
      message: '💬',
      match: '💍',
      system: '🔔',
    };
    return icons[type] || '🔔';
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-white animate-pulse font-black">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black text-white mb-6">الإشعارات</h1>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Bell size={48} className="text-white/20" />
          <p className="text-white/40 font-bold">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                notif.is_read
                  ? 'bg-white/5 border-white/5'
                  : 'bg-[#c0002a]/10 border-[#c0002a]/20'
              }`}
            >
              <span className="text-2xl">{getNotifIcon(notif.type)}</span>
              <div className="flex-1">
                <p className="text-white text-sm font-bold">{notif.type}</p>
                <p className="text-white/40 text-xs mt-1">
                  {new Date(notif.created_at).toLocaleDateString('ar-TN')}
                </p>
              </div>
              {!notif.is_read && (
                <div className="w-2 h-2 rounded-full bg-[#c0002a] mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
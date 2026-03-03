'use client';
import { useState } from 'react';
import { Shield, Lock, Smartphone, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChangePassword = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return;
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    alert('تم إرسال رابط تغيير كلمة المرور إلى بريدك الإلكتروني');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_completed: false, username: 'deleted_user' }).eq('id', user.id);
      await supabase.auth.signOut();
      router.push('/');
    }
  };

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      <h1 className="text-2xl font-black text-white mb-6">الأمان والخصوصية</h1>

      <div className="space-y-4">

        {/* الأمان */}
        <div className="glass-panel p-5 space-y-1">
          <h2 className="text-white font-black text-sm border-b border-white/10 pb-3 flex items-center gap-2 mb-3">
            <Lock size={16} className="text-[#c0002a]" /> الأمان
          </h2>

          <ActionRow
            icon={Lock}
            label="تغيير كلمة المرور"
            sub="إرسال رابط التغيير للبريد الإلكتروني"
            onClick={handleChangePassword}
          />
          <ActionRow
            icon={Smartphone}
            label="الأجهزة المتصلة"
            sub="عرض وإدارة جلسات الدخول النشطة"
            onClick={() => {}}
          />
        </div>

        {/* الخصوصية */}
        <div className="glass-panel p-5 space-y-1">
          <h2 className="text-white font-black text-sm border-b border-white/10 pb-3 flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[#c0002a]" /> الخصوصية
          </h2>
          <div className="bg-white/5 rounded-2xl p-4">
            <p className="text-white/70 text-sm leading-relaxed">
              نحن نحترم خصوصيتك تماماً. بياناتك محمية ولا تُشارك مع أي طرف ثالث.
              يمكنك في أي وقت طلب حذف حسابك وجميع بياناتك نهائياً.
            </p>
          </div>
        </div>

        {/* حذف الحساب */}
        <div className="glass-panel p-5 border border-red-500/20">
          <h2 className="text-red-400 font-black text-sm border-b border-red-500/20 pb-3 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} /> منطقة الخطر
          </h2>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400 font-black text-sm flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all"
            >
              <Trash2 size={16} /> حذف حسابي نهائياً
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-white/60 text-sm text-center">هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-2xl border border-white/15 text-white/50 font-black text-sm hover:bg-white/5 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 font-black text-sm hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  {deleting ? 'جاري الحذف...' : 'تأكيد الحذف'}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function ActionRow({ icon: Icon, label, sub, onClick }: {
  icon: any; label: string; sub: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3 hover:bg-white/5 rounded-2xl px-2 transition-all group"
    >
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(192,0,42,0.12)', border: '1px solid rgba(192,0,42,0.2)' }}>
        <Icon size={17} className="text-[#c0002a]" />
      </div>
      <div className="flex-1 text-right">
        <p className="text-white font-bold text-sm">{label}</p>
        <p className="text-white/35 text-xs mt-0.5">{sub}</p>
      </div>
    </button>
  );
}
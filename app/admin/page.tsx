'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

const ADMIN_EMAIL = 'mohamed.jouini029@gmail.com';

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  // إحصائيات
  const [stats, setStats] = useState({
    total_users: 0,
    completed_profiles: 0,
    pending_reports: 0,
    new_today: 0,
  });

  // إعدادات الموقع
  const [settings, setSettings] = useState({
    app_name: 'ZAWAJ AI',
    app_slogan: 'مستقبل الزواج الذكي',
    logo_url: '',
    primary_color: '#800020',
  });

  // المستخدمون
  const [users, setUsers] = useState<any[]>([]);
  const [usersPage, setUsersPage] = useState(0);

  // البلاغات
  const [reports, setReports] = useState<any[]>([]);

  // الاهتمامات
  const [interests, setInterests] = useState<any[]>([]);
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) { router.push('/'); return; }
      await loadAll();
      setLoading(false);
    };
    init();
  }, []);

  const loadAll = async () => {
    // إعدادات
    const { data: stg } = await supabase.from('site_settings').select('*').eq('id', 1).single();
    if (stg) setSettings(stg);

    // إحصائيات
    const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: completed } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_completed', true);
    const { count: pending } = await supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const today = new Date().toISOString().split('T')[0];
    const { count: newToday } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('updated_at', today);

    setStats({
      total_users: total || 0,
      completed_profiles: completed || 0,
      pending_reports: pending || 0,
      new_today: newToday || 0,
    });

    // مستخدمون
    const { data: usersData } = await supabase.from('profiles').select('id, username, gender, city, country, is_completed, updated_at').order('updated_at', { ascending: false }).range(0, 19);
    setUsers(usersData || []);

    // بلاغات
    const { data: reps } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
    setReports(reps || []);

    // اهتمامات
    const { data: ints } = await supabase.from('interests_options').select('*').order('created_at');
    setInterests(ints || []);
  };

  const saveSettings = async () => {
    setSaving(true);
    const { error } = await supabase.from('site_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', 1);
    setSaving(false);
    setMsg(error ? '❌ حدث خطأ' : '✅ تم الحفظ بنجاح');
    setTimeout(() => setMsg(''), 3000);
  };

  const updateReportStatus = async (id: string, status: string) => {
    await supabase.from('reports').update({ status }).eq('id', id);
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const addInterest = async () => {
    if (!newInterest.trim()) return;
    const { data } = await supabase.from('interests_options').insert({ label: newInterest.trim() }).select().single();
    if (data) { setInterests(prev => [...prev, data]); setNewInterest(''); }
  };

  const toggleInterest = async (id: string, is_active: boolean) => {
    await supabase.from('interests_options').update({ is_active: !is_active }).eq('id', id);
    setInterests(prev => prev.map(i => i.id === id ? { ...i, is_active: !is_active } : i));
  };

  const deleteInterest = async (id: string) => {
    await supabase.from('interests_options').delete().eq('id', id);
    setInterests(prev => prev.filter(i => i.id !== id));
  };

  const deleteUser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#800020', fontSize: '1.2rem' }}>
      جاري التحميل...
    </div>
  );

  const tabStyle = (tab: string): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif', fontSize: '0.9rem', fontWeight: '600',
    background: activeTab === tab ? '#800020' : 'rgba(255,255,255,0.05)',
    color: activeTab === tab ? '#fff' : 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s',
  });

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px', color: '#fff',
    fontFamily: 'Cairo, sans-serif', fontSize: '0.95rem',
    outline: 'none', direction: 'rtl', boxSizing: 'border-box',
  };

  const lbl = (text: string) => (
    <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', display: 'block', marginBottom: '6px' }}>{text}</label>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>

      {/* الشريط العلوي */}
      <div style={{ background: 'rgba(128,0,32,0.15)', borderBottom: '1px solid rgba(128,0,32,0.3)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: '900', color: '#fff' }}>⚙️ لوحة الإدارة</span>
          <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(128,0,32,0.3)', padding: '3px 10px', borderRadius: '20px' }}>ZAWAJ AI</span>
        </div>
        <button onClick={() => router.push('/')} style={{ ...tabStyle(''), background: 'rgba(255,255,255,0.05)' }}>
          ← الخروج
        </button>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 65px)' }}>

        {/* القائمة الجانبية */}
        <div style={{ width: '220px', background: 'rgba(255,255,255,0.02)', borderLeft: '1px solid rgba(255,255,255,0.07)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          {[
            { key: 'dashboard', icon: '📊', label: 'الإحصائيات' },
            { key: 'settings', icon: '🎨', label: 'إعدادات التطبيق' },
            { key: 'users', icon: '👥', label: 'المستخدمون' },
            { key: 'reports', icon: '🚨', label: `البلاغات ${stats.pending_reports > 0 ? `(${stats.pending_reports})` : ''}` },
            { key: 'interests', icon: '❤️', label: 'الاهتمامات' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={tabStyle(tab.key)}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* المحتوى الرئيسي */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>

          {/* ===== الإحصائيات ===== */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '24px', color: '#fff' }}>📊 الإحصائيات اللحظية</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                {[
                  { label: 'إجمالي المستخدمين', value: stats.total_users, icon: '👥', color: '#4a9eff' },
                  { label: 'ملفات مكتملة', value: stats.completed_profiles, icon: '✅', color: '#4aff8a' },
                  { label: 'بلاغات معلقة', value: stats.pending_reports, icon: '🚨', color: '#ff6b6b' },
                  { label: 'تسجيلات اليوم', value: stats.new_today, icon: '🆕', color: '#ffd700' },
                ].map(stat => (
                  <div key={stat.label} style={{ ...cardStyle, marginBottom: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: '900', color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: 'rgba(255,255,255,0.8)' }}>نسبة اكتمال الملفات</h3>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.07)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '6px',
                    background: 'linear-gradient(90deg, #800020, #ff4466)',
                    width: stats.total_users > 0 ? `${Math.round((stats.completed_profiles / stats.total_users) * 100)}%` : '0%',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '8px' }}>
                  {stats.total_users > 0 ? Math.round((stats.completed_profiles / stats.total_users) * 100) : 0}% من المستخدمين أكملوا ملفاتهم
                </p>
              </div>
              <div style={{ textAlign: 'left' }}>
                <button onClick={loadAll} style={{ ...tabStyle(''), background: 'rgba(128,0,32,0.3)', color: '#fff', border: '1px solid rgba(128,0,32,0.4)' }}>
                  🔄 تحديث البيانات
                </button>
              </div>
            </div>
          )}

          {/* ===== إعدادات التطبيق ===== */}
          {activeTab === 'settings' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '24px' }}>🎨 إعدادات التطبيق</h2>
              {msg && (
                <div style={{ background: msg.includes('✅') ? 'rgba(0,200,0,0.1)' : 'rgba(255,0,0,0.1)', border: `1px solid ${msg.includes('✅') ? 'rgba(0,200,0,0.3)' : 'rgba(255,0,0,0.3)'}`, borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: msg.includes('✅') ? '#80ff80' : '#ff8080', textAlign: 'center' }}>
                  {msg}
                </div>
              )}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '18px', color: 'rgba(255,255,255,0.8)' }}>النصوص والهوية</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>{lbl('اسم التطبيق')}<input style={inputStyle} value={settings.app_name} onChange={e => setSettings({ ...settings, app_name: e.target.value })} /></div>
                  <div>{lbl('الشعار (Slogan)')}<input style={inputStyle} value={settings.app_slogan} onChange={e => setSettings({ ...settings, app_slogan: e.target.value })} /></div>
                  <div>{lbl('رابط الشعار (Logo URL)')}<input style={inputStyle} placeholder="https://..." value={settings.logo_url} onChange={e => setSettings({ ...settings, logo_url: e.target.value })} /></div>
                  <div>
                    {lbl('اللون الأساسي')}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input type="color" value={settings.primary_color} onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                        style={{ width: '50px', height: '42px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'none' }} />
                      <input style={{ ...inputStyle, flex: 1 }} value={settings.primary_color} onChange={e => setSettings({ ...settings, primary_color: e.target.value })} />
                      <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: settings.primary_color, flexShrink: 0 }} />
                    </div>
                  </div>
                  {settings.logo_url && (
                    <div>
                      {lbl('معاينة الشعار')}
                      <img src={settings.logo_url} alt="logo" style={{ maxHeight: '80px', borderRadius: '8px' }} onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>
              <button onClick={saveSettings} disabled={saving} style={{
                padding: '13px 32px', borderRadius: '12px', border: 'none',
                background: 'linear-gradient(135deg, #800020, #c0002a)',
                color: '#fff', fontWeight: '800', fontFamily: 'Cairo, sans-serif',
                cursor: saving ? 'not-allowed' : 'pointer', fontSize: '1rem',
                boxShadow: '0 4px 20px rgba(128,0,32,0.4)',
              }}>
                {saving ? 'جاري الحفظ...' : '💾 حفظ الإعدادات'}
              </button>
            </div>
          )}

          {/* ===== المستخدمون ===== */}
          {activeTab === 'users' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '24px' }}>👥 إدارة المستخدمين</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(128,0,32,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      {['اسم المستخدم', 'الجنس', 'المدينة', 'البلد', 'مكتمل', 'آخر تحديث', 'إجراء'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', textAlign: 'right', color: 'rgba(255,200,200,0.8)', fontWeight: '700' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                        <td style={{ padding: '12px 16px', color: '#fff', fontWeight: '600' }}>{u.username || '—'}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{u.gender === 'male' ? '👨 ذكر' : u.gender === 'female' ? '👩 أنثى' : '—'}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{u.city || '—'}</td>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{u.country || '—'}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', background: u.is_completed ? 'rgba(0,200,0,0.15)' : 'rgba(255,150,0,0.15)', color: u.is_completed ? '#80ff80' : '#ffaa40' }}>
                            {u.is_completed ? '✅ مكتمل' : '⏳ ناقص'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.45)', fontSize: '0.8rem' }}>
                          {new Date(u.updated_at).toLocaleDateString('ar-TN')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <button onClick={() => deleteUser(u.id)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,80,80,0.4)', background: 'rgba(255,80,80,0.1)', color: '#ff8080', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '0.8rem' }}>
                            🗑️ حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '40px' }}>لا يوجد مستخدمون بعد</p>
                )}
              </div>
            </div>
          )}

          {/* ===== البلاغات ===== */}
          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '24px' }}>🚨 مراجعة البلاغات</h2>
              {reports.length === 0 ? (
                <div style={{ ...cardStyle, textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '60px' }}>
                  لا توجد بلاغات 🎉
                </div>
              ) : (
                reports.map(r => (
                  <div key={r.id} style={{ ...cardStyle, borderRight: `3px solid ${r.status === 'pending' ? '#ff6b6b' : r.status === 'resolved' ? '#4aff8a' : '#888'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', color: '#fff', fontWeight: '700' }}>السبب: {r.reason || '—'}</p>
                        <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{r.details || 'لا تفاصيل'}</p>
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
                          {new Date(r.created_at).toLocaleDateString('ar-TN')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: r.status === 'pending' ? 'rgba(255,100,100,0.2)' : 'rgba(100,255,100,0.2)', color: r.status === 'pending' ? '#ff8080' : '#80ff80' }}>
                          {r.status === 'pending' ? '⏳ معلق' : r.status === 'resolved' ? '✅ محلول' : '❌ مرفوض'}
                        </span>
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => updateReportStatus(r.id, 'resolved')} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(100,255,100,0.3)', background: 'rgba(100,255,100,0.1)', color: '#80ff80', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '0.8rem' }}>✅ حل</button>
                            <button onClick={() => updateReportStatus(r.id, 'rejected')} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,100,100,0.3)', background: 'rgba(255,100,100,0.1)', color: '#ff8080', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontSize: '0.8rem' }}>❌ رفض</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===== الاهتمامات ===== */}
          {activeTab === 'interests' && (
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '24px' }}>❤️ إدارة الاهتمامات</h2>
              <div style={{ ...cardStyle, marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px', color: 'rgba(255,255,255,0.8)' }}>إضافة اهتمام جديد</h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input style={{ ...inputStyle, flex: 1 }} placeholder="مثال: الفروسية"
                    value={newInterest} onChange={e => setNewInterest(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addInterest()} />
                  <button onClick={addInterest} style={{ padding: '11px 24px', borderRadius: '10px', border: 'none', background: '#800020', color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    ➕ إضافة
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {interests.map(interest => (
                  <div key={interest.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 14px', borderRadius: '50px',
                    border: `1px solid ${interest.is_active ? 'rgba(128,0,32,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    background: interest.is_active ? 'rgba(128,0,32,0.2)' : 'rgba(255,255,255,0.03)',
                  }}>
                    <span style={{ color: interest.is_active ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: '0.9rem' }}>
                      {interest.label}
                    </span>
                    <button onClick={() => toggleInterest(interest.id, interest.is_active)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: interest.is_active ? '#4aff8a' : '#ff8080' }}
                      title={interest.is_active ? 'إخفاء' : 'إظهار'}>
                      {interest.is_active ? '👁️' : '🙈'}
                    </button>
                    <button onClick={() => deleteInterest(interest.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: '#ff6b6b' }}
                      title="حذف">
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
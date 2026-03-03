'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';
import { COUNTRIES_CITIES } from '@/constants/countries';
const INTERESTS = ['السفر','الطبخ','الرياضة','المطالعة','التخييم','الألعاب','السينما','الموسيقى','التصوير','التطوع','الرسم','الخياطة','السباحة','الفن','التكنولوجيا'];

const MONTHS = [
  {label:'جانفي',days:31},{label:'فيفري',days:28},{label:'مارس',days:31},
  {label:'أفريل',days:30},{label:'ماي',days:31},{label:'جوان',days:30},
  {label:'جويلية',days:31},{label:'أوت',days:31},{label:'سبتمبر',days:30},
  {label:'أكتوبر',days:31},{label:'نوفمبر',days:30},{label:'ديسمبر',days:31},
];

function getMaxDays(month: string, year: string): number {
  const monthObj = MONTHS.find(m => m.label === month);
  if (!monthObj) return 31;
  if (month === 'فيفري') {
    const y = parseInt(year);
    return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28;
  }
  return monthObj.days;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 60 }, (_, i) => String(currentYear - 18 - i));
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '', gender: '', marital_status: '',
    country: '', city: '', first_name: '', last_name: '',
    day: '1', month: 'جانفي', year: String(currentYear - 25),
    phone: '', education: 'جامعي', job: '',
    height: 170, weight: 70,
    religious_level: 'ملتزم',
    interests: [] as string[],
    bio: '',
  });

  // ===== التحقق من الجلسة عند التحميل =====
  useEffect(() => {
    const checkSession = async () => {
      // أولاً: جرب الحصول على الجلسة مباشرة
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setCurrentUserId(session.user.id);
        setSessionLoading(false);
        return;
      }

      // ثانياً: استمع لتغييرات الـ auth (مفيد بعد تأكيد الإيميل)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setCurrentUserId(session.user.id);
          setSessionLoading(false);
          subscription.unsubscribe();
        } else if (event === 'SIGNED_OUT') {
          router.push('/');
        }
      });

      // ثالثاً: إذا لم تجد جلسة بعد 3 ثواني → ارجع للبداية
      setTimeout(() => {
        setSessionLoading(prev => {
          if (prev) router.push('/');
          return false;
        });
        subscription.unsubscribe();
      }, 3000);
    };

    checkSession();
  }, [router]);

  const update = (field: string, value: any) => {
    setError('');
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'month' || field === 'year') {
        const maxDays = getMaxDays(
          field === 'month' ? value : prev.month,
          field === 'year' ? value : prev.year
        );
        if (parseInt(updated.day) > maxDays) updated.day = String(maxDays);
      }
      if (field === 'country') updated.city = '';
      return updated;
    });
  };

  const toggleInterest = (item: string) => {
    const selected = formData.interests.includes(item);
    if (!selected && formData.interests.length >= 5) return;
    update('interests', selected
      ? formData.interests.filter(i => i !== item)
      : [...formData.interests, item]
    );
  };

  const isMale = formData.gender === 'male';
  const maritalOptions = isMale ? ['أعزب', 'مطلق', 'أرمل'] : ['عزباء', 'مطلقة', 'أرملة'];
  const religiousOptions = isMale ? ['ملتزم', 'ساعٍ للالتزام', 'غير ملتزم'] : ['ملتزمة', 'ساعية للالتزام', 'غير ملتزمة'];
  const educationOptions = ['ابتدائي', 'متوسط', 'ثانوي', 'جامعي', 'ماجستير / دكتوراه'];
  const availableCities = formData.country ? COUNTRIES_CITIES[formData.country] || [] : [];

  const validateStep = (): boolean => {
    if (step === 1) {
      if (formData.username.length < 4 || formData.username.length > 12) {
        setError('اسم المستخدم يجب أن يكون بين 4 و 12 حرفاً'); return false;
      }
      if (!formData.gender) { setError('الرجاء اختيار الجنس'); return false; }
      if (!formData.marital_status) { setError('الرجاء اختيار الحالة المدنية'); return false; }
      if (!formData.country) { setError('الرجاء اختيار البلد'); return false; }
      if (!formData.city) { setError('الرجاء اختيار المدينة'); return false; }
    }
    if (step === 2) {
      if (!formData.first_name.trim()) { setError('الرجاء إدخال الاسم'); return false; }
      if (!formData.last_name.trim()) { setError('الرجاء إدخال اللقب'); return false; }
      const phone = formData.phone.replace(/\D/g, '');
      if (phone.length < 8 || phone.length > 15) { setError('رقم الهاتف غير صحيح'); return false; }
    }
    if (step === 3) {
      if (!formData.job.trim()) { setError('الرجاء إدخال المهنة'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  const handleSave = async () => {
    if (!validateStep()) return;
    if (!currentUserId) { setError('انتهت الجلسة، يرجى تسجيل الدخول مجدداً'); return; }

    setLoading(true);
    setError('');
    try {
      const monthIndex = MONTHS.findIndex(m => m.label === formData.month) + 1;
      const birthDateStr = `${formData.year}-${String(monthIndex).padStart(2,'0')}-${String(formData.day).padStart(2,'0')}`;
      const age = Math.floor((Date.now() - new Date(birthDateStr).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      const { error: dbError } = await supabase.from('profiles').upsert({
        id: currentUserId,
        username: formData.username.trim(),
        gender: formData.gender,
        marital_status: formData.marital_status,
        country: formData.country,
        city: formData.city,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        birth_date: birthDateStr,
        age: isNaN(age) ? 0 : age,
        phone: formData.phone,
        education_level: formData.education,
        job: formData.job.trim(),
        height: formData.height,
        weight: formData.weight,
        religious_commitment: formData.religious_level,
        interests: formData.interests,
        bio: formData.bio.trim(),
        is_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      if (dbError) throw dbError;
      router.push('/home');

    } catch (err: any) {
      setError('حدث خطأ أثناء الحفظ: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  // ===== Styles =====
  const container: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #1a0005 0%, #2a0010 35%, #1f0008 65%, #150003 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '2rem 1rem', fontFamily: 'Cairo, sans-serif', direction: 'rtl',
  };
  const card: React.CSSProperties = {
    background: 'rgba(255,30,80,0.04)',
    backdropFilter: 'blur(40px)',
    border: '1px solid rgba(255,100,150,0.15)',
    borderRadius: '32px', padding: '40px 32px',
    width: '100%', maxWidth: '480px',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '12px', color: '#fff',
    fontFamily: 'Cairo, sans-serif', direction: 'rtl',
    boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, background: 'rgba(10,0,5,0.9)', cursor: 'pointer' };
  const label: React.CSSProperties = { color: 'rgba(255,180,180,0.8)', fontSize: '0.78rem', display: 'block', marginBottom: '7px', fontWeight: '700' };
  const tagBtn = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: '50px', cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif', fontSize: '0.82rem',
    border: `1px solid ${active ? 'rgba(255,30,80,0.7)' : 'rgba(255,255,255,0.15)'}`,
    background: active ? 'rgba(255,30,80,0.25)' : 'rgba(255,255,255,0.04)',
    color: active ? '#fff' : 'rgba(255,255,255,0.55)',
    fontWeight: active ? '700' : '400', transition: 'all 0.2s',
  });
  const stepTitle = (main: string, sub: string) => (
    <div style={{ marginBottom: '8px' }}>
      <h2 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontWeight: '800' }}>{main} <span style={{ color: '#ff1e50' }}>{sub}</span></h2>
      <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ height: '3px', flex: 1, borderRadius: '3px', background: i <= step ? 'linear-gradient(90deg, #800020, #ff1e50)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  );

  // ===== شاشة التحميل =====
  if (sessionLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0002' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px', animation: 'pulse 1s ease infinite' }}>💗</div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Cairo, sans-serif', fontSize: '0.9rem' }}>جاري التحقق من جلستك...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={container}>
      <div style={card}>

        {/* ===== الخطوة 1 ===== */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stepTitle('معلومات', 'أساسية')}

            <div>
              <label style={label}>اسم المستخدم</label>
              <input style={inputStyle} placeholder="4-12 حرف"
                value={formData.username} onChange={e => update('username', e.target.value)} />
            </div>

            <div>
              <label style={label}>الجنس</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => update('gender', 'male')} style={tagBtn(formData.gender === 'male')}>ذكر 👨</button>
                <button onClick={() => update('gender', 'female')} style={tagBtn(formData.gender === 'female')}>أنثى 👩</button>
              </div>
            </div>

            <div>
              <label style={label}>الحالة المدنية</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {maritalOptions.map(s => (
                  <button key={s} onClick={() => update('marital_status', s)} style={tagBtn(formData.marital_status === s)}>{s}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={label}>البلد</label>
              <select style={selectStyle} value={formData.country} onChange={e => update('country', e.target.value)}>
                <option value="">— اختر البلد —</option>
                {Object.keys(COUNTRIES_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={label}>المدينة {!formData.country && <span style={{ color: 'rgba(255,180,180,0.4)', fontWeight: '400' }}>(اختر البلد أولاً)</span>}</label>
              <select style={{ ...selectStyle, opacity: formData.country ? 1 : 0.4 }}
                value={formData.city} disabled={!formData.country}
                onChange={e => update('city', e.target.value)}>
                <option value="">— اختر المدينة —</option>
                {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ===== الخطوة 2 ===== */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stepTitle('البيانات', 'الشخصية')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={label}>الاسم</label>
                <input style={inputStyle} placeholder="الاسم الأول"
                  value={formData.first_name} onChange={e => update('first_name', e.target.value)} />
              </div>
              <div>
                <label style={label}>اللقب</label>
                <input style={inputStyle} placeholder="اسم العائلة"
                  value={formData.last_name} onChange={e => update('last_name', e.target.value)} />
              </div>
            </div>

            <div>
              <label style={label}>تاريخ الميلاد</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '8px' }}>
                <select style={selectStyle} value={formData.day} onChange={e => update('day', e.target.value)}>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select style={selectStyle} value={formData.month} onChange={e => update('month', e.target.value)}>
                  {MONTHS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
                </select>
                <select style={selectStyle} value={formData.year} onChange={e => update('year', e.target.value)}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={label}>رقم الهاتف</label>
              <input style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }}
                placeholder="+216 XX XXX XXX" type="tel"
                value={formData.phone} onChange={e => update('phone', e.target.value)} />
            </div>
          </div>
        )}

        {/* ===== الخطوة 3 ===== */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stepTitle('المهنة', 'والمظهر')}

            <div>
              <label style={label}>المستوى التعليمي</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {educationOptions.map(e => (
                  <button key={e} onClick={() => update('education', e)} style={tagBtn(formData.education === e)}>{e}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={label}>المهنة</label>
              <input style={inputStyle} placeholder="ماذا تعمل؟"
                value={formData.job} onChange={e => update('job', e.target.value)} />
            </div>

            <div>
              <label style={label}>الطول — {formData.height} سم</label>
              <input type="range" min={140} max={220} value={formData.height}
                onChange={e => update('height', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#ff1e50' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,180,180,0.4)', fontSize: '0.7rem' }}>220</span>
                <span style={{ color: 'rgba(255,180,180,0.4)', fontSize: '0.7rem' }}>140</span>
              </div>
            </div>

            <div>
              <label style={label}>الوزن — {formData.weight} كجم</label>
              <input type="range" min={40} max={150} value={formData.weight}
                onChange={e => update('weight', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#ff1e50' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,180,180,0.4)', fontSize: '0.7rem' }}>150</span>
                <span style={{ color: 'rgba(255,180,180,0.4)', fontSize: '0.7rem' }}>40</span>
              </div>
            </div>

            <div>
              <label style={label}>الالتزام الديني</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {religiousOptions.map(r => (
                  <button key={r} onClick={() => update('religious_level', r)} style={tagBtn(formData.religious_level === r)}>{r}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== الخطوة 4 ===== */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stepTitle('الاهتمامات', 'والنبذة')}

            <div>
              <label style={label}>
                الاهتمامات
                <span style={{ color: 'rgba(255,180,180,0.4)', fontWeight: '400', marginRight: '6px' }}>({formData.interests.length}/5)</span>
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {INTERESTS.map(item => (
                  <button key={item} onClick={() => toggleInterest(item)} style={tagBtn(formData.interests.includes(item))}>{item}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={label}>
                نبذة شخصية
                <span style={{ color: 'rgba(255,180,180,0.4)', fontWeight: '400', marginRight: '6px' }}>(اختياري)</span>
              </label>
              <textarea
                placeholder={isMale ? 'اكتب نبذة مختصرة عن نفسك...' : 'اكتبي نبذة مختصرة عن نفسك...'}
                value={formData.bio} onChange={e => update('bio', e.target.value)}
                maxLength={300} rows={4}
                style={{ ...inputStyle, resize: 'none', lineHeight: '1.6' }}
              />
              <p style={{ color: 'rgba(255,180,180,0.3)', fontSize: '0.7rem', textAlign: 'left', marginTop: '4px' }}>
                {formData.bio.length}/300
              </p>
            </div>
          </div>
        )}

        {/* رسالة الخطأ */}
        {error && (
          <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', borderRadius: '12px' }}>
            <p style={{ color: '#ff9090', fontSize: '0.85rem', margin: 0, textAlign: 'center' }}>{error}</p>
          </div>
        )}

        {/* أزرار التنقل */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              flex: 1, padding: '13px', borderRadius: '50px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.6)',
              fontFamily: 'Cairo, sans-serif', cursor: 'pointer', fontSize: '0.9rem',
            }}>
              ← رجوع
            </button>
          )}
          <button
            onClick={step === 4 ? handleSave : handleNext}
            disabled={loading}
            style={{
              flex: 2, padding: '13px', borderRadius: '50px', border: 'none',
              background: loading ? 'rgba(255,30,80,0.3)' : 'linear-gradient(135deg, #800020, #ff1e50)',
              color: '#fff', fontFamily: 'Cairo, sans-serif',
              fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem', boxShadow: loading ? 'none' : '0 6px 20px rgba(255,30,80,0.4)',
              transition: 'all 0.2s',
            }}>
            {loading ? '⏳ جاري الحفظ...' : step === 4 ? '✨ إنشاء الحساب' : 'مواصلة ←'}
          </button>
        </div>
      </div>
    </div>
  );
}
'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../supabaseClient';

const INTERESTS = ['السفر', 'الطبخ', 'الرياضة', 'المطالعة', 'Camping', 'Gaming', 'السينما', 'الموسيقى', 'التصوير', 'التطوع', 'الرسم', 'الخياطة', 'السباحة'];

const MONTHS = [
  { label: 'جانفي', days: 31 }, { label: 'فيفري', days: 28 },
  { label: 'مارس', days: 31 }, { label: 'أفريل', days: 30 },
  { label: 'ماي', days: 31 }, { label: 'جوان', days: 30 },
  { label: 'جويلية', days: 31 }, { label: 'أوت', days: 31 },
  { label: 'سبتمبر', days: 30 }, { label: 'أكتوبر', days: 31 },
  { label: 'نوفمبر', days: 30 }, { label: 'ديسمبر', days: 31 },
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

// التحقق من أن النص حروف فقط (عربي أو لاتيني) مع مسافة
const isLettersOnly = (value: string) => /^[\u0600-\u06FF a-zA-Z]+$/.test(value);

export default function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    gender: '',
    marital_status: '',
    country: '',
    city: '',
    first_name: '',
    last_name: '',
    day: '1',
    month: 'جانفي',
    year: '1990',
    phone: '',
    education: 'جامعي',
    job: '',
    height: 170,
    weight: 70,
    health_habits: [] as string[],
    religious_level: 'ملتزم',
    interests: [] as string[],
  });

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
      return updated;
    });
  };

  const toggleInterest = (h: string) => {
    const selected = formData.interests.includes(h);
    if (!selected && formData.interests.length >= 4) return;
    update('interests', selected ? formData.interests.filter(i => i !== h) : [...formData.interests, h]);
  };

  const validateStep = (): boolean => {
    if (step === 1) {
      if (formData.username.length < 4 || formData.username.length > 12) {
        setError('اسم المستخدم يجب أن يكون بين 4 و 12 حرفاً'); return false;
      }
      if (!formData.gender) { setError('الرجاء اختيار الجنس'); return false; }
      if (!formData.marital_status) { setError('الرجاء اختيار الحالة المدنية'); return false; }
      if (!formData.country || !isLettersOnly(formData.country)) {
        setError('البلد يجب أن يحتوي على حروف فقط'); return false;
      }
      if (!formData.city || !isLettersOnly(formData.city)) {
        setError('المدينة يجب أن تحتوي على حروف فقط'); return false;
      }
    }
    if (step === 2) {
      if (!formData.first_name || !isLettersOnly(formData.first_name)) {
        setError('الاسم يجب أن يحتوي على حروف فقط بدون أرقام أو رموز'); return false;
      }
      if (!formData.last_name || !isLettersOnly(formData.last_name)) {
        setError('اللقب يجب أن يحتوي على حروف فقط بدون أرقام أو رموز'); return false;
      }
      const y = parseInt(formData.year);
      if (isNaN(y) || y < 1960 || y > 2006) {
        setError('السنة يجب أن تكون بين 1960 و 2006'); return false;
      }
      const d = parseInt(formData.day);
      const maxDays = getMaxDays(formData.month, formData.year);
      if (isNaN(d) || d < 1 || d > maxDays) {
        setError(`اليوم يجب أن يكون بين 1 و ${maxDays}`); return false;
      }
      const phone = formData.phone.replace(/\D/g, '');
      if (phone.length < 8 || phone.length > 14) {
        setError('رقم الهاتف يجب أن يكون بين 8 و 14 رقم'); return false;
      }
      const phoneNum = parseInt(phone);
      if (phoneNum < 20000000) {
        setError('رقم الهاتف غير صحيح'); return false;
      }
    }
    if (step === 3) {
      if (formData.height < 140 || formData.height > 220) {
        setError('الطول يجب أن يكون بين 140 و 220 سم'); return false;
      }
      if (formData.weight < 35 || formData.weight > 200) {
        setError('الوزن يجب أن يكون بين 35 و 200 كجم'); return false;
      }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }

    const monthIndex = MONTHS.findIndex(m => m.label === formData.month) + 1;
    const birthDateStr = `${formData.year}-${String(monthIndex).padStart(2, '0')}-${String(formData.day).padStart(2, '0')}`;
    const age = Math.floor((Date.now() - new Date(birthDateStr).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    const { error: dbError } = await supabase.from('profiles').upsert({
      id: user.id,
      username: formData.username,
      gender: formData.gender,
      marital_status: formData.marital_status,
      country: formData.country,
      city: formData.city,
      first_name: formData.first_name,
      last_name: formData.last_name,
      birth_date: birthDateStr,
      age,
      phone: formData.phone,
      education_level: formData.education,
      job: formData.job,
      height: formData.height,
      weight: formData.weight,
      health_habits: formData.health_habits,
      religious_commitment: formData.religious_level,
      interests: formData.interests,
      is_completed: true,
    });

    setLoading(false);
    if (dbError) { setError('حدث خطأ في الحفظ، حاول مجدداً'); return; }
    router.push('/home');
  };

  const maxDays = getMaxDays(formData.month, formData.year);

  // ===== الستايلات =====
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '1rem',
    fontFamily: 'Cairo, sans-serif',
    outline: 'none',
    direction: 'rtl',
    boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    background: 'rgba(15,2,30,0.9)',
  };

  const choiceBtn = (active: boolean): React.CSSProperties => ({
    padding: '11px 14px',
    borderRadius: '12px',
    border: `1px solid ${active ? '#e0003a' : 'rgba(255,255,255,0.15)'}`,
    background: active ? 'rgba(224,0,58,0.25)' : 'rgba(255,255,255,0.05)',
    color: active ? '#ffffff' : 'rgba(255,255,255,0.7)',
    fontFamily: 'Cairo, sans-serif',
    cursor: 'pointer',
    fontSize: '0.92rem',
    fontWeight: active ? '700' : '400',
    transition: 'all 0.2s',
    boxShadow: active ? '0 0 14px rgba(224,0,58,0.35)' : 'none',
  });

  const lbl = (text: string, required = false) => (
    <label style={{ color: 'rgba(255,200,200,0.85)', fontSize: '0.82rem', display: 'block', marginBottom: '7px', fontWeight: '600' }}>
      {text} {required && <span style={{ color: '#ff6b6b' }}>*</span>}
    </label>
  );

  const stepTitle = (main: string, highlight: string) => (
    <h2 style={{ color: '#ffffff', fontSize: '1.5rem', fontWeight: '900', margin: '0 0 8px' }}>
      {main} <span style={{ color: '#ff4466', textShadow: '0 0 20px rgba(255,68,102,0.5)' }}>{highlight}</span>
    </h2>
  );

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a0010 0%, #2d0018 40%, #1a000d 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
    }}>
      {/* توهج خلفي */}
      <div style={{
        position: 'fixed', top: '-150px', left: '50%', transform: 'translateX(-50%)',
        width: '600px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(180,0,60,0.18) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{
        background: 'rgba(255,180,180,0.05)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        border: '1px solid rgba(255,150,150,0.2)',
        borderRadius: '32px',
        padding: '40px 32px',
        width: '100%',
        maxWidth: '480px',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,200,200,0.1)',
      }}>

        {/* وميض علوي */}
        <div style={{
          position: 'absolute', top: 0, left: '15%', right: '15%', height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,150,150,0.5), transparent)',
        }} />

        {/* شريط التقدم */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            {['الأساسية', 'السرية', 'الإضافية', 'الهوايات'].map((label, i) => (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: step > i + 1 ? '#800020' : step === i + 1 ? '#c0002a' : 'rgba(255,255,255,0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px', color: '#ffffff', fontSize: '0.88rem', fontWeight: 'bold',
                  boxShadow: step === i + 1 ? '0 0 18px rgba(192,0,42,0.7)' : 'none',
                  transition: 'all 0.3s',
                }}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span style={{
                  fontSize: '0.62rem',
                  color: step === i + 1 ? 'rgba(255,180,180,0.9)' : 'rgba(255,255,255,0.35)',
                  fontWeight: step === i + 1 ? '700' : '400',
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px' }}>
            <div style={{
              height: '100%', borderRadius: '2px',
              background: 'linear-gradient(90deg, #800020, #ff4466)',
              width: `${((step - 1) / 3) * 100}%`,
              transition: 'width 0.4s ease',
              boxShadow: '0 0 8px rgba(255,68,102,0.5)',
            }} />
          </div>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div style={{
            background: 'rgba(255,60,60,0.1)', border: '1px solid rgba(255,100,100,0.35)',
            borderRadius: '10px', padding: '11px 16px', marginBottom: '18px',
            color: '#ffaaaa', fontSize: '0.84rem', textAlign: 'center', fontWeight: '600',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ===== المرحلة 1 ===== */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {stepTitle('الهوية', 'الرقمية')}
            <p style={{ color: 'rgba(255,200,200,0.5)', fontSize: '0.8rem', margin: '-4px 0 0' }}>
              هذا ما سيراه الآخرون عنك
            </p>

            <div>
              {lbl('اسم المستخدم', true)}
              <input style={inputStyle} maxLength={12} placeholder="مثال: أحمد_2000"
                value={formData.username} onChange={e => update('username', e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,200,200,0.4)' }}>بين 4 و 12 حرف</span>
                <span style={{ fontSize: '0.7rem', color: formData.username.length > 10 ? '#ff8080' : 'rgba(255,200,200,0.4)' }}>
                  {formData.username.length}/12
                </span>
              </div>
            </div>

            <div>
              {lbl('الجنس', true)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[{ v: 'male', l: '👨 ذكر' }, { v: 'female', l: '👩 أنثى' }].map(g => (
                  <button key={g.v} onClick={() => update('gender', g.v)} style={choiceBtn(formData.gender === g.v)}>{g.l}</button>
                ))}
              </div>
            </div>

            <div>
              {lbl('الحالة المدنية', true)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {['أعزب', 'مطلق', 'أرمل'].map(s => (
                  <button key={s} onClick={() => update('marital_status', s)} style={choiceBtn(formData.marital_status === s)}>{s}</button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                {lbl('البلد', true)}
                <input style={inputStyle} placeholder="تونس"
                  value={formData.country}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^[\u0600-\u06FF a-zA-Z]+$/.test(v)) update('country', v);
                  }} />
              </div>
              <div>
                {lbl('المدينة', true)}
                <input style={inputStyle} placeholder="صفاقس"
                  value={formData.city}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^[\u0600-\u06FF a-zA-Z]+$/.test(v)) update('city', v);
                  }} />
              </div>
            </div>
          </div>
        )}

        {/* ===== المرحلة 2 ===== */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{
              background: 'rgba(255,160,0,0.08)', border: '1px solid rgba(255,160,0,0.25)',
              borderRadius: '12px', padding: '11px 16px',
            }}>
              <p style={{ color: 'rgba(255,200,120,0.9)', fontSize: '0.8rem', margin: 0, fontWeight: '600' }}>
                🔒 هذه البيانات سرية ولن تُشارك مع أحد
              </p>
            </div>

            {stepTitle('البيانات', 'الخاصة')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                {lbl('الاسم', true)}
                <input style={inputStyle} placeholder="محمد"
                  value={formData.first_name}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^[\u0600-\u06FF a-zA-Z]+$/.test(v)) update('first_name', v);
                  }} />
              </div>
              <div>
                {lbl('اللقب', true)}
                <input style={inputStyle} placeholder="بن علي"
                  value={formData.last_name}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || /^[\u0600-\u06FF a-zA-Z]+$/.test(v)) update('last_name', v);
                  }} />
              </div>
            </div>

            <div>
              {lbl('تاريخ الولادة', true)}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 95px', gap: '8px' }}>
                <div>
                  <input type="number" style={{ ...inputStyle, textAlign: 'center', padding: '13px 8px' }}
                    min={1} max={maxDays} placeholder="يوم"
                    value={formData.day}
                    onChange={e => {
                      const v = e.target.value;
                      const n = parseInt(v);
                      if (v === '' || (n >= 1 && n <= maxDays)) update('day', v);
                    }} />
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,200,200,0.5)', display: 'block', textAlign: 'center', marginTop: '3px' }}>
                    1 – {maxDays}
                  </span>
                </div>
                <select style={selectStyle} value={formData.month} onChange={e => update('month', e.target.value)}>
                  {MONTHS.map(m => <option key={m.label} value={m.label}>{m.label}</option>)}
                </select>
                <div>
                  <input type="number" style={{ ...inputStyle, textAlign: 'center', padding: '13px 8px' }}
                    min={1960} max={2006} placeholder="سنة"
                    value={formData.year}
                    onChange={e => {
                      if (e.target.value.length <= 4) update('year', e.target.value);
                    }} />
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,200,200,0.5)', display: 'block', textAlign: 'center', marginTop: '3px' }}>
                    1960 – 2006
                  </span>
                </div>
              </div>
            </div>

            <div>
              {lbl('رقم الهاتف', true)}
              <input type="tel" style={{ ...inputStyle, direction: 'ltr', letterSpacing: '0.08em' }}
                placeholder="20000000"
                value={formData.phone}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '');
                  if (v.length <= 14) update('phone', v);
                }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,200,200,0.4)', marginTop: '4px', display: 'block' }}>
                أرقام فقط — من 8 إلى 14 رقم
              </span>
            </div>
          </div>
        )}

        {/* ===== المرحلة 3 ===== */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {stepTitle('المواصفات', 'الشخصية')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                {lbl('المستوى التعليمي')}
                <select style={selectStyle} value={formData.education} onChange={e => update('education', e.target.value)}>
                  <option>ابتدائي</option><option>متوسط</option><option>ثانوي</option>
                  <option>جامعي</option><option>ماجستير / دكتوراه</option>
                </select>
              </div>
              <div>
                {lbl('الوظيفة')}
                <input style={inputStyle} placeholder="مهندس..." value={formData.job}
                  onChange={e => update('job', e.target.value)} />
              </div>
            </div>

            {[
              { label: 'الطول', field: 'height', min: 140, max: 220, unit: 'سم' },
              { label: 'الوزن', field: 'weight', min: 35, max: 200, unit: 'كجم' },
            ].map(item => (
              <div key={item.field} style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px', padding: '16px 20px',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'rgba(255,200,200,0.85)', fontSize: '0.85rem', fontWeight: '600' }}>
                    {item.label} ({item.unit})
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button onClick={() => update(item.field, Math.max(item.min, (formData as any)[item.field] - 1))}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <input type="number" min={item.min} max={item.max}
                      style={{ ...inputStyle, width: '72px', textAlign: 'center', padding: '8px', fontSize: '1.15rem', fontWeight: '800', color: '#ff9090' }}
                      value={(formData as any)[item.field]}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= item.min && v <= item.max) update(item.field, v);
                      }} />
                    <button onClick={() => update(item.field, Math.min(item.max, (formData as any)[item.field] + 1))}
                      style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(192,0,42,0.35)', border: '1px solid rgba(192,0,42,0.4)', color: '#ffffff', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
                <div style={{ marginTop: '10px', height: '4px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px' }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    background: 'linear-gradient(90deg, #800020, #ff4466)',
                    width: `${(((formData as any)[item.field] - item.min) / (item.max - item.min)) * 100}%`,
                    boxShadow: '0 0 6px rgba(255,68,102,0.4)',
                    transition: 'width 0.2s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{item.min}</span>
                  <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>{item.max}</span>
                </div>
              </div>
            ))}

            <div>
              {lbl('العادات الصحية')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['رياضة', 'تدخين', 'لا شيء'].map(h => (
                  <button key={h} onClick={() => {
                    const arr = formData.health_habits;
                    update('health_habits', arr.includes(h) ? arr.filter(i => i !== h) : [...arr, h]);
                  }} style={{ ...choiceBtn(formData.health_habits.includes(h)), padding: '9px 20px' }}>{h}</button>
                ))}
              </div>
            </div>

            <div>
              {lbl('الالتزام الديني')}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['ملتزم', 'ساعٍ للالتزام', 'غير ملتزم'].map(r => (
                  <button key={r} onClick={() => update('religious_level', r)} style={{ ...choiceBtn(formData.religious_level === r), padding: '9px 20px' }}>{r}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== المرحلة 4 ===== */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🌟</div>
              {stepTitle('شنوة', 'هواياتك؟')}
              <p style={{ color: 'rgba(255,200,200,0.55)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                اختر 4 اهتمامات كحد أقصى
              </p>
              <div style={{
                display: 'inline-block', marginTop: '8px',
                padding: '4px 16px', borderRadius: '50px',
                background: 'rgba(192,0,42,0.2)', border: '1px solid rgba(192,0,42,0.3)',
                color: 'rgba(255,150,150,0.9)', fontSize: '0.8rem', fontWeight: '700',
              }}>
                {formData.interests.length}/4
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
              {INTERESTS.map(h => {
                const selected = formData.interests.includes(h);
                const disabled = !selected && formData.interests.length >= 4;
                return (
                  <button key={h} onClick={() => toggleInterest(h)} disabled={disabled} style={{
                    padding: '10px 20px', borderRadius: '50px',
                    border: `1px solid ${selected ? '#e0003a' : 'rgba(255,255,255,0.15)'}`,
                    background: selected ? 'rgba(224,0,58,0.25)' : 'rgba(255,255,255,0.04)',
                    color: disabled ? 'rgba(255,255,255,0.2)' : selected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                    fontFamily: 'Cairo, sans-serif', cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem', fontWeight: selected ? '700' : '400',
                    transition: 'all 0.2s',
                    boxShadow: selected ? '0 0 14px rgba(224,0,58,0.35)' : 'none',
                  }}>{h}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* أزرار التنقل */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{
              flex: 1, padding: '14px', borderRadius: '14px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.65)', fontFamily: 'Cairo, sans-serif',
              cursor: 'pointer', fontSize: '0.95rem',
            }}>رجوع</button>
          )}
          <button onClick={step === 4 ? handleSave : handleNext} disabled={loading} style={{
            flex: 2, padding: '14px', borderRadius: '14px',
            background: loading ? 'rgba(128,0,32,0.3)' : 'linear-gradient(135deg, #800020, #e0003a)',
            border: 'none', color: '#ffffff', fontWeight: '800',
            fontFamily: 'Cairo, sans-serif', cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem', boxShadow: loading ? 'none' : '0 6px 24px rgba(192,0,42,0.45)',
            transition: 'all 0.2s',
          }}>
            {loading ? '⏳ جاري الحفظ...' : step === 4 ? 'إرسال ♥' : 'مواصلة ✨'}
          </button>
        </div>

        {/* تذييل */}
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.18)', fontSize: '0.7rem', marginTop: '24px', letterSpacing: '0.15em' }}>
          ZAWAJ AI — مستقبل الزواج الذكي
        </p>
      </div>
    </main>
  );
}
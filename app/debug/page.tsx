'use client';

/**
 * 📁 app/debug/page.tsx
 * صفحة التشخيص — تُحدد السبب الحقيقي لعدم ظهور البطاقات
 * ⚠️ للاستخدام المؤقت فقط — احذفها بعد الإصلاح
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface TestResult {
  label:    string;
  count:    number | null;
  error:    string | null;
  data?:    any[];
  status:   'ok' | 'error' | 'empty' | 'loading';
}

export default function DebugPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => { runDiagnostics(); }, []);

  const runDiagnostics = async () => {
    setRunning(true);
    setResults([]);

    // ── 0. جلب المستخدم الحالي ────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setResults([{ label: 'المستخدم', count: null, error: 'غير مسجل الدخول!', status: 'error' }]);
      setRunning(false);
      return;
    }

    const { data: prof } = await supabase
      .from('profiles').select('*').eq('id', user.id).single();

    setProfile(prof);

    const oppositeGender = prof?.gender === 'male' ? 'female' : 'male';
    const tests: TestResult[] = [];

    const run = async (label: string, fn: () => Promise<any>) => {
      try {
        const { data, error, count } = await fn();
        tests.push({
          label,
          count: data?.length ?? count ?? null,
          data:  data?.slice(0, 3),
          error: error?.message ?? null,
          status: error ? 'error' : (data?.length ?? 0) > 0 ? 'ok' : 'empty',
        });
      } catch (e: any) {
        tests.push({ label, count: null, error: e.message, status: 'error' });
      }
      setResults([...tests]);
    };

    // ── TEST 1: هل يمكن قراءة profiles أصلاً؟ ──
    await run('1. قراءة profiles بدون فلاتر (أول 5 صفوف)', () =>
      supabase.from('profiles').select('id, gender, age, is_completed').limit(5)
    );

    // ── TEST 2: هل يوجد أي جنس معاكس؟ ──
    await run(`2. profiles بالجنس المعاكس (${oppositeGender}) بدون فلاتر`, () =>
      supabase.from('profiles')
        .select('id, gender, age, is_completed, country, city')
        .eq('gender', oppositeGender)
        .limit(10)
    );

    // ── TEST 3: مع فلتر العمر ──
    const minAge = prof?.gender === 'female' ? (prof.age - 5) : (prof.age - 10);
    const maxAge = prof?.gender === 'female' ? (prof.age + 10) : (prof.age + 5);
    await run(`3. + فلتر العمر (${Math.max(18, minAge)} - ${maxAge})`, () =>
      supabase.from('profiles')
        .select('id, gender, age, country, city')
        .eq('gender', oppositeGender)
        .gte('age', Math.max(18, minAge))
        .lte('age', maxAge)
        .limit(10)
    );

    // ── TEST 4: مع استبعاد نفسه ──
    await run('4. + استبعاد نفسه (neq id)', () =>
      supabase.from('profiles')
        .select('id, gender, age, country, city')
        .eq('gender', oppositeGender)
        .gte('age', Math.max(18, minAge))
        .lte('age', maxAge)
        .neq('id', user.id)
        .limit(10)
    );

    // ── TEST 5: مع neq role ──
    await run("5. + neq('role','mediator')", () =>
      supabase.from('profiles')
        .select('id, gender, age, role')
        .eq('gender', oppositeGender)
        .neq('role', 'mediator')
        .neq('role', 'admin')
        .limit(10)
    );

    // ── TEST 6: مع is_completed ──
    await run("6. + is_completed = true (السبب القديم)", () =>
      supabase.from('profiles')
        .select('id, gender, age, is_completed')
        .eq('gender', oppositeGender)
        .eq('is_completed', true)
        .limit(10)
    );

    // ── TEST 7: نفس الدولة ──
    await run(`7. + نفس الدولة (${prof?.country})`, () =>
      supabase.from('profiles')
        .select('id, gender, age, country, city')
        .eq('gender', oppositeGender)
        .eq('country', prof?.country)
        .gte('age', Math.max(18, minAge))
        .lte('age', maxAge)
        .limit(10)
    );

    // ── TEST 8: نفس المدينة ──
    await run(`8. + نفس المدينة (${prof?.city})`, () =>
      supabase.from('profiles')
        .select('id, gender, age, country, city')
        .eq('gender', oppositeGender)
        .eq('country', prof?.country)
        .eq('city', prof?.city)
        .gte('age', Math.max(18, minAge))
        .lte('age', maxAge)
        .limit(10)
    );

    // ── TEST 9: هل likes تعمل؟ ──
    await run('9. جلب likes من قاعدة البيانات', () =>
      supabase.from('likes').select('id, action').limit(5)
    );

    // ── TEST 10: قيمة gender في بروفايل المستخدم ──
    tests.push({
      label: '10. بيانات بروفايلك الحالي',
      count: null,
      data: [{ gender: prof?.gender, age: prof?.age, country: prof?.country, city: prof?.city, is_completed: prof?.is_completed }],
      error: null,
      status: prof ? 'ok' : 'error',
    });
    setResults([...tests]);

    setRunning(false);
  };

  return (
    <div className="min-h-screen bg-[#07050d] p-4 pb-24" dir="rtl">
      <div className="max-w-lg mx-auto">

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white font-black text-xl">🔬 تشخيص قاعدة البيانات</h1>
          <button
            onClick={runDiagnostics}
            disabled={running}
            className="px-4 py-2 rounded-xl text-sm font-black text-white"
            style={{ background: running ? 'rgba(255,255,255,0.1)' : '#A4161A' }}
          >
            {running ? '...' : 'إعادة'}
          </button>
        </div>

        {/* بروفايل المستخدم */}
        {profile && (
          <div className="mb-4 p-4 rounded-2xl text-sm" dir="rtl"
            style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
            <p className="text-sky-300 font-black mb-2 text-xs uppercase tracking-wider">بروفايلك</p>
            <div className="grid grid-cols-2 gap-1 text-white/70 text-xs">
              <span>الجنس: <b className="text-white">{profile.gender}</b></span>
              <span>العمر: <b className="text-white">{profile.age}</b></span>
              <span>الدولة: <b className="text-white">{profile.country}</b></span>
              <span>المدينة: <b className="text-white">{profile.city}</b></span>
              <span>مكتمل: <b className={profile.is_completed ? 'text-green-400' : 'text-red-400'}>
                {profile.is_completed ? 'نعم' : 'لا'}
              </b></span>
            </div>
          </div>
        )}

        {/* النتائج */}
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="p-4 rounded-2xl"
              style={{
                background:
                  r.status === 'ok'      ? 'rgba(34,197,94,0.08)'   :
                  r.status === 'error'   ? 'rgba(239,68,68,0.1)'    :
                  r.status === 'empty'   ? 'rgba(234,179,8,0.08)'   :
                  'rgba(255,255,255,0.04)',
                border: `1px solid ${
                  r.status === 'ok'    ? 'rgba(34,197,94,0.25)'  :
                  r.status === 'error' ? 'rgba(239,68,68,0.3)'   :
                  r.status === 'empty' ? 'rgba(234,179,8,0.25)'  :
                  'rgba(255,255,255,0.08)'}`,
              }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-[13px]">{r.label}</span>
                <span className="font-black text-sm"
                  style={{
                    color:
                      r.status === 'ok'    ? '#4ade80' :
                      r.status === 'error' ? '#f87171' :
                      r.status === 'empty' ? '#fbbf24' : 'white',
                  }}>
                  {r.status === 'ok'    ? `✅ ${r.count}` :
                   r.status === 'error' ? '❌ خطأ'       :
                   r.status === 'empty' ? '⚠️ 0'         : '⏳'}
                </span>
              </div>

              {r.error && (
                <p className="text-red-400 text-[11px] mt-1 font-mono">{r.error}</p>
              )}

              {r.data && r.data.length > 0 && (
                <div className="mt-2 space-y-1">
                  {r.data.map((d, j) => (
                    <p key={j} className="text-white/50 text-[10px] font-mono bg-black/20 px-2 py-1 rounded-lg">
                      {JSON.stringify(d)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* تفسير */}
        {!running && results.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl text-sm" dir="rtl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white/60 font-black text-xs uppercase tracking-wider mb-3">كيفية القراءة</p>
            <div className="space-y-2 text-[12px]">
              <p><span className="text-red-400 font-black">TEST 1 فارغ/خطأ</span> → RLS يمنع قراءة profiles</p>
              <p><span className="text-yellow-400 font-black">TEST 2 فارغ</span> → لا يوجد جنس معاكس في DB أو gender مكتوب بشكل مختلف</p>
              <p><span className="text-yellow-400 font-black">TEST 3 فارغ</span> → age=null في كل البروفايلات</p>
              <p><span className="text-yellow-400 font-black">TEST 6 لديه نتائج</span> → is_completed هو المشكلة (لا يجب تفعيله)</p>
              <p><span className="text-green-400 font-black">TEST 2 به نتائج</span> → RLS يعمل، المشكلة في فلتر آخر</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
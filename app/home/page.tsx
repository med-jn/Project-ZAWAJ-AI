'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

const COUNTRIES_CITIES: Record<string, string[]> = {
  'تونس': ['بنزرت','أريانة','تونس العاصمة','منوبة','بن عروس','نابل','زغوان','باجة','جندوبة','الكاف','سليانة','سوسة','المنستير','المهدية','صفاقس','القيروان','سيدي بوزيد','قفصة','قابس','مدنين','تطاوين','توزر','قبلي','غفصة'],
  'مصر': ['القاهرة','الإسكندرية','الجيزة','الأقصر','أسوان','بورسعيد','السويس','المنصورة','طنطا','الإسماعيلية','الفيوم','الزقازيق','دمياط','أسيوط','شرم الشيخ','الغردقة','المنيا','بني سويف','قنا','سوهاج'],
  'المغرب': ['الدار البيضاء','الرباط','مراكش','فاس','طنجة','أكادير','مكناس','وجدة','القنيطرة','تطوان','الجديدة','سلا','خريبكة','بني ملال','العيون','الحسيمة','آسفي','الناظور','الرشيدية','تازة'],
  'الجزائر': ['الجزائر العاصمة','وهران','قسنطينة','عنابة','بلعباس','باتنة','سطيف','الشلف','بجاية','تلمسان','بسكرة','الأغواط','أدرار','تيزي وزو','المدية','مستغانم','سكيكدة','جيجل','خنشلة','ورقلة'],
  'السعودية': ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','الطائف','تبوك','بريدة','خميس مشيط','حائل','الجبيل','الأحساء','القطيف','أبها','نجران','الباحة','عرعر','سكاكا','جيزان'],
  'الإمارات': ['دبي','أبوظبي','الشارقة','عجمان','رأس الخيمة','الفجيرة','أم القيوين','العين','خورفكان','كلباء'],
  'الكويت': ['مدينة الكويت','حولي','الفروانية','الجهراء','الأحمدي','مبارك الكبير'],
  'قطر': ['الدوحة','الريان','الوكرة','الخور','الشحانية','أم صلال','الشمال','الضعاين'],
  'البحرين': ['المنامة','المحرق','الرفاع','مدينة عيسى','مدينة حمد','سترة','الحد'],
  'عُمان': ['مسقط','صلالة','صحار','مطرح','نزوى','السيب','البريمي','صور','عبري','بهلاء'],
  'الأردن': ['عمّان','الزرقاء','إربد','الرصيفة','وادي السير','العقبة','المفرق','الكرك','معان','السلط'],
  'لبنان': ['بيروت','طرابلس','صيدا','صور','زحلة','البترون','جبيل','النبطية','بعلبك','عاليه'],
  'سوريا': ['دمشق','حلب','حمص','حماة','اللاذقية','دير الزور','الرقة','إدلب','درعا','السويداء'],
  'العراق': ['بغداد','البصرة','الموصل','أربيل','كركوك','النجف','كربلاء','الحلة','الناصرية','العمارة'],
  'ليبيا': ['طرابلس','بنغازي','مصراتة','الزاوية','البيضاء','سبها','الخمس','طبرق','زليتن','أجدابيا'],
  'اليمن': ['صنعاء','عدن','تعز','الحديدة','إب','ذمار','المكلا','حضرموت','صعدة','المحويت'],
  'السودان': ['الخرطوم','أمدرمان','بورتسودان','كسلا','الفاشر','نيالا','مدني','عطبرة','سنار','الأبيض'],
  'موريتانيا': ['نواكشوط','نواذيبو','روصو','كيفة','عطار','كيهيدي','أكجوجت','تيجيكجا','سيلبابي','ازويرات'],
  'فلسطين': ['غزة','رام الله','الخليل','نابلس','القدس','جنين','طولكرم','أريحا','بيت لحم','رفح'],
  'فرنسا': ['باريس','مرسيليا','ليون','تولوز','نيس','نانت','ستراسبورغ','مونبلييه','بوردو','ليل','رين','سان دوني','غرونوبل','ديجون','أنجيه'],
  'ألمانيا': ['برلين','هامبورغ','ميونخ','كولونيا','فرانكفورت','شتوتغارت','دوسلدورف','دورتموند','بريمن','لايبزيغ','درسدن','هانوفر','نورنبرغ','بون'],
  'بلجيكا': ['بروكسل','أنتويرب','غنت','شارلروا','لييج','بروج','نامور','لوفان','ميشلن','أوسطند'],
  'هولندا': ['أمستردام','روتردام','لاهاي','أوتريخت','إيندهوفن','تيلبورغ','خرونينغن','ألمير','نيميخن'],
  'إيطاليا': ['روما','ميلانو','نابولي','تورينو','باليرمو','جنوا','بولونيا','فلورنسا','باري','كاتانيا'],
  'إسبانيا': ['مدريد','برشلونة','فالنسيا','إشبيلية','سرقسطة','مالقة','مورسية','بلباو','لاس بالماس'],
  'كندا': ['تورونتو','مونتريال','فانكوفر','كالغاري','أوتاوا','إدمونتون','وينيبيغ','هاميلتون'],
  'الولايات المتحدة': ['نيويورك','لوس أنجلوس','شيكاغو','هيوستن','فينيكس','فيلادلفيا','دالاس','ديترويت','باترسون','ديربورن'],
  'المملكة المتحدة': ['لندن','برمنغهام','مانشستر','ليدز','غلاسكو','برادفورد','ليفربول','إدنبرة','بريستول','شيفيلد'],
  'تركيا': ['إسطنبول','أنقرة','إزمير','بورصة','أضنة','طرابزون','غازي عنتاب','قونيه','مرسين','أنطاليا'],
  'ماليزيا': ['كوالالمبور','جورج تاون','إيبوه','جوهور بهرو','شاه علم','كلانج','كوتا كينابالو'],
  'أستراليا': ['سيدني','ملبورن','بريسبان','بيرث','أديلايد','كانبيرا','غولد كوست','داروين'],
};

const ADMIN_EMAIL = 'mohamed.jouini029@gmail.com';

// ===== مكون الشريط المزدوج =====
function RangeDouble({ label, min, max, valMin, valMax, onMin, onMax, unit }: {
  label: string, min: number, max: number,
  valMin: number, valMax: number,
  onMin: (v: number) => void,
  onMax: (v: number) => void,
  unit: string,
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<null | 'min' | 'max'>(null);

  // RTL: اليمين = min، اليسار = max
  // pctFromRight: نسبة من اليمين
  const pctFromRight = (v: number) => ((v - min) / (max - min)) * 100;
  const pctFromLeft = (v: number) => 100 - pctFromRight(v);

  const getValueFromClientX = (clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return min;
    // RTL: أقصى اليمين = min، أقصى اليسار = max
    const ratio = 1 - (clientX - rect.left) / rect.width;
    const raw = min + ratio * (max - min);
    return Math.round(Math.min(max, Math.max(min, raw)));
  };

  const onPointerMove = (clientX: number) => {
    if (!dragging.current) return;
    const v = getValueFromClientX(clientX);
    if (dragging.current === 'min') {
      if (v <= valMax - 1) onMin(v);
    } else {
      if (v >= valMin + 1) onMax(v);
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => onPointerMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => onPointerMove(e.touches[0].clientX);
    const onUp = () => { dragging.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [valMin, valMax]);

  const minRight = pctFromRight(valMin);  // مقبض الأدنى من اليمين
  const maxLeft = pctFromLeft(valMax);    // مقبض الأقصى من اليسار

  // المقبض: شكل بيضاوي طولي (كرقم 0) بتأثير زجاجي أبيض
  const handle = (side: 'min' | 'max'): React.CSSProperties => ({
    position: 'absolute',
    top: '50%',
    ...(side === 'min' ? { right: `calc(${minRight}% - 7px)` } : { left: `calc(${maxLeft}% - 7px)` }),
    transform: 'translateY(-50%)',
    width: '14px',
    height: '26px',
    borderRadius: '7px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(220,220,230,0.9) 50%, rgba(255,255,255,0.85) 100%)',
    border: '1px solid rgba(255,255,255,0.6)',
    boxShadow: '0 0 10px rgba(255,30,80,0.5), 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(200,200,210,0.5)',
    cursor: 'grab',
    zIndex: 4,
    touchAction: 'none',
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <label style={{ color: 'rgba(255,180,180,0.8)', fontSize: '0.78rem', fontWeight: '700' }}>{label}</label>
        <span style={{
          color: '#fff', fontSize: '0.75rem', fontWeight: '700',
          background: 'linear-gradient(135deg, rgba(128,0,32,0.6), rgba(255,30,80,0.4))',
          padding: '3px 12px', borderRadius: '20px',
          border: '1px solid rgba(255,80,120,0.4)',
          boxShadow: '0 2px 8px rgba(255,30,80,0.3)',
        }}>
          {valMin} — {valMax} {unit}
        </span>
      </div>

      <div style={{ padding: '14px 8px 8px', position: 'relative', userSelect: 'none' }}>
        {/* المسار الخلفي */}
        <div ref={trackRef} style={{
          height: '5px', borderRadius: '3px',
          background: 'rgba(255,255,255,0.08)',
          position: 'relative',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
        }}>
          {/* المنطقة المحددة بين المقبضين */}
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            right: `${minRight}%`,
            left: `${maxLeft}%`,
            background: 'linear-gradient(90deg, #ff1e50, #ff6b8a)',
            borderRadius: '3px',
            boxShadow: '0 0 6px rgba(255,30,80,0.6)',
          }} />

          {/* مقبض الأدنى — اليمين */}
          <div
            style={handle('min')}
            onMouseDown={e => { e.preventDefault(); dragging.current = 'min'; }}
            onTouchStart={() => { dragging.current = 'min'; }}
          />

          {/* مقبض الأقصى — اليسار */}
          <div
            style={handle('max')}
            onMouseDown={e => { e.preventDefault(); dragging.current = 'max'; }}
            onTouchStart={() => { dragging.current = 'max'; }}
          />
        </div>

        {/* أرقام الحدود */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
          <span style={{ color: 'rgba(255,180,180,0.35)', fontSize: '0.68rem' }}>{max}</span>
          <span style={{ color: 'rgba(255,180,180,0.35)', fontSize: '0.68rem' }}>{min}</span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [pressedTab, setPressedTab] = useState('');
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeDir, setSwipeDir] = useState<null | 'left' | 'right'>(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchDone, setSearchDone] = useState(false);
  const [filters, setFilters] = useState({
    country: '', city: '',
    marital: [] as string[],
    ageMin: 18, ageMax: 60,
    heightMin: 140, heightMax: 200,
    weightMin: 50, weightMax: 120,
    education: [] as string[],
    religious: [] as string[],
  });
  const audioCtx = useRef<AudioContext | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(prof);
      if (prof) await loadCards(user.id, prof.gender);
    };
    init();
  }, []);

  const loadCards = async (userId: string, gender: string) => {
    setLoadingCards(true);
    const { data: prevLikes } = await supabase.from('likes').select('to_user').eq('from_user', userId);
    const excludeIds = [userId, ...(prevLikes?.map((l: any) => l.to_user) || [])];
    const oppositeGender = gender === 'male' ? 'female' : 'male';
    const { data } = await supabase
      .from('profiles')
      .select('id, username, age, city, country, avatar_url, interests, job, religious_commitment, height')
      .eq('gender', oppositeGender)
      .eq('is_completed', true)
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(20);
    setCards(data || []);
    setCurrentIndex(0);
    setLoadingCards(false);
  };

  const handleAction = async (action: 'like' | 'dislike') => {
    if (!cards[currentIndex] || !user) return;
    const targetId = cards[currentIndex].id;
    setSwipeDir(action === 'like' ? 'right' : 'left');
    playActionSound(action);
    await supabase.from('likes').upsert({ from_user: user.id, to_user: targetId, action });
    setTimeout(() => { setSwipeDir(null); setCurrentIndex(prev => prev + 1); }, 400);
  };

  const handleSearch = async () => {
    if (!user) return;
    setSearchDone(false);
    setSearchResults([]);
    const oppositeGender = profile?.gender === 'male' ? 'female' : 'male';

    let query = supabase
      .from('profiles')
      .select('id, username, age, city, country, avatar_url, job')
      .eq('gender', oppositeGender)
      .eq('is_completed', true)
      .gte('age', filters.ageMin)
      .lte('age', filters.ageMax)
      .gte('height', filters.heightMin)
      .lte('height', filters.heightMax);

    if (searchName.trim()) query = (query as any).ilike('username', `%${searchName.trim()}%`);
    if (filters.country) query = (query as any).eq('country', filters.country);
    if (filters.city) query = (query as any).eq('city', filters.city);
    if (filters.education.length > 0) query = (query as any).in('education_level', filters.education);
    if (filters.marital.length > 0) query = (query as any).in('marital_status', filters.marital);
    if (filters.religious.length > 0) query = (query as any).in('religious_commitment', filters.religious);

    const { data, error } = await (query as any).limit(30);
    if (error) console.error('خطأ في البحث:', error);
    setSearchResults(data || []);
    setSearchDone(true);
  };

  const handleClearSearch = () => {
    setSearchName(''); setSearchResults([]); setSearchDone(false);
    setFilters({
      country: '', city: '', marital: [],
      ageMin: 18, ageMax: 60,
      heightMin: 140, heightMax: 200,
      weightMin: 50, weightMax: 120,
      education: [], religious: [],
    });
  };

  const toggleMulti = (field: 'marital' | 'education' | 'religious', value: string) => {
    setFilters(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const isMale = profile?.gender === 'male';
  const maritalOptions = isMale ? ['عزباء', 'مطلقة', 'أرملة'] : ['أعزب', 'مطلق', 'أرمل'];
  const religiousOptions = isMale ? ['ملتزمة', 'ساعية للالتزام', 'غير ملتزمة'] : ['ملتزم', 'ساعٍ للالتزام', 'غير ملتزم'];

  const playActionSound = (action: string) => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      if (action === 'like') {
        [0, 0.12].forEach((t, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.type = 'sine';
          o.frequency.setValueAtTime(i === 0 ? 600 : 900, ctx.currentTime + t);
          g.gain.setValueAtTime(0.1, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.22);
        });
      } else {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sine';
        o.frequency.setValueAtTime(300, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        g.gain.setValueAtTime(0.08, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.28);
      }
    } catch (e) {}
  };

  const playSound = (type: string) => {
    try {
      if (!audioCtx.current) audioCtx.current = new AudioContext();
      const ctx = audioCtx.current;
      if (type === 'messages') {
        [0, 0.15].forEach((t, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.type = 'sine';
          o.frequency.setValueAtTime(i === 0 ? 830 : 1050, ctx.currentTime + t);
          g.gain.setValueAtTime(0.1, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.22);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.25);
        });
      } else if (type === 'notifications') {
        [1046, 1318, 1568, 1318, 1046].forEach((freq, i) => {
          const o = ctx.createOscillator(); const g = ctx.createGain(); const t = i * 0.1;
          o.connect(g); g.connect(ctx.destination); o.type = 'sine';
          o.frequency.setValueAtTime(freq, ctx.currentTime + t);
          g.gain.setValueAtTime(0.08, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.18);
        });
      } else if (type === 'search') {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination); o.type = 'sine';
        o.frequency.setValueAtTime(350, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.18);
        g.gain.setValueAtTime(0.09, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.25);
      } else if (type === 'home') {
        [{ freq: 523, t: 0 }, { freq: 659, t: 0.12 }, { freq: 784, t: 0.24 }, { freq: 1047, t: 0.38 }].forEach(({ freq, t }) => {
          const o = ctx.createOscillator(); const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.type = 'sine';
          o.frequency.setValueAtTime(freq, ctx.currentTime + t);
          g.gain.setValueAtTime(0.08, ctx.currentTime + t);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.25);
          o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.28);
        });
      }
    } catch (e) {}
  };

  const handleTabClick = (tab: string) => {
    setPressedTab(tab); playSound(tab);
    setTimeout(() => setPressedTab(''), 350);
    setActiveTab(tab);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (Math.abs(dx) > 60 && dy < 80) dx > 0 ? handleAction('like') : handleAction('dislike');
  };

  const filterLabel: React.CSSProperties = {
    color: 'rgba(255,180,180,0.8)', fontSize: '0.78rem',
    display: 'block', marginBottom: '7px', fontWeight: '700',
  };
  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    background: 'rgba(10,0,5,0.9)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '10px', color: '#fff',
    fontFamily: 'Cairo, sans-serif', fontSize: '0.88rem',
    outline: 'none', direction: 'rtl', boxSizing: 'border-box',
  };
  const multiBtn = (active: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: '50px', cursor: 'pointer',
    fontFamily: 'Cairo, sans-serif', fontSize: '0.8rem',
    border: `1px solid ${active ? 'rgba(255,30,80,0.7)' : 'rgba(255,255,255,0.12)'}`,
    background: active ? 'rgba(255,30,80,0.25)' : 'rgba(255,255,255,0.04)',
    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
    fontWeight: active ? '700' : '400', transition: 'all 0.2s',
  });

  const currentCard = cards[currentIndex];
  const availableCities = filters.country ? COUNTRIES_CITIES[filters.country] || [] : [];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #1a0005 0%, #2a0010 35%, #1f0008 65%, #150003 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Cairo, sans-serif', direction: 'rtl',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes riseSlow {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          15% { opacity: 0.7; } 85% { opacity: 0.3; }
          100% { transform: translateY(-105vh) scale(1.4); opacity: 0; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(2.2); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(255,255,255,0.4)); }
          50% { transform: scale(1.12); filter: drop-shadow(0 0 10px rgba(255,255,255,0.8)); }
        }
        @keyframes pressDown {
          0% { transform: scale(1); } 40% { transform: scale(0.78); } 100% { transform: scale(1); }
        }
        @keyframes swipeRight {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(120%) rotate(20deg); opacity: 0; }
        }
        @keyframes swipeLeft {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(-120%) rotate(-20deg); opacity: 0; }
        }
        @keyframes cardIn {
          0% { transform: scale(0.92) translateY(20px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          30% { transform: scale(1.4); }
          60% { transform: scale(1.2); }
        }
        select option { background: #1a0008; color: white; }
      `}</style>

      {/* خلفية */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 20% 80%, rgba(220,20,60,0.2) 0%, transparent 45%), radial-gradient(ellipse at 80% 20%, rgba(180,0,40,0.16) 0%, transparent 45%)` }} />
        {[{ size: 350, left: '5%', duration: '20s', delay: '0s' }, { size: 280, left: '55%', duration: '25s', delay: '5s' }, { size: 400, left: '25%', duration: '22s', delay: '10s' }].map((b, i) => (
          <div key={i} style={{ position: 'absolute', bottom: '-300px', left: b.left, width: `${b.size}px`, height: `${b.size}px`, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,60,90,0.09) 0%, rgba(200,20,50,0.06) 40%, transparent 70%)`, animation: `riseSlow ${b.duration} ${b.delay} ease-in-out infinite`, filter: `blur(${40 + i * 6}px)` }} />
        ))}
        {[{ top: '12%', left: '18%' }, { top: '28%', left: '72%' }, { top: '55%', left: '8%' }, { top: '42%', left: '88%' }].map((s, i) => (
          <div key={i} style={{ position: 'absolute', top: s.top, left: s.left, width: '2px', height: '2px', borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px rgba(255,180,180,0.9)', animation: `twinkle ${2.5 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>

      {/* الشريط العلوي */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(15,0,6,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,60,100,0.18)', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
        <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px', order: -1 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: '24px', height: '2.5px', borderRadius: '2px', background: menuOpen ? (i === 1 ? 'transparent' : 'rgba(255,255,255,0.9)') : 'rgba(255,255,255,0.8)', transform: menuOpen ? (i === 0 ? 'rotate(45deg) translate(5px, 5px)' : i === 2 ? 'rotate(-45deg) translate(5px, -5px)' : 'none') : 'none', transition: 'all 0.3s' }} />
          ))}
        </button>
        <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '900' }}>
          <span style={{ color: 'rgba(255,255,255,0.95)' }}>ZAWAJ </span>
          <span style={{ color: '#ff1e50', textShadow: '0 0 20px rgba(255,30,80,0.8)' }}>AI</span>
        </h1>
      </header>

      {/* القائمة الجانبية */}
      {menuOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '285px', background: 'linear-gradient(180deg, #1e0008 0%, #120005 100%)', borderLeft: '1px solid rgba(255,60,100,0.2)', display: 'flex', flexDirection: 'column', boxShadow: '-15px 0 50px rgba(0,0,0,0.7)' }}>
            <div style={{ padding: '60px 22px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,30,80,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 0 20px rgba(255,30,80,0.3)', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,30,80,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '1.4rem' }}>
                  {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
                </div>
                <div>
                  <p style={{ margin: 0, color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{profile?.username || user?.user_metadata?.full_name || 'مستخدم'}</p>
                  <p style={{ margin: '3px 0 0', color: 'rgba(255,180,180,0.6)', fontSize: '0.78rem' }}>{profile?.city || ''} {profile?.country || ''}</p>
                </div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {[
                { emoji: '👤', label: 'الملف الشخصي', path: '/profile' },
                { emoji: '👁️', label: 'من زار حسابي', path: '/visitors' },
                { emoji: '❤️', label: 'المعجبون', path: '/likes-page' },
                { emoji: '🤍', label: 'سجل الإعجابات', path: '/liked' },
                { emoji: '🚫', label: 'المحظورون', path: '/blocked' },
                { emoji: '⭐', label: 'GOLD', path: '/gold', gold: true },
                { emoji: '⚙️', label: 'الإعدادات', path: '/settings' },
                { emoji: '📜', label: 'السياسات والخصوصية', path: '/privacy' },
              ].map(item => (
                <button key={item.path} onClick={() => { router.push(item.path); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '13px 22px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: '1.3rem', filter: (item as any).gold ? 'drop-shadow(0 0 6px rgba(212,175,55,0.8))' : item.emoji === '❤️' ? 'drop-shadow(0 0 6px rgba(255,60,100,0.8))' : 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }}>{item.emoji}</span>
                  <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.95rem', fontWeight: (item as any).gold ? '700' : '500', color: (item as any).gold ? '#d4af37' : 'rgba(255,255,255,0.85)' }}>{item.label}</span>
                  {(item as any).gold && <span style={{ marginRight: 'auto', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.35)', color: '#d4af37' }}>مميز ✨</span>}
                </button>
              ))}
              {user?.email === ADMIN_EMAIL && (
                <button onClick={() => { router.push('/admin'); setMenuOpen(false); }}
                  style={{ width: '100%', padding: '13px 22px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '8px', transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,200,0,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                  <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 0 6px rgba(255,200,0,0.8))' }}>🛡️</span>
                  <span style={{ fontFamily: 'Cairo, sans-serif', fontSize: '0.95rem', fontWeight: '700', color: 'rgba(255,200,80,0.9)' }}>لوحة الإدارة</span>
                </button>
              )}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button onClick={handleLogout} style={{ width: '100%', padding: '12px', borderRadius: '14px', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff9090', fontFamily: 'Cairo, sans-serif', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                🚪 تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      )}

      {/* المحتوى */}
      <main style={{ flex: 1, marginTop: '65px', marginBottom: '80px', padding: '16px', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* الرئيسية */}
        {activeTab === 'home' && (
          <div style={{ width: '100%', maxWidth: '400px' }}>
            {!loadingCards && cards.length > 0 && currentIndex < cards.length && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: 'rgba(255,180,180,0.5)', fontSize: '0.8rem' }}>اقتراحات اليوم 💫</span>
                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px' }}>{currentIndex + 1} / {cards.length}</span>
              </div>
            )}
            {loadingCards && (
              <div style={{ textAlign: 'center', paddingTop: '80px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px', animation: 'heartBeat 1s ease infinite' }}>💗</div>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>نبحث لك عن الأنسب...</p>
              </div>
            )}
            {!loadingCards && (currentIndex >= cards.length || cards.length === 0) && (
              <div style={{ textAlign: 'center', background: 'rgba(255,30,80,0.05)', border: '1px solid rgba(255,60,100,0.15)', borderRadius: '28px', padding: '50px 24px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌹</div>
                <h3 style={{ color: '#fff', fontWeight: '700', margin: '0 0 8px' }}>{cards.length === 0 ? 'لا يوجد اقتراحات حالياً' : 'شاهدت كل الاقتراحات!'}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0 0 24px' }}>{cards.length === 0 ? 'سنضيف المزيد قريباً' : 'عد لاحقاً لاقتراحات جديدة'}</p>
                <button onClick={() => profile && loadCards(user.id, profile.gender)} style={{ padding: '12px 28px', borderRadius: '50px', background: 'linear-gradient(135deg, #800020, #ff1e50)', border: 'none', color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' }}>🔄 تحديث</button>
              </div>
            )}
            {!loadingCards && currentCard && currentIndex < cards.length && (
              <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ animation: swipeDir === 'right' ? 'swipeRight 0.4s ease forwards' : swipeDir === 'left' ? 'swipeLeft 0.4s ease forwards' : 'cardIn 0.4s ease' }}>
                <div style={{ borderRadius: '28px', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,150,150,0.15)', minHeight: '460px', background: 'linear-gradient(180deg, rgba(40,0,15,0.8) 0%, rgba(20,0,8,0.95) 100%)' }}>
                  <div style={{ height: '320px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(128,0,32,0.4), rgba(255,30,80,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {currentCard.avatar_url ? (
                      <img src={currentCard.avatar_url} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(12px) brightness(0.6)' }} />
                    ) : (
                      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(255,30,80,0.3), rgba(128,0,32,0.3))', border: '2px solid rgba(255,150,150,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'rgba(255,255,255,0.8)' }}>
                        {currentCard.username?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(20,0,8,0.95) 100%)' }} />
                    {currentCard.avatar_url && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', background: 'rgba(0,0,0,0.4)', padding: '6px 14px', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>اشترك في GOLD لرؤية الصورة</p>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px 22px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                      <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: '800' }}>{currentCard.username}</h2>
                      {currentCard.age && <span style={{ color: 'rgba(255,180,180,0.7)', fontSize: '1rem', fontWeight: '600' }}>{currentCard.age} سنة</span>}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                      {currentCard.city && <span style={{ fontSize: '0.75rem', color: 'rgba(255,200,200,0.7)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px' }}>📍 {currentCard.city}</span>}
                      {currentCard.job && <span style={{ fontSize: '0.75rem', color: 'rgba(255,200,200,0.7)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px' }}>💼 {currentCard.job}</span>}
                      {currentCard.religious_commitment && <span style={{ fontSize: '0.75rem', color: 'rgba(255,200,200,0.7)', background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: '20px' }}>🕌 {currentCard.religious_commitment}</span>}
                    </div>
                    {currentCard.interests?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {currentCard.interests.slice(0, 3).map((interest: string) => (
                          <span key={interest} style={{ fontSize: '0.7rem', color: 'rgba(255,150,150,0.8)', background: 'rgba(255,30,80,0.1)', border: '1px solid rgba(255,30,80,0.2)', padding: '3px 10px', borderRadius: '20px' }}>{interest}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '28px', marginTop: '20px', marginBottom: '8px' }}>
                  <button onClick={() => handleAction('dislike')} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '2px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: '1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>✕</button>
                  <button onClick={() => handleAction('like')} style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #ff1e50, #800020)', border: '2px solid rgba(255,100,130,0.4)', cursor: 'pointer', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(255,30,80,0.5)', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(255,30,80,0.7)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,30,80,0.5)'; }}>❤️</button>
                  <button onClick={() => handleAction('like')} style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(212,175,55,0.1)', border: '2px solid rgba(212,175,55,0.3)', cursor: 'pointer', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,175,55,0.1)'}>⭐</button>
                </div>
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', marginTop: '4px' }}>اسحب يميناً ❤️ أو يساراً ✕</p>
              </div>
            )}
          </div>
        )}

        {/* البحث */}
        {activeTab === 'search' && (
          <div style={{ width: '100%', maxWidth: '420px' }}>
            <input
              placeholder="🔍 ابحث باسم المستخدم..."
              style={{ width: '100%', padding: '14px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,60,100,0.2)', borderRadius: '50px', color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: '0.95rem', outline: 'none', direction: 'rtl', boxSizing: 'border-box' }}
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />

            <div style={{ marginTop: '14px', background: 'rgba(255,30,80,0.04)', border: '1px solid rgba(255,60,100,0.15)', borderRadius: '20px', overflow: 'hidden' }}>
              <button onClick={() => setAdvancedOpen(p => !p)} style={{ width: '100%', padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,200,200,0.85)', fontSize: '0.9rem', fontWeight: '700', fontFamily: 'Cairo, sans-serif' }}>🎯 البحث المتقدم</span>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', display: 'inline-block', transition: 'transform 0.3s', transform: advancedOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
              </button>

              {advancedOpen && (
                <div style={{ padding: '4px 16px 18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* الدولة */}
                  <div>
                    <label style={filterLabel}>الدولة</label>
                    <select style={selectStyle} value={filters.country}
                      onChange={e => setFilters(p => ({ ...p, country: e.target.value, city: '' }))}>
                      <option value="">— اختر الدولة —</option>
                      {Object.keys(COUNTRIES_CITIES).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* المدينة */}
                  <div>
                    <label style={filterLabel}>
                      المدينة {!filters.country && <span style={{ color: 'rgba(255,180,180,0.4)', fontWeight: '400' }}>(اختر الدولة أولاً)</span>}
                    </label>
                    <select style={{ ...selectStyle, opacity: filters.country ? 1 : 0.4 }}
                      value={filters.city} disabled={!filters.country}
                      onChange={e => setFilters(p => ({ ...p, city: e.target.value }))}>
                      <option value="">— كل المدن —</option>
                      {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* العمر 18-60 */}
                  <RangeDouble label="العمر" min={18} max={60}
                    valMin={filters.ageMin} valMax={filters.ageMax}
                    onMin={v => setFilters(p => ({ ...p, ageMin: v }))}
                    onMax={v => setFilters(p => ({ ...p, ageMax: v }))}
                    unit="سنة" />

                  {/* الطول 140-200 */}
                  <RangeDouble label="الطول" min={140} max={200}
                    valMin={filters.heightMin} valMax={filters.heightMax}
                    onMin={v => setFilters(p => ({ ...p, heightMin: v }))}
                    onMax={v => setFilters(p => ({ ...p, heightMax: v }))}
                    unit="سم" />

                  {/* الوزن 50-120 */}
                  <RangeDouble label="الوزن" min={50} max={120}
                    valMin={filters.weightMin} valMax={filters.weightMax}
                    onMin={v => setFilters(p => ({ ...p, weightMin: v }))}
                    onMax={v => setFilters(p => ({ ...p, weightMax: v }))}
                    unit="كجم" />

                  {/* الحالة المدنية */}
                  <div>
                    <label style={filterLabel}>الحالة المدنية <span style={{ color: 'rgba(255,180,180,0.4)', fontWeight: '400', fontSize: '0.7rem' }}>(اختيار متعدد)</span></label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {maritalOptions.map(s => <button key={s} onClick={() => toggleMulti('marital', s)} style={multiBtn(filters.marital.includes(s))}>{s}</button>)}
                    </div>
                  </div>

                  {/* المستوى التعليمي */}
                  <div>
                    <label style={filterLabel}>المستوى التعليمي <span style={{ color: 'rgba(255,180,180,0.4)', fontWeight: '400', fontSize: '0.7rem' }}>(اختيار متعدد)</span></label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {['ابتدائي', 'متوسط', 'ثانوي', 'جامعي', 'ماجستير / دكتوراه'].map(e => (
                        <button key={e} onClick={() => toggleMulti('education', e)} style={multiBtn(filters.education.includes(e))}>{e}</button>
                      ))}
                    </div>
                  </div>

                  {/* الالتزام الديني */}
                  <div>
                    <label style={filterLabel}>الالتزام الديني <span style={{ color: 'rgba(255,180,180,0.4)', fontWeight: '400', fontSize: '0.7rem' }}>(اختيار متعدد)</span></label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {religiousOptions.map(r => <button key={r} onClick={() => toggleMulti('religious', r)} style={multiBtn(filters.religious.includes(r))}>{r}</button>)}
                    </div>
                  </div>

                  {/* أزرار البحث */}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleSearch}
                      style={{ flex: 2, padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #800020, #ff1e50)', color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(255,30,80,0.4)' }}>
                      🔍 بحث
                    </button>
                    <button
                      onClick={handleClearSearch}
                      style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontFamily: 'Cairo, sans-serif', cursor: 'pointer', fontSize: '0.9rem' }}>
                      مسح
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* زر البحث السريع */}
            {!advancedOpen && (
              <button
                onClick={handleSearch}
                style={{ width: '100%', marginTop: '12px', padding: '13px', borderRadius: '50px', border: 'none', background: 'linear-gradient(135deg, #800020, #ff1e50)', color: '#fff', fontFamily: 'Cairo, sans-serif', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(255,30,80,0.35)' }}>
                🔍 بحث
              </button>
            )}

            {/* النتائج */}
            {searchResults.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ color: 'rgba(255,180,180,0.6)', fontSize: '0.8rem', margin: '0 0 4px' }}>{searchResults.length} نتيجة</p>
                {searchResults.map(u => (
                  <div key={u.id} style={{ background: 'rgba(255,30,80,0.05)', border: '1px solid rgba(255,60,100,0.15)', borderRadius: '16px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, rgba(255,30,80,0.3), rgba(128,0,32,0.3))', border: '1px solid rgba(255,150,150,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: '1.1rem' }}>
                      {u.username?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>{u.username}</p>
                      <p style={{ margin: '2px 0 0', color: 'rgba(255,180,180,0.5)', fontSize: '0.78rem' }}>
                        {u.age ? `${u.age} سنة` : ''}{u.city ? ` · ${u.city}` : ''}{u.country ? ` · ${u.country}` : ''}
                      </p>
                    </div>
                    <button style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,30,80,0.15)', border: '1px solid rgba(255,30,80,0.3)', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>❤️</button>
                  </div>
                ))}
              </div>
            )}
            {searchDone && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', paddingTop: '40px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>لا توجد نتائج مطابقة</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center', paddingTop: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔔</div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>لا توجد إشعارات جديدة</p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div style={{ width: '100%', maxWidth: '420px', textAlign: 'center', paddingTop: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>لا توجد رسائل بعد</p>
          </div>
        )}
      </main>

      {/* الشريط السفلي */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,0,5,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,60,100,0.15)', display: 'flex', alignItems: 'center', paddingBottom: 'env(safe-area-inset-bottom)', boxShadow: '0 -4px 20px rgba(0,0,0,0.4)' }}>
        {[
          { key: 'messages', label: 'رسائل', icon: (active: boolean) => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ filter: active ? 'drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 12px rgba(255,150,150,0.6))' : 'drop-shadow(0 0 2px rgba(255,255,255,0.2))', transition: 'filter 0.3s' }}><path d="M4 4h16c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H6l-4 4V6c0-1.1.9-2 2-2z" fill={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'} stroke={active ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'} strokeWidth="0.5" /><path d="M8 9h8M8 13h5" stroke={active ? 'rgba(255,30,80,0.7)' : 'rgba(0,0,0,0.2)'} strokeWidth="1.5" strokeLinecap="round" /></svg>) },
          { key: 'notifications', label: 'إشعارات', icon: (active: boolean) => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ filter: active ? 'drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 12px rgba(255,200,100,0.6))' : 'drop-shadow(0 0 2px rgba(255,255,255,0.2))', transition: 'filter 0.3s' }}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" fill={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'} stroke={active ? 'rgba(255,255,255,0.4)' : 'none'} strokeWidth="0.5" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'} strokeWidth="2" strokeLinecap="round" /></svg>) },
          { key: 'search', label: 'بحث', icon: (active: boolean) => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ filter: active ? 'drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 12px rgba(150,200,255,0.6))' : 'drop-shadow(0 0 2px rgba(255,255,255,0.2))', transition: 'filter 0.3s' }}><circle cx="11" cy="11" r="7" stroke={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'} strokeWidth="2.5" fill={active ? 'rgba(255,255,255,0.08)' : 'none'} /><path d="M16.5 16.5L21 21" stroke={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'} strokeWidth="2.5" strokeLinecap="round" /></svg>) },
          { key: 'home', label: 'الرئيسية', icon: (active: boolean) => (<svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ filter: active ? 'drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 14px rgba(255,150,150,0.7))' : 'drop-shadow(0 0 2px rgba(255,255,255,0.2))', transition: 'filter 0.3s' }}><path d="M3 12L12 3l9 9" stroke={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" fill={active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.28)'} stroke={active ? 'rgba(255,255,255,0.5)' : 'none'} strokeWidth="0.5" /></svg>) },
        ].map(tab => {
          const isActive = activeTab === tab.key;
          const isPressed = pressedTab === tab.key;
          return (
            <button key={tab.key} onClick={() => handleTabClick(tab.key)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px 4px', background: 'none', border: 'none', cursor: 'pointer', borderTop: isActive ? '2px solid rgba(255,255,255,0.5)' : '2px solid transparent', transition: 'all 0.2s' }}>
              <div style={{ animation: isPressed ? 'pressDown 0.35s ease' : isActive ? 'pulse 2.5s ease-in-out infinite' : 'none' }}>
                {tab.icon(isActive)}
              </div>
              <span style={{ fontSize: '0.62rem', fontFamily: 'Cairo, sans-serif', color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)', fontWeight: isActive ? '700' : '400', textShadow: isActive ? '0 0 8px rgba(255,255,255,0.6)' : 'none', transition: 'all 0.2s' }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
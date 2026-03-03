'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, MessageCircle, FileText, X, Save, StickyNote, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

// ── نافذة الملاحظات السرية ───────────────────────────────────
function NoteModal({ subscriber, onClose }: { subscriber: any; onClose: () => void }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNote = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase
        .from('mediator_notes')
        .select('content')
        .eq('mediator_id', user?.id)
        .eq('subscriber_id', subscriber.id)
        .maybeSingle();
      if (data) setNote(data.content);
      setLoading(false);
    };
    fetchNote();
  }, [subscriber.id]);

  const saveNote = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('mediator_notes').upsert({
      mediator_id: user?.id,
      subscriber_id: subscriber.id,
      content: note,
      updated_at: new Date(),
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="relative bg-zinc-900 w-full max-w-lg rounded-[2.5rem] border border-white/10 overflow-hidden">
        <div className="p-8 space-y-6 text-right">
          <div className="flex justify-between items-center">
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><X size={20} className="text-white" /></button>
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-black text-white">ملاحظات سرية</h3>
                <p className="text-zinc-400 text-xs">{subscriber.first_name} {subscriber.last_name}</p>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-2xl"><StickyNote size={22} className="text-amber-400" /></div>
            </div>
          </div>

          {loading ? (
            <div className="h-40 flex items-center justify-center"><RefreshCw className="animate-spin text-zinc-600" size={28} /></div>
          ) : (
            <textarea
              className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-5 text-white font-medium outline-none resize-none text-right text-sm"
              placeholder="اكتب انطباعك السري هنا... (لن يراه المشترك)"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          )}

          <button onClick={saveNote} disabled={saving}
            className="w-full py-4 bg-white text-black rounded-2xl font-black flex items-center justify-center gap-3 disabled:opacity-50">
            {saving ? 'جاري الحفظ...' : 'حفظ'} <Save size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── الصفحة الرئيسية ──────────────────────────────────────────
export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  useEffect(() => {
    const fetchSubs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('profiles').select('*').eq('mediator_id', user?.id).order('created_at', { ascending: false });
      setSubscribers(data || []);
      setLoading(false);
    };
    fetchSubs();
  }, []);

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-white font-black animate-pulse">جاري التحميل...</p>
    </div>
  );

  return (
    <div className="min-h-full px-4 py-6" dir="rtl">
      
      {/* هيدر */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-8 mb-6 border border-white/10">
        <h1 className="text-2xl font-black text-white mb-1">إدارة المشتركين</h1>
        <p className="text-zinc-400 text-sm">تشرف على {subscribers.length} مشترك</p>
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-blue-400 font-black text-lg">{subscribers.filter(s => s.gender === 'male').length}</p>
            <p className="text-zinc-500 text-[10px]">ذكور</p>
          </div>
          <div className="flex-1 bg-white/5 rounded-2xl p-3 text-center border border-white/10">
            <p className="text-pink-400 font-black text-lg">{subscribers.filter(s => s.gender === 'female').length}</p>
            <p className="text-zinc-500 text-[10px]">إناث</p>
          </div>
        </div>
      </div>

      {/* القائمة */}
      <div className="space-y-4">
        <AnimatePresence>
          {subscribers.map(sub => (
            <motion.div key={sub.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white/5 border border-white/10 rounded-[2rem] p-5"
            >
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-[1.2rem] overflow-hidden bg-zinc-800 flex-shrink-0">
                  <img src={sub.avatar_url || `https://ui-avatars.com/api/?name=${sub.first_name}&background=800020&color=fff`} className="w-full h-full object-cover" alt="" />
                </div>
                <div className="flex-1 text-right">
                  <h3 className="text-white font-black">{sub.first_name} {sub.last_name}</h3>
                  <p className="text-zinc-400 text-xs mt-1">{sub.city} • {sub.age} سنة</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button onClick={() => setSelectedSub(sub)}
                  className="flex-1 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-black flex items-center justify-center gap-2">
                  <FileText size={14} /> ملاحظات
                </button>
                <button className="flex-1 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-black flex items-center justify-center gap-2">
                  <MessageCircle size={14} /> رسالة
                </button>
                <button className="flex-1 py-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-black flex items-center justify-center gap-2">
                  <UserCheck size={14} /> تزكية
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedSub && <NoteModal subscriber={selectedSub} onClose={() => setSelectedSub(null)} />}
      </AnimatePresence>
    </div>
  );
}
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MatchOverlay } from '@/components/economy/MatchOverlay';

export default function MatchListener() {
  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    // الاستماع لجدول الـ likes فقط عندما يتغير عمود is_match إلى true
    const channel = supabase
      .channel('realtime_matches')
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'likes',
          filter: 'is_match=eq.true' 
      }, (payload) => {
        // إذا كان المستخدم الحالي هو أحد طرفي هذا التوافق
        setMatchData(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (!matchData) return null;

  return (
    <MatchOverlay 
      user1Img="/path/to/my-avatar.jpg" 
      user2Img="/path/to/partner-avatar.jpg" 
      onClose={() => setMatchData(null)} 
    />
  );
}
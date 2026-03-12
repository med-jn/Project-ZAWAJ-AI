'use client';
/**
 * 📁 components/MatchListener.tsx
 * يستمع لـ matches real-time ويعرض MatchCelebration للمستخدم الحالي فقط
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { MatchCelebration } from '@/components/MatchCelebration';
import { useRouter } from 'next/navigation';

export default function MatchListener() {
  const router = useRouter();
  const [matchDisplay, setMatchDisplay] = useState<{
    userImg: string;
    partnerImg: string;
    partnerId: string;
  } | null>(null);

  useEffect(() => {
    let myId: string | null = null;
    let myAvatar: string | null = null;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      myId = user.id;

      // جلب صورة المستخدم الحالي
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      myAvatar = profile?.avatar_url ?? '/default-avatar.png';

      // الاستماع لـ matches
      supabase
        .channel('match_listener')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'likes',
          filter: 'is_match=eq.true',
        }, async (payload) => {
          const row = payload.new as any;

          // تحقق أن المستخدم الحالي طرف في هذا الـ match
          const isInvolved =
            row.from_user === myId || row.to_user === myId;
          if (!isInvolved) return;

          // الطرف الآخر
          const partnerId = row.from_user === myId ? row.to_user : row.from_user;

          // جلب صورة الطرف الآخر
          const { data: partner } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', partnerId)
            .single();

          setMatchDisplay({
            userImg:    myAvatar ?? '/default-avatar.png',
            partnerImg: partner?.avatar_url ?? '/default-avatar.png',
            partnerId,
          });
        })
        .subscribe();
    };

    init();

    return () => {
      supabase.removeChannel(supabase.channel('match_listener'));
    };
  }, []);

  if (!matchDisplay) return null;

  return (
    <MatchCelebration
      userImg={matchDisplay.userImg}
      partnerImg={matchDisplay.partnerImg}
      isOpen={true}
      onClose={() => setMatchDisplay(null)}
      onChat={() => {
        setMatchDisplay(null);
        router.push(`/chat/${matchDisplay.partnerId}`);
      }}
    />
  );
}
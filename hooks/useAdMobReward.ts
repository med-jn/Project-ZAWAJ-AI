'use client';
/**
 * 📁 hooks/useAdMobReward.ts — ZAWAJ AI
 * ✅ يُحدّث wallets.balance_free (وليس profiles.points)
 * ✅ Sonner للإشعارات
 */
import { useEffect } from "react";
import { AdMob, RewardAdPluginEvents } from "@admob-plus/capacitor";
import { supabase } from "@/lib/supabase/client";
import { toast }    from "sonner";

export const useAdMobReward = (userId: string, rewardAmount: number = 5) => {
  useEffect(() => {
    if (!userId) return;

    const listener = AdMob.addListener(
      RewardAdPluginEvents.Rewarded,
      async () => {
        try {
          // جلب الرصيد الحالي
          const { data, error: fetchErr } = await supabase
            .from("wallets")
            .select("balance_free")
            .eq("id", userId)
            .single();

          if (fetchErr) throw fetchErr;

          const newFree = (data?.balance_free ?? 0) + rewardAmount;

          // تحديث wallets
          const { error: updateErr } = await supabase
            .from("wallets")
            .update({
              balance_free: newFree,
              updated_at:   new Date().toISOString(),
            })
            .eq("id", userId);

          if (updateErr) throw updateErr;

          toast.success(`🎁 تم إضافة ${rewardAmount} نقطة مكافأة!`);

        } catch (e) {
          console.error("[AdMob reward]", e);
          toast.error("فشل تسجيل المكافأة، تواصل مع الدعم إذا استمرت المشكلة");
        }
      }
    );

    return () => { listener.remove(); };
  }, [userId, rewardAmount]);
};
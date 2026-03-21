'use client';
/**
 * 📁 hooks/useWallet.ts — ZAWAJ AI
 * ✅ badge_type: none|bronze|silver|gold|diamond
 * ✅ Realtime
 */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export interface WalletData {
  balance:          number;
  balance_free:     number;
  totalBalance:     number;
  badge_type:       'none' | 'bronze' | 'silver' | 'gold' | 'diamond';
  badge_expires_at: string | null;
  badge_active:     boolean;
  last_daily_login: string | null;
}

const DEFAULT: WalletData = {
  balance: 0, balance_free: 0, totalBalance: 0,
  badge_type: 'none', badge_expires_at: null,
  badge_active: false, last_daily_login: null,
};

export function useWallet() {
  const [wallet,  setWallet]  = useState<WalletData>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [userId,  setUserId]  = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
      else setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const { data } = await supabase
        .from("wallets")
        .select("balance, balance_free, badge_type, badge_expires_at, last_daily_login")
        .eq("id", userId)
        .single();

      if (data) {
        const badgeActive =
          data.badge_type !== "none" &&
          (!data.badge_expires_at || new Date(data.badge_expires_at) > new Date());

        setWallet({
          balance:          data.balance          ?? 0,
          balance_free:     data.balance_free      ?? 0,
          totalBalance:     (data.balance ?? 0) + (data.balance_free ?? 0),
          badge_type:       data.badge_type ?? "none",
          badge_expires_at: data.badge_expires_at  ?? null,
          badge_active:     badgeActive,
          last_daily_login: data.last_daily_login  ?? null,
        });
      }
      setLoading(false);
    };

    load();

    const channel = supabase
      .channel(`wallet:${userId}`)
      .on("postgres_changes", {
        event: "*", schema: "public",
        table: "wallets", filter: `id=eq.${userId}`,
      }, load)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { ...wallet, loading };
}
"use client";
/**
 * 📁 components/security/BlockedUsersSheet.tsx — ZAWAJ AI v2
 * ✅ إصلاح query (Supabase يُرجع join كـ object واحد بعد !inner)
 * ✅ تضبيب صور من اختاروا is_photos_blurred
 * ✅ dialog تأكيد إلغاء الحظر
 * ✅ empty state + loading skeleton احترافي
 * ✅ عداد المحظورين في الهيدر
 */

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion }          from "framer-motion";
import { X, ShieldOff, ShieldCheck, MapPin, UserX } from "lucide-react";
import { supabase }                         from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────
type BlockedUser = {
  blockId:          string;
  blockedAt:        string;
  id:               string;
  full_name:        string | null;
  avatar_url:       string | null;
  is_photos_blurred:boolean | null;
  age:              number | null;
  city:             string | null;
  country:          string | null;
};

type Props = { open: boolean; onClose: () => void };

// ── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 16px",
      borderRadius: 20,
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
        background: "rgba(255,255,255,0.07)",
        animation: "pulse 1.4s ease-in-out infinite",
      }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ height: 14, borderRadius: 8, width: "55%", background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite" }} />
        <div style={{ height: 11, borderRadius: 8, width: "38%", background: "rgba(255,255,255,0.05)", animation: "pulse 1.4s ease-in-out 0.2s infinite" }} />
      </div>
      <div style={{ width: 88, height: 36, borderRadius: 12, background: "rgba(255,255,255,0.07)", animation: "pulse 1.4s ease-in-out infinite" }} />
    </div>
  );
}

// ── Confirm Dialog ─────────────────────────────────────────────
function ConfirmDialog({
  open, name, onConfirm, onCancel, loading,
}: {
  open: boolean; name: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: "fixed", inset: 0, zIndex: 9998,
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 20 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999, width: "min(88vw, 310px)",
              background: "var(--bg-elevated, #1a1a2e)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 24, padding: "28px 22px 20px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.8)",
              direction: "rtl",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 14px",
            }}>
              <ShieldCheck size={24} color="#22c55e" />
            </div>

            <p style={{ textAlign: "center", margin: "0 0 6px", color: "var(--text-main,#fff)", fontWeight: 800, fontSize: 16 }}>
              إلغاء حظر {name}؟
            </p>
            <p style={{ textAlign: "center", margin: "0 0 22px", color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.6 }}>
              سيتمكن مجدداً من رؤيتك والتواصل معك.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onCancel} disabled={loading} style={{
                flex: 1, padding: "12px 0", borderRadius: 13,
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.65)",
                fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}>
                إلغاء
              </button>
              <motion.button
                whileTap={{ scale: 0.94 }} onClick={onConfirm} disabled={loading}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 13,
                  background: loading ? "rgba(34,197,94,0.25)" : "linear-gradient(145deg,#22c55e,#15803d)",
                  border: "none", color: "#fff", fontWeight: 800, fontSize: 14,
                  cursor: loading ? "default" : "pointer", fontFamily: "inherit",
                  boxShadow: loading ? "none" : "0 4px 16px rgba(34,197,94,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {loading ? (
                  <motion.div animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    style={{ width: 15, height: 15, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                  />
                ) : (
                  <><ShieldCheck size={14} /> إلغاء الحظر</>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════
export default function BlockedUsersSheet({ open, onClose }: Props) {
  const [loading,      setLoading]      = useState(true);
  const [users,        setUsers]        = useState<BlockedUser[]>([]);
  const [confirmItem,  setConfirmItem]  = useState<BlockedUser | null>(null);
  const [unblocking,   setUnblocking]   = useState(false);

  // ── جلب المحظورين ─────────────────────────────────────────
  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    /**
     * ✅ الإصلاح: نجلب blocks أولاً ثم نجلب بيانات profiles بـ in()
     * لأن Supabase أحياناً يُرجع الـ join كـ array حتى مع علاقة FK واحدة
     * وهذا يسبب item.blocked = null أو [].
     */
    const { data: blocks, error } = await supabase
      .from("blocks")
      .select("id, created_at, blocked_id")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !blocks?.length) { setLoading(false); setUsers([]); return; }

    const blockedIds = blocks.map(b => b.blocked_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, is_photos_blurred, age, city, country")
      .in("id", blockedIds);

    const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

    const merged: BlockedUser[] = blocks.map(b => {
      const p = profileMap.get(b.blocked_id) ?? {};
      return {
        blockId:           b.id,
        blockedAt:         b.created_at,
        id:                b.blocked_id,
        full_name:         (p as any).full_name    ?? null,
        avatar_url:        (p as any).avatar_url   ?? null,
        is_photos_blurred: (p as any).is_photos_blurred ?? false,
        age:               (p as any).age          ?? null,
        city:              (p as any).city         ?? null,
        country:           (p as any).country      ?? null,
      };
    });

    setUsers(merged);
    setLoading(false);
  }, []);

  useEffect(() => { if (open) fetchBlockedUsers(); }, [open, fetchBlockedUsers]);

  // ── إلغاء الحظر ──────────────────────────────────────────
  const handleUnblock = useCallback(async () => {
    if (!confirmItem) return;
    setUnblocking(true);
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("id", confirmItem.blockId);

    if (!error) {
      setUsers(prev => prev.filter(u => u.blockId !== confirmItem.blockId));
    }
    setUnblocking(false);
    setConfirmItem(null);
  }, [confirmItem]);

  // ── تنسيق التاريخ ────────────────────────────────────────
  const formatDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("ar-TN", {
        day: "numeric", month: "long", year: "numeric",
      }).format(new Date(iso));
    } catch { return ""; }
  };

  return (
    <>
      {/* Confirm Dialog (خارج الـ sheet لضمان z-index صحيح) */}
      <ConfirmDialog
        open={!!confirmItem}
        name={confirmItem?.full_name || "هذا المستخدم"}
        onConfirm={handleUnblock}
        onCancel={() => setConfirmItem(null)}
        loading={unblocking}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            style={{
              position: "fixed", inset: 0, zIndex: 120,
              display: "flex", flexDirection: "column",
              background: "var(--bg-main)",
              paddingTop: "var(--safe-top, 0px)",
              paddingBottom: "calc(var(--nav-h, 64px) + 16px)",
            }}
          >
            {/* ── Header ─────────────────────────────────────── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 var(--sp-4)",
              height: "var(--header-h, 56px)",
              borderBottom: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              flexShrink: 0,
            }}>
              {/* زر إغلاق */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                style={{
                  width: 38, height: 38, borderRadius: "50%",
                  border: "none", outline: "none",
                  background: "rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--text-main)",
                }}
              >
                <X size={18} />
              </motion.button>

              {/* العنوان + العداد */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, direction: "rtl" }}>
                <ShieldOff size={16} color="var(--color-primary, #c8002c)" />
                <span style={{ fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-main)" }}>
                  المحظورون
                </span>
                {!loading && users.length > 0 && (
                  <span style={{
                    minWidth: 22, height: 22, borderRadius: 99,
                    background: "var(--color-primary, #c8002c)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 6px",
                  }}>
                    {users.length}
                  </span>
                )}
              </div>

              {/* placeholder للتوازن */}
              <div style={{ width: 38 }} />
            </div>

            {/* ── وصف ────────────────────────────────────────── */}
            <div style={{ padding: "12px 20px 4px", flexShrink: 0 }}>
              <p style={{
                fontSize: "var(--text-sm)", color: "var(--text-tertiary)",
                lineHeight: 1.6, margin: 0, direction: "rtl",
              }}>
                المحظورون لا يستطيعون رؤيتك أو التواصل معك أو ظهورهم في اقتراحاتك.
              </p>
            </div>

            {/* ── المحتوى ─────────────────────────────────────── */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "12px 16px 0",
              display: "flex", flexDirection: "column", gap: 10,
            }}>

              {/* Skeleton */}
              {loading && (
                <>
                  {[1,2,3].map(i => <SkeletonCard key={i} />)}
                  <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
                </>
              )}

              {/* فارغ */}
              {!loading && users.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: 14, minHeight: "50vh", direction: "rtl",
                  }}
                >
                  <div style={{
                    width: 72, height: 72, borderRadius: "50%",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <UserX size={28} color="var(--text-tertiary)" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "var(--text-lg)", color: "var(--text-main)" }}>
                      لا يوجد محظورون
                    </p>
                    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-tertiary)", lineHeight: 1.6 }}>
                      عندما تحظر شخصاً سيظهر هنا
                    </p>
                  </div>
                </motion.div>
              )}

              {/* القائمة */}
              {!loading && users.map((item, i) => (
                <motion.div
                  key={item.blockId}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.96 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12, padding: "12px 14px",
                    borderRadius: 20,
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    direction: "rtl",
                  }}
                >
                  {/* الصورة + المعلومات */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                    {/* الصورة */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={item.avatar_url || "/default-avatar.png"}
                        alt={item.full_name || "مستخدم"}
                        style={{
                          width: 52, height: 52, borderRadius: "50%",
                          objectFit: "cover",
                          border: "1.5px solid var(--glass-border)",
                          filter: item.is_photos_blurred ? "blur(12px)" : "none",
                          transform: item.is_photos_blurred ? "scale(1.06)" : "none",
                          display: "block",
                        }}
                      />
                      {/* أيقونة حظر فوق الصورة */}
                      <div style={{
                        position: "absolute", bottom: -2, right: -2,
                        width: 18, height: 18, borderRadius: "50%",
                        background: "var(--color-primary, #c8002c)",
                        border: "2px solid var(--bg-main)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <ShieldOff size={9} color="#fff" />
                      </div>
                    </div>

                    {/* النص */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: "0 0 3px",
                        fontWeight: 700, fontSize: "var(--text-base)",
                        color: "var(--text-main)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {item.full_name || "مستخدم"}
                      </p>

                      {/* العمر + المدينة */}
                      {(item.age || item.city) && (
                        <p style={{
                          margin: "0 0 3px", fontSize: "var(--text-xs)",
                          color: "var(--text-secondary)",
                          display: "flex", alignItems: "center", gap: 4,
                        }}>
                          {item.age && <span>{item.age} سنة</span>}
                          {item.age && item.city && <span>·</span>}
                          {item.city && (
                            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                              <MapPin size={10} /> {item.city}
                            </span>
                          )}
                        </p>
                      )}

                      {/* تاريخ الحظر */}
                      <p style={{ margin: 0, fontSize: 10, color: "var(--text-tertiary)" }}>
                        حُظر في {formatDate(item.blockedAt)}
                      </p>
                    </div>
                  </div>

                  {/* زر إلغاء الحظر */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.04 }}
                    onClick={() => setConfirmItem(item)}
                    style={{
                      flexShrink: 0,
                      padding: "8px 14px",
                      borderRadius: 12,
                      background: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.28)",
                      color: "#22c55e",
                      fontWeight: 700, fontSize: 12,
                      cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 5,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ShieldCheck size={13} />
                    إلغاء الحظر
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
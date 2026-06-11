"use client";
/**
 * 📁 components/security/BlockedUsersSheet.tsx — ZAWAJ AI v3
 * ✅ مطابق تماماً لمتغيرات globals.css (الوضعان الليلي والنهاري)
 * ✅ Dialog توسيط صحيح على Android (flex wrapper)
 * ✅ Skeleton يستخدم var(--glass-bg) بدل rgba ثابتة
 * ✅ نصوص وحدود وخلفيات كلها من CSS vars
 * ✅ تضبيب is_photos_blurred
 */

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion }          from "framer-motion";
import { X, ShieldOff, ShieldCheck, MapPin, UserX } from "lucide-react";
import { supabase }                         from "@/lib/supabase/client";

type BlockedUser = {
  blockId:           string;
  blockedAt:         string;
  id:                string;
  full_name:         string | null;
  avatar_url:        string | null;
  is_photos_blurred: boolean | null;
  age:               number | null;
  city:              string | null;
  country:           string | null;
};

type Props = { open: boolean; onClose: () => void };

// ── Skeleton ──────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "var(--sp-3)",
      padding: "var(--sp-3) var(--sp-4)",
      borderRadius: "var(--radius-lg)",
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
        background: "var(--glass-border)",
        animation: "zawaj-pulse 1.4s ease-in-out infinite",
      }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--sp-2)" }}>
        <div style={{
          height: 13, borderRadius: "var(--radius-xs)", width: "52%",
          background: "var(--glass-border)",
          animation: "zawaj-pulse 1.4s ease-in-out infinite",
        }} />
        <div style={{
          height: 10, borderRadius: "var(--radius-xs)", width: "36%",
          background: "var(--glass-border)",
          animation: "zawaj-pulse 1.4s ease-in-out 0.2s infinite",
        }} />
      </div>
      <div style={{
        width: 90, height: 34, borderRadius: "var(--radius-sm)",
        background: "var(--glass-border)",
        animation: "zawaj-pulse 1.4s ease-in-out infinite",
      }} />
      <style>{`
        @keyframes zawaj-pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.35; }
        }
      `}</style>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────
function Spinner({ size = 15 }: { size?: number }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
      style={{
        width: size, height: size, borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.25)",
        borderTopColor: "#fff", flexShrink: 0,
      }}
    />
  );
}

// ── Dialog تأكيد إلغاء الحظر ─────────────────────────────────
function ConfirmDialog({ open, name, onConfirm, onCancel, loading }: {
  open: boolean; name: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: "fixed", inset: 0, zIndex: 9998,
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "var(--glass-blur)",
            }}
          />

          {/* ✅ flex wrapper — توسيط صحيح على Android */}
          <div style={{
            position: "fixed", inset: 0, zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 var(--sp-5)",
            pointerEvents: "none",
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.86, y: 28 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.86, y: 28 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              style={{
                width: "100%", maxWidth: 320,
                background: "var(--bg-elevated)",
                border: "1px solid var(--glass-border)",
                borderRadius: "var(--radius-lg)",
                padding: "var(--sp-8) var(--sp-6) var(--sp-5)",
                boxShadow: "var(--shadow-deep)",
                direction: "rtl",
                pointerEvents: "auto",
              }}
            >
              {/* أيقونة */}
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto var(--sp-4)",
              }}>
                <ShieldCheck size={24} color="#22c55e" strokeWidth={1.8} />
              </div>

              <p style={{
                textAlign: "center", margin: `0 0 var(--sp-2)`,
                color: "var(--text-main)", fontWeight: 800,
                fontSize: "var(--text-lg)",
              }}>
                إلغاء حظر {name}؟
              </p>

              <p style={{
                textAlign: "center", margin: `0 0 var(--sp-6)`,
                color: "var(--text-tertiary)",
                fontSize: "var(--text-sm)", lineHeight: "var(--lh-relaxed)",
              }}>
                سيتمكن مجدداً من رؤيتك والتواصل معك.
              </p>

              <div style={{ display: "flex", gap: "var(--sp-3)" }}>
                {/* إلغاء */}
                <button onClick={onCancel} disabled={loading} style={{
                  flex: 1, height: "var(--btn-h)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--glass-bg)",
                  border: "1px solid var(--glass-border)",
                  color: "var(--text-secondary)",
                  fontWeight: 700, fontSize: "var(--text-sm)",
                  cursor: "pointer", fontFamily: "inherit",
                }}>
                  إلغاء
                </button>

                {/* تأكيد */}
                <motion.button
                  whileTap={{ scale: 0.94 }} onClick={onConfirm} disabled={loading}
                  style={{
                    flex: 1, height: "var(--btn-h)",
                    borderRadius: "var(--radius-sm)",
                    background: loading
                      ? "rgba(34,197,94,0.2)"
                      : "linear-gradient(145deg,#22c55e,#15803d)",
                    border: "none", color: "#fff",
                    fontWeight: 800, fontSize: "var(--text-sm)",
                    cursor: loading ? "default" : "pointer",
                    fontFamily: "inherit",
                    boxShadow: loading ? "none" : "0 4px 16px rgba(34,197,94,0.3)",
                    display: "flex", alignItems: "center",
                    justifyContent: "center", gap: "var(--sp-2)",
                  }}
                >
                  {loading
                    ? <Spinner />
                    : <><ShieldCheck size={14} strokeWidth={2} /> إلغاء الحظر</>
                  }
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ══════════════════════════════════════════════════════════════
export default function BlockedUsersSheet({ open, onClose }: Props) {
  const [loading,     setLoading]     = useState(true);
  const [users,       setUsers]       = useState<BlockedUser[]>([]);
  const [confirmItem, setConfirmItem] = useState<BlockedUser | null>(null);
  const [unblocking,  setUnblocking]  = useState(false);

  // ── جلب المحظورين ─────────────────────────────────────────
  const fetchBlockedUsers = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: blocks, error } = await supabase
      .from("blocks")
      .select("id, created_at, blocked_id")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !blocks?.length) {
      setLoading(false); setUsers([]); return;
    }

    const blockedIds = blocks.map((b: any) => b.blocked_id);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, is_photos_blurred, age, city, country")
      .in("id", blockedIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    const merged: BlockedUser[] = blocks.map((b: any) => {
      const p: any = profileMap.get(b.blocked_id) ?? {};
      return {
        blockId:           b.id,
        blockedAt:         b.created_at,
        id:                b.blocked_id,
        full_name:         p.full_name         ?? null,
        avatar_url:        p.avatar_url        ?? null,
        is_photos_blurred: p.is_photos_blurred ?? false,
        age:               p.age               ?? null,
        city:              p.city              ?? null,
        country:           p.country           ?? null,
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
      .from("blocks").delete().eq("id", confirmItem.blockId);
    if (!error) setUsers(prev => prev.filter(u => u.blockId !== confirmItem.blockId));
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
              paddingBottom: "var(--nav-h-safe, 80px)",
            }}
          >

            {/* ── Header ─────────────────────────────────────── */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "0 var(--sp-4)",
              height: "var(--header-h)",
              borderBottom: "1px solid var(--glass-border)",
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              flexShrink: 0,
            }}>
              {/* زر إغلاق */}
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                style={{
                  width: 38, height: 38, borderRadius: "var(--radius-full)",
                  border: "1px solid var(--glass-border)",
                  background: "var(--glass-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "var(--text-main)", outline: "none",
                }}
              >
                <X size={18} strokeWidth={2} />
              </motion.button>

              {/* العنوان + العداد */}
              <div style={{
                display: "flex", alignItems: "center",
                gap: "var(--sp-2)", direction: "rtl",
              }}>
                <ShieldOff size={16} color="var(--color-primary)" strokeWidth={2} />
                <span style={{
                  fontWeight: 800, fontSize: "var(--text-lg)",
                  color: "var(--text-main)",
                }}>
                  المحظورون
                </span>
                {!loading && users.length > 0 && (
                  <span style={{
                    minWidth: 22, height: 22,
                    borderRadius: "var(--radius-full)",
                    background: "var(--color-primary)",
                    color: "#fff", fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center",
                    justifyContent: "center", padding: "0 6px",
                  }}>
                    {users.length}
                  </span>
                )}
              </div>

              {/* placeholder توازن */}
              <div style={{ width: 38 }} />
            </div>

            {/* ── وصف ─────────────────────────────────────────── */}
            <div style={{
              padding: "var(--sp-3) var(--sp-5) var(--sp-1)",
              flexShrink: 0,
            }}>
              <p style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-tertiary)",
                lineHeight: "var(--lh-relaxed)",
                margin: 0, direction: "rtl",
              }}>
                المحظورون لا يستطيعون رؤيتك أو التواصل معك أو الظهور في اقتراحاتك.
              </p>
            </div>

            {/* ── المحتوى ─────────────────────────────────────── */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "var(--sp-3) var(--sp-4) 0",
              display: "flex", flexDirection: "column",
              gap: "var(--sp-3)",
            }}>

              {/* Skeleton */}
              {loading && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

              {/* Empty state */}
              {!loading && users.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    gap: "var(--sp-4)", minHeight: "50vh",
                    direction: "rtl", textAlign: "center",
                  }}
                >
                  <div style={{
                    width: 72, height: 72,
                    borderRadius: "var(--radius-full)",
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <UserX size={28} color="var(--text-tertiary)" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{
                      margin: "0 0 var(--sp-2)", fontWeight: 800,
                      fontSize: "var(--text-lg)", color: "var(--text-main)",
                    }}>
                      لا يوجد محظورون
                    </p>
                    <p style={{
                      margin: 0, fontSize: "var(--text-sm)",
                      color: "var(--text-tertiary)",
                      lineHeight: "var(--lh-relaxed)",
                    }}>
                      عندما تحظر شخصاً سيظهر هنا
                    </p>
                  </div>
                </motion.div>
              )}

              {/* القائمة */}
              <AnimatePresence>
                {!loading && users.map((item, i) => (
                  <motion.div
                    key={item.blockId} layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, scale: 0.95 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: "flex", alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--sp-3)",
                      padding: "var(--sp-3) var(--sp-4)",
                      borderRadius: "var(--radius-lg)",
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                      direction: "rtl",
                    }}
                  >
                    {/* صورة + معلومات */}
                    <div style={{
                      display: "flex", alignItems: "center",
                      gap: "var(--sp-3)", flex: 1, minWidth: 0,
                    }}>
                      {/* الصورة */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <img
                          src={item.avatar_url || "/default-avatar.png"}
                          alt={item.full_name || "مستخدم"}
                          style={{
                            width: "var(--avatar-md)", height: "var(--avatar-md)",
                            borderRadius: "var(--radius-full)",
                            objectFit: "cover",
                            border: "1.5px solid var(--glass-border)",
                            display: "block",
                            filter: item.is_photos_blurred ? "blur(12px)" : "none",
                            transform: item.is_photos_blurred ? "scale(1.06)" : "none",
                          }}
                        />
                        {/* بادج الحظر */}
                        <div style={{
                          position: "absolute", bottom: -2, right: -2,
                          width: 18, height: 18,
                          borderRadius: "var(--radius-full)",
                          background: "var(--color-primary)",
                          border: "2px solid var(--bg-main)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <ShieldOff size={9} color="#fff" strokeWidth={2} />
                        </div>
                      </div>

                      {/* النص */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          margin: "0 0 var(--sp-1)",
                          fontWeight: 700, fontSize: "var(--text-base)",
                          color: "var(--text-main)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {item.full_name || "مستخدم"}
                        </p>

                        {/* العمر + المدينة */}
                        {(item.age || item.city) && (
                          <div style={{
                            display: "flex", alignItems: "center",
                            gap: "var(--sp-1)",
                            fontSize: "var(--text-xs)",
                            color: "var(--text-secondary)",
                            marginBottom: "var(--sp-1)",
                          }}>
                            {item.age && <span>{item.age} سنة</span>}
                            {item.age && item.city && (
                              <span style={{ color: "var(--glass-border)" }}>·</span>
                            )}
                            {item.city && (
                              <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                                <MapPin size={10} strokeWidth={2} /> {item.city}
                              </span>
                            )}
                          </div>
                        )}

                        {/* تاريخ الحظر */}
                        <p style={{
                          margin: 0,
                          fontSize: "var(--text-2xs)",
                          color: "var(--text-tertiary)",
                        }}>
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
                        padding: "var(--sp-2) var(--sp-3)",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(34,197,94,0.1)",
                        border: "1px solid rgba(34,197,94,0.25)",
                        color: "#22c55e",
                        fontWeight: 700, fontSize: "var(--text-xs)",
                        cursor: "pointer", fontFamily: "inherit",
                        display: "flex", alignItems: "center",
                        gap: "var(--sp-1)", whiteSpace: "nowrap",
                      }}
                    >
                      <ShieldCheck size={13} strokeWidth={2} />
                      إلغاء الحظر
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
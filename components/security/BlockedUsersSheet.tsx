"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldX } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type BlockedProfile = {
  id: string;
  created_at: string;
  blocked: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_photos_blurred: boolean | null;
    age: number | null;
    country: string | null;
    city: string | null;
  };
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function BlockedUsersSheet({
  open,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<BlockedProfile[]>([]);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    fetchBlockedUsers();
  }, [open]);

  async function fetchBlockedUsers() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("blocks")
      .select(`
        id,
        created_at,
        blocked:blocked_id (
          id,
          full_name,
          avatar_url,
          is_photos_blurred,
          age,
          country,
          city
        )
      `)
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data as BlockedProfile[]);
    }

    setLoading(false);
  }

  async function handleUnblock(blockId: string) {
    setUnblockingId(blockId);

    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("id", blockId);

    if (!error) {
      setUsers((prev) =>
        prev.filter((item) => item.id !== blockId)
      );
    }

    setUnblockingId(null);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[120] flex flex-col"
          style={{
            background: "var(--bg-main)",
            paddingTop: "var(--safe-top)",
            paddingBottom: "calc(var(--nav-h-safe) + var(--sp-4))",
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-20 flex items-center justify-between"
            style={{
              paddingInline: "var(--sp-4)",
              height: "var(--header-h)",
              borderBottom: "1px solid var(--border-soft)",
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
            }}
          >
            <button
              onClick={onClose}
              className="flex items-center justify-center"
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "var(--radius-full)",
                color: "var(--text-main)",
              }}
            >
              <X className="icon-md" />
            </button>

            <h2
              style={{
                fontSize: "var(--text-lg)",
                fontWeight: 800,
                color: "var(--text-main)",
              }}
            >
              المستخدمون المحظورون
            </h2>

            <div style={{ width: "2.5rem" }} />
          </div>

          {/* Description */}
          <div
            style={{
              paddingInline: "var(--sp-5)",
              paddingTop: "var(--sp-4)",
              paddingBottom: "var(--sp-2)",
            }}
          >
            <p
              style={{
                fontSize: "var(--text-sm)",
                color: "var(--text-secondary)",
                lineHeight: "var(--lh-relaxed)",
              }}
            >
              الأشخاص الذين قمت بحظرهم لن يتمكنوا من التواصل
              معك أو رؤية حسابك.
            </p>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto no-scrollbar"
            style={{
              paddingInline: "var(--sp-4)",
              paddingTop: "var(--sp-3)",
            }}
          >
            {loading ? (
              <div
                className="flex items-center justify-center"
                style={{
                  height: "40vh",
                }}
              >
                <div
                  className="animate-spin"
                  style={{
                    width: "2rem",
                    height: "2rem",
                    borderRadius: "999px",
                    border: "2px solid var(--border-soft)",
                    borderTopColor: "var(--color-primary)",
                  }}
                />
              </div>
            ) : users.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center text-center"
                style={{
                  minHeight: "50vh",
                  gap: "var(--sp-4)",
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "5rem",
                    height: "5rem",
                    borderRadius: "var(--radius-full)",
                    background: "var(--color-primary-xsoft)",
                    color: "var(--color-primary)",
                  }}
                >
                  <ShieldX
                    style={{
                      width: "2rem",
                      height: "2rem",
                    }}
                  />
                </div>

                <div
                  className="flex flex-col"
                  style={{
                    gap: "var(--sp-2)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "var(--text-lg)",
                      color: "var(--text-main)",
                      fontWeight: 800,
                    }}
                  >
                    لا يوجد مستخدمون محظورون
                  </h3>

                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                      lineHeight: "var(--lh-relaxed)",
                    }}
                  >
                    عندما تقوم بحظر شخص سيظهر هنا.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="flex flex-col"
                style={{
                  gap: "var(--sp-3)",
                }}
              >
                {users.map((item) => {
                  const profile = item.blocked;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="glass-panel"
                      style={{
                        padding: "var(--sp-3)",
                        borderRadius: "var(--radius-lg)",
                      }}
                    >
                      <div
                        className="flex items-center justify-between"
                        style={{
                          gap: "var(--sp-3)",
                        }}
                      >
                        <div
                          className="flex items-center"
                          style={{
                            gap: "var(--sp-3)",
                          }}
                        >
                          <img
                            src={
                              profile.avatar_url ||
                              "/images/default-avatar.png"
                            }
                            alt={profile.full_name || "مستخدم"}
                            className="avatar-md"
                            style={{
                              objectFit: "cover",
                              border:
                                "1px solid var(--border-soft)",
                              filter: profile.is_photos_blurred
                                ? "blur(14px)"
                                : "none",
                            }}
                          />

                          <div
                            className="flex flex-col"
                            style={{
                              gap: "0.2rem",
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "var(--text-base)",
                                fontWeight: 700,
                                color: "var(--text-main)",
                              }}
                            >
                              {profile.full_name || "مستخدم"}
                            </h4>

                            <p
                              style={{
                                fontSize: "var(--text-xs)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {profile.age
                                ? `${profile.age} سنة`
                                : ""}
                              {profile.city &&
                                ` • ${profile.city}`}
                              {profile.country &&
                                `، ${profile.country}`}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleUnblock(item.id)
                          }
                          disabled={
                            unblockingId === item.id
                          }
                          className="btn-premium"
                          style={{
                            minWidth: "6.5rem",
                            opacity:
                              unblockingId === item.id
                                ? 0.7
                                : 1,
                          }}
                        >
                          {unblockingId === item.id
                            ? "..."
                            : "إلغاء الحظر"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
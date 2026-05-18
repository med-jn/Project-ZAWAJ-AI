"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ImagePlus,
  Loader2,
  Send,
  ShieldAlert,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

const REPORT_REASONS = [
  {
    value: "fake_identity",
    label: "انتحال أو معلومات غير حقيقية",
  },
  {
    value: "inappropriate_photos",
    label: "صور غير مناسبة",
  },
  {
    value: "harassment",
    label: "إزعاج أو سلوك غير محترم",
  },
  {
    value: "sexual_content",
    label: "محتوى غير لائق",
  },
  {
    value: "scam",
    label: "احتيال أو طلبات مالية",
  },
  {
    value: "spam",
    label: "رسائل مزعجة أو متكررة",
  },
  {
    value: "underage",
    label: "يُحتمل أن العمر غير حقيقي",
  },
  {
    value: "married_not_serious",
    label: "غير جاد في الزواج",
  },
  {
    value: "offensive_language",
    label: "ألفاظ أو تصرفات مسيئة",
  },
  {
    value: "other",
    label: "سبب آخر",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;

  reportedUserId: string;

  targetType?: string;
  targetId?: string | null;
};

export default function ReportSheet({
  open,
  onClose,
  reportedUserId,
  targetType = "profile",
  targetId = null,
}: Props) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const [images, setImages] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [dailyUploads, setDailyUploads] = useState(0);

  useEffect(() => {
    if (open) {
      loadDailyUploads();
    }
  }, [open]);

  async function loadDailyUploads() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("report_attachments")
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("uploader_id", user.id)
      .gte("created_at", startOfDay.toISOString());

    setDailyUploads(count || 0);
  }

  const remainingUploads = useMemo(() => {
    return Math.max(0, 3 - dailyUploads);
  }, [dailyUploads]);

  async function compressImage(file: File) {
    return new Promise<File>((resolve) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");

        const maxWidth = 1280;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            const compressed = new File(
              [blob],
              `${crypto.randomUUID()}.webp`,
              {
                type: "image/webp",
              }
            );

            resolve(compressed);
          },
          "image/webp",
          0.55
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }

  async function handleSelectImages(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    const allowed = remainingUploads - images.length;

    if (allowed <= 0) return;

    const selected = files.slice(0, allowed);

    const compressedFiles: File[] = [];

    for (const file of selected) {
      const compressed = await compressImage(file);

      if (compressed.size <= 100 * 1024) {
        compressedFiles.push(compressed);
      }
    }

    setImages((prev) => [...prev, ...compressedFiles]);
  }

  async function handleSubmit() {
    if (!reason || loading) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_id: reportedUserId,
        reason,
        details,
        target_type: targetType,
        target_id: targetId,
        status: "pending",
      })
      .select()
      .single();

    if (error || !report) {
      setLoading(false);
      return;
    }

    for (const image of images) {
      const filePath = `${user.id}/${report.id}/${crypto.randomUUID()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("evidence")
        .upload(filePath, image, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/webp",
        });

      if (!uploadError) {
        await supabase
          .from("report_attachments")
          .insert({
            report_id: report.id,
            uploader_id: user.id,
            file_path: filePath,
            file_size: image.size,
            mime_type: image.type,
          });
      }
    }

    setSuccess(true);
    setLoading(false);

    setTimeout(() => {
      onClose();

      setSuccess(false);
      setReason("");
      setDetails("");
      setImages([]);
    }, 1400);
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex flex-col"
          style={{
            background: "var(--bg-main)",
            paddingTop: "var(--safe-top)",
            paddingBottom:
              "calc(var(--nav-h-safe) + var(--sp-4))",
          }}
        >
          {/* HEADER */}

          <div
            className="sticky top-0 z-20 flex items-center justify-between"
            style={{
              height: "var(--header-h)",
              paddingInline: "var(--sp-4)",
              background: "var(--glass-bg)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              borderBottom:
                "1px solid var(--border-soft)",
            }}
          >
            <button
              onClick={onClose}
              className="flex items-center justify-center"
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "var(--radius-full)",
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
              إرسال بلاغ
            </h2>

            <div style={{ width: "2.5rem" }} />
          </div>

          {/* BODY */}

          <div
            className="flex-1 overflow-y-auto no-scrollbar"
            style={{
              padding: "var(--sp-4)",
            }}
          >
            {/* TOP */}

            <div
              className="glass-panel"
              style={{
                padding: "var(--sp-4)",
                marginBottom: "var(--sp-4)",
              }}
            >
              <div
                className="flex items-start"
                style={{
                  gap: "var(--sp-3)",
                }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "3rem",
                    height: "3rem",
                    borderRadius: "var(--radius-full)",
                    background:
                      "var(--color-primary-xsoft)",
                    color: "var(--color-primary)",
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert className="icon-lg" />
                </div>

                <div
                  className="flex flex-col"
                  style={{
                    gap: "var(--sp-2)",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "var(--text-base)",
                      fontWeight: 800,
                    }}
                  >
                    ساعدنا في الحفاظ على بيئة آمنة ومحترمة
                  </h3>

                  <p
                    style={{
                      fontSize: "var(--text-sm)",
                      color: "var(--text-secondary)",
                      lineHeight: "var(--lh-relaxed)",
                    }}
                  >
                    تتم مراجعة البلاغات بسرية تامة، ويُرجى
                    إرسال البلاغات الجادة فقط.
                  </p>
                </div>
              </div>
            </div>

            {/* REASONS */}

            <div
              className="flex flex-col"
              style={{
                gap: "var(--sp-3)",
              }}
            >
              {REPORT_REASONS.map((item) => {
                const selected = reason === item.value;

                return (
                  <button
                    key={item.value}
                    onClick={() => setReason(item.value)}
                    className="glass-panel"
                    style={{
                      padding: "var(--sp-4)",
                      border: selected
                        ? "1px solid var(--color-primary)"
                        : "1px solid var(--border-soft)",
                      background: selected
                        ? "var(--color-primary-xsoft)"
                        : undefined,
                      textAlign: "right",
                    }}
                  >
                    <div
                      className="flex items-center justify-between"
                    >
                      <span
                        style={{
                          fontSize: "var(--text-base)",
                          fontWeight: 700,
                          color: "var(--text-main)",
                        }}
                      >
                        {item.label}
                      </span>

                      {selected && (
                        <Check
                          style={{
                            width: "1.2rem",
                            height: "1.2rem",
                            color: "var(--color-primary)",
                          }}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* DETAILS */}

            <div
              style={{
                marginTop: "var(--sp-5)",
              }}
            >
              <textarea
                value={details}
                onChange={(e) =>
                  setDetails(e.target.value)
                }
                placeholder="أضف تفاصيل إضافية إذا لزم الأمر..."
                style={{
                  width: "100%",
                  minHeight: "7rem",
                  resize: "none",
                  borderRadius: "var(--radius-lg)",
                  padding: "var(--sp-4)",
                  background: "var(--glass-bg)",
                  border:
                    "1px solid var(--border-soft)",
                  color: "var(--text-main)",
                  fontSize: "var(--text-base)",
                  outline: "none",
                  lineHeight: "var(--lh-relaxed)",
                  backdropFilter: "var(--glass-blur)",
                }}
              />
            </div>

            {/* EVIDENCE */}

            <div
              style={{
                marginTop: "var(--sp-5)",
              }}
            >
              <label
                className="glass-panel flex items-center justify-center"
                style={{
                  padding: "var(--sp-4)",
                  cursor: "pointer",
                  gap: "var(--sp-3)",
                  borderStyle: "dashed",
                }}
              >
                <ImagePlus className="icon-md" />

                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    fontWeight: 700,
                  }}
                >
                  إضافة لقطات شاشة
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleSelectImages}
                />
              </label>

              {!!images.length && (
                <div
                  className="flex overflow-x-auto no-scrollbar"
                  style={{
                    gap: "var(--sp-3)",
                    marginTop: "var(--sp-3)",
                  }}
                >
                  {images.map((img, index) => (
                    <div
                      key={index}
                      style={{
                        position: "relative",
                      }}
                    >
                      <img
                        src={URL.createObjectURL(img)}
                        alt=""
                        style={{
                          width: "5rem",
                          height: "5rem",
                          objectFit: "cover",
                          borderRadius:
                            "var(--radius-md)",
                          border:
                            "1px solid var(--border-soft)",
                        }}
                      />

                      <button
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter(
                              (_, i) => i !== index
                            )
                          )
                        }
                        style={{
                          position: "absolute",
                          top: "-0.35rem",
                          left: "-0.35rem",
                          width: "1.5rem",
                          height: "1.5rem",
                          borderRadius: "999px",
                          border: "none",
                          background:
                            "var(--color-primary)",
                          color: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}

          <div
            style={{
              paddingInline: "var(--sp-4)",
              paddingTop: "var(--sp-3)",
            }}
          >
            <button
              onClick={handleSubmit}
              disabled={!reason || loading}
              className="btn-premium"
              style={{
                width: "100%",
                height: "3.2rem",
                opacity:
                  !reason || loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2
                    className="animate-spin"
                    size={18}
                  />
                  جاري الإرسال...
                </>
              ) : success ? (
                <>
                  <Check size={18} />
                  تم إرسال البلاغ
                </>
              ) : (
                <>
                  <Send size={18} />
                  إرسال البلاغ
                </>
              )}
            </button>

            {!success && (
              <div
                className="flex items-start"
                style={{
                  gap: "var(--sp-2)",
                  marginTop: "var(--sp-3)",
                }}
              >
                <AlertTriangle
                  style={{
                    width: "1rem",
                    height: "1rem",
                    color: "var(--text-tertiary)",
                    flexShrink: 0,
                    marginTop: "0.15rem",
                  }}
                />

                <p
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--text-secondary)",
                    lineHeight: "var(--lh-relaxed)",
                  }}
                >
                  قد يؤدي إرسال بلاغات كاذبة أو مسيئة إلى
                  تقييد حسابك.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


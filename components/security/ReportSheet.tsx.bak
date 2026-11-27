"use client";
/**
 * 📁 components/security/ReportSheet.tsx — ZAWAJ AI v2
 * ✅ خطوات واضحة: السبب ← التفاصيل ← لقطات الشاشة (تظهر دائمًا دون تمرير طويل)
 * ✅ تفاصيل إلزامية عند «سبب آخر»، وإرشاد خاص لكل سبب
 * ✅ لقطات الشاشة: ضغط تكيّفي (لا تُرفض الصور بصمت) + عرض الحصة المتبقية + معاينة وحذف
 * ✅ بلاغات سلامة الأطفال: لا رفع صور إطلاقًا (حفاظًا على الضحية وتفاديًا لتداول محتوى محظور)
 * ✅ أخطاء واضحة (تكرار / حد يومي / عام) + رقم مرجعي بعد الإرسال
 */

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
import { toast } from "sonner";

import { supabase } from "@/lib/supabase/client";

type Evidence = "recommended" | "optional" | "none";

type Reason = {
  value: string;
  label: string;
  hint: string;
  evidence: Evidence;
  critical?: boolean;
};

const REASONS: Reason[] = [
  {
    value: "child_safety",
    label: "استغلال أو إساءة تخص قاصرًا (أقل من 18)",
    hint: "صف ما حدث بدقة قدر الإمكان. لا ترفق أي صور أو مقاطع تخص القاصر — سنتعامل مع البلاغ بأولوية قصوى.",
    evidence: "none",
    critical: true,
  },
  {
    value: "fake_identity",
    label: "انتحال أو معلومات غير حقيقية",
    hint: "ما الذي يدل على أن الحساب غير حقيقي؟",
    evidence: "recommended",
  },
  {
    value: "inappropriate_photos",
    label: "صور غير مناسبة",
    hint: "صف الصور المخالفة وأين تظهر (الملف الشخصي أم المحادثة).",
    evidence: "recommended",
  },
  {
    value: "harassment",
    label: "إزعاج أو سلوك غير محترم",
    hint: "ماذا حدث؟ متى؟ وهل تكرر؟",
    evidence: "recommended",
  },
  {
    value: "sexual_content",
    label: "محتوى غير لائق",
    hint: "صف المحتوى وأين ظهر.",
    evidence: "recommended",
  },
  {
    value: "scam",
    label: "احتيال أو طلبات مالية",
    hint: "ما المبلغ أو الطلب؟ وكيف طُلب منك؟",
    evidence: "recommended",
  },
  {
    value: "spam",
    label: "رسائل مزعجة أو متكررة",
    hint: "صف الرسائل وعدد مرات تكرارها.",
    evidence: "recommended",
  },
  {
    value: "underage",
    label: "يُحتمل أن العمر غير حقيقي",
    hint: "ما الذي يجعلك تشك في العمر المذكور؟",
    evidence: "optional",
  },
  {
    value: "married_not_serious",
    label: "غير جاد في الزواج",
    hint: "ما الذي يدل على ذلك؟",
    evidence: "optional",
  },
  {
    value: "offensive_language",
    label: "ألفاظ أو تصرفات مسيئة",
    hint: "اذكر ما قيل أو فُعل.",
    evidence: "recommended",
  },
  {
    value: "other",
    label: "سبب آخر",
    hint: "اشرح المشكلة بوضوح (10 أحرف على الأقل).",
    evidence: "optional",
  },
];

const DAILY_UPLOAD_LIMIT = 3;
const MAX_IMAGE_BYTES = 250 * 1024;
const MIN_OTHER_DETAILS = 10;

type Props = {
  open: boolean;
  onClose: () => void;

  reportedUserId: string;

  targetType?: string;
  targetId?: string | null;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_load_failed"));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
}

/** ضغط تكيّفي: يجرّب أبعادًا وجودات أقل حتى يصل للحجم المسموح، وإلا يعيد null */
async function compressImage(file: File): Promise<File | null> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return null;
  }

  for (const maxWidth of [1280, 1024, 800]) {
    let width = img.width;
    let height = img.height;
    if (width > maxWidth) {
      height = Math.round(height * (maxWidth / width));
      width = maxWidth;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);

    for (const quality of [0.7, 0.55, 0.4]) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= MAX_IMAGE_BYTES) {
        return new File([blob], `${crypto.randomUUID()}.webp`, { type: "image/webp" });
      }
    }
  }
  return null;
}

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
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [refId, setRefId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [dailyUploads, setDailyUploads] = useState(0);

  const current = REASONS.find((r) => r.value === reason) || null;
  const allowEvidence = !!current && current.evidence !== "none";

  useEffect(() => {
    if (open) loadDailyUploads();
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
      .select("*", { count: "exact", head: true })
      .eq("uploader_id", user.id)
      .gte("created_at", startOfDay.toISOString());

    setDailyUploads(count || 0);
  }

  const remainingUploads = Math.max(0, DAILY_UPLOAD_LIMIT - dailyUploads - images.length);

  const previews = useMemo(() => images.map((f) => URL.createObjectURL(f)), [images]);
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  const detailsOk = reason !== "other" || details.trim().length >= MIN_OTHER_DETAILS;
  const canSubmit = !!reason && detailsOk && !loading && !processing && !success;

  function selectReason(value: string) {
    setReason(value);
    setError(null);
    // بلاغ سلامة الأطفال: لا نحتفظ بأي صور
    if (value === "child_safety") setImages([]);
  }

  async function handleSelectImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    if (remainingUploads <= 0) {
      toast.error("بلغت الحد اليومي لرفع لقطات الشاشة.");
      return;
    }

    const selected = files.slice(0, remainingUploads);
    if (files.length > selected.length) {
      toast.warning(`سنضيف ${selected.length} فقط بسبب الحد اليومي.`);
    }

    setProcessing(true);
    const ready: File[] = [];
    let rejected = 0;
    for (const file of selected) {
      const compressed = await compressImage(file);
      if (compressed) ready.push(compressed);
      else rejected++;
    }
    setProcessing(false);

    if (ready.length) setImages((prev) => [...prev, ...ready]);
    if (rejected) toast.error(`تعذّر تجهيز ${rejected} صورة (غير مدعومة أو كبيرة جدًا).`);
  }

  async function handleSubmit() {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError("انتهت الجلسة، سجّل الدخول من جديد.");
      return;
    }

    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        reporter_id: user.id,
        reported_id: reportedUserId,
        reason,
        details: details.trim() || null,
        target_type: targetType,
        target_id: targetId,
        status: "pending",
      })
      .select()
      .single();

    if (insertError || !report) {
      setLoading(false);
      const msg =
        insertError?.code === "23505"
          ? "لديك بلاغ مماثل قيد المراجعة بالفعل."
          : insertError?.code === "42501"
            ? "لا يمكنك إرسال بلاغ جديد الآن (بلغتَ الحد المسموح)."
            : "تعذّر إرسال البلاغ، حاول مرة أخرى.";
      setError(msg);
      toast.error(msg);
      return;
    }

    let failedUploads = 0;
    if (allowEvidence) {
      for (const image of images) {
        const filePath = `${user.id}/${report.id}/${crypto.randomUUID()}.webp`;

        const { error: uploadError } = await supabase.storage
          .from("evidence")
          .upload(filePath, image, {
            cacheControl: "3600",
            upsert: false,
            contentType: "image/webp",
          });

        if (uploadError) {
          failedUploads++;
          continue;
        }

        const { error: attachError } = await supabase.from("report_attachments").insert({
          report_id: report.id,
          uploader_id: user.id,
          file_path: filePath,
          file_size: image.size,
          mime_type: image.type,
        });
        if (attachError) failedUploads++;
      }
    }

    if (failedUploads > 0) {
      toast.warning(`أُرسل البلاغ، لكن تعذّر رفع ${failedUploads} من لقطات الشاشة.`);
    }

    setRefId(String(report.id).slice(0, 8).toUpperCase());
    setSuccess(true);
    setLoading(false);
  }

  function handleClose() {
    onClose();
    // تفريغ الحالة بعد انتهاء حركة الإغلاق
    setTimeout(() => {
      setSuccess(false);
      setReason("");
      setDetails("");
      setImages([]);
      setError(null);
      setRefId("");
    }, 250);
  }

  const sectionTitle = (n: number, text: string, note?: string) => (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-3)" }}>
      <span
        style={{
          width: "1.5rem",
          height: "1.5rem",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "var(--text-xs)",
          fontWeight: 800,
          background: "var(--color-primary-xsoft)",
          color: "var(--color-primary)",
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      <span style={{ fontSize: "var(--text-base)", fontWeight: 800, color: "var(--text-main)" }}>{text}</span>
      {note && (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginInlineStart: "auto" }}>
          {note}
        </span>
      )}
    </div>
  );

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
            paddingBottom: "calc(var(--nav-h-safe) + var(--sp-4))",
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
              borderBottom: "1px solid var(--border-soft)",
            }}
          >
            <button
              onClick={handleClose}
              className="flex items-center justify-center"
              style={{ width: "2.5rem", height: "2.5rem", borderRadius: "var(--radius-full)" }}
            >
              <X className="icon-md" />
            </button>

            <h2 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--text-main)" }}>
              إرسال بلاغ
            </h2>

            <div style={{ width: "2.5rem" }} />
          </div>

          {success ? (
            /* SUCCESS */
            <div
              className="flex-1 flex flex-col items-center justify-center"
              style={{ padding: "var(--sp-6)", textAlign: "center", gap: "var(--sp-3)" }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: "4.5rem",
                  height: "4.5rem",
                  borderRadius: "var(--radius-full)",
                  background: "rgba(34,197,94,0.15)",
                  color: "#22c55e",
                }}
              >
                <Check size={34} />
              </div>
              <h3 style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--text-main)" }}>
                تم استلام بلاغك
              </h3>
              <p
                style={{
                  fontSize: "var(--text-sm)",
                  color: "var(--text-secondary)",
                  lineHeight: "var(--lh-relaxed)",
                  maxWidth: "20rem",
                }}
              >
                سيراجعه فريق الإشراف، وستصلك إشعارات بأي تحديث على بلاغك.
              </p>
              <div
                className="glass-panel"
                style={{ padding: "var(--sp-2) var(--sp-4)", fontSize: "var(--text-sm)", fontWeight: 700 }}
              >
                رقم البلاغ: #{refId}
              </div>
              <button
                onClick={handleClose}
                className="btn-premium"
                style={{ marginTop: "var(--sp-4)", height: "3.2rem", width: "100%", maxWidth: "20rem" }}
              >
                تم
              </button>
            </div>
          ) : (
            <>
              {/* BODY */}
              <div className="flex-1 overflow-y-auto no-scrollbar" style={{ padding: "var(--sp-4)" }}>
                {/* TOP */}
                <div
                  className="glass-panel"
                  style={{ padding: "var(--sp-3) var(--sp-4)", marginBottom: "var(--sp-5)" }}
                >
                  <div className="flex items-center" style={{ gap: "var(--sp-3)" }}>
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-primary-xsoft)",
                        color: "var(--color-primary)",
                        flexShrink: 0,
                      }}
                    >
                      <ShieldAlert className="icon-md" />
                    </div>
                    <p
                      style={{
                        fontSize: "var(--text-sm)",
                        color: "var(--text-secondary)",
                        lineHeight: "var(--lh-relaxed)",
                      }}
                    >
                      تتم مراجعة البلاغات بسرية تامة. ساعدنا بتفاصيل واضحة ليكون القرار أسرع وأدق.
                    </p>
                  </div>
                </div>

                {/* 1 — السبب */}
                {sectionTitle(1, "ما المشكلة؟")}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-2)" }}>
                  {REASONS.map((item) => {
                    const selected = reason === item.value;
                    const critical = !!item.critical;
                    const accent = critical ? "#ef4444" : "var(--color-primary)";
                    return (
                      <button
                        key={item.value}
                        onClick={() => selectReason(item.value)}
                        className="glass-panel"
                        style={{
                          gridColumn: critical ? "1 / -1" : undefined,
                          padding: "var(--sp-3) var(--sp-3)",
                          minHeight: "3.2rem",
                          border: selected ? `1px solid ${accent}` : "1px solid var(--border-soft)",
                          background: selected ? "var(--color-primary-xsoft)" : undefined,
                          textAlign: "right",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "var(--sp-2)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "var(--text-sm)",
                            fontWeight: 700,
                            lineHeight: 1.5,
                            color: critical ? "#f87171" : "var(--text-main)",
                          }}
                        >
                          {item.label}
                        </span>
                        {selected && <Check size={16} style={{ color: accent, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>

                {/* 2 — التفاصيل */}
                <div style={{ marginTop: "var(--sp-6)" }}>
                  {sectionTitle(
                    2,
                    "التفاصيل",
                    reason === "other" ? "مطلوبة" : "اختيارية — لكنها تسرّع المراجعة",
                  )}
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
                    placeholder={current?.hint || "اختر المشكلة أولًا ثم اشرحها هنا..."}
                    style={{
                      width: "100%",
                      minHeight: "7.5rem",
                      resize: "none",
                      borderRadius: "var(--radius-lg)",
                      padding: "var(--sp-4)",
                      background: "var(--glass-bg)",
                      border:
                        reason === "other" && !detailsOk
                          ? "1px solid #f87171"
                          : "1px solid var(--border-soft)",
                      color: "var(--text-main)",
                      fontSize: "var(--text-base)",
                      outline: "none",
                      lineHeight: "var(--lh-relaxed)",
                      backdropFilter: "var(--glass-blur)",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "var(--sp-1)",
                      fontSize: "var(--text-xs)",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    <span>
                      {reason === "other" && !detailsOk
                        ? `اكتب ${MIN_OTHER_DETAILS} أحرف على الأقل`
                        : ""}
                    </span>
                    <span>{details.length}/1000</span>
                  </div>
                </div>

                {/* 3 — لقطات الشاشة */}
                <div style={{ marginTop: "var(--sp-5)" }}>
                  {sectionTitle(
                    3,
                    "لقطات الشاشة",
                    current?.evidence === "recommended"
                      ? "موصى بها"
                      : current?.evidence === "none"
                        ? ""
                        : "اختيارية",
                  )}

                  {current?.evidence === "none" ? (
                    <div
                      className="glass-panel"
                      style={{
                        padding: "var(--sp-3) var(--sp-4)",
                        fontSize: "var(--text-sm)",
                        color: "var(--text-secondary)",
                        lineHeight: "var(--lh-relaxed)",
                      }}
                    >
                      لا تُرفق أي صور أو لقطات في هذا النوع من البلاغات. يكفي الوصف النصي، وسنتواصل معك
                      إن احتجنا لمعلومات إضافية.
                    </div>
                  ) : (
                    <>
                      <label
                        className="glass-panel flex items-center justify-center"
                        style={{
                          padding: "var(--sp-4)",
                          cursor: remainingUploads > 0 && !processing ? "pointer" : "not-allowed",
                          opacity: remainingUploads > 0 ? 1 : 0.55,
                          gap: "var(--sp-3)",
                          borderStyle: "dashed",
                        }}
                      >
                        {processing ? (
                          <Loader2 className="animate-spin icon-md" />
                        ) : (
                          <ImagePlus className="icon-md" />
                        )}
                        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700 }}>
                          {processing ? "جارٍ تجهيز الصور..." : "إضافة لقطات شاشة"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          hidden
                          disabled={remainingUploads <= 0 || processing}
                          onChange={handleSelectImages}
                        />
                      </label>

                      <p
                        style={{
                          marginTop: "var(--sp-2)",
                          fontSize: "var(--text-xs)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {remainingUploads > 0
                          ? `المتاح اليوم: ${remainingUploads} من ${DAILY_UPLOAD_LIMIT} لقطات`
                          : "بلغتَ الحد اليومي لرفع لقطات الشاشة"}
                      </p>

                      {!!images.length && (
                        <div
                          className="flex overflow-x-auto no-scrollbar"
                          style={{ gap: "var(--sp-3)", marginTop: "var(--sp-3)" }}
                        >
                          {images.map((img, index) => (
                            <div key={index} style={{ position: "relative", flexShrink: 0 }}>
                              <img
                                src={previews[index]}
                                alt=""
                                style={{
                                  width: "5rem",
                                  height: "5rem",
                                  objectFit: "cover",
                                  borderRadius: "var(--radius-md)",
                                  border: "1px solid var(--border-soft)",
                                }}
                              />
                              <button
                                onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                                aria-label="حذف الصورة"
                                style={{
                                  position: "absolute",
                                  top: "-0.35rem",
                                  left: "-0.35rem",
                                  width: "1.5rem",
                                  height: "1.5rem",
                                  borderRadius: "999px",
                                  border: "none",
                                  background: "var(--color-primary)",
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
                    </>
                  )}
                </div>
              </div>

              {/* FOOTER */}
              <div style={{ paddingInline: "var(--sp-4)", paddingTop: "var(--sp-3)" }}>
                {error && (
                  <p
                    style={{
                      marginBottom: "var(--sp-2)",
                      fontSize: "var(--text-sm)",
                      color: "#f87171",
                      fontWeight: 700,
                      textAlign: "center",
                    }}
                  >
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="btn-premium"
                  style={{
                    width: "100%",
                    height: "3.2rem",
                    opacity: canSubmit ? 1 : 0.6,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      إرسال البلاغ
                    </>
                  )}
                </button>

                <div className="flex items-start" style={{ gap: "var(--sp-2)", marginTop: "var(--sp-3)" }}>
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
                    قد يؤدي إرسال بلاغات كاذبة أو مسيئة إلى تقييد حسابك.
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

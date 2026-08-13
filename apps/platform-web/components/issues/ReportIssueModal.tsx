"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { usePlatformT, type PlatformT } from "../../lib/i18n";

export type IssueType = "NO_SHOW" | "BEHAVIOR" | "DROPOUT" | "ATTITUDE" | "PAYMENT" | "OTHER";

function typeOptions(t: PlatformT): { value: IssueType; label: string }[] {
  return [
    { value: "NO_SHOW", label: t("노쇼 (면접·면담 불참)", "No-show (missed interview/meeting)", "爽约（未参加面试·面谈）", "Vắng mặt (bỏ lỡ phỏng vấn/gặp mặt)", "無断欠席（面接・面談不参加）", "Tidak hadir (lewatkan wawancara)") },
    { value: "BEHAVIOR", label: t("행동·태도 문제", "Behavior issue", "行为态度问题", "Vấn đề hành vi", "行動・態度の問題", "Masalah perilaku") },
    { value: "DROPOUT", label: t("참여 중단", "Dropout", "中途退出", "Ngừng tham gia", "参加中止", "Berhenti") },
    { value: "ATTITUDE", label: t("커뮤니케이션 문제", "Communication issue", "沟通问题", "Vấn đề giao tiếp", "コミュニケーションの問題", "Masalah komunikasi") },
    { value: "PAYMENT", label: t("정산/결제 이슈", "Payment issue", "结算/支付问题", "Vấn đề thanh toán", "精算・決済の問題", "Masalah pembayaran") },
    { value: "OTHER", label: t("기타", "Other", "其他", "Khác", "その他", "Lainnya") }
  ];
}

export function ReportIssueModal({
  open,
  onClose,
  onSubmitted,
  defaultPositionId,
  defaultApplicationId,
  defaultSubjectUserId
}: {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
  defaultPositionId?: string;
  defaultApplicationId?: string;
  defaultSubjectUserId?: string;
}) {
  const t = usePlatformT();
  const [type, setType] = useState<IssueType>("OTHER");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setType("OTHER");
      setTitle("");
      setDescription("");
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function submit() {
    if (!title.trim() || !description.trim()) {
      setError(t("제목과 설명을 입력해주세요.", "Please enter a title and description.", "请输入标题和说明。", "Vui lòng nhập tiêu đề và mô tả.", "タイトルと説明を入力してください。", "Masukkan judul dan deskripsi."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const token = readAccessToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBaseUrl}/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          positionId: defaultPositionId,
          applicationId: defaultApplicationId,
          subjectUserId: defaultSubjectUserId
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("신고를 접수하지 못했습니다.", "Failed to submit the report.", "提交举报失败。", "Không gửi được báo cáo.", "報告を送信できませんでした。", "Gagal mengirim laporan."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11, 18, 39, 0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 16,
          width: "100%",
          maxWidth: 560,
          maxHeight: "calc(100vh - 48px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "0 24px 60px -20px rgba(15, 23, 42, 0.4)"
        }}
      >
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{t("이슈 리포트", "Report an issue", "问题举报", "Báo cáo sự cố", "問題を報告", "Laporkan isu")}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} style={{ background: "transparent", border: 0, fontSize: 22, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>
            ✕
          </button>
        </div>
        <div style={{ padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("유형", "Type", "类型", "Loại", "種類", "Jenis")}</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as IssueType)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
            >
              {typeOptions(t).map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("제목", "Title", "标题", "Tiêu đề", "タイトル", "Judul")}</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("예: 면접 약속 시간에 나타나지 않음", "e.g. Did not show up for the interview", "例如：未按约定时间参加面试", "VD: Không đến buổi phỏng vấn đã hẹn", "例：面接の約束時間に現れなかった", "Cth: Tidak hadir saat wawancara")}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
            />
          </label>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>{t("상황 설명", "Description", "情况说明", "Mô tả tình huống", "状況の説明", "Deskripsi situasi")}</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("언제 · 어디서 · 어떤 일이 있었는지 자세히 적어주세요. 가능하면 증빙(이메일/캡처)도 함께 언급해주세요.", "Describe when, where, and what happened in detail. If possible, mention evidence (emails/screenshots).", "请详细说明何时·何地·发生了什么。如有可能，请一并提供证据（邮件/截图）。", "Mô tả chi tiết khi nào, ở đâu và điều gì đã xảy ra. Nếu có thể, hãy đề cập bằng chứng (email/ảnh chụp).", "いつ・どこで・何が起きたか詳しく記入してください。可能であれば証拠（メール・スクショ）も添えてください。", "Jelaskan kapan, di mana, dan apa yang terjadi secara rinci. Jika bisa, sebutkan bukti (email/tangkapan layar).")}
              rows={6}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, resize: "vertical" }}
            />
          </label>
          {error ? <p style={{ color: "#dc2626", fontSize: 13, margin: 0 }}>{error}</p> : null}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#0B1227", fontWeight: 600, fontSize: 13, cursor: submitting ? "wait" : "pointer" }}
          >
            {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#0B1227", color: "#fff", fontWeight: 600, fontSize: 13, cursor: submitting ? "wait" : "pointer" }}
          >
            {submitting ? t("접수 중...", "Submitting...", "提交中...", "Đang gửi...", "送信中...", "Mengirim...") : t("리포트 보내기", "Send report", "发送举报", "Gửi báo cáo", "レポートを送信", "Kirim laporan")}
          </button>
        </div>
      </div>
    </div>
  );
}

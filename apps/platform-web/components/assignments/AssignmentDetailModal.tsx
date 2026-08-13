"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { usePlatformT, type PlatformT } from "../../lib/i18n";

export type AssignmentStatus = "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";

export type AssignmentDetailItem = {
  id: string;
  applicationId: string;
  title: string;
  status: AssignmentStatus;
  dueAt: string | null;
  assignedAt: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  feedbackRating: number | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
  partnerOrganizationName?: string | null;
};

type AssignmentFull = {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: AssignmentStatus;
  assignedAt: string;
  submittedAt: string | null;
  submissionContent: string | null;
  submissionLinks: string[];
  feedbackContent: string | null;
  feedbackRating: number | null;
  reviewedAt: string | null;
  assignedBy: { id: string; name: string | null } | null;
  reviewedBy: { id: string; name: string | null } | null;
};

type Props = {
  open: boolean;
  assignment: AssignmentDetailItem | null;
  onClose: () => void;
  onUpdated: () => void;
  viewer?: "operator" | "partner";
};

function statusLabel(status: AssignmentStatus, t: PlatformT): string {
  switch (status) {
    case "ASSIGNED":
      return t("부여됨", "Assigned", "已布置", "Đã giao", "割り当て済み", "Ditugaskan");
    case "SUBMITTED":
      return t("제출됨", "Submitted", "已提交", "Đã nộp", "提出済み", "Dikirim");
    case "REVIEWED":
      return t("검토 완료", "Reviewed", "已审阅", "Đã đánh giá", "レビュー完了", "Ditinjau");
    case "CANCELLED":
      return t("취소", "Cancelled", "已取消", "Đã hủy", "キャンセル", "Dibatalkan");
  }
}

const STATUS_PILL: Record<AssignmentStatus, string> = {
  ASSIGNED: "ops-pill-amber",
  SUBMITTED: "ops-pill-blue",
  REVIEWED: "ops-pill-green",
  CANCELLED: "ops-pill-gray"
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function formatDateTime(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export function AssignmentDetailModal({ open, assignment, onClose, onUpdated, viewer = "operator" }: Props) {
  const t = usePlatformT();
  const applicantBasePath = viewer === "partner"
    ? "/dashboard/partner/applicants"
    : "/dashboard/ops/operations/applications";
  const [full, setFull] = useState<AssignmentFull | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackDraft, setFeedbackDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !assignment) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/applications/${assignment!.applicationId}/assignments`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: AssignmentFull[] };
        const f = (payload.items ?? []).find((it) => it.id === assignment!.id) ?? null;
        setFull(f);
        if (f) {
          setFeedbackDraft(f.feedbackContent ?? "");
          setRatingDraft(f.feedbackRating ? String(f.feedbackRating) : "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("과제 상세를 불러오지 못했습니다.", "Failed to load assignment details.", "无法加载任务详情。", "Không thể tải chi tiết bài tập.", "課題の詳細を読み込めませんでした。", "Gagal memuat detail tugas."));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [open, assignment?.id]);

  if (!open || !assignment) return null;

  async function submitReview() {
    if (!full) return;
    if (!feedbackDraft.trim()) {
      setError(t("피드백 내용을 입력해 주세요.", "Please enter feedback.", "请输入反馈内容。", "Vui lòng nhập nội dung phản hồi.", "フィードバック内容を入力してください。", "Harap masukkan isi umpan balik."));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: { feedbackContent: string; feedbackRating?: number } = { feedbackContent: feedbackDraft.trim() };
      const ratingNum = Number.parseInt(ratingDraft, 10);
      if (Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5) body.feedbackRating = ratingNum;
      const response = await fetch(`${apiBase()}/assignments/${full!.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("피드백 저장 실패", "Failed to save feedback", "保存反馈失败", "Không thể lưu phản hồi", "フィードバックの保存に失敗しました", "Gagal menyimpan umpan balik"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,18,39,0.55)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 14,
          padding: 24,
          boxShadow: "0 24px 48px rgba(11,18,39,0.25)"
        }}
      >
        <div className="ops-card-header" style={{ marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{assignment.title}</h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {assignment.candidateName ?? "-"} · {assignment.partnerOrganizationName ?? "-"} · {assignment.positionTitle ?? "-"}
            </p>
          </div>
          <Link href={`${applicantBasePath}/${assignment.applicationId}`} className="ops-btn">
            {t("지원 상세 →", "Application details →", "申请详情 →", "Chi tiết đơn ứng tuyển →", "応募詳細 →", "Detail lamaran →")}
          </Link>
        </div>

        {loading ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</p>
        ) : !full ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("과제를 찾을 수 없습니다.", "Assignment not found.", "找不到任务。", "Không tìm thấy bài tập.", "課題が見つかりません。", "Tugas tidak ditemukan.")}</p>
        ) : (
          <>
            <div className="ops-tag-row" style={{ marginBottom: 12 }}>
              <span className={`ops-pill ${STATUS_PILL[full.status]}`}>{statusLabel(full.status, t)}</span>
            </div>

            <article className="ops-soft-card">
              <p className="ops-form-label">{t("과제 설명", "Task description", "任务说明", "Mô tả bài tập", "課題説明", "Deskripsi tugas")}</p>
              <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{full.description}</p>
              <p className="ops-card-subtle" style={{ marginTop: 8 }}>
                {t("부여", "Assigned", "布置", "Đã giao", "割り当て", "Ditugaskan")} {formatDateTime(full.assignedAt)} · {t("마감", "Due", "截止", "Hạn nộp", "締切", "Batas")} {formatDateTime(full.dueAt)}
                {full.assignedBy ? ` · ${t("담당", "Assigned by", "负责人", "Người giao", "担当", "Ditugaskan oleh")} ${full.assignedBy.name ?? "-"}` : ""}
              </p>
            </article>

            {full.submissionContent ? (
              <article className="ops-card">
                <h3 className="ops-section-title">{t("제출", "Submission", "提交", "Đã nộp", "提出", "Pengiriman")} ({formatDateTime(full.submittedAt)})</h3>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: 0 }}>{full.submissionContent}</p>
                {full.submissionLinks.length > 0 ? (
                  <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12 }}>
                    {full.submissionLinks.map((link, idx) => (
                      <li key={idx}>
                        <a href={link} target="_blank" rel="noreferrer" style={{ color: "#1d4ed8" }}>
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ) : null}

            {full.feedbackContent ? (
              <article className="ops-card">
                <h3 className="ops-section-title">{t("기존 피드백", "Existing feedback", "现有反馈", "Phản hồi hiện có", "既存のフィードバック", "Umpan balik yang ada")}</h3>
                <div style={{ padding: 12, background: "#ecfdf5", borderRadius: 10 }}>
                  <p className="ops-card-subtle" style={{ color: "#047857", margin: 0, fontWeight: 600 }}>
                    {formatDateTime(full.reviewedAt)}
                    {full.feedbackRating ? ` · ${t("평가", "Rating", "评分", "Đánh giá", "評価", "Nilai")} ${full.feedbackRating}/5` : ""}
                    {full.reviewedBy ? ` · ${full.reviewedBy.name ?? "-"}` : ""}
                  </p>
                  <p style={{ fontSize: 13, color: "#065f46", whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{full.feedbackContent}</p>
                </div>
              </article>
            ) : null}

            {full.status === "SUBMITTED" || full.status === "REVIEWED" ? (
              <article className="ops-card">
                <h3 className="ops-section-title">{full.feedbackContent ? t("피드백 수정", "Edit feedback", "修改反馈", "Chỉnh sửa phản hồi", "フィードバックの修正", "Edit umpan balik") : t("피드백 작성", "Write feedback", "撰写反馈", "Viết phản hồi", "フィードバックの作成", "Tulis umpan balik")}</h3>
                <textarea
                  value={feedbackDraft}
                  onChange={(e) => setFeedbackDraft(e.target.value)}
                  rows={4}
                  placeholder={t("피드백 내용을 입력해 주세요", "Enter feedback", "请输入反馈内容", "Nhập nội dung phản hồi", "フィードバック内容を入力してください", "Masukkan umpan balik")}
                  className="ops-textarea"
                />
                <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <label className="ops-form-label" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {t("평가 (1-5, 선택)", "Rating (1-5, optional)", "评分（1-5，可选）", "Đánh giá (1-5, tùy chọn)", "評価（1-5、任意）", "Nilai (1-5, opsional)")}
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={ratingDraft}
                      onChange={(e) => setRatingDraft(e.target.value)}
                      className="ops-input"
                      style={{ width: 70 }}
                    />
                  </label>
                  <button type="button" onClick={() => void submitReview()} disabled={saving} className="ops-btn ops-btn-primary">
                    {saving ? t("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : t("피드백 저장", "Save feedback", "保存反馈", "Lưu phản hồi", "フィードバックを保存", "Simpan umpan balik")}
                  </button>
                </div>
              </article>
            ) : null}
          </>
        )}

        {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>{error}</p> : null}

        <div className="ops-row-end" style={{ marginTop: 12 }}>
          <button type="button" onClick={onClose} className="ops-btn">
            {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { usePlatformT, type PlatformT } from "../../lib/i18n";

export type AssignmentForPartner = {
  id: string;
  applicationId: string;
  title: string;
  description: string;
  dueAt: string | null;
  status: "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
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
  applicationId?: string;
  applicantName?: string | null;
  positionTitle?: string | null;
  onClose: () => void;
};

const STATUS_CLASSNAME: Record<AssignmentForPartner["status"], string> = {
  ASSIGNED: "bg-amber-100 text-amber-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  REVIEWED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500"
};

function statusLabel(status: AssignmentForPartner["status"], t: PlatformT): string {
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

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

function authHeaders(): Record<string, string> {
  const token = readAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export function AssignmentManagerModal({ open, applicationId, applicantName, positionTitle, onClose }: Props) {
  const t = usePlatformT();
  const [items, setItems] = useState<AssignmentForPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [reviewDraft, setReviewDraft] = useState<Record<string, { feedback: string; rating: string }>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  async function load() {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/applications/${applicationId}/assignments`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { ok?: boolean; items?: AssignmentForPartner[] };
      setItems(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("과제 목록을 불러오지 못했습니다.", "Failed to load the assignment list.", "无法加载任务列表。", "Không thể tải danh sách bài tập.", "課題リストを読み込めませんでした。", "Gagal memuat daftar tugas."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setDueDate("");
      setReviewDraft({});
      void load();
    }
  }, [open, applicationId]);

  if (!open) return null;

  async function handleCreate() {
    if (!applicationId) return;
    if (!title.trim() || !description.trim()) {
      setError(t("제목과 설명을 입력해 주세요.", "Please enter a title and description.", "请输入标题和说明。", "Vui lòng nhập tiêu đề và mô tả.", "タイトルと説明を入力してください。", "Harap masukkan judul dan deskripsi."));
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const body: { title: string; description: string; dueAt?: string } = {
        title: title.trim(),
        description: description.trim()
      };
      if (dueDate) {
        body.dueAt = new Date(`${dueDate}T23:59:00`).toISOString();
      }
      const response = await fetch(`${apiBase()}/applications/${applicationId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setTitle("");
      setDescription("");
      setDueDate("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("과제 부여에 실패했습니다.", "Failed to assign the task.", "布置任务失败。", "Không thể giao bài tập.", "課題の割り当てに失敗しました。", "Gagal menugaskan tugas."));
    } finally {
      setCreating(false);
    }
  }

  async function handleReview(assignmentId: string) {
    const draft = reviewDraft[assignmentId];
    if (!draft || !draft.feedback.trim()) {
      setError(t("피드백 내용을 입력해 주세요.", "Please enter feedback.", "请输入反馈内容。", "Vui lòng nhập nội dung phản hồi.", "フィードバック内容を入力してください。", "Harap masukkan isi umpan balik."));
      return;
    }
    setReviewing(assignmentId);
    setError(null);
    try {
      const ratingNum = draft.rating ? Number.parseInt(draft.rating, 10) : undefined;
      const body: { feedbackContent: string; feedbackRating?: number } = {
        feedbackContent: draft.feedback.trim()
      };
      if (ratingNum && Number.isFinite(ratingNum) && ratingNum >= 1 && ratingNum <= 5) {
        body.feedbackRating = ratingNum;
      }
      const response = await fetch(`${apiBase()}/assignments/${assignmentId}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("리뷰 등록에 실패했습니다.", "Failed to submit the review.", "提交评价失败。", "Không thể gửi đánh giá.", "レビューの登録に失敗しました。", "Gagal mengirim ulasan."));
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
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
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 100%)",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 24px 48px rgba(11,18,39,0.25)"
        }}
      >
        <header style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0B1227", margin: 0 }}>{t("과제 관리", "Assignment Management", "任务管理", "Quản lý bài tập", "課題管理", "Manajemen Tugas")}</h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
            {applicantName ?? t("지원자", "Applicant", "申请人", "Ứng viên", "応募者", "Pelamar")} · {positionTitle ?? t("포지션", "Position", "职位", "Vị trí", "ポジション", "Posisi")}
          </p>
        </header>

        <section style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0B1227", margin: "0 0 10px" }}>{t("새 과제 부여", "Assign new task", "布置新任务", "Giao bài tập mới", "新しい課題の割り当て", "Tugaskan tugas baru")}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("과제 제목", "Task title", "任务标题", "Tiêu đề bài tập", "課題タイトル", "Judul tugas")}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("과제 설명 / 제출 요구사항", "Task description / submission requirements", "任务说明 / 提交要求", "Mô tả bài tập / yêu cầu nộp", "課題説明 / 提出要件", "Deskripsi tugas / persyaratan pengiriman")}
              rows={4}
              style={{ padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, resize: "vertical" }}
            />
            <label style={{ fontSize: 11, color: "#6b7280" }}>
              {t("마감일 (선택)", "Due date (optional)", "截止日期（可选）", "Hạn nộp (tùy chọn)", "締切日（任意）", "Batas waktu (opsional)")}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ marginTop: 4, display: "block", padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13 }}
              />
            </label>
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              style={{
                alignSelf: "flex-end",
                padding: "8px 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                background: "#0B1227",
                border: "1px solid #0B1227",
                borderRadius: 8,
                cursor: creating ? "wait" : "pointer"
              }}
            >
              {creating ? t("부여 중...", "Assigning...", "布置中...", "Đang giao...", "割り当て中...", "Menugaskan...") : t("과제 부여", "Assign task", "布置任务", "Giao bài tập", "課題を割り当て", "Tugaskan")}
            </button>
          </div>
        </section>

        <section>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0B1227", margin: "0 0 10px" }}>{t("부여된 과제", "Assigned tasks", "已布置的任务", "Bài tập đã giao", "割り当て済みの課題", "Tugas yang ditugaskan")}</h3>
          {loading ? (
            <p style={{ color: "#6b7280", fontSize: 13 }}>{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</p>
          ) : items.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: 13 }}>{t("아직 부여된 과제가 없습니다.", "No tasks have been assigned yet.", "尚未布置任何任务。", "Chưa có bài tập nào được giao.", "まだ割り当てられた課題はありません。", "Belum ada tugas yang ditugaskan.")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((it) => {
                const badgeClassName = STATUS_CLASSNAME[it.status];
                const draft = reviewDraft[it.id] ?? { feedback: "", rating: "" };
                const isReviewing = reviewing === it.id;
                return (
                  <article key={it.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 14, background: "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: "#0B1227", margin: 0 }}>{it.title}</h4>
                        <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 0" }}>
                          {t("부여", "Assigned", "布置", "Đã giao", "割り当て", "Ditugaskan")}: {formatDateTime(it.assignedAt)} · {t("마감", "Due", "截止", "Hạn nộp", "締切", "Batas")}: {formatDateTime(it.dueAt)}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeClassName}`}>{statusLabel(it.status, t)}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", marginTop: 8 }}>{it.description}</p>

                    {it.submissionContent ? (
                      <div style={{ marginTop: 12, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#0B1227", margin: 0 }}>{t("제출 내용", "Submission", "提交内容", "Nội dung nộp", "提出内容", "Isi pengiriman")} ({formatDateTime(it.submittedAt)})</p>
                        <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{it.submissionContent}</p>
                        {it.submissionLinks.length > 0 ? (
                          <ul style={{ margin: "8px 0 0", paddingLeft: 18, fontSize: 12 }}>
                            {it.submissionLinks.map((link, idx) => (
                              <li key={idx}>
                                <a href={link} target="_blank" rel="noreferrer" style={{ color: "#0B1227" }}>
                                  {link}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    ) : null}

                    {it.status === "SUBMITTED" ? (
                      <div style={{ marginTop: 12, padding: 12, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#0B1227", margin: "0 0 6px" }}>{t("피드백 등록", "Add feedback", "提交反馈", "Thêm phản hồi", "フィードバック登録", "Tambah umpan balik")}</p>
                        <textarea
                          value={draft.feedback}
                          onChange={(e) => setReviewDraft((prev) => ({ ...prev, [it.id]: { ...draft, feedback: e.target.value } }))}
                          rows={3}
                          placeholder={t("피드백 내용을 입력해 주세요", "Enter feedback", "请输入反馈内容", "Nhập nội dung phản hồi", "フィードバック内容を入力してください", "Masukkan umpan balik")}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 13, resize: "vertical" }}
                        />
                        <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                          <label style={{ fontSize: 11, color: "#6b7280" }}>
                            {t("평가 점수 (1-5, 선택)", "Rating (1-5, optional)", "评分（1-5，可选）", "Điểm đánh giá (1-5, tùy chọn)", "評価スコア（1-5、任意）", "Nilai (1-5, opsional)")}
                            <input
                              type="number"
                              min={1}
                              max={5}
                              value={draft.rating}
                              onChange={(e) => setReviewDraft((prev) => ({ ...prev, [it.id]: { ...draft, rating: e.target.value } }))}
                              style={{ marginLeft: 6, padding: "4px 6px", border: "1px solid #e5e7eb", borderRadius: 6, width: 60, fontSize: 12 }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleReview(it.id)}
                            disabled={isReviewing}
                            style={{
                              padding: "6px 12px",
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#fff",
                              background: "#0B1227",
                              border: "1px solid #0B1227",
                              borderRadius: 6,
                              cursor: isReviewing ? "wait" : "pointer"
                            }}
                          >
                            {isReviewing ? t("등록 중...", "Submitting...", "提交中...", "Đang gửi...", "登録中...", "Mengirim...") : t("피드백 등록", "Submit feedback", "提交反馈", "Gửi phản hồi", "フィードバック登録", "Kirim umpan balik")}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {it.feedbackContent ? (
                      <div style={{ marginTop: 12, padding: 12, background: "#ecfdf5", borderRadius: 8 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#047857", margin: 0 }}>
                          {t("검토 피드백", "Review feedback", "审阅反馈", "Phản hồi đánh giá", "レビューフィードバック", "Umpan balik tinjauan")} ({formatDateTime(it.reviewedAt)}
                          {it.feedbackRating ? ` · ${t("평가", "Rating", "评分", "Đánh giá", "評価", "Nilai")} ${it.feedbackRating}/5` : ""})
                        </p>
                        <p style={{ fontSize: 13, color: "#065f46", whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{it.feedbackContent}</p>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 12 }}>{error}</p> : null}

        <footer style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#0B1227", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, cursor: "pointer" }}
          >
            {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
          </button>
        </footer>
      </div>
    </div>
  );
}

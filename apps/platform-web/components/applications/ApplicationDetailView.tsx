"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { getApplicationStatusLabel, type ApplicationStatus } from "../../lib/status-labels";
import { useToast } from "../toast/ToastProvider";
import { ProposeInterviewSlotsModal } from "../interviews/ProposeInterviewSlotsModal";
import { AssignmentManagerModal } from "../assignments/AssignmentManagerModal";
import { ApplicationDocsModal } from "./ApplicationDocsModal";
import type { ResumeContent } from "../../lib/member-profile-client";
import { usePlatformT, type PlatformT } from "../../lib/i18n";

export type ApplicationDetail = {
  id: string;
  positionId: string;
  candidateUserId: string;
  status: ApplicationStatus;
  memo: string | null;
  submittedAt: string;
  updatedAt: string;
  // 연락처 공개 여부 — 파트너는 면접 요청(슬롯 제안) 후에만 지원자 이메일·전화를 볼 수 있다.
  contactUnlocked?: boolean;
  // 지원에 연결된 대표 이력서(resume-maker). 없으면 null.
  resume?: { id: string; title: string; shareSlug: string } | null;
  // 제출 시점 스냅샷(제출본 보존). 있으면 스냅샷을 보여주고, 없으면(과거 지원건) resume 라이브 링크로 폴백.
  resumeSnapshot?: unknown | null;
  coverLetterSnapshot?: { title?: string; company?: string | null; items?: Array<{ id?: string; prompt?: string; answer?: string }> } | null;
  candidateUser: {
    id: string;
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
    nationality: string | null;
    affiliation: string | null;
    jobTitle: string | null;
    role: string;
    createdAt: string;
  };
  position: {
    id: string;
    title: string;
    status: string;
    partnerOrganization: { id: string; name: string } | null;
  };
  statusHistories: Array<{
    id: string;
    status: ApplicationStatus;
    memo: string | null;
    changedAt: string;
    changedBy: { id: string; name: string | null; email: string; role: string } | null;
  }>;
  interviewSlots: Array<{
    id: string;
    startsAt: string;
    endsAt: string;
    location: string | null;
    notes: string | null;
    status: "PROPOSED" | "SELECTED" | "CANCELLED";
    proposedAt: string;
    selectedAt: string | null;
    cancelledAt: string | null;
  }>;
  assignments: Array<{
    id: string;
    title: string;
    description: string;
    status: "ASSIGNED" | "SUBMITTED" | "REVIEWED" | "CANCELLED";
    dueAt: string | null;
    assignedAt: string;
    submittedAt: string | null;
    submissionContent: string | null;
    submissionLinks: string[];
    feedbackContent: string | null;
    feedbackRating: number | null;
    reviewedAt: string | null;
    assignedBy: { id: string; name: string | null } | null;
    reviewedBy: { id: string; name: string | null } | null;
  }>;
  program: {
    id: string;
    status: string;
    startsAt: string;
    endsAt: string | null;
    meetings: Array<{ id: string; scheduledAt: string; status: string }>;
    certificate: { id: string; title: string } | null;
    recommendation: { id: string; signerName: string } | null;
    schoolCreditRequest: { id: string; status: string; schoolName: string; credits: number } | null;
  } | null;
  issues: Array<{
    id: string;
    type: string;
    status: string;
    title: string;
    description: string;
    createdAt: string;
    reporter: { id: string; name: string | null; email: string; role: string } | null;
    assignedTo?: { id: string; name: string | null; email: string } | null;
  }>;
};

type Props = {
  applicationId: string;
  viewer: "operator" | "partner";
};

const STATUS_OPTIONS: ApplicationStatus[] = ["SUBMITTED", "INTERVIEW", "ACCEPTED", "REJECTED"];

function statusKo(t: PlatformT, s: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    SUBMITTED: t("검토 중", "Reviewing", "审核中", "Đang xem xét", "審査中", "Sedang ditinjau"),
    INTERVIEW: t("면접 예정", "Interview scheduled", "面试安排中", "Sắp phỏng vấn", "面接予定", "Wawancara dijadwalkan"),
    ACCEPTED: t("합격", "Accepted", "合格", "Trúng tuyển", "合格", "Diterima"),
    REJECTED: t("불합격", "Rejected", "不合格", "Không trúng tuyển", "不合格", "Ditolak"),
    WITHDRAWN: t("철회", "Withdrawn", "撤回", "Đã rút", "取り下げ", "Ditarik")
  };
  return map[s];
}

const SLOT_STATUS_PILL: Record<string, string> = {
  PROPOSED: "ops-pill-amber",
  SELECTED: "ops-pill-green",
  CANCELLED: "ops-pill-gray"
};

const ASSIGNMENT_STATUS_PILL: Record<string, string> = {
  ASSIGNED: "ops-pill-amber",
  SUBMITTED: "ops-pill-blue",
  REVIEWED: "ops-pill-green",
  CANCELLED: "ops-pill-gray"
};

const ISSUE_STATUS_PILL: Record<string, string> = {
  OPEN: "ops-pill-red",
  IN_PROGRESS: "ops-pill-amber",
  RESOLVED: "ops-pill-green",
  CLOSED: "ops-pill-gray"
};

function issueStatusKo(t: PlatformT, s: string): string {
  const map: Record<string, string> = {
    OPEN: t("신규", "New", "新建", "Mới", "新規", "Baru"),
    IN_PROGRESS: t("처리 중", "In progress", "处理中", "Đang xử lý", "処理中", "Sedang diproses"),
    RESOLVED: t("해결", "Resolved", "已解决", "Đã giải quyết", "解決", "Terselesaikan"),
    CLOSED: t("종료", "Closed", "已关闭", "Đã đóng", "終了", "Ditutup")
  };
  return map[s] ?? s;
}

function issueTypeKo(t: PlatformT, s: string): string {
  const map: Record<string, string> = {
    NO_SHOW: t("노쇼", "No-show", "爽约", "Vắng mặt", "無断欠席", "Tidak hadir"),
    BEHAVIOR: t("행동·태도", "Behavior", "行为·态度", "Hành vi·thái độ", "行動・態度", "Perilaku"),
    DROPOUT: t("참여 중단", "Dropout", "中途退出", "Bỏ dở", "参加中断", "Berhenti"),
    ATTITUDE: t("커뮤니케이션", "Communication", "沟通", "Giao tiếp", "コミュニケーション", "Komunikasi"),
    PAYMENT: t("정산/결제", "Payment", "结算/支付", "Thanh toán", "精算・決済", "Pembayaran"),
    OTHER: t("기타", "Other", "其他", "Khác", "その他", "Lainnya")
  };
  return map[s] ?? s;
}

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

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("ko-KR");
}

type Comment = {
  id: string;
  content: string;
  visibility: "INTERNAL" | "CANDIDATE";
  createdAt: string;
  author: { id: string; name: string | null; email: string; role: string };
};

// 상태 변경 시 지원자에게 이메일·서비스 알림이 나가는 상태.
const DETAIL_NOTIFY_STATUSES: ApplicationStatus[] = ["INTERVIEW", "ACCEPTED", "REJECTED"];

export function ApplicationDetailView({ applicationId, viewer }: Props) {
  const t = usePlatformT();
  const toast = useToast();
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [memoDraft, setMemoDraft] = useState("");
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [docsTab, setDocsTab] = useState<"resume" | "cover" | null>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  // 지원자와의 대화(채팅) — 항상 CANDIDATE 공개로 전송된다.
  const [chatDraft, setChatDraft] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const fetchPath = viewer === "operator"
    ? `/ops/applications/${applicationId}`
    : `/partner/applications/${applicationId}`;
  const programLinkBase = viewer === "operator"
    ? "/dashboard/ops/operations/programs"
    : "/dashboard/partner/programs";

  const loadComments = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase()}/applications/${applicationId}/comments`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) return;
      const payload = (await response.json()) as { items?: Comment[] };
      setComments(payload.items ?? []);
    } catch {
      // silent
    }
  }, [applicationId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}${fetchPath}`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = (await response.json()) as { item?: ApplicationDetail };
      setData(payload.item ?? null);
      setMemoDraft(payload.item?.memo ?? "");
      void loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("지원 정보를 불러오지 못했습니다.", "Failed to load application.", "无法加载申请信息。", "Không thể tải thông tin ứng tuyển.", "応募情報を読み込めませんでした。", "Gagal memuat informasi lamaran."));
    } finally {
      setLoading(false);
    }
  }, [fetchPath]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(nextStatus: ApplicationStatus) {
    if (!data) return;
    const label = getApplicationStatusLabel(nextStatus, viewer).label;
    const notifies = DETAIL_NOTIFY_STATUSES.includes(nextStatus);
    // 면접 예정으로 넘어갈 때는 곧바로 '면접 일정 제안' 흐름으로 유도한다.
    if (nextStatus === "INTERVIEW" && data.status !== "INTERVIEW") {
      const go = window.confirm(
        t(
          "이 지원자를 면접 대상자로 선정합니다.\n지금 면접 일정을 제안하시겠어요?\n\n확인: 면접 일정 제안 창 열기\n취소: 상태만 '면접 예정'으로 변경(지원자에게 선정 알림)",
          "This applicant will be selected for an interview.\nWould you like to propose interview times now?\n\nOK: Open the interview scheduling window\nCancel: Only change status to 'Interview scheduled' (notify the applicant of selection)",
          "该应聘者将被选定进行面试。\n现在要提议面试时间吗？\n\n确定：打开面试日程提议窗口\n取消：仅将状态改为'面试安排中'（通知应聘者已入选）",
          "Ứng viên này sẽ được chọn phỏng vấn.\nBạn có muốn đề xuất lịch phỏng vấn ngay bây giờ không?\n\nOK: Mở cửa sổ đề xuất lịch phỏng vấn\nHủy: Chỉ đổi trạng thái thành 'Sắp phỏng vấn' (thông báo cho ứng viên)",
          "この応募者を面接対象者として選定します。\n今すぐ面接日程を提案しますか？\n\nOK: 面接日程の提案画面を開く\nキャンセル: ステータスのみ「面接予定」に変更（応募者に選定を通知）",
          "Pelamar ini akan dipilih untuk wawancara.\nApakah Anda ingin mengusulkan jadwal wawancara sekarang?\n\nOK: Buka jendela usulan jadwal wawancara\nBatal: Hanya ubah status menjadi 'Wawancara dijadwalkan' (beri tahu pelamar)"
        )
      );
      if (go) {
        setInterviewOpen(true); // 제안 창이 상태 전환 + 시간 이메일까지 처리
        return;
      }
      // 취소 시 아래 일반 흐름으로 상태만 '면접 예정'으로 변경한다.
    } else if (nextStatus === "ACCEPTED" || nextStatus === "REJECTED") {
      const memoNote = memoDraft.trim() ? t("\n메모가 회사 메시지로 함께 전달됩니다.", "\nThe memo will be sent along as a company message.", "\n备注将作为公司消息一并发送。", "\nGhi chú sẽ được gửi kèm dưới dạng tin nhắn của công ty.", "\nメモは会社メッセージとして一緒に送信されます。", "\nCatatan akan dikirim bersama sebagai pesan perusahaan.") : "";
      const confirmMsg = t(
        `이 지원자를 '${label}'(으)로 처리할까요?`,
        `Process this applicant as '${label}'?`,
        `将该应聘者处理为'${label}'吗？`,
        `Xử lý ứng viên này là '${label}'?`,
        `この応募者を「${label}」として処理しますか？`,
        `Proses pelamar ini sebagai '${label}'?`
      ) + t(
        "\n지원자에게 이메일·서비스 알림이 전송됩니다.",
        "\nAn email and in-service notification will be sent to the applicant.",
        "\n将向应聘者发送邮件和服务通知。",
        "\nMột email và thông báo trong dịch vụ sẽ được gửi đến ứng viên.",
        "\n応募者にメールとサービス通知が送信されます。",
        "\nEmail dan notifikasi layanan akan dikirim ke pelamar."
      ) + memoNote;
      if (!window.confirm(confirmMsg)) return;
    }
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/applications/${data.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: nextStatus, memo: memoDraft })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
      const changed = t(
        `'${label}'(으)로 변경했어요.`,
        `Changed to '${label}'.`,
        `已变更为'${label}'。`,
        `Đã đổi thành '${label}'.`,
        `「${label}」に変更しました。`,
        `Diubah menjadi '${label}'.`
      );
      const notified = t("지원자에게 알림을 보냈어요.", "The applicant has been notified.", "已通知应聘者。", "Đã thông báo cho ứng viên.", "応募者に通知しました。", "Pelamar telah diberi tahu.");
      toast.success(notifies ? `${changed} ${notified}` : changed);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("상태 변경 실패", "Failed to change status", "状态变更失败", "Đổi trạng thái không thành công", "ステータス変更に失敗", "Gagal mengubah status"));
      toast.error(t("상태 변경에 실패했어요. 다시 시도해 주세요.", "Failed to change status. Please try again.", "状态变更失败，请重试。", "Đổi trạng thái không thành công. Vui lòng thử lại.", "ステータスの変更に失敗しました。もう一度お試しください。", "Gagal mengubah status. Silakan coba lagi."));
    } finally {
      setUpdating(false);
    }
  }

  async function saveMemo() {
    if (!data) return;
    setUpdating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/applications/${data.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: data.status, memo: memoDraft })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("메모 저장 실패", "Failed to save memo", "备注保存失败", "Lưu ghi chú không thành công", "メモの保存に失敗", "Gagal menyimpan catatan"));
    } finally {
      setUpdating(false);
    }
  }

  async function postMessage(content: string, visibility: "INTERNAL" | "CANDIDATE") {
    if (!data) return false;
    const response = await fetch(`${apiBase()}/applications/${data.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ content: content.trim(), visibility })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await loadComments();
    return true;
  }

  async function postComment() {
    if (!commentDraft.trim()) return;
    setPostingComment(true);
    setError(null);
    try {
      await postMessage(commentDraft, "INTERNAL");
      setCommentDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("메모 작성 실패", "Failed to post memo", "备注撰写失败", "Viết ghi chú không thành công", "メモの作成に失敗", "Gagal menulis catatan"));
    } finally {
      setPostingComment(false);
    }
  }

  async function sendChat() {
    if (!chatDraft.trim()) return;
    setSendingChat(true);
    setError(null);
    try {
      await postMessage(chatDraft, "CANDIDATE");
      setChatDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("메시지 전송 실패", "Failed to send message", "消息发送失败", "Gửi tin nhắn không thành công", "メッセージ送信に失敗", "Gagal mengirim pesan"));
    } finally {
      setSendingChat(false);
    }
  }

  async function deleteComment(id: string) {
    try {
      const response = await fetch(`${apiBase()}/application-comments/${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await loadComments();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("댓글 삭제 실패", "Failed to delete comment", "评论删除失败", "Xóa bình luận không thành công", "コメント削除に失敗", "Gagal menghapus komentar"));
    }
  }

  if (loading) return <div className="ops-empty-card">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</div>;
  if (error && !data) return <div className="ops-error-card">{error}</div>;
  if (!data) return <div className="ops-empty-card">{t("지원 정보를 찾을 수 없습니다.", "Application not found.", "找不到申请信息。", "Không tìm thấy thông tin ứng tuyển.", "応募情報が見つかりません。", "Informasi lamaran tidak ditemukan.")}</div>;

  return (
    <>
      <article className="ops-card">
        <div className="ops-card-header">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>
              {data.candidateUser.name ?? "-"}
            </h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {data.position.partnerOrganization?.name ?? "-"} · {data.position.title}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>
              {data.candidateUser.email ? (
                <>
                  {data.candidateUser.email}
                  {data.candidateUser.phoneNumber ? ` · ${data.candidateUser.phoneNumber}` : ""}
                </>
              ) : (
                <span style={{ color: "#f59e0b", fontWeight: 600 }}>{t("🔒 연락처는 면접을 요청하면 공개됩니다", "🔒 Contact details are revealed once you request an interview", "🔒 提出面试请求后将公开联系方式", "🔒 Thông tin liên hệ sẽ hiển thị khi bạn yêu cầu phỏng vấn", "🔒 面接をリクエストすると連絡先が公開されます", "🔒 Kontak akan ditampilkan setelah Anda meminta wawancara")}</span>
              )}
              {data.candidateUser.nationality ? ` · ${data.candidateUser.nationality}` : ""}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>
              {t("소속", "Affiliation", "所属", "Đơn vị", "所属", "Afiliasi")} {data.candidateUser.affiliation ?? "-"} · {t("직무 희망", "Desired role", "期望职务", "Vị trí mong muốn", "希望職種", "Posisi diinginkan")} {data.candidateUser.jobTitle ?? "-"}
            </p>
          </div>
          <span className={`ops-pill ${
            data.status === "ACCEPTED" ? "ops-pill-green" :
            data.status === "REJECTED" ? "ops-pill-red" :
            data.status === "INTERVIEW" ? "ops-pill-blue" : "ops-pill-amber"
          }`}>{getApplicationStatusLabel(data.status, viewer).label}</span>
        </div>

        <div className="ops-form-grid-3" style={{ marginTop: 16 }}>
          <label className="ops-form-label">
            {t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}
            <select
              className="ops-select"
              value={data.status}
              disabled={updating}
              onChange={(e) => void updateStatus(e.target.value as ApplicationStatus)}
              style={{ marginTop: 4 }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{statusKo(t, s)}</option>
              ))}
            </select>
          </label>
          <label className="ops-form-label">
            {t("지원일", "Applied on", "申请日", "Ngày ứng tuyển", "応募日", "Tanggal lamar")}
            <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDateTime(data.submittedAt)}</p>
          </label>
          <label className="ops-form-label">
            {t("최근 업데이트", "Last updated", "最近更新", "Cập nhật gần nhất", "最終更新", "Terakhir diperbarui")}
            <p style={{ marginTop: 4, color: "#111827", fontSize: 13 }}>{formatDateTime(data.updatedAt)}</p>
          </label>
        </div>

        <div className="ops-form-label" style={{ marginTop: 16, display: "block" }}>
          {t("지원 서류", "Application documents", "申请材料", "Hồ sơ ứng tuyển", "応募書類", "Dokumen lamaran")} <span className="ops-card-subtle">{t("(제출 당시 그대로)", "(as submitted)", "（提交时原样）", "(nguyên bản khi nộp)", "(提出時のまま)", "(sesuai saat dikirim)")}</span>
          <div className="ops-row" style={{ marginTop: 4, gap: 8 }}>
            {data.resumeSnapshot ? (
              <button type="button" className="ops-btn" onClick={() => setDocsTab("resume")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t("📄 이력서 보기", "📄 View resume", "📄 查看简历", "📄 Xem sơ yếu lý lịch", "📄 履歴書を見る", "📄 Lihat resume")}
              </button>
            ) : data.resume ? (
              // 과거 지원건(스냅샷 없음) — 현재 이력서 공유 링크로 폴백
              <a
                href={`/resume/share/${data.resume.shareSlug}?view=preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="ops-btn"
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                {t("📄 이력서 보기(현재본)", "📄 View resume (current)", "📄 查看简历（当前版本）", "📄 Xem sơ yếu lý lịch (bản hiện tại)", "📄 履歴書を見る（現在版）", "📄 Lihat resume (versi terkini)")}
              </a>
            ) : null}
            {data.coverLetterSnapshot && (data.coverLetterSnapshot.items ?? []).some((it) => it?.answer?.trim()) ? (
              <button type="button" className="ops-btn" onClick={() => setDocsTab("cover")} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t("✍️ 자기소개서 보기", "✍️ View cover letter", "✍️ 查看自我介绍信", "✍️ Xem thư giới thiệu", "✍️ 自己紹介書を見る", "✍️ Lihat surat lamaran")}
              </button>
            ) : null}
            {!data.resumeSnapshot && !data.resume && !data.coverLetterSnapshot ? (
              <p className="ops-card-subtle" style={{ margin: 0 }}>{t("연결된 서류가 없습니다.", "No linked documents.", "没有关联的材料。", "Không có tài liệu liên kết.", "紐づけられた書類がありません。", "Tidak ada dokumen terkait.")}</p>
            ) : null}
          </div>
        </div>

        {docsTab ? (
          <ApplicationDocsModal
            // 원본 스냅샷을 그대로 전달 — 모달이 리뉴얼/구형 형태를 판별해 렌더한다.
            resumeContent={(data.resumeSnapshot as ResumeContent | Record<string, unknown> | null) ?? null}
            coverLetter={data.coverLetterSnapshot ?? null}
            initialTab={docsTab}
            onClose={() => setDocsTab(null)}
          />
        ) : null}

        <div className="ops-row" style={{ marginTop: 12 }}>
          <button type="button" className="ops-btn" onClick={() => setInterviewOpen(true)}>
            {t("면접 일정 제안", "Propose interview times", "提议面试日程", "Đề xuất lịch phỏng vấn", "面接日程を提案", "Usulkan jadwal wawancara")}
          </button>
          <button type="button" className="ops-btn" onClick={() => setAssignmentOpen(true)}>
            {t("과제 관리", "Manage assignments", "管理作业", "Quản lý bài tập", "課題を管理", "Kelola tugas")}
          </button>
        </div>

        <label className="ops-form-label" style={{ marginTop: 12, display: "block" }}>
          {viewer === "operator" ? t("운영 메모", "Operations memo", "运营备注", "Ghi chú vận hành", "運営メモ", "Catatan operasi") : t("회사 메모", "Company memo", "公司备注", "Ghi chú công ty", "会社メモ", "Catatan perusahaan")}
          <textarea
            value={memoDraft}
            onChange={(e) => setMemoDraft(e.target.value)}
            rows={3}
            placeholder={t("이 지원에 대한 내부 메모", "Internal memo for this application", "关于此申请的内部备注", "Ghi chú nội bộ cho ứng tuyển này", "この応募に関する内部メモ", "Catatan internal untuk lamaran ini")}
            className="ops-textarea"
            style={{ marginTop: 4 }}
          />
        </label>
        <div className="ops-row-end" style={{ marginTop: 8 }}>
          <button type="button" onClick={() => void saveMemo()} disabled={updating} className="ops-btn ops-btn-primary">
            {updating ? t("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : t("메모 저장", "Save memo", "保存备注", "Lưu ghi chú", "メモを保存", "Simpan catatan")}
          </button>
        </div>
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("상태 변경 히스토리", "Status change history", "状态变更历史", "Lịch sử thay đổi trạng thái", "ステータス変更履歴", "Riwayat perubahan status")}</h3>
        {data.statusHistories.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("아직 변경 이력이 없습니다.", "No change history yet.", "还没有变更历史。", "Chưa có lịch sử thay đổi.", "まだ変更履歴がありません。", "Belum ada riwayat perubahan.")}</p>
        ) : (
          <div className="ops-stack">
            {data.statusHistories.map((h) => (
              <div key={h.id} className="ops-soft-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <span className={`ops-pill ${
                    h.status === "ACCEPTED" ? "ops-pill-green" :
                    h.status === "REJECTED" ? "ops-pill-red" :
                    h.status === "INTERVIEW" ? "ops-pill-blue" : "ops-pill-amber"
                  }`}>{statusKo(t, h.status)}</span>
                  {h.memo ? <p style={{ fontSize: 13, color: "#374151", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{h.memo}</p> : null}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p className="ops-card-subtle" style={{ margin: 0 }}>{formatDateTime(h.changedAt)}</p>
                  <p className="ops-card-subtle" style={{ margin: "2px 0 0" }}>{h.changedBy?.name ?? h.changedBy?.email ?? "-"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("면접 일정", "Interview schedule", "面试日程", "Lịch phỏng vấn", "面接日程", "Jadwal wawancara")} ({data.interviewSlots.length})</h3>
        {data.interviewSlots.length === 0 ? (
          <div className="ops-stack" style={{ gap: 10 }}>
            <p className="ops-card-subtle" style={{ margin: 0 }}>
              {data.status === "INTERVIEW"
                ? t("면접 대상자로 선정됐어요. 준비되면 아래 버튼으로 면접 일정을 제안하세요. (지금 바로 잡지 않아도 됩니다)", "Selected for an interview. When ready, propose times with the button below. (No need to schedule right away)", "已入选面试。准备好后，请用下方按钮提议面试日程。（无需立即安排）", "Đã được chọn phỏng vấn. Khi sẵn sàng, hãy đề xuất lịch bằng nút bên dưới. (Không cần đặt lịch ngay)", "面接対象者に選定されました。準備ができたら下のボタンで面接日程を提案してください。（今すぐ決めなくても大丈夫です）", "Terpilih untuk wawancara. Saat siap, usulkan jadwal dengan tombol di bawah. (Tidak perlu langsung menjadwalkan)")
                : t("제안된 면접 일정이 없습니다.", "No proposed interview times.", "没有提议的面试日程。", "Chưa có lịch phỏng vấn nào được đề xuất.", "提案された面接日程がありません。", "Belum ada jadwal wawancara yang diusulkan.")}
            </p>
            <div className="ops-row">
              <button type="button" className="ops-btn ops-btn-primary" onClick={() => setInterviewOpen(true)}>
                {t("면접 일정 제안하기", "Propose interview times", "提议面试日程", "Đề xuất lịch phỏng vấn", "面接日程を提案する", "Usulkan jadwal wawancara")}
              </button>
            </div>
          </div>
        ) : (
          <div className="ops-stack">
            {data.interviewSlots.map((slot) => (
              <div key={slot.id} className="ops-soft-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                    {formatDateTime(slot.startsAt)} ~ {formatDateTime(slot.endsAt)}
                  </p>
                  {slot.location ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>📍 {slot.location}</p> : null}
                  {slot.notes ? <p className="ops-card-subtle" style={{ marginTop: 2 }}>{slot.notes}</p> : null}
                  <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                    {t("제안", "Proposed", "提议", "Đề xuất", "提案", "Diusulkan")} {formatDateTime(slot.proposedAt)}
                    {slot.selectedAt ? ` · ${t("선택", "Selected", "选择", "Đã chọn", "選択", "Dipilih")} ${formatDateTime(slot.selectedAt)}` : ""}
                    {slot.cancelledAt ? ` · ${t("취소", "Cancelled", "取消", "Đã hủy", "キャンセル", "Dibatalkan")} ${formatDateTime(slot.cancelledAt)}` : ""}
                  </p>
                </div>
                <span className={`ops-pill ${SLOT_STATUS_PILL[slot.status]}`}>
                  {slot.status === "PROPOSED" ? t("제안됨", "Proposed", "已提议", "Đã đề xuất", "提案済み", "Diusulkan") : slot.status === "SELECTED" ? t("확정", "Confirmed", "已确定", "Đã xác nhận", "確定", "Dikonfirmasi") : t("취소", "Cancelled", "取消", "Đã hủy", "キャンセル", "Dibatalkan")}
                </span>
              </div>
            ))}
          </div>
        )}
      </article>

      <article className="ops-card">
        <h3 className="ops-section-title">{t("과제", "Assignments", "作业", "Bài tập", "課題", "Tugas")} ({data.assignments.length})</h3>
        {data.assignments.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("부여된 과제가 없습니다.", "No assignments given.", "没有布置的作业。", "Chưa có bài tập nào.", "付与された課題がありません。", "Belum ada tugas yang diberikan.")}</p>
        ) : (
          <div className="ops-stack">
            {data.assignments.map((a) => (
              <div key={a.id} className="ops-soft-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{a.title}</p>
                    <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                      {t("부여", "Assigned", "布置", "Giao", "付与", "Diberikan")} {formatDateTime(a.assignedAt)} · {t("마감", "Due", "截止", "Hạn", "締切", "Batas")} {formatDateTime(a.dueAt)}
                      {a.assignedBy ? ` · ${t("담당", "By", "负责", "Phụ trách", "担当", "Penanggung jawab")} ${a.assignedBy.name ?? "-"}` : ""}
                    </p>
                  </div>
                  <span className={`ops-pill ${ASSIGNMENT_STATUS_PILL[a.status]}`}>
                    {a.status === "ASSIGNED" ? t("부여됨", "Assigned", "已布置", "Đã giao", "付与済み", "Diberikan") : a.status === "SUBMITTED" ? t("제출됨", "Submitted", "已提交", "Đã nộp", "提出済み", "Dikirim") : a.status === "REVIEWED" ? t("검토 완료", "Reviewed", "已审阅", "Đã đánh giá", "確認済み", "Ditinjau") : t("취소", "Cancelled", "取消", "Đã hủy", "キャンセル", "Dibatalkan")}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{a.description}</p>
                {a.submissionContent ? (
                  <div style={{ marginTop: 8, padding: 10, background: "#fff", borderRadius: 8 }}>
                    <p className="ops-card-subtle" style={{ margin: 0, fontWeight: 600, color: "#111827" }}>{t("제출", "Submitted", "提交", "Đã nộp", "提出", "Dikirim")} ({formatDateTime(a.submittedAt)})</p>
                    <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{a.submissionContent}</p>
                  </div>
                ) : null}
                {a.feedbackContent ? (
                  <div style={{ marginTop: 8, padding: 10, background: "#ecfdf5", borderRadius: 8 }}>
                    <p className="ops-card-subtle" style={{ margin: 0, fontWeight: 600, color: "#047857" }}>
                      {t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")} ({formatDateTime(a.reviewedAt)}{a.feedbackRating ? ` · ${a.feedbackRating}/5` : ""})
                    </p>
                    <p style={{ fontSize: 13, color: "#065f46", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{a.feedbackContent}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </article>

      {data.program ? (
        <article className="ops-card">
          <h3 className="ops-section-title">{t("프로그램", "Program", "项目", "Chương trình", "プログラム", "Program")}</h3>
          <div className="ops-soft-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
                  {formatDate(data.program.startsAt)} ~ {formatDate(data.program.endsAt)}
                </p>
                <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                  {t("미팅", "Meetings", "会议", "Cuộc họp", "ミーティング", "Rapat")} {data.program.meetings.length}{t("건", "", "场", "", "件", "")}
                  {data.program.certificate ? t(" · 수료증 발급", " · Certificate issued", " · 已发结业证", " · Đã cấp chứng chỉ", " · 修了証発行", " · Sertifikat diterbitkan") : ""}
                  {data.program.recommendation ? t(" · 추천서 발급", " · Recommendation issued", " · 已发推荐信", " · Đã cấp thư giới thiệu", " · 推薦状発行", " · Surat rekomendasi diterbitkan") : ""}
                  {data.program.schoolCreditRequest ? ` · ${t("학점 인정", "Credit recognition", "学分认定", "Công nhận tín chỉ", "単位認定", "Pengakuan kredit")} ${data.program.schoolCreditRequest.status === "APPROVED" ? t("승인", "Approved", "已批准", "Đã duyệt", "承認", "Disetujui") : data.program.schoolCreditRequest.status === "REJECTED" ? t("반려", "Rejected", "已驳回", "Đã từ chối", "却下", "Ditolak") : t("심사중", "Under review", "审核中", "Đang xét", "審査中", "Sedang ditinjau")}` : ""}
                </p>
              </div>
              <div className="ops-table-actions">
                <span className={`ops-pill ${data.program.status === "ACTIVE" ? "ops-pill-blue" : data.program.status === "COMPLETED" ? "ops-pill-green" : "ops-pill-gray"}`}>
                  {data.program.status === "ACTIVE" ? t("진행 중", "In progress", "进行中", "Đang diễn ra", "進行中", "Berlangsung") : data.program.status === "COMPLETED" ? t("완료", "Completed", "已完成", "Hoàn thành", "完了", "Selesai") : t("취소", "Cancelled", "取消", "Đã hủy", "キャンセル", "Dibatalkan")}
                </span>
                <Link href={`${programLinkBase}/${data.program.id}`} className="ops-btn">
                  {t("상세", "Details", "详情", "Chi tiết", "詳細", "Detail")} →
                </Link>
              </div>
            </div>
          </div>
        </article>
      ) : null}

      <article className="ops-card">
        <h3 className="ops-section-title">{t("관련 이슈", "Related issues", "相关问题", "Vấn đề liên quan", "関連イシュー", "Masalah terkait")} ({data.issues.length})</h3>
        {data.issues.length === 0 ? (
          <p className="ops-card-subtle" style={{ margin: 0 }}>{t("등록된 이슈가 없습니다.", "No issues registered.", "没有登记的问题。", "Chưa có vấn đề nào.", "登録されたイシューがありません。", "Belum ada masalah terdaftar.")}</p>
        ) : (
          <div className="ops-stack">
            {data.issues.map((i) => (
              <div key={i.id} className="ops-soft-card">
                <div className="ops-tag-row" style={{ marginBottom: 6 }}>
                  <span className="ops-pill ops-pill-gray">{issueTypeKo(t, i.type)}</span>
                  <span className={`ops-pill ${ISSUE_STATUS_PILL[i.status]}`}>{issueStatusKo(t, i.status)}</span>
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>{i.title}</p>
                <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{i.description}</p>
                <p className="ops-card-subtle" style={{ marginTop: 4 }}>
                  {formatDateTime(i.createdAt)} · {t("신고", "Reporter", "举报", "Người báo", "報告", "Pelapor")} {i.reporter?.name ?? i.reporter?.email ?? "-"}
                  {i.assignedTo ? ` · ${t("담당", "Assignee", "负责", "Phụ trách", "担当", "Penanggung jawab")} ${i.assignedTo.name ?? i.assignedTo.email}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>

      {/* 지원자와의 대화 — CANDIDATE 공개 메시지만 채팅형으로. 지원자 프로필의 '회사에 문의'와 대칭. */}
      <article className="ops-card">
        <h3 className="ops-section-title">{t("지원자와의 대화", "Conversation with applicant", "与应聘者的对话", "Trò chuyện với ứng viên", "応募者との会話", "Percakapan dengan pelamar")}</h3>
        <p className="ops-card-subtle" style={{ margin: "0 0 12px" }}>{t("여기 남긴 메시지는 지원자에게 바로 전달됩니다(알림·이메일). 질문 답변·일정 조율에 사용하세요.", "Messages left here are delivered directly to the applicant (notification & email). Use it for answering questions and scheduling.", "在此留言将直接发送给应聘者（通知·邮件）。可用于回答问题和协调日程。", "Tin nhắn để lại đây sẽ được gửi trực tiếp đến ứng viên (thông báo & email). Dùng để trả lời câu hỏi và sắp xếp lịch.", "ここに残したメッセージは応募者に直接届きます（通知・メール）。質問への回答や日程調整にご利用ください。", "Pesan di sini langsung dikirim ke pelamar (notifikasi & email). Gunakan untuk menjawab pertanyaan dan mengatur jadwal.")}</p>
        {(() => {
          const chat = comments.filter((c) => c.visibility === "CANDIDATE");
          return (
            <div className="ops-stack" style={{ maxHeight: 360, overflowY: "auto", marginBottom: 12, gap: 10 }}>
              {chat.length === 0 ? (
                <p className="ops-card-subtle" style={{ margin: 0 }}>{t("아직 지원자와 주고받은 메시지가 없습니다.", "No messages exchanged with the applicant yet.", "还没有与应聘者往来的消息。", "Chưa có tin nhắn trao đổi với ứng viên.", "まだ応募者とのメッセージがありません。", "Belum ada pesan dengan pelamar.")}</p>
              ) : (
                chat.map((c) => {
                  const mine = c.author.role !== "STUDENT"; // 회사/운영자 = 우리(오른쪽)
                  return (
                    <div key={c.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
                      <div style={{ maxWidth: "78%" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 3, textAlign: mine ? "right" : "left" }}>
                          {mine ? (c.author.role === "OPERATOR" ? t("운영자", "Operator", "运营者", "Quản trị viên", "運営者", "Operator") : t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")) : (c.author.name ?? t("지원자", "Applicant", "应聘者", "Ứng viên", "応募者", "Pelamar"))}
                        </div>
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: 14,
                            fontSize: 13,
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                            background: mine ? "#0B46E8" : "#fff",
                            color: mine ? "#fff" : "#111827",
                            border: mine ? "none" : "1px solid #e5e7eb"
                          }}
                        >
                          {c.content}
                        </div>
                        <div style={{ fontSize: 10.5, color: "#9ca3af", marginTop: 3, textAlign: mine ? "right" : "left" }}>{formatDateTime(c.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })()}
        <div className="ops-soft-card">
          <textarea
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            placeholder={t("지원자에게 보낼 메시지를 입력하세요...", "Type a message to send to the applicant...", "输入要发送给应聘者的消息...", "Nhập tin nhắn gửi cho ứng viên...", "応募者に送るメッセージを入力...", "Ketik pesan untuk pelamar...")}
            rows={2}
            className="ops-textarea"
          />
          <div className="ops-row-end" style={{ marginTop: 8 }}>
            <button type="button" onClick={() => void sendChat()} disabled={sendingChat || !chatDraft.trim()} className="ops-btn ops-btn-primary">
              {sendingChat ? t("전송 중...", "Sending...", "发送中...", "Đang gửi...", "送信中...", "Mengirim...") : t("지원자에게 전송", "Send to applicant", "发送给应聘者", "Gửi cho ứng viên", "応募者に送信", "Kirim ke pelamar")}
            </button>
          </div>
        </div>
      </article>

      {/* 내부 메모 — INTERNAL 만. 지원자에게 보이지 않는다. */}
      <article className="ops-card">
        {(() => {
          const internal = comments.filter((c) => c.visibility === "INTERNAL");
          return (
            <>
              <h3 className="ops-section-title">{t("내부 메모", "Internal memos", "内部备注", "Ghi chú nội bộ", "内部メモ", "Catatan internal")} ({internal.length})</h3>
              <p className="ops-card-subtle" style={{ margin: "0 0 12px" }}>{viewer === "operator"
                ? t("🔒 회사·운영자에게만 보입니다. 지원자에게는 전달되지 않습니다.", "🔒 Visible only to the company and operators. Not shared with the applicant.", "🔒 仅公司·运营者可见。不会发送给应聘者。", "🔒 Chỉ công ty và quản trị viên thấy được. Không gửi cho ứng viên.", "🔒 会社・運営者のみに表示されます。応募者には送られません。", "🔒 Hanya terlihat oleh perusahaan dan operator. Tidak dibagikan ke pelamar.")
                : t("🔒 회사에게만 보입니다. 지원자에게는 전달되지 않습니다.", "🔒 Visible only to the company. Not shared with the applicant.", "🔒 仅公司可见。不会发送给应聘者。", "🔒 Chỉ công ty thấy được. Không gửi cho ứng viên.", "🔒 会社のみに表示されます。応募者には送られません。", "🔒 Hanya terlihat oleh perusahaan. Tidak dibagikan ke pelamar.")}</p>
              <div className="ops-soft-card" style={{ marginBottom: 12 }}>
                <textarea
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder={t("이 지원에 대한 내부 메모", "Internal memo for this application", "关于此申请的内部备注", "Ghi chú nội bộ cho ứng tuyển này", "この応募に関する内部メモ", "Catatan internal untuk lamaran ini")}
                  rows={3}
                  className="ops-textarea"
                />
                <div className="ops-row-end" style={{ marginTop: 8 }}>
                  <button type="button" onClick={() => void postComment()} disabled={postingComment} className="ops-btn ops-btn-primary">
                    {postingComment ? t("작성 중...", "Posting...", "撰写中...", "Đang viết...", "作成中...", "Menulis...") : t("메모 등록", "Post memo", "登记备注", "Đăng ghi chú", "メモを登録", "Simpan catatan")}
                  </button>
                </div>
              </div>
              {internal.length === 0 ? (
                <p className="ops-card-subtle" style={{ margin: 0 }}>{t("아직 작성된 내부 메모가 없습니다.", "No internal memos yet.", "还没有内部备注。", "Chưa có ghi chú nội bộ.", "まだ内部メモがありません。", "Belum ada catatan internal.")}</p>
              ) : (
                <div className="ops-stack">
                  {internal.map((c) => {
                    const isOps = c.author.role === "OPERATOR";
                    return (
                      <div key={c.id} style={{ padding: 12, borderRadius: 10, background: isOps ? "#fffbeb" : "#f9fafb" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                          <span className={`ops-pill ${isOps ? "ops-pill-amber" : "ops-pill-blue"}`}>
                            {c.author.name ?? c.author.email} ({isOps ? t("운영자", "Operator", "运营者", "Quản trị viên", "運営者", "Operator") : t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")})
                          </span>
                          <span className="ops-card-subtle" style={{ flexShrink: 0 }}>{formatDateTime(c.createdAt)}</span>
                        </div>
                        <p style={{ fontSize: 13, color: "#111827", whiteSpace: "pre-wrap", margin: "8px 0 0" }}>{c.content}</p>
                        <div className="ops-row-end" style={{ marginTop: 6 }}>
                          <button type="button" onClick={() => void deleteComment(c.id)} className="ops-btn ops-btn-danger" style={{ height: 24, fontSize: 11, padding: "0 8px" }}>
                            {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          );
        })()}
      </article>

      {error ? <div className="ops-error-card">{error}</div> : null}

      <ProposeInterviewSlotsModal
        open={interviewOpen}
        applicationId={data.id}
        applicantName={data.candidateUser.name ?? undefined}
        positionTitle={data.position.title}
        onClose={() => setInterviewOpen(false)}
        onProposed={() => void load()}
      />
      <AssignmentManagerModal
        open={assignmentOpen}
        applicationId={data.id}
        applicantName={data.candidateUser.name ?? undefined}
        positionTitle={data.position.title}
        onClose={() => {
          setAssignmentOpen(false);
          void load();
        }}
      />
    </>
  );
}

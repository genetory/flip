"use client";

import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { usePlatformT, type PlatformT } from "../../lib/i18n";

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
export type IssueType = "NO_SHOW" | "BEHAVIOR" | "DROPOUT" | "ATTITUDE" | "PAYMENT" | "OTHER";

export type IssueDetailIssue = {
  id: string;
  type: IssueType;
  status: IssueStatus;
  title: string;
  description: string;
  positionId: string | null;
  applicationId: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  reporter: { id: string; name: string | null; email: string; role: string };
  subject: { id: string; name: string | null; email: string; role: string } | null;
  assignedTo: { id: string; name: string | null; email: string } | null;
};

type Props = {
  open: boolean;
  issue: IssueDetailIssue | null;
  onClose: () => void;
  onUpdated: () => void;
  viewer?: "operator" | "partner" | "student";
};

function typeLabel(t: PlatformT, type: IssueType): string {
  switch (type) {
    case "NO_SHOW":
      return t("노쇼", "No-show", "爽约", "Vắng mặt", "無断欠席", "Tidak hadir");
    case "BEHAVIOR":
      return t("행동·태도", "Behavior", "行为态度", "Hành vi thái độ", "行動・態度", "Perilaku");
    case "DROPOUT":
      return t("참여 중단", "Dropout", "中途退出", "Ngừng tham gia", "参加中止", "Berhenti");
    case "ATTITUDE":
      return t("커뮤니케이션", "Communication", "沟通", "Giao tiếp", "コミュニケーション", "Komunikasi");
    case "PAYMENT":
      return t("정산/결제", "Payment", "结算/支付", "Thanh toán", "精算・決済", "Pembayaran");
    default:
      return t("기타", "Other", "其他", "Khác", "その他", "Lainnya");
  }
}

function statusLabel(t: PlatformT, status: IssueStatus): string {
  switch (status) {
    case "OPEN":
      return t("신규", "New", "新建", "Mới", "新規", "Baru");
    case "IN_PROGRESS":
      return t("처리 중", "In progress", "处理中", "Đang xử lý", "対応中", "Diproses");
    case "RESOLVED":
      return t("해결", "Resolved", "已解决", "Đã giải quyết", "解決", "Selesai");
    default:
      return t("종료", "Closed", "已关闭", "Đã đóng", "終了", "Ditutup");
  }
}

const STATUS_PILL: Record<IssueStatus, string> = {
  OPEN: "ops-pill-red",
  IN_PROGRESS: "ops-pill-amber",
  RESOLVED: "ops-pill-green",
  CLOSED: "ops-pill-gray"
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

export function IssueDetailModal({ open, issue, onClose, onUpdated, viewer = "operator" }: Props) {
  const t = usePlatformT();
  const canManage = viewer === "operator";
  const [statusDraft, setStatusDraft] = useState<IssueStatus>("OPEN");
  const [noteDraft, setNoteDraft] = useState("");
  const [assigneeEmail, setAssigneeEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!issue) return;
    setStatusDraft(issue.status);
    setNoteDraft(issue.resolutionNote ?? "");
    setAssigneeEmail(issue.assignedTo?.email ?? "");
    setError(null);
  }, [issue?.id, open]);

  if (!open || !issue) return null;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        status: statusDraft,
        resolutionNote: noteDraft.trim() || null
      };
      const trimmedEmail = assigneeEmail.trim();
      if (trimmedEmail !== (issue?.assignedTo?.email ?? "")) {
        if (!trimmedEmail) {
          body.assignedToUserId = null;
        } else {
          const lookup = await fetch(`${apiBase()}/ops/users?search=${encodeURIComponent(trimmedEmail)}&pageSize=10`, {
            headers: authHeaders(),
            cache: "no-store"
          });
          if (!lookup.ok) throw new Error(t(`담당자 조회 실패 HTTP ${lookup.status}`, `Assignee lookup failed HTTP ${lookup.status}`, `负责人查询失败 HTTP ${lookup.status}`, `Tra cứu người phụ trách thất bại HTTP ${lookup.status}`, `担当者の検索に失敗 HTTP ${lookup.status}`, `Pencarian penanggung jawab gagal HTTP ${lookup.status}`));
          const payload = (await lookup.json()) as { items?: Array<{ id: string; email: string }> };
          const match = (payload.items ?? []).find((u) => u.email.toLowerCase() === trimmedEmail.toLowerCase());
          if (!match) throw new Error(t(`'${trimmedEmail}' 이메일의 운영자를 찾을 수 없습니다.`, `No operator found for '${trimmedEmail}'.`, `未找到邮箱为 '${trimmedEmail}' 的运营者。`, `Không tìm thấy quản trị viên với email '${trimmedEmail}'.`, `'${trimmedEmail}' のオペレーターが見つかりません。`, `Operator dengan email '${trimmedEmail}' tidak ditemukan.`));
          body.assignedToUserId = match.id;
        }
      }
      const response = await fetch(`${apiBase()}/ops/issues/${issue!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("이슈 업데이트 실패", "Failed to update issue", "更新问题失败", "Cập nhật sự cố thất bại", "問題の更新に失敗しました", "Gagal memperbarui isu"));
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
          width: "min(640px, 100%)",
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>{issue.title}</h2>
            <div className="ops-tag-row" style={{ marginTop: 6 }}>
              <span className="ops-pill ops-pill-gray">{typeLabel(t, issue.type)}</span>
              <span className={`ops-pill ${STATUS_PILL[issue.status]}`}>{statusLabel(t, issue.status)}</span>
            </div>
          </div>
          <button type="button" className="ops-btn" onClick={onClose}>
            {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
          </button>
        </div>

        <article className="ops-soft-card">
          <p className="ops-form-label">{t("설명", "Description", "说明", "Mô tả", "説明", "Deskripsi")}</p>
          <p style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap", margin: "4px 0 0" }}>{issue.description}</p>
        </article>

        <dl className="ops-list-card-meta" style={{ marginTop: 12 }}>
          <dt>{t("신고자", "Reporter", "举报人", "Người báo cáo", "報告者", "Pelapor")}</dt>
          <dd>{issue.reporter.name ?? issue.reporter.email} ({issue.reporter.role})</dd>
          {issue.subject ? (
            <>
              <dt>{t("대상", "Subject", "对象", "Đối tượng", "対象", "Subjek")}</dt>
              <dd>{issue.subject.name ?? issue.subject.email} ({issue.subject.role})</dd>
            </>
          ) : null}
          <dt>{t("생성", "Created", "创建", "Tạo", "作成", "Dibuat")}</dt>
          <dd>{formatDateTime(issue.createdAt)}</dd>
          <dt>{t("최근 업데이트", "Last updated", "最近更新", "Cập nhật gần nhất", "最終更新", "Terakhir diperbarui")}</dt>
          <dd>{formatDateTime(issue.updatedAt)}</dd>
          {issue.resolvedAt ? (
            <>
              <dt>{t("처리 시점", "Resolved at", "处理时间", "Thời điểm xử lý", "処理時点", "Waktu penyelesaian")}</dt>
              <dd>{formatDateTime(issue.resolvedAt)}</dd>
            </>
          ) : null}
        </dl>

        {canManage ? (
          <article className="ops-soft-card" style={{ marginTop: 12 }}>
            <h3 className="ops-section-title">{t("케이스 관리", "Case management", "案例管理", "Quản lý vụ việc", "ケース管理", "Manajemen kasus")}</h3>
            <label className="ops-form-label">
              {t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status")}
              <select
                value={statusDraft}
                onChange={(e) => setStatusDraft(e.target.value as IssueStatus)}
                className="ops-select"
                style={{ marginTop: 4 }}
              >
                {(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as IssueStatus[]).map((s) => (
                  <option key={s} value={s}>{statusLabel(t, s)}</option>
                ))}
              </select>
            </label>
            <label className="ops-form-label" style={{ marginTop: 10, display: "block" }}>
              {t("담당자 이메일 (운영자)", "Assignee email (operator)", "负责人邮箱（运营者）", "Email người phụ trách (quản trị viên)", "担当者メール（オペレーター）", "Email penanggung jawab (operator)")}
              <input
                type="email"
                value={assigneeEmail}
                onChange={(e) => setAssigneeEmail(e.target.value)}
                placeholder="operator@flip-ers.com"
                className="ops-input"
                style={{ marginTop: 4 }}
              />
              <p className="ops-card-subtle" style={{ marginTop: 4 }}>{t("이메일을 비우면 담당 해제", "Leave email empty to unassign", "留空邮箱即可取消分配", "Để trống email để bỏ phân công", "メールを空にすると担当解除", "Kosongkan email untuk membatalkan penugasan")}</p>
            </label>
            <label className="ops-form-label" style={{ marginTop: 10, display: "block" }}>
              {t("처리 메모", "Resolution note", "处理备注", "Ghi chú xử lý", "処理メモ", "Catatan penyelesaian")}
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={4}
                placeholder={t("이슈 처리 내역, 결정사항 등", "Resolution details, decisions, etc.", "处理记录、决定事项等", "Chi tiết xử lý, quyết định, v.v.", "処理内容や決定事項など", "Rincian penanganan, keputusan, dll.")}
                className="ops-textarea"
                style={{ marginTop: 4 }}
              />
            </label>
            {error ? <p style={{ color: "#dc2626", fontSize: 12, marginTop: 10 }}>{error}</p> : null}
            <div className="ops-row-end" style={{ marginTop: 12 }}>
              <button type="button" onClick={onClose} className="ops-btn">
                {t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
              </button>
              <button type="button" onClick={() => void save()} disabled={saving} className="ops-btn ops-btn-primary">
                {saving ? t("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
              </button>
            </div>
          </article>
        ) : (
          <article className="ops-soft-card" style={{ marginTop: 12 }}>
            <h3 className="ops-section-title">{t("처리 상태", "Resolution status", "处理状态", "Trạng thái xử lý", "処理状況", "Status penyelesaian")}</h3>
            <div className="ops-list-card-meta">
              <dt>{t("담당자", "Assignee", "负责人", "Người phụ trách", "担当者", "Penanggung jawab")}</dt>
              <dd>{issue.assignedTo ? `${issue.assignedTo.name ?? issue.assignedTo.email}` : t("미지정", "Unassigned", "未指定", "Chưa phân công", "未指定", "Belum ditugaskan")}</dd>
              <dt>{t("처리 메모", "Resolution note", "处理备注", "Ghi chú xử lý", "処理メモ", "Catatan penyelesaian")}</dt>
              <dd style={{ whiteSpace: "pre-wrap" }}>{issue.resolutionNote ?? t("아직 처리 메모가 없습니다.", "No resolution note yet.", "暂无处理备注。", "Chưa có ghi chú xử lý.", "まだ処理メモはありません。", "Belum ada catatan penyelesaian.")}</dd>
            </div>
            <p className="ops-card-subtle" style={{ marginTop: 10 }}>
              {t("상태 변경과 처리 메모는 운영자가 관리합니다.", "Status changes and resolution notes are managed by operators.", "状态变更和处理备注由运营者管理。", "Việc thay đổi trạng thái và ghi chú xử lý do quản trị viên quản lý.", "ステータス変更と処理メモはオペレーターが管理します。", "Perubahan status dan catatan penyelesaian dikelola oleh operator.")}
            </p>
            <div className="ops-row-end" style={{ marginTop: 12 }}>
              <button type="button" onClick={onClose} className="ops-btn">
                {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
              </button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}

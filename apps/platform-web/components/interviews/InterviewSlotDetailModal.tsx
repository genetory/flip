"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readAccessToken } from "../../lib/auth-client";
import { usePlatformT, type PlatformT } from "../../lib/i18n";

export type SlotStatus = "PROPOSED" | "SELECTED" | "CANCELLED";

export type SlotDetailItem = {
  id: string;
  applicationId: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: SlotStatus;
  proposedAt: string;
  selectedAt: string | null;
  cancelledAt: string | null;
  candidateName: string | null;
  candidateEmail: string | null;
  positionTitle: string | null;
  partnerOrganizationName?: string | null;
};

type AppSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  notes: string | null;
  status: SlotStatus;
  proposedAt: string;
  selectedAt: string | null;
  cancelledAt: string | null;
};

type Props = {
  open: boolean;
  slot: SlotDetailItem | null;
  onClose: () => void;
  onUpdated: () => void;
  viewer?: "operator" | "partner";
};

function statusLabel(status: SlotStatus, t: PlatformT): string {
  switch (status) {
    case "PROPOSED":
      return t("제안됨", "Proposed", "已提议", "Đã đề xuất", "提案済み", "Diusulkan");
    case "SELECTED":
      return t("확정", "Confirmed", "已确认", "Đã xác nhận", "確定", "Dikonfirmasi");
    case "CANCELLED":
      return t("취소", "Cancelled", "已取消", "Đã hủy", "キャンセル", "Dibatalkan");
  }
}

const STATUS_PILL: Record<SlotStatus, string> = {
  PROPOSED: "ops-pill-amber",
  SELECTED: "ops-pill-green",
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

export function InterviewSlotDetailModal({ open, slot, onClose, onUpdated, viewer = "operator" }: Props) {
  const t = usePlatformT();
  const applicantBasePath = viewer === "partner"
    ? "/dashboard/partner/applicants"
    : "/dashboard/ops/operations/applications";
  const [allSlots, setAllSlots] = useState<AppSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !slot) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/applications/${slot!.applicationId}/interview-slots`, {
          headers: authHeaders(),
          cache: "no-store"
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = (await response.json()) as { items?: AppSlot[] };
        setAllSlots(payload.items ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("면접 일정을 불러오지 못했습니다.", "Failed to load interview slots.", "无法加载面试时段。", "Không thể tải khung giờ phỏng vấn.", "面接日程を読み込めませんでした。", "Gagal memuat slot wawancara."));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [open, slot?.id]);

  if (!open || !slot) return null;

  async function changeStatus(slotId: string, nextStatus: SlotStatus) {
    setUpdating(slotId);
    setError(null);
    try {
      const response = await fetch(`${apiBase()}/interview-slots/${slotId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      onUpdated();
      const refresh = await fetch(`${apiBase()}/applications/${slot!.applicationId}/interview-slots`, {
        headers: authHeaders(),
        cache: "no-store"
      });
      if (refresh.ok) {
        const payload = (await refresh.json()) as { items?: AppSlot[] };
        setAllSlots(payload.items ?? []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("상태 변경 실패", "Failed to change status", "状态更改失败", "Không thể thay đổi trạng thái", "ステータス変更に失敗しました", "Gagal mengubah status"));
    } finally {
      setUpdating(null);
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
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {slot.candidateName ?? "-"}
            </h2>
            <p className="ops-card-subtle" style={{ marginTop: 4 }}>
              {slot.partnerOrganizationName ?? "-"} · {slot.positionTitle ?? "-"}
            </p>
            <p className="ops-card-subtle" style={{ marginTop: 2 }}>{slot.candidateEmail}</p>
          </div>
          <Link href={`${applicantBasePath}/${slot.applicationId}`} className="ops-btn">
            {t("지원 상세 →", "Application details →", "申请详情 →", "Chi tiết đơn ứng tuyển →", "応募詳細 →", "Detail lamaran →")}
          </Link>
        </div>

        <article className="ops-soft-card">
          <h3 className="ops-section-title">{t("선택된 슬롯", "Selected slot", "已选时段", "Khung giờ đã chọn", "選択された枠", "Slot terpilih")}</h3>
          <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0 }}>
            {formatDateTime(slot.startsAt)} ~ {formatDateTime(slot.endsAt)}
          </p>
          {slot.location ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>📍 {slot.location}</p> : null}
          {slot.notes ? <p className="ops-card-subtle" style={{ marginTop: 2 }}>{slot.notes}</p> : null}
          <div className="ops-tag-row" style={{ marginTop: 8 }}>
            <span className={`ops-pill ${STATUS_PILL[slot.status]}`}>{statusLabel(slot.status, t)}</span>
          </div>
          <p className="ops-card-subtle" style={{ marginTop: 8 }}>
            {t("제안", "Proposed", "已提议", "Đã đề xuất", "提案", "Diusulkan")} {formatDateTime(slot.proposedAt)}
            {slot.selectedAt ? ` · ${t("선택", "Selected", "已选择", "Đã chọn", "選択", "Dipilih")} ${formatDateTime(slot.selectedAt)}` : ""}
            {slot.cancelledAt ? ` · ${t("취소", "Cancelled", "已取消", "Đã hủy", "キャンセル", "Dibatalkan")} ${formatDateTime(slot.cancelledAt)}` : ""}
          </p>
        </article>

        <article className="ops-card" style={{ marginTop: 12 }}>
          <h3 className="ops-section-title">{t("이 지원의 모든 면접 슬롯", "All interview slots for this application", "此申请的所有面试时段", "Tất cả khung giờ phỏng vấn cho đơn này", "この応募のすべての面接枠", "Semua slot wawancara untuk lamaran ini")} ({allSlots.length})</h3>
          {loading ? (
            <p className="ops-card-subtle" style={{ margin: 0 }}>{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</p>
          ) : allSlots.length === 0 ? (
            <p className="ops-card-subtle" style={{ margin: 0 }}>{t("슬롯이 없습니다.", "No slots.", "没有时段。", "Không có khung giờ.", "枠がありません。", "Tidak ada slot.")}</p>
          ) : (
            <div className="ops-stack">
              {allSlots.map((s) => {
                const isUpdating = updating === s.id;
                return (
                  <div key={s.id} className="ops-soft-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", margin: 0 }}>
                          {formatDateTime(s.startsAt)} ~ {formatDateTime(s.endsAt)}
                        </p>
                        {s.location ? <p className="ops-card-subtle" style={{ marginTop: 4 }}>📍 {s.location}</p> : null}
                      </div>
                      <span className={`ops-pill ${STATUS_PILL[s.status]}`}>{statusLabel(s.status, t)}</span>
                    </div>
                    {s.status !== "CANCELLED" ? (
                      <div className="ops-row-end" style={{ marginTop: 10 }}>
                        {s.status === "PROPOSED" ? (
                          <button type="button" className="ops-btn" disabled={isUpdating} onClick={() => void changeStatus(s.id, "SELECTED")}>
                            {t("확정 처리", "Confirm", "确认处理", "Xác nhận", "確定処理", "Konfirmasi")}
                          </button>
                        ) : null}
                        <button type="button" className="ops-btn ops-btn-danger" disabled={isUpdating} onClick={() => void changeStatus(s.id, "CANCELLED")}>
                          {s.status === "SELECTED" ? t("취소 (노쇼/철회)", "Cancel (no-show/withdrawn)", "取消（爽约/撤回）", "Hủy (vắng mặt/rút lại)", "キャンセル（無断欠席/撤回）", "Batal (tidak hadir/ditarik)") : t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </article>

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

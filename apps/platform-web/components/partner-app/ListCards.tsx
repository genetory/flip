"use client";

// 파트너 공용 리스트 카드 — 지원자 카드 / 모의 면접 참여자 카드.
// 지원자 리스트·공고 상세 등 여러 화면에서 동일한 아이템 뷰를 쓰기 위해 분리.
import Link from "next/link";
import { GraduationCap, Globe, Translate, Clock, Check } from "@phosphor-icons/react";
import { partnerRoutes } from "../../lib/partner/app-nav";
import { PARTNER_APPLICANT_STATUS } from "../../lib/partner/labels";
import { formatRelativeTime } from "../../lib/talent/career-feed";
import { usePlatformT } from "../../lib/i18n";
import type { PartnerApplicantListItem, OrgMockInterviewParticipant, PartnerApplicantStatus } from "../../lib/member-profile-client";

// onSetStatus 를 주면(지원자 목록 화면) 카드에서 바로 검토 시작·불합격 처리 가능.
// selectable 이면 비교 선택용 체크박스를 앞에 붙인다(카드 링크와 분리).
export function PartnerApplicantCard({ a, onSetStatus, selectable, selected, onToggleSelect }: { a: PartnerApplicantListItem; onSetStatus?: (id: string, next: PartnerApplicantStatus) => void; selectable?: boolean; selected?: boolean; onToggleSelect?: () => void }) {
  const t = usePlatformT();
  const s = PARTNER_APPLICANT_STATUS[a.status];
  const edu = [a.school, a.major].filter(Boolean).join(" · ");
  const langs = a.languages?.length ? a.languages.join(", ") : "";
  // SLA — 신규 지원이 3일 이상 미검토면 방치 경고.
  const waitingDays = a.status === "APPLIED" && a.appliedAt ? Math.floor((Date.now() - new Date(a.appliedAt).getTime()) / 86_400_000) : 0;
  const reviewLabel = t("검토 시작", "Review", "开始审核", "Xem xét", "審査開始", "Tinjau");
  const rejectLabel = t("불합격", "Reject", "淘汰", "Từ chối", "不合格", "Tolak");
  const quick: { label: string; next: PartnerApplicantStatus; danger?: boolean }[] = onSetStatus
    ? a.status === "APPLIED"
      ? [{ label: reviewLabel, next: "REVIEWING" }, { label: rejectLabel, next: "REJECTED", danger: true }]
      : a.status === "REVIEWING"
        ? [{ label: rejectLabel, next: "REJECTED", danger: true }]
        : []
    : [];
  return (
    <Link href={`${partnerRoutes.applicants}/${encodeURIComponent(a.id)}`} className={`block rounded-2xl border bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB] ${selected ? "border-[#0B46E8] ring-1 ring-[#0B46E8]" : "border-[#EEF1F5]"}`}>
      <div className="flex items-start gap-3.5">
        {selectable ? (
          <button
            type="button"
            aria-label={selected ? t("비교 선택 해제", "Deselect for comparison", "取消比较选择", "Bỏ chọn so sánh", "比較の選択を解除", "Batal pilih untuk dibandingkan") : t("비교 대상 선택", "Select for comparison", "选择进行比较", "Chọn để so sánh", "比較対象を選択", "Pilih untuk dibandingkan")}
            aria-pressed={selected}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSelect?.(); }}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${selected ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#D7DCE3] bg-white text-transparent"}`}
          >
            <Check className="h-3.5 w-3.5" weight="bold" />
          </button>
        ) : null}
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[17px] font-black text-[#0B46E8]">{a.name.slice(0, 1)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate text-[15px] font-bold text-[#191F28]">{a.name}</p>
            <span className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
            {waitingDays >= 3 ? <span className="shrink-0 whitespace-nowrap rounded-md bg-[#FDECEE] px-2.5 py-0.5 text-[11px] font-bold text-[#F04452]">🕒 {t(`${waitingDays}일 대기`, `${waitingDays}d waiting`, `等待 ${waitingDays} 天`, `chờ ${waitingDays} ngày`, `${waitingDays}日待機`, `menunggu ${waitingDays} hari`)}</span> : null}
            {a.mockInterviewPracticed ? <span className="shrink-0 whitespace-nowrap rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">🎤 {t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}{a.mockInterviewScore != null ? ` ${a.mockInterviewScore}${t("점", "pts", "分", "đ", "点", "poin")}` : ""}</span> : null}
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-[#4E5968]">{a.positionTitle}</p>

          <div className="mt-2 flex flex-col gap-1">
            {edu ? (
              <span className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><GraduationCap className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{edu}</span></span>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {a.nationality ? <span className="flex min-w-0 max-w-full items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Globe className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{a.nationality}</span></span> : null}
              {langs ? <span className="flex min-w-0 max-w-full items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Translate className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{langs}</span></span> : null}
            </div>
          </div>
        </div>
        {a.appliedAt ? (
          <span className="flex shrink-0 items-center gap-1 text-[11.5px] text-[#B0B8C1]"><Clock className="h-3.5 w-3.5" /> {formatRelativeTime(new Date(a.appliedAt).getTime())}</span>
        ) : null}
      </div>
      {quick.length && onSetStatus ? (
        <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-[#F5F6F8] pt-3">
          {quick.map((act) => (
            <button
              key={act.next}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSetStatus(a.id, act.next);
              }}
              className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition ${act.danger ? "border-[#FBD9DE] bg-white text-[#F04452] hover:bg-[#FDECEE]" : "border-[#E5E8EB] bg-white text-[#4E5968] hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"}`}
            >
              {act.label}
            </button>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

export function PartnerParticipantCard({ m, onPropose }: { m: OrgMockInterviewParticipant; onPropose: () => void }) {
  const t = usePlatformT();
  return (
    <Link href={`${partnerRoutes.positions}/${m.positionId}/mock/${encodeURIComponent(m.userId)}`} className="block rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      <div className="flex items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[17px] font-black text-[#0B46E8]">{m.name.slice(0, 1)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="min-w-0 truncate text-[15px] font-bold text-[#191F28]">{m.name}</p>
            {m.bestScore != null ? <span className="shrink-0 whitespace-nowrap rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">🎤 {m.bestScore}{t("점", "pts", "分", "đ", "点", "poin")}</span> : null}
            {m.applied ? <span className="shrink-0 whitespace-nowrap rounded-md bg-[#E7F8EF] px-2.5 py-0.5 text-[11px] font-bold text-[#0A9B59]">{t("지원함", "Applied", "已申请", "Đã ứng tuyển", "応募済み", "Melamar")}</span> : <span className="shrink-0 whitespace-nowrap rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[11px] font-bold text-[#8B95A1]">{t("미지원", "Not applied", "未申请", "Chưa ứng tuyển", "未応募", "Belum melamar")}</span>}
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-[#4E5968]">{m.positionTitle}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{t(`답변 ${m.answeredCount}개`, `${m.answeredCount} answers`, `${m.answeredCount} 个回答`, `${m.answeredCount} câu trả lời`, `回答 ${m.answeredCount}件`, `${m.answeredCount} jawaban`)}{m.nationality ? ` · ${m.nationality}` : ""}</p>
        </div>
        {m.connectionStatus === "ACCEPTED" ? (
          <span className="shrink-0 rounded-lg bg-[#E7F8EF] px-3 py-1.5 text-[12px] font-bold text-[#0A9B59]">{t("수락됨", "Accepted", "已接受", "Đã chấp nhận", "承諾済み", "Diterima")}</span>
        ) : m.connectionStatus === "PENDING" ? (
          <span className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-bold text-[#8B95A1]">{t("제안 보냄", "Proposal sent", "已发送提议", "Đã gửi đề nghị", "提案済み", "Ajakan terkirim")}</span>
        ) : m.connectionStatus === "DECLINED" ? (
          <span className="shrink-0 rounded-lg bg-[#FDECEE] px-3 py-1.5 text-[12px] font-bold text-[#F04452]">{t("거절됨", "Declined", "已拒绝", "Đã từ chối", "辞退済み", "Ditolak")}</span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPropose();
            }}
            className="shrink-0 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0A3ECB]"
          >
            {t("제안하기", "Propose", "发送提议", "Đề nghị", "提案する", "Ajukan")}
          </button>
        )}
      </div>
    </Link>
  );
}

"use client";

// 파트너 지원자 상세 — 2단 레이아웃.
// 상단(전폭): 프로필 + 채용 단계 스테퍼 + 상태 변경.
// 좌: 인적사항 · 지원 서류 · 이력서 | 우: 내부 메모 · 면접 · 메시지.
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, PaperPlaneTilt, Plus, ArrowSquareOut, Check, CaretRight, CaretDown, Sparkle, Briefcase, CalendarCheck, CalendarPlus } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { PARTNER_APPLICANT_STATUS, PARTNER_POSITION_STATUS, usePartnerApplicantStatusLabel, usePartnerPositionStatusLabel } from "../../../lib/partner/labels";
import {
  getMyPartnerApplicantById,
  getMyPartnerPositionById,
  getPartnerApplicantDocumentSummary,
  updateMyPartnerApplicantState,
  getInterviewSlotsForApplication,
  proposeInterviewSlots,
  getPartnerApplicantMessages,
  sendPartnerApplicantMessage,
  type PartnerApplicantDetail,
  type PartnerApplicantStatus,
  type InterviewSlot,
  type PartnerApplicantMessage,
  type PartnerPosition
} from "../../../lib/member-profile-client";

function employmentLabel(t: PlatformT, type: PartnerPosition["employmentType"]): string {
  switch (type) {
    case "FULL_TIME":
      return t("정규직", "Full-time", "全职", "Toàn thời gian", "正社員", "Penuh waktu");
    case "INTERN":
      return t("인턴", "Intern", "实习", "Thực tập", "インターン", "Magang");
    case "PART_TIME":
      return t("파트타임", "Part-time", "兼职", "Bán thời gian", "パート", "Paruh waktu");
    case "UNPAID_INTERN":
      return t("무급 인턴", "Unpaid intern", "无薪实习", "Thực tập không lương", "無給インターン", "Magang tanpa gaji");
  }
}

const STATUS_ACTIONS: PartnerApplicantStatus[] = ["REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "REJECTED"];
const STEPS: { reach: PartnerApplicantStatus[] }[] = [
  { reach: ["APPLIED", "REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "COMPLETED"] },
  { reach: ["REVIEWING", "INTERVIEW", "OFFERED", "ACCEPTED", "COMPLETED"] },
  { reach: ["INTERVIEW", "OFFERED", "ACCEPTED", "COMPLETED"] },
  { reach: ["OFFERED", "ACCEPTED", "COMPLETED"] }
];
function stepLabel(t: PlatformT, i: number): string {
  switch (i) {
    case 0:
      return t("지원", "Applied", "已申请", "Đã nộp", "応募", "Melamar");
    case 1:
      return t("검토", "Review", "审核", "Xem xét", "選考", "Tinjau");
    case 2:
      return t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara");
    default:
      return t("합격", "Passed", "录用", "Đạt", "合格", "Lolos");
  }
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
}

// 확정된 면접을 면접관 캘린더에 추가하는 구글 캘린더 링크.
function partnerGcalUrl(t: PlatformT, slot: InterviewSlot, candidate: string, positionTitle: string): string {
  const start = new Date(slot.startsAt);
  const end = slot.endsAt ? new Date(slot.endsAt) : new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: t(`${candidate} 면접 · ${positionTitle}`, `${candidate} interview · ${positionTitle}`, `${candidate} 面试 · ${positionTitle}`, `Phỏng vấn ${candidate} · ${positionTitle}`, `${candidate} 面接 · ${positionTitle}`, `Wawancara ${candidate} · ${positionTitle}`),
    dates: `${fmt(start)}/${fmt(end)}`,
    details: t("Aply 지원자 면접 일정입니다.", "Aply applicant interview schedule.", "Aply 申请者面试日程。", "Lịch phỏng vấn ứng viên Aply.", "Aply 応募者の面接予定です。", "Jadwal wawancara pelamar Aply.")
  });
  if (slot.location) params.set("location", slot.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}


// 면접 시간 선택 — 날짜 + 30분 단위 시간 드롭다운(00:00 ~ 24:00).
type SlotRow = { date: string; time: string; location: string };
const EMPTY_SLOT_ROW: SlotRow = { date: "", time: "", location: "" };
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h <= 23; h += 1) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    out.push(`${String(h).padStart(2, "0")}:30`);
  }
  out.push("24:00"); // 자정(다음 날 00:00)
  return out;
})();
// 날짜·시간·장소가 모두 채워진 행만 유효한 슬롯으로 인정.
function slotsFromRows(rows: SlotRow[]): { startsAt: string; endsAt: string; location?: string }[] {
  return rows
    .filter((r) => r.date && r.time && r.location.trim())
    .map((r) => {
      // 24:00 은 다음 날 00:00 으로 처리.
      const d = r.time === "24:00" ? new Date(`${r.date}T00:00`) : new Date(`${r.date}T${r.time}`);
      if (r.time === "24:00") d.setDate(d.getDate() + 1);
      d.setMinutes(Math.round(d.getMinutes() / 30) * 30, 0, 0);
      return {
        startsAt: d.toISOString(),
        endsAt: new Date(d.getTime() + 60 * 60000).toISOString(),
        location: r.location.trim() || undefined
      };
    });
}

function InterviewSlotRows({ rows, setRows, max = 3 }: { rows: SlotRow[]; setRows: React.Dispatch<React.SetStateAction<SlotRow[]>>; max?: number }) {
  const t = usePlatformT();
  const upd = (i: number, patch: Partial<SlotRow>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-col gap-1.5 rounded-xl bg-white p-2.5">
          <div className="flex gap-1.5">
            <input type="date" value={r.date} onChange={(e) => upd(i, { date: e.target.value })} className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3 py-2 text-[13px] text-[#191F28] outline-none [color-scheme:light]" />
            <div className="relative w-[104px] shrink-0">
              <select value={r.time} onChange={(e) => upd(i, { time: e.target.value })} className="w-full appearance-none rounded-lg bg-[#F5F6F8] py-2 pl-2.5 pr-7 text-[13px] text-[#191F28] outline-none [color-scheme:light]">
                <option value="">{t("시간", "Time", "时间", "Giờ", "時間", "Waktu")}</option>
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <input value={r.location} onChange={(e) => upd(i, { location: e.target.value })} placeholder={t("장소 · 예) 본사 3층 / 온라인", "Location · e.g. HQ 3F / Online", "地点 · 例）总部3层 / 线上", "Địa điểm · vd) Trụ sở tầng 3 / Online", "場所 · 例）本社3階 / オンライン", "Lokasi · mis) Kantor pusat lt.3 / Online")} className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3 py-2 text-[13px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]" />
            {rows.length > 1 ? (
              <button type="button" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label={t("시간 삭제", "Remove time", "删除时间", "Xóa giờ", "時間を削除", "Hapus waktu")} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]"><X className="h-4 w-4" /></button>
            ) : null}
          </div>
        </div>
      ))}
      {rows.length < max ? (
        <button type="button" onClick={() => setRows((rs) => [...rs, { ...EMPTY_SLOT_ROW }])} className="inline-flex w-fit items-center gap-1 text-[12.5px] font-bold text-[#0B46E8]"><Plus className="h-3.5 w-3.5" weight="bold" /> {t("시간 추가", "Add time", "添加时间", "Thêm giờ", "時間を追加", "Tambah waktu")}</button>
      ) : null}
    </div>
  );
}

export function PartnerApplicantDetailScreen({ applicantId }: { applicantId: string }) {
  const t = usePlatformT();
  const applicantLabel = usePartnerApplicantStatusLabel();
  const positionLabel = usePartnerPositionStatusLabel();
  const toast = useTalentPopup();
  const [app, setApp] = useState<PartnerApplicantDetail | null>(null);
  const [slots, setSlots] = useState<InterviewSlot[]>([]);
  const [messages, setMessages] = useState<PartnerApplicantMessage[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [updating, setUpdating] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [memo, setMemo] = useState("");
  const [savingMemo, setSavingMemo] = useState(false);
  const [pending, setPending] = useState<PartnerApplicantStatus | null>(null); // 변경 확인 대기 상태
  const [summary, setSummary] = useState<{ resumeBullets: string[]; coverBullets: string[] } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [position, setPosition] = useState<PartnerPosition | null>(null);

  function loadSlots(appId: string | null) {
    if (!appId) return;
    void getInterviewSlotsForApplication(appId).then(setSlots).catch(() => {});
  }
  function loadMessages(appId: string | null) {
    if (!appId) return;
    void getPartnerApplicantMessages(appId).then(setMessages).catch(() => {});
  }
  function load() {
    setStatus("loading");
    getMyPartnerApplicantById(applicantId)
      .then((d) => {
        setApp(d);
        setMemo(d.memo ?? "");
        setStatus("ready");
        loadSlots(d.applicationId);
        loadMessages(d.applicationId);
        // 지원 공고 정보(고용형태·근무지·상태) — 별도 로드.
        void getMyPartnerPositionById(d.positionId).then(setPosition).catch(() => setPosition(null));
        // LLM 문서 요약(불렛) — 별도 로드.
        setSummaryLoading(true);
        getPartnerApplicantDocumentSummary(applicantId)
          .then(setSummary)
          .catch(() => setSummary({ resumeBullets: [], coverBullets: [] }))
          .finally(() => setSummaryLoading(false));
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  // 상태 변경은 지원자에게 알림이 발송되므로 확인 팝업 후 실행한다.
  function requestStatus(next: PartnerApplicantStatus) {
    if (updating || !app || app.status === next) return;
    setPending(next);
  }
  // 상태 변경 + (선택) 부가 작업: 면접→시간 제안, 불합격→사유 메시지 전송.
  // 상태 변경과 부가 작업의 실패를 분리해 안내한다.
  async function confirmStatus(extra: { slots?: { startsAt: string; endsAt: string; location?: string }[]; reason?: string }) {
    const next = pending;
    if (updating || !app || !next) return;
    const appId = app.applicationId;
    const label = applicantLabel(next);
    setUpdating(true);

    // 1) 상태 변경
    let updated: PartnerApplicantDetail;
    try {
      updated = await updateMyPartnerApplicantState(applicantId, { status: next });
      setApp(updated);
    } catch {
      toast.error(t("상태 변경에 실패했어요.", "Couldn't change status", "状态变更失败", "Không thể đổi trạng thái", "ステータスを変更できませんでした", "Gagal mengubah status"));
      setUpdating(false);
      return;
    }

    // 2) 부가 작업(선택) — 여기서 실패해도 상태 변경은 유지된다.
    try {
      if (next === "INTERVIEW" && appId && extra.slots?.length) {
        await proposeInterviewSlots(appId, extra.slots);
        loadSlots(appId);
      }
      if (next === "REJECTED" && appId && extra.reason?.trim()) {
        await sendPartnerApplicantMessage(appId, extra.reason.trim());
        loadMessages(appId);
      }
      toast.success(t(`상태를 '${label}'로 바꿨어요`, `Status changed to '${label}'`, `状态已改为'${label}'`, `Đã đổi trạng thái thành '${label}'`, `ステータスを'${label}'に変更しました`, `Status diubah menjadi '${label}'`));
    } catch {
      toast.error(next === "INTERVIEW"
        ? t("상태는 변경됐지만 면접 시간 제안에 실패했어요.", "Status changed, but couldn't propose interview times", "状态已变更，但面试时间提议失败", "Đã đổi trạng thái, nhưng không thể đề xuất giờ phỏng vấn", "ステータスは変更しましたが、面接時間の提案に失敗しました", "Status diubah, tetapi gagal mengusulkan waktu wawancara")
        : t("상태는 변경됐지만 사유 전달에 실패했어요.", "Status changed, but couldn't send the reason", "状态已变更，但理由发送失败", "Đã đổi trạng thái, nhưng không thể gửi lý do", "ステータスは変更しましたが、理由の送信に失敗しました", "Status diubah, tetapi gagal mengirim alasan"));
    } finally {
      setPending(null);
      setUpdating(false);
    }
  }

  function saveMemo() {
    if (savingMemo || !app) return;
    setSavingMemo(true);
    updateMyPartnerApplicantState(applicantId, { memo: memo.trim() || null })
      .then((d) => {
        setApp(d);
        toast.success(t("메모를 저장했어요", "Memo saved", "备注已保存", "Đã lưu ghi chú", "メモを保存しました", "Catatan disimpan"));
      })
      .catch(() => toast.error(t("메모 저장에 실패했어요.", "Couldn't save memo", "备注保存失败", "Không thể lưu ghi chú", "メモを保存できませんでした", "Gagal menyimpan catatan")))
      .finally(() => setSavingMemo(false));
  }

  function send() {
    const trimmed = text.trim();
    const appId = app?.applicationId;
    if (!trimmed || sending || !appId) return;
    setSending(true);
    sendPartnerApplicantMessage(appId, trimmed)
      .then(() => {
        setText("");
        loadMessages(appId);
      })
      .catch(() => toast.error(t("메시지 전송에 실패했어요.", "Couldn't send message", "消息发送失败", "Không thể gửi tin nhắn", "メッセージを送信できませんでした", "Gagal mengirim pesan")))
      .finally(() => setSending(false));
  }

  const chat = messages.filter((m) => m.visibility === "CANDIDATE");
  const rejected = app?.status === "REJECTED" || app?.status === "WITHDRAWN";

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-4" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && app ? (
        <div className="flex flex-col gap-10">
          {/* 상단 전폭 — 프로필 + 단계 + 상태 변경 */}
          <section className="rounded-3xl bg-[#F5F8FF] p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">{app.name.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{app.name}</h1>
                {app.appliedAt ? <p className="mt-0.5 truncate text-[13.5px] text-[#8B95A1]">{new Date(app.appliedAt).toLocaleDateString("ko-KR")} {t("지원", "applied", "申请", "đã ứng tuyển", "応募", "melamar")}</p> : null}
              </div>
              {app.mockInterviewPracticed ? (
                <span className="hidden shrink-0 rounded-md bg-[#EDF1FD] px-2 py-1 text-[11px] font-bold text-[#0B46E8] sm:inline">🎤 {t("모의 면접 완료", "Mock interview done", "模拟面试完成", "Đã phỏng vấn thử", "模擬面接済み", "Wawancara simulasi selesai")}{app.mockInterviewScore != null ? t(` · ${app.mockInterviewScore}점`, ` · ${app.mockInterviewScore} pts`, ` · ${app.mockInterviewScore}分`, ` · ${app.mockInterviewScore} điểm`, ` · ${app.mockInterviewScore}点`, ` · ${app.mockInterviewScore} poin`) : ""}</span>
              ) : null}
            </div>

            {/* 지원 공고 */}
            <Link href={`${partnerRoutes.positions}/${app.positionId}`} className="mt-4 block rounded-xl bg-white px-3.5 py-3 transition hover:bg-[#EDF1FD]">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0 text-[#0B46E8]" weight="fill" />
                <span className="text-[11px] font-bold text-[#8B95A1]">{t("지원 공고", "Posting", "职位", "Tin tuyển dụng", "求人", "Lowongan")}</span>
                {position ? <span className={`rounded-md px-2.5 py-0.5 text-[10.5px] font-bold ${PARTNER_POSITION_STATUS[position.status].cls}`}>{positionLabel(position.status)}</span> : null}
                <CaretRight className="ml-auto h-4 w-4 shrink-0 text-[#C4CAD2]" />
              </div>
              <p className="mt-1 truncate text-[14px] font-bold text-[#191F28]">{app.positionTitle}</p>
              {position ? (
                <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">
                  {[employmentLabel(t, position.employmentType), position.workType, position.workLocation, position.hiringCount != null ? t(`채용 ${position.hiringCount}명`, `Hiring ${position.hiringCount}`, `招聘${position.hiringCount}人`, `Tuyển ${position.hiringCount}`, `採用${position.hiringCount}名`, `Rekrut ${position.hiringCount}`) : ""].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </Link>

            {/* 채용 단계 스테퍼 */}
            <div className="mt-5">
              {rejected ? (
                <div className={`rounded-xl px-3.5 py-2.5 text-[13px] font-bold ${PARTNER_APPLICANT_STATUS[app.status].cls}`}>
                  {applicantLabel(app.status)} {t("처리됨", "processed", "已处理", "đã xử lý", "処理済み", "diproses")}
                </div>
              ) : (
                <div className="flex items-center">
                  {STEPS.map((step, i) => {
                    const on = step.reach.includes(app.status);
                    return (
                      <div key={i} className="flex flex-1 items-center last:flex-none">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-black ${on ? "bg-[#0B46E8] text-white" : "bg-white text-[#B0B8C1] ring-1 ring-[#DCE3F0]"}`}>
                            {on ? <Check className="h-4 w-4" weight="bold" /> : i + 1}
                          </span>
                          <span className={`text-[11px] font-bold ${on ? "text-[#0B46E8]" : "text-[#B0B8C1]"}`}>{stepLabel(t, i)}</span>
                        </div>
                        {i < STEPS.length - 1 ? <span className={`mx-1 h-[2px] flex-1 rounded-full ${STEPS[i + 1].reach.includes(app.status) ? "bg-[#0B46E8]" : "bg-[#DCE3F0]"}`} /> : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 면접 확정 — 지원자가 슬롯을 선택하면 확정 시간을 크게 보여주고 캘린더 추가 제공 */}
            {(() => {
              const selected = slots.find((s) => s.status === "SELECTED");
              if (!selected) return null;
              return (
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl bg-[#E7F8EF] px-4 py-3.5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#0A9B59]"><CalendarCheck className="h-4 w-4" weight="fill" /> {t("면접 확정 — 지원자가 시간을 선택했어요", "Interview confirmed — the applicant picked a time", "面试已确定 — 申请者已选择时间", "Đã xác nhận phỏng vấn — ứng viên đã chọn giờ", "面接確定 — 応募者が時間を選びました", "Wawancara dikonfirmasi — pelamar memilih waktu")}</p>
                    <p className="mt-1 text-[13px] font-semibold text-[#191F28]">{fmtWhen(selected.startsAt)}</p>
                    {selected.location ? <p className="mt-0.5 text-[12px] text-[#8B95A1]">{selected.location}</p> : null}
                  </div>
                  <a
                    href={partnerGcalUrl(t, selected, app.name, app.positionTitle)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#0A9B59] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition hover:bg-[#F0FBF5]"
                  >
                    <CalendarPlus className="h-4 w-4" weight="bold" /> {t("캘린더에 추가", "Add to calendar", "添加到日历", "Thêm vào lịch", "カレンダーに追加", "Tambah ke kalender")}
                  </a>
                </div>
              );
            })()}

            {/* 상태 변경 — 지원자가 철회한 건은 더 이상 진행할 수 없어 숨긴다. */}
            {app.status === "WITHDRAWN" ? (
              <p className="mt-5 rounded-xl bg-[#F2F4F6] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#8B95A1]">{t("지원자가 철회한 지원이에요. 상태를 변경할 수 없어요.", "The applicant withdrew this application. You can't change the status.", "申请者已撤回此申请，无法更改状态。", "Ứng viên đã rút đơn này. Không thể đổi trạng thái.", "応募者が取り下げた応募です。ステータスを変更できません。", "Pelamar menarik lamaran ini. Status tidak dapat diubah.")}</p>
            ) : (
              <div className="mt-5">
                <p className="mb-2 text-[12px] font-bold text-[#8B95A1]">{t("상태 변경", "Change status", "更改状态", "Đổi trạng thái", "ステータス変更", "Ubah status")}</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ACTIONS.map((s) => {
                    const active = app.status === s;
                    return (
                      <button key={s} type="button" onClick={() => requestStatus(s)} disabled={updating || active} className={`rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition disabled:opacity-50 ${active ? "bg-[#0B46E8] text-white" : "bg-white text-[#4E5968] ring-1 ring-[#E4EAF2] hover:bg-[#EDF1FD]"}`}>
                        {applicantLabel(s)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* 2단 */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 lg:grid-cols-2">
            {/* 좌 — 정보/서류 */}
            <div className="flex flex-col gap-10">
              <section>
                <SectionHeader title={t("인적 사항", "Personal info", "个人信息", "Thông tin cá nhân", "個人情報", "Info pribadi")} />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <dl className="flex flex-col gap-2.5">
                    <Row label={t("이메일", "Email", "邮箱", "Email", "メール", "Email")} value={app.email ?? (app.contactUnlocked ? null : t("면접 확정 후 공개", "Shown after interview is confirmed", "面试确定后公开", "Hiển thị sau khi xác nhận phỏng vấn", "面接確定後に公開", "Ditampilkan setelah wawancara dikonfirmasi"))} />
                    <Row label={t("학교 · 전공", "School · Major", "学校 · 专业", "Trường · Chuyên ngành", "学校 · 専攻", "Sekolah · Jurusan")} value={[app.school, app.major].filter(Boolean).join(" · ")} />
                    <Row label={t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kewarganegaraan")} value={app.nationality} />
                    <Row label={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")} value={app.languages?.length ? app.languages.join(", ") : null} />
                    <Row label={t("거주지", "Residence", "居住地", "Nơi ở", "居住地", "Domisili")} value={app.residence} />
                    <Row label={t("입사 가능일", "Start date", "可入职日", "Ngày bắt đầu", "入社可能日", "Tanggal mulai")} value={app.availableStartDate} />
                  </dl>
                </div>
              </section>

              <section>
                <SectionHeader title={t("지원 서류", "Documents", "申请材料", "Hồ sơ", "応募書類", "Dokumen")} />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <div className="flex flex-col gap-4">
                    {app.resumeDoc || app.resumeShareSlug ? (
                      <DocItem
                        href={`${partnerRoutes.applicants}/${encodeURIComponent(applicantId)}/resume`}
                        emoji="📄"
                        title={t(`${app.name} 이력서`, `${app.name} Resume`, `${app.name} 简历`, `Sơ yếu lý lịch ${app.name}`, `${app.name} 履歴書`, `Resume ${app.name}`)}
                        sub={t("이력서 보기", "View resume", "查看简历", "Xem sơ yếu lý lịch", "履歴書を見る", "Lihat resume")}
                        bullets={summary?.resumeBullets ?? []}
                        loading={summaryLoading}
                      />
                    ) : null}
                    {app.coverDoc || app.coverLetterShareSlug ? (
                      <DocItem
                        href={`${partnerRoutes.applicants}/${encodeURIComponent(applicantId)}/cover`}
                        emoji="✍️"
                        title={t(`${app.name} 자기소개서`, `${app.name} Cover letter`, `${app.name} 求职信`, `Thư xin việc ${app.name}`, `${app.name} 志望動機書`, `Surat lamaran ${app.name}`)}
                        sub={t("자기소개서 보기", "View cover letter", "查看求职信", "Xem thư xin việc", "志望動機書を見る", "Lihat surat lamaran")}
                        bullets={summary?.coverBullets ?? []}
                        loading={summaryLoading}
                      />
                    ) : null}
                    {!app.resumeDoc && !app.resumeShareSlug && !app.coverDoc && !app.coverLetterShareSlug ? (
                      <p className="text-[13px] text-[#8B95A1]">{t("제출된 서류가 없어요.", "No documents submitted.", "没有提交的材料。", "Chưa có hồ sơ nào.", "提出された書類がありません。", "Belum ada dokumen.")}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* 모의 면접 결과 */}
              {app.mockInterview && app.mockInterview.answers.length ? (
                <section>
                  <SectionHeader
                    title={t("모의 면접 결과", "Mock interview results", "模拟面试结果", "Kết quả phỏng vấn thử", "模擬面接の結果", "Hasil wawancara simulasi")}
                    right={app.mockInterview.score != null ? <span className="rounded-md bg-[#EDF1FD] px-2 py-1 text-[11.5px] font-bold text-[#0B46E8]">{t(`최고 ${app.mockInterview.score}점`, `Best ${app.mockInterview.score}`, `最高${app.mockInterview.score}分`, `Cao nhất ${app.mockInterview.score}`, `最高${app.mockInterview.score}点`, `Terbaik ${app.mockInterview.score}`)}</span> : undefined}
                  />
                  <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                    <p className="mb-3 text-[12px] text-[#8B95A1]">{t(`지원자가 이 공고 모의 면접에 답한 내용이에요. (답변 ${app.mockInterview.answeredCount}개)`, `The applicant's answers to this posting's mock interview. (${app.mockInterview.answeredCount} answers)`, `申请者对该职位模拟面试的回答。（${app.mockInterview.answeredCount}个回答）`, `Câu trả lời của ứng viên cho phỏng vấn thử của tin này. (${app.mockInterview.answeredCount} câu trả lời)`, `この求人の模擬面接に応募者が答えた内容です。（回答${app.mockInterview.answeredCount}件）`, `Jawaban pelamar untuk wawancara simulasi lowongan ini. (${app.mockInterview.answeredCount} jawaban)`)}</p>
                    <div className="flex flex-col gap-3.5">
                      {app.mockInterview.answers.map((a, i) => (
                        <div key={i} className="rounded-xl bg-[#F8FAFB] p-3.5">
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 flex-1 break-keep text-[13px] font-bold text-[#191F28]">Q{i + 1}. {a.question}</p>
                            {a.score != null ? <span className="shrink-0 rounded-md bg-white px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{t(`${a.score}점`, `${a.score} pts`, `${a.score}分`, `${a.score} điểm`, `${a.score}点`, `${a.score} poin`)}</span> : null}
                          </div>
                          <p className="mt-1.5 whitespace-pre-wrap break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{a.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>

            {/* 우 — 메모/면접/메시지 */}
            <div className="flex flex-col gap-10">
              {/* 내부 메모 */}
              <section>
                <SectionHeader title={t("내부 메모", "Internal memo", "内部备注", "Ghi chú nội bộ", "内部メモ", "Catatan internal")} right={<span className="rounded-md bg-[#F2F4F6] px-2.5 py-0.5 text-[10.5px] font-bold text-[#8B95A1]">{t("지원자에게 안 보임", "Hidden from applicant", "申请者不可见", "Ẩn với ứng viên", "応募者に非表示", "Tak terlihat pelamar")}</span>} />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    rows={3}
                    placeholder={t("평가·다음 단계 등 팀 내부 메모를 남겨보세요.", "Leave a team memo — evaluation, next steps, etc.", "留下团队内部备注，如评价、下一步等。", "Để lại ghi chú nội bộ — đánh giá, bước tiếp theo, v.v.", "評価や次のステップなど、チーム内メモを残しましょう。", "Tulis catatan tim — penilaian, langkah berikutnya, dll.")}
                    className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                  />
                  <button type="button" onClick={saveMemo} disabled={savingMemo || memo === (app.memo ?? "")} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-[#F2F4F6] px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-40">
                    {savingMemo ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("메모 저장", "Save memo", "保存备注", "Lưu ghi chú", "メモを保存", "Simpan catatan")}
                  </button>
                </div>
              </section>

              {/* 면접 */}
              <section>
                <SectionHeader
                  title={t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")}
                  right={
                    app.applicationId ? (
                      <button type="button" onClick={() => setProposeOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                        <Plus className="h-3.5 w-3.5" weight="bold" /> {t("면접 시간 제안", "Propose times", "提议时间", "Đề xuất giờ", "面接時間を提案", "Usulkan waktu")}
                      </button>
                    ) : null
                  }
                />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  {!app.applicationId ? (
                    <p className="text-[13px] text-[#8B95A1]">{t("지원 건이 연결되지 않아 면접 제안을 사용할 수 없어요.", "No application is linked, so interview proposals aren't available.", "未关联申请，无法使用面试提议。", "Chưa liên kết đơn ứng tuyển nên không thể đề xuất phỏng vấn.", "応募が紐づいていないため、面接の提案は使えません。", "Belum ada lamaran terkait, jadi usulan wawancara tidak tersedia.")}</p>
                  ) : slots.length ? (
                    <ul className="flex flex-col gap-2">
                      {slots.map((s) => (
                        <li key={s.id} className="flex items-center justify-between rounded-xl bg-[#F5F6F8] px-3.5 py-2.5">
                          <span className="text-[13px] text-[#191F28]">{fmtWhen(s.startsAt)}{s.location ? ` · ${s.location}` : ""}</span>
                          <span className={`text-[11.5px] font-bold ${s.status === "SELECTED" ? "text-[#12B76A]" : s.status === "CANCELLED" ? "text-[#B0B8C1]" : "text-[#E8890C]"}`}>
                            {s.status === "SELECTED" ? t("확정", "Confirmed", "已确定", "Đã xác nhận", "確定", "Dikonfirmasi") : s.status === "CANCELLED" ? t("취소", "Cancelled", "已取消", "Đã hủy", "取消", "Dibatalkan") : t("대기", "Pending", "待定", "Chờ", "保留", "Menunggu")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[13px] text-[#8B95A1]">{t("제안한 면접 시간이 없어요. 시간을 제안하면 지원자가 선택해요.", "No interview times proposed yet. Propose times and the applicant will pick one.", "尚未提议面试时间。提议后申请者可选择。", "Chưa đề xuất giờ phỏng vấn nào. Hãy đề xuất để ứng viên chọn.", "提案した面接時間がありません。提案すると応募者が選びます。", "Belum ada waktu wawancara yang diusulkan. Usulkan lalu pelamar memilih.")}</p>
                  )}
                </div>
              </section>

              {/* 메시지 */}
              <section>
                <SectionHeader title={t("지원자와의 대화", "Chat with applicant", "与申请者的对话", "Trò chuyện với ứng viên", "応募者との会話", "Obrolan dengan pelamar")} />
                <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                  <div className="flex max-h-[380px] flex-col gap-2.5 overflow-y-auto">
                    {chat.length === 0 ? (
                      <p className="py-4 text-center text-[13px] text-[#B0B8C1]">{t("아직 주고받은 메시지가 없어요.", "No messages yet.", "还没有消息。", "Chưa có tin nhắn nào.", "まだメッセージがありません。", "Belum ada pesan.")}</p>
                    ) : (
                      chat.map((m) => {
                        const mine = m.authorRole !== "STUDENT";
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-[#0B46E8] text-white" : "border border-[#EEF1F5] bg-white text-[#191F28]"}`}>
                              <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">{m.content}</p>
                              <p className={`mt-1 text-[10.5px] ${mine ? "text-white/60" : "text-[#B0B8C1]"}`}>{formatRelativeTime(new Date(m.createdAt).getTime())}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  {app.applicationId ? (
                    <div className="mt-3 flex items-end gap-2">
                      <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            send();
                          }
                        }}
                        rows={1}
                        placeholder={t("지원자에게 메시지 보내기…", "Message the applicant…", "给申请者发消息…", "Nhắn cho ứng viên…", "応募者にメッセージ…", "Kirim pesan ke pelamar…")}
                        className="max-h-28 flex-1 resize-none rounded-2xl bg-[#F2F4F6] px-4 py-2.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#0B46E8]/30"
                      />
                      <button type="button" onClick={send} disabled={!text.trim() || sending} aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")} className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
                        <PaperPlaneTilt className="h-5 w-5" weight="fill" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-[13px] text-[#8B95A1]">{t("지원 건이 연결되지 않아 메시지를 보낼 수 없어요.", "No application is linked, so you can't send messages.", "未关联申请，无法发送消息。", "Chưa liên kết đơn ứng tuyển nên không thể gửi tin nhắn.", "応募が紐づいていないため、メッセージを送れません。", "Belum ada lamaran terkait, jadi pesan tidak bisa dikirim.")}</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      {proposeOpen && app?.applicationId ? (
        <ProposeModal
          applicationId={app.applicationId}
          onClose={() => setProposeOpen(false)}
          onDone={() => {
            setProposeOpen(false);
            loadSlots(app.applicationId);
          }}
        />
      ) : null}

      {pending && app ? (
        <ConfirmStatusModal
          name={app.name}
          next={pending}
          busy={updating}
          hasApplication={Boolean(app.applicationId)}
          onClose={() => (updating ? null : setPending(null))}
          onConfirm={confirmStatus}
        />
      ) : null}
    </PartnerAppShell>
  );
}

// 섹션 타이틀 — 카드 밖. 다른 섹션 페이지와 동일한 스타일(18px font-black).
function SectionHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex min-h-[30px] items-center justify-between gap-3">
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      {right}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-[80px] shrink-0 text-[12.5px] text-[#8B95A1]">{label}</dt>
      <dd className="min-w-0 flex-1 break-keep text-[13.5px] text-[#191F28]">{value || "-"}</dd>
    </div>
  );
}

// 서류 열람 링크(이력서·자기소개서). internal=앱 내 이동(이력서 프리뷰), 아니면 공유 페이지 새 탭.
function DocLink({ href, emoji, title, sub, internal }: { href: string; emoji: string; title: string; sub: string; internal?: boolean }) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[16px]" aria-hidden>{emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-bold text-[#191F28]">{title}</span>
        <span className="block text-[11.5px] text-[#8B95A1]">{sub}</span>
      </span>
      {internal ? <CaretRight className="h-4 w-4 shrink-0 text-[#0B46E8]" /> : <ArrowSquareOut className="h-4 w-4 shrink-0 text-[#0B46E8]" />}
    </>
  );
  const cls = "flex items-center gap-2 rounded-xl border border-[#E4EAF2] bg-[#F8FAFF] px-3.5 py-3 transition hover:border-[#0B46E8]/40";
  return internal ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{inner}</a>
  );
}

// 서류 항목 — 열람 링크(DocLink) + LLM 불렛 요약.
function DocItem({ href, emoji, title, sub, bullets, loading }: { href: string; emoji: string; title: string; sub: string; bullets: string[]; loading: boolean }) {
  const t = usePlatformT();
  return (
    <div>
      <DocLink href={href} emoji={emoji} title={title} sub={sub} internal />
      <div className="mt-2 rounded-xl bg-[#F8FAFB] px-3.5 py-2.5">
        <p className="flex items-center gap-1 text-[11px] font-bold text-[#8B95A1]"><Sparkle className="h-3 w-3 text-[#0B46E8]" weight="fill" /> {t("AI 요약", "AI summary", "AI 摘要", "Tóm tắt AI", "AI 要約", "Ringkasan AI")}</p>
        {loading ? (
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">{t("요약 생성 중…", "Generating summary…", "生成摘要中…", "Đang tạo tóm tắt…", "要約を生成中…", "Membuat ringkasan…")}</p>
        ) : bullets.length ? (
          <ul className="mt-1.5 flex flex-col gap-1">
            {bullets.map((b, i) => (
              <li key={i} className="flex gap-1.5 text-[12.5px] leading-relaxed text-[#4E5968]">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                <span className="min-w-0 flex-1 break-keep">{b}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-[12.5px] text-[#B0B8C1]">{t("요약할 내용이 없어요.", "Nothing to summarize.", "没有可摘要的内容。", "Không có nội dung để tóm tắt.", "要約する内容がありません。", "Tidak ada yang bisa diringkas.")}</p>
        )}
      </div>
    </div>
  );
}

// 상태 변경 확인 — 지원자에게 알림이 발송되므로 동의 후 진행.
// 면접: 면접 시간 제안(선택) / 불합격: 불합격 사유 지원자 전달(선택) 을 같은 팝업에서 처리.
function ConfirmStatusModal({
  name,
  next,
  busy,
  hasApplication,
  onClose,
  onConfirm
}: {
  name: string;
  next: PartnerApplicantStatus;
  busy: boolean;
  hasApplication: boolean;
  onClose: () => void;
  onConfirm: (extra: { slots?: { startsAt: string; endsAt: string; location?: string }[]; reason?: string }) => void;
}) {
  const t = usePlatformT();
  const applicantLabel = usePartnerApplicantStatusLabel();
  useLockBodyScroll();
  const label = applicantLabel(next);
  const isInterview = next === "INTERVIEW";
  const isReject = next === "REJECTED";
  const [rows, setRows] = useState<SlotRow[]>([{ ...EMPTY_SLOT_ROW }]);
  const [reason, setReason] = useState("");

  function confirm() {
    const slots = isInterview ? slotsFromRows(rows) : undefined;
    onConfirm({ slots, reason: isReject ? reason : undefined });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[88vh] w-full max-w-[440px] overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6">
          <p className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`상태를 ‘${label}’로 변경할까요?`, `Change status to '${label}'?`, `将状态改为'${label}'吗？`, `Đổi trạng thái thành '${label}'?`, `ステータスを'${label}'に変更しますか？`, `Ubah status menjadi '${label}'?`)}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[#4E5968]">
            <span className="font-bold text-[#191F28]">{name}</span>{t(" 님에게 상태 변경 ", " will receive a status change ", " 将收到状态变更", " sẽ nhận được ", " 様に状態変更の", " akan menerima ")}<span className="font-bold text-[#0B46E8]">{t("알림이 발송", "notification", "通知", "thông báo thay đổi trạng thái", "通知", "notifikasi perubahan status")}</span>{t("됩니다.", ".", "。", ".", "が送信されます。", ".")}
          </p>

          {/* 면접: 시간 제안(선택) */}
          {isInterview && hasApplication ? (
            <div className="mt-4 rounded-2xl bg-[#F5F8FF] p-4">
              <p className="text-[13px] font-bold text-[#191F28]">{t("면접 시간 제안", "Propose interview times", "提议面试时间", "Đề xuất giờ phỏng vấn", "面接時間を提案", "Usulkan waktu wawancara")} <span className="font-normal text-[#8B95A1]">{t("(선택)", "(optional)", "（可选）", "(tùy chọn)", "（任意）", "(opsional)")}</span></p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("시간을 넣으면 지원자가 그중 편한 시간을 선택해요.", "Add times and the applicant will pick one that works.", "填入时间后，申请者可从中选择方便的时间。", "Thêm giờ để ứng viên chọn giờ thuận tiện.", "時間を入れると、応募者が都合の良い時間を選びます。", "Tambahkan waktu, pelamar akan memilih yang cocok.")}</p>
              <div className="mt-3">
                <InterviewSlotRows rows={rows} setRows={setRows} />
              </div>
            </div>
          ) : null}

          {/* 불합격: 사유(선택, 지원자에게 메시지로 전달) */}
          {isReject && hasApplication ? (
            <div className="mt-4 rounded-2xl bg-[#FDF2F3] p-4">
              <p className="text-[13px] font-bold text-[#191F28]">{t("불합격 사유", "Rejection reason", "未录用理由", "Lý do không đạt", "不合格の理由", "Alasan penolakan")} <span className="font-normal text-[#8B95A1]">{t("(선택)", "(optional)", "（可选）", "(tùy chọn)", "（任意）", "(opsional)")}</span></p>
              <p className="mt-0.5 text-[12px] text-[#8B95A1]">{t("입력하면 지원자에게 메시지로 전달돼요.", "If entered, it's sent to the applicant as a message.", "填写后将以消息发送给申请者。", "Nếu nhập, sẽ gửi cho ứng viên dưới dạng tin nhắn.", "入力すると応募者にメッセージで送られます。", "Jika diisi, dikirim ke pelamar sebagai pesan.")}</p>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder={t("예) 이번 포지션의 요구 경력과 차이가 있어 아쉽게 전달드립니다.", "e.g. Unfortunately your experience differs from what this position requires.", "例）很遗憾，您的经历与该职位的要求存在差异。", "vd) Rất tiếc, kinh nghiệm của bạn chưa phù hợp với vị trí này.", "例）今回のポジションの求める経験と差があり、残念ながらお見送りとなりました。", "mis) Maaf, pengalaman Anda berbeda dari yang dibutuhkan posisi ini.")} className="mt-2 w-full resize-none rounded-xl border border-[#F3D0D4] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#C9AEB1] focus:ring-2 focus:ring-[#F04452]/20" />
            </div>
          ) : null}
        </div>

        <div className="mt-6 flex gap-2 px-6 pb-6">
          <button type="button" onClick={onClose} disabled={busy} className="h-[50px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-50">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
          <button type="button" onClick={confirm} disabled={busy} className={`h-[50px] flex-1 rounded-2xl text-[14.5px] font-bold text-white transition disabled:opacity-50 ${isReject ? "bg-[#F04452] hover:bg-[#DA3B48]" : "bg-[#0B46E8] hover:bg-[#0A3ECB]"}`}>{busy ? t("변경 중…", "Changing…", "变更中…", "Đang đổi…", "変更中…", "Mengubah…") : t(`‘${label}’로 변경`, `Change to '${label}'`, `改为'${label}'`, `Đổi thành '${label}'`, `'${label}'に変更`, `Ubah ke '${label}'`)}</button>
        </div>
      </div>
    </div>
  );
}

// 면접 시간 제안 — 최대 3개 슬롯(시작 시각 + 장소).
function ProposeModal({ applicationId, onClose, onDone }: { applicationId: string; onClose: () => void; onDone: () => void }) {
  const t = usePlatformT();
  const toast = useTalentPopup();
  useLockBodyScroll();
  const [rows, setRows] = useState<SlotRow[]>([{ ...EMPTY_SLOT_ROW }]);
  const [saving, setSaving] = useState(false);

  function submit() {
    const slots = slotsFromRows(rows);
    if (slots.length === 0 || saving) return;
    setSaving(true);
    proposeInterviewSlots(applicationId, slots)
      .then(() => {
        toast.success(t("면접 시간을 제안했어요", "Interview times proposed", "已提议面试时间", "Đã đề xuất giờ phỏng vấn", "面接時間を提案しました", "Waktu wawancara diusulkan"));
        onDone();
      })
      .catch(() => toast.error(t("제안에 실패했어요.", "Couldn't propose", "提议失败", "Không thể đề xuất", "提案できませんでした", "Gagal mengusulkan")))
      .finally(() => setSaving(false));
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-[440px] overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-5 py-4">
          <p className="text-[15px] font-bold text-[#191F28]">{t("면접 시간 제안", "Propose interview times", "提议面试时间", "Đề xuất giờ phỏng vấn", "面接時間を提案", "Usulkan waktu wawancara")}</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-col gap-3 bg-[#F5F8FF] px-5 py-4">
          <p className="text-[12.5px] text-[#8B95A1]">{t("지원자가 그중 편한 시간을 선택합니다. (최대 3개)", "The applicant picks a time that works. (up to 3)", "申请者从中选择方便的时间。（最多3个）", "Ứng viên chọn giờ thuận tiện. (tối đa 3)", "応募者が都合の良い時間を選びます。（最大3件）", "Pelamar memilih waktu yang cocok. (maks. 3)")}</p>
          <InterviewSlotRows rows={rows} setRows={setRows} />
        </div>
        <div className="px-5 pb-5">
          <button type="button" onClick={submit} disabled={saving || slotsFromRows(rows).length === 0} className="inline-flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
            {saving ? t("제안 중…", "Proposing…", "提议中…", "Đang đề xuất…", "提案中…", "Mengusulkan…") : t("면접 시간 제안하기", "Propose interview times", "提议面试时间", "Đề xuất giờ phỏng vấn", "面接時間を提案する", "Usulkan waktu wawancara")}
          </button>
        </div>
      </div>
    </div>
  );
}

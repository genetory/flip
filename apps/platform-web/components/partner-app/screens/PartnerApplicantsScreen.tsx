"use client";

// 파트너 지원자 — 실서버 지원자 목록. 요약 + 검색 + 정렬 + 상태 탭 + 풍부한 카드.
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlass, X, Briefcase, CaretDown } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TListSkeleton, TError } from "../../talent/ui/primitives";
import { ProposeCandidateModal } from "../ProposeCandidateModal";
import { PartnerEmptyCard } from "../ui/cards";
import { PartnerApplicantCard, PartnerParticipantCard } from "../ListCards";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { PARTNER_APPLICANT_STATUS, usePartnerApplicantStatusLabel } from "../../../lib/partner/labels";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { getMyPartnerApplicants, getOrgMockInterviewParticipants, updateMyPartnerApplicantState, sendPartnerApplicantMessage, type PartnerApplicantListItem, type PartnerApplicantStatus, type OrgMockInterviewParticipant } from "../../../lib/member-profile-client";

type Tab = "all" | PartnerApplicantStatus | "mock";
type Sort = "latest" | "recommended";

const TABS: { key: Tab; match: (s: PartnerApplicantStatus) => boolean }[] = [
  { key: "all", match: () => true },
  { key: "APPLIED", match: (s) => s === "APPLIED" },
  { key: "REVIEWING", match: (s) => s === "REVIEWING" },
  { key: "INTERVIEW", match: (s) => s === "INTERVIEW" },
  { key: "ACCEPTED", match: (s) => s === "ACCEPTED" || s === "OFFERED" },
  { key: "REJECTED", match: (s) => s === "REJECTED" }
];

function tabLabel(t: PlatformT, key: Tab): string {
  switch (key) {
    case "all":
      return t("전체", "All", "全部", "Tất cả", "すべて", "Semua");
    case "APPLIED":
      return t("신규", "New", "新申请", "Mới", "新規", "Baru");
    case "REVIEWING":
      return t("검토 중", "Reviewing", "审核中", "Đang xem", "選考中", "Ditinjau");
    case "INTERVIEW":
      return t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara");
    case "ACCEPTED":
      return t("합격", "Passed", "已录用", "Đạt", "合格", "Lolos");
    case "REJECTED":
      return t("불합격", "Rejected", "未录用", "Không đạt", "不合格", "Ditolak");
    default:
      return "";
  }
}

const REC_ORDER: Record<PartnerApplicantListItem["recommendation"], number> = { HIGH: 0, NORMAL: 1, CHECK: 2 };

export function PartnerApplicantsScreen() {
  const t = usePlatformT();
  const searchParams = useSearchParams();
  const toast = useTalentPopup();
  const initTab = searchParams.get("tab");
  const [items, setItems] = useState<PartnerApplicantListItem[] | null>(null);
  const [participants, setParticipants] = useState<OrgMockInterviewParticipant[]>([]);
  const [proposeTarget, setProposeTarget] = useState<OrgMockInterviewParticipant | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PartnerApplicantListItem | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // 지원자 비교 — 선택 모드 + 최대 3명.
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  // URL(?tab=) 로 진입 시 해당 탭 선택.
  const [tab, setTab] = useState<Tab>(initTab === "mock" || TABS.some((t) => t.key === initTab) ? (initTab as Tab) : "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");
  // 공고별 보기 — URL(?position=) 로 진입 시 초기값, 이후 드롭다운으로 변경.
  const [posFilter, setPosFilter] = useState<string | null>(searchParams.get("position"));

  function load() {
    setStatus("loading");
    getMyPartnerApplicants()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    void getOrgMockInterviewParticipants().then(setParticipants).catch(() => setParticipants([]));
  }
  useEffect(() => {
    load();
  }, []);

  // 카드에서 바로 상태 변경. 불합격은 사유·안내 메시지 모달을 먼저 띄운다.
  function setApplicantStatus(id: string, next: PartnerApplicantStatus) {
    if (next === "REJECTED") {
      const target = items?.find((a) => a.id === id) ?? null;
      if (target) setRejectTarget(target);
      return;
    }
    const prev = items?.find((a) => a.id === id)?.status;
    setItems((list) => (list ? list.map((a) => (a.id === id ? { ...a, status: next } : a)) : list));
    updateMyPartnerApplicantState(id, { status: next })
      .then(() => toast.success(next === "REVIEWING" ? t("검토를 시작했어요", "Started reviewing", "已开始审核", "Đã bắt đầu xem xét", "審査を開始しました", "Mulai ditinjau") : t("상태를 변경했어요", "Status updated", "状态已更新", "Đã đổi trạng thái", "ステータスを変更しました", "Status diperbarui")))
      .catch(() => {
        toast.error(t("상태 변경에 실패했어요", "Couldn't update status", "状态更新失败", "Không đổi được trạng thái", "ステータスを変更できませんでした", "Gagal memperbarui status"));
        if (prev) setItems((list) => (list ? list.map((a) => (a.id === id ? { ...a, status: prev } : a)) : list));
      });
  }

  // 불합격 확정 — 상태 변경 + (선택) 지원자 안내 메시지 발송.
  function confirmReject(target: PartnerApplicantListItem, message: string) {
    setRejectTarget(null);
    const prev = target.status;
    setItems((list) => (list ? list.map((a) => (a.id === target.id ? { ...a, status: "REJECTED" as PartnerApplicantStatus } : a)) : list));
    updateMyPartnerApplicantState(target.id, { status: "REJECTED" })
      .then(() => {
        toast.success(t("불합격 처리했어요", "Marked as rejected", "已标记为未录用", "Đã đánh dấu không đạt", "不合格にしました", "Ditandai ditolak"));
        const msg = message.trim();
        if (msg && target.applicationId) void sendPartnerApplicantMessage(target.applicationId, msg).catch(() => {});
      })
      .catch(() => {
        toast.error(t("상태 변경에 실패했어요", "Couldn't update status", "状态更新失败", "Không đổi được trạng thái", "ステータスを変更できませんでした", "Gagal memperbarui status"));
        setItems((list) => (list ? list.map((a) => (a.id === target.id ? { ...a, status: prev } : a)) : list));
      });
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.error(t("최대 3명까지 비교할 수 있어요", "You can compare up to 3", "最多可比较3人", "So sánh tối đa 3 người", "最大3名まで比較できます", "Bandingkan maksimal 3"));
        return prev;
      }
      return [...prev, id];
    });
  }
  function exitCompare() {
    setCompareMode(false);
    setCompareIds([]);
    setCompareOpen(false);
  }

  const all = useMemo(() => items ?? [], [items]);
  // 공고별 필터가 있으면 그 공고 지원자로 범위를 좁힌다.
  const scoped = useMemo(() => (posFilter ? all.filter((a) => a.positionId === posFilter) : all), [all, posFilter]);

  // 공고별 보기 옵션 — 지원자가 있는 공고 목록(지원자 많은 순).
  const positionOptions = useMemo(() => {
    const m = new Map<string, { id: string; title: string; count: number }>();
    for (const a of all) {
      const cur = m.get(a.positionId);
      if (cur) cur.count += 1;
      else m.set(a.positionId, { id: a.positionId, title: a.positionTitle, count: 1 });
    }
    return [...m.values()].sort((x, y) => y.count - x.count);
  }, [all]);

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.key] = scoped.filter((x) => t.match(x.status)).length;
    return c;
  }, [scoped]);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const q = query.trim().toLowerCase();

  const list = useMemo(() => {
    const filtered = scoped
      .filter((a) => active.match(a.status))
      .filter((a) => {
        if (!q) return true;
        return [a.name, a.positionTitle, a.school, a.major, a.nationality].some((v) => (v ?? "").toLowerCase().includes(q));
      });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "recommended") {
        const r = REC_ORDER[a.recommendation] - REC_ORDER[b.recommendation];
        if (r !== 0) return r;
      }
      return (b.appliedAt ?? "").localeCompare(a.appliedAt ?? "");
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, tab, q, sort]);

  // 모의 면접 참여자 공고별 보기 옵션 — 참여자가 있는 공고(참여 많은 순).
  const mockPositionOptions = useMemo(() => {
    const m = new Map<string, { id: string; title: string; count: number }>();
    for (const p of participants) {
      const cur = m.get(p.positionId);
      if (cur) cur.count += 1;
      else m.set(p.positionId, { id: p.positionId, title: p.positionTitle, count: 1 });
    }
    return [...m.values()].sort((x, y) => y.count - x.count);
  }, [participants]);

  // 모의 면접 참여자 — 공고 필터 + 검색어(이름·공고·국적).
  const mockList = useMemo(() => {
    let base = posFilter ? participants.filter((m) => m.positionId === posFilter) : participants;
    if (q) base = base.filter((m) => [m.name, m.positionTitle, m.nationality].some((v) => (v ?? "").toLowerCase().includes(q)));
    return base;
  }, [participants, posFilter, q]);

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("지원자 관리", "Applicants", "申请者管理", "Quản lý ứng viên", "応募者管理", "Kelola pelamar")}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("우리 공고에 지원한 인재를 확인하고 관리해요.", "Review and manage talent who applied to your postings.", "查看并管理申请我方职位的人才。", "Xem và quản lý nhân tài đã ứng tuyển vào tin của bạn.", "自社の求人に応募した人材を確認・管理します。", "Tinjau dan kelola talenta yang melamar lowongan Anda.")}</p>
        </div>

        {status === "loading" ? <TListSkeleton /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            {/* 검색 */}
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#B0B8C1]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("이름·공고·학교·전공·국적 검색", "Search name, posting, school, major, nationality", "搜索姓名·职位·学校·专业·国籍", "Tìm tên, tin, trường, ngành, quốc tịch", "名前・求人・学校・専攻・国籍で検索", "Cari nama, lowongan, sekolah, jurusan, kebangsaan")}
                className="w-full rounded-2xl border border-[#EEF1F5] bg-white py-3 pl-11 pr-10 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label={t("검색어 지우기", "Clear search", "清除搜索", "Xóa tìm kiếm", "検索をクリア", "Hapus pencarian")} className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#B0B8C1] transition hover:bg-[#F2F4F6]">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* 공고별 보기 — 지원자/모의 면접 탭에 맞는 옵션 */}
            {(() => {
              const opts = tab === "mock" ? mockPositionOptions : positionOptions;
              if (opts.length <= 1) return null;
              return (
                <div className="relative">
                  <Briefcase className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#0B46E8]" weight="fill" />
                  <select
                    value={posFilter ?? ""}
                    onChange={(e) => setPosFilter(e.target.value || null)}
                    className="h-[46px] w-full appearance-none truncate rounded-2xl border border-[#EEF1F5] bg-white pl-11 pr-10 text-[14px] font-bold text-[#4E5968] outline-none [color-scheme:light] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                  >
                    <option value="">{tab === "mock" ? t("전체 공고 참여자", "All posting participants", "全部职位参与者", "Tất cả người tham gia", "全求人の参加者", "Semua peserta lowongan") : t("전체 공고 지원자", "All posting applicants", "全部职位申请者", "Tất cả ứng viên", "全求人の応募者", "Semua pelamar lowongan")}</option>
                    {opts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} · {t(`${p.count}명`, `${p.count}`, `${p.count}人`, `${p.count} người`, `${p.count}名`, `${p.count} orang`)}</option>
                    ))}
                  </select>
                  <CaretDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
                </div>
              );
            })()}

            {/* 상태 탭 + 모의 면접 참여자 탭 */}
            <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((tb) => {
                const on = tab === tb.key;
                return (
                  <button
                    key={tb.key}
                    type="button"
                    onClick={() => setTab(tb.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${on ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                  >
                    {tabLabel(t, tb.key)} ({counts[tb.key]})
                    {on ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setTab("mock")}
                aria-current={tab === "mock" ? "page" : undefined}
                className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${tab === "mock" ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
              >
                🎤 {t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} ({participants.length})
                {tab === "mock" ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
              </button>
            </div>

            {/* 정렬 + 비교 (지원자 탭에서만) */}
            {tab !== "mock" ? (
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => (compareMode ? exitCompare() : setCompareMode(true))}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${compareMode ? "bg-[#EDF1FD] text-[#0B46E8]" : "bg-[#F2F4F6] text-[#8B95A1] hover:text-[#4E5968]"}`}
                >
                  {compareMode ? t("비교 취소", "Cancel", "取消比较", "Hủy so sánh", "比較を取消", "Batal") : t("⚖️ 비교", "⚖️ Compare", "⚖️ 比较", "⚖️ So sánh", "⚖️ 比較", "⚖️ Banding")}
                </button>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#F2F4F6] p-0.5">
                  {([["latest", t("최신순", "Latest", "最新", "Mới nhất", "最新順", "Terbaru")], ["recommended", t("추천순", "Recommended", "推荐", "Đề xuất", "推薦順", "Rekomendasi")]] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSort(key)}
                      className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${sort === key ? "bg-white text-[#191F28] shadow-[0_1px_4px_rgba(11,18,39,0.08)]" : "text-[#8B95A1]"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 리스트 */}
            {tab === "mock" ? (
              <>
                <p className="-mt-1 break-keep text-[13px] text-[#8B95A1]">{t("지원하지 않았어도 우리 공고 모의 면접을 풀어본 인재예요. 제안을 보내 먼저 연결할 수 있어요.", "Talent who took your posting's mock interview even without applying. Send a proposal to connect first.", "即使未申请，也做过我方职位模拟面试的人才。可先发送提案建立联系。", "Nhân tài đã làm phỏng vấn thử của tin dù chưa ứng tuyển. Gửi đề xuất để kết nối trước.", "応募していなくても自社求人の模擬面接を受けた人材です。提案を送って先に繋がれます。", "Talenta yang mengikuti wawancara simulasi lowongan Anda meski belum melamar. Kirim proposal untuk terhubung lebih dulu.")}</p>
                {mockList.length === 0 ? (
                  <PartnerEmptyCard emoji="🎤" title={q ? t("검색 결과가 없어요", "No results found", "没有搜索结果", "Không có kết quả", "検索結果がありません", "Tidak ada hasil") : t("아직 모의 면접 참여자가 없어요", "No mock interview participants yet", "还没有模拟面试参与者", "Chưa có người tham gia phỏng vấn thử", "まだ模擬面接の参加者がいません", "Belum ada peserta wawancara simulasi")} desc={q ? t("다른 검색어로 다시 시도해보세요.", "Try a different search term.", "请尝试其他搜索词。", "Thử từ khóa khác.", "別のキーワードで試してください。", "Coba kata kunci lain.") : t("공고에 모의 면접을 등록하면 참여자가 모여요.", "Add a mock interview to your posting to gather participants.", "为职位添加模拟面试即可聚集参与者。", "Thêm phỏng vấn thử vào tin để thu hút người tham gia.", "求人に模擬面接を登録すると参加者が集まります。", "Tambahkan wawancara simulasi ke lowongan untuk menarik peserta.")} />
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {mockList.map((m) => (
                      <PartnerParticipantCard key={`${m.userId}:${m.positionId}`} m={m} onPropose={() => setProposeTarget(m)} />
                    ))}
                  </div>
                )}
              </>
            ) : list.length === 0 ? (
              <PartnerEmptyCard emoji="🧑‍💼" title={q ? t("검색 결과가 없어요", "No results found", "没有搜索结果", "Không có kết quả", "検索結果がありません", "Tidak ada hasil") : t("해당 상태의 지원자가 없어요", "No applicants in this status", "没有该状态的申请者", "Không có ứng viên ở trạng thái này", "この状態の応募者がいません", "Tidak ada pelamar di status ini")} desc={q ? t("다른 검색어로 다시 시도해보세요.", "Try a different search term.", "请尝试其他搜索词。", "Thử từ khóa khác.", "別のキーワードで試してください。", "Coba kata kunci lain.") : undefined} />
            ) : (
              <div className={`flex flex-col gap-2.5 ${compareMode && compareIds.length ? "pb-20" : ""}`}>
                {list.map((a) => (
                  <PartnerApplicantCard
                    key={a.id}
                    a={a}
                    onSetStatus={compareMode ? undefined : setApplicantStatus}
                    selectable={compareMode}
                    selected={compareIds.includes(a.id)}
                    onToggleSelect={() => toggleCompare(a.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>

      {proposeTarget ? (
        <ProposeCandidateModal
          positionId={proposeTarget.positionId}
          userId={proposeTarget.userId}
          name={proposeTarget.name ?? t("이름 비공개", "Name hidden", "姓名保密", "Ẩn tên", "名前非公開", "Nama disembunyikan")}
          onClose={() => setProposeTarget(null)}
          onDone={() => {
            setParticipants((prev) => prev.map((p) => (p.userId === proposeTarget.userId ? { ...p, connectionStatus: "PENDING" } : p)));
            setProposeTarget(null);
          }}
        />
      ) : null}

      {rejectTarget ? (
        <RejectModal target={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={confirmReject} />
      ) : null}

      {compareMode && compareIds.length > 0 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#EEF1F5] bg-white/95 p-3 backdrop-blur" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}>
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-2">
            <p className="text-[13px] font-bold text-[#191F28]">{t(`${compareIds.length}명 선택`, `${compareIds.length} selected`, `已选 ${compareIds.length}`, `Đã chọn ${compareIds.length}`, `${compareIds.length}名選択`, `${compareIds.length} dipilih`)}{compareIds.length < 2 ? t(" · 2명 이상 선택", " · Select 2+", " · 请选2人以上", " · Chọn từ 2 người", " · 2名以上選択", " · Pilih 2+") : ""}</p>
            <button type="button" onClick={exitCompare} className="ml-auto rounded-xl bg-[#F2F4F6] px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
            <button type="button" onClick={() => setCompareOpen(true)} disabled={compareIds.length < 2} className="rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">{t("비교하기", "Compare", "比较", "So sánh", "比較する", "Bandingkan")}</button>
          </div>
        </div>
      ) : null}

      {compareOpen ? <CompareModal applicants={(items ?? []).filter((a) => compareIds.includes(a.id))} onClose={() => setCompareOpen(false)} /> : null}
    </PartnerAppShell>
  );
}

// 지원자 비교 — 선택한 2~3명을 나란히 비교(표).
function CompareModal({ applicants, onClose }: { applicants: PartnerApplicantListItem[]; onClose: () => void }) {
  const t = usePlatformT();
  const applicantLabel = usePartnerApplicantStatusLabel();
  useLockBodyScroll();
  const rec: Record<PartnerApplicantListItem["recommendation"], string> = { HIGH: t("적극 추천", "Highly recommended", "强烈推荐", "Rất khuyến nghị", "強く推薦", "Sangat direkomendasikan"), NORMAL: t("보통", "Normal", "一般", "Bình thường", "普通", "Biasa"), CHECK: t("확인 필요", "Needs review", "需确认", "Cần kiểm tra", "要確認", "Perlu dicek") };
  const rows: { label: string; get: (a: PartnerApplicantListItem) => string }[] = [
    { label: t("상태", "Status", "状态", "Trạng thái", "ステータス", "Status"), get: (a) => (PARTNER_APPLICANT_STATUS[a.status] ? applicantLabel(a.status) : a.status) },
    { label: t("공고", "Posting", "职位", "Tin tuyển dụng", "求人", "Lowongan"), get: (a) => a.positionTitle },
    { label: t("학교·전공", "School·Major", "学校·专业", "Trường·Ngành", "学校・専攻", "Sekolah·Jurusan"), get: (a) => [a.school, a.major].filter(Boolean).join(" · ") || "-" },
    { label: t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kebangsaan"), get: (a) => a.nationality ?? "-" },
    { label: t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa"), get: (a) => (a.languages?.length ? a.languages.join(", ") : "-") },
    { label: t("추천", "Recommend", "推荐", "Đề xuất", "推薦", "Rekomendasi"), get: (a) => rec[a.recommendation] },
    { label: t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi"), get: (a) => (a.mockInterviewPracticed ? (a.mockInterviewScore != null ? t(`${a.mockInterviewScore}점`, `${a.mockInterviewScore} pts`, `${a.mockInterviewScore}分`, `${a.mockInterviewScore} điểm`, `${a.mockInterviewScore}点`, `${a.mockInterviewScore} poin`) : t("응시", "Taken", "已参加", "Đã làm", "受験", "Ikut")) : "-") },
    { label: t("지원일", "Applied date", "申请日期", "Ngày ứng tuyển", "応募日", "Tanggal melamar"), get: (a) => (a.appliedAt ? new Date(a.appliedAt).toLocaleDateString("ko-KR") : "-") }
  ];
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <p className="text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">{t("지원자 비교", "Compare applicants", "申请者比较", "So sánh ứng viên", "応募者比較", "Bandingkan pelamar")} ({applicants.length})</p>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white p-2" />
                {applicants.map((a) => <th key={a.id} className="min-w-[110px] p-2 text-[13px] font-black text-[#191F28]">{a.name ?? t("이름 비공개", "Name hidden", "姓名保密", "Ẩn tên", "名前非公開", "Nama disembunyikan")}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-[#F2F4F6]">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white p-2 align-top text-[11.5px] font-bold text-[#8B95A1]">{r.label}</td>
                  {applicants.map((a) => <td key={a.id} className="p-2 align-top text-[12.5px] leading-relaxed text-[#4E5968]">{r.get(a)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function rejectTemplates(t: PlatformT): { label: string; text: string }[] {
  return [
    {
      label: t("정중한 마무리", "Courteous close", "礼貌收尾", "Kết thúc lịch sự", "丁寧な結び", "Penutup sopan"),
      text: t(
        "소중한 시간 내어 지원해 주셔서 진심으로 감사합니다. 아쉽게도 이번 채용에서는 함께하지 못하게 되었습니다. 지원자님의 앞날을 진심으로 응원합니다.",
        "Thank you sincerely for taking the time to apply. Unfortunately, we won't be moving forward together this time. We truly wish you all the best in your journey.",
        "衷心感谢您抽出宝贵时间应聘。很遗憾这次未能与您携手，真诚祝愿您前程似锦。",
        "Chân thành cảm ơn bạn đã dành thời gian ứng tuyển. Rất tiếc lần này chúng tôi chưa thể đồng hành cùng bạn. Chúc bạn thành công trên chặng đường phía trước.",
        "貴重なお時間を割いてご応募いただき誠にありがとうございます。残念ながら今回はご一緒できませんでした。今後のご活躍を心よりお祈りいたします。",
        "Terima kasih tulus telah meluangkan waktu untuk melamar. Sayangnya kali ini kami belum dapat melanjutkan bersama. Kami mendoakan yang terbaik untuk perjalanan Anda."
      )
    },
    {
      label: t("직무 적합도", "Role fit", "岗位匹配", "Mức phù hợp", "職務適合", "Kecocokan peran"),
      text: t(
        "지원해 주셔서 감사합니다. 이번 포지션이 요구하는 경험과는 다소 차이가 있어 아쉽게도 함께하기 어렵게 되었습니다. 더 잘 맞는 기회로 다시 뵙기를 바랍니다.",
        "Thank you for applying. Your experience differs somewhat from what this position requires, so unfortunately we're unable to proceed. We hope to meet again for a better-fitting opportunity.",
        "感谢您的应聘。您的经验与本职位的要求略有差异，很遗憾此次未能合作，期待在更契合的机会中再会。",
        "Cảm ơn bạn đã ứng tuyển. Kinh nghiệm của bạn có phần khác với yêu cầu của vị trí này nên rất tiếc chúng tôi chưa thể hợp tác. Mong gặp lại ở cơ hội phù hợp hơn.",
        "ご応募ありがとうございます。今回のポジションが求める経験とはやや異なるため、残念ながらご一緒するのが難しくなりました。より適した機会で再びお会いできれば幸いです。",
        "Terima kasih telah melamar. Pengalaman Anda sedikit berbeda dari yang dibutuhkan posisi ini, jadi sayangnya kami belum bisa melanjutkan. Semoga bertemu lagi pada peluang yang lebih cocok."
      )
    },
    {
      label: t("다른 후보 선정", "Other candidate", "选择他人", "Chọn ứng viên khác", "他候補選定", "Kandidat lain"),
      text: t(
        "관심 가져주셔서 감사합니다. 여러 훌륭한 지원자분들 중 이번에는 다른 분과 함께하게 되었습니다. 앞으로의 여정을 응원하겠습니다.",
        "Thank you for your interest. Among many excellent applicants, we've decided to move forward with someone else this time. We'll be cheering you on in your journey ahead.",
        "感谢您的关注。在众多优秀应聘者中，我们这次选择了其他人选。祝您未来的旅程一切顺利。",
        "Cảm ơn bạn đã quan tâm. Trong số nhiều ứng viên xuất sắc, lần này chúng tôi chọn một người khác. Chúc bạn thuận lợi trên chặng đường phía trước.",
        "ご関心をお寄せいただきありがとうございます。多くの優れた応募者の中から、今回は他の方とご一緒することになりました。今後のご活躍を応援しております。",
        "Terima kasih atas minat Anda. Di antara banyak pelamar hebat, kali ini kami memilih kandidat lain. Kami mendukung perjalanan Anda ke depan."
      )
    },
    {
      label: t("채용 마감", "Position closed", "招聘结束", "Đã đóng tuyển", "募集終了", "Lowongan ditutup"),
      text: t(
        "지원해 주셔서 감사합니다. 사정상 이번 채용이 마감되어 아쉽게 안내드립니다. 다음 기회에 다시 만나 뵐 수 있기를 바랍니다.",
        "Thank you for applying. Due to circumstances, this posting has now closed, which we regret to share. We hope to meet you again at a future opportunity.",
        "感谢您的应聘。因故本次招聘已结束，特此告知，深表歉意。期待未来有机会再次相见。",
        "Cảm ơn bạn đã ứng tuyển. Vì lý do nội bộ, đợt tuyển này đã kết thúc, chúng tôi rất tiếc phải thông báo. Mong gặp lại bạn ở cơ hội sau.",
        "ご応募ありがとうございます。事情により今回の募集は終了となり、残念ながらご案内いたします。次の機会に再びお会いできれば幸いです。",
        "Terima kasih telah melamar. Karena satu dan lain hal, lowongan ini telah ditutup, dan kami menyampaikannya dengan menyesal. Semoga bertemu lagi di kesempatan berikutnya."
      )
    }
  ];
}

// 불합격 처리 — 사유 템플릿 선택 + 지원자에게 보낼 정중한 안내 메시지(선택).
function RejectModal({ target, onClose, onConfirm }: { target: PartnerApplicantListItem; onClose: () => void; onConfirm: (t: PartnerApplicantListItem, message: string) => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  const [message, setMessage] = useState("");
  const [send, setSend] = useState(true);
  const canMessage = !!target.applicationId;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">{t("불합격 처리", "Reject applicant", "标记未录用", "Đánh dấu không đạt", "不合格にする", "Tolak pelamar")}</p>
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{target.name ?? t("이름 비공개", "Name hidden", "姓名保密", "Ẩn tên", "名前非公開", "Nama disembunyikan")} · {target.positionTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {canMessage ? (
            <>
              <label className="flex items-center gap-2.5">
                <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} className="h-4 w-4 accent-[#0B46E8]" />
                <span className="text-[13.5px] font-bold text-[#191F28]">{t("지원자에게 정중한 안내 메시지 보내기", "Send a courteous message to the applicant", "向申请者发送礼貌的通知消息", "Gửi tin nhắn lịch sự cho ứng viên", "応募者に丁寧な案内メッセージを送る", "Kirim pesan sopan ke pelamar")}</span>
              </label>
              {send ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {rejectTemplates(t).map((tpl) => (
                      <button key={tpl.label} type="button" onClick={() => setMessage(tpl.text)} className="rounded-full border border-[#E5E8EB] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{tpl.label}</button>
                    ))}
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder={t("템플릿을 고르거나 직접 안내 메시지를 작성하세요.", "Pick a template or write your own message.", "选择模板或自行撰写消息。", "Chọn mẫu hoặc tự viết tin nhắn.", "テンプレートを選ぶか、案内メッセージを直接入力してください。", "Pilih templat atau tulis pesan sendiri.")}
                    className="mt-2.5 w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                  />
                </>
              ) : null}
            </>
          ) : (
            <p className="rounded-xl bg-[#F5F6F8] px-3.5 py-3 text-[12.5px] text-[#8B95A1]">{t("이 지원 건은 안내 메시지를 보낼 수 없어 상태만 변경돼요.", "This application can't receive a message, so only the status changes.", "该申请无法发送消息，仅更改状态。", "Đơn này không thể gửi tin nhắn nên chỉ đổi trạng thái.", "この応募には案内メッセージを送れないため、状態のみ変更されます。", "Lamaran ini tidak bisa dikirimi pesan, jadi hanya status yang berubah.")}</p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[#F2F4F6] px-5 py-3">
          <button type="button" onClick={onClose} className="h-[46px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</button>
          <button type="button" onClick={() => onConfirm(target, canMessage && send ? message : "")} className="h-[46px] flex-1 rounded-2xl bg-[#F04452] text-[14px] font-bold text-white transition hover:bg-[#E0323F]">{t("불합격 처리", "Reject", "标记未录用", "Không đạt", "不合格にする", "Tolak")}</button>
        </div>
      </div>
    </div>
  );
}

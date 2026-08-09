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
import { PARTNER_APPLICANT_STATUS } from "../../../lib/partner/labels";
import { getMyPartnerApplicants, getOrgMockInterviewParticipants, updateMyPartnerApplicantState, sendPartnerApplicantMessage, type PartnerApplicantListItem, type PartnerApplicantStatus, type OrgMockInterviewParticipant } from "../../../lib/member-profile-client";

type Tab = "all" | PartnerApplicantStatus | "mock";
type Sort = "latest" | "recommended";

const TABS: { key: Tab; label: string; match: (s: PartnerApplicantStatus) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "APPLIED", label: "신규", match: (s) => s === "APPLIED" },
  { key: "REVIEWING", label: "검토 중", match: (s) => s === "REVIEWING" },
  { key: "INTERVIEW", label: "면접", match: (s) => s === "INTERVIEW" },
  { key: "ACCEPTED", label: "합격", match: (s) => s === "ACCEPTED" || s === "OFFERED" },
  { key: "REJECTED", label: "불합격", match: (s) => s === "REJECTED" }
];

const REC_ORDER: Record<PartnerApplicantListItem["recommendation"], number> = { HIGH: 0, NORMAL: 1, CHECK: 2 };

export function PartnerApplicantsScreen() {
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
      .then(() => toast.success(next === "REVIEWING" ? "검토를 시작했어요" : "상태를 변경했어요"))
      .catch(() => {
        toast.error("상태 변경에 실패했어요");
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
        toast.success("불합격 처리했어요");
        const msg = message.trim();
        if (msg && target.applicationId) void sendPartnerApplicantMessage(target.applicationId, msg).catch(() => {});
      })
      .catch(() => {
        toast.error("상태 변경에 실패했어요");
        setItems((list) => (list ? list.map((a) => (a.id === target.id ? { ...a, status: prev } : a)) : list));
      });
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.error("최대 3명까지 비교할 수 있어요");
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
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">지원자 관리</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">우리 공고에 지원한 인재를 확인하고 관리해요.</p>
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
                placeholder="이름·공고·학교·전공·국적 검색"
                className="w-full rounded-2xl border border-[#EEF1F5] bg-white py-3 pl-11 pr-10 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#B0B8C1] transition hover:bg-[#F2F4F6]">
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
                    <option value="">{tab === "mock" ? "전체 공고 참여자" : "전체 공고 지원자"}</option>
                    {opts.map((p) => (
                      <option key={p.id} value={p.id}>{p.title} · {p.count}명</option>
                    ))}
                  </select>
                  <CaretDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
                </div>
              );
            })()}

            {/* 상태 탭 + 모의 면접 참여자 탭 */}
            <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => {
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${on ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                  >
                    {t.label} ({counts[t.key]})
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
                🎤 모의 면접 ({participants.length})
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
                  {compareMode ? "비교 취소" : "⚖️ 비교"}
                </button>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#F2F4F6] p-0.5">
                  {([["latest", "최신순"], ["recommended", "추천순"]] as const).map(([key, label]) => (
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
                <p className="-mt-1 break-keep text-[13px] text-[#8B95A1]">지원하지 않았어도 우리 공고 모의 면접을 풀어본 인재예요. 제안을 보내 먼저 연결할 수 있어요.</p>
                {mockList.length === 0 ? (
                  <PartnerEmptyCard emoji="🎤" title={q ? "검색 결과가 없어요" : "아직 모의 면접 참여자가 없어요"} desc={q ? "다른 검색어로 다시 시도해보세요." : "공고에 모의 면접을 등록하면 참여자가 모여요."} />
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {mockList.map((m) => (
                      <PartnerParticipantCard key={`${m.userId}:${m.positionId}`} m={m} onPropose={() => setProposeTarget(m)} />
                    ))}
                  </div>
                )}
              </>
            ) : list.length === 0 ? (
              <PartnerEmptyCard emoji="🧑‍💼" title={q ? "검색 결과가 없어요" : "해당 상태의 지원자가 없어요"} desc={q ? "다른 검색어로 다시 시도해보세요." : undefined} />
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
          name={proposeTarget.name}
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
            <p className="text-[13px] font-bold text-[#191F28]">{compareIds.length}명 선택{compareIds.length < 2 ? " · 2명 이상 선택" : ""}</p>
            <button type="button" onClick={exitCompare} className="ml-auto rounded-xl bg-[#F2F4F6] px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">취소</button>
            <button type="button" onClick={() => setCompareOpen(true)} disabled={compareIds.length < 2} className="rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">비교하기</button>
          </div>
        </div>
      ) : null}

      {compareOpen ? <CompareModal applicants={(items ?? []).filter((a) => compareIds.includes(a.id))} onClose={() => setCompareOpen(false)} /> : null}
    </PartnerAppShell>
  );
}

// 지원자 비교 — 선택한 2~3명을 나란히 비교(표).
function CompareModal({ applicants, onClose }: { applicants: PartnerApplicantListItem[]; onClose: () => void }) {
  useLockBodyScroll();
  const rec: Record<PartnerApplicantListItem["recommendation"], string> = { HIGH: "적극 추천", NORMAL: "보통", CHECK: "확인 필요" };
  const rows: { label: string; get: (a: PartnerApplicantListItem) => string }[] = [
    { label: "상태", get: (a) => PARTNER_APPLICANT_STATUS[a.status]?.label ?? a.status },
    { label: "공고", get: (a) => a.positionTitle },
    { label: "학교·전공", get: (a) => [a.school, a.major].filter(Boolean).join(" · ") || "-" },
    { label: "국적", get: (a) => a.nationality ?? "-" },
    { label: "언어", get: (a) => (a.languages?.length ? a.languages.join(", ") : "-") },
    { label: "추천", get: (a) => rec[a.recommendation] },
    { label: "모의 면접", get: (a) => (a.mockInterviewPracticed ? (a.mockInterviewScore != null ? `${a.mockInterviewScore}점` : "응시") : "-") },
    { label: "지원일", get: (a) => (a.appliedAt ? new Date(a.appliedAt).toLocaleDateString("ko-KR") : "-") }
  ];
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <p className="text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">지원자 비교 ({applicants.length})</p>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white p-2" />
                {applicants.map((a) => <th key={a.id} className="min-w-[110px] p-2 text-[13px] font-black text-[#191F28]">{a.name}</th>)}
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

const REJECT_TEMPLATES: { label: string; text: string }[] = [
  { label: "정중한 마무리", text: "소중한 시간 내어 지원해 주셔서 진심으로 감사합니다. 아쉽게도 이번 채용에서는 함께하지 못하게 되었습니다. 지원자님의 앞날을 진심으로 응원합니다." },
  { label: "직무 적합도", text: "지원해 주셔서 감사합니다. 이번 포지션이 요구하는 경험과는 다소 차이가 있어 아쉽게도 함께하기 어렵게 되었습니다. 더 잘 맞는 기회로 다시 뵙기를 바랍니다." },
  { label: "다른 후보 선정", text: "관심 가져주셔서 감사합니다. 여러 훌륭한 지원자분들 중 이번에는 다른 분과 함께하게 되었습니다. 앞으로의 여정을 응원하겠습니다." },
  { label: "채용 마감", text: "지원해 주셔서 감사합니다. 사정상 이번 채용이 마감되어 아쉽게 안내드립니다. 다음 기회에 다시 만나 뵐 수 있기를 바랍니다." }
];

// 불합격 처리 — 사유 템플릿 선택 + 지원자에게 보낼 정중한 안내 메시지(선택).
function RejectModal({ target, onClose, onConfirm }: { target: PartnerApplicantListItem; onClose: () => void; onConfirm: (t: PartnerApplicantListItem, message: string) => void }) {
  useLockBodyScroll();
  const [message, setMessage] = useState("");
  const [send, setSend] = useState(true);
  const canMessage = !!target.applicationId;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">불합격 처리</p>
            <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{target.name} · {target.positionTitle}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {canMessage ? (
            <>
              <label className="flex items-center gap-2.5">
                <input type="checkbox" checked={send} onChange={(e) => setSend(e.target.checked)} className="h-4 w-4 accent-[#0B46E8]" />
                <span className="text-[13.5px] font-bold text-[#191F28]">지원자에게 정중한 안내 메시지 보내기</span>
              </label>
              {send ? (
                <>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {REJECT_TEMPLATES.map((t) => (
                      <button key={t.label} type="button" onClick={() => setMessage(t.text)} className="rounded-full border border-[#E5E8EB] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t.label}</button>
                    ))}
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="템플릿을 고르거나 직접 안내 메시지를 작성하세요."
                    className="mt-2.5 w-full resize-none rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[13.5px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                  />
                </>
              ) : null}
            </>
          ) : (
            <p className="rounded-xl bg-[#F5F6F8] px-3.5 py-3 text-[12.5px] text-[#8B95A1]">이 지원 건은 안내 메시지를 보낼 수 없어 상태만 변경돼요.</p>
          )}
        </div>

        <div className="flex items-center gap-2 border-t border-[#F2F4F6] px-5 py-3">
          <button type="button" onClick={onClose} className="h-[46px] flex-1 rounded-2xl bg-[#F2F4F6] text-[14px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">취소</button>
          <button type="button" onClick={() => onConfirm(target, canMessage && send ? message : "")} className="h-[46px] flex-1 rounded-2xl bg-[#F04452] text-[14px] font-bold text-white transition hover:bg-[#E0323F]">불합격 처리</button>
        </div>
      </div>
    </div>
  );
}

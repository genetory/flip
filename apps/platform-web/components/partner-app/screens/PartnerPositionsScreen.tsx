"use client";

// 파트너 공고 관리 — 요약 + 검색 + 정렬 + 상태 탭 + 공고별 지원자 수 카드.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MagnifyingGlass, X, ImageSquare, Microphone } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TListSkeleton, TError } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import { usePlatformT } from "../../../lib/i18n";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { getMyPartnerPositions, getMyPartnerApplicants, updateMyPartnerPosition, type PartnerPosition, type PartnerApplicantListItem } from "../../../lib/member-profile-client";

type PositionQuickStatus = "OPEN" | "PAUSED" | "CLOSED";

const EMPLOYMENT_LABEL: Record<PartnerPosition["employmentType"], string> = {
  FULL_TIME: "정규직",
  INTERN: "인턴",
  PART_TIME: "파트타임",
  UNPAID_INTERN: "무급 인턴"
};

const WORKTYPE_LABEL: Record<NonNullable<PartnerPosition["workType"]>, string> = {
  "On-site": "출근",
  Hybrid: "하이브리드",
  Remote: "재택"
};

type Tab = "all" | "OPEN" | "DRAFT" | "CLOSED";
type Sort = "latest" | "applicants";

const TABS: { key: Tab; label: string; match: (p: PartnerPosition) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "OPEN", label: "게시 중", match: (p) => p.status === "OPEN" },
  { key: "DRAFT", label: "작성 중", match: (p) => p.status === "DRAFT" || p.status === "PENDING_REVIEW" },
  { key: "CLOSED", label: "마감", match: (p) => p.status === "CLOSED" || p.status === "REJECTED" }
];

export function PartnerPositionsScreen() {
  const searchParams = useSearchParams();
  const toast = useTalentPopup();
  const t = usePlatformT();
  const initTab = searchParams.get("tab");
  const [items, setItems] = useState<PartnerPosition[] | null>(null);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.key === initTab) ? (initTab as Tab) : "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");

  function load() {
    setStatus("loading");
    Promise.all([getMyPartnerPositions(), getMyPartnerApplicants().catch(() => [])])
      .then(([list, apps]) => {
        setItems(list);
        setApplicants(apps);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  // 공고 카드에서 바로 상태 변경(게시↔일시중지↔마감). 낙관적 반영 후 실패 시 되돌린다.
  function setPositionStatus(id: string, next: PositionQuickStatus) {
    const prev = items?.find((p) => p.id === id)?.status;
    setItems((list) => (list ? list.map((p) => (p.id === id ? { ...p, status: next } : p)) : list));
    updateMyPartnerPosition(id, { status: next })
      .then(() => toast.success(next === "OPEN" ? t("공고를 다시 게시했어요", "Posting is live again", "职位已重新发布", "Đã đăng lại tin", "求人を再掲載しました", "Lowongan tayang lagi") : next === "PAUSED" ? t("공고를 일시중지했어요", "Posting paused", "职位已暂停", "Đã tạm dừng tin", "求人を一時停止しました", "Lowongan dijeda") : t("공고를 마감했어요", "Posting closed", "职位已关闭", "Đã đóng tin", "求人を締め切りました", "Lowongan ditutup")))
      .catch(() => {
        toast.error(t("상태 변경에 실패했어요", "Couldn't change status", "状态更改失败", "Không đổi được trạng thái", "ステータスを変更できませんでした", "Gagal mengubah status"));
        if (prev) setItems((list) => (list ? list.map((p) => (p.id === id ? { ...p, status: prev } : p)) : list));
      });
  }

  const all = useMemo(() => items ?? [], [items]);

  // 공고별 지원자 수.
  const applicantCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of applicants) m.set(a.positionId, (m.get(a.positionId) ?? 0) + 1);
    return m;
  }, [applicants]);

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.key] = all.filter(t.match).length;
    return c;
  }, [all]);

  const active = TABS.find((tb) => tb.key === tab) ?? TABS[0];
  const q = query.trim().toLowerCase();
  const tabLabel = (key: Tab) =>
    key === "all"
      ? t("전체", "All", "全部", "Tất cả", "すべて", "Semua")
      : key === "OPEN"
        ? t("게시 중", "Open", "在招", "Đang mở", "掲載中", "Aktif")
        : key === "DRAFT"
          ? t("작성 중", "Draft", "草稿", "Nháp", "作成中", "Draf")
          : t("마감", "Closed", "已关闭", "Đã đóng", "締切", "Ditutup");

  const list = useMemo(() => {
    const filtered = all
      .filter(active.match)
      .filter((p) => {
        if (!q) return true;
        return [p.title, p.preferredJobRole, p.workLocation].some((v) => (v ?? "").toLowerCase().includes(q));
      });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "applicants") {
        const d = (applicantCount.get(b.id) ?? 0) - (applicantCount.get(a.id) ?? 0);
        if (d !== 0) return d;
      }
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, tab, q, sort, applicantCount]);

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("공고 관리", "Manage postings", "职位管理", "Quản lý tin", "求人管理", "Kelola lowongan")}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("채용 공고를 올리고 상태·지원 현황을 관리해요.", "Post jobs and manage their status and applications.", "发布招聘职位并管理状态和申请情况。", "Đăng tin và quản lý trạng thái, đơn ứng tuyển.", "求人を掲載し、状態や応募状況を管理します。", "Posting lowongan dan kelola status serta lamaran.")}</p>
          </div>
          <Link href={partnerRoutes.positionNew} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3.5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
            <Plus className="h-4 w-4" weight="bold" /> {t("새 공고", "New", "新建", "Tin mới", "新規", "Baru")}
          </Link>
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
                placeholder={t("공고명·직무·근무지 검색", "Search title, role, location", "搜索职位名·岗位·地点", "Tìm tên tin, vị trí, nơi làm", "求人名・職種・勤務地で検索", "Cari judul, peran, lokasi")}
                className="w-full rounded-2xl border border-[#EEF1F5] bg-white py-3 pl-11 pr-10 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label={t("검색어 지우기", "Clear search", "清除搜索", "Xóa tìm kiếm", "検索をクリア", "Hapus pencarian")} className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#B0B8C1] transition hover:bg-[#F2F4F6]">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* 상태 탭 */}
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
                    {tabLabel(tb.key)} ({counts[tb.key]})
                    {on ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                  </button>
                );
              })}
            </div>

            {/* 정렬 */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1 rounded-full bg-[#F2F4F6] p-0.5">
                {([["latest", t("최신순", "Latest", "最新", "Mới nhất", "新着順", "Terbaru")], ["applicants", t("지원 많은순", "Most applied", "申请最多", "Nhiều ứng tuyển", "応募が多い順", "Terbanyak melamar")]] as const).map(([key, label]) => (
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

            {/* 리스트 */}
            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>📋</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">{q ? t("검색 결과가 없어요", "No results", "没有搜索结果", "Không có kết quả", "検索結果がありません", "Tidak ada hasil") : t("공고가 없어요", "No postings", "暂无职位", "Chưa có tin", "求人がありません", "Belum ada lowongan")}</p>
                {!q ? <p className="mt-1 text-[13px] text-[#8B95A1]">{t("첫 채용 공고를 올려보세요.", "Post your first job.", "发布你的第一个职位。", "Đăng tin tuyển dụng đầu tiên.", "最初の求人を掲載しましょう。", "Posting lowongan pertama Anda.")}</p> : null}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {list.map((p) => (
                  <PositionCard key={p.id} p={p} applicants={applicantCount.get(p.id) ?? 0} mockCount={p.mockInterviewParticipantCount ?? 0} onSetStatus={setPositionStatus} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function fmtDate(d: string | null): string | null {
  if (!d) return null;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return null;
  return `${t.getMonth() + 1}월 ${t.getDate()}일`;
}

// 비자 값 → 사람이 읽는 라벨. 저장된 원시 코드/센티넬(NO_VISA_REQUIRED 등)을 한글로.
function visaLabel(v: string): string {
  const c = v.trim().toUpperCase().replace(/_/g, "-");
  if (c === "NO-VISA-REQUIRED") return "무관";
  if (c === "FOREIGNER-FRIENDLY") return "외국인 환영";
  return c; // 비자 코드(D-2, E-7 등)는 그대로
}

function PositionCard({ p, applicants, mockCount, onSetStatus }: { p: PartnerPosition; applicants: number; mockCount: number; onSetStatus: (id: string, next: PositionQuickStatus) => void }) {
  const router = useRouter();
  const t = usePlatformT();
  // 이미 승인·게시 이력이 있는 상태(OPEN/PAUSED/CLOSED) 사이의 빠른 전환만 노출(신규 검토는 에디터에서).
  const quickActions: { label: string; next: PositionQuickStatus }[] =
    p.status === "OPEN"
      ? [{ label: t("일시중지", "Pause", "暂停", "Tạm dừng", "一時停止", "Jeda"), next: "PAUSED" }, { label: t("마감", "Close", "关闭", "Đóng", "締切", "Tutup"), next: "CLOSED" }]
      : p.status === "PAUSED"
        ? [{ label: t("다시 게시", "Reopen", "重新发布", "Đăng lại", "再掲載", "Buka lagi"), next: "OPEN" }]
        : p.status === "CLOSED"
          ? [{ label: t("다시 게시", "Reopen", "重新发布", "Đăng lại", "再掲載", "Buka lagi"), next: "OPEN" }]
          : [];
  const s = PARTNER_POSITION_STATUS[p.status];
  const thumb = Array.isArray(p.thumbnailImages) ? p.thumbnailImages[0] : undefined;
  const role = p.preferredJobRole?.trim();
  const start = fmtDate(p.startDate);
  const visas = (p.eligibleVisas ?? []).filter(Boolean);
  const langs = (p.communicationLanguages ?? []).filter(Boolean);

  // 핵심 메타 — 칩 나열 대신 · 구분 텍스트 한두 줄로 담백하게.
  const metaPrimary = [EMPLOYMENT_LABEL[p.employmentType], p.workType ? WORKTYPE_LABEL[p.workType] : null, p.workLocation || null, start ? t(`${start} 시작`, `Starts ${start}`, `${start} 开始`, `Bắt đầu ${start}`, `${start} 開始`, `Mulai ${start}`) : null].filter(Boolean).join(" · ");
  const visaLabels = visas.map(visaLabel);
  const visaJoined = visaLabels.length ? `${visaLabels.slice(0, 3).join("·")}${visaLabels.length > 3 ? ` +${visaLabels.length - 3}` : ""}` : "";
  const metaVisa = visaJoined ? t(`비자 ${visaJoined}`, `Visa ${visaJoined}`, `签证 ${visaJoined}`, `Visa ${visaJoined}`, `ビザ ${visaJoined}`, `Visa ${visaJoined}`) : "";
  const langJoined = langs.length ? `${langs.slice(0, 3).join("·")}${langs.length > 3 ? ` +${langs.length - 3}` : ""}` : "";
  const metaLang = langJoined ? t(`언어 ${langJoined}`, `Language ${langJoined}`, `语言 ${langJoined}`, `Ngôn ngữ ${langJoined}`, `言語 ${langJoined}`, `Bahasa ${langJoined}`) : "";
  const metaSub = [metaVisa, metaLang].filter(Boolean).join("   ·   ");

  return (
    <Link href={`${partnerRoutes.positions}/${p.id}`} className="flex gap-4 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      {/* 썸네일 — 없어도 뷰 표시 */}
      <span className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EEF1F5] bg-[#F2F4F6]">
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="88px" className="object-cover" unoptimized />
        ) : (
          <ImageSquare className="h-7 w-7 text-[#C4CAD2]" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
          {p.mockInterviewIntent || (p.mockInterviewQuestions?.length ?? 0) > 0 ? (
            <span className="shrink-0 whitespace-nowrap rounded-md bg-[#EDF1FD] px-2.5 py-1 text-[11px] font-bold text-[#0B46E8]">🎤 {t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Simulasi")}</span>
          ) : null}
          <span className="ml-auto shrink-0 whitespace-nowrap text-[11.5px] text-[#B0B8C1]">{t(`${new Date(p.createdAt).toLocaleDateString("ko-KR")} 작성`, `Created ${new Date(p.createdAt).toLocaleDateString("en-US")}`, `${new Date(p.createdAt).toLocaleDateString("zh-CN")} 创建`, `Tạo ${new Date(p.createdAt).toLocaleDateString("vi-VN")}`, `${new Date(p.createdAt).toLocaleDateString("ja-JP")} 作成`, `Dibuat ${new Date(p.createdAt).toLocaleDateString("id-ID")}`)}</span>
        </div>

        <p className="mt-2 truncate text-[15.5px] font-bold text-[#191F28]">{p.title || t("제목 없는 공고", "Untitled posting", "无标题职位", "Tin chưa có tiêu đề", "無題の求人", "Lowongan tanpa judul")}</p>
        {role ? <p className="mt-0.5 truncate text-[12.5px] font-semibold text-[#0B46E8]">{role}</p> : null}

        {/* 핵심 메타 — 담백한 텍스트 라인 */}
        <p className="mt-1.5 truncate text-[12.5px] text-[#8B95A1]">{metaPrimary}</p>
        {metaSub ? <p className="mt-0.5 truncate text-[12px] text-[#B0B8C1]">{metaSub}</p> : null}

        {/* 지표 + 빠른 상태 변경 — 읽기전용 수치(회색)와 이동 링크(파랑)를 명확히 구분 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-[#F5F6F8] pt-2.5">
          <span className="text-[12.5px] text-[#8B95A1]">{t("채용", "Hiring", "招聘", "Tuyển", "採用", "Rekrut")} <b className="font-bold text-[#4E5968]">{p.hiringCount ?? "-"}</b></span>
          <span className="text-[12.5px] text-[#8B95A1]">{t("조회", "Views", "浏览", "Lượt xem", "閲覧", "Dilihat")} <b className="font-bold text-[#4E5968]">{p.viewCount ?? 0}</b></span>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`${partnerRoutes.applicants}?position=${encodeURIComponent(p.id)}`); }}
            className="text-[12.5px] font-semibold text-[#0B46E8] transition hover:underline"
          >
            {t(`지원 ${applicants}명`, `${applicants} applied`, `${applicants}人申请`, `${applicants} ứng tuyển`, `${applicants}名応募`, `${applicants} melamar`)}
          </button>
          {mockCount > 0 ? (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(`${partnerRoutes.applicants}?position=${encodeURIComponent(p.id)}&tab=mock`); }}
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0B46E8] transition hover:underline"
            >
              <Microphone className="h-3.5 w-3.5" weight="fill" /> {t(`모의 ${mockCount}명`, `${mockCount} mock`, `模拟 ${mockCount}名`, `${mockCount} thử`, `模擬 ${mockCount}名`, `${mockCount} simulasi`)}
            </button>
          ) : null}
          {quickActions.length ? (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {quickActions.map((a) => (
                <button
                  key={a.next}
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSetStatus(p.id, a.next); }}
                  className="rounded-lg border border-[#E5E8EB] bg-white px-2.5 py-1 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

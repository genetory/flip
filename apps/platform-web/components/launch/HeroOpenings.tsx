"use client";

// 홈 히어로 하단 — 내가 준비 중인 직무 + 그 직무에 어울리는 공고(우리 공고 데이터).
// 5개씩 보여주고 '다른 공고 더보기'로 랜덤 5개씩 계속 이어 보여준다.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Buildings, Microphone, Lock, Shuffle, Target } from "@phosphor-icons/react";
import { fetchProgress } from "../../lib/launch/progress-client";
import { getPublicPositionsPage, getRecommendedPositions, type PublicPositionListItem } from "../../lib/member-profile-client";
import { RECOMMENDED_JOBS } from "../../lib/launch/data";
import type { InterviewJobPosting } from "../../lib/launch/interview";
import { CareerChatModal } from "./CareerChatModal";
import { PostingInterviewSession } from "./PostingInterviewSession";
import { useLaunchT } from "../../lib/launch/i18n";

// PublicPositionListItem → 공고별 모의면접 입력. (PostingInterviewCard 와 동일 규칙)
function positionToPosting(p: PublicPositionListItem): InterviewJobPosting {
  return {
    title: p.title,
    company: posCompany(p),
    description: [p.mainResponsibilities, p.requiredQualifications, p.preferredQualifications].filter(Boolean).join("\n\n") || undefined,
    requirements: p.requiredQualifications ? [p.requiredQualifications] : undefined
  };
}

const posCompany = (p: PublicPositionListItem) => p.partnerOrganization?.name || p.sourceCompanyName || "";
const posThumb = (p: PublicPositionListItem) => p.thumbnailImages?.[0] || p.partnerOrganization?.companyLogoImageData || undefined;
// 공고를 대략 파악할 수 있게 요약 불렛 3개 — 주요업무/자격요건을 줄·구분자·문장 기준으로 쪼갠다.
function posBullets(p: PublicPositionListItem): string[] {
  const raw = [p.mainResponsibilities, p.requiredQualifications].filter(Boolean).join("\n").trim();
  if (!raw) return p.preferredJobRole ? [p.preferredJobRole.trim()] : [];
  let parts = raw.split(/\r?\n|[•·▪‣∙・]|;|,\s/).map((s) => s.replace(/^[-*\s]+/, "").replace(/\s+/g, " ").trim()).filter((s) => s.length > 1);
  if (parts.length < 2) parts = raw.split(/(?<=[.!?。])\s+/).map((s) => s.replace(/\s+/g, " ").trim()).filter((s) => s.length > 1);
  return parts.slice(0, 3).map((s) => s.slice(0, 70));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PAGE = 5;

export function HeroOpenings({ currentWeek = 1 }: { currentWeek?: number }) {
  const t = useLaunchT();
  const canMock = currentWeek >= 4; // 공고별 모의면접은 4주차 도달 후에만
  const [active, setActive] = useState<InterviewJobPosting | null>(null); // 모의면접 모달 대상
  const [blocked, setBlocked] = useState(false); // 4주차 전 안내 팝업
  const [jobs, setJobs] = useState<string[]>([]);
  const [activeJob, setActiveJob] = useState(""); // "" = 전체
  const [shown, setShown] = useState<PublicPositionListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const poolRef = useRef<PublicPositionListItem[]>([]);
  const deckRef = useRef<PublicPositionListItem[]>([]);
  const ptrRef = useRef(0);
  const relRef = useRef<Map<string, number>>(new Map()); // 현재 풀의 공고별 적합도
  type Pool = { list: PublicPositionListItem[]; rel: Map<string, number> };
  const byJobRef = useRef<Record<string, Pool>>({}); // 직무별 풀
  const allRef = useRef<Pool>({ list: [], rel: new Map() }); // 전체(모든 직무 합집합)

  // 선택한 풀을 화면에 반영(랜덤 5개).
  const showPool = (src: Pool) => {
    const deck = shuffle(src.list);
    poolRef.current = src.list;
    deckRef.current = deck;
    ptrRef.current = Math.min(PAGE, deck.length);
    relRef.current = src.rel;
    setShown(deck.slice(0, PAGE));
  };
  const selectJob = (job: string) => {
    setActiveJob(job);
    showPool(job ? (byJobRef.current[job] ?? { list: [], rel: new Map() }) : allRef.current);
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const prog = await fetchProgress().catch(() => null);
        const sel = Array.isArray(prog?.selectedJobs) ? prog!.selectedJobs!.filter((j) => j?.trim()) : [];
        if (alive) setJobs(sel);

        const jobEntries = sel.map((r) => RECOMMENDED_JOBS.find((j) => j.role === r)).filter((e): e is (typeof RECOMMENDED_JOBS)[number] => Boolean(e));
        // 너무 넓어 다른 직무까지 걸리는 범용어는 매칭에서 제외(예: AI 공고가 '개발/파이썬/엔지니어'로 잡히는 문제).
        const GENERIC = new Set(["개발", "개발자", "it", "컴퓨터", "컴퓨터공학", "소프트웨어", "프로그래밍", "프로그래머", "엔지니어", "engineer", "developer", "dev", "경영", "서비스", "ui", "api", "db", "구현", "설계", "문서화", "java", "python"]);
        const tokenize = (s: string) => s.toLowerCase().split(/[\s·,/&]+/).map((x) => x.trim()).filter((x) => x.length > 1);
        const kwOf = (je: (typeof RECOMMENDED_JOBS)[number]) => {
          const set = new Set<string>();
          for (const tag of je.tags ?? []) {
            const tl = tag.trim().toLowerCase();
            if (tl.length > 1 && !GENERIC.has(tl)) set.add(tl);
          }
          for (const sk of je.skills ?? []) for (const tok of tokenize(sk)) if (!GENERIC.has(tok)) set.add(tok);
          return set;
        };
        // 한 직무 기준 적합도 함수.
        const relFor = (role: string, kws: Set<string>) => (p: PublicPositionListItem): number => {
          const hay = `${p.title} ${p.preferredJobRole ?? ""} ${p.mainResponsibilities ?? ""} ${p.requiredQualifications ?? ""}`.toLowerCase();
          let s = role && hay.includes(role) ? 3 : 0;
          for (const kw of kws) if (hay.includes(kw)) s += 1;
          return s;
        };

        if (jobEntries.length) {
          const queries = jobEntries.map((je) => je.query || je.role);
          const pages = await Promise.all(queries.map((s) => getPublicPositionsPage({ search: s, limit: 20 }).catch(() => null)));
          if (!alive) return;
          const allSeen = new Map<string, { p: PublicPositionListItem; rel: number }>();
          jobEntries.forEach((je, i) => {
            const rel = relFor(je.role.toLowerCase(), kwOf(je));
            const items = pages[i]?.items ?? [];
            const relevant = items.filter((p) => rel(p) > 0).sort((a, b) => rel(b) - rel(a));
            const list = relevant.length > 0 ? relevant : items;
            byJobRef.current[je.role] = { list, rel: new Map(list.map((p) => [p.id, rel(p)])) };
            for (const p of list) {
              const r = rel(p);
              const prev = allSeen.get(p.id);
              if (!prev || r > prev.rel) allSeen.set(p.id, { p, rel: r });
            }
          });
          const merged = [...allSeen.values()].sort((a, b) => b.rel - a.rel);
          allRef.current = { list: merged.map((x) => x.p), rel: new Map(merged.map((x) => [x.p.id, x.rel])) };
        } else {
          const rec = (await getRecommendedPositions({ limit: 20 }).catch(() => ({ items: [] as PublicPositionListItem[] }))).items;
          if (!alive) return;
          allRef.current = { list: rec, rel: new Map() };
        }
        if (!alive) return;
        showPool(allRef.current); // 기본 전체
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 더보기 — 기존 5개를 지우고 다른 랜덤 5개로 교체(누적 아님). 덱 끝나면 다시 섞어 계속.
  const more = () => {
    const pool = poolRef.current;
    if (pool.length <= PAGE) {
      setShown(shuffle(pool));
      return;
    }
    let deck = deckRef.current;
    let p = ptrRef.current;
    if (p + PAGE > deck.length) {
      deck = shuffle(pool);
      deckRef.current = deck;
      p = 0;
    }
    ptrRef.current = p + PAGE;
    setShown(deck.slice(p, p + PAGE));
  };

  if (loaded && jobs.length === 0 && shown.length === 0) return null;

  return (
    <div>
      {/* 준비 중인 직무 */}
      {jobs.length > 0 ? (
        <div className="mb-4">
          <p className="cl-eyebrow mb-2 inline-flex items-center gap-1.5" style={{ color: "var(--cl-faint)" }}>
            <Target className="h-3.5 w-3.5" weight="fill" style={{ color: "var(--cl-accent)" }} aria-hidden /> {t("준비 중인 직무", "Roles you're preparing for", "正在准备的职务", "Nghề bạn đang chuẩn bị", "準備中の職種", "Peran yang kamu siapkan")}
          </p>
          <div className="cl-role-tabs">
            {jobs.length > 1 ? (
              <button type="button" onClick={() => selectJob("")} className={activeJob === "" ? "cl-role-chip on" : "cl-role-chip"}>{t("전체", "All", "全部", "Tất cả", "すべて", "Semua")}</button>
            ) : null}
            {jobs.map((j) => (
              <button key={j} type="button" onClick={() => selectJob(j)} className={activeJob === j ? "cl-role-chip on" : "cl-role-chip"}>{j}</button>
            ))}
          </div>
        </div>
      ) : null}

      {/* 어울리는 공고 */}
      {shown.length > 0 ? (
        <>
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <p className="text-[14px] font-black text-[#191F28]">{t("나에게 어울리는 공고", "Openings that fit you", "适合你的公告", "Tin phù hợp với bạn", "あなたに合う求人", "Lowongan yang cocok")}</p>
            <Link href="/talent/jobs" className="text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">{t("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}</Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {shown.map((p, i) => {
              const name = posCompany(p);
              const thumb = posThumb(p);
              const bullets = posBullets(p);
              const fit = (relRef.current.get(p.id) ?? 0) >= 2; // 관심 직무 키워드가 여러 개 맞으면 "잘 맞아요"
              return (
                <div key={`${p.id}:${i}`} className="cl-gate">
                  <Link href={`/talent/jobs/${p.id}`} className="cl-gate-main">
                    <span className="logo">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" />
                      ) : (
                        <Buildings className="h-5 w-5" weight="fill" aria-hidden />
                      )}
                    </span>
                    <span className="body">
                      <span className="ttl-row">
                        <span className="ttl">{p.title}</span>
                        {fit ? <span className="cl-fit"><Target className="h-3 w-3" weight="fill" aria-hidden /> {t("잘 맞아요", "Great fit", "很匹配", "Rất hợp", "好相性", "Cocok")}</span> : null}
                      </span>
                      {name ? <span className="co">{name}</span> : null}
                      {bullets.length ? (
                        <ul className="bl">
                          {bullets.map((b, j) => (
                            <li key={j}><span>{b}</span></li>
                          ))}
                        </ul>
                      ) : null}
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => (canMock ? setActive(positionToPosting(p)) : setBlocked(true))}
                    className={`cl-gate-btn${canMock ? "" : " locked"}`}
                    aria-label={t("모의면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara")}
                  >
                    {canMock ? <Microphone className="h-3.5 w-3.5" weight="fill" aria-hidden /> : <Lock className="h-3.5 w-3.5" weight="fill" aria-hidden />}
                    {t("모의면접", "Mock", "模拟面试", "PV thử", "模擬面接", "Wawancara")}
                  </button>
                </div>
              );
            })}
          </div>
          {poolRef.current.length > PAGE ? (
            <button type="button" onClick={more} className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
              <Shuffle className="h-4 w-4" weight="bold" /> {t("다른 공고 더보기", "Show more openings", "查看更多公告", "Xem thêm tin", "他の求人をもっと見る", "Tampilkan lebih banyak")}
            </button>
          ) : null}
        </>
      ) : loaded && jobs.length > 0 ? (
        <p className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-4 text-center text-[12.5px] text-[#8B95A1]">{t("지금 매칭되는 공고가 적어요. 잠시 후 다시 확인해보세요.", "Few matches right now. Check back soon.", "目前匹配较少，请稍后再看。", "Hiện ít tin phù hợp. Kiểm tra lại sau.", "今はマッチが少ないです。後で確認してください。", "Sedikit yang cocok. Cek lagi nanti.")}</p>
      ) : null}

      {/* 공고별 모의면접(4주차 도달자) — PostingInterviewCard 와 동일 모달 */}
      {active ? <CareerChatModal onClose={() => setActive(null)}><PostingInterviewSession posting={active} embedded onClose={() => setActive(null)} /></CareerChatModal> : null}

      {/* 4주차 전 안내 팝업 */}
      {blocked ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-5" onClick={() => setBlocked(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Lock className="h-6 w-6" weight="fill" aria-hidden /></span>
            <p className="mt-3 text-[15.5px] font-black text-[#191F28]">{t("모의면접은 4주차부터예요", "Mock interview opens in Week 4", "模拟面试从第4周开始", "Phỏng vấn thử mở ở Tuần 4", "模擬面接は4週目から", "Wawancara mulai Minggu 4")}</p>
            <p className="mt-2 break-keep text-[13px] leading-relaxed text-[#4E5968]">{t("공고별 모의면접은 4주차를 진행해야 열려요. 지금은 이번 주차 미션을 이어가 주세요.", "Job-specific mock interviews unlock once you reach Week 4. Continue this week's missions for now.", "公告模拟面试需进行到第4周才会解锁。请先继续本周任务。", "Phỏng vấn thử theo tin mở khi bạn đến Tuần 4. Hãy tiếp tục nhiệm vụ tuần này.", "求人別模擬面接は4週目に到達すると開きます。今は今週のミッションを進めてください。", "Wawancara per lowongan terbuka saat kamu mencapai Minggu 4. Lanjutkan misi minggu ini dulu.")}</p>
            <button type="button" onClick={() => setBlocked(false)} className="mt-4 w-full rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white">{t("확인", "Got it", "知道了", "Đã hiểu", "了解", "Oke")}</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

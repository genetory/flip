"use client";

// 홈 히어로 하단 — 내가 준비 중인 직무 + 그 직무에 어울리는 공고(우리 공고 데이터).
// 5개씩 보여주고 '다른 공고 더보기'로 랜덤 5개씩 계속 이어 보여준다.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Buildings, ArrowRight, Shuffle, Target } from "@phosphor-icons/react";
import { fetchProgress } from "../../lib/launch/progress-client";
import { getPublicPositionsPage, getRecommendedPositions, type PublicPositionListItem } from "../../lib/member-profile-client";
import { RECOMMENDED_JOBS } from "../../lib/launch/data";
import { useLaunchT } from "../../lib/launch/i18n";

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

export function HeroOpenings() {
  const t = useLaunchT();
  const [jobs, setJobs] = useState<string[]>([]);
  const [shown, setShown] = useState<PublicPositionListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const poolRef = useRef<PublicPositionListItem[]>([]);
  const deckRef = useRef<PublicPositionListItem[]>([]);
  const ptrRef = useRef(0);
  const relRef = useRef<Map<string, number>>(new Map()); // 공고별 적합도(관심 직무 키워드 일치 수)

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
        // 직무별 구체 키워드(범용어 제외) — 태그 + 영문 스킬(android·kotlin·ios·swift 등)까지 포함해 영문 공고도 매칭.
        const kwOf = (je: (typeof RECOMMENDED_JOBS)[number]) => {
          const set = new Set<string>();
          for (const tag of je.tags ?? []) {
            const tl = tag.trim().toLowerCase();
            if (tl.length > 1 && !GENERIC.has(tl)) set.add(tl);
          }
          for (const sk of je.skills ?? []) for (const tok of tokenize(sk)) if (!GENERIC.has(tok)) set.add(tok);
          return set;
        };
        const jobKws = jobEntries.map((je) => ({ role: je.role.toLowerCase(), kws: kwOf(je) }));
        const relevance = (p: PublicPositionListItem): number => {
          const hay = `${p.title} ${p.preferredJobRole ?? ""} ${p.mainResponsibilities ?? ""} ${p.requiredQualifications ?? ""}`.toLowerCase();
          let s = 0;
          for (const jk of jobKws) {
            if (jk.role && hay.includes(jk.role)) s += 3;
            for (const kw of jk.kws) if (hay.includes(kw)) s += 1;
          }
          return s;
        };

        // 관심 직무 검색으로만 후보 풀 구성(개인화 추천은 직무와 무관한 공고를 끌어와 제외).
        const seen = new Set<string>();
        const searched: PublicPositionListItem[] = [];
        if (sel.length) {
          const queries = jobEntries.map((je) => je.query || je.role);
          const pages = await Promise.all(queries.map((s) => getPublicPositionsPage({ search: s, limit: 20 }).catch(() => null)));
          for (const pg of pages) {
            for (const it of pg?.items ?? []) {
              if (seen.has(it.id)) continue;
              seen.add(it.id);
              searched.push(it);
            }
          }
        }
        if (!alive) return;

        // 직무 키워드와 실제로 맞는 공고만(관련도>0). 관심 직무가 없거나 매칭이 0이면 개인화 추천으로 폴백.
        let items: PublicPositionListItem[];
        if (jobKws.length) {
          const relevant = searched.filter((p) => relevance(p) > 0).sort((a, b) => relevance(b) - relevance(a));
          items = relevant.length > 0 ? relevant : searched;
          relRef.current = new Map(items.map((p) => [p.id, relevance(p)])); // 적합도 표시용
        } else {
          items = (await getRecommendedPositions({ limit: 20 }).catch(() => ({ items: [] as PublicPositionListItem[] }))).items;
        }

        const deck = shuffle(items);
        poolRef.current = items;
        deckRef.current = deck;
        ptrRef.current = Math.min(PAGE, deck.length);
        setShown(deck.slice(0, PAGE));
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[#4E5968]"><Target className="h-4 w-4 text-[#0B46E8]" weight="fill" /> {t("준비 중인 직무", "Roles you're preparing for", "正在准备的职务", "Nghề bạn đang chuẩn bị", "準備中の職種", "Peran yang kamu siapkan")}</span>
          {jobs.map((j) => (
            <span key={j} className="inline-flex items-center rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{j}</span>
          ))}
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
                <Link key={`${p.id}:${i}`} href={`/talent/jobs/${p.id}`} className="cl-gate">
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
                  <ArrowRight className="cl-gate-arrow h-4 w-4" weight="bold" aria-hidden />
                </Link>
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
    </div>
  );
}

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

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const prog = await fetchProgress().catch(() => null);
        const sel = Array.isArray(prog?.selectedJobs) ? prog!.selectedJobs!.filter((j) => j?.trim()) : [];
        if (alive) setJobs(sel);

        let items: PublicPositionListItem[] = [];
        if (sel.length) {
          const queries = sel.map((r) => RECOMMENDED_JOBS.find((j) => j.role === r)?.query || r);
          const pages = await Promise.all(queries.map((s) => getPublicPositionsPage({ search: s, limit: 20 }).catch(() => null)));
          const seen = new Set<string>();
          for (const pg of pages) {
            for (const it of pg?.items ?? []) {
              if (seen.has(it.id)) continue;
              seen.add(it.id);
              items.push(it);
            }
          }
        } else {
          items = (await getRecommendedPositions({ limit: 20 }).catch(() => ({ items: [] as PublicPositionListItem[] }))).items;
        }
        if (!alive) return;
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
              return (
                <Link key={`${p.id}:${i}`} href={`/talent/jobs/${p.id}`} className="flex items-start gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-3.5 transition hover:border-[#0B46E8]/40">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-[#EEF1F5] object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-[#191F28]">{p.title}</span>
                    {name ? <span className="block truncate text-[11.5px] font-semibold text-[#4E5968]">{name}</span> : null}
                    {bullets.length ? (
                      <ul className="mt-1 space-y-0.5">
                        {bullets.map((b, j) => (
                          <li key={j} className="flex gap-1.5 text-[11.5px] leading-[1.45] text-[#8B95A1]">
                            <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#C4CAD2]" />
                            <span className="min-w-0 truncate">{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </span>
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

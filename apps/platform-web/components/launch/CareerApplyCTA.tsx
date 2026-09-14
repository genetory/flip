"use client";

// 완주(또는 서류 완성) 학생을 '실제 공고 지원'으로 연결하는 핵심 핸드오프.
// 데이터상 완주자의 실제 공고 지원 전환이 0% 라, 일반 홈으로 보내는 대신
// 개인화 추천 공고를 바로 보여주고 '지원하기'로 직접 연결한다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Buildings } from "@phosphor-icons/react";
import { getRecommendedPositions, type RecommendedPositionItem } from "../../lib/member-profile-client";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";
import { useLanguage } from "../i18n/LanguageProvider";

function companyOf(p: RecommendedPositionItem): string {
  return (p.partnerOrganization?.name ?? p.sourceCompanyName ?? "").trim();
}

export function CareerApplyCTA() {
  const t = useLaunchT();
  const { locale } = useLanguage();
  const [items, setItems] = useState<RecommendedPositionItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    void getRecommendedPositions({ limit: 3, locale })
      .then((r) => {
        if (!alive) return;
        setItems((r.items ?? []).slice(0, 3));
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, [locale]);

  return (
    <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-[0_4px_16px_-8px_rgba(20,24,31,0.16)]">
      <p className="text-[10.5px] font-black uppercase tracking-[0.14em] text-[#0B46E8]">🎉 {t("4주 완주", "4 weeks done", "完成4周", "Hoàn thành 4 tuần", "4週間完走", "4 minggu selesai")}</p>
      <h3 className="mt-1.5 break-keep text-[17px] font-black leading-[1.35] tracking-[-0.01em] text-[#0B1227]">
        {t("완성한 이력서·자소서로 이제 실제 공고에 지원하세요", "Apply to real jobs with your finished resume & cover letter", "用完成的简历与自我介绍投递真实职位", "Ứng tuyển việc thật với hồ sơ và thư đã hoàn thành", "完成した履歴書・自己紹介書で実際の求人に応募しましょう", "Lamar pekerjaan nyata dengan resume & surat lamaranmu")}
      </h3>

      {items.length > 0 ? (
        <>
          <p className="mt-1.5 text-[12.5px] font-semibold text-[#8B95A1]">{t("나에게 맞춘 추천 공고예요", "Recommended for you", "为你推荐的公告", "Gợi ý cho bạn", "あなた向けのおすすめ求人", "Direkomendasikan untukmu")}</p>
          <div className="mt-3 flex flex-col gap-2">
            {items.map((p) => {
              const co = companyOf(p);
              const loc = (p.workLocation ?? "").trim() || (p.workType ?? "");
              return (
                <Link
                  key={p.id}
                  href={`/talent/jobs/${p.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCareerFunnel("career_apply_cta_clicked", { positionId: p.id })}
                  className="group flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3.5 transition hover:border-[#0B46E8]/40 hover:shadow-[0_6px_20px_-10px_rgba(11,70,232,0.3)]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block break-keep text-[14px] font-bold text-[#191F28]">{p.title}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#8B95A1]">
                      {co ? <span className="inline-flex items-center gap-1"><Buildings className="h-3.5 w-3.5" weight="duotone" aria-hidden />{co}</span> : null}
                      {loc ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" weight="duotone" aria-hidden />{loc}</span> : null}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-[#0B46E8] px-3.5 py-2 text-[12.5px] font-bold text-white transition group-hover:bg-[#0A3ECB]">
                    {t("지원하기", "Apply", "投递", "Ứng tuyển", "応募する", "Lamar")} <ArrowRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
                  </span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/talent/jobs"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCareerFunnel("career_apply_cta_seeall", {})}
            className="mt-3 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] py-3 text-[13px] font-bold text-[#0B46E8] transition hover:bg-white"
          >
            {t("맞춤 공고 전체 보기", "See all matched jobs", "查看全部匹配公告", "Xem tất cả việc phù hợp", "すべての求人を見る", "Lihat semua lowongan")} <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
          </Link>
        </>
      ) : (
        <Link
          href="/talent/jobs"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackCareerFunnel("career_apply_cta_clicked", { positionId: "all" })}
          className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-[#0B46E8] px-5 py-4 text-left text-white transition hover:bg-[#0A3ECB]"
        >
          <span className="text-[14.5px] font-black">{loaded ? t("맞춤 공고에 지원하러 가기", "Go apply to matched jobs", "去投递匹配公告", "Đi ứng tuyển", "求人に応募しに行く", "Lamar pekerjaan") : t("맞춤 공고 불러오는 중…", "Loading matched jobs…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</span>
          <ArrowRight className="h-5 w-5 shrink-0" weight="bold" aria-hidden />
        </Link>
      )}
    </div>
  );
}

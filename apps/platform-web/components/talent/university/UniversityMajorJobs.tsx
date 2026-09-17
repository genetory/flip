"use client";

// 대학 랜딩용 '전공 계열별 맞춤 공고' — 대학의 실제 단과대학을 몇 개 계열로 묶어, 계열을 고르면
// 공개 공고 검색(/positions?search=)으로 관련 공고를 보여준다. 지어낸 통계 없이 사실 기반.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Buildings, MapPin } from "@phosphor-icons/react";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { usePlatformT } from "../../../lib/i18n";
import { useLanguage } from "../../i18n/LanguageProvider";

function companyOf(p: PublicPositionListItem): string {
  return (p.partnerOrganization?.name ?? p.sourceCompanyName ?? "").trim();
}

export function UniversityMajorJobs({ accent, src, jobsHref }: { accent: string; src: string; jobsHref: string }) {
  const t = usePlatformT();
  const { locale } = useLanguage();

  // 한양대 단과대학(16개)을 취업 계열로 묶고, 각 계열을 공고 검색 키워드에 연결.
  const tracks = [
    { key: "biz", label: t("경영·경제", "Business", "经营·经济", "Kinh doanh", "経営・経済", "Bisnis"), keyword: "마케팅" },
    { key: "eng", label: t("공학·SW", "Engineering·SW", "工学·软件", "Kỹ thuật·SW", "工学・SW", "Teknik·SW"), keyword: "개발" },
    { key: "design", label: t("디자인·예술", "Design·Arts", "设计·艺术", "Thiết kế·Nghệ thuật", "デザイン・芸術", "Desain·Seni"), keyword: "디자인" },
    { key: "social", label: t("인문·사회", "Humanities·Social", "人文·社会", "Nhân văn·Xã hội", "人文・社会", "Humaniora·Sosial"), keyword: "기획" },
    { key: "data", label: t("자연·데이터", "Science·Data", "自然·数据", "Khoa học·Dữ liệu", "自然・データ", "Sains·Data"), keyword: "데이터" },
    { key: "global", label: t("국제·영업", "Global·Sales", "国际·销售", "Quốc tế·Kinh doanh", "国際・営業", "Global·Sales"), keyword: "영업" }
  ];

  const [sel, setSel] = useState(0);
  const [jobs, setJobs] = useState<PublicPositionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void getPublicPositionsPage({ search: tracks[sel].keyword, limit: 4, sort: "latest", locale })
      .then((r) => {
        if (alive) {
          setJobs((r.items ?? []).slice(0, 4));
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) {
          setJobs([]);
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, locale]);

  return (
    <section className="mx-auto max-w-5xl px-5 pb-14">
      <h2 className="break-keep text-[20px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[24px]">
        {t("전공 계열별 맞춤 공고", "Jobs by your major", "按专业方向的公告", "Việc theo ngành học", "専攻系列別のおすすめ求人", "Lowongan sesuai jurusan")}
      </h2>
      <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("계열을 고르면 관련 공고를 보여드려요.", "Pick your track to see related jobs.", "选择方向查看相关公告。", "Chọn ngành để xem việc liên quan.", "系列を選ぶと関連求人を表示。", "Pilih jalur untuk lihat lowongan.")}</p>

      {/* 계열 칩 */}
      <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        {tracks.map((tr, i) => (
          <button
            key={tr.key}
            type="button"
            onClick={() => setSel(i)}
            aria-pressed={sel === i}
            className="shrink-0 rounded-full border px-3.5 py-2 text-[13px] font-bold transition"
            style={sel === i ? { borderColor: accent, backgroundColor: `${accent}12`, color: accent } : { borderColor: "#E5E8EB", color: "#4E5968" }}
          >
            {tr.label}
          </button>
        ))}
      </div>

      {/* 결과 */}
      {loading ? (
        // 로딩 스켈레톤 — 실제 공고 카드(4개) 레이아웃과 동일한 그리드.
        <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white px-4 py-4">
              <span className="min-w-0 flex-1">
                <span className="block h-[15px] w-[72%] animate-pulse rounded-md bg-[#EAEDF1]" />
                <span className="mt-2 flex items-center gap-2">
                  <span className="h-[11px] w-[84px] animate-pulse rounded bg-[#F1F3F6]" />
                  <span className="h-[11px] w-[60px] animate-pulse rounded bg-[#F1F3F6]" />
                </span>
              </span>
              <span className="h-4 w-4 shrink-0 animate-pulse rounded bg-[#EAEDF1]" />
            </div>
          ))}
        </div>
      ) : jobs.length > 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {jobs.map((p) => {
            const co = companyOf(p);
            const loc = (p.workLocation ?? "").trim() || (p.workType ?? "");
            return (
              <Link
                key={p.id}
                href={`/talent/jobs/${p.id}?src=${encodeURIComponent(src)}`}
                className="group flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white px-4 py-4 transition hover:shadow-[0_8px_24px_-14px_rgba(11,18,39,0.35)]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block break-keep text-[14.5px] font-bold text-[#191F28]">{p.title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-[#8B95A1]">
                    {co ? <span className="inline-flex items-center gap-1"><Buildings className="h-3.5 w-3.5" weight="duotone" aria-hidden />{co}</span> : null}
                    {loc ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" weight="duotone" aria-hidden />{loc}</span> : null}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-0.5" style={{ color: accent }} weight="bold" aria-hidden />
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] px-4 py-6 text-center">
          <p className="text-[13px] text-[#8B95A1]">{t("이 계열 맞춤 공고는 준비 중이에요.", "Curated jobs for this track are coming soon.", "该方向的公告正在准备中。", "Việc cho ngành này sắp có.", "この系列の求人は準備中です。", "Lowongan jalur ini segera hadir.")}</p>
        </div>
      )}

      <Link href={jobsHref} className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold" style={{ color: accent }}>
        {t("전체 공고 보기", "See all jobs", "查看全部公告", "Xem tất cả", "すべての求人を見る", "Lihat semua")} <ArrowRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
      </Link>
    </section>
  );
}

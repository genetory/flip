"use client";

// 취업 가이드 상세 본문 — lib/talent/insights-content.ts 의 글을 그대로 보여 준다.
// 팝업에서 보던 것과 같은 글이고, 여기서는 주소를 가진 페이지로 읽을 수 있다.
import Link from "next/link";
import { usePlatformT } from "../../../lib/i18n";
import { jobHunting, roleInsights } from "../../../lib/talent/insights-content";
import { categoryLabelKo, type InsightMeta } from "../../../lib/insights/catalog";
import { trackInsightCtaClick } from "../../../lib/analytics";

export function InsightArticle({ meta }: { meta: InsightMeta }) {
  const t = usePlatformT();
  const guide = [...roleInsights(t), ...jobHunting(t)].find((g) => g.slug === meta.slug);

  if (!guide) {
    return <p className="text-[13.5px] text-[#8B95A1]">{t("내용을 불러오지 못했어요.", "Couldn't load this guide.")}</p>;
  }

  return (
    <article>
      <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">{categoryLabelKo(meta.category)}</p>
      <h1 className="mt-2 break-keep text-[23px] font-black leading-snug tracking-[-0.025em] text-[#191F28] md:text-[27px]">
        {guide.title.replace(/\n/g, " ")}
      </h1>
      <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#4E5968]">{guide.desc}</p>

      <div className="mt-6 flex flex-col gap-5">
        {guide.body.map((b, i) => (
          <section key={i}>
            <h2 className="break-keep text-[16px] font-black tracking-[-0.02em] text-[#191F28]">{b.heading}</h2>
            <p className="mt-1.5 break-keep text-[14px] leading-[1.75] text-[#4E5968]">{b.text}</p>
          </section>
        ))}
      </div>

      {meta.relatedVisas?.length ? (
        <section className="mt-7">
          <h2 className="text-[14px] font-black text-[#191F28]">{t("관련 비자", "Related visas")}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meta.relatedVisas.map((code) => (
              <Link
                key={code}
                href={`/talent/visa/${encodeURIComponent(code)}`}
                onClick={() => trackInsightCtaClick(meta.slug, "visa")}
                className="inline-flex items-center rounded-full border border-[#E5E8EB] bg-white px-3 py-1.5 text-[13px] font-bold text-[#333D4B] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
              >
                {code}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* 문맥에 맞는 primary CTA 하나 */}
      <div className="mt-8">
        {meta.category === "jobs" ? (
          <Link
            href={meta.relatedJobQuery ? `/talent/jobs?q=${encodeURIComponent(meta.relatedJobQuery)}` : "/talent/jobs"}
            onClick={() => trackInsightCtaClick(meta.slug, "jobs")}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white"
          >
            {t("관련 공고 보기", "See related jobs")}
          </Link>
        ) : meta.category === "resume" ? (
          <Link
            href="/talent/career/resume/editor"
            onClick={() => trackInsightCtaClick(meta.slug, "resume")}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white"
          >
            {t("내 경험으로 이력서 쓰기", "Write my resume")}
          </Link>
        ) : (
          <Link
            href="/talent/jobs"
            onClick={() => trackInsightCtaClick(meta.slug, "interview")}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white"
          >
            {t("공고로 모의면접 연습하기", "Practice with a job posting")}
          </Link>
        )}
      </div>

      {/* 작성·검토 정보 — 검토일이 없으면 "미확인"으로 적고 날짜를 꾸미지 않는다. */}
      <aside className="mt-6 rounded-xl border border-[#EEF1F5] bg-[#FAFBFC] px-3.5 py-3 text-[12px] leading-relaxed text-[#6B7684]">
        <p>
          <span className="font-bold text-[#4E5968]">{t("작성", "Published")}</span> {meta.publishedAt} ·{" "}
          <span className="font-bold text-[#4E5968]">{t("마지막 검토", "Last reviewed")}</span>{" "}
          {meta.reviewedAt ?? t("미확인", "not confirmed")}
          {meta.reviewedBy ? ` · ${meta.reviewedBy}` : ""}
        </p>
        <p className="mt-1">{t("작성 주체", "Written by")} APLY</p>
        <p className="mt-1.5">
          {t(
            "일반적인 안내예요. 회사·직무마다 다를 수 있고, 비자 요건은 출입국 판단에 따라 달라져요.",
            "General guidance. It varies by company and role, and visa requirements depend on immigration review."
          )}
        </p>
      </aside>
    </article>
  );
}

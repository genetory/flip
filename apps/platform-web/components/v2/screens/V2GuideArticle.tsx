"use client";

// v2 취업 가이드 글 읽기 — 예전 팝업 대신 글마다 화면(/v2/guide/[slug]).
// 위쪽 읽기 진행 막대 · 큰 제목 · 목차(눌러서 그 항목으로) · 17px 본문 · 글 끝 관련 행동 버튼 · 다음 글.
import { useEffect, useState } from "react";
import Link from "next/link";
import { V2Shell } from "../V2Shell";
import { Button, Page } from "../ui";
import { usePlatformT } from "../../../lib/i18n";
import { GUIDE_TONE, guideCatLabel, toV2Href, v2Guides } from "../../../lib/talent/v2-guides";

export function V2GuideArticle({ slug }: { slug: string }) {
  return (
    <V2Shell>
      <Article slug={slug} />
    </V2Shell>
  );
}

function Article({ slug }: { slug: string }) {
  const t = usePlatformT();
  const guides = v2Guides(t);
  const idx = guides.findIndex((g) => g.slug === slug);
  const g = idx >= 0 ? guides[idx] : null;
  const progress = useReadProgress();

  if (!g)
    return (
      <Page>
        <div className="px-5 py-16 text-center">
          <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{t("글을 찾을 수 없어요", "Article not found", "找不到文章", "Không tìm thấy bài", "記事が見つかりません", "Artikel tidak ditemukan")}</p>
          <div className="mt-5">
            <Button variant="neutral" href="/v2/guide">
              {t("가이드 목록으로", "Back to guides", "返回指南", "Về danh sách", "ガイド一覧へ", "Kembali")}
            </Button>
          </div>
        </div>
      </Page>
    );

  const tone = GUIDE_TONE[g.cat];
  // 다음 글 — 같은 분류의 다음 글, 없으면 전체에서 다음 글.
  const sameCat = guides.filter((x) => x.cat === g.cat);
  const next = sameCat[sameCat.findIndex((x) => x.slug === g.slug) + 1] ?? guides[(idx + 1) % guides.length];
  const cta = toV2Href(g.guide.href);
  const jump = (i: number) => document.getElementById(`sec-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <Page>
      {/* 읽기 진행 막대 — 화면 맨 위에 붙는다 */}
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent" aria-hidden>
        <div className="h-full bg-[color:var(--v2-accent)] transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      <article className="px-5 pb-10 pt-6 md:pt-10">
        <Link href="/v2/guide" className="text-[14px] font-semibold text-[color:var(--v2-muted)] hover:text-[color:var(--v2-ink-3)]">
          ‹ {t("취업 가이드", "Career guide", "求职指南", "Hướng dẫn", "就活ガイド", "Panduan karier")}
        </Link>

        {/* 표지 */}
        <div className={`mt-4 rounded-3xl p-6 ${tone.bg}`}>
          <span className="flex items-center justify-between gap-2">
            <span className={`text-[13px] font-bold ${tone.ink}`}>{guideCatLabel(t, g.cat)}</span>
            <span className="text-[40px] leading-none" aria-hidden>
              {g.guide.emoji}
            </span>
          </span>
          <h1 className="mt-3 whitespace-pre-line text-[26px] font-bold leading-[1.35] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">{g.guide.title}</h1>
          <p className="mt-2 text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">{g.guide.desc}</p>
          <p className="mt-4 text-[13px] font-semibold text-[color:var(--v2-muted)]">{t(`${g.minutes}분이면 읽어요 · ${g.guide.body.length}개 항목`, `${g.minutes} min read · ${g.guide.body.length} parts`, `${g.minutes} 分钟读完 · ${g.guide.body.length} 部分`, `${g.minutes} phút · ${g.guide.body.length} phần`, `${g.minutes}分で読めます · ${g.guide.body.length}項目`, `${g.minutes} menit · ${g.guide.body.length} bagian`)}</p>
        </div>

        {/* 목차 — 누르면 그 항목으로 */}
        {g.guide.body.length > 1 ? (
          <nav className="mt-6" aria-label={t("목차", "Contents", "目录", "Mục lục", "目次", "Daftar isi")}>
            <p className="text-[13px] font-bold text-[color:var(--v2-muted)]">{t("목차", "Contents", "目录", "Mục lục", "目次", "Daftar isi")}</p>
            <ol className="mt-2 flex flex-col">
              {g.guide.body.map((b, i) => (
                <li key={b.heading}>
                  <button type="button" onClick={() => jump(i)} className="flex w-full items-center gap-3 rounded-xl py-2 text-left text-[15px] text-[color:var(--v2-ink-2)] transition hover:text-[color:var(--v2-accent)]">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${tone.bg} ${tone.ink}`}>{i + 1}</span>
                    <span className="min-w-0 truncate">{plainHeading(b.heading)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {/* 본문 */}
        <div className="mt-8 flex flex-col gap-9">
          {g.guide.body.map((b, i) => (
            <section key={b.heading} id={`sec-${i}`} className="scroll-mt-32">
              <h2 className="flex items-baseline gap-2 text-[20px] font-bold leading-[1.4] tracking-[-0.01em] text-[color:var(--v2-ink)]">
                <span className={`text-[15px] ${tone.ink}`}>{String(i + 1).padStart(2, "0")}</span>
                {plainHeading(b.heading)}
              </h2>
              <p className="mt-3 whitespace-pre-line break-keep text-[17px] leading-[1.85] text-[color:var(--v2-ink-2)]">{b.text}</p>
            </section>
          ))}
        </div>

        {/* 글 끝 — 관련 행동 */}
        {cta && g.guide.ctaLabel ? (
          <div className="mt-10 rounded-3xl bg-[color:var(--v2-band)] p-5">
            <p className="text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink)]">{t("읽은 김에 바로 해 볼까요?", "Try it right now?", "读完马上试试？", "Thử ngay nhé?", "読んだついでにやってみましょう", "Coba sekarang?")}</p>
            <div className="mt-3">
              <Button full href={cta}>
                {g.guide.ctaLabel}
              </Button>
            </div>
          </div>
        ) : null}

        {/* 다음 글 */}
        {next && next.slug !== g.slug ? (
          <Link href={`/v2/guide/${next.slug}`} className={`mt-4 flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5 ${GUIDE_TONE[next.cat].bg}`}>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-bold ${GUIDE_TONE[next.cat].ink}`}>{t("다음 글", "Next", "下一篇", "Bài tiếp", "次の記事", "Berikutnya")}</span>
              <span className="mt-1 block truncate text-[17px] font-bold text-[color:var(--v2-ink)]">{next.guide.title.replace(/\n/g, " ")}</span>
              <span className="mt-0.5 block text-[13px] text-[color:var(--v2-muted)]">{t(`${next.minutes}분`, `${next.minutes} min`, `${next.minutes} 分钟`, `${next.minutes} phút`, `${next.minutes}分`, `${next.minutes} mnt`)}</span>
            </span>
            <span className="text-[30px] leading-none" aria-hidden>
              {next.guide.emoji}
            </span>
          </Link>
        ) : null}
      </article>
    </Page>
  );
}

/** 항목 제목 앞에 이미 붙은 번호("1. ")는 뗀다 — 화면이 번호를 따로 붙인다. */
function plainHeading(h: string): string {
  return h.replace(/^\s*\d+[.)]\s*/, "");
}

/** 읽기 진행률(0~100) — 문서 스크롤 위치로. */
function useReadProgress(): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return p;
}

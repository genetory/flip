"use client";

// v2 홈 — 로그인하지 않은 사람용. 같은 주소(/v2/home)에서 로그인 여부로 갈린다.
// 로그인 홈과 같은 모양(배너 · 서류·모의 면접 칸 · 목록)으로 "가입하면 이렇게 쓰게 된다"를 보여 주고, 공개 데이터(공고·회사·가이드)는 그대로 보여 준다.
// 가입이 필요한 행동은 모두 가입으로 보낸다(돌아올 곳 next=/v2/home).
import { useEffect, useState } from "react";
import Link from "next/link";
import { V2_ROUTES } from "../V2Shell";
import { FeaturedBanners } from "../../talent/screens/HomeScreen";
import { Button, Masthead, Page, Row, RowsSkeleton, Section, SectionSkeleton } from "../ui";
import { jobPhotoOf, companyOf } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT } from "../../../lib/i18n";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { careerGuides } from "../../../lib/talent/home-content";
import { careerGuideHref } from "../../../lib/talent/v2-guides";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";
import { pickDailyQuestion, kstDay, questionText } from "../../../lib/talent/interview-daily";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";

const SIGNUP = `/talent/signup?next=${encodeURIComponent("/v2/home")}`;
const LOGIN = `/talent/login?next=${encodeURIComponent("/v2/home")}`;

type Company = { name: string; industry?: string; count: number; photo: string | null };

export function V2GuestHome() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [jobs, setJobs] = useState<PublicPositionListItem[] | null>(null);
  const [totals, setTotals] = useState<{ all: number; foreign: number } | null>(null);
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [now] = useState(() => Date.now());
  const daily = pickDailyQuestion(null, kstDay(now));

  useEffect(() => {
    getPublicPositionsPage({ limit: 4, sort: "latest", locale })
      .then((p) => setJobs(p.items))
      .catch(() => setJobs([]));
    Promise.all([getPublicPositionsPage({ page: 1, limit: 1, locale }), getPublicPositionsPage({ page: 1, limit: 1, foreignerEligible: true, locale })])
      .then(([a, f]) => setTotals({ all: a.total ?? 0, foreign: f.total ?? 0 }))
      .catch(() => setTotals(null));
    // 이런 회사 — 직접 채용 중인 회사 중 셋(로그인 홈과 같은 규칙).
    getPublicPositionsPage({ limit: 60, sourceProviders: ["INTERNAL"], locale })
      .then((p) => {
        const map = new Map<string, Company>();
        for (const j of p.items) {
          const org = j.partnerOrganization;
          if (!org?.name) continue;
          const e = map.get(org.name) ?? { name: org.name, industry: org.industry ? partnerIndustryLabel(org.industry) : undefined, count: 0, photo: org.officePhotoImageData || org.companyLogoImageData || null };
          e.count += 1;
          map.set(org.name, e);
        }
        setCompanies([...map.values()].sort((a, b) => b.count - a.count).slice(0, 3));
      })
      .catch(() => setCompanies([]));
  }, [locale]);

  return (
    <Page>
      {/* 배너 슬라이드가 안쪽에 6·8px 여백을 갖고 있어 그만큼 덜어 본문 왼쪽 선(20px)에 맞춘다(로그인 홈과 같다). */}
      <div className="px-3.5 pt-5 md:px-3 md:pt-8">
        <FeaturedBanners />
      </div>

      <Masthead
        eyebrow={t("유학생·첫 취업 준비생을 위한", "For international students & first-time job seekers", "为留学生和首次求职者", "Dành cho du học sinh & người tìm việc lần đầu", "留学生・初めての就活生のための", "Untuk pelajar internasional & pencari kerja pertama")}
        title={t("첫 이력서부터 첫 지원까지, Aply와 함께", "From your first resume to your first application", "从第一份简历到第一次投递", "Từ CV đầu tiên đến lần ứng tuyển đầu tiên", "初めての履歴書から初めての応募まで", "Dari CV pertama hingga lamaran pertama")}
        lede={t("경험을 말하듯 적으면 AI가 이력서·자기소개서로 정리하고, 실제 공고로 모의 면접까지 연습해요.", "Write your experience like you talk — AI turns it into a resume and cover letter, and you practice interviews for real jobs.", "像聊天一样写下经历，AI 帮你整理成简历和自我介绍，还能用真实职位练习模拟面试。", "Viết kinh nghiệm như đang kể — AI biến thành CV và thư giới thiệu, rồi luyện phỏng vấn với tin thật.", "経験を話すように書けば、AIが履歴書・自己紹介書に整え、実際の求人で模擬面接まで練習できます。", "Tulis pengalamanmu seperti bercerita — AI menyusunnya jadi CV dan surat lamaran, lalu latihan wawancara.")}
        action={
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex">
            <Button href={SIGNUP}>{t("시작하기", "Get started", "开始使用", "Bắt đầu", "はじめる", "Mulai")}</Button>
            <Button variant="secondary" href={LOGIN}>
              {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Button>
          </div>
        }
      />

      {/* 가입하면 쓰게 되는 셋 — 로그인 홈 맨 위 칸과 같은 모양(이력서·자기소개서 두 칸 + 모의 면접 한 줄) */}
      <div className="-mt-2 px-5 pb-8">
        <div className="grid grid-cols-2 gap-2.5">
          <FeatureTile
            img="/img_resume.webp"
            label={t("이력서", "Resume", "简历", "CV", "履歴書", "CV")}
            line={t("말하듯 쓰면 AI가 정리", "Write naturally, AI tidies", "随意写，AI 整理", "Viết tự nhiên, AI sắp xếp", "話すように書けばAIが整理", "Tulis santai, AI rapikan")}
            cta={t("써 보기", "Try it", "试试看", "Dùng thử", "試してみる", "Coba")}
          />
          <FeatureTile
            img="/img_coverletter.webp"
            label={t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}
            line={t("공고에 맞춰 AI 초안", "AI drafts for each job", "按职位 AI 起草", "AI soạn theo tin", "求人に合わせてAI下書き", "AI buat draf per lowongan")}
            cta={t("써 보기", "Try it", "试试看", "Dùng thử", "試してみる", "Coba")}
          />
        </div>
        <Link href={SIGNUP} className="mt-2.5 flex min-h-[104px] items-center gap-3 rounded-3xl bg-[color:var(--v2-band)] px-5 py-6 transition hover:-translate-y-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림(흰 바탕 → 곱하기 합성) */}
          <img src="/img_fake_interview.webp" alt="" aria-hidden className="-my-2 -ml-1 h-[48px] w-[60px] shrink-0 object-contain mix-blend-multiply min-[360px]:h-[76px] min-[360px]:w-[100px]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[17px] font-bold text-[color:var(--v2-ink)]">{t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Simulasi")}</span>
            <span className="mt-0.5 block text-[13px] leading-[1.45] text-[color:var(--v2-ink-3)]">{t("실제 공고로 연습하고 바로 피드백", "Practice for real jobs, instant feedback", "用真实职位练习，即时反馈", "Luyện với tin thật, phản hồi ngay", "実際の求人で練習、すぐフィードバック", "Latihan lowongan nyata, umpan balik cepat")}</span>
          </span>
        </Link>
      </div>

      {/* 지금 올라온 공고 — 공개 데이터 */}
      <Section
        title={t("지금 올라온 공고", "Latest jobs", "最新职位", "Việc làm mới", "新着求人", "Lowongan terbaru")}
        aside={totals ? <span className="text-[14px] text-[color:var(--v2-muted)]">{t(`전체 ${totals.all.toLocaleString()}개`, `${totals.all.toLocaleString()} total`, `共 ${totals.all.toLocaleString()} 个`, `${totals.all.toLocaleString()} tin`, `全${totals.all.toLocaleString()}件`, `${totals.all.toLocaleString()} total`)}</span> : undefined}
      >
        {jobs === null ? (
          <RowsSkeleton count={4} />
        ) : (
          jobs.map((j) => (
            <Row key={j.id} href={`/v2/jobs/${j.id}`} thumb={{ src: jobPhotoOf(j), fallback: companyOf(j) || j.title }} title={j.title} meta={[companyOf(j), (j.workLocation || "").split(" ").slice(0, 2).join(" ")].filter(Boolean).join(" · ") || undefined} />
          ))
        )}
        <div className="mt-3">
          <Button variant="neutral" full href={V2_ROUTES.jobs}>
            {t("더 보기", "See more", "查看更多", "Xem thêm", "もっと見る", "Lihat lagi")}
          </Button>
        </div>
      </Section>

      {/* 오늘의 면접 질문 — 맛보기. 답하고 AI 피드백은 가입 후. */}
      <Section title={t("오늘의 면접 질문", "Today's interview question", "今日面试题", "Câu hỏi phỏng vấn hôm nay", "今日の面接質問", "Pertanyaan hari ini")}>
        <div className="rounded-3xl bg-[#fff4e8] p-5">
          <span className="text-[13px] font-bold text-[#c2410c]">{mockCategoryLabelOf(t, daily.category)}</span>
          <p className="mt-1.5 text-[18px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questionText(t, daily)}</p>
          {locale !== "ko" ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {daily.ko}</p> : null}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[14px] text-[color:var(--v2-ink-3)]">{t("답하면 AI가 잘한 점과 고칠 점을 알려 줘요", "Answer and AI shows what worked and what to fix", "作答后 AI 会指出优点和改进点", "Trả lời để AI chỉ điểm tốt và cần sửa", "答えるとAIが良い点と直す点を教えます", "Jawab, AI beri tahu yang bagus & perlu diperbaiki")}</span>
            <Button size="sm" href={SIGNUP}>
              {t("답해 보기", "Try it", "试着回答", "Thử trả lời", "答えてみる", "Coba")}
            </Button>
          </div>
        </div>
      </Section>

      {/* 외국인 — 비자 안내 */}
      <Section title={t("외국인이라면", "For international job seekers", "如果你是外国人", "Nếu bạn là người nước ngoài", "外国籍の方へ", "Untuk WNA")}>
        <Link href="/talent/visa" className="flex items-center gap-4 rounded-3xl bg-[#edf1fd] p-5 transition hover:-translate-y-0.5">
          <span className="min-w-0 flex-1">
            <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t("내 비자로 지원할 수 있는 곳", "Jobs open to your visa", "你的签证可申请的职位", "Việc phù hợp visa của bạn", "自分のビザで応募できる求人", "Lowongan sesuai visamu")}</span>
            <span className="mt-1 block text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">
              {totals?.foreign
                ? t(`외국인 지원 가능 공고 ${totals.foreign.toLocaleString()}개와 비자별 취업 안내(D-2·D-10·E-7)를 모아 뒀어요.`, `${totals.foreign.toLocaleString()} foreigner-friendly jobs plus visa guides (D-2, D-10, E-7).`, `汇总了 ${totals.foreign.toLocaleString()} 个外国人可申请的职位和签证就业指南（D-2·D-10·E-7）。`, `${totals.foreign.toLocaleString()} việc cho người nước ngoài và hướng dẫn visa (D-2, D-10, E-7).`, `外国人応募可の求人${totals.foreign.toLocaleString()}件とビザ別ガイド（D-2・D-10・E-7）。`, `${totals.foreign.toLocaleString()} lowongan untuk WNA dan panduan visa (D-2, D-10, E-7).`)
                : t("외국인 지원 가능 공고와 비자별 취업 안내(D-2·D-10·E-7)를 모아 뒀어요.", "Foreigner-friendly jobs plus visa guides (D-2, D-10, E-7).", "汇总了外国人可申请的职位和签证就业指南（D-2·D-10·E-7）。", "Việc cho người nước ngoài và hướng dẫn visa (D-2, D-10, E-7).", "外国人応募可の求人とビザ別ガイド（D-2・D-10・E-7）。", "Lowongan untuk WNA dan panduan visa (D-2, D-10, E-7).")}
            </span>
            <span className="mt-3 flex flex-wrap gap-1.5">
              {["한국어", "English", "中文", "Tiếng Việt", "日本語", "Bahasa"].map((l) => (
                <span key={l} className="rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold text-[color:var(--v2-ink-3)]">
                  {l}
                </span>
              ))}
            </span>
          </span>
          <span className="shrink-0 text-[20px] text-[color:var(--v2-faint)]" aria-hidden>
            ›
          </span>
        </Link>
      </Section>

      {/* 이런 회사 */}
      {companies === null ? (
        <SectionSkeleton />
      ) : companies.length ? (
        <Section title={t("Aply에서 채용 중인 회사", "Companies hiring on Aply", "在 Aply 招聘的公司", "Công ty tuyển trên Aply", "Aplyで採用中の企業", "Perusahaan di Aply")}>
          {companies.map((c) => (
            <Row key={c.name} href={`/talent/company/${encodeURIComponent(c.name)}`} thumb={{ src: c.photo, fallback: c.name }} title={c.name} meta={[c.industry, t(`채용 중 ${c.count}`, `${c.count} open`, `在招 ${c.count}`, `${c.count} vị trí`, `募集中 ${c.count}`, `${c.count} lowongan`)].filter(Boolean).join(" · ")} />
          ))}
          <div className="mt-3">
            <Button variant="neutral" full href="/v2/companies">
              {t("더 보기", "See more", "查看更多", "Xem thêm", "もっと見る", "Lihat lagi")}
            </Button>
          </div>
        </Section>
      ) : null}

      <Section title={t("취업 가이드", "Career guide", "求职指南", "Hướng dẫn", "就活ガイド", "Panduan karier")}>
        {careerGuides(t)
          .slice(0, 3)
          .map((g, i) => (
            <Row key={g.title} href={careerGuideHref(i)} lead={g.emoji} title={g.title.replace(/\n/g, " ")} meta={g.desc} />
          ))}
      </Section>

      {/* 마지막 가입 권유 */}
      <div className="px-5 pb-4 pt-4">
        <div className="rounded-3xl bg-[color:var(--v2-ink)] px-6 py-7 text-white">
          <p className="text-[20px] font-bold leading-[1.4]">{t("1분이면 가입 끝", "Sign up in a minute", "1 分钟完成注册", "Đăng ký trong 1 phút", "1分で登録完了", "Daftar dalam 1 menit")}</p>
          <p className="mt-1.5 text-[14px] leading-[1.6] text-white/75">{t("이메일이나 구글·카카오 계정으로 바로 시작해요.", "Start right away with email or Google/Kakao.", "用邮箱或 Google/Kakao 账号即可开始。", "Bắt đầu ngay bằng email hoặc Google/Kakao.", "メールかGoogle・Kakaoですぐ始められます。", "Mulai dengan email atau Google/Kakao.")}</p>
          <div className="mt-5">
            <Link href={SIGNUP} className="flex h-12 items-center justify-center rounded-xl bg-white text-[16px] font-semibold text-[color:var(--v2-ink)] transition hover:opacity-90">
              {t("시작하기", "Get started", "开始使用", "Bắt đầu", "はじめる", "Mulai")}
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}

/** 가입하면 쓰게 되는 기능 칸 — 로그인 홈 서류 칸과 같은 모양(왼쪽 글·오른쪽 그림), 누르면 가입. */
function FeatureTile({ img, label, line, cta }: { img: string; label: string; line: string; cta: string }) {
  return (
    <Link href={SIGNUP} className="flex min-h-[132px] flex-col justify-between rounded-3xl bg-[color:var(--v2-band)] p-4 transition hover:-translate-y-0.5 min-[360px]:p-5">
      <span className="flex flex-col-reverse gap-2 min-[360px]:flex-row min-[360px]:items-start">
        <span className="min-w-0 flex-1">
          <span className="block truncate whitespace-nowrap text-[16px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[17px]">{label}</span>
          <span className="mt-1 block text-[13px] leading-[1.45] text-[color:var(--v2-ink-3)]">{line}</span>
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림 */}
        <img src={img} alt="" aria-hidden className="h-[72px] w-full shrink-0 object-contain mix-blend-multiply min-[360px]:-mr-1 min-[360px]:h-[60px] min-[360px]:w-[48px] min-[400px]:h-[68px] min-[400px]:w-[72px] md:h-[84px] md:w-[112px]" />
      </span>
      <span className="mt-3 text-[14px] font-semibold text-[color:var(--v2-accent)]">{cta} ›</span>
    </Link>
  );
}

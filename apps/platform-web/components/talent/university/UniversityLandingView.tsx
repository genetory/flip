"use client";

// 대학별 공개 랜딩(talent) — 메뉴에 없고 slug 로만 진입. 공동 브랜딩 히어로 + 적응형 CTA
// (진행 기수 있으면 프로그램 시작, 없으면 가입) + 프로그램 가치 + 실시간 공개 공고 + 유입 귀속.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkle, Microphone, PaperPlaneTilt } from "@phosphor-icons/react";
import type { UniversityLanding } from "../../../lib/talent/university-landing";
import { usePlatformT } from "../../../lib/i18n";
import { UniversityDiagnosisTeaser } from "./UniversityDiagnosisTeaser";
import { UniversityMajorJobs } from "./UniversityMajorJobs";
import { LanguageSwitcher } from "../../i18n/LanguageSwitcher";
import { talentRoutes } from "../../../lib/talent/landing-content";
import { trackUniversityLandingViewed, trackUniversityCtaClicked } from "../../../lib/analytics";

export function UniversityLandingView({ data }: { data: UniversityLanding }) {
  const t = usePlatformT();
  const router = useRouter();
  // 캠페인 채널(설명회 부스·포스터·온라인 등) — ?c=<채널> 로 구분해 유입 귀속.
  const [campaign, setCampaign] = useState<string | undefined>(undefined);
  // 커리어런치 기수 코드 입력 — 입력값으로 커리어런치 초대 링크로 연결.
  // 레지스트리에 기수 코드 프리셋이 있으면 미리 채운다.
  const [launchCode, setLaunchCode] = useState(data.careerLaunchInvite ?? "");

  const src = `uni:${data.slug}`;
  // 한국어 히어로/CTA 톤 — 대학 정체성 표현(예: '한양인')이 있으면 그걸 쓴다.
  const koWho = data.demonym ?? `${data.shortName} 학생`;
  // 커리어런치 연결 링크(기수 코드 프리셋이 있으면 초대 링크, 없으면 커리어런치 홈).
  const careerLaunchHref = data.careerLaunchInvite
    ? `/career-launch?invite=${encodeURIComponent(data.careerLaunchInvite)}&src=${encodeURIComponent(src)}`
    : `/career-launch?src=${encodeURIComponent(src)}`;
  const jobsHref = `${talentRoutes.jobs ?? "/talent/jobs"}?src=${encodeURIComponent(src)}`;

  // 커리어런치 접속 — 코드가 있으면 초대(기수 등록) 링크로, 없으면 커리어런치 홈으로.
  const goCareerLaunch = () => {
    const code = launchCode.trim();
    const params = new URLSearchParams({ src });
    if (code) params.set("invite", code);
    trackUniversityCtaClicked(data.slug, "primary", campaign);
    router.push(`/career-launch?${params.toString()}`);
  };

  // 유입 귀속 — 가입/기수등록까지 이어지도록 출처·캠페인을 저장하고, 조회 이벤트 계측.
  useEffect(() => {
    let c: string | undefined;
    try {
      const raw = new URLSearchParams(window.location.search).get("c");
      c = raw ? raw.trim().slice(0, 40) : undefined;
    } catch {
      c = undefined;
    }
    setCampaign(c);
    try {
      window.localStorage.setItem("aply_acq_src", src);
      if (c) window.localStorage.setItem("aply_acq_campaign", c);
    } catch {
      /* 저장 실패 무시 */
    }
    trackUniversityLandingViewed(data.slug, c);
  }, [data.slug, src]);

  const values = [
    {
      icon: Sparkle,
      title: t("AI 이력서·자소서", "AI resume & cover", "AI 简历与自我介绍", "CV & thư AI", "AI履歴書・自己紹介", "Resume & surat AI"),
      desc: t("대화만으로 이력서·자기소개서를 완성해요.", "Finish your resume and cover letter just by chatting.", "只需对话即可完成简历与自我介绍。", "Hoàn thành CV và thư chỉ bằng trò chuyện.", "会話だけで履歴書・自己紹介書が完成。", "Selesaikan resume & surat lewat percakapan.")
    },
    {
      icon: Microphone,
      title: t("실전 모의면접", "Real mock interviews", "实战模拟面试", "Phỏng vấn thử thực tế", "実践模擬面接", "Wawancara simulasi"),
      desc: t("직무·공고 맞춤 질문으로 면접을 연습해요.", "Practice with questions tailored to your role and target job.", "用贴合职务与公告的问题练习面试。", "Luyện tập với câu hỏi theo vị trí và tin tuyển dụng.", "職務・求人に合わせた質問で面接練習。", "Latihan dengan pertanyaan sesuai peran & lowongan.")
    },
    {
      icon: PaperPlaneTilt,
      title: t("실제 지원 연결", "Apply to real jobs", "连接真实投递", "Kết nối ứng tuyển thật", "実際の応募へ", "Lamar pekerjaan nyata"),
      desc: t("완성한 서류로 바로 실제 공고에 지원해요.", "Apply to real openings with the documents you finished.", "用完成的材料直接投递真实公告。", "Ứng tuyển việc thật bằng hồ sơ đã hoàn thành.", "完成した書類でそのまま実際の求人に応募。", "Lamar lowongan nyata dengan dokumenmu.")
    }
  ];

  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#191F28]">
      {/* 상단 바 */}
      <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/talent" aria-label="Aply" className="flex items-center">
            <Image src="/img_logo.webp" alt="Aply" width={72} height={24} className="h-5 w-auto" priority />
          </Link>
          <div className="flex items-center gap-1.5">
            <Link href={talentRoutes.login} className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[#4E5968] transition hover:text-[#191F28]">
              {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* 히어로 — 대학 강조색 그라데이션 */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${data.accent} 0%, ${data.accentDeep} 100%)` }}
      >
        <div className="mx-auto max-w-5xl px-5 py-14 md:py-20">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">APLY × {data.shortName}</p>
          {data.logoUrl ? (
            <Image
              src={data.logoUrl}
              alt={data.displayName}
              width={data.logoWidth ?? 600}
              height={data.logoHeight ?? 60}
              priority
              className="mt-4 h-7 w-auto md:h-8"
            />
          ) : (
            <p className="mt-4 text-[15px] font-black tracking-[0.02em] text-white/90">{data.wordmark}</p>
          )}
          <h1 className="mt-3 max-w-[18ch] break-keep text-[30px] font-black leading-[1.18] tracking-[-0.03em] text-white md:text-[44px]">
            {t(`${koWho}의 첫 커리어, 여기서 시작하세요`, `${data.shortName} students, start your first career here`, `${data.shortName}学生的第一份职业，从这里开始`, `Sinh viên ${data.shortName}, bắt đầu sự nghiệp tại đây`, `${data.shortName}生の初めてのキャリア、ここから`, `Mahasiswa ${data.shortName}, mulai karier pertamamu di sini`)}
          </h1>
          <p className="mt-4 max-w-[46ch] break-keep text-[14.5px] leading-relaxed text-white/85 md:text-[16px]">
            {t("AI로 이력서·자기소개서를 완성하고, 모의면접으로 준비한 뒤, 실제 공고에 바로 지원하세요. 전부 무료예요.", "Finish your resume and cover letter with AI, practice interviews, then apply to real jobs — all free.", "用AI完成简历与自我介绍，进行模拟面试，再直接投递真实公告。全部免费。", "Hoàn thành CV & thư bằng AI, luyện phỏng vấn, rồi ứng tuyển việc thật — tất cả miễn phí.", "AIで履歴書・自己紹介書を完成し、模擬面接で準備して、実際の求人に応募。すべて無料。", "Selesaikan resume & surat dengan AI, latih wawancara, lalu lamar kerja nyata — semua gratis.")}
          </p>

          {/* 커리어런치 코드 입력 + 접속 버튼 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              goCareerLaunch();
            }}
            className="mt-7 flex w-full max-w-[520px] flex-col gap-2.5 sm:flex-row sm:items-stretch"
          >
            <input
              value={launchCode}
              onChange={(e) => setLaunchCode(e.target.value)}
              inputMode="text"
              autoComplete="off"
              maxLength={64}
              placeholder={t("커리어런치 코드 입력 (선택)", "Enter Career Launch code (optional)", "输入 Career Launch 代码（可选）", "Nhập mã Career Launch (tùy chọn)", "Career Launchコードを入力（任意）", "Masukkan kode Career Launch (opsional)")}
              className="h-[52px] flex-1 rounded-2xl border border-white/30 bg-white/95 px-4 text-[15px] font-semibold text-[#191F28] placeholder:font-medium placeholder:text-[#8B95A1] outline-none transition focus:border-white focus:bg-white"
            />
            <button
              type="submit"
              className="inline-flex h-[52px] shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-white px-6 text-[15px] font-black text-[#191F28] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)] transition hover:bg-[#F2F4F6]"
            >
              {t("커리어런치 접속하기", "Go to Career Launch", "进入 Career Launch", "Vào Career Launch", "Career Launchへ", "Ke Career Launch")}
              <ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden />
            </button>
          </form>
          <div className="mt-3">
            <Link
              href={jobsHref}
              onClick={() => trackUniversityCtaClicked(data.slug, "secondary", campaign)}
              className="inline-flex items-center gap-1 text-[14px] font-bold text-white/85 underline-offset-4 transition hover:text-white hover:underline"
            >
              {t("공고 둘러보기", "Browse jobs", "浏览公告", "Xem việc làm", "求人を見る", "Lihat lowongan")}
              <ArrowRight className="h-[15px] w-[15px]" weight="bold" aria-hidden />
            </Link>
          </div>

          {data.motto ? <p className="mt-8 text-[12px] font-semibold tracking-[0.02em] text-white/60">{data.motto}</p> : null}
        </div>
      </section>

      {/* 1분 커리어 진단 맛보기 — 가입 전 즉시 가치 */}
      <UniversityDiagnosisTeaser accent={data.accent} ctaHref={careerLaunchHref} onCta={() => trackUniversityCtaClicked(data.slug, "primary", campaign)} />

      {/* 가치 3가지 */}
      <section className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="rounded-3xl border border-[#EEF1F5] bg-white p-6">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${data.accent}14`, color: data.accent }}>
                  <Icon className="h-6 w-6" weight="duotone" aria-hidden />
                </span>
                <h3 className="mt-4 text-[16px] font-black text-[#0B1227]">{v.title}</h3>
                <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{v.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 전공 계열별 맞춤 공고 */}
      <UniversityMajorJobs accent={data.accent} src={src} jobsHref={jobsHref} />

      {/* 유학생이라면 — 비자 가이드 + 외국인 지원 가능 공고 */}
      {data.showVisaSection ? (
        <section className="mx-auto max-w-5xl px-5 pb-14">
          <div className="rounded-3xl border border-[#EEF1F5] bg-white p-6 md:p-7">
            <p className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: data.accent }}>🌏 {t("유학생이라면", "For international students", "留学生请看", "Dành cho du học sinh", "留学生の方へ", "Untuk mahasiswa asing")}</p>
            <h2 className="mt-2 break-keep text-[20px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[24px]">
              {t("비자부터 외국인 채용까지, 한 곳에서", "Visas to foreigner-friendly jobs, all in one place", "从签证到外国人招聘，一站搞定", "Từ visa đến việc cho người nước ngoài, một nơi", "ビザから外国人採用まで一箇所で", "Dari visa sampai kerja untuk WNA, satu tempat")}
            </h2>
            <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">
              {t("한국 취업에 필요한 비자와 외국인 지원 가능 공고를 유학생 맞춤으로 안내해요.", "Visa guides and foreigner-eligible jobs, tailored for international students.", "为留学生量身介绍所需签证与可申请的外国人公告。", "Hướng dẫn visa và việc cho người nước ngoài, dành cho du học sinh.", "留学生向けにビザと外国人応募可の求人を案内します。", "Panduan visa dan lowongan untuk WNA, khusus mahasiswa asing.")}
            </p>

            {data.visaCodes?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {data.visaCodes.map((code) => (
                  <Link
                    key={code}
                    href={`/resources/visa/${encodeURIComponent(code)}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#EEF1F5] bg-[#FAFBFC] px-3.5 py-2 text-[13px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
                  >
                    <span className="font-black" style={{ color: data.accent }}>{code}</span>
                    {code === "D-2" ? t("유학", "Study", "留学", "Du học", "留学", "Studi") : code === "D-10" ? t("구직", "Job-seeking", "求职", "Tìm việc", "求職", "Cari kerja") : code === "E-7" ? t("취업", "Work", "就业", "Việc làm", "就業", "Kerja") : ""}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/talent/jobs?foreigner=1&src=${encodeURIComponent(src)}`}
                onClick={() => trackUniversityCtaClicked(data.slug, "jobs", campaign)}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition"
                style={{ backgroundColor: data.accent }}
              >
                {t("외국인 지원 가능 공고 보기", "See foreigner-eligible jobs", "查看外国人可投递公告", "Xem việc cho người nước ngoài", "外国人応募可の求人を見る", "Lihat lowongan untuk WNA")} <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
              </Link>
              <Link
                href="/resources/visa"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:text-[#191F28]"
              >
                {t("전체 비자 가이드", "All visa guides", "全部签证指南", "Tất cả hướng dẫn visa", "全ビザガイド", "Semua panduan visa")}
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* 하단 CTA */}
      <section className="mx-auto max-w-5xl px-5 pb-20">
        <div className="flex flex-col items-center gap-5 rounded-3xl bg-[#0B1227] px-6 py-12 text-center">
          {/* Aply × 한양대 co-brand 락업 — 다크 배경이라 로고는 흰색 칩 위에 */}
          <div className="flex items-center gap-3">
            <span className="flex h-11 items-center justify-center rounded-2xl bg-white px-3.5">
              <Image src="/img_logo.webp" alt="Aply" width={60} height={20} className="h-[18px] w-auto" />
            </span>
            <span className="text-[15px] font-black text-white/40" aria-hidden>×</span>
            {data.symbolUrl ? (
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-1.5">
                <Image src={data.symbolUrl} alt={data.displayName} width={80} height={80} className="h-full w-full object-contain" />
              </span>
            ) : (
              <span className="rounded-2xl bg-white px-3.5 py-2 text-[13px] font-black text-[#0B1227]">{data.shortName}</span>
            )}
          </div>
          <h2 className="max-w-[22ch] break-keep text-[22px] font-black leading-[1.3] tracking-[-0.02em] text-white md:text-[26px]">
            {t(`${koWho}, 오늘 커리어를 시작하세요`, `Start your career today, ${data.shortName}`, `在${data.shortName}，今天开启职业`, `Bắt đầu sự nghiệp hôm nay, ${data.shortName}`, `${data.shortName}で、今日キャリアを始めよう`, `Mulai kariermu hari ini, ${data.shortName}`)}
          </h2>
          <button
            type="button"
            onClick={goCareerLaunch}
            className="inline-flex items-center gap-1.5 rounded-2xl px-7 py-3.5 text-[15px] font-black text-white shadow-[0_12px_32px_-14px_rgba(0,0,0,0.6)] transition"
            style={{ backgroundColor: data.accent }}
          >
            {t("커리어런치 접속하기", "Go to Career Launch", "进入 Career Launch", "Vào Career Launch", "Career Launchへ", "Ke Career Launch")}
            <ArrowRight className="h-[18px] w-[18px]" weight="bold" aria-hidden />
          </button>
          <p className="text-[12px] text-white/50">{t("기수 코드가 있으면 위에서 입력하세요 · 없어도 시작할 수 있어요", "Have a cohort code? Enter it above · you can start without one", "有期数代码请在上方输入 · 没有也能开始", "Có mã kỳ? Nhập ở trên · không có vẫn bắt đầu được", "コードがあれば上で入力 · なくても開始できます", "Punya kode? Masukkan di atas · tetap bisa mulai tanpanya")}</p>
        </div>
      </section>
    </main>
  );
}

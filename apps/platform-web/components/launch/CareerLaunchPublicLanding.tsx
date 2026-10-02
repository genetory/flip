"use client";

// Career Launch 공개 소개 — 로그인 없이 "무엇을 4주 동안 하는지" 전부 읽을 수 있다.
// 예전에는 /career-launch 가 바로 로그인 화면이라, 검색으로 들어온 방문자가 프로그램 내용을
// 보기 전에 로그인을 요구받았다.
// 클라이언트 컴포넌트지만 Next 가 첫 HTML 을 서버에서 렌더하므로 본문이 소스에 들어간다.
import { useEffect, useRef } from "react";
import Link from "next/link";
import { CaretDown, CheckCircle, Clock, Robot, UserCircle } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { useLaunchT } from "../../lib/launch/i18n";
import { trackCareerLaunchLandingView, trackCareerLaunchStartClick } from "../../lib/analytics";

export function CareerLaunchPublicLanding() {
  const t = useLaunchT();
  const { locale } = useLanguage();
  const { isReady, isAuthenticated } = useAuthSession();
  const sent = useRef(false);

  useEffect(() => {
    if (!isReady || sent.current) return;
    sent.current = true;
    trackCareerLaunchLandingView({ locale, loggedIn: isAuthenticated });
    // 초대 링크로 바로 들어온 경우에도 코드를 잃지 않게 저장한다(시작 화면에서 사용).
    try {
      const inv = new URLSearchParams(window.location.search).get("invite");
      if (inv && inv.trim()) window.localStorage.setItem("cl_invite", inv.trim().toUpperCase());
    } catch {
      /* 무시 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const weeks = [
    {
      w: t("1주차", "Week 1"),
      title: t("나를 이해하고 직무 탐험", "Understand yourself, explore roles"),
      body: t("경험을 꺼내 강점을 찾고, 지원할 직무를 좁혀요.", "Pull out your experience, find your strengths, and narrow down target roles.")
    },
    {
      w: t("2주차", "Week 2"),
      title: t("지원서 완성", "Finish your application"),
      body: t("한국식 이력서와 자기소개서를 문항까지 끝내요.", "Complete a Korean-style resume and cover letter, question by question.")
    },
    {
      w: t("3주차", "Week 3"),
      title: t("실전 모의면접", "Real mock interviews"),
      body: t("자기소개·직무·인성·압박 면접을 차례로 연습해요.", "Practice self-intro, role, culture-fit, and pressure interviews in turn.")
    },
    {
      w: t("4주차", "Week 4"),
      title: t("오답 훈련과 최종 점검", "Review training and final check"),
      body: t("반복되는 약점을 고치고 서류를 최종 점검해요.", "Fix the weak spots that keep coming back and do a final document check.")
    }
  ];

  const outputs = [
    t("기업 제출용 이력서", "A resume you can submit"),
    t("문항별 자기소개서", "A cover letter for each question"),
    t("모의면접 기록과 약점 리포트", "Mock interview records and a weakness report"),
    t("면접 오답노트", "Interview review notes")
  ];

  const faqs = [
    {
      q: t("비용이 드나요?", "Does it cost anything?"),
      a: t("아니요. 현재 Career Launch 와 AI 기능은 무료로 제공해요.", "No. Career Launch and the AI features are free right now.")
    },
    {
      q: t("매일 해야 하나요?", "Do I have to do it every day?"),
      a: t("아니요. 주차별 과제를 그 주 안에 마치면 돼요. 한 주차는 보통 2~3시간이면 끝나요.", "No. Finish each week's missions within that week. One week usually takes 2–3 hours.")
    },
    {
      q: t("한국어를 잘 못해도 되나요?", "What if my Korean isn't good?"),
      a: t("화면은 여러 언어로 볼 수 있어요. 다만 공고와 면접은 한국어가 필요한 경우가 많아, 수준에 맞는 준비를 함께 안내해요.", "The interface supports several languages. Many jobs and interviews still require Korean, so we guide preparation at your level.")
    },
    {
      q: t("누가 답을 주나요?", "Who answers my questions?"),
      a: t("AI 코치가 과제를 함께 하고, 일정·제출처럼 AI 가 답할 수 없는 건 운영진이 직접 답해요.", "An AI coach works through the missions with you; for things it can't answer — schedules, submissions — our team replies in person.")
    }
  ];

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 pb-16 pt-8">
      <p className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">Career Launch</p>
      <h1 className="mt-2 break-keep text-[27px] font-black leading-[1.2] tracking-[-0.03em] text-[#191F28] md:text-[34px]">
        {t("4주 만에 지원 준비를 끝내는 프로그램", "Finish your application prep in four weeks")}
      </h1>
      <p className="mt-3 break-keep text-[14.5px] leading-relaxed text-[#4E5968]">
        {t(
          "무엇을 먼저 해야 할지 모르겠다면, 순서대로 따라가면 돼요. 4주 뒤에는 기업에 낼 수 있는 이력서·자기소개서와 면접 준비가 남아요.",
          "If you don't know what to do first, just follow the order. After four weeks you'll have a submittable resume, cover letter, and interview prep."
        )}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968]">
          <Clock className="h-3.5 w-3.5" weight="fill" /> {t("주당 2~3시간", "2–3 hours a week")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968]">
          <Robot className="h-3.5 w-3.5" weight="fill" /> {t("AI 코치가 함께", "With an AI coach")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968]">
          <UserCircle className="h-3.5 w-3.5" weight="fill" /> {t("운영진이 직접 답변", "Our team answers directly")}
        </span>
      </div>

      {/* primary CTA 는 하나 */}
      <Link
        href="/career-launch/start"
        onClick={() => trackCareerLaunchStartClick("landing_hero")}
        className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
      >
        {t("시작하기", "Get started")}
      </Link>

      <section className="mt-10">
        <h2 className="text-[17px] font-black tracking-[-0.02em] text-[#191F28]">{t("4주 구성", "The four weeks")}</h2>
        <ol className="mt-3 flex flex-col gap-2.5">
          {weeks.map((w) => (
            <li key={w.w} className="rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3.5">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">{w.w}</p>
              <p className="mt-1 break-keep text-[15px] font-black text-[#191F28]">{w.title}</p>
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{w.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-[17px] font-black tracking-[-0.02em] text-[#191F28]">{t("4주 뒤에 남는 것", "What you'll have after four weeks")}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {outputs.map((o) => (
            <li key={o} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-[#333D4B]">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0A9B59]" weight="fill" />
              <span className="break-keep">{o}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] leading-relaxed text-[#8B95A1]">
          {t(
            "결과물은 본인이 쓴 내용으로 만들어져요. 다른 사람의 이력서를 예시로 보여주지 않습니다.",
            "Your outputs are built from what you write. We don't show other people's documents as examples."
          )}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-[17px] font-black tracking-[-0.02em] text-[#191F28]">{t("자주 묻는 질문", "FAQ")}</h2>
        <div className="mt-3 flex flex-col gap-1.5">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3">
              <summary className="flex cursor-pointer items-center justify-between gap-2 text-[13.5px] font-bold text-[#191F28]">
                {f.q}
                <CaretDown className="h-4 w-4 shrink-0 text-[#B0B8C1]" weight="bold" />
              </summary>
              <p className="mt-2 break-keep text-[13px] leading-relaxed text-[#4E5968]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-2xl bg-[#F5F8FF] px-4 py-5 text-center">
        <p className="break-keep text-[15px] font-black text-[#191F28]">{t("어떤 직무가 맞는지 모르겠다면", "Not sure which role fits you?")}</p>
        <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#4E5968]">
          {t("내 비자로 지원할 수 있는 공고부터 확인해 보세요.", "Start by checking the jobs your visa allows.")}
        </p>
        <Link
          href="/talent/visa"
          onClick={() => trackCareerLaunchStartClick("landing_visa_guide")}
          className="mt-3 inline-block text-[13.5px] font-bold text-[#0B46E8] underline underline-offset-2"
        >
          {t("비자별 취업 가이드 보기", "See job guides by visa")}
        </Link>
      </section>

      <p className="mt-8 text-[11.5px] leading-relaxed text-[#8B95A1]">
        {t(
          "APLY 는 합격이나 비자 발급을 보장하지 않습니다. 프로그램은 준비 과정을 돕는 도구예요.",
          "Aply does not guarantee a job offer or a visa. The program is a tool to help you prepare."
        )}
      </p>
    </main>
  );
}

"use client";

// "내 경험이 스펙이 되는 순간" — 어플라이 자소서 경험 발굴 캠페인(/events/experience). 로그인 없이 신청.
// v2 광고 페이지 결(V2InterviewsGuest): 가운데 정렬 · 아주 큰 제목 · 흰/회색(#f5f5f7) 띠가 번갈아 · 흰 타일 + 곱하기 합성 그림.
// 히어로 → 이런 고민 → Before/After(예시) → 컨설팅 안내 → 신청 폼(완료 화면으로 바뀜) → 자주 묻는 질문 → 마지막 권유,
// 휴대폰은 아래 고정 신청 버튼(폼이 보이면 숨김).
// 문구·제공 범위·보관 기간·예시는 lib/experience-campaign.ts 에서 바꾼다. 이 캠페인은 '무료'를 써도 된다(전액 무료 행사).
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AplyFooter } from "../AplyFooter";
import { Button, Chip, Page, Spinner } from "../v2/ui";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { readAccessToken } from "../../lib/auth-client";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";
import { setFabInset, clearFabInset } from "../../lib/talent/fab-inset";
import { trackExperienceCampaign } from "../../lib/analytics";
import {
  BEFORE_AFTER_EXAMPLES,
  REVIEWS,
  CASE_STUDY_CONSENT,
  EXPERT_SCOPE,
  PRIVACY_CONSENT_DETAILS,
  WEEKLY_SLOTS,
  type Copy
} from "../../lib/experience-campaign";

const FORM_ID = "apply";
// 첨부 파일 — 이력서(필수)·자기소개서(선택). API(/public/experience-applications)와 같은 기준.
const FILE_MAX_BYTES = 10 * 1024 * 1024;
const FILE_EXTS = ["pdf", "doc", "docx", "hwp", "hwpx"];
const FILE_ACCEPT = FILE_EXTS.map((e) => `.${e}`).join(",");
const FAB_KEY = "experience-campaign";

type ConsultMethod = "ONLINE" | "OFFLINE" | "ANY";
type Utm = Partial<Record<"utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm" | "referrer", string>>;

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

function scrollToForm() {
  document.getElementById(FORM_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ExperienceCampaignPage() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const tc = (c: Copy) => t(c.ko, c.en, c.zh, c.vi, c.ja, c.id);
  const [submitted, setSubmitted] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const formRef = useRef<HTMLElement | null>(null);

  // 유입 경로 — 처음 들어온 URL 의 utm_* 와 referrer 를 들고 있다가 신청에 같이 보낸다.
  const utmRef = useRef<Utm>({});
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const pick = (k: string) => p.get(k)?.trim().slice(0, 200) || undefined;
    utmRef.current = {
      utmSource: pick("utm_source"),
      utmMedium: pick("utm_medium"),
      utmCampaign: pick("utm_campaign"),
      utmContent: pick("utm_content"),
      utmTerm: pick("utm_term"),
      referrer: document.referrer ? document.referrer.slice(0, 500) : undefined
    };
    trackExperienceCampaign("experience_landing_view", { locale, utm_source: utmRef.current.utmSource ?? "(none)" });
    // 진입 1회만 — locale 이 바뀌어도 다시 보내지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 폼이 화면에 보이는지 — 처음 보일 때 1회 이벤트, 보이는 동안은 아래 고정 버튼을 숨긴다.
  useEffect(() => {
    const el = formRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let sent = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        setFormVisible(entry.isIntersecting);
        if (entry.isIntersecting && !sent) {
          sent = true;
          trackExperienceCampaign("experience_form_view");
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 휴대폰 아래 고정 신청 버튼 — 보일 때만 전역 피드백 버튼을 그만큼 비켜 준다.
  const showSticky = !formVisible && !submitted;
  useEffect(() => {
    const apply = () => (showSticky && window.innerWidth <= 767 ? setFabInset(FAB_KEY, 76) : clearFabInset(FAB_KEY));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      clearFabInset(FAB_KEY);
    };
  }, [showSticky]);

  const cta = (source: string) => () => {
    trackExperienceCampaign("experience_cta_click", { source });
    scrollToForm();
  };

  const worries = [
    t("아르바이트밖에 해본 게 없어요.", "All I've done is part-time jobs.", "我只做过兼职。", "Mình chỉ từng làm thêm thôi.", "アルバイトしかしたことがありません。", "Aku cuma pernah kerja paruh waktu."),
    t("동아리 경험을 이력서·자소서에 어떻게 써야 할까요?", "How do I put my club activities in my resume or cover letter?", "社团经历该怎么写进简历和自我介绍书？", "Viết trải nghiệm câu lạc bộ vào CV và thư giới thiệu thế nào?", "サークル経験は履歴書・自己紹介書にどう書けばいい？", "Gimana menulis pengalaman klub di CV dan esai?"),
    t("한국 회사가 원하는 지원동기를 모르겠어요.", "I don't know what motivation Korean companies want.", "不知道韩国公司想看什么样的求职动机。", "Mình không biết công ty Hàn muốn động lực ứng tuyển thế nào.", "韓国企業が求める志望動機がわかりません。", "Aku nggak tahu motivasi melamar seperti apa yang dicari perusahaan Korea."),
    t("이력서·자소서를 썼는데 너무 평범한 것 같아요.", "My resume and cover letter feel too ordinary.", "写好了简历和自我介绍书，但感觉太普通了。", "Mình viết CV và thư giới thiệu rồi nhưng thấy quá bình thường.", "履歴書・自己紹介書を書いたけど、平凡すぎる気がします。", "CV dan esaiku sudah jadi, tapi rasanya terlalu biasa.")
  ];

  // 혜택 쿠폰 — 왼쪽 큰 표시 · 점선 · 오른쪽 설명
  const offers = [
    {
      mark: "1:1",
      tone: "bg-[color:var(--v2-accent)] text-white",
      title: t(`매주 단 ${WEEKLY_SLOTS}명`, `Only ${WEEKLY_SLOTS} a week`, `每周仅${WEEKLY_SLOTS}名`, `Chỉ ${WEEKLY_SLOTS} người/tuần`, `毎週${WEEKLY_SLOTS}名限定`, `Hanya ${WEEKLY_SLOTS} orang/minggu`),
      desc: t(`이력서·자소서 전문가가 직접 상담하고 첨삭해요. (${EXPERT_SCOPE.ko})`, `A resume & cover letter expert consults and edits with you. (${EXPERT_SCOPE.en})`, `简历和自我介绍书专家亲自为你咨询和修改。（${EXPERT_SCOPE.zh}）`, `Chuyên gia CV & thư giới thiệu trực tiếp tư vấn và sửa bài cho bạn. (${EXPERT_SCOPE.vi})`, `履歴書・自己紹介書の専門家が直接相談・添削します。（${EXPERT_SCOPE.ja}）`, `Ahli CV & esai langsung berkonsultasi dan mengoreksi bersamamu. (${EXPERT_SCOPE.id})`)
    },
    {
      mark: t("온·오프", "ON·OFF", "ON·OFF", "ON·OFF", "ON·OFF", "ON·OFF"),
      tone: "bg-[#7c5cff] text-white",
      title: t("온라인 또는 오프라인", "Online or in person", "线上或线下", "Online hoặc trực tiếp", "オンラインまたは対面", "Online atau tatap muka"),
      desc: t("화상 상담도, 만나서 하는 상담도 돼요. 선정 후 편한 방식으로 맞춰요.", "Video call or face to face — we'll arrange it after selection.", "视频咨询、见面咨询都可以。选定后按你方便的方式安排。", "Tư vấn qua video hoặc gặp trực tiếp đều được. Sau khi được chọn, bọn mình sẽ sắp xếp theo cách bạn thấy tiện.", "ビデオ相談も、対面での相談もOK。選定後、ご都合のよい方法で調整します。", "Bisa lewat video call atau bertemu langsung. Setelah terpilih, kami sesuaikan dengan cara yang nyaman untukmu.")
    },
    {
      mark: "₩0",
      tone: "bg-[#ffd84d] text-[#191f28]",
      title: t("100% 무료", "100% free", "100%免费", "Miễn phí 100%", "100%無料", "100% gratis"),
      desc: t("상담부터 약속한 첨삭 결과물까지 비용이 전혀 없어요.", "From the consultation to the promised edits — completely free.", "从咨询到约定的修改成果，完全不收任何费用。", "Từ buổi tư vấn đến bản sửa đã hẹn — hoàn toàn không mất phí.", "相談から約束した添削結果まで、費用は一切かかりません。", "Dari konsultasi sampai hasil koreksi yang dijanjikan — sama sekali tanpa biaya.")
    }
  ];

  const sample = BEFORE_AFTER_EXAMPLES[0];
  return (
    // 완전히 분리된 싱글 페이지 — 사이트 상단 메뉴(GNB) 없이, 법적 고지용 바닥글만.
    <div className="v2">
      {/* 프로모션 페이지 — 연파랑 바탕 위에 파란 히어로·말풍선·쿠폰 카드 */}
      {/* 위 여백도 바탕색으로(섹션 margin 대신 padding — 흰 띠가 생기지 않게) */}
      <div className="bg-[#eef3ff] md:pt-6">
      <Page>
        {/* ① 히어로 — 파란 띠, 노란 강조, 자소서 미리보기 카드 */}
        <section className="relative overflow-hidden bg-[color:var(--v2-accent)] px-5 pb-12 pt-6 text-white md:mx-5 md:rounded-[40px] md:px-10 md:pt-10">
          {/* 장식 원 */}
          <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <span aria-hidden className="pointer-events-none absolute -left-16 bottom-10 h-40 w-40 rounded-full bg-white/[0.07]" />
          {/* 로고 — 메뉴 없이 브랜드만(흰 칩 위) · 오른쪽 언어 선택(GNB 가 없어 여기서 바꾼다) */}
          <div className="relative flex items-center justify-between gap-3">
            <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-white px-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element -- 작은 로고 */}
              <img src="/img_logo.webp" alt="Aply" className="h-5 w-auto" />
            </span>
            <LanguagePill t={t} />
          </div>
          <div className="relative mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-[#ffd84d] px-3 py-1.5 text-[13px] font-extrabold text-[#191f28]">{t("100% 무료", "100% FREE", "100%免费", "MIỄN PHÍ 100%", "100%無料", "100% GRATIS")}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-bold">{t(`매주 단 ${WEEKLY_SLOTS}명`, `${WEEKLY_SLOTS} per week`, `每周仅${WEEKLY_SLOTS}名`, `Chỉ ${WEEKLY_SLOTS} người/tuần`, `毎週${WEEKLY_SLOTS}名限定`, `Hanya ${WEEKLY_SLOTS} orang/minggu`)}</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[13px] font-bold">{t("전문가 1:1", "1:1 expert", "专家一对一", "Chuyên gia 1:1", "専門家と1対1", "Ahli 1:1")}</span>
          </div>
          <p className="relative mt-6 text-[13px] font-bold tracking-[0.14em] text-white/70">APLY CAREER PROJECT</p>
          <h1 className="relative mt-2 text-[34px] font-extrabold leading-[1.18] tracking-[-0.04em] min-[360px]:text-[40px] md:text-[60px]">
            {t("당신의 경험이", "Your experience becomes", "你的经历将成为", "Trải nghiệm của bạn sẽ thành", "あなたの経験が", "Pengalamanmu jadi")}
            <br />
            <span className="text-[#ffd84d]">{t("이력서·자소서", "your resume & cover letter", "简历和自我介绍书", "CV & thư giới thiệu bản thân", "履歴書・自己紹介書", "CV & esai perkenalan diri")}</span>
            {t("가 됩니다.", ".", "。", ".", "になります。", ".")}
          </h1>
          <p className="relative mt-4 max-w-[440px] text-[17px] leading-[1.6] text-white/85">
            {t("한국식 이력서·자기소개서가 어렵다면? 어플라이 취업 서류 전문가가 직접 도와드립니다.", "Korean-style resumes and cover letters feel hard? An Aply job-document expert will help you in person.", "觉得韩式简历和自我介绍书很难？Aply求职材料专家亲自帮你。", "Thấy CV và thư giới thiệu bản thân kiểu Hàn khó? Chuyên gia hồ sơ xin việc của Aply sẽ trực tiếp giúp bạn.", "韓国式の履歴書・自己紹介書が難しい？Aplyの就活書類の専門家が直接サポートします。", "CV dan esai perkenalan diri ala Korea terasa sulit? Ahli dokumen lamaran dari Aply siap membantumu langsung.")}
          </p>
          <div className="relative mt-7 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:items-center">
            <button type="button" onClick={cta("hero")} className="inline-flex h-14 items-center justify-center rounded-full bg-white px-7 text-[17px] font-extrabold text-[color:var(--v2-accent)] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] transition hover:opacity-90 active:scale-[0.98]">
              {t("무료 상담 신청하기 →", "Apply for free →", "免费申请咨询 →", "Đăng ký miễn phí →", "無料で相談を申し込む →", "Daftar gratis →")}
            </button>
            <span className="text-[14px] font-semibold text-white/80">{t("월요일까지 신청 · 화요일 선정", "Apply by Mon · picked Tue", "周一前申请 · 周二选定", "Hạn thứ Hai · chọn thứ Ba", "月曜までに申込 · 火曜に選定", "Daftar s.d. Senin · seleksi Selasa")}</span>
          </div>
          {/* 경험이 이력서로 모이는 그림 */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 이벤트 일러스트(투명 배경) */}
          <img src="/img_resume_event_0.webp" alt="" aria-hidden className="relative mx-auto mt-6 h-[260px] w-[260px] object-contain min-[360px]:h-[300px] min-[360px]:w-[300px] md:h-[360px] md:w-[360px]" />
          {/* 자소서 미리보기 — 살짝 기운 종이 카드 */}
          <div className="relative mx-auto -mt-10 max-w-[420px] rotate-[-2deg] rounded-[24px] bg-white p-5 text-left text-[color:var(--v2-ink)] shadow-[0_24px_48px_-20px_rgba(0,0,0,0.45)]">
            <p className="text-[12px] font-bold tracking-[0.08em] text-[color:var(--v2-faint)]">BEFORE</p>
            <p className="mt-1 text-[15px] leading-[1.55] text-[color:var(--v2-muted)] line-through decoration-[#f04452]/60 decoration-2">{tc(sample.before)}</p>
            <div aria-hidden className="my-3 border-t-2 border-dashed border-[color:var(--v2-band)]" />
            <p className="text-[12px] font-bold tracking-[0.08em] text-[color:var(--v2-accent)]">AFTER</p>
            <p className="mt-1 text-[16px] font-bold leading-[1.55]">
              <span className="bg-[linear-gradient(transparent_55%,#ffe98a_55%)]">{tc(sample.after)}</span>
            </p>
          </div>
        </section>

        {/* ② 이런 고민 — 말풍선(채팅) */}
        <section className="px-5 py-16">
          <Headline eyebrow={t("이런 고민 있나요?", "Sound familiar?", "你也有这些烦恼吗？", "Bạn có trăn trở này?", "こんな悩み、ありませんか？", "Pernah merasa begini?")} title={t("혼자 쓰기\n막막했다면.", "Stuck writing\nit alone?", "一个人写\n无从下手？", "Tự viết mà\nbí ý tưởng?", "ひとりで書くのは\n大変ですよね。", "Bingung\nmenulis sendiri?")} />
          {/* 고민하는 학생 */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 이벤트 일러스트(투명 배경) */}
          <img src="/img_resume_event_1.webp" alt="" aria-hidden className="mx-auto mt-6 h-[200px] w-[200px] object-contain md:h-[240px] md:w-[240px]" />
          <div className="mx-auto mt-6 flex max-w-[520px] flex-col gap-3">
            {worries.map((w, i) => (
              <div key={w} className={`flex items-end gap-2 ${i % 2 ? "flex-row-reverse" : ""}`}>
                <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[18px]">{["🙋", "🤔", "😥", "📝"][i]}</span>
                <p className={`max-w-[82%] rounded-[22px] px-5 py-3.5 text-[16px] font-semibold leading-[1.5] shadow-[0_6px_18px_-12px_rgba(11,70,232,0.35)] ${i % 2 ? "rounded-br-md bg-[color:var(--v2-accent)] text-white" : "rounded-bl-md bg-white text-[color:var(--v2-ink)]"}`}>{w}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-center text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--v2-ink)]">
            {t("그 경험, 전문가와 함께\n이력서·자소서로 바꿔 봐요.", "Let's turn that experience\ninto your resume & cover letter.", "和专家一起，\n把经历写进简历和自我介绍书。", "Cùng chuyên gia biến trải nghiệm đó\nthành CV & thư giới thiệu bản thân.", "その経験、専門家と一緒に\n履歴書・自己紹介書にしてみよう。", "Ubah pengalaman itu\njadi CV & esai bersama ahli.").split("\n").map((l) => (
              <span key={l} className="block">{l}</span>
            ))}
          </p>
        </section>

        {/* ③ Before / After — 예시(실제 사례로 교체 예정) */}
        <BeforeAfter t={t} />

        {/* ③-2 참여 후기 — 공개 동의한 후기만(지금은 예시) */}
        <Reviews t={t} />

        {/* ④ 혜택 — 쿠폰 카드 셋 + 주간 진행 */}
        <section className="px-5 py-16">
          <Headline eyebrow={t("이번 캠페인 혜택", "What you get", "本次活动福利", "Quyền lợi chiến dịch", "今回のキャンペーン特典", "Keuntungan kampanye")} title={t("전문가가\n직접 봐 드려요.", "An expert,\nwith you.", "专家\n亲自帮你看。", "Chuyên gia\ntrực tiếp góp ý.", "専門家が\n直接見ます。", "Ahli\nlangsung membantu.")} />
          {/* 전문가와 1:1 상담 */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 이벤트 일러스트(투명 배경) */}
          <img src="/img_resume_event_2.webp" alt="" aria-hidden className="mx-auto mt-6 h-[220px] w-[220px] object-contain min-[360px]:h-[240px] min-[360px]:w-[240px] md:h-[280px] md:w-[280px]" />
          <div className="mx-auto mt-6 flex max-w-[560px] flex-col gap-3">
            {offers.map((o) => (
              <article key={o.title} className="relative flex overflow-hidden rounded-[24px] bg-white shadow-[0_10px_28px_-18px_rgba(11,70,232,0.45)]">
                <span className={`flex w-[96px] shrink-0 items-center justify-center text-[22px] font-extrabold tracking-[-0.02em] min-[360px]:w-[108px] ${o.tone}`}>{o.mark}</span>
                {/* 쿠폰 홈 — 위아래 반원 + 점선 */}
                <span aria-hidden className="relative w-0 border-l-2 border-dashed border-[#dfe6f7]">
                  <span className="absolute -left-[9px] -top-2 h-4 w-4 rounded-full bg-[#eef3ff]" />
                  <span className="absolute -bottom-2 -left-[9px] h-4 w-4 rounded-full bg-[#eef3ff]" />
                </span>
                <span className="min-w-0 flex-1 px-5 py-5">
                  <span className="block text-[19px] font-extrabold tracking-[-0.02em] text-[color:var(--v2-ink)]">{o.title}</span>
                  <span className="mt-1 block text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">{o.desc}</span>
                </span>
              </article>
            ))}
          </div>
          {/* 주간 진행 — 월 검토 · 화 선정·연락 · 수~금 상담 (가로 단계) */}
          <div className="mx-auto mt-6 max-w-[560px] rounded-[24px] bg-white px-5 py-6">
            <p className="text-center text-[17px] font-extrabold text-[color:var(--v2-ink)]">{t("매주 이렇게 진행돼요", "How each week works", "每周流程如下", "Mỗi tuần diễn ra thế này", "毎週の流れ", "Alur setiap minggu")}</p>
            <ol className="relative mt-5 grid grid-cols-3 gap-2">
              <span aria-hidden className="absolute left-[16%] right-[16%] top-6 border-t-2 border-dashed border-[color:var(--v2-accent-weak)]" />
              {[
                [t("월", "Mon", "周一", "T2", "月", "Sen"), t("신청서 검토", "Review", "审核申请", "Xem hồ sơ", "申込書の確認", "Tinjau berkas")],
                [t("화", "Tue", "周二", "T3", "火", "Sel"), t(`${WEEKLY_SLOTS}명 선정·연락`, `Pick ${WEEKLY_SLOTS}`, `选定${WEEKLY_SLOTS}人并联系`, `Chọn ${WEEKLY_SLOTS} người`, `${WEEKLY_SLOTS}名選定・連絡`, `Pilih ${WEEKLY_SLOTS} orang`)],
                [t("수~금", "Wed–Fri", "周三–五", "T4–T6", "水〜金", "Rab–Jum"), t("1:1 상담·첨삭", "1:1 session", "一对一咨询·修改", "Tư vấn 1:1", "1対1相談・添削", "Sesi 1:1")]
              ].map(([day, what], i) => (
                <li key={day} className="relative flex flex-col items-center text-center">
                  <span className={`flex h-12 min-w-[48px] items-center justify-center rounded-full px-2 text-[14px] font-extrabold ${i === 1 ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]"}`}>{day}</span>
                  <span className="mt-2 text-[13px] font-bold leading-[1.4] text-[color:var(--v2-ink-2)]">{what}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ⑤ 신청 폼 — 흰 카드. 접수되면 이 자리가 완료 화면으로 바뀐다 */}
        <section id={FORM_ID} ref={formRef} className="scroll-mt-20 px-4 py-12 md:px-5">
          <div className="mx-auto max-w-[640px] rounded-[32px] bg-white px-5 py-10 shadow-[0_20px_50px_-30px_rgba(11,70,232,0.5)] min-[360px]:px-6 md:px-10">
            {submitted ? (
              <Completion t={t} />
            ) : (
              <>
                {/* 이력서 올리기 */}
                {/* eslint-disable-next-line @next/next/no-img-element -- 이벤트 일러스트(투명 배경) */}
                <img src="/img_resume_event_3.webp" alt="" aria-hidden className="mx-auto -mt-2 mb-2 h-[160px] w-[160px] object-contain md:h-[190px] md:w-[190px]" />
                <div className="flex justify-center">
                  <span className="rounded-full bg-[#ffd84d] px-3 py-1 text-[13px] font-extrabold text-[#191f28]">{t(`이번 주 ${WEEKLY_SLOTS}자리`, `${WEEKLY_SLOTS} spots this week`, `本周${WEEKLY_SLOTS}个名额`, `Tuần này còn ${WEEKLY_SLOTS} suất`, `今週${WEEKLY_SLOTS}枠`, `${WEEKLY_SLOTS} kuota minggu ini`)}</span>
                </div>
                <div className="mt-3">
                  <Headline eyebrow={t("신청하기", "Apply", "申请", "Đăng ký", "申し込む", "Daftar")} title={t("이력서만\n보내 주세요.", "Just send\nyour resume.", "只需发送\n简历。", "Chỉ cần gửi\nCV thôi.", "履歴書を\n送るだけ。", "Cukup kirim\nCV-mu.")} sub={t("1분이면 신청할 수 있어요.", "It takes about a minute.", "1分钟即可完成申请。", "Chỉ mất khoảng 1 phút.", "1分で申し込めます。", "Cuma butuh sekitar 1 menit.")} />
                </div>
                <ApplyForm t={t} tc={tc} locale={locale} utmRef={utmRef} onDone={() => setSubmitted(true)} />
              </>
            )}
          </div>
        </section>

        {/* ⑥ 자주 묻는 질문 */}
        <Faq t={t} />

        {/* ⑦ 마지막 — 파란 띠 권유 */}
        {!submitted ? (
          <section className="relative mx-4 mb-6 mt-4 overflow-hidden rounded-[32px] bg-[color:var(--v2-accent)] px-6 py-12 text-center text-white md:mx-5">
            <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <h2 className="relative whitespace-pre-line text-[30px] font-extrabold leading-[1.22] tracking-[-0.04em] min-[360px]:text-[34px] md:text-[48px]">
              {t("별거 아닌 경험은\n없어요.", "No experience\nis too small.", "没有\n微不足道的经历。", "Không có trải nghiệm\nnào là nhỏ bé.", "ささいな経験なんて\nありません。", "Tak ada pengalaman\nyang sepele.")}
            </h2>
            <p className="relative mt-3 text-[16px] text-white/85">{t("편의점 알바도, 동아리 활동도 취업 스펙이 될 수 있어요.", "A part-time job or a club can become a real qualification.", "便利店兼职、社团活动，都能成为求职的亮点。", "Làm thêm ở cửa hàng tiện lợi hay hoạt động câu lạc bộ đều có thể thành điểm cộng khi xin việc.", "コンビニバイトもサークル活動も、就活の強みになります。", "Kerja di minimarket atau kegiatan klub pun bisa jadi nilai plus saat melamar kerja.")}</p>
            <div className="relative mt-7 flex justify-center">
              <button type="button" onClick={cta("footer")} className="inline-flex h-14 items-center justify-center rounded-full bg-[#ffd84d] px-7 text-[17px] font-extrabold text-[#191f28] transition hover:opacity-90 active:scale-[0.98]">
                {t("이번 주 신청하기 →", "Apply this week →", "本周申请 →", "Đăng ký tuần này →", "今週申し込む →", "Daftar minggu ini →")}
              </button>
            </div>
          </section>
        ) : null}

        {/* 고정 버튼에 마지막 내용이 가리지 않게 */}
        <div aria-hidden className="h-20 md:hidden" />

        {/* 휴대폰 아래 고정 신청 버튼 — 폼이 보이는 동안·접수 후엔 숨긴다 */}
        {showSticky ? (
          <div className="fixed inset-x-0 bottom-0 z-40 bg-[#eef3ff]/90 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
            <button type="button" onClick={cta("sticky")} className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--v2-accent)] text-[16px] font-bold text-white">
              <span className="rounded-full bg-[#ffd84d] px-2 py-0.5 text-[12px] font-extrabold text-[#191f28]">{t(`이번 주 ${WEEKLY_SLOTS}자리`, `${WEEKLY_SLOTS} spots`, `本周${WEEKLY_SLOTS}席`, `${WEEKLY_SLOTS} suất`, `今週${WEEKLY_SLOTS}枠`, `${WEEKLY_SLOTS} kuota`)}</span>
              {t("무료 상담 신청하기", "Apply for free", "免费申请咨询", "Đăng ký miễn phí", "無料で申し込む", "Daftar gratis")}
            </button>
          </div>
        ) : null}
      </Page>
      </div>
      <AplyFooter />
    </div>
  );
}

const LOCALE_NAMES: Record<PlatformLocale, string> = {
  ko: "한국어",
  en: "English",
  "zh-CN": "中文",
  vi: "Tiếng Việt",
  ja: "日本語",
  id: "Bahasa Indonesia"
};

/** 히어로 오른쪽 위 언어 선택 — 흰 알약 + 기본 select(히어로가 overflow-hidden 이라 드롭다운 대신 OS 목록). */
function LanguagePill({ t }: { t: PlatformT }) {
  const { locale, setLocale } = useLanguage();
  return (
    <label className="relative inline-flex h-9 min-w-0 items-center gap-1.5 rounded-full bg-white pl-3 pr-2.5 text-[color:var(--v2-accent)]">
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as PlatformLocale)}
        aria-label={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}
        className="min-w-0 max-w-[150px] cursor-pointer appearance-none truncate bg-transparent pr-4 text-[13px] font-bold outline-none"
      >
        {PLATFORM_LOCALES.map((l) => (
          <option key={l} value={l}>
            {LOCALE_NAMES[l]}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-2.5 h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}

/** 애플식 섹션 머리 — 작은 눈썹 · 아주 큰 제목(줄바꿈 \n) · 한 줄 설명, 가운데 정렬. */
function Headline({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">{eyebrow}</p>
      <h2 className="mt-2 whitespace-pre-line text-[30px] font-bold leading-[1.22] tracking-[-0.035em] text-[color:var(--v2-ink)] min-[360px]:text-[32px] md:text-[48px]">{title}</h2>
      {sub ? <p className="mt-3 text-[17px] text-[color:var(--v2-ink-3)]">{sub}</p> : null}
    </div>
  );
}

/** 참여 후기 — 가로로 넘기는 카드. 예시 항목엔 '예시' 표시(실제 후기로 교체 예정). */
function Reviews({ t }: { t: PlatformT }) {
  const tc = (c: Copy) => t(c.ko, c.en, c.zh, c.vi, c.ja, c.id);
  if (!REVIEWS.length) return null;
  const hasExample = REVIEWS.some((r) => r.example);
  return (
    <section className="py-16">
      <div className="px-5">
        <Headline
          eyebrow={t("참여 후기", "Reviews", "参与者评价", "Cảm nhận", "参加者の声", "Testimoni")}
          title={t("먼저 받아 본 사람들의\n이야기.", "From people\nwho tried it.", "先体验过的人\n怎么说。", "Những người\nđã tham gia nói gì.", "先に受けた人の\n声。", "Kata mereka\nyang sudah ikut.")}
        />
        {hasExample ? (
          <p className="mt-4 text-center">
            <span className="inline-flex rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[color:var(--v2-muted)]">
              {t("예시 · 실제 참여 후기로 교체 예정", "Example · to be replaced with real reviews", "示例 · 将替换为真实评价", "Ví dụ · sẽ thay bằng cảm nhận thật", "例 · 実際の声に差し替え予定", "Contoh · akan diganti testimoni asli")}
            </span>
          </p>
        ) : null}
      </div>
      {/* 휴대폰은 가로로 넘기기, 넓은 화면은 3칸 */}
      <div className="mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:grid md:grid-cols-3 md:overflow-visible">
        {REVIEWS.map((r, i) => (
          <figure key={i} className="flex w-[82%] max-w-[320px] shrink-0 snap-center flex-col rounded-[24px] bg-white p-6 shadow-[0_12px_30px_-20px_rgba(11,70,232,0.5)] md:w-auto md:max-w-none">
            <span aria-hidden className="text-[40px] font-extrabold leading-none text-[color:var(--v2-accent)]">&ldquo;</span>
            <blockquote className="mt-1 flex-1 text-[16px] font-semibold leading-[1.6] tracking-[-0.01em] text-[color:var(--v2-ink)]">{tc(r.quote)}</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[15px] font-extrabold text-[color:var(--v2-accent)]">{r.who.en.charAt(0)}</span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-[color:var(--v2-ink-2)]">{tc(r.who)}</span>
                <span className="block truncate text-[13px] text-[color:var(--v2-muted)]">{tc(r.tag)}</span>
              </span>
              {r.example ? <span className="ml-auto shrink-0 rounded-full bg-[color:var(--v2-band)] px-2 py-0.5 text-[11px] font-bold text-[color:var(--v2-muted)]">{t("예시", "Example", "示例", "Ví dụ", "例", "Contoh")}</span> : null}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Before/After — 칩으로 예시를 넘겨 본다. 예시는 lib/experience-campaign.ts. */
function BeforeAfter({ t }: { t: PlatformT }) {
  const [idx, setIdx] = useState(0);
  const ex = BEFORE_AFTER_EXAMPLES[idx] ?? BEFORE_AFTER_EXAMPLES[0];
  const tc = (c: Copy) => t(c.ko, c.en, c.zh, c.vi, c.ja, c.id);
  return (
    <section className="px-5 py-16">
      <Headline eyebrow="Before / After" title={t("같은 경험도,\n이렇게 달라져요.", "Same experience.\nNew story.", "同样的经历，\n可以这样不同。", "Cùng trải nghiệm,\nkhác cách kể.", "同じ経験でも、\nこんなに変わる。", "Pengalaman sama,\ncerita berbeda.")} />
      <p className="mt-4 text-center">
        <span className="inline-flex rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-[color:var(--v2-muted)]">
          {t("예시 · 실제 상담 사례로 교체 예정", "Example · to be replaced with real cases", "示例 · 将替换为真实咨询案例", "Ví dụ · sẽ thay bằng ca tư vấn thật", "例 · 実際の相談事例に差し替え予定", "Contoh · akan diganti kasus nyata")}
        </span>
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {BEFORE_AFTER_EXAMPLES.map((e, i) => (
          <Chip key={e.tag.ko} active={i === idx} onClick={() => setIdx(i)}>
            {tc(e.tag)}
          </Chip>
        ))}
      </div>
      <div className="mx-auto mt-6 grid max-w-[720px] gap-3 md:grid-cols-2">
        <div className="rounded-[24px] bg-white/70 p-5">
          <span className="inline-flex rounded-full bg-[color:var(--v2-band)] px-2.5 py-1 text-[12px] font-extrabold tracking-[0.04em] text-[color:var(--v2-muted)]">BEFORE</span>
          <p className="mt-3 text-[16px] leading-[1.65] text-[color:var(--v2-muted)] line-through decoration-[#f04452]/50 decoration-2">{tc(ex.before)}</p>
        </div>
        <div className="relative rounded-[24px] bg-white p-5 shadow-[0_14px_34px_-20px_rgba(11,70,232,0.55)]">
          <span className="inline-flex rounded-full bg-[color:var(--v2-accent)] px-2.5 py-1 text-[12px] font-extrabold tracking-[0.04em] text-white">AFTER</span>
          <p className="mt-3 text-[17px] font-bold leading-[1.65] text-[color:var(--v2-ink)]">
            <span className="bg-[linear-gradient(transparent_58%,#ffe98a_58%)]">{tc(ex.after)}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 신청 폼
// ---------------------------------------------------------------------------

type Fields = {
  name: string;
  email: string;
  phone: string;
  nationality: string;
  desiredRole: string;
  resume: File | null;
  coverLetterFile: File | null;
  consultMethod: ConsultMethod | "";
  consentPrivacy: boolean;
  consentCaseStudy: boolean;
};
type FieldKey = keyof Fields;

const EMPTY: Fields = {
  name: "",
  email: "",
  phone: "",
  nationality: "",
  desiredRole: "",
  resume: null,
  coverLetterFile: null,
  consultMethod: "",
  consentPrivacy: false,
  consentCaseStudy: false
};

// 연락이 닿는 이메일이 꼭 있어야 한다 — 형식만 보되 흔한 오타(공백·@ 두 개·TLD 없음)는 걸러낸다.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const NATIONALITY_SUGGESTIONS = ["베트남", "중국", "우즈베키스탄", "몽골", "인도네시아", "일본", "네팔", "미국", "필리핀", "태국"];

function fileExt(name: string) {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m ? m[1].toLowerCase() : "";
}

function fileError(file: File | null, t: PlatformT): string | undefined {
  if (!file) return undefined;
  if (!FILE_EXTS.includes(fileExt(file.name))) return t("PDF·Word·한글 파일만 올릴 수 있어요.", "Only PDF, Word or HWP files.", "只能上传PDF、Word或HWP文件。", "Chỉ tải lên được tệp PDF, Word hoặc HWP.", "PDF・Word・HWPファイルのみアップロードできます。", "Hanya file PDF, Word, atau HWP.");
  if (file.size > FILE_MAX_BYTES) return t("10MB 이하 파일로 올려 주세요.", "Please use a file under 10MB.", "请上传10MB以下的文件。", "Vui lòng chọn tệp tối đa 10MB.", "10MB以下のファイルをアップロードしてください。", "Gunakan file maksimal 10MB.");
  if (file.size === 0) return t("빈 파일이에요. 다른 파일을 골라 주세요.", "This file is empty. Please choose another.", "这是空文件，请选择其他文件。", "Tệp trống. Vui lòng chọn tệp khác.", "空のファイルです。別のファイルを選んでください。", "File kosong. Silakan pilih file lain.");
  return undefined;
}

function validate(f: Fields, t: PlatformT): Partial<Record<FieldKey, string>> {
  const e: Partial<Record<FieldKey, string>> = {};
  if (!f.name.trim()) e.name = t("이름을 입력해 주세요.", "Please enter your name.", "请输入姓名。", "Vui lòng nhập họ tên.", "お名前を入力してください。", "Silakan masukkan nama.");
  if (!f.email.trim()) e.email = t("연락받을 이메일을 입력해 주세요.", "Please enter an email we can reach you at.", "请输入能联系到你的邮箱。", "Vui lòng nhập email để nhận liên hệ.", "連絡先のメールアドレスを入力してください。", "Masukkan email yang bisa kami hubungi.");
  else if (!EMAIL_RE.test(f.email.trim())) e.email = t("이메일 형식을 확인해 주세요.", "Please check your email address.", "请检查邮箱格式。", "Vui lòng kiểm tra lại định dạng email.", "メールアドレスの形式を確認してください。", "Periksa kembali format email.");
  if (f.phone.trim() && !/^[+\d][\d\s-]{6,}$/.test(f.phone.trim())) e.phone = t("휴대폰 번호를 확인해 주세요.", "Please check your phone number.", "请检查手机号码。", "Vui lòng kiểm tra số điện thoại.", "携帯電話番号を確認してください。", "Periksa kembali nomor ponsel.");
  if (!f.desiredRole.trim()) e.desiredRole = t("지원하려는 직무를 입력해 주세요.", "Please enter the role you're applying for.", "请输入应聘职位。", "Vui lòng nhập vị trí muốn ứng tuyển.", "志望職種を入力してください。", "Masukkan posisi yang ingin dilamar.");
  if (!f.resume) e.resume = t("이력서 파일을 첨부해 주세요.", "Please attach your resume.", "请上传简历文件。", "Vui lòng đính kèm tệp CV.", "履歴書ファイルを添付してください。", "Lampirkan file CV.");
  else {
    const re = fileError(f.resume, t);
    if (re) e.resume = re;
  }
  const ce = fileError(f.coverLetterFile, t);
  if (ce) e.coverLetterFile = ce;
  if (!f.consultMethod) e.consultMethod = t("상담 방식을 골라 주세요.", "Please choose a consultation method.", "请选择咨询方式。", "Vui lòng chọn hình thức tư vấn.", "相談方法を選んでください。", "Pilih metode konsultasi.");
  if (!f.consentPrivacy) e.consentPrivacy = t("개인정보 수집·이용에 동의해야 신청할 수 있어요.", "You need to agree to the privacy terms to apply.", "同意收集和使用个人信息后才能申请。", "Bạn cần đồng ý cho thu thập và sử dụng thông tin cá nhân để đăng ký.", "個人情報の収集・利用に同意すると申し込めます。", "Kamu perlu menyetujui pengumpulan dan penggunaan data pribadi untuk mendaftar.");
  if (!f.consentCaseStudy) e.consentCaseStudy = t("익명 사례 공개에 동의해야 신청할 수 있어요.", "You need to agree to anonymous case sharing to apply.", "同意匿名公开案例后才能申请。", "Bạn cần đồng ý công khai trường hợp ẩn danh để đăng ký.", "匿名での事例公開に同意すると申し込めます。", "Kamu perlu menyetujui publikasi kasus secara anonim untuk mendaftar.");
  return e;
}

const FIELD_ORDER: FieldKey[] = ["name", "email", "phone", "nationality", "desiredRole", "resume", "coverLetterFile", "consultMethod", "consentPrivacy", "consentCaseStudy"];

function ApplyForm({
  t,
  tc,
  locale,
  utmRef,
  onDone
}: {
  t: PlatformT;
  tc: (c: Copy) => string;
  locale: string;
  utmRef: React.RefObject<Utm>;
  onDone: () => void;
}) {
  const [f, setF] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);

  const set = <K extends FieldKey>(k: K, v: Fields[K]) => {
    const next = { ...f, [k]: v };
    setF(next);
    // 한 번 제출을 시도한 뒤엔 고치는 즉시 오류가 사라지게.
    if (tried) setErrors(validate(next, t));
  };

  // 파일은 고르자마자 형식·용량을 확인해 바로 알려 준다(제출 전이어도).
  const setFile = (k: "resume" | "coverLetterFile", file: File | null) => {
    const next = { ...f, [k]: file };
    setF(next);
    if (tried) setErrors(validate(next, t));
    else setErrors((prev) => ({ ...prev, [k]: fileError(file, t) }));
  };

  const submit = async () => {
    if (busy) return;
    setTried(true);
    setNotice(null);
    const errs = validate(f, t);
    setErrors(errs);
    const first = FIELD_ORDER.find((k) => errs[k]);
    if (first) {
      document.getElementById(`exp-${first}`)?.focus({ preventScroll: true });
      document.getElementById(`exp-${first}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    try {
      const token = readAccessToken();
      // 파일 첨부라 multipart(FormData) — Content-Type 은 브라우저가 boundary 와 함께 정한다.
      const body = new FormData();
      const put = (k: string, v: string | undefined) => {
        if (v) body.append(k, v);
      };
      put("name", f.name.trim());
      put("email", f.email.trim().toLowerCase());
      put("phone", f.phone.trim() || undefined);
      put("nationality", f.nationality.trim() || undefined);
      put("desiredRole", f.desiredRole.trim());
      put("consultMethod", f.consultMethod);
      put("consentPrivacy", "true");
      put("consentCaseStudy", f.consentCaseStudy ? "true" : "false");
      for (const [k, v] of Object.entries(utmRef.current ?? {})) put(k, v);
      put("locale", locale);
      if (f.resume) body.append("resume", f.resume, f.resume.name);
      if (f.coverLetterFile) body.append("coverLetterFile", f.coverLetterFile, f.coverLetterFile.name);
      const res = await fetch(`${apiBase()}/public/experience-applications`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body
      });
      if (res.status === 409) {
        trackExperienceCampaign("experience_form_duplicate");
        setNotice({ tone: "info", text: t("이미 신청하셨어요. 선정되면 연락드릴게요.", "You've already applied. We'll contact you if you're selected.", "你已经申请过了。如被选中，我们会联系你。", "Bạn đã đăng ký rồi. Nếu được chọn, bọn mình sẽ liên hệ.", "すでにお申し込み済みです。選定されたらご連絡します。", "Kamu sudah mendaftar. Kami akan menghubungimu jika terpilih.") });
        return;
      }
      if (res.status === 429) {
        setNotice({ tone: "error", text: t("잠시 후 다시 시도해 주세요.", "Please try again in a moment.", "请稍后再试。", "Vui lòng thử lại sau giây lát.", "しばらくしてからもう一度お試しください。", "Silakan coba lagi sebentar lagi.") });
        return;
      }
      if (res.status === 400) {
        // 서버가 파일 문제(형식·용량·누락)를 알려 주면 그 문구를 그대로 보여 준다.
        const data = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
        if (data?.code && data.message) {
          setNotice({ tone: "error", text: data.message });
          return;
        }
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackExperienceCampaign("experience_form_submit", {
        consult_method: f.consultMethod,
        case_study: f.consentCaseStudy,
        has_cover_letter_file: Boolean(f.coverLetterFile),
        utm_source: utmRef.current?.utmSource ?? "(none)"
      });
      onDone();
      requestAnimationFrame(() => scrollToForm());
    } catch {
      setNotice({ tone: "error", text: t("신청을 보내지 못했어요. 잠시 후 다시 시도해 주세요.", "We couldn't send your application. Please try again shortly.", "申请未能发送，请稍后再试。", "Không gửi được đơn đăng ký. Vui lòng thử lại sau.", "申し込みを送信できませんでした。しばらくしてからもう一度お試しください。", "Pendaftaran gagal dikirim. Silakan coba lagi nanti.") });
    } finally {
      setBusy(false);
    }
  };

  const methods: [ConsultMethod, string][] = [
    ["ONLINE", t("온라인", "Online", "线上", "Online", "オンライン", "Online")],
    ["OFFLINE", t("오프라인", "In person", "线下", "Trực tiếp", "対面", "Offline")],
    ["ANY", t("상관없음", "Either", "都可以", "Cả hai", "どちらでも", "Bebas")]
  ];

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="mx-auto mt-10 flex max-w-[560px] flex-col gap-6 text-left"
    >
      <Field id="exp-name" label={t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")} required error={errors.name}>
        <input id="exp-name" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" maxLength={80} placeholder={t("이름", "Your name", "姓名", "Họ tên", "氏名", "Nama kamu")} className={inputCls(errors.name)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "exp-name-err" : undefined} />
      </Field>

      <Field id="exp-email" label={t("이메일", "Email", "邮箱", "Email", "メール", "Email")} required error={errors.email} hint={t("선정 안내를 이 이메일로 드려요. 정확히 적어 주세요.", "We'll contact you at this address — please double-check it.", "选定通知将发送到此邮箱，请准确填写。", "Thông báo kết quả sẽ gửi về email này. Hãy nhập chính xác nhé.", "選定のご案内はこのメールに送ります。正確に入力してください。", "Info seleksi akan dikirim ke email ini. Pastikan sudah benar.")}>
        <input id="exp-email" type="email" inputMode="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" maxLength={200} placeholder="name@example.com" className={inputCls(errors.email)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "exp-email-err" : "exp-email-hint"} />
      </Field>

      <Field id="exp-phone" label={t("휴대폰", "Phone", "手机", "Điện thoại", "携帯電話", "Ponsel")} error={errors.phone}>
        <input id="exp-phone" type="tel" inputMode="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" maxLength={40} placeholder="010-0000-0000" className={inputCls(errors.phone)} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "exp-phone-err" : undefined} />
      </Field>

      <Field id="exp-nationality" label={t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kewarganegaraan")}>
        <input id="exp-nationality" list="exp-nationality-list" value={f.nationality} onChange={(e) => set("nationality", e.target.value)} maxLength={80} placeholder={t("예: 베트남", "e.g. Vietnam", "例：越南", "VD: Việt Nam", "例：ベトナム", "Mis. Vietnam")} className={inputCls()} />
        <datalist id="exp-nationality-list">
          {NATIONALITY_SUGGESTIONS.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>

      <Field id="exp-desiredRole" label={t("지원 직무", "Role you're applying for", "应聘职位", "Vị trí ứng tuyển", "志望職種", "Posisi yang dilamar")} required error={errors.desiredRole}>
        <input id="exp-desiredRole" value={f.desiredRole} onChange={(e) => set("desiredRole", e.target.value)} maxLength={120} placeholder={t("예: 해외영업, 마케팅, 무역사무", "e.g. Overseas sales, marketing", "例：海外销售、市场营销、贸易事务", "VD: Kinh doanh quốc tế, marketing", "例：海外営業、マーケティング、貿易事務", "Mis. Penjualan luar negeri, pemasaran")} className={inputCls(errors.desiredRole)} aria-invalid={Boolean(errors.desiredRole)} aria-describedby={errors.desiredRole ? "exp-desiredRole-err" : undefined} />
      </Field>

      <Field id="exp-resume" label={t("이력서 파일", "Resume file", "简历文件", "Tệp CV", "履歴書ファイル", "File CV")} required error={errors.resume} hint={t("PDF·Word·한글 파일, 10MB 이하", "PDF, Word or HWP, up to 10MB", "PDF·Word·HWP文件，10MB以下", "Tệp PDF, Word, HWP, tối đa 10MB", "PDF・Word・HWPファイル、10MB以下", "File PDF, Word, HWP, maks. 10MB")}>
        <FilePicker id="exp-resume" t={t} file={f.resume} error={errors.resume} onChange={(file) => setFile("resume", file)} />
      </Field>

      <Field id="exp-coverLetterFile" label={t("자기소개서 파일", "Cover letter file", "自我介绍书文件", "Tệp thư giới thiệu bản thân", "自己紹介書ファイル", "File esai perkenalan diri")} error={errors.coverLetterFile} hint={t("있으면 함께 올려 주세요. 없어도 괜찮아요.", "Add it if you have one. It's fine if you don't.", "如果有，请一并上传。没有也没关系。", "Nếu có thì gửi kèm nhé. Không có cũng không sao.", "あれば一緒にアップロードしてください。なくても大丈夫です。", "Unggah juga kalau ada. Tidak ada juga tidak apa-apa.")}>
        <FilePicker id="exp-coverLetterFile" t={t} file={f.coverLetterFile} error={errors.coverLetterFile} onChange={(file) => setFile("coverLetterFile", file)} />
      </Field>

      <Field id="exp-consultMethod" label={t("상담 방식", "Consultation method", "咨询方式", "Hình thức tư vấn", "相談方法", "Metode konsultasi")} required error={errors.consultMethod}>
        <div id="exp-consultMethod" role="radiogroup" tabIndex={-1} aria-describedby={errors.consultMethod ? "exp-consultMethod-err" : undefined} className="grid grid-cols-3 gap-2 outline-none">
          {methods.map(([v, label]) => {
            const on = f.consultMethod === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => set("consultMethod", v)}
                className={`h-12 rounded-2xl px-1 text-[15px] font-semibold transition ${on ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)] ring-2 ring-[color:var(--v2-accent)]" : "bg-[color:var(--v2-fill)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-band)]"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

      {/* 동의 — 개인정보(필수, 펼쳐 보기) · 익명 사례 공개(필수) */}
      <div className="flex flex-col gap-3 rounded-[28px] bg-[color:var(--v2-fill)] p-5">
        <div>
          <CheckRow id="exp-consentPrivacy" checked={f.consentPrivacy} onChange={(v) => set("consentPrivacy", v)} invalid={Boolean(errors.consentPrivacy)}>
            <span className="font-semibold text-[color:var(--v2-ink)]">{t("[필수] 개인정보 수집·이용에 동의합니다.", "[Required] I agree to the collection and use of my personal information.", "[必选] 同意收集和使用个人信息", "[Bắt buộc] Tôi đồng ý cho thu thập và sử dụng thông tin cá nhân.", "[必須] 個人情報の収集・利用に同意します。", "[Wajib] Saya setuju atas pengumpulan dan penggunaan data pribadi saya.")}</span>
          </CheckRow>
          <details className="group ml-9 mt-1">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[14px] font-medium text-[color:var(--v2-muted)] [&::-webkit-details-marker]:hidden">
              {t("자세히 보기", "Details", "查看详情", "Xem chi tiết", "詳しく見る", "Lihat detail")}
              <svg viewBox="0 0 24 24" className="h-4 w-4 transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <dl className="mt-3 flex flex-col gap-3 rounded-2xl bg-white p-4 text-[14px] leading-[1.6]">
              {PRIVACY_CONSENT_DETAILS.map((d) => (
                <div key={d.label.ko}>
                  <dt className="font-semibold text-[color:var(--v2-ink-2)]">{tc(d.label)}</dt>
                  <dd className="mt-0.5 text-[color:var(--v2-ink-3)]">{tc(d.value)}</dd>
                </div>
              ))}
            </dl>
          </details>
          {errors.consentPrivacy ? <ErrorText id="exp-consentPrivacy-err">{errors.consentPrivacy}</ErrorText> : null}
        </div>
        <div>
          <CheckRow id="exp-consentCaseStudy" checked={f.consentCaseStudy} onChange={(v) => set("consentCaseStudy", v)} invalid={Boolean(errors.consentCaseStudy)}>
            <span className="font-semibold text-[color:var(--v2-ink)]">{t("[필수] 익명 사례 공개에 동의합니다.", "[Required] I agree to share my case anonymously.", "[必选] 同意匿名公开案例", "[Bắt buộc] Tôi đồng ý công khai trường hợp của mình dưới dạng ẩn danh.", "[必須] 匿名での事例公開に同意します。", "[Wajib] Saya setuju kasus saya dipublikasikan secara anonim.")}</span>
          </CheckRow>
          <p className="ml-9 mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{tc(CASE_STUDY_CONSENT)}</p>
          {errors.consentCaseStudy ? <ErrorText id="exp-consentCaseStudy-err">{errors.consentCaseStudy}</ErrorText> : null}
        </div>
      </div>

      {notice ? (
        <p role="status" className={`rounded-2xl px-4 py-3.5 text-[15px] font-semibold leading-[1.5] ${notice.tone === "info" ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[#fdf2f3] text-[color:var(--v2-attention)]"}`}>
          {notice.text}
        </p>
      ) : null}

      <div>
        <Button full onClick={() => void submit()} disabled={busy}>
          {busy ? (
            <>
              <Spinner /> {t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…")}
            </>
          ) : (
            t("무료 상담 신청하기 →", "Apply for free →", "免费申请咨询 →", "Đăng ký miễn phí →", "無料で相談を申し込む →", "Daftar gratis →")
          )}
        </Button>
        <p className="mt-3 text-center text-[13px] leading-[1.5] text-[color:var(--v2-faint)]">
          {t(`매주 화요일 ${WEEKLY_SLOTS}명을 선정해 개별 연락드려요.`, `Every Tuesday we select ${WEEKLY_SLOTS} people and contact them individually.`, `每周二选定${WEEKLY_SLOTS}人并单独联系。`, `Thứ Ba hằng tuần, bọn mình chọn ${WEEKLY_SLOTS} người và liên hệ riêng.`, `毎週火曜日に${WEEKLY_SLOTS}名を選び、個別にご連絡します。`, `Setiap Selasa kami memilih ${WEEKLY_SLOTS} orang dan menghubungi masing-masing.`)}
        </p>
      </div>
    </form>
  );
}

function inputCls(error?: string) {
  return `h-12 w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)] focus:ring-2 ${error ? "ring-2 ring-[color:var(--v2-attention)]" : "ring-[color:var(--v2-accent)]"}`;
}

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

/** 파일 고르기 — 회색 둥근 칸 + '파일 선택'. 고르면 이름·크기와 지우기(×). id 는 오류 시 포커스 대상(칸 전체). */
function FilePicker({ id, t, file, error, onChange }: { id: string; t: PlatformT; file: File | null; error?: string; onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const describedBy = error ? `${id}-err` : `${id}-hint`;
  return (
    <div
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy}
      className={`flex min-h-[56px] items-center gap-3 rounded-2xl bg-[color:var(--v2-fill)] py-2 pl-4 pr-2 outline-none ${error ? "ring-2 ring-[color:var(--v2-attention)]" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null;
          // 같은 파일을 다시 골라도 onChange 가 오도록 비운다.
          e.target.value = "";
          if (picked) onChange(picked);
        }}
      />
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[color:var(--v2-faint)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
      </svg>
      {file ? (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold text-[color:var(--v2-ink)]">{file.name}</span>
            <span className="block text-[13px] tabular-nums text-[color:var(--v2-muted)]">{formatFileSize(file.size)}</span>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t(`${file.name} 지우기`, `Remove ${file.name}`, `删除${file.name}`, `Xóa ${file.name}`, `${file.name}を削除`, `Hapus ${file.name}`)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--v2-muted)] transition hover:bg-[color:var(--v2-band)]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-[15px] text-[color:var(--v2-faint)]">{t("파일 없음", "No file", "未选择文件", "Chưa có tệp", "ファイルなし", "Belum ada file")}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-10 shrink-0 rounded-full bg-white px-4 text-[14px] font-bold text-[color:var(--v2-accent)] transition hover:opacity-90 active:scale-[0.98]"
          >
            {t("파일 선택", "Choose file", "选择文件", "Chọn tệp", "ファイル選択", "Pilih file")}
          </button>
        </>
      )}
    </div>
  );
}

function Field({ id, label, required, error, hint, right, children }: { id: string; label: string; required?: boolean; error?: string; hint?: string; right?: ReactNode; children: ReactNode }) {
  const t = usePlatformT();
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-[15px] font-semibold text-[color:var(--v2-ink-2)]">
          {label}
          {required ? (
            <span className="ml-1 text-[color:var(--v2-accent)]" aria-hidden>*</span>
          ) : (
            <span className="ml-1.5 text-[13px] font-medium text-[color:var(--v2-faint)]">{t("선택", "Optional", "选填", "Tùy chọn", "任意", "Opsional")}</span>
          )}
        </label>
        {right}
      </div>
      {children}
      {error ? <ErrorText id={`${id}-err`}>{error}</ErrorText> : hint ? <p id={`${id}-hint`} className="mt-2 text-[13px] leading-[1.5] text-[color:var(--v2-muted)]">{hint}</p> : null}
    </div>
  );
}

function ErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-2 text-[13px] font-semibold leading-[1.5] text-[color:var(--v2-attention)]">
      {children}
    </p>
  );
}

/** 체크 한 줄 — 큰 둥근 체크(누르기 쉬운 크기). */
function CheckRow({ id, checked, onChange, invalid, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; invalid?: boolean; children: ReactNode }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[15px] leading-[1.5]">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" aria-invalid={invalid || undefined} />
      <span
        aria-hidden
        className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--v2-accent)] ${checked ? "bg-[color:var(--v2-accent)] text-white" : invalid ? "bg-white text-transparent ring-2 ring-[color:var(--v2-attention)]" : "bg-[color:var(--v2-line)] text-white"}`}
      >
        ✓
      </span>
      <span className="min-w-0">{children}</span>
    </label>
  );
}

/** 접수 완료 — 폼 자리에 다음 단계와 둘러볼 곳. */
function Completion({ t }: { t: PlatformT }) {
  const steps = [
    t(`매주 화요일, 신청서를 읽고 ${WEEKLY_SLOTS}명을 선정해요.`, `Every Tuesday we read applications and select ${WEEKLY_SLOTS} people.`, `每周二，我们会阅读申请并选定${WEEKLY_SLOTS}人。`, `Thứ Ba hằng tuần, bọn mình đọc đơn và chọn ${WEEKLY_SLOTS} người.`, `毎週火曜日、申込書を読んで${WEEKLY_SLOTS}名を選定します。`, `Setiap Selasa, kami membaca pendaftaran dan memilih ${WEEKLY_SLOTS} orang.`),
    t("선정되면 적어 주신 이메일(또는 연락처)로 개별 연락드려요.", "If selected, we'll contact you at the email (or phone) you gave.", "如被选中，我们会通过你填写的邮箱（或联系方式）单独联系你。", "Nếu được chọn, bọn mình sẽ liên hệ riêng qua email (hoặc số điện thoại) bạn đã điền.", "選定された方には、ご記入のメール（または連絡先）に個別にご連絡します。", "Jika terpilih, kami akan menghubungimu lewat email (atau kontak) yang kamu isi."),
    t("상담 일정과 방식(온라인·오프라인)을 함께 정해요.", "We'll set the time and method (online or in person) together.", "一起商定咨询时间和方式（线上·线下）。", "Cùng thống nhất lịch và hình thức tư vấn (online hoặc trực tiếp).", "相談の日程と方法（オンライン・対面）を一緒に決めます。", "Kita tentukan jadwal dan metode konsultasi (online atau tatap muka) bersama.")
  ];
  return (
    <div className="mx-auto max-w-[560px] text-center">
      <span aria-hidden className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--v2-accent-weak)] text-[30px] font-bold text-[color:var(--v2-accent)]">✓</span>
      <p className="mt-5 text-[15px] font-semibold text-[color:var(--v2-accent)]">{t("접수 완료", "Application received", "申请已提交", "Đã nhận đơn", "受付完了", "Pendaftaran diterima")}</p>
      <h2 className="mt-2 whitespace-pre-line text-[30px] font-bold leading-[1.22] tracking-[-0.035em] text-[color:var(--v2-ink)] min-[360px]:text-[32px] md:text-[44px]">
        {t("신청해 주셔서\n고마워요.", "Thanks for\napplying.", "感谢\n你的申请。", "Cảm ơn bạn\nđã đăng ký.", "お申し込み\nありがとうございます。", "Terima kasih\nsudah mendaftar.")}
      </h2>
      <p className="mt-3 text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">
        {t("이번 주에 선정되지 않아도 4주 동안 다음 선정 대상에 자동으로 포함돼요.", "If you're not picked this week, you stay in the running for the next 4 weeks.", "即使本周未被选中，接下来4周内也会自动进入下一轮选定。", "Dù tuần này chưa được chọn, bạn vẫn tự động có mặt trong các đợt chọn tiếp theo trong 4 tuần.", "今週選ばれなくても、4週間は次回以降の選定対象に自動で含まれます。", "Meski belum terpilih minggu ini, kamu otomatis ikut seleksi berikutnya selama 4 minggu.")}
      </p>
      <ol className="mt-8 flex flex-col gap-3 text-left">
        {steps.map((s, i) => (
          <li key={s} className="flex items-start gap-4 rounded-[28px] bg-[color:var(--v2-fill)] px-5 py-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[15px] font-bold text-[color:var(--v2-accent)]">{i + 1}</span>
            <span className="pt-1 text-[16px] font-semibold leading-[1.5] text-[color:var(--v2-ink-2)]">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-10 rounded-[28px] bg-[#eef3ff] px-6 py-8">
        <p className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("기다리는 동안 어플라이를 둘러보세요", "Explore Aply while you wait", "等待期间，逛逛Aply吧", "Trong lúc chờ, hãy khám phá Aply", "待っている間にAplyを見てみましょう", "Sambil menunggu, jelajahi Aply")}</p>
        <p className="mx-auto mt-2 max-w-[380px] text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
          {t("가입하면 이력서·자기소개서를 만들고 외국인 채용 공고에 바로 지원할 수 있어요.", "Sign up to build your resume and cover letter and apply to jobs open to international talent.", "注册后即可制作简历和自我介绍书，并直接申请面向外国人的招聘职位。", "Đăng ký để tạo CV, thư giới thiệu bản thân và ứng tuyển ngay các tin tuyển dụng dành cho người nước ngoài.", "登録すると履歴書・自己紹介書を作成し、外国人向けの求人にすぐ応募できます。", "Daftar untuk membuat CV dan esai perkenalan diri, lalu langsung melamar lowongan untuk talenta asing.")}
        </p>
        <div className="mt-6 flex flex-col gap-2 min-[400px]:flex-row min-[400px]:justify-center">
          <Button href="/talent/signup">{t("어플라이 가입하기", "Sign up for Aply", "注册Aply", "Đăng ký Aply", "Aplyに登録", "Daftar Aply")}</Button>
          <Button href="/talent/jobs" variant="white">{t("채용 공고 보기", "Browse jobs", "查看招聘", "Xem việc làm", "求人を見る", "Lihat lowongan")}</Button>
        </div>
      </div>
    </div>
  );
}

/** 자주 묻는 질문 — 회색 띠 위 흰 카드, 눌러서 펼치기. */
function Faq({ t }: { t: PlatformT }) {
  const items: [string, string][] = [
    [
      t("선정은 언제, 어떻게 하나요?", "When and how are people selected?", "什么时候、如何选定？", "Khi nào và chọn như thế nào?", "選定はいつ、どのように行いますか？", "Kapan dan bagaimana seleksinya?"),
      t(`매주 월요일에 신청서를 검토하고, 화요일에 ${WEEKLY_SLOTS}명을 선정해 개별로 연락드려요. 상담은 그 주 수~금요일에 진행해요.`, `We review applications on Monday and select ${WEEKLY_SLOTS} people on Tuesday, contacting them individually. Consultations run Wednesday to Friday that week.`, `每周一审核申请，周二选定${WEEKLY_SLOTS}人并单独联系。咨询在当周周三至周五进行。`, `Bọn mình xem đơn vào thứ Hai, chọn ${WEEKLY_SLOTS} người vào thứ Ba và liên hệ riêng. Buổi tư vấn diễn ra từ thứ Tư đến thứ Sáu tuần đó.`, `毎週月曜日に申込書を確認し、火曜日に${WEEKLY_SLOTS}名を選んで個別にご連絡します。相談はその週の水〜金曜日に行います。`, `Kami meninjau pendaftaran setiap Senin, memilih ${WEEKLY_SLOTS} orang pada Selasa, dan menghubungi masing-masing. Konsultasi berlangsung Rabu sampai Jumat minggu itu.`)
    ],
    [
      t("선정되지 않으면 연락이 오나요?", "Will I hear back if I'm not selected?", "没被选中会收到通知吗？", "Không được chọn thì có được báo không?", "選ばれなかった場合も連絡はありますか？", "Apakah ada kabar jika tidak terpilih?"),
      t("선정된 분께만 개별 연락드려요. 선정되지 않아도 신청일로부터 4주 동안 다음 주 선정 대상에 자동으로 포함되니 다시 신청하지 않아도 돼요.", "We contact selected applicants only. If you're not selected, you're automatically included in the following weeks' selection for 4 weeks — no need to reapply.", "我们只单独联系被选中的人。即使未被选中，自申请之日起4周内也会自动进入之后每周的选定，无需重新申请。", "Bọn mình chỉ liên hệ riêng với người được chọn. Nếu chưa được chọn, bạn vẫn tự động có mặt trong các đợt chọn hằng tuần tiếp theo trong 4 tuần kể từ ngày đăng ký, không cần đăng ký lại.", "選定された方にのみ個別にご連絡します。選ばれなくても、申込日から4週間は翌週以降の選定対象に自動で含まれるので、再度申し込む必要はありません。", "Kami hanya menghubungi yang terpilih. Jika belum terpilih, kamu otomatis ikut seleksi minggu-minggu berikutnya selama 4 minggu sejak tanggal daftar, jadi tidak perlu mendaftar ulang.")
    ],
    [
      t("상담은 얼마나, 무엇을 해 주나요?", "What does the consultation include?", "咨询多长时间、提供什么？", "Buổi tư vấn kéo dài bao lâu và gồm những gì?", "相談の時間と内容は？", "Berapa lama dan apa saja isi konsultasinya?"),
      t(`1인당 ${EXPERT_SCOPE.ko}을 제공해요. 상담 방식(온라인 화상 또는 오프라인)과 시간은 선정 후 함께 정해요.`, `Each person gets ${EXPERT_SCOPE.en.charAt(0).toLowerCase()}${EXPERT_SCOPE.en.slice(1)}. We'll agree on the method (video call or in person) and time after selection.`, `每人可获得${EXPERT_SCOPE.zh}。咨询方式（线上视频或线下）和时间在选定后一起商定。`, `Mỗi người được ${EXPERT_SCOPE.vi}. Hình thức (gọi video online hoặc gặp trực tiếp) và thời gian sẽ được thống nhất sau khi chọn.`, `お一人につき${EXPERT_SCOPE.ja}を提供します。相談方法（オンラインのビデオ通話または対面）と時間は選定後に一緒に決めます。`, `Setiap orang mendapatkan ${EXPERT_SCOPE.id.charAt(0).toLowerCase()}${EXPERT_SCOPE.id.slice(1)}. Metode (video call online atau tatap muka) dan waktunya kita tentukan bersama setelah seleksi.`)
    ],
    [
      t("기존 자기소개서가 없어도 되나요?", "Do I need an existing cover letter?", "没有现成的自我介绍书也可以吗？", "Chưa có thư giới thiệu bản thân có được không?", "自己紹介書がなくても大丈夫ですか？", "Bagaimana kalau belum punya esai perkenalan diri?"),
      t("네, 이력서만 있어도 돼요. 전문가가 이력서 속 경험을 찾아 이력서·자소서 문장으로 다듬어 드려요.", "No — your resume is enough. The expert will find the experiences in it and polish them into resume and cover letter sentences.", "可以，只要有简历就行。专家会从简历中找出你的经历，打磨成简历和自我介绍书的句子。", "Được, chỉ cần CV là đủ. Chuyên gia sẽ tìm những trải nghiệm trong CV và trau chuốt thành câu văn cho CV và thư giới thiệu bản thân.", "はい、履歴書だけで大丈夫です。専門家が履歴書の中の経験を見つけ、履歴書・自己紹介書の文章に磨き上げます。", "Tidak masalah, CV saja sudah cukup. Ahli akan menemukan pengalaman di CV-mu dan memolesnya jadi kalimat CV dan esai.")
    ],
    [
      t("사례 공개 동의는 꼭 해야 하나요?", "Do I have to agree to share my case?", "必须同意公开案例吗？", "Có bắt buộc đồng ý công khai trường hợp không?", "事例公開への同意は必須ですか？", "Apakah wajib setuju kasus dipublikasikan?"),
      t("네, 이 캠페인은 상담 사례를 익명 Before/After로 소개하는 프로젝트라 신청할 때 동의가 필요해요. 이름·연락처 등 개인을 알 수 있는 정보는 모두 가리고 공개해요.", "Yes. This campaign shares consultation cases as anonymous before/after examples, so consent is required to apply. Names, contacts and anything identifying are removed.", "是的。本活动以匿名Before/After的形式介绍咨询案例，因此申请时需要同意。姓名、联系方式等可识别个人身份的信息都会隐去后再公开。", "Có. Chiến dịch này giới thiệu các ca tư vấn dưới dạng Before/After ẩn danh nên cần bạn đồng ý khi đăng ký. Mọi thông tin có thể nhận diện cá nhân như họ tên, liên hệ đều được ẩn trước khi công khai.", "はい。このキャンペーンは相談事例を匿名のBefore/Afterとして紹介するプロジェクトのため、申し込み時に同意が必要です。氏名・連絡先など個人が特定できる情報はすべて伏せて公開します。", "Ya. Kampanye ini menampilkan kasus konsultasi sebagai Before/After anonim, jadi persetujuan diperlukan saat mendaftar. Semua informasi pengenal pribadi seperti nama dan kontak disamarkan sebelum dipublikasikan.")
    ],
    [
      t("외국인도 신청할 수 있나요?", "Can international students apply?", "外国人也可以申请吗？", "Người nước ngoài có đăng ký được không?", "外国人も申し込めますか？", "Apakah orang asing bisa mendaftar?"),
      t("네. 한국 취업을 준비하는 외국인 유학생과 구직자를 위한 캠페인이에요.", "Yes. This campaign is for international students and job seekers preparing to work in Korea.", "可以。这是为准备在韩国就业的外国留学生和求职者举办的活动。", "Được. Đây là chiến dịch dành cho du học sinh và người tìm việc nước ngoài đang chuẩn bị đi làm tại Hàn Quốc.", "はい。韓国での就職を目指す外国人留学生と求職者のためのキャンペーンです。", "Bisa. Kampanye ini untuk mahasiswa internasional dan pencari kerja asing yang bersiap bekerja di Korea.")
    ]
  ];
  return (
    <section className="px-4 py-14 md:px-8">
      <Headline eyebrow="FAQ" title={t("자주 묻는 질문", "Questions", "常见问题", "Câu hỏi thường gặp", "よくある質問", "Pertanyaan umum")} />
      <div className="mx-auto mt-8 flex max-w-[640px] flex-col gap-2">
        {items.map(([q, a]) => (
          <details key={q} className="group rounded-2xl bg-white px-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[16px] font-semibold text-[color:var(--v2-ink)] [&::-webkit-details-marker]:hidden">
              {q}
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[color:var(--v2-faint)] transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pb-5 text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

"use client";

// v2 모의 면접 — 로그인하지 않은 사람용. 같은 주소(/v2/interviews)에서 로그인 여부로 갈린다.
// 광고(랜딩) 페이지처럼: 히어로(큰 제목·큰 그림·버튼 하나) → 다른 점 셋 → 3단계 → 결과 미리보기 → 지금 바로 체험 →
// 할 수 있는 것 → 실제 면접 질문 → 자주 묻는 질문 → 마지막 권유, 휴대폰은 아래 고정 가입 버튼.
// 답하고 AI 피드백을 받는 건 가입 후(next=/v2/interviews). '무료'는 가입 첫 1회 안내에만 쓴다(사용자 요청).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Page, Section } from "../ui";
import { DictationControls, LevelChip, SpeakButton, useDictation, useSpeak } from "../practice";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { pickDailyQuestion, kstDay, questionText, type DailyQuestion } from "../../../lib/talent/interview-daily";
import { setFabInset, clearFabInset } from "../../../lib/talent/fab-inset";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";
import { ExpressionCard, ReportedQuestions } from "./V2InterviewsScreen";

const SIGNUP = `/talent/signup?next=${encodeURIComponent("/v2/interviews")}`;
const LOGIN = `/talent/login?next=${encodeURIComponent("/v2/interviews")}`;

export function V2InterviewsGuest() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [now] = useState(() => Date.now());
  const daily = pickDailyQuestion(null, kstDay(now));
  const router = useRouter();
  const toSignup = () => router.push(SIGNUP);
  // 휴대폰 아래 고정 가입 버튼 — 전역 피드백 버튼이 덮이지 않게 그만큼 비켜 준다.
  useEffect(() => {
    const apply = () => (window.innerWidth <= 767 ? setFabInset("v2-interviews-guest", 76) : clearFabInset("v2-interviews-guest"));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      clearFabInset("v2-interviews-guest");
    };
  }, []);
  const steps = [
    { title: t("공고를 골라요", "Pick a job", "选择职位", "Chọn tin tuyển dụng", "求人を選ぶ", "Pilih lowongan"), desc: t("어플라이 공고는 물론, 다른 사이트에서 본 공고도 링크나 본문을 붙여 넣으면 돼요. 공고가 없으면 내 이력서로도 시작해요.", "Use an Aply job, or paste a link or text from any other site. No job? Start from your resume.", "可用 Aply 职位，也可粘贴其他网站的链接或内容。没有职位也可从简历开始。", "Dùng tin Aply hoặc dán link/nội dung từ trang khác. Chưa có tin thì bắt đầu từ CV.", "Aplyの求人も、他サイトの求人もリンクか本文を貼るだけ。求人がなくても履歴書から始められます。", "Pakai lowongan Aply atau tempel tautan/teks dari situs lain. Bisa juga dari CV.") },
    { title: t("면접관의 질문에 답해요", "Answer the interviewer", "回答面试官的问题", "Trả lời người phỏng vấn", "面接官の質問に答える", "Jawab pewawancara"), desc: t("공고와 내 이력서에 맞춘 질문을 소리로 들려 드려요. 말로 답하면 받아 적고, 글로 써도 돼요.", "Questions tailored to the job and your resume are read aloud. Speak and it's transcribed — or type.", "根据职位和简历出题并朗读。口头回答会自动转写，也可以打字。", "Câu hỏi theo tin và CV được đọc to. Nói sẽ được ghi lại, hoặc gõ phím.", "求人と履歴書に合わせた質問を読み上げます。話せば文字起こし、書いてもOK。", "Pertanyaan dibacakan; jawab lisan atau ketik.") },
    { title: t("바로 피드백을 받아요", "Get instant feedback", "立即获得反馈", "Nhận phản hồi ngay", "すぐにフィードバック", "Dapat masukan langsung"), desc: t("점수와 잘한 점·고칠 점, 내 경험으로 고쳐 쓴 모범 답안, 면접관이 이어서 물을 질문까지 알려 드려요.", "Score, strengths, fixes, a model answer from your own experience, and the likely follow-up.", "分数、优点、改进点、基于你经历改写的参考答案，以及面试官可能的追问。", "Điểm, ưu điểm, cần sửa, câu mẫu từ kinh nghiệm của bạn và câu hỏi nối tiếp.", "点数・良い点・直す点・自分の経験で直した模範回答・追加質問まで。", "Skor, kelebihan, perbaikan, contoh jawaban, dan pertanyaan lanjutan.") }
  ];

  return (
    <Page>
      {/* ① 히어로 — 광고 첫 화면: 큰 제목 하나 · 큰 그림 · 버튼 하나 */}
      <section className="bg-[#edf1fd] px-5 pb-10 pt-8 md:rounded-b-[40px] md:px-10 md:pt-14">
        <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[color:var(--v2-accent)] px-3.5 py-1.5 text-[15px] font-bold text-white">🎁 {t("가입하면 1회 무료", "1 free session on sign-up", "注册赠送 1 次", "Tặng 1 lượt khi đăng ký", "登録で1回無料", "1 sesi gratis")}</span>
        <h1 className="mt-4 text-[32px] font-bold leading-[1.28] tracking-[-0.03em] text-[color:var(--v2-ink)] md:text-[44px]">
          {t("면접, 이제", "Your interview,", "面试，", "Phỏng vấn,", "面接は、", "Wawancara,")}
          <br />
          <span className="text-[color:var(--v2-accent)]">{t("AI랑 먼저 연습하세요", "practice it with AI first", "先和 AI 练一练", "luyện với AI trước", "まずAIと練習", "latih dulu dengan AI")}</span>
        </h1>
        <p className="mt-3 text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("모의 면접은 실제 면접처럼 질문을 받고 답해 보는 연습이에요. 지원할 공고로 질문을 받고 답하면, AI 면접관이 바로 피드백해 드려요.", "A mock interview is practice that feels like the real thing. Get questions for your job, answer, and an AI interviewer gives feedback right away.", "模拟面试就是像真正面试一样回答问题的练习。按你的职位出题，回答后 AI 面试官立即反馈。", "Phỏng vấn thử là luyện như buổi thật. Nhận câu hỏi theo tin, trả lời và AI phản hồi ngay.", "模擬面接は本番のように質問に答える練習。求人に合わせた質問に答えると、AI面接官がすぐフィードバック。", "Simulasi wawancara seperti aslinya. Jawab pertanyaan sesuai lowongan, AI langsung memberi masukan.")}</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- 큰 장식 그림(흰 바탕 → 곱하기 합성) */}
        <img src="/img_fake_interview.webp" alt="" aria-hidden className="mx-auto mt-4 h-[200px] w-full max-w-[340px] object-contain mix-blend-multiply md:h-[260px] md:max-w-[440px]" />
        <div className="mt-4">
          <Button full href={SIGNUP}>
            {t("가입하고 1회 무료로 시작", "Sign up & try 1 free", "注册免费试 1 次", "Đăng ký, thử miễn phí 1 lần", "登録して1回無料で試す", "Daftar & coba 1x gratis")}
          </Button>
        </div>
        <p className="mt-3 text-center text-[14px] text-[color:var(--v2-ink-3)]">
          {t("이미 계정이 있나요?", "Have an account?", "已有账号？", "Đã có tài khoản?", "アカウントをお持ちですか？", "Sudah punya akun?")}{" "}
          <Link href={LOGIN} className="font-semibold text-[color:var(--v2-accent)]">
            {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
          </Link>
        </p>
      </section>

      {/* ② 한눈에 — 다른 모의 면접과 다른 점 셋 */}
      <section className="grid grid-cols-3 gap-2 px-5 py-8">
        {[
          ["📌", t("공고 맞춤 질문", "Job-tailored questions", "职位定制问题", "Câu hỏi theo tin", "求人に合わせた質問", "Pertanyaan sesuai lowongan")],
          ["⚡", t("답마다 즉시 피드백", "Instant feedback", "即时反馈", "Phản hồi tức thì", "回答ごとに即フィードバック", "Masukan instan")],
          ["🌏", t("6개 언어 화면", "6 languages", "6 种语言", "6 ngôn ngữ", "6言語対応", "6 bahasa")]
        ].map(([icon, label]) => (
          <div key={label} className="flex flex-col items-center rounded-2xl bg-[color:var(--v2-band)] px-2 py-4 text-center">
            <span className="text-[24px]" aria-hidden>
              {icon}
            </span>
            <span className="mt-2 text-[13px] font-bold leading-[1.35] text-[color:var(--v2-ink-2)]">{label}</span>
          </div>
        ))}
      </section>

      {/* ③ 이렇게 진행돼요 — 단계마다 큰 그림 */}
      <section className="px-5 pb-10 pt-2">
        <p className="text-[14px] font-bold text-[color:var(--v2-accent)]">{t("이렇게 진행돼요", "How it works", "进行方式", "Cách hoạt động", "進め方", "Cara kerja")}</p>
        <h2 className="mt-1 text-[26px] font-bold leading-[1.35] tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("3단계면 실전 연습 끝", "Real practice in 3 steps", "3 步完成实战练习", "Luyện thực chiến trong 3 bước", "3ステップで実戦練習", "Latihan nyata dalam 3 langkah")}</h2>
        <ol className="mt-6 flex flex-col gap-4">
          {steps.map((st, i) => (
            <li key={st.title} className="overflow-hidden rounded-3xl bg-[color:var(--v2-band)]">
              {/* eslint-disable-next-line @next/next/no-img-element -- 단계 그림(흰 바탕 → 곱하기 합성) */}
              <img src={STEP_ILLUST[i]} alt="" aria-hidden className="mx-auto h-[150px] w-full object-contain p-4 mix-blend-multiply" />
              <div className="px-5 pb-5">
                <span className="text-[14px] font-bold text-[color:var(--v2-accent)]">STEP {i + 1}</span>
                <p className="mt-1 text-[19px] font-bold text-[color:var(--v2-ink)]">{st.title}</p>
                <p className="mt-1.5 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{st.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ④ 결과는 이렇게 받아요 — 실제 결과 화면 미리보기 */}
      <section className="px-5 pb-10 pt-4">
        <p className="text-[14px] font-bold text-[color:var(--v2-accent)]">{t("결과 미리보기", "Result preview", "结果预览", "Xem trước kết quả", "結果プレビュー", "Pratinjau hasil")}</p>
        <h2 className="mt-1 text-[26px] font-bold leading-[1.35] tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("답 하나에 이만큼 알려 드려요", "This much from a single answer", "一个回答就能得到这些", "Chừng này cho một câu trả lời", "1回答でここまで", "Sebanyak ini dari satu jawaban")}</h2>
        <SampleFeedback t={t} />
        <div className="mt-5">
          <Button full href={SIGNUP}>
            {t("내 답으로 받아 보기 (1회 무료)", "Try with my answer (1 free)", "用我的回答试试（赠 1 次）", "Thử với câu của tôi (miễn phí 1 lần)", "自分の回答で試す（1回無料）", "Coba dengan jawabanku (1x gratis)")}
          </Button>
        </div>
      </section>

      {/* ⑤ 지금 바로 체험 — 로그인 없이(문장 규칙 간단 체크) */}
      <Section band={false} title={t("지금 바로 체험해 보기", "Try it right now", "现在就试试", "Thử ngay bây giờ", "今すぐ試す", "Coba sekarang")}>
        <TryNow t={t} question={daily} />
        {/* 로그인 전엔 국적을 모르니 화면 언어로 — 한국어가 아니면 한국어 면접 표현도 */}
        {locale !== "ko" ? <ExpressionCard t={t} /> : null}
      </Section>

      {/* ⑥ 가입하면 할 수 있는 것 */}
      <WhatYouGet t={t} />

      {/* ⑦ 실제 면접에서 나온 질문 — 다른 사람들이 남긴 질문(공개) */}
      <ReportedQuestions t={t} onPick={toSignup} />

      {/* ⑧ 자주 묻는 질문 */}
      <Faq t={t} />

      {/* ⑨ 마지막 가입 권유 */}
      <div className="px-5 pb-4 pt-4">
        <div className="relative overflow-hidden rounded-3xl bg-[color:var(--v2-ink)] px-6 py-7 text-white">
          {/* 선물 상자 일러스트(투명 배경) — 가입 첫 1회 */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 장식 그림 */}
          <img src="/images/img_banner_point_signup.webp" alt="" aria-hidden className="pointer-events-none absolute -right-3 -top-2 h-[110px] w-[140px] object-contain opacity-95 min-[360px]:h-[124px] min-[360px]:w-[160px]" />
          <span className="relative inline-flex whitespace-nowrap rounded-full bg-[#ffd84d] px-3.5 py-1.5 text-[15px] font-bold text-[#191f28]">🎁 {t("가입하면 1회 무료", "1 free session on sign-up", "注册赠送 1 次", "Tặng 1 lượt khi đăng ký", "登録で1回無料", "1 sesi gratis")}</span>
          <p className="relative mt-3 max-w-[62%] text-[22px] font-bold leading-[1.4]">{t("다음 면접, 연습하고 가요", "Practice before your next interview", "下次面试前先练习", "Luyện trước buổi phỏng vấn tới", "次の面接は練習してから", "Latihan sebelum wawancara berikutnya")}</p>
          <p className="relative mt-1.5 max-w-[62%] text-[14px] leading-[1.6] text-white/75">{t("이메일이나 구글·카카오 계정으로 1분이면 가입해요.", "Sign up in a minute with email or Google/Kakao.", "用邮箱或 Google/Kakao 账号 1 分钟注册。", "Đăng ký trong 1 phút bằng email hoặc Google/Kakao.", "メールかGoogle・Kakaoで1分で登録。", "Daftar 1 menit dengan email atau Google/Kakao.")}</p>
          <div className="relative mt-5">
            <Link href={SIGNUP} className="flex h-12 items-center justify-center rounded-xl bg-white text-[16px] font-semibold text-[color:var(--v2-ink)] transition hover:opacity-90">
              {t("가입하고 무료로 시작하기", "Sign up & start free", "注册并免费开始", "Đăng ký & bắt đầu miễn phí", "登録して無料で始める", "Daftar & mulai gratis")}
            </Link>
          </div>
        </div>
      </div>

      {/* 고정 버튼에 마지막 내용이 가리지 않게 */}
      <div aria-hidden className="h-20 md:hidden" />

      {/* 휴대폰 아래 고정 가입 버튼 — 어디까지 내려도 바로 가입 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--v2-band)] bg-white/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden">
        <Button full href={SIGNUP}>
          🎁 {t("가입하고 1회 무료로 시작", "Sign up & try 1 free", "注册免费试 1 次", "Đăng ký, thử miễn phí 1 lần", "登録して1回無料で試す", "Daftar & coba 1x gratis")}
        </Button>
      </div>
    </Page>
  );
}

// 단계별 일러스트 — ① 공고(문서) ② 마주 앉은 면접 ③ AI 분석.
const STEP_ILLUST = ["/img_process_1.webp", "/img_process_2.webp", "/img_ai_analyze.webp"];

/** 예시 피드백 — 실제 결과 화면과 같은 결(단계 · 잘한 점 · 고칠 점). */
function SampleFeedback({ t }: { t: PlatformT }) {
  return (
    <div className="mt-4 rounded-3xl bg-[color:var(--v2-band)] p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-[color:var(--v2-muted)]">{t("피드백 예시", "Sample feedback", "反馈示例", "Ví dụ phản hồi", "フィードバック例", "Contoh masukan")}</span>
        <LevelChip t={t} score={68} />
      </div>
      <p className="mt-3 text-[15px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{t("Q. 우리 회사에 지원한 이유는 무엇인가요?", "Q. Why did you apply to our company?", "Q. 你为什么申请我们公司？", "Q. Vì sao bạn ứng tuyển công ty chúng tôi?", "Q. 当社に応募した理由は？", "Q. Mengapa melamar ke perusahaan kami?")}</p>
      <p className="mt-2 rounded-2xl bg-white p-3 text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("“외국인 고객을 위한 서비스를 만드는 회사라서 제 경험을 살릴 수 있다고 생각했습니다.”", "“You build services for international customers, so I thought my experience would fit.”", "“贵公司为外国客户打造服务，我觉得能发挥我的经验。”", "“Công ty làm dịch vụ cho khách nước ngoài nên tôi nghĩ kinh nghiệm của mình phù hợp.”", "「外国人顧客向けのサービスを作る会社なので、経験を活かせると思いました。」", "“Perusahaan ini melayani pelanggan asing, jadi pengalamanku cocok.”")}</p>
      <p className="mt-3 text-[14px] leading-[1.6] text-[color:var(--v2-good)]">
        <b>{t("잘한 점", "Good", "优点", "Tốt", "良い点", "Bagus")}</b> · {t("회사가 하는 일과 내 경험을 연결했어요.", "You linked the company's work to your experience.", "把公司业务和自己的经验联系起来了。", "Đã liên kết công việc của công ty với kinh nghiệm.", "会社の事業と自分の経験を結びつけました。", "Menghubungkan bisnis perusahaan dengan pengalamanmu.")}
      </p>
      <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-attention)]">
        <b>{t("고칠 점", "Fix", "改进", "Cần sửa", "直す点", "Perbaiki")}</b> · {t("어떤 경험인지 한 가지를 숫자와 함께 말해 보세요.", "Name one specific experience, with a number.", "具体说一个经历，并带上数字。", "Nêu một kinh nghiệm cụ thể kèm con số.", "どんな経験か一つ、数字と一緒に話しましょう。", "Sebut satu pengalaman spesifik dengan angka.")}
      </p>
      <div className="mt-3 rounded-2xl bg-white p-3">
        <p className="text-[12px] font-bold text-[color:var(--v2-muted)]">{t("이렇게 바꿔 보면 어때요? (모범 답안)", "Try it like this (model answer)", "试试这样说（参考答案）", "Thử nói thế này (câu mẫu)", "こう直しては？（模範回答）", "Coba seperti ini (contoh)")}</p>
        <p className="mt-1 text-[14px] leading-[1.65] text-[color:var(--v2-ink-2)]">{t("“교환학생 때 학교 SNS를 6개월 운영하며 외국인 학생 참여율을 30% 올렸습니다. 외국인 고객을 위한 서비스를 만드는 이곳에서 그 경험을 바로 쓰고 싶어 지원했습니다.”", "“As an exchange student I ran our school's social account for 6 months and raised international students' engagement by 30%. I applied because I want to use that right away building services for international customers.”", "“交换生期间我运营学校社交账号 6 个月，使外国学生参与度提升 30%。贵公司为外国客户打造服务，我希望马上发挥这段经验。”", "“Khi là sinh viên trao đổi, tôi quản lý SNS của trường 6 tháng và tăng tương tác của sinh viên quốc tế 30%. Tôi muốn dùng ngay kinh nghiệm đó.”", "「交換留学中に大学SNSを6か月運営し、留学生の参加率を30%上げました。外国人顧客向けサービスを作る御社で、その経験をすぐ活かしたいと思い応募しました。」", "“Saat pertukaran pelajar, aku mengelola SNS kampus 6 bulan dan menaikkan partisipasi mahasiswa asing 30%. Aku ingin langsung memakai pengalaman itu.”")}</p>
      </div>
      <div className="mt-2 rounded-2xl bg-[color:var(--v2-accent-weak)] p-3">
        <p className="text-[12px] font-bold text-[color:var(--v2-accent)]">{t("면접관이 이어서 물을 질문", "Likely follow-up", "面试官可能追问", "Câu hỏi nối tiếp", "想定される追加質問", "Pertanyaan lanjutan")}</p>
        <p className="mt-1 text-[14px] font-semibold leading-[1.55] text-[color:var(--v2-ink)]">{t("“참여율을 올리려고 구체적으로 무엇을 바꿨나요?”", "“What exactly did you change to raise engagement?”", "“为了提升参与度，你具体改变了什么？”", "“Cụ thể bạn đã thay đổi gì để tăng tương tác?”", "「参加率を上げるために具体的に何を変えましたか？」", "“Apa tepatnya yang kamu ubah?”")}</p>
      </div>
    </div>
  );
}

/** 가입하면 할 수 있는 것 — 그림과 함께 짧게. */
const WHAT_YOU_GET: { img: string; tone: string; title: (t: PlatformT) => string; desc: (t: PlatformT) => string }[] = [
  { img: "/img_fit_postion.webp", tone: "bg-[#edf1fd]", title: (t) => t("내가 지원할 공고에 맞춘 질문", "Questions for the job you want", "针对你要投递职位的问题", "Câu hỏi theo tin bạn ứng tuyển", "応募する求人に合わせた質問", "Pertanyaan sesuai lowongan"), desc: (t) => t("어플라이 공고는 물론 다른 사이트 공고도 링크·본문으로 가져와요. 내 이력서까지 읽고 질문을 만들어요.", "Use Aply jobs or bring any job by link or text — questions also use your resume.", "可用 Aply 职位，也可用链接或内容导入其他职位，并结合你的简历出题。", "Dùng tin Aply hoặc nhập tin khác bằng link/nội dung, kết hợp CV của bạn.", "Aplyの求人も他サイトの求人もリンク・本文で。履歴書まで読んで質問を作ります。", "Lowongan Aply atau lainnya lewat tautan/teks, ditambah CV-mu.") },
  { img: "/img_fake_interview.webp", tone: "bg-[#fff0f3]", title: (t) => t("소리로 듣는 실전 면접", "Real mode with spoken questions", "听题实战面试", "Phỏng vấn thực chiến có đọc câu hỏi", "読み上げで実戦面接", "Mode nyata dengan suara"), desc: (t) => t("면접관처럼 질문을 읽어 주고 시간이 흘러요. 말로 답하면 글자로 받아 적어요.", "Questions are read aloud with a timer; speak and it's transcribed.", "像面试官一样朗读问题并计时，口头回答会自动转写。", "Đọc câu hỏi như người PV, có đồng hồ; nói sẽ được ghi lại.", "面接官のように質問を読み上げ、時間も計ります。話すと文字起こし。", "Pertanyaan dibacakan dengan timer; jawaban lisan ditranskripsi.") },
  { img: "/images/img_ai_interview.webp", tone: "bg-[#e8f8f1]", title: (t) => t("답마다 바로 AI 피드백", "Instant AI feedback per answer", "每个回答即时 AI 反馈", "Phản hồi AI cho từng câu", "回答ごとにすぐAIフィードバック", "Masukan AI tiap jawaban"), desc: (t) => t("점수와 단계, 잘한 점·고칠 점, 내 경험으로 쓴 모범 답안, 꼬리 질문까지 알려 줘요.", "Score, strengths, fixes, a model answer from your experience, and a follow-up question.", "分数、优点、改进点、基于你经历的参考答案和追问。", "Điểm, ưu điểm, cần sửa, câu mẫu từ kinh nghiệm của bạn và câu hỏi nối tiếp.", "点数・良い点・直す点・自分の経験による模範回答・追加質問まで。", "Skor, kelebihan, perbaikan, contoh jawaban, dan pertanyaan lanjutan.") },
  { img: "/img_process_3.webp", tone: "bg-[#fff4e8]", title: (t) => t("면접 전날 볼 한 장", "A night-before sheet", "面试前一天速览", "Bản ôn tập đêm trước", "前日の1枚", "Lembar ringkas malam sebelumnya"), desc: (t) => t("이 회사에서 나올 만한 질문 5개와 내 이력서로 쓴 모범 답안을 한 장에 정리해 줘요.", "5 likely questions for that company and model answers based on your resume, on one page.", "整理该公司可能出现的 5 个问题和基于简历的参考答案。", "5 câu hỏi dự kiến và câu mẫu dựa trên CV, gọn trong một trang.", "その会社で出そうな5問と履歴書による模範回答を1枚に。", "5 prediksi pertanyaan dan contoh jawaban dalam satu halaman.") },
  { img: "/img_ai_analyze.webp", tone: "bg-[color:var(--v2-band)]", title: (t) => t("늘어 가는 내 실력 그래프", "Watch your score grow", "看着自己的分数提升", "Theo dõi điểm tăng dần", "伸びていく実力グラフ", "Lihat skormu naik"), desc: (t) => t("연습할수록 점수와 영역별 강약이 쌓여요. 약한 곳부터 다시 연습하게 도와줘요.", "Scores and strengths by area build up — practice your weak spots first.", "练得越多，分数和各领域强弱越清晰，优先练薄弱处。", "Càng luyện, điểm và điểm mạnh/yếu càng rõ.", "練習するほど点数と分野別の強弱が積み上がります。", "Makin latihan, skor dan area kuat/lemah makin jelas.") }
];

function WhatYouGet({ t }: { t: PlatformT }) {
  return (
    <Section title={t("가입하면 이런 걸 할 수 있어요", "What you get when you sign up", "注册后可以做这些", "Đăng ký để dùng những tính năng này", "登録するとできること", "Yang kamu dapat setelah daftar")}>
      <ul className="flex flex-col gap-2.5">
        {WHAT_YOU_GET.map((w) => (
          <li key={w.img} className={`flex items-center gap-3 rounded-3xl py-3 pl-5 pr-3 ${w.tone}`}>
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{w.title(t)}</span>
              <span className="mt-1 block text-[13px] leading-[1.55] text-[color:var(--v2-ink-3)]">{w.desc(t)}</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- 작은 장식 그림 */}
            <img src={w.img} alt="" aria-hidden className="h-[64px] w-[80px] shrink-0 object-contain mix-blend-multiply" />
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** 자주 묻는 질문 — 눌러서 펼치기. */
function Faq({ t }: { t: PlatformT }) {
  const items: [string, string][] = [
    [t("무료로 어디까지 할 수 있나요?", "What can I do for free?", "免费能做到什么程度？", "Miễn phí được những gì?", "無料でどこまでできますか？", "Apa yang gratis?"), t("가입하면 모의 면접 1회(질문 5개에 대한 AI 피드백)를 무료로 드려요. 오늘의 질문은 매일 1번 이용권 없이 답할 수 있어요.", "On sign-up you get 1 free session (AI feedback on 5 answers). Today's question can be answered once a day without a pass.", "注册后赠送 1 次模拟面试（5 个回答的 AI 反馈）。今日问题每天可免券回答 1 次。", "Đăng ký tặng 1 lượt (phản hồi AI cho 5 câu). Câu hỏi hôm nay được trả lời 1 lần/ngày.", "登録すると模擬面接1回（5問のAIフィードバック）が無料。今日の質問は1日1回チケットなしで。", "Daftar dapat 1 sesi gratis (masukan AI untuk 5 jawaban). Pertanyaan harian sekali sehari.")],
    [t("그다음엔 어떻게 해요?", "And after that?", "之后怎么办？", "Sau đó thì sao?", "その後は？", "Setelah itu?"), t("이용권을 충전해서 계속 연습할 수 있어요. 쓴 만큼만 줄고, 결제 후 7일 안에 쓰지 않았다면 바로 환불할 수 있어요.", "Top up passes to keep practicing. They only decrease as you use them, and unused passes can be refunded within 7 days.", "可充值使用券继续练习，按使用扣除，7 天内未使用可直接退款。", "Nạp vé để luyện tiếp. Chỉ trừ khi dùng; chưa dùng có thể hoàn trong 7 ngày.", "チケットをチャージして続けられます。使った分だけ減り、未使用なら7日以内に返金可。", "Isi tiket untuk lanjut. Berkurang saat dipakai; bisa refund dalam 7 hari jika belum dipakai.")],
    [t("외국인도 쓸 수 있나요?", "Can international students use it?", "外国人也能用吗？", "Người nước ngoài dùng được không?", "外国人も使えますか？", "Bisa untuk WNA?"), t("네. 화면은 6개 언어로 볼 수 있고, 질문은 한국어 면접 그대로 연습해요. 질문 아래에 한국어 원문도 함께 보여 줘요.", "Yes. The app works in 6 languages and you practice real Korean interview questions, with the Korean original shown.", "可以。界面支持 6 种语言，按韩语面试原样练习，并显示韩语原文。", "Có. Giao diện 6 ngôn ngữ, luyện câu hỏi phỏng vấn tiếng Hàn kèm bản gốc.", "はい。画面は6言語、質問は韓国語の面接そのままで練習します。", "Ya. Tersedia 6 bahasa, latihan pertanyaan wawancara bahasa Korea.")],
    [t("내 답이 다른 사람에게 보이나요?", "Will others see my answers?", "我的回答会被别人看到吗？", "Người khác có thấy câu trả lời?", "回答は他人に見えますか？", "Apakah jawabanku terlihat orang lain?"), t("아니요. 내 연습 답은 나만 봐요. 잘한 답을 이름 없이 예시로 공유하는 건 내가 직접 고를 때만이에요.", "No. Your practice answers are private. Sharing a great answer anonymously happens only if you choose to.", "不会。练习回答仅自己可见，只有你主动选择时才会匿名分享。", "Không. Câu trả lời chỉ bạn thấy; chia sẻ ẩn danh chỉ khi bạn chọn.", "いいえ。自分だけが見られます。匿名共有は自分で選んだときだけ。", "Tidak. Hanya kamu yang melihat; berbagi anonim hanya jika kamu pilih.")],
    [t("다른 모의 면접과 뭐가 달라요?", "How is this different?", "和其他模拟面试有什么不同？", "Khác gì các dịch vụ khác?", "他の模擬面接と何が違う？", "Apa bedanya?"), t("일반 질문이 아니라 내가 지원할 공고와 내 이력서로 질문을 만들고, 이 회사에서 실제로 나온 면접 질문까지 함께 연습해요.", "Questions come from the job you're applying to and your resume — plus real questions others got at that company.", "不是通用问题，而是根据你要投递的职位和简历出题，还能练习该公司真实出现过的问题。", "Câu hỏi theo tin bạn ứng tuyển và CV, kèm câu hỏi thật tại công ty đó.", "一般的な質問ではなく、応募する求人と履歴書から質問を作り、その会社で実際に出た質問も練習します。", "Pertanyaan dari lowongan dan CV-mu, plus pertanyaan nyata di perusahaan itu.")]
  ];
  return (
    <Section title={t("자주 묻는 질문", "FAQ", "常见问题", "Câu hỏi thường gặp", "よくある質問", "Pertanyaan umum")}>
      <div className="flex flex-col">
        {items.map(([q, a]) => (
          <details key={q} className="group border-b border-[color:var(--v2-band)] py-1 last:border-b-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3 text-[16px] font-semibold text-[color:var(--v2-ink)] [&::-webkit-details-marker]:hidden">
              {q}
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[color:var(--v2-faint)] transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            <p className="pb-4 text-[14px] leading-[1.7] text-[color:var(--v2-ink-3)]">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/** 지금 바로 체험 — 질문 듣기 · 말이나 글로 답하기 · [바로 체크](문장 규칙으로 즉석 확인) → 가입하면 AI 피드백. */
function TryNow({ t, question }: { t: PlatformT; question: DailyQuestion }) {
  const { locale } = useLanguage();
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<string | null>(null);
  const tts = useSpeak();
  const dict = useDictation({ onFinal: (add) => setAnswer((a) => (a.trim() ? `${a.trim()} ${add}` : add)) });
  const text = answer.trim();
  // 간단 체크 — AI 가 아니라 문장 규칙(길이·숫자·내 행동·결과)으로. 확인한 답이 바뀌면 다시 누르게.
  const result = checked !== null && checked === text ? quickCheck(text) : null;
  const checks = result
    ? [
        { ok: result.long, good: t(`말하면 약 ${result.seconds}초 — 알맞은 길이예요`, `About ${result.seconds}s spoken — good length`, `说出来约 ${result.seconds} 秒——长度合适`, `Nói khoảng ${result.seconds}s — vừa đủ`, `話すと約${result.seconds}秒 — ちょうど良い長さ`, `Sekitar ${result.seconds} detik — pas`), bad: t(`말하면 약 ${result.seconds}초 — 30초~1분이 되게 조금 더 길게`, `About ${result.seconds}s — aim for 30s–1min`, `约 ${result.seconds} 秒——建议 30 秒到 1 分钟`, `Khoảng ${result.seconds}s — nên 30s–1 phút`, `約${result.seconds}秒 — 30秒〜1分を目安に`, `Sekitar ${result.seconds} detik — targetkan 30 dtk–1 mnt`) },
        { ok: result.number, good: t("숫자로 보여 줬어요", "You used numbers", "用了数字", "Có dùng con số", "数字で示せています", "Ada angka"), bad: t("기간·인원·결과 같은 숫자를 넣어 보세요", "Add numbers (time, team size, results)", "加入期间、人数、结果等数字", "Thêm con số (thời gian, số người, kết quả)", "期間・人数・結果などの数字を", "Tambahkan angka") },
        { ok: result.action, good: t("내가 한 행동이 보여요", "Your actions are clear", "能看出你做了什么", "Thấy rõ việc bạn làm", "自分の行動が見えます", "Tindakanmu jelas"), bad: t("'제가 ~을 맡아 ~했다'처럼 내 행동을 넣어 보세요", "Say what you did: 'I took on … and …'", "加入“我负责……做了……”这样的行动", "Nêu việc bạn đã làm", "「私が〜を担当し〜した」と行動を", "Sebut apa yang kamu lakukan") },
        { ok: result.ending, good: t("결과나 배운 점으로 마무리했어요", "You end with a result or lesson", "以结果或收获收尾", "Kết bằng kết quả/bài học", "結果や学びで締めています", "Diakhiri hasil/pelajaran"), bad: t("결과나 배운 점으로 마무리해 보세요", "End with a result or what you learned", "用结果或收获来收尾", "Kết bằng kết quả hoặc bài học", "結果や学んだことで締めましょう", "Akhiri dengan hasil/pelajaran") }
      ]
    : [];
  const good = checks.filter((c) => c.ok).length;
  return (
    <div className="rounded-3xl bg-[color:var(--v2-band)] p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="text-[13px] font-bold text-[color:var(--v2-accent)]">
            {t("오늘의 질문", "Today's question", "今日问题", "Câu hỏi hôm nay", "今日の質問", "Pertanyaan hari ini")} · {mockCategoryLabelOf(t, question.category)}
          </span>
          <span className="mt-1.5 block text-[18px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questionText(t, question)}</span>
          {locale !== "ko" ? <span className="mt-1 block text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {question.ko}</span> : null}
        </span>
        <SpeakButton t={t} onSpeak={() => tts.speak(question.ko)} />
      </div>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={5}
        placeholder={t("면접관에게 말하듯 편하게 답해 보세요. 마이크로 말해도 돼요.", "Answer as if talking to the interviewer — you can use the mic.", "像对面试官说话一样回答，也可以用麦克风。", "Trả lời như đang nói với người phỏng vấn — có thể dùng mic.", "面接官に話すように答えてみましょう。マイクでもOK。", "Jawab seperti berbicara ke pewawancara — bisa pakai mikrofon.")}
        className="mt-4 w-full resize-none rounded-2xl bg-white p-4 text-[16px] leading-[1.65] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2"
      />
      <DictationControls t={t} dict={dict} right={<span className="text-[13px] tabular-nums text-[color:var(--v2-faint)]">{text.length}{t("자", " chars", "字", " ký tự", "字", " karakter")}</span>} />
      <div className="mt-3">
        <Button full onClick={() => { dict.stop(); setChecked(text); }} disabled={text.length < 10}>
          {t("바로 체크해 보기", "Quick check", "快速检查", "Kiểm tra nhanh", "すぐにチェック", "Cek cepat")}
        </Button>
      </div>
      {result ? (
        <div className="mt-4 rounded-2xl bg-white p-4">
          <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t(`간단 체크 ${good} / ${checks.length}`, `Quick check ${good} / ${checks.length}`, `快速检查 ${good} / ${checks.length}`, `Kiểm tra nhanh ${good} / ${checks.length}`, `簡単チェック ${good} / ${checks.length}`, `Cek cepat ${good} / ${checks.length}`)}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-[14px] leading-[1.55]">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${c.ok ? "bg-[color:var(--v2-good)]" : "bg-[color:var(--v2-attention)]"}`} aria-hidden>
                  {c.ok ? "✓" : "!"}
                </span>
                <span className={c.ok ? "text-[color:var(--v2-ink-2)]" : "text-[color:var(--v2-ink-3)]"}>{c.ok ? c.good : c.bad}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-[1.5] text-[color:var(--v2-faint)]">{t("문장 규칙으로 본 간단 체크예요. AI 피드백은 내용까지 읽고 잘한 점·고칠 점·모범 답안을 알려 줘요.", "A rule-based quick check. AI feedback reads the content and gives strengths, fixes and a model answer.", "这是基于规则的快速检查。AI 反馈会阅读内容，给出优点、改进点和参考答案。", "Đây là kiểm tra theo quy tắc. Phản hồi AI đọc nội dung và đưa nhận xét, câu mẫu.", "文の規則による簡単チェックです。AIフィードバックは内容まで読みます。", "Cek berbasis aturan. Masukan AI membaca isi jawaban.")}</p>
          <div className="mt-3">
            <Button full href={SIGNUP}>
              {t("가입하고 AI 피드백 받기 (1회 무료)", "Sign up for AI feedback (1 free)", "注册获取 AI 反馈（赠 1 次）", "Đăng ký nhận phản hồi AI (miễn phí 1 lần)", "登録してAIフィードバック（1回無料）", "Daftar untuk masukan AI (1x gratis)")}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** 간단 체크 — 길이(말하기 시간 추정)·숫자·내 행동·결과/배운 점. 한국어 답 기준의 낱말 규칙(영어 낱말도 조금). */
function quickCheck(text: string) {
  const seconds = Math.max(1, Math.round(text.replace(/\s+/g, "").length / 6)); // 한국어 말하기 약 초당 6글자
  return {
    seconds,
    long: seconds >= 25,
    number: /\d|[일이삼사오육칠팔구십백천만]+\s*(명|건|개|년|개월|주|%|퍼센트|배)/.test(text),
    action: /(했|맡|만들|이끌|개선|해결|담당|기획|운영|분석|제안|진행|led|built|made|managed|improved|solved)/i.test(text),
    ending: /(그래서|결과|덕분|배웠|배운|느꼈|앞으로|기여|성장|result|learned|so that)/i.test(text)
  };
}

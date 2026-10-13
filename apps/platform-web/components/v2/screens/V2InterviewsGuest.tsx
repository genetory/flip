"use client";

// v2 모의 면접 — 로그인하지 않은 사람용. 같은 주소(/v2/interviews)에서 로그인 여부로 갈린다.
// 연습 방법·예시 피드백으로 "가입하면 이렇게 연습한다"를 보여 주고, 공개된 것(오늘의 질문·실제 면접 질문·한국어 표현)은 그대로 보여 준다.
// 답하고 AI 피드백을 받는 건 가입 후(next=/v2/interviews). 모의 면접은 유료 예정 — 화면에 '무료'를 쓰지 않는다.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Masthead, Page, Section } from "../ui";
import { LevelChip } from "../practice";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { pickDailyQuestion, kstDay, questionText } from "../../../lib/talent/interview-daily";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";
import { ExpressionCard, PracticeCard, ReportedQuestions } from "./V2InterviewsScreen";

const SIGNUP = `/talent/signup?next=${encodeURIComponent("/v2/interviews")}`;
const LOGIN = `/talent/login?next=${encodeURIComponent("/v2/interviews")}`;

export function V2InterviewsGuest() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [now] = useState(() => Date.now());
  const daily = pickDailyQuestion(null, kstDay(now));
  const router = useRouter();
  const toSignup = () => router.push(SIGNUP);

  return (
    <Page>
      <Masthead
        eyebrow={t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}
        title={t("면접, 미리 연습해 두세요", "Practice before the real thing", "提前练习面试吧", "Hãy luyện phỏng vấn trước", "面接を先に練習しておきましょう", "Latih wawancara lebih dulu")}
        lede={t("지원할 공고로 질문을 받고, 말이나 글로 답하면 AI가 잘한 점과 고칠 점, 모범 답안까지 알려 줘요.", "Get questions for the job you're applying to, answer by voice or text, and AI shows what worked, what to fix, and a model answer.", "针对要投递的职位出题，用语音或文字作答，AI 会指出优点、改进点并给出参考答案。", "Nhận câu hỏi theo tin bạn ứng tuyển, trả lời bằng giọng nói hoặc chữ, AI chỉ điểm tốt, cần sửa và câu mẫu.", "応募する求人で質問を受け、声か文字で答えるとAIが良い点・直す点・模範回答を教えます。", "Dapat pertanyaan sesuai lowongan, jawab dengan suara atau teks, AI beri masukan dan contoh jawaban.")}
        action={
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex">
            <Button href={SIGNUP}>{t("시작하기", "Get started", "开始使用", "Bắt đầu", "はじめる", "Mulai")}</Button>
            <Button variant="secondary" href={LOGIN}>
              {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Button>
          </div>
        }
      />

      {/* 가입 첫 1회 — 공고 하나로 해 보기(가입하면 이용권 1회가 들어간다). 이 문구만 '무료'를 쓴다(사용자 요청). */}
      <div className="px-5 pb-8">
        <Link href={SIGNUP} className="flex items-center gap-3 overflow-hidden rounded-3xl bg-[#fff4e8] py-4 pl-5 pr-3 transition hover:-translate-y-0.5">
          <span className="min-w-0 flex-1">
            <span className="block text-[18px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{t("가입하면 공고 1개는 무료예요", "Sign up and try one job free", "注册即可免费练习 1 个职位", "Đăng ký để luyện miễn phí 1 tin", "登録すると求人1件は無料", "Daftar, 1 lowongan gratis")}</span>
            <span className="mt-1 block text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{t("원하는 공고로 질문 5개에 답하고 AI 피드백까지 받아 보세요.", "Answer 5 questions for a job you choose and get AI feedback.", "选一个职位回答 5 个问题，获得 AI 反馈。", "Trả lời 5 câu theo tin bạn chọn và nhận phản hồi AI.", "好きな求人で5問に答えてAIフィードバックまで。", "Jawab 5 pertanyaan untuk lowongan pilihanmu dan dapat masukan AI.")}</span>
            <span className="mt-3 inline-flex h-9 items-center rounded-lg bg-[color:var(--v2-ink)] px-3.5 text-[14px] font-semibold text-white">{t("가입하고 해 보기", "Sign up & try", "注册并试试", "Đăng ký & thử", "登録して試す", "Daftar & coba")}</span>
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- 장식 그림(모의 면접 장면, 흰 바탕 → 곱하기 합성) */}
          <img src="/img_fake_interview.webp" alt="" aria-hidden className="h-[96px] w-[120px] shrink-0 object-contain mix-blend-multiply min-[360px]:h-[112px] min-[360px]:w-[144px]" />
        </Link>
      </div>

      {/* 오늘의 질문 — 맛보기(답하고 피드백은 가입 후) */}
      <Section title={t("오늘의 질문", "Today's question", "今日问题", "Câu hỏi hôm nay", "今日の質問", "Pertanyaan hari ini")}>
        <div className="rounded-3xl bg-[#edf1fd] p-5">
          <span className="text-[13px] font-bold text-[color:var(--v2-accent)]">{mockCategoryLabelOf(t, daily.category)}</span>
          <p className="mt-1.5 text-[18px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questionText(t, daily)}</p>
          {locale !== "ko" ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {daily.ko}</p> : null}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[14px] text-[color:var(--v2-ink-3)]">{t("매일 새 질문이 와요. 2분이면 답할 수 있어요.", "A new question every day. Takes 2 minutes.", "每天一道新题，只需 2 分钟。", "Mỗi ngày một câu mới. Chỉ 2 phút.", "毎日新しい質問。2分で答えられます。", "Pertanyaan baru tiap hari. 2 menit.")}</span>
            <Button size="sm" href={SIGNUP}>
              {t("답해 보기", "Try it", "试着回答", "Thử trả lời", "答えてみる", "Coba")}
            </Button>
          </div>
        </div>
        {/* 로그인 전엔 국적을 모르니 화면 언어로 — 한국어가 아니면 한국어 면접 표현도 */}
        {locale !== "ko" ? <ExpressionCard t={t} /> : null}
      </Section>

      {/* 이렇게 연습해요 — 세 단계 + 예시 피드백 */}
      <Section title={t("이렇게 연습해요", "How it works", "这样练习", "Cách luyện tập", "こう練習します", "Cara berlatih")}>
        <ol className="flex flex-col gap-2.5">
          <Step n={1} title={t("공고 고르기", "Pick a job", "选择职位", "Chọn tin", "求人を選ぶ", "Pilih lowongan")} meta={t("어플라이 공고는 물론, 다른 사이트 공고도 링크·본문으로 가져와요", "Aply jobs, or bring any job by link or pasted text", "Aply 职位，或用链接/内容导入其他职位", "Tin Aply, hoặc nhập tin khác bằng link/nội dung", "Aplyの求人も、他サイトの求人もリンク・本文で", "Lowongan Aply atau dari situs lain lewat tautan/teks")} />
          <Step n={2} title={t("질문에 답하기", "Answer questions", "回答问题", "Trả lời câu hỏi", "質問に答える", "Jawab pertanyaan")} meta={t("공고·내 이력서에 맞춘 질문에 말로 하거나 글로 써요", "Speak or type answers to questions tailored to the job and your resume", "针对职位和简历的问题，可语音或文字作答", "Nói hoặc viết câu trả lời theo tin và CV", "求人・履歴書に合わせた質問に話すか書いて答える", "Jawab dengan suara/teks, sesuai lowongan & CV")} />
          <Step n={3} title={t("피드백 받기", "Get feedback", "获得反馈", "Nhận phản hồi", "フィードバックを受ける", "Dapat masukan")} meta={t("잘한 점·고칠 점·모범 답안, 면접 전날 볼 예상 질문까지", "What worked, what to fix, a model answer — plus likely questions for the night before", "优点、改进点、参考答案，以及面试前一天看的预测问题", "Điểm tốt, cần sửa, câu mẫu và câu hỏi dự kiến", "良い点・直す点・模範回答、前日の予想質問まで", "Masukan, contoh jawaban, dan prediksi pertanyaan")} />
        </ol>
        <SampleFeedback t={t} />
      </Section>

      {/* 연습 방법 — 로그인 화면과 같은 카드(누르면 가입) */}
      <Section title={t("연습하기", "Practice", "练习", "Luyện tập", "練習する", "Latihan")}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <PracticeCard tone="blue" icon="📌" title={t("내 공고로", "My jobs", "我的职位", "Tin của tôi", "自分の求人で", "Lowonganku")} meta={t("지원·저장한 공고", "Applied & saved", "投递/收藏的职位", "Đã ứng tuyển/lưu", "応募・保存した求人", "Dilamar/disimpan")} onClick={toSignup} />
          <PracticeCard tone="violet" icon="🔗" title={t("가고 싶은 회사 공고", "Job you want", "想去的公司职位", "Tin công ty mơ ước", "行きたい会社の求人", "Lowongan incaran")} meta={t("링크로 가져오기", "Import by link", "通过链接导入", "Nhập bằng link", "リンクで取り込む", "Impor lewat tautan")} onClick={toSignup} />
          <PracticeCard tone="navy" icon="⏱️" title={t("10분 모의 면접", "10-min mock", "10 分钟模拟面试", "PV thử 10 phút", "10分模擬面接", "Simulasi 10 menit")} meta={t("질문 5개 연달아", "5 questions in a row", "连续 5 题", "5 câu liên tiếp", "5問連続", "5 pertanyaan")} onClick={toSignup} />
          <PracticeCard tone="orange" icon="🙋" title={t("1분 자기소개", "1-min intro", "1 分钟自我介绍", "Giới thiệu 1 phút", "1分自己紹介", "Perkenalan 1 menit")} meta={t("시간 재며 연습", "Timed practice", "计时练习", "Luyện có giờ", "時間を測って練習", "Latihan berwaktu")} onClick={toSignup} />
        </div>
      </Section>

      {/* 실제 면접에서 나온 질문 — 공개 데이터(누르면 가입해서 연습) */}
      <ReportedQuestions t={t} onPick={toSignup} />

      <div className="px-5 pb-4 pt-4">
        <div className="rounded-3xl bg-[color:var(--v2-ink)] px-6 py-7 text-white">
          <p className="text-[20px] font-bold leading-[1.4]">{t("다음 면접, 연습하고 가요", "Practice before your next interview", "下次面试前先练习", "Luyện trước buổi phỏng vấn tới", "次の面接は練習してから", "Latihan sebelum wawancara berikutnya")}</p>
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

function Step({ n, title, meta }: { n: number; title: string; meta: string }) {
  return (
    <li className="flex items-start gap-3 rounded-2xl bg-[color:var(--v2-band)] px-4 py-3.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-bold text-[color:var(--v2-accent)]">{n}</span>
      <span className="min-w-0">
        <span className="block text-[16px] font-bold text-[color:var(--v2-ink)]">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-[1.5] text-[color:var(--v2-muted)]">{meta}</span>
      </span>
    </li>
  );
}

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
    </div>
  );
}

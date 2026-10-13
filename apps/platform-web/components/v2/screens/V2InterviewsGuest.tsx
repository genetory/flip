"use client";

// v2 모의 면접 — 로그인하지 않은 사람용. 같은 주소(/v2/interviews)에서 로그인 여부로 갈린다.
// 연습 방법·예시 피드백으로 "가입하면 이렇게 연습한다"를 보여 주고, 공개된 것(오늘의 질문·실제 면접 질문·한국어 표현)은 그대로 보여 준다.
// 답하고 AI 피드백을 받는 건 가입 후(next=/v2/interviews). 모의 면접은 유료 예정 — 화면에 '무료'를 쓰지 않는다.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Masthead, Page, Section } from "../ui";
import { DictationControls, LevelChip, SpeakButton, useDictation, useSpeak } from "../practice";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { pickDailyQuestion, kstDay, questionText, type DailyQuestion } from "../../../lib/talent/interview-daily";
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
      />

      {/* 실전 모드 + 가입 첫 1회 — 로그인 화면의 시작 카드와 같은 모양. 이 카드만 '무료'를 쓴다(사용자 요청). */}
      <div className="-mt-2 px-5 pb-8">
        <div className="rounded-3xl bg-[#edf1fd] p-5">
          <div className="flex items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[12px] font-bold text-[color:var(--v2-accent)]">🎁 {t("가입하면 1회 무료", "1 free session on sign-up", "注册赠送 1 次", "Tặng 1 lượt khi đăng ký", "登録で1回無料", "1 sesi gratis")}</span>
              <span className="mt-2 block text-[20px] font-bold leading-[1.35] text-[color:var(--v2-ink)]">{t("AI 면접관과 5분 실전 면접", "5-minute interview with an AI interviewer", "与 AI 面试官 5 分钟实战", "Phỏng vấn 5 phút với AI", "AI面接官と5分の実戦面接", "Wawancara 5 menit dengan AI")}</span>
              <span className="mt-1 block text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{t("원하는 공고로 질문 5개를 소리로 듣고 답하면, 잘한 점·고칠 점·모범 답안까지.", "Hear 5 questions for a job you choose, answer, and get strengths, fixes and a model answer.", "选一个职位听 5 个问题并作答，获得优点、改进点和参考答案。", "Nghe 5 câu theo tin bạn chọn, trả lời và nhận nhận xét, câu mẫu.", "好きな求人で5問を聞いて答えると、良い点・直す点・模範回答まで。", "Dengar 5 pertanyaan, jawab, dapat masukan & contoh jawaban.")}</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element -- 장식 그림(흰 바탕 → 곱하기 합성) */}
            <img src="/img_fake_interview.webp" alt="" aria-hidden className="h-[88px] w-[108px] shrink-0 object-contain mix-blend-multiply min-[360px]:h-[100px] min-[360px]:w-[124px]" />
          </div>
          <div className="mt-4">
            <Button full href={SIGNUP}>
              {t("가입하고 무료로 시작하기", "Sign up & start free", "注册并免费开始", "Đăng ký & bắt đầu miễn phí", "登録して無料で始める", "Daftar & mulai gratis")}
            </Button>
          </div>
          <p className="mt-3 text-center text-[13px] text-[color:var(--v2-ink-3)]">
            {t("이미 계정이 있나요?", "Have an account?", "已有账号？", "Đã có tài khoản?", "アカウントをお持ちですか？", "Sudah punya akun?")}{" "}
            <Link href={LOGIN} className="font-semibold text-[color:var(--v2-accent)]">
              {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Link>
          </p>
        </div>
      </div>

      {/* 지금 바로 체험 — 로그인 없이 오늘의 질문을 듣고 답하면 간단 체크(문장 규칙, AI 아님). AI 피드백은 가입 후. */}
      <Section title={t("지금 바로 체험해 보기", "Try it right now", "现在就试试", "Thử ngay bây giờ", "今すぐ試す", "Coba sekarang")}>
        <TryNow t={t} question={daily} />
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

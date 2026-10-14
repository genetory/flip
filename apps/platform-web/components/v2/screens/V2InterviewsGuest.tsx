"use client";

// v2 모의 면접 — 로그인하지 않은 사람용. 같은 주소(/v2/interviews)에서 로그인 여부로 갈린다.
// 애플 제품 페이지 같은 한 편의 광고: 가운데 정렬 · 아주 큰 제목 · 흰/회색/검정 띠가 번갈아.
// 히어로 → 기능 타일 셋 → 실제 결과 화면 → 6개 언어 → 한 문제 체험 → 그리고 더 → 실제 면접 질문 → 자주 묻는 질문 → 마지막 권유,
// 휴대폰은 아래 고정 가입 버튼.
// 답하고 AI 피드백을 받는 건 가입 후(next=/v2/interviews). '무료'는 가입 첫 1회 안내에만 쓴다(사용자 요청).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Page, Section, Switch } from "../ui";
import { DictationControls, Highlighted, PointCard, ResultSummary, SpeakButton, TimerBar, useDictation, useSpeak } from "../practice";
import type { InterviewFeedback } from "../../../lib/member-profile-client";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { pickDailyQuestion, kstDay, questionText, type DailyQuestion } from "../../../lib/talent/interview-daily";
import { setFabInset, clearFabInset } from "../../../lib/talent/fab-inset";
import { mockCategoryLabelOf } from "../../../lib/talent/career-labels";
import { ExpressionCard, ReportedQuestions } from "./V2InterviewsScreen";

const SIGNUP = `/talent/signup?next=${encodeURIComponent("/talent/career/interviews")}`;
const LOGIN = `/talent/login?next=${encodeURIComponent("/talent/career/interviews")}`;

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
  const tiles = [
    {
      img: "/img_process_1.webp",
      eyebrow: t("공고 맞춤 질문", "Tailored questions", "职位定制问题", "Câu hỏi theo tin", "求人に合わせた質問", "Pertanyaan khusus"),
      title: t("내가 지원할\n그 공고로.", "From the job\nyou want.", "就用你要投的\n那个职位。", "Từ chính tin\nbạn ứng tuyển.", "応募する\nその求人で。", "Dari lowongan\nyang kamu incar."),
      desc: t("어플라이 공고도, 다른 사이트에서 본 공고도. 링크나 본문만 붙여 넣으면 내 이력서까지 읽고 질문을 만들어요.", "Aply jobs or any other site — paste a link or text and questions are built from it and your resume.", "Aply 职位或其他网站的职位，粘贴链接或内容，结合你的简历出题。", "Tin Aply hay trang khác — dán link/nội dung, câu hỏi tạo từ đó và CV của bạn.", "Aplyの求人も他サイトの求人も。リンクか本文を貼れば、履歴書まで読んで質問を作ります。", "Lowongan Aply atau situs lain — tempel tautan/teks, pertanyaan dibuat dari situ dan CV-mu.")
    },
    {
      img: "/img_process_2.webp",
      eyebrow: t("실전 모드", "Real mode", "实战模式", "Chế độ thực chiến", "実戦モード", "Mode nyata"),
      title: t("60초 타이머.\n진짜 면접처럼.", "60-second timer.\nLike the real thing.", "60 秒计时，\n就像真正的面试。", "Đồng hồ 60 giây.\nNhư buổi thật.", "60秒タイマー。\n本番のように。", "Timer 60 detik.\nSeperti aslinya."),
      desc: t("면접관처럼 질문을 소리로 읽어 주고, 60초 타이머가 돌아가요. 말로 답하면 받아 적고, 글로 써도 돼요.", "Questions are read aloud and a 60-second timer runs. Speak and it's transcribed — or just type.", "像面试官一样朗读问题，60 秒计时开始。口头回答自动转写，也可打字。", "Câu hỏi được đọc to, đồng hồ 60 giây chạy. Nói sẽ được ghi lại, hoặc gõ.", "面接官のように読み上げ、60秒タイマーが動きます。話せば文字起こし、書いてもOK。", "Pertanyaan dibacakan, timer 60 detik berjalan. Jawab lisan atau ketik."),
      timer: true
    },
    {
      img: "/img_ai_analyze.webp",
      eyebrow: t("즉시 피드백", "Instant feedback", "即时反馈", "Phản hồi tức thì", "即フィードバック", "Masukan instan"),
      title: t("답하자마자,\n바로 피드백.", "Answer.\nFeedback. Instantly.", "一回答，\n立刻反馈。", "Vừa trả lời,\ncó phản hồi ngay.", "答えた瞬間、\nすぐフィードバック。", "Begitu menjawab,\nlangsung masukan."),
      desc: t("잘한 점과 고칠 점, 내 경험으로 고쳐 쓴 답, 면접관이 이어서 물을 질문까지.", "What worked, what to fix, a rewrite from your own experience, and the likely follow-up.", "优点、改进点、基于你经历改写的回答，以及可能的追问。", "Điểm tốt, cần sửa, bản viết lại từ kinh nghiệm của bạn và câu hỏi nối tiếp.", "良い点・直す点・自分の経験で直した回答・追加質問まで。", "Yang bagus, perbaikan, tulisan ulang, dan pertanyaan lanjutan.")
    }
  ];
  const LANGS = ["한국어", "English", "中文", "Tiếng Việt", "日本語", "Bahasa"];

  return (
    <Page>
      {/* ① 히어로 — 흰 바탕, 가운데 정렬, 아주 큰 제목 하나 */}
      <section className="px-5 pb-12 pt-12 text-center md:pt-20">
        <h1 className="whitespace-pre-line text-[36px] font-bold leading-[1.18] tracking-[-0.04em] text-[color:var(--v2-ink)] min-[360px]:text-[40px] md:text-[60px]">
          {t("면접은,\n연습한 만큼.", "Interviews reward\npractice.", "面试，\n练多少得多少。", "Phỏng vấn,\nluyện bao nhiêu\nđược bấy nhiêu.", "面接は、\n練習した分だけ。", "Wawancara,\nsebanding latihan.")}
        </h1>
        <p className="mx-auto mt-4 max-w-[420px] text-[18px] leading-[1.55] text-[color:var(--v2-ink-3)] md:text-[21px]">{t("지원할 공고로 질문을 받고, 답하면 AI 면접관이 바로 피드백해요.", "Get questions for your job. Answer, and an AI interviewer gives feedback right away.", "按你的职位出题，回答后 AI 面试官立即反馈。", "Nhận câu hỏi theo tin, trả lời và AI phản hồi ngay.", "求人に合わせた質問に答えると、AI面接官がすぐフィードバック。", "Dapat pertanyaan sesuai lowongan, AI langsung memberi masukan.")}</p>
        <div className="mt-7 flex flex-col items-center gap-4">
          <PillLink href={SIGNUP}>{t("가입하고 1회 무료로 시작", "Sign up & try 1 free", "注册免费试 1 次", "Đăng ký, thử miễn phí 1 lần", "登録して1回無料で試す", "Daftar & coba 1x gratis")}</PillLink>
          <Link href={LOGIN} className="text-[17px] font-medium text-[color:var(--v2-accent)] hover:underline">
            {t("이미 계정이 있다면 로그인", "Have an account? Log in", "已有账号？登录", "Đã có tài khoản? Đăng nhập", "アカウントがあればログイン", "Sudah punya akun? Masuk")} ›
          </Link>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- 히어로 그림(흰 바탕 → 곱하기 합성) */}
        <img src="/img_fake_interview.webp" alt="" aria-hidden className="mx-auto mt-10 h-[240px] w-full max-w-[380px] object-contain mix-blend-multiply md:h-[340px] md:max-w-[520px]" />
        <p className="mt-6 text-[14px] text-[color:var(--v2-muted)]">🎁 {t("가입하면 모의 면접 1회(질문 5개 피드백)를 드려요", "Sign up and get 1 session (feedback on 5 answers)", "注册赠送 1 次模拟面试（5 个回答反馈）", "Đăng ký tặng 1 lượt (phản hồi 5 câu)", "登録で模擬面接1回（5問フィードバック）", "Daftar dapat 1 sesi (masukan 5 jawaban)")}</p>
      </section>

      {/* ② 기능 타일 — 회색 띠 위 흰 타일, 각자 큰 제목과 큰 그림 */}
      <section className="bg-[#f5f5f7] px-4 py-14 md:mx-5 md:rounded-[36px] md:px-8">
        <Headline eyebrow={t("이렇게 연습해요", "How it works", "这样练习", "Cách luyện", "こう練習します", "Cara berlatih")} title={t("세 단계면 충분해요.", "Three steps. That's it.", "三步就够了。", "Ba bước là đủ.", "3ステップで十分。", "Tiga langkah. Cukup.")} />
        <div className="mt-10 flex flex-col gap-4">
          {tiles.map((tile) => (
            <article key={tile.img} className="overflow-hidden rounded-[28px] bg-white px-6 pb-2 pt-9 text-center">
              <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">{tile.eyebrow}</p>
              <h3 className="mt-2 whitespace-pre-line text-[28px] font-bold leading-[1.22] tracking-[-0.03em] text-[color:var(--v2-ink)] md:text-[36px]">{tile.title}</h3>
              <p className="mx-auto mt-3 max-w-[400px] text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">{tile.desc}</p>
              {"timer" in tile ? (
                // 타이머 모양 — 실전 모드의 60초
                <p className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-[#fdf2f3] px-4 py-2 text-[20px] font-bold tabular-nums text-[color:var(--v2-attention)]">
                  <span aria-hidden>⏱</span> 1:00
                </p>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element -- 타일 그림(흰 바탕 → 곱하기 합성) */}
              <img src={tile.img} alt="" aria-hidden className="mx-auto mt-4 h-[200px] w-full max-w-[300px] object-contain mix-blend-multiply" />
            </article>
          ))}
        </div>
      </section>

      {/* ③ 결과 화면 — 실제 결과 그대로 */}
      <section className="px-5 py-16">
        <Headline eyebrow={t("결과 미리보기", "Result preview", "结果预览", "Xem trước kết quả", "結果プレビュー", "Pratinjau hasil")} title={t("답 하나에,\n이만큼.", "One answer.\nThis much.", "一个回答，\n这么多。", "Một câu trả lời.\nChừng này.", "1つの回答で、\nここまで。", "Satu jawaban.\nSebanyak ini.")} sub={t("실제 결과 화면 그대로예요.", "Exactly what the real result looks like.", "与真实结果页面完全一致。", "Đúng như màn hình kết quả thật.", "実際の結果画面そのままです。", "Persis seperti hasil aslinya.")} />
        <SampleFeedback t={t} />
        <div className="mt-8 flex justify-center">
          <PillLink href={SIGNUP}>{t("내 답으로 받아 보기", "Try with my answer", "用我的回答试试", "Thử với câu của tôi", "自分の回答で試す", "Coba dengan jawabanku")}</PillLink>
        </div>
      </section>

      {/* ④ 6개 언어 — 검정 띠, 언어 이름을 크게 */}
      <section className="bg-black px-5 py-16 text-center text-white md:mx-5 md:rounded-[36px]">
        <p className="text-[15px] font-semibold text-white/60">{t("외국인 유학생도", "For international students too", "留学生也可以", "Cả du học sinh", "留学生も", "Untuk mahasiswa asing juga")}</p>
        <h2 className="mt-2 whitespace-pre-line text-[32px] font-bold leading-[1.2] tracking-[-0.03em] md:text-[48px]">{t("6개 언어로.\n면접은 한국어로.", "6 languages.\nInterview in Korean.", "6 种语言。\n面试用韩语。", "6 ngôn ngữ.\nPhỏng vấn tiếng Hàn.", "6言語で。\n面接は韓国語で。", "6 bahasa.\nWawancara bahasa Korea.")}</h2>
        <p className="mx-auto mt-4 max-w-[400px] text-[16px] leading-[1.6] text-white/70">{t("화면은 편한 언어로 보고, 질문은 실제 한국어 면접 그대로 연습해요.", "Use the app in your language and practice real Korean interview questions.", "界面用你习惯的语言，问题按韩语面试原样练习。", "Xem giao diện bằng ngôn ngữ quen thuộc, luyện câu hỏi tiếng Hàn thật.", "画面は使いやすい言語で、質問は韓国語の面接そのままで練習。", "Gunakan bahasamu, latih pertanyaan wawancara bahasa Korea asli.")}</p>
        <ul className="mx-auto mt-8 flex max-w-[460px] flex-wrap justify-center gap-x-5 gap-y-3">
          {LANGS.map((l) => (
            <li key={l} className="text-[22px] font-semibold tracking-[-0.02em] text-white/90 md:text-[26px]">{l}</li>
          ))}
        </ul>
      </section>

      {/* ⑤ 지금 바로 한 문제 — 로그인 없이(문장 규칙 간단 체크) */}
      <section className="px-5 pt-16">
        <Headline eyebrow={t("지금 바로", "Right now", "现在就", "Ngay bây giờ", "今すぐ", "Sekarang")} title={t("한 문제,\n먼저 답해 보세요.", "Try one question\nfirst.", "先回答\n一道题吧。", "Thử trả lời\nmột câu trước.", "まず1問、\n答えてみて。", "Coba jawab\nsatu soal dulu.")} />
        <div className="mt-8">
          <TryNow t={t} question={daily} />
          {/* 로그인 전엔 국적을 모르니 화면 언어로 — 한국어가 아니면 한국어 면접 표현도 */}
          {locale !== "ko" ? <ExpressionCard t={t} /> : null}
        </div>
      </section>

      {/* ⑥ 그리고 더 — 면접 전날 볼 한 장 · 실력 그래프 (회색 띠 위 흰 타일 — 그림 바탕이 흰색이라) */}
      <section className="mt-16 bg-[#f5f5f7] px-4 py-14 md:mx-5 md:rounded-[36px] md:px-8">
        <Headline eyebrow={t("그리고 더", "And more", "还有更多", "Và hơn nữa", "さらに", "Dan lainnya")} title={t("면접 전날까지\n챙겨 드려요.", "Right up to\nthe night before.", "一直陪你到\n面试前一天。", "Đồng hành đến\nđêm trước buổi PV.", "面接の前日まで\nサポート。", "Sampai malam\nsebelum wawancara.")} />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {WHAT_YOU_GET.slice(3).map((w) => (
            <div key={w.img} className="rounded-[28px] bg-white px-6 pb-4 pt-7 text-center">
              <p className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{w.title(t)}</p>
              <p className="mx-auto mt-2 max-w-[340px] text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{w.desc(t)}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- 장식 그림(흰 바탕 → 곱하기 합성) */}
              <img src={w.img} alt="" aria-hidden className="mx-auto mt-3 h-[140px] w-full max-w-[220px] object-contain mix-blend-multiply" />
            </div>
          ))}
        </div>
      </section>

      {/* ⑦ 실제 면접에서 나온 질문 — 다른 사람들이 남긴 질문(공개) */}
      <div className="pt-8">
        <ReportedQuestions t={t} onPick={toSignup} />
      </div>

      {/* ⑧ 자주 묻는 질문 */}
      <Faq t={t} />

      {/* ⑨ 마지막 — 흰 바탕 가운데, 큰 제목과 버튼 하나 */}
      <section className="px-5 pb-8 pt-16 text-center">
        <h2 className="whitespace-pre-line text-[34px] font-bold leading-[1.2] tracking-[-0.04em] text-[color:var(--v2-ink)] md:text-[48px]">{t("다음 면접은,\n연습하고 가요.", "Next interview?\nPractice first.", "下次面试，\n先练习再去。", "Buổi PV tới,\nluyện trước đã.", "次の面接は、\n練習してから。", "Wawancara berikutnya,\nlatihan dulu.")}</h2>
        <p className="mt-3 text-[17px] text-[color:var(--v2-ink-3)]">🎁 {t("가입하면 1회 무료", "1 free session on sign-up", "注册赠送 1 次", "Tặng 1 lượt khi đăng ký", "登録で1回無料", "1 sesi gratis")}</p>
        <div className="mt-7 flex justify-center">
          <PillLink href={SIGNUP}>{t("가입하고 시작하기", "Sign up & start", "注册并开始", "Đăng ký & bắt đầu", "登録して始める", "Daftar & mulai")}</PillLink>
        </div>
        <p className="mt-4 text-[14px] text-[color:var(--v2-muted)]">{t("이메일이나 구글·카카오 계정으로 1분이면 가입해요.", "Sign up in a minute with email or Google/Kakao.", "用邮箱或 Google/Kakao 账号 1 分钟注册。", "Đăng ký trong 1 phút bằng email hoặc Google/Kakao.", "メールかGoogle・Kakaoで1分で登録。", "Daftar 1 menit dengan email atau Google/Kakao.")}</p>
      </section>

      {/* 고정 버튼에 마지막 내용이 가리지 않게 */}
      <div aria-hidden className="h-20 md:hidden" />

      {/* 휴대폰 아래 고정 가입 버튼 — 어디까지 내려도 바로 가입 */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white/90 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <Link href={SIGNUP} className="flex h-12 items-center justify-center rounded-full bg-[color:var(--v2-accent)] text-[16px] font-semibold text-white">
          🎁 {t("가입하고 1회 무료로 시작", "Sign up & try 1 free", "注册免费试 1 次", "Đăng ký, thử miễn phí 1 lần", "登録して1回無料で試す", "Daftar & coba 1x gratis")}
        </Link>
      </div>
    </Page>
  );
}

/** 애플식 섹션 머리 — 작은 눈썹 · 아주 큰 제목(줄바꿈 \n) · 한 줄 설명, 가운데 정렬. */
function Headline({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">{eyebrow}</p>
      <h2 className="mt-2 whitespace-pre-line text-[32px] font-bold leading-[1.2] tracking-[-0.035em] text-[color:var(--v2-ink)] md:text-[48px]">{title}</h2>
      {sub ? <p className="mt-3 text-[17px] text-[color:var(--v2-ink-3)]">{sub}</p> : null}
    </div>
  );
}

/** 둥근 알약 버튼 — 광고 페이지의 주 행동. */
function PillLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[color:var(--v2-accent)] px-7 text-[17px] font-semibold text-white transition hover:opacity-90">
      {children}
    </Link>
  );
}

/** 예시 피드백 — 실제 결과 화면과 같은 부품(ResultSummary·Highlighted·PointCard)에 예시 답만 넣어 그대로 보여 준다. */
function SampleFeedback({ t }: { t: PlatformT }) {
  const question = t("본인의 가장 큰 강점은 무엇인가요?", "What is your greatest strength?", "你最大的优点是什么？", "Điểm mạnh lớn nhất của bạn là gì?", "あなたの一番の強みは何ですか？", "Apa kekuatan terbesarmu?");
  const answer = t(
    "제 강점은 끈기입니다. 대학교 때 카페 아르바이트를 하면서 열심히 일했고, 손님들에게 친절하게 응대하려고 노력했습니다. 그래서 점장님께 칭찬을 많이 받았습니다.",
    "My strength is persistence. I worked hard at a café part-time job in college and tried to be kind to customers, so my manager praised me a lot.",
    "我的优点是坚持。大学时在咖啡店打工很努力，也尽力亲切地接待客人，所以经常受到店长表扬。",
    "Điểm mạnh của tôi là sự kiên trì. Hồi đại học tôi làm thêm ở quán cà phê rất chăm chỉ, cố gắng phục vụ khách thân thiện nên được quản lý khen nhiều.",
    "私の強みは粘り強さです。大学時代にカフェのアルバイトで一生懸命働き、お客様に親切に対応するよう努力しました。そのため店長によく褒められました。",
    "Kekuatanku adalah kegigihan. Saat kuliah aku bekerja keras paruh waktu di kafe dan berusaha ramah pada pelanggan, jadi sering dipuji manajer."
  );
  const feedback: InterviewFeedback = {
    score: 62,
    strengths: [
      t("첫 문장에서 강점을 바로 말했어요.", "You stated your strength in the first sentence.", "第一句就说出了优点。", "Nêu điểm mạnh ngay câu đầu.", "最初の一文で強みを伝えました。", "Kekuatan disebut di kalimat pertama."),
      t("실제 경험(카페 아르바이트)을 예로 들었어요.", "You used a real experience (café job).", "举了真实经历（咖啡店打工）。", "Có ví dụ thật (làm thêm ở quán cà phê).", "実際の経験（カフェのバイト）を例にしました。", "Memakai pengalaman nyata (kerja di kafe).")
    ],
    improvements: [
      t("'열심히·노력했다' 대신 실제로 한 행동을 말해 보세요.", "Replace 'worked hard / tried' with what you actually did.", "把“努力”换成你具体做了什么。", "Thay “chăm chỉ / cố gắng” bằng việc cụ thể đã làm.", "「一生懸命・努力」ではなく、実際にした行動を。", "Ganti “bekerja keras” dengan tindakan nyata."),
      t("결과를 숫자로 보여 주세요. (예: 주문 실수 20건 → 5건)", "Show the result with a number (e.g. order errors 20 → 5).", "用数字展示结果（如：点单错误 20 → 5 件）。", "Nêu kết quả bằng số (vd: lỗi gọi món 20 → 5).", "成果を数字で（例：注文ミス20件→5件）。", "Tunjukkan hasil dengan angka (mis. salah pesanan 20 → 5).")
    ],
    sampleAnswer: t(
      "제 강점은 끝까지 해내는 끈기입니다. 카페에서 1년 동안 일하며 주문 실수가 잦은 시간대를 기록해 메뉴판 순서를 바꾸자고 제안했고, 그 뒤 주문 실수가 한 달 20건에서 5건으로 줄었습니다. 입사 후에도 문제를 끝까지 파고들어 결과로 보여 드리겠습니다.",
      "My strength is seeing things through. Working at a café for a year, I logged when order mistakes peaked and proposed reordering the menu board — mistakes fell from 20 to 5 a month. I'll dig into problems the same way and show results.",
      "我的优点是坚持到底。在咖啡店工作一年间，我记录了点单错误多发的时段并提议调整菜单顺序，之后每月错误从 20 件降到 5 件。入职后我也会深挖问题，用结果说话。",
      "Điểm mạnh của tôi là theo đến cùng. Làm ở quán cà phê 1 năm, tôi ghi lại khung giờ hay sai món và đề xuất đổi thứ tự menu, lỗi giảm từ 20 xuống 5 mỗi tháng. Vào công ty tôi cũng sẽ đào sâu vấn đề và chứng minh bằng kết quả.",
      "私の強みは最後までやり抜く粘り強さです。カフェで1年働く中で注文ミスが多い時間帯を記録し、メニュー表の順番を変えるよう提案した結果、ミスは月20件から5件に減りました。入社後も問題を掘り下げ、結果で示します。",
      "Kekuatanku adalah menuntaskan sesuatu. Selama 1 tahun di kafe, aku mencatat jam rawan salah pesanan dan mengusulkan urutan menu baru — kesalahan turun dari 20 ke 5 per bulan. Aku akan menggali masalah dengan cara yang sama."
    ),
    followUp: t("메뉴판을 바꾸자고 했을 때 반대는 없었나요? 어떻게 설득했나요?", "Was there pushback on changing the menu? How did you persuade them?", "提议改菜单时有人反对吗？你是怎么说服的？", "Có ai phản đối việc đổi menu không? Bạn thuyết phục thế nào?", "メニュー変更に反対はありませんでしたか？どう説得しましたか？", "Ada yang menolak perubahan menu? Bagaimana kamu meyakinkan mereka?")
  };
  return (
    // 실제 결과 화면을 한 장 띄워 둔 것처럼 — 회색 바탕 위 흰 화면
    <div className="mt-5 rounded-[28px] bg-[color:var(--v2-band)] p-3 min-[360px]:p-4">
      <div className="rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(0,0,0,0.06)] min-[360px]:p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold text-[color:var(--v2-muted)]">{t("예시 결과", "Sample result", "示例结果", "Kết quả mẫu", "結果の例", "Contoh hasil")}</span>
          <span className="rounded-full bg-[color:var(--v2-band)] px-2.5 py-1 text-[12px] font-semibold text-[color:var(--v2-ink-3)]">{t("인성·강점", "Personality", "性格·优点", "Tính cách", "人柄・強み", "Kepribadian")}</span>
        </div>
        <p className="mt-2 text-[19px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{question}</p>
        <div className="mt-4 flex flex-col gap-3">
          <ResultSummary t={t} answer={answer} feedback={feedback} />
          <div className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
            <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("내 답", "Your answer", "我的回答", "Câu trả lời", "あなたの回答", "Jawabanmu")}</p>
            <p className="mt-2 text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">
              <Highlighted text={answer} />
            </p>
          </div>
          <PointCard tone="good" title={t("잘한 점", "What worked", "优点", "Điểm tốt", "良い点", "Yang bagus")} items={feedback.strengths} />
          <PointCard tone="bad" title={t("고칠 점", "To improve", "改进点", "Cần sửa", "直す点", "Perbaiki")} items={feedback.improvements} />
          <div className="rounded-2xl bg-[color:var(--v2-band)] p-4">
            <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("이렇게 바꿔 보면 어때요?", "Try it like this", "试试这样改", "Thử viết thế này", "こう直してみては？", "Coba seperti ini")}</p>
            <p className="mt-2 text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">
              <Highlighted text={feedback.sampleAnswer} />
            </p>
          </div>
          <div className="rounded-2xl bg-[color:var(--v2-accent-weak)] p-4">
            <p className="text-[13px] font-bold text-[color:var(--v2-accent)]">{t("면접관이 이어서 물을 질문", "Likely follow-up", "面试官可能追问", "Câu hỏi nối tiếp", "想定される追加質問", "Pertanyaan lanjutan")}</p>
            <p className="mt-1 text-[16px] font-semibold leading-[1.55] text-[color:var(--v2-ink)]">{feedback.followUp}</p>
          </div>
        </div>
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
  // 실전 모드 60초 — 실제 연습 화면과 같게, 쓰기·말하기를 시작하면 잰다.
  const [timed, setTimed] = useState(false);
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const timeUp = timed && running && left <= 0;
  const begin = () => {
    if (timed && !running) setRunning(true);
  };
  useEffect(() => {
    if (!timed || !running || left <= 0) return;
    const id = window.setTimeout(() => setLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timed, running, left]);
  const tts = useSpeak();
  const dict = useDictation({ onStart: begin, onFinal: (add) => setAnswer((a) => (a.trim() ? `${a.trim()} ${add}` : add)) });
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
  const check = () => {
    dict.stop();
    setChecked(text);
  };
  return (
    // 실제 '한 문항 연습' 화면을 그대로 한 장 — 회색 바탕 위 흰 화면(머리 · 질문 · 실전 모드 · 답 · 말로 답하기 · 아래 버튼)
    <div className="rounded-[28px] bg-[color:var(--v2-band)] p-3 min-[360px]:p-4">
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)]">
        <div className="px-5 pb-3 pt-5">
          <p className="text-[19px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("한 문항 연습", "Practice one question", "单题练习", "Luyện một câu", "1問練習", "Latihan satu soal")}</p>
          <p className="mt-0.5 truncate text-[14px] text-[color:var(--v2-faint)]">
            {t("오늘의 질문", "Today's question", "今日问题", "Câu hỏi hôm nay", "今日の質問", "Pertanyaan hari ini")} · {mockCategoryLabelOf(t, question.category)}
          </p>
        </div>
        <div className="px-5 pb-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[19px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">{questionText(t, question)}</p>
            <SpeakButton t={t} onSpeak={() => tts.speak(question.ko)} />
          </div>
          {locale !== "ko" ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">🇰🇷 {question.ko}</p> : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <Switch on={timed} onChange={(v) => { setTimed(v); setRunning(false); setLeft(60); }} label={t("실전 모드 · 60초", "Real mode · 60s", "实战模式 · 60秒", "Thực chiến · 60s", "本番モード・60秒", "Mode nyata · 60 dtk")} />
            {timed && !running ? <span className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{t("쓰기 시작하면 재요", "Starts when you begin", "开始作答即计时", "Bắt đầu khi bạn viết", "書き始めると計測", "Mulai saat menulis")}</span> : null}
          </div>
          {timed && running ? <TimerBar t={t} left={left} total={60} /> : null}
          <textarea
            value={answer}
            onChange={(e) => {
              begin();
              setAnswer(e.target.value);
            }}
            readOnly={timeUp}
            rows={6}
            placeholder={t("면접관에게 말하듯 편하게 써 보세요.", "Write as if you're talking to the interviewer.", "像对面试官说话一样写。", "Viết như đang nói với người phỏng vấn.", "面接官に話すように書いてみましょう。", "Tulis seperti berbicara ke pewawancara.")}
            className="mt-3 w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[16px] leading-[1.65] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2 read-only:opacity-70"
          />
          {timeUp ? <p className="mt-2 text-[14px] font-semibold text-[color:var(--v2-attention)]">{t("시간이 끝났어요. 지금까지 쓴 답으로 체크해 보세요.", "Time's up — check what you have.", "时间到了，用已写的回答检查吧。", "Hết giờ — kiểm tra câu trả lời hiện có.", "時間切れです。ここまでの回答でチェックを。", "Waktu habis — cek jawabanmu.")}</p> : null}
          <DictationControls t={t} dict={dict} disabled={timeUp} right={<span className="text-[13px] tabular-nums text-[color:var(--v2-faint)]">{text.length}{t("자", " chars", "字", " ký tự", "字", " karakter")}</span>} />

          {result ? (
            // 결과 — 실제 결과 화면의 'AI 평가' 카드와 같은 결(로그인 전이라 문장 규칙으로 본 간단 체크)
            <div className="mt-4 rounded-2xl bg-[color:var(--v2-band)] p-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-[13px] font-bold text-[color:var(--v2-ink-2)]">{good} / {checks.length}</span>
                <span className="text-[13px] font-semibold text-[color:var(--v2-muted)]">{t("간단 체크", "Quick check", "快速检查", "Kiểm tra nhanh", "簡単チェック", "Cek cepat")}</span>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {checks.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] leading-[1.5]">
                    <span className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${c.ok ? "bg-[color:var(--v2-good)] text-white" : "bg-white text-[color:var(--v2-attention)]"}`} aria-hidden>
                      {c.ok ? "✓" : "!"}
                    </span>
                    <span className={c.ok ? "text-[color:var(--v2-ink-3)]" : "font-semibold text-[color:var(--v2-ink-2)]"}>{c.ok ? c.good : c.bad}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] leading-[1.5] text-[color:var(--v2-faint)]">{t("문장 규칙으로 본 간단 체크예요. 가입하면 AI가 내용까지 읽고 잘한 점·고칠 점·고친 답·꼬리 질문을 알려 줘요.", "A rule-based quick check. Sign up and AI reads the content for strengths, fixes, a rewrite and a follow-up.", "这是基于规则的快速检查。注册后 AI 会阅读内容，给出优点、改进点、改写和追问。", "Kiểm tra theo quy tắc. Đăng ký để AI đọc nội dung và đưa nhận xét, bản sửa, câu hỏi nối tiếp.", "文の規則による簡単チェックです。登録するとAIが内容まで読みます。", "Cek berbasis aturan. Daftar agar AI membaca isi jawaban.")}</p>
            </div>
          ) : null}
        </div>
        {/* 아래 버튼 — 실제 화면의 [AI 피드백 받기] 자리 */}
        <div className="px-4 pb-4">
          {result ? (
            <Button full href={SIGNUP}>
              {t("가입하고 AI 피드백 받기", "Sign up for AI feedback", "注册获取 AI 反馈", "Đăng ký nhận phản hồi AI", "登録してAIフィードバック", "Daftar untuk masukan AI")}
            </Button>
          ) : (
            <Button full onClick={check} disabled={text.length < 10}>
              {t("바로 체크해 보기", "Quick check", "快速检查", "Kiểm tra nhanh", "すぐにチェック", "Cek cepat")}
            </Button>
          )}
        </div>
      </div>
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

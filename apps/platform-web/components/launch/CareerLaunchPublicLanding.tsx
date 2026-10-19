"use client";

// Career Launch 공개 소개 — 로그인 없이 "무엇을 4주 동안 하는지" 전부 읽을 수 있다.
// 애플 제품 페이지 같은 한 편의 광고: 가운데 정렬 · 아주 큰 제목 · 흰/회색/검정 띠가 번갈아(모의 면접 소개와 같은 결).
// 히어로 → 이런 고민 → 4주 여정 → 4주 뒤에 남는 것(검정 띠) → AI 코치 → 자주 묻는 질문 → 마지막 권유, 휴대폰은 아래 고정 시작 버튼.
// 클라이언트 컴포넌트지만 Next 가 첫 HTML 을 서버에서 렌더하므로 본문이 소스에 들어간다(검색 노출).
// 화면 문구에 '무료'는 쓰지 않는다(AI 유료화 예정 — 프로그램 안 AI 는 '포인트 차감 없이'로 안내).
import { useEffect, useRef } from "react";
import Link from "next/link";
import { CaretDown, Check } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { useLaunchT } from "../../lib/launch/i18n";
import { setFabInset, clearFabInset } from "../../lib/talent/fab-inset";
import { trackCareerLaunchLandingView, trackCareerLaunchStartClick } from "../../lib/analytics";

const START = "/career-launch/start";
type T = ReturnType<typeof useLaunchT>;

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

  // 휴대폰 아래 고정 시작 버튼 — 전역 피드백 버튼이 덮이지 않게 그만큼 비켜 준다.
  useEffect(() => {
    const apply = () => (window.innerWidth <= 767 ? setFabInset("cl-landing", 76) : clearFabInset("cl-landing"));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      clearFabInset("cl-landing");
    };
  }, []);

  const worries = [
    { icon: "🤯", text: t("뭐부터 해야 할지\n모르겠어요", "I don't know\nwhere to start", "不知道\n从哪里开始", "Không biết\nbắt đầu từ đâu", "何から始めればいいか\nわからない", "Tidak tahu\nmulai dari mana") },
    { icon: "📝", text: t("한국식 이력서·자소서가\n너무 어려워요", "Korean resumes and\ncover letters are hard", "韩式简历和自我介绍\n太难了", "CV và thư kiểu Hàn\nquá khó", "韓国式の履歴書・自己紹介書が\n難しい", "CV dan surat gaya Korea\nsulit sekali") },
    { icon: "😶", text: t("면접에서\n말이 안 나와요", "I freeze up\nin interviews", "面试时\n说不出话", "Bị cứng họng\nkhi phỏng vấn", "面接で\n言葉が出ない", "Gugup saat\nwawancara") }
  ];

  const weeks = [
    {
      n: 1,
      img: "/img_my_career_0.webp",
      title: t("나를 알고,\n직무를 고르고.", "Know yourself.\nPick a role.", "了解自己，\n选定岗位。", "Hiểu mình.\nChọn vị trí.", "自分を知り、\n職種を選ぶ。", "Kenali diri.\nPilih peran."),
      body: t("알바·동아리·유학 경험을 꺼내 강점을 찾고, 직접 체험해 보며 지원할 직무를 좁혀요.", "Pull strengths from part-time jobs, clubs and study abroad, then try roles hands-on to narrow your target.", "从打工、社团、留学经历中找出优势，亲身体验后缩小目标岗位。", "Tìm điểm mạnh từ việc làm thêm, CLB, du học rồi thử từng vị trí để chọn mục tiêu.", "バイト・サークル・留学の経験から強みを見つけ、体験しながら職種を絞ります。", "Gali kekuatan dari kerja paruh waktu, klub, studi, lalu coba peran untuk menentukan target.")
    },
    {
      n: 2,
      img: "/img_resume.webp",
      title: t("서류는,\n끝까지 완성.", "Documents.\nFully finished.", "材料，\n彻底完成。", "Hồ sơ,\nhoàn thiện hết.", "書類は、\n最後まで完成。", "Dokumen,\ntuntas selesai."),
      body: t("한국식 이력서와 문항별 자기소개서를 공고에 맞춰 완성해요. 문장마다 내 경험이 근거로 붙어요.", "Finish a Korean-style resume and question-by-question cover letter, tailored to a real job. Every sentence is backed by your experience.", "按职位完成韩式简历和逐题自我介绍，每句话都有你的经历作依据。", "Hoàn thành CV kiểu Hàn và thư theo từng câu hỏi, khớp tin tuyển. Mỗi câu đều dựa trên kinh nghiệm của bạn.", "求人に合わせて韓国式履歴書と設問別の自己紹介書を完成。一文ごとに自分の経験が根拠に。", "Selesaikan CV gaya Korea dan surat per pertanyaan sesuai lowongan. Setiap kalimat berdasar pengalamanmu.")
    },
    {
      n: 3,
      img: "/img_fake_interview.webp",
      title: t("면접은,\n실전처럼.", "Interviews.\nLike the real thing.", "面试，\n像实战一样。", "Phỏng vấn,\nnhư thật.", "面接は、\n本番のように。", "Wawancara,\nseperti aslinya."),
      body: t("자기소개·직무·인성·압박 면접까지. 답할 때마다 AI 면접관이 바로 피드백하고, 내 약점을 찾아내요.", "Self-intro, role, culture-fit and pressure questions. The AI interviewer gives feedback on every answer and finds your weak spots.", "自我介绍、岗位、人性、压力面试。每次回答 AI 面试官都会立即反馈，并找出弱点。", "Giới thiệu, chuyên môn, tính cách, áp lực. AI phản hồi từng câu và tìm ra điểm yếu.", "自己紹介・職務・人柄・圧迫面接まで。答えるたびにAI面接官がフィードバックし、弱点を見つけます。", "Perkenalan, peran, kepribadian, tekanan. AI memberi masukan tiap jawaban dan menemukan kelemahanmu.")
    },
    {
      n: 4,
      img: "/img_process_3.webp",
      title: t("약점은 고치고,\n최종 점검.", "Fix the gaps.\nFinal check.", "改正弱点，\n最终检查。", "Sửa điểm yếu.\nKiểm tra cuối.", "弱点を直し、\n最終チェック。", "Perbaiki celah.\nCek akhir."),
      body: t("틀린 답은 오답노트로 다시 연습해 통과할 때까지. 마지막 모의 면접으로 처음과 비교해 성장을 확인해요.", "Re-practice missed answers from your review notes until they pass. A final mock interview shows how far you've come.", "答错的题记入错题本反复练习直到通过，最后一次模拟面试与最初对比，确认成长。", "Luyện lại câu sai trong sổ ôn đến khi đạt. Buổi phỏng vấn cuối so với lúc đầu để thấy tiến bộ.", "間違えた回答は復習ノートで合格するまで練習。最後の模擬面接で最初と比べて成長を確認。", "Latih ulang jawaban yang salah hingga lulus. Wawancara akhir menunjukkan kemajuanmu.")
    }
  ];

  const outputs = [
    t("기업에 낼 수 있는 이력서", "A resume ready to submit", "可直接投递的简历", "CV sẵn sàng nộp", "企業に出せる履歴書", "CV siap kirim"),
    t("공고에 맞춘 문항별 자기소개서", "A cover letter for each question, tailored to the job", "按职位逐题完成的自我介绍", "Thư theo từng câu hỏi, khớp tin tuyển", "求人に合わせた設問別の自己紹介書", "Surat per pertanyaan sesuai lowongan"),
    t("모의 면접 기록과 약점 리포트", "Mock interview records and a weakness report", "模拟面试记录与弱点报告", "Hồ sơ phỏng vấn thử và báo cáo điểm yếu", "模擬面接の記録と弱点レポート", "Catatan wawancara dan laporan kelemahan"),
    t("면접 오답노트", "Interview review notes", "面试错题本", "Sổ ôn phỏng vấn", "面接の復習ノート", "Catatan evaluasi wawancara")
  ];

  const faqs = [
    {
      q: t("비용이 드나요?", "Does it cost anything?", "需要费用吗？", "Có tốn phí không?", "費用はかかりますか？", "Apakah berbayar?"),
      a: t("초대받은 기수 참여자는 프로그램 안의 AI 코치·면접 기능을 포인트 차감 없이 써요. 참여 방법은 시작하기에서 안내해요.", "Invited cohort members use the AI coach and interview features inside the program without spending points. See Get started for how to join.", "受邀学员在项目内使用 AI 教练和面试功能不扣积分。参与方式请点「开始」查看。", "Thành viên được mời dùng AI coach và phỏng vấn trong chương trình không bị trừ điểm. Xem cách tham gia ở Bắt đầu.", "招待された期の参加者は、プログラム内のAIコーチ・面接機能をポイントなしで使えます。参加方法は「はじめる」で案内します。", "Peserta undangan memakai AI coach dan wawancara di program tanpa memotong poin. Cara ikut ada di Mulai.")
    },
    {
      q: t("매일 해야 하나요?", "Do I have to do it every day?", "需要每天做吗？", "Có phải làm mỗi ngày không?", "毎日やる必要がありますか？", "Harus setiap hari?"),
      a: t("아니요. 주차별 과제를 그 주 안에 마치면 돼요. 한 주차는 보통 2~3시간이면 끝나요.", "No. Finish each week's missions within that week. One week usually takes 2–3 hours.", "不用。在当周完成当周任务即可，一周通常 2~3 小时。", "Không. Hoàn thành nhiệm vụ trong tuần đó là được, thường 2–3 giờ/tuần.", "いいえ。その週の課題を週内に終えればOK。1週は2〜3時間ほどです。", "Tidak. Selesaikan misi tiap minggu dalam minggu itu, biasanya 2–3 jam.")
    },
    {
      q: t("한국어를 잘 못해도 되나요?", "What if my Korean isn't good?", "韩语不好也可以吗？", "Tiếng Hàn chưa giỏi có được không?", "韓国語が苦手でも大丈夫？", "Bagaimana jika bahasa Korea saya kurang?"),
      a: t("화면은 여러 언어로 볼 수 있어요. 다만 공고와 면접은 한국어가 필요한 경우가 많아, 수준에 맞는 준비를 함께 안내해요.", "The interface supports several languages. Many jobs and interviews still require Korean, so we guide preparation at your level.", "界面支持多种语言。但很多职位和面试需要韩语，会按你的水平指导准备。", "Giao diện có nhiều ngôn ngữ. Nhiều tin và phỏng vấn cần tiếng Hàn nên sẽ hướng dẫn theo trình độ.", "画面は複数言語に対応。ただ求人や面接は韓国語が必要なことが多く、レベルに合わせて案内します。", "Tampilan tersedia beberapa bahasa. Banyak lowongan butuh bahasa Korea, jadi persiapan disesuaikan levelmu.")
    },
    {
      q: t("누가 답을 주나요?", "Who answers my questions?", "谁来回答我的问题？", "Ai trả lời câu hỏi của tôi?", "誰が答えてくれますか？", "Siapa yang menjawab pertanyaan saya?"),
      a: t("AI 코치가 과제를 함께 하고, 일정·제출처럼 AI 가 답할 수 없는 건 운영진이 직접 답해요.", "An AI coach works through the missions with you; for things it can't answer — schedules, submissions — our team replies in person.", "AI 教练陪你完成任务；日程、提交等 AI 无法回答的问题由运营团队直接回复。", "AI coach đồng hành nhiệm vụ; lịch trình, nộp hồ sơ thì đội ngũ trả lời trực tiếp.", "AIコーチが課題を一緒に進め、日程・提出などAIが答えられないことは運営チームが直接答えます。", "AI coach menemani misi; jadwal dan pengiriman dijawab langsung oleh tim.")
    }
  ];

  return (
    <main className="pb-24 md:pb-10">
      {/* 상단 바 — 로고(홈) · 시작하기 */}
      <header className="mx-auto flex h-14 w-full max-w-[1080px] items-center justify-between px-5">
        <Link href="/" aria-label="Aply" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- 작은 로고 */}
          <img src="/aply_logo.webp" alt="Aply" className="h-6 w-auto" />
          <span className="text-[15px] font-bold text-[color:var(--v2-ink-3)]">Career Launch</span>
        </Link>
        <Link href={START} onClick={() => trackCareerLaunchStartClick("landing_header")} className="text-[15px] font-semibold text-[color:var(--v2-accent)] hover:underline">
          {t("시작하기", "Get started", "开始", "Bắt đầu", "はじめる", "Mulai")}
        </Link>
      </header>

      {/* ① 히어로 — 가운데 정렬, 아주 큰 제목 하나 */}
      <section className="px-5 pb-14 pt-10 text-center md:pt-16">
        <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">{t("Career Launch · 4주 취업 준비 프로그램", "Career Launch · 4-week job prep program", "Career Launch · 4 周求职准备项目", "Career Launch · Chương trình 4 tuần", "Career Launch · 4週間の就活プログラム", "Career Launch · Program persiapan 4 minggu")}</p>
        <h1 className="mt-3 whitespace-pre-line break-keep text-[36px] font-bold leading-[1.18] tracking-[-0.04em] text-[color:var(--v2-ink)] min-[360px]:text-[40px] md:text-[64px]">
          {t("4주 뒤,\n지원할 준비 끝.", "Four weeks.\nReady to apply.", "4 周后，\n求职准备就绪。", "4 tuần sau,\nsẵn sàng ứng tuyển.", "4週間後、\n応募の準備完了。", "4 minggu lagi,\nsiap melamar.")}
        </h1>
        <p className="mx-auto mt-4 max-w-[460px] break-keep text-[18px] leading-[1.55] text-[color:var(--v2-ink-3)] md:text-[21px]">
          {t("나를 기억하는 AI 코치와 함께 강점 찾기부터 이력서·자기소개서, 실전 면접까지 순서대로.", "With an AI coach that remembers you — from finding strengths to resume, cover letter and real interviews, step by step.", "与记住你的 AI 教练一起，从发现优势到简历、自我介绍和实战面试，按顺序完成。", "Cùng AI coach nhớ bạn — từ tìm điểm mạnh đến CV, thư và phỏng vấn thật, theo từng bước.", "あなたを覚えているAIコーチと、強み探しから履歴書・自己紹介書、本番面接まで順番に。", "Bersama AI coach yang mengingatmu — dari menemukan kekuatan hingga CV, surat, dan wawancara.")}
        </p>
        <div className="mt-7 flex flex-col items-center gap-4">
          <PillLink href={START} onClick={() => trackCareerLaunchStartClick("landing_hero")}>
            {t("지금 시작하기", "Start now", "立即开始", "Bắt đầu ngay", "今すぐはじめる", "Mulai sekarang")}
          </PillLink>
          <Link href={START} onClick={() => trackCareerLaunchStartClick("landing_invite")} className="text-[17px] font-medium text-[color:var(--v2-accent)] hover:underline">
            {t("초대 코드가 있어요", "I have an invite code", "我有邀请码", "Tôi có mã mời", "招待コードがあります", "Saya punya kode undangan")} ›
          </Link>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- 히어로 그림(흰 바탕 → 곱하기 합성) */}
        <img src="/img_global_career_launch.webp" alt="" aria-hidden className="mx-auto mt-10 w-full max-w-[560px] object-contain mix-blend-multiply md:max-w-[760px]" />
        <ul className="mx-auto mt-6 flex max-w-[520px] flex-wrap justify-center gap-2">
          {[
            t("⏱ 주당 2~3시간", "⏱ 2–3 hours a week", "⏱ 每周 2~3 小时", "⏱ 2–3 giờ/tuần", "⏱ 週2〜3時間", "⏱ 2–3 jam/minggu"),
            t("🤖 AI 코치가 함께", "🤖 With an AI coach", "🤖 AI 教练陪伴", "🤖 Có AI coach", "🤖 AIコーチと一緒", "🤖 Bersama AI coach"),
            t("🙋 운영진이 직접 답변", "🙋 Real people answer", "🙋 运营团队直接回复", "🙋 Đội ngũ trả lời", "🙋 運営が直接回答", "🙋 Tim menjawab langsung")
          ].map((c) => (
            <li key={c} className="rounded-full bg-[color:var(--v2-band)] px-3.5 py-2 text-[14px] font-semibold text-[color:var(--v2-ink-3)]">
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* ② 이런 고민 — 회색 띠 위 말풍선 셋 */}
      <section className="bg-[#f5f5f7] px-5 py-16 md:mx-5 md:rounded-[36px]">
        <Headline eyebrow={t("혹시 이런 고민?", "Sound familiar?", "你也有这样的烦恼吗？", "Bạn cũng vậy?", "こんな悩み、ありませんか？", "Pernah merasa begini?")} title={t("다들 여기서\n멈춰요.", "This is where\nmost people stop.", "大家都在这里\n卡住。", "Ai cũng\ndừng ở đây.", "みんな、\nここで止まる。", "Di sinilah\nbanyak yang berhenti.")} />
        <ul className="mx-auto mt-10 grid max-w-[880px] gap-3 md:grid-cols-3">
          {worries.map((w) => (
            <li key={w.icon} className="rounded-[24px] bg-white px-6 py-7 text-center">
              <span aria-hidden className="text-[40px]">
                {w.icon}
              </span>
              <p className="mt-3 whitespace-pre-line break-keep text-[19px] font-bold leading-[1.4] tracking-[-0.02em] text-[color:var(--v2-ink)]">“{w.text}”</p>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-[420px] break-keep text-center text-[18px] font-semibold leading-[1.55] text-[color:var(--v2-ink-2)]">
          {t("그래서 순서를 만들었어요. 따라오기만 하면 돼요.", "So we built the path. Just follow along.", "所以我们设计了顺序，跟着走就好。", "Nên chúng tôi làm sẵn lộ trình. Chỉ cần theo.", "だから順番を作りました。ついてくるだけでOK。", "Jadi kami buat jalurnya. Tinggal ikuti.")}
        </p>
      </section>

      {/* ③ 4주 여정 — 주차마다 큰 제목과 큰 그림 */}
      <section className="px-4 py-16 md:px-8">
        <Headline eyebrow={t("4주 여정", "The four weeks", "4 周旅程", "Hành trình 4 tuần", "4週間の流れ", "Perjalanan 4 minggu")} title={t("한 주에 하나씩.", "One step a week.", "每周一步。", "Mỗi tuần một bước.", "1週にひとつずつ。", "Satu langkah tiap minggu.")} />
        <div className="mx-auto mt-10 grid max-w-[1000px] gap-4 md:grid-cols-2">
          {weeks.map((w) => (
            <article key={w.n} className="overflow-hidden rounded-[28px] bg-[#f5f5f7] px-6 pb-2 pt-9 text-center">
              <p className="text-[15px] font-bold text-[color:var(--v2-accent)]">{t(`${w.n}주차`, `Week ${w.n}`, `第 ${w.n} 周`, `Tuần ${w.n}`, `${w.n}週目`, `Minggu ${w.n}`)}</p>
              <h3 className="mt-2 whitespace-pre-line break-keep text-[28px] font-bold leading-[1.22] tracking-[-0.03em] text-[color:var(--v2-ink)] md:text-[34px]">{w.title}</h3>
              <p className="mx-auto mt-3 max-w-[400px] break-keep text-[16px] leading-[1.6] text-[color:var(--v2-ink-3)]">{w.body}</p>
              {/* eslint-disable-next-line @next/next/no-img-element -- 주차 그림(밝은 바탕 → 곱하기 합성) */}
              <img
                src={w.img}
                alt=""
                aria-hidden
                className="mx-auto mt-4 h-[200px] w-full max-w-[300px] object-contain mix-blend-multiply"
                // 그림 바탕이 회색 띠보다 살짝 밝아 네모가 비친다 — 가장자리를 흐려 지운다
                style={{ maskImage: "radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)", WebkitMaskImage: "radial-gradient(ellipse 72% 72% at 50% 50%, #000 62%, transparent 100%)" }}
              />
            </article>
          ))}
        </div>
      </section>

      {/* ④ 4주 뒤에 남는 것 — 검정 띠 */}
      <section className="bg-black px-5 py-16 text-center text-white md:mx-5 md:rounded-[36px] md:py-20">
        <p className="text-[15px] font-semibold text-white/60">{t("4주 뒤, 내 손에", "After four weeks, in your hands", "4 周后，你将拥有", "Sau 4 tuần, bạn có", "4週間後、手元に", "Setelah 4 minggu, kamu punya")}</p>
        <h2 className="mt-2 whitespace-pre-line break-keep text-[32px] font-bold leading-[1.2] tracking-[-0.03em] md:text-[52px]">{t("말이 아니라,\n결과물로.", "Not promises.\nDeliverables.", "不是空话，\n是成果。", "Không phải lời hứa,\nmà là kết quả.", "言葉ではなく、\n成果物で。", "Bukan janji,\ntapi hasil nyata.")}</h2>
        <ul className="mx-auto mt-10 flex max-w-[460px] flex-col gap-4 text-left">
          {outputs.map((o) => (
            <li key={o} className="flex items-start gap-3">
              <span aria-hidden className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--v2-accent)]">
                <Check className="h-4 w-4 text-white" weight="bold" />
              </span>
              <span className="break-keep text-[19px] font-semibold leading-[1.45] text-white/90 md:text-[21px]">{o}</span>
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-8 max-w-[420px] break-keep text-[14px] leading-[1.6] text-white/50">
          {t("결과물은 본인이 쓴 내용으로 만들어져요. 다른 사람의 서류를 예시로 쓰지 않아요.", "Everything is built from what you write. We never use other people's documents.", "成果均基于你本人写的内容，不使用他人材料作示例。", "Mọi thứ dựa trên nội dung bạn viết, không dùng hồ sơ người khác.", "成果物はあなたが書いた内容から作られ、他人の書類は使いません。", "Semua dibuat dari tulisanmu, bukan dokumen orang lain.")}
        </p>
      </section>

      {/* ⑤ AI 코치 — 대화 모양으로 */}
      <section className="px-5 py-16">
        <Headline
          eyebrow={t("AI 커리어 코치", "AI career coach", "AI 职业教练", "AI coach nghề nghiệp", "AIキャリアコーチ", "AI coach karier")}
          title={t("한 번 말한 건,\n다시 묻지 않아요.", "Say it once.\nIt remembers.", "说过一次，\n不会再问。", "Nói một lần,\nnó nhớ.", "一度話したことは、\nもう聞きません。", "Cukup sekali,\nia ingat.")}
          sub={t("4주 내내 같은 코치가 내 경험과 목표를 기억하고 이어서 도와줘요.", "The same coach remembers your experience and goals all four weeks.", "4 周里同一位教练记住你的经历和目标，持续帮助你。", "Cùng một coach nhớ kinh nghiệm và mục tiêu của bạn suốt 4 tuần.", "4週間ずっと同じコーチが経験と目標を覚えて続けてサポート。", "Coach yang sama mengingat pengalaman dan tujuanmu selama 4 minggu.")}
        />
        <CoachChat t={t} />
      </section>

      {/* ⑥ 자주 묻는 질문 */}
      <section className="bg-[#f5f5f7] px-5 py-16 md:mx-5 md:rounded-[36px]">
        <Headline eyebrow={t("궁금한 점", "Questions", "常见问题", "Câu hỏi", "よくある質問", "Pertanyaan")} title={t("자주 묻는 질문", "FAQ", "常见问题", "Câu hỏi thường gặp", "よくある質問", "FAQ")} />
        <div className="mx-auto mt-8 flex max-w-[640px] flex-col gap-2">
          {faqs.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-white px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[17px] font-semibold text-[color:var(--v2-ink)]">
                {f.q}
                <CaretDown className="h-4 w-4 shrink-0 text-[color:var(--v2-faint)] transition group-open:rotate-180" weight="bold" />
              </summary>
              <p className="mt-2 break-keep text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ⑦ 마지막 권유 */}
      <section className="px-5 pb-10 pt-20 text-center">
        <h2 className="whitespace-pre-line break-keep text-[34px] font-bold leading-[1.2] tracking-[-0.035em] text-[color:var(--v2-ink)] md:text-[52px]">
          {t("4주 뒤의 나를\n만나 보세요.", "Meet yourself,\nfour weeks from now.", "去见见\n4 周后的自己。", "Gặp bạn của\n4 tuần sau.", "4週間後の自分に\n会いに行こう。", "Temui dirimu\n4 minggu lagi.")}
        </h2>
        <div className="mt-8 flex justify-center">
          <PillLink href={START} onClick={() => trackCareerLaunchStartClick("landing_final")}>
            {t("지금 시작하기", "Start now", "立即开始", "Bắt đầu ngay", "今すぐはじめる", "Mulai sekarang")}
          </PillLink>
        </div>
        <p className="mt-6">
          <Link href="/talent/visa" onClick={() => trackCareerLaunchStartClick("landing_visa_guide")} className="text-[16px] font-medium text-[color:var(--v2-accent)] hover:underline">
            {t("어떤 직무가 맞는지 모르겠다면, 비자별 취업 가이드", "Not sure which role? See job guides by visa", "不确定适合什么岗位？看签证求职指南", "Chưa rõ vị trí? Xem hướng dẫn theo visa", "職種に迷ったら、ビザ別就職ガイド", "Belum yakin? Lihat panduan per visa")} ›
          </Link>
        </p>
        <p className="mx-auto mt-12 max-w-[460px] break-keep text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
          {t("Aply 는 합격이나 비자 발급을 보장하지 않습니다. 프로그램은 준비 과정을 돕는 도구예요.", "Aply does not guarantee a job offer or a visa. The program is a tool to help you prepare.", "Aply 不保证录用或签证。本项目是帮助你准备的工具。", "Aply không đảm bảo trúng tuyển hay visa. Chương trình là công cụ hỗ trợ chuẩn bị.", "Aplyは合格やビザ発給を保証しません。プログラムは準備を助けるツールです。", "Aply tidak menjamin diterima kerja atau visa. Program ini alat bantu persiapan.")}
        </p>
      </section>

      {/* 휴대폰 아래 고정 시작 버튼 */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-white/90 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <Link
          href={START}
          onClick={() => trackCareerLaunchStartClick("landing_sticky")}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[color:var(--v2-accent)] text-[17px] font-semibold text-white"
        >
          {t("지금 시작하기", "Start now", "立即开始", "Bắt đầu ngay", "今すぐはじめる", "Mulai sekarang")}
        </Link>
      </div>
    </main>
  );
}

function Headline({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="text-center">
      <p className="text-[15px] font-semibold text-[color:var(--v2-accent)]">{eyebrow}</p>
      <h2 className="mt-2 whitespace-pre-line break-keep text-[32px] font-bold leading-[1.2] tracking-[-0.035em] text-[color:var(--v2-ink)] md:text-[48px]">{title}</h2>
      {sub ? <p className="mx-auto mt-3 max-w-[460px] break-keep text-[17px] leading-[1.55] text-[color:var(--v2-ink-3)]">{sub}</p> : null}
    </div>
  );
}

/** 둥근 알약 버튼 — 광고 페이지의 주 행동. */
function PillLink({ href, onClick, children }: { href: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-full bg-[color:var(--v2-accent)] px-7 text-[17px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98]">
      {children}
    </Link>
  );
}

/** AI 코치 대화 모양 — 지난 상담 내용을 기억해 이어 가는 장면(프로그램 화면의 말풍선 결). 예시 장면이다. */
function CoachChat({ t }: { t: T }) {
  const msgs: { me: boolean; text: string }[] = [
    {
      me: false,
      text: t("지난주에 말한 편의점 발주 경험, 기억나요. 재고를 줄인 이야기를 해외영업 자기소개서 1번 문항에 써 볼까요?", "I remember the convenience-store ordering you mentioned last week. Want to use the stock-reduction story for question 1 of your overseas sales cover letter?", "记得你上周说的便利店订货经历。把减少库存的故事写进海外销售自我介绍第 1 题怎么样？", "Mình nhớ kinh nghiệm đặt hàng ở cửa hàng tiện lợi tuần trước. Dùng câu chuyện giảm tồn kho cho câu 1 thư xin việc kinh doanh quốc tế nhé?", "先週話してくれたコンビニの発注経験、覚えています。在庫を減らした話を海外営業の自己紹介書・設問1に書いてみませんか？", "Saya ingat pengalaman pemesanan di minimarket minggu lalu. Mau pakai cerita pengurangan stok untuk pertanyaan 1 surat sales luar negeri?")
    },
    { me: true, text: t("좋아요! 근데 숫자가 정확히 기억 안 나요.", "Sure! But I don't remember the exact numbers.", "好的！但我记不清具体数字了。", "Được! Nhưng mình không nhớ số chính xác.", "いいですね！でも数字が正確に思い出せません。", "Boleh! Tapi saya lupa angka pastinya.") },
    {
      me: false,
      text: t("괜찮아요. 대략 몇 주 동안, 몇 개 품목이었는지만 알려 주세요. 초안을 먼저 써 드릴게요.", "No problem. Just tell me roughly how many weeks and how many items. I'll draft it first.", "没关系。告诉我大概几周、多少个品类就行，我先帮你写初稿。", "Không sao. Cho mình biết khoảng mấy tuần, bao nhiêu mặt hàng. Mình viết nháp trước nhé.", "大丈夫です。だいたい何週間、何品目かだけ教えてください。先に下書きを書きます。", "Tidak apa. Cukup kira-kira berapa minggu dan berapa item. Saya buat drafnya dulu.")
    }
  ];
  return (
    <div className="mx-auto mt-10 max-w-[520px] rounded-[28px] bg-[#f5f5f7] p-4 min-[360px]:p-5">
      <div className="flex items-center gap-2 px-1 pb-3">
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--v2-accent)] text-[15px]">
          🤖
        </span>
        <span className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t("AI 코치", "AI coach", "AI 教练", "AI coach", "AIコーチ", "AI coach")}</span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {msgs.map((m, i) => (
          <li key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
            <p
              className={`max-w-[85%] break-keep rounded-[20px] px-4 py-3 text-left text-[15px] leading-[1.55] ${m.me ? "rounded-br-md bg-[color:var(--v2-accent)] text-white" : "rounded-bl-md bg-white text-[color:var(--v2-ink-2)]"}`}
            >
              {m.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

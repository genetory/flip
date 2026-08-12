"use client";

// 공개 파트너 랜딩(로그인 전, 기업용). 로그인한 파트너는 앱 홈으로 자동 이동.
// Talent 랜딩과 동일한 멀티섹션 구성(히어로+고민+가치+이용방법+CTA) + Reveal 모션.
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { usePlatformT } from "../../lib/i18n";
import { partnerRoutes } from "../../lib/partner/app-nav";
import { Reveal } from "../site/Reveal";
import { TalentSectionHeader } from "../talent/TalentSectionHeader";
import { TalentButton } from "../talent/TalentButton";
import { AplyFooter } from "../AplyFooter";

const SIGNUP_HREF = "/partner/login"; // 랜딩 CTA는 로그인으로(가입 링크 포함) → 이후 홈으로
const LOGIN_HREF = "/partner/login";

// 히어로 미리보기 — 채용 파이프라인. (라벨은 화면에서 t로 번역)
type PlatformT = ReturnType<typeof usePlatformT>;
const pipeline = (t: PlatformT): { label: string; count: number; state: "done" | "doing" | "todo" }[] => [
  { label: t("지원 완료", "Applied", "已申请", "Đã ứng tuyển", "応募完了", "Terkirim"), count: 12, state: "done" },
  { label: t("서류 검토", "Screening", "简历筛选", "Xét hồ sơ", "書類選考", "Seleksi"), count: 5, state: "doing" },
  { label: t("면접 진행", "Interview", "面试中", "Phỏng vấn", "面接中", "Wawancara"), count: 3, state: "doing" },
  { label: t("최종 합격", "Hired", "最终录用", "Trúng tuyển", "最終合格", "Diterima"), count: 1, state: "todo" }
];

const concerns = (t: PlatformT): string[] => [
  t("공고를 올려도 지원자가 잘 안 와요.", "Even after posting, few applicants come.", "发布职位后应聘者却很少。", "Đăng tin rồi mà ít ứng viên.", "求人を出しても応募が少ないです。", "Sudah pasang lowongan tapi pelamar sedikit."),
  t("지원자 이력서를 일일이 정리하기 번거로워요.", "Sorting through resumes one by one is tedious.", "逐一整理应聘者简历很繁琐。", "Sắp xếp từng hồ sơ ứng viên rất mất công.", "応募者の履歴書を一つずつ整理するのが大変です。", "Merapikan resume pelamar satu per satu merepotkan."),
  t("외국인 채용은 비자부터 막막해요.", "Hiring foreigners is daunting from visas on.", "招聘外国人从签证开始就很头疼。", "Tuyển người nước ngoài rối từ khâu visa.", "外国人採用はビザからつまずきます。", "Rekrut orang asing bingung dari soal visa."),
  t("면접 조율이 메일·전화로 흩어져요.", "Scheduling interviews scatters across email and calls.", "面试安排散落在邮件和电话里。", "Sắp lịch phỏng vấn tản mát qua email, điện thoại.", "面接調整がメール・電話に散らばります。", "Atur wawancara berserakan di email dan telepon.")
];

const values = (t: PlatformT): { icon: string; title: string; desc: string }[] => [
  { icon: "📝", title: t("AI 공고 작성", "AI job posts", "AI 写职位", "AI viết tin", "AI求人作成", "Lowongan AI"), desc: t("핵심만 입력하면 AI가 매력적인 공고 초안을 만들어요.", "Enter the essentials and AI drafts an appealing post.", "只需输入要点，AI 就能生成吸引人的职位草稿。", "Nhập ý chính, AI soạn tin hấp dẫn.", "要点を入れるだけでAIが魅力的な求人案を作ります。", "Masukkan poin utama, AI membuat draf lowongan menarik.") },
  { icon: "👥", title: t("지원자 관리", "Applicant management", "应聘者管理", "Quản lý ứng viên", "応募者管理", "Kelola pelamar"), desc: t("지원자를 단계별로 관리하고 메시지·면접 제안까지 한 곳에서.", "Manage applicants by stage, with messaging and interview offers in one place.", "按阶段管理应聘者，消息与面试邀约集于一处。", "Quản lý ứng viên theo giai đoạn, nhắn tin và mời phỏng vấn ở một nơi.", "応募者を段階別に管理し、メッセージや面接提案まで一箇所で。", "Kelola pelamar per tahap, pesan dan undangan wawancara di satu tempat.") },
  { icon: "🔍", title: t("인재 검색", "Talent search", "人才搜索", "Tìm nhân tài", "人材検索", "Cari talenta"), desc: t("자연어로 원하는 인재를 찾고 먼저 연결을 제안해요.", "Find talent in natural language and reach out first.", "用自然语言找到理想人才并主动联系。", "Tìm nhân tài bằng ngôn ngữ tự nhiên và chủ động kết nối.", "自然言語で人材を探し、先に連絡を提案します。", "Temukan talenta lewat bahasa alami dan hubungi lebih dulu.") },
  { icon: "🎤", title: t("모의 면접 결과", "Mock interview results", "模拟面试结果", "Kết quả phỏng vấn thử", "模擬面接結果", "Hasil wawancara latihan"), desc: t("지원자의 모의 면접 연습 결과까지 참고해 판단해요.", "Factor in applicants' mock interview practice results.", "参考应聘者的模拟面试练习结果来判断。", "Tham khảo cả kết quả luyện phỏng vấn thử của ứng viên.", "応募者の模擬面接の練習結果まで参考に判断します。", "Pertimbangkan juga hasil latihan wawancara pelamar.") },
  { icon: "🪪", title: t("외국인 채용", "Global hiring", "外籍招聘", "Tuyển người nước ngoài", "外国人採用", "Rekrut asing"), desc: t("비자 유형별 공고와 안내로 글로벌 인재를 만나요.", "Meet global talent with visa-type posts and guidance.", "按签证类型发布与指引，遇见全球人才。", "Gặp nhân tài toàn cầu với tin và hướng dẫn theo loại visa.", "ビザ種類別の求人と案内でグローバル人材に出会います。", "Temui talenta global lewat lowongan dan panduan per jenis visa.") },
  { icon: "📅", title: t("면접 진행", "Interviews", "面试安排", "Phỏng vấn", "面接進行", "Wawancara"), desc: t("메시지와 면접 일정을 한 곳에서 조율해요.", "Coordinate messages and interview schedules in one place.", "在一处协调消息与面试日程。", "Điều phối tin nhắn và lịch phỏng vấn ở một nơi.", "メッセージと面接日程を一箇所で調整します。", "Koordinasikan pesan dan jadwal wawancara di satu tempat.") }
];

const steps = (t: PlatformT): { no: string; title: string; desc: string }[] => [
  { no: "01", title: t("회사·공고 등록", "Register company & job", "登记公司与职位", "Đăng công ty & tin", "会社・求人登録", "Daftar perusahaan & lowongan"), desc: t("회사 정보와 채용 공고를 올려요. AI가 초안을 도와줘요.", "Post your company info and job. AI helps draft it.", "上传公司信息和招聘职位，AI 帮您起草。", "Đăng thông tin công ty và tin tuyển dụng. AI hỗ trợ soạn.", "会社情報と求人を登録します。AIが下書きを手伝います。", "Unggah info perusahaan dan lowongan. AI bantu draf.") },
  { no: "02", title: t("지원자 관리", "Manage applicants", "管理应聘者", "Quản lý ứng viên", "応募者管理", "Kelola pelamar"), desc: t("지원자를 검토하고 단계별로 관리해요.", "Review applicants and manage them by stage.", "审核应聘者并按阶段管理。", "Xem xét ứng viên và quản lý theo giai đoạn.", "応募者を確認し、段階別に管理します。", "Tinjau pelamar dan kelola per tahap.") },
  { no: "03", title: t("면접·채용", "Interview & hire", "面试与录用", "Phỏng vấn & tuyển", "面接・採用", "Wawancara & rekrut"), desc: t("면접을 제안하고 좋은 인재를 채용해요.", "Offer interviews and hire great talent.", "邀约面试并录用优秀人才。", "Mời phỏng vấn và tuyển nhân tài giỏi.", "面接を提案し、良い人材を採用します。", "Tawarkan wawancara dan rekrut talenta hebat.") }
];

export function PartnerLandingPage() {
  const t = usePlatformT();
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (!isReady) return;
    if (isAuthenticated && (user?.role === "PARTNER" || user?.role === "OPERATOR")) {
      router.replace(partnerRoutes.home);
    }
  }, [isReady, isAuthenticated, user?.role, router]);

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 border-b border-[#EEF1F5] bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <Link href="/" aria-label={t("APLY 홈", "APLY home", "APLY 主页", "Trang chủ APLY", "APLYホーム", "Beranda APLY")} className="flex items-center">
              <Image src="/img_logo.webp" alt="APLY" width={72} height={24} className="h-5 w-auto" priority />
            </Link>
            <span className="rounded-md bg-[#EDF1FD] px-2.5 py-0.5 text-[11px] font-bold text-[#0B46E8]">{t("파트너", "Partner", "合作伙伴", "Đối tác", "パートナー", "Partner")}</span>
          </div>
          <Link href={LOGIN_HREF} className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-[#4E5968] transition hover:text-[#191F28]">{t("로그인", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}</Link>
        </div>
      </header>

      <main>
        <Hero />
        <ConcernSection />
        <ValueSection />
        <StepSection />
        <FinalCta />
      </main>

      <AplyFooter />
    </div>
  );
}

/* 1. 히어로 */
function Hero() {
  const t = usePlatformT();
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-3xl px-5 pb-4 pt-14 text-center md:pt-20">
        <Reveal>
          <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-4 py-2 text-[13.5px] font-bold text-[#4E5968]">
            {t("기업 채용을 위한 서비스", "A hiring service for companies", "为企业招聘打造的服务", "Dịch vụ tuyển dụng cho doanh nghiệp", "企業採用のためのサービス", "Layanan rekrutmen untuk perusahaan")}
          </span>
        </Reveal>
        <Reveal delayMs={80}>
          <h1 className="mt-8 text-[34px] font-black leading-[1.12] tracking-[-0.04em] text-[#0B1227] md:text-[52px]">
            <span className="block">{t("좋은 인재를 만나는 채용,", "Hiring that finds great talent,", "遇见优秀人才的招聘，", "Tuyển dụng gặp gỡ nhân tài,", "優秀な人材と出会う採用を、", "Rekrutmen yang menemukan talenta hebat,")}</span>
            <span className="block">{t("APLY에서 시작하세요", "start it on APLY", "从 APLY 开始", "bắt đầu trên APLY", "APLYで始めましょう", "mulai di APLY")}</span>
          </h1>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="mx-auto mt-7 max-w-lg break-keep text-[17px] leading-[1.6] text-[#4E5968] md:text-[20px]">
            {t("공고 등록부터 지원자 관리, 면접까지 — 채용의 모든 과정을 한 곳에서.", "From posting jobs to managing applicants and interviews — the whole hiring process in one place.", "从发布职位到管理应聘者、面试——招聘全流程集于一处。", "Từ đăng tin, quản lý ứng viên đến phỏng vấn — toàn bộ quy trình tuyển dụng ở một nơi.", "求人掲載から応募者管理、面接まで — 採用のすべてを一つの場所で。", "Dari pasang lowongan, kelola pelamar, hingga wawancara — semua proses rekrutmen di satu tempat.")}
          </p>
        </Reveal>
        <Reveal delayMs={240}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TalentButton href={SIGNUP_HREF} variant="primary" size="lg" aria-label={t("채용 시작하기", "Start hiring", "开始招聘", "Bắt đầu tuyển dụng", "採用を始める", "Mulai merekrut")}>
              {t("채용 시작하기", "Start hiring", "开始招聘", "Bắt đầu tuyển dụng", "採用を始める", "Mulai merekrut")}
            </TalentButton>
          </div>
          <p className="mt-5 text-[14px] text-[#8B95A1]">{t("몇 분이면 첫 공고를 올릴 수 있어요.", "You can post your first job in minutes.", "几分钟就能发布第一个职位。", "Chỉ vài phút để đăng tin tuyển dụng đầu tiên.", "数分で最初の求人を掲載できます。", "Hanya beberapa menit untuk memasang lowongan pertama.")}</p>
        </Reveal>
      </div>

      {/* 중앙 미리보기 카드 — 채용 파이프라인 */}
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-8 md:pb-16">
        <Reveal delayMs={200} y="lg">
          <PipelinePreview />
        </Reveal>
      </div>
    </section>
  );
}

function PipelinePreview() {
  const t = usePlatformT();
  const PIPELINE = pipeline(t);
  const total = PIPELINE[0]?.count ?? 0;
  return (
    <div className="rounded-3xl border border-[#EEF1F5] bg-white p-6 shadow-[0_10px_32px_rgba(11,18,39,0.07)]">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-[#4E5968]">{t("프론트엔드 개발자 · 채용 현황", "Frontend Developer · Hiring status", "前端开发工程师 · 招聘进度", "Lập trình viên Frontend · Tình trạng tuyển dụng", "フロントエンド開発者 · 採用状況", "Frontend Developer · Status rekrutmen")}</p>
        <span className="text-[13px] font-bold text-[#0B46E8]">{t(`지원 ${total}명`, `${total} applicants`, `${total} 人申请`, `${total} ứng viên`, `応募 ${total}名`, `${total} pelamar`)}</span>
      </div>
      <ul className="mt-5 flex flex-col gap-3.5">
        {PIPELINE.map((s) => {
          const dot = s.state === "done" ? "bg-[#12B76A]" : s.state === "doing" ? "bg-[#0B46E8]" : "bg-[#D7DCE3]";
          const text = s.state === "todo" ? "text-[#8B95A1]" : "text-[#191F28]";
          return (
            <li key={s.label} className="flex items-center gap-3.5">
              <span className={`h-3 w-3 rounded-full ${dot}`} />
              <span className={`text-[15px] ${text}`}>{s.label}</span>
              <span className="ml-auto text-[13px] font-bold text-[#4E5968]">{t(`${s.count}명`, `${s.count}`, `${s.count} 人`, `${s.count}`, `${s.count}名`, `${s.count}`)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* 2. 기업의 고민 */
function ConcernSection() {
  const t = usePlatformT();
  const CONCERNS = concerns(t);
  return (
    <section className="bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={t("채용, 이런 고민\n있으셨나요?", "Hiring — do these\nsound familiar?", "招聘中，您是否\n也有这些烦恼？", "Tuyển dụng — bạn có\ngặp những trăn trở này?", "採用で、こんな\n悩みはありませんか？", "Rekrutmen — pernah\nmengalami hal ini?")} />
        </Reveal>
        <div className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-3.5 sm:grid-cols-2">
          {CONCERNS.map((c, i) => (
            <Reveal key={c} delayMs={i * 80}>
              <div className="h-full rounded-2xl border border-[#EEF1F5] bg-white px-7 py-6 text-[16px] leading-relaxed text-[#4E5968]">“{c}”</div>
            </Reveal>
          ))}
        </div>
        <Reveal delayMs={120}>
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="whitespace-pre-line break-keep text-[24px] font-black leading-[1.4] tracking-[-0.03em] text-[#0B1227] md:text-[34px]">
              {t("채용의 처음부터 끝까지,\nAPLY가 함께합니다.", "From start to finish,\nAPLY is with you.", "从头到尾，\nAPLY 与您同行。", "Từ đầu đến cuối,\nAPLY luôn đồng hành.", "採用の最初から最後まで、\nAPLYが伴走します。", "Dari awal hingga akhir,\nAPLY menemani Anda.")}
            </p>
            <p className="mx-auto mt-6 max-w-xl break-keep text-[16px] leading-[1.7] text-[#4E5968] md:text-[18px]">
              {t("공고 작성부터 지원자 관리, 인재 검색, 면접까지 한 흐름으로 이어져요.", "From writing job posts to managing applicants, searching talent, and interviews — all in one flow.", "从撰写职位、管理应聘者到搜索人才、面试，一气呵成。", "Từ viết tin tuyển dụng, quản lý ứng viên, tìm nhân tài đến phỏng vấn — liền mạch trong một luồng.", "求人作成から応募者管理、人材検索、面接まで一つの流れでつながります。", "Dari menulis lowongan, kelola pelamar, cari talenta, hingga wawancara — semua dalam satu alur.")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 3. 제공하는 가치 */
function ValueSection() {
  const t = usePlatformT();
  const VALUES = values(t);
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={t("채용에 필요한 모든 것", "Everything you need to hire", "招聘所需的一切", "Mọi thứ bạn cần để tuyển dụng", "採用に必要なすべて", "Semua yang Anda butuhkan untuk merekrut")} />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((card, i) => (
            <Reveal key={card.title} delayMs={(i % 3) * 90}>
              <div className="h-full rounded-3xl border border-[#EEF1F5] bg-white p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[28px]" aria-hidden>
                  {card.icon}
                </span>
                <p className="mt-6 text-[19px] font-bold text-[#191F28]">{card.title}</p>
                <p className="mt-2.5 break-keep text-[15px] leading-[1.6] text-[#4E5968]">{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4. 이용 방법 */
function StepSection() {
  const t = usePlatformT();
  const STEPS = steps(t);
  return (
    <section className="bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={t("세 걸음이면 충분해요", "Just three steps", "三步即可搞定", "Chỉ ba bước là đủ", "3ステップで十分", "Cukup tiga langkah")} />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.no} delayMs={i * 90}>
              <div className="h-full rounded-3xl border border-[#EEF1F5] bg-white p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B46E8] text-[18px] font-black text-white">
                  {s.no}
                </span>
                <p className="mt-6 text-[19px] font-bold text-[#191F28]">{s.title}</p>
                <p className="mt-2.5 break-keep text-[15px] leading-[1.6] text-[#4E5968]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 5. 마지막 CTA */
function FinalCta() {
  const t = usePlatformT();
  return (
    <section className="bg-[#0B46E8]">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:py-24">
        <Reveal y="lg">
          <p className="whitespace-pre-line text-[30px] font-black leading-[1.25] tracking-[-0.035em] text-white md:text-[46px]">
            {t("좋은 인재,\n지금 만나보세요", "Great talent,\nmeet them now", "优秀人才，\n现在就遇见", "Nhân tài giỏi,\ngặp ngay hôm nay", "優秀な人材に、\n今すぐ会いましょう", "Talenta hebat,\ntemui sekarang")}
          </p>
          <p className="mx-auto mt-6 max-w-md break-keep text-[16px] leading-[1.65] text-white/75 md:text-[18px]">
            {t("가입하고 첫 공고를 올리는 데 몇 분이면 충분해요.", "Sign up and post your first job in just minutes.", "注册并发布第一个职位，只需几分钟。", "Đăng ký và đăng tin đầu tiên chỉ trong vài phút.", "登録して最初の求人を掲載するのに数分で十分です。", "Daftar dan pasang lowongan pertama hanya dalam beberapa menit.")}
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href={SIGNUP_HREF}
              aria-label={t("채용 시작하기", "Start hiring", "开始招聘", "Bắt đầu tuyển dụng", "採用を始める", "Mulai merekrut")}
              className="inline-flex h-[56px] items-center justify-center gap-1.5 rounded-xl bg-white px-8 text-[16px] font-bold text-[#0B46E8] transition hover:bg-[#F2F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B46E8]"
            >
              {t("채용 시작하기", "Start hiring", "开始招聘", "Bắt đầu tuyển dụng", "採用を始める", "Mulai merekrut")} <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

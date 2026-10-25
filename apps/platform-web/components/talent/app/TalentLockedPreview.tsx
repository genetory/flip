"use client";

// 로그인 필요 화면을 게스트가 열었을 때 보여 주는 '잠긴 미리보기'.
// 예전엔 곧장 로그인 페이지로 보냈는데, 무슨 화면인지도 모른 채 로그인부터 하라고 하면
// 믿음이 안 간다. 그래서 GNB·푸터는 그대로 두고, 이 화면이 무엇인지 알려 준 뒤
// 화면 모양을 목업으로 살짝 보여 주고 아래 절반을 그라데이션으로 덮은 뒤 로그인을 권한다.
// 목업은 지어낸 예시뿐이다 — 게스트에게 보여 줄 실제 데이터가 없고, 회원 API 를 부르지 않는다.
// 회사·사람 이름도 실재하지 않는 것으로 골랐다.
import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ArrowRight, CalendarCheck, CaretRight, ChatCircleDots, Check, FileText, Lock, Plus, X } from "@phosphor-icons/react";
import { TalentHeader } from "../TalentHeader";
import { AplyFooter } from "../../AplyFooter";
import { talentRoutes } from "../../../lib/talent/landing-content";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

type Meta = { title: string; desc: string };

// 경로 앞부분으로 고른다 — 위에서부터 처음 맞는 것. 더 구체적인 경로를 먼저 둔다.
function metaFor(path: string, t: PlatformT): Meta {
  const rules: [string, () => Meta][] = [
    ["/talent/career/resume/diagnosis", () => ({
      title: t("이력서 AI 진단", "Resume AI check", "简历 AI 诊断", "Chẩn đoán CV bằng AI", "履歴書 AI 診断", "Cek CV dengan AI"),
      desc: t("AI가 이력서를 읽고 보완할 점을 짚어 줘요.", "AI reads your resume and points out what to improve.", "AI 阅读你的简历并指出需要改进的地方。", "AI đọc CV và chỉ ra những điểm cần cải thiện.", "AI が履歴書を読み、改善点を教えてくれます。", "AI membaca CV kamu dan menunjukkan yang perlu diperbaiki.")
    })],
    ["/talent/career/resume", () => resumeMeta(t)],
    ["/talent/career/resumes", () => resumeMeta(t)],
    ["/talent/career/cover", () => coverMeta(t)],
    ["/talent/career/interviews", () => ({
      title: t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Simulasi wawancara"),
      desc: t("공고에 맞춘 질문으로 면접을 연습하고 피드백을 받아요.", "Practice with questions tailored to the job and get feedback.", "用针对职位的问题练习面试并获得反馈。", "Luyện phỏng vấn với câu hỏi theo tin tuyển dụng và nhận góp ý.", "求人に合わせた質問で面接を練習し、フィードバックを受けられます。", "Latihan wawancara dengan pertanyaan sesuai lowongan dan dapatkan masukan.")
    })],
    ["/talent/career/experiences", () => ({
      title: t("경험 정리", "Experiences", "经历整理", "Kinh nghiệm", "経験の整理", "Pengalaman"),
      desc: t("지금까지의 경험을 모아 이력서·자소서 재료로 써요.", "Collect your experiences to use in your resume and cover letter.", "整理过往经历，用作简历和自我介绍的素材。", "Gom kinh nghiệm để dùng cho CV và thư giới thiệu.", "これまでの経験をまとめ、履歴書・自己PRの材料にします。", "Kumpulkan pengalaman untuk bahan CV dan surat lamaran.")
    })],
    ["/talent/career", () => ({
      title: t("내 커리어", "My career", "我的职业", "Sự nghiệp của tôi", "マイキャリア", "Karier saya"),
      desc: t("이력서·자소서·면접 준비를 한곳에서 관리해요.", "Manage your resume, cover letter, and interview prep in one place.", "在一处管理简历、自我介绍和面试准备。", "Quản lý CV, thư giới thiệu và chuẩn bị phỏng vấn tại một nơi.", "履歴書・自己PR・面接準備を一か所で管理できます。", "Kelola CV, surat lamaran, dan persiapan wawancara di satu tempat.")
    })],
    ["/talent/applications", () => ({
      title: t("지원 현황", "Applications", "申请状态", "Hồ sơ đã ứng tuyển", "応募状況", "Status lamaran"),
      desc: t("지원한 공고의 진행 상태와 기업 메시지를 확인해요.", "Track the status of your applications and messages from companies.", "查看已申请职位的进度和企业消息。", "Theo dõi tiến trình ứng tuyển và tin nhắn từ công ty.", "応募した求人の進捗と企業からのメッセージを確認できます。", "Pantau status lamaran dan pesan dari perusahaan.")
    })],
    ["/talent/home", () => ({
      title: t("홈", "Home", "首页", "Trang chủ", "ホーム", "Beranda"),
      desc: t("내 지원·서류 준비·추천 공고를 한눈에 봐요.", "See your applications, documents, and recommended jobs at a glance.", "一眼查看申请、材料准备和推荐职位。", "Xem nhanh hồ sơ ứng tuyển, giấy tờ và việc làm gợi ý.", "応募・書類準備・おすすめ求人をひと目で確認できます。", "Lihat lamaran, dokumen, dan lowongan rekomendasi sekilas.")
    })],
    ["/talent/notifications", () => ({
      title: t("알림", "Notifications", "通知", "Thông báo", "通知", "Notifikasi"),
      desc: t("지원 결과·면접 일정·새 공고 소식을 모아 봐요.", "Application results, interview schedules, and new job alerts in one place.", "汇总申请结果、面试日程和新职位消息。", "Kết quả ứng tuyển, lịch phỏng vấn và việc làm mới ở một nơi.", "応募結果・面接日程・新着求人をまとめて確認できます。", "Hasil lamaran, jadwal wawancara, dan lowongan baru di satu tempat.")
    })],
    ["/talent/settings", () => ({
      title: t("설정", "Settings", "设置", "Cài đặt", "設定", "Pengaturan"),
      desc: t("계정·알림·포인트를 관리해요.", "Manage your account, notifications, and points.", "管理账户、通知和积分。", "Quản lý tài khoản, thông báo và điểm.", "アカウント・通知・ポイントを管理できます。", "Kelola akun, notifikasi, dan poin.")
    })]
  ];
  const hit = rules.find(([prefix]) => path.startsWith(prefix));
  if (hit) return hit[1]();
  return {
    title: t("회원 전용 화면", "Members only", "会员专属页面", "Dành cho thành viên", "会員専用ページ", "Khusus anggota"),
    desc: t("로그인하면 내 정보에 맞춘 화면을 볼 수 있어요.", "Log in to see this page with your own information.", "登录后即可查看为你定制的页面。", "Đăng nhập để xem trang theo thông tin của bạn.", "ログインすると、あなたに合わせた画面が見られます。", "Masuk untuk melihat halaman sesuai data kamu.")
  };
}

function resumeMeta(t: PlatformT): Meta {
  return {
    title: t("이력서", "Resume", "简历", "CV", "履歴書", "CV"),
    desc: t("이력서를 쓰고 AI로 점검한 뒤 PDF로 내려받아요.", "Write your resume, check it with AI, and download it as a PDF.", "撰写简历，用 AI 检查后下载 PDF。", "Viết CV, kiểm tra bằng AI và tải về PDF.", "履歴書を作成し、AI でチェックして PDF で保存できます。", "Tulis CV, cek dengan AI, lalu unduh sebagai PDF.")
  };
}

function coverMeta(t: PlatformT): Meta {
  return {
    title: t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己PR", "Surat lamaran"),
    desc: t("문항별로 자소서를 쓰고 AI 점검을 받아요.", "Write answers for each question and get an AI check.", "按题目撰写自我介绍并获得 AI 检查。", "Viết theo từng câu hỏi và được AI kiểm tra.", "設問ごとに作成し、AI チェックを受けられます。", "Tulis jawaban per pertanyaan dan dapatkan cek AI.")
  };
}

type Kind = "home" | "career" | "applications" | "resume" | "cover" | "interview" | "dashboard";

function kindFor(path: string): Kind {
  if (path === "/talent/home") return "home";
  if (path === "/talent/career") return "career";
  if (path.startsWith("/talent/applications")) return "applications";
  if (path.startsWith("/talent/career/resume")) return "resume";
  if (path.startsWith("/talent/career/cover")) return "cover";
  if (path.startsWith("/talent/career/interviews")) return "interview";
  return "dashboard";
}

// 실제 화면과 같은 머리말(제목·설명)을 목업이 직접 그리는 화면. 위에 공통 제목을 또 달지 않는다.
const OWN_HEADER: Kind[] = ["home", "career", "applications", "interview"];

const CARD = "rounded-2xl bg-white ring-1 ring-[#EEF1F5]";

function Chip({ tone, children }: { tone: "blue" | "green" | "gray"; children: ReactNode }) {
  const cls = tone === "blue" ? "bg-[#EDF1FD] text-[#0B46E8]" : tone === "green" ? "bg-[#E8F7EF] text-[#03A65A]" : "bg-[#F2F4F6] text-[#6B7684]";
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${cls}`}>{children}</span>;
}

// ── 홈·내 커리어·지원 현황 — 실제 화면(HomeScreen·CareerHomeScreen·ApplicationsScreen)의 마크업을
//    그대로 옮겨 값만 예시로 채웠다. 화면을 고치면 여기도 같이 맞춘다.

function ProgressRing({ pct }: { pct: number }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#EDF1FD" strokeWidth="5" />
      <circle cx="26" cy="26" r={r} fill="none" stroke="#0B46E8" strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 26 26)" />
      <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="800" fill="#0B1227">
        {pct}%
      </text>
    </svg>
  );
}

function MockFunnelCards({ t }: { t: PlatformT }) {
  const cards: [string, number, string][] = [
    [t("Alex님의 이력서", "Alex's resume", "Alex 的简历", "Hồ sơ của Alex", "Alexさんの履歴書", "Resume Alex"), 85, t("거의 다 됐어요", "Almost there", "快完成了", "Sắp xong", "あと少し", "Hampir selesai")],
    [t("Alex님의 자기소개서", "Alex's cover letter", "Alex 的自我介绍", "Thư giới thiệu của Alex", "Alexさんの自己紹介書", "Surat lamaran Alex"), 50, t("절반쯤 작성했어요", "About halfway", "已写一半", "Được nửa chặng", "半分ほど作成", "Setengah jalan")]
  ];
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map(([label, pct, msg]) => (
        <div key={label} className="flex flex-col rounded-2xl border border-[#EEF1F5] bg-white p-5">
          <ProgressRing pct={pct} />
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{label}</p>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p className="break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{msg}</p>
            <span className="hidden shrink-0 rounded-lg bg-[#F2F4F6] px-3.5 py-2 text-[12.5px] font-bold text-[#4E5968] sm:inline">{t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{desc}</p>
    </div>
  );
}

function MockHome({ t }: { t: PlatformT }) {
  const feed: [string, string, string, string][] = [
    ["💼", t("경험을 업데이트했어요!", "Updated Experience!", "已更新经历！", "Đã cập nhật Kinh nghiệm!", "経験を更新しました！", "Pengalaman diperbarui!"), t("Blue Harbor 마케팅 인턴 — SNS 캠페인으로 유입 32% 증가", "Blue Harbor marketing intern — grew traffic 32% with social campaigns", "Blue Harbor 市场实习 — 社媒活动使流量增长 32%", "Thực tập marketing Blue Harbor — tăng 32% truy cập nhờ MXH", "Blue Harbor マーケティングインターン — SNS で流入 32% 増", "Magang pemasaran Blue Harbor — trafik naik 32% lewat medsos"), t("2시간 전", "2h ago", "2 小时前", "2 giờ trước", "2時間前", "2 jam lalu")],
    ["🗣️", t("어학을 업데이트했어요!", "Updated Language!", "已更新语言！", "Đã cập nhật Ngoại ngữ!", "語学を更新しました！", "Bahasa diperbarui!"), "TOPIK 6", t("어제", "Yesterday", "昨天", "Hôm qua", "昨日", "Kemarin")]
  ];
  return (
    <div className="flex flex-col gap-10">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#0B46E8]">{t("자기소개서 작성 단계", "Writing your cover letter", "撰写自我介绍中", "Đang viết thư xin việc", "自己PR作成中", "Menulis surat lamaran")}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11.5px] font-bold text-[#4E5968] shadow-[0_1px_4px_rgba(11,18,39,0.05)]">🔥 {t("3일 연속", "3-day streak", "连续 3 天", "3 ngày liên tục", "3日連続", "3 hari beruntun")}</span>
          </div>
          <p className="mt-2 text-[13px] font-bold text-[#4E5968]">{t("안녕하세요", "Hello", "你好", "Xin chào", "こんにちは", "Halo")} 👋</p>
          <p className="mt-1 break-keep text-[22px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{t("Alex님, 오늘도 한 걸음 나아가요", "Alex, take another step forward today", "Alex，今天也向前迈进一步", "Alex, hôm nay hãy tiến thêm một bước", "Alexさん、今日も一歩前進しましょう", "Alex, ambil satu langkah maju lagi hari ini")}</p>
          <p className="mt-1.5 break-keep text-[13.5px] text-[#8B95A1]">{t("오늘도 한 걸음씩, 취업에 가까워지고 있어요.", "Step by step, you're getting closer to your job.", "一步一步，你正离理想工作越来越近。", "Từng bước một, bạn đang tiến gần hơn đến công việc.", "一歩ずつ、就職に近づいています。", "Selangkah demi selangkah, Anda makin dekat dengan pekerjaan.")}</p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13px] font-bold text-white">
            {t("자기소개서 쓰기", "Write cover letter", "写自我介绍", "Viết thư xin việc", "自己PRを書く", "Tulis surat lamaran")} <ArrowRight className="h-4 w-4" weight="bold" />
          </span>
        </div>
        <div className="relative hidden aspect-square w-[140px] shrink-0 self-center sm:block md:w-[190px]">
          <Image src="/img_home_hero.webp" alt="" fill sizes="190px" className="object-contain" />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHead
          title={t("내 커리어가 쌓이고 있어요", "Your career is building up", "你的职业经历正在积累", "Sự nghiệp của bạn đang tích lũy", "あなたのキャリアが積み上がっています", "Karier Anda sedang terbangun")}
          desc={t("남긴 기록이 이력서·자기소개서로 정리돼요.", "Your notes become your resume and cover letter.", "你的记录会整理成简历和自我介绍。", "Ghi chú của bạn trở thành CV và thư xin việc.", "残した記録が履歴書・自己PRにまとまります。", "Catatan Anda menjadi resume dan surat lamaran.")}
        />
        <MockFunnelCards t={t} />
        <div className="flex flex-col gap-2.5">
          {feed.map(([emoji, title, text, when]) => (
            <div key={title} className="flex items-start gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[18px]">{emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-bold text-[#191F28]">{title}</p>
                <p className="mt-0.5 line-clamp-2 break-keep text-[13px] leading-relaxed text-[#4E5968]">{text}</p>
                <p className="mt-1 text-[11.5px] text-[#B0B8C1]">{when}</p>
              </div>
              <CaretRight className="mt-1 h-4 w-4 shrink-0 text-[#C4CAD2]" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MockCareer({ t }: { t: PlatformT }) {
  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">MY CAREER</p>
        <p className="mt-2 break-keep text-[26px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227]">{t("내 커리어를 하나씩 완성해요", "Build your career step by step", "一步步完善我的职业", "Hoàn thiện sự nghiệp từng bước", "キャリアを一つずつ完成させよう", "Bangun karier langkah demi langkah")}</p>
        <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#8B95A1]">{t("이력서·자기소개서를 만들고, 오늘 한 걸음씩 취업에 가까워져요.", "Create your resume and cover letter, and get one step closer to a job each day.", "制作简历和求职信，每天离就业更近一步。", "Tạo CV và thư xin việc, mỗi ngày tiến gần hơn tới việc làm.", "履歴書・自己PRを作り、今日も一歩ずつ就職に近づこう。", "Buat CV dan surat lamaran, makin dekat ke pekerjaan tiap hari.")}</p>
      </div>

      <section className="flex flex-col gap-4">
        <SectionHead
          title={t("관심 직무를 정해요", "Set your job interests", "确定兴趣职位", "Chọn nghề quan tâm", "関心職種を決める", "Tentukan minat pekerjaan")}
          desc={t("관심 직무를 고르면 그에 맞는 공고와 모의 면접이 더 정확해져요. 직접 고르거나 수정할 수 있어요.", "Pick your interests so matched jobs and mock interviews get more accurate. You can pick or edit them directly.", "选择兴趣职位后，匹配的招聘和模拟面试会更精准。可自行选择或修改。", "Chọn nghề quan tâm để tin tuyển và phỏng vấn thử chính xác hơn. Bạn có thể tự chọn hoặc sửa.", "関心職種を選ぶと、合う求人や模擬面接がより正確になります。直接選択・修正できます。", "Pilih minat agar lowongan dan wawancara simulasi lebih akurat. Bisa pilih atau ubah sendiri.")}
        />
        <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
          <div className="flex flex-wrap gap-2">
            {[t("마케팅", "Marketing", "市场营销", "Marketing", "マーケティング", "Pemasaran"), t("해외영업", "Global sales", "海外销售", "Kinh doanh quốc tế", "海外営業", "Penjualan global")].map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] py-1.5 pl-3.5 pr-2 text-[12.5px] font-bold text-[#0B46E8]">
                {r}
                <X className="h-3 w-3 text-[#8AA6EF]" weight="bold" />
              </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#C7D6F7] px-3.5 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">
              <Plus className="h-3.5 w-3.5" weight="bold" /> {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-[#F6F8FB] px-4 py-3 text-[13px] font-bold text-[#4E5968]">
            {t("관심 직무 맞춤 공고 보기", "See jobs matched to your interests", "查看兴趣匹配职位", "Xem việc khớp sở thích", "関心職種に合う求人を見る", "Lihat lowongan sesuai minat")}
            <CaretRight className="h-4 w-4 shrink-0" weight="bold" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionHead
          title={t("지원 서류를 만들어요", "Create your documents", "制作申请材料", "Tạo hồ sơ ứng tuyển", "応募書類を作る", "Buat dokumen lamaran")}
          desc={t("AI 챗으로 편하게 채우고, 미리보기로 확인해요.", "Fill it in easily with AI chat and check the preview.", "用 AI 聊天轻松填写，并通过预览查看。", "Điền dễ dàng bằng AI chat và xem trước.", "AIチャットで手軽に入力し、プレビューで確認。", "Isi mudah dengan AI chat dan cek pratinjau.")}
        />
        <MockFunnelCards t={t} />
      </section>
    </div>
  );
}

function MockTimeline({ t, interview }: { t: PlatformT; interview: boolean }) {
  const node = (on: boolean, current = false) => (
    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${on ? `bg-[#0B46E8] ${current ? "ring-4 ring-[#0B46E8]/15" : ""}` : "bg-[#E5E8EB]"}`}>
      {on && !current ? <Check className="h-3.5 w-3.5 text-white" weight="bold" /> : current ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
    </span>
  );
  return (
    <div>
      <div className="flex items-center">
        {node(true)}
        <span className={`mx-1 h-[3px] flex-1 rounded-full ${interview ? "bg-[#0B46E8]" : "bg-[#E5E8EB]"}`} />
        {node(interview, interview)}
        <span className="mx-1 h-[3px] flex-1 rounded-full bg-[#E5E8EB]" />
        {node(false)}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] font-bold">
        <span className="w-1/3 text-left text-[#191F28]">{t("지원 완료", "Applied", "已申请", "Đã ứng tuyển", "応募完了", "Dilamar")}</span>
        <span className={`w-1/3 text-center ${interview ? "text-[#0B46E8]" : "text-[#B0B8C1]"}`}>{t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")}</span>
        <span className="w-1/3 text-right text-[#B0B8C1]">{t("결과", "Result", "结果", "Kết quả", "結果", "Hasil")}</span>
      </div>
    </div>
  );
}

function MockApplications({ t }: { t: PlatformT }) {
  const tabs: [string, number][] = [
    [t("전체", "All", "全部", "Tất cả", "すべて", "Semua"), 3],
    [t("지원 완료", "Submitted", "已提交", "Đã nộp", "応募完了", "Terkirim"), 2],
    [t("면접 대기", "Interview pending", "待面试", "Chờ phỏng vấn", "面接待ち", "Menunggu"), 0],
    [t("면접 확정", "Interview set", "面试确定", "Đã chốt PV", "面接確定", "Terjadwal"), 1],
    [t("합격", "Accepted", "已录取", "Trúng tuyển", "合格", "Diterima"), 0]
  ];
  const btn = "inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4E5968]";
  const apps = [
    { interview: true, title: t("마케팅 매니저 (외국인 채용)", "Marketing manager (open to foreigners)", "市场经理（招聘外国人）", "Quản lý marketing (tuyển người nước ngoài)", "マーケティングマネージャー（外国人採用）", "Manajer pemasaran (terbuka untuk WNA)"), co: "Blue Harbor", when: t("3일 전", "3d ago", "3 天前", "3 ngày trước", "3日前", "3 hari lalu") },
    { interview: false, title: t("해외영업 담당자", "Global sales associate", "海外销售专员", "Nhân viên kinh doanh quốc tế", "海外営業担当", "Staf penjualan global"), co: "Mint Commerce", when: t("어제", "Yesterday", "昨天", "Hôm qua", "昨日", "Kemarin") }
  ];
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("지원 현황", "Applications", "申请状态", "Trạng thái ứng tuyển", "応募状況", "Status Lamaran")}</p>
        <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("지원한 공고의 진행 상태를 확인해요.", "Check the status of jobs you've applied to.", "查看已申请职位的进展。", "Xem tiến trình các vị trí bạn đã ứng tuyển.", "応募した求人の進捗を確認しましょう。", "Lihat status lowongan yang kamu lamar.")}</p>
      </div>
      <div className="flex gap-6 overflow-hidden">
        {tabs.map(([label, n], i) => (
          <span key={label} className={`relative shrink-0 pb-1.5 text-[15px] font-bold ${i === 0 ? "text-[#191F28]" : "text-[#B0B8C1]"}`}>
            {label} ({n}){i === 0 ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3.5">
        {apps.map((a) => (
          <div key={a.co} className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${a.interview ? "bg-[#FFF3E6] text-[#E8890C]" : "bg-[#EDF1FD] text-[#0B46E8]"}`}>
                {a.interview ? t("면접 진행", "Interviewing", "面试中", "Đang phỏng vấn", "面接中", "Wawancara") : t("지원 완료", "Submitted", "已提交", "Đã nộp", "応募完了", "Terkirim")}
              </span>
              <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{t("지원", "Applied", "申请", "Ứng tuyển", "応募", "Dilamar")} · {a.when}</span>
            </div>
            <p className="mt-3 text-[16px] font-bold leading-snug tracking-[-0.01em] text-[#191F28]">{a.title}</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">{a.co}</p>
            <div className="mt-4">
              <MockTimeline t={t} interview={a.interview} />
            </div>
            {a.interview ? (
              <div className="mt-3.5 rounded-xl bg-[#FFF3E6] px-4 py-3.5">
                <p className="flex items-center gap-1.5 text-[12px] font-bold text-[#E8890C]">
                  <CalendarCheck className="h-4 w-4" weight="fill" /> {t("면접 확정", "Interview set", "面试已确定", "Đã chốt phỏng vấn", "面接確定", "Wawancara terjadwal")}
                </p>
                <p className="mt-1 text-[13px] font-semibold text-[#191F28]">{t("10월 21일 (화) 오후 2:00", "Tue, Oct 21 · 2:00 PM", "10月21日（周二）下午 2:00", "Thứ Ba, 21/10 · 14:00", "10月21日（火）14:00", "Selasa, 21 Okt · 14.00")}</p>
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className={btn}>{t("공고 보기", "View job", "查看职位", "Xem tin", "求人を見る", "Lihat lowongan")}</span>
              <span className={btn}>
                <ChatCircleDots className="h-4 w-4" /> {t("회사 문의", "Contact", "联系公司", "Liên hệ", "問い合わせ", "Hubungi")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockResume({ t }: { t: PlatformT }) {
  const line = "h-2 rounded-full bg-[#E5E8EB]";
  return (
    <div className={`${CARD} mx-auto max-w-[640px] p-6 md:p-8`}>
      <div className="flex items-start gap-4">
        <div className="h-16 w-14 shrink-0 rounded-lg bg-[#EDF1FD]" />
        <div className="min-w-0">
          <p className="text-[20px] font-black text-[#191F28]">Alex Kim</p>
          <p className="text-[13px] font-semibold text-[#0B46E8]">{t("마케팅 · 해외영업", "Marketing · Global sales", "市场 · 海外销售", "Marketing · Kinh doanh quốc tế", "マーケティング · 海外営業", "Pemasaran · Penjualan global")}</p>
          <p className="mt-1 text-[12px] text-[#8B95A1]">alex.kim@example.com · Seoul</p>
        </div>
      </div>
      {[
        [t("경력", "Experience", "工作经历", "Kinh nghiệm", "職歴", "Pengalaman"), "Blue Harbor · 2023.03 – 2025.02", t("SNS 캠페인 운영으로 유입 32% 증가", "Grew traffic 32% through social campaigns", "通过社媒活动使流量增长 32%", "Tăng 32% lượt truy cập nhờ chiến dịch MXH", "SNS キャンペーンで流入 32% 増加", "Naikkan trafik 32% lewat kampanye medsos")],
        [t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan"), "Hanul University · 2019 – 2023", t("경영학 학사", "B.A. Business", "工商管理学士", "Cử nhân Quản trị", "経営学 学士", "S1 Manajemen")],
        [t("자격·어학", "Skills", "资格·语言", "Kỹ năng", "資格・語学", "Keahlian"), "TOPIK 6 · Google Analytics", ""]
      ].map(([h, a, b]) => (
        <div key={h} className="mt-6 border-t border-[#F2F4F6] pt-4">
          <p className="text-[13px] font-black text-[#191F28]">{h}</p>
          <p className="mt-2 text-[13px] font-semibold text-[#4E5968]">{a}</p>
          {b ? <p className="mt-1 text-[12.5px] text-[#6B7684]">· {b}</p> : null}
          <div className={`mt-2.5 w-4/5 ${line}`} />
          <div className={`mt-2 w-3/5 ${line}`} />
        </div>
      ))}
    </div>
  );
}

function MockCover({ t }: { t: PlatformT }) {
  return (
    <div className={`${CARD} mx-auto max-w-[640px] p-6 md:p-8`}>
      <Chip tone="blue">{t("문항 1", "Question 1", "题目 1", "Câu 1", "設問 1", "Pertanyaan 1")}</Chip>
      <p className="mt-3 text-[15px] font-black text-[#191F28]">{t("지원 동기와 입사 후 포부를 적어 주세요.", "Why this company, and what will you do here?", "请写下申请动机和入职后的抱负。", "Lý do ứng tuyển và mục tiêu sau khi vào công ty?", "志望動機と入社後の抱負を書いてください。", "Tulis motivasi melamar dan rencana setelah bergabung.")}</p>
      <p className="mt-3 break-keep text-[13.5px] leading-[1.8] text-[#4E5968]">
        {t(
          "교환학생으로 한국에 와서 처음 맡은 일은 학교 SNS 운영이었습니다. 반년 동안 게시물 반응을 분석하며 콘텐츠 방향을 바꿨고, 팔로워가 두 배로 늘었습니다. 이 경험을 바탕으로 해외 고객과 한국 브랜드를 잇는 마케터가 되고 싶습니다.",
          "My first job after coming to Korea as an exchange student was running my school's social media. Over six months I analysed engagement, changed our content direction, and doubled our followers. I want to build on that as a marketer connecting Korean brands with global customers.",
          "作为交换生来到韩国后，我的第一份工作是运营学校社交媒体。半年间我分析帖子反馈、调整内容方向，粉丝数翻了一倍。我希望以此为基础，成为连接海外客户与韩国品牌的营销人。",
          "Công việc đầu tiên khi tôi đến Hàn Quốc theo diện trao đổi là quản lý mạng xã hội của trường. Trong sáu tháng, tôi phân tích tương tác, đổi hướng nội dung và tăng gấp đôi người theo dõi. Tôi muốn trở thành marketer kết nối thương hiệu Hàn với khách hàng quốc tế.",
          "交換留学生として韓国に来て最初に任されたのは大学の SNS 運営でした。半年間反応を分析して方向性を変え、フォロワーを倍に増やしました。この経験を活かし、海外の顧客と韓国ブランドをつなぐマーケターになりたいです。",
          "Pekerjaan pertama saya sebagai mahasiswa pertukaran di Korea adalah mengelola media sosial kampus. Selama enam bulan saya menganalisis respons, mengubah arah konten, dan menggandakan pengikut. Saya ingin menjadi pemasar yang menghubungkan merek Korea dengan pelanggan global."
        )}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-[#F2F4F6] pt-3 text-[12px] text-[#8B95A1]">
        <span>412 / 500</span>
        <Chip tone="green">{t("AI 점검 완료", "AI checked", "AI 已检查", "AI đã kiểm tra", "AI チェック済み", "Sudah dicek AI")}</Chip>
      </div>
    </div>
  );
}

// 모의 면접 허브(InterviewsScreen) 마크업을 옮겨 값만 예시로 채웠다.
function MockInterview({ t }: { t: PlatformT }) {
  const jobs: [string, string][] = [
    [t("해외영업 담당자", "Global sales associate", "海外销售专员", "Nhân viên kinh doanh quốc tế", "海外営業担当", "Staf penjualan global"), "Mint Commerce"],
    [t("데이터 분석 인턴", "Data analyst intern", "数据分析实习", "Thực tập phân tích dữ liệu", "データ分析インターン", "Magang analis data"), "Orbit Mobility"]
  ];
  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("모의 면접", "Mock interviews", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}</p>
        <p className="mt-1 break-keep text-[13.5px] text-[#8B95A1]">{t("면접 볼 공고나 내 서류로 연습하고 AI 피드백을 받아요.", "Practice with a job you're interviewing for or with your own documents, and get AI feedback.", "用要面试的职位或自己的材料练习，并获得 AI 反馈。", "Luyện với tin tuyển dụng sắp phỏng vấn hoặc hồ sơ của bạn, nhận phản hồi AI.", "面接を受ける求人や自分の書類で練習し、AIフィードバックを受けましょう。", "Latihan dengan lowongan yang akan diwawancara atau dokumenmu, dapat masukan AI.")}</p>
      </div>
      <div className="flex items-center gap-3.5 rounded-2xl bg-[#FFF3E6] p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#E8890C]">
          <CalendarCheck className="h-5 w-5" weight="fill" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold text-[#E8890C]">{t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} D-3</p>
          <p className="mt-0.5 truncate text-[14.5px] font-bold text-[#191F28]">{t("마케팅 매니저", "Marketing manager", "市场经理", "Quản lý marketing", "マーケティングマネージャー", "Manajer pemasaran")}</p>
          <p className="truncate text-[12.5px] text-[#8B95A1]">Blue Harbor</p>
        </div>
        <span className="shrink-0 rounded-xl bg-[#E8890C] px-3.5 py-2.5 text-[13px] font-bold text-white">{t("연습하기", "Practice", "去练习", "Luyện", "練習する", "Latihan")}</span>
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">{t("연습 시작하기", "Start practicing", "开始练习", "Bắt đầu luyện", "練習を始める", "Mulai latihan")}</p>
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0B46E8] shadow-[0_2px_10px_rgba(11,70,232,0.1)]">
            <FileText className="h-5 w-5" weight="fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-[#191F28]">{t("내 서류로 연습", "Practice with my documents", "用我的材料练习", "Luyện từ hồ sơ của tôi", "自分の書類で練習", "Latihan dari dokumenku")}</p>
            <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("이력서·자기소개서에서 나올 만한 질문을 풀어요.", "Answer questions likely to come from your resume and cover letter.", "回答可能来自简历和自我介绍的问题。", "Trả lời câu hỏi có thể đến từ CV và thư giới thiệu.", "履歴書・自己PRから出そうな質問に答えます。", "Jawab pertanyaan yang mungkin muncul dari CV dan surat lamaran.")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
          <p className="text-[14.5px] font-bold text-[#191F28]">{t("공고로 연습", "Practice for a job", "按职位练习", "Luyện theo tin tuyển dụng", "求人で練習", "Latihan untuk lowongan")}</p>
          <ul className="mt-2 flex flex-col">
            {jobs.map(([title, co]) => (
              <li key={co} className="flex items-center gap-3 border-t border-[#F2F4F6] py-3 first:border-t-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[#191F28]">{title}</p>
                  <p className="truncate text-[12.5px] text-[#8B95A1]">{co}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">{t("연습", "Practice", "练习", "Luyện", "練習", "Latihan")}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MockDashboard({ t }: { t: PlatformT }) {
  const docs: [string, number][] = [
    [t("이력서", "Resume", "简历", "CV", "履歴書", "CV"), 80],
    [t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己PR", "Surat lamaran"), 45],
    [t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Simulasi wawancara"), 20]
  ];
  return (
    <div className="space-y-3">
      <div className={`${CARD} p-5`}>
        <p className="text-[12px] font-bold text-[#0B46E8]">{t("이번 주 할 일", "This week", "本周任务", "Việc tuần này", "今週のやること", "Minggu ini")}</p>
        <p className="mt-1.5 text-[16px] font-black text-[#191F28]">{t("자기소개서 2번 문항을 마무리해 보세요", "Finish question 2 of your cover letter", "完成自我介绍第 2 题", "Hoàn thành câu 2 của thư giới thiệu", "自己PRの設問 2 を仕上げましょう", "Selesaikan pertanyaan 2 surat lamaran")}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {docs.map(([label, pct]) => (
          <div key={label} className={`${CARD} p-4`}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#191F28]">{label}</p>
              <span className="text-[12.5px] font-bold text-[#0B46E8]">{pct}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[#F2F4F6]">
              <div className="h-2 rounded-full bg-[#0B46E8]" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className={`${CARD} flex items-center gap-3.5 p-4`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">M</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-bold text-[#191F28]">{t("추천 공고 · 해외영업", "Recommended · Global sales", "推荐职位 · 海外销售", "Gợi ý · Kinh doanh quốc tế", "おすすめ · 海外営業", "Rekomendasi · Penjualan global")}</p>
          <p className="truncate text-[12.5px] text-[#8B95A1]">Mint Commerce · Seoul</p>
        </div>
        <Chip tone="blue">{t("적합도 높음", "Good fit", "匹配度高", "Rất phù hợp", "適合度 高", "Sangat cocok")}</Chip>
      </div>
      <div className={`${CARD} flex items-center gap-3.5 p-4`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">O</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14.5px] font-bold text-[#191F28]">{t("추천 공고 · 데이터 분석", "Recommended · Data analyst", "推荐职位 · 数据分析", "Gợi ý · Phân tích dữ liệu", "おすすめ · データ分析", "Rekomendasi · Analis data")}</p>
          <p className="truncate text-[12.5px] text-[#8B95A1]">Orbit Mobility · Pangyo</p>
        </div>
        <Chip tone="gray">{t("마감 D-5", "Closes in 5d", "截止 D-5", "Còn 5 ngày", "締切 D-5", "Tutup 5 hari")}</Chip>
      </div>
    </div>
  );
}

function Mock({ kind, t }: { kind: Kind; t: PlatformT }) {
  if (kind === "home") return <MockHome t={t} />;
  if (kind === "career") return <MockCareer t={t} />;
  if (kind === "resume") return <MockResume t={t} />;
  if (kind === "cover") return <MockCover t={t} />;
  if (kind === "interview") return <MockInterview t={t} />;
  if (kind === "applications") return <MockApplications t={t} />;
  return <MockDashboard t={t} />;
}

export function TalentLockedPreview() {
  const t = usePlatformT();
  const path = usePathname() ?? "";
  const { title, desc } = metaFor(path, t);
  const kind = kindFor(path);
  const next = encodeURIComponent(typeof window === "undefined" ? path : window.location.pathname + window.location.search);

  return (
    <div className="flex min-h-screen flex-col bg-[#FAFBFC]">
      <TalentHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 pt-5 md:px-6 md:pb-12 md:pt-7">
        {OWN_HEADER.includes(kind) ? (
          // 목업이 실제 화면 머리말을 그리므로 제목은 화면 읽기 프로그램용으로만 둔다.
          <h1 className="sr-only">{title}</h1>
        ) : (
          <>
            <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#191F28]">{title}</h1>
            <p className="mt-1 break-keep text-[14px] leading-relaxed text-[#6B7684]">{desc}</p>
          </>
        )}

        {/* 위 절반은 목업이 보이고, 아래 절반은 배경색으로 덮인다. 로그인 카드는 덮인 쪽으로 끌어올린다 —
            목업 길이가 화면마다 달라도 늘 덮인 자리에 놓이게(높이 고정이면 짧은 목업 아래가 텅 빈다). */}
        <div className={`relative max-h-[560px] overflow-hidden ${OWN_HEADER.includes(kind) ? "" : "mt-6"}`}>
          <div aria-hidden inert className="pointer-events-none select-none">
            <Mock kind={kind} t={t} />
          </div>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent from-30% via-[#FAFBFC]/90 via-55% to-[#FAFBFC] to-80%" />
        </div>

        <div className="relative -mt-44 flex justify-center px-1">
            <div className="w-full max-w-[360px] rounded-3xl bg-white px-6 pb-6 pt-7 text-center shadow-[0_20px_60px_rgba(11,18,39,0.12)] ring-1 ring-[#EEF1F5]">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]">
                <Lock className="h-5 w-5" weight="fill" />
              </span>
              <h2 className="mt-3.5 text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">
                {t("로그인하면 볼 수 있어요", "Log in to see this page", "登录后即可查看", "Đăng nhập để xem", "ログインすると見られます", "Masuk untuk melihat")}
              </h2>
              <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#8B95A1]">
                {t("내 정보로 채워지는 화면이라 로그인이 필요해요.", "This page shows your own information, so you need to log in.", "此页面显示你的个人信息，需要登录。", "Trang này hiển thị thông tin của bạn nên cần đăng nhập.", "あなたの情報を表示するため、ログインが必要です。", "Halaman ini berisi data kamu, jadi perlu masuk.")}
                <br />
                {t("가입은 무료예요.", "Signing up is free.", "注册免费。", "Đăng ký miễn phí.", "登録は無料です。", "Daftar gratis.")}
              </p>
              <Link href={`${talentRoutes.login}?next=${next}`} className="mt-5 flex h-12 w-full items-center justify-center rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]">
                {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
              </Link>
              <Link href={`${talentRoutes.signup}?next=${next}`} className="mt-2 flex h-11 w-full items-center justify-center rounded-2xl text-[14px] font-semibold text-[#4E5968] transition hover:bg-[#F6F8FB]">
                {t("무료로 가입하기", "Sign up free", "免费注册", "Đăng ký miễn phí", "無料で登録", "Daftar gratis")}
              </Link>
            </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}

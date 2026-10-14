"use client";

// 첫 취업 준비생을 위한 홈 구획 셋 — 로그인 홈·로그인 전 홈이 함께 쓴다.
//  - RoleQuizCard/RoleQuizSheet: 1분 직무 찾기(질문 5개 → 맞는 직무 셋 → 관심 직무로 저장)
//  - ExperienceStarter: 경험 꺼내기(종류 고르고 한 줄 → 이력서에 바로 넣기)
//  - JuniorJobs: 신입·인턴 환영 공고(제목에 신입·인턴·경력 무관이 있는 최신 공고)
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sheet } from "./sheets";
import { Button, Row, RowsSkeleton, Section } from "./ui";
import { companyOf, jobPhotoOf } from "./lib";
import { useLanguage } from "../i18n/LanguageProvider";
import { type PlatformT } from "../../lib/i18n";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";
import { saveJobInterests, useJobInterests } from "../../lib/talent/job-interest";
import { jobTaxonomyLabelOf } from "../../lib/talent/job-taxonomy-labels";
import { addResumeItem, saveResumeDoc, useResumeDoc, type ResumeDoc } from "../../lib/talent/resume-doc";
import type { CareerSection } from "../../lib/talent/career-chat";
import { JUNIOR_TITLE } from "./screens/V2CareerScreen";

// ── 1분 직무 찾기 ─────────────────────────────
// 직무 묶음(표준 직무 분류의 대분류) → 대표 소분류(관심 직무로 저장되는 값)·관련 가이드 글.
type Family = "dev" | "data" | "design" | "plan" | "marketing" | "sales" | "cs" | "biz" | "trade" | "media" | "hr" | "finance";
const FAMILY: Record<Family, { role: string; guide?: string; emoji: string }> = {
  dev: { role: "웹 개발", guide: "software-developer", emoji: "💻" },
  data: { role: "데이터 분석가", emoji: "📊" },
  design: { role: "UX 디자이너", guide: "designer-portfolio", emoji: "🎨" },
  plan: { role: "서비스 기획", guide: "product-manager", emoji: "📝" },
  marketing: { role: "콘텐츠 마케팅", guide: "marketer", emoji: "📣" },
  sales: { role: "해외 영업", emoji: "🤝" },
  cs: { role: "고객 경험(CX)", emoji: "💬" },
  biz: { role: "운영 매니저", emoji: "🗂️" },
  trade: { role: "무역/수출입", emoji: "🚢" },
  media: { role: "콘텐츠 에디터", emoji: "🎬" },
  hr: { role: "채용(리크루터)", emoji: "🧑‍💼" },
  finance: { role: "회계", emoji: "💰" }
};

function familyBlurb(t: PlatformT, f: Family): string {
  switch (f) {
    case "dev": return t("문제를 코드로 풀어 서비스를 만들어요", "Build services by solving problems with code", "用代码解决问题、打造服务", "Giải quyết vấn đề bằng code", "コードで問題を解きサービスを作る", "Membangun layanan dengan kode");
    case "data": return t("숫자와 자료에서 답을 찾아요", "Find answers in numbers and data", "从数字和数据中找答案", "Tìm câu trả lời từ dữ liệu", "数字とデータから答えを探す", "Mencari jawaban dari data");
    case "design": return t("쓰기 편한 화면과 경험을 그려요", "Design screens that are easy to use", "设计好用的界面和体验", "Thiết kế giao diện dễ dùng", "使いやすい画面と体験をデザイン", "Merancang tampilan yang mudah");
    case "plan": return t("무엇을 왜 만들지 정하고 사람들을 이어요", "Decide what to build and why, and connect people", "决定做什么、为什么做，并串联团队", "Quyết định làm gì, vì sao và kết nối mọi người", "何をなぜ作るか決め、人をつなぐ", "Menentukan apa dan mengapa dibuat");
    case "marketing": return t("사람들이 알게 하고 좋아하게 만들어요", "Get people to know and love a product", "让人们了解并喜欢产品", "Làm mọi người biết và yêu sản phẩm", "知ってもらい好きになってもらう", "Membuat orang kenal dan suka");
    case "sales": return t("사람을 만나 설득하고 거래를 만들어요", "Meet people, persuade, and close deals", "与人见面、说服并促成交易", "Gặp gỡ, thuyết phục và chốt đơn", "人に会い説得して取引をつくる", "Bertemu, membujuk, dan menutup transaksi");
    case "cs": return t("고객의 불편을 듣고 해결해요", "Listen to customers and solve problems", "倾听并解决客户的不便", "Lắng nghe và giải quyết cho khách", "お客様の困りごとを聞いて解決", "Mendengar dan menyelesaikan keluhan");
    case "biz": return t("조직이 잘 굴러가도록 챙겨요", "Keep the organization running smoothly", "让组织顺利运转", "Giữ tổ chức vận hành trơn tru", "組織がうまく回るよう支える", "Menjaga organisasi berjalan lancar");
    case "trade": return t("나라와 나라 사이 물건을 오가게 해요", "Move goods between countries", "让货物在国与国之间流通", "Đưa hàng hóa qua lại giữa các nước", "国と国の間でモノを動かす", "Memindahkan barang antarnegara");
    case "media": return t("글·영상으로 이야기를 전해요", "Tell stories with words and video", "用文字和视频讲故事", "Kể chuyện bằng chữ và video", "文章・映像で物語を伝える", "Bercerita lewat tulisan dan video");
    case "hr": return t("좋은 사람을 찾고 함께 일하기 좋게 만들어요", "Find great people and make work better", "寻找人才、营造好的工作环境", "Tìm người giỏi và tạo môi trường tốt", "良い人を見つけ働きやすくする", "Mencari orang hebat");
    case "finance": return t("돈의 흐름을 정확하게 기록하고 살펴요", "Track and review the flow of money", "准确记录和检查资金流向", "Ghi chép và theo dõi dòng tiền", "お金の流れを正確に記録し見る", "Mencatat aliran uang dengan tepat");
  }
}

type Q = { q: string; options: { label: string; pts: Family[] }[] };
function quizQuestions(t: PlatformT): Q[] {
  return [
    {
      q: t("어떤 일을 할 때 시간 가는 줄 몰라요?", "When do you lose track of time?", "做什么事时会忘记时间？", "Bạn quên thời gian khi làm gì?", "どんなことをしていると時間を忘れますか？", "Kapan kamu lupa waktu?"),
      options: [
        { label: t("무언가 만들고 고칠 때", "Making or fixing things", "做东西或修东西", "Làm hoặc sửa đồ", "何かを作ったり直したり", "Membuat atau memperbaiki"), pts: ["dev", "design"] },
        { label: t("사람 만나고 이야기할 때", "Meeting and talking with people", "与人见面聊天", "Gặp gỡ, trò chuyện", "人に会って話すとき", "Bertemu dan mengobrol"), pts: ["sales", "hr", "cs"] },
        { label: t("숫자·자료를 정리할 때", "Organizing numbers and data", "整理数字和资料", "Sắp xếp số liệu", "数字・資料を整理するとき", "Merapikan angka dan data"), pts: ["data", "finance", "biz"] },
        { label: t("글이나 영상으로 표현할 때", "Expressing with words or video", "用文字或视频表达", "Thể hiện bằng chữ, video", "文章や映像で表現するとき", "Berekspresi lewat tulisan/video"), pts: ["marketing", "media"] }
      ]
    },
    {
      q: t("팀 과제에서 나는 주로…", "In team projects, I usually…", "团队作业中，我通常…", "Trong bài nhóm, tôi thường…", "グループ課題では主に…", "Dalam tugas kelompok, aku biasanya…"),
      options: [
        { label: t("계획 세우고 역할을 나눠요", "Plan and split roles", "制定计划、分配角色", "Lên kế hoạch, chia việc", "計画を立て役割を分ける", "Merencanakan dan membagi peran"), pts: ["plan", "biz"] },
        { label: t("자료를 찾고 분석해요", "Research and analyze", "查找并分析资料", "Tìm và phân tích tài liệu", "資料を探して分析する", "Mencari dan menganalisis"), pts: ["data", "marketing"] },
        { label: t("발표하고 사람들을 설득해요", "Present and persuade", "做展示、说服别人", "Thuyết trình, thuyết phục", "発表して説得する", "Presentasi dan membujuk"), pts: ["sales", "hr"] },
        { label: t("결과물을 직접 만들어요", "Build the deliverable", "亲手做出成果", "Tự tay làm sản phẩm", "成果物を自分で作る", "Membuat hasilnya"), pts: ["design", "dev", "media"] }
      ]
    },
    {
      q: t("더 끌리는 결과는?", "Which result excites you more?", "哪种成果更吸引你？", "Kết quả nào hấp dẫn hơn?", "より惹かれる成果は？", "Hasil mana yang lebih menarik?"),
      options: [
        { label: t("사람들이 매일 쓰는 앱·서비스", "An app people use every day", "人们每天用的应用或服务", "App mọi người dùng mỗi ngày", "毎日使われるアプリ・サービス", "Aplikasi yang dipakai tiap hari"), pts: ["dev", "plan", "design"] },
        { label: t("숫자로 보이는 성과", "Results you can see in numbers", "能用数字看到的成果", "Kết quả đo bằng con số", "数字で見える成果", "Hasil yang terlihat dalam angka"), pts: ["marketing", "sales", "data"] },
        { label: t("잘 굴러가는 조직과 절차", "A team and process that run well", "运转顺畅的组织和流程", "Tổ chức, quy trình vận hành tốt", "うまく回る組織と手順", "Tim dan proses yang lancar"), pts: ["biz", "hr", "finance", "trade"] },
        { label: t("많은 사람이 보는 콘텐츠", "Content many people see", "很多人看的内容", "Nội dung nhiều người xem", "多くの人が見るコンテンツ", "Konten yang dilihat banyak orang"), pts: ["media", "marketing"] }
      ]
    },
    {
      q: t("외국어를 쓰는 일은?", "Using foreign languages at work?", "工作中使用外语？", "Dùng ngoại ngữ khi làm việc?", "外国語を使う仕事は？", "Memakai bahasa asing saat kerja?"),
      options: [
        { label: t("매일 쓰고 싶어요", "I want to use them daily", "想每天都用", "Muốn dùng mỗi ngày", "毎日使いたい", "Ingin setiap hari"), pts: ["sales", "trade", "cs"] },
        { label: t("가끔이면 좋아요", "Sometimes is nice", "偶尔用就好", "Thỉnh thoảng thì tốt", "時々なら良い", "Kadang-kadang saja"), pts: ["marketing", "plan"] },
        { label: t("상관없어요", "Doesn't matter", "无所谓", "Không quan trọng", "どちらでも", "Tidak masalah"), pts: ["dev", "data", "finance", "design"] }
      ]
    },
    {
      q: t("나에게 맞는 일하는 방식은?", "Which way of working suits you?", "哪种工作方式适合你？", "Cách làm việc nào hợp với bạn?", "自分に合う働き方は？", "Cara kerja yang cocok?"),
      options: [
        { label: t("혼자 깊이 파고들기", "Diving deep on my own", "独自深入钻研", "Tự mình đào sâu", "一人で深く掘り下げる", "Mendalami sendiri"), pts: ["dev", "data", "finance", "design"] },
        { label: t("여러 사람과 함께 맞추기", "Coordinating with many people", "与很多人协作", "Phối hợp với nhiều người", "多くの人と合わせる", "Berkoordinasi dengan banyak orang"), pts: ["plan", "hr", "biz", "cs"] },
        { label: t("밖에서 사람 만나기", "Meeting people outside", "在外面见人", "Ra ngoài gặp người", "外で人に会う", "Bertemu orang di luar"), pts: ["sales", "trade"] },
        { label: t("새 아이디어 실험하기", "Testing new ideas", "尝试新想法", "Thử ý tưởng mới", "新しいアイデアを試す", "Menguji ide baru"), pts: ["marketing", "media"] }
      ]
    }
  ];
}

/** 홈 입구 카드 — 아직 관심 직무가 없을 때. */
export function RoleQuizCard({ t, onOpen }: { t: PlatformT; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 rounded-3xl bg-[#f3eeff] p-5 text-left transition hover:-translate-y-0.5">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[28px]" aria-hidden>
        🧭
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t("나에게 맞는 직무, 1분이면 찾아요", "Find your role in a minute", "1 分钟找到适合的职位", "Tìm nghề hợp trong 1 phút", "自分に合う職種を1分で", "Temukan peranmu dalam 1 menit")}</span>
        <span className="mt-1 block text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{t("질문 5개에 답하면 어울리는 직무 셋을 골라 드려요", "Answer 5 questions to get 3 roles that fit", "回答 5 个问题，推荐 3 个适合的职位", "Trả lời 5 câu để có 3 nghề phù hợp", "5つの質問に答えると合う職種を3つ", "Jawab 5 pertanyaan, dapat 3 peran")}</span>
      </span>
      <span className="shrink-0 text-[20px] text-[#6d28d9]/60" aria-hidden>
        ›
      </span>
    </button>
  );
}

/** 직무 찾기 — 한 문항씩, 끝나면 맞는 직무 셋. 로그인했으면 관심 직무로 저장, 아니면 가입으로. */
export function RoleQuizSheet({ t, authed, onClose }: { t: PlatformT; authed: boolean; onClose: () => void }) {
  const qs = quizQuestions(t);
  const interests = useJobInterests();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<Partial<Record<Family, number>>>({});
  const [saved, setSaved] = useState(false);
  const done = step >= qs.length;
  const top = (Object.entries(score) as [Family, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([f]) => f);
  const pick = (pts: Family[]) => {
    setScore((s) => {
      const n = { ...s };
      for (const f of pts) n[f] = (n[f] ?? 0) + 1;
      return n;
    });
    setStep((x) => x + 1);
  };
  const save = () => {
    saveJobInterests([...new Set([...interests, ...top.map((f) => FAMILY[f].role)])]);
    setSaved(true);
  };
  const signup = `/talent/signup?next=${encodeURIComponent("/v2/home")}`;

  return (
    <Sheet
      tall
      title={t("1분 직무 찾기", "Find your role", "1 分钟找职位", "Tìm nghề 1 phút", "1分職種診断", "Cari peran 1 menit")}
      subtitle={done ? t("이런 직무가 잘 맞아 보여요", "These roles look like a good fit", "这些职位看起来很适合你", "Những nghề này có vẻ hợp", "こんな職種が合いそうです", "Peran ini tampak cocok") : `${step + 1} / ${qs.length}`}
      onClose={onClose}
      footer={
        done ? (
          authed ? (
            saved ? (
              <Button full href="/v2/jobs?tab=interest">
                {t("맞는 공고 보러 가기", "See matching jobs", "查看匹配职位", "Xem việc phù hợp", "合う求人を見る", "Lihat lowongan cocok")}
              </Button>
            ) : (
              <Button full onClick={save}>
                {t("관심 직무로 저장하기", "Save as my interests", "保存为感兴趣的职位", "Lưu làm nghề quan tâm", "関心職種に保存", "Simpan sebagai minat")}
              </Button>
            )
          ) : (
            <Button full href={signup}>
              {t("가입하고 맞춤 공고 받기", "Sign up for matching jobs", "注册获取匹配职位", "Đăng ký để nhận việc phù hợp", "登録して合う求人を受け取る", "Daftar untuk lowongan cocok")}
            </Button>
          )
        ) : undefined
      }
    >
      {!done ? (
        <div>
          <div className="flex gap-1" aria-hidden>
            {qs.map((_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-[#6d28d9]" : i === step ? "bg-[#c4b5fd]" : "bg-[color:var(--v2-band)]"}`} />
            ))}
          </div>
          <p className="mt-6 text-[22px] font-bold leading-[1.4] tracking-[-0.02em] text-[color:var(--v2-ink)]">{qs[step].q}</p>
          <div className="mt-5 flex flex-col gap-2.5">
            {qs[step].options.map((o) => (
              <button key={o.label} type="button" onClick={() => pick(o.pts)} className="flex min-h-[56px] items-center rounded-2xl bg-[color:var(--v2-band)] px-5 text-left text-[16px] font-semibold text-[color:var(--v2-ink-2)] transition hover:bg-[#f3eeff] hover:text-[#6d28d9] active:scale-[0.99]">
                {o.label}
              </button>
            ))}
          </div>
          {step > 0 ? (
            <button type="button" onClick={() => { setStep(0); setScore({}); }} className="mt-4 text-[14px] font-semibold text-[color:var(--v2-faint)]">
              {t("처음부터 다시", "Start over", "重新开始", "Làm lại", "最初から", "Ulangi")}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {top.map((f, i) => (
            <div key={f} className={`rounded-3xl p-5 ${i === 0 ? "bg-[#f3eeff]" : "bg-[color:var(--v2-band)]"}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[22px]" aria-hidden>
                  {FAMILY[f].emoji}
                </span>
                <span className="min-w-0 flex-1">
                  {i === 0 ? <span className="block text-[12px] font-bold text-[#6d28d9]">{t("가장 잘 맞아요", "Best match", "最匹配", "Hợp nhất", "いちばん合う", "Paling cocok")}</span> : null}
                  <span className="block truncate text-[17px] font-bold text-[color:var(--v2-ink)]">{jobTaxonomyLabelOf(t, FAMILY[f].role)}</span>
                </span>
              </div>
              <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{familyBlurb(t, f)}</p>
              {FAMILY[f].guide ? (
                <Link href={`/v2/guide/${FAMILY[f].guide}`} className="mt-2 inline-block text-[14px] font-semibold text-[color:var(--v2-accent)]">
                  {t("이 직무 더 알아보기", "Learn more about this role", "进一步了解该职位", "Tìm hiểu thêm", "この職種をもっと知る", "Pelajari peran ini")} ›
                </Link>
              ) : null}
            </div>
          ))}
          {saved ? <p className="text-center text-[14px] font-semibold text-[color:var(--v2-good)]">✓ {t("관심 직무에 넣었어요", "Added to your interests", "已加入感兴趣的职位", "Đã thêm vào nghề quan tâm", "関心職種に追加しました", "Ditambahkan ke minat")}</p> : null}
          <button type="button" onClick={() => { setStep(0); setScore({}); setSaved(false); }} className="text-[14px] font-semibold text-[color:var(--v2-faint)]">
            {t("다시 해 보기", "Try again", "再试一次", "Thử lại", "もう一度", "Coba lagi")}
          </button>
        </div>
      )}
    </Sheet>
  );
}

// ── 경험 꺼내기 ─────────────────────────────
type Kind = { section: CareerSection; emoji: string; label: (t: PlatformT) => string; hint: (t: PlatformT) => string };
const KINDS: Kind[] = [
  { section: "experience", emoji: "🧩", label: (t) => t("알바·인턴", "Part-time/Intern", "兼职·实习", "Làm thêm/Thực tập", "バイト・インターン", "Paruh waktu/Magang"), hint: (t) => t("예) 카페 알바 1년 — 주말 마감을 맡아 재고 정리 방식을 바꿨어요", "e.g. Café job, 1 yr — ran weekend closing and improved stock checks", "例）咖啡店兼职1年——负责周末打烊，改进了库存整理", "VD: Làm quán cà phê 1 năm — phụ trách đóng ca cuối tuần", "例）カフェバイト1年 — 週末の締めを担当し在庫整理を改善", "Cth: Kafe 1 tahun — tutup toko akhir pekan") },
  { section: "project", emoji: "🚀", label: (t) => t("프로젝트·과제", "Project", "项目·作业", "Dự án", "プロジェクト・課題", "Proyek"), hint: (t) => t("예) 4명 팀 과제 — 설문을 맡아 120명 응답을 모았어요", "e.g. Team of 4 — ran the survey and gathered 120 responses", "例）4人小组作业——负责问卷，收集了120份回答", "VD: Nhóm 4 người — làm khảo sát, thu 120 phản hồi", "例）4人のグループ課題 — アンケートで120件の回答を集めた", "Cth: Tim 4 orang — survei 120 responden") },
  { section: "activity", emoji: "🌱", label: (t) => t("동아리·봉사", "Club/Volunteer", "社团·志愿", "CLB/Tình nguyện", "サークル・ボランティア", "Organisasi"), hint: (t) => t("예) 유학생 동아리 홍보 담당 — 인스타 계정을 운영했어요", "e.g. Student club PR — ran the Instagram account", "例）留学生社团宣传负责人——运营 Instagram 账号", "VD: Phụ trách truyền thông CLB — quản lý Instagram", "例）留学生サークル広報 — インスタを運営", "Cth: Humas klub — mengelola Instagram") },
  { section: "award", emoji: "🏆", label: (t) => t("공모전·수상", "Contest/Award", "比赛·获奖", "Cuộc thi/Giải", "コンテスト・受賞", "Lomba/Penghargaan"), hint: (t) => t("예) 교내 아이디어 공모전 장려상 — 팀장으로 기획을 맡았어요", "e.g. Campus idea contest, honorable mention — led planning", "例）校内创意比赛鼓励奖——作为组长负责策划", "VD: Giải khuyến khích cuộc thi ý tưởng — trưởng nhóm", "例）学内アイデアコンテスト奨励賞 — リーダーとして企画", "Cth: Juara harapan lomba ide — ketua tim") },
  { section: "certificate", emoji: "📜", label: (t) => t("자격증·어학", "Certificate", "证书·语言", "Chứng chỉ", "資格・語学", "Sertifikat"), hint: (t) => t("예) TOPIK 5급 / 컴퓨터활용능력 2급", "e.g. TOPIK Level 5 / Excel certificate", "例）TOPIK 5级 / 计算机应用能力2级", "VD: TOPIK 5 / chứng chỉ tin học", "例）TOPIK 5級 / パソコン検定", "Cth: TOPIK 5 / sertifikat komputer") }
];

/** 홈 카드 — 이력서가 거의 비어 있을 때. 종류 버튼을 누르면 한 줄 쓰기 시트. */
export function ExperienceStarter({ t }: { t: PlatformT }) {
  const [kind, setKind] = useState<Kind | null>(null);
  return (
    <div className="rounded-3xl bg-[#e8f8f1] p-5">
      <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{t("알바·동아리·과제도 경험이에요", "Part-time jobs, clubs and projects count", "兼职、社团、作业都是经验", "Làm thêm, CLB, bài tập đều là kinh nghiệm", "バイト・サークル・課題も経験です", "Paruh waktu, organisasi, tugas itu pengalaman")}</p>
      <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{t("하나만 골라 한 줄로 적으면 이력서에 바로 들어가요", "Pick one and write a line — it goes straight into your resume", "选一个写一句话，直接放进简历", "Chọn một, viết một dòng — vào CV ngay", "一つ選んで一行書けば履歴書にすぐ入ります", "Pilih satu, tulis satu baris — langsung masuk CV")}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button key={k.section} type="button" onClick={() => setKind(k)} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3.5 text-[14px] font-semibold text-[color:var(--v2-ink-2)] transition hover:text-[color:var(--v2-good)]">
            <span aria-hidden>{k.emoji}</span>
            {k.label(t)}
          </button>
        ))}
      </div>
      {kind ? <ExperienceSheet t={t} kind={kind} onClose={() => setKind(null)} /> : null}
    </div>
  );
}

function ExperienceSheet({ t, kind, onClose }: { t: PlatformT; kind: Kind; onClose: () => void }) {
  const resume = useResumeDoc();
  const [where, setWhere] = useState("");
  const [what, setWhat] = useState("");
  const [done, setDone] = useState(false);
  const withPlace = kind.section !== "certificate";
  const save = () => {
    const base: ResumeDoc = resume ?? { targetRole: "", items: [], createdAt: Date.now(), updatedAt: Date.now() };
    const text = kind.section === "experience" ? what.trim() : [where.trim(), what.trim()].filter(Boolean).join(" — ");
    const next = addResumeItem(base, kind.section, text, "", "", kind.section === "experience" ? where : "").doc;
    saveResumeDoc(next, { label: t("홈에서 경험 추가", "Added from home", "从首页添加经验", "Thêm từ trang chủ", "ホームから経験を追加", "Ditambah dari beranda") });
    setDone(true);
  };
  return (
    <Sheet
      title={`${kind.emoji} ${kind.label(t)}`}
      subtitle={done ? undefined : t("짧아도 괜찮아요. 나중에 이력서에서 다듬을 수 있어요.", "Short is fine — you can polish it later in your resume.", "简短也没关系，之后可在简历中润色。", "Ngắn cũng được, sửa sau trong CV.", "短くても大丈夫。あとで履歴書で整えられます。", "Singkat tidak apa, bisa dirapikan nanti.")}
      onClose={onClose}
      footer={
        done ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="neutral" full onClick={onClose}>
              {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
            </Button>
            <Button full href="/v2/resume">
              {t("이력서에서 다듬기", "Polish in resume", "在简历中润色", "Sửa trong CV", "履歴書で整える", "Rapikan di CV")}
            </Button>
          </div>
        ) : (
          <Button full onClick={save} disabled={!what.trim()}>
            {t("이력서에 넣기", "Add to resume", "放进简历", "Thêm vào CV", "履歴書に入れる", "Masukkan ke CV")}
          </Button>
        )
      }
    >
      {done ? (
        <div className="py-6 text-center">
          <p className="text-[40px]" aria-hidden>
            🎉
          </p>
          <p className="mt-2 text-[18px] font-bold text-[color:var(--v2-ink)]">{t("이력서에 넣었어요", "Added to your resume", "已放进简历", "Đã thêm vào CV", "履歴書に入れました", "Sudah masuk CV")}</p>
          <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">{t("이렇게 하나씩 쌓으면 이력서가 금방 채워져요.", "Add one at a time and your resume fills up fast.", "一个个积累，简历很快就满了。", "Thêm từng cái, CV sẽ đầy nhanh.", "一つずつ積めば履歴書はすぐ埋まります。", "Tambah satu per satu, CV cepat penuh.")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {withPlace ? (
            <label className="block">
              <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{t("어디서", "Where", "在哪里", "Ở đâu", "どこで", "Di mana")}</span>
              <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder={t("예) ○○카페, ○○대학교 동아리", "e.g. a café, a campus club", "例）某咖啡店、某大学社团", "VD: quán cà phê, CLB trường", "例）○○カフェ、○○大学サークル", "Cth: kafe, klub kampus")} className="h-12 w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:bg-white focus:ring-2" />
            </label>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{withPlace ? t("무엇을 했고 어떻게 됐나요?", "What did you do, and what came of it?", "做了什么？结果如何？", "Bạn đã làm gì, kết quả ra sao?", "何をして、どうなりましたか？", "Apa yang kamu lakukan dan hasilnya?") : t("자격증·어학 이름", "Certificate name", "证书·语言名称", "Tên chứng chỉ", "資格・語学名", "Nama sertifikat")}</span>
            <textarea value={what} onChange={(e) => setWhat(e.target.value)} rows={withPlace ? 4 : 2} placeholder={kind.hint(t)} className="w-full resize-none rounded-2xl bg-[color:var(--v2-fill)] p-4 text-[16px] leading-[1.6] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:bg-white focus:ring-2" />
          </label>
        </div>
      )}
    </Sheet>
  );
}

// ── 신입·인턴 환영 공고 ─────────────────────────────
/** 제목에 신입·인턴·경력 무관이 있는 최신 공고 넷. */
export function JuniorJobs({ t, signupHint = false }: { t: PlatformT; signupHint?: boolean }) {
  const { locale } = useLanguage();
  const [items, setItems] = useState<PublicPositionListItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    getPublicPositionsPage({ limit: 100, sort: "latest", locale })
      .then((p) => alive && setItems(p.items.filter((j) => JUNIOR_TITLE.test(j.title)).slice(0, 4)))
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, [locale]);
  if (items && !items.length) return null;
  return (
    <Section title={t("신입·인턴 환영 공고", "Entry-level & intern jobs", "欢迎新人·实习生的职位", "Việc cho người mới & thực tập", "新卒・インターン歓迎の求人", "Lowongan pemula & magang")}>
      <p className="pb-1 text-[14px] text-[color:var(--v2-muted)]">{t("경력이 없어도 지원할 수 있는 공고예요.", "Jobs you can apply to without experience.", "没有经验也能申请的职位。", "Việc không cần kinh nghiệm.", "経験がなくても応募できる求人です。", "Bisa dilamar tanpa pengalaman.")}</p>
      {items === null ? (
        <RowsSkeleton count={4} />
      ) : (
        items.map((j) => <Row key={j.id} href={`/v2/jobs/${j.id}`} thumb={{ src: jobPhotoOf(j), fallback: companyOf(j) || j.title }} title={j.title} meta={[companyOf(j), (j.workLocation || "").split(" ").slice(0, 2).join(" ")].filter(Boolean).join(" · ") || undefined} />)
      )}
      <div className="mt-3">
        <Button variant="neutral" full href={signupHint ? `/talent/signup?next=${encodeURIComponent("/v2/home")}` : "/v2/jobs"}>
          {signupHint ? t("가입하고 맞춤 공고 받기", "Sign up for matching jobs", "注册获取匹配职位", "Đăng ký nhận việc phù hợp", "登録して合う求人を受け取る", "Daftar untuk lowongan cocok") : t("더 보기", "See more", "查看更多", "Xem thêm", "もっと見る", "Lihat lagi")}
        </Button>
      </div>
    </Section>
  );
}

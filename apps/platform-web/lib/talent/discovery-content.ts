// "처음 시작하기 = 나를 알아가는" 자기 발견 페이지 콘텐츠.
// 진단/점수가 아니라, 답을 모으면 "관심 직무 방향 · 강점 · 정리할 경험"을 부드럽게 도출한다.
import type { PlatformT } from "../i18n";

// 각 선택지는 강점 태그를 가진다 → 마지막에 합산해 상위 강점 3개를 뽑는다.
// strengths 는 합산/매칭에 쓰이는 KEY 이므로 번역하지 않는다(한국어 그대로 유지).
export interface DiscoveryOption {
  label: string;
  strengths: string[];
}
export interface DiscoveryQuestion {
  key: string;
  question: string;
  helper?: string;
  options: DiscoveryOption[];
}

export function discoveryQuestions(t: PlatformT): DiscoveryQuestion[] {
  return [
    {
      key: "flow",
      question: t("시간 가는 줄 모르고 몰입했던 순간은 언제였나요?", "When did you get so absorbed you lost track of time?", "什么时候你曾忘我投入、感觉不到时间流逝？", "Khi nào bạn từng mải mê đến quên cả thời gian?", "時間を忘れて没頭した瞬間はいつでしたか？", "Kapan Anda begitu tenggelam sampai lupa waktu?"),
      options: [
        { label: t("새로운 아이디어를 떠올리고 기획할 때", "When coming up with new ideas and planning", "想出新点子并做策划时", "Khi nảy ra ý tưởng mới và lên kế hoạch", "新しいアイデアを思いつき企画するとき", "Saat memunculkan ide baru dan merencanakan"), strengths: ["기획력", "창의성"] },
        { label: t("사람들과 이야기하고 도와줄 때", "When talking with people and helping them", "与人交谈并帮助他们时", "Khi trò chuyện với mọi người và giúp đỡ họ", "人と話して助けるとき", "Saat berbincang dengan orang dan membantu mereka"), strengths: ["공감", "커뮤니케이션"] },
        { label: t("정보를 분석하고 정리할 때", "When analyzing and organizing information", "分析并整理信息时", "Khi phân tích và sắp xếp thông tin", "情報を分析し整理するとき", "Saat menganalisis dan merapikan informasi"), strengths: ["분석력", "꼼꼼함"] },
        { label: t("직접 무언가를 만들어 완성할 때", "When building and completing something myself", "亲手做出并完成某样东西时", "Khi tự tay tạo ra và hoàn thành một điều gì đó", "自分で何かを作り上げるとき", "Saat membuat dan menyelesaikan sesuatu sendiri"), strengths: ["실행력", "몰입"] }
      ]
    },
    {
      key: "praise",
      question: t("사람들이 나에게 자주 하는 말은?", "What do people often say to you?", "别人常对你说的话是？", "Mọi người thường nói gì với bạn?", "人があなたによく言う言葉は？", "Apa yang sering dikatakan orang kepada Anda?"),
      options: [
        { label: t("\"정리를 참 잘한다\"", "\"You're really organized\"", "『你真会整理』", "\"Bạn sắp xếp rất giỏi\"", "「整理がとても上手だね」", "\"Kamu sangat rapi\""), strengths: ["꼼꼼함", "체계성"] },
        { label: t("\"이야기를 잘 들어준다\"", "\"You're a good listener\"", "『你很会倾听』", "\"Bạn lắng nghe rất tốt\"", "「話をよく聞いてくれる」", "\"Kamu pendengar yang baik\""), strengths: ["공감", "커뮤니케이션"] },
        { label: t("\"추진력이 있다\"", "\"You get things done\"", "『你有推动力』", "\"Bạn có sức thúc đẩy\"", "「推進力がある」", "\"Kamu punya daya dorong\""), strengths: ["실행력", "리더십"] },
        { label: t("\"아이디어가 많다\"", "\"You're full of ideas\"", "『你点子很多』", "\"Bạn có nhiều ý tưởng\"", "「アイデアが豊富だ」", "\"Kamu penuh ide\""), strengths: ["창의성", "기획력"] }
      ]
    },
    {
      key: "env",
      question: t("어떤 방식으로 일할 때 편한가요?", "What way of working feels comfortable to you?", "以哪种方式工作时你更自在？", "Cách làm việc nào khiến bạn thấy thoải mái?", "どんな働き方が心地よいですか？", "Cara kerja seperti apa yang nyaman bagi Anda?"),
      options: [
        { label: t("혼자 깊게 집중하는 편", "I tend to focus deeply on my own", "偏向独自深度专注", "Thiên về tập trung sâu một mình", "一人で深く集中する方", "Cenderung fokus mendalam sendiri"), strengths: ["집중력"] },
        { label: t("팀으로 함께 만드는 편", "I tend to build together as a team", "偏向以团队一起做", "Thiên về cùng làm theo nhóm", "チームで一緒に作る方", "Cenderung membangun bersama tim"), strengths: ["협업"] },
        { label: t("새로운 사람·상황을 만나는 편", "I tend to meet new people and situations", "偏向接触新的人和情境", "Thiên về gặp người và tình huống mới", "新しい人・状況に出会う方", "Cenderung menjumpai orang dan situasi baru"), strengths: ["적응력"] }
      ]
    },
    {
      key: "value",
      question: t("지금 나에게 가장 끌리는 건?", "What appeals to you most right now?", "现在最吸引你的是？", "Điều gì hấp dẫn bạn nhất lúc này?", "今、あなたに最も惹かれるものは？", "Apa yang paling menarik bagi Anda sekarang?"),
      helper: t("정답은 없어요. 지금 마음이 가는 대로 골라주세요.", "There's no right answer. Just pick what feels right now.", "没有标准答案。就按现在的心意来选。", "Không có đáp án đúng. Cứ chọn theo cảm nhận lúc này.", "正解はありません。今の気持ちのまま選んでください。", "Tidak ada jawaban benar. Pilih saja yang terasa pas sekarang."),
      options: [
        { label: t("빠르게 성장하는 것", "Growing fast", "快速成长", "Phát triển nhanh", "速く成長すること", "Berkembang cepat"), strengths: ["도전"] },
        { label: t("안정적으로 해내는 것", "Getting it done steadily", "稳定地完成", "Hoàn thành một cách ổn định", "安定してやり遂げること", "Menyelesaikan dengan stabil"), strengths: ["성실"] },
        { label: t("사람들과 함께하는 것", "Being with people", "与人同行", "Cùng làm với mọi người", "人と一緒にいること", "Bersama orang lain"), strengths: ["공감"] },
        { label: t("자유롭게 내 방식대로", "Freely, my own way", "自由地按自己的方式", "Tự do theo cách của mình", "自由に自分のやり方で", "Bebas dengan cara saya sendiri"), strengths: ["자기주도"] }
      ]
    }
  ];
}

// 관심 직무 카드 — 관심있음 / 모르겠음 / 아니요 로 표시. (key/emoji 는 KEY 로 유지, title/fit 만 번역)
export interface JobCard {
  key: string;
  emoji: string;
  title: string;
  fit: string;
}
export function discoveryJobCards(t: PlatformT): JobCard[] {
  return [
    { key: "planner", emoji: "🧭", title: t("서비스 기획", "Service Planning", "服务策划", "Lên kế hoạch dịch vụ", "サービス企画", "Perencanaan Layanan"), fit: t("문제를 정의하고 풀어가는 걸 좋아하는 분", "For those who like defining and solving problems", "适合喜欢定义并解决问题的人", "Dành cho người thích định nghĩa và giải quyết vấn đề", "問題を定義して解いていくのが好きな方", "Bagi yang suka mendefinisikan dan memecahkan masalah") },
    { key: "marketing", emoji: "📣", title: t("마케팅·콘텐츠", "Marketing & Content", "营销·内容", "Marketing & Nội dung", "マーケティング・コンテンツ", "Marketing & Konten"), fit: t("사람의 마음을 움직이는 걸 좋아하는 분", "For those who like moving people's hearts", "适合喜欢打动人心的人", "Dành cho người thích lay động lòng người", "人の心を動かすのが好きな方", "Bagi yang suka menggerakkan hati orang") },
    { key: "design", emoji: "🎨", title: t("디자인", "Design", "设计", "Thiết kế", "デザイン", "Desain"), fit: t("보이는 경험을 만드는 걸 좋아하는 분", "For those who like creating visible experiences", "适合喜欢打造可见体验的人", "Dành cho người thích tạo ra trải nghiệm hữu hình", "見える体験を作るのが好きな方", "Bagi yang suka menciptakan pengalaman yang terlihat") },
    { key: "dev", emoji: "💻", title: t("개발", "Development", "开发", "Lập trình", "開発", "Pengembangan"), fit: t("직접 만들어 작동시키는 걸 좋아하는 분", "For those who like building things and making them work", "适合喜欢亲手做出并让其运作的人", "Dành cho người thích tự tạo ra và làm nó vận hành", "自分で作って動かすのが好きな方", "Bagi yang suka membuat dan menjalankannya") },
    { key: "cx", emoji: "🤝", title: t("영업·고객경험(CX)", "Sales & Customer Experience (CX)", "销售·客户体验(CX)", "Bán hàng & Trải nghiệm khách hàng (CX)", "営業・顧客体験(CX)", "Penjualan & Pengalaman Pelanggan (CX)"), fit: t("사람과 소통하며 돕는 걸 좋아하는 분", "For those who like communicating with and helping people", "适合喜欢与人沟通并帮助他人的人", "Dành cho người thích giao tiếp và giúp đỡ mọi người", "人と対話しながら助けるのが好きな方", "Bagi yang suka berkomunikasi dan membantu orang") },
    { key: "data", emoji: "📊", title: t("데이터·분석", "Data & Analytics", "数据·分析", "Dữ liệu & Phân tích", "データ・分析", "Data & Analitik"), fit: t("숫자로 인사이트를 찾는 걸 좋아하는 분", "For those who like finding insights in numbers", "适合喜欢从数字中发现洞察的人", "Dành cho người thích tìm insight từ con số", "数字からインサイトを見つけるのが好きな方", "Bagi yang suka menemukan wawasan dari angka") }
  ];
}

// 경험 인벤토리 체크리스트.
export function discoveryExperienceItems(t: PlatformT): string[] {
  return [
    t("아르바이트", "Part-time job", "兼职", "Việc làm thêm", "アルバイト", "Kerja paruh waktu"),
    t("동아리", "Club", "社团", "Câu lạc bộ", "サークル", "Klub"),
    t("학교·팀 프로젝트", "School/team project", "学校·团队项目", "Dự án trường/nhóm", "学校・チームプロジェクト", "Proyek sekolah/tim"),
    t("공모전", "Competition", "比赛", "Cuộc thi", "コンテスト", "Lomba"),
    t("대외활동", "Extracurricular activity", "对外活动", "Hoạt động ngoại khóa", "対外活動", "Kegiatan eksternal"),
    t("인턴", "Internship", "实习", "Thực tập", "インターン", "Magang"),
    t("봉사활동", "Volunteering", "志愿活动", "Hoạt động tình nguyện", "ボランティア活動", "Kegiatan sukarela"),
    t("개인 프로젝트", "Personal project", "个人项目", "Dự án cá nhân", "個人プロジェクト", "Proyek pribadi"),
    t("콘텐츠 운영(SNS·블로그)", "Content management (social/blog)", "内容运营(社交·博客)", "Vận hành nội dung (mạng xã hội/blog)", "コンテンツ運営(SNS・ブログ)", "Pengelolaan konten (medsos/blog)")
  ];
}

export function discoveryCopy(t: PlatformT) {
  return {
    intro: {
      eyebrow: t("처음 시작하기", "Getting started", "初次开始", "Bắt đầu", "はじめての一歩", "Memulai"),
      title: t("나를 알아가는 것부터\n시작해볼까요?", "Shall we start by\ngetting to know yourself?", "从了解自己\n开始吧？", "Bắt đầu bằng việc\nhiểu chính mình nhé?", "自分を知ることから\n始めてみましょうか？", "Mulai dengan\nmengenali diri sendiri, yuk?"),
      desc: t("무엇을 잘하는지, 어떤 일이 맞는지\n몇 가지 질문으로 함께 찾아볼게요. 정답은 없어요.", "We'll find what you're good at and what suits you\ntogether through a few questions. There's no right answer.", "你擅长什么、什么工作适合你，\n我们用几个问题一起找。没有标准答案。", "Chúng ta sẽ cùng tìm bạn giỏi gì, hợp việc gì\nqua vài câu hỏi. Không có đáp án đúng.", "何が得意か、どんな仕事が合うか\nいくつかの質問で一緒に探します。正解はありません。", "Kita cari bersama apa yang Anda kuasai dan cocok\nlewat beberapa pertanyaan. Tak ada jawaban benar."),
      cta: t("시작하기", "Start", "开始", "Bắt đầu", "始める", "Mulai"),
      time: t("3분이면 충분해요 · 언제든 나갈 수 있어요", "Just 3 minutes · leave anytime", "3分钟就够 · 随时可退出", "Chỉ 3 phút · thoát bất cứ lúc nào", "3分あれば十分 · いつでも抜けられます", "Cukup 3 menit · bisa keluar kapan saja")
    },
    jobStep: {
      title: t("이런 직무는 어떤가요?", "How about roles like these?", "这些职位怎么样？", "Những vị trí thế này thì sao?", "こんな職務はどうですか？", "Bagaimana dengan posisi seperti ini?"),
      helper: t("끌리는 정도만 편하게 표시해주세요.", "Just mark how much each appeals to you.", "只需轻松标出吸引你的程度。", "Chỉ cần đánh dấu mức độ hấp dẫn với bạn.", "惹かれる度合いだけ気軽に表示してください。", "Cukup tandai seberapa menarik bagi Anda."),
      like: t("관심 있어요", "Interested", "感兴趣", "Quan tâm", "興味あり", "Tertarik"),
      maybe: t("잘 모르겠어요", "Not sure", "不太确定", "Chưa chắc", "よく分からない", "Belum yakin"),
      no: t("아니에요", "Not for me", "不是", "Không phải", "違います", "Bukan")
    },
    expStep: {
      title: t("해본 경험을 골라주세요", "Pick the experiences you've had", "选出你有过的经验", "Chọn những kinh nghiệm bạn từng có", "してみた経験を選んでください", "Pilih pengalaman yang pernah Anda punya"),
      helper: t("작아 보여도 다 취업에 쓸 수 있는 재료예요. 여러 개 선택해도 좋아요.", "Even if they seem small, they're all usable material for your job search. Feel free to pick several.", "看似微不足道，其实都是可用于求职的素材。可以多选。", "Dù trông nhỏ, tất cả đều là chất liệu dùng được khi xin việc. Chọn nhiều cũng được.", "小さく見えても、すべて就活に使える材料です。複数選んでも大丈夫。", "Meski tampak kecil, semua adalah materi untuk melamar. Boleh pilih beberapa.")
    },
    result: {
      eyebrow: t("이렇게 정리했어요", "Here's what we gathered", "我们这样整理了", "Đây là điều đã tổng hợp", "このように整理しました", "Ini yang kami rangkum"),
      strengthTitle: t("나의 강점", "My strengths", "我的优势", "Điểm mạnh của tôi", "私の強み", "Kelebihan saya"),
      interestTitle: t("관심 직무 방향", "Roles you lean toward", "感兴趣的职位方向", "Hướng vị trí quan tâm", "興味のある職務の方向", "Arah posisi yang diminati"),
      experienceTitle: t("정리하면 좋은 경험", "Experiences worth organizing", "值得整理的经验", "Kinh nghiệm nên sắp xếp", "整理すると良い経験", "Pengalaman yang layak dirapikan"),
      noInterest: t("아직 탐색 중", "Still exploring", "还在探索中", "Vẫn đang khám phá", "まだ探索中", "Masih menjelajah"),
      noExperience: t("지금부터 하나씩 쌓아가요", "Start building them one by one", "从现在起一个个积累", "Bắt đầu tích lũy từng cái từ bây giờ", "これから一つずつ積み重ねます", "Mulai bangun satu per satu dari sekarang")
    }
  } as const;
}

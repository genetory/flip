// 취업 가이드 콘텐츠 — 직무 인사이트 · 취업 노하우 · 외국인 비자(교육형).
// CareerGuide 형태를 재사용해 홈 가이드와 동일한 팝업으로 보여준다.
import type { CareerGuide } from "./home-content";
import type { PlatformT } from "../i18n";

// 외국인 구직·취업 관련 비자 — 정확한 상세는 기존 비자 안내(/resources/visa/[code])로 연결.
// code 는 라우팅/매칭 KEY 이므로 번역하지 않는다. label/desc 만 번역.
export function jobVisas(t: PlatformT): { code: string; label: string; desc: string }[] {
  return [
    { code: "D-2", label: t("D-2 유학", "D-2 Study Abroad", "D-2 留学", "D-2 Du học", "D-2 留学", "D-2 Studi"), desc: t("한국 대학에 재학 중인 유학생", "International students enrolled at Korean universities", "在韩国大学就读的留学生", "Du học sinh đang theo học tại đại học Hàn Quốc", "韓国の大学に在学中の留学生", "Mahasiswa asing yang sedang kuliah di universitas Korea") },
    { code: "D-10", label: t("D-10 구직", "D-10 Job Seeking", "D-10 求职", "D-10 Tìm việc", "D-10 求職", "D-10 Pencari Kerja"), desc: t("졸업 후 취업을 준비하는 구직 비자", "Job-seeking visa for preparing employment after graduation", "毕业后准备就业的求职签证", "Visa tìm việc để chuẩn bị đi làm sau khi tốt nghiệp", "卒業後に就職を準備する求職ビザ", "Visa pencari kerja untuk persiapan bekerja setelah lulus") },
    { code: "E-7", label: t("E-7 특정활동", "E-7 Special Activity", "E-7 特定活动", "E-7 Hoạt động đặc định", "E-7 特定活動", "E-7 Aktivitas Khusus"), desc: t("전문 분야 취업 시 받는 대표 취업 비자", "The main work visa for employment in specialized fields", "在专业领域就业时取得的代表性工作签证", "Visa lao động tiêu biểu khi làm việc trong lĩnh vực chuyên môn", "専門分野に就職する際に取得する代表的な就労ビザ", "Visa kerja utama untuk bekerja di bidang khusus") },
    { code: "F-2", label: t("F-2 거주", "F-2 Residence", "F-2 居住", "F-2 Cư trú", "F-2 居住", "F-2 Tinggal"), desc: t("제한 없이 취업할 수 있는 거주 비자", "Residence visa allowing employment without restrictions", "可无限制就业的居住签证", "Visa cư trú cho phép làm việc không giới hạn", "制限なく就職できる居住ビザ", "Visa tinggal yang memungkinkan bekerja tanpa batasan") },
    { code: "F-4", label: t("F-4 재외동포", "F-4 Overseas Korean", "F-4 在外同胞", "F-4 Kiều bào", "F-4 在外同胞", "F-4 Diaspora Korea"), desc: t("폭넓게 취업 가능한 재외동포 비자", "Overseas-Korean visa with broad employment options", "可广泛就业的在外同胞签证", "Visa kiều bào Hàn với nhiều lựa chọn việc làm rộng rãi", "幅広く就職できる在外同胞ビザ", "Visa diaspora Korea dengan pilihan kerja luas") },
    { code: "H-1", label: t("H-1 워킹홀리데이", "H-1 Working Holiday", "H-1 打工度假", "H-1 Working Holiday", "H-1 ワーキングホリデー", "H-1 Working Holiday"), desc: t("협정국 청년의 관광·취업 비자", "Tourism and work visa for youth from partner countries", "协定国青年的旅游·就业签证", "Visa du lịch và làm việc cho thanh niên các nước có hiệp định", "協定国の若者の観光・就労ビザ", "Visa wisata dan kerja untuk pemuda dari negara mitra") }
  ];
}

// 직무 인사이트 — 각 직무가 실제로 무슨 일을 하고, 무엇을 준비하면 좋은지.
export function roleInsights(t: PlatformT): CareerGuide[] {
  return [
    {
      emoji: "💻",
      title: t("개발자는\n무슨 일을 하나요?", "What does\na developer do?", "开发者\n做什么工作？", "Lập trình viên\nlàm gì?", "開発者は\n何をしますか？", "Apa yang dilakukan\nseorang developer?"),
      desc: t("코딩만? 실제 하루와 준비물", "Just coding? The real day and what to prepare", "只是写代码？真实的一天与准备事项", "Chỉ code thôi? Một ngày thực tế và cần chuẩn bị gì", "コーディングだけ？実際の一日と準備物", "Cuma ngoding? Keseharian nyata dan yang perlu disiapkan"),
      href: "/talent/jobs",
      ctaLabel: t("개발 직무 공고 보기", "See developer job postings", "查看开发职位招聘", "Xem tin tuyển dụng lập trình", "開発職の求人を見る", "Lihat lowongan developer"),
      body: [
        { heading: t("하는 일", "What they do", "工作内容", "Công việc", "する仕事", "Yang dikerjakan"), text: t("기획·디자인을 실제 동작하는 서비스로 만들어요. 새 기능 개발뿐 아니라 버그 수정, 코드 리뷰, 다른 직군과의 협업이 하루의 큰 부분이에요.", "They turn plans and designs into services that actually run. Beyond building new features, bug fixing, code review, and collaborating with other roles fill much of the day.", "把策划和设计变成实际能运行的服务。除了开发新功能，修bug、代码评审、与其他岗位协作也占一天的很大部分。", "Họ biến kế hoạch và thiết kế thành dịch vụ chạy thực sự. Ngoài phát triển tính năng mới, sửa lỗi, review code và phối hợp với các bộ phận khác chiếm phần lớn ngày làm việc.", "企画・デザインを実際に動くサービスにします。新機能の開発だけでなく、バグ修正、コードレビュー、他職種との協業が一日の大きな部分です。", "Mereka mengubah rencana dan desain jadi layanan yang benar-benar berjalan. Selain membangun fitur baru, perbaikan bug, tinjauan kode, dan kolaborasi lintas peran mengisi sebagian besar hari.") },
        { heading: t("준비하면 좋은 것", "Good to prepare", "值得准备的", "Nên chuẩn bị", "準備すると良いもの", "Baik untuk disiapkan"), text: t("작은 거라도 '직접 만든 결과물' 1~2개가 이력서를 살려요. 토이 프로젝트·클론 코딩·팀 과제 무엇이든 GitHub에 정리해두세요.", "Even small, 1–2 'things you built yourself' bring a resume to life. Organize any toy project, clone coding, or team assignment on GitHub.", "哪怕很小，1~2个『亲手做的成果』就能让简历鲜活。玩具项目、克隆编程、团队作业，任何东西都整理到GitHub上。", "Dù nhỏ, 1–2 'sản phẩm bạn tự làm' cũng làm CV sống động. Hãy sắp xếp lên GitHub bất kỳ dự án nhỏ, clone coding hay bài tập nhóm nào.", "小さくても『自分で作った成果物』1〜2個が履歴書を生かします。トイプロジェクト・クローンコーディング・チーム課題、何でもGitHubに整理しておきましょう。", "Meski kecil, 1–2 'karya buatan sendiri' menghidupkan resume. Rapikan proyek kecil, clone coding, atau tugas tim apa pun di GitHub.") },
        { heading: t("이런 사람에게", "A good fit for", "适合这样的人", "Phù hợp với", "こんな人に", "Cocok untuk"), text: t("문제를 쪼개 해결하는 걸 좋아하고, 새로운 걸 계속 배우는 게 즐거운 사람에게 잘 맞아요.", "Great for people who enjoy breaking problems down to solve them and love continuously learning new things.", "适合喜欢拆解问题去解决、乐于不断学习新事物的人。", "Rất hợp với người thích chia nhỏ vấn đề để giải quyết và thích liên tục học điều mới.", "問題を分解して解決するのが好きで、新しいことを学び続けるのが楽しい人によく合います。", "Cocok bagi yang suka memecah masalah untuk menyelesaikannya dan senang terus belajar hal baru.") }
      ]
    },
    {
      emoji: "📣",
      title: t("마케터는\n무슨 일을 하나요?", "What does\na marketer do?", "营销人员\n做什么工作？", "Marketer\nlàm gì?", "マーケターは\n何をしますか？", "Apa yang dilakukan\nseorang marketer?"),
      desc: t("감이 아니라 숫자로 일해요", "Working by numbers, not by gut", "靠数字而非直觉工作", "Làm việc bằng con số, không phải cảm tính", "勘ではなく数字で働きます", "Bekerja dengan angka, bukan firasat"),
      href: "/talent/jobs",
      ctaLabel: t("마케팅 직무 공고 보기", "See marketing job postings", "查看营销职位招聘", "Xem tin tuyển dụng marketing", "マーケ職の求人を見る", "Lihat lowongan marketing"),
      body: [
        { heading: t("하는 일", "What they do", "工作内容", "Công việc", "する仕事", "Yang dikerjakan"), text: t("고객을 모으고 움직이게 만들어요. 콘텐츠·광고·SNS를 운영하고, 결과를 숫자(전환율·클릭·매출)로 확인하며 다음 액션을 정해요.", "They attract customers and get them to act. They run content, ads, and social media, check results in numbers (conversion, clicks, revenue), and decide the next action.", "吸引并促动客户。运营内容、广告、社交媒体，用数字（转化率、点击、销售额）确认结果并决定下一步行动。", "Họ thu hút và thúc đẩy khách hàng hành động. Vận hành nội dung, quảng cáo, mạng xã hội, kiểm tra kết quả bằng con số (tỷ lệ chuyển đổi, lượt nhấp, doanh thu) và quyết định hành động tiếp theo.", "顧客を集め、動かします。コンテンツ・広告・SNSを運営し、結果を数字(コンバージョン率・クリック・売上)で確認して次のアクションを決めます。", "Mereka menarik dan menggerakkan pelanggan. Menjalankan konten, iklan, media sosial, memeriksa hasil dalam angka (konversi, klik, pendapatan), dan menentukan aksi berikutnya.") },
        { heading: t("준비하면 좋은 것", "Good to prepare", "值得准备的", "Nên chuẩn bị", "準備すると良いもの", "Baik untuk disiapkan"), text: t("직접 운영해본 SNS 계정, 블로그, 소규모 캠페인이 큰 어필이 돼요. '팔로워 0→500', '방문자 2배'처럼 숫자로 정리하세요.", "A social account, blog, or small campaign you ran yourself is a big plus. Sum it up in numbers like 'followers 0→500' or 'visitors doubled.'", "自己运营过的社交账号、博客、小型活动会是很大加分。用『粉丝0→500』『访客翻倍』这样的数字来整理。", "Tài khoản mạng xã hội, blog hay chiến dịch nhỏ bạn tự vận hành là điểm cộng lớn. Hãy tóm bằng con số như 'follower 0→500', 'khách gấp đôi'.", "自分で運営したSNSアカウント、ブログ、小規模キャンペーンが大きなアピールになります。『フォロワー0→500』『訪問者2倍』のように数字で整理しましょう。", "Akun media sosial, blog, atau kampanye kecil yang Anda jalankan sendiri jadi nilai plus besar. Rangkum dalam angka seperti 'follower 0→500', 'pengunjung 2 kali lipat'.") },
        { heading: t("이런 사람에게", "A good fit for", "适合这样的人", "Phù hợp với", "こんな人に", "Cocok untuk"), text: t("사람의 마음을 관찰하는 걸 좋아하고, 결과를 숫자로 확인하며 개선하는 걸 즐기는 사람에게 잘 맞아요.", "Great for people who like observing what moves others and enjoy checking results in numbers to improve.", "适合喜欢观察人心、乐于用数字确认结果并改进的人。", "Rất hợp với người thích quan sát tâm lý người khác và thích kiểm tra kết quả bằng con số để cải thiện.", "人の心を観察するのが好きで、結果を数字で確認しながら改善するのを楽しむ人によく合います。", "Cocok bagi yang suka mengamati apa yang menggerakkan orang dan senang memeriksa hasil dalam angka untuk memperbaikinya.") }
      ]
    },
    {
      emoji: "🎨",
      title: t("디자이너\n포트폴리오, 뭘 넣죠?", "Designer portfolio:\nwhat goes in?", "设计师作品集\n放什么？", "Portfolio thiết kế:\ncho gì vào?", "デザイナーの\nポートフォリオ、何を入れる？", "Portofolio desainer:\napa isinya?"),
      desc: t("결과물보다 '과정'을 보여주세요", "Show the 'process,' not just the final work", "比起成果，更要展示『过程』", "Hãy cho thấy 'quá trình', không chỉ sản phẩm", "成果物より『過程』を見せましょう", "Tunjukkan 'proses', bukan sekadar hasil"),
      href: "/talent/jobs",
      ctaLabel: t("디자인 직무 공고 보기", "See design job postings", "查看设计职位招聘", "Xem tin tuyển dụng thiết kế", "デザイン職の求人を見る", "Lihat lowongan desain"),
      body: [
        { heading: t("핵심은 '과정'", "The key is 'process'", "关键是『过程』", "Cốt lõi là 'quá trình'", "肝心なのは『過程』", "Kuncinya 'proses'"), text: t("예쁜 결과물만 나열하지 말고, 어떤 문제를 어떻게 풀었는지 과정을 보여주세요. 문제 → 고민 → 결정 → 결과 흐름이 있으면 강해요.", "Don't just list pretty results—show how you solved which problems. A problem → deliberation → decision → result flow is powerful.", "别只罗列漂亮成果，展示你如何解决了什么问题的过程。有『问题→思考→决策→结果』的脉络就很有力。", "Đừng chỉ liệt kê sản phẩm đẹp—hãy cho thấy bạn giải quyết vấn đề nào và như thế nào. Có dòng chảy vấn đề → trăn trở → quyết định → kết quả sẽ mạnh.", "きれいな成果物を並べるだけでなく、どんな問題をどう解決したか過程を見せましょう。問題→検討→決定→結果の流れがあると強いです。", "Jangan hanya memajang hasil cantik—tunjukkan bagaimana Anda memecahkan masalah apa. Alur masalah → pertimbangan → keputusan → hasil itu kuat.") },
        { heading: t("3~4개면 충분", "3–4 is enough", "3~4个就够", "3–4 cái là đủ", "3〜4個で十分", "3–4 sudah cukup"), text: t("많이보다 완성도예요. 자신 있는 3~4개를 깊이 있게 정리하는 게 20개를 얕게 넣는 것보다 낫습니다.", "Quality over quantity. Presenting 3–4 you're confident in, in depth, beats putting in 20 shallow ones.", "重质不重量。深入整理3~4个你有信心的，胜过浅显地放20个。", "Chất hơn lượng. Trình bày sâu 3–4 cái bạn tự tin tốt hơn nhồi 20 cái hời hợt.", "多さより完成度です。自信のある3〜4個を深く整理する方が、20個を浅く入れるより良いです。", "Kualitas di atas kuantitas. Menyajikan 3–4 yang Anda percaya diri secara mendalam lebih baik daripada 20 yang dangkal.") },
        { heading: t("이런 사람에게", "A good fit for", "适合这样的人", "Phù hợp với", "こんな人に", "Cocok untuk"), text: t("사용자의 불편을 발견하고 더 나은 경험으로 바꾸는 데 흥미가 있는 사람에게 잘 맞아요.", "Great for people interested in spotting user pain points and turning them into better experiences.", "适合对发现用户的不便、并将其转化为更好体验感兴趣的人。", "Rất hợp với người hứng thú phát hiện điểm bất tiện của người dùng và biến thành trải nghiệm tốt hơn.", "ユーザーの不便を見つけ、より良い体験に変えることに興味がある人によく合います。", "Cocok bagi yang tertarik menemukan keluhan pengguna dan mengubahnya jadi pengalaman lebih baik.") }
      ]
    },
    {
      emoji: "📝",
      title: t("기획·PM은\n무슨 일을 하나요?", "What does a\nplanner/PM do?", "策划·PM\n做什么工作？", "Planner/PM\nlàm gì?", "企画・PMは\n何をしますか？", "Apa yang dilakukan\nplanner/PM?"),
      desc: t("만드는 사람들을 잇는 역할", "The role that connects the makers", "连接创造者们的角色", "Vai trò kết nối những người tạo ra sản phẩm", "作る人たちをつなぐ役割", "Peran yang menghubungkan para pembuat"),
      href: "/talent/jobs",
      ctaLabel: t("기획 직무 공고 보기", "See planning job postings", "查看策划职位招聘", "Xem tin tuyển dụng planning", "企画職の求人を見る", "Lihat lowongan planning"),
      body: [
        { heading: t("하는 일", "What they do", "工作内容", "Công việc", "する仕事", "Yang dikerjakan"), text: t("'무엇을 왜 만들지'를 정하고, 개발·디자인·마케팅이 같은 방향을 보게 조율해요. 우선순위를 정하고 일정을 챙기는 게 큰 몫이에요.", "They decide 'what to build and why' and align development, design, and marketing toward the same direction. Setting priorities and managing schedules is a big part.", "决定『做什么、为什么做』，并协调开发、设计、营销朝同一方向。定优先级、盯进度是很大一部分。", "Họ quyết định 'làm gì và vì sao' và điều phối để phát triển, thiết kế, marketing cùng hướng. Đặt ưu tiên và quản lý tiến độ là phần lớn công việc.", "『何をなぜ作るか』を決め、開発・デザイン・マーケティングが同じ方向を向くよう調整します。優先順位を決め、日程を管理するのが大きな役割です。", "Mereka menentukan 'apa yang dibuat dan mengapa' serta menyelaraskan pengembangan, desain, dan pemasaran ke arah yang sama. Menetapkan prioritas dan mengatur jadwal adalah bagian besarnya.") },
        { heading: t("준비하면 좋은 것", "Good to prepare", "值得准备的", "Nên chuẩn bị", "準備すると良いもの", "Baik untuk disiapkan"), text: t("동아리·팀플에서 '이끌어 본 경험'을 정리하세요. 왜 그 결정을 했고 어떤 결과가 나왔는지 설명할 수 있으면 좋아요.", "Organize times you 'led' in clubs or team projects. It helps if you can explain why you made a decision and what result it produced.", "整理你在社团、团队项目中『带领过的经验』。能说明为何做那个决定、产生了什么结果就更好。", "Hãy sắp xếp những lần bạn 'dẫn dắt' trong câu lạc bộ hay dự án nhóm. Sẽ tốt nếu bạn giải thích được vì sao ra quyết định đó và kết quả ra sao.", "サークル・チームプロジェクトで『引っ張った経験』を整理しましょう。なぜその決定をし、どんな結果が出たか説明できると良いです。", "Rapikan pengalaman Anda 'memimpin' di klub atau proyek tim. Akan bagus bila bisa menjelaskan mengapa mengambil keputusan itu dan hasilnya apa.") },
        { heading: t("이런 사람에게", "A good fit for", "适合这样的人", "Phù hợp với", "こんな人に", "Cocok untuk"), text: t("큰 그림을 그리면서 사람들을 조율하고, 우선순위를 정하는 걸 잘하는 사람에게 잘 맞아요.", "Great for people good at seeing the big picture, coordinating people, and setting priorities.", "适合擅长描绘大局、协调众人、确定优先级的人。", "Rất hợp với người giỏi nhìn bức tranh lớn, điều phối mọi người và đặt ưu tiên.", "大きな絵を描きながら人を調整し、優先順位を決めるのが得意な人によく合います。", "Cocok bagi yang mahir melihat gambaran besar, mengoordinasikan orang, dan menetapkan prioritas.") }
      ]
    }
  ];
}

// 취업 노하우 — 첫 취업에서 자주 막히는 지점을 풀어주는 실전 팁.
export function jobHunting(t: PlatformT): CareerGuide[] {
  return [
    {
      emoji: "🧭",
      title: t("첫 직장,\n어떻게 고르죠?", "How to choose\nyour first job?", "第一份工作\n怎么选？", "Chọn công việc\nđầu tiên thế nào?", "初めての職場、\nどう選ぶ？", "Bagaimana memilih\npekerjaan pertama?"),
      desc: t("연봉 말고 이걸 먼저 보세요", "Look at this before salary", "别只看薪资，先看这些", "Hãy xem điều này trước lương", "年収より先にこれを見て", "Lihat ini sebelum gaji"),
      body: [
        { heading: t("'무슨 일'을 하는지", "'What work' you'll do", "做『什么工作』", "Bạn làm 'việc gì'", "『どんな仕事』をするか", "'Pekerjaan apa' yang dilakukan"), text: t("회사 이름·연봉보다, 내가 매일 하게 될 '주요 업무'가 끌리는지가 오래 다니는 데 가장 중요해요.", "More than the company name or salary, whether the 'key duties' you'd do daily appeal to you matters most for staying long.", "比起公司名和薪资，你每天要做的『主要工作』是否吸引你，对能否长久最重要。", "Hơn cả tên công ty hay lương, việc 'nhiệm vụ chính' hằng ngày có hấp dẫn không mới quan trọng nhất để gắn bó lâu.", "会社名・年収より、自分が毎日する『主な業務』に惹かれるかが長く続けるうえで最も大切です。", "Lebih dari nama perusahaan atau gaji, apakah 'tugas utama' harian menarik paling penting untuk bertahan lama.") },
        { heading: t("성장 환경인지", "Is it a place to grow", "是否是成长环境", "Có phải môi trường phát triển", "成長できる環境か", "Apakah lingkungan untuk berkembang"), text: t("첫 직장은 배우는 곳이에요. 사수가 있는지, 피드백을 받을 수 있는지, 새로운 걸 시도해볼 수 있는지를 보세요.", "A first job is a place to learn. Check if there's a mentor, whether you can get feedback, and whether you can try new things.", "第一份工作是学习的地方。看看有没有带你的前辈、能否获得反馈、能否尝试新事物。", "Công việc đầu tiên là nơi để học. Hãy xem có người hướng dẫn không, có nhận được phản hồi không, có thể thử điều mới không.", "初めての職場は学ぶ場所です。指導してくれる先輩がいるか、フィードバックを受けられるか、新しいことを試せるかを見ましょう。", "Pekerjaan pertama adalah tempat belajar. Cek apakah ada mentor, bisa dapat umpan balik, dan bisa mencoba hal baru.") },
        { heading: t("완벽한 곳은 없어요", "No place is perfect", "没有完美的地方", "Không có nơi hoàn hảo", "完璧な所はありません", "Tak ada tempat sempurna"), text: t("모든 조건이 완벽한 곳은 드물어요. 나에게 중요한 2~3가지를 정하고, 그걸 충족하면 충분히 좋은 선택이에요.", "A place where every condition is perfect is rare. Decide on 2–3 things that matter to you; if it meets those, it's a good enough choice.", "所有条件都完美的地方很少。定下对你重要的2~3点，只要满足就是足够好的选择。", "Nơi mọi điều kiện đều hoàn hảo rất hiếm. Hãy chọn 2–3 điều quan trọng với bạn; đáp ứng được là lựa chọn đủ tốt.", "すべての条件が完璧な所はまれです。自分に大切な2〜3つを決め、それを満たせば十分良い選択です。", "Tempat yang semua kondisinya sempurna itu langka. Tentukan 2–3 hal yang penting bagi Anda; jika terpenuhi, itu pilihan yang cukup baik.") }
      ]
    },
    {
      emoji: "🌱",
      title: t("경력이 없는데\n어떻게 어필하죠?", "No experience—\nhow do I stand out?", "没有经验\n怎么展示自己？", "Chưa có kinh nghiệm—\nlàm sao gây ấn tượng?", "経歴がないのに\nどうアピールする？", "Tanpa pengalaman—\nbagaimana menonjol?"),
      desc: t("경험은 이미 충분히 있어요", "You already have plenty of experience", "你其实已经有足够的经验", "Bạn đã có đủ kinh nghiệm rồi", "経験はもう十分にあります", "Anda sudah punya cukup pengalaman"),
      href: "/talent/career/resume",
      ctaLabel: t("이력서에 정리하기", "Organize it into a resume", "整理进简历", "Sắp xếp vào CV", "履歴書に整理する", "Rapikan ke dalam resume"),
      body: [
        { heading: t("경험의 정의를 넓혀요", "Broaden what counts as experience", "拓宽经验的定义", "Mở rộng định nghĩa kinh nghiệm", "経験の定義を広げる", "Perluas makna pengalaman"), text: t("알바·동아리·팀플·공모전·개인 프로젝트 모두 훌륭한 재료예요. '무경력'이 아니라 '아직 정리 안 된 경험'일 뿐이에요.", "Part-time jobs, clubs, team projects, contests, and personal projects are all great material. You're not 'inexperienced'—it's just 'experience not yet organized.'", "兼职、社团、团队项目、比赛、个人项目都是很好的素材。你不是『没经验』，只是『还没整理的经验』。", "Việc làm thêm, câu lạc bộ, dự án nhóm, cuộc thi, dự án cá nhân đều là chất liệu tuyệt vời. Bạn không 'thiếu kinh nghiệm'—chỉ là 'kinh nghiệm chưa được sắp xếp'.", "アルバイト・サークル・チームプロジェクト・コンテスト・個人プロジェクトすべて立派な材料です。『無経験』ではなく『まだ整理されていない経験』なだけです。", "Kerja paruh waktu, klub, proyek tim, lomba, dan proyek pribadi semua materi bagus. Anda bukan 'tanpa pengalaman'—hanya 'pengalaman yang belum dirapikan'.") },
        { heading: t("결과까지 적어요", "Write down to the result", "写到结果为止", "Ghi đến cả kết quả", "結果まで書く", "Tulis sampai hasilnya"), text: t("'무엇을 했다'에서 멈추지 말고 '그래서 어떻게 됐다'까지. '주문 누락 30% 감소'처럼 변화를 보여주세요.", "Don't stop at 'what you did'—go to 'what came of it.' Show the change, like 'cut order errors by 30%.'", "别停在『做了什么』，写到『结果如何』。像『订单遗漏减少30%』一样展示变化。", "Đừng dừng ở 'đã làm gì'—hãy đến 'kết quả ra sao'. Cho thấy thay đổi như 'giảm 30% đơn bị sót'.", "『何をした』で止めず『それでどうなった』まで。『注文漏れ30%削減』のように変化を見せましょう。", "Jangan berhenti di 'apa yang dilakukan'—lanjut ke 'hasilnya apa'. Tunjukkan perubahan seperti 'kesalahan pesanan turun 30%'.") },
        { heading: t("직무와 연결해요", "Connect it to the role", "与职位连接", "Kết nối với vị trí", "職務と結びつける", "Hubungkan dengan posisi"), text: t("같은 경험도 지원 직무에 맞춰 강조점을 바꿔요. 카페 알바 → 고객 응대·문제 해결 경험으로.", "Shift the emphasis of the same experience to fit the role. Café part-time job → customer service and problem-solving experience.", "同样的经验也按应聘职位调整侧重点。咖啡店兼职→客户接待、解决问题的经验。", "Chuyển điểm nhấn của cùng kinh nghiệm cho hợp vị trí. Làm thêm ở quán cà phê → kinh nghiệm phục vụ khách và giải quyết vấn đề.", "同じ経験でも応募職種に合わせて強調点を変えます。カフェのアルバイト→接客・問題解決の経験へ。", "Geser penekanan pengalaman yang sama agar sesuai posisi. Kerja paruh waktu di kafe → pengalaman melayani pelanggan dan memecahkan masalah.") }
      ]
    },
    {
      emoji: "🤝",
      title: t("인턴, 꼭\n해야 할까요?", "Do I really\nneed an internship?", "实习\n一定要做吗？", "Có nhất thiết\nphải thực tập?", "インターンは\n必ずすべき？", "Apakah magang\nitu wajib?"),
      desc: t("인턴을 200% 활용하는 법", "How to make the most of an internship", "把实习用到200%的方法", "Cách tận dụng thực tập tối đa", "インターンを200%活用する方法", "Cara memaksimalkan magang"),
      href: "/talent/jobs",
      ctaLabel: t("인턴 공고 보기", "See internship postings", "查看实习招聘", "Xem tin tuyển thực tập", "インターン求人を見る", "Lihat lowongan magang"),
      body: [
        { heading: t("가장 빠른 실무 경험", "The fastest real-work experience", "最快的实操经验", "Kinh nghiệm thực tế nhanh nhất", "最も早い実務経験", "Pengalaman kerja nyata tercepat"), text: t("인턴은 '실제로 일해본 경험'을 만드는 가장 확실한 방법이에요. 짧아도 이력서에서 큰 힘을 발휘해요.", "An internship is the surest way to build 'experience actually working.' Even a short one carries great weight on a resume.", "实习是积累『真正工作过的经验』最确实的方法。即使短暂，也在简历上发挥很大作用。", "Thực tập là cách chắc chắn nhất để tạo 'kinh nghiệm làm việc thực tế'. Dù ngắn cũng có sức nặng lớn trong CV.", "インターンは『実際に働いた経験』を作る最も確実な方法です。短くても履歴書で大きな力を発揮します。", "Magang adalah cara paling pasti membangun 'pengalaman benar-benar bekerja'. Meski singkat, sangat berbobot di resume.") },
        { heading: t("배운 걸 기록해요", "Record what you learn", "记录学到的东西", "Ghi lại điều học được", "学んだことを記録する", "Catat yang dipelajari"), text: t("인턴 중 한 일, 배운 것, 만든 결과를 그때그때 남겨두세요. 나중에 이력서·면접에서 그대로 재료가 돼요.", "Note what you did, learned, and produced during the internship as you go. It becomes ready-made material for your resume and interviews later.", "把实习期间做的事、学到的、做出的成果随时记下来。以后在简历、面试里可以直接当素材。", "Ghi lại việc đã làm, điều học được và kết quả tạo ra ngay trong lúc thực tập. Về sau sẽ thành chất liệu sẵn cho CV và phỏng vấn.", "インターン中にした仕事、学んだこと、作った成果をその都度残しておきましょう。後で履歴書・面接でそのまま材料になります。", "Catat apa yang dilakukan, dipelajari, dan dihasilkan selama magang seketika itu. Nanti jadi materi siap pakai untuk resume dan wawancara.") },
        { heading: t("전환도 노려봐요", "Aim for conversion too", "也争取转正", "Cũng nhắm đến chuyển chính thức", "転換も狙ってみる", "Incar juga pengangkatan"), text: t("성실함과 태도를 보이면 정규직 전환·추천으로 이어지기도 해요. 인턴을 '긴 면접'이라 생각하고 임해요.", "Showing diligence and a good attitude can lead to a full-time offer or a referral. Approach the internship as a 'long interview.'", "展现踏实和态度，有时能带来转正或推荐。把实习当作『长面试』来对待。", "Thể hiện sự tận tâm và thái độ tốt có thể dẫn đến chuyển chính thức hoặc được giới thiệu. Hãy xem thực tập như một 'cuộc phỏng vấn dài'.", "誠実さと態度を見せれば正社員転換・推薦につながることもあります。インターンを『長い面接』だと思って臨みましょう。", "Menunjukkan ketekunan dan sikap baik bisa berujung pengangkatan tetap atau rekomendasi. Anggap magang sebagai 'wawancara panjang'.") }
      ]
    },
    {
      emoji: "💬",
      title: t("면접,\n뭘 준비하죠?", "Interviews:\nwhat to prepare?", "面试\n准备什么？", "Phỏng vấn:\nchuẩn bị gì?", "面接、\n何を準備する？", "Wawancara:\nsiapkan apa?"),
      desc: t("단골 질문 3개부터 시작", "Start with the 3 regular questions", "从3个常见问题开始", "Bắt đầu từ 3 câu hỏi quen thuộc", "定番質問3つから始める", "Mulai dari 3 pertanyaan langganan"),
      href: "/talent/career/interviews",
      ctaLabel: t("면접 준비하러 가기", "Go prepare for interviews", "去准备面试", "Đi chuẩn bị phỏng vấn", "面接の準備へ", "Mulai persiapan wawancara"),
      body: [
        { heading: t("단골 질문 3개", "The 3 regular questions", "3个常见问题", "3 câu hỏi quen thuộc", "定番質問3つ", "3 pertanyaan langganan"), text: t("자기소개, 지원 동기, 강점 — 이 셋은 거의 항상 나와요. 내 경험을 예시로 붙여 답을 미리 준비하세요.", "Self-intro, motivation, strengths—these three almost always come up. Prepare answers in advance by attaching your experiences as examples.", "自我介绍、求职动机、优势——这三个几乎必问。用自己的经验作例子提前准备好回答。", "Giới thiệu bản thân, động cơ, điểm mạnh—ba câu này gần như luôn có. Chuẩn bị trước bằng cách gắn kinh nghiệm làm ví dụ.", "自己紹介、志望動機、強み — この3つはほぼ必ず出ます。自分の経験を例として添えて答えを先に準備しましょう。", "Perkenalan diri, motivasi, kelebihan—tiga ini hampir selalu muncul. Siapkan jawaban lebih dulu dengan menempelkan pengalaman sebagai contoh.") },
        { heading: t("공고에서 질문을 뽑아요", "Pull questions from the posting", "从招聘启事里提炼问题", "Rút câu hỏi từ tin tuyển dụng", "求人から質問を引き出す", "Tarik pertanyaan dari lowongan"), text: t("채용 공고의 '자격요건·우대사항'을 질문으로 바꿔 연습하면 실제 면접과 거의 겹쳐요.", "Turn the posting's 'requirements and preferred points' into questions and practice—they overlap heavily with the real interview.", "把招聘的『任职要求·加分项』变成问题来练习，会和实际面试几乎重合。", "Biến 'yêu cầu và ưu tiên' trong tin tuyển dụng thành câu hỏi để luyện—gần như trùng với phỏng vấn thật.", "求人の『応募資格・優遇事項』を質問に変えて練習すると、実際の面接とほぼ重なります。", "Ubah 'persyaratan dan nilai plus' lowongan jadi pertanyaan lalu latih—sangat mirip dengan wawancara sesungguhnya.") },
        { heading: t("모르면 솔직하게", "Be honest when unsure", "不懂就坦诚", "Không biết thì thành thật", "分からなければ正直に", "Jujur bila tak tahu"), text: t("모르는 건 인정하되 '이렇게 배우겠다'를 덧붙이면 태도로 점수를 얻어요.", "Admit what you don't know, but add 'here's how I'd learn it' to score on attitude.", "承认不懂，但补上『我会这样去学』，能在态度上得分。", "Thừa nhận điều chưa biết, nhưng thêm 'tôi sẽ học thế này' để ghi điểm thái độ.", "分からないことは認めつつ『こう学びます』を添えると態度で点を得ます。", "Akui yang tak Anda ketahui, tapi tambahkan 'begini cara saya mempelajarinya' untuk nilai sikap.") }
      ]
    }
  ];
}

"use client";

// "이번 주 배우기" — 각 주차 시작 전에 읽는 짧은 학습 카드(맥락·배경).
// 대화(활동)만 있으면 맥락이 없어 빨리 끝난 느낌이라, 배우기(LEARN) 요소를 앞에 둔다.
// 콘텐츠는 아래 데이터에 6개국어로. 해당 주차 카드가 없으면 아무것도 렌더하지 않는다.
import { useState } from "react";
import { CaretDown, BookOpen } from "@phosphor-icons/react";
import { SectionTitle } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;
type LearnCard = { emoji: string; title: string; body: string };

function weekCards(t: LaunchT, week: number): LearnCard[] {
  if (week === 1)
    return [
      {
        emoji: "🗺️",
        title: t("한국 취업, 큰 그림부터", "Korean job search: the big picture", "韩国求职：先看全局", "Xin việc ở Hàn: bức tranh lớn", "韓国就活、まず全体像", "Kerja di Korea: gambaran besar"),
        body: t(
          "한국 채용은 보통 서류(이력서·자기소개서) → 면접(직무·인성) 순서로 진행돼요. 외국인은 여기에 비자(체류자격)와 한국어(가능하면 TOPIK)가 더해져요. 이 4주 프로그램은 이 순서를 준비하도록 설계됐어요 — 1주차는 '나와 직무', 2주차는 서류, 3~4주차는 면접이에요.",
          "Korean hiring usually goes: documents (resume, cover letter) → interviews (job & personality). For international applicants, visa status and Korean (TOPIK if possible) matter too. This 4-week program follows that path — Week 1 is you & your target job, Week 2 is documents, Weeks 3–4 are interviews.",
          "韩国招聘通常是：材料（简历、自我介绍）→ 面试（职务、人品）。外国人还要考虑签证和韩语（尽量考TOPIK）。这个4周计划就按这个顺序准备——第1周是自我与职务，第2周材料，第3~4周面试。",
          "Tuyển dụng ở Hàn thường theo: hồ sơ (CV, thư giới thiệu) → phỏng vấn (công việc & tính cách). Người nước ngoài còn cần visa và tiếng Hàn (TOPIK nếu được). Chương trình 4 tuần này đi theo lộ trình đó — Tuần 1 là bạn & nghề mục tiêu, Tuần 2 hồ sơ, Tuần 3–4 phỏng vấn.",
          "韓国の採用は通常、書類（履歴書・自己紹介書）→ 面接（職務・人柄）の順です。外国人はビザ（在留資格）と韓国語（できればTOPIK）も加わります。この4週間はその順に準備します — 1週目は自分と職務、2週目は書類、3〜4週目は面接です。",
          "Rekrutmen di Korea biasanya: dokumen (resume, surat lamaran) → wawancara (pekerjaan & kepribadian). Bagi orang asing, visa dan bahasa Korea (TOPIK jika bisa) juga penting. Program 4 minggu ini mengikuti alur itu — Minggu 1 dirimu & peran target, Minggu 2 dokumen, Minggu 3–4 wawancara."
        )
      },
      {
        emoji: "🎯",
        title: t("왜 '직무'를 먼저 정할까", "Why pick a job role first", "为什么先定职务", "Vì sao chọn nghề trước", "なぜ先に職務を決めるか", "Mengapa pilih peran dulu"),
        body: t(
          "회사부터 고르면 막막하지만, '어떤 일(직무)'을 할지 정하면 이력서·자기소개서·면접 준비의 방향이 한 번에 잡혀요. 같은 회사라도 직무마다 필요한 역량과 어필 포인트가 완전히 달라요. 그래서 1주차는 나에게 맞는 목표 직무를 찾는 데 집중해요.",
          "Starting with companies feels overwhelming, but deciding what work (the role) you'll do sets the direction for your resume, cover letter, and interviews all at once. Even at the same company, each role needs different skills and selling points. That's why Week 1 focuses on finding your target role.",
          "先选公司会很迷茫，但只要定下'做什么（职务）'，简历、自我介绍、面试的方向就一次到位。即使同一家公司，不同职务需要的能力和卖点也完全不同。所以第1周专注于找到适合你的目标职务。",
          "Bắt đầu từ công ty thì mông lung, nhưng khi quyết định làm gì (nghề nào) thì định hướng cho CV, thư, phỏng vấn có ngay cùng lúc. Cùng một công ty, mỗi nghề cần năng lực và điểm nhấn khác nhau. Vì thế Tuần 1 tập trung tìm nghề mục tiêu.",
          "会社から選ぶと迷いますが、どんな仕事（職務）をするかを決めると、履歴書・自己紹介書・面接の方向が一度に定まります。同じ会社でも職務ごとに必要な力もアピールも全く違います。だから1週目は自分に合う目標職務探しに集中します。",
          "Mulai dari perusahaan terasa membingungkan, tapi menentukan pekerjaan (peran) apa langsung mengarahkan resume, surat, dan wawancara sekaligus. Di perusahaan yang sama pun, tiap peran butuh keterampilan dan nilai jual berbeda. Karena itu Minggu 1 fokus menemukan peran targetmu."
        )
      },
      {
        emoji: "💡",
        title: t("경험이 없다고 느껴진다면", "If you feel you have no experience", "如果觉得自己没经验", "Nếu bạn thấy mình chưa có kinh nghiệm", "経験がないと感じたら", "Jika merasa tak punya pengalaman"),
        body: t(
          "정규직 경력만 '경험'이 아니에요. 아르바이트·팀 프로젝트·동아리·봉사·개인 프로젝트 모두 강점의 재료예요. 중요한 건 '무엇을 했고, 거기서 뭘 잘했는지'예요. 이번 주 경험 찾기에서 사소해 보이는 것부터 꺼내보면, 생각보다 쓸 게 많다는 걸 알게 될 거예요.",
          "Full-time work isn't the only 'experience.' Part-time jobs, team projects, clubs, volunteering, and personal projects are all raw material for your strengths. What matters is what you did and what you were good at. When you start with the small stuff this week, you'll find you have more to work with than you thought.",
          "只有正式工作才算'经验'？不是的。兼职、团队项目、社团、志愿服务、个人项目都是优势的素材。关键是'做了什么、在其中擅长什么'。本周从看似微小的经历开始挖掘，你会发现可用的比想象的多。",
          "Chỉ công việc chính thức mới là 'kinh nghiệm'? Không. Việc làm thêm, dự án nhóm, CLB, tình nguyện, dự án cá nhân đều là chất liệu cho điểm mạnh. Quan trọng là bạn đã làm gì và giỏi ở điểm nào. Khi bắt đầu từ điều nhỏ trong tuần này, bạn sẽ thấy có nhiều thứ để dùng hơn tưởng.",
          "正社員の経歴だけが「経験」ではありません。アルバイト・チームプロジェクト・サークル・ボランティア・個人開発、すべて強みの素材です。大事なのは「何をして、そこで何が得意だったか」。今週、小さなことから掘り出すと、思ったより使える材料が多いと気づくはずです。",
          "Bukan hanya kerja penuh waktu yang disebut 'pengalaman'. Kerja paruh waktu, proyek tim, klub, relawan, proyek pribadi semua bahan untuk kelebihanmu. Yang penting apa yang kamu lakukan dan di mana kamu unggul. Mulai dari hal kecil minggu ini, kamu akan sadar punya lebih banyak dari yang dikira."
        )
      },
      {
        emoji: "🇰🇷",
        title: t("한국 직장 문화 한 스푼", "A spoonful of Korean workplace culture", "一勺韩国职场文化", "Một chút văn hóa công sở Hàn", "韓国の職場文化を少し", "Sesendok budaya kerja Korea"),
        body: t(
          "한국 회사는 팀워크·성실함·함께 오래 일할 사람인지를 중요하게 봐요. 면접에서 '왜 한국에서 일하고 싶은지', '이 직무·회사에 얼마나 진심인지'를 자주 물어요. 정답을 외우기보다, 이번 주에 '나의 방향'을 스스로 정리해두면 이후 모든 준비가 흔들리지 않아요.",
          "Korean companies value teamwork, diligence, and whether you'll stay and grow with them. Interviews often ask why you want to work in Korea and how genuinely committed you are to this role and company. Rather than memorizing answers, sorting out your own direction this week keeps all your later prep steady.",
          "韩国公司重视团队合作、踏实，以及你是否能长期一起工作。面试常问'为什么想在韩国工作''对这个职务和公司有多真诚'。与其背答案，不如本周先理清'自己的方向'，之后所有准备都不会动摇。",
          "Công ty Hàn coi trọng làm việc nhóm, sự chăm chỉ và việc bạn có gắn bó lâu dài không. Phỏng vấn thường hỏi vì sao muốn làm ở Hàn và bạn thật sự tâm huyết với nghề/công ty này ra sao. Thay vì học thuộc, hãy tự sắp xếp 'định hướng của mình' tuần này để mọi bước sau vững vàng.",
          "韓国企業はチームワーク・誠実さ・長く一緒に働けるかを重視します。面接では「なぜ韓国で働きたいか」「この職務・会社にどれほど本気か」をよく聞きます。答えを丸暗記するより、今週「自分の方向」を整理しておくと、以降の準備がぶれません。",
          "Perusahaan Korea menghargai kerja sama tim, kerajinan, dan apakah kamu akan bertahan bersama mereka. Wawancara sering menanyakan mengapa ingin bekerja di Korea dan seberapa sungguh-sungguh kamu pada peran serta perusahaan ini. Daripada menghafal jawaban, menata 'arahmu' minggu ini membuat semua persiapan berikutnya mantap."
        )
      }
    ];
  if (week === 2)
    return [
      {
        emoji: "📄",
        title: t("이력서는 나열이 아니라 '광고'", "A resume is an ad, not a list", "简历是'广告'不是清单", "CV là 'quảng cáo', không phải liệt kê", "履歴書は羅列でなく『広告』", "Resume itu 'iklan', bukan daftar"),
        body: t(
          "채용담당자는 이력서를 평균 10초 안에 훑어요. 한 일을 늘어놓기보다 '무엇을 해서 어떤 성과를 냈는지'를 앞세워야 눈에 들어와요.",
          "Recruiters skim a resume in about 10 seconds. Instead of listing tasks, lead with what you did and the result it produced — that's what catches the eye.",
          "招聘者平均10秒扫一遍简历。与其罗列做过的事，不如先写'做了什么、取得什么成果'，才更抓眼。",
          "Nhà tuyển dụng lướt CV trong khoảng 10 giây. Thay vì liệt kê, hãy nêu bạn đã làm gì và kết quả ra sao — điều đó mới bắt mắt.",
          "採用担当は履歴書を平均10秒で流し読みします。やったことを並べるより『何をしてどんな成果を出したか』を前に出すと目に留まります。",
          "Perekrut memindai resume sekitar 10 detik. Daripada mendaftar tugas, tonjolkan apa yang kamu lakukan dan hasilnya — itu yang menarik perhatian."
        )
      },
      {
        emoji: "✍️",
        title: t("자기소개서, 읽히게 쓰는 법", "How to write a cover letter that gets read", "让人愿读的自我介绍", "Viết thư giới thiệu để được đọc", "読まれる自己紹介書の書き方", "Menulis surat lamaran yang dibaca"),
        body: t(
          "결론부터(두괄식) → 구체적 경험(1주차에 만든 강점 스토리 활용) → 이 회사·직무와 어떻게 연결되는지 순서로 쓰면 설득력이 생겨요.",
          "Conclusion first → a concrete example (use the strength story you built in Week 1) → how it connects to this company and role. That order makes it persuasive.",
          "先给结论 → 具体经验（用第1周的优势故事）→ 与公司和职务如何连接。这个顺序更有说服力。",
          "Kết luận trước → ví dụ cụ thể (dùng câu chuyện điểm mạnh Tuần 1) → cách nó gắn với công ty và nghề này. Thứ tự đó tạo sức thuyết phục.",
          "結論から → 具体的な経験（1週目の強みストーリーを活用）→ この会社・職務とどう繋がるか、の順で書くと説得力が出ます。",
          "Kesimpulan dulu → contoh konkret (pakai cerita kelebihan Minggu 1) → bagaimana terhubung ke perusahaan dan peran ini. Urutan itu membuatnya meyakinkan."
        )
      },
      {
        emoji: "🔢",
        title: t("숫자의 힘", "The power of numbers", "数字的力量", "Sức mạnh của con số", "数字の力", "Kekuatan angka"),
        body: t(
          "'열심히 했어요'보다 '3개월 만에 20% 줄였어요'가 훨씬 강해요. 정확하지 않아도 '대략'이라도 수치를 넣어보세요.",
          "'I worked hard' is weak next to 'cut it 20% in three months.' Even a rough number beats none — add an approximate figure.",
          "'我很努力'远不如'3个月减少20%'有力。即使不精确，也放个'大约'的数字。",
          "'Tôi đã cố gắng' yếu hơn nhiều so với 'giảm 20% trong 3 tháng'. Dù ước lượng cũng hơn không có — hãy thêm con số.",
          "『頑張りました』より『3か月で20%削減』の方がずっと強い。正確でなくても『おおよそ』の数字を入れてみて。",
          "'Saya bekerja keras' kalah kuat dari 'menekan 20% dalam 3 bulan'. Angka kasar pun lebih baik — tambahkan perkiraan."
        )
      },
      {
        emoji: "🇰🇷",
        title: t("외국인 지원자가 놓치기 쉬운 것", "What international applicants often miss", "外国申请者易忽略的", "Điều ứng viên nước ngoài hay bỏ sót", "外国人応募者が見落としがちな点", "Yang sering terlewat pelamar asing"),
        body: t(
          "비자(체류자격)와 한국어 수준을 이력서에 분명히 적어요. 한국식 이력서 형식(인적사항·사진 관행)도 미리 확인해두면 좋아요.",
          "State your visa status and Korean level clearly on your resume. It also helps to check the Korean resume format (personal details, photo conventions) in advance.",
          "在简历上写清签证和韩语水平。提前了解韩式简历格式（个人信息、照片惯例）也有帮助。",
          "Ghi rõ tình trạng visa và trình độ tiếng Hàn trên CV. Nên tìm hiểu trước định dạng CV kiểu Hàn (thông tin cá nhân, thói quen ảnh).",
          "ビザ（在留資格）と韓国語レベルを履歴書に明記しましょう。韓国式履歴書の形式（個人情報・写真の慣行）も事前に確認を。",
          "Cantumkan status visa dan level bahasa Korea dengan jelas di resume. Cek juga format resume ala Korea (data diri, kebiasaan foto) lebih awal."
        )
      }
    ];
  if (week === 3)
    return [
      {
        emoji: "🎤",
        title: t("면접은 암기가 아니라 대화", "An interview is a conversation, not a recital", "面试是对话不是背诵", "Phỏng vấn là trò chuyện, không phải học thuộc", "面接は暗記でなく対話", "Wawancara itu obrolan, bukan hafalan"),
        body: t(
          "답변을 통째로 외우면 오히려 어색해요. 핵심 메시지 하나 + 두괄식 구조만 잡아두고, 나머지는 자연스럽게 대화하세요.",
          "Memorizing whole answers sounds stiff. Fix one key message and a conclusion-first structure, then let the rest be a natural conversation.",
          "把答案整段背下来反而生硬。定好一个核心信息+先说结论的结构，其余自然对话即可。",
          "Học thuộc cả câu trả lời nghe cứng nhắc. Chốt một thông điệp chính + cấu trúc kết luận trước, phần còn lại cứ trò chuyện tự nhiên.",
          "答えを丸暗記すると逆に不自然です。核心メッセージ一つ＋結論先行の構成だけ決めて、あとは自然に会話しましょう。",
          "Menghafal seluruh jawaban terdengar kaku. Tetapkan satu pesan inti + struktur kesimpulan dulu, sisanya biarkan mengalir alami."
        )
      },
      {
        emoji: "🧩",
        title: t("자주 나오는 질문 유형", "Common question types", "常见问题类型", "Các dạng câu hỏi thường gặp", "よく出る質問タイプ", "Jenis pertanyaan yang sering muncul"),
        body: t(
          "자기소개·지원동기, 직무 경험(1주차 강점 스토리 재활용), 인성·컬처핏, 그리고 답을 파고드는 꼬리질문. 이번 주 모의면접에서 유형별로 연습해요.",
          "Self-intro & motivation, job experience (reuse your Week 1 strength stories), personality & culture fit, and follow-up probes. Practice each type in this week's mock interviews.",
          "自我介绍与动机、职务经验（复用第1周优势故事）、人品与文化契合，以及追问。本周用模拟面试逐类练习。",
          "Giới thiệu & động lực, kinh nghiệm nghề (dùng lại câu chuyện điểm mạnh Tuần 1), tính cách & phù hợp văn hóa, và câu hỏi đào sâu. Tuần này luyện từng dạng qua phỏng vấn thử.",
          "自己紹介・志望動機、職務経験（1週目の強みストーリーを再利用）、人柄・カルチャーフィット、そして掘り下げる追加質問。今週の模擬面接でタイプ別に練習しましょう。",
          "Perkenalan & motivasi, pengalaman kerja (pakai lagi cerita kelebihan Minggu 1), kepribadian & kecocokan budaya, dan pertanyaan lanjutan. Latih tiap jenis di wawancara simulasi minggu ini."
        )
      },
      {
        emoji: "💬",
        title: t("모르는 질문이 나오면", "When you get a question you don't know", "遇到不会的问题", "Khi gặp câu hỏi không biết", "分からない質問が来たら", "Saat dapat pertanyaan yang tak tahu"),
        body: t(
          "당황하지 마세요. '잠시 생각해봐도 될까요?'라고 시간을 요청해도 괜찮아요. 모르면 솔직하게, 배우려는 태도를 보이는 게 더 좋아요.",
          "Don't panic. It's fine to ask, 'May I take a moment to think?' If you don't know, be honest and show you're eager to learn — that reads better.",
          "别慌。可以说'我可以想一下吗？'。不会就坦诚，展现愿意学习的态度，反而更好。",
          "Đừng hoảng. Có thể nói 'Cho tôi suy nghĩ một chút nhé?'. Không biết thì thành thật và thể hiện tinh thần học hỏi — như vậy tốt hơn.",
          "慌てないで。『少し考えてもいいですか？』と時間を求めてOK。分からなければ正直に、学ぶ姿勢を見せる方が好印象です。",
          "Jangan panik. Boleh berkata, 'Boleh saya berpikir sebentar?'. Kalau tak tahu, jujur dan tunjukkan mau belajar — itu lebih baik."
        )
      },
      {
        emoji: "🇰🇷",
        title: t("한국 면접 매너 한 스푼", "A spoonful of Korean interview manners", "一勺韩国面试礼仪", "Một chút phép lịch sự phỏng vấn Hàn", "韓国面接マナーを少し", "Sesendok etika wawancara Korea"),
        body: t(
          "첫인상·인사·경어가 중요하고, 면접관은 '오래 함께 일할 사람인지'를 봐요. 자신감은 갖되 겸손한 태도를 유지하세요.",
          "First impressions, greetings, and polite speech matter; interviewers look for someone they can work with long-term. Be confident but stay humble.",
          "第一印象、问候、敬语很重要，面试官看你是否能长期共事。要自信但保持谦逊。",
          "Ấn tượng đầu, chào hỏi, kính ngữ đều quan trọng; nhà tuyển dụng tìm người gắn bó lâu dài. Tự tin nhưng vẫn khiêm tốn.",
          "第一印象・挨拶・敬語が大切で、面接官は『長く一緒に働ける人か』を見ます。自信を持ちつつ謙虚さを保ちましょう。",
          "Kesan pertama, sapaan, dan bahasa sopan penting; pewawancara mencari orang yang bisa diajak bekerja lama. Percaya diri tapi tetap rendah hati."
        )
      }
    ];
  if (week === 4)
    return [
      {
        emoji: "📝",
        title: t("틀린 답이 실력을 키운다", "Wrong answers build skill", "答错才长本事", "Câu trả lời sai giúp tiến bộ", "間違えた答えが力を伸ばす", "Jawaban salah menumbuhkan kemampuan"),
        body: t(
          "모의면접에서 약했던 답을 다시 다듬는 게 진짜 성장이에요. 오답노트로 약점을 하나씩 메꿔가요.",
          "Real growth comes from reworking the answers you were weak on in the mock interviews. Close your gaps one by one with the interview notes.",
          "把模拟面试中薄弱的回答重新打磨，才是真正的成长。用错题本逐个补齐弱点。",
          "Tiến bộ thật sự đến từ việc chỉnh lại những câu trả lời yếu trong phỏng vấn thử. Lấp từng điểm yếu bằng sổ sửa lỗi.",
          "模擬面接で弱かった答えを練り直すことが本当の成長です。復習ノートで弱点を一つずつ埋めましょう。",
          "Pertumbuhan nyata datang dari memperbaiki jawaban yang lemah di wawancara simulasi. Tutup celah satu per satu dengan catatan wawancara."
        )
      },
      {
        emoji: "🔁",
        title: t("같은 실수를 반복하지 않으려면", "To stop repeating the same mistake", "如何不再犯同样错误", "Để không lặp lại lỗi cũ", "同じミスを繰り返さないために", "Agar tak mengulang kesalahan"),
        body: t(
          "내 약점 패턴을 알고, 비슷한 질문으로 옮겨 연습하면 어떤 질문이 와도 흔들리지 않아요.",
          "Know your weak-spot patterns and practice transferring them to similar questions — then no question will throw you off.",
          "了解自己的薄弱模式，用相似问题迁移练习，遇到任何问题都不慌。",
          "Hiểu mẫu điểm yếu của mình và luyện chuyển sang câu hỏi tương tự — thì câu nào cũng không làm bạn chao đảo.",
          "自分の弱点パターンを知り、似た質問に置き換えて練習すれば、どんな質問でも動じません。",
          "Kenali pola titik lemahmu dan latih memindahkannya ke pertanyaan serupa — maka pertanyaan apa pun tak akan menggoyahkanmu."
        )
      },
      {
        emoji: "🚀",
        title: t("이제 실전 지원", "Now, apply for real", "现在实战投递", "Giờ ứng tuyển thật", "いよいよ実戦応募", "Kini, melamar sungguhan"),
        body: t(
          "완성한 이력서·자소서·면접 답변을 목표 기업과 공고에 맞춰 마지막으로 점검하고, 실제 지원으로 이어가요.",
          "Give your finished resume, cover letter, and interview answers a final check against your target companies and postings — then apply for real.",
          "把完成的简历、自我介绍、面试回答对照目标公司和职位做最后检查，然后真正投递。",
          "Kiểm tra lần cuối CV, thư và câu trả lời đã hoàn thiện theo công ty và tin tuyển mục tiêu — rồi ứng tuyển thật.",
          "完成した履歴書・自己紹介書・面接回答を目標企業と求人に合わせて最終チェックし、実際の応募につなげましょう。",
          "Periksa terakhir resume, surat, dan jawaban wawancara terhadap perusahaan dan lowongan target — lalu melamar sungguhan."
        )
      },
      {
        emoji: "🎓",
        title: t("완주, 그 다음", "After you finish", "完成之后", "Sau khi hoàn thành", "完走、その先", "Setelah selesai"),
        body: t(
          "4주는 끝이 아니라 시작이에요. 꾸준히 지원하고, 결과를 회고하며 다듬어가면 취업에 한 걸음씩 가까워져요.",
          "These four weeks are a start, not an end. Keep applying, reflect on the results, and refine — you'll get a step closer to a job each time.",
          "4周是开始不是结束。持续投递、复盘结果并改进，就会一步步接近就业。",
          "Bốn tuần này là khởi đầu, không phải kết thúc. Cứ ứng tuyển, nhìn lại kết quả và cải thiện — bạn sẽ tiến gần công việc từng bước.",
          "4週間は終わりでなく始まりです。応募を続け、結果を振り返って磨けば、就職に一歩ずつ近づきます。",
          "Empat minggu ini awal, bukan akhir. Teruslah melamar, refleksikan hasil, dan sempurnakan — kamu makin dekat ke pekerjaan tiap langkah."
        )
      }
    ];
  return [];
}

export function WeekLearn({ week }: { week: number }) {
  const t = useLaunchT();
  const cards = weekCards(t, week);
  const [open, setOpen] = useState<number | null>(0); // 첫 카드는 펼친 상태로 시작
  if (cards.length === 0) return null;

  return (
    <div>
      <SectionTitle sub={t("본격 시작 전에 2분만 읽어봐요", "A 2-minute read before you start", "开始前先花2分钟读一读", "Đọc 2 phút trước khi bắt đầu", "始める前に2分だけ読んでみて", "Baca 2 menit sebelum mulai")}>
        <span className="inline-flex items-center gap-1.5"><BookOpen className="h-[18px] w-[18px] text-[#0B46E8]" weight="fill" aria-hidden /> {t("이번 주 배우기", "This week's read", "本周学习", "Học tuần này", "今週の学び", "Bacaan minggu ini")}</span>
      </SectionTitle>
      <div className="mt-3 flex flex-col gap-2">
        {cards.map((c, i) => {
          const expanded = open === i;
          return (
            <div key={i} className={`overflow-hidden rounded-2xl border transition ${expanded ? "border-[#DDE7FB] bg-[#F8FAFF]" : "border-[#EEF1F5] bg-white"}`}>
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : i)}
                aria-expanded={expanded}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="text-[20px]" aria-hidden>{c.emoji}</span>
                <span className="min-w-0 flex-1 break-keep text-[14.5px] font-bold text-[#191F28]">{c.title}</span>
                <CaretDown className={`h-4 w-4 flex-none text-[#8B95A1] transition-transform ${expanded ? "rotate-180" : ""}`} weight="bold" aria-hidden />
              </button>
              {expanded ? (
                <p className="border-t border-[#E7EDFB] px-4 py-3.5 pl-[52px] text-[13.5px] leading-[1.75] text-[#4E5968] break-keep">{c.body}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

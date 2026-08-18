// Career Launch 정적 데이터(data.ts)의 화면 표시 문자열 다국어화.
// data.ts 는 로직 컨슈머(step-status 등)가 한국어 문자열을 기대하므로 원본 그대로 두고,
// 화면에 보이는 텍스트만 여기서 로케일별로 번역해 접근자 훅으로 제공한다.
// 번역 대상: WEEKS(주차 title/subtitle/goal, 스텝 title/desc), COMPLETION_CRITERIA,
//           RECOMMENDED_JOBS.reason, STUDENT.cohort. (CULTURE_LESSONS 는 별도 처리)
// 미제공/누락 로케일은 data.ts 의 한국어 원본으로 폴백한다.

import { useLanguage } from "../../components/i18n/LanguageProvider";
import { useCareerContentOverride } from "../../components/launch/content-provider";
import { type LT } from "./i18n";
import { WEEKS, COMPLETION_CRITERIA, RECOMMENDED_JOBS, STUDENT } from "./data";

type WeekField = "title" | "subtitle" | "goal";
type StepField = "title" | "desc";

// ── 주차 메타(title/subtitle/goal) ──
const WEEK_TEXT: Record<number, Record<WeekField, LT>> = {
  1: {
    title: {
      ko: "취업 가능성 진단 & 직무 방향 설정",
      en: "Career readiness check & choosing your direction",
      "zh-CN": "求职可能性诊断与职务方向设定",
      vi: "Đánh giá khả năng xin việc & xác định hướng nghề",
      ja: "就職可能性の診断＆職種の方向づけ",
      id: "Cek kesiapan kerja & menentukan arah karier"
    },
    subtitle: {
      ko: "지금 내 상태를 점검하고 목표 직무를 정해봐요",
      en: "Check where you are now and decide on a target job",
      "zh-CN": "检查你现在的状态，确定目标职务",
      vi: "Kiểm tra tình trạng hiện tại và chọn công việc mục tiêu",
      ja: "今の自分の状態を確認して、目標の職種を決めましょう",
      id: "Cek kondisimu sekarang dan tentukan pekerjaan target"
    },
    goal: {
      ko: "내 취업 준비 상태를 점검하고, 지원하고 싶은 직무를 3개 이내로 정해요. 다음 주 이력서에 담을 재료도 미리 모아봐요.",
      en: "Check how ready you are and pick up to 3 jobs you want to apply for. Also gather material for next week's resume.",
      "zh-CN": "检查你的求职准备情况，选出想申请的职务（不超过3个）。同时提前收集下周简历要用的素材。",
      vi: "Kiểm tra mức độ sẵn sàng và chọn tối đa 3 công việc bạn muốn ứng tuyển. Đồng thời thu thập trước tư liệu cho CV tuần sau.",
      ja: "就職準備の状態を確認し、応募したい職種を3つ以内で決めます。来週の履歴書に使う材料も先に集めておきましょう。",
      id: "Cek kesiapanmu dan pilih maksimal 3 pekerjaan yang ingin kamu lamar. Kumpulkan juga bahan untuk resume minggu depan."
    }
  },
  2: {
    title: {
      ko: "이력서 만들기",
      en: "Build your resume",
      "zh-CN": "制作简历",
      vi: "Tạo CV",
      ja: "履歴書を作る",
      id: "Membuat resume"
    },
    subtitle: {
      ko: "프로그램 안에서 바로 대표 이력서를 완성해봐요",
      en: "Finish your main resume right inside the program",
      "zh-CN": "在项目中直接完成你的代表简历",
      vi: "Hoàn thành CV chính ngay trong chương trình",
      ja: "プログラム内でそのまま代表履歴書を仕上げましょう",
      id: "Selesaikan resume utamamu langsung di dalam program"
    },
    goal: {
      ko: "기업에 낼 대표 이력서 초안을 완성해요. AI 진단으로 부족한 부분까지 채우면 든든한 이력서 한 부가 만들어져요.",
      en: "Finish a draft of the main resume you'll send to companies. Fill the gaps with AI feedback and you'll have one solid resume.",
      "zh-CN": "完成要投递给企业的代表简历初稿。用AI诊断补齐不足之处，就能做出一份扎实的简历。",
      vi: "Hoàn thành bản nháp CV chính để gửi cho doanh nghiệp. Bổ sung phần còn thiếu bằng đánh giá AI, bạn sẽ có một CV vững chắc.",
      ja: "企業に出す代表履歴書の下書きを仕上げます。AI診断で足りない部分まで補えば、しっかりした履歴書が1部できあがります。",
      id: "Selesaikan draf resume utama untuk dikirim ke perusahaan. Lengkapi bagian yang kurang dengan diagnosis AI, dan kamu punya satu resume yang kuat."
    }
  },
  3: {
    title: {
      ko: "자기소개서 만들기",
      en: "Write your cover letter",
      "zh-CN": "撰写自我介绍书",
      vi: "Viết thư giới thiệu bản thân",
      ja: "自己紹介書を作る",
      id: "Menulis surat lamaran"
    },
    subtitle: {
      ko: "지원 동기·강점 등 문항을 채워 자기소개서를 완성해요",
      en: "Fill in motivation, strengths and more to finish your cover letter",
      "zh-CN": "填写申请动机、优势等题目，完成自我介绍书",
      vi: "Điền động lực ứng tuyển, điểm mạnh… để hoàn thành thư giới thiệu",
      ja: "志望動機・強みなどの項目を埋めて自己紹介書を仕上げます",
      id: "Isi motivasi, kelebihan, dan lainnya untuk menyelesaikan surat lamaran"
    },
    goal: {
      ko: "목표 회사에 맞춘 자기소개서를 완성하고, 이력서와 서로 어울리게 다듬어 이력서·자기소개서 완성본을 만들어요.",
      en: "Finish a cover letter tailored to your target company, then polish it to match your resume so both come together as a finished set.",
      "zh-CN": "完成针对目标公司的自我介绍书，并与简历相互协调地润色，做出简历与自我介绍书的完成版。",
      vi: "Hoàn thành thư giới thiệu phù hợp với công ty mục tiêu, rồi trau chuốt cho ăn khớp với CV để tạo bộ CV và thư giới thiệu hoàn chỉnh.",
      ja: "目標の会社に合わせた自己紹介書を仕上げ、履歴書と互いに調和するよう整えて、履歴書・自己紹介書の完成版を作ります。",
      id: "Selesaikan surat lamaran yang sesuai dengan perusahaan target, lalu poles agar selaras dengan resume sehingga menjadi paket resume dan surat lamaran yang lengkap."
    }
  },
  4: {
    title: {
      ko: "완성 & 면접 준비",
      en: "Finalize & prepare for interviews",
      "zh-CN": "完善与面试准备",
      vi: "Hoàn thiện & chuẩn bị phỏng vấn",
      ja: "仕上げ＆面接準備",
      id: "Finalisasi & persiapan wawancara"
    },
    subtitle: {
      ko: "완성한 서류로 면접을 준비하고 스스로 지원할 힘을 길러요",
      en: "Prepare for interviews with your finished documents and build the confidence to apply on your own",
      "zh-CN": "用完成的材料准备面试，培养独立投递的能力",
      vi: "Chuẩn bị phỏng vấn bằng hồ sơ đã hoàn thành và rèn khả năng tự ứng tuyển",
      ja: "仕上げた書類で面接を準備し、自分で応募できる力を養います",
      id: "Bersiap wawancara dengan dokumen yang sudah jadi dan bangun kemampuan melamar sendiri"
    },
    goal: {
      ko: "이력서·자기소개서를 최종 점검하고, 자기소개·직무·인성 면접을 유형별로 직접 연습해요. 스스로 지원할 수 있도록 실전 감각까지 갖추는 마무리 단계예요!",
      en: "Do a final review of your resume and cover letter, and practice self-intro, job, and personality interviews by type. This is the wrap-up step that gives you real interview sense so you can apply on your own!",
      "zh-CN": "对简历和自我介绍书做最终检查，并按类型亲自练习自我介绍面试、职务面试和人性面试。这是让你具备实战感、能够独立投递的收尾阶段！",
      vi: "Kiểm tra lần cuối CV và thư giới thiệu, rồi tự luyện phỏng vấn giới thiệu bản thân, chuyên môn và tính cách theo từng loại. Đây là bước cuối giúp bạn có cảm giác thực chiến để tự ứng tuyển!",
      ja: "履歴書・自己紹介書を最終確認し、自己紹介・職務・人物面接をタイプ別に自分で練習します。自分で応募できるよう実戦感覚まで身につける仕上げの段階です！",
      id: "Lakukan pemeriksaan akhir resume dan surat lamaran, lalu latih wawancara perkenalan diri, teknis, dan kepribadian per jenis. Ini langkah penutup yang membekalimu rasa nyata agar bisa melamar sendiri!"
    }
  }
};

// ── 스텝 메타(title/desc), 스텝 id 로 키 ──
const STEP_TEXT: Record<string, Record<StepField, LT>> = {
  // Week 1
  w1s1: {
    title: {
      ko: "취업 준비 상태 자가진단",
      en: "Self-check your job readiness",
      "zh-CN": "求职准备状态自我诊断",
      vi: "Tự đánh giá mức độ sẵn sàng tìm việc",
      ja: "就職準備状態のセルフ診断",
      id: "Diagnosis mandiri kesiapan kerja"
    },
    desc: {
      ko: "경력·어학·비자·직무 이해도 등 지금 내 준비 상태를 스스로 점검해봐요. 어디를 채우면 좋을지 방향이 보여요.",
      en: "Check your own readiness — experience, language, visa, job understanding, and more. You'll see where to focus next.",
      "zh-CN": "自己检查经历、语言、签证、职务理解等当前准备状态。你会看到该补哪里的方向。",
      vi: "Tự kiểm tra mức độ sẵn sàng của bạn — kinh nghiệm, ngoại ngữ, visa, hiểu biết về công việc… Bạn sẽ thấy nên bổ sung ở đâu.",
      ja: "経歴・語学・ビザ・職務理解など、今の準備状態を自分で点検します。どこを補えばよいか方向が見えてきます。",
      id: "Cek sendiri kesiapanmu — pengalaman, bahasa, visa, pemahaman pekerjaan, dan lainnya. Kamu akan tahu bagian mana yang perlu dilengkapi."
    }
  },
  w1s2: {
    title: {
      ko: "관심 직무 3개 선정",
      en: "Pick 3 jobs you're interested in",
      "zh-CN": "选出3个感兴趣的职务",
      vi: "Chọn 3 công việc bạn quan tâm",
      ja: "興味のある職種を3つ選定",
      id: "Pilih 3 pekerjaan yang kamu minati"
    },
    desc: {
      ko: "AI와 대화하며 나에게 어울리는 직무를 찾아봐요. 추천받은 직무 중 마음이 가는 걸 3개 이내로 골라요.",
      en: "Chat with AI to find jobs that fit you. From the recommendations, pick up to 3 that appeal to you.",
      "zh-CN": "与AI对话，找到适合你的职务。从推荐的职务中选出最多3个你心仪的。",
      vi: "Trò chuyện với AI để tìm công việc phù hợp với bạn. Từ các gợi ý, chọn tối đa 3 công việc bạn thích.",
      ja: "AIと対話して自分に合う職種を探します。おすすめの中から気になるものを3つ以内で選びましょう。",
      id: "Ngobrol dengan AI untuk menemukan pekerjaan yang cocok. Dari rekomendasi, pilih maksimal 3 yang menarik bagimu."
    }
  },
  w1s3: {
    title: {
      ko: "선정 직무 깊이 알기",
      en: "Learn your chosen jobs in depth",
      "zh-CN": "深入了解所选职务",
      vi: "Tìm hiểu sâu về công việc đã chọn",
      ja: "選んだ職種を深く知る",
      id: "Pahami pekerjaan pilihanmu lebih dalam"
    },
    desc: {
      ko: "고른 직무가 실제로 어떤 일을 하고, 어떤 역량·자격이 필요한지 AI와 알아봐요. 뭘 준비하면 좋을지 방향이 잡혀요.",
      en: "Explore with AI what your chosen jobs actually do and what skills and qualifications they need. You'll see what to prepare.",
      "zh-CN": "和AI一起了解所选职务实际做什么、需要哪些能力和资格。你会明确该准备什么。",
      vi: "Cùng AI tìm hiểu công việc đã chọn thực sự làm gì, cần năng lực và bằng cấp gì. Bạn sẽ biết nên chuẩn bị điều gì.",
      ja: "選んだ職種が実際にどんな仕事で、どんな力・資格が必要かをAIと調べます。何を準備すればよいか方向が定まります。",
      id: "Jelajahi bersama AI apa yang sebenarnya dikerjakan pekerjaan pilihanmu dan keterampilan serta kualifikasi apa yang dibutuhkan. Kamu akan tahu apa yang perlu disiapkan."
    }
  },
  w1s4: {
    title: {
      ko: "한국 기업문화 이해",
      en: "Understand Korean company culture",
      "zh-CN": "了解韩国企业文化",
      vi: "Hiểu văn hóa doanh nghiệp Hàn Quốc",
      ja: "韓国の企業文化を理解する",
      id: "Memahami budaya perusahaan Korea"
    },
    desc: {
      ko: "한국의 채용 방식과 직장 문화를 먼저 이해해두면 이력서·면접 준비의 방향이 잡혀요.",
      en: "Understanding Korean hiring and workplace culture first will guide how you prepare your resume and interviews.",
      "zh-CN": "先了解韩国的招聘方式和职场文化，就能把握简历和面试准备的方向。",
      vi: "Hiểu trước cách tuyển dụng và văn hóa công sở Hàn Quốc sẽ định hướng cách bạn chuẩn bị CV và phỏng vấn.",
      ja: "韓国の採用方式と職場文化を先に理解しておくと、履歴書・面接準備の方向が定まります。",
      id: "Memahami cara rekrutmen dan budaya kerja Korea lebih dulu akan mengarahkan cara kamu menyiapkan resume dan wawancara."
    }
  },
  // Week 2
  "w2-basic": {
    title: {
      ko: "기본정보·한줄소개",
      en: "Basic info & one-line intro",
      "zh-CN": "基本信息·一句话介绍",
      vi: "Thông tin cơ bản & giới thiệu một dòng",
      ja: "基本情報・一言紹介",
      id: "Info dasar & perkenalan satu baris"
    },
    desc: {
      ko: "이름·연락처와 나를 한 줄로 소개하는 문장을 AI와 대화하며 정리해요. 이력서 맨 위 첫인상이에요.",
      en: "Organize your name, contact, and a one-line self-intro by chatting with AI. This is the first impression at the top of your resume.",
      "zh-CN": "与AI对话整理姓名、联系方式和一句话自我介绍。这是简历最上方的第一印象。",
      vi: "Sắp xếp tên, liên hệ và câu giới thiệu một dòng bằng cách trò chuyện với AI. Đây là ấn tượng đầu tiên ở đầu CV.",
      ja: "名前・連絡先と自分を一言で紹介する文をAIと対話しながら整理します。履歴書の一番上、第一印象です。",
      id: "Rapikan nama, kontak, dan perkenalan satu baris lewat obrolan dengan AI. Ini kesan pertama di bagian atas resume."
    }
  },
  "w2-edu": {
    title: {
      ko: "학력",
      en: "Education",
      "zh-CN": "学历",
      vi: "Học vấn",
      ja: "学歴",
      id: "Pendidikan"
    },
    desc: {
      ko: "학교·전공·학위·재학 기간을 대화로 정리해요. 최신 학력부터 순서대로 담아요.",
      en: "Organize your school, major, degree, and dates through conversation. List from the most recent first.",
      "zh-CN": "通过对话整理学校、专业、学位和在读时间。从最新的学历开始按顺序填写。",
      vi: "Sắp xếp trường, chuyên ngành, bằng cấp và thời gian học qua trò chuyện. Ghi từ học vấn mới nhất trước.",
      ja: "学校・専攻・学位・在学期間を対話で整理します。新しい学歴から順に入れましょう。",
      id: "Rapikan sekolah, jurusan, gelar, dan masa studi lewat percakapan. Tulis dari pendidikan terbaru dulu."
    }
  },
  "w2-exp": {
    title: {
      ko: "경력 (회사 경력)",
      en: "Work experience",
      "zh-CN": "工作经历",
      vi: "Kinh nghiệm làm việc",
      ja: "職歴（会社経歴）",
      id: "Pengalaman kerja"
    },
    desc: {
      ko: "정규직·계약직·인턴 등 회사에 소속되어 일한 명확한 회사 경력을 AI와 대화하며 정리해요. 성과를 숫자로 표현하면 훨씬 눈에 잘 띄어요.",
      en: "Organize your clear company work experience — full-time, contract, or internship roles — by chatting with AI. Numbers make your results stand out much more.",
      "zh-CN": "与AI对话整理你在公司任职的明确工作经历（正式、合同或实习）。用数字表达成果会更加醒目。",
      vi: "Sắp xếp kinh nghiệm làm việc rõ ràng tại công ty — chính thức, hợp đồng hay thực tập — bằng cách trò chuyện với AI. Diễn đạt thành quả bằng con số sẽ nổi bật hơn.",
      ja: "正社員・契約・インターンなど会社に所属して働いた明確な会社経歴をAIと対話しながら整理します。成果を数字で表すとぐっと目立ちます。",
      id: "Rapikan pengalaman kerja perusahaan yang jelas — purnawaktu, kontrak, atau magang — lewat obrolan dengan AI. Menyatakan hasil dengan angka membuatnya jauh lebih menonjol."
    }
  },
  "w2-exp-other": {
    title: {
      ko: "활동·프로젝트",
      en: "Activities & projects",
      "zh-CN": "活动·项目",
      vi: "Hoạt động & dự án",
      ja: "活動・プロジェクト",
      id: "Aktivitas & proyek"
    },
    desc: {
      ko: "아르바이트·프로젝트·동아리·대외활동·봉사 등 회사 경력 외의 경험을 대화로 풀어내요. 신입에게는 이 경험도 큰 강점이에요.",
      en: "Unpack experiences beyond company work — part-time jobs, projects, clubs, activities, volunteering — by chatting. For new grads, these are a big strength too.",
      "zh-CN": "通过对话展开公司经历以外的经验，如兼职、项目、社团、对外活动、志愿服务等。对应届生来说，这些经验也是很大的优势。",
      vi: "Khai thác các trải nghiệm ngoài công việc công ty — làm thêm, dự án, câu lạc bộ, hoạt động, tình nguyện — bằng cách trò chuyện. Với tân cử nhân, đây cũng là lợi thế lớn.",
      ja: "アルバイト・プロジェクト・サークル・課外活動・ボランティアなど会社経歴以外の経験を対話で書き出します。新卒にはこの経験も大きな強みです。",
      id: "Uraikan pengalaman di luar kerja perusahaan — kerja paruh waktu, proyek, klub, kegiatan, sukarela — lewat obrolan. Bagi lulusan baru, ini juga kelebihan besar."
    }
  },
  "w2-skill": {
    title: {
      ko: "스킬",
      en: "Skills",
      "zh-CN": "技能",
      vi: "Kỹ năng",
      ja: "スキル",
      id: "Keterampilan"
    },
    desc: {
      ko: "직무에 쓰는 기술·툴을 대화로 정리해요. 지원 직무와 맞닿은 스킬을 앞세워요.",
      en: "Organize the skills and tools you use for the job through conversation. Put the ones closest to your target job first.",
      "zh-CN": "通过对话整理职务中使用的技术和工具。把与申请职务最相关的技能放在前面。",
      vi: "Sắp xếp kỹ năng và công cụ dùng cho công việc qua trò chuyện. Đưa những kỹ năng sát với công việc ứng tuyển lên trước.",
      ja: "職務で使う技術・ツールを対話で整理します。応募職種に直結するスキルを前に出しましょう。",
      id: "Rapikan keterampilan dan alat yang kamu pakai untuk pekerjaan lewat percakapan. Utamakan yang paling dekat dengan pekerjaan targetmu."
    }
  },
  "w2-lang": {
    title: {
      ko: "어학",
      en: "Languages",
      "zh-CN": "语言能力",
      vi: "Ngoại ngữ",
      ja: "語学",
      id: "Kemampuan bahasa"
    },
    desc: {
      ko: "구사 언어와 수준(TOPIK 등 자격 포함)을 대화로 정리해요. 유학생의 강력한 강점이에요.",
      en: "Organize the languages you speak and their levels (including TOPIK and other certificates) through conversation. This is a strong advantage for international students.",
      "zh-CN": "通过对话整理你会的语言及水平（含TOPIK等资格）。这是留学生的强大优势。",
      vi: "Sắp xếp các ngôn ngữ bạn nói và trình độ (gồm TOPIK và chứng chỉ khác) qua trò chuyện. Đây là lợi thế mạnh của du học sinh.",
      ja: "話せる言語とレベル（TOPIKなどの資格含む）を対話で整理します。留学生の強力な強みです。",
      id: "Rapikan bahasa yang kamu kuasai dan tingkatnya (termasuk TOPIK dan sertifikat lain) lewat percakapan. Ini kelebihan besar mahasiswa asing."
    }
  },
  w2s4: {
    title: {
      ko: "한국식 이력서 매너",
      en: "Korean resume etiquette",
      "zh-CN": "韩式简历礼仪",
      vi: "Phép tắc CV kiểu Hàn",
      ja: "韓国式履歴書のマナー",
      id: "Etika resume ala Korea"
    },
    desc: {
      ko: "사진·양식·표현 등 한국 이력서에서 지켜야 할 것과 피해야 할 것을 알아둬요.",
      en: "Learn the do's and don'ts of Korean resumes — photo, format, wording, and more.",
      "zh-CN": "了解韩国简历中该遵守和该避免的事项，如照片、格式、表达等。",
      vi: "Nắm những điều nên và không nên trong CV Hàn Quốc — ảnh, định dạng, cách diễn đạt…",
      ja: "写真・書式・表現など、韓国の履歴書で守るべきこと・避けるべきことを知っておきましょう。",
      id: "Pelajari hal yang harus dan tidak boleh dalam resume Korea — foto, format, ungkapan, dan lainnya."
    }
  },
  // Week 3
  "w3-motive": {
    title: {
      ko: "지원 동기",
      en: "Motivation to apply",
      "zh-CN": "申请动机",
      vi: "Động lực ứng tuyển",
      ja: "志望動機",
      id: "Motivasi melamar"
    },
    desc: {
      ko: "왜 이 직무·회사에 지원하는지 AI와 대화하며 지원 동기 문항을 채워요.",
      en: "Fill in the motivation question by chatting with AI about why you're applying to this job and company.",
      "zh-CN": "与AI对话，说明为何申请该职务和公司，填写申请动机题目。",
      vi: "Điền câu hỏi động lực bằng cách trò chuyện với AI về lý do bạn ứng tuyển công việc và công ty này.",
      ja: "なぜこの職務・会社に応募するのかをAIと対話しながら志望動機の項目を埋めます。",
      id: "Isi pertanyaan motivasi lewat obrolan dengan AI tentang alasan kamu melamar pekerjaan dan perusahaan ini."
    }
  },
  "w3-growth": {
    title: {
      ko: "성장 과정",
      en: "Your background story",
      "zh-CN": "成长经历",
      vi: "Quá trình trưởng thành",
      ja: "成長過程",
      id: "Perjalanan pertumbuhan"
    },
    desc: {
      ko: "지금의 나를 만든 경험을 대화로 풀어 성장 과정 문항을 채워요.",
      en: "Fill in the background question by talking through the experiences that shaped who you are today.",
      "zh-CN": "通过对话展开塑造今日之你的经历，填写成长经历题目。",
      vi: "Điền câu hỏi quá trình trưởng thành bằng cách kể lại những trải nghiệm đã tạo nên bạn hôm nay.",
      ja: "今の自分を作った経験を対話で解きほぐし、成長過程の項目を埋めます。",
      id: "Isi pertanyaan perjalanan pertumbuhan dengan menceritakan pengalaman yang membentuk dirimu hari ini."
    }
  },
  "w3-strength": {
    title: {
      ko: "성격의 장단점·강점",
      en: "Strengths & weaknesses",
      "zh-CN": "性格优缺点·优势",
      vi: "Ưu nhược điểm & điểm mạnh",
      ja: "性格の長所・短所・強み",
      id: "Kelebihan & kekurangan"
    },
    desc: {
      ko: "직무에 살릴 강점과 보완점을 구체적 사례로 대화하며 정리해요.",
      en: "Organize the strengths you'll use on the job and areas to improve, with concrete examples, through conversation.",
      "zh-CN": "通过对话，用具体事例整理可用于职务的优势和需要改进之处。",
      vi: "Sắp xếp điểm mạnh có thể phát huy trong công việc và điểm cần cải thiện bằng ví dụ cụ thể qua trò chuyện.",
      ja: "職務に活かせる強みと補うべき点を具体的な事例で対話しながら整理します。",
      id: "Rapikan kelebihan yang bisa kamu manfaatkan di pekerjaan dan hal yang perlu diperbaiki, dengan contoh nyata lewat percakapan."
    }
  },
  "w3-aspiration": {
    title: {
      ko: "입사 후 포부",
      en: "Goals after joining",
      "zh-CN": "入职后的抱负",
      vi: "Hoài bão sau khi vào công ty",
      ja: "入社後の抱負",
      id: "Cita-cita setelah bergabung"
    },
    desc: {
      ko: "입사 후 이루고 싶은 목표와 회사에 줄 기여를 대화로 구체화해요.",
      en: "Flesh out, through conversation, the goals you want to achieve after joining and how you'll contribute to the company.",
      "zh-CN": "通过对话具体描述入职后想实现的目标以及能为公司带来的贡献。",
      vi: "Cụ thể hóa qua trò chuyện những mục tiêu bạn muốn đạt được sau khi vào làm và đóng góp cho công ty.",
      ja: "入社後に達成したい目標と会社への貢献を対話で具体化します。",
      id: "Perjelas lewat percakapan tujuan yang ingin kamu capai setelah bergabung dan kontribusimu bagi perusahaan."
    }
  },
  w3s4: {
    title: {
      ko: "비즈니스 커뮤니케이션 예절",
      en: "Business communication etiquette",
      "zh-CN": "商务沟通礼仪",
      vi: "Phép tắc giao tiếp trong công việc",
      ja: "ビジネスコミュニケーションのマナー",
      id: "Etika komunikasi bisnis"
    },
    desc: {
      ko: "존댓말·호칭, 이메일 형식, 회신 매너 등 한국 직장의 소통 예절을 익혀요.",
      en: "Learn Korean workplace communication etiquette — honorifics and titles, email format, reply manners, and more.",
      "zh-CN": "学习韩国职场的沟通礼仪，如敬语、称呼、邮件格式、回复礼仪等。",
      vi: "Học phép giao tiếp nơi công sở Hàn Quốc — kính ngữ và cách xưng hô, định dạng email, cách hồi đáp…",
      ja: "敬語・呼称、メール形式、返信マナーなど韓国の職場での意思疎通のマナーを身につけます。",
      id: "Pelajari etika komunikasi kerja Korea — bahasa hormat dan sapaan, format email, tata cara membalas, dan lainnya."
    }
  },
  // Week 4
  w4s1: {
    title: {
      ko: "이력서·자기소개서 최종 점검",
      en: "Final review of resume & cover letter",
      "zh-CN": "简历·自我介绍书最终检查",
      vi: "Kiểm tra cuối CV & thư giới thiệu",
      ja: "履歴書・自己紹介書の最終確認",
      id: "Pemeriksaan akhir resume & surat lamaran"
    },
    desc: {
      ko: "완성한 이력서와 자기소개서를 확인하고, 고치고 싶은 곳은 각각 수정하기로 해당 주차에서 다듬어요.",
      en: "Review your finished resume and cover letter, and polish anything you want to change in each relevant week.",
      "zh-CN": "检查已完成的简历和自我介绍书，想修改的地方可到相应周次分别润色。",
      vi: "Xem lại CV và thư giới thiệu đã hoàn thành, chỗ nào muốn sửa thì chỉnh lại ở tuần tương ứng.",
      ja: "仕上げた履歴書と自己紹介書を確認し、直したい箇所はそれぞれ該当の週で整えます。",
      id: "Tinjau resume dan surat lamaran yang sudah selesai, dan poles bagian yang ingin diubah di minggu terkait masing-masing."
    }
  },
  "w4-self": {
    title: {
      ko: "자기소개 면접",
      en: "Self-introduction interview",
      "zh-CN": "自我介绍面试",
      vi: "Phỏng vấn giới thiệu bản thân",
      ja: "自己紹介面接",
      id: "Wawancara perkenalan diri"
    },
    desc: {
      ko: "AI 면접관이 1분 자기소개·지원 동기·성격을 물어봐요. 직접 답하며 첫인상 라운드를 연습해요.",
      en: "An AI interviewer asks for a 1-minute self-intro, your motivation, and your personality. Answer them and practice the first-impression round.",
      "zh-CN": "AI面试官会问1分钟自我介绍、申请动机和性格。亲自作答，练习第一印象环节。",
      vi: "Người phỏng vấn AI hỏi phần giới thiệu 1 phút, động lực ứng tuyển và tính cách. Hãy trả lời và luyện vòng tạo ấn tượng đầu.",
      ja: "AI面接官が1分自己紹介・志望動機・性格を尋ねます。自分で答えながら第一印象のラウンドを練習します。",
      id: "Pewawancara AI menanyakan perkenalan diri 1 menit, motivasi, dan kepribadianmu. Jawab langsung dan latih ronde kesan pertama."
    }
  },
  "w4-job": {
    title: {
      ko: "직무 면접",
      en: "Job/technical interview",
      "zh-CN": "职务面试",
      vi: "Phỏng vấn chuyên môn",
      ja: "職務面接",
      id: "Wawancara teknis pekerjaan"
    },
    desc: {
      ko: "선정 직무와 이력서의 경력·프로젝트를 파고드는 실무 면접이에요. 구체적 경험을 답하며 연습해요.",
      en: "A hands-on interview that digs into your chosen job and the experience and projects on your resume. Practice by answering with concrete examples.",
      "zh-CN": "深挖所选职务及简历中经历、项目的实务面试。用具体经验作答来练习。",
      vi: "Buổi phỏng vấn thực tế đào sâu vào công việc đã chọn cùng kinh nghiệm và dự án trong CV. Luyện bằng cách trả lời với trải nghiệm cụ thể.",
      ja: "選んだ職種と履歴書の経歴・プロジェクトを掘り下げる実務面接です。具体的な経験を答えながら練習します。",
      id: "Wawancara praktis yang menggali pekerjaan pilihanmu serta pengalaman dan proyek di resume. Latih dengan menjawab pakai contoh nyata."
    }
  },
  "w4-fit": {
    title: {
      ko: "인성·컬처핏 면접",
      en: "Personality & culture-fit interview",
      "zh-CN": "人性·文化契合面试",
      vi: "Phỏng vấn tính cách & phù hợp văn hóa",
      ja: "人物・カルチャーフィット面接",
      id: "Wawancara kepribadian & kecocokan budaya"
    },
    desc: {
      ko: "협업·가치관·한국 적응(한국어·비자·근속)을 보는 면접이에요. 태도와 진정성을 답하며 연습해요.",
      en: "An interview about collaboration, values, and adapting to Korea (Korean, visa, staying long-term). Practice by answering with attitude and sincerity.",
      "zh-CN": "考察协作、价值观和在韩适应（韩语、签证、长期任职）的面试。用态度和真诚作答来练习。",
      vi: "Buổi phỏng vấn về hợp tác, giá trị quan và khả năng thích nghi ở Hàn (tiếng Hàn, visa, gắn bó lâu dài). Luyện bằng cách trả lời với thái độ và sự chân thành.",
      ja: "協働・価値観・韓国への適応（韓国語・ビザ・勤続）を見る面接です。態度と誠実さで答えながら練習します。",
      id: "Wawancara soal kolaborasi, nilai, dan adaptasi di Korea (bahasa Korea, visa, bertahan lama). Latih dengan menjawab penuh sikap dan ketulusan."
    }
  },
  "w4-apply": {
    title: {
      ko: "스스로 지원하는 법",
      en: "How to apply on your own",
      "zh-CN": "如何独立投递",
      vi: "Cách tự ứng tuyển",
      ja: "自分で応募する方法",
      id: "Cara melamar sendiri"
    },
    desc: {
      ko: "외국인 채용 공고를 찾는 곳, E-7 비자 지원 가능 기업, 지원 전략과 체크리스트까지 — 직접 지원할 수 있게 정리해요.",
      en: "Where to find job postings for foreigners, companies that support the E-7 visa, application strategies, and a checklist — everything you need to apply on your own.",
      "zh-CN": "从寻找外国人招聘信息的渠道、可支持E-7签证的企业，到投递策略和清单——整理好让你能够独立投递。",
      vi: "Nơi tìm tin tuyển dụng cho người nước ngoài, các công ty hỗ trợ visa E-7, chiến lược ứng tuyển và checklist — tất cả để bạn tự ứng tuyển được.",
      ja: "外国人向け求人を探す場所、E-7ビザを支援する企業、応募戦略やチェックリストまで──自分で応募できるように整理します。",
      id: "Tempat mencari lowongan untuk orang asing, perusahaan yang mendukung visa E-7, strategi lamaran hingga checklist — dirapikan agar kamu bisa melamar sendiri."
    }
  },
  w4s4: {
    title: {
      ko: "면접 예절 & 입사 매너",
      en: "Interview etiquette & onboarding manners",
      "zh-CN": "面试礼仪与入职礼节",
      vi: "Phép tắc phỏng vấn & lễ nghi nhập công ty",
      ja: "面接マナー＆入社マナー",
      id: "Etika wawancara & tata krama masuk kerja"
    },
    desc: {
      ko: "복장·인사·시간 약속·감사 메일까지, 면접과 입사 첫인상을 좌우하는 매너를 알아둬요.",
      en: "Learn the manners that shape first impressions at interviews and on joining — dress, greetings, punctuality, and thank-you emails.",
      "zh-CN": "了解左右面试和入职第一印象的礼节，从着装、问候、守时到感谢邮件。",
      vi: "Nắm những phép tắc quyết định ấn tượng đầu khi phỏng vấn và nhập công ty — trang phục, chào hỏi, đúng giờ, email cảm ơn.",
      ja: "服装・挨拶・時間厳守・お礼メールまで、面接と入社の第一印象を左右するマナーを知っておきましょう。",
      id: "Pelajari tata krama yang menentukan kesan pertama saat wawancara dan masuk kerja — pakaian, sapaan, ketepatan waktu, hingga email terima kasih."
    }
  },
  "w4-final-diagnosis": {
    title: {
      ko: "수료 진단",
      en: "Completion diagnosis",
      "zh-CN": "结业诊断",
      vi: "Chẩn đoán hoàn thành",
      ja: "修了診断",
      id: "Diagnosis kelulusan"
    },
    desc: {
      ko: "처음 받았던 취업 준비 자가진단을 다시 받아, 4주 동안 얼마나 성장했는지 확인해요. 학교에 제출하는 성과 리포트의 근거가 돼요.",
      en: "Retake the initial job-readiness self-diagnosis to see how much you've grown over 4 weeks. It becomes the basis of the outcome report submitted to your school.",
      "zh-CN": "重新进行最初的求职准备自我诊断，确认这4周成长了多少。这将成为提交给学校的成果报告的依据。",
      vi: "Làm lại bài tự chẩn đoán mức độ sẵn sàng tìm việc ban đầu để xem bạn đã tiến bộ bao nhiêu sau 4 tuần. Đây là cơ sở cho báo cáo kết quả gửi về trường.",
      ja: "最初に受けた就職準備セルフ診断をもう一度受け、4週間でどれだけ成長したか確認します。学校に提出する成果レポートの根拠になります。",
      id: "Ulangi diagnosis mandiri kesiapan kerja awal untuk melihat seberapa besar perkembanganmu selama 4 minggu. Ini menjadi dasar laporan hasil yang diserahkan ke kampusmu."
    }
  }
};

// ── 수료 조건(순서 = data.ts 배열 순서) ──
const COMPLETION_TEXT: LT[] = [
  {
    ko: "4주 미션 모두 완료하기",
    en: "Complete all 4 weeks of missions",
    "zh-CN": "完成全部4周的任务",
    vi: "Hoàn thành toàn bộ nhiệm vụ 4 tuần",
    ja: "4週間のミッションをすべて完了する",
    id: "Selesaikan semua misi 4 minggu"
  },
  {
    ko: "세미나 3회 이상 참석하기",
    en: "Attend at least 3 seminars",
    "zh-CN": "参加3次以上研讨会",
    vi: "Tham dự ít nhất 3 buổi hội thảo",
    ja: "セミナーに3回以上参加する",
    id: "Hadiri minimal 3 seminar"
  },
  {
    ko: "이력서·자기소개서 완성하고 기업에 지원하기",
    en: "Finish your resume and cover letter and apply to a company",
    "zh-CN": "完成简历和自我介绍书并向企业投递",
    vi: "Hoàn thành CV, thư giới thiệu và ứng tuyển vào doanh nghiệp",
    ja: "履歴書・自己紹介書を仕上げて企業に応募する",
    id: "Selesaikan resume dan surat lamaran, lalu lamar ke perusahaan"
  }
];

// ── 추천 직무 이유(reason), 직무 id 로 키 ──
const JOB_REASON: Record<string, LT> = {
  rj3: {
    ko: "커뮤니케이션 강점과 꼼꼼함이 잘 어울려요. 글로벌 고객을 대응하는 팀에서 선호해요.",
    en: "Fits well if you're strong at communication and detail. Teams handling global customers prefer this.",
    "zh-CN": "很适合沟通能力强、做事细心的你。服务全球客户的团队很青睐。",
    vi: "Phù hợp nếu bạn mạnh về giao tiếp và tỉ mỉ. Các nhóm phục vụ khách hàng toàn cầu rất ưa chuộng.",
    ja: "コミュニケーションの強みと丁寧さがよく合います。グローバル顧客に対応するチームで好まれます。",
    id: "Cocok jika kamu kuat dalam komunikasi dan teliti. Tim yang melayani pelanggan global menyukainya."
  },
  rj9: {
    ko: "언어 강점을 바로 살릴 수 있어요. 글로벌 협업이 많은 조직에서 수요가 있어요.",
    en: "You can use your language strengths right away. In demand at organizations with lots of global collaboration.",
    "zh-CN": "能立刻发挥你的语言优势。国际协作多的组织有需求。",
    vi: "Bạn có thể phát huy ngay thế mạnh ngôn ngữ. Nhiều nhu cầu ở các tổ chức hợp tác toàn cầu.",
    ja: "語学の強みをすぐに活かせます。グローバルな協業が多い組織で需要があります。",
    id: "Kamu bisa langsung memanfaatkan kelebihan bahasamu. Banyak dicari di organisasi dengan kolaborasi global."
  },
  rj10: {
    ko: "서버·API·데이터베이스를 설계하고 만드는 직무예요. 컴퓨터공학·개발 경험이 있다면 강점이 커요.",
    en: "You design and build servers, APIs, and databases. A big advantage if you have computer-science or dev experience.",
    "zh-CN": "设计和构建服务器、API、数据库的职务。若有计算机或开发经验，优势很大。",
    vi: "Công việc thiết kế và xây dựng server, API, cơ sở dữ liệu. Là lợi thế lớn nếu bạn có kinh nghiệm CNTT hoặc lập trình.",
    ja: "サーバー・API・データベースを設計して作る職務です。コンピュータ工学・開発経験があれば強みが大きいです。",
    id: "Kamu merancang dan membangun server, API, dan basis data. Nilai plus besar jika punya pengalaman ilmu komputer atau dev."
  },
  rj11: {
    ko: "사용자가 보는 화면을 만드는 직무예요. 웹·UI 구현에 관심이 있다면 잘 맞아요.",
    en: "You build the screens users see. A good fit if you're interested in web and UI development.",
    "zh-CN": "制作用户所见界面的职务。若对网页和UI实现感兴趣，很合适。",
    vi: "Công việc tạo ra giao diện người dùng nhìn thấy. Rất hợp nếu bạn quan tâm đến web và triển khai UI.",
    ja: "ユーザーが見る画面を作る職務です。ウェブ・UI実装に興味があればよく合います。",
    id: "Kamu membangun tampilan yang dilihat pengguna. Cocok jika kamu tertarik pada web dan implementasi UI."
  },
  rj12: {
    ko: "제품 전반의 기능을 개발하는 직무예요. 개발 기초가 탄탄하다면 폭넓게 성장할 수 있어요.",
    en: "You develop features across the whole product. With solid dev fundamentals, you can grow in many directions.",
    "zh-CN": "开发产品整体功能的职务。若开发基础扎实，能广泛成长。",
    vi: "Công việc phát triển các tính năng trên toàn sản phẩm. Nền tảng lập trình vững sẽ giúp bạn phát triển rộng.",
    ja: "製品全般の機能を開発する職務です。開発の基礎がしっかりしていれば幅広く成長できます。",
    id: "Kamu mengembangkan fitur di seluruh produk. Dengan dasar dev yang kuat, kamu bisa berkembang luas."
  },
  rj13: {
    ko: "프론트와 백엔드를 함께 다루는 직무예요. 넓게 만들어보는 걸 좋아한다면 잘 어울려요.",
    en: "You handle both front-end and back-end. A good fit if you like building broadly.",
    "zh-CN": "同时负责前端和后端的职务。若喜欢广泛地做，很合适。",
    vi: "Công việc làm cả front-end lẫn back-end. Rất hợp nếu bạn thích làm nhiều mảng.",
    ja: "フロントとバックエンドを一緒に扱う職務です。広く作ってみるのが好きならよく合います。",
    id: "Kamu menangani front-end sekaligus back-end. Cocok jika kamu suka membangun secara luas."
  },
  rj14: {
    ko: "안드로이드 앱을 만드는 직무예요. 모바일 서비스에 관심이 있다면 도전해볼 만해요.",
    en: "You build Android apps. Worth a try if you're into mobile services.",
    "zh-CN": "制作安卓应用的职务。若对移动服务感兴趣，值得挑战。",
    vi: "Công việc tạo ứng dụng Android. Đáng thử nếu bạn quan tâm đến dịch vụ di động.",
    ja: "Androidアプリを作る職務です。モバイルサービスに興味があれば挑戦する価値があります。",
    id: "Kamu membuat aplikasi Android. Layak dicoba jika kamu tertarik pada layanan mobile."
  },
  rj15: {
    ko: "아이폰 앱을 만드는 직무예요. 애플 생태계·모바일에 관심이 있다면 잘 맞아요.",
    en: "You build iPhone apps. A good fit if you're into the Apple ecosystem and mobile.",
    "zh-CN": "制作iPhone应用的职务。若对苹果生态和移动感兴趣，很合适。",
    vi: "Công việc tạo ứng dụng iPhone. Rất hợp nếu bạn quan tâm đến hệ sinh thái Apple và di động.",
    ja: "iPhoneアプリを作る職務です。Appleエコシステム・モバイルに興味があればよく合います。",
    id: "Kamu membuat aplikasi iPhone. Cocok jika kamu tertarik pada ekosistem Apple dan mobile."
  },
  rj16: {
    ko: "데이터 파이프라인·인프라를 만드는 직무예요. 개발과 데이터를 함께 다뤄요.",
    en: "You build data pipelines and infrastructure. You work with both development and data.",
    "zh-CN": "构建数据管道和基础设施的职务。同时处理开发与数据。",
    vi: "Công việc xây dựng pipeline dữ liệu và hạ tầng. Bạn làm cả phát triển lẫn dữ liệu.",
    ja: "データパイプライン・インフラを作る職務です。開発とデータを一緒に扱います。",
    id: "Kamu membangun pipeline data dan infrastruktur. Bekerja dengan pengembangan sekaligus data."
  },
  rj17: {
    ko: "데이터로 모델을 만들고 서비스에 적용하는 직무예요. 수학·데이터에 강하다면 강점이 커요.",
    en: "You build models from data and apply them to services. A big advantage if you're strong in math and data.",
    "zh-CN": "用数据构建模型并应用到服务的职务。若擅长数学和数据，优势很大。",
    vi: "Công việc xây mô hình từ dữ liệu và áp dụng vào dịch vụ. Là lợi thế lớn nếu bạn giỏi toán và dữ liệu.",
    ja: "データでモデルを作りサービスに適用する職務です。数学・データに強ければ強みが大きいです。",
    id: "Kamu membangun model dari data dan menerapkannya ke layanan. Nilai plus besar jika kuat di matematika dan data."
  },
  rj18: {
    ko: "서비스 배포·운영·클라우드를 다루는 직무예요. 시스템 전반에 관심이 있다면 잘 맞아요.",
    en: "You handle deployment, operations, and cloud. A good fit if you're interested in systems overall.",
    "zh-CN": "负责服务部署、运维和云的职务。若对系统整体感兴趣，很合适。",
    vi: "Công việc phụ trách triển khai, vận hành và cloud. Rất hợp nếu bạn quan tâm đến hệ thống nói chung.",
    ja: "サービスのデプロイ・運用・クラウドを扱う職務です。システム全般に興味があればよく合います。",
    id: "Kamu menangani deployment, operasional, dan cloud. Cocok jika kamu tertarik pada sistem secara keseluruhan."
  },
  rj19: {
    ko: "제품 품질을 점검하고 테스트하는 직무예요. 꼼꼼함이 강점이라면 잘 어울려요.",
    en: "You check and test product quality. A good fit if attention to detail is your strength.",
    "zh-CN": "检查和测试产品质量的职务。若细心是你的强项，很合适。",
    vi: "Công việc kiểm tra và test chất lượng sản phẩm. Rất hợp nếu sự tỉ mỉ là điểm mạnh của bạn.",
    ja: "製品の品質を点検してテストする職務です。丁寧さが強みならよく合います。",
    id: "Kamu memeriksa dan menguji kualitas produk. Cocok jika ketelitian adalah kekuatanmu."
  },
  rj20: {
    ko: "시스템과 데이터를 지키는 직무예요. 보안·네트워크에 관심이 있다면 강점이 돼요.",
    en: "You protect systems and data. An advantage if you're interested in security and networking.",
    "zh-CN": "守护系统与数据的职务。若对安全和网络感兴趣，会成为优势。",
    vi: "Công việc bảo vệ hệ thống và dữ liệu. Là lợi thế nếu bạn quan tâm đến bảo mật và mạng.",
    ja: "システムとデータを守る職務です。セキュリティ・ネットワークに興味があれば強みになります。",
    id: "Kamu melindungi sistem dan data. Jadi nilai plus jika kamu tertarik pada keamanan dan jaringan."
  },
  rj21: {
    ko: "게임 클라이언트·서버를 만드는 직무예요. 게임을 좋아하고 개발에 관심이 있다면 잘 맞아요.",
    en: "You build game clients and servers. A good fit if you love games and are into development.",
    "zh-CN": "制作游戏客户端和服务器的职务。若喜欢游戏又对开发感兴趣，很合适。",
    vi: "Công việc tạo client và server game. Rất hợp nếu bạn thích game và quan tâm đến lập trình.",
    ja: "ゲームのクライアント・サーバーを作る職務です。ゲームが好きで開発に興味があればよく合います。",
    id: "Kamu membangun client dan server game. Cocok jika kamu suka game dan tertarik pada pengembangan."
  },
  rj22: {
    ko: "디자인을 웹 화면으로 구현하는 직무예요. 디자인과 코드를 잇는 역할이에요.",
    en: "You turn designs into web screens. You bridge design and code.",
    "zh-CN": "把设计实现为网页界面的职务。是连接设计与代码的角色。",
    vi: "Công việc biến thiết kế thành giao diện web. Bạn là cầu nối giữa thiết kế và code.",
    ja: "デザインをウェブ画面に実装する職務です。デザインとコードをつなぐ役割です。",
    id: "Kamu mengubah desain menjadi tampilan web. Kamu menjembatani desain dan kode."
  },
  rj23: {
    ko: "데이터로 문제를 분석하고 인사이트를 만드는 직무예요. 통계·분석에 강하다면 강점이 커요.",
    en: "You analyze problems with data and produce insights. A big advantage if you're strong in statistics and analysis.",
    "zh-CN": "用数据分析问题并产出洞察的职务。若擅长统计和分析，优势很大。",
    vi: "Công việc phân tích vấn đề bằng dữ liệu và tạo ra insight. Là lợi thế lớn nếu bạn giỏi thống kê và phân tích.",
    ja: "データで問題を分析しインサイトを生む職務です。統計・分析に強ければ強みが大きいです。",
    id: "Kamu menganalisis masalah dengan data dan menghasilkan insight. Nilai plus besar jika kuat di statistik dan analisis."
  },
  rj24: {
    ko: "숫자로 성과를 정리하고 의사결정을 돕는 직무예요. 분석을 좋아한다면 잘 맞아요.",
    en: "You summarize results in numbers and support decisions. A good fit if you enjoy analysis.",
    "zh-CN": "用数字整理成果、辅助决策的职务。若喜欢分析，很合适。",
    vi: "Công việc tổng hợp kết quả bằng con số và hỗ trợ ra quyết định. Rất hợp nếu bạn thích phân tích.",
    ja: "数字で成果を整理し意思決定を助ける職務です。分析が好きならよく合います。",
    id: "Kamu merangkum hasil dalam angka dan mendukung pengambilan keputusan. Cocok jika kamu suka analisis."
  },
  rj25: {
    ko: "데이터를 지표·대시보드로 만들어 팀을 돕는 직무예요. 분석과 기획을 함께 다뤄요.",
    en: "You turn data into metrics and dashboards to help the team. You work with both analysis and planning.",
    "zh-CN": "把数据做成指标和仪表板来帮助团队的职务。同时处理分析与规划。",
    vi: "Công việc biến dữ liệu thành chỉ số và dashboard để hỗ trợ nhóm. Bạn làm cả phân tích lẫn lên kế hoạch.",
    ja: "データを指標・ダッシュボードにしてチームを助ける職務です。分析と企画を一緒に扱います。",
    id: "Kamu mengubah data menjadi metrik dan dashboard untuk membantu tim. Bekerja dengan analisis sekaligus perencanaan."
  },
  rj26: {
    ko: "사용자 경험과 화면을 디자인하는 직무예요. 디자인·사용자에 관심이 있다면 잘 어울려요.",
    en: "You design user experience and screens. A good fit if you care about design and users.",
    "zh-CN": "设计用户体验和界面的职务。若关注设计与用户，很合适。",
    vi: "Công việc thiết kế trải nghiệm và giao diện người dùng. Rất hợp nếu bạn quan tâm đến thiết kế và người dùng.",
    ja: "ユーザー体験と画面をデザインする職務です。デザイン・ユーザーに関心があればよく合います。",
    id: "Kamu mendesain pengalaman pengguna dan tampilan. Cocok jika kamu peduli pada desain dan pengguna."
  },
  rj27: {
    ko: "제품 전체의 경험을 설계하는 디자인 직무예요. 문제 해결형 디자인을 좋아한다면 잘 맞아요.",
    en: "A design role that shapes the whole product experience. A good fit if you like problem-solving design.",
    "zh-CN": "设计整个产品体验的设计职务。若喜欢解决问题型设计，很合适。",
    vi: "Công việc thiết kế định hình toàn bộ trải nghiệm sản phẩm. Rất hợp nếu bạn thích thiết kế giải quyết vấn đề.",
    ja: "製品全体の体験を設計するデザイン職務です。問題解決型のデザインが好きならよく合います。",
    id: "Peran desain yang membentuk keseluruhan pengalaman produk. Cocok jika kamu suka desain pemecahan masalah."
  },
  rj28: {
    ko: "브랜드의 시각 아이덴티티를 만드는 직무예요. 브랜딩·그래픽에 관심이 있다면 좋아요.",
    en: "You create a brand's visual identity. Great if you're into branding and graphics.",
    "zh-CN": "打造品牌视觉识别的职务。若对品牌和图形感兴趣，很不错。",
    vi: "Công việc tạo bản sắc thị giác của thương hiệu. Tuyệt nếu bạn quan tâm đến branding và đồ họa.",
    ja: "ブランドのビジュアルアイデンティティを作る職務です。ブランディング・グラフィックに興味があれば良いです。",
    id: "Kamu menciptakan identitas visual brand. Bagus jika kamu tertarik pada branding dan grafis."
  },
  rj29: {
    ko: "영상·모션 그래픽을 만드는 직무예요. 영상 편집·애니메이션에 관심이 있다면 잘 맞아요.",
    en: "You create video and motion graphics. A good fit if you're into video editing and animation.",
    "zh-CN": "制作视频和动态图形的职务。若对视频剪辑和动画感兴趣，很合适。",
    vi: "Công việc tạo video và motion graphic. Rất hợp nếu bạn quan tâm đến dựng video và hoạt họa.",
    ja: "映像・モーショングラフィックを作る職務です。映像編集・アニメーションに興味があればよく合います。",
    id: "Kamu membuat video dan motion graphic. Cocok jika kamu tertarik pada editing video dan animasi."
  },
  rj30: {
    ko: "제품 방향을 정하고 팀을 이끄는 직무예요. 기획·소통에 강하다면 강점이 커요.",
    en: "You set the product direction and lead the team. A big advantage if you're strong in planning and communication.",
    "zh-CN": "确定产品方向并带领团队的职务。若擅长规划和沟通，优势很大。",
    vi: "Công việc định hướng sản phẩm và dẫn dắt nhóm. Là lợi thế lớn nếu bạn giỏi lên kế hoạch và giao tiếp.",
    ja: "製品の方向を決めチームを率いる職務です。企画・コミュニケーションに強ければ強みが大きいです。",
    id: "Kamu menentukan arah produk dan memimpin tim. Nilai plus besar jika kuat di perencanaan dan komunikasi."
  },
  rj31: {
    ko: "사용자 관점에서 서비스를 설계하는 직무예요. 기획 경험을 쌓아가면 좋아요.",
    en: "You design services from the user's perspective. Great to build up planning experience.",
    "zh-CN": "从用户角度设计服务的职务。逐步积累规划经验会很好。",
    vi: "Công việc thiết kế dịch vụ từ góc nhìn người dùng. Tích lũy kinh nghiệm lên kế hoạch sẽ tốt.",
    ja: "ユーザー視点でサービスを設計する職務です。企画経験を積んでいくと良いです。",
    id: "Kamu merancang layanan dari sudut pandang pengguna. Bagus untuk membangun pengalaman perencanaan."
  },
  rj32: {
    ko: "프로젝트 일정·리소스를 관리하는 직무예요. 조율·관리에 강하다면 잘 어울려요.",
    en: "You manage project schedules and resources. A good fit if you're strong at coordination and management.",
    "zh-CN": "管理项目进度和资源的职务。若擅长协调和管理，很合适。",
    vi: "Công việc quản lý tiến độ và nguồn lực dự án. Rất hợp nếu bạn giỏi điều phối và quản lý.",
    ja: "プロジェクトの日程・リソースを管理する職務です。調整・管理に強ければよく合います。",
    id: "Kamu mengelola jadwal dan sumber daya proyek. Cocok jika kamu kuat dalam koordinasi dan manajemen."
  },
  rj33: {
    ko: "게임의 규칙·콘텐츠를 설계하는 직무예요. 게임을 깊이 좋아한다면 잘 맞아요.",
    en: "You design a game's rules and content. A good fit if you deeply love games.",
    "zh-CN": "设计游戏规则和内容的职务。若深爱游戏，很合适。",
    vi: "Công việc thiết kế luật chơi và nội dung game. Rất hợp nếu bạn yêu game sâu sắc.",
    ja: "ゲームのルール・コンテンツを設計する職務です。ゲームが深く好きならよく合います。",
    id: "Kamu merancang aturan dan konten game. Cocok jika kamu sangat mencintai game."
  },
  rj34: {
    ko: "데이터로 성장을 만드는 마케팅 직무예요. 실험·분석을 좋아한다면 잘 맞아요.",
    en: "A marketing role that drives growth with data. A good fit if you like experimenting and analyzing.",
    "zh-CN": "用数据驱动增长的营销职务。若喜欢实验和分析，很合适。",
    vi: "Công việc marketing tạo tăng trưởng bằng dữ liệu. Rất hợp nếu bạn thích thử nghiệm và phân tích.",
    ja: "データで成長を作るマーケティング職務です。実験・分析が好きならよく合います。",
    id: "Peran marketing yang mendorong pertumbuhan lewat data. Cocok jika kamu suka bereksperimen dan menganalisis."
  },
  rj35: {
    ko: "광고 성과를 데이터로 높이는 직무예요. 숫자와 마케팅을 함께 좋아한다면 잘 맞아요.",
    en: "You boost ad performance with data. A good fit if you like both numbers and marketing.",
    "zh-CN": "用数据提升广告成效的职务。若既喜欢数字又喜欢营销，很合适。",
    vi: "Công việc nâng hiệu quả quảng cáo bằng dữ liệu. Rất hợp nếu bạn thích cả con số lẫn marketing.",
    ja: "広告成果をデータで高める職務です。数字とマーケティングをともに好きならよく合います。",
    id: "Kamu meningkatkan performa iklan dengan data. Cocok jika kamu suka angka sekaligus marketing."
  },
  rj36: {
    ko: "해외 시장을 겨냥한 마케팅 직무예요. 다국어 역량이 큰 강점이 돼요.",
    en: "A marketing role aimed at overseas markets. Multilingual skills are a big advantage.",
    "zh-CN": "面向海外市场的营销职务。多语言能力是很大的优势。",
    vi: "Công việc marketing nhắm đến thị trường nước ngoài. Năng lực đa ngôn ngữ là lợi thế lớn.",
    ja: "海外市場を狙うマーケティング職務です。多言語能力が大きな強みになります。",
    id: "Peran marketing yang menyasar pasar luar negeri. Kemampuan multibahasa jadi nilai plus besar."
  },
  rj37: {
    ko: "기획·표현에 관심이 있다면 잘 맞아요. 포트폴리오를 함께 준비하면 더 강해져요.",
    en: "A good fit if you're into planning and expression. Preparing a portfolio makes you even stronger.",
    "zh-CN": "若对策划和表达感兴趣，很合适。一并准备作品集会更有竞争力。",
    vi: "Rất hợp nếu bạn thích lên ý tưởng và diễn đạt. Chuẩn bị portfolio sẽ giúp bạn mạnh hơn.",
    ja: "企画・表現に興味があればよく合います。ポートフォリオを一緒に準備するとさらに強くなります。",
    id: "Cocok jika kamu tertarik pada perencanaan dan ekspresi. Menyiapkan portofolio membuatmu makin kuat."
  },
  rj38: {
    ko: "고객 데이터로 재구매·충성도를 높이는 직무예요. 분석과 커뮤니케이션을 함께 다뤄요.",
    en: "You raise repeat purchases and loyalty with customer data. You work with both analysis and communication.",
    "zh-CN": "用客户数据提升复购和忠诚度的职务。同时处理分析与沟通。",
    vi: "Công việc tăng mua lại và lòng trung thành bằng dữ liệu khách hàng. Bạn làm cả phân tích lẫn giao tiếp.",
    ja: "顧客データで再購入・ロイヤルティを高める職務です。分析とコミュニケーションを一緒に扱います。",
    id: "Kamu meningkatkan pembelian ulang dan loyalitas dengan data pelanggan. Bekerja dengan analisis sekaligus komunikasi."
  },
  rj39: {
    ko: "브랜드의 이야기를 알리는 직무예요. 글쓰기·소통에 강하다면 잘 어울려요.",
    en: "You get the brand's story out there. A good fit if you're strong at writing and communication.",
    "zh-CN": "传播品牌故事的职务。若擅长写作和沟通，很合适。",
    vi: "Công việc lan tỏa câu chuyện thương hiệu. Rất hợp nếu bạn giỏi viết và giao tiếp.",
    ja: "ブランドのストーリーを伝える職務です。文章・コミュニケーションに強ければよく合います。",
    id: "Kamu menyebarkan cerita brand. Cocok jika kamu kuat dalam menulis dan komunikasi."
  },
  rj40: {
    ko: "모국어·한국어·영어를 함께 쓰는 강점이 크게 작용해요. 외국인 인재를 적극 채용하는 분야예요.",
    en: "Your ability to use your native language, Korean, and English together is a major asset. This field actively hires international talent.",
    "zh-CN": "同时使用母语、韩语和英语的优势作用很大。这是积极招聘外籍人才的领域。",
    vi: "Thế mạnh sử dụng cả tiếng mẹ đẻ, tiếng Hàn và tiếng Anh phát huy rất lớn. Đây là lĩnh vực tích cực tuyển nhân tài nước ngoài.",
    ja: "母国語・韓国語・英語を併用できる強みが大きく効きます。外国人人材を積極的に採用する分野です。",
    id: "Kemampuan memakai bahasa ibu, Korea, dan Inggris sekaligus sangat berperan. Bidang ini aktif merekrut talenta asing."
  },
  rj41: {
    ko: "새로운 사업 기회를 발굴하고 파트너십을 만드는 직무예요. 전략·소통에 강하다면 잘 어울려요.",
    en: "You find new business opportunities and build partnerships. A good fit if you're strong in strategy and communication.",
    "zh-CN": "发掘新业务机会、建立合作关系的职务。若擅长战略和沟通，很合适。",
    vi: "Công việc tìm cơ hội kinh doanh mới và xây dựng quan hệ đối tác. Rất hợp nếu bạn giỏi chiến lược và giao tiếp.",
    ja: "新しい事業機会を発掘しパートナーシップを作る職務です。戦略・コミュニケーションに強ければよく合います。",
    id: "Kamu menggali peluang bisnis baru dan membangun kemitraan. Cocok jika kamu kuat dalam strategi dan komunikasi."
  },
  rj42: {
    ko: "기술 제품을 고객에게 설명하고 파는 직무예요. IT 지식과 소통을 함께 살려요.",
    en: "You explain and sell technical products to customers. You use both IT knowledge and communication.",
    "zh-CN": "向客户讲解并销售技术产品的职务。同时发挥IT知识和沟通能力。",
    vi: "Công việc giải thích và bán sản phẩm kỹ thuật cho khách hàng. Bạn phát huy cả kiến thức CNTT lẫn giao tiếp.",
    ja: "技術製品を顧客に説明して売る職務です。IT知識とコミュニケーションを一緒に活かします。",
    id: "Kamu menjelaskan dan menjual produk teknis ke pelanggan. Memanfaatkan pengetahuan IT sekaligus komunikasi."
  },
  rj43: {
    ko: "회사의 방향과 계획을 세우는 직무예요. 분석·기획에 강하다면 강점이 커요.",
    en: "You set the company's direction and plans. A big advantage if you're strong in analysis and planning.",
    "zh-CN": "制定公司方向和计划的职务。若擅长分析和规划，优势很大。",
    vi: "Công việc vạch ra định hướng và kế hoạch của công ty. Là lợi thế lớn nếu bạn giỏi phân tích và lên kế hoạch.",
    ja: "会社の方向と計画を立てる職務です。分析・企画に強ければ強みが大きいです。",
    id: "Kamu menyusun arah dan rencana perusahaan. Nilai plus besar jika kuat di analisis dan perencanaan."
  },
  rj44: {
    ko: "사람과 조직을 다루는 직무예요. 글로벌 인재를 채용·관리하는 팀에서 강점이 돼요.",
    en: "You work with people and organizations. An advantage on teams that hire and manage global talent.",
    "zh-CN": "处理人与组织的职务。在招聘和管理全球人才的团队中会成为优势。",
    vi: "Công việc làm việc với con người và tổ chức. Là lợi thế ở các nhóm tuyển dụng và quản lý nhân tài toàn cầu.",
    ja: "人と組織を扱う職務です。グローバル人材を採用・管理するチームで強みになります。",
    id: "Kamu bekerja dengan orang dan organisasi. Nilai plus di tim yang merekrut dan mengelola talenta global."
  },
  rj45: {
    ko: "숫자와 자금을 다루는 직무예요. 꼼꼼함과 경영·회계 지식이 강점이 돼요.",
    en: "You work with numbers and finances. Attention to detail plus business and accounting knowledge are your strengths.",
    "zh-CN": "处理数字和资金的职务。细心以及经营、会计知识会成为优势。",
    vi: "Công việc làm việc với con số và tài chính. Sự tỉ mỉ cùng kiến thức kinh doanh, kế toán là lợi thế.",
    ja: "数字と資金を扱う職務です。丁寧さと経営・会計の知識が強みになります。",
    id: "Kamu bekerja dengan angka dan keuangan. Ketelitian plus pengetahuan bisnis dan akuntansi jadi kekuatanmu."
  },
  rj46: {
    ko: "구성원 성장을 돕는 교육을 기획하는 직무예요. 교육·사람에 관심이 있다면 잘 맞아요.",
    en: "You plan training that helps members grow. A good fit if you care about education and people.",
    "zh-CN": "策划帮助成员成长的培训的职务。若对教育和人感兴趣，很合适。",
    vi: "Công việc thiết kế đào tạo giúp thành viên phát triển. Rất hợp nếu bạn quan tâm đến giáo dục và con người.",
    ja: "メンバーの成長を助ける教育を企画する職務です。教育・人に関心があればよく合います。",
    id: "Kamu merancang pelatihan yang membantu anggota berkembang. Cocok jika kamu peduli pada edukasi dan orang."
  },
  rj47: {
    ko: "국제 거래와 수출입 업무를 다루는 직무예요. 다국어와 서류 처리 강점이 크게 작용해요.",
    en: "You handle international trade and import/export. Multilingual skills and document handling are big assets.",
    "zh-CN": "处理国际贸易和进出口业务的职务。多语言和文书处理的优势作用很大。",
    vi: "Công việc xử lý giao thương quốc tế và xuất nhập khẩu. Thế mạnh đa ngôn ngữ và xử lý giấy tờ phát huy lớn.",
    ja: "国際取引と輸出入業務を扱う職務です。多言語と書類処理の強みが大きく効きます。",
    id: "Kamu menangani perdagangan internasional dan ekspor-impor. Kemampuan multibahasa dan pengurusan dokumen sangat berperan."
  },
  rj48: {
    ko: "공급망과 물류를 관리하는 직무예요. 계획·조율을 좋아한다면 잘 어울려요.",
    en: "You manage supply chains and logistics. A good fit if you like planning and coordination.",
    "zh-CN": "管理供应链和物流的职务。若喜欢计划和协调，很合适。",
    vi: "Công việc quản lý chuỗi cung ứng và logistics. Rất hợp nếu bạn thích lập kế hoạch và điều phối.",
    ja: "サプライチェーンと物流を管理する職務です。計画・調整が好きならよく合います。",
    id: "Kamu mengelola rantai pasok dan logistik. Cocok jika kamu suka merencanakan dan mengoordinasi."
  },
  rj49: {
    ko: "필요한 자재·서비스를 확보하는 직무예요. 협상·관리에 강하다면 좋아요.",
    en: "You secure the materials and services you need. Great if you're strong in negotiation and management.",
    "zh-CN": "获取所需物料和服务的职务。若擅长谈判和管理，很不错。",
    vi: "Công việc đảm bảo vật tư và dịch vụ cần thiết. Tuyệt nếu bạn giỏi đàm phán và quản lý.",
    ja: "必要な資材・サービスを確保する職務です。交渉・管理に強ければ良いです。",
    id: "Kamu mengamankan bahan dan layanan yang dibutuhkan. Bagus jika kamu kuat dalam negosiasi dan manajemen."
  },
  rj50: {
    ko: "글과 콘텐츠를 만드는 직무예요. 글쓰기·기획에 관심이 있다면 잘 맞아요.",
    en: "You create writing and content. A good fit if you're into writing and planning.",
    "zh-CN": "创作文字和内容的职务。若对写作和策划感兴趣，很合适。",
    vi: "Công việc tạo ra bài viết và nội dung. Rất hợp nếu bạn quan tâm đến viết lách và lên ý tưởng.",
    ja: "文章とコンテンツを作る職務です。文章・企画に興味があればよく合います。",
    id: "Kamu membuat tulisan dan konten. Cocok jika kamu tertarik pada menulis dan perencanaan."
  }
};

// ── STUDENT.cohort ──
const STUDENT_COHORT: LT = {
  ko: "2026 여름 1기",
  en: "2026 Summer Cohort 1",
  "zh-CN": "2026 夏季 1期",
  vi: "Khóa 1 mùa hè 2026",
  ja: "2026 夏 1期",
  id: "Angkatan 1 Musim Panas 2026"
};

// ── 접근자 훅 ──

function useLocale() {
  return useLanguage().locale;
}

function pick(t: LT | undefined, locale: string, fallback: string): string {
  if (!t) return fallback;
  return (t as Record<string, string>)[locale] ?? t.en ?? t.ko ?? fallback;
}

// 운영자 오버라이드는 "그 로케일이 실제로 채워졌을 때만" 덮어쓴다.
// (한국어만 채웠다고 영어 자리에 한국어가 나오면 기존 번역을 망친다.)
function pickOverride(t: LT | undefined, locale: string, base: string): string {
  const v = (t as Record<string, string> | undefined)?.[locale];
  return v && v.trim() ? v : base;
}

// 주차 title/subtitle/goal.
// 우선순위: 운영자 오버라이드 > 정적 번역(WEEK_TEXT) > data.ts 원본.
export function useWeekText() {
  const locale = useLocale();
  const ov = useCareerContentOverride();
  return (week: number, field: WeekField): string => {
    const orig = WEEKS.find((w) => w.week === week)?.[field] ?? "";
    const base = pick(WEEK_TEXT[week]?.[field], locale, orig);
    return pickOverride(ov.weeks?.[String(week)]?.[field], locale, base);
  };
}

// 스텝 title/desc(스텝 id 기준).
// 우선순위: 운영자 오버라이드 > 정적 번역(STEP_TEXT) > data.ts 원본.
export function useStepText() {
  const locale = useLocale();
  const ov = useCareerContentOverride();
  return (stepId: string, field: StepField): string => {
    const orig = WEEKS.flatMap((w) => w.steps).find((s) => s.id === stepId)?.[field] ?? "";
    const base = pick(STEP_TEXT[stepId]?.[field], locale, orig);
    return pickOverride(ov.steps?.[stepId]?.[field], locale, base);
  };
}

// 스텝 CTA 버튼 라벨(한국어 원본 기준) 다국어화 — data.ts 의 action.label 은 한국어라 로케일별로 변환한다.
const STEP_ACTION_TEXT: Record<string, LT> = {
  시작하기: { ko: "시작하기", en: "Start", "zh-CN": "开始", vi: "Bắt đầu", ja: "始める", id: "Mulai" },
  "면접 보기": { ko: "면접 보기", en: "Start mock interview", "zh-CN": "开始模拟面试", vi: "Bắt đầu phỏng vấn thử", ja: "模擬面接を受ける", id: "Mulai wawancara simulasi" },
  "이력서 점검하기": { ko: "이력서 점검하기", en: "Review my resume", "zh-CN": "检查我的简历", vi: "Kiểm tra hồ sơ của tôi", ja: "履歴書を点検する", id: "Periksa resume saya" },
  "수료 진단 받기": { ko: "수료 진단 받기", en: "Take completion diagnosis", "zh-CN": "接受结业诊断", vi: "Làm chẩn đoán hoàn thành", ja: "修了診断を受ける", id: "Ikuti diagnosis kelulusan" }
};
export function useStepActionLabel() {
  const locale = useLocale();
  return (label: string): string => pick(STEP_ACTION_TEXT[label], locale, label);
}

// 수료 조건 목록 — 원본 순서 유지, 미번역 항목은 원본으로 폴백.
export function useCompletionCriteria() {
  const locale = useLocale();
  return (): string[] => COMPLETION_CRITERIA.map((orig, i) => pick(COMPLETION_TEXT[i], locale, orig));
}

// 추천 직무 이유(직무 id 기준) — 없으면 data.ts 원본으로 폴백.
export function useJobReason() {
  const locale = useLocale();
  return (jobId: string): string => {
    const orig = RECOMMENDED_JOBS.find((j) => j.id === jobId)?.reason ?? "";
    return pick(JOB_REASON[jobId], locale, orig);
  };
}

// 추천 직무 이름(role 문자열 기준) 다국어화 — role 은 매칭·저장 키라 원본은 그대로 두고 표시만 변환한다.
// AI 대화로 나온 자유 입력 직무 등 미등록 값은 원본 문자열로 폴백한다.
const JOB_NAME: Record<string, LT> = {
  "고객경험(CX) · CS": { ko: "고객경험(CX) · CS", en: "Customer Experience (CX) · CS", "zh-CN": "客户体验(CX)·客服", vi: "Trải nghiệm khách hàng (CX) · CS", ja: "顧客体験(CX)・CS", id: "Customer Experience (CX) · CS" },
  "통·번역 코디네이터": { ko: "통·번역 코디네이터", en: "Interpretation & Translation Coordinator", "zh-CN": "口译·笔译协调员", vi: "Điều phối phiên dịch & biên dịch", ja: "通訳・翻訳コーディネーター", id: "Koordinator Interpretasi & Terjemahan" },
  "백엔드 개발자": { ko: "백엔드 개발자", en: "Backend Developer", "zh-CN": "后端开发", vi: "Lập trình viên Backend", ja: "バックエンド開発者", id: "Backend Developer" },
  "프론트엔드 개발자": { ko: "프론트엔드 개발자", en: "Frontend Developer", "zh-CN": "前端开发", vi: "Lập trình viên Frontend", ja: "フロントエンド開発者", id: "Frontend Developer" },
  "소프트웨어 엔지니어": { ko: "소프트웨어 엔지니어", en: "Software Engineer", "zh-CN": "软件工程师", vi: "Kỹ sư phần mềm", ja: "ソフトウェアエンジニア", id: "Software Engineer" },
  "웹 · 풀스택 개발자": { ko: "웹 · 풀스택 개발자", en: "Web / Full-stack Developer", "zh-CN": "Web·全栈开发", vi: "Lập trình viên Web / Full-stack", ja: "Web・フルスタック開発者", id: "Web / Full-stack Developer" },
  "안드로이드 개발자": { ko: "안드로이드 개발자", en: "Android Developer", "zh-CN": "Android 开发", vi: "Lập trình viên Android", ja: "Android 開発者", id: "Android Developer" },
  "iOS 개발자": { ko: "iOS 개발자", en: "iOS Developer", "zh-CN": "iOS 开发", vi: "Lập trình viên iOS", ja: "iOS 開発者", id: "iOS Developer" },
  "데이터 엔지니어": { ko: "데이터 엔지니어", en: "Data Engineer", "zh-CN": "数据工程师", vi: "Kỹ sư dữ liệu", ja: "データエンジニア", id: "Data Engineer" },
  "머신러닝 · AI 엔지니어": { ko: "머신러닝 · AI 엔지니어", en: "ML / AI Engineer", "zh-CN": "机器学习·AI 工程师", vi: "Kỹ sư Machine Learning / AI", ja: "機械学習・AIエンジニア", id: "ML / AI Engineer" },
  "DevOps · 인프라 엔지니어": { ko: "DevOps · 인프라 엔지니어", en: "DevOps / Infrastructure Engineer", "zh-CN": "DevOps·基础架构工程师", vi: "Kỹ sư DevOps / Hạ tầng", ja: "DevOps・インフラエンジニア", id: "DevOps / Infrastructure Engineer" },
  "QA 엔지니어": { ko: "QA 엔지니어", en: "QA Engineer", "zh-CN": "QA 工程师", vi: "Kỹ sư QA", ja: "QAエンジニア", id: "QA Engineer" },
  "보안 엔지니어": { ko: "보안 엔지니어", en: "Security Engineer", "zh-CN": "安全工程师", vi: "Kỹ sư bảo mật", ja: "セキュリティエンジニア", id: "Security Engineer" },
  "게임 개발자": { ko: "게임 개발자", en: "Game Developer", "zh-CN": "游戏开发", vi: "Lập trình viên game", ja: "ゲーム開発者", id: "Game Developer" },
  "웹 퍼블리셔": { ko: "웹 퍼블리셔", en: "Web Publisher", "zh-CN": "Web 前端页面开发", vi: "Web Publisher", ja: "Webパブリッシャー", id: "Web Publisher" },
  "데이터 사이언티스트": { ko: "데이터 사이언티스트", en: "Data Scientist", "zh-CN": "数据科学家", vi: "Nhà khoa học dữ liệu", ja: "データサイエンティスト", id: "Data Scientist" },
  "데이터 분석가": { ko: "데이터 분석가", en: "Data Analyst", "zh-CN": "数据分析师", vi: "Chuyên viên phân tích dữ liệu", ja: "データアナリスト", id: "Data Analyst" },
  "BI · 데이터 기획": { ko: "BI · 데이터 기획", en: "BI / Data Planning", "zh-CN": "BI·数据规划", vi: "BI / Hoạch định dữ liệu", ja: "BI・データ企画", id: "BI / Perencanaan Data" },
  "UX · UI 디자이너": { ko: "UX · UI 디자이너", en: "UX / UI Designer", "zh-CN": "UX·UI 设计师", vi: "Nhà thiết kế UX / UI", ja: "UX・UIデザイナー", id: "UX / UI Designer" },
  "프로덕트 디자이너": { ko: "프로덕트 디자이너", en: "Product Designer", "zh-CN": "产品设计师", vi: "Nhà thiết kế sản phẩm", ja: "プロダクトデザイナー", id: "Product Designer" },
  "BX · 브랜드 디자이너": { ko: "BX · 브랜드 디자이너", en: "BX / Brand Designer", "zh-CN": "BX·品牌设计师", vi: "Nhà thiết kế BX / thương hiệu", ja: "BX・ブランドデザイナー", id: "BX / Brand Designer" },
  "영상 · 모션 디자이너": { ko: "영상 · 모션 디자이너", en: "Video / Motion Designer", "zh-CN": "视频·动效设计师", vi: "Nhà thiết kế video / motion", ja: "映像・モーションデザイナー", id: "Video / Motion Designer" },
  "프로덕트 매니저(PM)": { ko: "프로덕트 매니저(PM)", en: "Product Manager (PM)", "zh-CN": "产品经理(PM)", vi: "Quản lý sản phẩm (PM)", ja: "プロダクトマネージャー(PM)", id: "Product Manager (PM)" },
  "서비스 기획자": { ko: "서비스 기획자", en: "Service Planner", "zh-CN": "服务企划", vi: "Chuyên viên hoạch định dịch vụ", ja: "サービス企画", id: "Service Planner" },
  "프로젝트 매니저 · PMO": { ko: "프로젝트 매니저 · PMO", en: "Project Manager / PMO", "zh-CN": "项目经理·PMO", vi: "Quản lý dự án / PMO", ja: "プロジェクトマネージャー・PMO", id: "Project Manager / PMO" },
  "게임 기획자": { ko: "게임 기획자", en: "Game Designer (Planner)", "zh-CN": "游戏策划", vi: "Chuyên viên thiết kế game", ja: "ゲームプランナー", id: "Game Designer (Planner)" },
  "그로스 마케터": { ko: "그로스 마케터", en: "Growth Marketer", "zh-CN": "增长营销", vi: "Growth Marketer", ja: "グロースマーケター", id: "Growth Marketer" },
  "퍼포먼스 마케터": { ko: "퍼포먼스 마케터", en: "Performance Marketer", "zh-CN": "效果营销", vi: "Performance Marketer", ja: "パフォーマンスマーケター", id: "Performance Marketer" },
  "글로벌 마케팅": { ko: "글로벌 마케팅", en: "Global Marketing", "zh-CN": "全球营销", vi: "Marketing toàn cầu", ja: "グローバルマーケティング", id: "Global Marketing" },
  "콘텐츠 · 브랜드 마케터": { ko: "콘텐츠 · 브랜드 마케터", en: "Content / Brand Marketer", "zh-CN": "内容·品牌营销", vi: "Content / Brand Marketer", ja: "コンテンツ・ブランドマーケター", id: "Content / Brand Marketer" },
  "CRM 마케터": { ko: "CRM 마케터", en: "CRM Marketer", "zh-CN": "CRM 营销", vi: "CRM Marketer", ja: "CRMマーケター", id: "CRM Marketer" },
  "PR · 홍보": { ko: "PR · 홍보", en: "PR / Communications", "zh-CN": "公关·宣传", vi: "PR / Truyền thông", ja: "PR・広報", id: "PR / Komunikasi" },
  "해외영업 · 글로벌 세일즈": { ko: "해외영업 · 글로벌 세일즈", en: "Overseas / Global Sales", "zh-CN": "海外销售·全球销售", vi: "Kinh doanh quốc tế / Global Sales", ja: "海外営業・グローバルセールス", id: "Overseas / Global Sales" },
  "사업개발(BD)": { ko: "사업개발(BD)", en: "Business Development (BD)", "zh-CN": "商务拓展(BD)", vi: "Phát triển kinh doanh (BD)", ja: "事業開発(BD)", id: "Business Development (BD)" },
  "기술영업 (Sales Engineer)": { ko: "기술영업 (Sales Engineer)", en: "Sales Engineer", "zh-CN": "技术销售(Sales Engineer)", vi: "Kỹ sư bán hàng (Sales Engineer)", ja: "技術営業(セールスエンジニア)", id: "Sales Engineer" },
  "경영기획 · 전략": { ko: "경영기획 · 전략", en: "Corporate Planning / Strategy", "zh-CN": "经营企划·战略", vi: "Hoạch định / Chiến lược doanh nghiệp", ja: "経営企画・戦略", id: "Corporate Planning / Strategy" },
  "인사(HR) · 채용": { ko: "인사(HR) · 채용", en: "HR / Recruiting", "zh-CN": "人事(HR)·招聘", vi: "Nhân sự (HR) / Tuyển dụng", ja: "人事(HR)・採用", id: "HR / Rekrutmen" },
  "재무 · 회계": { ko: "재무 · 회계", en: "Finance / Accounting", "zh-CN": "财务·会计", vi: "Tài chính / Kế toán", ja: "財務・会計", id: "Keuangan / Akuntansi" },
  "HRD · 교육 담당": { ko: "HRD · 교육 담당", en: "HRD / Training", "zh-CN": "HRD·培训", vi: "HRD / Đào tạo", ja: "HRD・教育担当", id: "HRD / Pelatihan" },
  "무역 · 수출입": { ko: "무역 · 수출입", en: "Trade / Import-Export", "zh-CN": "贸易·进出口", vi: "Thương mại / Xuất nhập khẩu", ja: "貿易・輸出入", id: "Perdagangan / Ekspor-Impor" },
  "물류 · SCM": { ko: "물류 · SCM", en: "Logistics / SCM", "zh-CN": "物流·SCM", vi: "Logistics / SCM", ja: "物流・SCM", id: "Logistik / SCM" },
  "구매 · 소싱": { ko: "구매 · 소싱", en: "Purchasing / Sourcing", "zh-CN": "采购·寻源", vi: "Mua hàng / Sourcing", ja: "購買・ソーシング", id: "Pembelian / Sourcing" },
  "콘텐츠 에디터 · 작가": { ko: "콘텐츠 에디터 · 작가", en: "Content Editor / Writer", "zh-CN": "内容编辑·作者", vi: "Biên tập nội dung / Người viết", ja: "コンテンツエディター・ライター", id: "Content Editor / Writer" }
};
export function useJobName() {
  const locale = useLocale();
  return (role: string): string => pick(JOB_NAME[role], locale, role);
}

// 추천 직무 관련 역량(skills) 다국어화 — 스킬 문자열 기준으로 키.
// data.ts 의 skills 는 매칭·표시에 쓰이는 한국어(일부 영어) 원본이라 그대로 두고 표시만 변환한다.
// 순수 영어/기술명(React, SQL 등)은 사전에 없으므로 원본 그대로 폴백한다.
const SKILL_TEXT: Record<string, LT> = {
  "고객 응대": { ko: "고객 응대", en: "Customer service", "zh-CN": "客户应对", vi: "Chăm sóc khách hàng", ja: "顧客対応", id: "Layanan pelanggan" },
  "문제 해결": { ko: "문제 해결", en: "Problem solving", "zh-CN": "问题解决", vi: "Giải quyết vấn đề", ja: "問題解決", id: "Pemecahan masalah" },
  다국어: { ko: "다국어", en: "Multilingual", "zh-CN": "多语言", vi: "Đa ngôn ngữ", ja: "多言語", id: "Multibahasa" },
  통역: { ko: "통역", en: "Interpretation", "zh-CN": "口译", vi: "Phiên dịch", ja: "通訳", id: "Interpretasi lisan" },
  번역: { ko: "번역", en: "Translation", "zh-CN": "笔译", vi: "Biên dịch", ja: "翻訳", id: "Terjemahan" },
  문서화: { ko: "문서화", en: "Documentation", "zh-CN": "文档化", vi: "Lập tài liệu", ja: "文書化", id: "Dokumentasi" },
  "API 설계": { ko: "API 설계", en: "API design", "zh-CN": "API 设计", vi: "Thiết kế API", ja: "API設計", id: "Desain API" },
  데이터베이스: { ko: "데이터베이스", en: "Database", "zh-CN": "数据库", vi: "Cơ sở dữ liệu", ja: "データベース", id: "Basis data" },
  "자료구조 · 알고리즘": { ko: "자료구조 · 알고리즘", en: "Data structures · Algorithms", "zh-CN": "数据结构·算法", vi: "Cấu trúc dữ liệu · Giải thuật", ja: "データ構造・アルゴリズム", id: "Struktur data · Algoritma" },
  설계: { ko: "설계", en: "System design", "zh-CN": "设计", vi: "Thiết kế", ja: "設計", id: "Perancangan" },
  협업: { ko: "협업", en: "Collaboration", "zh-CN": "协作", vi: "Cộng tác", ja: "協業", id: "Kolaborasi" },
  "웹 개발": { ko: "웹 개발", en: "Web development", "zh-CN": "网页开发", vi: "Phát triển web", ja: "ウェブ開発", id: "Pengembangan web" },
  "UI 구현": { ko: "UI 구현", en: "UI implementation", "zh-CN": "UI 实现", vi: "Triển khai UI", ja: "UI実装", id: "Implementasi UI" },
  "데이터 파이프라인": { ko: "데이터 파이프라인", en: "Data pipelines", "zh-CN": "数据管道", vi: "Pipeline dữ liệu", ja: "データパイプライン", id: "Pipeline data" },
  클라우드: { ko: "클라우드", en: "Cloud", "zh-CN": "云计算", vi: "Cloud", ja: "クラウド", id: "Cloud" },
  머신러닝: { ko: "머신러닝", en: "Machine learning", "zh-CN": "机器学习", vi: "Machine learning", ja: "機械学習", id: "Machine learning" },
  "데이터 처리": { ko: "데이터 처리", en: "Data processing", "zh-CN": "数据处理", vi: "Xử lý dữ liệu", ja: "データ処理", id: "Pemrosesan data" },
  리눅스: { ko: "리눅스", en: "Linux", "zh-CN": "Linux", vi: "Linux", ja: "Linux", id: "Linux" },
  "AWS · 클라우드": { ko: "AWS · 클라우드", en: "AWS · Cloud", "zh-CN": "AWS·云", vi: "AWS · Cloud", ja: "AWS・クラウド", id: "AWS · Cloud" },
  "테스트 설계": { ko: "테스트 설계", en: "Test design", "zh-CN": "测试设计", vi: "Thiết kế kiểm thử", ja: "テスト設計", id: "Desain pengujian" },
  자동화: { ko: "자동화", en: "Automation", "zh-CN": "自动化", vi: "Tự động hóa", ja: "自動化", id: "Otomatisasi" },
  "버그 리포팅": { ko: "버그 리포팅", en: "Bug reporting", "zh-CN": "缺陷报告", vi: "Báo cáo lỗi", ja: "バグレポート", id: "Pelaporan bug" },
  네트워크: { ko: "네트워크", en: "Networking", "zh-CN": "网络", vi: "Mạng", ja: "ネットワーク", id: "Jaringan" },
  "취약점 분석": { ko: "취약점 분석", en: "Vulnerability analysis", "zh-CN": "漏洞分析", vi: "Phân tích lỗ hổng", ja: "脆弱性分析", id: "Analisis kerentanan" },
  보안: { ko: "보안", en: "Security", "zh-CN": "安全", vi: "Bảo mật", ja: "セキュリティ", id: "Keamanan" },
  "게임 로직": { ko: "게임 로직", en: "Game logic", "zh-CN": "游戏逻辑", vi: "Logic game", ja: "ゲームロジック", id: "Logika game" },
  최적화: { ko: "최적화", en: "Optimization", "zh-CN": "优化", vi: "Tối ưu hóa", ja: "最適化", id: "Optimasi" },
  반응형: { ko: "반응형", en: "Responsive design", "zh-CN": "响应式", vi: "Responsive", ja: "レスポンシブ", id: "Responsif" },
  접근성: { ko: "접근성", en: "Accessibility", "zh-CN": "无障碍", vi: "Khả năng truy cập", ja: "アクセシビリティ", id: "Aksesibilitas" },
  통계: { ko: "통계", en: "Statistics", "zh-CN": "统计", vi: "Thống kê", ja: "統計", id: "Statistik" },
  모델링: { ko: "모델링", en: "Modeling", "zh-CN": "建模", vi: "Mô hình hóa", ja: "モデリング", id: "Pemodelan" },
  "엑셀 · SQL": { ko: "엑셀 · SQL", en: "Excel · SQL", "zh-CN": "Excel·SQL", vi: "Excel · SQL", ja: "Excel・SQL", id: "Excel · SQL" },
  "데이터 해석": { ko: "데이터 해석", en: "Data interpretation", "zh-CN": "数据解读", vi: "Diễn giải dữ liệu", ja: "データ解釈", id: "Interpretasi data" },
  리포팅: { ko: "리포팅", en: "Reporting", "zh-CN": "报告", vi: "Báo cáo", ja: "レポーティング", id: "Pelaporan" },
  대시보드: { ko: "대시보드", en: "Dashboards", "zh-CN": "仪表板", vi: "Dashboard", ja: "ダッシュボード", id: "Dashboard" },
  "지표 설계": { ko: "지표 설계", en: "Metric design", "zh-CN": "指标设计", vi: "Thiết kế chỉ số", ja: "指標設計", id: "Desain metrik" },
  "UX 리서치": { ko: "UX 리서치", en: "UX research", "zh-CN": "UX 研究", vi: "Nghiên cứu UX", ja: "UXリサーチ", id: "Riset UX" },
  "UI 디자인": { ko: "UI 디자인", en: "UI design", "zh-CN": "UI 设计", vi: "Thiết kế UI", ja: "UIデザイン", id: "Desain UI" },
  "프로덕트 디자인": { ko: "프로덕트 디자인", en: "Product design", "zh-CN": "产品设计", vi: "Thiết kế sản phẩm", ja: "プロダクトデザイン", id: "Desain produk" },
  프로토타이핑: { ko: "프로토타이핑", en: "Prototyping", "zh-CN": "原型设计", vi: "Tạo prototype", ja: "プロトタイピング", id: "Prototyping" },
  브랜딩: { ko: "브랜딩", en: "Branding", "zh-CN": "品牌塑造", vi: "Branding", ja: "ブランディング", id: "Branding" },
  그래픽: { ko: "그래픽", en: "Graphics", "zh-CN": "图形设计", vi: "Đồ họa", ja: "グラフィック", id: "Grafis" },
  타이포: { ko: "타이포", en: "Typography", "zh-CN": "字体设计", vi: "Typography", ja: "タイポグラフィ", id: "Tipografi" },
  "영상 편집": { ko: "영상 편집", en: "Video editing", "zh-CN": "视频剪辑", vi: "Dựng video", ja: "映像編集", id: "Editing video" },
  "모션 그래픽": { ko: "모션 그래픽", en: "Motion graphics", "zh-CN": "动态图形", vi: "Motion graphic", ja: "モーショングラフィック", id: "Motion graphic" },
  기획: { ko: "기획", en: "Planning", "zh-CN": "策划", vi: "Lên kế hoạch", ja: "企画", id: "Perencanaan" },
  우선순위: { ko: "우선순위", en: "Prioritization", "zh-CN": "优先级管理", vi: "Sắp xếp ưu tiên", ja: "優先順位付け", id: "Penentuan prioritas" },
  "사용자 리서치": { ko: "사용자 리서치", en: "User research", "zh-CN": "用户研究", vi: "Nghiên cứu người dùng", ja: "ユーザーリサーチ", id: "Riset pengguna" },
  "일정 관리": { ko: "일정 관리", en: "Schedule management", "zh-CN": "日程管理", vi: "Quản lý lịch trình", ja: "スケジュール管理", id: "Manajemen jadwal" },
  "리스크 관리": { ko: "리스크 관리", en: "Risk management", "zh-CN": "风险管理", vi: "Quản lý rủi ro", ja: "リスク管理", id: "Manajemen risiko" },
  "게임 기획": { ko: "게임 기획", en: "Game design", "zh-CN": "游戏策划", vi: "Thiết kế game", ja: "ゲーム企画", id: "Perancangan game" },
  밸런싱: { ko: "밸런싱", en: "Balancing", "zh-CN": "平衡设计", vi: "Cân bằng game", ja: "バランシング", id: "Balancing" },
  시나리오: { ko: "시나리오", en: "Scenario writing", "zh-CN": "剧情设计", vi: "Viết kịch bản", ja: "シナリオ", id: "Penulisan skenario" },
  "데이터 분석": { ko: "데이터 분석", en: "Data analysis", "zh-CN": "数据分析", vi: "Phân tích dữ liệu", ja: "データ分析", id: "Analisis data" },
  "A/B 테스트": { ko: "A/B 테스트", en: "A/B testing", "zh-CN": "A/B 测试", vi: "A/B testing", ja: "A/Bテスト", id: "A/B testing" },
  퍼널: { ko: "퍼널", en: "Funnel", "zh-CN": "漏斗分析", vi: "Phễu chuyển đổi", ja: "ファネル", id: "Funnel" },
  "광고 운영": { ko: "광고 운영", en: "Ad operations", "zh-CN": "广告运营", vi: "Vận hành quảng cáo", ja: "広告運用", id: "Operasi iklan" },
  "시장 분석": { ko: "시장 분석", en: "Market analysis", "zh-CN": "市场分析", vi: "Phân tích thị trường", ja: "市場分析", id: "Analisis pasar" },
  "콘텐츠 기획": { ko: "콘텐츠 기획", en: "Content planning", "zh-CN": "内容策划", vi: "Lên kế hoạch nội dung", ja: "コンテンツ企画", id: "Perencanaan konten" },
  "SNS 운영": { ko: "SNS 운영", en: "Social media management", "zh-CN": "社交媒体运营", vi: "Quản lý mạng xã hội", ja: "SNS運用", id: "Manajemen media sosial" },
  타겟팅: { ko: "타겟팅", en: "Targeting", "zh-CN": "定向", vi: "Nhắm mục tiêu", ja: "ターゲティング", id: "Penargetan" },
  "메시지 기획": { ko: "메시지 기획", en: "Message planning", "zh-CN": "信息策划", vi: "Lên kế hoạch thông điệp", ja: "メッセージ企画", id: "Perencanaan pesan" },
  보도자료: { ko: "보도자료", en: "Press releases", "zh-CN": "新闻稿", vi: "Thông cáo báo chí", ja: "プレスリリース", id: "Siaran pers" },
  "언론 관계": { ko: "언론 관계", en: "Media relations", "zh-CN": "媒体关系", vi: "Quan hệ báo chí", ja: "メディアリレーション", id: "Hubungan media" },
  커뮤니케이션: { ko: "커뮤니케이션", en: "Communication", "zh-CN": "沟通", vi: "Giao tiếp", ja: "コミュニケーション", id: "Komunikasi" },
  협상: { ko: "협상", en: "Negotiation", "zh-CN": "谈判", vi: "Đàm phán", ja: "交渉", id: "Negosiasi" },
  "고객 관리": { ko: "고객 관리", en: "Customer management", "zh-CN": "客户管理", vi: "Quản lý khách hàng", ja: "顧客管理", id: "Manajemen pelanggan" },
  "영어 · 모국어": { ko: "영어 · 모국어", en: "English · Native language", "zh-CN": "英语·母语", vi: "Tiếng Anh · Tiếng mẹ đẻ", ja: "英語・母国語", id: "Inggris · Bahasa ibu" },
  전략: { ko: "전략", en: "Strategy", "zh-CN": "战略", vi: "Chiến lược", ja: "戦略", id: "Strategi" },
  제휴: { ko: "제휴", en: "Partnerships", "zh-CN": "合作", vi: "Hợp tác", ja: "提携", id: "Kemitraan" },
  "제품 이해": { ko: "제품 이해", en: "Product knowledge", "zh-CN": "产品理解", vi: "Hiểu sản phẩm", ja: "製品理解", id: "Pemahaman produk" },
  "고객 대응": { ko: "고객 대응", en: "Customer handling", "zh-CN": "客户对应", vi: "Ứng phó khách hàng", ja: "顧客対応", id: "Penanganan pelanggan" },
  제안: { ko: "제안", en: "Proposals", "zh-CN": "提案", vi: "Đề xuất", ja: "提案", id: "Proposal" },
  "전략 기획": { ko: "전략 기획", en: "Strategic planning", "zh-CN": "战略企划", vi: "Hoạch định chiến lược", ja: "戦略企画", id: "Perencanaan strategis" },
  보고: { ko: "보고", en: "Reporting", "zh-CN": "汇报", vi: "Báo cáo", ja: "報告", id: "Pelaporan" },
  채용: { ko: "채용", en: "Recruiting", "zh-CN": "招聘", vi: "Tuyển dụng", ja: "採用", id: "Rekrutmen" },
  "조직 관리": { ko: "조직 관리", en: "Organization management", "zh-CN": "组织管理", vi: "Quản lý tổ chức", ja: "組織管理", id: "Manajemen organisasi" },
  회계: { ko: "회계", en: "Accounting", "zh-CN": "会计", vi: "Kế toán", ja: "会計", id: "Akuntansi" },
  "재무 분석": { ko: "재무 분석", en: "Financial analysis", "zh-CN": "财务分析", vi: "Phân tích tài chính", ja: "財務分析", id: "Analisis keuangan" },
  엑셀: { ko: "엑셀", en: "Excel", "zh-CN": "Excel", vi: "Excel", ja: "Excel", id: "Excel" },
  "교육 기획": { ko: "교육 기획", en: "Training design", "zh-CN": "培训策划", vi: "Thiết kế đào tạo", ja: "教育企画", id: "Perancangan pelatihan" },
  운영: { ko: "운영", en: "Operations", "zh-CN": "运营", vi: "Vận hành", ja: "運営", id: "Operasional" },
  콘텐츠: { ko: "콘텐츠", en: "Content", "zh-CN": "内容", vi: "Nội dung", ja: "コンテンツ", id: "Konten" },
  수출입: { ko: "수출입", en: "Import/export", "zh-CN": "进出口", vi: "Xuất nhập khẩu", ja: "輸出入", id: "Ekspor-impor" },
  "무역 서류": { ko: "무역 서류", en: "Trade documents", "zh-CN": "贸易单据", vi: "Chứng từ thương mại", ja: "貿易書類", id: "Dokumen perdagangan" },
  공급망: { ko: "공급망", en: "Supply chain", "zh-CN": "供应链", vi: "Chuỗi cung ứng", ja: "サプライチェーン", id: "Rantai pasok" },
  "재고 관리": { ko: "재고 관리", en: "Inventory management", "zh-CN": "库存管理", vi: "Quản lý tồn kho", ja: "在庫管理", id: "Manajemen inventaris" },
  데이터: { ko: "데이터", en: "Data", "zh-CN": "数据", vi: "Dữ liệu", ja: "データ", id: "Data" },
  소싱: { ko: "소싱", en: "Sourcing", "zh-CN": "寻源", vi: "Sourcing", ja: "ソーシング", id: "Sourcing" },
  "원가 관리": { ko: "원가 관리", en: "Cost management", "zh-CN": "成本管理", vi: "Quản lý chi phí", ja: "原価管理", id: "Manajemen biaya" },
  글쓰기: { ko: "글쓰기", en: "Writing", "zh-CN": "写作", vi: "Viết lách", ja: "ライティング", id: "Menulis" },
  편집: { ko: "편집", en: "Editing", "zh-CN": "编辑", vi: "Biên tập", ja: "編集", id: "Editing" }
};
export function useJobSkills() {
  const locale = useLocale();
  return (skills: string[]): string[] => skills.map((s) => pick(SKILL_TEXT[s], locale, s));
}

// STUDENT.cohort 표시 문자열.
export function useStudentCohort() {
  const locale = useLocale();
  return (): string => pick(STUDENT_COHORT, locale, STUDENT.cohort);
}

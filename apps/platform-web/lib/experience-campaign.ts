// "내 경험이 스펙이 되는 순간" — 어플라이 자소서 경험 발굴 캠페인(/experience) 문구·설정.
// 마케팅·법무가 자주 바꿀 값은 전부 여기 모아 둔다(화면 코드는 components/pages/ExperienceCampaignPage.tsx).
// 문구는 { ko, en, zh, vi, ja, id } — 앱의 여섯 언어 모두(zh = 간체 중국어, 로케일 "zh-CN").

export type Copy = { ko: string; en: string; zh: string; vi: string; ja: string; id: string };

/** 전문가 1인당 제공 범위 — 아직 확정 전(기본안). 바꾸면 화면 전체(안내·FAQ·완료 화면)에 반영된다. */
export const EXPERT_SCOPE: Copy = {
  ko: "30분 1:1 상담 + 이력서·자기소개서 첨삭",
  en: "A 30-min 1:1 consultation + resume & cover letter editing",
  zh: "30分钟一对一咨询 + 简历和自我介绍书修改",
  vi: "30 phút tư vấn 1:1 + sửa CV và thư giới thiệu bản thân",
  ja: "30分の1対1相談 + 履歴書・自己紹介書の添削",
  id: "Konsultasi 1:1 selama 30 menit + koreksi CV dan esai perkenalan diri"
};

/** 매주 선정 인원. */
export const WEEKLY_SLOTS = 2;

/** 개인정보 보관 기간 — 법무 검토 전 임시 문구. */
export const PRIVACY_RETENTION: Copy = {
  ko: "캠페인 종료 후 6개월이 지나면 파기합니다.",
  en: "Deleted 6 months after the campaign ends.",
  zh: "活动结束6个月后销毁。",
  vi: "Hủy sau 6 tháng kể từ khi chiến dịch kết thúc.",
  ja: "キャンペーン終了から6か月後に破棄します。",
  id: "Dimusnahkan 6 bulan setelah kampanye berakhir."
};

/** 개인정보 수집·이용 동의 상세(필수). 내용을 바꾸면 API 의 EXPERIENCE_CONSENT_VERSION 도 함께 올린다. */
export const PRIVACY_CONSENT_DETAILS: { label: Copy; value: Copy }[] = [
  {
    label: { ko: "수집 항목", en: "What we collect", zh: "收集项目", vi: "Thông tin thu thập", ja: "収集項目", id: "Data yang dikumpulkan" },
    value: {
      ko: "이름, 이메일, 지원 직무, 이력서 파일, 상담 방식 (선택: 휴대폰 번호, 국적, 자기소개서 파일)",
      en: "Name, email, desired role, resume file, consultation method (optional: phone, nationality, cover letter file)",
      zh: "姓名、邮箱、应聘职位、简历文件、咨询方式（选填：手机号码、国籍、自我介绍书文件）",
      vi: "Họ tên, email, vị trí ứng tuyển, tệp CV, hình thức tư vấn (không bắt buộc: số điện thoại, quốc tịch, tệp thư giới thiệu bản thân)",
      ja: "氏名、メールアドレス、志望職種、履歴書ファイル、相談方法（任意：携帯電話番号、国籍、自己紹介書ファイル）",
      id: "Nama, email, posisi yang dilamar, file CV, metode konsultasi (opsional: nomor ponsel, kewarganegaraan, file esai perkenalan diri)"
    }
  },
  {
    label: { ko: "이용 목적", en: "Purpose", zh: "使用目的", vi: "Mục đích sử dụng", ja: "利用目的", id: "Tujuan penggunaan" },
    value: {
      ko: "캠페인 참가자 선정, 선정 안내 및 상담 일정 조율, 이력서·자기소개서 상담·첨삭 제공",
      en: "Selecting participants, contacting you about selection and scheduling, and providing resume & cover letter consultation and editing",
      zh: "选定活动参与者、通知选定结果及协调咨询日程、提供简历和自我介绍书咨询与修改",
      vi: "Chọn người tham gia chiến dịch, thông báo kết quả chọn và sắp xếp lịch tư vấn, cung cấp dịch vụ tư vấn và sửa CV, thư giới thiệu bản thân",
      ja: "キャンペーン参加者の選定、選定のご案内および相談日程の調整、履歴書・自己紹介書の相談・添削の提供",
      id: "Memilih peserta kampanye, memberi info hasil seleksi dan mengatur jadwal konsultasi, serta memberikan konsultasi dan koreksi CV dan esai perkenalan diri"
    }
  },
  { label: { ko: "보관 기간", en: "Retention", zh: "保存期限", vi: "Thời gian lưu trữ", ja: "保管期間", id: "Masa penyimpanan" }, value: PRIVACY_RETENTION },
  {
    label: { ko: "동의 거부", en: "Your choice", zh: "拒绝同意", vi: "Từ chối đồng ý", ja: "同意の拒否", id: "Menolak persetujuan" },
    value: {
      ko: "동의하지 않을 수 있으며, 이 경우 캠페인 신청이 불가합니다.",
      en: "You may decline, but you won't be able to apply to the campaign.",
      zh: "您可以不同意，但不同意将无法申请本活动。",
      vi: "Bạn có thể không đồng ý, nhưng khi đó sẽ không thể đăng ký chiến dịch.",
      ja: "同意しないこともできますが、その場合キャンペーンには申し込めません。",
      id: "Kamu boleh tidak setuju, tetapi dalam hal ini kamu tidak dapat mendaftar kampanye."
    }
  }
];

/** 익명 사례 공개 동의(필수) 설명. 바꾸면 API 의 EXPERIENCE_CONSENT_VERSION 도 올린다. */
export const CASE_STUDY_CONSENT: Copy = {
  ko: "상담 전후 이력서·자기소개서를 이름·연락처 등 개인을 알 수 없게 가린 Before/After 사례로 어플라이 홈페이지·SNS에 소개할 수 있어요.",
  en: "Your before/after resume and cover letter may be shared on Aply's website and social media as an anonymous example, with names, contacts and identifying details removed.",
  zh: "咨询前后的简历和自我介绍书可能会隐去姓名、联系方式等可识别个人身份的信息，作为Before/After案例在Aply官网和社交媒体上介绍。",
  vi: "CV và thư giới thiệu bản thân trước và sau tư vấn có thể được giới thiệu trên website và mạng xã hội của Aply dưới dạng ví dụ Before/After, sau khi ẩn họ tên, liên hệ và mọi thông tin có thể nhận diện cá nhân.",
  ja: "相談前後の履歴書・自己紹介書を、氏名・連絡先など個人が特定できない形に伏せたBefore/After事例として、Aplyのホームページ・SNSで紹介することがあります。",
  id: "CV dan esai perkenalan diri sebelum dan sesudah konsultasi dapat ditampilkan sebagai contoh Before/After di situs web dan media sosial Aply, dengan nama, kontak, dan informasi pengenal pribadi lainnya disamarkan."
};

/** Before/After 예시 — 실제 상담 사례(공개 동의분)가 생기면 교체한다. */
export const BEFORE_AFTER_EXAMPLES: { tag: Copy; before: Copy; after: Copy }[] = [
  {
    tag: { ko: "편의점 아르바이트", en: "Convenience store job", zh: "便利店兼职", vi: "Làm thêm cửa hàng", ja: "コンビニバイト", id: "Kerja minimarket" },
    before: {
      ko: "편의점에서 2년 동안 일하면서 책임감을 배웠습니다.",
      en: "Working at a convenience store for 2 years taught me responsibility.",
      zh: "在便利店工作了2年，我学会了责任感。",
      vi: "Làm việc ở cửa hàng tiện lợi 2 năm đã dạy tôi tinh thần trách nhiệm.",
      ja: "コンビニで2年間働きながら責任感を学びました。",
      id: "Bekerja di minimarket selama 2 tahun mengajarkan saya tanggung jawab."
    },
    after: {
      ko: "판매 패턴을 분석하고 발주 개선을 제안한 경험을 영업관리 역량으로 연결했습니다.",
      en: "I analyzed sales patterns and proposed better ordering — and linked that to sales management skills.",
      zh: "将分析销售规律、提出订货改进方案的经历，与销售管理能力联系起来。",
      vi: "Tôi phân tích xu hướng bán hàng và đề xuất cải thiện việc đặt hàng — rồi liên kết với năng lực quản lý bán hàng.",
      ja: "販売パターンを分析し、発注の改善を提案した経験を営業管理の力につなげました。",
      id: "Saya menganalisis pola penjualan dan mengusulkan perbaikan pemesanan — lalu mengaitkannya dengan kemampuan manajemen penjualan."
    }
  },
  {
    tag: { ko: "동아리 활동", en: "Student club", zh: "社团活动", vi: "Câu lạc bộ", ja: "サークル活動", id: "Klub kampus" },
    before: {
      ko: "동아리 회장으로 활동하며 리더십을 길렀습니다.",
      en: "As club president, I developed leadership.",
      zh: "担任社团会长期间，我培养了领导力。",
      vi: "Khi làm chủ nhiệm câu lạc bộ, tôi đã rèn luyện khả năng lãnh đạo.",
      ja: "サークルの代表として活動し、リーダーシップを培いました。",
      id: "Sebagai ketua klub, saya mengembangkan jiwa kepemimpinan."
    },
    after: {
      ko: "회원이 줄어든 이유를 설문으로 찾아 활동 방식을 바꾸고 참여율을 높인 경험을 조직 관리 역량으로 연결했습니다.",
      en: "I surveyed members to find why they were leaving, changed how we ran activities and raised participation — linked to team management skills.",
      zh: "通过问卷找出成员减少的原因，改变活动方式、提高参与率，并将这段经历与组织管理能力联系起来。",
      vi: "Tôi khảo sát để tìm lý do thành viên rời đi, thay đổi cách tổ chức hoạt động và tăng tỷ lệ tham gia — liên kết với năng lực quản lý tổ chức.",
      ja: "部員が減った理由をアンケートで探り、活動方法を変えて参加率を高めた経験を組織運営の力につなげました。",
      id: "Saya menyurvei anggota untuk mencari tahu kenapa mereka keluar, mengubah cara kegiatan, dan meningkatkan partisipasi — dikaitkan dengan kemampuan manajemen organisasi."
    }
  },
  {
    tag: { ko: "통역 봉사", en: "Volunteer interpreting", zh: "翻译志愿", vi: "Phiên dịch tình nguyện", ja: "通訳ボランティア", id: "Relawan penerjemah" },
    before: {
      ko: "외국인 관광객 안내 봉사를 하며 소통 능력을 키웠습니다.",
      en: "Guiding foreign tourists as a volunteer improved my communication skills.",
      zh: "通过为外国游客提供向导志愿服务，我提高了沟通能力。",
      vi: "Làm tình nguyện viên hướng dẫn du khách nước ngoài giúp tôi nâng cao kỹ năng giao tiếp.",
      ja: "外国人観光客の案内ボランティアを通じて、コミュニケーション能力を高めました。",
      id: "Menjadi relawan pemandu turis asing meningkatkan kemampuan komunikasi saya."
    },
    after: {
      ko: "관광객이 자주 묻는 질문을 모아 다국어 안내 자료를 만든 경험을 해외 고객 응대 역량으로 연결했습니다.",
      en: "I collected tourists' most common questions and made multilingual guides — linked to global customer service skills.",
      zh: "将收集游客常见问题、制作多语种指南资料的经历，与海外客户服务能力联系起来。",
      vi: "Tôi tổng hợp các câu hỏi du khách hay hỏi và làm tài liệu hướng dẫn đa ngôn ngữ — liên kết với năng lực chăm sóc khách hàng quốc tế.",
      ja: "観光客によくある質問を集めて多言語の案内資料を作った経験を、海外顧客対応の力につなげました。",
      id: "Saya mengumpulkan pertanyaan yang sering diajukan turis dan membuat panduan multibahasa — dikaitkan dengan kemampuan melayani pelanggan global."
    }
  }
];

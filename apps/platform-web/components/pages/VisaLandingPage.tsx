"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, Globe } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { PLATFORM_LOCALES, type PlatformLocale } from "../../lib/auth-messages";

// ---------------------------------------------------------------------------
// /events/visa — 외국인이 받을 수 있는 한국 비자를 즉시 진단해주는 viral
// 랜딩. saju 와 동일한 i18n + 컴포넌트 구조로 6개 로케일 지원. 진단 후
// shareSlug 받아 /events/visa/result/[slug] 로 이동.
// ---------------------------------------------------------------------------

type Copy = {
  pill: string;
  titleA: string;
  titleHighlight: string;
  titleB: string;
  intro: string;
  nationalityLabel: string;
  nationalitySelect: string;
  nationalityOtherPlaceholder: string;
  educationLabel: string;
  majorLabel: string;
  majorSelect: string;
  koreanLevelLabel: string;
  workYearsLabel: string;
  optionalSection: string;
  nameLabel: string;
  namePlaceholder: string;
  currentVisaLabel: string;
  currentVisaPlaceholder: string;
  targetRoleLabel: string;
  targetRolePlaceholder: string;
  errNationality: string;
  errRetry: string;
  submitting: string;
  submit: string;
  disclaimerPrefix: string;
  disclaimerSuffix: string;
  langLabel: string;
  education: { high: string; bachelor: string; master: string; phd: string };
  korean: { none: string; beginner: string; intermediate: string; advanced: string; native: string };
  // 전공·비자 라벨은 동적 키를 지원하기 위해 Record 로.
  majorNames: Record<string, string>;
  visaCodeNames: Record<string, string>;
  currentVisaSelect: string;
  currentVisaOtherPlaceholder: string;
  nationalityNames: Record<string, string>;
};

// 한국 외국인 유학생/취업 비자 신청자 분포 기반. 동남아·동아·남아 중심 +
// 한국에 학생/노동 비자로 들어오는 주요 글로벌 국가들. 알파벳 ISO-2 코드.
const NATIONALITY_CODES = [
  "VN", "CN", "ID", "MN", "MM", "TH", "JP", "PH", "IN", "BD",
  "PK", "NP", "UZ", "KH", "KZ", "KG", "MY", "SG", "TW", "LK",
  "LA", "TJ", "TM", "RU", "TR", "EG", "NG", "ZA", "KE",
  "US", "GB", "CA", "AU", "NZ", "DE", "FR", "IT", "ES", "NL", "PL", "UA",
  "BR", "MX", "AR", "CL",
  "OTHER"
] as const;

// 전공 카테고리 — 기존 7개에서 22개로 확장. 한국 외국인 학생들이 실제로
// 가지는 전공 분포 + 한국 채용 시장에서 자주 보이는 분야 위주.
const MAJOR_CODES = [
  "IT_SOFTWARE", "AI_DATA",
  "MECHANICAL", "ELECTRICAL", "CIVIL", "CHEMICAL",
  "BUSINESS", "ECONOMICS", "MARKETING",
  "DESIGN", "ART",
  "HUMANITIES", "KOREAN_STUDIES", "EDUCATION", "LAW", "SOCIAL_SCIENCE",
  "SCIENCE", "MEDICINE", "AGRICULTURE",
  "TOURISM", "COMMUNICATIONS", "INTERNATIONAL",
  "OTHER"
] as const;

// 현재 비자 — 외국인이 자기 비자 코드를 정확히 알기 어려워서 select 박스로
// 제공. "없음(한국 밖)" 도 옵션. OTHER 는 직접 입력 fallback.
const CURRENT_VISA_CODES = [
  "NONE",
  "D-2", "D-4", "D-10",
  "F-2", "F-4", "F-5", "F-6",
  "E-7", "E-9",
  "H-1",
  "OTHER"
] as const;

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pill: "Aply × 비자 체크",
    titleA: "내가 받을 수 있는",
    titleHighlight: "한국 비자",
    titleB: "는?",
    intro: "국적·학력·한국어 수준만 입력하면\n받을 가능성이 있는 비자와 조건을 즉시 진단해드려요.",
    nationalityLabel: "국적",
    nationalitySelect: "선택해주세요",
    nationalityOtherPlaceholder: "국적을 입력해 주세요",
    educationLabel: "최종 학력",
    majorLabel: "전공 분야",
    majorSelect: "선택해주세요",
    koreanLevelLabel: "한국어 수준",
    workYearsLabel: "관련 경력 (년)",
    optionalSection: "추가 정보 (선택)",
    nameLabel: "이름",
    namePlaceholder: "결과 카드에 표시됩니다",
    currentVisaLabel: "현재 비자",
    currentVisaPlaceholder: "예: D-2, F-4",
    currentVisaSelect: "선택해주세요",
    currentVisaOtherPlaceholder: "비자 코드를 입력해 주세요",
    targetRoleLabel: "희망 직무",
    targetRolePlaceholder: "예: 소프트웨어 엔지니어",
    errNationality: "국적을 선택해 주세요.",
    errRetry: "잠시 후 다시 시도해 주세요.",
    submitting: "진단 중...",
    submit: "비자 진단 받기",
    disclaimerPrefix: "본 진단은 참고용이며 법률 자문이 아닙니다. 정확한 안내는 ",
    disclaimerSuffix: " 또는 출입국·외국인청을 확인해 주세요.",
    langLabel: "한국어",
    education: { high: "고졸", bachelor: "학사", master: "석사", phd: "박사" },
    korean: { none: "전혀 못함", beginner: "초급", intermediate: "중급", advanced: "고급", native: "원어민" },
    majorNames: {
      IT_SOFTWARE: "IT·소프트웨어", AI_DATA: "AI·데이터",
      MECHANICAL: "기계공학", ELECTRICAL: "전기·전자", CIVIL: "건축·토목", CHEMICAL: "화학·소재",
      BUSINESS: "경영·회계", ECONOMICS: "경제·금융", MARKETING: "마케팅·광고",
      DESIGN: "디자인·UX", ART: "미술·음악·영상",
      HUMANITIES: "인문·어학", KOREAN_STUDIES: "한국학·한국어교육", EDUCATION: "교육학",
      LAW: "법학", SOCIAL_SCIENCE: "사회·정치·심리",
      SCIENCE: "자연과학", MEDICINE: "의·약·간호·보건", AGRICULTURE: "농·수산·식품",
      TOURISM: "관광·호텔", COMMUNICATIONS: "미디어·신문방송", INTERNATIONAL: "국제·외교",
      OTHER: "기타"
    },
    visaCodeNames: {
      NONE: "없음 (한국 밖)",
      "D-2": "D-2 유학",
      "D-4": "D-4 일반연수",
      "D-10": "D-10 구직",
      "F-2": "F-2 거주",
      "F-4": "F-4 재외동포",
      "F-5": "F-5 영주",
      "F-6": "F-6 결혼이민",
      "E-7": "E-7 특정활동",
      "E-9": "E-9 비전문취업",
      "H-1": "H-1 관광취업",
      OTHER: "기타 (직접 입력)"
    },
    nationalityNames: {
      VN: "베트남", CN: "중국", ID: "인도네시아", MN: "몽골", MM: "미얀마", TH: "태국",
      JP: "일본", PH: "필리핀", IN: "인도", BD: "방글라데시", PK: "파키스탄", NP: "네팔",
      UZ: "우즈베키스탄", KH: "캄보디아", KZ: "카자흐스탄", KG: "키르기스스탄",
      MY: "말레이시아", SG: "싱가포르", TW: "대만", LK: "스리랑카", LA: "라오스",
      TJ: "타지키스탄", TM: "투르크메니스탄", RU: "러시아", TR: "튀르키예",
      EG: "이집트", NG: "나이지리아", ZA: "남아프리카공화국", KE: "케냐",
      US: "미국", GB: "영국", CA: "캐나다", AU: "호주", NZ: "뉴질랜드",
      DE: "독일", FR: "프랑스", IT: "이탈리아", ES: "스페인", NL: "네덜란드",
      PL: "폴란드", UA: "우크라이나",
      BR: "브라질", MX: "멕시코", AR: "아르헨티나", CL: "칠레",
      OTHER: "기타 (직접 입력)"
    }
  },
  en: {
    pill: "Aply × Visa check",
    titleA: "Which Korean",
    titleHighlight: "work visa",
    titleB: " can I get?",
    intro: "Tell us your nationality, education and Korean level —\nwe'll show what visa options are within reach.",
    nationalityLabel: "Nationality",
    nationalitySelect: "Choose one",
    nationalityOtherPlaceholder: "Type your nationality",
    educationLabel: "Highest education",
    majorLabel: "Field of study",
    majorSelect: "Choose one",
    koreanLevelLabel: "Korean level",
    workYearsLabel: "Years of related work",
    optionalSection: "Extra info (optional)",
    nameLabel: "Name",
    namePlaceholder: "Shown on your result card",
    currentVisaLabel: "Current visa",
    currentVisaPlaceholder: "e.g. D-2, F-4",
    currentVisaSelect: "Choose one",
    currentVisaOtherPlaceholder: "Enter your visa code",
    targetRoleLabel: "Target role",
    targetRolePlaceholder: "e.g. Software engineer",
    errNationality: "Please pick a nationality.",
    errRetry: "Something went wrong — please try again.",
    submitting: "Checking...",
    submit: "Check my visa options",
    disclaimerPrefix: "This is informational, not legal advice. For exact guidance see ",
    disclaimerSuffix: " or your local immigration office.",
    langLabel: "English",
    education: { high: "High school", bachelor: "Bachelor", master: "Master", phd: "PhD" },
    korean: { none: "None", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", native: "Native" },
    majorNames: {
      IT_SOFTWARE: "IT / Software", AI_DATA: "AI / Data",
      MECHANICAL: "Mechanical eng.", ELECTRICAL: "Electrical eng.", CIVIL: "Civil / Arch.", CHEMICAL: "Chem / Materials",
      BUSINESS: "Business / Accounting", ECONOMICS: "Economics / Finance", MARKETING: "Marketing / Ads",
      DESIGN: "Design / UX", ART: "Fine arts / Music / Film",
      HUMANITIES: "Humanities / Lang.", KOREAN_STUDIES: "Korean studies", EDUCATION: "Education",
      LAW: "Law", SOCIAL_SCIENCE: "Social sciences",
      SCIENCE: "Natural sciences", MEDICINE: "Med / Nursing / Health", AGRICULTURE: "Agriculture / Food",
      TOURISM: "Tourism / Hospitality", COMMUNICATIONS: "Media / Journalism", INTERNATIONAL: "Int'l / Diplomacy",
      OTHER: "Other"
    },
    visaCodeNames: {
      NONE: "None (outside Korea)",
      "D-2": "D-2 Student",
      "D-4": "D-4 General training",
      "D-10": "D-10 Job seeking",
      "F-2": "F-2 Residence",
      "F-4": "F-4 Overseas Korean",
      "F-5": "F-5 Permanent",
      "F-6": "F-6 Marriage",
      "E-7": "E-7 Specific activity",
      "E-9": "E-9 Non-professional",
      "H-1": "H-1 Working holiday",
      OTHER: "Other (type yourself)"
    },
    nationalityNames: {
      VN: "Vietnam", CN: "China", ID: "Indonesia", MN: "Mongolia", MM: "Myanmar", TH: "Thailand",
      JP: "Japan", PH: "Philippines", IN: "India", BD: "Bangladesh", PK: "Pakistan", NP: "Nepal",
      UZ: "Uzbekistan", KH: "Cambodia", KZ: "Kazakhstan", KG: "Kyrgyzstan",
      MY: "Malaysia", SG: "Singapore", TW: "Taiwan", LK: "Sri Lanka", LA: "Laos",
      TJ: "Tajikistan", TM: "Turkmenistan", RU: "Russia", TR: "Türkiye",
      EG: "Egypt", NG: "Nigeria", ZA: "South Africa", KE: "Kenya",
      US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia", NZ: "New Zealand",
      DE: "Germany", FR: "France", IT: "Italy", ES: "Spain", NL: "Netherlands",
      PL: "Poland", UA: "Ukraine",
      BR: "Brazil", MX: "Mexico", AR: "Argentina", CL: "Chile",
      OTHER: "Other (type yourself)"
    }
  },
  "zh-CN": {
    pill: "Aply × 签证检查",
    titleA: "我可以申请什么",
    titleHighlight: "韩国签证",
    titleB: "？",
    intro: "只需填写国籍·学历·韩语水平，\n立即诊断你可申请的签证选项与条件。",
    nationalityLabel: "国籍",
    nationalitySelect: "请选择",
    nationalityOtherPlaceholder: "请输入您的国籍",
    educationLabel: "最高学历",
    majorLabel: "专业领域",
    majorSelect: "请选择",
    koreanLevelLabel: "韩语水平",
    workYearsLabel: "相关工作年限",
    optionalSection: "其他信息（可选）",
    nameLabel: "姓名",
    namePlaceholder: "将显示在结果卡片上",
    currentVisaLabel: "当前签证",
    currentVisaPlaceholder: "如: D-2, F-4",
    currentVisaSelect: "请选择",
    currentVisaOtherPlaceholder: "请输入签证代码",
    targetRoleLabel: "目标职位",
    targetRolePlaceholder: "如: 软件工程师",
    errNationality: "请选择国籍。",
    errRetry: "出现问题，请稍后重试。",
    submitting: "诊断中...",
    submit: "查看我的签证选项",
    disclaimerPrefix: "本诊断仅供参考，非法律咨询。准确指引请查看 ",
    disclaimerSuffix: " 或当地出入境管理部门。",
    langLabel: "简体中文",
    education: { high: "高中", bachelor: "本科", master: "硕士", phd: "博士" },
    korean: { none: "完全不会", beginner: "初级", intermediate: "中级", advanced: "高级", native: "母语水平" },
    majorNames: {
      IT_SOFTWARE: "IT/软件", AI_DATA: "AI/数据",
      MECHANICAL: "机械工程", ELECTRICAL: "电气电子", CIVIL: "建筑/土木", CHEMICAL: "化学/材料",
      BUSINESS: "经营/会计", ECONOMICS: "经济/金融", MARKETING: "营销/广告",
      DESIGN: "设计/UX", ART: "美术/音乐/影像",
      HUMANITIES: "人文/语言", KOREAN_STUDIES: "韩国学/韩语教育", EDUCATION: "教育学",
      LAW: "法学", SOCIAL_SCIENCE: "社会/政治/心理",
      SCIENCE: "自然科学", MEDICINE: "医学/护理/保健", AGRICULTURE: "农林水产/食品",
      TOURISM: "旅游/酒店", COMMUNICATIONS: "媒体/新闻", INTERNATIONAL: "国际关系/外交",
      OTHER: "其他"
    },
    visaCodeNames: {
      NONE: "无（在韩国境外）",
      "D-2": "D-2 留学",
      "D-4": "D-4 一般研修",
      "D-10": "D-10 求职",
      "F-2": "F-2 居住",
      "F-4": "F-4 在外同胞",
      "F-5": "F-5 永驻",
      "F-6": "F-6 结婚移民",
      "E-7": "E-7 特定活动",
      "E-9": "E-9 非专业就业",
      "H-1": "H-1 观光就业",
      OTHER: "其他（手动输入）"
    },
    nationalityNames: {
      VN: "越南", CN: "中国", ID: "印度尼西亚", MN: "蒙古", MM: "缅甸", TH: "泰国",
      JP: "日本", PH: "菲律宾", IN: "印度", BD: "孟加拉", PK: "巴基斯坦", NP: "尼泊尔",
      UZ: "乌兹别克斯坦", KH: "柬埔寨", KZ: "哈萨克斯坦", KG: "吉尔吉斯斯坦",
      MY: "马来西亚", SG: "新加坡", TW: "台湾", LK: "斯里兰卡", LA: "老挝",
      TJ: "塔吉克斯坦", TM: "土库曼斯坦", RU: "俄罗斯", TR: "土耳其",
      EG: "埃及", NG: "尼日利亚", ZA: "南非", KE: "肯尼亚",
      US: "美国", GB: "英国", CA: "加拿大", AU: "澳大利亚", NZ: "新西兰",
      DE: "德国", FR: "法国", IT: "意大利", ES: "西班牙", NL: "荷兰",
      PL: "波兰", UA: "乌克兰",
      BR: "巴西", MX: "墨西哥", AR: "阿根廷", CL: "智利",
      OTHER: "其他（手动输入）"
    }
  },
  vi: {
    pill: "Aply × Kiểm tra visa",
    titleA: "Tôi có thể nhận",
    titleHighlight: "visa Hàn Quốc",
    titleB: " nào?",
    intro: "Chỉ cần nhập quốc tịch, học vấn và trình độ tiếng Hàn —\nbạn sẽ biết ngay những loại visa khả thi.",
    nationalityLabel: "Quốc tịch",
    nationalitySelect: "Chọn một",
    nationalityOtherPlaceholder: "Nhập quốc tịch của bạn",
    educationLabel: "Trình độ cao nhất",
    majorLabel: "Chuyên ngành",
    majorSelect: "Chọn một",
    koreanLevelLabel: "Trình độ tiếng Hàn",
    workYearsLabel: "Số năm kinh nghiệm",
    optionalSection: "Thông tin thêm (tùy chọn)",
    nameLabel: "Tên",
    namePlaceholder: "Sẽ hiển thị trên thẻ kết quả",
    currentVisaLabel: "Visa hiện tại",
    currentVisaPlaceholder: "Vd: D-2, F-4",
    currentVisaSelect: "Chọn một",
    currentVisaOtherPlaceholder: "Nhập mã visa của bạn",
    targetRoleLabel: "Vị trí mong muốn",
    targetRolePlaceholder: "Vd: Kỹ sư phần mềm",
    errNationality: "Vui lòng chọn quốc tịch.",
    errRetry: "Có lỗi xảy ra — vui lòng thử lại.",
    submitting: "Đang kiểm tra...",
    submit: "Kiểm tra visa của tôi",
    disclaimerPrefix: "Đây chỉ là tham khảo, không phải tư vấn pháp lý. Để biết chính xác, hãy xem ",
    disclaimerSuffix: " hoặc văn phòng xuất nhập cảnh địa phương.",
    langLabel: "Tiếng Việt",
    education: { high: "THPT", bachelor: "Cử nhân", master: "Thạc sĩ", phd: "Tiến sĩ" },
    korean: { none: "Không biết", beginner: "Sơ cấp", intermediate: "Trung cấp", advanced: "Cao cấp", native: "Bản ngữ" },
    majorNames: {
      IT_SOFTWARE: "IT/Phần mềm", AI_DATA: "AI/Dữ liệu",
      MECHANICAL: "Kỹ thuật cơ khí", ELECTRICAL: "Điện/Điện tử", CIVIL: "Xây dựng/Kiến trúc", CHEMICAL: "Hóa học/Vật liệu",
      BUSINESS: "Kinh doanh/Kế toán", ECONOMICS: "Kinh tế/Tài chính", MARKETING: "Marketing/Quảng cáo",
      DESIGN: "Thiết kế/UX", ART: "Mỹ thuật/Âm nhạc/Phim",
      HUMANITIES: "Nhân văn/Ngôn ngữ", KOREAN_STUDIES: "Hàn Quốc học/Tiếng Hàn", EDUCATION: "Giáo dục",
      LAW: "Luật", SOCIAL_SCIENCE: "Xã hội/Chính trị/Tâm lý",
      SCIENCE: "Khoa học tự nhiên", MEDICINE: "Y/Dược/Điều dưỡng", AGRICULTURE: "Nông lâm/Thủy sản",
      TOURISM: "Du lịch/Khách sạn", COMMUNICATIONS: "Truyền thông/Báo chí", INTERNATIONAL: "Quan hệ quốc tế",
      OTHER: "Khác"
    },
    visaCodeNames: {
      NONE: "Không có (ngoài Hàn Quốc)",
      "D-2": "D-2 Du học",
      "D-4": "D-4 Đào tạo chung",
      "D-10": "D-10 Tìm việc",
      "F-2": "F-2 Cư trú",
      "F-4": "F-4 Người Hàn hải ngoại",
      "F-5": "F-5 Vĩnh trú",
      "F-6": "F-6 Kết hôn",
      "E-7": "E-7 Hoạt động đặc định",
      "E-9": "E-9 Lao động phổ thông",
      "H-1": "H-1 Working holiday",
      OTHER: "Khác (tự nhập)"
    },
    nationalityNames: {
      VN: "Việt Nam", CN: "Trung Quốc", ID: "Indonesia", MN: "Mông Cổ", MM: "Myanmar", TH: "Thái Lan",
      JP: "Nhật Bản", PH: "Philippines", IN: "Ấn Độ", BD: "Bangladesh", PK: "Pakistan", NP: "Nepal",
      UZ: "Uzbekistan", KH: "Campuchia", KZ: "Kazakhstan", KG: "Kyrgyzstan",
      MY: "Malaysia", SG: "Singapore", TW: "Đài Loan", LK: "Sri Lanka", LA: "Lào",
      TJ: "Tajikistan", TM: "Turkmenistan", RU: "Nga", TR: "Thổ Nhĩ Kỳ",
      EG: "Ai Cập", NG: "Nigeria", ZA: "Nam Phi", KE: "Kenya",
      US: "Hoa Kỳ", GB: "Anh", CA: "Canada", AU: "Úc", NZ: "New Zealand",
      DE: "Đức", FR: "Pháp", IT: "Ý", ES: "Tây Ban Nha", NL: "Hà Lan",
      PL: "Ba Lan", UA: "Ukraina",
      BR: "Brazil", MX: "Mexico", AR: "Argentina", CL: "Chile",
      OTHER: "Khác (tự nhập)"
    }
  },
  ja: {
    pill: "Aply × ビザ診断",
    titleA: "私が取得できる",
    titleHighlight: "韓国ビザ",
    titleB: "は？",
    intro: "国籍・学歴・韓国語レベルを入力するだけで\n取得可能なビザと条件をすぐに診断します。",
    nationalityLabel: "国籍",
    nationalitySelect: "選択してください",
    nationalityOtherPlaceholder: "国籍を入力してください",
    educationLabel: "最終学歴",
    majorLabel: "専攻分野",
    majorSelect: "選択してください",
    koreanLevelLabel: "韓国語レベル",
    workYearsLabel: "関連経歴（年）",
    optionalSection: "追加情報（任意）",
    nameLabel: "名前",
    namePlaceholder: "結果カードに表示されます",
    currentVisaLabel: "現在のビザ",
    currentVisaPlaceholder: "例: D-2, F-4",
    currentVisaSelect: "選択してください",
    currentVisaOtherPlaceholder: "ビザコードを入力",
    targetRoleLabel: "希望職種",
    targetRolePlaceholder: "例: ソフトウェアエンジニア",
    errNationality: "国籍を選択してください。",
    errRetry: "しばらくしてから再度お試しください。",
    submitting: "診断中...",
    submit: "ビザを診断する",
    disclaimerPrefix: "本診断は参考用であり法律相談ではありません。正確な案内は ",
    disclaimerSuffix: " または出入国・外国人庁をご確認ください。",
    langLabel: "日本語",
    education: { high: "高卒", bachelor: "学士", master: "修士", phd: "博士" },
    korean: { none: "全くできない", beginner: "初級", intermediate: "中級", advanced: "上級", native: "母語" },
    majorNames: {
      IT_SOFTWARE: "IT・ソフトウェア", AI_DATA: "AI・データ",
      MECHANICAL: "機械工学", ELECTRICAL: "電気・電子", CIVIL: "建築・土木", CHEMICAL: "化学・素材",
      BUSINESS: "経営・会計", ECONOMICS: "経済・金融", MARKETING: "マーケティング・広告",
      DESIGN: "デザイン・UX", ART: "美術・音楽・映像",
      HUMANITIES: "人文・語学", KOREAN_STUDIES: "韓国学・韓国語教育", EDUCATION: "教育学",
      LAW: "法学", SOCIAL_SCIENCE: "社会・政治・心理",
      SCIENCE: "自然科学", MEDICINE: "医・薬・看護・保健", AGRICULTURE: "農林水産・食品",
      TOURISM: "観光・ホテル", COMMUNICATIONS: "メディア・新聞放送", INTERNATIONAL: "国際関係・外交",
      OTHER: "その他"
    },
    visaCodeNames: {
      NONE: "なし（韓国国外）",
      "D-2": "D-2 留学",
      "D-4": "D-4 一般研修",
      "D-10": "D-10 求職",
      "F-2": "F-2 居住",
      "F-4": "F-4 在外同胞",
      "F-5": "F-5 永住",
      "F-6": "F-6 結婚移民",
      "E-7": "E-7 特定活動",
      "E-9": "E-9 非専門就業",
      "H-1": "H-1 ワーキングホリデー",
      OTHER: "その他（手入力）"
    },
    nationalityNames: {
      VN: "ベトナム", CN: "中国", ID: "インドネシア", MN: "モンゴル", MM: "ミャンマー", TH: "タイ",
      JP: "日本", PH: "フィリピン", IN: "インド", BD: "バングラデシュ", PK: "パキスタン", NP: "ネパール",
      UZ: "ウズベキスタン", KH: "カンボジア", KZ: "カザフスタン", KG: "キルギス",
      MY: "マレーシア", SG: "シンガポール", TW: "台湾", LK: "スリランカ", LA: "ラオス",
      TJ: "タジキスタン", TM: "トルクメニスタン", RU: "ロシア", TR: "トルコ",
      EG: "エジプト", NG: "ナイジェリア", ZA: "南アフリカ", KE: "ケニア",
      US: "アメリカ", GB: "イギリス", CA: "カナダ", AU: "オーストラリア", NZ: "ニュージーランド",
      DE: "ドイツ", FR: "フランス", IT: "イタリア", ES: "スペイン", NL: "オランダ",
      PL: "ポーランド", UA: "ウクライナ",
      BR: "ブラジル", MX: "メキシコ", AR: "アルゼンチン", CL: "チリ",
      OTHER: "その他（手入力）"
    }
  },
  id: {
    pill: "Aply × Cek visa",
    titleA: "Visa kerja Korea apa",
    titleHighlight: "yang bisa saya dapat",
    titleB: "?",
    intro: "Cukup masukkan kebangsaan, pendidikan, dan level Korea —\nkami tunjukkan opsi visa yang bisa dijangkau.",
    nationalityLabel: "Kebangsaan",
    nationalitySelect: "Pilih satu",
    nationalityOtherPlaceholder: "Tulis kebangsaan Anda",
    educationLabel: "Pendidikan tertinggi",
    majorLabel: "Bidang studi",
    majorSelect: "Pilih satu",
    koreanLevelLabel: "Level bahasa Korea",
    workYearsLabel: "Tahun pengalaman",
    optionalSection: "Info tambahan (opsional)",
    nameLabel: "Nama",
    namePlaceholder: "Tampil di kartu hasil",
    currentVisaLabel: "Visa saat ini",
    currentVisaPlaceholder: "Cth: D-2, F-4",
    currentVisaSelect: "Pilih satu",
    currentVisaOtherPlaceholder: "Masukkan kode visa Anda",
    targetRoleLabel: "Posisi yang dituju",
    targetRolePlaceholder: "Cth: Software engineer",
    errNationality: "Silakan pilih kebangsaan.",
    errRetry: "Terjadi kesalahan — silakan coba lagi.",
    submitting: "Memeriksa...",
    submit: "Cek opsi visa saya",
    disclaimerPrefix: "Hanya informasi, bukan nasihat hukum. Untuk panduan akurat lihat ",
    disclaimerSuffix: " atau kantor imigrasi setempat.",
    langLabel: "Bahasa Indonesia",
    education: { high: "SMA", bachelor: "Sarjana", master: "Magister", phd: "Doktor" },
    korean: { none: "Tidak bisa", beginner: "Pemula", intermediate: "Menengah", advanced: "Mahir", native: "Bahasa ibu" },
    majorNames: {
      IT_SOFTWARE: "IT/Perangkat lunak", AI_DATA: "AI/Data",
      MECHANICAL: "Teknik mesin", ELECTRICAL: "Listrik/Elektronik", CIVIL: "Sipil/Arsitektur", CHEMICAL: "Kimia/Material",
      BUSINESS: "Bisnis/Akuntansi", ECONOMICS: "Ekonomi/Keuangan", MARKETING: "Pemasaran/Iklan",
      DESIGN: "Desain/UX", ART: "Seni rupa/Musik/Film",
      HUMANITIES: "Humaniora/Bahasa", KOREAN_STUDIES: "Studi Korea/Bahasa Korea", EDUCATION: "Pendidikan",
      LAW: "Hukum", SOCIAL_SCIENCE: "Sosial/Politik/Psikologi",
      SCIENCE: "Sains alam", MEDICINE: "Medis/Perawat/Kesehatan", AGRICULTURE: "Pertanian/Pangan",
      TOURISM: "Pariwisata/Perhotelan", COMMUNICATIONS: "Media/Jurnalistik", INTERNATIONAL: "Hubungan internasional",
      OTHER: "Lainnya"
    },
    visaCodeNames: {
      NONE: "Tidak ada (di luar Korea)",
      "D-2": "D-2 Pelajar",
      "D-4": "D-4 Pelatihan umum",
      "D-10": "D-10 Pencari kerja",
      "F-2": "F-2 Residensi",
      "F-4": "F-4 Diaspora Korea",
      "F-5": "F-5 Permanen",
      "F-6": "F-6 Pernikahan",
      "E-7": "E-7 Aktivitas khusus",
      "E-9": "E-9 Non-profesional",
      "H-1": "H-1 Working holiday",
      OTHER: "Lainnya (tulis sendiri)"
    },
    nationalityNames: {
      VN: "Vietnam", CN: "Tiongkok", ID: "Indonesia", MN: "Mongolia", MM: "Myanmar", TH: "Thailand",
      JP: "Jepang", PH: "Filipina", IN: "India", BD: "Bangladesh", PK: "Pakistan", NP: "Nepal",
      UZ: "Uzbekistan", KH: "Kamboja", KZ: "Kazakhstan", KG: "Kirgistan",
      MY: "Malaysia", SG: "Singapura", TW: "Taiwan", LK: "Sri Lanka", LA: "Laos",
      TJ: "Tajikistan", TM: "Turkmenistan", RU: "Rusia", TR: "Turki",
      EG: "Mesir", NG: "Nigeria", ZA: "Afrika Selatan", KE: "Kenya",
      US: "Amerika Serikat", GB: "Inggris", CA: "Kanada", AU: "Australia", NZ: "Selandia Baru",
      DE: "Jerman", FR: "Prancis", IT: "Italia", ES: "Spanyol", NL: "Belanda",
      PL: "Polandia", UA: "Ukraina",
      BR: "Brasil", MX: "Meksiko", AR: "Argentina", CL: "Chili",
      OTHER: "Lainnya (tulis sendiri)"
    }
  }
};

export function VisaLandingPage() {
  const router = useRouter();
  const { locale, setLocale } = useLanguage();
  const t = COPY[locale] ?? COPY.ko;
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);

  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalityOther, setNationalityOther] = useState("");
  // 현재 비자 — 12개 select + OTHER 자유 입력. "NONE" 은 백엔드로 undefined.
  const [currentVisa, setCurrentVisa] = useState("");
  const [currentVisaOther, setCurrentVisaOther] = useState("");
  const [educationLevel, setEducationLevel] = useState<string>("BACHELOR");
  const [majorCategory, setMajorCategory] = useState<string>("");
  const [koreanLevel, setKoreanLevel] = useState<string>("INTERMEDIATE");
  const [workYears, setWorkYears] = useState("0");
  const [targetRole, setTargetRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const finalNat = nationality === "OTHER" ? nationalityOther.trim() : nationality;
    if (!finalNat) {
      setError(t.errNationality);
      return;
    }
    // 현재 비자: NONE → 미보유 (undefined), OTHER → 자유 입력, 그 외 → 그 자체.
    const finalVisa =
      currentVisa === "OTHER"
        ? currentVisaOther.trim() || undefined
        : currentVisa && currentVisa !== "NONE"
        ? currentVisa
        : undefined;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/visa/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          nationality: finalNat,
          currentVisa: finalVisa,
          educationLevel,
          majorCategory: majorCategory || undefined,
          koreanLevel,
          workYears: Number(workYears) || 0,
          targetRole: targetRole.trim() || undefined,
          locale
        })
      });
      const payload = (await response.json()) as { ok?: boolean; shareSlug?: string; message?: string };
      if (!response.ok || !payload.ok || !payload.shareSlug) {
        throw new Error(payload.message ?? t.errRetry);
      }
      router.push(`/events/visa/result/${encodeURIComponent(payload.shareSlug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errRetry);
      setSubmitting(false);
    }
  }

  const educationOptions: { code: string; label: string }[] = [
    { code: "HIGH_SCHOOL", label: t.education.high },
    { code: "BACHELOR", label: t.education.bachelor },
    { code: "MASTER", label: t.education.master },
    { code: "PHD", label: t.education.phd }
  ];
  const koreanOptions: { code: string; label: string }[] = [
    { code: "NONE", label: t.korean.none },
    { code: "BEGINNER", label: t.korean.beginner },
    { code: "INTERMEDIATE", label: t.korean.intermediate },
    { code: "ADVANCED", label: t.korean.advanced },
    { code: "NATIVE", label: t.korean.native }
  ];
  const majorOptions: { code: string; label: string }[] = MAJOR_CODES.map((code) => ({
    code,
    label: t.majorNames[code] ?? code
  }));

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* 언어 셀렉터 — saju 와 동일하게 페이지 안 좌측 상단에서 한 번 더 선택
              가능하게 (헤더 토글이 가려질 수 있는 모바일에서 특히 유용) */}
          <div className="flex justify-end">
            <div className="relative inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-white px-3 py-1.5 text-xs font-semibold text-foreground/80">
              <Globe className="h-3.5 w-3.5" weight="bold" />
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as PlatformLocale)}
                className="appearance-none bg-transparent pr-4 text-xs font-semibold focus-visible:outline-none"
                aria-label={t.langLabel}
              >
                {PLATFORM_LOCALES.map((loc) => (
                  <option key={loc} value={loc}>
                    {COPY[loc]?.langLabel ?? loc}
                  </option>
                ))}
              </select>
              <CaretDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-muted-foreground" weight="bold" />
            </div>
          </div>

          <header className="space-y-3 text-center">
            <p className="inline-flex items-center rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-semibold text-primary">
              {t.pill}
            </p>
            <h1 className="font-display text-3xl font-black tracking-[-0.02em] md:text-4xl">
              {t.titleA} <span className="text-primary">{t.titleHighlight}</span>{t.titleB}
            </h1>
            <p className="whitespace-pre-line text-sm text-muted-foreground md:text-base">
              {t.intro}
            </p>
          </header>

          <section className="space-y-5 rounded-2xl bg-white p-5 md:p-6">
            {/* Nationality */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t.nationalityLabel} *</label>
              <div className="relative mt-1">
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border-0 bg-muted/40 px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t.nationalitySelect}</option>
                  {NATIONALITY_CODES.map((code) => (
                    <option key={code} value={code}>{t.nationalityNames[code] ?? code}</option>
                  ))}
                </select>
                <CaretDown
                  className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  weight="bold"
                />
              </div>
              {nationality === "OTHER" ? (
                <input
                  className="mt-2 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={nationalityOther}
                  onChange={(e) => setNationalityOther(e.target.value)}
                  placeholder={t.nationalityOtherPlaceholder}
                  maxLength={40}
                />
              ) : null}
            </div>

            {/* Education */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t.educationLabel} *</label>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {educationOptions.map((opt) => {
                  const active = educationLevel === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setEducationLevel(opt.code)}
                      className={`h-11 rounded-xl border text-sm font-semibold ${
                        active ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Major */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t.majorLabel}</label>
              <div className="relative mt-1">
                <select
                  value={majorCategory}
                  onChange={(e) => setMajorCategory(e.target.value)}
                  className="h-11 w-full appearance-none rounded-xl border-0 bg-muted/40 px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">{t.majorSelect}</option>
                  {majorOptions.map((m) => (
                    <option key={m.code} value={m.code}>{m.label}</option>
                  ))}
                </select>
                <CaretDown
                  className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  weight="bold"
                />
              </div>
            </div>

            {/* Korean level */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">{t.koreanLevelLabel} *</label>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {koreanOptions.map((opt) => {
                  const active = koreanLevel === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setKoreanLevel(opt.code)}
                      className={`h-11 rounded-xl border text-xs font-semibold ${
                        active ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work years */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-yrs">{t.workYearsLabel}</label>
              <input
                id="visa-yrs"
                type="number"
                min={0}
                max={50}
                value={workYears}
                onChange={(e) => setWorkYears(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Optional fields */}
            <div className="border-t border-border/40 pt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t.optionalSection}
              </p>
              <div>
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-name">{t.nameLabel}</label>
                <input
                  id="visa-name"
                  className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder={t.namePlaceholder}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-current">{t.currentVisaLabel}</label>
                <div className="relative mt-1">
                  <select
                    id="visa-current"
                    value={currentVisa}
                    onChange={(e) => setCurrentVisa(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border-0 bg-muted/40 px-3 pr-9 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">{t.currentVisaSelect}</option>
                    {CURRENT_VISA_CODES.map((code) => (
                      <option key={code} value={code}>{t.visaCodeNames[code] ?? code}</option>
                    ))}
                  </select>
                  <CaretDown
                    className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                    weight="bold"
                  />
                </div>
                {currentVisa === "OTHER" ? (
                  <input
                    className="mt-2 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={currentVisaOther}
                    onChange={(e) => setCurrentVisaOther(e.target.value)}
                    maxLength={20}
                    placeholder={t.currentVisaOtherPlaceholder}
                  />
                ) : null}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-role">{t.targetRoleLabel}</label>
                <input
                  id="visa-role"
                  className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  maxLength={80}
                  placeholder={t.targetRolePlaceholder}
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? t.submitting : t.submit}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              {t.disclaimerPrefix}
              <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                HiKorea
              </a>
              {t.disclaimerSuffix}
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

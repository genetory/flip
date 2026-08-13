"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass as Search } from "@phosphor-icons/react";
import Link from "next/link";
import { useLanguage } from "../../i18n/LanguageProvider";
import { ResourceSubPageLayout } from "./ResourceSubPageLayout";

type VisaItem = {
  code: string;
  labelKo: string;
  labelEn: string;
  labelZh: string;
  labelVi: string;
  labelJa: string;
  labelId: string;
  applicantKo: string;
  applicantEn: string;
  applicantZh: string;
  applicantVi: string;
  applicantJa: string;
  applicantId: string;
  durationKo: string;
  durationEn: string;
  durationZh: string;
  durationVi: string;
  durationJa: string;
  durationId: string;
};

type VisaCategory = {
  key: string;
  titleKo: string;
  titleEn: string;
  titleZh: string;
  titleVi: string;
  titleJa: string;
  titleId: string;
  descKo: string;
  descEn: string;
  descZh: string;
  descVi: string;
  descJa: string;
  descId: string;
  accentClass: string;
  accentSoftClass: string;
  cardBgClass: string;
  items: VisaItem[];
};

export type FlatVisaItem = VisaItem & {
  groupKey: string;
  groupTitleKo: string;
  groupTitleEn: string;
  groupTitleZh: string;
  groupTitleVi: string;
  groupTitleJa: string;
  groupTitleId: string;
  accentClass: string;
  accentSoftClass: string;
};

const EXTENDABLE_2Y = {
  ko: "2년 (연장 가능)",
  en: "2 years (extendable)",
  zh: "2 年（可延长）",
  vi: "2 năm (có thể gia hạn)",
  ja: "2年（延長可能）",
  id: "2 tahun (dapat diperpanjang)"
};

const EXTENDABLE_3Y = {
  ko: "3년 (연장 가능)",
  en: "3 years (extendable)",
  zh: "3 年（可延长）",
  vi: "3 năm (có thể gia hạn)",
  ja: "3年（延長可能）",
  id: "3 tahun (dapat diperpanjang)"
};

const EXTENDABLE_5Y = {
  ko: "5년 (연장 가능)",
  en: "5 years (extendable)",
  zh: "5 年（可延长）",
  vi: "5 năm (có thể gia hạn)",
  ja: "5年（延長可能）",
  id: "5 tahun (dapat diperpanjang)"
};

const NON_EXT_3M = {
  ko: "3개월 이내 (연장 불가)",
  en: "Within 3 months (non-extendable)",
  zh: "3 个月以内（不可延长）",
  vi: "Tối đa 3 tháng (không gia hạn)",
  ja: "3か月以内（延長不可）",
  id: "Maksimal 3 bulan (tidak dapat diperpanjang)"
};

const NON_EXT_90D = {
  ko: "90일 이내 (연장 불가)",
  en: "Within 90 days (non-extendable)",
  zh: "90 天以内（不可延长）",
  vi: "Tối đa 90 ngày (không gia hạn)",
  ja: "90日以内（延長不可）",
  id: "Maksimal 90 hari (tidak dapat diperpanjang)"
};

const PERMIT_DETAIL_VARIES = {
  ko: "상세 체류기간은 심사·허가 조건에 따라 달라질 수 있음",
  en: "Detailed stay period may vary by review and permit conditions",
  zh: "详细停留期限可能因审查与许可条件而异",
  vi: "Thời gian lưu trú cụ thể có thể thay đổi theo điều kiện xét duyệt và cấp phép",
  ja: "詳細な滞在期間は審査・許可条件により異なる場合があります",
  id: "Periode tinggal terperinci dapat berbeda tergantung kondisi peninjauan dan izin"
};

export const VISA_CATEGORIES: VisaCategory[] = [
  {
    key: "a",
    titleKo: "A계열",
    titleEn: "Category A",
    titleZh: "A 类",
    titleVi: "Loại A",
    titleJa: "A系列",
    titleId: "Kategori A",
    descKo: "외교, 공무, 국가간 협정에 따라 체류하는 사람",
    descEn: "People staying under diplomacy, official missions, or intergovernmental agreements",
    descZh: "因外交、公务、国家间协定而停留的人员",
    descVi: "Người lưu trú theo diện ngoại giao, công vụ hoặc hiệp định liên chính phủ",
    descJa: "外交、公務、国家間の協定に基づき滞在する人",
    descId: "Orang yang tinggal berdasarkan diplomatik, dinas, atau perjanjian antar pemerintah",
    accentClass: "text-[#3559A6]",
    accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "A-1",
        labelKo: "외교",
        labelEn: "Diplomacy",
        labelZh: "外交",
        labelVi: "Ngoại giao",
        labelJa: "外交",
        labelId: "Diplomatik",
        applicantKo: "외국 정부의 외교사절단 또는 영사기관의 구성원과 그 가족",
        applicantEn: "Members of foreign diplomatic or consular missions and their families",
        applicantZh: "外国政府的外交使节团或领事机构成员及其家属",
        applicantVi: "Thành viên đoàn ngoại giao hoặc cơ quan lãnh sự của chính phủ nước ngoài và gia đình",
        applicantJa: "外国政府の外交使節団または領事機関の構成員とその家族",
        applicantId: "Anggota misi diplomatik atau konsuler pemerintah asing beserta keluarganya",
        durationKo: "재임기간",
        durationEn: "Term of assignment",
        durationZh: "任职期间",
        durationVi: "Thời gian nhiệm kỳ",
        durationJa: "在任期間",
        durationId: "Masa jabatan"
      },
      {
        code: "A-2",
        labelKo: "공무",
        labelEn: "Official",
        labelZh: "公务",
        labelVi: "Công vụ",
        labelJa: "公務",
        labelId: "Dinas",
        applicantKo: "외국 정부 또는 국제기구의 공무 수행자와 그 가족",
        applicantEn: "Persons on official duty for foreign governments/international organizations and their families",
        applicantZh: "执行外国政府或国际机构公务人员及其家属",
        applicantVi: "Người thực hiện công vụ cho chính phủ nước ngoài hoặc tổ chức quốc tế và gia đình",
        applicantJa: "外国政府または国際機関の公務を遂行する人とその家族",
        applicantId: "Orang yang menjalankan tugas dinas pemerintah asing atau organisasi internasional beserta keluarganya",
        durationKo: "공무수행기간",
        durationEn: "Official duty period",
        durationZh: "公务执行期间",
        durationVi: "Thời gian thực hiện công vụ",
        durationJa: "公務遂行期間",
        durationId: "Masa pelaksanaan tugas dinas"
      },
      {
        code: "A-3",
        labelKo: "협정",
        labelEn: "Agreement",
        labelZh: "协定",
        labelVi: "Hiệp định",
        labelJa: "協定",
        labelId: "Perjanjian",
        applicantKo: "SOFA 협정에 따른 주한미군, 군속, 초청계약자 및 그 가족",
        applicantEn: "USFK members, civilian employees, invited contractors, and families under SOFA",
        applicantZh: "依据 SOFA 协定的驻韩美军、军属、应邀承包人及其家属",
        applicantVi: "Quân nhân Mỹ tại Hàn Quốc, nhân viên dân sự, nhà thầu được mời và gia đình theo hiệp định SOFA",
        applicantJa: "SOFA協定に基づく在韓米軍、軍属、招請契約者およびその家族",
        applicantId: "Anggota USFK, pegawai sipil, kontraktor undangan, dan keluarganya berdasarkan perjanjian SOFA",
        durationKo: "신분존속기간",
        durationEn: "Period of valid status",
        durationZh: "身份存续期间",
        durationVi: "Thời gian tồn tại tư cách",
        durationJa: "身分存続期間",
        durationId: "Masa berlakunya status"
      }
    ]
  },
  {
    key: "b",
    titleKo: "B계열",
    titleEn: "Category B",
    titleZh: "B 类",
    titleVi: "Loại B",
    titleJa: "B系列",
    titleId: "Kategori B",
    descKo: "사증면제협정, 상호주의 등에 따라 입국이 허용된 사람",
    descEn: "People permitted entry under visa waiver agreements or reciprocity",
    descZh: "依据免签协定、互惠原则等被允许入境的人员",
    descVi: "Người được phép nhập cảnh theo hiệp định miễn thị thực hoặc nguyên tắc đối ứng",
    descJa: "査証免除協定や相互主義などに基づき入国を許可された人",
    descId: "Orang yang diizinkan masuk berdasarkan perjanjian bebas visa atau prinsip resiprositas",
    accentClass: "text-[#2F8B66]",
    accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "B-1",
        labelKo: "사증면제",
        labelEn: "Visa Waiver",
        labelZh: "免签",
        labelVi: "Miễn thị thực",
        labelJa: "査証免除",
        labelId: "Bebas Visa",
        applicantKo: "대한민국과 사증면제협정을 체결한 국가의 국민",
        applicantEn: "Nationals of countries that signed visa-waiver agreements with Korea",
        applicantZh: "与韩国签订免签协定国家的国民",
        applicantVi: "Công dân các nước đã ký hiệp định miễn thị thực với Hàn Quốc",
        applicantJa: "大韓民国と査証免除協定を締結した国の国民",
        applicantId: "Warga negara dari negara yang telah menandatangani perjanjian bebas visa dengan Korea",
        durationKo: NON_EXT_3M.ko,
        durationEn: NON_EXT_3M.en,
        durationZh: NON_EXT_3M.zh,
        durationVi: NON_EXT_3M.vi,
        durationJa: NON_EXT_3M.ja,
        durationId: NON_EXT_3M.id
      },
      {
        code: "B-2",
        labelKo: "관광·통과",
        labelEn: "Tourism/Transit",
        labelZh: "旅游 · 过境",
        labelVi: "Du lịch · Quá cảnh",
        labelJa: "観光・通過",
        labelId: "Wisata · Transit",
        applicantKo: "관광·통과 등의 목적으로 사증 없이 입국하는 사람 (법무부 장관이 대상 지정)",
        applicantEn: "Persons entering without a visa for tourism/transit (designated by the Minister of Justice)",
        applicantZh: "以旅游、过境等目的免签入境的人员（由法务部长官指定对象）",
        applicantVi: "Người nhập cảnh không cần visa cho mục đích du lịch, quá cảnh (do Bộ trưởng Tư pháp chỉ định)",
        applicantJa: "観光・通過などの目的で査証なしで入国する人（法務部長官が対象を指定）",
        applicantId: "Orang yang masuk tanpa visa untuk tujuan wisata atau transit (ditetapkan oleh Menteri Kehakiman)",
        durationKo: NON_EXT_3M.ko,
        durationEn: NON_EXT_3M.en,
        durationZh: NON_EXT_3M.zh,
        durationVi: NON_EXT_3M.vi,
        durationJa: NON_EXT_3M.ja,
        durationId: NON_EXT_3M.id
      }
    ]
  },
  {
    key: "c",
    titleKo: "C계열",
    titleEn: "Category C",
    titleZh: "C 类",
    titleVi: "Loại C",
    titleJa: "C系列",
    titleId: "Kategori C",
    descKo: "90일 이내 일시 체류목적으로 입국하는 사람",
    descEn: "People entering for temporary stays within 90 days",
    descZh: "因 90 天以内临时停留目的入境的人员",
    descVi: "Người nhập cảnh với mục đích lưu trú tạm thời trong vòng 90 ngày",
    descJa: "90日以内の一時的な滞在を目的に入国する人",
    descId: "Orang yang masuk untuk tinggal sementara dalam waktu 90 hari",
    accentClass: "text-[#2C9A83]",
    accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "C-1",
        labelKo: "일시취재",
        labelEn: "Temporary Press",
        labelZh: "临时采访",
        labelVi: "Đưa tin tạm thời",
        labelJa: "一時取材",
        labelId: "Jurnalis Sementara",
        applicantKo: "일시적인 취재 또는 보도활동을 하는 사람",
        applicantEn: "Persons conducting temporary reporting or press activity",
        applicantZh: "进行临时采访或报道活动的人员",
        applicantVi: "Người thực hiện hoạt động đưa tin hoặc báo chí tạm thời",
        applicantJa: "一時的な取材または報道活動を行う人",
        applicantId: "Orang yang melakukan kegiatan peliputan atau pemberitaan sementara",
        durationKo: NON_EXT_90D.ko,
        durationEn: NON_EXT_90D.en,
        durationZh: NON_EXT_90D.zh,
        durationVi: NON_EXT_90D.vi,
        durationJa: NON_EXT_90D.ja,
        durationId: NON_EXT_90D.id
      },
      {
        code: "C-3",
        labelKo: "단기방문",
        labelEn: "Short-Term Visit",
        labelZh: "短期访问",
        labelVi: "Thăm ngắn hạn",
        labelJa: "短期訪問",
        labelId: "Kunjungan Singkat",
        applicantKo: "관광, 상용, 방문 등의 목적으로 단기간 체류하는 사람",
        applicantEn: "Persons staying short-term for tourism, business, or visits",
        applicantZh: "以旅游、商务、访问等目的短期停留的人员",
        applicantVi: "Người lưu trú ngắn hạn cho mục đích du lịch, công vụ, thăm thân",
        applicantJa: "観光、商用、訪問などの目的で短期間滞在する人",
        applicantId: "Orang yang tinggal singkat untuk tujuan wisata, bisnis, atau kunjungan",
        durationKo: NON_EXT_90D.ko,
        durationEn: NON_EXT_90D.en,
        durationZh: NON_EXT_90D.zh,
        durationVi: NON_EXT_90D.vi,
        durationJa: NON_EXT_90D.ja,
        durationId: NON_EXT_90D.id
      },
      {
        code: "C-4",
        labelKo: "단기취업",
        labelEn: "Short-Term Employment",
        labelZh: "短期就业",
        labelVi: "Việc làm ngắn hạn",
        labelJa: "短期就業",
        labelId: "Pekerjaan Jangka Pendek",
        applicantKo: "단기간 취업·영리활동을 하는 사람",
        applicantEn: "Persons engaged in short-term employment/profit activities",
        applicantZh: "进行短期就业、营利活动的人员",
        applicantVi: "Người tham gia hoạt động làm việc, sinh lợi ngắn hạn",
        applicantJa: "短期間の就業・営利活動を行う人",
        applicantId: "Orang yang terlibat dalam kegiatan kerja atau usaha jangka pendek",
        durationKo: NON_EXT_90D.ko,
        durationEn: NON_EXT_90D.en,
        durationZh: NON_EXT_90D.zh,
        durationVi: NON_EXT_90D.vi,
        durationJa: NON_EXT_90D.ja,
        durationId: NON_EXT_90D.id
      }
    ]
  },
  {
    key: "d",
    titleKo: "D계열",
    titleEn: "Category D",
    titleZh: "D 类",
    titleVi: "Loại D",
    titleJa: "D系列",
    titleId: "Kategori D",
    descKo: "교육, 문화, 투자 관련 활동을 위해 체류하는 사람",
    descEn: "People staying for education, culture, or investment-related activity",
    descZh: "因教育、文化、投资相关活动而停留的人员",
    descVi: "Người lưu trú cho các hoạt động liên quan đến giáo dục, văn hoá, đầu tư",
    descJa: "教育、文化、投資関連の活動のために滞在する人",
    descId: "Orang yang tinggal untuk kegiatan terkait pendidikan, budaya, atau investasi",
    accentClass: "text-[#C2961A]",
    accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "D-1",
        labelKo: "문화예술",
        labelEn: "Culture/Arts",
        labelZh: "文化艺术",
        labelVi: "Văn hoá nghệ thuật",
        labelJa: "文化芸術",
        labelId: "Budaya/Seni",
        applicantKo: "수익을 목적으로 하지 않는 문화·예술 활동을 하는 사람",
        applicantEn: "Persons engaged in non-profit cultural/art activities",
        applicantZh: "以非营利为目的从事文化艺术活动的人员",
        applicantVi: "Người hoạt động văn hoá, nghệ thuật không vì lợi nhuận",
        applicantJa: "営利を目的としない文化・芸術活動を行う人",
        applicantId: "Orang yang melakukan kegiatan budaya atau seni nirlaba",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "D-2",
        labelKo: "유학",
        labelEn: "Study",
        labelZh: "留学",
        labelVi: "Du học",
        labelJa: "留学",
        labelId: "Pelajar",
        applicantKo: "전문대학 이상의 교육기관 등에서 정규 교육을 받는 사람",
        applicantEn: "Persons receiving regular education at junior college level or above",
        applicantZh: "在专科大学以上教育机构接受正规教育的人员",
        applicantVi: "Người học chính quy tại các trường cao đẳng, đại học trở lên",
        applicantJa: "専門大学以上の教育機関などで正規教育を受ける人",
        applicantId: "Orang yang menempuh pendidikan reguler di lembaga pendidikan setingkat akademi atau lebih tinggi",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "D-3",
        labelKo: "기술연수",
        labelEn: "Technical Training",
        labelZh: "技术研修",
        labelVi: "Đào tạo kỹ thuật",
        labelJa: "技術研修",
        labelId: "Pelatihan Teknis",
        applicantKo: "국내 산업체에서 연수를 받으려는 해외 법인 생산직 근로자",
        applicantEn: "Production workers of overseas corporations training at Korean industries",
        applicantZh: "在韩国产业体接受研修的海外法人生产岗位员工",
        applicantVi: "Công nhân sản xuất của pháp nhân nước ngoài đến đào tạo tại doanh nghiệp Hàn Quốc",
        applicantJa: "韓国国内の産業体で研修を受ける海外法人の生産職労働者",
        applicantId: "Pekerja produksi dari badan hukum luar negeri yang menjalani pelatihan di industri Korea",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "D-4",
        labelKo: "일반연수",
        labelEn: "General Training",
        labelZh: "一般研修",
        labelVi: "Đào tạo chung",
        labelJa: "一般研修",
        labelId: "Pelatihan Umum",
        applicantKo: "대학부설 어학원, 사설 교육기관 등에서 연수를 받는 사람",
        applicantEn: "Persons training at university language institutes/private institutions",
        applicantZh: "在大学附属语学院、私立教育机构等接受研修的人员",
        applicantVi: "Người đào tạo tại trung tâm ngoại ngữ thuộc đại học, cơ sở giáo dục tư thục",
        applicantJa: "大学附設の語学院や民間教育機関などで研修を受ける人",
        applicantId: "Orang yang mengikuti pelatihan di lembaga bahasa universitas atau lembaga pendidikan swasta",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "D-5",
        labelKo: "취재",
        labelEn: "Press",
        labelZh: "采访",
        labelVi: "Đưa tin",
        labelJa: "取材",
        labelId: "Jurnalis",
        applicantKo: "국내에 주재하면서 취재 또는 보도활동을 하는 사람",
        applicantEn: "Persons stationed in Korea for reporting or press activities",
        applicantZh: "常驻韩国进行采访或报道活动的人员",
        applicantVi: "Người thường trú tại Hàn Quốc để tác nghiệp đưa tin, báo chí",
        applicantJa: "韓国国内に駐在しながら取材または報道活動を行う人",
        applicantId: "Orang yang bertugas di Korea untuk kegiatan peliputan atau pemberitaan",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "D-6",
        labelKo: "종교",
        labelEn: "Religion",
        labelZh: "宗教",
        labelVi: "Tôn giáo",
        labelJa: "宗教",
        labelId: "Religi",
        applicantKo: "외국의 종교단체 등에서 파견되어 종교 활동을 하는 사람",
        applicantEn: "Persons dispatched by foreign religious organizations",
        applicantZh: "由外国宗教团体派遣从事宗教活动的人员",
        applicantVi: "Người được tổ chức tôn giáo nước ngoài cử đến để hoạt động tôn giáo",
        applicantJa: "外国の宗教団体などから派遣されて宗教活動を行う人",
        applicantId: "Orang yang diutus oleh organisasi keagamaan luar negeri untuk melakukan kegiatan keagamaan",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "D-7",
        labelKo: "주재",
        labelEn: "Intra-company Transfer",
        labelZh: "驻在",
        labelVi: "Phái cử nội bộ",
        labelJa: "駐在",
        labelId: "Penugasan",
        applicantKo: "외국 기업 등으로부터 국내 지점 등에 파견된 필수 인력",
        applicantEn: "Essential staff dispatched to domestic branches from foreign companies",
        applicantZh: "由外国企业派往韩国分支机构的必要人员",
        applicantVi: "Nhân sự cốt cán được công ty nước ngoài cử đến chi nhánh tại Hàn Quốc",
        applicantJa: "外国企業などから国内支店などに派遣された必須人材",
        applicantId: "Personel inti yang ditugaskan dari perusahaan asing ke cabang di Korea",
        durationKo: EXTENDABLE_3Y.ko,
        durationEn: EXTENDABLE_3Y.en,
        durationZh: EXTENDABLE_3Y.zh,
        durationVi: EXTENDABLE_3Y.vi,
        durationJa: EXTENDABLE_3Y.ja,
        durationId: EXTENDABLE_3Y.id
      },
      {
        code: "D-8",
        labelKo: "기업투자",
        labelEn: "Corporate Investment",
        labelZh: "企业投资",
        labelVi: "Đầu tư doanh nghiệp",
        labelJa: "企業投資",
        labelId: "Investasi Perusahaan",
        applicantKo: "「외국인투자촉진법」에 따른 외투기업의 필수전문인력 및 벤처기업·기술창업자",
        applicantEn: "Key specialists of FDI companies and venture/tech startup founders under FIPA",
        applicantZh: "依据《外国人投资促进法》的外商投资企业必要专业人员及风投企业、技术创业者",
        applicantVi: "Chuyên gia cốt cán của doanh nghiệp FDI và sáng lập viên doanh nghiệp khởi nghiệp công nghệ theo Luật Khuyến khích Đầu tư Nước ngoài",
        applicantJa: "「外国人投資促進法」に基づく外資企業の必須専門人材およびベンチャー企業・技術創業者",
        applicantId: "Spesialis kunci perusahaan FDI dan pendiri ventura/startup teknologi berdasarkan FIPA",
        durationKo: EXTENDABLE_5Y.ko,
        durationEn: EXTENDABLE_5Y.en,
        durationZh: EXTENDABLE_5Y.zh,
        durationVi: EXTENDABLE_5Y.vi,
        durationJa: EXTENDABLE_5Y.ja,
        durationId: EXTENDABLE_5Y.id
      },
      {
        code: "D-9",
        labelKo: "무역경영",
        labelEn: "Trade Management",
        labelZh: "贸易经营",
        labelVi: "Quản lý thương mại",
        labelJa: "貿易経営",
        labelId: "Manajemen Perdagangan",
        applicantKo: "회사 설립·경영, 무역 또는 수입기계 설치·산업설비 제작 등을 위해 파견되어 근무하는 사람",
        applicantEn: "Persons dispatched for company setup/management, trade, machinery installation, etc.",
        applicantZh: "因公司设立、经营、贸易或进口机械安装、工业设备制造等被派遣工作的人员",
        applicantVi: "Người được cử đến làm việc để thành lập / điều hành công ty, thương mại hoặc lắp đặt máy móc nhập khẩu, chế tạo thiết bị công nghiệp",
        applicantJa: "会社の設立・経営、貿易または輸入機械の設置・産業設備の製作などのために派遣されて勤務する人",
        applicantId: "Orang yang ditugaskan untuk pendirian/manajemen perusahaan, perdagangan, atau pemasangan mesin impor, dan sebagainya",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "D-10",
        labelKo: "구직",
        labelEn: "Job Seeking",
        labelZh: "求职",
        labelVi: "Tìm việc",
        labelJa: "求職",
        labelId: "Pencari Kerja",
        applicantKo: "취업을 위한 구직활동, 기술창업 준비 또는 요건을 갖춘 기업에서 첨단기술 분야 인턴활동을 하는 사람",
        applicantEn: "Persons for job-seeking, startup prep, or advanced-tech internships at eligible firms",
        applicantZh: "进行求职活动、技术创业准备，或在符合条件的企业进行尖端技术领域实习的人员",
        applicantVi: "Người tìm việc, chuẩn bị khởi nghiệp công nghệ hoặc thực tập trong lĩnh vực công nghệ cao tại các doanh nghiệp đủ điều kiện",
        applicantJa: "就職のための求職活動、技術創業の準備、または要件を備えた企業で先端技術分野のインターン活動を行う人",
        applicantId: "Orang untuk pencarian kerja, persiapan startup, atau magang teknologi maju di perusahaan yang memenuhi syarat",
        durationKo: "6개월 (첨단기술인턴:1년) (연장 가능)",
        durationEn: "6 months (advanced-tech internship: 1 year) (extendable)",
        durationZh: "6 个月（尖端技术实习：1 年）（可延长）",
        durationVi: "6 tháng (thực tập công nghệ cao: 1 năm) (có thể gia hạn)",
        durationJa: "6か月（先端技術インターン：1年）（延長可能）",
        durationId: "6 bulan (magang teknologi maju: 1 tahun) (dapat diperpanjang)"
      }
    ]
  },
  {
    key: "e",
    titleKo: "E계열",
    titleEn: "Category E",
    titleZh: "E 类",
    titleVi: "Loại E",
    titleJa: "E系列",
    titleId: "Kategori E",
    descKo: "전문분야, 비전문분야 활동을 위해 체류하는 사람",
    descEn: "People staying for professional and non-professional work activities",
    descZh: "因专业及非专业领域活动而停留的人员",
    descVi: "Người lưu trú cho hoạt động chuyên môn và phi chuyên môn",
    descJa: "専門分野および非専門分野の活動のために滞在する人",
    descId: "Orang yang tinggal untuk kegiatan kerja profesional maupun non-profesional",
    accentClass: "text-[#7B4BA8]",
    accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "E-1",
        labelKo: "교수",
        labelEn: "Professor",
        labelZh: "教授",
        labelVi: "Giảng viên",
        labelJa: "教授",
        labelId: "Profesor",
        applicantKo: "전문대학 이상의 교육기관 등에서 교육 등에 근무하는 사람",
        applicantEn: "Persons working in education at institutions above junior college level",
        applicantZh: "在专科大学以上教育机构从事教育等工作的人员",
        applicantVi: "Người làm công tác giảng dạy tại cơ sở giáo dục cao đẳng trở lên",
        applicantJa: "専門大学以上の教育機関などで教育に従事する人",
        applicantId: "Orang yang bekerja di bidang pendidikan pada lembaga setingkat akademi atau lebih tinggi",
        durationKo: EXTENDABLE_5Y.ko,
        durationEn: EXTENDABLE_5Y.en,
        durationZh: EXTENDABLE_5Y.zh,
        durationVi: EXTENDABLE_5Y.vi,
        durationJa: EXTENDABLE_5Y.ja,
        durationId: EXTENDABLE_5Y.id
      },
      {
        code: "E-2",
        labelKo: "회화",
        labelEn: "Language Instruction",
        labelZh: "会话指导",
        labelVi: "Giảng dạy ngôn ngữ",
        labelJa: "会話指導",
        labelId: "Instruktur Percakapan",
        applicantKo: "외국어전문학원 등에서 회화지도에 근무하는 사람",
        applicantEn: "Persons working as language instructors at private institutes, etc.",
        applicantZh: "在外语专业学院等从事会话指导的人员",
        applicantVi: "Người làm giáo viên đàm thoại tại trung tâm ngoại ngữ chuyên môn",
        applicantJa: "外国語専門学院などで会話指導に従事する人",
        applicantId: "Orang yang bekerja sebagai instruktur percakapan di lembaga bahasa asing",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "E-3",
        labelKo: "연구",
        labelEn: "Research",
        labelZh: "研究",
        labelVi: "Nghiên cứu",
        labelJa: "研究",
        labelId: "Peneliti",
        applicantKo: "자연과학 또는 산업상 고도기술 분야의 연구원",
        applicantEn: "Researchers in natural science or advanced industrial technology",
        applicantZh: "自然科学或产业高科技领域的研究员",
        applicantVi: "Nhà nghiên cứu trong lĩnh vực khoa học tự nhiên hoặc công nghệ cao công nghiệp",
        applicantJa: "自然科学または産業上の高度技術分野の研究員",
        applicantId: "Peneliti di bidang ilmu alam atau teknologi industri tingkat tinggi",
        durationKo: EXTENDABLE_5Y.ko,
        durationEn: EXTENDABLE_5Y.en,
        durationZh: EXTENDABLE_5Y.zh,
        durationVi: EXTENDABLE_5Y.vi,
        durationJa: EXTENDABLE_5Y.ja,
        durationId: EXTENDABLE_5Y.id
      },
      {
        code: "E-4",
        labelKo: "기술지도",
        labelEn: "Technology Transfer",
        labelZh: "技术指导",
        labelVi: "Chuyển giao công nghệ",
        labelJa: "技術指導",
        labelId: "Instruktur Teknik",
        applicantKo: "산업상 특수한 분야 등에 속하는 기술을 보유한 사람",
        applicantEn: "Persons with specialized technical expertise",
        applicantZh: "拥有特殊产业领域技术的人员",
        applicantVi: "Người có kỹ thuật chuyên biệt trong các lĩnh vực công nghiệp đặc thù",
        applicantJa: "産業上の特殊な分野などに属する技術を保有する人",
        applicantId: "Orang dengan keahlian teknis khusus di bidang industri tertentu",
        durationKo: EXTENDABLE_5Y.ko,
        durationEn: EXTENDABLE_5Y.en,
        durationZh: EXTENDABLE_5Y.zh,
        durationVi: EXTENDABLE_5Y.vi,
        durationJa: EXTENDABLE_5Y.ja,
        durationId: EXTENDABLE_5Y.id
      },
      {
        code: "E-5",
        labelKo: "전문직업",
        labelEn: "Professional",
        labelZh: "专门职业",
        labelVi: "Nghề chuyên môn",
        labelJa: "専門職業",
        labelId: "Pekerjaan Profesional",
        applicantKo: "법률, 회계, 의료 등 전문 분야에 근무하는 사람",
        applicantEn: "Persons working in law, accounting, medicine, and other professions",
        applicantZh: "从事法律、会计、医疗等专业领域工作的人员",
        applicantVi: "Người làm việc trong các lĩnh vực chuyên môn như luật, kế toán, y tế",
        applicantJa: "法律、会計、医療など専門分野に従事する人",
        applicantId: "Orang yang bekerja di bidang profesional seperti hukum, akuntansi, dan medis",
        durationKo: EXTENDABLE_5Y.ko,
        durationEn: EXTENDABLE_5Y.en,
        durationZh: EXTENDABLE_5Y.zh,
        durationVi: EXTENDABLE_5Y.vi,
        durationJa: EXTENDABLE_5Y.ja,
        durationId: EXTENDABLE_5Y.id
      },
      {
        code: "E-6",
        labelKo: "예술흥행",
        labelEn: "Arts/Entertainment",
        labelZh: "艺术演艺",
        labelVi: "Nghệ thuật biểu diễn",
        labelJa: "芸術興行",
        labelId: "Seni & Hiburan",
        applicantKo: "수익을 목적으로 예술활동, 연예, 운동경기 등 활동을 하는 사람",
        applicantEn: "Persons engaged in arts, entertainment, sports for income",
        applicantZh: "以营利为目的从事艺术、演艺、体育竞赛等活动的人员",
        applicantVi: "Người hoạt động nghệ thuật, biểu diễn, thi đấu thể thao vì mục đích thu nhập",
        applicantJa: "営利を目的に芸術活動、芸能、スポーツ競技などの活動を行う人",
        applicantId: "Orang yang terlibat dalam seni, hiburan, atau olahraga untuk tujuan pendapatan",
        durationKo: EXTENDABLE_2Y.ko,
        durationEn: EXTENDABLE_2Y.en,
        durationZh: EXTENDABLE_2Y.zh,
        durationVi: EXTENDABLE_2Y.vi,
        durationJa: EXTENDABLE_2Y.ja,
        durationId: EXTENDABLE_2Y.id
      },
      {
        code: "E-7",
        labelKo: "특정활동",
        labelEn: "Special Activities",
        labelZh: "特定活动",
        labelVi: "Hoạt động đặc thù",
        labelJa: "特定活動",
        labelId: "Kegiatan Tertentu",
        applicantKo: "특정 분야에서 전문, 준전문, 일반기능, 숙련기능인력으로 근무하는 사람",
        applicantEn: "Persons working as skilled/semi-skilled/functional workers in designated fields",
        applicantZh: "在特定领域以专业、准专业、一般技能、熟练技能人员身份工作的人员",
        applicantVi: "Người làm việc với tư cách chuyên gia, bán chuyên, kỹ năng thông thường, kỹ năng lành nghề trong lĩnh vực đặc thù",
        applicantJa: "特定分野で専門、準専門、一般技能、熟練技能人材として勤務する人",
        applicantId: "Orang yang bekerja sebagai tenaga profesional, semi-profesional, fungsional, atau terampil di bidang tertentu",
        durationKo: EXTENDABLE_3Y.ko,
        durationEn: EXTENDABLE_3Y.en,
        durationZh: EXTENDABLE_3Y.zh,
        durationVi: EXTENDABLE_3Y.vi,
        durationJa: EXTENDABLE_3Y.ja,
        durationId: EXTENDABLE_3Y.id
      },
      {
        code: "E-8",
        labelKo: "계절근로",
        labelEn: "Seasonal Work",
        labelZh: "季节工",
        labelVi: "Lao động thời vụ",
        labelJa: "季節労働",
        labelId: "Pekerja Musiman",
        applicantKo: "농작물 재배·수확, 수산물 원시가공 분야에서 근무하는 사람",
        applicantEn: "Persons working in crop cultivation/harvest and primary fisheries processing",
        applicantZh: "在农作物种植与收获、水产品初加工领域工作的人员",
        applicantVi: "Người làm việc trong canh tác / thu hoạch nông sản, sơ chế thuỷ sản",
        applicantJa: "農作物の栽培・収穫、水産物の一次加工分野で勤務する人",
        applicantId: "Orang yang bekerja di bidang budidaya/panen tanaman dan pengolahan awal hasil perikanan",
        durationKo: "5개월 (연장 불가)",
        durationEn: "5 months (non-extendable)",
        durationZh: "5 个月（不可延长）",
        durationVi: "5 tháng (không gia hạn)",
        durationJa: "5か月（延長不可）",
        durationId: "5 bulan (tidak dapat diperpanjang)"
      },
      {
        code: "E-9",
        labelKo: "비전문취업",
        labelEn: "Non-professional Employment",
        labelZh: "非专门就业",
        labelVi: "Việc làm không chuyên môn",
        labelJa: "非専門就業",
        labelId: "Pekerja Non-Profesional",
        applicantKo: "「외국인근로자의 고용 등에 관한 법률」에 따라 16개 송출국가 국민으로서 제조업 등 단순노무분야에서 근무하는 사람",
        applicantEn: "Nationals of designated sending countries working in simple labor sectors under EPS law",
        applicantZh: "依据《外国劳动者雇佣法》，作为 16 个派遣国国民在制造业等简单劳务领域工作的人员",
        applicantVi: "Công dân của 16 quốc gia phái cử làm việc trong lĩnh vực lao động giản đơn (sản xuất, v.v.) theo Luật Tuyển dụng Lao động Nước ngoài",
        applicantJa: "「外国人労働者の雇用などに関する法律」に基づき、16の送り出し国の国民として製造業など単純労務分野で勤務する人",
        applicantId: "Warga negara dari 16 negara pengirim yang bekerja di bidang tenaga kerja sederhana seperti manufaktur berdasarkan UU EPS",
        durationKo: EXTENDABLE_3Y.ko,
        durationEn: EXTENDABLE_3Y.en,
        durationZh: EXTENDABLE_3Y.zh,
        durationVi: EXTENDABLE_3Y.vi,
        durationJa: EXTENDABLE_3Y.ja,
        durationId: EXTENDABLE_3Y.id
      },
      {
        code: "E-10",
        labelKo: "선원취업",
        labelEn: "Crew Employment",
        labelZh: "船员就业",
        labelVi: "Việc làm thuyền viên",
        labelJa: "船員就業",
        labelId: "Pelaut",
        applicantKo: "선원근로계약을 체결하여 내항선원 등으로 근무하는 사람",
        applicantEn: "Persons employed as crew under seafarer labor contracts",
        applicantZh: "签订船员劳动合同，作为内航船员等工作的人员",
        applicantVi: "Người ký hợp đồng lao động thuyền viên và làm việc với tư cách thuyền viên nội địa",
        applicantJa: "船員労働契約を締結し、内航船員などとして勤務する人",
        applicantId: "Orang yang bekerja sebagai awak kapal berdasarkan kontrak kerja pelaut",
        durationKo: EXTENDABLE_3Y.ko,
        durationEn: EXTENDABLE_3Y.en,
        durationZh: EXTENDABLE_3Y.zh,
        durationVi: EXTENDABLE_3Y.vi,
        durationJa: EXTENDABLE_3Y.ja,
        durationId: EXTENDABLE_3Y.id
      }
    ]
  },
  {
    key: "f",
    titleKo: "F계열",
    titleEn: "Category F",
    titleZh: "F 类",
    titleVi: "Loại F",
    titleJa: "F系列",
    titleId: "Kategori F",
    descKo: "가족동반, 거주, 동포, 영주, 결혼이민 자격으로 체류하는 사람",
    descEn: "People staying under family, residence, overseas Korean, permanent residence, or marriage migration status",
    descZh: "以家庭随行、居住、同胞、永久居留、结婚移民资格停留的人员",
    descVi: "Người lưu trú theo diện theo gia đình, cư trú, đồng bào, thường trú, hoặc kết hôn nhập cư",
    descJa: "家族同伴、居住、同胞、永住、結婚移民の資格で滞在する人",
    descId: "Orang yang tinggal dengan status pendamping keluarga, tinggal menetap, diaspora Korea, tinggal tetap, atau imigrasi pernikahan",
    accentClass: "text-[#3A63BD]",
    accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "F-1",
        labelKo: "방문동거",
        labelEn: "Visiting/Cohabitation",
        labelZh: "访问同居",
        labelVi: "Thăm thân và đồng cư trú",
        labelJa: "訪問同居",
        labelId: "Kunjungan Keluarga",
        applicantKo: "친척방문, 가족 동거 등의 목적으로 체류하는 사람",
        applicantEn: "Persons staying for relative visits or family cohabitation",
        applicantZh: "以探亲、家庭同住等目的停留的人员",
        applicantVi: "Người lưu trú với mục đích thăm thân, sống chung với gia đình",
        applicantJa: "親戚訪問、家族との同居などの目的で滞在する人",
        applicantId: "Orang yang tinggal untuk tujuan kunjungan kerabat atau tinggal bersama keluarga",
        durationKo: "2년 (취업 불가)",
        durationEn: "2 years (employment not allowed)",
        durationZh: "2 年（不可就业）",
        durationVi: "2 năm (không được làm việc)",
        durationJa: "2年（就労不可）",
        durationId: "2 tahun (tidak boleh bekerja)"
      },
      {
        code: "F-2",
        labelKo: "거주",
        labelEn: "Residence",
        labelZh: "居住",
        labelVi: "Cư trú",
        labelJa: "居住",
        labelId: "Tinggal Menetap",
        applicantKo: "생활근거가 국내에 있는 장기체류자, 난민인정자 또는 일정요건을 갖춘 투자자",
        applicantEn: "Long-term residents, recognized refugees, or eligible investors with domestic living base",
        applicantZh: "生活基础在韩国的长期停留者、被认定难民或符合条件的投资者",
        applicantVi: "Người lưu trú dài hạn có cơ sở sinh hoạt tại Hàn Quốc, người tị nạn được công nhận hoặc nhà đầu tư đáp ứng điều kiện",
        applicantJa: "生活の本拠が国内にある長期滞在者、難民認定者または一定の要件を備えた投資家",
        applicantId: "Penduduk jangka panjang, pengungsi yang diakui, atau investor yang memenuhi syarat dengan basis hidup di Korea",
        durationKo: "5년 (취업 일부 제한)",
        durationEn: "5 years (partially restricted employment)",
        durationZh: "5 年（部分就业限制）",
        durationVi: "5 năm (hạn chế một phần về việc làm)",
        durationJa: "5年（就労一部制限）",
        durationId: "5 tahun (sebagian dibatasi untuk bekerja)"
      },
      {
        code: "F-2-7",
        labelKo: "점수제 우수인재",
        labelEn: "Points-based Skilled Talent",
        labelZh: "计分制优秀人才",
        labelVi: "Nhân tài theo hệ thống tính điểm",
        labelJa: "ポイント制優秀人材",
        labelId: "Talenta Unggul Berbasis Poin",
        applicantKo: "점수제 기준을 충족한 우수 외국인 인재",
        applicantEn: "Skilled foreign talent meeting points-based eligibility criteria",
        applicantZh: "符合计分制标准的优秀外国人才",
        applicantVi: "Nhân tài nước ngoài đạt tiêu chí hệ thống tính điểm",
        applicantJa: "ポイント制基準を満たした優秀な外国人人材",
        applicantId: "Talenta asing yang memenuhi kriteria kelayakan berbasis poin",
        durationKo: PERMIT_DETAIL_VARIES.ko,
        durationEn: PERMIT_DETAIL_VARIES.en,
        durationZh: PERMIT_DETAIL_VARIES.zh,
        durationVi: PERMIT_DETAIL_VARIES.vi,
        durationJa: PERMIT_DETAIL_VARIES.ja,
        durationId: PERMIT_DETAIL_VARIES.id
      },
      {
        code: "F-2-R",
        labelKo: "지역특화형",
        labelEn: "Regional Specialized",
        labelZh: "地区特化型",
        labelVi: "Đặc thù khu vực",
        labelJa: "地域特化型",
        labelId: "Khusus Wilayah",
        applicantKo: "지역특화형 체류자격 요건을 충족한 외국인",
        applicantEn: "Foreign nationals meeting regional specialized stay requirements",
        applicantZh: "符合地区特化型停留资格条件的外国人",
        applicantVi: "Người nước ngoài đáp ứng điều kiện tư cách lưu trú đặc thù khu vực",
        applicantJa: "地域特化型在留資格の要件を満たした外国人",
        applicantId: "Warga asing yang memenuhi persyaratan status tinggal khusus wilayah",
        durationKo: PERMIT_DETAIL_VARIES.ko,
        durationEn: PERMIT_DETAIL_VARIES.en,
        durationZh: PERMIT_DETAIL_VARIES.zh,
        durationVi: PERMIT_DETAIL_VARIES.vi,
        durationJa: PERMIT_DETAIL_VARIES.ja,
        durationId: PERMIT_DETAIL_VARIES.id
      },
      {
        code: "F-3",
        labelKo: "동반",
        labelEn: "Dependent",
        labelZh: "同行",
        labelVi: "Người phụ thuộc",
        labelJa: "同伴",
        labelId: "Pendamping",
        applicantKo: "문화예술(D-1)부터 특정활동(E-7) 자격자의 배우자 또는 미성년자녀",
        applicantEn: "Spouses or minor children of D-1 to E-7 status holders",
        applicantZh: "文化艺术（D-1）至特定活动（E-7）资格持有者的配偶或未成年子女",
        applicantVi: "Vợ / chồng hoặc con chưa thành niên của người mang visa từ D-1 đến E-7",
        applicantJa: "文化芸術（D-1）から特定活動（E-7）資格者の配偶者または未成年の子",
        applicantId: "Pasangan atau anak di bawah umur dari pemegang status D-1 hingga E-7",
        durationKo: "동반기간 (취업 불가)",
        durationEn: "Dependent period (employment not allowed)",
        durationZh: "同行期间（不可就业）",
        durationVi: "Theo thời gian của người chính (không được làm việc)",
        durationJa: "同伴期間（就労不可）",
        durationId: "Periode pendamping (tidak boleh bekerja)"
      },
      {
        code: "F-4",
        labelKo: "재외동포",
        labelEn: "Overseas Korean",
        labelZh: "海外同胞",
        labelVi: "Đồng bào hải ngoại",
        labelJa: "在外同胞",
        labelId: "Diaspora Korea",
        applicantKo: "「재외동포법」 제2조 2호에 해당하는 외국국적동포",
        applicantEn: "Overseas Koreans with foreign nationality under the Overseas Koreans Act",
        applicantZh: "符合《海外同胞法》第 2 条第 2 项的外籍同胞",
        applicantVi: "Đồng bào quốc tịch nước ngoài thuộc Điều 2 Khoản 2 Luật Đồng bào Hải ngoại",
        applicantJa: "「在外同胞法」第2条第2号に該当する外国国籍同胞",
        applicantId: "Warga keturunan Korea berkewarganegaraan asing berdasarkan Pasal 2 Ayat 2 UU Diaspora Korea",
        durationKo: "3년 (단순노무 불가)",
        durationEn: "3 years (simple labor not allowed)",
        durationZh: "3 年（不可从事简单劳务）",
        durationVi: "3 năm (không được làm lao động giản đơn)",
        durationJa: "3年（単純労務不可）",
        durationId: "3 tahun (tidak boleh tenaga kerja sederhana)"
      },
      {
        code: "F-5",
        labelKo: "영주",
        labelEn: "Permanent Residence",
        labelZh: "永久居留",
        labelVi: "Thường trú",
        labelJa: "永住",
        labelId: "Tinggal Tetap",
        applicantKo: "국내 영주할 목적으로 체류 중인 사람으로 국민에 준하는 대우를 받음",
        applicantEn: "Persons staying for permanent residence with treatment similar to nationals",
        applicantZh: "以在韩永久居住为目的停留并享受类似国民待遇的人员",
        applicantVi: "Người lưu trú với mục đích thường trú tại Hàn Quốc và nhận đối xử tương đương công dân",
        applicantJa: "国内に永住する目的で滞在中の人で、国民に準ずる待遇を受ける人",
        applicantId: "Orang yang tinggal untuk menetap permanen di Korea dengan perlakuan setara warga negara",
        durationKo: "영구 (취업제한 없음)",
        durationEn: "Permanent (no employment restrictions)",
        durationZh: "永久（无就业限制）",
        durationVi: "Vĩnh viễn (không hạn chế việc làm)",
        durationJa: "永久（就労制限なし）",
        durationId: "Permanen (tanpa pembatasan bekerja)"
      },
      {
        code: "F-6",
        labelKo: "결혼",
        labelEn: "Marriage Migration",
        labelZh: "结婚移民",
        labelVi: "Kết hôn nhập cư",
        labelJa: "結婚移民",
        labelId: "Imigrasi Pernikahan",
        applicantKo: "국민과 혼인한 사람",
        applicantEn: "Persons married to Korean nationals",
        applicantZh: "与韩国国民结婚的人员",
        applicantVi: "Người kết hôn với công dân Hàn Quốc",
        applicantJa: "韓国国民と婚姻した人",
        applicantId: "Orang yang menikah dengan warga negara Korea",
        durationKo: "3년 (취업제한 없음)",
        durationEn: "3 years (no employment restrictions)",
        durationZh: "3 年（无就业限制）",
        durationVi: "3 năm (không hạn chế việc làm)",
        durationJa: "3年（就労制限なし）",
        durationId: "3 tahun (tanpa pembatasan bekerja)"
      }
    ]
  },
  {
    key: "etc",
    titleKo: "기타",
    titleEn: "Others",
    titleZh: "其他",
    titleVi: "Khác",
    titleJa: "その他",
    titleId: "Lainnya",
    descKo: "협정에 의한 취업, 인도적 사유로 체류하는 사람",
    descEn: "People staying for agreement-based work or humanitarian reasons",
    descZh: "依据协定就业或基于人道理由停留的人员",
    descVi: "Người lưu trú theo diện làm việc dựa trên hiệp định hoặc lý do nhân đạo",
    descJa: "協定による就労、人道的理由で滞在する人",
    descId: "Orang yang tinggal berdasarkan kerja sesuai perjanjian atau alasan kemanusiaan",
    accentClass: "text-[#D86A3B]",
    accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "H-1",
        labelKo: "관광취업",
        labelEn: "Working Holiday",
        labelZh: "打工度假",
        labelVi: "Working Holiday",
        labelJa: "ワーキングホリデー",
        labelId: "Working Holiday",
        applicantKo: "관광취업(working holiday) 협정 등이 체결된 국가의 국민",
        applicantEn: "Nationals of countries with working holiday agreements",
        applicantZh: "与韩国签订打工度假协定等的国家国民",
        applicantVi: "Công dân các nước đã ký hiệp định Working Holiday với Hàn Quốc",
        applicantJa: "ワーキングホリデー協定などを締結した国の国民",
        applicantId: "Warga negara dari negara yang memiliki perjanjian Working Holiday",
        durationKo: "협정상 기간 (연장 불가)",
        durationEn: "Agreement-defined period (non-extendable)",
        durationZh: "协定规定期间（不可延长）",
        durationVi: "Thời hạn theo hiệp định (không gia hạn)",
        durationJa: "協定上の期間（延長不可）",
        durationId: "Periode sesuai perjanjian (tidak dapat diperpanjang)"
      },
      {
        code: "G-1",
        labelKo: "기타",
        labelEn: "Miscellaneous",
        labelZh: "其他",
        labelVi: "Khác",
        labelJa: "その他",
        labelId: "Lainnya",
        applicantKo: "산재·질병치료, 난민신청자 등 인도적 고려가 필요한 사람",
        applicantEn: "Persons needing humanitarian consideration (injury/illness treatment, asylum seekers, etc.)",
        applicantZh: "因工伤、疾病治疗、难民申请等需要人道考虑的人员",
        applicantVi: "Người cần xem xét nhân đạo (điều trị tai nạn lao động, bệnh tật, người xin tị nạn, v.v.)",
        applicantJa: "労災・疾病治療、難民申請者など人道的配慮が必要な人",
        applicantId: "Orang yang memerlukan pertimbangan kemanusiaan (perawatan cedera/penyakit, pencari suaka, dll.)",
        durationKo: "1년 (연장 가능)",
        durationEn: "1 year (extendable)",
        durationZh: "1 年（可延长）",
        durationVi: "1 năm (có thể gia hạn)",
        durationJa: "1年（延長可能）",
        durationId: "1 tahun (dapat diperpanjang)"
      }
    ]
  }
];

export function getFlatVisaItems(): FlatVisaItem[] {
  return VISA_CATEGORIES.flatMap((category) =>
    category.items.map((item) => ({
      ...item,
      groupKey: category.key,
      groupTitleKo: category.titleKo,
      groupTitleEn: category.titleEn,
      groupTitleZh: category.titleZh,
      groupTitleVi: category.titleVi,
      groupTitleJa: category.titleJa,
      groupTitleId: category.titleId,
      accentClass: category.accentClass,
      accentSoftClass: category.accentSoftClass
    }))
  );
}

export function VisaResourcesPage() {
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const pickLabel = (item: VisaItem) =>
    locale === "ko" ? item.labelKo : locale === "zh-CN" ? item.labelZh : locale === "vi" ? item.labelVi : locale === "ja" ? item.labelJa : locale === "id" ? item.labelId : item.labelEn;
  const pickApplicant = (item: VisaItem) =>
    locale === "ko" ? item.applicantKo : locale === "zh-CN" ? item.applicantZh : locale === "vi" ? item.applicantVi : locale === "ja" ? item.applicantJa : locale === "id" ? item.applicantId : item.applicantEn;
  const pickDuration = (item: VisaItem) =>
    locale === "ko" ? item.durationKo : locale === "zh-CN" ? item.durationZh : locale === "vi" ? item.durationVi : locale === "ja" ? item.durationJa : locale === "id" ? item.durationId : item.durationEn;
  const pickGroupTitle = (item: FlatVisaItem) =>
    locale === "ko" ? item.groupTitleKo : locale === "zh-CN" ? item.groupTitleZh : locale === "vi" ? item.groupTitleVi : locale === "ja" ? item.groupTitleJa : locale === "id" ? item.groupTitleId : item.groupTitleEn;
  const [query, setQuery] = useState("");
  const [typeTab, setTypeTab] = useState<"all" | "work" | "study" | "residence" | "travel" | "other">("all");

  const classifyItemType = (code: string) => {
    if (
      code === "C-4" ||
      code === "D-5" ||
      code === "D-7" ||
      code === "D-8" ||
      code === "D-9" ||
      code === "D-10" ||
      code.startsWith("E-") ||
      code === "H-1"
    ) {
      return "work" as const;
    }
    if (code === "D-2" || code === "D-3" || code === "D-4") {
      return "study" as const;
    }
    if (code.startsWith("F-") || code === "G-1" || code === "F-2-7" || code === "F-2-R") {
      return "residence" as const;
    }
    if (code === "B-1" || code === "B-2" || code === "C-1" || code === "C-3") {
      return "travel" as const;
    }
    return "other" as const;
  };

  const flattenedItems = useMemo<FlatVisaItem[]>(
    () => getFlatVisaItems(),
    []
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return flattenedItems.filter((item) => {
      if (typeTab !== "all" && classifyItemType(item.code) !== typeTab) return false;
      if (!keyword) return true;
      const text = `${item.code} ${item.labelKo} ${item.labelEn} ${item.labelZh} ${item.labelVi} ${item.labelJa} ${item.labelId} ${item.applicantKo} ${item.applicantEn} ${item.applicantZh} ${item.applicantVi} ${item.applicantJa} ${item.applicantId}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [flattenedItems, query, typeTab]);

  return (
    <ResourceSubPageLayout
      titleKo="한국 비자 정보"
      titleEn="Korean Visa Information"
      titleZh="韩国签证信息"
      titleVi="Thông tin visa Hàn Quốc"
      titleJa="韓国ビザ情報"
      titleId="Informasi Visa Korea"
      descKo="공식 비자 안내 기준으로 코드, 신청대상, 체류기간을 보기 쉽게 정리해뒀어요."
      descEn="Based on official visa guidance, we organized visa code, applicant scope, and stay period."
      descZh="依据官方签证指南，将签证代码、申请对象和停留期限整理得一目了然。"
      descVi="Tổng hợp mã visa, đối tượng nộp hồ sơ và thời gian lưu trú dễ xem theo hướng dẫn visa chính thức."
      descJa="公式ビザ案内を基準に、コード・申請対象・滞在期間を見やすく整理しました。"
      descId="Berdasarkan panduan visa resmi, kami menyusun kode, sasaran pengajuan, dan periode tinggal agar mudah dilihat."
      hideHero
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">
          {t("모든 비자 유형", "All Visa Types", "全部签证类型", "Tất cả các loại visa", "すべてのビザ種類", "Semua Jenis Visa")}
        </h2>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          {t(
            "아래에서 비자 코드를 검색하고, 카테고리별 카드로 한눈에 확인해보세요.",
            "Search visa codes below and review everything at a glance with category cards.",
            "在下方搜索签证代码，按类别卡片一目了然地查看。",
            "Tìm mã visa bên dưới và xem tổng quan theo từng loại bằng thẻ danh mục.",
            "下記でビザコードを検索し、カテゴリー別カードでひと目で確認してみてください。",
            "Cari kode visa di bawah dan tinjau semuanya secara sekilas melalui kartu kategori."
          )}
        </p>

        <div className="mt-4 rounded-2xl bg-slate-100 p-3">
          <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "비자 코드 또는 키워드 검색 (예: D-2, 유학, 취업)",
                "Search by visa code or keyword (e.g. D-2, study, work)",
                "搜索签证代码或关键词（例：D-2、留学、就业）",
                "Tìm theo mã visa hoặc từ khoá (ví dụ: D-2, du học, việc làm)",
                "ビザコードまたはキーワードで検索（例：D-2、留学、就職）",
                "Cari berdasarkan kode visa atau kata kunci (contoh: D-2, studi, kerja)"
              )}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            {
              key: "all",
              label: t("전체 비자", "All Visas", "全部签证", "Tất cả visa", "すべてのビザ", "Semua Visa"),
              labelMobile: t("전체", "All Visas", "全部", "Tất cả", "すべて", "Semua")
            },
            {
              key: "work",
              label: t("취업 목적", "Work Purpose", "就业目的", "Mục đích việc làm", "就労目的", "Tujuan Bekerja"),
              labelMobile: t("취업", "Work Purpose", "就业", "Việc làm", "就労", "Kerja")
            },
            {
              key: "study",
              label: t("학업 목적", "Study Purpose", "学业目的", "Mục đích du học", "学業目的", "Tujuan Studi"),
              labelMobile: t("학업", "Study Purpose", "学业", "Du học", "学業", "Studi")
            },
            {
              key: "residence",
              label: t("거주 목적", "Residence Purpose", "居住目的", "Mục đích cư trú", "居住目的", "Tujuan Tinggal"),
              labelMobile: t("거주", "Residence Purpose", "居住", "Cư trú", "居住", "Tinggal")
            },
            {
              key: "travel",
              label: t("여행/방문", "Travel / Visit", "旅游 / 访问", "Du lịch / Thăm thân", "旅行・訪問", "Wisata / Kunjungan"),
              labelMobile: t("여행/방문", "Travel / Visit", "旅游 / 访问", "Du lịch", "旅行・訪問", "Wisata")
            },
            {
              key: "other",
              label: t("기타 목적", "Other Purpose", "其他目的", "Mục đích khác", "その他の目的", "Tujuan Lain"),
              labelMobile: t("기타", "Other Purpose", "其他", "Khác", "その他", "Lainnya")
            }
          ].map((tab) => {
            const active = typeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTypeTab(tab.key as typeof typeTab)}
                className={`inline-flex h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm transition-colors ${
                  active
                    ? "border-foreground bg-foreground font-semibold text-background"
                    : "border-border bg-background font-medium text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                <span className="md:hidden">{tab.labelMobile}</span>
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 divide-y divide-slate-200">
          {filtered.map((item) => (
            <Link
              key={`${item.groupKey}-${item.code}`}
              href={`/resources/visa/${encodeURIComponent(item.code)}`}
              className="block py-4 transition hover:bg-slate-50/70"
            >
              <div className="flex items-center justify-between gap-2">
                <p className={`text-base font-black ${item.accentClass} md:text-lg`}>
                  {item.code} ({pickLabel(item)})
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.accentClass} ${item.accentSoftClass}`}>
                  {pickGroupTitle(item)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 md:text-sm">
                <span className="font-semibold">{t("신청대상", "Applicants", "申请对象", "Đối tượng nộp hồ sơ", "申請対象", "Sasaran Pengajuan")}:</span> {pickApplicant(item)}
              </p>
              <p className="text-xs text-slate-600 md:text-sm">
                <span className="font-semibold">{t("체류기간", "Stay period", "停留期限", "Thời gian lưu trú", "滞在期間", "Periode Tinggal")}:</span> {pickDuration(item)}
              </p>
            </Link>
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              {t(
                "검색 결과가 없어요. 다른 키워드로 다시 찾아보세요.",
                "No results found. Try another code or keyword.",
                "无搜索结果，请尝试其他关键词。",
                "Không có kết quả. Vui lòng thử từ khoá khác.",
                "検索結果がありません。別のキーワードでもう一度お試しください。",
                "Tidak ada hasil ditemukan. Silakan coba kata kunci lain."
              )}
            </div>
          ) : null}
        </div>
      </section>
    </ResourceSubPageLayout>
  );
}

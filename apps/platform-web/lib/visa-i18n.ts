// 비자 결과 카드의 name / conditions / notes 를 로케일별로 직접 렌더링하기
// 위한 i18n 사전. 백엔드(visa-rules.ts)는 한국어 문자열을 그대로 반환하지만,
// 프론트는 비자 코드(D-10, E-7 …) 만 보고 현재 로케일에 맞는 텍스트로 다시
// 그려준다. 백엔드/DB 변경 없이 결과 페이지에서 언어 토글이 즉시 반영됨.
//
// 새 비자 코드가 백엔드에서 추가되면 여기 entry 가 없을 때만 백엔드의
// `name/conditions/notes` 한국어 원문으로 fallback.

import type { PlatformLocale } from "./auth-messages";

export type VisaCtx = {
  koreanLevel: string; // "NONE" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE"
};

export type VisaLocalized = {
  name: string;
  conditions: string[];
  notes?: string;
};

// 백엔드 visa-rules.ts 의 koreanLevelScore 와 동일 — D-10 의 한국어 보너스
// 분기 조건을 프론트에서 다시 평가하기 위한 헬퍼.
function koreanScore(level: string): number {
  switch (level) {
    case "NATIVE": return 4;
    case "ADVANCED": return 3;
    case "INTERMEDIATE": return 2;
    case "BEGINNER": return 1;
    default: return 0;
  }
}

type VisaBuilder = (ctx: VisaCtx) => VisaLocalized;

const KO: Record<string, VisaBuilder> = {
  "D-10": (ctx) => ({
    name: "구직 비자",
    conditions: [
      "학사 이상 학위 보유",
      koreanScore(ctx.koreanLevel) >= 3
        ? "TOPIK 3급 이상 또는 한국 대학 졸업 → 가산 점수"
        : "한국어 능력 가산점이 적용되지 않음",
      "구직 활동 계획서 + 졸업증명서 제출 필요"
    ],
    notes: "최대 6개월 + 6개월 연장. 이 기간 안에 취업해 E-7 등으로 전환해야 합니다."
  }),
  "E-7": () => ({
    name: "특정활동 (전문 직군)",
    conditions: [
      "학사 + 동일 직무 경력 1년 이상, 또는 석사 이상",
      "지정된 85개 직군(전문가/관리자) 중 하나",
      "사용자(회사)의 추천서 + 직무 적합성 입증 필요"
    ],
    notes: "외국인 채용 경험이 있는 회사를 통하는 게 발급이 빠릅니다. Aply 파트너 회사 중 E-7 스폰서 가능 회사를 우선 추천해드려요."
  }),
  "E-9": () => ({
    name: "비전문취업 (EPS)",
    conditions: [
      "송출국가의 EPS 시스템을 통해 한국어 시험(EPS-TOPIK) 합격",
      "제조업·농축산·어업·건설업·서비스업 등 지정 업종",
      "최초 3년 + 1년 10개월 연장 가능"
    ],
    notes: "전문직 경력자에겐 보통 권장하지 않습니다. EPS는 본국 정부 채널을 통해 신청해야 합니다."
  }),
  "F-4": () => ({
    name: "재외동포",
    conditions: [
      "본인 또는 직계 부모/조부모가 대한민국 국적을 보유한 적이 있어야 함",
      "취업 활동 제한이 거의 없음 (단순 노무 제외)"
    ],
    notes: "한국계라면 이 비자가 가장 유리합니다. 출입국·외국인청에 직접 확인해 보세요."
  }),
  "F-2-7": () => ({
    name: "거주 비자 (점수제)",
    conditions: [
      "학력·연봉·한국어·연령·국내 거주 기간 등 점수 합산 80점 이상",
      "5년 이상 합법 체류 시 F-5(영주) 신청 가능"
    ],
    notes: "현재 비자(D-10/E-7 등)로 일정 기간 체류한 후 신청할 수 있는 \"다음 단계\" 비자입니다."
  })
};

const EN: Record<string, VisaBuilder> = {
  "D-10": (ctx) => ({
    name: "Job-Seeking Visa",
    conditions: [
      "Bachelor's degree or higher",
      koreanScore(ctx.koreanLevel) >= 3
        ? "TOPIK level 3+ or Korean-university graduate → bonus points"
        : "No bonus from Korean language ability",
      "Job-search plan + graduation certificate required"
    ],
    notes: "Up to 6 months + a 6-month extension. You should secure a job and switch to E-7 within that window."
  }),
  "E-7": () => ({
    name: "Specific Activity (skilled)",
    conditions: [
      "Bachelor's + 1+ year of related work, OR master's+",
      "Within the 85 designated occupations (professionals / managers)",
      "Employer recommendation + proof of role fit"
    ],
    notes: "Going through a company experienced with foreign hires is faster. Aply prioritizes partner companies that can sponsor E-7."
  }),
  "E-9": () => ({
    name: "Non-Professional Employment (EPS)",
    conditions: [
      "Pass the EPS-TOPIK Korean test via your country's EPS system",
      "Designated industries: manufacturing, agriculture, fishing, construction, services",
      "Initial 3 years + 1 year 10 months extension"
    ],
    notes: "Usually not recommended for skilled professionals. EPS must be filed via your home country's government channel."
  }),
  "F-4": () => ({
    name: "Overseas Korean",
    conditions: [
      "You, or a direct parent/grandparent, must have held Republic of Korea citizenship",
      "Almost no work restrictions (excludes simple labor)"
    ],
    notes: "If you have Korean heritage this is the most favorable visa. Verify directly with Korea Immigration."
  }),
  "F-2-7": () => ({
    name: "Residence Visa (points system)",
    conditions: [
      "Score 80+ on the points system (education, salary, Korean, age, time in Korea)",
      "After 5+ years of legal stay you can apply for F-5 (permanent)"
    ],
    notes: "A 'next step' visa to apply for after staying on D-10 / E-7 etc. for a period."
  })
};

const ZH: Record<string, VisaBuilder> = {
  "D-10": (ctx) => ({
    name: "求职签证",
    conditions: [
      "学士及以上学位",
      koreanScore(ctx.koreanLevel) >= 3
        ? "TOPIK 3级以上或韩国大学毕业 → 加分"
        : "无韩语能力加分",
      "需提交求职计划书 + 毕业证明"
    ],
    notes: "最长 6 个月 + 6 个月延长。需在此期间内就业并转为 E-7 等。"
  }),
  "E-7": () => ({
    name: "特定活动（专业职群）",
    conditions: [
      "学士+同一职务 1 年以上经验，或硕士及以上",
      "85 个指定职业（专家/管理者）之一",
      "需雇主推荐信 + 职务适合性证明"
    ],
    notes: "通过有外国人雇佣经验的公司办理速度更快。Aply 会优先推荐可担保 E-7 的合作企业。"
  }),
  "E-9": () => ({
    name: "非专业就业（EPS）",
    conditions: [
      "通过本国 EPS 系统的韩语考试（EPS-TOPIK）",
      "指定行业：制造业·农畜产·渔业·建筑业·服务业等",
      "首次 3 年 + 可延长 1 年 10 个月"
    ],
    notes: "通常不推荐给专业人才。EPS 需通过本国政府渠道申请。"
  }),
  "F-4": () => ({
    name: "在外同胞",
    conditions: [
      "本人或直系父母/祖父母曾持有大韩民国国籍",
      "几乎无就业活动限制（单纯劳务除外）"
    ],
    notes: "若有韩裔背景，此签证最为有利。请直接向出入境·外国人厅确认。"
  }),
  "F-2-7": () => ({
    name: "居住签证（积分制）",
    conditions: [
      "学历·年薪·韩语·年龄·韩国居留期等积分合计 80 分以上",
      "合法居留 5 年以上可申请 F-5（永驻）"
    ],
    notes: "需以现有签证（D-10/E-7 等）居留一定期间后才能申请的\"下一步\"签证。"
  })
};

const VI: Record<string, VisaBuilder> = {
  "D-10": (ctx) => ({
    name: "Visa tìm việc",
    conditions: [
      "Bằng cử nhân trở lên",
      koreanScore(ctx.koreanLevel) >= 3
        ? "TOPIK 3 trở lên hoặc tốt nghiệp ĐH Hàn → cộng điểm"
        : "Không có điểm cộng từ năng lực tiếng Hàn",
      "Cần kế hoạch tìm việc + giấy tốt nghiệp"
    ],
    notes: "Tối đa 6 tháng + gia hạn 6 tháng. Trong thời gian đó cần tìm việc và chuyển sang E-7."
  }),
  "E-7": () => ({
    name: "Hoạt động đặc định (chuyên môn)",
    conditions: [
      "Cử nhân + 1 năm kinh nghiệm cùng ngành, hoặc thạc sĩ trở lên",
      "Thuộc 85 nhóm nghề chỉ định (chuyên gia/quản lý)",
      "Cần thư giới thiệu từ công ty + chứng minh phù hợp công việc"
    ],
    notes: "Đi qua công ty có kinh nghiệm tuyển người nước ngoài sẽ nhanh hơn. Aply ưu tiên gợi ý các đối tác có thể bảo trợ E-7."
  }),
  "E-9": () => ({
    name: "Lao động phổ thông (EPS)",
    conditions: [
      "Đỗ kỳ thi tiếng Hàn (EPS-TOPIK) qua hệ thống EPS của nước phái cử",
      "Ngành chỉ định: sản xuất, nông súc sản, thủy sản, xây dựng, dịch vụ…",
      "3 năm ban đầu + gia hạn 1 năm 10 tháng"
    ],
    notes: "Thường không khuyến nghị cho người có kinh nghiệm chuyên môn. EPS phải xin qua kênh chính phủ nước bạn."
  }),
  "F-4": () => ({
    name: "Người Hàn hải ngoại",
    conditions: [
      "Bạn hoặc bố/mẹ/ông/bà trực hệ từng có quốc tịch Hàn Quốc",
      "Hầu như không hạn chế hoạt động làm việc (trừ lao động đơn giản)"
    ],
    notes: "Nếu có gốc Hàn, đây là visa có lợi nhất. Hãy xác nhận trực tiếp với cơ quan xuất nhập cảnh."
  }),
  "F-2-7": () => ({
    name: "Visa cư trú (theo điểm)",
    conditions: [
      "Đạt 80 điểm trở lên (học vấn, lương, tiếng Hàn, tuổi, thời gian ở Hàn)",
      "Sau 5 năm cư trú hợp pháp có thể xin F-5 (vĩnh trú)"
    ],
    notes: "Đây là visa 'bước tiếp theo' sau khi đã ở Hàn một thời gian với D-10 / E-7..."
  })
};

const JA: Record<string, VisaBuilder> = {
  "D-10": (ctx) => ({
    name: "求職ビザ",
    conditions: [
      "学士以上の学位",
      koreanScore(ctx.koreanLevel) >= 3
        ? "TOPIK 3級以上または韓国の大学卒業 → 加算ポイント"
        : "韓国語能力による加算なし",
      "求職活動計画書 + 卒業証明書の提出が必要"
    ],
    notes: "最大 6 か月 + 6 か月延長。この期間内に就職して E-7 などに切り替える必要があります。"
  }),
  "E-7": () => ({
    name: "特定活動（専門職）",
    conditions: [
      "学士 + 同職務経験 1 年以上、または修士以上",
      "指定された 85 職種（専門家/管理職）のいずれか",
      "雇用主の推薦書 + 職務適合性の証明が必要"
    ],
    notes: "外国人採用経験のある会社を通すと発給が速いです。Aply は E-7 スポンサー可能な提携企業を優先的にご紹介します。"
  }),
  "E-9": () => ({
    name: "非専門就業（EPS）",
    conditions: [
      "送出国の EPS システムから韓国語試験（EPS-TOPIK）に合格",
      "指定業種：製造業・農畜産・漁業・建設業・サービス業 など",
      "最初 3 年 + 1 年 10 か月延長可能"
    ],
    notes: "専門職経験者には通常おすすめしません。EPS は本国政府のチャンネルから申請する必要があります。"
  }),
  "F-4": () => ({
    name: "在外同胞",
    conditions: [
      "本人または直系の親/祖父母が大韓民国の国籍を有していた必要があります",
      "就労活動の制限がほぼなし（単純労務を除く）"
    ],
    notes: "韓国系のルーツがあれば、このビザが最も有利です。出入国・外国人庁で直接ご確認ください。"
  }),
  "F-2-7": () => ({
    name: "居住ビザ（ポイント制）",
    conditions: [
      "学歴・年収・韓国語・年齢・韓国滞在期間などの合計が 80 点以上",
      "5 年以上の合法滞在で F-5（永住）申請可能"
    ],
    notes: "現在のビザ（D-10/E-7 など）で一定期間滞在した後に申請できる「次のステップ」のビザです。"
  })
};

const ID: Record<string, VisaBuilder> = {
  "D-10": (ctx) => ({
    name: "Visa pencari kerja",
    conditions: [
      "Gelar sarjana atau lebih tinggi",
      koreanScore(ctx.koreanLevel) >= 3
        ? "TOPIK level 3+ atau lulusan universitas Korea → poin bonus"
        : "Tidak ada poin bonus dari kemampuan bahasa Korea",
      "Perlu rencana pencarian kerja + sertifikat kelulusan"
    ],
    notes: "Maks 6 bulan + perpanjangan 6 bulan. Dalam masa ini Anda harus bekerja dan beralih ke E-7."
  }),
  "E-7": () => ({
    name: "Aktivitas khusus (profesional)",
    conditions: [
      "Sarjana + pengalaman 1 tahun di bidang sama, atau magister ke atas",
      "Salah satu dari 85 jabatan terdaftar (profesional/manajer)",
      "Surat rekomendasi pemberi kerja + bukti kesesuaian peran"
    ],
    notes: "Melalui perusahaan yang berpengalaman merekrut tenaga asing akan lebih cepat. Aply memprioritaskan mitra yang bisa mensponsori E-7."
  }),
  "E-9": () => ({
    name: "Pekerja non-profesional (EPS)",
    conditions: [
      "Lulus ujian bahasa Korea (EPS-TOPIK) lewat sistem EPS negara asal",
      "Industri yang ditentukan: manufaktur, agrikultur, perikanan, konstruksi, layanan",
      "Masa awal 3 tahun + perpanjangan 1 tahun 10 bulan"
    ],
    notes: "Biasanya tidak disarankan bagi tenaga profesional. EPS harus diajukan melalui jalur pemerintah negara Anda."
  }),
  "F-4": () => ({
    name: "Diaspora Korea",
    conditions: [
      "Anda atau orang tua/kakek-nenek langsung pernah berkewarganegaraan Korea",
      "Hampir tanpa batasan kerja (kecuali tenaga kasar)"
    ],
    notes: "Jika Anda berdarah Korea, visa ini paling menguntungkan. Konfirmasi langsung ke imigrasi Korea."
  }),
  "F-2-7": () => ({
    name: "Visa Residensi (sistem poin)",
    conditions: [
      "Skor 80+ pada sistem poin (pendidikan, gaji, bahasa Korea, usia, lama tinggal di Korea)",
      "Setelah 5+ tahun tinggal sah, dapat mengajukan F-5 (permanen)"
    ],
    notes: "Visa 'langkah berikutnya' setelah tinggal di Korea dengan D-10 / E-7 selama jangka waktu tertentu."
  })
};

const DICT: Record<PlatformLocale, Record<string, VisaBuilder>> = {
  ko: KO,
  en: EN,
  "zh-CN": ZH,
  vi: VI,
  ja: JA,
  id: ID
};

// 결과 카드 1개를 현재 로케일로 localize. 사전에 없는 visa 코드는 null 반환
// → 호출자가 백엔드 원문(name/conditions/notes)으로 fallback.
export function localizeVisa(
  locale: PlatformLocale,
  code: string,
  ctx: VisaCtx
): VisaLocalized | null {
  const builder = DICT[locale]?.[code] ?? KO[code];
  return builder ? builder(ctx) : null;
}

// ---------------------------------------------------------------------------
// Phase 1 추가: 5단계 status / roadmap 라벨 / next-step Q&A 키 → 로케일 카피
// ---------------------------------------------------------------------------

export type VisaStatus =
  | "available_now"
  | "after_job_offer"
  | "after_graduation"
  | "needs_preparation"
  | "not_likely";

type StatusCopy = { label: string; helper: string };

const STATUS_COPY: Record<PlatformLocale, Record<VisaStatus, StatusCopy>> = {
  ko: {
    available_now:     { label: "지금 가능",          helper: "현재 조건으로 바로 신청 검토 가능" },
    after_job_offer:   { label: "취업 제안 후 가능",  helper: "한국 회사 채용 제안만 있으면 가능" },
    after_graduation:  { label: "졸업 후 가능",       helper: "졸업하면 신청 가능" },
    needs_preparation: { label: "준비 필요",          helper: "한국어 / 서류 / 경력 등 보완 필요" },
    not_likely:        { label: "현재로는 어려움",    helper: "현재 조건으로는 발급이 어려움" }
  },
  en: {
    available_now:     { label: "Available now",       helper: "You can apply with your current profile" },
    after_job_offer:   { label: "After a job offer",   helper: "Possible once a Korean company hires you" },
    after_graduation:  { label: "After graduation",    helper: "You can apply once you graduate" },
    needs_preparation: { label: "Needs preparation",   helper: "Korean / documents / experience to build up" },
    not_likely:        { label: "Not likely now",      helper: "Hard to get with your current profile" }
  },
  "zh-CN": {
    available_now:     { label: "现在可申请",   helper: "以当前条件即可申请" },
    after_job_offer:   { label: "拿到工作后可申请", helper: "韩国公司给你 Offer 即可" },
    after_graduation:  { label: "毕业后可申请", helper: "毕业即可申请" },
    needs_preparation: { label: "需要准备",     helper: "需要韩语 / 材料 / 经验等补充" },
    not_likely:        { label: "目前较难",     helper: "当前条件较难取得" }
  },
  vi: {
    available_now:     { label: "Có thể ngay",       helper: "Hồ sơ hiện tại đủ điều kiện nộp" },
    after_job_offer:   { label: "Sau khi có offer",  helper: "Khi có công ty Hàn nhận làm" },
    after_graduation:  { label: "Sau khi tốt nghiệp", helper: "Tốt nghiệp xong là nộp được" },
    needs_preparation: { label: "Cần chuẩn bị thêm", helper: "Tiếng Hàn / giấy tờ / kinh nghiệm…" },
    not_likely:        { label: "Hiện tại khó",      helper: "Khó với hồ sơ hiện tại" }
  },
  ja: {
    available_now:     { label: "今すぐ可能",         helper: "現在の条件で申請を検討できます" },
    after_job_offer:   { label: "内定後に可能",       helper: "韓国企業からの内定があれば可能" },
    after_graduation:  { label: "卒業後に可能",       helper: "卒業すれば申請可能" },
    needs_preparation: { label: "準備が必要",         helper: "韓国語 / 書類 / 経歴の補強が必要" },
    not_likely:        { label: "現状では難しい",     helper: "現在の条件では発給が難しい" }
  },
  id: {
    available_now:     { label: "Bisa sekarang",      helper: "Profil sekarang sudah memenuhi" },
    after_job_offer:   { label: "Setelah dapat job offer", helper: "Setelah perusahaan Korea menawarkan kerja" },
    after_graduation:  { label: "Setelah lulus",      helper: "Bisa diajukan setelah lulus" },
    needs_preparation: { label: "Perlu persiapan",    helper: "Bahasa Korea / dokumen / pengalaman" },
    not_likely:        { label: "Sulit saat ini",     helper: "Sulit dengan profil sekarang" }
  }
};

export function localizeStatus(locale: PlatformLocale, status: VisaStatus): StatusCopy {
  return STATUS_COPY[locale]?.[status] ?? STATUS_COPY.ko[status];
}

// roadmap priorityKey → 한 줄 우선순위 문구
const PRIORITY_COPY: Record<PlatformLocale, Record<string, string>> = {
  ko: {
    get_offer_before_grad: "졸업 전에 채용 제안 받는 것이 핵심",
    switch_to_e7: "받은 채용 제안으로 바로 E-7 전환 준비",
    find_first_offer: "한국 회사 채용 제안 확보가 최우선",
    plan_next_visa: "현재 비자 만료 전 다음 비자 준비",
    already_long_term: "이미 자유 취업 가능 — 영주 단계로 자연스럽게"
  },
  en: {
    get_offer_before_grad: "Priority: secure a job offer before you graduate",
    switch_to_e7: "Priority: convert your offer into an E-7 switch",
    find_first_offer: "Priority: get your first Korean job offer",
    plan_next_visa: "Priority: line up your next visa before this one expires",
    already_long_term: "You can work freely — next step is permanent residency"
  },
  "zh-CN": {
    get_offer_before_grad: "重点：毕业前拿到工作 Offer",
    switch_to_e7: "重点：把 Offer 转换为 E-7",
    find_first_offer: "重点：先拿到韩国公司的 Offer",
    plan_next_visa: "重点：在签证到期前准备下一签证",
    already_long_term: "已可自由就业 — 准备永驻"
  },
  vi: {
    get_offer_before_grad: "Ưu tiên: có offer trước khi tốt nghiệp",
    switch_to_e7: "Ưu tiên: chuyển offer sang E-7",
    find_first_offer: "Ưu tiên: có offer từ công ty Hàn trước",
    plan_next_visa: "Ưu tiên: chuẩn bị visa kế tiếp trước khi hết hạn",
    already_long_term: "Bạn đã có thể làm việc tự do — hướng tới vĩnh trú"
  },
  ja: {
    get_offer_before_grad: "優先：卒業前に内定を獲得",
    switch_to_e7: "優先：内定を E-7 切替に活用",
    find_first_offer: "優先：まずは韓国企業の内定を獲得",
    plan_next_visa: "優先：満了前に次のビザを準備",
    already_long_term: "自由に就労可能 — 永住へ"
  },
  id: {
    get_offer_before_grad: "Prioritas: dapat offer sebelum lulus",
    switch_to_e7: "Prioritas: konversi offer ke E-7",
    find_first_offer: "Prioritas: dapatkan offer pertama dari Korea",
    plan_next_visa: "Prioritas: siapkan visa berikutnya sebelum expired",
    already_long_term: "Sudah bisa kerja bebas — menuju permanent"
  }
};

export function localizePriority(locale: PlatformLocale, key: string | null | undefined): string | null {
  if (!key) return null;
  return PRIORITY_COPY[locale]?.[key] ?? PRIORITY_COPY.ko[key] ?? null;
}

// blocker key → 짧은 라벨 (status 그룹 안 카드에 추가로 보여주는 체크리스트)
const BLOCKER_COPY: Record<PlatformLocale, Record<string, string>> = {
  ko: {
    graduation: "졸업",
    job_offer: "한국 회사 채용 제안",
    role_match: "전공/경력에 맞는 직무",
    bachelor_or_higher: "학사 이상 학위",
    work_experience: "관련 직무 경력 1년+",
    eps_topik: "EPS-TOPIK 합격",
    home_country_eps: "본국 EPS 절차",
    korean_heritage_proof: "한국계 증빙",
    prior_visa_stay: "기존 비자로 일정 기간 체류",
    points_80: "점수 80점 이상",
    topik_3: "TOPIK 3급 이상 (가산점)"
  },
  en: {
    graduation: "Graduation",
    job_offer: "Korean job offer",
    role_match: "Role matching major/experience",
    bachelor_or_higher: "Bachelor's degree or higher",
    work_experience: "1+ year of related work",
    eps_topik: "Pass EPS-TOPIK",
    home_country_eps: "Home-country EPS process",
    korean_heritage_proof: "Proof of Korean heritage",
    prior_visa_stay: "Prior visa stay in Korea",
    points_80: "80+ points",
    topik_3: "TOPIK 3+ (bonus)"
  },
  "zh-CN": {
    graduation: "毕业",
    job_offer: "韩国公司 Offer",
    role_match: "与专业/经验匹配的职位",
    bachelor_or_higher: "学士及以上学位",
    work_experience: "1 年以上相关经验",
    eps_topik: "EPS-TOPIK 合格",
    home_country_eps: "本国 EPS 程序",
    korean_heritage_proof: "韩裔证明",
    prior_visa_stay: "现有签证一定期限的居留",
    points_80: "80 分以上",
    topik_3: "TOPIK 3 级以上（加分）"
  },
  vi: {
    graduation: "Tốt nghiệp",
    job_offer: "Offer từ công ty Hàn",
    role_match: "Công việc khớp chuyên ngành/kinh nghiệm",
    bachelor_or_higher: "Bằng cử nhân trở lên",
    work_experience: "1+ năm kinh nghiệm liên quan",
    eps_topik: "Đỗ EPS-TOPIK",
    home_country_eps: "Thủ tục EPS ở nước bạn",
    korean_heritage_proof: "Chứng minh gốc Hàn",
    prior_visa_stay: "Cư trú một thời gian với visa cũ",
    points_80: "Đạt 80 điểm trở lên",
    topik_3: "TOPIK 3+ (cộng điểm)"
  },
  ja: {
    graduation: "卒業",
    job_offer: "韓国企業の内定",
    role_match: "専攻/経歴に合う職務",
    bachelor_or_higher: "学士以上の学位",
    work_experience: "関連職務 1 年以上",
    eps_topik: "EPS-TOPIK 合格",
    home_country_eps: "本国の EPS 手続き",
    korean_heritage_proof: "韓国系の証明",
    prior_visa_stay: "既存ビザでの一定期間の滞在",
    points_80: "80 点以上",
    topik_3: "TOPIK 3 級以上（加点）"
  },
  id: {
    graduation: "Lulus",
    job_offer: "Offer dari perusahaan Korea",
    role_match: "Pekerjaan sesuai jurusan/pengalaman",
    bachelor_or_higher: "Gelar sarjana atau lebih tinggi",
    work_experience: "1+ tahun pengalaman terkait",
    eps_topik: "Lulus EPS-TOPIK",
    home_country_eps: "Proses EPS di negara asal",
    korean_heritage_proof: "Bukti keturunan Korea",
    prior_visa_stay: "Tinggal di Korea dengan visa sebelumnya",
    points_80: "80+ poin",
    topik_3: "TOPIK 3+ (bonus)"
  }
};

export function localizeBlocker(locale: PlatformLocale, key: string): string {
  return BLOCKER_COPY[locale]?.[key] ?? BLOCKER_COPY.ko[key] ?? key;
}

// next-step Q&A — 현재 비자별 핵심 FAQ
const NEXTSTEP_COPY: Record<PlatformLocale, Record<string, string>> = {
  ko: {
    // D-2 학생
    "d2.work_part_time.q": "유학(D-2) 중에 아르바이트 가능한가요?",
    "d2.work_part_time.a": "조건부 가능. 학교 신고 후 주 25시간(방학 무제한) 까지. 일부 직종은 제한.",
    "d2.switch_to_d10.q": "D-2 에서 D-10 으로 바꾸려면?",
    "d2.switch_to_d10.a": "졸업 후(또는 졸업 예정자) 학교 추천 + 구직 활동 계획서 + 졸업증명서로 신청.",
    "d2.e7_after_grad.q": "졸업 후 바로 E-7 취득 가능한가요?",
    "d2.e7_after_grad.a": "전공이 직무와 맞고 회사가 추천서를 써주면 가능. 보통은 D-10 으로 변경 → 입사 후 E-7.",
    // D-4
    "d4.switch_to_d10.q": "D-4 에서 D-10 으로 바꿀 수 있나요?",
    "d4.switch_to_d10.a": "조건은 D-2 와 비슷. 학위 인정되는 과정 졸업 + 구직 의사면 가능.",
    "d4.eligible_for_e7.q": "D-4 에서 E-7 바로 가능?",
    "d4.eligible_for_e7.a": "원칙적으로 어려움. 학력·경력 보강 후 D-10 거쳐 가는 편이 안전.",
    // D-10
    "d10.how_long.q": "D-10 은 얼마나 체류 가능?",
    "d10.how_long.a": "최초 6개월. 구직 활동 증빙으로 6개월 1회 연장. 총 최대 1년.",
    "d10.what_jobs_qualify.q": "어떤 직무라야 E-7 으로 전환되나요?",
    "d10.what_jobs_qualify.a": "지정 85개 직군(전문가/관리자) 안에 들어야 함. 전공·경력 + 회사 추천서 필요.",
    "d10.internship.q": "D-10 으로 인턴 가능?",
    "d10.internship.a": "단기 인턴은 가능. 정식 취업으로 이어지면 E-7 등으로 변경 필요.",
    // E-7
    "e7.change_jobs.q": "E-7 보유 중에 이직 가능?",
    "e7.change_jobs.a": "가능. 신규 직장의 직무가 기존과 같은 직군이면 신고만, 다르면 변경 허가 필요.",
    "e7.duration.q": "E-7 체류 기간은?",
    "e7.duration.a": "최초 1~3년 + 연장. 5년 이상 합법 체류 시 F-2-7/F-5 신청 가능.",
    // E-9
    "e9.switch_to_e74.q": "E-9 에서 E-7-4(숙련기능) 전환 가능?",
    "e9.switch_to_e74.a": "가능. 한국어 + 해당 직종 일정 기간 근무 + 점수 충족 시.",
    // Long-term F-비자
    "long_term.no_sponsor.q": "회사 후원 없이도 일할 수 있나요?",
    "long_term.no_sponsor.a": "네. F-2/F-4/F-5/F-6 는 비자 스폰서 없이 자유 취업 가능 (단순 노무 제외 일부).",
    // H-1
    "h1.switch_to_e7.q": "H-1 워킹홀리데이에서 E-7 으로 가려면?",
    "h1.switch_to_e7.a": "체류 기간 안에 E-7 적합 직무 채용 제안을 받고 회사가 후원하면 변경 가능.",
    // 한국 밖
    "outside.fastest_route.q": "한국 밖에서 가장 빠른 경로?",
    "outside.fastest_route.a": "한국 회사 채용 제안 받기 → 회사가 E-7 후원 → 비자 발급 후 입국.",
    "outside.need_korean.q": "한국어 못해도 취업 가능?",
    "outside.need_korean.a": "글로벌 직무(외국어 영업/엔지니어링/외국인 대상 서비스) 위주로 가능. 일반 직무는 어려움."
  },
  en: {
    "d2.work_part_time.q": "Can I work part-time on D-2?",
    "d2.work_part_time.a": "Conditional yes. School approval + up to 25h/week (unlimited during breaks). Some roles restricted.",
    "d2.switch_to_d10.q": "How do I move from D-2 to D-10?",
    "d2.switch_to_d10.a": "After (or close to) graduation: school recommendation + job-search plan + graduation certificate.",
    "d2.e7_after_grad.q": "Can I get E-7 right after graduation?",
    "d2.e7_after_grad.a": "Yes if the role matches your major and the company sponsors. Usually people switch via D-10 → E-7.",
    "d4.switch_to_d10.q": "Can I switch from D-4 to D-10?",
    "d4.switch_to_d10.a": "Similar to D-2 — possible if your program counts as a degree and you intend to job-hunt.",
    "d4.eligible_for_e7.q": "Can I go from D-4 straight to E-7?",
    "d4.eligible_for_e7.a": "Usually not — most people strengthen credentials and go D-4 → D-10 → E-7.",
    "d10.how_long.q": "How long can I stay on D-10?",
    "d10.how_long.a": "Initial 6 months. One 6-month extension with job-search evidence. Max ~1 year.",
    "d10.what_jobs_qualify.q": "Which jobs qualify to switch to E-7?",
    "d10.what_jobs_qualify.a": "One of the 85 designated professional/managerial roles. Major + experience + employer recommendation needed.",
    "d10.internship.q": "Can I intern on D-10?",
    "d10.internship.a": "Short internships yes. If it becomes a full role you must switch to E-7.",
    "e7.change_jobs.q": "Can I change jobs while on E-7?",
    "e7.change_jobs.a": "Yes. Same job category: just notify. Different category: needs a change permit.",
    "e7.duration.q": "How long does E-7 last?",
    "e7.duration.a": "1–3 years to start, then extensions. After 5+ years legal stay you can apply for F-2-7 / F-5.",
    "e9.switch_to_e74.q": "Can I switch from E-9 to E-7-4 (skilled)?",
    "e9.switch_to_e74.a": "Yes — needs Korean + a period of work in the field + meeting the points threshold.",
    "long_term.no_sponsor.q": "Can I work without company sponsorship?",
    "long_term.no_sponsor.a": "Yes. F-2/F-4/F-5/F-6 lets you work freely (with some restrictions on simple labor).",
    "h1.switch_to_e7.q": "How do I move from H-1 (working holiday) to E-7?",
    "h1.switch_to_e7.a": "Within your H-1 period, get an offer for an E-7 qualifying role and have the employer sponsor.",
    "outside.fastest_route.q": "What's the fastest route from outside Korea?",
    "outside.fastest_route.a": "Get a Korean job offer → employer sponsors E-7 → visa issued → enter Korea.",
    "outside.need_korean.q": "Can I get hired without Korean?",
    "outside.need_korean.a": "Global roles (foreign-language sales, engineering, services for foreigners) are realistic. General roles are tough."
  },
  "zh-CN": {
    "d2.work_part_time.q": "D-2 留学期间可以打工吗？",
    "d2.work_part_time.a": "有条件可。需校方同意，平日最多 25 小时/周（假期不限）。部分行业受限。",
    "d2.switch_to_d10.q": "如何从 D-2 转 D-10？",
    "d2.switch_to_d10.a": "毕业前后均可：学校推荐 + 求职计划书 + 毕业证明。",
    "d2.e7_after_grad.q": "毕业后能直接拿 E-7 吗？",
    "d2.e7_after_grad.a": "专业对口且公司愿担保即可。通常先转 D-10，入职后再换 E-7。",
    "d4.switch_to_d10.q": "D-4 能转 D-10 吗？",
    "d4.switch_to_d10.a": "条件与 D-2 类似 — 学历被认可且有求职意向即可。",
    "d4.eligible_for_e7.q": "D-4 能直接 E-7 吗？",
    "d4.eligible_for_e7.a": "原则上较难，通常需要 D-4 → D-10 → E-7。",
    "d10.how_long.q": "D-10 能待多久？",
    "d10.how_long.a": "首次 6 个月，可凭求职活动证明延长 6 个月。最长约 1 年。",
    "d10.what_jobs_qualify.q": "什么职位才能转 E-7？",
    "d10.what_jobs_qualify.a": "需在 85 个指定职业（专家/管理者）之内，且专业经验 + 公司推荐书齐备。",
    "d10.internship.q": "D-10 能做实习吗？",
    "d10.internship.a": "短期可以。若转为正式工作需更换为 E-7。",
    "e7.change_jobs.q": "持 E-7 可以跳槽吗？",
    "e7.change_jobs.a": "可以。相同职群仅需申报，不同职群需变更许可。",
    "e7.duration.q": "E-7 期限多长？",
    "e7.duration.a": "初次 1~3 年 + 延长。合法居留 5 年以上可申请 F-2-7 / F-5。",
    "e9.switch_to_e74.q": "E-9 能转 E-7-4（熟练技能）吗？",
    "e9.switch_to_e74.a": "可以 — 需韩语能力 + 在该行业工作一定期间 + 达到积分。",
    "long_term.no_sponsor.q": "没有公司担保可以工作吗？",
    "long_term.no_sponsor.a": "可以。F-2/F-4/F-5/F-6 可自由就业（单纯劳务除外）。",
    "h1.switch_to_e7.q": "H-1 打工度假怎么转 E-7？",
    "h1.switch_to_e7.a": "在 H-1 期内获得 E-7 适用职位 offer 并由公司担保即可。",
    "outside.fastest_route.q": "从韩国境外最快的路径？",
    "outside.fastest_route.a": "拿到韩国公司 offer → 公司担保 E-7 → 发签证 → 入境。",
    "outside.need_korean.q": "不会韩语能就业吗？",
    "outside.need_korean.a": "全球类岗位（外语销售/工程/对外服务）相对可行。一般岗位较难。"
  },
  vi: {
    "d2.work_part_time.q": "Có làm thêm khi học D-2 được không?",
    "d2.work_part_time.a": "Có điều kiện. Cần trường duyệt + tối đa 25h/tuần (kỳ nghỉ không giới hạn). Một số ngành hạn chế.",
    "d2.switch_to_d10.q": "Cách chuyển D-2 sang D-10?",
    "d2.switch_to_d10.a": "Sau (hoặc gần) tốt nghiệp: thư giới thiệu của trường + kế hoạch tìm việc + bằng tốt nghiệp.",
    "d2.e7_after_grad.q": "Tốt nghiệp xong xin E-7 ngay được không?",
    "d2.e7_after_grad.a": "Được nếu công việc khớp chuyên ngành và công ty bảo trợ. Thường người ta đi D-10 → E-7.",
    "d4.switch_to_d10.q": "D-4 chuyển D-10 được không?",
    "d4.switch_to_d10.a": "Tương tự D-2 — nếu chương trình của bạn được công nhận và bạn muốn tìm việc.",
    "d4.eligible_for_e7.q": "D-4 lên thẳng E-7 được không?",
    "d4.eligible_for_e7.a": "Thường khó. An toàn hơn là D-4 → D-10 → E-7.",
    "d10.how_long.q": "D-10 ở được bao lâu?",
    "d10.how_long.a": "6 tháng đầu + gia hạn 6 tháng nếu có bằng chứng tìm việc. Tối đa khoảng 1 năm.",
    "d10.what_jobs_qualify.q": "Công việc nào đủ điều kiện E-7?",
    "d10.what_jobs_qualify.a": "Phải trong 85 nhóm nghề chỉ định. Cần chuyên ngành + kinh nghiệm + thư giới thiệu công ty.",
    "d10.internship.q": "D-10 đi thực tập được không?",
    "d10.internship.a": "Thực tập ngắn được. Nếu thành công việc chính thức thì cần đổi sang E-7.",
    "e7.change_jobs.q": "Có E-7 chuyển việc được không?",
    "e7.change_jobs.a": "Được. Cùng nhóm nghề chỉ cần khai báo, khác nhóm cần xin phép đổi.",
    "e7.duration.q": "E-7 ở được bao lâu?",
    "e7.duration.a": "Lần đầu 1–3 năm + gia hạn. Sau 5+ năm cư trú hợp pháp có thể xin F-2-7 / F-5.",
    "e9.switch_to_e74.q": "Từ E-9 lên E-7-4 (lao động lành nghề) được không?",
    "e9.switch_to_e74.a": "Được — cần tiếng Hàn + thời gian làm việc đủ + đạt điểm.",
    "long_term.no_sponsor.q": "Không cần công ty bảo trợ vẫn làm việc được?",
    "long_term.no_sponsor.a": "Được. F-2/F-4/F-5/F-6 làm việc tự do (trừ lao động đơn giản).",
    "h1.switch_to_e7.q": "Từ H-1 (working holiday) sang E-7?",
    "h1.switch_to_e7.a": "Trong thời gian H-1, có offer cho công việc đủ điều kiện E-7 và được công ty bảo trợ.",
    "outside.fastest_route.q": "Đường nhanh nhất từ ngoài Hàn?",
    "outside.fastest_route.a": "Có offer từ công ty Hàn → công ty bảo trợ E-7 → cấp visa → nhập cảnh.",
    "outside.need_korean.q": "Không biết tiếng Hàn vẫn xin được việc?",
    "outside.need_korean.a": "Vị trí toàn cầu (sales ngoại ngữ, kỹ sư, dịch vụ cho người nước ngoài) khả thi. Vị trí phổ thông khó."
  },
  ja: {
    "d2.work_part_time.q": "D-2 留学中、アルバイトはできますか？",
    "d2.work_part_time.a": "条件付き可。学校の許可 + 平日 25 時間/週まで（休暇中は無制限）。一部職種は制限。",
    "d2.switch_to_d10.q": "D-2 から D-10 への切替方法は？",
    "d2.switch_to_d10.a": "卒業前後に：学校推薦書 + 求職活動計画書 + 卒業証明書。",
    "d2.e7_after_grad.q": "卒業後すぐに E-7 取得できますか？",
    "d2.e7_after_grad.a": "専攻が職務と合い、会社が推薦すれば可。通常は D-10 経由で E-7 が一般的。",
    "d4.switch_to_d10.q": "D-4 から D-10 へ切り替えできますか？",
    "d4.switch_to_d10.a": "D-2 と類似。学位として認められれば求職目的で切替可。",
    "d4.eligible_for_e7.q": "D-4 から直接 E-7 は？",
    "d4.eligible_for_e7.a": "通常難しいです。D-4 → D-10 → E-7 が安全。",
    "d10.how_long.q": "D-10 はどれくらい滞在できますか？",
    "d10.how_long.a": "最初 6 か月、求職活動証明で 6 か月延長 1 回。最大約 1 年。",
    "d10.what_jobs_qualify.q": "どの職務だと E-7 に切替できますか？",
    "d10.what_jobs_qualify.a": "指定 85 職種（専門家/管理職）内 + 専攻・経歴 + 会社推薦書。",
    "d10.internship.q": "D-10 でインターンは可能？",
    "d10.internship.a": "短期インターンは可。正規雇用に転換すると E-7 等への変更が必要。",
    "e7.change_jobs.q": "E-7 保持中に転職できますか？",
    "e7.change_jobs.a": "可能。同職群なら申告のみ、別職群は変更許可が必要。",
    "e7.duration.q": "E-7 の在留期間は？",
    "e7.duration.a": "初回 1~3 年 + 延長。5 年以上の合法滞在で F-2-7 / F-5 申請可。",
    "e9.switch_to_e74.q": "E-9 から E-7-4（熟練技能）切替は？",
    "e9.switch_to_e74.a": "可能 — 韓国語 + 一定期間の同職務勤務 + 点数充足。",
    "long_term.no_sponsor.q": "会社の後援なしでも働けますか？",
    "long_term.no_sponsor.a": "はい。F-2/F-4/F-5/F-6 はスポンサー不要で自由就労可能。",
    "h1.switch_to_e7.q": "H-1（ワーホリ）から E-7 への切替は？",
    "h1.switch_to_e7.a": "H-1 期間内に E-7 該当職務の内定を取得し会社が後援すれば可。",
    "outside.fastest_route.q": "韓国国外からの最短ルートは？",
    "outside.fastest_route.a": "韓国企業の内定 → 会社が E-7 後援 → ビザ発給 → 入国。",
    "outside.need_korean.q": "韓国語ができなくても就業可能？",
    "outside.need_korean.a": "グローバル職務（外国語営業/エンジニア/外国人向けサービス）は現実的。一般職務は難しい。"
  },
  id: {
    "d2.work_part_time.q": "Bisa kerja paruh waktu saat D-2?",
    "d2.work_part_time.a": "Bisa dengan syarat: izin kampus + maks 25 jam/minggu (liburan tanpa batas). Beberapa bidang dibatasi.",
    "d2.switch_to_d10.q": "Cara pindah dari D-2 ke D-10?",
    "d2.switch_to_d10.a": "Setelah/menjelang lulus: rekomendasi kampus + rencana pencarian kerja + ijazah.",
    "d2.e7_after_grad.q": "Bisa langsung E-7 setelah lulus?",
    "d2.e7_after_grad.a": "Bisa kalau pekerjaan cocok jurusan dan perusahaan mensponsori. Umumnya lewat D-10 → E-7.",
    "d4.switch_to_d10.q": "D-4 bisa pindah D-10?",
    "d4.switch_to_d10.a": "Mirip D-2 — jika program Anda diakui setara dan Anda ingin cari kerja.",
    "d4.eligible_for_e7.q": "D-4 langsung E-7 bisa?",
    "d4.eligible_for_e7.a": "Umumnya sulit. Lebih aman D-4 → D-10 → E-7.",
    "d10.how_long.q": "Berapa lama bisa tinggal di D-10?",
    "d10.how_long.a": "Awal 6 bulan, perpanjangan 6 bulan dengan bukti pencarian kerja. Maks ~1 tahun.",
    "d10.what_jobs_qualify.q": "Pekerjaan apa yang memenuhi syarat E-7?",
    "d10.what_jobs_qualify.a": "Salah satu dari 85 jabatan profesional/manajerial. Butuh jurusan + pengalaman + rekomendasi perusahaan.",
    "d10.internship.q": "Bisa magang di D-10?",
    "d10.internship.a": "Magang singkat bisa. Jika jadi pekerjaan tetap harus pindah ke E-7.",
    "e7.change_jobs.q": "Bisa pindah kerja saat E-7?",
    "e7.change_jobs.a": "Bisa. Kategori sama hanya lapor; kategori beda butuh izin perubahan.",
    "e7.duration.q": "Berapa lama E-7?",
    "e7.duration.a": "Awal 1–3 tahun + perpanjangan. Setelah 5+ tahun legal bisa F-2-7 / F-5.",
    "e9.switch_to_e74.q": "Dari E-9 bisa ke E-7-4 (terampil)?",
    "e9.switch_to_e74.a": "Bisa — butuh bahasa Korea + lama kerja di bidang + memenuhi poin.",
    "long_term.no_sponsor.q": "Bisa kerja tanpa sponsor perusahaan?",
    "long_term.no_sponsor.a": "Bisa. F-2/F-4/F-5/F-6 boleh kerja bebas (kecuali pekerjaan kasar).",
    "h1.switch_to_e7.q": "Dari H-1 (working holiday) ke E-7?",
    "h1.switch_to_e7.a": "Dalam masa H-1, dapatkan offer pekerjaan E-7 dan perusahaan mensponsori.",
    "outside.fastest_route.q": "Rute tercepat dari luar Korea?",
    "outside.fastest_route.a": "Dapat offer perusahaan Korea → perusahaan sponsor E-7 → visa terbit → masuk Korea.",
    "outside.need_korean.q": "Bisa kerja tanpa bahasa Korea?",
    "outside.need_korean.a": "Posisi global (sales bahasa asing, engineering, layanan untuk orang asing) realistis. Posisi umum sulit."
  }
};

export function localizeText(locale: PlatformLocale, key: string): string {
  return NEXTSTEP_COPY[locale]?.[key] ?? NEXTSTEP_COPY.ko[key] ?? key;
}

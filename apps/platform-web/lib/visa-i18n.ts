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

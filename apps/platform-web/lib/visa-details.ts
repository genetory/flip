export type VisaStructuredLine = {
  kind: "heading" | "bullet";
  depth: number;
  text: string;
};

export type VisaDetail = {
  titleKo: string | null;
  titleEn: string | null;
  titleZh?: string | null;
  titleVi?: string | null;
  updatedAtKo: string | null;
  updatedAtEn: string | null;
  updatedAtZh?: string | null;
  updatedAtVi?: string | null;
  descriptionKo: VisaStructuredLine[];
  descriptionEn: VisaStructuredLine[];
  descriptionZh?: VisaStructuredLine[];
  descriptionVi?: VisaStructuredLine[];
  candidatesKo: VisaStructuredLine[];
  candidatesEn: VisaStructuredLine[];
  candidatesZh?: VisaStructuredLine[];
  candidatesVi?: VisaStructuredLine[];
  requirementsKo: VisaStructuredLine[];
  requirementsEn: VisaStructuredLine[];
  requirementsZh?: VisaStructuredLine[];
  requirementsVi?: VisaStructuredLine[];
  description: VisaStructuredLine[];
  candidates: VisaStructuredLine[];
  requirements: VisaStructuredLine[];
  error?: string;
};

export const VISA_DETAILS: Record<string, VisaDetail> = {
  "A-1": {
    "titleKo": "A-1 외교 비자 - 외교 사절단",
    "titleEn": "A-1 Diplomatic - Diplomatic Missions",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부가 접수한 외국정부의 외교사절단이나 영사기관의 구성원, 조약 또는 국제관행에 따라 외교사절과 동등한 특권과 면제를 받는 자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 재임기간"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Members of diplomatic missions or consular organizations of foreign governments recognized by the Government of the Republic of Korea, and persons who are granted privileges and immunities equivalent to those of diplomatic missions under treaties or international practice, and their families."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: Tenure of office"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부가 접수한 외국정부의 외교사절단이나 영사기관의 구성원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 접수된 대사, 공사, 참사관, 서기관 등의 외교직원이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부에 접수된 총영사, 영사 등의 영사관이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "조약 또는 국제관행에 따라 외교사절과 동등한 특권과 면제를 받는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국제연합의 사무총장 및 사무차장, 국제연합전문기구의 사무국장 등이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국가원수, 각료, 양원이장, 정부주최 회의에 출석하는 외국정부의 대표단 구성원 등이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상기자의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "가족은 우리나라에 주재하는 외교관과 세대를 같이 하는 배우자, 자녀, 부모 등이 해당됨"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Members of diplomatic missions or consular organizations of foreign governments recognized by the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Diplomatic personnel such as ambassadors, attachés, counsellors, and clerks registered in the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Consular officers, such as consuls general and consuls, recognized by the government of the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons entitled to privileges and immunities equivalent to those of a diplomatic mission under a treaty or international practice"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "The Secretary-General and Under-Secretary-General of the United Nations and the Executive Directors of the specialized agencies of the United Nations, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Heads of state, ministers, heads of both houses of parliament, members of delegations of foreign governments attending government-sponsored meetings, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members of the above"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members include spouses, children, parents, etc. who share the same household as the diplomat stationed in Korea."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견, 재직을 증명하는 서류 또는 해당국 외교부장관의 협조공한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국정부의 외교사절단이나 영사기관의 구성원의 동반가족에 경우에는 본국에서 발급한 가족관계증명서, 출생증명서 등 가족관계 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격외 활동 시"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권, 통합신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료(자격외 활동 12만원): 주한 미국 공관원의 동반가족은 상호주의에 따라 수수료 면제"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외교부(외교사절담당관)에서 받은 고용추천서 (필수)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 체류자격별 체류자격외 활동 필요서류 (자격요건 등 구비)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A letter of assignment or employment or a letter of cooperation from the foreign minister of the foreign country."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "In the case of accompanying family members of members of diplomatic missions or consular organizations of foreign governments, proof of family relationship such as a family relationship certificate or birth certificate issued by the home country."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "For activities outside the status of residence"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Passport, unification application"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Fee ($120 for unauthorized activities): Accompanying family members of U.S. diplomatic missions in Korea are exempt from fees based on reciprocity."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment recommendation letter from the Ministry of Foreign Affairs (Diplomatic Attaché) (required)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents required for activities outside the status of residence for each status of residence (qualifications, etc.)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부가 접수한 외국정부의 외교사절단이나 영사기관의 구성원, 조약 또는 국제관행에 따라 외교사절과 동등한 특권과 면제를 받는 자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 재임기간"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부가 접수한 외국정부의 외교사절단이나 영사기관의 구성원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 접수된 대사, 공사, 참사관, 서기관 등의 외교직원이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부에 접수된 총영사, 영사 등의 영사관이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "조약 또는 국제관행에 따라 외교사절과 동등한 특권과 면제를 받는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국제연합의 사무총장 및 사무차장, 국제연합전문기구의 사무국장 등이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국가원수, 각료, 양원이장, 정부주최 회의에 출석하는 외국정부의 대표단 구성원 등이 해당됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상기자의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "가족은 우리나라에 주재하는 외교관과 세대를 같이 하는 배우자, 자녀, 부모 등이 해당됨"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견, 재직을 증명하는 서류 또는 해당국 외교부장관의 협조공한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국정부의 외교사절단이나 영사기관의 구성원의 동반가족에 경우에는 본국에서 발급한 가족관계증명서, 출생증명서 등 가족관계 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격외 활동 시"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권, 통합신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료(자격외 활동 12만원): 주한 미국 공관원의 동반가족은 상호주의에 따라 수수료 면제"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외교부(외교사절담당관)에서 받은 고용추천서 (필수)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 체류자격별 체류자격외 활동 필요서류 (자격요건 등 구비)"
      }
    ],
    "titleZh": "A-1 外交签证 - 外交使节团",
    "titleVi": "Visa A-1 Ngoại giao - Đoàn ngoại giao",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "由韩国政府接收的外国政府外交使节团或领事机构成员，依据条约或国际惯例享有与外交使节同等特权及豁免的人员及其家属" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：任职期间" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thành viên đoàn ngoại giao hoặc cơ quan lãnh sự của chính phủ nước ngoài được Chính phủ Đại Hàn Dân Quốc tiếp nhận, người được hưởng đặc quyền và miễn trừ tương đương đoàn ngoại giao theo điều ước hoặc thông lệ quốc tế, và gia đình họ" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: Thời gian nhiệm kỳ" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "由韩国政府接收的外国政府外交使节团或领事机构成员" },
      { "kind": "bullet", "depth": 0, "text": "包括驻韩国的大使、公使、参赞、书记官等外交人员" },
      { "kind": "bullet", "depth": 0, "text": "包括驻韩国政府的总领事、领事等领事官员" },
      { "kind": "bullet", "depth": 0, "text": "依据条约或国际惯例享有与外交使节同等特权及豁免的人员" },
      { "kind": "bullet", "depth": 0, "text": "包括联合国秘书长及副秘书长、联合国专门机构事务局长等" },
      { "kind": "bullet", "depth": 0, "text": "包括国家元首、内阁成员、两院议长、出席政府主办会议的外国政府代表团成员等" },
      { "kind": "bullet", "depth": 0, "text": "上述人员的家属" },
      { "kind": "bullet", "depth": 0, "text": "家属包括与驻韩外交官共同生活的配偶、子女、父母等" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Thành viên đoàn ngoại giao hoặc cơ quan lãnh sự của chính phủ nước ngoài được Chính phủ Đại Hàn Dân Quốc tiếp nhận" },
      { "kind": "bullet", "depth": 0, "text": "Bao gồm các nhân viên ngoại giao như đại sứ, công sứ, tham tán, thư ký được tiếp nhận tại Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Bao gồm các viên chức lãnh sự như tổng lãnh sự, lãnh sự được tiếp nhận tại Chính phủ Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Người được hưởng đặc quyền và miễn trừ tương đương đoàn ngoại giao theo điều ước hoặc thông lệ quốc tế" },
      { "kind": "bullet", "depth": 0, "text": "Bao gồm Tổng Thư ký và Phó Tổng Thư ký Liên Hợp Quốc, Tổng Giám đốc các tổ chức chuyên môn của Liên Hợp Quốc, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Bao gồm nguyên thủ quốc gia, bộ trưởng, chủ tịch lưỡng viện, thành viên đoàn đại biểu chính phủ nước ngoài tham dự hội nghị do chính phủ tổ chức, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Gia đình của những người nói trên" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình bao gồm vợ/chồng, con cái, cha mẹ, v.v. cùng hộ với nhà ngoại giao thường trú tại Hàn Quốc" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "证明派遣、在职的文件，或当事国外交部长官的协助公函" },
      { "kind": "bullet", "depth": 0, "text": "外国政府外交使节团或领事机构成员的随行家属须提交本国出具的家庭关系证明、出生证明等家庭关系证明文件" },
      { "kind": "bullet", "depth": 0, "text": "在居留资格外活动时" },
      { "kind": "bullet", "depth": 1, "text": "护照、综合申请书" },
      { "kind": "bullet", "depth": 1, "text": "手续费（资格外活动 12 万韩元）：驻韩美国公馆员的随行家属依据互惠原则免除手续费" },
      { "kind": "bullet", "depth": 1, "text": "外交部（外交使节负责官）出具的雇佣推荐书（必备）" },
      { "kind": "bullet", "depth": 1, "text": "各居留资格对应的资格外活动所需材料（资格条件等齐备）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Giấy tờ chứng minh việc phái cử, đang công tác hoặc công hàm hợp tác của Bộ trưởng Ngoại giao nước liên quan" },
      { "kind": "bullet", "depth": 0, "text": "Đối với gia đình đi kèm của thành viên đoàn ngoại giao hoặc cơ quan lãnh sự của chính phủ nước ngoài, cần giấy tờ chứng minh quan hệ gia đình do nước nhà cấp (giấy chứng nhận quan hệ gia đình, giấy khai sinh, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "Khi hoạt động ngoài tư cách lưu trú" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu, đơn đăng ký tổng hợp" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí (hoạt động ngoài tư cách: 120.000 KRW): Gia đình đi kèm của nhân viên cơ quan đại diện Mỹ tại Hàn Quốc được miễn lệ phí theo nguyên tắc đối ứng" },
      { "kind": "bullet", "depth": 1, "text": "Thư giới thiệu tuyển dụng do Bộ Ngoại giao (cán bộ phụ trách đoàn ngoại giao) cấp (bắt buộc)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cần thiết cho hoạt động ngoài tư cách lưu trú theo từng tư cách lưu trú (đủ điều kiện, v.v.)" }
    ]
  },
  "A-2": {
    "titleKo": "A-2 공무 비자 - 외국 정부 공무자",
    "titleEn": "A-2 Official - Official Duties for Foreign Government",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부가 승인한 외국정부 또는 국제기구의 공무를 수행하는 자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 공무수행기간"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons performing official duties for foreign governments or international organizations approved by the Korean government and their families."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: Official duty period"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국 정부 또는 국제기구의 공무를 수행하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부가 승인한 외국정부 외교사절단의 사무직원 및 기술직원과 노무직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부가 승인한 여사기관의 사무직원 및 기술직원과 노무직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 본부를 둔 국제기구의 직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국정부 또는 국제기구가 대한민국에 있는 지사에서 대한민국정부와의 공적 업무를 위해 주재하는 당해 외국정부 또는 국제기구의 직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부와의 공적인 업무를 위해 외국정부 또는 국제기구에서 파견한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부 또는 국제기구가 주최하는 회의 등에 참가하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상기자의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상기에 해당하는 자와 동일한 세대에 속하는 가족 구성원"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons performing official duties for a foreign government or international organization"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Clerical, technical, and labor staff of diplomatic missions of foreign governments authorized by the Government of the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Clerical, technical, and labor staff of women's organizations authorized by the Korean government"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employees of international organizations headquartered in the Republic of Korea"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employees of a foreign government or international organization who are stationed in the Republic of Korea on official business with the government of the Republic of Korea at a branch office of the foreign government or international organization."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person sent by a foreign government or international organization on official business with the government of the Republic of Korea"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Participants in meetings, etc. organized by the Korean government or international organizations"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members of the above persons"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members belonging to the same household as the person described above."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견, 재직을 증명하는 서류 또는 해당국 외교부장관이나 소속부처 장관의 공한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격외 활동 시- 여권, 통합신청서 - 수수료(자격외 활동 12만원): 주한 미국 공관원의 동반가족은 상호주의에 따라 수수료 면제 - 외교부(외교사절담당관)에서 받은 고용추천서(필수)- 해당 체류자격별 체류자격외 활동 필요서류(자격요건 등 구비)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A letter from the foreign minister or the minister of your country certifying your assignment or employment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "For activities outside the status of residence"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Passport, unified application form"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Fee (120,000 won for unauthorized activities): Accompanying family members of U.S. diplomatic missions in Korea are exempt from fees based on reciprocity."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment recommendation letter from the Ministry of Foreign Affairs (Diplomatic Attaché) (required)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents required for activities outside the status of residence for each status of residence (eligibility requirements, etc.)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부가 승인한 외국정부 또는 국제기구의 공무를 수행하는 자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 공무수행기간"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국 정부 또는 국제기구의 공무를 수행하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부가 승인한 외국정부 외교사절단의 사무직원 및 기술직원과 노무직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부가 승인한 여사기관의 사무직원 및 기술직원과 노무직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 본부를 둔 국제기구의 직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국정부 또는 국제기구가 대한민국에 있는 지사에서 대한민국정부와의 공적 업무를 위해 주재하는 당해 외국정부 또는 국제기구의 직원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부와의 공적인 업무를 위해 외국정부 또는 국제기구에서 파견한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국 정부 또는 국제기구가 주최하는 회의 등에 참가하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상기자의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상기에 해당하는 자와 동일한 세대에 속하는 가족 구성원"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견, 재직을 증명하는 서류 또는 해당국 외교부장관이나 소속부처 장관의 공한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격외 활동 시- 여권, 통합신청서 - 수수료(자격외 활동 12만원): 주한 미국 공관원의 동반가족은 상호주의에 따라 수수료 면제 - 외교부(외교사절담당관)에서 받은 고용추천서(필수)- 해당 체류자격별 체류자격외 활동 필요서류(자격요건 등 구비)"
      }
    ],
    "titleZh": "A-2 公务签证 - 外国政府公务执行者",
    "titleVi": "Visa A-2 Công vụ - Người thực hiện công vụ cho chính phủ nước ngoài",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "执行经韩国政府批准的外国政府或国际机构公务的人员及其家属" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：公务执行期间" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người thực hiện công vụ cho chính phủ nước ngoài hoặc tổ chức quốc tế đã được Chính phủ Hàn Quốc phê duyệt và gia đình họ" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: Thời gian thực hiện công vụ" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "执行外国政府或国际机构公务的人员" },
      { "kind": "bullet", "depth": 0, "text": "经韩国政府批准的外国政府外交使节团的事务、技术及劳务人员" },
      { "kind": "bullet", "depth": 0, "text": "经韩国政府批准的领事机构的事务、技术及劳务人员" },
      { "kind": "bullet", "depth": 0, "text": "在韩国设立总部的国际机构的职员" },
      { "kind": "bullet", "depth": 0, "text": "在外国政府或国际机构驻韩分支机构因与韩国政府之公务而常驻的该外国政府或国际机构职员" },
      { "kind": "bullet", "depth": 0, "text": "为与韩国政府开展公务而由外国政府或国际机构派遣的人员" },
      { "kind": "bullet", "depth": 0, "text": "参加韩国政府或国际机构主办的会议等的人员" },
      { "kind": "bullet", "depth": 0, "text": "上述人员的家属" },
      { "kind": "bullet", "depth": 0, "text": "与上述人员属于同一户的家庭成员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người thực hiện công vụ cho chính phủ nước ngoài hoặc tổ chức quốc tế" },
      { "kind": "bullet", "depth": 0, "text": "Nhân viên hành chính, kỹ thuật và lao động của đoàn ngoại giao chính phủ nước ngoài đã được Chính phủ Hàn Quốc phê chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Nhân viên hành chính, kỹ thuật và lao động của cơ quan lãnh sự được Chính phủ Hàn Quốc phê chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Nhân viên của các tổ chức quốc tế đặt trụ sở chính tại Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Nhân viên của chính phủ nước ngoài hoặc tổ chức quốc tế thường trú tại chi nhánh ở Hàn Quốc để thực hiện công vụ với Chính phủ Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Người được chính phủ nước ngoài hoặc tổ chức quốc tế cử đến để thực hiện công vụ với Chính phủ Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Người tham dự các cuộc họp do Chính phủ Hàn Quốc hoặc tổ chức quốc tế chủ trì" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình của những người trên" },
      { "kind": "bullet", "depth": 0, "text": "Thành viên gia đình thuộc cùng hộ với người nói trên" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "证明派遣或在职的文件，或当事国外交部长官或所属部门长官的公函" },
      { "kind": "bullet", "depth": 0, "text": "在居留资格外活动时 - 护照、综合申请书 - 手续费（资格外活动 12 万韩元）：驻韩美国公馆员的随行家属依据互惠原则免除手续费 - 外交部（外交使节负责官）出具的雇佣推荐书（必备）- 各居留资格对应的资格外活动所需材料（资格条件等齐备）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Giấy tờ chứng minh việc phái cử hoặc đang công tác, hoặc công hàm của Bộ trưởng Ngoại giao hoặc Bộ trưởng cơ quan liên quan của nước đó" },
      { "kind": "bullet", "depth": 0, "text": "Khi hoạt động ngoài tư cách lưu trú - Hộ chiếu, đơn đăng ký tổng hợp - Lệ phí (hoạt động ngoài tư cách: 120.000 KRW): Gia đình đi kèm của nhân viên cơ quan đại diện Mỹ tại Hàn Quốc được miễn lệ phí theo nguyên tắc đối ứng - Thư giới thiệu tuyển dụng do Bộ Ngoại giao (cán bộ phụ trách đoàn ngoại giao) cấp (bắt buộc) - Hồ sơ cần thiết cho hoạt động ngoài tư cách lưu trú theo từng tư cách lưu trú (đủ điều kiện, v.v.)" }
    ]
  },
  "A-3": {
    "titleKo": "A-3 협정 비자 - 협정에 의한 면제",
    "titleEn": "A-3 Agreement - Exemption under Agreement",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부와 협정에 의하여 외국인등록이 면제되거나 이를 면제할 필요가 있다고 인정되는 자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "SOFA: 대한민국과 아메리카합중국간의 상호바위조약 제4조에 의한 시설과 구역 및 대한민국에서의 합중국 군대의 지위에 관한 협정"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Fulbright 협정: 대한민국 정부와 미합중국 정부 간의 교육에 관한 양해각서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 신분존속기간 또는 협정상의 체류기간"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons exempted from alien registration by agreement with the Government of the Republic of Korea, or deemed necessary to do so, and their families."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "SOFA: Agreement between the Republic of Korea and the United States of America on the Status of Facilities and Areas and the Status of Armed Forces of the United States of America in the Republic of Korea pursuant to Article IV of the Treaty of Mutual Reciprocity."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Fulbright Agreement: Memorandum of Understanding on Education between the Government of the Republic of Korea and the Government of the United States of America"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Limits on the length of stay that can be granted at any one time: status or contractual period of stay"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부와 협정에 의하여 외국인등록이 면제되거나 이를 면제할 필요가 있다고 인정되는 자와 그 가족"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons who are exempted from alien registration by agreement with the government of the Republic of Korea, or who are deemed necessary to be exempted, and their families.."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증 발급 시 필요서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견, 재직을 증명하는 서류 또는 해당국 외교부장관이나 소속부처 장관의 공한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격외 활동 시 필요서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서(별지34호), 여권, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "복무확인서, S.O.F.A ID 카드"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 자격 관련 서류: SPONSOR인 경우 소속 기관장(고용주)의 동의서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents required for visa issuance"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standardized photograph, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents certifying dispatch, employment, or authorization from the foreign minister or minister of the relevant country"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents required for activities outside the status of residence"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form (Attachment 34), passport, fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of service, S.O.F.A ID card"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents related to eligibility: If you are a sponsor, a letter of consent from your organization's head (employer)."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부와 협정에 의하여 외국인등록이 면제되거나 이를 면제할 필요가 있다고 인정되는 자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "SOFA: 대한민국과 아메리카합중국간의 상호바위조약 제4조에 의한 시설과 구역 및 대한민국에서의 합중국 군대의 지위에 관한 협정"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Fulbright 협정: 대한민국 정부와 미합중국 정부 간의 교육에 관한 양해각서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 신분존속기간 또는 협정상의 체류기간"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국정부와 협정에 의하여 외국인등록이 면제되거나 이를 면제할 필요가 있다고 인정되는 자와 그 가족"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증 발급 시 필요서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견, 재직을 증명하는 서류 또는 해당국 외교부장관이나 소속부처 장관의 공한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격외 활동 시 필요서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서(별지34호), 여권, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "복무확인서, S.O.F.A ID 카드"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 자격 관련 서류: SPONSOR인 경우 소속 기관장(고용주)의 동의서"
      }
    ],
    "titleZh": "A-3 协定签证 - 依据协定的免除",
    "titleVi": "Visa A-3 Hiệp định - Miễn theo hiệp định",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "依据与韩国政府的协定，外国人登录被免除或被认定有必要免除的人员及其家属" },
      { "kind": "bullet", "depth": 1, "text": "SOFA：依据《大韩民国与美利坚合众国相互防卫条约》第 4 条关于在大韩民国境内设施和区域以及美军地位的协定" },
      { "kind": "bullet", "depth": 1, "text": "富布赖特协定：大韩民国政府与美利坚合众国政府间关于教育的谅解备忘录" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：身份存续期间或协定规定的停留期间" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người được miễn đăng ký người nước ngoài theo hiệp định với Chính phủ Hàn Quốc, hoặc được nhìn nhận là cần được miễn, và gia đình họ" },
      { "kind": "bullet", "depth": 1, "text": "SOFA: Hiệp định về Quy chế Cơ sở, Khu vực và Quy chế Quân đội Hợp chúng quốc Hoa Kỳ tại Đại Hàn Dân Quốc theo Điều 4 của Hiệp ước Phòng thủ Tương hỗ giữa Hàn Quốc và Hợp chúng quốc Hoa Kỳ" },
      { "kind": "bullet", "depth": 1, "text": "Hiệp định Fulbright: Bản ghi nhớ về giáo dục giữa Chính phủ Đại Hàn Dân Quốc và Chính phủ Hợp chúng quốc Hoa Kỳ" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: Thời gian tồn tại tư cách hoặc thời hạn lưu trú quy định trong hiệp định" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "依据与韩国政府的协定，外国人登录被免除或被认定有必要免除的人员及其家属" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người được miễn đăng ký người nước ngoài theo hiệp định với Chính phủ Hàn Quốc, hoặc được nhìn nhận là cần được miễn, và gia đình họ" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放时所需材料" },
      { "kind": "bullet", "depth": 0, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "证明派遣或在职的文件，或当事国外交部长官或所属部门长官的公函" },
      { "kind": "bullet", "depth": 0, "text": "在居留资格外活动时所需材料" },
      { "kind": "bullet", "depth": 1, "text": "申请书（附件 34 号）、护照、手续费" },
      { "kind": "bullet", "depth": 1, "text": "服役证明书、S.O.F.A ID 卡" },
      { "kind": "bullet", "depth": 1, "text": "相关资格证明文件：若为 SPONSOR，需提交所属机构负责人（雇主）的同意书" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cần thiết khi cấp thị thực" },
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Giấy tờ chứng minh việc phái cử hoặc đang công tác, hoặc công hàm của Bộ trưởng Ngoại giao hoặc Bộ trưởng cơ quan liên quan của nước đó" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cần thiết khi hoạt động ngoài tư cách lưu trú" },
      { "kind": "bullet", "depth": 1, "text": "Đơn đăng ký (Phụ lục số 34), hộ chiếu, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy xác nhận phục vụ, thẻ S.O.F.A ID" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ liên quan đến tư cách: Nếu là SPONSOR, cần thư đồng ý của lãnh đạo tổ chức trực thuộc (người sử dụng lao động)" }
    ]
  },
  "B-1": {
    "titleKo": "B-1 사증면제 비자 - 관광 및 단기 업무",
    "titleEn": "B-1 Visa Exemption - Travel/Short-term Work",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 사증면제협정을 체결한 국가의 국민으로서 그 협정에 의한 활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 협정상의 체류기간"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Nationals of a country that has a visa waiver agreement with the Republic of Korea who wish to engage in activities under the agreement."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Upper limit of the period of stay that can be granted once: the period of stay under the agreement"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재입국허가를 받은 사람 또는 재입국허가가 면제된 사람으로서 그 허가 또는 면제받은 기간이 끝나기 전에 입국하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 사증면제협정을 체결한 국가의 국민으로서 그 협정에 따라 면제대상이 되는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국제친선, 관광 또는 대한민국의 이익 등을 위하여 입국하는 사람으로서 대통령령으로 정하는 바에 따라 입국허가를 받은 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민여행증명서를 발급받고 출국한 후 그 유효기간이 끝나기 전에 입국하는 사람"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who has been granted a re-entry permit or exempted from a re-entry permit and enters the country before the end of the period for which the permit or exemption was granted."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A national of a country that has concluded a visa-free agreement with the Republic of Korea and is exempted under the agreement."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons entering the country for the purpose of international friendship, tourism, or the interests of the Republic of Korea and who have been granted an entry permit as prescribed by Presidential Decree."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who has been issued a refugee travel certificate and has left the country and enters the country before the end of the validity period."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서(34호 서식), 여권 원본, 수수료"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application (Form 34), original passport, and fee."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 사증면제협정을 체결한 국가의 국민으로서 그 협정에 의한 활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 협정상의 체류기간"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재입국허가를 받은 사람 또는 재입국허가가 면제된 사람으로서 그 허가 또는 면제받은 기간이 끝나기 전에 입국하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 사증면제협정을 체결한 국가의 국민으로서 그 협정에 따라 면제대상이 되는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국제친선, 관광 또는 대한민국의 이익 등을 위하여 입국하는 사람으로서 대통령령으로 정하는 바에 따라 입국허가를 받은 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민여행증명서를 발급받고 출국한 후 그 유효기간이 끝나기 전에 입국하는 사람"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서(34호 서식), 여권 원본, 수수료"
      }
    ],
    "titleZh": "B-1 免签证 - 旅游及短期业务",
    "titleVi": "Visa B-1 Miễn thị thực - Du lịch và công vụ ngắn hạn",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "与韩国签订免签协定国家的国民，欲依据该协定开展活动者" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：协定规定的停留期间" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Công dân của nước đã ký hiệp định miễn thị thực với Hàn Quốc và muốn thực hiện hoạt động theo hiệp định đó" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: Thời hạn lưu trú theo hiệp định" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "已取得再入境许可或被免除再入境许可，并在该许可或免除期限届满前入境的人员" },
      { "kind": "bullet", "depth": 0, "text": "与韩国签订免签协定国家的国民，依据该协定属于免除对象的人员" },
      { "kind": "bullet", "depth": 0, "text": "为国际友好、旅游或韩国利益等目的入境，依据总统令规定取得入境许可的人员" },
      { "kind": "bullet", "depth": 0, "text": "取得难民旅行证明书并出境后，在有效期届满前再次入境的人员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người đã được cấp giấy phép tái nhập cảnh hoặc được miễn giấy phép tái nhập cảnh và nhập cảnh trước khi thời hạn cấp phép hoặc miễn trừ kết thúc" },
      { "kind": "bullet", "depth": 0, "text": "Công dân của nước đã ký hiệp định miễn thị thực với Hàn Quốc và thuộc đối tượng được miễn theo hiệp định đó" },
      { "kind": "bullet", "depth": 0, "text": "Người nhập cảnh vì mục đích hữu nghị quốc tế, du lịch hoặc lợi ích của Hàn Quốc và đã được cấp phép nhập cảnh theo Nghị định của Tổng thống" },
      { "kind": "bullet", "depth": 0, "text": "Người đã được cấp giấy thông hành tị nạn, xuất cảnh và nhập cảnh trở lại trước khi thời hạn hiệu lực kết thúc" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "申请书（第 34 号格式）、护照原件、手续费" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn đăng ký (Mẫu số 34), bản gốc hộ chiếu, lệ phí" }
    ]
  },
  "B-2": {
    "titleKo": "B-2 관광통과 비자 - 관광 및 여행",
    "titleEn": "B-2 Tourist Transit - Travel",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광, 통과비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간의 상한: 법무부장관이 따로 정하는 기간"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Tourist and transit visas"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Upper limit of the period of stay that can be granted at a time: set by the Minister of Justice."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광, 통과 등의 목적으로 대한민국에 사증 없이 입국하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재입국 허가를 받은 사람 또는 재입국허가가 면제된 사람으로서 그 허가 또는 면제받은 기간이 끝나기 전에 입국하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 사증면제협정을 체결한 국가의 국민으로서 그 협정에 따라 면제대상이 되는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국제친선, 관광 또는 대한민국의 이익 등을 위하여 입국하는 사람으로서 대통령령으로 정하는 바에 따라 따로 입국허가를 받은 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민여행증명서를 발급받고 출국한 후 그 유효기간이 끝나기 전에 입국하는 사람"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who intends to enter the Republic of Korea without a visa for the purpose of sightseeing, transit, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who has been granted a re-entry permit or exempted from a re-entry permit and enters the country before the end of the period for which the permit or exemption was granted."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A national of a country that has a visa-free agreement with the Republic of Korea and is exempted under the agreement."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons entering the country for the purpose of international friendship, tourism, or the interests of the Republic of Korea, and who are otherwise authorized to enter the country as prescribed by Presidential Decree."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons who have been issued a refugee travel certificate and who leave the country and enter the country before the expiration of the certificate."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서(34호 서식), 여권 원본, 수수료"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application (Form 34), original passport, and fee."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광, 통과비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간의 상한: 법무부장관이 따로 정하는 기간"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광, 통과 등의 목적으로 대한민국에 사증 없이 입국하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재입국 허가를 받은 사람 또는 재입국허가가 면제된 사람으로서 그 허가 또는 면제받은 기간이 끝나기 전에 입국하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 사증면제협정을 체결한 국가의 국민으로서 그 협정에 따라 면제대상이 되는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국제친선, 관광 또는 대한민국의 이익 등을 위하여 입국하는 사람으로서 대통령령으로 정하는 바에 따라 따로 입국허가를 받은 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민여행증명서를 발급받고 출국한 후 그 유효기간이 끝나기 전에 입국하는 사람"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서(34호 서식), 여권 원본, 수수료"
      }
    ],
    "titleZh": "B-2 旅游过境签证 - 旅游及游览",
    "titleVi": "Visa B-2 Du lịch Quá cảnh - Du lịch",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "旅游、过境签证" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：由法务部长官另行规定的期间" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thị thực du lịch, quá cảnh" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: Thời hạn do Bộ trưởng Tư pháp quy định riêng" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "为旅游、过境等目的欲免签入境韩国的人员" },
      { "kind": "bullet", "depth": 0, "text": "已取得再入境许可或被免除再入境许可，并在该许可或免除期限届满前入境的人员" },
      { "kind": "bullet", "depth": 0, "text": "与韩国签订免签协定国家的国民，依据该协定属于免除对象的人员" },
      { "kind": "bullet", "depth": 0, "text": "为国际友好、旅游或韩国利益等目的入境，依据总统令规定另行取得入境许可的人员" },
      { "kind": "bullet", "depth": 0, "text": "取得难民旅行证明书并出境后，在有效期届满前再次入境的人员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người muốn nhập cảnh Hàn Quốc không cần thị thực với mục đích du lịch, quá cảnh, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Người đã được cấp giấy phép tái nhập cảnh hoặc được miễn giấy phép tái nhập cảnh và nhập cảnh trước khi thời hạn cấp phép hoặc miễn trừ kết thúc" },
      { "kind": "bullet", "depth": 0, "text": "Công dân của nước đã ký hiệp định miễn thị thực với Hàn Quốc và thuộc đối tượng được miễn theo hiệp định đó" },
      { "kind": "bullet", "depth": 0, "text": "Người nhập cảnh vì mục đích hữu nghị quốc tế, du lịch hoặc lợi ích của Hàn Quốc và đã được cấp phép nhập cảnh riêng theo Nghị định của Tổng thống" },
      { "kind": "bullet", "depth": 0, "text": "Người đã được cấp giấy thông hành tị nạn, xuất cảnh và nhập cảnh trở lại trước khi thời hạn hiệu lực kết thúc" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "申请书（第 34 号格式）、护照原件、手续费" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn đăng ký (Mẫu số 34), bản gốc hộ chiếu, lệ phí" }
    ]
  },
  "C-1": {
    "titleKo": "C-1 일시취재 비자 - 취재 및 보도",
    "titleEn": "C-1 Temporary Journalism - Temporary Coverage/Reporting",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일시취재, 보도"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국언론사 지사 설치 준비"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여 체류 기간의 상한: 90일"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Temporary coverage, reporting"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Preparation for establishment of foreign media branches"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Upper limit of one-time authorized stay: 90 days"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 신문, 방송, 잡지, 기타 보도기관으로부터 파견되어 단기간 취재, 보도활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 보도기관과의 계약에 의하여 단기간 취재, 보도활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국 언론사의 지사설치 준비를 위해 단기간 취재, 보도활동을 하려는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A foreign newspaper, broadcaster, magazine, or other news organization for a short period of time."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who intend to cover or report for a short period of time under a contract with a foreign news organization."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who wish to conduct short-term reporting activities in preparation for the establishment of a branch office of a foreign media organization."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권사본, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소속회사의 파견증명서, 재직증명서 또는 외신보도증"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application for authorization to issue a visa, a copy of your passport, and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Company letter of dispatch, certificate of employment, or foreign press credentials"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일시취재, 보도"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국언론사 지사 설치 준비"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여 체류 기간의 상한: 90일"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 신문, 방송, 잡지, 기타 보도기관으로부터 파견되어 단기간 취재, 보도활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 보도기관과의 계약에 의하여 단기간 취재, 보도활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국 언론사의 지사설치 준비를 위해 단기간 취재, 보도활동을 하려는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권사본, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소속회사의 파견증명서, 재직증명서 또는 외신보도증"
      }
    ],
    "titleZh": "C-1 临时采访签证 - 采访及报道",
    "titleVi": "Visa C-1 Đưa tin tạm thời - Đưa tin và báo chí",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "临时采访、报道" },
      { "kind": "bullet", "depth": 0, "text": "外国媒体分社设立筹备" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：90 天" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Đưa tin, báo chí tạm thời" },
      { "kind": "bullet", "depth": 0, "text": "Chuẩn bị thiết lập chi nhánh cơ quan báo chí nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 90 ngày" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "由外国报社、广播、杂志或其他报道机构派遣，欲在短期内进行采访、报道活动的人员" },
      { "kind": "bullet", "depth": 0, "text": "依据与外国报道机构的合同，欲在短期内进行采访、报道活动的人员" },
      { "kind": "bullet", "depth": 0, "text": "为筹备外国媒体分社设立而欲在短期内进行采访、报道活动的人员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người được báo, đài phát thanh, tạp chí hoặc cơ quan báo chí nước ngoài phái cử, muốn đưa tin và tác nghiệp trong thời gian ngắn" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn đưa tin và tác nghiệp ngắn hạn theo hợp đồng với cơ quan báo chí nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn tác nghiệp ngắn hạn để chuẩn bị thiết lập chi nhánh cơ quan báo chí nước ngoài" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放认定申请书、护照复印件、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "所属公司的派遣证明、在职证明或外媒报道证" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp giấy phép cấp thị thực, bản sao hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Giấy chứng nhận phái cử, giấy chứng nhận đang công tác của công ty trực thuộc, hoặc thẻ báo chí nước ngoài" }
    ]
  },
  "C-3": {
    "titleKo": "C-3 단기방문 비자 - 관광 및 상용 활동",
    "titleEn": "C-3 Short Term Visit - Travel/Commercial Activities",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "시장조사, 업무연락, 상담, 계약 등의 상용활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광, 통과, 요양, 친지 방문, 친선경기, 각종 행사나 회의 참가 또는 참관, 문화예술, 일반연수, 강습, 종교의식 참석, 학술자료 수집, 그 밖에 이와 유사한 목적으로 90일을 넘지 않는 기간 동안 체류하려는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 90일"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Commercial activities such as market research, business contacts, consultations, contracts, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Sightseeing, transit, medical treatment, visiting relatives, friendly matches, participation in or observation of various events or meetings, cultural activities, general training, lectures, attendance at religious ceremonies, collection of academic data, and other similar purposes for a period not exceeding 90 days."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 90 days"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-1 (단기 일반)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "단기방문(C-3) 활동범위 내에 있는 모든 자 중, 아래 순수관광(C-3-2) ~ 동포방문(C-3-9) 을 제외"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-2 (단체 관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류기간 경과시 대행사(여행사)가 책임을 지는 보증개별, 단체관광 등 관광, 공항만 소무역활동 등을 목적으로 입국하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-3 (의료 관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "의료관광 사증 및 사증발급인정서 발급지침 대상자 중 단기방문자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-4 (일반 상용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "시장조사, 업무연락, 상담, 계약, 소규모 무역활동 등 상용활동자 및 사증없이 입국하는 APEC카드 소지자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-5 (협정상 단기상용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "협정에 따라 단기상용 목적으로 입국하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "CEFA, FTA 등에 한함(인도, 칠레)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-6 (우대기업 초청 단기상용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "우대기업으로 선정된 기업, 단체로부터 초청을 받은 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-7 (도착 관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공항에 입국하여 도착비자를 받아 입국하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-8 (동포 방문)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동포방문 사증 발급 대상자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-9 (일반관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "C-3-2(단체관광 등) 에 포함되지 않는 일반 관광객"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-10 (순수환승)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국을 경유하여 제 3국으로 여행하려는 자, 입국심사 목적 사용 불가"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-11 (교대선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 정박 또는 정박 예정인 선박에 승무하기 위하여 항공기나 선박의 승객으로 입국하려는 선원"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-1 (Short-term general)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "All persons within the scope of short-term visitation (C-3) activities, except for pure tourism (C-3-2) to compatriot visits (C-3-9) below."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-2 (Group tourism)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who intend to enter the country for the purpose of tourism, such as individual and group tours, and small trade activities at the airport only, for which the agency (travel agency) is responsible for the guarantee upon the expiration of the stay."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-3 (Medical Tourism)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Short-term visitors who are subject to the guidelines for issuing medical tourism visas and visa issuance certificates"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-4 (General Commercial)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "APEC Card holders who are engaged in commercial activities such as market research, business contacts, consultations, contracts, small-scale trade activities, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-5 (Short-term business under the Agreement)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Persons entering the country for short-term commercial purposes under an agreement."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "CEFA, FTA, etc. only (India, Chile)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-6 (Short-term business visits by preferential companies)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who have received an invitation from a company or organization that has been selected as a preferred company."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-7 (Arrival tourism)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Persons entering the country with an arrival visa at the airport"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-8 (Visiting Compatriots)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Persons who have been issued a visa to visit their compatriots"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-9 (General tourism)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "General tourists not included in C-3-2 (group tourism, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-10 (Pure transit)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Persons who intend to travel to a third country through the Republic of Korea, not to be used for immigration purposes"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-11 (Shifting seafarers)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Seafarers who intend to enter Korea as passengers on an aircraft or vessel to serve on a vessel anchored or scheduled to anchor in Korea."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "단기일반(C-3-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 등 입국목적(행사, 일반연수 등)을 소명하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "단체관광 등(C-3-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료, 보증관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반상용(C-3-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 (초청회사의 사업자등록증 또는 등기부등본 사본 포함) 등 상용목적 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "협정상 일반상용(C-3-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인도 현지 소속 법인의 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재직기간이 명시된 재직증명서 또는 출장명령서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 등 상품이나 서비스판매를 위한 협상 목적 또는 투자회사 설립 준비 목적 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 (초청회사의 사업자등록증 또는 등기부등본 사본 포함) 등 상용목적 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반관광(C-3-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료, 국내 체류 경비 지불을 위한 재정능력 또는 신분입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동남아 출신 학생인 경우 재학사실을 증명할 수 있는 서류 (재학증명서 또는 학생증)와 부모의 재정능력 입증서류로 사증 발급"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인센티브 관광의 경우 기본적으로 주관회사의 보증서 제출 시 재정능력 입증서류 생략"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "순수환승 (C-3-10)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료, 여행계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국 공항만을 환승공항으로 정한 이유 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "교대선원 (C-3-11)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "건강상태확인서, 코로나 19 관련 건강진단서, 격리동의서, 선원신분증명서 (선원수첩 등), 선박국적증서, 고용계약서, 국내 출입항예정통보서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "PCR음성확인서로 대체 가능"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "2회 유효 복수사증 더블사증 발급"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "입국목적 입증자료 (단수사증과 동일)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료는 미화 70불 상당 금액"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "단, 가나 90불, 러시아 90불, 세네갈 120불, 아제르바이잔 120불 영국 220불, 오스트리아 70불, 이란 90불 타지키스탄 70불, 키르키즈스탄 80불, 호주 130불, 우즈베키스탄 80불 상당 금액 징수"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "복수사증 발급지침"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "중국 국민 (C-3-1 ~ C-3-9. 단 C-3-2제외)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연령, 출입국기록 등 여권 또는 자체 전산조회로 심사가 가능한 경우 추가 서류 징구 자제"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분, 학력, 도시지역 호구 등의 사증을 신청하는 경우 아래 관련 확인서류 외 재정능력 입증서류 징구 자제"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재력가, 사업가 등 재정능력 증명이 필요한 경우 아래 예시 서류 중 2종 이내로 제한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한 몽골 사증발급 간소 ․ 화 협정대상자(C-3-1 ~ C-3-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공관의 실정에 맞게 제출서류를 지정하여 운영"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "동남아국가 국민에 대한 복수사증 발급(C-3-1 ~ C-3-9. 단 C-3-2 제외)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공관별로 실정에 맞게 제출서류를 지정하여 운영"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자원외교국가 국민에 대한 복수사증 발급 (C-3-1 또는 C-3-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공관별로 실정에 맞게 제출서류를 지정하여 운영"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결혼이민자 및 대한민국 국적취득자의 가족에 대한 특례 (C-3-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계를 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "중국동포에 대한 복수사증발급(C-3-8)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국국적 동포임을 입증하는 국적국의 공적서류 (거민증 호구부 등)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Short-term general (C-3-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for visa, passport, photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Invitation letter or other documents indicating the purpose of entry (event, general training, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Group tourism (C-3-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa application, passport, photo, fee, guarantee, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "General commercial use (C-3-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa application, passport, photo, fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Letter of invitation (including a copy of the inviting company's business license or certificate of incorporation), etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Agreement for general commercial use (C-3-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form for issuance of visa, passport, photograph, fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents related to the establishment of a local affiliate in India"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment certificate or travel order stating the period of employment."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of negotiations for the purpose of selling goods or services or preparing to establish an investment company, such as invitation letters, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Letter of invitation (including a copy of the inviting company's business license or registration certificate) for commercial purposes"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "General tourism (C-3-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa application, passport, photo, and proof of financial ability or identification to pay fees and expenses for stay in the country."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If you are a student from Southeast Asia, you will be issued a visa with proof of enrollment (enrollment certificate or student ID) and proof of parental financial capacity."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "In the case of incentive tourism, proof of financial capacity is basically omitted upon submission of a guarantee letter from the organizing company."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Pure transit (C-3-10)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Passport, photo, fee, and itinerary for visa application."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Reasons for selecting only Korean airports as transit airports, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Shift crew (C-3-11)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Health certificate, medical examination related to COVID-19, quarantine agreement, seafarer's identity card (seafarer's book, etc.), ship's nationality certificate, employment contract, notification of scheduled port of entry in Korea, etc."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "PCR negative certificate can be substituted"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Issuance of a double visa valid for 2 years"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Proof of purpose of entry (same as single entry)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Fee: $70 USD equivalent"
      },
      {
        "kind": "bullet",
        "depth": 3,
        "text": "However, Ghana 90 USD, Russia 90 USD, Senegal 120 USD, Azerbaijan 120 USD United Kingdom 220 USD, Austria 70 USD, Iran 90 USD Tajikistan 70 USD, Kyrgyzstan 80 USD, Australia 130 USD, Uzbekistan 80 USD equivalent will be collected."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Guidelines for issuing duplicate certificates"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Chinese nationals (C-3-1 through C-3-9, except C-3-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Refrain from collecting additional documents if they can be verified by passport or self-checking, such as age, immigration records, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "When applying for a visa for status, education, urban area, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If you need to prove your financial capability, such as a businessman or businesswoman, limit yourself to no more than two of the example documents below."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Applicants under the Han Mongolia Visa Simplification and Reconciliation Agreement (C-3-1 through C-3-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, and photo fees"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Specifying the documents to be submitted according to the actual situation of the diplomatic mission"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Issuance of duplicate visas to nationals of Southeast Asian countries (C-3-1 through C-3-9, except C-3-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Each diplomatic mission specifies the documents to be submitted according to the actual situation."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Issuance of duplicate visas to nationals of resource diplomatic countries (C-3-1 or C-3-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Designate submission documents for each diplomatic mission according to the actual situation."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Special cases for marriage immigrants and family members of Korean nationals (C-3-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for issuance of visa, copy of passport"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents to prove family relationship"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Multiple issuance for Chinese compatriots (C-3-8)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, copy of passport"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Official documents from the country of nationality proving that you are a foreign national (copy of residence card, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of overseas criminal history"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa issued under the Korea-India Visa Process Simplification Agreement (C-3-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A copy of the invitation letter business license, proof of employment, tax certificate of the applicant or the employer."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Issuance of duplicate visas for frequent travelers"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Visa application form, passport, photo, and fees are waived."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "시장조사, 업무연락, 상담, 계약 등의 상용활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광, 통과, 요양, 친지 방문, 친선경기, 각종 행사나 회의 참가 또는 참관, 문화예술, 일반연수, 강습, 종교의식 참석, 학술자료 수집, 그 밖에 이와 유사한 목적으로 90일을 넘지 않는 기간 동안 체류하려는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 90일"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-1 (단기 일반)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "단기방문(C-3) 활동범위 내에 있는 모든 자 중, 아래 순수관광(C-3-2) ~ 동포방문(C-3-9) 을 제외"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-2 (단체 관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류기간 경과시 대행사(여행사)가 책임을 지는 보증개별, 단체관광 등 관광, 공항만 소무역활동 등을 목적으로 입국하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-3 (의료 관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "의료관광 사증 및 사증발급인정서 발급지침 대상자 중 단기방문자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-4 (일반 상용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "시장조사, 업무연락, 상담, 계약, 소규모 무역활동 등 상용활동자 및 사증없이 입국하는 APEC카드 소지자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-5 (협정상 단기상용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "협정에 따라 단기상용 목적으로 입국하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "CEFA, FTA 등에 한함(인도, 칠레)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-6 (우대기업 초청 단기상용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "우대기업으로 선정된 기업, 단체로부터 초청을 받은 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-7 (도착 관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공항에 입국하여 도착비자를 받아 입국하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-8 (동포 방문)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동포방문 사증 발급 대상자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-9 (일반관광)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "C-3-2(단체관광 등) 에 포함되지 않는 일반 관광객"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-10 (순수환승)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국을 경유하여 제 3국으로 여행하려는 자, 입국심사 목적 사용 불가"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "C-3-11 (교대선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 정박 또는 정박 예정인 선박에 승무하기 위하여 항공기나 선박의 승객으로 입국하려는 선원"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "단기일반(C-3-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 등 입국목적(행사, 일반연수 등)을 소명하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "단체관광 등(C-3-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료, 보증관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반상용(C-3-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 (초청회사의 사업자등록증 또는 등기부등본 사본 포함) 등 상용목적 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "협정상 일반상용(C-3-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인도 현지 소속 법인의 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재직기간이 명시된 재직증명서 또는 출장명령서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 등 상품이나 서비스판매를 위한 협상 목적 또는 투자회사 설립 준비 목적 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장 (초청회사의 사업자등록증 또는 등기부등본 사본 포함) 등 상용목적 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반관광(C-3-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료, 국내 체류 경비 지불을 위한 재정능력 또는 신분입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동남아 출신 학생인 경우 재학사실을 증명할 수 있는 서류 (재학증명서 또는 학생증)와 부모의 재정능력 입증서류로 사증 발급"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인센티브 관광의 경우 기본적으로 주관회사의 보증서 제출 시 재정능력 입증서류 생략"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "순수환승 (C-3-10)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료, 여행계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국 공항만을 환승공항으로 정한 이유 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "교대선원 (C-3-11)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "건강상태확인서, 코로나 19 관련 건강진단서, 격리동의서, 선원신분증명서 (선원수첩 등), 선박국적증서, 고용계약서, 국내 출입항예정통보서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "PCR음성확인서로 대체 가능"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "2회 유효 복수사증 더블사증 발급"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "입국목적 입증자료 (단수사증과 동일)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료는 미화 70불 상당 금액"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "단, 가나 90불, 러시아 90불, 세네갈 120불, 아제르바이잔 120불 영국 220불, 오스트리아 70불, 이란 90불 타지키스탄 70불, 키르키즈스탄 80불, 호주 130불, 우즈베키스탄 80불 상당 금액 징수"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "복수사증 발급지침"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "중국 국민 (C-3-1 ~ C-3-9. 단 C-3-2제외)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연령, 출입국기록 등 여권 또는 자체 전산조회로 심사가 가능한 경우 추가 서류 징구 자제"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분, 학력, 도시지역 호구 등의 사증을 신청하는 경우 아래 관련 확인서류 외 재정능력 입증서류 징구 자제"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재력가, 사업가 등 재정능력 증명이 필요한 경우 아래 예시 서류 중 2종 이내로 제한"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한 몽골 사증발급 간소 ․ 화 협정대상자(C-3-1 ~ C-3-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공관의 실정에 맞게 제출서류를 지정하여 운영"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "동남아국가 국민에 대한 복수사증 발급(C-3-1 ~ C-3-9. 단 C-3-2 제외)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공관별로 실정에 맞게 제출서류를 지정하여 운영"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자원외교국가 국민에 대한 복수사증 발급 (C-3-1 또는 C-3-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 사진, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공관별로 실정에 맞게 제출서류를 지정하여 운영"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결혼이민자 및 대한민국 국적취득자의 가족에 대한 특례 (C-3-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계를 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "중국동포에 대한 복수사증발급(C-3-8)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국국적 동포임을 입증하는 국적국의 공적서류 (거민증 호구부 등)"
      }
    ],
    "titleZh": "C-3 短期访问签证 - 旅游及商务活动",
    "titleVi": "Visa C-3 Thăm ngắn hạn - Du lịch và công vụ thương mại",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "市场调查、业务联络、洽谈、签订合同等商务活动" },
      { "kind": "bullet", "depth": 0, "text": "旅游、过境、疗养、探亲、友谊比赛、参加或参观各类活动或会议、文化艺术、一般研修、培训、参加宗教仪式、收集学术资料以及其他类似目的，停留期限不超过 90 天" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：90 天" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Hoạt động thương mại như khảo sát thị trường, liên lạc công việc, tham vấn, ký kết hợp đồng, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Người muốn lưu trú không quá 90 ngày với mục đích du lịch, quá cảnh, điều dưỡng, thăm thân, thi đấu giao hữu, tham dự hoặc quan sát các sự kiện và hội nghị, văn hoá nghệ thuật, đào tạo chung, học tập ngắn hạn, dự lễ tôn giáo, thu thập tài liệu học thuật và các mục đích tương tự khác" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 90 ngày" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "C-3-1（短期一般）" },
      { "kind": "bullet", "depth": 1, "text": "短期访问（C-3）活动范围内的所有人员，下列纯旅游（C-3-2）至同胞访问（C-3-9）除外" },
      { "kind": "bullet", "depth": 0, "text": "C-3-2（团体旅游）" },
      { "kind": "bullet", "depth": 1, "text": "由代理机构（旅行社）对停留期满承担担保责任的个人或团体旅游、机场小额贸易活动等目的入境的人员" },
      { "kind": "bullet", "depth": 0, "text": "C-3-3（医疗旅游）" },
      { "kind": "bullet", "depth": 1, "text": "符合医疗旅游签证及签证发放认定书发放指南对象中的短期访问者" },
      { "kind": "bullet", "depth": 0, "text": "C-3-4（一般商务）" },
      { "kind": "bullet", "depth": 1, "text": "从事市场调查、业务联络、洽谈、签订合同、小规模贸易活动等商务活动者，以及免签入境的 APEC 卡持有者" },
      { "kind": "bullet", "depth": 0, "text": "C-3-5（协定上的短期商务）" },
      { "kind": "bullet", "depth": 1, "text": "依据协定为短期商务目的入境的人员" },
      { "kind": "bullet", "depth": 1, "text": "仅限 CEFA、FTA 等（印度、智利）" },
      { "kind": "bullet", "depth": 0, "text": "C-3-6（优待企业邀请的短期商务）" },
      { "kind": "bullet", "depth": 1, "text": "受被选为优待企业的企业或团体邀请的人员" },
      { "kind": "bullet", "depth": 0, "text": "C-3-7（落地签）" },
      { "kind": "bullet", "depth": 1, "text": "在机场入境时领取落地签入境的人员" },
      { "kind": "bullet", "depth": 0, "text": "C-3-8（同胞访问）" },
      { "kind": "bullet", "depth": 1, "text": "同胞访问签证发放对象者" },
      { "kind": "bullet", "depth": 0, "text": "C-3-9（一般旅游）" },
      { "kind": "bullet", "depth": 1, "text": "未包含在 C-3-2（团体旅游等）的一般游客" },
      { "kind": "bullet", "depth": 0, "text": "C-3-10（纯过境）" },
      { "kind": "bullet", "depth": 1, "text": "经由韩国前往第三国旅行者，不可用于入境审查目的" },
      { "kind": "bullet", "depth": 0, "text": "C-3-11（换班船员）" },
      { "kind": "bullet", "depth": 1, "text": "为登上在韩国停泊或预定停泊的船舶而以飞机或船舶乘客身份入境的船员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "C-3-1 (Ngắn hạn thông thường)" },
      { "kind": "bullet", "depth": 1, "text": "Tất cả người trong phạm vi hoạt động thăm ngắn hạn (C-3), trừ các diện từ Du lịch thuần tuý (C-3-2) đến Thăm đồng bào (C-3-9) dưới đây" },
      { "kind": "bullet", "depth": 0, "text": "C-3-2 (Du lịch theo đoàn)" },
      { "kind": "bullet", "depth": 1, "text": "Người nhập cảnh với mục đích du lịch cá nhân/theo đoàn được công ty đại lý (lữ hành) chịu trách nhiệm bảo đảm khi quá hạn lưu trú, hoặc hoạt động thương mại nhỏ tại sân bay/cảng" },
      { "kind": "bullet", "depth": 0, "text": "C-3-3 (Du lịch y tế)" },
      { "kind": "bullet", "depth": 1, "text": "Người thăm ngắn hạn thuộc đối tượng theo Hướng dẫn cấp thị thực và giấy phép cấp thị thực cho du lịch y tế" },
      { "kind": "bullet", "depth": 0, "text": "C-3-4 (Thương mại thông thường)" },
      { "kind": "bullet", "depth": 1, "text": "Người tham gia các hoạt động thương mại như khảo sát thị trường, liên lạc công việc, tham vấn, ký hợp đồng, hoạt động thương mại quy mô nhỏ và người sở hữu thẻ APEC nhập cảnh không cần thị thực" },
      { "kind": "bullet", "depth": 0, "text": "C-3-5 (Thương mại ngắn hạn theo hiệp định)" },
      { "kind": "bullet", "depth": 1, "text": "Người nhập cảnh vì mục đích thương mại ngắn hạn theo hiệp định" },
      { "kind": "bullet", "depth": 1, "text": "Chỉ áp dụng với CEFA, FTA, v.v. (Ấn Độ, Chile)" },
      { "kind": "bullet", "depth": 0, "text": "C-3-6 (Thương mại ngắn hạn do doanh nghiệp ưu đãi mời)" },
      { "kind": "bullet", "depth": 1, "text": "Người được mời bởi các doanh nghiệp, tổ chức được chọn là doanh nghiệp ưu đãi" },
      { "kind": "bullet", "depth": 0, "text": "C-3-7 (Du lịch nhận visa khi đến)" },
      { "kind": "bullet", "depth": 1, "text": "Người nhận visa tại sân bay khi nhập cảnh" },
      { "kind": "bullet", "depth": 0, "text": "C-3-8 (Thăm đồng bào)" },
      { "kind": "bullet", "depth": 1, "text": "Đối tượng được cấp thị thực thăm đồng bào" },
      { "kind": "bullet", "depth": 0, "text": "C-3-9 (Du lịch thông thường)" },
      { "kind": "bullet", "depth": 1, "text": "Du khách thông thường không thuộc C-3-2 (Du lịch theo đoàn, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "C-3-10 (Quá cảnh thuần tuý)" },
      { "kind": "bullet", "depth": 1, "text": "Người đi qua Hàn Quốc để đến nước thứ ba; không sử dụng cho mục đích kiểm tra nhập cảnh" },
      { "kind": "bullet", "depth": 0, "text": "C-3-11 (Thuyền viên thay phiên)" },
      { "kind": "bullet", "depth": 1, "text": "Thuyền viên nhập cảnh với tư cách hành khách của máy bay hoặc tàu để lên tàu đang neo đậu hoặc dự kiến neo đậu trong nước" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "短期一般（C-3-1）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费" },
      { "kind": "bullet", "depth": 1, "text": "邀请函等证明入境目的（活动、一般研修等）的文件" },
      { "kind": "bullet", "depth": 0, "text": "团体旅游等（C-3-2）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费、担保相关文件" },
      { "kind": "bullet", "depth": 0, "text": "一般商务（C-3-4）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费" },
      { "kind": "bullet", "depth": 1, "text": "邀请函（包含邀请公司的营业执照或登记簿副本）等证明商务目的的文件" },
      { "kind": "bullet", "depth": 0, "text": "协定上的一般商务（C-3-5）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费" },
      { "kind": "bullet", "depth": 1, "text": "在印度当地法人设立相关文件" },
      { "kind": "bullet", "depth": 1, "text": "注明在职期间的在职证明或出差命令书" },
      { "kind": "bullet", "depth": 1, "text": "邀请函等证明商品或服务销售谈判目的，或证明设立投资公司筹备目的的文件" },
      { "kind": "bullet", "depth": 1, "text": "邀请函（包含邀请公司的营业执照或登记簿副本）等证明商务目的的文件" },
      { "kind": "bullet", "depth": 0, "text": "一般旅游（C-3-9）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费、用以支付国内停留费用的财力证明或身份证明" },
      { "kind": "bullet", "depth": 1, "text": "东南亚学生需提交在学证明（在学证明或学生证）及父母财力证明以发放签证" },
      { "kind": "bullet", "depth": 1, "text": "奖励旅游情况下，提交主办公司担保函时基本免除财力证明" },
      { "kind": "bullet", "depth": 0, "text": "纯过境（C-3-10）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费、旅行计划书" },
      { "kind": "bullet", "depth": 1, "text": "选择韩国机场作为转机机场的理由等" },
      { "kind": "bullet", "depth": 0, "text": "换班船员（C-3-11）" },
      { "kind": "bullet", "depth": 1, "text": "健康状态确认书、新冠相关健康检查书、隔离同意书、船员身份证明（船员手册等）、船舶国籍证书、雇佣合同、国内出入港预定通知书" },
      { "kind": "bullet", "depth": 1, "text": "可用 PCR 阴性证明替代" },
      { "kind": "bullet", "depth": 0, "text": "2 次有效复数签证（双次签证）发放" },
      { "kind": "bullet", "depth": 1, "text": "入境目的证明材料（与单次签证相同）" },
      { "kind": "bullet", "depth": 1, "text": "手续费为相当于 70 美元的金额" },
      { "kind": "bullet", "depth": 1, "text": "但加纳 90 美元、俄罗斯 90 美元、塞内加尔 120 美元、阿塞拜疆 120 美元、英国 220 美元、奥地利 70 美元、伊朗 90 美元、塔吉克斯坦 70 美元、吉尔吉斯斯坦 80 美元、澳大利亚 130 美元、乌兹别克斯坦 80 美元相当金额征收" },
      { "kind": "bullet", "depth": 0, "text": "复数签证发放指南" },
      { "kind": "bullet", "depth": 1, "text": "中国国民（C-3-1 ~ C-3-9，C-3-2 除外）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费" },
      { "kind": "bullet", "depth": 1, "text": "如可通过年龄、出入境记录等护照或自有电脑系统审核，避免要求额外材料" },
      { "kind": "bullet", "depth": 1, "text": "申请涉及身份、学历、城市地区户口等签证时，除以下相关确认材料外避免要求财力证明" },
      { "kind": "bullet", "depth": 1, "text": "财力人士、企业家等需要财力证明时，限于以下示例材料中不超过 2 种" },
      { "kind": "bullet", "depth": 0, "text": "韩蒙签证发放简化协定对象者（C-3-1 ~ C-3-9）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片手续费" },
      { "kind": "bullet", "depth": 1, "text": "根据使馆实际情况指定提交材料运行" },
      { "kind": "bullet", "depth": 0, "text": "对东南亚国家国民发放复数签证（C-3-1 ~ C-3-9，C-3-2 除外）" },
      { "kind": "bullet", "depth": 1, "text": "各使馆根据实际情况指定提交材料运行" },
      { "kind": "bullet", "depth": 0, "text": "对资源外交国家国民发放复数签证（C-3-1 或 C-3-4）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、照片、手续费" },
      { "kind": "bullet", "depth": 1, "text": "各使馆根据实际情况指定提交材料运行" },
      { "kind": "bullet", "depth": 0, "text": "结婚移民者及取得韩国国籍者家属的特例（C-3-1）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照复印件" },
      { "kind": "bullet", "depth": 1, "text": "可证明家庭关系的文件" },
      { "kind": "bullet", "depth": 0, "text": "对中国同胞的复数签证发放（C-3-8）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照复印件" },
      { "kind": "bullet", "depth": 1, "text": "证明外籍同胞身份的国籍国公文（居民证、户口簿等）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Ngắn hạn thông thường (C-3-1)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Thư mời hoặc giấy tờ chứng minh mục đích nhập cảnh (sự kiện, đào tạo chung, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "Du lịch theo đoàn, v.v. (C-3-2)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí, giấy tờ liên quan đến bảo lãnh" },
      { "kind": "bullet", "depth": 0, "text": "Thương mại thông thường (C-3-4)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Thư mời (kèm bản sao giấy phép kinh doanh hoặc giấy đăng ký doanh nghiệp của công ty mời) và giấy tờ chứng minh mục đích thương mại" },
      { "kind": "bullet", "depth": 0, "text": "Thương mại thông thường theo hiệp định (C-3-5)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ liên quan đến việc thành lập pháp nhân địa phương tại Ấn Độ" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang công tác có ghi rõ thời gian làm việc hoặc giấy phái cử công tác" },
      { "kind": "bullet", "depth": 1, "text": "Thư mời và các giấy tờ chứng minh mục đích đàm phán bán hàng/dịch vụ hoặc chuẩn bị thành lập công ty đầu tư" },
      { "kind": "bullet", "depth": 1, "text": "Thư mời (kèm bản sao giấy phép kinh doanh hoặc giấy đăng ký doanh nghiệp của công ty mời) và giấy tờ chứng minh mục đích thương mại" },
      { "kind": "bullet", "depth": 0, "text": "Du lịch thông thường (C-3-9)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí, giấy chứng minh năng lực tài chính hoặc thân phận để chi trả chi phí lưu trú trong nước" },
      { "kind": "bullet", "depth": 1, "text": "Đối với học sinh đến từ Đông Nam Á, cần giấy chứng minh đang theo học (giấy xác nhận học tập hoặc thẻ học sinh) và giấy tờ chứng minh năng lực tài chính của cha mẹ để cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Đối với du lịch khen thưởng, có thể miễn giấy tờ chứng minh năng lực tài chính khi nộp thư bảo đảm của công ty tổ chức" },
      { "kind": "bullet", "depth": 0, "text": "Quá cảnh thuần tuý (C-3-10)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí, lịch trình du lịch" },
      { "kind": "bullet", "depth": 1, "text": "Lý do chọn sân bay Hàn Quốc làm sân bay quá cảnh, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Thuyền viên thay phiên (C-3-11)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy xác nhận tình trạng sức khỏe, giấy khám sức khỏe COVID-19, đơn đồng ý cách ly, giấy chứng minh thân phận thuyền viên (sổ thuyền viên, v.v.), giấy chứng nhận quốc tịch tàu, hợp đồng lao động, thông báo dự kiến xuất nhập cảng trong nước" },
      { "kind": "bullet", "depth": 1, "text": "Có thể thay thế bằng giấy chứng nhận PCR âm tính" },
      { "kind": "bullet", "depth": 0, "text": "Cấp thị thực có hiệu lực 2 lần (double visa)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh mục đích nhập cảnh (giống như visa đơn)" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí tương đương 70 USD" },
      { "kind": "bullet", "depth": 1, "text": "Tuy nhiên, Ghana 90 USD, Nga 90 USD, Senegal 120 USD, Azerbaijan 120 USD, Anh 220 USD, Áo 70 USD, Iran 90 USD, Tajikistan 70 USD, Kyrgyzstan 80 USD, Úc 130 USD, Uzbekistan 80 USD - mức tương đương sẽ được thu" },
      { "kind": "bullet", "depth": 0, "text": "Hướng dẫn cấp thị thực nhiều lần" },
      { "kind": "bullet", "depth": 1, "text": "Công dân Trung Quốc (C-3-1 ~ C-3-9, ngoại trừ C-3-2)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Hạn chế yêu cầu thêm giấy tờ nếu có thể xét duyệt qua hộ chiếu hoặc tra cứu hệ thống nội bộ về tuổi, lịch sử xuất nhập cảnh" },
      { "kind": "bullet", "depth": 1, "text": "Khi xin thị thực dựa trên thân phận, học vấn, hộ khẩu khu vực thành thị, v.v., hạn chế yêu cầu giấy tờ chứng minh năng lực tài chính ngoài các giấy xác nhận liên quan dưới đây" },
      { "kind": "bullet", "depth": 1, "text": "Đối với người giàu có, doanh nhân cần chứng minh năng lực tài chính, giới hạn không quá 2 loại trong các giấy tờ ví dụ dưới đây" },
      { "kind": "bullet", "depth": 0, "text": "Đối tượng theo Hiệp định đơn giản hoá cấp thị thực Hàn-Mông Cổ (C-3-1 ~ C-3-9)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Vận hành theo cách chỉ định hồ sơ phù hợp với tình hình thực tế của cơ quan đại diện" },
      { "kind": "bullet", "depth": 0, "text": "Cấp thị thực nhiều lần cho công dân các nước Đông Nam Á (C-3-1 ~ C-3-9, ngoại trừ C-3-2)" },
      { "kind": "bullet", "depth": 1, "text": "Mỗi cơ quan đại diện vận hành theo cách chỉ định hồ sơ phù hợp với tình hình thực tế" },
      { "kind": "bullet", "depth": 0, "text": "Cấp thị thực nhiều lần cho công dân các nước ngoại giao tài nguyên (C-3-1 hoặc C-3-4)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, ảnh, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Mỗi cơ quan đại diện vận hành theo cách chỉ định hồ sơ phù hợp với tình hình thực tế" },
      { "kind": "bullet", "depth": 0, "text": "Đặc lệ cho người kết hôn nhập cư và gia đình của người đã nhập quốc tịch Hàn Quốc (C-3-1)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, bản sao hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh quan hệ gia đình" },
      { "kind": "bullet", "depth": 0, "text": "Cấp thị thực nhiều lần cho đồng bào Trung Quốc (C-3-8)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, bản sao hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ công của nước có quốc tịch chứng minh là đồng bào quốc tịch nước ngoài (chứng minh thư cư dân, hộ khẩu, v.v.)" }
    ]
  },
  "C-4": {
    "titleKo": "C-4 단기취업 비자 - 연구, 광고 등 단기 근로",
    "titleEn": "C-4 Short Term Employment - Short-term Employment Such as Research, Advertising, Etc.",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 관계 중앙행정기관의 장과 협의하여 정하는 농작물 재배 수확 및 수산물 원시가공 분야에서 취업 활동을 하려는 사람으로서 법무부장관이 인정하는 사람 (C-4-1~4)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일시흥행, 광고, 패션모델 강의 강연 연구 기술지도 등 수익을 목적으로 단기간 취업활동을 하려는 자 (C-4-5)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 90일"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons recognized by the Minister of Justice as persons seeking employment in the fields of crop cultivation and harvesting and raw processing of marine products, as determined by the Minister of Justice in consultation with the head of the relevant central administrative agency (C-4-1 to C-4-4)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who intend to work for a short period of time for the purpose of earning money, such as temporary entertainment, advertising, fashion modeling, lectures, research, and technical guidance (C-4-5)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay: 90 days"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "계절근로 단기취업(C-4-1, C-4-2, C-4-3, C-4-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당자는 계절근로(E-8) 자격 참조"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "계절근로 외 단기취업(C-4-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "일시 흥행 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "광고, 패션 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "강의, 강연"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연구, 기술지도"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Short-term seasonal employment (C-4-1, C-4-2, C-4-3, C-4-4)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "See eligibility for seasonal work (E-8)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Short-term employment other than seasonal work (C-4-5)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Temporary box office activities"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Advertising, fashion activities"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Teaching, lecturing"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Research, technical instruction"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소관부처(산하단체)의 고용추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공사기관 설립관련 서류 (사업자등록증, 법인등기부등본 등)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa application, passport, one standard-sized photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment contract"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment recommendation letter from the relevant department (affiliated organization)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to the establishment of the organization (business license, corporate register, etc.)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 관계 중앙행정기관의 장과 협의하여 정하는 농작물 재배 수확 및 수산물 원시가공 분야에서 취업 활동을 하려는 사람으로서 법무부장관이 인정하는 사람 (C-4-1~4)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일시흥행, 광고, 패션모델 강의 강연 연구 기술지도 등 수익을 목적으로 단기간 취업활동을 하려는 자 (C-4-5)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 90일"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "계절근로 단기취업(C-4-1, C-4-2, C-4-3, C-4-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당자는 계절근로(E-8) 자격 참조"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "계절근로 외 단기취업(C-4-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "일시 흥행 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "광고, 패션 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "강의, 강연"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연구, 기술지도"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소관부처(산하단체)의 고용추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공사기관 설립관련 서류 (사업자등록증, 법인등기부등본 등)"
      }
    ],
    "titleZh": "C-4 短期就业签证 - 研究、广告等短期工作",
    "titleVi": "Visa C-4 Việc làm ngắn hạn - Làm việc ngắn hạn như nghiên cứu, quảng cáo, v.v.",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "经法务部长官与相关中央行政机关首长协商确定，欲在农作物种植与收获、水产品初加工领域从事就业活动且经法务部长官认定的人员（C-4-1~4）" },
      { "kind": "bullet", "depth": 0, "text": "以临时演艺、广告、时装模特、讲座、演讲、研究、技术指导等盈利为目的的短期就业活动者（C-4-5）" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：90 天" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người được Bộ trưởng Tư pháp công nhận, thực hiện hoạt động làm việc trong lĩnh vực canh tác/thu hoạch nông sản và sơ chế thuỷ sản theo thoả thuận giữa Bộ trưởng Tư pháp và lãnh đạo cơ quan hành chính trung ương liên quan (C-4-1~4)" },
      { "kind": "bullet", "depth": 0, "text": "Người làm việc ngắn hạn vì mục đích thu nhập như biểu diễn tạm thời, quảng cáo, người mẫu thời trang, giảng dạy, thuyết giảng, nghiên cứu, hướng dẫn kỹ thuật, v.v. (C-4-5)" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 90 ngày" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "季节工短期就业（C-4-1、C-4-2、C-4-3、C-4-4）" },
      { "kind": "bullet", "depth": 1, "text": "对象者请参考季节工（E-8）资格" },
      { "kind": "bullet", "depth": 0, "text": "季节工外的短期就业（C-4-5）" },
      { "kind": "bullet", "depth": 1, "text": "临时演艺活动" },
      { "kind": "bullet", "depth": 1, "text": "广告、时装活动" },
      { "kind": "bullet", "depth": 1, "text": "讲座、演讲" },
      { "kind": "bullet", "depth": 1, "text": "研究、技术指导" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Việc làm ngắn hạn theo mùa (C-4-1, C-4-2, C-4-3, C-4-4)" },
      { "kind": "bullet", "depth": 1, "text": "Đối tượng tham khảo tư cách Lao động thời vụ (E-8)" },
      { "kind": "bullet", "depth": 0, "text": "Việc làm ngắn hạn ngoài lao động thời vụ (C-4-5)" },
      { "kind": "bullet", "depth": 1, "text": "Hoạt động biểu diễn tạm thời" },
      { "kind": "bullet", "depth": 1, "text": "Hoạt động quảng cáo, thời trang" },
      { "kind": "bullet", "depth": 1, "text": "Giảng dạy, thuyết giảng" },
      { "kind": "bullet", "depth": 1, "text": "Nghiên cứu, hướng dẫn kỹ thuật" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "雇佣合同" },
      { "kind": "bullet", "depth": 0, "text": "主管部门（下属机构）的雇佣推荐书" },
      { "kind": "bullet", "depth": 0, "text": "公私机构设立相关材料（营业执照、法人登记簿副本等）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Hợp đồng lao động" },
      { "kind": "bullet", "depth": 0, "text": "Thư giới thiệu tuyển dụng của bộ chủ quản (hoặc tổ chức trực thuộc)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến việc thành lập cơ quan (giấy phép kinh doanh, giấy đăng ký pháp nhân, v.v.)" }
    ]
  },
  "D-1": {
    "titleKo": "D-1 문화예술 비자 - 비영리 예술 활동",
    "titleEn": "D-1 Culture/Arts - Non-profit Art Activities",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "문화예술 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Arts and culture visa"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Upper limit on the length of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익을 목적으로 하지 아니하는 학술 또는 예술상의 활동을 하려고 하는 자 (대한민국의 고유문화 또는 예술에 대하여 전문적인 연구를 하거나 전문가의 지도를 받으려는 자 포함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "논문작성, 창작 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비영리 학술활동, 예술단체의 초청으로 학술 또는 순수 예술 활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 고유 문화 또는 예술에 대하여 전문적으로 연구하거나 전문가의 지도를 받으려는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "To engage in academic or artistic activities that are not for profit (including those who wish to conduct specialized research or receive expert guidance on Korea's unique culture or art)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those engaged in thesis writing or creative activities"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Engaging in academic or fine arts activities at the invitation of a non-profit academic or arts organization"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Professionally studying Korea's unique culture or arts, or seeking guidance from experts."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "초청장"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "문화예술단체임을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "이력서 또는 경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 중 일체의 경비지불능력을 증명하는 서류"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application for authorization to issue a visa, passport, and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Invitation letter"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of cultural organization status"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Resume or work history"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of inability to pay for any expenses during your stay."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "문화예술 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익을 목적으로 하지 아니하는 학술 또는 예술상의 활동을 하려고 하는 자 (대한민국의 고유문화 또는 예술에 대하여 전문적인 연구를 하거나 전문가의 지도를 받으려는 자 포함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "논문작성, 창작 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비영리 학술활동, 예술단체의 초청으로 학술 또는 순수 예술 활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 고유 문화 또는 예술에 대하여 전문적으로 연구하거나 전문가의 지도를 받으려는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "초청장"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "문화예술단체임을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "이력서 또는 경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 중 일체의 경비지불능력을 증명하는 서류"
      }
    ],
    "titleZh": "D-1 文化艺术签证 - 非营利艺术活动",
    "titleVi": "Visa D-1 Văn hoá nghệ thuật - Hoạt động nghệ thuật phi lợi nhuận",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "文化艺术签证" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thị thực văn hoá nghệ thuật" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "欲从事非营利学术或艺术活动者（包括欲对韩国独有文化或艺术进行专业研究或接受专家指导者）" },
      { "kind": "bullet", "depth": 0, "text": "从事论文撰写、创作活动者" },
      { "kind": "bullet", "depth": 0, "text": "受非营利学术活动或艺术团体邀请，从事学术或纯艺术活动者" },
      { "kind": "bullet", "depth": 0, "text": "欲对韩国独有文化或艺术进行专业研究或接受专家指导者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người muốn thực hiện hoạt động học thuật hoặc nghệ thuật không nhằm mục đích lợi nhuận (bao gồm người muốn nghiên cứu chuyên sâu hoặc nhận sự hướng dẫn của chuyên gia về văn hoá, nghệ thuật đặc trưng của Hàn Quốc)" },
      { "kind": "bullet", "depth": 0, "text": "Người thực hiện hoạt động viết luận văn, sáng tác" },
      { "kind": "bullet", "depth": 0, "text": "Người tham gia hoạt động học thuật hoặc nghệ thuật thuần tuý theo lời mời của tổ chức học thuật, nghệ thuật phi lợi nhuận" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn nghiên cứu chuyên sâu hoặc nhận sự hướng dẫn của chuyên gia về văn hoá, nghệ thuật đặc trưng của Hàn Quốc" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放认定申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "邀请函" },
      { "kind": "bullet", "depth": 0, "text": "证明为文化艺术团体的文件" },
      { "kind": "bullet", "depth": 0, "text": "履历书或经历证明书" },
      { "kind": "bullet", "depth": 0, "text": "证明在停留期间所有费用支付能力的文件" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Thư mời" },
      { "kind": "bullet", "depth": 0, "text": "Giấy tờ chứng minh là tổ chức văn hoá nghệ thuật" },
      { "kind": "bullet", "depth": 0, "text": "Sơ yếu lý lịch hoặc giấy chứng nhận kinh nghiệm" },
      { "kind": "bullet", "depth": 0, "text": "Giấy tờ chứng minh khả năng chi trả toàn bộ chi phí trong thời gian lưu trú" }
    ]
  },
  "D-2": {
    "titleKo": "D-2 유학 비자 - 유학 및 어학연수",
    "titleEn": "D-2 Student - Study Abroad and Language Training",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 유학생: *교육기관에서 정규과정의 교육을 받거나 특정 연구를 하고자 하는 외국인으로서 유학(D-2) 및 어학연수(D-4-1, D-4-7)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "교육기관: 고등교육법 및 특별법에 따라 설립된 전문대학 이상의 교육기관이나 학술 연구기관으로서 법무부장관이 정하는 요건을 갖춘 대학 또는 부설 어학원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Educational institutions: Colleges and universities or academic research institutions established under the Higher Education Act and special laws, and universities or affiliated language schools that meet the requirements set by the Minister of Justice."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreign students: Foreigners who wish to study abroad (D-2) and language training (D-4-1, D-4-7) at the above institutions for full-time education or specific research."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-1 : 전문학사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-2 : 학사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-3 : 석사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-4 : 박사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-5 : 연구과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-6 : 교환학생"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-7 : 일-학습연계 유학"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-8 : 방문학생"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-1 : Diploma Program"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-2 : Bachelor's Program"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-3 : Master's Program"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-4 : Doctoral Program"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-5 : Research"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-6 : Exchange Students"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-7 : Work-Study Program"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-8 : Visiting Students"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비자 발급 필요서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급(인정) 신청서, 여권사본, 사진 1매 (6개월 이내 촬영 반명함판)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "교육기관 사업자등록증 (또는 고유번호증 사본)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준입학허가서 (대학 총장/학장 발행)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵진단서 (해당자에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류 (부모의 잔고증명 등을 제출한 경우에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최종학력 입증서류: 최종학력 입증서류는 원본 심사를 원칙"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정능력 입증서류: 1년간 등록금 및 체재비 상당하는 금액"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "베트남의 경우 은행에서 발행한 지급유보방식의 별도 유학경비 잔고 증명서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application for visa issuance (recognition), copy of passport, and one photograph (must be taken within 6 months)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Business license (or a copy of the unique number) of the institution"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Standardized admission letter (issued by the university president or dean)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Tuberculosis certificate (applicable only)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of family relationship (only in case of submission of parental balance certificate, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original and translated documents, including parents' English names."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of final education: In principle, the original documents will be reviewed."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of financial ability: an amount equivalent to one year's tuition and accommodation."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "In the case of Vietnam, a separate certificate of balance of study expenses issued by a bank in the form of a payment reservation."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 유학생: *교육기관에서 정규과정의 교육을 받거나 특정 연구를 하고자 하는 외국인으로서 유학(D-2) 및 어학연수(D-4-1, D-4-7)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "교육기관: 고등교육법 및 특별법에 따라 설립된 전문대학 이상의 교육기관이나 학술 연구기관으로서 법무부장관이 정하는 요건을 갖춘 대학 또는 부설 어학원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-1 : 전문학사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-2 : 학사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-3 : 석사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-4 : 박사과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-5 : 연구과정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-6 : 교환학생"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-7 : 일-학습연계 유학"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-2-8 : 방문학생"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비자 발급 필요서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급(인정) 신청서, 여권사본, 사진 1매 (6개월 이내 촬영 반명함판)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "교육기관 사업자등록증 (또는 고유번호증 사본)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준입학허가서 (대학 총장/학장 발행)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵진단서 (해당자에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류 (부모의 잔고증명 등을 제출한 경우에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최종학력 입증서류: 최종학력 입증서류는 원본 심사를 원칙"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정능력 입증서류: 1년간 등록금 및 체재비 상당하는 금액"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "베트남의 경우 은행에서 발행한 지급유보방식의 별도 유학경비 잔고 증명서"
      }
    ],
    "titleZh": "D-2 留学签证 - 留学及语言研修",
    "titleVi": "Visa D-2 Du học - Du học và đào tạo ngoại ngữ",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "外国留学生：在教育机构接受正规课程教育或进行特定研究的外国人，包括留学（D-2）及语言研修（D-4-1、D-4-7）" },
      { "kind": "bullet", "depth": 1, "text": "教育机构：依据《高等教育法》及特别法设立的专科大学以上教育机构或学术研究机构，符合法务部长官规定要件的大学或附属语学院" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Du học sinh nước ngoài: Người nước ngoài muốn theo học chính quy hoặc nghiên cứu chuyên biệt tại cơ sở giáo dục, bao gồm du học (D-2) và đào tạo ngoại ngữ (D-4-1, D-4-7)" },
      { "kind": "bullet", "depth": 1, "text": "Cơ sở giáo dục: Trường cao đẳng trở lên hoặc cơ quan nghiên cứu học thuật được thành lập theo Luật Giáo dục Đại học và luật đặc biệt, là trường đại học hoặc trung tâm ngoại ngữ trực thuộc đáp ứng các điều kiện do Bộ trưởng Tư pháp quy định" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "D-2-1：专科课程" },
      { "kind": "bullet", "depth": 0, "text": "D-2-2：本科课程" },
      { "kind": "bullet", "depth": 0, "text": "D-2-3：硕士课程" },
      { "kind": "bullet", "depth": 0, "text": "D-2-4：博士课程" },
      { "kind": "bullet", "depth": 0, "text": "D-2-5：研究课程" },
      { "kind": "bullet", "depth": 0, "text": "D-2-6：交换学生" },
      { "kind": "bullet", "depth": 0, "text": "D-2-7：工读结合留学" },
      { "kind": "bullet", "depth": 0, "text": "D-2-8：访问学生" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "D-2-1: Chương trình cao đẳng chuyên ngành" },
      { "kind": "bullet", "depth": 0, "text": "D-2-2: Chương trình cử nhân" },
      { "kind": "bullet", "depth": 0, "text": "D-2-3: Chương trình thạc sĩ" },
      { "kind": "bullet", "depth": 0, "text": "D-2-4: Chương trình tiến sĩ" },
      { "kind": "bullet", "depth": 0, "text": "D-2-5: Chương trình nghiên cứu" },
      { "kind": "bullet", "depth": 0, "text": "D-2-6: Sinh viên trao đổi" },
      { "kind": "bullet", "depth": 0, "text": "D-2-7: Du học vừa làm vừa học" },
      { "kind": "bullet", "depth": 0, "text": "D-2-8: Sinh viên thăm" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放所需材料" },
      { "kind": "bullet", "depth": 1, "text": "签证发放（认定）申请书、护照复印件、照片 1 张（半身照，6 个月内拍摄）" },
      { "kind": "bullet", "depth": 1, "text": "教育机构营业执照（或固有编号证副本）" },
      { "kind": "bullet", "depth": 1, "text": "标准入学许可书（大学校长/学长发行）" },
      { "kind": "bullet", "depth": 1, "text": "结核诊断书（仅限相关人员）" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明材料（仅限提交父母余额证明等情况）" },
      { "kind": "bullet", "depth": 1, "text": "最终学历证明材料：原则上以原件审核" },
      { "kind": "bullet", "depth": 1, "text": "财力证明材料：相当于 1 年学费及生活费的金额" },
      { "kind": "bullet", "depth": 1, "text": "越南情况下：由银行发行的留学经费余额支付保留证明" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cần thiết để cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực (giấy phép), bản sao hộ chiếu, 1 ảnh (chụp trong 6 tháng, kích cỡ bán thân)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy phép kinh doanh của cơ sở giáo dục (hoặc bản sao mã số định danh)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy phép nhập học chuẩn (do hiệu trưởng/chủ nhiệm khoa cấp)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chẩn đoán lao (chỉ áp dụng đối tượng liên quan)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh quan hệ gia đình (chỉ áp dụng khi nộp giấy chứng nhận số dư của cha mẹ, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng minh học vấn cao nhất: Nguyên tắc xét duyệt bản gốc" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng minh năng lực tài chính: Số tiền tương đương học phí và sinh hoạt phí 1 năm" },
      { "kind": "bullet", "depth": 1, "text": "Đối với Việt Nam: Giấy chứng nhận số dư phong toả riêng dành cho chi phí du học do ngân hàng cấp" }
    ]
  },
  "D-3": {
    "titleKo": "D-3 기술연수 비자 - 산업체 연수",
    "titleEn": "D-3 Technical Training - Industry Training",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기술연수 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Technical training visa"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum length of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 정하는 연수 조건을 갖춘 자로서 국내 산업체에서 연수를 받고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국환거래법에 의거하여 외국에 직접 투자한 산업체에서 연수를 받고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국에 기술을 수출하는 산업체에서 연수를 받고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대외무역법에 의거하여 외국에 산업설비를 수출하는 산업체에서 연수를 받고자 하는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who meet the training conditions prescribed by the Minister of Justice and wish to receive training at a domestic industrial company."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who wish to receive training at an industrial organization that has made a direct investment in a foreign country under the Foreign Exchange Transactions Act."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "An industrial company that exports technology to a foreign country and wishes to receive training at an industrial company recognized by the Minister of Justice as requiring technical training."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who wish to receive training at an industrial organization that exports industrial equipment to a foreign country under the Foreign Trade Act."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "연수기관 사업자등록증 (또는 고유번호증 사본)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "연수계획서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소관부처의 연수추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서 (해당 시)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form (Exhibit 34), passport, and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of local business license"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of the invitee's employment certificate and passport issued by the head of the local corporation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of Korean language proficiency"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Training plan to confirm the training contents"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Guarantee of the sponsor's identity"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents to prove that the sponsoring company is an authorized training company"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving the number of permanent domestic workers required to calculate the number of trainees."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Other documentation of the training environment, such as the availability of training facilities and adequate accommodations."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기술연수 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 정하는 연수 조건을 갖춘 자로서 국내 산업체에서 연수를 받고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국환거래법에 의거하여 외국에 직접 투자한 산업체에서 연수를 받고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국에 기술을 수출하는 산업체에서 연수를 받고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대외무역법에 의거하여 외국에 산업설비를 수출하는 산업체에서 연수를 받고자 하는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "연수기관 사업자등록증 (또는 고유번호증 사본)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "연수계획서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소관부처의 연수추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서 (해당 시)"
      }
    ],
    "titleZh": "D-3 技术研修签证 - 产业体研修",
    "titleVi": "Visa D-3 Đào tạo kỹ thuật - Đào tạo tại doanh nghiệp",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "技术研修签证" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thị thực đào tạo kỹ thuật" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "符合法务部长官规定研修条件，欲在韩国产业体接受研修者" },
      { "kind": "bullet", "depth": 0, "text": "依据《外汇交易法》在国外直接投资的产业体接受研修者" },
      { "kind": "bullet", "depth": 0, "text": "在向国外出口技术的产业体接受研修者" },
      { "kind": "bullet", "depth": 0, "text": "依据《对外贸易法》向国外出口工业设备的产业体接受研修者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người đáp ứng điều kiện đào tạo do Bộ trưởng Tư pháp quy định và muốn đào tạo tại doanh nghiệp Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn đào tạo tại doanh nghiệp đầu tư trực tiếp ở nước ngoài theo Luật Giao dịch Ngoại hối" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn đào tạo tại doanh nghiệp xuất khẩu công nghệ ra nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn đào tạo tại doanh nghiệp xuất khẩu thiết bị công nghiệp ra nước ngoài theo Luật Ngoại thương" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "研修机构营业执照（或固有编号证副本）" },
      { "kind": "bullet", "depth": 0, "text": "研修计划书" },
      { "kind": "bullet", "depth": 0, "text": "主管部门的研修推荐书" },
      { "kind": "bullet", "depth": 0, "text": "雇佣合同（如适用）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Giấy phép kinh doanh của cơ sở đào tạo (hoặc bản sao mã số định danh)" },
      { "kind": "bullet", "depth": 0, "text": "Kế hoạch đào tạo" },
      { "kind": "bullet", "depth": 0, "text": "Thư giới thiệu đào tạo của bộ chủ quản" },
      { "kind": "bullet", "depth": 0, "text": "Hợp đồng lao động (nếu có)" }
    ]
  },
  "D-4": {
    "titleKo": "D-4 일반연수 비자 - 어학연수 및 인턴십",
    "titleEn": "D-4 General Trainee, Korean Language Program - Language School/Internship",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유학(D-2) 자격에 해당하는 교육기관 또는 학술연구기관 외에 교육기관이나 기업체 단체 등에서 교육 또는 연수를 받거나 연구하는 활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Receiving education or training or conducting research at an institution or business organization other than an educational or academic research institution eligible for D-2 status"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대학부설 어학원에서 한국어를 연수하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유학(D-2) 자격에 해당하는 기관 또는 학술연구기관 이외의 교육기관에서 교육을 받는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국,공립 연구기관이나 연수원 등에서 기술, 기능 등을 연수하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인투자기업 또는 외국에 투자한 기업체 등에서 인턴(실습사원)으로 교육 또는 연수를 받거나 연구 활동에 종사하는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those studying Korean at a university-affiliated language school"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who receive education at institutions other than those eligible for study abroad (D-2) status or academic research institutions."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Training in technology, skills, etc. at national or public research institutes or training centers."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Receiving education or training as an intern (trainee) at a foreign-invested company or a company that has invested in a foreign country, or engaging in research activities."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "교육기관 사업자등록증 사본 또는 고유번호증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준입학허가서 (대학 총장/학장 발행)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재학증명서 또는 최종학력 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "원본 심사를 원칙으로 하며, 필요 시 사본에 담당자의 원본 대조필 확인 후 첨부"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재정 입증서류 (미화 10,000달러 상당)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정능력 입증서류 예시: 잔고증명서, 통장, 장학금증명서, 입출금내역서 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "원본 심사를 원칙으로 하며, 필요 시 사본에 담당자의 원본 대조필 확인 후 첨부"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "잔고증명서는 30일 이내 발급한 것만 유효"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "부모의 잔고증명서 제출 시 가족관계증명서 추가 제출 필요"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "1년간 (어학연수 6개월)의 재정능력 (등록금 + 체재비) 입증을 원칙"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "연수계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "강의시간표, 강사구성표, 연수시설 등 연수 관련 세부 내용 포함"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of the institution's business license or unique number card"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Standardized admission letter (issued by the university president or dean)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Certificate of enrollment or proof of final grades"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original documents are preferred, and copies must be checked by the person in charge and attached if necessary."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of finances (equivalent to $10,000 USD)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Examples of financial documents (bank statements, passbooks, scholarship certificates, bank statements, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "When submitting a parent's balance certificate, an additional family relationship certificate is required."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of financial capability (tuition + accommodation) for one year (6 months of study abroad)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Training plan (including class schedule, instructor organization, training facilities, etc.)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유학(D-2) 자격에 해당하는 교육기관 또는 학술연구기관 외에 교육기관이나 기업체 단체 등에서 교육 또는 연수를 받거나 연구하는 활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대학부설 어학원에서 한국어를 연수하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유학(D-2) 자격에 해당하는 기관 또는 학술연구기관 이외의 교육기관에서 교육을 받는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국,공립 연구기관이나 연수원 등에서 기술, 기능 등을 연수하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인투자기업 또는 외국에 투자한 기업체 등에서 인턴(실습사원)으로 교육 또는 연수를 받거나 연구 활동에 종사하는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "교육기관 사업자등록증 사본 또는 고유번호증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준입학허가서 (대학 총장/학장 발행)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재학증명서 또는 최종학력 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "원본 심사를 원칙으로 하며, 필요 시 사본에 담당자의 원본 대조필 확인 후 첨부"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재정 입증서류 (미화 10,000달러 상당)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정능력 입증서류 예시: 잔고증명서, 통장, 장학금증명서, 입출금내역서 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "원본 심사를 원칙으로 하며, 필요 시 사본에 담당자의 원본 대조필 확인 후 첨부"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "잔고증명서는 30일 이내 발급한 것만 유효"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "부모의 잔고증명서 제출 시 가족관계증명서 추가 제출 필요"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "1년간 (어학연수 6개월)의 재정능력 (등록금 + 체재비) 입증을 원칙"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "연수계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "강의시간표, 강사구성표, 연수시설 등 연수 관련 세부 내용 포함"
      }
    ],
    "titleZh": "D-4 一般研修签证 - 语言研修及实习",
    "titleVi": "Visa D-4 Đào tạo chung - Đào tạo ngoại ngữ và thực tập",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "在符合留学（D-2）资格的教育机构或学术研究机构以外的教育机构、企业、团体等接受教育、研修或开展研究活动" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Hoạt động nhận giáo dục, đào tạo hoặc nghiên cứu tại các cơ sở giáo dục, doanh nghiệp, tổ chức ngoài cơ sở giáo dục hoặc cơ quan nghiên cứu học thuật thuộc tư cách Du học (D-2)" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "在大学附属语学院学习韩语者" },
      { "kind": "bullet", "depth": 0, "text": "在符合留学（D-2）资格的机构或学术研究机构以外的教育机构接受教育者" },
      { "kind": "bullet", "depth": 0, "text": "在国、公立研究机构或培训院等研修技术、技能等的人员" },
      { "kind": "bullet", "depth": 0, "text": "以实习员工身份在外商投资企业或对外投资企业接受教育、研修或从事研究活动者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người học tiếng Hàn tại trung tâm ngoại ngữ trực thuộc đại học" },
      { "kind": "bullet", "depth": 0, "text": "Người được giáo dục tại các cơ sở giáo dục ngoài cơ quan thuộc tư cách Du học (D-2) hoặc cơ quan nghiên cứu học thuật" },
      { "kind": "bullet", "depth": 0, "text": "Người đào tạo kỹ thuật, kỹ năng tại các viện nghiên cứu hoặc trung tâm đào tạo công lập" },
      { "kind": "bullet", "depth": 0, "text": "Người tham gia đào tạo, nghiên cứu với tư cách thực tập sinh tại doanh nghiệp đầu tư nước ngoài hoặc doanh nghiệp đầu tư ra nước ngoài" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "教育机构营业执照副本或固有编号证副本" },
      { "kind": "bullet", "depth": 0, "text": "标准入学许可书（大学校长/学长发行）" },
      { "kind": "bullet", "depth": 0, "text": "在学证明或最终学历证明材料" },
      { "kind": "bullet", "depth": 1, "text": "原则上以原件审核，必要时副本由经办人确认与原件一致后附上" },
      { "kind": "bullet", "depth": 0, "text": "财力证明材料（相当于 10,000 美元）" },
      { "kind": "bullet", "depth": 1, "text": "财力证明材料示例：余额证明书、存折、奖学金证明、出入金明细等" },
      { "kind": "bullet", "depth": 1, "text": "原则上以原件审核，必要时副本由经办人确认与原件一致后附上" },
      { "kind": "bullet", "depth": 1, "text": "余额证明仅以 30 天内开具的为有效" },
      { "kind": "bullet", "depth": 1, "text": "提交父母余额证明时需附上家庭关系证明" },
      { "kind": "bullet", "depth": 1, "text": "原则上证明 1 年（语言研修 6 个月）的财力（学费 + 生活费）" },
      { "kind": "bullet", "depth": 0, "text": "研修计划书" },
      { "kind": "bullet", "depth": 1, "text": "包含课程表、讲师配置表、研修设施等研修相关详细内容" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Bản sao giấy phép kinh doanh hoặc bản sao mã số định danh của cơ sở giáo dục" },
      { "kind": "bullet", "depth": 0, "text": "Giấy phép nhập học chuẩn (do hiệu trưởng/chủ nhiệm khoa cấp)" },
      { "kind": "bullet", "depth": 0, "text": "Giấy xác nhận đang học hoặc giấy chứng minh học vấn cao nhất" },
      { "kind": "bullet", "depth": 1, "text": "Nguyên tắc xét duyệt bản gốc, trường hợp cần thiết bản sao phải có xác nhận đối chiếu với bản gốc của người phụ trách" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh tài chính (tương đương 10.000 USD)" },
      { "kind": "bullet", "depth": 1, "text": "Ví dụ giấy tờ chứng minh năng lực tài chính: giấy chứng nhận số dư, sổ tiết kiệm, chứng nhận học bổng, sao kê thu chi, v.v." },
      { "kind": "bullet", "depth": 1, "text": "Nguyên tắc xét duyệt bản gốc, trường hợp cần thiết bản sao phải có xác nhận đối chiếu với bản gốc của người phụ trách" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận số dư chỉ có hiệu lực khi được cấp trong vòng 30 ngày" },
      { "kind": "bullet", "depth": 1, "text": "Khi nộp giấy chứng nhận số dư của cha mẹ, cần nộp thêm giấy chứng nhận quan hệ gia đình" },
      { "kind": "bullet", "depth": 1, "text": "Nguyên tắc chứng minh năng lực tài chính (học phí + sinh hoạt phí) cho 1 năm (đào tạo ngoại ngữ: 6 tháng)" },
      { "kind": "bullet", "depth": 0, "text": "Kế hoạch đào tạo" },
      { "kind": "bullet", "depth": 1, "text": "Bao gồm thời khoá biểu, danh sách giảng viên, cơ sở đào tạo và các nội dung chi tiết liên quan đến đào tạo" }
    ]
  },
  "D-5": {
    "titleKo": "D-5 취재 비자 - 주재 특파원",
    "titleEn": "D-5 Journalism - Resident Correspondent",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "취재 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Interviewer visa"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum length of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 신문, 방송, 잡지, 기타 보도기관으로부터 파견되어 국내에 주재하면서 취재, 보도 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 보도기관과의 계약에 의하여 국내에서 주재하면서 취재,보도 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내에 지사나 지국이 이미 개설된 외국의 신문, 방송, 잡지, 기타 보도 기관으로부터 파견되어 국내에서 취재, 보도활동을 하는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons assigned by a foreign newspaper, broadcast, magazine, or other news organization to cover or report from Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who is stationed in Korea under a contract with a foreign news organization and conducts coverage or reporting activities."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A foreign newspaper, broadcasting, magazine, or other news organization that has already established a branch or bureau in Korea, and is dispatched to cover and report in Korea."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서(별지34호 서식), 여권 원본, 표준규격사진 1장, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견 명령서 또는 재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내지국.지사 설치허가증이나 국내 지국.지사 운영자금 도입실적 증빙 서류"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form (Exhibit 34), original passport, one standardized photograph, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Dispatch order or certificate of employment"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "License to establish a domestic branch or proof of performance in introducing operating funds to the domestic branch."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "취재 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 신문, 방송, 잡지, 기타 보도기관으로부터 파견되어 국내에 주재하면서 취재, 보도 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 보도기관과의 계약에 의하여 국내에서 주재하면서 취재,보도 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내에 지사나 지국이 이미 개설된 외국의 신문, 방송, 잡지, 기타 보도 기관으로부터 파견되어 국내에서 취재, 보도활동을 하는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서(별지34호 서식), 여권 원본, 표준규격사진 1장, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견 명령서 또는 재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내지국.지사 설치허가증이나 국내 지국.지사 운영자금 도입실적 증빙 서류"
      }
    ],
    "titleZh": "D-5 采访签证 - 常驻特派员",
    "titleVi": "Visa D-5 Đưa tin - Phóng viên thường trú",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "采访签证" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thị thực đưa tin" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "由外国报社、广播、杂志或其他报道机构派遣，常驻韩国进行采访、报道活动的人员" },
      { "kind": "bullet", "depth": 0, "text": "依据与外国报道机构的合同，常驻韩国进行采访、报道活动的人员" },
      { "kind": "bullet", "depth": 0, "text": "由已在韩国设立分支机构或分社的外国报社、广播、杂志或其他报道机构派遣，在韩国进行采访、报道活动的人员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người được báo, đài phát thanh, tạp chí hoặc cơ quan báo chí nước ngoài phái cử, thường trú tại Hàn Quốc để đưa tin, tác nghiệp" },
      { "kind": "bullet", "depth": 0, "text": "Người thường trú tại Hàn Quốc để đưa tin, tác nghiệp theo hợp đồng với cơ quan báo chí nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Người được phái cử bởi báo, đài phát thanh, tạp chí hoặc cơ quan báo chí nước ngoài đã có chi nhánh tại Hàn Quốc, để đưa tin, tác nghiệp tại Hàn Quốc" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "申请书（附件 34 号格式）、护照原件、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "派遣命令书或在职证明" },
      { "kind": "bullet", "depth": 0, "text": "国内分支机构、分社设立许可证，或国内分支、分社运营资金引入业绩证明材料" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn đăng ký (Mẫu phụ lục số 34), bản gốc hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Lệnh phái cử hoặc giấy chứng nhận đang công tác" },
      { "kind": "bullet", "depth": 0, "text": "Giấy phép thiết lập chi nhánh trong nước, hoặc giấy tờ chứng minh thành tích đưa vốn vận hành chi nhánh trong nước" }
    ]
  },
  "D-6": {
    "titleKo": "D-6 종교 비자 - 종교 활동",
    "titleEn": "D-6 Religious visas - Religious Activities",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "종교비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Religious visas"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Upper limit on the length of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 종교단체 또는 사회복지단체로부터 국내에 등록된 지부에 파견되어 근무하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 종교단체 또는 사회복지단체로부터 파견되어 국내 유관 종교 단체에서 종교 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소속 종교단체가 운영하는 의료, 교육, 구호단체 등으로부터 초청되어 선교 또는 사회복지 활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 종교단체의 추천을 받아 그 종교단체에서 수도, 수련, 연구 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 종교단체 또는 사회복지단체로부터 초청되어 사회복지 활동에만 종사하는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who is seconded by a foreign religious or social welfare organization to work in its registered branch in Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons sent by a foreign religious or social welfare organization to perform religious activities in a related religious organization in Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Invited by a medical, educational, or relief organization run by a religious organization to engage in missionary or social work activities."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who are recommended by a domestic religious organization and engage in religious study, training, or research activities at that organization."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Invited by a domestic religious organization or social welfare organization to engage in social welfare activities."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서 (별지34호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "여권 원본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준규격사진 1장"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "종교단체 설립 허가서 또는 사회복지단체 설립 허가서 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소속 단체의 체류경비 지원 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "초청사유서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견명령서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고유번호증 사본"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form (Exhibit 34), original passport, one standard-sized photograph, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of your religious organization's establishment permit or social welfare organization's establishment permit"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to the organization's support for travel expenses"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Letter of invitation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Dispatch order"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of the unique number"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to support for your organization's expenses"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "종교비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 종교단체 또는 사회복지단체로부터 국내에 등록된 지부에 파견되어 근무하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 종교단체 또는 사회복지단체로부터 파견되어 국내 유관 종교 단체에서 종교 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소속 종교단체가 운영하는 의료, 교육, 구호단체 등으로부터 초청되어 선교 또는 사회복지 활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 종교단체의 추천을 받아 그 종교단체에서 수도, 수련, 연구 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 종교단체 또는 사회복지단체로부터 초청되어 사회복지 활동에만 종사하는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "신청서 (별지34호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "여권 원본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준규격사진 1장"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "종교단체 설립 허가서 또는 사회복지단체 설립 허가서 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소속 단체의 체류경비 지원 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "초청사유서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견명령서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고유번호증 사본"
      }
    ],
    "titleZh": "D-6 宗教签证 - 宗教活动",
    "titleVi": "Visa D-6 Tôn giáo - Hoạt động tôn giáo",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "宗教签证" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thị thực tôn giáo" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "由外国宗教团体或社会福利团体派遣，在国内已登记分支机构工作的人员" },
      { "kind": "bullet", "depth": 0, "text": "由外国宗教团体或社会福利团体派遣，在国内相关宗教团体从事宗教活动的人员" },
      { "kind": "bullet", "depth": 0, "text": "受所属宗教团体运营的医疗、教育、救济等机构邀请，从事传教或社会福利活动者" },
      { "kind": "bullet", "depth": 0, "text": "经国内宗教团体推荐，在该宗教团体从事修道、修行、研究活动者" },
      { "kind": "bullet", "depth": 0, "text": "受国内宗教团体或社会福利团体邀请，仅从事社会福利活动者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người được tổ chức tôn giáo hoặc tổ chức phúc lợi xã hội nước ngoài cử đến làm việc tại chi nhánh đã đăng ký trong nước" },
      { "kind": "bullet", "depth": 0, "text": "Người được tổ chức tôn giáo hoặc tổ chức phúc lợi xã hội nước ngoài cử đến để hoạt động tôn giáo tại tổ chức tôn giáo liên quan trong nước" },
      { "kind": "bullet", "depth": 0, "text": "Người được mời bởi các tổ chức y tế, giáo dục, cứu trợ do tổ chức tôn giáo trực thuộc vận hành để tham gia hoạt động truyền giáo hoặc phúc lợi xã hội" },
      { "kind": "bullet", "depth": 0, "text": "Người được tổ chức tôn giáo trong nước giới thiệu, tham gia tu hành, tu luyện, nghiên cứu tại tổ chức tôn giáo đó" },
      { "kind": "bullet", "depth": 0, "text": "Người được tổ chức tôn giáo hoặc tổ chức phúc lợi xã hội trong nước mời, chỉ tham gia hoạt động phúc lợi xã hội" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "申请书（附件 34 号格式）" },
      { "kind": "bullet", "depth": 0, "text": "护照原件" },
      { "kind": "bullet", "depth": 0, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "手续费" },
      { "kind": "bullet", "depth": 0, "text": "宗教团体设立许可证或社会福利团体设立许可证副本" },
      { "kind": "bullet", "depth": 0, "text": "所属团体的停留费用支持相关材料" },
      { "kind": "bullet", "depth": 0, "text": "邀请理由书" },
      { "kind": "bullet", "depth": 0, "text": "派遣命令书" },
      { "kind": "bullet", "depth": 0, "text": "固有编号证副本" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn đăng ký (Mẫu phụ lục số 34)" },
      { "kind": "bullet", "depth": 0, "text": "Bản gốc hộ chiếu" },
      { "kind": "bullet", "depth": 0, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Bản sao giấy phép thành lập tổ chức tôn giáo hoặc tổ chức phúc lợi xã hội" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến việc tổ chức trực thuộc hỗ trợ chi phí lưu trú" },
      { "kind": "bullet", "depth": 0, "text": "Lý do mời" },
      { "kind": "bullet", "depth": 0, "text": "Lệnh phái cử" },
      { "kind": "bullet", "depth": 0, "text": "Bản sao mã số định danh" }
    ]
  },
  "D-7": {
    "titleKo": "D-7 주재 비자 - 주재원(파견 근무)",
    "titleEn": "D-7 Resident - Expatriate Activities",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국기업 국내지사 등에서 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외진출 기업 근무 외국인력 국내 본사 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 3년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Expatriate activities in domestic branches of foreign companies"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Working for a company that has expanded overseas"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Working at a domestic headquarters of a foreign company"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 3 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 공공기관, 단체 또는 회사의 본사, 지사, 기타 사업소 등에서 1년 이상 근무한 자로서 대한민국에 있는 그 계열회사, 자회사, 지점 또는 사무소 등에 필수전문인력으로 파견되어 근무하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상장법인(코스닥상장법인 포함, 이하같음) 또는 공공기관이 설립한 해외 현지법인이나 해외지점에서 1년 이상 근무한 자로서 대한민국에 있는 그 본사나 본점에 파견되어 전문적인 지식ᆞ기술 또는 기능을 제공 하거나 전수받으려는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who have worked at the headquarters, branches, or other business offices of a public institution, organization, or company in a foreign country for more than one year and intend to be dispatched to its affiliates, subsidiaries, branches, or offices in Korea as essential specialized personnel."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who have worked for more than one year in a local subsidiary or overseas branch established by a publicly traded company (including KOSDAQ-listed companies, as follows) or a public institution, and who intend to provide or transfer specialized knowledge, skills, or functions to the headquarters or main office of the company in Korea."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국기업 국내 지사 등에서 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급 신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국 소재 회사 등 재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "파견 명령서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내지점 등 설치 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자사 또는 연락사무소가 정상적으로 운영되고 있음을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필수전무인력임을 입증하는 서류 (이력서, 경력증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외진출 기업 근무 외국인력 국내 본사 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급 신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필수전문인력임을 입증하는 서류 (이력서, 경력증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "본사의 등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외직접투자신고수리서 또는 해외지점설치신고수리서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외 송금확인 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외지사의 법인등기사항전부증명서 또는 사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외지사에서의 재직증명서 및 납세사실증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인사명령서 (파견기간 명시)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Working in a domestic branch of a foreign company, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standardized photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Certificate of employment at a foreign company, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Dispatch order"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of establishment of domestic branch, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving that the company or liaison office is operating normally"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving that you are an essential full-time employee (resume, career certificate, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreigners working in overseas companies and residing in domestic headquarters"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa issuance application, passport, one standardized photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving that you are an essential professional (resume, certificate of education, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Certificate of all registered items of the head office"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Overseas direct investment notification certificate or overseas branch establishment notification certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of overseas remittance"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Certificate of full corporate registration or business license of overseas branch office"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of employment at the overseas branch and proof of tax payment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Personnel order: The period of dispatch must be specified"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국기업 국내지사 등에서 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외진출 기업 근무 외국인력 국내 본사 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 3년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 공공기관, 단체 또는 회사의 본사, 지사, 기타 사업소 등에서 1년 이상 근무한 자로서 대한민국에 있는 그 계열회사, 자회사, 지점 또는 사무소 등에 필수전문인력으로 파견되어 근무하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상장법인(코스닥상장법인 포함, 이하같음) 또는 공공기관이 설립한 해외 현지법인이나 해외지점에서 1년 이상 근무한 자로서 대한민국에 있는 그 본사나 본점에 파견되어 전문적인 지식ᆞ기술 또는 기능을 제공 하거나 전수받으려는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국기업 국내 지사 등에서 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급 신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국 소재 회사 등 재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "파견 명령서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내지점 등 설치 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자사 또는 연락사무소가 정상적으로 운영되고 있음을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필수전무인력임을 입증하는 서류 (이력서, 경력증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외진출 기업 근무 외국인력 국내 본사 주재활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급 신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필수전문인력임을 입증하는 서류 (이력서, 경력증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "본사의 등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외직접투자신고수리서 또는 해외지점설치신고수리서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외 송금확인 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외지사의 법인등기사항전부증명서 또는 사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외지사에서의 재직증명서 및 납세사실증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인사명령서 (파견기간 명시)"
      }
    ],
    "titleZh": "D-7 驻在签证 - 驻韩员工（外派工作）",
    "titleVi": "Visa D-7 Phái cử nội bộ - Nhân viên thường trú (Phái cử công tác)",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "在外国企业的韩国分支机构等开展驻在活动" },
      { "kind": "bullet", "depth": 0, "text": "在海外拓展企业工作的外籍人员在韩国总部开展驻在活动" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：3 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Hoạt động phái cử tại chi nhánh trong nước của doanh nghiệp nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Nhân lực nước ngoài đang làm việc tại doanh nghiệp mở rộng ra nước ngoài thực hiện hoạt động phái cử tại trụ sở chính trong nước" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 3 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "在外国公共机构、团体或公司的总公司、分公司或其他营业所等工作满 1 年以上，欲被派遣到位于韩国的关联公司、子公司、分支机构或办事处作为必要专业人员工作的人员" },
      { "kind": "bullet", "depth": 0, "text": "在上市法人（含 KOSDAQ 上市法人，下同）或公共机构设立的海外当地法人或海外分支机构工作满 1 年以上，欲被派遣到位于韩国的总公司或总部，提供或接受专业知识、技术或技能的人员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người đã làm việc tại trụ sở chính, chi nhánh hoặc các văn phòng kinh doanh khác của cơ quan công, tổ chức hoặc công ty nước ngoài từ 1 năm trở lên, được phái cử đến công ty liên kết, công ty con, chi nhánh hoặc văn phòng tại Hàn Quốc với tư cách nhân lực chuyên môn cốt lõi" },
      { "kind": "bullet", "depth": 0, "text": "Người đã làm việc từ 1 năm trở lên tại pháp nhân nước ngoài hoặc chi nhánh nước ngoài do pháp nhân niêm yết (bao gồm pháp nhân niêm yết KOSDAQ) hoặc cơ quan công lập thành lập, được phái cử đến trụ sở chính tại Hàn Quốc để cung cấp hoặc tiếp nhận kiến thức, kỹ thuật hoặc kỹ năng chuyên môn" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "在外国企业的韩国分支机构等开展驻在活动" },
      { "kind": "bullet", "depth": 1, "text": "签证发放申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 1, "text": "外国公司等的在职证明" },
      { "kind": "bullet", "depth": 1, "text": "派遣命令书" },
      { "kind": "bullet", "depth": 1, "text": "国内分支机构等设立证明材料" },
      { "kind": "bullet", "depth": 1, "text": "证明本公司或联络办事处正常运营的文件" },
      { "kind": "bullet", "depth": 1, "text": "证明为必要专业人员的文件（履历书、经历证明书等）" },
      { "kind": "bullet", "depth": 0, "text": "在海外拓展企业工作的外籍人员在韩国总部开展驻在活动" },
      { "kind": "bullet", "depth": 1, "text": "签证发放申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 1, "text": "证明为必要专业人员的文件（履历书、经历证明书等）" },
      { "kind": "bullet", "depth": 1, "text": "总公司的法人登记事项全部证明" },
      { "kind": "bullet", "depth": 1, "text": "海外直接投资申报受理书或海外分支机构设立申报受理书" },
      { "kind": "bullet", "depth": 1, "text": "海外汇款确认证明材料" },
      { "kind": "bullet", "depth": 1, "text": "海外分支机构的法人登记事项全部证明或营业执照" },
      { "kind": "bullet", "depth": 1, "text": "海外分支机构的在职证明及纳税事实证明" },
      { "kind": "bullet", "depth": 1, "text": "人事命令书（注明派遣期间）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hoạt động phái cử tại chi nhánh trong nước của doanh nghiệp nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang công tác tại công ty ở nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Lệnh phái cử" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh việc thiết lập chi nhánh trong nước" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh công ty hoặc văn phòng liên lạc đang hoạt động bình thường" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh là nhân lực chuyên môn cốt lõi (sơ yếu lý lịch, giấy chứng nhận kinh nghiệm, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "Nhân lực nước ngoài đang làm việc tại doanh nghiệp mở rộng ra nước ngoài thực hiện hoạt động phái cử tại trụ sở chính trong nước" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh là nhân lực chuyên môn cốt lõi (sơ yếu lý lịch, giấy chứng nhận kinh nghiệm, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận tất cả các mục đăng ký pháp nhân của trụ sở chính" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tiếp nhận khai báo đầu tư trực tiếp ra nước ngoài hoặc giấy tiếp nhận khai báo thành lập chi nhánh ở nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh đã chuyển tiền ra nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận tất cả các mục đăng ký pháp nhân hoặc giấy phép kinh doanh của chi nhánh ở nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang công tác tại chi nhánh ở nước ngoài và giấy chứng nhận đã nộp thuế" },
      { "kind": "bullet", "depth": 1, "text": "Lệnh nhân sự (ghi rõ thời gian phái cử)" }
    ]
  },
  "D-8": {
    "titleKo": "D-8 기업투자 비자 - 투자 및 창업",
    "titleEn": "D-8 Treaty Investors - Investment & Startup",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비자 유형: D-8 (투자 및 창업 비자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-1: 법인에 투자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-2: 벤처 투자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-3: 개인기업에 투자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-4: 기술 창업"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-1, D-8-3에 해당하는 경우: 5년"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-2, D-8-4에 해당하는 경우: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-1: Investing in Corporations"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-2: Investing in Ventures"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-3: Investing in Sole Proprietorships"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-4: Technology start-ups"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "5 years for \"D-8-1, D-8-3\""
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "2 years for \"D-8-2\" and \"D-8-4"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-1: 외국인투자촉진법에 따른 외국인투자기업 대한민국 법인의 경영, 관리 또는 생산, 기술 분야에 종사하려는 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자대상이 대한민국 법인이어야 함"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자금액 1억원 이상, 의결권 있는 주식 총수의 10% 이상 소유"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자자금은 본인 명의가 원칙, 배우자 및 미성년 자녀명의 반입 및 대리송급은 예외적으로 인정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-2: 벤처기업 육성법에 따라 설립된 벤처기업의 대표자 또는 기술력이 우수한 기업의 대표자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "요건: 지식재산권을 보유한 벤처기업 설립자 또는 기술성이 우수한 기업 대표자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-3: 외국인투자촉진법에 따른 외국인투자기업인 대한민국 국민이 경영하는 기업의 경영, 관리 또는 생산기술 분야에 종사하려는 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자대상은 대한민국 국민이 경영하는 기업이어야 함"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자금액 1억원 이상, 출자총액의 10% 이상 소유"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "공동대표로 등재되어야 함"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증상 한국인과 공동대표로 등재됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-4: 국내 또는 국외에서 학사 이상의 학위를 취득한 사람 중 지식재산권을 보유하거나 이에 준하는 기술력 등을 가진 법인 창업자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "요건: 전문학사 이상의 학위를 취득한 사람, 또는 지식재산권 보유 또는 기술력 있는 창업자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-1: Essential professionals who intend to engage in the management, administration, or production and technology of a foreign-invested Korean corporation under the Foreign Investment Promotion Act."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Basic requirements"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "The investment target must be a Korean corporation"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "The investment amount is 100 million won or more, and the investor owns at least one-tenth of the total number of voting shares of the invested corporation or owns shares of the corporation and signs an executive dispatch or appointment contract *In principle, the investment amount must be in the name of the investor, but exceptions are allowed for spouses and minor children."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-2: A person who has established a venture company pursuant to subparagraph 2, paragraph 1, item 2 of Article 2 of the Act on Special Measures to Promote Venture Companies with Excellent Technology, including possession of intellectual property rights, or a representative of a company that has been certified as a venture company pursuant to Article 25 of the same Act, or a representative of a company that has been evaluated as having excellent technology."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-3: Essential specialized personnel who intend to engage in business management or production technology in companies managed by Korean nationals (individuals) that are foreign-invested enterprises under the Foreign Investment Promotion Act (hereinafter referred to as \"investment in private companies (D-8-3)\") * Excluding those recruited in Korea"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "The investment target must be a company managed by a Korean national."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "The investment amount must be 100 million won or more, and the investor must own at least one-tenth of the total capital of the invested company and be listed as a co-president with a Korean national on the business registration certificate * The investment amount must be in the name of the investor, but exceptions are allowed for spouses and minor children."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "The business capital of the Korean co-owner must be at least 100 million won."
      }
    ],
    "requirementsKo": [
      {
        "kind": "heading",
        "depth": 0,
        "text": "1. D-8-1: 외국인투자기업 경영, 관리, 생산, 기술 분야 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "파견명령서 (파견기간 명시)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자기업등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법인등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주주변동상황명세서 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "투자자금 도입 관련 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "투자금액 3억원 미만 개인투자자에 대한 추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자본금 사용 내역 입증 서류 (물품구매 영수증, 사무실 인테리어 비용, 국내은행 계좌 입출금 내역서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업장 존재 입증 서류 (사무실 임대차 계약서, 사업장 전경, 사무공간, 간판 사진 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 업종 또는 분야의 사업 경험 관련 국적국 서류 (필요시 제출)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "2. D-8-2: 벤처기업 대표자 또는 기술성 우수 기업 대표자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법인등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "벤처기업확인서 또는 예비벤처기업확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "지식재산권을 보유하는 등 기술력을 입증하는 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "특허증, 실용신안등록증, 디자인등록증, 상표등록증, 저작권등록증 등 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "기술신용보증기금 또는 중소기업진흥공단의 기술성 우수평가서"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "3. D-8-3: 외국인투자기업의 경영, 관리 또는 생산기술 분야 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자기업등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공동사업자인 국민의 사업자금(사용 내역) 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공동사업자가 표시된 사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공동사업자 약정서 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "투자자금 도입 관련 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "투자금액 3억원 미만 개인투자자에 대한 추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자본금 사용 내역 입증 서류 (물품구매 영수증, 사무실 인테리어 비용, 국내은행 계좌 입출금 내역서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업장 존재 입증 서류 (사무실 임대차 계약서, 사업장 전경, 사무공간, 간판 사진 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 업종 또는 분야의 사업 경험 관련 국적국 서류 (필요시 제출)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "4. D-8-4: 법인 창업자 (지식재산권 보유 또는 기술력 있는 창업자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법인등기사항전부증명서 및 사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위증명서 사본 또는 관계 중앙행정기관의 장의 추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 적용 대상자 제출 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "지식재산권 보유자는 특허증, 실용신안등록증, 디자인등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "OECD 국가 지식재산권 보유(등록)자는 그 사실을 입증할 수 있는 서류 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특허 등 출원자는 특허청장 발행 출원사실증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법무부장관이 지정한 '글로벌창업이민센터'의 장이 발급한 창업이민종합지원시스템(OASIS) 해당 항목 이수(수료, 졸업) 증서, 입상확인서, 선정공문 등 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기타 점수제 해당 항목 등 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 적용 면제 대상자(기술창업 특례 대상자) 제출서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "K-Startup 그랜드 챌린지 참여자: 기본 제출 서류 + 중기부 발행 그랜드챌린지 참여 확인서, 중기부장관 추천 공문"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "정부 창업지원사업 수혜자:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 제출서류 + 중기부장관 추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "스타트업코리아 특별비자:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 제출서류 + 중기부장관 추천서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-1"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance application, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "In case of expatriate activities, dispatch order (specifying the period of dispatch) and certificate of employment"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of foreign investment company registration certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of business license, full certificate of incorporation, and original statement of shareholder changes"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of investment fund introduction"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Additional documents for individual investors with an investment amount of less than 300 million won"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of capital utilization (receipts for purchase of goods, office interior costs, domestic bank statements, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving the existence of the business location (office lease agreement, photos of the business location, office space, signage, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documentation from the Bureau of Nationality regarding business experience in your industry or field (if necessary)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-2"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance application, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of business license, full certificate of incorporation"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Venture company certificate or preliminary venture company certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving that you have excellent technical skills, such as intellectual property rights."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of patent certificate (KIPO), utility model registration (KIPO), design registration (KIPO), trademark registration (KIPO), copyright registration (KIPO), etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of technical excellence from the Technology Credit Guarantee Fund or Small and Medium Business Corporation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-3"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for issuance of visa, passport, and one standardized photograph Fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of foreign investment company registration certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of business funds (usage history) of the national who is a co-business partner"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A copy of the business license indicating the joint venturer An original copy of the joint venture agreement"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of investment fund introduction"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Additional documents for individual investors with an investment amount of less than 300 million won"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of capital usage (receipts for goods, office interior costs, domestic bank account deposit and withdrawal statements, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving the existence of the business location (office lease agreement, photos of the business location, office space, signage, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documentation from the Bureau of Nationality regarding business experience in your industry or field (if necessary)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-4: Corporate Founder (Founder with Intellectual Property Rights or Technical Expertise)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Basic Documents:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Visa application form"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Passport"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Standard passport-size photo (1)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Fee"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Certificate of Corporate Registration and a copy of the business registration certificate"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Copy of degree certificate or recommendation letter from the head of a relevant central government agency"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents for Applicants Subject to the Points System:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "For holders of intellectual property rights: Copies of patent certificates, utility model registration certificates, or design registration certificates"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "For holders of intellectual property rights registered in OECD countries: Copies of documents proving this fact"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "For applicants with pending patents: Certificate of application issued by the Korea Intellectual Property Office (KIPO)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving completion (or graduation) of the \"Entrepreneur Immigration Comprehensive Support System (OASIS)\" issued by the head of the 'Global Startup Immigration Center' designated by the Minister of Justice, including awards, confirmation letters, and selection letters"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Other supporting documents for the points system criteria"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Exemptions from the Points System (Special Case for Technology Startups):"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "For K-Startup Grand Challenge Participants:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Basic documents + Confirmation letter of participation in the Grand Challenge issued by the Ministry of SMEs and Startups (MSS) and a recommendation letter from the Minister of MSS"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "For Recipients of Government Startup Support Programs:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Basic documents + Recommendation letter from the Minister of SMEs and Startups (MSS)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "For Startup Korea Special Visa:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Basic documents + Recommendation letter from the Minister of SMEs and Startups (MSS)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비자 유형: D-8 (투자 및 창업 비자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-1: 법인에 투자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-2: 벤처 투자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-3: 개인기업에 투자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-4: 기술 창업"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-1, D-8-3에 해당하는 경우: 5년"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "D-8-2, D-8-4에 해당하는 경우: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-1: 외국인투자촉진법에 따른 외국인투자기업 대한민국 법인의 경영, 관리 또는 생산, 기술 분야에 종사하려는 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자대상이 대한민국 법인이어야 함"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자금액 1억원 이상, 의결권 있는 주식 총수의 10% 이상 소유"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자자금은 본인 명의가 원칙, 배우자 및 미성년 자녀명의 반입 및 대리송급은 예외적으로 인정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-2: 벤처기업 육성법에 따라 설립된 벤처기업의 대표자 또는 기술력이 우수한 기업의 대표자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "요건: 지식재산권을 보유한 벤처기업 설립자 또는 기술성이 우수한 기업 대표자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-3: 외국인투자촉진법에 따른 외국인투자기업인 대한민국 국민이 경영하는 기업의 경영, 관리 또는 생산기술 분야에 종사하려는 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자대상은 대한민국 국민이 경영하는 기업이어야 함"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자금액 1억원 이상, 출자총액의 10% 이상 소유"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "공동대표로 등재되어야 함"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증상 한국인과 공동대표로 등재됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-8-4: 국내 또는 국외에서 학사 이상의 학위를 취득한 사람 중 지식재산권을 보유하거나 이에 준하는 기술력 등을 가진 법인 창업자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "요건: 전문학사 이상의 학위를 취득한 사람, 또는 지식재산권 보유 또는 기술력 있는 창업자"
      }
    ],
    "requirements": [
      {
        "kind": "heading",
        "depth": 0,
        "text": "1. D-8-1: 외국인투자기업 경영, 관리, 생산, 기술 분야 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "파견명령서 (파견기간 명시)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자기업등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법인등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주주변동상황명세서 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "투자자금 도입 관련 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "투자금액 3억원 미만 개인투자자에 대한 추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자본금 사용 내역 입증 서류 (물품구매 영수증, 사무실 인테리어 비용, 국내은행 계좌 입출금 내역서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업장 존재 입증 서류 (사무실 임대차 계약서, 사업장 전경, 사무공간, 간판 사진 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 업종 또는 분야의 사업 경험 관련 국적국 서류 (필요시 제출)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "2. D-8-2: 벤처기업 대표자 또는 기술성 우수 기업 대표자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법인등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "벤처기업확인서 또는 예비벤처기업확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "지식재산권을 보유하는 등 기술력을 입증하는 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "특허증, 실용신안등록증, 디자인등록증, 상표등록증, 저작권등록증 등 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "기술신용보증기금 또는 중소기업진흥공단의 기술성 우수평가서"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "3. D-8-3: 외국인투자기업의 경영, 관리 또는 생산기술 분야 필수 전문인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자기업등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공동사업자인 국민의 사업자금(사용 내역) 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공동사업자가 표시된 사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공동사업자 약정서 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "투자자금 도입 관련 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "투자금액 3억원 미만 개인투자자에 대한 추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자본금 사용 내역 입증 서류 (물품구매 영수증, 사무실 인테리어 비용, 국내은행 계좌 입출금 내역서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업장 존재 입증 서류 (사무실 임대차 계약서, 사업장 전경, 사무공간, 간판 사진 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 업종 또는 분야의 사업 경험 관련 국적국 서류 (필요시 제출)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "4. D-8-4: 법인 창업자 (지식재산권 보유 또는 기술력 있는 창업자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법인등기사항전부증명서 및 사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위증명서 사본 또는 관계 중앙행정기관의 장의 추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 적용 대상자 제출 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "지식재산권 보유자는 특허증, 실용신안등록증, 디자인등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "OECD 국가 지식재산권 보유(등록)자는 그 사실을 입증할 수 있는 서류 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특허 등 출원자는 특허청장 발행 출원사실증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법무부장관이 지정한 '글로벌창업이민센터'의 장이 발급한 창업이민종합지원시스템(OASIS) 해당 항목 이수(수료, 졸업) 증서, 입상확인서, 선정공문 등 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기타 점수제 해당 항목 등 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 적용 면제 대상자(기술창업 특례 대상자) 제출서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "K-Startup 그랜드 챌린지 참여자: 기본 제출 서류 + 중기부 발행 그랜드챌린지 참여 확인서, 중기부장관 추천 공문"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "정부 창업지원사업 수혜자:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 제출서류 + 중기부장관 추천서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "스타트업코리아 특별비자:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 제출서류 + 중기부장관 추천서"
      }
    ],
    "titleZh": "D-8 企业投资签证 - 投资及创业",
    "titleVi": "Visa D-8 Đầu tư doanh nghiệp - Đầu tư và khởi nghiệp",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "签证类型：D-8（投资及创业签证）" },
      { "kind": "bullet", "depth": 1, "text": "D-8-1：法人投资" },
      { "kind": "bullet", "depth": 1, "text": "D-8-2：风险投资" },
      { "kind": "bullet", "depth": 1, "text": "D-8-3：个人企业投资" },
      { "kind": "bullet", "depth": 1, "text": "D-8-4：技术创业" },
      { "kind": "bullet", "depth": 0, "text": "停留期限上限：" },
      { "kind": "bullet", "depth": 1, "text": "D-8-1、D-8-3：5 年" },
      { "kind": "bullet", "depth": 1, "text": "D-8-2、D-8-4：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Loại thị thực: D-8 (Thị thực đầu tư và khởi nghiệp)" },
      { "kind": "bullet", "depth": 1, "text": "D-8-1: Đầu tư vào pháp nhân" },
      { "kind": "bullet", "depth": 1, "text": "D-8-2: Đầu tư mạo hiểm" },
      { "kind": "bullet", "depth": 1, "text": "D-8-3: Đầu tư vào doanh nghiệp cá nhân" },
      { "kind": "bullet", "depth": 1, "text": "D-8-4: Khởi nghiệp công nghệ" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa:" },
      { "kind": "bullet", "depth": 1, "text": "D-8-1, D-8-3: 5 năm" },
      { "kind": "bullet", "depth": 1, "text": "D-8-2, D-8-4: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "D-8-1：依据《外国人投资促进法》在外商投资企业的韩国法人从事经营、管理或生产、技术领域工作的必要专业人员" },
      { "kind": "bullet", "depth": 1, "text": "基本要件：" },
      { "kind": "bullet", "depth": 2, "text": "投资对象须为韩国法人" },
      { "kind": "bullet", "depth": 2, "text": "投资金额 1 亿韩元以上，持有有表决权股份总数的 10% 以上" },
      { "kind": "bullet", "depth": 2, "text": "投资资金原则上以本人名义为准，例外情况下可接受配偶及未成年子女名义引入和代理汇款" },
      { "kind": "bullet", "depth": 0, "text": "D-8-2：依据《风险企业培育法》设立的风险企业代表人，或技术力优秀企业的代表人" },
      { "kind": "bullet", "depth": 1, "text": "要件：拥有知识产权的风险企业创立者，或技术性优秀的企业代表人" },
      { "kind": "bullet", "depth": 0, "text": "D-8-3：在依据《外国人投资促进法》成立的外商投资企业中，由韩国国民经营的企业从事经营、管理或生产技术领域的必要专业人员" },
      { "kind": "bullet", "depth": 1, "text": "基本要件：" },
      { "kind": "bullet", "depth": 2, "text": "投资对象须为韩国国民经营的企业" },
      { "kind": "bullet", "depth": 2, "text": "投资金额 1 亿韩元以上，持有出资总额的 10% 以上" },
      { "kind": "bullet", "depth": 2, "text": "须登记为共同代表" },
      { "kind": "bullet", "depth": 2, "text": "在营业执照上与韩国人共同登记为共同代表" },
      { "kind": "bullet", "depth": 0, "text": "D-8-4：在国内或国外取得本科以上学位者中，拥有知识产权或具备相应技术力的法人创业者" },
      { "kind": "bullet", "depth": 1, "text": "要件：取得专科以上学位者，或拥有知识产权或技术力的创业者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "D-8-1: Nhân lực chuyên môn cốt lõi muốn tham gia vào lĩnh vực kinh doanh, quản lý hoặc sản xuất, kỹ thuật của pháp nhân Hàn Quốc thuộc doanh nghiệp đầu tư nước ngoài theo Luật Khuyến khích Đầu tư Nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Điều kiện cơ bản:" },
      { "kind": "bullet", "depth": 2, "text": "Đối tượng đầu tư phải là pháp nhân Hàn Quốc" },
      { "kind": "bullet", "depth": 2, "text": "Số tiền đầu tư từ 100 triệu KRW trở lên, sở hữu từ 10% tổng số cổ phần có quyền biểu quyết trở lên" },
      { "kind": "bullet", "depth": 2, "text": "Vốn đầu tư về nguyên tắc đứng tên người đầu tư; trường hợp ngoại lệ chấp nhận đứng tên vợ/chồng và con chưa thành niên cũng như chuyển khoản thay" },
      { "kind": "bullet", "depth": 0, "text": "D-8-2: Người đại diện doanh nghiệp khởi nghiệp được thành lập theo Luật Khuyến khích Doanh nghiệp Khởi nghiệp, hoặc người đại diện doanh nghiệp có năng lực kỹ thuật xuất sắc" },
      { "kind": "bullet", "depth": 1, "text": "Điều kiện: Người sáng lập doanh nghiệp khởi nghiệp sở hữu quyền sở hữu trí tuệ, hoặc người đại diện doanh nghiệp có tính kỹ thuật xuất sắc" },
      { "kind": "bullet", "depth": 0, "text": "D-8-3: Nhân lực chuyên môn cốt lõi muốn tham gia vào lĩnh vực kinh doanh, quản lý hoặc kỹ thuật sản xuất của doanh nghiệp do công dân Hàn Quốc điều hành, là doanh nghiệp đầu tư nước ngoài theo Luật Khuyến khích Đầu tư Nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Điều kiện cơ bản:" },
      { "kind": "bullet", "depth": 2, "text": "Đối tượng đầu tư phải là doanh nghiệp do công dân Hàn Quốc điều hành" },
      { "kind": "bullet", "depth": 2, "text": "Số tiền đầu tư từ 100 triệu KRW trở lên, sở hữu từ 10% tổng vốn góp trở lên" },
      { "kind": "bullet", "depth": 2, "text": "Phải đăng ký với tư cách đồng đại diện" },
      { "kind": "bullet", "depth": 2, "text": "Đăng ký đồng đại diện cùng người Hàn trong giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 0, "text": "D-8-4: Người đã lấy bằng cử nhân trở lên trong nước hoặc nước ngoài, có sở hữu quyền sở hữu trí tuệ hoặc năng lực kỹ thuật tương đương, là người sáng lập pháp nhân" },
      { "kind": "bullet", "depth": 1, "text": "Điều kiện: Người đã lấy bằng cao đẳng trở lên, hoặc người sáng lập có quyền sở hữu trí tuệ hoặc năng lực kỹ thuật" }
    ],
    "requirementsZh": [
      { "kind": "heading", "depth": 0, "text": "1. D-8-1：外商投资企业经营、管理、生产、技术领域必要专业人员" },
      { "kind": "bullet", "depth": 0, "text": "基本材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 0, "text": "补充材料：" },
      { "kind": "bullet", "depth": 1, "text": "派遣命令书（注明派遣期间）" },
      { "kind": "bullet", "depth": 1, "text": "在职证明" },
      { "kind": "bullet", "depth": 1, "text": "外商投资企业登记证副本" },
      { "kind": "bullet", "depth": 1, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 1, "text": "法人登记事项全部证明" },
      { "kind": "bullet", "depth": 1, "text": "股东变动情况明细书原件" },
      { "kind": "bullet", "depth": 1, "text": "投资资金引入相关证明材料" },
      { "kind": "bullet", "depth": 0, "text": "投资金额低于 3 亿韩元的个人投资者补充材料：" },
      { "kind": "bullet", "depth": 1, "text": "资本金使用明细证明（购物票据、办公室装修费、国内银行账户出入金明细等）" },
      { "kind": "bullet", "depth": 1, "text": "营业场所存在证明（办公室租赁合同、营业场所全景、办公空间、招牌照片等）" },
      { "kind": "bullet", "depth": 1, "text": "本国与该业种或领域相关的事业经验材料（必要时提交）" },
      { "kind": "heading", "depth": 0, "text": "2. D-8-2：风险企业代表人或技术性优秀企业代表人" },
      { "kind": "bullet", "depth": 0, "text": "基本材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 0, "text": "补充材料：" },
      { "kind": "bullet", "depth": 1, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 1, "text": "法人登记事项全部证明" },
      { "kind": "bullet", "depth": 1, "text": "风险企业确认书或预备风险企业确认书" },
      { "kind": "bullet", "depth": 1, "text": "证明拥有知识产权等技术力的材料：" },
      { "kind": "bullet", "depth": 2, "text": "专利证、实用新型登记证、外观设计登记证、商标登记证、著作权登记证等副本" },
      { "kind": "bullet", "depth": 2, "text": "技术信用保证基金或中小企业振兴公团的技术性优秀评价书" },
      { "kind": "heading", "depth": 0, "text": "3. D-8-3：外商投资企业经营、管理或生产技术领域必要专业人员" },
      { "kind": "bullet", "depth": 0, "text": "基本材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 0, "text": "补充材料：" },
      { "kind": "bullet", "depth": 1, "text": "外商投资企业登记证副本" },
      { "kind": "bullet", "depth": 1, "text": "共同事业者（韩国国民）的事业资金（使用明细）证明" },
      { "kind": "bullet", "depth": 1, "text": "标注共同事业者的营业执照副本" },
      { "kind": "bullet", "depth": 1, "text": "共同事业者约定书原件" },
      { "kind": "bullet", "depth": 1, "text": "投资资金引入相关证明材料" },
      { "kind": "bullet", "depth": 0, "text": "投资金额低于 3 亿韩元的个人投资者补充材料：" },
      { "kind": "bullet", "depth": 1, "text": "资本金使用明细证明（购物票据、办公室装修费、国内银行账户出入金明细等）" },
      { "kind": "bullet", "depth": 1, "text": "营业场所存在证明（办公室租赁合同、营业场所全景、办公空间、招牌照片等）" },
      { "kind": "bullet", "depth": 1, "text": "本国与该业种或领域相关的事业经验材料（必要时提交）" },
      { "kind": "heading", "depth": 0, "text": "4. D-8-4：法人创业者（拥有知识产权或技术力的创业者）" },
      { "kind": "bullet", "depth": 0, "text": "基本材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 1, "text": "法人登记事项全部证明及营业执照副本" },
      { "kind": "bullet", "depth": 1, "text": "学位证书副本或相关中央行政机关首长的推荐书" },
      { "kind": "bullet", "depth": 0, "text": "适用计分制的对象提交材料：" },
      { "kind": "bullet", "depth": 1, "text": "知识产权持有者：专利证、实用新型登记证、外观设计登记证副本" },
      { "kind": "bullet", "depth": 1, "text": "OECD 国家知识产权持有（登记）者：能证明该事实的材料副本" },
      { "kind": "bullet", "depth": 1, "text": "专利等申请人：专利厅长发行的申请事实证明" },
      { "kind": "bullet", "depth": 1, "text": "由法务部长官指定的「全球创业移民中心」首长发行的创业移民综合支援系统（OASIS）相应项目修读（结业、毕业）证书、获奖确认书、选定公文等证明材料" },
      { "kind": "bullet", "depth": 1, "text": "其他计分制相关项目证明材料" },
      { "kind": "bullet", "depth": 0, "text": "免除计分制对象（技术创业特例对象）提交材料：" },
      { "kind": "bullet", "depth": 1, "text": "K-Startup Grand Challenge 参与者：基本提交材料 + 中小企业部发行的 Grand Challenge 参与确认书、中小企业部长官推荐公文" },
      { "kind": "bullet", "depth": 0, "text": "政府创业支援事业受益者：" },
      { "kind": "bullet", "depth": 1, "text": "基本提交材料 + 中小企业部长官推荐书" },
      { "kind": "bullet", "depth": 0, "text": "Startup Korea 特别签证：" },
      { "kind": "bullet", "depth": 1, "text": "基本提交材料 + 中小企业部长官推荐书" }
    ],
    "requirementsVi": [
      { "kind": "heading", "depth": 0, "text": "1. D-8-1: Nhân lực chuyên môn cốt lõi trong lĩnh vực kinh doanh, quản lý, sản xuất, kỹ thuật của doanh nghiệp đầu tư nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cơ bản:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bổ sung:" },
      { "kind": "bullet", "depth": 1, "text": "Lệnh phái cử (ghi rõ thời gian phái cử)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang công tác" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao Giấy chứng nhận đăng ký doanh nghiệp đầu tư nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận tất cả các mục đăng ký pháp nhân" },
      { "kind": "bullet", "depth": 1, "text": "Bản gốc bảng kê biến động cổ đông" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh việc đưa vốn đầu tư" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bổ sung cho nhà đầu tư cá nhân với số tiền đầu tư dưới 300 triệu KRW:" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh chi tiết sử dụng vốn (hoá đơn mua hàng, chi phí trang trí văn phòng, sao kê thu chi tài khoản ngân hàng trong nước, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh sự tồn tại của địa điểm kinh doanh (hợp đồng thuê văn phòng, ảnh toàn cảnh, không gian văn phòng, biển hiệu, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ của nước có quốc tịch về kinh nghiệm kinh doanh trong ngành nghề hoặc lĩnh vực liên quan (nộp khi cần)" },
      { "kind": "heading", "depth": 0, "text": "2. D-8-2: Người đại diện doanh nghiệp khởi nghiệp hoặc người đại diện doanh nghiệp có tính kỹ thuật xuất sắc" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cơ bản:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bổ sung:" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận tất cả các mục đăng ký pháp nhân" },
      { "kind": "bullet", "depth": 1, "text": "Giấy xác nhận doanh nghiệp khởi nghiệp hoặc giấy xác nhận doanh nghiệp khởi nghiệp dự bị" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh năng lực kỹ thuật như sở hữu quyền sở hữu trí tuệ:" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao bằng sáng chế, giấy chứng nhận đăng ký giải pháp hữu ích, giấy chứng nhận đăng ký kiểu dáng công nghiệp, giấy chứng nhận đăng ký nhãn hiệu, giấy chứng nhận đăng ký quyền tác giả, v.v." },
      { "kind": "bullet", "depth": 2, "text": "Giấy đánh giá tính kỹ thuật xuất sắc của Quỹ Bảo lãnh Tín dụng Kỹ thuật hoặc Tổng công ty Phát triển Doanh nghiệp Vừa và Nhỏ" },
      { "kind": "heading", "depth": 0, "text": "3. D-8-3: Nhân lực chuyên môn cốt lõi trong lĩnh vực kinh doanh, quản lý hoặc kỹ thuật sản xuất của doanh nghiệp đầu tư nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cơ bản:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bổ sung:" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao Giấy chứng nhận đăng ký doanh nghiệp đầu tư nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh nguồn vốn kinh doanh (chi tiết sử dụng) của đồng kinh doanh viên là công dân Hàn Quốc" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy phép kinh doanh có ghi đồng kinh doanh viên" },
      { "kind": "bullet", "depth": 1, "text": "Bản gốc thoả thuận đồng kinh doanh viên" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh việc đưa vốn đầu tư" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bổ sung cho nhà đầu tư cá nhân với số tiền đầu tư dưới 300 triệu KRW:" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh chi tiết sử dụng vốn (hoá đơn mua hàng, chi phí trang trí văn phòng, sao kê thu chi tài khoản ngân hàng trong nước, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh sự tồn tại của địa điểm kinh doanh (hợp đồng thuê văn phòng, ảnh toàn cảnh, không gian văn phòng, biển hiệu, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ của nước có quốc tịch về kinh nghiệm kinh doanh trong ngành nghề hoặc lĩnh vực liên quan (nộp khi cần)" },
      { "kind": "heading", "depth": 0, "text": "4. D-8-4: Người sáng lập pháp nhân (có quyền sở hữu trí tuệ hoặc năng lực kỹ thuật)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cơ bản:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận tất cả các mục đăng ký pháp nhân và bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao bằng cấp hoặc thư giới thiệu của lãnh đạo cơ quan hành chính trung ương liên quan" },
      { "kind": "bullet", "depth": 0, "text": "Đối tượng áp dụng hệ thống tính điểm - hồ sơ nộp:" },
      { "kind": "bullet", "depth": 1, "text": "Người sở hữu quyền sở hữu trí tuệ: bản sao bằng sáng chế, giấy chứng nhận đăng ký giải pháp hữu ích, giấy chứng nhận đăng ký kiểu dáng công nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Người sở hữu (đăng ký) quyền sở hữu trí tuệ ở nước OECD: bản sao giấy tờ chứng minh sự việc đó" },
      { "kind": "bullet", "depth": 1, "text": "Người nộp đơn xin cấp bằng sáng chế, v.v.: giấy xác nhận đã nộp đơn do Cục trưởng Cục Sở hữu Trí tuệ cấp" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh đã hoàn thành (kết thúc, tốt nghiệp) hạng mục tương ứng trong Hệ thống Hỗ trợ Tổng hợp Khởi nghiệp Nhập cư (OASIS), giấy xác nhận đoạt giải, công văn lựa chọn, v.v., do Trưởng \"Trung tâm Khởi nghiệp Nhập cư Toàn cầu\" do Bộ trưởng Tư pháp chỉ định cấp" },
      { "kind": "bullet", "depth": 1, "text": "Các hồ sơ chứng minh khác liên quan đến hệ thống tính điểm" },
      { "kind": "bullet", "depth": 0, "text": "Đối tượng được miễn áp dụng hệ thống tính điểm (đối tượng đặc lệ khởi nghiệp công nghệ) - hồ sơ nộp:" },
      { "kind": "bullet", "depth": 1, "text": "Người tham gia K-Startup Grand Challenge: hồ sơ cơ bản + giấy xác nhận tham gia Grand Challenge do Bộ Doanh nghiệp Vừa và Nhỏ cấp, công văn giới thiệu của Bộ trưởng Doanh nghiệp Vừa và Nhỏ" },
      { "kind": "bullet", "depth": 0, "text": "Người được hưởng chương trình hỗ trợ khởi nghiệp của Chính phủ:" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cơ bản + thư giới thiệu của Bộ trưởng Doanh nghiệp Vừa và Nhỏ" },
      { "kind": "bullet", "depth": 0, "text": "Visa đặc biệt Startup Korea:" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cơ bản + thư giới thiệu của Bộ trưởng Doanh nghiệp Vừa và Nhỏ" }
    ]
  },
  "D-9": {
    "titleKo": "D-9 무역경영 비자 - 무역 및 수출",
    "titleEn": "D-9 Treaty Trade - Trade & Export",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-9비자 활동 범위"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "회사경영, 무역, 영리사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수출설비(기계)의 설치 / 운영 / 보수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "선박건조, 설비제작 감독"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Scope of Activities"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Company management, trade, commercial business"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Installation/operation/maintenance of export facilities (machinery)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Supervision of shipbuilding, equipment manufacturing"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1 Maximum period of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사 경영 무역 영리사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대외무역법령 및 대외무역관리규정에 의하여 한국무역협회장으로부터 무역거래자별 무역업 고유번호를 부여받은 무역거래자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수출설비 (기계) 의 설치, 운영, 보수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산업설비 (기계) 도입회사에 파견 또는 초청되어 그 장비의 설치, 운영, 보수 (정비)에 필요한 기술을 제공하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "선박건조, 설비제작 감독"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "선박건조 및 산업설비 제작의 감독을 위하여 파견되는 자 (발주자 또는 발주사가 지정하는 전문용역 제공회사에서 파견되는 자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사경영, 영리사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국에 회사를 설립하여 사업을 경영하거나 영리활동을 하는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Company management trade for profit business"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A trader who has been assigned a unique trade business number by the head of the Korea International Trade Association in accordance with the Foreign Trade Act and the Foreign Trade Management Regulations."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Installation, operation, and maintenance of export equipment (machinery)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who is dispatched or invited to an industrial equipment (machinery) introducing company to provide the necessary technology for the installation, operation, and maintenance of the equipment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Supervision of shipbuilding and equipment manufacturing"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons dispatched to supervise shipbuilding and industrial equipment manufacturing (dispatched by the owner or a specialized service provider designated by the owner)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Company management, for-profit business"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons who establish a company in Korea to manage a business or engage in commercial activities."
      }
    ],
    "requirementsKo": [
      {
        "kind": "heading",
        "depth": 0,
        "text": "1. 무역비자 점수제 해당자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "요건:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "총 160점 중 60점 이상 득점"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필수항목 점수 10점 이상"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "허가 요건:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청자 본인 명의로 사업자등록 완료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청일 기준 3년 이내에 출입국관리법을 위반한 사실이 없음"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "제출 서류:사증발급인정신청서, 여권 사본사업자등록증 사본무역업 고유번호부여증 (한국무역협회 발행) 사본공동사업약정서 원본 및 사본 (공동 사업자인 경우)임대차 계약서점수제 해당 점수 입증 서류무역실적: \"수출입실적증명서\" (한국무역협회 발행)무역분야 전문성: 경력증명서, 학위증, 교육이수증 등기타 자본금 입증서류, TOPIK 점수표, 사회통합프로그램 이수증 등"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "2. 산업설비(기계) 도입회사에 파견 또는 초청되어 그 장비의 설치/운영/보수에 필요한 기술 제공자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "제출 서류:사증발급인정신청서, 여권 사본, 표준규격사진 1매초청사유서설비도입계약서 또는 산업설비도입 입증서류파견명령서초청회사의 사업자등록증 사본 또는 법인등기사항전부증명서연간 납세사실증명서"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "3. 선박건조 및 산업설비 제작 감독을 위하여 파견되는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "제출 서류:사증발급인정신청서, 여권 사본, 표준규격사진 1매초청사유서수주계약서 사본파견명령서초청회사의 사업자등록증 사본 또는 법인등기사항전부증명서연간 납세사실증명서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Trade Visa Scoring System applicants"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Scored 60 or more points out of a total of 160 points in the trade visa scoring system, with at least 10 points in the required categories."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Authorization requirements"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Business registration must be completed in the applicant's name."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "The applicant has not violated any immigration laws within three years prior to the date of application."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents to be submitted"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport copy"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of business license"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of trade license (issued by the Korea International Trade Association)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Original and copy of joint business agreement (in case of joint business)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Lease agreement"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of scoring system"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "For trade performance, submit \"Export and Import Performance Certificate\" issued by the head of the Korea International Trade Association"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Experience certificate, diploma, education certificate, etc. for expertise in the trade field"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Other proof of capital, TOPIK score sheet, certificate of completion of social integration program, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who is dispatched or invited to an industrial equipment (machine) introduction company to provide the necessary skills for installation/operation/maintenance of the equipment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa issuance authorization application, passport copy, 1 standardized photo"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Letter of invitation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Equipment introduction contract or proof of industrial equipment introduction"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Dispatch order"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of the business license of the inviting company or a certificate of full corporate registration."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Annual tax payment certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons dispatched to supervise shipbuilding and industrial equipment production"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa issuance authorization application, passport copy, one standardized photo"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Letter of invitation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of the contract"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Dispatch order"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of the inviting company's business license or a copy of all corporate registration items"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Annual tax certificate"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "D-9비자 활동 범위"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "회사경영, 무역, 영리사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수출설비(기계)의 설치 / 운영 / 보수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "선박건조, 설비제작 감독"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사 경영 무역 영리사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대외무역법령 및 대외무역관리규정에 의하여 한국무역협회장으로부터 무역거래자별 무역업 고유번호를 부여받은 무역거래자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수출설비 (기계) 의 설치, 운영, 보수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산업설비 (기계) 도입회사에 파견 또는 초청되어 그 장비의 설치, 운영, 보수 (정비)에 필요한 기술을 제공하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "선박건조, 설비제작 감독"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "선박건조 및 산업설비 제작의 감독을 위하여 파견되는 자 (발주자 또는 발주사가 지정하는 전문용역 제공회사에서 파견되는 자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사경영, 영리사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국에 회사를 설립하여 사업을 경영하거나 영리활동을 하는 자"
      }
    ],
    "requirements": [
      {
        "kind": "heading",
        "depth": 0,
        "text": "1. 무역비자 점수제 해당자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "요건:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "총 160점 중 60점 이상 득점"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필수항목 점수 10점 이상"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "허가 요건:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청자 본인 명의로 사업자등록 완료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청일 기준 3년 이내에 출입국관리법을 위반한 사실이 없음"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "제출 서류:사증발급인정신청서, 여권 사본사업자등록증 사본무역업 고유번호부여증 (한국무역협회 발행) 사본공동사업약정서 원본 및 사본 (공동 사업자인 경우)임대차 계약서점수제 해당 점수 입증 서류무역실적: \"수출입실적증명서\" (한국무역협회 발행)무역분야 전문성: 경력증명서, 학위증, 교육이수증 등기타 자본금 입증서류, TOPIK 점수표, 사회통합프로그램 이수증 등"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "2. 산업설비(기계) 도입회사에 파견 또는 초청되어 그 장비의 설치/운영/보수에 필요한 기술 제공자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "제출 서류:사증발급인정신청서, 여권 사본, 표준규격사진 1매초청사유서설비도입계약서 또는 산업설비도입 입증서류파견명령서초청회사의 사업자등록증 사본 또는 법인등기사항전부증명서연간 납세사실증명서"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "3. 선박건조 및 산업설비 제작 감독을 위하여 파견되는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "제출 서류:사증발급인정신청서, 여권 사본, 표준규격사진 1매초청사유서수주계약서 사본파견명령서초청회사의 사업자등록증 사본 또는 법인등기사항전부증명서연간 납세사실증명서"
      }
    ],
    "titleZh": "D-9 贸易经营签证 - 贸易及出口",
    "titleVi": "Visa D-9 Quản lý thương mại - Thương mại và xuất khẩu",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "D-9 签证活动范围" },
      { "kind": "bullet", "depth": 1, "text": "公司经营、贸易、营利事业" },
      { "kind": "bullet", "depth": 1, "text": "出口设备（机械）的安装 / 运营 / 维护" },
      { "kind": "bullet", "depth": 1, "text": "船舶建造、设备制造监督" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Phạm vi hoạt động của visa D-9" },
      { "kind": "bullet", "depth": 1, "text": "Điều hành công ty, thương mại, kinh doanh sinh lợi" },
      { "kind": "bullet", "depth": 1, "text": "Lắp đặt / vận hành / bảo trì thiết bị xuất khẩu (máy móc)" },
      { "kind": "bullet", "depth": 1, "text": "Giám sát đóng tàu, chế tạo thiết bị" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "公司经营、贸易、营利事业" },
      { "kind": "bullet", "depth": 1, "text": "依据《对外贸易法令》及《对外贸易管理规定》获得韩国贸易协会会长授予贸易商专属贸易业固有编号的贸易商" },
      { "kind": "bullet", "depth": 0, "text": "出口设备（机械）的安装、运营、维护" },
      { "kind": "bullet", "depth": 1, "text": "被派遣或受邀至工业设备（机械）引进公司，提供该设备的安装、运营、维护（保养）所需技术者" },
      { "kind": "bullet", "depth": 0, "text": "船舶建造、设备制造监督" },
      { "kind": "bullet", "depth": 1, "text": "为监督船舶建造及工业设备制造而被派遣的人员（由发包方或发包公司指定的专门服务提供公司派遣）" },
      { "kind": "bullet", "depth": 0, "text": "公司经营、营利事业" },
      { "kind": "bullet", "depth": 1, "text": "在韩国设立公司经营事业或开展营利活动者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Điều hành công ty, thương mại, kinh doanh sinh lợi" },
      { "kind": "bullet", "depth": 1, "text": "Người làm thương mại được Chủ tịch Hiệp hội Thương mại Hàn Quốc cấp mã số định danh thương mại theo Luật Ngoại thương và Quy định Quản lý Ngoại thương" },
      { "kind": "bullet", "depth": 0, "text": "Lắp đặt, vận hành, bảo trì thiết bị xuất khẩu (máy móc)" },
      { "kind": "bullet", "depth": 1, "text": "Người được phái cử hoặc được mời đến công ty đưa vào thiết bị công nghiệp (máy móc) để cung cấp kỹ thuật cần thiết cho việc lắp đặt, vận hành, bảo trì thiết bị" },
      { "kind": "bullet", "depth": 0, "text": "Giám sát đóng tàu, chế tạo thiết bị" },
      { "kind": "bullet", "depth": 1, "text": "Người được phái cử để giám sát đóng tàu và chế tạo thiết bị công nghiệp (do bên đặt hàng hoặc công ty đặt hàng chỉ định công ty cung cấp dịch vụ chuyên nghiệp phái cử)" },
      { "kind": "bullet", "depth": 0, "text": "Điều hành công ty, kinh doanh sinh lợi" },
      { "kind": "bullet", "depth": 1, "text": "Người thành lập công ty tại Hàn Quốc để điều hành kinh doanh hoặc thực hiện hoạt động sinh lợi" }
    ],
    "requirementsZh": [
      { "kind": "heading", "depth": 0, "text": "1. 适用贸易签证计分制对象" },
      { "kind": "bullet", "depth": 0, "text": "要件：" },
      { "kind": "bullet", "depth": 1, "text": "总 160 分中得分 60 分以上" },
      { "kind": "bullet", "depth": 1, "text": "必填项目得分 10 分以上" },
      { "kind": "bullet", "depth": 0, "text": "许可要件：" },
      { "kind": "bullet", "depth": 1, "text": "申请人本人名义完成营业登记" },
      { "kind": "bullet", "depth": 1, "text": "申请日前 3 年内无违反《出入境管理法》记录" },
      { "kind": "bullet", "depth": 0, "text": "提交材料：签证发放认定申请书、护照副本、营业执照副本、贸易业固有编号授予证（韩国贸易协会发行）副本、共同事业约定书原件及副本（共同事业者情况）、租赁合同、计分制相应得分证明材料、贸易业绩：「进出口业绩证明书」（韩国贸易协会发行）、贸易领域专业性：经历证明书、学位证、教育修读证等、其他资本金证明材料、TOPIK 成绩表、社会融合项目修读证等" },
      { "kind": "heading", "depth": 0, "text": "2. 被派遣或受邀至工业设备（机械）引进公司，提供该设备安装/运营/维护所需技术者" },
      { "kind": "bullet", "depth": 0, "text": "提交材料：签证发放认定申请书、护照副本、标准规格照片 1 张、邀请理由书、设备引进合同或工业设备引进证明材料、派遣命令书、邀请公司的营业执照副本或法人登记事项全部证明、年度纳税事实证明" },
      { "kind": "heading", "depth": 0, "text": "3. 为监督船舶建造及工业设备制造而被派遣的人员" },
      { "kind": "bullet", "depth": 0, "text": "提交材料：签证发放认定申请书、护照副本、标准规格照片 1 张、邀请理由书、订单合同副本、派遣命令书、邀请公司的营业执照副本或法人登记事项全部证明、年度纳税事实证明" }
    ],
    "requirementsVi": [
      { "kind": "heading", "depth": 0, "text": "1. Đối tượng áp dụng hệ thống tính điểm visa thương mại" },
      { "kind": "bullet", "depth": 0, "text": "Điều kiện:" },
      { "kind": "bullet", "depth": 1, "text": "Đạt từ 60 điểm trở lên trên tổng số 160 điểm" },
      { "kind": "bullet", "depth": 1, "text": "Đạt từ 10 điểm trở lên ở các hạng mục bắt buộc" },
      { "kind": "bullet", "depth": 0, "text": "Điều kiện cấp phép:" },
      { "kind": "bullet", "depth": 1, "text": "Hoàn tất đăng ký kinh doanh dưới tên của người nộp hồ sơ" },
      { "kind": "bullet", "depth": 1, "text": "Không có vi phạm Luật Quản lý Xuất nhập cảnh trong vòng 3 năm tính đến ngày nộp hồ sơ" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ nộp: Đơn xin cấp giấy phép cấp thị thực, bản sao hộ chiếu, bản sao giấy phép kinh doanh, bản sao giấy chứng nhận cấp mã số định danh thương mại (do Hiệp hội Thương mại Hàn Quốc phát hành), bản gốc và bản sao thoả thuận đồng kinh doanh (trường hợp đồng kinh doanh), hợp đồng thuê, hồ sơ chứng minh điểm số tương ứng theo hệ thống tính điểm, thành tích thương mại: \"Giấy chứng nhận thành tích xuất nhập khẩu\" (do Hiệp hội Thương mại Hàn Quốc phát hành), tính chuyên môn trong lĩnh vực thương mại: giấy chứng nhận kinh nghiệm, bằng cấp, giấy chứng nhận hoàn thành khoá học, v.v., các giấy tờ chứng minh vốn khác, bảng điểm TOPIK, giấy chứng nhận hoàn thành chương trình hoà nhập xã hội, v.v." },
      { "kind": "heading", "depth": 0, "text": "2. Người được phái cử hoặc được mời đến công ty đưa vào thiết bị công nghiệp (máy móc) để cung cấp kỹ thuật cho việc lắp đặt/vận hành/bảo trì" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ nộp: Đơn xin cấp giấy phép cấp thị thực, bản sao hộ chiếu, 1 ảnh tiêu chuẩn, lý do mời, hợp đồng đưa vào thiết bị hoặc giấy tờ chứng minh việc đưa vào thiết bị công nghiệp, lệnh phái cử, bản sao giấy phép kinh doanh hoặc giấy chứng nhận tất cả các mục đăng ký pháp nhân của công ty mời, giấy chứng nhận đã nộp thuế hằng năm" },
      { "kind": "heading", "depth": 0, "text": "3. Người được phái cử để giám sát đóng tàu và chế tạo thiết bị công nghiệp" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ nộp: Đơn xin cấp giấy phép cấp thị thực, bản sao hộ chiếu, 1 ảnh tiêu chuẩn, lý do mời, bản sao hợp đồng đặt hàng, lệnh phái cử, bản sao giấy phép kinh doanh hoặc giấy chứng nhận tất cả các mục đăng ký pháp nhân của công ty mời, giấy chứng nhận đã nộp thuế hằng năm" }
    ]
  },
  "D-10": {
    "titleKo": "D-10 구직활동 비자 - 외국인 및 유학생 인턴십",
    "titleEn": "D-10 Job Seeker - Job Search/Internship",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반구직 (D-10-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 기업, 단체 등에서 행하는 구직 활동 뿐만 아니라 정식 취업 전에 연수비를 받고 행하는 단기 인턴과정을 포함"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기술창업준비 (D-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "창업이민교육프로그램 참가, 지식재산권 등 특허출원 준비 및 출원, 창업법인 설립 준비 등 창업과 관련된 제반 준비활동(인턴활동 제한)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "첨단기술인턴 (D-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법무부장관이 정한 요건을 갖춘 기업과의 인턴 근로계약에 따른 첨단기술 분야 인턴 활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 1년 (최대 3번까지 연장 가능)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "* 2025년 10월 29일 개정안"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(General job search, D-10-1) Includes job search activities at domestic companies, organizations, etc. as well as short-term internships with training fees prior to formal employment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(Technology Startup Preparation, D-10-2) All preparatory activities related to startups, such as participation in startup immigrant education programs, preparation and filing of patent applications including intellectual property rights, and preparation for the establishment of startup corporations (internship activities are limited)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(High-tech intern, D-10-3) Intern activities in the high-tech field under an internship contract with a company that meets the requirements set by the Minister of Justice."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 6 months (can be extended up to 4 times)"
      }
    ],
    "candidatesKo": [],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "General job search (D-10-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(Applicants subject to the scoring system) Bachelor's Degree Applicants who have a bachelor's degree or higher from a domestic university and are looking for a job, and have a total score of 60 points or more, with 20 points or more in basic items out of a total score of 190 points (see D-10-1 TEST)."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(Exempted from the scoring system) Those who have not passed three years since graduating from a domestic university with a bachelor's degree or higher, who have a valid TOPIK score report of level 4 or higher, who have passed the midterm assessment of stage 4 of the social integration program, or who have been assigned to stage 5 of the pre-assessment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Entrepreneurship Preparation (D-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Bachelor's Degree Holders of a domestic professional bachelor's degree or higher who meet any of the following requirements."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Holders of Korean intellectual property rights such as patents, utility models, and design rights or pending applications."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Holders of OECD intellectual property rights"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who are participating in the curriculum of the Online Entrepreneurial Immigration System (OASIS) implemented by the Global Entrepreneurial Immigration Center jointly designated by the Ministry of Justice and the Ministry of SMEs and Startups, or who have completed part or all of the curriculum within the last three years."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "High-tech intern (D-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Students who are enrolled in a bachelor's program or higher in a high-tech field at an overseas university (this university only), or graduates (bachelor's: under 30 years of age, master's or higher: under 35 years of age) who have signed an internship contract with a domestic company that falls under any of the following."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Domestic listed companies with research facilities (research departments) in high-tech fields"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A domestic company with a company-affiliated research center or a dedicated R&D department under Article 14(2) of the Basic Research Act"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A company designated as a high-tech company under Article 9 of the Special Act on the Development of R&D Special Zones"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Venture companies that have been identified by the Ministry of Small and Medium-sized Enterprises pursuant to Article 25 of the Special Measures for the Promotion of Venture Companies Act."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "National research institutes, designated research institutes, and government-affiliated research institutes in the field of science and technology."
      }
    ],
    "requirementsKo": [
      {
        "kind": "heading",
        "depth": 0,
        "text": "1. 일반구직 (D-10-1) : 점수제 적용 대상자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "구직활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 전문대학 이상 졸업자: 학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "세계 우수대학 졸업자: 학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "근무경력 증빙서류 (해당자):"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "경력증명서 (근무기간, 장소, 직종 포함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 연수 활동 증빙서류 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국어 능력 입증서류 (해당자):"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "TOPIK(유효기간 이내) 또는 KIIP 이수증빙서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용추천서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고소득 전문가 입증서류 (해당자):"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "전년도 근로소득 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체재비 입증서류 (유학 사증 준용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기타 점수제 평가를 위해 필요하다고 인정되는 서류"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "2. 일반구직 (D-10-1) : 점수제 면제 특례자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "구직활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 정규 대학 전문학사 이상 학위증 (또는 졸업증명서)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "TOPIK 4급 유효 성적표"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사회통합프로그램 중간평가 합격증 또는 사전평가 점수표 (81점 이상)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체재비 입증서류 (유학 사증 준용)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "3. 기술창업준비 (D-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학사 (국내 전문학사 이상) 학위 증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기술창업계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특허증, 실용신안등록증, 디자인등록증 사본 또는 특허 등 출원사실증명서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "창업이민종합지원시스템 교육과정 이수증 또는 교육참여 확인서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "OECD 국가 지식재산권 보유 사실을 확인할 수 있는 공적 서류 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체재비 입증서류 (유학 사증 준용)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "4. 첨단기술인턴 (D-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인턴활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외 우수대학(세계 대학 순위 200위 이내) 첨단기술 분야 학사과정 이상 재학증명서 또는 졸업증명서 (학위증)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인턴근로계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청 기업(기관) 사업자등록증 (또는 고유번호증), 법인등기부등본, 고용보험가입자 명부, 연구시설 현황자료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "첨단기술인턴 초청이 가능한 기업(기관)을 입증하는 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "상장기업으로 첨단기술분야 연구시설을 갖춘 기업임을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기초연구법 제 14조의 2에 따라 기업부설 연구소 또는 연구개발전담부서로 인정받은 사실을 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연구개발특구의 육성에 관한 특별법 제 9조에 따라 첨단기술기업으로 지정된 사실을 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "벤처기업육성에 관한 특별조치법 제 25조에 따른 벤처기업 확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체재비 입증서류 (유학 사증 준용)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "General Job D-10-1: Who is eligible for the scoring system?"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Common documents (application form, photo, passport copy, fee, copy of ID, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Job search plan"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Degree certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Graduates of domestic colleges and universities : Academic transcripts"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Graduates of world-class universities: Academic transcripts"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of work experience (only applicable)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Career certificate (Certificate of employment) including work period, location, occupation, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of training activities in Korea (Applicants only)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of Korean language proficiency (Applicants only)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of completion of TOPIK or KIIP (within the validity period)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment recommendation letter (applicable only)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of high-income professional (only) -- Proof of previous year's earnings (only)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of expenses"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Other documents deemed necessary for the point system evaluation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "General job search (D-10-1) : Exempted from the point system"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Common documents (application form, photo, passport copy, fee, copy of ID, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Job search plan"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Bachelor's degree or higher from a regular university in Korea (or graduation certificate)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "TOPIK Level 4 valid score report, Social Integration Program midterm assessment pass certificate or pre-assessment score report (81 points or higher)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of expenses"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Technology Startup Preparation (D-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Common documents (application form, photo, passport copy, fee, copy of ID card, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Bachelor's degree or higher (domestic bachelor's degree)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Technology start-up plan"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of patent certificate, utility model registration certificate, design registration certificate, or proof of application for patent, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of completion of the Entrepreneurial Immigration Support System course or confirmation of participation in the course (if applicable)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Official documents confirming ownership of intellectual property rights in OECD countries (Applicant)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of expenses"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "High-tech interns (D-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Participants can only be granted a visa through a visa issuance authorization letter and can be granted a stay of up to one year to attract talented people (but cannot exceed the internship period specified in the contract)."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Common documents (application form, photo, passport copy, fee, copy of ID, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Internship activity plan"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of enrollment or graduation (diploma) from a regular degree program (high-tech field only) at an overseas university ranked in the top 200 by Time magazine and 500 by QS World University Rankings."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Internship contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Business license (or unique number) of the host company (organization), corporate register, employment insurance list, and research facility status data"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents to prove that the company (organization) is a company that can invite high-tech interns (option 1 below)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Documents that can prove that the company is a publicly traded company and has a research facility (research department) in the field of high technology (applicable person)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Documents confirming that the company has been recognized as a company-affiliated research institute or a dedicated R&D department under Article 14(2) of the Basic Research Act (Certificate of Recognition of Company-affiliated Research Institute or Certificate of Recognition of Dedicated R&D Department)."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Documents confirming that the company has been designated as a high-tech company pursuant to Article 9 of the Special Act on the Development of R&D Special Zones (High-tech Company Designation Certificate)."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Documents confirming that you are a venture company under Article 25 of the Special Measures for the Promotion of Venture Companies Act (Venture Company Confirmation)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Proof of expenses"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반구직 (D-10-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 기업, 단체 등에서 행하는 구직 활동 뿐만 아니라 정식 취업 전에 연수비를 받고 행하는 단기 인턴과정을 포함"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기술창업준비 (D-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "창업이민교육프로그램 참가, 지식재산권 등 특허출원 준비 및 출원, 창업법인 설립 준비 등 창업과 관련된 제반 준비활동(인턴활동 제한)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "첨단기술인턴 (D-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법무부장관이 정한 요건을 갖춘 기업과의 인턴 근로계약에 따른 첨단기술 분야 인턴 활동"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 1년 (최대 3번까지 연장 가능)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "* 2025년 10월 29일 개정안"
      }
    ],
    "candidates": [],
    "requirements": [
      {
        "kind": "heading",
        "depth": 0,
        "text": "1. 일반구직 (D-10-1) : 점수제 적용 대상자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "구직활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 전문대학 이상 졸업자: 학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "세계 우수대학 졸업자: 학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "근무경력 증빙서류 (해당자):"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "경력증명서 (근무기간, 장소, 직종 포함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 연수 활동 증빙서류 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국어 능력 입증서류 (해당자):"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "TOPIK(유효기간 이내) 또는 KIIP 이수증빙서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용추천서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고소득 전문가 입증서류 (해당자):"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "전년도 근로소득 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체재비 입증서류 (유학 사증 준용)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기타 점수제 평가를 위해 필요하다고 인정되는 서류"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "2. 일반구직 (D-10-1) : 점수제 면제 특례자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "구직활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 정규 대학 전문학사 이상 학위증 (또는 졸업증명서)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "TOPIK 4급 유효 성적표"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사회통합프로그램 중간평가 합격증 또는 사전평가 점수표 (81점 이상)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체재비 입증서류 (유학 사증 준용)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "3. 기술창업준비 (D-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학사 (국내 전문학사 이상) 학위 증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기술창업계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특허증, 실용신안등록증, 디자인등록증 사본 또는 특허 등 출원사실증명서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "창업이민종합지원시스템 교육과정 이수증 또는 교육참여 확인서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "OECD 국가 지식재산권 보유 사실을 확인할 수 있는 공적 서류 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체재비 입증서류 (유학 사증 준용)"
      },
      {
        "kind": "heading",
        "depth": 0,
        "text": "4. 첨단기술인턴 (D-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인턴활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외 우수대학(세계 대학 순위 200위 이내) 첨단기술 분야 학사과정 이상 재학증명서 또는 졸업증명서 (학위증)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "인턴근로계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청 기업(기관) 사업자등록증 (또는 고유번호증), 법인등기부등본, 고용보험가입자 명부, 연구시설 현황자료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "첨단기술인턴 초청이 가능한 기업(기관)을 입증하는 서류:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "상장기업으로 첨단기술분야 연구시설을 갖춘 기업임을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기초연구법 제 14조의 2에 따라 기업부설 연구소 또는 연구개발전담부서로 인정받은 사실을 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연구개발특구의 육성에 관한 특별법 제 9조에 따라 첨단기술기업으로 지정된 사실을 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "벤처기업육성에 관한 특별조치법 제 25조에 따른 벤처기업 확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체재비 입증서류 (유학 사증 준용)"
      }
    ],
    "titleZh": "D-10 求职活动签证 - 外国人及留学生实习",
    "titleVi": "Visa D-10 Tìm việc - Thực tập cho người nước ngoài và du học sinh",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "一般求职（D-10-1）" },
      { "kind": "bullet", "depth": 1, "text": "包括在国内企业、团体等开展的求职活动，以及正式就业前以接受研修津贴方式进行的短期实习课程" },
      { "kind": "bullet", "depth": 0, "text": "技术创业准备（D-10-2）" },
      { "kind": "bullet", "depth": 1, "text": "参加创业移民教育项目、知识产权（如专利）申请准备及申请、创业法人设立准备等创业相关的各项准备活动（实习活动受限）" },
      { "kind": "bullet", "depth": 0, "text": "尖端技术实习（D-10-3）" },
      { "kind": "bullet", "depth": 1, "text": "依据法务部长官规定要件，与符合条件的企业签订实习劳动合同，从事尖端技术领域的实习活动" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：1 年（最多可延长 3 次）" },
      { "kind": "heading", "depth": 0, "text": "* 2025 年 10 月 29 日修订" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Tìm việc thông thường (D-10-1)" },
      { "kind": "bullet", "depth": 1, "text": "Bao gồm hoạt động tìm việc tại doanh nghiệp, tổ chức trong nước và các khoá thực tập ngắn hạn nhận trợ cấp đào tạo trước khi chính thức làm việc" },
      { "kind": "bullet", "depth": 0, "text": "Chuẩn bị khởi nghiệp công nghệ (D-10-2)" },
      { "kind": "bullet", "depth": 1, "text": "Các hoạt động chuẩn bị liên quan đến khởi nghiệp như tham gia chương trình giáo dục khởi nghiệp nhập cư, chuẩn bị và nộp đơn quyền sở hữu trí tuệ (sáng chế), chuẩn bị thành lập pháp nhân khởi nghiệp (hoạt động thực tập bị giới hạn)" },
      { "kind": "bullet", "depth": 0, "text": "Thực tập công nghệ cao (D-10-3)" },
      { "kind": "bullet", "depth": 1, "text": "Hoạt động thực tập trong lĩnh vực công nghệ cao theo hợp đồng thực tập với doanh nghiệp đáp ứng các điều kiện do Bộ trưởng Tư pháp quy định" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 1 năm (có thể gia hạn tối đa 3 lần)" },
      { "kind": "heading", "depth": 0, "text": "* Bản sửa đổi ngày 29/10/2025" }
    ],
    "candidatesZh": [],
    "candidatesVi": [],
    "requirementsZh": [
      { "kind": "heading", "depth": 0, "text": "1. 一般求职（D-10-1）：适用计分制对象" },
      { "kind": "bullet", "depth": 0, "text": "通用材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "照片" },
      { "kind": "bullet", "depth": 1, "text": "护照副本" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 1, "text": "身份证副本" },
      { "kind": "bullet", "depth": 0, "text": "其他必备材料：" },
      { "kind": "bullet", "depth": 1, "text": "求职活动计划书" },
      { "kind": "bullet", "depth": 1, "text": "学位证" },
      { "kind": "bullet", "depth": 1, "text": "国内专科以上毕业生：学历证明" },
      { "kind": "bullet", "depth": 1, "text": "世界优秀大学毕业生：学历证明" },
      { "kind": "bullet", "depth": 1, "text": "工作经历证明材料（适用者）：" },
      { "kind": "bullet", "depth": 2, "text": "经历证明书（含工作期间、地点、职种）" },
      { "kind": "bullet", "depth": 1, "text": "国内研修活动证明材料（适用者）" },
      { "kind": "bullet", "depth": 1, "text": "韩语能力证明材料（适用者）：" },
      { "kind": "bullet", "depth": 2, "text": "TOPIK（有效期内）或 KIIP 修读证明材料" },
      { "kind": "bullet", "depth": 1, "text": "雇佣推荐书（适用者）" },
      { "kind": "bullet", "depth": 1, "text": "高收入专家证明材料（适用者）：" },
      { "kind": "bullet", "depth": 2, "text": "上一年度劳动收入证明材料" },
      { "kind": "bullet", "depth": 1, "text": "生活费证明材料（参照留学签证）" },
      { "kind": "bullet", "depth": 1, "text": "其他计分制评估认为必要的材料" },
      { "kind": "heading", "depth": 0, "text": "2. 一般求职（D-10-1）：计分制免除特例对象" },
      { "kind": "bullet", "depth": 0, "text": "通用材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "照片" },
      { "kind": "bullet", "depth": 1, "text": "护照副本" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 1, "text": "身份证副本" },
      { "kind": "bullet", "depth": 0, "text": "其他必备材料：" },
      { "kind": "bullet", "depth": 1, "text": "求职活动计划书" },
      { "kind": "bullet", "depth": 1, "text": "国内正规大学专科以上学位证（或毕业证）" },
      { "kind": "bullet", "depth": 1, "text": "TOPIK 4 级有效成绩单" },
      { "kind": "bullet", "depth": 1, "text": "社会融合项目中期评价合格证或预先评价分数表（81 分以上）" },
      { "kind": "bullet", "depth": 1, "text": "生活费证明材料（参照留学签证）" },
      { "kind": "heading", "depth": 0, "text": "3. 技术创业准备（D-10-2）" },
      { "kind": "bullet", "depth": 0, "text": "通用材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "照片" },
      { "kind": "bullet", "depth": 1, "text": "护照副本" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 1, "text": "身份证副本" },
      { "kind": "bullet", "depth": 0, "text": "其他必备材料：" },
      { "kind": "bullet", "depth": 1, "text": "学士（国内专科以上）学位证明" },
      { "kind": "bullet", "depth": 1, "text": "技术创业计划书" },
      { "kind": "bullet", "depth": 1, "text": "专利证、实用新型登记证、外观设计登记证副本，或专利等申请事实证明（适用者）" },
      { "kind": "bullet", "depth": 1, "text": "创业移民综合支援系统教育课程修读证或参与确认书（适用者）" },
      { "kind": "bullet", "depth": 1, "text": "可确认拥有 OECD 国家知识产权事实的官方文件（适用者）" },
      { "kind": "bullet", "depth": 1, "text": "生活费证明材料（参照留学签证）" },
      { "kind": "heading", "depth": 0, "text": "4. 尖端技术实习（D-10-3）" },
      { "kind": "bullet", "depth": 0, "text": "通用材料：" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书" },
      { "kind": "bullet", "depth": 1, "text": "照片" },
      { "kind": "bullet", "depth": 1, "text": "护照副本" },
      { "kind": "bullet", "depth": 1, "text": "手续费" },
      { "kind": "bullet", "depth": 1, "text": "身份证副本" },
      { "kind": "bullet", "depth": 0, "text": "其他必备材料：" },
      { "kind": "bullet", "depth": 1, "text": "实习活动计划书" },
      { "kind": "bullet", "depth": 1, "text": "海外优秀大学（世界大学排名 200 位以内）尖端技术领域学士课程以上的在学证明或毕业证明（学位证）" },
      { "kind": "bullet", "depth": 1, "text": "实习劳动合同" },
      { "kind": "bullet", "depth": 1, "text": "邀请企业（机构）的营业执照（或固有编号证）、法人登记副本、雇佣保险加入者名册、研究设施现状资料" },
      { "kind": "bullet", "depth": 0, "text": "可邀请尖端技术实习的企业（机构）证明材料：" },
      { "kind": "bullet", "depth": 1, "text": "证明为上市企业且具备尖端技术领域研究设施的材料" },
      { "kind": "bullet", "depth": 1, "text": "依据《基础研究法》第 14 条之 2 被认定为企业附属研究所或研发专责部门的事实证明材料" },
      { "kind": "bullet", "depth": 1, "text": "依据《研究开发特区培育特别法》第 9 条被指定为尖端技术企业的事实证明材料" },
      { "kind": "bullet", "depth": 1, "text": "依据《风险企业培育特别措施法》第 25 条的风险企业确认书" },
      { "kind": "bullet", "depth": 0, "text": "生活费证明材料（参照留学签证）" }
    ],
    "requirementsVi": [
      { "kind": "heading", "depth": 0, "text": "1. Tìm việc thông thường (D-10-1): Đối tượng áp dụng hệ thống tính điểm" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chung:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Ảnh" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy tờ tuỳ thân" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bắt buộc khác:" },
      { "kind": "bullet", "depth": 1, "text": "Kế hoạch hoạt động tìm việc" },
      { "kind": "bullet", "depth": 1, "text": "Bằng cấp" },
      { "kind": "bullet", "depth": 1, "text": "Người tốt nghiệp cao đẳng trở lên trong nước: Giấy chứng nhận học lực" },
      { "kind": "bullet", "depth": 1, "text": "Người tốt nghiệp các trường đại học hàng đầu thế giới: Giấy chứng nhận học lực" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh kinh nghiệm làm việc (đối tượng áp dụng):" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận kinh nghiệm (gồm thời gian, địa điểm, ngành nghề làm việc)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh hoạt động đào tạo trong nước (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh năng lực tiếng Hàn (đối tượng áp dụng):" },
      { "kind": "bullet", "depth": 2, "text": "Bằng TOPIK (trong thời hạn hiệu lực) hoặc giấy chứng nhận hoàn thành KIIP" },
      { "kind": "bullet", "depth": 1, "text": "Thư giới thiệu tuyển dụng (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh chuyên gia thu nhập cao (đối tượng áp dụng):" },
      { "kind": "bullet", "depth": 2, "text": "Hồ sơ chứng minh thu nhập từ lao động năm trước" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh chi phí sinh hoạt (áp dụng tương tự visa du học)" },
      { "kind": "bullet", "depth": 1, "text": "Các hồ sơ khác được cho là cần thiết để đánh giá theo hệ thống tính điểm" },
      { "kind": "heading", "depth": 0, "text": "2. Tìm việc thông thường (D-10-1): Đối tượng đặc lệ được miễn hệ thống tính điểm" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chung:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Ảnh" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy tờ tuỳ thân" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bắt buộc khác:" },
      { "kind": "bullet", "depth": 1, "text": "Kế hoạch hoạt động tìm việc" },
      { "kind": "bullet", "depth": 1, "text": "Bằng cao đẳng trở lên của trường đại học chính quy trong nước (hoặc giấy chứng nhận tốt nghiệp)" },
      { "kind": "bullet", "depth": 1, "text": "Bảng điểm TOPIK cấp 4 còn hiệu lực" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đậu kỳ đánh giá giữa kỳ chương trình hoà nhập xã hội hoặc bảng điểm đánh giá trước (từ 81 điểm trở lên)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh chi phí sinh hoạt (áp dụng tương tự visa du học)" },
      { "kind": "heading", "depth": 0, "text": "3. Chuẩn bị khởi nghiệp công nghệ (D-10-2)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chung:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Ảnh" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy tờ tuỳ thân" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bắt buộc khác:" },
      { "kind": "bullet", "depth": 1, "text": "Bằng cử nhân (cao đẳng trở lên trong nước)" },
      { "kind": "bullet", "depth": 1, "text": "Kế hoạch khởi nghiệp công nghệ" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao bằng sáng chế, giấy chứng nhận đăng ký giải pháp hữu ích, giấy chứng nhận đăng ký kiểu dáng công nghiệp, hoặc giấy xác nhận đã nộp đơn (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận hoàn thành khoá học hoặc giấy xác nhận tham gia của Hệ thống Hỗ trợ Tổng hợp Khởi nghiệp Nhập cư (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ công có thể xác nhận việc sở hữu quyền sở hữu trí tuệ ở nước OECD (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh chi phí sinh hoạt (áp dụng tương tự visa du học)" },
      { "kind": "heading", "depth": 0, "text": "4. Thực tập công nghệ cao (D-10-3)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chung:" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Ảnh" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy tờ tuỳ thân" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bắt buộc khác:" },
      { "kind": "bullet", "depth": 1, "text": "Kế hoạch hoạt động thực tập" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang theo học hoặc giấy chứng nhận tốt nghiệp (bằng cấp) chương trình cử nhân trở lên trong lĩnh vực công nghệ cao tại đại học top 200 thế giới" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động thực tập" },
      { "kind": "bullet", "depth": 1, "text": "Giấy phép kinh doanh (hoặc mã số định danh) của doanh nghiệp/tổ chức mời, bản sao đăng ký pháp nhân, danh sách người tham gia bảo hiểm tuyển dụng, dữ liệu hiện trạng cơ sở nghiên cứu" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh doanh nghiệp/tổ chức có thể mời thực tập sinh công nghệ cao:" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh là doanh nghiệp niêm yết và có cơ sở nghiên cứu trong lĩnh vực công nghệ cao" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ xác nhận được công nhận là viện nghiên cứu trực thuộc doanh nghiệp hoặc bộ phận chuyên trách R&D theo Điều 14 khoản 2 Luật Nghiên cứu Cơ bản" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ xác nhận được chỉ định là doanh nghiệp công nghệ cao theo Điều 9 Luật đặc biệt về Phát triển Khu R&D đặc biệt" },
      { "kind": "bullet", "depth": 1, "text": "Giấy xác nhận doanh nghiệp khởi nghiệp theo Điều 25 Luật đặc biệt về Khuyến khích Doanh nghiệp Khởi nghiệp" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh chi phí sinh hoạt (áp dụng tương tự visa du học)" }
    ]
  },
  "E-1": {
    "titleKo": "E-1 교수 비자 - 교육 및 연구 지도",
    "titleEn": "E-1 Professor - Teaching/Researching",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고등교육법에 의한 자격요건을 갖춘 외국인으로서 전문대 이상의 교육기관 또는 이에 준하는 기관에서 교육 또는 연구 지도를 수행하는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학술기관 교수: 한국과학기술원 등 학술기관의 교수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "전문대학 이상의 교육기관에서 임용되는 전임강사 이상의 교수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특수분야 연구교수: 대학 또는 대학부설연구소의 특수분야 연구교수 고급과학기술인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고급과학기술인력: 교육부장관의 고용추천이 있는 자로, 전문대학 이상의 교육기관에서 교육·연구지도 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간: 최대 5년 (1회 부여)"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Teaching or researching at a college or university or equivalent institution as a qualified foreigner under the Higher Education Act."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Professor at an academic institution such as the Korea Advanced Institute of Science and Technology"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Professors at the level of full-time lecturer or above appointed by an institution of higher education."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Research professor in a specialized field at a university or university-affiliated research institute Advanced scientific and technological personnel"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Advanced scientific and technological personnel"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who wish to engage in educational and research guidance activities in the field of education and science and technology at vocational colleges and universities or higher and have been recommended for employment by the Minister of Education."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay: 5 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한국과학기술원 등 학술기관 교수 전문대학 이상의 교육기관에서 임용하는 조교수 이상의 교수 대학 또는 대학부설연구소의 특수분야 연구교수"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Professor at an academic institution such as the Korea Advanced Institute of Science and Technology Professor at the level of assistant professor or above at a college or university or researcher in a specialized field at a university or university-affiliated research institute"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1장, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서 원본 및 사본 또는 (임용예정 확인서)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "경력증명서(학위증 사본 첨부)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사설립관련서류 (사업자등록증 ,연구기관 입증서류)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "원 근무처장의 동의서 (원 근무처가 있는 경우)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application for authorization to issue a visa, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Original and copy of employment contract or (confirmation of appointment)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Career certificate (copy of diploma attached)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to company establishment (business license, proof of research organization)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Letter of consent from your previous employer (if you have a previous employer)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고등교육법에 의한 자격요건을 갖춘 외국인으로서 전문대 이상의 교육기관 또는 이에 준하는 기관에서 교육 또는 연구 지도를 수행하는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학술기관 교수: 한국과학기술원 등 학술기관의 교수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "전문대학 이상의 교육기관에서 임용되는 전임강사 이상의 교수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특수분야 연구교수: 대학 또는 대학부설연구소의 특수분야 연구교수 고급과학기술인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고급과학기술인력: 교육부장관의 고용추천이 있는 자로, 전문대학 이상의 교육기관에서 교육·연구지도 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간: 최대 5년 (1회 부여)"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한국과학기술원 등 학술기관 교수 전문대학 이상의 교육기관에서 임용하는 조교수 이상의 교수 대학 또는 대학부설연구소의 특수분야 연구교수"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1장, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서 원본 및 사본 또는 (임용예정 확인서)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "경력증명서(학위증 사본 첨부)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사설립관련서류 (사업자등록증 ,연구기관 입증서류)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "원 근무처장의 동의서 (원 근무처가 있는 경우)"
      }
    ],
    "titleZh": "E-1 教授签证 - 教育及研究指导",
    "titleVi": "Visa E-1 Giảng viên - Giảng dạy và hướng dẫn nghiên cứu",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "符合《高等教育法》资格要求的外国人，在专科大学以上教育机构或同等机构从事教育或研究指导工作者" },
      { "kind": "bullet", "depth": 1, "text": "学术机构教授：韩国科学技术院等学术机构的教授" },
      { "kind": "bullet", "depth": 1, "text": "在专科大学以上教育机构受聘的专任讲师以上职称教授" },
      { "kind": "bullet", "depth": 1, "text": "特殊领域研究教授：大学或大学附属研究所的特殊领域研究教授、高级科学技术人才" },
      { "kind": "bullet", "depth": 0, "text": "高级科学技术人才：经教育部长官雇佣推荐，在专科大学以上教育机构从事教育、研究指导活动的人员" },
      { "kind": "bullet", "depth": 0, "text": "停留期限：最长 5 年（单次授予）" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người nước ngoài đáp ứng yêu cầu theo Luật Giáo dục Đại học, thực hiện hoạt động giảng dạy hoặc hướng dẫn nghiên cứu tại cơ sở giáo dục cao đẳng trở lên hoặc cơ quan tương đương" },
      { "kind": "bullet", "depth": 1, "text": "Giáo sư cơ quan học thuật: Giáo sư của các cơ quan học thuật như Viện Khoa học và Công nghệ Hàn Quốc" },
      { "kind": "bullet", "depth": 1, "text": "Giảng viên chuyên trách trở lên được bổ nhiệm tại cơ sở giáo dục cao đẳng trở lên" },
      { "kind": "bullet", "depth": 1, "text": "Giáo sư nghiên cứu lĩnh vực đặc thù: Giáo sư nghiên cứu lĩnh vực đặc thù của trường đại học hoặc viện nghiên cứu trực thuộc đại học, nhân lực khoa học công nghệ cao cấp" },
      { "kind": "bullet", "depth": 0, "text": "Nhân lực khoa học công nghệ cao cấp: Người được Bộ trưởng Giáo dục giới thiệu tuyển dụng, thực hiện hoạt động giảng dạy/hướng dẫn nghiên cứu tại cơ sở giáo dục cao đẳng trở lên" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú: Tối đa 5 năm (mỗi lần cấp)" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "韩国科学技术院等学术机构的教授；在专科大学以上教育机构受聘的副教授以上教授；大学或大学附属研究所的特殊领域研究教授" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Giáo sư các cơ quan học thuật như Viện Khoa học và Công nghệ Hàn Quốc; phó giáo sư trở lên được bổ nhiệm tại cơ sở giáo dục cao đẳng trở lên; giáo sư nghiên cứu lĩnh vực đặc thù tại trường đại học hoặc viện nghiên cứu trực thuộc đại học" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放认定申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "雇佣合同原件及副本，或（拟任用确认书）" },
      { "kind": "bullet", "depth": 0, "text": "经历证明（附学位证副本）" },
      { "kind": "bullet", "depth": 0, "text": "公司设立相关材料（营业执照、研究机构证明材料）" },
      { "kind": "bullet", "depth": 0, "text": "原工作单位负责人的同意书（如有原工作单位）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Bản gốc và bản sao hợp đồng lao động, hoặc giấy xác nhận dự kiến bổ nhiệm" },
      { "kind": "bullet", "depth": 0, "text": "Giấy chứng nhận kinh nghiệm (kèm bản sao bằng cấp)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến việc thành lập công ty (giấy phép kinh doanh, hồ sơ chứng minh cơ quan nghiên cứu)" },
      { "kind": "bullet", "depth": 0, "text": "Thư đồng ý của lãnh đạo nơi làm việc cũ (nếu có nơi làm việc cũ)" }
    ]
  },
  "E-2": {
    "titleKo": "E-2 회화지도 비자 - 외국어 교사",
    "titleEn": "E-2 Foreign Language Instructor - Foreign Language Teacher",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자격요건을 갖춘 외국인이 외국어전문학원, 초등학교 이상의 교육기관, 부설 어학연구소, 방송사 및 기업체 부설 어학연수원 등에서 외국어 회화지도를 할 수 있는 비자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "회화지도의 개념"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국어로 상호 의사소통하는 방법을 지도하는 활동"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어학, 문학, 통/번역 기법 지도는 회화지도에 해당하지 않음"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "활동 장소"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국어전문학원"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초등학교 이상의 교육기관 및 부설어학연구소"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "방송사 및 기업체 부설 어학연수원"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기타 이에 준하는 기관 또는 단체"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한: 1회 부여 시 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Conversational instruction in a foreign language by a foreigner who meets the qualifications prescribed by the Minister of Justice at a foreign language institute, an educational institution of elementary school or higher and its affiliated language institute, a language institute affiliated with a broadcasting company or a language institute affiliated with a corporation, or other similar institution or organization."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Conversation instruction"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "The activity of teaching students how to communicate with each other in a foreign language at a foreign language school, educational institution, company, organization, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Teaching specific linguistics, literature, or interpretation/translation techniques in a foreign language does not constitute conversation instruction."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Place of activity"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreign language schools, educational institutions above elementary school level and their affiliated language institutes, language training centers affiliated with broadcasters and companies, and other similar institutions or organizations."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국어 학원 등의 강사"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 외국어를 모국어로 하는 국가의 국민으로서, 해당 외국어를 모국어로 하는 국가에서 대학 이상 졸업 및 학사 이상의 학위를 소지한 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동등 이상의 학력을 가진 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "모국어 국가에서 고등학교 또는 전문대학 졸업 후 국내 대학에서 학사 이상의 학위를 취득한 경우 자격 인정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "교육부 또는 시·도 교육감 주관으로 모집 선발된 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초·중·고등학교에서 근무하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "영어 모국어 국가 국민으로서, 출신국가에서 대학 졸업 후 학사 이상의 학위를 취득한 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "영어 모국어 국가(7개국): 미국, 영국, 캐나다, 남아공, 뉴질랜드, 호주, 아일랜드"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문인력 및 유학생의 비영어권 배우자에 대한 영어 회화지도 강사 허용"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Instructors at foreign language schools, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A national of the country whose native language is the foreign language, who has graduated from a university or higher school in the country whose native language is the foreign language and holds a bachelor's degree or higher, or the equivalent."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Graduated from a high school or vocational college in a country where the foreign language is the native language and holds a bachelor's degree or higher from a university in Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who have been recruited and selected by the Ministry of Education or a city or prefectural education inspectorate and intend to work in elementary, middle, or high schools."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Nationals of English-speaking countries who have graduated from a university in their country of origin with a bachelor's degree or higher."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Native English speaking countries (7 countries) : USA, UK, Canada, South Africa, New Zealand, Australia, Ireland"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Allows non-English-speaking spouses of professionals and international students to teach English conversation."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공적확인을 받은 학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위증 사본, 학위취득 증명서, 학위취득사실이 기재된 졸업증명서 중 1종 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공적확인을 받은 자국정부 발급 범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자국 전역의 범죄경력이 포함되어 있어야 함"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공적확인을 받은 제 3국 범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자국 이외의 국가에서 학위를 취득한 경우 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자국 범죄경력증명서 규정 준용"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자기건강확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최소 임금 요건: 당해 연도 최저임금 이상"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학원 또는 단체 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 심사에 필요한 참고자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "강사 활용 계획서, 수강생 및 직원 현황"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Officially verified academic credentials (only one of the following must be submitted: photocopy of diploma, certificate of completion, or graduation certificate indicating completion of degree)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Officially verified criminal background check from your home country (must include criminal convictions throughout your home country)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "An officially verified third country criminal background check: If you earned your degree outside of your home country, submit."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Home country criminal history certificate for compliance purposes"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Health Certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment contract (minimum wage requirement: at least the minimum wage of the current year), documents related to the establishment of an academy or organization"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Other references required for screening: Tutor utilization plan, student and employee status"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자격요건을 갖춘 외국인이 외국어전문학원, 초등학교 이상의 교육기관, 부설 어학연구소, 방송사 및 기업체 부설 어학연수원 등에서 외국어 회화지도를 할 수 있는 비자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "회화지도의 개념"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국어로 상호 의사소통하는 방법을 지도하는 활동"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어학, 문학, 통/번역 기법 지도는 회화지도에 해당하지 않음"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "활동 장소"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국어전문학원"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초등학교 이상의 교육기관 및 부설어학연구소"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "방송사 및 기업체 부설 어학연수원"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기타 이에 준하는 기관 또는 단체"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한: 1회 부여 시 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국어 학원 등의 강사"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해당 외국어를 모국어로 하는 국가의 국민으로서, 해당 외국어를 모국어로 하는 국가에서 대학 이상 졸업 및 학사 이상의 학위를 소지한 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동등 이상의 학력을 가진 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "모국어 국가에서 고등학교 또는 전문대학 졸업 후 국내 대학에서 학사 이상의 학위를 취득한 경우 자격 인정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "교육부 또는 시·도 교육감 주관으로 모집 선발된 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초·중·고등학교에서 근무하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "영어 모국어 국가 국민으로서, 출신국가에서 대학 졸업 후 학사 이상의 학위를 취득한 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "영어 모국어 국가(7개국): 미국, 영국, 캐나다, 남아공, 뉴질랜드, 호주, 아일랜드"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문인력 및 유학생의 비영어권 배우자에 대한 영어 회화지도 강사 허용"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공적확인을 받은 학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위증 사본, 학위취득 증명서, 학위취득사실이 기재된 졸업증명서 중 1종 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공적확인을 받은 자국정부 발급 범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자국 전역의 범죄경력이 포함되어 있어야 함"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공적확인을 받은 제 3국 범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자국 이외의 국가에서 학위를 취득한 경우 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자국 범죄경력증명서 규정 준용"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자기건강확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최소 임금 요건: 당해 연도 최저임금 이상"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학원 또는 단체 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 심사에 필요한 참고자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "강사 활용 계획서, 수강생 및 직원 현황"
      }
    ],
    "titleZh": "E-2 会话指导签证 - 外语教师",
    "titleVi": "Visa E-2 Giảng dạy đàm thoại - Giáo viên ngoại ngữ",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "符合资格要件的外国人在外语专业学院、小学以上的教育机构、附属语言研究所、广播电台及企业附属语言研修院等机构从事外语会话指导的签证" },
      { "kind": "bullet", "depth": 1, "text": "会话指导的概念" },
      { "kind": "bullet", "depth": 2, "text": "用外语指导相互沟通方法的活动" },
      { "kind": "bullet", "depth": 2, "text": "语言学、文学、口笔译技法的指导不属于会话指导" },
      { "kind": "bullet", "depth": 0, "text": "活动场所" },
      { "kind": "bullet", "depth": 1, "text": "外语专业学院" },
      { "kind": "bullet", "depth": 1, "text": "小学以上的教育机构及附属语言研究所" },
      { "kind": "bullet", "depth": 1, "text": "广播电台及企业附属语言研修院" },
      { "kind": "bullet", "depth": 1, "text": "其他同等性质的机构或团体" },
      { "kind": "bullet", "depth": 0, "text": "停留期限上限：单次授予 2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thị thực cho người nước ngoài đáp ứng yêu cầu, được giảng dạy đàm thoại ngoại ngữ tại trung tâm ngoại ngữ chuyên môn, cơ sở giáo dục từ tiểu học trở lên, viện nghiên cứu ngôn ngữ trực thuộc, đài phát thanh và trung tâm đào tạo ngôn ngữ thuộc doanh nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Khái niệm giảng dạy đàm thoại" },
      { "kind": "bullet", "depth": 2, "text": "Hoạt động giảng dạy phương pháp giao tiếp tương hỗ bằng ngoại ngữ" },
      { "kind": "bullet", "depth": 2, "text": "Việc giảng dạy ngôn ngữ học, văn học, kỹ thuật biên-phiên dịch không thuộc giảng dạy đàm thoại" },
      { "kind": "bullet", "depth": 0, "text": "Địa điểm hoạt động" },
      { "kind": "bullet", "depth": 1, "text": "Trung tâm ngoại ngữ chuyên môn" },
      { "kind": "bullet", "depth": 1, "text": "Cơ sở giáo dục từ tiểu học trở lên và viện nghiên cứu ngôn ngữ trực thuộc" },
      { "kind": "bullet", "depth": 1, "text": "Trung tâm đào tạo ngôn ngữ thuộc đài phát thanh và doanh nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Các cơ quan, tổ chức tương đương khác" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa: 2 năm cho mỗi lần cấp" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "外语学院等讲师" },
      { "kind": "bullet", "depth": 1, "text": "以该外语为母语国家的国民，且在该母语国家完成大学以上学业并取得学士以上学位者" },
      { "kind": "bullet", "depth": 1, "text": "拥有同等以上学历者" },
      { "kind": "bullet", "depth": 1, "text": "在母语国家高中或专科毕业后于韩国大学取得学士以上学位者也认定其资格" },
      { "kind": "bullet", "depth": 0, "text": "由教育部或市/道教育监主管招聘选拔者" },
      { "kind": "bullet", "depth": 1, "text": "拟在中小学（含小学）工作的人员" },
      { "kind": "bullet", "depth": 1, "text": "英语母语国家国民，在原属国大学毕业后取得学士以上学位者" },
      { "kind": "bullet", "depth": 1, "text": "英语母语国家（7 国）：美国、英国、加拿大、南非、新西兰、澳大利亚、爱尔兰" },
      { "kind": "bullet", "depth": 0, "text": "允许专业人才及留学生的非英语母语配偶担任英语会话指导讲师" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Giảng viên tại trung tâm ngoại ngữ, v.v." },
      { "kind": "bullet", "depth": 1, "text": "Công dân của nước có ngoại ngữ đó là tiếng mẹ đẻ, đã tốt nghiệp đại học trở lên và có bằng cử nhân trở lên tại nước có ngoại ngữ đó là tiếng mẹ đẻ" },
      { "kind": "bullet", "depth": 1, "text": "Người có học vấn tương đương trở lên" },
      { "kind": "bullet", "depth": 1, "text": "Người tốt nghiệp THPT hoặc cao đẳng tại nước có tiếng mẹ đẻ và lấy bằng cử nhân trở lên tại đại học Hàn Quốc cũng được công nhận" },
      { "kind": "bullet", "depth": 0, "text": "Người được Bộ Giáo dục hoặc Sở Giáo dục thành phố/tỉnh tuyển chọn" },
      { "kind": "bullet", "depth": 1, "text": "Người dự định làm việc tại trường tiểu học, trung học, trung học phổ thông" },
      { "kind": "bullet", "depth": 1, "text": "Công dân các nước nói tiếng Anh, đã tốt nghiệp đại học và có bằng cử nhân trở lên tại nước xuất thân" },
      { "kind": "bullet", "depth": 1, "text": "Các nước nói tiếng Anh là tiếng mẹ đẻ (7 nước): Mỹ, Anh, Canada, Nam Phi, New Zealand, Úc, Ireland" },
      { "kind": "bullet", "depth": 0, "text": "Cho phép vợ/chồng không nói tiếng Anh của chuyên gia và du học sinh được làm giáo viên giảng dạy đàm thoại tiếng Anh" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放认定申请书" },
      { "kind": "bullet", "depth": 0, "text": "护照" },
      { "kind": "bullet", "depth": 0, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "经公证的学历证明" },
      { "kind": "bullet", "depth": 1, "text": "学位证副本、学位取得证明、注明学位取得事实的毕业证明中任选一种提交" },
      { "kind": "bullet", "depth": 0, "text": "经公证的本国政府发行的无犯罪记录证明" },
      { "kind": "bullet", "depth": 1, "text": "须包含本国全境的犯罪记录" },
      { "kind": "bullet", "depth": 0, "text": "经公证的第三国无犯罪记录证明" },
      { "kind": "bullet", "depth": 1, "text": "在本国以外国家取得学位时提交" },
      { "kind": "bullet", "depth": 0, "text": "适用本国无犯罪记录证明的相关规定" },
      { "kind": "bullet", "depth": 0, "text": "自我健康确认书" },
      { "kind": "bullet", "depth": 0, "text": "雇佣合同" },
      { "kind": "bullet", "depth": 1, "text": "最低工资要件：当年最低工资以上" },
      { "kind": "bullet", "depth": 0, "text": "学院或团体设立相关材料" },
      { "kind": "bullet", "depth": 0, "text": "其他审核所需参考资料" },
      { "kind": "bullet", "depth": 1, "text": "讲师使用计划书、学员及职员现状" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp giấy phép cấp thị thực" },
      { "kind": "bullet", "depth": 0, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 0, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Giấy chứng nhận học lực đã được công chứng" },
      { "kind": "bullet", "depth": 1, "text": "Nộp 1 trong các loại sau: bản sao bằng cấp, giấy chứng nhận đã đạt bằng, hoặc giấy chứng nhận tốt nghiệp có ghi việc đã đạt bằng" },
      { "kind": "bullet", "depth": 0, "text": "Lý lịch tư pháp do Chính phủ nước nhà cấp đã được công chứng" },
      { "kind": "bullet", "depth": 1, "text": "Phải bao gồm lý lịch tư pháp trên toàn quốc gia của bạn" },
      { "kind": "bullet", "depth": 0, "text": "Lý lịch tư pháp nước thứ ba đã được công chứng" },
      { "kind": "bullet", "depth": 1, "text": "Nộp khi đã lấy bằng tại nước khác ngoài nước nhà" },
      { "kind": "bullet", "depth": 0, "text": "Áp dụng tương tự quy định lý lịch tư pháp của nước nhà" },
      { "kind": "bullet", "depth": 0, "text": "Giấy tự xác nhận sức khoẻ" },
      { "kind": "bullet", "depth": 0, "text": "Hợp đồng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Yêu cầu mức lương tối thiểu: từ mức lương tối thiểu của năm đó trở lên" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến việc thành lập trung tâm hoặc tổ chức" },
      { "kind": "bullet", "depth": 0, "text": "Tài liệu tham khảo khác cần thiết cho việc xét duyệt" },
      { "kind": "bullet", "depth": 1, "text": "Kế hoạch sử dụng giảng viên, hiện trạng học viên và nhân viên" }
    ]
  },
  "E-3": {
    "titleKo": "E-3 연구 비자 - 과학기술/인문학/예체능 연구",
    "titleEn": "E-3 Research - Research in Science & Technology/Humanities/Arts",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자연과학분야의 연구 또는 산업상 고도기술의 연구개발 종사"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고급과학기술인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사회과학 인문학 예체능 분야의 연구 인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Engaged in research and development in the natural sciences or advanced technologies in industry"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Advanced scientific and technological personnel"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Researchers in the social sciences, humanities, and the arts"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay per grant: 5 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "특정 연구기관 육성법, 정부출연 연구기관 등의 설립, 운영 및 육성에 관한 법률, 과학기술분야 정부출연연구기관 등의 설립, 운영 및 육성에 관한 법률에 의한 연구기관에서 자연과학, 사회과학, 인문학, 예체능 분야의 연구 또는 산업상의 고도기술의 연구개발에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "방위사업법의 규정에 의한 연구기관에서 연구 활동에 종사하는 과학기술자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "산업기술혁신촉진법 등 관련법령에 따라 자연과학분야 또는 산업상의 고도산업기술을 개발하기 위하여 다음의 기관 또는 단체와 계약을 맺어 동기관 또는 단체에서 연구하는 과학기술자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "정부출연연구소, 국/공립연구소, 기업부설연구소 등 이공계 연구기관에서 자연과학분야의 연구 또는 산업상 고도기술의 연구개발에 종사하고자 하는 자로서 과학기술정보통신부장관의 고용추천이 있는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문대학 이상의 교육기관 또는 기타 학술연구기관 등에서 사회과학, 인문학, 예체능 분야의 연구를 하고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자격 요건"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "박사 학위 소지자 (취득 예정자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "석사 학위 소지자로서 3년 이상 경력자 (단, 국내 석사학위 소지자 경력 요건 면제)"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons engaged in research and development of natural sciences, social sciences, humanities, and performing arts or advanced technologies for industry at research institutes under the Act on the Development of Specific Research Institutions, the Act on the Establishment, Operation, and Development of Government-funded Research Institutions, and the Act on the Establishment, Operation, and Development of Government-funded Research Institutions in the Field of Science and Technology."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Scientists and engineers engaged in research activities at research institutions under the provisions of the Defense Acquisition Program Act."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Scientists and engineers who have signed a contract with the following institutions or organizations to develop advanced industrial technology in the field of natural sciences or industry in accordance with relevant laws such as the Industrial Technology Innovation Promotion Act."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who intends to engage in research in the field of natural sciences or research and development of advanced industrial technology at a research institute in the field of science and technology, such as a government-funded research institute, national/public research institute, or company-affiliated research institute, and has been recommended for employment by the Minister of Science and ICT."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who wish to conduct research in the fields of social sciences, humanities, and performing arts at educational institutions such as colleges and universities or other academic research institutions."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Qualifications"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Doctoral degree holder (to be obtained)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Master's degree holder with at least 3 years of experience (however, the experience requirement for domestic master's degree holders is exempted)"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용기관 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 또는 법인등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연구기관 입증서류 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "석사 학위 이상 학위증, 경력증명서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서 또는 임용예정확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대학 대표자 명의로 발급된 증명서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "졸업예정증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "확인서 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위수여 날짜를 확인할 수 있는 증명서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application for authorization to issue a visa, passport, and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to the establishment of the employing organization (business license or full certificate of incorporation or proof of research institution, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Master's degree or higher degree certificate, work experience certificate (if applicable)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment contract or confirmation of appointment"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Graduation certificate, confirmation letter, etc. issued in the name of the university representative, and a certificate confirming the date of the degree award (Applicant)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자연과학분야의 연구 또는 산업상 고도기술의 연구개발 종사"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고급과학기술인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사회과학 인문학 예체능 분야의 연구 인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "특정 연구기관 육성법, 정부출연 연구기관 등의 설립, 운영 및 육성에 관한 법률, 과학기술분야 정부출연연구기관 등의 설립, 운영 및 육성에 관한 법률에 의한 연구기관에서 자연과학, 사회과학, 인문학, 예체능 분야의 연구 또는 산업상의 고도기술의 연구개발에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "방위사업법의 규정에 의한 연구기관에서 연구 활동에 종사하는 과학기술자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "산업기술혁신촉진법 등 관련법령에 따라 자연과학분야 또는 산업상의 고도산업기술을 개발하기 위하여 다음의 기관 또는 단체와 계약을 맺어 동기관 또는 단체에서 연구하는 과학기술자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "정부출연연구소, 국/공립연구소, 기업부설연구소 등 이공계 연구기관에서 자연과학분야의 연구 또는 산업상 고도기술의 연구개발에 종사하고자 하는 자로서 과학기술정보통신부장관의 고용추천이 있는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문대학 이상의 교육기관 또는 기타 학술연구기관 등에서 사회과학, 인문학, 예체능 분야의 연구를 하고자 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "자격 요건"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "박사 학위 소지자 (취득 예정자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "석사 학위 소지자로서 3년 이상 경력자 (단, 국내 석사학위 소지자 경력 요건 면제)"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용기관 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 또는 법인등기사항전부증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연구기관 입증서류 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "석사 학위 이상 학위증, 경력증명서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서 또는 임용예정확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대학 대표자 명의로 발급된 증명서 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "졸업예정증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "확인서 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "학위수여 날짜를 확인할 수 있는 증명서"
      }
    ],
    "titleZh": "E-3 研究签证 - 科技/人文/艺术体育领域研究",
    "titleVi": "Visa E-3 Nghiên cứu - Nghiên cứu khoa học công nghệ / nhân văn / nghệ thuật thể thao",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "从事自然科学领域的研究或产业领域高端技术的研发" },
      { "kind": "bullet", "depth": 0, "text": "高级科技人才" },
      { "kind": "bullet", "depth": 0, "text": "社会科学、人文学、艺术体育领域的研究人员" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：5 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Nghiên cứu trong lĩnh vực khoa học tự nhiên hoặc nghiên cứu phát triển công nghệ cao công nghiệp" },
      { "kind": "bullet", "depth": 0, "text": "Nhân lực khoa học công nghệ cao cấp" },
      { "kind": "bullet", "depth": 0, "text": "Nhân lực nghiên cứu trong lĩnh vực khoa học xã hội, nhân văn, nghệ thuật thể thao" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 5 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "依据《特定研究机构培育法》《政府出资研究机构等的设立、运营及培育法》《科学技术领域政府出资研究机构等的设立、运营及培育法》在研究机构从事自然科学、社会科学、人文学、艺术体育领域研究或产业高端技术研发的人员" },
      { "kind": "bullet", "depth": 0, "text": "依据《国防事业法》在研究机构从事研究活动的科技人员" },
      { "kind": "bullet", "depth": 0, "text": "依据《产业技术革新促进法》等相关法令，为开发自然科学领域或产业高端技术，与下列机构或团体签订合同并在该机构或团体从事研究的科技人员" },
      { "kind": "bullet", "depth": 1, "text": "在政府出资研究所、国/公立研究所、企业附属研究所等理工系研究机构从事自然科学领域研究或产业高端技术研发的人员，且经科学技术信息通信部长官雇佣推荐者" },
      { "kind": "bullet", "depth": 0, "text": "在专科大学以上的教育机构或其他学术研究机构从事社会科学、人文学、艺术体育领域研究的人员" },
      { "kind": "bullet", "depth": 0, "text": "资格要件" },
      { "kind": "bullet", "depth": 1, "text": "博士学位持有者（即将取得者）" },
      { "kind": "bullet", "depth": 1, "text": "硕士学位持有者且具有 3 年以上经历者（但国内硕士学位持有者免除经历要件）" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người tham gia nghiên cứu trong lĩnh vực khoa học tự nhiên, khoa học xã hội, nhân văn, nghệ thuật thể thao hoặc nghiên cứu phát triển công nghệ cao công nghiệp tại cơ quan nghiên cứu theo Luật Khuyến khích Cơ quan Nghiên cứu Đặc biệt, Luật về Thành lập, Vận hành và Khuyến khích Cơ quan Nghiên cứu Do Chính phủ Tài trợ, Luật về Thành lập, Vận hành và Khuyến khích Cơ quan Nghiên cứu Do Chính phủ Tài trợ trong Lĩnh vực Khoa học và Công nghệ" },
      { "kind": "bullet", "depth": 0, "text": "Nhà khoa học công nghệ tham gia hoạt động nghiên cứu tại cơ quan nghiên cứu theo quy định của Luật Mua sắm Quốc phòng" },
      { "kind": "bullet", "depth": 0, "text": "Nhà khoa học công nghệ ký hợp đồng với các cơ quan/tổ chức sau và nghiên cứu tại đó để phát triển công nghệ cao trong lĩnh vực khoa học tự nhiên hoặc công nghiệp theo Luật Khuyến khích Đổi mới Công nghệ Công nghiệp và các luật liên quan" },
      { "kind": "bullet", "depth": 1, "text": "Người được Bộ trưởng Khoa học và Công nghệ Thông tin Truyền thông giới thiệu tuyển dụng, để làm việc tại viện nghiên cứu do chính phủ tài trợ, viện nghiên cứu công lập, viện nghiên cứu trực thuộc doanh nghiệp, v.v., trong nghiên cứu khoa học tự nhiên hoặc nghiên cứu phát triển công nghệ cao công nghiệp" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn nghiên cứu trong các lĩnh vực khoa học xã hội, nhân văn, nghệ thuật thể thao tại cơ sở giáo dục cao đẳng trở lên hoặc cơ quan nghiên cứu học thuật khác" },
      { "kind": "bullet", "depth": 0, "text": "Yêu cầu tư cách" },
      { "kind": "bullet", "depth": 1, "text": "Người có bằng tiến sĩ (hoặc sắp lấy)" },
      { "kind": "bullet", "depth": 1, "text": "Người có bằng thạc sĩ và 3 năm kinh nghiệm trở lên (riêng người có bằng thạc sĩ trong nước được miễn yêu cầu kinh nghiệm)" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放认定申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "雇佣机构设立相关材料" },
      { "kind": "bullet", "depth": 1, "text": "营业执照或法人登记事项全部证明" },
      { "kind": "bullet", "depth": 1, "text": "研究机构证明材料等" },
      { "kind": "bullet", "depth": 0, "text": "硕士学位以上学位证、经历证明（适用者）" },
      { "kind": "bullet", "depth": 0, "text": "雇佣合同或拟任用确认书" },
      { "kind": "bullet", "depth": 0, "text": "以大学代表名义发行的证明书（适用者）" },
      { "kind": "bullet", "depth": 1, "text": "毕业预定证明" },
      { "kind": "bullet", "depth": 1, "text": "确认书等" },
      { "kind": "bullet", "depth": 1, "text": "可确认学位授予日期的证明" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến việc thành lập cơ quan tuyển dụng" },
      { "kind": "bullet", "depth": 1, "text": "Giấy phép kinh doanh hoặc giấy chứng nhận tất cả các mục đăng ký pháp nhân" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh cơ quan nghiên cứu, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Bằng thạc sĩ trở lên, giấy chứng nhận kinh nghiệm (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 0, "text": "Hợp đồng lao động hoặc giấy xác nhận dự kiến bổ nhiệm" },
      { "kind": "bullet", "depth": 0, "text": "Giấy chứng nhận do người đại diện trường đại học cấp (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận dự kiến tốt nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Giấy xác nhận, v.v." },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận có thể xác nhận ngày cấp bằng" }
    ]
  },
  "E-4": {
    "titleKo": "E-4 기술지도 비자 - 특수산업 기술자",
    "titleEn": "E-4 Technological Guidance - Specialized Industry Technician",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공,사기관에서 자연과학분야의 전문지식 또는 산업상의 특수분야에 속하는 기술 제공"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Provide expertise in the natural sciences or specialized skills in industry in a public or private organization."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay: 5 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내에서 구할 수 없는 산업상의 고도기술 등을 국내 공 사,기관에 제공하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 용역발주업체에서 파견되어 산업상의 특수분야에 속하는 기술을 제공하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 산업체에서 도입한 특수기술 등을 제공하는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who provides advanced industrial technology that is not available in Korea to domestic public corporations and institutions."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who is dispatched by a foreign service provider to provide technology belonging to a specialized field of industry."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Providing specialized technologies introduced by domestic industrial companies."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공사기관 설립관련 서류: 사업자등록증, 외국인투자기업등록증, 지사설치허가서 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기술 도입계약 신고수리서, 기술도입계약서(또는 용역거래 계약서)또는 방산업체 지정서 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견명령서 (또는 재직증명서)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa issuance authorization application, passport, and one standardized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to the establishment of a construction organization: business license, foreign-invested enterprise registration certificate, branch establishment license, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of technology introduction contract notification certificate, technology introduction contract (or service contract), or defense contractor designation letter"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Dispatch order (or certificate of employment)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공,사기관에서 자연과학분야의 전문지식 또는 산업상의 특수분야에 속하는 기술 제공"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내에서 구할 수 없는 산업상의 고도기술 등을 국내 공 사,기관에 제공하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국의 용역발주업체에서 파견되어 산업상의 특수분야에 속하는 기술을 제공하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 산업체에서 도입한 특수기술 등을 제공하는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공사기관 설립관련 서류: 사업자등록증, 외국인투자기업등록증, 지사설치허가서 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기술 도입계약 신고수리서, 기술도입계약서(또는 용역거래 계약서)또는 방산업체 지정서 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "파견명령서 (또는 재직증명서)"
      }
    ],
    "titleZh": "E-4 技术指导签证 - 特殊产业技术人员",
    "titleVi": "Visa E-4 Chuyển giao công nghệ - Kỹ thuật viên ngành công nghiệp đặc thù",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "向公私机构提供自然科学领域专业知识或产业特殊领域的技术" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：5 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Cung cấp tri thức chuyên môn lĩnh vực khoa học tự nhiên hoặc kỹ thuật thuộc lĩnh vực công nghiệp đặc thù tại các cơ quan công và tư" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 5 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "向韩国公私机构提供国内无法获得的产业高端技术者" },
      { "kind": "bullet", "depth": 0, "text": "由国外服务发包公司派遣，提供产业特殊领域技术者" },
      { "kind": "bullet", "depth": 0, "text": "提供韩国产业体引进的特殊技术者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người cung cấp công nghệ cao công nghiệp không thể tìm được trong nước cho các cơ quan công và tư của Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Người được công ty đặt hàng dịch vụ ở nước ngoài phái cử để cung cấp kỹ thuật thuộc lĩnh vực công nghiệp đặc thù" },
      { "kind": "bullet", "depth": 0, "text": "Người cung cấp các kỹ thuật đặc biệt được doanh nghiệp Hàn Quốc đưa vào" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放认定申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "公私机构设立相关材料：营业执照、外商投资企业登记证、分支机构设立许可证等" },
      { "kind": "bullet", "depth": 0, "text": "技术引进合同申报受理书、技术引进合同（或服务交易合同）或防卫产业体指定书副本" },
      { "kind": "bullet", "depth": 0, "text": "派遣命令书（或在职证明）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến việc thành lập cơ quan công/tư: giấy phép kinh doanh, giấy đăng ký doanh nghiệp đầu tư nước ngoài, giấy phép thiết lập chi nhánh, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Giấy tiếp nhận khai báo hợp đồng đưa vào công nghệ, hợp đồng đưa vào công nghệ (hoặc hợp đồng giao dịch dịch vụ), hoặc bản sao giấy chỉ định doanh nghiệp công nghiệp quốc phòng" },
      { "kind": "bullet", "depth": 0, "text": "Lệnh phái cử (hoặc giấy chứng nhận đang công tác)" }
    ]
  },
  "E-5": {
    "titleKo": "E-5 전문직업 비자 - 국가공인자격증 보유 외국인",
    "titleEn": "E-5 Specialty Occupation - Foreigners with Nationally Recognized Certification",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 법률에 의하여 인정된 외국의 국가공인자격증을 소지한 자로서 대한민국의 법률에 의하여 행할 수 있도록 되어 있는 전문업무 종사"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Holders of a foreign national certification recognized by the laws of the Republic of Korea and engaged in professional activities authorized by the laws of the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 5 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 법률에 의하여 인정된 외국의 국가공인자격증을 소지한 자로서 대한민국 법률에 의해 활동이 허용된 경우"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국토해양부장관의 추천을 받은 항공기조종사"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최신의학 및 첨단의술 보유자로서 보건복지부장관의 고용추천을 받아 아래 의료기관에 근무하고자 하는 의사"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국가 또는 지방자치단체 의료기관"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "의료법인"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "비영리법인"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "정부투자기관이 개설한 의료기관"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내의 의(치)과 대학 졸업 후 대학부속병원 또는 보건복지부장관이 지정한 병원 등에서 인턴/레지던트 과정을 연수하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "남북교류 협력에 관한 법률에 따라 남북협력사업 승인을 받은 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "금강산 관광개발사업 등의 목적으로 초청된 관광선 운항에 필요한 선박 등의 필수전문인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 운수회사 등에 고용되어 선장 등 선박 운항의 필수전문요원으로 근무하고자 하는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who holds a nationally recognized certificate of a foreign country that is recognized under the laws of the Republic of Korea and is authorized to operate under the laws of the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Aircraft pilots recommended by the Minister of Land, Infrastructure, and Maritime Affairs"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Doctors who possess the latest medical and technological skills and are recommended for employment by the Minister of Health and Welfare to work in the following medical institutions: national or local government medical institutions, medical corporations, non-profit corporations, and medical institutions opened by government-funded organizations."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who have graduated from a medical or dental school in Korea and are training for internship or residency at a university-affiliated hospital or a hospital designated by the Minister of Health and Welfare."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Necessary specialized personnel such as ships required for the operation of tourist vessels invited by an organization that has been approved for inter-Korean cooperation under the provisions of the Act on Inter-Korean Exchange and Cooperation for the purpose of Kumgangsan Tourism Development Project, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who are employed by a domestic transportation company and intend to work as a captain or other essential professional personnel for ship operation."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "초청사유서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학위증 및 자격증(면허증) 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소관 중앙행정기관 장의 고용추천서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "경제자유구역 내 취업활동 시: 관할 특별시장, 광역시장, 도지사의 고용추천서 또는 고용의 필요성을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa application form, passport, one standardized photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Letter of invitation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copies of diplomas and certificates (licenses)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment recommendation letter from the head of the competent central administrative agency (however, for those who intend to work in the free economic zone, an employment recommendation letter from the competent special mayor, metropolitan mayor, or prefectural governor is required) or documents that demonstrate the need for employment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment contract"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 법률에 의하여 인정된 외국의 국가공인자격증을 소지한 자로서 대한민국의 법률에 의하여 행할 수 있도록 되어 있는 전문업무 종사"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 법률에 의하여 인정된 외국의 국가공인자격증을 소지한 자로서 대한민국 법률에 의해 활동이 허용된 경우"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국토해양부장관의 추천을 받은 항공기조종사"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최신의학 및 첨단의술 보유자로서 보건복지부장관의 고용추천을 받아 아래 의료기관에 근무하고자 하는 의사"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국가 또는 지방자치단체 의료기관"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "의료법인"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "비영리법인"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "정부투자기관이 개설한 의료기관"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내의 의(치)과 대학 졸업 후 대학부속병원 또는 보건복지부장관이 지정한 병원 등에서 인턴/레지던트 과정을 연수하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "남북교류 협력에 관한 법률에 따라 남북협력사업 승인을 받은 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "금강산 관광개발사업 등의 목적으로 초청된 관광선 운항에 필요한 선박 등의 필수전문인력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내 운수회사 등에 고용되어 선장 등 선박 운항의 필수전문요원으로 근무하고자 하는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "초청사유서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학위증 및 자격증(면허증) 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소관 중앙행정기관 장의 고용추천서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "경제자유구역 내 취업활동 시: 관할 특별시장, 광역시장, 도지사의 고용추천서 또는 고용의 필요성을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용계약서"
      }
    ],
    "titleZh": "E-5 专门职业签证 - 持有国家公认资格证的外国人",
    "titleVi": "Visa E-5 Nghề chuyên môn - Người nước ngoài có chứng chỉ quốc gia công nhận",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "持有依据韩国法律认可的外国国家公认资格证，从事韩国法律允许执业的专业业务" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：5 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người sở hữu chứng chỉ quốc gia của nước ngoài được pháp luật Đại Hàn Dân Quốc công nhận, thực hiện công việc chuyên môn được phép theo pháp luật Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 5 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "持有依据韩国法律认可的外国国家公认资格证，且依据韩国法律允许活动者" },
      { "kind": "bullet", "depth": 1, "text": "经国土海洋部长官推荐的飞行员" },
      { "kind": "bullet", "depth": 1, "text": "拥有最新医学及尖端医术，经保健福祉部长官雇佣推荐，欲在以下医疗机构工作的医生" },
      { "kind": "bullet", "depth": 2, "text": "国家或地方自治团体医疗机构" },
      { "kind": "bullet", "depth": 2, "text": "医疗法人" },
      { "kind": "bullet", "depth": 2, "text": "非营利法人" },
      { "kind": "bullet", "depth": 2, "text": "由政府投资机构开设的医疗机构" },
      { "kind": "bullet", "depth": 0, "text": "在韩国医（齿）科大学毕业后，于大学附属医院或保健福祉部长官指定的医院进行实习/住院医师培训者" },
      { "kind": "bullet", "depth": 0, "text": "依据《关于南北交流合作的法律》获得南北合作事业批准者" },
      { "kind": "bullet", "depth": 1, "text": "为金刚山观光开发事业等目的，被邀请进行观光船运营所需船舶等必要专业人员" },
      { "kind": "bullet", "depth": 0, "text": "受雇于韩国运输公司等，欲担任船长等船舶运营必要专业人员者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người sở hữu chứng chỉ quốc gia của nước ngoài được pháp luật Hàn Quốc công nhận và được phép hoạt động theo pháp luật Hàn Quốc" },
      { "kind": "bullet", "depth": 1, "text": "Phi công được Bộ trưởng Đất đai, Hạ tầng và Hàng hải giới thiệu" },
      { "kind": "bullet", "depth": 1, "text": "Bác sĩ có y học hiện đại và kỹ thuật y tế tiên tiến, được Bộ trưởng Y tế và Phúc lợi giới thiệu tuyển dụng để làm việc tại các cơ sở y tế sau" },
      { "kind": "bullet", "depth": 2, "text": "Cơ sở y tế của Nhà nước hoặc chính quyền địa phương" },
      { "kind": "bullet", "depth": 2, "text": "Pháp nhân y tế" },
      { "kind": "bullet", "depth": 2, "text": "Pháp nhân phi lợi nhuận" },
      { "kind": "bullet", "depth": 2, "text": "Cơ sở y tế do tổ chức được Chính phủ đầu tư mở" },
      { "kind": "bullet", "depth": 0, "text": "Người tốt nghiệp đại học y (nha) khoa tại Hàn Quốc và đào tạo nội trú/bác sĩ thực tập tại bệnh viện trực thuộc đại học hoặc bệnh viện do Bộ trưởng Y tế và Phúc lợi chỉ định" },
      { "kind": "bullet", "depth": 0, "text": "Người được phê duyệt dự án hợp tác liên Triều theo Luật về Trao đổi và Hợp tác Liên Triều" },
      { "kind": "bullet", "depth": 1, "text": "Nhân lực chuyên môn cốt lõi cho tàu vận hành du lịch được mời cho dự án phát triển du lịch Núi Kumgang, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Người được tuyển dụng bởi công ty vận tải trong nước để làm thuyền trưởng hoặc nhân lực cốt lõi cho vận hành tàu" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 0, "text": "邀请理由书" },
      { "kind": "bullet", "depth": 0, "text": "学位证及资格证（执业证）副本" },
      { "kind": "bullet", "depth": 0, "text": "主管中央行政机关首长的雇佣推荐书" },
      { "kind": "bullet", "depth": 1, "text": "在经济自由区域内就业时：管辖特别市长、广域市长、道知事的雇佣推荐书或可证明雇佣必要性的材料" },
      { "kind": "bullet", "depth": 0, "text": "雇佣合同" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 0, "text": "Lý do mời" },
      { "kind": "bullet", "depth": 0, "text": "Bản sao bằng cấp và chứng chỉ (giấy phép hành nghề)" },
      { "kind": "bullet", "depth": 0, "text": "Thư giới thiệu tuyển dụng của lãnh đạo cơ quan hành chính trung ương phụ trách" },
      { "kind": "bullet", "depth": 1, "text": "Khi hoạt động làm việc trong khu kinh tế tự do: thư giới thiệu tuyển dụng của Thị trưởng đặc biệt, Thị trưởng thành phố trực thuộc, hoặc Tỉnh trưởng quản hạt, hoặc giấy tờ chứng minh sự cần thiết của việc tuyển dụng" },
      { "kind": "bullet", "depth": 0, "text": "Hợp đồng lao động" }
    ]
  },
  "E-6": {
    "titleKo": "E-6 예술흥행 비자 - 영리적 예술 및 연예 활동",
    "titleEn": "E-6 Culture and Entertainment - Arts&Entertainment Activities",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-1 (예술, 연예)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수익이 따르는 음악, 미술, 문학 등의 예술활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "전문 방송연기에 해당하는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공연법의 규정에 의한 전문 연예활동 종사자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "작곡가, 화가, 사진작가"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "오케스트라 연주자, 지휘자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "광고, 패션모델, 바둑기사"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "방송인, 연예인, 연극인, 분장사 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-2 (호텔, 유흥)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "E-6-1에 해당하지 않는 경우"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "관광진흥법에 의한 호텔업시설, 유흥업소 등에서 공연 또는 연예활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "가수, 연주자, 곡예사, 마술사 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-3 (운동)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "축구, 야구, 농구 등 프로 운동선수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동행 매니저 등으로 운동 분야에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "프로팀 감독, 매니저 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한: 1회 부여 시 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-1 (Arts, Entertainment)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Profitable artistic activities such as music, art, literature, and professional broadcast acting, and those engaged in professional entertainment activities under the provisions of the Performance Act (composers, painters, photographers, and other artists, orchestra performers, conductors, advertising, fashion models, go players, broadcasters, entertainers, theater performers, makeup artists, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-2 (Hotel, entertainment)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Persons who do not fall under E-6-1 and are engaged in performance or entertainment activities in hotel facilities or entertainment establishments under the Tourism Promotion Act (singers, performers, acrobats, magicians, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-3 (Athletes)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Professional athletes such as soccer, baseball, basketball, etc. and their accompanying managers, etc. who are engaged in the field of athletics (manager of a professional team of professional athletes such as soccer, baseball, basketball, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 2 years."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익이 따르는 예술 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "음악, 미술, 문학 등의 예술 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "창작활동을 하는 예술가: 작곡가, 화가, 조각가, 공예가, 저술가, 사진작가"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "음악, 미술, 문학, 사진, 연주, 무용, 영화, 체육 등 예술상의 활동 지도를 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "예: 프로 및 아마추어 스포츠 감독, 오케스트라 지휘자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익을 목적으로 하는 흥행활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연예, 연주, 연극, 운동경기, 광고, 패션모델 등으로 출연하는 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출연형태나 명목 불문, 개인 또는 단체로 연예, 연주, 연극, 운동 등을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "예: 프로 및 아마추어 스포츠 선수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동행하는 자를 포함 (예: 분장사, 매니저 등)"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Artistic endeavors, such as music art and literature, that pay."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Artists, such as composers, painters, sculptors, craftspeople, authors, and photographers, who are engaged in creative endeavors."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Those who provide instruction in music, art, literature, photography, performance, dance, film, athletics, or other artistic endeavors (e.g., professional and amateur sports managers, orchestra conductors, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Performing in entertainment, performance, theater, athletics, advertising, fashion modeling, etc. for profit."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Individuals or organizations that perform entertainment, performances, theater, athletics, etc. for profit, regardless of the form or name of the performance (e.g., professional and amateur athletes)."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Includes not only those who intend to appear in entertainment, performance, theater, etc. on their own, but also those who accompany them, such as makeup artists and managers."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공연법 규정에 의한 공연"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필요 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "영상물등급위원회(또는 제주특별자치도지사)의 공연추천서 (추천 제외 공연은 면제)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "공연계획서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "미성년자 초청 시 법정대리인의 동의서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광진흥법에 의한 호텔업시설 및 유흥업소에서의 공연 또는 연예활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필요 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "영상물등급위원회의 공연추천서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "연예활동계획서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "자격증명서 또는 경력증명서 (3년 이상, 아포스티유 또는 자국소재 대한민국 공관 확인 필)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "공연시설 현황 확인서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "미성년자 초청 시 법정대리인의 동의서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "근로자파견사업허가증 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "광고 모델"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필요 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "대중문화예술기획업 등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "부가가치세 과세표준증명 (매출과세표준)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "납세증명서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "기업의 건전성을 증빙하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서, 이력서, 보호자 동의서 (미성년인 경우)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국내활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "모델 전문성 입증 서류 (예: 광고촬영, 패션쇼 관련 계약서, 모델 사용 개요, 포트폴리오 등)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "If you plan to perform under the provisions of the Performance Act"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for visa authorization, passport, and one standardized photograph"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of business license"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of employment contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Performance recommendation letter from the Film Rating Board (Governor of Jeju Special Self-Governing Province) (Exemptions for performances not subject to recommendation)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Performance plan"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If the invitee is a minor, the consent form of the legal representative"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "If the applicant intends to engage in performances or entertainment activities in hotel facilities or entertainment venues under the Tourism Promotion Act"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance authorization application, passport, 1 standardized photo"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of business license"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of employment contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Performance recommendation letter from the Video Rating Board"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Entertainment activity plan"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of qualification or work experience (3 years or more, apostille or confirmation from the Korean Embassy in your country)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Confirmation of performance facility status"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If the invitee is a minor, consent form of legal representative"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Worker dispatch business license (if applicable)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "For advertising models"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance authorization application, passport, 1 standardized photo"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of business license"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of employment contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Popular culture and arts planning business registration certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of VAT taxable standard (sales taxable standard)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Tax payment certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Other documents proving the soundness of the company"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee, resume, parental consent form (for minors)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Domestic activity plan"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Other documents that prove the model's professionalism: contracts with advertisers for commercial shoots and fashion shows, outline of model use for commercial shoots and fashion shows (prepared by the advertiser), portfolio, etc."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-1 (예술, 연예)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수익이 따르는 음악, 미술, 문학 등의 예술활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "전문 방송연기에 해당하는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "공연법의 규정에 의한 전문 연예활동 종사자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "작곡가, 화가, 사진작가"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "오케스트라 연주자, 지휘자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "광고, 패션모델, 바둑기사"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "방송인, 연예인, 연극인, 분장사 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-2 (호텔, 유흥)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "E-6-1에 해당하지 않는 경우"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "관광진흥법에 의한 호텔업시설, 유흥업소 등에서 공연 또는 연예활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "가수, 연주자, 곡예사, 마술사 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-6-3 (운동)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "축구, 야구, 농구 등 프로 운동선수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동행 매니저 등으로 운동 분야에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "프로팀 감독, 매니저 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한: 1회 부여 시 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익이 따르는 예술 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "음악, 미술, 문학 등의 예술 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "창작활동을 하는 예술가: 작곡가, 화가, 조각가, 공예가, 저술가, 사진작가"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "음악, 미술, 문학, 사진, 연주, 무용, 영화, 체육 등 예술상의 활동 지도를 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "예: 프로 및 아마추어 스포츠 감독, 오케스트라 지휘자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익을 목적으로 하는 흥행활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "연예, 연주, 연극, 운동경기, 광고, 패션모델 등으로 출연하는 활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출연형태나 명목 불문, 개인 또는 단체로 연예, 연주, 연극, 운동 등을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "예: 프로 및 아마추어 스포츠 선수"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동행하는 자를 포함 (예: 분장사, 매니저 등)"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공연법 규정에 의한 공연"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필요 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "영상물등급위원회(또는 제주특별자치도지사)의 공연추천서 (추천 제외 공연은 면제)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "공연계획서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "미성년자 초청 시 법정대리인의 동의서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광진흥법에 의한 호텔업시설 및 유흥업소에서의 공연 또는 연예활동"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필요 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "영상물등급위원회의 공연추천서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "연예활동계획서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "자격증명서 또는 경력증명서 (3년 이상, 아포스티유 또는 자국소재 대한민국 공관 확인 필)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "공연시설 현황 확인서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "미성년자 초청 시 법정대리인의 동의서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "근로자파견사업허가증 (해당자)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "광고 모델"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "필요 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "대중문화예술기획업 등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "부가가치세 과세표준증명 (매출과세표준)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "납세증명서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "기업의 건전성을 증빙하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서, 이력서, 보호자 동의서 (미성년인 경우)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국내활동 계획서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "모델 전문성 입증 서류 (예: 광고촬영, 패션쇼 관련 계약서, 모델 사용 개요, 포트폴리오 등)"
      }
    ],
    "titleZh": "E-6 艺术演艺签证 - 营利性艺术及演艺活动",
    "titleVi": "Visa E-6 Nghệ thuật biểu diễn - Hoạt động nghệ thuật và biểu diễn vì lợi nhuận",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "E-6-1（艺术、演艺）" },
      { "kind": "bullet", "depth": 1, "text": "带有收益的音乐、美术、文学等艺术活动" },
      { "kind": "bullet", "depth": 1, "text": "符合专业广播表演者" },
      { "kind": "bullet", "depth": 1, "text": "依据《公演法》规定的专业演艺活动从事者" },
      { "kind": "bullet", "depth": 2, "text": "作曲家、画家、摄影师" },
      { "kind": "bullet", "depth": 2, "text": "管弦乐演奏家、指挥家" },
      { "kind": "bullet", "depth": 2, "text": "广告、时装模特、围棋棋手" },
      { "kind": "bullet", "depth": 2, "text": "广播人、演艺人、戏剧人、化妆师等" },
      { "kind": "bullet", "depth": 0, "text": "E-6-2（酒店、娱乐）" },
      { "kind": "bullet", "depth": 1, "text": "不属于 E-6-1 的情况" },
      { "kind": "bullet", "depth": 1, "text": "在依据《观光振兴法》设立的酒店业设施、娱乐场所等从事公演或演艺活动者" },
      { "kind": "bullet", "depth": 2, "text": "歌手、演奏者、杂技演员、魔术师等" },
      { "kind": "bullet", "depth": 0, "text": "E-6-3（运动）" },
      { "kind": "bullet", "depth": 1, "text": "足球、棒球、篮球等职业运动员" },
      { "kind": "bullet", "depth": 1, "text": "随行经理等从事运动领域者" },
      { "kind": "bullet", "depth": 2, "text": "职业球队监督、经理等" },
      { "kind": "bullet", "depth": 0, "text": "停留期限上限：单次授予 2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "E-6-1 (Nghệ thuật, biểu diễn)" },
      { "kind": "bullet", "depth": 1, "text": "Hoạt động nghệ thuật âm nhạc, mỹ thuật, văn học có thu nhập" },
      { "kind": "bullet", "depth": 1, "text": "Người diễn xuất phát thanh truyền hình chuyên nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Người tham gia hoạt động biểu diễn chuyên nghiệp theo quy định của Luật Biểu diễn" },
      { "kind": "bullet", "depth": 2, "text": "Nhà soạn nhạc, hoạ sĩ, nhiếp ảnh gia" },
      { "kind": "bullet", "depth": 2, "text": "Nghệ sĩ dàn nhạc, nhạc trưởng" },
      { "kind": "bullet", "depth": 2, "text": "Người mẫu quảng cáo, người mẫu thời trang, kỳ thủ cờ vây" },
      { "kind": "bullet", "depth": 2, "text": "Nhân viên truyền thông, nghệ sĩ giải trí, diễn viên kịch, chuyên viên hoá trang, v.v." },
      { "kind": "bullet", "depth": 0, "text": "E-6-2 (Khách sạn, giải trí)" },
      { "kind": "bullet", "depth": 1, "text": "Trường hợp không thuộc E-6-1" },
      { "kind": "bullet", "depth": 1, "text": "Người tham gia hoạt động biểu diễn hoặc giải trí tại cơ sở khách sạn, địa điểm giải trí theo Luật Khuyến khích Du lịch" },
      { "kind": "bullet", "depth": 2, "text": "Ca sĩ, nhạc công, nghệ sĩ tạp kỹ, ảo thuật gia, v.v." },
      { "kind": "bullet", "depth": 0, "text": "E-6-3 (Thể thao)" },
      { "kind": "bullet", "depth": 1, "text": "Vận động viên chuyên nghiệp như bóng đá, bóng chày, bóng rổ, v.v." },
      { "kind": "bullet", "depth": 1, "text": "Người làm việc trong lĩnh vực thể thao với tư cách người quản lý đi cùng, v.v." },
      { "kind": "bullet", "depth": 2, "text": "Huấn luyện viên đội chuyên nghiệp, người quản lý, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa: 2 năm cho mỗi lần cấp" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "带有收益的艺术活动" },
      { "kind": "bullet", "depth": 1, "text": "音乐、美术、文学等艺术活动" },
      { "kind": "bullet", "depth": 1, "text": "从事创作活动的艺术家：作曲家、画家、雕塑家、工艺家、著述家、摄影家" },
      { "kind": "bullet", "depth": 1, "text": "对音乐、美术、文学、摄影、演奏、舞蹈、电影、体育等艺术活动进行指导者" },
      { "kind": "bullet", "depth": 2, "text": "示例：职业及业余体育教练、管弦乐指挥" },
      { "kind": "bullet", "depth": 0, "text": "以盈利为目的的演艺活动" },
      { "kind": "bullet", "depth": 1, "text": "演艺、演奏、戏剧、运动比赛、广告、时装模特等出演活动" },
      { "kind": "bullet", "depth": 1, "text": "无论出演形式或名义，以个人或团体方式从事演艺、演奏、戏剧、运动等者" },
      { "kind": "bullet", "depth": 2, "text": "示例：职业及业余体育选手" },
      { "kind": "bullet", "depth": 1, "text": "包括随行人员（例：化妆师、经理等）" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Hoạt động nghệ thuật có thu nhập" },
      { "kind": "bullet", "depth": 1, "text": "Hoạt động nghệ thuật âm nhạc, mỹ thuật, văn học, v.v." },
      { "kind": "bullet", "depth": 1, "text": "Nghệ sĩ sáng tạo: nhà soạn nhạc, hoạ sĩ, nhà điêu khắc, nghệ nhân thủ công, nhà văn, nhiếp ảnh gia" },
      { "kind": "bullet", "depth": 1, "text": "Người hướng dẫn các hoạt động nghệ thuật như âm nhạc, mỹ thuật, văn học, nhiếp ảnh, biểu diễn, múa, điện ảnh, thể thao" },
      { "kind": "bullet", "depth": 2, "text": "Ví dụ: Huấn luyện viên thể thao chuyên nghiệp và nghiệp dư, nhạc trưởng dàn nhạc" },
      { "kind": "bullet", "depth": 0, "text": "Hoạt động biểu diễn vì mục đích lợi nhuận" },
      { "kind": "bullet", "depth": 1, "text": "Hoạt động biểu diễn nghệ thuật giải trí, biểu diễn, kịch, thi đấu thể thao, quảng cáo, người mẫu thời trang, v.v." },
      { "kind": "bullet", "depth": 1, "text": "Người biểu diễn cá nhân hoặc theo đoàn không phân biệt hình thức hoặc danh nghĩa, gồm giải trí, biểu diễn, kịch, thể thao, v.v." },
      { "kind": "bullet", "depth": 2, "text": "Ví dụ: Vận động viên thể thao chuyên nghiệp và nghiệp dư" },
      { "kind": "bullet", "depth": 1, "text": "Bao gồm người đi cùng (Ví dụ: chuyên viên hoá trang, người quản lý, v.v.)" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "依据《公演法》规定的公演" },
      { "kind": "bullet", "depth": 1, "text": "所需材料：" },
      { "kind": "bullet", "depth": 2, "text": "签证发放认定申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 2, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 2, "text": "雇佣合同副本" },
      { "kind": "bullet", "depth": 2, "text": "影像物等级委员会（或济州特别自治道知事）的公演推荐书（推荐除外的公演免除）" },
      { "kind": "bullet", "depth": 2, "text": "公演计划书" },
      { "kind": "bullet", "depth": 2, "text": "未成年人邀请时法定代理人的同意书" },
      { "kind": "bullet", "depth": 0, "text": "依据《观光振兴法》在酒店业设施及娱乐场所开展公演或演艺活动" },
      { "kind": "bullet", "depth": 1, "text": "所需材料：" },
      { "kind": "bullet", "depth": 2, "text": "签证发放认定申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 2, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 2, "text": "雇佣合同副本" },
      { "kind": "bullet", "depth": 2, "text": "影像物等级委员会的公演推荐书" },
      { "kind": "bullet", "depth": 2, "text": "演艺活动计划书" },
      { "kind": "bullet", "depth": 2, "text": "资格证明或经历证明（3 年以上，须经海牙认证或所在国韩国使领馆确认）" },
      { "kind": "bullet", "depth": 2, "text": "公演设施现状确认书" },
      { "kind": "bullet", "depth": 2, "text": "身份担保书" },
      { "kind": "bullet", "depth": 2, "text": "未成年人邀请时法定代理人的同意书" },
      { "kind": "bullet", "depth": 2, "text": "劳动者派遣事业许可证（适用者）" },
      { "kind": "bullet", "depth": 0, "text": "广告模特" },
      { "kind": "bullet", "depth": 1, "text": "所需材料：" },
      { "kind": "bullet", "depth": 2, "text": "签证发放认定申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 2, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 2, "text": "雇佣合同副本" },
      { "kind": "bullet", "depth": 2, "text": "大众文化艺术企划业登记证" },
      { "kind": "bullet", "depth": 2, "text": "增值税课税标准证明（销售课税标准）" },
      { "kind": "bullet", "depth": 2, "text": "纳税证明" },
      { "kind": "bullet", "depth": 2, "text": "证明企业健全性的材料" },
      { "kind": "bullet", "depth": 2, "text": "身份担保书、履历书、监护人同意书（未成年情况）" },
      { "kind": "bullet", "depth": 2, "text": "国内活动计划书" },
      { "kind": "bullet", "depth": 2, "text": "模特专业性证明材料（例：广告拍摄、时装秀相关合同、模特使用概要、作品集等）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Biểu diễn theo quy định của Luật Biểu diễn" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cần thiết:" },
      { "kind": "bullet", "depth": 2, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao hợp đồng lao động" },
      { "kind": "bullet", "depth": 2, "text": "Thư giới thiệu biểu diễn của Hội đồng Phân loại Phim ảnh (hoặc Tỉnh trưởng Tỉnh tự trị đặc biệt Jeju) (miễn đối với biểu diễn không thuộc diện đề xuất)" },
      { "kind": "bullet", "depth": 2, "text": "Kế hoạch biểu diễn" },
      { "kind": "bullet", "depth": 2, "text": "Đơn đồng ý của người đại diện pháp luật khi mời người chưa thành niên" },
      { "kind": "bullet", "depth": 0, "text": "Biểu diễn hoặc hoạt động nghệ thuật tại cơ sở khách sạn và địa điểm giải trí theo Luật Khuyến khích Du lịch" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cần thiết:" },
      { "kind": "bullet", "depth": 2, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao hợp đồng lao động" },
      { "kind": "bullet", "depth": 2, "text": "Thư giới thiệu biểu diễn của Hội đồng Phân loại Phim ảnh" },
      { "kind": "bullet", "depth": 2, "text": "Kế hoạch hoạt động biểu diễn" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận tư cách hoặc giấy chứng nhận kinh nghiệm (3 năm trở lên, có Apostille hoặc xác nhận của cơ quan đại diện Hàn Quốc tại nước nhà)" },
      { "kind": "bullet", "depth": 2, "text": "Giấy xác nhận hiện trạng cơ sở biểu diễn" },
      { "kind": "bullet", "depth": 2, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 2, "text": "Đơn đồng ý của người đại diện pháp luật khi mời người chưa thành niên" },
      { "kind": "bullet", "depth": 2, "text": "Giấy phép kinh doanh phái cử lao động (đối tượng áp dụng)" },
      { "kind": "bullet", "depth": 0, "text": "Người mẫu quảng cáo" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cần thiết:" },
      { "kind": "bullet", "depth": 2, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao hợp đồng lao động" },
      { "kind": "bullet", "depth": 2, "text": "Giấy đăng ký kinh doanh tổ chức nghệ thuật văn hoá đại chúng" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận cơ sở thuế giá trị gia tăng (cơ sở thuế doanh thu)" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận đã nộp thuế" },
      { "kind": "bullet", "depth": 2, "text": "Hồ sơ chứng minh tính lành mạnh của doanh nghiệp" },
      { "kind": "bullet", "depth": 2, "text": "Giấy bảo lãnh nhân thân, sơ yếu lý lịch, đơn đồng ý của người giám hộ (trường hợp chưa thành niên)" },
      { "kind": "bullet", "depth": 2, "text": "Kế hoạch hoạt động trong nước" },
      { "kind": "bullet", "depth": 2, "text": "Hồ sơ chứng minh tính chuyên nghiệp của người mẫu (Ví dụ: hợp đồng quảng cáo, biểu diễn thời trang, tổng quan sử dụng người mẫu, portfolio, v.v.)" }
    ]
  },
  "E-7": {
    "titleKo": "E-7 특정활동 비자 - 전문인력(정규직)",
    "titleEn": "E-7 Foreign National of Special Ability - Professional Workers",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-1 (전문인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "직종: 관리자 및 전문가 (67개 직종)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 법무부장관이 지정한 분야에서 전문적인 지식 및 기술을 가진 외국인력이 종사하는 활동."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-2 (준전문인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "직종: 사무 및 서비스종사자 (10개 직종)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 준전문적인 직무를 수행하는 외국인 인력."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-3 (일반기능인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "직종: 기능원 및 관련기능종사자 (10개 직종)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 특정 기능이 요구되는 일반적인 기술직무에 종사하는 외국인 인력."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-4 (숙련기능인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특징: 점수제로 3개 직종에서만 활동 가능."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 숙련된 기능과 경험을 바탕으로 국가경쟁력 강화를 위해 도입된 외국인력."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한:1회 부여 시 최대 3년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who intends to engage in activities specifically designated by the Minister of Justice under a contract with a public or private organization in the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "'Specified activities' means activities in areas designated by the Minister of Justice as particularly necessary to introduce foreign labor with specialized knowledge, skills, or abilities to strengthen national competitiveness, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-1: Professionals | Managers and Specialists (67 occupations)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-2: Semi-professional workers | Office and service workers (10 occupations)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-3: General Skilled Laborers | Craft and Related Skilled Workers (10 occupations)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-4: Skilled tradespersons (point system) | 3 occupations"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 3 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반 요건"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "도입직종과 연관성이 있는 분야의 석사 이상 학위 소지자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "도입직종과 연관성이 있는 학사 학위 소지 + 1년 이상의 해당 분야 경력"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "첨단기술(IT), 바이오, 나노 등 분야 종사자는 졸업 이전 인턴 경력을 근무 경력으로 인정."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산업발전법 제 5조에 따라 산업통상자원부장관이 고시하는 첨단기술 분야 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "도입직종과 연관성이 있는 분야에서 5년 이상의 근무 경력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "우대를 위한 특별 요건"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "세계 500대 기업 1년 이상 전문직종 근무 경력자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "세계 우수 대학 학사 학위 소지자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "전공분야 1년 이상의 경력 요건이 없더라도 고용 필요성이 인정되면 허용."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "타임誌 200대 대학 및 QS 세계대학순위 500위 이내 대학 졸업자."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 전문대학 졸업자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "관련 전공 도입허용 직종에 취업 시 1년 이상의 경력요건 면제, 고용 필요성이 인정되면 허용."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 대학 졸업 학사 이상 학위 소지자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "도입허용 직종에 취업 시 전공 무관, 고용 필요성이 인정되면 허용."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "학사 이상 학위자는 1년 이상의 경력요건 면제."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "일/학습연계유학(D-2-7)자격 졸업자는 국민 고용비율 면제."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고소득 전문직 우수인재"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "연간 총 수령보수가 전년도 1인당 국민총 소득(GNI)의 3배 이상인 경우, 직종에 관계없이 학력, 경력 모두 면제."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "주무부처장관의 고용추천 불필요."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "우수사설기관 연수 수료자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "해외 전문학사 이상 학력 소지자로, 해당 전공분야의 국내 연수과정(D-4-6, 20개월 이상)을 정상적으로 수료하고 국내 공인 자격증 및 사회통합프로그램 4단계 이상을 이수한 외국인은 해당 전공분야 자격변경 허용(E-7-4 분야 제외)."
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(General Requirements) Must meet one of the following requirements."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Master's degree or higher in a field related to the position to be filled."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Possession of a bachelor's degree in a field related to the introduced occupation plus at least one year of experience in the field (only experience after obtaining a degree certificate is recognized, but for those working in high-tech (IT), bio, nano, and other fields, internship experience in the field before graduation is recognized as work experience)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "High-tech fields notified by the Minister of Trade, Industry and Energy pursuant to Article 5 of the Industrial Development Act"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "At least 5 years of work experience in a field related to the introduced occupation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(Special requirements for preferential treatment) If you are engaged in an occupation that has set special requirements in order to attract outstanding talents and utilize fostered talents, and if you are engaged in an occupation that has set separate educational or work experience requirements in consideration of the characteristics of the occupation, you must meet those requirements."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Worked in a specialized job at a global 500 company for at least one year"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Bachelor's degree from a world-class university (planned)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "If you do not meet the requirements for at least one year of experience in your major field, you may be accepted if the need for employment is recognized."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Time Magazine 200 universities and QS World University Ranking 500 universities."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Graduates of domestic colleges and universities (planned)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "If you are employed in a permitted occupation related to your major subject, the one-year work experience requirement can be waived and the need for employment can be recognized."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Graduated from a domestic university with a bachelor's degree or higher"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Graduates with a bachelor's degree or higher are exempt from the national employment ratio if they are employed in a permitted occupation, regardless of their major subject, and if the need for employment is recognized."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Highly qualified professionals"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "If the total remuneration received per year is more than 3 times the GNI per capita of the previous year, both education and experience, regardless of the profession, can be exempted (no employment recommendation from the minister is required)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Graduates of excellent private institution training"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Foreigners with an overseas bachelor's degree or higher who have successfully completed a domestic training course (D-4-6, 20 months or more) in their field of specialization, obtained a domestic certificate, and completed at least four levels of a social integration program are allowed to change their qualifications to their field of specialization (except for E-7-4)."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 준비 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "통합 신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권, 신분증 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 직업 신고서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "집 계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "반명함판 칼라사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자격요건 입증 서류: 학위증, 경력증명서, 자격증 등"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국외 발급 서류는 국문 또는 영문 번역본 첨부"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "주요 핵심 서류는 영사 공증 또는 아포스티유 확인서 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사 준비 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증, 등기부등본 등 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 고용 필요성을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "초청 사유서, 외국인 활용계획서 등"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "소관 중앙행정기관 장의 고용 추천서 또는 관련 단체 추천서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "납부내역증명, 납세증명서, 지방세 납세증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "부가가치세 과세 표준증명"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사대보험 가입자 명부, 고용보험 가입자 명부"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Alien Preparation Documents"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Unified Application"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Original passport, identification card"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Alien Employment Declaration Form"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of housing contract"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "One color photograph of your business card"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment contract"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of qualifications (diploma, work history, certificates, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents issued abroad must be translated into Korean or English Consular notarization or apostille confirmation for key documents"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Company documents"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Establishment-related documents such as business license, registration certificate, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving the necessity of hiring foreigners"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Invitation letter, foreigner utilization plan, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment recommendation letter from the head of the competent central administrative agency or a recommendation letter from a related organization, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of payment history, tax payment certificate, local tax payment certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Value-added tax taxation standard certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "List of major health insurance members, list of employment insurance members"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-1 (전문인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "직종: 관리자 및 전문가 (67개 직종)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 법무부장관이 지정한 분야에서 전문적인 지식 및 기술을 가진 외국인력이 종사하는 활동."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-2 (준전문인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "직종: 사무 및 서비스종사자 (10개 직종)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 준전문적인 직무를 수행하는 외국인 인력."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-3 (일반기능인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "직종: 기능원 및 관련기능종사자 (10개 직종)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 특정 기능이 요구되는 일반적인 기술직무에 종사하는 외국인 인력."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-7-4 (숙련기능인력)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "특징: 점수제로 3개 직종에서만 활동 가능."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "설명: 숙련된 기능과 경험을 바탕으로 국가경쟁력 강화를 위해 도입된 외국인력."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류 기간 상한:1회 부여 시 최대 3년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "일반 요건"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "도입직종과 연관성이 있는 분야의 석사 이상 학위 소지자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "도입직종과 연관성이 있는 학사 학위 소지 + 1년 이상의 해당 분야 경력"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "첨단기술(IT), 바이오, 나노 등 분야 종사자는 졸업 이전 인턴 경력을 근무 경력으로 인정."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산업발전법 제 5조에 따라 산업통상자원부장관이 고시하는 첨단기술 분야 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "도입직종과 연관성이 있는 분야에서 5년 이상의 근무 경력"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "우대를 위한 특별 요건"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "세계 500대 기업 1년 이상 전문직종 근무 경력자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "세계 우수 대학 학사 학위 소지자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "전공분야 1년 이상의 경력 요건이 없더라도 고용 필요성이 인정되면 허용."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "타임誌 200대 대학 및 QS 세계대학순위 500위 이내 대학 졸업자."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 전문대학 졸업자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "관련 전공 도입허용 직종에 취업 시 1년 이상의 경력요건 면제, 고용 필요성이 인정되면 허용."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 대학 졸업 학사 이상 학위 소지자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "도입허용 직종에 취업 시 전공 무관, 고용 필요성이 인정되면 허용."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "학사 이상 학위자는 1년 이상의 경력요건 면제."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "일/학습연계유학(D-2-7)자격 졸업자는 국민 고용비율 면제."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고소득 전문직 우수인재"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "연간 총 수령보수가 전년도 1인당 국민총 소득(GNI)의 3배 이상인 경우, 직종에 관계없이 학력, 경력 모두 면제."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "주무부처장관의 고용추천 불필요."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "우수사설기관 연수 수료자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "해외 전문학사 이상 학력 소지자로, 해당 전공분야의 국내 연수과정(D-4-6, 20개월 이상)을 정상적으로 수료하고 국내 공인 자격증 및 사회통합프로그램 4단계 이상을 이수한 외국인은 해당 전공분야 자격변경 허용(E-7-4 분야 제외)."
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 준비 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "통합 신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권, 신분증 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 직업 신고서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "집 계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "반명함판 칼라사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자격요건 입증 서류: 학위증, 경력증명서, 자격증 등"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국외 발급 서류는 국문 또는 영문 번역본 첨부"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "주요 핵심 서류는 영사 공증 또는 아포스티유 확인서 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "회사 준비 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증, 등기부등본 등 설립 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 고용 필요성을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "초청 사유서, 외국인 활용계획서 등"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "소관 중앙행정기관 장의 고용 추천서 또는 관련 단체 추천서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "납부내역증명, 납세증명서, 지방세 납세증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "부가가치세 과세 표준증명"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사대보험 가입자 명부, 고용보험 가입자 명부"
      }
    ],
    "titleZh": "E-7 特定活动签证 - 专业人才（正式职）",
    "titleVi": "Visa E-7 Hoạt động đặc thù - Nhân lực chuyên môn (chính thức)",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "E-7-1（专业人才）" },
      { "kind": "bullet", "depth": 1, "text": "职种：管理者及专家（67 个职种）" },
      { "kind": "bullet", "depth": 1, "text": "说明：在法务部长官指定的领域，由具备专业知识和技术的外国人从事的活动" },
      { "kind": "bullet", "depth": 0, "text": "E-7-2（准专业人才）" },
      { "kind": "bullet", "depth": 1, "text": "职种：办公及服务从业者（10 个职种）" },
      { "kind": "bullet", "depth": 1, "text": "说明：从事准专业职务的外国人才" },
      { "kind": "bullet", "depth": 0, "text": "E-7-3（一般技能人才）" },
      { "kind": "bullet", "depth": 1, "text": "职种：技能员及相关技能从业者（10 个职种）" },
      { "kind": "bullet", "depth": 1, "text": "说明：从事需要特定技能的一般技术职务的外国人才" },
      { "kind": "bullet", "depth": 0, "text": "E-7-4（熟练技能人才）" },
      { "kind": "bullet", "depth": 1, "text": "特征：以计分制方式仅在 3 个职种中可活动" },
      { "kind": "bullet", "depth": 1, "text": "说明：基于熟练的技能与经验，为加强国家竞争力而引进的外国人才" },
      { "kind": "bullet", "depth": 0, "text": "停留期限上限：单次授予最长 3 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "E-7-1 (Nhân lực chuyên môn)" },
      { "kind": "bullet", "depth": 1, "text": "Ngành nghề: Quản lý và chuyên gia (67 ngành nghề)" },
      { "kind": "bullet", "depth": 1, "text": "Mô tả: Hoạt động của nhân lực nước ngoài có kiến thức và kỹ thuật chuyên môn trong lĩnh vực do Bộ trưởng Tư pháp chỉ định" },
      { "kind": "bullet", "depth": 0, "text": "E-7-2 (Nhân lực bán chuyên môn)" },
      { "kind": "bullet", "depth": 1, "text": "Ngành nghề: Người làm việc văn phòng và dịch vụ (10 ngành nghề)" },
      { "kind": "bullet", "depth": 1, "text": "Mô tả: Nhân lực nước ngoài thực hiện các công việc bán chuyên môn" },
      { "kind": "bullet", "depth": 0, "text": "E-7-3 (Nhân lực kỹ năng thông thường)" },
      { "kind": "bullet", "depth": 1, "text": "Ngành nghề: Kỹ thuật viên và người làm liên quan (10 ngành nghề)" },
      { "kind": "bullet", "depth": 1, "text": "Mô tả: Nhân lực nước ngoài làm các công việc kỹ thuật thông thường yêu cầu kỹ năng cụ thể" },
      { "kind": "bullet", "depth": 0, "text": "E-7-4 (Nhân lực kỹ năng lành nghề)" },
      { "kind": "bullet", "depth": 1, "text": "Đặc điểm: Theo hệ thống tính điểm, chỉ hoạt động được trong 3 ngành nghề" },
      { "kind": "bullet", "depth": 1, "text": "Mô tả: Nhân lực nước ngoài được đưa vào nhằm nâng cao năng lực cạnh tranh quốc gia, dựa trên kỹ năng và kinh nghiệm thành thạo" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa: tối đa 3 năm cho mỗi lần cấp" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "一般要件" },
      { "kind": "bullet", "depth": 1, "text": "持有与引进职种相关领域的硕士学位以上者" },
      { "kind": "bullet", "depth": 1, "text": "持有与引进职种相关领域的学士学位 + 该领域 1 年以上经验" },
      { "kind": "bullet", "depth": 2, "text": "尖端技术（IT）、生物、纳米等领域从业者，毕业前的实习经验也认可为工作经验" },
      { "kind": "bullet", "depth": 1, "text": "依据《产业发展法》第 5 条，由产业通商资源部长官公告的尖端技术领域从业者" },
      { "kind": "bullet", "depth": 1, "text": "在与引进职种相关领域具有 5 年以上工作经验" },
      { "kind": "bullet", "depth": 0, "text": "优待特别要件" },
      { "kind": "bullet", "depth": 1, "text": "在世界 500 强企业从事专业职务 1 年以上的经历者" },
      { "kind": "bullet", "depth": 1, "text": "持有世界优秀大学学士学位者" },
      { "kind": "bullet", "depth": 2, "text": "即使无 1 年以上专业经验，若被认定为有雇佣必要性也可允许" },
      { "kind": "bullet", "depth": 2, "text": "时代周刊 200 大学及 QS 世界大学排名 500 位以内的毕业生" },
      { "kind": "bullet", "depth": 1, "text": "韩国专科大学毕业生" },
      { "kind": "bullet", "depth": 2, "text": "在相关专业允许引进的职种就业时，免除 1 年以上经验要件，若被认定为有雇佣必要性也可允许" },
      { "kind": "bullet", "depth": 1, "text": "韩国大学学士以上学位毕业生" },
      { "kind": "bullet", "depth": 2, "text": "在允许引进的职种就业时不限专业，若被认定为有雇佣必要性可允许" },
      { "kind": "bullet", "depth": 2, "text": "学士以上学位者免除 1 年以上经验要件" },
      { "kind": "bullet", "depth": 2, "text": "工读结合留学（D-2-7）资格毕业生免除国民雇佣比例要件" },
      { "kind": "bullet", "depth": 1, "text": "高收入专业优秀人才" },
      { "kind": "bullet", "depth": 2, "text": "年度总报酬达到上一年度人均国民总收入（GNI）3 倍以上时，无论职种均免除学历及经验要件" },
      { "kind": "bullet", "depth": 2, "text": "无需主管部委长官的雇佣推荐" },
      { "kind": "bullet", "depth": 1, "text": "优秀私立机构研修结业者" },
      { "kind": "bullet", "depth": 2, "text": "持有海外专科以上学历的外国人，正常完成相关专业领域的国内研修课程（D-4-6，20 个月以上），并取得国内公认资格证及社会融合项目 4 阶段以上修读后，允许变更为相应专业领域资格（E-7-4 领域除外）" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Yêu cầu chung" },
      { "kind": "bullet", "depth": 1, "text": "Người có bằng thạc sĩ trở lên trong lĩnh vực liên quan đến ngành nghề được đưa vào" },
      { "kind": "bullet", "depth": 1, "text": "Người có bằng cử nhân trong lĩnh vực liên quan + 1 năm kinh nghiệm trở lên trong lĩnh vực đó" },
      { "kind": "bullet", "depth": 2, "text": "Người làm việc trong lĩnh vực công nghệ cao (IT), sinh học, nano, v.v., được công nhận kinh nghiệm thực tập trước khi tốt nghiệp như kinh nghiệm làm việc" },
      { "kind": "bullet", "depth": 1, "text": "Người làm việc trong lĩnh vực công nghệ cao do Bộ trưởng Thương mại, Công nghiệp và Năng lượng công bố theo Điều 5 Luật Phát triển Công nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Có 5 năm kinh nghiệm làm việc trở lên trong lĩnh vực liên quan đến ngành nghề được đưa vào" },
      { "kind": "bullet", "depth": 0, "text": "Yêu cầu đặc biệt cho ưu đãi" },
      { "kind": "bullet", "depth": 1, "text": "Người có 1 năm kinh nghiệm trở lên trong vị trí chuyên môn tại doanh nghiệp Global 500" },
      { "kind": "bullet", "depth": 1, "text": "Người có bằng cử nhân của trường đại học hàng đầu thế giới" },
      { "kind": "bullet", "depth": 2, "text": "Ngay cả khi không đáp ứng yêu cầu kinh nghiệm 1 năm trong lĩnh vực chuyên môn, vẫn có thể được chấp nhận nếu được công nhận có nhu cầu tuyển dụng" },
      { "kind": "bullet", "depth": 2, "text": "Người tốt nghiệp các trường đại học top 200 theo Time và top 500 theo QS World University Ranking" },
      { "kind": "bullet", "depth": 1, "text": "Người tốt nghiệp cao đẳng tại Hàn Quốc" },
      { "kind": "bullet", "depth": 2, "text": "Khi làm việc ở ngành nghề được phép trong chuyên ngành liên quan, được miễn yêu cầu kinh nghiệm 1 năm; nếu được công nhận có nhu cầu tuyển dụng có thể được chấp nhận" },
      { "kind": "bullet", "depth": 1, "text": "Người có bằng cử nhân trở lên tốt nghiệp đại học tại Hàn Quốc" },
      { "kind": "bullet", "depth": 2, "text": "Khi làm việc ở ngành nghề được phép, không phân biệt chuyên ngành, có thể được chấp nhận nếu được công nhận có nhu cầu tuyển dụng" },
      { "kind": "bullet", "depth": 2, "text": "Người có bằng cử nhân trở lên được miễn yêu cầu kinh nghiệm 1 năm" },
      { "kind": "bullet", "depth": 2, "text": "Người tốt nghiệp diện du học vừa làm vừa học (D-2-7) được miễn tỷ lệ tuyển dụng công dân" },
      { "kind": "bullet", "depth": 1, "text": "Nhân tài chuyên môn có thu nhập cao" },
      { "kind": "bullet", "depth": 2, "text": "Khi tổng thu nhập hằng năm đạt từ 3 lần thu nhập bình quân đầu người (GNI) năm trước trở lên, được miễn cả yêu cầu học vấn và kinh nghiệm bất kể ngành nghề" },
      { "kind": "bullet", "depth": 2, "text": "Không cần thư giới thiệu tuyển dụng của Bộ trưởng cơ quan chủ quản" },
      { "kind": "bullet", "depth": 1, "text": "Người hoàn thành đào tạo tại cơ sở tư thục xuất sắc" },
      { "kind": "bullet", "depth": 2, "text": "Người nước ngoài có bằng cao đẳng trở lên ở nước ngoài, đã hoàn thành chương trình đào tạo trong nước trong lĩnh vực chuyên ngành tương ứng (D-4-6, từ 20 tháng trở lên), đạt chứng chỉ công nhận trong nước và hoàn thành Chương trình hoà nhập xã hội cấp 4 trở lên, được phép chuyển đổi tư cách sang lĩnh vực chuyên ngành tương ứng (trừ lĩnh vực E-7-4)" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "外国人准备材料" },
      { "kind": "bullet", "depth": 1, "text": "综合申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照、身份证原件" },
      { "kind": "bullet", "depth": 1, "text": "外国人职业申报书" },
      { "kind": "bullet", "depth": 1, "text": "住房合同副本" },
      { "kind": "bullet", "depth": 1, "text": "彩色证件照 1 张（半身）" },
      { "kind": "bullet", "depth": 1, "text": "雇佣合同" },
      { "kind": "bullet", "depth": 1, "text": "资格要件证明材料：学位证、经历证明书、资格证等" },
      { "kind": "bullet", "depth": 2, "text": "境外发行的材料须附中文或英文翻译件" },
      { "kind": "bullet", "depth": 2, "text": "主要核心材料须提交领事公证或海牙认证书" },
      { "kind": "bullet", "depth": 0, "text": "公司准备材料" },
      { "kind": "bullet", "depth": 1, "text": "营业执照、登记簿副本等设立相关材料" },
      { "kind": "bullet", "depth": 1, "text": "证明外国人雇佣必要性的材料" },
      { "kind": "bullet", "depth": 2, "text": "邀请理由书、外国人活用计划书等" },
      { "kind": "bullet", "depth": 2, "text": "主管中央行政机关首长的雇佣推荐书或相关团体推荐书" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书" },
      { "kind": "bullet", "depth": 1, "text": "纳税明细证明、纳税证明、地方税纳税证明" },
      { "kind": "bullet", "depth": 1, "text": "增值税课税标准证明" },
      { "kind": "bullet", "depth": 1, "text": "四大保险加入者名册、雇佣保险加入者名册" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ người nước ngoài chuẩn bị" },
      { "kind": "bullet", "depth": 1, "text": "Đơn đăng ký tổng hợp" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu, bản gốc giấy tờ tuỳ thân" },
      { "kind": "bullet", "depth": 1, "text": "Đơn khai báo nghề nghiệp người nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao hợp đồng nhà ở" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh thẻ màu (kích cỡ bán thân)" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh điều kiện: bằng cấp, giấy chứng nhận kinh nghiệm, chứng chỉ, v.v." },
      { "kind": "bullet", "depth": 2, "text": "Giấy tờ cấp ở nước ngoài cần kèm bản dịch tiếng Hàn hoặc tiếng Anh" },
      { "kind": "bullet", "depth": 2, "text": "Các giấy tờ cốt lõi quan trọng cần nộp công chứng lãnh sự hoặc Apostille" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ công ty chuẩn bị" },
      { "kind": "bullet", "depth": 1, "text": "Giấy phép kinh doanh, bản sao giấy đăng ký doanh nghiệp và các hồ sơ thành lập khác" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh sự cần thiết của việc tuyển dụng người nước ngoài" },
      { "kind": "bullet", "depth": 2, "text": "Lý do mời, kế hoạch sử dụng người nước ngoài, v.v." },
      { "kind": "bullet", "depth": 2, "text": "Thư giới thiệu tuyển dụng của lãnh đạo cơ quan hành chính trung ương phụ trách hoặc thư giới thiệu của tổ chức liên quan" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận chi tiết nộp thuế, giấy chứng nhận đã nộp thuế, giấy chứng nhận đã nộp thuế địa phương" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận cơ sở thuế giá trị gia tăng" },
      { "kind": "bullet", "depth": 1, "text": "Danh sách tham gia 4 loại bảo hiểm chính, danh sách tham gia bảo hiểm tuyển dụng" }
    ]
  },
  "E-8": {
    "titleKo": "E-8 계절근로 비자 - 농수산업 단기 근로",
    "titleEn": "E-8 Seasonal Work - Short-Term Agricultural & Fishery Work",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 관계 중앙행정기관의 장과 협의하여 정하는 농작물 재배, 수확 (재배, 수확과 연계된 원시가공 분야를 포함한다) 및 수산물 원시가공 분야에서 취업 활동을 하려는 사람으로서 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5개월 (총 체류기간 8개월을 초과할 수 없음)"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person recognized by the Minister of Justice as a person who intends to engage in employment activities in the fields of agricultural crop cultivation and harvesting (including raw material processing related to cultivation and harvesting) and raw material processing of marine products, as determined by the Minister of Justice in consultation with the head of the relevant central administrative agency."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 5 months (total period of stay cannot exceed 8 months)"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-1: 국내 지자체와 외국 지자체간 MOU 방식으로 선정 (농업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-2: 결혼이민자가 해외 거주하는 4촌 이내 친척을 추천 (농업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-3: 국내지자체와 외국지자체간 MOU 방식으로 선정 (어업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-4: 결혼이민자가 해외 거주하는 4촌 이내 친척을 추천 (어업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-5: 기타(G-1) 자격으로 계절근로 활동 후 재입국 추천 (농업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-6: 기타(G-1) 자격으로 계절근로 활동 후 재입국 추천 (어업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-99: 언어소통 도우미 등 기타 보조 인력 (기타)"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-1: Selection through MOU between domestic and foreign local governments (Agriculture)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-2: Married immigrants can nominate relatives within 4 villages living abroad (Agriculture)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-3: MOU between domestic and foreign local governments (fishing)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-4: Married immigrants can nominate relatives within 4 villages living abroad (Fisheries)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-5: Re-entry recommendation after seasonal work in other (G-1) status (Agriculture)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-6: Recommendation for reentry after seasonal work in other (G-1) status (fishing)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-99: Other auxiliary personnel, such as language communication assistants (Other)"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준근로계약서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "여행자보험증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "보험증서를 제출하지 못하는 경우, 사증발급정서를 먼저 발급받은 후 지자체를 통해 추후 보완 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "내국인 구인노력 증빙자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "구인 광고내용 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최종 구인실적 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 계절근로자 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 계절근로자 여권 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "MOU 외국인의 경우, 본국에서의 농어업 종사 이력"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결혼이민자의 4촌 이내 친척(배우자 포함)의 경우, 거주국(체류국)에서 발급한 가족관계증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "숙소 점검 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 계절근로자 숙소 점검확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진 포함 (A. 건물 전경 B. 방 C. 화장실·샤워실 포함 최소 2장 이상)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "MOU 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "지자체별 신청 연도에 1회만 제출"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Standard labor contract"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Travel insurance certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If there are circumstances that prevent you from submitting the insurance certificate, please issue a visa issuance letter first and submit it later through the local government."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of domestic recruitment efforts (copies of job advertisements and final job results)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to foreign seasonal workers"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of foreign seasonal worker's passport"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "MOU foreigners: history of working in agriculture and fisheries in their home country"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Relatives (including spouses) within the 4th degree of marriage: Family relationship certificate issued by the country of residence (country of stay)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to accommodation inspection"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Foreign seasonal worker housing inspection certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Photos (at least 2 photos including A. Building view B. Room C. Toilet/shower room)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of MOU (only submitted once per application year per municipality)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 관계 중앙행정기관의 장과 협의하여 정하는 농작물 재배, 수확 (재배, 수확과 연계된 원시가공 분야를 포함한다) 및 수산물 원시가공 분야에서 취업 활동을 하려는 사람으로서 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5개월 (총 체류기간 8개월을 초과할 수 없음)"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-1: 국내 지자체와 외국 지자체간 MOU 방식으로 선정 (농업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-2: 결혼이민자가 해외 거주하는 4촌 이내 친척을 추천 (농업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-3: 국내지자체와 외국지자체간 MOU 방식으로 선정 (어업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-4: 결혼이민자가 해외 거주하는 4촌 이내 친척을 추천 (어업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-5: 기타(G-1) 자격으로 계절근로 활동 후 재입국 추천 (농업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-6: 기타(G-1) 자격으로 계절근로 활동 후 재입국 추천 (어업)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-8-99: 언어소통 도우미 등 기타 보조 인력 (기타)"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "표준근로계약서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "여행자보험증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "보험증서를 제출하지 못하는 경우, 사증발급정서를 먼저 발급받은 후 지자체를 통해 추후 보완 제출"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "내국인 구인노력 증빙자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "구인 광고내용 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "최종 구인실적 등"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 계절근로자 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 계절근로자 여권 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "MOU 외국인의 경우, 본국에서의 농어업 종사 이력"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결혼이민자의 4촌 이내 친척(배우자 포함)의 경우, 거주국(체류국)에서 발급한 가족관계증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "숙소 점검 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 계절근로자 숙소 점검확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사진 포함 (A. 건물 전경 B. 방 C. 화장실·샤워실 포함 최소 2장 이상)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "MOU 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "지자체별 신청 연도에 1회만 제출"
      }
    ],
    "titleZh": "E-8 季节工签证 - 农水产业短期工作",
    "titleVi": "Visa E-8 Lao động thời vụ - Làm việc ngắn hạn trong nông nghiệp và thuỷ sản",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "经法务部长官与相关中央行政机关首长协商确定，欲在农作物种植与收获（含与种植、收获相联系的初加工领域）及水产品初加工领域从事就业活动且经法务部长官认定的人员" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：5 个月（总停留期间不得超过 8 个月）" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người được Bộ trưởng Tư pháp công nhận, muốn làm việc trong lĩnh vực canh tác/thu hoạch nông sản (bao gồm sơ chế liên quan) và sơ chế thuỷ sản theo thoả thuận giữa Bộ trưởng Tư pháp và lãnh đạo cơ quan hành chính trung ương liên quan" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 5 tháng (tổng thời gian lưu trú không được quá 8 tháng)" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "E-8-1：通过韩国地方政府与外国地方政府间的 MOU 方式选拔（农业）" },
      { "kind": "bullet", "depth": 0, "text": "E-8-2：结婚移民者推荐居住海外四代以内亲属（农业）" },
      { "kind": "bullet", "depth": 0, "text": "E-8-3：通过韩国地方政府与外国地方政府间的 MOU 方式选拔（渔业）" },
      { "kind": "bullet", "depth": 0, "text": "E-8-4：结婚移民者推荐居住海外四代以内亲属（渔业）" },
      { "kind": "bullet", "depth": 0, "text": "E-8-5：以其他（G-1）资格从事季节工活动后推荐再入境（农业）" },
      { "kind": "bullet", "depth": 0, "text": "E-8-6：以其他（G-1）资格从事季节工活动后推荐再入境（渔业）" },
      { "kind": "bullet", "depth": 0, "text": "E-8-99：语言沟通辅助员等其他辅助人力（其他）" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "E-8-1: Tuyển chọn theo MOU giữa chính quyền địa phương Hàn Quốc và chính quyền địa phương nước ngoài (Nông nghiệp)" },
      { "kind": "bullet", "depth": 0, "text": "E-8-2: Người kết hôn nhập cư giới thiệu người thân trong vòng 4 đời sống ở nước ngoài (Nông nghiệp)" },
      { "kind": "bullet", "depth": 0, "text": "E-8-3: Tuyển chọn theo MOU giữa chính quyền địa phương Hàn Quốc và chính quyền địa phương nước ngoài (Thuỷ sản)" },
      { "kind": "bullet", "depth": 0, "text": "E-8-4: Người kết hôn nhập cư giới thiệu người thân trong vòng 4 đời sống ở nước ngoài (Thuỷ sản)" },
      { "kind": "bullet", "depth": 0, "text": "E-8-5: Giới thiệu tái nhập cảnh sau khi làm việc thời vụ với tư cách Khác (G-1) (Nông nghiệp)" },
      { "kind": "bullet", "depth": 0, "text": "E-8-6: Giới thiệu tái nhập cảnh sau khi làm việc thời vụ với tư cách Khác (G-1) (Thuỷ sản)" },
      { "kind": "bullet", "depth": 0, "text": "E-8-99: Người trợ giúp giao tiếp ngôn ngữ và các nhân lực hỗ trợ khác (Khác)" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "标准劳动合同" },
      { "kind": "bullet", "depth": 0, "text": "旅行者保险证书" },
      { "kind": "bullet", "depth": 1, "text": "如无法提交保险证书，先获取签证发放认定书后通过地方政府补充提交" },
      { "kind": "bullet", "depth": 0, "text": "招聘本国人努力的证明材料" },
      { "kind": "bullet", "depth": 1, "text": "招聘广告内容副本" },
      { "kind": "bullet", "depth": 1, "text": "最终招聘实绩等" },
      { "kind": "bullet", "depth": 0, "text": "外国人季节工相关材料" },
      { "kind": "bullet", "depth": 1, "text": "外国人季节工护照副本" },
      { "kind": "bullet", "depth": 1, "text": "MOU 外国人情况下，本国农渔业从业经历" },
      { "kind": "bullet", "depth": 1, "text": "结婚移民者四代以内亲属（含配偶）情况下，居住国（停留国）出具的家庭关系证明" },
      { "kind": "bullet", "depth": 0, "text": "住宿点检相关材料" },
      { "kind": "bullet", "depth": 1, "text": "外国人季节工住宿点检确认书" },
      { "kind": "bullet", "depth": 1, "text": "包含照片（A. 建筑全景 B. 房间 C. 含卫生间·淋浴室至少 2 张以上）" },
      { "kind": "bullet", "depth": 0, "text": "MOU 副本" },
      { "kind": "bullet", "depth": 1, "text": "各地方政府每个申请年度仅提交 1 次" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hợp đồng lao động chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Giấy chứng nhận bảo hiểm du lịch" },
      { "kind": "bullet", "depth": 1, "text": "Trường hợp không nộp được giấy bảo hiểm, có thể nhận giấy phép cấp thị thực trước rồi sau đó bổ sung qua chính quyền địa phương" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh nỗ lực tuyển dụng người trong nước" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao nội dung quảng cáo tuyển dụng" },
      { "kind": "bullet", "depth": 1, "text": "Kết quả tuyển dụng cuối cùng, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến lao động thời vụ nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao hộ chiếu của lao động thời vụ nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Đối với người nước ngoài theo MOU: Lịch sử làm việc trong ngành nông/ngư nghiệp tại nước nhà" },
      { "kind": "bullet", "depth": 1, "text": "Đối với người thân trong vòng 4 đời (bao gồm vợ/chồng) của người kết hôn nhập cư: Giấy chứng nhận quan hệ gia đình do nước cư trú (nước lưu trú) cấp" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ liên quan đến kiểm tra chỗ ở" },
      { "kind": "bullet", "depth": 1, "text": "Giấy xác nhận kiểm tra chỗ ở của lao động thời vụ nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Bao gồm ảnh (A. Toàn cảnh toà nhà B. Phòng C. Toilet/phòng tắm — tối thiểu 2 ảnh trở lên)" },
      { "kind": "bullet", "depth": 0, "text": "Bản sao MOU" },
      { "kind": "bullet", "depth": 1, "text": "Mỗi chính quyền địa phương chỉ nộp 1 lần trong năm đăng ký" }
    ]
  },
  "E-9": {
    "titleKo": "E-9 비전문취업 비자 - 고용허가제 근로",
    "titleEn": "E-9 Non-professional Employment - Employment Permit System",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용허가제에 의거하여 사업주에게 외국인근로자의 고용을 허가하고, 외국인 근로자에게는 당해 사업주에게 고용되는 조건으로 최장 4년 10개월간 취업을 허용하는 인력제도"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여 체류기간의 상한: 3년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Manpower system under which employers are authorized to hire foreign workers under the employment permit system, and foreign workers are allowed to work for up to 4 years and 10 months in exchange for employment with the employer."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay: 3 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 근로자의 고용에 관한 법률의 규정에 의한 국내 취업요건을 갖춘 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(태국, 필리핀, 스리랑카, 베트남, 인도네시아, 몽골, 파키스탄, 우즈베키스탄, 캄보디아, 중국, 방글라데시, 네팔, 미얀마, 키르기스스탄, 동티모르, 라오스)"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who meet the requirements for domestic employment under the provisions of the Act on the Employment of Foreign Workers."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(Thailand, Philippines, Sri Lanka, Vietnam, Indonesia, Mongolia, Pakistan, Uzbekistan, Cambodia, China, Bangladesh, Nepal, Myanmar, Kyrgyzstan, Timor-Leste, Laos)"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국적국의 권한 있는 기관이 발급"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자국 내 모든 범죄경력 포함"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국적국 내 범죄경력 확인 시스템이 미흡한 경우, 거주지 관할 내무기관 증명서로 대체 가능"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급 신청일로부터 3개월 이내 발급된 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "건강상태 확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증신청인이 자필로 작성"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵, B형간염, 매독 등의 감염 여부, 마약복용 경험, 정신질환 치료경험 등 기록"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급인정신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용허가서 및 표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업장실태조사서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Submit a criminal background certificate issued by an authorized agency in the country of nationality."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Include all criminal convictions in the country of nationality; however, if the system for verifying criminal convictions in the country of nationality is inadequate, the certificate may be substituted by the internal affairs agency having jurisdiction over the place of residence."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "The certificate must be dated within three months of the date of application."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Submit a health certificate in the form provided by the applicant."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "In the form, the applicant must state whether he/she is infected with tuberculosis, hepatitis B, syphilis, etc. and whether he/she has ever taken drugs or been treated for mental illness."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa issuance authorization application, passport, and one standardized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of business license"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Copy of employment license and standard labor contract"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Workplace inspection report"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고용허가제에 의거하여 사업주에게 외국인근로자의 고용을 허가하고, 외국인 근로자에게는 당해 사업주에게 고용되는 조건으로 최장 4년 10개월간 취업을 허용하는 인력제도"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여 체류기간의 상한: 3년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 근로자의 고용에 관한 법률의 규정에 의한 국내 취업요건을 갖춘 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(태국, 필리핀, 스리랑카, 베트남, 인도네시아, 몽골, 파키스탄, 우즈베키스탄, 캄보디아, 중국, 방글라데시, 네팔, 미얀마, 키르기스스탄, 동티모르, 라오스)"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국적국의 권한 있는 기관이 발급"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자국 내 모든 범죄경력 포함"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국적국 내 범죄경력 확인 시스템이 미흡한 경우, 거주지 관할 내무기관 증명서로 대체 가능"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급 신청일로부터 3개월 이내 발급된 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "건강상태 확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증신청인이 자필로 작성"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵, B형간염, 매독 등의 감염 여부, 마약복용 경험, 정신질환 치료경험 등 기록"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 필수 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급인정신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용허가서 및 표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사업장실태조사서"
      }
    ],
    "titleZh": "E-9 非专门就业签证 - 雇佣许可制工作",
    "titleVi": "Visa E-9 Việc làm không chuyên môn - Lao động theo Chế độ Cấp phép Tuyển dụng",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "依据雇佣许可制，向雇主授予雇佣外国劳动者的许可，并向外国劳动者允许在该雇主处就业，最长可达 4 年 10 个月的人力制度" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：3 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Chế độ nhân lực cho phép người sử dụng lao động tuyển dụng người lao động nước ngoài theo Chế độ Cấp phép Tuyển dụng, và cho phép người lao động nước ngoài làm việc tại nơi đó tối đa 4 năm 10 tháng" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 3 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "依据《外国劳动者雇佣等相关法律》具备韩国就业要件者" },
      { "kind": "bullet", "depth": 1, "text": "（泰国、菲律宾、斯里兰卡、越南、印度尼西亚、蒙古、巴基斯坦、乌兹别克斯坦、柬埔寨、中国、孟加拉国、尼泊尔、缅甸、吉尔吉斯斯坦、东帝汶、老挝）" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người đáp ứng điều kiện làm việc tại Hàn Quốc theo Luật về Tuyển dụng Lao động Nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "(Thái Lan, Philippines, Sri Lanka, Việt Nam, Indonesia, Mông Cổ, Pakistan, Uzbekistan, Campuchia, Trung Quốc, Bangladesh, Nepal, Myanmar, Kyrgyzstan, Đông Timor, Lào)" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "无犯罪记录证明" },
      { "kind": "bullet", "depth": 1, "text": "由国籍国权限机关发行" },
      { "kind": "bullet", "depth": 1, "text": "包含本国全部犯罪记录" },
      { "kind": "bullet", "depth": 1, "text": "若国籍国犯罪记录确认系统不完善，可由居住地管辖内政机关证明替代" },
      { "kind": "bullet", "depth": 1, "text": "签证申请日起 3 个月内发行的证明" },
      { "kind": "bullet", "depth": 0, "text": "健康状况确认书" },
      { "kind": "bullet", "depth": 1, "text": "由签证申请人亲笔填写" },
      { "kind": "bullet", "depth": 1, "text": "记录结核、乙肝、梅毒等感染情况、毒品服用经验、精神疾病治疗经验等" },
      { "kind": "bullet", "depth": 0, "text": "其他必备材料" },
      { "kind": "bullet", "depth": 1, "text": "签证发放认定申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 1, "text": "雇佣许可书及标准劳动合同副本" },
      { "kind": "bullet", "depth": 1, "text": "营业场所实态调查书" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Lý lịch tư pháp" },
      { "kind": "bullet", "depth": 1, "text": "Do cơ quan có thẩm quyền của nước quốc tịch cấp" },
      { "kind": "bullet", "depth": 1, "text": "Bao gồm toàn bộ tiền án trong nước nhà" },
      { "kind": "bullet", "depth": 1, "text": "Trường hợp hệ thống xác nhận lý lịch tư pháp tại nước nhà chưa đầy đủ, có thể thay thế bằng giấy chứng nhận của cơ quan nội vụ tại nơi cư trú" },
      { "kind": "bullet", "depth": 1, "text": "Phải được cấp trong vòng 3 tháng kể từ ngày nộp hồ sơ xin thị thực" },
      { "kind": "bullet", "depth": 0, "text": "Giấy xác nhận tình trạng sức khoẻ" },
      { "kind": "bullet", "depth": 1, "text": "Người nộp hồ sơ tự viết tay" },
      { "kind": "bullet", "depth": 1, "text": "Ghi rõ tình trạng nhiễm bệnh lao, viêm gan B, giang mai và kinh nghiệm sử dụng ma tuý, điều trị bệnh tâm thần, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ bắt buộc khác" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp giấy phép cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy phép tuyển dụng và hợp đồng lao động chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Báo cáo khảo sát thực tế nơi làm việc" }
    ]
  },
  "E-10": {
    "titleKo": "E-10 선원취업 비자 - 선원 근로",
    "titleEn": "E-10 Vessel Crew - Seafarer Employment",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "내항선원으로 국내취업한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "20톤 이상의 어선원으로 국내취업한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "2천톤 이상의 순항여객선원으로 국내취업한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 3년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment as an inland mariner"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Domestic employment as a fishing vessel of 20 tons or more"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Domestic employment as a cruise passenger vessel of 2,000 tons or more"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 3 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "내항선원 (E-10-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해운법에 따른 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항정기여객운송사업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항부정기여객운송사업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항화물운송 사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "계약 조건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업체에서 6개월 이상 선원근로계약 체결"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "적용 범위:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선원법 제3조 제5호의 부원"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어선을 제외한 총톤수 5톤 이상의 내항상선에 승선하는 부원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "어선원 (E-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수산업법에 따른 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "정치망어업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "동력어선을 이용한 근해어업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어획물운반업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "계약 조건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업체(20톤 이상의 어선)에서 6개월 이상 노무를 제공할 것을 조건으로 선원근로계약 체결"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "적용 범위:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선원법 제3조 제5호의 부원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "순항여객선원 (E-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "크루즈산업 관련 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "크루즈산업의 육성 및 지원에 관한 법률에 따른 국적 크루즈 사업자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국제 순항 크루즈선을 이용하여 사업 경영"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "계약 조건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업체에서 6개월 이상 노무를 제공할 것을 조건으로 선원근로계약 체결"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "적용 범위:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "총 톤수 2천 톤 이상의 크루즈선"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선원법 제3조 제5호의 부원"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Seafarers (E-10-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Persons engaged in the business of Article 3(1) (domestic regular passenger transportation), Article 2 (domestic irregular passenger transportation), and Article 23(1) (domestic cargo transportation) of the Shipping Act, and members of Article 3(5) of the Seafarers Act who have entered into a seafarer labor contract with the business for more than six months."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A member of the crew of an inland merchant vessel of 5 gross tons or more, excluding fishing vessels, of a vessel subject to the Seamen's Act."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Fishing crew (E-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A person who operates a business under the provisions of Article 8, Paragraph 1 (1) of the Fisheries Act (political net fishing), Article 41, Paragraph 1 (offshore fishing using motorized fishing vessels), or Article 57, Paragraph 1 (catch transportation), and a person who concludes a seafarer labor contract with a business entity (fishing vessel of 20 tons or more) on the condition that he/she will provide labor for more than six months, and who falls under the provisions of Article 3, Paragraph 5 of the Seafarers Act."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(E-10-3) Cruise passenger seafarers"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A person who is a national cruise operator pursuant to Article 2, Paragraph 7 of the Act on the Promotion and Support of the Cruise Industry and who operates a business using an international cruise ship pursuant to Paragraph 4 of the same Article, and who has entered into a seafarer's labor contract on the condition that he/she will provide labor for the business for a period of six months or more, and who falls under the provisions of Article 3, Paragraph 5 of the Seafarers' Act aboard a cruise ship of 2,000 gross tons or more in accordance with the provisions of Article 3 of the Enforcement Decree of the Shipping Law."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-1 (내항선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서 (별지 제 21호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용신고수리서 (지방해양항만청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항여객운송사업면허증, 내항화물운송사업등록증 사본 (최초 신청 또는 등록사항 변경 시)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용추천서 (지방해양수산청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "‘승선정원증서’ 또는 ‘500톤 미만 선박검사증서’ 등 필요한 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "노사합의 선사별 T/O 운영승인서 (해당 시)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-2 (어선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서 (별지 제 21호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용신고수리서 (지방해양항만청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "정치망어업면허증 및 관리선사용지정(어선사용승인) 증, 근해어업허가증 사본 (최초 신청 또는 등록사항 변경 시)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선박검사증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용추천서 (지방해양수산청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어획물운반업등록증 (어획물운반업만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-3 (순항여객선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서 (별지 제 21호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용신고수리서 (지방해양항만청장 발급)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-1"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for authorization to issue a visa (form in Exhibit 21), passport, business license, and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of standard labor contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of Employment of Foreign Seafarers (issued by the Regional Maritime and Port Administration)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A copy of the inland passenger transportation business license and inland cargo transportation business registration under the Shipping Act (to be submitted only for initial application or change of registration)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment recommendation letter for foreign seafarers (issued by the head of the local maritime and fisheries administration)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Other documents deemed necessary by the head of the agency (office branch), such as a certificate of passenger capacity or a certificate of inspection for vessels under 500 tons."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Labor-management agreement T/O operation approval letter (for companies applying the total quota system)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-2"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance authorization application (form in Appendix No. 21), passport, business license, one standardized photo"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of standard labor contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of Employment of Foreign Seafarers (issued by the Regional Maritime and Port Administration)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Political fishing license and management vessel use designation (fishing vessel use approval) certificate under the Fisheries Act, copy of nearshore fishing permit (submitted only for initial application or registration change)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Vessel inspection certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment recommendation letter for foreign seafarers (issued by the head of the local maritime affairs and fisheries office)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Catcher vessel registration (catcher vessel only)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-3"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance authorization application (form in Appendix No. 21), passport, business license, one standardized photograph"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of standard labor contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of Employment of Foreign Seafarers (issued by the Regional Maritime and Port Administration)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of recommendation for employment of foreign seafarers (issued by the head of the local maritime and fisheries administration)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A copy of the cruise passenger transportation business license Initial application or registration (to be submitted only for changes)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "내항선원으로 국내취업한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "20톤 이상의 어선원으로 국내취업한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "2천톤 이상의 순항여객선원으로 국내취업한 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 3년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "내항선원 (E-10-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해운법에 따른 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항정기여객운송사업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항부정기여객운송사업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항화물운송 사업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "계약 조건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업체에서 6개월 이상 선원근로계약 체결"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "적용 범위:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선원법 제3조 제5호의 부원"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어선을 제외한 총톤수 5톤 이상의 내항상선에 승선하는 부원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "어선원 (E-10-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수산업법에 따른 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "정치망어업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "동력어선을 이용한 근해어업"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어획물운반업"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "계약 조건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업체(20톤 이상의 어선)에서 6개월 이상 노무를 제공할 것을 조건으로 선원근로계약 체결"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "적용 범위:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선원법 제3조 제5호의 부원"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "순항여객선원 (E-10-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "크루즈산업 관련 요건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "크루즈산업의 육성 및 지원에 관한 법률에 따른 국적 크루즈 사업자"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "국제 순항 크루즈선을 이용하여 사업 경영"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "계약 조건:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업체에서 6개월 이상 노무를 제공할 것을 조건으로 선원근로계약 체결"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "적용 범위:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "총 톤수 2천 톤 이상의 크루즈선"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선원법 제3조 제5호의 부원"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-1 (내항선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서 (별지 제 21호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용신고수리서 (지방해양항만청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "내항여객운송사업면허증, 내항화물운송사업등록증 사본 (최초 신청 또는 등록사항 변경 시)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용추천서 (지방해양수산청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "‘승선정원증서’ 또는 ‘500톤 미만 선박검사증서’ 등 필요한 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "노사합의 선사별 T/O 운영승인서 (해당 시)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-2 (어선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서 (별지 제 21호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용신고수리서 (지방해양항만청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "정치망어업면허증 및 관리선사용지정(어선사용승인) 증, 근해어업허가증 사본 (최초 신청 또는 등록사항 변경 시)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "선박검사증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용추천서 (지방해양수산청장 발급)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "어획물운반업등록증 (어획물운반업만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "E-10-3 (순항여객선원)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사증발급인정신청서 (별지 제 21호 서식)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가 서류:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "표준근로계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인선원고용신고수리서 (지방해양항만청장 발급)"
      }
    ],
    "titleZh": "E-10 船员就业签证 - 船员工作",
    "titleVi": "Visa E-10 Việc làm thuyền viên - Lao động thuyền viên",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "在韩国就业的内航船员" },
      { "kind": "bullet", "depth": 0, "text": "在 20 吨以上渔船就业的渔船员" },
      { "kind": "bullet", "depth": 0, "text": "在 2 千吨以上巡航客船就业的人员" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：3 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người làm việc trong nước với tư cách thuyền viên nội địa" },
      { "kind": "bullet", "depth": 0, "text": "Người làm việc trong nước với tư cách thuyền viên tàu cá từ 20 tấn trở lên" },
      { "kind": "bullet", "depth": 0, "text": "Người làm việc trong nước với tư cách thuyền viên tàu khách du lịch từ 2.000 tấn trở lên" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 3 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "内航船员（E-10-1）" },
      { "kind": "bullet", "depth": 1, "text": "依据《海运法》的要件：" },
      { "kind": "bullet", "depth": 2, "text": "内航定期客运业" },
      { "kind": "bullet", "depth": 2, "text": "内航不定期客运业" },
      { "kind": "bullet", "depth": 2, "text": "内航货物运输业" },
      { "kind": "bullet", "depth": 1, "text": "合同条件：" },
      { "kind": "bullet", "depth": 2, "text": "与企业签订 6 个月以上的船员劳动合同" },
      { "kind": "bullet", "depth": 1, "text": "适用范围：" },
      { "kind": "bullet", "depth": 2, "text": "《船员法》第 3 条第 5 号的船员" },
      { "kind": "bullet", "depth": 2, "text": "除渔船外，登上总吨位 5 吨以上内航商船的船员" },
      { "kind": "bullet", "depth": 0, "text": "渔船员（E-10-2）" },
      { "kind": "bullet", "depth": 1, "text": "依据《水产业法》的要件：" },
      { "kind": "bullet", "depth": 2, "text": "定置网渔业" },
      { "kind": "bullet", "depth": 2, "text": "使用动力渔船的近海渔业" },
      { "kind": "bullet", "depth": 2, "text": "渔获物运输业" },
      { "kind": "bullet", "depth": 1, "text": "合同条件：" },
      { "kind": "bullet", "depth": 2, "text": "以在企业（20 吨以上渔船）提供 6 个月以上劳务为条件签订船员劳动合同" },
      { "kind": "bullet", "depth": 1, "text": "适用范围：" },
      { "kind": "bullet", "depth": 2, "text": "《船员法》第 3 条第 5 号的船员" },
      { "kind": "bullet", "depth": 0, "text": "巡航客船船员（E-10-3）" },
      { "kind": "bullet", "depth": 1, "text": "邮轮产业相关要件：" },
      { "kind": "bullet", "depth": 2, "text": "依据《邮轮产业培育及支援法》的国籍邮轮经营者" },
      { "kind": "bullet", "depth": 2, "text": "使用国际巡航邮轮经营业务" },
      { "kind": "bullet", "depth": 1, "text": "合同条件：" },
      { "kind": "bullet", "depth": 2, "text": "以在企业提供 6 个月以上劳务为条件签订船员劳动合同" },
      { "kind": "bullet", "depth": 1, "text": "适用范围：" },
      { "kind": "bullet", "depth": 2, "text": "总吨位 2 千吨以上邮轮" },
      { "kind": "bullet", "depth": 2, "text": "《船员法》第 3 条第 5 号的船员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Thuyền viên nội địa (E-10-1)" },
      { "kind": "bullet", "depth": 1, "text": "Yêu cầu theo Luật Vận tải Biển:" },
      { "kind": "bullet", "depth": 2, "text": "Kinh doanh vận tải hành khách định kỳ nội địa" },
      { "kind": "bullet", "depth": 2, "text": "Kinh doanh vận tải hành khách không định kỳ nội địa" },
      { "kind": "bullet", "depth": 2, "text": "Kinh doanh vận tải hàng hoá nội địa" },
      { "kind": "bullet", "depth": 1, "text": "Điều kiện hợp đồng:" },
      { "kind": "bullet", "depth": 2, "text": "Ký hợp đồng lao động thuyền viên từ 6 tháng trở lên với doanh nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Phạm vi áp dụng:" },
      { "kind": "bullet", "depth": 2, "text": "Thuyền viên thuộc Điều 3 Khoản 5 Luật Thuyền viên" },
      { "kind": "bullet", "depth": 2, "text": "Thuyền viên trên tàu thương mại nội địa từ 5 tấn tổng dung tích trở lên (trừ tàu cá)" },
      { "kind": "bullet", "depth": 0, "text": "Thuyền viên tàu cá (E-10-2)" },
      { "kind": "bullet", "depth": 1, "text": "Yêu cầu theo Luật Thuỷ sản:" },
      { "kind": "bullet", "depth": 2, "text": "Đánh bắt bằng lưới định ngư" },
      { "kind": "bullet", "depth": 2, "text": "Đánh bắt gần bờ bằng tàu cá có động cơ" },
      { "kind": "bullet", "depth": 2, "text": "Vận chuyển sản phẩm đánh bắt" },
      { "kind": "bullet", "depth": 1, "text": "Điều kiện hợp đồng:" },
      { "kind": "bullet", "depth": 2, "text": "Ký hợp đồng lao động thuyền viên với điều kiện cung cấp lao động từ 6 tháng trở lên cho doanh nghiệp (tàu cá từ 20 tấn trở lên)" },
      { "kind": "bullet", "depth": 1, "text": "Phạm vi áp dụng:" },
      { "kind": "bullet", "depth": 2, "text": "Thuyền viên thuộc Điều 3 Khoản 5 Luật Thuyền viên" },
      { "kind": "bullet", "depth": 0, "text": "Thuyền viên tàu khách du lịch (E-10-3)" },
      { "kind": "bullet", "depth": 1, "text": "Yêu cầu liên quan đến ngành du thuyền:" },
      { "kind": "bullet", "depth": 2, "text": "Doanh nghiệp du thuyền có quốc tịch theo Luật Khuyến khích và Hỗ trợ Ngành Du thuyền" },
      { "kind": "bullet", "depth": 2, "text": "Kinh doanh sử dụng tàu du thuyền hành trình quốc tế" },
      { "kind": "bullet", "depth": 1, "text": "Điều kiện hợp đồng:" },
      { "kind": "bullet", "depth": 2, "text": "Ký hợp đồng lao động thuyền viên với điều kiện cung cấp lao động từ 6 tháng trở lên cho doanh nghiệp" },
      { "kind": "bullet", "depth": 1, "text": "Phạm vi áp dụng:" },
      { "kind": "bullet", "depth": 2, "text": "Tàu du thuyền có tổng dung tích từ 2.000 tấn trở lên" },
      { "kind": "bullet", "depth": 2, "text": "Thuyền viên thuộc Điều 3 Khoản 5 Luật Thuyền viên" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "E-10-1（内航船员）" },
      { "kind": "bullet", "depth": 1, "text": "基本材料：" },
      { "kind": "bullet", "depth": 2, "text": "签证发放认定申请书（附件第 21 号格式）" },
      { "kind": "bullet", "depth": 2, "text": "护照" },
      { "kind": "bullet", "depth": 2, "text": "营业执照" },
      { "kind": "bullet", "depth": 2, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "补充材料：" },
      { "kind": "bullet", "depth": 2, "text": "标准劳动合同副本" },
      { "kind": "bullet", "depth": 2, "text": "身份担保书" },
      { "kind": "bullet", "depth": 2, "text": "外国人船员雇佣申报受理书（地方海洋港湾厅长发行）" },
      { "kind": "bullet", "depth": 2, "text": "内航客运经营许可证、内航货运经营登记证副本（首次申请或登记事项变更时）" },
      { "kind": "bullet", "depth": 2, "text": "外国人船员雇佣推荐书（地方海洋水产厅长发行）" },
      { "kind": "bullet", "depth": 2, "text": "「乘船定员证书」或「500 吨以下船舶检验证书」等所需材料" },
      { "kind": "bullet", "depth": 2, "text": "劳资协议各船公司 T/O 运营批准书（适用时）" },
      { "kind": "bullet", "depth": 0, "text": "E-10-2（渔船员）" },
      { "kind": "bullet", "depth": 1, "text": "基本材料：" },
      { "kind": "bullet", "depth": 2, "text": "签证发放认定申请书（附件第 21 号格式）" },
      { "kind": "bullet", "depth": 2, "text": "护照" },
      { "kind": "bullet", "depth": 2, "text": "营业执照" },
      { "kind": "bullet", "depth": 2, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "补充材料：" },
      { "kind": "bullet", "depth": 2, "text": "标准劳动合同副本" },
      { "kind": "bullet", "depth": 2, "text": "身份担保书" },
      { "kind": "bullet", "depth": 2, "text": "外国人船员雇佣申报受理书（地方海洋港湾厅长发行）" },
      { "kind": "bullet", "depth": 2, "text": "定置网渔业许可证及管理船使用指定（渔船使用批准）证、近海渔业许可证副本（首次申请或登记事项变更时）" },
      { "kind": "bullet", "depth": 2, "text": "船舶检验证书" },
      { "kind": "bullet", "depth": 2, "text": "外国人船员雇佣推荐书（地方海洋水产厅长发行）" },
      { "kind": "bullet", "depth": 2, "text": "渔获物运输业登记证（仅渔获物运输业适用）" },
      { "kind": "bullet", "depth": 0, "text": "E-10-3（巡航客船船员）" },
      { "kind": "bullet", "depth": 1, "text": "基本材料：" },
      { "kind": "bullet", "depth": 2, "text": "签证发放认定申请书（附件第 21 号格式）" },
      { "kind": "bullet", "depth": 2, "text": "护照" },
      { "kind": "bullet", "depth": 2, "text": "营业执照" },
      { "kind": "bullet", "depth": 2, "text": "标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "补充材料：" },
      { "kind": "bullet", "depth": 2, "text": "标准劳动合同副本" },
      { "kind": "bullet", "depth": 2, "text": "身份担保书" },
      { "kind": "bullet", "depth": 2, "text": "外国人船员雇佣申报受理书（地方海洋港湾厅长发行）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "E-10-1 (Thuyền viên nội địa)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cơ bản:" },
      { "kind": "bullet", "depth": 2, "text": "Đơn xin cấp giấy phép cấp thị thực (Mẫu phụ lục số 21)" },
      { "kind": "bullet", "depth": 2, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 2, "text": "Giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ bổ sung:" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao hợp đồng lao động chuẩn" },
      { "kind": "bullet", "depth": 2, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 2, "text": "Giấy tiếp nhận khai báo tuyển dụng thuyền viên nước ngoài (do Trưởng Cục Hàng hải và Cảng biển địa phương cấp)" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao giấy phép kinh doanh vận tải hành khách nội địa, giấy đăng ký kinh doanh vận tải hàng hoá nội địa (khi nộp lần đầu hoặc thay đổi đăng ký)" },
      { "kind": "bullet", "depth": 2, "text": "Thư giới thiệu tuyển dụng thuyền viên nước ngoài (do Trưởng Cục Hàng hải và Thuỷ sản địa phương cấp)" },
      { "kind": "bullet", "depth": 2, "text": "\"Giấy chứng nhận sức chứa thuyền viên\" hoặc \"Giấy chứng nhận kiểm tra tàu dưới 500 tấn\" và các giấy tờ cần thiết khác" },
      { "kind": "bullet", "depth": 2, "text": "Văn bản phê duyệt vận hành T/O theo thoả thuận lao động - quản lý của từng hãng tàu (nếu có)" },
      { "kind": "bullet", "depth": 0, "text": "E-10-2 (Thuyền viên tàu cá)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cơ bản:" },
      { "kind": "bullet", "depth": 2, "text": "Đơn xin cấp giấy phép cấp thị thực (Mẫu phụ lục số 21)" },
      { "kind": "bullet", "depth": 2, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 2, "text": "Giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ bổ sung:" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao hợp đồng lao động chuẩn" },
      { "kind": "bullet", "depth": 2, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 2, "text": "Giấy tiếp nhận khai báo tuyển dụng thuyền viên nước ngoài (do Trưởng Cục Hàng hải và Cảng biển địa phương cấp)" },
      { "kind": "bullet", "depth": 2, "text": "Giấy phép đánh bắt bằng lưới định ngư và giấy chỉ định sử dụng tàu quản lý (giấy phép sử dụng tàu cá), bản sao giấy phép đánh bắt gần bờ (khi nộp lần đầu hoặc thay đổi đăng ký)" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận kiểm tra tàu" },
      { "kind": "bullet", "depth": 2, "text": "Thư giới thiệu tuyển dụng thuyền viên nước ngoài (do Trưởng Cục Hàng hải và Thuỷ sản địa phương cấp)" },
      { "kind": "bullet", "depth": 2, "text": "Giấy đăng ký kinh doanh vận chuyển sản phẩm đánh bắt (chỉ áp dụng cho ngành vận chuyển sản phẩm đánh bắt)" },
      { "kind": "bullet", "depth": 0, "text": "E-10-3 (Thuyền viên tàu khách du lịch)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ cơ bản:" },
      { "kind": "bullet", "depth": 2, "text": "Đơn xin cấp giấy phép cấp thị thực (Mẫu phụ lục số 21)" },
      { "kind": "bullet", "depth": 2, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 2, "text": "Giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ bổ sung:" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao hợp đồng lao động chuẩn" },
      { "kind": "bullet", "depth": 2, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 2, "text": "Giấy tiếp nhận khai báo tuyển dụng thuyền viên nước ngoài (do Trưởng Cục Hàng hải và Cảng biển địa phương cấp)" }
    ]
  },
  "F-1": {
    "titleKo": "F-1 방문동거 비자 - 가족 및 가사보조인",
    "titleEn": "F-1 Visiting & Joining Family - Family/Domestic Assistant",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "친척방문 가족동거 피부양 가사정리 기타 이와 유사한 목적의 체류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visiting relatives, family cohabitation, dependent care, household arrangements, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum length of stay that can be granted once: 2 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "주한 외국공관원의 가사보조인"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외교(A-1) 내지 협정(A-3) 자격에 해당하는 자의 동거인으로서 그 세대에 속하지 아니한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재외동포(F-4) 자격을 취득한 자의 가족 (배우자 및 미성년 자녀)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "방문취업 (H-2) 자격을 취득한 자의 가족 (배우자 및 미성년 자녀)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고등학교 이하의 교육기관에 입학 예정이거나 재학 중인 미성년외국인 유학생과 동반 체류하려는 부모"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "SOFA 21 해당자의 세 이상의 동반자녀 또는 기타 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "그 밖에 부득이한 사유로 직업활동에 종사하지 아니하고 대한민국에 장기간 체류하여야 할 사정이 있다고 인정되는 사람 (체류자격 변경허가 대상)"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A domestic assistant at a foreign mission in Korea"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A domestic partner of a person in diplomatic (A-1) or cooperative (A-3) status who is not a member of the same household."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members (spouse and minor children) of a person who has obtained F-4 status."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members (spouses and minor children) of those who have obtained visitor (H-2) status"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Parents who intend to stay with a minor alien student who is enrolled or attending an institution of higher education below high school."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A SOFA 21 dependent child or other family member over the age of 18 years old"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Other persons who are not engaged in professional activities for unavoidable reasons and are recognized as having circumstances that require them to stay in Korea for an extended period of time (subject to permission to change status of residence)"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 유학생 동반부모 (F-1-13)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "입학허가서 또는 재학증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류 (원본 및 번역본 첨부, 호구부, 출생증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 체류비용 부담능력 입증서류 (3개월 이상 계속 예치된 기준 이상 금액의 잔고증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정능력 입증서류 (불법체류 다발국가 국민에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "주한 외국공관원의 가사보조인(F-1-21)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국공관의 협조공문"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용인의 신분증명서 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "투자가 및 전문인력의 외국인 가사보조인(F-1-22, F-1-23, F-1-24)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자신고서 또는 투자기업등록증사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용주의 재직증명서 (신분증명서)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용주의 소득 요건 입증 자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가사보조인 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가사보조인의 졸업증명서 등 학력 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "1년 이상 고용주의 가사보조인으로 근무한 사실 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외교(A-1) 내지 협정(A-3) 자격자의 동거인(F-1-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "친족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동거 또는 장기체류 필요성 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재외동포(F-4), 방문취업(H-2) 자격자 가족(F-1-9, F-1-11)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재외동포(F-4) 또는 방문취업(H-2) 자격 취득자의 거소신고증, 외국인등록증 또는 사증발급 사항 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "SOFA 해당자 가족"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "친족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동거 또는 장기체류 필요성 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결혼이민자의 부모 등 가족(F-1-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청인의 신분증 사본, 초청장, 신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청인의 기본증명서, 가족관계증명서, 혼인관계증명서, 주민등록표 등본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자녀 관련 증명서 (임신한 경우 임신진단서 또는 산모수첩)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "본국 가족관계 증명서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자녀가 취학연령인 경우 재학증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "우수인재, 투자자 및 유학생 부모(F-1-15)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청사유서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소득, 투자금, 체류경비 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고액투자가 및 해외우수인재 가사보조인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자신고서, 투자기업등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용주의 재직증명서, 소득 수준 입증 자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가사보조인의 졸업증명서 등 학력 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "주한 외국공관원의 가사보조인(F-1-21)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국공관의 요청공문"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용인의 외교관신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 우수인재의 배우자 및 미성년 자녀(F-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 외국인등록증, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵 진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주 체류자의 고용계약서, 재직증명서 등 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 소명 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "점수표와 소명 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Parents of international students (high school and below) (F-1-13)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Letter of acceptance or proof of enrollment"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of family relationship (original and translated, letter, birth certificate, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of ability to pay for the cost of staying in Korea (proof of bank account balance of more than the standard amount deposited for more than 3 months, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of financial ability (for nationals of multiple illegal immigration countries only)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Withholding receipts issued (certified or notarized) by a domestic government agency or bank in an amount above the threshold, proof of real estate ownership, real estate transaction contract, proof of deposit balance, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Single-entry visa (F-1-21) for a period of stay of one year or less for a person who is a domestic assistant at a foreign mission in Korea and has the same nationality as the mission."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Letter of cooperation from the foreign mission"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of the employee's identification card"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(F-1-22, F-1-23, F-1-24) Foreign domestic assistants of investors and professionals (F-1-22, F-1-23, F-1-24)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for visa issuance, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Foreign Investment Declaration (copy of full corporate registration certificate or business license) or copy of investment enterprise registration certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employer's proof of employment (identification card)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employer's proof of income requirements"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Earned income tax receipt, income amount certificate, paycheck stub, passbook copy, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of employment as a domestic permanent worker (for those investing less than US$500,000)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment contract for domestic help"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving the domestic worker's education, such as graduation certificate, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving that the domestic worker has been working as a domestic worker for the employer for more than one year."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A single-entry visitor visa for a period of stay of one year or less for a person who is a domestic partner of a person with diplomatic (A-1) or cooperative (A-3) status and who is not a member of the same household."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving kinship (family register, resident card, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving the need for cohabitation or long-term stay"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Duplicate visitor visa (F-1-9, F-1-11) for family members of those who have obtained overseas compatriot (F-4) or visitor worker (H-2) status."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Domestic residence declaration card (alien registration card) or a copy of the visa issuance (including a copy of the passport) of a person who has obtained the status of overseas compatriot (F-4) or visiting worker (H-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of family relationship"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A single-entry visa for a child or other family member 21 years of age or older for a stay of one year or less for the SOFA holder."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving kinship"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving the need for cohabitation or long-term stay"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visiting family members such as parents of married immigrants entering the country for child support (F-1-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(Applicant) Application form, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(Invitee) Copy of identification card, invitation letter, identity guarantee (guarantee period: 3 years from the date of entry), pledge to prevent illegal immigration and employment"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(Proof of domestic family relationship) Basic certificate, family relationship certificate, marriage certificate, resident registration card (certified copy), family relationship certificate of children's names (pregnancy certificate or maternity certificate if pregnant)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "If you have more than one child, submit family relationship certificates for all children, and if the child is an adopted child, submit an additional adoption certificate for the sponsor."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(Proof of family relationship in the home country) A family relationship certificate (an official document issued by the government of the country) that identifies all immediate family members and siblings of the marriage immigrant."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "(If the sponsor is a family member in the home country other than the parents) A document confirming that both parents of the marriage immigrant are inadmissible for reasons such as death, illness, or advanced age (60 years or older), and additional family relationship documents confirming the sponsor's immediate family."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of school enrollment (if the child is of school age)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Parents of Highly Qualified Talent, Investors, and International Students (F-1-15)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for Authorization to Issue Visa, passport, and one standard-sized photograph"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Letter of invitation (stating that you will not seek employment)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of family relationship"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of income, investments, and living expenses"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Domestic assistant for high net worth investor (F-1-22) and outstanding foreign talent (F-1-24)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance authorization application, passport, and one standardized photograph"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A copy of the foreign investment notification form (full certificate of incorporation or business license) or investment company registration certificate."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "However, for those who fall under the category of corporate investment (D-8), the following documents are required"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Venture company confirmation letter or preliminary venture company confirmation letter"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Documents proving that you have industrial property rights, other equivalent technologies and rights to use them, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of employment contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment certificate (identification card) from employer"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents proving the domestic worker's educational background, such as a graduation certificate, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of the employer's annual income level"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Income tax receipts, source of income, pay stubs, bank statements, etc."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Additional documents for those investing less than US$500,000"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Documents to prove that you are an employed Korean full-time worker: Income tax withholding receipt, proof of income amount, pay stub, passbook copy, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Domestic assistant at a foreign mission in Korea (F-1-21)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa issuance authorization application, passport, one standardized photo"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Spouses and minor children (F-1-12) of merit-based candidates"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for authorization to issue a visa, passport, alien registration card (only for those who have completed alien registration), and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Tuberculosis certificate (in accordance with the Guidelines for Issuance of Visa and Residence Management for Foreigners with Tuberculosis)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment contract of the main resident, certificate of employment, business license, corporate registration certificate, proof of income amount, degree certificate, graduation certificate, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of family relationship (must be a legal family relationship with the main resident)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Scorecard for the point system evaluation"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents explaining the scores for each evaluation item written by the applicant."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of place of residence"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Additional documents requested by the examiner"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Request letter from the foreign mission"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Copy of employment contract"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A copy of the employee's diplomatic identification card"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "친척방문 가족동거 피부양 가사정리 기타 이와 유사한 목적의 체류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 2년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "주한 외국공관원의 가사보조인"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외교(A-1) 내지 협정(A-3) 자격에 해당하는 자의 동거인으로서 그 세대에 속하지 아니한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재외동포(F-4) 자격을 취득한 자의 가족 (배우자 및 미성년 자녀)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "방문취업 (H-2) 자격을 취득한 자의 가족 (배우자 및 미성년 자녀)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고등학교 이하의 교육기관에 입학 예정이거나 재학 중인 미성년외국인 유학생과 동반 체류하려는 부모"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "SOFA 21 해당자의 세 이상의 동반자녀 또는 기타 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "그 밖에 부득이한 사유로 직업활동에 종사하지 아니하고 대한민국에 장기간 체류하여야 할 사정이 있다고 인정되는 사람 (체류자격 변경허가 대상)"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인 유학생 동반부모 (F-1-13)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "입학허가서 또는 재학증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류 (원본 및 번역본 첨부, 호구부, 출생증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 체류비용 부담능력 입증서류 (3개월 이상 계속 예치된 기준 이상 금액의 잔고증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정능력 입증서류 (불법체류 다발국가 국민에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "주한 외국공관원의 가사보조인(F-1-21)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국공관의 협조공문"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용인의 신분증명서 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "투자가 및 전문인력의 외국인 가사보조인(F-1-22, F-1-23, F-1-24)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자신고서 또는 투자기업등록증사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용주의 재직증명서 (신분증명서)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용주의 소득 요건 입증 자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가사보조인 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가사보조인의 졸업증명서 등 학력 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "1년 이상 고용주의 가사보조인으로 근무한 사실 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외교(A-1) 내지 협정(A-3) 자격자의 동거인(F-1-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "친족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동거 또는 장기체류 필요성 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재외동포(F-4), 방문취업(H-2) 자격자 가족(F-1-9, F-1-11)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재외동포(F-4) 또는 방문취업(H-2) 자격 취득자의 거소신고증, 외국인등록증 또는 사증발급 사항 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "SOFA 해당자 가족"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "친족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "동거 또는 장기체류 필요성 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결혼이민자의 부모 등 가족(F-1-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청인의 신분증 사본, 초청장, 신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청인의 기본증명서, 가족관계증명서, 혼인관계증명서, 주민등록표 등본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자녀 관련 증명서 (임신한 경우 임신진단서 또는 산모수첩)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "본국 가족관계 증명서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "자녀가 취학연령인 경우 재학증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "우수인재, 투자자 및 유학생 부모(F-1-15)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청사유서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소득, 투자금, 체류경비 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "고액투자가 및 해외우수인재 가사보조인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인투자신고서, 투자기업등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용주의 재직증명서, 소득 수준 입증 자료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가사보조인의 졸업증명서 등 학력 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "주한 외국공관원의 가사보조인(F-1-21)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국공관의 요청공문"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용인의 외교관신분증 사본"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 우수인재의 배우자 및 미성년 자녀(F-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 외국인등록증, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵 진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주 체류자의 고용계약서, 재직증명서 등 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 소명 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "점수표와 소명 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류"
      }
    ],
    "titleZh": "F-1 访问同居签证 - 家属及家政辅助员",
    "titleVi": "Visa F-1 Thăm thân và đồng cư trú - Gia đình và người giúp việc gia đình",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "探亲、家庭同住、被赡养、家务整理及其他类似目的的停留" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：2 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Lưu trú với mục đích thăm thân, sống chung với gia đình, được cấp dưỡng, chăm sóc gia đình và các mục đích tương tự" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 2 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "驻韩外国公馆员的家政辅助员" },
      { "kind": "bullet", "depth": 0, "text": "外交（A-1）至协定（A-3）资格者的同居人，但非属同一户" },
      { "kind": "bullet", "depth": 0, "text": "取得海外同胞（F-4）资格者的家属（配偶及未成年子女）" },
      { "kind": "bullet", "depth": 0, "text": "取得访问就业（H-2）资格者的家属（配偶及未成年子女）" },
      { "kind": "bullet", "depth": 0, "text": "高中以下教育机构入学预定者或在读未成年外国留学生的随行父母" },
      { "kind": "bullet", "depth": 0, "text": "SOFA 21 对象者的成年随行子女或其他家属" },
      { "kind": "bullet", "depth": 0, "text": "其他因不得已事由不从事职业活动且需要在韩长期停留的人员（停留资格变更许可对象）" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người giúp việc gia đình của nhân viên cơ quan đại diện nước ngoài tại Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "Người sống chung với người mang tư cách Ngoại giao (A-1) đến Hiệp định (A-3) nhưng không thuộc cùng hộ" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình (vợ/chồng và con chưa thành niên) của người đã nhận tư cách Đồng bào Hải ngoại (F-4)" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình (vợ/chồng và con chưa thành niên) của người đã nhận tư cách Việc làm thăm thân (H-2)" },
      { "kind": "bullet", "depth": 0, "text": "Cha mẹ đi cùng du học sinh nước ngoài chưa thành niên đang học hoặc dự kiến nhập học các cơ sở giáo dục từ THPT trở xuống" },
      { "kind": "bullet", "depth": 0, "text": "Con cái thành niên hoặc thành viên gia đình khác đi cùng người thuộc diện SOFA 21" },
      { "kind": "bullet", "depth": 0, "text": "Người khác không tham gia hoạt động nghề nghiệp do lý do bất khả kháng và được công nhận có nhu cầu lưu trú dài hạn tại Hàn Quốc (đối tượng chuyển đổi tư cách lưu trú)" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "外国留学生随行父母（F-1-13）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "入学许可书或在学证明" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明材料（原件及译本，户口簿、出生证明等）" },
      { "kind": "bullet", "depth": 1, "text": "国内停留费用承担能力证明（连续存放 3 个月以上、达到标准金额以上的余额证明等）" },
      { "kind": "bullet", "depth": 1, "text": "财力证明（仅限非法居留多发国家国民）" },
      { "kind": "bullet", "depth": 0, "text": "驻韩外国公馆员的家政辅助员（F-1-21）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "外国公馆的协助公文" },
      { "kind": "bullet", "depth": 1, "text": "雇佣合同" },
      { "kind": "bullet", "depth": 1, "text": "雇主的身份证明副本" },
      { "kind": "bullet", "depth": 0, "text": "投资家及专业人才的外籍家政辅助员（F-1-22、F-1-23、F-1-24）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "外商投资申报书或投资企业登记证副本" },
      { "kind": "bullet", "depth": 1, "text": "雇主的在职证明（身份证明）" },
      { "kind": "bullet", "depth": 1, "text": "雇主收入要件证明材料" },
      { "kind": "bullet", "depth": 1, "text": "家政辅助员雇佣合同" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书" },
      { "kind": "bullet", "depth": 1, "text": "家政辅助员毕业证等学历证明材料" },
      { "kind": "bullet", "depth": 1, "text": "证明在雇主处担任家政辅助员 1 年以上的材料" },
      { "kind": "bullet", "depth": 0, "text": "外交（A-1）至协定（A-3）资格者的同居人（F-1-3）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "亲属关系证明" },
      { "kind": "bullet", "depth": 1, "text": "证明同居或长期停留必要性的材料" },
      { "kind": "bullet", "depth": 0, "text": "海外同胞（F-4）、访问就业（H-2）资格者家属（F-1-9、F-1-11）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "海外同胞（F-4）或访问就业（H-2）资格取得者的居留申报证、外国人登录证或签证发放事项副本" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明" },
      { "kind": "bullet", "depth": 0, "text": "SOFA 对象者家属" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "亲属关系证明" },
      { "kind": "bullet", "depth": 1, "text": "证明同居或长期停留必要性的材料" },
      { "kind": "bullet", "depth": 0, "text": "结婚移民者的父母等家属（F-1-5）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "邀请人的身份证副本、邀请函、身份担保书" },
      { "kind": "bullet", "depth": 1, "text": "邀请人的基本证明、家庭关系证明、婚姻关系证明、居民登记表副本" },
      { "kind": "bullet", "depth": 1, "text": "子女相关证明（怀孕情况下，妊娠诊断书或产妇手册）" },
      { "kind": "bullet", "depth": 1, "text": "本国家庭关系证明材料" },
      { "kind": "bullet", "depth": 1, "text": "子女达就学年龄时的在学证明" },
      { "kind": "bullet", "depth": 0, "text": "优秀人才、投资者及留学生父母（F-1-15）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "邀请理由书" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明" },
      { "kind": "bullet", "depth": 1, "text": "收入、投资金、停留费用证明" },
      { "kind": "bullet", "depth": 0, "text": "高额投资家及海外优秀人才家政辅助员" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "外商投资申报书、投资企业登记证副本" },
      { "kind": "bullet", "depth": 1, "text": "雇佣合同" },
      { "kind": "bullet", "depth": 1, "text": "雇主的在职证明、收入水平证明" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书" },
      { "kind": "bullet", "depth": 1, "text": "家政辅助员毕业证等学历证明材料" },
      { "kind": "bullet", "depth": 0, "text": "驻韩外国公馆员的家政辅助员（F-1-21）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "外国公馆的请求公文" },
      { "kind": "bullet", "depth": 1, "text": "雇佣合同" },
      { "kind": "bullet", "depth": 1, "text": "雇主的外交官身份证副本" },
      { "kind": "bullet", "depth": 0, "text": "计分制优秀人才的配偶及未成年子女（F-1-12）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、外国人登录证、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "结核诊断书" },
      { "kind": "bullet", "depth": 1, "text": "主要停留者的雇佣合同、在职证明等相关材料" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明材料" },
      { "kind": "bullet", "depth": 1, "text": "积分表与说明材料" },
      { "kind": "bullet", "depth": 1, "text": "停留地证明材料" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Cha mẹ đi cùng du học sinh nước ngoài (F-1-13)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy phép nhập học hoặc giấy chứng nhận đang học" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ gia đình (bản gốc và bản dịch, sổ hộ khẩu, giấy khai sinh, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh khả năng chi trả chi phí lưu trú trong nước (giấy chứng nhận số dư duy trì trên 3 tháng từ mức tiêu chuẩn trở lên, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh năng lực tài chính (chỉ áp dụng với công dân các nước có tỷ lệ cư trú bất hợp pháp cao)" },
      { "kind": "bullet", "depth": 0, "text": "Người giúp việc gia đình của nhân viên cơ quan đại diện nước ngoài tại Hàn Quốc (F-1-21)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Công hàm hợp tác của cơ quan đại diện nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy tờ tuỳ thân của người sử dụng lao động" },
      { "kind": "bullet", "depth": 0, "text": "Người giúp việc gia đình nước ngoài của nhà đầu tư và chuyên gia (F-1-22, F-1-23, F-1-24)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Đơn khai báo đầu tư nước ngoài hoặc bản sao giấy đăng ký doanh nghiệp đầu tư" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang công tác (giấy tờ tuỳ thân) của người sử dụng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh điều kiện thu nhập của người sử dụng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động của người giúp việc gia đình" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh học vấn của người giúp việc (bằng tốt nghiệp, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh đã làm người giúp việc cho người sử dụng lao động trên 1 năm" },
      { "kind": "bullet", "depth": 0, "text": "Người sống chung với người mang tư cách Ngoại giao (A-1) đến Hiệp định (A-3) (F-1-3)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ thân tộc" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh sự cần thiết của việc sống chung hoặc lưu trú dài hạn" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình người mang tư cách Đồng bào Hải ngoại (F-4) hoặc Việc làm thăm thân (H-2) (F-1-9, F-1-11)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Thẻ khai báo cư trú, thẻ đăng ký người nước ngoài hoặc bản sao thông tin cấp thị thực của người mang tư cách F-4 hoặc H-2" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ gia đình" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình người diện SOFA" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ thân tộc" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh sự cần thiết của việc sống chung hoặc lưu trú dài hạn" },
      { "kind": "bullet", "depth": 0, "text": "Cha mẹ và người thân của người kết hôn nhập cư (F-1-5)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao giấy tờ tuỳ thân, thư mời, giấy bảo lãnh nhân thân của người mời" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận cơ bản, giấy chứng nhận quan hệ gia đình, giấy chứng nhận quan hệ hôn nhân, bản sao bảng đăng ký dân của người mời" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ liên quan đến con cái (giấy chẩn đoán mang thai hoặc sổ thai sản nếu đang mang thai)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ gia đình tại nước nhà" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang đi học khi con cái đến tuổi đi học" },
      { "kind": "bullet", "depth": 0, "text": "Cha mẹ của nhân tài, nhà đầu tư và du học sinh (F-1-15)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Lý do mời" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ gia đình" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh thu nhập, vốn đầu tư, chi phí lưu trú" },
      { "kind": "bullet", "depth": 0, "text": "Người giúp việc của nhà đầu tư lớn và nhân tài hải ngoại" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Đơn khai báo đầu tư nước ngoài, bản sao giấy đăng ký doanh nghiệp đầu tư" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận đang công tác và hồ sơ chứng minh mức thu nhập của người sử dụng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh học vấn của người giúp việc (bằng tốt nghiệp, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "Người giúp việc gia đình của nhân viên cơ quan đại diện nước ngoài tại Hàn Quốc (F-1-21)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Công hàm yêu cầu của cơ quan đại diện nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động" },
      { "kind": "bullet", "depth": 1, "text": "Bản sao thẻ ngoại giao của người sử dụng lao động" },
      { "kind": "bullet", "depth": 0, "text": "Vợ/chồng và con chưa thành niên của nhân tài theo hệ thống tính điểm (F-1-12)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, thẻ đăng ký người nước ngoài, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chẩn đoán lao" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động, giấy chứng nhận đang công tác và các giấy tờ liên quan của người lưu trú chính" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ gia đình" },
      { "kind": "bullet", "depth": 1, "text": "Bảng tính điểm và hồ sơ giải trình" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh nơi lưu trú" }
    ]
  },
  "F-2": {
    "titleKo": "F-2 거주 비자 - 장기 체류",
    "titleEn": "F-2 Residence Type - Long-term Stay",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주자격을 부여받기 위하여 국내 장기체류하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who intend to stay in Korea for a long period of time in order to obtain permanent resident status."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay: 5 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민의 미성년 외국인 자녀 및 영주 체류자격자(F-5)의 배우자 및 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민과 혼인관계(사실혼 포함)에서 출생한 자로 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민으로 인정된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인투자 촉진법에 따른 외국투자가 및 관련자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "미화 50만 달러 이상 투자 후 D-8 체류자격으로 3년 이상 체류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국법인의 임직원으로 50만 달러 이상 투자 후 3년 이상 체류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "미화 30만 달러 이상 투자 후 2명 이상의 국민 고용"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주 체류자격 상실자 중 법무부장관이 계속 체류 필요성을 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 5년 이상 체류하며 국내 생활 근거지가 있는 자로서 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "특정 취업 체류자격자로 과거 10년 이내 4년 이상 취업활동 경험이 있는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기술·기능 자격증 소지 및 일정 임금 이상 수령"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법무부장관이 정하는 금액 이상의 자산 보유"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국에서 거주할 기본 소양 보유 및 성년인 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국가·지방공무원법에 따른 공무원으로 임용된 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 정한 나이, 학력, 소득 기준에 해당하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 고시한 기준에 따라 부동산 또는 자산에 투자한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 특별한 기여를 했거나 공익 증진에 기여했다고 인정받은 사람"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1. a minor alien child of a national or the spouse of a person with permanent resident (F-5) status and his or her minor children"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person born in a marriage (including a de facto marriage) to a national, as recognized by the Attorney General"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "3. Persons recognized as refugees"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "4. A person who is a foreign investor under the Foreign Investment Promotion Act and falls under any of the following."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A foreigner who has invested US$500,000 or more and has been continuously residing in Korea for more than three years under the status of enterprise investment (D-8)."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A foreign corporation that has invested more than US$500,000 and is dispatched to a domestic foreign-invested company under the Foreign Investment Promotion Act. A foreign corporation that has invested more than US$500,000 in a domestic foreign-invested company and has been staying in Korea for more than three years."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A foreigner who has invested US$300,000 or more and employs two or more nationals."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who has lost the status of permanent residence (F-5) and the Minister of Justice recognizes that it is necessary to continue to stay in Korea in order to protect the rights and interests of domestic relations (excluding those who have been forcibly evicted)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "6. A person recognized by the Minister of Justice as a person with a status of residence other than diplomatic (A-1) to agreement (A-3) who has been continuously residing in Korea for more than five years and has his/her place of residence in Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "7. A person who is working in a non-professional (E-9), seafarer (E-10), or visitor (H-2) status of residence who has worked for a period of four years or more in a status of residence determined by the Minister of Justice within the past 10 years, and who meets all of the following requirements."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Possess technical or skill certifications as prescribed by the Minister of Justice or receive wages of a certain amount or more in Korea (the types of technical or skill certifications and wage standards shall be prescribed by the Minister of Justice in consultation with the head of the relevant central administrative agency)."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Have assets in excess of the amount prescribed by the Minister of Justice."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Have reached the age of majority under the Civil Code of the Republic of Korea, be of good moral character, and possess the basic skills necessary to live in the Republic of Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "8. is recognized by the Minister of Justice as a person appointed as a public official under the National Civil Service Act or the Local Civil Service Act"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "9. A person whose age, education, income, etc. fall within the standards set by the Minister of Justice and published by the Ministry of Justice"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "10. A foreigner recognized by the Minister of Justice as a person who has invested in assets such as real estate or as an officer or shareholder of a corporation in accordance with the criteria prescribed by the Minister of Justice, including the investment area, investment object, and investment amount."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "11. A person recognized by the Minister of Justice as having made special contributions to the Republic of Korea or contributed to the promotion of public interest"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "12. Spouses and minor children of persons falling under 9 through 11."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주(F-5) 배우자의 거주 단수사증 (F-2-3, 체류기간 1년 이하)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서, 초청장, 혼인배경 진술서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "혼인관계 입증서류 (결혼증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정 (소득) 입증서류 (소득금액증명원 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신용정보조회서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "범죄경력증명서 (국적국 및 거주국)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "건강진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "혼인 해소 증빙 서류 (해당 시)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민의 미성년 외국인 자녀의 거주 단수사증 (F-2-2, 체류기간 90일 이하)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국민의 미성년 자녀임을 입증하는 공적 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "양육권 입증 서류 및 신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "양육권자 동의서 (해당 시)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민과 혼인관계에서 출생한 자녀의 거주 복수사증 (F-2-2, 체류기간 1년 이하)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "친자관계 입증 서류 (유전자 검사, 출생증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상장법인 유망산업분야 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급인정신청서, 여권, 외국인등록증, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵 진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서, 재직증명서, 사업자등록증, 법인등기부등본, 소득금액증명, 학위증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "점수표 및 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 우수인재의 배우자 및 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급인정신청서, 여권, 외국인등록증, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵 진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주체류자의 고용 및 소득 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 소명 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "점수표 및 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A single-entry residence permit for the (F-5) spouse of the permanent resident status holder for a period of stay of not more than 1 (F-2-3) years."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Domestic spouse's identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Invitation letter, marriage background statement"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of marriage between the invitee and the host country"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Marriage certificate, certificate of family history, etc."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Financial (income) documents"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Income certificate (issued by the tax office), employment certificate, account transaction history, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Credit report of the invitee (issued by the Korea National Banking Association)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificates of criminal background for both the sponsor and the sponsee issued by the competent authorities of the country of nationality or residence."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "If the permanent resident (F-5) status holder has already submitted a certificate of criminal history when changing his/her permanent resident status, it can be omitted only for himself/herself. However, if you have stayed abroad for more than 6 months after changing your permanent residence status, you must submit a certificate of criminal history issued by the government of the country where you stayed during your stay."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Medical certificates for both the sponsor and the sponsee"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "A medical certificate issued by a hospital-level medical institution under Article 3, Paragraph 2, Item 3 of the Medical Act or a public health center under Article 7 of the Community Health Act. However, in the case of the invitee, it may be substituted by the relevant health center or similar evidence that is accepted in the country of residence."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If there is a previous marriage record, a document that proves the dissolution of the marriage (divorce certificate, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "For minor foreign children of nationals, a single residence (F-2-2) certificate for a period of stay of 90 days or less."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, one standardized photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Official documents that prove you are a minor child of a Korean national"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documentation of the relationship and custody of the minor by the Korean national."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A letter of support from the father or mother who has custody (if the father or mother has a spouse, a letter of support from the spouse is also required)."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If the custodial relationship cannot be proven, the consent of the minor's parent or guardian who has the same nationality as the minor (if there is no parent or guardian, an official document or notarized certificate from the relevant country proving that there is no parent or guardian)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A duplicate certificate of residence (F-2-2) valid for five years for a child born in a marriage (including a de facto marriage) to a national, with a period of stay of one year or less."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application form, passport, one standard-sized photo, and fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Letter of invitation"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of relationship between the national and the minor"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Proof of paternity, such as a genetic test or birth certificate."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "South Korean national identity card or mock identity card."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "4. Publicly traded companies working in promising industries"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for authorization to issue a visa, passport, alien registration card (only for those who have completed alien registration), and one standardized photograph."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Tuberculosis certificate (in accordance with the Guidelines for Issuance of Visa and Residence Management for Foreigners with Tuberculosis)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Applicant's employment contract, certificate of employment, business license, corporate registration certificate, proof of income amount, certificate of degree acquisition (planned), certificate of graduation (planned), etc. (Applicant) If the applicant is employed (including planned employment) at a company listed on ✔️유가증권시장 (KOSPI) or KOSDAQ (KOSDAQ) and is unable to submit proof of income amount, the annual income will be calculated as the equivalent of the annual salary stated in the employment contract."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A score sheet indicating the number of points the applicant received"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents supporting the applicant's scores for each evaluation item."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of place of residence"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Additional documents requested by the examiner"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Spouses and minor children of merit-based applicants"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Application for authorization to issue a visa, passport, alien registration card (only for those who have completed alien registration), and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Tuberculosis certificate (in accordance with the Guidelines for Issuance of Visa and Residence Management for Foreigners with Tuberculosis, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment contract, certificate of service, business license, proof of earnings from the corporate register, certificate of completion of a degree, certificate of graduation, etc. (if applicable)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "If you are employed (or plan to be employed) at a company listed on the KOSPI or KOSDAQ, and cannot provide proof of the amount of your income, we will calculate your annual income as the equivalent of the annual salary stated in your employment contract."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of family relationship (must be a legal family relationship with the main resident)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A score sheet with points for the point system evaluation."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documentation of the applicant's score for each evaluation item."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of place of residence"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Additional documents requested by the examiner"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주자격을 부여받기 위하여 국내 장기체류하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 5년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민의 미성년 외국인 자녀 및 영주 체류자격자(F-5)의 배우자 및 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민과 혼인관계(사실혼 포함)에서 출생한 자로 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민으로 인정된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인투자 촉진법에 따른 외국투자가 및 관련자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "미화 50만 달러 이상 투자 후 D-8 체류자격으로 3년 이상 체류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국법인의 임직원으로 50만 달러 이상 투자 후 3년 이상 체류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "미화 30만 달러 이상 투자 후 2명 이상의 국민 고용"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주 체류자격 상실자 중 법무부장관이 계속 체류 필요성을 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 5년 이상 체류하며 국내 생활 근거지가 있는 자로서 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "특정 취업 체류자격자로 과거 10년 이내 4년 이상 취업활동 경험이 있는 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기술·기능 자격증 소지 및 일정 임금 이상 수령"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "법무부장관이 정하는 금액 이상의 자산 보유"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "대한민국에서 거주할 기본 소양 보유 및 성년인 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국가·지방공무원법에 따른 공무원으로 임용된 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 정한 나이, 학력, 소득 기준에 해당하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부장관이 고시한 기준에 따라 부동산 또는 자산에 투자한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국에 특별한 기여를 했거나 공익 증진에 기여했다고 인정받은 사람"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주(F-5) 배우자의 거주 단수사증 (F-2-3, 체류기간 1년 이하)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서, 초청장, 혼인배경 진술서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "혼인관계 입증서류 (결혼증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "재정 (소득) 입증서류 (소득금액증명원 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신용정보조회서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "범죄경력증명서 (국적국 및 거주국)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "건강진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "혼인 해소 증빙 서류 (해당 시)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민의 미성년 외국인 자녀의 거주 단수사증 (F-2-2, 체류기간 90일 이하)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국민의 미성년 자녀임을 입증하는 공적 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "양육권 입증 서류 및 신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "양육권자 동의서 (해당 시)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국민과 혼인관계에서 출생한 자녀의 거주 복수사증 (F-2-2, 체류기간 1년 이하)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "초청장"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "친자관계 입증 서류 (유전자 검사, 출생증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상장법인 유망산업분야 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급인정신청서, 여권, 외국인등록증, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵 진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "고용계약서, 재직증명서, 사업자등록증, 법인등기부등본, 소득금액증명, 학위증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "점수표 및 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 우수인재의 배우자 및 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사증발급인정신청서, 여권, 외국인등록증, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "결핵 진단서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주체류자의 고용 및 소득 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 소명 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "점수표 및 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류"
      }
    ],
    "titleZh": "F-2 居住签证 - 长期停留",
    "titleVi": "Visa F-2 Cư trú - Lưu trú dài hạn",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "为获得永久居留资格而欲在韩国长期停留的人员" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：5 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người muốn lưu trú dài hạn tại Hàn Quốc để được cấp tư cách thường trú" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 5 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "国民的未成年外籍子女，及永久居留资格者（F-5）的配偶及未成年子女" },
      { "kind": "bullet", "depth": 0, "text": "与韩国国民婚姻关系（含事实婚）中出生且经法务部长官认定者" },
      { "kind": "bullet", "depth": 0, "text": "被认定为难民者" },
      { "kind": "bullet", "depth": 0, "text": "依据《外国人投资促进法》的外国投资者及相关人员" },
      { "kind": "bullet", "depth": 1, "text": "以 50 万美元以上投资后，以 D-8 资格在韩停留 3 年以上" },
      { "kind": "bullet", "depth": 1, "text": "以外国法人员工身份投资 50 万美元以上后，停留 3 年以上" },
      { "kind": "bullet", "depth": 1, "text": "投资 30 万美元以上并雇佣 2 名以上韩国国民" },
      { "kind": "bullet", "depth": 0, "text": "失去永久居留资格者中，经法务部长官认定有继续停留必要的人员" },
      { "kind": "bullet", "depth": 0, "text": "在韩停留 5 年以上、有韩国生活基础并经法务部长官认定的人员" },
      { "kind": "bullet", "depth": 0, "text": "特定就业资格者中，过去 10 年内有 4 年以上就业活动经历者" },
      { "kind": "bullet", "depth": 1, "text": "持有技术·技能资格证及一定工资以上" },
      { "kind": "bullet", "depth": 1, "text": "持有法务部长官规定金额以上的资产" },
      { "kind": "bullet", "depth": 1, "text": "具备在韩居住的基本素养且为成年人" },
      { "kind": "bullet", "depth": 0, "text": "依据《国家·地方公务员法》被任用为公务员者" },
      { "kind": "bullet", "depth": 0, "text": "符合法务部长官规定的年龄、学历、收入标准者" },
      { "kind": "bullet", "depth": 0, "text": "依据法务部长官公告标准投资不动产或资产者" },
      { "kind": "bullet", "depth": 0, "text": "对韩国有特别贡献或被认定为对促进公益有所贡献者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Con chưa thành niên là người nước ngoài của công dân Hàn Quốc, vợ/chồng và con chưa thành niên của người mang tư cách Thường trú (F-5)" },
      { "kind": "bullet", "depth": 0, "text": "Người sinh ra trong quan hệ hôn nhân với công dân Hàn Quốc (bao gồm sống chung như vợ chồng) và được Bộ trưởng Tư pháp công nhận" },
      { "kind": "bullet", "depth": 0, "text": "Người được công nhận là người tị nạn" },
      { "kind": "bullet", "depth": 0, "text": "Nhà đầu tư nước ngoài và người liên quan theo Luật Khuyến khích Đầu tư Nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Đầu tư từ 500.000 USD trở lên và lưu trú từ 3 năm trở lên với tư cách D-8" },
      { "kind": "bullet", "depth": 1, "text": "Người là cán bộ pháp nhân nước ngoài đầu tư từ 500.000 USD trở lên và lưu trú từ 3 năm trở lên" },
      { "kind": "bullet", "depth": 1, "text": "Đầu tư từ 300.000 USD trở lên và tuyển dụng 2 công dân Hàn Quốc trở lên" },
      { "kind": "bullet", "depth": 0, "text": "Người mất tư cách thường trú nhưng được Bộ trưởng Tư pháp công nhận có nhu cầu lưu trú tiếp" },
      { "kind": "bullet", "depth": 0, "text": "Người lưu trú tại Hàn Quốc từ 5 năm trở lên có cơ sở sinh hoạt trong nước và được Bộ trưởng Tư pháp công nhận" },
      { "kind": "bullet", "depth": 0, "text": "Người có 4 năm kinh nghiệm hoạt động làm việc trở lên trong vòng 10 năm với tư cách lưu trú đặc thù về việc làm" },
      { "kind": "bullet", "depth": 1, "text": "Sở hữu chứng chỉ kỹ thuật/kỹ năng và nhận mức lương từ một mức nhất định trở lên" },
      { "kind": "bullet", "depth": 1, "text": "Sở hữu tài sản từ mức do Bộ trưởng Tư pháp quy định trở lên" },
      { "kind": "bullet", "depth": 1, "text": "Có tố chất cơ bản để sinh sống tại Hàn Quốc và đã thành niên" },
      { "kind": "bullet", "depth": 0, "text": "Người được tuyển dụng làm công chức theo Luật Công chức Quốc gia/Địa phương" },
      { "kind": "bullet", "depth": 0, "text": "Người đáp ứng tiêu chuẩn về tuổi, học vấn, thu nhập do Bộ trưởng Tư pháp quy định" },
      { "kind": "bullet", "depth": 0, "text": "Người đầu tư bất động sản hoặc tài sản theo tiêu chuẩn do Bộ trưởng Tư pháp công bố" },
      { "kind": "bullet", "depth": 0, "text": "Người được công nhận có đóng góp đặc biệt cho Hàn Quốc hoặc đóng góp cho lợi ích công" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "永居（F-5）配偶的居住单次签证（F-2-3，停留期 1 年以下）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书、邀请函、婚姻背景陈述书" },
      { "kind": "bullet", "depth": 1, "text": "婚姻关系证明材料（结婚证等）" },
      { "kind": "bullet", "depth": 1, "text": "财力（收入）证明（收入金额证明等）" },
      { "kind": "bullet", "depth": 1, "text": "信用信息查询书" },
      { "kind": "bullet", "depth": 1, "text": "无犯罪记录证明（国籍国及居住国）" },
      { "kind": "bullet", "depth": 1, "text": "健康诊断书" },
      { "kind": "bullet", "depth": 1, "text": "婚姻解除证明材料（适用时）" },
      { "kind": "bullet", "depth": 0, "text": "国民的未成年外籍子女居住单次签证（F-2-2，停留期 90 日以下）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "证明为国民未成年子女的官方文件" },
      { "kind": "bullet", "depth": 1, "text": "抚养权证明及身份担保书" },
      { "kind": "bullet", "depth": 1, "text": "抚养权人同意书（适用时）" },
      { "kind": "bullet", "depth": 0, "text": "与国民婚姻关系中出生子女的居住复数签证（F-2-2，停留期 1 年以下）" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "邀请函" },
      { "kind": "bullet", "depth": 1, "text": "亲子关系证明（基因检测、出生证明等）" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书" },
      { "kind": "bullet", "depth": 0, "text": "上市法人有前途产业领域从业者" },
      { "kind": "bullet", "depth": 1, "text": "签证发放认定申请书、护照、外国人登录证、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "结核诊断书" },
      { "kind": "bullet", "depth": 1, "text": "雇佣合同、在职证明、营业执照、法人登记副本、收入金额证明、学位证明" },
      { "kind": "bullet", "depth": 1, "text": "积分表及证明材料" },
      { "kind": "bullet", "depth": 1, "text": "停留地证明材料" },
      { "kind": "bullet", "depth": 0, "text": "计分制优秀人才的配偶及未成年子女" },
      { "kind": "bullet", "depth": 1, "text": "签证发放认定申请书、护照、外国人登录证、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "结核诊断书" },
      { "kind": "bullet", "depth": 1, "text": "主停留者的雇佣及收入相关材料" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明材料" },
      { "kind": "bullet", "depth": 1, "text": "积分表及证明材料" },
      { "kind": "bullet", "depth": 1, "text": "停留地证明材料" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Visa cư trú đơn của vợ/chồng người thường trú (F-5) (F-2-3, thời hạn lưu trú dưới 1 năm)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân, thư mời, bản tường trình bối cảnh hôn nhân" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ hôn nhân (giấy đăng ký kết hôn, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh tài chính (thu nhập) (giấy chứng nhận số tiền thu nhập, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Báo cáo tra cứu thông tin tín dụng" },
      { "kind": "bullet", "depth": 1, "text": "Lý lịch tư pháp (nước quốc tịch và nước cư trú)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chẩn đoán sức khoẻ" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh việc giải tán hôn nhân (nếu có)" },
      { "kind": "bullet", "depth": 0, "text": "Visa cư trú đơn của con chưa thành niên là người nước ngoài của công dân (F-2-2, thời hạn lưu trú dưới 90 ngày)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ công chứng minh là con chưa thành niên của công dân" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quyền nuôi dưỡng và giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 1, "text": "Đơn đồng ý của người có quyền nuôi dưỡng (nếu có)" },
      { "kind": "bullet", "depth": 0, "text": "Visa cư trú nhiều lần của con sinh ra trong quan hệ hôn nhân với công dân (F-2-2, thời hạn lưu trú dưới 1 năm)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Thư mời" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ cha-con/mẹ-con (xét nghiệm gen, giấy khai sinh, v.v.)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 0, "text": "Người làm việc trong lĩnh vực ngành công nghiệp tiềm năng tại pháp nhân niêm yết" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, thẻ đăng ký người nước ngoài, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chẩn đoán lao" },
      { "kind": "bullet", "depth": 1, "text": "Hợp đồng lao động, giấy chứng nhận đang công tác, giấy phép kinh doanh, bản sao đăng ký pháp nhân, giấy chứng nhận số tiền thu nhập, bằng cấp" },
      { "kind": "bullet", "depth": 1, "text": "Bảng tính điểm và hồ sơ chứng minh" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh nơi lưu trú" },
      { "kind": "bullet", "depth": 0, "text": "Vợ/chồng và con chưa thành niên của nhân tài theo hệ thống tính điểm" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp giấy phép cấp thị thực, hộ chiếu, thẻ đăng ký người nước ngoài, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chẩn đoán lao" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ liên quan đến việc làm và thu nhập của người lưu trú chính" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ gia đình" },
      { "kind": "bullet", "depth": 1, "text": "Bảng tính điểm và hồ sơ chứng minh" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh nơi lưu trú" }
    ]
  },
  "F-2-7": {
    "titleKo": "F-2-7 점수제 우수인재 비자 - 우수인재 및 전문직 종사자",
    "titleEn": "F-2-7 Point Based Talent - Excellent Human Resources/Professional Workers",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상장법인 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 유가증권시장(KOSPI) 또는 코스닥(KOSDAQ)에 상장된 법인 종사자 또는 고용계약을 체결하여 취업이 확정된 외국인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "통계청 고시 '한국표준직업분류'에 따른 관리자, 전문가 및 관련 종사자에 해당하는 직종에 취업 중이거나 고용계약을 체결하여 취업이 확정된 외국인"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유망산업분야 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "첨단 기술 및 제품의 범위에 따른 IT, 기술경영, 나노, 디지털전자, 바이오, 수송 및 기계, 신소재, 환경 및 에너지 등의 산업 분야 종사자 또는 고용계약을 체결하여 취업이 확정된 외국인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소득금액증명원 상의 전년도 소득이 국민 1인당 GNI 1.5배 이상일 것 (취업 예정자는 고용계약서상의 연봉)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문직 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "전문직 종사자 등으로서 체류자격 교수(E-1)부터 전문인력(E-7-1)까지 또는 취재(D-5)부터 무역경영(D-9)까지 중의 어느 하나를 가진 등록외국인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청일 현재 상기 나열한 전문직 체류자격으로 3년 이상 연속하여 합법 체류 중으로 신청 당시 소지한 체류자격의 연장 등 체류 요건을 갖추었을 것"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "다만, 아래 중 하나에 해당하는 경우 체류기간 요건(3년) 면제"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "소득금액증명서 상의 연간 소득금액이 4천만원 이상인 경우"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "법무부장관이 인정하는 이공계 해외인재 유치 지원 사업 피초청인으로서 중앙행정기관의 장의 추천을 받은 경우"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유학인재"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내에서 정규과정 석사 이상의 학위를 취득한 합법 체류 외국인으로 학위 취득일로부터 5년 이내 교수(E-1)부터 전문인력(E-7-1)까지 또는 취재(D-5)부터 무역경영(D-9)까지의 체류자격에 해당하는 직종에 취업이 확정된 자 또는 취업 중인 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "잠재적 우수인재 (F-2-7S)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "이공계 특성화 대학 및 연구기관의 석/박사 학위를 취득하였거나 취득예정인 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 기업에 취업이 확정되지 않았더라도 이공계 특성화 대학 및 연구기관의 석/박사를 취득한 외국인이 대학 총장의 추천서를 받은 경우 점수요건을 미충족하더라도 자격 변경 허가(최대 5년)"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employees of listed companies"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employees of corporations listed on the Korean Stock Exchange (KOSPI) or KOSDAQ, or foreigners who have signed an employment contract and have been confirmed for employment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreigners who are employed or have signed an employment contract to work in a job classified as manager, professional, and related workers according to the Korean Standard Occupational Classification published by Statistics Korea."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Workers in promising industries"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreigners who are employed or have signed employment contracts in industries such as IT, technology management, nano, digital electronics, bio, transportation and machinery, new materials, environment and energy under the scope of advanced technologies and products."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "The previous year's income according to the income amount certification source must be at least 1.5 times the GNI per capita (annual salary according to the employment contract)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Professional workers"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Registered foreigners with one of the following statuses of residence: professor (E-1) to specialist (E-7-1) or journalist (D-5) to trade management (D-9)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "As of the date of application, you have been lawfully residing in Japan for three or more consecutive years in the above-listed professional status of residence and have met the requirements for residence, including extensions of the status of residence held at the time of application."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "However, the period of stay requirement (3 years) is waived if one of the following applies."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "If your annual income is 40 million won or more according to your income certificate."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "If you have been recommended by the head of a central administrative agency as an invitee for a project to support the attraction of overseas talent in science and technology recognized by the Minister of Justice."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Study abroad talent"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Legally resident foreigners who have earned a master's degree or higher in Korea and are employed or working in a job that falls under the status of residence from professor (E-1) to professional (E-7-1) or interviewer (D-5) to trade management (D-9) within five years from the date of obtaining the degree."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Potentially excellent human resources (F-2-7S)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Those who have obtained or are planning to obtain a master's or doctoral degree from universities and research institutes specializing in science and technology."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreign nationals who have earned a master's or doctoral degree from a university or research institute specializing in science and technology, even if they have not secured employment with a domestic company, may be allowed to change their status even if they do not meet the point requirement (up to 5 years) if they receive a recommendation from the university president."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 평가항목별 배점의 합산 점수가 80점 이상일 것 (F-2-7 점수제 비자테스트 참고)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결핵 등 전염병 등이 없을 것"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Have a combined score of 80 or more on the scoring system (see F-2-7 Scoring System Visa Test)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "No infectious diseases such as tuberculosis, etc."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 외국인등록증, 사진, 수수료, 체류지 입증서류, 해외범죄경력증명서, 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 평가를 위한 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청인이 해당하는 점수를 기재한 점수표"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청인이 기재한 평가 항목별 점수를 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가서류: 가족관계 소명서류, 결핵검진 확인서, 학위증, 이공계 특성화 대학 총창 추천서, 재직증명서, 사업자등록증, 소득금액증명 등 기타 (해당자만)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Basic documents"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, alien registration card, photo, fee, proof of residency, foreign criminal background check, employment contract, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents for the point system evaluation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Score sheet indicating the number of points the applicant received"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents supporting the applicant's score for each evaluation item"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Additional documents: family relationship documents, tuberculosis screening certificate, diploma, recommendation letter from the president of a university specializing in science and technology, employment certificate, business license, proof of income, etc."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "상장법인 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 유가증권시장(KOSPI) 또는 코스닥(KOSDAQ)에 상장된 법인 종사자 또는 고용계약을 체결하여 취업이 확정된 외국인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "통계청 고시 '한국표준직업분류'에 따른 관리자, 전문가 및 관련 종사자에 해당하는 직종에 취업 중이거나 고용계약을 체결하여 취업이 확정된 외국인"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유망산업분야 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "첨단 기술 및 제품의 범위에 따른 IT, 기술경영, 나노, 디지털전자, 바이오, 수송 및 기계, 신소재, 환경 및 에너지 등의 산업 분야 종사자 또는 고용계약을 체결하여 취업이 확정된 외국인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소득금액증명원 상의 전년도 소득이 국민 1인당 GNI 1.5배 이상일 것 (취업 예정자는 고용계약서상의 연봉)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문직 종사자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "전문직 종사자 등으로서 체류자격 교수(E-1)부터 전문인력(E-7-1)까지 또는 취재(D-5)부터 무역경영(D-9)까지 중의 어느 하나를 가진 등록외국인"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청일 현재 상기 나열한 전문직 체류자격으로 3년 이상 연속하여 합법 체류 중으로 신청 당시 소지한 체류자격의 연장 등 체류 요건을 갖추었을 것"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "다만, 아래 중 하나에 해당하는 경우 체류기간 요건(3년) 면제"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "소득금액증명서 상의 연간 소득금액이 4천만원 이상인 경우"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "법무부장관이 인정하는 이공계 해외인재 유치 지원 사업 피초청인으로서 중앙행정기관의 장의 추천을 받은 경우"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "유학인재"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내에서 정규과정 석사 이상의 학위를 취득한 합법 체류 외국인으로 학위 취득일로부터 5년 이내 교수(E-1)부터 전문인력(E-7-1)까지 또는 취재(D-5)부터 무역경영(D-9)까지의 체류자격에 해당하는 직종에 취업이 확정된 자 또는 취업 중인 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "잠재적 우수인재 (F-2-7S)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "이공계 특성화 대학 및 연구기관의 석/박사 학위를 취득하였거나 취득예정인 자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 기업에 취업이 확정되지 않았더라도 이공계 특성화 대학 및 연구기관의 석/박사를 취득한 외국인이 대학 총장의 추천서를 받은 경우 점수요건을 미충족하더라도 자격 변경 허가(최대 5년)"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 평가항목별 배점의 합산 점수가 80점 이상일 것 (F-2-7 점수제 비자테스트 참고)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결핵 등 전염병 등이 없을 것"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 외국인등록증, 사진, 수수료, 체류지 입증서류, 해외범죄경력증명서, 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "점수제 평가를 위한 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청인이 해당하는 점수를 기재한 점수표"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청인이 기재한 평가 항목별 점수를 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "추가서류: 가족관계 소명서류, 결핵검진 확인서, 학위증, 이공계 특성화 대학 총창 추천서, 재직증명서, 사업자등록증, 소득금액증명 등 기타 (해당자만)"
      }
    ],
    "titleZh": "F-2-7 计分制优秀人才签证 - 优秀人才及专业职从业者",
    "titleVi": "Visa F-2-7 Nhân tài theo hệ thống tính điểm - Nhân tài xuất sắc và người làm nghề chuyên môn",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "上市法人从业者" },
      { "kind": "bullet", "depth": 1, "text": "在韩国证券市场（KOSPI）或 KOSDAQ 上市的法人从业者，或已签订雇佣合同确定就业的外国人" },
      { "kind": "bullet", "depth": 1, "text": "依据统计厅公告《韩国标准职业分类》中管理者、专业人员及相关从业者职种从业，或已签订雇佣合同确定就业的外国人" },
      { "kind": "bullet", "depth": 0, "text": "有前途产业领域从业者" },
      { "kind": "bullet", "depth": 1, "text": "属于尖端技术及产品范围内的 IT、技术经营、纳米、数字电子、生物、运输及机械、新材料、环境及能源等产业领域从业者，或已签订雇佣合同确定就业的外国人" },
      { "kind": "bullet", "depth": 1, "text": "收入金额证明上的上一年度收入须为人均 GNI 1.5 倍以上（即将就业者按雇佣合同上的年薪计算）" },
      { "kind": "bullet", "depth": 0, "text": "专业职从业者" },
      { "kind": "bullet", "depth": 1, "text": "作为专业职从业者，持有教授（E-1）至专业人才（E-7-1）或采访（D-5）至贸易经营（D-9）任一停留资格的登录外国人" },
      { "kind": "bullet", "depth": 1, "text": "申请日时以上述专业职停留资格连续合法停留 3 年以上，且申请时具备所持停留资格延长等停留要件" },
      { "kind": "bullet", "depth": 1, "text": "但符合下列任一情况时，免除停留期限要件（3 年）" },
      { "kind": "bullet", "depth": 2, "text": "收入金额证明上的年收入达 4 千万韩元以上" },
      { "kind": "bullet", "depth": 2, "text": "作为法务部长官认可的理工科海外人才招揽支援事业被邀请人，且获得中央行政机关首长推荐者" },
      { "kind": "bullet", "depth": 0, "text": "留学人才" },
      { "kind": "bullet", "depth": 1, "text": "在韩取得正规课程硕士以上学位的合法停留外国人，自学位取得日起 5 年内已确定或正在从事教授（E-1）至专业人才（E-7-1）或采访（D-5）至贸易经营（D-9）停留资格相应职种者" },
      { "kind": "bullet", "depth": 0, "text": "潜在优秀人才（F-2-7S）" },
      { "kind": "bullet", "depth": 1, "text": "已取得或预计取得理工科特色化大学及研究机构硕士/博士学位者" },
      { "kind": "bullet", "depth": 1, "text": "即使尚未确定在韩国企业就业，取得理工科特色化大学及研究机构硕/博士的外国人若获得大学校长推荐，即使不满足分数要件也可获得资格变更许可（最长 5 年）" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người làm việc tại pháp nhân niêm yết" },
      { "kind": "bullet", "depth": 1, "text": "Người làm việc tại pháp nhân niêm yết trên thị trường chứng khoán Hàn Quốc (KOSPI) hoặc KOSDAQ, hoặc người nước ngoài đã ký hợp đồng lao động và xác nhận việc làm" },
      { "kind": "bullet", "depth": 1, "text": "Người nước ngoài đang làm việc hoặc đã ký hợp đồng lao động tại các ngành nghề thuộc nhóm \"Quản lý, chuyên gia và người liên quan\" theo \"Phân loại Nghề Chuẩn của Hàn Quốc\" do Cục Thống kê công bố" },
      { "kind": "bullet", "depth": 0, "text": "Người làm trong lĩnh vực ngành công nghiệp tiềm năng" },
      { "kind": "bullet", "depth": 1, "text": "Người làm việc hoặc đã ký hợp đồng lao động trong các lĩnh vực công nghệ và sản phẩm cao cấp như IT, quản lý công nghệ, nano, điện tử số, sinh học, vận tải và cơ khí, vật liệu mới, môi trường và năng lượng" },
      { "kind": "bullet", "depth": 1, "text": "Thu nhập năm trước trên giấy chứng nhận thu nhập phải đạt từ 1,5 lần GNI bình quân đầu người trở lên (đối với người sắp đi làm: dùng mức lương ghi trong hợp đồng lao động)" },
      { "kind": "bullet", "depth": 0, "text": "Người làm nghề chuyên môn" },
      { "kind": "bullet", "depth": 1, "text": "Người nước ngoài đã đăng ký mang một trong các tư cách lưu trú từ Giáo sư (E-1) đến Nhân lực chuyên môn (E-7-1) hoặc Đưa tin (D-5) đến Quản lý thương mại (D-9)" },
      { "kind": "bullet", "depth": 1, "text": "Tại ngày nộp hồ sơ, đã lưu trú hợp pháp liên tục 3 năm trở lên với các tư cách lưu trú chuyên môn liệt kê ở trên và đáp ứng điều kiện lưu trú như gia hạn tư cách lưu trú đang sở hữu" },
      { "kind": "bullet", "depth": 1, "text": "Tuy nhiên, miễn yêu cầu thời gian lưu trú (3 năm) trong các trường hợp sau:" },
      { "kind": "bullet", "depth": 2, "text": "Thu nhập hằng năm trên giấy chứng nhận thu nhập đạt từ 40 triệu KRW trở lên" },
      { "kind": "bullet", "depth": 2, "text": "Là người được mời trong dự án thu hút nhân tài hải ngoại lĩnh vực khoa học - kỹ thuật do Bộ trưởng Tư pháp công nhận và được lãnh đạo cơ quan hành chính trung ương giới thiệu" },
      { "kind": "bullet", "depth": 0, "text": "Nhân tài du học" },
      { "kind": "bullet", "depth": 1, "text": "Người nước ngoài lưu trú hợp pháp đã lấy bằng thạc sĩ trở lên của chương trình chính quy trong nước, đã xác nhận hoặc đang làm việc trong ngành nghề thuộc tư cách Giáo sư (E-1) đến Nhân lực chuyên môn (E-7-1) hoặc Đưa tin (D-5) đến Quản lý thương mại (D-9) trong vòng 5 năm kể từ ngày lấy bằng" },
      { "kind": "bullet", "depth": 0, "text": "Nhân tài tiềm năng (F-2-7S)" },
      { "kind": "bullet", "depth": 1, "text": "Người đã hoặc dự kiến lấy bằng thạc sĩ/tiến sĩ tại đại học và viện nghiên cứu chuyên ngành khoa học - kỹ thuật" },
      { "kind": "bullet", "depth": 1, "text": "Ngay cả khi chưa xác định việc làm tại doanh nghiệp Hàn Quốc, nếu người nước ngoài đã lấy bằng thạc sĩ/tiến sĩ tại đại học và viện nghiên cứu chuyên ngành khoa học - kỹ thuật được hiệu trưởng giới thiệu, có thể được cấp phép chuyển đổi tư cách (tối đa 5 năm) ngay cả khi chưa đáp ứng yêu cầu điểm số" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "计分制各评估项目得分合计须达到 80 分以上（请参考 F-2-7 计分制签证测试）" },
      { "kind": "bullet", "depth": 0, "text": "无结核等传染病" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Tổng điểm theo các hạng mục đánh giá của hệ thống tính điểm phải đạt từ 80 điểm trở lên (tham khảo F-2-7 Scoring System Visa Test)" },
      { "kind": "bullet", "depth": 0, "text": "Không mắc các bệnh truyền nhiễm như lao, v.v." }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "基本材料" },
      { "kind": "bullet", "depth": 1, "text": "申请书、护照、外国人登录证、照片、手续费、停留地证明材料、海外无犯罪记录证明、雇佣合同" },
      { "kind": "bullet", "depth": 0, "text": "计分制评估材料" },
      { "kind": "bullet", "depth": 1, "text": "由申请人填写相应分数的积分表" },
      { "kind": "bullet", "depth": 1, "text": "证明申请人填写的各评估项目分数的材料" },
      { "kind": "bullet", "depth": 1, "text": "补充材料：家庭关系证明材料、结核检查确认书、学位证、理工科特色化大学校长推荐书、在职证明、营业执照、收入金额证明等其他（仅适用者）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cơ bản" },
      { "kind": "bullet", "depth": 1, "text": "Đơn đăng ký, hộ chiếu, thẻ đăng ký người nước ngoài, ảnh, lệ phí, hồ sơ chứng minh nơi lưu trú, lý lịch tư pháp ở nước ngoài, hợp đồng lao động" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ phục vụ đánh giá theo hệ thống tính điểm" },
      { "kind": "bullet", "depth": 1, "text": "Bảng tính điểm do người nộp hồ sơ ghi điểm tương ứng" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh điểm số ở từng hạng mục đánh giá mà người nộp hồ sơ đã ghi" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ bổ sung: Hồ sơ chứng minh quan hệ gia đình, giấy xác nhận khám lao, bằng cấp, thư giới thiệu của hiệu trưởng đại học chuyên ngành khoa học - kỹ thuật, giấy chứng nhận đang công tác, giấy phép kinh doanh, giấy chứng nhận thu nhập, v.v. (chỉ với đối tượng áp dụng)" }
    ]
  },
  "F-2-R": {
    "titleKo": "F-2-R 지역특화형 비자 - 인구감소지역 정착",
    "titleEn": "F-2-R Regional Specialized Visa - Settlement in Depopulated Areas",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "지방 소멸 문제에 적극적으로 대응하기 위하여 국내 체류 외국인의 인구감소지역 정착 추진"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인과 주민이 지역사회의 지속가능한 발전에 참여할 수 있는 비자정책 추진"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인구감소지역의 지역별 특화 산업, 대학, 일자리 현황 등에 적합한 외국인 정착을 유도하여 지자체의 생활인구 확대, 경제활동 촉진, 인구유입 등 선순환 구조 실현"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "To actively address the issue of regional depopulation, Korea is promoting the settlement of foreign nationals in designated population decline areas."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "This visa policy aims to encourage both foreigners and local residents to contribute to the sustainable development of local communities."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "By guiding the settlement of foreign nationals in alignment with regional specialized industries, universities, and employment opportunities, the policy seeks to expand the living population, stimulate economic activity, and create a virtuous cycle of population influx in local governments."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부에서 지정하는 학력/소득, 거주지, 한국어능력, 법령준수 등 요건 으로 지자체 개별요건과 동시 충족 필요 가. 학력/소득 (두 요건 중 하나만 구비 하면 족함) 1) 학력2) 소득나. 거주지다. 취업/창업 (두 요건 중 하나만 구비 하면 족함)라. 기본소양 (하나만 구비 하면 족함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 전문학사 이상의 학위취득자로서 2년제 전문대학 이상 졸업자 또는 졸업예정자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청일 기준 6개월 이내 졸업 예정 증빙 필요(대학 총장, 학과장 명의의 문서 제출), 최초 체류기간 연장 시 학위증 등 입증서류 제출"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Applicants must meet both the Ministry of Justice's requirements and additional local government requirements, which include academic qualifications/income, residence, Korean language proficiency, and legal compliance. A. Academic Qualifications/Income (One of the following conditions must be met)1) Academic Qualifications2) Income"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Applicants must have obtained at least an associate degree from a domestic educational institution (a two-year college or higher) or be expected to graduate."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If applying as a prospective graduate, applicants must submit proof of graduation within six months (a document issued by the university president or department head)."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Upon the first extension of stay, additional proof of degree completion must be submitted."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "General Rule"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Applicants must continuously reside in the designated population decline area."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "ExceptionsC. Employment/Entrepreneurship (One of the following conditions must be met)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If necessary, applicants may reside in a different area than their workplace or business location under certain conditions approved by the Ministry of Justice.The following types of residence arrangements are allowed:Eligible regions for each type:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Type A: Reside in the designated area and work in the same metropolitan region."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Type B: Live with family in the designated area and work in the metropolitan region."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Type C: Live in the metropolitan region and work in the designated area."
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "Type D: Live in the metropolitan region and start a business in the designated area."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Completion of at least Level 3 in the Social Integration Program (KIIP) or placement at Level 4 or higher in the pre-evaluation."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Attainment of at least Level 3 in the Test of Proficiency in Korean (TOPIK)."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "통합신청서, 여권, 사진"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인등록증"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학력 입증서류 (학력증명서 학위증 졸업증명서 졸업예정증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소득 입증서류: 세무서 발급 소득금액증명 등 공적 증명서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "거주지 입증서류 (부동산임대차계약서 부동산등기부등본 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "경제활동 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(취업자) 고용계약서, 재직증명서, 사업자등록증, 법인등기부등본 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(창업자) 투자금 증빙서류, 사업자등록증, 법인등기사항전부증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외범죄경력증명서 (영주 지침의 빔죄경력증명서 규정 준용)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 소양 요건 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사회통합프로그램 3단계 이상 이수증 또는 사전평가 4단계 이상 배정확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국어능력시험(TOPIK) 3급 이상 성적표"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "지자체장 추천서 (발급일로부터 3개월 이내)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학교장 추천서"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A letter of assignment or employment or a letter of cooperation from the foreign minister of the foreign country."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "In the case of accompanying family members of members of diplomatic missions or consular organizations of foreign governments, proof of family relationship such as a family relationship certificate or birth certificate issued by the home country."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "For activities outside the status of residence"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Passport, unification application"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Fee ($120 for unauthorized activities): Accompanying family members of U.S. diplomatic missions in Korea are exempt from fees based on reciprocity."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment recommendation letter from the Ministry of Foreign Affairs (Diplomatic Attaché) (required)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents required for activities outside the status of residence for each status of residence (qualifications, etc.)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "지방 소멸 문제에 적극적으로 대응하기 위하여 국내 체류 외국인의 인구감소지역 정착 추진"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인과 주민이 지역사회의 지속가능한 발전에 참여할 수 있는 비자정책 추진"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인구감소지역의 지역별 특화 산업, 대학, 일자리 현황 등에 적합한 외국인 정착을 유도하여 지자체의 생활인구 확대, 경제활동 촉진, 인구유입 등 선순환 구조 실현"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "법무부에서 지정하는 학력/소득, 거주지, 한국어능력, 법령준수 등 요건 으로 지자체 개별요건과 동시 충족 필요 가. 학력/소득 (두 요건 중 하나만 구비 하면 족함) 1) 학력2) 소득나. 거주지다. 취업/창업 (두 요건 중 하나만 구비 하면 족함)라. 기본소양 (하나만 구비 하면 족함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국내 전문학사 이상의 학위취득자로서 2년제 전문대학 이상 졸업자 또는 졸업예정자"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청일 기준 6개월 이내 졸업 예정 증빙 필요(대학 총장, 학과장 명의의 문서 제출), 최초 체류기간 연장 시 학위증 등 입증서류 제출"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "통합신청서, 여권, 사진"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인등록증"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학력 입증서류 (학력증명서 학위증 졸업증명서 졸업예정증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "소득 입증서류: 세무서 발급 소득금액증명 등 공적 증명서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "거주지 입증서류 (부동산임대차계약서 부동산등기부등본 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "경제활동 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(취업자) 고용계약서, 재직증명서, 사업자등록증, 법인등기부등본 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(창업자) 투자금 증빙서류, 사업자등록증, 법인등기사항전부증명서 등)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외범죄경력증명서 (영주 지침의 빔죄경력증명서 규정 준용)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 소양 요건 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사회통합프로그램 3단계 이상 이수증 또는 사전평가 4단계 이상 배정확인서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국어능력시험(TOPIK) 3급 이상 성적표"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "지자체장 추천서 (발급일로부터 3개월 이내)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "학교장 추천서"
      }
    ],
    "titleZh": "F-2-R 地区特化型签证 - 在人口减少地区定居",
    "titleVi": "Visa F-2-R Đặc thù khu vực - Định cư tại khu vực giảm dân số",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "为积极应对地方消亡问题，推进韩国境内停留外国人在人口减少地区定居" },
      { "kind": "bullet", "depth": 0, "text": "推进允许外国人与居民共同参与地区社会可持续发展的签证政策" },
      { "kind": "bullet", "depth": 0, "text": "引导适合人口减少地区各地特色产业、大学、就业现状的外国人定居，扩大地方政府生活人口、促进经济活动、引入人口等良性循环结构" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Nhằm chủ động ứng phó với vấn đề suy giảm địa phương, thúc đẩy người nước ngoài đang lưu trú trong nước định cư tại khu vực giảm dân số" },
      { "kind": "bullet", "depth": 0, "text": "Thúc đẩy chính sách thị thực để người nước ngoài và cư dân cùng tham gia vào sự phát triển bền vững của cộng đồng địa phương" },
      { "kind": "bullet", "depth": 0, "text": "Khuyến khích người nước ngoài định cư phù hợp với ngành công nghiệp đặc thù, đại học, hiện trạng việc làm tại các vùng giảm dân số, tạo nên cấu trúc tuần hoàn tích cực: mở rộng dân số sinh hoạt của chính quyền địa phương, thúc đẩy hoạt động kinh tế, thu hút dân số" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "需同时满足法务部规定的学历/收入、居住地、韩语能力、法令遵守等要件，及地方政府个别要件 甲. 学历/收入（两个要件中具备其一即可）1) 学历 2) 收入 乙. 居住地 丙. 就业/创业（两个要件中具备其一即可）丁. 基本素养（具备其一即可）" },
      { "kind": "bullet", "depth": 1, "text": "国内取得专科以上学位者，2 年制专科大学以上的毕业生或预定毕业生" },
      { "kind": "bullet", "depth": 1, "text": "申请日基准 6 个月内毕业预定证明（提交大学校长、学科长名义文件），首次停留期延长时提交学位证等证明材料" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Phải đồng thời đáp ứng các yêu cầu của Bộ Tư pháp về học vấn/thu nhập, nơi cư trú, năng lực tiếng Hàn, tuân thủ pháp luật và các yêu cầu riêng của chính quyền địa phương. A. Học vấn/Thu nhập (chỉ cần đáp ứng 1 trong 2) 1) Học vấn 2) Thu nhập B. Nơi cư trú C. Việc làm/Khởi nghiệp (chỉ cần đáp ứng 1 trong 2) D. Tố chất cơ bản (chỉ cần đáp ứng 1 yêu cầu)" },
      { "kind": "bullet", "depth": 1, "text": "Người đã lấy bằng cao đẳng trở lên trong nước, là người tốt nghiệp hoặc dự kiến tốt nghiệp từ trường cao đẳng 2 năm trở lên" },
      { "kind": "bullet", "depth": 1, "text": "Cần giấy chứng nhận dự kiến tốt nghiệp trong vòng 6 tháng kể từ ngày nộp hồ sơ (nộp văn bản dưới danh nghĩa hiệu trưởng, chủ nhiệm khoa); khi gia hạn lưu trú lần đầu cần nộp bằng cấp và các giấy tờ chứng minh khác" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "综合申请书、护照、照片" },
      { "kind": "bullet", "depth": 0, "text": "外国人登录证" },
      { "kind": "bullet", "depth": 0, "text": "学历证明材料（学历证明、学位证、毕业证明、毕业预定证明等）" },
      { "kind": "bullet", "depth": 0, "text": "收入证明材料：税务局发行的收入金额证明等公文证明材料" },
      { "kind": "bullet", "depth": 0, "text": "居住地证明材料（不动产租赁合同、不动产登记副本等）" },
      { "kind": "bullet", "depth": 0, "text": "经济活动证明材料" },
      { "kind": "bullet", "depth": 1, "text": "（就业者）雇佣合同、在职证明、营业执照、法人登记副本等" },
      { "kind": "bullet", "depth": 1, "text": "（创业者）投资金证明材料、营业执照、法人登记事项全部证明等" },
      { "kind": "bullet", "depth": 0, "text": "海外无犯罪记录证明（参照永居指南的犯罪记录证明规定）" },
      { "kind": "bullet", "depth": 0, "text": "基本素养要件证明材料" },
      { "kind": "bullet", "depth": 1, "text": "社会融合项目 3 阶段以上修读证或预先评价 4 阶段以上分配确认书" },
      { "kind": "bullet", "depth": 1, "text": "韩国语能力考试（TOPIK）3 级以上成绩单" },
      { "kind": "bullet", "depth": 0, "text": "地方政府首长推荐书（发行日起 3 个月内）" },
      { "kind": "bullet", "depth": 0, "text": "学校校长推荐书" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn đăng ký tổng hợp, hộ chiếu, ảnh" },
      { "kind": "bullet", "depth": 0, "text": "Thẻ đăng ký người nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh học vấn (giấy chứng nhận học lực, bằng cấp, giấy tốt nghiệp, giấy dự kiến tốt nghiệp, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh thu nhập: Giấy chứng nhận thu nhập do Cục Thuế cấp và các giấy tờ chứng minh chính thức khác" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh nơi cư trú (hợp đồng cho thuê bất động sản, bản sao đăng ký bất động sản, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh hoạt động kinh tế" },
      { "kind": "bullet", "depth": 1, "text": "(Người làm việc) Hợp đồng lao động, giấy chứng nhận đang công tác, giấy phép kinh doanh, bản sao đăng ký pháp nhân, v.v." },
      { "kind": "bullet", "depth": 1, "text": "(Người khởi nghiệp) Hồ sơ chứng minh vốn đầu tư, giấy phép kinh doanh, giấy chứng nhận tất cả các mục đăng ký pháp nhân, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Lý lịch tư pháp ở nước ngoài (áp dụng theo quy định lý lịch tư pháp trong hướng dẫn thường trú)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh điều kiện tố chất cơ bản" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận hoàn thành Chương trình Hoà nhập Xã hội cấp 3 trở lên hoặc giấy xác nhận xếp lớp đánh giá trước cấp 4 trở lên" },
      { "kind": "bullet", "depth": 1, "text": "Bảng điểm Kỳ thi Năng lực tiếng Hàn (TOPIK) cấp 3 trở lên" },
      { "kind": "bullet", "depth": 0, "text": "Thư giới thiệu của lãnh đạo chính quyền địa phương (trong vòng 3 tháng kể từ ngày cấp)" },
      { "kind": "bullet", "depth": 0, "text": "Thư giới thiệu của hiệu trưởng" }
    ]
  },
  "F-3": {
    "titleKo": "F-3 동반 비자 - 배우자 및 자녀",
    "titleEn": "F-3 Family Dependants - Spouse & Children",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "동반가족:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "문화예술(D-1)부터 특정활동(E-7)까지의 체류자격에 해당하는 사람의 배우자 및 미성년 자녀 (단, 기술연수(D-3) 체류자격자는 제외)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문 인력의 동반자:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "교수(E-1), 연구(E-3), 기술지도(E-4), 전문직업(E-5) 및 첨단과학기술분야 고용추천서(GOLD CARD)를 발급받은 특정활동(E-7) 자격 외국인의 배우자 및 미성년 자녀"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Accompanying family members"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum number of stays that can be granted at a time: the number of stays for the person accompanying you."
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익을 목적으로 하지 아니하는 학술 또는 예술상의 활동을 하려고 하는 자 (대한민국의 고유문화 또는 예술에 대하여 전문적인 연구를 하거나 전문가의 지도를 받으려는 자 포함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "논문작성, 창작 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비영리 학술활동, 예술단체의 초청으로 학술 또는 순수 예술 활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 고유 문화 또는 예술에 대하여 전문적으로 연구하거나 전문가의 지도를 받으려는 자"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Accompanying family members"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Spouses and minor children of persons in the cultural and artistic (D-1) through specific activity (E-7) statuses who do not have a spouse (except for persons in the technical training (D-3) status)."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Companions of specialized personnel"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Spouses and minor children of foreign nationals in the teaching (E-1), research (E-3), technical guidance (E-4), specialty occupation (E-5), and specific activity (E-7) categories who have been issued a GOLD CARD for employment in the field of high science and technology."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권사본, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "가족관계 입증서류: 결혼증명서, 가족관계기록사항에 관한 증명서, 출생증명서 등 (중국인의 경우 거민신분증, 결혼증, 호구부 포함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "생계유지능력 입증서류: 초청자의 재직증명서, 납세사실증명서 등"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application for authorization to issue a visa, a copy of your passport, and one standard-sized photograph."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of family relationship"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Marriage certificate, certificate of family relationship records, or birth certificate (for Chinese, resident ID card, marriage certificate, and family register)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of ability to support oneself"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Employment certificate, tax return, etc."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "동반가족:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "문화예술(D-1)부터 특정활동(E-7)까지의 체류자격에 해당하는 사람의 배우자 및 미성년 자녀 (단, 기술연수(D-3) 체류자격자는 제외)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "전문 인력의 동반자:"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "교수(E-1), 연구(E-3), 기술지도(E-4), 전문직업(E-5) 및 첨단과학기술분야 고용추천서(GOLD CARD)를 발급받은 특정활동(E-7) 자격 외국인의 배우자 및 미성년 자녀"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "수익을 목적으로 하지 아니하는 학술 또는 예술상의 활동을 하려고 하는 자 (대한민국의 고유문화 또는 예술에 대하여 전문적인 연구를 하거나 전문가의 지도를 받으려는 자 포함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "논문작성, 창작 활동을 하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "비영리 학술활동, 예술단체의 초청으로 학술 또는 순수 예술 활동에 종사하는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국의 고유 문화 또는 예술에 대하여 전문적으로 연구하거나 전문가의 지도를 받으려는 자"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급인정신청서, 여권사본, 표준규격사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "가족관계 입증서류: 결혼증명서, 가족관계기록사항에 관한 증명서, 출생증명서 등 (중국인의 경우 거민신분증, 결혼증, 호구부 포함)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "생계유지능력 입증서류: 초청자의 재직증명서, 납세사실증명서 등"
      }
    ],
    "titleZh": "F-3 同行签证 - 配偶及子女",
    "titleVi": "Visa F-3 Người phụ thuộc - Vợ/chồng và con cái",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "随行家属：" },
      { "kind": "bullet", "depth": 1, "text": "持有文化艺术（D-1）至特定活动（E-7）任一停留资格者的配偶及未成年子女（但技术研修 D-3 持有者除外）" },
      { "kind": "bullet", "depth": 0, "text": "专业人才的随行人员：" },
      { "kind": "bullet", "depth": 1, "text": "教授（E-1）、研究（E-3）、技术指导（E-4）、专门职业（E-5）及获颁尖端科技领域雇佣推荐书（GOLD CARD）的特定活动（E-7）资格外国人的配偶及未成年子女" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Gia đình đi cùng:" },
      { "kind": "bullet", "depth": 1, "text": "Vợ/chồng và con chưa thành niên của người mang tư cách lưu trú từ Văn hoá nghệ thuật (D-1) đến Hoạt động đặc thù (E-7) (riêng tư cách Đào tạo kỹ thuật (D-3) bị loại trừ)" },
      { "kind": "bullet", "depth": 0, "text": "Người đi cùng nhân lực chuyên môn:" },
      { "kind": "bullet", "depth": 1, "text": "Vợ/chồng và con chưa thành niên của người nước ngoài mang tư cách Giáo sư (E-1), Nghiên cứu (E-3), Chuyển giao công nghệ (E-4), Nghề chuyên môn (E-5) và Hoạt động đặc thù (E-7) đã được cấp Thư giới thiệu tuyển dụng lĩnh vực khoa học công nghệ tiên tiến (GOLD CARD)" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "欲从事非营利学术或艺术活动者（包括欲对韩国独有文化或艺术进行专业研究或接受专家指导者）" },
      { "kind": "bullet", "depth": 0, "text": "从事论文撰写、创作活动者" },
      { "kind": "bullet", "depth": 0, "text": "受非营利学术活动或艺术团体邀请，从事学术或纯艺术活动者" },
      { "kind": "bullet", "depth": 0, "text": "欲对韩国独有文化或艺术进行专业研究或接受专家指导者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người muốn thực hiện hoạt động học thuật hoặc nghệ thuật không nhằm mục đích lợi nhuận (bao gồm người muốn nghiên cứu chuyên sâu hoặc nhận sự hướng dẫn của chuyên gia về văn hoá, nghệ thuật đặc trưng của Hàn Quốc)" },
      { "kind": "bullet", "depth": 0, "text": "Người thực hiện hoạt động viết luận văn, sáng tác" },
      { "kind": "bullet", "depth": 0, "text": "Người tham gia hoạt động học thuật hoặc nghệ thuật thuần tuý theo lời mời của tổ chức học thuật, nghệ thuật phi lợi nhuận" },
      { "kind": "bullet", "depth": 0, "text": "Người muốn nghiên cứu chuyên sâu hoặc nhận sự hướng dẫn của chuyên gia về văn hoá, nghệ thuật đặc trưng của Hàn Quốc" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证发放认定申请书、护照副本、标准规格照片 1 张" },
      { "kind": "bullet", "depth": 0, "text": "家庭关系证明材料：结婚证明、家庭关系记录证明、出生证明等（中国人需附居民身份证、结婚证、户口簿）" },
      { "kind": "bullet", "depth": 0, "text": "维持生计能力证明材料：邀请人的在职证明、纳税事实证明等" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp giấy phép cấp thị thực, bản sao hộ chiếu, 1 ảnh tiêu chuẩn" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh quan hệ gia đình: Giấy đăng ký kết hôn, giấy chứng nhận quan hệ gia đình, giấy khai sinh, v.v. (đối với người Trung Quốc, kèm chứng minh thư cư dân, giấy đăng ký kết hôn, sổ hộ khẩu)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh khả năng duy trì sinh kế: Giấy chứng nhận đang công tác, giấy chứng nhận đã nộp thuế của người mời, v.v." }
    ]
  },
  "F-4": {
    "titleKo": "F-4 재외동포 비자 - 대한민국 출생",
    "titleEn": "F-4 Overseas Korean - Nationality of the Republic of Korea by Birth",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재외 동포 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 원칙적으로 3년 이내"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Upper limit on the length of stay that can be granted at a time: generally no more than three years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "출생에 의하여 대한민국의 국적을 보유하였던 사람 (대한민국정부 수립 전에 국외로 이주한 동포를 포함) 으로서 외국국적을 취득한 사람"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "위에 해당하는 사람의 직계비속으로서 외국국적을 취득한 사람"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "‘18.5.1. 이후 최초로 대한민국 국적을 이탈하였거나 국적을 상실한 남성은 병역이행 또는 면제처분이 없으면 40세 되는 해 12월 31일까지 F-4 체류자격 부여 제한"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who holds the nationality of the Republic of Korea by birth (including compatriots who moved abroad before the establishment of the government of the Republic of Korea) and acquired a foreign nationality."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A person who acquired a foreign nationality as an immediate relative of the above-mentioned person."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Men who have left the Republic of Korea or lost their nationality for the first time since '18.5.1. are restricted from granting F-4 status until December 31 of the year in which they turn 40, unless they have completed military service or have been exempted."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한국어능력 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외 범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "가족관계기록사항에 관한 증명서, 제적등본, 호구부, 거민증 및 출생증명서 등으로 외국국적동포임을 증명하는 서류"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of Korean language proficiency"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Overseas criminal record certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving that a person who falls under the following categories is a foreign national, such as a certificate of family relationship records, discharge certificate, family register, residence card, or birth certificate."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재외 동포 비자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 원칙적으로 3년 이내"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "출생에 의하여 대한민국의 국적을 보유하였던 사람 (대한민국정부 수립 전에 국외로 이주한 동포를 포함) 으로서 외국국적을 취득한 사람"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "위에 해당하는 사람의 직계비속으로서 외국국적을 취득한 사람"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "‘18.5.1. 이후 최초로 대한민국 국적을 이탈하였거나 국적을 상실한 남성은 병역이행 또는 면제처분이 없으면 40세 되는 해 12월 31일까지 F-4 체류자격 부여 제한"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한국어능력 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "해외 범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "가족관계기록사항에 관한 증명서, 제적등본, 호구부, 거민증 및 출생증명서 등으로 외국국적동포임을 증명하는 서류"
      }
    ],
    "titleZh": "F-4 海外同胞签证 - 韩国出生",
    "titleVi": "Visa F-4 Đồng bào hải ngoại - Sinh tại Hàn Quốc",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "海外同胞签证" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：原则上不超过 3 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Thị thực đồng bào hải ngoại" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: về nguyên tắc không quá 3 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "因出生而曾持有韩国国籍的人（包括韩国政府成立前移居海外的同胞），且取得外国国籍者" },
      { "kind": "bullet", "depth": 1, "text": "上述人员的直系卑亲属，且取得外国国籍者" },
      { "kind": "bullet", "depth": 2, "text": "2018 年 5 月 1 日以后首次脱离或丧失韩国国籍的男性，若未履行兵役或获得免除处分，至年满 40 岁当年 12 月 31 日前限制授予 F-4 停留资格" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người từng mang quốc tịch Đại Hàn Dân Quốc do sinh ra (bao gồm đồng bào di cư ra nước ngoài trước khi Chính phủ Hàn Quốc thành lập) và đã nhập quốc tịch nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Hậu duệ trực hệ của người trên đã nhập quốc tịch nước ngoài" },
      { "kind": "bullet", "depth": 2, "text": "Đối với nam giới lần đầu rời bỏ hoặc mất quốc tịch Đại Hàn Dân Quốc kể từ 1/5/2018, nếu chưa thực hiện nghĩa vụ quân sự hoặc chưa được miễn trừ, sẽ bị hạn chế cấp tư cách F-4 cho đến ngày 31/12 của năm đủ 40 tuổi" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "韩语能力证明材料" },
      { "kind": "bullet", "depth": 0, "text": "海外无犯罪记录证明" },
      { "kind": "bullet", "depth": 0, "text": "家庭关系记录证明、除籍证明、户口簿、居民证及出生证明等证明外籍同胞身份的材料" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh năng lực tiếng Hàn" },
      { "kind": "bullet", "depth": 0, "text": "Lý lịch tư pháp ở nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "Giấy tờ chứng minh là đồng bào quốc tịch nước ngoài: giấy chứng nhận quan hệ gia đình, giấy chứng nhận xoá tịch, sổ hộ khẩu, chứng minh thư cư dân, giấy khai sinh, v.v." }
    ]
  },
  "F-5": {
    "titleKo": "F-5 영주 비자 - 영주권",
    "titleEn": "F-5 Permanent Resident",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격의 구분에 따른 활동의 제한을 받지 않음"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 상한 없음"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Activities are not restricted by immigration status."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum number of stays that can be granted at a time: no upper limit"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-1: 5년 이상 대한민국에 체류한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-4: 영주자격 소지자의 배우자 또는 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-5: 50만 달러 이상 투자자로 국민 5인 이상 고용한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-8: 대한민국 출생 재한화교"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-9: 첨단산업 분야 박사학위 소지자이며 국내 기업에 고용된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-10: 첨단산업 분야 학사, 일반 분야 석사 이상의 학위 또는 기술자격증 소지자이며 국내 기업에 고용된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-11: 특정 분야(과학, 경영, 교육, 문화예술, 체육 등)에서 탁월한 능력이 있는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-12: 대한민국에 특별한 공로가 있는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-13: 60세 이상이며 국외에서 연금을 받는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-15: 국내 대학원에서 박사학위를 취득한 후 국내 기업에 고용된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-16: 점수제 거주 자격으로 3년 이상 체류한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-17: 관광·휴양시설 투자 거주 자격으로 5년 이상 계속 투자한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-18: 점수제 영주자(F-5-16)의 배우자 또는 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-19: 관광·휴양시설 투자자(F-5-17)의 배우자 또는 미혼 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-20: 영주권자의 국내 출생 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-21: 공익사업 투자 거주 자격으로 5년 이상 계속 투자한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-22: 공익사업 일반투자자(F-5-21) 또는 공익사업 은퇴이민 투자자(F-5-23)의 배우자 또는 미혼 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-23: 은퇴이민 투자자로 공익사업에 5년 이상 계속 투자하고 국내 보유 자산이 3억 원 이상인 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-24: 기술창업(D-8-4) 자격으로 3억 원 이상의 투자금을 유치하고 국민 2인 이상 고용한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-25: 15억 원 이상을 5년 이상 투자하는 조건을 서약한 사람"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-1: A person who has been in Korea for more than five years"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-4: Spouse or minor children of permanent resident status holders"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-5: Investors of $500,000 or more who employ five or more Korean nationals"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-8: Korean-born overseas Koreans"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-9: A person with a doctoral degree in a high-tech industry and employed by a domestic company"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-10: Bachelor's degree in a high-tech industry, master's degree or higher in a general field, or a technical certificate and employed by a domestic company"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-11 : Persons with outstanding abilities in specific fields such as science, management, education, culture and arts, and physical education."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-12: Those who have made special contributions to the Republic of Korea"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-13: Persons who are 60 years of age or older and receiving a pension from a foreign country"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-15: A person who has earned a doctoral degree by completing regular courses at a domestic graduate school and is employed by a domestic company."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-16 : Persons who have stayed in Korea for more than three years on a points-based residence status"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-17: Persons who have invested in tourism and recreation facilities for more than five years under the resident status of investment."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-18 : Spouse or minor child of a permanent resident (F-5-16) on the points system"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-19 : Spouse or unmarried child of a tourism and recreation investor (F-5-17)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-20: Domestic-born children of permanent residents"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-20: Domestic-born child of a permanent resident (F-5-21)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-22: Spouse or unmarried child of an ordinary investor in a public utility (F-5-21) or a retired immigrant investor in a public utility (F-5-23)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-23 : Retired immigrant investor who has been investing in public utilities for more than 5 years and has more than 300 million in domestic assets"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-24: A person who has attracted investment of 300 million won or more as a technology startup (D-8-4) and employs two or more nationals."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-25: A person who has pledged to invest KRW 1.5 billion or more for more than five years"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-26: A person who has worked for more than three years as an essential specialized worker in an R&D facility invested by a foreigner."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통 제출 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "통합신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인등록증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소득금액증명"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "종합소득세 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국이민영주적격시험 결과"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국이민귀화적격시험 결과"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사회통합프로그램 이수증"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주자격별 제출 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-1:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "D-8 또는 D-9 경우: 매출액 또는 수출액 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "D-10 경우: E-1~E-7 해당 자격 입증서류, 학위증, 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "E-7 경우: 학위증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-4, F-5-8, F-5-18, F-5-19, F-5-20, F-5-22:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "가족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "출생증명서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "미혼자녀 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-5, F-5-24:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인투자기업 등록증명서 (F-5-5만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자금 유치 관련 서류 (F-5-24만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "법인등기사항 전부 증명서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용 내국인 소득금액증명"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용 내국인과 체결한 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용 내국인 관련 4대보험 사업장 가입 명부 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-9, F-5-10, F-5-15:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "학위증 또는 기술자격증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-13:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "연금증서 및 연금입금 통장 사본"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Common Filing Documents"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Consolidated Application"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Passport"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Alien Registration Card"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of residence"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreign Criminal History Certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of income"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Comprehensive income tax"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Korean Immigration Permanent Resident Qualification Test"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Korean Immigration and Naturalization Qualification Test"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Certificate of Completion of Social Integration Program"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents submitted by permanent resident status"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-1 : For D-8 or D-9, proof of sales or exports / For D-10, proof of qualifications for E-1 through E-7, diploma, employment contract / For E-7, diploma"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-4, F-5-8, F-5-18, F-5-19, F-5-20, F-5-22 : Proof of family relationship, birth certificate, proof of unmarried children"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-5, F-5-24: Certificate of registration of foreign-invested enterprises (F-5-5 only), documents related to attracting investment funds (F-5-24 only), certificate of all corporate registration items, copy of business license, proof of income amount of employed nationals, employment contract with employed nationals, enrollment list of four major insurance companies related to employed nationals, etc."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-9, F-5-10, F-5-15: Copy of degree or technical certificate / copy of business license / copy of employment contract, certificate of employment"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-13: Copy of pension certificate and pension deposit passbook"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-16 : Copy of business license, copy of employment contract, certificate of service"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-17, F-5-21, F-5-23: Proof of investment, proof of domestic assets (F-5-23 only)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-25 : Confirmation of investment deposit (issued by the Korea Development Bank), proof of foreign currency (foreign exchange purchase certificate), pledge of investment support"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-26 : R&D facility designation, dispatch order, or employment certificate"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체류자격의 구분에 따른 활동의 제한을 받지 않음"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 상한 없음"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-1: 5년 이상 대한민국에 체류한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-4: 영주자격 소지자의 배우자 또는 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-5: 50만 달러 이상 투자자로 국민 5인 이상 고용한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-8: 대한민국 출생 재한화교"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-9: 첨단산업 분야 박사학위 소지자이며 국내 기업에 고용된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-10: 첨단산업 분야 학사, 일반 분야 석사 이상의 학위 또는 기술자격증 소지자이며 국내 기업에 고용된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-11: 특정 분야(과학, 경영, 교육, 문화예술, 체육 등)에서 탁월한 능력이 있는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-12: 대한민국에 특별한 공로가 있는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-13: 60세 이상이며 국외에서 연금을 받는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-15: 국내 대학원에서 박사학위를 취득한 후 국내 기업에 고용된 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-16: 점수제 거주 자격으로 3년 이상 체류한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-17: 관광·휴양시설 투자 거주 자격으로 5년 이상 계속 투자한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-18: 점수제 영주자(F-5-16)의 배우자 또는 미성년 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-19: 관광·휴양시설 투자자(F-5-17)의 배우자 또는 미혼 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-20: 영주권자의 국내 출생 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-21: 공익사업 투자 거주 자격으로 5년 이상 계속 투자한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-22: 공익사업 일반투자자(F-5-21) 또는 공익사업 은퇴이민 투자자(F-5-23)의 배우자 또는 미혼 자녀"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-23: 은퇴이민 투자자로 공익사업에 5년 이상 계속 투자하고 국내 보유 자산이 3억 원 이상인 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-24: 기술창업(D-8-4) 자격으로 3억 원 이상의 투자금을 유치하고 국민 2인 이상 고용한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-5-25: 15억 원 이상을 5년 이상 투자하는 조건을 서약한 사람"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "공통 제출 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "통합신청서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인등록증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "해외범죄경력증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소득금액증명"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "종합소득세 관련 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국이민영주적격시험 결과"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국이민귀화적격시험 결과"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "사회통합프로그램 이수증"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "영주자격별 제출 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-1:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "D-8 또는 D-9 경우: 매출액 또는 수출액 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "D-10 경우: E-1~E-7 해당 자격 입증서류, 학위증, 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "E-7 경우: 학위증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-4, F-5-8, F-5-18, F-5-19, F-5-20, F-5-22:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "가족관계 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "출생증명서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "미혼자녀 입증 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-5, F-5-24:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "외국인투자기업 등록증명서 (F-5-5만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "투자금 유치 관련 서류 (F-5-24만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "법인등기사항 전부 증명서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용 내국인 소득금액증명"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용 내국인과 체결한 고용계약서"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용 내국인 관련 4대보험 사업장 가입 명부 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-9, F-5-10, F-5-15:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "학위증 또는 기술자격증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "사업자등록증 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "고용계약서 사본"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "재직증명서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "F-5-13:"
      },
      {
        "kind": "bullet",
        "depth": 2,
        "text": "연금증서 및 연금입금 통장 사본"
      }
    ],
    "titleZh": "F-5 永居签证 - 永久居留权",
    "titleVi": "Visa F-5 Thường trú - Quyền thường trú",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "不受停留资格区分的活动限制" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：无上限" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Không bị hạn chế hoạt động theo phân loại tư cách lưu trú" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: không giới hạn" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "F-5-1：在韩国停留 5 年以上者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-4：永居资格持有者的配偶或未成年子女" },
      { "kind": "bullet", "depth": 0, "text": "F-5-5：投资 50 万美元以上并雇佣 5 名以上韩国国民者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-8：在韩国出生的在韩华侨" },
      { "kind": "bullet", "depth": 0, "text": "F-5-9：尖端产业领域博士学位持有者，且受雇于韩国企业" },
      { "kind": "bullet", "depth": 0, "text": "F-5-10：尖端产业领域学士、一般领域硕士以上学位或技术资格证持有者，且受雇于韩国企业" },
      { "kind": "bullet", "depth": 0, "text": "F-5-11：在特定领域（科学、经营、教育、文化艺术、体育等）具有卓越能力者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-12：对韩国有特别贡献者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-13：60 岁以上且在国外领取养老金者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-15：在韩国研究生院取得博士学位后受雇于韩国企业者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-16：以计分制居住资格停留 3 年以上者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-17：以观光、休养设施投资居住资格连续投资 5 年以上者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-18：计分制永居者（F-5-16）的配偶或未成年子女" },
      { "kind": "bullet", "depth": 0, "text": "F-5-19：观光、休养设施投资者（F-5-17）的配偶或未婚子女" },
      { "kind": "bullet", "depth": 0, "text": "F-5-20：永居权者在韩国出生的子女" },
      { "kind": "bullet", "depth": 0, "text": "F-5-21：以公益事业投资居住资格连续投资 5 年以上者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-22：公益事业一般投资者（F-5-21）或公益事业退休移民投资者（F-5-23）的配偶或未婚子女" },
      { "kind": "bullet", "depth": 0, "text": "F-5-23：作为退休移民投资者，对公益事业连续投资 5 年以上且国内持有资产达 3 亿韩元以上者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-24：以技术创业（D-8-4）资格吸引 3 亿韩元以上投资金，且雇佣 2 名以上韩国国民者" },
      { "kind": "bullet", "depth": 0, "text": "F-5-25：承诺投资 15 亿韩元以上 5 年以上者" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "F-5-1: Người đã lưu trú tại Hàn Quốc từ 5 năm trở lên" },
      { "kind": "bullet", "depth": 0, "text": "F-5-4: Vợ/chồng hoặc con chưa thành niên của người mang tư cách thường trú" },
      { "kind": "bullet", "depth": 0, "text": "F-5-5: Người đầu tư từ 500.000 USD trở lên và tuyển dụng 5 công dân trở lên" },
      { "kind": "bullet", "depth": 0, "text": "F-5-8: Hoa kiều cư trú tại Hàn Quốc và được sinh ra tại Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "F-5-9: Người có bằng tiến sĩ trong lĩnh vực công nghiệp tiên tiến và được tuyển dụng tại doanh nghiệp Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "F-5-10: Người có bằng cử nhân trong lĩnh vực công nghiệp tiên tiến, hoặc thạc sĩ trở lên ở lĩnh vực thông thường, hoặc chứng chỉ kỹ thuật, và được tuyển dụng tại doanh nghiệp Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "F-5-11: Người có năng lực xuất chúng trong lĩnh vực đặc thù (khoa học, quản trị, giáo dục, văn hoá nghệ thuật, thể thao, v.v.)" },
      { "kind": "bullet", "depth": 0, "text": "F-5-12: Người có công lao đặc biệt với Đại Hàn Dân Quốc" },
      { "kind": "bullet", "depth": 0, "text": "F-5-13: Người từ 60 tuổi trở lên và nhận lương hưu ở nước ngoài" },
      { "kind": "bullet", "depth": 0, "text": "F-5-15: Người lấy bằng tiến sĩ tại trường sau đại học trong nước và được tuyển dụng tại doanh nghiệp Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "F-5-16: Người đã lưu trú từ 3 năm trở lên với tư cách cư trú theo hệ thống tính điểm" },
      { "kind": "bullet", "depth": 0, "text": "F-5-17: Người liên tục đầu tư từ 5 năm trở lên với tư cách cư trú đầu tư cơ sở du lịch/nghỉ dưỡng" },
      { "kind": "bullet", "depth": 0, "text": "F-5-18: Vợ/chồng hoặc con chưa thành niên của người thường trú theo hệ thống tính điểm (F-5-16)" },
      { "kind": "bullet", "depth": 0, "text": "F-5-19: Vợ/chồng hoặc con chưa kết hôn của nhà đầu tư cơ sở du lịch/nghỉ dưỡng (F-5-17)" },
      { "kind": "bullet", "depth": 0, "text": "F-5-20: Con sinh ra trong nước của người mang tư cách thường trú" },
      { "kind": "bullet", "depth": 0, "text": "F-5-21: Người liên tục đầu tư từ 5 năm trở lên với tư cách cư trú đầu tư công ích" },
      { "kind": "bullet", "depth": 0, "text": "F-5-22: Vợ/chồng hoặc con chưa kết hôn của nhà đầu tư công ích thông thường (F-5-21) hoặc nhà đầu tư công ích diện hưu trí (F-5-23)" },
      { "kind": "bullet", "depth": 0, "text": "F-5-23: Nhà đầu tư diện hưu trí, đầu tư liên tục từ 5 năm trở lên cho dự án công ích và sở hữu tài sản tại Hàn Quốc từ 300 triệu KRW trở lên" },
      { "kind": "bullet", "depth": 0, "text": "F-5-24: Người đã thu hút từ 300 triệu KRW vốn đầu tư trở lên với tư cách Khởi nghiệp công nghệ (D-8-4) và tuyển dụng 2 công dân trở lên" },
      { "kind": "bullet", "depth": 0, "text": "F-5-25: Người cam kết đầu tư từ 1,5 tỷ KRW trở lên trong 5 năm trở lên" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "通用提交材料" },
      { "kind": "bullet", "depth": 1, "text": "综合申请书" },
      { "kind": "bullet", "depth": 1, "text": "护照" },
      { "kind": "bullet", "depth": 1, "text": "外国人登录证" },
      { "kind": "bullet", "depth": 1, "text": "停留地证明材料" },
      { "kind": "bullet", "depth": 1, "text": "海外无犯罪记录证明" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书" },
      { "kind": "bullet", "depth": 1, "text": "收入金额证明" },
      { "kind": "bullet", "depth": 1, "text": "综合所得税相关材料" },
      { "kind": "bullet", "depth": 1, "text": "韩国移民永居适格考试结果" },
      { "kind": "bullet", "depth": 1, "text": "韩国移民归化适格考试结果" },
      { "kind": "bullet", "depth": 1, "text": "社会融合项目修读证" },
      { "kind": "bullet", "depth": 0, "text": "按永居资格的提交材料" },
      { "kind": "bullet", "depth": 1, "text": "F-5-1：" },
      { "kind": "bullet", "depth": 2, "text": "D-8 或 D-9 情况：销售额或出口额证明材料" },
      { "kind": "bullet", "depth": 2, "text": "D-10 情况：E-1~E-7 相应资格证明、学位证、雇佣合同" },
      { "kind": "bullet", "depth": 2, "text": "E-7 情况：学位证" },
      { "kind": "bullet", "depth": 1, "text": "F-5-4、F-5-8、F-5-18、F-5-19、F-5-20、F-5-22：" },
      { "kind": "bullet", "depth": 2, "text": "家庭关系证明材料" },
      { "kind": "bullet", "depth": 2, "text": "出生证明" },
      { "kind": "bullet", "depth": 2, "text": "未婚子女证明材料" },
      { "kind": "bullet", "depth": 1, "text": "F-5-5、F-5-24：" },
      { "kind": "bullet", "depth": 2, "text": "外商投资企业登记证明（仅 F-5-5 适用）" },
      { "kind": "bullet", "depth": 2, "text": "投资金引入相关材料（仅 F-5-24 适用）" },
      { "kind": "bullet", "depth": 2, "text": "法人登记事项全部证明" },
      { "kind": "bullet", "depth": 2, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 2, "text": "雇佣本国人收入金额证明" },
      { "kind": "bullet", "depth": 2, "text": "与雇佣本国人签订的雇佣合同" },
      { "kind": "bullet", "depth": 2, "text": "雇佣本国人相关四大保险事业场加入名册等" },
      { "kind": "bullet", "depth": 1, "text": "F-5-9、F-5-10、F-5-15：" },
      { "kind": "bullet", "depth": 2, "text": "学位证或技术资格证副本" },
      { "kind": "bullet", "depth": 2, "text": "营业执照副本" },
      { "kind": "bullet", "depth": 2, "text": "雇佣合同副本" },
      { "kind": "bullet", "depth": 2, "text": "在职证明" },
      { "kind": "bullet", "depth": 1, "text": "F-5-13：" },
      { "kind": "bullet", "depth": 2, "text": "养老金证书及养老金存折副本" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chung phải nộp" },
      { "kind": "bullet", "depth": 1, "text": "Đơn đăng ký tổng hợp" },
      { "kind": "bullet", "depth": 1, "text": "Hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Thẻ đăng ký người nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh nơi lưu trú" },
      { "kind": "bullet", "depth": 1, "text": "Lý lịch tư pháp ở nước ngoài" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận thu nhập" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ liên quan đến thuế thu nhập tổng hợp" },
      { "kind": "bullet", "depth": 1, "text": "Kết quả kỳ thi tư cách Thường trú Nhập cư Hàn Quốc" },
      { "kind": "bullet", "depth": 1, "text": "Kết quả kỳ thi tư cách Nhập tịch Hàn Quốc" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận hoàn thành Chương trình Hoà nhập Xã hội" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ phải nộp theo từng loại tư cách thường trú" },
      { "kind": "bullet", "depth": 1, "text": "F-5-1:" },
      { "kind": "bullet", "depth": 2, "text": "Trường hợp D-8 hoặc D-9: Hồ sơ chứng minh doanh thu hoặc kim ngạch xuất khẩu" },
      { "kind": "bullet", "depth": 2, "text": "Trường hợp D-10: Hồ sơ chứng minh tư cách E-1~E-7, bằng cấp, hợp đồng lao động" },
      { "kind": "bullet", "depth": 2, "text": "Trường hợp E-7: Bằng cấp" },
      { "kind": "bullet", "depth": 1, "text": "F-5-4, F-5-8, F-5-18, F-5-19, F-5-20, F-5-22:" },
      { "kind": "bullet", "depth": 2, "text": "Hồ sơ chứng minh quan hệ gia đình" },
      { "kind": "bullet", "depth": 2, "text": "Giấy khai sinh" },
      { "kind": "bullet", "depth": 2, "text": "Hồ sơ chứng minh con chưa kết hôn" },
      { "kind": "bullet", "depth": 1, "text": "F-5-5, F-5-24:" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận đăng ký doanh nghiệp đầu tư nước ngoài (chỉ áp dụng F-5-5)" },
      { "kind": "bullet", "depth": 2, "text": "Hồ sơ liên quan đến việc thu hút vốn đầu tư (chỉ áp dụng F-5-24)" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận tất cả các mục đăng ký pháp nhân" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận thu nhập của công dân được tuyển dụng" },
      { "kind": "bullet", "depth": 2, "text": "Hợp đồng lao động ký với công dân được tuyển dụng" },
      { "kind": "bullet", "depth": 2, "text": "Danh sách tham gia 4 loại bảo hiểm liên quan đến công dân được tuyển dụng, v.v." },
      { "kind": "bullet", "depth": 1, "text": "F-5-9, F-5-10, F-5-15:" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao bằng cấp hoặc chứng chỉ kỹ thuật" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao giấy phép kinh doanh" },
      { "kind": "bullet", "depth": 2, "text": "Bản sao hợp đồng lao động" },
      { "kind": "bullet", "depth": 2, "text": "Giấy chứng nhận đang công tác" },
      { "kind": "bullet", "depth": 1, "text": "F-5-13:" },
      { "kind": "bullet", "depth": 2, "text": "Giấy tờ lương hưu và bản sao sổ tài khoản nhận lương hưu" }
    ]
  },
  "F-6": {
    "titleKo": "F-6 결혼이민 비자 - 결혼 및 이혼 가족",
    "titleEn": "F-6 Spouse of Korean National - Married and Divorced Family",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결혼가족 및 이혼가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 3년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Married and divorced families"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum length of stay per grant: 3 years"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-1: 한국에서 혼인이 유효하게 성립되어 있고 우리 국민과 결혼생활을 지속하기 위해 국내 체류를 하고자 하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-2: 국민과 혼인관계 (사실상의 혼인관계를 포함한다)에서 출생한 미성년 자녀를 혼인관계 단절 후 국내에서 양육하거나 양육하려는 부 또는 모"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-3: 국민인 배우자와 혼인한 상태로 국내에 체류하던 중 그 배우자의 사망이나 실종 그 밖에 자신에게 책임이 없는 사유로 정상적인 혼인관계를 유지할 수 없는 사람으로서 법무부장관이 인정하는 사람"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-1: A person who is validly married in Korea and wishes to remain in Korea to continue his or her marriage to a Korean national."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-2: A father or mother who is raising or intends to raise a minor child born in a marriage (including a de facto marriage) with a national in Korea after the marriage is terminated."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-3: A person recognized by the Minister of Justice as being unable to maintain a normal marital relationship due to the death or disappearance of his or her spouse, or other reasons for which he or she is not responsible, while staying in Korea while married to a national."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "비자 신청서(사증발급 신청서)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권용 사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청인(외국인 배우자) 여권 원본 및 사본 1부"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "비자 신청 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 배우자 초청장 (한국인 배우자가 한글로 작성)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서 (한국인 배우자가 한글로 작성)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 배우자의 결혼배경진술서 (외국인 배우자가 영어로 작성)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한국인 배우자가 준비해야 하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국인 배우자 여권 사본 1부"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본증명서(상세)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "혼인관계증명서(상세)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계증명서(상세)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주민등록등본 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국제결혼 안내프로그램 이수증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "건강진단서 원본"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Basic documents"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa application form (application for visa issuance)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "One passport-size photograph"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original passport of the applicant (foreign spouse)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "One copy of the applicant's passport"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Visa application fee"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Invitation letter for the foreign spouse (written in Korean by the Korean spouse)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Identity Guarantee (Korean spouse to fill out in Korean)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Marriage Background Statement of the foreign spouse (written in English by the foreign spouse)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents to be prepared by the Korean spouse"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "One copy of the Korean spouse's passport"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Basic Certificate (detailed)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Marriage certificate (details)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Family Relationship Certificate (detailed)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original resident registration card"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of completion of the International Marriage Guidance Program"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original medical certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original criminal background certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original marriage certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original criminal background certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents to be prepared by the foreign spouse"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original marriage certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original criminal background certificate"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original medical examination"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to the income requirements of the Korean spouse"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Original proof of income"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "1 copy of credit report"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Labor income withholding or employment certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to communication requirements for foreign spouse"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Select and submit one of the following documents"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of completion of Korean Language Course (Level 2), Certificate of completion of Sejong Academy (Beginner 1A+1B)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Test of Proficiency in Korean (TOPIK) transcript"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Certificate of completion from a designated Korean language institution"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Diploma from a Korean language-related university (graduate school)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof of foreign nationality"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof that the foreign spouse has lived in Korea for at least one year."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof that the Korean spouse has lived in a country where the foreign spouse's language is an official language for at least one year."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof that the Korean spouse is a naturalized citizen of a country where the foreign spouse's language is an official language."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Proof that the Korean spouse and the foreign spouse have lived in the country where the language of the foreign spouse is an official language for at least one year."
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Other evidence of communicability"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents related to the Korean spouse's housing requirements"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If you are a homeowner, a copy of your property register"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "If you are a landlord, one copy of the landlord's registration certificate and lease agreement"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of relationship"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "Documents that can prove the history of the relationship and the authenticity of the marriage."
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "결혼가족 및 이혼가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 3년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-1: 한국에서 혼인이 유효하게 성립되어 있고 우리 국민과 결혼생활을 지속하기 위해 국내 체류를 하고자 하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-2: 국민과 혼인관계 (사실상의 혼인관계를 포함한다)에서 출생한 미성년 자녀를 혼인관계 단절 후 국내에서 양육하거나 양육하려는 부 또는 모"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "F-6-3: 국민인 배우자와 혼인한 상태로 국내에 체류하던 중 그 배우자의 사망이나 실종 그 밖에 자신에게 책임이 없는 사유로 정상적인 혼인관계를 유지할 수 없는 사람으로서 법무부장관이 인정하는 사람"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기본 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "비자 신청서(사증발급 신청서)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "여권용 사진 1매"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청인(외국인 배우자) 여권 원본 및 사본 1부"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "비자 신청 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 배우자 초청장 (한국인 배우자가 한글로 작성)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서 (한국인 배우자가 한글로 작성)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "외국인 배우자의 결혼배경진술서 (외국인 배우자가 영어로 작성)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "한국인 배우자가 준비해야 하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "한국인 배우자 여권 사본 1부"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "기본증명서(상세)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "혼인관계증명서(상세)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계증명서(상세)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "주민등록등본 원본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "국제결혼 안내프로그램 이수증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "건강진단서 원본"
      }
    ],
    "titleZh": "F-6 结婚移民签证 - 结婚及离婚家庭",
    "titleVi": "Visa F-6 Kết hôn nhập cư - Gia đình kết hôn và ly hôn",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "结婚家庭及离婚家庭" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：3 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Gia đình kết hôn và gia đình ly hôn" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 3 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "F-6-1：在韩国有效成立婚姻并希望与韩国国民继续婚姻生活而欲在韩停留者" },
      { "kind": "bullet", "depth": 0, "text": "F-6-2：与韩国国民婚姻关系（含事实婚）中出生的未成年子女，在婚姻关系终止后在韩抚养或欲抚养的父或母" },
      { "kind": "bullet", "depth": 0, "text": "F-6-3：与韩国国民配偶婚姻状态下在韩停留期间，因配偶死亡或失踪等非己方责任事由无法维持正常婚姻关系，且经法务部长官认定的人员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "F-6-1: Người đã thành lập hôn nhân hợp lệ tại Hàn Quốc và muốn lưu trú trong nước để tiếp tục đời sống hôn nhân với công dân Hàn Quốc" },
      { "kind": "bullet", "depth": 0, "text": "F-6-2: Cha hoặc mẹ đang nuôi dưỡng hoặc dự định nuôi dưỡng tại Hàn Quốc con chưa thành niên sinh ra trong quan hệ hôn nhân (bao gồm sống chung như vợ chồng) với công dân, sau khi quan hệ hôn nhân chấm dứt" },
      { "kind": "bullet", "depth": 0, "text": "F-6-3: Người đang lưu trú trong nước trong tình trạng kết hôn với công dân, không thể duy trì quan hệ hôn nhân bình thường do người phối ngẫu qua đời, mất tích hoặc các lý do khác không thuộc trách nhiệm của bản thân, và được Bộ trưởng Tư pháp công nhận" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "基本材料" },
      { "kind": "bullet", "depth": 1, "text": "签证申请书（签证发放申请书）" },
      { "kind": "bullet", "depth": 1, "text": "护照规格照片 1 张" },
      { "kind": "bullet", "depth": 1, "text": "申请人（外国人配偶）护照原件及副本 1 份" },
      { "kind": "bullet", "depth": 1, "text": "签证申请手续费" },
      { "kind": "bullet", "depth": 1, "text": "外国人配偶邀请函（由韩国人配偶以韩文撰写）" },
      { "kind": "bullet", "depth": 1, "text": "身份担保书（由韩国人配偶以韩文撰写）" },
      { "kind": "bullet", "depth": 1, "text": "外国人配偶的结婚背景陈述书（由外国人配偶以英文撰写）" },
      { "kind": "bullet", "depth": 0, "text": "韩国人配偶需准备的材料" },
      { "kind": "bullet", "depth": 1, "text": "韩国人配偶护照副本 1 份" },
      { "kind": "bullet", "depth": 1, "text": "基本证明（详细）" },
      { "kind": "bullet", "depth": 1, "text": "婚姻关系证明（详细）" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明（详细）" },
      { "kind": "bullet", "depth": 1, "text": "居民登记表副本原件" },
      { "kind": "bullet", "depth": 1, "text": "国际结婚指南项目修读证" },
      { "kind": "bullet", "depth": 1, "text": "健康诊断书原件" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ cơ bản" },
      { "kind": "bullet", "depth": 1, "text": "Đơn xin cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "1 ảnh kích cỡ hộ chiếu" },
      { "kind": "bullet", "depth": 1, "text": "Bản gốc và 1 bản sao hộ chiếu của người nộp hồ sơ (vợ/chồng người nước ngoài)" },
      { "kind": "bullet", "depth": 1, "text": "Lệ phí xét cấp thị thực" },
      { "kind": "bullet", "depth": 1, "text": "Thư mời vợ/chồng người nước ngoài (do vợ/chồng người Hàn viết bằng tiếng Hàn)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy bảo lãnh nhân thân (do vợ/chồng người Hàn viết bằng tiếng Hàn)" },
      { "kind": "bullet", "depth": 1, "text": "Bản tường trình bối cảnh hôn nhân của vợ/chồng người nước ngoài (do vợ/chồng người nước ngoài viết bằng tiếng Anh)" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ vợ/chồng người Hàn cần chuẩn bị" },
      { "kind": "bullet", "depth": 1, "text": "1 bản sao hộ chiếu của vợ/chồng người Hàn" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận cơ bản (chi tiết)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận quan hệ hôn nhân (chi tiết)" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận quan hệ gia đình (chi tiết)" },
      { "kind": "bullet", "depth": 1, "text": "Bản gốc bảng đăng ký dân" },
      { "kind": "bullet", "depth": 1, "text": "Giấy chứng nhận hoàn thành Chương trình Hướng dẫn Hôn nhân Quốc tế" },
      { "kind": "bullet", "depth": 1, "text": "Bản gốc giấy chẩn đoán sức khoẻ" }
    ]
  },
  "H-1": {
    "titleKo": "H-1 관광취업 비자 - 워킹홀리데이",
    "titleEn": "H-1 Working Holiday",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 관광취업에 관한 협정이나 양해각서를 체결한 국가의 국민으로서 관광을 주된 목적으로 하면서 이에 수반되는 관광경비 충당을 위하여 단기간 취업 활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 협정상의 체류기간"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Nationals of countries that have signed agreements or memorandums of understanding with the Republic of Korea on tourism employment, who are engaged in short-term employment activities for the primary purpose of tourism and to cover tourism expenses."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Upper limit of the period of stay that can be granted once: Agreement period of stay"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "호주, 캐나다, 뉴질랜드, 일본, 미국, 프랑스, 독일, 아일랜드, 스웨덴, 덴마크, 홍콩, 대만, 체코, 이탈리아, 영국, 오스트리아, 헝가리, 이스라엘, 네덜란드, 포르투갈, 벨기에, 칠레, 폴란드, 스페인, 아르헨티나 국가의 국민"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급 신청시 18세 이상 30세 이하일 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "중대한 범죄경력이 없을 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체재비 등 재정 능력이 있을 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광이 주된 목적이어야 하며, E-1 ~ E-7 자격에 해당하는 분야의 취업이 제한됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1주당 최대 취업 가능 시간은 25시간 이내로 함"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Citizens of the following countries: Australia, Canada, New Zealand, Japan, United States, France, Germany, Ireland, Sweden, Denmark, Hong Kong, Taiwan, Czech Republic, Italy, United Kingdom, Austria, Hungary, Israel, Netherlands, Portugal, Belgium, Chile, Poland, Spain, and Argentina"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Be between the ages of 18 and 30 at the time of application for the visa."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "No serious criminal record"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Must have the financial ability to pay for their stay"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Employment must be primarily for tourism, with restrictions on employment in the E-1 through E-7 categories."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "You may work no more than 25 hours per week."
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 사진, 여권, 왕복항공권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "왕복 항공권이 없는 경우 상당금액 예치서류 인정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "예금잔고증명서 등 일정기간 (3개월)체류할 수 있는 경비 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "범죄경력증명서, 건강진단서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "보험증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재학증명서 또는 최종학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광취업 활동계획서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 서류"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Visa application, photo, passport, and round-trip ticket"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "A substantial deposit if you do not have a round-trip ticket"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of expenses for a certain period of stay (3 months), such as bank statement, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Criminal background certificate, medical certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Insurance certificate"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Certificate of enrollment or finalized academic record"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Tourism employment activity plan"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Other documents"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "대한민국과 관광취업에 관한 협정이나 양해각서를 체결한 국가의 국민으로서 관광을 주된 목적으로 하면서 이에 수반되는 관광경비 충당을 위하여 단기간 취업 활동을 하려는 자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 협정상의 체류기간"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "호주, 캐나다, 뉴질랜드, 일본, 미국, 프랑스, 독일, 아일랜드, 스웨덴, 덴마크, 홍콩, 대만, 체코, 이탈리아, 영국, 오스트리아, 헝가리, 이스라엘, 네덜란드, 포르투갈, 벨기에, 칠레, 폴란드, 스페인, 아르헨티나 국가의 국민"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급 신청시 18세 이상 30세 이하일 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "중대한 범죄경력이 없을 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "체재비 등 재정 능력이 있을 것"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광이 주된 목적이어야 하며, E-1 ~ E-7 자격에 해당하는 분야의 취업이 제한됨"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1주당 최대 취업 가능 시간은 25시간 이내로 함"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사증발급신청서, 사진, 여권, 왕복항공권"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "왕복 항공권이 없는 경우 상당금액 예치서류 인정"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "예금잔고증명서 등 일정기간 (3개월)체류할 수 있는 경비 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "범죄경력증명서, 건강진단서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "보험증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "재학증명서 또는 최종학력증명서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "관광취업 활동계획서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 서류"
      }
    ],
    "titleZh": "H-1 旅游就业签证 - 打工度假",
    "titleVi": "Visa H-1 Du lịch kết hợp việc làm - Working Holiday",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "与韩国签订打工度假协定或谅解备忘录国家的国民，以观光为主要目的并为筹措伴随的观光经费而进行短期就业活动者" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：协定规定的停留期间" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Công dân các nước đã ký hiệp định hoặc bản ghi nhớ về du lịch kết hợp việc làm với Hàn Quốc, làm việc ngắn hạn nhằm trang trải chi phí du lịch với mục đích chính là du lịch" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: thời hạn lưu trú theo hiệp định" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "澳大利亚、加拿大、新西兰、日本、美国、法国、德国、爱尔兰、瑞典、丹麦、香港、台湾、捷克、意大利、英国、奥地利、匈牙利、以色列、荷兰、葡萄牙、比利时、智利、波兰、西班牙、阿根廷国家的国民" },
      { "kind": "bullet", "depth": 0, "text": "签证申请时年龄在 18 至 30 岁之间" },
      { "kind": "bullet", "depth": 0, "text": "无重大犯罪记录" },
      { "kind": "bullet", "depth": 0, "text": "具备生活费等财力能力" },
      { "kind": "bullet", "depth": 0, "text": "观光须为主要目的，限制 E-1 ~ E-7 资格相应领域的就业" },
      { "kind": "bullet", "depth": 0, "text": "每周最多就业时间不超过 25 小时" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Công dân các nước: Úc, Canada, New Zealand, Nhật Bản, Mỹ, Pháp, Đức, Ireland, Thụy Điển, Đan Mạch, Hong Kong, Đài Loan, Cộng hoà Séc, Ý, Anh, Áo, Hungary, Israel, Hà Lan, Bồ Đào Nha, Bỉ, Chile, Ba Lan, Tây Ban Nha, Argentina" },
      { "kind": "bullet", "depth": 0, "text": "Tuổi từ 18 đến 30 tại thời điểm nộp hồ sơ xin thị thực" },
      { "kind": "bullet", "depth": 0, "text": "Không có tiền án nghiêm trọng" },
      { "kind": "bullet", "depth": 0, "text": "Có năng lực tài chính chi trả chi phí sinh hoạt, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Mục đích chính phải là du lịch; bị hạn chế làm việc trong các lĩnh vực thuộc tư cách E-1 ~ E-7" },
      { "kind": "bullet", "depth": 0, "text": "Số giờ làm việc tối đa mỗi tuần không quá 25 giờ" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "签证申请书、照片、护照、往返机票" },
      { "kind": "bullet", "depth": 1, "text": "无往返机票时，认可相当金额的存款凭证" },
      { "kind": "bullet", "depth": 0, "text": "存款余额证明等可在一定期间（3 个月）停留的费用证明材料" },
      { "kind": "bullet", "depth": 0, "text": "无犯罪记录证明、健康诊断书" },
      { "kind": "bullet", "depth": 0, "text": "保险证书" },
      { "kind": "bullet", "depth": 0, "text": "在学证明或最终学历证明" },
      { "kind": "bullet", "depth": 0, "text": "打工度假活动计划书" },
      { "kind": "bullet", "depth": 0, "text": "其他材料" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Đơn xin cấp thị thực, ảnh, hộ chiếu, vé máy bay khứ hồi" },
      { "kind": "bullet", "depth": 1, "text": "Trường hợp không có vé khứ hồi, có thể chấp nhận hồ sơ ký quỹ với số tiền tương đương" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ chứng minh chi phí lưu trú trong một thời gian nhất định (3 tháng) như giấy chứng nhận số dư tiết kiệm, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Lý lịch tư pháp, giấy chẩn đoán sức khoẻ" },
      { "kind": "bullet", "depth": 0, "text": "Giấy chứng nhận bảo hiểm" },
      { "kind": "bullet", "depth": 0, "text": "Giấy chứng nhận đang học hoặc giấy chứng nhận học vấn cuối cùng" },
      { "kind": "bullet", "depth": 0, "text": "Kế hoạch hoạt động du lịch kết hợp việc làm" },
      { "kind": "bullet", "depth": 0, "text": "Hồ sơ khác" }
    ]
  },
  "H-2": {
    "titleKo": "비자 안내",
    "titleEn": "비자 안내",
    "titleZh": "签证指南",
    "titleVi": "Hướng dẫn visa",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionKo": [],
    "descriptionEn": [],
    "descriptionZh": [],
    "descriptionVi": [],
    "candidatesKo": [],
    "candidatesEn": [],
    "candidatesZh": [],
    "candidatesVi": [],
    "requirementsKo": [],
    "requirementsEn": [],
    "requirementsZh": [],
    "requirementsVi": [],
    "description": [],
    "candidates": [],
    "requirements": []
  },
  "G-1": {
    "titleKo": "G-1 기타 비자",
    "titleEn": "G-1 Other",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외교(A-1)부터 결혼이민(F-6)까지, 관광취업(H-1) or 방문취업(H-2) 체류자격에 해당하지 않는 사람으로서 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 1년"
      }
    ],
    "descriptionEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Anyone recognized by the Attorney General as not eligible for a diplomatic (A-1), marriage (F-6), tourist (H-1), or visitor (H-2) status."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Maximum period of stay that can be granted once: 1 year"
      }
    ],
    "candidatesKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "산업재해 청구 및 치료 중인 사람과 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "질병 사고로 치료 중인 사람과 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "각종 소송 진행 중인 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임금체불로 노동관서에서 중재 중인 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민신청자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민불인정자 중 인도적 체류허가자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사고 등으로 사망한 사람의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임신, 출산 등 인도적 체류허가자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "질병치료 등으로 입국 후 장기치료가 필요한 환자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "성폭력 피해자 등 인도적 고려가 필요한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인도적 체류자(G-1-6) 의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 사유에 해당되는 사람"
      }
    ],
    "candidatesEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Workers' compensation claims and their families"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "People who are being treated for a medical condition and their families"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "People in litigation"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "People who are being arbitrated by labor offices for unpaid wages"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Asylum seekers"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Refugees who have been denied asylum and are granted humanitarian stays"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members of a person who died in an accident, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Humanitarian stay permit holders for pregnancy, childbirth, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Patients and their families who need long-term treatment after entering the country for medical treatment, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons in need of humanitarian consideration, such as victims of sexual assault"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members of humanitarian residents (G-1-6)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons who qualify for other reasons"
      }
    ],
    "requirementsKo": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내출생 난민신청자(G-1-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "난민인정신청 접수증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류(임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권단체,UNHCR등의 주거확인서 등 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인도적 체류허가자의 국내 출생 미성년 자녀 (G-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류(임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우 편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권단체 UNHCR 등의 주거확인서 등 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민 신청자 (G-1-5) 의 국내 출생 미성년 자녀 (G-1-99)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서 ,여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인 할수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료는 일반 체류 외국인과 동일"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "산업재해 청구 및 치료 중인 사람과 그 가족(G-1-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산재보상심사청구서 또는 재심청구서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산재로 인한 병원진단서 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 기타 보호자 입증 서류 (가족에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "질병 사고로 치료 중인 사람과 그 가족(G-1-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "의료기관에서 발행한 소견서 등 자기치료의 필요성을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "치료 및 체류 비용 조달 능력을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류 (배우자 또는 직계가족 동반시만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서 (‘체류기간 연장 ’ 심사 시 활용 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "각종 소송 진행 중인 사람(G-1-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소장 사본, 소송제기 증명원, 법률구조결정서 사본, 기타 청구권의 존재를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 또는 보호자 입증서류 (보호자 가족에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서 (‘체류기간 연장’ 심사시 활용)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임금체불로 노동관서에서 중재 중인 사람 (G-1-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "노동부 제출 진정서 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "노동부 발급 체불금품 확인원 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서 (‘체류기간 연장’ 심사 시 활용)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민신청자(G-1-5)및 난민불인정자 중 인도적 체류허가자 (G-1-6)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권 및 외국인등록증, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "난민인정신청 접수증 등 난민신청자 또는 인도적 체류허가자임을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류(임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권단체,UNHCR 등의 주거확인서 등 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임신 출산 등 인도적 배려가 불가피한 사람 (G-1-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "진단서 등 사유를 증명할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인환자 (G-1-10)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "의료기관에서 발행한 소견서 등 장기 치료의 필요성을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "치료 및 체류 비용 조달 능력을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 및 간병인 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "성폭력피해자 등 인도적 고려가 필요한 사람 (G-1-11)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소송관련 서류 등 권리구제 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 사유에 해당되는 사람 (G-1-99)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인도적 체류허가자의 가족 (G-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권 및 외국인등록증, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(배우자) 가족관계증명서, 결혼증명서 등 혼인관계를 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(미성년 자녀) 출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류 ( 임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권 단체 ,UNHCR 등의 주거확인서 등)"
      }
    ],
    "requirementsEn": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Domestic-born refugee applicants (G-1-5)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Receipt of Refugee Recognition Application"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of place of residence (lease agreement, confirmation of accommodation, mailed notice of expiration of period of stay, utility bill, dormitory fee receipt, housing verification from church, refugee assistance center, human rights organization, UNHCR, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Domestic-born minor children of humanitarian status holders (G-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of relationship to parents, such as birth certificate, and proof of age of minor children."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of place of residence (lease agreement, confirmation of accommodation, mailed notice of anticipated expiration of stay, utility bill, dormitory fee receipt, housing verification from church, refugee assistance center, human rights organization UNHCR, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Domestic-born minor children (G-1-99) of asylum seekers (G-1-5)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents to prove relationship to parents, such as birth certificate, and documents to verify the age of minor children."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "The fee is the same as for other foreign residents."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Workers' compensation claimants and their family members (G-1-1)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Workers' compensation examination form or reconsideration form"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Medical certificate, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of family relationship or other guardianship (family members only)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Confirmation of ability to earn a living"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "People who are being treated for a disease or accident and their families (G-1-2)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving the need for self-treatment, such as a medical certificate issued by a medical institution."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents demonstrating the ability to pay for treatment and stay."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of family relationship (spouse or immediate family members only)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of ability to earn a living (used for \"extension of period of stay\" examination)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Persons in various types of proceedings (G-1-3)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of the complaint, proof of filing, a copy of the legal aid decision, and other documents that confirm the existence of the claim."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of family relationship or guardianship (for guardian family members only)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of ability to earn a living (used for \"extension of stay\")"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "If you are in arbitration with the labor office for unpaid wages (G-1-4)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standard-sized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of the complaint filed with the Ministry of Labor"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "A copy of the complaint submitted to the Ministry of Labor, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Judgment of Subsistence (used for \"extension of stay\")"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Refugee applicants (G-1-5) and inadmissible refugees granted humanitarian status (G-1-6)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport and alien registration card, one standardized photo, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents to prove that you are a refugee applicant or humanitarian residence permit holder, such as a refugee recognition application receipt."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of place of residence (lease agreement, confirmation of accommodation, mailed notice of expiration of stay, utility bill, dormitory fee receipt, letter from church, refugee assistance center, human rights organization, UNHCR, etc.)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "People in need of humanitarian consideration, such as pregnant women giving birth (G-1-9)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standardized photo, and fee."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents to prove the reason, such as medical certificate, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Foreign patients (G-1-10)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documents proving the need for long-term treatment, such as a medical certificate from a medical institution."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of ability to pay for treatment and stay."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Documentation of family relationships and caregivers"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Humanitarian considerations, such as victims of sexual violence (G-1-11)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of right to relief, such as litigation documents, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Identity guarantee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Others (G-1-99)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of relationship to parents, such as a birth certificate, and proof of age of minor children."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Family members of a humanitarian (G-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Application form, passport or alien registration card, one standardized photograph, and fee"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of family relationship"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(Spouse) Family relationship certificate, marriage certificate, etc."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "(Minor children) Documents that prove the relationship with the parents, such as birth certificates, and documents that confirm the age of the minor children."
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "Proof of place of residence (lease agreement, confirmation of accommodation, mailed notice of expiration of stay, utility bill, dormitory fee receipt, housing verification from church, refugee assistance center, human rights organization, UNHCR, etc.)"
      }
    ],
    "description": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외교(A-1)부터 결혼이민(F-6)까지, 관광취업(H-1) or 방문취업(H-2) 체류자격에 해당하지 않는 사람으로서 법무부장관이 인정하는 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "1회 부여할 수 있는 체류 기간 상한: 1년"
      }
    ],
    "candidates": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "산업재해 청구 및 치료 중인 사람과 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "질병 사고로 치료 중인 사람과 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "각종 소송 진행 중인 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임금체불로 노동관서에서 중재 중인 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민신청자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민불인정자 중 인도적 체류허가자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "사고 등으로 사망한 사람의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임신, 출산 등 인도적 체류허가자"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "질병치료 등으로 입국 후 장기치료가 필요한 환자와 그 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "성폭력 피해자 등 인도적 고려가 필요한 사람"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인도적 체류자(G-1-6) 의 가족"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 사유에 해당되는 사람"
      }
    ],
    "requirements": [
      {
        "kind": "bullet",
        "depth": 0,
        "text": "국내출생 난민신청자(G-1-5)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "난민인정신청 접수증"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류(임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권단체,UNHCR등의 주거확인서 등 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인도적 체류허가자의 국내 출생 미성년 자녀 (G-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류(임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우 편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권단체 UNHCR 등의 주거확인서 등 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민 신청자 (G-1-5) 의 국내 출생 미성년 자녀 (G-1-99)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서 ,여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인 할수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "수수료는 일반 체류 외국인과 동일"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "산업재해 청구 및 치료 중인 사람과 그 가족(G-1-1)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산재보상심사청구서 또는 재심청구서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "산재로 인한 병원진단서 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 기타 보호자 입증 서류 (가족에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "질병 사고로 치료 중인 사람과 그 가족(G-1-2)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "의료기관에서 발행한 소견서 등 자기치료의 필요성을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "치료 및 체류 비용 조달 능력을 입증하는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류 (배우자 또는 직계가족 동반시만 해당)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서 (‘체류기간 연장 ’ 심사 시 활용 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "각종 소송 진행 중인 사람(G-1-3)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소장 사본, 소송제기 증명원, 법률구조결정서 사본, 기타 청구권의 존재를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 또는 보호자 입증서류 (보호자 가족에 한함)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서 (‘체류기간 연장’ 심사시 활용)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임금체불로 노동관서에서 중재 중인 사람 (G-1-4)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "노동부 제출 진정서 사본"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "노동부 발급 체불금품 확인원 등"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "생계유지능력 심사확인서 (‘체류기간 연장’ 심사 시 활용)"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "난민신청자(G-1-5)및 난민불인정자 중 인도적 체류허가자 (G-1-6)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권 및 외국인등록증, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "난민인정신청 접수증 등 난민신청자 또는 인도적 체류허가자임을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류(임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권단체,UNHCR 등의 주거확인서 등 )"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "임신 출산 등 인도적 배려가 불가피한 사람 (G-1-9)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "진단서 등 사유를 증명할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "외국인환자 (G-1-10)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "의료기관에서 발행한 소견서 등 장기 치료의 필요성을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "치료 및 체류 비용 조달 능력을 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 및 간병인 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "성폭력피해자 등 인도적 고려가 필요한 사람 (G-1-11)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "소송관련 서류 등 권리구제 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신원보증서"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "기타 사유에 해당되는 사람 (G-1-99)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 0,
        "text": "인도적 체류허가자의 가족 (G-1-12)"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "신청서, 여권 및 외국인등록증, 표준규격사진 1매, 수수료"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "가족관계 입증서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(배우자) 가족관계증명서, 결혼증명서 등 혼인관계를 입증할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "(미성년 자녀) 출생증명서 등 부모와의 관계를 입증할 수 있는 서류 및 미성년 자녀의 나이를 확인할 수 있는 서류"
      },
      {
        "kind": "bullet",
        "depth": 1,
        "text": "체류지 입증 서류 ( 임대차계약서, 숙소제공 확인서, 체류기간 만료예고 통지 우편물, 공공요금 납부영수증, 기숙사비 영수증, 교회, 난민지원시설, 인권 단체 ,UNHCR 등의 주거확인서 등)"
      }
    ],
    "titleZh": "G-1 其他签证",
    "titleVi": "Visa G-1 Khác",
    "updatedAtZh": null,
    "updatedAtVi": null,
    "descriptionZh": [
      { "kind": "bullet", "depth": 0, "text": "不属于外交（A-1）至结婚移民（F-6）、打工度假（H-1）或访问就业（H-2）停留资格，但经法务部长官认定的人员" },
      { "kind": "bullet", "depth": 0, "text": "单次可授予的最长停留期限：1 年" }
    ],
    "descriptionVi": [
      { "kind": "bullet", "depth": 0, "text": "Người không thuộc tư cách lưu trú từ Ngoại giao (A-1) đến Kết hôn nhập cư (F-6), Du lịch kết hợp việc làm (H-1) hoặc Việc làm thăm thân (H-2), nhưng được Bộ trưởng Tư pháp công nhận" },
      { "kind": "bullet", "depth": 0, "text": "Thời hạn lưu trú tối đa cho mỗi lần cấp: 1 năm" }
    ],
    "candidatesZh": [
      { "kind": "bullet", "depth": 0, "text": "正在申请工伤补偿及治疗的人员及其家属" },
      { "kind": "bullet", "depth": 0, "text": "因疾病或事故正在治疗的人员及其家属" },
      { "kind": "bullet", "depth": 0, "text": "各类诉讼进行中的人员" },
      { "kind": "bullet", "depth": 0, "text": "因拖欠工资在劳动机关进行调解的人员" },
      { "kind": "bullet", "depth": 0, "text": "难民申请者" },
      { "kind": "bullet", "depth": 0, "text": "未被认定为难民者中获人道居留许可者" },
      { "kind": "bullet", "depth": 0, "text": "因事故等死亡人员的家属" },
      { "kind": "bullet", "depth": 0, "text": "因怀孕、生育等获人道居留许可者" },
      { "kind": "bullet", "depth": 0, "text": "因疾病治疗等入境后需长期治疗的患者及其家属" },
      { "kind": "bullet", "depth": 0, "text": "性暴力受害者等需要人道考虑的人员" },
      { "kind": "bullet", "depth": 0, "text": "人道居留者（G-1-6）的家属" },
      { "kind": "bullet", "depth": 0, "text": "属于其他事由的人员" }
    ],
    "candidatesVi": [
      { "kind": "bullet", "depth": 0, "text": "Người đang yêu cầu bồi thường tai nạn lao động và đang điều trị, cùng gia đình" },
      { "kind": "bullet", "depth": 0, "text": "Người đang điều trị do bệnh tật hoặc tai nạn, cùng gia đình" },
      { "kind": "bullet", "depth": 0, "text": "Người đang trong các vụ kiện tụng" },
      { "kind": "bullet", "depth": 0, "text": "Người đang được hoà giải tại cơ quan lao động vì nợ lương" },
      { "kind": "bullet", "depth": 0, "text": "Người xin tị nạn" },
      { "kind": "bullet", "depth": 0, "text": "Người không được công nhận là người tị nạn nhưng được cấp phép lưu trú nhân đạo" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình của người tử vong do tai nạn, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Người được cấp phép lưu trú nhân đạo do mang thai, sinh con, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Bệnh nhân và gia đình cần điều trị dài hạn sau khi nhập cảnh để điều trị bệnh, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Người cần xem xét nhân đạo như nạn nhân bạo lực tình dục, v.v." },
      { "kind": "bullet", "depth": 0, "text": "Gia đình của người cư trú nhân đạo (G-1-6)" },
      { "kind": "bullet", "depth": 0, "text": "Người thuộc các lý do khác" }
    ],
    "requirementsZh": [
      { "kind": "bullet", "depth": 0, "text": "其他事由对应人员（G-1-99）" },
      { "kind": "bullet", "depth": 1, "text": "申请书、护照、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "出生证明等可证明与父母关系的材料及未成年子女年龄确认材料" },
      { "kind": "bullet", "depth": 0, "text": "人道居留许可者的家属（G-1-12）" },
      { "kind": "bullet", "depth": 1, "text": "申请书、护照及外国人登录证、标准规格照片 1 张、手续费" },
      { "kind": "bullet", "depth": 1, "text": "家庭关系证明材料" },
      { "kind": "bullet", "depth": 1, "text": "（配偶）家庭关系证明、结婚证明等可证明婚姻关系的材料" },
      { "kind": "bullet", "depth": 1, "text": "（未成年子女）出生证明等可证明与父母关系的材料及未成年子女年龄确认材料" },
      { "kind": "bullet", "depth": 1, "text": "停留地证明材料（租赁合同、住所提供确认书、停留期限届满预告通知邮件、公共费用缴费收据、宿舍费收据、教会、难民支援设施、人权团体、UNHCR 等的居住确认书等）" }
    ],
    "requirementsVi": [
      { "kind": "bullet", "depth": 0, "text": "Người thuộc lý do khác (G-1-99)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn đăng ký, hộ chiếu, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Giấy tờ chứng minh quan hệ với cha mẹ (giấy khai sinh, v.v.) và giấy tờ xác nhận tuổi của con chưa thành niên" },
      { "kind": "bullet", "depth": 0, "text": "Gia đình của người được cấp phép lưu trú nhân đạo (G-1-12)" },
      { "kind": "bullet", "depth": 1, "text": "Đơn đăng ký, hộ chiếu và thẻ đăng ký người nước ngoài, 1 ảnh tiêu chuẩn, lệ phí" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh quan hệ gia đình" },
      { "kind": "bullet", "depth": 1, "text": "(Vợ/chồng) Giấy chứng nhận quan hệ gia đình, giấy đăng ký kết hôn và các giấy tờ chứng minh quan hệ hôn nhân" },
      { "kind": "bullet", "depth": 1, "text": "(Con chưa thành niên) Giấy tờ chứng minh quan hệ với cha mẹ (giấy khai sinh, v.v.) và giấy tờ xác nhận tuổi của con chưa thành niên" },
      { "kind": "bullet", "depth": 1, "text": "Hồ sơ chứng minh nơi lưu trú (hợp đồng cho thuê, giấy xác nhận cung cấp chỗ ở, thư thông báo dự báo hết hạn lưu trú, biên lai nộp tiền tiện ích, biên lai phí ký túc xá, giấy xác nhận chỗ ở từ nhà thờ, cơ sở hỗ trợ tị nạn, tổ chức nhân quyền, UNHCR, v.v.)" }
    ]
  }
} as const;

export type VisaStructuredLine = {
  kind: "heading" | "bullet";
  depth: number;
  text: string;
};

export type VisaDetail = {
  titleKo: string | null;
  titleEn: string | null;
  updatedAtKo: string | null;
  updatedAtEn: string | null;
  descriptionKo: VisaStructuredLine[];
  descriptionEn: VisaStructuredLine[];
  candidatesKo: VisaStructuredLine[];
  candidatesEn: VisaStructuredLine[];
  requirementsKo: VisaStructuredLine[];
  requirementsEn: VisaStructuredLine[];
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
    ]
  },
  "H-2": {
    "titleKo": "비자 안내",
    "titleEn": "비자 안내",
    "updatedAtKo": null,
    "updatedAtEn": null,
    "descriptionKo": [],
    "descriptionEn": [],
    "candidatesKo": [],
    "candidatesEn": [],
    "requirementsKo": [],
    "requirementsEn": [],
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
    ]
  }
} as const;

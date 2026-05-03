"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "../../i18n/LanguageProvider";
import { ResourceSubPageLayout } from "./ResourceSubPageLayout";

type VisaItem = {
  code: string;
  labelKo: string;
  labelEn: string;
  applicantKo: string;
  applicantEn: string;
  durationKo: string;
  durationEn: string;
};

type VisaCategory = {
  key: string;
  titleKo: string;
  titleEn: string;
  descKo: string;
  descEn: string;
  accentClass: string;
  accentSoftClass: string;
  cardBgClass: string;
  items: VisaItem[];
};

export type FlatVisaItem = VisaItem & {
  groupKey: string;
  groupTitleKo: string;
  groupTitleEn: string;
  accentClass: string;
  accentSoftClass: string;
};

export const VISA_CATEGORIES: VisaCategory[] = [
  {
    key: "a",
    titleKo: "A계열",
    titleEn: "Category A",
    descKo: "외교, 공무, 국가간 협정에 따라 체류하는 사람",
    descEn: "People staying under diplomacy, official missions, or intergovernmental agreements",
    accentClass: "text-[#3559A6]",
      accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "A-1",
        labelKo: "외교",
        labelEn: "Diplomacy",
        applicantKo: "외국 정부의 외교사절단 또는 영사기관의 구성원과 그 가족",
        applicantEn: "Members of foreign diplomatic or consular missions and their families",
        durationKo: "재임기간",
        durationEn: "Term of assignment"
      },
      {
        code: "A-2",
        labelKo: "공무",
        labelEn: "Official",
        applicantKo: "외국 정부 또는 국제기구의 공무 수행자와 그 가족",
        applicantEn: "Persons on official duty for foreign governments/international organizations and their families",
        durationKo: "공무수행기간",
        durationEn: "Official duty period"
      },
      {
        code: "A-3",
        labelKo: "협정",
        labelEn: "Agreement",
        applicantKo: "SOFA 협정에 따른 주한미군, 군속, 초청계약자 및 그 가족",
        applicantEn: "USFK members, civilian employees, invited contractors, and families under SOFA",
        durationKo: "신분존속기간",
        durationEn: "Period of valid status"
      }
    ]
  },
  {
    key: "b",
    titleKo: "B계열",
    titleEn: "Category B",
    descKo: "사증면제협정, 상호주의 등에 따라 입국이 허용된 사람",
    descEn: "People permitted entry under visa waiver agreements or reciprocity",
    accentClass: "text-[#2F8B66]",
      accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "B-1",
        labelKo: "사증면제",
        labelEn: "Visa Waiver",
        applicantKo: "대한민국과 사증면제협정을 체결한 국가의 국민",
        applicantEn: "Nationals of countries that signed visa-waiver agreements with Korea",
        durationKo: "3개월 이내 (연장 불가)",
        durationEn: "Within 3 months (non-extendable)"
      },
      {
        code: "B-2",
        labelKo: "관광·통과",
        labelEn: "Tourism/Transit",
        applicantKo: "관광·통과 등의 목적으로 사증 없이 입국하는 사람 (법무부 장관이 대상 지정)",
        applicantEn: "Persons entering without a visa for tourism/transit (designated by the Minister of Justice)",
        durationKo: "3개월 이내 (연장 불가)",
        durationEn: "Within 3 months (non-extendable)"
      }
    ]
  },
  {
    key: "c",
    titleKo: "C계열",
    titleEn: "Category C",
    descKo: "90일 이내 일시 체류목적으로 입국하는 사람",
    descEn: "People entering for temporary stays within 90 days",
    accentClass: "text-[#2C9A83]",
      accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      {
        code: "C-1",
        labelKo: "일시취재",
        labelEn: "Temporary Press",
        applicantKo: "일시적인 취재 또는 보도활동을 하는 사람",
        applicantEn: "Persons conducting temporary reporting or press activity",
        durationKo: "90일 이내 (연장 불가)",
        durationEn: "Within 90 days (non-extendable)"
      },
      {
        code: "C-3",
        labelKo: "단기방문",
        labelEn: "Short-Term Visit",
        applicantKo: "관광, 상용, 방문 등의 목적으로 단기간 체류하는 사람",
        applicantEn: "Persons staying short-term for tourism, business, or visits",
        durationKo: "90일 이내 (연장 불가)",
        durationEn: "Within 90 days (non-extendable)"
      },
      {
        code: "C-4",
        labelKo: "단기취업",
        labelEn: "Short-Term Employment",
        applicantKo: "단기간 취업·영리활동을 하는 사람",
        applicantEn: "Persons engaged in short-term employment/profit activities",
        durationKo: "90일 이내 (연장 불가)",
        durationEn: "Within 90 days (non-extendable)"
      }
    ]
  },
  {
    key: "d",
    titleKo: "D계열",
    titleEn: "Category D",
    descKo: "교육, 문화, 투자 관련 활동을 위해 체류하는 사람",
    descEn: "People staying for education, culture, or investment-related activity",
    accentClass: "text-[#C2961A]",
      accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      { code: "D-1", labelKo: "문화예술", labelEn: "Culture/Arts", applicantKo: "수익을 목적으로 하지 않는 문화·예술 활동을 하는 사람", applicantEn: "Persons engaged in non-profit cultural/art activities", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "D-2", labelKo: "유학", labelEn: "Study", applicantKo: "전문대학 이상의 교육기관 등에서 정규 교육을 받는 사람", applicantEn: "Persons receiving regular education at junior college level or above", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "D-3", labelKo: "기술연수", labelEn: "Technical Training", applicantKo: "국내 산업체에서 연수를 받으려는 해외 법인 생산직 근로자", applicantEn: "Production workers of overseas corporations training at Korean industries", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "D-4", labelKo: "일반연수", labelEn: "General Training", applicantKo: "대학부설 어학원, 사설 교육기관 등에서 연수를 받는 사람", applicantEn: "Persons training at university language institutes/private institutions", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "D-5", labelKo: "취재", labelEn: "Press", applicantKo: "국내에 주재하면서 취재 또는 보도활동을 하는 사람", applicantEn: "Persons stationed in Korea for reporting or press activities", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "D-6", labelKo: "종교", labelEn: "Religion", applicantKo: "외국의 종교단체 등에서 파견되어 종교 활동을 하는 사람", applicantEn: "Persons dispatched by foreign religious organizations", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "D-7", labelKo: "주재", labelEn: "Intra-company Transfer", applicantKo: "외국 기업 등으로부터 국내 지점 등에 파견된 필수 인력", applicantEn: "Essential staff dispatched to domestic branches from foreign companies", durationKo: "3년 (연장 가능)", durationEn: "3 years (extendable)" },
      { code: "D-8", labelKo: "기업투자", labelEn: "Corporate Investment", applicantKo: "「외국인투자촉진법」에 따른 외투기업의 필수전문인력 및 벤처기업·기술창업자", applicantEn: "Key specialists of FDI companies and venture/tech startup founders under FIPA", durationKo: "5년 (연장 가능)", durationEn: "5 years (extendable)" },
      { code: "D-9", labelKo: "무역경영", labelEn: "Trade Management", applicantKo: "회사 설립·경영, 무역 또는 수입기계 설치·산업설비 제작 등을 위해 파견되어 근무하는 사람", applicantEn: "Persons dispatched for company setup/management, trade, machinery installation, etc.", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "D-10", labelKo: "구직", labelEn: "Job Seeking", applicantKo: "취업을 위한 구직활동, 기술창업 준비 또는 요건을 갖춘 기업에서 첨단기술 분야 인턴활동을 하는 사람", applicantEn: "Persons for job-seeking, startup prep, or advanced-tech internships at eligible firms", durationKo: "6개월 (첨단기술인턴:1년) (연장 가능)", durationEn: "6 months (advanced-tech internship: 1 year) (extendable)" }
    ]
  },
  {
    key: "e",
    titleKo: "E계열",
    titleEn: "Category E",
    descKo: "전문분야, 비전문분야 활동을 위해 체류하는 사람",
    descEn: "People staying for professional and non-professional work activities",
    accentClass: "text-[#7B4BA8]",
      accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      { code: "E-1", labelKo: "교수", labelEn: "Professor", applicantKo: "전문대학 이상의 교육기관 등에서 교육 등에 근무하는 사람", applicantEn: "Persons working in education at institutions above junior college level", durationKo: "5년 (연장 가능)", durationEn: "5 years (extendable)" },
      { code: "E-2", labelKo: "회화", labelEn: "Language Instruction", applicantKo: "외국어전문학원 등에서 회화지도에 근무하는 사람", applicantEn: "Persons working as language instructors at private institutes, etc.", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "E-3", labelKo: "연구", labelEn: "Research", applicantKo: "자연과학 또는 산업상 고도기술 분야의 연구원", applicantEn: "Researchers in natural science or advanced industrial technology", durationKo: "5년 (연장 가능)", durationEn: "5 years (extendable)" },
      { code: "E-4", labelKo: "기술지도", labelEn: "Technology Transfer", applicantKo: "산업상 특수한 분야 등에 속하는 기술을 보유한 사람", applicantEn: "Persons with specialized technical expertise", durationKo: "5년 (연장 가능)", durationEn: "5 years (extendable)" },
      { code: "E-5", labelKo: "전문직업", labelEn: "Professional", applicantKo: "법률, 회계, 의료 등 전문 분야에 근무하는 사람", applicantEn: "Persons working in law, accounting, medicine, and other professions", durationKo: "5년 (연장 가능)", durationEn: "5 years (extendable)" },
      { code: "E-6", labelKo: "예술흥행", labelEn: "Arts/Entertainment", applicantKo: "수익을 목적으로 예술활동, 연예, 운동경기 등 활동을 하는 사람", applicantEn: "Persons engaged in arts, entertainment, sports for income", durationKo: "2년 (연장 가능)", durationEn: "2 years (extendable)" },
      { code: "E-7", labelKo: "특정활동", labelEn: "Special Activities", applicantKo: "특정 분야에서 전문, 준전문, 일반기능, 숙련기능인력으로 근무하는 사람", applicantEn: "Persons working as skilled/semi-skilled/functional workers in designated fields", durationKo: "3년 (연장 가능)", durationEn: "3 years (extendable)" },
      { code: "E-8", labelKo: "계절근로", labelEn: "Seasonal Work", applicantKo: "농작물 재배·수확, 수산물 원시가공 분야에서 근무하는 사람", applicantEn: "Persons working in crop cultivation/harvest and primary fisheries processing", durationKo: "5개월 (연장 불가)", durationEn: "5 months (non-extendable)" },
      { code: "E-9", labelKo: "비전문취업", labelEn: "Non-professional Employment", applicantKo: "「외국인근로자의 고용 등에 관한 법률」에 따라 16개 송출국가 국민으로서 제조업 등 단순노무분야에서 근무하는 사람", applicantEn: "Nationals of designated sending countries working in simple labor sectors under EPS law", durationKo: "3년 (연장 가능)", durationEn: "3 years (extendable)" },
      { code: "E-10", labelKo: "선원취업", labelEn: "Crew Employment", applicantKo: "선원근로계약을 체결하여 내항선원 등으로 근무하는 사람", applicantEn: "Persons employed as crew under seafarer labor contracts", durationKo: "3년 (연장 가능)", durationEn: "3 years (extendable)" }
    ]
  },
  {
    key: "f",
    titleKo: "F계열",
    titleEn: "Category F",
    descKo: "가족동반, 거주, 동포, 영주, 결혼이민 자격으로 체류하는 사람",
    descEn: "People staying under family, residence, overseas Korean, permanent residence, or marriage migration status",
    accentClass: "text-[#3A63BD]",
      accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      { code: "F-1", labelKo: "방문동거", labelEn: "Visiting/Cohabitation", applicantKo: "친척방문, 가족 동거 등의 목적으로 체류하는 사람", applicantEn: "Persons staying for relative visits or family cohabitation", durationKo: "2년 (취업 불가)", durationEn: "2 years (employment not allowed)" },
      { code: "F-2", labelKo: "거주", labelEn: "Residence", applicantKo: "생활근거가 국내에 있는 장기체류자, 난민인정자 또는 일정요건을 갖춘 투자자", applicantEn: "Long-term residents, recognized refugees, or eligible investors with domestic living base", durationKo: "5년 (취업 일부 제한)", durationEn: "5 years (partially restricted employment)" },
      {
        code: "F-2-7",
        labelKo: "점수제 우수인재",
        labelEn: "Points-based Skilled Talent",
        applicantKo: "점수제 기준을 충족한 우수 외국인 인재",
        applicantEn: "Skilled foreign talent meeting points-based eligibility criteria",
        durationKo: "상세 체류기간은 심사·허가 조건에 따라 달라질 수 있음",
        durationEn: "Detailed stay period may vary by review and permit conditions"
      },
      {
        code: "F-2-R",
        labelKo: "지역특화형",
        labelEn: "Regional Specialized",
        applicantKo: "지역특화형 체류자격 요건을 충족한 외국인",
        applicantEn: "Foreign nationals meeting regional specialized stay requirements",
        durationKo: "상세 체류기간은 심사·허가 조건에 따라 달라질 수 있음",
        durationEn: "Detailed stay period may vary by review and permit conditions"
      },
      { code: "F-3", labelKo: "동반", labelEn: "Dependent", applicantKo: "문화예술(D-1)부터 특정활동(E-7) 자격자의 배우자 또는 미성년자녀", applicantEn: "Spouses or minor children of D-1 to E-7 status holders", durationKo: "동반기간 (취업 불가)", durationEn: "Dependent period (employment not allowed)" },
      { code: "F-4", labelKo: "재외동포", labelEn: "Overseas Korean", applicantKo: "「재외동포법」 제2조 2호에 해당하는 외국국적동포", applicantEn: "Overseas Koreans with foreign nationality under the Overseas Koreans Act", durationKo: "3년 (단순노무 불가)", durationEn: "3 years (simple labor not allowed)" },
      { code: "F-5", labelKo: "영주", labelEn: "Permanent Residence", applicantKo: "국내 영주할 목적으로 체류 중인 사람으로 국민에 준하는 대우를 받음", applicantEn: "Persons staying for permanent residence with treatment similar to nationals", durationKo: "영구 (취업제한 없음)", durationEn: "Permanent (no employment restrictions)" },
      { code: "F-6", labelKo: "결혼", labelEn: "Marriage Migration", applicantKo: "국민과 혼인한 사람", applicantEn: "Persons married to Korean nationals", durationKo: "3년 (취업제한 없음)", durationEn: "3 years (no employment restrictions)" }
    ]
  },
  {
    key: "etc",
    titleKo: "기타",
    titleEn: "Others",
    descKo: "협정에 의한 취업, 인도적 사유로 체류하는 사람",
    descEn: "People staying for agreement-based work or humanitarian reasons",
    accentClass: "text-[#D86A3B]",
      accentSoftClass: "bg-white/85",
    cardBgClass: "bg-white",
    items: [
      { code: "H-1", labelKo: "관광취업", labelEn: "Working Holiday", applicantKo: "관광취업(working holiday) 협정 등이 체결된 국가의 국민", applicantEn: "Nationals of countries with working holiday agreements", durationKo: "협정상 기간 (연장 불가)", durationEn: "Agreement-defined period (non-extendable)" },
      { code: "G-1", labelKo: "기타", labelEn: "Miscellaneous", applicantKo: "산재·질병치료, 난민신청자 등 인도적 고려가 필요한 사람", applicantEn: "Persons needing humanitarian consideration (injury/illness treatment, asylum seekers, etc.)", durationKo: "1년 (연장 가능)", durationEn: "1 year (extendable)" }
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
      accentClass: category.accentClass,
      accentSoftClass: category.accentSoftClass
    }))
  );
}

export function VisaResourcesPage() {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = (ko: string, en: string) => (isKo ? ko : en);
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
      const text = `${item.code} ${item.labelKo} ${item.labelEn} ${item.applicantKo} ${item.applicantEn}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [flattenedItems, query, typeTab]);

  return (
    <ResourceSubPageLayout
      titleKo="한국 비자 정보"
      titleEn="Korean Visa Information"
      descKo="공식 비자 안내 기준으로 코드, 신청대상, 체류기간을 보기 쉽게 정리해뒀어요."
      descEn="Based on official visa guidance, we organized visa code, applicant scope, and stay period."
      hideHero
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("모든 비자 유형", "All Visa Types")}</h2>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          {t(
            "아래에서 비자 코드를 검색하고, 카테고리별 카드로 한눈에 확인해보세요.",
            "Search visa codes below and review everything at a glance with category cards."
          )}
        </p>

        <div className="mt-4 rounded-2xl bg-slate-100 p-3">
          <label className="flex items-center gap-2 rounded-xl bg-white px-3 py-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("비자 코드 또는 키워드 검색 (예: D-2, 유학, 취업)", "Search by visa code or keyword (e.g. D-2, study, work)")}
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: "all", ko: "전체 비자", en: "All Visas" },
            { key: "work", ko: "취업 목적", en: "Work Purpose" },
            { key: "study", ko: "학업 목적", en: "Study Purpose" },
            { key: "residence", ko: "거주 목적", en: "Residence Purpose" },
            { key: "travel", ko: "여행/방문", en: "Travel / Visit" },
            { key: "other", ko: "기타 목적", en: "Other Purpose" }
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
                {isKo ? tab.ko : tab.en}
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
                  {item.code} ({isKo ? item.labelKo : item.labelEn})
                </p>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.accentClass} ${item.accentSoftClass}`}>
                  {isKo ? item.groupTitleKo : item.groupTitleEn}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 md:text-sm">
                <span className="font-semibold">{t("신청대상", "Applicants")}:</span> {isKo ? item.applicantKo : item.applicantEn}
              </p>
              <p className="text-xs text-slate-600 md:text-sm">
                <span className="font-semibold">{t("체류기간", "Stay period")}:</span> {isKo ? item.durationKo : item.durationEn}
              </p>
            </Link>
          ))}
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
              {t("검색 결과가 없어요. 다른 키워드로 다시 찾아보세요.", "No results found. Try another code or keyword.")}
            </div>
          ) : null}
        </div>
      </section>
    </ResourceSubPageLayout>
  );
}

// resume-maker i18n — ResumeBuilderEditorPage 네임스페이스.
// 사이트 i18n 방식(useLanguage 의 locale)에 맞춰, 컴포넌트별로 6개 언어 사전을
// 한 파일에 담고 훅으로 노출한다. locale 미일치 시 영어(기본)로 폴백.
import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  // 공통
  remove: string;
  add: string;
  close: string;
  loading: string;

  // 교육 구분/상태
  eduHighSchool: string;
  eduAssociate: string;
  eduBachelor: string;
  eduMaster: string;
  eduDoctor: string;
  eduBootcamp: string;
  eduCertificate: string;
  eduOther: string;
  statusEnrolled: string;
  statusGraduated: string;
  statusLeave: string;
  statusDropped: string;

  // 어학 수준
  langBasic: string;
  langConversational: string;
  langBusiness: string;
  langFluent: string;
  langNative: string;

  // 섹션 헤더
  hdrAllTitle: string;
  hdrAllDesc: string;
  hdrBasicTitle: string;
  hdrBasicDesc: string;
  hdrIntroTitle: string;
  hdrIntroDesc: string;
  hdrCoverLetterTitle: string;
  hdrCoverLetterDesc: string;
  clIntro: string;
  clCompanyLabel: string;
  clCompanyPlaceholder: string;
  clAddStandard: string;
  clAddCustom: string;
  clStandardPrompts: { label: string; prompt: string; example: string }[];
  clPromptPlaceholder: string;
  clAnswerPlaceholder: string;
  clDraft: string;
  clPolish: string;
  clGenerating: string;
  clTargetLabel: string;
  clCharUnit: string;
  clCharCount: (current: number, target: number) => string;
  clRemove: string;
  clEmpty: string;
  clNeedPrompt: string;
  clWriteForPolish: string;
  clDraftFailed: string;
  clNote: string;
  clA4Label: (n: number) => string;
  clPreviewLabel: string;
  clKeywordPlaceholder: string;
  clKeywordHint: string;
  clKeywordRemove: string;
  clPreviewTitle: string;
  clApply: string;
  clCancel: string;
  hdrEducationTitle: string;
  hdrEducationDesc: string;
  hdrAwardsTitle: string;
  hdrAwardsDesc: string;
  hdrSkillsTitle: string;
  hdrSkillsDesc: string;
  hdrLanguagesTitle: string;
  hdrLanguagesDesc: string;
  hdrLinksTitle: string;
  hdrLinksDesc: string;
  hdrDiagnosisTitle: string;
  hdrDiagnosisDesc: string;
  hdrDesignTitle: string;
  hdrDesignDesc: string;

  // 토스트/알림
  experienceFallback: string;
  writeMore: string;
  aiFilledCount: (n: number) => string;
  organizedConfirm: string;
  organizeFailed: string;
  loadResumeFailed: string;
  loadDiagnosisFailed: string;
  resumeTitleSaveFailed: string;

  // 메인 페이지
  fillWithAi: string;
  fillWithAiShort: string;
  preview: string;
  previewPdf: string;
  previewResume: string;

  // 섹션 제목 (전체 화면)
  sectionBasic: string;
  sectionIntro: string;
  sectionEducation: string;
  sectionAwards: string;
  sectionSkills: string;
  sectionLanguages: string;
  sectionLinks: string;

  // ContentTab (경험 문장)
  summaryHeading: string;
  selfIntroHeading: string;
  experienceSentences: string;
  experienceHint: string;
  noExperience: string;
  noPeriodWarning: string;
  rewriteFailed: string;
  aiRewrite: string;
  makeWithInterview: string;
  includeToggle: string;
  moveUp: string;
  moveDown: string;

  // BrainDump
  brainTitle: string;
  brainDesc: string;
  brainPlaceholder: string;
  organizing: string;

  // 입력 라벨/플레이스홀더 (공통 기본 정보)
  fieldName: string;
  fieldPhone: string;
  fieldEmail: string;
  fieldResidence: string;
  fieldDesiredRole: string;
  oneLineSummary: string;
  selfIntroPlaceholder: string;

  // BasicSection
  resumeName: string;
  resumeNameHint: string;
  resumeNamePlaceholder: string;
  imageOnly: string;
  imageMaxSize: string;
  imageLoadFailed: string;
  profilePhotoAlt: string;
  profilePhoto: string;
  changePhoto: string;
  uploadPhoto: string;
  showPhotoOnResume: string;
  isForeigner: string;
  desiredLocationPlaceholder: string;
  availableFromPlaceholder: string;
  nationalityPlaceholder: string;
  visaLabel: string;
  selectPlaceholder: string;

  // IntroSection
  writeSelfIntroFirst: string;
  polishFailed: string;
  writeSelfIntroForSummary: string;
  summaryFailed: string;
  selfIntroLongPlaceholder: string;
  polishWithAi: string;
  aiPolished: (style: string) => string;
  replaceWithThis: string;
  polishReplaced: string;
  tryOtherStyles: string;
  translateHint: string;
  oneLineSummaryHeading: string;
  aiRecommend: string;
  generating: string;
  summaryInputPlaceholder: string;
  aiRecommendedSummary: string;
  insert: string;
  summaryInserted: string;
  dontInsert: string;

  // EmptyAddCard
  emptyEducationTitle: string;
  emptyEducationDesc: string;
  emptyAwardsTitle: string;
  emptyAwardsDesc: string;
  emptySkillsTitle: string;
  emptyLanguagesTitle: string;
  emptyLanguagesDesc: string;
  emptyLinksTitle: string;
  emptyLinksDesc: string;

  // EducationSection
  eduRowLabel: (n: number) => string;
  schoolNamePlaceholder: string;
  eduTypeLabel: string;
  eduStatusLabel: string;
  majorPlaceholder: string;
  admission: string;
  admissionMonth: string;
  graduation: string;
  graduationMonth: string;
  currentlyEnrolled: string;

  // AwardsSection
  awardRowLabel: (n: number) => string;
  awardNamePlaceholder: string;
  awardIssuerPlaceholder: string;
  awardDateLabel: string;
  awardDateOptional: string;
  awardDateAria: string;

  // SkillsSection
  skillPlaceholder: string;
  aiSkillRecommend: string;
  recommending: string;
  noNewSkills: string;
  skillRecommendFailed: string;

  // LanguagesSection
  langRowLabel: (n: number) => string;
  languagePlaceholder: string;
  levelLabel: string;

  // LinksSection
  linkRowLabel: (n: number) => string;
  linkLabelPlaceholder: string;
  linkUrlPlaceholder: string;

  // DesignTab
  sectionOrder: string;
  sectionOrderHint: string;
  emptySectionHint: string;
  layout: string;
  accentColor: string;
  colorAria: (c: string) => string;
  pickCustom: string;
  accentColorAria: string;
  titleMarker: string;
  fontSize: string;
  lineSpacing: string;
  sectionGap: string;
  small: string;
  normal: string;
  large: string;
  narrow: string;
  wide: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    remove: "삭제",
    add: "추가",
    close: "닫기",
    loading: "불러오는 중...",

    eduHighSchool: "고등학교",
    eduAssociate: "전문학사",
    eduBachelor: "학사 (대학교)",
    eduMaster: "석사 (대학원)",
    eduDoctor: "박사 (대학원)",
    eduBootcamp: "부트캠프",
    eduCertificate: "교육과정",
    eduOther: "기타",
    statusEnrolled: "재학 중",
    statusGraduated: "졸업",
    statusLeave: "휴학",
    statusDropped: "중퇴",

    langBasic: "기초",
    langConversational: "일상 회화",
    langBusiness: "비즈니스",
    langFluent: "유창",
    langNative: "원어민",

    hdrAllTitle: "전체 입력",
    hdrAllDesc: "생각나는 항목부터 자유롭게 채워보세요. 한 화면에 다 펼쳐져 있어요.",
    hdrBasicTitle: "기본 정보",
    hdrBasicDesc: "이력서 상단에 표시되는 정보예요.",
    hdrIntroTitle: "자기소개",
    hdrIntroDesc: "자기소개를 쓰고 AI로 다듬어 보세요.",
    hdrCoverLetterTitle: "자기소개서",
    hdrCoverLetterDesc: "한국형 자기소개서를 문항별로 작성해요. AI가 이력서 정보로 초안을 써 드려요.",
    clIntro: "지원 동기·성장 과정처럼 한국 기업이 자주 묻는 문항에 답하는 형식이에요. 표준 문항을 고르거나 직접 문항을 넣어 보세요.",
    clCompanyLabel: "지원 회사 (선택)",
    clCompanyPlaceholder: "예: (주)아플라이",
    clAddStandard: "표준 문항",
    clAddCustom: "직접 문항 추가",
    clStandardPrompts: [
      { label: "지원 동기", prompt: "지원 동기", example: "예: 어릴 때부터 이 분야 제품을 즐겨 써서 관심이 생김" },
      { label: "성장 과정", prompt: "성장 과정", example: "예: 작은 가게를 하신 부모님을 보며 책임감을 배움" },
      { label: "성격의 장단점", prompt: "성격의 장단점", example: "예: 꼼꼼하지만 완벽을 추구해 시간이 걸릴 때가 있음" },
      { label: "직무 역량·경험", prompt: "직무 역량·경험", example: "예: 학과 프로젝트에서 데이터 분석·발표를 맡음" },
      { label: "입사 후 포부", prompt: "입사 후 포부", example: "예: 3년 내 이 분야 전문가로 성장하고 싶음" }
    ],
    clPromptPlaceholder: "문항을 입력하세요 (예: 지원 동기)",
    clAnswerPlaceholder: "답변을 직접 쓰거나 'AI 초안 작성'을 눌러 보세요.",
    clDraft: "AI 초안 작성",
    clPolish: "AI 다듬기",
    clGenerating: "작성 중…",
    clTargetLabel: "목표 글자 수",
    clCharUnit: "자",
    clCharCount: (current, target) => `현재 ${current}자 / 목표 ${target}자`,
    clRemove: "문항 삭제",
    clEmpty: "아직 자소서 문항이 없어요. 표준 문항을 추가하거나 직접 문항을 입력해 보세요.",
    clNeedPrompt: "문항을 먼저 입력해 주세요.",
    clWriteForPolish: "다듬을 답변을 먼저 작성해 주세요.",
    clDraftFailed: "작성에 실패했어요. 잠시 후 다시 시도해 주세요.",
    clNote: "자소서는 이력서와 별도로 저장돼요. 이력서 PDF에는 포함되지 않습니다.",
    clA4Label: (n) => `A4 · ${n}페이지`,
    clPreviewLabel: "자기소개서 미리보기",
    clKeywordPlaceholder: "예: 답변에 녹일 나만의 소재 (한 줄에 하나)",
    clKeywordHint: "지원 동기·계기로 녹일 소재를 적어 주세요. 형식을 고르면 이야기로 풀어 반영해요 (선택)",
    clKeywordRemove: "키워드 삭제",
    clPreviewTitle: "AI 제안 — 적용할까요?",
    clApply: "변경하기",
    clCancel: "취소",
    hdrEducationTitle: "학력",
    hdrEducationDesc: "학교·전공·기간을 입력해요.",
    hdrAwardsTitle: "자격 · 수상",
    hdrAwardsDesc: "자격증·수상 이력을 입력해요.",
    hdrSkillsTitle: "스킬",
    hdrSkillsDesc: "기술·툴·역량을 키워드로 추가해요.",
    hdrLanguagesTitle: "어학",
    hdrLanguagesDesc: "구사 가능한 언어와 수준을 추가해요.",
    hdrLinksTitle: "링크",
    hdrLinksDesc: "포트폴리오·GitHub 등 링크를 추가해요.",
    hdrDiagnosisTitle: "진단",
    hdrDiagnosisDesc: "이력서 완성도를 점검해요.",
    hdrDesignTitle: "디자인",
    hdrDesignDesc: "레이아웃·색상·간격을 조정해요.",

    experienceFallback: "경험",
    writeMore: "조금만 더 적어주세요.",
    aiFilledCount: (n) => `AI가 ${n}개 항목을 채웠어요! 내용을 확인해 주세요.`,
    organizedConfirm: "정리했어요. 내용을 확인해 주세요.",
    organizeFailed: "정리에 실패했어요. 잠시 후 다시 시도해 주세요.",
    loadResumeFailed: "이력서를 불러오지 못했어요.",
    loadDiagnosisFailed: "진단을 불러오지 못했어요.",
    resumeTitleSaveFailed: "이력서 이름 저장에 실패했어요.",

    fillWithAi: "이 항목을 AI와 대화하며 채우기",
    fillWithAiShort: "AI로 채우기",
    preview: "미리보기",
    previewPdf: "미리보기·PDF",
    previewResume: "이력서 미리보기",

    sectionBasic: "기본 정보",
    sectionIntro: "자기소개",
    sectionEducation: "학력",
    sectionAwards: "자격 · 수상",
    sectionSkills: "스킬",
    sectionLanguages: "어학",
    sectionLinks: "링크",

    summaryHeading: "요약",
    selfIntroHeading: "자기소개",
    experienceSentences: "경험 문장",
    experienceHint: "포함할 경험을 켜고, 문장을 다듬어 보세요.",
    noExperience: "아직 경험이 없어요.",
    noPeriodWarning: "기간 미입력 — 이력서에 포함되지 않아요. ‘경험’에서 기간을 입력해 주세요.",
    rewriteFailed: "다시 쓰지 못했어요.",
    aiRewrite: "AI 다시 쓰기",
    makeWithInterview: "AI 인터뷰로 문장 만들기",
    includeToggle: "포함 토글",
    moveUp: "위로",
    moveDown: "아래로",

    brainTitle: "생각나는 대로 적으면 AI가 알아서 채워요",
    brainDesc: "학교·전공·회사·한 일·스킬·어학 등 떠오르는 대로 막 적어보세요. 외국어로 적어도 돼요.",
    brainPlaceholder:
      "예: OO대학교 컴퓨터공학 졸업, 마케팅 인턴 6개월 SNS 운영하며 팔로워 2배, React 조금, 토익 800, 포트폴리오 github.com/...",
    organizing: "정리 중…",

    fieldName: "이름",
    fieldPhone: "휴대폰",
    fieldEmail: "이메일",
    fieldResidence: "거주지",
    fieldDesiredRole: "희망 직무",
    oneLineSummary: "한 줄 요약",
    selfIntroPlaceholder: "자기소개를 입력하세요.",

    resumeName: "이력서 이름",
    resumeNameHint: "(목록·파일명용)",
    resumeNamePlaceholder: "예: 마케팅 신입 이력서",
    imageOnly: "이미지 파일만 올릴 수 있어요.",
    imageMaxSize: "8MB 이하 이미지를 올려주세요.",
    imageLoadFailed: "이미지를 불러오지 못했어요.",
    profilePhotoAlt: "프로필 사진",
    profilePhoto: "프로필 사진",
    changePhoto: "사진 변경",
    uploadPhoto: "사진 업로드",
    showPhotoOnResume: "이력서에 사진 표시",
    isForeigner: "외국인이에요 (국적·비자 입력)",
    desiredLocationPlaceholder: "희망 근무지 (예: 서울)",
    availableFromPlaceholder: "근무 가능 시점 (예: 즉시, 2026-03)",
    nationalityPlaceholder: "국적 (예: 베트남)",
    visaLabel: "비자",
    selectPlaceholder: "선택",

    writeSelfIntroFirst: "먼저 자기소개를 어느 정도 작성해 주세요.",
    polishFailed: "다듬기에 실패했어요.",
    writeSelfIntroForSummary: "자기소개를 먼저 작성하면 한 줄 요약을 뽑아드려요.",
    summaryFailed: "요약 생성에 실패했어요.",
    selfIntroLongPlaceholder: "자기소개를 입력하세요. 작성 후 아래에서 형식을 골라 AI로 다듬어 볼 수 있어요.",
    polishWithAi: "AI로 다듬기 — 형식을 골라 시도해 보세요",
    aiPolished: (style) => `AI가 다듬은 자기소개 · ${style}`,
    replaceWithThis: "이 내용으로 교체",
    polishReplaced: "다듬은 내용으로 바꿨어요.",
    tryOtherStyles: "다른 형식도 위 버튼으로 더 시도해 볼 수 있어요.",
    translateHint: "미리보기·PDF 화면에서 이력서 전체를 한국어·영어로 번역해 볼 수 있어요.",
    oneLineSummaryHeading: "한 줄 요약",
    aiRecommend: "자기소개로 AI 추천",
    generating: "생성 중…",
    summaryInputPlaceholder: "한 줄 요약 (직접 입력하거나 AI 추천을 받아보세요)",
    aiRecommendedSummary: "AI 추천 한 줄 요약",
    insert: "넣기",
    summaryInserted: "한 줄 요약에 넣었어요.",
    dontInsert: "안 넣을래요",

    emptyEducationTitle: "첫 학력을 추가해 볼까요?",
    emptyEducationDesc: "학교·전공·기간을 입력해 학력을 더해요.",
    emptyAwardsTitle: "첫 자격·수상을 추가해 볼까요?",
    emptyAwardsDesc: "자격증·수상 이력을 추가해요.",
    emptySkillsTitle: "첫 스킬을 추가해 볼까요?",
    emptyLanguagesTitle: "첫 어학을 추가해 볼까요?",
    emptyLanguagesDesc: "구사 가능한 언어와 수준을 추가해요.",
    emptyLinksTitle: "첫 링크를 추가해 볼까요?",
    emptyLinksDesc: "포트폴리오·GitHub 등 링크를 추가해요.",

    eduRowLabel: (n) => `학력 ${n}`,
    schoolNamePlaceholder: "학교명 (예: OO대학교)",
    eduTypeLabel: "구분",
    eduStatusLabel: "상태",
    majorPlaceholder: "전공 (예: 컴퓨터공학)",
    admission: "입학",
    admissionMonth: "입학 월",
    graduation: "졸업",
    graduationMonth: "졸업 월",
    currentlyEnrolled: "재학 중",

    awardRowLabel: (n) => `항목 ${n}`,
    awardNamePlaceholder: "자격증 · 수상명 (예: 정보처리기사, OO공모전 대상)",
    awardIssuerPlaceholder: "발급처 · 주최 (예: 한국산업인력공단)",
    awardDateLabel: "취득 · 수상 시기",
    awardDateOptional: "(선택)",
    awardDateAria: "취득·수상 시기",

    skillPlaceholder: "예: React, Figma (입력 후 Enter)",
    aiSkillRecommend: "AI 스킬 추천",
    recommending: "추천 중…",
    noNewSkills: "추천할 새 스킬을 찾지 못했어요.",
    skillRecommendFailed: "스킬 추천에 실패했어요.",

    langRowLabel: (n) => `어학 ${n}`,
    languagePlaceholder: "언어 (예: 영어, 일본어)",
    levelLabel: "수준",

    linkRowLabel: (n) => `링크 ${n}`,
    linkLabelPlaceholder: "이름 (예: 포트폴리오, GitHub)",
    linkUrlPlaceholder: "https://...",

    sectionOrder: "섹션 순서",
    sectionOrderHint: "(드래그하거나 화살표로 바꿔요)",
    emptySectionHint: "비어 있는 섹션은 이력서에 표시되지 않아요 — 순서만 정해두면 돼요.",
    layout: "레이아웃",
    accentColor: "포인트 컬러",
    colorAria: (c) => `색상 ${c}`,
    pickCustom: "직접 선택",
    accentColorAria: "포인트 컬러 직접 선택",
    titleMarker: "섹션 제목 마커",
    fontSize: "글자 크기",
    lineSpacing: "줄 간격",
    sectionGap: "섹션 간격",
    small: "작게",
    normal: "보통",
    large: "크게",
    narrow: "좁게",
    wide: "넓게"
  },

  en: {
    remove: "Remove",
    add: "Add",
    close: "Close",
    loading: "Loading...",

    eduHighSchool: "High school",
    eduAssociate: "Associate degree",
    eduBachelor: "Bachelor's (university)",
    eduMaster: "Master's (graduate school)",
    eduDoctor: "Doctorate (graduate school)",
    eduBootcamp: "Bootcamp",
    eduCertificate: "Training program",
    eduOther: "Other",
    statusEnrolled: "Enrolled",
    statusGraduated: "Graduated",
    statusLeave: "On leave",
    statusDropped: "Dropped out",

    langBasic: "Basic",
    langConversational: "Conversational",
    langBusiness: "Business",
    langFluent: "Fluent",
    langNative: "Native",

    hdrAllTitle: "All fields",
    hdrAllDesc: "Start with whatever comes to mind. Everything is on one screen.",
    hdrBasicTitle: "Basic info",
    hdrBasicDesc: "Information shown at the top of your resume.",
    hdrIntroTitle: "Self-introduction",
    hdrIntroDesc: "Write your introduction and polish it with AI.",
    hdrCoverLetterTitle: "Cover letter",
    hdrCoverLetterDesc: "Write a Korean-style cover letter by prompt. AI drafts from your resume.",
    clIntro: "Korean companies often ask set questions like motivation and background. Pick a standard prompt or add your own.",
    clCompanyLabel: "Company (optional)",
    clCompanyPlaceholder: "e.g. Aply Inc.",
    clAddStandard: "Standard prompts",
    clAddCustom: "Add custom prompt",
    clStandardPrompts: [
      { label: "Motivation", prompt: "Motivation", example: "e.g. I've used this field's products since childhood" },
      { label: "Background", prompt: "Background", example: "e.g. Watching my parents run a small shop taught me responsibility" },
      { label: "Strengths & weaknesses", prompt: "Strengths & weaknesses", example: "e.g. Detail-oriented, but can be slow chasing perfection" },
      { label: "Job competency", prompt: "Job competency", example: "e.g. Led data analysis and the presentation in a class project" },
      { label: "Goals after joining", prompt: "Goals after joining", example: "e.g. Become an expert in this field within 3 years" }
    ],
    clPromptPlaceholder: "Enter a prompt (e.g. Motivation)",
    clAnswerPlaceholder: "Write your answer, or tap 'AI draft'.",
    clDraft: "AI draft",
    clPolish: "AI polish",
    clGenerating: "Writing…",
    clTargetLabel: "Target length",
    clCharUnit: " chars",
    clCharCount: (current, target) => `${current} / ${target} chars`,
    clRemove: "Remove prompt",
    clEmpty: "No cover-letter prompts yet. Add a standard prompt or enter your own.",
    clNeedPrompt: "Enter a prompt first.",
    clWriteForPolish: "Write an answer to polish first.",
    clDraftFailed: "Couldn't write it. Please try again.",
    clNote: "The cover letter is saved separately and is not included in the resume PDF.",
    clA4Label: (n) => `A4 · ${n} page${n > 1 ? "s" : ""}`,
    clPreviewLabel: "Cover letter preview",
    clKeywordPlaceholder: "e.g. your own material to weave in (one per line)",
    clKeywordHint: "Add personal material; pick a style and AI develops it into your motivation story (optional)",
    clKeywordRemove: "Remove keyword",
    clPreviewTitle: "AI suggestion — apply it?",
    clApply: "Apply",
    clCancel: "Cancel",
    hdrEducationTitle: "Education",
    hdrEducationDesc: "Enter your school, major, and dates.",
    hdrAwardsTitle: "Certifications · Awards",
    hdrAwardsDesc: "Enter your certifications and awards.",
    hdrSkillsTitle: "Skills",
    hdrSkillsDesc: "Add skills, tools, and strengths as keywords.",
    hdrLanguagesTitle: "Languages",
    hdrLanguagesDesc: "Add languages you speak and your level.",
    hdrLinksTitle: "Links",
    hdrLinksDesc: "Add links such as portfolio or GitHub.",
    hdrDiagnosisTitle: "Diagnosis",
    hdrDiagnosisDesc: "Check how complete your resume is.",
    hdrDesignTitle: "Design",
    hdrDesignDesc: "Adjust layout, colors, and spacing.",

    experienceFallback: "Experience",
    writeMore: "Please write a little more.",
    aiFilledCount: (n) => `AI filled in ${n} item${n === 1 ? "" : "s"}! Please review the content.`,
    organizedConfirm: "All organized. Please review the content.",
    organizeFailed: "Failed to organize. Please try again in a moment.",
    loadResumeFailed: "Couldn't load the resume.",
    loadDiagnosisFailed: "Couldn't load the diagnosis.",
    resumeTitleSaveFailed: "Failed to save the resume name.",

    fillWithAi: "Fill this section by chatting with AI",
    fillWithAiShort: "Fill with AI",
    preview: "Preview",
    previewPdf: "Preview · PDF",
    previewResume: "Preview resume",

    sectionBasic: "Basic info",
    sectionIntro: "Self-introduction",
    sectionEducation: "Education",
    sectionAwards: "Certifications · Awards",
    sectionSkills: "Skills",
    sectionLanguages: "Languages",
    sectionLinks: "Links",

    summaryHeading: "Summary",
    selfIntroHeading: "Self-introduction",
    experienceSentences: "Experience bullets",
    experienceHint: "Turn on the experiences to include, then refine the sentences.",
    noExperience: "No experience yet.",
    noPeriodWarning: "No dates entered — this won't be included in the resume. Please enter the dates under 'Experience'.",
    rewriteFailed: "Couldn't rewrite it.",
    aiRewrite: "Rewrite with AI",
    makeWithInterview: "Create bullets with AI interview",
    includeToggle: "Toggle inclusion",
    moveUp: "Move up",
    moveDown: "Move down",

    brainTitle: "Just jot it all down and AI will fill it in for you",
    brainDesc: "Write down whatever comes to mind — school, major, company, what you did, skills, languages. You can write in any language.",
    brainPlaceholder:
      "e.g. Graduated in Computer Science from OO University, 6-month marketing internship running social media and doubling followers, a bit of React, TOEIC 800, portfolio github.com/...",
    organizing: "Organizing…",

    fieldName: "Name",
    fieldPhone: "Phone",
    fieldEmail: "Email",
    fieldResidence: "Place of residence",
    fieldDesiredRole: "Desired role",
    oneLineSummary: "One-line summary",
    selfIntroPlaceholder: "Enter your self-introduction.",

    resumeName: "Resume name",
    resumeNameHint: "(for the list and file name)",
    resumeNamePlaceholder: "e.g. Marketing entry-level resume",
    imageOnly: "Only image files can be uploaded.",
    imageMaxSize: "Please upload an image 8MB or smaller.",
    imageLoadFailed: "Couldn't load the image.",
    profilePhotoAlt: "Profile photo",
    profilePhoto: "Profile photo",
    changePhoto: "Change photo",
    uploadPhoto: "Upload photo",
    showPhotoOnResume: "Show photo on resume",
    isForeigner: "I'm a foreigner (enter nationality · visa)",
    desiredLocationPlaceholder: "Preferred work location (e.g. Seoul)",
    availableFromPlaceholder: "Available from (e.g. Immediately, 2026-03)",
    nationalityPlaceholder: "Nationality (e.g. Vietnam)",
    visaLabel: "Visa",
    selectPlaceholder: "Select",

    writeSelfIntroFirst: "Please write at least some of your introduction first.",
    polishFailed: "Failed to polish.",
    writeSelfIntroForSummary: "Write your introduction first and we'll create a one-line summary for you.",
    summaryFailed: "Failed to generate the summary.",
    selfIntroLongPlaceholder: "Enter your self-introduction. After writing, you can choose a style below and polish it with AI.",
    polishWithAi: "Polish with AI — pick a style and try it",
    aiPolished: (style) => `AI-polished introduction · ${style}`,
    replaceWithThis: "Replace with this",
    polishReplaced: "Replaced with the polished version.",
    tryOtherStyles: "You can try other styles with the buttons above.",
    translateHint: "On the Preview · PDF screen you can translate the whole resume into Korean and English.",
    oneLineSummaryHeading: "One-line summary",
    aiRecommend: "AI suggestion from intro",
    generating: "Generating…",
    summaryInputPlaceholder: "One-line summary (type it yourself or get an AI suggestion)",
    aiRecommendedSummary: "AI-suggested one-line summary",
    insert: "Insert",
    summaryInserted: "Added to the one-line summary.",
    dontInsert: "Skip it",

    emptyEducationTitle: "Add your first education?",
    emptyEducationDesc: "Enter your school, major, and dates to add education.",
    emptyAwardsTitle: "Add your first certification or award?",
    emptyAwardsDesc: "Add your certifications and awards.",
    emptySkillsTitle: "Add your first skill?",
    emptyLanguagesTitle: "Add your first language?",
    emptyLanguagesDesc: "Add a language you speak and your level.",
    emptyLinksTitle: "Add your first link?",
    emptyLinksDesc: "Add links such as portfolio or GitHub.",

    eduRowLabel: (n) => `Education ${n}`,
    schoolNamePlaceholder: "School name (e.g. OO University)",
    eduTypeLabel: "Type",
    eduStatusLabel: "Status",
    majorPlaceholder: "Major (e.g. Computer Science)",
    admission: "Start",
    admissionMonth: "Start month",
    graduation: "End",
    graduationMonth: "End month",
    currentlyEnrolled: "Enrolled",

    awardRowLabel: (n) => `Item ${n}`,
    awardNamePlaceholder: "Certification · award name (e.g. Engineer Information Processing, Grand Prize)",
    awardIssuerPlaceholder: "Issuer · organizer (e.g. Human Resources Development Service of Korea)",
    awardDateLabel: "Date obtained · awarded",
    awardDateOptional: "(optional)",
    awardDateAria: "Date obtained · awarded",

    skillPlaceholder: "e.g. React, Figma (press Enter)",
    aiSkillRecommend: "AI skill suggestions",
    recommending: "Suggesting…",
    noNewSkills: "Couldn't find any new skills to suggest.",
    skillRecommendFailed: "Failed to suggest skills.",

    langRowLabel: (n) => `Language ${n}`,
    languagePlaceholder: "Language (e.g. English, Japanese)",
    levelLabel: "Level",

    linkRowLabel: (n) => `Link ${n}`,
    linkLabelPlaceholder: "Name (e.g. Portfolio, GitHub)",
    linkUrlPlaceholder: "https://...",

    sectionOrder: "Section order",
    sectionOrderHint: "(drag or use the arrows to change)",
    emptySectionHint: "Empty sections won't appear on the resume — just set the order.",
    layout: "Layout",
    accentColor: "Accent color",
    colorAria: (c) => `Color ${c}`,
    pickCustom: "Pick your own",
    accentColorAria: "Pick custom accent color",
    titleMarker: "Section title marker",
    fontSize: "Font size",
    lineSpacing: "Line spacing",
    sectionGap: "Section spacing",
    small: "Small",
    normal: "Normal",
    large: "Large",
    narrow: "Narrow",
    wide: "Wide"
  },

  "zh-CN": {
    remove: "删除",
    add: "添加",
    close: "关闭",
    loading: "加载中...",

    eduHighSchool: "高中",
    eduAssociate: "专科",
    eduBachelor: "本科（大学）",
    eduMaster: "硕士（研究生）",
    eduDoctor: "博士（研究生）",
    eduBootcamp: "训练营",
    eduCertificate: "培训课程",
    eduOther: "其他",
    statusEnrolled: "在读",
    statusGraduated: "毕业",
    statusLeave: "休学",
    statusDropped: "退学",

    langBasic: "入门",
    langConversational: "日常会话",
    langBusiness: "商务",
    langFluent: "流利",
    langNative: "母语",

    hdrAllTitle: "全部填写",
    hdrAllDesc: "想到哪项就先填哪项，所有内容都在一个页面上。",
    hdrBasicTitle: "基本信息",
    hdrBasicDesc: "显示在简历顶部的信息。",
    hdrIntroTitle: "自我介绍",
    hdrIntroDesc: "写好自我介绍并用 AI 润色。",
    hdrCoverLetterTitle: "自荐信",
    hdrCoverLetterDesc: "按题目撰写韩式自荐信。AI 会根据简历信息生成初稿。",
    clIntro: "这是回答韩国企业常问题目（如应聘动机、成长经历）的形式。可选择标准题目或自行输入。",
    clCompanyLabel: "应聘公司（可选）",
    clCompanyPlaceholder: "例：Aply 公司",
    clAddStandard: "标准题目",
    clAddCustom: "添加自定义题目",
    clStandardPrompts: [
      { label: "应聘动机", prompt: "应聘动机", example: "例：从小就爱用这个领域的产品，因此产生兴趣" },
      { label: "成长经历", prompt: "成长经历", example: "例：看着经营小店的父母，学会了责任感" },
      { label: "性格优缺点", prompt: "性格优缺点", example: "例：做事细心，但追求完美时会花较多时间" },
      { label: "职务能力·经验", prompt: "职务能力·经验", example: "例：在课程项目中负责数据分析和展示" },
      { label: "入职后的抱负", prompt: "入职后的抱负", example: "例：希望三年内成长为该领域的专家" }
    ],
    clPromptPlaceholder: "输入题目（例：应聘动机）",
    clAnswerPlaceholder: "可自行填写，或点击“AI 初稿”。",
    clDraft: "AI 初稿",
    clPolish: "AI 润色",
    clGenerating: "撰写中…",
    clTargetLabel: "目标字数",
    clCharUnit: "字",
    clCharCount: (current, target) => `当前 ${current} 字 / 目标 ${target} 字`,
    clRemove: "删除题目",
    clEmpty: "还没有自荐信题目。请添加标准题目或自行输入。",
    clNeedPrompt: "请先输入题目。",
    clWriteForPolish: "请先填写要润色的内容。",
    clDraftFailed: "生成失败，请稍后再试。",
    clNote: "自荐信将与简历分开保存，不会包含在简历 PDF 中。",
    clA4Label: (n) => `A4 · ${n}页`,
    clPreviewLabel: "自荐信预览",
    clKeywordPlaceholder: "例：可融入答案的个人素材（每行一条）",
    clKeywordHint: "写下可作为动机·契机的素材，选择形式后 AI 会展开成故事（可选）",
    clKeywordRemove: "删除关键词",
    clPreviewTitle: "AI 建议 — 要应用吗？",
    clApply: "应用",
    clCancel: "取消",
    hdrEducationTitle: "学历",
    hdrEducationDesc: "填写学校、专业和时间。",
    hdrAwardsTitle: "证书 · 获奖",
    hdrAwardsDesc: "填写证书和获奖经历。",
    hdrSkillsTitle: "技能",
    hdrSkillsDesc: "以关键词形式添加技术、工具和能力。",
    hdrLanguagesTitle: "语言",
    hdrLanguagesDesc: "添加你会的语言及水平。",
    hdrLinksTitle: "链接",
    hdrLinksDesc: "添加作品集、GitHub 等链接。",
    hdrDiagnosisTitle: "诊断",
    hdrDiagnosisDesc: "检查简历的完成度。",
    hdrDesignTitle: "设计",
    hdrDesignDesc: "调整版式、颜色和间距。",

    experienceFallback: "经历",
    writeMore: "请再多写一点。",
    aiFilledCount: (n) => `AI 已填写 ${n} 个项目！请确认内容。`,
    organizedConfirm: "已整理好，请确认内容。",
    organizeFailed: "整理失败，请稍后再试。",
    loadResumeFailed: "无法加载简历。",
    loadDiagnosisFailed: "无法加载诊断。",
    resumeTitleSaveFailed: "保存简历名称失败。",

    fillWithAi: "与 AI 对话来填写此项",
    fillWithAiShort: "用 AI 填写",
    preview: "预览",
    previewPdf: "预览 · PDF",
    previewResume: "预览简历",

    sectionBasic: "基本信息",
    sectionIntro: "自我介绍",
    sectionEducation: "学历",
    sectionAwards: "证书 · 获奖",
    sectionSkills: "技能",
    sectionLanguages: "语言",
    sectionLinks: "链接",

    summaryHeading: "摘要",
    selfIntroHeading: "自我介绍",
    experienceSentences: "经历句子",
    experienceHint: "打开要包含的经历，并润色句子。",
    noExperience: "还没有经历。",
    noPeriodWarning: "未填写时间 — 不会包含在简历中。请在「经历」中填写时间。",
    rewriteFailed: "无法重写。",
    aiRewrite: "AI 重写",
    makeWithInterview: "通过 AI 访谈生成句子",
    includeToggle: "包含开关",
    moveUp: "上移",
    moveDown: "下移",

    brainTitle: "随便写下来，AI 会自动帮你填写",
    brainDesc: "学校、专业、公司、做过的事、技能、语言等，想到什么就随便写。用外语写也可以。",
    brainPlaceholder:
      "例：OO 大学计算机科学毕业，市场营销实习 6 个月运营社交媒体使粉丝翻倍，会一点 React，托业 800，作品集 github.com/...",
    organizing: "整理中…",

    fieldName: "姓名",
    fieldPhone: "手机",
    fieldEmail: "邮箱",
    fieldResidence: "居住地",
    fieldDesiredRole: "期望职位",
    oneLineSummary: "一句话摘要",
    selfIntroPlaceholder: "请输入自我介绍。",

    resumeName: "简历名称",
    resumeNameHint: "（用于列表和文件名）",
    resumeNamePlaceholder: "例：市场营销应届简历",
    imageOnly: "只能上传图片文件。",
    imageMaxSize: "请上传 8MB 以下的图片。",
    imageLoadFailed: "无法加载图片。",
    profilePhotoAlt: "证件照",
    profilePhoto: "证件照",
    changePhoto: "更换照片",
    uploadPhoto: "上传照片",
    showPhotoOnResume: "在简历上显示照片",
    isForeigner: "我是外国人（填写国籍 · 签证）",
    desiredLocationPlaceholder: "期望工作地点（例：首尔）",
    availableFromPlaceholder: "可入职时间（例：随时、2026-03）",
    nationalityPlaceholder: "国籍（例：越南）",
    visaLabel: "签证",
    selectPlaceholder: "请选择",

    writeSelfIntroFirst: "请先写一些自我介绍。",
    polishFailed: "润色失败。",
    writeSelfIntroForSummary: "先写好自我介绍，我们会帮你生成一句话摘要。",
    summaryFailed: "生成摘要失败。",
    selfIntroLongPlaceholder: "请输入自我介绍。写好后可在下方选择形式并用 AI 润色。",
    polishWithAi: "用 AI 润色 — 选择一种形式试试",
    aiPolished: (style) => `AI 润色后的自我介绍 · ${style}`,
    replaceWithThis: "替换为此内容",
    polishReplaced: "已替换为润色后的内容。",
    tryOtherStyles: "你也可以用上方按钮尝试其他形式。",
    translateHint: "在预览 · PDF 页面可将整份简历翻译成韩语和英语。",
    oneLineSummaryHeading: "一句话摘要",
    aiRecommend: "根据自我介绍 AI 推荐",
    generating: "生成中…",
    summaryInputPlaceholder: "一句话摘要（可自己输入或获取 AI 推荐）",
    aiRecommendedSummary: "AI 推荐的一句话摘要",
    insert: "采用",
    summaryInserted: "已放入一句话摘要。",
    dontInsert: "暂不采用",

    emptyEducationTitle: "添加第一条学历？",
    emptyEducationDesc: "填写学校、专业和时间来添加学历。",
    emptyAwardsTitle: "添加第一条证书 · 获奖？",
    emptyAwardsDesc: "添加证书和获奖经历。",
    emptySkillsTitle: "添加第一个技能？",
    emptyLanguagesTitle: "添加第一门语言？",
    emptyLanguagesDesc: "添加你会的语言及水平。",
    emptyLinksTitle: "添加第一个链接？",
    emptyLinksDesc: "添加作品集、GitHub 等链接。",

    eduRowLabel: (n) => `学历 ${n}`,
    schoolNamePlaceholder: "学校名称（例：OO 大学）",
    eduTypeLabel: "类别",
    eduStatusLabel: "状态",
    majorPlaceholder: "专业（例：计算机科学）",
    admission: "入学",
    admissionMonth: "入学月份",
    graduation: "毕业",
    graduationMonth: "毕业月份",
    currentlyEnrolled: "在读",

    awardRowLabel: (n) => `项目 ${n}`,
    awardNamePlaceholder: "证书 · 获奖名称（例：信息处理工程师、OO 大赛大奖）",
    awardIssuerPlaceholder: "颁发机构 · 主办方（例：韩国产业人力公团）",
    awardDateLabel: "取得 · 获奖时间",
    awardDateOptional: "（选填）",
    awardDateAria: "取得 · 获奖时间",

    skillPlaceholder: "例：React、Figma（输入后按 Enter）",
    aiSkillRecommend: "AI 技能推荐",
    recommending: "推荐中…",
    noNewSkills: "没有找到可推荐的新技能。",
    skillRecommendFailed: "技能推荐失败。",

    langRowLabel: (n) => `语言 ${n}`,
    languagePlaceholder: "语言（例：英语、日语）",
    levelLabel: "水平",

    linkRowLabel: (n) => `链接 ${n}`,
    linkLabelPlaceholder: "名称（例：作品集、GitHub）",
    linkUrlPlaceholder: "https://...",

    sectionOrder: "板块顺序",
    sectionOrderHint: "（拖动或用箭头调整）",
    emptySectionHint: "空白板块不会显示在简历上 — 只需设定好顺序即可。",
    layout: "版式",
    accentColor: "强调色",
    colorAria: (c) => `颜色 ${c}`,
    pickCustom: "自定义",
    accentColorAria: "自定义强调色",
    titleMarker: "板块标题标记",
    fontSize: "字号",
    lineSpacing: "行距",
    sectionGap: "板块间距",
    small: "小",
    normal: "中",
    large: "大",
    narrow: "窄",
    wide: "宽"
  },

  vi: {
    remove: "Xóa",
    add: "Thêm",
    close: "Đóng",
    loading: "Đang tải...",

    eduHighSchool: "Trung học phổ thông",
    eduAssociate: "Cao đẳng",
    eduBachelor: "Cử nhân (đại học)",
    eduMaster: "Thạc sĩ (sau đại học)",
    eduDoctor: "Tiến sĩ (sau đại học)",
    eduBootcamp: "Bootcamp",
    eduCertificate: "Khóa đào tạo",
    eduOther: "Khác",
    statusEnrolled: "Đang học",
    statusGraduated: "Đã tốt nghiệp",
    statusLeave: "Bảo lưu",
    statusDropped: "Bỏ học",

    langBasic: "Cơ bản",
    langConversational: "Giao tiếp hằng ngày",
    langBusiness: "Thương mại",
    langFluent: "Lưu loát",
    langNative: "Bản ngữ",

    hdrAllTitle: "Nhập tất cả",
    hdrAllDesc: "Hãy điền tự do từ mục nào bạn nghĩ ra trước. Mọi thứ đều hiển thị trên một màn hình.",
    hdrBasicTitle: "Thông tin cơ bản",
    hdrBasicDesc: "Thông tin hiển thị ở đầu hồ sơ.",
    hdrIntroTitle: "Giới thiệu bản thân",
    hdrIntroDesc: "Viết phần giới thiệu và trau chuốt bằng AI.",
    hdrCoverLetterTitle: "Thư giới thiệu",
    hdrCoverLetterDesc: "Viết thư giới thiệu kiểu Hàn theo từng câu hỏi. AI soạn nháp từ hồ sơ của bạn.",
    clIntro: "Đây là dạng trả lời các câu hỏi mà công ty Hàn thường hỏi (động lực, quá trình trưởng thành...). Chọn câu hỏi mẫu hoặc tự nhập.",
    clCompanyLabel: "Công ty ứng tuyển (tùy chọn)",
    clCompanyPlaceholder: "VD: Aply Inc.",
    clAddStandard: "Câu hỏi mẫu",
    clAddCustom: "Thêm câu hỏi riêng",
    clStandardPrompts: [
      { label: "Động lực ứng tuyển", prompt: "Động lực ứng tuyển", example: "VD: Tôi dùng sản phẩm ngành này từ nhỏ nên quan tâm" },
      { label: "Quá trình trưởng thành", prompt: "Quá trình trưởng thành", example: "VD: Nhìn bố mẹ mở cửa hàng nhỏ, tôi học được trách nhiệm" },
      { label: "Ưu - nhược điểm", prompt: "Ưu - nhược điểm", example: "VD: Tôi tỉ mỉ nhưng đôi khi chậm vì cầu toàn" },
      { label: "Năng lực - kinh nghiệm", prompt: "Năng lực - kinh nghiệm", example: "VD: Tôi phụ trách phân tích dữ liệu và thuyết trình trong dự án lớp" },
      { label: "Mục tiêu sau khi vào", prompt: "Mục tiêu sau khi vào", example: "VD: Tôi muốn thành chuyên gia lĩnh vực này trong 3 năm" }
    ],
    clPromptPlaceholder: "Nhập câu hỏi (VD: Động lực ứng tuyển)",
    clAnswerPlaceholder: "Tự viết câu trả lời, hoặc nhấn 'AI nháp'.",
    clDraft: "AI nháp",
    clPolish: "AI trau chuốt",
    clGenerating: "Đang viết…",
    clTargetLabel: "Độ dài mục tiêu",
    clCharUnit: " ký tự",
    clCharCount: (current, target) => `${current} / ${target} ký tự`,
    clRemove: "Xóa câu hỏi",
    clEmpty: "Chưa có câu hỏi nào. Hãy thêm câu hỏi mẫu hoặc tự nhập.",
    clNeedPrompt: "Hãy nhập câu hỏi trước.",
    clWriteForPolish: "Hãy viết câu trả lời cần trau chuốt trước.",
    clDraftFailed: "Không thể tạo. Vui lòng thử lại.",
    clNote: "Thư giới thiệu được lưu riêng và không nằm trong PDF hồ sơ.",
    clA4Label: (n) => `A4 · ${n} trang`,
    clPreviewLabel: "Xem trước thư giới thiệu",
    clKeywordPlaceholder: "VD: chất liệu cá nhân để lồng vào (mỗi dòng một ý)",
    clKeywordHint: "Viết chất liệu cá nhân; chọn kiểu để AI phát triển thành câu chuyện động lực (tùy chọn)",
    clKeywordRemove: "Xóa từ khóa",
    clPreviewTitle: "Gợi ý AI — áp dụng?",
    clApply: "Áp dụng",
    clCancel: "Hủy",
    hdrEducationTitle: "Học vấn",
    hdrEducationDesc: "Nhập trường, chuyên ngành và thời gian.",
    hdrAwardsTitle: "Chứng chỉ · Giải thưởng",
    hdrAwardsDesc: "Nhập chứng chỉ và thành tích đoạt giải.",
    hdrSkillsTitle: "Kỹ năng",
    hdrSkillsDesc: "Thêm kỹ năng, công cụ và năng lực dưới dạng từ khóa.",
    hdrLanguagesTitle: "Ngoại ngữ",
    hdrLanguagesDesc: "Thêm ngôn ngữ bạn nói được và trình độ.",
    hdrLinksTitle: "Liên kết",
    hdrLinksDesc: "Thêm liên kết như portfolio, GitHub.",
    hdrDiagnosisTitle: "Chẩn đoán",
    hdrDiagnosisDesc: "Kiểm tra mức độ hoàn thiện của hồ sơ.",
    hdrDesignTitle: "Thiết kế",
    hdrDesignDesc: "Điều chỉnh bố cục, màu sắc và khoảng cách.",

    experienceFallback: "Kinh nghiệm",
    writeMore: "Vui lòng viết thêm một chút.",
    aiFilledCount: (n) => `AI đã điền ${n} mục! Vui lòng kiểm tra nội dung.`,
    organizedConfirm: "Đã sắp xếp xong. Vui lòng kiểm tra nội dung.",
    organizeFailed: "Sắp xếp thất bại. Vui lòng thử lại sau giây lát.",
    loadResumeFailed: "Không thể tải hồ sơ.",
    loadDiagnosisFailed: "Không thể tải kết quả chẩn đoán.",
    resumeTitleSaveFailed: "Lưu tên hồ sơ thất bại.",

    fillWithAi: "Trò chuyện với AI để điền mục này",
    fillWithAiShort: "Điền bằng AI",
    preview: "Xem trước",
    previewPdf: "Xem trước · PDF",
    previewResume: "Xem trước hồ sơ",

    sectionBasic: "Thông tin cơ bản",
    sectionIntro: "Giới thiệu bản thân",
    sectionEducation: "Học vấn",
    sectionAwards: "Chứng chỉ · Giải thưởng",
    sectionSkills: "Kỹ năng",
    sectionLanguages: "Ngoại ngữ",
    sectionLinks: "Liên kết",

    summaryHeading: "Tóm tắt",
    selfIntroHeading: "Giới thiệu bản thân",
    experienceSentences: "Câu mô tả kinh nghiệm",
    experienceHint: "Bật các kinh nghiệm muốn đưa vào, rồi trau chuốt câu văn.",
    noExperience: "Chưa có kinh nghiệm.",
    noPeriodWarning: "Chưa nhập thời gian — sẽ không được đưa vào hồ sơ. Vui lòng nhập thời gian ở mục 'Kinh nghiệm'.",
    rewriteFailed: "Không thể viết lại.",
    aiRewrite: "Viết lại bằng AI",
    makeWithInterview: "Tạo câu văn bằng phỏng vấn AI",
    includeToggle: "Bật/tắt đưa vào",
    moveUp: "Lên trên",
    moveDown: "Xuống dưới",

    brainTitle: "Cứ ghi ra thoải mái, AI sẽ tự điền giúp bạn",
    brainDesc: "Hãy ghi ra bất cứ điều gì bạn nghĩ tới — trường học, chuyên ngành, công ty, việc đã làm, kỹ năng, ngoại ngữ. Viết bằng tiếng nước ngoài cũng được.",
    brainPlaceholder:
      "Ví dụ: Tốt nghiệp ngành Khoa học máy tính Đại học OO, thực tập marketing 6 tháng vận hành mạng xã hội tăng gấp đôi người theo dõi, biết một chút React, TOEIC 800, portfolio github.com/...",
    organizing: "Đang sắp xếp…",

    fieldName: "Họ tên",
    fieldPhone: "Điện thoại",
    fieldEmail: "Email",
    fieldResidence: "Nơi ở",
    fieldDesiredRole: "Vị trí mong muốn",
    oneLineSummary: "Tóm tắt một dòng",
    selfIntroPlaceholder: "Nhập phần giới thiệu bản thân.",

    resumeName: "Tên hồ sơ",
    resumeNameHint: "(dùng cho danh sách · tên tệp)",
    resumeNamePlaceholder: "Ví dụ: Hồ sơ marketing mới ra trường",
    imageOnly: "Chỉ có thể tải lên tệp hình ảnh.",
    imageMaxSize: "Vui lòng tải lên hình ảnh dưới 8MB.",
    imageLoadFailed: "Không thể tải hình ảnh.",
    profilePhotoAlt: "Ảnh hồ sơ",
    profilePhoto: "Ảnh hồ sơ",
    changePhoto: "Đổi ảnh",
    uploadPhoto: "Tải ảnh lên",
    showPhotoOnResume: "Hiển thị ảnh trên hồ sơ",
    isForeigner: "Tôi là người nước ngoài (nhập quốc tịch · visa)",
    desiredLocationPlaceholder: "Nơi làm việc mong muốn (ví dụ: Seoul)",
    availableFromPlaceholder: "Thời gian có thể bắt đầu (ví dụ: Ngay lập tức, 2026-03)",
    nationalityPlaceholder: "Quốc tịch (ví dụ: Việt Nam)",
    visaLabel: "Visa",
    selectPlaceholder: "Chọn",

    writeSelfIntroFirst: "Vui lòng viết trước phần giới thiệu ở mức độ nào đó.",
    polishFailed: "Trau chuốt thất bại.",
    writeSelfIntroForSummary: "Viết phần giới thiệu trước, chúng tôi sẽ tạo tóm tắt một dòng cho bạn.",
    summaryFailed: "Tạo tóm tắt thất bại.",
    selfIntroLongPlaceholder: "Nhập phần giới thiệu bản thân. Sau khi viết, bạn có thể chọn kiểu ở bên dưới và trau chuốt bằng AI.",
    polishWithAi: "Trau chuốt bằng AI — chọn một kiểu và thử xem",
    aiPolished: (style) => `Giới thiệu được AI trau chuốt · ${style}`,
    replaceWithThis: "Thay bằng nội dung này",
    polishReplaced: "Đã thay bằng nội dung đã trau chuốt.",
    tryOtherStyles: "Bạn cũng có thể thử các kiểu khác bằng các nút ở trên.",
    translateHint: "Tại màn hình Xem trước · PDF, bạn có thể dịch toàn bộ hồ sơ sang tiếng Hàn và tiếng Anh.",
    oneLineSummaryHeading: "Tóm tắt một dòng",
    aiRecommend: "AI gợi ý từ phần giới thiệu",
    generating: "Đang tạo…",
    summaryInputPlaceholder: "Tóm tắt một dòng (tự nhập hoặc nhận gợi ý từ AI)",
    aiRecommendedSummary: "Tóm tắt một dòng do AI gợi ý",
    insert: "Đưa vào",
    summaryInserted: "Đã đưa vào tóm tắt một dòng.",
    dontInsert: "Không dùng",

    emptyEducationTitle: "Thêm học vấn đầu tiên nhé?",
    emptyEducationDesc: "Nhập trường, chuyên ngành và thời gian để thêm học vấn.",
    emptyAwardsTitle: "Thêm chứng chỉ · giải thưởng đầu tiên nhé?",
    emptyAwardsDesc: "Thêm chứng chỉ và thành tích đoạt giải.",
    emptySkillsTitle: "Thêm kỹ năng đầu tiên nhé?",
    emptyLanguagesTitle: "Thêm ngoại ngữ đầu tiên nhé?",
    emptyLanguagesDesc: "Thêm ngôn ngữ bạn nói được và trình độ.",
    emptyLinksTitle: "Thêm liên kết đầu tiên nhé?",
    emptyLinksDesc: "Thêm liên kết như portfolio, GitHub.",

    eduRowLabel: (n) => `Học vấn ${n}`,
    schoolNamePlaceholder: "Tên trường (ví dụ: Đại học OO)",
    eduTypeLabel: "Loại",
    eduStatusLabel: "Trạng thái",
    majorPlaceholder: "Chuyên ngành (ví dụ: Khoa học máy tính)",
    admission: "Nhập học",
    admissionMonth: "Tháng nhập học",
    graduation: "Tốt nghiệp",
    graduationMonth: "Tháng tốt nghiệp",
    currentlyEnrolled: "Đang học",

    awardRowLabel: (n) => `Mục ${n}`,
    awardNamePlaceholder: "Tên chứng chỉ · giải thưởng (ví dụ: Kỹ sư xử lý thông tin, Giải nhất cuộc thi OO)",
    awardIssuerPlaceholder: "Nơi cấp · đơn vị tổ chức (ví dụ: Cục Phát triển Nhân lực Hàn Quốc)",
    awardDateLabel: "Thời gian đạt được · nhận giải",
    awardDateOptional: "(tùy chọn)",
    awardDateAria: "Thời gian đạt được · nhận giải",

    skillPlaceholder: "Ví dụ: React, Figma (nhập rồi nhấn Enter)",
    aiSkillRecommend: "AI gợi ý kỹ năng",
    recommending: "Đang gợi ý…",
    noNewSkills: "Không tìm thấy kỹ năng mới để gợi ý.",
    skillRecommendFailed: "Gợi ý kỹ năng thất bại.",

    langRowLabel: (n) => `Ngoại ngữ ${n}`,
    languagePlaceholder: "Ngôn ngữ (ví dụ: Tiếng Anh, Tiếng Nhật)",
    levelLabel: "Trình độ",

    linkRowLabel: (n) => `Liên kết ${n}`,
    linkLabelPlaceholder: "Tên (ví dụ: Portfolio, GitHub)",
    linkUrlPlaceholder: "https://...",

    sectionOrder: "Thứ tự mục",
    sectionOrderHint: "(kéo hoặc dùng mũi tên để thay đổi)",
    emptySectionHint: "Các mục trống sẽ không hiển thị trên hồ sơ — chỉ cần đặt thứ tự.",
    layout: "Bố cục",
    accentColor: "Màu nhấn",
    colorAria: (c) => `Màu ${c}`,
    pickCustom: "Chọn tùy ý",
    accentColorAria: "Chọn màu nhấn tùy ý",
    titleMarker: "Ký hiệu tiêu đề mục",
    fontSize: "Cỡ chữ",
    lineSpacing: "Giãn dòng",
    sectionGap: "Khoảng cách mục",
    small: "Nhỏ",
    normal: "Vừa",
    large: "Lớn",
    narrow: "Hẹp",
    wide: "Rộng"
  },

  ja: {
    remove: "削除",
    add: "追加",
    close: "閉じる",
    loading: "読み込み中...",

    eduHighSchool: "高校",
    eduAssociate: "短期大学士",
    eduBachelor: "学士（大学）",
    eduMaster: "修士（大学院）",
    eduDoctor: "博士（大学院）",
    eduBootcamp: "ブートキャンプ",
    eduCertificate: "教育課程",
    eduOther: "その他",
    statusEnrolled: "在学中",
    statusGraduated: "卒業",
    statusLeave: "休学",
    statusDropped: "中退",

    langBasic: "初級",
    langConversational: "日常会話",
    langBusiness: "ビジネス",
    langFluent: "流暢",
    langNative: "ネイティブ",

    hdrAllTitle: "すべて入力",
    hdrAllDesc: "思いついた項目から自由に埋めていきましょう。すべて1画面に表示されています。",
    hdrBasicTitle: "基本情報",
    hdrBasicDesc: "履歴書の上部に表示される情報です。",
    hdrIntroTitle: "自己紹介",
    hdrIntroDesc: "自己紹介を書いてAIで整えてみましょう。",
    hdrCoverLetterTitle: "自己PR書",
    hdrCoverLetterDesc: "韓国式の自己PR書を設問ごとに作成します。AIが履歴書情報から下書きします。",
    clIntro: "志望動機・成長過程など韓国企業がよく聞く設問に答える形式です。標準設問を選ぶか自分で入力してください。",
    clCompanyLabel: "応募先企業（任意）",
    clCompanyPlaceholder: "例：Aply 株式会社",
    clAddStandard: "標準設問",
    clAddCustom: "設問を自分で追加",
    clStandardPrompts: [
      { label: "志望動機", prompt: "志望動機", example: "例：幼い頃からこの分野の製品を愛用し関心を持った" },
      { label: "成長過程", prompt: "成長過程", example: "例：小さな店を営む両親を見て責任感を学んだ" },
      { label: "性格の長所と短所", prompt: "性格の長所と短所", example: "例：几帳面だが完璧を求めて時間がかかることがある" },
      { label: "職務能力・経験", prompt: "職務能力・経験", example: "例：授業のプロジェクトでデータ分析と発表を担当" },
      { label: "入社後の抱負", prompt: "入社後の抱負", example: "例：3年以内にこの分野の専門家に成長したい" }
    ],
    clPromptPlaceholder: "設問を入力（例：志望動機）",
    clAnswerPlaceholder: "自分で書くか、「AI下書き」を押してください。",
    clDraft: "AI下書き",
    clPolish: "AIで整える",
    clGenerating: "作成中…",
    clTargetLabel: "目標文字数",
    clCharUnit: "字",
    clCharCount: (current, target) => `現在 ${current} 字 / 目標 ${target} 字`,
    clRemove: "設問を削除",
    clEmpty: "まだ設問がありません。標準設問を追加するか自分で入力してください。",
    clNeedPrompt: "先に設問を入力してください。",
    clWriteForPolish: "整える回答を先に書いてください。",
    clDraftFailed: "作成に失敗しました。後でもう一度お試しください。",
    clNote: "自己PR書は履歴書と別に保存され、履歴書PDFには含まれません。",
    clA4Label: (n) => `A4 · ${n}ページ`,
    clPreviewLabel: "自己PR書プレビュー",
    clKeywordPlaceholder: "例：答えに盛り込む自分の素材（1行に1つ）",
    clKeywordHint: "動機・きっかけにする素材を書いてください。形式を選ぶと物語として展開します（任意）",
    clKeywordRemove: "キーワードを削除",
    clPreviewTitle: "AIの提案 — 適用しますか？",
    clApply: "適用",
    clCancel: "キャンセル",
    hdrEducationTitle: "学歴",
    hdrEducationDesc: "学校・専攻・期間を入力します。",
    hdrAwardsTitle: "資格 · 受賞",
    hdrAwardsDesc: "資格・受賞歴を入力します。",
    hdrSkillsTitle: "スキル",
    hdrSkillsDesc: "技術・ツール・強みをキーワードで追加します。",
    hdrLanguagesTitle: "語学",
    hdrLanguagesDesc: "話せる言語とレベルを追加します。",
    hdrLinksTitle: "リンク",
    hdrLinksDesc: "ポートフォリオ・GitHub などのリンクを追加します。",
    hdrDiagnosisTitle: "診断",
    hdrDiagnosisDesc: "履歴書の完成度をチェックします。",
    hdrDesignTitle: "デザイン",
    hdrDesignDesc: "レイアウト・色・間隔を調整します。",

    experienceFallback: "経験",
    writeMore: "もう少し書いてください。",
    aiFilledCount: (n) => `AIが${n}件の項目を埋めました！内容をご確認ください。`,
    organizedConfirm: "整理しました。内容をご確認ください。",
    organizeFailed: "整理に失敗しました。しばらくしてからもう一度お試しください。",
    loadResumeFailed: "履歴書を読み込めませんでした。",
    loadDiagnosisFailed: "診断を読み込めませんでした。",
    resumeTitleSaveFailed: "履歴書名の保存に失敗しました。",

    fillWithAi: "この項目をAIと対話しながら埋める",
    fillWithAiShort: "AIで埋める",
    preview: "プレビュー",
    previewPdf: "プレビュー · PDF",
    previewResume: "履歴書プレビュー",

    sectionBasic: "基本情報",
    sectionIntro: "自己紹介",
    sectionEducation: "学歴",
    sectionAwards: "資格 · 受賞",
    sectionSkills: "スキル",
    sectionLanguages: "語学",
    sectionLinks: "リンク",

    summaryHeading: "要約",
    selfIntroHeading: "自己紹介",
    experienceSentences: "経験の文章",
    experienceHint: "含める経験をオンにして、文章を整えてみましょう。",
    noExperience: "まだ経験がありません。",
    noPeriodWarning: "期間が未入力 — 履歴書に含まれません。「経験」で期間を入力してください。",
    rewriteFailed: "書き直せませんでした。",
    aiRewrite: "AIで書き直す",
    makeWithInterview: "AIインタビューで文章を作る",
    includeToggle: "含める切り替え",
    moveUp: "上へ",
    moveDown: "下へ",

    brainTitle: "思いつくままに書けばAIが自動で埋めます",
    brainDesc: "学校・専攻・会社・やったこと・スキル・語学など、思いつくままにどんどん書いてください。外国語で書いても大丈夫です。",
    brainPlaceholder:
      "例：OO大学コンピューター工学卒業、マーケティングインターン6ヶ月SNS運営でフォロワー2倍、Reactを少し、TOEIC 800、ポートフォリオ github.com/...",
    organizing: "整理中…",

    fieldName: "氏名",
    fieldPhone: "携帯電話",
    fieldEmail: "メール",
    fieldResidence: "居住地",
    fieldDesiredRole: "希望職種",
    oneLineSummary: "一言要約",
    selfIntroPlaceholder: "自己紹介を入力してください。",

    resumeName: "履歴書名",
    resumeNameHint: "（一覧・ファイル名用）",
    resumeNamePlaceholder: "例：マーケティング新卒履歴書",
    imageOnly: "画像ファイルのみアップロードできます。",
    imageMaxSize: "8MB以下の画像をアップロードしてください。",
    imageLoadFailed: "画像を読み込めませんでした。",
    profilePhotoAlt: "証明写真",
    profilePhoto: "証明写真",
    changePhoto: "写真を変更",
    uploadPhoto: "写真をアップロード",
    showPhotoOnResume: "履歴書に写真を表示",
    isForeigner: "外国人です（国籍・ビザを入力）",
    desiredLocationPlaceholder: "希望勤務地（例：ソウル）",
    availableFromPlaceholder: "勤務可能時期（例：即時、2026-03）",
    nationalityPlaceholder: "国籍（例：ベトナム）",
    visaLabel: "ビザ",
    selectPlaceholder: "選択",

    writeSelfIntroFirst: "まず自己紹介をある程度書いてください。",
    polishFailed: "整えるのに失敗しました。",
    writeSelfIntroForSummary: "自己紹介を先に書くと、一言要約を作成します。",
    summaryFailed: "要約の生成に失敗しました。",
    selfIntroLongPlaceholder: "自己紹介を入力してください。書いた後、下で形式を選んでAIで整えられます。",
    polishWithAi: "AIで整える — 形式を選んで試してみましょう",
    aiPolished: (style) => `AIが整えた自己紹介 · ${style}`,
    replaceWithThis: "この内容に置き換える",
    polishReplaced: "整えた内容に置き換えました。",
    tryOtherStyles: "他の形式も上のボタンで試せます。",
    translateHint: "プレビュー · PDF画面で履歴書全体を韓国語・英語に翻訳できます。",
    oneLineSummaryHeading: "一言要約",
    aiRecommend: "自己紹介からAI提案",
    generating: "生成中…",
    summaryInputPlaceholder: "一言要約（自分で入力するかAI提案を受けてください）",
    aiRecommendedSummary: "AIが提案する一言要約",
    insert: "入れる",
    summaryInserted: "一言要約に入れました。",
    dontInsert: "入れない",

    emptyEducationTitle: "最初の学歴を追加しましょうか？",
    emptyEducationDesc: "学校・専攻・期間を入力して学歴を追加します。",
    emptyAwardsTitle: "最初の資格・受賞を追加しましょうか？",
    emptyAwardsDesc: "資格・受賞歴を追加します。",
    emptySkillsTitle: "最初のスキルを追加しましょうか？",
    emptyLanguagesTitle: "最初の語学を追加しましょうか？",
    emptyLanguagesDesc: "話せる言語とレベルを追加します。",
    emptyLinksTitle: "最初のリンクを追加しましょうか？",
    emptyLinksDesc: "ポートフォリオ・GitHub などのリンクを追加します。",

    eduRowLabel: (n) => `学歴 ${n}`,
    schoolNamePlaceholder: "学校名（例：OO大学）",
    eduTypeLabel: "区分",
    eduStatusLabel: "状態",
    majorPlaceholder: "専攻（例：コンピューター工学）",
    admission: "入学",
    admissionMonth: "入学月",
    graduation: "卒業",
    graduationMonth: "卒業月",
    currentlyEnrolled: "在学中",

    awardRowLabel: (n) => `項目 ${n}`,
    awardNamePlaceholder: "資格 · 受賞名（例：情報処理技士、OOコンテスト大賞）",
    awardIssuerPlaceholder: "発行元 · 主催（例：韓国産業人力公団）",
    awardDateLabel: "取得 · 受賞時期",
    awardDateOptional: "（任意）",
    awardDateAria: "取得 · 受賞時期",

    skillPlaceholder: "例：React、Figma（入力後 Enter）",
    aiSkillRecommend: "AIスキル提案",
    recommending: "提案中…",
    noNewSkills: "提案できる新しいスキルが見つかりませんでした。",
    skillRecommendFailed: "スキル提案に失敗しました。",

    langRowLabel: (n) => `語学 ${n}`,
    languagePlaceholder: "言語（例：英語、日本語）",
    levelLabel: "レベル",

    linkRowLabel: (n) => `リンク ${n}`,
    linkLabelPlaceholder: "名前（例：ポートフォリオ、GitHub）",
    linkUrlPlaceholder: "https://...",

    sectionOrder: "セクション順序",
    sectionOrderHint: "（ドラッグまたは矢印で変更）",
    emptySectionHint: "空のセクションは履歴書に表示されません — 順序だけ決めておけば大丈夫です。",
    layout: "レイアウト",
    accentColor: "アクセントカラー",
    colorAria: (c) => `色 ${c}`,
    pickCustom: "自分で選ぶ",
    accentColorAria: "アクセントカラーを自分で選ぶ",
    titleMarker: "セクションタイトルマーカー",
    fontSize: "文字サイズ",
    lineSpacing: "行間",
    sectionGap: "セクション間隔",
    small: "小",
    normal: "標準",
    large: "大",
    narrow: "狭い",
    wide: "広い"
  },

  id: {
    remove: "Hapus",
    add: "Tambah",
    close: "Tutup",
    loading: "Memuat...",

    eduHighSchool: "SMA",
    eduAssociate: "Diploma",
    eduBachelor: "Sarjana (universitas)",
    eduMaster: "Magister (pascasarjana)",
    eduDoctor: "Doktor (pascasarjana)",
    eduBootcamp: "Bootcamp",
    eduCertificate: "Program pelatihan",
    eduOther: "Lainnya",
    statusEnrolled: "Sedang kuliah",
    statusGraduated: "Lulus",
    statusLeave: "Cuti kuliah",
    statusDropped: "Putus kuliah",

    langBasic: "Dasar",
    langConversational: "Percakapan sehari-hari",
    langBusiness: "Bisnis",
    langFluent: "Lancar",
    langNative: "Penutur asli",

    hdrAllTitle: "Isi semua",
    hdrAllDesc: "Mulailah dari bagian apa pun yang terlintas. Semuanya ada dalam satu layar.",
    hdrBasicTitle: "Informasi dasar",
    hdrBasicDesc: "Informasi yang ditampilkan di bagian atas resume.",
    hdrIntroTitle: "Perkenalan diri",
    hdrIntroDesc: "Tulis perkenalan diri lalu perhalus dengan AI.",
    hdrCoverLetterTitle: "Surat lamaran",
    hdrCoverLetterDesc: "Tulis surat lamaran gaya Korea per pertanyaan. AI membuat draf dari resume Anda.",
    clIntro: "Ini format menjawab pertanyaan yang sering diajukan perusahaan Korea (motivasi, latar belakang). Pilih pertanyaan standar atau tulis sendiri.",
    clCompanyLabel: "Perusahaan (opsional)",
    clCompanyPlaceholder: "mis. Aply Inc.",
    clAddStandard: "Pertanyaan standar",
    clAddCustom: "Tambah pertanyaan sendiri",
    clStandardPrompts: [
      { label: "Motivasi", prompt: "Motivasi", example: "mis. Sejak kecil memakai produk bidang ini sehingga tertarik" },
      { label: "Latar belakang", prompt: "Latar belakang", example: "mis. Melihat orang tua mengelola toko kecil mengajarkan tanggung jawab" },
      { label: "Kelebihan & kekurangan", prompt: "Kelebihan & kekurangan", example: "mis. Teliti tetapi kadang lambat karena perfeksionis" },
      { label: "Kompetensi kerja", prompt: "Kompetensi kerja", example: "mis. Memimpin analisis data dan presentasi di proyek kelas" },
      { label: "Tujuan setelah bergabung", prompt: "Tujuan setelah bergabung", example: "mis. Ingin jadi ahli bidang ini dalam 3 tahun" }
    ],
    clPromptPlaceholder: "Masukkan pertanyaan (mis. Motivasi)",
    clAnswerPlaceholder: "Tulis jawaban Anda, atau ketuk 'Draf AI'.",
    clDraft: "Draf AI",
    clPolish: "Perhalus AI",
    clGenerating: "Menulis…",
    clTargetLabel: "Panjang target",
    clCharUnit: " karakter",
    clCharCount: (current, target) => `${current} / ${target} karakter`,
    clRemove: "Hapus pertanyaan",
    clEmpty: "Belum ada pertanyaan. Tambah pertanyaan standar atau tulis sendiri.",
    clNeedPrompt: "Masukkan pertanyaan dulu.",
    clWriteForPolish: "Tulis jawaban yang akan diperhalus dulu.",
    clDraftFailed: "Gagal membuat. Coba lagi.",
    clNote: "Surat lamaran disimpan terpisah dan tidak termasuk dalam PDF resume.",
    clA4Label: (n) => `A4 · ${n} halaman`,
    clPreviewLabel: "Pratinjau surat lamaran",
    clKeywordPlaceholder: "mis. bahan pribadi untuk disisipkan (satu per baris)",
    clKeywordHint: "Tulis bahan pribadi; pilih gaya dan AI mengembangkannya jadi cerita motivasi (opsional)",
    clKeywordRemove: "Hapus kata kunci",
    clPreviewTitle: "Saran AI — terapkan?",
    clApply: "Terapkan",
    clCancel: "Batal",
    hdrEducationTitle: "Pendidikan",
    hdrEducationDesc: "Masukkan sekolah, jurusan, dan periode.",
    hdrAwardsTitle: "Sertifikat · Penghargaan",
    hdrAwardsDesc: "Masukkan sertifikat dan riwayat penghargaan.",
    hdrSkillsTitle: "Keterampilan",
    hdrSkillsDesc: "Tambahkan keterampilan, alat, dan kemampuan sebagai kata kunci.",
    hdrLanguagesTitle: "Bahasa",
    hdrLanguagesDesc: "Tambahkan bahasa yang Anda kuasai dan tingkatnya.",
    hdrLinksTitle: "Tautan",
    hdrLinksDesc: "Tambahkan tautan seperti portofolio atau GitHub.",
    hdrDiagnosisTitle: "Diagnosis",
    hdrDiagnosisDesc: "Periksa tingkat kelengkapan resume.",
    hdrDesignTitle: "Desain",
    hdrDesignDesc: "Sesuaikan tata letak, warna, dan jarak.",

    experienceFallback: "Pengalaman",
    writeMore: "Mohon tulis sedikit lagi.",
    aiFilledCount: (n) => `AI mengisi ${n} item! Silakan periksa isinya.`,
    organizedConfirm: "Sudah dirapikan. Silakan periksa isinya.",
    organizeFailed: "Gagal merapikan. Silakan coba lagi sebentar.",
    loadResumeFailed: "Tidak dapat memuat resume.",
    loadDiagnosisFailed: "Tidak dapat memuat diagnosis.",
    resumeTitleSaveFailed: "Gagal menyimpan nama resume.",

    fillWithAi: "Isi bagian ini sambil mengobrol dengan AI",
    fillWithAiShort: "Isi dengan AI",
    preview: "Pratinjau",
    previewPdf: "Pratinjau · PDF",
    previewResume: "Pratinjau resume",

    sectionBasic: "Informasi dasar",
    sectionIntro: "Perkenalan diri",
    sectionEducation: "Pendidikan",
    sectionAwards: "Sertifikat · Penghargaan",
    sectionSkills: "Keterampilan",
    sectionLanguages: "Bahasa",
    sectionLinks: "Tautan",

    summaryHeading: "Ringkasan",
    selfIntroHeading: "Perkenalan diri",
    experienceSentences: "Kalimat pengalaman",
    experienceHint: "Aktifkan pengalaman yang ingin disertakan, lalu perhalus kalimatnya.",
    noExperience: "Belum ada pengalaman.",
    noPeriodWarning: "Periode belum diisi — tidak akan disertakan dalam resume. Silakan isi periode di 'Pengalaman'.",
    rewriteFailed: "Tidak dapat menulis ulang.",
    aiRewrite: "Tulis ulang dengan AI",
    makeWithInterview: "Buat kalimat dengan wawancara AI",
    includeToggle: "Alihkan penyertaan",
    moveUp: "Naik",
    moveDown: "Turun",

    brainTitle: "Cukup tulis sesuka hati, AI akan mengisinya untuk Anda",
    brainDesc: "Tulis apa saja yang terlintas — sekolah, jurusan, perusahaan, apa yang dikerjakan, keterampilan, bahasa. Menulis dalam bahasa asing pun boleh.",
    brainPlaceholder:
      "Mis.: Lulusan Ilmu Komputer Universitas OO, magang marketing 6 bulan mengelola media sosial dan menggandakan pengikut, sedikit React, TOEIC 800, portofolio github.com/...",
    organizing: "Merapikan…",

    fieldName: "Nama",
    fieldPhone: "Ponsel",
    fieldEmail: "Email",
    fieldResidence: "Tempat tinggal",
    fieldDesiredRole: "Posisi yang diinginkan",
    oneLineSummary: "Ringkasan satu baris",
    selfIntroPlaceholder: "Masukkan perkenalan diri.",

    resumeName: "Nama resume",
    resumeNameHint: "(untuk daftar · nama file)",
    resumeNamePlaceholder: "Mis.: Resume marketing fresh graduate",
    imageOnly: "Hanya file gambar yang bisa diunggah.",
    imageMaxSize: "Mohon unggah gambar 8MB atau lebih kecil.",
    imageLoadFailed: "Tidak dapat memuat gambar.",
    profilePhotoAlt: "Foto profil",
    profilePhoto: "Foto profil",
    changePhoto: "Ganti foto",
    uploadPhoto: "Unggah foto",
    showPhotoOnResume: "Tampilkan foto di resume",
    isForeigner: "Saya orang asing (isi kewarganegaraan · visa)",
    desiredLocationPlaceholder: "Lokasi kerja yang diinginkan (mis.: Seoul)",
    availableFromPlaceholder: "Dapat mulai bekerja (mis.: Segera, 2026-03)",
    nationalityPlaceholder: "Kewarganegaraan (mis.: Vietnam)",
    visaLabel: "Visa",
    selectPlaceholder: "Pilih",

    writeSelfIntroFirst: "Mohon tulis dulu sebagian perkenalan diri Anda.",
    polishFailed: "Gagal memperhalus.",
    writeSelfIntroForSummary: "Tulis dulu perkenalan diri, kami akan membuatkan ringkasan satu baris untuk Anda.",
    summaryFailed: "Gagal membuat ringkasan.",
    selfIntroLongPlaceholder: "Masukkan perkenalan diri. Setelah menulis, Anda bisa memilih gaya di bawah dan memperhalusnya dengan AI.",
    polishWithAi: "Perhalus dengan AI — pilih gaya dan coba",
    aiPolished: (style) => `Perkenalan yang diperhalus AI · ${style}`,
    replaceWithThis: "Ganti dengan ini",
    polishReplaced: "Diganti dengan versi yang diperhalus.",
    tryOtherStyles: "Anda juga bisa mencoba gaya lain dengan tombol di atas.",
    translateHint: "Di layar Pratinjau · PDF, Anda bisa menerjemahkan seluruh resume ke bahasa Korea dan Inggris.",
    oneLineSummaryHeading: "Ringkasan satu baris",
    aiRecommend: "Saran AI dari perkenalan",
    generating: "Membuat…",
    summaryInputPlaceholder: "Ringkasan satu baris (ketik sendiri atau dapatkan saran AI)",
    aiRecommendedSummary: "Ringkasan satu baris saran AI",
    insert: "Masukkan",
    summaryInserted: "Dimasukkan ke ringkasan satu baris.",
    dontInsert: "Tidak usah",

    emptyEducationTitle: "Tambahkan pendidikan pertama?",
    emptyEducationDesc: "Masukkan sekolah, jurusan, dan periode untuk menambah pendidikan.",
    emptyAwardsTitle: "Tambahkan sertifikat · penghargaan pertama?",
    emptyAwardsDesc: "Tambahkan sertifikat dan riwayat penghargaan.",
    emptySkillsTitle: "Tambahkan keterampilan pertama?",
    emptyLanguagesTitle: "Tambahkan bahasa pertama?",
    emptyLanguagesDesc: "Tambahkan bahasa yang Anda kuasai dan tingkatnya.",
    emptyLinksTitle: "Tambahkan tautan pertama?",
    emptyLinksDesc: "Tambahkan tautan seperti portofolio atau GitHub.",

    eduRowLabel: (n) => `Pendidikan ${n}`,
    schoolNamePlaceholder: "Nama sekolah (mis.: Universitas OO)",
    eduTypeLabel: "Jenis",
    eduStatusLabel: "Status",
    majorPlaceholder: "Jurusan (mis.: Ilmu Komputer)",
    admission: "Masuk",
    admissionMonth: "Bulan masuk",
    graduation: "Lulus",
    graduationMonth: "Bulan lulus",
    currentlyEnrolled: "Sedang kuliah",

    awardRowLabel: (n) => `Item ${n}`,
    awardNamePlaceholder: "Nama sertifikat · penghargaan (mis.: Engineer Information Processing, Juara Utama Kompetisi OO)",
    awardIssuerPlaceholder: "Penerbit · penyelenggara (mis.: Human Resources Development Service of Korea)",
    awardDateLabel: "Waktu perolehan · penghargaan",
    awardDateOptional: "(opsional)",
    awardDateAria: "Waktu perolehan · penghargaan",

    skillPlaceholder: "Mis.: React, Figma (ketik lalu tekan Enter)",
    aiSkillRecommend: "Saran keterampilan AI",
    recommending: "Menyarankan…",
    noNewSkills: "Tidak menemukan keterampilan baru untuk disarankan.",
    skillRecommendFailed: "Gagal menyarankan keterampilan.",

    langRowLabel: (n) => `Bahasa ${n}`,
    languagePlaceholder: "Bahasa (mis.: Inggris, Jepang)",
    levelLabel: "Tingkat",

    linkRowLabel: (n) => `Tautan ${n}`,
    linkLabelPlaceholder: "Nama (mis.: Portofolio, GitHub)",
    linkUrlPlaceholder: "https://...",

    sectionOrder: "Urutan bagian",
    sectionOrderHint: "(seret atau gunakan panah untuk mengubah)",
    emptySectionHint: "Bagian kosong tidak akan muncul di resume — cukup atur urutannya.",
    layout: "Tata letak",
    accentColor: "Warna aksen",
    colorAria: (c) => `Warna ${c}`,
    pickCustom: "Pilih sendiri",
    accentColorAria: "Pilih warna aksen sendiri",
    titleMarker: "Penanda judul bagian",
    fontSize: "Ukuran font",
    lineSpacing: "Jarak baris",
    sectionGap: "Jarak antar bagian",
    small: "Kecil",
    normal: "Normal",
    large: "Besar",
    narrow: "Sempit",
    wide: "Lebar"
  }
};

export function useEditorCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}

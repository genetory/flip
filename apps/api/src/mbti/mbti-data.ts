// MBTI × 한국 직장 매칭 — static type → role/culture mapping.
// Why static (and not LLM) for v1:
//   - sub-second response means the result page can be SSR-rendered
//     immediately on POST → no loading screen.
//   - cost is zero per visit, lets us scale viral spikes without surprise
//     bills.
//   - the matching POOL (which company has openings) is the dynamic
//     part anyway — that comes from prisma.position queries downstream.
//
// Future enhancement: feed `(mbtiType, locale)` into the existing
// matching pipeline so we can blend type-based heuristics with
// embedding similarity. For now this gives a solid v1 with a stable
// catalog of 16 results.

export type MbtiType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export const MBTI_TYPES: MbtiType[] = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP"
];

// Job-role categories use the same names as the `CandidatePreferredJobRole`
// enum so we can join on them downstream.
export type RoleCode =
  | "SOFTWARE_DEVELOPMENT" | "FRONTEND_DEVELOPMENT" | "BACKEND_DEVELOPMENT"
  | "DATA_ANALYSIS_SCIENCE" | "UI_UX_DESIGN" | "PRODUCT_MANAGER"
  | "MARKETING" | "SALES" | "HR" | "FINANCE_ACCOUNTING" | "OPERATIONS_PLANNING"
  | "OTHER";

export type AxisKey = "EI" | "SN" | "TF" | "JP";

// Each quiz question maps two options to one side of an axis. We keep
// scoring simple (1 point per pick) so the result of the quiz is just
// "which side won" per axis. Ties resolve to the left letter (E/S/T/J)
// as a small tiebreak — see computeMbtiFromQuiz.
export type MbtiQuizQuestion = {
  id: string;
  axis: AxisKey;
  question: string;
  options: [
    { code: "E" | "S" | "T" | "J" | "I" | "N" | "F" | "P"; label: string },
    { code: "E" | "S" | "T" | "J" | "I" | "N" | "F" | "P"; label: string }
  ];
};

// 12-question mini quiz, 3 per axis. Scenarios drawn from real Korean
// workplace + everyday life (회의, 단톡, 카톡, 회식 등). Bot asks in 존댓말;
// answer options read as the user's inner monologue, slang-free so the
// tone stays service-polite.
export const MBTI_QUIZ_QUESTIONS: MbtiQuizQuestion[] = [
  // EI axis ----------------------------------------------------------
  {
    id: "ei-1",
    axis: "EI",
    question: "첫 출근 날 점심시간, 어떤 편이세요?",
    options: [
      { code: "E", label: "팀원들 따라가서 같이 먹는 편" },
      { code: "I", label: "혼밥 메뉴 검색하고 산책하면서 먹는 편" }
    ]
  },
  {
    id: "ei-2",
    axis: "EI",
    question: "회식 끝난 다음 날, 컨디션은 어떠세요?",
    options: [
      { code: "E", label: "다음 라운드 언제냐고 단톡 돌리는 편" },
      { code: "I", label: "조용한 카페에서 충전이 필요한 편" }
    ]
  },
  {
    id: "ei-3",
    axis: "EI",
    question: "회의 중 아이디어가 떠올랐을 때",
    options: [
      { code: "E", label: "일단 말하면서 생각이 정리되는 편" },
      { code: "I", label: "메모하고 정돈해서 다음에 던지는 편" }
    ]
  },

  // SN axis ----------------------------------------------------------
  {
    id: "sn-1",
    axis: "SN",
    question: "새 프로젝트를 받으면 가장 먼저 여는 건?",
    options: [
      { code: "S", label: "구글 시트 - 일정·예산·할 일부터 정리" },
      { code: "N", label: "메모장 - 이게 결국 뭘 바꾸는지 큰 그림" }
    ]
  },
  {
    id: "sn-2",
    axis: "SN",
    question: "사수가 '알아서 잘해봐'라고 했을 때",
    options: [
      { code: "S", label: "과거 자료·선배 예시부터 찾아보는 편" },
      { code: "N", label: "이참에 새 방식을 시도해보는 편" }
    ]
  },
  {
    id: "sn-3",
    axis: "SN",
    question: "5년 뒤 계획을 묻는다면?",
    options: [
      { code: "S", label: "이직 시점·예상 연봉·자취 위치까지 구체적으로" },
      { code: "N", label: "어떤 종류의 사람이 되어 있을지부터 떠올림" }
    ]
  },

  // TF axis ----------------------------------------------------------
  {
    id: "tf-1",
    axis: "TF",
    question: "팀원 평가서를 쓸 때 더 신경 쓰는 건?",
    options: [
      { code: "T", label: "기여 지표와 개선 포인트를 명확히" },
      { code: "F", label: "상처받지 않게 표현과 맥락을 챙김" }
    ]
  },
  {
    id: "tf-2",
    axis: "TF",
    question: "친구가 '나 살쪘지?'라고 물었을 때",
    options: [
      { code: "T", label: "지난번보다 좀 늘긴 했어, 같이 운동할까?" },
      { code: "F", label: "오늘 화장 진짜 잘 됐는데? 분위기 좋아" }
    ]
  },
  {
    id: "tf-3",
    axis: "TF",
    question: "동료가 울면서 고민을 털어놓고 있어요",
    options: [
      { code: "T", label: "원인을 같이 분석하고 해결책을 짜는 편" },
      { code: "F", label: "일단 충분히 들어주고 마음에 공감하는 편" }
    ]
  },

  // JP axis ----------------------------------------------------------
  {
    id: "jp-1",
    axis: "JP",
    question: "여행 계획을 짤 때 내 스타일은?",
    options: [
      { code: "J", label: "노션·시트에 동선·예산·맛집까지 정리" },
      { code: "P", label: "공항 도착해서 분위기 보고 정하는 편" }
    ]
  },
  {
    id: "jp-2",
    axis: "JP",
    question: "마감 D-7, 어떻게 하세요?",
    options: [
      { code: "J", label: "오늘부터 매일 분량 나눠서 진행" },
      { code: "P", label: "막판에 몰입해서 한 번에 끝내는 편" }
    ]
  },
  {
    id: "jp-3",
    axis: "JP",
    question: "카톡 답장 스타일은 어떠세요?",
    options: [
      { code: "J", label: "받자마자 답, 안 읽으면 불안한 편" },
      { code: "P", label: "느낌 올 때 답, 가끔 며칠 뒤에 미안" }
    ]
  }
];

// Tally per-letter votes per axis. Ties resolve to the left letter of
// the axis (E/S/T/J) so we always return a valid 4-letter type.
export function computeMbtiFromQuiz(answers: { id: string; code: string }[]): MbtiType | null {
  const score: Record<string, number> = {
    E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
  };
  for (const ans of answers) {
    const q = MBTI_QUIZ_QUESTIONS.find((x) => x.id === ans.id);
    if (!q) continue;
    if (q.options.some((opt) => opt.code === ans.code)) score[ans.code] += 1;
  }
  const pick = (left: string, right: string) => (score[left] >= score[right] ? left : right);
  const ei = pick("E", "I");
  const sn = pick("S", "N");
  const tf = pick("T", "F");
  const jp = pick("J", "P");
  const out = `${ei}${sn}${tf}${jp}`;
  return isMbtiType(out) ? (out as MbtiType) : null;
}

type MbtiProfile = {
  // Top 3 most-fitting role codes, in priority order — drives position recos.
  roles: RoleCode[];
  // One-liner shown on the result hero card.
  culture: string;
  // 2–3 sentence interpretation rendered on the result page body.
  interpretation: string;
  // Rich profile sections.
  strengths: string[];                  // 3 bullets — what they bring to a team
  koreanWorkplaceChallenges: string[];  // 2 bullets — friction in Korean office culture
  companySizeFit: string;               // one-liner on company stage/size fit
  teamVibe: string;                     // one-liner on ideal team vibe
  interviewTips: string[];              // 3 bullets — how to interview well
  // Same-type K-pop celebrities (widely cited online; with disclaimer in UI).
  famousKoreans: string[];
  // Coworker chemistry — MBTIs that complement this one, with a short reason
  // each. 2-3 picks.
  goodMatchMbtis: { type: MbtiType; reason: string }[];
  // Green/red flags when reading a Korean job posting or interviewing.
  greenFlags: string[];                 // 3 bullets — signals this is a fit
  redFlags: string[];                   // 2-3 bullets — signals to avoid
};

// Per-(type, role) short reason shown under recommended positions on the
// result page. Keep these one-liners — they sit under the position title.
// Only need a reason for the roles each type can recommend; missing
// (type, role) pairs fall back to the generic culture summary.
export const ROLE_MATCH_REASON: Record<MbtiType, Partial<Record<RoleCode, string>>> = {
  INTJ: {
    DATA_ANALYSIS_SCIENCE: "복잡한 데이터를 구조화해 장기 의사결정에 쓰는 역할",
    BACKEND_DEVELOPMENT: "시스템 설계와 아키텍처를 책임지는 자율 환경",
    PRODUCT_MANAGER: "로드맵을 직접 짜고 결과로 평가받는 PM 트랙"
  },
  INTP: {
    DATA_ANALYSIS_SCIENCE: "가설을 세우고 검증하는 분석가/연구 트랙",
    BACKEND_DEVELOPMENT: "기술 깊이를 인정해주는 플랫폼 엔지니어링",
    SOFTWARE_DEVELOPMENT: "코드 품질과 합리성으로 평가받는 R&D"
  },
  ENTJ: {
    OPERATIONS_PLANNING: "사업 전략과 실행을 동시에 잡는 전략·운영",
    PRODUCT_MANAGER: "프로덕트 P&L을 책임지는 리더 PM",
    SALES: "성과·KPI가 곧 나의 평가가 되는 B2B 세일즈"
  },
  ENTP: {
    PRODUCT_MANAGER: "신규 라인·실험 launch가 일상인 PM",
    MARKETING: "A/B 테스트와 그로스 실험이 핵심인 마케팅",
    FRONTEND_DEVELOPMENT: "빠르게 프로토타입을 찍어내는 F/E 엔지니어"
  },
  INFJ: {
    UI_UX_DESIGN: "사용자 인사이트로 제품을 설계하는 UX",
    MARKETING: "브랜드 미션과 메시지가 명확한 마케팅",
    HR: "사람의 성장을 설계하는 People Ops"
  },
  INFP: {
    UI_UX_DESIGN: "본인 색이 담긴 디자인을 존중해주는 팀",
    MARKETING: "콘텐츠·브랜드 스토리텔링 중심 마케팅",
    HR: "심리적 안전감을 만드는 컬처·People Ops"
  },
  ENFJ: {
    HR: "구성원 성장 코칭이 곧 성과인 HR",
    MARKETING: "커뮤니티·고객 관계 기반 마케팅",
    SALES: "장기 신뢰가 핵심인 B2B 어카운트 매니저"
  },
  ENFP: {
    MARKETING: "분위기와 에너지로 캠페인을 만드는 마케팅",
    PRODUCT_MANAGER: "고객 인사이트를 빠르게 제품에 녹이는 PM",
    UI_UX_DESIGN: "사람 중심 UX/리서치 디자인"
  },
  ISTJ: {
    FINANCE_ACCOUNTING: "정확성·신뢰가 곧 성과인 재무·회계",
    OPERATIONS_PLANNING: "프로세스와 SOP를 만드는 운영",
    BACKEND_DEVELOPMENT: "안정성·신뢰성을 책임지는 인프라 엔지니어"
  },
  ISFJ: {
    HR: "구성원을 챙기는 People Ops",
    FINANCE_ACCOUNTING: "정확하고 꼼꼼한 정산·회계",
    UI_UX_DESIGN: "디테일이 살아있는 UI 디자인"
  },
  ESTJ: {
    OPERATIONS_PLANNING: "실행과 책임이 명확한 운영·기획",
    FINANCE_ACCOUNTING: "관리회계·재무 통제",
    HR: "정책과 룰을 만드는 HR Operations"
  },
  ESFJ: {
    HR: "팀워크와 사기를 유지하는 People 매니저",
    SALES: "꾸준한 고객 관계가 매출이 되는 어카운트 매니저",
    OPERATIONS_PLANNING: "현장 운영·CS 리더십"
  },
  ISTP: {
    SOFTWARE_DEVELOPMENT: "문제를 도구로 해결하는 엔지니어",
    BACKEND_DEVELOPMENT: "인프라·시스템 안정화 엔지니어",
    OPERATIONS_PLANNING: "운영 자동화·SRE 성향 역할"
  },
  ISFP: {
    UI_UX_DESIGN: "감각이 살아있는 프로덕트 디자인",
    MARKETING: "톤앤매너가 일관된 콘텐츠·브랜드",
    FRONTEND_DEVELOPMENT: "인터랙티브 F/E 엔지니어"
  },
  ESTP: {
    SALES: "현장에서 빠르게 판단하는 B2B 세일즈/BD",
    MARKETING: "속도가 곧 성과인 그로스 마케팅",
    OPERATIONS_PLANNING: "신규 사업 런칭 운영"
  },
  ESFP: {
    MARKETING: "사람을 모으고 분위기를 만드는 콘텐츠 마케팅",
    SALES: "에너지와 친화력이 곧 무기인 B2C 세일즈",
    UI_UX_DESIGN: "사용자가 즐길 수 있는 인터랙티브 UX"
  }
};

// 16 personalities → Korean workplace fit. Each profile is intentionally
// fleshed out: longer interpretation (4–5 sentences), 5 bullets for
// strengths/interviewTips/greenFlags, 4 bullets for challenges/redFlags,
// 2–3 sentences for companySizeFit/teamVibe, and 5 K-pop idol names per
// type. K-pop picks reflect widely-discussed online MBTI claims; we surface
// a disclaimer in the UI so users know it's not from formal testing.
export const MBTI_PROFILE: Record<MbtiType, MbtiProfile> = {
  INTJ: {
    roles: ["DATA_ANALYSIS_SCIENCE", "BACKEND_DEVELOPMENT", "PRODUCT_MANAGER"],
    culture: "장기적 전략을 짜고 시스템을 설계하는 자율적인 팀",
    interpretation:
      "복잡한 문제를 체계적으로 분해하고 장기 로드맵을 짜는 데 강한 타입입니다. 단기 KPI보다는 \"이 시스템이 3년 뒤 어떻게 자라야 하는가\"를 먼저 그리고, 그 위에서 구체 실행 계획을 떨궈요. 위계가 적고 데이터·로직 기반으로 의사결정하는 조직, 그리고 결과에 대한 자율성과 책임을 동시에 주는 환경에서 가장 성과를 냅니다. 반대로 회의·근태·결재 라인 위주 평가에서는 빠르게 동기를 잃기 쉬워요.",
    strengths: [
      "장기 전략과 시스템적 사고로 큰 그림을 정리",
      "데이터·로직 기반 의사결정에 강함",
      "혼자서 깊게 파고드는 집중력",
      "복잡한 트레이드오프를 문서로 깔끔히 정리",
      "1~2년짜리 로드맵을 끈질기게 끌고 감"
    ],
    koreanWorkplaceChallenges: [
      "위계·분위기 회의가 잦은 조직에서 답답함",
      "감정적 설득이 필요한 협업에서 자주 마찰",
      "직설적 피드백이 \"차갑다\"는 인상을 남기기도",
      "이해 못 한 상태에서 결정을 강요받으면 빠르게 번아웃"
    ],
    companySizeFit:
      "중·대형 스타트업의 전략/플랫폼 팀이나, R&D·연구 조직이 별도로 있는 중견·대기업이 가장 잘 맞아요. 시리즈 B~D 단계의 SaaS·핀테크처럼 \"시스템적 사고\"가 곧 사업 경쟁력이 되는 구간이 특히 강점을 살리기 좋습니다.",
    teamVibe:
      "리더가 비전을 명확히 주고 실행은 위임하는 팀, 그리고 직급보다 데이터·논리로 의사결정이 정리되는 팀에서 본인 색이 가장 잘 살아나요. 회의보다는 문서·노션 리뷰로 합의가 이뤄지는 비동기 협업 문화면 더 좋습니다.",
    interviewTips: [
      "장기 로드맵·아키텍처 결정 경험을 구조화해서 설명",
      "수치·가설 검증 사례로 성과를 증명",
      "팀과의 협업 사례를 일부러 추가해 \"독불장군\" 우려를 차단",
      "실패한 결정에서 배운 점도 한 가지 챙겨두기",
      "면접관의 질문을 가볍게 한 번 되묻고 답하는 습관"
    ],
    famousKoreans: ["카리나 (aespa)", "솔라 (MAMAMOO)", "사쿠라 (LE SSERAFIM)", "강슬기 (Red Velvet)", "정한 (SEVENTEEN)"],
    goodMatchMbtis: [
      { type: "ENTP", reason: "전략을 흔드는 질문으로 사고를 확장시켜줌" },
      { type: "ENFP", reason: "차가운 논리에 따뜻한 동기를 더해줌" },
      { type: "ESTJ", reason: "내가 짠 설계를 정확히 실행으로 옮겨줌" }
    ],
    greenFlags: [
      "OKR/KPI가 문서로 정리되어 있는 조직",
      "결재 라인 2단계 이하 + 권한 위임",
      "회의 시간보다 문서 리뷰가 많은 팀",
      "장기 로드맵을 글로 공유하는 문화",
      "리서치·실험 결과가 의사결정에 반영"
    ],
    redFlags: [
      "감정적 합의가 의사결정의 핵심인 분위기",
      "근태·보고가 평가의 큰 비중",
      "리더가 매일 디테일까지 마이크로매니징",
      "사내 정치 라인이 명확히 보이는 조직"
    ]
  },
  INTP: {
    roles: ["DATA_ANALYSIS_SCIENCE", "BACKEND_DEVELOPMENT", "SOFTWARE_DEVELOPMENT"],
    culture: "기술적 깊이를 인정해주는 R&D 중심 조직",
    interpretation:
      "이론과 원리를 파고드는 걸 즐기는 타입입니다. 단순히 코드를 \"돌아가게\" 만드는 것보다, 그 안의 원리가 왜 그렇게 동작하는지를 끝까지 추적하는 데서 에너지를 얻어요. 코드·데이터·논문 같은 1차 자료를 자유롭게 다루고, 회의·정치보다는 결과물의 합리성으로 평가받는 R&D·플랫폼 엔지니어링 팀과 잘 맞습니다. 다만 마감·반복 업무에서는 흥미가 빠르게 떨어지기 때문에, 일정 관리를 같이 챙겨주는 동료가 옆에 있는 환경이 이상적이에요.",
    strengths: [
      "복잡한 문제의 원리를 끝까지 추적",
      "데이터·논문·코드 같은 1차 자료를 잘 다룸",
      "기존 통념에 휘둘리지 않는 객관성",
      "기술 트레이드오프를 빠르게 비교 분석",
      "본인이 흥미를 느낀 주제에 한해 무서운 몰입력"
    ],
    koreanWorkplaceChallenges: [
      "잡담·관계 중심 분위기에서 피로감이 빠르게 옴",
      "마감보다 \"완전히 옳은 답\"을 우선해 일정 압박을 받기도",
      "직설적 표현이 무례하게 들릴 위험",
      "보고서 작성·반복 회의에서 동기가 빠르게 빠짐"
    ],
    companySizeFit:
      "R&D 비중이 큰 테크 스타트업, 또는 대기업의 연구소·플랫폼 조직과 잘 맞습니다. AI·인프라·검색·핀테크 코어처럼 \"기술 깊이가 곧 사업 경쟁력\"인 도메인이 특히 본인 강점을 살리기 좋아요.",
    teamVibe:
      "기술 리뷰가 일상이고 의견이 합리적이면 직급과 상관없이 채택되는 팀, 그리고 슬랙·문서 기반 비동기 협업이 정착된 환경이 이상적이에요. 시니어가 멘토 역할을 해주면서 마감 감각을 같이 잡아주는 팀이면 시너지가 큽니다.",
    interviewTips: [
      "관심 분야에 대해 깊이 있는 견해를 준비",
      "협업·의사소통에서 본인이 한 보완 노력을 함께 어필",
      "추상적 답변은 짧게, 구체 사례는 길게",
      "마감을 어떻게 지키는지에 대한 본인만의 방식 1개 준비",
      "면접관 질문의 전제를 빠르게 짚어주는 답변 스타일"
    ],
    famousKoreans: ["슈가 (BTS)", "닝닝 (aespa)", "예지 (ITZY)", "휘인 (MAMAMOO)", "미연 ((G)I-DLE)"],
    goodMatchMbtis: [
      { type: "ENTJ", reason: "흩어진 아이디어를 사업·실행으로 묶어줌" },
      { type: "INFJ", reason: "추상적 사고에 의미와 방향을 더해줌" },
      { type: "ENTP", reason: "토론으로 사고를 더 멀리 밀어줌" }
    ],
    greenFlags: [
      "코드 리뷰·기술 블로그 문화가 활발",
      "사이드 프로젝트·R&D 시간 제공",
      "결과물(코드/데이터)로 평가하는 팀",
      "RFC 문서 기반 의사결정 문화",
      "직급보다 기술적 합리성을 우선"
    ],
    redFlags: [
      "주간 보고서·정성 평가가 핵심",
      "잡담·회식이 평가와 연결",
      "기술 결정을 비기술 관리자가 좌우",
      "코드 리뷰 없이 머지가 흔한 조직"
    ]
  },
  ENTJ: {
    roles: ["OPERATIONS_PLANNING", "PRODUCT_MANAGER", "SALES"],
    culture: "결과·성장 지향의 빠른 의사결정 조직",
    interpretation:
      "비전을 세우고 팀을 이끄는 데 익숙한 타입입니다. 위에서 시킨 일을 잘 해내는 것보다, 본인이 그림을 그리고 팀을 정렬해 KPI를 직접 책임지는 자리에서 가장 빛나요. 초기·확장기 스타트업의 PM·BD·전략 포지션, 또는 사업부장 트랙이 명확한 조직에서 본인 추진력이 잘 발휘됩니다. 다만 결과 중심 화법이 차갑게 비치기 쉬워, 동료·팀원과의 관계 관리를 의식적으로 챙겨야 장기 성과로 이어져요.",
    strengths: [
      "비전 설정과 팀 정렬",
      "성과·KPI 중심 사고",
      "압박 속에서도 빠른 결정",
      "사업 임팩트로 의사결정을 정리하는 힘",
      "협상과 우선순위 조정에 강함"
    ],
    koreanWorkplaceChallenges: [
      "느린 위계·결재 라인에서 답답함이 큼",
      "결과 중심 화법이 차갑게 비치기도",
      "팀원에게 \"왜 못 하지?\"라는 압박감을 줄 위험",
      "본인 비전과 어긋난 지시를 받으면 동기가 급락"
    ],
    companySizeFit:
      "확장기 스타트업, 또는 사내독립조직(CIC)·신사업 부문이 별도로 있는 중견기업이 잘 맞아요. 시리즈 A~C 구간의 빠르게 성장하는 SaaS·플랫폼·D2C에서 사업 KPI를 직접 책임지는 자리가 특히 강점입니다.",
    teamVibe:
      "의사결정 속도가 빠르고 성과로 평가받는 팀, 그리고 본인이 직접 우선순위와 리소스를 조정할 수 있는 자율도가 있는 환경이 이상적이에요. 팀원의 성장 KPI도 같이 들어 있는 평가 체계라면 더 단단한 시너지가 납니다.",
    interviewTips: [
      "본인이 직접 끌어올린 KPI 수치 중심으로 정리",
      "팀원 성장을 도왔던 사례를 1개 이상 준비",
      "리더십 톤이 압박처럼 느껴지지 않도록 톤다운",
      "실패한 결정과 회복 사례를 1개 챙기기",
      "본인이 \"이 회사에 무엇을 가져올 수 있는지\"를 첫 5분에 명확히"
    ],
    famousKoreans: ["제니 (BLACKPINK)", "안유진 (IVE)", "수지", "보아", "전소미"],
    goodMatchMbtis: [
      { type: "INTP", reason: "비전에 깊이 있는 분석을 더해줌" },
      { type: "INFJ", reason: "차가운 의사결정에 인간적 시각을 보탬" },
      { type: "ESTJ", reason: "실행 디테일을 정확히 맞춰줌" }
    ],
    greenFlags: [
      "P&L 책임을 명확히 위임",
      "성과로 빠르게 리더십 트랙이 열리는 구조",
      "본부장/대표 직보가 가능한 조직 구조",
      "KPI·OKR이 분기 단위로 명확히 갱신",
      "신사업·신규 라인 launch 권한이 팀 단위로 위임"
    ],
    redFlags: [
      "근속 연차가 평가의 절반",
      "결재 5단계 + 사내 정치 위주",
      "성과 측정 기준이 모호한 부서",
      "리더십 트랙이 5년 이상 막혀 있는 조직"
    ]
  },
  ENTP: {
    roles: ["PRODUCT_MANAGER", "MARKETING", "FRONTEND_DEVELOPMENT"],
    culture: "새 아이디어를 빠르게 실험하는 프로토타입 문화",
    interpretation:
      "기존 틀을 흔드는 새 시도를 좋아하는 타입입니다. 정답이 있는 길보다, 가설을 세우고 실험으로 검증하는 데서 가장 동기부여를 받아요. A/B 테스트·신규 라인 launch·그로스 실험이 일상인 팀에서 PM·그로스 마케터·F/E 엔지니어 같은 역할이 잘 맞고, 빠른 사이클로 새 product 라인을 launch하는 조직에서 본인 색이 가장 살아납니다. 다만 디테일·반복 업무에서 흥미가 빠르게 떨어지므로 PM/디자이너/엔지니어 등 디테일 보완 동료와 한 팀을 이루는 것이 중요해요.",
    strengths: [
      "아이디어 발산과 빠른 프로토타이핑",
      "회의에서 흐름을 새 방향으로 트는 힘",
      "리스크에 대한 유연한 태도",
      "낯선 도메인에 두려움 없이 뛰어듦",
      "다양한 영역을 연결해 새 가설을 만드는 감각"
    ],
    koreanWorkplaceChallenges: [
      "디테일·반복 업무에서 빠르게 흥미를 잃음",
      "토론을 너무 즐겨 \"공격적\"으로 오해받기도",
      "마감 직전 새 아이디어로 일정을 흔들 위험",
      "관심 잃은 프로젝트에서 마무리 동기가 빠르게 빠짐"
    ],
    companySizeFit:
      "신사업·신규 라인을 자주 launch하는 스타트업, 특히 시리즈 A~B의 D2C·SaaS·콘텐츠 회사가 잘 맞아요. 사내 인큐베이션·CIC가 있는 중견기업에서 \"신규 라인 책임자\" 트랙도 강점을 살리기 좋습니다.",
    teamVibe:
      "실험을 환영하고 실패를 학습으로 받아주는 팀, 그리고 PM·디자이너·엔지니어가 한 셀에서 빠르게 가설을 돌려보는 구조면 시너지가 큽니다. 본인이 가설을 던지면 디테일을 챙겨줄 ISTJ/ESTJ 동료가 있는 팀이 이상적이에요.",
    interviewTips: [
      "실험-가설-결과를 1개 이상 구조화해서 준비",
      "한 회사에서 끝까지 마무리한 프로젝트 사례 강조",
      "토론할 때 상대 의견을 한 번 받아치기 전에 인정부터",
      "본인이 마감을 어떻게 지키는지 구체적 방식 1개",
      "본인이 가진 약점(예: 디테일 약함)을 솔직히 + 보완 노력"
    ],
    famousKoreans: ["G-Dragon (BIGBANG)", "박재범", "전소미", "츄", "박나래"],
    goodMatchMbtis: [
      { type: "INTJ", reason: "흩뿌린 아이디어를 시스템으로 정착시켜줌" },
      { type: "INFJ", reason: "거친 가설에 사용자 관점의 깊이를 더해줌" },
      { type: "ISTJ", reason: "내가 못 챙긴 디테일·일정을 메워줌" }
    ],
    greenFlags: [
      "A/B 실험·신규 라인 launch가 일상",
      "실패를 회고로 흡수하는 문화",
      "MVP·프로토타입을 빠르게 빼는 사이클",
      "PM/디자이너/엔지니어가 같은 셀에서 일함",
      "신규 라인 책임자 트랙이 열려 있음"
    ],
    redFlags: [
      "5년째 같은 product만 유지",
      "ROI를 사전에 100% 증명해야만 시도",
      "회의 결과를 결재까지 다시 받는 구조",
      "반복 업무·운영이 평가의 핵심"
    ]
  },
  INFJ: {
    roles: ["UI_UX_DESIGN", "MARKETING", "HR"],
    culture: "사람과 가치 중심의 미션 드리븐 조직",
    interpretation:
      "사람과 의미에 깊이 몰입하는 타입입니다. \"이 일이 결국 누구에게, 어떤 영향을 주는가\"를 따져보지 않으면 오래 못 견디는 편이에요. 단순 매출보다 제품·브랜드가 사회에 어떤 영향을 주는지를 따지는 미션 드리븐 회사에서 디자인·브랜드·HR 같은 역할에 강점을 보입니다. 사용자·구성원 인사이트를 깊이 읽고 문서로 정리하는 능력이 뛰어나, UX 리서치·브랜드 전략·People Ops 같은 길이 자연스럽게 열려요.",
    strengths: [
      "사용자/구성원 인사이트를 깊이 읽어냄",
      "장기 비전과 가치를 글·문서로 정리",
      "조용하지만 끈질긴 추진력",
      "복잡한 감정·관계를 읽고 중재",
      "장기 임팩트를 그리는 비전 메이커"
    ],
    koreanWorkplaceChallenges: [
      "정치·경쟁 위주 조직에서 빠르게 번아웃",
      "본인 의견을 직접 말하는 데 시간이 걸림",
      "타인의 부정적 감정을 흡수해 지치기 쉬움",
      "비전과 어긋난 지시를 받으면 동기가 급락"
    ],
    companySizeFit:
      "임팩트·소셜 임팩트가 명확한 스타트업, 비영리/공공 섹터, 또는 미션 중심의 B2C 브랜드와 잘 맞아요. 시리즈 Seed~A 구간의 미션 드리븐 스타트업에서 UX·콘텐츠·People 영역이 본인 강점을 가장 빨리 살릴 수 있는 자리입니다.",
    teamVibe:
      "조용히 깊은 대화가 오가는 소규모 코어 팀이 이상적입니다. 정기 1on1과 회고가 문화로 정착되어 있고, 의사결정의 \"왜\"가 글로 공유되는 팀에서 본인 색이 가장 잘 자라요.",
    interviewTips: [
      "왜 이 회사여야 하는지 \"가치 정렬\" 관점에서 답변",
      "혼자 깊이 있게 끌어낸 프로젝트 1개를 자세히",
      "결과 수치도 1~2개 챙겨서 \"감성적이기만 하다\" 인상 회피",
      "본인이 받은 가장 어려운 갈등 사례 + 대응 방식",
      "본인이 \"못하는 일\"을 솔직히 + 어떻게 보완하는지"
    ],
    famousKoreans: ["RM (BTS)", "조이 (Red Velvet)", "백현 (EXO)", "가을 (IVE)", "유나 (ITZY)"],
    goodMatchMbtis: [
      { type: "ENFP", reason: "조용한 비전을 밝게 끌어올려줌" },
      { type: "ENTP", reason: "깊은 사고를 실험으로 검증해줌" },
      { type: "INFP", reason: "가치 정렬이 자연스러운 동료" }
    ],
    greenFlags: [
      "회사의 미션·임팩트가 글로 정리되어 있음",
      "정기 1on1과 심리적 안전감 강조",
      "사용자 인터뷰·리서치가 의사결정에 반영",
      "리더가 \"왜\"를 글로 공유하는 문화",
      "10~50인 규모의 코어 팀 중심"
    ],
    redFlags: [
      "구성원을 KPI로만 평가",
      "정치적 라인이 보이는 조직",
      "회식·관계 중심 평가가 강함",
      "사용자보다 단기 매출만 강조"
    ]
  },
  INFP: {
    roles: ["UI_UX_DESIGN", "MARKETING", "HR"],
    culture: "개인의 색을 존중하는 크리에이티브 문화",
    interpretation:
      "본인 가치관과 어긋나는 일은 오래 못 견디는 타입입니다. 매출·효율보다 \"이게 나답고, 의미가 있는가\"가 먼저 통과되어야 손이 움직여요. 콘텐츠·브랜드·UX 같은 크리에이티브 영역, 그리고 자유로운 출퇴근/리모트 옵션이 있는 작은 조직과 잘 맞습니다. 사용자 감정선을 섬세하게 읽는 강점이 있어, 1인 작가·디자이너·라이터 트랙에서도 본인 색이 잘 살아나요.",
    strengths: [
      "본인의 색이 묻어나는 결과물",
      "사용자 감정선에 대한 섬세함",
      "장기적으로 의미 있는 일에 대한 몰입",
      "글·이미지·톤으로 분위기를 정확히 잡는 감각",
      "조용한 환경에서의 깊은 몰입력"
    ],
    koreanWorkplaceChallenges: [
      "수직적 피드백·강한 톤의 코멘트에 쉽게 흔들림",
      "마감·반복 업무를 견디는 데 에너지가 많이 듦",
      "본인 가치관과 어긋난 일은 동기가 급락",
      "본인 성과를 적극적으로 어필하기 어려움"
    ],
    companySizeFit:
      "10~50인 규모의 콘텐츠·브랜드·디자인 스튜디오가 가장 잘 맞아요. D2C 브랜드, 1인 출판/미디어, 미션 드리븐 스타트업의 UX·콘텐츠 자리, 또는 리모트 가능한 작은 에이전시도 좋은 선택입니다.",
    teamVibe:
      "취향이 일치하는 동료 2~3명과 깊게 일하는 팀이 이상적이에요. 결과물 중심의 평가, 자율적인 시간 관리, 그리고 본인 색을 드러내도 흔쾌히 받아주는 분위기여야 장기적으로 머물 수 있습니다.",
    interviewTips: [
      "본인의 \"왜\"를 이야기로 풀어 설명",
      "추상적 표현은 한 번에 한 번만 — 나머지는 사례로",
      "협업·납기 사례를 1개 챙겨 \"결과까지 책임진다\" 인상",
      "수치·반응 데이터를 1~2개 외워두기",
      "강점 + 약점 + 보완 방식을 한 세트로 준비"
    ],
    famousKoreans: ["아이유", "지민 (BTS)", "다현 (TWICE)", "도영 (NCT)", "윈터 (aespa)"],
    goodMatchMbtis: [
      { type: "ENFJ", reason: "감정·동기를 따뜻하게 끌어올려줌" },
      { type: "INFJ", reason: "가치관이 닮아 깊은 대화가 가능" },
      { type: "ENTP", reason: "안전한 곳에서 새 자극을 던져줌" }
    ],
    greenFlags: [
      "리모트/유연근무 옵션",
      "결과물 평가 중심 + 작은 팀",
      "본인 색이 묻어나는 결과물을 환영",
      "취향 맞는 동료가 있는 코어 팀",
      "조용한 작업 시간을 보장하는 문화"
    ],
    redFlags: [
      "강한 톤·즉시 피드백 문화",
      "야근·KPI 압박이 잦음",
      "회의·발표가 매일 있는 조직",
      "정량 평가만 단독으로 강조"
    ]
  },
  ENFJ: {
    roles: ["HR", "MARKETING", "SALES"],
    culture: "동료를 성장시키는 코칭·멘토링 문화",
    interpretation:
      "사람의 잠재력을 끌어내는 데 능한 타입입니다. 본인 한 명의 성과보다 \"팀이 같이 자라는 그림\"에 더 큰 만족을 느껴요. HR/People Ops, B2B 세일즈, 커뮤니티 마케팅처럼 1:1 관계가 성과로 직결되는 역할이 자연스럽게 어울립니다. 팀의 분위기·갈등·동기를 정확히 읽고 조율하는 강점이 있어, 신규 매니저·코치 트랙에서 빠르게 성장하는 편이에요.",
    strengths: [
      "사람 동기 부여와 코칭",
      "팀 내 갈등을 조율하는 정치 감각",
      "비전을 따뜻한 언어로 전달",
      "구성원의 성장 포인트를 정확히 짚어줌",
      "긴 시간의 신뢰 관계를 쌓는 끈기"
    ],
    koreanWorkplaceChallenges: [
      "관계를 너무 챙겨 본인 일정이 늦어지기도",
      "차가운 성과 평가가 본인에게 향할 때 충격이 큼",
      "타인 감정을 흡수해 빠르게 지침",
      "본인 성과보다 팀 성과만 어필해 평가에서 손해"
    ],
    companySizeFit:
      "확장기 스타트업의 People·CX·커뮤니티 팀, 그리고 중견기업의 인재 개발·HRD 트랙이 잘 맞아요. 시리즈 B~C 구간에서 People Ops 팀이 별도 본부로 분리되는 회사라면 본인 강점이 매우 빠르게 보입니다.",
    teamVibe:
      "동료의 성장을 같이 기뻐해주는 사람 중심 팀이 이상적이에요. 1on1·회고·코칭이 문화로 정착되어 있고, 리더가 \"성과 + 사람\"을 같은 비중으로 평가하는 조직이라면 본인 강점이 평가에서도 드러납니다.",
    interviewTips: [
      "팀원을 성장시킨 구체 사례를 수치와 함께",
      "본인이 받은 가장 어려운 피드백과 대응을 솔직히",
      "감정 표현은 좋되, 결과 데이터로 매듭",
      "본인이 내린 어려운 결정을 1개 챙기기",
      "본인이 \"하지 않은 일\"의 트레이드오프도 설명"
    ],
    famousKoreans: ["카이 (EXO)", "닝닝 (aespa)", "강승윤 (WINNER)", "김희철", "권은비"],
    goodMatchMbtis: [
      { type: "INFP", reason: "내 코칭이 깊이 닿는 동료" },
      { type: "ISFP", reason: "조용한 재능을 끌어내는 보람이 큼" },
      { type: "ENTJ", reason: "사람 감각을 큰 비전으로 묶어줌" }
    ],
    greenFlags: [
      "People Ops/HR 팀이 별도로 있음",
      "1on1 정기 + 코칭 문화 강조",
      "구성원 발전 트랙(시니어/리더십) 명확",
      "팀 성과와 개인 성과를 같이 평가",
      "갈등 조정·복지 정책이 문서화"
    ],
    redFlags: [
      "성과 외 요소를 완전히 배제하는 평가",
      "개인주의·각자도생 분위기",
      "감정 표현이 \"비합리\"로 비치는 팀",
      "이직률이 매우 높은 부서"
    ]
  },
  ENFP: {
    roles: ["MARKETING", "PRODUCT_MANAGER", "UI_UX_DESIGN"],
    culture: "분위기 좋고 자유로운 크리에이티브 팀",
    interpretation:
      "에너지가 풍부하고 사람과 아이디어 모두를 좋아하는 타입입니다. 새 사람·새 도메인·새 아이디어가 본인 동기의 가장 큰 연료예요. 브랜드 마케팅, 크리에이티브 PM, UX 같은 역할에서 빛나고, 분위기 좋은 팀에서 동기부여가 크게 올라갑니다. 다만 디테일·반복 마감에서는 흔들리기 쉬워, 일정 보완 동료가 옆에 있는 환경이 이상적이에요.",
    strengths: [
      "아이디어 발산과 분위기 메이킹",
      "사람·고객 인사이트에 대한 직관",
      "낯선 영역에 두려움 없이 뛰어듦",
      "사람·팀에 에너지를 옮기는 능력",
      "여러 가능성을 빠르게 연결해 새 가설을 만드는 감각"
    ],
    koreanWorkplaceChallenges: [
      "디테일·반복 업무 마감에서 흔들림",
      "관계를 너무 챙기다 본인 업무가 밀리기도",
      "흥미를 잃은 프로젝트의 마무리 동기 급락",
      "회의에서 발산만 하다 결론을 못 내는 위험"
    ],
    companySizeFit:
      "30~150인 콘텐츠·D2C·서비스 스타트업이 가장 잘 맞아요. B2C 라이프스타일·미디어·콘텐츠 회사에서 캠페인 PM·콘텐츠 리드·UX 리서처 트랙이 본인 강점을 잘 살릴 수 있는 자리입니다.",
    teamVibe:
      "에너지와 농담이 자연스럽게 오가는 캐주얼한 팀, 그리고 본인이 가설을 던지면 디테일을 챙겨줄 ISTJ/ESTJ/INTJ 동료가 있는 환경이 이상적이에요. 사람·문화에 신경 쓰는 리더가 있는 팀이면 더 좋습니다.",
    interviewTips: [
      "1개 프로젝트는 끝까지 마무리한 사례로 \"실행력\" 증명",
      "수치·KPI 한두 개는 미리 외워두기",
      "산만해 보이지 않도록 핵심 메시지 3개로 정리",
      "본인이 마감을 지키는 본인만의 방식 1개",
      "팀에 본인이 가져올 수 있는 \"에너지\"의 구체 사례"
    ],
    famousKoreans: ["진 (BTS)", "박나래", "츄 (LOONA)", "안유진 (IVE)", "정한 (SEVENTEEN)"],
    goodMatchMbtis: [
      { type: "INTJ", reason: "아이디어를 시스템으로 안착시켜줌" },
      { type: "INFJ", reason: "감정선이 닮아 깊은 협업이 가능" },
      { type: "ISTJ", reason: "내가 놓친 디테일을 챙겨줌" }
    ],
    greenFlags: [
      "분위기·문화에 신경 쓰는 팀",
      "다양한 프로젝트를 짧게 사이클",
      "리모트/유연 근무 옵션",
      "사람·콘텐츠 중심의 평가 기준",
      "PM·디자이너·콘텐츠 리드가 한 셀로 협업"
    ],
    redFlags: [
      "반복 업무 + 매일 단순 보고",
      "수직적 위계가 강한 조직",
      "회의 결과가 거의 반영되지 않는 곳",
      "성과를 정량 KPI로만 단독 평가"
    ]
  },
  ISTJ: {
    roles: ["FINANCE_ACCOUNTING", "OPERATIONS_PLANNING", "BACKEND_DEVELOPMENT"],
    culture: "프로세스와 정확성을 존중하는 안정적인 조직",
    interpretation:
      "디테일·정확성·신뢰가 핵심인 타입입니다. \"이건 어떻게 하면 다음에 또 정확히 해낼 수 있을까\"를 늘 생각하면서, 프로세스·SOP·체크리스트를 만들어 두는 편이에요. 재무·회계, 백오피스, 인프라/플랫폼 엔지니어링처럼 \"실수가 곧 사고\"인 영역에서 가장 안정적인 성과를 만듭니다. 장기근속 보상이 명확하고 평가가 정량 중심인 조직과 잘 맞아요.",
    strengths: [
      "정확성·꼼꼼함",
      "장기 신뢰 관계 유지",
      "프로세스·SOP를 만들고 지키는 힘",
      "리스크를 사전에 보는 감각",
      "약속·일정·디테일에 대한 강한 책임감"
    ],
    koreanWorkplaceChallenges: [
      "지나치게 빠른 피벗·즉흥 변경에 스트레스",
      "감정 위주 의사결정이 잦은 팀에서 답답함",
      "정해진 룰이 모호한 환경에서 동기 급락",
      "변화 자체가 큰 부담으로 작용"
    ],
    companySizeFit:
      "성숙기 스타트업·중견기업의 백오피스·인프라, 또는 대기업의 재무·회계·플랫폼 조직이 잘 맞아요. 시리즈 C~D 이상 구간 또는 상장 준비 회사에서 \"신뢰성 자체가 사업 경쟁력\"이 되는 자리가 강점입니다.",
    teamVibe:
      "역할과 책임이 명확하고 일정이 잘 지켜지는 팀이 이상적이에요. 매뉴얼·문서가 정리되어 있고, 새 멤버가 들어오면 온보딩 절차가 자동으로 돌아가는 조직이라면 본인 색이 잘 살아납니다.",
    interviewTips: [
      "본인이 만든 프로세스/SOP 1개를 자세히 설명",
      "수치·통계 기반의 신뢰성 사례 강조",
      "새 환경 적응력도 1개 챙겨 \"고지식\" 인상 회피",
      "본인이 큰 실수에서 배운 점 1개 준비",
      "정량 KPI 개선 사례를 한 줄 메시지로 정리"
    ],
    famousKoreans: ["가을 (IVE)", "정한 (SEVENTEEN)", "보아", "김희철", "강민경 (다비치)"],
    goodMatchMbtis: [
      { type: "ESFJ", reason: "디테일에 사람 케어를 더해줌" },
      { type: "ENTJ", reason: "안정감을 큰 사업으로 확장해줌" },
      { type: "ISFJ", reason: "꼼꼼함의 결이 잘 맞는 동료" }
    ],
    greenFlags: [
      "프로세스·SOP가 문서로 정리",
      "장기 근속을 보상하는 구조",
      "정확성 지표를 평가에 반영",
      "온보딩·교육이 시스템화",
      "변경 사항을 사전 공지하는 문화"
    ],
    redFlags: [
      "분기마다 피벗이 잦은 조직",
      "감정·직관 위주 의사결정",
      "역할·책임이 모호한 팀",
      "장기 근속 보상이 거의 없는 평가 시스템"
    ]
  },
  ISFJ: {
    roles: ["HR", "FINANCE_ACCOUNTING", "UI_UX_DESIGN"],
    culture: "사람을 챙기는 안정적인 백오피스 문화",
    interpretation:
      "조용히 팀을 받쳐주는 타입입니다. 본인이 앞에서 빛나기보다, 동료가 빛날 수 있도록 디테일과 분위기를 챙기는 데서 만족을 느껴요. HR·People Ops, 정산·회계, 디테일이 중요한 UI/UX 같은 영역에서 신뢰받는 사람으로 자리잡습니다. 다만 본인 공로를 적극적으로 드러내지 못해 평가에서 손해를 보는 경우가 잦아, 의식적인 자기 PR을 챙기는 게 중요해요.",
    strengths: [
      "팀의 정서적 안정감을 만들어줌",
      "약속·디테일에 대한 강한 책임감",
      "꾸준함과 인내심",
      "동료의 작은 변화를 빠르게 감지",
      "조용한 환경에서 흔들리지 않는 집중력"
    ],
    koreanWorkplaceChallenges: [
      "본인 공로를 잘 드러내지 못해 평가에서 밀리기 쉬움",
      "강한 갈등 상황에서 회피적으로 반응",
      "타인 부탁을 거절하지 못해 본인 일정이 밀림",
      "강한 톤 피드백에 쉽게 흔들림"
    ],
    companySizeFit:
      "성숙기 스타트업·중견기업의 People·서비스 운영 조직이 잘 맞아요. 시리즈 C 이상 구간의 안정된 회사에서 People Ops·정산·CS·UX 자리가 본인 강점을 길게 살릴 수 있는 트랙입니다.",
    teamVibe:
      "오랫동안 같은 동료들과 안정적으로 일하는 팀이 이상적이에요. 따뜻한 분위기, 명확한 복지·휴식 정책, 그리고 본인 공로를 옆에서 챙겨주는 ENFJ·ESFJ 동료가 있다면 매우 안정적으로 자랄 수 있습니다.",
    interviewTips: [
      "본인이 \"받친 덕분에\" 가능했던 결과를 수치로 정리",
      "갈등을 피하지 않고 조율한 사례 1개 준비",
      "자기 PR을 한 번 더 강하게 — 겸손은 인터뷰에서 손해",
      "본인의 약점을 솔직히 + 보완 노력 함께",
      "본인이 가진 \"꾸준함\"의 구체 데이터(근속, 처리량 등)"
    ],
    famousKoreans: ["사나 (TWICE)", "윈터 (aespa)", "솔라 (MAMAMOO)", "미연 ((G)I-DLE)", "정한 (SEVENTEEN)"],
    goodMatchMbtis: [
      { type: "ESFJ", reason: "사람 케어의 결이 잘 맞는 동료" },
      { type: "ESTJ", reason: "안정감을 실행 리더십으로 확장" },
      { type: "ENFJ", reason: "공로를 드러내주는 든든한 동료" }
    ],
    greenFlags: [
      "사내 분위기가 따뜻한 People 중심 조직",
      "복지·휴식 정책이 잘 정리됨",
      "선후배 멘토링 문화",
      "장기 근속이 일반적인 부서",
      "갈등을 회사 차원에서 조정해주는 시스템"
    ],
    redFlags: [
      "잦은 야근·과열된 경쟁 평가",
      "차가운 톤의 피드백 문화",
      "구성원 이탈이 잦은 팀",
      "역할이 매번 바뀌는 초기 팀"
    ]
  },
  ESTJ: {
    roles: ["OPERATIONS_PLANNING", "FINANCE_ACCOUNTING", "HR"],
    culture: "역할과 책임이 명확한 실행 중심 조직",
    interpretation:
      "구조와 책임을 좋아하는 매니저 타입입니다. 본인이 그림을 직접 그리기보다, 누군가 짠 그림을 정확히 실행하고 팀을 정렬시켜 결과를 내는 데 강해요. 운영·기획, 재무·회계, HR Operations처럼 권한과 룰이 명확한 팀에서 빠르게 실행하고 팀을 정렬시키는 데 빛납니다. 1~2년 안에 매니저 트랙이 열리는 조직이라면 강점이 평가에 빠르게 반영돼요.",
    strengths: [
      "실행과 매니지먼트",
      "룰·프로세스 정착",
      "성과 측정과 책임 분배",
      "팀의 우선순위를 명확히 정리",
      "압박 속에서도 흔들리지 않는 추진력"
    ],
    koreanWorkplaceChallenges: [
      "정해진 룰을 흔드는 즉흥 의사결정에 마찰",
      "강한 톤이 \"권위적\"으로 비치기 쉬움",
      "성과 외 요소를 평가에 잘 반영하지 못함",
      "감정 표현이 부족하다는 인상"
    ],
    companySizeFit:
      "성숙기 스타트업·중견기업의 실행·운영 리더십 자리, 또는 대기업의 운영·HR 조직과 잘 맞아요. 시리즈 C 이상에서 \"본부장 트랙\"이 명확히 열려 있는 조직이 본인 강점을 빠르게 살릴 수 있는 환경입니다.",
    teamVibe:
      "OKR과 책임 분배가 명확한 실행 중심 팀이 이상적이에요. 본인이 매니저 역할을 맡았을 때 팀원의 성장도 같이 챙길 수 있는 시스템이라면, 권위적 인상을 완화하고 장기 성과로 이어집니다.",
    interviewTips: [
      "운영·재무 KPI 개선 수치를 중심으로",
      "팀원에게 위임한 경험을 함께 어필",
      "톤은 의식적으로 살짝 부드럽게",
      "본인이 받은 가장 어려운 피드백 + 대응",
      "팀원 성장 사례 1개 챙기기"
    ],
    famousKoreans: ["보아", "강민경 (다비치)", "효린 (씨스타)", "임영웅", "정용화 (CNBLUE)"],
    goodMatchMbtis: [
      { type: "ISTJ", reason: "실행 룰을 정확히 지켜주는 동료" },
      { type: "ENFJ", reason: "딱딱한 운영에 사람 케어를 더해줌" },
      { type: "ENTJ", reason: "더 큰 그림과 권한을 같이 그려줌" }
    ],
    greenFlags: [
      "OKR/KPI가 명확히 분배된 조직",
      "리더십 트랙이 1~2년 안에 열림",
      "권한·책임이 직급으로 명확",
      "프로세스·결재 라인이 잘 정리",
      "매니저 평가 시스템이 정량+정성 균형"
    ],
    redFlags: [
      "룰을 흔드는 즉흥 의사결정이 일상",
      "성과보다 분위기·인맥 기반 평가",
      "역할이 매번 바뀌는 초기 팀",
      "권한 위임 없이 결재만 받는 구조"
    ]
  },
  ESFJ: {
    roles: ["HR", "SALES", "OPERATIONS_PLANNING"],
    culture: "팀워크와 고객 관계가 핵심인 서비스 조직",
    interpretation:
      "사람과 분위기를 챙기는 타입입니다. 본인 일정과 동료 일정이 같이 굴러가도록 챙기고, 고객과의 관계를 1년·3년·5년 단위로 길게 끌고 가는 데 강해요. CS·CX, B2B 어카운트 매니저, HR Operations처럼 \"꾸준한 관계\"가 성과로 이어지는 역할에 잘 맞습니다. 회사의 분위기 자체를 만드는 사람이 되는 경우가 많아요.",
    strengths: [
      "팀워크와 분위기 유지",
      "고객·동료 관리의 꾸준함",
      "정해진 일정·약속을 끝까지 지킴",
      "공감·중재로 갈등을 식히는 힘",
      "사내 행사·이벤트를 자연스럽게 이끌어가는 감각"
    ],
    koreanWorkplaceChallenges: [
      "비판적 피드백에 쉽게 흔들림",
      "관계 보호 때문에 어려운 결정을 미루기도",
      "본인 성과보다 팀 성과만 어필해 평가에서 손해",
      "고객·동료 요구를 거절하지 못해 본인이 지침"
    ],
    companySizeFit:
      "고객 접점이 중요한 서비스·D2C 회사, 또는 People·CS 조직이 별도로 있는 중견기업이 잘 맞아요. 시리즈 B~C의 B2C·구독 서비스 회사에서 CX·어카운트 매니저 트랙이 본인 강점을 가장 빨리 살릴 수 있는 자리입니다.",
    teamVibe:
      "동료 만족도와 고객 NPS가 둘 다 높은 팀이 이상적이에요. 사람·관계를 평가에 반영하고, 본인이 만든 \"문화\" 자체가 자산으로 인정받는 조직에서 본인 색이 가장 잘 자랍니다.",
    interviewTips: [
      "관계로 만들어낸 매출·NPS 수치를 정리",
      "본인이 내린 어려운 결정 1개를 솔직히",
      "팀 갈등 사례에서 본인 역할을 구체적으로",
      "본인 약점(거절 못함 등)에 대한 보완 노력",
      "본인 일정 관리 + 동료 챙김 균형 방식 1개"
    ],
    famousKoreans: ["호시 (SEVENTEEN)", "채영 (TWICE)", "미연 ((G)I-DLE)", "강승윤 (WINNER)", "예지 (ITZY)"],
    goodMatchMbtis: [
      { type: "ISFJ", reason: "사람 케어의 결이 똑같음" },
      { type: "ESTJ", reason: "따뜻함에 룰·구조를 더해줌" },
      { type: "ENFJ", reason: "분위기 메이커끼리 시너지" }
    ],
    greenFlags: [
      "고객 NPS·CS 만족도를 평가에 반영",
      "사내 행사·문화 활동이 활발",
      "장기 관계가 매출로 이어지는 비즈니스",
      "People·CX 조직이 별도 본부로 존재",
      "팀 성과와 개인 성과를 같이 평가"
    ],
    redFlags: [
      "차가운 톤의 즉시 피드백 문화",
      "관계 가치를 무시하는 평가 시스템",
      "고객·동료 접점이 거의 없는 백오피스",
      "이직률이 매우 높은 부서"
    ]
  },
  ISTP: {
    roles: ["SOFTWARE_DEVELOPMENT", "BACKEND_DEVELOPMENT", "OPERATIONS_PLANNING"],
    culture: "실용적이고 도구·시스템에 강한 엔지니어 팀",
    interpretation:
      "말보다 손으로 해결하는 타입입니다. 회의에서 100번 토론하는 것보다, 잠깐 직접 만들어 보여주는 게 훨씬 빠르다고 생각하는 편이에요. 도구·시스템·인프라를 다루는 엔지니어링 영역, 그리고 운영 자동화처럼 \"잘 작동하는 것\"이 곧 성과인 환경에서 강합니다. 장애 대응·SRE·툴링 트랙에서 특히 침착한 강점이 잘 살아나요.",
    strengths: [
      "도구·시스템에 대한 손맛",
      "압박 속에서도 침착한 트러블슈팅",
      "불필요한 회의를 줄이는 실용주의",
      "원리를 빠르게 파악해 손으로 검증",
      "장애·돌발 상황에서의 침착한 우선순위 판단"
    ],
    koreanWorkplaceChallenges: [
      "장황한 보고·정성적 평가에 약함",
      "관계 중심 회식 문화에 쉽게 지침",
      "감정 표현이 부족해 \"무뚝뚝하다\"는 인상",
      "본인 작업을 글로 정리하는 데 동기가 낮음"
    ],
    companySizeFit:
      "엔지니어링 문화가 강한 테크 스타트업, 또는 인프라·SRE·툴링 팀이 별도로 있는 회사가 잘 맞아요. 코드와 실험 결과로 평가받는 조직, 특히 인프라·결제·검색·플랫폼 영역이 본인 강점을 빨리 살릴 수 있는 자리입니다.",
    teamVibe:
      "코드 리뷰·실험 결과로 직접 말하는 팀이 이상적이에요. 슬랙·문서 기반의 비동기 협업이 정착되어 있고, 시니어가 \"결과로 답한다\"는 마인드를 가진 환경이라면 매우 빠르게 성장할 수 있습니다.",
    interviewTips: [
      "본인이 해결한 가장 까다로운 장애 사례 1개",
      "협업·커뮤니케이션 사례를 일부러 1개 준비",
      "보고서·문서화 노력을 보여주면 큰 가산점",
      "본인이 \"안 하기로 결정한 일\"의 트레이드오프 설명",
      "마감·우선순위를 본인 방식으로 어떻게 관리하는지"
    ],
    famousKoreans: ["V (BTS)", "G-Dragon (BIGBANG)", "청하", "도경수 (D.O./EXO)", "카이 (EXO)"],
    goodMatchMbtis: [
      { type: "ESTP", reason: "현장 감각을 영업·BD로 확장해줌" },
      { type: "INTJ", reason: "손맛을 장기 설계로 묶어줌" },
      { type: "ISTJ", reason: "안정성·문서화를 같이 챙겨줌" }
    ],
    greenFlags: [
      "코드 리뷰·실험 결과 중심 평가",
      "회의보다 슬랙/문서 비동기 협업",
      "장애 대응 후 회고 문화",
      "기술 결정을 엔지니어가 주도",
      "툴·자동화에 투자하는 조직"
    ],
    redFlags: [
      "주간 보고서·정성 평가가 핵심",
      "보고 라인이 길고 직접 만남 위주",
      "기술 결정을 비기술 관리자가 좌우",
      "코드 리뷰가 형식적이거나 없는 팀"
    ]
  },
  ISFP: {
    roles: ["UI_UX_DESIGN", "MARKETING", "FRONTEND_DEVELOPMENT"],
    culture: "감각과 결과물을 존중하는 디자인 중심 문화",
    interpretation:
      "감각적으로 만들고 표현하는 데 강한 타입입니다. 추상적 설명보다, 본인이 직접 만든 결과물로 \"이런 분위기를 원했어요\"라고 보여주는 게 훨씬 자연스러워요. 프로덕트 디자인, 콘텐츠·브랜드, 인터랙티브 프런트엔드처럼 \"만든 게 곧 결과\"인 역할에서 자기다움을 발휘합니다. 강한 톤보다는 조용한 몰입·취향이 통하는 팀에서 본인 색이 가장 길게 갑니다.",
    strengths: [
      "감각적인 결과물",
      "팀의 톤·결을 자연스럽게 잡음",
      "조용한 몰입과 끈기",
      "사용자 감정선에 대한 섬세함",
      "디테일과 마무리에 대한 자존심"
    ],
    koreanWorkplaceChallenges: [
      "강한 톤·즉시 결정 압박에 쉽게 흔들림",
      "본인 성과를 적극적으로 어필하기 어려움",
      "공식 발표·PT 자리에서 큰 부담",
      "마이크로매니징·일일 보고에 빠르게 지침"
    ],
    companySizeFit:
      "디자인·콘텐츠 중심의 스튜디오형 조직, 또는 D2C·라이프스타일 브랜드의 디자인·F/E 팀이 잘 맞아요. 10~50인 규모의 코어 팀에서 본인 색이 살아나는 결과물을 빠르게 출시할 수 있는 자리가 이상적입니다.",
    teamVibe:
      "취향이 맞는 동료와 결과물로 대화하는 팀이 이상적이에요. 결과물 중심 평가, 자율적인 시간, 그리고 본인 색을 살려주는 디자인 리드가 있는 조직이라면 길게 머물 수 있습니다.",
    interviewTips: [
      "본인 포트폴리오의 \"왜\"를 짧고 명확하게",
      "협업·납기 사례를 1개 챙겨 \"감각만 있다\" 인상 차단",
      "수치·반응 데이터 한두 개를 함께",
      "본인이 받은 어려운 피드백 + 본인 처리 방식",
      "본인이 \"안 만든 디자인\"의 트레이드오프 설명"
    ],
    famousKoreans: ["뷔 (BTS)", "윈터 (aespa)", "정채연", "사쿠라 (LE SSERAFIM)", "강슬기 (Red Velvet)"],
    goodMatchMbtis: [
      { type: "ESFJ", reason: "감각을 사람과 분위기로 확장해줌" },
      { type: "ENFP", reason: "조용한 색을 밝게 밀어줌" },
      { type: "INFP", reason: "취향과 결이 잘 맞는 동료" }
    ],
    greenFlags: [
      "결과물 중심 평가 + 자율 근무",
      "디자이너·크리에이터를 존중하는 문화",
      "취향이 맞는 작은 코어 팀",
      "조용한 작업 시간을 보장",
      "본인 색이 살아나는 결과물을 환영"
    ],
    redFlags: [
      "강한 톤의 즉시 피드백 문화",
      "마이크로매니징 + 일일 보고",
      "공식 발표·PT가 자주 있는 조직",
      "정량 KPI만 단독으로 평가"
    ]
  },
  ESTP: {
    roles: ["SALES", "MARKETING", "OPERATIONS_PLANNING"],
    culture: "기회를 빠르게 잡는 영업·그로스 조직",
    interpretation:
      "현장에서 빠르게 판단하고 움직이는 타입입니다. 회의실에서 90% 확신을 만들기보다, 현장에서 60% 확신으로 빠르게 실행하고 다음 사이클로 가는 데 강해요. 신규 사업 BD, B2B 세일즈, 그로스 마케팅처럼 \"속도가 성과\"인 영역에서 자연스럽게 빛납니다. 본인 KPI가 곧 다음 기회로 이어지는 구조에서 동기부여가 가장 커요.",
    strengths: [
      "현장 판단력과 추진력",
      "고객 접점에서의 친화력",
      "리스크를 두려워하지 않는 실행",
      "변화·돌발에 빠르게 적응",
      "수치·매출 임팩트로 본인 가치를 증명"
    ],
    koreanWorkplaceChallenges: [
      "장기 계획·정밀 분석 업무에서 흥미가 떨어짐",
      "충동적 결정으로 평가가 갈리기도",
      "보고·문서화에 동기가 빠르게 빠짐",
      "동료의 디테일 챙김 부재 시 본인이 다 떠안을 위험"
    ],
    companySizeFit:
      "확장기 스타트업의 BD·세일즈·신사업 라인, 그리고 영업 인센티브 구조가 명확한 중견·대기업 신사업팀이 잘 맞아요. 시리즈 A~C의 B2B SaaS·D2C·라이프스타일 회사에서 신규 라인 BD/세일즈 자리가 본인 강점을 빨리 살릴 수 있는 트랙입니다.",
    teamVibe:
      "현장과 데이터를 둘 다 보는 빠른 팀이 이상적이에요. 본인이 잡은 기회를 빠르게 다음 단계로 넘겨줄 ISTJ/ESTJ 동료가 있는 환경, 그리고 성과가 곧 다음 기회로 이어지는 구조면 본인 색이 가장 잘 살아납니다.",
    interviewTips: [
      "수치·매출 임팩트가 큰 사례 위주로",
      "장기 데이터 기반 결정 사례도 1개 챙기기",
      "충동적 인상이 들지 않도록 톤을 한 단계 낮추기",
      "본인이 끝까지 책임진 프로젝트 사례",
      "본인이 \"안 한 결정\"의 이유 + 트레이드오프"
    ],
    famousKoreans: ["박재범", "도경수 (D.O./EXO)", "카리나 (aespa)", "청하", "닝닝 (aespa)"],
    goodMatchMbtis: [
      { type: "ISTP", reason: "현장 감각이 비슷한 짝꿍" },
      { type: "ENTJ", reason: "현장 임팩트를 사업으로 확장해줌" },
      { type: "ENFJ", reason: "거친 톤에 따뜻함을 더해줌" }
    ],
    greenFlags: [
      "현장 권한 위임 + 즉시 보상",
      "리스크 감수를 인정해주는 평가",
      "성과가 곧 다음 기회로 이어지는 구조",
      "영업 인센티브 구조가 명확",
      "신규 라인 launch 권한이 팀 단위"
    ],
    redFlags: [
      "장기 계획만 강조하고 즉시 실행은 막힘",
      "보고·근태 관리만 평가의 핵심",
      "결정 권한이 전부 상위 라인",
      "성과 보상이 1년 단위로 늦게 반영"
    ]
  },
  ESFP: {
    roles: ["MARKETING", "SALES", "UI_UX_DESIGN"],
    culture: "에너지 넘치는 브랜드·콘텐츠 팀",
    interpretation:
      "사람과 분위기 자체가 결과인 타입입니다. 본인이 들어간 자리는 자연스럽게 분위기가 살고, 그 에너지가 곧 캠페인·이벤트·세일즈의 결과로 이어져요. 브랜드·콘텐츠 마케팅, 오프라인 이벤트, B2C 세일즈, 인터랙티브 UX에서 본인 매력을 그대로 일로 옮길 수 있습니다. 다만 혼자 분석하는 업무에서는 흔들리기 쉬워, 데이터·디테일을 챙겨줄 동료와 한 팀을 이루는 게 중요해요.",
    strengths: [
      "사람·분위기를 끌어올리는 에너지",
      "현장에서의 빠른 적응력",
      "고객의 즐거움을 디자인하는 감각",
      "사람과 사람을 연결하는 친화력",
      "분위기·문화 자체를 만드는 영향력"
    ],
    koreanWorkplaceChallenges: [
      "디테일·반복 업무에서 빠르게 흥미를 잃음",
      "장기 데이터 기반 분석에서 흔들림",
      "혼자 진행하는 업무에서 동기 급락",
      "성과를 정량 KPI로 정리하는 데 어려움"
    ],
    companySizeFit:
      "B2C·라이프스타일·콘텐츠 중심 스타트업, 또는 D2C 브랜드·미디어 회사가 잘 맞아요. 시리즈 A~C 구간의 회사에서 캠페인 PM·콘텐츠 리드·B2C 세일즈 자리가 본인 강점을 빨리 살릴 수 있는 트랙입니다.",
    teamVibe:
      "에너지와 친밀감이 자연스러운 팀이 이상적이에요. 본인이 분위기를 만들면, 데이터·디테일을 챙겨줄 ISTJ/INTJ 동료가 옆에 있는 구조라면 시너지가 매우 큽니다.",
    interviewTips: [
      "오프라인 행사·캠페인 사례를 수치와 함께",
      "데이터 분석 사례 1개를 일부러 챙겨 \"산만하다\" 인상 차단",
      "본인이 끝까지 책임진 프로젝트를 어필",
      "본인 약점(분석 등) + 보완 노력 함께 설명",
      "사람·문화 임팩트를 한 줄 메시지로 정리"
    ],
    famousKoreans: ["지수 (BLACKPINK)", "사나 (TWICE)", "츄 (LOONA)", "미연 ((G)I-DLE)", "박나래"],
    goodMatchMbtis: [
      { type: "ISFP", reason: "결과물·감각의 결이 잘 맞음" },
      { type: "ENFJ", reason: "에너지를 사람 성장으로 확장" },
      { type: "ESFJ", reason: "분위기 메이커끼리 시너지" }
    ],
    greenFlags: [
      "이벤트·오프라인 활동이 잦은 팀",
      "B2C 고객 접점이 핵심인 비즈니스",
      "분위기 메이커를 인정해주는 평가",
      "캠페인·콘텐츠 사이클이 짧은 조직",
      "PM·디자이너·콘텐츠 리드가 한 셀로 협업"
    ],
    redFlags: [
      "혼자 진행하는 분석 위주 업무",
      "데이터·수치에 강박이 큰 팀",
      "관계·분위기를 평가에서 배제",
      "정량 KPI만 단독으로 평가"
    ]
  }
};

export function isMbtiType(value: string): value is MbtiType {
  return MBTI_TYPES.includes(value as MbtiType);
}

export function getMbtiProfile(type: MbtiType): MbtiProfile {
  return MBTI_PROFILE[type];
}

// Returns the per-(type, role) one-liner, or a soft fallback.
export function getMatchReason(type: MbtiType, role: RoleCode | string | null | undefined): string {
  if (!role) return MBTI_PROFILE[type].culture;
  const table = ROLE_MATCH_REASON[type];
  return table[role as RoleCode] ?? MBTI_PROFILE[type].culture;
}

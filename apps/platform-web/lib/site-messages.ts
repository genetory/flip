import { getBrowserLocale, type PlatformLocale } from "./auth-messages";

const siteMessages = {
  ko: {
    footer: {
      brandDescription: "글로벌 인재와 기업을 연결하는 커리어 플랫폼.",
      columns: [
        { title: "Platform", items: ["포지션 탐색", "매칭 가능성", "운영 방식", "사례"] },
        { title: "Resources", items: ["사례", "FAQ", "블로그", "고객지원"] },
        { title: "Company", items: ["기업 소개", "채용", "문의", "이용약관"] }
      ],
      rights: "All rights reserved.",
      tagline: "Apply your next move."
    },
    hero: {
      badge: "2026 신규 기수 모집중",
      titleTop: "글로벌 인재와 기업을",
      titleAccent: "연결하는 커리어 플랫폼",
      description:
        "기업은 맞는 인재를 찾고, 학생은 기회를 준비해요.\n채용부터 실무경험, 매칭 준비까지 한 곳에서.",
      primaryCta: "포지션 알아보기",
      secondaryCta: "매칭 가능성 보러가기",
      positionsLink: "현재 모집 중인 포지션 보기",
      companyDashboard: "기업 대시보드",
      companyStatus: "Active",
      stats: [
        { label: "오픈 포지션", value: "4" },
        { label: "후보자", value: "37" },
        { label: "인터뷰", value: "12" }
      ],
      recommendedPositions: "추천 포지션",
      positionsPanelTitle: "포지션 탐색",
      positionsPanelSortLabel: "추천 매칭순",
      positionThumbnailAltSuffix: "포지션 썸네일",
      sampleLocation: "Seoul",
      sampleWorkType: "Hybrid",
      positionRows: [
        { company: "Lumen", role: "Product Design Intern", tag: "Design" },
        { company: "Northwave", role: "Global Marketing Asst.", tag: "Marketing" },
        { company: "Orbit AI", role: "AI Operations Associate", tag: "Operations" }
      ],
      companyPanelEyebrow: "Company",
      companyPanelPartnerLabel: "파트너 기업",
      companyPanelIndustryLabel: "산업군",
      companyPanelIndustryValue: "IT",
      companyPanelSizeLabel: "회사 규모",
      companyPanelSizeValue: "30인 이하",
      companyPanelOpenPositionsLabel: "진행 중 포지션",
      companyPanelOpenPositionsValue: "3개",
      companyPanelWorkTypeLabel: "근무 형태",
      companyPanelWorkTypeValue: "Remote · Hybrid",
      openLabel: "Open",
      studentProfile: "학생 프로필",
      profileProgress: "프로필 완성도",
      readinessLabel: "매칭 준비도 높음",
      recommendationLabel: "추천 7",
      liveMatching: "Live matching"
    },
    positions: {
      liveLabel: "Live",
      title: "지금 모집 중인 포지션",
      description: "Aply에서 지금 지원할 수 있는 포지션이에요.",
      viewAll: "전체 포지션 보기",
      foreignerEligible: "외국인 지원 가능",
      details: "자세히 보기",
      detailAriaSuffix: "상세보기",
      thumbnailAltSuffix: "썸네일",
      saveAriaLabel: "저장",
      applyCta: "지원하기",
      loadingLabel: "포지션을 불러오는 중...",
      partnerRecruitAlt: "기업 포지션 등록 안내",
      defaultCompanyName: "파트너 기업",
      defaultCategory: "직무 미정",
      defaultLocation: "협의",
      workTypeOnsite: "On-site",
      workTypeRemote: "Remote",
      workTypeHybrid: "Hybrid",
      partnerTitle: "우리 기업도 포지션 등록하기",
      partnerDescription: "파트너로 참여하고 준비된 후보자를 추천받으세요.",
      partnerCta: "파트너로 시작하기",
      items: [
        {
          company: "H ******** Inc.",
          initial: "H",
          role: "Social media manager, Marketing Team Assistant 모집",
          category: "Marketing",
          location: "협의",
          workType: "On-site",
          start: "채용 시",
          badge: "New"
        },
        {
          company: "H******** Labs",
          initial: "H",
          role: "Business Development, Education Market Research 모집",
          category: "Research, Business",
          location: "협의",
          workType: "On-site",
          start: "채용 시",
          badge: "New"
        },
        {
          company: "g*****b",
          initial: "G",
          role: "중문번역업무 모집",
          category: "Translation",
          location: "협의",
          workType: "On-site",
          start: "채용 시",
          badge: "New"
        },
        {
          company: "(주)한*********업",
          initial: "한",
          role: "Tech Support, QA, R&D 모집",
          category: "IT/Software engineering",
          location: "협의",
          workType: "On-site",
          start: "채용 시",
          badge: "New"
        },
        {
          company: "주식회사 크**",
          initial: "크",
          role: "기계공학 / R&D 모집",
          category: "Engineering(Mechanical, Electrical, etc,.)",
          location: "협의",
          workType: "On-site",
          start: "채용 시",
          badge: "New"
        }
      ]
    },
    studentProfile: {
      sectionLabel: "For Students",
      titleTop: "프로필을 채울수록",
      titleBottom: "기회가 더 많아져요",
      description:
        "기본 정보만 입력해도 바로 시작할 수 있어요.\n프로필을 더 채울수록 더 많은 기업과 포지션을 만날 수 있어요.",
      statusBadge: "매칭 준비도 높음",
      completionLabel: "프로필 완성도",
      recommendationsLabel: "추천 가능한 포지션",
      unlockedLabel: "프로필 완성도를 올리면 매칭 가능성이 올라가요",
      profileMeta: "서울대 · Marketing",
      highlights: [
        "지금 나랑 맞는 포지션 바로 확인",
        "항목 추가하면 추천 포지션 즉시 확대",
        "기업이 보기 쉬운 프로필 자동 정리"
      ],
      cta: "내 프로필 시작하기",
      checklist: [
        { label: "기본 정보", done: true },
        { label: "학력 / 전공", done: true },
        { label: "언어 능력", done: true },
        { label: "포트폴리오 업로드", done: false },
        { label: "희망 직무 선택", done: true },
        { label: "근무 가능 일정", done: false },
        { label: "비자 / 체류 상태", done: false }
      ]
    },
    businessValue: {
      sectionLabel: "For Business",
      titleTop: "더 빠르게, 더 적합한",
      titleBottom: "글로벌 인재를 만나보세요",
      description: "이력서만 보지 않고 실무 준비도와 한국 업무 적응 가능성까지 함께 확인해 채용 리스크를 줄여드려요.",
      primaryCta: "기업 상담하기",
      secondaryCta: "기업 운영 방식 보기",
      cards: [
        {
          title: "실무 준비도 검증",
          description:
            "전공, 언어, 직무 역량뿐 아니라 실제 과제 수행 이력과 준비 상태를 함께 확인합니다. 단순 스펙 비교가 아니라, 현재 포지션에 바로 기여할 수 있는 후보자를 더 빠르게 선별할 수 있습니다."
        },
        {
          title: "한국 업무 핏 확인",
          description:
            "비즈니스 커뮤니케이션 방식, 협업 태도, 보고/피드백 적응력까지 함께 봅니다. 인터뷰 전 단계에서 한국 조직 문화와의 적합도를 미리 확인해, 채용 이후 온보딩 리스크를 줄일 수 있습니다."
        },
        {
          title: "객관적 리포트 제공",
          description:
            "후보자별 강점, 보완점, 수행 성과를 정리한 리포트를 제공합니다. 채용 담당자와 현업 매니저가 같은 기준으로 빠르게 판단할 수 있어, 면접 의사결정과 피드백 커뮤니케이션이 훨씬 쉬워집니다."
        },
        {
          title: "채용 전환까지 연결",
          description:
            "포지션 등록부터 매칭, 면접 조율, 합류 초기 온보딩까지 한 흐름으로 이어집니다. 글로벌 채용 경험이 적은 팀도 복잡한 운영 부담을 줄이고, 실제 채용 전환까지 안정적으로 진행할 수 있습니다."
        }
      ]
    },
    howItWorks: {
      sectionLabel: "How it works",
      title: "Aply는 이렇게 작동합니다",
      steps: [
        {
          num: "01",
          title: "기업이 포지션을 등록합니다",
          description: "직무, 필요 역량, 근무 형태, 일정 등 채용에 필요한 기준을 구조화해 입력합니다."
        },
        {
          num: "02",
          title: "학생이 프로필을 완성합니다",
          description: "학력, 언어, 관심 직무, 비자·체류 상태를 입력하면 매칭 준비도와 추천 포지션이 바로 업데이트됩니다."
        },
        {
          num: "03",
          title: "Aply가 적합한 연결을 돕습니다",
          description: "후보자의 준비 상태와 기업의 조건을 함께 분석해, 우선 검토할 인재와 포지션을 정확도 높게 연결합니다."
        },
        {
          num: "04",
          title: "운영과 진행을 관리합니다",
          description: "인터뷰 일정, 합류 진행, 실무경험 단계, 피드백 기록까지 한 화면에서 추적하고 관리할 수 있습니다."
        }
      ]
    },
    scenario: {
      sectionLabel: "Process",
      studentTitle: "학생은 이렇게 기회를 넓혀가요",
      companyTitle: "기업은 이렇게 후보자를 만나게 돼요",
      studentDescription: "가입부터 지원까지, 준비도를 높일수록 더 많은 기회를 만날 수 있어요.",
      companyDescription: "포지션 등록부터 인터뷰 연결까지, 채용 진행을 한 흐름으로 관리합니다.",
      studentImageAlt: "학생 관점 시나리오 이미지",
      companyImageAlt: "기업 관점 시나리오 이미지",
      tabs: { student: "학생 관점", company: "기업 관점" },
      studentSteps: ["간단 가입", "기본 프로필 입력", "추천 포지션 확인", "추가 입력으로 기회 확대", "지원 후 면접 진행 및 결과 확인"],
      studentStepSubtitles: [
        "몇 분 안에 가입을 완료하고 바로 시작할 수 있어요.",
        "핵심 프로필 정보를 입력해 기본 매칭을 준비해요.",
        "내 프로필에 맞는 추천 포지션을 바로 확인해요.",
        "추가 정보를 입력해 더 다양한 기회를 열어가요.",
        "지원을 시작하고 실제 매칭 과정을 진행해요."
      ],
      companySteps: ["포지션 등록", "조건에 맞는 학생 풀 확인", "준비도 높은 학생 우선 검토", "면접 진행 및 결과 입력", "진행 상태 관리"],
      companyStepSubtitles: [
        "직무와 조건을 등록해 채용 기준을 명확히 설정해요.",
        "조건에 맞는 학생 후보 풀을 빠르게 확인할 수 있어요.",
        "준비도가 높은 후보자를 우선 순위로 검토해요.",
        "진행 단계를 한눈에 보며 상태를 계속 관리해요.",
        "면접부터 운영까지 실행 단계를 자연스럽게 연결해요."
      ]
    },
    cases: {
      sectionLabel: "Cases",
      title: "기업 사례 / 성과",
      resultsEyebrow: "Proven Results",
      resultsTitle: "말로만 약속하지 않아요.",
      resultsSubtitle: "숫자로 확실하게 보여드려요.",
      stats: [
        { value: "200+", label: "누적 매칭 성공" },
        { value: "100+", label: "파트너 기업 수" },
        { value: "4.5/5.0", label: "학생 만족도" },
        { value: "4.8/5.0", label: "기업 만족도" }
      ],
      cards: [
        {
          tag: "Startup · Marketing",
          title: "Northwave — 글로벌 마케팅 포지션 운영",
          quote: "준비도 높은 학생을 빠르게 검토할 수 있어, 채용 사이클이 절반으로 줄었습니다.",
          by: "People Lead, Northwave"
        },
        {
          tag: "Enterprise · Operations",
          title: "Acme Global — 외국인 학생 인턴 매칭",
          quote: "비자, 언어, 직무 적합도까지 한 번에 확인할 수 있는 점이 가장 좋았습니다.",
          by: "Talent Manager, Acme"
        },
        {
          tag: "Student · Career",
          title: "Mei L. — 실무 경험 후 취업 연계",
          quote: "프로필을 채울수록 실제로 추천이 늘어났고, 첫 글로벌 커리어를 시작했어요.",
          by: "MA in Marketing, Seoul"
        }
      ]
    },
    testimonials: {
      sectionLabel: "Testimonials",
      title: "선배들의 진짜 후기",
      items: [
        {
          quote: "처음엔 어디서 시작해야 할지 막막했는데, 프로필 단계별 안내 덕분에 준비 방향이 명확해졌어요.",
          by: "김OO · 경영학과",
          avatar: "/avatar_testimonial_kim.svg"
        },
        {
          quote: "지원 전에 내 강점과 보완점을 정리해볼 수 있어서 면접에서도 훨씬 자신 있게 이야기할 수 있었어요.",
          by: "Tran N. · Marketing Track",
          avatar: "/avatar_testimonial_tran.svg"
        },
        {
          quote: "추천 포지션이 실제 관심 직무와 잘 맞았고, 지원 과정도 간단해서 빠르게 도전할 수 있었습니다.",
          by: "이OO · 컴퓨터공학과",
          avatar: "/avatar_testimonial_lee.svg"
        }
      ]
    },
    faq: {
      sectionLabel: "FAQ",
      title: "자주 묻는 질문",
      description: "더 궁금한 점이 있다면 기업 상담으로 운영팀에 편하게 문의해 주세요.",
      tabs: {
        company: "기업용 질문답변",
        student: "학생용 질문답변"
      },
      companyItems: [
        {
          question: "Q. 프로그램 기간은 어떻게 되나요?",
          answer:
            "프로그램 기간은 기본 4주이며, 기업과 참여자 상황에 따라 5주까지 조정 가능합니다. 구체적인 일정은 매칭 확정 후 조율됩니다."
        },
        {
          question: "Q. 참여자가 성실히 참여하지 않으면 어떻게 하나요?",
          answer:
            "참여자가 무단으로 결석하거나 프로그램에 성실히 참여하지 않는 경우, 플리퍼스 담당자에게 즉시 알려주세요. 상황에 따라 프로그램 조기 종료를 검토합니다."
        },
        {
          question: "Q. 법적으로 문제될 소지가 있지는 않나요?",
          answer:
            "- 저희 프로그램은 교육 목적의 '실무 체험 프로그램'으로 운영되고 있기에 학생들은 근로자가 아니며, 따라서 급여나 근로 계약도 해당하지 않는 부분입니다.\n- 이에 따라 현금성 대가 지급이 불가하며, 비현금성으로 학생들의 점심 식사만 식권 지급 혹은 식비 지불의 방식으로 지원해주시기를 안내드리고 있습니다.\n- 관련 내용 노무사, 변호사 자문으로 검토 마쳐 교육생 200명 이상 매칭하고, 서울시 산하 서울글로벌센터 및 대학교들과 문제 없이 프로그램 운영하고 있습니다."
        },
        {
          question: "Q. 프로그램 후 참여자를 채용할 수 있나요?",
          answer:
            "가능합니다. 프로그램 종료 후 기업에서 직접 채용 제안을 하실 수 있으며, 이 경우 플리퍼스에 알려주시면 됩니다."
        },
        {
          question: "Q. 추가 인재 매칭이 가능한가요?",
          answer:
            "가능합니다. celine@flip-ers.com 으로 문의해주시면 추가 인재를 매칭해드립니다."
        }
      ],
      studentItems: [
        {
          question: "Q. 무급 인턴십은 불법으로 알고 있는데, 법적으로 문제는 없는 건가요?",
          answer:
            "해당 프로그램을 통한 활동은 '근로'가 아닌, 교육 목적의 '직무 체험' 프로그램입니다. 정규업무 대체가 아닌 체험 중심의 활동을 제공하는 것이므로 법적으로 문제 없음을 확인하였습니다."
        },
        {
          question: "Q. 추천서 발급은 누가 결정하나요?",
          answer:
            "전적으로 직무 체험에 참여한 기업이 결정합니다. 플리퍼스는 전혀 개입하지 않고 있습니다."
        },
        {
          question: "Q. 점심 식대는 어떤 식으로 지원받나요?",
          answer:
            "점심 식대는 담당자가 직접 결제 하거나, 회사 법인 카드가 지급됩니다.\n부득이한 경우 개인 카드로 결제 후 영수증을 전달하면 회사에서 비용을 돌려주는 방식으로도 진행됩니다."
        }
      ]
    },
    finalCta: {
      companyTitleTop: "글로벌 인재 채용,",
      companyTitleBottom: "지금 바로 시작해보세요",
      companyDescription: "포지션 등록이나 파트너 상담으로 준비된 후보자를 만나보세요.",
      companyCta: "파트너로 시작하기",
      studentTitleTop: "내 프로필 만들고",
      studentTitleBottom: "기회를 바로 확인해보세요",
      studentDescription: "프로필을 완성하면 추천 포지션이 바로 열려요.",
      studentCta: "내 매칭 가능성 확인하기"
    }
  },
  en: {
    footer: {
      brandDescription: "A career platform connecting global talent and companies.",
      columns: [
        { title: "Platform", items: ["Explore Positions", "Match Potential", "How It Works", "Cases"] },
        { title: "Resources", items: ["Cases", "FAQ", "Blog", "Support"] },
        { title: "Company", items: ["About", "Careers", "Contact", "Terms"] }
      ],
      rights: "All rights reserved.",
      tagline: "Apply your next move."
    },
    hero: {
      badge: "Now recruiting for 2026 cohort",
      titleTop: "Connecting global talent",
      titleAccent: "with companies",
      description:
        "Companies find the right talent, and students prepare for real opportunities.\nFrom hiring and work experience to matching readiness, all in one place.",
      primaryCta: "Explore positions",
      secondaryCta: "See match potential",
      positionsLink: "View currently open positions",
      companyDashboard: "Company dashboard",
      companyStatus: "Active",
      stats: [
        { label: "Open positions", value: "4" },
        { label: "Candidates", value: "37" },
        { label: "Interviews", value: "12" }
      ],
      recommendedPositions: "Recommended positions",
      positionsPanelTitle: "Position Explorer",
      positionsPanelSortLabel: "Best match",
      positionThumbnailAltSuffix: "position thumbnail",
      sampleLocation: "Seoul",
      sampleWorkType: "Hybrid",
      positionRows: [
        { company: "Lumen", role: "Product Design Intern", tag: "Design" },
        { company: "Northwave", role: "Global Marketing Asst.", tag: "Marketing" },
        { company: "Orbit AI", role: "AI Operations Associate", tag: "Operations" }
      ],
      companyPanelEyebrow: "Company",
      companyPanelPartnerLabel: "Partner company",
      companyPanelIndustryLabel: "Sector",
      companyPanelIndustryValue: "IT",
      companyPanelSizeLabel: "Company size",
      companyPanelSizeValue: "Under 30 employees",
      companyPanelOpenPositionsLabel: "Active positions",
      companyPanelOpenPositionsValue: "3",
      companyPanelWorkTypeLabel: "Work type",
      companyPanelWorkTypeValue: "Remote · Hybrid",
      openLabel: "Open",
      studentProfile: "Student profile",
      profileProgress: "Profile completion",
      readinessLabel: "High match readiness",
      recommendationLabel: "Recommended 7",
      liveMatching: "Live matching"
    },
    positions: {
      liveLabel: "Live",
      title: "Currently open positions",
      description: "Positions provided by Aply.",
      viewAll: "View all positions",
      foreignerEligible: "International applicants welcome",
      details: "View details",
      detailAriaSuffix: "View details",
      thumbnailAltSuffix: "thumbnail",
      saveAriaLabel: "Save",
      applyCta: "Apply",
      loadingLabel: "Loading positions...",
      partnerRecruitAlt: "Company position registration guide",
      defaultCompanyName: "Partner company",
      defaultCategory: "Unspecified role",
      defaultLocation: "TBD",
      workTypeOnsite: "On-site",
      workTypeRemote: "Remote",
      workTypeHybrid: "Hybrid",
      partnerTitle: "Register your company position too",
      partnerDescription: "Join as a partner and get recommendations for ready candidates.",
      partnerCta: "Start as a partner",
      items: [
        {
          company: "H ******** Inc.",
          initial: "H",
          role: "Social media manager, Marketing Team Assistant opening",
          category: "Marketing",
          location: "To be discussed",
          workType: "On-site",
          start: "Upon hiring",
          badge: "New"
        },
        {
          company: "H******** Labs",
          initial: "H",
          role: "Business Development, Education Market Research opening",
          category: "Research, Business",
          location: "To be discussed",
          workType: "On-site",
          start: "Upon hiring",
          badge: "New"
        },
        {
          company: "g*****b",
          initial: "G",
          role: "Chinese translation opening",
          category: "Translation",
          location: "To be discussed",
          workType: "On-site",
          start: "Upon hiring",
          badge: "New"
        },
        {
          company: "(Ltd.) K**************",
          initial: "K",
          role: "Tech Support, QA, R&D opening",
          category: "IT/Software engineering",
          location: "To be discussed",
          workType: "On-site",
          start: "Upon hiring",
          badge: "New"
        },
        {
          company: "C****** Co., Ltd.",
          initial: "C",
          role: "Mechanical Engineering / R&D opening",
          category: "Engineering (Mechanical, Electrical, etc.)",
          location: "To be discussed",
          workType: "On-site",
          start: "Upon hiring",
          badge: "New"
        }
      ]
    },
    studentProfile: {
      sectionLabel: "For Students",
      titleTop: "The more you complete your profile,",
      titleBottom: "the more opportunities open up",
      description:
        "You can start with basic information.\nAs you complete more profile fields, more companies and positions become available.",
      statusBadge: "High match readiness",
      completionLabel: "Profile completion",
      recommendationsLabel: "Recommended positions available",
      unlockedLabel: "Improve profile completion to increase match potential",
      profileMeta: "SNU · Marketing",
      highlights: [
        "Check positions that fit you right away",
        "Expand recommended positions instantly by adding more fields",
        "Automatically organize your profile for easier company review"
      ],
      cta: "Start my profile",
      checklist: [
        { label: "Basic information", done: true },
        { label: "Education / major", done: true },
        { label: "Language proficiency", done: true },
        { label: "Portfolio upload", done: false },
        { label: "Preferred role", done: true },
        { label: "Available schedule", done: false },
        { label: "Visa / residency status", done: false }
      ]
    },
    businessValue: {
      sectionLabel: "For Business",
      titleTop: "Find better-fit",
      titleBottom: "global talent faster",
      description: "Reduce hiring risk by checking practical readiness and Korean workplace adaptability, not resumes alone.",
      primaryCta: "Book a company consultation",
      secondaryCta: "See business operations",
      cards: [
        {
          title: "Practical readiness verified",
          description:
            "Review not only major, language, and role competency, but also real task history and readiness. Instead of comparing specs alone, you can shortlist candidates who can contribute to the current role from day one."
        },
        {
          title: "Korean workplace fit",
          description:
            "Assess business communication style, collaboration behavior, and reporting/feedback adaptability. Validating fit with Korean workplace culture before deeper interviews helps reduce post-hire onboarding risk."
        },
        {
          title: "Objective reports provided",
          description:
            "Get reports that summarize each candidate's strengths, improvement areas, and performance results. Hiring managers and interviewers can align faster on common criteria and communicate clearer interview decisions and feedback."
        },
        {
          title: "Connected through hiring conversion",
          description:
            "Run position posting, matching, interview coordination, and early onboarding in one flow. Even teams with limited global hiring experience can reduce operational burden and move to stable hiring conversion."
        }
      ]
    },
    howItWorks: {
      sectionLabel: "How it works",
      title: "How Aply works",
      steps: [
        {
          num: "01",
          title: "Companies register positions",
          description: "Enter structured hiring criteria such as role, required competency, work format, and timeline."
        },
        {
          num: "02",
          title: "Students complete profiles",
          description: "When students enter education, language, role interest, and visa/residency status, match readiness and recommended positions update instantly."
        },
        {
          num: "03",
          title: "Aply supports better-fit connections",
          description: "Aply analyzes candidate readiness and company conditions together to connect priority candidates and positions with higher precision."
        },
        {
          num: "04",
          title: "Manage operations and progress",
          description: "Track and manage interviews, joining progress, work-experience stages, and feedback in one place."
        }
      ]
    },
    scenario: {
      sectionLabel: "Process",
      studentTitle: "How students expand opportunities",
      companyTitle: "How companies meet candidates",
      studentDescription: "From signup to application, stronger readiness opens more opportunities.",
      companyDescription: "From position posting to interview connection, manage hiring in one flow.",
      studentImageAlt: "Student-view scenario image",
      companyImageAlt: "Company-view scenario image",
      tabs: { student: "Student view", company: "Company view" },
      studentSteps: ["Quick signup", "Enter basic profile", "Check recommended positions", "Unlock more with additional inputs", "Apply and proceed to interviews/results"],
      studentStepSubtitles: [
        "Complete signup in minutes and get started right away.",
        "Enter core profile details to prepare your initial matching setup.",
        "See recommended positions that match your profile right away.",
        "Add more information to unlock a wider range of opportunities.",
        "Start applying and proceed through real matching steps."
      ],
      companySteps: ["Register position", "Review condition-matched student pool", "Prioritize high-readiness candidates", "Run interviews and record results", "Manage progress status"],
      companyStepSubtitles: [
        "Set clear hiring criteria by registering role and condition details.",
        "Quickly review the student candidate pool that matches your conditions.",
        "Prioritize candidates with higher readiness first.",
        "Track status clearly while continuously managing each step.",
        "Connect interview and operations steps into one natural flow."
      ]
    },
    cases: {
      sectionLabel: "Cases",
      title: "Company cases / outcomes",
      resultsEyebrow: "Proven Results",
      resultsTitle: "No empty promises.",
      resultsSubtitle: "Proven with numbers.",
      stats: [
        { value: "200+", label: "Cumulative successful matches" },
        { value: "100+", label: "Number of partner companies" },
        { value: "4.5/5.0", label: "Student satisfaction" },
        { value: "4.8/5.0", label: "Company satisfaction" }
      ],
      cards: [
        {
          tag: "Startup · Marketing",
          title: "Northwave — Global marketing position operations",
          quote: "We could review high-readiness students quickly, cutting our hiring cycle in half.",
          by: "People Lead, Northwave"
        },
        {
          tag: "Enterprise · Operations",
          title: "Acme Global — International student intern matching",
          quote: "The best part was checking visa, language, and role fit in one place.",
          by: "Talent Manager, Acme"
        },
        {
          tag: "Student · Career",
          title: "Mei L. — From practical work experience to hiring connection",
          quote: "As I completed my profile, recommendations increased and I started my first global career.",
          by: "MA in Marketing, Seoul"
        }
      ]
    },
    testimonials: {
      sectionLabel: "Testimonials",
      title: "Real reviews from seniors",
      items: [
        {
          quote: "I was unsure where to start, but the step-by-step profile flow made my preparation plan clear.",
          by: "K** · Business Administration",
          avatar: "/avatar_testimonial_kim.svg"
        },
        {
          quote: "Reviewing my strengths and gaps before applying helped me speak with much more confidence in interviews.",
          by: "Tran N. · Marketing Track",
          avatar: "/avatar_testimonial_tran.svg"
        },
        {
          quote: "The recommended positions matched my actual interests, and the application process felt simple and fast.",
          by: "L. Lee · Computer Science",
          avatar: "/avatar_testimonial_lee.svg"
        }
      ]
    },
    faq: {
      sectionLabel: "FAQ",
      title: "Frequently asked questions",
      description: "If you have more questions, you can contact the operations team directly through company consultation.",
      tabs: {
        company: "Company Q&A",
        student: "Student Q&A"
      },
      companyItems: [
        {
          question: "Q. How long is the program period?",
          answer:
            "The standard program period is 4 weeks and can be adjusted up to 5 weeks depending on company and participant circumstances. Detailed schedules are coordinated after matching is confirmed."
        },
        {
          question: "Q. What if a participant does not engage sincerely?",
          answer:
            "If a participant is absent without notice or does not engage sincerely in the program, please inform the Flipers manager immediately. Depending on the situation, early termination of the program may be reviewed."
        },
        {
          question: "Q. Are there any legal concerns?",
          answer:
            "- This program is operated as an educational practical work-experience program, so participants are not workers, and wages or labor contracts do not apply.\n- Accordingly, cash compensation is not allowed. Instead, we guide companies to provide only non-cash lunch support (meal vouchers or meal expense coverage).\n- This model has been reviewed with labor and legal advisors. We have matched over 200 trainees and have operated the program without issues with the Seoul Global Center and universities under the Seoul Metropolitan Government."
        },
        {
          question: "Q. Can we hire participants after the program?",
          answer:
            "Yes. After the program ends, companies can directly make hiring offers to participants. In that case, please inform Flipers."
        },
        {
          question: "Q. Is additional talent matching available?",
          answer:
            "Yes. Please contact celine@flip-ers.com and we can provide additional talent matching."
        }
      ],
      studentItems: [
        {
          question: "Q. I heard unpaid internships are illegal. Is this legally safe?",
          answer:
            "Activities in this program are not classified as labor. They are educational job-experience programs. Since participation is designed as experience-based learning rather than replacing regular work, we have confirmed there are no legal issues."
        },
        {
          question: "Q. Who decides whether I receive a recommendation letter?",
          answer:
            "The decision is made entirely by the company where you participated in the job-experience program. Flipers does not intervene in that decision."
        },
        {
          question: "Q. How is lunch support provided?",
          answer:
            "Lunch expenses are either paid directly by the manager or covered with a company corporate card.\nIf needed, you may pay with a personal card first and submit a receipt for reimbursement."
        }
      ]
    },
    finalCta: {
      companyTitleTop: "Start hiring global talent",
      companyTitleBottom: "today",
      companyDescription: "Meet ready candidates through position posting or partner consultation.",
      companyCta: "Start as a partner",
      studentTitleTop: "Build your profile",
      studentTitleBottom: "and discover opportunities",
      studentDescription: "Complete your profile to unlock recommended positions instantly.",
      studentCta: "Check my match potential"
    }
  }
} as const;

export function getSiteMessages(locale: PlatformLocale = getBrowserLocale()) {
  return siteMessages[locale];
}

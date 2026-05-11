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

const siteMessagesZhCn = {
  ...siteMessages.en,
  footer: {
    ...siteMessages.en.footer,
    brandDescription: "连接全球人才与企业的职业平台。",
    columns: [
      { title: "平台", items: ["职位探索", "匹配可能性", "运作方式", "案例"] },
      { title: "资源", items: ["案例", "常见问题", "博客", "客服支持"] },
      { title: "公司", items: ["公司介绍", "招聘", "联系我们", "使用条款"] }
    ]
  },
  hero: {
    ...siteMessages.en.hero,
    badge: "2026 届正在招募中",
    titleTop: "连接全球人才",
    titleAccent: "与企业的职业平台",
    description: "企业找到合适的人才，学生准备真实机会。\n从招聘、实务经验到匹配准备，一站式完成。",
    primaryCta: "查看职位",
    secondaryCta: "查看匹配可能性",
    positionsLink: "查看当前招聘中的职位",
    companyDashboard: "企业仪表盘",
    stats: [
      { label: "开放职位", value: "4" },
      { label: "候选人", value: "37" },
      { label: "面试", value: "12" }
    ],
    recommendedPositions: "推荐职位",
    positionsPanelTitle: "职位探索",
    positionsPanelSortLabel: "最佳匹配",
    positionThumbnailAltSuffix: "职位缩略图",
    companyPanelEyebrow: "公司",
    companyPanelPartnerLabel: "合作企业",
    companyPanelIndustryLabel: "行业",
    companyPanelSizeLabel: "公司规模",
    companyPanelSizeValue: "30人以下",
    companyPanelOpenPositionsLabel: "进行中的职位",
    companyPanelOpenPositionsValue: "3 个",
    companyPanelWorkTypeLabel: "工作形式",
    studentProfile: "学生档案",
    profileProgress: "档案完成度",
    readinessLabel: "高匹配准备度",
    recommendationLabel: "推荐 7"
  },
  positions: {
    ...siteMessages.en.positions,
    title: "当前招聘中的职位",
    description: "由 Aply 提供的可申请职位。",
    viewAll: "查看全部职位",
    foreignerEligible: "欢迎国际申请者",
    details: "查看详情",
    detailAriaSuffix: "查看详情",
    thumbnailAltSuffix: "缩略图",
    saveAriaLabel: "保存",
    applyCta: "立即申请",
    loadingLabel: "正在加载职位...",
    partnerRecruitAlt: "企业职位登记指南",
    defaultCompanyName: "合作企业",
    defaultCategory: "职位待定",
    defaultLocation: "待协商",
    partnerTitle: "为你的公司也发布职位",
    partnerDescription: "以合作伙伴身份加入，获得已准备好的候选人推荐。",
    partnerCta: "开始成为合作伙伴",
    items: [
      {
        company: "H ******** Inc.",
        initial: "H",
        role: "招聘 Social Media Manager 与 Marketing Team Assistant",
        category: "Marketing",
        location: "待协商",
        workType: "On-site",
        start: "随到随聘",
        badge: "New"
      },
      {
        company: "H******** Labs",
        initial: "H",
        role: "招聘 Business Development、Education Market Research",
        category: "Research, Business",
        location: "待协商",
        workType: "On-site",
        start: "随到随聘",
        badge: "New"
      },
      {
        company: "g*****b",
        initial: "G",
        role: "招聘中文翻译岗位",
        category: "Translation",
        location: "待协商",
        workType: "On-site",
        start: "随到随聘",
        badge: "New"
      },
      {
        company: "(Ltd.) K**************",
        initial: "K",
        role: "招聘 Tech Support、QA、R&D",
        category: "IT/Software engineering",
        location: "待协商",
        workType: "On-site",
        start: "随到随聘",
        badge: "New"
      },
      {
        company: "C****** Co., Ltd.",
        initial: "C",
        role: "招聘机械工程 / R&D",
        category: "Engineering (Mechanical, Electrical, etc.)",
        location: "待协商",
        workType: "On-site",
        start: "随到随聘",
        badge: "New"
      }
    ]
  },
  studentProfile: {
    ...siteMessages.en.studentProfile,
    titleTop: "档案越完整，",
    titleBottom: "机会越多",
    description: "只需填写基础信息即可开始。\n补充越多，能看到的企业与职位越多。",
    statusBadge: "高匹配准备度",
    completionLabel: "档案完成度",
    recommendationsLabel: "可推荐职位数",
    unlockedLabel: "提升档案完成度可提高匹配可能性",
    profileMeta: "首尔大学 · Marketing",
    cta: "开始完善我的档案",
    highlights: [
      "立即查看适合我的职位",
      "补充信息后即时扩展推荐职位",
      "自动整理为企业易读的档案"
    ],
    checklist: [
      { label: "基本信息", done: true },
      { label: "学历 / 专业", done: true },
      { label: "语言能力", done: true },
      { label: "上传作品集", done: false },
      { label: "意向职位", done: true },
      { label: "可工作时间", done: false },
      { label: "签证 / 居留状态", done: false }
    ]
  },
  businessValue: {
    ...siteMessages.en.businessValue,
    titleTop: "更快找到",
    titleBottom: "更匹配的全球人才",
    description: "不仅看简历，还同时评估实务准备度与韩国职场适应力，降低招聘风险。",
    primaryCta: "预约企业咨询",
    secondaryCta: "查看企业运作方式",
    cards: [
      {
        title: "实务准备度验证",
        description:
          "不仅评估专业、语言与职务能力，还会同时查看实际任务执行经历与准备状态。比起单纯比较履历条件，能更快筛选出可立即贡献于当前职位的候选人。"
      },
      {
        title: "韩国职场契合度确认",
        description:
          "评估商务沟通方式、协作态度，以及汇报与反馈的适应能力。在面试前阶段确认与韩国组织文化的契合度，降低入职后的 onboarding 风险。"
      },
      {
        title: "提供客观报告",
        description:
          "提供包含每位候选人优势、待补强项与执行成果的报告。招聘负责人与业务经理可基于同一标准做出更快判断，让面试决策与反馈沟通更顺畅。"
      },
      {
        title: "衔接至录用转化",
        description:
          "从职位发布、匹配、面试协调到入职初期 onboarding 一气呵成。即使是缺乏全球招聘经验的团队，也能减少运营负担，稳定推进至实际录用。"
      }
    ]
  },
  howItWorks: {
    ...siteMessages.en.howItWorks,
    title: "Aply 如何运作",
    steps: [
      {
        num: "01",
        title: "企业登记职位",
        description: "以结构化方式输入岗位、所需能力、工作形式与时间安排等招聘标准。"
      },
      {
        num: "02",
        title: "学生完善档案",
        description: "学生输入学历、语言、感兴趣的职务以及签证 / 居留状态后，匹配准备度与推荐职位即时更新。"
      },
      {
        num: "03",
        title: "Aply 协助合适的连结",
        description: "综合分析候选人的准备状态与企业的条件，以更高精度连结优先审查的人才与职位。"
      },
      {
        num: "04",
        title: "运营与进度管理",
        description: "面试日程、入职进度、实务经验阶段与反馈记录，可在同一画面中追踪与管理。"
      }
    ]
  },
  scenario: {
    ...siteMessages.en.scenario,
    studentTitle: "学生如何扩大机会",
    companyTitle: "企业如何遇见候选人",
    studentDescription: "从注册到申请，准备度越高，机会越多。",
    companyDescription: "从职位发布到面试衔接，用一条流程管理招聘。",
    tabs: { student: "学生视角", company: "企业视角" },
    studentSteps: ["快速注册", "填写基本档案", "查看推荐职位", "补充信息扩大机会", "申请并参加面试 / 确认结果"],
    studentStepSubtitles: [
      "几分钟内完成注册即可立刻开始。",
      "输入核心档案信息，准备好初步匹配。",
      "立即查看适合我档案的推荐职位。",
      "补充更多信息，开启更多元的机会。",
      "开始申请并完成实际匹配过程。"
    ],
    companySteps: ["登记职位", "查看符合条件的学生人才库", "优先审查准备度高的学生", "进行面试并记录结果", "管理进展状态"],
    companyStepSubtitles: [
      "登记岗位与条件，明确招聘标准。",
      "可快速查看符合条件的学生候选人才库。",
      "优先审查准备度更高的候选人。",
      "一目了然地追踪状态，并持续管理每个步骤。",
      "自然地衔接面试到运营的执行环节。"
    ]
  },
  cases: {
    ...siteMessages.en.cases,
    title: "企业案例 / 成果",
    resultsTitle: "不止口头承诺。",
    resultsSubtitle: "用数据证明。",
    stats: [
      { value: "200+", label: "累计成功匹配" },
      { value: "100+", label: "合作企业数量" },
      { value: "4.5/5.0", label: "学生满意度" },
      { value: "4.8/5.0", label: "企业满意度" }
    ],
    cards: [
      {
        tag: "Startup · Marketing",
        title: "Northwave — 全球营销职位运营",
        quote: "可以快速审查准备度高的学生，招聘周期缩短了一半。",
        by: "People Lead, Northwave"
      },
      {
        tag: "Enterprise · Operations",
        title: "Acme Global — 国际学生实习匹配",
        quote: "最棒的是签证、语言与职位契合度可以一次性确认。",
        by: "Talent Manager, Acme"
      },
      {
        tag: "Student · Career",
        title: "Mei L. — 实习经验衔接至正式录用",
        quote: "档案越完整推荐越多，开启了我第一段全球职业。",
        by: "MA in Marketing, Seoul"
      }
    ]
  },
  testimonials: {
    ...siteMessages.en.testimonials,
    title: "真实前辈评价",
    items: [
      {
        quote: "一开始不知道从哪里开始，多亏档案的分步引导，让我的准备方向变得清晰。",
        by: "K** · 经营学专业",
        avatar: "/avatar_testimonial_kim.svg"
      },
      {
        quote: "申请前能整理出我的优势与不足，让我在面试中更有自信地表达。",
        by: "Tran N. · Marketing Track",
        avatar: "/avatar_testimonial_tran.svg"
      },
      {
        quote: "推荐的职位与我真正感兴趣的方向很契合，申请流程也简单快速。",
        by: "L. Lee · 计算机工程专业",
        avatar: "/avatar_testimonial_lee.svg"
      }
    ]
  },
  faq: {
    ...siteMessages.en.faq,
    title: "常见问题",
    description: "如果你有更多问题，欢迎通过企业咨询联系运营团队。",
    tabs: { company: "企业问答", student: "学生问答" },
    companyItems: [
      {
        question: "Q. 项目周期是多久？",
        answer:
          "项目基本周期为 4 周，可根据企业与参与者的情况调整至 5 周。具体日程将在匹配确定后协商。"
      },
      {
        question: "Q. 如果参与者没有认真参与该怎么办？",
        answer:
          "如果参与者无故缺席或未认真参与项目，请立即告知 Flipers 负责人。视情况会评估是否提前结束项目。"
      },
      {
        question: "Q. 是否存在法律方面的隐患？",
        answer:
          "- 我们的项目以教育为目的，作为「实务体验项目」运营，参与者并非劳动者，因此不涉及薪资或劳动合同。\n- 据此不可支付现金性报酬，仅可以非现金方式（餐券或餐费补助）为学生提供午餐支持。\n- 相关内容已经劳务师与律师咨询审查，目前已匹配 200 名以上学员，并与首尔市辖下的首尔国际中心及多所大学合作运营，未出现任何问题。"
      },
      {
        question: "Q. 项目结束后可以录用参与者吗？",
        answer:
          "可以。项目结束后，企业可直接向参与者发出录用邀约，请同时通知 Flipers。"
      },
      {
        question: "Q. 是否可以追加人才匹配？",
        answer:
          "可以。请联系 celine@flip-ers.com，我们将为您追加匹配人才。"
      }
    ],
    studentItems: [
      {
        question: "Q. 据说无薪实习是违法的，法律上没问题吗？",
        answer:
          "本项目下的活动并非「劳动」，而是以教育为目的的「职务体验」项目。我们提供的是体验导向的活动，并不替代正式工作，已确认无法律问题。"
      },
      {
        question: "Q. 推荐信由谁决定是否发放？",
        answer:
          "完全由参与职务体验的企业决定，Flipers 不参与其中。"
      },
      {
        question: "Q. 午餐费如何支持？",
        answer:
          "午餐费由负责人直接结账，或使用公司法人卡支付。\n如有不便，也可先用个人卡结账后提交收据，由公司报销。"
      }
    ]
  },
  finalCta: {
    ...siteMessages.en.finalCta,
    companyTitleTop: "现在开始招聘全球人才",
    companyTitleBottom: "",
    companyDescription: "通过职位发布或合作咨询，遇见已准备好的候选人。",
    companyCta: "开始成为合作伙伴",
    studentTitleTop: "完善我的档案",
    studentTitleBottom: "并发现更多机会",
    studentDescription: "完善档案后即可立即解锁推荐职位。",
    studentCta: "查看我的匹配可能性"
  }
} as unknown as typeof siteMessages.en;

const siteMessagesVi = {
  ...siteMessages.en,
  footer: {
    ...siteMessages.en.footer,
    brandDescription: "Nền tảng nghề nghiệp kết nối nhân tài toàn cầu với doanh nghiệp.",
    columns: [
      { title: "Nền tảng", items: ["Khám phá vị trí", "Khả năng phù hợp", "Cách vận hành", "Case study"] },
      { title: "Tài nguyên", items: ["Case study", "FAQ", "Blog", "Hỗ trợ"] },
      { title: "Doanh nghiệp", items: ["Giới thiệu", "Tuyển dụng", "Liên hệ", "Điều khoản"] }
    ]
  },
  hero: {
    ...siteMessages.en.hero,
    badge: "Đang tuyển cho kỳ 2026",
    titleTop: "Nền tảng nghề nghiệp",
    titleAccent: "kết nối nhân tài toàn cầu với doanh nghiệp",
    description: "Doanh nghiệp tìm đúng nhân tài, sinh viên chuẩn bị đúng cơ hội.\nTừ tuyển dụng, trải nghiệm thực tế đến sẵn sàng matching - tất cả trong một nền tảng.",
    primaryCta: "Khám phá vị trí",
    secondaryCta: "Xem khả năng phù hợp",
    positionsLink: "Xem các vị trí đang tuyển",
    companyDashboard: "Bảng điều khiển doanh nghiệp",
    stats: [
      { label: "Vị trí mở", value: "4" },
      { label: "Ứng viên", value: "37" },
      { label: "Phỏng vấn", value: "12" }
    ],
    recommendedPositions: "Vị trí đề xuất",
    positionsPanelTitle: "Khám phá vị trí",
    positionsPanelSortLabel: "Phù hợp nhất",
    positionThumbnailAltSuffix: "ảnh thu nhỏ vị trí",
    companyPanelEyebrow: "Doanh nghiệp",
    companyPanelPartnerLabel: "Doanh nghiệp đối tác",
    companyPanelIndustryLabel: "Ngành",
    companyPanelSizeLabel: "Quy mô công ty",
    companyPanelSizeValue: "Dưới 30 nhân viên",
    companyPanelOpenPositionsLabel: "Vị trí đang mở",
    companyPanelOpenPositionsValue: "3",
    companyPanelWorkTypeLabel: "Hình thức làm việc",
    studentProfile: "Hồ sơ sinh viên",
    profileProgress: "Mức hoàn thiện hồ sơ",
    readinessLabel: "Sẵn sàng matching cao",
    recommendationLabel: "Đề xuất 7"
  },
  positions: {
    ...siteMessages.en.positions,
    title: "Các vị trí đang tuyển",
    description: "Các vị trí có thể ứng tuyển trên Aply.",
    viewAll: "Xem tất cả vị trí",
    foreignerEligible: "Chấp nhận ứng viên quốc tế",
    details: "Xem chi tiết",
    detailAriaSuffix: "Xem chi tiết",
    thumbnailAltSuffix: "ảnh thu nhỏ",
    saveAriaLabel: "Lưu",
    applyCta: "Ứng tuyển",
    loadingLabel: "Đang tải vị trí...",
    partnerRecruitAlt: "Hướng dẫn đăng vị trí cho doanh nghiệp",
    defaultCompanyName: "Doanh nghiệp đối tác",
    defaultCategory: "Chưa xác định vị trí",
    defaultLocation: "Trao đổi",
    partnerTitle: "Đăng vị trí cho doanh nghiệp của bạn",
    partnerDescription: "Tham gia với vai trò đối tác và nhận gợi ý ứng viên đã sẵn sàng.",
    partnerCta: "Bắt đầu với tư cách đối tác",
    items: [
      {
        company: "H ******** Inc.",
        initial: "H",
        role: "Tuyển Social Media Manager, Marketing Team Assistant",
        category: "Marketing",
        location: "Trao đổi",
        workType: "On-site",
        start: "Tuyển ngay",
        badge: "New"
      },
      {
        company: "H******** Labs",
        initial: "H",
        role: "Tuyển Business Development, Education Market Research",
        category: "Research, Business",
        location: "Trao đổi",
        workType: "On-site",
        start: "Tuyển ngay",
        badge: "New"
      },
      {
        company: "g*****b",
        initial: "G",
        role: "Tuyển vị trí biên dịch tiếng Trung",
        category: "Translation",
        location: "Trao đổi",
        workType: "On-site",
        start: "Tuyển ngay",
        badge: "New"
      },
      {
        company: "(Ltd.) K**************",
        initial: "K",
        role: "Tuyển Tech Support, QA, R&D",
        category: "IT/Software engineering",
        location: "Trao đổi",
        workType: "On-site",
        start: "Tuyển ngay",
        badge: "New"
      },
      {
        company: "C****** Co., Ltd.",
        initial: "C",
        role: "Tuyển Kỹ thuật Cơ khí / R&D",
        category: "Engineering (Mechanical, Electrical, etc.)",
        location: "Trao đổi",
        workType: "On-site",
        start: "Tuyển ngay",
        badge: "New"
      }
    ]
  },
  studentProfile: {
    ...siteMessages.en.studentProfile,
    titleTop: "Hồ sơ càng đầy đủ,",
    titleBottom: "cơ hội càng nhiều",
    description: "Bạn có thể bắt đầu ngay với thông tin cơ bản.\nCàng hoàn thiện hồ sơ, càng mở ra nhiều doanh nghiệp và vị trí hơn.",
    statusBadge: "Sẵn sàng matching cao",
    completionLabel: "Mức hoàn thiện hồ sơ",
    recommendationsLabel: "Số vị trí được đề xuất",
    unlockedLabel: "Tăng mức hoàn thiện hồ sơ để tăng khả năng matching",
    profileMeta: "ĐH Quốc gia Seoul · Marketing",
    cta: "Bắt đầu hồ sơ của tôi",
    highlights: [
      "Xem ngay vị trí phù hợp với tôi",
      "Bổ sung thông tin để mở rộng đề xuất ngay lập tức",
      "Tự động sắp xếp hồ sơ giúp doanh nghiệp dễ đánh giá"
    ],
    checklist: [
      { label: "Thông tin cơ bản", done: true },
      { label: "Học vấn / Chuyên ngành", done: true },
      { label: "Năng lực ngoại ngữ", done: true },
      { label: "Tải lên portfolio", done: false },
      { label: "Vị trí mong muốn", done: true },
      { label: "Lịch có thể làm việc", done: false },
      { label: "Tình trạng visa / lưu trú", done: false }
    ]
  },
  businessValue: {
    ...siteMessages.en.businessValue,
    titleTop: "Tìm nhân tài toàn cầu",
    titleBottom: "phù hợp nhanh hơn",
    description: "Giảm rủi ro tuyển dụng bằng cách đánh giá mức sẵn sàng thực tế và khả năng thích nghi môi trường làm việc Hàn Quốc, không chỉ dựa trên CV.",
    primaryCta: "Đặt lịch tư vấn doanh nghiệp",
    secondaryCta: "Xem cách vận hành",
    cards: [
      {
        title: "Xác minh mức sẵn sàng thực tế",
        description:
          "Không chỉ đánh giá chuyên ngành, ngoại ngữ hay năng lực vị trí, mà còn xem xét lịch sử thực hiện task và mức độ chuẩn bị thực tế. Thay vì chỉ so sánh hồ sơ, bạn có thể nhanh chóng tìm ra ứng viên có thể đóng góp ngay cho vị trí hiện tại."
      },
      {
        title: "Xác nhận độ phù hợp với môi trường Hàn Quốc",
        description:
          "Đánh giá phong cách giao tiếp công việc, thái độ hợp tác, khả năng thích nghi với cách báo cáo và phản hồi. Xác minh độ phù hợp với văn hoá doanh nghiệp Hàn Quốc trước khi phỏng vấn sâu giúp giảm rủi ro onboarding sau khi nhận."
      },
      {
        title: "Báo cáo khách quan",
        description:
          "Cung cấp báo cáo tổng hợp điểm mạnh, điểm cần cải thiện và kết quả thực hiện của từng ứng viên. Người tuyển dụng và quản lý nghiệp vụ có thể đánh giá theo cùng một tiêu chuẩn, giúp ra quyết định và phản hồi sau phỏng vấn dễ dàng hơn."
      },
      {
        title: "Liền mạch tới chuyển đổi tuyển dụng",
        description:
          "Từ đăng vị trí, matching, sắp xếp phỏng vấn đến onboarding ban đầu — tất cả trong một luồng. Ngay cả các đội nhóm ít kinh nghiệm tuyển dụng toàn cầu cũng có thể giảm gánh nặng vận hành và ổn định chuyển đổi sang tuyển dụng thực tế."
      }
    ]
  },
  howItWorks: {
    ...siteMessages.en.howItWorks,
    title: "Aply hoạt động như thế nào",
    steps: [
      {
        num: "01",
        title: "Doanh nghiệp đăng vị trí",
        description: "Nhập tiêu chí tuyển dụng theo cấu trúc: vị trí, năng lực yêu cầu, hình thức làm việc và lịch trình."
      },
      {
        num: "02",
        title: "Sinh viên hoàn thiện hồ sơ",
        description: "Khi sinh viên nhập học vấn, ngoại ngữ, vị trí quan tâm và tình trạng visa / lưu trú, mức sẵn sàng matching và vị trí đề xuất sẽ cập nhật ngay."
      },
      {
        num: "03",
        title: "Aply hỗ trợ kết nối phù hợp",
        description: "Aply phân tích đồng thời mức sẵn sàng của ứng viên và điều kiện của doanh nghiệp để kết nối ưu tiên với độ chính xác cao."
      },
      {
        num: "04",
        title: "Quản lý vận hành và tiến trình",
        description: "Theo dõi và quản lý lịch phỏng vấn, tiến trình gia nhập, các giai đoạn trải nghiệm thực tế và ghi chú phản hồi trong cùng một màn hình."
      }
    ]
  },
  scenario: {
    ...siteMessages.en.scenario,
    studentTitle: "Sinh viên mở rộng cơ hội như thế nào",
    companyTitle: "Doanh nghiệp gặp ứng viên như thế nào",
    studentDescription: "Từ đăng ký đến ứng tuyển, mức sẵn sàng càng cao thì cơ hội càng rộng mở.",
    companyDescription: "Từ đăng vị trí đến kết nối phỏng vấn, quản lý tuyển dụng trong một luồng.",
    tabs: { student: "Góc nhìn sinh viên", company: "Góc nhìn doanh nghiệp" },
    studentSteps: ["Đăng ký nhanh", "Nhập hồ sơ cơ bản", "Xem vị trí đề xuất", "Bổ sung để mở rộng cơ hội", "Ứng tuyển và tham gia phỏng vấn / xem kết quả"],
    studentStepSubtitles: [
      "Hoàn tất đăng ký trong vài phút và bắt đầu ngay.",
      "Nhập thông tin hồ sơ cốt lõi để chuẩn bị thiết lập matching ban đầu.",
      "Xem ngay các vị trí phù hợp với hồ sơ của bạn.",
      "Bổ sung thông tin để mở khoá nhiều cơ hội đa dạng hơn.",
      "Bắt đầu ứng tuyển và đi qua các bước matching thực tế."
    ],
    companySteps: ["Đăng vị trí", "Xem pool sinh viên phù hợp điều kiện", "Ưu tiên xét duyệt sinh viên có mức sẵn sàng cao", "Tiến hành phỏng vấn và ghi nhận kết quả", "Quản lý trạng thái tiến độ"],
    companyStepSubtitles: [
      "Đăng vị trí và điều kiện để xác lập tiêu chí tuyển dụng rõ ràng.",
      "Kiểm tra nhanh pool ứng viên sinh viên phù hợp điều kiện.",
      "Ưu tiên ứng viên có mức sẵn sàng cao hơn.",
      "Theo dõi trạng thái rõ ràng và tiếp tục quản lý từng bước.",
      "Liên kết các bước phỏng vấn và vận hành thành một luồng tự nhiên."
    ]
  },
  cases: {
    ...siteMessages.en.cases,
    title: "Case study / Kết quả doanh nghiệp",
    resultsTitle: "Không chỉ là lời hứa.",
    resultsSubtitle: "Được chứng minh bằng số liệu.",
    stats: [
      { value: "200+", label: "Số lượt matching thành công tích luỹ" },
      { value: "100+", label: "Số doanh nghiệp đối tác" },
      { value: "4.5/5.0", label: "Mức hài lòng của sinh viên" },
      { value: "4.8/5.0", label: "Mức hài lòng của doanh nghiệp" }
    ],
    cards: [
      {
        tag: "Startup · Marketing",
        title: "Northwave — Vận hành vị trí marketing toàn cầu",
        quote: "Có thể xét duyệt nhanh các sinh viên có mức sẵn sàng cao, chu kỳ tuyển dụng giảm còn một nửa.",
        by: "People Lead, Northwave"
      },
      {
        tag: "Enterprise · Operations",
        title: "Acme Global — Matching thực tập sinh quốc tế",
        quote: "Điều tuyệt nhất là có thể xác nhận visa, ngoại ngữ và độ phù hợp công việc trong cùng một nơi.",
        by: "Talent Manager, Acme"
      },
      {
        tag: "Student · Career",
        title: "Mei L. — Từ trải nghiệm thực tế đến kết nối tuyển dụng",
        quote: "Khi tôi hoàn thiện hồ sơ, các đề xuất tăng lên và tôi đã bắt đầu sự nghiệp toàn cầu đầu tiên của mình.",
        by: "MA in Marketing, Seoul"
      }
    ]
  },
  testimonials: {
    ...siteMessages.en.testimonials,
    title: "Đánh giá thực tế từ các anh / chị đi trước",
    items: [
      {
        quote: "Lúc đầu tôi không biết bắt đầu từ đâu, nhờ hướng dẫn theo từng bước trong hồ sơ mà phương hướng chuẩn bị trở nên rõ ràng.",
        by: "K** · Quản trị Kinh doanh",
        avatar: "/avatar_testimonial_kim.svg"
      },
      {
        quote: "Việc tổng hợp được điểm mạnh và điểm cần cải thiện trước khi ứng tuyển giúp tôi tự tin hơn nhiều khi phỏng vấn.",
        by: "Tran N. · Marketing Track",
        avatar: "/avatar_testimonial_tran.svg"
      },
      {
        quote: "Vị trí đề xuất rất khớp với mối quan tâm thực tế của tôi và quy trình ứng tuyển cũng đơn giản, nhanh chóng.",
        by: "L. Lee · Khoa học Máy tính",
        avatar: "/avatar_testimonial_lee.svg"
      }
    ]
  },
  faq: {
    ...siteMessages.en.faq,
    title: "Câu hỏi thường gặp",
    description: "Nếu cần thêm thông tin, bạn có thể liên hệ đội vận hành qua tư vấn doanh nghiệp.",
    tabs: { company: "Hỏi đáp doanh nghiệp", student: "Hỏi đáp sinh viên" },
    companyItems: [
      {
        question: "Q. Thời gian chương trình kéo dài bao lâu?",
        answer:
          "Chương trình có thời gian cơ bản là 4 tuần và có thể điều chỉnh đến 5 tuần tuỳ theo tình hình của doanh nghiệp và người tham gia. Lịch trình cụ thể sẽ được trao đổi sau khi xác nhận matching."
      },
      {
        question: "Q. Nếu người tham gia không tham gia nghiêm túc thì sao?",
        answer:
          "Nếu người tham gia vắng mặt không lý do hoặc không tham gia nghiêm túc, vui lòng thông báo ngay cho người phụ trách Flipers. Tuỳ tình hình, có thể xem xét kết thúc chương trình sớm."
      },
      {
        question: "Q. Có vấn đề gì về mặt pháp lý không?",
        answer:
          "- Chương trình của chúng tôi vận hành như một \"chương trình trải nghiệm thực tế\" với mục đích giáo dục, vì vậy người tham gia không phải là người lao động và không áp dụng lương hay hợp đồng lao động.\n- Theo đó, không thể chi trả thù lao bằng tiền mặt; chúng tôi hướng dẫn doanh nghiệp chỉ hỗ trợ bữa trưa dưới hình thức không phải tiền mặt (phiếu ăn hoặc chi phí ăn trưa).\n- Nội dung này đã được tham vấn và rà soát bởi chuyên gia luật lao động và luật sư. Chúng tôi đã matching hơn 200 học viên và vận hành chương trình ổn định cùng Trung tâm Toàn cầu Seoul và các trường đại học trực thuộc Chính quyền thành phố Seoul."
      },
      {
        question: "Q. Sau chương trình, có thể tuyển dụng người tham gia không?",
        answer:
          "Có thể. Sau khi chương trình kết thúc, doanh nghiệp có thể trực tiếp đưa ra lời mời tuyển dụng đến người tham gia. Trong trường hợp này, vui lòng thông báo cho Flipers."
      },
      {
        question: "Q. Có thể matching thêm nhân tài không?",
        answer:
          "Có. Vui lòng liên hệ celine@flip-ers.com, chúng tôi sẽ matching thêm nhân tài cho bạn."
      }
    ],
    studentItems: [
      {
        question: "Q. Tôi nghe nói thực tập không lương là bất hợp pháp. Có vấn đề về pháp lý không?",
        answer:
          "Hoạt động thông qua chương trình này không phải là \"lao động\" mà là \"chương trình trải nghiệm công việc\" với mục đích giáo dục. Vì đây là hoạt động trải nghiệm thay vì thay thế công việc chính thức, chúng tôi đã xác nhận không có vấn đề pháp lý."
      },
      {
        question: "Q. Ai quyết định việc cấp thư giới thiệu?",
        answer:
          "Hoàn toàn do doanh nghiệp nơi bạn tham gia trải nghiệm công việc quyết định. Flipers không can thiệp vào quyết định này."
      },
      {
        question: "Q. Hỗ trợ tiền ăn trưa được chi trả như thế nào?",
        answer:
          "Tiền ăn trưa được người phụ trách thanh toán trực tiếp hoặc thanh toán bằng thẻ pháp nhân của công ty.\nNếu cần, bạn có thể thanh toán bằng thẻ cá nhân trước rồi nộp hoá đơn để công ty hoàn lại chi phí."
      }
    ]
  },
  finalCta: {
    ...siteMessages.en.finalCta,
    companyTitleTop: "Bắt đầu tuyển dụng nhân tài toàn cầu",
    companyTitleBottom: "ngay hôm nay",
    companyDescription: "Gặp ứng viên đã sẵn sàng qua đăng vị trí hoặc tư vấn đối tác.",
    companyCta: "Bắt đầu với tư cách đối tác",
    studentTitleTop: "Hoàn thiện hồ sơ",
    studentTitleBottom: "và khám phá cơ hội",
    studentDescription: "Hoàn thiện hồ sơ để mở khoá các vị trí đề xuất ngay lập tức.",
    studentCta: "Xem khả năng phù hợp của tôi"
  }
} as unknown as typeof siteMessages.en;

const siteMessagesJa = {
  ...siteMessages.en,
  footer: {
    ...siteMessages.en.footer,
    brandDescription: "グローバル人材と企業をつなぐキャリアプラットフォーム。",
    columns: [
      { title: "プラットフォーム", items: ["ポジションを探す", "マッチング適合度", "仕組み", "導入事例"] },
      { title: "リソース", items: ["導入事例", "よくある質問", "ブログ", "サポート"] },
      { title: "企業情報", items: ["会社概要", "採用情報", "お問い合わせ", "利用規約"] }
    ]
  },
  hero: {
    ...siteMessages.en.hero,
    badge: "2026年度募集中",
    titleTop: "キャリアプラットフォーム",
    titleAccent: "グローバル人材と企業をつなぐ",
    description: "企業は適切な人材に出会い、学生は適切な機会に備える。\n採用から実務体験、マッチング準備まで、すべてを一つのプラットフォームで。",
    primaryCta: "ポジションを探す",
    secondaryCta: "マッチング適合度を見る",
    positionsLink: "募集中のポジションを見る",
    companyDashboard: "企業向けダッシュボード",
    stats: [
      { label: "オープンポジション", value: "4" },
      { label: "応募者", value: "37" },
      { label: "面接", value: "12" }
    ],
    recommendedPositions: "おすすめポジション",
    positionsPanelTitle: "ポジションを探す",
    positionsPanelSortLabel: "最も適合",
    positionThumbnailAltSuffix: "ポジションのサムネイル",
    companyPanelEyebrow: "企業",
    companyPanelPartnerLabel: "パートナー企業",
    companyPanelIndustryLabel: "業界",
    companyPanelSizeLabel: "企業規模",
    companyPanelSizeValue: "30名未満",
    companyPanelOpenPositionsLabel: "募集中のポジション",
    companyPanelOpenPositionsValue: "3",
    companyPanelWorkTypeLabel: "勤務形態",
    studentProfile: "学生プロフィール",
    profileProgress: "プロフィール完成度",
    readinessLabel: "マッチング準備度が高い",
    recommendationLabel: "おすすめ 7件"
  },
  positions: {
    ...siteMessages.en.positions,
    title: "募集中のポジション",
    description: "Aplyで応募可能なポジションをご覧ください。",
    viewAll: "すべてのポジションを見る",
    foreignerEligible: "外国人応募可",
    details: "詳細を見る",
    detailAriaSuffix: "詳細を見る",
    thumbnailAltSuffix: "サムネイル",
    saveAriaLabel: "保存",
    applyCta: "応募する",
    loadingLabel: "ポジションを読み込み中...",
    partnerRecruitAlt: "企業向けポジション掲載のご案内",
    defaultCompanyName: "パートナー企業",
    defaultCategory: "ポジション未定",
    defaultLocation: "応相談",
    partnerTitle: "貴社のポジションを掲載",
    partnerDescription: "パートナーとして参加し、準備の整った候補者をご紹介。",
    partnerCta: "パートナーとして始める",
    items: [
      {
        company: "H ******** Inc.",
        initial: "H",
        role: "ソーシャルメディアマネージャー、マーケティングチームアシスタント募集",
        category: "Marketing",
        location: "応相談",
        workType: "On-site",
        start: "即時採用",
        badge: "New"
      },
      {
        company: "H******** Labs",
        initial: "H",
        role: "事業開発、教育市場リサーチ募集",
        category: "Research, Business",
        location: "応相談",
        workType: "On-site",
        start: "即時採用",
        badge: "New"
      },
      {
        company: "g*****b",
        initial: "G",
        role: "中国語翻訳ポジション募集",
        category: "Translation",
        location: "応相談",
        workType: "On-site",
        start: "即時採用",
        badge: "New"
      },
      {
        company: "(Ltd.) K**************",
        initial: "K",
        role: "テクニカルサポート、QA、R&D募集",
        category: "IT/Software engineering",
        location: "応相談",
        workType: "On-site",
        start: "即時採用",
        badge: "New"
      },
      {
        company: "C****** Co., Ltd.",
        initial: "C",
        role: "機械エンジニアリング / R&D募集",
        category: "Engineering (Mechanical, Electrical, etc.)",
        location: "応相談",
        workType: "On-site",
        start: "即時採用",
        badge: "New"
      }
    ]
  },
  studentProfile: {
    ...siteMessages.en.studentProfile,
    titleTop: "プロフィールが充実するほど、",
    titleBottom: "チャンスは広がる",
    description: "基本情報からすぐに始められます。\nプロフィールを充実させるほど、より多くの企業とポジションに出会えます。",
    statusBadge: "マッチング準備度が高い",
    completionLabel: "プロフィール完成度",
    recommendationsLabel: "おすすめポジション数",
    unlockedLabel: "プロフィールを充実させてマッチング率を高めましょう",
    profileMeta: "ソウル大学校 · マーケティング",
    cta: "プロフィール作成を始める",
    highlights: [
      "自分に合うポジションをすぐに確認",
      "情報を追加するとおすすめが即時に拡大",
      "プロフィールが自動整理され、企業が評価しやすく"
    ],
    checklist: [
      { label: "基本情報", done: true },
      { label: "学歴 / 専攻", done: true },
      { label: "語学力", done: true },
      { label: "ポートフォリオのアップロード", done: false },
      { label: "希望ポジション", done: true },
      { label: "勤務可能スケジュール", done: false },
      { label: "ビザ / 在留資格", done: false }
    ]
  },
  businessValue: {
    ...siteMessages.en.businessValue,
    titleTop: "グローバル人材との",
    titleBottom: "適合をより速く",
    description: "履歴書だけでなく、実際の準備度や韓国の職場環境への適応力を評価することで、採用リスクを低減します。",
    primaryCta: "企業向け相談を予約",
    secondaryCta: "仕組みを見る",
    cards: [
      {
        title: "実務準備度の検証",
        description:
          "専攻、語学、ポジション能力だけでなく、実際のタスク遂行履歴と準備の度合いを確認します。書類比較に留まらず、現ポジションに即戦力として貢献できる候補者を素早く見極められます。"
      },
      {
        title: "韓国の職場環境との適合性確認",
        description:
          "業務コミュニケーションのスタイル、協働姿勢、報告・フィードバックへの適応力を評価します。本格面接の前に韓国の企業文化との適合性を確認することで、入社後のオンボーディングリスクを低減できます。"
      },
      {
        title: "客観的なレポート",
        description:
          "各候補者の強み、改善点、実績を集約したレポートを提供します。採用担当者と現場マネージャーが同じ基準で評価でき、面接後の意思決定とフィードバックがスムーズになります。"
      },
      {
        title: "採用転換までシームレスに",
        description:
          "ポジション掲載、マッチング、面接調整から初期オンボーディングまで、すべてが一つのフローに。グローバル採用経験の少ないチームでも運用負担を軽減し、実採用への移行を安定して進められます。"
      }
    ]
  },
  howItWorks: {
    ...siteMessages.en.howItWorks,
    title: "Aplyの仕組み",
    steps: [
      {
        num: "01",
        title: "企業がポジションを掲載",
        description: "ポジション、必要なスキル、勤務形態、スケジュールなどの採用要件を構造化して入力します。"
      },
      {
        num: "02",
        title: "学生がプロフィールを充実",
        description: "学歴、語学、関心ポジション、ビザ / 在留状況を入力すると、マッチング準備度とおすすめポジションが即時に更新されます。"
      },
      {
        num: "03",
        title: "Aplyが最適なマッチングをサポート",
        description: "Aplyが候補者の準備度と企業の条件を同時に分析し、高い精度で優先的につなぎます。"
      },
      {
        num: "04",
        title: "運用と進捗を管理",
        description: "面接スケジュール、入社プロセス、実務体験フェーズ、フィードバックメモを同じ画面で追跡・管理できます。"
      }
    ]
  },
  scenario: {
    ...siteMessages.en.scenario,
    studentTitle: "学生はこうしてチャンスを広げる",
    companyTitle: "企業はこうして候補者と出会う",
    studentDescription: "登録から応募まで、準備度が高いほどチャンスは広がります。",
    companyDescription: "ポジション掲載から面接調整まで、採用を一つのフローで管理。",
    tabs: { student: "学生視点", company: "企業視点" },
    studentSteps: ["かんたん登録", "基本プロフィールを入力", "おすすめポジションを確認", "情報を追加して機会を拡大", "応募して面接 / 結果を確認"],
    studentStepSubtitles: [
      "数分で登録を完了し、すぐにスタート。",
      "コアとなるプロフィール情報を入力し、初期マッチングの準備を整えます。",
      "あなたのプロフィールに合うポジションをすぐに確認。",
      "情報を追加して、より多様な機会をアンロック。",
      "応募を開始し、実際のマッチングプロセスを進めます。"
    ],
    companySteps: ["ポジションを掲載", "条件に合う学生プールを確認", "準備度の高い学生を優先審査", "面接を実施し結果を記録", "進捗ステータスを管理"],
    companyStepSubtitles: [
      "ポジションと条件を掲載し、明確な採用基準を設定。",
      "条件に合う学生候補プールを素早く確認。",
      "準備度の高い候補者を優先します。",
      "進捗を明確に追跡し、ステップごとに管理。",
      "面接と運用のステップを自然な一つのフローにつなげます。"
    ]
  },
  cases: {
    ...siteMessages.en.cases,
    title: "導入事例 / 企業成果",
    resultsTitle: "約束だけではありません。",
    resultsSubtitle: "数字で証明されています。",
    stats: [
      { value: "200+", label: "累計マッチング成功数" },
      { value: "100+", label: "パートナー企業数" },
      { value: "4.5/5.0", label: "学生満足度" },
      { value: "4.8/5.0", label: "企業満足度" }
    ],
    cards: [
      {
        tag: "Startup · Marketing",
        title: "Northwave — グローバルマーケティングポジションの運用",
        quote: "準備度の高い学生を素早く審査でき、採用サイクルが半分に短縮されました。",
        by: "People Lead, Northwave"
      },
      {
        tag: "Enterprise · Operations",
        title: "Acme Global — 海外インターンシップマッチング",
        quote: "ビザ、語学、業務適合性を一か所で確認できるのが何より素晴らしい。",
        by: "Talent Manager, Acme"
      },
      {
        tag: "Student · Career",
        title: "Mei L. — 実務体験から採用へ",
        quote: "プロフィールを充実させるとおすすめが増え、初めてのグローバルキャリアをスタートできました。",
        by: "MA in Marketing, Seoul"
      }
    ]
  },
  testimonials: {
    ...siteMessages.en.testimonials,
    title: "先輩たちのリアルな声",
    items: [
      {
        quote: "最初はどこから始めればよいか分かりませんでしたが、プロフィールのステップ別ガイドのおかげで準備の方向性が明確になりました。",
        by: "K** · 経営学",
        avatar: "/avatar_testimonial_kim.svg"
      },
      {
        quote: "応募前に強みと改善点を整理できたので、面接でずっと自信を持てました。",
        by: "Tran N. · マーケティングトラック",
        avatar: "/avatar_testimonial_tran.svg"
      },
      {
        quote: "おすすめポジションが私の関心と本当によく合っていて、応募プロセスもシンプルで速かったです。",
        by: "L. Lee · コンピュータサイエンス",
        avatar: "/avatar_testimonial_lee.svg"
      }
    ]
  },
  faq: {
    ...siteMessages.en.faq,
    title: "よくある質問",
    description: "さらに情報が必要な場合は、企業向け相談から運用チームへお問い合わせください。",
    tabs: { company: "企業向けQ&A", student: "学生向けQ&A" },
    companyItems: [
      {
        question: "Q. プログラムの期間はどのくらいですか？",
        answer:
          "プログラムは基本4週間で、企業および参加者の状況に応じて最大5週間まで調整可能です。具体的なスケジュールはマッチング確定後にご相談いたします。"
      },
      {
        question: "Q. 参加者が真面目に取り組まない場合はどうなりますか？",
        answer:
          "参加者の無断欠席や不真面目な参加が見られた場合は、すぐにFlipers担当者までご連絡ください。状況によっては、プログラムの早期終了を検討することもあります。"
      },
      {
        question: "Q. 法的な問題はありませんか？",
        answer:
          "- 当プログラムは教育目的の「実務体験プログラム」として運営されており、参加者は労働者には該当せず、賃金や労働契約は適用されません。\n- したがって、現金での報酬支払いはできず、企業様には昼食支援を現金以外の形（食券または昼食費用）でのみ提供するようご案内しています。\n- 本内容は労務専門家および弁護士による相談・検討を経ています。これまでに200名以上のマッチング実績があり、ソウルグローバルセンターおよびソウル特別市傘下の大学とともに安定的にプログラムを運営しています。"
      },
      {
        question: "Q. プログラム終了後、参加者を採用することはできますか？",
        answer:
          "可能です。プログラム終了後、企業様から参加者へ直接採用オファーを行うことができます。その際は、Flipersまでご連絡をお願いいたします。"
      },
      {
        question: "Q. 追加で人材をマッチングしてもらえますか？",
        answer:
          "はい。celine@flip-ers.com までご連絡いただければ、追加の人材をマッチングいたします。"
      }
    ],
    studentItems: [
      {
        question: "Q. 無給インターンは違法だと聞きました。法的に問題はありませんか？",
        answer:
          "本プログラムを通じた活動は「労働」ではなく、教育目的の「業務体験プログラム」です。正式業務を代替するものではなく体験活動であるため、法的に問題ないことを確認しています。"
      },
      {
        question: "Q. 推薦状の発行は誰が決定しますか？",
        answer:
          "業務体験を行った企業の判断に完全に委ねられます。Flipersはこの決定に介入しません。"
      },
      {
        question: "Q. 昼食代の支援はどのように支払われますか？",
        answer:
          "昼食代は担当者が直接支払うか、企業の法人カードで決済されます。\n必要に応じて個人カードで先に決済し、領収書を提出して会社から払い戻しを受けることもできます。"
      }
    ]
  },
  finalCta: {
    ...siteMessages.en.finalCta,
    companyTitleTop: "グローバル人材の採用を",
    companyTitleBottom: "今日から始める",
    companyDescription: "ポジション掲載やパートナー相談を通じて、準備の整った候補者と出会いましょう。",
    companyCta: "パートナーとして始める",
    studentTitleTop: "プロフィールを充実させて",
    studentTitleBottom: "チャンスを探す",
    studentDescription: "プロフィールを充実させて、おすすめポジションを今すぐアンロック。",
    studentCta: "マッチング適合度を見る"
  }
} as unknown as typeof siteMessages.en;

const siteMessagesId = {
  ...siteMessages.en,
  footer: {
    ...siteMessages.en.footer,
    brandDescription: "Platform karier yang menghubungkan talenta global dengan perusahaan.",
    columns: [
      { title: "Platform", items: ["Jelajahi Posisi", "Kecocokan Matching", "Cara Kerja", "Studi Kasus"] },
      { title: "Sumber Daya", items: ["Studi Kasus", "FAQ", "Blog", "Dukungan"] },
      { title: "Perusahaan", items: ["Tentang Kami", "Karier", "Kontak", "Ketentuan"] }
    ]
  },
  hero: {
    ...siteMessages.en.hero,
    badge: "Rekrutmen untuk periode 2026",
    titleTop: "Platform karier",
    titleAccent: "yang menghubungkan talenta global dengan perusahaan",
    description: "Perusahaan menemukan talenta yang tepat, mahasiswa mempersiapkan peluang yang tepat.\nMulai dari rekrutmen, pengalaman kerja nyata, hingga kesiapan matching - semuanya dalam satu platform.",
    primaryCta: "Jelajahi Posisi",
    secondaryCta: "Lihat Kecocokan Matching",
    positionsLink: "Lihat posisi yang sedang dibuka",
    companyDashboard: "Dasbor Perusahaan",
    stats: [
      { label: "Posisi Terbuka", value: "4" },
      { label: "Pelamar", value: "37" },
      { label: "Wawancara", value: "12" }
    ],
    recommendedPositions: "Posisi Rekomendasi",
    positionsPanelTitle: "Jelajahi Posisi",
    positionsPanelSortLabel: "Paling Sesuai",
    positionThumbnailAltSuffix: "thumbnail posisi",
    companyPanelEyebrow: "Perusahaan",
    companyPanelPartnerLabel: "Perusahaan Mitra",
    companyPanelIndustryLabel: "Industri",
    companyPanelSizeLabel: "Ukuran Perusahaan",
    companyPanelSizeValue: "Di bawah 30 karyawan",
    companyPanelOpenPositionsLabel: "Posisi yang Dibuka",
    companyPanelOpenPositionsValue: "3",
    companyPanelWorkTypeLabel: "Tipe Pekerjaan",
    studentProfile: "Profil Mahasiswa",
    profileProgress: "Tingkat Kelengkapan Profil",
    readinessLabel: "Kesiapan matching tinggi",
    recommendationLabel: "Rekomendasi 7"
  },
  positions: {
    ...siteMessages.en.positions,
    title: "Posisi yang Sedang Dibuka",
    description: "Posisi yang dapat dilamar di Aply.",
    viewAll: "Lihat semua posisi",
    foreignerEligible: "Menerima kandidat internasional",
    details: "Lihat detail",
    detailAriaSuffix: "Lihat detail",
    thumbnailAltSuffix: "thumbnail",
    saveAriaLabel: "Simpan",
    applyCta: "Lamar",
    loadingLabel: "Memuat posisi...",
    partnerRecruitAlt: "Panduan pemasangan posisi untuk perusahaan",
    defaultCompanyName: "Perusahaan Mitra",
    defaultCategory: "Posisi belum ditentukan",
    defaultLocation: "Dapat dirundingkan",
    partnerTitle: "Pasang posisi untuk perusahaan Anda",
    partnerDescription: "Bergabunglah sebagai mitra dan dapatkan rekomendasi kandidat yang siap.",
    partnerCta: "Mulai sebagai Mitra",
    items: [
      {
        company: "H ******** Inc.",
        initial: "H",
        role: "Mencari Social Media Manager, Marketing Team Assistant",
        category: "Marketing",
        location: "Dapat dirundingkan",
        workType: "On-site",
        start: "Rekrutmen segera",
        badge: "New"
      },
      {
        company: "H******** Labs",
        initial: "H",
        role: "Mencari Business Development, Education Market Research",
        category: "Research, Business",
        location: "Dapat dirundingkan",
        workType: "On-site",
        start: "Rekrutmen segera",
        badge: "New"
      },
      {
        company: "g*****b",
        initial: "G",
        role: "Mencari posisi penerjemah bahasa Tionghoa",
        category: "Translation",
        location: "Dapat dirundingkan",
        workType: "On-site",
        start: "Rekrutmen segera",
        badge: "New"
      },
      {
        company: "(Ltd.) K**************",
        initial: "K",
        role: "Mencari Tech Support, QA, R&D",
        category: "IT/Software engineering",
        location: "Dapat dirundingkan",
        workType: "On-site",
        start: "Rekrutmen segera",
        badge: "New"
      },
      {
        company: "C****** Co., Ltd.",
        initial: "C",
        role: "Mencari Mechanical Engineering / R&D",
        category: "Engineering (Mechanical, Electrical, etc.)",
        location: "Dapat dirundingkan",
        workType: "On-site",
        start: "Rekrutmen segera",
        badge: "New"
      }
    ]
  },
  studentProfile: {
    ...siteMessages.en.studentProfile,
    titleTop: "Semakin lengkap profil,",
    titleBottom: "semakin banyak peluang",
    description: "Anda dapat segera memulai dengan informasi dasar.\nSemakin lengkap profil Anda, semakin banyak perusahaan dan posisi yang terbuka.",
    statusBadge: "Kesiapan matching tinggi",
    completionLabel: "Tingkat kelengkapan profil",
    recommendationsLabel: "Jumlah posisi yang direkomendasikan",
    unlockedLabel: "Tingkatkan kelengkapan profil untuk memperbesar peluang matching",
    profileMeta: "Universitas Nasional Seoul · Marketing",
    cta: "Mulai Buat Profil Saya",
    highlights: [
      "Lihat segera posisi yang sesuai dengan saya",
      "Tambahkan informasi untuk memperluas rekomendasi seketika",
      "Profil tertata otomatis sehingga mudah dievaluasi perusahaan"
    ],
    checklist: [
      { label: "Informasi Dasar", done: true },
      { label: "Pendidikan / Jurusan", done: true },
      { label: "Kemampuan Bahasa Asing", done: true },
      { label: "Unggah Portofolio", done: false },
      { label: "Posisi yang Diinginkan", done: true },
      { label: "Jadwal Tersedia untuk Bekerja", done: false },
      { label: "Status Visa / Tinggal", done: false }
    ]
  },
  businessValue: {
    ...siteMessages.en.businessValue,
    titleTop: "Temukan talenta global",
    titleBottom: "yang cocok lebih cepat",
    description: "Kurangi risiko rekrutmen dengan menilai kesiapan nyata dan kemampuan beradaptasi dengan lingkungan kerja Korea, bukan hanya melalui CV.",
    primaryCta: "Pesan Konsultasi Perusahaan",
    secondaryCta: "Lihat Cara Kerja",
    cards: [
      {
        title: "Verifikasi Kesiapan Kerja Nyata",
        description:
          "Tidak hanya menilai jurusan, bahasa asing, atau kemampuan posisi, tetapi juga riwayat penyelesaian tugas dan tingkat kesiapan aktual. Alih-alih sekadar membandingkan dokumen, Anda dapat dengan cepat menemukan kandidat yang siap berkontribusi langsung pada posisi saat ini."
      },
      {
        title: "Konfirmasi Kecocokan dengan Lingkungan Korea",
        description:
          "Evaluasi gaya komunikasi kerja, sikap kolaboratif, serta kemampuan beradaptasi dengan pelaporan dan umpan balik. Memverifikasi kecocokan dengan budaya perusahaan Korea sebelum wawancara mendalam mengurangi risiko onboarding setelah perekrutan."
      },
      {
        title: "Laporan Objektif",
        description:
          "Menyediakan laporan terpadu berisi kekuatan, area perbaikan, dan hasil performa setiap kandidat. Perekrut dan manajer operasional dapat menilai dengan standar yang sama, sehingga pengambilan keputusan dan umpan balik pasca wawancara menjadi lebih mudah."
      },
      {
        title: "Mulus Menuju Konversi Rekrutmen",
        description:
          "Mulai dari posting posisi, matching, penjadwalan wawancara, hingga onboarding awal — semuanya dalam satu alur. Bahkan tim dengan pengalaman rekrutmen global terbatas pun dapat meringankan beban operasional dan menstabilkan transisi ke rekrutmen aktual."
      }
    ]
  },
  howItWorks: {
    ...siteMessages.en.howItWorks,
    title: "Cara Kerja Aply",
    steps: [
      {
        num: "01",
        title: "Perusahaan memasang posisi",
        description: "Masukkan kriteria rekrutmen secara terstruktur: posisi, kompetensi yang dibutuhkan, tipe pekerjaan, dan jadwal."
      },
      {
        num: "02",
        title: "Mahasiswa melengkapi profil",
        description: "Ketika mahasiswa mengisi pendidikan, bahasa asing, posisi yang diminati, dan status visa / tinggal, kesiapan matching dan posisi rekomendasi akan diperbarui seketika."
      },
      {
        num: "03",
        title: "Aply mendukung pencocokan yang tepat",
        description: "Aply menganalisis kesiapan kandidat dan kondisi perusahaan secara bersamaan untuk menghubungkan dengan prioritas dan akurasi tinggi."
      },
      {
        num: "04",
        title: "Kelola operasional dan kemajuan",
        description: "Pantau dan kelola jadwal wawancara, proses bergabung, fase pengalaman kerja, dan catatan umpan balik dalam satu layar."
      }
    ]
  },
  scenario: {
    ...siteMessages.en.scenario,
    studentTitle: "Bagaimana mahasiswa memperluas peluang",
    companyTitle: "Bagaimana perusahaan bertemu kandidat",
    studentDescription: "Dari pendaftaran hingga lamaran, semakin tinggi kesiapan, semakin luas peluang yang terbuka.",
    companyDescription: "Dari pemasangan posisi hingga koneksi wawancara, kelola rekrutmen dalam satu alur.",
    tabs: { student: "Perspektif Mahasiswa", company: "Perspektif Perusahaan" },
    studentSteps: ["Daftar dengan cepat", "Isi profil dasar", "Lihat posisi rekomendasi", "Tambah info untuk perluas peluang", "Lamar dan ikuti wawancara / lihat hasil"],
    studentStepSubtitles: [
      "Selesaikan pendaftaran dalam hitungan menit dan langsung mulai.",
      "Isi informasi profil inti untuk mempersiapkan matching awal.",
      "Lihat segera posisi yang sesuai dengan profil Anda.",
      "Tambahkan informasi untuk membuka lebih banyak peluang yang beragam.",
      "Mulai melamar dan jalani langkah-langkah matching yang nyata."
    ],
    companySteps: ["Pasang posisi", "Lihat pool mahasiswa yang memenuhi syarat", "Prioritaskan mahasiswa dengan kesiapan tinggi", "Lakukan wawancara dan catat hasil", "Kelola status kemajuan"],
    companyStepSubtitles: [
      "Pasang posisi dan persyaratan untuk menetapkan kriteria rekrutmen yang jelas.",
      "Periksa dengan cepat pool kandidat mahasiswa yang memenuhi syarat.",
      "Prioritaskan kandidat dengan kesiapan yang lebih tinggi.",
      "Pantau status dengan jelas dan kelola setiap langkah secara berkelanjutan.",
      "Hubungkan langkah wawancara dan operasional menjadi satu alur yang alami."
    ]
  },
  cases: {
    ...siteMessages.en.cases,
    title: "Studi Kasus / Hasil Perusahaan",
    resultsTitle: "Bukan sekadar janji.",
    resultsSubtitle: "Terbukti dengan angka.",
    stats: [
      { value: "200+", label: "Total matching berhasil" },
      { value: "100+", label: "Jumlah perusahaan mitra" },
      { value: "4.5/5.0", label: "Kepuasan mahasiswa" },
      { value: "4.8/5.0", label: "Kepuasan perusahaan" }
    ],
    cards: [
      {
        tag: "Startup · Marketing",
        title: "Northwave — Mengoperasikan posisi marketing global",
        quote: "Dapat dengan cepat menilai mahasiswa dengan kesiapan tinggi, siklus rekrutmen berkurang setengah.",
        by: "People Lead, Northwave"
      },
      {
        tag: "Enterprise · Operations",
        title: "Acme Global — Matching pemagangan internasional",
        quote: "Yang terbaik adalah dapat mengonfirmasi visa, bahasa asing, dan kecocokan kerja dalam satu tempat.",
        by: "Talent Manager, Acme"
      },
      {
        tag: "Student · Career",
        title: "Mei L. — Dari pengalaman kerja nyata hingga koneksi rekrutmen",
        quote: "Ketika saya melengkapi profil, rekomendasi bertambah dan saya memulai karier global pertama saya.",
        by: "MA in Marketing, Seoul"
      }
    ]
  },
  testimonials: {
    ...siteMessages.en.testimonials,
    title: "Ulasan nyata dari para senior",
    items: [
      {
        quote: "Awalnya saya tidak tahu harus mulai dari mana, berkat panduan langkah demi langkah di profil, arah persiapan menjadi jelas.",
        by: "K** · Manajemen Bisnis",
        avatar: "/avatar_testimonial_kim.svg"
      },
      {
        quote: "Bisa merangkum kekuatan dan area yang perlu diperbaiki sebelum melamar membuat saya jauh lebih percaya diri saat wawancara.",
        by: "Tran N. · Marketing Track",
        avatar: "/avatar_testimonial_tran.svg"
      },
      {
        quote: "Posisi yang direkomendasikan sangat cocok dengan minat saya yang sebenarnya dan proses lamarannya juga sederhana dan cepat.",
        by: "L. Lee · Ilmu Komputer",
        avatar: "/avatar_testimonial_lee.svg"
      }
    ]
  },
  faq: {
    ...siteMessages.en.faq,
    title: "Pertanyaan yang Sering Diajukan",
    description: "Jika membutuhkan informasi lebih lanjut, Anda dapat menghubungi tim operasional melalui konsultasi perusahaan.",
    tabs: { company: "Q&A Perusahaan", student: "Q&A Mahasiswa" },
    companyItems: [
      {
        question: "Q. Berapa lama durasi program?",
        answer:
          "Durasi dasar program adalah 4 minggu dan dapat disesuaikan hingga 5 minggu sesuai kondisi perusahaan dan peserta. Jadwal spesifik akan dibahas setelah matching dikonfirmasi."
      },
      {
        question: "Q. Bagaimana jika peserta tidak berpartisipasi dengan serius?",
        answer:
          "Jika peserta tidak hadir tanpa keterangan atau tidak berpartisipasi dengan serius, mohon segera beri tahu penanggung jawab Flipers. Tergantung situasi, kami dapat mempertimbangkan untuk mengakhiri program lebih awal."
      },
      {
        question: "Q. Apakah ada masalah dari sisi hukum?",
        answer:
          "- Program kami dijalankan sebagai \"program pengalaman kerja nyata\" dengan tujuan edukasi, sehingga peserta tidak termasuk pekerja dan tidak berlaku upah maupun kontrak kerja.\n- Oleh karena itu, pembayaran imbalan dalam bentuk tunai tidak diperbolehkan; kami mengarahkan perusahaan untuk hanya memberikan dukungan makan siang dalam bentuk non-tunai (voucher makan atau biaya makan siang).\n- Konten ini telah dikonsultasikan dan ditinjau oleh ahli hukum ketenagakerjaan dan pengacara. Kami telah berhasil mencocokkan lebih dari 200 peserta dan menjalankan program secara stabil bersama Seoul Global Center serta universitas-universitas di bawah Pemerintah Kota Seoul."
      },
      {
        question: "Q. Setelah program, apakah peserta dapat direkrut?",
        answer:
          "Bisa. Setelah program berakhir, perusahaan dapat langsung memberikan tawaran rekrutmen kepada peserta. Dalam hal ini, mohon beri tahu Flipers."
      },
      {
        question: "Q. Apakah talenta tambahan dapat dicocokkan?",
        answer:
          "Bisa. Silakan hubungi celine@flip-ers.com, kami akan mencocokkan talenta tambahan untuk Anda."
      }
    ],
    studentItems: [
      {
        question: "Q. Saya mendengar bahwa magang tanpa bayaran itu ilegal. Apakah ada masalah hukum?",
        answer:
          "Aktivitas melalui program ini bukan \"pekerjaan\" melainkan \"program pengalaman kerja\" dengan tujuan edukasi. Karena ini adalah aktivitas pengalaman, bukan pengganti pekerjaan formal, kami telah memastikan tidak ada masalah hukum."
      },
      {
        question: "Q. Siapa yang menentukan pemberian surat rekomendasi?",
        answer:
          "Sepenuhnya tergantung keputusan perusahaan tempat Anda menjalani pengalaman kerja. Flipers tidak ikut campur dalam keputusan ini."
      },
      {
        question: "Q. Bagaimana dukungan biaya makan siang dibayarkan?",
        answer:
          "Biaya makan siang dibayar langsung oleh penanggung jawab atau dibayar menggunakan kartu korporat perusahaan.\nJika diperlukan, Anda dapat membayar terlebih dahulu dengan kartu pribadi lalu mengajukan kuitansi untuk penggantian dari perusahaan."
      }
    ]
  },
  finalCta: {
    ...siteMessages.en.finalCta,
    companyTitleTop: "Mulai rekrut talenta global",
    companyTitleBottom: "mulai hari ini",
    companyDescription: "Bertemu kandidat yang siap melalui pemasangan posisi atau konsultasi mitra.",
    companyCta: "Mulai sebagai Mitra",
    studentTitleTop: "Lengkapi profil Anda",
    studentTitleBottom: "dan temukan peluang",
    studentDescription: "Lengkapi profil untuk membuka posisi rekomendasi seketika.",
    studentCta: "Lihat Kecocokan Matching Saya"
  }
} as unknown as typeof siteMessages.en;

export function getSiteMessages(locale: PlatformLocale = getBrowserLocale()) {
  if (locale === "ko" || locale === "en") return siteMessages[locale];
  if (locale === "zh-CN") return siteMessagesZhCn;
  if (locale === "vi") return siteMessagesVi;
  if (locale === "ja") return siteMessagesJa;
  if (locale === "id") return siteMessagesId;
  return siteMessages.en;
}

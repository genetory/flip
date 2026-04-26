import { getBrowserLocale, type PlatformLocale } from "./auth-messages";

const siteMessages = {
  ko: {
    footer: {
      brandDescription: "글로벌 인재와 기업을 연결하는 커리어 플랫폼.",
      columns: [
        { title: "Platform", items: ["포지션 탐색", "매칭 확률 확인하기", "운영 방식", "사례"] },
        { title: "Resources", items: ["사례", "FAQ", "블로그", "고객지원"] },
        { title: "Company", items: ["기업 소개", "채용", "문의", "이용약관"] }
      ],
      rights: "All rights reserved.",
      tagline: "Made for global careers."
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
      profileProgress: "완성도",
      readinessLabel: "매칭 준비도 높음",
      recommendationLabel: "추천 7",
      liveMatching: "Live matching"
    },
    positions: {
      liveLabel: "Live",
      title: "현재 모집 중인 포지션",
      description: "기업이 글로벌 인재에게 열어둔 기회입니다.",
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
          company: "Lumen Studio",
          initial: "L",
          role: "Product Design Intern",
          category: "Design",
          location: "Seoul",
          workType: "Hybrid",
          start: "2026 Spring",
          badge: "Recommended"
        },
        {
          company: "Northwave",
          initial: "N",
          role: "Global Marketing Assistant",
          category: "Marketing",
          location: "Singapore",
          workType: "On-site",
          start: "Immediate",
          badge: "New"
        },
        {
          company: "Orbit AI",
          initial: "O",
          role: "AI Operations Associate",
          category: "Operations",
          location: "Remote",
          workType: "Remote",
          start: "Q2 2026",
          badge: "Hot"
        },
        {
          company: "Forge & Co.",
          initial: "F",
          role: "Business Development Intern",
          category: "Business",
          location: "Tokyo",
          workType: "Hybrid",
          start: "2026 Spring",
          badge: "Recommended"
        },
        {
          company: "Pavo Labs",
          initial: "P",
          role: "Content Strategist",
          category: "Content",
          location: "Berlin",
          workType: "Remote",
          start: "Immediate",
          badge: "New"
        },
        {
          company: "Helio",
          initial: "H",
          role: "Data Analyst Intern",
          category: "Data",
          location: "Seoul",
          workType: "On-site",
          start: "Q2 2026",
          badge: "Hot"
        }
      ]
    },
    studentProfile: {
      sectionLabel: "For Students",
      titleTop: "프로필 채울수록",
      titleBottom: "기회가 더 열려요",
      description:
        "기본 정보만 입력해도 시작할 수 있어요.\n항목을 채울수록 더 많은 기업과 포지션이 열립니다.",
      statusBadge: "매칭 준비도 높음",
      completionLabel: "프로필 완성도",
      recommendationsLabel: "추천 가능한 포지션",
      unlockedLabel: "추가 입력 시 열리는",
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
      titleBottom: "글로벌 인재를 만나세요",
      description: "이력서만 보지 않고, 실무 준비도와 한국 업무 적응 가능성까지 확인해 채용 리스크를 줄입니다.",
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
      title: "Flip은 이렇게 작동합니다",
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
          title: "Flip이 적합한 연결을 돕습니다",
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
      sectionLabel: "Scenarios",
      studentTitle: "학생은 이렇게 기회를 넓혀갑니다",
      companyTitle: "기업은 이렇게 후보자를 만나게 됩니다",
      studentDescription: "가입부터 지원까지, 준비도를 높일수록 더 많은 기회가 열리는 흐름입니다.",
      companyDescription: "포지션 등록부터 인터뷰 연결까지, 채용 진행을 한 흐름으로 관리합니다.",
      studentImageAlt: "학생 관점 시나리오 이미지",
      companyImageAlt: "기업 관점 시나리오 이미지",
      tabs: { student: "학생 관점", company: "기업 관점" },
      studentSteps: ["간단 가입", "기본 프로필 입력", "추천 포지션 확인", "추가 입력으로 기회 확대", "지원 / 매칭 시작"],
      companySteps: ["포지션 등록", "조건에 맞는 학생 풀 확인", "준비도 높은 학생 우선 검토", "진행 상태 관리", "인터뷰 / 운영 연결"]
    },
    cases: {
      sectionLabel: "Cases",
      title: "기업 사례 / 성과",
      resultsEyebrow: "Proven Results",
      resultsTitle: "말뿐인 약속은 하지 않습니다.",
      resultsSubtitle: "숫자로 증명합니다.",
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
      title: "선배들의 리얼 후기",
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
      description: "더 궁금한 점이 있다면 기업 상담을 통해 운영팀에 직접 문의할 수 있습니다.",
      items: [
        {
          question: "어떤 기업이 참여할 수 있나요?",
          answer:
            "스타트업, 중소기업, 대기업, 글로벌 운영 조직까지 모두 참여할 수 있습니다. 특히 외국인 인재 채용이나 글로벌 실무경험 프로그램을 운영하려는 기업이라면 규모와 업종에 관계없이 시작할 수 있습니다."
        },
        {
          question: "외국인 학생은 어떤 조건으로 지원할 수 있나요?",
          answer:
            "회원가입 후 기본 프로필을 입력하고, 비자·체류 상태와 언어 능력, 희망 직무를 등록하면 됩니다. 입력한 정보에 맞는 포지션이 자동으로 추천되며, 프로필을 더 채울수록 추천 정확도와 기회 수가 함께 올라갑니다."
        },
        {
          question: "기업은 직접 학생을 검토할 수 있나요?",
          answer:
            "네, 가능합니다. 기업은 학생의 구조화된 프로필, 직무 적합도, 준비 상태를 한 화면에서 확인하고 직접 검토할 수 있습니다. 필요한 경우 바로 인터뷰 단계로 연결해 채용 의사결정을 빠르게 진행할 수 있습니다."
        },
        {
          question: "학생은 언제부터 포지션 추천을 받을 수 있나요?",
          answer:
            "기본 정보 입력이 완료되면 즉시 추천 포지션이 표시됩니다. 이후 학력, 언어, 경력, 비자 정보 등 추가 항목을 입력할수록 더 다양한 포지션이 열리고, 기업과의 매칭 정확도도 높아집니다."
        },
        {
          question: "운영팀은 어떤 역할을 하나요?",
          answer:
            "운영팀은 기업과 학생 사이의 진행 과정을 함께 관리합니다. 포지션 매칭, 인터뷰 일정 조율, 초기 실무 적응 지원, 커뮤니케이션 정리까지 돕기 때문에 양측이 불필요한 시행착오를 줄이고 더 안정적으로 진행할 수 있습니다."
        }
      ]
    },
    finalCta: {
      companyTitleTop: "글로벌 인재 채용을",
      companyTitleBottom: "지금 시작해보세요",
      companyDescription: "포지션 등록 또는 파트너 상담으로 준비된 후보자를 만나보세요.",
      companyCta: "파트너로 시작하기",
      studentTitleTop: "내 프로필을 만들고",
      studentTitleBottom: "기회를 확인해보세요",
      studentDescription: "프로필 완성으로 추천 포지션이 즉시 열립니다.",
      studentCta: "내 매칭 가능성 확인하기"
    }
  },
  en: {
    footer: {
      brandDescription: "A career platform connecting global talent and companies.",
      columns: [
        { title: "Platform", items: ["Browse Positions", "Check Match Score", "How It Works", "Cases"] },
        { title: "Resources", items: ["Cases", "FAQ", "Blog", "Support"] },
        { title: "Company", items: ["About", "Careers", "Contact", "Terms"] }
      ],
      rights: "All rights reserved.",
      tagline: "Made for global careers."
    },
    hero: {
      badge: "Now recruiting for 2026 cohort",
      titleTop: "Global talent meets",
      titleAccent: "the right companies",
      description:
        "Companies find verified talent, and students prepare for real opportunities. Hiring, work experience, and matching in one place.",
      primaryCta: "Explore positions",
      secondaryCta: "Check my match potential",
      positionsLink: "See open positions now",
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
      companyPanelIndustryLabel: "Industry",
      companyPanelIndustryValue: "IT",
      companyPanelSizeLabel: "Company size",
      companyPanelSizeValue: "Under 30 employees",
      companyPanelOpenPositionsLabel: "Open positions",
      companyPanelOpenPositionsValue: "3",
      companyPanelWorkTypeLabel: "Work type",
      companyPanelWorkTypeValue: "Remote · Hybrid",
      openLabel: "Open",
      studentProfile: "Student profile",
      profileProgress: "Completion",
      readinessLabel: "High matching readiness",
      recommendationLabel: "7 recommendations",
      liveMatching: "Live matching"
    },
    positions: {
      liveLabel: "Live",
      title: "Open positions",
      description: "Opportunities opened by partner companies for global talent.",
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
      partnerTitle: "Post a position for your company",
      partnerDescription: "Join as a partner and receive recommendations for ready candidates.",
      partnerCta: "Become a partner",
      items: [
        {
          company: "Lumen Studio",
          initial: "L",
          role: "Product Design Intern",
          category: "Design",
          location: "Seoul",
          workType: "Hybrid",
          start: "Spring 2026",
          badge: "Recommended"
        },
        {
          company: "Northwave",
          initial: "N",
          role: "Global Marketing Assistant",
          category: "Marketing",
          location: "Singapore",
          workType: "On-site",
          start: "Immediate",
          badge: "New"
        },
        {
          company: "Orbit AI",
          initial: "O",
          role: "AI Operations Associate",
          category: "Operations",
          location: "Remote",
          workType: "Remote",
          start: "Q2 2026",
          badge: "Hot"
        },
        {
          company: "Forge & Co.",
          initial: "F",
          role: "Business Development Intern",
          category: "Business",
          location: "Tokyo",
          workType: "Hybrid",
          start: "Spring 2026",
          badge: "Recommended"
        },
        {
          company: "Pavo Labs",
          initial: "P",
          role: "Content Strategist",
          category: "Content",
          location: "Berlin",
          workType: "Remote",
          start: "Immediate",
          badge: "New"
        },
        {
          company: "Helio",
          initial: "H",
          role: "Data Analyst Intern",
          category: "Data",
          location: "Seoul",
          workType: "On-site",
          start: "Q2 2026",
          badge: "Hot"
        }
      ]
    },
    studentProfile: {
      sectionLabel: "For Students",
      titleTop: "The more you complete your profile,",
      titleBottom: "the more opportunities you unlock",
      description:
        "Increase your match readiness with simple profile inputs. Filling missing fields unlocks more companies and opportunities.",
      statusBadge: "High matching readiness",
      completionLabel: "Profile completion",
      recommendationsLabel: "Recommended positions",
      unlockedLabel: "Unlock with extra inputs",
      profileMeta: "SNU · Marketing",
      highlights: [
        "See positions that match you right away",
        "Unlock +12 recommended positions instantly",
        "Auto-generate a structured profile companies can review"
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
      titleTop: "Meet better-matched",
      titleBottom: "global talent faster",
      description: "Go beyond resumes and verify practical readiness and workplace fit in Korean business environments.",
      primaryCta: "Talk to partner team",
      secondaryCta: "See business workflow",
      cards: [
        {
          title: "Practical readiness, verified",
          description:
            "Review each candidate beyond basic resumes by combining profile depth, language capability, role competency, and task performance signals. This helps your team shortlist talent who can contribute from day one."
        },
        {
          title: "Korean workplace fit",
          description:
            "Assess communication style, collaboration behavior, and adaptation to Korean workplace culture before deeper interview rounds. Early fit validation reduces onboarding friction and mis-hire risk."
        },
        {
          title: "Objective performance reports",
          description:
            "Use structured reports that summarize strengths, gaps, and practical performance. Hiring managers and interviewers can align faster on evidence-based decisions and deliver clearer feedback."
        },
        {
          title: "From matching to hiring",
          description:
            "Run posting, matching, interviews, and early onboarding in one connected flow. Even teams with limited global hiring experience can operate with lower overhead and reach hiring conversion faster."
        }
      ]
    },
    howItWorks: {
      sectionLabel: "How it works",
      title: "How the platform works",
      steps: [
        {
          num: "01",
          title: "Companies post positions",
          description: "Define role expectations, required skills, work format, and hiring timeline in a structured way."
        },
        {
          num: "02",
          title: "Students complete profiles",
          description: "Students add education, language, role interests, and visa status to unlock readiness scores and live recommendations."
        },
        {
          num: "03",
          title: "The platform supports matching",
          description: "The platform aligns candidate readiness with company requirements to surface higher-fit matches earlier."
        },
        {
          num: "04",
          title: "Manage operations and progress",
          description: "Track interviews, onboarding, work-experience milestones, and feedback in one continuous workflow."
        }
      ]
    },
    scenario: {
      sectionLabel: "Scenarios",
      studentTitle: "How students expand opportunities",
      companyTitle: "How companies meet candidates",
      studentDescription: "From signup to application, better profile readiness unlocks more opportunities.",
      companyDescription: "From position posting to interviews, manage hiring progress in one flow.",
      studentImageAlt: "Student-view scenario image",
      companyImageAlt: "Company-view scenario image",
      tabs: { student: "Student view", company: "Company view" },
      studentSteps: ["Quick signup", "Enter basic profile", "Check recommendations", "Unlock more with extra inputs", "Apply / start matching"],
      companySteps: ["Post position", "Review matching student pool", "Prioritize high-readiness candidates", "Manage progress", "Connect interviews / operations"]
    },
    cases: {
      sectionLabel: "Cases",
      title: "Partner stories and outcomes",
      resultsEyebrow: "Proven Results",
      resultsTitle: "No empty promises.",
      resultsSubtitle: "Proven by numbers.",
      stats: [
        { value: "200+", label: "Total successful matches" },
        { value: "100+", label: "Partner companies" },
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
          title: "Acme Global — Matching international student interns",
          quote: "The best part was checking visa, language, and role fit in one place.",
          by: "Talent Manager, Acme"
        },
        {
          tag: "Student · Career",
          title: "Mei L. — Work experience to full-time opportunity",
          quote: "As I completed my profile, recommendations increased and I started my first global career.",
          by: "MA in Marketing, Seoul"
        }
      ]
    },
    testimonials: {
      sectionLabel: "Testimonials",
      title: "Real stories from seniors",
      items: [
        {
          quote: "I was unsure where to start, but the step-by-step profile flow made my preparation plan clear.",
          by: "K. Kim · Business",
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
      description: "If you have more questions, contact the operations team through partner consultation.",
      items: [
        {
          question: "What companies can join as partners?",
          answer:
            "Startups, SMEs, enterprises, and global operation teams can all join. If your company wants to hire international talent or run practical work-experience programs, you can start regardless of company size or industry."
        },
        {
          question: "How can international students apply?",
          answer:
            "After signup, students complete their basic profile and add visa status, language proficiency, and preferred roles. The platform then recommends matching positions automatically, and recommendation quality improves as profiles become more complete."
        },
        {
          question: "Can companies review students directly?",
          answer:
            "Yes. Companies can directly review structured student profiles, role-fit indicators, and readiness signals in one place. When a candidate fits, teams can move to interviews quickly and make decisions with less friction."
        },
        {
          question: "When do students start receiving recommendations?",
          answer:
            "Recommendations appear as soon as basic profile information is completed. As students add more details such as education, language, experience, and visa information, more opportunities become available and matching accuracy increases."
        },
        {
          question: "What does the operations team do?",
          answer:
            "The operations team supports the full process between companies and students. They help with matching, interview scheduling, early adaptation, and communication flow so both sides can move faster with fewer operational issues."
        }
      ]
    },
    finalCta: {
      companyTitleTop: "Start hiring global talent",
      companyTitleBottom: "today",
      companyDescription: "Meet ready candidates through position posting or partner consultation.",
      companyCta: "Start as a company partner",
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

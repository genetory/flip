import type { PlatformLocale } from "../auth-messages";
import { useLanguage } from "../../components/i18n/LanguageProvider";

type Copy = {
  // 섹션 라벨
  sectionBasic: string;
  sectionIntro: string;
  sectionExperiences: string;
  sectionEducation: string;
  sectionAwards: string;
  sectionSkills: string;
  sectionLanguages: string;
  sectionLinks: string;

  // 기본 정보 질문
  basicQName: string;
  basicQPhone: string;
  basicQEmail: string;
  basicQForeigner: string;
  basicQJob: string;

  // 섹션별 첫 질문(opening)
  openBasic: string;
  openIntro: string;
  openExperiences: string;
  openEducation: string;
  openAwards: string;
  openSkills: string;
  openLanguages: string;
  openLinks: string;

  // 로딩/오류
  loadFailed: string;

  // 초기 인사
  enrichGreeting: (title: string) => string;
  enrichTypeIntro: string;
  basicGreeting: string;
  basicAllFilled: string;
  sectionGreeting: (section: string) => string;

  // 완료
  sectionFinished: (section: string) => string;

  // 기본 정보 응답
  niceToMeet: (name: string) => string;
  foreignerYes: string;
  foreignerNo: string;

  // 경험 흐름
  expAddedAskMore: string;
  askOrgKeep: (org: string) => string;
  askOrgNew: string;
  askTitleKeep: (title: string) => string;
  askTitleNew: string;
  askPeriodKeep: (period: string) => string;
  askPeriodNew: string;
  askContentEdit: (raw: string) => string;
  askContentNew: string;
  periodOngoing: string;

  // AI 인터뷰
  interviewOptionalSuffix: string;
  interviewIntro: string;
  interviewFallback: string;
  finishInterviewNoAnswer: string;
  generatingBullets: string;
  bulletsHeader: string;
  bulletsNoneSaved: string;
  bulletsGenFailed: string;

  // 경험 수정 완료
  editExpDone: string;

  // 다듬기
  polishHeader: string;
  acceptPolishSaid: string;
  keepOriginalSaid: string;

  // 수정 모드 다듬기
  needContentFirst: string;

  // 업무 추천 칩
  tasksHeader: string;
  tasksFallbackMore: string;
  tasksFallbackEnrich: string;
  typeTasksInstead: string;

  // 학력
  edAskType: string;
  edAskMajor: string;
  edAskStatus: string;
  edAskStart: string;
  edAskEnd: string;
  edAddedAskMore: string;

  // 자격·수상
  awAddedAskMore: string;

  // 스킬
  skAdded: (count: number) => string;

  // 어학
  lgAddedAskMore: string;

  // 링크
  lnAddedAskMore: string;

  // 자기소개
  introWriteSelf: string;
  introWriteSelfSaid: string;
  introYesSaid: string;
  introGenerating: string;
  introHeader: string;
  introGenFailed: string;

  // 종류 다시 고르기
  repickPrompt: string;

  // 선택지 라벨
  optIntroYes: string;
  optIntroSelf: string;
  optPolishMore: string;
  optKeepAsIs: string;
  optTypeKeep: string;
  optStop: string;
  optAcceptPolish: string;
  optKeepOriginal: string;
  optGetSuggestions: string;
  optTaskPrefix: (task: string) => string;
  optDonePicking: string;
  optNoneTypeMyself: string;

  // UI
  back: string;
  aiChatHeader: (section: string) => string;
  preview: string;
  writing: string;
  generatedBulletsHint: string;
  expDoneButton: string;
  doneButton: string;
  repickTypeButton: string;
  inputPlaceholder: string;
  close: string;
};

const dict: Record<PlatformLocale, Copy> = {
  ko: {
    sectionBasic: "기본 정보",
    sectionIntro: "자기소개",
    sectionExperiences: "경험",
    sectionEducation: "학력",
    sectionAwards: "자격 · 수상",
    sectionSkills: "스킬",
    sectionLanguages: "어학",
    sectionLinks: "링크",

    basicQName: "이름이 어떻게 되세요?",
    basicQPhone: "전화번호를 알려줄래요? (없으면 ‘없어요’)",
    basicQEmail: "이메일 주소도 알려줄래요? (없으면 ‘없어요’)",
    basicQForeigner: "한국 국적이 아닌 외국인이세요?",
    basicQJob: "어떤 일을 하고 싶어요? (예: 백엔드 개발, 마케팅) 아직 모르겠으면 ‘몰라요’.",

    openBasic: "기본 정보를 채워볼게요. 이름이 어떻게 되세요?",
    openIntro: "자기소개를 만들어 볼게요. 지금까지 입력한 경험으로 AI가 초안을 써드릴까요?",
    openExperiences: "경험 하나를 자세히 채워볼게요. 어떤 종류의 경험이에요? 아래에서 골라줘요.",
    openEducation: "학력을 채워볼게요. 어느 학교를 다녔어요? (예: OO대학교)",
    openAwards: "자격증이나 수상 이력이 있어요? 하나씩 적어줘요. (예: 정보처리기사) 없으면 ‘없어요’.",
    openSkills: "다룰 수 있는 기술·툴·역량을 쉼표로 적어줄래요? (예: React, Figma, 데이터 분석)",
    openLanguages: "구사 가능한 언어가 있어요? ‘언어 - 수준’으로 적어줘요. (예: 영어 - 비즈니스) 없으면 ‘없어요’.",
    openLinks: "보여주고 싶은 링크가 있어요? 이름과 URL을 적어줘요. (예: 포트폴리오 https://...) 없으면 ‘없어요’.",

    loadFailed: "이력서를 불러오지 못했어요.",

    enrichGreeting: (title) => `‘${title}’을 하나씩 고쳐볼게요. 😊`,
    enrichTypeIntro: "종류부터 볼게요. 그대로면 ‘그대로’를 눌러요.",
    basicGreeting: "기본 정보를 채워볼게요. 😊",
    basicAllFilled: "기본 정보는 이미 다 채워져 있어요! 🎉 다른 항목도 채워보세요.",
    sectionGreeting: (section) => `${section}를 대화로 채워볼게요. 😊`,

    sectionFinished: (section) => `${section} 작성이 끝났어요! 🎉 편집에서 더 다듬거나 다른 항목도 채워보세요.`,

    niceToMeet: (name) => `반가워요, ${name}님!`,
    foreignerYes: "알겠어요! 비자 종류는 편집의 기본 정보에서 선택할 수 있어요.",
    foreignerNo: "네, 알겠어요!",

    expAddedAskMore: "이력서에 추가됐어요! ✅ 또 다른 경험이 있어요? 종류를 고르거나 ‘그만’을 눌러요.",
    askOrgKeep: (org) => `회사·단체명이 지금 ‘${org}’이에요. 바꾸려면 새로, 그대로면 ‘그대로’.`,
    askOrgNew: "회사·단체명이 어떻게 되세요? (없으면 ‘건너뛰기’)",
    askTitleKeep: (title) => `경험 이름·직책이 ‘${title}’이에요. 바꾸려면 새로, 그대로면 ‘그대로’.`,
    askTitleNew: "이 경험의 이름이나 직책은요? (예: 카페 바리스타)",
    askPeriodKeep: (period) => `기간이 ‘${period}’이에요. 바꾸려면 새로(예: 2023-03 ~ 2024-02), 그대로면 ‘그대로’.`,
    askPeriodNew: "언제 했어요? (예: 2023-03 ~ 2024-02) 모르면 ‘건너뛰기’.",
    askContentEdit: (raw) => `마지막! 한 일은 지금 이래요 👇\n“${raw}”\n더 다듬을까요?`,
    askContentNew: "마지막! 여기서 무슨 일을 했는지 한 문장으로 적어줘요. 제가 다듬어 드릴게요.",
    periodOngoing: "진행 중",

    interviewOptionalSuffix: " (없으면 ‘없어요’)",
    interviewIntro: "좋아요! 이 경험에서 한 일을 같이 끌어내볼게요. 몇 가지만 물어볼게요 😊",
    interviewFallback: "그럼 간단히 적어볼게요. 여기서 무슨 일을 했는지 한 문장으로 적어줘요.",
    finishInterviewNoAnswer: "무슨 일을 했는지 한 문장만 적어줄래요? 제가 다듬어 드릴게요.",
    generatingBullets: "말해준 내용으로 이력서 문장을 만들어볼게요…",
    bulletsHeader: "이렇게 정리했어요 👇",
    bulletsNoneSaved: "정리했어요. 편집·미리보기에서 확인해 주세요.",
    bulletsGenFailed: "문장 생성에 실패했어요. 적어준 내용은 저장했어요.",

    editExpDone: "수정했어요! 🎉 편집·미리보기에서 확인해 보세요.",

    polishHeader: "이렇게 다듬어봤어요 👇",
    acceptPolishSaid: "이걸로 할게요",
    keepOriginalSaid: "직접 쓴 대로 둘게요",

    needContentFirst: "먼저 무슨 일을 했는지 한 문장 적어줘요.",

    tasksHeader: "이런 일 하셨나요? 해당되는 걸 눌러주세요. (여러 개 가능)",
    tasksFallbackMore: "또 다른 경험이 있어요? 없으면 ‘없어요’.",
    tasksFallbackEnrich: "구체적으로 어떤 일을 했어요? 역할·한 일·성과 등 편하게 적어줘요.",
    typeTasksInstead: "그럼 어떤 일을 했는지 직접 적어줘요. 짧게 적어도 제가 다듬어 드릴게요.",

    edAskType: "구분이 어떻게 되세요?",
    edAskMajor: "전공이 어떻게 되세요? (없으면 ‘없어요’)",
    edAskStatus: "상태는 어떻게 되세요?",
    edAskStart: "입학 시기는요? (예: 2020-03, 없으면 ‘없어요’)",
    edAskEnd: "졸업(예정) 시기는요? (예: 2024-02, 없으면 ‘없어요’)",
    edAddedAskMore: "학교를 추가했어요! 또 다른 학교가 있으면 학교명을 적어주세요. 없으면 ‘없어요’.",

    awAddedAskMore: "추가했어요! 발급처·시기는 편집에서 채울 수 있어요. 또 있어요? 없으면 ‘없어요’.",

    skAdded: (count) => `${count}개 스킬을 추가했어요!`,

    lgAddedAskMore: "추가했어요! 또 다른 언어 있어요? 없으면 ‘없어요’.",

    lnAddedAskMore: "추가했어요! 또 있어요? 없으면 ‘없어요’.",

    introWriteSelf: "좋아요, 자기소개를 편하게 적어주세요. 제가 그대로 넣어드릴게요.",
    introWriteSelfSaid: "직접 쓸게요",
    introYesSaid: "네, 만들어 주세요",
    introGenerating: "좋아요! 경험을 바탕으로 자기소개 초안을 써볼게요…",
    introHeader: "이렇게 써봤어요 👇",
    introGenFailed: "초안 생성에 실패했어요. 직접 작성해 주세요.",

    repickPrompt: "종류를 다시 골라줘요.",

    optIntroYes: "네, 만들어 주세요",
    optIntroSelf: "직접 쓸게요",
    optPolishMore: "✨ 더 다듬기",
    optKeepAsIs: "그대로 둘게요",
    optTypeKeep: "그대로",
    optStop: "✓ 그만할게요",
    optAcceptPolish: "✓ 이걸로 할게요",
    optKeepOriginal: "직접 쓴 대로 둘게요",
    optGetSuggestions: "막막해요 · 추천받기",
    optTaskPrefix: (task) => `＋ ${task}`,
    optDonePicking: "✓ 다 골랐어요",
    optNoneTypeMyself: "맞는 게 없어요 · 직접 적기",

    back: "뒤로",
    aiChatHeader: (section) => `AI와 대화 · ${section}`,
    preview: "미리보기",
    writing: "작성 중…",
    generatedBulletsHint: "생성된 문장 — 맘에 안 들면 바로 고치세요",
    expDoneButton: "경험 작성 완료",
    doneButton: "작성 완료",
    repickTypeButton: "종류 다시 고르기",
    inputPlaceholder: "여기에 답을 적어주세요",
    close: "닫기"
  },

  en: {
    sectionBasic: "Basic info",
    sectionIntro: "Self-introduction",
    sectionExperiences: "Experience",
    sectionEducation: "Education",
    sectionAwards: "Certifications & awards",
    sectionSkills: "Skills",
    sectionLanguages: "Languages",
    sectionLinks: "Links",

    basicQName: "What's your name?",
    basicQPhone: "Could you share your phone number? (Say 'none' if you'd rather not)",
    basicQEmail: "And your email address? (Say 'none' if you'd rather not)",
    basicQForeigner: "Are you a foreign national (not a Korean citizen)?",
    basicQJob: "What kind of work do you want to do? (e.g. backend development, marketing) If you're not sure yet, just say 'not sure'.",

    openBasic: "Let's fill in your basic info. What's your name?",
    openIntro: "Let's create your self-introduction. Want AI to draft one from the experience you've entered so far?",
    openExperiences: "Let's flesh out one experience in detail. What kind of experience is it? Pick one below.",
    openEducation: "Let's add your education. Which school did you attend? (e.g. OO University)",
    openAwards: "Do you have any certifications or awards? List them one by one. (e.g. Engineer Information Processing) Say 'none' if you have none.",
    openSkills: "Could you list the skills, tools, and strengths you can handle, separated by commas? (e.g. React, Figma, data analysis)",
    openLanguages: "Do you speak any languages? Write them as 'language - level'. (e.g. English - business) Say 'none' if you have none.",
    openLinks: "Any links you'd like to show? Add a name and URL. (e.g. Portfolio https://...) Say 'none' if you have none.",

    loadFailed: "Couldn't load the resume.",

    enrichGreeting: (title) => `Let's revise '${title}' step by step. 😊`,
    enrichTypeIntro: "Let's start with the type. Tap 'Keep as is' to leave it.",
    basicGreeting: "Let's fill in your basic info. 😊",
    basicAllFilled: "Your basic info is already complete! 🎉 Try filling in other sections too.",
    sectionGreeting: (section) => `Let's fill in your ${section} through chat. 😊`,

    sectionFinished: (section) => `Your ${section} is done! 🎉 Refine it further in the editor or fill in other sections.`,

    niceToMeet: (name) => `Nice to meet you, ${name}!`,
    foreignerYes: "Got it! You can select your visa type in Basic info within the editor.",
    foreignerNo: "Okay, got it!",

    expAddedAskMore: "Added to your resume! ✅ Any other experience? Pick a type or tap 'Stop'.",
    askOrgKeep: (org) => `The company/organization is currently '${org}'. Type a new one to change it, or tap 'Keep as is'.`,
    askOrgNew: "What's the company or organization? (Say 'skip' if none)",
    askTitleKeep: (title) => `The experience name/role is '${title}'. Type a new one to change it, or tap 'Keep as is'.`,
    askTitleNew: "What's the name or role for this experience? (e.g. Café barista)",
    askPeriodKeep: (period) => `The period is '${period}'. Type a new one to change it (e.g. 2023-03 ~ 2024-02), or tap 'Keep as is'.`,
    askPeriodNew: "When did you do it? (e.g. 2023-03 ~ 2024-02) Say 'skip' if you don't know.",
    askContentEdit: (raw) => `Last one! Here's what you did 👇\n“${raw}”\nWant to refine it further?`,
    askContentNew: "Last one! Describe what you did here in one sentence. I'll polish it for you.",
    periodOngoing: "Ongoing",

    interviewOptionalSuffix: " (Say 'none' if not applicable)",
    interviewIntro: "Great! Let's draw out what you did in this experience together. I'll ask just a few questions 😊",
    interviewFallback: "Okay, let's keep it simple. Describe what you did here in one sentence.",
    finishInterviewNoAnswer: "Could you describe what you did in one sentence? I'll polish it for you.",
    generatingBullets: "Let me turn what you told me into resume sentences…",
    bulletsHeader: "Here's what I put together 👇",
    bulletsNoneSaved: "Done. Please check it in the editor or preview.",
    bulletsGenFailed: "Couldn't generate sentences, but I saved what you wrote.",

    editExpDone: "Updated! 🎉 Check it in the editor or preview.",

    polishHeader: "Here's my polished version 👇",
    acceptPolishSaid: "I'll go with this",
    keepOriginalSaid: "I'll keep my own wording",

    needContentFirst: "First, describe what you did in one sentence.",

    tasksHeader: "Did you do any of these? Tap the ones that apply. (You can pick several)",
    tasksFallbackMore: "Any other experience? Say 'none' if not.",
    tasksFallbackEnrich: "What exactly did you do? Feel free to describe your role, tasks, results, and more.",
    typeTasksInstead: "Then describe what you did yourself. Even a short note is fine—I'll polish it.",

    edAskType: "What's the level?",
    edAskMajor: "What's your major? (Say 'none' if none)",
    edAskStatus: "What's the status?",
    edAskStart: "When did you start? (e.g. 2020-03, say 'none' if none)",
    edAskEnd: "When did you (expect to) graduate? (e.g. 2024-02, say 'none' if none)",
    edAddedAskMore: "School added! If there's another school, type its name. Say 'none' if not.",

    awAddedAskMore: "Added! You can fill in the issuer and date in the editor. Any more? Say 'none' if not.",

    skAdded: (count) => `Added ${count} skills!`,

    lgAddedAskMore: "Added! Any other languages? Say 'none' if not.",

    lnAddedAskMore: "Added! Any more? Say 'none' if not.",

    introWriteSelf: "Sure, write your self-introduction however you like. I'll add it as is.",
    introWriteSelfSaid: "I'll write it myself",
    introYesSaid: "Yes, please make one",
    introGenerating: "Great! Let me draft a self-introduction based on your experience…",
    introHeader: "Here's a draft 👇",
    introGenFailed: "Couldn't generate a draft. Please write it yourself.",

    repickPrompt: "Pick the type again.",

    optIntroYes: "Yes, please make one",
    optIntroSelf: "I'll write it myself",
    optPolishMore: "✨ Refine more",
    optKeepAsIs: "Keep as is",
    optTypeKeep: "Keep as is",
    optStop: "✓ I'm done",
    optAcceptPolish: "✓ I'll go with this",
    optKeepOriginal: "I'll keep my own wording",
    optGetSuggestions: "Stuck · Get suggestions",
    optTaskPrefix: (task) => `＋ ${task}`,
    optDonePicking: "✓ I've picked them all",
    optNoneTypeMyself: "None fit · Type it myself",

    back: "Back",
    aiChatHeader: (section) => `Chat with AI · ${section}`,
    preview: "Preview",
    writing: "Writing…",
    generatedBulletsHint: "Generated sentences — edit them right away if you don't like them",
    expDoneButton: "Finish this experience",
    doneButton: "Done",
    repickTypeButton: "Pick the type again",
    inputPlaceholder: "Type your answer here",
    close: "Close"
  },

  "zh-CN": {
    sectionBasic: "基本信息",
    sectionIntro: "自我介绍",
    sectionExperiences: "经历",
    sectionEducation: "学历",
    sectionAwards: "资格 · 获奖",
    sectionSkills: "技能",
    sectionLanguages: "语言",
    sectionLinks: "链接",

    basicQName: "请问您叫什么名字？",
    basicQPhone: "可以告诉我您的电话号码吗？（没有就说“没有”）",
    basicQEmail: "也告诉我您的邮箱地址吧？（没有就说“没有”）",
    basicQForeigner: "您是非韩国国籍的外国人吗？",
    basicQJob: "您想从事什么工作？（例如：后端开发、市场营销）如果还不确定，就说“不知道”。",

    openBasic: "我们来填写基本信息吧。请问您叫什么名字？",
    openIntro: "我们来写自我介绍吧。要让 AI 根据您目前输入的经历起草一份吗？",
    openExperiences: "我们来详细填写一段经历吧。是哪种类型的经历呢？请在下方选择。",
    openEducation: "我们来填写学历吧。您就读于哪所学校？（例如：OO大学）",
    openAwards: "您有证书或获奖经历吗？请一个一个写下来。（例如：信息处理工程师）没有就说“没有”。",
    openSkills: "可以用逗号列出您能掌握的技术、工具和能力吗？（例如：React、Figma、数据分析）",
    openLanguages: "您会说哪些语言吗？请按“语言 - 水平”填写。（例如：英语 - 商务）没有就说“没有”。",
    openLinks: "有想展示的链接吗？请填写名称和网址。（例如：作品集 https://...）没有就说“没有”。",

    loadFailed: "无法加载简历。",

    enrichGreeting: (title) => `我们来逐项修改"${title}"吧。😊`,
    enrichTypeIntro: "先看类型。不变就点“保持不变”。",
    basicGreeting: "我们来填写基本信息吧。😊",
    basicAllFilled: "基本信息已经全部填好了！🎉 也来填写其他部分吧。",
    sectionGreeting: (section) => `我们通过对话来填写${section}吧。😊`,

    sectionFinished: (section) => `${section}填写完成！🎉 可以在编辑中进一步完善，或填写其他部分。`,

    niceToMeet: (name) => `很高兴认识您，${name}！`,
    foreignerYes: "明白了！签证类型可以在编辑的基本信息中选择。",
    foreignerNo: "好的，明白了！",

    expAddedAskMore: "已添加到简历！✅ 还有其他经历吗？请选择类型或点“结束”。",
    askOrgKeep: (org) => `公司·机构名称目前是"${org}"。要修改就重新输入，不变就点"保持不变"。`,
    askOrgNew: "公司或机构名称是什么？（没有就点“跳过”）",
    askTitleKeep: (title) => `经历名称·职务是"${title}"。要修改就重新输入，不变就点"保持不变"。`,
    askTitleNew: "这段经历的名称或职务是什么？（例如：咖啡店咖啡师）",
    askPeriodKeep: (period) => `时间是"${period}"。要修改就重新输入（例如：2023-03 ~ 2024-02），不变就点"保持不变"。`,
    askPeriodNew: "是什么时候做的？（例如：2023-03 ~ 2024-02）不清楚就点“跳过”。",
    askContentEdit: (raw) => `最后一步！您做的工作目前是这样 👇\n"${raw}"\n要进一步润色吗？`,
    askContentNew: "最后一步！请用一句话写下您在这里做了什么。我来帮您润色。",
    periodOngoing: "进行中",

    interviewOptionalSuffix: "（没有就说“没有”）",
    interviewIntro: "好的！我们一起把这段经历中您做的事梳理出来。我只问几个问题 😊",
    interviewFallback: "那就简单写一下吧。请用一句话写下您在这里做了什么。",
    finishInterviewNoAnswer: "可以用一句话写下您做了什么吗？我来帮您润色。",
    generatingBullets: "我来用您说的内容生成简历句子…",
    bulletsHeader: "我整理成了这样 👇",
    bulletsNoneSaved: "整理好了。请在编辑·预览中确认。",
    bulletsGenFailed: "句子生成失败了，但您写的内容已保存。",

    editExpDone: "已修改！🎉 请在编辑·预览中确认。",

    polishHeader: "我润色成了这样 👇",
    acceptPolishSaid: "就用这个",
    keepOriginalSaid: "保留我自己写的",

    needContentFirst: "请先用一句话写下您做了什么。",

    tasksHeader: "您做过这些事吗？请点击符合的项。（可多选）",
    tasksFallbackMore: "还有其他经历吗？没有就说“没有”。",
    tasksFallbackEnrich: "具体做了什么？可以自由写下角色、工作内容、成果等。",
    typeTasksInstead: "那就请您自己写下做了什么。写得简短也没关系，我来帮您润色。",

    edAskType: "学历类别是什么？",
    edAskMajor: "专业是什么？（没有就说“没有”）",
    edAskStatus: "状态是什么？",
    edAskStart: "入学时间是？（例如：2020-03，没有就说“没有”）",
    edAskEnd: "毕业（预计）时间是？（例如：2024-02，没有就说“没有”）",
    edAddedAskMore: "已添加学校！如果还有其他学校，请写下校名。没有就说“没有”。",

    awAddedAskMore: "已添加！颁发机构·时间可以在编辑中填写。还有吗？没有就说“没有”。",

    skAdded: (count) => `已添加 ${count} 项技能！`,

    lgAddedAskMore: "已添加！还有其他语言吗？没有就说“没有”。",

    lnAddedAskMore: "已添加！还有吗？没有就说“没有”。",

    introWriteSelf: "好的，请随意写下自我介绍。我会原样放进去。",
    introWriteSelfSaid: "我自己写",
    introYesSaid: "好，帮我写",
    introGenerating: "好的！我来根据您的经历起草一份自我介绍…",
    introHeader: "我写成了这样 👇",
    introGenFailed: "草稿生成失败了。请您自己撰写。",

    repickPrompt: "请重新选择类型。",

    optIntroYes: "好，帮我写",
    optIntroSelf: "我自己写",
    optPolishMore: "✨ 再润色",
    optKeepAsIs: "保持不变",
    optTypeKeep: "保持不变",
    optStop: "✓ 结束",
    optAcceptPolish: "✓ 就用这个",
    optKeepOriginal: "保留我自己写的",
    optGetSuggestions: "没头绪 · 获取建议",
    optTaskPrefix: (task) => `＋ ${task}`,
    optDonePicking: "✓ 都选好了",
    optNoneTypeMyself: "没有合适的 · 自己写",

    back: "返回",
    aiChatHeader: (section) => `与 AI 对话 · ${section}`,
    preview: "预览",
    writing: "生成中…",
    generatedBulletsHint: "生成的句子 — 不满意可以立即修改",
    expDoneButton: "经历填写完成",
    doneButton: "填写完成",
    repickTypeButton: "重新选择类型",
    inputPlaceholder: "请在这里输入您的回答",
    close: "关闭"
  },

  vi: {
    sectionBasic: "Thông tin cơ bản",
    sectionIntro: "Giới thiệu bản thân",
    sectionExperiences: "Kinh nghiệm",
    sectionEducation: "Học vấn",
    sectionAwards: "Chứng chỉ · Giải thưởng",
    sectionSkills: "Kỹ năng",
    sectionLanguages: "Ngoại ngữ",
    sectionLinks: "Liên kết",

    basicQName: "Tên của bạn là gì?",
    basicQPhone: "Bạn cho mình xin số điện thoại nhé? (Nếu không có thì nói 'không có')",
    basicQEmail: "Cho mình xin địa chỉ email nữa nhé? (Nếu không có thì nói 'không có')",
    basicQForeigner: "Bạn có phải người nước ngoài (không mang quốc tịch Hàn) không?",
    basicQJob: "Bạn muốn làm công việc gì? (ví dụ: phát triển backend, marketing) Nếu chưa rõ thì nói 'chưa biết'.",

    openBasic: "Hãy điền thông tin cơ bản nhé. Tên của bạn là gì?",
    openIntro: "Hãy tạo phần giới thiệu bản thân nhé. Bạn có muốn AI soạn bản nháp từ kinh nghiệm bạn đã nhập không?",
    openExperiences: "Hãy điền chi tiết một kinh nghiệm nhé. Đó là loại kinh nghiệm nào? Chọn bên dưới nhé.",
    openEducation: "Hãy điền học vấn nhé. Bạn đã học trường nào? (ví dụ: Đại học OO)",
    openAwards: "Bạn có chứng chỉ hay giải thưởng nào không? Hãy ghi từng cái một. (ví dụ: Kỹ sư xử lý thông tin) Nếu không có thì nói 'không có'.",
    openSkills: "Bạn liệt kê các kỹ năng, công cụ, năng lực mình có, ngăn cách bằng dấu phẩy nhé? (ví dụ: React, Figma, phân tích dữ liệu)",
    openLanguages: "Bạn nói được ngôn ngữ nào không? Hãy ghi theo dạng 'ngôn ngữ - trình độ'. (ví dụ: Tiếng Anh - thương mại) Nếu không có thì nói 'không có'.",
    openLinks: "Bạn có liên kết nào muốn giới thiệu không? Hãy ghi tên và URL. (ví dụ: Portfolio https://...) Nếu không có thì nói 'không có'.",

    loadFailed: "Không tải được hồ sơ.",

    enrichGreeting: (title) => `Hãy chỉnh sửa '${title}' từng phần một nhé. 😊`,
    enrichTypeIntro: "Bắt đầu với loại hình. Nếu giữ nguyên thì bấm 'Giữ nguyên'.",
    basicGreeting: "Hãy điền thông tin cơ bản nhé. 😊",
    basicAllFilled: "Thông tin cơ bản đã được điền đầy đủ rồi! 🎉 Hãy điền cả các mục khác nhé.",
    sectionGreeting: (section) => `Hãy điền ${section} qua trò chuyện nhé. 😊`,

    sectionFinished: (section) => `Đã hoàn thành ${section}! 🎉 Hãy chỉnh sửa thêm trong phần biên tập hoặc điền các mục khác.`,

    niceToMeet: (name) => `Rất vui được gặp bạn, ${name}!`,
    foreignerYes: "Hiểu rồi! Bạn có thể chọn loại visa trong phần Thông tin cơ bản khi biên tập.",
    foreignerNo: "Vâng, hiểu rồi!",

    expAddedAskMore: "Đã thêm vào hồ sơ! ✅ Còn kinh nghiệm nào khác không? Chọn loại hoặc bấm 'Dừng'.",
    askOrgKeep: (org) => `Tên công ty·tổ chức hiện là '${org}'. Muốn đổi thì nhập mới, giữ nguyên thì bấm 'Giữ nguyên'.`,
    askOrgNew: "Tên công ty hoặc tổ chức là gì? (Nếu không có thì bấm 'Bỏ qua')",
    askTitleKeep: (title) => `Tên kinh nghiệm·chức danh là '${title}'. Muốn đổi thì nhập mới, giữ nguyên thì bấm 'Giữ nguyên'.`,
    askTitleNew: "Tên hoặc chức danh của kinh nghiệm này là gì? (ví dụ: Pha chế quán cà phê)",
    askPeriodKeep: (period) => `Thời gian là '${period}'. Muốn đổi thì nhập mới (ví dụ: 2023-03 ~ 2024-02), giữ nguyên thì bấm 'Giữ nguyên'.`,
    askPeriodNew: "Bạn làm khi nào? (ví dụ: 2023-03 ~ 2024-02) Nếu không nhớ thì bấm 'Bỏ qua'.",
    askContentEdit: (raw) => `Cuối cùng! Việc bạn đã làm hiện như sau 👇\n“${raw}”\nBạn có muốn chỉnh thêm không?`,
    askContentNew: "Cuối cùng! Hãy ghi một câu về việc bạn đã làm ở đây. Mình sẽ trau chuốt lại cho.",
    periodOngoing: "Đang diễn ra",

    interviewOptionalSuffix: " (Nếu không có thì nói 'không có')",
    interviewIntro: "Tuyệt! Hãy cùng khai thác những việc bạn đã làm trong kinh nghiệm này. Mình chỉ hỏi vài câu thôi 😊",
    interviewFallback: "Vậy hãy ghi đơn giản thôi. Hãy ghi một câu về việc bạn đã làm ở đây.",
    finishInterviewNoAnswer: "Bạn ghi một câu về việc đã làm nhé? Mình sẽ trau chuốt lại cho.",
    generatingBullets: "Mình sẽ tạo câu cho hồ sơ từ nội dung bạn vừa nói…",
    bulletsHeader: "Mình đã sắp xếp như sau 👇",
    bulletsNoneSaved: "Đã sắp xếp xong. Hãy kiểm tra trong phần biên tập·xem trước.",
    bulletsGenFailed: "Tạo câu thất bại, nhưng nội dung bạn ghi đã được lưu.",

    editExpDone: "Đã chỉnh sửa! 🎉 Hãy kiểm tra trong phần biên tập·xem trước.",

    polishHeader: "Mình đã trau chuốt như sau 👇",
    acceptPolishSaid: "Mình chọn cái này",
    keepOriginalSaid: "Giữ nguyên cách viết của mình",

    needContentFirst: "Trước tiên hãy ghi một câu về việc bạn đã làm nhé.",

    tasksHeader: "Bạn có làm những việc này không? Hãy bấm vào những mục phù hợp. (Có thể chọn nhiều)",
    tasksFallbackMore: "Còn kinh nghiệm nào khác không? Nếu không có thì nói 'không có'.",
    tasksFallbackEnrich: "Cụ thể bạn đã làm gì? Hãy thoải mái ghi vai trò·việc làm·thành quả, v.v.",
    typeTasksInstead: "Vậy hãy tự ghi việc bạn đã làm nhé. Ghi ngắn cũng được, mình sẽ trau chuốt lại cho.",

    edAskType: "Bậc học là gì?",
    edAskMajor: "Chuyên ngành của bạn là gì? (Nếu không có thì nói 'không có')",
    edAskStatus: "Tình trạng là gì?",
    edAskStart: "Thời điểm nhập học là khi nào? (ví dụ: 2020-03, nếu không có thì nói 'không có')",
    edAskEnd: "Thời điểm tốt nghiệp (dự kiến) là khi nào? (ví dụ: 2024-02, nếu không có thì nói 'không có')",
    edAddedAskMore: "Đã thêm trường! Nếu còn trường khác, hãy ghi tên trường. Nếu không có thì nói 'không có'.",

    awAddedAskMore: "Đã thêm! Nơi cấp·thời gian có thể điền trong phần biên tập. Còn nữa không? Nếu không có thì nói 'không có'.",

    skAdded: (count) => `Đã thêm ${count} kỹ năng!`,

    lgAddedAskMore: "Đã thêm! Còn ngôn ngữ nào khác không? Nếu không có thì nói 'không có'.",

    lnAddedAskMore: "Đã thêm! Còn nữa không? Nếu không có thì nói 'không có'.",

    introWriteSelf: "Được, hãy thoải mái viết phần giới thiệu bản thân. Mình sẽ đưa vào nguyên văn.",
    introWriteSelfSaid: "Mình tự viết",
    introYesSaid: "Vâng, hãy soạn giúp mình",
    introGenerating: "Tuyệt! Mình sẽ soạn bản nháp giới thiệu dựa trên kinh nghiệm của bạn…",
    introHeader: "Mình đã viết như sau 👇",
    introGenFailed: "Tạo bản nháp thất bại. Bạn hãy tự viết nhé.",

    repickPrompt: "Hãy chọn lại loại hình.",

    optIntroYes: "Vâng, hãy soạn giúp mình",
    optIntroSelf: "Mình tự viết",
    optPolishMore: "✨ Trau chuốt thêm",
    optKeepAsIs: "Giữ nguyên",
    optTypeKeep: "Giữ nguyên",
    optStop: "✓ Mình xong rồi",
    optAcceptPolish: "✓ Mình chọn cái này",
    optKeepOriginal: "Giữ nguyên cách viết của mình",
    optGetSuggestions: "Bí ý tưởng · Nhận gợi ý",
    optTaskPrefix: (task) => `＋ ${task}`,
    optDonePicking: "✓ Đã chọn xong",
    optNoneTypeMyself: "Không có cái phù hợp · Tự ghi",

    back: "Quay lại",
    aiChatHeader: (section) => `Trò chuyện với AI · ${section}`,
    preview: "Xem trước",
    writing: "Đang soạn…",
    generatedBulletsHint: "Câu đã tạo — nếu không ưng, hãy sửa ngay",
    expDoneButton: "Hoàn thành kinh nghiệm",
    doneButton: "Hoàn thành",
    repickTypeButton: "Chọn lại loại hình",
    inputPlaceholder: "Hãy ghi câu trả lời của bạn ở đây",
    close: "Đóng"
  },

  ja: {
    sectionBasic: "基本情報",
    sectionIntro: "自己紹介",
    sectionExperiences: "経験",
    sectionEducation: "学歴",
    sectionAwards: "資格 · 受賞",
    sectionSkills: "スキル",
    sectionLanguages: "語学",
    sectionLinks: "リンク",

    basicQName: "お名前を教えてください。",
    basicQPhone: "電話番号を教えてもらえますか？（なければ「なし」）",
    basicQEmail: "メールアドレスも教えてもらえますか？（なければ「なし」）",
    basicQForeigner: "韓国国籍ではない外国籍の方ですか？",
    basicQJob: "どんな仕事をしたいですか？（例：バックエンド開発、マーケティング）まだ分からなければ「分からない」と入力してください。",

    openBasic: "基本情報を埋めていきましょう。お名前を教えてください。",
    openIntro: "自己紹介を作りましょう。これまで入力した経験をもとに、AIが下書きを書きましょうか？",
    openExperiences: "経験を1つ、詳しく埋めていきましょう。どんな種類の経験ですか？下から選んでください。",
    openEducation: "学歴を埋めていきましょう。どの学校に通っていましたか？（例：OO大学）",
    openAwards: "資格や受賞歴はありますか？1つずつ書いてください。（例：情報処理技士）なければ「なし」。",
    openSkills: "扱える技術・ツール・スキルをカンマ区切りで書いてもらえますか？（例：React、Figma、データ分析）",
    openLanguages: "話せる言語はありますか？「言語 - レベル」で書いてください。（例：英語 - ビジネス）なければ「なし」。",
    openLinks: "見せたいリンクはありますか？名前とURLを書いてください。（例：ポートフォリオ https://...）なければ「なし」。",

    loadFailed: "履歴書を読み込めませんでした。",

    enrichGreeting: (title) => `「${title}」を1つずつ直していきましょう。😊`,
    enrichTypeIntro: "まずは種類から見ましょう。そのままなら「そのまま」を押してください。",
    basicGreeting: "基本情報を埋めていきましょう。😊",
    basicAllFilled: "基本情報はすでにすべて埋まっています！🎉 他の項目も埋めてみましょう。",
    sectionGreeting: (section) => `${section}を会話で埋めていきましょう。😊`,

    sectionFinished: (section) => `${section}の作成が終わりました！🎉 編集でさらに整えたり、他の項目も埋めてみましょう。`,

    niceToMeet: (name) => `はじめまして、${name}さん！`,
    foreignerYes: "わかりました！ビザの種類は編集の基本情報で選べます。",
    foreignerNo: "はい、わかりました！",

    expAddedAskMore: "履歴書に追加しました！✅ 他に経験はありますか？種類を選ぶか「やめる」を押してください。",
    askOrgKeep: (org) => `会社・団体名は今「${org}」です。変えるなら新しく、そのままなら「そのまま」。`,
    askOrgNew: "会社・団体名を教えてください。（なければ「スキップ」）",
    askTitleKeep: (title) => `経験名・役職は「${title}」です。変えるなら新しく、そのままなら「そのまま」。`,
    askTitleNew: "この経験の名前や役職は？（例：カフェのバリスタ）",
    askPeriodKeep: (period) => `期間は「${period}」です。変えるなら新しく（例：2023-03 ~ 2024-02）、そのままなら「そのまま」。`,
    askPeriodNew: "いつ行いましたか？（例：2023-03 ~ 2024-02）分からなければ「スキップ」。",
    askContentEdit: (raw) => `最後です！やったことは今こうなっています 👇\n「${raw}」\nさらに整えますか？`,
    askContentNew: "最後です！ここで何をしたか一文で書いてください。私が整えます。",
    periodOngoing: "進行中",

    interviewOptionalSuffix: "（なければ「なし」）",
    interviewIntro: "いいですね！この経験でやったことを一緒に引き出していきましょう。いくつか質問するだけです 😊",
    interviewFallback: "では簡単に書いてみましょう。ここで何をしたか一文で書いてください。",
    finishInterviewNoAnswer: "何をしたか一文だけ書いてもらえますか？私が整えます。",
    generatingBullets: "話してくれた内容で履歴書の文章を作ってみます…",
    bulletsHeader: "こう整理しました 👇",
    bulletsNoneSaved: "整理しました。編集・プレビューで確認してください。",
    bulletsGenFailed: "文章の生成に失敗しました。書いてくれた内容は保存しました。",

    editExpDone: "修正しました！🎉 編集・プレビューで確認してください。",

    polishHeader: "こう整えてみました 👇",
    acceptPolishSaid: "これにします",
    keepOriginalSaid: "自分で書いたままにします",

    needContentFirst: "まず何をしたか一文書いてください。",

    tasksHeader: "こんなことをしましたか？当てはまるものを押してください。（複数可）",
    tasksFallbackMore: "他に経験はありますか？なければ「なし」。",
    tasksFallbackEnrich: "具体的にどんなことをしましたか？役割・やったこと・成果などを自由に書いてください。",
    typeTasksInstead: "では、やったことを自分で書いてください。短くても私が整えます。",

    edAskType: "区分は何ですか？",
    edAskMajor: "専攻は何ですか？（なければ「なし」）",
    edAskStatus: "状態は何ですか？",
    edAskStart: "入学時期は？（例：2020-03、なければ「なし」）",
    edAskEnd: "卒業（予定）時期は？（例：2024-02、なければ「なし」）",
    edAddedAskMore: "学校を追加しました！他に学校があれば学校名を書いてください。なければ「なし」。",

    awAddedAskMore: "追加しました！発行元・時期は編集で埋められます。他にありますか？なければ「なし」。",

    skAdded: (count) => `${count}個のスキルを追加しました！`,

    lgAddedAskMore: "追加しました！他に言語はありますか？なければ「なし」。",

    lnAddedAskMore: "追加しました！他にありますか？なければ「なし」。",

    introWriteSelf: "では、自己紹介を自由に書いてください。そのまま入れます。",
    introWriteSelfSaid: "自分で書きます",
    introYesSaid: "はい、作ってください",
    introGenerating: "いいですね！経験をもとに自己紹介の下書きを書いてみます…",
    introHeader: "こう書いてみました 👇",
    introGenFailed: "下書きの生成に失敗しました。ご自身で作成してください。",

    repickPrompt: "種類をもう一度選んでください。",

    optIntroYes: "はい、作ってください",
    optIntroSelf: "自分で書きます",
    optPolishMore: "✨ さらに整える",
    optKeepAsIs: "そのままにします",
    optTypeKeep: "そのまま",
    optStop: "✓ やめます",
    optAcceptPolish: "✓ これにします",
    optKeepOriginal: "自分で書いたままにします",
    optGetSuggestions: "思いつかない · 提案をもらう",
    optTaskPrefix: (task) => `＋ ${task}`,
    optDonePicking: "✓ 全部選びました",
    optNoneTypeMyself: "合うものがない · 自分で書く",

    back: "戻る",
    aiChatHeader: (section) => `AIと会話 · ${section}`,
    preview: "プレビュー",
    writing: "作成中…",
    generatedBulletsHint: "生成された文章 — 気に入らなければすぐ直してください",
    expDoneButton: "経験の作成完了",
    doneButton: "作成完了",
    repickTypeButton: "種類を選び直す",
    inputPlaceholder: "ここに答えを書いてください",
    close: "閉じる"
  },

  id: {
    sectionBasic: "Info dasar",
    sectionIntro: "Perkenalan diri",
    sectionExperiences: "Pengalaman",
    sectionEducation: "Pendidikan",
    sectionAwards: "Sertifikat · Penghargaan",
    sectionSkills: "Keahlian",
    sectionLanguages: "Bahasa",
    sectionLinks: "Tautan",

    basicQName: "Siapa nama Anda?",
    basicQPhone: "Boleh beri tahu nomor telepon Anda? (Jika tidak ada, ketik 'tidak ada')",
    basicQEmail: "Boleh beri tahu alamat email Anda juga? (Jika tidak ada, ketik 'tidak ada')",
    basicQForeigner: "Apakah Anda warga negara asing (bukan warga negara Korea)?",
    basicQJob: "Pekerjaan seperti apa yang Anda inginkan? (mis. pengembangan backend, marketing) Jika belum yakin, ketik 'belum tahu'.",

    openBasic: "Mari isi info dasar Anda. Siapa nama Anda?",
    openIntro: "Mari buat perkenalan diri Anda. Mau AI menyusun draf dari pengalaman yang sudah Anda masukkan?",
    openExperiences: "Mari isi satu pengalaman secara rinci. Jenis pengalaman apa ini? Pilih di bawah.",
    openEducation: "Mari isi pendidikan Anda. Sekolah mana yang Anda tempuh? (mis. Universitas OO)",
    openAwards: "Apakah Anda punya sertifikat atau penghargaan? Tuliskan satu per satu. (mis. Insinyur Pemrosesan Informasi) Jika tidak ada, ketik 'tidak ada'.",
    openSkills: "Boleh sebutkan keahlian, alat, dan kemampuan yang Anda kuasai, dipisahkan koma? (mis. React, Figma, analisis data)",
    openLanguages: "Apakah Anda bisa berbahasa tertentu? Tulis dengan format 'bahasa - tingkat'. (mis. Inggris - bisnis) Jika tidak ada, ketik 'tidak ada'.",
    openLinks: "Ada tautan yang ingin ditampilkan? Tulis nama dan URL. (mis. Portofolio https://...) Jika tidak ada, ketik 'tidak ada'.",

    loadFailed: "Tidak dapat memuat resume.",

    enrichGreeting: (title) => `Mari perbaiki '${title}' satu per satu. 😊`,
    enrichTypeIntro: "Mulai dari jenisnya. Jika tetap, tekan 'Biarkan'.",
    basicGreeting: "Mari isi info dasar Anda. 😊",
    basicAllFilled: "Info dasar sudah lengkap! 🎉 Coba isi bagian lain juga.",
    sectionGreeting: (section) => `Mari isi ${section} lewat obrolan. 😊`,

    sectionFinished: (section) => `${section} selesai! 🎉 Sempurnakan lagi di editor atau isi bagian lain.`,

    niceToMeet: (name) => `Senang berkenalan, ${name}!`,
    foreignerYes: "Baik! Jenis visa bisa dipilih di Info dasar pada editor.",
    foreignerNo: "Baik, mengerti!",

    expAddedAskMore: "Ditambahkan ke resume! ✅ Ada pengalaman lain? Pilih jenisnya atau tekan 'Berhenti'.",
    askOrgKeep: (org) => `Nama perusahaan/organisasi saat ini '${org}'. Ketik baru untuk mengubah, atau tekan 'Biarkan'.`,
    askOrgNew: "Apa nama perusahaan atau organisasinya? (Jika tidak ada, tekan 'Lewati')",
    askTitleKeep: (title) => `Nama pengalaman/jabatan adalah '${title}'. Ketik baru untuk mengubah, atau tekan 'Biarkan'.`,
    askTitleNew: "Apa nama atau jabatan pengalaman ini? (mis. Barista kafe)",
    askPeriodKeep: (period) => `Periodenya '${period}'. Ketik baru untuk mengubah (mis. 2023-03 ~ 2024-02), atau tekan 'Biarkan'.`,
    askPeriodNew: "Kapan Anda melakukannya? (mis. 2023-03 ~ 2024-02) Jika tidak tahu, tekan 'Lewati'.",
    askContentEdit: (raw) => `Terakhir! Yang Anda kerjakan saat ini begini 👇\n“${raw}”\nMau disempurnakan lagi?`,
    askContentNew: "Terakhir! Tuliskan dalam satu kalimat apa yang Anda kerjakan di sini. Saya akan memolesnya.",
    periodOngoing: "Sedang berlangsung",

    interviewOptionalSuffix: " (Jika tidak ada, ketik 'tidak ada')",
    interviewIntro: "Bagus! Mari kita gali bersama apa yang Anda kerjakan di pengalaman ini. Saya hanya akan bertanya beberapa hal 😊",
    interviewFallback: "Kalau begitu, tulis singkat saja. Tuliskan dalam satu kalimat apa yang Anda kerjakan di sini.",
    finishInterviewNoAnswer: "Boleh tuliskan apa yang Anda kerjakan dalam satu kalimat? Saya akan memolesnya.",
    generatingBullets: "Saya akan membuat kalimat resume dari yang Anda sampaikan…",
    bulletsHeader: "Saya merapikannya seperti ini 👇",
    bulletsNoneSaved: "Sudah dirapikan. Silakan cek di editor atau pratinjau.",
    bulletsGenFailed: "Gagal membuat kalimat, tetapi yang Anda tulis sudah disimpan.",

    editExpDone: "Sudah diperbarui! 🎉 Silakan cek di editor atau pratinjau.",

    polishHeader: "Saya poles seperti ini 👇",
    acceptPolishSaid: "Saya pakai ini",
    keepOriginalSaid: "Biarkan tulisan saya sendiri",

    needContentFirst: "Tuliskan dulu apa yang Anda kerjakan dalam satu kalimat.",

    tasksHeader: "Apakah Anda mengerjakan hal-hal ini? Tekan yang sesuai. (Bisa pilih beberapa)",
    tasksFallbackMore: "Ada pengalaman lain? Jika tidak ada, ketik 'tidak ada'.",
    tasksFallbackEnrich: "Apa tepatnya yang Anda kerjakan? Silakan tulis peran, tugas, hasil, dan lainnya dengan bebas.",
    typeTasksInstead: "Kalau begitu, tulis sendiri apa yang Anda kerjakan. Singkat pun tidak apa, saya akan memolesnya.",

    edAskType: "Apa jenjangnya?",
    edAskMajor: "Apa jurusan Anda? (Jika tidak ada, ketik 'tidak ada')",
    edAskStatus: "Apa statusnya?",
    edAskStart: "Kapan mulai masuk? (mis. 2020-03, jika tidak ada ketik 'tidak ada')",
    edAskEnd: "Kapan lulus (perkiraan)? (mis. 2024-02, jika tidak ada ketik 'tidak ada')",
    edAddedAskMore: "Sekolah ditambahkan! Jika ada sekolah lain, tuliskan namanya. Jika tidak ada, ketik 'tidak ada'.",

    awAddedAskMore: "Ditambahkan! Penerbit·tanggal bisa diisi di editor. Ada lagi? Jika tidak ada, ketik 'tidak ada'.",

    skAdded: (count) => `${count} keahlian ditambahkan!`,

    lgAddedAskMore: "Ditambahkan! Ada bahasa lain? Jika tidak ada, ketik 'tidak ada'.",

    lnAddedAskMore: "Ditambahkan! Ada lagi? Jika tidak ada, ketik 'tidak ada'.",

    introWriteSelf: "Baik, tulis perkenalan diri Anda sesuka hati. Saya akan memasukkannya apa adanya.",
    introWriteSelfSaid: "Saya tulis sendiri",
    introYesSaid: "Ya, tolong buatkan",
    introGenerating: "Bagus! Saya akan menyusun draf perkenalan berdasarkan pengalaman Anda…",
    introHeader: "Saya menulisnya seperti ini 👇",
    introGenFailed: "Gagal membuat draf. Silakan tulis sendiri.",

    repickPrompt: "Pilih jenisnya lagi.",

    optIntroYes: "Ya, tolong buatkan",
    optIntroSelf: "Saya tulis sendiri",
    optPolishMore: "✨ Poles lagi",
    optKeepAsIs: "Biarkan",
    optTypeKeep: "Biarkan",
    optStop: "✓ Selesai",
    optAcceptPolish: "✓ Saya pakai ini",
    optKeepOriginal: "Biarkan tulisan saya sendiri",
    optGetSuggestions: "Buntu · Minta saran",
    optTaskPrefix: (task) => `＋ ${task}`,
    optDonePicking: "✓ Sudah pilih semua",
    optNoneTypeMyself: "Tidak ada yang cocok · Tulis sendiri",

    back: "Kembali",
    aiChatHeader: (section) => `Mengobrol dengan AI · ${section}`,
    preview: "Pratinjau",
    writing: "Menulis…",
    generatedBulletsHint: "Kalimat yang dihasilkan — langsung edit jika kurang sesuai",
    expDoneButton: "Selesaikan pengalaman",
    doneButton: "Selesai",
    repickTypeButton: "Pilih jenisnya lagi",
    inputPlaceholder: "Tulis jawaban Anda di sini",
    close: "Tutup"
  }
};

export function useChatCopy(): Copy {
  const { locale } = useLanguage();
  return dict[locale] ?? dict.en;
}

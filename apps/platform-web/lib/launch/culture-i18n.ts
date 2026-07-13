"use client";

// Career Launch 문화수업(CULTURE_LESSONS) 다국어 콘텐츠.
// data.ts 의 한국어 원본을 ko 기준으로 두고, en/zh-CN/vi/ja/id 번역을 담는다.
// useLocalizedCulture(id) 로 현재 로케일의 CultureLesson 을 반환하며,
// 번역이 없으면 data.ts 의 한국어 레슨으로 폴백한다.

import { useLanguage } from "../../components/i18n/LanguageProvider";
import { CULTURE_LESSONS, type CultureLesson } from "./data";
import type { LaunchLocale } from "./i18n";

// 번역이 담기는 로케일(ko 는 data.ts 원본을 그대로 씀).
type TranslatedLocale = Exclude<LaunchLocale, "ko">;

// 레슨 id → (로케일 → 번역된 CultureLesson).
type CultureI18n = Record<string, Partial<Record<TranslatedLocale, CultureLesson>>>;

export const CULTURE_LESSONS_I18N: CultureI18n = {
  w1s4: {
    en: {
      id: "w1s4",
      emoji: "🏢",
      title: "Understanding Korean Corporate Culture",
      intro:
        "Learn broadly about Korea — from hiring methods to job titles, communication, and labor systems. Knowing the culture helps you set the right direction for your resume and interviews, and makes settling in after you join much smoother. Read slowly and check yourself with the quiz at the end.",
      objectives: [
        "Explain Korea's hiring methods (open recruitment vs. rolling hiring) and the stages of the selection process",
        "Distinguish the traits of different company types and judge which suits you",
        "Understand basic workplace etiquette such as titles, forms of address, and honorific speech",
        "Know what to prepare as a foreigner (visa, Korean language, your strengths)"
      ],
      sections: [
        {
          heading: "1. This Is How Hiring Works",
          emoji: "🧭",
          summary: "Get the big picture of the Korean job search first. Once you know when and in what stages companies hire, the order in which to prepare becomes clear.",
          items: [
            { title: "Open recruitment and rolling hiring", body: "Large companies run regular open recruitment (gongchae) in spring and fall, while startups, foreign firms, and mid-sized companies mostly hire on a rolling (as-needed) basis. Because open recruitment has fixed timing, it matters to prepare your cover letter and aptitude test in advance; for rolling hiring, you need to apply quickly when a posting appears to seize the chance. Knowing which type your target companies use helps you align your timing and prep.", tip: "Search now to check whether your three target companies use open recruitment or rolling hiring.", example: "e.g. Large firms like Samsung, Hyundai Motor, and SK usually run open recruitment in the first half (Mar–Apr) and second half (Sep–Oct), while startups like Toss and Karrot post rolling openings on Saramin and Wanted." },
            { title: "Selection stages", body: "It usually goes: documents (resume and cover letter) → aptitude/coding test → working-level interview → executive interview. Each stage looks for something different — the documents show 'a reason to meet this person,' and the interview checks 'whether you're someone we want to work with.' Rather than starting to prepare for the next stage only after passing one, sketching out the whole flow before applying will put your mind at ease.", example: "e.g. Pass documents → online aptitude/coding test → 1st working-level interview (job questions) → 2nd executive interview (personality, values) → final offer; this usually takes 4–8 weeks." },
            { title: "The weight of the cover letter", body: "Korea places special importance on the cover letter (jagisogaeseo). The key is to tell your motivation, growth story, and job competency as a 'story' rather than a plain list, so you need to include concrete experiences along with the concerns and results of the time to be persuasive. Foreign applicants in particular gain an edge by sincerely conveying 'why Korea, and why this company.'", tip: "You'll write your cover letter directly in Week 3 of this program, so for now just remember 'why it matters.'" },
            { title: "Internship, industry-academic, and hire-linked tracks", body: "There are many paths where you first gain experience through an internship or industry-academic cooperation and then convert to a full-time role. It's a great entry point for new grads with little experience, letting you learn on the job while both sides check the fit. For international students especially, internship experience serves as proof that you've adapted to Korean organizational culture, which helps a lot when applying for full-time roles.", tip: "Watch for 'hire-linked internship' postings first. They recruit on the premise of full-time conversion, so passing is more likely to lead to employment." }
          ]
        },
        {
          heading: "2. Every Company Type Has Its Own Color",
          emoji: "🏢",
          summary: "Even the same 'job' differs in culture and preparation depending on the type of company. Read while picturing where fits your temperament.",
          items: [
            { title: "Large companies", body: "Their strengths are systematic training, stable employment, and solid benefits, making them great for new grads to build fundamentals. On the other hand, open-recruitment competition is fierce, the process is long, and you have to prepare an aptitude test, so if you decide to apply, plan a few months ahead. Also note in advance that with a big organization, roles are highly specialized.", example: "e.g. Samsung Electronics, LG, Hyundai Motor, SK Hynix. Samsung uses the GSAT, and others often run their own aptitude tests." },
            { title: "Mid-sized companies", body: "Sitting between large firms and startups, they offer a degree of stability while letting you gain broad hands-on experience. The process isn't as complex as at large firms, so rolling hiring is common, and one person may handle several tasks, which tends to speed up growth. Many lesser-known 'hidden champions' are excellent, so look at the company's history and business together." },
            { title: "Startups", body: "Fast growth, diverse role experience, and a flat communication culture are the draw. Decisions are quick and you can put ideas into action right away, which suits people who want to work proactively. On the other hand, change is frequent and employment/benefits can be uncertain, so it's good to also check the company's funding stage and stability before applying.", tip: "Before applying, checking a startup's funding news or hiring scale on the news or LinkedIn helps you gauge its stability." },
            { title: "Foreign companies", body: "There's a lot of English use and a performance/individual-centered culture, so you're evaluated more by ability and results than by hierarchy. It's a great place to leverage an international student's language skills and global sense, and working with colleagues of many nationalities means relatively less culture-adaptation burden. That said, some hire in small numbers or focus on experienced hires, so check whether they recruit new grads.", tip: "Foreign and global teams are especially favorable for international students. Be sure to add them to your list.", example: "e.g. Google, Microsoft, L'Oréal, P&G. Searching 'Korea' on LinkedIn makes it easy to find Korea-office postings." },
            { title: "Public enterprises and public institutions", body: "Employment is stable, and blind hiring is common, so they value job fit and the written test (NCS) over school, age, or background. Thanks to the fair process, you can get results matching your effort even without a flashy resume. However, foreigners sometimes face nationality/visa requirements in the eligibility criteria, so always check the posting's qualifications first." }
          ]
        },
        {
          heading: "3. Titles, Forms of Address, and Hierarchy Culture",
          emoji: "🎓",
          summary: "This is the basics of Korean workplace etiquette. A single small form of address can shape a first impression.",
          items: [
            { title: "The rank system", body: "Traditionally it rises: staff (sawon) → assistant manager (daeri) → manager (gwajang) → deputy general manager (chajang) → general manager (bujang) → executive. Knowing the ranks gives you a sense of who to address and how in meetings or emails. These days more companies unify titles to 'nim,' 'pro,' or 'manager' for a flatter culture, so once you join, just ask about that company's way first and follow it." },
            { title: "Address etiquette", body: "Rather than calling someone by name alone, it's basic to use '○○-nim' or their rank (team lead, manager). It's the first courtesy of respecting the other person, and a single form of address can give the impression of 'someone who knows manners.' When you don't know their rank, rather than forcing a guess, using '○○-nim' is the safest.", tip: "If you don't know the other person's rank, '○○-nim' is the safest first.", example: "e.g. For team lead Kim Min-su, 'team lead' feels more natural than 'Min-su-nim'; for a same-rank colleague Lee Ji-eun, 'Ji-eun-nim' works well." },
            { title: "Age, seniority, and rank", body: "An atmosphere of respecting age and years of service still lingers. A polite, humble attitude makes a good impression in any organization, and showing a willingness to learn from seniors first makes relationships much smoother. That said, you don't need to shrink excessively — natural respect is enough." },
            { title: "Honorifics are the default", body: "At work, you use honorific speech by default regardless of the other person's age or closeness. Honorifics aren't distance but the courtesy of treating each other formally, so it's natural to keep them in meetings or work settings even after you've grown close. Even if it isn't perfect, people appreciate the very attempt to use honorifics, so you don't need to feel pressured.", example: "e.g. 'Do this' (X) → 'Could you please check this part' (O); 'Got it' (X) → 'Yes, understood' (O) is how to switch." }
          ]
        },
        {
          heading: "4. Ways of Working and the Atmosphere",
          emoji: "🤝",
          summary: "Learn in advance how work actually flows at a company, so you're not caught off guard after joining.",
          items: [
            { title: "Team-centered", body: "As much as individual ability, team performance and collaboration are valued. People who work well in sync with colleagues and share information are preferred over those who just do well alone, so an attitude of thinking about the whole team's goals while doing your part matters. Interviews often ask about collaboration experience too, so it's good to organize relevant examples in advance." },
            { title: "Reporting and decision-making", body: "Korean organizations especially value 'reporting.' Frequently sharing progress with your supervisor builds trust, and big decisions tend to require higher-up approval rather than being finished at the person-in-charge level. It may feel cumbersome at first, but the more you share, the more you reduce mistakes and get help quickly.", tip: "'Interim reporting' isn't reading the room — it's trust. When you're stuck, don't suffer alone; share early." },
            { title: "Meeting culture", body: "A meeting is less a place to chat and more a place to reach conclusions and assign each person's role. Long, formal meetings used to be common, but these days they're shifting to short, efficient ones, so grasping the agenda in advance and preparing needed materials makes a good impression. It's fine to politely ask about parts you don't understand during the meeting." },
            { title: "Nunchi and reading the room", body: "There's a 'nunchi' culture of gauging the situation and the other person's mood without spelling everything out. It may feel hard at first, but it's really a sense of considering the people you work with, and you'll naturally pick it up as you observe. When unsure, don't misunderstand on your own — politely confirm with 'Would it be okay to do it this way?'" },
            { title: "The shift in work-life balance", body: "The old culture of overtime and company dinners is shrinking fast, and the statutory 52-hour week, flexible work, and remote work are taking hold. Since the atmosphere differs by company, if work-life balance matters to you, it's good to check the actual work culture before applying via the posting or reviews like JobPlanet. More companies are respecting personal time, so you don't need to worry too much." }
          ]
        },
        {
          heading: "5. Relationships and Communication Culture",
          emoji: "🍽️",
          summary: "How to get along with colleagues. The culture of forcing participation has faded, so take it in comfortably.",
          items: [
            { title: "Company dinner culture", body: "A company dinner (hoesik) is a place to build camaraderie among team members, but unlike the past, the atmosphere of pushing alcohol has faded a lot and participation is becoming more voluntary. If it feels burdensome, politely pacing yourself or leaving early is natural these days too. That said, attending the first few times and mingling comfortably helps break the ice with colleagues.", example: "e.g. If you can't drink, cheerfully saying 'I'm not really a drinker, so I'll go with a soft drink. Let's chat a lot instead!' gets you through without issue." },
            { title: "Lunch culture", body: "At Korean workplaces, people often grow close naturally over lunch with teammates. You're not obligated to join every time, but occasionally eating together lets you talk about things beyond work and ease any awkwardness. If there's a menu you'd like or a food you can't eat, feel free to say so." },
            { title: "Marking life events", body: "There's a culture of joining colleagues for big life events like weddings and funerals (congratulatory/condolence money). The amount or method may feel unfamiliar, but there's no fixed rule, so when unsure, ask a close colleague, 'Roughly how much do people usually give?' It's easier to understand it as a culture of expressing your heart.", tip: "Congratulatory/condolence money is often given in units of 30,000, 50,000, or 100,000 won. It varies by closeness, so ask a colleague." },
            { title: "Separating public and private", body: "No matter how close you are privately, keeping courtesy and responsibility at work is considered professional. Doing your job carelessly on the excuse of friendship, or dragging personal feelings into work, easily loses trust, so an attitude of definitely getting your assigned work done regardless of closeness matters. People who keep this balance well earn lasting trust." }
          ]
        },
        {
          heading: "6. Working Conditions and Systems",
          emoji: "📋",
          summary: "Important content related to your rights. As a foreigner, be sure to remember the visa part in particular.",
          items: [
            { title: "Employment contract and 4 major insurances", body: "When you join, be sure to check the employment contract stating working hours, salary, and job content, and receive a copy after signing. The four major insurances (national pension, health insurance, employment insurance, industrial accident insurance) apply by default to regular workers — a portion is deducted from your salary, but they're a safety net that protects you. If any contract terms are unclear, always ask and confirm.", tip: "Be cautious if someone asks you to work without an employment contract. A written contract is the basic protection for you." },
            { title: "Salary structure", body: "Salary is usually made up of base pay + performance pay (incentive) + benefits, and saying 'annual salary 36 million won' usually means the pre-tax yearly total. Since your actual monthly take-home has taxes and the four insurances deducted, it shrinks a bit, so don't assume the offered salary divided by 12 lands in your account as is. Be sure to check whether incentives are included.", example: "e.g. An annual salary of 36 million won is 3 million won/month (pre-tax), but after tax and the four insurances, take-home is roughly around 2.7 million won/month." },
            { title: "Annual leave and vacation", body: "After working a certain period, you legally accrue paid annual leave, and after one year it usually starts at 15 days a year. Annual leave is a worker's rightful entitlement, and more companies encourage using it as the system intends, without reading the room. Sharing your schedule in advance and using your leave doesn't burden the team and lets you rest comfortably too." },
            { title: "Foreigner work visa", body: "You generally can't take a regular job on a study (D-2) visa; to work full-time you usually need to change to an E-7 (Specific Activities) visa. This visa is structured so the company becomes your sponsor and applies together, so it matters whether the company has experience hiring foreigners and supporting visas. That's why you must confirm visa-support availability during the hiring and interview stages.", tip: "During interviews/hiring, be sure to confirm 'whether E-7 visa sponsorship is possible.' It's very important.", example: "e.g. At the end of an interview, you can politely ask, 'May I ask whether this position can sponsor an E-7 visa for foreign hires?'" }
          ]
        },
        {
          heading: "7. How to Prepare as a Foreigner",
          emoji: "🌏",
          summary: "Finally, let's organize the weapons and prep unique to you as an international student.",
          items: [
            { title: "Your own strengths", body: "Multilingual ability, a global sense, and understanding of multiple cultures are big weapons Korean applicants don't have. They shine especially in jobs expanding overseas markets or dealing with foreign customers and partners, so show these strengths as concrete examples in your cover letter and interview. Connecting them to 'the reason I, specifically, help this company' makes you more persuasive.", example: "e.g. Connect your strength to the job like, 'If it's a team preparing to enter the Vietnamese market, I — who understands Vietnamese and the local culture — can contribute to customer communication.'" },
            { title: "Korean language prep", body: "Your working Korean ability and TOPIK score are solid assets that build trust on paper. Even if your pronunciation or grammar isn't perfect, companies view a sincere willingness to learn and effort to communicate more favorably. Getting familiar now with expressions frequently used in emails and meetings makes adapting after you join much easier.", tip: "TOPIK level 4 or above is often recognized as enough for work communication. Set a target score and prepare steadily." },
            { title: "Culture-adaptation tips", body: "You don't need to shrink because the culture is different — just observe, ask, and learn one thing at a time. Not knowing isn't embarrassing; it comes across as a willingness to learn, so a habit of asking politely actually makes a good impression. Sincerity and respect for others build firm trust as time passes." },
            { title: "Avoiding common misunderstandings", body: "In Korean workplaces, silence doesn't always mean agreement, and people often decline euphemistically, like 'I'll look into it.' Taking others' words too literally can cause misunderstandings, so when unsure, a habit of politely reconfirming — 'I understood it this way, is that right?' — is good. Such reconfirming is taken as thoroughness, not rudeness." }
          ]
        }
      ],
      quiz: [
        {
          question: "Which is closest to the typical hiring method of large companies?",
          options: ["Rolling hiring whenever needed", "Regular open recruitment in spring and fall", "Hiring only by referral", "Hardly hiring at all"],
          answer: 1,
          explain: "Large companies often run regular open recruitment in spring and fall, while startups, foreign firms, and mid-sized companies do a lot of rolling hiring."
        },
        {
          question: "What is the safest way to address a colleague at a Korean workplace?",
          options: ["Call them by name only", "Use '○○-nim' or their rank", "Call them by a nickname", "Use only their surname"],
          answer: 1,
          explain: "Rather than name alone, using '○○-nim' or their rank (team lead, etc.) is basic etiquette."
        },
        {
          question: "Which work visa does a foreigner usually need to work full-time in Korea?",
          options: ["D-2 (study)", "E-7 (specific activities)", "B-2 (tourism)", "No visa needed"],
          answer: 1,
          explain: "Regular employment usually requires an E-7 visa, and the company generally applies as the sponsor. Confirm sponsorship availability during hiring."
        },
        {
          question: "When you're stuck on a task, what's the desirable attitude at a Korean workplace?",
          options: ["Report only after solving it entirely alone", "Share progress early and give an interim report", "Skip reporting", "Talk about it only at company dinners"],
          answer: 1,
          explain: "'Interim reporting' isn't reading the room — it's trust. When stuck, it's better to share early rather than suffer alone."
        }
      ]
    },
    "zh-CN": {
      id: "w1s4",
      emoji: "🏢",
      title: "了解韩国企业文化",
      intro:
        "从招聘方式到职级、沟通和劳动制度，全面了解韩国。懂得文化，简历和面试的准备方向就会清晰，入职后适应也会顺畅得多。慢慢阅读，最后用测验检验自己。",
      objectives: [
        "能够说明韩国的招聘方式（公开招聘·随时招聘）及选拔各阶段",
        "能够区分不同企业类型的特点，判断哪里适合自己",
        "理解职级、称呼、敬语等基本职场礼仪",
        "了解作为外国人需要准备的事项（签证、韩语、自身优势）"
      ],
      sections: [
        {
          heading: "1. 招聘是这样进行的",
          emoji: "🧭",
          summary: "先把握韩国求职的整体轮廓。知道何时、以哪些阶段招人，准备的顺序就会显现出来。",
          items: [
            { title: "公开招聘与随时招聘", body: "大企业在春秋两季有定期公开招聘（公채），初创企业、外资企业、中坚企业则多为需要时才招的随时招聘。公开招聘时间固定，因此提前准备好自我介绍书和职业适性测试很重要；随时招聘则要在公告一出就迅速应聘才能抓住机会。了解目标企业属于哪一类，便于配合应聘时机和准备方式。", tip: "现在就搜索确认你的三家目标企业采用的是公开招聘还是随时招聘。", example: "例）三星、现代汽车、SK等大企业通常在上半年（3~4月）、下半年（9~10月）进行公开招聘，Toss、当根等初创企业则在Saramin、Wanted上随时发布公告。" },
            { title: "选拔阶段", body: "通常按 材料（简历·自我介绍书）→ 职业适性·编程测试 → 实务面试 → 高管面试 的顺序进行。每个阶段看重的重点不同，材料是看‘值得见这个人的理由’，面试是确认‘是否是想一起共事的人’。不要通过一个阶段后才开始准备下一个，应聘前先在脑中勾勒整体流程，心里会踏实得多。", example: "例）材料合格 → 在线职业适性/编程测试 → 一次实务面试（岗位提问）→ 二次高管面试（人品·价值观）→ 最终录用通知，通常需要4~8周。" },
            { title: "自我介绍书的分量", body: "韩国尤其重视自我介绍书（自기소개서）。关键是把应聘动机、成长历程、岗位能力以‘故事’来呈现，而非简单罗列，因此要写出具体的经历以及当时的思考与结果才有说服力。外国申请者若能真诚地写出‘为何在韩国、为何在这家公司工作’，尤其能成为优势。", tip: "本项目第3周你将亲手完成自我介绍书，现在只要记住‘为何重要’即可。" },
            { title: "实习·产学·就业衔接型", body: "通过实习或产学合作先积累经验、再转为正式员工的路径也很多。对经验不足的应届生来说，这是能边学实务边确认与公司是否契合的好入口。尤其对留学生而言，实习经历能证明你已适应韩国组织文化，在申请正式岗位时大有帮助。", tip: "优先留意‘就业衔接型实习’公告。它以转正为前提招人，合格后就业的概率较高。" }
          ]
        },
        {
          heading: "2. 每种企业类型各有特色",
          emoji: "🏢",
          summary: "即便同是‘就业’，文化与准备方法也因公司种类而异。请一边想象适合自己性格的地方一边阅读。",
          items: [
            { title: "大企业", body: "系统化的培训、稳定的雇佣、扎实的福利是其优势，适合应届生打牢基本功。但公开招聘竞争激烈、流程漫长，还要准备职业适性测试，因此若决定应聘，最好提前数月制定计划。组织庞大，所担任的角色也高度细分，这点也要事先了解。", example: "例）三星电子、LG、现代汽车、SK海力士等。三星考GSAT，其他公司也多有自家的职业适性测试。" },
            { title: "中坚企业", body: "介于大企业与初创企业之间，在具备一定稳定性的同时，也便于广泛积累实务经验。流程不像大企业那么复杂，随时招聘较多，一人可负责多项工作，成长速度往往较快。知名度不高的隐形冠军中也有很多好公司，请连同公司的从业年限和业务内容一起了解。" },
            { title: "初创企业", body: "快速成长、多样的角色体验、扁平的沟通文化是其魅力。决策迅速、创意可立即付诸实践，适合想主动工作的人。但变化频繁，雇佣与福利也有不确定性，因此应聘前最好一并确认公司的融资阶段或稳定性。", tip: "应聘前通过新闻或领英确认某初创企业的融资消息或招聘规模，可大致判断其稳定性。" },
            { title: "外资企业", body: "英语使用多、以成果和个人为中心，因此更看重实力和结果而非等级。适合发挥留学生的语言能力和全球视野，且与多国同事共事，文化适应负担相对较小。不过有些公司招聘规模小、以有经验者为主，需确认是否招应届生。", tip: "外资和全球团队对留学生尤为有利，务必列入应聘清单。", example: "例）谷歌、微软、欧莱雅、宝洁等。在领英上以‘Korea’搜索，便于找到韩国办公室的公告。" },
            { title: "国企·公共机构", body: "雇佣稳定，且盲选招聘较多，因此比起学历、年龄、出身，更看重岗位契合度和笔试（NCS）。得益于公正的流程，即便条件不算亮眼，也能取得与努力相称的结果。但外国人有时在报名资格中会有国籍、签证要求，因此务必先确认公告的报名资格。" }
          ]
        },
        {
          heading: "3. 职级、称呼与等级文化",
          emoji: "🎓",
          summary: "这是韩国职场礼仪的基础。一个小小的称呼就能左右第一印象。",
          items: [
            { title: "职级体系", body: "传统上按 职员 → 代理 → 科长 → 次长 → 部长 → 高管 的顺序晋升。知道职级，就能在会议或邮件中把握该向谁、以何种方式说话。如今为营造扁平文化，越来越多公司将称呼统一为‘님（nim）’‘pro’‘manager’，入职后先问清该公司的方式再照做即可。" },
            { title: "称呼礼仪", body: "不直呼姓名，而用‘○○님’或职级（组长、科长）称呼是基本。这是尊重对方的第一份礼节，一个称呼就能给人‘懂礼貌的人’的印象。不知道对方职级时，与其勉强猜测，用‘○○님’最为稳妥。", tip: "不知道对方职级时，先用‘○○님’最稳妥。", example: "例）对金敏秀组长，比起‘敏秀님’，称‘组长님’更自然；对同职级同事李智恩，称‘智恩님’就很自然。" },
            { title: "年龄·工龄·序列", body: "尊重年龄和入职工龄的氛围仍有留存。礼貌谦逊的态度在任何组织都会留下好印象，尤其展现出先向前辈学习的姿态，关系会顺畅得多。不过不必过分拘谨，自然的尊重就足够了。" },
            { title: "敬语是基本", body: "在公司里，无论对方年龄或熟识程度，基本都使用敬语。敬语不是疏远，而是彼此公事公办的礼节，因此即使熟络之后，在会议或工作场合保持敬语也很自然。即便不完美，人们也会欣赏你使用敬语的态度本身，无需有负担。", example: "例）‘做这个’（X）→‘这部分麻烦确认一下’（O）；‘知道了’（X）→‘好的，我明白了’（O），这样替换即可。" }
          ]
        },
        {
          heading: "4. 工作方式与氛围",
          emoji: "🤝",
          summary: "预先了解公司里工作实际是如何运转的，入职后就不会手忙脚乱。",
          items: [
            { title: "以团队为中心", body: "与个人能力同样，团队业绩和协作也很受重视。比起独自出色，更青睐能与同事默契配合、共享信息的人，因此在做好本分的同时兼顾整个团队目标的态度很重要。面试也常问协作经历，事先整理好相关事例为好。" },
            { title: "汇报与决策", body: "韩国组织尤其重视‘汇报’。经常与上司共享进展才能积累信任，重大决定往往不在负责人层面结束，而要经上级批准。起初可能觉得繁琐，但越常共享，越能减少失误、更快获得帮助。", tip: "‘中间汇报’不是察言观色，而是信任。遇到瓶颈别独自硬扛，尽早共享。" },
            { title: "会议文化", body: "会议与其说是交谈的场合，不如说是敲定结论和各自角色的场合。以前冗长而形式化的会议较多，如今正转向简短高效，事先掌握议题、准备好所需资料会给人好印象。不明白的地方在会议中礼貌提问也无妨。" },
            { title: "眼力见与氛围", body: "存在一种不必事事言明、也能体察情境与对方情绪的‘눈치（眼力见）’文化。起初或许觉得难，但其实这是体贴共事之人的感觉，观察久了自然就会。拿不准时别独自误会，用‘这样做可以吗？’礼貌确认即可。" },
            { title: "工作生活平衡的变化", body: "以加班、聚餐为中心的旧文化正在迅速减少，法定每周52小时制、弹性工作、居家办公正在落地。各公司氛围不同，若你重视工作生活平衡，应聘前最好通过招聘公告或JobPlanet等评价了解实际的工作文化。尊重个人时间的公司越来越多，无需太担心。" }
          ]
        },
        {
          heading: "5. 关系与沟通文化",
          emoji: "🍽️",
          summary: "与同事相处之道。强制性的文化已减少，可以轻松接受。",
          items: [
            { title: "聚餐文化", body: "聚餐（회식）是团队成员增进情谊的场合，但与过去不同，强行劝酒的氛围已大为减少，参与也趋于自主。若觉得有负担，礼貌地节制或早些离席，如今也很自然。不过起初几次参加、与同事轻松相处，有助于打开关系。", example: "例）若不能喝酒，开朗地说‘我不太会喝酒，就以饮料代替吧。多聊聊天！’便能自然过关。" },
            { title: "午餐文化", body: "韩国职场常有与同事一起吃午餐、自然拉近关系的情况。并非每次都有义务同行，但偶尔一起用餐，可聊些工作之外的话题、化解生疏。若有想吃的菜或不能吃的食物，尽管随意说明即可。" },
            { title: "红白喜事的照应", body: "有一起照应同事结婚、丧事等大事的文化（份子钱·奠仪）。金额或方式可能陌生，但并无固定规则，不清楚时可问相熟的同事‘一般给多少？’。把它理解为一种表达心意的文化会更轻松。", tip: "份子钱·奠仪通常以3万、5万、10万韩元为单位。因亲密程度而异，可问同事。" },
            { title: "公私分明", body: "私下再怎么要好，工作上守住礼节与责任才被视为专业。以交情为由敷衍工作，或把私人情绪带入工作，容易失去信任，因此不论亲疏，把分内之事切实做好的态度很重要。能守好这一平衡的人才会长久受信任。" }
          ]
        },
        {
          heading: "6. 劳动条件与制度",
          emoji: "📋",
          summary: "与你的权利相关的重要内容。若是外国人，尤其要牢记签证部分。",
          items: [
            { title: "劳动合同·四大保险", body: "入职时务必确认写明工作时间、薪资、工作内容的劳动合同，签字后留存一份。国民年金、健康保险、雇佣保险、工伤保险（四大保险）是正式劳动者默认适用的制度，虽会从薪资中扣除一部分，但它是保护你的安全装置。合同内容若不理解，务必询问确认。", tip: "若有人提出不签劳动合同就上工，需谨慎。书面合同是保护你的基本。" },
            { title: "年薪结构", body: "年薪通常由基本薪 + 绩效薪（奖金）+ 福利构成，说‘年薪3600万韩元’时大多指税前一年总额。实际每月到手会扣除税金和四大保险而略有减少，所以别以为把所提年薪除以12就原样进账。奖金是否包含也务必确认。", example: "例）年薪3600万韩元即每月300万韩元（税前），但扣除税金和四大保险后，实发大约每月270万韩元上下。" },
            { title: "年假·休假", body: "工作满一定期限，法律上就会产生带薪年假，满一年后通常从每年15天起。年假是劳动者理所当然的权利，越来越多公司鼓励不必看脸色、按制度使用。提前共享日程再休假，既不给团队添麻烦，自己也能安心休息。" },
            { title: "外国人就业签证", body: "以留学（D-2）签证难以正式就业，要做正式员工通常须转为E-7（特定活动）签证。该签证是由公司作为担保方共同申请的结构，因此公司是否有招聘外国人、支持签证的经验很重要。所以在招聘、面试阶段必须确认能否支持签证。", tip: "面试·招聘过程中，务必确认‘是否可担保E-7签证’，非常重要。", example: "例）面试结尾时可礼貌地问‘请问这个岗位在招聘外国人时是否可担保E-7签证呢？’" }
          ]
        },
        {
          heading: "7. 作为外国人这样准备",
          emoji: "🌏",
          summary: "最后，整理身为留学生的你独有的武器与准备方法。",
          items: [
            { title: "你独有的优势", body: "多语言能力、全球视野、对多种文化的理解，是韩国申请者没有的巨大武器。在开拓海外市场或对接外国客户、合作伙伴的岗位上尤为闪光，因此请在自我介绍书和面试中以具体事例展示这些优势。将其与‘正因为是我才能帮到这家公司的理由’相连接，说服力更强。", example: "例）把优势与岗位相连，如‘若是准备进军越南市场的团队，懂越南语、了解当地文化的我，能为客户沟通做出贡献’。" },
            { title: "韩语准备", body: "工作中使用的韩语实力和TOPIK分数，是在材料上带来信任的坚实资产。即便发音或语法不完美，公司更看重你想学习的诚恳态度和努力沟通的姿态。从现在起熟悉邮件、会议中常用的表达，入职后的适应会顺畅得多。", tip: "TOPIK通常4级以上会被认为达到可进行工作沟通的水平。定个目标分数，持续准备。" },
            { title: "文化适应技巧", body: "无需因文化不同而拘谨，观察、提问，一点点学会即可。不懂并不丢人，反而会被视为想学习的态度，因此礼貌询问的习惯反而能留下好印象。诚恳与尊重他人的心，随时间流逝会筑起坚实的信任。" },
            { title: "避免常见误解", body: "在韩国职场，沉默未必表示同意，也常有像‘我会研究一下’这样委婉的拒绝。若把对方的话只按字面理解，可能产生误会，因此拿不准时，养成‘我这样理解，对吗？’礼貌再确认的习惯为好。这种再确认会被视为细致，而非无礼。" }
          ]
        }
      ],
      quiz: [
        {
          question: "以下哪项最接近大企业一般的招聘方式？",
          options: ["需要时随时招聘", "春秋进行的定期公开招聘", "仅凭熟人推荐招聘", "几乎不招聘"],
          answer: 1,
          explain: "大企业多有春秋定期公开招聘，而初创企业、外资企业、中坚企业则多为随时招聘。"
        },
        {
          question: "在韩国职场称呼同事时，最稳妥的称呼是？",
          options: ["只叫名字", "用‘○○님’或职级称呼", "叫外号", "只叫姓"],
          answer: 1,
          explain: "比起只叫名字，用‘○○님’或职级（组长等）称呼是基本礼仪。"
        },
        {
          question: "外国人在韩国做正式员工通常需要的就业签证是？",
          options: ["D-2（留学）", "E-7（特定活动）", "B-2（观光）", "不需要签证"],
          answer: 1,
          explain: "正式就业通常需要E-7签证，一般由公司作为担保方申请。请在招聘阶段确认是否支持。"
        },
        {
          question: "工作遇到瓶颈时，在韩国职场应有的态度是？",
          options: ["独自解决完再汇报", "尽早共享进展并做中间汇报", "不汇报直接跳过", "只在聚餐时说"],
          answer: 1,
          explain: "‘中间汇报’不是察言观色，而是信任。遇到瓶颈别独自硬扛，尽早共享为好。"
        }
      ]
    },
    vi: {
      id: "w1s4",
      emoji: "🏢",
      title: "Hiểu về văn hóa doanh nghiệp Hàn Quốc",
      intro:
        "Tìm hiểu rộng về Hàn Quốc — từ cách tuyển dụng đến chức vụ, giao tiếp và chế độ lao động. Hiểu văn hóa giúp bạn định hướng đúng cho hồ sơ và phỏng vấn, đồng thời việc thích nghi sau khi vào làm cũng dễ dàng hơn nhiều. Hãy đọc chậm rãi và tự kiểm tra bằng bài quiz ở cuối.",
      objectives: [
        "Giải thích được cách tuyển dụng của Hàn Quốc (tuyển tập trung · tuyển linh hoạt) và các vòng tuyển chọn",
        "Phân biệt được đặc điểm từng loại hình doanh nghiệp và đánh giá nơi phù hợp với mình",
        "Hiểu các phép tắc công sở cơ bản như chức vụ, cách xưng hô, kính ngữ",
        "Biết những gì cần chuẩn bị với tư cách người nước ngoài (visa, tiếng Hàn, thế mạnh của mình)"
      ],
      sections: [
        {
          heading: "1. Việc tuyển dụng diễn ra như thế này",
          emoji: "🧭",
          summary: "Hãy nắm bức tranh tổng thể của việc tìm việc ở Hàn trước. Khi biết họ tuyển khi nào, qua những vòng nào, trình tự chuẩn bị sẽ hiện ra.",
          items: [
            { title: "Tuyển tập trung và tuyển linh hoạt", body: "Các tập đoàn lớn tổ chức tuyển tập trung định kỳ (gongchae) vào mùa xuân và mùa thu, còn startup, công ty nước ngoài, doanh nghiệp tầm trung thì phần lớn tuyển linh hoạt (khi cần). Vì tuyển tập trung có thời điểm cố định nên việc chuẩn bị trước thư giới thiệu bản thân và bài kiểm tra năng lực là quan trọng; còn tuyển linh hoạt thì phải nộp nhanh khi có tin đăng mới nắm được cơ hội. Biết công ty mục tiêu thuộc loại nào giúp bạn căn thời điểm và cách chuẩn bị.", tip: "Hãy tìm kiếm ngay để xác nhận ba công ty mục tiêu của bạn dùng tuyển tập trung hay tuyển linh hoạt.", example: "VD) Các tập đoàn lớn như Samsung, Hyundai Motor, SK thường tuyển tập trung vào nửa đầu năm (tháng 3–4) và nửa cuối năm (tháng 9–10), còn startup như Toss, Karrot thì đăng tin linh hoạt trên Saramin, Wanted." },
            { title: "Các vòng tuyển chọn", body: "Thường diễn ra theo thứ tự: hồ sơ (CV và thư giới thiệu) → kiểm tra năng lực/coding test → phỏng vấn chuyên môn → phỏng vấn ban lãnh đạo. Mỗi vòng nhìn vào một điểm khác nhau — hồ sơ cho thấy 'lý do để gặp người này', còn phỏng vấn xác nhận 'có phải người mình muốn cùng làm việc không'. Đừng đợi qua một vòng rồi mới bắt đầu chuẩn bị vòng sau; phác họa toàn bộ luồng trước khi nộp sẽ giúp bạn nhẹ nhõm hơn nhiều.", example: "VD) Đậu hồ sơ → kiểm tra năng lực/coding online → phỏng vấn chuyên môn vòng 1 (câu hỏi công việc) → phỏng vấn ban lãnh đạo vòng 2 (nhân cách, giá trị) → thông báo trúng tuyển; thường mất 4–8 tuần." },
            { title: "Trọng lượng của thư giới thiệu bản thân", body: "Hàn Quốc đặc biệt coi trọng thư giới thiệu bản thân (jagisogaeseo). Điểm cốt lõi là trình bày động cơ ứng tuyển, quá trình trưởng thành, năng lực công việc như một 'câu chuyện' chứ không phải liệt kê, nên phải viết kèm trải nghiệm cụ thể cùng những trăn trở và kết quả lúc đó mới có sức thuyết phục. Ứng viên người nước ngoài đặc biệt có lợi thế khi truyền tải chân thành 'vì sao ở Hàn, vì sao ở công ty này'.", tip: "Bạn sẽ tự viết thư giới thiệu ở Tuần 3 của chương trình này, nên bây giờ chỉ cần nhớ 'vì sao nó quan trọng'." },
            { title: "Thực tập · liên kết học-nghề · tuyển gắn với chuyển chính thức", body: "Có nhiều con đường tích lũy kinh nghiệm trước qua thực tập hoặc hợp tác học-nghề rồi chuyển sang chính thức. Đây là cửa vào tốt cho tân cử nhân ít kinh nghiệm, vừa học việc vừa để hai bên kiểm tra sự phù hợp. Đặc biệt với du học sinh, kinh nghiệm thực tập là bằng chứng bạn đã thích nghi với văn hóa tổ chức Hàn Quốc, rất hữu ích khi ứng tuyển chính thức.", tip: "Hãy để ý trước các tin 'thực tập gắn chuyển chính thức'. Vì họ tuyển với tiền đề chuyển chính thức nên đậu thì khả năng dẫn tới việc làm cao hơn." }
          ]
        },
        {
          heading: "2. Mỗi loại hình doanh nghiệp có một màu sắc riêng",
          emoji: "🏢",
          summary: "Dù cùng là 'đi làm', văn hóa và cách chuẩn bị vẫn khác nhau theo loại công ty. Hãy đọc và hình dung nơi hợp với tính cách mình.",
          items: [
            { title: "Tập đoàn lớn", body: "Thế mạnh là đào tạo bài bản, việc làm ổn định, phúc lợi vững chắc, rất tốt để tân cử nhân xây nền tảng. Đổi lại, cạnh tranh tuyển tập trung khốc liệt, quy trình dài, lại phải chuẩn bị bài kiểm tra năng lực, nên nếu đã quyết nộp thì hãy lên kế hoạch trước vài tháng. Tổ chức lớn nên vai trò được phân nhỏ, hãy biết trước điều này.", example: "VD) Samsung Electronics, LG, Hyundai Motor, SK Hynix. Samsung thi GSAT, các nơi khác cũng thường có bài kiểm tra năng lực riêng." },
            { title: "Doanh nghiệp tầm trung", body: "Nằm giữa tập đoàn lớn và startup, vừa có mức ổn định nhất định vừa dễ tích lũy kinh nghiệm thực tế rộng. Quy trình không phức tạp như tập đoàn lớn nên tuyển linh hoạt nhiều, một người có thể đảm nhận nhiều việc nên tốc độ trưởng thành thường nhanh. Trong số các 'nhà vô địch ẩn' ít tên tuổi cũng có nhiều nơi tốt, hãy xem cả bề dày và lĩnh vực kinh doanh của công ty." },
            { title: "Startup", body: "Sức hút là tăng trưởng nhanh, trải nghiệm nhiều vai trò, văn hóa giao tiếp ngang bằng. Ra quyết định nhanh, ý tưởng có thể triển khai ngay, hợp với người muốn làm việc chủ động. Đổi lại, thay đổi thường xuyên và việc làm/phúc lợi có bất định, nên trước khi nộp hãy kiểm tra cả giai đoạn gọi vốn hay độ ổn định của công ty.", tip: "Trước khi nộp, kiểm tra tin gọi vốn hay quy mô tuyển của startup qua báo chí, LinkedIn giúp bạn ước lượng độ ổn định." },
            { title: "Công ty nước ngoài", body: "Dùng tiếng Anh nhiều và văn hóa hướng thành quả/cá nhân, nên bạn được đánh giá bằng năng lực và kết quả hơn là thứ bậc. Rất tốt để phát huy khả năng ngôn ngữ và tầm nhìn toàn cầu của du học sinh, và làm việc với đồng nghiệp nhiều quốc tịch nên gánh nặng thích nghi văn hóa cũng nhẹ hơn. Tuy nhiên có nơi tuyển quy mô nhỏ hoặc chủ yếu tuyển người có kinh nghiệm, hãy xác nhận họ có tuyển tân cử nhân không.", tip: "Đội ngũ nước ngoài và toàn cầu đặc biệt có lợi cho du học sinh. Nhất định đưa vào danh sách ứng tuyển.", example: "VD) Google, Microsoft, L'Oréal, P&G. Tìm 'Korea' trên LinkedIn dễ ra tin tuyển của văn phòng tại Hàn." },
            { title: "Doanh nghiệp công · cơ quan công", body: "Việc làm ổn định và tuyển ẩn danh (blind) nhiều, nên coi trọng sự phù hợp công việc và bài thi viết (NCS) hơn học vấn, tuổi tác, xuất thân. Nhờ quy trình công bằng, dù hồ sơ không hào nhoáng bạn vẫn có thể đạt kết quả xứng với công sức. Tuy nhiên người nước ngoài đôi khi vướng yêu cầu quốc tịch/visa trong điều kiện dự tuyển, nên luôn kiểm tra điều kiện dự tuyển của tin đăng trước." }
          ]
        },
        {
          heading: "3. Chức vụ, cách xưng hô và văn hóa thứ bậc",
          emoji: "🎓",
          summary: "Đây là điều cơ bản của phép tắc công sở Hàn Quốc. Một cách xưng hô nhỏ cũng có thể định đoạt ấn tượng ban đầu.",
          items: [
            { title: "Hệ thống chức vụ", body: "Theo truyền thống thăng tiến: nhân viên (sawon) → phó phòng (daeri) → trưởng nhóm/khoa trưởng (gwajang) → phó tổng phụ trách (chajang) → trưởng phòng (bujang) → ban lãnh đạo. Biết chức vụ giúp bạn cảm nhận nên nói với ai, như thế nào trong họp hay email. Gần đây nhiều công ty thống nhất xưng hô thành 'nim', 'pro', 'manager' để văn hóa ngang bằng hơn, nên khi vào làm hãy hỏi trước cách của công ty đó rồi làm theo." },
            { title: "Phép xưng hô", body: "Không gọi trống tên, mà dùng '○○-nim' hoặc chức vụ (trưởng nhóm, khoa trưởng) là điều cơ bản. Đó là phép lịch sự đầu tiên thể hiện sự tôn trọng, và một cách xưng hô cũng đủ tạo ấn tượng 'người biết lễ nghĩa'. Khi không biết chức vụ, thay vì đoán bừa, dùng '○○-nim' là an toàn nhất.", tip: "Nếu không biết chức vụ của đối phương, trước hết dùng '○○-nim' là an toàn nhất.", example: "VD) Với trưởng nhóm Kim Min-su, gọi 'trưởng nhóm' tự nhiên hơn 'Min-su-nim'; với đồng nghiệp cùng chức Lee Ji-eun, gọi 'Ji-eun-nim' là ổn." },
            { title: "Tuổi tác · thâm niên · thứ bậc", body: "Không khí tôn trọng tuổi tác và thâm niên vào làm vẫn còn. Thái độ lịch sự, khiêm tốn luôn tạo ấn tượng tốt ở mọi tổ chức, đặc biệt thể hiện ý muốn học hỏi từ tiền bối trước sẽ khiến quan hệ mềm mại hơn nhiều. Tuy nhiên không cần co rúm quá mức, sự tôn trọng tự nhiên là đủ." },
            { title: "Kính ngữ là mặc định", body: "Ở công ty, bất kể tuổi tác hay mức thân thiết, mặc định dùng kính ngữ. Kính ngữ không phải sự xa cách mà là phép lịch sự đối xử công tư với nhau, nên ngay cả khi đã thân, giữ kính ngữ trong họp hay công việc là tự nhiên. Dù chưa hoàn hảo, người ta vẫn quý chính thái độ cố dùng kính ngữ, nên bạn không cần áp lực.", example: "VD) 'Làm cái này đi' (X) → 'Nhờ anh/chị kiểm tra phần này giúp' (O); 'Biết rồi' (X) → 'Vâng, em hiểu rồi' (O) là cách chuyển đổi." }
          ]
        },
        {
          heading: "4. Cách làm việc và bầu không khí",
          emoji: "🤝",
          summary: "Hãy biết trước công việc thực sự vận hành ra sao ở công ty, để sau khi vào làm không bối rối.",
          items: [
            { title: "Lấy đội nhóm làm trung tâm", body: "Ngang với năng lực cá nhân, thành quả đội nhóm và sự hợp tác cũng được coi trọng. Người phối hợp ăn ý với đồng nghiệp và chia sẻ thông tin được ưu ái hơn người chỉ giỏi một mình, nên thái độ vừa làm phần của mình vừa nghĩ đến mục tiêu chung của cả đội là quan trọng. Phỏng vấn cũng hay hỏi về kinh nghiệm hợp tác, nên chuẩn bị sẵn các ví dụ liên quan là tốt." },
            { title: "Báo cáo và ra quyết định", body: "Tổ chức Hàn Quốc đặc biệt coi trọng 'báo cáo'. Thường xuyên chia sẻ tiến độ với cấp trên mới xây được niềm tin, và quyết định lớn thường không dừng ở cấp người phụ trách mà cần cấp trên phê duyệt. Ban đầu có thể thấy phiền, nhưng càng chia sẻ càng giảm sai sót và nhận trợ giúp nhanh hơn.", tip: "'Báo cáo giữa chừng' không phải nhìn sắc mặt mà là niềm tin. Khi bí, đừng ôm một mình, hãy chia sẻ sớm." },
            { title: "Văn hóa họp", body: "Cuộc họp không hẳn là nơi trò chuyện mà là nơi chốt kết luận và phân vai từng người. Trước đây họp dài và hình thức nhiều, nhưng nay đang chuyển sang ngắn gọn và hiệu quả, nên nắm chương trình trước và chuẩn bị tài liệu cần thiết sẽ tạo ấn tượng tốt. Chỗ nào chưa hiểu, hỏi lịch sự ngay trong họp cũng không sao." },
            { title: "Nunchi và đọc bầu không khí", body: "Có văn hóa 'nunchi' — đọc tình huống và tâm trạng đối phương mà không cần nói hết mọi thứ. Ban đầu có thể thấy khó, nhưng thực ra đó là sự tinh tế quan tâm người cùng làm, quan sát dần sẽ tự quen. Khi phân vân, đừng tự hiểu lầm, hãy xác nhận lịch sự bằng 'Làm thế này được không ạ?'" },
            { title: "Sự thay đổi về cân bằng công việc-cuộc sống", body: "Văn hóa cũ lấy tăng ca, tiệc công ty làm trung tâm đang giảm nhanh, chế độ 52 giờ/tuần theo luật, làm việc linh hoạt, làm từ xa đang định hình. Không khí khác nhau theo công ty, nên nếu coi trọng cân bằng công việc-cuộc sống, trước khi nộp hãy tìm hiểu văn hóa làm việc thực tế qua tin đăng hoặc review như JobPlanet. Ngày càng nhiều công ty tôn trọng thời gian cá nhân, nên đừng lo quá." }
          ]
        },
        {
          heading: "5. Văn hóa quan hệ và giao tiếp",
          emoji: "🍽️",
          summary: "Cách hòa hợp với đồng nghiệp. Văn hóa ép buộc đã giảm, nên hãy tiếp nhận thoải mái.",
          items: [
            { title: "Văn hóa tiệc công ty", body: "Tiệc công ty (hoesik) là dịp gắn kết tình cảm giữa các thành viên, nhưng khác trước, không khí ép rượu đã giảm nhiều và việc tham gia cũng tự nguyện hơn. Nếu thấy áp lực, lịch sự tiết chế hoặc về sớm giờ đây cũng là tự nhiên. Tuy vậy, tham dự vài lần đầu và hòa nhập thoải mái giúp mở lối quan hệ với đồng nghiệp.", example: "VD) Nếu không uống được rượu, vui vẻ nói 'Em không uống được nên xin dùng nước ngọt. Bù lại mình trò chuyện nhiều nhé!' là qua được nhẹ nhàng." },
            { title: "Văn hóa ăn trưa", body: "Ở công sở Hàn, nhiều khi ăn trưa cùng đồng đội và tự nhiên thân thiết hơn. Không bắt buộc lần nào cũng đi cùng, nhưng thỉnh thoảng ăn chung giúp trò chuyện ngoài công việc và xua tan ngại ngùng. Nếu có món muốn ăn hay món không ăn được, cứ thoải mái nói ra." },
            { title: "Chăm lo việc hiếu hỉ", body: "Có văn hóa cùng chăm lo việc lớn của đồng nghiệp như cưới, tang (tiền mừng · tiền phúng). Số tiền hay cách thức có thể lạ lẫm, nhưng không có quy tắc cố định, nên khi không rõ hãy hỏi đồng nghiệp thân 'thường mọi người đưa khoảng bao nhiêu?'. Hiểu đó là văn hóa bày tỏ tấm lòng sẽ nhẹ nhàng hơn.", tip: "Tiền mừng · tiền phúng thường theo đơn vị 30.000, 50.000, 100.000 won. Tùy độ thân, hãy hỏi đồng nghiệp." },
            { title: "Phân biệt công tư", body: "Dù riêng tư thân đến đâu, giữ lễ nghĩa và trách nhiệm trong công việc mới được coi là chuyên nghiệp. Lấy tình thân làm cớ làm việc qua loa, hay kéo cảm xúc cá nhân vào công việc dễ mất niềm tin, nên thái độ dù thân vẫn hoàn thành chắc chắn việc được giao là quan trọng. Người giữ tốt cân bằng này sẽ được tin cậy lâu dài." }
          ]
        },
        {
          heading: "6. Điều kiện lao động và chế độ",
          emoji: "📋",
          summary: "Nội dung quan trọng liên quan quyền lợi của bạn. Là người nước ngoài, đặc biệt nhớ kỹ phần visa.",
          items: [
            { title: "Hợp đồng lao động · 4 loại bảo hiểm chính", body: "Khi vào làm, nhất định kiểm tra hợp đồng lao động ghi giờ làm, lương, nội dung công việc, ký xong nhận một bản. Bốn bảo hiểm chính (hưu trí quốc gia, bảo hiểm y tế, bảo hiểm việc làm, bảo hiểm tai nạn lao động) mặc định áp dụng cho lao động chính thức — bị trừ một phần từ lương, nhưng là lớp bảo vệ cho bạn. Nếu điều khoản hợp đồng chưa hiểu, nhất định hỏi và xác nhận.", tip: "Hãy thận trọng nếu ai đó rủ làm mà không có hợp đồng lao động. Hợp đồng bằng văn bản là sự bảo vệ cơ bản cho bạn." },
            { title: "Cấu trúc lương năm", body: "Lương năm thường gồm lương cơ bản + lương thành quả (thưởng) + phúc lợi, và khi nói 'lương năm 36 triệu won' thường là tổng cả năm trước thuế. Thực nhận mỗi tháng đã trừ thuế và bốn bảo hiểm nên giảm chút, đừng nghĩ lấy lương đề nghị chia 12 là số vào tài khoản. Nhớ xác nhận có tính cả thưởng hay không.", example: "VD) Lương năm 36 triệu won là 3 triệu won/tháng (trước thuế), nhưng sau khi trừ thuế và bốn bảo hiểm, thực nhận khoảng 2,7 triệu won/tháng." },
            { title: "Phép năm · nghỉ phép", body: "Làm việc đủ một thời gian, theo luật bạn được nghỉ phép năm có lương, và sau một năm thường bắt đầu từ 15 ngày/năm. Phép năm là quyền đương nhiên của người lao động, ngày càng nhiều công ty khuyến khích dùng đúng chế độ, không phải nhìn sắc mặt. Chia sẻ lịch trước rồi nghỉ vừa không phiền đội, vừa để bạn nghỉ ngơi thoải mái." },
            { title: "Visa làm việc cho người nước ngoài", body: "Với visa du học (D-2) khó đi làm chính thức; muốn làm chính thức thường phải đổi sang visa E-7 (hoạt động đặc định). Visa này có cấu trúc công ty làm bên bảo lãnh và cùng nộp, nên việc công ty có kinh nghiệm tuyển người nước ngoài và hỗ trợ visa hay không rất quan trọng. Vì thế phải xác nhận khả năng hỗ trợ visa ở bước tuyển dụng, phỏng vấn.", tip: "Trong quá trình phỏng vấn · tuyển dụng, nhất định xác nhận 'có bảo lãnh visa E-7 được không'. Rất quan trọng.", example: "VD) Cuối buổi phỏng vấn, có thể lịch sự hỏi 'Cho em hỏi vị trí này khi tuyển người nước ngoài có bảo lãnh visa E-7 được không ạ?'" }
          ]
        },
        {
          heading: "7. Chuẩn bị thế này với tư cách người nước ngoài",
          emoji: "🌏",
          summary: "Cuối cùng, hãy tổng hợp vũ khí và cách chuẩn bị riêng của bạn — một du học sinh.",
          items: [
            { title: "Thế mạnh riêng của bạn", body: "Khả năng đa ngôn ngữ, tầm nhìn toàn cầu, hiểu biết nhiều nền văn hóa là vũ khí lớn mà ứng viên Hàn không có. Chúng đặc biệt tỏa sáng ở công việc mở rộng thị trường nước ngoài hoặc tiếp khách hàng, đối tác nước ngoài, nên hãy thể hiện các thế mạnh này bằng ví dụ cụ thể trong thư giới thiệu và phỏng vấn. Kết nối với 'lý do chính vì là tôi nên có ích cho công ty' sẽ tăng sức thuyết phục.", example: "VD) Kết nối thế mạnh với công việc, như 'Nếu là đội đang chuẩn bị tiến vào thị trường Việt Nam, em — người hiểu tiếng Việt và văn hóa bản địa — có thể đóng góp vào giao tiếp với khách hàng'." },
            { title: "Chuẩn bị tiếng Hàn", body: "Trình độ tiếng Hàn dùng trong công việc và điểm TOPIK là tài sản vững chắc tạo niềm tin trên hồ sơ. Dù phát âm hay ngữ pháp chưa hoàn hảo, công ty vẫn quý thái độ chăm chỉ muốn học và nỗ lực giao tiếp hơn. Từ bây giờ làm quen các cách diễn đạt hay dùng trong email, họp thì sau khi vào làm sẽ thích nghi dễ hơn nhiều.", tip: "TOPIK cấp 4 trở lên thường được công nhận là đủ để giao tiếp công việc. Hãy đặt điểm mục tiêu và ôn luyện đều đặn." },
            { title: "Mẹo thích nghi văn hóa", body: "Không cần co rúm vì văn hóa khác, chỉ cần quan sát, hỏi và học từng chút một. Không biết không phải điều xấu hổ mà được nhìn như thái độ muốn học, nên thói quen hỏi lịch sự lại tạo ấn tượng tốt. Sự chân thành và lòng tôn trọng người khác theo thời gian sẽ dựng nên niềm tin vững chắc." },
            { title: "Tránh những hiểu lầm thường gặp", body: "Ở công sở Hàn, im lặng không phải lúc nào cũng là đồng ý, và người ta thường từ chối uyển chuyển như 'Để tôi xem xét'. Hiểu lời người khác quá sát nghĩa dễ gây hiểu lầm, nên khi phân vân, thói quen xác nhận lại lịch sự — 'Em hiểu thế này, đúng không ạ?' — là tốt. Việc xác nhận lại này được coi là cẩn thận, không phải bất lịch sự." }
          ]
        }
      ],
      quiz: [
        {
          question: "Đâu là điều gần nhất với cách tuyển dụng phổ biến của các tập đoàn lớn?",
          options: ["Tuyển linh hoạt bất cứ khi nào cần", "Tuyển tập trung định kỳ vào mùa xuân và mùa thu", "Chỉ tuyển qua giới thiệu người quen", "Hầu như không tuyển"],
          answer: 1,
          explain: "Tập đoàn lớn thường tuyển tập trung định kỳ vào mùa xuân, mùa thu; còn startup, công ty nước ngoài, doanh nghiệp tầm trung thì tuyển linh hoạt nhiều."
        },
        {
          question: "Cách xưng hô an toàn nhất với đồng nghiệp ở công sở Hàn Quốc là gì?",
          options: ["Chỉ gọi trống tên", "Dùng '○○-nim' hoặc chức vụ", "Gọi biệt danh", "Chỉ gọi họ"],
          answer: 1,
          explain: "Thay vì gọi trống tên, dùng '○○-nim' hoặc chức vụ (trưởng nhóm...) là phép tắc cơ bản."
        },
        {
          question: "Người nước ngoài thường cần visa làm việc nào để làm chính thức tại Hàn Quốc?",
          options: ["D-2 (du học)", "E-7 (hoạt động đặc định)", "B-2 (du lịch)", "Không cần visa"],
          answer: 1,
          explain: "Việc làm chính thức thường cần visa E-7, và công ty thường đứng ra bảo lãnh nộp hồ sơ. Hãy xác nhận khả năng hỗ trợ ở bước tuyển dụng."
        },
        {
          question: "Khi bị bí trong công việc, thái độ nên có ở công sở Hàn Quốc là gì?",
          options: ["Chỉ báo cáo sau khi tự giải quyết hoàn toàn", "Chia sẻ tiến độ sớm và báo cáo giữa chừng", "Bỏ qua không báo cáo", "Chỉ nói trong tiệc công ty"],
          answer: 1,
          explain: "'Báo cáo giữa chừng' không phải nhìn sắc mặt mà là niềm tin. Khi bí, chia sẻ sớm tốt hơn là ôm một mình."
        }
      ]
    },
    ja: {
      id: "w1s4",
      emoji: "🏢",
      title: "韓国の企業文化を理解する",
      intro:
        "採用方法から役職・コミュニケーション・労働制度まで、韓国について幅広く学びます。文化を知れば、履歴書・面接の準備の方向が定まり、入社後の適応もずっとスムーズになります。ゆっくり読み、最後のクイズで確認しましょう。",
      objectives: [
        "韓国の採用方法（定期採用・随時採用）と選考段階を説明できる",
        "企業タイプごとの特徴を見分け、自分に合う場所を判断できる",
        "役職・呼称・敬語など基本的な職場マナーを理解する",
        "外国人として準備すべきこと（ビザ・韓国語・強み）を知る"
      ],
      sections: [
        {
          heading: "1. 採用はこう進みます",
          emoji: "🧭",
          summary: "まず韓国就職の全体像をつかみましょう。いつ、どんな段階で採用するか分かれば、準備の順序が見えてきます。",
          items: [
            { title: "定期採用と随時採用", body: "大企業は春・秋に定期採用（公採）を行い、スタートアップ・外資系・中堅企業は必要なときに採る随時採用が多いです。定期採用は時期が決まっているので自己紹介書と適性検査を前もって準備することが大切で、随時採用は募集が出たら素早く応募してこそチャンスをつかめます。志望企業がどちらか分かれば、応募時期と準備の仕方を合わせやすくなります。", tip: "今すぐ、志望企業3社の採用方式（定期／随時）を検索して確認してみましょう。", example: "例）サムスン・現代自動車・SKなど大企業は通常、上半期（3〜4月）・下半期（9〜10月）に定期採用を、Toss・当根などのスタートアップはSaramin・Wantedに随時募集を出します。" },
            { title: "選考段階", body: "通常、書類（履歴書・自己紹介書）→ 適性・コーディングテスト → 実務面接 → 役員面接 の順で進みます。段階ごとに見るポイントが違い、書類は『この人に会う理由』を、面接は『一緒に働きたい人か』を確認する場です。各段階を通過してから次の準備を始めるのではなく、応募前に全体の流れを描いておくと気持ちがずっと楽になります。", example: "例）書類合格 → オンライン適性/コーディングテスト → 一次実務面接（職務質問）→ 二次役員面接（人柄・価値観）→ 最終合格通知の順で、通常4〜8週間かかります。" },
            { title: "自己紹介書の比重", body: "韓国は自己紹介書（自己紹介書）を特に重視します。志望動機・成長過程・職務能力を単なる羅列ではなく『ストーリー』として描くのがカギで、具体的な経験と当時の悩み・結果を一緒に書いてこそ説得力が生まれます。特に外国人応募者は『なぜ韓国で、なぜこの会社で働きたいのか』を誠実に込めると強みになります。", tip: "このプログラムの3週目で自己紹介書を実際に完成させるので、今は『なぜ重要か』だけ覚えておけば十分です。" },
            { title: "インターン・産学・採用連携型", body: "インターンや産学連携でまず経験を積み、正社員に転換する道も多くあります。経験の少ない新卒に、実務を学びながら会社と互いの相性を確認できる良い入り口です。特に留学生はインターン経験が韓国の組織文化に適応した証となり、正社員応募時に大いに役立ちます。", tip: "『採用連携型インターン』の募集をまず注目しましょう。正社員転換を前提に採るので、合格すれば就職につながる確率が高いです。" }
          ]
        },
        {
          heading: "2. 企業タイプごとに色があります",
          emoji: "🏢",
          summary: "同じ『就職』でも会社の種類によって文化や準備法が違います。自分の性格に合う場所を思い浮かべながら読みましょう。",
          items: [
            { title: "大企業", body: "体系的な教育・安定した雇用・手厚い福利が強みで、新卒が基礎を固めるのに向いています。反面、定期採用の競争は激しく、選考も長く、適性検査も準備が必要なので、応募を決めたら数か月前から計画を立てるとよいです。組織が大きい分、担う役割が細分化されている点も前もって知っておきましょう。", example: "例）サムスン電子・LG・現代自動車・SKハイニックスなど。サムスンはGSAT、他社も独自の適性検査を課す場合が多いです。" },
            { title: "中堅企業", body: "大企業とスタートアップの中間で、ある程度の安定性を備えつつ実務を幅広く経験しやすいです。大企業ほど手続きが複雑でなく随時採用も多く、一人で複数の業務を担う機会があり成長が速い傾向です。名の知られていない優良企業にも良い会社が多いので、会社の社歴と事業内容も併せて見ましょう。" },
            { title: "スタートアップ", body: "速い成長、多様な役割経験、フラットなコミュニケーション文化が魅力です。意思決定が速く、アイデアをすぐ実行できるので、主体的に働きたい人に向いています。反面、変化が多く雇用・福利の不確実性もあるので、応募前に会社の資金調達段階や安定性も確認するとよいです。", tip: "応募前にそのスタートアップの資金調達ニュースや採用規模をニュース・LinkedInで確認すると、安定性を測れます。" },
            { title: "外資系企業", body: "英語使用が多く成果・個人中心の文化で、序列より実力と結果で評価される傾向です。留学生の語学力とグローバル感覚を活かしやすく、多国籍の同僚と働く環境なので文化適応の負担も比較的少ないです。ただし採用規模が小さく経験者中心の所もあるので、新卒採用の有無を確認しましょう。", tip: "外資系・グローバルチームは留学生に特に有利です。応募リストに必ず入れましょう。", example: "例）グーグル・マイクロソフト・ロレアル・P&Gなど。LinkedInで『Korea』と検索すると韓国オフィスの募集を見つけやすいです。" },
            { title: "公企業・公共機関", body: "雇用が安定し、ブラインド採用が多く、学歴・年齢・出身より職務適合性と筆記試験（NCS）を重視します。公正な手続きのおかげで、スペックが派手でなくても準備した分だけ結果を得やすいです。ただし外国人は応募資格に国籍・ビザ要件がある場合があるので、必ず募集の応募資格を先に確認しましょう。" }
          ]
        },
        {
          heading: "3. 役職と呼称、序列文化",
          emoji: "🎓",
          summary: "韓国の職場マナーの基本です。小さな呼称ひとつが第一印象を左右します。",
          items: [
            { title: "役職体系", body: "伝統的に 社員 → 代理 → 課長 → 次長 → 部長 → 役員 の順で上がります。役職が分かれば、会議やメールで誰にどう話すか感覚がつかめます。最近はフラットな文化のため呼称を『〜님（ニム）』『プロ』『マネージャー』に統一する会社も増えているので、入社したらその会社のやり方をまず尋ねて従えば大丈夫です。" },
            { title: "呼称マナー", body: "名前だけで呼ばず『○○님』または役職（チーム長、課長）で呼ぶのが基本です。相手を尊重する最初のマナーで、呼称ひとつで『礼儀を知る人』という印象を与えられます。相手の役職が分からないときは無理に推測せず『○○님』を使うのが最も安全です。", tip: "相手の役職が分からなければ、まず『○○님』が最も安全です。", example: "例）キム・ミンス チーム長には『ミンス님』より『チーム長님』が自然、同じ役職の同僚イ・ジウンには『ジウン님』と呼ぶとよいです。" },
            { title: "年齢・年次・序列", body: "年齢や入社年次を尊重する雰囲気がまだ残っています。礼儀正しく謙虚な態度はどの組織でも好印象を与え、特に先輩からまず学ぼうとする姿勢を見せると関係がずっと円滑になります。ただし過度に萎縮する必要はなく、自然な尊重で十分です。" },
            { title: "敬語が基本", body: "会社では相手の年齢や親しさに関係なく、基本的に敬語を使います。敬語は距離ではなく、互いを公的に扱う礼儀なので、親しくなった後も会議や業務の場では保つのが自然です。完璧でなくても敬語を使おうとする態度自体を良く受け取ってくれるので、気負う必要はありません。", example: "例）『これやって』（×）→『この部分の確認をお願いします』（○）、『分かった』（×）→『はい、承知しました』（○）のように言い換えればOKです。" }
          ]
        },
        {
          heading: "4. 働き方と雰囲気",
          emoji: "🤝",
          summary: "実際に会社で仕事がどう回るか前もって知っておきましょう。入社後に慌てないために。",
          items: [
            { title: "チーム中心", body: "個人の能力と同じくらいチームの成果と協働を重視します。一人で優れているより、同僚とうまく合わせて働き情報を共有する人が好まれるので、自分の役割を果たしつつチーム全体の目標を考える態度が大切です。面接でも協働経験を聞かれることが多いので、関連する事例を事前に整理しておくとよいです。" },
            { title: "報告と意思決定", body: "韓国の組織は『報告』を特に重んじます。進捗を上司に頻繁に共有してこそ信頼が積み上がり、大きな決定は担当者レベルで終えず上層の承認を経る傾向があります。最初は煩わしく感じるかもしれませんが、頻繁に共有するほどミスを減らし、早く助けを得られます。", tip: "『中間報告』は空気を読むことではなく信頼です。行き詰まったら一人で抱え込まず、早めに共有しましょう。" },
            { title: "会議文化", body: "会議は雑談の場というより、結論とそれぞれの役割を決める場です。以前は長く形式的な会議が多かったですが、最近は短く効率的な会議へ変わりつつあり、事前に議題を把握し必要な資料を準備していくと好印象です。分からない部分は会議中に丁寧に質問しても構いません。" },
            { title: "ヌンチと空気", body: "言葉で全て表さなくても状況や相手の気持ちを察する『ヌンチ（눈치）』文化があります。最初は難しく感じるかもしれませんが、実は一緒に働く人への配慮の感覚で、観察するうちに自然と身につきます。曖昧なときは一人で誤解せず『こうすればよいでしょうか？』と丁寧に確認すればよいです。" },
            { title: "ワークライフバランスの変化", body: "残業・会食中心の古い文化は急速に減り、法定週52時間制・柔軟勤務・在宅勤務が定着しつつあります。会社ごとに雰囲気が違うので、ワークライフバランスを重視するなら応募前に募集要項やJobPlanetなどのレビューで実際の勤務文化を確認するとよいです。個人の時間を尊重する会社が増えているので、心配しすぎなくて大丈夫です。" }
          ]
        },
        {
          heading: "5. 人間関係とコミュニケーション文化",
          emoji: "🍽️",
          summary: "同僚とうまく付き合う方法です。強制する文化は減ったので、気楽に受け止めて大丈夫です。",
          items: [
            { title: "会食文化", body: "会食（회식）はチームで親睦を深める場ですが、以前と違い飲酒を強要する雰囲気は大きく減り、参加も自主化される傾向です。負担なら丁寧に加減したり早めに退席するのも今では自然です。ただ最初の数回は参加して同僚と気楽に交流すると、関係を築くのに役立ちます。", example: "例）お酒が飲めないなら『私はお酒があまり飲めないのでソフトドリンクにします。代わりにたくさんお話ししましょう！』と明るく言えば無理なく切り抜けられます。" },
            { title: "ランチ文化", body: "韓国の職場ではチームメンバーと一緒に昼食をとりながら自然に親しくなることが多いです。毎回一緒にする義務はありませんが、たまに一緒に食事すると業務外の話ができ、よそよそしさが和らぎます。食べたいメニューや食べられない物があれば気軽に言って大丈夫です。" },
            { title: "冠婚葬祭への気配り", body: "同僚の結婚・葬儀などの大事を一緒に気にかける文化があります（お祝い金・香典）。金額や方法が不慣れかもしれませんが決まった規則はないので、分からないときは親しい同僚に『普通いくらくらいですか？』と聞けば大丈夫です。気持ちを表す文化と理解すると気が楽です。", tip: "お祝い金・香典は通常3万・5万・10万ウォン単位で出すことが多いです。親密度によって異なるので同僚に聞きましょう。" },
            { title: "公私の区別", body: "私的にどれだけ親しくても、業務では礼儀と責任を守ることをプロらしいと考えます。親しさを理由に仕事を雑にしたり私的な感情を仕事に持ち込むと信頼を失いやすいので、親しさとは別に任された仕事は確実にやり遂げる態度が大切です。このバランスをうまく保つ人が長く信頼されます。" }
          ]
        },
        {
          heading: "6. 労働条件と制度",
          emoji: "📋",
          summary: "自分の権利に関わる重要な内容です。外国人なら特にビザの部分は必ず覚えておきましょう。",
          items: [
            { title: "労働契約書・4大保険", body: "入社時は勤務時間・給与・業務内容が書かれた労働契約書を必ず確認し、署名後に一部受け取っておきましょう。国民年金・健康保険・雇用保険・労災保険（4大保険）は正規労働者に基本適用される制度で、給与から一部が控除されますが、あなたを守る安全装置です。契約内容が理解できなければ必ず尋ねて確認しましょう。", tip: "労働契約書なしで働こうと言われたら慎重に。書面契約はあなたを守る基本です。" },
            { title: "年俸の構造", body: "年俸は通常、基本給 + 成果給（インセンティブ）+ 福利で構成され、『年俸3,600万ウォン』と言うときは大抵、税引前の1年総額を指します。実際に毎月受け取る手取りは税金と4大保険が引かれて少し減るので、提示された年俸を12で割った額がそのまま口座に入ると思ってはいけません。成果給の有無も必ず確認しましょう。", example: "例）年俸3,600万ウォンなら月300万ウォン（税引前）ですが、税金・4大保険の控除後の手取りはおよそ月270万ウォン前後です。" },
            { title: "年次・休暇", body: "一定期間勤務すると法的に有給年次が発生し、1年以上勤務すると通常、年15日から始まります。年次は労働者の当然の権利で、空気を読まず制度どおり使うよう勧める会社が増えています。事前に予定を共有して休暇を取れば、チームにも迷惑をかけず自分も気楽に休めます。" },
            { title: "外国人就労ビザ", body: "留学（D-2）ビザでは正規就労が難しく、正社員として働くには通常E-7（特定活動）ビザに変更する必要があります。このビザは会社がスポンサーとなり一緒に申請する仕組みなので、会社が外国人採用とビザ支援の経験があるかが重要です。そのため採用・面接段階でビザ支援の可否を必ず確認しましょう。", tip: "面接・採用の過程で『E-7ビザのスポンサーが可能か』を必ず確認しましょう。とても重要です。", example: "例）面接の終わりに『こちらのポジションは外国人採用の際にE-7ビザのスポンサーが可能かお伺いしてもよろしいでしょうか？』と丁寧に尋ねればよいです。" }
          ]
        },
        {
          heading: "7. 外国人としてこう準備します",
          emoji: "🌏",
          summary: "最後に、留学生であるあなた独自の武器と準備法を整理します。",
          items: [
            { title: "自分だけの強み", body: "多言語能力・グローバル感覚・複数の文化への理解は、韓国人応募者にはない大きな武器です。海外市場を広げたり外国の顧客・パートナーを相手にする職務で特に輝くので、この強みを自己紹介書と面接で具体的な事例として見せましょう。『私だからこそこの会社に役立つ理由』につなげると説得力が増します。", example: "例）『ベトナム市場進出を準備するチームなら、ベトナム語と現地文化を理解する私が顧客とのコミュニケーションに貢献できます』のように、強みを職務と結びつけましょう。" },
            { title: "韓国語の準備", body: "業務で使う韓国語力とTOPIKスコアは、書類で信頼を与える頼もしい資産です。発音や文法が完璧でなくても、会社は学ぼうとする誠実な態度とコミュニケーションしようとする努力をより良く見ます。今からメール・会議でよく使う表現を身につけておけば、入社後の適応がずっと楽になります。", tip: "TOPIKは通常4級以上で業務コミュニケーションが可能な水準と認められることが多いです。目標点を決めてコツコツ準備しましょう。" },
            { title: "文化適応のコツ", body: "文化が違うからと萎縮する必要はなく、観察し質問しながら一つずつ学べば大丈夫です。分からないことは恥ではなく学ぼうとする態度に映るので、丁寧に尋ねる習慣がむしろ好印象を与えます。誠実さと相手を尊重する心が、時間とともに揺るがない信頼を作ります。" },
            { title: "よくある誤解を避ける", body: "韓国の職場では沈黙が必ずしも同意を意味せず、『検討してみます』のように婉曲に断る場合も多いです。相手の言葉を字義通りに受け取ると誤解が生じることがあるので、曖昧なときは『私はこう理解しましたが、合っていますか？』と丁寧に確認し直す習慣がよいです。こうした再確認は無礼ではなく丁寧さとして受け取られます。" }
          ]
        }
      ],
      quiz: [
        {
          question: "大企業の一般的な採用方式に最も近いものは？",
          options: ["必要なときに採る随時採用", "春・秋に行う定期採用", "知人の紹介だけで採用", "ほとんど採用しない"],
          answer: 1,
          explain: "大企業は春・秋の定期採用が多く、スタートアップ・外資系・中堅企業は随時採用が多いです。"
        },
        {
          question: "韓国の職場で同僚を呼ぶとき最も無難な呼称は？",
          options: ["名前だけで呼ぶ", "『○○님』または役職で呼ぶ", "あだ名で呼ぶ", "姓だけで呼ぶ"],
          answer: 1,
          explain: "名前だけより『○○님』や役職（チーム長など）で呼ぶのが基本マナーです。"
        },
        {
          question: "外国人が韓国で正社員として就職する際、通常必要な就労ビザは？",
          options: ["D-2（留学）", "E-7（特定活動）", "B-2（観光）", "ビザは不要"],
          answer: 1,
          explain: "正規就労は通常E-7ビザが必要で、通常は会社がスポンサーとなって申請します。採用段階で支援の可否を確認しましょう。"
        },
        {
          question: "業務が行き詰まったとき、韓国の職場で望ましい態度は？",
          options: ["一人で最後まで解決してから報告する", "進捗を早めに共有し中間報告する", "報告せずやり過ごす", "会食の場でだけ話す"],
          answer: 1,
          explain: "『中間報告』は空気を読むことではなく信頼です。行き詰まったら一人で抱え込まず、早めに共有するのがよいです。"
        }
      ]
    },
    id: {
      id: "w1s4",
      emoji: "🏢",
      title: "Memahami Budaya Perusahaan Korea",
      intro:
        "Pelajari secara luas tentang Korea — dari cara perekrutan hingga jabatan, komunikasi, dan sistem ketenagakerjaan. Memahami budaya membantumu menentukan arah yang tepat untuk resume dan wawancara, serta membuat penyesuaian setelah masuk kerja jauh lebih lancar. Bacalah perlahan dan periksa dirimu dengan kuis di akhir.",
      objectives: [
        "Dapat menjelaskan cara perekrutan Korea (rekrutmen terbuka · rekrutmen berkala/sewaktu-waktu) dan tahap seleksinya",
        "Dapat membedakan ciri tiap jenis perusahaan dan menilai mana yang cocok untukmu",
        "Memahami etika kerja dasar seperti jabatan, cara memanggil, dan bahasa hormat",
        "Mengetahui apa yang perlu disiapkan sebagai orang asing (visa, bahasa Korea, kelebihanmu)"
      ],
      sections: [
        {
          heading: "1. Beginilah Perekrutan Berlangsung",
          emoji: "🧭",
          summary: "Pahami dulu gambaran besar pencarian kerja di Korea. Begitu tahu kapan dan lewat tahap apa mereka merekrut, urutan persiapan pun terlihat.",
          items: [
            { title: "Rekrutmen terbuka dan sewaktu-waktu", body: "Perusahaan besar mengadakan rekrutmen terbuka berkala (gongchae) di musim semi dan gugur, sementara startup, perusahaan asing, dan perusahaan menengah lebih banyak merekrut sewaktu-waktu (saat dibutuhkan). Karena rekrutmen terbuka waktunya tetap, penting menyiapkan surat pengenalan diri dan tes bakat sejak awal; untuk rekrutmen sewaktu-waktu, kamu harus melamar cepat saat lowongan muncul agar tak kehilangan kesempatan. Mengetahui perusahaan targetmu termasuk yang mana membantu menyesuaikan waktu dan cara persiapan.", tip: "Cari sekarang untuk memastikan tiga perusahaan targetmu memakai rekrutmen terbuka atau sewaktu-waktu.", example: "Mis.) Perusahaan besar seperti Samsung, Hyundai Motor, SK biasanya mengadakan rekrutmen terbuka di paruh pertama (Mar–Apr) dan paruh kedua (Sep–Okt), sedangkan startup seperti Toss, Karrot memasang lowongan sewaktu-waktu di Saramin, Wanted." },
            { title: "Tahap seleksi", body: "Biasanya berurutan: berkas (resume dan surat pengenalan diri) → tes bakat/coding test → wawancara teknis → wawancara pimpinan. Tiap tahap menilai hal berbeda — berkas menunjukkan 'alasan untuk menemui orang ini', sedangkan wawancara memastikan 'apakah kamu orang yang ingin diajak bekerja'. Alih-alih baru menyiapkan tahap berikutnya setelah lolos satu tahap, menggambarkan seluruh alur sebelum melamar akan membuat hatimu jauh lebih tenang.", example: "Mis.) Lolos berkas → tes bakat/coding online → wawancara teknis tahap 1 (pertanyaan pekerjaan) → wawancara pimpinan tahap 2 (kepribadian, nilai) → pemberitahuan lolos akhir; biasanya butuh 4–8 minggu." },
            { title: "Bobot surat pengenalan diri", body: "Korea sangat mementingkan surat pengenalan diri (jagisogaeseo). Kuncinya adalah menyampaikan motivasi melamar, proses pertumbuhan, dan kompetensi kerja sebagai 'cerita', bukan sekadar daftar, sehingga kamu perlu menulis pengalaman konkret beserta pergulatan dan hasil saat itu agar meyakinkan. Pelamar asing khususnya diuntungkan dengan menyampaikan dengan tulus 'mengapa di Korea, dan mengapa di perusahaan ini'.", tip: "Kamu akan menulis surat pengenalan diri langsung di Minggu ke-3 program ini, jadi untuk sekarang cukup ingat 'mengapa itu penting'." },
            { title: "Jalur magang · kerja sama industri-akademik · magang-ke-tetap", body: "Ada banyak jalur di mana kamu lebih dulu menimba pengalaman lewat magang atau kerja sama industri-akademik lalu diangkat menjadi karyawan tetap. Ini pintu masuk yang bagus bagi fresh graduate minim pengalaman, sambil belajar bekerja dan kedua pihak saling mengecek kecocokan. Khususnya bagi mahasiswa internasional, pengalaman magang menjadi bukti bahwa kamu sudah beradaptasi dengan budaya organisasi Korea, sangat membantu saat melamar posisi tetap.", tip: "Perhatikan lebih dulu lowongan 'magang jalur pengangkatan tetap'. Karena direkrut dengan premis pengangkatan tetap, lolos lebih mungkin berujung pada pekerjaan." }
          ]
        },
        {
          heading: "2. Tiap Jenis Perusahaan Punya Warna Sendiri",
          emoji: "🏢",
          summary: "Meski sama-sama 'bekerja', budaya dan cara persiapannya berbeda menurut jenis perusahaan. Bacalah sambil membayangkan tempat yang cocok dengan kepribadianmu.",
          items: [
            { title: "Perusahaan besar", body: "Kekuatannya adalah pelatihan sistematis, pekerjaan stabil, dan tunjangan solid, bagus untuk fresh graduate membangun fondasi. Sebaliknya, persaingan rekrutmen terbuka ketat, prosesnya panjang, dan harus menyiapkan tes bakat, jadi jika memutuskan melamar, rencanakan beberapa bulan sebelumnya. Karena organisasi besar, peran yang diemban sangat terspesialisasi — ketahui ini lebih dulu.", example: "Mis.) Samsung Electronics, LG, Hyundai Motor, SK Hynix. Samsung memakai GSAT, yang lain pun kerap mengadakan tes bakat sendiri." },
            { title: "Perusahaan menengah", body: "Berada di antara perusahaan besar dan startup, menawarkan tingkat stabilitas tertentu sekaligus memudahkan menimba pengalaman praktis yang luas. Prosesnya tak serumit perusahaan besar sehingga rekrutmen sewaktu-waktu banyak, dan satu orang bisa menangani beberapa tugas sehingga laju pertumbuhan cenderung cepat. Di antara 'juara tersembunyi' yang kurang terkenal pun banyak yang bagus, jadi lihat juga rekam jejak dan bidang usaha perusahaan." },
            { title: "Startup", body: "Daya tariknya adalah pertumbuhan cepat, pengalaman beragam peran, dan budaya komunikasi yang datar. Pengambilan keputusan cepat dan ide bisa langsung dijalankan, cocok bagi yang ingin bekerja proaktif. Sebaliknya, perubahan sering terjadi dan ada ketidakpastian pekerjaan/tunjangan, jadi sebelum melamar sebaiknya cek juga tahap pendanaan atau kestabilan perusahaan.", tip: "Sebelum melamar, mengecek berita pendanaan atau skala rekrutmen startup lewat berita atau LinkedIn membantu memperkirakan kestabilannya." },
            { title: "Perusahaan asing", body: "Banyak penggunaan bahasa Inggris dan budaya berpusat pada hasil/individu, jadi kamu dinilai dari kemampuan dan hasil ketimbang hierarki. Bagus untuk memanfaatkan kemampuan bahasa dan wawasan global mahasiswa internasional, dan bekerja dengan rekan berbagai kebangsaan membuat beban adaptasi budaya relatif ringan. Namun ada yang merekrut dalam jumlah kecil atau berfokus pada tenaga berpengalaman, jadi pastikan mereka merekrut fresh graduate.", tip: "Tim asing dan global sangat menguntungkan bagi mahasiswa internasional. Pastikan masuk daftar lamaranmu.", example: "Mis.) Google, Microsoft, L'Oréal, P&G. Mencari 'Korea' di LinkedIn memudahkan menemukan lowongan kantor Korea." },
            { title: "BUMN · lembaga publik", body: "Pekerjaan stabil dan rekrutmen buta (blind) banyak, jadi mereka mengutamakan kecocokan pekerjaan dan tes tertulis (NCS) ketimbang almamater, usia, atau latar belakang. Berkat proses yang adil, meski resume tak mencolok kamu bisa mendapat hasil sepadan usaha. Namun orang asing kadang menghadapi syarat kewarganegaraan/visa dalam kriteria pelamar, jadi selalu cek dulu syarat pelamar di lowongan." }
          ]
        },
        {
          heading: "3. Jabatan, Cara Memanggil, dan Budaya Hierarki",
          emoji: "🎓",
          summary: "Ini dasar etika kerja Korea. Satu sapaan kecil bisa menentukan kesan pertama.",
          items: [
            { title: "Sistem jabatan", body: "Secara tradisional naik: staf (sawon) → asisten manajer (daeri) → manajer (gwajang) → wakil general manager (chajang) → general manager (bujang) → pimpinan. Mengetahui jabatan memberi gambaran kepada siapa dan bagaimana berbicara dalam rapat atau email. Kini makin banyak perusahaan menyeragamkan sapaan menjadi 'nim', 'pro', atau 'manager' demi budaya yang lebih datar, jadi begitu masuk, tanyakan dulu cara perusahaan itu lalu ikuti." },
            { title: "Etika menyapa", body: "Alih-alih memanggil hanya dengan nama, memakai '○○-nim' atau jabatan (kepala tim, manajer) adalah dasar. Itu sopan santun pertama yang menghormati lawan bicara, dan satu sapaan pun bisa memberi kesan 'orang yang tahu sopan santun'. Saat tak tahu jabatannya, ketimbang menebak paksa, memakai '○○-nim' paling aman.", tip: "Jika tak tahu jabatan lawan bicara, '○○-nim' dulu paling aman.", example: "Mis.) Untuk kepala tim Kim Min-su, 'kepala tim' lebih alami daripada 'Min-su-nim'; untuk rekan sejawat Lee Ji-eun, memanggil 'Ji-eun-nim' terdengar wajar." },
            { title: "Usia · masa kerja · urutan", body: "Suasana menghormati usia dan masa kerja masih tersisa. Sikap sopan dan rendah hati memberi kesan baik di organisasi mana pun, dan khususnya menunjukkan kemauan belajar dari senior lebih dulu membuat hubungan jauh lebih lancar. Meski begitu, tak perlu menciut berlebihan — rasa hormat yang wajar sudah cukup." },
            { title: "Bahasa hormat adalah standar", body: "Di kantor, terlepas dari usia atau kedekatan, standarnya memakai bahasa hormat. Bahasa hormat bukan jarak, melainkan kesopanan memperlakukan satu sama lain secara formal, jadi wajar tetap memakainya dalam rapat atau situasi kerja bahkan setelah akrab. Meski belum sempurna, orang menghargai justru usaha memakai bahasa hormat, jadi tak perlu tertekan.", example: "Mis.) 'Kerjakan ini' (X) → 'Mohon periksa bagian ini' (O); 'Oke' (X) → 'Baik, saya mengerti' (O) begitulah cara mengubahnya." }
          ]
        },
        {
          heading: "4. Cara Bekerja dan Suasananya",
          emoji: "🤝",
          summary: "Ketahui lebih dulu bagaimana pekerjaan sebenarnya berjalan di perusahaan, agar tak kaget setelah masuk kerja.",
          items: [
            { title: "Berpusat pada tim", body: "Sama pentingnya dengan kemampuan individu, kinerja tim dan kolaborasi juga dihargai. Orang yang bekerja selaras dengan rekan dan berbagi informasi lebih disukai ketimbang yang hanya hebat sendirian, jadi sikap memikirkan tujuan seluruh tim sambil menjalankan bagianmu itu penting. Wawancara pun sering menanyakan pengalaman kolaborasi, jadi baik menyiapkan contoh terkait sejak awal." },
            { title: "Pelaporan dan pengambilan keputusan", body: "Organisasi Korea sangat mementingkan 'pelaporan'. Sering berbagi kemajuan dengan atasan membangun kepercayaan, dan keputusan besar cenderung butuh persetujuan atasan alih-alih selesai di tingkat penanggung jawab. Awalnya mungkin terasa merepotkan, tetapi makin sering berbagi, makin mengurangi kesalahan dan lebih cepat memperoleh bantuan.", tip: "'Laporan antara' bukan membaca situasi, melainkan kepercayaan. Saat mentok, jangan dipendam sendiri, bagikan lebih awal." },
            { title: "Budaya rapat", body: "Rapat lebih merupakan tempat menetapkan kesimpulan dan peran masing-masing ketimbang tempat mengobrol. Dulu banyak rapat panjang dan formal, tetapi kini beralih ke rapat singkat dan efisien, jadi memahami agenda lebih dulu dan menyiapkan bahan yang diperlukan memberi kesan baik. Bagian yang tak dipahami boleh ditanyakan dengan sopan saat rapat." },
            { title: "Nunchi dan membaca suasana", body: "Ada budaya 'nunchi' — membaca situasi dan suasana hati lawan tanpa harus mengucapkan semuanya. Awalnya mungkin terasa sulit, tetapi sebenarnya itu kepekaan memedulikan rekan kerja, dan seiring pengamatan akan terbiasa sendiri. Saat ragu, jangan salah paham sendiri — pastikan dengan sopan seperti 'Apakah boleh saya lakukan begini?'" },
            { title: "Perubahan keseimbangan kerja-hidup", body: "Budaya lama yang berpusat pada lembur dan makan malam kantor cepat menyusut, dan sistem 52 jam/minggu sesuai undang-undang, kerja fleksibel, serta kerja jarak jauh mulai mapan. Karena suasana berbeda tiap perusahaan, jika keseimbangan kerja-hidup penting bagimu, sebaiknya cek budaya kerja nyata sebelum melamar lewat lowongan atau ulasan seperti JobPlanet. Makin banyak perusahaan menghormati waktu pribadi, jadi tak perlu terlalu khawatir." }
          ]
        },
        {
          heading: "5. Budaya Hubungan dan Komunikasi",
          emoji: "🍽️",
          summary: "Cara akur dengan rekan kerja. Budaya paksaan sudah berkurang, jadi terimalah dengan santai.",
          items: [
            { title: "Budaya makan malam kantor", body: "Makan malam kantor (hoesik) adalah ajang mempererat keakraban antaranggota tim, tetapi tak seperti dulu, suasana memaksa minum alkohol sudah banyak berkurang dan kehadiran pun makin sukarela. Jika terasa membebani, dengan sopan mengatur diri atau pulang lebih awal kini juga wajar. Meski begitu, hadir beberapa kali pertama dan berbaur santai membantu membuka hubungan dengan rekan.", example: "Mis.) Jika tak bisa minum alkohol, dengan ceria berkata 'Saya kurang bisa minum, jadi saya pesan minuman saja. Sebagai gantinya kita banyak mengobrol ya!' akan lolos tanpa masalah." },
            { title: "Budaya makan siang", body: "Di kantor Korea, sering kali orang menjadi akrab secara alami sambil makan siang bersama rekan tim. Tak wajib ikut tiap kali, tetapi sesekali makan bersama memungkinkan berbincang di luar pekerjaan dan mencairkan kekakuan. Jika ada menu yang diinginkan atau makanan yang tak bisa dimakan, katakan saja dengan santai." },
            { title: "Menghadiri peristiwa penting", body: "Ada budaya turut menghadiri peristiwa besar rekan seperti pernikahan dan pemakaman (uang selamat · uang duka). Jumlah atau caranya mungkin asing, tetapi tak ada aturan baku, jadi saat tak tahu tanyakan pada rekan dekat 'biasanya orang memberi sekitar berapa?'. Memahaminya sebagai budaya mengungkapkan perasaan akan membuatnya lebih mudah.", tip: "Uang selamat · uang duka sering diberikan dalam satuan 30.000, 50.000, atau 100.000 won. Bervariasi menurut kedekatan, jadi tanyakan pada rekan." },
            { title: "Memisahkan urusan publik dan pribadi", body: "Sedekat apa pun secara pribadi, menjaga kesopanan dan tanggung jawab dalam pekerjaan dianggap profesional. Mengerjakan tugas asal-asalan dengan dalih keakraban, atau menyeret perasaan pribadi ke pekerjaan, mudah menghilangkan kepercayaan, jadi sikap tetap menuntaskan tugas dengan pasti terlepas dari kedekatan itu penting. Orang yang menjaga keseimbangan ini dengan baik dipercaya untuk waktu lama." }
          ]
        },
        {
          heading: "6. Kondisi Kerja dan Sistemnya",
          emoji: "📋",
          summary: "Konten penting terkait hakmu. Sebagai orang asing, pastikan mengingat bagian visa secara khusus.",
          items: [
            { title: "Kontrak kerja · 4 asuransi utama", body: "Saat masuk kerja, pastikan memeriksa kontrak kerja yang memuat jam kerja, gaji, dan uraian tugas, lalu terima satu salinan setelah menandatangani. Empat asuransi utama (dana pensiun nasional, asuransi kesehatan, asuransi ketenagakerjaan, asuransi kecelakaan kerja) berlaku secara standar bagi pekerja tetap — sebagian dipotong dari gaji, tetapi merupakan jaring pengaman yang melindungimu. Jika ada isi kontrak yang tak dipahami, selalu tanyakan dan pastikan.", tip: "Berhati-hatilah jika ada yang mengajak bekerja tanpa kontrak kerja. Kontrak tertulis adalah perlindungan dasar bagimu." },
            { title: "Struktur gaji tahunan", body: "Gaji tahunan biasanya terdiri dari gaji pokok + gaji kinerja (insentif) + tunjangan, dan menyebut 'gaji tahunan 36 juta won' umumnya berarti total setahun sebelum pajak. Karena take-home bulanan sudah dipotong pajak dan empat asuransi sehingga sedikit menyusut, jangan mengira gaji yang ditawarkan dibagi 12 masuk ke rekening apa adanya. Pastikan pula apakah insentif termasuk.", example: "Mis.) Gaji tahunan 36 juta won berarti 3 juta won/bulan (sebelum pajak), tetapi setelah dipotong pajak dan empat asuransi, take-home sekitar 2,7 juta won/bulan." },
            { title: "Cuti tahunan · libur", body: "Setelah bekerja periode tertentu, kamu secara hukum memperoleh cuti tahunan berbayar, dan setelah satu tahun biasanya mulai dari 15 hari setahun. Cuti tahunan adalah hak sah pekerja, dan makin banyak perusahaan mendorong penggunaannya sesuai sistem tanpa harus membaca situasi. Berbagi jadwal lebih dulu lalu mengambil cuti tidak membebani tim dan membuatmu bisa beristirahat dengan tenang." },
            { title: "Visa kerja orang asing", body: "Dengan visa pelajar (D-2) sulit bekerja secara resmi; untuk bekerja penuh waktu biasanya harus beralih ke visa E-7 (Aktivitas Tertentu). Visa ini berstruktur perusahaan menjadi sponsor dan mengajukan bersama, jadi penting apakah perusahaan berpengalaman merekrut orang asing dan mendukung visa. Karena itu, kamu harus memastikan ketersediaan dukungan visa pada tahap perekrutan dan wawancara.", tip: "Selama wawancara · perekrutan, pastikan menanyakan 'apakah sponsor visa E-7 memungkinkan'. Sangat penting.", example: "Mis.) Di akhir wawancara, kamu bisa bertanya dengan sopan, 'Bolehkah saya tanya apakah posisi ini bisa mensponsori visa E-7 untuk perekrutan orang asing?'" }
          ]
        },
        {
          heading: "7. Beginilah Cara Bersiap sebagai Orang Asing",
          emoji: "🌏",
          summary: "Terakhir, mari rangkum senjata dan cara persiapan khas dirimu sebagai mahasiswa internasional.",
          items: [
            { title: "Kelebihanmu sendiri", body: "Kemampuan multibahasa, wawasan global, dan pemahaman berbagai budaya adalah senjata besar yang tak dimiliki pelamar Korea. Semua itu bersinar terutama di pekerjaan memperluas pasar luar negeri atau menangani pelanggan dan mitra asing, jadi tunjukkan kelebihan ini sebagai contoh konkret di surat pengenalan diri dan wawancara. Menghubungkannya dengan 'alasan justru karena saya, saya berguna bagi perusahaan ini' membuatmu lebih meyakinkan.", example: "Mis.) Hubungkan kelebihanmu dengan pekerjaan, seperti 'Jika ini tim yang bersiap masuk pasar Vietnam, saya — yang memahami bahasa Vietnam dan budaya setempat — dapat berkontribusi pada komunikasi dengan pelanggan'." },
            { title: "Persiapan bahasa Korea", body: "Kemampuan bahasa Korea untuk bekerja dan skor TOPIK adalah aset kuat yang memberi kepercayaan di atas berkas. Meski pelafalan atau tata bahasa belum sempurna, perusahaan lebih menghargai sikap tulus mau belajar dan usaha berkomunikasi. Membiasakan diri sejak sekarang dengan ungkapan yang sering dipakai di email dan rapat membuat adaptasi setelah masuk kerja jauh lebih lancar.", tip: "TOPIK level 4 ke atas sering diakui cukup untuk komunikasi kerja. Tetapkan skor target dan siapkan secara konsisten." },
            { title: "Tips adaptasi budaya", body: "Tak perlu menciut karena budaya berbeda — cukup amati, tanyakan, dan pelajari satu per satu. Tidak tahu bukanlah hal memalukan melainkan tampak sebagai sikap mau belajar, jadi kebiasaan bertanya dengan sopan justru memberi kesan baik. Ketulusan dan rasa hormat pada orang lain seiring waktu akan membangun kepercayaan yang kokoh." },
            { title: "Menghindari kesalahpahaman umum", body: "Di kantor Korea, diam tak selalu berarti setuju, dan orang sering menolak secara halus seperti 'akan saya pertimbangkan'. Menerima ucapan orang secara harfiah bisa menimbulkan salah paham, jadi saat ragu, kebiasaan menegaskan ulang dengan sopan — 'Saya memahaminya begini, apakah benar?' — itu baik. Penegasan ulang semacam ini dianggap kecermatan, bukan ketidaksopanan." }
          ]
        }
      ],
      quiz: [
        {
          question: "Manakah yang paling dekat dengan cara perekrutan umum perusahaan besar?",
          options: ["Rekrutmen sewaktu-waktu setiap kali dibutuhkan", "Rekrutmen terbuka berkala di musim semi dan gugur", "Merekrut hanya lewat rekomendasi kenalan", "Hampir tidak merekrut"],
          answer: 1,
          explain: "Perusahaan besar banyak mengadakan rekrutmen terbuka berkala di musim semi dan gugur, sedangkan startup, perusahaan asing, dan perusahaan menengah banyak merekrut sewaktu-waktu."
        },
        {
          question: "Cara memanggil rekan kerja yang paling aman di kantor Korea adalah?",
          options: ["Memanggil hanya dengan nama", "Memakai '○○-nim' atau jabatan", "Memanggil dengan julukan", "Memakai hanya nama marga"],
          answer: 1,
          explain: "Ketimbang hanya nama, memakai '○○-nim' atau jabatan (kepala tim, dll.) adalah etika dasar."
        },
        {
          question: "Visa kerja apa yang biasanya dibutuhkan orang asing untuk bekerja penuh waktu di Korea?",
          options: ["D-2 (pelajar)", "E-7 (aktivitas tertentu)", "B-2 (wisata)", "Tidak perlu visa"],
          answer: 1,
          explain: "Pekerjaan tetap biasanya membutuhkan visa E-7, dan umumnya perusahaan mengajukan sebagai sponsor. Pastikan ketersediaan dukungan pada tahap perekrutan."
        },
        {
          question: "Saat mentok dalam pekerjaan, sikap yang diinginkan di kantor Korea adalah?",
          options: ["Melapor hanya setelah menyelesaikannya sepenuhnya sendiri", "Berbagi kemajuan lebih awal dan memberi laporan antara", "Melewatkannya tanpa melapor", "Membicarakannya hanya di makan malam kantor"],
          answer: 1,
          explain: "'Laporan antara' bukan membaca situasi, melainkan kepercayaan. Saat mentok, lebih baik berbagi lebih awal ketimbang dipendam sendiri."
        }
      ]
    }
  },
  w2s4: {
    en: {
      id: "w2s4",
      emoji: "📄",
      title: "Korean-Style Resume Manners",
      intro:
        "Learn in detail the format and writing methods of a Korean resume, and the mistakes to avoid. The quality of the resume you build this week will rise sharply. Check yourself with the quiz at the end.",
      objectives: [
        "Know the basic structure and format of a Korean resume",
        "Understand how to handle the photo and personal details",
        "Know how to write experience and achievements persuasively",
        "Be able to avoid common resume mistakes"
      ],
      sections: [
        {
          heading: "1. The Basics of a Korean Resume",
          emoji: "📋",
          summary: "Format matters in a Korean resume. Let's set the basic frame first.",
          items: [
            { title: "Resume vs. cover letter", body: "A resume concisely organizes 'factual information' like education, experience, and skills in a table-like form, while a cover letter tells your motivation and competencies as a 'story.' The two documents play different roles, so in Korea they're usually submitted together; keeping only facts on the resume and leaving explanations to the cover letter makes each cleaner.", example: "Resume: '2023.03–2024.02 OO Café Floor Manager'\nCover letter: 'While serving customers, I learned how to quickly build trust even with people I meet for the first time, and this experience led to my interest in a sales role.'" },
            { title: "Appropriate length", body: "A resume is usually best at 1–2 pages, because a hiring manager doesn't spend long on one person's documents. Rather than cramming in every experience, selecting only the core points related to the job you're applying for and keeping it concise actually shows your strengths better." },
            { title: "Reverse-chronological order", body: "List education and experience in reverse order (most recent first), with the newest on top. Since the manager reads from the top to first grasp 'what this person is doing now,' it's natural to place experiences closer to the present higher up.", tip: "Place recent relevant experience above older part-time jobs." },
            { title: "Consistent format", body: "Unifying date notation (e.g. 2024.03), font, and line spacing across the whole document makes it much cleaner and more trustworthy. If it's mixed — '2024년 3월' here, '24/3' there — even minor, it can give an impression of not being thorough, so set one rule and keep it to the end." }
          ]
        },
        {
          heading: "2. Photo and Personal Details",
          emoji: "📸",
          summary: "This is the part that makes the first impression. Keep it neat, not excessive.",
          items: [
            { title: "ID photo", body: "Korean resumes often include a neat ID photo, because the photo shapes the first impression. A photo with a bright expression, tidy attire, and facing forward is good, and using a studio-taken standard ID/half-portrait size is safe (it's not legally required).", tip: "No selfies or travel photos. Prepare a front-facing ID photo." },
            { title: "Basic personal details", body: "Your name, contact number, and email are enough. Since the manager only needs a clear way to reach you, there's no need to strain to fill in many fields. Just be sure to double-check your contact number and email for typos." },
            { title: "Be careful with personal info", body: "Don't include sensitive information not needed for the hiring decision, like resident registration number, family relations, or an exact home address. The company requests such information separately after your hiring is confirmed, so at the resume stage it's better to write only the minimum to protect yourself." },
            { title: "Email address", body: "Your email address is virtually the 'profile' the manager sees first. A playful or old ID can blur the impression, so making a fresh, tidy name-based address looks far more professional.", example: "Bad: cutie_dragon_99@...\nGood: minji.kim.work@... (name + purpose based)" }
          ]
        },
        {
          heading: "3. How to Write Experience and Achievements",
          emoji: "✍️",
          summary: "This is the heart of the resume. Write not 'I did this' but 'I achieved this.'",
          items: [
            { title: "Fact- and achievement-centered", body: "Without exaggeration, write concretely what you actually did and its results. Since managers look at 'can this person produce results at our company too' rather than flashy phrasing, connecting your role and how it improved things in one line builds trust.", example: "Weak: 'I worked at a café.'\nStrong: 'I handled floor serving and inventory management, lowering the waste rate and cutting closing-cleanup time.'" },
            { title: "Express with numbers", body: "When figures like 'boosted sales 20%' or 'managed 30 club members' are included, the achievement lands at a glance and is more persuasive. When you don't know the exact number, adding even an approximate scale (about 50 people, 3 months, etc.) is far more trustworthy than a vague expression.", tip: "One line with concrete numbers/results is far stronger than a vague 'diligently.'", example: "Bad: 'I diligently ran the SNS.'\nGood: 'I ran the Instagram account for 6 months, growing followers from 500 to 2,000.'" },
            { title: "Relevance to the job", body: "Place experience related to the job you're applying for higher up and toward the front. Since the manager first checks 'is this person a fit for the role we're hiring for,' even the same experience reads much stronger when you put the parts connected to the target job up front." },
            { title: "Start with action verbs", body: "Starting sentences with verbs that show the action you led — like 'planned,' 'analyzed,' 'improved' — makes clear what you did. Leading with what you proactively did, rather than passive expressions like 'participated in' or 'helped with,' gives a far more active impression.", example: "Weak: 'I participated in the project.'\nStrong: 'On a 5-person team, I took charge of data analysis and derived improvement measures.'" }
          ]
        },
        {
          heading: "4. What to Avoid in a Resume",
          emoji: "🚫",
          summary: "Even minor things count against you. Be sure to check before submitting.",
          items: [
            { title: "Typos and awkward sentences", body: "Typos or awkward sentences in a resume can give the impression of 'someone who isn't thorough,' regardless of content. Reading slowly aloud before submitting catches mistakes you missed with your eyes far better, so be sure to review aloud once at the end.", tip: "Looking again a day later makes mistakes stand out." },
            { title: "Excessive design", body: "Flashy colors or many kinds of fonts may seem eye-catching, but they actually make the content hard to read. In Korean hiring, a clean, mostly black-and-white layout that's easy to read is taken as more professional, so prioritize readability over design." },
            { title: "Irrelevant listings", body: "Cramming in experiences unrelated to the job buries the very core experiences you want to show in between. If you think of the goal as 'picking and writing the right things' rather than 'writing a lot,' it becomes easier to judge what to cut." },
            { title: "Informal expressions", body: "Emojis, colloquial speech, and abbreviations (e.g. 'lol', 'cram-study') may seem friendly but don't suit a resume, an official document. Unifying with polite written style conveys the same content far more credibly." }
          ]
        },
        {
          heading: "5. Resume Tips for International Students",
          emoji: "🌏",
          summary: "How to weave your own strengths into the resume.",
          items: [
            { title: "State language ability", body: "Clearly write the languages you can use and their level (TOPIK grade, official English score, etc.). Multilingual ability is a big strength unique to foreign applicants, so showing it with objective indicators rather than a vague 'possible' is far more persuasive.", example: "Weak: 'Korean OK, English OK'\nGood: 'Korean (TOPIK Level 5), English (business conversation possible), Vietnamese (native)'" },
            { title: "Visa status", body: "When necessary, briefly state your current visa type and whether you can work. Since one of the things a company is most curious about when hiring is 'can you work right away,' if you have a work-eligible visa, clearly noting it helps ease the manager's worry in advance.", tip: "Rather than visa type and expiry date, clearly stating 'whether you're eligible to work' is more helpful to the manager." },
            { title: "Global experience", body: "Don't leave overseas living, multicultural projects, or study-abroad experience as mere background — connect them as strengths for the target job. For example, experience understanding overseas markets or collaborating with people across cultures reads as an attractive competency to Korean companies doing global business." },
            { title: "Check Korean expressions", body: "Even if grammar is correct, some expressions may look awkward to Koreans, so it's good to have a Korean colleague or mentor review your finished resume once. Just having a small expression naturally polished noticeably raises the whole resume's quality and credibility.", tip: "Actively use this program's resume builder and coach." }
          ]
        }
      ],
      quiz: [
        {
          question: "What is the usual order for arranging experience and education on a Korean resume?",
          options: ["Oldest first (past → recent)", "Reverse chronological (recent → past)", "Alphabetical order", "Random regardless of order"],
          answer: 1,
          explain: "Experience and education are usually listed in reverse order (most recent first) with the newest on top."
        },
        {
          question: "How can you express achievements more persuasively on a resume?",
          options: ["Emotion-centered like 'I worked hard'", "With concrete numbers like 'boosted sales 20%'", "As long and flashy as possible", "By adding lots of emojis"],
          answer: 1,
          explain: "Concrete numbers and results make it far more persuasive."
        },
        {
          question: "Which information is better left off a resume?",
          options: ["Name and contact", "Languages and level", "Excessive sensitive info like resident registration number", "Experience related to the target job"],
          answer: 2,
          explain: "It's better not to include more-than-necessary sensitive info like a resident registration number."
        },
        {
          question: "Which strength should an international student especially highlight on a resume?",
          options: ["Flashy resume design", "Languages and global experience", "As much unrelated experience as possible", "Long length"],
          answer: 1,
          explain: "Multilingual and global experience is an international student's big weapon. Connect it to a job strength."
        }
      ]
    },
    "zh-CN": {
      id: "w2s4",
      emoji: "📄",
      title: "韩式简历礼仪",
      intro:
        "详细学习韩国简历的格式、写法，以及应避免的错误。本周你制作的简历完成度会大幅提升。最后用测验检验自己。",
      objectives: [
        "了解韩国简历的基本构成和格式",
        "理解如何处理照片和个人信息",
        "掌握如何有说服力地写经历和成果",
        "能够避免简历中常见的错误"
      ],
      sections: [
        {
          heading: "1. 韩国简历的基础",
          emoji: "📋",
          summary: "韩国简历讲究格式。先搭好基本框架。",
          items: [
            { title: "简历 vs 自我介绍书", body: "简历是把学历、经历、技能等‘事实信息’像表格一样简洁整理的文件，自我介绍书则是把应聘动机和能力以‘故事’展开的文章。两者作用不同，因此在韩国通常一起提交；简历只放事实、说明交给自我介绍书，各自会更清爽。", example: "简历：‘2023.03~2024.02 OO咖啡厅 大堂经理’\n自我介绍书：‘在接待客人时，我学会了与初次见面的人也能快速建立信任，这段经历引发了我对营销岗位的兴趣。’" },
            { title: "适当的篇幅", body: "简历通常1~2页为宜，因为招聘负责人看一个人材料的时间并不长。与其把所有经历都塞进去，不如只挑与应聘岗位相关的核心简洁呈现，反而更能凸显优势。" },
            { title: "按最新顺序排列", body: "学历和经历按最近的在上的倒序（最新顺）排列。负责人从上往下阅读，先把握‘此人现在在做什么’，因此越接近当下的经历越放上面才自然。", tip: "把近期相关经历放在早年打工之上。" },
            { title: "统一格式", body: "把日期标注（例：2024.03）、字体、行距在整份文件中统一，会更整洁、更可信。若有的写‘2024年3月’、有的写‘24/3’这样混杂，即便细小也可能给人不够细致的印象，所以定一个规则并贯彻到底。" }
          ]
        },
        {
          heading: "2. 照片与个人信息",
          emoji: "📸",
          summary: "这是塑造第一印象的部分。不要过度，端庄为宜。",
          items: [
            { title: "证件照", body: "韩国简历常放端庄的证件照，因为照片左右第一印象。表情明朗、着装整洁、正面朝前的照片为好，用照相馆拍的证件照/半身照规格较为稳妥（法律上并非必需）。", tip: "自拍、旅行照不可。请准备正面证件照。" },
            { title: "基本个人信息", body: "姓名、联系方式、邮箱即可。负责人只需有明确的联系方式，无需勉强填满很多项。只要务必再次确认联系方式和邮箱有无笔误。" },
            { title: "注意个人信息", body: "身份证号、家庭关系、准确住址等招聘判断不需要的敏感信息不要放。这些信息在实际入职确定后公司会另行索取，因此在简历阶段，为保护自己也只写最少限度为好。" },
            { title: "邮箱地址", body: "邮箱地址就相当于负责人最先看到的你的‘个人资料’。戏谑或陈旧的账号会模糊印象，因此新建一个基于姓名的端庄地址使用，会显得专业得多。", example: "差的例子：cutie_dragon_99@...\n好的例子：minji.kim.work@...（姓名+用途）" }
          ]
        },
        {
          heading: "3. 经历·成果的写法",
          emoji: "✍️",
          summary: "这是简历的核心。不要写‘做了什么’，而写‘取得了什么成果’。",
          items: [
            { title: "以事实·成果为中心", body: "不夸张，具体写出自己实际做的事及其结果。负责人看的是‘此人在我们公司也能出成果吗’，而非华丽措辞，因此把担任的角色与由此改善之处用一句话相连，便能建立信任。", example: "弱的例子：‘在咖啡厅工作过。’\n强的例子：‘负责大堂服务与库存管理，降低了报废率、缩短了收尾整理时间。’" },
            { title: "用数字表达", body: "加入‘销售额提升20%’‘管理社团成员30名’这样的数字，成果一目了然、更有说服力。不知道确切数字时，哪怕写大致规模（约50名、3个月等）也比含糊表达可信得多。", tip: "比起含糊的‘努力’，具体数字·结果一句更有力。", example: "差的例子：‘努力运营了SNS。’\n好的例子：‘运营Instagram账号6个月，把粉丝从500名增至2000名。’" },
            { title: "与岗位的关联性", body: "把与应聘岗位相关的经历放在上方·前面。负责人首先确认‘此人是否适合我们要招的岗位’，因此同样的经历，把与应聘岗位相连的部分放在前面，读起来会强得多。" },
            { title: "以行动动词开头", body: "用‘策划了·分析了·改进了’这类表示自己主导行动的动词起句，就能清楚呈现你做了什么。比起‘参与了~’‘协助了~’这样被动的表达，把主动做的事放在前面，会给人主动得多的印象。", example: "弱的例子：‘参与了项目。’\n强的例子：‘在5人团队中负责数据分析，提出了改进方案。’" }
          ]
        },
        {
          heading: "4. 简历中应避免的事",
          emoji: "🚫",
          summary: "看似细小，实则是扣分项。提交前务必检查。",
          items: [
            { title: "错别字·病句", body: "简历里的错别字或别扭句子，无关内容都可能给人‘不够细致’的印象。提交前放慢速度出声朗读，比只用眼看更能抓到漏掉的错误，因此最后务必出声检查一遍。", tip: "隔天再看，错误更易发现。" },
            { title: "过度设计", body: "华丽的色彩或多种字体看似醒目，反而让内容难读。在韩国招聘现场，易读的、以黑白为主的整洁排版更被视为专业，因此比起设计，请优先可读性。" },
            { title: "无关的罗列", body: "塞进大量与岗位无关的经历，会把真正想展示的核心经历埋没其中。把目标想成‘挑对的写’而非‘写得多’，就更容易判断该删掉什么。" },
            { title: "非正式表达", body: "表情符号、口语、缩略语（例：‘哈哈’‘刷夜复习’）虽显亲切，却不适合简历这份正式文件。统一用郑重的书面语，同样的内容也会传达得更可信。" }
          ]
        },
        {
          heading: "5. 给留学生的简历技巧",
          emoji: "🌏",
          summary: "把你独有的优势融入简历的方法。",
          items: [
            { title: "写明语言能力", body: "清楚写出你能使用的语言及其水平（TOPIK级别、英语公认分数等）。多语言能力是外国申请者独有的巨大优势，因此用客观指标呈现，比‘可以’这样含糊的表达更有说服力。", example: "弱的例子：‘韩语可以，英语可以’\n好的例子：‘韩语（TOPIK 5级），英语（可进行工作会话），越南语（母语）’" },
            { title: "签证状态", body: "必要时简要说明当前签证种类及可否就业。公司招聘时最想知道的一点就是‘能否马上上工’，因此若是可就业签证，明确写出，能提前打消负责人的顾虑。", tip: "比起签证种类·滞留到期日，明确写‘可否从事就业活动’对负责人更有帮助。" },
            { title: "全球经历", body: "别把海外生活、多文化项目、留学经历仅当作背景，要与应聘岗位的优势相连。例如理解海外市场、与多文化圈的人协作的经历，对做全球业务的韩国企业而言，会被读作有魅力的能力。" },
            { title: "检查韩语表达", body: "即便语法正确，也可能有韩国人看来别扭的表达，因此完成的简历最好请韩国同事或导师检查一遍。仅仅把一处小小的表达自然地打磨一下，整份简历的完成度和可信度就会明显提升。", tip: "请积极利用本项目的简历生成器和辅导。" }
          ]
        }
      ],
      quiz: [
        {
          question: "韩国简历中排列经历·学历的一般顺序是？",
          options: ["由旧到新（过去→最近）", "最新顺（最近→过去）", "拼音/字母顺", "不分顺序随机"],
          answer: 1,
          explain: "经历·学历一般按最近的在上的倒序（最新顺）排列。"
        },
        {
          question: "在简历中更有说服力地表达成果的方法是？",
          options: ["以‘努力做了’这样情感为主", "以‘销售额提升20%’这样具体数字", "尽量又长又华丽", "多放表情符号"],
          answer: 1,
          explain: "有具体数字·结果时，说服力会强得多。"
        },
        {
          question: "简历中最好不要放的信息是？",
          options: ["姓名和联系方式", "所会语言及水平", "身份证号等过度敏感信息", "与应聘岗位相关的经历"],
          answer: 2,
          explain: "像身份证号这样超出必要的敏感信息，最好不要放。"
        },
        {
          question: "留学生在简历中尤其应发挥的优势是？",
          options: ["华丽的简历设计", "所会语言·全球经历", "尽量多的无关经历", "很长的篇幅"],
          answer: 1,
          explain: "多语言·全球经历是留学生的巨大武器。请与岗位优势相连接。"
        }
      ]
    },
    vi: {
      id: "w2s4",
      emoji: "📄",
      title: "Phép tắc CV kiểu Hàn Quốc",
      intro:
        "Học chi tiết định dạng, cách viết CV Hàn Quốc và cả những lỗi cần tránh. Độ hoàn thiện của CV bạn làm tuần này sẽ tăng lên rõ rệt. Hãy tự kiểm tra bằng bài quiz ở cuối.",
      objectives: [
        "Biết cấu trúc và định dạng cơ bản của CV Hàn Quốc",
        "Hiểu cách xử lý ảnh và thông tin cá nhân",
        "Biết cách viết kinh nghiệm, thành tích một cách thuyết phục",
        "Có thể tránh những lỗi thường gặp trong CV"
      ],
      sections: [
        {
          heading: "1. Điều cơ bản của CV Hàn Quốc",
          emoji: "📋",
          summary: "Định dạng rất quan trọng trong CV Hàn Quốc. Hãy dựng khung cơ bản trước.",
          items: [
            { title: "CV và thư giới thiệu bản thân", body: "CV sắp xếp gọn 'thông tin sự thật' như học vấn, kinh nghiệm, kỹ năng theo dạng bảng, còn thư giới thiệu bản thân trình bày động cơ và năng lực như một 'câu chuyện'. Hai tài liệu có vai trò khác nhau nên ở Hàn thường nộp cùng nhau; để CV chỉ chứa sự thật và dành phần giải thích cho thư giới thiệu sẽ khiến mỗi thứ gọn gàng hơn.", example: "CV: '2023.03~2024.02 Quản lý sảnh Café OO'\nThư giới thiệu: 'Khi tiếp khách, tôi học được cách nhanh chóng tạo niềm tin cả với người mới gặp, và trải nghiệm này dẫn tôi đến sự quan tâm với công việc kinh doanh.'" },
            { title: "Độ dài phù hợp", body: "CV thường tốt nhất ở 1–2 trang, vì người phụ trách tuyển dụng không dành nhiều thời gian cho hồ sơ một người. Thay vì nhồi hết mọi kinh nghiệm, chọn lọc chỉ phần cốt lõi liên quan đến vị trí ứng tuyển và giữ gọn lại giúp thế mạnh hiện rõ hơn." },
            { title: "Sắp xếp theo thứ tự mới nhất", body: "Sắp xếp học vấn và kinh nghiệm theo thứ tự ngược (mới nhất trước), cái mới nhất ở trên. Vì người phụ trách đọc từ trên xuống để nắm 'người này hiện đang làm gì' trước, nên đặt kinh nghiệm gần hiện tại lên trên là tự nhiên.", tip: "Đặt kinh nghiệm liên quan gần đây phía trên công việc làm thêm cũ." },
            { title: "Định dạng nhất quán", body: "Thống nhất cách ghi ngày (VD: 2024.03), phông chữ, giãn dòng trong toàn tài liệu khiến nó gọn gàng và đáng tin hơn nhiều. Nếu lẫn lộn — chỗ '2024년 3월', chỗ '24/3' — dù nhỏ cũng có thể tạo ấn tượng thiếu cẩn thận, nên hãy đặt một quy tắc và giữ đến cuối." }
          ]
        },
        {
          heading: "2. Ảnh và thông tin cá nhân",
          emoji: "📸",
          summary: "Đây là phần tạo ấn tượng đầu tiên. Gọn gàng, đừng quá đà.",
          items: [
            { title: "Ảnh thẻ", body: "CV Hàn Quốc thường có ảnh thẻ gọn gàng, vì ảnh định đoạt ấn tượng đầu tiên. Ảnh với gương mặt tươi, trang phục chỉnh tề, nhìn thẳng là tốt, và dùng khổ ảnh thẻ/bán thân chụp ở tiệm ảnh là an toàn (về luật không bắt buộc).", tip: "Không ảnh tự sướng hay ảnh du lịch. Hãy chuẩn bị ảnh thẻ nhìn thẳng." },
            { title: "Thông tin cá nhân cơ bản", body: "Tên, số liên lạc, email là đủ. Vì người phụ trách chỉ cần cách liên lạc rõ ràng, không cần cố nhồi nhiều mục. Chỉ cần kiểm tra lại số liên lạc và email xem có lỗi chính tả không." },
            { title: "Cẩn thận với thông tin cá nhân", body: "Đừng đưa thông tin nhạy cảm không cần cho quyết định tuyển dụng như số đăng ký cư trú, quan hệ gia đình, hay địa chỉ nhà chính xác. Công ty sẽ yêu cầu riêng những thông tin này sau khi bạn được nhận, nên ở giai đoạn CV, để bảo vệ chính mình, viết tối thiểu là tốt hơn." },
            { title: "Địa chỉ email", body: "Địa chỉ email chẳng khác nào 'hồ sơ' đầu tiên người phụ trách nhìn thấy. Một ID đùa nghịch hay cũ kỹ có thể làm mờ ấn tượng, nên tạo một địa chỉ gọn gàng dựa trên tên trông chuyên nghiệp hơn nhiều.", example: "Xấu: cutie_dragon_99@...\nTốt: minji.kim.work@... (dựa trên tên + mục đích)" }
          ]
        },
        {
          heading: "3. Cách viết kinh nghiệm · thành tích",
          emoji: "✍️",
          summary: "Đây là cốt lõi của CV. Viết không phải 'đã làm gì' mà 'đã đạt thành quả gì'.",
          items: [
            { title: "Lấy sự thật · thành quả làm trung tâm", body: "Không phóng đại, viết cụ thể việc bạn thực sự làm và kết quả của nó. Vì người phụ trách nhìn 'người này có tạo được thành quả ở công ty chúng ta không' hơn là câu chữ hoa mỹ, nên nối vai trò bạn đảm nhận với điều nó cải thiện trong một dòng sẽ tạo niềm tin.", example: "Yếu: 'Tôi đã làm ở café.'\nMạnh: 'Tôi đảm nhận phục vụ sảnh và quản lý kho, giảm tỷ lệ hàng hủy và rút ngắn thời gian dọn dẹp cuối ca.'" },
            { title: "Diễn đạt bằng con số", body: "Khi có con số như 'tăng doanh thu 20%' hay 'quản lý 30 thành viên câu lạc bộ', thành quả hiện rõ ngay và thuyết phục hơn. Khi không biết con số chính xác, thêm cả quy mô ước lượng (khoảng 50 người, 3 tháng...) cũng đáng tin hơn nhiều so với diễn đạt mơ hồ.", tip: "Một dòng với con số · kết quả cụ thể mạnh hơn nhiều so với 'chăm chỉ' mơ hồ.", example: "Xấu: 'Tôi đã chăm chỉ vận hành SNS.'\nTốt: 'Tôi vận hành tài khoản Instagram trong 6 tháng, tăng người theo dõi từ 500 lên 2.000.'" },
            { title: "Liên quan đến công việc", body: "Đặt kinh nghiệm liên quan đến vị trí ứng tuyển lên trên và về phía trước. Vì người phụ trách trước tiên kiểm tra 'người này có hợp với vị trí chúng tôi tuyển không', nên cùng một kinh nghiệm sẽ đọc mạnh hơn nhiều khi bạn đưa phần nối với công việc mục tiêu lên trước." },
            { title: "Bắt đầu bằng động từ hành động", body: "Bắt đầu câu bằng động từ thể hiện hành động bạn dẫn dắt — như 'đã lên kế hoạch', 'đã phân tích', 'đã cải thiện' — làm rõ bạn đã làm gì. Đưa lên trước điều bạn chủ động làm, thay vì diễn đạt bị động như 'đã tham gia', 'đã hỗ trợ', tạo ấn tượng chủ động hơn nhiều.", example: "Yếu: 'Tôi đã tham gia dự án.'\nMạnh: 'Trong nhóm 5 người, tôi đảm nhận phân tích dữ liệu và đưa ra phương án cải thiện.'" }
          ]
        },
        {
          heading: "4. Những điều cần tránh trong CV",
          emoji: "🚫",
          summary: "Dù trông nhỏ, đó vẫn là điểm trừ. Nhất định kiểm tra trước khi nộp.",
          items: [
            { title: "Lỗi chính tả · câu vụng", body: "Lỗi chính tả hay câu vụng trong CV có thể tạo ấn tượng 'người thiếu cẩn thận', bất kể nội dung. Đọc to chậm rãi trước khi nộp bắt lỗi mà mắt bỏ sót tốt hơn nhiều, nên nhất định đọc to soát lại một lần ở cuối.", tip: "Xem lại sau một ngày sẽ dễ thấy lỗi hơn." },
            { title: "Thiết kế quá đà", body: "Màu sắc lòe loẹt hay nhiều loại phông tưởng bắt mắt nhưng lại khiến nội dung khó đọc. Ở môi trường tuyển dụng Hàn, bố cục gọn gàng chủ yếu đen trắng dễ đọc được coi là chuyên nghiệp hơn, nên hãy ưu tiên dễ đọc hơn thiết kế." },
            { title: "Liệt kê không liên quan", body: "Nhồi nhiều kinh nghiệm không liên quan đến công việc sẽ chôn vùi chính những kinh nghiệm cốt lõi bạn muốn thể hiện ở giữa chúng. Nếu coi mục tiêu là 'chọn và viết đúng thứ' thay vì 'viết thật nhiều', bạn sẽ dễ phán đoán nên bỏ gì hơn." },
            { title: "Diễn đạt không trang trọng", body: "Emoji, khẩu ngữ, từ viết tắt (VD: 'haha', 'cày bài') tuy thân thiện nhưng không hợp với CV — một tài liệu chính thức. Thống nhất bằng văn phong lịch sự sẽ truyền tải cùng nội dung một cách đáng tin hơn nhiều." }
          ]
        },
        {
          heading: "5. Mẹo CV cho du học sinh",
          emoji: "🌏",
          summary: "Cách lồng thế mạnh riêng của bạn vào CV.",
          items: [
            { title: "Nêu rõ khả năng ngôn ngữ", body: "Viết rõ các ngôn ngữ bạn dùng được và trình độ (cấp TOPIK, điểm tiếng Anh chính thức...). Khả năng đa ngôn ngữ là thế mạnh lớn riêng của ứng viên nước ngoài, nên thể hiện bằng chỉ số khách quan thay vì diễn đạt mơ hồ như 'được' sẽ thuyết phục hơn nhiều.", example: "Yếu: 'Tiếng Hàn được, tiếng Anh được'\nTốt: 'Tiếng Hàn (TOPIK cấp 5), tiếng Anh (giao tiếp công việc được), tiếng Việt (tiếng mẹ đẻ)'" },
            { title: "Tình trạng visa", body: "Khi cần, hãy nêu ngắn gọn loại visa hiện tại và khả năng làm việc. Vì một trong những điều công ty tò mò nhất khi tuyển là 'có làm được ngay không', nên nếu là visa được phép làm việc, ghi rõ giúp gỡ nỗi lo của người phụ trách từ trước.", tip: "So với loại visa · ngày hết hạn lưu trú, ghi rõ 'có được phép hoạt động làm việc không' hữu ích hơn cho người phụ trách." },
            { title: "Kinh nghiệm toàn cầu", body: "Đừng để trải nghiệm sống ở nước ngoài, dự án đa văn hóa, du học chỉ là nền, hãy nối chúng thành thế mạnh cho công việc mục tiêu. Ví dụ, kinh nghiệm hiểu thị trường nước ngoài hay hợp tác với người thuộc nhiều nền văn hóa được đọc như năng lực hấp dẫn với doanh nghiệp Hàn làm kinh doanh toàn cầu." },
            { title: "Rà soát cách diễn đạt tiếng Hàn", body: "Dù ngữ pháp đúng, vẫn có thể có cách diễn đạt mà người Hàn thấy vụng, nên tốt nhất nhờ đồng nghiệp hoặc cố vấn người Hàn xem lại CV đã hoàn thành một lần. Chỉ cần một cách diễn đạt nhỏ được mài giũa tự nhiên cũng nâng rõ độ hoàn thiện và độ tin cậy của cả CV.", tip: "Hãy tích cực dùng công cụ tạo CV và huấn luyện viên của chương trình này." }
          ]
        }
      ],
      quiz: [
        {
          question: "Thứ tự thông thường để sắp xếp kinh nghiệm · học vấn trên CV Hàn Quốc là gì?",
          options: ["Cũ trước (quá khứ → gần đây)", "Thứ tự ngược (gần đây → quá khứ)", "Thứ tự bảng chữ cái", "Ngẫu nhiên bất kể thứ tự"],
          answer: 1,
          explain: "Kinh nghiệm · học vấn thường được sắp theo thứ tự ngược (mới nhất trước) với cái mới nhất ở trên."
        },
        {
          question: "Cách diễn đạt thành tích thuyết phục hơn trên CV là?",
          options: ["Thiên về cảm xúc như 'đã làm chăm chỉ'", "Bằng con số cụ thể như 'tăng doanh thu 20%'", "Càng dài và hoa mỹ càng tốt", "Thêm thật nhiều emoji"],
          answer: 1,
          explain: "Con số và kết quả cụ thể khiến nó thuyết phục hơn nhiều."
        },
        {
          question: "Thông tin nào nên bỏ khỏi CV?",
          options: ["Tên và liên lạc", "Ngôn ngữ và trình độ", "Thông tin nhạy cảm quá mức như số đăng ký cư trú", "Kinh nghiệm liên quan công việc mục tiêu"],
          answer: 2,
          explain: "Tốt hơn là không đưa thông tin nhạy cảm quá mức cần thiết như số đăng ký cư trú."
        },
        {
          question: "Thế mạnh nào du học sinh nên đặc biệt làm nổi bật trên CV?",
          options: ["Thiết kế CV hoa mỹ", "Ngôn ngữ và kinh nghiệm toàn cầu", "Càng nhiều kinh nghiệm không liên quan càng tốt", "Độ dài lớn"],
          answer: 1,
          explain: "Kinh nghiệm đa ngôn ngữ · toàn cầu là vũ khí lớn của du học sinh. Hãy nối nó với thế mạnh công việc."
        }
      ]
    },
    ja: {
      id: "w2s4",
      emoji: "📄",
      title: "韓国式履歴書のマナー",
      intro:
        "韓国の履歴書の形式や書き方、避けるべきミスまで詳しく学びます。今週作る履歴書の完成度がぐっと上がります。最後のクイズで確認しましょう。",
      objectives: [
        "韓国の履歴書の基本構成と形式を知る",
        "写真・個人情報の扱い方を理解する",
        "経歴・成果を説得力をもって書く方法を知る",
        "履歴書でよくあるミスを避けられる"
      ],
      sections: [
        {
          heading: "1. 韓国の履歴書の基本",
          emoji: "📋",
          summary: "韓国の履歴書は形式が大切です。まず基本の枠を作りましょう。",
          items: [
            { title: "履歴書 vs 自己紹介書", body: "履歴書は学歴・経歴・スキルなど『事実情報』を表のように簡潔にまとめた文書で、自己紹介書は志望動機や能力を『ストーリー』として描く文章です。両者は役割が違うため韓国では通常一緒に提出します。履歴書には事実だけを載せ、説明は自己紹介書に回すと、それぞれがすっきりします。", example: "履歴書：『2023.03〜2024.02 OOカフェ ホールマネージャー』\n自己紹介書：『接客をしながら初対面の人とも素早く信頼を築く方法を学び、この経験が営業職への関心につながりました。』" },
            { title: "適切な分量", body: "履歴書は通常1〜2枚が適当です。採用担当者が一人の書類を見る時間は長くないからです。すべての経験を入れるより、志望職務に関連する核心だけを選んで簡潔にまとめると、かえって強みがよく見えます。" },
            { title: "新しい順に並べる", body: "学歴と経歴は最も新しいものを上にする逆順（新しい順）で並べます。担当者は上から読んで『今この人が何をしているのか』をまず把握するので、現在に近い経験ほど上に置くのが自然です。", tip: "古いアルバイトより最近の関連経験を上に配置しましょう。" },
            { title: "一貫した形式", body: "日付表記（例：2024.03）、フォント、行間を文書全体で統一すると、ずっと整って信頼できます。ある所は『2024年3月』、ある所は『24/3』のように混ざると、些細でも丁寧でない印象を与えかねないので、一つのルールを決めて最後まで守りましょう。" }
          ]
        },
        {
          heading: "2. 写真と個人情報",
          emoji: "📸",
          summary: "第一印象を作る部分です。過度でなく端正に。",
          items: [
            { title: "証明写真", body: "韓国の履歴書には端正な証明写真を入れる場合が多いです。写真が第一印象を左右するからです。明るい表情と清潔な服装で正面を向いた写真がよく、写真館で撮った証明写真・半身写真の規格を使うと無難です（法的に必須ではありません）。", tip: "自撮り・旅行写真は禁物。正面の証明写真を用意しましょう。" },
            { title: "基本的な個人情報", body: "名前、連絡先、メールくらいで十分です。担当者が連絡する手段さえ明確ならよいので、無理に多くの項目を埋めようとする必要はありません。連絡先とメールに誤字がないかだけ必ず再確認しましょう。" },
            { title: "個人情報に注意", body: "住民登録番号、家族関係、正確な自宅住所のように採用判断に必要のない機微な情報は入れません。こうした情報は実際の入社が確定した後に会社が別途求めるので、履歴書の段階では自分を守るためにも最小限だけ書くのがよいです。" },
            { title: "メールアドレス", body: "メールアドレスは担当者が最初に見るあなたの『プロフィール』も同然です。ふざけた、または古いIDは印象を曇らせかねないので、名前ベースの端正なアドレスを一つ新しく作って使うと、ずっとプロらしく見えます。", example: "悪い例：cutie_dragon_99@...\n良い例：minji.kim.work@...（名前＋用途ベース）" }
          ]
        },
        {
          heading: "3. 経歴・成果の書き方",
          emoji: "✍️",
          summary: "履歴書の核心です。『何をした』ではなく『どんな成果を出した』で書きましょう。",
          items: [
            { title: "事実・成果中心", body: "誇張せず、自分が実際にしたこととその結果を具体的に書きます。担当者は華やかな表現より『この人はうちの会社でも成果を出せるか』を見るので、担った役割とそれによって改善された点を一行でつなげると信頼が生まれます。", example: "弱い例：『カフェで働きました。』\n強い例：『ホールサービングと在庫管理を担い、廃棄率を下げ締め作業時間を短縮しました。』" },
            { title: "数字で表現", body: "『売上20%向上』『サークル員30名を管理』のように数値が入ると成果が一目で伝わり説得力が増します。正確な数字が分からないときは、おおよその規模（約50名、3か月など）でも一緒に書くと、漠然とした表現よりずっと信頼できます。", tip: "曖昧な『頑張った』より具体的な数字・結果一行がずっと強いです。", example: "悪い例：『SNSを頑張って運営しました。』\n良い例：『Instagramアカウントを6か月間運営し、フォロワーを500名から2,000名に増やしました。』" },
            { title: "職務との関連性", body: "志望職務に関連する経験を上・前に配置します。担当者は『この人が募集する職に合うか』をまず確認するので、同じ経験でも志望職務につながる部分を前に置くと、ずっと強く読まれます。" },
            { title: "行動動詞で始める", body: "『企画した・分析した・改善した』のように自分が主導した行動を表す動詞で文を始めると、何をしたかが明確に伝わります。『〜に参加した』『〜を手伝った』のような受動的な表現より、主体的にしたことを前に出すと、ずっと能動的な印象を与えます。", example: "弱い例：『プロジェクトに参加しました。』\n強い例：『5名のチームでデータ分析を担い、改善案を導き出しました。』" }
          ]
        },
        {
          heading: "4. 履歴書で避けるべきこと",
          emoji: "🚫",
          summary: "些細に見えても減点要因です。提出前に必ず点検しましょう。",
          items: [
            { title: "誤字・悪文", body: "履歴書の誤字や不自然な文は、内容に関係なく『丁寧でない人』という印象を与えかねません。提出前にゆっくり声に出して読むと、目だけで見て見逃したミスがずっとよく見つかるので、最後に一度は必ず声に出して見直しましょう。", tip: "一日おいて見直すとミスがよく見えます。" },
            { title: "過度なデザイン", body: "派手な色や複数の種類のフォントは目立ちそうで、かえって内容を読みにくくします。韓国の採用現場では、読みやすい白黒中心の整った構成のほうがプロらしく受け取られるので、デザインより可読性を優先しましょう。" },
            { title: "無関係な羅列", body: "職務と関係のない経験をたくさん入れると、本当に見せたい核心経験がその間に埋もれてしまいます。目標を『たくさん書く』ではなく『合うものを選んで書く』と考えると、何を削るべきか判断しやすくなります。" },
            { title: "非格式な表現", body: "絵文字、口語、略語（例：『www』『一夜漬け』）は親しみやすく見えても、公式文書である履歴書には合いません。丁寧な文語体で統一すると、同じ内容でもずっと信頼できるように伝わります。" }
          ]
        },
        {
          heading: "5. 留学生のための履歴書のコツ",
          emoji: "🌏",
          summary: "自分だけの強みを履歴書に溶け込ませる方法です。",
          items: [
            { title: "語学力を明記", body: "使える言語とその水準（TOPIK級、英語の公認スコアなど）をはっきり書きます。多言語能力は外国人応募者だけの大きな強みなので、『可能』のような曖昧な表現ではなく客観的な指標で見せるほうがずっと説得力があります。", example: "弱い例：『韓国語可能、英語可能』\n良い例：『韓国語（TOPIK5級）、英語（業務会話可能）、ベトナム語（母語）』" },
            { title: "ビザの状態", body: "必要な場合は現在のビザ種類と就労可否を簡単に明かします。会社が採用時に最も気になることの一つが『すぐに働けるか』なので、就労可能なビザなら明確に書いて、担当者の心配を前もって和らげるのがよいです。", tip: "ビザ種類・滞在満了日より『就労活動が可能か』を明確に書くほうが担当者に役立ちます。" },
            { title: "グローバル経験", body: "海外生活、多文化プロジェクト、留学経験を単なる背景で終わらせず、志望職務の強みとしてつなげましょう。例えば海外市場を理解したり多文化圏の人と協働した経験は、グローバル事業をする韓国企業にとって魅力的な力として読まれます。" },
            { title: "韓国語表現の点検", body: "文法は合っていても韓国人が見て不自然な表現があるかもしれないので、完成した履歴書は韓国人の同僚やメンターに一度チェックしてもらうのがよいです。小さな表現一つが自然に磨かれるだけで、履歴書全体の完成度と信頼感が目に見えて上がります。", tip: "このプログラムの履歴書ビルダーとコーチを積極的に活用しましょう。" }
          ]
        }
      ],
      quiz: [
        {
          question: "韓国の履歴書で経歴・学歴を並べる一般的な順序は？",
          options: ["古い順（昔→最近）", "新しい順（最近→昔）", "五十音順", "順序に関係なくランダム"],
          answer: 1,
          explain: "経歴・学歴は最も新しいものを上にする逆順（新しい順）が一般的です。"
        },
        {
          question: "履歴書で成果をより説得力をもって表現する方法は？",
          options: ["『頑張った』のように感情中心で", "『売上20%向上』のように具体的な数字で", "できるだけ長く華やかに", "絵文字をたくさん入れて"],
          answer: 1,
          explain: "具体的な数字・結果があると説得力がずっと増します。"
        },
        {
          question: "履歴書に入れないほうがよい情報は？",
          options: ["名前と連絡先", "使える言語と水準", "住民登録番号など過度な機微情報", "志望職務に関連する経歴"],
          answer: 2,
          explain: "住民登録番号のような必要以上の機微情報は入れないほうがよいです。"
        },
        {
          question: "留学生が履歴書で特に活かすとよい強みは？",
          options: ["華やかな履歴書デザイン", "使える言語・グローバル経験", "できるだけ多くの無関係な経験", "長い分量"],
          answer: 1,
          explain: "多言語・グローバル経験は留学生の大きな武器です。職務の強みとしてつなげましょう。"
        }
      ]
    },
    id: {
      id: "w2s4",
      emoji: "📄",
      title: "Etika Resume Gaya Korea",
      intro:
        "Pelajari secara rinci format dan cara menulis resume Korea, hingga kesalahan yang harus dihindari. Tingkat kesempurnaan resume yang kamu buat minggu ini akan meningkat tajam. Periksa dirimu dengan kuis di akhir.",
      objectives: [
        "Mengetahui struktur dan format dasar resume Korea",
        "Memahami cara menangani foto dan data pribadi",
        "Mengetahui cara menulis pengalaman dan pencapaian secara meyakinkan",
        "Dapat menghindari kesalahan resume yang umum"
      ],
      sections: [
        {
          heading: "1. Dasar-Dasar Resume Korea",
          emoji: "📋",
          summary: "Format itu penting dalam resume Korea. Mari susun kerangka dasarnya lebih dulu.",
          items: [
            { title: "Resume vs surat pengenalan diri", body: "Resume merangkum secara ringkas 'informasi faktual' seperti pendidikan, pengalaman, dan keahlian dalam bentuk tabel, sedangkan surat pengenalan diri menyampaikan motivasi dan kompetensi sebagai 'cerita'. Kedua dokumen berperan berbeda sehingga di Korea biasanya diserahkan bersama; menaruh hanya fakta di resume dan menyerahkan penjelasan ke surat pengenalan membuat masing-masing lebih rapi.", example: "Resume: '2023.03–2024.02 Manajer Lantai Café OO'\nSurat pengenalan: 'Saat melayani pelanggan, saya belajar cara cepat membangun kepercayaan bahkan dengan orang yang baru ditemui, dan pengalaman ini mengarahkan minat saya pada pekerjaan penjualan.'" },
            { title: "Panjang yang tepat", body: "Resume biasanya paling baik 1–2 halaman, karena penanggung jawab rekrutmen tak berlama-lama melihat berkas satu orang. Alih-alih menjejalkan semua pengalaman, memilih hanya poin inti yang terkait posisi yang dilamar dan menjaganya ringkas justru menampilkan kelebihanmu lebih baik." },
            { title: "Urutan terbaru dulu", body: "Susun pendidikan dan pengalaman dalam urutan terbalik (terbaru dulu), yang paling baru di atas. Karena penanggung jawab membaca dari atas untuk lebih dulu memahami 'orang ini sekarang melakukan apa', wajar menaruh pengalaman yang lebih dekat ke masa kini di atas.", tip: "Taruh pengalaman relevan terbaru di atas kerja paruh waktu lama." },
            { title: "Format yang konsisten", body: "Menyeragamkan penulisan tanggal (mis. 2024.03), font, dan spasi baris di seluruh dokumen membuatnya jauh lebih rapi dan terpercaya. Jika bercampur — di sini '2024년 3월', di sana '24/3' — meski kecil bisa memberi kesan kurang cermat, jadi tetapkan satu aturan dan pertahankan sampai akhir." }
          ]
        },
        {
          heading: "2. Foto dan Data Pribadi",
          emoji: "📸",
          summary: "Ini bagian yang membentuk kesan pertama. Rapi, jangan berlebihan.",
          items: [
            { title: "Pasfoto", body: "Resume Korea sering menyertakan pasfoto yang rapi, karena foto menentukan kesan pertama. Foto dengan ekspresi cerah, pakaian rapi, dan menghadap depan itu bagus, dan memakai ukuran pasfoto/setengah badan hasil studio itu aman (secara hukum tidak wajib).", tip: "Bukan swafoto atau foto liburan. Siapkan pasfoto menghadap depan." },
            { title: "Data pribadi dasar", body: "Nama, nomor kontak, dan email sudah cukup. Karena penanggung jawab hanya butuh cara jelas untuk menghubungimu, tak perlu memaksakan mengisi banyak kolom. Cukup periksa ulang nomor kontak dan email agar tak ada salah ketik." },
            { title: "Hati-hati dengan info pribadi", body: "Jangan sertakan informasi sensitif yang tak diperlukan untuk keputusan rekrutmen, seperti nomor registrasi penduduk, hubungan keluarga, atau alamat rumah persis. Perusahaan meminta informasi seperti itu secara terpisah setelah rekrutmenmu dipastikan, jadi pada tahap resume, demi melindungi diri, lebih baik menulis seminimal mungkin." },
            { title: "Alamat email", body: "Alamat email praktis menjadi 'profil' pertama yang dilihat penanggung jawab. ID yang jenaka atau usang bisa mengaburkan kesan, jadi membuat alamat baru yang rapi berbasis nama tampak jauh lebih profesional.", example: "Buruk: cutie_dragon_99@...\nBaik: minji.kim.work@... (berbasis nama + tujuan)" }
          ]
        },
        {
          heading: "3. Cara Menulis Pengalaman · Pencapaian",
          emoji: "✍️",
          summary: "Ini inti dari resume. Tulis bukan 'saya melakukan ini' tetapi 'saya mencapai ini'.",
          items: [
            { title: "Berpusat pada fakta · pencapaian", body: "Tanpa melebih-lebihkan, tulis secara konkret apa yang benar-benar kamu lakukan dan hasilnya. Karena penanggung jawab melihat 'apakah orang ini bisa menghasilkan di perusahaan kami juga' ketimbang kata-kata mencolok, menghubungkan peranmu dan bagaimana itu memperbaiki sesuatu dalam satu baris membangun kepercayaan.", example: "Lemah: 'Saya bekerja di café.'\nKuat: 'Saya menangani pelayanan lantai dan pengelolaan stok, menurunkan tingkat pemborosan dan memangkas waktu bersih-bersih tutup toko.'" },
            { title: "Ungkapkan dengan angka", body: "Ketika ada angka seperti 'meningkatkan penjualan 20%' atau 'mengelola 30 anggota klub', pencapaian langsung terlihat dan lebih meyakinkan. Saat tak tahu angka pasti, menambahkan skala perkiraan pun (sekitar 50 orang, 3 bulan, dll.) jauh lebih terpercaya ketimbang ungkapan samar.", tip: "Satu baris dengan angka · hasil konkret jauh lebih kuat daripada 'dengan giat' yang samar.", example: "Buruk: 'Saya menjalankan SNS dengan giat.'\nBaik: 'Saya menjalankan akun Instagram selama 6 bulan, menaikkan pengikut dari 500 menjadi 2.000.'" },
            { title: "Relevansi dengan pekerjaan", body: "Taruh pengalaman yang terkait posisi yang dilamar lebih ke atas dan ke depan. Karena penanggung jawab lebih dulu memeriksa 'apakah orang ini cocok dengan posisi yang kami rekrut', pengalaman yang sama pun terbaca jauh lebih kuat saat kamu menaruh bagian yang tersambung ke pekerjaan target di depan." },
            { title: "Mulai dengan kata kerja tindakan", body: "Memulai kalimat dengan kata kerja yang menunjukkan tindakan yang kamu pimpin — seperti 'merencanakan', 'menganalisis', 'memperbaiki' — memperjelas apa yang kamu lakukan. Mengedepankan hal yang kamu lakukan secara proaktif, ketimbang ungkapan pasif seperti 'ikut serta' atau 'membantu', memberi kesan jauh lebih aktif.", example: "Lemah: 'Saya ikut serta dalam proyek.'\nKuat: 'Di tim 5 orang, saya menangani analisis data dan merumuskan langkah perbaikan.'" }
          ]
        },
        {
          heading: "4. Hal yang Harus Dihindari dalam Resume",
          emoji: "🚫",
          summary: "Meski tampak kecil, itu poin pengurang. Pastikan memeriksa sebelum menyerahkan.",
          items: [
            { title: "Salah ketik · kalimat janggal", body: "Salah ketik atau kalimat janggal dalam resume bisa memberi kesan 'orang yang tidak cermat', terlepas dari isinya. Membaca lantang perlahan sebelum menyerahkan menangkap kesalahan yang terlewat oleh mata jauh lebih baik, jadi pastikan membaca lantang sekali di akhir.", tip: "Melihatnya lagi sehari kemudian membuat kesalahan lebih menonjol." },
            { title: "Desain berlebihan", body: "Warna mencolok atau banyak jenis font tampak menarik perhatian, tetapi justru membuat isi sulit dibaca. Di dunia rekrutmen Korea, tata letak rapi yang mudah dibaca dan didominasi hitam-putih dianggap lebih profesional, jadi utamakan keterbacaan ketimbang desain." },
            { title: "Daftar yang tidak relevan", body: "Menjejalkan pengalaman yang tak terkait pekerjaan justru mengubur pengalaman inti yang ingin kamu tunjukkan di antaranya. Jika kamu menganggap tujuannya 'memilih dan menulis hal yang tepat' ketimbang 'menulis banyak', menjadi lebih mudah menilai apa yang harus dibuang." },
            { title: "Ungkapan tidak formal", body: "Emoji, bahasa lisan, dan singkatan (mis. 'wkwk', 'sks') mungkin tampak akrab tetapi tak cocok untuk resume, sebuah dokumen resmi. Menyeragamkan dengan gaya tulisan yang sopan menyampaikan isi yang sama jauh lebih kredibel." }
          ]
        },
        {
          heading: "5. Tips Resume untuk Mahasiswa Internasional",
          emoji: "🌏",
          summary: "Cara menenun kelebihanmu sendiri ke dalam resume.",
          items: [
            { title: "Sebutkan kemampuan bahasa", body: "Tulis dengan jelas bahasa yang bisa kamu gunakan dan tingkatnya (level TOPIK, skor bahasa Inggris resmi, dll.). Kemampuan multibahasa adalah kelebihan besar khas pelamar asing, jadi menunjukkannya dengan indikator objektif ketimbang ungkapan samar seperti 'bisa' jauh lebih meyakinkan.", example: "Lemah: 'Bahasa Korea bisa, bahasa Inggris bisa'\nBaik: 'Bahasa Korea (TOPIK Level 5), bahasa Inggris (percakapan kerja bisa), bahasa Vietnam (bahasa ibu)'" },
            { title: "Status visa", body: "Bila perlu, sebutkan singkat jenis visa saat ini dan apakah kamu bisa bekerja. Karena salah satu yang paling ingin diketahui perusahaan saat merekrut adalah 'apakah kamu bisa langsung bekerja', jika visamu memungkinkan bekerja, menuliskannya dengan jelas membantu meredakan kekhawatiran penanggung jawab sejak awal.", tip: "Ketimbang jenis visa · tanggal habis masa tinggal, menuliskan dengan jelas 'apakah kamu boleh melakukan aktivitas kerja' lebih membantu penanggung jawab." },
            { title: "Pengalaman global", body: "Jangan biarkan pengalaman tinggal di luar negeri, proyek multikultural, atau studi ke luar negeri hanya sebagai latar — hubungkan sebagai kelebihan untuk pekerjaan target. Misalnya, pengalaman memahami pasar luar negeri atau berkolaborasi dengan orang lintas budaya terbaca sebagai kompetensi menarik bagi perusahaan Korea yang berbisnis global." },
            { title: "Periksa ungkapan bahasa Korea", body: "Meski tata bahasa benar, mungkin ada ungkapan yang tampak janggal bagi orang Korea, jadi baik meminta rekan atau mentor orang Korea meninjau resume yang sudah selesai satu kali. Hanya dengan satu ungkapan kecil dipoles secara alami pun, tingkat kesempurnaan dan kredibilitas seluruh resume meningkat nyata.", tip: "Manfaatkan secara aktif pembuat resume dan pelatih di program ini." }
          ]
        }
      ],
      quiz: [
        {
          question: "Urutan umum untuk menyusun pengalaman · pendidikan pada resume Korea adalah?",
          options: ["Terlama dulu (masa lalu → terbaru)", "Urutan terbalik (terbaru → masa lalu)", "Urutan abjad", "Acak tanpa memedulikan urutan"],
          answer: 1,
          explain: "Pengalaman · pendidikan biasanya disusun dalam urutan terbalik (terbaru dulu) dengan yang paling baru di atas."
        },
        {
          question: "Bagaimana mengungkapkan pencapaian secara lebih meyakinkan pada resume?",
          options: ["Berpusat pada emosi seperti 'saya bekerja keras'", "Dengan angka konkret seperti 'meningkatkan penjualan 20%'", "Sepanjang dan semencolok mungkin", "Dengan menambahkan banyak emoji"],
          answer: 1,
          explain: "Angka dan hasil konkret membuatnya jauh lebih meyakinkan."
        },
        {
          question: "Informasi mana yang lebih baik tidak dimasukkan ke resume?",
          options: ["Nama dan kontak", "Bahasa dan tingkatnya", "Info sensitif berlebihan seperti nomor registrasi penduduk", "Pengalaman terkait pekerjaan target"],
          answer: 2,
          explain: "Lebih baik tidak memasukkan info sensitif yang melebihi kebutuhan seperti nomor registrasi penduduk."
        },
        {
          question: "Kelebihan apa yang sebaiknya ditonjolkan mahasiswa internasional pada resume?",
          options: ["Desain resume yang mencolok", "Bahasa · pengalaman global", "Sebanyak mungkin pengalaman tidak relevan", "Panjang yang besar"],
          answer: 1,
          explain: "Pengalaman multibahasa · global adalah senjata besar mahasiswa internasional. Hubungkan dengan kelebihan pekerjaan."
        }
      ]
    }
  },
  w3s4: {
    en: {
      id: "w3s4",
      emoji: "✉️",
      title: "Business Communication Etiquette",
      intro:
        "Learn in detail the communication etiquette of Korean workplaces — honorifics, email, replies, and how to make requests. These are the fundamentals that earn trust anywhere. Check yourself with the quiz at the end.",
      objectives: [
        "Know how to use honorifics and forms of address at work",
        "Understand business email and messenger etiquette",
        "Master polite ways to request, decline, and apologize",
        "Know the communication manners for meetings and reporting"
      ],
      sections: [
        {
          heading: "1. Forms of Address and Honorifics",
          emoji: "🗣️",
          summary: "This is the start of communication. How you address someone shows your attitude.",
          items: [
            { title: "Address etiquette", body: "At Korean workplaces, you add '-nim' after a name or use a rank like 'team lead-nim' or 'assistant manager-nim' when addressing someone. Calling by name alone or using 'you' feels rude, so when you don't know the rank, '○○-nim' is safest.", example: "'Kim Min-su-nim, may I ask you something briefly?'\n'Park team-lead-nim, please check the materials.'" },
            { title: "Honorifics are the default", body: "At the company, you use honorifics by default regardless of rank or age. Honorifics are a signal of respecting the other person, so even after growing close, it's good to keep the courtesy in public settings like meetings or emails. Even if you've relaxed in private settings, returning to honorifics in work situations is natural." },
            { title: "Humbling yourself", body: "Korean has humble expressions that lower yourself to elevate the other person. Using 'jeo' instead of 'na', and '~hagesseumnida' instead of 'haesseoyo', gives a humble, polite impression. Such expressions especially build trust when dealing with superiors or clients.", example: "'I'll organize it and report to you by the end of today.'" },
            { title: "No pressure over honorifics", body: "Korean honorifics are complex, and even native speakers get confused sometimes. So it's okay if it isn't perfect, and an attitude of trying to be polite matters far more than grammar. Small mistakes are mostly understood, so don't shrink too much — focus on keeping a polite tone.", tip: "When confused, keeping honorifics with '~nim, ~hasimnida' works fine." }
          ]
        },
        {
          heading: "2. Email Etiquette",
          emoji: "✉️",
          summary: "Business emails have a format. Once you learn the frame, it isn't hard.",
          items: [
            { title: "A clear subject line", body: "Write it so the recipient knows the purpose just from the subject. For office workers who receive dozens of emails a day, a clear subject is a big courtesy. Putting your team or project name in brackets at the front makes it stand out at a glance.", tip: "Write it so the purpose is clear from the subject alone.", example: "Good: '[Marketing Team] June campaign meeting schedule inquiry'\nWeak: 'Hello' or 'An inquiry'" },
            { title: "Basic structure", body: "A business email is basically written in the order: greeting → your team/name → purpose → polite closing. Once you learn this frame, you can write a polite email without mistakes in any situation. If it's someone you're contacting for the first time, adding a one-line self-introduction is even kinder.", example: "Subject: [Design Team] Request to review logo draft\n\nHello, team lead-nim.\nThis is Lee Han-na from the Design Team.\n\nI'm attaching the logo draft we discussed last week.\nCould you review it by Friday?\n\nThank you.\nLee Han-na" },
            { title: "Keep it concise", body: "It's good to put the purpose at the front of the email and write sentences short and clear. That's because a busy recipient can quickly grasp the point. If there are several things to convey, dividing them into numbers or items makes it much easier to read.", example: "'Please confirm the two items below.\n1. Whether the budget is approved\n2. Available meeting times'" },
            { title: "Closing and signature", body: "At the end of the email, add a polite greeting like 'Thank you,' and attach a signature with your name, team, and contact. With a signature, the recipient immediately knows who to contact and how, building trust. If there's a company signature template, using it as-is is safe." }
          ]
        },
        {
          heading: "3. Fast and Polite Responses",
          emoji: "⏱️",
          summary: "'When and how you reply' builds trust.",
          items: [
            { title: "Quick replies", body: "When you receive an email or message, replying within a day (24 hours) if possible is courtesy. A quick reply is a signal that 'I'm on top of your matter,' which reassures the other person. Even if you can't reach a conclusion right away, get into the habit of first sending a short reply like 'Got it, confirmed.'" },
            { title: "Give a heads-up when delayed", body: "If a reply will take time, don't wait until the result is ready — tell them first by when you'll respond. The other person finds an expected timeline far more comfortable than silence. Giving a deadline can make you seem responsible.", tip: "A single 'Got it, confirmed' is far more reassuring than silence.", example: "'I've confirmed what you mentioned. I'll reply by Wednesday after discussing with the relevant department.'" },
            { title: "Messenger reactions", body: "On the company messenger, it's good to leave even a brief reaction once you've read a message. If there's no reaction after reading, the other person feels anxious not knowing if it went through. If you can't reply right away, leaving even 'Yes, confirmed' or a single emoji smooths communication." },
            { title: "Respect working hours", body: "Late at night or on weekends, refraining from work contact unless truly urgent is courtesy. It's consideration that respects the other person's rest time. If an idea comes to you late at night, you can schedule the email or send it the next working morning." }
          ]
        },
        {
          heading: "4. Requests, Refusals, and Apologies",
          emoji: "🤝",
          summary: "Euphemistic yet clear. This is the heart of Korean-style communication.",
          items: [
            { title: "Polite requests", body: "When asking for something, use a soft expression that considers the other person's situation rather than a commanding tone. Leaving room with 'Would it perhaps be possible?' rather than 'Please do it' makes it easier for the other person to agree without pressure. For a busy person, adding the deadline and reason together is even more polite.", example: "'I'm sorry to bother you when you're busy, but could you possibly review it by tomorrow?'\n'It may be a bother, but could I ask you to share the materials?'" },
            { title: "Euphemistic refusals", body: "In Korea, rather than flatly saying 'No,' declining euphemistically with a reason is more natural. A blunt refusal can make the relationship awkward. Instead, suggesting a possible alternative conveys the refusal much more softly.", example: "'Thank you for the offer. However, this week I have overlapping deadlines so it may be a bit hard. If it's next week, I can help.'" },
            { title: "A quick apology", body: "When you make a mistake, quickly admitting it and correcting it, rather than hiding or making excuses, actually earns trust. Honestly reporting the problem and offering a solution together looks professional. When apologizing, it's good to say concretely what you'll fix and how.", tip: "'I'm sorry, I'll correct it like this' is more professional than excuses.", example: "'I attached the wrong file. I'm sorry. I'll resend the corrected version right away.'" },
            { title: "Expressing gratitude", body: "When you receive help, be sure to express thanks even for a small thing. Expressing gratitude smooths relationships and makes people happy to help again next time. Beyond saying it on the spot, thanking once more by message later leaves a lasting impression." }
          ]
        },
        {
          heading: "5. Meeting and Reporting Manners",
          emoji: "📊",
          summary: "This is communication when working as a team.",
          items: [
            { title: "Interim reporting", body: "Rather than reporting only after a task is finished, sharing progress along the way first earns trust. It's because a supervisor can feel at ease only knowing whether things are flowing well. When a problem arises, informing early lets you respond quickly together." },
            { title: "State the conclusion first", body: "At Korean workplaces, people prefer stating the conclusion first and adding reasons afterward when reporting or speaking. It's because a busy person can grasp the point quickly. A long preamble can feel stifling, so build a habit of leading with the main point.", tip: "Try speaking in the order 'The conclusion is A. The reason is…'", example: "'To state the conclusion first, the schedule can proceed as planned. The reason is that all necessary materials are secured.'" },
            { title: "Listening", body: "In a meeting, an attitude of listening to the end without cutting the other person off matters. Interrupting looks rude and you may miss good ideas. If you have a question or a different opinion, it's good to bring it up politely after the other person finishes." },
            { title: "The habit of taking notes", body: "Taking notes of key points during a meeting gives a diligent, focused impression. You can also review the content later, reducing mistakes. Writing down assigned tasks or deadlines on the spot in particular keeps you from missing them." }
          ]
        }
      ],
      quiz: [
        {
          question: "What is a good subject line for a business email?",
          options: ["An unclear 'Hello'", "'[Project] meeting schedule inquiry' where the purpose is immediately clear", "Sending with no subject", "Expressing only with emojis"],
          answer: 1,
          explain: "It's good to write it clearly so the purpose is clear from the subject alone."
        },
        {
          question: "What's the desirable attitude when a reply will be delayed?",
          options: ["Say nothing until everything is ready", "Tell them first 'I'll reply by such-and-such after confirming'", "Just ignore it", "Call right away even late at night"],
          answer: 1,
          explain: "A single 'I've confirmed and will reply by such-and-such' builds more trust than silence."
        },
        {
          question: "What's a natural Korean-style expression when declining a request?",
          options: ["'No way'", "'It may be a bit hard'", "'Why me?'", "Not answering"],
          answer: 1,
          explain: "Declining euphemistically but clearly, with a reason added, is natural."
        },
        {
          question: "What's the desirable attitude when you make a mistake at work?",
          options: ["Make a long excuse", "Admit it quickly and correct it", "Hide it", "Blame others"],
          answer: 1,
          explain: "A quick apology and a corrective attitude actually earn trust."
        }
      ]
    },
    "zh-CN": {
      id: "w3s4",
      emoji: "✉️",
      title: "商务沟通礼仪",
      intro:
        "详细学习韩国职场的沟通礼仪——敬语、邮件、回复、请求礼仪等。这是在任何地方都能赢得信任的基本功。最后用测验检验自己。",
      objectives: [
        "了解职场中敬语·称呼的用法",
        "理解商务邮件·即时通讯礼仪",
        "掌握礼貌地请求·拒绝·道歉的表达",
        "了解会议·汇报中的沟通礼仪"
      ],
      sections: [
        {
          heading: "1. 称呼与敬语",
          emoji: "🗣️",
          summary: "这是沟通的开端。如何称呼对方，体现你的态度。",
          items: [
            { title: "称呼礼仪", body: "在韩国职场，称呼对方时在名字后加‘님’，或用‘组长님·代理님’这样的职级来称呼。只叫名字或用‘你·您’会显得无礼，因此不知道职级时，‘○○님’最稳妥。", example: "‘金敏秀님，可以简单请教一下吗？’\n‘朴组长님，麻烦确认一下资料。’" },
            { title: "敬语是基本", body: "在公司，无论职级或年龄，基本都使用敬语。敬语是尊重对方的信号，因此即使熟络之后，在会议或邮件等公开场合也应保持礼节。私下变熟了，工作场合再回到敬语也很自然。" },
            { title: "谦称自己的表达", body: "韩语中有把自己放低以抬高对方的谦让表达。用‘저’代替‘나’、用‘~하겠습니다’代替‘했어요’，会给人谦逊而郑重的印象。这类表达在面对上司或客户时尤能提升信任感。", example: "‘我会在今天之内整理好向您汇报。’" },
            { title: "敬语不必有负担", body: "韩语敬语复杂，连母语者有时也会犯迷糊。所以不完美也没关系，比起语法，想要礼貌的态度更重要。小失误大多会被理解，因此不必过分拘谨，专注于保持郑重的语气即可。", tip: "犯迷糊时，用‘~님，~하십니다’保持敬语就很稳妥。" }
          ]
        },
        {
          heading: "2. 邮件礼仪",
          emoji: "✉️",
          summary: "商务邮件有其格式。掌握框架就不难。",
          items: [
            { title: "明确的标题", body: "要写得让收件人仅看标题就知道是什么事。对每天收到几十封邮件的职场人来说，明确的标题是极大的体贴。把所属或项目名用方括号放在前面，一眼就能区分。", tip: "写得仅看标题就知道事由。", example: "好的例子：‘[市场部]6月活动会议日程咨询’\n欠妥的例子：‘您好’或‘咨询一下’" },
            { title: "基本结构", body: "商务邮件的基本顺序是 问候 → 所属·姓名 → 事由 → 郑重的结束语。掌握这个框架，任何情况下都能不出错地写出郑重的邮件。若是初次联系的对象，加一句自我介绍会更亲切。", example: "标题：[设计部]标志方案确认请求\n\n您好，组长님。\n我是设计部的李汉娜。\n\n附上上周讨论的标志方案。\n可否请您在周五前确认？\n\n谢谢。\n李汉娜 敬上" },
            { title: "简洁", body: "最好把事由放在邮件前部，句子写得简短明确。因为忙碌的对方能快速抓住要点。若要传达的内容有多项，用编号或条目分开整理会更易读。", example: "‘请确认以下两项。\n1. 预算是否批准\n2. 可开会的时间’" },
            { title: "结束语·签名", body: "邮件末尾加上‘谢谢。’这样郑重的问候，并附上含姓名·所属·联系方式的签名。有签名，对方就能立刻知道该联系谁、怎么联系，从而积累信任。若有公司签名模板，直接使用较为稳妥。" }
          ]
        },
        {
          heading: "3. 快速而郑重的回应",
          emoji: "⏱️",
          summary: "‘何时、如何回复’造就信任。",
          items: [
            { title: "快速回信", body: "收到邮件或消息，尽可能在一天（24小时）内回复是礼貌。快速回信是‘我在关注你的事’的信号，能让对方安心。即便当下无法给出结论，也养成先回一句‘已确认’的习惯。" },
            { title: "会延迟时提前告知", body: "若答复需要时间，别等到有结果，而要先告知何时能回复。相较于沉默，对方对预计时间会安心得多。定个期限告知，能给人有责任感的印象。", tip: "比起沉默，一句‘已确认’更让人安心。", example: "‘您说的内容已确认。与相关部门商讨后，我会在周三前答复。’" },
            { title: "即时通讯的反应", body: "在公司内部通讯里，读了消息就最好哪怕简短地留个反应。若读了却毫无反应，对方会因不知是否送达而不安。若难以立即答复，留一句‘好的，已确认’或一个表情符号，也能让沟通更顺畅。" },
            { title: "尊重工作时间", body: "深夜或周末，若非真的急事，避免工作联系是礼貌。这是尊重对方休息时间的体贴。若深夜想到点子，可把邮件预约发送，或在下一个工作日早上再发。" }
          ]
        },
        {
          heading: "4. 请求·拒绝·道歉的表达",
          emoji: "🤝",
          summary: "委婉却分明。这是韩式沟通的核心。",
          items: [
            { title: "礼貌的请求", body: "拜托某事时，用体谅对方处境的柔和表达，而非命令口吻。比起‘请做’，用‘不知是否方便呢？’留有余地，对方更易无负担地应允。对忙碌的对方，一并告知期限和原因会更礼貌。", example: "‘您很忙不好意思，不知能否请您在明天前审阅一下呢？’\n‘可能有点麻烦，能否请您共享一下资料？’" },
            { title: "委婉的拒绝", body: "在韩国，比起断然说‘不行’，附上理由委婉拒绝更自然。直白的拒绝可能让关系变尴尬。相反，一并提出可行的替代方案，拒绝会传达得柔和得多。", example: "‘感谢您的提议。只是这周截止日期撞在一起，恐怕有些困难。如果是下周，我可以帮忙。’" },
            { title: "迅速道歉", body: "出错时，比起隐瞒或辩解，迅速承认并纠正的态度反而赢得信任。坦诚告知问题并一并提出解决方案，会显得专业。道歉时，最好具体说明将纠正什么、如何纠正。", tip: "比起辩解，‘对不起，我这就纠正’更显专业。", example: "‘我附错了文件，对不起。我马上重新发送修改版。’" },
            { title: "感谢的表达", body: "得到帮助时，哪怕小事也务必表达感谢。感谢的表达能使关系融洽，也让人下次乐于再帮忙。当场口头表达自不必说，事后再用消息道谢一次，印象会更持久。" }
          ]
        },
        {
          heading: "5. 会议·汇报礼仪",
          emoji: "📊",
          summary: "这是以团队协作时的沟通。",
          items: [
            { title: "中间汇报", body: "别只在事情全部结束后才汇报，途中先共享进展会赢得信任。因为上司只有知道事情是否顺利才能安心。出问题时，及早告知，也能一起迅速应对。" },
            { title: "先说结论", body: "在韩国职场，汇报或发言时偏好先说结论、再补理由的方式。因为忙碌的对方能快速抓住要点。铺垫太长会让人觉得憋闷，因此养成先抛要点的习惯。", tip: "试着按‘结论是A。理由是…’的顺序说。", example: "‘先说结论，日程可以按计划推进。理由是所需资料已全部到位。’" },
            { title: "倾听", body: "在会议中，不打断对方、听到最后的态度很重要。抢话会显得无礼，也可能错过好点子。若有疑问或不同意见，最好等对方说完后再礼貌提出。" },
            { title: "记笔记的习惯", body: "会议中记下要点会给人认真专注的印象。日后还能再确认内容，减少失误。尤其把受托的事项或截止期限当场记下，就不会遗漏。" }
          ]
        }
      ],
      quiz: [
        {
          question: "商务邮件中好的标题是？",
          options: ["看不出内容的‘您好’", "事由一目了然的‘[项目]会议日程咨询’", "不写标题就发", "只用表情符号表达"],
          answer: 1,
          explain: "写得仅看标题就知道事由为好。"
        },
        {
          question: "答复可能会延迟时，应有的态度是？",
          options: ["直到全部准备好都不吭声", "先告知‘确认后何时答复’", "干脆无视", "深夜也马上打电话"],
          answer: 1,
          explain: "比起沉默，一句‘已确认并将于何时答复’更能带来信任。"
        },
        {
          question: "拒绝请求时，符合韩式的自然表达是？",
          options: ["‘不要’", "‘恐怕有些困难’", "‘为什么找我？’", "不作答"],
          answer: 1,
          explain: "委婉却分明、附上理由拒绝才自然。"
        },
        {
          question: "工作中出错时，应有的态度是？",
          options: ["长篇辩解", "迅速承认并纠正", "隐瞒", "怪别人"],
          answer: 1,
          explain: "迅速道歉并纠正的态度反而赢得信任。"
        }
      ]
    },
    vi: {
      id: "w3s4",
      emoji: "✉️",
      title: "Phép tắc giao tiếp trong công việc",
      intro:
        "Học chi tiết phép tắc giao tiếp nơi công sở Hàn Quốc — kính ngữ, email, phản hồi, phép nhờ vả. Đây là nền tảng giúp bạn được tin cậy ở bất cứ đâu. Hãy tự kiểm tra bằng bài quiz ở cuối.",
      objectives: [
        "Biết cách dùng kính ngữ · cách xưng hô ở nơi làm việc",
        "Hiểu phép tắc email · tin nhắn công việc",
        "Thành thạo cách nhờ vả · từ chối · xin lỗi một cách lịch sự",
        "Biết phép tắc giao tiếp trong họp · báo cáo"
      ],
      sections: [
        {
          heading: "1. Cách xưng hô và kính ngữ",
          emoji: "🗣️",
          summary: "Đây là khởi đầu của giao tiếp. Cách bạn gọi đối phương thể hiện thái độ của bạn.",
          items: [
            { title: "Phép xưng hô", body: "Ở công sở Hàn, khi gọi đối phương bạn thêm '-nim' sau tên hoặc dùng chức vụ như 'trưởng nhóm-nim', 'phó phòng-nim'. Gọi trống tên hay dùng 'cậu · ông/bà' nghe bất lịch sự, nên khi không biết chức vụ, '○○-nim' là an toàn nhất.", example: "'Kim Min-su-nim, em hỏi một chút được không ạ?'\n'Trưởng nhóm Park-nim, nhờ anh/chị kiểm tra tài liệu.'" },
            { title: "Kính ngữ là mặc định", body: "Ở công ty, bất kể chức vụ hay tuổi tác, mặc định dùng kính ngữ. Kính ngữ là tín hiệu tôn trọng đối phương, nên ngay cả khi đã thân, tốt nhất giữ phép lịch sự ở nơi công cộng như họp hay email. Dù đã thoải mái trong chỗ riêng tư, quay lại kính ngữ trong tình huống công việc là tự nhiên." },
            { title: "Cách nói hạ mình", body: "Tiếng Hàn có cách nói khiêm nhường, hạ mình xuống để nâng đối phương lên. Dùng 'jeo' thay 'na', '~hagesseumnida' thay 'haesseoyo' tạo ấn tượng khiêm tốn, lịch sự. Những cách nói này đặc biệt tạo niềm tin khi tiếp cấp trên hay khách hàng.", example: "'Em sẽ sắp xếp và báo cáo với anh/chị trong hôm nay.'" },
            { title: "Đừng áp lực về kính ngữ", body: "Kính ngữ tiếng Hàn phức tạp, ngay người bản xứ cũng đôi khi lúng túng. Nên chưa hoàn hảo cũng không sao, thái độ muốn lịch sự quan trọng hơn ngữ pháp nhiều. Lỗi nhỏ phần lớn được thông cảm, nên đừng co rúm quá — hãy tập trung giữ giọng điệu lịch sự.", tip: "Khi lúng túng, giữ kính ngữ bằng '~nim, ~hasimnida' là ổn." }
          ]
        },
        {
          heading: "2. Phép tắc email",
          emoji: "✉️",
          summary: "Email công việc có định dạng. Học được khung là không khó.",
          items: [
            { title: "Tiêu đề rõ ràng", body: "Viết sao cho người nhận biết mục đích chỉ qua tiêu đề. Với dân văn phòng nhận hàng chục email mỗi ngày, tiêu đề rõ ràng là sự chu đáo lớn. Đặt tên đội hay dự án trong ngoặc vuông ở đầu giúp phân biệt trong nháy mắt.", tip: "Viết sao cho mục đích rõ ràng chỉ qua tiêu đề.", example: "Tốt: '[Đội Marketing] Hỏi lịch họp chiến dịch tháng 6'\nYếu: 'Xin chào' hoặc 'Xin hỏi'" },
            { title: "Cấu trúc cơ bản", body: "Email công việc về cơ bản viết theo thứ tự: chào hỏi → đội/tên bạn → mục đích → lời kết lịch sự. Học được khung này, bạn có thể viết email lịch sự không lỗi trong mọi tình huống. Nếu là người liên hệ lần đầu, thêm một dòng tự giới thiệu còn ân cần hơn.", example: "Tiêu đề: [Đội Thiết kế] Đề nghị duyệt bản logo\n\nXin chào, trưởng nhóm-nim.\nEm là Lee Han-na, Đội Thiết kế.\n\nEm đính kèm bản logo đã bàn tuần trước.\nAnh/chị duyệt giúp trước thứ Sáu được không ạ?\n\nEm cảm ơn.\nLee Han-na" },
            { title: "Ngắn gọn", body: "Nên đặt mục đích ở đầu email và viết câu ngắn, rõ. Vì người nhận bận rộn có thể nắm ý nhanh. Nếu có nhiều nội dung cần truyền đạt, chia thành số hay mục sẽ dễ đọc hơn nhiều.", example: "'Nhờ anh/chị xác nhận hai mục dưới đây.\n1. Ngân sách đã duyệt chưa\n2. Thời gian có thể họp'" },
            { title: "Lời kết · chữ ký", body: "Cuối email, thêm lời chào lịch sự như 'Em cảm ơn' và đính chữ ký gồm tên · đội · liên lạc. Có chữ ký, người nhận biết ngay liên hệ ai, thế nào, tạo niềm tin. Nếu công ty có mẫu chữ ký, dùng nguyên là an toàn." }
          ]
        },
        {
          heading: "3. Phản hồi nhanh và lịch sự",
          emoji: "⏱️",
          summary: "'Trả lời khi nào, thế nào' tạo nên niềm tin.",
          items: [
            { title: "Hồi âm nhanh", body: "Khi nhận email hay tin nhắn, trả lời trong một ngày (24 giờ) nếu có thể là phép lịch sự. Hồi âm nhanh là tín hiệu 'tôi đang lo việc của bạn', khiến đối phương yên tâm. Dù chưa có kết luận ngay, hãy tập thói quen gửi trước một câu ngắn 'Đã xác nhận'." },
            { title: "Báo trước khi bị trễ", body: "Nếu trả lời cần thời gian, đừng đợi có kết quả — hãy báo trước khi nào sẽ phản hồi. Đối phương thấy mốc thời gian dự kiến dễ chịu hơn nhiều so với im lặng. Đặt hạn và báo giúp bạn có vẻ trách nhiệm.", tip: "Một câu 'Đã xác nhận' còn khiến yên tâm hơn nhiều so với im lặng.", example: "'Em đã xác nhận nội dung anh/chị nói. Sau khi bàn với bộ phận liên quan, em sẽ phản hồi trước thứ Tư.'" },
            { title: "Phản ứng trên tin nhắn", body: "Trên tin nhắn nội bộ công ty, đọc tin xong tốt nhất để lại phản ứng dù ngắn. Nếu đọc mà không phản ứng gì, đối phương lo lắng vì không biết tin có đến không. Nếu khó trả lời ngay, để lại 'Vâng, em đã xác nhận' hay một emoji cũng làm giao tiếp mượt hơn." },
            { title: "Tôn trọng giờ làm việc", body: "Khuya hay cuối tuần, trừ việc thực sự gấp, kiêng liên hệ công việc là phép lịch sự. Đó là sự cân nhắc tôn trọng thời gian nghỉ của đối phương. Nếu nảy ý tưởng lúc khuya, bạn có thể hẹn giờ gửi email hoặc gửi vào sáng ngày làm việc kế tiếp." }
          ]
        },
        {
          heading: "4. Cách nhờ vả · từ chối · xin lỗi",
          emoji: "🤝",
          summary: "Uyển chuyển mà rõ ràng. Đây là cốt lõi của giao tiếp kiểu Hàn.",
          items: [
            { title: "Nhờ vả lịch sự", body: "Khi nhờ điều gì, hãy dùng cách nói mềm mại cân nhắc hoàn cảnh đối phương thay vì giọng ra lệnh. Để chừa khoảng như 'Không biết có thể được không ạ?' thay vì 'Làm giúp đi' khiến đối phương dễ đồng ý mà không áp lực. Với người bận, báo kèm hạn và lý do còn lịch sự hơn.", example: "'Anh/chị bận em ngại quá, nhưng không biết anh/chị có thể xem giúp trước ngày mai không ạ?'\n'Có thể hơi phiền, nhưng nhờ anh/chị chia sẻ tài liệu được không ạ?'" },
            { title: "Từ chối uyển chuyển", body: "Ở Hàn, thay vì nói cụt 'Không được', từ chối uyển chuyển kèm lý do tự nhiên hơn. Từ chối thẳng thừng có thể làm quan hệ ngượng ngập. Thay vào đó, đề xuất một phương án khả dĩ khiến lời từ chối được truyền đạt mềm mại hơn nhiều.", example: "'Cảm ơn đề nghị của anh/chị. Chỉ là tuần này các hạn chót chồng nhau nên có lẽ hơi khó. Nếu tuần sau thì em giúp được ạ.'" },
            { title: "Xin lỗi nhanh", body: "Khi mắc lỗi, nhanh chóng thừa nhận và sửa, thay vì che giấu hay biện minh, lại tạo niềm tin. Báo cáo trung thực vấn đề và đề xuất giải pháp kèm theo trông chuyên nghiệp. Khi xin lỗi, nên nói cụ thể sẽ sửa gì và sửa thế nào.", tip: "'Em xin lỗi, em sẽ sửa như thế này' chuyên nghiệp hơn biện minh.", example: "'Em đính nhầm tệp. Em xin lỗi. Em sẽ gửi lại bản đã sửa ngay ạ.'" },
            { title: "Bày tỏ cảm ơn", body: "Khi được giúp, nhất định bày tỏ cảm ơn dù là việc nhỏ. Bày tỏ cảm ơn làm quan hệ êm đẹp và khiến người ta vui lòng giúp lần sau. Ngoài nói tại chỗ, cảm ơn thêm một lần qua tin nhắn sau đó để lại ấn tượng lâu dài." }
          ]
        },
        {
          heading: "5. Phép tắc họp · báo cáo",
          emoji: "📊",
          summary: "Đây là giao tiếp khi làm việc theo nhóm.",
          items: [
            { title: "Báo cáo giữa chừng", body: "Thay vì chỉ báo cáo sau khi việc xong, chia sẻ tiến độ dọc đường trước sẽ được tin cậy. Vì cấp trên chỉ yên tâm khi biết việc có trôi chảy không. Khi có vấn đề, báo sớm giúp cùng nhau ứng phó nhanh." },
            { title: "Nói kết luận trước", body: "Ở công sở Hàn, khi báo cáo hay phát biểu, người ta thích nói kết luận trước rồi thêm lý do sau. Vì người bận có thể nắm ý nhanh. Mở đầu dài dễ khiến bức bối, nên hãy tập thói quen mở đầu bằng ý chính.", tip: "Thử nói theo thứ tự 'Kết luận là A. Lý do là…'", example: "'Nói kết luận trước, lịch trình có thể tiến hành như dự kiến. Lý do là mọi tài liệu cần thiết đã được đảm bảo.'" },
            { title: "Lắng nghe", body: "Trong họp, thái độ nghe đến hết mà không ngắt lời đối phương rất quan trọng. Cắt ngang trông bất lịch sự và có thể bỏ lỡ ý hay. Nếu có câu hỏi hay ý kiến khác, tốt nhất nêu lịch sự sau khi đối phương nói xong." },
            { title: "Thói quen ghi chú", body: "Ghi chú các điểm chính trong họp tạo ấn tượng chăm chỉ, tập trung. Bạn cũng có thể xem lại nội dung sau, giảm sai sót. Đặc biệt ghi ngay việc được giao hay hạn chót giúp bạn không bỏ sót." }
          ]
        }
      ],
      quiz: [
        {
          question: "Tiêu đề tốt cho email công việc là gì?",
          options: ["'Xin chào' không rõ nội dung", "'[Dự án] Hỏi lịch họp' rõ mục đích ngay", "Gửi mà không có tiêu đề", "Chỉ diễn đạt bằng emoji"],
          answer: 1,
          explain: "Nên viết rõ để mục đích rõ ràng chỉ qua tiêu đề."
        },
        {
          question: "Thái độ nên có khi phản hồi sẽ bị trễ là gì?",
          options: ["Không nói gì đến khi mọi thứ sẵn sàng", "Báo trước 'sau khi xác nhận, tôi sẽ trả lời trước lúc nào'", "Cứ lờ đi", "Gọi điện ngay dù khuya"],
          answer: 1,
          explain: "Một câu 'Tôi đã xác nhận và sẽ trả lời trước lúc nào' tạo niềm tin hơn im lặng."
        },
        {
          question: "Cách diễn đạt kiểu Hàn tự nhiên khi từ chối một lời nhờ vả là?",
          options: ["'Không thích'", "'Có lẽ hơi khó'", "'Sao lại là tôi?'", "Không trả lời"],
          answer: 1,
          explain: "Từ chối uyển chuyển mà rõ ràng, kèm lý do, là tự nhiên."
        },
        {
          question: "Thái độ nên có khi mắc lỗi trong công việc là gì?",
          options: ["Biện minh dài dòng", "Thừa nhận nhanh và sửa", "Che giấu", "Đổ lỗi cho người khác"],
          answer: 1,
          explain: "Xin lỗi nhanh và thái độ sửa chữa lại tạo niềm tin."
        }
      ]
    },
    ja: {
      id: "w3s4",
      emoji: "✉️",
      title: "ビジネスコミュニケーションのマナー",
      intro:
        "敬語・メール・返信・依頼のマナーなど、韓国の職場のコミュニケーション作法を詳しく身につけます。どこでも信頼を得る基本です。最後のクイズで確認しましょう。",
      objectives: [
        "職場での敬語・呼称の使い方を知る",
        "ビジネスメール・メッセンジャーのマナーを理解する",
        "丁寧に依頼・断り・謝罪する表現を身につける",
        "会議・報告でのコミュニケーションマナーを知る"
      ],
      sections: [
        {
          heading: "1. 呼称と敬語",
          emoji: "🗣️",
          summary: "コミュニケーションの始まりです。相手をどう呼ぶかが態度を示します。",
          items: [
            { title: "呼称マナー", body: "韓国の職場では相手を呼ぶとき名前の後に『님』を付けるか、『チーム長님・代理님』のように役職で呼びます。名前だけで呼んだり『あなた・お前』と言うと無礼に感じられるので、役職が分からないときは『○○님』が最も安全です。", example: "『キム・ミンス님、少しお伺いしてもよろしいですか？』\n『パク チーム長님、資料の確認をお願いします。』" },
            { title: "敬語が基本", body: "会社では役職や年齢に関係なく基本的に敬語を使います。敬語は相手を尊重するというサインなので、親しくなった後も会議やメールなど公的な場では礼儀を守るのがよいです。私的な場で打ち解けても、業務の場面では再び敬語に戻るのが自然です。" },
            { title: "自分を低める表現", body: "韓国語には自分を低めて相手を高める謙譲表現があります。『나』の代わりに『저』、『했어요』の代わりに『〜하겠습니다』を使うと、謙虚で丁寧な印象を与えます。こうした表現は特に上司や顧客に対するとき信頼感を高めます。", example: "『私が本日中に整理してご報告いたします。』" },
            { title: "敬語に気負わず", body: "韓国語の敬語は複雑で、ネイティブでも時々迷います。だから完璧でなくても大丈夫で、文法より丁寧であろうとする態度のほうがずっと大切です。小さなミスはたいてい理解されるので、あまり萎縮せず丁寧な口調を保つことに集中しましょう。", tip: "迷ったら『〜님、〜하십니다』で敬語を保てば無難です。" }
          ]
        },
        {
          heading: "2. メールのマナー",
          emoji: "✉️",
          summary: "ビジネスメールには形式があります。枠さえ覚えれば難しくありません。",
          items: [
            { title: "明確な件名", body: "受け取る人が件名だけで用件が分かるように書きます。1日に何十通もメールを受け取る社会人にとって、明確な件名は大きな配慮です。所属やプロジェクト名を角括弧で前に付けると一目で区別できます。", tip: "件名を見るだけで用件が分かるように書きましょう。", example: "良い例：『[マーケティングチーム]6月キャンペーン会議日程のお問い合わせ』\n惜しい例：『こんにちは』または『お問い合わせ』" },
            { title: "基本構造", body: "ビジネスメールは 挨拶 → 所属・名前 → 用件 → 丁寧な結び の順で書くのが基本です。この枠さえ覚えれば、どんな状況でもミスなく丁寧なメールを書けます。初めて連絡する相手なら、自己紹介を一行入れるとより親切です。", example: "件名：[デザインチーム]ロゴ案確認のお願い\n\nこんにちは、チーム長님。\nデザインチームのイ・ハンナです。\n\n先週ご相談したロゴ案を添付いたします。\n金曜日までにご確認いただけますでしょうか？\n\nよろしくお願いいたします。\nイ・ハンナ 拝" },
            { title: "簡潔に", body: "用件をメールの前部に置き、文は短く明確に書くのがよいです。忙しい相手が素早く要点をつかめるからです。伝える内容が複数あるなら、番号や項目で分けて整理するとずっと読みやすくなります。", example: "『下記の2点のご確認をお願いします。\n1. 予算承認の可否\n2. 会議可能な日程』" },
            { title: "結び・署名", body: "メールの末尾には『よろしくお願いいたします。』のような丁寧な挨拶を入れ、名前・所属・連絡先を記した署名を付けます。署名があれば、相手が誰にどう連絡すべきかすぐ分かり信頼が積み上がります。会社の署名フォーマットがあれば、そのまま使うのが安全です。" }
          ]
        },
        {
          heading: "3. 速く丁寧な返信",
          emoji: "⏱️",
          summary: "『いつ、どう返すか』が信頼を作ります。",
          items: [
            { title: "速い返信", body: "メールやメッセージを受け取ったら、できれば1日（24時間）以内に返すのが礼儀です。速い返信は『あなたの件を気にかけている』というサインで、相手を安心させます。すぐに結論が出せなくても、『確認しました』という短い返信からまず送る習慣をつけましょう。" },
            { title: "遅れるときは前もって知らせる", body: "返信に時間がかかりそうなら、結果が出るまで待たず、いつまでに返すか先に知らせましょう。相手は沈黙より予想の日程のほうがずっと楽に感じます。期限を決めて知らせると、責任感のある人という印象を与えられます。", tip: "沈黙より『確認しました』の一言のほうがずっと安心です。", example: "『おっしゃった内容を確認しました。関連部署と協議のうえ、水曜日までにご返信いたします。』" },
            { title: "メッセンジャーの反応", body: "社内メッセンジャーでは、メッセージを読んだら短くても反応を残すのがよいです。読んでも何の反応もないと、相手は届いたか分からず不安になるからです。すぐ返せないなら『はい、確認しました』や絵文字一つでも残すとコミュニケーションが円滑になります。" },
            { title: "勤務時間の尊重", body: "夜遅くや週末は、本当に急ぎでなければ業務連絡を控えるのが礼儀です。相手の休む時間を尊重する配慮だからです。夜遅くにアイデアが浮かんだら、メールを予約送信するか翌営業日の朝に送る方法もあります。" }
          ]
        },
        {
          heading: "4. 依頼・断り・謝罪の表現",
          emoji: "🤝",
          summary: "婉曲だが明確に。韓国式コミュニケーションの核心です。",
          items: [
            { title: "丁寧な依頼", body: "何かを頼むときは、命令口調ではなく相手の事情を配慮する柔らかい表現を使います。『やってください』より『もしかして可能でしょうか？』のように余地を残すと、相手が負担なく応じやすくなります。忙しい相手には、期限と理由を一緒に伝えるとより丁寧です。", example: "『お忙しいところ恐れ入りますが、もしよろしければ明日までにご確認いただけますでしょうか？』\n『お手数ですが、資料の共有をお願いできますでしょうか？』" },
            { title: "婉曲な断り", body: "韓国では『だめです』ときっぱり言うより、理由を添えて婉曲に断るのが自然です。直接的な断りは関係をぎこちなくしかねないからです。代わりに可能な代案を一緒に提案すると、断りがずっと柔らかく伝わります。", example: "『ご提案ありがとうございます。ただ今週は締切が重なり、少し難しそうです。来週であればお手伝いできます。』" },
            { title: "速い謝罪", body: "ミスをしたときは、隠したり言い訳したりするより、速く認めて正す態度のほうがかえって信頼を与えます。問題を正直に知らせ解決策を一緒に示すとプロらしく見えます。謝るときは、何をどう正すか具体的に言うのがよいです。", tip: "言い訳より『申し訳ありません、このように正します』がプロらしいです。", example: "『ファイルを間違えて添付しました。申し訳ありません。修正版をすぐに再送いたします。』" },
            { title: "感謝の表現", body: "助けてもらったときは、小さなことでも必ず感謝を伝えましょう。感謝の表現は関係を和らげ、次も進んで助けたい気持ちにさせます。その場で口で伝えるのはもちろん、後でメッセージでもう一度お礼をすると印象が長く残ります。" }
          ]
        },
        {
          heading: "5. 会議・報告のマナー",
          emoji: "📊",
          summary: "チームで働くときのコミュニケーションです。",
          items: [
            { title: "中間報告", body: "仕事が全部終わってからだけ報告するのではなく、進捗を途中途中で先に共有すると信頼を得られます。上司は仕事がうまく流れているか知ってこそ安心できるからです。問題が起きたときも早く知らせれば、一緒に素早く対応できます。" },
            { title: "結論から言う", body: "韓国の職場では、報告や発言をするとき結論を先に言い、理由を後に付ける方式が好まれます。忙しい相手が要点を素早くつかめるからです。前置きが長いともどかしく感じられるので、要点から出す習慣をつけましょう。", tip: "『結論はAです。理由は…』の順で話してみましょう。", example: "『結論から申し上げると、日程は予定どおり進行可能です。理由は必要な資料がすべて確保されたためです。』" },
            { title: "傾聴", body: "会議では相手の話を遮らず最後まで聞く態度が大切です。話を横取りすると無礼に見え、良いアイデアを逃すこともあります。疑問や別の意見があれば、相手が話し終えてから丁寧に切り出すのがよいです。" },
            { title: "メモの習慣", body: "会議中に要点をメモすると、誠実で集中している印象を与えます。後で内容を再確認でき、ミスも減ります。特に指示された仕事や締切はその場で書いておくと逃しません。" }
          ]
        }
      ],
      quiz: [
        {
          question: "ビジネスメールで良い件名は？",
          options: ["内容が分からない『こんにちは』", "用件がすぐ分かる『[プロジェクト]会議日程のお問い合わせ』", "件名なしで送る", "絵文字だけで表現"],
          answer: 1,
          explain: "件名を見るだけで用件が分かるよう明確に書くのがよいです。"
        },
        {
          question: "返信が遅れそうなとき望ましい態度は？",
          options: ["すべて準備できるまで何も言わない", "『確認後いつまでに返す』と先に知らせる", "そのまま無視する", "夜遅くてもすぐ電話する"],
          answer: 1,
          explain: "沈黙より『確認したのでいつまでに返す』の一言が信頼を与えます。"
        },
        {
          question: "依頼を断るとき韓国式に自然な表現は？",
          options: ["『嫌です』", "『少し難しそうです』", "『なぜ私に？』", "返事をしない"],
          answer: 1,
          explain: "婉曲だが明確に、理由を添えて断るのが自然です。"
        },
        {
          question: "業務中にミスをしたとき望ましい態度は？",
          options: ["言い訳を長々とする", "速く認めて正す", "隠す", "人のせいにする"],
          answer: 1,
          explain: "速い謝罪と正す態度のほうがかえって信頼を与えます。"
        }
      ]
    },
    id: {
      id: "w3s4",
      emoji: "✉️",
      title: "Etika Komunikasi Bisnis",
      intro:
        "Pelajari secara rinci etika komunikasi tempat kerja Korea — bahasa hormat, email, balasan, dan etika meminta. Ini fondasi yang membuatmu dipercaya di mana pun. Periksa dirimu dengan kuis di akhir.",
      objectives: [
        "Mengetahui cara memakai bahasa hormat · cara memanggil di tempat kerja",
        "Memahami etika email · pesan instan bisnis",
        "Menguasai ungkapan meminta · menolak · meminta maaf dengan sopan",
        "Mengetahui tata krama komunikasi dalam rapat · pelaporan"
      ],
      sections: [
        {
          heading: "1. Cara Memanggil dan Bahasa Hormat",
          emoji: "🗣️",
          summary: "Ini awal komunikasi. Cara memanggil lawan menunjukkan sikapmu.",
          items: [
            { title: "Etika menyapa", body: "Di tempat kerja Korea, saat memanggil lawan kamu menambahkan '-nim' setelah nama atau memakai jabatan seperti 'kepala tim-nim', 'asisten manajer-nim'. Memanggil hanya dengan nama atau memakai 'kamu · Anda' terasa kasar, jadi saat tak tahu jabatan, '○○-nim' paling aman.", example: "'Kim Min-su-nim, boleh saya tanya sebentar?'\n'Kepala tim Park-nim, mohon periksa bahannya.'" },
            { title: "Bahasa hormat adalah standar", body: "Di perusahaan, terlepas dari jabatan atau usia, standarnya memakai bahasa hormat. Bahasa hormat adalah sinyal menghormati lawan, jadi bahkan setelah akrab, baik menjaga kesopanan di situasi publik seperti rapat atau email. Meski sudah santai di situasi pribadi, kembali ke bahasa hormat dalam situasi kerja itu wajar." },
            { title: "Ungkapan merendahkan diri", body: "Bahasa Korea punya ungkapan merendah yang menurunkan diri untuk meninggikan lawan. Memakai 'jeo' alih-alih 'na', dan '~hagesseumnida' alih-alih 'haesseoyo', memberi kesan rendah hati dan sopan. Ungkapan seperti ini terutama membangun kepercayaan saat menghadapi atasan atau klien.", example: "'Saya akan merapikannya dan melapor kepada Anda dalam hari ini.'" },
            { title: "Tak perlu tertekan soal bahasa hormat", body: "Bahasa hormat Korea rumit, penutur asli pun kadang bingung. Jadi tak apa jika belum sempurna, dan sikap ingin sopan jauh lebih penting ketimbang tata bahasa. Kesalahan kecil kebanyakan dimaklumi, jadi jangan menciut berlebihan — fokuslah menjaga nada bicara yang sopan.", tip: "Saat bingung, menjaga bahasa hormat dengan '~nim, ~hasimnida' sudah aman." }
          ]
        },
        {
          heading: "2. Etika Email",
          emoji: "✉️",
          summary: "Email bisnis punya format. Begitu paham kerangkanya, tidak sulit.",
          items: [
            { title: "Subjek yang jelas", body: "Tulis agar penerima tahu maksudnya hanya dari subjek. Bagi pekerja kantoran yang menerima puluhan email sehari, subjek yang jelas adalah kebaikan besar. Menaruh nama tim atau proyek dalam kurung siku di depan membuatnya menonjol sekilas.", tip: "Tulis agar maksudnya jelas hanya dari subjek.", example: "Baik: '[Tim Marketing] Pertanyaan jadwal rapat kampanye Juni'\nLemah: 'Halo' atau 'Ingin bertanya'" },
            { title: "Struktur dasar", body: "Email bisnis pada dasarnya ditulis berurutan: salam → tim/nama kamu → maksud → penutup sopan. Begitu menguasai kerangka ini, kamu bisa menulis email sopan tanpa salah dalam situasi apa pun. Jika ini orang yang baru kamu hubungi, menambahkan satu baris perkenalan diri lebih ramah lagi.", example: "Subjek: [Tim Desain] Permohonan tinjau draf logo\n\nHalo, kepala tim-nim.\nSaya Lee Han-na dari Tim Desain.\n\nSaya lampirkan draf logo yang kita bahas minggu lalu.\nBisakah ditinjau sebelum Jumat?\n\nTerima kasih.\nLee Han-na" },
            { title: "Ringkas", body: "Baik menaruh maksud di bagian depan email dan menulis kalimat pendek serta jelas. Karena penerima yang sibuk bisa cepat menangkap intinya. Jika ada beberapa hal yang disampaikan, membaginya dalam nomor atau butir membuatnya jauh lebih mudah dibaca.", example: "'Mohon konfirmasi dua hal berikut.\n1. Apakah anggaran disetujui\n2. Waktu rapat yang tersedia'" },
            { title: "Penutup · tanda tangan", body: "Di akhir email, tambahkan salam sopan seperti 'Terima kasih' dan lampirkan tanda tangan berisi nama · tim · kontak. Dengan tanda tangan, penerima langsung tahu harus menghubungi siapa dan bagaimana, membangun kepercayaan. Jika ada templat tanda tangan perusahaan, memakainya apa adanya itu aman." }
          ]
        },
        {
          heading: "3. Respons Cepat dan Sopan",
          emoji: "⏱️",
          summary: "'Kapan dan bagaimana kamu membalas' membangun kepercayaan.",
          items: [
            { title: "Balasan cepat", body: "Ketika menerima email atau pesan, membalas dalam sehari (24 jam) jika bisa adalah kesopanan. Balasan cepat adalah sinyal 'saya menangani urusanmu', yang menenangkan lawan. Meski tak bisa menyimpulkan langsung, biasakan lebih dulu mengirim balasan singkat seperti 'Sudah, dikonfirmasi'." },
            { title: "Beri tahu lebih dulu bila tertunda", body: "Jika balasan butuh waktu, jangan menunggu hasil siap — beri tahu lebih dulu kapan kamu akan merespons. Lawan merasa lebih nyaman dengan perkiraan jadwal ketimbang keheningan. Memberi tenggat membuatmu tampak bertanggung jawab.", tip: "Satu 'Sudah, dikonfirmasi' jauh lebih menenangkan ketimbang keheningan.", example: "'Saya sudah mengonfirmasi hal yang Anda sampaikan. Setelah berdiskusi dengan bagian terkait, saya akan membalas sebelum Rabu.'" },
            { title: "Reaksi di pesan instan", body: "Di pesan instan internal perusahaan, setelah membaca pesan baik meninggalkan reaksi meski singkat. Jika sudah dibaca tapi tak ada reaksi, lawan cemas karena tak tahu apakah pesan sampai. Jika sulit membalas langsung, meninggalkan 'Ya, sudah dikonfirmasi' atau satu emoji pun memuluskan komunikasi." },
            { title: "Hormati jam kerja", body: "Larut malam atau akhir pekan, kecuali benar-benar mendesak, menahan diri dari kontak kerja adalah kesopanan. Itu pertimbangan yang menghormati waktu istirahat lawan. Jika ide muncul larut malam, kamu bisa menjadwalkan email atau mengirimnya pagi hari kerja berikutnya." }
          ]
        },
        {
          heading: "4. Ungkapan Meminta · Menolak · Meminta Maaf",
          emoji: "🤝",
          summary: "Halus tetapi jelas. Ini inti komunikasi gaya Korea.",
          items: [
            { title: "Permintaan sopan", body: "Saat meminta sesuatu, pakailah ungkapan lembut yang mempertimbangkan situasi lawan alih-alih nada memerintah. Memberi ruang dengan 'Apakah mungkin bisa?' ketimbang 'Tolong lakukan' membuat lawan lebih mudah menyanggupi tanpa tertekan. Untuk orang sibuk, menyampaikan tenggat dan alasan sekaligus lebih sopan lagi.", example: "'Maaf mengganggu di tengah kesibukan, tetapi apakah mungkin Anda bisa meninjaunya sebelum besok?'\n'Mungkin merepotkan, tetapi bolehkah saya minta Anda membagikan bahannya?'" },
            { title: "Penolakan halus", body: "Di Korea, ketimbang berkata tegas 'Tidak bisa', menolak secara halus dengan alasan lebih wajar. Penolakan blak-blakan bisa membuat hubungan canggung. Sebaliknya, mengusulkan alternatif yang mungkin membuat penolakan tersampaikan jauh lebih lembut.", example: "'Terima kasih atas tawarannya. Namun minggu ini tenggat saya bertumpuk sehingga mungkin agak sulit. Kalau minggu depan, saya bisa membantu.'" },
            { title: "Minta maaf dengan cepat", body: "Saat membuat kesalahan, cepat mengakui dan memperbaikinya, ketimbang menyembunyikan atau berdalih, justru membangun kepercayaan. Melaporkan masalah dengan jujur dan menawarkan solusi sekaligus tampak profesional. Saat meminta maaf, baik mengatakan secara konkret apa yang akan diperbaiki dan bagaimana.", tip: "'Maaf, akan saya perbaiki seperti ini' lebih profesional ketimbang berdalih.", example: "'Saya melampirkan berkas yang salah. Maaf. Saya akan segera mengirim ulang versi yang sudah diperbaiki.'" },
            { title: "Menyampaikan terima kasih", body: "Ketika menerima bantuan, pastikan menyampaikan terima kasih bahkan untuk hal kecil. Menyampaikan terima kasih memuluskan hubungan dan membuat orang senang membantu lagi lain kali. Selain mengatakannya di tempat, berterima kasih sekali lagi lewat pesan kemudian meninggalkan kesan yang bertahan lama." }
          ]
        },
        {
          heading: "5. Tata Krama Rapat · Pelaporan",
          emoji: "📊",
          summary: "Ini komunikasi saat bekerja sebagai tim.",
          items: [
            { title: "Laporan antara", body: "Alih-alih melapor hanya setelah tugas selesai, berbagi kemajuan di sepanjang jalan lebih dulu akan memperoleh kepercayaan. Karena atasan baru bisa tenang jika tahu apakah semuanya berjalan lancar. Saat muncul masalah pun, memberi tahu lebih awal memungkinkan menanggapinya bersama dengan cepat." },
            { title: "Sampaikan kesimpulan dulu", body: "Di tempat kerja Korea, saat melapor atau berbicara, orang lebih suka menyampaikan kesimpulan dulu lalu menambahkan alasan setelahnya. Karena orang sibuk bisa menangkap intinya dengan cepat. Pembukaan panjang bisa terasa menyesakkan, jadi biasakan mengedepankan poin utama.", tip: "Coba bicara dengan urutan 'Kesimpulannya A. Alasannya…'", example: "'Menyampaikan kesimpulan dulu, jadwal bisa berjalan sesuai rencana. Alasannya karena semua bahan yang diperlukan sudah tersedia.'" },
            { title: "Mendengarkan", body: "Dalam rapat, sikap mendengarkan sampai akhir tanpa memotong lawan itu penting. Menyela tampak kasar dan kamu bisa melewatkan ide bagus. Jika ada pertanyaan atau pendapat berbeda, baik menyampaikannya dengan sopan setelah lawan selesai bicara." },
            { title: "Kebiasaan mencatat", body: "Mencatat poin penting selama rapat memberi kesan tekun dan fokus. Kamu juga bisa meninjau isinya nanti, mengurangi kesalahan. Khususnya menuliskan tugas yang diberikan atau tenggat di tempat membuatmu tak melewatkannya." }
          ]
        }
      ],
      quiz: [
        {
          question: "Subjek yang baik untuk email bisnis adalah?",
          options: ["'Halo' yang tak jelas isinya", "'[Proyek] pertanyaan jadwal rapat' yang maksudnya langsung jelas", "Mengirim tanpa subjek", "Mengungkapkan hanya dengan emoji"],
          answer: 1,
          explain: "Baik menulisnya dengan jelas agar maksudnya jelas hanya dari subjek."
        },
        {
          question: "Sikap yang diinginkan saat balasan akan tertunda adalah?",
          options: ["Diam sampai semua siap", "Beri tahu lebih dulu 'setelah konfirmasi, saya akan membalas sebelum kapan'", "Mengabaikannya saja", "Menelepon langsung meski larut malam"],
          answer: 1,
          explain: "Satu 'Saya sudah konfirmasi dan akan membalas sebelum kapan' membangun kepercayaan lebih dari keheningan."
        },
        {
          question: "Ungkapan gaya Korea yang wajar saat menolak permintaan adalah?",
          options: ["'Tidak mau'", "'Mungkin agak sulit'", "'Kenapa saya?'", "Tidak menjawab"],
          answer: 1,
          explain: "Menolak secara halus tetapi jelas, dengan alasan, itu wajar."
        },
        {
          question: "Sikap yang diinginkan saat membuat kesalahan dalam pekerjaan adalah?",
          options: ["Berdalih panjang lebar", "Mengakui dengan cepat dan memperbaikinya", "Menyembunyikannya", "Menyalahkan orang lain"],
          answer: 1,
          explain: "Permintaan maaf yang cepat dan sikap memperbaiki justru membangun kepercayaan."
        }
      ]
    }
  },
  w4s4: {
    en: {
      id: "w4s4",
      emoji: "🤝",
      title: "Interview Etiquette & Onboarding Manners",
      intro:
        "Learn in detail everything from interview prep to attitude, follow-up, and your first impression when you join. It lets you fully show the skills you've prepared. Check yourself with the quiz at the end.",
      objectives: [
        "Know basic manners like interview attire and punctuality",
        "Understand your attitude and answering tips during the interview",
        "Know how to follow up after the interview (thank-you email)",
        "Know how to make a good first impression when you join"
      ],
      sections: [
        {
          heading: "1. Preparing Before the Interview",
          emoji: "🎒",
          summary: "Preparation is confidence itself. Get ready in advance by the day before.",
          items: [
            { title: "Attire", body: "For Korean interviews, a neat suit or business casual is safe. Rather than loud colors or excessive accessories, a clean, put-together impression earns trust. Ironing your clothes and hanging them out the night before means you won't rush in the morning.", tip: "If you don't know the company's vibe, the slightly more formal side is safer." },
            { title: "Researching the company and role", body: "Researching the company and role in advance completely changes the depth of your answers. Skim the homepage, job posting, and recent news, and organize what the company does and what you'd be doing, so you can answer the interviewer's questions concretely. It's the best way to prepare for 'Why our company?'", tip: "Connecting your motivation to the company's actual business/service conveys sincerity." },
            { title: "Practicing likely questions", body: "Don't just think through your self-introduction, motivation, and strengths in your head — practice them aloud. Actually saying them reveals awkward parts and builds a sense of adjusting length to about 30 seconds to 1 minute. Practicing in front of a mirror or with a phone recording lets you check your expression and tone too.", example: "Self-introduction example:\n'Hello, I'm △△, applying for the ○○ role. While studying □□ in Korea, I built ◇◇ experience, and I applied because I want to put the ▽▽ competency I learned to use at this company.'" },
            { title: "Checking the route and time", body: "Check the interview location and how long it takes to get there the day before. Knowing the subway/bus routes and exits, and the building floor, keeps you from getting lost on the day. If it's an unfamiliar area, leaving with a 20–30 minute buffer over your estimate is safe." }
          ]
        },
        {
          heading: "2. Punctuality",
          emoji: "⏰",
          summary: "Being on time is the most basic form of trust in Korea.",
          items: [
            { title: "Arrive 10 minutes early", body: "Arriving 10 minutes before the appointed time is basic. Going in too early (20–30 minutes or more) can actually make the other side uncomfortable, so wait at a nearby café or the lobby and arrive at the reception around 10 minutes before. An unhurried arrival also gives you time to compose yourself.", tip: "Arrive at the building early, but entering the interview room 10 minutes before is about right." },
            { title: "Contact immediately if late", body: "If you're going to be late due to traffic, etc., be sure to contact them in advance by call or text. Honestly informing them of the situation and giving your expected arrival time makes a completely different impression from an unexplained no-show. Handling it calmly can itself lead to a good evaluation.", tip: "An unexplained late arrival is a big minus regardless of ability." },
            { title: "Check for online interviews", body: "For a video interview, check the link, camera, mic, and internet at least 10 minutes ahead. Join in a quiet place with a clean background, under bright lighting so your face is clearly visible. Saving the interviewer's contact in advance in case the connection drops gives peace of mind.", tip: "Using earphones can reduce echo and background noise." },
            { title: "Give yourself room", body: "Arrive a bit early to tidy your appearance in the restroom and ease your nerves with a deep breath. Lightly reciting your prepared self-introduction or key answers during the wait builds confidence. Just entering the interview in an unhurried state steadies your expression and voice." }
          ]
        },
        {
          heading: "3. Attitude During the Interview",
          emoji: "💬",
          summary: "They look at attitude as much as ability. Be bright and sincere.",
          items: [
            { title: "A bright first greeting", body: "When you enter the interview room, greet with a bright expression and naturally make eye contact with the interviewers. The impression of the first few seconds often sets the whole interview's mood. Sit after being told to, and keep a straight back and good posture to look confident.", example: "Entrance greeting example:\n'Hello, thank you for the interview opportunity today. I'm △△, applying for the ○○ role.'" },
            { title: "Listen and respect", body: "Answering after listening to the question to the end is both courtesy and the start of a good answer. If words overlap, pause briefly and yield to the other person, and if the question's intent is unclear, it's okay to politely confirm with 'Do you mean it in this sense?' Nodding while listening shows an attentive attitude." },
            { title: "Honesty", body: "Don't pretend to know what you don't — honestly admit it, but show an attitude of how you'd approach it or learn. A made-up answer is quickly exposed in follow-up questions and loses trust instead. The key is not to end at 'I don't know' but to add a direction like 'I'll look into it this way.'", tip: "An answer like 'I don't know well, but I'd approach it this way' actually looks good.", example: "Answering an unknown question example:\n'I haven't dealt with that in depth yet, so it's hard to say precisely. However, I'd look up ○○ materials and approach it via △△ to learn it quickly.'" },
            { title: "Conclusion-first answers", body: "Stating the conclusion first and then backing it with reasons and experience makes it far more communicative. In Korean interviews, the longer an answer gets the easier it is to lose the point, so leading with the core is advantageous. Remembering the order 'conclusion → reason → experience' keeps you steady for any question.", example: "Conclusion-first answer example:\n'My biggest strength is thoroughness. In a previous project, I re-checked the data and caught errors in advance, so I can reduce mistakes even in repetitive work.'" },
            { title: "Preparing your own questions", body: "When asked 'Any questions?' at the end, prepare and ask a question that carries genuine interest in the company and role. Rather than 'None,' a question about growth or how work is done shows enthusiasm. That said, focusing on the work and growth rather than only asking about salary and vacation leaves a good impression.", example: "Reverse-question examples:\n'What work should I focus on most in the first 3 months after joining?'\n'What do the people who perform well on this team have in common?'" }
          ]
        },
        {
          heading: "4. Following Up After the Interview",
          emoji: "📧",
          summary: "A little sincerity after it's over leaves an impression.",
          items: [
            { title: "Thank-you email", body: "Sending a short thank-you after the interview can help you be remembered as an earnest applicant. Within the same or next day, send it concisely with thanks for the interview opportunity and one or two sentences of interest in the company. A short, sincere email makes a better impression than a long one.", tip: "Send it concisely within the same or next day.", example: "Thank-you email example:\nSubject: [○○ role] Thank-you note for the interview - △△\n\nHello, this is △△ who interviewed today.\nThank you sincerely for taking your precious time amid your busy schedule.\nTalking with you deepened my interest in the ○○ work.\nI look forward to the chance to work together with a good outcome.\nThank you." },
            { title: "Waiting for the result", body: "Don't rush the result — wait politely until the announced schedule. Since each company takes time for internal review and procedures, contacting anxiously many times can burden them instead. Inquiring politely once after the announced deadline passes with no news is about the right amount." },
            { title: "Accepting feedback", body: "Even if you're rejected, don't dwell in disappointment — take it as a chance to learn and prepare for next time. Reflecting on which answers fell short definitely improves your next interview. Each interview experience accumulates into skill, so the habit of reviewing regardless of the result matters." },
            { title: "Reply etiquette", body: "When you get a pass or offer, reply as quickly and politely as possible. If you need time to think, telling them a deadline like 'I'll reply by such-and-such' is courtesy. Even if you're comparing with other places, don't leave it unanswered — polite communication builds the basic trust of social life.", tip: "Even when declining an offer, informing them politely with thanks is good." }
          ]
        },
        {
          heading: "5. First Impression When You Join",
          emoji: "🌱",
          summary: "Well begun is half done. The first two weeks shape your image.",
          items: [
            { title: "Greet first", body: "When you get to work, greet brightly first and quickly learn colleagues' names and faces. At Korean workplaces, greeting well alone can earn a good first impression of 'friendly and polite.' Remembering and using names lets you get close to colleagues much faster.", tip: "It's good to keep up 'Hello' and 'I'll head out first' greetings when arriving and leaving." },
            { title: "A learning attitude", body: "When there's something you don't know, don't read the room — ask appropriately and show a willingness to learn. As a new grad or in the early days, a willingness to learn is rated better than perfection. That said, asking after first looking into what you can find yourself earns more trust." },
            { title: "Keeping time and promises", body: "Keeping your start time and work deadlines is the most basic and important foundation of trust. In Korean workplace culture, keeping time is regarded as a measure of a person's diligence. Informing and adjusting in advance for schedules that are hard to keep is also a responsible attitude." },
            { title: "The habit of taking notes", body: "Learning tasks while taking notes lets you adapt quickly and earn trust. Writing down instructions and procedures on the spot so you don't ask the same thing twice reduces mistakes. Making your own work notebook becomes a reliable asset you can refer to yourself later.", tip: "It's good to have a note-taking habit so you don't ask the same thing twice." }
          ]
        }
      ],
      quiz: [
        {
          question: "What's an appropriate arrival time for an interview?",
          options: ["Exactly at the start time", "10 minutes before the appointed time", "5 minutes late", "Entering 1 hour early"],
          answer: 1,
          explain: "Arriving 10 minutes early is basic. Rather than entering too early, wait nearby and then go in."
        },
        {
          question: "What's a good attitude when you get a question you don't know in an interview?",
          options: ["Make something up as if you know", "Honestly admit it and state your approach", "Say nothing", "Change the subject"],
          answer: 1,
          explain: "It's good to honestly admit what you don't know and show a willingness to learn and your approach."
        },
        {
          question: "What's a good follow-up after an interview ends?",
          options: ["Rush the result every day", "Send a short thank-you email", "Do nothing", "Send the interviewer a social-media friend request"],
          answer: 1,
          explain: "A concise thank-you email sent within the same or next day leaves a good impression."
        },
        {
          question: "What's the basic for making a good first impression after joining?",
          options: ["Keeping time/promises and a willingness to learn", "Doing only what you know and not asking", "Making up for lateness with skill", "Relying only on memory without notes"],
          answer: 0,
          explain: "Punctuality and a willingness to learn are the most basic."
        }
      ]
    },
    "zh-CN": {
      id: "w4s4",
      emoji: "🤝",
      title: "面试礼仪与入职礼节",
      intro:
        "从面试准备到态度、跟进、入职第一印象，详细学习。让你把准备好的实力完整展现出来。最后用测验检验自己。",
      objectives: [
        "了解面试着装、守时等基本礼节",
        "理解面试中的态度与答题要领",
        "了解面试后跟进（感谢邮件）的方法",
        "了解让入职第一印象变好的方法"
      ],
      sections: [
        {
          heading: "1. 面试前的准备",
          emoji: "🎒",
          summary: "准备即自信。前一天就提前备好。",
          items: [
            { title: "着装", body: "韩国面试中，端庄的正装或商务休闲较为稳妥。比起色彩张扬或过度的饰品，干净利落的印象更能赢得信任。前一晚先把衣服熨好挂起来，早上就不必手忙脚乱。", tip: "不清楚公司氛围时，稍偏端庄一些更保险。" },
            { title: "调查公司·岗位", body: "提前调查公司和岗位，答题的深度会完全不同。浏览官网、招聘公告、近期新闻，整理清楚这家公司做什么、你将做什么，就能对面试官的问题作具体回答。这是应对‘为什么选我们公司？’的最佳方法。", tip: "把应聘动机与公司实际业务·服务相连接，会让人感到真诚。" },
            { title: "预想问题练习", body: "自我介绍·应聘动机·强项别只在脑中想，要出声练习。实际说出来能暴露别扭之处，也会培养把长度控制在30秒~1分钟的感觉。对着镜子或用手机录音练习，还能检查表情和语气。", example: "自我介绍示例：\n‘您好，我是应聘○○岗位的△△。在韩国学习□□期间积累了◇◇经验，希望把由此学到的▽▽能力在贵公司发挥，故前来应聘。’" },
            { title: "确认路线·时间", body: "前一天先确认面试地点位置和路上所需时间。连地铁·公交路线与出口、楼层都了解清楚，当天就不会迷路。若是陌生地区，比预计时间多留20~30分钟出发更保险。" }
          ]
        },
        {
          heading: "2. 守时",
          emoji: "⏰",
          summary: "守时是韩国最基本的信任。",
          items: [
            { title: "提前10分钟到", body: "约定时间前10分钟到是基本。太早（20~30分钟以上）进去反而可能让对方为难，因此在附近咖啡馆或大堂等候，约10分钟前到前台为好。从容到达也能给你整理心情的时间。", tip: "提前到达大楼，但进入面试室以10分钟前为宜。" },
            { title: "会迟到时立即联系", body: "若因交通等可能迟到，务必提前用电话或短信联系。诚实告知情况并说明预计到达时间，与无故迟到会给人截然不同的印象。冷静应对本身也可能带来好评价。", tip: "无故迟到与实力无关，是很大的扣分。" },
            { title: "在线面试检查", body: "视频面试要在至少10分钟前先检查链接·摄像头·麦克风·网络。在安静、背景整洁的地方，在明亮灯光下让脸清晰可见地参加为好。为应对断线，提前保存面试官联系方式会更安心。", tip: "使用耳机可减少回音和杂音。" },
            { title: "留有余地", body: "稍早到达，在洗手间整理仪容，用深呼吸放松紧张。等候时轻声默念准备好的自我介绍或核心答案，会增添自信。仅仅以不慌不忙的状态进入面试，表情和声音就会更稳。" }
          ]
        },
        {
          heading: "3. 面试中的态度",
          emoji: "💬",
          summary: "态度与实力同样被看重。明朗而真诚。",
          items: [
            { title: "明朗的第一声问候", body: "进入面试室后，以明朗的表情问候，并与面试官自然地对视。最初几秒的印象往往左右整场面试的氛围。被示意就座后再坐，挺直脊背保持端正姿势，会显得自信。", example: "入场问候示例：\n‘您好，感谢今天给我面试机会。我是应聘○○岗位的△△。’" },
            { title: "倾听·尊重", body: "听完问题再作答，既是礼貌也是好答案的开端。若说话重叠，稍作停顿让给对方；若问题意图含糊，礼貌地确认‘您是这个意思吗？’也无妨。点头倾听的样子能展现认真倾听的态度。" },
            { title: "坦诚", body: "不懂的别不懂装懂，坦诚承认，同时展现将如何着手或学习的姿态。编造的答案在追问中很快暴露，反而失去信任。关键不是止于‘不知道’，而是补上‘我会这样去了解’的方向。", tip: "‘虽不太清楚，但我会这样着手’的回答反而更好。", example: "不懂的问题答法示例：\n‘那部分我还没深入接触过，难以准确说明。不过我会查阅○○资料，用△△的方式着手快速掌握。’" },
            { title: "开门见山的答法", body: "先说结论，再用依据和经验支撑，传达力会好得多。韩国面试中答案越长越易丢失要点，因此把核心放在前面更有利。记住‘结论→理由→经验’的顺序，面对任何问题都不会慌。", example: "开门见山答法示例：\n‘我最大的强项是细致。在此前的项目中，我重新核查数据、提前发现了错误，因此在重复性工作中也能减少失误。’" },
            { title: "准备反问", body: "最后被问‘有什么问题吗？’时，准备并提出一个饱含对公司和岗位真实兴趣的问题。比起‘没有’，关于成长或工作方式的问题更能展现热情。不过比起只问薪资·休假，聚焦于工作与成长会留下好印象。", example: "反问示例：\n‘入职后头3个月最该集中的工作是什么？’\n‘在这个团队里表现出色的人有什么共同点？’" }
          ]
        },
        {
          heading: "4. 面试后的跟进",
          emoji: "📧",
          summary: "结束后的一点用心会留下印象。",
          items: [
            { title: "感谢邮件", body: "面试后发一封简短的感谢，会让人记住你是有诚意的应聘者。在当天或次日之内，简洁地写上对面试机会的感谢，以及一两句对公司的关注。比起长篇，饱含真心的短邮件更能留下好印象。", tip: "在当天~次日之内，简洁地发送。", example: "感谢邮件示例：\n标题：[○○岗位]面试感谢 - △△\n\n您好，我是今天参加面试的△△。\n感谢您在百忙之中抽出宝贵时间。\n交谈之后，我对○○工作的兴趣更浓了。\n期待能以好的结果与各位共事。\n谢谢。" },
            { title: "等待结果", body: "结果不要催促，礼貌等到告知的日程为止。各公司内部审核和流程都需要时间，焦急地多次联系反而可能造成负担。告知的期限过了仍无消息时，礼貌地询问一次较为适当。" },
            { title: "接受反馈", body: "即便落选也别停留在失望，把它当作学习的机会去准备下一次。反思哪些回答有遗憾，下次面试一定会有进步。每一次面试经验累积起来就是实力，因此无论结果如何，复盘的习惯都很重要。" },
            { title: "回复礼节", body: "收到合格或录用联系，尽量迅速而礼貌地答复。若需要时间考虑，告知‘我会在何时答复’这样的期限是礼貌。即便在与别处比较中，也别置之不理，礼貌的沟通造就社会生活的基本信任。", tip: "拒绝录用时，也最好连同感谢一并礼貌告知。" }
          ]
        },
        {
          heading: "5. 入职第一印象",
          emoji: "🌱",
          summary: "开头即成功一半。头两周塑造你的形象。",
          items: [
            { title: "主动问候", body: "上班后先明朗地问候，并尽快记住同事的名字和面孔。在韩国职场，光是问候得好，就能获得‘爽快、有礼貌’的好第一印象。记住并叫出名字，能与同事更快亲近。", tip: "上下班时别忘了‘您好’‘我先走了’的问候。" },
            { title: "学习的姿态", body: "有不懂的别看脸色，适当提问、展现想学习的态度。新人或入职初期，比起完美，想学习的姿态更受好评。不过能自己查到的先查过再问，会更获信任。" },
            { title: "遵守时间·约定", body: "遵守上班时间和工作截止约定，是最基本也最重要的信任基石。在韩国职场文化中，守时被视为衡量一个人是否踏实的尺度。难以遵守的日程提前告知并协调，也是有责任感的态度。" },
            { title: "记笔记的习惯", body: "学习工作时边记笔记边掌握，能快速适应并赢得信任。把受托内容和流程随时记下，避免同一件事问两次，就能减少失误。建立自己的工作笔记，日后能成为可供自己参考的可靠资产。", tip: "养成记笔记的习惯，避免同一件事问两次。" }
          ]
        }
      ],
      quiz: [
        {
          question: "面试合适的到达时间是？",
          options: ["正好在开始时间", "约定时间前10分钟", "迟到5分钟", "提前1小时入场"],
          answer: 1,
          explain: "提前10分钟到是基本。别太早入场，而是在附近等候后再进去。"
        },
        {
          question: "面试中遇到不懂的问题，好的态度是？",
          options: ["不懂装懂编造", "坦诚承认并说出着手方法", "什么都不说", "转移话题"],
          answer: 1,
          explain: "不懂的坦诚承认，展现想学习的姿态和着手方法为好。"
        },
        {
          question: "面试结束后好的跟进是？",
          options: ["每天催结果", "发一封简短的感谢邮件", "什么都不做", "向面试官发社交好友申请"],
          answer: 1,
          explain: "在当天~次日之内发送的简洁感谢邮件会留下好印象。"
        },
        {
          question: "入职后让第一印象变好的基本是？",
          options: ["守时·守约并想学习的姿态", "只做会的、不提问", "迟到也用实力弥补", "不记笔记只靠记忆"],
          answer: 0,
          explain: "守时和想学习的态度是最基本的。"
        }
      ]
    },
    vi: {
      id: "w4s4",
      emoji: "🤝",
      title: "Phép tắc phỏng vấn & phép nhập công ty",
      intro:
        "Học chi tiết từ chuẩn bị phỏng vấn đến thái độ, theo dõi sau phỏng vấn, và ấn tượng đầu tiên khi vào làm. Nó giúp bạn thể hiện trọn vẹn năng lực đã chuẩn bị. Hãy tự kiểm tra bằng bài quiz ở cuối.",
      objectives: [
        "Biết các phép tắc cơ bản như trang phục và đúng giờ phỏng vấn",
        "Hiểu thái độ và mẹo trả lời trong lúc phỏng vấn",
        "Biết cách theo dõi sau phỏng vấn (email cảm ơn)",
        "Biết cách tạo ấn tượng đầu tiên tốt khi vào làm"
      ],
      sections: [
        {
          heading: "1. Chuẩn bị trước phỏng vấn",
          emoji: "🎒",
          summary: "Chuẩn bị chính là sự tự tin. Hãy chuẩn bị sẵn từ hôm trước.",
          items: [
            { title: "Trang phục", body: "Với phỏng vấn ở Hàn, vest gọn gàng hoặc business casual là an toàn. Thay vì màu chói hay phụ kiện quá đà, ấn tượng sạch sẽ, chỉnh chu tạo niềm tin. Ủi và treo sẵn quần áo tối hôm trước giúp bạn không cuống buổi sáng.", tip: "Nếu không rõ không khí công ty, thiên về phía chỉnh chu hơn thì an toàn hơn." },
            { title: "Tìm hiểu công ty · vị trí", body: "Tìm hiểu trước công ty và vị trí thay đổi hoàn toàn độ sâu câu trả lời. Lướt trang chủ, tin tuyển dụng, tin tức gần đây, và sắp xếp công ty làm gì, bạn sẽ làm gì, để trả lời cụ thể câu hỏi của người phỏng vấn. Đó là cách tốt nhất để chuẩn bị cho 'Vì sao công ty chúng tôi?'", tip: "Nối động cơ ứng tuyển với công việc · dịch vụ thực tế của công ty khiến người ta cảm nhận sự chân thành." },
            { title: "Luyện câu hỏi dự kiến", body: "Đừng chỉ nghĩ trong đầu về giới thiệu bản thân · động cơ · thế mạnh — hãy luyện nói to. Nói thực sự sẽ lộ ra chỗ vụng, và tạo cảm giác điều chỉnh độ dài khoảng 30 giây đến 1 phút. Luyện trước gương hay ghi âm điện thoại giúp kiểm tra cả biểu cảm và giọng điệu.", example: "Ví dụ giới thiệu bản thân:\n'Xin chào, em là △△ ứng tuyển vị trí ○○. Trong khi học □□ ở Hàn, em tích lũy kinh nghiệm ◇◇, và em ứng tuyển vì muốn phát huy năng lực ▽▽ đã học tại công ty này.'" },
            { title: "Xác nhận lộ trình · thời gian", body: "Hôm trước hãy xác nhận vị trí nơi phỏng vấn và thời gian di chuyển. Biết cả tuyến tàu điện · xe buýt, cửa ra, tầng tòa nhà giúp bạn không lạc trong ngày. Nếu là khu lạ, xuất phát sớm hơn dự kiến 20–30 phút là an toàn." }
          ]
        },
        {
          heading: "2. Đúng giờ",
          emoji: "⏰",
          summary: "Đúng giờ là niềm tin cơ bản nhất ở Hàn Quốc.",
          items: [
            { title: "Đến sớm 10 phút", body: "Đến trước giờ hẹn 10 phút là điều cơ bản. Vào quá sớm (từ 20–30 phút trở lên) có thể khiến đối phương khó xử, nên hãy chờ ở quán cà phê gần đó hay sảnh rồi đến quầy tiếp tân khoảng 10 phút trước. Đến thong thả cũng cho bạn thời gian trấn tĩnh.", tip: "Đến tòa nhà sớm, nhưng vào phòng phỏng vấn khoảng 10 phút trước là vừa." },
            { title: "Liên hệ ngay nếu trễ", body: "Nếu có thể trễ do giao thông..., nhất định liên hệ trước bằng điện thoại hay tin nhắn. Thành thật báo tình huống và giờ đến dự kiến tạo ấn tượng hoàn toàn khác với việc trễ không báo. Xử lý điềm tĩnh tự nó cũng có thể dẫn tới đánh giá tốt.", tip: "Trễ không báo là điểm trừ lớn bất kể năng lực." },
            { title: "Kiểm tra phỏng vấn online", body: "Với phỏng vấn video, kiểm tra link · camera · micro · internet ít nhất 10 phút trước. Tham gia ở nơi yên tĩnh, nền gọn gàng, dưới ánh sáng đủ để mặt hiện rõ. Lưu sẵn liên lạc người phỏng vấn phòng khi rớt mạng để yên tâm.", tip: "Dùng tai nghe có thể giảm vọng âm và tạp âm." },
            { title: "Chừa dư thời gian", body: "Đến sớm chút để chỉnh trang phục trong nhà vệ sinh và hít thở sâu thư giãn. Nhẩm nhẹ giới thiệu bản thân hay câu trả lời cốt lõi đã chuẩn bị trong lúc chờ giúp tăng tự tin. Chỉ cần vào phỏng vấn trong trạng thái thong thả cũng làm biểu cảm và giọng nói ổn định." }
          ]
        },
        {
          heading: "3. Thái độ trong phỏng vấn",
          emoji: "💬",
          summary: "Họ nhìn thái độ ngang với năng lực. Hãy tươi tắn và chân thành.",
          items: [
            { title: "Lời chào đầu tươi tắn", body: "Khi vào phòng phỏng vấn, chào với biểu cảm tươi và giao ánh mắt tự nhiên với người phỏng vấn. Ấn tượng vài giây đầu thường định đoạt không khí cả buổi. Ngồi sau khi được mời, giữ lưng thẳng và tư thế đẹp để trông tự tin.", example: "Ví dụ lời chào vào phòng:\n'Xin chào, cảm ơn quý vị đã cho em cơ hội phỏng vấn hôm nay. Em là △△ ứng tuyển vị trí ○○.'" },
            { title: "Lắng nghe · tôn trọng", body: "Trả lời sau khi nghe hết câu hỏi vừa là phép lịch sự vừa là khởi đầu câu trả lời tốt. Nếu lời chồng nhau, dừng một chút nhường đối phương, và nếu ý câu hỏi mơ hồ, xác nhận lịch sự bằng 'Ý anh/chị là như thế này phải không ạ?' cũng không sao. Gật đầu khi nghe thể hiện thái độ lắng nghe." },
            { title: "Trung thực", body: "Điều không biết đừng giả vờ biết — thành thật thừa nhận, nhưng thể hiện thái độ sẽ tiếp cận hay học thế nào. Câu trả lời bịa nhanh chóng lộ trong câu hỏi tiếp theo và làm mất niềm tin. Điểm mấu chốt là không dừng ở 'em không biết' mà thêm hướng như 'em sẽ tìm hiểu theo cách này'.", tip: "Câu trả lời như 'em chưa rõ lắm, nhưng em sẽ tiếp cận theo cách này' lại trông tốt.", example: "Ví dụ trả lời câu không biết:\n'Phần đó em chưa đi sâu nên khó nói chính xác. Tuy nhiên em sẽ tra tài liệu ○○ và tiếp cận theo cách △△ để học nhanh.'" },
            { title: "Trả lời nói kết luận trước", body: "Nói kết luận trước rồi chống đỡ bằng lý do và kinh nghiệm khiến câu trả lời truyền đạt tốt hơn nhiều. Trong phỏng vấn ở Hàn, câu trả lời càng dài càng dễ mất ý, nên mở đầu bằng cốt lõi có lợi hơn. Nhớ thứ tự 'kết luận → lý do → kinh nghiệm' giúp bạn không chao đảo trước bất kỳ câu hỏi nào.", example: "Ví dụ trả lời kết luận trước:\n'Thế mạnh lớn nhất của em là sự cẩn thận. Ở dự án trước, em rà lại dữ liệu và phát hiện lỗi từ sớm, nên cả trong việc lặp lại em cũng giảm được sai sót.'" },
            { title: "Chuẩn bị câu hỏi ngược", body: "Khi cuối buổi được hỏi 'Bạn có câu hỏi gì không?', hãy chuẩn bị và đặt một câu chứa đựng sự quan tâm thật với công ty và vị trí. Thay vì 'Không có', câu hỏi về sự phát triển hay cách làm việc thể hiện nhiệt huyết. Tuy vậy, tập trung vào công việc và phát triển thay vì chỉ hỏi lương · nghỉ phép để lại ấn tượng tốt.", example: "Ví dụ câu hỏi ngược:\n'Trong 3 tháng đầu sau khi vào làm, em nên tập trung nhất vào công việc gì ạ?'\n'Những người làm tốt ở đội này có điểm chung gì ạ?'" }
          ]
        },
        {
          heading: "4. Theo dõi sau phỏng vấn",
          emoji: "📧",
          summary: "Một chút chân thành sau khi kết thúc để lại ấn tượng.",
          items: [
            { title: "Email cảm ơn", body: "Gửi một lời cảm ơn ngắn sau phỏng vấn có thể giúp bạn được nhớ như ứng viên chân thành. Trong ngày hoặc ngày hôm sau, gửi gọn kèm lời cảm ơn cơ hội phỏng vấn và một hai câu về sự quan tâm với công ty. Email ngắn chứa chân thành tạo ấn tượng tốt hơn email dài.", tip: "Gửi gọn trong ngày hoặc ngày hôm sau.", example: "Ví dụ email cảm ơn:\nTiêu đề: [Vị trí ○○] Lời cảm ơn phỏng vấn - △△\n\nXin chào, em là △△ đã phỏng vấn hôm nay.\nEm chân thành cảm ơn quý vị đã dành thời gian quý báu giữa bận rộn.\nQua trao đổi, sự quan tâm của em với công việc ○○ càng lớn hơn.\nEm mong có cơ hội được cùng làm việc với kết quả tốt.\nEm cảm ơn." },
            { title: "Chờ kết quả", body: "Đừng giục kết quả — hãy chờ lịch sự đến lịch đã báo. Vì mỗi công ty cần thời gian rà soát nội bộ và thủ tục, liên hệ nôn nóng nhiều lần lại có thể gây gánh nặng. Hỏi lịch sự một lần sau khi qua hạn đã báo mà không có tin là vừa phải." },
            { title: "Tiếp nhận phản hồi", body: "Dù bị từ chối, đừng đắm trong thất vọng — hãy xem đó là cơ hội học để chuẩn bị cho lần sau. Nhìn lại câu trả lời nào còn thiếu chắc chắn cải thiện lần phỏng vấn sau. Mỗi trải nghiệm phỏng vấn tích lũy thành năng lực, nên thói quen phục dựng lại bất kể kết quả rất quan trọng." },
            { title: "Phép hồi đáp", body: "Khi nhận thông báo đậu hay lời mời, hãy trả lời càng nhanh và lịch sự càng tốt. Nếu cần thời gian suy nghĩ, báo một hạn như 'em sẽ trả lời trước lúc nào' là phép lịch sự. Dù đang so sánh với nơi khác, đừng để im không trả lời — giao tiếp lịch sự dựng nên niềm tin cơ bản của đời sống xã hội.", tip: "Ngay cả khi từ chối lời mời, báo lịch sự kèm cảm ơn là tốt." }
          ]
        },
        {
          heading: "5. Ấn tượng đầu tiên khi vào làm",
          emoji: "🌱",
          summary: "Khởi đầu tốt là đã xong một nửa. Hai tuần đầu định hình hình ảnh của bạn.",
          items: [
            { title: "Chào trước", body: "Khi đi làm, hãy chào tươi trước và nhanh chóng nhớ tên, mặt đồng nghiệp. Ở công sở Hàn, chỉ cần chào tốt cũng có thể tạo ấn tượng đầu 'niềm nở và lịch sự'. Nhớ và gọi tên giúp bạn thân với đồng nghiệp nhanh hơn nhiều.", tip: "Tốt là giữ lời chào 'Xin chào', 'Em xin phép về trước' khi đến và về." },
            { title: "Thái độ ham học", body: "Khi có điều không biết, đừng nhìn sắc mặt — hãy hỏi phù hợp và thể hiện ý muốn học. Là tân cử nhân hay ở giai đoạn đầu, ý muốn học được đánh giá cao hơn sự hoàn hảo. Tuy vậy, hỏi sau khi tự tìm hiểu điều mình có thể tra được sẽ được tin cậy hơn." },
            { title: "Giữ giờ · giữ lời hứa", body: "Giữ giờ đi làm và hạn chót công việc là nền tảng niềm tin cơ bản và quan trọng nhất. Trong văn hóa công sở Hàn, giữ giờ được coi là thước đo sự chăm chỉ của một người. Báo trước và điều chỉnh với lịch khó giữ cũng là thái độ trách nhiệm." },
            { title: "Thói quen ghi chú", body: "Học việc trong khi ghi chú giúp bạn thích nghi nhanh và được tin cậy. Ghi ngay nội dung được giao và quy trình để không hỏi cùng một điều hai lần giúp giảm sai sót. Lập sổ công việc riêng trở thành tài sản đáng tin để bạn tự tham khảo về sau.", tip: "Tốt là có thói quen ghi chú để không hỏi cùng một điều hai lần." }
          ]
        }
      ],
      quiz: [
        {
          question: "Thời gian đến phù hợp cho phỏng vấn là?",
          options: ["Đúng ngay giờ bắt đầu", "10 phút trước giờ hẹn", "Trễ 5 phút", "Vào sớm 1 tiếng"],
          answer: 1,
          explain: "Đến sớm 10 phút là cơ bản. Thay vì vào quá sớm, hãy chờ gần đó rồi vào."
        },
        {
          question: "Thái độ tốt khi gặp câu hỏi không biết trong phỏng vấn là?",
          options: ["Bịa ra như thể biết", "Thành thật thừa nhận và nêu cách tiếp cận", "Không nói gì", "Chuyển chủ đề"],
          answer: 1,
          explain: "Tốt là thành thật thừa nhận điều không biết và thể hiện ý muốn học cùng cách tiếp cận."
        },
        {
          question: "Cách theo dõi tốt sau khi phỏng vấn kết thúc là?",
          options: ["Giục kết quả mỗi ngày", "Gửi email cảm ơn ngắn gọn", "Không làm gì", "Gửi lời mời kết bạn mạng xã hội cho người phỏng vấn"],
          answer: 1,
          explain: "Email cảm ơn gọn gàng gửi trong ngày hoặc ngày hôm sau để lại ấn tượng tốt."
        },
        {
          question: "Điều cơ bản để tạo ấn tượng đầu tiên tốt sau khi vào làm là?",
          options: ["Giữ giờ · giữ lời và thái độ ham học", "Chỉ làm điều mình biết và không hỏi", "Trễ giờ cũng bù bằng năng lực", "Chỉ dựa vào trí nhớ mà không ghi chú"],
          answer: 0,
          explain: "Đúng giờ và thái độ ham học là cơ bản nhất."
        }
      ]
    },
    ja: {
      id: "w4s4",
      emoji: "🤝",
      title: "面接マナー＆入社マナー",
      intro:
        "面接の準備から態度、フォローアップ、入社の第一印象まで詳しく学びます。準備した実力を余さず見せられるようにします。最後のクイズで確認しましょう。",
      objectives: [
        "面接の服装や時間厳守など基本マナーを知る",
        "面接中の態度と回答のコツを理解する",
        "面接後のフォローアップ（お礼メール）の方法を知る",
        "入社の第一印象を良くする方法を知る"
      ],
      sections: [
        {
          heading: "1. 面接前の準備",
          emoji: "🎒",
          summary: "準備こそ自信です。前日までに前もって整えましょう。",
          items: [
            { title: "服装", body: "韓国の面接では、端正なスーツやビジネスカジュアルが無難です。派手な色や過度なアクセサリーより、清潔で整った印象が信頼を与えます。前夜に服をアイロンして掛けておけば、朝に慌てずに済みます。", tip: "会社の雰囲気が分からなければ、少し端正なほうが安全です。" },
            { title: "会社・職務の調査", body: "会社と職務を前もって調べると、回答の深さがまるで変わります。ホームページ・募集要項・最近のニュースに目を通し、この会社が何をし自分が何をするのか整理しておけば、面接官の質問に具体的に答えられます。『なぜうちの会社ですか？』への最良の備えです。", tip: "志望動機を会社の実際の事業・サービスと結びつけると、誠実さが伝わります。" },
            { title: "予想質問の練習", body: "自己紹介・志望動機・強みは頭の中だけで考えず、声に出して練習しましょう。実際に言ってみると不自然な部分が見え、30秒〜1分ほどに長さを調整する感覚もつきます。鏡の前やスマホ録音で練習すると、表情や口調まで点検できます。", example: "自己紹介の例：\n『こんにちは、○○職に応募した△△です。韓国で□□を学びながら◇◇の経験を積み、そこで学んだ▽▽の力をこの会社で発揮したく応募しました。』" },
            { title: "経路・時間の確認", body: "面接会場の場所と所要時間を前日に確認しましょう。地下鉄・バスの経路と出口、建物の階数まで把握しておけば当日に迷いません。不慣れな地域なら、予想時間より20〜30分の余裕をもって出発すると安全です。" }
          ]
        },
        {
          heading: "2. 時間厳守",
          emoji: "⏰",
          summary: "時間厳守は韓国で最も基本的な信頼です。",
          items: [
            { title: "10分前に到着", body: "約束時間の10分前到着が基本です。早すぎ（20〜30分以上）に入ると相手がかえって負担に感じかねないので、近くのカフェやロビーで待ち、10分前ごろに受付へ着くとよいです。余裕ある到着は気持ちを整える時間も与えます。", tip: "建物には早めに着き、面接室への入室は10分前が適当です。" },
            { title: "遅れるときは即連絡", body: "交通事情などで遅れそうなら、必ず前もって電話や文字で連絡しましょう。状況を正直に知らせ予想到着時間を伝えれば、無断遅刻とはまったく違う印象を与えます。落ち着いて対応する姿自体が良い評価につながることもあります。", tip: "無断遅刻は実力と無関係に大きな減点です。" },
            { title: "オンライン面接の点検", body: "ビデオ面接はリンク・カメラ・マイク・ネットを最低10分前に点検します。静かで背景が整った場所で、顔がよく見えるよう明るい照明の下で参加するとよいです。接続が切れる場合に備え、面接官の連絡先を前もって保存しておくと安心です。", tip: "イヤホンを使うと音の反響や雑音を減らせます。" },
            { title: "余裕をもって", body: "少し早めに着き、トイレで身だしなみを整え深呼吸で緊張をほぐしましょう。待ち時間に準備した自己紹介や核心の回答を軽く唱えると自信がつきます。慌てない状態で面接に入るだけで、表情と声が安定します。" }
          ]
        },
        {
          heading: "3. 面接中の態度",
          emoji: "💬",
          summary: "実力と同じくらい態度を見ます。明るく率直に。",
          items: [
            { title: "明るい第一挨拶", body: "面接室に入ったら明るい表情で挨拶し、面接官と自然に目を合わせます。最初の数秒の印象が面接全体の雰囲気を左右することが多いです。座るよう案内されてから座り、背筋を伸ばして正しい姿勢を保つと自信があるように見えます。", example: "入場挨拶の例：\n『こんにちは、本日は面接の機会をいただきありがとうございます。○○職に応募した△△です。』" },
            { title: "傾聴・尊重", body: "質問を最後まで聞いてから答えるのが礼儀であり良い回答の始まりです。言葉が重なったら少し止まって相手に譲り、質問の意図が紛らわしければ『こういう意味でお伺いされたのでしょうか？』と丁寧に確認しても構いません。うなずきながら聞く姿は傾聴の態度を示します。" },
            { title: "率直さ", body: "分からないことは知ったふりをせず率直に認めつつ、どう取り組むか・学ぶかの姿勢を一緒に見せます。作り話の答えは追加質問ですぐ露見し、かえって信頼を失います。分からないで終えず『このように調べます』という方向を添えるのが肝心です。", tip: "『よく分かりませんが、このように取り組みます』という答えのほうがかえって良く見えます。", example: "分からない質問への答え方の例：\n『その部分はまだ深く扱ったことがなく正確には申し上げにくいです。ただ○○の資料を調べ、△△の方法で取り組んで素早く身につけます。』" },
            { title: "結論から言う回答", body: "結論を先に言い、その後に根拠と経験で裏づけると伝達力がずっと良くなります。韓国の面接では回答が長くなるほど要点を逃しやすいので、核心を前に出す習慣が有利です。『結論→理由→経験』の順を覚えれば、どんな質問にも揺らぎません。", example: "結論から言う回答の例：\n『私の最大の強みは丁寧さです。以前のプロジェクトでデータを再検討して誤りを事前に見つけた経験があり、反復業務でもミスを減らせます。』" },
            { title: "逆質問の準備", body: "最後に『質問はありますか？』と聞かれたら、会社と職務への本当の関心を込めた質問を準備して尋ねましょう。『ありません』より、成長や仕事の進め方についての質問が熱意を示します。ただし給与・休暇ばかり聞くより、仕事と成長に焦点を当てるほうが良い印象を残します。", example: "逆質問の例：\n『入社後の最初の3か月で最も集中すべき業務は何でしょうか？』\n『このチームで良い成果を出す方には、どんな共通点がありますか？』" }
          ]
        },
        {
          heading: "4. 面接後のフォローアップ",
          emoji: "📧",
          summary: "終わった後の小さな心遣いが印象を残します。",
          items: [
            { title: "お礼メール", body: "面接後に短くお礼を送ると、誠意ある応募者として記憶されることがあります。当日か翌日中に、面接の機会への感謝と会社への関心を一、二文添えて簡潔に送りましょう。長く書くより真心のこもった短いメールのほうが良い印象を与えます。", tip: "当日〜翌日中に、簡潔に送りましょう。", example: "お礼メールの例：\n件名：[○○職]面接のお礼 - △△\n\nこんにちは、本日面接に参加した△△です。\nお忙しい中、貴重なお時間をいただき心より感謝申し上げます。\nお話しするなかで○○業務への関心がいっそう高まりました。\n良い結果でご一緒できることを楽しみにしております。\nありがとうございました。" },
            { title: "結果を待つ", body: "結果は急かさず、案内された日程まで丁寧に待ちましょう。会社ごとに内部審査や手続きに時間がかかるので、焦って何度も連絡するとかえって負担を与えかねません。案内された期限が過ぎても連絡がないとき、一度丁寧に問い合わせる程度が適当です。" },
            { title: "フィードバックの受容", body: "不合格でも失望にとどまらず、学びの機会として次に備えましょう。どの回答が惜しかったか自分で振り返れば、次の面接で必ず良くなります。面接経験一つ一つが積もって実力になるので、結果に関係なく復習する習慣が大切です。" },
            { title: "返信マナー", body: "合格や内定の連絡を受けたら、できるだけ速く丁寧に答えましょう。考える時間が必要なら『いつまでにお返事します』と期限を知らせるのが礼儀です。他と比較中でも無返信のままにせず、丁寧なやり取りが社会生活の基本的な信頼を作ります。", tip: "内定を辞退するときも、感謝とともに丁寧に知らせるのがよいです。" }
          ]
        },
        {
          heading: "5. 入社の第一印象",
          emoji: "🌱",
          summary: "始まりが半分です。最初の2週間がイメージを作ります。",
          items: [
            { title: "先に挨拶", body: "出勤したらまず明るく挨拶し、同僚の名前と顔を早く覚えましょう。韓国の職場では挨拶が良いだけでも『さっぱりして礼儀正しい』という良い第一印象を得られます。名前を覚えて呼べば、同僚とずっと早く親しくなれます。", tip: "出勤・退勤時に『こんにちは』『お先に失礼します』の挨拶を欠かさないとよいです。" },
            { title: "学ぶ姿勢", body: "分からないことがあれば空気を読まず、適切に質問して学ぼうとする態度を見せましょう。新人や入社初期は完璧さより学ぼうとする姿勢のほうが良く評価されます。ただし自分で調べられることは先に調べてから質問すると、より信頼を得られます。" },
            { title: "時間・約束を守る", body: "出勤時間と業務締切の約束を守ることが、最も基本的で重要な信頼の土台です。韓国の職場文化で時間厳守はその人の誠実さを示す尺度と見なされます。守りにくい予定は前もって知らせて調整するのも責任感ある態度です。" },
            { title: "メモの習慣", body: "仕事を学ぶときメモしながら身につけると、素早く適応し信頼を得られます。同じことを二度聞かないよう、指示された内容や手順をその都度書いておくとミスが減ります。自分だけの業務ノートを作れば、後で自分が参照できる頼もしい資産になります。", tip: "同じことを二度聞かないよう、メモする習慣がよいです。" }
          ]
        }
      ],
      quiz: [
        {
          question: "面接の到着時間として適切なのは？",
          options: ["ちょうど開始時間に", "約束時間の10分前", "5分遅れて", "1時間早く入室"],
          answer: 1,
          explain: "10分前到着が基本です。早すぎに入室せず、近くで待ってから入りましょう。"
        },
        {
          question: "面接で分からない質問を受けたときの良い態度は？",
          options: ["知ったふりで作り話をする", "率直に認めて取り組み方を言う", "何も言わない", "話題をそらす"],
          answer: 1,
          explain: "分からないことは率直に認め、学ぼうとする姿勢と取り組み方を見せるのがよいです。"
        },
        {
          question: "面接が終わった後の良いフォローアップは？",
          options: ["毎日結果を急かす", "短いお礼メールを送る", "何もしない", "面接官にSNSの友達申請"],
          answer: 1,
          explain: "当日〜翌日中に送る簡潔なお礼メールが良い印象を残します。"
        },
        {
          question: "入社後の第一印象を良くする基本は？",
          options: ["時間・約束を守り学ぼうとする姿勢", "分かることだけして質問しない", "遅刻しても実力で挽回", "メモせず記憶だけに頼る"],
          answer: 0,
          explain: "時間厳守と学ぼうとする態度が最も基本です。"
        }
      ]
    },
    id: {
      id: "w4s4",
      emoji: "🤝",
      title: "Etika Wawancara & Tata Krama Masuk Kerja",
      intro:
        "Pelajari secara rinci semuanya dari persiapan wawancara hingga sikap, tindak lanjut, dan kesan pertama saat kamu masuk kerja. Ini memungkinkanmu menampilkan sepenuhnya kemampuan yang sudah disiapkan. Periksa dirimu dengan kuis di akhir.",
      objectives: [
        "Mengetahui tata krama dasar seperti pakaian wawancara dan ketepatan waktu",
        "Memahami sikap dan kiat menjawab selama wawancara",
        "Mengetahui cara menindaklanjuti setelah wawancara (email terima kasih)",
        "Mengetahui cara membuat kesan pertama yang baik saat masuk kerja"
      ],
      sections: [
        {
          heading: "1. Bersiap Sebelum Wawancara",
          emoji: "🎒",
          summary: "Persiapan itu sendiri adalah kepercayaan diri. Siapkan sejak hari sebelumnya.",
          items: [
            { title: "Pakaian", body: "Untuk wawancara Korea, setelan rapi atau business casual itu aman. Ketimbang warna mencolok atau aksesori berlebihan, kesan bersih dan tertata memberi kepercayaan. Menyetrika dan menggantung baju malam sebelumnya membuatmu tak terburu-buru di pagi hari.", tip: "Jika tak tahu suasana perusahaan, sisi yang sedikit lebih formal lebih aman." },
            { title: "Meneliti perusahaan dan posisi", body: "Meneliti perusahaan dan posisi lebih dulu benar-benar mengubah kedalaman jawabanmu. Baca sekilas beranda, lowongan, berita terbaru, dan rangkum apa yang dilakukan perusahaan serta apa yang akan kamu kerjakan, agar bisa menjawab pertanyaan pewawancara secara konkret. Ini cara terbaik menyiapkan diri untuk 'Kenapa perusahaan kami?'", tip: "Menghubungkan motivasi dengan bisnis · layanan nyata perusahaan menyampaikan ketulusan." },
            { title: "Berlatih pertanyaan yang mungkin", body: "Jangan hanya memikirkan perkenalan diri · motivasi · kelebihan di kepala — latih dengan bersuara. Benar-benar mengucapkannya menyingkap bagian yang janggal, dan membangun kepekaan menyesuaikan panjang sekitar 30 detik hingga 1 menit. Berlatih di depan cermin atau dengan rekaman ponsel memungkinkanmu memeriksa ekspresi dan nada juga.", example: "Contoh perkenalan diri:\n'Halo, saya △△ yang melamar posisi ○○. Selama belajar □□ di Korea, saya membangun pengalaman ◇◇, dan saya melamar karena ingin memanfaatkan kompetensi ▽▽ yang saya pelajari di perusahaan ini.'" },
            { title: "Memeriksa rute · waktu", body: "Periksa lokasi wawancara dan berapa lama menuju ke sana pada hari sebelumnya. Mengetahui rute subway/bus dan pintu keluar, serta lantai gedung, membuatmu tak tersesat di hari-H. Jika daerahnya asing, berangkat dengan jeda 20–30 menit di atas perkiraan itu aman." }
          ]
        },
        {
          heading: "2. Ketepatan Waktu",
          emoji: "⏰",
          summary: "Tepat waktu adalah bentuk kepercayaan paling dasar di Korea.",
          items: [
            { title: "Datang 10 menit lebih awal", body: "Datang 10 menit sebelum waktu yang dijanjikan itu dasar. Masuk terlalu awal (20–30 menit atau lebih) justru bisa membuat pihak lain tak nyaman, jadi tunggu di kafe terdekat atau lobi lalu tiba di resepsionis sekitar 10 menit sebelumnya. Kedatangan yang tak tergesa juga memberimu waktu menenangkan diri.", tip: "Tiba di gedung lebih awal, tetapi masuk ruang wawancara 10 menit sebelumnya itu pas." },
            { title: "Segera hubungi jika terlambat", body: "Jika akan terlambat karena lalu lintas dsb., pastikan menghubungi lebih dulu lewat telepon atau pesan. Menyampaikan situasi dengan jujur dan memberi perkiraan waktu tiba memberi kesan yang benar-benar berbeda dari keterlambatan tanpa kabar. Menanganinya dengan tenang sendiri pun bisa berujung pada penilaian baik.", tip: "Keterlambatan tanpa kabar adalah minus besar terlepas dari kemampuan." },
            { title: "Periksa untuk wawancara online", body: "Untuk wawancara video, periksa tautan, kamera, mikrofon, dan internet setidaknya 10 menit sebelumnya. Bergabunglah di tempat tenang dengan latar rapi, di bawah pencahayaan terang agar wajahmu jelas terlihat. Menyimpan kontak pewawancara lebih dulu untuk berjaga jika koneksi putus memberi ketenangan.", tip: "Memakai earphone dapat mengurangi gema dan kebisingan latar." },
            { title: "Beri ruang", body: "Datang sedikit lebih awal untuk merapikan penampilan di toilet dan meredakan gugup dengan tarikan napas dalam. Melafalkan ringan perkenalan diri atau jawaban inti yang telah disiapkan selama menunggu membangun kepercayaan diri. Sekadar masuk wawancara dalam keadaan tak tergesa menstabilkan ekspresi dan suaramu." }
          ]
        },
        {
          heading: "3. Sikap Selama Wawancara",
          emoji: "💬",
          summary: "Mereka menilai sikap sebesar kemampuan. Ceria dan tulus.",
          items: [
            { title: "Salam pertama yang ceria", body: "Saat masuk ruang wawancara, sapa dengan ekspresi ceria dan lakukan kontak mata secara alami dengan para pewawancara. Kesan beberapa detik pertama sering menentukan suasana seluruh wawancara. Duduklah setelah dipersilakan, dan jaga punggung tegak serta postur baik agar tampak percaya diri.", example: "Contoh salam masuk:\n'Halo, terima kasih atas kesempatan wawancara hari ini. Saya △△ yang melamar posisi ○○.'" },
            { title: "Mendengarkan · menghormati", body: "Menjawab setelah mendengarkan pertanyaan sampai akhir adalah kesopanan sekaligus awal jawaban yang baik. Jika ucapan bertumpang tindih, berhenti sejenak dan mengalah pada lawan, dan jika maksud pertanyaan tak jelas, boleh menegaskan dengan sopan 'Apakah maksud Anda seperti ini?' Mengangguk sambil mendengarkan menunjukkan sikap menyimak." },
            { title: "Kejujuran", body: "Jangan berpura-pura tahu apa yang tak kamu ketahui — akui dengan jujur, tetapi tunjukkan sikap bagaimana kamu akan mendekatinya atau belajar. Jawaban yang dikarang cepat terbongkar dalam pertanyaan lanjutan dan malah kehilangan kepercayaan. Kuncinya bukan berhenti di 'saya tidak tahu' melainkan menambahkan arah seperti 'saya akan mencari tahu dengan cara ini'.", tip: "Jawaban seperti 'saya kurang tahu, tetapi saya akan mendekatinya begini' justru terlihat baik.", example: "Contoh menjawab pertanyaan yang tak diketahui:\n'Bagian itu belum saya dalami sehingga sulit menjawab dengan pasti. Namun saya akan mencari bahan ○○ dan mendekatinya lewat △△ untuk cepat menguasainya.'" },
            { title: "Jawaban kesimpulan dulu", body: "Menyatakan kesimpulan lebih dulu lalu menopangnya dengan alasan dan pengalaman membuatnya jauh lebih komunikatif. Dalam wawancara Korea, makin panjang jawaban makin mudah kehilangan poin, jadi mengedepankan inti itu menguntungkan. Mengingat urutan 'kesimpulan → alasan → pengalaman' membuatmu tak goyah untuk pertanyaan apa pun.", example: "Contoh jawaban kesimpulan dulu:\n'Kelebihan terbesar saya adalah kecermatan. Di proyek sebelumnya, saya memeriksa ulang data dan menangkap kesalahan sejak awal, sehingga dapat mengurangi kesalahan bahkan dalam pekerjaan berulang.'" },
            { title: "Menyiapkan pertanyaanmu sendiri", body: "Saat ditanya 'Ada pertanyaan?' di akhir, siapkan dan ajukan pertanyaan yang membawa minat tulus terhadap perusahaan dan posisi. Ketimbang 'Tidak ada', pertanyaan tentang pertumbuhan atau cara kerja menunjukkan antusiasme. Meski begitu, berfokus pada pekerjaan dan pertumbuhan alih-alih hanya menanyakan gaji dan cuti meninggalkan kesan baik.", example: "Contoh pertanyaan balik:\n'Pekerjaan apa yang paling harus saya fokuskan dalam 3 bulan pertama setelah masuk?'\n'Apa kesamaan orang-orang yang berkinerja baik di tim ini?'" }
          ]
        },
        {
          heading: "4. Menindaklanjuti Setelah Wawancara",
          emoji: "📧",
          summary: "Sedikit ketulusan setelah selesai meninggalkan kesan.",
          items: [
            { title: "Email terima kasih", body: "Mengirim ucapan terima kasih singkat setelah wawancara dapat membantumu diingat sebagai pelamar yang sungguh-sungguh. Dalam hari yang sama atau esoknya, kirim secara ringkas dengan terima kasih atas kesempatan wawancara dan satu-dua kalimat minat pada perusahaan. Email pendek yang tulus memberi kesan lebih baik ketimbang yang panjang.", tip: "Kirim secara ringkas dalam hari yang sama atau esoknya.", example: "Contoh email terima kasih:\nSubjek: [posisi ○○] Ucapan terima kasih wawancara - △△\n\nHalo, saya △△ yang berwawancara hari ini.\nSaya tulus berterima kasih atas waktu berharga yang Anda luangkan di tengah kesibukan.\nBerbincang dengan Anda memperdalam minat saya pada pekerjaan ○○.\nSaya menantikan kesempatan bekerja bersama dengan hasil yang baik.\nTerima kasih." },
            { title: "Menunggu hasil", body: "Jangan mendesak hasil — tunggu dengan sopan sampai jadwal yang diumumkan. Karena tiap perusahaan butuh waktu untuk tinjauan dan prosedur internal, menghubungi berkali-kali dengan cemas justru bisa membebani. Bertanya dengan sopan sekali setelah tenggat yang diumumkan lewat tanpa kabar itu takaran yang pas." },
            { title: "Menerima umpan balik", body: "Meski ditolak, jangan berlarut dalam kekecewaan — jadikan itu kesempatan belajar untuk bersiap kali berikutnya. Merenungkan jawaban mana yang kurang pasti memperbaiki wawancaramu berikutnya. Tiap pengalaman wawancara menumpuk menjadi kemampuan, jadi kebiasaan meninjau ulang terlepas dari hasil itu penting." },
            { title: "Etika membalas", body: "Ketika mendapat kelulusan atau tawaran, balas secepat dan sesopan mungkin. Jika butuh waktu berpikir, memberi tahu tenggat seperti 'saya akan membalas sebelum kapan' adalah kesopanan. Meski sedang membandingkan dengan tempat lain, jangan biarkan tanpa jawaban — komunikasi yang sopan membangun kepercayaan dasar kehidupan sosial.", tip: "Bahkan saat menolak tawaran, memberi tahu dengan sopan disertai terima kasih itu baik." }
          ]
        },
        {
          heading: "5. Kesan Pertama Saat Masuk Kerja",
          emoji: "🌱",
          summary: "Awal yang baik sudah separuh jalan. Dua minggu pertama membentuk citramu.",
          items: [
            { title: "Menyapa lebih dulu", body: "Saat tiba di kantor, sapa dengan ceria lebih dulu dan cepat hafalkan nama serta wajah rekan. Di tempat kerja Korea, menyapa dengan baik saja bisa memberi kesan pertama 'ramah dan sopan'. Mengingat dan menyebut nama membuatmu jauh lebih cepat akrab dengan rekan.", tip: "Baik menjaga sapaan 'Halo' dan 'Saya pamit dulu' saat datang dan pulang." },
            { title: "Sikap mau belajar", body: "Saat ada yang tak diketahui, jangan membaca situasi — bertanyalah dengan tepat dan tunjukkan kemauan belajar. Sebagai fresh graduate atau di masa awal, kemauan belajar lebih dinilai ketimbang kesempurnaan. Meski begitu, bertanya setelah lebih dulu mencari sendiri yang bisa kamu temukan lebih memperoleh kepercayaan." },
            { title: "Menjaga waktu · janji", body: "Menjaga waktu masuk dan tenggat pekerjaan adalah fondasi kepercayaan yang paling dasar dan penting. Dalam budaya kerja Korea, menjaga waktu dianggap tolok ukur ketekunan seseorang. Memberi tahu dan menyesuaikan lebih dulu untuk jadwal yang sulit ditepati juga sikap bertanggung jawab." },
            { title: "Kebiasaan mencatat", body: "Mempelajari tugas sambil mencatat membuatmu cepat beradaptasi dan memperoleh kepercayaan. Menuliskan instruksi dan prosedur di tempat agar tak menanyakan hal yang sama dua kali mengurangi kesalahan. Membuat buku catatan kerja sendiri menjadi aset andal yang bisa kamu rujuk sendiri kelak.", tip: "Baik memiliki kebiasaan mencatat agar tak menanyakan hal yang sama dua kali." }
          ]
        }
      ],
      quiz: [
        {
          question: "Waktu tiba yang tepat untuk wawancara adalah?",
          options: ["Tepat pada waktu mulai", "10 menit sebelum waktu yang dijanjikan", "Terlambat 5 menit", "Masuk 1 jam lebih awal"],
          answer: 1,
          explain: "Datang 10 menit lebih awal itu dasar. Ketimbang masuk terlalu awal, tunggu di dekat sana lalu masuk."
        },
        {
          question: "Sikap yang baik saat mendapat pertanyaan yang tak diketahui dalam wawancara adalah?",
          options: ["Mengarang seolah tahu", "Mengakui dengan jujur dan menyatakan pendekatanmu", "Diam saja", "Mengalihkan topik"],
          answer: 1,
          explain: "Baik mengakui dengan jujur yang tak diketahui dan menunjukkan kemauan belajar serta pendekatanmu."
        },
        {
          question: "Tindak lanjut yang baik setelah wawancara selesai adalah?",
          options: ["Mendesak hasil setiap hari", "Mengirim email terima kasih singkat", "Tidak melakukan apa pun", "Mengirim permintaan pertemanan media sosial ke pewawancara"],
          answer: 1,
          explain: "Email terima kasih ringkas yang dikirim dalam hari yang sama atau esoknya meninggalkan kesan baik."
        },
        {
          question: "Dasar untuk membuat kesan pertama yang baik setelah masuk kerja adalah?",
          options: ["Menjaga waktu/janji dan kemauan belajar", "Hanya mengerjakan yang diketahui dan tak bertanya", "Menebus keterlambatan dengan kemampuan", "Hanya mengandalkan ingatan tanpa mencatat"],
          answer: 0,
          explain: "Ketepatan waktu dan kemauan belajar adalah yang paling dasar."
        }
      ]
    }
  },
  "w4-apply": {
    en: {
      id: "w4-apply",
      emoji: "🚀",
      title: "How to Apply on Your Own",
      intro:
        "Once you've finished your resume, cover letter, and interview prep, it's now time to apply yourself. We've organized where international students find postings, which companies are open to visa support, and how to apply strategically. Check yourself with the quiz at the end.",
      objectives: [
        "Know where to find job postings you can apply to as a foreigner",
        "Know how to identify companies open to supporting work visas like E-7",
        "Understand the application strategy and order that raise your acceptance rate",
        "Have a checklist to review one last time before applying"
      ],
      sections: [
        {
          heading: "1. Find Postings Here",
          emoji: "🔎",
          summary: "Each channel has different strengths. The key is picking two or three and checking them consistently.",
          items: [
            { title: "General job platforms", body: "Saramin, JobKorea, Wanted, and LinkedIn are the leading ones. Wanted and LinkedIn have many startup, foreign, and IT roles, and English postings appear often, making them especially favorable for foreign applicants. Setting alerts with your target-job keywords keeps you from missing new postings.", tip: "Searching keywords like 'global', 'English', 'foreigner' surfaces postings with lower barriers." },
            { title: "Channels specialized for foreigners/students", body: "Don't miss channels that specialize in hiring foreigners, and your university's international office and career center postings. School career centers often announce job fairs and internship info for international students first, so registering lets you receive good opportunities ahead of others.", tip: "If you're enrolled, be sure to sign up for your school's international office / career center mailing list." },
            { title: "Applying directly on company career pages", body: "If there's a clear company you want to join, applying directly on that company's Careers page is also good. There are often rolling openings not posted on platforms, and you can better show your interest in the company.", example: "e.g. Pick 5 companies of interest, bookmark their career pages, and check for new postings once every 2 weeks." },
            { title: "Job fairs and networking", body: "Job fairs for foreigners (K-Move, foreigner recruitment fairs, etc.) and LinkedIn networking are good channels too. Asking current employees about the role or getting a referral noticeably raises your chance of passing the document screening.", tip: "On LinkedIn, politely message a current employee in the same role and ask for a coffee chat." }
          ]
        },
        {
          heading: "2. Identifying Companies Open to Visa Support",
          emoji: "🛂",
          summary: "For foreigner hiring, the 'visa sponsor' is key. Be sure to check before applying.",
          items: [
            { title: "What the E-7 (Specific Activities) visa is", body: "The most common work visa when a student takes a professional job after graduation is the E-7. It must be a role related to your major/experience, and the company has to prepare the documents needed for the visa together with you. That's why whether the company 'has experience hiring foreigners' matters.", tip: "The stronger the link between your major and the job, the more favorable for E-7 approval — that's why the Week 1 job selection was important." },
            { title: "Reading signals in postings", body: "If a posting has phrases like 'foreigners may apply', 'visa sponsorship provided', or 'visa support', it's a green light. Conversely, conditions like 'Koreans only' or 'military service completed' may make applying difficult. If it's ambiguous, it's fine to politely inquire with the hiring manager before applying.", example: "Inquiry example:\n'I'd like to ask whether this position is open to foreign (E-7 visa) applicants as well.'" },
            { title: "Places open to foreigner hiring", body: "Foreign companies, IT/startups doing global business, trade/logistics, and roles requiring multiple languages are relatively open to hiring foreigners. Aiming for roles where your language/culture strength is 'needed' rather than merely 'nice to have' boosts your competitiveness.", tip: "For multilingual, localization, and global sales roles, an international student's strength becomes the very reason for hiring." },
            { title: "Check visa requirements in advance", body: "Checking your visa status (period of stay, D-2/D-10, etc.) and E-7 conversion requirements at the same time you apply makes the post-acceptance process smooth. Grasp the needed documents via HiKorea and the Immigration Office guidance.", tip: "If you're about to graduate, also learn about securing your stay period with a job-seeking (D-10) visa." }
          ]
        },
        {
          heading: "3. Apply Strategically",
          emoji: "🎯",
          summary: "Rather than blindly applying to many, apply carefully to the right places. And consistently.",
          items: [
            { title: "Customization raises your acceptance rate", body: "Rather than sending the same resume and cover letter as-is, tweaking your motivation and strengths to match the posting's requirement keywords raises your pass rate. Just slightly adjusting the items you built in Week 3 for each posting is enough.", tip: "Match the posting's 'requirements/preferred qualifications' sentences to the wording in your resume." },
            { title: "Building an application portfolio", body: "Applying to a mix of 'reach' companies you want, realistic 'target' companies, and 'safe' companies with a high chance of acceptance is psychologically steadying and widens your opportunities. Don't cling to one place — prepare along several tracks.", example: "e.g. Split into about 2 reach · 3 target · 2 safe and prepare them simultaneously." },
            { title: "Manage by keeping records", body: "Managing where and when you applied, along with deadlines and stages, in a table keeps you from missing things. Seeing your application status at a glance also makes clear what to prepare next.", tip: "Note the company, role, application date, deadline, and status in a simple spreadsheet." },
            { title: "Keep going even after rejection", body: "A rejection is often not a lack of ability but simply 'not a fit for that spot.' If there's feedback, apply it; if not, review on your own and keep going with the next application. Consistency ultimately leads to acceptance.", tip: "Note just one regret from a place you were rejected and reflect it in your next application." }
          ]
        },
        {
          heading: "4. Final Checklist Before Applying",
          emoji: "✅",
          summary: "Before you press the submit button, check these items.",
          items: [
            { title: "Document check", body: "Check that no typos or old company names remain in your resume and cover letter, and that you've tailored them to the posting's role. Name the file clearly, like 'Name_Role_Resume', and save it as a PDF so the format doesn't break when you send it.", tip: "Reading it aloud once before submitting makes awkward sentences and typos stand out." },
            { title: "Comparing against requirements", body: "Check once more whether you meet the posting's required qualifications, and whether there's anything among the preferred qualifications worth emphasizing. Even if you lack a requirement, you can reveal a strength in your application that makes up for it." },
            { title: "Checking visa and contact", body: "Check whether you've confirmed foreigner-application eligibility and visa requirements, and that the email and phone number on your resume are correct. Make sure you don't miss an opportunity because you couldn't be reached.", tip: "Check notifications and email often so you don't miss the interview contact." },
            { title: "Deadline and follow-up prep", body: "Submit with room before the deadline, and after applying, prepare the next step with likely interview questions (Step 2) and a mock interview (Step 3). Applying isn't the end — it's the start of interview prep." }
          ]
        }
      ],
      quiz: [
        {
          question: "Which channel is especially favorable for an international student to find postings?",
          options: ["Anywhere is fine", "Channels with many IT/foreign roles like Wanted and LinkedIn", "Wait without applying", "Newspaper classified ads"],
          answer: 1,
          explain: "Wanted and LinkedIn have many startup, foreign, and English postings, which is favorable for foreign applicants."
        },
        {
          question: "Which phrase can be seen as a 'green light' signal in a posting?",
          options: ["Koreans only", "Visa sponsorship provided / visa support", "Military service completed", "Not applicable"],
          answer: 1,
          explain: "Phrases like 'foreigners may apply' and 'visa sponsorship provided' signal openness to hiring foreigners."
        },
        {
          question: "Which application method raises your acceptance rate?",
          options: ["Blast the same documents as widely as possible", "Tweak motivation/strengths to match the posting keywords", "Keep applying to only one company", "Submit hastily right before the deadline"],
          answer: 1,
          explain: "Customizing your documents to match the posting's requirements raises your pass rate."
        },
        {
          question: "Which work visa do international students commonly convert to when getting a job?",
          options: ["D-2 (study)", "E-7 (specific activities)", "B-2 (tourism)", "None"],
          answer: 1,
          explain: "For a professional job related to your major/role, the E-7 visa is most common, and the company's support is needed."
        }
      ]
    },
    "zh-CN": {
      id: "w4-apply",
      emoji: "🚀",
      title: "自己申请的方法",
      intro:
        "简历、自我介绍书、面试准备都完成了，现在轮到你亲自申请了。我们整理了外国留学生在哪里找公告、哪些公司对签证支持持开放态度，以及如何有策略地申请。最后用测验检验自己。",
      objectives: [
        "了解外国人可申请的招聘公告在哪里找",
        "了解甄别对E-7等就业签证支持持开放态度的企业的方法",
        "理解提高合格率的申请策略与顺序",
        "备好申请前最后核对的检查清单"
      ],
      sections: [
        {
          heading: "1. 公告在这里找",
          emoji: "🔎",
          summary: "各渠道强项不同。关键是选定两三处并持续关注。",
          items: [
            { title: "综合招聘平台", body: "Saramin、JobKorea、Wanted、领英是代表。Wanted和领英上初创企业·外资·IT职群较多，英语公告也常见，对外国申请者尤为有利。用关心的职务关键词设好提醒，就不会错过新公告。", tip: "用‘global’‘English’‘外国人’关键词搜索，容易搜到门槛较低的公告。" },
            { title: "外国人·留学生专属渠道", body: "别错过专门处理外国人招聘的渠道，以及大学国际处·就业中心的公告。学校就业中心常会先向留学生通报招聘说明会·实习信息，登记后就能抢先获得好机会。", tip: "在校的话，务必申请学校国际处·就业中心的邮件订阅。" },
            { title: "在公司招聘页面直接申请", body: "若有明确想去的公司，在该公司招聘（Careers）页面直接申请也不错。常有未登上平台的常招职位，也更能表现出你对公司的关注。", example: "例）选定5家关心的企业，收藏其招聘页面，每两周确认一次新公告。" },
            { title: "招聘博览会·社交拓展", body: "面向外国人的招聘会（K-Move、外国人招聘博览会等）和领英社交拓展也是好通道。向在职者请教职务或获得内推（推荐），能明显提高简历通过率。", tip: "在领英上向同一职务的在职者礼貌发消息，约一次咖啡聊天。" }
          ]
        },
        {
          heading: "2. 甄别对签证支持持开放态度的公司",
          emoji: "🛂",
          summary: "外国人招聘中，‘签证担保’是关键。申请前务必确认。",
          items: [
            { title: "何为E-7（特定活动）签证", body: "留学生毕业后从事专业职务就业时，最常见的就业签证是E-7。必须是与专业·经历相关的职务，且公司要一同准备签证所需的文件。因此‘是否有外国人招聘经验的公司’很重要。", tip: "专业与职务的关联越大，越有利于E-7审批——所以第1周的职务选定很重要。" },
            { title: "从公告读取信号", body: "公告中有‘外国人可申请’‘提供签证担保’‘visa support’这类文句就是绿灯。相反，若有‘限本国人’‘已服兵役’等条件，可能难以申请。含糊时，申请前礼貌地向招聘负责人咨询也无妨。", example: "咨询示例：\n‘想请教一下，该职位是否也接受外国人（E-7签证）申请。’" },
            { title: "对外国人招聘开放的地方", body: "外资企业、做全球业务的IT·初创企业、贸易·物流、需要多语言的职务，对外国人招聘相对开放。瞄准那些你的语言·文化优势‘是必需’而非‘有更好’的岗位，竞争力会更强。", tip: "多语言·本地化·全球销售职务上，留学生的优势本身就成为录用理由。" },
            { title: "提前确认签证要件", body: "在申请的同时提前确认自己的签证状态（滞留期限、D-2/D-10等）和E-7转换要件，合格后流程会更顺畅。通过HiKorea和出入境·外国人厅指南，把所需文件摸清楚。", tip: "若即将毕业，也了解一下用求职（D-10）签证确保滞留期限的方法。" }
          ]
        },
        {
          heading: "3. 有策略地申请",
          emoji: "🎯",
          summary: "与其盲目多投，不如向合适的地方用心投。而且要持续。",
          items: [
            { title: "定制化提高合格率", body: "与其原样群发同一份简历·自我介绍书，不如按公告的资格要求关键词，把应聘动机和强项稍作修改，通过率会提高。只需把第3周做好的文项针对每份公告略作调整就够了。", tip: "把公告的‘资格要求·优待事项’语句，与你简历的表达对齐。" },
            { title: "构建申请组合", body: "把想去的‘挑战’企业、现实的‘适中’企业、合格可能性高的‘稳妥’企业混合申请，心理上更安定，机会也更广。别只盯着一处，分多条路准备。", example: "例）分成挑战2处·适中3处·稳妥2处左右，同时准备。" },
            { title: "记录着管理", body: "把在何处、何时申请，以及截止日和甄选阶段用表格管理，就不会漏掉。一眼看清申请现状，接下来该准备什么也会更明确。", tip: "在简单的电子表格里记下公司·职务·申请日·截止日·状态。" },
            { title: "落选也要继续", body: "落选往往不是能力不足，而只是‘与那个岗位不合’而已。有反馈就采纳，没有就自己复盘，继续下一次申请。持之以恒最终会通向合格。", tip: "把落选处的一个遗憾点记下来，反映到下次申请中。" }
          ]
        },
        {
          heading: "4. 申请前最后的检查清单",
          emoji: "✅",
          summary: "按下提交按钮前，核对这些项目。",
          items: [
            { title: "文件检查", body: "检查简历·自我介绍书里有无错别字或残留的旧公司名，是否已按公告职务修改过。文件名定得一目了然，如‘姓名_职务_简历’，并存为PDF发送，以免格式错乱。", tip: "提交前出声读一遍，别扭的句子·错别字更易看出。" },
            { title: "对照资格要求", body: "再核对一次公告的必备资格要求你是否满足，优待事项中有无值得强调的。即便有欠缺的要件，只要在申请书中展现能弥补它的强项即可。" },
            { title: "确认签证·联系方式", body: "检查是否确认过外国人可否申请及签证要件，简历上的邮箱·电话号码是否准确。别因联系不上而错失机会。", tip: "为不错过面试联系，请常查提醒·邮件。" },
            { title: "截止·后续准备", body: "在截止日前从容提交，申请后用面试预想问题（第2阶段）和模拟面试（第3阶段）准备下一步。申请不是终点，而是面试准备的开始。" }
          ]
        }
      ],
      quiz: [
        {
          question: "外国留学生找公告特别有利的渠道是？",
          options: ["随便哪里都行", "Wanted·领英等IT·外资较多的渠道", "不申请只等待", "报纸分类广告"],
          answer: 1,
          explain: "Wanted·领英上初创企业·外资·英语公告多，对外国申请者有利。"
        },
        {
          question: "公告中可视为‘绿灯’信号的文句是？",
          options: ["限本国人申请", "提供签证担保 / visa support", "已服兵役", "无此项"],
          answer: 1,
          explain: "‘外国人可申请’‘提供签证担保’这类文句，是对外国人招聘开放的信号。"
        },
        {
          question: "提高合格率的申请方式是？",
          options: ["同一份文件尽量多撒", "按公告关键词修改应聘动机·强项", "只对一家公司一直申请", "临近截止匆忙投"],
          answer: 1,
          explain: "按公告的资格要求把文件定制化，通过率会提高。"
        },
        {
          question: "留学生就业时常转换的就业签证是？",
          options: ["D-2（留学）", "E-7（特定活动）", "B-2（观光）", "无"],
          answer: 1,
          explain: "从事与专业·职务相关的专业职就业时，E-7签证最常见，且需要公司的支持。"
        }
      ]
    },
    vi: {
      id: "w4-apply",
      emoji: "🚀",
      title: "Cách tự mình ứng tuyển",
      intro:
        "Khi đã hoàn tất CV, thư giới thiệu và chuẩn bị phỏng vấn, giờ đến lượt bạn tự ứng tuyển. Chúng tôi đã tổng hợp du học sinh tìm tin tuyển ở đâu, công ty nào cởi mở với hỗ trợ visa, và cách ứng tuyển có chiến lược. Hãy tự kiểm tra bằng bài quiz ở cuối.",
      objectives: [
        "Biết tìm tin tuyển mà người nước ngoài có thể ứng tuyển ở đâu",
        "Biết cách nhận diện công ty cởi mở với việc hỗ trợ visa lao động như E-7",
        "Hiểu chiến lược và trình tự ứng tuyển giúp tăng tỷ lệ trúng tuyển",
        "Có sẵn danh sách kiểm tra rà lần cuối trước khi ứng tuyển"
      ],
      sections: [
        {
          heading: "1. Tìm tin tuyển ở đây",
          emoji: "🔎",
          summary: "Mỗi kênh có thế mạnh khác nhau. Điểm mấu chốt là chọn hai ba nơi và theo dõi đều đặn.",
          items: [
            { title: "Nền tảng tuyển dụng tổng hợp", body: "Saramin, JobKorea, Wanted, LinkedIn là tiêu biểu. Wanted và LinkedIn có nhiều vị trí startup, công ty nước ngoài, ngành IT, tin bằng tiếng Anh cũng xuất hiện thường, đặc biệt có lợi cho ứng viên nước ngoài. Đặt thông báo với từ khóa công việc quan tâm giúp bạn không bỏ lỡ tin mới.", tip: "Tìm từ khóa như 'global', 'English', 'người nước ngoài' dễ ra những tin có rào cản thấp." },
            { title: "Kênh chuyên cho người nước ngoài/du học sinh", body: "Đừng bỏ lỡ các kênh chuyên tuyển người nước ngoài, và tin tuyển từ phòng quốc tế · trung tâm nghề nghiệp của trường đại học. Trung tâm nghề nghiệp của trường thường thông báo hội chợ việc làm · thông tin thực tập cho du học sinh trước, nên đăng ký giúp bạn nhận cơ hội tốt sớm hơn.", tip: "Nếu đang học, nhất định đăng ký nhận email của phòng quốc tế · trung tâm nghề nghiệp của trường." },
            { title: "Ứng tuyển trực tiếp trên trang tuyển dụng của công ty", body: "Nếu có công ty rõ ràng muốn vào, ứng tuyển trực tiếp trên trang Careers của công ty đó cũng tốt. Thường có vị trí tuyển thường xuyên không đăng trên nền tảng, và bạn thể hiện được sự quan tâm với công ty rõ hơn.", example: "VD) Chọn 5 công ty quan tâm, đánh dấu trang tuyển dụng, và cứ 2 tuần kiểm tra tin mới một lần." },
            { title: "Hội chợ việc làm · kết nối", body: "Hội chợ việc làm cho người nước ngoài (K-Move, hội chợ tuyển người nước ngoài...) và kết nối trên LinkedIn cũng là kênh tốt. Hỏi người đang làm về vị trí hoặc được giới thiệu (referral) nâng rõ khả năng qua vòng hồ sơ.", tip: "Trên LinkedIn, nhắn tin lịch sự cho người đang làm cùng vị trí và xin một buổi cà phê trò chuyện." }
          ]
        },
        {
          heading: "2. Nhận diện công ty cởi mở với hỗ trợ visa",
          emoji: "🛂",
          summary: "Với tuyển người nước ngoài, 'người bảo lãnh visa' là mấu chốt. Nhất định kiểm tra trước khi ứng tuyển.",
          items: [
            { title: "Visa E-7 (hoạt động đặc định) là gì", body: "Visa lao động phổ biến nhất khi du học sinh làm công việc chuyên môn sau tốt nghiệp là E-7. Phải là vị trí liên quan đến ngành học · kinh nghiệm, và công ty phải cùng chuẩn bị giấy tờ cần cho visa với bạn. Vì thế 'công ty có kinh nghiệm tuyển người nước ngoài không' rất quan trọng.", tip: "Ngành học và công việc liên quan càng chặt càng có lợi cho việc duyệt E-7 — vì thế việc chọn công việc ở Tuần 1 rất quan trọng." },
            { title: "Đọc tín hiệu trong tin tuyển", body: "Nếu tin có cụm như 'người nước ngoài có thể ứng tuyển', 'cung cấp bảo lãnh visa', 'visa support' thì là đèn xanh. Ngược lại, điều kiện như 'chỉ người trong nước', 'đã hoàn thành nghĩa vụ quân sự' có thể khiến khó ứng tuyển. Nếu mơ hồ, hỏi lịch sự người phụ trách tuyển trước khi ứng tuyển cũng không sao.", example: "VD hỏi:\n'Em muốn hỏi vị trí này có nhận cả ứng viên nước ngoài (visa E-7) không ạ.'" },
            { title: "Nơi cởi mở với tuyển người nước ngoài", body: "Công ty nước ngoài, IT/startup làm kinh doanh toàn cầu, thương mại/logistics, và vị trí cần đa ngôn ngữ tương đối cởi mở với tuyển người nước ngoài. Nhắm vào vị trí mà thế mạnh ngôn ngữ · văn hóa của bạn 'là cần thiết' thay vì chỉ 'có thì tốt' sẽ tăng sức cạnh tranh.", tip: "Ở vị trí đa ngôn ngữ · bản địa hóa · bán hàng toàn cầu, thế mạnh của du học sinh chính là lý do tuyển dụng." },
            { title: "Kiểm tra điều kiện visa trước", body: "Kiểm tra tình trạng visa của bạn (thời gian lưu trú, D-2/D-10...) và điều kiện chuyển E-7 cùng lúc ứng tuyển giúp quy trình sau khi trúng tuyển mượt mà. Nắm giấy tờ cần thiết qua HiKorea và hướng dẫn của Cục Xuất nhập cảnh.", tip: "Nếu sắp tốt nghiệp, hãy tìm hiểu cách đảm bảo thời gian lưu trú bằng visa tìm việc (D-10)." }
          ]
        },
        {
          heading: "3. Ứng tuyển có chiến lược",
          emoji: "🎯",
          summary: "Thay vì nộp bừa thật nhiều, hãy nộp cẩn thận vào nơi phù hợp. Và đều đặn.",
          items: [
            { title: "Tùy chỉnh nâng tỷ lệ trúng tuyển", body: "Thay vì gửi nguyên cùng một CV · thư giới thiệu, chỉnh động cơ và thế mạnh theo từ khóa yêu cầu của tin tuyển sẽ nâng tỷ lệ qua vòng. Chỉ cần điều chỉnh nhẹ các mục bạn làm ở Tuần 3 cho từng tin là đủ.", tip: "Khớp câu 'yêu cầu · điểm ưu tiên' của tin tuyển với cách diễn đạt trong CV của bạn." },
            { title: "Xây danh mục ứng tuyển", body: "Ứng tuyển pha trộn công ty 'thử thách' bạn muốn, công ty 'vừa tầm' thực tế, và công ty 'an toàn' khả năng trúng cao vừa vững tâm lý vừa mở rộng cơ hội. Đừng bám một nơi — hãy chuẩn bị theo nhiều nhánh.", example: "VD) Chia khoảng thử thách 2 · vừa tầm 3 · an toàn 2 và chuẩn bị đồng thời." },
            { title: "Quản lý bằng ghi chép", body: "Quản lý bằng bảng việc bạn đã nộp ở đâu, khi nào, cùng hạn chót và các vòng giúp bạn không bỏ sót. Nhìn tình trạng ứng tuyển trong nháy mắt cũng làm rõ việc cần chuẩn bị tiếp theo.", tip: "Ghi công ty · vị trí · ngày nộp · hạn chót · trạng thái vào một bảng tính đơn giản." },
            { title: "Rớt vẫn tiếp tục", body: "Rớt thường không phải thiếu năng lực mà chỉ là 'không hợp với vị trí đó' thôi. Có phản hồi thì áp dụng, không thì tự phục dựng lại và tiếp tục lần nộp sau. Sự đều đặn rốt cuộc dẫn tới trúng tuyển.", tip: "Ghi lại chỉ một điều tiếc ở nơi bị rớt và phản ánh vào lần nộp sau." }
          ]
        },
        {
          heading: "4. Danh sách kiểm tra cuối trước khi ứng tuyển",
          emoji: "✅",
          summary: "Trước khi nhấn nút gửi, hãy kiểm tra những mục này.",
          items: [
            { title: "Kiểm tra hồ sơ", body: "Kiểm tra CV · thư giới thiệu xem còn lỗi chính tả hay tên công ty cũ sót lại không, và đã chỉnh cho hợp vị trí trong tin chưa. Đặt tên tệp dễ nhận như 'Tên_Vị trí_CV', và lưu dạng PDF để định dạng không vỡ khi gửi.", tip: "Đọc to một lần trước khi nộp giúp câu vụng · lỗi chính tả nổi rõ." },
            { title: "Đối chiếu với yêu cầu", body: "Kiểm tra lại một lần xem bạn có đáp ứng yêu cầu bắt buộc của tin không, và trong điểm ưu tiên có gì đáng nhấn mạnh không. Dù thiếu một yêu cầu, bạn có thể thể hiện thế mạnh bù đắp trong hồ sơ ứng tuyển." },
            { title: "Kiểm tra visa · liên lạc", body: "Kiểm tra xem đã xác nhận khả năng ứng tuyển của người nước ngoài và điều kiện visa chưa, và email · số điện thoại trên CV có chính xác không. Đừng để mất cơ hội vì không liên lạc được.", tip: "Kiểm tra thông báo · email thường xuyên để không bỏ lỡ liên hệ phỏng vấn." },
            { title: "Chuẩn bị hạn chót · tiếp theo", body: "Nộp dư dả trước hạn chót, và sau khi nộp, chuẩn bị bước tiếp theo bằng câu hỏi phỏng vấn dự kiến (bước 2) và phỏng vấn thử (bước 3). Ứng tuyển không phải là kết thúc — mà là khởi đầu của việc chuẩn bị phỏng vấn." }
          ]
        }
      ],
      quiz: [
        {
          question: "Kênh nào đặc biệt có lợi cho du học sinh tìm tin tuyển?",
          options: ["Đâu cũng được", "Kênh có nhiều vị trí IT/công ty nước ngoài như Wanted và LinkedIn", "Chờ mà không ứng tuyển", "Rao vặt trên báo giấy"],
          answer: 1,
          explain: "Wanted và LinkedIn có nhiều tin startup, công ty nước ngoài, tiếng Anh, có lợi cho ứng viên nước ngoài."
        },
        {
          question: "Cụm nào có thể xem là tín hiệu 'đèn xanh' trong tin tuyển?",
          options: ["Chỉ người trong nước", "Cung cấp bảo lãnh visa / visa support", "Đã hoàn thành nghĩa vụ quân sự", "Không áp dụng"],
          answer: 1,
          explain: "Các cụm như 'người nước ngoài có thể ứng tuyển', 'cung cấp bảo lãnh visa' báo hiệu cởi mở với tuyển người nước ngoài."
        },
        {
          question: "Cách ứng tuyển nào nâng tỷ lệ trúng tuyển?",
          options: ["Rải cùng một hồ sơ càng rộng càng tốt", "Chỉnh động cơ/thế mạnh theo từ khóa của tin tuyển", "Cứ ứng tuyển một công ty duy nhất", "Nộp vội ngay trước hạn chót"],
          answer: 1,
          explain: "Tùy chỉnh hồ sơ theo yêu cầu của tin tuyển nâng tỷ lệ qua vòng."
        },
        {
          question: "Visa lao động mà du học sinh thường chuyển sang khi đi làm là?",
          options: ["D-2 (du học)", "E-7 (hoạt động đặc định)", "B-2 (du lịch)", "Không có"],
          answer: 1,
          explain: "Với công việc chuyên môn liên quan ngành học · vị trí, visa E-7 phổ biến nhất, và cần sự hỗ trợ của công ty."
        }
      ]
    },
    ja: {
      id: "w4-apply",
      emoji: "🚀",
      title: "自分で応募する方法",
      intro:
        "履歴書・自己紹介書・面接準備まで終えたら、いよいよ自分で応募する番です。外国人留学生がどこで募集を探し、どんな会社がビザ支援に前向きで、どう戦略的に応募するかを整理しました。最後のクイズで確認しましょう。",
      objectives: [
        "外国人が応募できる求人をどこで探すか知る",
        "E-7など就労ビザ支援に前向きな企業を見分ける方法を知る",
        "合格率を高める応募戦略と順序を理解する",
        "応募前に最後に点検するチェックリストを備える"
      ],
      sections: [
        {
          heading: "1. 募集はここで探します",
          emoji: "🔎",
          summary: "チャネルごとに強みが違います。2〜3か所を決めてコツコツ見るのが肝心です。",
          items: [
            { title: "総合求人プラットフォーム", body: "Saramin・JobKorea・Wanted・LinkedInが代表的です。WantedとLinkedInはスタートアップ・外資・IT職が多く、英語の募集もよく見られ、外国人応募者に特に有利です。関心の職務キーワードでアラートを設定しておけば新しい募集を逃しません。", tip: "『global』『English』『外国人』のキーワードで検索すると、ハードルの低い募集が見つかりやすいです。" },
            { title: "外国人・留学生特化チャネル", body: "外国人採用を専門に扱うチャネルや、大学の国際課・キャリアセンターの募集も見逃さないでください。学校のキャリアセンターは留学生向けの採用説明会・インターン情報を先に案内することが多く、登録しておくと良い機会を先に受け取れます。", tip: "在学中なら、学校の国際課・キャリアセンターのメーリングを必ず申し込みましょう。" },
            { title: "会社の採用ページで直接応募", body: "行きたい会社がはっきりしているなら、その会社の採用（Careers）ページで直接応募するのも良いです。プラットフォームに載らない常時採用があることが多く、会社への関心をより示せます。", example: "例）関心企業5社を決めて採用ページをブックマークし、2週間に一度、新しい募集を確認します。" },
            { title: "採用博覧会・ネットワーキング", body: "外国人向けジョブフェア（K-Move、外国人採用博覧会など）やLinkedInのネットワーキングも良い通路です。現職者に職務を尋ねたり紹介（リファラル）を受けると、書類通過の確率が目に見えて上がります。", tip: "LinkedInで同じ職務の現職者に礼儀正しくメッセージを送り、コーヒーチャットを申し込んでみましょう。" }
          ]
        },
        {
          heading: "2. ビザ支援に前向きな会社を見分ける",
          emoji: "🛂",
          summary: "外国人採用は『ビザスポンサー』が肝心です。応募前に必ず確認しましょう。",
          items: [
            { title: "E-7（特定活動）ビザとは", body: "留学生が卒業後に専門職で就職するとき、最も一般的な就労ビザがE-7です。専攻・経歴に関連する職務でなければならず、会社がビザ発給に必要な書類を一緒に準備してくれる必要があります。だから『外国人採用の経験がある会社』かが重要です。", tip: "専攻と職務の関連が大きいほどE-7承認に有利です——だから1週目の職務選定が重要でした。" },
            { title: "募集から信号を読む", body: "募集に『外国人応募可能』『ビザスポンサーシップ提供』『visa support』のような文言があれば青信号です。逆に『国内在住者のみ』『兵役済み』のような条件があると応募が難しいことがあります。曖昧なら、応募前に採用担当者に丁寧に問い合わせても構いません。", example: "問い合わせ例：\n『こちらのポジションは外国人（E-7ビザ）応募も可能かお伺いしたいです。』" },
            { title: "外国人採用に前向きな所", body: "外資系企業、グローバル事業をするIT・スタートアップ、貿易・物流、多言語が必要な職務は、比較的外国人採用に前向きです。あなたの言語・文化の強みが『あればいい』ではなく『必要な』ポジションを狙うと、競争力が高まります。", tip: "多言語・ローカライズ・グローバルセールス職では、留学生の強みがそのまま採用理由になります。" },
            { title: "ビザ要件を前もって確認", body: "応募と同時に自分のビザ状態（滞在期間、D-2/D-10など）とE-7転換要件を前もって確認しておくと、合格後の手続きがスムーズです。HiKoreaと出入国・外国人庁の案内で必要書類を把握しておきましょう。", tip: "卒業予定なら、求職（D-10）ビザで滞在期間を確保する方法も知っておきましょう。" }
          ]
        },
        {
          heading: "3. 戦略的に応募します",
          emoji: "🎯",
          summary: "むやみに多く出すより、合う所に丁寧に。そして着実に。",
          items: [
            { title: "カスタマイズが合格率を上げる", body: "同じ履歴書・自己紹介書をそのまま回すより、募集の資格要件キーワードに合わせて志望動機と強みを少し手直しすると通過率が上がります。3週目で作った項目を募集ごとに少し調整するだけで十分です。", tip: "募集の『資格要件・優遇事項』の文と、あなたの履歴書の表現を合わせてみましょう。" },
            { title: "応募ポートフォリオの構成", body: "行きたい『挑戦』企業、現実的な『適正』企業、合格可能性の高い『安定』企業を混ぜて応募すると、心理的にも安定し機会も広がります。一か所に固執せず、複数の道で準備しましょう。", example: "例）挑戦2社・適正3社・安定2社ほどに分けて同時に準備します。" },
            { title: "記録しながら管理", body: "どこにいつ応募したか、締切と選考段階を表で管理すると取りこぼしがありません。応募状況を一目で見れば、次に何を準備するかも明確になります。", tip: "簡単なスプレッドシートに会社・職務・応募日・締切・状態を書いておきましょう。" },
            { title: "落ちても続ける", body: "不合格は実力不足ではなく『そのポジションと合わなかった』だけの場合が多いです。フィードバックがあれば反映し、なければ自分で振り返って次の応募を続けましょう。着実さが結局は合格につながります。", tip: "落ちた所の惜しかった点を1つだけメモして、次の応募に反映しましょう。" }
          ]
        },
        {
          heading: "4. 応募前の最終チェックリスト",
          emoji: "✅",
          summary: "提出ボタンを押す前に、この項目を確認しましょう。",
          items: [
            { title: "書類の点検", body: "履歴書・自己紹介書に誤字や前の会社名が残っていないか、募集職務に合わせて手直ししたか確認します。ファイル名は『名前_職務_履歴書』のように分かりやすくし、PDFで保存して形式が崩れないように送りましょう。", tip: "提出前に一度声に出して読むと、不自然な文・誤字がよく見えます。" },
            { title: "資格要件の照合", body: "募集の必須資格要件を自分が満たすか、優遇事項の中に強調できるものがあるか、もう一度照合します。足りない要件があっても、それを補う強みを応募書類で示せば大丈夫です。" },
            { title: "ビザ・連絡先の確認", body: "外国人応募の可否とビザ要件を確認したか、履歴書のメール・電話番号が正確か点検します。連絡がつかず機会を逃すことのないようにしましょう。", tip: "面接連絡を逃さないよう、通知・メールをこまめに確認しましょう。" },
            { title: "締切・後続の準備", body: "締切前に余裕をもって提出し、応募後は面接予想質問（2段階）と模擬面接（3段階）で次の段階を準備しましょう。応募は終わりではなく、面接準備の始まりです。" }
          ]
        }
      ],
      quiz: [
        {
          question: "外国人留学生が募集を探すのに特に有利なチャネルは？",
          options: ["どこでも構わない", "Wanted・LinkedInなどIT・外資が多いチャネル", "応募せず待つ", "新聞の折込広告"],
          answer: 1,
          explain: "Wanted・LinkedInはスタートアップ・外資・英語の募集が多く、外国人応募者に有利です。"
        },
        {
          question: "募集で『青信号』の合図と見られる文言は？",
          options: ["国内在住者のみ応募", "ビザスポンサーシップ提供 / visa support", "兵役済み", "該当なし"],
          answer: 1,
          explain: "『外国人応募可能』『ビザスポンサーシップ提供』のような文言は、外国人採用に前向きな合図です。"
        },
        {
          question: "合格率を高める応募の仕方は？",
          options: ["同じ書類をできるだけ多く撒く", "募集キーワードに合わせ志望動機・強みを手直しする", "一社だけ応募し続ける", "締切直前に急いで出す"],
          answer: 1,
          explain: "募集の資格要件に合わせて書類をカスタマイズすると通過率が上がります。"
        },
        {
          question: "留学生が就職時によく転換する就労ビザは？",
          options: ["D-2（留学）", "E-7（特定活動）", "B-2（観光）", "なし"],
          answer: 1,
          explain: "専攻・職務に関連する専門職就職ではE-7ビザが最も一般的で、会社の支援が必要です。"
        }
      ]
    },
    id: {
      id: "w4-apply",
      emoji: "🚀",
      title: "Cara Melamar Sendiri",
      intro:
        "Setelah menyelesaikan resume, surat pengenalan diri, dan persiapan wawancara, kini giliranmu melamar sendiri. Kami telah merangkum di mana mahasiswa internasional menemukan lowongan, perusahaan mana yang terbuka terhadap dukungan visa, dan cara melamar secara strategis. Periksa dirimu dengan kuis di akhir.",
      objectives: [
        "Mengetahui di mana menemukan lowongan yang bisa kamu lamar sebagai orang asing",
        "Mengetahui cara mengenali perusahaan yang terbuka mendukung visa kerja seperti E-7",
        "Memahami strategi dan urutan lamaran yang menaikkan tingkat penerimaan",
        "Memiliki daftar periksa untuk ditinjau sekali lagi sebelum melamar"
      ],
      sections: [
        {
          heading: "1. Temukan Lowongan di Sini",
          emoji: "🔎",
          summary: "Tiap kanal punya kekuatan berbeda. Kuncinya memilih dua atau tiga dan mengeceknya secara konsisten.",
          items: [
            { title: "Platform lowongan umum", body: "Saramin, JobKorea, Wanted, dan LinkedIn adalah yang utama. Wanted dan LinkedIn punya banyak posisi startup, asing, dan IT, serta lowongan berbahasa Inggris sering muncul, sehingga sangat menguntungkan bagi pelamar asing. Menyetel notifikasi dengan kata kunci pekerjaan targetmu membuatmu tak melewatkan lowongan baru.", tip: "Mencari kata kunci seperti 'global', 'English', 'orang asing' memunculkan lowongan berhambatan lebih rendah." },
            { title: "Kanal khusus orang asing/mahasiswa", body: "Jangan lewatkan kanal yang khusus menangani rekrutmen orang asing, serta lowongan dari kantor internasional · pusat karier universitas. Pusat karier kampus sering mengumumkan bursa kerja · info magang untuk mahasiswa internasional lebih dulu, jadi mendaftar membuatmu menerima peluang bagus lebih awal.", tip: "Jika masih kuliah, pastikan mendaftar milis kantor internasional · pusat karier kampusmu." },
            { title: "Melamar langsung di halaman karier perusahaan", body: "Jika ada perusahaan jelas yang ingin kamu masuki, melamar langsung di halaman Careers perusahaan itu juga bagus. Sering ada lowongan berjalan yang tak diunggah di platform, dan kamu bisa lebih menunjukkan minat pada perusahaan.", example: "Mis.) Pilih 5 perusahaan yang diminati, tandai halaman kariernya, dan cek lowongan baru sekali tiap 2 minggu." },
            { title: "Bursa kerja · networking", body: "Bursa kerja untuk orang asing (K-Move, bursa rekrutmen orang asing, dll.) dan networking di LinkedIn juga jalur bagus. Bertanya kepada karyawan aktif tentang posisi atau mendapat rujukan (referral) menaikkan peluang lolos seleksi berkas secara nyata.", tip: "Di LinkedIn, kirim pesan sopan ke karyawan aktif pada posisi yang sama dan minta obrolan santai." }
          ]
        },
        {
          heading: "2. Mengenali Perusahaan yang Terbuka pada Dukungan Visa",
          emoji: "🛂",
          summary: "Untuk rekrutmen orang asing, 'sponsor visa' adalah kuncinya. Pastikan mengecek sebelum melamar.",
          items: [
            { title: "Apa itu visa E-7 (Aktivitas Tertentu)", body: "Visa kerja paling umum ketika mahasiswa mengambil pekerjaan profesional setelah lulus adalah E-7. Harus berupa posisi yang terkait jurusan · pengalaman, dan perusahaan harus menyiapkan dokumen yang diperlukan untuk visa bersamamu. Karena itu penting apakah perusahaan 'berpengalaman merekrut orang asing'.", tip: "Makin kuat kaitan antara jurusan dan pekerjaan, makin menguntungkan untuk persetujuan E-7 — itulah kenapa pemilihan pekerjaan di Minggu 1 penting." },
            { title: "Membaca sinyal dalam lowongan", body: "Jika lowongan memuat frasa seperti 'orang asing boleh melamar', 'menyediakan sponsor visa', atau 'visa support', itu lampu hijau. Sebaliknya, syarat seperti 'hanya warga lokal' atau 'wajib militer selesai' bisa menyulitkan lamaran. Jika ambigu, boleh bertanya sopan ke penanggung jawab rekrutmen sebelum melamar.", example: "Contoh pertanyaan:\n'Saya ingin bertanya apakah posisi ini juga terbuka untuk pelamar asing (visa E-7).'" },
            { title: "Tempat yang terbuka pada rekrutmen orang asing", body: "Perusahaan asing, IT/startup yang berbisnis global, perdagangan/logistik, dan posisi yang membutuhkan banyak bahasa relatif terbuka merekrut orang asing. Membidik posisi yang kelebihan bahasa · budayamu 'dibutuhkan' ketimbang sekadar 'baik jika ada' meningkatkan daya saingmu.", tip: "Pada posisi multibahasa · lokalisasi · penjualan global, kelebihan mahasiswa internasional justru menjadi alasan perekrutan." },
            { title: "Cek syarat visa lebih dulu", body: "Mengecek status visamu (masa tinggal, D-2/D-10, dll.) dan syarat konversi E-7 bersamaan dengan melamar membuat proses setelah diterima lancar. Pahami dokumen yang diperlukan lewat HiKorea dan panduan Kantor Imigrasi.", tip: "Jika hampir lulus, pelajari juga cara mengamankan masa tinggal dengan visa pencari kerja (D-10)." }
          ]
        },
        {
          heading: "3. Melamar Secara Strategis",
          emoji: "🎯",
          summary: "Ketimbang melamar banyak secara membabi buta, lamar dengan cermat ke tempat yang tepat. Dan konsisten.",
          items: [
            { title: "Penyesuaian menaikkan tingkat penerimaan", body: "Ketimbang mengirim resume dan surat pengenalan yang sama apa adanya, menyesuaikan motivasi dan kelebihan agar cocok dengan kata kunci persyaratan lowongan menaikkan tingkat lolos. Cukup sedikit menyesuaikan butir yang kamu buat di Minggu 3 untuk tiap lowongan.", tip: "Cocokkan kalimat 'persyaratan · kualifikasi yang diutamakan' lowongan dengan pilihan kata di resumemu." },
            { title: "Menyusun portofolio lamaran", body: "Melamar dengan campuran perusahaan 'tantangan' yang kamu inginkan, perusahaan 'sesuai' yang realistis, dan perusahaan 'aman' dengan peluang penerimaan tinggi menenangkan secara psikologis dan memperlebar peluang. Jangan berpaku pada satu tempat — siapkan lewat beberapa jalur.", example: "Mis.) Bagi menjadi sekitar tantangan 2 · sesuai 3 · aman 2 dan siapkan secara bersamaan." },
            { title: "Kelola dengan mencatat", body: "Mengelola di mana dan kapan kamu melamar, beserta tenggat dan tahap seleksi, dalam tabel membuatmu tak melewatkan hal. Melihat status lamaran sekilas juga memperjelas apa yang harus disiapkan berikutnya.", tip: "Catat perusahaan, posisi, tanggal lamaran, tenggat, dan status di lembar kerja sederhana." },
            { title: "Terus lanjut meski ditolak", body: "Penolakan sering bukan kekurangan kemampuan melainkan sekadar 'tak cocok dengan posisi itu'. Jika ada umpan balik, terapkan; jika tidak, tinjau sendiri dan lanjutkan lamaran berikutnya. Konsistensi pada akhirnya berujung pada penerimaan.", tip: "Catat satu saja penyesalan dari tempat yang menolakmu dan cerminkan pada lamaran berikutnya." }
          ]
        },
        {
          heading: "4. Daftar Periksa Terakhir Sebelum Melamar",
          emoji: "✅",
          summary: "Sebelum menekan tombol kirim, periksa butir-butir ini.",
          items: [
            { title: "Pemeriksaan berkas", body: "Periksa bahwa tak ada salah ketik atau nama perusahaan lama yang tersisa di resume dan surat pengenalan, serta bahwa kamu sudah menyesuaikannya dengan posisi di lowongan. Beri nama berkas dengan jelas, seperti 'Nama_Posisi_Resume', dan simpan sebagai PDF agar formatnya tak rusak saat dikirim.", tip: "Membacanya lantang sekali sebelum menyerahkan membuat kalimat janggal dan salah ketik menonjol." },
            { title: "Membandingkan dengan persyaratan", body: "Periksa sekali lagi apakah kamu memenuhi persyaratan wajib lowongan, dan apakah ada di antara kualifikasi yang diutamakan yang layak ditonjolkan. Meski kurang satu persyaratan, kamu bisa menampilkan kelebihan yang menutupinya dalam lamaran." },
            { title: "Mengecek visa dan kontak", body: "Periksa apakah kamu sudah memastikan kelayakan lamaran orang asing dan syarat visa, serta email dan nomor telepon di resumemu benar. Pastikan kamu tak melewatkan peluang karena tak bisa dihubungi.", tip: "Cek notifikasi dan email sering agar tak melewatkan kontak wawancara." },
            { title: "Persiapan tenggat · tindak lanjut", body: "Serahkan dengan jeda sebelum tenggat, dan setelah melamar, siapkan langkah berikutnya dengan pertanyaan wawancara yang mungkin (Langkah 2) dan wawancara simulasi (Langkah 3). Melamar bukan akhir — itu awal dari persiapan wawancara." }
          ]
        }
      ],
      quiz: [
        {
          question: "Kanal mana yang khususnya menguntungkan bagi mahasiswa internasional untuk menemukan lowongan?",
          options: ["Di mana saja boleh", "Kanal dengan banyak posisi IT/asing seperti Wanted dan LinkedIn", "Menunggu tanpa melamar", "Iklan baris koran"],
          answer: 1,
          explain: "Wanted dan LinkedIn punya banyak lowongan startup, asing, dan Inggris, yang menguntungkan bagi pelamar asing."
        },
        {
          question: "Frasa mana yang bisa dilihat sebagai sinyal 'lampu hijau' dalam lowongan?",
          options: ["Hanya warga lokal", "Menyediakan sponsor visa / visa support", "Wajib militer selesai", "Tidak berlaku"],
          answer: 1,
          explain: "Frasa seperti 'orang asing boleh melamar' dan 'menyediakan sponsor visa' menandakan keterbukaan merekrut orang asing."
        },
        {
          question: "Cara melamar mana yang menaikkan tingkat penerimaan?",
          options: ["Menyebar berkas yang sama seluas mungkin", "Menyesuaikan motivasi/kelebihan agar cocok kata kunci lowongan", "Terus melamar hanya ke satu perusahaan", "Menyerahkan tergesa tepat sebelum tenggat"],
          answer: 1,
          explain: "Menyesuaikan berkasmu agar cocok dengan persyaratan lowongan menaikkan tingkat lolos."
        },
        {
          question: "Visa kerja apa yang biasa dikonversi mahasiswa internasional saat mendapat pekerjaan?",
          options: ["D-2 (pelajar)", "E-7 (aktivitas tertentu)", "B-2 (wisata)", "Tidak ada"],
          answer: 1,
          explain: "Untuk pekerjaan profesional yang terkait jurusan · posisi, visa E-7 paling umum, dan dukungan perusahaan diperlukan."
        }
      ]
    }
  }
};

// 현재 로케일의 레슨을 반환. 번역이 없으면 data.ts 의 한국어 레슨으로 폴백.
export function useLocalizedCulture(id: string): CultureLesson | undefined {
  const { locale } = useLanguage();
  const fallback = CULTURE_LESSONS[id];
  if (locale === "ko") return fallback;
  const translated = CULTURE_LESSONS_I18N[id]?.[locale as TranslatedLocale];
  return translated ?? fallback;
}

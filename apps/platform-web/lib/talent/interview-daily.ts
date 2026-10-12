// 모의 면접 '오늘의 질문'·'한국어 면접 표현' — 정해 둔 목록에서 날짜로 하나씩 고른다(AI 호출 없음, 피드백만 AI).
// 질문은 한국어 원문(ko)이 키다 — 연습 기록(self-mock)·잘 쓴 답 예시가 이 글로 묶인다. 화면엔 고른 언어로 보이고,
// 한국어가 아닌 화면에선 한국어 원문을 함께 보여 준다(실제 면접은 한국어로 보니까).
import type { PlatformT } from "../i18n";

export type DailyQuestion = { category: "intro" | "competency" | "experience" | "weakness"; ko: string; en: string; zh: string; vi: string; ja: string; id: string };

export const DAILY_QUESTIONS: DailyQuestion[] = [
  { category: "intro", ko: "1분 동안 자기소개를 해 주세요.", en: "Please introduce yourself in one minute.", zh: "请用一分钟做自我介绍。", vi: "Hãy giới thiệu bản thân trong một phút.", ja: "1分で自己紹介をしてください。", id: "Perkenalkan diri Anda dalam satu menit." },
  { category: "intro", ko: "우리 회사에 지원한 이유는 무엇인가요?", en: "Why did you apply to our company?", zh: "你为什么申请我们公司？", vi: "Vì sao bạn ứng tuyển vào công ty chúng tôi?", ja: "当社に応募した理由は何ですか？", id: "Mengapa Anda melamar ke perusahaan kami?" },
  { category: "intro", ko: "왜 이 직무를 선택했나요?", en: "Why did you choose this role?", zh: "你为什么选择这个职位？", vi: "Vì sao bạn chọn vị trí này?", ja: "なぜこの職種を選びましたか？", id: "Mengapa Anda memilih peran ini?" },
  { category: "intro", ko: "한국에서 일하고 싶은 이유는 무엇인가요?", en: "Why do you want to work in Korea?", zh: "你为什么想在韩国工作？", vi: "Vì sao bạn muốn làm việc ở Hàn Quốc?", ja: "韓国で働きたい理由は何ですか？", id: "Mengapa Anda ingin bekerja di Korea?" },
  { category: "intro", ko: "입사 후 3년 뒤 어떤 모습이고 싶나요?", en: "Where do you see yourself three years after joining?", zh: "入职三年后你希望成为什么样？", vi: "Bạn muốn mình ra sao sau 3 năm làm việc?", ja: "入社3年後、どうなっていたいですか？", id: "Seperti apa Anda tiga tahun setelah bergabung?" },
  { category: "competency", ko: "이 직무에서 가장 중요한 역량은 무엇이라고 생각하나요?", en: "What do you think is the most important skill for this role?", zh: "你认为这个职位最重要的能力是什么？", vi: "Theo bạn năng lực quan trọng nhất của vị trí này là gì?", ja: "この職種で最も重要な能力は何だと思いますか？", id: "Menurut Anda, kemampuan terpenting untuk peran ini apa?" },
  { category: "competency", ko: "본인의 가장 큰 강점은 무엇인가요?", en: "What is your greatest strength?", zh: "你最大的优点是什么？", vi: "Điểm mạnh lớn nhất của bạn là gì?", ja: "あなたの一番の強みは何ですか？", id: "Apa kekuatan terbesar Anda?" },
  { category: "competency", ko: "새로운 것을 빠르게 배웠던 경험을 말해 주세요.", en: "Tell me about a time you learned something new quickly.", zh: "请讲一次你快速学会新东西的经历。", vi: "Kể về lần bạn học điều mới thật nhanh.", ja: "新しいことを素早く学んだ経験を教えてください。", id: "Ceritakan saat Anda cepat mempelajari hal baru." },
  { category: "competency", ko: "데이터나 근거로 결정을 내린 경험이 있나요?", en: "Have you made a decision based on data or evidence?", zh: "你有基于数据或依据做决定的经历吗？", vi: "Bạn từng ra quyết định dựa trên dữ liệu chưa?", ja: "データや根拠で判断した経験はありますか？", id: "Pernahkah Anda memutuskan berdasarkan data?" },
  { category: "competency", ko: "여러 일을 동시에 해야 할 때 어떻게 우선순위를 정하나요?", en: "How do you prioritize when juggling several tasks?", zh: "同时有很多工作时你如何安排优先级？", vi: "Khi nhiều việc cùng lúc, bạn ưu tiên thế nào?", ja: "複数の仕事が重なったとき、どう優先順位をつけますか？", id: "Bagaimana Anda memprioritaskan banyak tugas sekaligus?" },
  { category: "experience", ko: "가장 기억에 남는 프로젝트와 본인의 역할을 말해 주세요.", en: "Tell me about your most memorable project and your role.", zh: "请讲讲你最难忘的项目和你的角色。", vi: "Kể về dự án đáng nhớ nhất và vai trò của bạn.", ja: "一番印象に残っているプロジェクトとあなたの役割を教えてください。", id: "Ceritakan proyek paling berkesan dan peran Anda." },
  { category: "experience", ko: "실패했던 경험과 그로부터 배운 점을 말해 주세요.", en: "Tell me about a failure and what you learned.", zh: "请讲一次失败经历以及你学到了什么。", vi: "Kể về một thất bại và điều bạn học được.", ja: "失敗した経験と、そこから学んだことを教えてください。", id: "Ceritakan kegagalan dan pelajaran yang Anda dapat." },
  { category: "experience", ko: "팀에서 의견이 달랐을 때 어떻게 해결했나요?", en: "How did you resolve a disagreement in a team?", zh: "团队意见不合时你是怎么解决的？", vi: "Bạn giải quyết bất đồng trong nhóm thế nào?", ja: "チームで意見が分かれたとき、どう解決しましたか？", id: "Bagaimana Anda menyelesaikan perbedaan pendapat di tim?" },
  { category: "experience", ko: "아르바이트나 인턴에서 성과를 낸 경험이 있나요?", en: "Did you achieve results in a part-time job or internship?", zh: "你在兼职或实习中取得过成果吗？", vi: "Bạn từng đạt kết quả khi làm thêm hay thực tập chưa?", ja: "アルバイトやインターンで成果を出した経験はありますか？", id: "Pernahkah Anda berprestasi saat kerja paruh waktu atau magang?" },
  { category: "experience", ko: "어려운 문제를 스스로 해결했던 경험을 말해 주세요.", en: "Tell me about a hard problem you solved on your own.", zh: "请讲一次你独立解决难题的经历。", vi: "Kể về một vấn đề khó bạn tự giải quyết.", ja: "難しい問題を自分で解決した経験を教えてください。", id: "Ceritakan masalah sulit yang Anda selesaikan sendiri." },
  { category: "experience", ko: "고객이나 동료에게 좋은 평가를 받았던 경험이 있나요?", en: "Have you received great feedback from a customer or colleague?", zh: "你有被客户或同事好评的经历吗？", vi: "Bạn từng được khách hàng hay đồng nghiệp khen chưa?", ja: "お客様や同僚から高く評価された経験はありますか？", id: "Pernahkah Anda dipuji pelanggan atau rekan kerja?" },
  { category: "experience", ko: "한국에서 공부하며 가장 힘들었던 점과 극복한 방법은요?", en: "What was hardest about studying in Korea, and how did you overcome it?", zh: "在韩国学习时最难的是什么？你是怎么克服的？", vi: "Điều khó nhất khi học ở Hàn là gì và bạn vượt qua thế nào?", ja: "韓国で勉強して一番大変だったことと、その乗り越え方は？", id: "Apa yang tersulit saat belajar di Korea dan bagaimana Anda mengatasinya?" },
  { category: "weakness", ko: "본인의 단점은 무엇이고, 어떻게 고치고 있나요?", en: "What is your weakness, and how are you improving it?", zh: "你的缺点是什么？你如何改进？", vi: "Điểm yếu của bạn là gì và bạn cải thiện thế nào?", ja: "あなたの短所は何で、どう直していますか？", id: "Apa kelemahan Anda dan bagaimana memperbaikinya?" },
  { category: "weakness", ko: "상사가 부당한 지시를 한다면 어떻게 하겠어요?", en: "What would you do if your manager gave an unfair instruction?", zh: "如果上司给出不合理的指示，你会怎么做？", vi: "Nếu cấp trên giao việc không hợp lý, bạn sẽ làm gì?", ja: "上司が理不尽な指示をしたらどうしますか？", id: "Apa yang Anda lakukan jika atasan memberi instruksi tidak adil?" },
  { category: "weakness", ko: "마감이 촉박한데 일이 끝나지 않았다면 어떻게 하나요?", en: "What do you do when a deadline is near and the work isn't done?", zh: "截止日期临近但工作没完成时你会怎么做？", vi: "Sắp đến hạn mà việc chưa xong thì bạn làm gì?", ja: "締切が迫っているのに終わらないとき、どうしますか？", id: "Apa yang Anda lakukan jika tenggat dekat dan pekerjaan belum selesai?" },
  { category: "weakness", ko: "스트레스를 받을 때 어떻게 관리하나요?", en: "How do you manage stress?", zh: "你如何应对压力？", vi: "Bạn quản lý căng thẳng thế nào?", ja: "ストレスをどう管理していますか？", id: "Bagaimana Anda mengelola stres?" },
  { category: "weakness", ko: "문화가 다른 동료와 일할 때 무엇을 신경 쓰나요?", en: "What do you pay attention to when working with colleagues from other cultures?", zh: "和不同文化的同事共事时你会注意什么？", vi: "Khi làm việc với đồng nghiệp khác văn hóa, bạn chú ý điều gì?", ja: "文化の違う同僚と働くとき、何に気をつけますか？", id: "Apa yang Anda perhatikan saat bekerja dengan rekan beda budaya?" },
  { category: "weakness", ko: "마지막으로 하고 싶은 말이 있나요?", en: "Is there anything else you'd like to say?", zh: "最后还有什么想说的吗？", vi: "Bạn còn điều gì muốn nói không?", ja: "最後に言いたいことはありますか？", id: "Ada hal lain yang ingin Anda sampaikan?" }
];

/** 한국 시간 기준 오늘(YYYY-MM-DD). */
export function kstDay(ts = Date.now()): string {
  return new Date(ts + 9 * 3_600_000).toISOString().slice(0, 10);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** 오늘의 질문 — 날짜(+사용자)로 고른다. 같은 날엔 같은 질문, 사람마다 순서가 다르다. */
export function pickDailyQuestion(userId: string | null | undefined, day = kstDay()): DailyQuestion {
  return DAILY_QUESTIONS[hash(`${day}:${userId ?? ""}`) % DAILY_QUESTIONS.length];
}

export function questionText(t: PlatformT, q: DailyQuestion): string {
  return t(q.ko, q.en, q.zh, q.vi, q.ja, q.id);
}

// ── 한국어 면접 표현 — 외국인 지원자가 면접에서 바로 쓰는 존댓말 틀. 하루 하나.
export type Expression = { ko: string; example: string; en: string; zh: string; vi: string; ja: string; id: string };

export const EXPRESSIONS: Expression[] = [
  { ko: "제가 맡았던 업무는 ~였습니다.", example: "제가 맡았던 업무는 SNS 콘텐츠 기획이었습니다.", en: "My responsibility was ~.", zh: "我负责的工作是~。", vi: "Công việc tôi phụ trách là ~.", ja: "私が担当した業務は〜でした。", id: "Tugas yang saya tangani adalah ~." },
  { ko: "그 경험을 통해 ~을/를 배웠습니다.", example: "그 경험을 통해 일정을 나눠 관리하는 법을 배웠습니다.", en: "Through that experience, I learned ~.", zh: "通过那次经历，我学到了~。", vi: "Qua trải nghiệm đó, tôi đã học được ~.", ja: "その経験を通して〜を学びました。", id: "Dari pengalaman itu, saya belajar ~." },
  { ko: "~한 결과, ~%를 개선했습니다.", example: "업로드 시간을 바꾼 결과, 반응률을 30% 개선했습니다.", en: "As a result of ~, I improved ~ by ~%.", zh: "通过~，我把~提高了~%。", vi: "Nhờ ~, tôi đã cải thiện ~ thêm ~%.", ja: "〜した結果、〜%改善しました。", id: "Hasil dari ~, saya meningkatkan ~ sebesar ~%." },
  { ko: "저의 강점은 ~이라고 생각합니다.", example: "저의 강점은 꼼꼼하게 확인하는 습관이라고 생각합니다.", en: "I believe my strength is ~.", zh: "我认为我的优点是~。", vi: "Tôi nghĩ điểm mạnh của mình là ~.", ja: "私の強みは〜だと思います。", id: "Saya rasa kekuatan saya adalah ~." },
  { ko: "부족한 점은 ~이지만, ~로 보완하고 있습니다.", example: "발표가 부족하지만, 스터디에서 매주 발표하며 보완하고 있습니다.", en: "My weak point is ~, but I'm improving it by ~.", zh: "我的不足是~，但我正在通过~弥补。", vi: "Điểm yếu là ~, nhưng tôi đang khắc phục bằng ~.", ja: "足りない点は〜ですが、〜で補っています。", id: "Kekurangan saya ~, tetapi saya memperbaikinya dengan ~." },
  { ko: "귀사에 지원한 이유는 ~ 때문입니다.", example: "귀사에 지원한 이유는 해외 고객을 늘리려는 방향에 공감했기 때문입니다.", en: "I applied to your company because ~.", zh: "我申请贵公司是因为~。", vi: "Tôi ứng tuyển vào quý công ty vì ~.", ja: "貴社に応募した理由は〜だからです。", id: "Saya melamar ke perusahaan Anda karena ~." },
  { ko: "입사한다면 ~에 기여하고 싶습니다.", example: "입사한다면 베트남 시장 콘텐츠에 기여하고 싶습니다.", en: "If I join, I'd like to contribute to ~.", zh: "如果入职，我想为~做出贡献。", vi: "Nếu được vào, tôi muốn đóng góp cho ~.", ja: "入社したら〜に貢献したいです。", id: "Jika bergabung, saya ingin berkontribusi pada ~." },
  { ko: "질문을 다시 한번 말씀해 주시겠어요?", example: "죄송하지만, 질문을 다시 한번 말씀해 주시겠어요?", en: "Could you please repeat the question?", zh: "能请您再说一遍问题吗？", vi: "Anh/chị có thể nhắc lại câu hỏi không ạ?", ja: "質問をもう一度おっしゃっていただけますか？", id: "Bisakah Anda mengulang pertanyaannya?" },
  { ko: "잠시 생각할 시간을 주실 수 있을까요?", example: "좋은 질문이네요. 잠시 생각할 시간을 주실 수 있을까요?", en: "May I have a moment to think?", zh: "可以给我一点时间想一下吗？", vi: "Tôi có thể suy nghĩ một chút được không ạ?", ja: "少し考える時間をいただけますか？", id: "Boleh saya berpikir sebentar?" },
  { ko: "구체적인 예를 들어 말씀드리면, ~", example: "구체적인 예를 들어 말씀드리면, 지난 학기 팀 프로젝트에서~", en: "To give a specific example, ~", zh: "举个具体例子，~", vi: "Lấy ví dụ cụ thể, ~", ja: "具体的な例を挙げますと、〜", id: "Sebagai contoh konkret, ~" },
  { ko: "처음에는 ~했지만, ~하면서 해결했습니다.", example: "처음에는 의견이 달랐지만, 기준을 정하면서 해결했습니다.", en: "At first ~, but I solved it by ~.", zh: "一开始~，但通过~解决了。", vi: "Lúc đầu ~, nhưng tôi đã giải quyết bằng ~.", ja: "最初は〜でしたが、〜しながら解決しました。", id: "Awalnya ~, tetapi saya menyelesaikannya dengan ~." },
  { ko: "~에 관심을 갖게 된 계기는 ~입니다.", example: "마케팅에 관심을 갖게 된 계기는 학교 SNS 운영입니다.", en: "What got me interested in ~ was ~.", zh: "我对~产生兴趣的契机是~。", vi: "Lý do tôi quan tâm đến ~ là ~.", ja: "〜に興味を持ったきっかけは〜です。", id: "Awal saya tertarik pada ~ adalah ~." },
  { ko: "한국어는 업무 회의가 가능한 수준입니다.", example: "한국어는 업무 회의가 가능한 수준이고, TOPIK 5급을 가지고 있습니다.", en: "My Korean is good enough for work meetings.", zh: "我的韩语可以进行工作会议。", vi: "Tiếng Hàn của tôi đủ để họp công việc.", ja: "韓国語は業務の会議ができるレベルです。", id: "Bahasa Korea saya cukup untuk rapat kerja." },
  { ko: "팀원들과 ~을/를 나누어 맡았습니다.", example: "팀원들과 자료 조사, 디자인, 발표를 나누어 맡았습니다.", en: "I divided ~ with my teammates.", zh: "我和队员分工负责~。", vi: "Tôi chia ~ với các thành viên trong nhóm.", ja: "チームメンバーと〜を分担しました。", id: "Saya membagi ~ dengan rekan tim." },
  { ko: "마지막으로 한 말씀 드려도 될까요?", example: "마지막으로 한 말씀 드려도 될까요? 오늘 기회 주셔서 감사합니다.", en: "May I say one last thing?", zh: "最后我可以说一句吗？", vi: "Cho tôi nói thêm một câu cuối được không ạ?", ja: "最後に一言よろしいでしょうか？", id: "Bolehkah saya menyampaikan satu hal terakhir?" },
  { ko: "기회를 주셔서 감사합니다.", example: "오늘 면접 기회를 주셔서 감사합니다.", en: "Thank you for the opportunity.", zh: "感谢您给我这个机会。", vi: "Cảm ơn vì đã cho tôi cơ hội.", ja: "機会をいただきありがとうございます。", id: "Terima kasih atas kesempatannya." }
];

export function pickDailyExpression(day = kstDay()): Expression {
  return EXPRESSIONS[hash(`expr:${day}`) % EXPRESSIONS.length];
}

export function expressionMeaning(t: PlatformT, e: Expression): string {
  return t(e.ko, e.en, e.zh, e.vi, e.ja, e.id);
}

// ── 한국 면접 매너 퀴즈 — 외국인 지원자가 실제로 헷갈리는 것. 하루 3문제(날짜로 고정).
export type QuizItem = {
  q: [string, string, string, string, string, string];
  options: [string, string, string, string, string, string][];
  answer: number;
  why: [string, string, string, string, string, string];
};

export const MANNER_QUIZ: QuizItem[] = [
  {
    q: ["면접장에 들어갈 때 가장 알맞은 인사는?", "Best greeting when entering the interview room?", "进入面试室时最合适的问候是？", "Lời chào phù hợp nhất khi vào phòng phỏng vấn?", "面接室に入るときの最適な挨拶は？", "Salam terbaik saat masuk ruang wawancara?"],
    options: [
      ["\"안녕하세요!\" 하고 바로 앉는다", "Say \"Hello!\" and sit right away", "说\"你好！\"就直接坐下", "Chào rồi ngồi ngay", "「こんにちは！」と言ってすぐ座る", "Sapa lalu langsung duduk"],
      ["가볍게 목례하고 \"안녕하십니까, ○○○입니다\" 한 뒤 앉으라고 하면 앉는다", "Bow lightly, say \"Hello, I'm ○○○\", sit when invited", "轻轻鞠躬说\"您好，我是○○○\"，等对方示意再坐", "Cúi nhẹ, chào và giới thiệu tên, ngồi khi được mời", "軽く会釈し名乗り、勧められてから座る", "Membungkuk ringan, sebut nama, duduk saat dipersilakan"],
      ["악수를 먼저 청한다", "Offer a handshake first", "先主动握手", "Chủ động bắt tay trước", "先に握手を求める", "Menawarkan jabat tangan dulu"]
    ],
    answer: 1,
    why: ["한국 면접에선 목례와 함께 이름을 말하고, 면접관이 권할 때 앉는 게 기본이에요. 악수는 면접관이 먼저 청할 때만.", "In Korea, bow and say your name, then sit when invited. Shake hands only if they offer.", "韩国面试中鞠躬并报名字，面试官示意后再坐。只有对方先伸手时才握手。", "Ở Hàn, cúi chào, nói tên và ngồi khi được mời. Chỉ bắt tay khi họ chủ động.", "韓国では会釈して名乗り、勧められてから座るのが基本。握手は相手から求められた時だけ。", "Di Korea, membungkuk, sebut nama, duduk saat dipersilakan. Jabat tangan hanya jika ditawari."]
  },
  {
    q: ["면접관을 부를 때 알맞은 말은?", "How should you address the interviewer?", "称呼面试官时合适的说法是？", "Nên gọi người phỏng vấn thế nào?", "面接官の呼び方として適切なのは？", "Cara memanggil pewawancara yang tepat?"],
    options: [
      ["\"면접관님\"", "\"Myeonjeopgwan-nim\" (Interviewer)", "\"面试官님\"", "\"Myeonjeopgwan-nim\"", "「面接官様（면접관님）」", "\"Myeonjeopgwan-nim\""],
      ["\"아저씨\" 또는 \"선생님\"", "\"Ajeossi\" or \"Seonsaengnim\"", "\"大叔\"或\"老师\"", "\"Ajeossi\" hoặc \"Seonsaengnim\"", "「おじさん」や「先生」", "\"Ajeossi\" atau \"Seonsaengnim\""],
      ["이름을 부른다", "Use their first name", "直接叫名字", "Gọi tên", "名前で呼ぶ", "Panggil nama"]
    ],
    answer: 0,
    why: ["\"면접관님\"이 가장 무난해요. 직함을 알면 \"팀장님\"처럼 불러도 좋아요.", "\"Myeonjeopgwan-nim\" is safest. If you know their title, use it (e.g. \"Team lead-nim\").", "\"面试官님\"最稳妥。知道职位时也可以叫\"组长님\"。", "\"Myeonjeopgwan-nim\" là an toàn nhất. Biết chức danh thì dùng chức danh.", "「면접관님」が無難。役職がわかれば「팀장님」なども可。", "\"Myeonjeopgwan-nim\" paling aman. Jika tahu jabatannya, pakai jabatan."]
  },
  {
    q: ["\"1분 자기소개\"는 대략 몇 글자 분량이 알맞을까요?", "How long should a 1-minute self-intro be (Korean)?", "\"1分钟自我介绍\"大约多少字合适？", "Tự giới thiệu 1 phút nên khoảng bao nhiêu chữ (tiếng Hàn)?", "「1分自己紹介」は何文字くらいが適切？", "Perkenalan 1 menit sebaiknya berapa karakter (Korea)?"],
    options: [
      ["100자 정도", "About 100 chars", "约100字", "Khoảng 100 chữ", "100字ほど", "Sekitar 100 karakter"],
      ["250~400자 정도", "About 250–400 chars", "约250~400字", "Khoảng 250–400 chữ", "250〜400字ほど", "Sekitar 250–400 karakter"],
      ["800자 이상", "800+ chars", "800字以上", "Trên 800 chữ", "800字以上", "Lebih dari 800 karakter"]
    ],
    answer: 1,
    why: ["보통 1분에 300자 안팎을 말해요. 이름 → 핵심 경험 하나(숫자로) → 강점 → 지원 동기 순서가 깔끔해요.", "People say ~300 chars a minute. Name → one key experience (with numbers) → strength → motivation.", "一般一分钟约说300字。名字→一个核心经历（带数字）→优点→动机。", "Khoảng 300 chữ mỗi phút. Tên → 1 trải nghiệm chính (có số) → điểm mạnh → động lực.", "1分で300字前後。名前→核心の経験1つ（数字で）→強み→動機の順がすっきり。", "Sekitar 300 karakter per menit. Nama → satu pengalaman utama → kekuatan → motivasi."]
  },
  {
    q: ["\"희망 연봉은 얼마인가요?\"라는 질문에 가장 좋은 답은?", "Best answer to \"What's your expected salary?\"", "被问\"期望年薪多少？\"最好的回答是？", "Câu trả lời tốt nhất cho \"Mức lương mong muốn?\"", "「希望年収は？」への最適な答えは？", "Jawaban terbaik untuk \"Berapa gaji yang diharapkan?\""],
    options: [
      ["\"아무거나 괜찮습니다\"", "\"Anything is fine\"", "\"多少都可以\"", "\"Bao nhiêu cũng được\"", "「いくらでも大丈夫です」", "\"Berapa saja boleh\""],
      ["근거 없이 높은 금액을 말한다", "Name a high number with no basis", "毫无依据地说高价", "Nói con số cao không có căn cứ", "根拠なく高い額を言う", "Sebut angka tinggi tanpa dasar"],
      ["\"회사 내규를 따르겠습니다\" 또는 시장 수준을 근거로 범위를 말한다", "\"I'll follow company policy\" or give a range based on the market", "\"遵循公司规定\"或根据市场水平给出范围", "\"Theo quy định công ty\" hoặc nêu khoảng theo thị trường", "「御社の規定に従います」か相場に基づく範囲を伝える", "\"Mengikuti aturan perusahaan\" atau rentang sesuai pasar"]
    ],
    answer: 2,
    why: ["신입은 \"내규를 따르겠다\"가 무난하고, 경력이면 시장 수준을 근거로 범위를 말해요. E-7 비자는 연봉 기준이 있어서 너무 낮게 말하지 않는 게 좋아요.", "Juniors usually say \"company policy\"; experienced hires give a market-based range. E-7 has a salary threshold, so don't go too low.", "新人一般说\"遵循规定\"，有经验者按市场给范围。E-7签证有年薪标准，别说太低。", "Người mới nói \"theo quy định\", có kinh nghiệm thì nêu khoảng theo thị trường. E-7 có ngưỡng lương nên đừng nói quá thấp.", "新卒は「規定に従います」、経験者は相場で範囲を。E-7は年収基準があるので低すぎないように。", "Lulusan baru: \"aturan perusahaan\"; berpengalaman: rentang pasar. E-7 punya ambang gaji, jangan terlalu rendah."]
  },
  {
    q: ["질문을 잘 못 알아들었을 때 가장 좋은 행동은?", "You didn't understand a question. Best move?", "没听懂问题时最好的做法是？", "Không hiểu câu hỏi thì nên làm gì?", "質問がよく聞き取れなかった時は？", "Tidak paham pertanyaan. Sebaiknya?"],
    options: [
      ["아는 내용으로 대충 답한다", "Answer vaguely with what you know", "用自己知道的随便回答", "Trả lời đại khái", "知っていることで適当に答える", "Jawab seadanya"],
      ["\"죄송하지만, 질문을 다시 한번 말씀해 주시겠어요?\"라고 묻는다", "Ask: \"Sorry, could you repeat the question?\"", "说\"不好意思，能请您再说一遍吗？\"", "Hỏi lại lịch sự: \"Xin lỗi, anh/chị nhắc lại được không ạ?\"", "「恐れ入りますが、もう一度おっしゃっていただけますか？」と聞く", "Tanya: \"Maaf, bisa diulang pertanyaannya?\""],
      ["말없이 기다린다", "Wait silently", "沉默等待", "Im lặng chờ", "黙って待つ", "Diam menunggu"]
    ],
    answer: 1,
    why: ["다시 물어보는 건 감점이 아니에요. 엉뚱하게 답하는 것보다 훨씬 좋아요.", "Asking again isn't penalized — it's far better than answering off-topic.", "再问一遍不会扣分，比答非所问好得多。", "Hỏi lại không bị trừ điểm — tốt hơn nhiều so với trả lời lạc đề.", "聞き返しても減点になりません。的外れに答えるよりずっと良いです。", "Bertanya ulang tidak mengurangi nilai — jauh lebih baik dari menjawab melenceng."]
  },
  {
    q: ["면접 복장으로 가장 무난한 것은? (공고에 안내가 없을 때)", "Safest interview outfit (when not specified)?", "（未注明时）最稳妥的面试着装是？", "Trang phục phỏng vấn an toàn nhất (khi không ghi)?", "（指定がない時）最も無難な服装は？", "Pakaian wawancara paling aman (jika tidak disebut)?"],
    options: [
      ["깔끔한 정장 또는 단정한 비즈니스 캐주얼", "A neat suit or tidy business casual", "整洁的正装或得体的商务休闲装", "Vest gọn gàng hoặc business casual chỉnh tề", "きちんとしたスーツか清潔なビジネスカジュアル", "Jas rapi atau business casual"],
      ["편한 운동복", "Comfortable sportswear", "舒适的运动服", "Đồ thể thao", "楽なスポーツウェア", "Pakaian olahraga"],
      ["화려한 파티 옷", "Flashy party clothes", "华丽的派对服", "Đồ dự tiệc lộng lẫy", "派手なパーティー服", "Pakaian pesta mencolok"]
    ],
    answer: 0,
    why: ["대기업·금융은 정장, 스타트업·IT는 단정한 비즈니스 캐주얼이 많아요. 헷갈리면 조금 더 격식 있게.", "Big firms/finance: suit. Startups/IT: tidy business casual. When unsure, go a bit more formal.", "大企业/金融穿正装，创业/IT多为商务休闲。拿不准就更正式一点。", "Tập đoàn/tài chính: vest. Startup/IT: business casual. Phân vân thì trang trọng hơn.", "大企業・金融はスーツ、スタートアップ・ITはビジカジが多い。迷ったら少しフォーマルに。", "Korporat/keuangan: jas. Startup/IT: business casual. Ragu? Lebih formal."]
  },
  {
    q: ["면접 장소에는 언제 도착하는 게 좋을까요?", "When should you arrive?", "什么时候到达面试地点最好？", "Nên đến lúc nào?", "面接会場にはいつ着くのが良い？", "Kapan sebaiknya tiba?"],
    options: [
      ["딱 정시에", "Exactly on time", "准点到", "Đúng giờ", "ちょうど定刻に", "Tepat waktu"],
      ["10~15분 전", "10–15 minutes early", "提前10~15分钟", "Sớm 10–15 phút", "10〜15分前", "10–15 menit lebih awal"],
      ["1시간 전", "An hour early", "提前一小时", "Sớm 1 tiếng", "1時間前", "1 jam lebih awal"]
    ],
    answer: 1,
    why: ["10~15분 전에 도착해 안내를 받는 게 좋아요. 너무 일찍 가면 회사에 부담이 될 수 있어요. 늦을 것 같으면 미리 전화하세요.", "Arrive 10–15 min early. Too early can burden the company. If you'll be late, call ahead.", "提前10~15分钟到最好。太早会给公司带来负担。可能迟到要提前打电话。", "Đến sớm 10–15 phút. Quá sớm có thể gây phiền. Nếu trễ, gọi báo trước.", "10〜15分前が良いです。早すぎると会社の負担に。遅れそうなら事前に電話を。", "Tiba 10–15 menit lebih awal. Terlalu awal bisa merepotkan. Jika telat, telepon dulu."]
  },
  {
    q: ["\"마지막으로 궁금한 점 있나요?\"에 가장 좋은 답은?", "Best reply to \"Any questions for us?\"", "被问\"最后有什么想问的吗？\"最好的回答是？", "Trả lời tốt nhất cho \"Bạn có câu hỏi nào không?\"", "「最後に質問はありますか？」への最適な答えは？", "Jawaban terbaik untuk \"Ada pertanyaan?\""],
    options: [
      ["\"없습니다\"", "\"No, none\"", "\"没有\"", "\"Không có ạ\"", "「ありません」", "\"Tidak ada\""],
      ["연봉·휴가만 묻는다", "Ask only about pay and vacation", "只问薪资和休假", "Chỉ hỏi lương và nghỉ phép", "給与・休暇だけ聞く", "Hanya tanya gaji dan cuti"],
      ["업무·팀에 대한 질문 1~2개를 한다", "Ask 1–2 questions about the work or team", "提1~2个关于工作或团队的问题", "Hỏi 1–2 câu về công việc hoặc nhóm", "業務・チームについて1〜2個質問する", "Tanya 1–2 hal tentang pekerjaan/tim"]
    ],
    answer: 2,
    why: ["\"입사하면 첫 3개월 동안 어떤 일을 기대하시나요?\"처럼 업무·팀 질문을 하면 관심과 준비가 보여요.", "Questions like \"What would you expect in my first 3 months?\" show interest and preparation.", "像\"入职前三个月您期待我做什么？\"这样的问题能体现兴趣和准备。", "Câu như \"3 tháng đầu anh/chị kỳ vọng gì?\" cho thấy sự quan tâm và chuẩn bị.", "「入社後3か月で期待されることは？」のような質問は関心と準備を示せます。", "Pertanyaan seperti \"Apa harapan di 3 bulan pertama?\" menunjukkan minat."]
  },
  {
    q: ["면접이 끝나고 나갈 때 알맞은 행동은?", "What to do when leaving after the interview?", "面试结束离开时合适的做法是？", "Khi ra về sau phỏng vấn nên làm gì?", "面接が終わって退室する時は？", "Saat keluar setelah wawancara?"],
    options: [
      ["일어나서 \"감사합니다\" 인사하고, 문 앞에서 한 번 더 목례한다", "Stand, say \"Thank you\", and bow once more at the door", "起身说\"谢谢\"，在门口再鞠躬一次", "Đứng dậy cảm ơn và cúi chào lần nữa ở cửa", "立って「ありがとうございました」、ドアの前でもう一度会釈", "Berdiri, ucapkan terima kasih, membungkuk lagi di pintu"],
      ["휴대폰을 확인하며 나간다", "Check your phone as you leave", "边看手机边离开", "Vừa đi vừa xem điện thoại", "スマホを見ながら出る", "Keluar sambil cek ponsel"],
      ["인사 없이 바로 나간다", "Leave without a word", "不打招呼直接离开", "Ra về không chào", "挨拶せずすぐ出る", "Langsung keluar tanpa salam"]
    ],
    answer: 0,
    why: ["면접은 문을 닫고 나갈 때까지예요. 마지막 인사까지 단정하게.", "The interview lasts until you close the door — keep it polite to the end.", "直到关门离开面试才算结束，礼貌到最后。", "Phỏng vấn kéo dài đến khi bạn đóng cửa — lịch sự đến cuối.", "面接はドアを閉めるまで。最後まで丁寧に。", "Wawancara berlangsung sampai pintu ditutup — tetap sopan."]
  },
  {
    q: ["\"한국에서 오래 일할 생각인가요?\"라는 질문의 의도는?", "Intent behind \"Do you plan to work in Korea long-term?\"", "\"打算在韩国长期工作吗？\"这个问题的意图是？", "Ý của câu \"Bạn định làm ở Hàn lâu dài không?\"", "「韓国で長く働くつもりですか？」の意図は？", "Maksud \"Apakah berencana kerja lama di Korea?\""],
    options: [
      ["개인적인 호기심", "Personal curiosity", "个人好奇", "Tò mò cá nhân", "個人的な好奇心", "Rasa ingin tahu pribadi"],
      ["뽑은 뒤 금방 떠나지 않을지(비자·정착 계획) 확인하려는 것", "To check you won't leave soon (visa, settling plans)", "确认录用后不会很快离开（签证、定居计划）", "Kiểm tra bạn có rời đi sớm không (visa, kế hoạch)", "採用後すぐ辞めないか（ビザ・定着計画）確認するため", "Memastikan tidak cepat pergi (visa, rencana)"],
      ["거절하려는 신호", "A sign of rejection", "拒绝的信号", "Dấu hiệu từ chối", "不採用のサイン", "Tanda penolakan"]
    ],
    answer: 1,
    why: ["회사는 비자 절차에 시간과 비용을 들여요. 비자 계획과 한국에서 이루고 싶은 목표를 구체적으로 말하면 좋아요.", "Companies invest in visa procedures. Share your visa plan and concrete goals in Korea.", "公司要为签证投入时间和费用。具体说明签证计划和在韩目标。", "Công ty đầu tư cho thủ tục visa. Hãy nói rõ kế hoạch visa và mục tiêu ở Hàn.", "会社はビザ手続きに時間と費用をかけます。ビザ計画と韓国での目標を具体的に。", "Perusahaan berinvestasi pada visa. Jelaskan rencana visa dan tujuanmu di Korea."]
  },
  {
    q: ["답변할 때 가장 좋은 말투는?", "Best speaking style when answering?", "回答时最好的语气是？", "Cách nói tốt nhất khi trả lời?", "回答する時の最適な話し方は？", "Gaya bicara terbaik saat menjawab?"],
    options: [
      ["\"~했어요\" 같은 해요체", "Casual-polite \"~haeyo\"", "\"~했어요\"这样的해요体", "Kiểu \"~haeyo\"", "「〜했어요」の해요体", "Gaya \"~haeyo\""],
      ["\"~했습니다\" 같은 합니다체", "Formal \"~haetseumnida\"", "\"~했습니다\"这样的합니다体", "Kiểu trang trọng \"~seumnida\"", "「〜했습니다」の합니다体", "Gaya formal \"~seumnida\""],
      ["반말", "Banmal (informal)", "半语", "Nói trống không (banmal)", "タメ口", "Banmal (informal)"]
    ],
    answer: 1,
    why: ["면접에선 \"~습니다\"체가 기본이에요. 중간중간 \"~요\"가 섞여도 괜찮지만 반말은 피하세요.", "Use \"~seumnida\" by default. A few \"~yo\" are fine; never banmal.", "面试以\"~습니다\"体为主，偶尔用\"~요\"可以，但避免半语。", "Dùng \"~seumnida\" là chính. Thỉnh thoảng \"~yo\" cũng được, tránh banmal.", "面接は「〜습니다」体が基本。「〜요」が混ざってもOK、タメ口はNG。", "Gunakan \"~seumnida\". Sesekali \"~yo\" boleh, hindari banmal."]
  },
  {
    q: ["면접 결과 연락이 늦을 때 가장 알맞은 행동은?", "Results are late. What's appropriate?", "面试结果迟迟没通知时合适的做法是？", "Kết quả chậm thì nên làm gì?", "結果の連絡が遅い時は？", "Hasil terlambat. Apa yang tepat?"],
    options: [
      ["매일 전화한다", "Call every day", "每天打电话", "Gọi mỗi ngày", "毎日電話する", "Telepon setiap hari"],
      ["안내받은 날짜가 지나면 정중하게 한 번 문의한다", "After the stated date, politely ask once", "过了告知的日期后礼貌地询问一次", "Quá ngày hẹn thì hỏi lịch sự một lần", "案内された日が過ぎたら丁寧に一度問い合わせる", "Setelah tanggal yang disebut, tanyakan sekali dengan sopan"],
      ["떨어졌다고 생각하고 연락하지 않는다", "Assume you failed and never ask", "认为落选了不再联系", "Nghĩ là trượt và không hỏi", "落ちたと思って連絡しない", "Anggap gagal dan tidak bertanya"]
    ],
    answer: 1,
    why: ["안내받은 일정이 지나면 이메일이나 전화로 한 번 정중하게 물어보세요. Aply 지원이라면 지원 현황의 메시지로 물어볼 수 있어요.", "After the stated date, ask once by email or phone. For Aply applications, use Messages in Applications.", "过了告知日期后，用邮件或电话礼貌询问一次。Aply 投递可在投递状态里发消息询问。", "Sau ngày hẹn, hỏi một lần qua email/điện thoại. Với Aply, dùng Tin nhắn trong Trạng thái ứng tuyển.", "案内日を過ぎたらメールか電話で一度丁寧に。Aplyの応募なら応募状況のメッセージで。", "Setelah tanggal, tanyakan sekali via email/telepon. Untuk Aply, gunakan Pesan di Status lamaran."]
  }
];

/** 오늘의 매너 퀴즈 3문제(날짜로 고정). */
export function pickDailyQuiz(day = kstDay()): QuizItem[] {
  const start = hash(`quiz:${day}`) % MANNER_QUIZ.length;
  return [0, 1, 2].map((i) => MANNER_QUIZ[(start + i * 5) % MANNER_QUIZ.length]);
}

/** 10분 모의 면접 5문항 — 자기소개(고정) → 직무 → 경험 → 인성 → 마지막 말(고정). seed 로 섞는다. */
export function pickInterviewSet(seed: number): DailyQuestion[] {
  const by = (c: DailyQuestion["category"]) => DAILY_QUESTIONS.filter((q) => q.category === c);
  const pick = <T,>(arr: T[], k: number) => arr[(seed + k * 7) % arr.length];
  const intro = DAILY_QUESTIONS[0];
  const closing = DAILY_QUESTIONS[DAILY_QUESTIONS.length - 1];
  return [intro, pick(by("competency"), 1), pick(by("experience"), 2), pick(by("weakness").filter((q) => q !== closing), 3), closing];
}

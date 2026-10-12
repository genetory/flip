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

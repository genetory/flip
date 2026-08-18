// 이력서 미리보기/완성도 코칭 로직 — 정리한 경험을 이력서 문장(Before/After)으로,
// 부족한 부분은 "점수"가 아니라 "다음 단계 + 힌트"로 안내한다.
import type { TalentSnapshot } from "./types";
import type { PlatformT } from "../i18n";

export interface ResumeItem {
  id: string;
  title: string;
  period?: string;
  before: string; // 있는 그대로 말한 경험
  after: string; // 취업 언어로 정리된 문장
  hasNumber: boolean; // 성과에 숫자가 있는지
}

export interface CoachingStep {
  key: string;
  label: string;
  done: boolean;
  hint?: string;
}

export interface ResumePreviewData {
  name: string;
  headline?: string;
  targetRole?: string;
  items: ResumeItem[];
  coaching: CoachingStep[];
  filledCount: number;
  totalCount: number;
}

export function buildResumePreview(snapshot: TalentSnapshot, t: PlatformT, targetRole?: string): ResumePreviewData {
  const items: ResumeItem[] = snapshot.experiences.map((e) => {
    const after = e.summary ?? "";
    return {
      id: e.id,
      title: e.title,
      period: e.period,
      before: e.answers?.what ?? t(`${e.title} 경험`, `${e.title} experience`, `${e.title} 经历`, `Trải nghiệm ${e.title}`, `${e.title} の経験`, `Pengalaman ${e.title}`),
      after: after || t(`${e.title}에서 맡은 역할과 결과를 정리해보세요.`, `Sum up your role and results in ${e.title}.`, `请整理你在${e.title}中的角色和成果。`, `Hãy tóm tắt vai trò và kết quả của bạn ở ${e.title}.`, `${e.title} での役割と成果を整理してみましょう。`, `Rangkum peran dan hasilmu di ${e.title}.`),
      hasNumber: /\d/.test(after)
    };
  });

  const role = targetRole ?? snapshot.resumes[0]?.targetRole ?? snapshot.profile.interests[0];
  const headline = snapshot.profile.headline;

  const coaching: CoachingStep[] = [
    {
      key: "exp",
      label: t("경험 2개 이상 정리하기", "Organize 2+ experiences", "整理2个以上经历", "Sắp xếp từ 2 kinh nghiệm", "経験を2つ以上整理する", "Susun 2+ pengalaman"),
      done: items.length >= 2,
      hint: items.length < 2 ? t("경험이 많을수록 이력서가 단단해져요.", "The more experiences, the stronger your resume.", "经历越多，简历越扎实。", "Càng nhiều kinh nghiệm, CV càng vững.", "経験が多いほど履歴書が充実します。", "Makin banyak pengalaman, makin kuat resume-mu.") : undefined
    },
    {
      key: "number",
      label: t("성과에 숫자 넣기", "Add numbers to results", "为成果加入数字", "Thêm số vào kết quả", "成果に数字を入れる", "Tambahkan angka pada hasil"),
      done: items.some((i) => i.hasNumber),
      hint: t("'주문 누락 30% 감소'처럼 숫자를 넣으면 훨씬 설득력 있어요.", "Numbers like 'cut missed orders 30%' are far more convincing.", "像'漏单减少30%'这样的数字更有说服力。", "Con số như 'giảm 30% sót đơn' thuyết phục hơn nhiều.", "「注文漏れ30%削減」のように数字を入れると説得力が増します。", "Angka seperti 'pesanan terlewat turun 30%' jauh lebih meyakinkan.")
    },
    {
      key: "role",
      label: t("지원 직무 정하기", "Choose a target role", "确定申请职务", "Chọn vị trí ứng tuyển", "応募職種を決める", "Tentukan posisi tujuan"),
      done: Boolean(role),
      hint: role ? undefined : t("지원 직무를 정하면 그 직무에 맞춰 다듬어드려요.", "Pick a role and we'll tailor it to that role.", "确定职务后，我们会据此进行优化。", "Chọn vị trí và chúng tôi sẽ chỉnh theo vị trí đó.", "職種を決めればその職種に合わせて整えます。", "Pilih posisi dan kami sesuaikan untuk posisi itu.")
    },
    {
      key: "headline",
      label: t("한 줄 소개 쓰기", "Write a one-line intro", "写一句自我介绍", "Viết giới thiệu một dòng", "一言の自己紹介を書く", "Tulis intro satu baris"),
      done: Boolean(headline),
      hint: headline ? undefined : t("나를 한 문장으로 소개하면 첫인상이 좋아져요.", "A one-sentence intro makes a great first impression.", "用一句话介绍自己能带来好的第一印象。", "Một câu giới thiệu tạo ấn tượng đầu tốt.", "一文の自己紹介で第一印象が良くなります。", "Intro satu kalimat memberi kesan pertama yang baik.")
    }
  ];

  return {
    name: snapshot.profile.displayName,
    headline,
    targetRole: role,
    items,
    coaching,
    filledCount: coaching.filter((c) => c.done).length,
    totalCount: coaching.length
  };
}

// 이력서 템플릿(미리보기 스타일 프리셋). key/accent 는 데이터, label/desc 만 표시용.
export function resumeTemplates(t: PlatformT): { key: string; label: string; accent: string; desc: string }[] {
  return [
    { key: "clean", label: t("심플", "Simple", "简约", "Đơn giản", "シンプル", "Simpel"), accent: "#0B46E8", desc: t("깔끔하고 담백한 신입용", "Clean and plain, for newcomers", "干净简洁，适合新人", "Gọn gàng, dành cho người mới", "すっきり素直な新卒向け", "Bersih dan simpel untuk pemula") },
    { key: "warm", label: t("따뜻", "Warm", "温暖", "Ấm áp", "温かい", "Hangat"), accent: "#3A6B00", desc: t("부드러운 인상", "A soft impression", "柔和的印象", "Ấn tượng nhẹ nhàng", "柔らかい印象", "Kesan lembut") },
    { key: "bold", label: t("강조", "Bold", "醒目", "Nổi bật", "強調", "Tegas"), accent: "#0B1227", desc: t("또렷하고 힘있는", "Clear and strong", "清晰有力", "Rõ ràng, mạnh mẽ", "くっきり力強い", "Jelas dan kuat") }
  ];
}

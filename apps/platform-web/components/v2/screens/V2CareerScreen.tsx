"use client";

// v2 내 커리어 — 나에 관한 것을 한곳에: 기본 정보 · 관심 직무 · 지원 서류 · 경력 · 최근 기록 · 더 정리할 것.
// 관심 직무 고르기는 기존 팝업(JobInterestModal)을, 서류 편집은 기존 에디터를 그대로 쓴다.
import { useState } from "react";
import { V2Shell, V2_ROUTES } from "../V2Shell";
import { Chip, Masthead, MastheadSkeleton, Page, PrimaryButton, Progress, Row, Section, SectionSkeleton, TextLink } from "../ui";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { useResumeDoc, resumeCompleteness, displayMonth, useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { useCareerFeed, formatRelativeTime } from "../../../lib/talent/career-feed";
import { useCareerHistorySync } from "../../../lib/talent/useCareerHistorySync";
import { SECTION_META } from "../../../lib/talent/career-chat";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import { JobInterestModal } from "../../talent/jobs/JobInterestModal";

const R = {
  profile: "/talent/career/profile",
  resume: "/talent/career/resume/editor",
  resumePreview: "/talent/career/resume/preview",
  cover: "/talent/career/cover/editor",
  coverPreview: "/talent/career/cover/preview",
  resumes: "/talent/career/resumes",
  coverLetters: "/talent/career/cover-letters",
  experiences: "/talent/career/experiences",
  history: "/talent/career/history",
  diagnosis: "/talent/career/resume/diagnosis"
};

function docNote(t: PlatformT, pct: number): string {
  if (pct === 0) return t("아직 시작 전", "Not started", "尚未开始", "Chưa bắt đầu", "未着手", "Belum mulai");
  if (pct < 70) return t("채우는 중", "In progress", "填写中", "Đang điền", "作成中", "Sedang diisi");
  if (pct < 100) return t("거의 다 됐어요", "Almost there", "快完成了", "Sắp xong", "あと少し", "Hampir selesai");
  return t("완성", "Done", "完成", "Xong", "完成", "Selesai");
}

export function V2CareerScreen() {
  return (
    <V2Shell requireAuth>
      <Career />
    </V2Shell>
  );
}

function Career() {
  const t = usePlatformT();
  useCareerHistorySync();
  const info = useBasicInfo();
  const ready = isBasicInfoComplete(info);
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const interests = useJobInterests();
  const feed = useCareerFeed();
  const [interestOpen, setInterestOpen] = useState(false);
  const work = (resume?.items ?? []).filter((i) => i.section === "experience");
  const name = info.realName;
  const docsStatus = useRenewalDocsStatus();

  // 기본 정보·서류는 계정에서 불러온다 — 다 오기 전엔 화면 모양만(기본 정보 미입력 안내가 깜빡이지 않게).
  if (docsStatus !== "loaded")
    return (
      <Page>
        <MastheadSkeleton action={false} />
        <SectionSkeleton thumb={false} rows={2} />
        <SectionSkeleton thumb={false} rows={1} />
        <SectionSkeleton />
      </Page>
    );

  return (
    <Page>
      {ready ? (
        <Masthead
          eyebrow={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier saya")}
          title={name ? t(`${name}님의 커리어`, `${name}'s career`, `${name} 的职业`, `Sự nghiệp của ${name}`, `${name}さんのキャリア`, `Karier ${name}`) : t("나의 커리어", "My career", "我的职业", "Sự nghiệp của tôi", "私のキャリア", "Karier saya")}
          lede={
            interests.length
              ? t(`관심 직무 · ${interests.map((r) => jobTaxonomyLabelOf(t, r)).join(", ")}`, `Interested in · ${interests.map((r) => jobTaxonomyLabelOf(t, r)).join(", ")}`, `感兴趣的职位 · ${interests.map((r) => jobTaxonomyLabelOf(t, r)).join("、")}`, `Quan tâm · ${interests.map((r) => jobTaxonomyLabelOf(t, r)).join(", ")}`, `関心職種 · ${interests.map((r) => jobTaxonomyLabelOf(t, r)).join("、")}`, `Minat · ${interests.map((r) => jobTaxonomyLabelOf(t, r)).join(", ")}`)
              : t("이력서·자기소개서와 관심 직무를 여기서 관리해요.", "Manage your resume, cover letter, and job interests here.", "在这里管理简历、自我介绍和感兴趣的职位。", "Quản lý CV, thư giới thiệu và nghề quan tâm tại đây.", "履歴書・自己PRと関心職種をここで管理します。", "Kelola CV, surat lamaran, dan minat pekerjaan di sini.")
          }
        />
      ) : (
        <Masthead
          eyebrow={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier saya")}
          title={t("기본 정보부터 채워 볼까요", "Let's start with your basic info", "先填写基本信息吧", "Bắt đầu với thông tin cơ bản", "まず基本情報から入力しましょう", "Mulai dari info dasar")}
          lede={t("이름·연락처는 이력서와 자기소개서에 똑같이 들어가요. 한 번만 입력하면 돼요.", "Your name and contact go into both your resume and cover letter. Enter them once.", "姓名和联系方式会同时用于简历和自我介绍，只需填写一次。", "Tên và liên hệ dùng chung cho CV và thư giới thiệu. Chỉ cần nhập một lần.", "名前・連絡先は履歴書と自己PRの両方に入ります。一度入力すればOKです。", "Nama dan kontak dipakai di CV dan surat lamaran. Cukup isi sekali.")}
          action={<PrimaryButton href={R.profile}>{t("기본 정보 입력하기", "Enter basic info", "填写基本信息", "Nhập thông tin", "基本情報を入力", "Isi info dasar")}</PrimaryButton>}
        />
      )}

      <Section title={t("지원 서류", "Documents", "申请材料", "Hồ sơ ứng tuyển", "応募書類", "Dokumen lamaran")}>
        {[
          { key: "resume", label: t("이력서", "Resume", "简历", "CV", "履歴書", "CV"), pct: rp, href: R.resume, preview: resume ? R.resumePreview : null },
          { key: "cover", label: t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran"), pct: cp, href: R.cover, preview: cover ? R.coverPreview : null }
        ].map((d) => (
          <div key={d.key} className="py-1">
            <Row href={d.href} title={d.label} meta={docNote(t, d.pct)} right={`${d.pct}%`} />
            <div className="-mt-1">
              <Progress pct={d.pct} />
            </div>
            {d.preview ? (
              <div className="mb-2 mt-2.5">
                <TextLink href={d.preview}>{t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")} ›</TextLink>
              </div>
            ) : null}
          </div>
        ))}
      </Section>

      <Section
        title={t("관심 직무", "Job interests", "感兴趣的职位", "Nghề quan tâm", "関心職種", "Minat pekerjaan")}
        aside={<TextLink onClick={() => setInterestOpen(true)}>{interests.length ? t("수정", "Edit", "修改", "Sửa", "編集", "Ubah") : t("고르기", "Choose", "选择", "Chọn", "選ぶ", "Pilih")}</TextLink>}
      >
        {interests.length ? (
          <div className="flex flex-wrap gap-2 pb-2">
            {interests.map((r) => (
              <Chip key={r} onClick={() => setInterestOpen(true)}>
                {jobTaxonomyLabelOf(t, r)}
              </Chip>
            ))}
          </div>
        ) : (
          <Row onClick={() => setInterestOpen(true)} lead="🎯" title={t("관심 직무를 골라 주세요", "Pick your job interests", "请选择感兴趣的职位", "Chọn nghề bạn quan tâm", "関心職種を選んでください", "Pilih minat pekerjaan")} meta={t("고르면 맞춤 공고와 모의 면접이 더 정확해져요", "Recommendations and mock interviews get sharper", "推荐职位和模拟面试会更精准", "Gợi ý và phỏng vấn thử sẽ chính xác hơn", "おすすめと模擬面接が正確になります", "Rekomendasi dan wawancara lebih tepat")} />
        )}
      </Section>

      {work.length ? (
        <Section title={t("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")} aside={<TextLink href={R.resume}>{t("편집", "Edit", "编辑", "Sửa", "編集", "Ubah")}</TextLink>}>
          {work.map((w) => (
            <Row
              key={w.id}
              title={w.company || w.text}
              meta={[[displayMonth(w.startDate ?? ""), displayMonth(w.endDate ?? "")].filter(Boolean).join(" ~ "), w.company && w.text ? w.text : null].filter(Boolean).join(" · ") || undefined}
            />
          ))}
        </Section>
      ) : null}

      {feed.length ? (
        <Section title={t("최근 기록", "Recent updates", "最近记录", "Cập nhật gần đây", "最近の記録", "Pembaruan terbaru")} aside={<TextLink href={R.history}>{t("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}</TextLink>}>
          {feed.slice(0, 3).map((e) => (
            <Row
              key={e.id}
              href={e.href ?? R.history}
              lead={e.emoji ?? SECTION_META[e.section]?.emoji ?? "📝"}
              title={sectionLabelOf(t, e.section)}
              meta={e.text}
              right={<span className="text-[13px] font-medium text-[color:var(--v2-faint)]">{formatRelativeTime(e.createdAt, undefined, t)}</span>}
            />
          ))}
        </Section>
      ) : null}

      <Section title={t("더 정리하기", "More", "更多整理", "Sắp xếp thêm", "さらに整理", "Lainnya")}>
        <Row href={R.profile} lead="🙋" title={t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")} meta={[info.realName, info.email].filter(Boolean).join(" · ") || t("이름·연락처", "Name & contact", "姓名·联系方式", "Tên & liên hệ", "名前・連絡先", "Nama & kontak")} />
        <Row href={R.experiences} lead="🧩" title={t("경험 정리", "Experiences", "经历整理", "Kinh nghiệm", "経験の整理", "Pengalaman")} meta={t("알바·프로젝트·동아리를 이력서 재료로", "Turn jobs, projects, and clubs into resume material", "把兼职、项目、社团整理成简历素材", "Biến việc làm thêm, dự án thành chất liệu CV", "バイト・プロジェクトを履歴書の材料に", "Jadikan kerja & proyek bahan CV")} />
        <Row href={R.diagnosis} lead="🔎" title={t("이력서 AI 진단", "Resume AI check", "简历 AI 诊断", "Chẩn đoán CV", "履歴書AI診断", "Cek CV AI")} meta={t("보완할 점을 짚어 줘요", "Find what to improve", "指出需要改进的地方", "Chỉ ra điểm cần cải thiện", "改善点を教えます", "Temukan yang perlu diperbaiki")} />
        <Row href={R.resumes} lead="🗂️" title={t("저장한 서류", "Saved documents", "已保存的材料", "Hồ sơ đã lưu", "保存した書類", "Dokumen tersimpan")} meta={t("버전별 이력서·자기소개서", "Resume and cover letter versions", "各版本的简历和自我介绍", "Các phiên bản CV và thư", "バージョン別の履歴書・自己PR", "Versi CV dan surat")} />
        <Row href={V2_ROUTES.interviews} lead="🎤" title={t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} meta={t("내 서류로 예상 질문 연습", "Practice likely questions from your documents", "用我的材料练习预测问题", "Luyện câu hỏi từ hồ sơ", "書類から予想質問を練習", "Latih pertanyaan dari dokumen")} />
      </Section>

      {interestOpen ? <JobInterestModal initial={interests} onClose={() => setInterestOpen(false)} /> : null}
    </Page>
  );
}

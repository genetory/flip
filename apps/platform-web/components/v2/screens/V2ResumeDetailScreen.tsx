"use client";

// v2 이력서 상세 — 기존 ResumeDetailScreen 과 같은 데이터(useTalentSnapshot·buildResumePreview·resumeTemplates)로
// 완성도 체크 · 템플릿 · 미리보기 · 경험→문장 Before/After · 내보내기(mock) · 맞춤 분석/진단 진입을 v2 모양으로.
// 맞춤 분석(tailor)·진단(diagnosis)은 아직 v2 가 없어 기존 경로로 보낸다.
import { useMemo, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Button, Chip, Masthead, MastheadSkeleton, Page, PrimaryButton, Progress, Row, Section, SectionSkeleton } from "../ui";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { buildResumePreview, resumeTemplates } from "../../../lib/talent/resume-preview";
import { useResumeStatusLabel } from "../../../lib/talent/labels";
import type { TalentSnapshot } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

export function V2ResumeDetailScreen({ resumeId }: { resumeId: string }) {
  return (
    <V2Shell requireAuth>
      <Body resumeId={resumeId} />
    </V2Shell>
  );
}

function Body({ resumeId }: { resumeId: string }) {
  const t = usePlatformT();
  const { snapshot, status, reload } = useTalentSnapshot();
  if (status === "error") {
    return (
      <Page>
        <Masthead
          eyebrow={t("내 이력서", "My resume", "我的简历", "CV của tôi", "履歴書", "CV saya")}
          title={t("불러오지 못했어요", "Couldn't load", "加载失败", "Không tải được", "読み込めませんでした", "Gagal memuat")}
          action={<PrimaryButton onClick={reload}>{t("다시 시도", "Retry", "重试", "Thử lại", "再試行", "Coba lagi")}</PrimaryButton>}
        />
      </Page>
    );
  }
  if (status === "loading" || !snapshot) {
    return (
      <Page>
        <MastheadSkeleton action={false} />
        <SectionSkeleton thumb={false} />
      </Page>
    );
  }
  return <Content snapshot={snapshot} resumeId={resumeId} />;
}

function Content({ snapshot, resumeId }: { snapshot: TalentSnapshot; resumeId: string }) {
  const t = usePlatformT();
  const statusLabel = useResumeStatusLabel();
  const toast = useTalentPopup();
  const resume = snapshot.resumes.find((r) => r.id === resumeId) ?? snapshot.resumes[0];
  const templates = resumeTemplates(t);
  const [templateKey, setTemplateKey] = useState(templates[0].key);
  const preview = useMemo(() => buildResumePreview(snapshot, t, resume?.targetRole), [snapshot, t, resume?.targetRole]);
  const template = templates.find((tpl) => tpl.key === templateKey) ?? templates[0];

  if (!resume) {
    return (
      <Page>
        <Masthead
          eyebrow={t("내 이력서", "My resume", "我的简历", "CV của tôi", "履歴書", "CV saya")}
          title={t("이력서를 찾을 수 없어요", "Resume not found", "找不到简历", "Không tìm thấy CV", "履歴書が見つかりません", "CV tidak ditemukan")}
          lede={t("먼저 경험을 정리하고 첫 이력서를 만들어 보세요.", "Organize your experiences first, then create your first resume.", "请先整理经历，再制作第一份简历。", "Hãy sắp xếp kinh nghiệm trước, rồi tạo CV đầu tiên.", "まず経験を整理して最初の履歴書を作りましょう。", "Susun pengalaman dulu, lalu buat CV pertama.")}
          action={<PrimaryButton href="/talent/career/resumes">{t("이력서 목록으로", "To resume list", "返回简历列表", "Về danh sách CV", "履歴書一覧へ", "Ke daftar CV")}</PrimaryButton>}
        />
      </Page>
    );
  }

  const pct = Math.round((preview.filledCount / preview.totalCount) * 100);

  return (
    <Page>
      <Masthead
        eyebrow={
          <span className="inline-flex items-center gap-2">
            {t("내 이력서", "My resume", "我的简历", "CV của tôi", "履歴書", "CV saya")}
            <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${resume.status === "ready" ? "bg-[#e8f8f1] text-[color:var(--v2-good)]" : "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]"}`}>{statusLabel(resume.status)}</span>
          </span>
        }
        title={resume.title}
        lede={resume.targetRole ? t(`${resume.targetRole} 지원용`, `For ${resume.targetRole}`, `${resume.targetRole} 申请用`, `Ứng tuyển ${resume.targetRole}`, `${resume.targetRole} 応募用`, `Untuk ${resume.targetRole}`) : undefined}
        action={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => toast.info(t("PDF 내보내기는 곧 지원돼요", "PDF export is coming soon", "PDF 导出即将支持", "Xuất PDF sắp có", "PDFエクスポートは近日対応", "Ekspor PDF segera hadir"))}>{t("PDF로 저장", "Save as PDF", "保存为 PDF", "Lưu PDF", "PDFで保存", "Simpan PDF")}</Button>
            <Button variant="secondary" onClick={() => toast.success(t("공유 링크를 복사했어요", "Share link copied", "已复制分享链接", "Đã sao chép liên kết", "共有リンクをコピーしました", "Tautan disalin"))}>
              {t("공유 링크", "Share link", "分享链接", "Chia sẻ", "共有リンク", "Bagikan")}
            </Button>
          </div>
        }
      />

      {/* 완성도 체크 — 점수 아닌 단계 + 힌트 */}
      <Section title={t("완성도 체크", "Completeness", "完成度检查", "Độ hoàn thiện", "完成度チェック", "Kelengkapan")} aside={<span className="text-[17px] font-bold text-[color:var(--v2-accent)]">{preview.filledCount}/{preview.totalCount}</span>}>
        <Progress pct={pct} />
        <ul className="mt-4 flex flex-col">
          {preview.coaching.map((c) => (
            <li key={c.key} className="flex items-start gap-3 py-3">
              <span aria-hidden className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${c.done ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-band)] text-transparent"}`}>
                ✓
              </span>
              <div className="min-w-0">
                <p className={`text-[16px] ${c.done ? "text-[color:var(--v2-faint)] line-through" : "font-semibold text-[color:var(--v2-ink)]"}`}>{c.label}</p>
                {!c.done && c.hint ? <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{c.hint}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* 템플릿 + 미리보기 */}
      <Section title={t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}>
        <div className="mb-4 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {templates.map((tpl) => (
            <Chip key={tpl.key} active={tpl.key === templateKey} onClick={() => setTemplateKey(tpl.key)}>
              {tpl.label}
            </Chip>
          ))}
        </div>
        <p className="mb-3 text-[14px] text-[color:var(--v2-faint)]">{template.desc}</p>
        <div className="overflow-hidden rounded-3xl bg-[color:var(--v2-band)] p-3 md:p-5">
          <div className="rounded-2xl bg-white">
            <div className="border-b-2 px-5 py-5" style={{ borderColor: template.accent }}>
              <p className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: template.accent }}>
                {preview.name}
              </p>
              {preview.headline ? <p className="mt-2 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{preview.headline}</p> : null}
            </div>
            <div className="px-5 py-5">
              <p className="text-[13px] font-bold uppercase tracking-wide text-[color:var(--v2-faint)]">{t("경험", "EXPERIENCE", "经历", "KINH NGHIỆM", "経験", "PENGALAMAN")}</p>
              <ul className="mt-3 flex flex-col gap-4">
                {preview.items.map((it) => (
                  <li key={it.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="text-[16px] font-bold text-[color:var(--v2-ink)]">{it.title}</p>
                      {it.period ? <span className="shrink-0 text-[13px] text-[color:var(--v2-faint)]">{it.period}</span> : null}
                    </div>
                    <p className="mt-1.5 flex items-start gap-2 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: template.accent }} />
                      {it.after}
                    </p>
                  </li>
                ))}
                {preview.items.length === 0 ? <p className="text-[14px] text-[color:var(--v2-faint)]">{t("정리한 경험이 여기에 이력서 문장으로 들어가요.", "Organized experiences turn into resume lines here.", "整理好的经历会在这里变成简历句子。", "Kinh nghiệm đã sắp xếp sẽ thành câu CV ở đây.", "整理した経験がここで履歴書の文章になります。", "Pengalaman tersusun jadi kalimat CV di sini.")}</p> : null}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* 경험 → 문장 Before/After (차별점) */}
      {preview.items.length ? (
        <Section title={t("경험을 이력서 문장으로 바꿨어요", "Your experience, as resume lines", "已把经历变成简历句子", "Kinh nghiệm thành câu CV", "経験を履歴書の文章に", "Pengalaman jadi kalimat CV")}>
          <div className="flex flex-col gap-2.5">
            {preview.items.slice(0, 2).map((it) => (
              <div key={it.id} className="rounded-3xl bg-[color:var(--v2-fill)] p-5">
                <p className="text-[13px] font-bold text-[color:var(--v2-faint)]">{t("이렇게 말했다면", "If you said it like this", "如果你这样说", "Nếu bạn nói thế này", "こう言っていたら", "Kalau kamu bilang begini")}</p>
                <p className="mt-1 text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{it.before}</p>
                <p className="mt-4 text-[13px] font-bold text-[color:var(--v2-accent)]">↓ {t("이렇게 정리해 드려요", "We'll polish it like this", "我们会这样整理", "Chúng tôi chỉnh lại thế này", "こう整えます", "Kami rapikan begini")}</p>
                <p className="mt-1 text-[15px] font-medium leading-[1.6] text-[color:var(--v2-ink)]">{it.after}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* 더 해 볼 것 — 공고 맞춤 분석(공고 단위 적합도) · AI 진단(공고와 무관) · 직무별 새 버전. 셋은 서로 다른 기능이다. */}
      <Section title={t("더 다듬기", "Refine more", "继续完善", "Hoàn thiện thêm", "さらに整える", "Perbaiki lagi")}>
        <Row href={`/talent/career/resumes/${encodeURIComponent(resumeId)}/tailor`} lead="🎯" title={t("공고에 얼마나 맞을까요?", "Check your fit for a posting", "看看与职位的匹配度", "Mức phù hợp với tin", "求人との適合度", "Cek kecocokan lowongan")} meta={t("공고를 넣으면 적합도와 보완할 점을 알려 드려요", "Paste a posting for a fit score and fixes", "填入招聘信息，获取匹配分数和改进建议", "Dán tin để nhận điểm và gợi ý", "求人を入れると適合度と改善点を表示", "Tempel lowongan untuk skor & saran")} />
        <Row href="/talent/career/resume/diagnosis" lead="🩺" title={t("내 이력서 진단받기", "Get your resume diagnosed", "诊断我的简历", "Chẩn đoán CV", "履歴書を診断する", "Diagnosis CV")} meta={t("공고 없이도 부족한 부분을 짚어 드려요", "See what's missing — no posting needed", "无需招聘信息也能指出不足", "Không cần tin vẫn chỉ ra điểm thiếu", "求人なしでも不足点をお知らせ", "Tanpa lowongan pun ditunjukkan kekurangannya")} />
        <Row href="/talent/career/resumes" lead="🗂️" title={t("다른 직무로도 만들기", "Make one for another role", "也为其他职位制作", "Tạo cho vị trí khác", "他の職種でも作る", "Buat untuk posisi lain")} meta={t("같은 경험, 다른 강조점", "Same experience, different emphasis", "相同经历，不同侧重", "Cùng kinh nghiệm, nhấn mạnh khác", "同じ経験で別の強調点", "Pengalaman sama, penekanan beda")} />
      </Section>
    </Page>
  );
}

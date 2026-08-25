"use client";

// 이력서 상세 — 완성도 코칭 + 경험→문장 Before/After + 템플릿 선택 + 미리보기 + 내보내기(mock).
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkle, FilePdf, LinkSimple, Lightbulb } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TCard, TChip, TProgressBar, TLoading, TError, TEmpty } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { buildResumePreview, resumeTemplates } from "../../../lib/talent/resume-preview";
import { useResumeStatusLabel } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import type { TalentSnapshot } from "../../../lib/talent/types";
import { usePlatformT } from "../../../lib/i18n";

export function ResumeDetailScreen({ resumeId }: { resumeId: string }) {
  const { snapshot, status, reload } = useTalentSnapshot();
  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? <Content snapshot={snapshot} resumeId={resumeId} /> : null}
    </CareerLayout>
  );
}

function Content({ snapshot, resumeId }: { snapshot: TalentSnapshot; resumeId: string }) {
  const t = usePlatformT();
  const resumeStatusLabel = useResumeStatusLabel();
  const toast = useTalentPopup();
  const resume = snapshot.resumes.find((r) => r.id === resumeId) ?? snapshot.resumes[0];
  const templates = resumeTemplates(t);
  const [templateKey, setTemplateKey] = useState(templates[0].key);
  const preview = useMemo(() => buildResumePreview(snapshot, t, resume?.targetRole), [snapshot, t, resume?.targetRole]);
  const template = templates.find((tpl) => tpl.key === templateKey) ?? templates[0];

  if (!resume) {
    return (
      <TEmpty
        icon="📄"
        title={t("이력서를 찾을 수 없어요","Resume not found","找不到简历","Không tìm thấy CV","履歴書が見つかりません","CV tidak ditemukan")}
        description={t("먼저 경험을 정리하고 첫 이력서를 만들어보세요.","Organize your experiences first, then create your first resume.","请先整理经历，再制作第一份简历。","Hãy sắp xếp kinh nghiệm trước, rồi tạo CV đầu tiên.","まず経験を整理して最初の履歴書を作りましょう。","Susun pengalaman dulu, lalu buat CV pertama.")}
        action={<TalentButton href={talentAppRoutes.resumes} variant="primary" size="md">{t("이력서 목록으로","To resume list","返回简历列表","Về danh sách CV","履歴書一覧へ","Ke daftar CV")}</TalentButton>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{resume.title}</h1>
          <TChip tone={resume.status === "ready" ? "lime" : "blue"}>{resumeStatusLabel(resume.status)}</TChip>
        </div>
        {resume.targetRole ? <p className="mt-1 text-[14px] text-[#4E5968]">{t(`${resume.targetRole} 지원용`, `For ${resume.targetRole}`, `${resume.targetRole} 申请用`, `Ứng tuyển ${resume.targetRole}`, `${resume.targetRole} 応募用`, `Untuk ${resume.targetRole}`)}</p> : null}
      </div>

      {/* 완성도 코칭 — 점수 아닌 단계 + 힌트 */}
      <TCard className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#191F28]">{t("완성도 체크","Completeness check","完成度检查","Kiểm tra độ hoàn thiện","完成度チェック","Cek kelengkapan")}</h2>
          <span className="text-[13px] font-bold text-[#0B46E8]">{preview.filledCount}/{preview.totalCount}</span>
        </div>
        <TProgressBar value={(preview.filledCount / preview.totalCount) * 100} />
        <ul className="mt-4 flex flex-col gap-3">
          {preview.coaching.map((c) => (
            <li key={c.key} className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-2xl ${c.done ? "bg-[#B7FF5A]" : "border-2 border-[#E5E8EB] bg-white"}`}>
                {c.done ? <Check className="h-3 w-3 text-[#1F3D00]" weight="bold" /> : null}
              </span>
              <div>
                <p className={`text-[14px] ${c.done ? "text-[#8B95A1] line-through" : "font-semibold text-[#191F28]"}`}>{c.label}</p>
                {!c.done && c.hint ? (
                  <p className="mt-1 flex items-start gap-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B46E8]" weight="fill" />
                    {c.hint}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </TCard>

      {/* 템플릿 선택 */}
      <div>
        <p className="mb-2.5 text-[13px] font-bold text-[#8B95A1]">{t("템플릿","Template","模板","Mẫu","テンプレート","Templat")}</p>
        <div className="flex gap-2">
          {templates.map((tpl) => {
            const on = tpl.key === templateKey;
            return (
              <button
                key={tpl.key}
                type="button"
                onClick={() => setTemplateKey(tpl.key)}
                aria-pressed={on}
                className={`flex-1 rounded-2xl border p-3 text-left transition ${on ? "border-[#0B46E8] bg-[#F5F8FF]" : "border-[#EEF1F5] bg-white hover:border-[#D7DCE3]"}`}
              >
                <span className="block h-1.5 w-6 rounded-full" style={{ backgroundColor: tpl.accent }} />
                <p className="mt-2 text-[13.5px] font-bold text-[#191F28]">{tpl.label}</p>
                <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{tpl.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 미리보기 */}
      <TCard className="overflow-hidden">
        <div className="border-b-2 px-6 py-5" style={{ borderColor: template.accent }}>
          <p className="text-[20px] font-black tracking-[-0.02em]" style={{ color: template.accent }}>{preview.name}</p>
          {preview.headline ? <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{preview.headline}</p> : null}
        </div>
        <div className="px-6 py-5">
          <p className="text-[12.5px] font-bold uppercase tracking-wide text-[#8B95A1]">{t("경험","EXPERIENCE","经历","KINH NGHIỆM","経験","PENGALAMAN")}</p>
          <ul className="mt-3 flex flex-col gap-4">
            {preview.items.map((it) => (
              <li key={it.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[14.5px] font-bold text-[#191F28]">{it.title}</p>
                  {it.period ? <span className="shrink-0 text-[12px] text-[#8B95A1]">{it.period}</span> : null}
                </div>
                <p className="mt-1.5 flex items-start gap-1.5 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: template.accent }} />
                  {it.after}
                </p>
              </li>
            ))}
            {preview.items.length === 0 ? <p className="text-[13px] text-[#B0B8C1]">{t("정리한 경험이 여기에 이력서 문장으로 들어가요.","Organized experiences turn into resume lines here.","整理好的经历会在这里变成简历句子。","Kinh nghiệm đã sắp xếp sẽ thành câu CV ở đây.","整理した経験がここで履歴書の文章になります。","Pengalaman tersusun jadi kalimat CV di sini.")}</p> : null}
          </ul>
        </div>
      </TCard>

      {/* 경험 → 문장 Before/After (차별점) */}
      {preview.items.length ? (
        <TCard className="border-[#DCE7FB] bg-[#F5F8FF] p-6">
          <div className="flex items-center gap-1.5">
            <Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" />
            <h2 className="text-[15px] font-bold text-[#0B1227]">{t("경험을 이력서 문장으로 바꿨어요","Turned your experience into resume lines","已把经历变成简历句子","Đã biến kinh nghiệm thành câu CV","経験を履歴書の文章にしました","Pengalamanmu jadi kalimat CV")}</h2>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {preview.items.slice(0, 2).map((it) => (
              <div key={it.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <p className="text-[12px] font-bold text-[#8B95A1]">{t("이렇게 말했다면","If you said it like this","如果你这样说","Nếu bạn nói thế này","こう言っていたら","Kalau kamu bilang begini")}</p>
                <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{it.before}</p>
                <div className="my-2.5 flex items-center gap-1.5 text-[#0B46E8]">
                  <ArrowRight className="h-3.5 w-3.5" weight="bold" />
                  <span className="text-[11.5px] font-bold">{t("이렇게 정리해드려요","We'll polish it like this","我们会这样整理","Chúng tôi chỉnh lại thế này","こう整えます","Kami rapikan begini")}</span>
                </div>
                <p className="break-keep text-[13.5px] font-medium leading-relaxed text-[#191F28]">{it.after}</p>
              </div>
            ))}
          </div>
        </TCard>
      ) : null}

      {/* 내보내기 (mock) */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <TalentButton onClick={() => toast.info(t("PDF 내보내기는 곧 지원돼요","PDF export is coming soon","PDF 导出即将支持","Xuất PDF sắp có","PDFエクスポートは近日対応","Ekspor PDF segera hadir"))} variant="primary" size="lg" aria-label={t("PDF로 저장","Save as PDF","保存为 PDF","Lưu PDF","PDFで保存","Simpan PDF")}>
          <FilePdf className="h-4 w-4" /> {t("PDF로 저장","Save as PDF","保存为 PDF","Lưu PDF","PDFで保存","Simpan PDF")}
        </TalentButton>
        <TalentButton onClick={() => toast.success(t("공유 링크를 복사했어요","Share link copied","已复制分享链接","Đã sao chép liên kết chia sẻ","共有リンクをコピーしました","Tautan berbagi disalin"))} variant="secondary" size="lg" aria-label={t("공유 링크 만들기","Create share link","创建分享链接","Tạo liên kết chia sẻ","共有リンクを作成","Buat tautan berbagi")}>
          <LinkSimple className="h-4 w-4" /> {t("공유 링크 만들기","Create share link","创建分享链接","Tạo liên kết chia sẻ","共有リンクを作成","Buat tautan berbagi")}
        </TalentButton>
      </div>

      {/* 직무별 버전 */}
      <TCard className="flex items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-[#191F28]">{t("다른 직무로도 만들 수 있어요","Make one for other roles too","也可以为其他职位制作","Có thể tạo cho vị trí khác","他の職種でも作れます","Bisa untuk posisi lain juga")}</p>
          <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("같은 경험으로 지원 직무에 맞춰 강조점이 다른 이력서를 만들어요.","Use the same experience to make a resume with different emphasis per role.","用相同经历，按申请职位制作强调点不同的简历。","Dùng cùng kinh nghiệm để tạo CV nhấn mạnh khác theo vị trí.","同じ経験で応募職種に合わせて強調点が異なる履歴書を作ります。","Pakai pengalaman sama untuk CV dengan penekanan berbeda per posisi.")}</p>
        </div>
        <Link href={talentAppRoutes.resumes} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-2 text-[13px] font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">
          {t("새 버전","New version","新版本","Bản mới","新バージョン","Versi baru")}
        </Link>
      </TCard>
    </div>
  );
}

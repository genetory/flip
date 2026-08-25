"use client";

// 이력서 — 자동 초안(기본 정보 + 커리어 피드) → 직접 편집 + AI로 다듬기 + 대화로 추가.
// 편집 옆에 미리보기 상시 노출(데스크톱), 모바일은 '미리보기' 버튼으로 따로 보기.
// 1개 문서. 초안 생성/다듬기는 mock(규칙 기반), 추후 실제 LLM으로 교체.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, PaperPlaneTilt, Trash, Eye, ArrowSquareOut, CaretDown, Plus, LinkSimple } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { ProfileGate } from "../career/ProfileGate";
import { ProfileCard } from "../career/ProfileCard";
import { ResumePhotoRow } from "../career/ResumePhotoRow";
import { ResumeA4Preview } from "../career/ResumeA4";
import { TLoading } from "../ui/primitives";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";
import { useCareerFeed, ensureFeedEntry } from "../../../lib/talent/career-feed";
import { classifyCareerNote, SECTION_META, type CareerSection } from "../../../lib/talent/career-chat";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import { careerAssist } from "../../../lib/talent/career-assist-client";
import { useResumeDoc, useRenewalDocsStatus, saveResumeDoc, generateResumeDoc, addResumeItem, refineText, SECTION_HAS_DATE, type ResumeDoc, type ResumeLink } from "../../../lib/talent/resume-doc";
import { polishExperienceText, getAiUsage, AiQuotaError, type PolishStyle, type AiUsage } from "../../../lib/resume-maker-client";
import { AiTicketStatusModal } from "../../resume-maker/AiTicketStatusModal";
import { usePlatformT } from "../../../lib/i18n";

// 섹션 칩 · 편집 리스트 순서 — 학력은 맨 오른쪽/맨 아래.
// 이력서 순서 — 경험·프로젝트·자격증·스킬·대외활동·수상, 학력은 맨 아래.
const CHIP_ORDER: CareerSection[] = ["experience", "project", "certificate", "skill", "activity", "award", "education"];

export function ResumeBuilderScreen() {
  const t = usePlatformT();
  const basicInfo = useBasicInfo();
  const feed = useCareerFeed();
  const stored = useResumeDoc();
  const status = useRenewalDocsStatus();
  const [doc, setDoc] = useState<ResumeDoc | null>(stored);
  const ready = isBasicInfoComplete(basicInfo);

  // 문서가 없으면 바로 시작 — (커리어 노트로) 초안을 자동 생성하고 편집 화면으로.
  // 단, 서버 로드가 끝나기 전에는 "문서 없음"으로 단정하지 않는다(조기 생성 방지).
  useEffect(() => {
    if (!ready || doc) return;
    if (status !== "loaded") return;
    if (stored) {
      setDoc(stored);
      return;
    }
    const d = generateResumeDoc(feed, "");
    saveResumeDoc(d);
    setDoc(d);
  }, [ready, stored, doc, feed, status]);

  function update(next: ResumeDoc) {
    setDoc(next);
    saveResumeDoc(next);
  }

  const showEditor = ready && doc;

  return (
    <TalentAppShell wide>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("이력서","Resume","简历","CV","履歴書","CV")}</h1>
            {showEditor ? (
              <Link
                href={talentAppRoutes.resumePreview}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 lg:hidden"
              >
                <Eye className="h-4 w-4" /> {t("미리보기","Preview","预览","Xem trước","プレビュー","Pratinjau")}
              </Link>
            ) : null}
          </div>
        </div>

        {!ready ? <ProfileGate /> : doc ? <Editor doc={doc} basicInfo={basicInfo} onChange={update} /> : <TLoading />}
      </div>
    </TalentAppShell>
  );
}

/* 편집기 + (데스크톱) 미리보기 2단 */
function Editor({ doc, basicInfo, onChange }: { doc: ResumeDoc; basicInfo: BasicInfo; onChange: (d: ResumeDoc) => void }) {
  const t = usePlatformT();
  // 포인트 부족(402) 시 충전 모달.
  const [chargeOpen, setChargeOpen] = useState(false);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  function setText(id: string, text: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  }
  function setDate(id: string, field: "startDate" | "endDate", value: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) });
  }
  // AI로 다듬기 — 선택한 스타일로 실제 AI 다듬기(polish-experience, 1P 소모).
  // 포인트 부족(402)이면 충전 모달을 연다. 실패 시 원문 유지.
  async function refine(id: string, text: string, section: CareerSection, style: PolishStyle): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const polished = await polishExperienceText({ text: trimmed, style, type: section });
      if (polished) onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text: polished } : it)) });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
    } catch (err) {
      if (err instanceof AiQuotaError) {
        try { setUsage(await getAiUsage()); } catch { /* ignore */ }
        setChargeOpen(true);
      } else {
        console.error("[resume/polish] failed", err);
      }
    }
  }
  function remove(id: string) {
    onChange({ ...doc, items: doc.items.filter((it) => it.id !== id) });
  }
  // 사후 수정 — 잘못 분류된(예: 피드 자동 삽입) 항목의 섹션을 바꾼다.
  function setSection(id: string, section: CareerSection) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, section } : it)) });
  }
  // 경력 — 소속(회사/기관).
  function setCompany(id: string, company: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, company } : it)) });
  }
  function add(text: string, section?: CareerSection, refined?: string, startDate?: string, endDate?: string, company?: string): string {
    const trimmed = text.trim();
    if (!trimmed) return "";
    const sec = section ?? classifyCareerNote(trimmed);
    const { doc: next, id } = addResumeItem(doc, sec, refined ?? refineText(trimmed), startDate ?? "", endDate ?? "", company ?? "");
    onChange(next);
    return id;
  }
  // AI 없이 해당 섹션에 빈 항목을 바로 추가(직접 작성용).
  function addBlank(section: CareerSection) {
    const { doc: next } = addResumeItem(doc, section, "", "", "");
    onChange(next);
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
      {/* 편집 */}
      <div className="flex flex-col gap-5">
        {/* 상단 기본정보 카드에는 사진 미표시 — 사진은 문서(미리보기)에만. */}
        <ProfileCard info={basicInfo} showPhoto={false} />

        <ResumePhotoRow label={t("이력서 사진","Resume photo","简历照片","Ảnh CV","履歴書写真","Foto CV")} on={doc.showPhoto === true} onChange={(v) => onChange({ ...doc, showPhoto: v })} />

        <ChatPanel onAdd={add} />

        <LinksCard links={doc.links ?? []} onChange={(links) => onChange({ ...doc, links })} />

        {CHIP_ORDER.map((section) => {
          const items = doc.items.filter((it) => it.section === section);
          const meta = SECTION_META[section];
          return (
            <CollapsibleSection
              key={section}
              emoji={meta.emoji}
              label={sectionLabelOf(t, section)}
              count={items.length}
              defaultOpen={items.length > 0}
              addLabel={t("직접 추가","Add","直接添加","Thêm","直接追加","Tambah")}
              onAdd={() => addBlank(section)}
            >
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#E5E8EB] bg-[#FAFBFC] px-4 py-5 text-center text-[13px] text-[#B0B8C1]">{t("‘직접 추가’로 항목을 직접 작성하거나, 위 AI 대화로 추가하세요.","Use ‘Add’ to write an item, or add via the AI chat above.","用“直接添加”手动填写，或通过上方 AI 对话添加。","Dùng ‘Thêm’ để tự viết, hoặc thêm qua AI phía trên.","「直接追加」で自分で書くか、上のAI対話で追加してください。","Gunakan ‘Tambah’ untuk menulis, atau via chat AI di atas.")}</p>
              ) : null}
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  text={it.text}
                  section={section}
                  company={it.company ?? ""}
                  startDate={it.startDate ?? ""}
                  endDate={it.endDate ?? ""}
                  showDate={SECTION_HAS_DATE[section]}
                  onChange={(v) => setText(it.id, v)}
                  onCompanyChange={(v) => setCompany(it.id, v)}
                  onSectionChange={(s) => setSection(it.id, s)}
                  onStartChange={(v) => setDate(it.id, "startDate", v)}
                  onEndChange={(v) => setDate(it.id, "endDate", v)}
                  onRefine={(style) => refine(it.id, it.text, section, style)}
                  onRemove={() => remove(it.id)}
                />
              ))}
            </CollapsibleSection>
          );
        })}
      </div>

      {/* 데스크톱 미리보기(상시, A4) */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <div className="mb-2 flex items-center justify-end">
          <Link href={talentAppRoutes.resumePreview} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0B46E8] hover:underline">
            {t("전체 보기","View full","查看全部","Xem đầy đủ","全体を見る","Lihat penuh")} <ArrowSquareOut className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ResumeA4Preview doc={doc} info={basicInfo} />
      </aside>

      {chargeOpen && usage ? (
        <AiTicketStatusModal remaining={usage.remaining} resetAt={usage.resetAt || null} dailyGrant={usage.dailyGrant} onClose={() => setChargeOpen(false)} />
      ) : null}
    </div>
  );
}


// 접을 수 있는 섹션 — 길어지면 헤더를 눌러 닫아둔다. 헤더에 '직접 추가' 버튼(상시 노출).
function CollapsibleSection({ emoji, label, count, children, defaultOpen = true, onAdd, addLabel }: { emoji: string; label: string; count: number; children: React.ReactNode; defaultOpen?: boolean; onAdd?: () => void; addLabel?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="flex flex-col gap-2.5 border-t border-[#EEF1F5] pt-5">
      <div className="flex w-full items-center gap-1.5">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={label} className="flex flex-1 items-center gap-1.5 text-left">
          <span aria-hidden>{emoji}</span>
          <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{label}</h2>
          <span className="text-[13px] font-bold text-[#B0B8C1]">{count}</span>
        </button>
        {onAdd ? (
          <button
            type="button"
            onClick={() => { onAdd(); setOpen(true); }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" /> {addLabel}
          </button>
        ) : null}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={label} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#C4CAD2] transition hover:bg-[#F2F4F6]">
          <CaretDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
        </button>
      </div>
      {open ? <div className="flex flex-col gap-2.5">{children}</div> : null}
    </section>
  );
}

function ItemRow({
  text,
  section,
  company,
  startDate,
  endDate,
  showDate,
  onChange,
  onCompanyChange,
  onSectionChange,
  onStartChange,
  onEndChange,
  onRefine,
  onRemove
}: {
  text: string;
  section: CareerSection;
  company: string;
  startDate: string;
  endDate: string;
  showDate: boolean;
  onChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
  onSectionChange: (s: CareerSection) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onRefine: (style: PolishStyle) => Promise<void> | void;
  onRemove: () => void;
}) {
  const t = usePlatformT();
  const [refining, setRefining] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // AI 다듬기 스타일 3종 — 각 1P 소모. concise=간결 · expand=구체 · professional=정중.
  const polishChoices: { style: PolishStyle; label: string; hint: string }[] = [
    { style: "concise", label: t("간결하게","Concise","简洁","Ngắn gọn","簡潔に","Ringkas"), hint: t("핵심만 짧게","Keep only the essentials","只留核心","Chỉ giữ ý chính","要点だけ短く","Inti saja") },
    { style: "expand", label: t("구체적으로","Detailed","具体","Chi tiết","具体的に","Rinci"), hint: t("맥락·역할을 풍부하게","Add context & detail","补充背景与角色","Thêm bối cảnh, vai trò","文脈・役割を補足","Tambah konteks & peran") },
    { style: "professional", label: t("정중하게","Professional","正式","Trang trọng","丁寧に","Formal"), hint: t("격식 있는 전문가 톤","Formal, professional tone","专业正式语气","Giọng chuyên nghiệp","丁寧な文体","Nada profesional") }
  ];
  const isExperience = section === "experience";
  // 모든 섹션에 '타이틀/이름' 입력란(학력=학교명, 프로젝트=프로젝트명, 스킬=스킬명 등). 경험처럼 편집 가능.
  const namePlaceholder =
    section === "education" ? t("학교명","School","学校名称","Tên trường","学校名","Nama sekolah")
    : section === "project" ? t("프로젝트명","Project name","项目名称","Tên dự án","プロジェクト名","Nama proyek")
    : section === "certificate" ? t("자격증·발급기관","Certificate / issuer","证书·发证机构","Chứng chỉ / nơi cấp","資格・発行機関","Sertifikat / penerbit")
    : section === "activity" ? t("활동·단체명","Activity / org","活动·团体","Hoạt động / tổ chức","活動・団体名","Aktivitas / organisasi")
    : section === "award" ? t("수상명·기관","Award / issuer","奖项·机构","Giải thưởng / nơi cấp","受賞名・機関","Penghargaan / penerbit")
    : section === "skill" ? t("역량·스킬명","Skill","技能名称","Tên kỹ năng","スキル名","Nama keahlian")
    : t("소속 (회사·기관)","Organization (company)","所属（公司·机构）","Nơi công tác (công ty)","所属（会社・機関）","Instansi (perusahaan)");
  const textPlaceholder =
    section === "education" ? t("전공·학위·학점 (선택)","Major / degree / GPA (optional)","专业·学位·GPA（选填）","Chuyên ngành / bằng cấp (tùy chọn)","専攻・学位・成績（任意）","Jurusan / gelar (opsional)")
    : section === "project" ? t("프로젝트 내용·맡은 역할·성과 (선택)","What the project was, your role & results (optional)","项目内容·担任角色·成果（选填）","Nội dung dự án, vai trò & kết quả (tùy chọn)","プロジェクト内容・役割・成果（任意）","Isi proyek, peran & hasil (opsional)")
    : section === "certificate" ? t("점수·급수·취득 시기 등 (선택)","Score / level / date obtained (optional)","分数·等级·取得时间（选填）","Điểm / cấp độ / thời điểm (tùy chọn)","点数・級・取得時期（任意）","Skor / tingkat / tanggal (opsional)")
    : section === "activity" ? t("활동 내용·맡은 역할·성과 (선택)","What you did, your role & results (optional)","活动内容·担任角色·成果（选填）","Nội dung hoạt động, vai trò & kết quả (tùy chọn)","活動内容・役割・成果（任意）","Isi kegiatan, peran & hasil (opsional)")
    : section === "award" ? t("수상 내용·규모·순위 (선택)","What the award was, scale & rank (optional)","获奖内容·规模·名次（选填）","Nội dung giải, quy mô & thứ hạng (tùy chọn)","受賞内容・規模・順位（任意）","Isi penghargaan, skala & peringkat (opsional)")
    : section === "skill" ? t("숙련도·활용 경험 (선택)","Proficiency & how you've used it (optional)","熟练度·使用经验（选填）","Mức thành thạo & kinh nghiệm dùng (tùy chọn)","習熟度・活用経験（任意）","Tingkat & pengalaman pakai (opsional)")
    : isExperience ? t("한 일·성과 (선택)","What you did / achievements (optional)","工作内容·成果（选填）","Việc đã làm / thành tích (tùy chọn)","業務・成果（任意）","Yang dikerjakan / hasil (opsional)")
    : t("내용·성과 (선택)","Details / achievements (optional)","内容·成果（选填）","Nội dung / thành tích (tùy chọn)","内容・成果（任意）","Detail / hasil (opsional)");
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <input
        value={company}
        onChange={(e) => onCompanyChange(e.target.value)}
        placeholder={namePlaceholder}
        className="mb-2.5 w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] font-bold text-[#191F28] outline-none placeholder:font-normal placeholder:text-[#B0B8C1]"
      />
      {showDate ? (
        <div className="mb-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="month"
              aria-label={t("시작 날짜","Start date","开始日期","Ngày bắt đầu","開始日","Tanggal mulai")}
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[13px] text-[#4E5968] outline-none [color-scheme:light]"
            />
            <span className="shrink-0 text-[13px] text-[#B0B8C1]">–</span>
            <input
              type="month"
              aria-label={t("종료 날짜","End date","结束日期","Ngày kết thúc","終了日","Tanggal selesai")}
              value={endDate === "현재" ? "" : endDate}
              disabled={endDate === "현재"}
              onChange={(e) => onEndChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[13px] text-[#4E5968] outline-none disabled:opacity-50 [color-scheme:light]"
            />
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-[#4E5968]">
            <input
              type="checkbox"
              checked={endDate === "현재"}
              onChange={(e) => onEndChange(e.target.checked ? "현재" : "")}
              className="h-3.5 w-3.5 accent-[#0B46E8]"
            />
            {t("현재 (진행 중)","Present (ongoing)","至今（进行中）","Hiện tại (đang làm)","現在（進行中）","Sekarang (berjalan)")}
          </label>
        </div>
      ) : null}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={textPlaceholder}
        className="min-h-[116px] w-full resize-y break-keep rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
      />
      <div className="mt-2 flex items-center justify-between gap-1.5">
        {/* 사후 수정 — 섹션 이동(자동 분류 교정). 드롭다운 화살표는 phosphor CaretDown */}
        <div className="relative max-w-[45%]">
          <select
            aria-label={t("섹션 변경","Change section","更改分类","Đổi mục","セクション変更","Ubah bagian")}
            value={section}
            onChange={(e) => onSectionChange(e.target.value as CareerSection)}
            className="w-full appearance-none rounded-lg bg-[#F5F6F8] py-1.5 pl-2.5 pr-7 text-[12px] font-semibold text-[#4E5968] outline-none [color-scheme:light]"
          >
            {CHIP_ORDER.map((s) => (
              <option key={s} value={s}>{sectionLabelOf(t, s)}</option>
            ))}
          </select>
          <CaretDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => { if (!refining && text.trim()) setMenuOpen((v) => !v); }}
              disabled={refining || !text.trim()}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="inline-flex items-center gap-1 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC] disabled:opacity-40"
            >
              <Sparkle className="h-3.5 w-3.5" weight="fill" /> {refining ? t("다듬는 중…","Polishing…","润色中…","Đang chỉnh…","整えています…","Memoles…") : t("AI로 다듬기","Polish with AI","用 AI 润色","Chỉnh bằng AI","AIで整える","Poles dengan AI")}
              {!refining ? <CaretDown className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} weight="bold" /> : null}
            </button>
            {menuOpen ? (
              <>
                {/* 바깥 클릭 닫기 */}
                <button type="button" aria-hidden tabIndex={-1} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-10 cursor-default" />
                <div role="menu" className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-[#E5E8EB] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
                  {polishChoices.map((c) => (
                    <button
                      key={c.style}
                      type="button"
                      role="menuitem"
                      onClick={async () => { setMenuOpen(false); setRefining(true); try { await onRefine(c.style); } finally { setRefining(false); } }}
                      className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition hover:bg-[#F6F8FB]"
                    >
                      <span className="flex flex-col">
                        <span className="text-[13px] font-bold text-[#0B1227]">{c.label}</span>
                        <span className="text-[11px] text-[#8B95A1]">{c.hint}</span>
                      </span>
                      <span className="mt-0.5 shrink-0 rounded-md bg-[#EDF1FD] px-1.5 py-0.5 text-[10px] font-bold text-[#0B46E8]">1P</span>
                    </button>
                  ))}
                  <p className="border-t border-[#F2F4F6] px-3 pb-1 pt-1.5 text-[10.5px] text-[#B0B8C1]">{t("다듬기당 AI 1P 소모","1 AI point per polish","每次润色消耗 1P","1P AI mỗi lần","1回につきAI 1P","1P AI per poles")}</p>
                </div>
              </>
            ) : null}
          </div>
          <button type="button" onClick={onRemove} aria-label={t("삭제","Delete","删除","Xóa","削除","Hapus")} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* AI 대화 패널 — 적으면 알맞은 섹션에 반영하고 대화로 알려준다 */
interface ChatMsg {
  id: number;
  role: "user" | "ai";
  text: string;
}

type SectionChoice = CareerSection;

// 링크·포트폴리오 — 제목·링크를 입력하고 '추가'로 목록에 넣는 방식.
function LinksCard({ links, onChange }: { links: ResumeLink[]; onChange: (links: ResumeLink[]) => void }) {
  const t = usePlatformT();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const addLink = () => {
    const u = url.trim();
    if (!u) return;
    onChange([...links, { label: label.trim(), url: u }]);
    setLabel("");
    setUrl("");
  };
  const remove = (i: number) => onChange(links.filter((_, idx) => idx !== i));
  const inputCls = "rounded-lg bg-[#F5F6F8] px-3 py-2 text-[13.5px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:bg-white focus:ring-1 focus:ring-[#0B46E8]";
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <LinkSimple className="h-[16px] w-[16px] text-[#0B46E8]" weight="bold" />
        <p className="text-[13.5px] font-bold text-[#191F28]">{t("링크·포트폴리오", "Links & portfolio", "链接·作品集", "Liên kết & portfolio", "リンク・ポートフォリオ", "Tautan & portofolio")}</p>
        <span className="text-[12px] text-[#8B95A1]">{t("— 포트폴리오·GitHub 등 첨부", "— attach portfolio, GitHub, etc.", "— 附上作品集、GitHub 等", "— đính kèm portfolio, GitHub…", "— ポートフォリオ・GitHub等を添付", "— lampirkan portfolio, GitHub, dll")}</span>
      </div>

      {/* 추가된 링크 목록 */}
      {links.length ? (
        <div className="mb-2.5 flex flex-col gap-1.5">
          {links.map((l, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-[#F5F6F8] px-3 py-2">
              {l.label ? <span className="shrink-0 text-[13px] font-bold text-[#191F28]">{l.label}</span> : null}
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-[#4E5968]">{l.url}</span>
              <button type="button" onClick={() => remove(i)} aria-label={t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")} className="shrink-0 rounded-lg p-1 text-[#B0B8C1] transition hover:bg-white hover:text-[#F04452]">
                <Trash className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {/* 입력 폼 — 제목 + 링크 + 추가 */}
      <div className="flex items-center gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("제목 (예: 포트폴리오)", "Title (e.g. Portfolio)", "标题（例：作品集）", "Tiêu đề (VD: Portfolio)", "タイトル（例：ポートフォリオ）", "Judul (cth: Portofolio)")} className={`${inputCls} w-[108px] shrink-0 font-semibold`} />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addLink();
            }
          }}
          placeholder="https://..."
          inputMode="url"
          className={`${inputCls} min-w-0 flex-1`}
        />
        <button type="button" onClick={addLink} disabled={!url.trim()} className="shrink-0 rounded-lg bg-[#0B46E8] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
          {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
        </button>
      </div>
    </div>
  );
}

function ChatPanel({ onAdd }: { onAdd: (text: string, section?: CareerSection, refined?: string, startDate?: string, endDate?: string, company?: string) => string }) {
  const t = usePlatformT();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [value, setValue] = useState("");
  const [choice, setChoice] = useState<SectionChoice>(CHIP_ORDER[0]);
  const [pending, setPending] = useState(false);
  const seq = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function send() {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    setValue("");
    setMessages((m) => [...m, { id: ++seq.current, role: "user", text: trimmed }]);
    setPending(true);

    const res = await careerAssist(trimmed, choice);

    if (!res.relevant) {
      setMessages((m) => [...m, { id: ++seq.current, role: "ai", text: res.followUp || t("이력서에 담을 커리어 내용을 적어주세요.","Write the career details you want to add to your resume.","请写下要放入简历的职业内容。","Hãy ghi nội dung sự nghiệp bạn muốn đưa vào CV.","履歴書に載せるキャリア内容を書いてください。","Tulis detail karier yang ingin dimasukkan ke CV.") }]);
      setPending(false);
      return;
    }

    const meta = SECTION_META[res.section];
    const secLabel = sectionLabelOf(t, res.section);
    const id = onAdd(trimmed, res.section, res.refined, res.startDate, res.endDate, res.title);
    // 커리어 기록(피드)에도 요약 리스팅.
    ensureFeedEntry(`resume:${id}`, res.refined, res.section, { label: `${t("이력서","Resume","简历","CV","履歴書","CV")} · ${secLabel}`, href: talentAppRoutes.resume });
    setMessages((m) => [
      ...m,
      { id: ++seq.current, role: "ai", text: `${meta.emoji} ${t(`${secLabel}에 정리했어요.`, `Organized under ${secLabel}.`, `已整理到「${secLabel}」。`, `Đã sắp xếp vào ${secLabel}.`, `${secLabel}に整理しました。`, `Disusun di ${secLabel}.`)} ${res.followUp}`.trim() }
    ]);
    setPending(false);
  }

  // 선택한 카테고리(choice)에 맞는 입력 예시 — 칩을 바꾸면 placeholder도 바뀐다.
  const chipPlaceholder =
    choice === "experience" ? t("예) OO에서 2년간 마케팅 담당 · SNS 콘텐츠 기획·운영","e.g. 2 yrs in marketing at OO · planned & ran social content","例）在OO负责营销2年·策划运营社媒内容","VD) 2 năm marketing tại OO · lên kế hoạch nội dung MXH","例）OOでマーケ2年・SNSコンテンツ企画運営","Cth) 2 thn marketing di OO · kelola konten sosial")
    : choice === "project" ? t("예) 팀 프로젝트로 앱을 기획·개발하고 발표 담당","e.g. Planned & built an app in a team project, led the demo","例）团队项目中策划开发App并负责展示","VD) Dự án nhóm: lên ý tưởng, làm app & thuyết trình","例）チームでアプリを企画・開発し発表担当","Cth) Proyek tim: rancang & bangun app, presentasi")
    : choice === "certificate" ? t("예) 토익 900 · 컴퓨터활용능력 1급 (2024)","e.g. TOEIC 900 · Computer Proficiency Level 1 (2024)","例）托业900·计算机能力1级（2024）","VD) TOEIC 900 · Chứng chỉ tin học loại 1 (2024)","例）TOEIC900・PC活用能力1級（2024）","Cth) TOEIC 900 · Sertifikat komputer L1 (2024)")
    : choice === "skill" ? t("예) Python · Excel · 데이터 분석","e.g. Python · Excel · data analysis","例）Python · Excel · 数据分析","VD) Python · Excel · phân tích dữ liệu","例）Python・Excel・データ分析","Cth) Python · Excel · analisis data")
    : choice === "activity" ? t("예) 동아리 회장으로 30명 규모 행사 기획·운영","e.g. As club president, planned & ran an event for 30","例）担任社团会长，策划运营30人活动","VD) Chủ nhiệm CLB, tổ chức sự kiện 30 người","例）サークル会長として30名規模の行事を企画運営","Cth) Ketua klub, kelola acara 30 orang")
    : choice === "award" ? t("예) 교내 공모전 대상 · 100팀 중 1위","e.g. Grand prize in a campus contest · 1st of 100 teams","例）校内竞赛大奖·100队中第1","VD) Giải nhất cuộc thi trường · 1/100 đội","例）学内コンテスト大賞・100チーム中1位","Cth) Juara 1 lomba kampus · 1 dari 100 tim")
    : choice === "education" ? t("예) OO대학교 컴퓨터공학 · 학점 3.8/4.5","e.g. OO University, Computer Science · GPA 3.8/4.5","例）OO大学计算机·GPA 3.8/4.5","VD) ĐH OO, KH máy tính · GPA 3.8/4.5","例）OO大学 情報工学・GPA3.8/4.5","Cth) Univ OO, Ilmu Komputer · IPK 3.8/4.5")
    : t("예) 데이터 분석 프로젝트 완료 · 토익 900 취득","e.g. Completed a data analysis project · Scored 900 on TOEIC","例）完成数据分析项目 · 托业 900 分","VD) Hoàn thành dự án phân tích dữ liệu · TOEIC 900","例）データ分析プロジェクト完了・TOEIC900取得","Cth) Selesaikan proyek analisis data · TOEIC 900");

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white">
      <div className="flex items-center gap-1.5 px-4 pt-3">
        <Sparkle className="h-[16px] w-[16px] text-[#0B46E8]" weight="fill" />
        <p className="text-[13.5px] font-bold text-[#191F28]">{t("AI로 편집","Edit with AI","用 AI 编辑","Sửa bằng AI","AIで編集","Edit dengan AI")}</p>
        <span className="text-[12px] text-[#8B95A1]">{t("— 적으면 항목으로 정리돼요","— write and it's organized into items","— 输入后会整理成条目","— viết vào sẽ được sắp thành mục","— 書けば項目に整理されます","— tulis, otomatis jadi item")}</span>
      </div>

      {messages.length || pending ? (
        <div ref={listRef} className="flex max-h-56 flex-col gap-2.5 overflow-y-auto px-4 py-3">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] break-keep rounded-2xl rounded-tr-md bg-[#0B46E8] px-3.5 py-2 text-[13.5px] leading-relaxed text-white">{m.text}</p>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <p className="max-w-[85%] break-keep rounded-2xl rounded-tl-md border border-[#EEF1F5] bg-[#F5F8FF] px-3.5 py-2 text-[13.5px] leading-relaxed text-[#191F28]">{m.text}</p>
              </div>
            )
          )}
          {pending ? (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-tl-md border border-[#EEF1F5] bg-[#F5F8FF] px-3.5 py-2 text-[13.5px] text-[#8B95A1]">{t("AI가 정리 중…","AI is organizing…","AI 正在整理…","AI đang sắp xếp…","AIが整理中…","AI sedang menyusun…")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 섹션 선택 */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-3">
        {CHIP_ORDER.map((s) => (
          <SectionChip key={s} label={`${SECTION_META[s].emoji} ${sectionLabelOf(t, s)}`} active={choice === s} onClick={() => setChoice(s)} />
        ))}
      </div>

      <div className="p-3">
        <div className="flex items-end gap-2 rounded-xl bg-[#F5F6F8] p-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder={chipPlaceholder}
            className="min-h-[112px] flex-1 resize-y bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
          />
          <button
            type="button"
            onClick={send}
            disabled={!value.trim() || pending}
            aria-label={t("보내기","Send","发送","Gửi","送信","Kirim")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition enabled:hover:bg-[#0A3ECB] disabled:opacity-40"
          >
            <PaperPlaneTilt className="h-[18px] w-[18px]" weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
        active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
      }`}
    >
      {label}
    </button>
  );
}


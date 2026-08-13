"use client";

// 이력서 — 자동 초안(기본 정보 + 커리어 피드) → 직접 편집 + AI로 다듬기 + 대화로 추가.
// 편집 옆에 미리보기 상시 노출(데스크톱), 모바일은 '미리보기' 버튼으로 따로 보기.
// 1개 문서. 초안 생성/다듬기는 mock(규칙 기반), 추후 실제 LLM으로 교체.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, PaperPlaneTilt, Trash, Eye, ArrowSquareOut, CaretDown } from "@phosphor-icons/react";
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
import { careerAssist } from "../../../lib/talent/career-assist-client";
import { useResumeDoc, useRenewalDocsStatus, saveResumeDoc, generateResumeDoc, addResumeItem, refineText, SECTION_HAS_DATE, type ResumeDoc } from "../../../lib/talent/resume-doc";
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
  function setText(id: string, text: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  }
  function setDate(id: string, field: "startDate" | "endDate", value: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) });
  }
  function refine(id: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text: refineText(it.text) } : it)) });
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
  function add(text: string, section?: CareerSection, refined?: string, startDate?: string, endDate?: string): string {
    const trimmed = text.trim();
    if (!trimmed) return "";
    const sec = section ?? classifyCareerNote(trimmed);
    const { doc: next, id } = addResumeItem(doc, sec, refined ?? refineText(trimmed), startDate ?? "", endDate ?? "");
    onChange(next);
    return id;
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
      {/* 편집 */}
      <div className="flex flex-col gap-5">
        {/* 상단 기본정보 카드에는 사진 미표시 — 사진은 문서(미리보기)에만. */}
        <ProfileCard info={basicInfo} showPhoto={false} />

        <ResumePhotoRow label={t("이력서 사진","Resume photo","简历照片","Ảnh CV","履歴書写真","Foto CV")} on={doc.showPhoto === true} onChange={(v) => onChange({ ...doc, showPhoto: v })} />

        <ChatPanel onAdd={add} />

        {CHIP_ORDER.map((section) => {
          const items = doc.items.filter((it) => it.section === section);
          if (items.length === 0) return null;
          const meta = SECTION_META[section];
          return (
            <CollapsibleSection key={section} emoji={meta.emoji} label={meta.label} count={items.length}>
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
                  onRefine={() => refine(it.id)}
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
    </div>
  );
}


// 접을 수 있는 섹션 — 길어지면 헤더를 눌러 닫아둔다.
function CollapsibleSection({ emoji, label, count, children }: { emoji: string; label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="flex flex-col gap-2.5 border-t border-[#EEF1F5] pt-5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-1.5 text-left">
        <span aria-hidden>{emoji}</span>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{label}</h2>
        <span className="text-[13px] font-bold text-[#B0B8C1]">{count}</span>
        <CaretDown className={`ml-auto h-4 w-4 shrink-0 text-[#C4CAD2] transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
      </button>
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
  onRefine: () => void;
  onRemove: () => void;
}) {
  const t = usePlatformT();
  const isExperience = section === "experience";
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      {isExperience ? (
        <input
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          placeholder={t("소속 (회사·기관)","Organization (company)","所属（公司·机构）","Nơi công tác (công ty)","所属（会社・機関）","Instansi (perusahaan)")}
          className="mb-2.5 w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] font-bold text-[#191F28] outline-none placeholder:font-normal placeholder:text-[#B0B8C1]"
        />
      ) : null}
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
        rows={3}
        placeholder={isExperience ? t("한 일·성과 (선택)","What you did / achievements (optional)","工作内容·成果（选填）","Việc đã làm / thành tích (tùy chọn)","業務・成果（任意）","Yang dikerjakan / hasil (opsional)") : undefined}
        className="min-h-[84px] w-full resize-y break-keep rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
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
              <option key={s} value={s}>{SECTION_META[s].label}</option>
            ))}
          </select>
          <CaretDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8B95A1]" weight="bold" />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRefine}
            className="inline-flex items-center gap-1 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]"
          >
            <Sparkle className="h-3.5 w-3.5" weight="fill" /> {t("AI로 다듬기","Polish with AI","用 AI 润色","Chỉnh bằng AI","AIで整える","Poles dengan AI")}
          </button>
          <button type="button" onClick={onRemove} aria-label={t("삭제","Delete","删除","Xóa","削除","Hapus")} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
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

function ChatPanel({ onAdd }: { onAdd: (text: string, section?: CareerSection, refined?: string, startDate?: string, endDate?: string) => string }) {
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
    const id = onAdd(trimmed, res.section, res.refined, res.startDate, res.endDate);
    // 커리어 기록(피드)에도 요약 리스팅.
    ensureFeedEntry(`resume:${id}`, res.refined, res.section, { label: `${t("이력서","Resume","简历","CV","履歴書","CV")} · ${meta.label}`, href: talentAppRoutes.resume });
    setMessages((m) => [
      ...m,
      { id: ++seq.current, role: "ai", text: `${meta.emoji} ${t(`${meta.label}에 정리했어요.`, `Organized under ${meta.label}.`, `已整理到「${meta.label}」。`, `Đã sắp xếp vào ${meta.label}.`, `${meta.label}に整理しました。`, `Disusun di ${meta.label}.`)} ${res.followUp}`.trim() }
    ]);
    setPending(false);
  }

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
          <SectionChip key={s} label={`${SECTION_META[s].emoji} ${SECTION_META[s].label}`} active={choice === s} onClick={() => setChoice(s)} />
        ))}
      </div>

      <div className="p-3">
        <div className="flex items-end gap-2 rounded-xl bg-[#F5F6F8] p-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter 는 무시(마지막 글자 잘림 방지).
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={t("예) 데이터 분석 프로젝트 완료 · 토익 900 취득","e.g. Completed a data analysis project · Scored 900 on TOEIC","例）完成数据分析项目 · 托业 900 分","VD) Hoàn thành dự án phân tích dữ liệu · TOEIC 900","例）データ分析プロジェクト完了・TOEIC900取得","Cth) Selesaikan proyek analisis data · TOEIC 900")}
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
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


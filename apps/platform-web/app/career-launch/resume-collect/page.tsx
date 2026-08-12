"use client";

// Week 2 — 이력서 편집 빌더(탤런트 '내 커리어'와 동일한 형태).
// 왼쪽에서 섹션을 직접 편집하고, 오른쪽에 실시간 A4 미리보기. 변경은 디바운스 자동저장(PUT).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus, Trash, Check, CircleNotch, Eye, Sparkle, CaretUp, CaretDown, SortAscending } from "@phosphor-icons/react";
import { toResumeContent } from "../../../components/launch/resume-render";
import { ResumePreview } from "../../../components/resume-maker/ResumePreview";
import { DEFAULT_DESIGN } from "../../../lib/resume-maker-types";
import { SectionTitle } from "../../../components/launch/ui";
import { SectionChatModal } from "../../../components/launch/SectionChatModal";
import {
  fetchResumeData,
  saveResumeData,
  requestResumeChat,
  type ResumeData,
  type ResumeExperience,
  type ResumeSection
} from "../../../lib/launch/resume-data";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

type SaveState = "idle" | "saving" | "saved";

export default function ResumeCollectPage() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const params = useSearchParams();
  const focus = (params.get("section") as ResumeSection | null) ?? null;
  // 주차 스텝에서 특정 섹션으로 진입하면 그 섹션만 노출(전체 진입 시 모두 노출).
  const show = (s: ResumeSection) => !focus || focus === s;

  const [data, setData] = useState<ResumeData>({ basic: {}, educations: [], experiences: [], skills: [], languages: [] });
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [noExp, setNoExp] = useState(false);
  const [noOther, setNoOther] = useState(false);
  const [showPreview, setShowPreview] = useState(false); // 모바일 미리보기 토글
  const [chatFocus, setChatFocus] = useState<ResumeSection | null>(null); // AI 대화 중인 섹션
  const dataRef = useRef<ResumeData>(data);
  dataRef.current = data;

  // 최초 로드
  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const { data: d } = await fetchResumeData();
        if (!alive) return;
        setData({
          basic: d.basic ?? {},
          educations: d.educations ?? [],
          experiences: d.experiences ?? [],
          skills: d.skills ?? [],
          languages: d.languages ?? []
        });
      } catch {
        // 빈 상태 유지
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isReady]);

  // 포커스 섹션으로 스크롤(주차 스텝에서 진입 시).
  useEffect(() => {
    if (!loaded || !focus) return;
    const el = document.getElementById(`sec-${focus}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loaded, focus]);

  // 디바운스 자동저장
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doSave = async (next: ResumeData, empties: ResumeSection[]) => {
    setSaveState("saving");
    try {
      await saveResumeData(next, empties);
      setSaveState("saved");
    } catch {
      setSaveState("idle");
    }
  };
  const emptyDone = useMemo<ResumeSection[]>(() => {
    const e: ResumeSection[] = [];
    if (noExp) e.push("exp");
    if (noOther) e.push("expOther");
    return e;
  }, [noExp, noOther]);

  function commit(next: ResumeData) {
    setData(next);
    if (!loaded) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void doSave(next, emptyDone), 700);
  }
  // 빈 처리 토글 변경 시에도 저장
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void doSave(data, emptyDone), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noExp, noOther]);

  // ── 필드 헬퍼 ──
  const setBasic = (k: keyof NonNullable<ResumeData["basic"]>, v: string) => commit({ ...data, basic: { ...data.basic, [k]: v } });

  const workList = (data.experiences ?? []).filter((e) => (e.kind ?? "work") === "work");
  const otherList = (data.experiences ?? []).filter((e) => e.kind === "other");
  const recombineExp = (work: ResumeExperience[], other: ResumeExperience[]) =>
    commit({ ...data, experiences: [...work.map((e) => ({ ...e, kind: "work" as const })), ...other.map((e) => ({ ...e, kind: "other" as const }))] });

  const aiLabel = t("AI로 채우기", "Fill with AI", "用AI填写", "Điền bằng AI", "AIで埋める", "Isi dengan AI");
  const dateLabel = t("날짜순", "By date", "按日期", "Theo ngày", "日付順", "Urut tanggal");
  const sectionLabel: Record<ResumeSection, string> = {
    basic: t("기본정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar"),
    edu: t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan"),
    exp: t("경력", "Work experience", "工作经历", "Kinh nghiệm làm việc", "職歴", "Pengalaman kerja"),
    expOther: t("활동·프로젝트", "Activities & projects", "活动·项目", "Hoạt động & dự án", "活動・プロジェクト", "Aktivitas & proyek"),
    skill: t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian"),
    lang: t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")
  };
  const chatTitle: Record<ResumeSection, string> = {
    basic: t("기본정보 대화로 채우기", "Fill basic info by chat", "对话填写基本信息", "Điền thông tin cơ bản qua chat", "会話で基本情報を入力", "Isi info dasar via chat"),
    edu: t("학력 대화로 채우기", "Fill education by chat", "对话填写学历", "Điền học vấn qua chat", "会話で学歴を入力", "Isi pendidikan via chat"),
    exp: t("경력 대화로 채우기", "Fill work experience by chat", "对话填写工作经历", "Điền kinh nghiệm qua chat", "会話で職歴を入力", "Isi pengalaman via chat"),
    expOther: t("활동·프로젝트 대화로 채우기", "Fill activities by chat", "对话填写活动·项目", "Điền hoạt động qua chat", "会話で活動を入力", "Isi aktivitas via chat"),
    skill: t("스킬 대화로 채우기", "Fill skills by chat", "对话填写技能", "Điền kỹ năng qua chat", "会話でスキルを入力", "Isi keahlian via chat"),
    lang: t("어학 대화로 채우기", "Fill languages by chat", "对话填写语言", "Điền ngoại ngữ qua chat", "会話で語学を入力", "Isi bahasa via chat")
  };
  // AI 챗 호출 — 해당 섹션 focus 로 대화하고, 갱신된 전체 데이터를 빌더에 반영.
  const chatRequest = async (history: { role: "bot" | "user"; text: string }[]) => {
    const focus = chatFocus ?? "basic";
    const { reply, data: d, done } = await requestResumeChat(history, dataRef.current, focus);
    const next: ResumeData = { basic: d.basic ?? {}, educations: d.educations ?? [], experiences: d.experiences ?? [], skills: d.skills ?? [], languages: d.languages ?? [] };
    setData(next);
    if (focus === "exp" && (next.experiences ?? []).some((e) => (e.kind ?? "work") === "work")) setNoExp(false);
    if (focus === "expOther" && (next.experiences ?? []).some((e) => e.kind === "other")) setNoOther(false);
    // 섹션 스텝 완료 반영(챗 POST는 exp/expOther 외 스텝을 표시하지 않으므로 PUT 저장).
    void saveResumeData(next, emptyDone).catch(() => {});
    return { reply, done };
  };

  if (!isReady || !loaded) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <CareerLaunchHeader />
        <main className="flex flex-1 items-center justify-center">
          <span className="text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</span>
        </main>
        <AplyFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          {/* 상단 바 */}
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/2" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              {t("← 2주차", "← Week 2", "← 第2周", "← Tuần 2", "← Week 2", "← Minggu 2")}
            </Link>
            <div className="flex items-center gap-3">
              <SaveIndicator state={saveState} t={t} />
              <button type="button" onClick={() => setShowPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] lg:hidden">
                <Eye className="h-4 w-4" weight="bold" /> {t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}
              </button>
            </div>
          </div>

          {/* 마스트헤드 */}
          <div className="mt-3.5">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")}</p>
            <h1 className="mt-2 break-keep text-[24px] font-black leading-[1.2] tracking-[-0.03em] text-[#191F28] md:text-[30px]">{focus ? sectionLabel[focus] : t("내 이력서 작성", "Build your resume", "撰写我的简历", "Viết CV của tôi", "履歴書を作成", "Susun resume saya")}</h1>
            <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#8B95A1] md:text-[14.5px]">{focus ? t("이 항목만 채우면 돼요. 직접 입력하거나 'AI로 채우기'로 대화하며 완성하세요.", "Just fill in this section — type it in or use 'Fill with AI' to complete it by chatting.", "只需填写此项。可直接输入，或用“用AI填写”对话完成。", "Chỉ cần điền mục này — tự nhập hoặc dùng 'Điền bằng AI' để hoàn thành qua trò chuyện.", "この項目だけ入力すればOK。直接入力するか『AIで埋める』で会話しながら完成させましょう。", "Cukup isi bagian ini — ketik langsung atau pakai 'Isi dengan AI' lewat percakapan.") : t("항목을 직접 채우면 오른쪽 미리보기에 바로 반영돼요. 내용은 자동 저장됩니다.", "Fill in each item and it updates the preview instantly. Everything saves automatically.", "直接填写各项，右侧预览会即时更新。内容自动保存。", "Điền từng mục và bản xem trước cập nhật ngay. Mọi thứ được lưu tự động.", "各項目を入力すると右のプレビューに即反映。内容は自動保存されます。", "Isi tiap item dan pratinjau langsung diperbarui. Semua tersimpan otomatis.")}</p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            {/* ── 편집 폼 ── */}
            <div className="flex flex-col gap-9">
              {/* 기본정보 */}
              <section id="sec-basic" className={show("basic") ? undefined : "hidden"}>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[19px]">{t("기본정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")}</h2>
                  <AiBtn onClick={() => setChatFocus("basic")} label={aiLabel} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label={t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")} value={data.basic?.name ?? ""} onChange={(v) => setBasic("name", v)} placeholder={t("예: 응우옌 마이", "e.g., Nguyen Mai", "例：阮梅", "VD: Nguyen Mai", "例：グエン・マイ", "Cth: Nguyen Mai")} />
                  <Field label={t("이메일", "Email", "邮箱", "Email", "メール", "Email")} value={data.basic?.email ?? ""} onChange={(v) => setBasic("email", v)} placeholder="name@email.com" />
                  <Field label={t("연락처", "Phone", "联系方式", "Điện thoại", "連絡先", "Telepon")} value={data.basic?.phone ?? ""} onChange={(v) => setBasic("phone", v)} placeholder="010-0000-0000" />
                </div>
                <div className="mt-3">
                  <FieldLabel>{t("한줄 소개", "One-line intro", "一句话介绍", "Giới thiệu ngắn", "一言紹介", "Perkenalan singkat")}</FieldLabel>
                  <textarea value={data.basic?.summary ?? ""} onChange={(e) => setBasic("summary", e.target.value)} rows={2} placeholder={t("예: 마케팅 직무를 준비하는 경영학과 유학생입니다.", "e.g., A business student aiming for a marketing role.", "例：准备市场营销岗位的经营学留学生。", "VD: Du học sinh Kinh doanh hướng tới marketing.", "例：マーケティング職を目指す経営学の留学生です。", "Cth: Mahasiswa bisnis yang mengincar peran marketing.")} className={taClass} />
                </div>
              </section>

              {/* 학력 */}
              <section id="sec-edu" className={show("edu") ? undefined : "hidden"}>
                <RowSectionTitle title={t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")} onAdd={() => commit({ ...data, educations: [...(data.educations ?? []), {}] })} addLabel={t("추가", "Add", "添加", "Thêm", "追加", "Tambah")} onAi={() => setChatFocus("edu")} aiLabel={aiLabel} onSort={(data.educations ?? []).length > 1 ? () => commit({ ...data, educations: sortByDateDesc(data.educations ?? []) }) : undefined} sortLabel={dateLabel} />
                {(data.educations ?? []).length === 0 ? <Empty t={t} /> : null}
                <div className="flex flex-col gap-3">
                  {(data.educations ?? []).map((edu, i) => (
                    <RowCard
                      key={i}
                      onRemove={() => commit({ ...data, educations: (data.educations ?? []).filter((_, j) => j !== i) })}
                      onUp={() => commit({ ...data, educations: moveIn(data.educations ?? [], i, -1) })}
                      onDown={() => commit({ ...data, educations: moveIn(data.educations ?? [], i, 1) })}
                      first={i === 0}
                      last={i === (data.educations ?? []).length - 1}
                    >
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <Field label={t("학교", "School", "学校", "Trường", "学校", "Sekolah")} value={edu.school ?? ""} onChange={(v) => updRow(data.educations!, i, { school: v }, (arr) => commit({ ...data, educations: arr }))} placeholder={t("예: 고려대학교", "e.g., Korea University", "例：高丽大学", "VD: ĐH Korea", "例：高麗大学", "Cth: Korea University")} />
                        <Field label={t("전공", "Major", "专业", "Chuyên ngành", "専攻", "Jurusan")} value={edu.major ?? ""} onChange={(v) => updRow(data.educations!, i, { major: v }, (arr) => commit({ ...data, educations: arr }))} placeholder={t("예: 경영학", "e.g., Business", "例：经营学", "VD: Kinh doanh", "例：経営学", "Cth: Bisnis")} />
                        <Field label={t("학위", "Degree", "学位", "Bằng cấp", "学位", "Gelar")} value={edu.degree ?? ""} onChange={(v) => updRow(data.educations!, i, { degree: v }, (arr) => commit({ ...data, educations: arr }))} placeholder={t("예: 학사", "e.g., Bachelor", "例：学士", "VD: Cử nhân", "例：学士", "Cth: Sarjana")} />
                        <Field label={t("기간", "Period", "期间", "Thời gian", "期間", "Periode")} value={edu.period ?? ""} onChange={(v) => updRow(data.educations!, i, { period: v }, (arr) => commit({ ...data, educations: arr }))} placeholder="2021.03 ~ 2025.02" />
                      </div>
                    </RowCard>
                  ))}
                </div>
              </section>

              {/* 경력(회사) */}
              <ExpSection
                id="sec-exp"
                title={t("경력 (회사)", "Work experience", "工作经历", "Kinh nghiệm làm việc", "職歴（会社）", "Pengalaman kerja")}
                none={noExp}
                onNone={setNoExp}
                noneLabel={t("경력 없음", "No work experience", "无工作经历", "Chưa có kinh nghiệm", "職歴なし", "Belum ada pengalaman")}
                list={workList}
                onChange={(next) => recombineExp(next, otherList)}
                onAi={() => setChatFocus("exp")}
                hidden={!show("exp")}
                t={t}
              />

              {/* 활동·프로젝트 */}
              <ExpSection
                id="sec-expOther"
                title={t("활동·프로젝트", "Activities & projects", "活动·项目", "Hoạt động & dự án", "活動・プロジェクト", "Aktivitas & proyek")}
                none={noOther}
                onNone={setNoOther}
                noneLabel={t("활동 없음", "No activities", "无活动", "Chưa có hoạt động", "活動なし", "Belum ada aktivitas")}
                list={otherList}
                onChange={(next) => recombineExp(workList, next)}
                onAi={() => setChatFocus("expOther")}
                hidden={!show("expOther")}
                t={t}
              />

              {/* 스킬 */}
              <section id="sec-skill" className={show("skill") ? undefined : "hidden"}>
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[19px]">{t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian")}</h2>
                  <AiBtn onClick={() => setChatFocus("skill")} label={aiLabel} />
                </div>
                <TagInput values={data.skills ?? []} onChange={(vals) => commit({ ...data, skills: vals })} placeholder={t("예: Python (엔터로 추가)", "e.g., Python (Enter to add)", "例：Python（回车添加）", "VD: Python (Enter để thêm)", "例：Python（Enterで追加）", "Cth: Python (Enter untuk menambah)")} />
              </section>

              {/* 어학 */}
              <section id="sec-lang" className={show("lang") ? undefined : "hidden"}>
                <RowSectionTitle title={t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")} onAdd={() => commit({ ...data, languages: [...(data.languages ?? []), {}] })} addLabel={t("추가", "Add", "添加", "Thêm", "追加", "Tambah")} onAi={() => setChatFocus("lang")} aiLabel={aiLabel} />
                {(data.languages ?? []).length === 0 ? <Empty t={t} /> : null}
                <div className="flex flex-col gap-3">
                  {(data.languages ?? []).map((lang, i) => (
                    <RowCard
                      key={i}
                      onRemove={() => commit({ ...data, languages: (data.languages ?? []).filter((_, j) => j !== i) })}
                      onUp={() => commit({ ...data, languages: moveIn(data.languages ?? [], i, -1) })}
                      onDown={() => commit({ ...data, languages: moveIn(data.languages ?? [], i, 1) })}
                      first={i === 0}
                      last={i === (data.languages ?? []).length - 1}
                    >
                      <div className="grid gap-2.5 sm:grid-cols-2">
                        <Field label={t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")} value={lang.language ?? ""} onChange={(v) => updRow(data.languages!, i, { language: v }, (arr) => commit({ ...data, languages: arr }))} placeholder={t("예: 한국어", "e.g., Korean", "例：韩语", "VD: Tiếng Hàn", "例：韓国語", "Cth: Korea")} />
                        <Field label={t("수준", "Level", "水平", "Trình độ", "レベル", "Level")} value={lang.level ?? ""} onChange={(v) => updRow(data.languages!, i, { level: v }, (arr) => commit({ ...data, languages: arr }))} placeholder="TOPIK 5" />
                      </div>
                    </RowCard>
                  ))}
                </div>
              </section>

            </div>

            {/* ── 실시간 A4 미리보기 ── */}
            <div className={`${showPreview ? "block" : "hidden"} lg:block`}>
              <div className="lg:sticky lg:top-20">
                <p className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("실시간 미리보기", "Live preview", "实时预览", "Xem trước trực tiếp", "リアルタイムプレビュー", "Pratinjau langsung")}</p>
                {/* 회색 트레이 위에 A4 시트가 쌓임 — 1장을 넘기면 다음 장이 아래로 이어짐 */}
                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl bg-[#F2F4F6] p-3">
                  <ResumePreview content={toResumeContent(data)} design={DEFAULT_DESIGN} preserveOrder />
                </div>
                <Link href="/career-launch/resume-preview" target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
                  {t("전체 화면으로 보기", "Open full screen", "全屏查看", "Xem toàn màn hình", "全画面で見る", "Lihat layar penuh")} ↗
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AplyFooter />
      {chatFocus ? <SectionChatModal title={chatTitle[chatFocus]} request={chatRequest} onClose={() => setChatFocus(null)} /> : null}
    </div>
  );
}

// ── 하위 UI ──
const inputClass = "w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]";
const taClass = `${inputClass} min-h-[64px] resize-y leading-relaxed`;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-[12px] font-bold text-[#4E5968]">{children}</label>;
}
function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />
    </div>
  );
}
function AiBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg bg-[#191F28] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0B1227]">
      <Sparkle className="h-3.5 w-3.5" weight="fill" /> {label}
    </button>
  );
}
function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]">
      <Plus className="h-3.5 w-3.5" weight="bold" /> {label}
    </button>
  );
}
function SortBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-[#E5E8EB] bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
      <SortAscending className="h-3.5 w-3.5" weight="bold" /> {label}
    </button>
  );
}
function RowSectionTitle({ title, onAdd, addLabel, onAi, aiLabel, onSort, sortLabel }: { title: string; onAdd: () => void; addLabel: string; onAi?: () => void; aiLabel?: string; onSort?: () => void; sortLabel?: string }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[19px]">{title}</h2>
      <div className="flex items-center gap-1.5">
        {onSort ? <SortBtn onClick={onSort} label={sortLabel ?? ""} /> : null}
        {onAi ? <AiBtn onClick={onAi} label={aiLabel ?? "AI"} /> : null}
        <AddBtn onClick={onAdd} label={addLabel} />
      </div>
    </div>
  );
}
function RowCard({ children, onRemove, onUp, onDown, first, last }: { children: React.ReactNode; onRemove: () => void; onUp?: () => void; onDown?: () => void; first?: boolean; last?: boolean }) {
  return (
    <div className="relative rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4 pr-12">
      {children}
      <div className="absolute right-2.5 top-2.5 flex flex-col items-center">
        {onUp ? (
          <button type="button" onClick={onUp} disabled={first} aria-label="move up" className="flex h-6 w-7 items-center justify-center rounded text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#4E5968] disabled:opacity-30">
            <CaretUp className="h-3.5 w-3.5" weight="bold" />
          </button>
        ) : null}
        {onDown ? (
          <button type="button" onClick={onDown} disabled={last} aria-label="move down" className="flex h-6 w-7 items-center justify-center rounded text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#4E5968] disabled:opacity-30">
            <CaretDown className="h-3.5 w-3.5" weight="bold" />
          </button>
        ) : null}
        <button type="button" onClick={onRemove} aria-label="remove" className="mt-0.5 flex h-6 w-7 items-center justify-center rounded text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
function Empty({ t }: { t: ReturnType<typeof useLaunchT> }) {
  return <p className="mb-3 rounded-xl border border-dashed border-[#E5E8EB] bg-[#FAFBFC] px-4 py-3 text-[12.5px] text-[#B0B8C1]">{t("‘추가’를 눌러 항목을 채워보세요.", "Tap 'Add' to fill this in.", "点击“添加”来填写。", "Nhấn 'Thêm' để điền.", "「追加」を押して入力しましょう。", "Ketuk 'Tambah' untuk mengisi.")}</p>;
}

function ExpSection({ id, title, none, onNone, noneLabel, list, onChange, onAi, hidden, t }: { id: string; title: string; none: boolean; onNone: (v: boolean) => void; noneLabel: string; list: ResumeExperience[]; onChange: (next: ResumeExperience[]) => void; onAi?: () => void; hidden?: boolean; t: ReturnType<typeof useLaunchT> }) {
  return (
    <section id={id} className={hidden ? "hidden" : undefined}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[19px]">{title}</h2>
        {!none ? (
          <div className="flex items-center gap-1.5">
            {list.length > 1 ? <SortBtn onClick={() => onChange(sortByDateDesc(list))} label={t("날짜순", "By date", "按日期", "Theo ngày", "日付順", "Urut tanggal")} /> : null}
            {onAi ? <AiBtn onClick={onAi} label={t("AI로 채우기", "Fill with AI", "用AI填写", "Điền bằng AI", "AIで埋める", "Isi dengan AI")} /> : null}
            <AddBtn onClick={() => onChange([...list, {}])} label={t("추가", "Add", "添加", "Thêm", "追加", "Tambah")} />
          </div>
        ) : null}
      </div>
      <label className="mb-3 inline-flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-[#4E5968]">
        <input type="checkbox" checked={none} onChange={(e) => onNone(e.target.checked)} className="h-4 w-4 accent-[#0B46E8]" />
        {noneLabel}
      </label>
      {none ? null : (
        <>
          {list.length === 0 ? <Empty t={t} /> : null}
          <div className="flex flex-col gap-3">
            {list.map((exp, i) => (
              <RowCard
                key={i}
                onRemove={() => onChange(list.filter((_, j) => j !== i))}
                onUp={() => onChange(moveIn(list, i, -1))}
                onDown={() => onChange(moveIn(list, i, 1))}
                first={i === 0}
                last={i === list.length - 1}
              >
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <Field label={t("소속", "Organization", "所属", "Tổ chức", "所属", "Organisasi")} value={exp.org ?? ""} onChange={(v) => onChange(list.map((e, j) => (j === i ? { ...e, org: v } : e)))} placeholder={t("예: 스타트업 A", "e.g., Startup A", "例：初创A", "VD: Startup A", "例：スタートアップA", "Cth: Startup A")} />
                  <Field label={t("역할·직무", "Role", "角色·职务", "Vai trò", "役割・職務", "Peran")} value={exp.title ?? ""} onChange={(v) => onChange(list.map((e, j) => (j === i ? { ...e, title: v } : e)))} placeholder={t("예: 마케팅 인턴", "e.g., Marketing intern", "例：市场营销实习", "VD: Thực tập marketing", "例：マーケインターン", "Cth: Magang marketing")} />
                </div>
                <div className="mt-2.5">
                  <Field label={t("기간", "Period", "期间", "Thời gian", "期間", "Periode")} value={exp.period ?? ""} onChange={(v) => onChange(list.map((e, j) => (j === i ? { ...e, period: v } : e)))} placeholder="2024.06 ~ 2024.08" />
                </div>
                <div className="mt-2.5">
                  <FieldLabel>{t("한 일·성과", "What you did", "工作·成果", "Việc & thành quả", "やったこと・成果", "Tugas & hasil")}</FieldLabel>
                  <textarea value={(exp.bullets ?? []).join("\n")} onChange={(e) => onChange(list.map((x, j) => (j === i ? { ...x, bullets: e.target.value.split("\n") } : x)))} rows={3} placeholder={t("한 줄에 하나씩 적어요\n예: SNS 캠페인 운영, 팔로워 30% 증가", "One per line\ne.g., Ran SNS campaigns, grew followers 30%", "每行一条\n例：运营社媒活动，粉丝增长30%", "Mỗi dòng một mục\nVD: Chạy chiến dịch SNS, tăng 30% follower", "1行に1つ\n例：SNS運用、フォロワー30%増", "Satu per baris\nCth: Kelola kampanye SNS, follower naik 30%")} className={taClass} />
                </div>
              </RowCard>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      {values.length ? (
        <div className="mb-2.5 flex flex-wrap gap-2">
          {values.map((s, i) => (
            <span key={`${s}-${i}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968]">
              {s}
              <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-[#B0B8C1] transition hover:text-[#F04452]">×</button>
            </span>
          ))}
        </div>
      ) : null}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );
}

function SaveIndicator({ state, t }: { state: SaveState; t: ReturnType<typeof useLaunchT> }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#8B95A1]">
        <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> {t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")}
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#12B76A]">
        <Check className="h-3.5 w-3.5" weight="bold" /> {t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan")}
      </span>
    );
  }
  return null;
}

// 배열 행 부분 업데이트 헬퍼(학력·어학).
function updRow<T>(arr: T[], i: number, patch: Partial<T>, done: (next: T[]) => void) {
  done(arr.map((x, j) => (j === i ? { ...x, ...patch } : x)));
}

// 항목 순서 이동(위/아래).
function moveIn<T>(arr: T[], i: number, dir: number): T[] {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
// 기간 문자열에서 가장 마지막 숫자(종료 시점)를 뽑아 최신순 정렬 키로.
function recencyKey(period?: string | null): string {
  const nums = (period ?? "").replace(/[^0-9]/g, " ").trim().split(/\s+/).filter(Boolean);
  return nums.length ? nums[nums.length - 1].padStart(8, "0") : "00000000";
}
function sortByDateDesc<T extends { period?: string | null }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => recencyKey(b.period).localeCompare(recencyKey(a.period)));
}

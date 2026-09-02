"use client";

// Week 2 — 자기소개서 편집 빌더(동적 문항). 기본 4문항(지원동기·성장과정·성격 장단점·입사 후 포부)으로 시작하되,
// 문항 '제목'을 직접 바꾸고 문항을 추가·삭제할 수 있다(회사마다 문항이 다르므로 강제하지 않음).
// 저장은 디바운스 자동저장(PUT). 데이터는 items:[{question,answer}] — question 이 곧 문항 제목.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CircleNotch, Eye, Sparkle, ArrowUpRight, Plus, Trash } from "@phosphor-icons/react";
import { CoverRender } from "../../../components/launch/cover-render";
import { SectionTitle } from "../../../components/launch/ui";
import { SectionChatModal } from "../../../components/launch/SectionChatModal";
import { fetchCoverData, saveCoverData, requestCoverChat, type CoverData } from "../../../lib/launch/cover-data";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

type SaveState = "idle" | "saving" | "saved";
type Item = { title: string; answer: string };

export default function CoverCollectPage() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();

  // 기본(추천) 문항 — 없으면 이걸로 시작. 제목은 자유롭게 바꿀 수 있다.
  const defaultItems = (): Item[] => [
    { title: t("지원 동기", "Motivation", "申请动机", "Động lực ứng tuyển", "志望動機", "Motivasi melamar"), answer: "" },
    { title: t("성장 과정", "Background", "成长经历", "Quá trình trưởng thành", "成長過程", "Latar belakang"), answer: "" },
    { title: t("성격의 장단점", "Strengths & weaknesses", "性格优缺点", "Điểm mạnh & yếu", "性格の長所・短所", "Kelebihan & kekurangan"), answer: "" },
    { title: t("입사 후 포부", "Goals after joining", "入职后的抱负", "Mục tiêu sau khi vào", "入社後の抱負", "Aspirasi setelah bergabung"), answer: "" }
  ];

  const [company, setCompany] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [showPreview, setShowPreview] = useState(false);
  const [chatIdx, setChatIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!isReady) return;
    let alive = true;
    void (async () => {
      try {
        const { data } = await fetchCoverData();
        if (!alive) return;
        setCompany(data.company ?? "");
        const loadedItems = (data.items ?? []).map((it) => ({ title: (it.question ?? "").trim(), answer: it.answer ?? "" })).filter((it) => it.title || it.answer);
        setItems(loadedItems.length ? loadedItems : defaultItems());
      } catch {
        setItems(defaultItems());
      } finally {
        if (alive) setLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const buildData = (c: string, list: Item[]): CoverData => ({
    company: c.trim() || null,
    // 제목이 있는 문항만 저장(빈 제목은 유령 문항 방지). answer 만 있고 제목 없으면 제외.
    items: list.filter((x) => x.title.trim()).map((x) => ({ question: x.title.trim(), answer: x.answer }))
  });

  const preview: CoverData = buildData(company, items);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = (c: string, list: Item[]) => {
    if (!loaded) return;
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveCoverData(buildData(c, list));
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 700);
  };

  const update = (next: Item[]) => {
    setItems(next);
    scheduleSave(company, next);
  };
  const setTitle = (i: number, v: string) => update(items.map((x, idx) => (idx === i ? { ...x, title: v } : x)));
  const setAnswer = (i: number, v: string) => update(items.map((x, idx) => (idx === i ? { ...x, answer: v } : x)));
  const addItem = () => update([...items, { title: "", answer: "" }]);
  const removeItem = (i: number) => update(items.filter((_, idx) => idx !== i));
  const setCompanyVal = (v: string) => {
    setCompany(v);
    scheduleSave(v, items);
  };

  const aiLabel = t("AI로 채우기", "Fill with AI", "用AI填写", "Điền bằng AI", "AIで埋める", "Isi dengan AI");
  // AI 챗 — 해당 문항 제목을 focus 로 대화하고, 갱신된 답변을 그 문항에 반영·저장.
  const chatRequest = async (history: { role: "bot" | "user"; text: string }[]) => {
    const idx = chatIdx ?? 0;
    const focusTitle = items[idx]?.title?.trim() || undefined;
    const { reply, data: d, done } = await requestCoverChat(history, buildData(company, items), focusTitle);
    const returned = d.items ?? [];
    const match = focusTitle ? returned.find((it) => (it.question ?? "").trim() === focusTitle) : undefined;
    const nextCompany = d.company ?? company;
    if (match && typeof match.answer === "string") {
      const next = items.map((x, i) => (i === idx ? { ...x, answer: match.answer! } : x));
      setCompany(nextCompany);
      setItems(next);
      void saveCoverData(buildData(nextCompany, next)).catch(() => {});
    } else if (nextCompany !== company) {
      setCompany(nextCompany);
      void saveCoverData(buildData(nextCompany, items)).catch(() => {});
    }
    return { reply, done };
  };

  if (!isReady || !loaded) {
    return (
      <div className="isolate flex min-h-screen flex-col bg-white">
        <LaunchAmbientBackground />
        <CareerLaunchHeader />
        <main className="flex flex-1 items-center justify-center">
          <span className="text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</span>
        </main>
        <AplyFooter />
      </div>
    );
  }

  const taClass = "min-h-[120px] w-full resize-y rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] leading-relaxed text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]";

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <div className="flex items-center justify-between gap-3">
            <Link href="/career-launch/week/2" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
              {t("← 지원 패키지", "← Application package", "← 申请材料包", "← Bộ hồ sơ ứng tuyển", "← 応募パッケージ", "← Paket lamaran")}
            </Link>
            <div className="flex items-center gap-3">
              <SaveIndicator state={saveState} t={t} />
              <button type="button" onClick={() => setShowPreview((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] lg:hidden">
                <Eye className="h-4 w-4" weight="bold" /> {t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}
              </button>
            </div>
          </div>

          <div className="mt-3.5">
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}</p>
            <h1 className="mt-2 break-keep text-[24px] font-black leading-[1.2] tracking-[-0.03em] text-[#191F28] md:text-[30px]">{t("내 자기소개서 작성", "Write your cover letter", "撰写我的自我介绍书", "Viết thư giới thiệu", "自己紹介書を作成", "Tulis surat lamaran")}</h1>
            <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#8B95A1] md:text-[14.5px]">{t("기본 문항으로 시작하되, 문항 제목을 바꾸거나 지원하는 회사 문항에 맞춰 추가·삭제할 수 있어요. 내용은 자동 저장됩니다.", "Start from the default sections, but rename them or add/remove to match the company's prompts. Everything saves automatically.", "从默认文项开始，也可改标题或按公司要求增删。内容自动保存。", "Bắt đầu từ mục mặc định, nhưng bạn có thể đổi tên hoặc thêm/xóa theo yêu cầu công ty. Tự động lưu.", "デフォルト項目から始め、タイトル変更や会社の設問に合わせて追加・削除できます。自動保存されます。", "Mulai dari bagian bawaan, tapi bisa ganti judul atau tambah/hapus sesuai perusahaan. Tersimpan otomatis.")}</p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex flex-col gap-6">
              {/* 지원 회사(선택) */}
              <div>
                <SectionTitle>{t("지원 회사", "Target company", "目标公司", "Công ty ứng tuyển", "応募先", "Perusahaan tujuan")}</SectionTitle>
                <input value={company} onChange={(e) => setCompanyVal(e.target.value)} placeholder={t("예: OO전자 (선택)", "e.g., OO Corp (optional)", "例：OO电子（可选）", "VD: Công ty OO (tùy chọn)", "例：OO電子（任意）", "Cth: OO Corp (opsional)")} className="w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none transition placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]" />
              </div>

              {items.map((it, i) => (
                <section key={i}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-[13px] font-black tabular-nums text-[#0B46E8]">{String(i + 1).padStart(2, "0")}</span>
                    {/* 문항 제목 — 직접 편집 */}
                    <input
                      value={it.title}
                      onChange={(e) => setTitle(i, e.target.value)}
                      placeholder={t("문항 제목 (예: 지원 동기)", "Section title (e.g., Motivation)", "文项标题（例：申请动机）", "Tiêu đề mục (VD: Động lực)", "設問タイトル（例：志望動機）", "Judul bagian (cth: Motivasi)")}
                      className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-[16.5px] font-black tracking-[-0.02em] text-[#0B1227] outline-none transition hover:border-[#E5E8EB] focus:border-[#0B46E8] focus:bg-white"
                    />
                    <button type="button" onClick={() => setChatIdx(i)} className="inline-flex flex-none items-center gap-1 rounded-lg bg-[#191F28] px-3 py-1.5 text-[12.5px] font-bold text-white transition hover:bg-[#0B1227]">
                      <Sparkle className="h-3.5 w-3.5" weight="fill" /> {aiLabel}
                    </button>
                    <button type="button" onClick={() => removeItem(i)} aria-label={t("문항 삭제", "Delete section", "删除文项", "Xóa mục", "設問を削除", "Hapus bagian")} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#C4CAD2] transition hover:bg-[#FDECEC] hover:text-[#F04452]">
                      <Trash className="h-4 w-4" weight="bold" />
                    </button>
                  </div>
                  <textarea value={it.answer} onChange={(e) => setAnswer(i, e.target.value)} rows={5} placeholder={t("직접 쓰거나 'AI로 채우기'로 대화하며 완성하세요.", "Type it, or use 'Fill with AI' to complete it by chatting.", "直接输入，或用“用AI填写”对话完成。", "Tự viết hoặc dùng 'Điền bằng AI'.", "直接書くか『AIで埋める』で。", "Ketik langsung atau pakai 'Isi dengan AI'.")} className={taClass} />
                </section>
              ))}

              <button type="button" onClick={addItem} className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C9D3E8] bg-[#FAFBFF] px-4 py-3 text-[13.5px] font-bold text-[#0B46E8] transition hover:border-[#0B46E8]/50 hover:bg-[#F4F8FF]">
                <Plus className="h-4 w-4" weight="bold" /> {t("문항 추가", "Add a section", "添加文项", "Thêm mục", "設問を追加", "Tambah bagian")}
              </button>
            </div>

            {/* 실시간 A4 미리보기 */}
            <div className={`${showPreview ? "block" : "hidden"} lg:block`}>
              <div className="lg:sticky lg:top-20">
                <p className="mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("실시간 미리보기", "Live preview", "实时预览", "Xem trước trực tiếp", "リアルタイムプレビュー", "Pratinjau langsung")}</p>
                <div className="max-h-[calc(100vh-9rem)] overflow-y-auto rounded-2xl bg-[#F2F4F6] p-3">
                  <CoverRender data={preview} />
                </div>
                <Link href="/career-launch/cover-preview" target="_blank" rel="noopener noreferrer" className="mt-3 block text-center text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
                  {t("전체 화면으로 보기", "Open full screen", "全屏查看", "Xem toàn màn hình", "全画面で見る", "Lihat layar penuh")} <ArrowUpRight className="inline h-3.5 w-3.5 align-text-bottom" weight="bold" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AplyFooter />
      {chatIdx !== null ? (
        <SectionChatModal
          title={`${items[chatIdx]?.title?.trim() || t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")} · ${t("대화로 채우기", "Fill by chat", "对话填写", "Điền qua chat", "会話で入力", "Isi via chat")}`}
          request={chatRequest}
          onClose={() => setChatIdx(null)}
        />
      ) : null}
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

"use client";

// 모의 면접 등록하기 — Aply에서 지원하지 않은 면접도 등록해 두고 일정에 맞춰 연습한다.
// 공고 고르기(Aply 공고 검색 / 링크 / 본문 붙여넣기) → 바로 등록. 면접 일정은 카드의 [수정]에서(이 시트의 일정 단계).
import { useEffect, useState } from "react";
import { Sheet } from "./sheets";
import { Button, Empty, Row, RowsSkeleton, SearchField } from "./ui";
import { companyOf, jobPhotoOf } from "./lib";
import { ImportJobSheet } from "./interview-content";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT } from "../../lib/i18n";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";
import { removeMyInterview, saveMyInterview, type MyInterview } from "../../lib/talent/my-interviews";

type Job = { positionId: string; title: string; company: string };

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function splitLocal(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "10:00" };
  const d = new Date(iso);
  return { date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}

export function RegisterInterviewSheet({ initial, onClose, onSaved }: { initial?: MyInterview | null; onClose: () => void; onSaved: (m: MyInterview) => void }) {
  const t = usePlatformT();
  const [step, setStep] = useState<"pick" | "search" | "url" | "text" | "when">(initial ? "when" : "pick");
  const [job] = useState<Job | null>(initial ? { positionId: initial.positionId, title: initial.title, company: initial.company } : null);
  const init = splitLocal(initial?.interviewAt ?? null);
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [unknown, setUnknown] = useState(initial ? !initial.interviewAt : false);
  // 공고를 고르면 바로 등록 — 면접 일정은 나중에 카드의 [수정]에서.
  const choose = (p: PublicPositionListItem) => onSaved(saveMyInterview({ positionId: p.id, title: p.title, company: companyOf(p) }));
  const canSave = !!job && (unknown || !!date);
  const save = () => {
    if (!job || !canSave) return;
    const at = unknown ? null : new Date(`${date}T${time || "10:00"}`).toISOString();
    onSaved(saveMyInterview({ ...job, interviewAt: at }));
  };

  // 링크·본문 가져오기는 기존 '공고 가져오기' 시트를 그대로 쓴다(끝 버튼만 '다음').
  if (step === "url" || step === "text")
    return (
      <ImportJobSheet
        initialMode={step}
        title={t("면접 볼 공고 가져오기", "Import the job", "导入面试职位", "Nhập tin phỏng vấn", "面接の求人を取り込む", "Impor lowongan")}
        subtitle={t("AI가 공고를 정리해 면접 연습에 써요", "AI summarizes it for practice", "AI 整理后用于练习", "AI tóm tắt để luyện tập", "AIが整理して練習に使います", "AI merangkum untuk latihan")}
        ctaLabel={t("등록하기", "Add", "登记", "Thêm", "登録する", "Tambah")}
        onClose={() => setStep("pick")}
        onStart={choose}
      />
    );

  const pickTitle = t("어떤 공고의 면접인가요?", "Which job is the interview for?", "是哪个职位的面试？", "Phỏng vấn cho tin nào?", "どの求人の面接ですか？", "Wawancara untuk lowongan apa?");
  const pickSub = t("이 공고에 맞춘 질문으로 연습해요", "Practice with questions tailored to it", "用定制问题练习", "Luyện câu hỏi theo tin", "求人に合わせて練習", "Latihan sesuai lowongan");
  const title = step === "search" ? t("Aply 공고에서 찾기", "Find on Aply", "在 Aply 找职位", "Tìm trên Aply", "Aplyで探す", "Cari di Aply") : t("면접 일정", "Interview schedule", "面试日程", "Lịch phỏng vấn", "面接日程", "Jadwal wawancara");
  return (
    <Sheet
      tall
      title={step === "pick" ? pickTitle : title}
      subtitle={step === "pick" ? pickSub : undefined}
      onClose={step === "search" ? () => setStep("pick") : onClose}
      footer={
        step === "when" ? (
          initial ? (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="neutral"
                full
                onClick={() => {
                  removeMyInterview(initial.id);
                  onClose();
                }}
              >
                {t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
              </Button>
              <Button full onClick={save} disabled={!canSave}>
                {t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
              </Button>
            </div>
          ) : (
            <Button full onClick={save} disabled={!canSave}>
              {t("등록하기", "Add", "登记", "Thêm", "登録する", "Tambah")}
            </Button>
          )
        ) : undefined
      }
    >
      {step === "pick" ? (
        <div>
          <Row onClick={() => setStep("search")} lead="🔍" title={t("Aply 공고에서 찾기", "Find on Aply", "在 Aply 找职位", "Tìm trên Aply", "Aplyで探す", "Cari di Aply")} meta={t("직무·회사 이름으로 검색", "Search by role or company", "按职位或公司搜索", "Theo vị trí/công ty", "職種・会社名で検索", "Cari peran/perusahaan")} />
          <Row onClick={() => setStep("url")} lead="🔗" title={t("링크로 가져오기", "Import by link", "通过链接导入", "Nhập bằng link", "リンクで取り込む", "Impor lewat tautan")} meta={t("원티드·사람인·회사 채용 페이지 주소", "Any job site or careers page URL", "招聘网站或公司招聘页链接", "Link trang tuyển dụng", "求人サイト・採用ページのURL", "Tautan situs lowongan")} />
          <Row onClick={() => setStep("text")} lead="📋" title={t("본문 붙여넣기", "Paste the posting", "粘贴职位内容", "Dán nội dung tin", "本文を貼り付け", "Tempel isi lowongan")} meta={t("링크가 없거나 로그인이 필요한 공고", "No link or login-only postings", "无链接或需登录的职位", "Không có link hoặc cần đăng nhập", "リンクなし・ログイン必須の求人", "Tanpa tautan atau perlu login")} />
        </div>
      ) : step === "search" ? (
        <JobSearch onPick={choose} />
      ) : job ? (
        <div>
          <div className="rounded-3xl bg-[#f3eeff] p-5">
            <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{job.company || t("회사 이름 없음", "Company unknown", "未知公司", "Không rõ công ty", "会社名なし", "Perusahaan tidak diketahui")}</p>
            <p className="mt-1 text-[19px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{job.title}</p>
          </div>
          <p className="mt-6 text-[16px] font-bold text-[color:var(--v2-ink)]">{t("면접은 언제예요?", "When is the interview?", "面试是什么时候？", "Phỏng vấn khi nào?", "面接はいつですか？", "Kapan wawancaranya?")}</p>
          <div className={`mt-3 grid grid-cols-1 gap-2 transition-opacity sm:grid-cols-[1fr_168px] ${unknown ? "pointer-events-none opacity-40" : ""}`}>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label={t("날짜", "Date", "日期", "Ngày", "日付", "Tanggal")} className="h-12 w-full min-w-0 appearance-none rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2" />
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label={t("시간", "Time", "时间", "Giờ", "時間", "Waktu")} className="h-12 w-full min-w-0 appearance-none rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] focus:ring-2" />
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-[14px] font-semibold text-[color:var(--v2-ink-3)]">
            <input type="checkbox" checked={unknown} onChange={(e) => setUnknown(e.target.checked)} className="h-5 w-5 accent-[#0b46e8]" />
            {t("아직 날짜를 몰라요", "Date not set yet", "还不知道日期", "Chưa biết ngày", "日程はまだ未定", "Tanggal belum pasti")}
          </label>
          <p className="mt-6 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">{t("등록한 면접은 나만 봐요. '내가 등록한 모의 면접'에 D-day와 함께 떠서, 이 공고로 연습하고 면접 전날 볼 한 장(예상 질문·모범 답안)을 볼 수 있어요.", "Only you see it. It appears under 'My mock interviews' with a countdown, practice, and a night-before sheet.", "仅你可见。会显示在“我登记的模拟面试”中，可练习并查看考前速览。", "Chỉ bạn thấy. Hiện ở 'Phỏng vấn thử của tôi' kèm D-day, luyện tập và bản ôn tập.", "自分だけが見られます。「登録した模擬面接」にD-dayと共に表示されます。", "Hanya kamu yang melihat. Muncul di 'Simulasi milikku'.")}</p>
        </div>
      ) : null}
    </Sheet>
  );
}

/** 이 화면 안에서 공고 검색 — 포지션 탐색으로 넘어가지 않는다. */
export function JobSearch({ onPick }: { onPick: (p: PublicPositionListItem) => void }) {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const [q, setQ] = useState("");
  // 엔터·[검색]을 눌렀을 때만 찾는다(포지션 탐색과 같은 규칙). 비어 있으면 최신 공고 몇 개.
  const [term, setTerm] = useState("");
  const [result, setResult] = useState<{ for: string; items: PublicPositionListItem[] } | null>(null);
  useEffect(() => {
    let alive = true;
    getPublicPositionsPage({ search: term || undefined, limit: term ? 8 : 4, locale })
      .then((p) => alive && setResult({ for: term, items: p.items }))
      .catch(() => alive && setResult({ for: term, items: [] }));
    return () => {
      alive = false;
    };
  }, [term, locale]);
  // 찾는 동안엔 옛 결과를 흐리게 둔다(스켈레톤으로 갈아끼우면 깜빡인다). 처음에만 스켈레톤.
  const searching = result !== null && result.for !== term;
  const items = result?.items ?? null;
  return (
    <div className="pt-2">
      <SearchField
        autoFocus
        value={q}
        onChange={setQ}
        onSubmit={() => setTerm(q.trim())}
        onClear={() => {
          setQ("");
          setTerm("");
        }}
        busy={searching}
        submitLabel={t("검색", "Search", "搜索", "Tìm", "検索", "Cari")}
        clearLabel={t("지우기", "Clear", "清除", "Xóa", "クリア", "Hapus")}
        placeholder={t("직무나 회사 이름으로 찾기", "Search by role or company", "按职位或公司搜索", "Tìm theo vị trí hoặc công ty", "職種や会社名で探す", "Cari peran atau perusahaan")}
      />
      <div className={`mt-2 transition-opacity duration-200 ${searching ? "pointer-events-none opacity-60" : ""}`} aria-busy={searching}>
        {items === null ? <RowsSkeleton count={3} /> : items.length === 0 ? (
          <Empty>{t("맞는 공고가 없어요.", "No matching jobs.", "没有匹配的职位。", "Không có tin phù hợp.", "該当する求人がありません。", "Tidak ada yang cocok.")}</Empty>
        ) : (
          items.map((p) => <Row key={p.id} onClick={() => onPick(p)} thumb={{ src: jobPhotoOf(p), fallback: companyOf(p) || p.title }} title={p.title} meta={companyOf(p) || undefined} />)
        )}
      </div>
    </div>
  );
}


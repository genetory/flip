"use client";

// 면접 등록하기 — Aply에서 지원하지 않은 면접도 등록해 두고 일정에 맞춰 연습한다.
// 공고 고르기(지원·저장한 공고 / 가져온 공고 / Aply 공고 검색 / 링크 / 본문 붙여넣기) → 면접 일정(몰라도 됨) → 등록.
import { useEffect, useState } from "react";
import { Sheet } from "./sheets";
import { Button, Empty, Row, RowsSkeleton, SearchField } from "./ui";
import { companyOf, jobPhotoOf } from "./lib";
import { ImportJobSheet } from "./interview-content";
import { useLanguage } from "../i18n/LanguageProvider";
import { usePlatformT } from "../../lib/i18n";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../lib/member-profile-client";
import { importedToPosition, useImportedJobs } from "../../lib/talent/imported-jobs";
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

export function RegisterInterviewSheet({ initial, positions, onClose, onSaved }: { initial?: MyInterview | null; positions: PublicPositionListItem[] | null; onClose: () => void; onSaved: (m: MyInterview) => void }) {
  const t = usePlatformT();
  const imported = useImportedJobs();
  const [step, setStep] = useState<"pick" | "search" | "url" | "text" | "when">(initial ? "when" : "pick");
  const [job, setJob] = useState<Job | null>(initial ? { positionId: initial.positionId, title: initial.title, company: initial.company } : null);
  const init = splitLocal(initial?.interviewAt ?? null);
  const [date, setDate] = useState(init.date);
  const [time, setTime] = useState(init.time);
  const [unknown, setUnknown] = useState(initial ? !initial.interviewAt : false);
  const choose = (p: PublicPositionListItem) => {
    setJob({ positionId: p.id, title: p.title, company: companyOf(p) });
    setStep("when");
  };
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
        ctaLabel={t("다음", "Next", "下一步", "Tiếp", "次へ", "Lanjut")}
        onClose={() => setStep("pick")}
        onStart={choose}
      />
    );

  const title = initial ? t("면접 일정", "Interview schedule", "面试日程", "Lịch phỏng vấn", "面接日程", "Jadwal wawancara") : t("면접 등록하기", "Add an interview", "登记面试", "Thêm phỏng vấn", "面接を登録", "Tambah wawancara");
  return (
    <Sheet
      tall
      title={title}
      subtitle={step === "when" ? undefined : t("Aply 밖에서 지원한 곳도 괜찮아요", "Interviews outside Aply are fine too", "Aply 以外的面试也可以", "Cả phỏng vấn ngoài Aply", "Aply以外の面接もOK", "Wawancara di luar Aply juga bisa")}
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
          <p className="text-[19px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{t("어떤 공고의 면접인가요?", "Which job is the interview for?", "是哪个职位的面试？", "Phỏng vấn cho tin nào?", "どの求人の面接ですか？", "Wawancara untuk lowongan apa?")}</p>
          <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("공고를 알려 주면 그 공고에 맞춘 질문으로 연습하고, 면접 전날 볼 한 장도 만들어 드려요.", "We'll tailor practice questions and a night-before sheet to the job.", "我们会根据职位定制练习问题和考前速览。", "Chúng tôi tạo câu hỏi luyện tập và bản ôn tập theo tin.", "求人に合わせた質問と前日の1枚を用意します。", "Kami siapkan latihan dan lembar ringkas sesuai lowongan.")}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(
              [
                ["url", "🔗", t("링크로", "By link", "链接", "Link", "リンクで", "Tautan")],
                ["text", "📋", t("본문 붙여넣기", "Paste text", "粘贴内容", "Dán nội dung", "本文貼付", "Tempel")],
                ["search", "🔍", t("Aply 공고", "Aply jobs", "Aply 职位", "Tin Aply", "Aply求人", "Aply")]
              ] as const
            ).map(([k, icon, label]) => (
              <button key={k} type="button" onClick={() => setStep(k)} className="flex min-h-[88px] flex-col items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--v2-band)] px-2 text-center transition hover:-translate-y-0.5">
                <span className="text-[22px]" aria-hidden>
                  {icon}
                </span>
                <span className="text-[14px] font-semibold text-[color:var(--v2-ink-2)]">{label}</span>
              </button>
            ))}
          </div>
          {imported.length ? (
            <div className="mt-6">
              <p className="text-[14px] font-bold text-[color:var(--v2-ink-3)]">{t("가져온 공고", "Imported jobs", "已导入的职位", "Tin đã nhập", "取り込んだ求人", "Diimpor")}</p>
              {imported.slice(0, 6).map((j) => (
                <Row key={j.id} onClick={() => choose(importedToPosition(j))} lead="🔗" title={j.title} meta={j.company || undefined} />
              ))}
            </div>
          ) : null}
          {positions?.length ? (
            <div className="mt-6">
              <p className="text-[14px] font-bold text-[color:var(--v2-ink-3)]">{t("지원·저장한 공고", "Applied & saved", "投递/收藏的职位", "Đã ứng tuyển/lưu", "応募・保存した求人", "Dilamar & disimpan")}</p>
              {positions.slice(0, 8).map((p) => (
                <Row key={p.id} onClick={() => choose(p)} thumb={{ src: jobPhotoOf(p), fallback: companyOf(p) || p.title }} title={p.title} meta={companyOf(p) || undefined} />
              ))}
            </div>
          ) : null}
        </div>
      ) : step === "search" ? (
        <JobSearch onPick={choose} />
      ) : job ? (
        <div>
          <div className="rounded-3xl bg-[#f3eeff] p-5">
            <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{job.company || t("회사 이름 없음", "Company unknown", "未知公司", "Không rõ công ty", "会社名なし", "Perusahaan tidak diketahui")}</p>
            <p className="mt-1 text-[19px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{job.title}</p>
            {!initial ? (
              <button type="button" onClick={() => setStep("pick")} className="mt-2 text-[13px] font-semibold text-[color:var(--v2-accent)]">
                {t("다른 공고 고르기", "Pick another job", "选择其他职位", "Chọn tin khác", "別の求人を選ぶ", "Pilih lowongan lain")}
              </button>
            ) : null}
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
          <p className="mt-6 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">{t("등록한 면접은 나만 봐요. '다가오는 면접'에 D-day와 함께 떠서, 이 공고로 연습하고 면접 전날 볼 한 장(예상 질문·모범 답안)을 볼 수 있어요.", "Only you see it. It appears under 'Upcoming interview' with a countdown, practice, and a night-before sheet.", "仅你可见。会显示在“即将到来的面试”中，可练习并查看考前速览。", "Chỉ bạn thấy. Hiện ở 'Phỏng vấn sắp tới' kèm D-day, luyện tập và bản ôn tập.", "自分だけが見られます。「近づく面接」にD-dayと共に表示されます。", "Hanya kamu yang melihat. Muncul di 'Wawancara mendatang'.")}</p>
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


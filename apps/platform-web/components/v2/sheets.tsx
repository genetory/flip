"use client";

// 리뉴얼 v2 시트 — 지원 현황의 메시지·진행 내역·제출한 서류. 기존 팝업(ApplicationsScreen)은 옛 화면이 계속 쓰므로
// 건드리지 않고 v2 테마(흰 바탕·토스 회색·굵은 제목·가는 구분)로 따로 만든다.
// 모바일은 아래에서 올라오는 시트, PC 는 가운데 창. 바깥·Esc 로 닫힌다.
import { useEffect, useState, type ReactNode } from "react";
import { useLockBodyScroll } from "../../lib/talent/useLockBodyScroll";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { formatRelativeTime } from "../../lib/talent/career-feed";
import { sectionLabelOf } from "../../lib/talent/career-labels";
import type { CareerSection } from "../../lib/talent/career-chat";
import {
  getApplicationMessages,
  getApplicationTimeline,
  getMyApplicationDocuments,
  sendApplicationMessage,
  type ApplicationMessage,
  type ApplicationTimelineEvent,
  type MyApplication,
  type MyApplicationDocuments
} from "../../lib/member-profile-client";
import { RowsSkeleton, Spinner } from "./ui";

/** 시트 껍데기 — 제목·부제·닫기 + 본문(+ 아래 고정 영역). */
export function Sheet({ title, subtitle, onClose, children, footer, tall = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; tall?: boolean }) {
  const t = usePlatformT();
  useLockBodyScroll();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="v2 fixed inset-0 z-[80] flex items-end justify-center !min-h-0 !bg-[#0B1227]/40 md:items-center md:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full flex-col overflow-hidden rounded-t-3xl bg-white md:max-w-[520px] md:rounded-3xl ${tall ? "h-[86vh] md:h-[640px]" : "max-h-[86vh] md:max-h-[640px]"}`}
      >
        <div className="flex items-start gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{title}</p>
            {subtitle ? <p className="mt-0.5 truncate text-[14px] text-[color:var(--v2-faint)]">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="-mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[22px] leading-none text-[color:var(--v2-faint)] transition hover:bg-[color:var(--v2-band)]">
            ×
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
        {footer ? <div className="border-t border-[color:var(--v2-band)] px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

function whenText(t: PlatformT, iso: string): string {
  const d = new Date(iso);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return t(`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${hm}`, `${d.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })} ${hm}`, `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${hm}`, `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${hm}`);
}

// ── 메시지 ─────────────────────────────────────────

export function MessageSheet({ app, onClose }: { app: MyApplication; onClose: () => void }) {
  const t = usePlatformT();
  const [messages, setMessages] = useState<ApplicationMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const reload = () => getApplicationMessages(app.id).then(setMessages).catch(() => setMessages([]));
  useEffect(() => {
    void getApplicationMessages(app.id).then(setMessages).catch(() => setMessages([]));
  }, [app.id]);
  const send = () => {
    const v = text.trim();
    if (!v || sending) return;
    setSending(true);
    sendApplicationMessage(app.id, v)
      .then(() => {
        setText("");
        return reload();
      })
      .catch(() => {})
      .finally(() => setSending(false));
  };
  return (
    <Sheet
      tall
      title={app.partnerOrganizationName ?? t("비공개 기업", "Private company", "未公开企业", "Công ty ẩn danh", "非公開企業", "Perusahaan anonim")}
      subtitle={app.positionTitle}
      onClose={onClose}
      footer={
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={t("회사에 메시지를 남겨 보세요", "Write to the company", "给公司留言", "Nhắn cho công ty", "会社にメッセージを送る", "Tulis ke perusahaan")}
            className="max-h-28 min-h-[48px] flex-1 resize-none rounded-2xl bg-[color:var(--v2-band)] px-4 py-3 text-[16px] text-[color:var(--v2-ink)] outline-none placeholder:text-[color:var(--v2-faint)]"
          />
          <button type="button" onClick={send} disabled={!text.trim() || sending} className="inline-flex h-12 min-w-[64px] shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-accent)] px-4 text-[15px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
            {sending ? <Spinner /> : t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")}
          </button>
        </div>
      }
    >
      {messages === null ? (
        <RowsSkeleton count={3} thumb={false} />
      ) : messages.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[16px] font-semibold text-[color:var(--v2-ink-2)]">{t("아직 주고받은 메시지가 없어요", "No messages yet", "还没有消息", "Chưa có tin nhắn", "まだメッセージがありません", "Belum ada pesan")}</p>
          <p className="mt-1 text-[14px] text-[color:var(--v2-faint)]">{t("궁금한 점을 회사에 편하게 물어보세요.", "Feel free to ask the company anything.", "有疑问就向公司提问吧。", "Cứ hỏi công ty điều bạn thắc mắc.", "気になることを気軽に聞いてみましょう。", "Silakan tanya apa saja ke perusahaan.")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3 pt-1">
          {messages.map((m) => {
            const mine = m.authorRole !== "PARTNER";
            return (
              <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${mine ? "bg-[color:var(--v2-accent)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink)]"}`}>
                  <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.6]">{m.content}</p>
                  <p className={`mt-1 text-[12px] ${mine ? "text-white/70" : "text-[color:var(--v2-faint)]"}`}>{formatRelativeTime(new Date(m.createdAt).getTime(), undefined, t)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}

// ── 진행 내역 ──────────────────────────────────────

function eventLabel(t: PlatformT, code: string): { emoji: string; label: string } {
  const map: Record<string, { emoji: string; label: string }> = {
    applied: { emoji: "📮", label: t("지원했어요", "Applied", "已申请", "Đã ứng tuyển", "応募しました", "Sudah melamar") },
    interview_proposed: { emoji: "📅", label: t("회사가 면접 시간을 제안했어요", "The company proposed interview times", "公司提议了面试时间", "Công ty đề xuất giờ phỏng vấn", "会社が面接時間を提案しました", "Perusahaan mengusulkan waktu wawancara") },
    interview_confirmed: { emoji: "✅", label: t("면접 시간을 정했어요", "Interview time confirmed", "已确定面试时间", "Đã chốt giờ phỏng vấn", "面接時間が決まりました", "Waktu wawancara dikonfirmasi") },
    accepted: { emoji: "🎉", label: t("합격했어요", "You got the offer", "已被录取", "Bạn đã trúng tuyển", "合格しました", "Kamu diterima") },
    rejected: { emoji: "🙏", label: t("이번엔 함께하지 못했어요", "Not selected this time", "这次未能录取", "Lần này chưa phù hợp", "今回はご縁がありませんでした", "Belum terpilih kali ini") },
    withdrawn: { emoji: "↩️", label: t("지원을 철회했어요", "Application withdrawn", "已撤回申请", "Đã rút đơn", "応募を取り消しました", "Lamaran ditarik") }
  };
  return map[code] ?? { emoji: "•", label: code };
}

export function ProgressSheet({ app, onClose }: { app: MyApplication; onClose: () => void }) {
  const t = usePlatformT();
  const [events, setEvents] = useState<ApplicationTimelineEvent[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    getApplicationTimeline(app.id)
      .then((e) => alive && setEvents(e))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [app.id]);
  return (
    <Sheet title={t("진행 내역", "Progress", "进度记录", "Tiến trình", "進捗", "Progres")} subtitle={[app.partnerOrganizationName, app.positionTitle].filter(Boolean).join(" · ")} onClose={onClose}>
      {error ? (
        <p className="py-10 text-center text-[15px] text-[color:var(--v2-attention)]">{t("진행 내역을 불러오지 못했어요.", "Couldn't load progress.", "无法加载进度。", "Không tải được tiến trình.", "進捗を読み込めませんでした。", "Gagal memuat progres.")}</p>
      ) : events === null ? (
        <RowsSkeleton count={3} />
      ) : events.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-[color:var(--v2-faint)]">{t("아직 진행 내역이 없어요.", "No progress yet.", "暂无进度。", "Chưa có tiến trình.", "まだ進捗がありません。", "Belum ada progres.")}</p>
      ) : (
        <ol className="pt-2">
          {events.map((ev, i) => {
            const m = eventLabel(t, ev.code);
            const last = i === events.length - 1;
            return (
              <li key={i} className="flex gap-3.5">
                <div className="flex flex-col items-center">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[17px] ${last ? "bg-[color:var(--v2-accent-weak)]" : "bg-[color:var(--v2-band)]"}`}>{m.emoji}</span>
                  {!last ? <span className="my-1 w-0.5 flex-1 rounded-full bg-[color:var(--v2-band)]" /> : null}
                </div>
                <div className={`min-w-0 flex-1 pt-1.5 ${last ? "" : "pb-6"}`}>
                  <p className={`text-[16px] leading-[1.45] ${last ? "font-bold text-[color:var(--v2-ink)]" : "font-semibold text-[color:var(--v2-ink-2)]"}`}>{m.label}</p>
                  <p className="mt-0.5 text-[13px] text-[color:var(--v2-faint)]">{whenText(t, ev.at)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Sheet>
  );
}

// ── 제출한 서류 ────────────────────────────────────

type DocLine = { head: string; sub?: string };
type DocBlock = { title: string; lines: DocLine[] };

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** 이력서 스냅샷 → 읽기 좋은 묶음. 리뉴얼 형식(renewalResume)과 옛 형식(careers·educations…)을 모두 읽는다. */
function resumeBlocks(t: PlatformT, r: Record<string, unknown> | null): { name: string; summary: string; blocks: DocBlock[] } {
  if (!r) return { name: "", summary: "", blocks: [] };
  const renewal = (r.renewalResume && typeof r.renewalResume === "object" ? r.renewalResume : null) as Record<string, unknown> | null;
  if (renewal) {
    const basic = (r.renewalBasicInfo && typeof r.renewalBasicInfo === "object" ? r.renewalBasicInfo : {}) as Record<string, unknown>;
    const items = (Array.isArray(renewal.items) ? renewal.items : []) as Record<string, unknown>[];
    const bySection = new Map<string, DocLine[]>();
    for (const it of items) {
      const text = str(it.text);
      const company = str(it.company);
      if (!text && !company) continue;
      const period = [str(it.startDate), str(it.endDate)].filter(Boolean).join(" ~ ");
      const line: DocLine = company ? { head: company, sub: [period, text].filter(Boolean).join(" · ") } : { head: text, sub: period || undefined };
      const key = str(it.section) || "experience";
      bySection.set(key, [...(bySection.get(key) ?? []), line]);
    }
    return {
      name: str(basic.realName),
      summary: str(renewal.summary) || str(renewal.targetRole),
      blocks: [...bySection.entries()].map(([sec, lines]) => ({ title: sectionLabelOf(t, sec as CareerSection), lines }))
    };
  }
  const arr = (k: string) => (Array.isArray(r[k]) ? (r[k] as unknown[]) : []);
  const objs = (k: string) => arr(k).filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
  const blocks: DocBlock[] = [
    { title: t("경력", "Experience", "经历", "Kinh nghiệm", "職歴", "Pengalaman"), lines: objs("careers").map((c) => ({ head: [str(c.companyName), str(c.position)].filter(Boolean).join(" · "), sub: str(c.description) || undefined })) },
    { title: t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan"), lines: objs("educations").map((e) => ({ head: str(e.schoolName), sub: str(e.major) || undefined })) },
    { title: t("활동", "Activities", "活动", "Hoạt động", "活動", "Aktivitas"), lines: objs("activities").map((a) => ({ head: [str(a.title), str(a.organization)].filter(Boolean).join(" · "), sub: str(a.description) || undefined })) },
    { title: t("자격증", "Certificates", "证书", "Chứng chỉ", "資格", "Sertifikat"), lines: objs("certifications").map((c) => ({ head: str(c.name), sub: str(c.issuer) || undefined })) },
    { title: t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa"), lines: objs("languages").map((l) => ({ head: str(l.language), sub: str(l.level) || undefined })) },
    { title: t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian"), lines: arr("skills").filter((s) => typeof s === "string").length ? [{ head: (arr("skills").filter((s) => typeof s === "string") as string[]).join(", ") }] : [] }
  ].map((b) => ({ ...b, lines: b.lines.filter((l) => l.head) }));
  return { name: str(r.basicName), summary: str(r.summary) || str(r.selfIntroduction), blocks: blocks.filter((b) => b.lines.length) };
}

function coverItems(c: MyApplicationDocuments["coverLetter"]): { q: string; a: string }[] {
  const items = (Array.isArray(c?.items) ? c!.items : []) as Record<string, unknown>[];
  return items.map((it) => ({ q: str(it.prompt) || str(it.question) || str(it.title), a: str(it.answer) || str(it.content) })).filter((x) => x.a);
}

export function DocumentsSheet({ app, onClose }: { app: MyApplication; onClose: () => void }) {
  const t = usePlatformT();
  const [docs, setDocs] = useState<MyApplicationDocuments | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<"resume" | "cover">("resume");
  useEffect(() => {
    let alive = true;
    getMyApplicationDocuments(app.id)
      .then((d) => alive && setDocs(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [app.id]);
  const resume = docs ? resumeBlocks(t, docs.resume) : null;
  const cover = docs ? coverItems(docs.coverLetter) : null;
  const empty = (msg: string) => <p className="py-10 text-center text-[15px] leading-[1.6] text-[color:var(--v2-faint)]">{msg}</p>;

  return (
    <Sheet tall title={t("제출한 서류", "Documents you sent", "已提交的材料", "Hồ sơ đã gửi", "提出した書類", "Dokumen yang dikirim")} subtitle={[app.partnerOrganizationName, app.positionTitle].filter(Boolean).join(" · ")} onClose={onClose}>
      <p className="text-[13px] text-[color:var(--v2-faint)]">{t("지원할 때 회사에 보낸 그대로예요. 지금 고쳐도 여기엔 바뀌지 않아요.", "Exactly what you sent when you applied. Editing now won't change this.", "这是投递时发给公司的原样内容，现在修改也不会变。", "Đúng như khi bạn nộp. Sửa bây giờ không thay đổi bản này.", "応募時に会社へ送ったままです。今直してもここは変わりません。", "Persis seperti saat melamar. Mengubah sekarang tidak mengubah ini.")}</p>
      <div className="mt-4 flex gap-2">
        {(
          [
            ["resume", t("이력서", "Resume", "简历", "CV", "履歴書", "CV")],
            ["cover", t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")]
          ] as const
        ).map(([k, label]) => (
          <button key={k} type="button" onClick={() => setTab(k)} aria-pressed={tab === k} className={`inline-flex h-10 items-center rounded-full px-4 text-[15px] font-semibold transition ${tab === k ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {error ? (
          empty(t("서류를 불러오지 못했어요.", "Couldn't load the documents.", "无法加载材料。", "Không tải được hồ sơ.", "書類を読み込めませんでした。", "Gagal memuat dokumen."))
        ) : !docs ? (
          <RowsSkeleton count={4} thumb={false} />
        ) : tab === "resume" ? (
          !resume || (!resume.blocks.length && !resume.summary) ? (
            empty(t("이 지원에는 이력서 기록이 없어요.", "No resume was saved with this application.", "此申请没有简历记录。", "Đơn này không lưu CV.", "この応募には履歴書の記録がありません。", "Tidak ada CV pada lamaran ini."))
          ) : (
            <div className="flex flex-col gap-6">
              {resume.name || resume.summary ? (
                <div>
                  {resume.name ? <p className="text-[18px] font-bold text-[color:var(--v2-ink)]">{resume.name}</p> : null}
                  {resume.summary ? <p className="mt-1 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">{resume.summary}</p> : null}
                </div>
              ) : null}
              {resume.blocks.map((b) => (
                <section key={b.title}>
                  <h3 className="text-[15px] font-bold text-[color:var(--v2-ink)]">{b.title}</h3>
                  <ul className="mt-2">
                    {b.lines.map((l, i) => (
                      <li key={i} className="border-b border-[color:var(--v2-band)] py-3 last:border-b-0">
                        <p className="text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink-2)]">{l.head}</p>
                        {l.sub ? <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-[1.65] text-[color:var(--v2-muted)]">{l.sub}</p> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )
        ) : !cover?.length ? (
          empty(t("이 지원에는 자기소개서를 보내지 않았어요.", "No cover letter was sent with this application.", "此申请没有提交自我介绍。", "Đơn này không gửi thư giới thiệu.", "この応募では自己紹介書を送っていません。", "Tidak ada surat lamaran pada lamaran ini."))
        ) : (
          <ol className="flex flex-col gap-6">
            {cover.map((c, i) => (
              <li key={i}>
                <p className="text-[15px] font-bold leading-[1.5] text-[color:var(--v2-ink)]">
                  <span className="mr-1.5 text-[color:var(--v2-accent)]">Q{i + 1}</span>
                  {c.q}
                </p>
                <p className="mt-2 whitespace-pre-wrap border-l-2 border-[color:var(--v2-line)] pl-3.5 text-[15px] leading-[1.75] text-[color:var(--v2-ink-3)]">{c.a}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Sheet>
  );
}

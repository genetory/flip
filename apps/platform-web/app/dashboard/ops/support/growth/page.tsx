"use client";

// 그로스 — 학생을 키우는 곳. 성장 지표(신규·접속·이력서·AI 사용) · 키울 학생 묶음(세그먼트) ·
// 묶음에 인앱 알림(+이메일, +포인트) 보내기 · 보낸 캠페인이 사람을 다시 데려왔는지.
// '접속'은 포인트 지갑의 마지막 적립일(로그인해 화면을 열면 갱신)로 잰다. 운영팀이 대신 만든 일괄 등록 계정은 빠진다.
import { useCallback, useEffect, useState } from "react";
import { BarList, Chips, Field, KpiGrid, Modal, PageHead, card, day, dt, pts, useOpsApi } from "../../system/_billing/shared";

type SegmentKey = "new_7d" | "no_resume" | "no_ai" | "no_interview" | "dormant_7d" | "low_points";
type Campaign = { id: string; segment: SegmentKey; title: string; message: string; linkPath: string | null; email: boolean; points: number; sentCount: number; createdAt: string; returned: number };
type Overview = {
  pointsEnabled: boolean;
  kpi: { students: number; new7: number; newPrev7: number; active1: number; active7: number; withResume: number; usedAi: number };
  segments: { key: SegmentKey; count: number }[];
  campaigns: Campaign[];
};
type Retention = {
  active: { dau: number; wau: number; mau: number };
  daily: { d: string; n: number }[];
  rolling: { day: number; eligible: number; returned: number }[];
  cohorts: { week: string; size: number; weeks: (number | null)[] }[];
  frequency: { bucket: string; n: number }[];
};
type Review = {
  headline: string;
  score: number;
  grade: "좋음" | "보통" | "주의" | "위험";
  strengths: string[];
  problems: { title: string; evidence: string }[];
  actions: { priority: number; title: string; why: string; how: string; segment: SegmentKey | "none"; metric: string; effort: "작음" | "보통" | "큼" }[];
  watch: string[];
  caveats: string[];
};
type Member = { userId: string; email: string; name: string | null; nationality: string | null; joinedAt: string; emailOn: boolean; balance: number | null; lastSeenDaysAgo: number | null; resumes: number };

// 묶음마다 — 무엇을 하려는지, 보낼 말의 기본값. 링크는 학생 화면 주소.
const SEGMENT: Record<SegmentKey, { title: string; goal: string; desc: string; msgTitle: string; msg: string; link: string }> = {
  new_7d: { title: "가입 7일 이내", goal: "첫 단계", desc: "막 가입한 학생 — 첫 이력서까지 이끌어요.", msgTitle: "첫 이력서를 만들어 볼까요?", msg: "AI가 질문 몇 개로 이력서 초안을 만들어 드려요. 5분이면 기업이 볼 수 있는 이력서가 돼요.", link: "/talent/career/resume/editor" },
  no_resume: { title: "이력서 없음", goal: "활성화", desc: "가입했지만 이력서를 아직 안 만든 학생.", msgTitle: "이력서가 있어야 기업이 찾아와요", msg: "이력서를 만들면 인재 검색에 올라가 기업이 먼저 연락할 수 있어요. AI가 초안을 도와드려요.", link: "/talent/career/resume/editor" },
  no_ai: { title: "AI 기능 안 써 봄", goal: "활성화", desc: "이력서는 있지만 AI(점검·자소서·면접)를 한 번도 안 쓴 학생.", msgTitle: "내 이력서, AI로 점검해 보세요", msg: "막연한 표현과 빠진 내용을 AI가 짚어 드려요. 한 번만 받아 봐도 서류가 달라져요.", link: "/talent/career" },
  no_interview: { title: "모의 면접 안 해 봄", goal: "깊게 쓰기", desc: "이력서는 있지만 모의 면접 답변을 한 번도 안 받아 본 학생.", msgTitle: "면접 첫 질문, 미리 답해 볼까요?", msg: "내 이력서로 나올 질문을 AI가 뽑아 주고, 답하면 바로 피드백을 드려요.", link: "/talent/career/interviews" },
  dormant_7d: { title: "7일 넘게 안 들어옴", goal: "다시 오기", desc: "가입한 지 7일이 지났고 최근 7일 동안 접속이 없는 학생.", msgTitle: "새로 올라온 공고를 확인해 보세요", msg: "지원할 수 있는 새 공고가 올라왔어요. 들어오면 오늘의 포인트도 받을 수 있어요.", link: "/talent/jobs" },
  low_points: { title: "포인트 20P 미만", goal: "전환", desc: "AI 포인트가 거의 남지 않은 학생 — 충전이나 다시 쓰기로 이어 가요.", msgTitle: "AI 포인트를 채워 보세요", msg: "포인트가 얼마 안 남았어요. 매일 접속하면 +20P, 필요하면 충전해서 바로 이어 쓸 수 있어요.", link: "/talent/payments" }
};
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "–");

export default function OpsGrowthPage() {
  const api = useOpsApi();
  const [data, setData] = useState<Overview | null>(null);
  const [ret, setRet] = useState<Retention | null>(null);
  const [error, setError] = useState("");
  const [members, setMembers] = useState<{ key: SegmentKey; items: Member[] | null } | null>(null);
  const [sending, setSending] = useState<SegmentKey | null>(null);
  // AI 진단 — 버튼을 눌렀을 때만 부른다(자동으로 가져오지 않음)
  const [review, setReview] = useState<{ review: Review; generatedAt: string; model: string } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [reviewErr, setReviewErr] = useState("");
  const askReview = async () => {
    setReviewing(true);
    setReviewErr("");
    try {
      setReview(await api.call<{ review: Review; generatedAt: string; model: string }>("/ops/growth/ai-review", { method: "POST", body: {} }));
    } catch (e) {
      setReviewErr(e instanceof Error ? e.message : "AI 진단을 받지 못했어요.");
    } finally {
      setReviewing(false);
    }
  };

  const load = useCallback(async () => {
    try {
      setError("");
      const [o, r] = await Promise.all([api.call<Overview>("/ops/growth/overview"), api.call<Retention>("/ops/growth/retention").catch(() => null)]);
      setData(o);
      setRet(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    }
  }, [api]);
  useEffect(() => {
    // 처음 한 번 서버에서 읽어 온다(응답이 오면 상태를 채운다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const openMembers = async (key: SegmentKey) => {
    setMembers({ key, items: null });
    try {
      const r = await api.call<{ items: Member[] }>(`/ops/growth/segments/${key}`);
      setMembers({ key, items: r.items });
    } catch {
      setMembers({ key, items: [] });
    }
  };

  const k = data?.kpi;
  const countOf = (key: SegmentKey) => data?.segments.find((s) => s.key === key)?.count ?? 0;
  const delta = k ? k.new7 - k.newPrev7 : 0;

  return (
    <section className="ops-content-section">
      <PageHead
        title="그로스"
        desc="학생이 가입 → 이력서 → AI 사용 → 다시 방문으로 이어지게 키워요. 막힌 단계의 학생 묶음을 골라 알림을 보내고, 몇 명이 다시 들어왔는지 확인해요."
        right={
          <>
            <button type="button" className="ops-btn" style={{ height: 36, padding: "0 14px" }} onClick={() => void load()}>
              새로고침
            </button>
            <button type="button" className="ops-btn ops-btn-primary" style={{ height: 36, padding: "0 16px" }} onClick={() => void askReview()} disabled={reviewing}>
              {reviewing ? "AI가 분석하는 중…" : review ? "AI 진단 다시 받기" : "AI 진단 받기"}
            </button>
          </>
        }
      />
      {error ? <p className="ops-form-error">{error}</p> : null}
      {reviewErr ? <p className="ops-form-error">{reviewErr}</p> : null}
      {reviewing && !review ? (
        <section style={{ ...card, marginBottom: 24 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)" }}>지금 지표(가입·접속·리텐션·묶음·캠페인·결제·AI 사용)를 모아 AI가 진단하고 있어요. 20초쯤 걸려요.</p>
        </section>
      ) : null}
      {review ? <ReviewCard data={review} onSend={(k) => setSending(k)} /> : null}

      <KpiGrid
        items={[
          { label: "보낼 수 있는 학생", value: k ? k.students.toLocaleString() : "–", sub: "활성 학생 · 일괄 등록 계정 제외", tone: "blue" },
          { label: "이번 주 신규 가입", value: k ? k.new7.toLocaleString() : "–", sub: k ? `지난주 ${k.newPrev7.toLocaleString()} · ${delta >= 0 ? "+" : ""}${delta}` : undefined, tone: "green" },
          { label: "7일 안에 접속", value: k ? k.active7.toLocaleString() : "–", sub: k ? `오늘 ${k.active1.toLocaleString()}명 · 전체의 ${pct(k.active7, k.students)}` : undefined, tone: "green" },
          { label: "이력서 만든 학생", value: k ? pct(k.withResume, k.students) : "–", sub: k ? `${k.withResume.toLocaleString()}명` : undefined, tone: "amber" },
          { label: "AI 써 본 학생", value: k ? pct(k.usedAi, k.students) : "–", sub: k ? `${k.usedAi.toLocaleString()}명` : undefined, tone: "amber" }
        ]}
      />

      <section style={{ ...card, marginBottom: 28 }}>
        <h2 className="ops-section-title">어디서 멈추나요</h2>
        <BarList
          rows={
            k
              ? [
                  { label: "가입", value: k.students },
                  { label: "이력서 만듦", value: k.withResume, sub: pct(k.withResume, k.students) },
                  { label: "AI 써 봄", value: k.usedAi, sub: pct(k.usedAi, k.students) },
                  { label: "최근 7일 접속", value: k.active7, sub: pct(k.active7, k.students) }
                ]
              : []
          }
          format={(n) => `${n.toLocaleString()}명`}
        />
      </section>

      <RetentionSection ret={ret} />

      <h2 className="ops-section-title">키울 학생 묶음</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12, marginBottom: 28 }}>
        {(Object.keys(SEGMENT) as SegmentKey[]).map((key) => {
          const sg = SEGMENT[key];
          const n = countOf(key);
          const disabled = key === "low_points" && data && !data.pointsEnabled;
          return (
            <div key={key} style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{sg.title}</p>
                  <p style={{ margin: "3px 0 0", fontSize: 12, lineHeight: 1.5, color: "var(--ink-faint)" }}>{sg.desc}</p>
                </div>
                <span className="ops-pill ops-pill-blue" style={{ flex: "none" }}>{sg.goal}</span>
              </div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {data ? n.toLocaleString() : "–"}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-faint)" }}>명</span>
              </p>
              <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                <button type="button" className="ops-btn" style={{ height: 34, padding: "0 14px" }} onClick={() => void openMembers(key)} disabled={!n}>
                  명단 보기
                </button>
                <button type="button" className="ops-btn ops-btn-primary" style={{ height: 34, padding: "0 14px" }} onClick={() => setSending(key)} disabled={!n || Boolean(disabled)}>
                  알림 보내기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h2 className="ops-section-title">보낸 캠페인</h2>
      <div className="ops-table-card">
        <table>
          <colgroup>
            <col style={{ width: 140 }} />
            <col style={{ width: 150 }} />
            <col />
            <col style={{ width: 90 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 150 }} />
          </colgroup>
          <thead>
            <tr>
              <th>보낸 날</th>
              <th>묶음</th>
              <th>내용</th>
              <th style={{ textAlign: "right" }}>보낸 수</th>
              <th>함께 보낸 것</th>
              <th style={{ textAlign: "right" }}>다시 들어옴</th>
            </tr>
          </thead>
          <tbody>
            {!data ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 28 }}>불러오는 중…</td>
              </tr>
            ) : !data.campaigns.length ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 28 }}>아직 보낸 캠페인이 없어요. 위 묶음에서 &lsquo;알림 보내기&rsquo;로 시작하세요.</td>
              </tr>
            ) : (
              data.campaigns.map((c) => (
                <tr key={c.id}>
                  <td><span className="ops-row-strong">{dt(c.createdAt)}</span></td>
                  <td>{SEGMENT[c.segment]?.title ?? c.segment}</td>
                  <td>
                    <div className="ops-row-strong">{c.title}</div>
                    <div className="ops-row-sub">{c.message}</div>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{c.sentCount.toLocaleString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <span className="ops-pill ops-pill-gray">알림</span>
                      {c.email ? <span className="ops-pill ops-pill-gray">이메일</span> : null}
                      {c.points ? <span className="ops-pill ops-pill-amber">{pts(c.points)}</span> : null}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    <span className="ops-row-strong" style={{ fontWeight: 700 }}>{c.returned.toLocaleString()}명</span>
                    <div className="ops-row-sub">{pct(c.returned, c.sentCount)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 10, fontSize: 12, lineHeight: 1.6, color: "var(--ink-faint)" }}>
        다시 들어옴 = 받은 학생 중 보낸 다음 날 이후 접속한 학생 수예요. 이메일은 알림 수신을 켠 학생에게만 가요. 광고성 내용은 수신 동의를 받은 학생에게만 보내 주세요.
      </p>

      {members ? (
        <Modal title={`${SEGMENT[members.key].title} · 명단`} sub="최근 가입순 50명까지" onClose={() => setMembers(null)} size="lg">
          {members.items === null ? (
            <p className="ops-empty-card" style={{ padding: "24px 0" }}>불러오는 중…</p>
          ) : !members.items.length ? (
            <p className="ops-empty-card" style={{ padding: "24px 0" }}>해당하는 학생이 없어요.</p>
          ) : (
            <div className="ops-table-card">
              <table>
                <colgroup>
                  <col />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 110 }} />
                  <col style={{ width: 90 }} />
                  <col style={{ width: 90 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>학생</th>
                    <th>가입</th>
                    <th>마지막 접속</th>
                    <th style={{ textAlign: "right" }}>포인트</th>
                    <th>이메일 알림</th>
                  </tr>
                </thead>
                <tbody>
                  {members.items.map((m) => (
                    <tr key={m.userId}>
                      <td>
                        <div className="ops-row-strong">{m.name || m.email}</div>
                        <div className="ops-row-sub">{[m.name ? m.email : "", m.nationality].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td><span className="ops-row-sub">{day(m.joinedAt)}</span></td>
                      <td><span className="ops-row-sub">{m.lastSeenDaysAgo === null ? "없음" : m.lastSeenDaysAgo === 0 ? "오늘" : `${m.lastSeenDaysAgo}일 전`}</span></td>
                      <td style={{ textAlign: "right" }}>{m.balance === null ? <span className="ops-row-sub">-</span> : pts(m.balance)}</td>
                      <td>{m.emailOn ? <span className="ops-pill ops-pill-green">받음</span> : <span className="ops-pill ops-pill-gray">꺼 둠</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      ) : null}

      {sending ? (
        <SendModal
          segment={sending}
          count={countOf(sending)}
          pointsEnabled={Boolean(data?.pointsEnabled)}
          onClose={() => setSending(null)}
          onSent={() => {
            setSending(null);
            void load();
          }}
        />
      ) : null}
    </section>
  );
}

function SendModal({ segment, count, pointsEnabled, onClose, onSent }: { segment: SegmentKey; count: number; pointsEnabled: boolean; onClose: () => void; onSent: () => void }) {
  const api = useOpsApi();
  const sg = SEGMENT[segment];
  const [title, setTitle] = useState(sg.msgTitle);
  const [message, setMessage] = useState(sg.msg);
  const [link, setLink] = useState(sg.link);
  const [channel, setChannel] = useState<"inapp" | "email">("inapp");
  const [points, setPoints] = useState("0");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const email = channel === "email";
  const limit = email ? 500 : 2000;
  const willSend = Math.min(count, limit);
  const p = Math.max(0, Math.floor(Number(points)) || 0);

  const submit = async () => {
    if (title.trim().length < 2 || message.trim().length < 2) return setErr("제목과 내용을 적어 주세요.");
    if (link && !link.startsWith("/")) return setErr("링크는 /talent/… 처럼 사이트 안 주소로 적어 주세요.");
    if (!window.confirm(`${sg.title} ${willSend.toLocaleString()}명에게 ${email ? "알림과 이메일을" : "알림을"} 보낼까요?${p ? `\n한 명마다 ${pts(p)}를 넣어 드려요(총 ${pts(p * willSend)}).` : ""}`)) return;
    setBusy(true);
    setErr("");
    try {
      const r = await api.call<{ sentCount: number; capped: boolean }>("/ops/growth/campaigns", { method: "POST", body: { segment, title: title.trim(), message: message.trim(), ...(link.trim() ? { linkPath: link.trim() } : {}), email, points: p } });
      window.alert(`${r.sentCount.toLocaleString()}명에게 보내기 시작했어요.${r.capped ? ` 한 번에 ${limit.toLocaleString()}명까지라 나머지는 다음에 보내 주세요.` : ""}`);
      onSent();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "보내지 못했어요.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`알림 보내기 · ${sg.title}`}
      sub={`${willSend.toLocaleString()}명에게 보내요${count > limit ? ` (전체 ${count.toLocaleString()}명 중 최근 가입순)` : ""}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ops-btn" style={{ height: 38, padding: "0 16px" }} onClick={onClose} disabled={busy}>
            취소
          </button>
          <button type="button" className="ops-btn ops-btn-primary" style={{ height: 38, padding: "0 18px" }} onClick={() => void submit()} disabled={busy}>
            {busy ? "보내는 중…" : `${willSend.toLocaleString()}명에게 보내기`}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="보내는 방법">
          <Chips
            value={channel}
            onChange={setChannel}
            options={[
              { key: "inapp", label: "앱 안 알림" },
              { key: "email", label: "알림 + 이메일" }
            ]}
          />
        </Field>
        <Field label="제목" hint="알림 목록·메일 제목에 보여요(60자까지)">
          <input className="ops-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
        </Field>
        <Field label="내용" hint="300자까지">
          <textarea className="ops-input" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={300} />
        </Field>
        <Field label="누르면 갈 곳" hint="사이트 안 주소(예: /talent/jobs). 비우면 알림만 보여요.">
          <input className="ops-input" value={link} onChange={(e) => setLink(e.target.value)} placeholder="/talent/…" />
        </Field>
        {pointsEnabled ? (
          <Field label="함께 넣어 줄 포인트(선택)" hint="한 명마다 넣어 드려요 · 학생 포인트 내역엔 '이벤트 선물'로 보여요">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {[0, 50, 100, 200].map((v) => (
                <button key={v} type="button" className={`ops-filter-chip ${p === v ? "is-active" : ""}`} onClick={() => setPoints(String(v))}>
                  {v ? pts(v) : "없음"}
                </button>
              ))}
              <input className="ops-input" style={{ width: 110 }} inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value.replace(/[^\d]/g, ""))} aria-label="포인트 직접 입력" />
            </div>
          </Field>
        ) : null}
        <div style={{ borderRadius: 12, background: "var(--surface-2)", padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: "var(--ink-faint)" }}>학생에게 이렇게 보여요</p>
          <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{title || "제목"}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--ink-soft)" }}>{message || "내용"}</p>
        </div>
        {err ? <p className="ops-form-error" style={{ margin: 0 }}>{err}</p> : null}
      </div>
    </Modal>
  );
}

// ── 리텐션 ──────────────────────────────────────────────
// 방문 = 로그인한 채 사이트를 연 날(로그인 기록 기준, KST). 가입한 날도 방문으로 친다.
const FREQ_LABEL: Record<string, string> = { "1": "하루만", "2-3": "2~3일", "4-7": "4~7일", "8-14": "8~14일", "15+": "15일 이상" };

function heat(p: number | null): string {
  if (p === null) return "transparent";
  // 진할수록 많이 돌아옴 — 파랑 투명도
  const a = Math.max(0.06, Math.min(1, p / 100));
  return `rgba(11, 70, 232, ${a.toFixed(2)})`;
}

function RetentionSection({ ret }: { ret: Retention | null }) {
  const a = ret?.active;
  const roll = (n: number) => ret?.rolling.find((r) => r.day === n);
  const rate = (n: number) => {
    const r = roll(n);
    return r && r.eligible ? Math.round((r.returned / r.eligible) * 100) : null;
  };
  // 최근 30일 — 서버가 비는 날도 0 으로 채워 준다
  const days = ret?.daily ?? [];
  const max = Math.max(1, ...days.map((x) => x.n));
  const totalFreq = (ret?.frequency ?? []).reduce((n, f) => n + f.n, 0);

  return (
    <>
      <h2 className="ops-section-title">리텐션 · 다시 들어오나요</h2>
      <KpiGrid
        items={[
          { label: "오늘 접속", value: a ? a.dau.toLocaleString() : "–", sub: "DAU", tone: "blue" },
          { label: "7일 안에 접속", value: a ? a.wau.toLocaleString() : "–", sub: "WAU", tone: "blue" },
          { label: "30일 안에 접속", value: a ? a.mau.toLocaleString() : "–", sub: "MAU", tone: "blue" },
          { label: "고착도", value: a && a.mau ? `${Math.round((a.dau / a.mau) * 100)}%` : "–", sub: "오늘 접속 ÷ 30일 접속 (DAU/MAU)", tone: "amber" },
          ...[1, 7, 30].map((n) => ({
            label: `${n}일 뒤에도 다시 옴`,
            value: rate(n) === null ? "–" : `${rate(n)}%`,
            sub: roll(n) ? `${roll(n)!.returned.toLocaleString()} / ${roll(n)!.eligible.toLocaleString()}명 · 가입 ${n}일 지난 학생 중` : undefined,
            tone: "green" as const
          }))
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 14 }}>
        <section style={card}>
          <h3 className="ops-section-title">최근 30일 날짜별 접속</h3>
          {!ret ? (
            <p className="ops-empty-card" style={{ padding: "24px 0" }}>불러오는 중…</p>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
                {days.map((x) => (
                  <div key={x.d} title={`${x.d} · ${x.n.toLocaleString()}명`} style={{ flex: 1, height: `${(x.n / max) * 100}%`, minHeight: x.n ? 2 : 0, borderRadius: 3, background: "var(--accent)" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "var(--ink-faint)" }}>
                <span>{days[0].d.slice(5)}</span>
                <span>가장 많은 날 {max.toLocaleString()}명</span>
                <span>오늘</span>
              </div>
            </>
          )}
        </section>
        <section style={card}>
          <h3 className="ops-section-title">최근 30일 동안 며칠 들어왔나요</h3>
          <BarList rows={(ret?.frequency ?? []).map((f) => ({ label: FREQ_LABEL[f.bucket] ?? f.bucket, value: f.n, sub: totalFreq ? `${Math.round((f.n / totalFreq) * 100)}%` : undefined }))} format={(n) => `${n.toLocaleString()}명`} />
        </section>
      </div>

      <section style={{ ...card, marginBottom: 28 }}>
        <h3 className="ops-section-title">가입 주별 리텐션(코호트)</h3>
        <p style={{ margin: "-6px 0 12px", fontSize: 12, color: "var(--ink-faint)" }}>그 주에 가입한 학생 중 몇 %가 N주째에 다시 들어왔는지예요. 0주차는 가입한 주. 진할수록 많이 돌아왔어요.</p>
        {!ret ? (
          <p className="ops-empty-card" style={{ padding: "24px 0" }}>불러오는 중…</p>
        ) : !ret.cohorts.length ? (
          <p className="ops-empty-card" style={{ padding: "24px 0" }}>최근 8주 동안 가입한 학생이 없어요.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3, fontSize: 12, minWidth: 640 }}>
              <thead>
                <tr style={{ color: "var(--ink-faint)" }}>
                  <th style={{ textAlign: "left", fontWeight: 600, padding: "4px 6px" }}>가입 주</th>
                  <th style={{ textAlign: "right", fontWeight: 600, padding: "4px 6px" }}>가입</th>
                  {Array.from({ length: 8 }, (_, i) => (
                    <th key={i} style={{ fontWeight: 600, padding: "4px 6px" }}>{i}주차</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ret.cohorts.map((c) => (
                  <tr key={c.week}>
                    <td style={{ padding: "6px", color: "var(--ink)", whiteSpace: "nowrap" }}>{c.week.slice(5).replace("-", "/")} 주</td>
                    <td style={{ padding: "6px", textAlign: "right", color: "var(--ink-soft)", fontVariantNumeric: "tabular-nums" }}>{c.size.toLocaleString()}</td>
                    {c.weeks.map((n, i) => {
                      const p = n === null || !c.size ? null : Math.round((n / c.size) * 100);
                      return (
                        <td key={i} title={n === null ? "아직 안 옴" : `${n}명`} style={{ padding: "6px 4px", textAlign: "center", borderRadius: 6, background: heat(p), color: p !== null && p >= 55 ? "#fff" : "var(--ink)", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                          {p === null ? "" : `${p}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// ── AI 진단 결과 ─────────────────────────────────────────
const GRADE_TONE: Record<Review["grade"], string> = { 좋음: "ops-pill ops-pill-green", 보통: "ops-pill ops-pill-blue", 주의: "ops-pill ops-pill-amber", 위험: "ops-pill ops-pill-red" };

function ReviewCard({ data, onSend }: { data: { review: Review; generatedAt: string; model: string }; onSend: (k: SegmentKey) => void }) {
  const r = data.review;
  const actions = [...r.actions].sort((a, b) => a.priority - b.priority);
  const list = (items: string[]) => (
    <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6, fontSize: 13, lineHeight: 1.6, color: "var(--ink-soft)" }}>
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
  return (
    <section style={{ ...card, marginBottom: 28, display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div style={{ flex: "none", width: 84, height: 84, borderRadius: 18, background: "var(--accent-soft)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: "var(--accent-ink)", fontVariantNumeric: "tabular-nums" }}>{r.score}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-ink)" }}>/ 100</span>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className={GRADE_TONE[r.grade] ?? "ops-pill ops-pill-gray"}>{r.grade}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>AI 진단 · {dt(data.generatedAt)}</span>
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 17, fontWeight: 800, lineHeight: 1.45, color: "var(--ink)" }}>{r.headline}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div>
          <h3 className="ops-section-title">잘 되고 있는 점</h3>
          {r.strengths.length ? list(r.strengths) : <p className="ops-row-sub">-</p>}
        </div>
        <div>
          <h3 className="ops-section-title">가장 큰 문제</h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
            {r.problems.map((p, i) => (
              <li key={i} style={{ borderRadius: 12, background: "var(--danger-soft)", padding: "10px 12px" }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{p.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: 1.55, color: "var(--ink-soft)" }}>{p.evidence}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <h3 className="ops-section-title">이번 주 할 일</h3>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {actions.map((a) => (
            <li key={a.priority + a.title} style={{ border: "1px solid var(--line)", borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12 }}>
              <span style={{ flex: "none", width: 26, height: 26, borderRadius: 999, background: "var(--accent)", color: "#fff", fontSize: 13, fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{a.priority}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{a.title}</p>
                  <span className="ops-pill ops-pill-gray">노력 {a.effort}</span>
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                  <b style={{ color: "var(--ink)" }}>왜</b> · {a.why}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.6, color: "var(--ink-soft)" }}>
                  <b style={{ color: "var(--ink)" }}>어떻게</b> · {a.how}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.6, color: "var(--ink-faint)" }}>확인할 지표 · {a.metric}</p>
              </div>
              {a.segment !== "none" && SEGMENT[a.segment] ? (
                <button type="button" className="ops-btn ops-btn-primary" style={{ flex: "none", alignSelf: "center", height: 34, padding: "0 14px" }} onClick={() => onSend(a.segment as SegmentKey)} title={`'${SEGMENT[a.segment].title}' 묶음에 알림 보내기`}>
                  {SEGMENT[a.segment].title}에 보내기
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        <div>
          <h3 className="ops-section-title">다음 주에 볼 지표</h3>
          {list(r.watch)}
        </div>
        {r.caveats.length ? (
          <div>
            <h3 className="ops-section-title">해석할 때 주의</h3>
            {list(r.caveats)}
          </div>
        ) : null}
      </div>
      <p style={{ margin: 0, fontSize: 11.5, color: "var(--ink-faint)" }}>AI가 위 지표만 보고 쓴 제안이에요. 실행 전에 숫자를 한 번 확인해 주세요. 진단 결과는 저장되지 않아요(새로 고치면 사라져요).</p>
    </section>
  );
}

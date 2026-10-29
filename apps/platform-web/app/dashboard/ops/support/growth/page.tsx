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
  const [error, setError] = useState("");
  const [members, setMembers] = useState<{ key: SegmentKey; items: Member[] | null } | null>(null);
  const [sending, setSending] = useState<SegmentKey | null>(null);

  const load = useCallback(async () => {
    try {
      setError("");
      setData(await api.call<Overview>("/ops/growth/overview"));
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
          <button type="button" className="ops-btn" style={{ height: 36, padding: "0 14px" }} onClick={() => void load()}>
            새로고침
          </button>
        }
      />
      {error ? <p className="ops-form-error">{error}</p> : null}

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

/**
 * talent ↔ partner E2E 스모크 테스트 — 실행 중인 API(기본 http://localhost:4000)에 대해
 * 지원/상태동기화/연락처게이팅, 모의면접→제안→수락→연락처, 인재풀 시나리오를 검증한다.
 *
 * 실행: cd apps/api && API_BASE=http://localhost:4000 npx tsx scripts/smoke-talent-partner.mts
 * 사전: dev 서버 기동 + 시드 계정(student@test.com / partner@test.com, 비번 !Test1234).
 */
const BASE = process.env.API_BASE ?? "http://localhost:4000";
const PW = process.env.SMOKE_PW ?? "!Test1234";

let pass = 0;
let fail = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function login(email: string): Promise<{ token: string; userId: string }> {
  const r = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: PW }) });
  const d = (await r.json()) as { accessToken?: string; user?: { id?: string } };
  if (!d.accessToken || !d.user?.id) throw new Error(`login failed for ${email}`);
  return { token: d.accessToken, userId: d.user.id };
}
async function api(token: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: any }> {
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json: any = null;
  try {
    json = await r.json();
  } catch {
    // ignore non-json
  }
  return { status: r.status, json };
}
const enc = encodeURIComponent;

async function main() {
  const student = await login("student@test.com");
  const partner = await login("partner@test.com");

  // 파트너의 OPEN 공고 하나(모의면접 있는 것 우선).
  const pos = await api(partner.token, "GET", "/partner/positions");
  const openPositions = (pos.json?.items ?? []).filter((p: any) => p.status === "OPEN");
  const withMock = openPositions.find((p: any) => (p.mockInterviewQuestions ?? []).length > 0) ?? openPositions[0];
  if (!withMock) throw new Error("no OPEN position in partner org");
  const P: string = withMock.id;
  const applicantId = `${student.userId}:${P}`;
  console.log(`\n[setup] position=${withMock.title} (${P})`);

  // ─────────────────────────────────────────────────────────────
  console.log("\n[A] 지원 라이프사이클 (상태 동기화 + 연락처 게이팅)");
  await api(student.token, "DELETE", `/members/me/positions/${enc(P)}/apply`); // 클린 스타트
  const applyRes = await api(student.token, "POST", `/members/me/positions/${enc(P)}/apply`);
  check("학생 지원 성공", applyRes.status < 300 && applyRes.json?.ok !== false, `status ${applyRes.status}`);

  let list = await api(partner.token, "GET", "/partner/applicants");
  let item = (list.json?.items ?? []).find((a: any) => a.id === applicantId);
  check("파트너 목록에 지원자 노출", Boolean(item), "applicant id not found");
  check("초기 상태 APPLIED", item?.status === "APPLIED", `status=${item?.status}`);
  check("연락처 게이팅(이메일 비공개)", item ? item.email == null : false, `email=${item?.email}`);

  const patchRes = await api(partner.token, "PATCH", `/partner/applicants/${enc(applicantId)}`, { status: "INTERVIEW" });
  check("파트너 상태 변경 INTERVIEW 성공", patchRes.json?.ok === true, `status ${patchRes.status}`);

  const apps = await api(student.token, "GET", "/members/me/applications");
  const myApp = (apps.json?.items ?? []).find((a: any) => a.positionId === P);
  check("학생 지원현황에 INTERVIEW 반영", myApp?.status === "INTERVIEW", `status=${myApp?.status}`);

  const notifs = await api(student.token, "GET", "/members/me/notifications");
  const statusNotif = (notifs.json?.items ?? []).find((n: any) => n.type === "APPLICATION_STATUS_CHANGED");
  check("학생에게 상태변경 알림 도착", Boolean(statusNotif), "no APPLICATION_STATUS_CHANGED");

  const detail = await api(partner.token, "GET", `/partner/applicants/${enc(applicantId)}`);
  check("면접 단계에서 연락처 공개", Boolean(detail.json?.item?.email) && detail.json?.item?.contactUnlocked === true, `email=${detail.json?.item?.email}`);

  await api(student.token, "DELETE", `/members/me/positions/${enc(P)}/apply`);
  list = await api(partner.token, "GET", "/partner/applicants");
  item = (list.json?.items ?? []).find((a: any) => a.id === applicantId);
  check("지원 취소 → 파트너 목록에서 제거(철회)", !item, "still present after cancel");
  const apps2 = await api(student.token, "GET", "/members/me/applications");
  const myApp2 = (apps2.json?.items ?? []).find((a: any) => a.positionId === P);
  check("학생 지원현황도 철회/제거로 일치", !myApp2 || myApp2.status === "WITHDRAWN", `status=${myApp2?.status}`);

  // ─────────────────────────────────────────────────────────────
  console.log("\n[B] 모의면접 → 제안 → 수락 → 연락처 교환");
  const practice = await api(student.token, "POST", `/members/me/mock-interviews/${enc(P)}/practice`, { question: "자기소개를 해주세요", answer: "스모크 테스트 답변입니다.", score: 88 });
  check("학생 모의면접 연습 기록", practice.status < 300 && practice.json?.ok !== false, `status ${practice.status}`);

  const parts = await api(partner.token, "GET", `/partner/positions/${enc(P)}/mock-interview-participants`);
  const partItem = (parts.json?.items ?? []).find((m: any) => m.userId === student.userId);
  check("파트너 모의면접 참여자에 학생 노출", Boolean(partItem), "participant not found");

  const propose = await api(partner.token, "POST", `/partner/positions/${enc(P)}/mock-interview-candidates/${enc(student.userId)}/propose`, { message: "함께 얘기 나눠요" });
  check("파트너 제안 성공", propose.status < 300 && propose.json?.ok !== false, `status ${propose.status}`);

  const conns = await api(student.token, "GET", "/members/me/connections");
  const conn = (conns.json?.items ?? []).find((c: any) => c.status === "PENDING") ?? (conns.json?.items ?? [])[0];
  check("학생 인박스에 연결/제안 요청 도착", Boolean(conn), "no connection in inbox");
  if (conn) {
    const respond = await api(student.token, "POST", `/members/me/connections/${enc(conn.id)}/respond`, { action: "accept" });
    check("학생 수락 성공", respond.status < 300 && respond.json?.ok !== false, `status ${respond.status}`);
  }

  const parts2 = await api(partner.token, "GET", `/partner/positions/${enc(P)}/mock-interview-participants/${enc(student.userId)}`);
  check("파트너 참여자 상세에 수락 상태 반영", parts2.json?.item?.connectionStatus === "ACCEPTED", `status=${parts2.json?.item?.connectionStatus}`);

  const cand = await api(partner.token, "GET", `/partner/candidates/${enc(student.userId)}`);
  check("수락 후 파트너가 후보 상세 열람 가능(비풀이어도)", cand.status === 200 && Boolean(cand.json?.item), `status ${cand.status}`);
  check("수락 후 연락처 공개", cand.json?.item?.contactUnlocked === true && Boolean(cand.json?.item?.contact?.email), `unlocked=${cand.json?.item?.contactUnlocked}`);

  // ─────────────────────────────────────────────────────────────
  console.log("\n[D] 면접 슬롯 제안 → 학생 선택 → 파트너 통보");
  await api(student.token, "POST", `/members/me/positions/${enc(P)}/apply`); // 재지원(A 에서 취소했음)
  const detD = await api(partner.token, "GET", `/partner/applicants/${enc(applicantId)}`);
  const appId: string | undefined = detD.json?.item?.applicationId;
  check("지원 건 applicationId 확보", Boolean(appId), "no applicationId");
  if (appId) {
    // 미래 시각의 30분 슬롯 2개(:00/:30 그리드).
    const d1 = new Date(Date.now() + 3 * 86400000);
    d1.setHours(10, 0, 0, 0);
    const d2 = new Date(d1.getTime() + 86400000);
    const slots = [
      { startsAt: d1.toISOString(), endsAt: new Date(d1.getTime() + 30 * 60000).toISOString(), location: "본사 3층" },
      { startsAt: d2.toISOString(), endsAt: new Date(d2.getTime() + 30 * 60000).toISOString(), location: "온라인" }
    ];
    const propose = await api(partner.token, "POST", `/applications/${enc(appId)}/interview-slots`, { slots });
    check("파트너 면접 슬롯 제안", propose.status < 300 && propose.json?.ok !== false, `status ${propose.status}`);

    const slotList = await api(student.token, "GET", `/applications/${enc(appId)}/interview-slots`);
    const slotItems = slotList.json?.items ?? [];
    const proposedSlots = slotItems.filter((s: any) => s.status === "PROPOSED");
    check("학생이 제안 슬롯 조회", proposedSlots.length >= 2, `proposed=${proposedSlots.length}`);
    const slotId = proposedSlots[0]?.id;
    if (slotId) {
      const sel = await api(student.token, "PATCH", `/interview-slots/${enc(slotId)}/select`);
      check("학생 슬롯 선택 성공", sel.status < 300 && sel.json?.ok !== false, `status ${sel.status}`);
    }
    const pnotifs = await api(partner.token, "GET", "/members/me/notifications");
    check("파트너에게 슬롯 선택 알림", (pnotifs.json?.items ?? []).some((n: any) => n.type === "INTERVIEW_SLOT_SELECTED"), "no INTERVIEW_SLOT_SELECTED");
  }

  // ─────────────────────────────────────────────────────────────
  console.log("\n[E] 메시지 양방향 (회사↔지원자)");
  if (appId) {
    const pmsg = await api(partner.token, "POST", `/applications/${enc(appId)}/comments`, { content: "면접 안내드려요", visibility: "CANDIDATE" });
    check("파트너 메시지 전송", pmsg.status < 300 && pmsg.json?.ok !== false, `status ${pmsg.status}`);

    const scomments = await api(student.token, "GET", `/applications/${enc(appId)}/comments`);
    check("학생이 회사 메시지 수신", (scomments.json?.items ?? []).some((c: any) => c.content === "면접 안내드려요"), "message not visible to student");

    const sreply = await api(student.token, "POST", `/applications/${enc(appId)}/comments`, { content: "네 감사합니다" });
    check("학생 답장 전송", sreply.status < 300 && sreply.json?.ok !== false, `status ${sreply.status}`);

    const pending = await api(partner.token, "GET", "/partner/pending-messages");
    check("파트너 미답장 목록에 노출", (pending.json?.items ?? []).some((m: any) => m.applicationId === appId), "not in pending");

    const preply = await api(partner.token, "POST", `/applications/${enc(appId)}/comments`, { content: "확인했습니다", visibility: "CANDIDATE" });
    check("파트너 답장 전송", preply.status < 300 && preply.json?.ok !== false, `status ${preply.status}`);

    const pending2 = await api(partner.token, "GET", "/partner/pending-messages");
    check("답장 후 미답장 목록에서 제거", !(pending2.json?.items ?? []).some((m: any) => m.applicationId === appId), "still pending");
  }
  await api(student.token, "DELETE", `/members/me/positions/${enc(P)}/apply`); // 정리

  // ─────────────────────────────────────────────────────────────
  console.log("\n[C] 인재풀 등록 → 파트너 인재 검색");
  const optin = await api(student.token, "POST", "/members/me/talent-pool", { optIn: true });
  check("학생 인재풀 등록 토글", optin.status < 300 && optin.json?.ok !== false, `status ${optin.status}`);
  const candidates = await api(partner.token, "GET", "/partner/candidates");
  check("파트너 인재 검색 응답 정상", candidates.status === 200 && Array.isArray(candidates.json?.items), `status ${candidates.status}`);
  check("인재풀에서 후보가 검색됨", (candidates.json?.items ?? []).length > 0, `total=${candidates.json?.total}`);
  const inPool = (candidates.json?.items ?? []).some((c: any) => c.candidateUserId === student.userId);
  console.log(`  · 학생이 검색 결과에 ${inPool ? "노출됨" : "미노출(완성도/자소서 필터 — 정상 동작일 수 있음)"}`);

  // ─────────────────────────────────────────────────────────────
  console.log("\n[F] 철회(/withdraw) 후 재지원 — appliedPositionIds 정합");
  await api(student.token, "DELETE", `/members/me/positions/${enc(P)}/apply`);
  await api(student.token, "POST", `/members/me/positions/${enc(P)}/apply`);
  const detF = await api(partner.token, "GET", `/partner/applicants/${enc(applicantId)}`);
  const appIdF: string | undefined = detF.json?.item?.applicationId;
  const appliedBefore = await api(student.token, "GET", "/members/me/positions/applied");
  check("지원 후 applied 목록에 포함", (appliedBefore.json?.items ?? []).some((p: any) => p.id === P), "not in applied list");
  if (appIdF) {
    const wd = await api(student.token, "POST", `/members/me/applications/${enc(appIdF)}/withdraw`);
    check("본인 철회 성공", wd.status < 300 && wd.json?.ok !== false, `status ${wd.status}`);
    const appliedAfter = await api(student.token, "GET", "/members/me/positions/applied");
    check("철회 후 applied 목록에서 제거(재지원 가능)", !(appliedAfter.json?.items ?? []).some((p: any) => p.id === P), "still in applied list — re-apply blocked");
    const reapply = await api(student.token, "POST", `/members/me/positions/${enc(P)}/apply`);
    check("재지원 성공", reapply.status < 300 && reapply.json?.ok !== false, `status ${reapply.status}`);
  }
  await api(student.token, "DELETE", `/members/me/positions/${enc(P)}/apply`); // 정리

  // ─────────────────────────────────────────────────────────────
  console.log("\n[G] 권한/네거티브 — 가드가 제대로 막는가");
  const FAKE = "00000000-0000-0000-0000-000000000000";
  const g1 = await api(student.token, "GET", "/partner/applicants");
  check("학생은 파트너 지원자 목록 접근 불가", g1.status === 403, `status ${g1.status}`);
  const g2 = await api(student.token, "PATCH", `/partner/applicants/${enc(applicantId)}`, { status: "INTERVIEW" });
  check("학생은 파트너 상태 변경 불가", g2.status === 403, `status ${g2.status}`);
  const g3 = await api(partner.token, "POST", `/partner/positions/${enc(P)}/mock-interview-candidates/${enc(FAKE)}/propose`, { message: "x" });
  check("모의면접 미참여자에게 제안 불가", g3.status === 400, `status ${g3.status}`);
  const g4 = await api(partner.token, "GET", `/partner/candidates/${enc(FAKE)}`);
  check("비풀·미연결 임의 후보 상세 접근 불가", g4.status === 404, `status ${g4.status}`);
  const g5 = await api("", "GET", "/partner/applicants");
  check("토큰 없이는 접근 불가", g5.status === 401, `status ${g5.status}`);
  const g6 = await api(partner.token, "PATCH", `/partner/applicants/${enc(`${FAKE}:${FAKE}`)}`, { status: "INTERVIEW" });
  check("다른 조직/없는 지원자 변경 불가", g6.status === 404 || g6.status === 400, `status ${g6.status}`);

  // ─────────────────────────────────────────────────────────────
  console.log("\n[H] 감사 회귀 — 내부 메모 미유출 + 철회 가드");
  {
    const SECRET = `INTERNAL-SECRET-${Date.now().toString(36)}`;
    await api(student.token, "POST", `/members/me/positions/${enc(P)}/apply`);
    const lh = await api(partner.token, "GET", "/partner/applicants");
    const aidH = (lh.json?.items ?? []).find((x: any) => x.positionId === P)?.id;
    check("[H] 지원자 확보", !!aidH, "no applicant");
    if (aidH) {
      // 내부 메모 저장 후, 메모 없이 상태만 변경(기존 내부 메모가 승계되던 케이스).
      await api(partner.token, "PATCH", `/partner/applicants/${enc(aidH)}`, { memo: SECRET });
      await api(partner.token, "PATCH", `/partner/applicants/${enc(aidH)}`, { status: "INTERVIEW" });
      const nh = await api(student.token, "GET", "/members/me/notifications");
      const leakNotif = (nh.json?.items ?? []).some((x: any) => `${x.title ?? ""} ${x.message ?? ""}`.includes(SECRET));
      check("[H] 내부 메모가 지원자 알림에 유출 안 됨", !leakNotif);
      const appsH = await api(student.token, "GET", "/members/me/applications");
      const appH = (appsH.json?.items ?? []).find((x: any) => x.positionId === P);
      if (appH?.id) {
        const cmh = await api(student.token, "GET", `/applications/${enc(appH.id)}/comments`);
        const leakMsg = (cmh.json?.items ?? []).some((x: any) => `${x.content ?? ""}`.includes(SECRET));
        check("[H] 내부 메모가 지원자 메시지에 유출 안 됨", !leakMsg);
      }
      // 철회 가드
      await api(student.token, "DELETE", `/members/me/positions/${enc(P)}/apply`);
      const gh1 = await api(partner.token, "PATCH", `/partner/applicants/${enc(aidH)}`, { status: "INTERVIEW" });
      check("[H] 철회된 지원 상태변경 차단(409)", gh1.status === 409, `status ${gh1.status}`);
      const gh2 = await api(partner.token, "PATCH", `/partner/applicants/${enc(aidH)}`, { status: "WITHDRAWN" });
      check("[H] 파트너 WITHDRAWN 설정 차단(403)", gh2.status === 403, `status ${gh2.status}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  console.log(`\n결과: ${pass} PASS / ${fail} FAIL`);
  if (fail > 0) {
    console.log("실패 항목:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("스모크 실행 오류:", e);
  process.exit(1);
});

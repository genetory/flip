"use client";

// 학생 일괄 등록(학교 제휴 등) — 학생 목록(CSV)과 이력서 PDF 를 올리면 학생별 계정을 만들고 이력서를 AI 로 읽어
// 대표 이력서로 넣는다 → 기업 인재 검색에 나온다(학생 로그인은 하지 않음).
// 노션: 표 ••• → 내보내기(Markdown & CSV, 파일 포함) → zip 압축을 푼 폴더를 [폴더 고르기]로 통째로 고르면 CSV·PDF 를 알아서 찾는다.
// 개인정보는 브라우저에서 바로 서버로만 보낸다(다른 곳에 저장하지 않음).
// 원본 이력서 파일도 함께 보관 — 운영팀만 본다(기업 화면에는 내보내지 않음: 원본엔 연락처가 있다).
import { useEffect, useMemo, useState } from "react";

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? "");
  try {
    return window.localStorage.getItem("platform_access_token") || "";
  } catch {
    return "";
  }
}

/** 따옴표·줄바꿈을 지원하는 작은 CSV 파서(노션 내보내기 형식). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

const base = (p: string) => {
  const s = decodeURIComponent(p.replace(/\+/g, " ")).split(/[\\/]/).pop() ?? p;
  return s.replace(/\s*\(https?:[^)]*\)\s*$/, "").trim().toLowerCase();
};
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

type Row = { key: string; name: string; email: string; major: string; file: File | null; fileLabel: string };
type Result = { status: "created" | "exists" | "error"; message?: string; items?: number; userId?: string };
type Listed = { userId: string; name: string; email: string | null; affiliation: string | null; nationality?: string | null; batch: string; resumeItems: number; targetRole?: string | null; claimed?: boolean; inPool?: boolean; files: { id: string; fileName: string; size: number }[]; createdAt: string };
type Batch = { batch: string; count: number; withResume?: number; withFiles?: number; claimed?: number; inPool?: number; affiliations?: string[]; firstAt?: string; lastAt?: string };

const box: React.CSSProperties = { border: "1px solid var(--line)", borderRadius: 12, background: "var(--surface)", padding: 16 };
const input: React.CSSProperties = { height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", padding: "0 12px", width: "100%" };
const label: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5, fontWeight: 700, color: "var(--ink-faint)" };
const btn: React.CSSProperties = { height: 40, borderRadius: 10, background: "var(--accent)", color: "#fff", fontWeight: 700, padding: "0 16px", border: "none", cursor: "pointer" };
const ghost: React.CSSProperties = { height: 32, borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontWeight: 700, padding: "0 10px", cursor: "pointer" };
const cell: React.CSSProperties = { padding: "9px 12px", borderBottom: "1px solid var(--line)", fontSize: 13, color: "var(--ink)" };

export default function OpsBulkStudentsPage() {
  const api = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const auth = () => ({ Authorization: `Bearer ${readCookie("ops_admin_token")}` });
  const [batch, setBatch] = useState("");
  const [affiliation, setAffiliation] = useState("한양대학교 ERICA");
  const [files, setFiles] = useState<File[]>([]);
  const [csvRows, setCsvRows] = useState<string[][] | null>(null);
  const [map, setMap] = useState({ name: -1, email: -1, major: -1, file: -1 });
  const [results, setResults] = useState<Record<string, Result>>({});
  const [running, setRunning] = useState(false);
  const [listed, setListed] = useState<Listed[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [tab, setTab] = useState<"groups" | "register">("groups");

  // 폴더(또는 여러 파일)를 고르면 — CSV 는 표로, PDF 는 이력서 후보로
  const pick = async (list: FileList | null) => {
    if (!list) return;
    const all = Array.from(list);
    const pdfs = all.filter((f) => /\.pdf$/i.test(f.name));
    setFiles(pdfs);
    setResults({});
    const csv = all.find((f) => /\.csv$/i.test(f.name) && !/_all\.csv$/i.test(f.name)) ?? all.find((f) => /\.csv$/i.test(f.name));
    if (csv) {
      const rows = parseCsv(await csv.text());
      setCsvRows(rows);
      const head = (rows[0] ?? []).map((h) => norm(h));
      const find = (re: RegExp) => head.findIndex((h) => re.test(h));
      // 파일 칸 — 값에 .pdf 가 들어 있는 첫 칸
      const fileCol = (rows[0] ?? []).findIndex((_, i) => rows.slice(1).some((r) => /\.pdf/i.test(r[i] ?? "")));
      setMap({ name: find(/^(이름|성명|name|학생|학생명|fullname)/), email: find(/(이메일|메일|email|e-mail)/), major: find(/(전공|학과|major|department)/), file: fileCol });
    } else {
      setCsvRows(null);
      setMap({ name: -1, email: -1, major: -1, file: -1 });
    }
  };

  // 등록할 줄 — CSV 가 있으면 줄마다(파일은 파일 칸·이름으로 맞춤), 없으면 PDF 한 개 = 학생 한 명(이름은 이력서에서)
  const rows: Row[] = useMemo(() => {
    const byBase = new Map(files.map((f) => [f.name.toLowerCase(), f]));
    if (!csvRows) return files.map((f, i) => ({ key: `f${i}`, name: "", email: "", major: "", file: f, fileLabel: f.name }));
    return csvRows.slice(1).map((r, i) => {
      const name = map.name >= 0 ? (r[map.name] ?? "").trim() : "";
      const rawFile = map.file >= 0 ? (r[map.file] ?? "") : "";
      // 한 칸에 파일이 여러 개면 첫 PDF
      const firstPdf = rawFile.split(/,(?=[^,]*\.pdf)/i).map((x) => x.trim()).find((x) => /\.pdf/i.test(x)) ?? "";
      let file = firstPdf ? byBase.get(base(firstPdf)) ?? null : null;
      if (!file && name) file = files.find((f) => norm(f.name).includes(norm(name))) ?? null;
      return { key: `r${i}`, name, email: map.email >= 0 ? (r[map.email] ?? "").trim() : "", major: map.major >= 0 ? (r[map.major] ?? "").trim() : "", file, fileLabel: file?.name ?? (firstPdf ? base(firstPdf) : "") };
    });
  }, [csvRows, files, map]);

  const toBase64 = (f: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(f);
    });

  const run = async () => {
    if (!batch.trim()) return window.alert("묶음 이름을 적어 주세요(예: 한양대 ERICA 2026 인턴십).");
    if (!rows.length) return;
    if (!window.confirm(`${rows.length}명을 등록할까요? 이력서는 AI 가 읽어서 넣어요(한 명에 10~20초).`)) return;
    setRunning(true);
    for (const r of rows) {
      if (results[r.key]?.status === "created") continue;
      try {
        const body: Record<string, unknown> = { batch: batch.trim(), affiliation: affiliation.trim() || undefined, name: r.name || undefined, email: /@/.test(r.email) ? r.email : undefined, major: r.major || undefined, fileName: r.file?.name };
        if (r.file) {
          if (r.file.size > 12 * 1024 * 1024) throw new Error("파일이 12MB 를 넘어요");
          body.pdfBase64 = await toBase64(r.file);
        }
        const res = await fetch(`${api}/ops/bulk-students`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const d = (await res.json().catch(() => null)) as { ok?: boolean; status?: "created" | "exists"; message?: string; itemCount?: number; parseError?: string | null; userId?: string } | null;
        if (!res.ok || !d?.ok) throw new Error(d?.message || `HTTP ${res.status}`);
        // 원본 파일 보관(운영팀만) — 새로 만든 학생만
        if (d.status === "created" && d.userId && r.file && body.pdfBase64) {
          await fetch(`${api}/ops/bulk-students/${encodeURIComponent(d.userId)}/files`, { method: "POST", headers: { ...auth(), "Content-Type": "application/json" }, body: JSON.stringify({ fileName: r.file.name, base64: body.pdfBase64 }) }).catch(() => {});
        }
        setResults((p) => ({ ...p, [r.key]: { status: d.status ?? "created", message: d.parseError || d.message, items: d.itemCount, userId: d.userId } }));
      } catch (e) {
        setResults((p) => ({ ...p, [r.key]: { status: "error", message: e instanceof Error ? e.message : "실패" } }));
      }
    }
    setRunning(false);
    void loadList();
  };

  const loadList = async () => {
    try {
      const res = await fetch(`${api}/ops/bulk-students`, { headers: auth() });
      const d = (await res.json().catch(() => null)) as { ok?: boolean; items?: Listed[]; batches?: Batch[] } | null;
      if (d?.ok) {
        setListed(d.items ?? []);
        setBatches(d.batches ?? []);
      }
    } catch {
      /* 무시 */
    }
  };
  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 원본 열기 — 운영자 인증이 필요해 주소를 바로 열지 않고 받아서 연다
  const openFile = async (f: { id: string; fileName: string }) => {
    const res = await fetch(`${api}/ops/bulk-students/files/${encodeURIComponent(f.id)}`, { headers: auth() });
    if (!res.ok) return window.alert("파일을 열지 못했어요.");
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement("a");
    a.href = url;
    if (/\.pdf$/i.test(f.fileName)) a.target = "_blank";
    else a.download = f.fileName;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const remove = async (u: Listed) => {
    if (!window.confirm(`${u.name} 학생을 지울까요? 계정과 이력서가 함께 지워져요.`)) return;
    const res = await fetch(`${api}/ops/bulk-students/${encodeURIComponent(u.userId)}`, { method: "DELETE", headers: auth() });
    if (res.ok) setListed((p) => p.filter((x) => x.userId !== u.userId));
    else window.alert("지우지 못했어요.");
  };

  const head = csvRows?.[0] ?? [];
  const colSelect = (k: keyof typeof map, title: string) => (
    <label style={label}>
      {title}
      <select style={input} value={map[k]} onChange={(e) => setMap((m) => ({ ...m, [k]: Number(e.target.value) }))}>
        <option value={-1}>(없음)</option>
        {head.map((h, i) => (
          <option key={i} value={i}>
            {h || `칸 ${i + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
  const done = Object.values(results);

  return (
    <div className="ops-page">
      <header className="ops-page-head">
        <h1 className="ops-page-title">학생 일괄 등록</h1>
        <p className="ops-page-desc">학교 제휴 학생 목록과 이력서를 올리면 학생별 계정을 만들고 이력서를 AI 로 읽어 넣어요. 등록한 학생은 기업 인재 검색에 나와요(학생 로그인은 하지 않아요).</p>
      </header>

      <div className="ops-filter-chip-row" style={{ marginTop: 12 }}>
        <button type="button" className={`ops-filter-chip ${tab === "groups" ? "is-active" : ""}`} onClick={() => setTab("groups")}>
          묶음별로 보기 <span className="ops-filter-chip-count">{batches.length}</span>
        </button>
        <button type="button" className={`ops-filter-chip ${tab === "register" ? "is-active" : ""}`} onClick={() => setTab("register")}>
          새로 등록
        </button>
      </div>

      {tab === "groups" ? <BatchGroups listed={listed} batches={batches} onReload={() => void loadList()} onOpenFile={(f) => void openFile(f)} onRemove={(u) => void remove(u)} /> : null}

      {tab === "register" ? (
      <>

      <section style={{ ...box, marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          <label style={label}>
            묶음 이름
            <input style={input} value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="예: 한양대 ERICA 2026 인턴십" />
          </label>
          <label style={label}>
            소속(학교)
            <input style={input} value={affiliation} onChange={(e) => setAffiliation(e.target.value)} />
          </label>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14, alignItems: "center" }}>
          <label style={{ ...ghost, height: 40, display: "inline-flex", alignItems: "center" }}>
            폴더 고르기(노션 내보내기 압축 푼 폴더)
            {/* @ts-expect-error webkitdirectory 는 표준 타입에 없다 */}
            <input type="file" webkitdirectory="" multiple hidden onChange={(e) => void pick(e.target.files)} />
          </label>
          <label style={{ ...ghost, height: 40, display: "inline-flex", alignItems: "center" }}>
            파일 고르기(CSV·PDF 여러 개)
            <input type="file" multiple accept=".csv,.pdf" hidden onChange={(e) => void pick(e.target.files)} />
          </label>
          <span style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>
            {csvRows ? `표 ${Math.max(0, csvRows.length - 1)}줄 · ` : "표 없음(PDF 한 개 = 학생 한 명) · "}
            PDF {files.length}개
          </span>
        </div>
        {csvRows ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginTop: 14 }}>
            {colSelect("name", "이름 칸")}
            {colSelect("email", "이메일 칸(선택)")}
            {colSelect("major", "전공 칸(선택)")}
            {colSelect("file", "이력서 파일 칸")}
          </div>
        ) : null}
      </section>

      {rows.length ? (
        <section style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
            <b style={{ fontSize: 14, color: "var(--ink)" }}>
              등록할 학생 {rows.length}명 · 이력서 맞춤 {rows.filter((r) => r.file).length}개
              {done.length ? ` · 완료 ${done.filter((x) => x.status === "created").length} · 이미 있음 ${done.filter((x) => x.status === "exists").length} · 실패 ${done.filter((x) => x.status === "error").length}` : ""}
            </b>
            <button type="button" style={btn} disabled={running} onClick={() => void run()}>
              {running ? "등록 중…" : "등록하기"}
            </button>
          </div>
          <div style={{ overflowX: "auto", ...box, padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--ink-faint)" }}>
                  {["이름", "이메일", "전공", "이력서 파일", "결과"].map((h) => (
                    <th key={h} style={{ ...cell, fontWeight: 700 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const res = results[r.key];
                  return (
                    <tr key={r.key}>
                      <td style={cell}>{r.name || <span style={{ color: "var(--ink-faint)" }}>(이력서에서)</span>}</td>
                      <td style={cell}>{r.email || "-"}</td>
                      <td style={cell}>{r.major || "-"}</td>
                      <td style={{ ...cell, color: r.file ? "var(--ink)" : "var(--danger)" }}>{r.file ? r.file.name : r.fileLabel ? `못 찾음: ${r.fileLabel}` : "없음"}</td>
                      <td style={{ ...cell, fontWeight: 700, color: !res ? "var(--ink-faint)" : res.status === "created" ? "var(--accent-ink)" : res.status === "exists" ? "var(--ink-faint)" : "var(--danger)" }}>
                        {!res ? "대기" : res.status === "created" ? `등록됨${typeof res.items === "number" ? ` · 이력서 항목 ${res.items}개` : ""}` : res.status === "exists" ? "이미 있음" : "실패"}
                        {res?.message ? <div style={{ fontSize: 11.5, fontWeight: 500, color: "var(--ink-faint)" }}>{res.message}</div> : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <p style={{ marginTop: 16, fontSize: 12, color: "var(--ink-faint)" }}>노션: 표 오른쪽 위 ••• → 내보내기 → Markdown &amp; CSV, &apos;파일과 이미지 포함&apos; → 받은 zip 압축을 풀고 그 폴더를 [폴더 고르기]로 고르세요. PDF 만 읽을 수 있어요. 원본 파일은 운영팀만 볼 수 있어요(기업 화면에는 정리된 이력서만 나가요 — 원본엔 연락처가 있어서).</p>
      </>
      ) : null}
    </div>
  );
}

// ── 묶음별로 보기 ─────────────────────────────────────────
// 한 번에 넣은 학생(같은 '묶음 이름')을 카드로 묶어 보고, 카드를 누르면 그 묶음의 학생 명단·상태·원본을 본다.
type MemberFilter = "all" | "no_resume" | "no_file" | "claimed";

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function BatchGroups({ listed, batches, onReload, onOpenFile, onRemove }: { listed: Listed[]; batches: Batch[]; onReload: () => void; onOpenFile: (f: { id: string; fileName: string }) => void; onRemove: (u: Listed) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<MemberFilter>("all");
  const current = picked ?? batches[0]?.batch ?? null;
  const members = listed.filter((u) => u.batch === current);
  const needle = q.trim().toLowerCase();
  const shown = members.filter((u) => {
    if (filter === "no_resume" && u.resumeItems) return false;
    if (filter === "no_file" && u.files.length) return false;
    if (filter === "claimed" && !u.claimed) return false;
    if (!needle) return true;
    return [u.name, u.email ?? "", u.targetRole ?? "", u.nationality ?? ""].some((x) => x.toLowerCase().includes(needle));
  });

  const exportCsv = () => {
    if (!current) return;
    const rows = [["이름", "이메일", "소속", "국적", "희망 직무", "이력서 항목", "원본 파일", "인재 검색 노출", "직접 로그인", "등록일"]];
    for (const u of members) rows.push([u.name, u.email ?? "", u.affiliation ?? "", u.nationality ?? "", u.targetRole ?? "", String(u.resumeItems), String(u.files.length), u.inPool ? "예" : "아니오", u.claimed ? "예" : "아니오", u.createdAt.slice(0, 10)]);
    const blob = new Blob([`﻿${rows.map((r) => r.map(csvCell).join(",")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${current.replace(/[\\/:*?"<>|]/g, "_")}.csv`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  };

  if (!batches.length) {
    return <p className="ops-empty-card">아직 일괄 등록한 학생이 없어요. &apos;새로 등록&apos;에서 학교 제휴 학생을 올려 보세요.</p>;
  }
  const info = batches.find((b) => b.batch === current);
  const count = (f: MemberFilter) => members.filter((u) => (f === "no_resume" ? !u.resumeItems : f === "no_file" ? !u.files.length : f === "claimed" ? u.claimed : true)).length;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
        {batches.map((b) => {
          const on = b.batch === current;
          return (
            <button
              key={b.batch}
              type="button"
              onClick={() => {
                setPicked(b.batch);
                setFilter("all");
                setQ("");
              }}
              style={{ textAlign: "left", cursor: "pointer", borderRadius: 14, padding: 16, background: on ? "var(--accent-soft)" : "var(--surface)", border: `1px solid ${on ? "var(--accent)" : "var(--line)"}` }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: on ? "var(--accent-ink)" : "var(--ink)" }}>{b.batch || "(묶음 이름 없음)"}</p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-faint)" }}>
                {(b.affiliations ?? []).join(", ") || "소속 없음"}
                {b.lastAt ? ` · ${b.lastAt.slice(0, 10)}` : ""}
              </p>
              <p style={{ margin: "10px 0 0", fontSize: 22, fontWeight: 800, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {b.count}
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-faint)" }}>명</span>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                <span className="ops-pill ops-pill-blue">이력서 {b.withResume ?? 0}</span>
                <span className="ops-pill ops-pill-gray">원본 {b.withFiles ?? 0}</span>
                <span className="ops-pill ops-pill-green">인재 검색 {b.inPool ?? 0}</span>
                {b.claimed ? <span className="ops-pill ops-pill-violet">직접 로그인 {b.claimed}</span> : null}
              </div>
            </button>
          );
        })}
      </div>

      {current ? (
        <section style={{ marginTop: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <h2 className="ops-section-title" style={{ margin: 0, fontSize: 15 }}>{current || "(묶음 이름 없음)"}</h2>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-faint)" }}>
                {members.length}명{info?.firstAt && info.lastAt ? ` · ${info.firstAt.slice(0, 10)}${info.firstAt.slice(0, 10) !== info.lastAt.slice(0, 10) ? ` ~ ${info.lastAt.slice(0, 10)}` : ""} 등록` : ""}
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="ops-btn" style={{ height: 36, padding: "0 14px" }} onClick={onReload}>
                새로고침
              </button>
              <button type="button" className="ops-btn ops-btn-primary" style={{ height: 36, padding: "0 14px" }} onClick={exportCsv}>
                명단 CSV 받기
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", margin: "12px 0" }}>
            <div className="ops-filter-chip-row">
              {(
                [
                  ["all", "전체"],
                  ["no_resume", "이력서 비어 있음"],
                  ["no_file", "원본 없음"],
                  ["claimed", "직접 로그인"]
                ] as [MemberFilter, string][]
              ).map(([k, l]) => (
                <button key={k} type="button" className={`ops-filter-chip ${filter === k ? "is-active" : ""}`} onClick={() => setFilter(k)}>
                  {l} <span className="ops-filter-chip-count">{count(k)}</span>
                </button>
              ))}
            </div>
            <input className="ops-select" style={{ maxWidth: 280 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·이메일·희망 직무·국적" />
          </div>

          <div className="ops-table-card">
            <table>
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col />
                <col style={{ width: 150 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 150 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>이메일</th>
                  <th>희망 직무</th>
                  <th>상태</th>
                  <th>원본</th>
                  <th style={{ textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {!shown.length ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: 28 }}>조건에 맞는 학생이 없어요.</td>
                  </tr>
                ) : (
                  shown.map((u) => (
                    <tr key={u.userId}>
                      <td>
                        <div className="ops-row-strong">{u.name}</div>
                        <div className="ops-row-sub">{[u.nationality, u.affiliation].filter(Boolean).join(" · ")}</div>
                      </td>
                      <td>
                        <span className="ops-row-sub" style={{ fontSize: 12.5 }}>{u.email ?? "이메일 없음"}</span>
                      </td>
                      <td>
                        <span>{u.targetRole || "-"}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          <span className={u.resumeItems ? "ops-pill ops-pill-blue" : "ops-pill ops-pill-red"}>이력서 {u.resumeItems}항목</span>
                          {u.inPool ? <span className="ops-pill ops-pill-green">인재 검색</span> : null}
                          {u.claimed ? <span className="ops-pill ops-pill-violet">직접 로그인</span> : null}
                        </div>
                      </td>
                      <td>
                        {u.files?.length ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {u.files.map((f, i) => (
                              <button key={f.id} type="button" className="ops-btn" title={f.fileName} onClick={() => onOpenFile(f)}>
                                원본 {i + 1}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="ops-row-sub">원본 없음</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 4 }}>
                          <a className="ops-btn" href={`/partner/talent/${encodeURIComponent(u.userId)}`} target="_blank" rel="noreferrer">
                            인재 화면
                          </a>
                          <button type="button" className="ops-btn ops-btn-danger" onClick={() => onRemove(u)}>
                            지우기
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}

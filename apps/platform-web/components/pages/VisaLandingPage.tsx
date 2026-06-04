"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";

const EDUCATION = [
  { code: "HIGH_SCHOOL", label: "고졸" },
  { code: "BACHELOR", label: "학사" },
  { code: "MASTER", label: "석사" },
  { code: "PHD", label: "박사" }
] as const;

const KOREAN_LEVELS = [
  { code: "NONE", label: "전혀 못함" },
  { code: "BEGINNER", label: "초급 (인사·자기소개)" },
  { code: "INTERMEDIATE", label: "중급 (업무 대화)" },
  { code: "ADVANCED", label: "고급 (전문 업무)" },
  { code: "NATIVE", label: "원어민 수준" }
] as const;

const MAJOR_CATEGORIES = [
  { code: "IT", label: "IT·컴퓨터" },
  { code: "ENGINEERING", label: "공학" },
  { code: "BUSINESS", label: "경영·경제" },
  { code: "DESIGN", label: "디자인·예술" },
  { code: "HUMANITIES", label: "인문·어학" },
  { code: "SCIENCE", label: "자연과학" },
  { code: "OTHER", label: "기타" }
] as const;

const NATIONALITIES = [
  { code: "VN", label: "베트남" },
  { code: "CN", label: "중국" },
  { code: "ID", label: "인도네시아" },
  { code: "MM", label: "미얀마" },
  { code: "TH", label: "태국" },
  { code: "PH", label: "필리핀" },
  { code: "IN", label: "인도" },
  { code: "JP", label: "일본" },
  { code: "MN", label: "몽골" },
  { code: "UZ", label: "우즈베키스탄" },
  { code: "KH", label: "캄보디아" },
  { code: "NP", label: "네팔" },
  { code: "BD", label: "방글라데시" },
  { code: "PK", label: "파키스탄" },
  { code: "OTHER", label: "기타 (직접 입력)" }
] as const;

export function VisaLandingPage() {
  const router = useRouter();
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);

  const [name, setName] = useState("");
  const [nationality, setNationality] = useState("");
  const [nationalityOther, setNationalityOther] = useState("");
  const [currentVisa, setCurrentVisa] = useState("");
  const [educationLevel, setEducationLevel] = useState<string>("BACHELOR");
  const [majorCategory, setMajorCategory] = useState<string>("");
  const [koreanLevel, setKoreanLevel] = useState<string>("INTERMEDIATE");
  const [workYears, setWorkYears] = useState("0");
  const [targetRole, setTargetRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const finalNat = nationality === "OTHER" ? nationalityOther.trim() : nationality;
    if (!finalNat) {
      setError("국적을 선택해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/visa/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          nationality: finalNat,
          currentVisa: currentVisa.trim() || undefined,
          educationLevel,
          majorCategory: majorCategory || undefined,
          koreanLevel,
          workYears: Number(workYears) || 0,
          targetRole: targetRole.trim() || undefined,
          locale: "ko"
        })
      });
      const payload = (await response.json()) as { ok?: boolean; shareSlug?: string; message?: string };
      if (!response.ok || !payload.ok || !payload.shareSlug) {
        throw new Error(payload.message ?? "진단에 실패했습니다.");
      }
      router.push(`/events/visa/result/${encodeURIComponent(payload.shareSlug)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "진단에 실패했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-10 md:py-14">
        <div className="mx-auto max-w-2xl space-y-8">
          <header className="space-y-3 text-center">
            <p className="inline-flex items-center rounded-full border border-border/60 bg-white px-3 py-1 text-xs font-semibold text-primary">
              Aply × 비자 체크
            </p>
            <h1 className="font-display text-3xl font-black tracking-[-0.02em] md:text-4xl">
              내가 받을 수 있는 한국 비자는?
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              국적·학력·한국어 수준만 입력하면 받을 가능성이 있는 비자와 조건을 즉시 진단해드려요.
            </p>
          </header>

          <section className="space-y-5 rounded-2xl bg-white p-5 md:p-6">
            {/* Nationality */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">국적 *</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">선택해주세요</option>
                {NATIONALITIES.map((n) => (
                  <option key={n.code} value={n.code}>{n.label}</option>
                ))}
              </select>
              {nationality === "OTHER" ? (
                <input
                  className="mt-2 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={nationalityOther}
                  onChange={(e) => setNationalityOther(e.target.value)}
                  placeholder="국적을 입력해 주세요"
                  maxLength={40}
                />
              ) : null}
            </div>

            {/* Education */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">최종 학력 *</label>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {EDUCATION.map((opt) => {
                  const active = educationLevel === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setEducationLevel(opt.code)}
                      className={`h-11 rounded-xl border text-sm font-semibold ${
                        active ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Major */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">전공 분야</label>
              <select
                value={majorCategory}
                onChange={(e) => setMajorCategory(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">선택해주세요</option>
                {MAJOR_CATEGORIES.map((m) => (
                  <option key={m.code} value={m.code}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Korean level */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground">한국어 수준 *</label>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {KOREAN_LEVELS.map((opt) => {
                  const active = koreanLevel === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setKoreanLevel(opt.code)}
                      className={`h-11 rounded-xl border text-xs font-semibold ${
                        active ? "border-primary bg-primary/5 text-primary" : "border-border/60 bg-muted/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work years */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-yrs">관련 경력 (년)</label>
              <input
                id="visa-yrs"
                type="number"
                min={0}
                max={50}
                value={workYears}
                onChange={(e) => setWorkYears(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {/* Optional fields */}
            <div className="border-t border-border/40 pt-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-name">이름 (선택)</label>
                <input
                  id="visa-name"
                  className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  placeholder="결과 카드에 표시됩니다"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-current">현재 비자 (선택)</label>
                <input
                  id="visa-current"
                  className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={currentVisa}
                  onChange={(e) => setCurrentVisa(e.target.value)}
                  maxLength={20}
                  placeholder="예: D-2, F-4"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground" htmlFor="visa-role">희망 직무 (선택)</label>
                <input
                  id="visa-role"
                  className="mt-1 h-11 w-full rounded-xl border-0 bg-muted/40 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  maxLength={80}
                  placeholder="예: 소프트웨어 엔지니어"
                />
              </div>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
            >
              {submitting ? "진단 중..." : "비자 진단 받기"}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              본 진단은 참고용이며 법률 자문이 아닙니다. 정확한 비자 안내는{" "}
              <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                HiKorea
              </a>
              {" "}또는 출입국·외국인청을 확인해 주세요.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

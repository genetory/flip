// 공고 상세의 서버 렌더 요약 — 크롤러가 첫 HTML 에서 읽는 유일한 본문이다.
// 상호작용(저장·지원·모의면접)은 아래 클라이언트 화면이 담당하고, 여기는 사실만 적는다.
// 시각적으로는 화면 위쪽에 간결한 요약 카드로 보인다(중복 노출을 줄이려 본문은 접어 둔다).
import Link from "next/link";
import type { PublicPosition } from "../../lib/server/positions";
import { companyNameOf, foreignerFriendly, isClosed, isExternal, positionBodyText } from "../../lib/server/positions";

const EMPLOYMENT_LABEL: Record<string, string> = {
  FULL_TIME: "정규직",
  PART_TIME: "파트타임",
  CONTRACTOR: "계약직",
  TEMPORARY: "임시직",
  INTERN: "인턴",
  OTHER: "기타"
};

function fmtDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function JobSeoSummary({ position }: { position: PublicPosition }) {
  const company = companyNameOf(position);
  const closed = isClosed(position);
  const body = positionBodyText(position);
  const posted = fmtDate(position.createdAt);
  const deadline = position.sourceDeadlineRolling ? "상시 채용" : fmtDate(position.sourceDeadlineDate);
  const visas = position.eligibleVisas ?? [];

  const facts: { label: string; value: string }[] = [
    company ? { label: "회사", value: company } : null,
    position.preferredJobRole ? { label: "직무", value: position.preferredJobRole } : null,
    position.workLocation ? { label: "근무지", value: position.workLocation } : null,
    position.employmentType ? { label: "고용형태", value: EMPLOYMENT_LABEL[position.employmentType] ?? position.employmentType } : null,
    posted ? { label: "게시일", value: posted } : null,
    deadline ? { label: "마감", value: deadline } : null
  ].filter((x): x is { label: string; value: string } => x !== null);

  return (
    <section className="mx-auto w-full max-w-[720px] px-5 pt-5" aria-label="공고 요약">
      <h1 className="text-[20px] font-black leading-snug tracking-[-0.02em] text-[#191F28]">{position.title}</h1>
      {company ? <p className="mt-1 text-[14px] font-semibold text-[#4E5968]">{company}</p> : null}

      {/* 마감 공고 — 상태를 숨기지 않고 알린 뒤 다음 행동으로 연결한다. */}
      {closed ? (
        <div className="mt-3 rounded-xl border border-[#F2D2D2] bg-[#FEF6F6] px-3.5 py-3">
          <p className="text-[13px] font-bold text-[#C0392B]">이 공고는 마감되었어요.</p>
          <Link href="/talent/jobs" className="mt-1.5 inline-block text-[13px] font-semibold text-[#0B46E8] underline">
            비슷한 공고 보기
          </Link>
        </div>
      ) : null}

      {facts.length > 0 ? (
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1.5 rounded-xl bg-[#FAFBFC] px-3.5 py-3 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label} className="flex gap-2 text-[13px] leading-relaxed">
              <dt className="shrink-0 font-semibold text-[#8B95A1]">{f.label}</dt>
              <dd className="min-w-0 text-[#333D4B]">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* 외국인 지원 가능 여부 — APLY 를 찾는 가장 큰 이유라 요약에 올린다. */}
      {visas.length > 0 ? (
        <p className="mt-2.5 text-[13px] leading-relaxed text-[#333D4B]">
          <span className="font-semibold text-[#0A9B59]">외국인 지원 가능</span>
          {visas.includes("FOREIGNER_FRIENDLY") && visas.length === 1
            ? " — 비자 요건은 회사 확인이 필요해요."
            : ` — 지원 가능 비자: ${visas.filter((v) => v !== "FOREIGNER_FRIENDLY").join(", ") || "회사 확인 필요"}`}
        </p>
      ) : null}

      {body ? (
        <details className="mt-3 rounded-xl border border-[#EEF1F5] px-3.5 py-3">
          <summary className="cursor-pointer text-[13px] font-bold text-[#4E5968]">공고 상세 내용</summary>
          <div className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[#4E5968]">{body}</div>
        </details>
      ) : null}

      {/* 공고 상세의 primary CTA 는 하나 — 마감이면 '유사 공고', 아니면 '지원 준비'. */}
      {!closed ? (
        <Link
          href={`/talent/jobs/${position.id}#apply`}
          className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white"
        >
          {isExternal(position) ? "지원 준비 시작하기" : "지원하기"}
        </Link>
      ) : null}
      {!foreignerFriendly(position) ? null : (
        <p className="mt-2 text-[11.5px] leading-relaxed text-[#8B95A1]">
          비자·체류 요건은 회사와 출입국 기준에 따라 달라질 수 있어요. APLY 는 비자 발급이나 합격을 보장하지 않습니다.
        </p>
      )}
    </section>
  );
}

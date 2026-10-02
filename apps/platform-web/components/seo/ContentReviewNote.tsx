// 콘텐츠 신뢰 표시 — 출처와 마지막 검토일, 그리고 보장하지 않는다는 고지.
// 검토일이 없으면 "미확인"으로 솔직하게 적는다(날짜를 꾸미지 않는다).
import type { VisaReview } from "../../lib/visa-review";

export function ContentReviewNote({ review, disclaimer }: { review: VisaReview | null; disclaimer: string }) {
  return (
    <aside className="mt-5 rounded-xl border border-[#EEF1F5] bg-[#FAFBFC] px-3.5 py-3 text-[12px] leading-relaxed text-[#6B7684]">
      <p>
        <span className="font-bold text-[#4E5968]">마지막 검토</span>{" "}
        {review?.lastReviewedAt ? review.lastReviewedAt : "미확인"}
        {review?.reviewedBy ? ` · ${review.reviewedBy}` : ""}
      </p>
      {review?.sources?.length ? (
        <p className="mt-1">
          <span className="font-bold text-[#4E5968]">출처</span>{" "}
          {review.sources.map((s, i) => (
            <span key={`${s.name}-${i}`}>
              {i > 0 ? ", " : ""}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                  {s.name}
                </a>
              ) : (
                s.name
              )}
            </span>
          ))}
        </p>
      ) : null}
      <p className="mt-1.5">{disclaimer}</p>
    </aside>
  );
}

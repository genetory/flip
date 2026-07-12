import { Fragment } from "react";

// AI 답변에 섞여 오는 간단한 마크다운을 렌더링한다.
// - **볼드** → <strong>
// 그 외 텍스트·줄바꿈은 그대로(버블에 whitespace-pre-wrap 적용됨).
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\*\*[^*\n]+\*\*$/.test(p) ? (
          <strong key={i} className="font-bold">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  );
}

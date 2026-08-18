import { Fragment } from "react";

// AI 답변에 섞여 오는 간단한 마크다운을 렌더링한다.
// - **볼드** → <strong>
// 그 외 텍스트·줄바꿈은 그대로(버블에 whitespace-pre-wrap 적용됨).
//
// sectioned=true: 최종 피드백처럼 '한 줄 전체가 **제목**'인 라인을 섹션 타이틀로 보고
//   더 큰 폰트의 블록 헤딩으로 렌더한다(가독성). 그 외 줄은 본문(줄 단위 블록).
export function RichText({ text, sectioned = false }: { text: string; sectioned?: boolean }) {
  if (sectioned) {
    const lines = text.split("\n");
    return (
      <>
        {lines.map((line, i) => {
          const heading = line.trim().match(/^\*\*(.+)\*\*$/);
          if (heading) {
            return (
              <span key={i} className="mt-6 mb-2 block text-[17px] font-black leading-snug tracking-[-0.01em] text-[#0B1227] first:mt-0 md:text-[18px]">
                {heading[1]}
              </span>
            );
          }
          if (line.trim() === "") return <span key={i} className="block h-2.5" aria-hidden />;
          return (
            <span key={i} className="mt-1 block">
              <InlineBold text={line} />
            </span>
          );
        })}
      </>
    );
  }
  return <InlineBold text={text} />;
}

// 문장 중간의 **볼드**만 처리하는 인라인 렌더.
function InlineBold({ text }: { text: string }) {
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

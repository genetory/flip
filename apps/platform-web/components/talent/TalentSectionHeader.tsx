// Talent 랜딩 섹션 공통 헤더 — eyebrow(선택) + 큰 타이틀 + 설명(선택).
// 폰트는 앱 기본 폰트로 통일. \n 은 줄바꿈으로 렌더.

export function TalentSectionHeader({
  eyebrow,
  title,
  description,
  align = "center"
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col ${alignCls}`}>
      {eyebrow ? <p className="mb-2 text-[13px] font-bold text-[#0B46E8]">{eyebrow}</p> : null}
      <h2 className="text-[23px] font-black leading-[1.25] tracking-[-0.03em] text-[#0B1227] md:text-[32px]">
        {renderLines(title)}
      </h2>
      {description ? (
        <p className={`mt-4 whitespace-pre-line break-keep text-[15px] leading-[1.6] text-[#4E5968] md:text-[16px] ${align === "center" ? "max-w-2xl" : ""}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}

function renderLines(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i} className="block">
      {line}
    </span>
  ));
}

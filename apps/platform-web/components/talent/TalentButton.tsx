import Link from "next/link";
import type { ReactNode } from "react";

// Talent 전용 버튼. href 가 있으면 Link, 없으면 button 으로 렌더.
// variant: primary(브랜드 블루) · secondary(테두리) · soft(옅은 블루) · lime(완료·다음 단계)
// 접근성: aria-label 전달, focus-visible 링, hover/active 상태 포함.

type Variant = "primary" | "secondary" | "soft" | "lime";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B46E8]/40 focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-[#0B46E8] text-white hover:bg-[#0A3ECB] active:bg-[#093AB8]",
  secondary: "border border-[#D7DCE3] bg-white text-[#4E5968] hover:border-[#0B46E8]/40 hover:text-[#0B46E8] active:bg-[#F6F8FB]",
  soft: "bg-[#EDF1FD] text-[#0B46E8] hover:bg-[#DDE7FC] active:bg-[#CFDCFB]",
  lime: "bg-[#B7FF5A] text-[#111111] hover:bg-[#A8EE4D] active:bg-[#9BE23F]"
};

const sizes: Record<Size, string> = {
  md: "h-10 px-4 text-[14px]",
  lg: "h-[44px] px-6 text-[15px]"
};

type CommonProps = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
  "aria-label"?: string;
  fullWidth?: boolean;
};

type Props =
  | (CommonProps & { href: string; external?: boolean; onClick?: never; type?: never; disabled?: never })
  | (CommonProps & { href?: undefined; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean });

export function TalentButton(props: Props) {
  const { children, variant = "primary", size = "md", className = "", fullWidth } = props;
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`.trim();

  if (props.href) {
    return (
      <Link
        href={props.href}
        aria-label={props["aria-label"]}
        className={cls}
        {...(props.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </Link>
    );
  }
  return (
    <button type={props.type ?? "button"} onClick={props.onClick} disabled={props.disabled} aria-label={props["aria-label"]} className={cls}>
      {children}
    </button>
  );
}

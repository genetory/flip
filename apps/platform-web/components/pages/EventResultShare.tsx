"use client";

// 이벤트(직무 MBTI·사주) 결과 공유 블록 — QR 코드로 공유하거나, 브랜드 결과 카드
// 이미지를 만들어 공유(모바일 Web Share)·저장(데스크톱 다운로드)한다.
// i18n 은 페이지마다 훅이 달라, 이미 번역된 문자열을 props 로 받는다.
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export interface EventResultShareLabels {
  heading: string; // 예: "결과 공유하기"
  scanHint: string; // 예: "QR을 스캔하면 이 결과를 볼 수 있어요"
  saveImage: string; // 예: "이미지로 공유·저장"
  working: string; // 예: "이미지 만드는 중…"
  cardTagline: string; // 카드 상단 태그라인(브랜드). 예: "글로벌 인재의 한국 취업"
  cardFooter: string; // 카드 하단. 예: "스캔해서 내 결과 보기"
}

export function EventResultShare({
  url,
  cardTitle,
  cardSubtitle,
  fileName = "aply-result.png",
  accent = "#F5C451",
  labels
}: {
  url: string;
  cardTitle: string; // 카드 큰 제목(예: MBTI 타입, 이름)
  cardSubtitle?: string; // 카드 부제(예: 문화 요약)
  fileName?: string;
  accent?: string;
  labels: EventResultShareLabels;
}) {
  const [qr, setQr] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const qrImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: 480, margin: 1, errorCorrectionLevel: "M", color: { dark: "#0B1227", light: "#ffffff" } })
      .then((d) => {
        if (!cancelled) setQr(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function shareImage() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await buildShareCard({ qrDataUrl: qr, title: cardTitle, subtitle: cardSubtitle ?? "", accent, labels });
      if (!blob) return;
      const file = new File([blob], fileName, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (typeof navigator.share === "function" && nav.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: cardTitle });
          return;
        } catch {
          /* 사용자가 취소 → 다운로드로 폴백하지 않고 조용히 종료 */
          return;
        }
      }
      // 데스크톱 등 파일 공유 미지원 → 다운로드.
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white/[0.05] p-5">
      <p className="text-center text-[13px] font-semibold text-white/80">{labels.heading}</p>
      <div className="mt-3 flex flex-col items-center gap-3">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img ref={qrImgRef} src={qr} alt="QR" width={140} height={140} className="h-[140px] w-[140px] rounded-xl bg-white p-2" />
        ) : (
          <div className="h-[140px] w-[140px] animate-pulse rounded-xl bg-white/10" />
        )}
        <p className="text-center text-[12px] leading-relaxed text-white/45">{labels.scanHint}</p>
        <button
          type="button"
          onClick={shareImage}
          disabled={busy || !qr}
          className="mt-1 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-[#0B1227] transition disabled:opacity-50"
          style={{ background: accent }}
        >
          {busy ? labels.working : `🖼️ ${labels.saveImage}`}
        </button>
      </div>
    </section>
  );
}

// 결과 카드 이미지(PNG) 생성 — 다크 그라디언트 배경 + 제목/부제 + QR + 브랜드.
async function buildShareCard({
  qrDataUrl,
  title,
  subtitle,
  accent,
  labels
}: {
  qrDataUrl: string;
  title: string;
  subtitle: string;
  accent: string;
  labels: EventResultShareLabels;
}): Promise<Blob | null> {
  const W = 720;
  const H = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // 배경 그라디언트
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0B1227");
  bg.addColorStop(1, "#161f3f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const font = (size: number, weight = "700") => `${weight} ${size}px -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", system-ui, sans-serif`;

  // 상단 브랜드
  ctx.textAlign = "center";
  ctx.fillStyle = accent;
  ctx.font = font(30, "800");
  ctx.fillText("Aply", cx, 90);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = font(17, "500");
  ctx.fillText(labels.cardTagline, cx, 124);

  // 제목(자동 축소로 한 줄에 맞춤)
  ctx.fillStyle = "#ffffff";
  let titleSize = 76;
  ctx.font = font(titleSize, "800");
  while (ctx.measureText(title).width > W - 120 && titleSize > 34) {
    titleSize -= 4;
    ctx.font = font(titleSize, "800");
  }
  ctx.fillText(title, cx, 300);

  // 부제(줄바꿈)
  if (subtitle) {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = font(22, "500");
    wrapText(ctx, subtitle, cx, 360, W - 140, 34, 4);
  }

  // QR 흰색 카드
  const qrBox = 300;
  const qrX = cx - qrBox / 2;
  const qrY = 560;
  roundRect(ctx, qrX - 24, qrY - 24, qrBox + 48, qrBox + 48, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  if (qrDataUrl) {
    const img = await loadImage(qrDataUrl);
    if (img) ctx.drawImage(img, qrX, qrY, qrBox, qrBox);
  }

  // 하단 안내 + 도메인
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = font(20, "600");
  ctx.fillText(labels.cardFooter, cx, qrY + qrBox + 80);
  ctx.fillStyle = accent;
  ctx.font = font(22, "800");
  ctx.fillText("aply.global", cx, qrY + qrBox + 116);

  return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  lines.slice(0, maxLines).forEach((ln, i) => ctx.fillText(ln, cx, y + i * lineHeight));
}

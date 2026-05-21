"use client";

import { useEffect, useRef, useState } from "react";

// iOS-style wheel picker rendered as a bottom sheet. Used for the saju
// landing form so date / time entry feels native on every device — the
// raw <input type="date"> picker differs a lot between browsers (Chrome
// shows a dropdown calendar, Safari iOS shows a wheel sheet, Firefox
// shows a text input). Building our own keeps the UX consistent.

const ITEM_HEIGHT = 40;
const VISIBLE_COUNT = 5;
const PAD_BLOCK = ((VISIBLE_COUNT - 1) / 2) * ITEM_HEIGHT;

type WheelColumnProps = {
  items: number[];
  value: number;
  onChange: (next: number) => void;
  format?: (n: number) => string;
};

function WheelColumn({ items, value, onChange, format }: WheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Recenter when the external value changes (e.g. after parent clamps a
  // day to the valid month range).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "auto" });
  }, [items, value]);

  function handleScroll() {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const raw = Math.round(el.scrollTop / ITEM_HEIGHT);
      const idx = Math.max(0, Math.min(items.length - 1, raw));
      const next = items[idx];
      // Snap exactly to the selected row in case browser snap left us a
      // pixel or two off — keeps the highlight band aligned.
      if (Math.abs(el.scrollTop - idx * ITEM_HEIGHT) > 0.5) {
        el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: "smooth" });
      }
      if (next !== value) onChange(next);
    }, 90);
  }

  return (
    <div className="relative flex-1 overflow-hidden" style={{ height: ITEM_HEIGHT * VISIBLE_COUNT }}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingTop: PAD_BLOCK, scrollPaddingBottom: PAD_BLOCK }}
      >
        <div style={{ height: PAD_BLOCK }} aria-hidden />
        {items.map((item) => {
          const selected = item === value;
          return (
            <div
              key={item}
              className={`flex snap-center items-center justify-center text-[17px] tabular-nums transition ${
                selected ? "font-semibold text-white" : "text-white/40"
              }`}
              style={{ height: ITEM_HEIGHT }}
            >
              {format ? format(item) : item}
            </div>
          );
        })}
        <div style={{ height: PAD_BLOCK }} aria-hidden />
      </div>
      {/* Highlight band: positioned at the visible center row */}
      <div
        className="pointer-events-none absolute inset-x-0 border-y border-white/10 bg-white/[0.06]"
        style={{ top: PAD_BLOCK, height: ITEM_HEIGHT }}
        aria-hidden
      />
    </div>
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** ko/en/zh-CN/vi/ja/id — only affects suffix labels (년/월/일 vs Y/M/D). */
  locale: string;
} & (
  | {
      mode: "date";
      value: string;
      onConfirm: (next: string) => void;
      minYear?: number;
      maxYear?: number;
    }
  | {
      mode: "time";
      value: string;
      onConfirm: (next: string) => void;
    }
);

const SUFFIX: Record<string, { y: string; m: string; d: string; h: string; min: string }> = {
  ko: { y: "년", m: "월", d: "일", h: "시", min: "분" },
  en: { y: "", m: "", d: "", h: "", min: "" },
  "zh-CN": { y: "年", m: "月", d: "日", h: "时", min: "分" },
  vi: { y: "", m: "", d: "", h: "", min: "" },
  ja: { y: "年", m: "月", d: "日", h: "時", min: "分" },
  id: { y: "", m: "", d: "", h: "", min: "" }
};

const LABELS: Record<string, { confirm: string; cancel: string }> = {
  ko: { confirm: "확인", cancel: "취소" },
  en: { confirm: "Done", cancel: "Cancel" },
  "zh-CN": { confirm: "确定", cancel: "取消" },
  vi: { confirm: "Xong", cancel: "Hủy" },
  ja: { confirm: "完了", cancel: "キャンセル" },
  id: { confirm: "Selesai", cancel: "Batal" }
};

export function SajuWheelPicker(props: Props) {
  const labels = LABELS[props.locale] ?? LABELS.en;
  const sfx = SUFFIX[props.locale] ?? SUFFIX.en;

  // Date-mode draft state
  const initialYear = props.mode === "date" ? Number(props.value?.slice(0, 4)) || 2000 : 0;
  const initialMonth = props.mode === "date" ? Number(props.value?.slice(5, 7)) || 1 : 0;
  const initialDay = props.mode === "date" ? Number(props.value?.slice(8, 10)) || 1 : 0;
  const [dY, setDY] = useState<number>(initialYear);
  const [dM, setDM] = useState<number>(initialMonth);
  const [dD, setDD] = useState<number>(initialDay);

  // Time-mode draft state
  const initialHour = props.mode === "time" ? Number(props.value?.slice(0, 2)) || 0 : 0;
  const initialMinute = props.mode === "time" ? Number(props.value?.slice(3, 5)) || 0 : 0;
  const [tH, setTH] = useState<number>(initialHour);
  const [tMin, setTMin] = useState<number>(initialMinute);

  // Reset draft state whenever the sheet opens so we always start from the
  // currently-committed value, not whatever the wheels last left behind.
  useEffect(() => {
    if (!props.open) return;
    if (props.mode === "date") {
      setDY(Number(props.value?.slice(0, 4)) || 2000);
      setDM(Number(props.value?.slice(5, 7)) || 1);
      setDD(Number(props.value?.slice(8, 10)) || 1);
    } else {
      setTH(Number(props.value?.slice(0, 2)) || 0);
      setTMin(Number(props.value?.slice(3, 5)) || 0);
    }
  }, [props.open, props.mode, props.value]);

  // Clamp day to the chosen month/year (e.g. picking Feb 30 → 28).
  useEffect(() => {
    if (props.mode !== "date") return;
    const max = daysInMonth(dY, dM);
    if (dD > max) setDD(max);
  }, [props.mode, dY, dM, dD]);

  function commit() {
    if (props.mode === "date") {
      const yyyy = String(dY).padStart(4, "0");
      const mm = String(dM).padStart(2, "0");
      const dd = String(dD).padStart(2, "0");
      props.onConfirm(`${yyyy}-${mm}-${dd}`);
    } else {
      const hh = String(tH).padStart(2, "0");
      const mm = String(tMin).padStart(2, "0");
      props.onConfirm(`${hh}:${mm}`);
    }
    props.onClose();
  }

  if (!props.open) return null;

  const sheetContent =
    props.mode === "date" ? (
      <div className="flex w-full items-stretch">
        <WheelColumn
          items={rangeArray(props.minYear ?? 1920, props.maxYear ?? new Date().getFullYear())}
          value={dY}
          onChange={setDY}
          format={(n) => `${n}${sfx.y}`}
        />
        <WheelColumn
          items={rangeArray(1, 12)}
          value={dM}
          onChange={setDM}
          format={(n) => `${n}${sfx.m}`}
        />
        <WheelColumn
          items={rangeArray(1, daysInMonth(dY, dM))}
          value={dD}
          onChange={setDD}
          format={(n) => `${n}${sfx.d}`}
        />
      </div>
    ) : (
      <div className="flex w-full items-stretch">
        <WheelColumn
          items={rangeArray(0, 23)}
          value={tH}
          onChange={setTH}
          format={(n) => `${String(n).padStart(2, "0")}${sfx.h}`}
        />
        <WheelColumn
          items={rangeArray(0, 59)}
          value={tMin}
          onChange={setTMin}
          format={(n) => `${String(n).padStart(2, "0")}${sfx.min}`}
        />
      </div>
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal>
      <button
        type="button"
        aria-label={labels.cancel}
        onClick={props.onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative mx-auto w-full max-w-[480px] animate-[slideUp_240ms_ease-out] rounded-t-3xl bg-[#1a1340] pb-[max(env(safe-area-inset-bottom),16px)] shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={props.onClose}
            className="text-[14px] text-white/60 active:text-white"
          >
            {labels.cancel}
          </button>
          <span className="text-[14px] font-medium text-white">{props.title}</span>
          <button
            type="button"
            onClick={commit}
            className="text-[14px] font-semibold text-yellow-200 active:text-yellow-300"
          >
            {labels.confirm}
          </button>
        </div>
        <div className="px-3">{sheetContent}</div>
      </div>
      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function rangeArray(from: number, to: number): number[] {
  const arr: number[] = [];
  for (let i = from; i <= to; i++) arr.push(i);
  return arr;
}

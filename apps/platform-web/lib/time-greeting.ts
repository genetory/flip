import { useEffect, useState } from "react";

// 시간대별 인삿말.
export function timeGreetingFor(hour: number): string {
  if (hour < 6) return "편안한 밤 되세요";
  if (hour < 11) return "좋은 아침이에요";
  if (hour < 17) return "좋은 오후예요";
  if (hour < 21) return "좋은 저녁이에요";
  return "늦은 시간까지 고생 많아요";
}

// 마운트 후 클라이언트 시간으로 계산 — SSR/CSR 하이드레이션 불일치 방지(초기값은 중립 인사).
export function useTimeGreeting(): string {
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => {
    setHour(new Date().getHours());
  }, []);
  return hour == null ? "안녕하세요" : timeGreetingFor(hour);
}

// 개발용 Talent persona(상태) 저장소.
// localStorage 에 저장하고, ?persona= 쿼리로도 덮어쓸 수 있게 한다.
// 실제 서비스에서는 로그인 사용자 데이터로 대체되며, 이 스위처는 개발에서만 노출한다.
import { defaultPersona } from "./mock/personas";
import type { TalentPersonaId } from "./types";

const STORAGE_KEY = "talent_dev_persona";
const VALID: TalentPersonaId[] = ["new", "experiences", "resume", "applying", "interview"];

function isValid(v: string | null): v is TalentPersonaId {
  return !!v && (VALID as string[]).includes(v);
}

export function readPersona(): TalentPersonaId {
  if (typeof window === "undefined") return defaultPersona;
  try {
    const fromQuery = new URLSearchParams(window.location.search).get("persona");
    if (isValid(fromQuery)) {
      window.localStorage.setItem(STORAGE_KEY, fromQuery);
      return fromQuery;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isValid(stored)) return stored;
  } catch {
    // localStorage 접근 불가 시 기본값
  }
  return defaultPersona;
}

export function writePersona(id: TalentPersonaId): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}

// 개발 스위처 노출 여부(프로덕션에서는 숨김).
export const showPersonaSwitcher = process.env.NODE_ENV !== "production";

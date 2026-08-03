// 기본 인적 정보 — 이력서·자기소개서에 쓰이는 실명·이메일·연락처·주소·프로필 사진.
// 이력서/자기소개서 생성의 선행 조건. 지금은 localStorage 기반(mock), 추후 서버 저장으로 교체.
import { useSyncExternalStore } from "react";

export interface BasicInfo {
  realName: string;
  email: string;
  phone: string;
  address: string;
  photoUrl: string; // data URL (선택)
}

export const EMPTY_BASIC_INFO: BasicInfo = {
  realName: "",
  email: "",
  phone: "",
  address: "",
  photoUrl: ""
};

// 등록 완료에 필요한 필수 항목.
export const basicInfoFields: { key: keyof BasicInfo; label: string; optional?: boolean }[] = [
  { key: "realName", label: "실명" },
  { key: "email", label: "이메일" },
  { key: "phone", label: "연락처" },
  { key: "address", label: "주소" }
];

const KEY = "talent.basicInfo.v1";

const listeners = new Set<() => void>();
let cache: BasicInfo | null = null;

function read(): BasicInfo {
  if (cache) return cache;
  if (typeof window === "undefined") return EMPTY_BASIC_INFO;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY_BASIC_INFO, ...(JSON.parse(raw) as Partial<BasicInfo>) } : EMPTY_BASIC_INFO;
  } catch {
    cache = EMPTY_BASIC_INFO;
  }
  return cache;
}

function emit() {
  cache = null;
  listeners.forEach((l) => l());
}

export function saveBasicInfo(info: BasicInfo): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(info));
  } catch {
    /* mock: 저장 실패 무시 */
  }
  emit();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useBasicInfo(): BasicInfo {
  return useSyncExternalStore(subscribe, read, () => EMPTY_BASIC_INFO);
}

// 필수 항목이 모두 채워졌는지(= 프로필 등록 완료).
export function isBasicInfoComplete(info: BasicInfo): boolean {
  return basicInfoFields.filter((f) => !f.optional).every((f) => Boolean(info[f.key] && info[f.key].trim()));
}

export interface BasicInfoCheckItem {
  key: string;
  label: string;
  done: boolean;
  optional: boolean;
}

export function basicInfoChecklist(info: BasicInfo): BasicInfoCheckItem[] {
  return basicInfoFields.map((f) => ({
    key: f.key,
    label: f.label,
    done: Boolean(info[f.key] && info[f.key].trim()),
    optional: Boolean(f.optional)
  }));
}

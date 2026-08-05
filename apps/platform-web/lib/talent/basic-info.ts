// 기본 인적 정보 — 이력서·자기소개서에 쓰이는 실명·이메일·연락처·주소·프로필 사진.
// 저장은 localStorage 가 아니라 로그인 계정(서버 Resume.content.renewalBasicInfo)에 귀속된다.
import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "../../components/auth/AuthSessionProvider";
import { setBasicInfo as storeSetBasicInfo, snapshotBasicInfo, subscribeDocs, syncUser } from "./renewal-docs-store";

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

// 저장 — 계정(서버)에 반영. 실제 쓰기는 공유 스토어가 debounce 처리한다.
export function saveBasicInfo(info: BasicInfo): void {
  storeSetBasicInfo(info);
}

// 계정 귀속 — 로그인한 유저의 서버 기본 정보를 구독한다. 계정이 바뀌면 자동으로
// 캐시를 비우고 새 계정의 정보를 로드한다.
export function useBasicInfo(): BasicInfo {
  const { user } = useAuthSession();
  const userId = user?.id ?? null;
  useEffect(() => {
    syncUser(userId);
  }, [userId]);
  const info = useSyncExternalStore(subscribeDocs, snapshotBasicInfo, () => null);
  return info ?? EMPTY_BASIC_INFO;
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

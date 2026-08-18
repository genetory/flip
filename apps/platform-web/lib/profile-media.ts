const PROFILE_PHOTO_KEY_PREFIX = "platform_profile_photo:";

// 계정(서비스) 프로필 사진이 바뀌면 브로드캐스트 — GNB·기본정보 등이 즉시 갱신하도록.
export const PROFILE_PHOTO_CHANGED_EVENT = "aply:profile-photo-changed";

function getKey(userId: string) {
  return `${PROFILE_PHOTO_KEY_PREFIX}${userId}`;
}

export function getStoredProfilePhoto(userId: string) {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(getKey(userId));
  return v && v.length > 0 ? v : null;
}

export function setStoredProfilePhoto(userId: string, dataUrl: string) {
  if (typeof window === "undefined") return;
  if (dataUrl) window.localStorage.setItem(getKey(userId), dataUrl);
  else window.localStorage.removeItem(getKey(userId));
  window.dispatchEvent(new Event(PROFILE_PHOTO_CHANGED_EVENT));
}

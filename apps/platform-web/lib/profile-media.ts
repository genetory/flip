const PROFILE_PHOTO_KEY_PREFIX = "platform_profile_photo:";

function getKey(userId: string) {
  return `${PROFILE_PHOTO_KEY_PREFIX}${userId}`;
}

export function getStoredProfilePhoto(userId: string) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getKey(userId));
}

export function setStoredProfilePhoto(userId: string, dataUrl: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getKey(userId), dataUrl);
}

/**
 * Firebase Auth 없이 익명 장치 ID로 사용자를 식별합니다.
 * 추후 Firebase Auth로 교체 시 이 파일만 수정하면 됩니다.
 */

/** 장치 고유 ID를 localStorage에서 읽거나 새로 생성합니다 */
export function getAnonymousDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('anonymousUserId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('anonymousUserId', id);
  }
  return id;
}

/**
 * 앱 내 사용자 ID(user-1, user-2)와 장치 ID를 조합하여
 * Firestore 경로에 사용할 userId를 반환합니다.
 *
 * 예: "abc123_user-1"
 */
export function getFirestoreUserId(appUserId: string): string {
  const deviceId = getAnonymousDeviceId();
  return `${deviceId}_${appUserId}`;
}

/** Firebase Auth 도입 시 이 함수 내부만 교체하세요 */
export function getCurrentUserId(): string {
  return getAnonymousDeviceId();
}

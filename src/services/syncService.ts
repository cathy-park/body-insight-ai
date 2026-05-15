import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 8자리 고유 동기화 핀코드를 Firestore에 등록합니다.
 * (생성 후 1시간 동안만 유효하도록 설정하는 것을 권장합니다.)
 */
export async function generateSyncCode(deviceId: string): Promise<string> {
  if (!db) throw new Error('파이어베이스가 연결되어 있지 않습니다.');

  // 8자리 랜덤 숫자 생성 (10000000 ~ 99999999)
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  
  const syncDocRef = doc(db, 'syncCodes', code);
  await setDoc(syncDocRef, {
    deviceId,
    createdAt: serverTimestamp(),
  });

  return code;
}

/**
 * 입력받은 동기화 코드를 Firestore에서 대조하여 매핑된 deviceId를 가져옵니다.
 */
export async function resolveSyncCode(code: string): Promise<string | null> {
  if (!db) throw new Error('파이어베이스가 연결되어 있지 않습니다.');

  // 공백 및 하이픈 제거하여 대조
  const normalizedCode = code.replace(/[-\s]+/g, '');
  if (normalizedCode.length !== 8) {
    throw new Error('동기화 코드는 정확히 8자리 숫자여야 합니다.');
  }

  const syncDocRef = doc(db, 'syncCodes', normalizedCode);
  const snap = await getDoc(syncDocRef);

  if (!snap.exists()) {
    return null;
  }

  const data = snap.data();
  // 만약 유효 시간(예: 24시간) 검증이 필요하다면 여기서 data.createdAt을 비교할 수 있습니다.
  return data.deviceId as string;
}

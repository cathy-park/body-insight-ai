"use client";

import { useEffect, useState } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';

/**
 * 앱 마운트 시 현재 사용자의 Firestore 기록을 읽어와 로컬 스토어에 병합합니다.
 * Firebase 환경변수가 없으면 조용히 스킵합니다.
 */
export function FirestoreSync() {
  const { currentUserId, importRecordsFromFirestore, userRecords } = useHealthStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        // Firebase 미설정 시 동적 import 단계에서 자연스럽게 스킵됨
        const [{ isFirebaseEnabled }, { getFirestoreUserId }, { getBodyRecords }] = await Promise.all([
          import('@/lib/firebase'),
          import('@/services/userService'),
          import('@/services/healthRecordService'),
        ]);

        if (!isFirebaseEnabled || cancelled) return;

        const fsUserId = getFirestoreUserId(currentUserId);
        const fsRecords = await getBodyRecords(fsUserId);
        if (cancelled || fsRecords.length === 0) return;

        const localDates = new Set(
          (userRecords[currentUserId] || []).map(r => r.date)
        );
        const newCount = fsRecords.filter(r => !localDates.has(r.date)).length;

        if (newCount > 0) {
          importRecordsFromFirestore(fsRecords);
          setToast({ message: `Firestore에서 ${newCount}건의 기록을 복원했습니다.`, type: 'success' });
        }
      } catch (err) {
        // Firebase 연결 실패는 무시 (로컬스토리지로 정상 동작)
        console.warn('[FirestoreSync] 건너뜀:', err);
      }
    }

    sync();
    return () => { cancelled = true; };
  }, [currentUserId]);

  return toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;
}

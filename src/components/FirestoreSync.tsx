"use client";

import { useEffect, useState, useRef } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';

/**
 * Firestore의 사용자 데이터를 실시간 구독하여, 타 기기에서의 추가/수정/삭제를 즉시 동기화합니다.
 */
export function FirestoreSync() {
  const { currentUserId, importRecordsFromFirestore, importDocsFromFirestore } = useHealthStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    let unsubscribeRecords: (() => void) | null = null;
    let unsubscribeDocs: (() => void) | null = null;
    let active = true;

    async function startSync() {
      try {
        const [
          { isFirebaseEnabled },
          { getFirestoreUserId },
          { subscribeToBodyRecords, subscribeToWarehouseDocs, bulkUpsertWarehouseDocs },
        ] = await Promise.all([
          import('@/lib/firebase'),
          import('@/services/userService'),
          import('@/services/healthRecordService'),
        ]);

        if (!isFirebaseEnabled || !active) return;

        const fsUserId = getFirestoreUserId(currentUserId);

        // 인바디 기록 실시간 구독
        unsubscribeRecords = subscribeToBodyRecords(fsUserId, (records) => {
          if (!active) return;
          importRecordsFromFirestore(records);

          if (isFirstLoadRef.current && records.length > 0) {
            isFirstLoadRef.current = false;
            setToast({ message: `서버와 연결되었습니다. 건강 기록 실시간 동기화 중 ⚡`, type: 'success' });
          }
        });

        // 건강자료실 문서 실시간 구독 (마이그레이션 포함)
        const localDocs = useHealthStore.getState().userDocs[currentUserId] || [];

        unsubscribeDocs = subscribeToWarehouseDocs(fsUserId, async (snapshotDocs) => {
          if (!active) return;

          // 마이그레이션: Firestore가 비어있고 로컬에 문서가 있으면 업로드 후 대기
          if (snapshotDocs.length === 0 && localDocs.length > 0) {
            try {
              await bulkUpsertWarehouseDocs(fsUserId, localDocs);
            } catch (err) {
              console.error('[FirestoreSync] 자료 마이그레이션 실패:', err);
            }
            // 업로드 후 onSnapshot이 다시 발화하여 importDocsFromFirestore가 호출됨
            return;
          }

          importDocsFromFirestore(snapshotDocs);
        });

      } catch (err) {
        console.warn('[FirestoreSync] 실시간 동기화 구동 건너뜀:', err);
      }
    }

    isFirstLoadRef.current = true;
    startSync();

    return () => {
      active = false;
      unsubscribeRecords?.();
      unsubscribeDocs?.();
    };
  }, [currentUserId, importRecordsFromFirestore, importDocsFromFirestore]);

  return toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;
}

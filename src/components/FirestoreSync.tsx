"use client";

import { useEffect, useState, useRef } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';

/**
 * Firestore의 사용자 데이터를 실시간 구독하여, 타 기기에서의 추가/수정/삭제를 즉시 동기화합니다.
 */
export function FirestoreSync() {
  const { currentUserId, importRecordsFromFirestore } = useHealthStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // 컴포넌트 마운트 당 1회만 최초 알림 토스트를 띄우기 위한 ref
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let active = true;

    async function startSync() {
      try {
        const [{ isFirebaseEnabled }, { getFirestoreUserId }, { subscribeToBodyRecords }] = await Promise.all([
          import('@/lib/firebase'),
          import('@/services/userService'),
          import('@/services/healthRecordService'),
        ]);

        if (!isFirebaseEnabled || !active) return;

        const fsUserId = getFirestoreUserId(currentUserId);

        // 🔥 Firestore 실시간 컬렉션 리스너 구동 (Web Socket 기반 스트리밍)
        unsubscribe = subscribeToBodyRecords(fsUserId, (records) => {
          if (!active) return;

          // Zustand 스토어 1:1 완벽 동기화 (추가, 수정, 삭제 모두 완벽 대응)
          importRecordsFromFirestore(records);

          // 최초에 데이터를 가져왔을 때만 성공 안내 토스트 띄우기
          if (isFirstLoadRef.current && records.length > 0) {
            isFirstLoadRef.current = false;
            setToast({ message: `서버와 연결되었습니다. 건강 기록 실시간 동기화 중 ⚡`, type: 'success' });
          }
        });

      } catch (err) {
        console.warn('[FirestoreSync] 실시간 동기화 구동 건너뜀:', err);
      }
    }

    // 동기화 시작 전 ref 리셋 (유저 ID 바뀔 때 대비)
    isFirstLoadRef.current = true;
    startSync();

    // Cleanup: 컴포넌트 언마운트 혹은 currentUserId 변경 시 이전 리스너 완전 해제!
    return () => {
      active = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUserId, importRecordsFromFirestore]);

  return toast ? (
    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
  ) : null;
}

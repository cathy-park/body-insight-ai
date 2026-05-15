"use client";

import { useEffect, useState } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { Toast } from '@/components/Toast';
import type { NewHealthRecord } from '@/types';

function isoToDate(iso: string): string {
  return iso.split('T')[0];
}

export function AutoSyncHandler() {
  const { addBulkRecords, getRecords } = useHealthStore();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 웹뷰가 마운트되면 React Native에 준비 완료 신호 전송
  useEffect(() => {
    const rn = (window as any).ReactNativeWebView;
    if (rn) {
      rn.postMessage(JSON.stringify({ type: 'WEBVIEW_READY' }));
    }
  }, []);

  // AUTO_HEALTH_SYNC 메시지 수신 → 날짜별 그룹핑 → 신규 날짜만 저장
  useEffect(() => {
    const handleAutoSync = (event: any) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.type !== 'AUTO_HEALTH_SYNC') return;

        const weights:  any[] = data.payload?.weight  ?? [];
        const bodyFats: any[] = data.payload?.bodyFat ?? [];
        const sleeps:   any[] = data.payload?.sleep   ?? [];

        // 날짜별 최신값 집계
        const byDate: Record<string, { weight?: number; bodyFat?: number; sleepHours?: number }> = {};

        weights.forEach((r: any) => {
          const date = isoToDate(r.time ?? r.startTime ?? '');
          if (!date) return;
          if (!byDate[date]) byDate[date] = {};
          if (r.weight?.inKilograms) byDate[date].weight = r.weight.inKilograms;
        });

        bodyFats.forEach((r: any) => {
          const date = isoToDate(r.time ?? '');
          if (!date) return;
          if (!byDate[date]) byDate[date] = {};
          if (r.percentage) byDate[date].bodyFat = r.percentage;
        });

        sleeps.forEach((r: any) => {
          if (!r.startTime || !r.endTime) return;
          const date = isoToDate(r.endTime);
          if (!date) return;
          if (!byDate[date]) byDate[date] = {};
          const hours = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 3_600_000;
          if (!byDate[date].sleepHours) byDate[date].sleepHours = parseFloat(hours.toFixed(1));
        });

        // 이미 기록이 있는 날짜는 건너뜀 (수동 기록 우선 보호)
        const existingDates = new Set(getRecords().map((r: any) => r.date));

        const newRecords: NewHealthRecord[] = Object.entries(byDate)
          .filter(([date, d]) => !existingDates.has(date) && !!d.weight)
          .map(([date, d]) => ({
            date,
            weight:                     parseFloat((d.weight!).toFixed(1)),
            skeletal_muscle:            0,
            body_fat:                   d.bodyFat ? parseFloat(d.bodyFat.toFixed(1)) : 0,
            body_fat_mass:              0,
            visceral_fat_level:         0,
            abdominal_fat_ratio:        0,
            waist_circumference_belly:  0,
            waist_circumference_beauty: 0,
            sleep_hours:                d.sleepHours ?? 0,
            alcohol_flag:               false,
            bowel_condition:            'normal' as const,
            period_flag:                false,
            mounjaro_flag:              false,
            mounjaro_dose:              0,
            memo:                       '삼성 헬스 자동 연동',
          }));

        if (newRecords.length > 0) {
          addBulkRecords(newRecords);
          setToast({ message: `삼성 헬스 ${newRecords.length}일치 데이터를 자동으로 불러왔습니다.`, type: 'success' });
        }
      } catch { /* ignored */ }
    };

    window.addEventListener('message', handleAutoSync);
    document.addEventListener('message', handleAutoSync as any);
    return () => {
      window.removeEventListener('message', handleAutoSync);
      document.removeEventListener('message', handleAutoSync as any);
    };
  }, [addBulkRecords, getRecords]);

  return toast ? <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} /> : null;
}

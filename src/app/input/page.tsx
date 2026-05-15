"use client";

import React, { useState, useEffect } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { useRouter } from 'next/navigation';
import { NewHealthRecord } from '@/types';
import { Save, Activity } from 'lucide-react';
import { format } from 'date-fns';

export default function InputPage() {
  const addRecord = useHealthStore((state) => state.addRecord);
  const router = useRouter();

  const [formData, setFormData] = useState<NewHealthRecord>({
    date: format(new Date(), 'yyyy-MM-dd'),
    weight: 0,
    skeletal_muscle: 0,
    body_fat: 0,
    body_fat_mass: 0,
    visceral_fat_level: 0,
    abdominal_fat_ratio: 0,
    waist_circumference_belly: 0,
    waist_circumference_beauty: 0,
    sleep_hours: 7,
    alcohol_flag: false,
    bowel_condition: 'normal',
    period_flag: false,
    mounjaro_flag: false,
    mounjaro_dose: 0,
    memo: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: any = value;
    if (type === 'checkbox') {
      parsedValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      parsedValue = value === '' ? 0 : parseFloat(value);
    }
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  useEffect(() => {
    const handleMessage = (event: any) => {
      try {
        let data;
        if (typeof event.data === 'string') {
          data = JSON.parse(event.data);
        } else {
          data = event.data;
        }

        if (data?.type === 'HEALTH_DATA_RESULT') {
          console.log('Received Health Data:', data.payload);
          
          const latestWeight = data.payload?.weight?.[0]?.weight?.inKilograms;
          const latestBodyFat = data.payload?.bodyFat?.[0]?.percentage;
          
          let latestSleep = undefined;
          const sleepRecord = data.payload?.sleep?.[0];
          if (sleepRecord) {
             const start = new Date(sleepRecord.startTime).getTime();
             const end = new Date(sleepRecord.endTime).getTime();
             latestSleep = (end - start) / (1000 * 60 * 60);
          }

          // 생리 주기 데이터가 존재하면 활성화
          const latestPeriod = data.payload?.menstruation && data.payload.menstruation.length > 0;

          setFormData((prev) => ({
            ...prev,
            ...(latestWeight ? { weight: parseFloat(latestWeight.toFixed(1)) } : {}),
            ...(latestBodyFat ? { body_fat: parseFloat(latestBodyFat.toFixed(1)) } : {}),
            ...(latestSleep ? { sleep_hours: parseFloat(latestSleep.toFixed(1)) } : {}),
            ...(latestPeriod ? { period_flag: true } : {}),
          }));
          
          alert('건강 데이터가 성공적으로 불러와졌습니다!');
        }
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
    };
  }, []);

  const requestHealthData = () => {
    const rnWindow = window as any;
    if (rnWindow.ReactNativeWebView) {
      rnWindow.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_HEALTH_DATA' }));
    } else {
      alert('삼성 헬스/인바디 자동 연동은 모바일 앱 환경에서만 작동합니다.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || formData.weight <= 0) {
      alert("날짜와 체중은 필수 입력 항목입니다.");
      return;
    }

    const finalData = {
      ...formData,
      bmi: parseFloat((formData.weight / Math.pow(1.7, 2)).toFixed(1))
    };

    addRecord(finalData);
    alert('기록이 성공적으로 저장되었습니다.');
    router.push('/dashboard');
  };

  const inputClass = "w-full px-4 py-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] placeholder:font-normal";
  const labelClass = "block text-[11px] font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-2";

  return (
    <div className="max-w-7xl mx-auto pt-[100px] px-4 sm:px-6 pb-24">
      <header className="mb-10">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">상세 데이터 기록</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1.5">정교한 분석을 위해 모든 지표를 입력해 주세요.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 기본 체성분 */}
          <section aria-labelledby="basic-section" className="bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
            <div className="flex items-center justify-between">
              <h2 id="basic-section" className="text-xl font-bold text-[var(--text-primary)]">기본 체성분</h2>
              <button 
                type="button" 
                onClick={requestHealthData}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1428A0] text-white text-xs font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
              >
                <Activity className="w-3.5 h-3.5" />
                삼성 헬스 연동
              </button>
            </div>

            <div>
              <label htmlFor="date" className={labelClass}>날짜</label>
              <input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={inputClass}
                required
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weight" className={labelClass}>체중 (kg)</label>
                <input
                  id="weight"
                  type="number"
                  step="0.1"
                  name="weight"
                  value={formData.weight || ''}
                  onChange={handleChange}
                  className={inputClass}
                  required
                  placeholder="0.0"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label htmlFor="skeletal_muscle" className={labelClass}>골격근량 (kg)</label>
                <input
                  id="skeletal_muscle"
                  type="number"
                  step="0.1"
                  name="skeletal_muscle"
                  value={formData.skeletal_muscle || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0.0"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="body_fat" className={labelClass}>체지방률 (%)</label>
                <input
                  id="body_fat"
                  type="number"
                  step="0.1"
                  name="body_fat"
                  value={formData.body_fat || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0.0"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label htmlFor="visceral_fat_level" className={labelClass}>내장지방 (LV)</label>
                <input
                  id="visceral_fat_level"
                  type="number"
                  name="visceral_fat_level"
                  value={formData.visceral_fat_level || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0"
                  inputMode="numeric"
                />
              </div>
            </div>
          </section>

          {/* 상세 지표 */}
          <section aria-labelledby="detail-section" className="bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
            <h2 id="detail-section" className="text-xl font-bold text-[var(--text-primary)]">상세 지표</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="waist_circumference_belly" className={labelClass}>복부 둘레 (cm)</label>
                <input
                  id="waist_circumference_belly"
                  type="number"
                  step="0.1"
                  name="waist_circumference_belly"
                  value={formData.waist_circumference_belly || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0.0"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label htmlFor="waist_circumference_beauty" className={labelClass}>미용 허리 (cm)</label>
                <input
                  id="waist_circumference_beauty"
                  type="number"
                  step="0.1"
                  name="waist_circumference_beauty"
                  value={formData.waist_circumference_beauty || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0.0"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div>
              <label htmlFor="memo" className={labelClass}>특이사항 메모</label>
              <textarea
                id="memo"
                name="memo"
                rows={5}
                value={formData.memo}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                placeholder="오늘의 건강 상태를 메모해 보세요."
              />
            </div>
          </section>

          {/* 생활 패턴 & 치료 기록 */}
          <section aria-labelledby="lifestyle-section" className="bg-[var(--surface-1)] p-8 rounded-3xl border border-[var(--border)] shadow-[var(--shadow-card)] space-y-6">
            <h2 id="lifestyle-section" className="text-xl font-bold text-[var(--text-primary)]">생활 패턴 & 치료</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sleep_hours" className={labelClass}>수면 시간 (시간)</label>
                <input
                  id="sleep_hours"
                  type="number"
                  step="0.5"
                  name="sleep_hours"
                  value={formData.sleep_hours || ''}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="7.0"
                  inputMode="decimal"
                />
              </div>
              <div>
                <label htmlFor="bowel_condition" className={labelClass}>배변 상태</label>
                <select
                  id="bowel_condition"
                  name="bowel_condition"
                  value={formData.bowel_condition}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="good">좋음 🟢</option>
                  <option value="normal">보통 🟡</option>
                  <option value="bad">나쁨 🔴</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border)]">
              <div className="flex items-center justify-between">
                <label htmlFor="period_flag" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer">생리 기간 활성화</label>
                <input
                  id="period_flag"
                  type="checkbox"
                  name="period_flag"
                  checked={formData.period_flag}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-md accent-[var(--accent)] cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between border-t border-[var(--border)] pt-3">
                <label htmlFor="alcohol_flag" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer">오늘 음주 여부</label>
                <input
                  id="alcohol_flag"
                  type="checkbox"
                  name="alcohol_flag"
                  checked={formData.alcohol_flag}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-md accent-[var(--accent)] cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-[var(--surface-2)] p-4 rounded-2xl border border-[var(--border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <label htmlFor="mounjaro_flag" className="text-sm font-bold text-[var(--text-primary)] cursor-pointer">마운자로 투여</label>
                  <span className="text-[10px] text-[var(--text-secondary)]">GLP-1 비만치료 주사</span>
                </div>
                <input
                  id="mounjaro_flag"
                  type="checkbox"
                  name="mounjaro_flag"
                  checked={formData.mounjaro_flag}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-md accent-[var(--accent)] cursor-pointer"
                />
              </div>

              {formData.mounjaro_flag && (
                <div className="pt-2 border-t border-[var(--border)] animate-in fade-in duration-200">
                  <label htmlFor="mounjaro_dose" className={labelClass}>투여 용량 (mg)</label>
                  <select
                    id="mounjaro_dose"
                    name="mounjaro_dose"
                    value={formData.mounjaro_dose}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-[var(--surface-1)] border border-[var(--border)] rounded-xl font-bold text-[var(--text-primary)]"
                  >
                    <option value={0}>용량 선택</option>
                    <option value={2.5}>2.5 mg</option>
                    <option value={5.0}>5.0 mg</option>
                    <option value={7.5}>7.5 mg</option>
                    <option value={10.0}>10.0 mg</option>
                    <option value={12.5}>12.5 mg</option>
                    <option value={15.0}>15.0 mg</option>
                  </select>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2.5 px-8 py-4 bg-[var(--accent)] text-white text-[15px] font-bold rounded-xl hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            <Save className="w-5 h-5" aria-hidden="true" />
            기록 저장하기
          </button>
        </div>
      </form>
    </div>
  );
}

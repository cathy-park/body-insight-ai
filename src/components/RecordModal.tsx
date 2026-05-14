"use client";

import React, { useState, useEffect } from 'react';
import { useHealthStore } from '@/store/useHealthStore';
import { NewHealthRecord } from '@/types';
import { Save, Activity, X } from 'lucide-react';
import { format } from 'date-fns';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordModal({ isOpen, onClose }: RecordModalProps) {
  const addRecord = useHealthStore((state) => state.addRecord);

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

  // Open 시 폼 데이터 초기화
  useEffect(() => {
    if (isOpen) {
      setFormData({
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
    }
  }, [isOpen]);

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

  // 모바일 브릿지 메시지 리스너 (팝업 활성화 중에만 리스닝)
  useEffect(() => {
    if (!isOpen) return;
    const handleMessage = (event: any) => {
      try {
        let data;
        if (typeof event.data === 'string') {
          data = JSON.parse(event.data);
        } else {
          data = event.data;
        }

        if (data?.type === 'HEALTH_DATA_RESULT') {
          const latestWeight = data.payload?.weight?.[0]?.weight?.inKilograms;
          const latestBodyFat = data.payload?.bodyFat?.[0]?.percentage;
          
          let latestSleep = undefined;
          const sleepRecord = data.payload?.sleep?.[0];
          if (sleepRecord) {
             const start = new Date(sleepRecord.startTime).getTime();
             const end = new Date(sleepRecord.endTime).getTime();
             latestSleep = (end - start) / (1000 * 60 * 60);
          }

          const latestPeriod = data.payload?.menstruation && data.payload.menstruation.length > 0;

          setFormData((prev) => ({
            ...prev,
            ...(latestWeight ? { weight: parseFloat(latestWeight.toFixed(1)) } : {}),
            ...(latestBodyFat ? { body_fat: parseFloat(latestBodyFat.toFixed(1)) } : {}),
            ...(latestSleep ? { sleep_hours: parseFloat(latestSleep.toFixed(1)) } : {}),
            ...(latestPeriod ? { period_flag: true } : {}),
          }));
          
          alert('삼성 헬스 건강 데이터를 성공적으로 불러왔습니다!');
        }
      } catch (err) {
        // ignored
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
    };
  }, [isOpen]);

  const requestHealthData = () => {
    const rnWindow = window as any;
    if (rnWindow.ReactNativeWebView) {
      rnWindow.ReactNativeWebView.postMessage(JSON.stringify({ type: 'REQUEST_HEALTH_DATA' }));
    } else {
      alert('삼성 헬스 자동 연동은 모바일 앱 환경에서만 작동합니다.');
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
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent outline-none transition-all font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.15em] text-[var(--accent)] mb-1.5";

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[var(--surface-1)] w-full max-w-5xl rounded-[32px] border border-[var(--border)] shadow-[var(--shadow-elevated)] overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        
        {/* 팝업 헤더 */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] shrink-0 bg-[var(--surface-2)]/50">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-tight">오늘의 건강 기록하기</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">삼성 헬스 연동 및 신체 상세 지표, 생활 습관을 한 번에 기록하세요.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="팝업 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스크롤 가능한 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6" id="modal-record-form" noValidate>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* 1. 기본 체성분 */}
              <section className="bg-[var(--surface-2)]/40 p-6 rounded-2xl border border-[var(--border-subtle)] space-y-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[15px] font-black text-[var(--text-primary)]">기본 체성분</h3>
                  <button 
                    type="button" 
                    onClick={requestHealthData}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1428A0] text-white text-[10px] font-black rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
                  >
                    <Activity className="w-3 h-3" />
                    삼성 헬스 연동
                  </button>
                </div>

                <div>
                  <label htmlFor="modal-date" className={labelClass}>기록 날짜</label>
                  <input
                    id="modal-date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-weight" className={labelClass}>체중 (kg)</label>
                    <input
                      id="modal-weight"
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
                    <label htmlFor="modal-skeletal_muscle" className={labelClass}>골격근량 (kg)</label>
                    <input
                      id="modal-skeletal_muscle"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-body_fat" className={labelClass}>체지방률 (%)</label>
                    <input
                      id="modal-body_fat"
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
                    <label htmlFor="modal-visceral_fat_level" className={labelClass}>내장지방 (LV)</label>
                    <input
                      id="modal-visceral_fat_level"
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

              {/* 2. 상세 지표 */}
              <section className="bg-[var(--surface-2)]/40 p-6 rounded-2xl border border-[var(--border-subtle)] space-y-5">
                <h3 className="text-[15px] font-black text-[var(--text-primary)] mb-1">상세 신체 치수</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-waist_circumference_belly" className={labelClass}>복부 둘레 (cm)</label>
                    <input
                      id="modal-waist_circumference_belly"
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
                    <label htmlFor="modal-waist_circumference_beauty" className={labelClass}>미용 허리 (cm)</label>
                    <input
                      id="modal-waist_circumference_beauty"
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
                  <label htmlFor="modal-memo" className={labelClass}>오늘의 특이사항 메모</label>
                  <textarea
                    id="modal-memo"
                    name="memo"
                    rows={4}
                    value={formData.memo}
                    onChange={handleChange}
                    className={`${inputClass} resize-none h-[108px] font-normal`}
                    placeholder="오늘의 특별한 기록을 남겨보세요."
                  />
                </div>
              </section>

              {/* 3. 생활 패턴 & 치료 */}
              <section className="bg-[var(--surface-2)]/40 p-6 rounded-2xl border border-[var(--border-subtle)] space-y-5">
                <h3 className="text-[15px] font-black text-[var(--text-primary)] mb-1">생활 패턴 & 치료</h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="modal-sleep_hours" className={labelClass}>수면 시간 (h)</label>
                    <input
                      id="modal-sleep_hours"
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
                    <label htmlFor="modal-bowel_condition" className={labelClass}>배변 상태</label>
                    <select
                      id="modal-bowel_condition"
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

                <div className="bg-[var(--surface-1)] p-3 rounded-xl border border-[var(--border-subtle)] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">생리 기간 활성화</span>
                    <input
                      type="checkbox"
                      name="period_flag"
                      checked={formData.period_flag}
                      onChange={handleChange}
                      className="w-4 h-4 rounded-md accent-[var(--accent)]"
                    />
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                    <span className="font-bold text-[var(--text-primary)]">오늘 음주 여부</span>
                    <input
                      type="checkbox"
                      name="alcohol_flag"
                      checked={formData.alcohol_flag}
                      onChange={handleChange}
                      className="w-4 h-4 rounded-md accent-[var(--accent)]"
                    />
                  </div>
                </div>

                <div className="bg-[var(--surface-1)] p-3 rounded-xl border border-[var(--border-subtle)] space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-bold text-[var(--text-primary)]">마운자로 투여</span>
                      <span className="text-[9px] text-[var(--text-muted)]">GLP-1 비만치료 주사</span>
                    </div>
                    <input
                      type="checkbox"
                      name="mounjaro_flag"
                      checked={formData.mounjaro_flag}
                      onChange={handleChange}
                      className="w-4 h-4 rounded-md accent-[var(--accent)]"
                    />
                  </div>

                  {formData.mounjaro_flag && (
                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      <label htmlFor="modal-mounjaro_dose" className={labelClass}>투여 용량 (mg)</label>
                      <select
                        id="modal-mounjaro_dose"
                        name="mounjaro_dose"
                        value={formData.mounjaro_dose}
                        onChange={handleChange}
                        className="w-full px-2.5 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg font-bold text-[var(--text-primary)] text-xs"
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
          </form>
        </div>

        {/* 하단 액션 바 */}
        <div className="px-6 py-4 bg-[var(--surface-2)]/50 border-t border-[var(--border)] flex items-center justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-3 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-2)] rounded-xl border border-[var(--border)] transition-all"
          >
            취소
          </button>
          <button 
            type="submit"
            form="modal-record-form"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            건강 기록 저장
          </button>
        </div>
      </div>
    </div>
  );
}
